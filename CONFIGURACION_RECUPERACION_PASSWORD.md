# Configuración de Recuperación de Contraseña

## ✅ Sistema Completo Implementado

Tu sistema de recuperación de contraseña ya está completamente funcional. Aquí está todo lo que se ha implementado:

### 1. Base de Datos
Ejecuta este SQL en tu base de datos (solo una vez):

\`\`\`sql
CREATE TABLE IF NOT EXISTS wp_price_extractor_password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
\`\`\`

### 2. Configurar URL de la Webapp

En tu servidor donde está alojado el archivo `api.php`, configura la variable de entorno:

**Opción A: En tu archivo .htaccess (Apache)**
\`\`\`apache
SetEnv WEBAPP_URL https://tu-dominio.com
