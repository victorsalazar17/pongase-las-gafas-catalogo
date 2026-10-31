# Póngase las Gafas — catálogo web

Desarrollé este catálogo web para presentar las colecciones de **Póngase las Gafas** en una experiencia moderna, urbana y adaptable a celulares y computadores. La página reúne las imágenes representativas de los catálogos y permite encontrar modelos y consultar disponibilidad por WhatsApp.

**Autor:** Victor Daniel Salazar Tabares

## Características

- Catálogo dinámico que carga sus fichas desde `assets/data/productos.json`.
- Búsqueda por marca, referencia o colección, con filtros combinables.
- Colecciones Chrome Hearts, Ray-Ban óptica, Ray-Ban de sol, Multimarca y EPICA para hombre y dama.
- Imágenes originales agrupadas por variantes de color y opción para ampliarlas.
- Enlaces de cotización por WhatsApp con mensajes según el estado de la referencia.
- Accesos a Instagram y TikTok.
- Diseño responsive con navegación y cuadrículas adaptadas a pantallas pequeñas.

El sitio es estático: no requiere base de datos ni servidor de aplicaciones, y no incluye carrito ni pasarela de pago.

## Tecnologías

- HTML5
- Bootstrap 5
- CSS propio
- JavaScript puro (ES6)
- JSON para los datos del catálogo

## Estructura del proyecto

```text
chatgpt-web-gafas/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── styles.css
    ├── data/
    │   └── productos.json
    ├── img/
    │   ├── catalogo/
    │   │   ├── chrome-hearts/
    │   │   ├── epica-acetato/
    │   │   │   ├── dama/
    │   │   │   └── hombre/
    │   │   ├── multimarca/
    │   │   ├── ray-ban-optica/
    │   │   └── ray-ban-sol/
    │   ├── logo/
    │   └── hero.png
    └── js/
        └── app.js
```

## Cómo abrir el sitio

El catálogo se carga con `fetch()` desde el JSON, así que debo abrirlo por HTTP o HTTPS. Abrir `index.html` directamente con doble clic (`file://`) puede impedir que el navegador cargue los productos.

Desde la carpeta raíz puedo iniciar un servidor estático local con Python:

```powershell
py -m http.server 8000
```

Luego visito `http://localhost:8000`. Si `py` no está disponible, puedo ejecutar `python -m http.server 8000`. Para publicar el sitio en Netlify u otro hosting estático, debo conservar la estructura de carpetas y rutas.

## Mantenimiento

### Archivos principales

- `index.html`: estructura y contenido visible de la página. Los comentarios HTML describen las secciones.
- `assets/css/styles.css`: identidad visual, estados de interacción y ajustes responsive. Los comentarios agrupan los estilos por componente y tamaño de pantalla.
- `assets/js/app.js`: carga los productos, aplica búsqueda y filtros, crea las tarjetas y prepara los enlaces de WhatsApp.
- `assets/data/productos.json`: datos que JavaScript utiliza para construir el catálogo. Debe conservar sintaxis JSON válida; JSON no admite comentarios.

### Actualizar el catálogo

Cada elemento de `productos.json` es un objeto con estos campos:

| Campo | Uso |
| --- | --- |
| `id` | Identificador único del registro; no lo reutilizo. |
| `coleccion` | Clave de colección que debe existir en `COLLECTIONS` de `assets/js/app.js`. |
| `marca` | Nombre visible de la marca. |
| `referencia_visible` | Código tal como aparece en el catálogo; lo guardo como texto para preservar letras y ceros iniciales. Uso `""` si no hay código visible. |
| `estado_referencia` | `confirmada`, `revisar` o `sin_codigo`. |
| `pdf_origen` | Nombre del PDF fuente. |
| `pagina` | Página del PDF de donde se extrajo la imagen. |
| `imagen_extraida` | Ruta relativa desde la raíz del sitio hasta la imagen. |
| `genero` | `hombre`, `dama` o cadena vacía si el catálogo no lo especifica. |
| `observaciones` | Notas de trazabilidad o revisión. |

Al añadir o corregir productos:

1. Mantengo una sola entrada por imagen representativa de cada grupo; no separo en tarjetas las gafas que aparecen juntas.
2. Guardo la imagen en la carpeta de su colección dentro de `assets/img/catalogo/` y actualizo la ruta exacta en `imagen_extraida`.
3. Escribo referencias entre comillas, por ejemplo `"0840"`, para conservar ceros iniciales.
4. Uso `confirmada` solo si el código está confirmado, `revisar` si no es fiable y `sin_codigo` si no aparece un código; en el último caso `referencia_visible` debe ser `""`.
5. Mantengo el nombre de PDF y número de página para conservar la trazabilidad del producto.
6. Si agrego una colección, añado su clave y etiqueta a `COLLECTIONS` en `assets/js/app.js` y agrego el acceso en `index.html` si debe aparecer como tarjeta de colección.

### WhatsApp

El número se configura en `assets/js/app.js`, en la constante `WHATSAPP_NUMBER`, escrito en formato internacional sin `+` ni espacios. Los mensajes de producto incluyen marca y referencia cuando esta está confirmada. Si el código está pendiente o no aparece, el mensaje identifica el modelo por marca, colección y página. WhatsApp abre el mensaje preparado; la persona decide si lo envía.

## Uso de IA

Proyecto desarrollado con asistencia de IA como herramienta de apoyo. Yo definí los requisitos, revisé el código y ajusté el diseño.
