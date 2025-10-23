# Sistema de Recuperación de Contraseña

## Descripción

Sistema completo de recuperación de contraseña para la aplicación Price Extractor, implementado con Next.js en el frontend y PHP/WordPress en el backend.

## Características

- 🔐 Tokens seguros de un solo uso
- ⏱️ Expiración automática de tokens (1 hora)
- 📧 Envío de emails con instrucciones
- ✅ Validación de contraseñas
- 🎨 Interfaz de usuario intuitiva
- 🔒 Medidas de seguridad implementadas

## Flujo de Usuario

1. Usuario hace clic en "¿Olvidaste tu contraseña?" en la página de login
2. Ingresa su email en `/forgot-password`
3. Recibe un email con un enlace único
4. Hace clic en el enlace (válido por 1 hora)
5. Ingresa su nueva contraseña en `/reset-password`
6. Es redirigido al login para iniciar sesión

## Endpoints de la API

### POST /auth/forgot-password
Solicita un token de recuperación de contraseña.

**Request:**
\`\`\`json
{
  "email": "usuario@ejemplo.com"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Si el correo existe, recibirás un enlace de recuperación"
}
\`\`\`

### POST /auth/reset-password
Restablece la contraseña usando un token válido.

**Request:**
\`\`\`json
{
  "token": "abc123...",
  "password": "nuevaContraseña123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
\`\`\`

### POST /auth/verify-reset-token (opcional)
Verifica si un token es válido antes de mostrar el formulario.

**Request:**
\`\`\`json
{
  "token": "abc123..."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "valid": true
}
\`\`\`

## Estructura de la Base de Datos

### Tabla: wp_price_extractor_password_resets

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID autoincremental |
| user_id | INT | ID del usuario |
| token | VARCHAR(255) | Token único de recuperación |
| expires_at | DATETIME | Fecha de expiración |
| used | TINYINT(1) | Si el token ya fue usado |
| created_at | TIMESTAMP | Fecha de creación |

## Seguridad

- Tokens generados con `random_bytes(32)` (64 caracteres hexadecimales)
- Contraseñas hasheadas con bcrypt (cost 12)
- Tokens de un solo uso
- Expiración automática de 1 hora
- No se revela si un email existe en el sistema
- Tokens anteriores se invalidan al solicitar uno nuevo

## Configuración

### Variables de entorno necesarias:

No se requieren variables de entorno adicionales. El sistema usa la configuración existente de WordPress y la API.

### Configuración de CORS:

Asegúrate de que tu dominio esté en la lista de orígenes permitidos en `api.php`:

\`\`\`php
$allowed_origins = [
    'http://localhost:3000',
    'https://tu-dominio.com',
    // ... otros dominios
];
\`\`\`

## Personalización

### Personalizar el email:

Edita el contenido HTML en `api-password-reset-endpoints.php`:

\`\`\`php
$message = "
    <html>
    <head>
        <style>
            /* Tus estilos aquí */
        </style>
    </head>
    <body>
        <!-- Tu contenido aquí -->
    </body>
    </html>
";
\`\`\`

### Cambiar tiempo de expiración:

En `api-password-reset-endpoints.php`, modifica:

\`\`\`php
// De 1 hora a 2 horas:
$expires_at = date('Y-m-d H:i:s', strtotime('+2 hours'));
\`\`\`

### Cambiar longitud mínima de contraseña:

En `api-password-reset-endpoints.php` y `app/reset-password/page.tsx`:

\`\`\`php
// PHP
if (strlen($data['password']) < 8) { // Cambiar de 6 a 8
\`\`\`

\`\`\`typescript
// TypeScript
if (password.length < 8) { // Cambiar de 6 a 8
\`\`\`

## Testing

### Probar localmente:

1. Asegúrate de que la tabla esté creada
2. Configura un servicio de email de prueba (MailHog, Mailtrap, etc.)
3. Solicita recuperación con un email válido
4. Verifica que el email llegue
5. Usa el token para restablecer la contraseña

### Comandos útiles:

\`\`\`sql
-- Ver tokens activos
SELECT * FROM wp_price_extractor_password_resets 
WHERE used = 0 AND expires_at > NOW();

-- Limpiar tokens expirados
DELETE FROM wp_price_extractor_password_resets 
WHERE expires_at < NOW() OR used = 1;

-- Ver último token de un usuario
SELECT * FROM wp_price_extractor_password_resets 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
\`\`\`

## Soporte

Para problemas o preguntas, consulta el archivo `INSTRUCCIONES_RECUPERACION_PASSWORD.md` para instrucciones detalladas de implementación.
