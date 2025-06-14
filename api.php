<?php
/**
 * API para Price Extractor
 * Este archivo actúa como un proxy entre la aplicación Next.js y la base de datos de WordPress
 */

// Evitar que WordPress muestre errores o advertencias que puedan afectar a los encabezados
@ini_set('display_errors', 0);
error_reporting(0);

// Configuración CORS mejorada
$allowed_origins = [
    'http://localhost:3000',
    'http://devcalcuapp.teddyhosting.com',
    'https://teddyhosting.com',
    'https://www.teddyhosting.com',
    'https://calcuapp-git-desarrollo-teddyleonwebs-projects.vercel.app'
];

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Permitir el origen si está en la lista o usar * como comodín
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

// Resto de encabezados CORS
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400"); // 24 horas

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Incluir WordPress
require_once('wp-load.php');

// Obtener la ruta de la solicitud
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api.php';
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));

// Obtener el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Obtener los datos de la solicitud
$data = json_decode(file_get_contents('php://input'), true) ?: [];

// Obtener el token de autorización
$headers = getallheaders();
$auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (strpos($auth_header, 'Bearer ') === 0) {
    $token = substr($auth_header, 7);
}

// Función para registrar mensajes en un archivo de log
function log_to_file($message, $data = null) {
    $log_file = __DIR__ . '/api_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] {$message}";
    
    if ($data !== null) {
        $log_message .= " - Data: " . json_encode($data);
    }
    
    file_put_contents($log_file, $log_message . PHP_EOL, FILE_APPEND);
}

// Función para verificar el token y obtener el usuario
function verify_token($token) {
    if (empty($token)) {
        log_to_file("Token vacío");
        return false;
    }
    
    // Decodificar el token JWT (implementación simple)
    $parts = explode('.', $token);
    
    if (count($parts) != 3) {
        log_to_file("Token con formato incorrecto: " . count($parts) . " partes");
        return false;
    }
    
    try {
        $payload_json = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        if (!$payload_json) {
            log_to_file("Error al decodificar base64 del payload");
            return false;
        }
        
        $payload = json_decode($payload_json, true);
        
        if (!$payload) {
            log_to_file("Error al decodificar JSON del payload");
            return false;
        }
        
        if (!isset($payload['id']) || !isset($payload['email'])) {
            log_to_file("Payload incompleto", $payload);
            return false;
        }
        
        // Verificar que el usuario existe en la base de datos
        global $wpdb;
        $user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_users WHERE id = %d AND email = %s",
            $payload['id'],
            $payload['email']
        ));
        
        if (!$user) {
            log_to_file("Usuario no encontrado en la base de datos: ID=" . $payload['id'] . ", Email=" . $payload['email']);
            return false;
        }
        
        log_to_file("Token verificado correctamente para usuario: " . $user->name);
        return $payload;
    } catch (Exception $e) {
        log_to_file("Excepción al verificar token: " . $e->getMessage());
        return false;
    }
}

// Función para generar un token JWT
function generate_token($user_id, $email, $name) {
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];
    
    $payload = [
        'id' => $user_id,
        'email' => $email,
        'name' => $name,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60) // 7 días
    ];
    
    $secret = 'P2jn5QeYk3hZVroQRB+FtulFBKZ2iShd6Nbm4WEwRxm5aCljylRiTmbKjGHeBkM0IQ3cEE5nzz/1+IiT4RedVA==';
    
    $base64_header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
    $base64_payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    
    $signature = hash_hmac('sha256', $base64_header . '.' . $base64_payload, $secret, true);
    $base64_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64_header . '.' . $base64_payload . '.' . $base64_signature;
}

// Función para guardar imágenes en base64
function save_base64_image($base64_string) {
    // Verificar si es una cadena base64 válida
    if (strpos($base64_string, 'data:image/') !== 0) {
        return $base64_string; // Devolver la cadena original si no es una imagen base64
    }
    
    // Extraer el tipo de imagen y los datos
    $image_parts = explode(";base64,", $base64_string);
    $image_type_aux = explode("image/", $image_parts[0]);
    $image_type = $image_type_aux[1];
    $image_base64 = base64_decode($image_parts[1]);
    
    // Crear un nombre de archivo único
    $file_name = 'price_extractor_' . uniqid() . '.' . $image_type;
    
    // Definir la ruta de carga
    $upload_dir = wp_upload_dir();
    $upload_path = $upload_dir['path'] . '/' . $file_name;
    $upload_url = $upload_dir['url'] . '/' . $file_name;
    
    // Guardar la imagen
    file_put_contents($upload_path, $image_base64);
    
    return $upload_url;
}

