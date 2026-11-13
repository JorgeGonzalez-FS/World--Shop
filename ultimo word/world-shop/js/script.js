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
    // Si conoces el WhatsApp de una sucursal, añade  telefono:'0412-0000000'  y los mensajes de esa sucursal irán a ese número.
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
let miSuc = ''; try { miSuc = localStorage.getItem('ws_suc') || ''; } catch (e) {}
const telSuc = () => { const s = CONFIG.sucursales.find(x => x.nombre === miSuc); return (s && s.telefono) || CONFIG.whatsappPrincipal; };
const lineaSuc = () => miSuc ? `\nSucursal de interés: ${miSuc}` : '';
const waLink = (txt, tel) => `https://wa.me/${waNum(tel || telSuc())}?text=${encodeURIComponent(txt)}`;

/* ===== Tasa BCV (manual, guardada en el navegador) ===== */
let tasa = null;
try { tasa = JSON.parse(localStorage.getItem('ws_tasa') || 'null'); } catch (e) { tasa = null; }
function bs(n) {
  if (!tasa || !tasa.valor) return '<small>Bs.: define la tasa BCV</small>';
  const v = (n * tasa.valor).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  return `Bs. ${v} <small>(tasa ${tasa.valor}${tasa.fecha ? ' · ' + tasa.fecha : ''})</small>`;
}
function pintarTasa() { $('#tasaLabel').textContent = tasa && tasa.valor ? tasa.valor + ' Bs/USD' : 'sin definir'; if (window.pintarPagoBs) window.pintarPagoBs(); }

