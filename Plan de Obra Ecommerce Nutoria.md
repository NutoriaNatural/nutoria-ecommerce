# Plan de Obra --- E-commerce Nutoria

## JORNADA 1 --- La estructura

1.  **Crear el proyecto base en Antigravity IDE siguiendo el PRD y la
    Guía de Diseño.**\
    **Instrucción a la IA:** "Crea la estructura base responsive del
    e-commerce Nutoria según el PRD y la Guía de Diseño, sin inventar
    contenido ni productos."\
    **Compruebo:** abre correctamente en computador y celular, no hay
    errores visibles y aparecen las secciones en el orden definido.

2.  **Construir el encabezado y primer pantallazo.**\
    **Instrucción:** "Construye el hero de Nutoria con espacio para
    logo, un único H1, subtítulo, imagen principal y botón Comprar
    productos."\
    **Compruebo:** sin bajar la página entiendo qué vende Nutoria, cuál
    es su propuesta y dónde debo hacer clic.

3.  **Construir la navegación por necesidad y categorías.**\
    **Instrucción:** "Crea las secciones Compra según lo que necesitas y
    Categorías: frutos secos, semillas, deshidratados, productos
    naturales y suplementos."\
    **Compruebo:** puedo identificar y seleccionar cada categoría
    fácilmente desde celular.

4.  **Crear el sistema visual de productos.**\
    **Instrucción:** "Crea una tarjeta reutilizable para productos con
    foto, nombre, presentación, precio y botón de compra, siguiendo la
    Guía de Diseño."\
    **Compruebo:** todas las tarjetas mantienen la misma estructura y se
    reorganizan correctamente según el tamaño de pantalla.

5.  **Construir las secciones de diferenciación, información y
    cierre.**\
    **Instrucción:** "Construye las secciones Por qué Nutoria,
    Información para decidir y el cierre con el CTA Comprar productos."\
    **Compruebo:** la página cuenta una secuencia lógica y no repite
    innecesariamente la misma información.

6.  **Implementar carrito y recorrido básico de compra.** ⚠️ **RIESGO
    ALTO**\
    **Instrucción:** "Implementa agregar, eliminar y cambiar cantidades
    del carrito y calcula correctamente subtotal y total."\
    **Compruebo:** agrego varios productos, cambio cantidades, elimino
    uno y todos los valores se actualizan correctamente.\
    **Si falla:** no avanzar a pagos; corregir primero cada operación
    del carrito con productos de prueba.

7.  **Preparar PostgreSQL y la estructura de datos necesaria.** ⚠️
    **RIESGO ALTO**\
    **Instrucción:** "Configura PostgreSQL para guardar únicamente los
    datos necesarios del proyecto y protege las credenciales mediante
    variables de entorno."\
    **Compruebo:** la página puede guardar y recuperar un registro de
    prueba y ninguna contraseña aparece en GitHub ni en el código
    público.\
    **Si falla:** detener la conexión y revisar las variables de entorno
    antes de introducir información real.

## JORNADA 2 --- El contenido real y las fotos

8.  **Reemplazar textos provisionales por el contenido definitivo de
    Nutoria.**\
    **Instrucción:** "Incorpora los textos aprobados del PRD y del
    Recorrido del Visitante sin inventar beneficios, cifras ni
    testimonios."\
    **Compruebo:** no queda ningún "Lorem ipsum", texto de ejemplo ni
    afirmación que no hayamos aprobado.

9.  **Cargar el logo y aplicar la identidad visual.**\
    **Instrucción:** "Integra el logo original de Nutoria y aplica la
    paleta #042616, #F7F3E8 y #D8A84E con Cormorant Garamond y
    Montserrat."\
    **Compruebo:** logo sin deformación, fondos claros, textos legibles
    y botones dorados con texto verde.

10. **Cargar fotografías reales y optimizarlas.**\
    **Instrucción:** "Incorpora las fotografías reales proporcionadas,
    optimízalas para web sin deformarlas y conserva una apariencia
    natural."\
    **Compruebo:** las imágenes se ven nítidas pero la página sigue
    cargando rápidamente.

11. **Cargar productos reales por categorías.**\
    **Instrucción:** "Carga los productos suministrados con su nombre,
    fotografía, presentación, precio y categoría exactos."\
    **Compruebo:** comparo una muestra de productos contra mi
    información original y no existen precios, gramajes o nombres
    inventados.

12. **Construir la información detallada para decidir.**\
    **Instrucción:** "Añade a cada producto únicamente la información
    verificable que te entregue: ingredientes, contenido, información
    nutricional, forma de consumo y registro sanitario cuando aplique."\
    **Compruebo:** cada afirmación puede rastrearse hasta la etiqueta o
    información oficial del producto.

13. **Configurar WhatsApp como ayuda secundaria.**\
    **Instrucción:** "Configura el botón secundario de WhatsApp de
    Nutoria con un mensaje prellenado que identifique que el visitante
    viene de la web y, cuando corresponda, el producto consultado."\
    **Compruebo:** desde el celular abre el WhatsApp correcto y el
    mensaje aparece escrito sin enviarse automáticamente.

14. **Revisar completamente la versión móvil.**\
    **Instrucción:** "Audita toda la página en tamaños de celular,
    tablet y escritorio y corrige desbordamientos, textos pequeños,
    imágenes deformadas y botones difíciles de tocar."\
    **Compruebo:** puedo recorrer y comprar desde el celular sin ampliar
    la pantalla ni desplazarla horizontalmente.

