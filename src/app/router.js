import { GAME_PHASES } from './config.js';

/**
 * Router maps game phases to screen factories. Screens are created lazily
 * and mounted into the app root. Handles enter/exit lifecycle.
 */
export class Router {
  #routes = new Map();
  #current = null;
  #currentScreen = null;
  #root;

  constructor(root) {
    this.#root = root;
  }

  register(phase, factory) {
    this.#routes.set(phase, factory);
  }

  navigate(phase, context) {
    const factory = this.#routes.get(phase);
    if (!factory) {
      console.error(`[Router] No route registered for phase: ${phase}`);
      return;
    }

    if (this.#currentScreen?.onExit) {
      try { this.#currentScreen.onExit(); } catch (e) { console.error(e); }
    }

    const screen = factory(context);
    this.#current = phase;
    this.#currentScreen = screen;

    // Clear root and mount new screen
    while (this.#root.firstChild) this.#root.removeChild(this.#root.firstChild);
    this.#root.appendChild(screen.element);

    if (screen.onEnter) {
      try { screen.onEnter(); } catch (e) { console.error(e); }
    }
  }

  get current() { return this.#current; }
}