/* ===== Tarjetas ===== */
const iniciales = p => p.marca.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
function foto(p) {
  // Si existe assets/products/<CODIGO>.jpg se muestra sola; si no, queda el espacio provisional.
  const src = IMG[p.codigo] || `assets/products/${p.codigo}.jpg`;
  return `<div class="ph" data-id="${p.id}" role="img" aria-label="${esc(p.nombre)}"><span class="fb"><b>${esc(p.marca.toUpperCase())}</b><small>Foto pendiente · ${esc(p.codigo)}</small></span><img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()"></div>`;
}
function chips(p) {
  const e = Object.entries(p.especificaciones || {}).slice(0, 3);
  return e.length ? `<div class="chips">${e.map(([k, v]) => `<span>${esc(k === 'BTU' ? v + ' BTU' : v)}</span>`).join('')}</div>` : '';
}
let comp = [];
function card(p) {
  const msg = mensajeProducto(p);
  const cond=(p.especificaciones||{})['Condición'];
  return `<article class="card">${cond?`<span class="ribbon">${esc(cond)}</span>`:''}${foto(p)}<div class="cb">
    <span class="brand">${esc(p.marca)}</span>
    <h3 class="name" data-id="${p.id}">${esc(p.nombre)}</h3>
    <span class="code">Cód. ${esc(p.codigo)} · ${esc(p.categoria)}</span>${chips(p)}
    <div class="price">${usd(p.precioUSD)}</div><div class="bs">${bs(p.precioUSD)}</div>
    <div class="acts"><button class="btn small add" data-add="${p.id}">🛒 Agregar al pedido</button><button class="btn small ghost" data-det="${p.id}">Ver detalle y pagos</button>
    <a class="btn small wa" target="_blank" rel="noopener" href="${waLink(msg)}">Consultar por WhatsApp</a>
    <label class="cmp"><input type="checkbox" data-cmp="${p.id}" ${comp.includes(p.id) ? 'checked' : ''}> Comparar</label></div></div></article>`;
}
function mensajeProducto(p) {
  return `Hola, World Shop. Estoy interesado en el producto: ${p.nombre} (${p.marca}).\nCódigo: ${p.codigo}\nPrecio de lista: ${usd(p.precioUSD)}\n¿Podrían indicarme si está disponible y cuáles son las condiciones de pago?${lineaSuc()}`;
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
    <div class="finbox"><b>💳 Financiamiento</b><span>Cashea 0% de inicial: nivel 3 y 4 en 6 cuotas · nivel 5 en 9 · nivel 6 en 12. También Krece.</span><span>🚚 Delivery gratis en Puerto Ordaz y San Félix · 📦 Envíos a todo el país por Zoom y MRW.</span></div>
    <p class="muted"><b>Pagos:</b> dólares físicos, USDT, PayPal, Zelle o bolívares a tasa BCV. Condiciones por método: por confirmar con la tienda.</p>
    <div class="row"><button class="btn add" data-add="${p.id}">🛒 Agregar al pedido</button><a class="btn wa" target="_blank" rel="noopener" href="${waLink(mensajeProducto(p))}">Consultar disponibilidad</a></div></div></div>`;
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
  const ICO = {'Teléfonos':'📱','Televisores':'📺','Aires acondicionados':'❄️','Refrigeradores y neveras':'🧊','Lavadoras y secadoras':'🧺','Congeladores':'🥶','Cocinas':'🍳','Hornos':'🔥','Microondas':'🍲','Colchones y camas':'🛏️','Laptops y computadoras':'💻','Tablets':'📲','Smartwatch y audio':'⌚','Consolas y gaming':'🎮','Streaming (Roku, Fire TV, Onn)':'📡','Dispensadores de agua':'🚰','Fabricadores de hielo':'🍧','Cortinas de aire':'🌬️','Extractores':'🌀','Otros':'✨'};
  const GR = [['#00b0f0','#6d28d9'],['#7c3aed','#ec4899'],['#0ea5e9','#10b981'],['#f97316','#ec4899'],['#6366f1','#06b6d4'],['#10b981','#0ea5e9'],['#f43f5e','#f59e0b'],['#8b5cf6','#00b0f0']];
  const min = {}; P.forEach(p => { min[p.categoria] = Math.min(min[p.categoria] ?? Infinity, p.precioUSD); });
  $('#cats').innerHTML = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([c, n], i) => `<button class="cat" style="--g1:${GR[i % 8][0]};--g2:${GR[i % 8][1]}" data-cat="${esc(c)}"><span class="ico" aria-hidden="true">${ICO[c] || '🛒'}</span><b>${esc(c)}</b><small>${n} productos</small><em>desde ${usd(min[c])}</em></button>`).join('');
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
$('#quick').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#filtros').reset();
  if (b.dataset.p) { const [a, z] = b.dataset.p.split('-'); $('#pMin').value = a; $('#pMax').value = z; }
  if (b.dataset.q) $('#q').value = b.dataset.q;
  filtrar();
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold: .08});
  document.querySelectorAll('.sec,.benef').forEach(el => { el.classList.add('rv'); io.observe(el); });
}
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

/* ===== Pedido por WhatsApp (carrito) ===== */
let cart = {}; try { cart = JSON.parse(localStorage.getItem('ws_cart') || '{}'); } catch (e) { cart = {}; }
const guardarCart = () => { try { localStorage.setItem('ws_cart', JSON.stringify(cart)); } catch (e) {} $('#cartN').textContent = Object.values(cart).reduce((a, b) => a + b, 0); };
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 1800); }
function pedidoTexto(nombre) {
  const it = Object.entries(cart).map(([id, q]) => [P.find(p => p.id === id), q]).filter(x => x[0]);
  let tot = 0;
  const lin = it.map(([p, q], i) => { tot += p.precioUSD * q; return `${i + 1}) ${p.nombre} (${p.marca}) · Cód. ${p.codigo} · x${q} · ${usd(p.precioUSD)} c/u`; }).join('\n');
  return `Hola, World Shop. Quisiera cotizar este pedido${nombre ? ' a nombre de ' + nombre : ''}:\n${lin}\nTotal de lista: ${usd(tot)}\n¿Me confirman disponibilidad y condiciones de pago (o financiamiento)?${lineaSuc()}`;
}
function pintarCart() {
  const it = Object.entries(cart).map(([id, q]) => [P.find(p => p.id === id), q]).filter(x => x[0]);
  const body = $('#cartBody');
  if (!it.length) { body.innerHTML = '<p class="muted">Tu pedido está vacío. Agrega productos desde el catálogo y envía la lista completa por WhatsApp en un solo mensaje.</p>'; return; }
  const tot = it.reduce((a, [p, q]) => a + p.precioUSD * q, 0);
  body.innerHTML = `<ul class="cl-list">${it.map(([p, q]) => `<li><div><b>${esc(p.nombre)}</b><small>${esc(p.marca)} · ${esc(p.codigo)}</small><span>${usd(p.precioUSD)} c/u</span></div>
    <div class="qty"><button data-cq="${p.id}" data-cd="-1" aria-label="Menos">−</button><b>${q}</b><button data-cq="${p.id}" data-cd="1" aria-label="Más">+</button><button data-cq="${p.id}" data-cd="x" aria-label="Quitar">🗑</button></div></li>`).join('')}</ul>
    <div class="cl-tot"><span>Total de lista</span><b>${usd(tot)}</b></div><div class="bs">${bs(tot)}</div>
    <label class="cl-f">Tu nombre (opcional)<input id="cartNombre" autocomplete="name"></label>
    <label class="cl-f">Sucursal de interés<select id="cartSuc"><option value="">Sin elegir</option>${CONFIG.sucursales.map(s => `<option ${s.nombre === miSuc ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
    <div class="row"><a class="btn wa" id="cartSend" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a><button class="btn ghost" id="cartClr">Vaciar</button></div>
    <p class="muted">Es una cotización: la disponibilidad y las condiciones las confirma el vendedor.</p>`;
  const upd = () => { $('#cartSend').href = waLink(pedidoTexto($('#cartNombre').value.trim())); };
  $('#cartNombre').addEventListener('input', upd);
  $('#cartSuc').addEventListener('change', e => { fijarSuc(e.target.value); upd(); });
  $('#cartClr').addEventListener('click', () => { cart = {}; guardarCart(); pintarCart(); });
  upd();
}
function fijarSuc(v) { miSuc = v; try { localStorage.setItem('ws_suc', v); } catch (e) {} const m = $('#miSuc'); if (m) m.value = v; pintar(); }
document.addEventListener('click', e => {
  const a = e.target.closest('[data-add]');
  if (a) { const id = a.dataset.add; cart[id] = (cart[id] || 0) + 1; guardarCart(); toast('✓ Agregado a tu pedido'); return; }
  const q = e.target.closest('[data-cq]');
  if (q) { const id = q.dataset.cq; if (q.dataset.cd === 'x') delete cart[id]; else { cart[id] = Math.max(0, (cart[id] || 0) + Number(q.dataset.cd)); if (!cart[id]) delete cart[id]; } guardarCart(); pintarCart(); }
  if (e.target.hasAttribute && e.target.hasAttribute('data-closec')) $('#dlgCart').close();
});
$('#cartBtn').addEventListener('click', () => { pintarCart(); $('#dlgCart').showModal(); });
$('#miSuc').innerHTML = '<option value="">Sin elegir</option>' + CONFIG.sucursales.map(s => `<option ${s.nombre === miSuc ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('');
$('#miSuc').addEventListener('change', e => fijarSuc(e.target.value));
guardarCart();

/* ===== Métodos de pago (tarjetas 3D) ===== */
(function () {
  const M = [['Dólares físicos', '💵', '#16a34a,#065f46'], ['USDT', '🪙', '#14b8a6,#0f766e'], ['PayPal', '🌐', '#3b82f6,#1e3a8a'], ['Zelle', '⚡', '#8b5cf6,#4c1d95'], ['Bolívares a tasa BCV', '🇻🇪', '#f59e0b,#b45309']];
  const box = $('#paycards'); if (!box) return;
  box.innerHTML = M.map((m, i) => `<div class="pc" tabindex="0" role="button" aria-label="${esc(m[0])}" style="--c:${m[2].split(',')[0]};--d:${m[2].split(',')[1]}">
    <div class="pc-in"><div class="pc-f"><span class="pc-i">${m[1]}</span><b>${esc(m[0])}</b></div>
    <div class="pc-b"><b>${esc(m[0])}</b>${i === 4 ? '<span id="payBs" class="pbs"></span>' : '<span>Disponible en World Shop</span>'}
    <a class="btn small wa" target="_blank" rel="noopener" href="${waLink('Hola, World Shop. Quisiera pagar con: ' + m[0] + '. ¿Qué condiciones manejan?')}">Preguntar</a></div></div></div>`).join('');
  box.addEventListener('click', e => { const c = e.target.closest('.pc'); if (c && !e.target.closest('a')) c.classList.toggle('flip'); });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const c = e.target.closest('.pc'); if (c) { e.preventDefault(); c.classList.toggle('flip'); } } });
  window.pintarPagoBs = () => { const el = $('#payBs'); if (el) el.textContent = tasa && tasa.valor ? `Tasa BCV: ${tasa.valor} Bs/USD${tasa.fecha ? ' (' + tasa.fecha + ')' : ''}` : 'Toca "Tasa BCV" arriba para calcular en Bs.'; };
  window.pintarPagoBs();
})();

/* ===== Financiamiento interactivo ===== */
(function () {
  const L = {3: 6, 4: 6, 5: 9, 6: 12}, box = $('#lvls'), out = $('#lvlOut'); if (!box) return;
  box.innerHTML = Object.keys(L).map(n => `<button type="button" role="tab" data-n="${n}">Nivel ${n}</button>`).join('');
  function sel(n) {
    box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.n === String(n)));
    out.innerHTML = `<div class="big"><b>${L[n]}</b><span>cuotas</span></div><div><div class="dots">${Array.from({length: L[n]}, (_, i) => `<i style="animation-delay:${i * 60}ms"></i>`).join('')}</div><p><b>Nivel ${n}:</b> ${L[n]} cuotas con <b>0% de inicial</b></p></div>`;
  }
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (b) sel(b.dataset.n); });
  sel(6);
})();

/* ===== Asistente de atención al cliente ===== */
(function () {
  const btn = $('#chatBtn'), bx = $('#chatBox'), msgs = $('#chatMsgs'), opts = $('#chatOpts'); if (!btn) return;
  const vend = '💬 Hablar con un vendedor';
  const OP = [
    ['🔎 Buscar un producto', 'Escribe en el buscador el nombre, marca o modelo (ej. iPhone 17 o aire split 12000). Te llevo al catálogo.', '#catalogo', () => setTimeout(() => $('#q').focus(), 600)],
    ['💳 Financiamiento', 'Cashea con 0% de inicial: niveles 3 y 4 en 6 cuotas, nivel 5 en 9 y nivel 6 en 12. También Krece.', '#promociones'],
    ['🚚 Delivery y envíos', 'Delivery gratis en Puerto Ordaz y San Félix. Enviamos a toda Venezuela por Zoom y MRW.', '#envios'],
    ['📍 Sucursales', 'Tenemos tiendas en C.C. Alta Vista I y II, Babilonia Mall Center, San Félix (Calle Páez) y Orinokia Mall.', '#sucursales'],
    ['💵 Métodos de pago', 'Dólares físicos, USDT, PayPal, Zelle y bolívares a tasa BCV.', '#pagos'],
    [vend, 'Con gusto. Te abro WhatsApp con un mensaje listo.', null]
  ];
  const say = (t, me) => { const d = document.createElement('div'); d.className = 'msg' + (me ? ' me' : ''); d.textContent = t; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
  function menu() { opts.innerHTML = OP.map((o, i) => `<button type="button" data-i="${i}">${esc(o[0])}</button>`).join(''); }
  function abrir() { bx.hidden = false; btn.setAttribute('aria-expanded', 'true'); if (!msgs.children.length) { say('¡Hola! 👋 Soy el asistente de World Shop. ¿En qué te ayudo?'); menu(); } }
  btn.addEventListener('click', () => bx.hidden ? abrir() : (bx.hidden = true));
  $('#chatX').addEventListener('click', () => { bx.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
  opts.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const o = OP[b.dataset.i];
    say(o[0], true); say(o[1]);
    if (o[2]) { const a = document.createElement('a'); a.className = 'msg lnk'; a.href = o[2]; a.textContent = 'Ir a la sección →'; a.addEventListener('click', () => { bx.hidden = true; if (o[3]) o[3](); }); msgs.appendChild(a); }
    else { const a = document.createElement('a'); a.className = 'msg lnk wa'; a.target = '_blank'; a.rel = 'noopener'; a.href = waLink('Hola, World Shop. Quisiera hablar con un vendedor.'); a.textContent = 'Abrir WhatsApp →'; msgs.appendChild(a); }
    msgs.scrollTop = msgs.scrollHeight;
  });
})();

/* ===== Portada 3D ===== */
(function hero() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // palabras rotativas
  const words = ['teléfonos', 'televisores', 'aires acondicionados', 'neveras', 'laptops', 'lavadoras'];
  const rot = $('#rot'); let wi = 0;
  if (rot && !reduce) setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 350);
  }, 2400);
  // etiquetas con datos reales del catálogo
  document.querySelectorAll('.dev[data-code]').forEach(d => {
    const p = P.find(x => x.codigo === d.dataset.code); if (!p) { d.hidden = true; return; }
    const nom = p.nombre.replace(/\s*\+\s*\d+\s*RAM/i, '').slice(0, 34);
    d.querySelector('.tag').innerHTML = `<b>${esc(nom)}</b><span>${usd(p.precioUSD)}</span>`;
    d.addEventListener('click', () => detalle(p.id));
  });
  // contador animado
  const tp = $('#totalProd');
  if (tp && !reduce) { const total = P.length, t0 = performance.now();
    (function tick(t) { const k = Math.min(1, (t - t0) / 1400); tp.textContent = Math.round(total * (1 - Math.pow(1 - k, 3))).toLocaleString('de-DE'); if (k < 1) requestAnimationFrame(tick); })(t0); }
  // parallax 3D con el mouse / giroscopio suave
  const scene = $('#scene'), stage = $('#stage'); if (!scene || reduce) return;
  let tx = -12, ty = 18, cx = tx, cy = ty, auto = true;
  scene.addEventListener('pointermove', e => { const r = scene.getBoundingClientRect(); auto = false;
    ty = ((e.clientX - r.left) / r.width - .5) * 50; tx = -((e.clientY - r.top) / r.height - .5) * 34; });
  scene.addEventListener('pointerleave', () => { auto = true; });
  (function loop(t) {
    if (auto) { ty = Math.sin(t / 2600) * 22; tx = -10 + Math.cos(t / 3100) * 7; }
    cx += (tx - cx) * .07; cy += (ty - cy) * .07;
    stage.style.transform = `rotateX(${cx}deg) rotateY(${cy}deg)`;
    requestAnimationFrame(loop);
  })(0);
})();