## JORNADA 3 --- Publicar y afinar

15. **Subir el código definitivo a GitHub.**\
    **Instrucción:** "Revisa el proyecto para evitar secretos o archivos
    privados y prepara la versión final para subirla al repositorio de
    GitHub."\
    **Compruebo:** el proyecto está completo en GitHub y **`.env` y
    credenciales no aparecen en el repositorio**.

16. **Publicar en Vercel Hobby conectado con GitHub.** ⚠️ **RIESGO
    ALTO**\
    **Instrucción:** "Configura y publica el proyecto Nutoria en Vercel
    Hobby desde el repositorio de GitHub y configura las variables de
    entorno necesarias."\
    **Compruebo:** abro la dirección pública desde otro dispositivo y
    funcionan página, imágenes, carrito y conexiones necesarias.\
    **Si falla:** conservar la última versión funcional y revisar
    primero el registro del despliegue y las variables de entorno; no
    modificar varias cosas simultáneamente.

17. **Configurar título, descripción e idioma.**\
    **Instrucción:** "Configura el idioma `es-CO`, título SEO y
    descripción de Nutoria basándote exclusivamente en el contenido
    aprobado."\
    **Compruebo:** el código declara `es-CO` y la pestaña muestra
    correctamente el título de Nutoria.

18. **Añadir texto alternativo a todas las imágenes.**\
    **Instrucción:** "Revisa todas las imágenes y añade textos
    alternativos descriptivos y naturales, dejando vacío el alt
    únicamente en imágenes puramente decorativas."\
    **Compruebo:** ninguna imagen informativa queda sin `alt`.

19. **Configurar metadatos para compartir.**\
    **Instrucción:** "Configura los metadatos sociales de Nutoria
    utilizando la imagen oficial de 1200 × 630 px."\
    **Compruebo:** al probar la URL se muestra el título, descripción e
    imagen correctos al compartir.

20. **Crear e instalar el favicon.**\
    **Instrucción:** "Genera e integra el favicon de Nutoria a partir
    del recurso de marca aprobado."\
    **Compruebo:** aparece correctamente junto al nombre de la página en
    la pestaña.

21. **Configurar la dirección canonical.**\
    **Instrucción:** "Configura como canonical el dominio oficial
    definitivo de Nutoria en todas las referencias correspondientes."\
    **Compruebo:** al revisar el código aparece una sola dirección
    canonical y coincide exactamente con el dominio público oficial.

22. **Añadir datos estructurados del negocio.**\
    **Instrucción:** "Crea los datos estructurados del negocio Nutoria
    utilizando únicamente el nombre, dirección, horarios, URL y datos
    comerciales que te proporcione."\
    **Compruebo:** dirección y horarios coinciden exactamente con los
    datos reales y el marcado pasa una prueba de resultados enriquecidos
    sin errores críticos.

23. **Crear `robots.txt` y `sitemap.xml`.**\
    **Instrucción:** "Genera robots.txt y sitemap.xml para el dominio
    oficial de Nutoria permitiendo el rastreo de la página pública."\
    **Compruebo:** puedo abrir `/robots.txt` y `/sitemap.xml`
    directamente desde el dominio y ambos contienen la URL correcta.

24. **Comprobar que NO existe `noindex`.**\
    **Instrucción:** "Audita el proyecto publicado y confirma que
    ninguna configuración, etiqueta o cabecera esté impidiendo la
    indexación de la página principal."\
    **Compruebo:** no aparece `noindex` en la página pública ni existe
    una regla que bloquee accidentalmente a los buscadores.

25. **Configurar medición de visitas y conversiones.**\
    **Instrucción:** "Configura la analítica definida para medir
    visitas, clics en Comprar productos, uso de WhatsApp, inicio de
    carrito y compras completadas."\
    **Compruebo:** hago yo mismo una visita y una acción de prueba y
    posteriormente aparecen registradas.

26. **Realizar una compra completa de prueba.**\
    **Instrucción:** "Audita como cliente todo el recorrido desde entrar
    a Nutoria hasta finalizar una compra y enumera cualquier error
    encontrado."\
    **Compruebo:** puedo hacer **entrada → categoría → producto →
    carrito → datos → compra/confirmación** sin encontrar callejones sin
    salida.

27. **Hacer la auditoría final antes del lanzamiento.**\
    **Instrucción:** "Realiza una revisión final de Nutoria en móvil y
    escritorio buscando errores de contenido, enlaces, imágenes,
    responsive, accesibilidad, SEO, velocidad y proceso de compra."\
    **Compruebo:** todos los errores críticos están en cero antes de
    empezar a enviar tráfico real.

### Orden que no cambiaría

Las tres tareas marcadas ⚠️ son donde **no recomiendo avanzar hasta
comprobar que todo funciona**: **carrito, PostgreSQL y publicación en
Vercel**.

Especialmente importante: aunque hablamos inicialmente de una landing
estática, al convertir el proyecto en un **e-commerce con carrito, datos
y compra**, ya estamos añadiendo funcionalidades que van más allá de una
landing puramente estática; conviene construirlas por etapas para poder
detectar exactamente dónde aparece un problema.
