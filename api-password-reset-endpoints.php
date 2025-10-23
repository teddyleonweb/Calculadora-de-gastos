<?php
/**
 * Endpoints adicionales para recuperación de contraseña
 * Agregar estos casos al switch principal de api.php
 */

// AGREGAR ESTOS CASOS AL SWITCH PRINCIPAL EN api.php, DESPUÉS DE LOS ENDPOINTS DE AUTH EXISTENTES:

// Ruta para solicitar recuperación de contraseña
case $path === '/auth/forgot-password' && $method === 'POST':
    // Validar datos
    if (empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'El correo electrónico es requerido']);
        exit;
    }
    
    // Buscar el usuario
    global $wpdb;
    $user = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_users WHERE email = %s",
        $data['email']
    ));
    
    if (!$user) {
        // Por seguridad, no revelar si el email existe o no
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Si el correo existe, recibirás un enlace de recuperación'
        ]);
        exit;
    }
    
    // Generar token único
    $token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Invalidar tokens anteriores del usuario
    $wpdb->update(
        $wpdb->prefix . 'price_extractor_password_resets',
        ['used' => 1],
        ['user_id' => $user->id, 'used' => 0],
        ['%d'],
        ['%d', '%d']
    );
    
    // Insertar nuevo token
    $result = $wpdb->insert(
        $wpdb->prefix . 'price_extractor_password_resets',
        [
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => $expires_at,
            'used' => 0
        ],
        ['%d', '%s', '%s', '%d']
    );
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al generar token de recuperación']);
        exit;
    }
    
    // Construir URL de recuperación
    $reset_url = (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'http://localhost:3000') . '/reset-password?token=' . $token;
    
    // Enviar email
    $to = $user->email;
    $subject = 'Recuperación de contraseña - Price Extractor';
    $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 30px; }
                .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Recuperación de Contraseña</h1>
                </div>
                <div class='content'>
                    <p>Hola {$user->name},</p>
                    <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
                    <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                    <p style='text-align: center;'>
                        <a href='{$reset_url}' class='button'>Restablecer Contraseña</a>
                    </p>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style='word-break: break-all; color: #4F46E5;'>{$reset_url}</p>
                    <p><strong>Este enlace expirará en 1 hora.</strong></p>
                </div>
                <div class='footer'>
                    <p>Este es un correo automático, por favor no respondas.</p>
                </div>
            </div>
        </body>
        </html>
    ";
    
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: Price Extractor <noreply@priceextractor.com>'
    ];
    
    wp_mail($to, $subject, $message, $headers);
    
    log_to_file("Token de recuperación generado para usuario: " . $user->email);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Si el correo existe, recibirás un enlace de recuperación'
    ]);
    break;

// Ruta para restablecer contraseña con token
case $path === '/auth/reset-password' && $method === 'POST':
    // Validar datos
    if (empty($data['token']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token y nueva contraseña son requeridos']);
        exit;
    }
    
    // Validar longitud de contraseña
    if (strlen($data['password']) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
        exit;
    }
    
    // Buscar el token
    global $wpdb;
    $reset_token = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_password_resets 
         WHERE token = %s AND used = 0 AND expires_at > NOW()",
        $data['token']
    ));
    
    if (!$reset_token) {
        http_response_code(400);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }
    
    // Obtener el usuario
    $user = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_users WHERE id = %d",
        $reset_token->user_id
    ));
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit;
    }
    
    // Hashear la nueva contraseña
    $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    
    // Actualizar la contraseña del usuario
    $result = $wpdb->update(
        $wpdb->prefix . 'price_extractor_users',
        ['password' => $hashed_password],
        ['id' => $user->id],
        ['%s'],
        ['%d']
    );
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar contraseña']);
        exit;
    }
    
    // Marcar el token como usado
    $wpdb->update(
        $wpdb->prefix . 'price_extractor_password_resets',
        ['used' => 1],
        ['id' => $reset_token->id],
        ['%d'],
        ['%d']
    );
    
    log_to_file("Contraseña restablecida para usuario: " . $user->email);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Contraseña actualizada correctamente'
    ]);
    break;

// Ruta para verificar si un token es válido (opcional, para UX)
case $path === '/auth/verify-reset-token' && $method === 'POST':
    // Validar datos
    if (empty($data['token'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token es requerido']);
        exit;
    }
    
    // Buscar el token
    global $wpdb;
    $reset_token = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}price_extractor_password_resets 
         WHERE token = %s AND used = 0 AND expires_at > NOW()",
        $data['token']
    ));
    
    if (!$reset_token) {
        http_response_code(400);
        echo json_encode(['valid' => false, 'error' => 'Token inválido o expirado']);
        exit;
    }
    
    http_response_code(200);
    echo json_encode(['valid' => true]);
    break;

?>
