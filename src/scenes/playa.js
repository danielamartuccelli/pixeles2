/* ===========================================================
   scenes/playa.js — ETAPA 9 · PLAYAS (base común + Callao)
   BeachBase: sala de espera ("¡Estoy listo!"), inicio sincronizado, resultado, premio (S/ 10) y botón de FOTO
   para el ganador. Callao = "Piedra, Frío y Resistencia" (lucha 1v1 en la orilla, mejor de 3 rondas).
   Los dos usan TRAJE DE BAÑO (clóset > Playa). Todo procedural.

   Callao — reglas: ← ↑ ↓ → mover · MANTÉN ESPACIO o E y suelta para lanzar piedra (más tiempo = más lejos; cabe 3; se recogen caminando) · toque rápido de E cerca = golpear (combo de 3).
   Hay una barra de VIDA y una de TEMPERATURA (hipotermia): si te quedas quieto el frío sube, si te salpica el
   agua fría sube de golpe y te vuelves lento. Moverse te calienta; las FOGATAS te calientan más.
   Pierdes la ronda si tu vida llega a 0 o si te CONGELAS (temperatura 100).
   Red: a_cfg · a_ready{r} · a_go{seed} · a_pos{x,y,fx,fy,hp,tp,n} · a_throw{id,x,y,vx,vy} · a_hit{id} ·
        a_melee{dmg,tp} · a_pick{i} · a_dead{} · a_res · a_again
   Prueba sola: ?solo=1&me=sebas&go=callao&aauto=1   (la pareja es un bot)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), mg = G.mg, OUTL = 0x2b1b30;
  G.beach = G.beach || {};

  /* ---------- fondo de playa (compartido por las escenas de playa y la foto) ---------- */
  G.beach.drawSea = function (scene, g, o) {
    o = o || {}; const seaH = o.seaH || 70, sunset = !!o.sunset;
    A.bands(g, 0, 0, W, seaH, sunset ? [0xff9ec0, 0xffc98a, 0x6fb4e0] : [0x7fd6ff, 0x4fb4e8, 0x2f8fd0], 4);
    for (let i = 0; i < 16; i++) { const x = (i * 59) % W, y = 8 + (i * 23) % (seaH - 14); g.fillStyle(0xffffff, 0.25).fillRect(x, y, 10, 1); }
    // arena: mojada -> seca
    g.fillStyle(0xd9bf84).fillRect(0, seaH, W, 24).fillStyle(0xecd49a).fillRect(0, seaH + 24, W, H - seaH - 24);
    for (let i = 0; i < 120; i++) { g.fillStyle(i % 2 ? 0xc9a96a : 0xf8e8b8, 0.7).fillRect((i * 97) % W, seaH + 4 + (i * 53) % (H - seaH), 1, 1); }
    if (o.sun) { g.fillStyle(0xfff3b0).fillCircle(330, 30, 12).fillStyle(0xffd27a, 0.35).fillCircle(330, 30, 20); }
  };
  G.beach.stone = function (g, x, y, r) { g.fillStyle(OUTL).fillEllipse(x, y, r * 2 + 2, r * 1.5 + 2).fillStyle(0xb8bcc8).fillEllipse(x, y, r * 2, r * 1.5).fillStyle(0xe6e9f2).fillEllipse(x - r * 0.3, y - r * 0.25, r * 0.8, r * 0.45); };

  /* ---------- base de las escenas de playa ---------- */
  class BeachBase extends Phaser.Scene {
    setupBase(px, place, title, blurb) {
      Object.assign(this, { px, place, title, blurb, phase: 'lobby', ready: { me: false, partner: false }, ui: [], resolved: false, over: false });
      A.emoteTextures(this.game); G.refreshTextures(); G.makeBeachTextures();
      G.audio.setStyle(G.PLACES[place].music);
      mg.bind(this, [[px + '_ready', d => { this.ready.partner = !!d.r; if (this.phase === 'lobby') { this.drawLobby(); this.tryStart(); } }],
        [px + '_go', d => { if (this.phase === 'lobby') this.begin(d); }],
        [px + '_res', d => this.showOver(d)], [px + '_again', () => this.scene.restart()]]);
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby') mg.send(px + '_ready', { r: this.ready.me }); } });
    }
    addUi(o) { this.ui.push(o); return o; }
    clearUi() { this.ui.forEach(o => o.destroy && o.destroy()); this.ui = []; }
    isHost() { return G.solo || G.net.role === 'host'; }
    nameMe() { return G.state.me.name || G.IDS[G.state.me.id].label; }
    nameOp() { return G.state.partner.name || G.IDS[G.state.partner.id].label; }

    /* 3 = abajo del HUD de arriba; se dibuja encima de todo en depth 5000 */
    drawLobby() {
      this.clearUi(); const add = o => this.addUi(o), D = 5000;
      mg.panel(this, add, 26, 40, 348, 164, D);
      add(A.text(this, 200, 50, this.title, 14, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 60, this.blurb, { fontFamily: 'VT323', fontSize: '11px', color: '#fff3d6', align: 'left', lineSpacing: -3, wordWrap: { width: 326 } }).setOrigin(0.5, 0).setDepth(D + 1));
      const label = this.ready.me ? '✔ ¡Listo!' : '¡Estoy listo!';
      mg.btn(this, add, 84, 192, 100, 16, label, this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; mg.send(this.px + '_ready', { r: this.ready.me }); this.drawLobby(); this.tryStart(); }, D, 14);
      add(this.add.text(140, 184, G.solo ? this.nameOp() + ' (bot) 🤖: listo' : this.nameOp() + (this.ready.partner ? ': ✔ listo' : ': esperando…'), { fontFamily: 'VT323', fontSize: '12px', color: '#c9c4ff' }).setOrigin(0, 0).setDepth(D + 1));
      mg.btn(this, add, 262, 192, 56, 16, '◀ Igloo', 0xffffff, () => G.flow.home(), D, 12);
    }
    tryStart() {
      if (this.phase !== 'lobby' || !this.ready.me || !(this.ready.partner || G.solo) || !this.isHost()) return;
      const d = { seed: Math.floor(Math.random() * 2 ** 31) }; mg.send(this.px + '_go', d); this.begin(d);
    }
    /* el anfitrión (o el modo solo) aplica soles/récord y avisa a la pareja */
    hostFinish(winnerId, extra) {
      if (this.resolved || !this.isHost()) return; this.resolved = true;
      const res = Object.assign({ winner: winnerId }, extra || {});
      if (winnerId) { G.addSoles(winnerId, 10); G.recordWin(this.recKey, winnerId); if (this.place === 'callao') G.addPrize('paletas_oso', winnerId, 'callao:' + (this.seed || Date.now())); }
      mg.send(this.px + '_res', res); this.showOver(res);
    }
    showOver(res) {
      if (this.over) return; this.over = true; this.phase = 'over'; this.clearUi(); const add = o => this.addUi(o), D = 5000;
      const me = G.state.me.id, w = res.winner, won = w === me;
      mg.panel(this, add, 40, 34, 320, 150, D);
      add(A.text(this, 200, 48, w ? '¡Ganó ' + (w === me ? this.nameMe() : this.nameOp()) + '!' : 'Empate', 18, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 74, (w ? (won ? '¡Ganaste S/ 10! 🎉' : 'Debes S/ 10 😅') : 'Nadie se lleva soles') + (res.line ? '\n' + res.line : '') + (w && this.place === 'callao' ? '\n🍫🐻 ' + (won ? 'Tu premio: 2 paletas de helado\ncon forma de oso de chocolate' : this.nameOp() + ' se lleva 2 paletas de helado\ncon forma de oso de chocolate') : ''), { fontFamily: 'VT323', fontSize: '14px', color: '#fff3d6', align: 'center' }).setOrigin(0.5, 0).setDepth(D + 1));
      if (w) mg.btn(this, add, 200, 124, 190, 22, won ? '📸 ¡Tomar la foto!' : '📸 Ver la foto de ' + this.nameOp(), 0xffd24a, () => G.travel('foto', { w, place: this.place, again: this.place }), D, 13);
      mg.btn(this, add, 140, 156, 96, 20, '↻ Revancha', 0x9fe0cf, () => { mg.send(this.px + '_again', {}); this.scene.restart(); }, D, 13);
      mg.btn(this, add, 260, 156, 96, 20, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D, 13);
      G.audio.sfx('win');
    }
    sprite(who, x, y, sc) { return this.add.sprite(x, y, 'beach_' + who, 'd0').setOrigin(0.5, 1).setScale(sc || 1); }
    frameFor(vx, vy, t, moving) {
      const f = moving ? [1, 0, 2, 0][Math.floor(t / 130) % 4] : 0;
      if (Math.abs(vx) > Math.abs(vy)) return { key: 'l' + f, flip: vx > 0 };
      return { key: (vy < 0 ? 'u' : 'd') + f, flip: false };
    }
  }
  G.BeachBase = BeachBase;

  /* =========================== CALLAO =========================== */
  const SEA_H = 62, RNDS = 2, CHARGE_T = 1.1, PROJ_V = 200, BX = [18, 382], BY = [76, 212];
  const FIRES = [[64, 176], [336, 176]];
  const hex = c => c;

  class CallaoScene extends BeachBase {
    constructor() { super('callao'); }
    create() {
      this.recKey = 'callao';
      this.setupBase('a', 'callao', '🪨 PIEDRA, FRÍO Y RESISTENCIA', 'Pelea 1 contra 1 en la orilla: gana quien gane 2 de 3 rondas.\n❤ VIDA (barra roja)  BAJA: piedra −14 · golpe con E (−5, −7 y −13 al tercero seguido).  SUBE: junto a una FOGATA 🔥 (+5 por seg.) o pisando un CORAZÓN 💗 del suelo (+25).\n❄ FRÍO (barra celeste)  SUBE: si estás quieto, en el agua, con la ola gigante o si te golpean.  BAJA: moviéndote o junto al fuego.\nPIERDES LA RONDA si tu ❤ llega a 0 o tu ❄ llega a 100%.\nFlechas: mover · MANTÉN ESPACIO o E y suelta: lanzar piedra (máx. 3; mientras más aprietas, más lejos) · toque rápido de E cerca: golpear');
      this.bg = this.add.graphics().setDepth(0); G.beach.drawSea(this, this.bg, { seaH: SEA_H, sun: true });
      this.sea = this.add.graphics().setDepth(1); this.fx = this.add.graphics().setDepth(6); this.hud = this.add.graphics().setDepth(4000); this.hudT = [];
      this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' }, false);
      const kb = this.input.keyboard;
      // MANTÉN ESPACIO o E para cargar el tiro (mientras más aprietas, más lejos cae la piedra) y SUÉLTALA para lanzar. Un toque rápido de E cerca del rival = golpe.
      this.chg = null;
      ['SPACE', 'E'].forEach(kn => {
        kb.on('keydown-' + kn, ev => { if (ev && ev.repeat) return; if (this.phase === 'play' && !this.ended && !G.typing && !G.modalOpen && !this.chg) this.chg = { key: kn, t: 0 }; });
        kb.on('keyup-' + kn, () => this.releaseCharge(kn));
      });
      this.rw = { me: 0, partner: 0 }; this.round = 0; this.clock = 0; this.props = [];
      mg.bind(this, [
        ['a_pos', d => { const o = this.op; if (o) { o.tx = d.x; o.ty = d.y; o.fx = d.fx; o.fy = d.fy; o.hp = d.hp; o.tp = d.tp; o.n = d.n; o.mv = d.mv; } }],
        ['a_throw', d => this.spawnProj('partner', d)], ['a_hit', d => { this.props = this.props.filter(p => !(p.own === 'me' && p.id === d.id)); }],
        ['a_melee', d => this.hurt(d.dmg, d.tp, true)], ['a_pick', d => { const s = this.stones[d.i]; if (s) { s.on = false; s.back = this.clock + 7; } }], ['a_heal', d => { const h = this.heals && this.heals[d.i]; if (h) { h.on = false; h.back = this.clock + 10; } }],
        ['a_dead', () => this.endRound('partner')]]);
      this.drawLobby();
      if (G.solo) this.time.delayedCall(600, () => { if (Q.get('aauto') === '1') { this.ready.me = true; this.tryStart(); } });
    }

    begin(d) {
      this.clearUi(); this.phase = 'count'; this.seed = d.seed; this.rw = { me: 0, partner: 0 }; this.round = 0; this.over = false; this.resolved = false;
      this.startRound();
    }
    startRound() {
      const R = mg.rng((this.seed + this.round * 7919) >>> 0); this.round++; this.clock = 0; this.props = []; this.ended = false;
      this.stones = []; for (let i = 0; i < 8; i++) this.stones.push({ x: 40 + R() * 320, y: 100 + R() * 100, on: true, back: 0 });
      this.heals = [0, 1].map(i => ({ x: 130 + i * 140 + R() * 30, y: 105 + R() * 90, on: true, back: 0 })); this._php = this._ohp = undefined;
      const me = G.state.me.id === 'sebas' ? 0 : 1;   // Sebas a la izquierda, Dani a la derecha (igual en las dos laptops)
      const mk = (who, x) => ({ who, x, y: 150, tx: x, ty: 150, fx: x < 200 ? 1 : -1, fy: 0, hp: 100, tp: 0, n: 1, cd: 0, combo: 0, comboT: 0, mv: false, t: 0, flash: 0, sw: 0 });
      this.me = mk('me', me ? 320 : 80); this.op = mk('partner', me ? 80 : 320);
      if (this.sprMe) { this.sprMe.destroy(); this.sprOp.destroy(); }
      this.sprMe = this.sprite('me', this.me.x, this.me.y, 1.1).setDepth(10); this.sprOp = this.sprite('partner', this.op.x, this.op.y, 1.1).setDepth(10);
      this.lblMe = this.lblMe || A.text(this, 0, 0, '', 9, '#ffffff').setDepth(4001); this.lblOp = this.lblOp || A.text(this, 0, 0, '', 9, '#ffffff').setDepth(4001);
      this.lblMe.setText(this.nameMe()); this.lblOp.setText(this.nameOp());
      this.bot = { t: 0, thinkT: 0, tx: 200, ty: 150 };
      this.phase = 'count'; this.cd = 3.2; this.chg = null;
      if (this.banner) this.banner.destroy();
      this.banner = A.text(this, 200, 112, 'Ronda ' + this.round, 24, '#ffffff').setDepth(4500);
      G.audio.sfx('pop');
    }

    /* ---------- reglas ---------- */
    waterY(t) { return SEA_H + 8 + 9 * Math.sin(t * 1.4); }
    surge(t) {   // ola grande cada 9 s: aviso (espuma parpadeando) y luego sube hasta y=150
      const c = t % 9; if (t < 4) return { warn: false, y: 0 };
      if (c > 7.6 && c < 8.4) return { warn: true, y: 0 };
      if (c >= 8.4 && c < 9) return { warn: false, y: 150 - Math.abs(c - 8.7) * 60 + 0 };
      return { warn: false, y: 0 };
    }
    hurt(dmg, cold, fromNet) {
      if (this.phase !== 'play' || this.ended) return;
      this.me.hp = Math.max(0, this.me.hp - dmg); this.me.tp = Math.min(100, this.me.tp + (cold || 0)); this.me.flash = 0.25; G.audio.sfx('hit');
    }
    /* texto flotante: números de daño y curación sobre el personaje */
    float(x, y, txt, color) {
      const t = this.add.text(x, y, txt, { fontFamily: 'VT323', fontSize: '15px', color, stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5).setDepth(4600);
      this.tweens.add({ targets: t, y: y - 18, alpha: { from: 1, to: 0 }, duration: 1100, onComplete: () => t.destroy() });
    }
    spawnProj(own, d) { this.props.push({ own, id: d.id, x: d.x, y: d.y, vx: d.vx, vy: d.vy, t: 0, rng: d.rng || 240, d: 0 }); }
    /* alcance según lo que se mantuvo apretado: 0 → cerquita (26 px), 1 → toda la orilla (270 px) */
    rangeFor(ratio) { return Math.round(26 + Math.max(0, Math.min(1, ratio)) * 244); }
    releaseCharge(kn) {
      const c = this.chg; if (!c || c.key !== kn) return; this.chg = null;
      if (this.phase !== 'play' || this.ended) return;
      if (kn === 'E' && c.t < 0.2 && Math.hypot(this.op.x - this.me.x, this.op.y - this.me.y) < 24) { this.melee(); return; }   // toque rápido de E cerca = golpe
      this.throwStone(c.t / CHARGE_T);
    }
    throwStone(ratio) {
      if (this.phase !== 'play' || this.ended) return;
      if (this.me.n <= 0) { this.float(this.me.x, this.me.y - 38, 'sin piedras', '#fff3d6'); return; }
      const a = this.me, L = Math.hypot(a.fx, a.fy) || 1, p = { id: (Math.random() * 1e9) | 0, x: a.x, y: a.y - 14, vx: a.fx / L * PROJ_V, vy: a.fy / L * PROJ_V, rng: this.rangeFor(ratio === undefined ? 0.5 : ratio) };
      a.n--; this.spawnProj('me', p); mg.send('a_throw', p); G.audio.sfx('pop');
    }
    melee() {
      const a = this.me; if (this.phase !== 'play' || this.ended || a.cd > 0) return;
      a.cd = 0.3; a.combo = a.comboT > 0 ? Math.min(3, a.combo + 1) : 1; a.comboT = 0.7; a.sw = 0.15;
      const dmg = [5, 7, 13][a.combo - 1], cold = a.combo === 3 ? 10 : 2;
      if (Math.hypot(this.op.x - a.x, this.op.y - a.y) < 24) {
        if (G.solo) { this.op.hp = Math.max(0, this.op.hp - dmg); this.op.tp = Math.min(100, this.op.tp + cold); this.op.flash = 0.25; } else mg.send('a_melee', { dmg, tp: cold });
        G.audio.sfx('hit'); if (a.combo === 3) a.combo = 0;
      }
    }
    endRound(loser) {      // loser: 'me' | 'partner' | 'both'
      if (this.ended) return; this.ended = true; this.phase = 'roundEnd';
      if (loser === 'me') this.rw.partner++; else if (loser === 'partner') this.rw.me++;
      const txt = loser === 'both' ? '¡Doble caída! Se repite' : (loser === 'me' ? this.nameOp() + ' gana la ronda' : '¡' + this.nameMe() + ' gana la ronda!');
      if (loser === 'both') this.round--;
      if (this.banner) this.banner.destroy(); this.banner = A.text(this, 200, 112, txt, 18, '#ffd24a').setDepth(4500);
      G.audio.sfx(loser === 'partner' ? 'win' : 'hit');
      const done = this.rw.me >= RNDS || this.rw.partner >= RNDS;
      this.time.delayedCall(2300, () => {
        if (this.banner) { this.banner.destroy(); this.banner = null; }
        if (done) {
          const w = this.rw.me > this.rw.partner ? G.state.me.id : G.state.partner.id;
          this.phase = 'wait'; this.hostFinish(w, { line: 'Rondas ' + this.rw.me + ' – ' + this.rw.partner });
          this.time.delayedCall(8000, () => { if (!this.over) this.hostFinish(w, {}); });
        } else this.startRound();
      });
    }

    /* ---------- simulación ---------- */
    stepActor(a, dt, ctl, isMe) {
      let vx = ctl.x, vy = ctl.y; const L = Math.hypot(vx, vy);
      a.mv = L > 0; if (L > 0) { vx /= L; vy /= L; a.fx = vx; a.fy = vy; }
      const slow = 1 - Math.max(0, (a.tp - 50) / 50) * 0.6, sp = 66 * slow;
      a.x = Math.max(BX[0], Math.min(BX[1], a.x + vx * sp * dt)); a.y = Math.max(SEA_H - 8, Math.min(BY[1], a.y + vy * sp * dt));
      a.t += dt * 1000; a.cd = Math.max(0, a.cd - dt); a.comboT = Math.max(0, a.comboT - dt); a.flash = Math.max(0, a.flash - dt); a.sw = Math.max(0, a.sw - dt);
      // frío: moverse calienta, quedarse quieto enfría; agua y olas salpican; fogata calienta
      let d = a.mv ? -5 : 3.2;
      const wy = this.waterY(this.clock); if (a.y < wy + 6) d += 24;
      const sg = this.surge(this.clock); if (sg.y && a.y < sg.y) d += 30;
      FIRES.forEach(([fx, fy]) => { if (Math.hypot(a.x - fx, a.y - fy) < 26) { d -= 26; a.hp = Math.min(100, a.hp + 5 * dt); a.warm = 0.3; } });
      a.warm = Math.max(0, (a.warm || 0) - dt);
      a.tp = Math.max(0, Math.min(100, a.tp + d * dt));
      // corazones del suelo (+25 de vida)
      (this.heals || []).forEach((h, i) => {
        if (!h.on && h.back && this.clock > h.back) { h.on = true; h.back = 0; }
        if (isMe && h.on && a.hp < 100 && Math.hypot(a.x - h.x, a.y - h.y) < 10) { h.on = false; h.back = this.clock + 10; a.hp = Math.min(100, a.hp + 25); mg.send('a_heal', { i }); G.audio.sfx('heart'); this.float(a.x, a.y - 38, '+25 ❤', '#7dff9a'); }
      });
      // piedras
      this.stones.forEach((s, i) => { if (!s.on && s.back && this.clock > s.back) { s.on = true; s.back = 0; } if (isMe && s.on && a.n < 3 && Math.hypot(a.x - s.x, a.y - s.y) < 9) { s.on = false; s.back = this.clock + 7; a.n++; mg.send('a_pick', { i }); G.audio.sfx('click'); } });
    }
    botCtl(dt) {   // pareja simulada (modo solo): busca piedras, se acerca, lanza y golpea
      const b = this.bot, a = this.op, m = this.me; b.t += dt; b.thinkT -= dt;
      if (b.thinkT <= 0) {
        b.thinkT = 0.4 + Math.random() * 0.5;
        if (a.n <= 0) { const s = this.stones.filter(s => s.on).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0]; if (s) { b.tx = s.x; b.ty = s.y; } }
        else if (a.tp > 55) { const f = FIRES.sort((p, q) => Math.hypot(p[0] - a.x, p[1] - a.y) - Math.hypot(q[0] - a.x, q[1] - a.y))[0]; b.tx = f[0]; b.ty = f[1]; }
        else { b.tx = m.x + (Math.random() - 0.5) * 90; b.ty = m.y + (Math.random() - 0.5) * 60; }
        if (a.n > 0 && Math.random() < 0.55 && Math.hypot(m.x - a.x, m.y - a.y) < 170) { const L = Math.hypot(m.x - a.x, m.y - a.y) || 1; this.spawnProj('partner', { id: (Math.random() * 1e9) | 0, x: a.x, y: a.y - 14, vx: (m.x - a.x) / L * PROJ_V + (Math.random() - 0.5) * 30, vy: (m.y - a.y) / L * PROJ_V + (Math.random() - 0.5) * 30, rng: L + 24 + Math.random() * 40 }); a.n--; }
        if (Math.hypot(m.x - a.x, m.y - a.y) < 22 && Math.random() < 0.6) this.hurt([5, 7, 13][Math.floor(Math.random() * 3)], 3);
      }
      const dx = b.tx - a.x, dy = b.ty - a.y, L = Math.hypot(dx, dy);
      return L > 4 ? { x: dx / L, y: dy / L } : { x: 0, y: 0 };
    }

    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      this.drawSea(time);
      if (!this.me || !this.stones) return;
      if (this.phase === 'count') { this.cd -= dt; if (this.banner) this.banner.setText(this.cd > 0.8 ? 'Ronda ' + this.round + '\n' + Math.ceil(this.cd - 0.8) : '¡YA!'); if (this.cd <= 0) { this.phase = 'play'; if (this.banner) { this.banner.destroy(); this.banner = null; } } }
      if (this.phase === 'play' || this.phase === 'roundEnd' || this.phase === 'count') this.clock += this.phase === 'play' ? dt : 0;
      if (this.phase === 'play' && !this.ended) {
        const k = this.keys, ctl = { x: (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0), y: (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0) };
        this.stepActor(this.me, dt, G.typing || G.modalOpen ? { x: 0, y: 0 } : ctl, true);
        if (G.solo) { this.stepActor(this.op, dt, this.botCtl(dt), false); }
        else { const o = this.op; o.x += (o.tx - o.x) * Math.min(1, dt * 12); o.y += (o.ty - o.y) * Math.min(1, dt * 12); o.t += dt * 1000; }
        // proyectiles
        this.props.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt; p.d += PROJ_V * dt; });
        if (this.chg) this.chg.t = Math.min(CHARGE_T, this.chg.t + dt);
        this.props = this.props.filter(p => {
          if (p.d >= p.rng || p.t > 3 || p.x < -10 || p.x > W + 10 || p.y < 20 || p.y > H + 10) return false;
          if (p.own === 'partner' && Math.hypot(p.x - this.me.x, p.y - 13 - this.me.y) < 11) { this.hurt(14, 8); mg.send('a_hit', { id: p.id }); return false; }
          if (G.solo && p.own === 'me' && Math.hypot(p.x - this.op.x, p.y - 13 - this.op.y) < 11) { this.op.hp = Math.max(0, this.op.hp - 14); this.op.tp = Math.min(100, this.op.tp + 8); this.op.flash = 0.25; G.audio.sfx('hit'); return false; }
          return true;
        });
        this.netT = (this.netT || 0) + dt; if (this.netT > 0.06) { this.netT = 0; const a = this.me; mg.send('a_pos', { x: Math.round(a.x), y: Math.round(a.y), fx: +a.fx.toFixed(2), fy: +a.fy.toFixed(2), hp: Math.round(a.hp), tp: Math.round(a.tp), n: a.n, mv: a.mv }); }
        const meOut = this.me.hp <= 0 || this.me.tp >= 100, opOut = G.solo && (this.op.hp <= 0 || this.op.tp >= 100);
        if (meOut) { mg.send('a_dead', {}); this.endRound(opOut ? 'both' : 'me'); }
        else if (opOut) this.endRound('partner');
      }
      if (this.me && this.op && this.phase === 'play') {
        if (this._php !== undefined && this.me.hp < this._php - 0.4) this.float(this.me.x, this.me.y - 38, '−' + Math.round(this._php - this.me.hp) + ' ❤', '#ff6b7a');
        if (this._ohp !== undefined && this.op.hp < this._ohp - 0.4) this.float(this.op.x, this.op.y - 38, '−' + Math.round(this._ohp - this.op.hp) + ' ❤', '#ff6b7a');
        if (this._ohp !== undefined && this.op.hp > this._ohp + 15) this.float(this.op.x, this.op.y - 38, '+' + Math.round(this.op.hp - this._ohp) + ' ❤', '#7dff9a');
        this._php = this.me.hp; this._ohp = this.op.hp;
      }
      this.drawWorld(time);
    }

    drawSea(time) {
      const g = this.sea; g.clear(); const t = this.clock || time / 1000, wy = this.waterY(t);
      g.fillStyle(0x5cc2f2, 0.9).fillRect(0, SEA_H - 4, W, wy - SEA_H + 8);
      for (let x = 0; x < W; x += 8) g.fillStyle(0xffffff, 0.85).fillRect(x, wy + 4 + Math.sin(t * 2 + x * 0.1) * 2, 6, 2);
      const sg = this.surge(t);
      if (sg.warn) { const on = Math.floor(time / 120) % 2; if (on) { g.fillStyle(0xffffff, 0.5).fillRect(0, 148, W, 3);} }
      if (sg.y) g.fillStyle(0x4fb4e8, 0.65).fillRect(0, SEA_H - 4, W, sg.y - SEA_H + 4).fillStyle(0xffffff, 0.85).fillRect(0, sg.y - 2, W, 3);
    }
    drawWorld(time) {
      const g = this.fx; g.clear();
      // piedras y fogatas
      (this.stones || []).forEach(s => { if (s.on) G.beach.stone(g, s.x, s.y, 4); });
      (this.heals || []).forEach(h => { if (h.on) { const b = Math.sin(time / 200) * 1.5; g.fillStyle(0xffffff, 0.35).fillCircle(h.x, h.y - 3 + b, 8); A.heart(g, h.x, h.y - 3 + b, 5, 0xff4d79); } });
      FIRES.forEach(([fx, fy], i) => {
        g.fillStyle(0x000000, 0.15).fillEllipse(fx, fy + 4, 30, 10); g.fillStyle(0x6b4a3a).fillRect(fx - 9, fy, 18, 4).fillStyle(0x4a3228).fillRect(fx - 7, fy - 2, 14, 3);
        const f = 6 + Math.sin(time / 90 + i) * 2; g.fillStyle(0xe63946).fillTriangle(fx - 7, fy, fx + 7, fy, fx, fy - 13 - f).fillStyle(0xff9a3c).fillTriangle(fx - 5, fy, fx + 5, fy, fx, fy - 9 - f * 0.7).fillStyle(0xffe14a).fillTriangle(fx - 3, fy, fx + 3, fy, fx, fy - 5 - f * 0.4);
        g.lineStyle(1, 0xffe14a, 0.25).strokeCircle(fx, fy, 26);
      });
      // proyectiles
      (this.props || []).forEach(p => G.beach.stone(g, p.x, p.y, 3));
      // indicador de la carga: línea punteada hasta donde caería la piedra + barra de fuerza
      if (this.chg && this.me && this.phase === 'play') {
        const a = this.me, r = this.chg.t / CHARGE_T, rg = this.rangeFor(r), L = Math.hypot(a.fx, a.fy) || 1, ux = a.fx / L, uy = a.fy / L;
        for (let d = 14; d < rg; d += 10) g.fillStyle(0xffffff, 0.75).fillRect(a.x + ux * d - 1, a.y - 14 + uy * d - 1, 2, 2);
        const ex = a.x + ux * rg, ey = a.y - 14 + uy * rg; g.lineStyle(1.5, 0xffd24a, 0.95).strokeCircle(ex, ey, 6); g.fillStyle(0xffd24a, 0.35).fillCircle(ex, ey, 6);
        g.fillStyle(OUTL, 0.9).fillRect(a.x - 14, a.y - 47, 28, 5).fillStyle(r < 0.5 ? 0x7dff9a : r < 0.85 ? 0xffd24a : 0xff6b7a).fillRect(a.x - 13, a.y - 46, 26 * r, 3);
      }
      // personajes
      [[this.me, this.sprMe, this.lblMe], [this.op, this.sprOp, this.lblOp]].forEach(([a, sp, lb]) => {
        if (!a || !sp) return; const fr = this.frameFor(a.fx, a.fy, a.t, a.mv);
        sp.setFrame(fr.key).setFlipX(fr.flip).setPosition(a.x, a.y).setDepth(10 + a.y / 100);
        const c = Math.min(1, a.tp / 100), ic = Math.round(255 - c * 120); sp.setTint(a.flash > 0 ? 0xff9a9a : (ic << 16) | (Math.round(255 - c * 40) << 8) | 255);
        lb.setPosition(a.x, a.y - 36);
        if (a.sw > 0) { g.lineStyle(2, 0xffffff, 0.9).beginPath(); g.arc(a.x + a.fx * 12, a.y - 12 + a.fy * 8, 9, -1.2, 1.2); g.strokePath(); }
        if (a.tp > 70) { g.fillStyle(0xdff6ff, 0.8).fillRect(a.x - 8, a.y - 28, 2, 2).fillRect(a.x + 6, a.y - 22, 2, 2); }
      });
      // HUD propio (vida / temperatura / piedras / rondas)
      const h = this.hud; h.clear(); this.hudT.forEach(t => t.destroy()); this.hudT = [];
      if (this.me && this.phase !== 'lobby' && this.phase !== 'over') {
        const bar = (x, a, label, right) => {
          h.fillStyle(OUTL, 0.9).fillRoundedRect(x - 2, 47, 184, 24, 3);
          h.fillStyle(0x5a1a24).fillRect(x, 49, 180, 7).fillStyle(0xe63946).fillRect(x, 49, 180 * Math.max(0, a.hp) / 100, 7);
          h.fillStyle(0x1a3a5a).fillRect(x, 59, 180, 7).fillStyle(a.tp > 70 ? 0xdff6ff : 0x4fb8ff).fillRect(x, 59, 180 * a.tp / 100, 7);
          this.hudT.push(this.add.text(x + 2, 47, '❤ VIDA ' + Math.round(a.hp) + ' / 100' + (a.warm > 0 ? '  🔥+' : ''), { fontFamily: 'VT323', fontSize: '9px', color: '#fff' }).setDepth(4001), this.add.text(x + 2, 57, '❄ FRÍO ' + Math.round(a.tp) + '%  (100% = pierdes)   🪨 x' + a.n, { fontFamily: 'VT323', fontSize: '9px', color: '#fff' }).setDepth(4001));
        };
        bar(8, this.me); bar(210, this.op);
        if (this.clock < 14 || this.me.hp < 35 || this.me.tp > 70) this.hudT.push(this.add.text(8, 203, 'Pierdes si ❤ = 0 o ❄ = 100%  ·  ❤ sube con 🔥 y 💗  ·  ❄ baja moviéndote', { fontFamily: 'VT323', fontSize: '10px', color: '#2b1b30', backgroundColor: '#fff3d6', padding: { x: 3, y: 0 } }).setOrigin(0, 1).setDepth(4001));
        this.hudT.push(this.add.text(200, 74, 'Rondas ' + this.rw.me + ' – ' + this.rw.partner, { fontFamily: 'VT323', fontSize: '12px', color: '#2b1b30', backgroundColor: '#fff3d6', padding: { x: 4, y: 0 } }).setOrigin(0.5, 0).setDepth(4001));
      }
    }
  }
  G.CallaoScene = CallaoScene;
})();
