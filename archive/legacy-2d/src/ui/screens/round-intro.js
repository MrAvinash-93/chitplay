import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js?v=20261015-gamefeel-v2';
import { GAME_PHASES } from '../../app/config.js?v=20261015-gamefeel-v2';
import { showModal } from '../components/modal.js';
import { createRoleIcon } from '../components/role-card.js?v=20261015-gamefeel-v2';

export function RoundIntroScreen({ transition, state }) {
  const round = state.roundNumber + 1;
  const isFirstRound = round === 1;

  function begin() {
    state.startRound();
    transition(GAME_PHASES.ROLE_HANDOFF);
  }

  const beginBtn = createButton({
    label: isFirstRound ? 'Begin Round 1' : `Begin Round ${round}`,
    variant: 'primary',
    size: 'lg',
    icon: icons.arrowRight,
    iconPosition: 'right',
    block: true,
    onClick: begin,
  });

  const exitBtn = el('button', {
    className: 'icon-btn',
    type: 'button',
    attrs: { 'aria-label': 'End match and return home' },
    onClick: () => {
      showModal({
        title: 'End match?',
        body: 'Current scores will be lost.',
        confirmLabel: 'End Match',
        cancelLabel: 'Continue',
        variant: 'danger',
        onConfirm: () => {
          state.matchRound = 0;
          state.matchStartedAt = null;
          transition(GAME_PHASES.HOME);
        },
      });
    },
  }, [icons.back()]);

  const screen = el('div', { className: 'screen round-intro anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      exitBtn,
      el('span', { className: 'badge' }, [`Round ${round} of ${state.matchRounds}`]),
      el('div', { style: { width: '44px' } }),
    ]),
    el('div', { className: 'screen__body round-intro__body' }, [
      el('div', { className: 'round-intro__emblem' }, [
        el('span', { className: 'round-intro__emblem-icon' }, ['✦']),
      ]),
      el('h1', { className: 'round-intro__title' }, [isFirstRound ? 'The Game Begins' : `Round ${round}`]),
      el('p', { className: 'round-intro__desc' }, [
        'A cheat is hiding among the royals. Take the device in turn, peek at your secret chit, then keep a straight face until the Detective makes a call.',
      ]),
      el('div', { className: 'round-intro__roles-preview' }, [
        ...Object.entries({ king: 'King', queen: 'Queen', detective: 'Detective', thief: 'Cheat' })
          .map(([role, name]) => el('span', { className: `role-chip role-chip--${role}` }, [
            el('span', { className: 'role-chip__icon', attrs: { 'aria-hidden': 'true' } }, [createRoleIcon(role)]),
            name,
          ])),
      ]),
      el('div', { className: 'round-intro__privacy' }, [
        el('span', { className: 'round-intro__privacy-icon' }, ['👁']),
        ' Make sure nobody else can see your screen when your turn comes.',
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [beginBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}