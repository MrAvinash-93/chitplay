/**
 * ChitPlay party games: five pass-and-play games for one phone and a group in the same room.
 * Who Is the Spy, Truth or Dare, Riddle Chits, Majority Vote, Consequences.
 * Plain DOM, no 3D, no network: light enough for any phone. Secrets are shown only to the player
 * holding the phone, behind a "pass the phone" screen.
 */
import { SPY_WORDS, SPY_CATEGORIES, TRUTHS, DARES, RIDDLES, MAJORITY, CONSEQUENCES } from './content.js?v=20261114-1334';
import { createStage } from './stage3d.js?v=20261114-1334';
import { loadWorld } from '../world/world-loader.js?v=20261114-1334';
import { PRESETS, lookOf } from '../world/character-looks.js?v=20261114-1334';
import { asOneGame, editionFor } from '../world/countries.js?v=20261114-1334';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken } from '../net/nearby.js?v=20261114-1334';
import { ser, deser, cleanOp } from './party-net.js?v=20261114-1334';

export const GAMES = [
  { slug: 'who-is-the-spy', name: 'Who Is the Spy?', icon: '🕵️', min: 4, max: 10, minutes: '10–20', blurb: 'Everyone gets the same secret word, except the spy. Give clues, find the spy.' },
  { slug: 'truth-or-dare', name: 'Truth or Dare', icon: '🎲', min: 2, max: 15, minutes: '10–30', blurb: 'Friendly truths and fun dares for every age. Skip any prompt, no questions asked.' },
  { slug: 'riddle-chits', name: 'Riddle Chits', icon: '🧩', min: 2, max: 10, minutes: '10–20', blurb: 'Draw a riddle, race to solve it. A hint costs you a point.' },
  { slug: 'majority-vote', name: 'Majority Vote', icon: '🗳️', min: 3, max: 15, minutes: '10–15', blurb: 'Guess what most of the group will choose. Think like the crowd to score.' },
  { slug: 'consequences', name: 'Consequences', icon: '📜', min: 3, max: 8, minutes: '5–10', blurb: 'Write a story one folded line at a time, then unfold the whole crazy tale.' },
];

const $ = (sel) => document.querySelector(sel);
const app = $('#party');
const STORE = 'chitplay.party.players';
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Tiny element helper: h('div', { class: 'x', onclick }, [children]) */
function h(tag, props = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(kids)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
/** Put these on this phone's screen. */
function show(kids) {
  app.replaceChildren(...kids);
  app.scrollTop = 0;
  window.scrollTo(0, 0);
  app.querySelector('button.primary, input')?.focus({ preventScroll: true });
}
/** The shared screen: everyone at the table sees it (on several phones, every phone gets a copy). */
function screen(...kids) {
  kids = kids.filter(Boolean);
  if (!net) { show(kids); return; }
  net.lastPublic = kids;
  if (!net.hostPrivate) show(kids);
  pushPublic();
}
const btn = (label, onclick, cls = '') => h('button', { type: 'button', class: `btn ${cls}`, onclick }, [label]);
// with the 3D stage the paper card stays only for screen readers (the chit on the mat shows it)
let stage = null;
const card = (kids, cls = '') => h('div', { class: `chit ${cls}${stage && !world && !cls.includes('story') ? ' chit--sr' : ''}` }, kids);
/* ─── the 3D room: the players sit at the mat as characters ─── */
let world = null;              // the main game's room, when it loads
let cast = [];                 // all players' names
let seats = [];                // player index sitting at each of the 4 places (-1: an onlooker)
const COLORS = ['#d4a017', '#e91e63', '#2196f3', '#43a047'];
/** The same character for the same name, every game. */
function lookFor(name) {
  let n = 0;
  for (const ch of String(name).toLowerCase()) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  const adults = PRESETS.filter(p => p.age !== 'child');
  return lookOf(adults[n % adults.length].id);
}
/** Sit the players down: everyone when there are four or fewer, otherwise the current player and the next three. */
function sitDown(names, current = 0) {
  cast = names;
  const n = names.length;
  seats = n <= 4 ? [0, 1, 2, 3].map(k => (k < n ? k : -1)) : [0, 1, 2, 3].map(k => (current + k) % n);
  roomOp('sit', seats.map(p => (p < 0 ? '' : names[p])));
}
/** The four places at the mat by name ('' is a quiet onlooker): the same on every phone. */
function applySit(names4) {
  if (!world) return;
  world.story.begin(names4.map((name, k) => (!name
    ? { name: '', look: lookOf(PRESETS[(k * 7) % PRESETS.length].id), color: COLORS[k], isHuman: false, label: '' }
    : { name, look: lookFor(name), color: COLORS[k], isHuman: false, label: name })));
}
/** Something happens in the room: here, and on every friend's phone. */
function roomOp(op, ...args) {
  applyRoom(op, args);
  net?.host.broadcast({ t: 'room', op, args });
}
function applyRoom(op, args) {
  if (op === 'confetti') { confettiRain(); return; }
  if (op === 'sit') { applySit(args[0] || []); return; }
  if (!world) return;
  if (op === 'effect') world.story.effect(args[0], args[1] ?? null);
  else if (op === 'emote') world.story.emote(args[0], args[1], args[2] || 2.4);
  else world.story[op]?.(...args);
}
/** The place a player sits at, bringing them to the table if they're not there yet. */
function seatOf(i) {
  if (!world || i == null || i < 0) return -1;
  let k = seats.indexOf(i);
  if (k < 0) { sitDown(cast, i); k = seats.indexOf(i); }
  return k;
}
/** A player acts in the room: a pose, an emoji over the head, words in a bubble. */
function act(i, pose, emoji, words) {
  const k = seatOf(i);
  if (k < 0) return;
  if (pose) roomOp('pose', k, pose);
  if (emoji) roomOp('emote', k, emoji, 2.4);
  if (words) roomOp('say', k, words);
}
const fx = (kind, i = null) => { if (world) roomOp('effect', kind, i == null ? null : seatOf(i)); };
const pointAt = (i, j) => { if (world) roomOp('point', seatOf(i), seatOf(j)); };
const everyone = (fn) => cast.forEach((_, i) => { if (seats.includes(i)) fn(i); });
const indexOf = (name) => cast.indexOf(name);

/** Show this on the 3D chit (and fold it again for the next player). */
const chit = (text, opts) => stage?.reveal(text, opts);
const foldChit = (opts) => stage?.fold(opts);
const top = (game) => h('header', { class: 'bar' }, [
  h('a', { href: './', class: 'back', 'aria-label': 'All party games' }, ['‹ Party games']),
  h('strong', {}, [game ? `${game.icon} ${game.name}` : 'ChitPlay']),
]);

/* ─── players ─── */
function savedPlayers() {
  try { const p = JSON.parse(localStorage.getItem(STORE)); if (Array.isArray(p)) return p.filter(x => typeof x === 'string').slice(0, 15); } catch {}
  return [];
}
function savePlayers(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {} }
const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{M}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);

