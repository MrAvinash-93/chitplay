import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { createRoleIcon } from '../components/role-card.js?v=20261015-gamefeel-v2';
import { icons } from '../components/icons.js';
import { GAME_PHASES, ROLE_META, ROLES } from '../../app/config.js?v=20261015-gamefeel-v2';
import { audioManager } from '../../audio/audio-manager.js';
import { shouldAnimate } from '../../accessibility/reduced-motion.js';

export function ResultRevealScreen({ transition, state }) {
  // Finalize the round exactly once
  const result = state.finalizeRound();
  const { detectiveGuessedCorrectly, thiefPlayerId, detectivePlayerId } = state.lastResult;

  const thief = state.players.find(p => p.id === thiefPlayerId);
  const detective = state.players.find(p => p.id === detectivePlayerId);

  const headline = detectiveGuessedCorrectly ? 'Cheat Caught!' : 'Cheat Escaped!';
  const subline = detectiveGuessedCorrectly
    ? `${detective?.name} correctly identified the Cheat, ${thief?.name}.`
    : `${detective?.name} accused the wrong player. ${thief?.name} fooled them and escaped!`;

  // Role reveal list — all four players with their roles
  const roleRows = state.players.map((p, i) => {
    const role = state.getRoleFor(p.id);
    const meta = ROLE_META[role];
    const points = state.roundScores[p.id] || 0;
    const isThief = p.id === thiefPlayerId;
    const isDetective = p.id === detectivePlayerId;

    return el('div', {
      className: `result-row result-row--${meta.color}${isThief ? ' result-row--thief' : ''}`,
      style: { animationDelay: shouldAnimate() ? `${i * 120}ms` : '0ms' },
    }, [
      el('div', { className: 'result-row__player' }, [
        el('span', { className: 'result-row__avatar', style: { '--avatar-color': p.color?.hex || '#d4a017' } }, [
          (p.name[0] || '?').toUpperCase(),
        ]),
        el('span', { className: 'result-row__name' }, [p.name]),
      ]),
      el('div', { className: 'result-row__role' }, [
        el('span', { className: `result-row__role-badge role-badge--${meta.color}` }, [
          el('span', { className: 'result-row__role-icon', attrs: { 'aria-hidden': 'true' } }, [createRoleIcon(role)]),
          meta.name,
        ]),
      ]),
      el('div', { className: 'result-row__points' }, [
        el('span', { className: 'result-row__points-value' }, [`+${points}`]),
      ]),
    ]);
  });

  const continueBtn = createButton({
    label: 'View Scoreboard',
    variant: 'primary',
    size: 'lg',
    icon: icons.arrowRight,
    iconPosition: 'right',
    block: true,
    onClick: () => transition(GAME_PHASES.SCOREBOARD),
  });

  const screen = el('div', { className: `screen result-reveal ${detectiveGuessedCorrectly ? 'result-reveal--correct' : 'result-reveal--wrong'} anim-screen-in` }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, ['Round Result']),
    ]),
    el('div', { className: 'screen__body result-reveal__body' }, [
      el('div', { className: 'result-reveal__headline-wrap' }, [
        el('div', { className: 'result-reveal__icon' }, [
          el('span', { className: 'result-reveal__icon-glyph' }, [detectiveGuessedCorrectly ? '✓' : '✗']),
        ]),
        el('h1', { className: 'result-reveal__headline' }, [headline]),
        el('p', { className: 'result-reveal__subline' }, [subline]),
      ]),
      el('div', { className: 'result-reveal__list' }, roleRows),
    ]),
    el('div', { className: 'screen__footer' }, [continueBtn]),
  ]);

  // Play result sound after mount
  queueMicrotask(() => {
    audioManager.unlock();
    setTimeout(() => {
      audioManager.play(detectiveGuessedCorrectly ? 'correct' : 'wrong');
    }, shouldAnimate() ? 300 : 0);
  });

  return { element: screen, onEnter() {}, onExit() {} };
}