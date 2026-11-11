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

(function () {
  if (document.getElementById('pm-css5')) return;
  var $ = function (id) { return document.getElementById(id); };
  var pane = $('pm-k');
  if (!pane) return;
  var mk = document.createElement('meta');
  mk.id = 'pm-css5';
  document.head.appendChild(mk);

  var img = document.createElement('img');
  img.id = 'pm-kimg';
  img.style.cssText = 'display:none;max-height:150px;max-width:100%;align-self:center;border-radius:12px;image-rendering:pixelated;border:1px solid rgba(255,255,255,.3)';
  pane.insertBefore(img, $('pm-kst'));
  window.pmSkinPrev = function (src) { img.src = src; img.style.display = 'block'; };

  function call(name, arg) {
    try {
      if (typeof PM === 'undefined' || typeof PM[name] !== 'function') {
        window.pmSkinErr('Este APK no tiene la función ' + name + '. Instala la última versión.');
        return;
      }
      window.pmSkinBusy('Enviando orden: ' + name + '...');
      if (arg === undefined) PM[name](); else PM[name](arg);
    } catch (e) {
      window.pmSkinErr('Error al llamar ' + name + ': ' + e.message);
    }
  }
  $('pm-kc').textContent = 'Elegir skin objetivo';
  $('pm-km').textContent = 'Elegir mi poni y comparar';
  $('pm-kc').onclick = function () { call('capture', 'target'); };
  $('pm-km').onclick = function () { call('capture', 'mine'); };
  $('pm-kr').onclick = function () { call('retry'); };
  if ($('pm-ag')) $('pm-ag').onclick = function () { call('agentStart'); };
})();

(function () {
  if (document.getElementById('pm-css6')) return;
  var pane = document.getElementById('pm-k');
  if (!pane) return;
  var mk = document.createElement('meta');
  mk.id = 'pm-css6';
  document.head.appendChild(mk);
  pane.querySelectorAll('.pm-dim').forEach(function (e) {
    if ((e.textContent || '').indexOf('Pon al poni') === 0) {
      e.textContent = 'Dibuja un círculo alrededor del poni. El recuadro se ajusta a lo que rodeaste, se recorta con zoom y se envía a Gemini con tu clave.';
    }
  });
})();