/** Who's playing: names in, with this game's limits. Calls go(players, options). */
function setup(game, options, go) {
  curGame = game;
  if (net) { lobby(game, options, go); return; }
  let names = savedPlayers();
  if (names.length < game.min) names = [...names, ...Array.from({ length: game.min - names.length }, (_, i) => `Player ${names.length + i + 1}`)];
  names = names.slice(0, game.max);
  const list = h('ol', { class: 'names' });
  const err = h('p', { class: 'err', role: 'alert' });
  const paint = () => {
    list.replaceChildren(...names.map((n, i) => h('li', {}, [
      h('input', { value: n, maxlength: '14', 'aria-label': `Player ${i + 1} name`, oninput: (e) => { names[i] = e.target.value; } }),
      names.length > game.min ? h('button', { type: 'button', class: 'x', 'aria-label': `Remove ${n}`, onclick: () => { names.splice(i, 1); paint(); } }, ['✕']) : null,
    ])));
    addBtn.disabled = names.length >= game.max;
  };
  const addBtn = btn('+ Add player', () => { names.push(`Player ${names.length + 1}`); paint(); list.lastChild?.querySelector('input')?.select(); });
  const opts = (options || []).map(o => h('label', { class: 'opt' }, [h('span', {}, [o.label]), h('select', { onchange: (e) => { o.value = e.target.value; } },
    o.choices.map(([v, l]) => h('option', { value: v, ...(String(v) === String(o.value) ? { selected: true } : {}) }, [l])))]));
  paint();
  screen(top(game),
    h('section', { class: 'panel' }, [
      h('h1', {}, [game.name]),
      h('p', { class: 'lead' }, [`${game.blurb} ${game.min}–${game.max} players · about ${game.minutes} minutes.`]),
      h('h2', {}, ['Who’s playing?']), list, addBtn, ...opts, err,
      btn('Start', () => {
        const clean = names.map(cleanName).filter(Boolean);
        const unique = new Set(clean.map(n => n.toLowerCase()));
        if (clean.length < game.min) { err.textContent = `This game needs at least ${game.min} players.`; return; }
        if (unique.size !== clean.length) { err.textContent = 'Two players have the same name: change one.'; return; }
        savePlayers(clean);
        sitDown(clean);
        go(clean, Object.fromEntries((options || []).map(o => [o.key, o.value])));
      }, 'primary'),
      btn('📱 Everyone on their own phone', () => lobby(game, options, go)),
      h('a', { class: 'rules', href: `../games/${game.slug}/` }, ['How to play →']),
    ]));
}

/**
 * Secrets: each of these players sees build(i, done) where nobody else can.
 * One phone: passed round one by one. Several phones: everyone at once, on their own phone,
 * while the shared screen shows who we're still waiting for. done() after the last one.
 */
function eachPrivately(list, { lead = 'Pass the phone to', wait = 'Waiting for…' }, build, done) {
  if (!net) {
    let k = 0;
    const step = () => {
      if (k >= list.length) { done(); return; }
      const i = list[k++];
      foldChit();
      act(i, 'hold', '📜');
      show([h('section', { class: 'panel pass' }, [
        h('p', { class: 'lead' }, [lead]),
        h('h1', {}, [cast[i]]),
        h('p', {}, ['Nobody else should look.']),
        btn(`I’m ${cast[i]}: show me`, () => show([h('section', { class: 'panel' }, build(i, step))]), 'primary'),
      ])]);
    };
    step();
    return;
  }
  const left = new Set(list);
  const waiting = () => screen(top(curGame), h('section', { class: 'panel' }, [
    h('h1', {}, [wait]),
    h('p', { class: 'lead' }, [[...left].map(i => cast[i]).join(', ')]),
    h('p', {}, ['Everyone sees their own secret on their own phone.']),
  ]));
  waiting();
  list.forEach((i) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      left.delete(i);
      endPrivate(i);
      if (!left.size) done(); else waiting();
    };
    act(i, 'hold', '📜');
    startPrivate(i, [h('section', { class: 'panel' }, build(i, finish))]);
  });
}

