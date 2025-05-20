<?php
/**
 * API REST para Price Extractor
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

class PriceExtractorAPI {
    
    // Namespace de la API
    const API_NAMESPACE = 'price-extractor/v1';
    
    // Registrar rutas de la API
    public static function register_routes() {
        // Rutas de autenticación
        register_rest_route(self::API_NAMESPACE, '/auth/register', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'register'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route(self::API_NAMESPACE, '/auth/login', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'login'),
            'permission_callback' => '__return_true',
        ));
        
        // Rutas protegidas (requieren autenticación)
        
        // Tiendas
        register_rest_route(self::API_NAMESPACE, '/stores', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_stores'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/stores', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'create_store'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/stores/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array('PriceExtractorAPI', 'update_store'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/stores/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('PriceExtractorAPI', 'delete_store'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        // Productos
        register_rest_route(self::API_NAMESPACE, '/products', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_products'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/products', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'create_product'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/products/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array('PriceExtractorAPI', 'update_product'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/products/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('PriceExtractorAPI', 'delete_product'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        // Listas de compras
        register_rest_route(self::API_NAMESPACE, '/shopping-lists', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_shopping_lists'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/shopping-lists', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'create_shopping_list'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/shopping-lists/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_shopping_list'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/shopping-lists/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('PriceExtractorAPI', 'delete_shopping_list'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        // Ingresos
        register_rest_route(self::API_NAMESPACE, '/incomes', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_incomes'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/incomes', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'add_income'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/incomes/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array('PriceExtractorAPI', 'update_income'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/incomes/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('PriceExtractorAPI', 'delete_income'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        // Egresos
        register_rest_route(self::API_NAMESPACE, '/expenses', array(
            'methods' => 'GET',
            'callback' => array('PriceExtractorAPI', 'get_expenses'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/expenses', array(
            'methods' => 'POST',
            'callback' => array('PriceExtractorAPI', 'add_expense'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/expenses/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array('PriceExtractorAPI', 'update_expense'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
        
        register_rest_route(self::API_NAMESPACE, '/expenses/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('PriceExtractorAPI', 'delete_expense'),
            'permission_callback' => array('PriceExtractorAPI', 'check_auth'),
        ));
    }
    
    // Verificar autenticación
    public static function check_auth($request) {
        $auth_header = $request->get_header('Authorization');
        
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('unauthorized', 'No autorizado', array('status' => 401));
        }
        
        $token = substr($auth_header, 7);
        $user = PriceExtractorAuth::verify_token($token);
        
        if (!$user) {
            return new WP_Error('unauthorized', 'Token inválido', array('status' => 401));
        }
        
        // Añadir el usuario al request para usarlo en los callbacks
        $request->set_param('user', $user);
        
        return true;
    }
    
    // Registro de usuario
    public static function register($request) {
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['name']) || empty($params['email']) || empty($params['password'])) {
            return new WP_Error('bad_request', 'Todos los campos son requeridos', array('status' => 400));
        }
        
        // Verificar si el usuario ya existe
        $existing_user = PriceExtractorDB::get_user_by_email($params['email']);
        
        if ($existing_user) {
            return new WP_Error('bad_request', 'El correo electrónico ya está registrado', array('status' => 400));
        }
        
        // Hashear la contraseña
        $hashed_password = PriceExtractorAuth::hash_password($params['password']);
        
        // Crear el usuario
        $user_id = PriceExtractorDB::create_user($params['name'], $params['email'], $hashed_password);
        
        if (!$user_id) {
            return new WP_Error('server_error', 'Error al registrar usuario', array('status' => 500));
        }
        
        // Crear tienda por defecto "Total"
        $store_id = PriceExtractorDB::create_store($user_id, 'Total', 1);
        
        if (!$store_id) {
            return new WP_Error('server_error', 'Error al crear tienda por defecto', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Usuario registrado correctamente'
        ), 201);
    }
    
    // Login de usuario
    public static function login($request) {
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['email']) || empty($params['password'])) {
            return new WP_Error('bad_request', 'Correo electrónico y contraseña son requeridos', array('status' => 400));
        }
        
        // Buscar el usuario
        $user = PriceExtractorDB::get_user_by_email($params['email']);
        
        if (!$user) {
            return new WP_Error('unauthorized', 'Credenciales incorrectas', array('status' => 401));
        }
        
        // Verificar la contraseña
        $is_valid = PriceExtractorAuth::verify_password($params['password'], $user->password);
        
        if (!$is_valid) {
            return new WP_Error('unauthorized', 'Credenciales incorrectas', array('status' => 401));
        }
        
        // Generar token JWT
        $token = PriceExtractorAuth::generate_token($user->id, $user->email, $user->name);
        
        return new WP_REST_Response(array(
            'token' => $token,
            'user' => array(
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            )
        ), 200);
    }
    
    // Obtener tiendas
    public static function get_stores($request) {
        $user = $request->get_param('user');
        
        $stores = PriceExtractorDB::get_stores_by_user_id($user['id']);
        
        $formatted_stores = array();
        foreach ($stores as $store) {
            $formatted_stores[] = array(
                'id' => $store->id,
                'name' => $store->name,
                'isDefault' => (bool) $store->is_default,
                'image' => $store->image,
            );
        }
        
        return new WP_REST_Response($formatted_stores, 200);
    }
    
    // Crear tienda
    public static function create_store($request) {
        $user = $request->get_param('user');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['name'])) {
            return new WP_Error('bad_request', 'El nombre de la tienda es requerido', array('status' => 400));
        }
        
        // Crear tienda
        $store_id = PriceExtractorDB::create_store($user['id'], $params['name'], 0, $params['image'] ?? null);
        
        if (!$store_id) {
            return new WP_Error('server_error', 'Error al crear tienda', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $store_id,
            'name' => $params['name'],
            'isDefault' => false,
            'image' => $params['image'] ?? null,
        ), 201);
    }
    
    // Actualizar tienda
    public static function update_store($request) {
        $user = $request->get_param('user');
        $store_id = $request->get_param('id');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['name'])) {
            return new WP_Error('bad_request', 'El nombre de la tienda es requerido', array('status' => 400));
        }
        
        // Verificar que la tienda pertenece al usuario
        $stores = PriceExtractorDB::get_stores_by_user_id($user['id']);
        $store_belongs_to_user = false;
        
        foreach ($stores as $store) {
            if ($store->id == $store_id) {
                $store_belongs_to_user = true;
                break;
            }
        }
        
        if (!$store_belongs_to_user) {
            return new WP_Error('not_found', 'Tienda no encontrada', array('status' => 404));
        }
        
        // Actualizar tienda
        $data = array(
            'name' => $params['name'],
        );
        
        if (isset($params['image'])) {
            $data['image'] = $params['image'];
        }
        
        $result = PriceExtractorDB::update_store($store_id, $data);
        
        if ($result === false) {
            return new WP_Error('server_error', 'Error al actualizar tienda', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $store_id,
            'name' => $params['name'],
            'isDefault' => (bool) $store->is_default,
            'image' => isset($params['image']) ? $params['image'] : $store->image,
        ), 200);
    }
    
    // Eliminar tienda
    public static function delete_store($request) {
        $user = $request->get_param('user');
        $store_id = $request->get_param('id');
        
        // Verificar que la tienda pertenece al usuario
        $stores = PriceExtractorDB::get_stores_by_user_id($user['id']);
        $store_belongs_to_user = false;
        $store_to_delete = null;
        
        foreach ($stores as $store) {
            if ($store->id == $store_id) {
                $store_belongs_to_user = true;
                $store_to_delete = $store;
                break;
            }
        }
        
        if (!$store_belongs_to_user) {
            return new WP_Error('not_found', 'Tienda no encontrada', array('status' => 404));
        }
        
        // No permitir eliminar la tienda por defecto
        if ($store_to_delete->is_default) {
            return new WP_Error('bad_request', 'No se puede eliminar la tienda por defecto', array('status' => 400));
        }
        
        // Buscar una tienda alternativa
        $alternative_store = null;
        foreach ($stores as $store) {
            if ($store->id != $store_id) {
                $alternative_store = $store;
                break;
            }
        }
        
        // Actualizar productos
        if ($alternative_store) {
            global $wpdb;
            $tables = PriceExtractorDB::get_table_names();
            
            $wpdb->update(
                $tables['products'],
                array('store_id' => $alternative_store->id),
                array('store_id' => $store_id, 'user_id' => $user['id']),
                array('%d'),
                array('%d', '%d')
            );
        }
        
        // Eliminar tienda
        $result = PriceExtractorDB::delete_store($store_id);
        
        if (!$result) {
            return new WP_Error('server_error', 'Error al eliminar tienda', array('status' => 500));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    // Obtener productos
    public static function get_products($request) {
        $user = $request->get_param('user');
        
        $products = PriceExtractorDB::get_products_by_user_id($user['id']);
        
        $formatted_products = array();
        foreach ($products as $product) {
            $formatted_products[] = array(
                'id' => $product->id,
                'title' => $product->title,
                'price' => (float) $product->price,
                'quantity' => (int) $product->quantity,
                'image' => $product->image,
                'storeId' => $product->store_id,
                'createdAt' => $product->created_at,
            );
        }
        
        return new WP_REST_Response($formatted_products, 200);
    }
    
    // Crear producto
    public static function create_product($request) {
        $user = $request->get_param('user');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['title']) || !isset($params['price']) || !isset($params['quantity'])) {
            return new WP_Error('bad_request', 'Título, precio y cantidad son requeridos', array('status' => 400));
        }
        
        // Verificar que la tienda existe y pertenece al usuario
        $store_id = $params['storeId'];
        
        if ($store_id) {
            $stores = PriceExtractorDB::get_stores_by_user_id($user['id']);
            $store_belongs_to_user = false;
            
            foreach ($stores as $store) {
                if ($store->id == $store_id) {
                    $store_belongs_to_user = true;
                    break;
                }
            }
            
            if (!$store_belongs_to_user) {
                return new WP_Error('bad_request', 'Tienda no válida', array('status' => 400));
            }
        } else {
            // Si no se proporciona storeId, usar la tienda por defecto
            $stores = PriceExtractorDB::get_stores_by_user_id($user['id']);
            
            foreach ($stores as $store) {
                if ($store->is_default) {
                    $store_id = $store->id;
                    break;
                }
            }
        }
        
        // Crear producto
        $product_id = PriceExtractorDB::create_product(
            $user['id'],
            $store_id,
            $params['title'],
            (float) $params['price'],
            (int) $params['quantity'],
            $params['image'] ?? null
        );
        
        if (!$product_id) {
            return new WP_Error('server_error', 'Error al crear producto', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $product_id,
            'title' => $params['title'],
            'price' => (float) $params['price'],
            'quantity' => (int) $params['quantity'],
            'image' => $params['image'] ?? null,
            'storeId' => $store_id,
            'createdAt' => date('Y-m-d H:i:s'),
        ), 201);
    }
    
    // Actualizar producto
    public static function update_product($request) {
        $user = $request->get_param('user');
        $product_id = $request->get_param('id');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['title']) || !isset($params['price']) || !isset($params['quantity'])) {
            return new WP_Error('bad_request', 'Título, precio y cantidad son requeridos', array('status' => 400));
        }
        
        // Verificar que el producto pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $product = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['products']} WHERE id = %d AND user_id = %d",
                $product_id,
                $user['id']
            )
        );
        
        if (!$product) {
            return new WP_Error('not_found', 'Producto no encontrado', array('status' => 404));
        }
        
        // Actualizar producto
        $data = array(
            'title' => $params['title'],
            'price' => (float) $params['price'],
            'quantity' => (int) $params['quantity'],
        );
        
        if (isset($params['storeId'])) {
            $data['store_id'] = $params['storeId'];
        }
        
        // Verificar si la imagen está definida en los parámetros
        if (array_key_exists('image', $params)) {
            $data['image'] = $params['image'];
        }
        
        $result = PriceExtractorDB::update_product($product_id, $data);
        
        if ($result === false) {
            return new WP_Error('server_error', 'Error al actualizar producto', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $product_id,
            'title' => $params['title'],
            'price' => (float) $params['price'],
            'quantity' => (int) $params['quantity'],
            'image' => isset($params['image']) ? $params['image'] : $product->image,
            'storeId' => isset($params['storeId']) ? $params['storeId'] : $product->store_id,
        ), 200);
    }
    
    // Eliminar producto
    public static function delete_product($request) {
        $user = $request->get_param('user');
        $product_id = $request->get_param('id');
        
        // Verificar que el producto pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $product = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['products']} WHERE id = %d AND user_id = %d",
                $product_id,
                $user['id']
            )
        );
        
        if (!$product) {
            return new WP_Error('not_found', 'Producto no encontrado', array('status' => 404));
        }
        
        // Eliminar producto
        $result = PriceExtractorDB::delete_product($product_id);
        
        if (!$result) {
            return new WP_Error('server_error', 'Error al eliminar producto', array('status' => 500));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    // Obtener listas de compras
    public static function get_shopping_lists($request) {
        $user = $request->get_param('user');
        
        $shopping_lists = PriceExtractorDB::get_shopping_lists_by_user_id($user['id']);
        
        $formatted_lists = array();
        foreach ($shopping_lists as $list) {
            // Obtener productos de la lista
            $products = PriceExtractorDB::get_products_by_shopping_list_id($list->id);
            
            // Obtener tiendas de la lista
            $stores = PriceExtractorDB::get_stores_by_shopping_list_id($list->id);
            
            // Contar productos y tiendas únicas
            $product_count = count($products);
            $store_ids = array();
            foreach ($products as $product) {
                if (!in_array($product->store_id, $store_ids)) {
                    $store_ids[] = $product->store_id;
                }
            }
            $store_count = count($store_ids);
            
            $formatted_lists[] = array(
                'id' => $list->id,
                'name' => $list->name,
                'date' => $list->created_at,
                'total' => (float) $list->total,
                'productCount' => $product_count,
                'storeCount' => $store_count,
            );
        }
        
        return new WP_REST_Response($formatted_lists, 200);
    }
    
    // Crear lista de compras
    public static function create_shopping_list($request) {
        $user = $request->get_param('user');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['name']) || empty($params['products']) || !is_array($params['products'])) {
            return new WP_Error('bad_request', 'Nombre y productos son requeridos', array('status' => 400));
        }
        
        // Calcular el total
        $total = 0;
        foreach ($params['products'] as $product) {
            $total += $product['price'] * $product['quantity'];
        }
        
        // Crear lista de compras
        $shopping_list_id = PriceExtractorDB::create_shopping_list($user['id'], $params['name'], $total);
        
        if (!$shopping_list_id) {
            return new WP_Error('server_error', 'Error al crear lista de compras', array('status' => 500));
        }
        
        // Añadir tiendas a la lista
        if (!empty($params['stores']) && is_array($params['stores'])) {
            foreach ($params['stores'] as $store) {
                PriceExtractorDB::add_store_to_shopping_list($shopping_list_id, $store['id'], $store['name']);
            }
        }
        
        // Añadir productos a la lista
        foreach ($params['products'] as $product) {
            PriceExtractorDB::add_product_to_shopping_list(
                $shopping_list_id,
                $product['storeId'],
                $product['title'],
                $product['price'],
                $product['quantity'],
                $product['image'] ?? null
            );
        }
        
        // Contar productos y tiendas únicas
        $product_count = count($params['products']);
        $store_ids = array();
        foreach ($params['products'] as $product) {
            if (!in_array($product['storeId'], $store_ids)) {
                $store_ids[] = $product['storeId'];
            }
        }
        $store_count = count($store_ids);
        
        return new WP_REST_Response(array(
            'id' => $shopping_list_id,
            'name' => $params['name'],
            'date' => date('Y-m-d H:i:s'),
            'total' => $total,
            'productCount' => $product_count,
            'storeCount' => $store_count,
        ), 201);
    }
    
    // Obtener lista de compras
    public static function get_shopping_list($request) {
        $user = $request->get_param('user');
        $list_id = $request->get_param('id');
        
        // Verificar que la lista pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $list = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['shopping_lists']} WHERE id = %d AND user_id = %d",
                $list_id,
                $user['id']
            )
        );
        
        if (!$list) {
            return new WP_Error('not_found', 'Lista no encontrada', array('status' => 404));
        }
        
        // Obtener tiendas de la lista
        $stores = PriceExtractorDB::get_stores_by_shopping_list_id($list_id);
        $formatted_stores = array();
        foreach ($stores as $store) {
            $formatted_stores[] = array(
                'id' => $store->store_id,
                'name' => $store->name,
            );
        }
        
        // Obtener productos de la lista
        $products = PriceExtractorDB::get_products_by_shopping_list_id($list_id);
        $formatted_products = array();
        foreach ($products as $product) {
            $formatted_products[] = array(
                'id' => $product->id,
                'title' => $product->title,
                'price' => (float) $product->price,
                'quantity' => (int) $product->quantity,
                'image' => $product->image,
                'storeId' => $product->store_id,
                'isEditing' => false,
            );
        }
        
        return new WP_REST_Response(array(
            'id' => $list->id,
            'name' => $list->name,
            'date' => $list->created_at,
            'total' => (float) $list->total,
            'stores' => $formatted_stores,
            'products' => $formatted_products,
        ), 200);
    }
    
    // Eliminar lista de compras
    public static function delete_shopping_list($request) {
        $user = $request->get_param('user');
        $list_id = $request->get_param('id');
        
        // Verificar que la lista pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $list = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['shopping_lists']} WHERE id = %d AND user_id = %d",
                $list_id,
                $user['id']
            )
        );
        
        if (!$list) {
            return new WP_Error('not_found', 'Lista no encontrada', array('status' => 404));
        }
        
        // Eliminar lista
        $result = PriceExtractorDB::delete_shopping_list($list_id);
        
        if (!$result) {
            return new WP_Error('server_error', 'Error al eliminar lista', array('status' => 500));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    // Obtener ingresos
    public static function get_incomes($request) {
        $user = $request->get_param('user');
        
        $incomes = PriceExtractorDB::get_incomes_by_user_id($user['id']);
        
        $formatted_incomes = array();
        foreach ($incomes as $income) {
            $formatted_incomes[] = array(
                'id' => $income->id,
                'description' => $income->description,
                'amount' => (float) $income->amount,
                'category' => $income->category,
                'date' => $income->date,
                'isFixed' => (bool) $income->is_fixed,
                'frequency' => $income->frequency,
                'notes' => $income->notes,
                'createdAt' => $income->created_at,
            );
        }
        
        return new WP_REST_Response($formatted_incomes, 200);
    }
    
    // Añadir ingreso
    public static function add_income($request) {
        $user = $request->get_param('user');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['description']) || !isset($params['amount']) || empty($params['date'])) {
            return new WP_Error('bad_request', 'Descripción, monto y fecha son requeridos', array('status' => 400));
        }
        
        // Crear ingreso
        $income_id = PriceExtractorDB::create_income(
            $user['id'],
            $params['description'],
            (float) $params['amount'],
            $params['category'] ?? '',
            $params['date'],
            isset($params['isFixed']) ? (bool) $params['isFixed'] : false,
            $params['frequency'] ?? '',
            $params['notes'] ?? ''
        );
        
        if (!$income_id) {
            return new WP_Error('server_error', 'Error al crear ingreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $income_id,
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
            'isFixed' => isset($params['isFixed']) ? (bool) $params['isFixed'] : false,
            'frequency' => $params['frequency'] ?? '',
            'notes' => $params['notes'] ?? '',
            'createdAt' => date('Y-m-d H:i:s'),
        ), 201);
    }
    
    // Actualizar ingreso
    public static function update_income($request) {
        $user = $request->get_param('user');
        $income_id = $request->get_param('id');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['description']) || !isset($params['amount']) || empty($params['date'])) {
            return new WP_Error('bad_request', 'Descripción, monto y fecha son requeridos', array('status' => 400));
        }
        
        // Verificar que el ingreso pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $income = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['incomes']} WHERE id = %d AND user_id = %d",
                $income_id,
                $user['id']
            )
        );
        
        if (!$income) {
            return new WP_Error('not_found', 'Ingreso no encontrado', array('status' => 404));
        }
        
        // Actualizar ingreso
        $data = array(
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
            'is_fixed' => isset($params['isFixed']) ? (bool) $params['isFixed'] : false,
            'frequency' => $params['frequency'] ?? '',
            'notes' => $params['notes'] ?? '',
        );
        
        $result = PriceExtractorDB::update_income($income_id, $data);
        
        if ($result === false) {
            return new WP_Error('server_error', 'Error al actualizar ingreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $income_id,
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
            'isFixed' => isset($params['isFixed']) ? (bool) $params['isFixed'] : false,
            'frequency' => $params['frequency'] ?? '',
            'notes' => $params['notes'] ?? '',
        ), 200);
    }
    
    // Eliminar ingreso
    public static function delete_income($request) {
        $user = $request->get_param('user');
        $income_id = $request->get_param('id');
        
        // Verificar que el ingreso pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $income = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['incomes']} WHERE id = %d AND user_id = %d",
                $income_id,
                $user['id']
            )
        );
        
        if (!$income) {
            return new WP_Error('not_found', 'Ingreso no encontrado', array('status' => 404));
        }
        
        // Eliminar ingreso
        $result = PriceExtractorDB::delete_income($income_id);
        
        if (!$result) {
            return new WP_Error('server_error', 'Error al eliminar ingreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    // Obtener egresos
    public static function get_expenses($request) {
        $user = $request->get_param('user');
        
        $expenses = PriceExtractorDB::get_expenses_by_user_id($user['id']);
        
        $formatted_expenses = array();
        foreach ($expenses as $expense) {
            $formatted_expenses[] = array(
                'id' => $expense->id,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'category' => $expense->category,
                'date' => $expense->date,
                'createdAt' => $expense->created_at,
            );
        }
        
        return new WP_REST_Response($formatted_expenses, 200);
    }
    
    // Añadir egreso
    public static function add_expense($request) {
        $user = $request->get_param('user');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['description']) || !isset($params['amount']) || empty($params['date'])) {
            return new WP_Error('bad_request', 'Descripción, monto y fecha son requeridos', array('status' => 400));
        }
        
        // Crear egreso
        $expense_id = PriceExtractorDB::create_expense(
            $user['id'],
            $params['description'],
            (float) $params['amount'],
            $params['category'] ?? '',
            $params['date']
        );
        
        if (!$expense_id) {
            return new WP_Error('server_error', 'Error al crear egreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $expense_id,
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
            'createdAt' => date('Y-m-d H:i:s'),
        ), 201);
    }
    
    // Actualizar egreso
    public static function update_expense($request) {
        $user = $request->get_param('user');
        $expense_id = $request->get_param('id');
        $params = $request->get_params();
        
        // Validar parámetros
        if (empty($params['description']) || !isset($params['amount']) || empty($params['date'])) {
            return new WP_Error('bad_request', 'Descripción, monto y fecha son requeridos', array('status' => 400));
        }
        
        // Verificar que el egreso pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $expense = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['expenses']} WHERE id = %d AND user_id = %d",
                $expense_id,
                $user['id']
            )
        );
        
        if (!$expense) {
            return new WP_Error('not_found', 'Egreso no encontrado', array('status' => 404));
        }
        
        // Actualizar egreso
        $data = array(
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
        );
        
        $result = PriceExtractorDB::update_expense($expense_id, $data);
        
        if ($result === false) {
            return new WP_Error('server_error', 'Error al actualizar egreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array(
            'id' => $expense_id,
            'description' => $params['description'],
            'amount' => (float) $params['amount'],
            'category' => $params['category'] ?? '',
            'date' => $params['date'],
        ), 200);
    }
    
    // Eliminar egreso
    public static function delete_expense($request) {
        $user = $request->get_param('user');
        $expense_id = $request->get_param('id');
        
        // Verificar que el egreso pertenece al usuario
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $expense = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['expenses']} WHERE id = %d AND user_id = %d",
                $expense_id,
                $user['id']
            )
        );
        
        if (!$expense) {
            return new WP_Error('not_found', 'Egreso no encontrado', array('status' => 404));
        }
        
        // Eliminar egreso
        $result = PriceExtractorDB::delete_expense($expense_id);
        
        if (!$result) {
            return new WP_Error('server_error', 'Error al eliminar egreso', array('status' => 500));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
}
