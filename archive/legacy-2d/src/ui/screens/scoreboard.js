import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js';
import { rankPlayers } from '../../core/scoring-engine.js';
import { matchStore } from '../../persistence/match-store.js';
import { showModal } from '../components/modal.js';
import { audioManager } from '../../audio/audio-manager.js';
import { formatDuration } from '../../utils/format.js';

export function ScoreboardScreen({ transition, state }) {
  const ranked = rankPlayers(state.players, state.totals);
  const winner = ranked[0];
  const matchComplete = state.isMatchComplete;

  // Record match result if complete (once)
  if (matchComplete && !state.__recorded) {
    state.__recorded = true;
    matchStore.recordMatchResult({
      players: state.players,
      totals: state.totals,
      rounds: state.matchRound,
      correctGuess: state.lastResult?.detectiveGuessedCorrectly ?? false,
      thiefEscaped: !(state.lastResult?.detectiveGuessedCorrectly ?? false),
      winner,
    });
    audioManager.play('victory');
  }

  const rows = ranked.map((p, i) => {
    const roundPts = state.roundScores[p.id] || 0;
    const total = p.total;
    const isWinner = i === 0 && matchComplete;
    return el('div', {
      className: `scoreboard-row${isWinner ? ' scoreboard-row--winner anim-winner-pulse' : ''}`,
      style: { animationDelay: `${i * 80}ms` },
    }, [
      el('div', { className: `scoreboard-row__rank${p.rank <= 3 ? ' scoreboard-row__rank--medal' : ''}` }, [
        p.rank <= 3
          ? el('span', {
            className: `scoreboard-row__medal scoreboard-row__medal--${['gold', 'silver', 'bronze'][p.rank - 1]}`,
            attrs: { 'aria-label': `Rank ${p.rank}` },
          }, [icons[['medalGold', 'medalSilver', 'medalBronze'][p.rank - 1]]()])
          : el('span', { className: 'scoreboard-row__rank-num' }, [String(p.rank)]),
      ]),
      el('div', { className: 'scoreboard-row__avatar', style: { '--avatar-color': p.color?.hex || '#d4a017' } }, [
        (p.name[0] || '?').toUpperCase(),
      ]),
      el('div', { className: 'scoreboard-row__info' }, [
        el('div', { className: 'scoreboard-row__name' }, [p.name]),
        p.isTied ? el('div', { className: 'scoreboard-row__tie' }, ['Tied']) : null,
        roundPts > 0 ? el('div', { className: 'scoreboard-row__round' }, [`+${roundPts} this round`]) : null,
      ]),
      el('div', { className: 'scoreboard-row__total' }, [
        el('span', { className: 'scoreboard-row__total-value' }, [String(total)]),
        el('span', { className: 'scoreboard-row__total-label' }, ['pts']),
      ]),
    ]);
  });

  const nextBtn = createButton({
    label: matchComplete ? 'Finish Match' : 'Next Round',
    variant: 'primary',
    size: 'lg',
    icon: icons.arrowRight,
    iconPosition: 'right',
    block: true,
    onClick: () => {
      if (matchComplete) {
        transition(GAME_PHASES.GAME_OVER);
      } else {
        transition(GAME_PHASES.ROUND_INTRO);
      }
    },
  });

  const homeBtn = createButton({
    label: 'End Match & Home',
    variant: 'ghost',
    block: true,
    onClick: () => {
      showModal({
        title: 'End the match?',
        body: 'You will return to the home screen. Scores will be lost.',
        confirmLabel: 'End Match',
        cancelLabel: 'Continue Playing',
        variant: 'danger',
        onConfirm: () => {
          state.__recorded = true;
          state.matchRound = 0;
          state.matchStartedAt = null;
          transition(GAME_PHASES.HOME);
        },
      });
    },
  });

  const duration = state.matchStartedAt ? formatDuration(state.matchDurationMs) : '0s';

  const screen = el('div', { className: 'screen scoreboard anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, matchComplete ? 'Final Score' : `Round ${state.matchRound} of ${state.matchRounds}`),
      el('span', { className: 'scoreboard__duration' }, [duration]),
    ]),
    el('div', { className: 'screen__body scoreboard__body' }, [
      matchComplete ? el('div', { className: 'scoreboard__trophy' }, [icons.trophy()]) : null,
      el('h1', { className: 'scoreboard__title' }, [matchComplete ? `${winner.name} Wins!` : 'Scoreboard']),
      matchComplete && winner.isTied ? el('p', { className: 'scoreboard__tie-note' }, ['Tied match — shared victory']) : null,
      el('div', { className: 'scoreboard__list' }, rows),
    ]),
    el('div', { className: 'screen__footer' }, [nextBtn, homeBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}