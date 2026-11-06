import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js?v=20261015-gamefeel-v2';

/**
 * Private handoff before the Detective's turn. Reveals only the
 * Detective's identity, never any other role.
 */
export function DetectiveHandoffScreen({ transition, state }) {
  const detectiveId = state.detectivePlayerId;
  const detective = state.players.find(p => p.id === detectiveId);

  const btn = createButton({
    label: `I am ${detective?.name || 'Detective'} — Investigate`,
    variant: 'primary',
    size: 'lg',
    icon: icons.magnifier,
    block: true,
    onClick: () => transition(GAME_PHASES.GUESS_SELECTION),
  });

  const screen = el('div', { className: 'screen detective-handoff anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, ['Detective Phase']),
    ]),
    el('div', { className: 'screen__body detective-handoff__body' }, [
      el('div', { className: 'detective-handoff__icon' }, [icons.magnifier()]),
      el('p', { className: 'detective-handoff__label' }, ['Pass the device to the']),
      el('h1', { className: 'detective-handoff__title' }, ['Detective']),
      el('p', { className: 'detective-handoff__name' }, [detective?.name || '']),
      el('p', { className: 'detective-handoff__hint' }, [
        'You must identify the Cheat. Make sure nobody else can see your screen.',
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [btn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}