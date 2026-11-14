/**
 * Unblock Puzzle: a 6 × 6 parking lot, an auto-rickshaw stuck in it, and the gate on the right. Cars
 * and trucks slide only forwards and backwards. Slide them out of the way and drive the rickshaw out.
 * Five lots a game, from easy to hard; every lot was solved by a computer, so each one can be done, and
 * the fewest moves it takes is known (par).
 *
 * Each player gets the same lots on their own board. Drag a vehicle with a finger or the mouse, or use
 * the arrows to pick one, the button to hold it and the arrows to slide it.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1217';

export const N = 6, EXIT_ROW = 2;
/** Lots as 36 cells row by row: '.' empty, 'A' the rickshaw, other letters a vehicle each; then the par. */
export const LOTS = {
  easy: ['IIJJJ.HHHGDD.AAG..B..FF.B.EE..B...CC:4', 'IM..EEIM.GGGIJAAHCDJFFHCD..B.LDKKB.L:5', '..EE.....CCB...AAB.....BF..GGGFHHHDD:6', 'CK.BBBCK..II...AAFHEGG.FHELLDDJJMM..:4', 'J.....JFFCCC..AAHDGGLLHD.IIBB.KKEE..:5', '.EE.FFJJ.IIIG..AADG....D..HHCC..BB..:4', '...DFFCCCDBB..AA.G.EEE.G.....H.....H:7', 'G..FFFGD..HHGD.AAE.D...E..IIKKJJCCBB:4', 'G.HH..GFFLEE.AAL.JDDDKKJ...CCCBB.II.:5', '...IHHKK.IBC.JAABC.J..LEF...LEFDDGGG:7', 'BH.LL.BH.GGEBHAAIEM.FFI.MCCCDD.KKJJ.:5', 'GGJJDDB.CCCEB..AAEB..FFF...III....HH:4'],
  medium: ['..EHH...EGD.AAEGD.FFIIC..BB.C..JJ...:9', '..DD..FGG...FIAAJC.I..JC.E...C.EHHBB:8', '..DD..........AAE..BBHE.CF.HE.CFIIGG:10', 'H.GIEEH.GIBKCAAJBKCL.JD.CL..DF.L...F:10', 'HM...JHM.E.JAAFEKC.BF.KCLBFG.CLIIGDD:9', '.......EE.C.FAADC.F..DC.F.BGG.HHB...:10', 'KFFF..K.IICH..AACH.EEECH.DDJGG...JBB:12', 'JEMIICJEM..CAADHGCBBDHG...DL...KKLFF:10', '.HHCCCFF.JK.IAAJK.IDDBBLE.G..LE.G...:9', '.LLHH...ICCCAAIB.E.F.BDE.FGGD..JJKKK:10', 'BBB.GGLLHHIJCMAAIJCMFFIJ.DDK.....KEE:11', 'BBBL.....LIIHAALCJHFEECJHF..GK.DD.GK:12'],
  hard: ['.CCC..GG..BDAA..BDJJEEBDMHHLKKMIILFF:18', 'CC.DKK...DGGFAAD..FE.HHJIE...JIE..BB:14', '.HHHI..FFFI..AA.I..EB.GG.EBCCJ..DDDJ:18', '..CCC....D...AAD.B...D.BIEHFFBIEHGGG:17', 'IKKFF.IBB.HD.AA.HD.EEEH..CJ....CJGG.:15', '.CCCFE.L..FE.LAAFHBBGJ.HI.GJDDIKKJ..:18', '.CCC...IILDJ.AALDJ.FFLHK.GB.HK.GBEEE:17', 'KGGCC.K.FF..AAB..D..BJJDHHLLEDII..E.:14'],
};
export const PLAN = ['easy', 'easy', 'medium', 'medium', 'hard'];
const LOT_TIME = 60 * 120;                // two minutes a lot
const RESULT = 150;
const DRIVE = 40;                          // the rickshaw drives out through the gate
const VEHICLE_COLORS = ['#3d7be0', '#d9473a', '#2f9e5a', '#8e5bd6', '#e08a2b', '#2aa7a7', '#c94f8f', '#6d7a8c', '#b8a234', '#4f63c9', '#a2552e', '#3aa0d8', '#7c9a2f'];