/** Scores and the end: replay with the same players, or another game. */
function results(game, players, scores, restart, note = '') {
  const order = players.map((n, i) => [n, scores[i]]).sort((a, b) => b[1] - a[1]);
  const best = order[0]?.[1];
  chit(order.filter(o => o[1] === best).length > 1 ? 'A tie!' : `${order[0][0]} wins!`, { tone: 'gold', label: '🏆' });
  if (world) { const w = seatOf(players.indexOf(order[0][0])); if (w >= 0) roomOp('celebrate', w); fx('confetti'); }
  screen(top(game), h('section', { class: 'panel' }, [
    h('h1', {}, [order.filter(o => o[1] === best).length > 1 ? 'A tie at the top!' : `${order[0][0]} wins!`]),
    note ? h('p', { class: 'lead' }, [note]) : null,
    h('ol', { class: 'board' }, order.map(([n, s], i) => h('li', { class: i === 0 ? 'first' : '' }, [h('span', {}, [`${['🥇', '🥈', '🥉'][i] || i + 1} ${n}`]), h('strong', {}, [String(s)])]))),
    btn('Play again', restart, 'primary'),
    h('a', { class: 'btn', href: './' }, ['Other party games']),
    h('a', { class: 'rules', href: '../' }, ['Play Raja Rani Chor Police in 3D →']),
  ]));
  celebrate();
}
function scoreLine(players, scores) {
  return h('p', { class: 'scores' }, players.map((n, i) => h('span', {}, [`${n} ${scores[i]}`])));
}
const celebrate = () => roomOp('confetti');
function confettiRain() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(box);
  for (let i = 0; i < 40; i++) box.append(h('i', { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.6}s;background:${pick(['#ffd27a', '#e91e63', '#2196f3', '#43a047', '#ff7a2f'])}` }));
  setTimeout(() => box.remove(), 3200);
}

/* ─── Who Is the Spy? ─── */
function spy(game) {
  const options = [
    { key: 'cat', label: 'Words', value: 'mixed', choices: SPY_CATEGORIES },
    { key: 'rounds', label: 'Rounds', value: '3', choices: [['3', '3'], ['5', '5']] },
  ];
  setup(game, options, (players, o) => {
    const scores = players.map(() => 0);
    let round = 0;
    const pool = o.cat === 'mixed' ? Object.values(SPY_WORDS).flat() : SPY_WORDS[o.cat];
    const used = new Set();
    const next = () => {
      round += 1;
      if (round > Number(o.rounds)) { results(game, players, scores, () => spy(game)); return; }
      let pair = pick(pool);
      for (let t = 0; t < 20 && used.has(pair[0]); t++) pair = pick(pool);
      used.add(pair[0]);
      const [common, odd] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
      const spies = new Set(shuffle(players.map((_, i) => i)).slice(0, players.length >= 8 ? 2 : 1));
      const deal = () => eachPrivately(players.map((_, i) => i), { lead: `Round ${round} · pass the phone to`, wait: 'Reading the secret words…' }, (i, done) => [
        (net ? null : chit(spies.has(i) ? odd : common, { label: `Round ${round} · your secret word` }), null),
        h('p', { class: 'lead' }, [`Round ${round}: your secret word`]),
        card([h('span', { class: 'big' }, [spies.has(i) ? odd : common])], 'open'),
        h('p', {}, ['Remember it. You might be the spy without knowing!']),
        btn(net ? 'Got it' : 'Hide and pass on', done, 'primary'),
      ], clues);
      const clues = () => {
        const first = pick(players);
        stage?.toss();
        everyone(i => act(i, 'think', null));
        act(indexOf(first), 'wave', '💬', 'I’ll start!');
        screen(top(game), h('section', { class: 'panel' }, [
          h('h1', {}, ['Clue time']),
          h('p', { class: 'lead' }, [`Starting with ${first}, go round the circle. Each player says one word or a short clue about their secret word, without saying it.`]),
          h('p', {}, ['Listen for a clue that doesn’t quite fit. Talk it over, then vote together.']),
          timer(120),
          btn('Vote now', vote, 'primary'),
        ]));
      };
      const vote = () => {
        screen(top(game), h('section', { class: 'panel' }, [
          h('h1', {}, ['Who is the spy?']),
          h('p', { class: 'lead' }, ['Agree together, then tap the player you suspect.']),
          h('div', { class: 'grid' }, players.map((n, i) => btn(n, () => reveal(i)))),
        ]));
      };
      const reveal = (accused) => {
        const caught = spies.has(accused);
        everyone(i => { if (i !== accused) pointAt(i, accused); });
        if (caught) { fx('siren', accused); setTimeout(() => fx('cuffs', accused), 450); act(accused, 'cry', '😱'); }
        else { [...spies].forEach(sp => { fx('smoke', sp); act(sp, 'laugh', '😎', 'It wasn’t me… or was it?'); }); act(accused, 'deny', '😤'); }
        const spyNames = [...spies].map(i => players[i]).join(' and ');
        if (!caught) [...spies].forEach(i => { scores[i] += 3; });
        const after = () => next();
        if (caught) {
          // the spy gets one last chance: guess the others' word
          const decoys = shuffle(pool.flat().filter(w => w !== common && w !== odd)).slice(0, 3);
          screen(top(game), h('section', { class: 'panel' }, [
            h('h1', {}, [`Caught! ${players[accused]} was a spy.`]),
            h('p', { class: 'lead' }, [`${spyNames}: guess everyone else’s word to steal 2 points.`]),
            h('div', { class: 'grid' }, shuffle([common, ...decoys]).map(w => btn(w, () => {
              const right = w === common;
              if (right) [...spies].forEach(i => { scores[i] += 2; }); else players.forEach((_, i) => { if (!spies.has(i)) scores[i] += 1; });
              chit(common, { tone: 'gold', label: 'The word was' });
              screen(top(game), h('section', { class: 'panel' }, [
                h('h1', {}, [right ? 'The spy guessed it!' : 'Wrong guess: the group wins the round!']),
                h('p', { class: 'lead' }, [`The word was “${common}”. The spy had “${odd}”.`]),
                scoreLine(players, scores), btn('Next round', after, 'primary'),
              ]));
            }))),
          ]));
        } else {
          chit(odd, { tone: 'gold', label: `${spyNames}'s word` });
          screen(top(game), h('section', { class: 'panel' }, [
            h('h1', {}, [`Wrong! The spy was ${spyNames}.`]),
            h('p', { class: 'lead' }, [`The word was “${common}”. The spy had “${odd}”. The spy scores 3.`]),
            scoreLine(players, scores), btn('Next round', after, 'primary'),
          ]));
        }
      };
      deal();
    };
    next();
  });
}

