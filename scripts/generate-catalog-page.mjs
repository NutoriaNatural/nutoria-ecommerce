import { readFile, mkdir, writeFile } from "node:fs/promises";

// Reuse the Home shell so the catalog keeps the same header, cart and footer.
const root = new URL("../", import.meta.url);
const home = (await readFile(new URL("index.html", root), "utf8")).replaceAll("\r\n", "\n");
const catalog = `
      <section class="section" id="productos" aria-labelledby="titulo-productos">
        <div class="container section-frame">
          <a class="catalog-back" href="/">← Inicio</a>
          <h1 id="titulo-productos">Todos los productos</h1>
          <div class="catalog-tools">
            <div class="catalog-categories" data-category-filters role="group" aria-label="Filtrar por categoría"></div>
            <p class="catalog-results" data-product-count aria-live="polite"></p>
          </div>
          <div class="catalog-empty" data-catalog-empty hidden>
            <p>No encontramos productos con esa búsqueda.</p>
            <button type="button" data-catalog-clear>Restablecer búsqueda y filtros</button>
          </div>
          <div class="product-grid" data-product-grid></div>
        </div>
      </section>
    `;
const page = home
  .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <base href="/" />')
  .replaceAll("Nutoria | Frutos secos, semillas y productos naturales", "Todos los productos | Nutoria")
  .replace('rel="canonical" href="https://nutoria.com.co/"', 'rel="canonical" href="https://nutoria.com.co/todos-los-productos/"')
  .replace('property="og:url" content="https://nutoria.com.co/"', 'property="og:url" content="https://nutoria.com.co/todos-los-productos/"')
  .replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, `$1${catalog}$2`)
  .replace('<main>', '<main class="catalog-page">');
await mkdir(new URL("todos-los-productos/", root), { recursive: true });
await writeFile(new URL("todos-los-productos/index.html", root), page, "utf8");
console.log("Catálogo completo generado en /todos-los-productos/.");
