/* World Shop – cuentas de clientes y administrador.
   ⚠ MODO DEMOSTRACIÓN: sin servidor, los datos se guardan SOLO en el navegador de cada persona (localStorage).
   Las contraseñas se guardan con hash (PBKDF2 + sal), nunca en texto plano, pero esto NO sustituye a un backend real.
   Para producción hay que conectar un servicio de autenticación (ver README). */
'use strict';
(function () {
  const K = {users: 'ws_users', sess: 'ws_sesion', orders: 'ws_orders', admin: 'ws_admin', tries: 'ws_intentos'};
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const enc = new TextEncoder();
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hasCrypto = !!(window.crypto && crypto.subtle);
  async function hashPw(pw, salt) {
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    return b64(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: 150000}, key, 256));
  }
  const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));
  const same = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
  const uid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ===== Validaciones ===== */
  const V = {
    nombre: v => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,60}$/.test(v.trim()),
    cedula: v => /^\d{6,9}$/.test(v),
    correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    tel: v => /^0?(4(12|14|16|24|26)|2\d{2})\d{7}$/.test(v.replace(/\D/g, '')),
    edad: v => { if (!v) return false; const d = new Date(v), h = new Date(); if (isNaN(d)) return false; let a = h.getFullYear() - d.getFullYear(); const m = h.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && h.getDate() < d.getDate())) a--; return a >= 18 && a <= 110; }
  };
  const pwRules = p => [[p.length >= 8, '8+ caracteres'], [/[a-z]/.test(p), 'minúscula'], [/[A-Z]/.test(p), 'MAYÚSCULA'], [/\d/.test(p), 'número'], [/[^A-Za-z0-9]/.test(p), 'símbolo']];
  const fmtTel = v => { const d = v.replace(/\D/g, '').replace(/^0/, ''); return '0' + d.slice(0, 3) + '-' + d.slice(3); };

  /* ===== Sesión ===== */
  const sesion = () => { const s = get(K.sess); if (!s || s.exp < Date.now()) return null; return get(K.users, []).find(u => u.id === s.id) || null; };
  const abrirSesion = u => set(K.sess, {id: u.id, exp: Date.now() + 7 * 864e5});
  const cerrar = () => { try { localStorage.removeItem(K.sess); } catch (e) {} pintarBtn(); };
  const esAdmin = u => u && u.rol === 'admin';

  /* ===== UI ===== */
  const dlg = $('#dlgAuth'), body = $('#authBody');
  function pintarBtn() {
    const u = sesion(), b = $('#userBtn');
    b.innerHTML = u ? `${esAdmin(u) ? '🛠' : '👤'} <span class="cl">${esc(u.nombres.split(' ')[0])}</span>` : '👤 <span class="cl">Ingresar</span>';
    b.classList.toggle('logged', !!u);
  }
  const campo = (id, label, attrs = '', extra = '') => `<label class="fld">${label}<input id="${id}" ${attrs}>${extra}<em class="err" id="e_${id}"></em></label>`;
  const demo = '<p class="demo">Modo demostración: los datos se guardan solo en este navegador.</p>';
  function err(id, msg) { const e = $('#e_' + id); if (e) e.textContent = msg || ''; const i = $('#' + id); if (i) i.classList.toggle('bad', !!msg); return !msg; }

  function vistaLogin(aviso) {
    const hayAdmin = !!get(K.admin);
    body.innerHTML = `<h3>Iniciar sesión</h3>${aviso ? `<p class="aviso">${esc(aviso)}</p>` : ''}
      <form id="fLogin" class="af" novalidate>
        ${campo('lCorreo', 'Correo electrónico', 'type="email" autocomplete="username" required')}
        ${campo('lPw', 'Contraseña', 'type="password" autocomplete="current-password" required')}
        <button class="btn" type="submit" id="lGo">Entrar</button><em class="err" id="e_login"></em>
      </form>
      <p class="alt">¿No tienes cuenta? <a href="#" data-v="registro">Crear cuenta</a> · <a href="${waLink('Hola, World Shop. Olvidé mi contraseña de la página web.')}" target="_blank" rel="noopener">Olvidé mi contraseña</a></p>
      ${hayAdmin ? '' : '<p class="alt"><a href="#" data-v="admin">Soy el administrador: configurar acceso</a></p>'}${demo}`;
    $('#fLogin').addEventListener('submit', async e => {
      e.preventDefault();
      const t = get(K.tries, {n: 0, hasta: 0});
      if (t.hasta > Date.now()) return err('login', `Demasiados intentos. Espera ${Math.ceil((t.hasta - Date.now()) / 1000)} s.`);
      if (!hasCrypto) return err('login', 'Abre la página con https o desde una carpeta local en Chrome/Opera para iniciar sesión.');
      const correo = $('#lCorreo').value.trim().toLowerCase(), pw = $('#lPw').value;
      const u = get(K.users, []).find(x => x.correo === correo);
      $('#lGo').disabled = true;
      const ok = u && same(await hashPw(pw, u.salt), u.hash);
      $('#lGo').disabled = false;
      if (!ok) { t.n++; if (t.n >= 5) { t.hasta = Date.now() + 60000; t.n = 0; } set(K.tries, t); return err('login', 'Correo o contraseña incorrectos.'); }
      set(K.tries, {n: 0, hasta: 0}); abrirSesion(u); pintarBtn();
      toast('✓ Bienvenido, ' + u.nombres.split(' ')[0]);
      if (dlg.dataset.volver === 'cart') { dlg.close(); $('#cartBtn').click(); } else vistaCuenta();
    });
  }

  function vistaRegistro() {
    const max = new Date(); max.setFullYear(max.getFullYear() - 18);
    body.innerHTML = `<h3>Crear cuenta de cliente</h3><p class="muted">Para enviar pedidos desde la página.</p>
      <form id="fReg" class="af" novalidate>
        <div class="two">${campo('rNom', 'Nombres', 'autocomplete="given-name" maxlength="60"')}${campo('rApe', 'Apellidos', 'autocomplete="family-name" maxlength="60"')}</div>
        <div class="two"><label class="fld">Cédula<span class="ced"><select id="rTipo"><option>V</option><option>E</option></select><input id="rCed" inputmode="numeric" maxlength="9" placeholder="12345678" autocomplete="off"></span><em class="err" id="e_rCed"></em></label>
        ${campo('rFec', 'Fecha de nacimiento', `type="date" max="${max.toISOString().slice(0, 10)}" autocomplete="bday"`)}</div>
        ${campo('rCor', 'Correo electrónico', 'type="email" autocomplete="email"')}
        ${campo('rTel', 'Teléfono de contacto', 'type="tel" inputmode="tel" placeholder="0412-1234567" autocomplete="tel"')}
        ${campo('rPw', 'Contraseña segura', 'type="password" autocomplete="new-password"', '<div class="meter"><i id="meter"></i></div><small id="rules" class="rules"></small>')}
        ${campo('rPw2', 'Repite la contraseña', 'type="password" autocomplete="new-password"')}
        <label class="chk"><input type="checkbox" id="rOk"> Acepto que World Shop use mis datos para atender mis compras y contactarme.</label><em class="err" id="e_rOk"></em>
        <button class="btn" type="submit" id="rGo">Crear mi cuenta</button><em class="err" id="e_reg"></em>
      </form><p class="alt">¿Ya tienes cuenta? <a href="#" data-v="login">Iniciar sesión</a></p>${demo}`;
    const rules = () => { const p = $('#rPw').value, r = pwRules(p), n = r.filter(x => x[0]).length;
      $('#meter').style.width = (n * 20) + '%'; $('#meter').style.background = ['#ef4444', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'][n];
      $('#rules').innerHTML = r.map(x => `<span class="${x[0] ? 'ok' : ''}">${x[0] ? '✓' : '○'} ${x[1]}</span>`).join(' '); };
    $('#rPw').addEventListener('input', rules); rules();
    $('#rTel').addEventListener('blur', e => { if (V.tel(e.target.value)) e.target.value = fmtTel(e.target.value); });
    $('#fReg').addEventListener('submit', async e => {
      e.preventDefault();
      const d = {nom: $('#rNom').value.trim(), ape: $('#rApe').value.trim(), ced: $('#rCed').value.replace(/\D/g, ''), fec: $('#rFec').value, cor: $('#rCor').value.trim().toLowerCase(), tel: $('#rTel').value, pw: $('#rPw').value};
      const users = get(K.users, []);
      let ok = true;
      ok = err('rNom', V.nombre(d.nom) ? '' : 'Escribe tus nombres.') && ok;
      ok = err('rApe', V.nombre(d.ape) ? '' : 'Escribe tus apellidos.') && ok;
      ok = err('rCed', !V.cedula(d.ced) ? 'Cédula de 6 a 9 dígitos.' : (users.some(u => u.cedula === $('#rTipo').value + '-' + d.ced) ? 'Esta cédula ya está registrada.' : '')) && ok;
      ok = err('rFec', V.edad(d.fec) ? '' : 'Debes ser mayor de 18 años.') && ok;
      ok = err('rCor', !V.correo(d.cor) ? 'Correo no válido.' : (users.some(u => u.correo === d.cor) ? 'Este correo ya está registrado.' : '')) && ok;
      ok = err('rTel', V.tel(d.tel) ? '' : 'Teléfono venezolano válido (ej. 0412-1234567).') && ok;
      ok = err('rPw', pwRules(d.pw).every(x => x[0]) ? '' : 'La contraseña no cumple todos los requisitos.') && ok;
      ok = err('rPw2', d.pw === $('#rPw2').value ? '' : 'Las contraseñas no coinciden.') && ok;
      ok = err('rOk', $('#rOk').checked ? '' : 'Debes aceptar para continuar.') && ok;
      if (!ok) return;
      if (!hasCrypto) return err('reg', 'Abre la página con https o desde una carpeta local en Chrome/Opera.');
      $('#rGo').disabled = true;
      const salt = newSalt(), u = {id: uid(), rol: 'cliente', nombres: d.nom, apellidos: d.ape, cedula: $('#rTipo').value + '-' + d.ced, correo: d.cor, telefono: fmtTel(d.tel), nacimiento: d.fec, salt, hash: await hashPw(d.pw, salt), creado: new Date().toISOString()};
      users.push(u);
      if (!set(K.users, users)) { $('#rGo').disabled = false; return err('reg', 'No se pudo guardar (almacenamiento del navegador bloqueado).'); }
      abrirSesion(u); pintarBtn(); toast('✓ Cuenta creada');
      if (dlg.dataset.volver === 'cart') { dlg.close(); $('#cartBtn').click(); } else vistaCuenta();
    });
  }

  function vistaAdminSetup() {
    body.innerHTML = `<h3>🛠 Configurar administrador</h3><p class="muted">Crea el acceso del dueño de la página. Solo se puede hacer una vez por navegador.</p>
      <form id="fAd" class="af" novalidate>
        ${campo('aNom', 'Nombre del administrador', 'autocomplete="name"')}${campo('aCor', 'Correo del administrador', 'type="email" autocomplete="email"')}
        ${campo('aPw', 'Contraseña de administrador', 'type="password" autocomplete="new-password"', '<small id="aRules" class="rules"></small>')}${campo('aPw2', 'Repite la contraseña', 'type="password" autocomplete="new-password"')}
        <button class="btn" type="submit">Crear administrador</button><em class="err" id="e_ad"></em></form>
      <p class="alt"><a href="#" data-v="login">← Volver</a></p>${demo}`;
    const r = () => { $('#aRules').innerHTML = pwRules($('#aPw').value).map(x => `<span class="${x[0] ? 'ok' : ''}">${x[0] ? '✓' : '○'} ${x[1]}</span>`).join(' '); };
    $('#aPw').addEventListener('input', r); r();
    $('#fAd').addEventListener('submit', async e => {
      e.preventDefault(); const nom = $('#aNom').value.trim(), cor = $('#aCor').value.trim().toLowerCase(), pw = $('#aPw').value; let ok = true;
      ok = err('aNom', V.nombre(nom) ? '' : 'Escribe el nombre.') && ok; ok = err('aCor', V.correo(cor) ? '' : 'Correo no válido.') && ok;
      ok = err('aPw', pwRules(pw).every(x => x[0]) ? '' : 'No cumple los requisitos.') && ok; ok = err('aPw2', pw === $('#aPw2').value ? '' : 'No coinciden.') && ok;
      if (!ok) return; if (!hasCrypto) return err('ad', 'Abre la página con https o desde una carpeta local en Chrome/Opera.');
      const users = get(K.users, []); if (users.some(u => u.correo === cor)) return err('aCor', 'Ese correo ya existe como cliente.');
      const salt = newSalt(), u = {id: uid(), rol: 'admin', nombres: nom, apellidos: '', cedula: '', correo: cor, telefono: '', nacimiento: '', salt, hash: await hashPw(pw, salt), creado: new Date().toISOString()};
      users.push(u); set(K.users, users); set(K.admin, {id: u.id}); abrirSesion(u); pintarBtn(); toast('✓ Administrador creado'); vistaAdmin();
    });
  }

  function vistaCuenta() {
    const u = sesion(); if (!u) return vistaLogin(); if (esAdmin(u)) return vistaAdmin();
    const ped = get(K.orders, []).filter(o => o.userId === u.id).reverse();
    body.innerHTML = `<h3>👤 Mi cuenta</h3>
      <div class="acct"><b>${esc(u.nombres)} ${esc(u.apellidos)}</b><span>${esc(u.correo)}</span><span>${esc(u.telefono)} · Cédula ${esc(u.cedula)}</span></div>
      <h4>Mis pedidos enviados</h4>${ped.length ? `<ul class="ords">${ped.map(o => `<li><b>${new Date(o.fecha).toLocaleString('es-VE')}</b><span>${o.items.length} producto(s) · ${usd(o.total)}${o.sucursal ? ' · ' + esc(o.sucursal) : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Aún no has enviado pedidos.</p>'}
      <div class="row"><button class="btn" id="aCart">🛒 Ir a mi pedido</button><button class="btn ghost" id="aOut">Cerrar sesión</button></div>${demo}`;
    $('#aCart').addEventListener('click', () => { dlg.close(); $('#cartBtn').click(); });
    $('#aOut').addEventListener('click', () => { cerrar(); dlg.close(); toast('Sesión cerrada'); });
  }

  function vistaAdmin(q = '') {
    const u = sesion(); if (!esAdmin(u)) return vistaLogin();
    const cl = get(K.users, []).filter(x => x.rol === 'cliente'), ped = get(K.orders, []);
    const f = cl.filter(c => (c.nombres + ' ' + c.apellidos + ' ' + c.cedula + ' ' + c.correo + ' ' + c.telefono).toLowerCase().includes(q.toLowerCase()));
    dlg.classList.add('wide');
    body.innerHTML = `<h3>🛠 Panel de administración</h3><p class="muted">Sesión de ${esc(u.nombres)} (${esc(u.correo)})</p>
      <div class="kpis"><div><b>${cl.length}</b><span>clientes</span></div><div><b>${ped.length}</b><span>pedidos enviados</span></div><div><b>${usd(ped.reduce((a, o) => a + o.total, 0))}</b><span>total cotizado</span></div></div>
      <div class="row wrapr"><input id="adQ" placeholder="Buscar cliente (nombre, cédula, correo, teléfono)" value="${esc(q)}"><button class="btn small" id="adCsv">⬇ Exportar clientes (CSV)</button><button class="btn small ghost" id="adTasa">Tasa BCV</button><button class="btn small ghost" id="adOut">Cerrar sesión</button></div>
      <div class="tbl"><table><thead><tr><th>Cliente</th><th>Cédula</th><th>Correo</th><th>Teléfono</th><th>Nacimiento</th><th>Registro</th><th></th></tr></thead><tbody>
      ${f.map(c => `<tr><td>${esc(c.nombres)} ${esc(c.apellidos)}</td><td>${esc(c.cedula)}</td><td>${esc(c.correo)}</td><td>${esc(c.telefono)}</td><td>${esc(c.nacimiento)}</td><td>${new Date(c.creado).toLocaleDateString('es-VE')}</td><td><button class="btn small ghost" data-del="${c.id}" aria-label="Eliminar">🗑</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin clientes registrados.</td></tr>'}</tbody></table></div>
      <h4>Últimos pedidos</h4>${ped.length ? `<ul class="ords">${ped.slice(-8).reverse().map(o => { const c = cl.find(x => x.id === o.userId); return `<li><b>${new Date(o.fecha).toLocaleString('es-VE')} · ${esc(c ? c.nombres + ' ' + c.apellidos : 'Cliente eliminado')}</b><span>${o.items.map(i => esc(i.codigo) + ' x' + i.cant).join(', ')} · ${usd(o.total)}${o.sucursal ? ' · ' + esc(o.sucursal) : ''}</span></li>`; }).join('')}</ul>` : '<p class="muted">Sin pedidos todavía.</p>'}
      <p class="demo">Modo demostración: aquí solo se ven los clientes registrados en ESTE navegador. Para ver los de todos los dispositivos hace falta conectar un servidor (ver README). Los datos personales deben tratarse con cuidado.</p>`;
    $('#adQ').addEventListener('input', e => { const pos = e.target.value; vistaAdmin(pos); const i = $('#adQ'); i.focus(); i.setSelectionRange(pos.length, pos.length); });
    $('#adOut').addEventListener('click', () => { cerrar(); dlg.close(); toast('Sesión cerrada'); });
    $('#adTasa').addEventListener('click', () => { dlg.close(); $('#btnTasa').click(); });
    $('#adCsv').addEventListener('click', () => {
      const cab = ['Nombres', 'Apellidos', 'Cédula', 'Correo', 'Teléfono', 'Nacimiento', 'Registro'];
      const q2 = s => '"' + String(s).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
      const csv = '\ufeff' + [cab.map(q2).join(',')].concat(cl.map(c => [c.nombres, c.apellidos, c.cedula, c.correo, c.telefono, c.nacimiento, c.creado].map(q2).join(','))).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})); a.download = 'clientes-world-shop.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  function abrir(vista, opts = {}) {
    dlg.classList.remove('wide'); dlg.dataset.volver = opts.volver || '';
    (vista === 'registro' ? vistaRegistro : vista === 'admin' ? vistaAdminSetup : vista === 'cuenta' ? vistaCuenta : () => vistaLogin(opts.aviso))();
    if (!dlg.open) dlg.showModal();
  }
  body.addEventListener('click', e => {
    const a = e.target.closest('[data-v]'); if (a) { e.preventDefault(); abrir(a.dataset.v, {volver: dlg.dataset.volver}); }
    const d = e.target.closest('[data-del]');
    if (d && esAdmin(sesion()) && confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) { set(K.users, get(K.users, []).filter(x => x.id !== d.dataset.del)); vistaAdmin($('#adQ') ? $('#adQ').value : ''); }
  });
  $('#authX').addEventListener('click', () => dlg.close());
  $('#userBtn').addEventListener('click', () => abrir(sesion() ? 'cuenta' : 'login'));

  /* ===== Comprar: el pedido solo se envía con sesión de cliente ===== */
  document.addEventListener('click', e => {
    const a = e.target.closest('#cartSend'); if (!a) return;
    e.preventDefault();
    const u = sesion();
    if (!u || esAdmin(u)) { $('#dlgCart').close(); return abrir('login', {volver: 'cart', aviso: esAdmin(u) ? 'Inicia sesión con una cuenta de cliente para enviar pedidos.' : 'Inicia sesión o crea tu cuenta para enviar tu pedido.'}); }
    const items = Object.entries(cart).map(([id, q]) => [P.find(p => p.id === id), q]).filter(x => x[0]);
    if (!items.length) return;
    const incl = $('#cartCed') && $('#cartCed').checked;
    const txt = pedidoTexto(u.nombres + ' ' + u.apellidos) + `\nTeléfono: ${u.telefono}${incl ? '\nCédula: ' + u.cedula : ''}`;
    const orders = get(K.orders, []);
    orders.push({id: uid(), userId: u.id, fecha: new Date().toISOString(), sucursal: miSuc, total: items.reduce((s, [p, q]) => s + p.precioUSD * q, 0), items: items.map(([p, q]) => ({codigo: p.codigo, cant: q}))});
    set(K.orders, orders);
    window.open(waLink(txt), '_blank', 'noopener');
    toast('✓ Pedido enviado por WhatsApp');
  });
  // Casilla opcional para incluir la cédula (minimiza datos personales en el mensaje)
  new MutationObserver(() => {
    const b = $('#cartBody'), s = $('#cartSend'); if (!b || !s || $('#cartAuthBox')) return;
    const u = sesion(); const box = document.createElement('div'); box.id = 'cartAuthBox';
    box.innerHTML = u && !esAdmin(u) ? `<label class="chk" style="margin-top:10px"><input type="checkbox" id="cartCed"> Incluir mi cédula en el mensaje (para facturación)</label><p class="muted" style="margin:4px 0">Pedido a nombre de <b>${esc(u.nombres)} ${esc(u.apellidos)}</b>.</p>` : '<p class="muted" style="margin:10px 0 0">🔒 Para enviar el pedido debes iniciar sesión (solo clientes).</p>';
    s.parentNode.parentNode.insertBefore(box, s.parentNode);
  }).observe($('#cartBody'), {childList: true});
  pintarBtn();
  window.WSAuth = {abrir, sesion};
})();
