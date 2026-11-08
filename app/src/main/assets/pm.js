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