/** A lot from its string: the vehicles, each with its row or column (fix), direction and length. */
export function parse(code) {
  const [cells, par] = code.split(':');
  const by = new Map();
  [...cells].forEach((ch, i) => { if (ch !== '.') { if (!by.has(ch)) by.set(ch, []); by.get(ch).push(i); } });
  const vehicles = [...by.entries()].sort((a, b) => (a[0] === 'A' ? -1 : b[0] === 'A' ? 1 : a[0] < b[0] ? -1 : 1)).map(([, list]) => {
    const h = Math.floor(list[0] / N) === Math.floor(list[1] / N);
    return { h, len: list.length, fix: h ? Math.floor(list[0] / N) : list[0] % N, start: h ? list[0] % N : Math.floor(list[0] / N) };
  });
  return { vehicles: vehicles.map(({ start, ...v }) => v), pos: vehicles.map(v => v.start), par: Number(par) };
}
const cellOf = (v, p, k) => (v.h ? v.fix * N + p + k : (p + k) * N + v.fix);
export function grid(vs, pos) {
  const g = new Array(N * N).fill(-1);
  vs.forEach((v, i) => { for (let k = 0; k < v.len; k++) g[cellOf(v, pos[i], k)] = i; });
  return g;
}
/** How far vehicle i can really go towards a wanted position: up to the first thing in the way. */
export function slideTo(vs, pos, i, want) {
  const v = vs[i], g = grid(vs, pos);
  want = Math.max(0, Math.min(N - v.len, want));
  let p = pos[i];
  const step = Math.sign(want - p);
  while (p !== want) {
    const next = p + step, cell = step > 0 ? cellOf(v, next, v.len - 1) : cellOf(v, next, 0);
    if (g[cell] >= 0 && g[cell] !== i) break;
    p = next;
  }
  return p;
}
export const solved = (b) => b.pos[0] === N - 2;
export const pointsFor = (moves, par) => 50 + Math.max(0, 50 - 5 * Math.max(0, moves - par));

function newLot(s) {
  const kind = PLAN[s.lot - 1], list = LOTS[kind];
  let code = list[Math.floor(rnd(s) * list.length)], tries = 0;
  while (s.used.includes(code) && tries++ < 20) code = list[Math.floor(rnd(s) * list.length)];
  s.used.push(code);
  const { vehicles, pos, par } = parse(code);
  Object.assign(s, { vehicles, par, phase: 'play', phaseT: s.t });
  s.players.forEach((p) => { Object.assign(p, { pos: pos.slice(), moves: 0, done: null, cur: 0, hold: false, prev: {} }); });
}
/** Where boards are drawn: one big board, or two side by side when two people play on this screen. */
export function boardBox(index, count) {
  const cell = count > 1 ? 40 : 50;
  return { x: count > 1 ? 18 + index * (cell * N + 28) : 30, y: 66, cell };
}
function move(s, p, i, to) {
  if (to === p.pos[i]) return;
  p.pos[i] = to; p.moves += 1;
  if (solved(p)) { p.done = { t: s.t - s.phaseT, moves: p.moves }; s.ev.push({ k: 'star', seat: s.players.indexOf(p), combo: p.moves <= s.par ? 3 : 1 }); }
}

