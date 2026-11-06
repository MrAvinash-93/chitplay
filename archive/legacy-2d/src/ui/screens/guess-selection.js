import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { createPlayerCard } from '../components/player-card.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js?v=20261015-gamefeel-v2';
import { audioManager } from '../../audio/audio-manager.js';
import { notify } from '../overlays/notifications.js';

export function GuessSelectionScreen({ transition, state }) {
  const detectiveId = state.detectivePlayerId;
  const suspects = state.players.filter(p => p.id !== detectiveId);

  let selectedId = null;

  const confirmBtn = createButton({
    label: 'Confirm Suspect',
    variant: 'primary',
    size: 'lg',
    icon: icons.magnifier,
    block: true,
    disabled: true,
    onClick: () => {
      if (!selectedId) {
        notify('Select a suspect first', { type: 'error' });
        return;
      }
      state.setDetectiveGuess(selectedId);
      transition(GAME_PHASES.GUESS_CONFIRMATION);
    },
  });

  function selectSuspect(playerId) {
    selectedId = playerId;
    audioManager.play('select');
    const cards = suspectList.querySelectorAll('.player-card');
    cards.forEach((card, i) => {
      const isSelected = suspects[i].id === playerId;
      card.classList.toggle('player-card--selected', isSelected);
      card.setAttribute('aria-pressed', String(isSelected));
    });
    confirmBtn.disabled = false;
  }

  const suspectList = el('div', { className: 'guess__suspects' },
    suspects.map((p) => createPlayerCard(p, {
      selectable: true,
      selected: false,
      onClick: (pl) => selectSuspect(pl.id),
    }))
  );

  const screen = el('div', { className: 'screen guess-selection anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, ['Investigation']),
    ]),
    el('div', { className: 'screen__body guess__body' }, [
      el('div', { className: 'guess__magnifier' }, [icons.magnifier()]),
      el('h1', { className: 'guess__title' }, ['Who is the Cheat?']),
      el('p', { className: 'guess__subtitle' }, ['Select one suspect. The Cheat is among them.']),
      suspectList,
    ]),
    el('div', { className: 'screen__footer' }, [confirmBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}