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
    'https://gestoreconomico.somediave.com',
    'https://somediave.com',                    // Dominio principal de WordPress
    'https://www.somediave.com',                // Versión con www
    'https://teddyhos.com',                     // Otros posibles dominios
    'https://www.teddyhos.com'
];

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Permitir el origen si está en la lista o usar * como comodín
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si el origen no está en la lista, permitir cualquier origen (menos restrictivo)
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

// Registrar información de la solicitud
log_to_file("Nueva solicitud: {$method} {$path}", [
    'origin' => $origin,
    'has_token' => !empty($token),
    'token_length' => strlen($token)
]);

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
    
    $secret = 'P2jn5QeYk3hZVroQRB+FtulFBKZ2iShd6Nbm4WEwRxm5aCljylRiTmbKjGHeBkM0IQ3cEE5nzz/1+IiT4RedVA=='; // Clave secreta
    
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

// Función para crear las tablas necesarias
function create_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // Tabla de usuarios
    $users_table = $wpdb->prefix . 'price_extractor_users';
    $sql = "CREATE TABLE IF NOT EXISTS $users_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        UNIQUE KEY email (email)
    ) $charset_collate;";
    
    // Tabla de tiendas
    $stores_table = $wpdb->prefix . 'price_extractor_stores';
    $sql .= "CREATE TABLE IF NOT EXISTS $stores_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        name varchar(255) NOT NULL,
        image text DEFAULT NULL,
        is_default tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id)
    ) $charset_collate;";
    
    // Tabla de productos
    $products_table = $wpdb->prefix . 'price_extractor_products';
    $sql .= "CREATE TABLE IF NOT EXISTS $products_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        store_id bigint(20) NOT NULL,
        title varchar(255) NOT NULL,
        price decimal(10,2) NOT NULL,
        quantity int(11) NOT NULL DEFAULT 1,
        image text DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY store_id (store_id)
    ) $charset_collate;";
    
    // Tabla de listas de compras
    $shopping_lists_table = $wpdb->prefix . 'price_extractor_shopping_lists';
    $sql .= "CREATE TABLE IF NOT EXISTS $shopping_lists_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        name varchar(255) NOT NULL,
        total decimal(10,2) NOT NULL DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id)
    ) $charset_collate;";
    
    // Tabla de tiendas en listas de compras
    $shopping_list_stores_table = $wpdb->prefix . 'price_extractor_shopping_list_stores';
    $sql .= "CREATE TABLE IF NOT EXISTS $shopping_list_stores_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        shopping_list_id bigint(20) NOT NULL,
        store_id bigint(20) NOT NULL,
        name varchar(255) NOT NULL,
        PRIMARY KEY  (id),
        KEY shopping_list_id (shopping_list_id),
        KEY store_id (store_id)
    ) $charset_collate;";
    
    // Tabla de productos en listas de compras
    $shopping_list_products_table = $wpdb->prefix . 'price_extractor_shopping_list_products';
    $sql .= "CREATE TABLE IF NOT EXISTS $shopping_list_products_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        shopping_list_id bigint(20) NOT NULL,
        store_id bigint(20) DEFAULT NULL,
        title varchar(255) NOT NULL,
        price decimal(10,2) NOT NULL,
        quantity int(11) NOT NULL DEFAULT 1,
        image text DEFAULT NULL,
        PRIMARY KEY  (id),
        KEY shopping_list_id (shopping_list_id),
        KEY store_id (store_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Crear las tablas si no existen
create_tables();

// Función para obtener los datos del usuario (tiendas y productos)
function get_user_data($user_id) {
    global $wpdb;
    
    // Obtener tiendas
    $stores = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE user_id = %d ORDER BY is_default DESC, name ASC",
        $user_id
    ));
    
    $formatted_stores = [];
    foreach ($stores as $store) {
        $formatted_stores[] = [
            'id' => $store->id,
            'name' => $store->name,
            'isDefault' => (bool) $store->is_default,
            'image' => $store->image
        ];
    }
    
    // Obtener productos
    $products = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE user_id = %d ORDER BY created_at DESC",
        $user_id
    ));
    
    $formatted_products = [];
    foreach ($products as $product) {
        $formatted_products[] = [
            'id' => $product->id,
            'title' => $product->title,
            'price' => (float) $product->price,
            'quantity' => (int) $product->quantity,
            'image' => $product->image,
            'storeId' => $product->store_id,
            'createdAt' => $product->created_at
        ];
    }
    
    return [
        'stores' => $formatted_stores,
        'products' => $formatted_products
    ];
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
        $stores = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE user_id = %d ORDER BY is_default DESC, name ASC",
            $user['id']
        ));
        
        $formatted_stores = [];
        foreach ($stores as $store) {
            $formatted_stores[] = [
                'id' => $store->id,
                'name' => $store->name,
                'isDefault' => (bool) $store->is_default,
                'image' => $store->image
            ];
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
        
        http_response_code(201);
        echo json_encode([
            'id' => $store_id,
            'name' => $data['name'],
            'isDefault' => false,
            'image' => $image
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
        
        // Obtener tienda actualizada
        $updated_store = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_stores WHERE id = %d",
            $store_id
        ));
        
        echo json_encode([
            'id' => $updated_store->id,
            'name' => $updated_store->name,
            'isDefault' => (bool) $updated_store->is_default,
            'image' => $updated_store->image
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
        log_to_file("GET /products - Token verificado", $user ? "Usuario autenticado" : "No autorizado");
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener productos del usuario
        global $wpdb;
        log_to_file("GET /products - Consultando productos para usuario ID: " . $user['id']);
        
        $products = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE user_id = %d ORDER BY created_at DESC",
            $user['id']
        ));
        
        log_to_file("GET /products - Productos encontrados: " . count($products));
        
        $formatted_products = [];
        foreach ($products as $product) {
            $formatted_products[] = [
                'id' => $product->id,
                'title' => $product->title,
                'price' => (float) $product->price,
                'quantity' => (int) $product->quantity,
                'image' => $product->image,
                'storeId' => $product->store_id,
                'createdAt' => $product->created_at
            ];
        }
        
        log_to_file("GET /products - Enviando respuesta con " . count($formatted_products) . " productos");
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
        
        if (isset($data['image'])) {
            $update_data['image'] = save_base64_image($data['image']);
            $update_format[] = '%s';
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
        
        // Obtener producto actualizado
        $updated_product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_products WHERE id = %d",
            $product_id
        ));
        
        echo json_encode([
            'id' => $updated_product->id,
            'title' => $updated_product->title,
            'price' => (float) $updated_product->price,
            'quantity' => (int) $updated_product->quantity,
            'image' => $updated_product->image,
            'storeId' => $updated_product->store_id,
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
        
    // Rutas de listas de compras
    case preg_match('#^/shopping-lists$#', $path) && $method === 'GET':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        // Obtener listas de compras del usuario
        global $wpdb;
        $shopping_lists = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_shopping_lists WHERE user_id = %d ORDER BY created_at DESC",
            $user['id']
        ));
        
        $formatted_lists = [];
        foreach ($shopping_lists as $list) {
            // Obtener tiendas de la lista
            $stores = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_shopping_list_stores WHERE shopping_list_id = %d",
                $list->id
            ));
            
            $formatted_stores = [];
            foreach ($stores as $store) {
                $formatted_stores[] = [
                    'id' => $store->id,
                    'name' => $store->name
                ];
            }
            
            // Obtener productos de la lista
            $products = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}price_extractor_shopping_list_products WHERE shopping_list_id = %d",
                $list->id
            ));
            
            $formatted_products = [];
            foreach ($products as $product) {
                $formatted_products[] = [
                    'id' => $product->id,
                    'title' => $product->title,
                    'price' => (float) $product->price,
                    'quantity' => (int) $product->quantity,
                    'image' => $product->image,
                    'storeId' => $product->store_id
                ];
            }
            
            $formatted_lists[] = [
                'id' => $list->id,
                'name' => $list->name,
                'total' => (float) $list->total,
                'createdAt' => $list->created_at,
                'stores' => $formatted_stores,
                'products' => $formatted_products
            ];
        }
        
        echo json_encode($formatted_lists);
        break;
        
    case preg_match('#^/shopping-lists$#', $path) && $method === 'POST':
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
            echo json_encode(['error' => 'El nombre de la lista es requerido']);
            exit;
        }
        
        // Insertar lista de compras
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'price_extractor_shopping_lists',
            [
                'user_id' => $user['id'],
                'name' => $data['name'],
                'total' => isset($data['total']) ? $data['total'] : 0
            ],
            ['%d', '%s', '%f']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear lista de compras']);
            exit;
        }
        
        $shopping_list_id = $wpdb->insert_id;
        
        // Insertar tiendas si existen
        if (!empty($data['stores']) && is_array($data['stores'])) {
            foreach ($data['stores'] as $store) {
                $wpdb->insert(
                    $wpdb->prefix . 'price_extractor_shopping_list_stores',
                    [
                        'shopping_list_id' => $shopping_list_id,
                        'store_id' => $store['id'],
                        'name' => $store['name']
                    ],
                    ['%d', '%d', '%s']
                );
            }
        }
        
        // Insertar productos si existen
        if (!empty($data['products']) && is_array($data['products'])) {
            foreach ($data['products'] as $product) {
                $wpdb->insert(
                    $wpdb->prefix . 'price_extractor_shopping_list_products',
                    [
                        'shopping_list_id' => $shopping_list_id,
                        'store_id' => isset($product['storeId']) ? $product['storeId'] : null,
                        'title' => $product['title'],
                        'price' => $product['price'],
                        'quantity' => isset($product['quantity']) ? $product['quantity'] : 1,
                        'image' => isset($product['image']) ? $product['image'] : null
                    ],
                    ['%d', '%d', '%s', '%f', '%d', '%s']
                );
            }
        }
        
        // Obtener la lista creada
        $shopping_list = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_shopping_lists WHERE id = %d",
            $shopping_list_id
        ));
        
        http_response_code(201);
        echo json_encode([
            'id' => $shopping_list->id,
            'name' => $shopping_list->name,
            'total' => (float) $shopping_list->total,
            'createdAt' => $shopping_list->created_at,
            'stores' => [],
            'products' => []
        ]);
        break;
        
    case preg_match('#^/shopping-lists/(\d+)$#', $path, $matches) && $method === 'DELETE':
        // Verificar autenticación
        $user = verify_token($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        
        $shopping_list_id = $matches[1];
        
        // Verificar que la lista pertenece al usuario
        global $wpdb;
        $shopping_list = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}price_extractor_shopping_lists WHERE id = %d AND user_id = %d",
            $shopping_list_id,
            $user['id']
        ));
        
        if (!$shopping_list) {
            http_response_code(404);
            echo json_encode(['error' => 'Lista de compras no encontrada']);
            exit;
        }
        
        // Eliminar productos de la lista
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_shopping_list_products',
            ['shopping_list_id' => $shopping_list_id],
            ['%d']
        );
        
        // Eliminar tiendas de la lista
        $wpdb->delete(
            $wpdb->prefix . 'price_extractor_shopping_list_stores',
            ['shopping_list_id' => $shopping_list_id],
            ['%d']
        );
        
        // Eliminar lista
        $result = $wpdb->delete(
            $wpdb->prefix . 'price_extractor_shopping_lists',
            ['id' => $shopping_list_id],
            ['%d']
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar lista de compras']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    // Añadir este caso al switch before the default
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
            $wpdb->prefix . 'price_extractor_stores',
            $wpdb->prefix . 'price_extractor_products'
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
