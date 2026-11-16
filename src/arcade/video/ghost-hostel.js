/**
 * Ghost Hostel: one night in a haunted hostel. Everyone has a room with a bed and a door. Lying in
 * bed earns coins; coins buy a better bed (more coins), a stronger door, fans that blow the ghost
 * away, and quick door repairs. The ghost wakes after a few seconds, picks the weakest door and
 * bangs on it. Hurt it enough and it floats back to its corner to recover, a little stronger every
 * time. A broken door means that player is caught and out. Hold on till sunrise and you win; blow
 * the ghost away for good and you win early. Up to 4 rooms; bots take the rooms nobody sits in.
 *
 * Screen pixels: the rooms are a row along the top, the corridor runs underneath.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261116-1137';

export const NIGHT = 60 * 150;          // two and a half minutes until sunrise
export const WAKE = 60 * 15;            // the ghost sleeps for the first fifteen seconds
export const RAGE = NIGHT - 60 * 40;
export const CORRIDOR_Y = 300;
export const ALTAR = { x: W / 2, y: 370 };
export const BED = { income: [2, 4, 7, 12, 18, 26], cost: [15, 40, 100, 220, 450] };
export const DOOR = { hp: [120, 230, 420, 720, 1150, 1750], cost: [20, 55, 130, 280, 560] };
export const FAN = { dps: [0, 7, 15, 26, 42, 64, 92], cost: [25, 60, 140, 300, 600, 1100] };
export const ITEMS = ['bed', 'door', 'fan', 'fix'];
export const ITEM_ICON = { bed: '🛏️', door: '🚪', fan: '🌀', fix: '🔧' };
export const ITEM_NAME = { bed: '🛏️ Bed', door: '🚪 Door', fan: '🌀 Fan', fix: '🔧 Fix' };
const r1 = (v) => Math.round(v * 10) / 10;
export const roomX = (s, i) => (W / s.rooms) * (i + 0.5);
export const ghostHp = (lv) => Math.round(280 * Math.pow(1.6, lv - 1));
const ghostDps = (lv) => 6 * Math.pow(1.55, lv - 1);
const fixCost = (p) => 8 + p.door * 6;

/** What the next purchase of an item costs, or null if it is maxed out or not possible now. */
export function costOf(p, item) {
  if (item === 'bed') return BED.cost[p.bed] ?? null;
  if (item === 'door') return DOOR.cost[p.door] ?? null;
  if (item === 'fan') return FAN.cost[p.fan] ?? null;
  if (item === 'fix') return p.hp < DOOR.hp[p.door] && p.fixWait <= 0 ? fixCost(p) : null;
  return null;
}
function buy(s, p, i) {
  const item = ITEMS[p.pick], c = costOf(p, item);
  if (c == null || p.coins < c) { s.ev.push({ k: 'nope', seat: i }); return; }
  p.coins -= c;
  if (item === 'bed') p.bed += 1;
  else if (item === 'door') { const before = DOOR.hp[p.door]; p.door += 1; p.hp += DOOR.hp[p.door] - before; }
  else if (item === 'fan') p.fan += 1;
  else { p.hp = Math.min(DOOR.hp[p.door], p.hp + DOOR.hp[p.door] * 0.4); p.fixWait = 60 * 4; }
  p.hp = r1(p.hp);
  s.ev.push({ k: 'buy', seat: i, item });
}
/** The ghost goes for the door it can break soonest; a little randomness keeps it from being too sure. */
function pickTarget(s) {
  const open = s.players.map((p, i) => [p, i]).filter(([p]) => p.alive);
  if (!open.length) return -1;
  let bestI = open[0][1], bestV = Infinity;
  open.forEach(([p, i]) => {
    const v = p.hp + p.fan * 60 + rnd(s) * 120;
    if (v < bestV) { bestV = v; bestI = i; }
  });
  return bestI;
}

