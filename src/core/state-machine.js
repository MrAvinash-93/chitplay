import { GAME_PHASES, STATE_TRANSITIONS } from '../app/config.js?v=20261114-1448';
import { StateTransitionError } from '../utils/errors.js';

/**
 * Finite state machine controlling all gameplay phase transitions.
 * Validates every transition against the allowed transition map.
 * Rejects illegal moves and duplicate transitions to the same phase.
 */
export class StateMachine {
  #current;
  #history = [];
  #listeners = new Set();

  constructor(initialPhase = GAME_PHASES.HOME) {
    if (!Object.values(GAME_PHASES).includes(initialPhase)) {
      throw new Error(`Unknown initial phase: ${initialPhase}`);
    }
    this.#current = initialPhase;
    this.#history.push({ phase: initialPhase, at: Date.now() });
  }

  get current() { return this.#current; }
  get history() { return [...this.#history]; }

  canTransition(to) {
    if (to === this.#current) return false;
    const allowed = STATE_TRANSITIONS[this.#current];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  transition(to) {
    if (to === this.#current) {
      return false; // silently ignore duplicate same-phase transition
    }
    if (!this.canTransition(to)) {
      throw new StateTransitionError(this.#current, to);
    }
    const from = this.#current;
    this.#current = to;
    this.#history.push({ from, to, at: Date.now() });
    for (const listener of this.#listeners) {
      try { listener({ from, to }); } catch (e) { console.error('[StateMachine] listener error', e); }
    }
    return true;
  }

  onChange(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  reset(phase = GAME_PHASES.HOME) {
    const from = this.#current;
    this.#current = phase;
    this.#history = [{ phase, at: Date.now() }];
    for (const listener of this.#listeners) {
      try { listener({ from, to: phase, reset: true }); } catch (e) { console.error(e); }
    }
  }
}