# World Shop – catálogo digital (propuesta)

Sitio estático en **HTML5 + CSS3 + JavaScript vanilla**. Sin frameworks ni instalación.

## Abrirlo en Windows
1. Descomprime la carpeta `world-shop`.
2. Abre la carpeta en **Visual Studio Code**.
3. Doble clic en `index.html` (o clic derecho → *Open with Live Server* si tienes esa extensión).

## Estructura
```
world-shop/
├── index.html
├── css/styles.css
├── js/script.js      # lógica y CONFIG (teléfonos, sucursales, destacados)
├── js/products.js    # 1.182 productos extraídos de los PDF
├── js/images.js      # mapa código → foto
├── assets/logo/      # logo provisional (extraído de los PDF, baja resolución)
├── assets/products/  # fotos de productos
└── presentacion/propuesta.html
```

## Qué viene de dónde
- **Productos, códigos, descripciones y precios USD**: de los PDF `LISTA ACTUALIZADA LINEA BLANCA 06-11-2026` (647) y `LISTA ACTUALIZADA TLF 07-11-2026` (535). Precios sin redondear ni modificar.
- **Especificaciones** (BTU, kg, litros, GB/RAM, pantalla): solo las que aparecen escritas en la descripción de cada línea.
- **Marca/categoría**: derivadas del propio PDF (encabezados de columna o inicio de la descripción).
- **Campo "REF"** de los PDF: no se publica. En todas las líneas equivale a ≈ 60 % del precio (precio ÷ REF ≈ 1,67), por lo que parece un dato interno. Confirmar con la empresa qué significa.

## Actualizar precios / productos
Edita `js/products.js`. Cada producto: `{id, codigo, marca, nombre, categoria, linea, especificaciones:{}, precioUSD}`.
Para regenerarlo desde nuevos PDF hay que repetir la extracción (ver script usado en la conversación) o editar los valores a mano.

## Fotos
Para buscar fotos automáticamente por nombre (en tu PC, con internet): `pip install ddgs pillow requests` y luego `python scripts/buscar_fotos.py` (o con códigos: `python scripts/buscar_fotos.py TLF011`). Revisa cada foto en `assets/products/` y `scripts/fotos_revision.csv`.

Manual: Copia la foto a `assets/products/` (ej. `assets/products/apple/iphone-17-pro-max.jpg`) y regístrala en `js/images.js`:
```js
window.IMAGENES = { "TLF011": "assets/products/apple/iphone-17-pro-max.jpg" };
```
Mientras un código no tenga foto, la tarjeta muestra un espacio provisional con la marca. **No hay fotos incluidas**: no se pudieron descargar imágenes en este entorno y no se usan fotos que no correspondan al modelo.

## Tasa BCV
Botón "Tasa BCV" del encabezado: se escribe el valor y la fecha; se guarda en el navegador (localStorage). No hay tasa por defecto. Para fijar una por defecto, edita `js/script.js`.

## Teléfonos, WhatsApp y sucursales
En `js/script.js`, bloque `CONFIG`:
- `telefonos`: los de las listas (el `0414-19240480` de las listas tiene un dígito de más y se omitió).
- `whatsappPrincipal`: provisional (primer número de la lista). Verificar cuál es WhatsApp.
- `sucursales`: nombres de las listas; falta dirección, horario y teléfono propio.

## Pendiente de confirmar con World Shop
Direcciones, horarios, línea de WhatsApp por sucursal, logo oficial en alta resolución, colores corporativos (el acento celeste proviene del encabezado de las listas), condiciones por método de pago, disponibilidad, redes sociales.

## Financiamiento
Sección "Financiamiento" en `index.html` (id `promociones`): Cashea 0% inicial niveles 3/4/5/6 (6, 6, 9 y 12 cuotas) y Krece. Editar el texto directamente en esa sección.
