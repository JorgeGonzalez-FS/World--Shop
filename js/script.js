/* World Shop – catálogo. JavaScript vanilla, sin dependencias. */
'use strict';

/* ===== CONFIGURACIÓN (editar aquí) ===== */
const CONFIG = {
  // Teléfonos tal como aparecen en las listas de precios. NO está confirmado cuáles son WhatsApp ni a qué sucursal corresponde cada uno.
  telefonos: ['0412-4309948','0424-9030577','0424-9030576','0416-4263322','0424-9185127','0424-1645791','0416-4083942','0424-9283266','0416-4110699'],
  // Línea usada por los botones de WhatsApp (provisional: la primera de la lista). Cambiar tras verificar.
  whatsappPrincipal: '0412-4309948',
  // Sucursales citadas en las listas. Dirección y horario: por verificar.
  sucursales: [
    {nombre:'C.C. Alta Vista I', busqueda:'World Shop C.C. Alta Vista I'},
    {nombre:'C.C. Alta Vista II', busqueda:'World Shop C.C. Alta Vista II'},
    {nombre:'C.C. Babilonia Mall Center', busqueda:'World Shop C.C. Babilonia Mall Center'},
    {nombre:'San Félix, entrada Calle Páez', busqueda:'World Shop San Félix calle Páez'},
    {nombre:'C.C. Orinokia Mall', busqueda:'World Shop C.C. Orinokia Mall'}
  ],
  destacados: ['TLF011','TLF408','TLF177','LNB099','LNB539','LNB861','LNB360','LTP043'],
  porPagina: 24
};

const $ = (s, r = document) => r.querySelector(s);
const P = window.PRODUCTOS || [];
const IMG = window.IMAGENES || {};
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd = n => '$ ' + n.toLocaleString('de-DE', {minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2});
const waNum = t => '58' + t.replace(/\D/g, '').replace(/^0/, '');
const waLink = (txt, tel = CONFIG.whatsappPrincipal) => `https://wa.me/${waNum(tel)}?text=${encodeURIComponent(txt)}`;

/* ===== Tasa BCV (manual, guardada en el navegador) ===== */
let tasa = null;
try { tasa = JSON.parse(localStorage.getItem('ws_tasa') || 'null'); } catch (e) { tasa = null; }
function bs(n) {
  if (!tasa || !tasa.valor) return '<small>Bs.: define la tasa BCV</small>';
  const v = (n * tasa.valor).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  return `Bs. ${v} <small>(tasa ${tasa.valor}${tasa.fecha ? ' · ' + tasa.fecha : ''})</small>`;
}
function pintarTasa() { $('#tasaLabel').textContent = tasa && tasa.valor ? tasa.valor + ' Bs/USD' : 'sin definir'; }

/* ===== Tarjetas ===== */
const iniciales = p => p.marca.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
function foto(p) {
  return IMG[p.codigo]
    ? `<div class="ph" data-id="${p.id}"><img src="${esc(IMG[p.codigo])}" alt="${esc(p.nombre)}" loading="lazy" width="320" height="240"></div>`
    : `<div class="ph" data-id="${p.id}" role="img" aria-label="Foto pendiente: ${esc(p.nombre)}"><b>${esc(p.marca.toUpperCase())}</b><small>Foto pendiente · ${esc(p.codigo)}</small></div>`;
}
function chips(p) {
  const e = Object.entries(p.especificaciones || {}).slice(0, 3);
  return e.length ? `<div class="chips">${e.map(([k, v]) => `<span>${esc(k === 'BTU' ? v + ' BTU' : v)}</span>`).join('')}</div>` : '';
}
let comp = [];
function card(p) {
  const msg = mensajeProducto(p);
  return `<article class="card">${foto(p)}<div class="cb">
    <span class="brand">${esc(p.marca)}</span>
    <h3 class="name" data-id="${p.id}">${esc(p.nombre)}</h3>
    <span class="code">Cód. ${esc(p.codigo)} · ${esc(p.categoria)}</span>${chips(p)}
    <div class="price">${usd(p.precioUSD)}</div><div class="bs">${bs(p.precioUSD)}</div>
    <div class="acts"><button class="btn small ghost" data-det="${p.id}">Ver detalle y pagos</button>
    <a class="btn small wa" target="_blank" rel="noopener" href="${waLink(msg)}">Consultar por WhatsApp</a>
    <label class="cmp"><input type="checkbox" data-cmp="${p.id}" ${comp.includes(p.id) ? 'checked' : ''}> Comparar</label></div></div></article>`;
}
function mensajeProducto(p) {
  return `Hola, World Shop. Estoy interesado en el producto: ${p.nombre} (${p.marca}).\nCódigo: ${p.codigo}\nPrecio de lista: ${usd(p.precioUSD)}\n¿Podrían indicarme si está disponible y cuáles son las condiciones de pago?`;
}

