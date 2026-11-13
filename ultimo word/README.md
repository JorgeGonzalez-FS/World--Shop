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

## Pedido por WhatsApp y sucursal
- Cada producto tiene "Agregar al pedido"; el botón 🛒 del encabezado abre el pedido y lo envía completo en un solo mensaje.
- "Mi sucursal de preferencia" se guarda en el navegador y se añade a todos los mensajes. Para dirigir los mensajes a un número distinto por sucursal, agrega `telefono:'04xx-xxxxxxx'` a esa sucursal en `CONFIG.sucursales` (js/script.js).

## Fotos
1. Copia cada foto a `assets/products/` con el **código del producto** como nombre (ej. `TLF011.jpg`, también `.png` o `.webp`; puede ir en subcarpetas).
2. Doble clic en `scripts/actualizar_fotos.bat` (o `python scripts/generar_imagenes.py`): registra las fotos en `js/images.js`.
3. Recarga la página. Para buscarlas automáticamente: `scripts/descargar_fotos.bat` (ya actualiza images.js).
Consejo de rapidez: fotos de unos 700 px de lado y menos de 100 KB cada una (JPG/WebP).

## Cuentas de clientes y administrador (MODO DEMOSTRACIÓN)
- Botón 👤 del encabezado: **Crear cuenta** (nombres, apellidos, cédula, fecha de nacimiento, correo, teléfono, contraseña segura) e **Iniciar sesión**. Para **enviar un pedido** (🛒) hay que tener sesión de cliente.
- Administrador: la primera vez, en la ventana de inicio de sesión, usa "Soy el administrador: configurar acceso" y crea tu correo y contraseña. Desde tu sesión ves el panel (clientes, pedidos, exportar CSV, tasa BCV).
- Seguridad actual: contraseñas con hash PBKDF2 + sal (nunca en texto plano), validación de cédula/teléfono/edad (+18), bloqueo de 60 s tras 5 intentos fallidos.
- **Límite importante:** esta versión no tiene servidor. Los datos de cada cliente se guardan solo en SU navegador, por lo que **el administrador no verá a los clientes que se registren desde otros dispositivos**, y cualquiera con conocimientos técnicos puede manipular lo guardado en su propio navegador. Sirve para demostrar el flujo al dueño, **no para recoger datos reales de clientes** (cédula, fecha de nacimiento).
- Para producción: conectar un servicio de autenticación y base de datos (por ejemplo Supabase o Firebase), con reglas de acceso para que cada cliente solo vea sus datos y solo el administrador vea la lista. Además, informar el uso de datos personales y cuidar su resguardo. El archivo `js/auth.js` concentra toda la lógica para sustituirla.
