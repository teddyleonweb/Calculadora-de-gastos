<?php

class Price_Extractor_Database {

    private static $instance;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        // Private constructor to prevent direct instantiation.
    }

    public static function install() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_names = self::get_table_names();

        $sql_products = "CREATE TABLE IF NOT EXISTS {$table_names['products']} (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            price decimal(10,2) NOT NULL,
            image varchar(255) NULL,
            quantity int(11) NOT NULL DEFAULT 1,
            store_id mediumint(9) NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        $sql_stores = "CREATE TABLE IF NOT EXISTS {$table_names['stores']} (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            url varchar(255) NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql_products );
        dbDelta( $sql_stores );
    }

    public static function uninstall() {
        global $wpdb;
        $table_names = self::get_table_names();

        $wpdb->query( "DROP TABLE IF EXISTS {$table_names['products']}" );
        $wpdb->query( "DROP TABLE IF EXISTS {$table_names['stores']}" );
    }

    public static function get_table_names() {
        global $wpdb;
        $prefix = $wpdb->prefix . 'price_extractor_';

        return array(
            'products' => $prefix . 'products',
            'stores' => $prefix . 'stores',
        );
    }

    // Stores
    public static function create_store($name, $url) {
        global $wpdb;
        $tables = self::get_table_names();

        $result = $wpdb->insert(
            $tables['stores'],
            array(
                'name' => $name,
                'url' => $url,
            ),
            array(
                '%s',
                '%s',
            )
        );

        if ($result === false && $wpdb->last_error) {
            error_log('Error al crear tienda: ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    public static function get_store($id) {
        global $wpdb;
        $tables = self::get_table_names();

        $sql = $wpdb->prepare("SELECT * FROM {$tables['stores']} WHERE id = %d", $id);
        return $wpdb->get_row($sql, OBJECT);
    }

    public static function get_stores() {
        global $wpdb;
        $tables = self::get_table_names();

        $sql = "SELECT * FROM {$tables['stores']}";
        return $wpdb->get_results($sql, OBJECT);
    }

    public static function update_store($id, $name, $url) {
        global $wpdb;
        $tables = self::get_table_names();

        $result = $wpdb->update(
            $tables['stores'],
            array(
                'name' => $name,
                'url' => $url,
            ),
            array('id' => $id),
            array(
                '%s',
                '%s',
            ),
            array('%d')
        );

        if ($result === false && $wpdb->last_error) {
            error_log('Error al actualizar tienda: ' . $wpdb->last_error);
            return false;
        }

        return $result !== false;
    }

    public static function delete_store($id) {
        global $wpdb;
        $tables = self::get_table_names();

        $result = $wpdb->delete(
            $tables['stores'],
            array('id' => $id),
            array('%d')
        );

        if ($result === false && $wpdb->last_error) {
            error_log('Error al eliminar tienda: ' . $wpdb->last_error);
            return false;
        }

        return $result !== false;
    }

    // Products
    public static function create_product($title, $price, $image, $quantity, $store_id) {
        global $wpdb;
        $tables = self::get_table_names();

        $result = $wpdb->insert(
            $tables['products'],
            array(
                'title' => $title,
                'price' => $price,
                'image' => $image,
                'quantity' => $quantity,
                'store_id' => $store_id,
            ),
            array(
                '%s',
                '%f',
                '%s',
                '%d',
                '%d',
            )
        );

        if ($result === false && $wpdb->last_error) {
            error_log('Error al crear producto: ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    public static function get_product($id) {
        global $wpdb;
        $tables = self::get_table_names();

        $sql = $wpdb->prepare("SELECT * FROM {$tables['products']} WHERE id = %d", $id);
        return $wpdb->get_row($sql, OBJECT);
    }

    public static function get_products($store_id = null) {
        global $wpdb;
        $tables = self::get_table_names();

        $sql = "SELECT * FROM {$tables['products']}";
        if ($store_id) {
            $sql .= " WHERE store_id = " . intval($store_id);
        }
        return $wpdb->get_results($sql, OBJECT);
    }

    // Actualizar producto - Modificar para manejar correctamente la eliminación de imágenes
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
                // Registrar en el log para depuración
                error_log('Formato de imagen para actualización: ' . ($value === null ? 'NULL' : 'STRING'));
            }
        }
        
        // Asegurarse de que la actualización se realiza correctamente
        $result = $wpdb->update(
            $tables['products'],
            $data,
            array('id' => $id),
            $formats,
            array('%d')
        );
        
        if ($result === false && $wpdb->last_error) {
            error_log('Error al actualizar producto: ' . $wpdb->last_error);
            return false;
        }
        
        return $result !== false;
    }

    public static function delete_product($id) {
        global $wpdb;
        $tables = self::get_table_names();

        $result = $wpdb->delete(
            $tables['products'],
            array('id' => $id),
            array('%d')
        );

        if ($result === false && $wpdb->last_error) {
            error_log('Error al eliminar producto: ' . $wpdb->last_error);
            return false;
        }

        return $result !== false;
    }
}
