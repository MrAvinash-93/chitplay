/**
 * Lightweight event bus for decoupled communication between modules.
 * Supports on/off/emit/once with error isolation so one bad listener
 * cannot break the rest of the game.
 */

export class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function');
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, handler) {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  emit(event, payload) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  clear(event) {
    if (event) this.#listeners.delete(event);
    else this.#listeners.clear();
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }
}

export const gameBus = new EventBus();

export const EVENTS = Object.freeze({
  STATE_CHANGED: 'state:changed',
  PHASE_CHANGED: 'phase:changed',
  ROUND_STARTED: 'round:started',
  ROUND_COMPLETED: 'round:completed',
  SCORES_UPDATED: 'scores:updated',
  MATCH_ENDED: 'match:ended',
  SETTINGS_CHANGED: 'settings:changed',
  NOTIFY: 'ui:notify',
  PLAYER_REVEALED: 'player:revealed',
  GUESS_SUBMITTED: 'guess:submitted',
  RESULT_REVEALED: 'result:revealed',
});