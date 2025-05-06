<?php
/**
 * Gestión de la base de datos para Price Extractor
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

class PriceExtractorDB {
    
    // Nombres de las tablas
    public static function get_table_names() {
        global $wpdb;
        
        return array(
            'users' => $wpdb->prefix . 'price_extractor_users',
            'stores' => $wpdb->prefix . 'price_extractor_stores',
            'products' => $wpdb->prefix . 'price_extractor_products',
            'shopping_lists' => $wpdb->prefix . 'price_extractor_shopping_lists',
            'shopping_list_stores' => $wpdb->prefix . 'price_extractor_shopping_list_stores',
            'shopping_list_products' => $wpdb->prefix . 'price_extractor_shopping_list_products',
        );
    }
    
    // Crear tablas en la base de datos
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        $tables = self::get_table_names();
        
        // Tabla de usuarios
        $sql = "CREATE TABLE {$tables['users']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            wp_user_id bigint(20) DEFAULT NULL,
            name varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            password varchar(255) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY email (email),
            KEY wp_user_id (wp_user_id)
        ) $charset_collate;";
        
        // Tabla de tiendas
        $sql .= "CREATE TABLE {$tables['stores']} (
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
        $sql .= "CREATE TABLE {$tables['products']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            store_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL,
            price decimal(10,2) NOT NULL,
            quantity int(11) NOT NULL DEFAULT 1,
            image text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY store_id (store_id)
        ) $charset_collate;";
        
        // Tabla de listas de compras
        $sql .= "CREATE TABLE {$tables['shopping_lists']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            name varchar(255) NOT NULL,
            total decimal(10,2) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        // Tabla de tiendas en listas de compras
        $sql .= "CREATE TABLE {$tables['shopping_list_stores']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            shopping_list_id bigint(20) NOT NULL,
            store_id bigint(20) NOT NULL,
            name varchar(255) NOT NULL,
            PRIMARY KEY  (id),
            KEY shopping_list_id (shopping_list_id),
            KEY store_id (store_id)
        ) $charset_collate;";
        
        // Tabla de productos en listas de compras
        $sql .= "CREATE TABLE {$tables['shopping_list_products']} (
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
        
        // Ejecutar las consultas SQL
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    // Obtener usuario por email
    public static function get_user_by_email($email) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['users']} WHERE email = %s",
                $email
            )
        );
    }
    
    // Obtener usuario por ID
    public static function get_user_by_id($id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['users']} WHERE id = %d",
                $id
            )
        );
    }
    
    // Crear usuario
    public static function create_user($name, $email, $password) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['users'],
            array(
                'name' => $name,
                'email' => $email,
                'password' => $password,
            ),
            array('%s', '%s', '%s')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Obtener tiendas de un usuario
    public static function get_stores_by_user_id($user_id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tables['stores']} WHERE user_id = %d ORDER BY is_default DESC, name ASC",
                $user_id
            )
        );
    }
    
    // Crear tienda
    public static function create_store($user_id, $name, $is_default = 0, $image = null) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['stores'],
            array(
                'user_id' => $user_id,
                'name' => $name,
                'is_default' => $is_default ? 1 : 0,
                'image' => $image,
            ),
            array('%d', '%s', '%d', '%s')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Actualizar tienda
    public static function update_store($id, $data) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->update(
            $tables['stores'],
            $data,
            array('id' => $id),
            array('%s', '%d', '%s'),
            array('%d')
        );
    }
    
    // Eliminar tienda
    public static function delete_store($id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->delete(
            $tables['stores'],
            array('id' => $id),
            array('%d')
        );
    }
    
    // Obtener productos de un usuario
    public static function get_products_by_user_id($user_id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tables['products']} WHERE user_id = %d",
                $user_id
            )
        );
    }
    
    // Crear producto
    public static function create_product($user_id, $store_id, $title, $price, $quantity, $image = null) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['products'],
            array(
                'user_id' => $user_id,
                'store_id' => $store_id,
                'title' => $title,
                'price' => $price,
                'quantity' => $quantity,
                'image' => $image,
            ),
            array('%d', '%d', '%s', '%f', '%d', '%s')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Actualizar producto
    public static function update_product($id, $data) {
        global $wpdb;
        $tables = self::get_table_names();
        
        // Preparar los tipos de datos para la actualización
        $formats = array();
        foreach ($data as $key => $value) {
            if ($key === 'title') {
                $formats[] = '%s';
            } elseif ($key === 'price') {
                $formats[] = '%f';
            } elseif ($key === 'quantity' || $key === 'store_id') {
                $formats[] = '%d';
            } elseif ($key === 'image') {
                $formats[] = '%s';
            }
        }
        
        return $wpdb->update(
            $tables['products'],
            $data,
            array('id' => $id),
            $formats,
            array('%d')
        );
    }
    
    // Eliminar producto
    public static function delete_product($id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->delete(
            $tables['products'],
            array('id' => $id),
            array('%d')
        );
    }
    
    // Obtener listas de compras de un usuario
    public static function get_shopping_lists_by_user_id($user_id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tables['shopping_lists']} WHERE user_id = %d ORDER BY created_at DESC",
                $user_id
            )
        );
    }
    
    // Crear lista de compras
    public static function create_shopping_list($user_id, $name, $total) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['shopping_lists'],
            array(
                'user_id' => $user_id,
                'name' => $name,
                'total' => $total,
            ),
            array('%d', '%s', '%f')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Añadir tienda a lista de compras
    public static function add_store_to_shopping_list($shopping_list_id, $store_id, $name) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['shopping_list_stores'],
            array(
                'shopping_list_id' => $shopping_list_id,
                'store_id' => $store_id,
                'name' => $name,
            ),
            array('%d', '%d', '%s')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Añadir producto a lista de compras
    public static function add_product_to_shopping_list($shopping_list_id, $store_id, $title, $price, $quantity, $image = null) {
        global $wpdb;
        $tables = self::get_table_names();
        
        $result = $wpdb->insert(
            $tables['shopping_list_products'],
            array(
                'shopping_list_id' => $shopping_list_id,
                'store_id' => $store_id,
                'title' => $title,
                'price' => $price,
                'quantity' => $quantity,
                'image' => $image,
            ),
            array('%d', '%d', '%s', '%f', '%d', '%s')
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // Obtener tiendas de una lista de compras
    public static function get_stores_by_shopping_list_id($shopping_list_id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tables['shopping_list_stores']} WHERE shopping_list_id = %d",
                $shopping_list_id
            )
        );
    }
    
    // Obtener productos de una lista de compras
    public static function get_products_by_shopping_list_id($shopping_list_id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tables['shopping_list_products']} WHERE shopping_list_id = %d",
                $shopping_list_id
            )
        );
    }
    
    // Eliminar lista de compras
    public static function delete_shopping_list($id) {
        global $wpdb;
        $tables = self::get_table_names();
        
        // Eliminar productos de la lista
        $wpdb->delete(
            $tables['shopping_list_products'],
            array('shopping_list_id' => $id),
            array('%d')
        );
        
        // Eliminar tiendas de la lista
        $wpdb->delete(
            $tables['shopping_list_stores'],
            array('shopping_list_id' => $id),
            array('%d')
        );
        
        // Eliminar la lista
        return $wpdb->delete(
            $tables['shopping_lists'],
            array('id' => $id),
            array('%d')
        );
    }
}
