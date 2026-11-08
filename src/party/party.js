/**
 * ChitPlay party games: five pass-and-play games for one phone and a group in the same room.
 * Who Is the Spy, Truth or Dare, Riddle Chits, Majority Vote, Consequences.
 * Plain DOM, no 3D, no network: light enough for any phone. Secrets are shown only to the player
 * holding the phone, behind a "pass the phone" screen.
 */
import { SPY_WORDS, SPY_CATEGORIES, TRUTHS, DARES, RIDDLES, MAJORITY, CONSEQUENCES } from './content.js?v=20261108-0848';

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
function screen(...kids) {
  app.replaceChildren(...kids.filter(Boolean));
  app.scrollTop = 0;
  window.scrollTo(0, 0);
  app.querySelector('button.primary, input')?.focus({ preventScroll: true });
}
const btn = (label, onclick, cls = '') => h('button', { type: 'button', class: `btn ${cls}`, onclick }, [label]);
const card = (kids, cls = '') => h('div', { class: `chit ${cls}` }, kids);
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
        go(clean, Object.fromEntries((options || []).map(o => [o.key, o.value])));
      }, 'primary'),
      h('a', { class: 'rules', href: `../games/${game.slug}/` }, ['How to play →']),
    ]));
}

/** The phone goes to one player: only they see what comes next. */
function passTo(name, reveal, then) {
  screen(h('section', { class: 'panel pass' }, [
    h('p', { class: 'lead' }, ['Pass the phone to']),
    h('h1', {}, [name]),
    h('p', {}, ['Nobody else should look.']),
    btn(`I’m ${name}: show me`, () => {
      screen(h('section', { class: 'panel' }, [...reveal(), btn('Hide and pass on', then, 'primary')]));
    }, 'primary'),
  ]));
}

