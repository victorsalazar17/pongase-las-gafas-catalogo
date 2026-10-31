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

function filteredProducts() {
  return products;
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

// Descarga productos.json al abrir el sitio desde HTTP/HTTPS y prepara el catálogo.
async function initializeCatalog() {
  try {
    // fetch necesita un origen HTTP/HTTPS; abrir index.html como file:// puede bloquear el JSON.
    const response = await fetch("assets/data/productos.json");
    if (!response.ok)
      throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    products = await response.json();
    renderCatalog();
  } catch (error) {
    resultsCount.textContent = "No fue posible cargar el catálogo.";
    productGrid.innerHTML =
      '<p class="catalog-error">Abre el sitio desde un servidor web local o publicado para cargar el catálogo.</p>';
    console.error(error);
  }
}

initializeCatalog();
