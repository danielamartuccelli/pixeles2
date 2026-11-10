/* ===========================================================
   textfx.js — TEXTO NÍTIDO (v1.4)
   Problema: el juego se dibuja en un lienzo de 400x225 que el navegador agranda sin suavizar. Con tamaños de ventana
   "no enteros" (la gran mayoría de laptops) las letras chiquitas salían deformes y borrosas.
   Solución: los objetos de texto de Phaser se siguen creando y moviendo igual que siempre, pero en vez de dibujarse
   dentro del lienzo pequeño se pintan en una capa transparente (canvas 2D) con la resolución REAL de la pantalla.
   - Cada Text se renderiza internamente a mayor resolución (setResolution) y esa imagen se copia a la capa.
   - Respeta cámara, contenedores, escala, giro, transparencia y origen.
   - Respeta el "tapado": si un panel/rectángulo opaco con más profundidad (depth) cubre un texto, ese texto se
     oculta (o se atenúa si el panel es translúcido), igual que pasaba cuando todo estaba en el mismo lienzo.
   Si algo falla, window.G.textfx.off() restaura el dibujo clásico.
   =========================================================== */
(function () {
  const G = window.G, Ph = window.Phaser;
  if (!Ph) return;
  const TextCls = Ph.GameObjects.Text, TM = Ph.GameObjects.Components.TransformMatrix;
  const fx = G.textfx = { on: true, layer: null, ctx: null };

  /* ---- resolución interna de cada texto: la escala real de pantalla, redondeada hacia arriba ---- */
  function resFor() {
    let sc = 3;
    try { const r = G.game && G.game.canvas && G.game.canvas.getBoundingClientRect(); if (r && r.width) sc = r.width / G.W; } catch (e) { }
    return Math.max(2, Math.min(5, Math.ceil(sc * (window.devicePixelRatio || 1))));
  }
  const GOF = Ph.GameObjects.GameObjectFactory.prototype, origText = GOF.text;
  GOF.text = function () { const t = origText.apply(this, arguments); if (fx.on) t.setResolution(resFor()); return t; };

  /* ---- cola de dibujo ---- */
  const queue = [];
  const sm = new TM(), cm = new TM(), calc = new TM();
  const origWebGL = TextCls.prototype.renderWebGL, origCanvas = TextCls.prototype.renderCanvas;
  function record(renderer, src, camera, parentMatrix) {
    sm.applyITRS(src.x, src.y, src.rotation, src.scaleX, src.scaleY);
    cm.copyFrom(camera.matrix);
    if (parentMatrix) { cm.multiplyWithOffset(parentMatrix, -camera.scrollX * src.scrollFactorX, -camera.scrollY * src.scrollFactorY); sm.e = src.x; sm.f = src.y; }
    else { sm.e -= camera.scrollX * src.scrollFactorX; sm.f -= camera.scrollY * src.scrollFactorY; }
    cm.multiply(sm, calc);
    queue.push({ src, a: calc.a, b: calc.b, c: calc.c, d: calc.d, e: calc.e, f: calc.f, alpha: src.alpha * (camera.alpha === undefined ? 1 : camera.alpha), scene: src.scene, depth: src.depth, tx: calc.e, ty: calc.f });
  }
  TextCls.prototype.renderWebGL = function (renderer, src, camera, parentMatrix) { if (!fx.on) return origWebGL.call(this, renderer, src, camera, parentMatrix); record(renderer, src, camera, parentMatrix); };
  TextCls.prototype.renderCanvas = function (renderer, src, camera, parentMatrix) { if (!fx.on) return origCanvas.call(this, renderer, src, camera, parentMatrix); record(renderer, src, camera, parentMatrix); };

  /* ---- "tapado": rectángulos/paneles opacos con más depth que el texto ---- */
  // los Graphics recuerdan su relleno más grande y opaco (fillRect / fillRoundedRect)
  const GP = Ph.GameObjects.Graphics.prototype;
  const wrapFill = name => {
    const orig = GP[name];
    GP[name] = function (x, y, w, h) {
      if (w * h >= 500 && this.defaultFillAlpha >= 0.8) { (this._occ || (this._occ = [])).push([x, y, w, h, this.defaultFillAlpha]); if (this._occ.length > 24) this._occ.shift(); }
      return orig.apply(this, arguments);
    };
  };
  wrapFill('fillRect'); wrapFill('fillRoundedRect');
  const origClear = GP.clear; GP.clear = function () { this._occ = null; return origClear.apply(this, arguments); };

  function occluders(scene) {       // [{x,y,w,h,a,depth,sfx,sfy}] en coordenadas del mundo
    if (scene._fxOccFrame === fx.frame) return scene._fxOcc;
    const out = [];
    scene.children.list.forEach(o => {
      if (!o.visible || !o.active || o.rotation) return;
      if (o.type === 'Graphics' && o._occ) o._occ.forEach(r => out.push({ x: o.x + r[0] * o.scaleX, y: o.y + r[1] * o.scaleY, w: r[2] * o.scaleX, h: r[3] * o.scaleY, a: r[4] * o.alpha, depth: o.depth, sfx: o.scrollFactorX, sfy: o.scrollFactorY }));
      else if (o.type === 'Rectangle' && o.fillAlpha > 0.03 && o.width * o.height >= 500) out.push({ x: o.x - o.displayOriginX * o.scaleX, y: o.y - o.displayOriginY * o.scaleY, w: o.width * o.scaleX, h: o.height * o.scaleY, a: o.fillAlpha * o.alpha, depth: o.depth, sfx: o.scrollFactorX, sfy: o.scrollFactorY });
    });
    scene._fxOccFrame = fx.frame; scene._fxOcc = out; return out;
  }
  /* devuelve {f: factor de transparencia por paneles translúcidos, holes: rects (px del juego) opacos que tapan al texto} */
  function cover(q) {
    const sc = q.scene, res = { f: 1, holes: null };
    if (!sc || !sc.children) return res;
    const cam = sc.cameras.main, occ = occluders(sc); if (!occ.length) return res;
    const src = q.src, w = src.width, h = src.height;
    // caja del texto en pantalla (aprox. sin giro)
    const x0 = q.e - src.displayOriginX * q.a, y0 = q.f - src.displayOriginY * q.d, x1 = x0 + w * q.a, y1 = y0 + h * q.d;
    const lx = 0.5 * w - src.displayOriginX, ly = 0.5 * h - src.displayOriginY, cx = q.a * lx + q.c * ly + q.e, cy = q.b * lx + q.d * ly + q.f;
    for (const o of occ) {
      if (o.depth <= q.depth) continue;
      const ox = o.x - cam.scrollX * o.sfx, oy = o.y - cam.scrollY * o.sfy;
      if (o.a >= 0.85) { if (ox < Math.max(x0, x1) && ox + o.w > Math.min(x0, x1) && oy < Math.max(y0, y1) && oy + o.h > Math.min(y0, y1)) (res.holes || (res.holes = [])).push([ox, oy, o.w, o.h]); }
      else if (cx >= ox && cx <= ox + o.w && cy >= oy && cy <= oy + o.h) res.f *= (1 - o.a);
    }
    return res;
  }

  /* ---- la capa ---- */
  fx.frame = 0;
  function ensureLayer() {
    if (fx.layer) return;
    const c = document.createElement('canvas'); c.id = 'txtlayer'; c.style.cssText = 'position:fixed;pointer-events:none;left:0;top:0;width:0;height:0';
    const host = document.getElementById('game') || document.body; host.appendChild(c);
    fx.layer = c; fx.ctx = c.getContext('2d');
  }
  function flush() {
    ensureLayer(); fx.frame++;
    const c = fx.layer, ctx = fx.ctx, cv = G.game.canvas; if (!cv) { queue.length = 0; return; }
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const st = c.style; st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = r.height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
    if (!fx.on) { queue.length = 0; return; }
    const k = w / G.W;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i], src = q.src; if (!src.canvas || !src.scene) continue;
      const cv2 = cover(q), al = q.alpha * cv2.f; if (al <= 0.01) continue;
      if (cv2.holes) {       // se recorta lo que queda debajo de paneles opacos con más depth
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, 0, w, h);
        cv2.holes.forEach(r => ctx.rect(r[0] * k, r[1] * k, r[2] * k, r[3] * k)); ctx.clip('evenodd');
      }
      ctx.setTransform(q.a * k, q.b * k, q.c * k, q.d * k, q.e * k, q.f * k);
      ctx.globalAlpha = al;
      ctx.drawImage(src.canvas, -src.displayOriginX, -src.displayOriginY, src.width, src.height);
      if (cv2.holes) ctx.restore();
    }
    ctx.globalAlpha = 1; queue.length = 0;
  }
  fx.attach = function (game) {
    game.events.on('postrender', flush);
    game.events.on('prerender', () => { queue.length = 0; });
  };
  fx.off = function () { fx.on = false; if (fx.layer) fx.layer.style.display = 'none'; };
})();
