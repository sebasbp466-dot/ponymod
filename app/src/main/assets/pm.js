(function () {
  if (window.__pm) return;
  window.__pm = true;

  var CSS = `
.dropdown-menu,.modal-content,.popover,.popover-body,.card,.list-group-item,.tooltip-inner,.toast{
  background:rgba(18,18,28,.38)!important;
  -webkit-backdrop-filter:blur(16px) saturate(1.3)!important;backdrop-filter:blur(16px) saturate(1.3)!important;
  border:1px solid rgba(255,255,255,.22)!important;color:#fff!important}
.dropdown-menu,.modal-content,.popover{border-radius:20px!important}
.dropdown-menu *,.modal-content *,.popover *,.card *,.toast *{color:#fff!important;font-weight:800!important}
.dropdown-item:hover,.dropdown-item:focus,.list-group-item:hover{background:rgba(255,255,255,.18)!important}
.btn:not(.btn-success):not(.btn-danger):not(.btn-primary){
  background:rgba(18,18,28,.38)!important;border:1px solid rgba(255,255,255,.3)!important;color:#fff!important;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-weight:800}
.btn-success,.btn-primary,.btn-danger{-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:.93;font-weight:800}
.form-control,.custom-select,select,textarea{
  background:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.25)!important}

#pm-ov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,.18);font-family:system-ui,sans-serif}
#pm-ov.open{display:flex}
#pm-card{width:min(92vw,440px);height:min(78vh,640px);box-sizing:border-box;padding:16px;display:flex;flex-direction:column;gap:10px;
  background:rgba(18,18,28,.34);-webkit-backdrop-filter:blur(24px) saturate(1.3);backdrop-filter:blur(24px) saturate(1.3);
  border:1px solid rgba(255,255,255,.25);border-radius:28px;color:#fff;font-weight:800;font-size:15px;overflow:hidden}
#pm-tabs{display:flex;gap:8px}
#pm-tabs .pm-b{flex:1}
.pm-b{font:inherit;font-weight:800;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);
  border-radius:20px;padding:8px 14px;cursor:pointer}
.pm-b.on{background:rgba(255,255,255,.34)}
.pm-pane{display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;overflow:auto}
#pm-ov input{font:inherit;font-weight:800;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);
  border-radius:14px;padding:9px 14px;outline:none;box-sizing:border-box;width:100%}
#pm-ov input::placeholder{color:rgba(255,255,255,.6)}
#pm-ov label{margin-top:6px}
#pm-now{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pm-ctl{display:flex;gap:10px;justify-content:center}
#pm-list{flex:1;min-height:80px;overflow:auto}
.pm-it{padding:9px 6px;border-radius:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-it:active{background:rgba(255,255,255,.2)}
.pm-dim{opacity:.7;font-size:12px}
#pm-fab{position:fixed;left:10px;top:90px;width:44px;height:44px;border-radius:50%;z-index:2147483001;
  display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;
  background:rgba(255,255,255,.2);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.4);touch-action:none;user-select:none;-webkit-user-select:none}
`;

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.id = 'pm-ov';
  ov.innerHTML = `
<div id="pm-card">
  <div id="pm-tabs">
    <button class="pm-b on" id="pm-tm">Música</button>
    <button class="pm-b" id="pm-ts">Ajustes</button>
  </div>
  <div id="pm-m" class="pm-pane">
    <div id="pm-now">Nada sonando</div>
    <div id="pm-ctl">
      <button class="pm-b" id="pm-prev">«</button>
      <button class="pm-b on" id="pm-play">▶</button>
      <button class="pm-b" id="pm-next">»</button>
    </div>
    <button class="pm-b" id="pm-loc">Mi dispositivo</button>
    <input id="pm-q" value="lofi" placeholder="Género o nombre (ej: lofi)">
    <button class="pm-b" id="pm-radio">Radio online (gratis)</button>
    <div id="pm-st" class="pm-dim"></div>
    <div id="pm-list"></div>
  </div>
  <div id="pm-s" class="pm-pane" style="display:none">
    <label>Clave de Gemini</label>
    <input id="pm-key" type="password" placeholder="Pega tu clave aquí">
    <div id="pm-keyst" class="pm-dim"></div>
    <label>Modelo</label>
    <input id="pm-model">
    <div class="pm-dim">La clave y el modelo se guardan solo en este teléfono. Se usarán para copiar skins y para el modo IA.</div>
    <button class="pm-b on" id="pm-save">Guardar</button>
    <button class="pm-b" id="pm-cls">Copiar clases del juego</button>
  </div>
</div>`;
  document.body.appendChild(ov);

  var fab = document.createElement('div');
  fab.id = 'pm-fab';
  fab.textContent = '☰';
  document.body.appendChild(fab);

  var $ = function (id) { return document.getElementById(id); };

  // que el juego no reciba los toques/teclas del panel
  ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress']
    .forEach(function (t) {
      ov.addEventListener(t, function (e) { e.stopPropagation(); });
      fab.addEventListener(t, function (e) { e.stopPropagation(); });
    });

  function open() { ov.classList.add('open'); refreshCfg(); }
  function close() { ov.classList.remove('open'); }
  window.pmToggle = function () { if (ov.classList.contains('open')) close(); else open(); };
  window.pmClose = function () { if (ov.classList.contains('open')) { close(); return true; } return false; };
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

  // botón flotante arrastrable
  var sx, sy, ox, oy, moved = false;
  fab.addEventListener('pointerdown', function (e) {
    fab.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY;
    var r = fab.getBoundingClientRect();
    ox = r.left; oy = r.top; moved = false;
    e.preventDefault();
  });
  fab.addEventListener('pointermove', function (e) {
    if (!fab.hasPointerCapture(e.pointerId)) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
    if (moved) { fab.style.left = (ox + dx) + 'px'; fab.style.top = (oy + dy) + 'px'; }
  });
  fab.addEventListener('pointerup', function (e) {
    try { fab.releasePointerCapture(e.pointerId); } catch (x) {}
    if (!moved) window.pmToggle();
  });

  // pestañas
  function tab(m) {
    $('pm-m').style.display = m ? 'flex' : 'none';
    $('pm-s').style.display = m ? 'none' : 'flex';
    $('pm-tm').className = 'pm-b' + (m ? ' on' : '');
    $('pm-ts').className = 'pm-b' + (m ? '' : ' on');
    if (!m) refreshCfg();
  }
  $('pm-tm').onclick = function () { tab(true); };
  $('pm-ts').onclick = function () { tab(false); };

  // música
  $('pm-prev').onclick = function () { PM.prev(); };
  $('pm-play').onclick = function () { PM.toggle(); };
  $('pm-next').onclick = function () { PM.next(); };
  $('pm-loc').onclick = function () { $('pm-st').textContent = 'Buscando música...'; PM.local(); };
  $('pm-radio').onclick = function () { $('pm-st').textContent = 'Buscando...'; PM.radio($('pm-q').value.trim()); };

  window.pmList = function (a) {
    var l = $('pm-list');
    l.innerHTML = '';
    a.forEach(function (t, i) {
      var d = document.createElement('div');
      d.className = 'pm-it';
      d.textContent = t;
      d.onclick = function () { PM.play(i); };
      l.appendChild(d);
    });
    $('pm-st').textContent = a.length ? '' : 'Sin resultados';
  };
  window.pmNow = function (t, p) {
    $('pm-now').textContent = t || 'Nada sonando';
    $('pm-play').textContent = p ? '❚❚' : '▶';
  };
  window.pmStatus = function (s) { $('pm-st').textContent = s; };

  // ajustes
  function refreshCfg() {
    try {
      var c = JSON.parse(PM.cfg());
      $('pm-keyst').textContent = c.tail ? 'Guardada (termina en ' + c.tail + ')' : 'Sin clave guardada';
      $('pm-model').value = c.model;
    } catch (e) {}
  }
  $('pm-save').onclick = function () {
    PM.saveCfg($('pm-key').value.trim(), $('pm-model').value.trim());
    $('pm-key').value = '';
    refreshCfg();
  };
  $('pm-cls').onclick = function () {
    var s = {};
    document.querySelectorAll('[class]').forEach(function (e) {
      if (e.closest('#pm-ov') || e.id === 'pm-fab') return;
      var c = e.getAttribute('class');
      if (c) c.split(/\s+/).forEach(function (x) { if (x) s[x] = 1; });
    });
    PM.copy(Object.keys(s).sort().join(' '));
  };

  try { PM.hideFab(); } catch (e) {}
})();

