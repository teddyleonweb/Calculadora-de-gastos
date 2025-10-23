# Instrucciones para Implementar Recuperación de Contraseña

## 1. Crear la tabla en la base de datos

Ejecuta el script SQL que se encuentra en `scripts/create-password-reset-table.sql` en tu base de datos de WordPress.

Puedes hacerlo de dos formas:

### Opción A: Desde phpMyAdmin
1. Accede a phpMyAdmin
2. Selecciona tu base de datos
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo `create-password-reset-table.sql`
5. Haz clic en "Continuar"

### Opción B: Desde la línea de comandos
\`\`\`bash
mysql -u tu_usuario -p tu_base_de_datos < scripts/create-password-reset-table.sql
\`\`\`

## 2. Agregar los endpoints a tu API

Abre el archivo `api.php` en tu servidor WordPress y agrega los siguientes casos al switch principal, justo después de los endpoints de autenticación existentes (después del caso `/auth/user`):

Los endpoints completos están en el archivo `api-password-reset-endpoints.php`. Copia todo el contenido de ese archivo y pégalo en tu `api.php` dentro del switch principal.

### Endpoints que se agregarán:

1. **POST /auth/forgot-password** - Solicita recuperación de contraseña
   - Recibe: `{ email: string }`
   - Genera un token único
   - Envía un email con el enlace de recuperación
   - El token expira en 1 hora

2. **POST /auth/reset-password** - Restablece la contraseña
   - Recibe: `{ token: string, password: string }`
   - Valida el token
   - Actualiza la contraseña del usuario
   - Marca el token como usado

3. **POST /auth/verify-reset-token** (opcional) - Verifica si un token es válido
   - Recibe: `{ token: string }`
   - Retorna: `{ valid: boolean }`

## 3. Configurar el envío de emails

La API usa la función `wp_mail()` de WordPress para enviar emails. Asegúrate de que tu servidor WordPress esté configurado correctamente para enviar correos.

### Verificar configuración de email:

1. Instala el plugin "WP Mail SMTP" o similar si tienes problemas con el envío de emails
2. Configura un servicio SMTP (Gmail, SendGrid, etc.)
3. Prueba el envío de emails desde WordPress

### Personalizar el email:

En el archivo `api-password-reset-endpoints.php`, busca la sección del email y personaliza:
- El asunto del correo
- El contenido HTML
- El remitente (From)
- Los estilos CSS

## 4. Verificar las URLs de recuperación

En el endpoint `/auth/forgot-password`, la URL de recuperación se construye así:

\`\`\`php
$reset_url = (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'http://localhost:3000') . '/reset-password?token=' . $token;
\`\`\`

Asegúrate de que:
- Tu aplicación Next.js esté configurada en los orígenes permitidos en CORS
- La URL de producción esté correctamente configurada

## 5. Probar la funcionalidad

### Flujo completo:

1. **Solicitar recuperación:**
   - Ve a `/forgot-password`
   - Ingresa tu email
   - Verifica que recibas el correo

2. **Restablecer contraseña:**
   - Haz clic en el enlace del correo
   - Ingresa tu nueva contraseña
   - Confirma la contraseña
   - Verifica que seas redirigido al login

3. **Iniciar sesión:**
   - Usa tu nueva contraseña para iniciar sesión

## 6. Seguridad

La implementación incluye las siguientes medidas de seguridad:

- ✅ Tokens únicos generados con `random_bytes(32)`
- ✅ Tokens con expiración de 1 hora
- ✅ Tokens de un solo uso (se marcan como usados)
- ✅ Contraseñas hasheadas con bcrypt (cost 12)
- ✅ Validación de longitud mínima de contraseña (6 caracteres)
- ✅ No se revela si un email existe en el sistema
- ✅ Tokens anteriores se invalidan al solicitar uno nuevo

## 7. Mantenimiento

### Limpiar tokens expirados

Es recomendable crear un cron job para limpiar tokens expirados periódicamente:

\`\`\`sql
DELETE FROM wp_price_extractor_password_resets 
WHERE expires_at < NOW() OR used = 1;
\`\`\`

Puedes agregar esto como un cron job de WordPress o ejecutarlo manualmente cada cierto tiempo.

## 8. Troubleshooting

### El email no llega:
- Verifica la configuración SMTP de WordPress
- Revisa la carpeta de spam
- Verifica los logs de WordPress
- Usa un plugin de logging de emails como "Email Log"

### Token inválido o expirado:
- Verifica que la tabla `wp_price_extractor_password_resets` exista
- Verifica que el token no haya expirado (1 hora)
- Verifica que el token no haya sido usado

### Error al actualizar contraseña:
- Verifica los permisos de la base de datos
- Revisa los logs de PHP/WordPress
- Verifica que la función `password_hash()` esté disponible

## 9. Archivos modificados/creados

- ✅ `scripts/create-password-reset-table.sql` - Script SQL para crear la tabla
- ✅ `api-password-reset-endpoints.php` - Endpoints de la API
- ✅ `app/forgot-password/page.tsx` - Página para solicitar recuperación
- ✅ `app/reset-password/page.tsx` - Página para restablecer contraseña
- ✅ `services/auth-service.ts` - Métodos agregados al servicio
- ✅ `contexts/auth-context.tsx` - Métodos agregados al contexto
- ✅ `app/login/page.tsx` - Enlace a "¿Olvidaste tu contraseña?"

## 10. Próximos pasos opcionales

- [ ] Agregar límite de intentos de recuperación por IP
- [ ] Agregar notificación por email cuando se cambia la contraseña
- [ ] Agregar autenticación de dos factores
- [ ] Personalizar más el diseño del email
- [ ] Agregar analytics para rastrear uso de recuperación
