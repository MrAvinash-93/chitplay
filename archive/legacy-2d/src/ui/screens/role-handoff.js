import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js';

/**
 * Neutral handoff screen between players. Shows only the NEXT player's
 * name — never any role information. Previous player's role content is
 * fully cleared from the DOM before this screen mounts.
 */
export function RoleHandoffScreen({ transition, state }) {
  const playerId = state.currentRevealPlayerId;
  const player = state.players.find(p => p.id === playerId);
  const total = state.players.length;
  const done = state.revealedCount;

  if (!player) {
    // Safety: if no player pending, go to detective handoff
    queueMicrotask(() => transition(GAME_PHASES.DETECTIVE_HANDOFF));
    return { element: el('div', { className: 'screen' }), onEnter() {}, onExit() {} };
  }

  const revealBtn = createButton({
    label: `I am ${player.name} — Reveal`,
    variant: 'primary',
    size: 'lg',
    icon: icons.eye,
    block: true,
    onClick: () => transition(GAME_PHASES.ROLE_REVEAL),
  });

  const dots = Array.from({ length: total }, (_, i) => el('span', {
    className: `progress-dot${i < done ? ' progress-dot--done' : i === done ? ' progress-dot--active' : ''}`,
  }));

  const screen = el('div', { className: 'screen role-handoff anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, [`${done + 1} / ${total}`]),
    ]),
    el('div', { className: 'screen__body role-handoff__body' }, [
      el('div', { className: 'role-handoff__icon' }, [
        el('span', { className: 'role-handoff__icon-glyph' }, ['→']),
      ]),
      el('p', { className: 'role-handoff__label' }, ['Pass the device to']),
      el('h1', { className: 'role-handoff__name' }, [player.name]),
      el('p', { className: 'role-handoff__hint' }, ['Make sure nobody else can see your screen.']),
      el('div', { className: 'role-handoff__dots' }, dots),
    ]),
    el('div', { className: 'screen__footer' }, [revealBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}