/* ─── Truth or Dare ─── */
function truthOrDare(game) {
  const options = [{ key: 'turns', label: 'Turns each', value: '3', choices: [['2', '2'], ['3', '3'], ['5', '5']] }];
  setup(game, options, (players, o) => {
    const scores = players.map(() => 0);
    const bags = { truth: shuffle(TRUTHS), dare: shuffle(DARES) };
    let turn = 0;
    const total = players.length * Number(o.turns);
    const next = () => {
      if (turn >= total) { results(game, players, scores, () => truthOrDare(game), 'One point for every truth told and every dare done.'); return; }
      const who = turn % players.length;
      turn += 1;
      stage?.toss();
      screen(top(game), h('section', { class: 'panel' }, [
        h('p', { class: 'lead' }, [`Turn ${turn} of ${total}`]),
        h('h1', {}, [`${players[who]}: truth or dare?`]),
        h('div', { class: 'grid two' }, [btn('Truth', () => show(who, 'truth'), 'primary'), btn('Dare', () => show(who, 'dare'), 'primary')]),
        scoreLine(players, scores),
      ]));
    };
    const show = (who, kind) => {
      if (!bags[kind].length) bags[kind] = shuffle(kind === 'truth' ? TRUTHS : DARES);
      const text = bags[kind].pop();
      chit(text, { tone: kind, label: kind === 'truth' ? 'TRUTH' : 'DARE' });
      act(who, kind === 'truth' ? 'think' : 'surprised', kind === 'truth' ? '🤔' : '😬', text);
      screen(top(game), h('section', { class: 'panel' }, [
        h('p', { class: 'lead' }, [`${players[who]} · ${kind === 'truth' ? 'Truth' : 'Dare'}`]),
        card([h('span', { class: 'prompt' }, [text])], 'open unfold'),
        btn(kind === 'truth' ? 'Answered (+1)' : 'Done (+1)', () => { scores[who] += 1; act(who, 'cheer', '🎉'); everyone(i => { if (i !== who) act(i, 'clap', null); }); next(); }, 'primary'),
        btn('Skip, no worries', () => { act(who, 'laugh', '😅'); next(); }),
      ]));
    };
    next();
  });
}

/* ─── Riddle Chits ─── */
function riddles(game) {
  const options = [{ key: 'rounds', label: 'Riddles', value: '10', choices: [['5', '5'], ['10', '10'], ['15', '15']] }];
  setup(game, options, (players, o) => {
    const scores = players.map(() => 0);
    const deck = shuffle(RIDDLES).slice(0, Number(o.rounds));
    let n = 0;
    const next = () => {
      if (n >= deck.length) { results(game, players, scores, () => riddles(game), 'Two points for a riddle solved without a hint, one with.'); return; }
      const [q, answer, hint] = deck[n++];
      let hinted = false;
      chit(q, { label: `Riddle ${n}` });
      everyone(i => act(i, 'think', null));
      if (cast.length) act(Math.floor(Math.random() * cast.length), 'show', '🧩', q);
      const hintBox = h('p', { class: 'hint' });
      screen(top(game), h('section', { class: 'panel' }, [
        h('p', { class: 'lead' }, [`Riddle ${n} of ${deck.length}`]),
        card([h('span', { class: 'prompt' }, [q])], 'open unfold'),
        hintBox, timer(60),
        btn('Show a hint', (e) => { hinted = true; hintBox.textContent = `Hint: ${hint}`; e.currentTarget.disabled = true; }),
        btn('Show the answer', () => {
          chit(answer, { tone: 'gold', label: 'Answer' });
          screen(top(game), h('section', { class: 'panel' }, [
            h('p', { class: 'lead' }, ['The answer:']),
            card([h('span', { class: 'big' }, [answer])], 'open'),
            h('h2', {}, ['Who said it first?']),
            h('div', { class: 'grid' }, [...players.map((p, i) => btn(p, () => { scores[i] += hinted ? 1 : 2; act(i, 'jump', '💡'); fx('royal', i); next(); })), btn('Nobody', () => { everyone(i => act(i, 'facepalm', null)); next(); })]),
            scoreLine(players, scores),
          ]));
        }, 'primary'),
      ]));
    };
    next();
  });
}

