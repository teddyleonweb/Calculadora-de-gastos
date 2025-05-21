<?php
/**
 * Gestión de autenticación para Price Extractor
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

class PriceExtractorAuth {
    
    // Crear roles y capacidades
    public static function create_roles() {
        // Añadir rol de usuario de Price Extractor
        add_role(
            'price_extractor_user',
            'Price Extractor User',
            array(
                'read' => true,
                'price_extractor_access' => true,
            )
        );
    }
    
    // Generar token JWT
    public static function generate_token($user_id, $email, $name) {
        // Obtener la clave secreta
        $secret_key = self::get_jwt_secret();
        
        // Crear payload
        $payload = array(
            'id' => $user_id,
            'email' => $email,
            'name' => $name,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60), // 7 días
        );
        
        // Codificar token
        return self::jwt_encode($payload, $secret_key);
    }
    
    // Verificar token JWT
    public static function verify_token($token) {
        // Obtener la clave secreta
        $secret_key = self::get_jwt_secret();
        
        try {
            // Decodificar token
            $payload = self::jwt_decode($token, $secret_key);
            
            // Verificar expiración
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
            return $payload;
        } catch (Exception $e) {
            return false;
        }
    }
    
    // Obtener clave secreta para JWT
    private static function get_jwt_secret() {
        // Intentar obtener la clave de las opciones
        $secret_key = get_option('price_extractor_jwt_secret');
        
        // Si no existe, crear una nueva
        if (!$secret_key) {
            $secret_key = bin2hex(random_bytes(32));
            update_option('price_extractor_jwt_secret', $secret_key);
        }
        
        return $secret_key;
    }
    
    // Codificar JWT
    private static function jwt_encode($payload, $key) {
        // Cabecera
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $header = self::base64url_encode($header);
        
        // Payload
        $payload = json_encode($payload);
        $payload = self::base64url_encode($payload);
        
        // Firma
        $signature = hash_hmac('sha256', $header . '.' . $payload, $key, true);
        $signature = self::base64url_encode($signature);
        
        // Token completo
        return $header . '.' . $payload . '.' . $signature;
    }
    
    // Decodificar JWT
    private static function jwt_decode($token, $key) {
        // Dividir token
        $parts = explode('.', $token);
        
        if (count($parts) != 3) {
            throw new Exception('Token inválido');
        }
        
        list($header, $payload, $signature) = $parts;
        
        // Verificar firma
        $valid_signature = hash_hmac('sha256', $header . '.' . $payload, $key, true);
        $valid_signature = self::base64url_encode($valid_signature);
        
        if ($signature !== $valid_signature) {
            throw new Exception('Firma inválida');
        }
        
        // Decodificar payload
        $payload = json_decode(self::base64url_decode($payload), true);
        
        return $payload;
    }
    
    // Codificar base64url
    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    // Decodificar base64url
    private static function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
    
    // Hashear contraseña
    public static function hash_password($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }
    
    // Verificar contraseña
    public static function verify_password($password, $hash) {
        return password_verify($password, $hash);
    }
}
