/* ===========================================================
   scenes/intro.js — INTRO DINÁMICA CON DOS PINGÜINOS (v1.4)
   Se muestra justo después de la historia del pingüino (dentro de la misma escena 'story').
   Antes de nada hay TRES botones:
     1) 🐧 "Es mi primera vez: ¡explícame todo!"  -> todas las diapositivas
     2) 📖 "Ya lo jugué: quiero recordar"        -> solo lo esencial (4 diapositivas)
     3) ⚡ "Quiero ir directo a la acción"         -> se salta todo
   Cada quien elige lo suyo (no hace falta que elijan lo mismo); la partida sigue cuando AMBOS terminaron.
   Para editar textos: SLIDES (completo) y RECALL (resumen) más abajo.  who: 0 = pingüino, 1 = pingüina.
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;

  /* ---------- helpers de dibujo ---------- */
  function card(s, x, y, w, h, fill, line) {
    const g = s.add.graphics().setDepth(4); g.fillStyle(0x000000, 0.25).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 2, w, h, 5).fillStyle(fill || 0xfff3d6).fillRoundedRect(x - w / 2, y - h / 2, w, h, 5).lineStyle(1.5, line || 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 5);
    return g;
  }
  function T(s, x, y, str, size, color, o) { return A.text(s, x, y, str, size, color || '#ffffff', Object.assign({ strokeThickness: 2 }, o || {})).setDepth(6); }
  function keycap(s, x, y, label, w) {
    w = w || 20; const g = s.add.graphics().setDepth(5);
    g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2, y - 8, w, 18, 3).fillStyle(0xfff3d6).fillRoundedRect(x - w / 2, y - 9, w, 16, 3).lineStyle(1, 0x8a6a4a).strokeRoundedRect(x - w / 2, y - 9, w, 16, 3);
    A.text(s, x, y - 1, label, 11, '#2b1b30', { strokeThickness: 0 }).setDepth(6); return g;
  }
  function pop(s, o, delay) { o.setScale && o.setScale(0.2); s.tweens.add({ targets: o, scale: 1, duration: 260, delay: delay || 0, ease: 'Back.easeOut' }); }
  function emojiCard(s, x, y, w, h, emoji, label, sub, delay) {
    const g = card(s, x, y, w, h); const e = A.text(s, x, y - (sub ? 8 : 4), emoji, 17, '#000', { strokeThickness: 0 }).setDepth(6);
    const l = A.text(s, x, y + (sub ? 6 : 10), label, 10, '#2b1b30', { strokeThickness: 0 }).setDepth(6); const items = [g, e, l];
    if (sub) items.push(A.text(s, x, y + 15, sub, 9, '#8a5a3a', { strokeThickness: 0 }).setDepth(6));
    items.forEach(o => { o.alpha = 0; s.tweens.add({ targets: o, alpha: 1, duration: 220, delay: delay || 0 }); });
    return items;
  }

  /* ---------- ilustraciones (zona central 90..310 x 18..160) ---------- */
  const ART = {
    bienvenida(s, n) {
      const t = T(s, 200, 36, 'LIMA DE A DOS', 22, '#ffd24a', { strokeThickness: 4 }); s.tweens.add({ targets: t, scale: { from: 0.96, to: 1.04 }, duration: 700, yoyo: true, repeat: -1 });
      [[132, 96], [268, 96]].forEach(([x, y], i) => {     // dos laptops
        const g = s.add.graphics().setDepth(5); g.fillStyle(0x2b1b30).fillRoundedRect(x - 26, y - 20, 52, 34, 3).fillStyle(i ? 0xffb3d1 : 0xbfeaff).fillRect(x - 23, y - 17, 46, 28).fillStyle(0x2b1b30).fillRect(x - 32, y + 14, 64, 5).fillStyle(0x8a6a8a).fillRect(x - 12, y + 14, 24, 2);
        A.heart(g, x, y - 3, 6, i ? 0xff5d97 : 0x4aa6ff);
      });
      const code = s.add.graphics().setDepth(5); code.fillStyle(0x2b1b30).fillRoundedRect(162, 82, 76, 30, 5).lineStyle(1.5, 0xffd24a).strokeRoundedRect(162, 82, 76, 30, 5);
      T(s, 200, 90, 'código de sala', 9, '#fff3d6', { strokeThickness: 0 }); T(s, 200, 104, 'ROSAS', 14, '#ffd24a', { strokeThickness: 0 });
      for (let i = 0; i < 6; i++) { const d = s.add.rectangle(160 - i * 5, 96, 3, 3, 0xffffff, 0.9).setDepth(5); s.tweens.add({ targets: d, alpha: { from: 0.1, to: 1 }, duration: 500, delay: i * 120, yoyo: true, repeat: -1 }); const d2 = s.add.rectangle(240 + i * 5, 96, 3, 3, 0xffffff, 0.9).setDepth(5); s.tweens.add({ targets: d2, alpha: { from: 0.1, to: 1 }, duration: 500, delay: i * 120, yoyo: true, repeat: -1 }); }
      for (let i = 0; i < 7; i++) { const h = s.add.graphics().setDepth(5); A.heart(h, 0, 0, 3 + (i % 3), [0xff5d97, 0xff9fd0, 0xffd0e0][i % 3]); h.x = 110 + i * 30; h.y = 140; s.tweens.add({ targets: h, y: 60, alpha: { from: 1, to: 0 }, duration: 1800, delay: i * 250, repeat: -1 }); }
    },
    controles(s) {
      T(s, 200, 22, 'CONTROLES', 14, '#ffd24a');
      const rows = [[['←', '↑', '↓', '→'], 'Moverte (o WASD)', 17], [['E'], 'Usar: puertas, clóset, TV…', 20], [['Espacio'], 'Saltar / actuar en juegos', 46], [['Enter'], 'Chat con tu pareja', 36],
        [['1-9'], 'Emoticones', 28], [['B'], 'Bailar 💃', 20], [['Esc'], 'Volver al igloo / cerrar', 26], [['click'], 'Botones y pines del mapa', 30]];
      rows.forEach(([keys, lab, kw], i) => {
        const col = i % 2, row = (i / 2) | 0, x0 = 84 + col * 120, y = 50 + row * 28;
        let cx = x0;
        keys.forEach(k => { keycap(s, cx + kw / 2, y, k, kw); cx += kw + 3; });
        T(s, x0, y + 13, lab, 9, '#fff3d6', { strokeThickness: 0 }).setOrigin(0, 0.5);
      });
    },
    igloo(s) {
      T(s, 200, 22, 'EL IGLOO: NUESTRA BASE', 13, '#ffd24a');
      const items = [['👕', 'Clóset', 'tu look'], ['🎧', 'DJ', 'la música'], ['📺', 'TV', 'series'], ['🎨', 'Pizarra', 'dibujar'], ['💌', 'Cartas', 'se guardan'], ['🛋', 'Decorar', 'de a dos'], ['🏆', 'Récords', 'quién gana'], ['🚪', 'Puerta', 'al mapa']];
      items.forEach(([e, l, sb], i) => { const x = 114 + (i % 4) * 58, y = 62 + ((i / 4) | 0) * 52; emojiCard(s, x, y, 54, 46, e, l, sb, i * 70); });
      T(s, 200, 150, 'Acércate y pulsa  E', 12, '#ffffff');
    },
    mapa(s) {
      T(s, 200, 20, 'ELEGIR EL JUEGO EN EL MAPA', 13, '#ffd24a');
      const m = s.add.graphics().setDepth(4); m.fillStyle(0x2f9ad8).fillRoundedRect(88, 30, 224, 112, 6).fillStyle(0xf3e3b8).fillPoints([{ x: 150, y: 30 }, { x: 312, y: 30 }, { x: 312, y: 142 }, { x: 170, y: 142 }, { x: 158, y: 90 }], true).lineStyle(2, 0x2b1b30).strokeRoundedRect(88, 30, 224, 112, 6);
      [[222, 52, 'PUCP'], [262, 84, 'Kennedy'], [176, 56, 'Callao'], [214, 124, 'Los Yuyos'], [284, 52, 'Dojo']].forEach(([x, y, n], i) => {
        const p = A.text(s, x, y, '📍', 14, '#000', { strokeThickness: 0 }).setDepth(7); s.tweens.add({ targets: p, y: y - 3, duration: 500 + i * 70, yoyo: true, repeat: -1 });
        T(s, x, y + 10, n, 9, '#2b1b30', { stroke: '#ffffff', strokeThickness: 2 });
      });
      const cur = A.text(s, 286, 122, '👆', 20, '#000', { strokeThickness: 0 }).setDepth(9); s.tweens.add({ targets: cur, x: 272, y: 106, duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, hold: 300 });
      T(s, 200, 150, '▲▼  rueda del mouse / flechas ↑ ↓ para bajar a Barranco', 10, '#fff3d6', { strokeThickness: 0 });
    },
    juegos(s) {
      T(s, 200, 20, 'MINIJUEGOS POR LIMA', 13, '#ffd24a');
      const g = [['🐈', 'Carrera de gatos', 'Kennedy'], ['🙈', 'Escondidas', 'PUCP'], ['🍗', 'Pollos', 'Pollo Pier'], ['💃', 'Salsa', 'Saoco'], ['🍜', 'Ramen (equipo)', 'Ccellis'], ['🥋', 'Card-jitsu', 'Dojo'], ['🏖', 'Playas', 'Callao · Yuyos'], ['👁', 'Mirada fija', 'Olivar'], ['🔴', 'Cuatro en raya', 'Casa de Sebas']];
      g.forEach(([e, l, sb], i) => { const x = 128 + (i % 3) * 72, y = 52 + ((i / 3) | 0) * 40; emojiCard(s, x, y, 68, 36, e, l, null, i * 60); });
    },
    marcador(s) {
      T(s, 200, 20, 'EL MARCADOR DE SOLES', 13, '#ffd24a');
      const g = s.add.graphics().setDepth(5); g.fillStyle(0x2b1b30).fillRoundedRect(96, 44, 208, 24, 5).fillStyle(0xfff3d6).fillRect(100, 52, 200, 8).fillStyle(0xff7aa8).fillRect(200, 52, 62, 8).fillStyle(0x2b1b30).fillRect(199, 48, 3, 16);
      T(s, 100, 76, '−50  pierde', 10, '#ff9fb0', { strokeThickness: 0 }).setOrigin(0, 0.5); T(s, 300, 76, '+50  gana', 10, '#9fe8c0', { strokeThickness: 0 }).setOrigin(1, 0.5); T(s, 200, 76, '0', 10, '#fff3d6', { strokeThickness: 0 });
      const coin = A.text(s, 262, 50, '🪙', 15, '#000', { strokeThickness: 0 }).setDepth(8); s.tweens.add({ targets: coin, y: 40, duration: 600, yoyo: true, repeat: -1 });
      emojiCard(s, 140, 112, 82, 44, '🏆', 'Gana el minijuego', '+ S/ 10', 100); emojiCard(s, 260, 112, 82, 44, '🧋', 'Quien llega a −50', 'paga el festejo', 220);
    },
    premios(s) {
      T(s, 200, 20, 'PREMIOS EXCLUSIVOS', 13, '#ffd24a');
      for (let i = 0; i < 7; i++) { const row = i < 4 ? 0 : 1, n = row ? 3 : 4, idx = row ? i - 4 : i, x = 200 + (idx - (n - 1) / 2) * 68, y = 58 + row * 54; emojiCard(s, x, y, 64, 48, '🎁', '¿Sorpresa?', null, i * 70); }
    },
    objetivo(s) {
      T(s, 200, 26, 'EL OBJETIVO', 15, '#ffd24a');
      const lab = '¡Descúbranlo juntos!';
      const h = s.add.graphics().setDepth(5); A.heart(h, 200, 78, 26, 0xff5d97); A.heart(h, 190, 70, 6, 0xffd0e0, 0.8); s.tweens.add({ targets: h, scale: { from: 0.95, to: 1.08 }, duration: 600, yoyo: true, repeat: -1 });
      T(s, 200, 118, lab, 14, '#ffffff', { strokeThickness: 3 });
      T(s, 200, 138, 'Una sorpresa tras otra 💜', 11, '#fff3d6', { strokeThickness: 0 });
    }
  };

  /* ---------- guion ---------- */
  const SLIDES = [
    { art: 'bienvenida', title: 'Bienvenidos', say: (a, b) => [[0, '¡Hola, ' + b + '! Bienvenidos a Lima de a dos 💜 Un juego para dos, cada quien en su laptop.'], [1, 'Se conectan con el código de sala y juegan a la vez. ¡Te explico rapidito cómo funciona!']] },
    { art: 'controles', title: 'Controles', say: () => [[1, 'Muévete con las flechas o WASD. Con E usas lo que tienes cerca: puertas, clóset, TV…'], [0, 'Espacio salta o actúa en los juegos. Enter abre el chat y 1–9 son emoticones.'], [1, 'B es para bailar y Esc te lleva de vuelta al igloo. ¡Fácil!']],
      short: () => [[1, 'Flechas/WASD mover · E usar · Espacio saltar · Enter chat · 1–9 emoticones · B bailar · Esc igloo.']] },
    { art: 'igloo', title: 'El igloo', say: () => [[0, 'El igloo es nuestra base: clóset, DJ, TV, pizarra para dibujar, cartas, decoración y récords.'], [1, 'La puerta (acércate y pulsa E) te saca al mapa de Lima. ¡Allí también está la casa de Sebas!']] },
    { art: 'mapa', title: 'Elegir el juego', say: () => [[1, 'En el mapa haz clic en un pin amarillo para elegir el juego: ¡los dos viajan juntos!'], [0, 'Con la rueda del mouse o ↑ ↓ bajas hasta Barranco y Los Yuyos. Con Esc vuelves al igloo.'], [1, 'En cada juego leen las reglas y empiezan cuando los dos pulsan “Estoy listo”.']],
      short: () => [[0, 'Puerta del igloo (E) → mapa → clic en un pin amarillo. En cada juego, ambos pulsan “Estoy listo”.']] },
    { art: 'juegos', title: 'De qué va', say: () => [[0, 'Cada lugar es un minijuego: gatos, escondidas, pollos, salsa, cartas, playas, mirada fija…'], [1, 'Casi todos son duelos: juegan a la vez y gana quien lo haga mejor.'], [0, 'Los Ccellis (ramen) es en equipo: ¡allí ganan o pierden juntos!']] },
    { art: 'marcador', title: 'Cómo se gana', say: () => [[1, 'Quien gana un minijuego suma S/ 10 en el marcador de arriba.'], [0, 'El primero que llegue a −50 pierde la partida… y paga el festejo: bubble tea, ramen y makis.'], [1, 'Y al final de la partida… ¡hay sorpresas! 💜']],
      short: () => [[1, 'Cada victoria vale S/ 10. Quien llegue a −50 pierde y paga el festejo. ¡Y al final hay sorpresas!']] },
    { art: 'premios', title: 'Premios exclusivos', say: () => [[0, '¡Algunos juegos tienen premios exclusivos y especiales!'], [1, 'No te voy a contar cuáles… todos son sorpresas. 🎁'], [0, 'Juega cada lugar de Lima, gana, y descubre qué te llevas.'], [1, 'Hay cosas que se quedan contigo para siempre. ¡A buscarlas!']],
      short: () => [[0, 'Hay premios exclusivos en algunos juegos, y todos son sorpresas. ¡A descubrirlos!']] },
    { art: 'objetivo', title: 'El objetivo', say: () => [[1, 'El objetivo: divertirnos juntos, sumar más soles que el otro… ¡y descubrir todas las sorpresas que hay en Lima!'], [0, 'Si se cae el internet, el juego se pausa y sigue cuando vuelvan. ¡Ahora sí: a jugar! 🐧💜🐧']] }
  ];
  const RECALL = SLIDES.filter(x => x.short);

  /* ---------- controlador (se "pega" a StoryScene) ---------- */
  const Intro = G.Intro = {};

  function btn(s, x, y, w, h, label, color, fn, i) {
    const g = s.add.graphics().setDepth(20); const draw = hover => { g.clear(); g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 3, w, h, 6).fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2 - (hover ? 1 : 0), w, h, 6).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2 - (hover ? 1 : 0), w, h, 6); };
    draw(false);
    const t = A.text(s, x, y - 1, label, 13, '#2b1b30', { strokeThickness: 0 }).setDepth(21);
    const z = s.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(22);
    z.on('pointerover', () => draw(true)); z.on('pointerout', () => draw(false)); z.on('pointerdown', (p, lx, ly, e) => { e && e.stopPropagation && e.stopPropagation(); G.audio.sfx('click'); fn(); });
    [g, t].forEach(o => { o.alpha = 0; s.tweens.add({ targets: o, alpha: 1, duration: 260, delay: 200 + i * 140 }); });
  }

  function bg(s) {
    const g = s.add.graphics(); A.bands(g, 0, 0, W, H, [0x140a3a, 0x4a2a8a, 0xff9ec0], 4); A.stars(s, 28, 110, 1); A.snow(s, 26, 3);
    g.fillStyle(0xf4fbff).fillEllipse(200, 232, 520, 54);
  }
  const PY = 134;
  function penguins(s, speaking) {
    const him = A.penguin(s, 40, PY, { s: 1.0 }).setDepth(10), her = A.penguin(s, 360, PY, { s: 1.05, fem: true, flip: true }).setDepth(10);
    s.tweens.add({ targets: [him, her], y: '-=1.5', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.intro.him = him; s.intro.her = her;
    return [him, her];
  }
  function talk(s, who) {                                    // el que habla salta y saluda; el otro se queda quieto
    const P = [s.intro.him, s.intro.her], me = P[who], ot = P[1 - who];
    s.tweens.killTweensOf(me); s.tweens.killTweensOf(ot);
    ot.y = PY; me.y = PY;
    s.tweens.add({ targets: me, y: PY - 6, duration: 170, yoyo: true, repeat: 3, ease: 'Sine.easeOut' });
    s.tweens.add({ targets: me.flR || me, angle: { from: -6, to: 6 }, duration: 160, yoyo: true, repeat: 5 });
    s.tweens.add({ targets: ot, y: '-=1.5', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (s.intro.tag) { const nm = who === 0 ? s.intro.n.sebas : s.intro.n.dani; s.intro.tag.setText(nm).setColor(who === 0 ? '#9fd8ff' : '#ffb3d1'); s.intro.tag.setX(who === 0 ? 44 : 356); }
  }

  /* ---- pantalla de elección (3 botones) ---- */
  Intro.choice = function (s) {
    s.clearPanel(); s.txt.setText(''); s.hint.setAlpha(0); s.dots.clear(); s.skip.setVisible(false);
    s.intro = { mode: 'choice', n: s.names }; bg(s);
    const him = A.penguin(s, 44, 140, { s: 1.35 }).setDepth(10), her = A.penguin(s, 356, 140, { s: 1.4, fem: true, flip: true }).setDepth(10); A.waddle(s, him, 420, 4); A.waddle(s, her, 440, 4);
    T(s, 200, 26, '¡Listo! Ya conoces la historia', 15, '#ffffff', { strokeThickness: 3 });
    T(s, 200, 46, '¿Cómo quieres empezar?', 12, '#ffd24a', { strokeThickness: 2 });
    btn(s, 200, 82, 218, 30, '🐧  Es mi primera vez: ¡explícame todo!', 0xffd24a, () => Intro.begin(s, 'full'), 0);
    btn(s, 200, 118, 218, 30, '📖  Ya lo jugué: quiero recordar', 0xbfeaff, () => Intro.begin(s, 'recall'), 1);
    btn(s, 200, 154, 218, 30, '⚡  Quiero ir directo a la acción', 0xff7aa8, () => Intro.end(s), 2);
    s.txt.setText('Elige con el mouse o con las teclas 1, 2 y 3.\nCada quien elige lo suyo 💜');
  };

  Intro.begin = function (s, mode) {
    s.intro = { mode, list: mode === 'full' ? SLIDES : RECALL, i: -1, line: 0, n: s.names, ready: true };
    s.skip.setText('Saltar tutorial ⏭').setVisible(true);
    Intro.slide(s, 0);
  };

  Intro.slide = function (s, i) {
    const I = s.intro; if (i >= I.list.length) { Intro.end(s); return; }
    I.i = i; I.line = 0; I.busy = true;
    s.clearPanel(); s.txt.setText(''); s.hint.setAlpha(0);
    bg(s); const sl = I.list[i];
    ART[sl.art](s, I.n);
    penguins(s);
    I.tag = A.text(s, 44, 159, '', 11, '#ffffff', { strokeThickness: 2 }).setDepth(102);
    I.lines = (I.mode === 'recall' && sl.short ? sl.short : sl.say)(I.n.sebas, I.n.dani);
    // puntitos de progreso
    const n = I.list.length, x0 = W / 2 - n * 6; for (let k = 0; k < n; k++) s.dots.fillStyle(k === i ? 0xffd24a : 0xffffff, k <= i ? 1 : 0.4).fillRect(x0 + k * 12, 8, 7, 4);
    s.time.delayedCall(180, () => { I.busy = false; Intro.say(s); });
  };

  Intro.say = function (s) {
    const I = s.intro, ln = I.lines[I.line]; if (!ln) return;
    talk(s, ln[0]); s.typeText(ln[1]);
  };

  Intro.advance = function (s) {
    const I = s.intro; if (!I || I.busy) return;
    if (I.mode === 'choice') return;
    if (s.typing) { s.endType(); return; }
    G.audio.sfx('pop');
    if (I.line + 1 < I.lines.length) { I.line++; Intro.say(s); } else Intro.slide(s, I.i + 1);
  };
  Intro.back = function (s) {
    const I = s.intro; if (!I || I.busy || I.mode === 'choice') return;
    if (I.line > 0) { I.line--; Intro.say(s); } else if (I.i > 0) { Intro.slide(s, I.i - 1); }
  };

  Intro.end = function (s) {
    if (s.introEnded) return; s.introEnded = true;
    s.intro = null; s.clearPanel(); s.txt.setText(''); s.hint.setAlpha(0); s.dots.clear(); s.skip.setVisible(false);
    bg(s);
    const p1 = A.penguin(s, 170, 140, { s: 1.4 }), p2 = A.penguin(s, 230, 140, { s: 1.5, fem: true, flip: true }); A.waddle(s, p1, 400, 4); A.waddle(s, p2, 420, 4);
    A.text(s, 200, 70, '¡A jugar!', 22, '#ffffff');
    s.wait = A.text(s, 200, 190, G.net.connected || !G.solo ? 'Esperando a ' + s.otherName() + '…' : '', 16, '#fff3d6');
    s.fade.setAlpha(0); G.state.storySeen = true; G.save(); G.flow.storyDone();
  };
})();