(function () {
  if (document.getElementById('pm-css7')) return;
  var mk = document.createElement('meta');
  mk.id = 'pm-css7';
  document.head.appendChild(mk);
  var $ = function (id) { return document.getElementById(id); };

  function skipEl(e) {
    return e.closest('#pm-ov') || e.id === 'pm-fab' || e.id === 'pm-stop' || e.id === 'pm-agst';
  }

  window.pmObs = function () {
    var W = window.innerWidth, H = window.innerHeight;
    var els = [], lines = [], seen = new Set();
    window.__pmEls = els;

    function geom(e) {
      var r = e.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) return null;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > W || cy > H) return null;
      return { r: r, cx: cx, cy: cy };
    }
    function hit(e, g) {
      var t = document.elementFromPoint(g.cx, g.cy);
      return !!t && (e === t || e.contains(t) || t.contains(e));
    }
    function clean(s, n) {
      return String(s || '').replace(/[|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
    }
    function icon(e) {
      var src = (typeof e.className === 'string' && e.className.indexOf('fa-') >= 0) ? e : e.querySelector('[class*="fa-"]');
      if (!src) return '';
      return Array.prototype.filter.call(src.classList, function (c) {
        return c.indexOf('fa-') === 0 && ['fa-lg', 'fa-sm', 'fa-fw', 'fa-width-auto'].indexOf(c) < 0;
      }).join(' ');
    }
    function add(e, g) {
      var id = els.length;
      els.push(e);
      var cls = typeof e.className === 'string' ? e.className : (e.getAttribute('class') || '');
      var on = /(^|\s)(active|selected|checked)(\s|$)/.test(cls) || e.getAttribute('aria-selected') === 'true' || e.checked === true;
      var isField = /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName);
      lines.push([
        id,
        e.tagName.toLowerCase(),
        clean(e.innerText, 28),
        clean(e.getAttribute('aria-label') || e.title || e.placeholder || e.alt, 24),
        icon(e),
        clean(cls.split(/\s+/).slice(0, 3).join(' '), 40),
        Math.round(g.cx / W * 1000) + ',' + Math.round(g.cy / H * 1000),
        Math.round(g.r.width / W * 1000) + 'x' + Math.round(g.r.height / H * 1000),
        (on ? 'sel ' : '') + (e.disabled ? 'dis ' : '') + (isField ? 'val=' + clean(e.value, 12) : '')
      ].join('|'));
    }

    var q = document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=option],[role=slider],[role=menuitem],[tabindex],label,.btn,canvas,li,img');
    for (var i = 0; i < q.length && els.length < 150; i++) {
      var e = q[i];
      if (skipEl(e) || seen.has(e)) continue;
      var g = geom(e);
      if (!g || !hit(e, g)) continue;
      seen.add(e);
      add(e, g);
    }

    var d = document.querySelectorAll('div,span');
    for (var j = 0; j < d.length && els.length < 190; j++) {
      var f = d[j];
      if (seen.has(f) || skipEl(f)) continue;
      var g2 = geom(f);
      if (!g2 || g2.r.width > W * 0.9 || !hit(f, g2)) continue;
      if (getComputedStyle(f).cursor !== 'pointer') continue;
      var par = f.parentElement;
      if (par && seen.has(par)) {
        var pr = par.getBoundingClientRect();
        if (Math.abs(pr.width - g2.r.width) < 4 && Math.abs(pr.height - g2.r.height) < 4) continue;
      }
      seen.add(f);
      add(f, g2);
    }

    var sc = document.querySelectorAll('div,ul,section,nav,main');
    var ns = 0;
    for (var k = 0; k < sc.length && ns < 8; k++) {
      var s = sc[k];
      if (skipEl(s) || s.scrollHeight <= s.clientHeight + 8) continue;
      var oy = getComputedStyle(s).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      var g3 = geom(s);
      if (!g3) continue;
      var id2 = els.length;
      els.push(s);
      ns++;
      lines.push([
        id2, 'SCROLLER', '', '', '', '',
        Math.round(g3.cx / W * 1000) + ',' + Math.round(g3.cy / H * 1000),
        Math.round(g3.r.width / W * 1000) + 'x' + Math.round(g3.r.height / H * 1000),
        'max=' + (s.scrollHeight - s.clientHeight) + ' en=' + Math.round(s.scrollTop)
      ].join('|'));
    }
    return 'URL: ' + location.pathname + ' | ventana ' + W + 'x' + H + '\n' + lines.join('\n');
  };

  window.pmAct = function (acts) {
    var log = [];
    function ev(el, n, x, y, down) {
      var o = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window, button: 0, buttons: down ? 1 : 0 };
      if (n.indexOf('pointer') === 0) {
        o.pointerId = 1; o.pointerType = 'touch'; o.isPrimary = true;
        el.dispatchEvent(new PointerEvent(n, o));
      } else {
        el.dispatchEvent(new MouseEvent(n, o));
      }
    }
    function press(el, x, y) {
      ev(el, 'pointerdown', x, y, true);
      ev(el, 'mousedown', x, y, true);
      ev(el, 'pointerup', x, y, false);
      ev(el, 'mouseup', x, y, false);
      ev(el, 'click', x, y, false);
    }
    function setVal(e, v) {
      var p = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var dsc = Object.getOwnPropertyDescriptor(p, 'value');
      if (dsc && dsc.set) dsc.set.call(e, v); else e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function keyEv(el, key) {
      var codes = { Enter: 13, Escape: 27, Tab: 9, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
      ['keydown', 'keypress', 'keyup'].forEach(function (n) {
        el.dispatchEvent(new KeyboardEvent(n, { key: key, code: key, keyCode: codes[key] || 0, which: codes[key] || 0, bubbles: true, cancelable: true }));
      });
    }
    function scrollable(el) {
      while (el && el !== document.body && el !== document.documentElement) {
        var oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 2) return el;
        el = el.parentElement;
      }
      return document.scrollingElement;
    }
    function at(x, y) { return document.elementFromPoint(x / 1000 * innerWidth, y / 1000 * innerHeight); }

    (acts || []).slice(0, 6).forEach(function (a) {
      try {
        var e = (a.id != null) ? window.__pmEls[a.id] : null;
        var t = a.type;
        if (t === 'click') {
          if (!e) { log.push('click: el id ' + a.id + ' no existe'); return; }
          e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          var r = e.getBoundingClientRect();
          press(e, r.left + r.width / 2, r.top + r.height / 2);
        } else if (t === 'tap') {
          var px = a.x / 1000 * innerWidth, py = a.y / 1000 * innerHeight;
          var el = document.elementFromPoint(px, py);
          if (!el) { log.push('tap: no hay nada en (' + a.x + ',' + a.y + ')'); return; }
          press(el, px, py);
        } else if (t === 'type') {
          if (!e) { log.push('type: el id ' + a.id + ' no existe'); return; }
          e.focus();
          setVal(e, String(a.text || ''));
          if (a.enter) keyEv(e, 'Enter');
        } else if (t === 'select') {
          if (!e || e.tagName !== 'SELECT') { log.push('select: el id ' + a.id + ' no es un desplegable'); return; }
          var found = false, want = String(a.text).trim().toLowerCase();
          for (var i = 0; i < e.options.length; i++) {
            var op = e.options[i];
            if (op.text.trim().toLowerCase() === want || op.value === String(a.text)) { e.selectedIndex = i; found = true; break; }
          }
          if (!found) { log.push('select: no hay la opción ' + a.text); return; }
          e.dispatchEvent(new Event('input', { bubbles: true }));
          e.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (t === 'key') {
          keyEv(e || document.activeElement || document.body, String(a.key || 'Enter'));
        } else if (t === 'scroll') {
          var s = e ? scrollable(e) : scrollable(at(a.x == null ? 500 : a.x, a.y == null ? 500 : a.y));
          if (!s) { log.push('scroll: no hay nada desplazable ahí'); return; }
          s.scrollTop += (a.dy == null ? 300 : a.dy);
          s.scrollLeft += (a.dx || 0);
          log.push('scroll: ahora en ' + Math.round(s.scrollTop) + ' de ' + Math.max(0, s.scrollHeight - s.clientHeight));
        } else if (t === 'drag') {
          var W = innerWidth, H = innerHeight;
          var x1 = a.x1 / 1000 * W, y1 = a.y1 / 1000 * H, x2 = a.x2 / 1000 * W, y2 = a.y2 / 1000 * H;
          var el1 = document.elementFromPoint(x1, y1);
          if (!el1) { log.push('drag: no hay nada en el inicio'); return; }
          ev(el1, 'pointerdown', x1, y1, true);
          ev(el1, 'mousedown', x1, y1, true);
          for (var n = 1; n <= 8; n++) {
            var xx = x1 + (x2 - x1) * n / 8, yy = y1 + (y2 - y1) * n / 8;
            var tg = document.elementFromPoint(xx, yy) || el1;
            ev(tg, 'pointermove', xx, yy, true);
            ev(tg, 'mousemove', xx, yy, true);
          }
          var te = document.elementFromPoint(x2, y2) || el1;
          ev(te, 'pointerup', x2, y2, false);
          ev(te, 'mouseup', x2, y2, false);
        }
      } catch (x) { log.push(String(a.type) + ': ' + x.message); }
    });
    return log.join('; ');
  };

  window.pmOpenEditor = function () {
    function vis(e) { var r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; }
    function press(e) {
      e.scrollIntoView({ block: 'nearest' });
      var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (n) {
        var o = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
        if (n.indexOf('pointer') === 0) { o.pointerId = 1; o.pointerType = 'touch'; o.isPrimary = true; e.dispatchEvent(new PointerEvent(n, o)); }
        else e.dispatchEvent(new MouseEvent(n, o));
      });
    }
    function byText(t) {
      var all = document.querySelectorAll('button,a,li,span,div,[role=menuitem]');
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (e.closest('#pm-ov')) continue;
        var s = (e.innerText || '').trim().toLowerCase();
        if (s === t && vis(e) && e.children.length < 3) return e;
      }
      return null;
    }
    var ce = byText('character editor');
    if (ce) { press(ce); return 'abrí Character editor'; }
    var ed = byText('edit');
    if (ed) { press(ed); return 'toqué edit'; }
    var gear = document.querySelector('.settings-icon');
    if (gear && vis(gear)) { press(gear); return 'toqué el engranaje'; }
    return 'no encontré cómo abrir el editor';
  };

  var pane = $('pm-k');
  if (pane) {
    var db = document.createElement('button');
    db.className = 'pm-b';
    db.id = 'pm-kd';
    db.textContent = 'Copiar lo que ve Gemini (depurar)';
    db.onclick = function () {
      window.pmCap(true);
      setTimeout(function () {
        var s = '';
        try { s = window.pmObs(); } catch (e) { s = 'error: ' + e.message; }
        try { PM.copy(s); } catch (e) { }
        window.pmCap(false);
        window.pmSkinBusy('Copiado: ' + s.split('\n').length + ' líneas. Pégalo en el chat.');
      }, 350);
    };
    pane.appendChild(db);
  }
})();

