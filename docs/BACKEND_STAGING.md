# Backend staging de NUGA Team Console

## Frontend en el mismo origen

Después de ejecutar `VITE_APP_MODE=staging VITE_NUGA_API_URL=/api npm run build`,
NUGA Console API sirve `dist/` desde el mismo host y puerto que `/api/v1`.
Esto evita CORS y conserva la cookie HttpOnly como same-origin. El servicio sigue
escuchando únicamente en `127.0.0.1:8787`; durante laboratorio se accede mediante
un túnel SSH local, sin publicar el puerto en la LAN o Internet.

`NUGA_PUBLIC_ORIGIN` debe coincidir con el origen usado por el navegador. Para el
túnel local canónico es `http://127.0.0.1:8787`.

## Estado actual

El repositorio contiene una base de NUGA Console API construida con Express, ya
incluido en las dependencias existentes. Esta base **no se conecta** todavía con
Hermes, Kanban, MikroMCP, RouterOS, Google ni Supabase.

## Propiedades de seguridad

- El modo del servidor debe ser `staging` o `production`; `demo` está prohibido.
- La configuración falla si falta un secreto de sesión de al menos 32 caracteres.
- Escucha en `127.0.0.1` por defecto.
- Toda ruta `/api/v1` exige `X-Nuga-Mode` compatible.
- Las mutaciones exigen un `Origin` exacto.
- El cuerpo JSON está limitado a 256 KiB.
- Las respuestas eliminan caché y agregan un identificador de correlación.
- Las capacidades están cerradas y `writesEnabled=false`.
- Ramiro inicia sesión con un hash `scrypt-v1`; la contraseña nunca se almacena.
- La sesión firmada expira después de ocho horas y usa cookie `HttpOnly`, `SameSite=Strict` y `Secure` bajo HTTPS.
- El cierre de sesión exige el token CSRF asociado a la sesión.
- Los recursos Hermes requieren autenticación y responden `503 HERMES_NOT_CONNECTED`; nunca usan datos DEMO.

## Variables de servidor

Estas variables no llevan el prefijo `VITE_` y nunca deben formar parte del bundle:

```env
NUGA_SERVER_MODE=staging
NUGA_SERVER_HOST=127.0.0.1
NUGA_SERVER_PORT=8787
NUGA_PUBLIC_ORIGIN=http://127.0.0.1:3000
NUGA_SESSION_SECRET=<generado-en-el-servidor>
NUGA_OWNER_USERNAME=ramiro
NUGA_OWNER_PASSWORD_HASH=<scrypt-v1-generado-en-el-servidor>
```

No se deben guardar en GitHub los valores reales de `NUGA_SESSION_SECRET`,
`NUGA_OWNER_PASSWORD_HASH` ni la contraseña. El hash se genera recibiendo la
contraseña exclusivamente por stdin mediante `bun run auth:hash-password`.

## Ejecución futura

La instalación y ejecución en `ramiro@hermes-team-lab` se realizará en una fase
posterior, después de agregar autenticación y el adaptador read-only de Hermes. En
el estado actual el backend es código validable, no un servicio desplegado.

## Supabase

El complemento fue verificado y no existen proyectos en la cuenta conectada.
Supabase no es necesario en esta fase: Kanban/Hermes será la fuente de verdad
operativa. Si posteriormente se necesita analítica histórica o almacenamiento
multiusuario, se diseñará primero el esquema, RLS y separación de ambientes.