(function () {
  if (document.getElementById('pm-css2')) return;
  var s = document.createElement('style');
  s.id = 'pm-css2';
  s.textContent = `
.friends-box,.settings-box,.status-box,.notification-list,.action-list,.emoji-picker-box,.minimap-box,
.chat-log,.chat-box,.chat-log-tabs-container,.chat-textarea-wrap,.minimap-buttons-background{
  -webkit-backdrop-filter:blur(16px) saturate(1.3)!important;backdrop-filter:blur(16px) saturate(1.3)!important}

.friends-box,.settings-box,.status-box,.notification-list,.action-list,.emoji-picker-box{
  background-color:rgba(18,18,28,.38)!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:20px!important}

.friends-box *:not(.rounded-circle):not(.pixelart):not(canvas):not(img):not(svg):not(path):not(.form-control),
.notification-list *:not(.rounded-circle):not(.pixelart):not(canvas):not(img):not(svg):not(path):not(.form-control),
.status-box *:not(.rounded-circle):not(.pixelart):not(canvas):not(img):not(svg):not(path):not(.form-control){
  background-color:transparent!important;color:#fff!important;font-weight:800!important;border-color:rgba(255,255,255,.14)!important}

.friends-box .form-control,.notification-list .form-control,.status-box .form-control{
  background-color:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.25)!important}
.friends-box .form-control::placeholder{color:rgba(255,255,255,.75)!important}
.friends-box li,.friends-box .list-group-item{border-bottom:1px solid rgba(255,255,255,.12)!important}

.top-menu-button,.game-button,.chat-open-button,.chat-log-tab,.chat-log-toggle{
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.chat-log,.chat-box{background-color:rgba(18,18,28,.3)!important}
.chat-textarea{background-color:rgba(255,255,255,.14)!important;color:#fff!important}

body.pm-open #pm-fab{display:none!important}
`;
  document.head.appendChild(s);
  var ov = document.getElementById('pm-ov');
  if (ov) {
    new MutationObserver(function () {
      document.body.classList.toggle('pm-open', ov.classList.contains('open'));
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
  }
})();

(function () {
  if (document.getElementById('pm-css3')) return;
  var st = document.createElement('style');
  st.id = 'pm-css3';
  st.textContent = `
.top-menu-button,.game-button,.chat-open-button,.chat-log-tab,.chat-log-toggle{
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important}
body.pm-cap #pm-fab,body.pm-cap #pm-ov{display:none!important}
#pm-ko{white-space:pre-wrap;user-select:text;-webkit-user-select:text;overflow:auto;flex:1;min-height:60px;
  font-weight:700;font-size:14px;line-height:1.35}
.pm-err{color:#ffb4a8;font-size:13px}
`;
  document.head.appendChild(st);

  var ov = document.getElementById('pm-ov');
  if (!ov) return;
  var $ = function (id) { return document.getElementById(id); };

  var pane = document.createElement('div');
  pane.id = 'pm-k';
  pane.className = 'pm-pane';
  pane.style.display = 'none';
  pane.innerHTML = `
    <button class="pm-b on" id="pm-kc">Capturar skin objetivo</button>
    <button class="pm-b" id="pm-km">Comparar con la mía</button>
    <div class="pm-dim">Pon al poni en el centro de la pantalla y haz zoom. El panel se oculta un momento para tomar la captura y se envía a Gemini con tu clave.</div>
    <div id="pm-kst" class="pm-dim"></div>
    <button class="pm-b" id="pm-kr" style="display:none">Reintentar</button>
    <div id="pm-ko"></div>`;
  $('pm-s').parentNode.appendChild(pane);

  var kt = document.createElement('button');
  kt.className = 'pm-b';
  kt.id = 'pm-tk';
  kt.textContent = 'Skins';
  $('pm-tabs').insertBefore(kt, $('pm-ts'));

  function showK() {
    $('pm-m').style.display = 'none';
    $('pm-s').style.display = 'none';
    pane.style.display = 'flex';
    $('pm-tm').className = 'pm-b';
    $('pm-ts').className = 'pm-b';
    kt.className = 'pm-b on';
  }
  function hideK() { pane.style.display = 'none'; kt.className = 'pm-b'; }
  kt.onclick = showK;
  $('pm-tm').addEventListener('click', hideK);
  $('pm-ts').addEventListener('click', hideK);

  $('pm-kc').onclick = function () { PM.capture('target'); };
  $('pm-km').onclick = function () { PM.capture('mine'); };
  $('pm-kr').onclick = function () { PM.retry(); };

  window.pmCap = function (on) {
    document.body.classList.toggle('pm-cap', !!on);
    if (!on) { ov.classList.add('open'); showK(); }
  };
  window.pmSkinBusy = function (s) {
    $('pm-kst').className = 'pm-dim';
    $('pm-kst').textContent = s;
    $('pm-kr').style.display = 'none';
  };
  window.pmSkinErr = function (s) {
    $('pm-kst').className = 'pm-err';
    $('pm-kst').textContent = '⚠ ' + s;
    $('pm-kr').style.display = 'block';
  };
  window.pmSkinOut = function (t) {
    $('pm-kst').textContent = '';
    $('pm-kr').style.display = 'none';
    $('pm-ko').textContent = String(t).replace(/\*\*/g, '').replace(/^\s*[\*\-]\s+/gm, '• ');
  };
})();

(function () {
  if (document.getElementById('pm-css4')) return;
  var $ = function (id) { return document.getElementById(id); };
  var pane = $('pm-k');
  if (!pane) return;

  var st = document.createElement('style');
  st.id = 'pm-css4';
  st.textContent = `
#pm-stop{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483002;display:none;
  padding:10px 18px;border-radius:24px;background:rgba(200,40,40,.55);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.45);
  color:#fff;font:800 15px system-ui,sans-serif}
#pm-agst{position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:2147483002;display:none;
  max-width:86vw;padding:8px 14px;border-radius:16px;background:rgba(18,18,28,.55);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;
  font:800 13px system-ui,sans-serif;text-align:center}
body.pm-run #pm-stop,body.pm-run #pm-agst{display:block}
body.pm-snap #pm-stop,body.pm-snap #pm-agst{display:none!important}
#pm-aask{display:none;flex-direction:column;gap:8px;padding:10px;border-radius:16px;background:rgba(255,255,255,.12)}
`;
  document.head.appendChild(st);

  var ab = document.createElement('button');
  ab.className = 'pm-b on';
  ab.id = 'pm-ag';
  ab.textContent = 'Gemini hace la skin';
  pane.insertBefore(ab, $('pm-km').nextSibling);

  var info = document.createElement('div');
  info.className = 'pm-dim';
  info.textContent = 'Gemini hace la skin: 1) captura la skin objetivo, 2) abre el Character editor del juego, 3) toca este botón. Gemini hará los clics y te preguntará cuando dude. Hay un botón rojo para pararlo.';
  pane.insertBefore(info, ab.nextSibling);

  var aask = document.createElement('div');
  aask.id = 'pm-aask';
  aask.innerHTML = '<div id="pm-aq"></div><input id="pm-ai" placeholder="Tu respuesta (opcional)">'
    + '<div style="display:flex;gap:8px"><button class="pm-b" id="pm-ar" style="flex:1">Responder</button>'
    + '<button class="pm-b" id="pm-as" style="flex:1">Seguir</button></div>';
  pane.insertBefore(aask, $('pm-kst'));

  var stop = document.createElement('div');
  stop.id = 'pm-stop';
  stop.textContent = '■ Parar a Gemini';
  var agst = document.createElement('div');
  agst.id = 'pm-agst';
  document.body.appendChild(agst);
  document.body.appendChild(stop);
  ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach(function (t) {
    stop.addEventListener(t, function (e) { e.stopPropagation(); });
  });
  stop.addEventListener('click', function () { PM.stopAgent(); });

  ab.onclick = function () { PM.agentStart(); };
  $('pm-ar').onclick = function () { var v = $('pm-ai').value; $('pm-ai').value = ''; PM.answer(v); };
  $('pm-as').onclick = function () { $('pm-ai').value = ''; PM.answer(''); };

  window.pmAgentState = function (on) {
    document.body.classList.toggle('pm-run', !!on);
    document.body.classList.remove('pm-snap');
    if (!on) aask.style.display = 'none';
  };
  window.pmAgentStatus = function (s) { agst.textContent = s; };
  window.pmAgentAsk = function (q) { $('pm-aq').textContent = q; aask.style.display = 'flex'; };
  window.pmAgentAskHide = function () { aask.style.display = 'none'; };

  window.pmObs = function () {
    var els = [];
    window.__pmEls = [];
    var W = window.innerWidth, H = window.innerHeight;
    var q = document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=option],[tabindex],label,.btn,canvas');
    for (var i = 0; i < q.length && els.length < 160; i++) {
      var e = q[i];
      if (e.closest('#pm-ov') || e.id === 'pm-fab' || e.id === 'pm-stop') continue;
      var r = e.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > W || cy > H) continue;
      var top = document.elementFromPoint(cx, cy);
      if (!top || !(e === top || e.contains(top) || top.contains(e))) continue;
      var id = window.__pmEls.length;
      window.__pmEls.push(e);
      els.push({
        id: id,
        tag: e.tagName.toLowerCase(),
        text: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30),
        label: e.getAttribute('aria-label') || e.title || e.placeholder || '',
        type: e.type || '',
        value: (e.value || '').toString().slice(0, 20),
        cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).slice(0, 2).join(' '),
        cx: Math.round(cx / W * 1000), cy: Math.round(cy / H * 1000),
        w: Math.round(r.width / W * 1000), h: Math.round(r.height / H * 1000)
      });
    }
    return JSON.stringify(els);
  };

  window.pmAct = function (acts) {
    var log = [];
    function setVal(e, v) {
      var p = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var d = Object.getOwnPropertyDescriptor(p, 'value');
      if (d && d.set) d.set.call(e, v); else e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function tapAt(x, y) {
      var px = x / 1000 * window.innerWidth, py = y / 1000 * window.innerHeight;
      var el = document.elementFromPoint(px, py);
      if (!el) return false;
      var o = { bubbles: true, cancelable: true, clientX: px, clientY: py, pointerId: 1, pointerType: 'touch', isPrimary: true, view: window };
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (n) {
        el.dispatchEvent(n.indexOf('pointer') === 0 ? new PointerEvent(n, o) : new MouseEvent(n, o));
      });
      return true;
    }
    (acts || []).slice(0, 6).forEach(function (a) {
      try {
        var e = (a.id != null) ? window.__pmEls[a.id] : null;
        if (a.type === 'click') {
          if (!e) { log.push('click: el id ' + a.id + ' no existe'); return; }
          e.click();
        } else if (a.type === 'tap') {
          if (!tapAt(a.x, a.y)) log.push('tap: no hay nada en (' + a.x + ',' + a.y + ')');
        } else if (a.type === 'type') {
          if (!e) { log.push('type: el id ' + a.id + ' no existe'); return; }
          e.focus();
          setVal(e, String(a.text || ''));
        } else if (a.type === 'scroll') {
          var s = e;
          while (s && s.scrollHeight <= s.clientHeight + 2) s = s.parentElement;
          (s || document.scrollingElement).scrollTop += (a.dy || 300);
        }
      } catch (x) { log.push(String(a.type) + ': ' + x.message); }
    });
    return log.join('; ');
  };
})();