/** Scores and the end: replay with the same players, or another game. */
function results(game, players, scores, restart, note = '') {
  const order = players.map((n, i) => [n, scores[i]]).sort((a, b) => b[1] - a[1]);
  const best = order[0]?.[1];
  screen(top(game), h('section', { class: 'panel' }, [
    h('h1', {}, [order.filter(o => o[1] === best).length > 1 ? 'A tie at the top!' : `${order[0][0]} wins!`]),
    note ? h('p', { class: 'lead' }, [note]) : null,
    h('ol', { class: 'board' }, order.map(([n, s], i) => h('li', { class: i === 0 ? 'first' : '' }, [h('span', {}, [`${['🥇', '🥈', '🥉'][i] || i + 1} ${n}`]), h('strong', {}, [String(s)])]))),
    btn('Play again', restart, 'primary'),
    btn('Other party games', () => { location.href = './'; }),
    h('a', { class: 'rules', href: '../' }, ['Play Raja Rani Chor Police in 3D →']),
  ]));
  celebrate();
}
function scoreLine(players, scores) {
  return h('p', { class: 'scores' }, players.map((n, i) => h('span', {}, [`${n} ${scores[i]}`])));
}
function celebrate() {
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
      let k = 0;
      const deal = () => {
        if (k >= players.length) { clues(); return; }
        const i = k++;
        passTo(players[i], () => [
          h('p', { class: 'lead' }, [`Round ${round}: your secret word`]),
          card([h('span', { class: 'big' }, [spies.has(i) ? odd : common])], 'open'),
          h('p', {}, ['Remember it. You might be the spy without knowing!']),
        ], deal);
      };
      const clues = () => {
        const first = pick(players);
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
              screen(top(game), h('section', { class: 'panel' }, [
                h('h1', {}, [right ? 'The spy guessed it!' : 'Wrong guess: the group wins the round!']),
                h('p', { class: 'lead' }, [`The word was “${common}”. The spy had “${odd}”.`]),
                scoreLine(players, scores), btn('Next round', after, 'primary'),
              ]));
            }))),
          ]));
        } else {
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
      screen(top(game), h('section', { class: 'panel' }, [
        h('p', { class: 'lead' }, [`${players[who]} · ${kind === 'truth' ? 'Truth' : 'Dare'}`]),
        card([h('span', { class: 'prompt' }, [text])], 'open unfold'),
        btn(kind === 'truth' ? 'Answered (+1)' : 'Done (+1)', () => { scores[who] += 1; next(); }, 'primary'),
        btn('Skip, no worries', next),
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
      const hintBox = h('p', { class: 'hint' });
      screen(top(game), h('section', { class: 'panel' }, [
        h('p', { class: 'lead' }, [`Riddle ${n} of ${deck.length}`]),
        card([h('span', { class: 'prompt' }, [q])], 'open unfold'),
        hintBox, timer(60),
        btn('Show a hint', (e) => { hinted = true; hintBox.textContent = `Hint: ${hint}`; e.currentTarget.disabled = true; }),
        btn('Show the answer', () => {
          screen(top(game), h('section', { class: 'panel' }, [
            h('p', { class: 'lead' }, ['The answer:']),
            card([h('span', { class: 'big' }, [answer])], 'open'),
            h('h2', {}, ['Who said it first?']),
            h('div', { class: 'grid' }, [...players.map((p, i) => btn(p, () => { scores[i] += hinted ? 1 : 2; next(); })), btn('Nobody', next)]),
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
      let k = 0;
      const ask = () => {
        if (k >= players.length) { reveal(); return; }
        const i = k++;
        screen(h('section', { class: 'panel pass' }, [
          h('p', { class: 'lead' }, [`Question ${n} · pass the phone to`]),
          h('h1', {}, [players[i]]),
          btn(`I’m ${players[i]}`, () => {
            screen(h('section', { class: 'panel' }, [
              h('h1', {}, [q]),
              h('p', { class: 'lead' }, ['Pick what you think MOST players will pick. Secretly!']),
              h('div', { class: 'grid' }, choices.map(c => btn(c, () => { picks[i] = c; ask(); }))),
            ]));
          }, 'primary'),
        ]));
      };
      const reveal = () => {
        const count = Object.fromEntries(choices.map(c => [c, 0]));
        picks.forEach(c => { count[c] += 1; });
        const most = Math.max(...Object.values(count));
        const winners = choices.filter(c => count[c] === most);
        players.forEach((_, i) => { if (winners.includes(picks[i])) scores[i] += 1; });
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
      const who = players[i % players.length];
      const [ask, example] = CONSEQUENCES[i];
      const input = h('textarea', { maxlength: '90', rows: '3', 'aria-label': ask, placeholder: example });
      passTo(who, () => [
        h('p', { class: 'lead' }, [`Line ${i + 1} of ${CONSEQUENCES.length} · the lines above are folded away`]),
        card([h('span', { class: 'prompt' }, [ask])], 'open'),
        input,
      ], () => {
        lines[i] = input.value.trim().replace(/\s+/g, ' ') || example.replace(/^.*“|”.*$/g, '');
        k += 1;
        write();
      });
    };
    const unfold = () => {
      const story = CONSEQUENCES.map(([ask], i) => h('p', { class: 'line', style: `animation-delay:${i * 0.45}s` }, [h('small', {}, [ask]), lines[i]]));
      const text = lines.join(' ');
      screen(top(game), h('section', { class: 'panel' }, [
        h('h1', {}, ['The story unfolds…']),
        card(story, 'open story'),
        btn('Copy the story', async (e) => { try { await navigator.clipboard.writeText(text); e.currentTarget.textContent = 'Copied!'; } catch { e.currentTarget.textContent = 'Couldn’t copy'; } }),
        btn('Write another', () => consequences(game), 'primary'),
        btn('Other party games', () => { location.href = './'; }),
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
  const paint = () => { el.textContent = left > 0 ? `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '⏱ Time’s up!'; };
  paint();
  const t = setInterval(() => { left -= 1; paint(); if (left <= 0 || !el.isConnected) clearInterval(t); }, 1000);
  return el;
}

/* ─── the hub ─── */
function hub() {
  screen(h('header', { class: 'bar' }, [h('a', { href: '../', class: 'back' }, ['‹ ChitPlay']), h('strong', {}, ['Party games'])]),
    h('section', { class: 'panel' }, [
      h('h1', {}, ['Party games for one phone']),
      h('p', { class: 'lead' }, ['Get everyone in one room, pass the phone around, and play. Free, no sign-up, works on any phone.']),
      h('div', { class: 'games' }, GAMES.map(g => h('a', { class: 'game', href: `?game=${g.slug}` }, [
        h('span', { class: 'icon', 'aria-hidden': 'true' }, [g.icon]),
        h('span', {}, [h('strong', {}, [g.name]), h('small', {}, [`${g.min}–${g.max} players · ${g.minutes} min`]), h('em', {}, [g.blurb])]),
      ]))),
      h('a', { class: 'rules', href: '../' }, ['Or play Raja Rani Chor Police in 3D →']),
    ]));
}

const PLAY = { 'who-is-the-spy': spy, 'truth-or-dare': truthOrDare, 'riddle-chits': riddles, 'majority-vote': majority, consequences };
const slug = new URLSearchParams(location.search).get('game');
const game = GAMES.find(g => g.slug === slug);
if (game) { document.title = `${game.name} – Play Free | ChitPlay`; PLAY[slug](game); } else hub();
