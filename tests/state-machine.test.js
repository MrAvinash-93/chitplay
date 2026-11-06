import { describe, it, expect } from './harness.js';
import { StateMachine } from '../src/core/state-machine.js';
import { GAME_PHASES } from '../src/app/config.js';

describe('State Machine', () => {
  it('starts in the given initial phase', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    expect(sm.current).toBe(GAME_PHASES.HOME);
  });

  it('allows valid transitions', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    const changed = sm.transition(GAME_PHASES.PLAYER_SETUP);
    expect(changed).toBe(true);
    expect(sm.current).toBe(GAME_PHASES.PLAYER_SETUP);
  });

  it('allows opening and leaving the multiplayer room', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    expect(sm.transition(GAME_PHASES.MULTIPLAYER)).toBe(true);
    expect(sm.current).toBe(GAME_PHASES.MULTIPLAYER);
    expect(sm.transition(GAME_PHASES.HOME)).toBe(true);
  });

  it('rejects invalid transitions', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    expect(() => sm.transition(GAME_PHASES.RESULT_REVEAL)).toThrow();
  });

  it('ignores duplicate same-phase transitions', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    const changed = sm.transition(GAME_PHASES.HOME);
    expect(changed).toBe(false);
    expect(sm.current).toBe(GAME_PHASES.HOME);
  });

  it('canTransition returns false for same phase', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    expect(sm.canTransition(GAME_PHASES.HOME)).toBe(false);
  });

  it('canTransition returns true for allowed target', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    expect(sm.canTransition(GAME_PHASES.PLAYER_SETUP)).toBe(true);
  });

  it('records history', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    sm.transition(GAME_PHASES.PLAYER_SETUP);
    sm.transition(GAME_PHASES.ROUND_INTRO);
    expect(sm.history.length).toBe(3);
    expect(sm.history[1].from).toBe(GAME_PHASES.HOME);
    expect(sm.history[1].to).toBe(GAME_PHASES.PLAYER_SETUP);
  });

  it('notifies listeners on transition', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    let received = null;
    sm.onChange((e) => { received = e; });
    sm.transition(GAME_PHASES.PLAYER_SETUP);
    expect(received.from).toBe(GAME_PHASES.HOME);
    expect(received.to).toBe(GAME_PHASES.PLAYER_SETUP);
  });

  it('reset returns to home', () => {
    const sm = new StateMachine(GAME_PHASES.HOME);
    sm.transition(GAME_PHASES.PLAYER_SETUP);
    sm.reset(GAME_PHASES.HOME);
    expect(sm.current).toBe(GAME_PHASES.HOME);
    expect(sm.history.length).toBe(1);
  });

  it('rejects unknown initial phase', () => {
    expect(() => new StateMachine('NOPE')).toThrow();
  });
});