(function () {
  if (document.getElementById('pm-css4')) return;
  var $ = function (id) { return document.getElementById(id); };
  var pane = $('pm-k');
  if (!pane) return;

  var st = document.createElement('style');
  st.id = 'pm-css4';
  st.textContent = `
#pm-stop{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483002;display:none;
  padding:10px 18px;border-radius:24px;background:rgba(200,40,40,.55);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.45);
  color:#fff;font:800 15px system-ui,sans-serif}
#pm-agst{position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:2147483002;display:none;
  max-width:86vw;padding:8px 14px;border-radius:16px;background:rgba(18,18,28,.55);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;
  font:800 13px system-ui,sans-serif;text-align:center}
body.pm-run #pm-stop,body.pm-run #pm-agst{display:block}
body.pm-snap #pm-stop,body.pm-snap #pm-agst{display:none!important}
#pm-aask{display:none;flex-direction:column;gap:8px;padding:10px;border-radius:16px;background:rgba(255,255,255,.12)}
`;
  document.head.appendChild(st);

  var ab = document.createElement('button');
  ab.className = 'pm-b on';
  ab.id = 'pm-ag';
  ab.textContent = 'Gemini hace la skin';
  pane.insertBefore(ab, $('pm-km').nextSibling);

  var info = document.createElement('div');
  info.className = 'pm-dim';
  info.textContent = 'Gemini hace la skin: 1) captura la skin objetivo, 2) abre el Character editor del juego, 3) toca este botón. Gemini hará los clics y te preguntará cuando dude. Hay un botón rojo para pararlo.';
  pane.insertBefore(info, ab.nextSibling);

  var aask = document.createElement('div');
  aask.id = 'pm-aask';
  aask.innerHTML = '<div id="pm-aq"></div><input id="pm-ai" placeholder="Tu respuesta (opcional)">'
    + '<div style="display:flex;gap:8px"><button class="pm-b" id="pm-ar" style="flex:1">Responder</button>'
    + '<button class="pm-b" id="pm-as" style="flex:1">Seguir</button></div>';
  pane.insertBefore(aask, $('pm-kst'));

  var stop = document.createElement('div');
  stop.id = 'pm-stop';
  stop.textContent = '■ Parar a Gemini';
  var agst = document.createElement('div');
  agst.id = 'pm-agst';
  document.body.appendChild(agst);
  document.body.appendChild(stop);
  ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach(function (t) {
    stop.addEventListener(t, function (e) { e.stopPropagation(); });
  });
  stop.addEventListener('click', function () { PM.stopAgent(); });

  ab.onclick = function () { PM.agentStart(); };
  $('pm-ar').onclick = function () { var v = $('pm-ai').value; $('pm-ai').value = ''; PM.answer(v); };
  $('pm-as').onclick = function () { $('pm-ai').value = ''; PM.answer(''); };

  window.pmAgentState = function (on) {
    document.body.classList.toggle('pm-run', !!on);
    document.body.classList.remove('pm-snap');
    if (!on) aask.style.display = 'none';
  };
  window.pmAgentStatus = function (s) { agst.textContent = s; };
  window.pmAgentAsk = function (q) { $('pm-aq').textContent = q; aask.style.display = 'flex'; };
  window.pmAgentAskHide = function () { aask.style.display = 'none'; };

  window.pmObs = function () {
    var els = [];
    window.__pmEls = [];
    var W = window.innerWidth, H = window.innerHeight;
    var q = document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=option],[tabindex],label,.btn,canvas');
    for (var i = 0; i < q.length && els.length < 160; i++) {
      var e = q[i];
      if (e.closest('#pm-ov') || e.id === 'pm-fab' || e.id === 'pm-stop') continue;
      var r = e.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > W || cy > H) continue;
      var top = document.elementFromPoint(cx, cy);
      if (!top || !(e === top || e.contains(top) || top.contains(e))) continue;
      var id = window.__pmEls.length;
      window.__pmEls.push(e);
      els.push({
        id: id,
        tag: e.tagName.toLowerCase(),
        text: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30),
        label: e.getAttribute('aria-label') || e.title || e.placeholder || '',
        type: e.type || '',
        value: (e.value || '').toString().slice(0, 20),
        cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).slice(0, 2).join(' '),
        cx: Math.round(cx / W * 1000), cy: Math.round(cy / H * 1000),
        w: Math.round(r.width / W * 1000), h: Math.round(r.height / H * 1000)
      });
    }
    return JSON.stringify(els);
  };

  window.pmAct = function (acts) {
    var log = [];
    function setVal(e, v) {
      var p = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var d = Object.getOwnPropertyDescriptor(p, 'value');
      if (d && d.set) d.set.call(e, v); else e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function tapAt(x, y) {
      var px = x / 1000 * window.innerWidth, py = y / 1000 * window.innerHeight;
      var el = document.elementFromPoint(px, py);
      if (!el) return false;
      var o = { bubbles: true, cancelable: true, clientX: px, clientY: py, pointerId: 1, pointerType: 'touch', isPrimary: true, view: window };
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (n) {
        el.dispatchEvent(n.indexOf('pointer') === 0 ? new PointerEvent(n, o) : new MouseEvent(n, o));
      });
      return true;
    }
    (acts || []).slice(0, 6).forEach(function (a) {
      try {
        var e = (a.id != null) ? window.__pmEls[a.id] : null;
        if (a.type === 'click') {
          if (!e) { log.push('click: el id ' + a.id + ' no existe'); return; }
          e.click();
        } else if (a.type === 'tap') {
          if (!tapAt(a.x, a.y)) log.push('tap: no hay nada en (' + a.x + ',' + a.y + ')');
        } else if (a.type === 'type') {
          if (!e) { log.push('type: el id ' + a.id + ' no existe'); return; }
          e.focus();
          setVal(e, String(a.text || ''));
        } else if (a.type === 'scroll') {
          var s = e;
          while (s && s.scrollHeight <= s.clientHeight + 2) s = s.parentElement;
          (s || document.scrollingElement).scrollTop += (a.dy || 300);
        }
      } catch (x) { log.push(String(a.type) + ': ' + x.message); }
    });
    return log.join('; ');
  };
})();