(function () {
  if (document.getElementById('pm-css8')) return;
  var mk = document.createElement('meta');
  mk.id = 'pm-css8';
  document.head.appendChild(mk);
  var $ = function (id) { return document.getElementById(id); };

  var st = document.createElement('style');
  st.textContent = '#pm-ov textarea{font:inherit;font-weight:700;font-size:13px;color:#fff;background:rgba(255,255,255,.14);'
    + 'border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:9px 14px;outline:none;box-sizing:border-box;'
    + 'width:100%;min-height:150px;resize:vertical}'
    + '#pm-ov textarea::placeholder{color:rgba(255,255,255,.6)}';
  document.head.appendChild(st);

  function skipEl(e) {
    return e.closest('#pm-ov') || e.id === 'pm-fab' || e.id === 'pm-stop' || e.id === 'pm-agst';
  }

  window.pmObs = function () {
    var W = window.innerWidth, H = window.innerHeight;
    var els = [], lines = [], marks = [], seen = new Set();
    window.__pmEls = els;

    function geom(e) {
      var r = e.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) return null;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > W || cy > H) return null;
      return { r: r, cx: cx, cy: cy };
    }
    function hit(e, g) {
      var t = document.elementFromPoint(g.cx, g.cy);
      return !!t && (e === t || e.contains(t) || t.contains(e));
    }
    function clean(s, n) {
      return String(s || '').replace(/[|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
    }
    function pos(g) { return Math.round(g.cx / W * 1000) + ',' + Math.round(g.cy / H * 1000); }
    function mark(id, g) {
      if (g.r.width < W * 0.6 && g.r.height < H * 0.35) {
        marks.push([id, Math.round(g.cx / W * 1000), Math.round(g.cy / H * 1000)]);
      }
    }
    function icon(e) {
      var src = (typeof e.className === 'string' && e.className.indexOf('fa-') >= 0) ? e : e.querySelector('[class*="fa-"]');
      if (!src) return '';
      return Array.prototype.filter.call(src.classList, function (c) {
        return c.indexOf('fa-') === 0 && ['fa-lg', 'fa-sm', 'fa-fw', 'fa-xs', 'fa-width-auto'].indexOf(c) < 0;
      }).join(' ');
    }
    function add(e, g) {
      var id = els.length;
      els.push(e);
      var cls = typeof e.className === 'string' ? e.className : (e.getAttribute('class') || '');
      var on = /(^|\s)(active|selected|checked)(\s|$)/.test(cls) || e.getAttribute('aria-selected') === 'true' || e.checked === true;
      var isField = /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName);
      lines.push([
        id,
        e.tagName.toLowerCase(),
        clean(e.innerText, 28),
        clean(e.getAttribute('aria-label') || e.title || e.placeholder || e.alt, 24),
        icon(e),
        clean(cls.split(/\s+/).slice(0, 3).join(' '), 40),
        pos(g),
        Math.round(g.r.width / W * 1000) + 'x' + Math.round(g.r.height / H * 1000),
        (on ? 'sel ' : '') + (e.disabled ? 'dis ' : '') + (isField ? 'val=' + clean(e.value, 12) : '')
      ].join('|'));
      mark(id, g);
    }
    function addTile(e, g) {
      var id = els.length;
      els.push(e);
      var on = e.classList.contains('active');
      var v = !!e.querySelector('.variants-ellipsis');
      lines.push(id + '|tile|' + pos(g) + '|' + (on ? 'sel ' : '') + (v ? 'var' : ''));
      mark(id, g);
    }

    var q = document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=option],[role=slider],[role=menuitem],[tabindex],label,.btn,canvas,li,img');
    for (var i = 0; i < q.length && els.length < 150; i++) {
      var e = q[i];
      if (skipEl(e) || seen.has(e)) continue;
      var g = geom(e);
      if (!g || !hit(e, g)) continue;
      seen.add(e);
      if (e.classList && e.classList.contains('selection-item')) addTile(e, g); else add(e, g);
    }

    var d = document.querySelectorAll('div,span');
    for (var j = 0; j < d.length && els.length < 240; j++) {
      var f = d[j];
      if (seen.has(f) || skipEl(f) || f.classList.contains('variants-ellipsis')) continue;
      var g2 = geom(f);
      if (!g2 || g2.r.width > W * 0.9 || !hit(f, g2)) continue;
      if (getComputedStyle(f).cursor !== 'pointer') continue;
      var par = f.parentElement;
      if (par && seen.has(par)) {
        var pr = par.getBoundingClientRect();
        if (Math.abs(pr.width - g2.r.width) < 4 && Math.abs(pr.height - g2.r.height) < 4) continue;
      }
      seen.add(f);
      if (f.classList.contains('selection-item')) addTile(f, g2); else add(f, g2);
    }

    var sc = document.querySelectorAll('div,ul,section,nav,main');
    var ns = 0;
    for (var k = 0; k < sc.length && ns < 8; k++) {
      var s = sc[k];
      if (skipEl(s) || s.scrollHeight <= s.clientHeight + 8) continue;
      var oy = getComputedStyle(s).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      var g3 = geom(s);
      if (!g3) continue;
      var id2 = els.length;
      els.push(s);
      ns++;
      lines.push([
        id2, 'SCROLLER', '', '', '', '', pos(g3),
        Math.round(g3.r.width / W * 1000) + 'x' + Math.round(g3.r.height / H * 1000),
        'max=' + (s.scrollHeight - s.clientHeight) + ' en=' + Math.round(s.scrollTop)
      ].join('|'));
    }
    var t = 'URL: ' + location.pathname + ' | ventana ' + W + 'x' + H
      + '\nLeyenda: tile = tarjeta de estilo (id|tile|cx,cy|marcas)\n' + lines.join('\n');
    return JSON.stringify({ t: t, m: marks });
  };

  var db = $('pm-kd');
  if (db) {
    db.onclick = function () {
      window.pmCap(true);
      setTimeout(function () {
        var s = '';
        try { s = JSON.parse(window.pmObs()).t; } catch (e) { s = 'error: ' + e.message; }
        try { PM.copy(s); } catch (e) { }
        window.pmCap(false);
        window.pmSkinBusy('Copiado: ' + s.split('\n').length + ' líneas.');
      }, 350);
    };
  }

  var pane = $('pm-k');
  if (pane && !$('pm-lr') && $('pm-ag')) {
    var lb = document.createElement('button');
    lb.className = 'pm-b';
    lb.id = 'pm-lr';
    lb.textContent = 'Que Gemini aprenda el editor (una vez)';
    lb.onclick = function () {
      try { PM.agentLearn(); } catch (e) { window.pmSkinErr('Este APK no tiene agentLearn. Instala la última versión.'); }
    };
    pane.insertBefore(lb, $('pm-ag').nextSibling);
  }

  var sp = $('pm-s');
  if (sp && !$('pm-mem')) {
    var ml = document.createElement('label');
    ml.textContent = 'Memoria de Gemini (lo que aprendió del editor)';
    var ta = document.createElement('textarea');
    ta.id = 'pm-mem';
    ta.placeholder = 'Vacía por ahora';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';
    row.innerHTML = '<button class="pm-b" id="pm-memsave" style="flex:1">Guardar memoria</button>'
      + '<button class="pm-b" id="pm-memclr" style="flex:1">Borrar memoria</button>';
    sp.appendChild(ml);
    sp.appendChild(ta);
    sp.appendChild(row);
    $('pm-memsave').onclick = function () { try { PM.saveMem(ta.value); } catch (e) { } };
    $('pm-memclr').onclick = function () { ta.value = ''; try { PM.saveMem(''); } catch (e) { } };
    $('pm-ts').addEventListener('click', function () { try { ta.value = PM.mem(); } catch (e) { } });
  }
})();

