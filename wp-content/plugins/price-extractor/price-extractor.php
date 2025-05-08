<?php
/**
 * Plugin Name: Price Extractor
 * Description: Plugin para gestionar la aplicación de extracción de precios
 * Version: 1.0
 * Author: Teddy León
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes
define('PRICE_EXTRACTOR_VERSION', '1.0');
define('PRICE_EXTRACTOR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PRICE_EXTRACTOR_PLUGIN_URL', plugin_dir_url(__FILE__));

// Incluir archivos necesarios
require_once PRICE_EXTRACTOR_PLUGIN_DIR . 'includes/database.php';
require_once PRICE_EXTRACTOR_PLUGIN_DIR . 'includes/api.php';
require_once PRICE_EXTRACTOR_PLUGIN_DIR . 'includes/auth.php';

// Clase principal del plugin
class PriceExtractor {
    
    // Constructor
    public function __construct() {
        // Activación y desactivación del plugin
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Inicializar componentes
        add_action('init', array($this, 'init'));
        
        // Registrar endpoints de la API REST
        add_action('rest_api_init', array('PriceExtractorAPI', 'register_routes'));
    }
    
    // Función de activación
    public function activate() {
        // Crear tablas en la base de datos
        PriceExtractorDB::create_tables();
        
        // Crear roles y capacidades
        PriceExtractorAuth::create_roles();
        
        // Limpiar caché de reescritura
        flush_rewrite_rules();
    }
    
    // Función de desactivación
    public function deactivate() {
        // Limpiar caché de reescritura
        flush_rewrite_rules();
    }
    
    // Inicializar el plugin
    public function init() {
        // Registrar scripts y estilos si es necesario
        if (is_admin()) {
            // Cargar scripts de administración
            add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
            
            // Añadir menú de administración
            add_action('admin_menu', array($this, 'admin_menu'));
        }
    }
    
    // Cargar scripts de administración
    public function admin_scripts() {
        wp_enqueue_style('price-extractor-admin', PRICE_EXTRACTOR_PLUGIN_URL . 'assets/css/admin.css', array(), PRICE_EXTRACTOR_VERSION);
        wp_enqueue_script('price-extractor-admin', PRICE_EXTRACTOR_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), PRICE_EXTRACTOR_VERSION, true);
    }
    
    // Añadir menú de administración
    public function admin_menu() {
        add_menu_page(
            'Price Extractor', 
            'Price Extractor', 
            'manage_options', 
            'price-extractor', 
            array($this, 'admin_page'), 
            'dashicons-cart', 
            30
        );
    }
    
    // Página de administración
    public function admin_page() {
        include PRICE_EXTRACTOR_PLUGIN_DIR . 'admin/admin-page.php';
    }
}

// Inicializar el plugin
$price_extractor = new PriceExtractor();