export default {
  hint: 'Swipe to choose, tap Buy',
  pad: [['l', '◀'], ['r', '▶'], ['a', '🛠️ Buy']],
  init({ n, seed }) {
    const rooms = Math.max(n, 1);
    const s = { n, rooms, seed, t: 0, ev: [], done: null,
      ghost: { x: ALTAR.x, y: ALTAR.y, lv: 1, hp: ghostHp(1), max: ghostHp(1), mode: 'sleep', target: -1, levelAt: WAKE + 60 * 30, hitFlash: 0 },
      players: seats(n).map(() => ({ alive: true, coins: 20, earned: 0, bed: 0, door: 0, hp: DOOR.hp[0], fan: 0, pick: 0, fixWait: 0, was: {}, bang: 0 })) };
    return s;
  },
  step(s, inputs) {
    if (s.done) return;
    s.t += 1;
    const gh = s.ghost;
    s.players.forEach((p, i) => {
      if (!p.alive) return;
      const inp = inputs[i] || {};
      ['l', 'r', 'a'].forEach((k) => {
        if (inp[k] && !p.was[k]) {
          if (k === 'l') p.pick = (p.pick + ITEMS.length - 1) % ITEMS.length;
          if (k === 'r') p.pick = (p.pick + 1) % ITEMS.length;
          if (k === 'a') buy(s, p, i);
        }
        p.was[k] = !!inp[k];
      });
      if (Number.isInteger(inp.pick) && inp.pick >= 0 && inp.pick < ITEMS.length) p.pick = inp.pick;
      // the bed pays every second
      if (s.t % 60 === 0) { const c = BED.income[p.bed]; p.coins += c; p.earned += c; }
      if (p.fixWait > 0) p.fixWait -= 1;
      if (p.bang > 0) p.bang -= 1;
    });
    // the ghost
    if (gh.hitFlash > 0) gh.hitFlash -= 1;
    if (s.t >= gh.levelAt) {
      gh.lv += 1; gh.levelAt = s.t + 60 * 30;
      const k = gh.hp / gh.max; gh.max = ghostHp(gh.lv); gh.hp = r1(gh.max * k);
      s.ev.push({ k: 'round', seat: -1, level: gh.lv });
    }
    if (s.t === RAGE) s.ev.push({ k: 'rage', seat: -1 });
    if (gh.mode === 'sleep' && s.t >= WAKE) { gh.mode = 'walk'; gh.target = pickTarget(s); s.ev.push({ k: 'wake', seat: -1 }); }
    const toward = (x, y, speed) => { const dx = x - gh.x, dy = y - gh.y, d = Math.hypot(dx, dy); if (d < speed * TICK) { gh.x = x; gh.y = y; return true; } gh.x = r1(gh.x + (dx / d) * speed * TICK); gh.y = r1(gh.y + (dy / d) * speed * TICK); return false; };
    if (gh.mode === 'walk') {
      if (gh.target < 0 || !s.players[gh.target].alive) gh.target = pickTarget(s);
      if (gh.target >= 0 && toward(roomX(s, gh.target), CORRIDOR_Y - 40, 110)) gh.mode = 'attack';
    } else if (gh.mode === 'attack') {
      const p = s.players[gh.target];
      if (!p || !p.alive) { gh.mode = 'walk'; gh.target = pickTarget(s); }
      else {
        p.hp = r1(p.hp - ghostDps(gh.lv) * (s.t > RAGE ? 1.5 : 1) * TICK);   // the last stretch before sunrise: it gets angry
        if (s.t % 30 === 0) { p.bang = 12; s.ev.push({ k: 'bang', seat: gh.target }); }
        if (p.fan > 0) { gh.hp = r1(gh.hp - FAN.dps[p.fan] * TICK); gh.hitFlash = 4; }
        if (p.hp <= 0) {
          p.hp = 0; p.alive = false;
          s.ev.push({ k: 'crash', seat: gh.target });
          gh.target = pickTarget(s); gh.mode = 'walk';
        } else if (gh.hp <= gh.max * 0.25) { gh.mode = 'retreat'; s.ev.push({ k: 'star', seat: gh.target }); }
      }
    } else if (gh.mode === 'retreat') {
      if (gh.hp <= 0) { gh.mode = 'gone'; s.ev.push({ k: 'banish', seat: -1 }); }
      else if (toward(ALTAR.x, ALTAR.y, 150)) gh.mode = 'heal';
    } else if (gh.mode === 'heal') {
      gh.hp = r1(Math.min(gh.max, gh.hp + gh.max * 0.16 * TICK));
      if (gh.hp >= gh.max) { gh.mode = 'walk'; gh.target = pickTarget(s); }
    }
    if (gh.mode !== 'gone' && gh.hp <= 0) { gh.mode = 'gone'; s.ev.push({ k: 'banish', seat: -1 }); }
    if (gh.mode === 'gone' || s.t >= NIGHT) s.done = gh.mode === 'gone' ? 'banished' : 'sunrise';
    else if (!s.players.some(p => p.alive)) s.done = 'caught';
  },
  over(s) {
    if (!s.done) return null;
    const scores = s.players.map(p => p.earned + (p.alive ? 100 + (s.done === 'banished' ? 150 : 0) : 0));
    const winners = s.done === 'caught' ? [] : seats(s.n).filter(i => s.players[i].alive);
    return { scores, winners, note: s.done === 'banished' ? 'The ghost was blown away for good!' : s.done === 'sunrise' ? 'Sunrise! The ghost is gone.' : 'The ghost caught everyone.' };
  },
  /** Repairs when the door is in trouble, then grows the bed early and the door and fans later. */
  bot(s, seat) {
    const p = s.players[seat];
    if (!p?.alive || (s.t + seat * 11) % (16 + ((s.seed + seat) % 4) * 6)) return {};   // some bots are quicker shoppers than others
    const want = (() => {
      const max = DOOR.hp[p.door], under = s.ghost.mode === 'attack' && s.ghost.target === seat;
      if (under && p.fan === 0) return 'fan';
      if (under && p.hp < max * 0.7 && DOOR.cost[p.door] != null && p.coins >= DOOR.cost[p.door]) return 'door';
      if (p.hp < max * 0.45 && costOf(p, 'fix') != null) return 'fix';
      if (p.bed < 2 || (p.bed < 4 && s.t < NIGHT * 0.45 && p.bed <= p.door)) return 'bed';
      if (p.door <= p.fan) return 'door';
      return p.fan < FAN.cost.length ? 'fan' : 'door';
    })();
    const c = costOf(p, want);
    if (c == null || p.coins < c) return {};
    const idx = ITEMS.indexOf(want);
    return { pick: idx, a: p.pick === idx };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.alive ? `💰${p.coins}` : `💰${p.coins} ✕`, SEAT_COLORS[i]]));
    const left = Math.max(0, NIGHT - s.t), mm = Math.floor(left / 3600), ss = Math.floor((left % 3600) / 60);
    g.textAlign = 'center'; g.font = '800 15px system-ui, sans-serif'; g.fillStyle = '#ffe9a8';
    g.fillText(`🌙 ${mm}:${String(ss).padStart(2, '0')} to sunrise · 👻 Lv ${s.ghost.lv}${s.t > RAGE ? " 😡" : ""}`, W / 2, 62);
    const gh = s.ghost;
    if (gh.mode !== 'sleep' && gh.mode !== 'gone') { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 80, 70, 160, 6); g.fillStyle = '#b48cff'; g.fillRect(W / 2 - 80, 70, 160 * (gh.hp / gh.max), 6); }
    s.players.forEach((p, i) => {
      const w = W / s.rooms, x0 = i * w;
      // the ghost is coming for this room: say so over it, big, so nobody misses it
      if (p.alive && gh.target === i && (gh.mode === 'attack' || gh.mode === 'walk')) {
        const hot = gh.mode === 'attack';
        g.fillStyle = hot ? (Math.floor(s.t / 10) % 2 ? 'rgba(200,20,40,.85)' : 'rgba(120,10,30,.85)') : 'rgba(80,20,60,.75)';
        g.fillRect(x0 + 10, 84, w - 20, 26);
        g.fillStyle = '#fff'; g.font = '900 16px system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(hot ? '👻 ATTACK! Buy 🌀 or 🔧' : '👻 coming!', x0 + w / 2, 102);
      }
      // the door's health under each room
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x0 + 12, H - 46, w - 24, 6);
      g.fillStyle = p.hp / DOOR.hp[p.door] > 0.4 ? '#7dff9a' : '#ff6b5b'; g.fillRect(x0 + 12, H - 46, (w - 24) * (p.hp / DOOR.hp[p.door]), 6);
      if (!p.alive) return;
      // the shop, big enough to read on a phone: the picked item, its level and its price
      const item = ITEMS[p.pick], c = costOf(p, item);
      const lv = { bed: p.bed + 1, door: p.door + 1, fan: p.fan, fix: '' }[item];
      g.fillStyle = 'rgba(10,8,30,.8)'; g.fillRect(x0 + 6, H - 38, w - 12, 34);
      g.textAlign = 'center'; g.font = '800 21px system-ui, sans-serif';
      g.fillStyle = c == null ? '#9a9a9a' : p.coins >= c ? '#ffd23f' : '#ff9a8a';
      g.fillText(`${ITEM_ICON[item]}${lv !== '' ? lv : ''} ${c == null ? (item === 'fix' ? '⏳' : 'MAX') : c}`, x0 + w / 2, H - 14);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '800 18px system-ui, sans-serif';
      g.fillText('◀', x0 + 18, H - 15); g.fillText('▶', x0 + w - 18, H - 15);
    });
  },
  // the hostel at night: lit rooms with a bed, fans and a door each; the corridor; the ghost drifting about
  draw(g, s, names) {
    const TAU = Math.PI * 2;
    const dawn = Math.max(0, (s.t - NIGHT * 0.8) / (NIGHT * 0.2));   // the sky warms as sunrise nears
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${20 + dawn * 60}, ${16 + dawn * 30}, ${41 + dawn * 20})`); sky.addColorStop(1, '#0b0818');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // the corridor floor: checked tiles in candlelight
    for (let y = CORRIDOR_Y - 14; y < H; y += 18) for (let x = 0; x < W; x += 18) {
      g.fillStyle = ((x + y) / 18) % 2 ? '#211a3b' : '#2a2247'; g.fillRect(x, y, 18, 18);
    }
    const lamp = g.createRadialGradient(ALTAR.x, ALTAR.y, 4, ALTAR.x, ALTAR.y, 90);
    lamp.addColorStop(0, 'rgba(255,190,90,.35)'); lamp.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = lamp; g.fillRect(ALTAR.x - 90, ALTAR.y - 90, 180, 180);
    // the ghost's corner: a little shrine with candles
    g.fillStyle = '#3b2c22'; g.fillRect(ALTAR.x - 26, ALTAR.y - 4, 52, 10);
    [-16, 0, 16].forEach((dx, k) => {
      g.fillStyle = '#f2ead8'; g.fillRect(ALTAR.x + dx - 2, ALTAR.y - 14, 4, 10);
      g.fillStyle = '#ffcf5a'; g.beginPath(); g.ellipse(ALTAR.x + dx, ALTAR.y - 17 + Math.sin(s.t / 5 + k) * 0.8, 2, 3.5, 0, 0, TAU); g.fill();
    });
    s.players.forEach((p, i) => {
      const w = W / s.rooms, x0 = i * w, cx = x0 + w / 2, top = 84, bottom = CORRIDOR_Y - 16;
      const shake = p.bang > 0 ? Math.sin(p.bang * 2.3) * 2.5 : 0;
      // the room: warm lamplight while you hold out, cold and red once the ghost got in
      const wall = g.createLinearGradient(0, top, 0, bottom);
      wall.addColorStop(0, p.alive ? '#4a3d78' : '#3a1226'); wall.addColorStop(1, p.alive ? '#2e2652' : '#220a17');
      g.fillStyle = wall; g.fillRect(x0 + 6, top, w - 12, bottom - top);
      if (p.alive) {
        const glow = g.createRadialGradient(cx, top + 24, 4, cx, top + 24, w * 0.7);
        glow.addColorStop(0, 'rgba(255,214,140,.35)'); glow.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = glow; g.fillRect(x0 + 6, top, w - 12, bottom - top);
        g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(cx, top + 10, 4, 0, TAU); g.fill();
      }
      // a window with the moon (or the sunrise) outside
      g.fillStyle = dawn > 0.3 ? '#f6a75a' : '#16224a'; g.fillRect(x0 + 16, top + 22, 26, 22);
      g.strokeStyle = '#6b4d33'; g.lineWidth = 2; g.strokeRect(x0 + 16, top + 22, 26, 22);
      g.beginPath(); g.moveTo(x0 + 29, top + 22); g.lineTo(x0 + 29, top + 44); g.stroke();
      // the bed: a better bed is wider, with a thicker blanket and a gold frame at the top levels
      const bw = Math.min(w - 40, 52 + p.bed * 5), by = top + 74;
      g.fillStyle = p.bed >= 3 ? '#c9a14a' : '#7b5a3a'; g.fillRect(cx - bw / 2 - 3, by - 14, 5, 34); g.fillRect(cx + bw / 2 - 2, by - 6, 5, 26);
      g.fillStyle = '#f1ece2'; g.fillRect(cx - bw / 2, by, bw, 14);
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(cx - bw / 2 + 16, by - 3, bw - 16, 12 + Math.min(4, p.bed));
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx - bw / 2 + 9, by + 1, 8, 5, 0, 0, TAU); g.fill();
      if (p.alive) { g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 11px system-ui'; g.textAlign = 'left'; g.fillText('z', cx - bw / 2 + 4, by - 10 - (s.t / 10) % 8); }
      // the fans on the ceiling, one more for every level, turning
      for (let k = 0; k < Math.min(3, p.fan); k++) {
        const fx = x0 + w - 24 - k * 20, fy = top + 18;
        g.save(); g.translate(fx, fy); g.rotate(s.t * 0.4 + k);
        g.fillStyle = '#9fb3c8';
        for (let b = 0; b < 3; b++) { g.rotate(TAU / 3); g.beginPath(); g.ellipse(6, 0, 6, 2, 0, 0, TAU); g.fill(); }
        g.restore();
      }
      if (p.fan > 3) { g.fillStyle = '#9fb3c8'; g.font = '700 10px system-ui'; g.textAlign = 'center'; g.fillText(`×${p.fan}`, x0 + w - 24, top + 36); }
      // the door into the corridor: a stronger door is darker wood with iron bands; cracks as it takes damage
      const dw = 40, dh = 30, dx = cx - dw / 2 + shake, dy = bottom - dh + 6;
      g.fillStyle = '#2a1c12'; g.fillRect(dx - 3, dy - 3, dw + 6, dh + 3);
      g.fillStyle = ['#a77b4f', '#8f643d', '#7a5231', '#674327', '#55361f', '#44291a'][p.door] || '#44291a'; g.fillRect(dx, dy, dw, dh);
      if (p.door >= 2) { g.fillStyle = '#9aa3ad'; g.fillRect(dx, dy + 6, dw, 3); g.fillRect(dx, dy + dh - 9, dw, 3); }
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(dx + dw - 7, dy + dh / 2, 2, 0, TAU); g.fill();
      const dmg = 1 - p.hp / DOOR.hp[p.door];
      if (dmg > 0.25) {
        g.strokeStyle = 'rgba(15,5,0,.85)'; g.lineWidth = 1.5;
        for (let k = 0; k < Math.ceil(dmg * 5); k++) {
          const sx = dx + 6 + ((k * 13) % (dw - 12)), sy = dy + 4 + ((k * 7) % 10);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 4, sy + 6); g.lineTo(sx - 1, sy + 11); g.lineTo(sx + 3, sy + 18); g.stroke();
        }
      }
      if (!p.alive) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0 + 6, top, w - 12, bottom - top); g.font = '900 28px system-ui'; g.textAlign = 'center'; g.fillStyle = '#ff6b8a'; g.fillText('😱', cx, by - 18); }
    });
    // the ghost: a sheet with a wavy hem, glowing, see-through while it sleeps
    const gh = s.ghost;
    if (gh.mode !== 'gone') {
      const fl = Math.sin(s.t / 12) * 4, gx = gh.x, gy = gh.y + fl;
      const size = 16 + Math.min(10, gh.lv * 2);
      g.save();
      g.globalAlpha = gh.mode === 'sleep' ? 0.55 : gh.mode === 'heal' ? 0.75 : 1;
      g.shadowColor = gh.hitFlash > 0 ? '#ffffff' : '#b48cff'; g.shadowBlur = gh.mode === 'attack' ? 24 : 14;
      g.fillStyle = gh.hitFlash > 0 ? '#e8ddff' : '#f6f2ff';
      g.beginPath();
      g.arc(gx, gy - size * 0.3, size, Math.PI, 0);
      g.lineTo(gx + size, gy + size * 0.9);
      for (let k = 0; k <= 4; k++) { const x = gx + size - (k * size * 2) / 4; g.quadraticCurveTo(x - size / 4, gy + size * (k % 2 ? 0.6 : 1.15), x - size / 2, gy + size * 0.9); }
      g.closePath(); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = '#251a3f';
      const eye = gh.mode === 'attack' ? 4 : gh.mode === 'sleep' ? 1.2 : 3;
      g.beginPath(); g.ellipse(gx - size * 0.35, gy - size * 0.35, 3, eye, 0, 0, TAU); g.ellipse(gx + size * 0.35, gy - size * 0.35, 3, eye, 0, 0, TAU); g.fill();
      if (gh.mode === 'attack') { g.beginPath(); g.ellipse(gx, gy + size * 0.1, 5, 6, 0, 0, TAU); g.fill(); }
      g.restore();
      if (gh.mode === 'sleep') { g.fillStyle = '#d9ccff'; g.font = '800 14px system-ui'; g.textAlign = 'center'; g.fillText('z z', gx + size, gy - size - (s.t / 8) % 10); }
    }
    this.hud(g, s, names);
  },
};
