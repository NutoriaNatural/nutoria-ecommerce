# Qué pasa por detrás --- Landing Page Nutoria

## 1. Qué información voy a recibir

Como el objetivo principal de Nutoria es **vender**, la página no debe
pedir datos innecesarios. Si incluimos un formulario de contacto o
consulta, recogerá únicamente **nombre, teléfono o WhatsApp y mensaje**;
si posteriormente se implementa la compra completa, se necesitarán
aparte los datos estrictamente necesarios para procesar y entregar el
pedido.

## 2. A dónde llega y cómo la reviso

Cuando alguien envía el formulario, la información se guarda en la base
de datos **PostgreSQL** en un registro privado, por ejemplo: nombre,
teléfono, mensaje, fecha y estado de la consulta.

Esa información **no queda visible públicamente**; para revisarla
necesitaremos definir una forma privada y segura de consulta, ya que
PostgreSQL almacena los datos, pero por sí mismo no crea un panel visual
para administrarlos.

## 3. Cómo funciona WhatsApp

El botón de WhatsApp es independiente del formulario. Al tocarlo, abre
WhatsApp directamente con el número de Nutoria y un mensaje previamente
escrito, por ejemplo:

> "Hola, vengo de la página de Nutoria y quisiera información sobre un
> producto."

El visitante puede modificarlo antes de enviarlo.

Si el botón está asociado a un producto concreto, podemos hacerlo más
útil:

> "Hola, estoy viendo \[nombre del producto\] en Nutoria y quisiera más
> información."

## 4. Cómo sabré cuántas personas entraron

La página tendrá medición de visitas para conocer como mínimo **cuántas
personas entran y cuántas realizan la acción principal de compra**.

También conviene medir clics en **Comprar productos** y WhatsApp para
saber dónde avanza o abandona el visitante; la herramienta concreta de
analítica todavía debe definirse antes de implementar esta parte.

## 5. Datos personales y qué debo advertir

Nombre y número de teléfono son **datos personales** porque permiten
identificar o asociar información con una persona.

En Colombia, si Nutoria los recoge y almacena, debe informar para qué
serán utilizados, identificar al responsable, explicar los derechos del
titular y disponer de una política de tratamiento de datos; además, como
regla general, la autorización debe ser previa e informada y poder
consultarse posteriormente.

Por eso, junto al formulario deberá existir un aviso claro de
autorización y acceso a la **Política de Tratamiento de Datos Personales
de Nutoria**.

No debemos recoger información adicional "por si acaso": solo lo
necesario para la finalidad informada.

## 6. Si el formulario deja de funcionar

La página debe mantener **WhatsApp como canal alternativo visible**,
para que una falla del formulario no impida contactar a Nutoria.

Si ocurre un error, el visitante debe ver un mensaje comprensible y una
opción como **"Escríbenos por WhatsApp"**; por nuestra parte, se
revisará primero si la página está recibiendo solicitudes y después la
conexión con PostgreSQL.

## Gratis ahora vs. posibles costos

Con el esquema definido, **GitHub** y **Vercel Hobby** pueden comenzar
sin costo dentro de las condiciones y límites de sus planes gratuitos.

Los costos futuros pueden aparecer por **dominio propio, base de datos
PostgreSQL según el proveedor y consumo, aumento de tráfico,
almacenamiento, servicios de analítica o funcionalidades de comercio
electrónico**; antes de contratar cualquiera de ellos debemos definir el
proveedor y revisar su precio vigente.
