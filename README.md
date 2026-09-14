# Nutoria

Estructura base responsive del e-commerce Nutoria, correspondiente únicamente a la TAREA 1 del Plan de Obra.

## Abrir el proyecto

Abre `index.html` directamente en un navegador o inicia un servidor local en esta carpeta.

## Alcance actual

La estructura conserva el orden definido en el PRD: encabezado, propuesta principal, compra según necesidad, categorías, productos destacados, por qué Nutoria, información para decidir y cierre.

Las imágenes, los productos y la publicación se incorporarán en las tareas posteriores del Plan de Obra.

## PostgreSQL

La conexión usa exclusivamente la variable privada `POSTGRES_URL`. Copia `.env.example` como `.env`, completa la conexión y no publiques ese archivo.

El esquema mínimo está en `db/schema.sql`. Después de instalar las dependencias, la comprobación transaccional se ejecuta con `npm run db:verify`; el registro utilizado se revierte al finalizar y no conserva datos de prueba.

## Productos

Los datos editables del catálogo están en `product-catalog.mjs`. Cada producto conserva su fotografía y nombre original; modifica allí `presentation`, `price` y `category` cuando dispongas de la información aprobada.

Los campos `ingredients`, `content`, `nutrition`, `usage` y `sanitaryRegistration` están vacíos. Al completar cualquiera de ellos con información oficial, la ficha mostrará automáticamente el bloque “Información para decidir”; los campos que permanezcan vacíos no se mostrarán.

## WhatsApp

El número y los mensajes aprobados están centralizados en `whatsapp.mjs`. El enlace general identifica que el visitante viene de la página y cada ficha incluye automáticamente el nombre del producto consultado.
