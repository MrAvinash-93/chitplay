/**
 * Rules engine for the country editions. Pure logic, no DOM.
 * Players are referred to by seat index 0..3.
 */
const SLOTS = ['king', 'queen', 'detective', 'thief'];

function randInt(n) {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1);
    globalThis.crypto.getRandomValues(a);
    return a[0] % n;
  }
  return Math.floor(Math.random() * n);
}
const pick = (arr) => arr[randInt(arr.length)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CHEAT_PENALTY = 100;
export const CHEAT_CATCH_CHANCE = 0.3;   // so 70% of tries go unnoticed

export class Match {
  constructor(country, playerCount = 4, rounds = 5, { humanSeat = -1 } = {}) {
    this.country = country;
    this.rules = country.rules;
    this.rounds = rounds;
    this.round = 0;
    this.humanSeat = humanSeat;
    this.totals = Array(playerCount).fill(0);
    this.guesserCount = Array(playerCount).fill(0);
    this.catches = Array(playerCount).fill(0);   // thief caught while guessing
    this.escapes = Array(playerCount).fill(0);   // got away as the thief
    this.cheats = Array(playerCount).fill(0);    // tried to peek
    this.caughtCheats = Array(playerCount).fill(0);
    this.roles = [];          // seat -> slot
    this.lastPoints = [];
  }

  /**
   * Fair but random roles: the guessing role goes to whoever has had it the
   * fewest times (random among ties), so everyone gets a turn — and the human
   * is guaranteed at least one turn per match. The other roles are random.
   */
  startRound() {
    this.round += 1;
    const gSlot = this.rules.guesser;
    const min = Math.min(...this.guesserCount);
    let pool = this.guesserCount.map((c, s) => (c === min ? s : -1)).filter(s => s >= 0);
    const h = this.humanSeat;
    if (h >= 0 && this.guesserCount[h] === 0) {
      const left = this.rounds - this.round + 1;
      if (left <= 1) pool = [h];   // last chance this match: it's the human's turn
    }
    const g = pick(pool);
    this.guesserCount[g] += 1;
    const rest = shuffle(SLOTS.filter(s => s !== gSlot));
    this.roles = [];
    let k = 0;
    for (let s = 0; s < 4; s++) this.roles[s] = s === g ? gSlot : rest[k++];
    this.cleared = [];
    this.nightResult = null;
    this.cheated = false;
    this.cheatPenalty = 0;
    return this.roles;
  }

  seatOf(slot) { return this.roles.indexOf(slot); }
  slotOf(seat) { return this.roles[seat]; }
  roleOf(seat) { return this.country.roles[this.roles[seat]]; }
  get guesser() { return this.seatOf(this.rules.guesser); }
  get announcer() { return this.rules.announce ? this.seatOf(this.rules.announce) : -1; }
  get thief() { return this.seatOf('thief'); }
  get isFinal() { return this.round >= this.rounds; }
  get multiplier() { return this.rules.finalDouble && this.isFinal ? 2 : 1; }

  /** Seats the guesser may still accuse. */
  suspects() {
    return [0, 1, 2, 3].filter(s => s !== this.guesser && s !== this.announcer && !this.cleared.includes(s));
  }

  /** Japan: clear one innocent suspect. */
  giveHint() {
    const innocents = this.suspects().filter(s => s !== this.thief);
    if (!innocents.length) return null;
    const s = pick(innocents);
    this.cleared.push(s);
    return s;
  }

  /** Russia: the Komissar checks one random suspect in the night. */
  nightCheck() {
    const s = pick(this.suspects());
    const isThief = s === this.thief;
    if (!isThief) this.cleared.push(s);
    return { seat: s, isThief };
  }

  /** Germany: a witness gives a tip — right about 65% of the time. */
  witness() {
    const witnesses = [0, 1, 2, 3].filter(s => s !== this.guesser && s !== this.thief);
    const who = pick(witnesses);
    const sus = this.suspects().filter(s => s !== who);
    const truthful = Math.random() < 0.65 || sus.length === 1;
    const tip = truthful ? this.thief : pick(sus.filter(s => s !== this.thief).length ? sus.filter(s => s !== this.thief) : sus);
    return { who, tip, truthful: tip === this.thief };
  }

  /** Mexico: someone can't stop giggling — the thief 70% of the time. */
  tell() {
    const sus = this.suspects();
    const s = Math.random() < 0.7 ? this.thief : pick(sus.filter(x => x !== this.thief).length ? sus.filter(x => x !== this.thief) : sus);
    return s;
  }

  /** Korea: the Mafia attacks one non-Mafia player; the Doctor guesses whom to save. */
  playNight() {
    const others = [0, 1, 2, 3].filter(s => s !== this.thief);
    const victim = pick(others);
    const save = Math.random() < 0.4 ? victim : pick(others);
    this.nightResult = { victim, doctor: this.seatOf('queen'), save, saved: save === victim };
    return this.nightResult;
  }

  /**
   * The guesser tries to peek at a suspect's chit, once a round.
   * - Noticed (30%): nothing is seen, every suspect stays in play and the fine applies.
   * - Unnoticed (70%): one innocent suspect's chit is seen and cleared.
   * The thief's chit is never the one seen.
   * Returns { caught, peeked, seat, slot }: seat is who they tried to look at; slot is null when nothing was seen.
   */
  cheat() {
    if (this.cheated) return null;
    const suspects = this.suspects();
    const innocents = suspects.filter(s => s !== this.thief);
    if (!innocents.length) return null;
    this.cheated = true;
    const g = this.guesser;
    if (this.cheats) this.cheats[g]++;
    if (Math.random() < CHEAT_CATCH_CHANCE) {
      this.cheatPenalty = CHEAT_PENALTY;
      if (this.caughtCheats) this.caughtCheats[g]++;
      return { caught: true, peeked: false, seat: pick(suspects), slot: null };
    }
    const seat = pick(innocents);
    this.cleared.push(seat);
    return { caught: false, peeked: true, seat, slot: this.roles[seat] };
  }

  /** A simple computer guesser: a light nose for the thief. */
  aiGuess(exclude = [], lean = null) {
    const pool = this.suspects().filter(s => !exclude.includes(s));
    const weights = pool.map(s => (s === this.thief ? 1.5 : 1) * (s === lean ? 1.8 : 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  }

  /**
   * Score the round. `guesses` is one or two accused seats (two only when
   * rules.secondChance and the first was wrong).
   */
  resolve(guesses) {
    const R = this.rules;
    const C = this.country.roles;
    const g = this.guesser;
    const t = this.thief;
    const pts = [0, 0, 0, 0];
    this.roles.forEach((slot, seat) => { pts[seat] = C[slot].points; });

    const attempt = guesses.findIndex(s => s === t);
    const correct = attempt >= 0;
    const guesserBase = C[R.guesser].points;
    const escape = R.escape ?? guesserBase;

    if (correct) {
      pts[g] = attempt === 0 ? guesserBase : Math.round(guesserBase / 2);
      pts[t] = 0;
      if (R.fine) { pts[g] += R.fine; pts[t] -= R.fine; }
    } else if (R.onWrong === 'swap') {
      pts[g] = 0;
      pts[t] = guesserBase;
    } else if (R.onWrong === 'penalty') {
      pts[g] = -(R.penalty || 0);
      pts[t] = escape;
    } else {
      pts[g] = 0;
      pts[t] = escape;
    }
    if (!correct && R.steal) {
      const k = this.seatOf('king');
      pts[k] -= R.steal;
      pts[t] += R.steal;
    }
    if (R.night && this.nightResult && !this.nightResult.saved) {
      pts[this.nightResult.victim] = 0;
    }
    const mult = this.multiplier;
    for (let s = 0; s < 4; s++) pts[s] *= mult;
    if (this.cheatPenalty) pts[g] -= this.cheatPenalty;

    pts.forEach((p, seat) => { this.totals[seat] += p; });
    if (correct) this.catches[g]++; else this.escapes[t]++;
    this.lastPoints = pts;
    return { correct, attempt, points: pts, guesser: g, thief: t, accused: guesses[guesses.length - 1], multiplier: mult };
  }

  /** Everything needed to carry on after a page refresh. */
  snapshot() {
    return {
      rounds: this.rounds, round: this.round, humanSeat: this.humanSeat,
      totals: this.totals.slice(), guesserCount: this.guesserCount.slice(),
      catches: this.catches.slice(), escapes: this.escapes.slice(),
      cheats: this.cheats.slice(), caughtCheats: this.caughtCheats.slice(),
      roles: this.roles.slice(), cleared: (this.cleared || []).slice(),
      cheated: !!this.cheated, cheatPenalty: this.cheatPenalty || 0,
    };
  }

  static restore(country, s) {
    const m = new Match(country, 4, s.rounds, { humanSeat: s.humanSeat });
    m.round = s.round;
    m.totals = s.totals.slice();
    m.guesserCount = s.guesserCount.slice();
    if (Array.isArray(s.catches) && s.catches.length === 4) m.catches = s.catches.slice();
    if (Array.isArray(s.escapes) && s.escapes.length === 4) m.escapes = s.escapes.slice();
    if (Array.isArray(s.cheats) && s.cheats.length === 4) m.cheats = s.cheats.slice();
    if (Array.isArray(s.caughtCheats) && s.caughtCheats.length === 4) m.caughtCheats = s.caughtCheats.slice();
    m.roles = s.roles.slice();
    m.cleared = (s.cleared || []).slice();
    m.cheated = !!s.cheated;
    m.cheatPenalty = s.cheatPenalty || 0;
    m.nightResult = null;
    return m;
  }

  /** Sanity check for a saved match (localStorage can hold anything). */
  static isValidSnapshot(s) {
    const okArr = (a, n) => Array.isArray(a) && a.length === n;
    return !!s && Number.isInteger(s.rounds) && s.rounds > 0 && s.rounds <= 50
      && Number.isInteger(s.round) && s.round >= 1 && s.round <= s.rounds
      && okArr(s.totals, 4) && s.totals.every(Number.isFinite)
      && okArr(s.guesserCount, 4) && okArr(s.roles, 4)
      && SLOTS.every(slot => s.roles.includes(slot));
  }

  get isOver() { return this.round >= this.rounds; }

  winner() {
    let w = 0;
    this.totals.forEach((p, i) => { if (p > this.totals[w]) w = i; });
    return w;
  }

  /** Seats from first to last place. */
  standings() {
    return [0, 1, 2, 3].sort((a, b) => this.totals[b] - this.totals[a] || a - b);
  }

  /** End-of-match awards: [{ id, seat, count }] for the best catcher and the best escaper. */
  awards() {
    const best = (arr) => {
      const max = Math.max(...arr);
      if (max <= 0) return -1;
      const tied = arr.map((v, i) => (v === max ? i : -1)).filter(i => i >= 0);
      return tied.length === 1 ? tied[0] : -1;   // no award on a tie
    };
    const out = [];
    const c = best(this.catches); if (c >= 0) out.push({ id: 'sharpEye', seat: c, count: this.catches[c] });
    const e = best(this.escapes); if (e >= 0) out.push({ id: 'escape', seat: e, count: this.escapes[e] });
    return out;
  }
}