/* ─── Majority Vote ─── */
function majority(game) {
  const options = [{ key: 'rounds', label: 'Questions', value: '5', choices: [['3', '3'], ['5', '5'], ['8', '8']] }];
  setup(game, options, (players, o) => {
    const scores = players.map(() => 0);
    const deck = shuffle(MAJORITY).slice(0, Number(o.rounds));
    let n = 0;
    const next = () => {
      if (n >= deck.length) { results(game, players, scores, () => majority(game), 'One point each time you picked what most players picked.'); return; }
      const [q, choices] = deck[n++];
      const picks = [];
      const ask = () => eachPrivately(players.map((_, i) => i), { lead: `Question ${n} · pass the phone to`, wait: 'Waiting for votes from…' }, (i, done) => [
        (net ? null : chit(q, { label: `Question ${n}` }), null),
        h('h1', {}, [q]),
        h('p', { class: 'lead' }, ['Pick what you think MOST players will pick. Secretly!']),
        h('div', { class: 'grid' }, choices.map(c => btn(c, () => { picks[i] = c; done(); }))),
      ], reveal);
      const reveal = () => {
        const count = Object.fromEntries(choices.map(c => [c, 0]));
        picks.forEach(c => { count[c] += 1; });
        const most = Math.max(...Object.values(count));
        const winners = choices.filter(c => count[c] === most);
        players.forEach((_, i) => { if (winners.includes(picks[i])) scores[i] += 1; });
        players.forEach((_, i) => act(i, winners.includes(picks[i]) ? 'clap' : 'facepalm', winners.includes(picks[i]) ? '👏' : '🙈'));
        chit(winners.join(' / '), { tone: 'gold', label: 'The majority picked' });
        screen(top(game), h('section', { class: 'panel' }, [
          h('h1', {}, [q]),
          h('ul', { class: 'bars' }, choices.map(c => h('li', { class: winners.includes(c) ? 'win' : '' }, [
            h('span', {}, [c]), h('i', { style: `width:${Math.round((count[c] / players.length) * 100)}%` }), h('strong', {}, [String(count[c])]),
          ]))),
          h('p', { class: 'lead' }, [`The majority picked ${winners.join(' and ')}.`]),
          scoreLine(players, scores),
          btn('Next question', next, 'primary'),
        ]));
      };
      ask();
    };
    next();
  });
}

/* ─── Consequences ─── */
function consequences(game) {
  setup(game, [], (players) => {
    const lines = [];
    let k = 0;
    const write = () => {
      if (k >= CONSEQUENCES.length) { unfold(); return; }
      const i = k;
      const who = i % players.length;
      const [ask, example] = CONSEQUENCES[i];
      const input = h('textarea', { maxlength: '90', rows: '3', 'aria-label': ask, placeholder: example });
      eachPrivately([who], { lead: `Line ${i + 1} · pass the phone to`, wait: `Line ${i + 1} of ${CONSEQUENCES.length} is being written by…` }, (_, done) => [
        (net ? null : chit(ask, { label: `Line ${i + 1} of ${CONSEQUENCES.length}` }), null),
        h('p', { class: 'lead' }, [`Line ${i + 1} of ${CONSEQUENCES.length} · the lines above are folded away`]),
        card([h('span', { class: 'prompt' }, [ask])], 'open'),
        input,
        btn(net ? 'Fold it and send' : 'Hide and pass on', () => {
          lines[i] = input.value.trim().replace(/\s+/g, ' ') || example.replace(/^.*“|”.*$/g, '');
          k += 1;
          done();
        }, 'primary'),
      ], write);
    };
    const unfold = () => {
      const story = CONSEQUENCES.map(([ask], i) => h('p', { class: 'line', style: `animation-delay:${i * 0.45}s` }, [h('small', {}, [ask]), lines[i]]));
      const text = lines.join(' ');
      chit(lines[0], { tone: 'gold', label: 'Once upon a time…' });
      everyone(i => act(i, 'laugh', '😂'));
      fx('confetti');
      screen(top(game), h('section', { class: 'panel' }, [
        h('h1', {}, ['The story unfolds…']),
        card(story, 'open story'),
        h('button', { type: 'button', class: 'btn', 'data-copy': text, onclick: async (e) => { const b = e.currentTarget; try { await navigator.clipboard.writeText(text); b.textContent = 'Copied!'; } catch { b.textContent = 'Couldn’t copy'; } } }, ['Copy the story']),
        btn('Write another', () => consequences(game), 'primary'),
        h('a', { class: 'btn', href: './' }, ['Other party games']),
      ]));
      celebrate();
    };
    write();
  });
}

