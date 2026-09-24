# Panel administrativo y notificaciones

## Acceso

El panel se abre en `https://nutoria.com.co/admin/`. Los pedidos nunca se incluyen
en el HTML publico: las API requieren una cookie `HttpOnly`, `Secure` y
`SameSite=Strict` firmada en el servidor.

Variables requeridas en Vercel:

- `ADMIN_PASSWORD`: contrasena privada de al menos 12 caracteres.
- `ADMIN_SESSION_SECRET`: valor aleatorio de al menos 32 caracteres, distinto de la contrasena.

Ambas deben habilitarse para Preview durante las pruebas. Solo despues de aprobarlas
se copian a Production.

## Correo con Resend

1. Crear una cuenta en Resend y verificar el dominio `nutoria.com.co` mediante sus registros DNS.
2. Crear una API key con permiso para enviar correos.
3. Configurar en Vercel:
   - `RESEND_API_KEY`
   - `ORDER_NOTIFICATION_EMAIL` con el correo que recibira cada pedido.
   - `ORDER_FROM_EMAIL` con un remitente del dominio verificado, incluido el nombre visible.

El envio usa una clave de idempotencia estable por pedido para evitar correos duplicados.

## WhatsApp Cloud API

Se utiliza directamente la API oficial de Meta; no se almacena el token en el codigo.
Configurar:

- `WHATSAPP_ACCESS_TOKEN`: token permanente del usuario del sistema de Meta.
- `WHATSAPP_PHONE_NUMBER_ID`: identificador del numero emisor en WhatsApp Manager.
- `ORDER_NOTIFICATION_WHATSAPP`: numero receptor en formato internacional, solo digitos.
- `WHATSAPP_ORDER_TEMPLATE`: nombre exacto de una plantilla aprobada.
- `WHATSAPP_GRAPH_VERSION`: version activa de Graph API indicada por Meta.
- `WHATSAPP_TEMPLATE_LANGUAGE`: codigo aprobado; normalmente `es_CO`.

La plantilla debe tener exactamente seis variables de cuerpo y en este orden:

1. referencia del pedido;
2. nombre del cliente;
3. total pagado;
4. ciudad y departamento de entrega;
5. direccion principal y complemento de entrega, omitiendo el complemento si esta vacio;
6. telefono de contacto del cliente.

Ejemplo de contenido para someter a aprobacion en Meta:

`Pedido pagado {{1}}. Cliente: {{2}}. Total: {{3}}. Entrega: {{4}}. Direccion: {{5}}. Telefono: {{6}}. Revisalo en el panel de Nutoria.`

El numero receptor debe ser diferente del numero emisor de WhatsApp Cloud si Meta no
permite que la cuenta se envie mensajes a si misma.

## Correos transaccionales para el cliente

Cuando Wompi confirma un pago aprobado, el sistema crea una notificacion independiente
para `customer_email`. Tambien crea seguimientos cuando el pedido cambia a en preparacion,
despachado, entregado o cancelado. Cada evento usa una clave idempotente distinta para
evitar envios duplicados.

Los correos al cliente usan `RESEND_API_KEY` y `ORDER_FROM_EMAIL`, pero nunca incluyen
el enlace ni las credenciales del panel administrativo. La migracion
`004_customer_order_notifications.sql` agrega los tipos de seguimiento y prepara una
confirmacion pendiente para los pedidos aprobados que ya existan.

## Comportamiento seguro

El webhook de Wompi confirma y guarda el pago antes de intentar cualquier mensaje.
Por cada pedido se crea una sola tarea de correo y una sola de WhatsApp. Si un proveedor
falla, el pedido permanece pagado, el panel muestra el error y permite reintentar hasta
cinco intentos.
