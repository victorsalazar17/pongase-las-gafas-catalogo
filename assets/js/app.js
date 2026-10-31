// Etiquetas visibles de colección. Cada clave debe coincidir con `coleccion` en productos.json.
const COLLECTIONS = {
  "chrome-hearts": "Chrome Hearts",
  "rayban-optica": "Ray-Ban óptica",
  "rayban-sol": "Ray-Ban de sol",
  "monturas-marcas": "Multimarca",
  "epica-hombre": "EPICA hombre",
  "epica-dama": "EPICA dama",
};


// Límite inicial de tarjetas; el botón “Mostrar más” añade otro grupo de este tamaño.
const PAGE_SIZE = 24;

// Referencias a los controles y contenedores definidos en index.html.
const productGrid = document.querySelector("#product-grid");
const productTemplate = document.querySelector("#product-card-template");
const searchInput = document.querySelector("#search-input");
const collectionFilter = document.querySelector("#collection-filter");
const brandFilter = document.querySelector("#brand-filter");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const loadMoreButton = document.querySelector("#load-more");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#image-modal-title");

// Datos leídos desde productos.json y cantidad de tarjetas que se muestran actualmente.
let products = [];
let visibleCount = PAGE_SIZE;

// Ignora tildes y diferencias entre mayúsculas y minúsculas al buscar.
function normalize(value) {
  // La descomposición Unicode separa letras y tildes para que “épica” y “epica” coincidan.
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function fillFilterOptions() {
  // Las colecciones se definen una vez en COLLECTIONS; las marcas se deduplican desde el inventario.
  Object.entries(COLLECTIONS).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    collectionFilter.append(option);
  });

  [...new Set(products.map((product) => product.marca))]
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      brandFilter.append(option);
    });

  fillBrandCollections();
}

// Crea accesos rápidos para marcas multimarca con cuatro imágenes o más.
function fillBrandCollections() {
  const counts = new Map();
  products
    .filter((product) => product.coleccion === "monturas-marcas")
    .forEach((product) => {
      counts.set(product.marca, (counts.get(product.marca) || 0) + 1);
    });

  // El umbral evita mostrar accesos vacíos o poco representativos; el orden prioriza catálogos amplios.
  const featuredBrands = [...counts.entries()]
    .filter(([, count]) => count >= 4)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));

  const tiles = featuredBrands.map(([brand, count]) => {
    // La primera ficha disponible sirve como imagen de portada para el acceso de esa marca.
    const firstProduct = products.find(
      (product) =>
        product.coleccion === "monturas-marcas" && product.marca === brand,
    );
    const link = document.createElement("a");
    link.className = "brand-collection-tile";
    link.href = "#catalogo";
    link.dataset.brandLink = brand;

    const image = document.createElement("img");
    image.src = firstProduct.imagen_extraida;
    image.alt = `${brand}, selección de monturas del catálogo multimarca`;
    image.loading = "lazy";

    const copy = document.createElement("span");
    copy.className = "brand-collection-copy";
    const countLabel = document.createElement("small");
    countLabel.textContent = `${count} ${count === 1 ? "MODELO" : "MODELOS"} · MULTIMARCA`;
    const brandName = document.createElement("strong");
    // textContent inserta el nombre como texto y evita interpretarlo como marcado HTML.
    brandName.textContent = brand;
    const arrow = document.createElement("span");
    arrow.className = "brand-tile-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    copy.append(countLabel, brandName);
    link.append(image, copy, arrow);
    return link;
  });

  // Reemplaza el contenido de una sola vez para evitar duplicados al inicializar la vista.
  document.querySelector("#brand-collection-links").replaceChildren(...tiles);
}

// Aplica en conjunto la búsqueda y los filtros seleccionados por la persona usuaria.
function filteredProducts() {
  const query = normalize(searchInput.value.trim());
  const collection = collectionFilter.value;
  const brand = brandFilter.value;

  // Los criterios se combinan: un producto debe cumplir búsqueda, colección y marca seleccionadas.
  return products.filter((product) => {
    const searchable = normalize(
      `${product.marca} ${product.referencia_visible} ${product.coleccion} ${COLLECTIONS[product.coleccion]}`,
    );
    return (
      (!query || searchable.includes(query)) &&
      (!collection || product.coleccion === collection) &&
      (!brand || product.marca === brand)
    );
  });
}

// Define el texto visible de la referencia según su estado de confirmación.
function referenceLabel(product) {
  const reference = String(product.referencia_visible || "").trim();
  if (!reference && product.estado_referencia === "sin_codigo")
    return "Sin referencia visible";
  if (!reference) return "Referencia por confirmar";
  // Distingue el código leído del que ya fue confirmado para no presentar datos dudosos como definitivos.
  if (product.estado_referencia !== "confirmada")
    return `Código visible: ${reference}`;
  return `Ref. ${reference}`;
}