/* ===== Estado y filtros ===== */
const est = {pag: 1, lista: P.slice()};
function llenar(sel, vals) { sel.innerHTML = sel.innerHTML.split('</option>')[0] + '</option>' + vals.map(v => `<option>${esc(v)}</option>`).join(''); }
function opciones() {
  const uniq = k => [...new Set(P.map(p => p[k]))].sort((a, b) => a.localeCompare(b, 'es'));
  llenar($('#fLinea'), uniq('linea')); llenar($('#fCat'), uniq('categoria')); llenar($('#fMarca'), uniq('marca'));
}
function filtrar() {
  const toks = norm($('#q').value).split(/\s+/).filter(Boolean);
  const l = $('#fLinea').value, c = $('#fCat').value, m = $('#fMarca').value;
  const mn = parseFloat($('#pMin').value), mx = parseFloat($('#pMax').value);
  let r = P.filter(p => (!l || p.linea === l) && (!c || p.categoria === c) && (!m || p.marca === m) &&
    (isNaN(mn) || p.precioUSD >= mn) && (isNaN(mx) || p.precioUSD <= mx) &&
    toks.every(t => norm(p.nombre + ' ' + p.marca + ' ' + p.codigo + ' ' + p.categoria).includes(t)));
  const o = $('#orden').value;
  if (o === 'asc') r.sort((a, b) => a.precioUSD - b.precioUSD);
  else if (o === 'desc') r.sort((a, b) => b.precioUSD - a.precioUSD);
  else if (o === 'nombre') r.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  else if (o === 'marca') r.sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.precioUSD - b.precioUSD);
  est.lista = r; est.pag = 1; pintar();
}
function pintar() {
  const n = est.pag * CONFIG.porPagina, ver = est.lista.slice(0, n);
  $('#grid').innerHTML = ver.length ? ver.map(card).join('') : '<p class="muted">No hay productos con esos filtros. Prueba ampliar el rango de precio o buscar otra palabra.</p>';
  $('#contador').textContent = `${est.lista.length} producto(s) · mostrando ${ver.length}`;
  $('#mas').hidden = ver.length >= est.lista.length;
}

/* ===== Detalle ===== */
function detalle(id) {
  const p = P.find(x => x.id === id); if (!p) return;
  const specs = Object.entries(p.especificaciones || {}).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(k === 'BTU' ? v + ' BTU' : v)}</td></tr>`).join('');
  $('#dlgBody').innerHTML = `<div class="det">${foto(p)}<div>
    <span class="brand">${esc(p.marca)}</span><h3>${esc(p.nombre)}</h3>
    <table><tr><td>Código</td><td>${esc(p.codigo)}</td></tr><tr><td>Categoría</td><td>${esc(p.categoria)}</td></tr>${specs}</table>
    <p class="note">Especificaciones: solo las que figuran en la descripción de la lista de precios.</p>
    <div class="price">${usd(p.precioUSD)}</div><div class="bs">${bs(p.precioUSD)}</div>
    <p class="muted"><b>Pagos:</b> dólares físicos, USDT, PayPal, Zelle o bolívares a tasa BCV. Condiciones por método: por confirmar con la tienda.</p>
    <a class="btn wa" target="_blank" rel="noopener" href="${waLink(mensajeProducto(p))}">Consultar disponibilidad</a></div></div>`;
  $('#dlg').showModal();
}
function comparar() {
  const ps = comp.map(id => P.find(p => p.id === id));
  const keys = [...new Set(ps.flatMap(p => Object.keys(p.especificaciones || {})))];
  const fila = (t, f) => `<tr><th>${t}</th>${ps.map(p => `<td>${f(p)}</td>`).join('')}</tr>`;
  $('#dlgBody').innerHTML = `<h3>Comparación</h3><div style="overflow-x:auto"><table class="cmpt">
    ${fila('Producto', p => '<b>' + esc(p.nombre) + '</b>')}${fila('Marca', p => esc(p.marca))}${fila('Código', p => esc(p.codigo))}
    ${keys.map(k => fila(esc(k), p => esc((p.especificaciones || {})[k] || '—'))).join('')}
    ${fila('Precio USD', p => '<b>' + usd(p.precioUSD) + '</b>')}${fila('Bs.', p => bs(p.precioUSD))}</table></div>`;
  $('#dlg').showModal();
}
function barra() {
  $('#compBar').hidden = comp.length === 0;
  $('#compTxt').textContent = `${comp.length}/3 para comparar`;
  $('#compVer').disabled = comp.length < 2;
}

/* ===== Inicio ===== */
function init() {
  $('#totalProd').textContent = P.length.toLocaleString('de-DE');
  opciones(); pintarTasa();
  const mc=[...new Set(P.map(p=>p.marca))];
  $('#stMarca').textContent=mc.length; $('#stCat').textContent=new Set(P.map(p=>p.categoria)).size;
  const mq=['Apple','Samsung','Xiaomi','Honor','Motorola','Hisense','TCL','Aiwa','Omega','Jaguar','Mystic','Sankey','LG','Midea','Infinix','Tecno'].filter(m=>mc.includes(m)).map(m=>`<span>${esc(m)}</span>`).join('');
  $('#marq').innerHTML=mq+mq;
  const cnt = {}; P.forEach(p => cnt[p.categoria] = (cnt[p.categoria] || 0) + 1);
  $('#cats').innerHTML = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<button class="cat" data-cat="${esc(c)}"><b>${esc(c)}</b><small>${n} productos</small></button>`).join('');
  $('#destacados').innerHTML = CONFIG.destacados.map(c => P.find(p => p.codigo === c)).filter(Boolean).map(card).join('');
  $('#sucursales').innerHTML = CONFIG.sucursales.map(s => `<article class="card-p"><h3>${esc(s.nombre)}</h3>
    <p class="muted">Dirección: por verificar<br>Horario: por verificar<br>Teléfono propio: por verificar</p>
    <a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.busqueda)}">Buscar en Google Maps</a>
    <a class="btn small wa" target="_blank" rel="noopener" href="${waLink('Hola, World Shop. Quisiera información de la sucursal ' + s.nombre + '.')}">Contactar</a></article>`).join('');
  $('#selSuc').innerHTML = '<option>Cualquiera</option>' + CONFIG.sucursales.map(s => `<option>${esc(s.nombre)}</option>`).join('');
  $('#telefonos').innerHTML = CONFIG.telefonos.map(t => `<li>${esc(t)}</li>`).join('');
  $('#waKrece').href = waLink('Hola, World Shop. Quisiera información sobre el financiamiento con Krece.');
  $('#waEnvio').href = waLink('Hola, World Shop. Quisiera enviar un producto a otra ciudad por Zoom o MRW. ¿Cómo se coordina?');
  $('#waFloat').href = waLink('Hola, World Shop. Quisiera hacer una consulta.');
  filtrar(); barra();
}