(function () {
  if (document.getElementById('pm-css9')) return;
  var mk = document.createElement('meta');
  mk.id = 'pm-css9';
  document.head.appendChild(mk);
  var $ = function (id) { return document.getElementById(id); };

  function skipEl(e) {
    return e.closest('#pm-ov') || e.id === 'pm-fab' || e.id === 'pm-stop' || e.id === 'pm-agst';
  }
  function clean(s, n) {
    return String(s || '').replace(/[|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  }

  function best() {
    var sc = document.querySelectorAll('div,ul,section,nav,main');
    var bestEl = null, ba = 0;
    for (var k = 0; k < sc.length; k++) {
      var s = sc[k];
      if (skipEl(s) || s.scrollHeight <= s.clientHeight + 8) continue;
      var oy = getComputedStyle(s).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      var r = s.getBoundingClientRect();
      if (r.width < 50 || r.height < 50 || r.bottom < 0 || r.top > innerHeight) continue;
      var ar = r.width * r.height;
      if (ar > ba) { ba = ar; bestEl = s; }
    }
    return bestEl;
  }
  function setTop(sc, y) {
    var max = sc.scrollHeight - sc.clientHeight;
    y = Math.max(0, Math.min(max, y));
    sc.style.scrollBehavior = 'auto';
    sc.scrollTop = y;
  }
  function state(sc) {
    var max = Math.max(0, sc.scrollHeight - sc.clientHeight);
    var y = Math.round(sc.scrollTop);
    return 'ahora en ' + y + ' de ' + max + (y <= 2 ? ' (arriba del todo)' : (y >= max - 2 ? ' (abajo del todo)' : ''));
  }

  function nav(a) {
    var sc = best();
    if (!sc) return 'no hay lista desplazable en pantalla';
    if (a.type === 'scrollpage') {
      var d = String(a.dir || 'down'), h = sc.clientHeight * 0.8, y = sc.scrollTop;
      if (d === 'top') y = 0;
      else if (d === 'bottom') y = sc.scrollHeight;
      else if (d === 'up') y -= h;
      else y += h;
      setTop(sc, y);
      return 'scrollpage ' + d + ': ' + state(sc);
    }
    var want = String(a.text || '').trim().toLowerCase();
    if (!want) return 'goto: falta text';
    var cands = sc.querySelectorAll('label,button,h1,h2,h3,h4,[aria-label],sprite-selection,.col-form-label');
    var found = null, i, e, t, al;
    for (i = 0; i < cands.length && !found; i++) {
      e = cands[i];
      t = (e.innerText || '').trim().toLowerCase();
      al = (e.getAttribute('aria-label') || '').trim().toLowerCase();
      if (t === want || al === want || al === 'select ' + want) found = e;
    }
    for (i = 0; i < cands.length && !found; i++) {
      e = cands[i];
      t = ((e.innerText || '') + ' ' + (e.getAttribute('aria-label') || '')).toLowerCase();
      if (t.indexOf(want) >= 0) found = e;
    }
    if (!found) return 'goto: no encontré "' + a.text + '" en la lista (mira el ÍNDICE)';
    var r = found.getBoundingClientRect(), s = sc.getBoundingClientRect();
    setTop(sc, sc.scrollTop + (r.top - s.top) - 12);
    return 'goto ' + a.text + ': ' + state(sc);
  }

  window.pmIndex = function () {
    var sc = best();
    if (!sc) return 'ÍNDICE: no hay lista desplazable visible';
    var s = sc.getBoundingClientRect(), items = [];
    sc.querySelectorAll('label,button,h1,h2,h3,h4,sprite-selection,.color-picker-input,.nav-link,[role=tab]').forEach(function (e) {
      if (skipEl(e)) return;
      var b = e.getBoundingClientRect();
      if (b.width < 4 || b.height < 4) return;
      var y = Math.round(sc.scrollTop + b.top - s.top);
      var tag = e.tagName.toLowerCase(), txt = clean(e.innerText, 26), al = clean(e.getAttribute('aria-label'), 26);
      var d = '';
      if (tag === 'sprite-selection') d = 'estilos: ' + (al || '?') + ' (' + e.querySelectorAll('.selection-item').length + ' tarjetas)';
      else if (e.classList.contains('color-picker-input')) d = 'campo de color ' + (e.value || '') + (e.disabled ? ' (automático)' : '');
      else if (tag === 'label') d = txt ? 'etiqueta: ' + txt : '';
      else if (tag === 'button') d = txt ? 'botón: ' + txt : (al ? 'botón: ' + al : '');
      else d = txt ? 'título: ' + txt : '';
      if (d) items.push([y, d]);
    });
    items.sort(function (a, b) { return a[0] - b[0]; });
    var out = [], last = '';
    items.forEach(function (it) {
      var line = 'y=' + it[0] + ' ' + it[1];
      if (it[1] !== last && out.length < 90) out.push(line);
      last = it[1];
    });
    return 'ÍNDICE DE LA LISTA (mide ' + sc.scrollHeight + '; ahora se ve de ' + Math.round(sc.scrollTop) + ' a '
      + Math.round(sc.scrollTop + sc.clientHeight) + '):\n' + out.join('\n');
  };

  var baseObs = window.pmObs;
  window.pmObs = function () {
    var o = JSON.parse(baseObs());
    try { o.t += '\n' + window.pmIndex(); } catch (e) { o.t += '\nÍNDICE: error ' + e.message; }
    return JSON.stringify(o);
  };

  var baseAct = window.pmAct;
  window.pmAct = function (acts) {
    var log = [];
    (acts || []).slice(0, 6).forEach(function (a) {
      if (a.type === 'goto' || a.type === 'scrollpage') {
        try { log.push(nav(a)); } catch (e) { log.push(a.type + ': ' + e.message); }
      } else {
        var r = baseAct([a]);
        if (r) log.push(r);
      }
    });
    return log.join('; ');
  };

  var pane = $('pm-k');
  if (pane && !$('pm-sd')) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';
    row.innerHTML = '<button class="pm-b" id="pm-sd" style="flex:1">Probar scroll ↓</button>'
      + '<button class="pm-b" id="pm-su" style="flex:1">Probar scroll ↑</button>';
    pane.appendChild(row);
    var test = function (dir) {
      window.pmCap(true);
      setTimeout(function () {
        var r = '';
        try { r = window.pmAct([{ type: 'scrollpage', dir: dir }]); } catch (e) { r = 'error: ' + e.message; }
        setTimeout(function () {
          window.pmCap(false);
          window.pmSkinBusy(r || 'sin resultado');
        }, 1500);
      }, 350);
    };
    $('pm-sd').onclick = function () { test('down'); };
    $('pm-su').onclick = function () { test('up'); };
  }
})();