export default {
  hint: 'Drag a vehicle to slide it, or pick one with the arrows and hold it with the button',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶'], ['a', '✊ Hold']],
  drag: true,
  init({ n, seed }) {
    const s = { n, seed, t: 0, lot: 1, vehicles: [], par: 0, phase: 'play', phaseT: 0, used: [], ev: [],
      players: seats(n).map(() => ({ score: 0, solved: 0, pos: [], moves: 0, done: null, cur: 0, hold: false, prev: {} })) };
    newLot(s);
    return s;
  },
  /** Which board a point on the picture is on, when this screen shows more than one. */
  dragSeat(s, x, y, mine) {
    const here = mine.slice(0, 2);
    const k = here.findIndex((seat, i) => { const b = boardBox(i, here.length); return x >= b.x && x < b.x + b.cell * N && y >= b.y && y < b.y + b.cell * N; });
    return here[Math.max(0, k)];
  },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'play') {
      s.players.forEach((p, i) => {
        const inp = inputs[i] || {};
        if (p.done) { p.prev = inp; return; }
        // a drag: from a vehicle to where it should go, in the picture's units, on a screen showing n boards
        if (inp.drag) {
          const here = inp.drag, count = here.n === 2 ? 2 : 1, boards = [0, 1].slice(0, count).map(k => boardBox(k, count));
          const b = boards.find(bb => here.x0 >= bb.x && here.x0 < bb.x + bb.cell * N && here.y0 >= bb.y && here.y0 < bb.y + bb.cell * N);
          if (b) {
            const c = Math.floor((here.x0 - b.x) / b.cell), r = Math.floor((here.y0 - b.y) / b.cell);
            const who = grid(s.vehicles, p.pos)[r * N + c];
            if (who >= 0) {
              const v = s.vehicles[who], by = Math.round(((v.h ? here.x1 - here.x0 : here.y1 - here.y0)) / b.cell);
              p.cur = who; p.hold = false;
              move(s, p, who, slideTo(s.vehicles, p.pos, who, p.pos[who] + by));
            }
          }
        }
        // the pad: arrows pick a vehicle (or slide the one held), the button holds and lets go
        const press = (k) => inp[k] && !p.prev[k];
        if (press('a')) p.hold = !p.hold;
        const dir = press('l') ? [0, -1] : press('r') ? [0, 1] : press('u') ? [-1, 0] : press('d') ? [1, 0] : null;
        if (dir && !p.done) {
          const v = s.vehicles[p.cur];
          if (p.hold && (v.h ? dir[0] === 0 : dir[1] === 0)) move(s, p, p.cur, slideTo(s.vehicles, p.pos, p.cur, p.pos[p.cur] + (v.h ? dir[1] : dir[0])));
          else if (!p.hold) {
            // the nearest vehicle that way from the picked one
            const g = grid(s.vehicles, p.pos), from = g.indexOf(p.cur);
            let r = Math.floor(from / N), c = from % N;
            for (let k = 0; k < N; k++) {
              r += dir[0]; c += dir[1];
              if (r < 0 || r >= N || c < 0 || c >= N) break;
              const w = g[r * N + c];
              if (w >= 0 && w !== p.cur) { p.cur = w; break; }
            }
          }
        }
        p.prev = { a: inp.a, u: inp.u, d: inp.d, l: inp.l, r: inp.r };
      });
      if (s.players.every(p => p.done) || since >= LOT_TIME) {
        const order = s.players.map((p, i) => (p.done ? [p.done.t, i] : null)).filter(Boolean).sort((a, b) => a[0] - b[0]);
        s.players.forEach((p) => { if (p.done) { p.done.pts = pointsFor(p.done.moves, s.par); p.score += p.done.pts; p.solved += 1; } });
        // with friends, the first one out gets twenty more
        if (s.n > 1 && order.length) { const first = s.players[order[0][1]]; first.score += 20; first.done.first = true; }
        s.phase = 'result'; s.phaseT = s.t;
      }
      return;
    }
    if (s.phase === 'result' && since >= RESULT) {
      if (s.lot >= PLAN.length) { s.phase = 'done'; return; }
      s.lot += 1;
      newLot(s);
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: top > 0 ? seats(s.n).filter(i => scores[i] === top) : [] };
  },
  // a computer player: knows the way out, and makes a move every second or two, with a wrong turn now and then
  bot(s, seat) {
    const p = s.players[seat];
    if (s.phase !== 'play' || p.done) return {};
    const v = (k) => { const x = Math.sin((s.lot * 29 + seat * 11 + k + p.moves * 7 + s.par) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const every = 80 + Math.floor(v(1) * 100);
    if ((s.t - s.phaseT) % every !== every - 1) return {};
    const step = v(2) < 0.18 ? randomMove(s, p, v(3)) : bestMove(s.vehicles, p.pos);
    if (!step) return {};
    const b = boardBox(0, 1), veh = s.vehicles[step[0]], cell = cellOf(veh, p.pos[step[0]], 0);
    const x0 = b.x + (cell % N + 0.5) * b.cell, y0 = b.y + (Math.floor(cell / N) + 0.5) * b.cell, d = (step[1] - p.pos[step[0]]) * b.cell;
    return { drag: { x0, y0, x1: x0 + (veh.h ? d : 0), y1: y0 + (veh.h ? 0 : d) } };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names, mine = [0]) {
    g.fillStyle = '#20262c'; g.fillRect(0, 0, W, H);
    const here = (mine.length ? mine : [0]).filter(i => s.players[i]).slice(0, 2);
    here.forEach((seat, k) => drawBoard(g, s, s.players[seat], boardBox(k, here.length), seat, here.length > 1 ? names[seat] : null));
    // the side: the lot, par, moves, and how everyone is doing
    const cx = here.length > 1 ? W - 64 : 480;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9fb0c0'; g.font = '800 14px system-ui, sans-serif';
    g.fillText(`LOT ${Math.min(s.lot, PLAN.length)} / ${PLAN.length} · ${PLAN[s.lot - 1] || ''}`.toUpperCase(), cx, 78);
    g.fillStyle = '#fff'; g.font = '900 18px system-ui, sans-serif';
    g.fillText(`Best: ${s.par} moves`, cx, 104);
    if (here.length === 1) {
      const me = s.players[here[0]];
      g.fillStyle = '#ffd23f'; g.font = '900 30px system-ui, sans-serif'; g.fillText(`${me.moves}`, cx, 144);
      g.fillStyle = '#9fb0c0'; g.font = '700 13px system-ui, sans-serif'; g.fillText('your moves', cx, 168);
    }
    if (s.phase === 'play') {
      const left = Math.max(0, Math.ceil((LOT_TIME - (s.t - s.phaseT)) * TICK));
      g.fillStyle = '#9fb0c0'; g.font = '700 13px system-ui, sans-serif'; g.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left`, cx, 190);
    }
    s.players.forEach((p, i) => {
      const y = 222 + i * 34;
      g.fillStyle = SEAT_COLORS[i]; g.font = '800 14px system-ui, sans-serif'; g.fillText(names[i] || `P${i + 1}`, cx, y);
      g.font = '700 12px system-ui, sans-serif';
      if (s.phase === 'done') { g.fillStyle = '#fff'; g.fillText(`${p.solved}/${PLAN.length} lots out`, cx, y + 15); }
      else if (s.phase === 'result') { g.fillStyle = p.done ? '#3ddc6a' : '#ff6b6b'; g.fillText(p.done ? `out in ${p.done.moves} · +${p.done.pts}${p.done.first ? ' +20 first' : ''}` : 'still stuck', cx, y + 15); }
      else { g.fillStyle = p.done ? '#3ddc6a' : '#9fb0c0'; g.fillText(p.done ? `out in ${p.done.moves} moves!` : `${p.moves} moves`, cx, y + 15); }
    });
    g.textBaseline = 'alphabetic';
    this.hud(g, s, names);
  },
};

function drawBoard(g, s, p, b, seat, label) {
  const size = b.cell * N;
  if (label) { g.fillStyle = SEAT_COLORS[seat]; g.font = '800 13px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, b.x, b.y - 10); }
  // the lot: tarmac, painted bays, a kerb all round with a gap for the gate
  g.fillStyle = '#9aa3ab'; g.fillRect(b.x - 8, b.y - 8, size + 16, size + 16);
  g.fillStyle = '#3a4148'; g.fillRect(b.x, b.y, size, size);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
  for (let k = 1; k < N; k++) { g.beginPath(); g.moveTo(b.x + k * b.cell, b.y); g.lineTo(b.x + k * b.cell, b.y + size); g.moveTo(b.x, b.y + k * b.cell); g.lineTo(b.x + size, b.y + k * b.cell); g.stroke(); }
  const gy = b.y + EXIT_ROW * b.cell;
  g.fillStyle = '#3a4148'; g.fillRect(b.x + size, gy, 8, b.cell);
  g.fillStyle = '#ffd23f';
  for (let k = 0; k < 3; k++) { const ax = b.x + size + 12 + k * 7; g.beginPath(); g.moveTo(ax, gy + b.cell * 0.3); g.lineTo(ax + 6, gy + b.cell / 2); g.lineTo(ax, gy + b.cell * 0.7); g.fill(); }
  const drive = p.done && s.phase === 'play' ? Math.min(1, (s.t - s.phaseT - p.done.t) / DRIVE) : 0;
  s.vehicles.forEach((v, i) => {
    let x = b.x + (v.h ? p.pos[i] : v.fix) * b.cell, y = b.y + (v.h ? v.fix : p.pos[i]) * b.cell;
    if (i === 0 && (drive > 0 || (p.done && s.phase !== 'play'))) x += (drive || 1) * b.cell * 2.2;
    if (i === 0 && x > b.x + size + 10) return;
    const w = (v.h ? v.len : 1) * b.cell, hh = (v.h ? 1 : v.len) * b.cell, pad = b.cell * 0.09;
    const color = i === 0 ? '#2f9e3a' : VEHICLE_COLORS[(i - 1) % VEHICLE_COLORS.length];
    g.fillStyle = 'rgba(0,0,0,.35)'; roundRect(g, x + pad + 2, y + pad + 3, w - pad * 2, hh - pad * 2, b.cell * 0.18); g.fill();
    g.fillStyle = color; roundRect(g, x + pad, y + pad, w - pad * 2, hh - pad * 2, b.cell * 0.18); g.fill();
    // windows: a windscreen at the front and a roof; the rickshaw gets its yellow canopy
    g.fillStyle = i === 0 ? '#ffd23f' : 'rgba(210,235,255,.55)';
    if (v.h) roundRect(g, x + w * (i === 0 ? 0.42 : 0.6), y + hh * 0.24, w * (i === 0 ? 0.42 : 0.22), hh * 0.52, 4);
    else roundRect(g, x + w * 0.24, y + hh * 0.12, w * 0.52, hh * 0.22, 4);
    g.fill();
    if (v.len === 3) { g.fillStyle = 'rgba(0,0,0,.18)'; if (v.h) g.fillRect(x + w * 0.08, y + hh * 0.2, w * 0.45, hh * 0.6); else g.fillRect(x + w * 0.2, y + hh * 0.45, w * 0.6, hh * 0.45); }
    if (seat != null && i === p.cur && !p.done && s.phase === 'play') {
      g.strokeStyle = p.hold ? '#ffd23f' : 'rgba(255,255,255,.8)'; g.lineWidth = p.hold ? 4 : 2;
      roundRect(g, x + pad - 3, y + pad - 3, w - pad * 2 + 6, hh - pad * 2 + 6, b.cell * 0.22); g.stroke();
    }
  });
  if (p.done && s.phase === 'play') {
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(b.x, b.y + size / 2 - 22, size, 44);
    g.fillStyle = '#3ddc6a'; g.font = '900 20px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`Out in ${p.done.moves}!`, b.x + size / 2, b.y + size / 2);
  }
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** The first move on a shortest way out (a small search; the lots are small). */
export function bestMove(vs, start) {
  const key = (p) => p.join(','), seen = new Map([[key(start), null]]);
  let front = [start];
  while (front.length) {
    const next = [];
    for (const p of front) {
      if (p[0] === N - 2) {
        let k = key(p), step = null;
        while (seen.get(k)) { step = seen.get(k); k = step.from; }
        return step ? [step.i, step.to] : null;
      }
      const g = grid(vs, p);
      vs.forEach((v, i) => {
        for (const dir of [-1, 1]) {
          for (let q = p[i] + dir; q >= 0 && q + v.len <= N; q += dir) {
            const cell = dir > 0 ? cellOf(v, q, v.len - 1) : cellOf(v, q, 0);
            if (g[cell] >= 0 && g[cell] !== i) break;
            const n = p.slice(); n[i] = q; const k = key(n);
            if (!seen.has(k)) { seen.set(k, { from: key(p), i, to: q }); next.push(n); }
          }
        }
      });
    }
    front = next;
  }
  return null;
}
function randomMove(s, p, r) {
  const options = [];
  s.vehicles.forEach((v, i) => { for (const to of [slideTo(s.vehicles, p.pos, i, 0), slideTo(s.vehicles, p.pos, i, N)]) if (to !== p.pos[i]) options.push([i, to]); });
  return options.length ? options[Math.floor(r * options.length)] : null;
}