/* ===== Eventos ===== */
document.addEventListener('click', e => {
  const t = e.target;
  const det = t.closest('[data-det],.ph[data-id],.name[data-id]');
  if (det) return detalle(det.dataset.det || det.dataset.id);
  const cat = t.closest('[data-cat]');
  if (cat) { $('#fCat').value = cat.dataset.cat; filtrar(); $('#catalogo').scrollIntoView(); }
});
document.addEventListener('change', e => {
  const c = e.target.closest('[data-cmp]'); if (!c) return;
  const id = c.dataset.cmp;
  if (c.checked) { if (comp.length >= 3) { c.checked = false; return alert('Puedes comparar hasta 3 productos.'); } comp.push(id); }
  else comp = comp.filter(x => x !== id);
  barra();
});
['q', 'pMin', 'pMax'].forEach(i => $('#' + i).addEventListener('input', filtrar));
['fLinea', 'fCat', 'fMarca', 'orden'].forEach(i => $('#' + i).addEventListener('change', filtrar));
$('#limpiar').addEventListener('click', () => { $('#filtros').reset(); filtrar(); });
$('#mas').addEventListener('click', () => { est.pag++; pintar(); });
$('#compVer').addEventListener('click', comparar);
$('#compClr').addEventListener('click', () => { comp = []; barra(); pintar(); });
$('#dlgX').addEventListener('click', () => $('#dlg').close());
$('#burger').addEventListener('click', () => { const o = $('#nav').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); });
$('#nav').addEventListener('click', () => $('#nav').classList.remove('open'));
$('#btnTasa').addEventListener('click', () => { $('#tasaIn').value = tasa ? tasa.valor : ''; $('#tasaFecha').value = tasa ? tasa.fecha : ''; $('#dlgTasa').showModal(); });
$('#dlgTasa').addEventListener('click', e => { if (e.target.hasAttribute('data-close')) $('#dlgTasa').close(); });
$('#tasaOk').addEventListener('click', () => {
  const v = parseFloat($('#tasaIn').value);
  if (!(v > 0)) return alert('Introduce una tasa válida mayor que 0.');
  tasa = {valor: v, fecha: $('#tasaFecha').value || new Date().toISOString().slice(0, 10)};
  try { localStorage.setItem('ws_tasa', JSON.stringify(tasa)); } catch (e) {}
  pintarTasa(); $('#dlgTasa').close(); pintar(); $('#destacados').innerHTML = CONFIG.destacados.map(c => P.find(p => p.codigo === c)).filter(Boolean).map(card).join('');
});
$('#tasaBorrar').addEventListener('click', () => {
  tasa = null; try { localStorage.removeItem('ws_tasa'); } catch (e) {}
  pintarTasa(); $('#dlgTasa').close(); pintar(); $('#destacados').innerHTML = CONFIG.destacados.map(c => P.find(p => p.codigo === c)).filter(Boolean).map(card).join('');
});
$('#formContacto').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  window.open(waLink(`Hola, World Shop. Soy ${f.nombre.value}. ${f.mensaje.value}\nSucursal de interés: ${f.sucursal.value}.`), '_blank', 'noopener');
});
init();
