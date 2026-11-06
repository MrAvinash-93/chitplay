import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { createPlayerCard } from '../components/player-card.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js?v=20261015-gamefeel-v2';
import { showModal } from '../components/modal.js';

export function GuessConfirmationScreen({ transition, state }) {
  const suspectId = state.detectiveGuessPlayerId;
  const suspect = state.players.find(p => p.id === suspectId);

  const confirmBtn = createButton({
    label: 'Lock In Accusation',
    variant: 'primary',
    size: 'lg',
    icon: icons.lock,
    block: true,
    onClick: () => {
      showModal({
        title: 'Lock in your accusation?',
        body: `You are accusing ${suspect?.name}. This cannot be changed.`,
        confirmLabel: 'Lock In',
        cancelLabel: 'Go Back',
        variant: 'primary',
        onConfirm: () => transition(GAME_PHASES.RESULT_REVEAL),
        onCancel: () => {},
      });
    },
  });

  const backBtn = createButton({
    label: 'Change Suspect',
    variant: 'ghost',
    icon: icons.back,
    block: true,
    onClick: () => transition(GAME_PHASES.GUESS_SELECTION),
  });

  const screen = el('div', { className: 'screen guess-confirmation anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, ['Confirm']),
    ]),
    el('div', { className: 'screen__body guess-confirmation__body' }, [
      el('div', { className: 'guess-confirmation__icon' }, [icons.magnifier()]),
      el('h1', { className: 'guess-confirmation__title' }, ['Your Accusation']),
      el('p', { className: 'guess-confirmation__subtitle' }, ['You believe the Cheat is:']),
      el('div', { className: 'guess-confirmation__card' }, [
        createPlayerCard(suspect, { selected: true }),
      ]),
      el('p', { className: 'guess-confirmation__warning' }, [
        'Once locked in, the roles will be revealed.',
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [confirmBtn, backBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}