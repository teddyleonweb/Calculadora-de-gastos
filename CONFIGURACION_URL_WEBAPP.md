# Configuración de URL de la Webapp

Para que el sistema de recuperación de contraseña funcione correctamente, necesitas configurar la URL de tu webapp.

## Opción 1: Variable de entorno (Recomendado)

Agrega esta variable de entorno en tu servidor donde está alojada la API PHP:

\`\`\`bash
WEBAPP_URL=https://tu-dominio.com
\`\`\`

Por ejemplo:
- Producción: `WEBAPP_URL=https://priceextractor.com`
- Desarrollo: `WEBAPP_URL=http://localhost:3000`

## Opción 2: Modificar directamente en el código

Si no puedes usar variables de entorno, edita el archivo `api.php` en la línea donde dice:

\`\`\`php
$webapp_url = getenv('WEBAPP_URL') ?: 'http://localhost:3000';
\`\`\`

Y cámbialo por tu URL real:

\`\`\`php
$webapp_url = 'https://tu-dominio.com';
\`\`\`

## Verificación

Una vez configurado, cuando un usuario solicite recuperar su contraseña:
1. Recibirá un email con un enlace como: `https://tu-dominio.com/reset-password?token=abc123...`
2. Al hacer clic, será redirigido a tu webapp (no a WordPress)
3. Podrá establecer su nueva contraseña desde la interfaz de tu aplicación

## Nota importante

Asegúrate de que la URL no termine con `/` (barra diagonal).

✅ Correcto: `https://tu-dominio.com`
❌ Incorrecto: `https://tu-dominio.com/`
