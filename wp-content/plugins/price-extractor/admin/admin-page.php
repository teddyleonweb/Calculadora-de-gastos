<div class="wrap">
    <h1>Price Extractor</h1>
    
    <div class="card">
        <h2>Información del Plugin</h2>
        <p>Este plugin proporciona una API REST para la aplicación de extracción de precios.</p>
        <p>Versión: <?php echo PRICE_EXTRACTOR_VERSION; ?></p>
    </div>
    
    <div class="card">
        <h2>Endpoints de la API</h2>
        <p>La API está disponible en: <code><?php echo rest_url('price-extractor/v1'); ?></code></p>
        
        <h3>Autenticación</h3>
        <ul>
            <li><code>POST /auth/register</code> - Registrar un nuevo usuario</li>
            <li><code>POST /auth/login</code> - Iniciar sesión</li>
        </ul>
        
        <h3>Tiendas</h3>
        <ul>
            <li><code>GET /stores</code> - Obtener todas las tiendas del usuario</li>
            <li><code>POST /stores</code> - Crear una nueva tienda</li>
            <li><code>PUT /stores/{id}</code> - Actualizar una tienda</li>
            <li><code>DELETE /stores/{id}</code> - Eliminar una tienda</li>
        </ul>
        
        <h3>Productos</h3>
        <ul>
            <li><code>GET /products</code> - Obtener todos los productos del usuario</li>
            <li><code>POST /products</code> - Crear un nuevo producto</li>
            <li><code>PUT /products/{id}</code> - Actualizar un producto</li>
            <li><code>DELETE /products/{id}</code> - Eliminar un producto</li>
        </ul>
        
        <h3>Listas de Compras</h3>
        <ul>
            <li><code>GET /shopping-lists</code> - Obtener todas las listas de compras del usuario</li>
            <li><code>POST /shopping-lists</code> - Crear una nueva lista de compras</li>
            <li><code>GET /shopping-lists/{id}</code> - Obtener una lista de compras específica</li>
            <li><code>DELETE /shopping-lists/{id}</code> - Eliminar una lista de compras</li>
        </ul>
    </div>
    
    <div class="card">
        <h2>Estadísticas</h2>
        <?php
        global $wpdb;
        $tables = PriceExtractorDB::get_table_names();
        
        $users_count = $wpdb->get_var("SELECT COUNT(*) FROM {$tables['users']}");
        $stores_count = $wpdb->get_var("SELECT COUNT(*) FROM {$tables['stores']}");
        $products_count = $wpdb->get_var("SELECT COUNT(*) FROM {$tables['products']}");
        $shopping_lists_count = $wpdb->get_var("SELECT COUNT(*) FROM {$tables['shopping_lists']}");
        ?>
        
        <ul>
            <li><strong>Usuarios:</strong> <?php echo $users_count; ?></li>
            <li><strong>Tiendas:</strong> <?php echo $stores_count; ?></li>
            <li><strong>Productos:</strong> <?php echo $products_count; ?></li>
            <li><strong>Listas de Compras:</strong> <?php echo $shopping_lists_count; ?></li>
        </ul>
    </div>
</div>
