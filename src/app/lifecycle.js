/**
 * Application lifecycle — boots the game, wires the state machine,
 * router, and event bus, and exposes the transition function used by screens.
 */
import { GameState } from '../core/game-state.js';
import { StateMachine } from '../core/state-machine.js?v=20261110-1453';
import { Router } from './router.js';
import { GAME_PHASES } from './config.js?v=20261110-1453';
import { gameBus, EVENTS } from '../core/event-bus.js';
import { audioManager } from '../audio/audio-manager.js';

export function createApp(root) {
  const state = new GameState();
  const machine = new StateMachine(GAME_PHASES.HOME);
  const router = new Router(root);

  const transition = (to) => {
    try {
      const changed = machine.transition(to);
      if (changed) {
        state.phase = to;
        router.navigate(to, { transition, state });
        gameBus.emit(EVENTS.PHASE_CHANGED, { phase: to });
      } else if (to === state.phase) {
        router.navigate(to, { transition, state });
      }
    } catch (err) {
      console.error('[App] Transition failed:', err);
    }
  };

  const reset = () => {
    machine.reset(GAME_PHASES.HOME);
    state.phase = GAME_PHASES.HOME;
    router.navigate(GAME_PHASES.HOME, { transition, state });
  };

  return { state, machine, router, transition, reset };
}