/** A visible countdown that never forces anything: when it ends it just says time's up. */
function timer(seconds) {
  const el = h('p', { class: 'timer', 'aria-live': 'off' });
  let left = seconds;
  const paint = () => { el.dataset.left = String(left); el.textContent = left > 0 ? `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '⏱ Time’s up!'; };
  paint();
  const t = setInterval(() => { left -= 1; paint(); if (left <= 0 || !el.isConnected) clearInterval(t); }, 1000);
  return el;
}

/* ─── several phones: the host's phone runs the game, every friend's phone shows it ─── */
let curGame = null;
let net = null;      // the host's room: { host, players, pending, priv, pub, v, hostPrivate, lastPublic, … }
let guest = null;    // a friend's connection to the host
const ME = 'chitplay.party.me';
const myName = () => { try { return cleanName(localStorage.getItem(ME)) || savedPlayers()[0] || ''; } catch { return ''; } };
const saveMyName = (n) => { try { localStorage.setItem(ME, n); } catch {} };
const hostOnly = (el) => { el.classList.add('host-only'); return el; };
const ERRORS = {
  errNoRoom: 'No game with that code. Check the number on the host’s phone.',
  errFull: 'That game is full.',
  errStarted: 'That game has already started. Ask them to tap Play again, then join.',
  errBrowser: 'This browser can’t connect to other phones. Try Chrome or Safari.',
  errTimeout: 'The host’s phone didn’t answer. Are you both online?',
  errNetwork: 'Couldn’t reach the internet. Check your connection and try again.',
  errOther: 'Something went wrong. Try again.',
};
const netError = (e) => (e?.message === 'main-game' ? 'That code is for a Raja Rani Chor Police table, not a party game.' : ERRORS[nearbyError(e)]);

/** The host opens a room: friends type its code on their phones; the host picks the options and starts. */
async function lobby(game, options, go) {
  curGame = game;
  if (!net) {
    net = { players: [], pending: new Map(), priv: new Map(), pub: null, v: 0, hostPrivate: false, lastPublic: [], welcomed: new Set(), absent: new Map(), me: myName() || 'Host' };
    net.host = new NearbyHost({ onChange: netChanged, onMessage: netMessage, onLeave: netLeft }, { maxGuests: game.max - 1 });
    net.host.hostName = net.me;
    show([top(game), h('section', { class: 'panel' }, [h('h1', {}, ['Opening a room…']), h('p', { class: 'lead' }, ['Getting a code for your friends.'])])]);
    try {
      await net.host.open();
    } catch (e) {
      const failed = net; net = null; failed.host.close();
      show([top(game), h('section', { class: 'panel' }, [h('h1', {}, ['Couldn’t open a room']), h('p', { class: 'lead' }, [netError(e)]), btn('Back', () => setup(game, options, go), 'primary')])]);
      return;
    }
    new MutationObserver((list) => {
      // a host's tap that changed the shared screen in place (a hint, a disabled button): copy it out
      if (!net || net.hostPrivate) return;
      if (list.every(m => (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('.timer'))) return;
      pushPublic();
    }).observe(app, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'class'] });
  }
  net.lobby = { game, options, go };
  net.host.locked = false;
  paintLobby();
}
function paintLobby() {
  const { game, options, go } = net.lobby;
  const list = net.host.list;
  const names = [net.host.hostLabel, ...list.map(g => g.name)];
  const err = h('p', { class: 'err', role: 'alert' });
  const link = `${location.origin}${location.pathname}?join=${net.host.code}`;
  screen(top(game), h('section', { class: 'panel' }, [
    h('h1', {}, ['Everyone on their own phone']),
    hostOnly(h('p', { class: 'lead' }, ['Friends open chitplay.com/party, tap Join and type this code:'])),
    h('p', { class: 'lead guest-only' }, ['You’re in! Waiting for the host to start.']),
    h('p', { class: 'code', 'aria-label': `Room code ${net.host.code}` }, [net.host.code]),
    hostOnly(h('button', { type: 'button', class: 'btn', onclick: async (e) => { const b = e.currentTarget; try { if (navigator.share) await navigator.share({ title: game.name, text: `Join my ${game.name} game on ChitPlay`, url: link }); else { await navigator.clipboard.writeText(link); b.textContent = 'Link copied!'; } } catch {} } }, ['Share the invite link'])),
    h('h2', {}, [`Players (${names.length} of ${game.min}–${game.max})`]),
    h('ol', { class: 'names joined' }, names.map((n, i) => h('li', {}, [i ? n : `${n} (host)`]))),
    hostOnly(h('label', { class: 'opt' }, [h('span', {}, ['Your name']), h('input', { value: net.me, maxlength: '14', oninput: (e) => { net.me = e.target.value; net.host.hostName = cleanName(e.target.value) || 'Host'; } })])),
    ...(options || []).map(o => hostOnly(h('label', { class: 'opt' }, [h('span', {}, [o.label]), h('select', { onchange: (e) => { o.value = e.target.value; } },
      o.choices.map(([v, l]) => h('option', { value: v, ...(String(v) === String(o.value) ? { selected: true } : {}) }, [l])))]))),
    err,
    hostOnly(btn('Start', () => {
      net.host.hostName = cleanName(net.me) || 'Host';
      saveMyName(net.host.hostName);
      const guests = net.host.list;
      const all = [net.host.hostLabel, ...guests.map(g => g.name)];
      if (all.length < game.min) { err.textContent = `This game needs at least ${game.min} players: ${game.min - all.length} more to join.`; return; }
      net.players = all.map((name, i) => ({ name, token: i ? guests[i - 1].token : null }));
      net.host.lock();
      net.lobby = null;
      sitDown(all);
      go(all, Object.fromEntries((options || []).map(o => [o.key, o.value])));
    }, 'primary')),
    hostOnly(btn('Back to one phone', () => { leaveNet(); setup(game, options, go); })),
  ]));
}
function leaveNet() {
  if (!net) return;
  net.host.close();
  net = null;
}
/** The live connection to player i (null: the host, or a friend whose phone is gone). */
function guestOf(i) {
  const token = net.players[i]?.token;
  return token ? [...net.host.guests.values()].find(g => g.token === token) || null : null;
}
const playerOf = (id) => { const token = net.host.guests.get(id)?.token; return token ? net.players.findIndex(p => p.token === token) : -1; };

/** Copy the shared screen out to every friend who isn't looking at a secret. */
let pushTimer = 0;
function pushPublic() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    if (!net) return;
    const s = ser(net.lastPublic);
    net.pub = { ...s, v: ++net.v };
    net.host.guests.forEach((g) => {
      const i = net.lobby ? -1 : net.players.findIndex(p => p.token === g.token);
      if (!net.pending.has(i)) net.host.send(g.id, { t: 'view', v: net.pub.v, tree: net.pub.tree });
    });
  }, 30);
}
/** A secret for player i only: on the host's own phone, or sent to theirs. */
function startPrivate(i, kids) {
  net.pending.set(i, kids);
  if (i === 0) { net.hostPrivate = true; show(kids); return; }
  sendPrivate(i);
}
function sendPrivate(i) {
  const kids = net.pending.get(i);
  if (!kids) return;
  const s = ser(kids);
  const v = ++net.v;
  net.priv.set(i, { ...s, v });
  const g = guestOf(i);
  if (g) net.host.send(g.id, { t: 'view', v, priv: true, tree: s.tree });
  else watchAbsent(i);
}
function endPrivate(i) {
  net.pending.delete(i);
  net.priv.delete(i);
  if (i === 0) { net.hostPrivate = false; show(net.lastPublic); return; }
  const g = guestOf(i);
  if (g && net.pub) net.host.send(g.id, { t: 'view', v: net.pub.v, tree: net.pub.tree });
}
/** A friend whose phone dropped out while a secret waited for them: after a while the game goes on without their answer. */
function watchAbsent(i) {
  if (net.absent.has(i)) return;
  net.absent.set(i, setTimeout(() => {
    net?.absent.delete(i);
    if (!net || !net.pending.has(i) || guestOf(i)) return;
    const snap = net.priv.get(i);
    const b = snap?.buttons.filter(x => !x.disabled).pop();
    b?.click();
  }, 15000));
}
function netChanged() {
  if (!net) return;
  net.host.guests.forEach((g) => {
    if (net.welcomed.has(g.id)) return;
    net.welcomed.add(g.id);
    net.host.send(g.id, { t: 'lobby', party: true, game: curGame?.slug || '' });
    // back after a dropped connection: their secret, or the shared screen
    const i = net.lobby ? -1 : playerOf(g.id);
    if (i > 0 && net.pending.has(i)) sendPrivate(i);
    else if (net.pub) net.host.send(g.id, { t: 'view', v: net.pub.v, tree: net.pub.tree });
  });
  if (net.lobby) paintLobby();
}
function netLeft(id) {
  if (!net) return;
  net.welcomed.delete(id);
  net.pending.forEach((_, i) => { if (i > 0 && !guestOf(i)) watchAbsent(i); });
}
/** A friend tapped a button: press the same button here. */
function netMessage(id, msg) {
  if (!net || msg.t !== 'press') return;
  const i = net.lobby ? -1 : playerOf(id);
  const snap = msg.priv ? net.priv.get(i) : net.pub;
  const resend = () => { if (msg.priv) sendPrivate(i); else pushPublic(); };
  if (!snap || snap.v !== msg.v || (msg.priv && !net.pending.has(i))) { resend(); return; }
  const b = snap.buttons[msg.pid];
  if (!b || b.disabled) { resend(); return; }
  if (msg.values && typeof msg.values === 'object') {
    for (const [k, v] of Object.entries(msg.values)) { const f = snap.inputs[Number(k)]; if (f && typeof v === 'string') f.value = v.slice(0, 200); }
  }
  b.click();
  // the screen may have changed in place: make sure everyone has the latest
  if (net && msg.priv && net.pending.has(i)) sendPrivate(i);
  pushPublic();
}

/* a friend's phone */
let shownV = 0;
async function joinGame(code, name) {
  saveMyName(name);
  let token;
  try { token = sessionStorage.getItem('chitplay.party.token'); } catch {}
  if (!token) { token = newToken(); try { sessionStorage.setItem('chitplay.party.token', token); } catch {} }
  guest = new NearbyGuest({ onMessage: guestMessage, onClose: guestClosed });
  const welcome = await guest.join(code, name, token, { party: true });
  if (!welcome?.party) { guest.close(); guest = null; throw new Error('main-game'); }
  guest.code = code; guest.name = name;
  document.body.classList.add('is-guest');
  const g = GAMES.find(x => x.slug === welcome.game);
  if (g) document.title = `${g.name} – Play Free | ChitPlay`;
}
function guestMessage(msg) {
  if (msg.t === 'room') { const args = cleanOp(msg.op, msg.args); if (args) applyRoom(msg.op, args); return; }
  if (msg.t !== 'view' || !Number.isInteger(msg.v)) return;
  shownV = msg.v;
  const kids = deser(msg.tree, (pid, values) => {
    if (shownV !== msg.v) return;
    app.querySelectorAll('button').forEach(b => { b.disabled = true; });
    guest?.send({ t: 'press', v: msg.v, priv: !!msg.priv, pid, values });
  });
  show(kids);
  if (msg.priv) navigator.vibrate?.(60);
  app.querySelectorAll('.timer[data-left]').forEach((el) => {
    let left = Number(el.dataset.left) || 0;
    const t = setInterval(() => { left -= 1; el.textContent = left > 0 ? `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '⏱ Time’s up!'; if (left <= 0 || !el.isConnected) clearInterval(t); }, 1000);
  });
}
function guestClosed(reason) {
  const again = guest && { code: guest.code, name: guest.name };
  guest = null;
  document.body.classList.remove('is-guest');
  const why = { 'host-left': 'The host closed the game.', kicked: 'The host removed you from the game.', started: 'That game had already started.' }[reason] || 'Lost the connection to the host’s phone.';
  show([h('header', { class: 'bar' }, [h('a', { href: './', class: 'back' }, ['‹ Party games'])]), h('section', { class: 'panel' }, [
    h('h1', {}, ['Game over here']),
    h('p', { class: 'lead' }, [why]),
    again && reason !== 'host-left' && reason !== 'kicked' ? btn('Join again', () => joinForm(again.code), 'primary') : null,
    h('a', { class: 'btn', href: './' }, ['Party games']),
  ])]);
}
/** Join a friend's game: their 6-digit code and your name. */
function joinForm(code = '') {
  const codeIn = h('input', { value: code, inputmode: 'numeric', maxlength: '6', autocomplete: 'off', 'aria-label': 'Room code', placeholder: '6-digit code' });
  const nameIn = h('input', { value: myName(), maxlength: '14', 'aria-label': 'Your name', placeholder: 'Your name' });
  const err = h('p', { class: 'err', role: 'alert' });
  const go = btn('Join', async () => {
    const c = codeIn.value.replace(/\D/g, '');
    const n = cleanName(nameIn.value);
    if (!isCode(c)) { err.textContent = 'Type the 6-digit code from the host’s phone.'; return; }
    if (!n) { err.textContent = 'Type your name.'; return; }
    go.disabled = true; go.textContent = 'Joining…'; err.textContent = '';
    try { await joinGame(c, n); } catch (e) { guest?.close(true); guest = null; err.textContent = netError(e); go.disabled = false; go.textContent = 'Join'; }
  }, 'primary');
  show([h('header', { class: 'bar' }, [h('a', { href: './', class: 'back' }, ['‹ Party games']), h('strong', {}, ['Join friends'])]),
    h('section', { class: 'panel' }, [
      h('h1', {}, ['Join a friend’s game']),
      h('p', { class: 'lead' }, ['The host taps “Everyone on their own phone” and gets a code. Type it here.']),
      h('label', { class: 'opt' }, [h('span', {}, ['Code']), codeIn]),
      h('label', { class: 'opt' }, [h('span', {}, ['Your name']), nameIn]),
      err, go,
    ])]);
  (code ? nameIn : codeIn).focus({ preventScroll: true });
}
addEventListener('pagehide', () => { guest?.close(); net?.host.close(); });

