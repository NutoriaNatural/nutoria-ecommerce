# Documento Técnico --- Landing Page Nutoria

## 1. Herramientas

  -----------------------------------------------------------------------
  Herramienta                         Qué hace y por qué se usa
  ----------------------------------- -----------------------------------
  **Antigravity IDE**                 Es el entorno donde se construirá y
                                      editará la página: textos,
                                      estructura, imágenes, estilos y
                                      código.

  **GitHub**                          Guarda el código del proyecto y
                                      mantiene un historial de los
                                      cambios. También conecta el
                                      proyecto con Vercel para publicar
                                      nuevas versiones.

  **Vercel Hobby**                    Publica la página en internet. Al
                                      conectarlo con GitHub, los cambios
                                      enviados al repositorio pueden
                                      convertirse en una nueva versión
                                      online.

  **PostgreSQL**                      Es la base de datos. Guarda
                                      información estructurada que la
                                      página necesite conservar. Para
                                      esta primera landing debemos usarla
                                      únicamente cuando exista
                                      información que realmente necesite
                                      persistencia.
  -----------------------------------------------------------------------

## 2. Archivos principales del proyecto

La estructura exacta dependerá del código generado en Antigravity, pero
como mínimo necesitaremos:

-   **Página principal:** contiene la estructura y contenido visible de
    la landing de Nutoria.
-   **Archivo de estilos:** controla tipografías, tamaños, espacios,
    colores y adaptación a celular y computador.
-   **Carpeta de imágenes:** logo, productos, categorías, favicon e
    imagen para compartir.
-   **Configuración:** contiene los ajustes necesarios para ejecutar y
    publicar correctamente el proyecto.
-   **`.env`:** guarda datos privados de conexión, por ejemplo las
    credenciales de PostgreSQL; **nunca debe publicarse en GitHub**.
-   **`robots.txt`:** indica a los buscadores qué pueden rastrear.
-   **`sitemap.xml`:** informa a los buscadores cuál es la página
    disponible.
-   **README:** instrucciones básicas para entender, ejecutar y mantener
    el proyecto.

## 3. Qué necesito tener

Necesitas **Antigravity IDE** disponible para construir el proyecto, una
**cuenta de GitHub** para guardar el código y una **cuenta de Vercel**
iniciada mediante GitHub para publicarlo.

También necesitaremos acceso a una instancia de **PostgreSQL**, el
dominio definitivo de Nutoria cuando esté disponible y los recursos
finales de marca: logo, favicon, fotografías y la imagen de **1200 × 630
px** para compartir.

## 4. Límites de esta construcción

Al ser una **página estática de una sola pantalla**, no tendremos
inicialmente un sitio grande con múltiples páginas, blog, panel
administrativo complejo ni funcionalidades avanzadas propias de una
plataforma completa de comercio electrónico.

Además, **Vercel Hobby tiene límites de uso y recursos**; PostgreSQL
tampoco convierte por sí solo la landing en una tienda: si queremos
carrito, pagos, inventario, cuentas de clientes o gestión automática de
pedidos, esas funcionalidades tendrán que definirse e implementarse
específicamente.

## 5. Requisitos obligatorios de publicación y visibilidad

-   **Idioma declarado:** `es-CO`.
-   **Título y descripción:** específicos para Nutoria y descriptivos de
    lo que vende.
-   **Un único H1:** será el título principal de la página.
-   **Texto alternativo:** todas las imágenes relevantes tendrán una
    descripción `alt`.
-   **Favicon:** ícono oficial de Nutoria visible en la pestaña del
    navegador.
-   **Metadatos para compartir:** configurados para que WhatsApp,
    Facebook y otras plataformas muestren correctamente título,
    descripción e imagen de **1200 × 630 px**.
-   **Canonical:** indicará cuál es la dirección oficial y definitiva de
    la página.
-   **Datos estructurados del negocio:** incluirán información real de
    Nutoria, especialmente dirección y horarios; estos datos deben
    confirmarse antes de publicarlos.
-   **`robots.txt` y `sitemap.xml`:** ambos estarán creados y
    accesibles.
-   **Indexación:** antes del lanzamiento se comprobará expresamente que
    la página **NO tenga `noindex` por accidente**.

**Sobre usar otra herramienta:** para este proyecto **mantendría
exactamente las herramientas definidas por el taller**. No hay una razón
suficiente para cambiar la arquitectura antes de construir la primera
versión; primero conviene lanzar, medir y después determinar si las
necesidades reales de Nutoria justifican una infraestructura más
compleja.