// Clona la plantilla HTML y conecta la imagen, los datos y las acciones del producto.
function createProductCard(product) {
  // La plantilla mantiene el marcado uniforme; cada tarjeta solo recibe los datos del inventario.
  const card = productTemplate.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".product-image");
  const label = referenceLabel(product);
  const reviewBadge = card.querySelector(".review-badge");

  image.src = product.imagen_extraida;
  image.alt = product.referencia_visible
    ? `${product.marca}, ${label}; página ${product.pagina} del catálogo`
    : `${product.marca}, sin referencia visible; página ${product.pagina} del catálogo`;
  card.querySelector(".product-collection").textContent =
    COLLECTIONS[product.coleccion] || "Catálogo";
  card.querySelector(".product-brand").textContent = product.marca;
  card.querySelector(".product-page").textContent = `Pág. ${product.pagina}`;
  card.querySelector(".product-reference").textContent = label;
  // El aviso solo aparece en referencias pendientes o sin código visible.
  if (product.estado_referencia !== "confirmada")
    reviewBadge.classList.remove("d-none");

  return card;
}

// Dibuja solo la página visible de resultados y actualiza contador y estados vacíos.
function renderCatalog() {
  const matches = filteredProducts();
  // La lista completa determina el contador; solo se dibuja el tramo permitido por la paginación.
  const shown = matches.slice(0, visibleCount);
  productGrid.replaceChildren(...shown.map(createProductCard));
  resultsCount.textContent = `${matches.length} ${matches.length === 1 ? "modelo" : "modelos"} en el catálogo`;
  emptyState.classList.toggle("d-none", matches.length > 0);
  productGrid.classList.toggle("d-none", matches.length === 0);
  loadMoreButton.classList.toggle(
    "d-none",
    shown.length >= matches.length || matches.length === 0,
  );
}

// Reinicia la paginación cuando cambia la búsqueda o alguno de los filtros.
function resetAndRender() {
  visibleCount = PAGE_SIZE;
  renderCatalog();
}

// Descarga productos.json al abrir el sitio desde HTTP/HTTPS y prepara el catálogo.
async function initializeCatalog() {
  try {
    // fetch necesita un origen HTTP/HTTPS; abrir index.html como file:// puede bloquear el JSON.
    const response = await fetch("assets/data/productos.json");
    if (!response.ok)
      throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    products = await response.json();
    // Los filtros se construyen después de cargar los datos para reflejar solo opciones disponibles.
    fillFilterOptions();
    renderCatalog();
  } catch (error) {
    resultsCount.textContent = "No fue posible cargar el catálogo.";
    productGrid.innerHTML =
      '<p class="catalog-error">Abre el sitio desde un servidor web local o publicado para cargar el catálogo.</p>';
    console.error(error);
  }
}

// Eventos de búsqueda, filtros, limpieza y carga progresiva de productos.
searchInput.addEventListener("input", resetAndRender);
collectionFilter.addEventListener("change", resetAndRender);
brandFilter.addEventListener("change", resetAndRender);
document.querySelector("#clear-filters").addEventListener("click", () => {
  // Ambos botones de limpieza restablecen los tres criterios y vuelven al primer bloque de resultados.
  searchInput.value = "";
  collectionFilter.value = "";
  brandFilter.value = "";
  resetAndRender();
});
document.querySelector("#empty-clear").addEventListener("click", () => {
  searchInput.value = "";
  collectionFilter.value = "";
  brandFilter.value = "";
  resetAndRender();
});
loadMoreButton.addEventListener("click", () => {
  // Cada clic amplía el bloque visible sin volver a solicitar el inventario.
  visibleCount += PAGE_SIZE;
  renderCatalog();
});

// Las tarjetas de colección seleccionan su filtro y llevan al catálogo.
document
  .querySelector("#collection-links")
  .addEventListener("click", (event) => {
    const link = event.target.closest("[data-collection-link]");
    if (!link) return;
    collectionFilter.value = link.dataset.collectionLink;
    brandFilter.value = "";
    searchInput.value = "";
    resetAndRender();
  });

// Las tarjetas de marca limitan el catálogo a esa marca dentro de Multimarca.
document
  .querySelector("#brand-collection-links")
  .addEventListener("click", (event) => {
    const link = event.target.closest("[data-brand-link]");
    if (!link) return;
    collectionFilter.value = "monturas-marcas";
    brandFilter.value = link.dataset.brandLink;
    searchInput.value = "";
    resetAndRender();
  });

initializeCatalog();