/* ─── the hub ─── */
function hub() {
  stage?.toss();
  screen(h('header', { class: 'bar' }, [h('a', { href: '../', class: 'back' }, ['‹ ChitPlay']), h('strong', {}, ['Party games'])]),
    h('section', { class: 'panel' }, [
      h('h1', {}, ['Party games']),
      h('p', { class: 'lead' }, ['Pass one phone around, or play with everyone on their own phone. Free, no sign-up, works on any phone.']),
      h('div', { class: 'games' }, GAMES.map(g => h('a', { class: 'game', href: `?game=${g.slug}` }, [
        h('span', { class: 'icon', 'aria-hidden': 'true' }, [g.icon]),
        h('span', {}, [h('strong', {}, [g.name]), h('small', {}, [`${g.min}–${g.max} players · ${g.minutes} min`]), h('em', {}, [g.blurb])]),
      ]))),
      btn('📱 Join a friend’s game (type their code)', () => joinForm()),
      h('a', { class: 'rules', href: '../' }, ['Or play Raja Rani Chor Police in 3D →']),
    ]));
}

const stageEl = document.getElementById('stage');
const PLAY = { 'who-is-the-spy': spy, 'truth-or-dare': truthOrDare, 'riddle-chits': riddles, 'majority-vote': majority, consequences };
const params = new URLSearchParams(location.search);
const slug = params.get('game');
const joinCode = (params.get('join') || '').replace(/\D/g, '');
const game = GAMES.find(g => g.slug === slug);
loadWorld().then(async (w) => {
  if (w?.story) {
    world = w;
    stageEl.hidden = true;
    document.body.classList.add('room');
    world.story.setCountry(asOneGame(editionFor('en'), 'en'));
    world.story.setCalm?.(false);
  } else {
    stage = await createStage(stageEl).catch(() => null);
    if (!stage) stageEl.hidden = true;
  }
  if (isCode(joinCode)) joinForm(joinCode);
  else if (game) { document.title = `${game.name} – Play Free | ChitPlay`; PLAY[slug](game); } else hub();
});
