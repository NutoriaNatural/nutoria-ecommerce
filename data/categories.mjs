export const categories = Object.freeze([
  Object.freeze({
    name: "Frutos secos y más",
    slug: "frutos-secos-y-mas",
    path: "/categorias/frutos-secos-y-mas/",
    title: "Frutos secos y más | Nutoria",
    metaDescription: "Explora los frutos secos y otros productos disponibles en Nutoria, con enlaces directos a cada presentación y precio.",
    introduction: "Explora los frutos secos y otros productos disponibles en Nutoria. Consulta cada ficha para conocer sus presentaciones y precios antes de agregar al carrito.",
  }),
  Object.freeze({
    name: "Semillas",
    slug: "semillas",
    path: "/categorias/semillas/",
    title: "Semillas | Nutoria",
    metaDescription: "Conoce la selección de semillas disponible en Nutoria y consulta las presentaciones y precios de cada producto.",
    introduction: "Conoce la selección de semillas disponible en Nutoria. En cada ficha puedes consultar las presentaciones y precios vigentes del producto.",
  }),
  Object.freeze({
    name: "Deshidratados",
    slug: "deshidratados",
    path: "/categorias/deshidratados/",
    title: "Productos deshidratados | Nutoria",
    metaDescription: "Encuentra los productos deshidratados disponibles en Nutoria y accede a la ficha individual de cada opción.",
    introduction: "Encuentra los productos deshidratados disponibles en Nutoria. Revisa cada ficha para elegir el producto y la presentación que buscas.",
  }),
  Object.freeze({
    name: "Suplementos y alimentos naturales",
    slug: "suplementos-y-alimentos-naturales",
    path: "/categorias/suplementos-y-alimentos-naturales/",
    title: "Suplementos y alimentos naturales | Nutoria",
    metaDescription: "Consulta los suplementos y alimentos naturales disponibles en Nutoria, con sus presentaciones y precios actuales.",
    introduction: "Consulta los suplementos y alimentos naturales disponibles en Nutoria. Cada producto enlaza a una ficha con su información real, presentaciones y precios.",
  }),
]);

export const categoryByName = new Map(categories.map((category) => [category.name, category]));
export const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