// Función para obtener los datos del usuario (tiendas y productos)
function get_user_data($user_id) {
    global $wpdb;
    
    // Obtener proyectos del usuario
    $projects = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE user_id = %d ORDER BY is_default DESC, name ASC",
        $user_id
    ));
    
    $formatted_projects = [];
    foreach ($projects as $project) {
        $formatted_projects[] = [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'isDefault' => (bool) $project->is_default,
            'createdAt' => $project->created_at
        ];
    }
    
    // Obtener tiendas con sus proyectos asociados
    $stores = $wpdb->get_results($wpdb->prepare(
        "SELECT s.*, GROUP_CONCAT(ps.project_id) as project_ids 
         FROM {$wpdb->prefix}price_extractor_stores s
         LEFT JOIN {$wpdb->prefix}price_extractor_project_stores ps ON s.id = ps.store_id
         WHERE s.user_id = %d 
         GROUP BY s.id
         ORDER BY s.is_default DESC, s.name ASC",
        $user_id
    ));
    
    $formatted_stores = [];
    foreach ($stores as $store) {
        $project_ids = $store->project_ids ? explode(',', $store->project_ids) : [];
        $formatted_stores[] = [
            'id' => $store->id,
            'name' => $store->name,
            'isDefault' => (bool) $store->is_default,
            'image' => $store->image,
            'projectIds' => array_map('intval', $project_ids)
        ];
    }
    
    // Obtener productos con sus proyectos asociados
    $products = $wpdb->get_results($wpdb->prepare(
        "SELECT p.*, GROUP_CONCAT(pp.project_id) as project_ids 
         FROM {$wpdb->prefix}price_extractor_products p
         LEFT JOIN {$wpdb->prefix}price_extractor_project_products pp ON p.id = pp.product_id
         WHERE p.user_id = %d 
         GROUP BY p.id
         ORDER BY p.created_at DESC",
        $user_id
    ));
    
    $formatted_products = [];
    foreach ($products as $product) {
        $project_ids = $product->project_ids ? explode(',', $product->project_ids) : [];
        $formatted_products[] = [
            'id' => $product->id,
            'title' => $product->title,
            'price' => (float) $product->price,
            'quantity' => (int) $product->quantity,
            'image' => $product->image,
            'storeId' => $product->store_id,
            'projectIds' => array_map('intval', $project_ids),
            'createdAt' => $product->created_at
        ];
    }
    
    return [
        'projects' => $formatted_projects,
        'stores' => $formatted_stores,
        'products' => $formatted_products
    ];
}

// Función para asociar un producto con un proyecto
function associate_product_with_project($product_id, $project_id) {
    global $wpdb;
    
    // Verificar si la asociación ya existe
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}price_extractor_project_products WHERE project_id = %d AND product_id = %d",
        $project_id,
        $product_id
    ));
    
    if (!$exists) {
        $wpdb->insert(
            $wpdb->prefix . 'price_extractor_project_products',
            [
                'project_id' => $project_id,
                'product_id' => $product_id
            ],
            ['%d', '%d']
        );
    }
}

// Función para asociar una tienda con un proyecto
function associate_store_with_project($store_id, $project_id) {
    global $wpdb;
    
    // Verificar si la asociación ya existe
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}price_extractor_project_stores WHERE project_id = %d AND store_id = %d",
        $project_id,
        $store_id
    ));
    
    if (!$exists) {
        $wpdb->insert(
            $wpdb->prefix . 'price_extractor_project_stores',
            [
                'project_id' => $project_id,
                'store_id' => $store_id
            ],
            ['%d', '%d']
        );
    }
}

