<?php

class PriceExtractorAPI {

    // Actualizar producto - Modificar para manejar correctamente la eliminación de imágenes
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
        // Importante: permitir explícitamente valores null para eliminar la imagen
        if (array_key_exists('image', $params)) {
            $data['image'] = $params['image'];
            // Registrar en el log para depuración
            error_log('Actualizando imagen del producto ' . $product_id . ': ' . ($params['image'] === null ? 'NULL' : $params['image']));
        }
        
        $result = PriceExtractorDB::update_product($product_id, $data);
        
        if ($result === false) {
            return new WP_Error('server_error', 'Error al actualizar producto', array('status' => 500));
        }
        
        // Obtener el producto actualizado para devolverlo en la respuesta
        $updated_product = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$tables['products']} WHERE id = %d",
                $product_id
            )
        );
        
        return new WP_REST_Response(array(
            'id' => $product_id,
            'title' => $params['title'],
            'price' => (float) $params['price'],
            'quantity' => (int) $params['quantity'],
            'image' => $updated_product->image, // Usar el valor actualizado de la base de datos
            'storeId' => isset($params['storeId']) ? $params['storeId'] : $product->store_id,
        ), 200);
    }
}