// Manejar las rutas de la API
switch (true) {
    // Ruta de estado
    case $path === '/status' && $method === 'GET':
        echo json_encode(['status' => 'ok', 'message' => 'API funcionando correctamente']);
        break;
        
    // Rutas de autenticación
    case $path === '/auth/register' && $method === 'POST':
        // Validar datos
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Todos los campos son requeridos']);
            exit;
        }
        
        // Verificar si el usuario ya existe
        global $wpdb;
        $existing_user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_users WHERE email = %s",
            $data['email']
        ));
        
        if ($existing_user) {
            http_response_code(400);
            echo json_encode(['error' => 'El correo electrónico ya está registrado']);
            exit;
        }
        
        // Hashear la contraseña
        $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Insertar el usuario
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_users',
            [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $hashed_password
            ],
            ['%s', '%s', '%s']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar usuario']);
            exit;
        }
        
        $user_id = $wpdb->insert_id;
        
        // Crear proyecto por defecto
        $wpdb->insert(
            $wpdb->prefix . 'price_extractor_projects',
            [
                'user_id' => $user_id,
                'name' => 'Proyecto Principal',
                'description' => 'Proyecto por defecto',
                'is_default' => 1
            ],
            ['%d', '%s', '%s', '%d']
        );
        
        $project_id = $wpdb->insert_id;
        
        // Crear tienda por defecto
        $wpdb->insert(
            $wpdb->prefix . 'price_extractor_stores',
            [
                'user_id' => $user_id,
                'name' => 'Total',
                'is_default' => 1
            ],
            ['%d', '%s', '%d']
        );
        
        $store_id = $wpdb->insert_id;
        
        // Asociar la tienda con el proyecto
        associate_store_with_project($store_id, $project_id);
        
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Usuario registrado correctamente']);
        break;
        
    case $path === '/auth/login' && $method === 'POST':
        // Validar datos
        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Correo electrónico y contraseña son requeridos']);
            exit;
        }
        
        // Buscar el usuario
        global $wpdb;
        $user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_users WHERE email = %s",
            $data['email']
        ));
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales incorrectas']);
            exit;
        }
        
        // Verificar la contraseña
        if (!password_verify($data['password'], $user->password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales incorrectas']);
            exit;
        }
        
        // Generar token JWT
        $token = generate_token($user->id, $user->email, $user->name);
        
        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ]
        ]);
        break;
        
    case $path === '/auth/user' && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener datos del usuario
        $user_data = get_user_data($user['id']);
        
        echo json_encode($user_data);
        break;
        
    // Rutas de proyectos
    case preg_match('#^/projects$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener proyectos del usuario
        global $wpdb;
        $projects = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE user_id = %d ORDER BY is_default DESC, name ASC",
            $user['id']
        ));
        
        $formatted_projects = [];
        foreach ($projects as $project) {
            $formatted_projects[] = [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'isDefault' => (bool) $project->is_default,
                'createdAt' => $project->created_at
            ];
        }
        
        echo json_encode($formatted_projects);
        break;
        
    case preg_match('#^/projects$#', $path) && $method === 'POST':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Validar datos
        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del proyecto es requerido']);
            exit;
        }
        
        // Insertar proyecto
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_projects',
            [
                'user_id' => $user['id'],
                'name' => $data['name'],
                'description' => isset($data['description']) ? $data['description'] : null,
                'is_default' => isset($data['isDefault']) ? ($data['isDefault'] ? 1 : 0) : 0
            ],
            ['%d', '%s', '%s', '%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear proyecto']);
            exit;
        }
        
        $project_id = $wpdb->insert_id;
        
        // Si es el proyecto por defecto, actualizar los demás proyectos
        if (isset($data['isDefault']) && $data['isDefault']) {
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}price_extractor_projects SET is_default = 0 WHERE user_id = %d AND id != %d",
                $user['id'],
                $project_id
            ));
        }
        
        // Obtener el proyecto creado
        $project = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d",
            $project_id
        ));
        
        http_response_code(201);
        echo json_encode([
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'isDefault' => (bool) $project->is_default,
            'createdAt' => $project->created_at
        ]);
        break;
        
    case preg_match('#^/projects/(\d+)$#', $path, $matches) && $method === 'PUT':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $project_id = $matches[1];
        
        // Verificar que el proyecto pertenece al usuario
        global $wpdb;
        $project = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d AND user_id = %d",
            $project_id,
            $user['id']
        ));
        
        if (!$project) {
            http_response_code(404);
            echo json_encode(['error' => 'Proyecto no encontrado']);
            exit;
        }
        
        // Preparar datos para actualizar
        $update_data = [];
        $update_format = [];
        
        if (isset($data['name'])) {
            $update_data['name'] = $data['name'];
            $update_format[] = '%s';
        }
        
        if (isset($data['description'])) {
            $update_data['description'] = $data['description'];
            $update_format[] = '%s';
        }
        
        if (isset($data['isDefault'])) {
            $update_data['is_default'] = $data['isDefault'] ? 1 : 0;
            $update_format[] = '%d';
        }
        
        // Actualizar proyecto
        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'price_extractor_projects',
                $update_data,
                ['id' => $project_id],
                $update_format,
                ['%d']
            );
            
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar proyecto']);
                exit;
            }
            
            // Si se establece como proyecto por defecto, actualizar los demás proyectos
            if (isset($data['isDefault']) && $data['isDefault']) {
                $wpdb->query($wpdb->prepare(
                    "UPDATE {$wpdb->prefix}price_extractor_projects SET is_default = 0 WHERE user_id = %d AND id != %d",
                    $user['id'],
                    $project_id
                ));
            }
        }
        
        // Obtener proyecto actualizado
        $updated_project = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d",
            $project_id
        ));
        
        echo json_encode([
            'id' => $updated_project->id,
            'name' => $updated_project->name,
            'description' => $updated_project->description,
            'isDefault' => (bool) $updated_project->is_default,
            'createdAt' => $updated_project->created_at
        ]);
        break;
        
    case preg_match('#^/projects/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $project_id = $matches[1];
        
        // Verificar que el proyecto pertenece al usuario
        global $wpdb;
        $project = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d AND user_id = %d",
            $project_id,
            $user['id']
        ));
        
        if (!$project) {
            http_response_code(404);
            echo json_encode(['error' => 'Proyecto no encontrado']);
            exit;
        }
        
        // No permitir eliminar el proyecto por defecto
        if ($project->is_default) {
            http_response_code(400);
            echo json_encode(['error' => 'No se puede eliminar el proyecto por defecto']);
            exit;
        }
        
        // Eliminar relaciones del proyecto
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_project_products',
            ['project_id' => $project_id],
            ['%d']
        );
        
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_project_stores',
            ['project_id' => $project_id],
            ['%d']
        );
        
        // Eliminar proyecto
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_projects',
            ['id' => $project_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar proyecto']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    // Rutas de tiendas
    case preg_match('#^/stores$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener tiendas del usuario
        global $wpdb;
        
        // Verificar si se está filtrando por proyecto
        $project_id = isset($_GET['projectId']) ? intval($_GET['projectId']) : null;
        
        if ($project_id) {
            $stores = $wpdb->get_results($wpdb->prepare(
                "SELECT s.* FROM {$wpdb->prefix}price_extractor_stores s
                 INNER JOIN {$wpdb->prefix}price_extractor_project_stores ps ON s.id = ps.store_id
                 WHERE s.user_id = %d AND ps.project_id = %d 
                 ORDER BY s.is_default DESC, s.name ASC",
                $user['id'],
                $project_id
            ));
        } else {
            $stores = $wpdb->get_results($wpdb->prepare(
                "SELECT s.*, GROUP_CONCAT(ps.project_id) as project_ids 
                 FROM {$wpdb->prefix}price_extractor_stores s
                 LEFT JOIN {$wpdb->prefix}price_extractor_project_stores ps ON s.id = ps.store_id
                 WHERE s.user_id = %d 
                 GROUP BY s.id
                 ORDER BY s.is_default DESC, s.name ASC",
                $user['id']
            ));
        }
        
        $formatted_stores = [];
        foreach ($stores as $store) {
            if ($project_id) {
                // Si estamos filtrando por proyecto, solo devolver el projectId actual
                $formatted_stores[] = [
                    'id' => $store->id,
                    'name' => $store->name,
                    'isDefault' => (bool) $store->is_default,
                    'image' => $store->image,
                    'projectId' => $project_id
                ];
            } else {
                // Si no estamos filtrando, devolver todos los projectIds
                $project_ids = isset($store->project_ids) && $store->project_ids ? explode(',', $store->project_ids) : [];
                $formatted_stores[] = [
                    'id' => $store->id,
                    'name' => $store->name,
                    'isDefault' => (bool) $store->is_default,
                    'image' => $store->image,
                    'projectIds' => array_map('intval', $project_ids)
                ];
            }
        }
        
        echo json_encode($formatted_stores);
        break;
        
    case preg_match('#^/stores$#', $path) && $method === 'POST':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Validar datos
        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de la tienda es requerido']);
            exit;
        }
        
        // Procesar imagen si existe
        $image = null;
        if (!empty($data['image'])) {
            $image = save_base64_image($data['image']);
        }
        
        // Verificar el proyecto
        $project_id = isset($data['projectId']) ? intval($data['projectId']) : null;
        
        if (!$project_id) {
            // Si no se especifica un proyecto, usar el proyecto por defecto
            global $wpdb;
            $default_project = $wpdb->get_row($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}price_extractor_projects WHERE user_id = %d AND is_default = 1",
                $user['id']
            ));
            
            if ($default_project) {
                $project_id = $default_project->id;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No se encontró un proyecto por defecto']);
                exit;
            }
        }
        
        // Insertar tienda
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_stores',
            [
                'user_id' => $user['id'],
                'name' => $data['name'],
                'image' => $image,
                'is_default' => 0
            ],
            ['%d', '%s', '%s', '%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear tienda']);
            exit;
        }
        
        $store_id = $wpdb->insert_id;
        
        // Asociar la tienda con el proyecto
        associate_store_with_project($store_id, $project_id);
        
        http_response_code(201);
        echo json_encode([
            'id' => $store_id,
            'name' => $data['name'],
            'isDefault' => false,
            'image' => $image,
            'projectId' => $project_id
        ]);
        break;
        
    case preg_match('#^/stores/(\d+)$#', $path, $matches) && $method === 'PUT':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $store_id = $matches[1];
        
        // Verificar que la tienda pertenece al usuario
        global $wpdb;
        $store = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d AND user_id = %d",
            $store_id,
            $user['id']
        ));
        
        if (!$store) {
            http_response_code(404);
            echo json_encode(['error' => 'Tienda no encontrada']);
            exit;
        }
        
        // Preparar datos para actualizar
        $update_data = [];
        $update_format = [];
        
        if (isset($data['name'])) {
            $update_data['name'] = $data['name'];
            $update_format[] = '%s';
        }
        
        if (isset($data['image'])) {
            $update_data['image'] = save_base64_image($data['image']);
            $update_format[] = '%s';
        }
        
        if (isset($data['isDefault'])) {
            $update_data['is_default'] = $data['isDefault'] ? 1 : 0;
            $update_format[] = '%d';
        }
        
        // Actualizar tienda
        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'price_extractor_stores',
                $update_data,
                ['id' => $store_id],
                $update_format,
                ['%d']
            );
            
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar tienda']);
                exit;
            }
        }
        
        // Manejar cambio de proyecto si se especifica
        if (isset($data['projectId'])) {
            // Verificar que el proyecto pertenece al usuario
            $project = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d AND user_id = %d",
                $data['projectId'],
                $user['id']
            ));
            
            if (!$project) {
                http_response_code(400);
                echo json_encode(['error' => 'Proyecto no válido']);
                exit;
            }
            
            // Eliminar asociaciones existentes y crear nueva
            $wpdb->delete(
                $wpdb->prefix . 'price_extractor_project_stores',
                ['store_id' => $store_id],
                ['%d']
            );
            
            associate_store_with_project($store_id, $data['projectId']);
        }
        
        // Obtener tienda actualizada
        $updated_store = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d",
            $store_id
        ));
        
        // Obtener el primer proyecto asociado para la respuesta
        $first_project = $wpdb->get_var($wpdb->prepare(
            "SELECT project_id FROM {$wpdb->prefix}price_extractor_project_stores WHERE store_id = %d LIMIT 1",
            $store_id
        ));
        
        echo json_encode([
            'id' => $updated_store->id,
            'name' => $updated_store->name,
            'isDefault' => (bool) $updated_store->is_default,
            'image' => $updated_store->image,
            'projectId' => $first_project ? intval($first_project) : null
        ]);
        break;
        
    case preg_match('#^/stores/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $store_id = $matches[1];
        
        // Verificar que la tienda pertenece al usuario
        global $wpdb;
        $store = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d AND user_id = %d",
            $store_id,
            $user['id']
        ));
        
        if (!$store) {
            http_response_code(404);
            echo json_encode(['error' => 'Tienda no encontrada']);
            exit;
        }
        
        // No permitir eliminar la tienda por defecto
        if ($store->is_default) {
            http_response_code(400);
            echo json_encode(['error' => 'No se puede eliminar la tienda por defecto']);
            exit;
        }
        
        // Obtener la tienda por defecto
        $default_store = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE user_id = %d AND is_default = 1",
            $user['id']
        ));
        
        if (!$default_store) {
            http_response_code(500);
            echo json_encode(['error' => 'No se encontró la tienda por defecto']);
            exit;
        }
        
        // Mover productos a la tienda por defecto
        $wpdb->update(
            $wpdb->prefix . 'price_extractor_products',
            ['store_id' => $default_store->id],
            ['store_id' => $store_id],
            ['%d'],
            ['%d']
        );
        
        // Eliminar relaciones de proyecto
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_project_stores',
            ['store_id' => $store_id],
            ['%d']
        );
        
        // Eliminar tienda
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_stores',
            ['id' => $store_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar tienda']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    // Rutas de productos
    case preg_match('#^/products$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener productos del usuario
        global $wpdb;
        
        // Verificar si se está filtrando por proyecto
        $project_id = isset($_GET['projectId']) ? intval($_GET['projectId']) : null;
        
        if ($project_id) {
            $products = $wpdb->get_results($wpdb->prepare(
                "SELECT p.* FROM {$wpdb->prefix}price_extractor_products p
                 INNER JOIN {$wpdb->prefix}price_extractor_project_products pp ON p.id = pp.product_id
                 WHERE p.user_id = %d AND pp.project_id = %d 
                 ORDER BY p.created_at DESC",
                $user['id'],
                $project_id
            ));
        } else {
            $products = $wpdb->get_results($wpdb->prepare(
                "SELECT p.*, GROUP_CONCAT(pp.project_id) as project_ids 
                 FROM {$wpdb->prefix}price_extractor_products p
                 LEFT JOIN {$wpdb->prefix}price_extractor_project_products pp ON p.id = pp.product_id
                 WHERE p.user_id = %d 
                 GROUP BY p.id
                 ORDER BY p.created_at DESC",
                $user['id']
            ));
        }
        
        $formatted_products = [];
        foreach ($products as $product) {
            if ($project_id) {
                // Si estamos filtrando por proyecto, solo devolver el projectId actual
                $formatted_products[] = [
                    'id' => $product->id,
                    'title' => $product->title,
                    'price' => (float) $product->price,
                    'quantity' => (int) $product->quantity,
                    'image' => $product->image,
                    'storeId' => $product->store_id,
                    'projectId' => $project_id,
                    'createdAt' => $product->created_at
                ];
            } else {
                // Si no estamos filtrando, devolver todos los projectIds
                $project_ids = isset($product->project_ids) && $product->project_ids ? explode(',', $product->project_ids) : [];
                $formatted_products[] = [
                    'id' => $product->id,
                    'title' => $product->title,
                    'price' => (float) $product->price,
                    'quantity' => (int) $product->quantity,
                    'image' => $product->image,
                    'storeId' => $product->store_id,
                    'projectIds' => array_map('intval', $project_ids),
                    'createdAt' => $product->created_at
                ];
            }
        }
        
        echo json_encode($formatted_products);
        break;
        
    case preg_match('#^/products$#', $path) && $method === 'POST':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Validar datos
        if (empty($data['title']) || !isset($data['price']) || !isset($data['storeId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título, precio y tienda son requeridos']);
            exit;
        }
        
        // Procesar imagen si existe
        $image = null;
        if (!empty($data['image'])) {
            $image = save_base64_image($data['image']);
        }
        
        // Verificar que la tienda pertenece al usuario
        global $wpdb;
        $store = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d AND user_id = %d",
                $data['storeId'],
                $user['id']
            ));
        
        if (!$store) {
            http_response_code(400);
            echo json_encode(['error' => 'Tienda no válida']);
            exit;
        }
        
        // Verificar el proyecto
        $project_id = isset($data['projectId']) ? intval($data['projectId']) : null;
        
        if (!$project_id) {
            // Si no se especifica un proyecto, usar el proyecto por defecto
            $default_project = $wpdb->get_row($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}price_extractor_projects WHERE user_id = %d AND is_default = 1",
                $user['id']
            ));
            
            if ($default_project) {
                $project_id = $default_project->id;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No se encontró un proyecto por defecto']);
                exit;
            }
        }
        
        // Insertar producto
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_products',
            [
                'user_id' => $user['id'],
                'store_id' => $data['storeId'],
                'title' => $data['title'],
                'price' => $data['price'],
                'quantity' => isset($data['quantity']) ? $data['quantity'] : 1,
                'image' => $image,
                'created_at' => isset($data['createdAt']) ? $data['createdAt'] : current_time('mysql')
            ],
            ['%d', '%d', '%s', '%f', '%d', '%s', '%s']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear producto']);
            exit;
        }
        
        $product_id = $wpdb->insert_id;
        
        // Asociar el producto con el proyecto
        associate_product_with_project($product_id, $project_id);
        
        // Obtener el producto creado
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE id = %d",
            $product_id
        ));
        
        http_response_code(201);
        echo json_encode([
            'id' => $product->id,
            'title' => $product->title,
            'price' => (float) $product->price,
            'quantity' => (int) $product->quantity,
            'image' => $product->image,
            'storeId' => $product->store_id,
            'projectId' => $project_id,
            'createdAt' => $product->created_at
        ]);
        break;
        
    case preg_match('#^/products/(\d+)$#', $path, $matches) && $method === 'PUT':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $product_id = $matches[1];
        
        // Verificar que el producto pertenece al usuario
        global $wpdb;
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE id = %d AND user_id = %d",
            $product_id,
            $user['id']
        ));
        
        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Producto no encontrado']);
            exit;
        }
        
        // Preparar datos para actualizar
        $update_data = [];
        $update_format = [];
        
        if (isset($data['title'])) {
            $update_data['title'] = $data['title'];
            $update_format[] = '%s';
        }
        
        if (isset($data['price'])) {
            $update_data['price'] = $data['price'];
            $update_format[] = '%f';
        }
        
        if (isset($data['quantity'])) {
            $update_data['quantity'] = $data['quantity'];
            $update_format[] = '%d';
        }
        
        if (isset($data['storeId'])) {
            // Verificar que la tienda pertenece al usuario
            $store = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d AND user_id = %d",
                $data['storeId'],
                $user['id']
            ));
            
            if (!$store) {
                http_response_code(400);
                echo json_encode(['error' => 'Tienda no válida']);
                exit;
            }
            
            $update_data['store_id'] = $data['storeId'];
            $update_format[] = '%d';
        }
        
        // Manejar imagen
        if (array_key_exists('image', $data)) {
            if ($data['image'] === null) {
                $update_data['image'] = null;
                $update_format[] = '%s';
            } else if (!empty($data['image'])) {
                $update_data['image'] = save_base64_image($data['image']);
                $update_format[] = '%s';
            }
        }
        
        // Actualizar producto
        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'price_extractor_products',
                $update_data,
                ['id' => $product_id],
                $update_format,
                ['%d']
            );
            
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar producto']);
                exit;
            }
        }
        
        // Manejar cambio de proyecto si se especifica
        if (isset($data['projectId'])) {
            // Verificar que el proyecto pertenece al usuario
            $project = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_projects WHERE id = %d AND user_id = %d",
                $data['projectId'],
                $user['id']
            ));
            
            if (!$project) {
                http_response_code(400);
                echo json_encode(['error' => 'Proyecto no válido']);
                exit;
            }
            
            // Eliminar asociaciones existentes y crear nueva
            $wpdb->delete(
                $wpdb->prefix . 'price_extractor_project_products',
                ['product_id' => $product_id],
                ['%d']
            );
            
            associate_product_with_project($product_id, $data['projectId']);
        }
        
        // Obtener producto actualizado
        $updated_product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE id = %d",
            $product_id
        ));
        
        // Obtener el primer proyecto asociado para la respuesta
        $first_project = $wpdb->get_var($wpdb->prepare(
            "SELECT project_id FROM {$wpdb->prefix}price_extractor_project_products WHERE product_id = %d LIMIT 1",
            $product_id
        ));
        
        echo json_encode([
            'id' => $updated_product->id,
            'title' => $updated_product->title,
            'price' => (float) $updated_product->price,
            'quantity' => (int) $updated_product->quantity,
            'image' => $updated_product->image,
            'storeId' => $updated_product->store_id,
            'projectId' => $first_project ? intval($first_project) : null,
            'createdAt' => $updated_product->created_at
        ]);
        break;
        
    case preg_match('#^/products/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $product_id = $matches[1];
        
        // Verificar que el producto pertenece al usuario
        global $wpdb;
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE id = %d AND user_id = %d",
            $product_id,
            $user['id']
        ));
        
        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Producto no encontrado']);
            exit;
        }
        
        // Eliminar relaciones de proyecto
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_project_products',
            ['product_id' => $product_id],
            ['%d']
        );
        
        // Eliminar producto
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_products',
            ['id' => $product_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar producto']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    // Rutas de ingresos
    case preg_match('#^/incomes$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener ingresos del usuario
        global $wpdb;
        $incomes = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_incomes WHERE user_id = %d ORDER BY date DESC, created_at DESC",
            $user['id']
        ));
        
        $formatted_incomes = [];
        foreach ($incomes as $income) {
            $formatted_incomes[] = [
                'id' => $income->id,
                'description' => $income->description,
                'amount' => (float) $income->amount,
                'category' => $income->category,
                'date' => $income->date,
                'isFixed' => (bool) $income->is_fixed,
                'frequency' => $income->frequency,
                'notes' => $income->notes,
                'createdAt' => $income->created_at
            ];
        }
        
        echo json_encode($formatted_incomes);
        break;
        
    case preg_match('#^/incomes$#', $path) && $method === 'POST':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Validar datos
        if (empty($data['description']) || !isset($data['amount']) || empty($data['category']) || empty($data['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Descripción, monto, categoría y fecha son requeridos']);
            exit;
        }
        
        // Insertar ingreso
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_incomes',
            [
                'user_id' => $user['id'],
                'description' => $data['description'],
                'amount' => $data['amount'],
                'category' => $data['category'],
                'date' => $data['date'],
                'is_fixed' => isset($data['isFixed']) ? ($data['isFixed'] ? 1 : 0) : 0,
                'frequency' => isset($data['frequency']) ? $data['frequency'] : null,
                'notes' => isset($data['notes']) ? $data['notes'] : null
            ],
            ['%d', '%s', '%f', '%s', '%s', '%d', '%s', '%s']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear ingreso']);
            exit;
        }
        
        $income_id = $wpdb->insert_id;
        
        // Obtener el ingreso creado
        $income = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_incomes WHERE id = %d",
            $income_id
        ));
        
        http_response_code(201);
        echo json_encode([
            'id' => $income->id,
            'description' => $income->description,
            'amount' => (float) $income->amount,
            'category' => $income->category,
            'date' => $income->date,
            'isFixed' => (bool) $income->is_fixed,
            'frequency' => $income->frequency,
            'notes' => $income->notes,
            'createdAt' => $income->created_at
        ]);
        break;
        
    case preg_match('#^/incomes/(\d+)$#', $path, $matches) && $method === 'PUT':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $income_id = $matches[1];
        
        // Verificar que el ingreso pertenece al usuario
        global $wpdb;
        $income = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_incomes WHERE id = %d AND user_id = %d",
            $income_id,
            $user['id']
        ));
        
        if (!$income) {
            http_response_code(404);
            echo json_encode(['error' => 'Ingreso no encontrado']);
            exit;
        }
        
        // Preparar datos para actualizar
        $update_data = [];
        $update_format = [];
        
        if (isset($data['description'])) {
            $update_data['description'] = $data['description'];
            $update_format[] = '%s';
        }
        
        if (isset($data['amount'])) {
            $update_data['amount'] = $data['amount'];
            $update_format[] = '%f';
        }
        
        if (isset($data['category'])) {
            $update_data['category'] = $data['category'];
            $update_format[] = '%s';
        }
        
        if (isset($data['date'])) {
            $update_data['date'] = $data['date'];
            $update_format[] = '%s';
        }
        
        if (isset($data['isFixed'])) {
            $update_data['is_fixed'] = $data['isFixed'] ? 1 : 0;
            $update_format[] = '%d';
        }
        
        if (isset($data['frequency'])) {
            $update_data['frequency'] = $data['frequency'];
            $update_format[] = '%s';
        }
        
        if (isset($data['notes'])) {
            $update_data['notes'] = $data['notes'];
            $update_format[] = '%s';
        }
        
        // Actualizar ingreso
        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'price_extractor_incomes',
                $update_data,
                ['id' => $income_id],
                $update_format,
                ['%d']
            );
            
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar ingreso']);
                exit;
            }
        }
        
        // Obtener ingreso actualizado
        $updated_income = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_incomes WHERE id = %d",
            $income_id
        ));
        
        echo json_encode([
            'id' => $updated_income->id,
            'description' => $updated_income->description,
            'amount' => (float) $updated_income->amount,
            'category' => $updated_income->category,
            'date' => $updated_income->date,
            'isFixed' => (bool) $updated_income->is_fixed,
            'frequency' => $updated_income->frequency,
            'notes' => $updated_income->notes,
            'createdAt' => $updated_income->created_at
        ]);
        break;
        
    case preg_match('#^/incomes/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $income_id = $matches[1];
        
        // Verificar que el ingreso pertenece al usuario
        global $wpdb;
        $income = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_incomes WHERE id = %d AND user_id = %d",
            $income_id,
            $user['id']
        ));
        
        if (!$income) {
            http_response_code(404);
            echo json_encode(['error' => 'Ingreso no encontrado']);
            exit;
        }
        
        // Eliminar ingreso
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_incomes',
            ['id' => $income_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar ingreso']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;

    // NUEVAS RUTAS DE EGRESOS
    case preg_match('#^/expenses$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener egresos del usuario
        global $wpdb;
        $expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_expenses WHERE user_id = %d ORDER BY date DESC, created_at DESC",
            $user['id']
        ));
        
        $formatted_expenses = [];
        foreach ($expenses as $expense) {
            $formatted_expenses[] = [
                'id' => $expense->id,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'category' => $expense->category,
                'date' => $expense->date,
                'notes' => $expense->notes,
                'createdAt' => $expense->created_at
            ];
        }
        
        echo json_encode($formatted_expenses);
        break;
        
    case preg_match('#^/expenses$#', $path) && $method === 'POST':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Validar datos
        if (empty($data['description']) || !isset($data['amount']) || empty($data['category']) || empty($data['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Descripción, monto, categoría y fecha son requeridos']);
            exit;
        }
        
        // Insertar egreso
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_expenses',
            [
                'user_id' => $user['id'],
                'description' => $data['description'],
                'amount' => $data['amount'],
                'category' => $data['category'],
                'date' => $data['date'],
                'notes' => isset($data['notes']) ? $data['notes'] : null
            ],
            ['%d', '%s', '%f', '%s', '%s', '%s']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear egreso']);
            exit;
        }
        
        $expense_id = $wpdb->insert_id;
        
        // Obtener el egreso creado
        $expense = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_expenses WHERE id = %d",
            $expense_id
        ));
        
        http_response_code(201);
        echo json_encode([
            'id' => $expense->id,
            'description' => $expense->description,
            'amount' => (float) $expense->amount,
            'category' => $expense->category,
            'date' => $expense->date,
            'notes' => $expense->notes,
            'createdAt' => $expense->created_at
        ]);
        break;
        
    case preg_match('#^/expenses/(\d+)$#', $path, $matches) && $method === 'PUT':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $expense_id = $matches[1];
        
        // Verificar que el egreso pertenece al usuario
        global $wpdb;
        $expense = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_expenses WHERE id = %d AND user_id = %d",
            $expense_id,
            $user['id']
        ));
        
        if (!$expense) {
            http_response_code(404);
            echo json_encode(['error' => 'Egreso no encontrado']);
            exit;
        }
        
        // Preparar datos para actualizar
        $update_data = [];
        $update_format = [];
        
        if (isset($data['description'])) {
            $update_data['description'] = $data['description'];
            $update_format[] = '%s';
        }
        
        if (isset($data['amount'])) {
            $update_data['amount'] = $data['amount'];
            $update_format[] = '%f';
        }
        
        if (isset($data['category'])) {
            $update_data['category'] = $data['category'];
            $update_format[] = '%s';
        }
        
        if (isset($data['date'])) {
            $update_data['date'] = $data['date'];
            $update_format[] = '%s';
        }
        
        if (isset($data['notes'])) {
            $update_data['notes'] = $data['notes'];
            $update_format[] = '%s';
        }
        
        // Actualizar egreso
        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'price_extractor_expenses',
                $update_data,
                ['id' => $expense_id],
                $update_format,
                ['%d']
            );
            
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar egreso']);
                exit;
            }
        }
        
        // Obtener egreso actualizado
        $updated_expense = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_expenses WHERE id = %d",
            $expense_id
        ));
        
        echo json_encode([
            'id' => $updated_expense->id,
            'description' => $updated_expense->description,
            'amount' => (float) $updated_expense->amount,
            'category' => $updated_expense->category,
            'date' => $updated_expense->date,
            'notes' => $updated_expense->notes,
            'createdAt' => $updated_expense->created_at
        ]);
        break;
        
    case preg_match('#^/expenses/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $expense_id = $matches[1];
        
        // Verificar que el egreso pertenece al usuario
        global $wpdb;
        $expense = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_expenses WHERE id = %d AND user_id = %d",
            $expense_id,
            $user['id']
        ));
        
        if (!$expense) {
            http_response_code(404);
            echo json_encode(['error' => 'Egreso no encontrado']);
            exit;
        }
        
        // Eliminar egreso
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_expenses',
            ['id' => $expense_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar egreso']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    // Endpoint de debug
    case $path === '/debug' && $method === 'GET':
        // Verificar autenticación básica para este endpoint (solo para depuración)
        $auth_user = isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '';
        $auth_pass = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
        
        if ($auth_user !== 'admin' || $auth_pass !== 'debug123') {
            header('WWW-Authenticate: Basic realm="Debug API"');
            http_response_code(401);
            echo json_encode(['error' => 'Autenticación requerida']);
            exit;
        }
        
        // Información de la base de datos
        global $wpdb;
        $tables_info = [];
        
        $tables = [
            $wpdb->prefix . 'price_extractor_users',
            $wpdb->prefix . 'price_extractor_projects',
            $wpdb->prefix . 'price_extractor_stores',
            $wpdb->prefix . 'price_extractor_products',
            $wpdb->prefix . 'price_extractor_project_products',
            $wpdb->prefix . 'price_extractor_project_stores',
            $wpdb->prefix . 'price_extractor_incomes',
            $wpdb->prefix . 'price_extractor_expenses' // Añadido para debug
        ];
        
        foreach ($tables as $table) {
            $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
            $tables_info[$table] = [
                'count' => $count,
                'exists' => $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table
            ];
        }
        
        // Información del sistema
        $system_info = [
            'php_version' => PHP_VERSION,
            'mysql_version' => $wpdb->db_version(),
            'wordpress_version' => get_bloginfo('version'),
            'server' => $_SERVER['SERVER_SOFTWARE'],
            'time' => current_time('mysql')
        ];
        
        echo json_encode([
            'status' => 'ok',
            'tables' => $tables_info,
            'system' => $system_info
        ]);
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Ruta no encontrada']);
        break;
}
?>
