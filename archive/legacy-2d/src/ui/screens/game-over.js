import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js';
import { rankPlayers } from '../../core/scoring-engine.js';

export function GameOverScreen({ transition, state }) {
  const ranked = rankPlayers(state.players, state.totals);
  const winner = ranked[0];

  const playAgain = createButton({
    label: 'Play Again',
    variant: 'primary',
    size: 'lg',
    icon: icons.refresh,
    block: true,
    onClick: () => {
      state.matchRound = 0;
      state.__recorded = false;
      state.startMatch(state.matchRounds);
      transition(GAME_PHASES.ROUND_INTRO);
    },
  });

  const homeBtn = createButton({
    label: 'Return Home',
    variant: 'secondary',
    icon: icons.back,
    block: true,
    onClick: () => {
      state.matchRound = 0;
      state.matchStartedAt = null;
      state.__recorded = false;
      transition(GAME_PHASES.HOME);
    },
  });

  const screen = el('div', { className: 'screen game-over anim-screen-in' }, [
    el('div', { className: 'screen__body game-over__body' }, [
      el('div', { className: 'game-over__trophy' }, [icons.trophy()]),
      el('h1', { className: 'game-over__title' }, ['Match Complete']),
      el('p', { className: 'game-over__winner' }, [`${winner.name} wins with ${winner.total} points!`]),
      winner.isTied ? el('p', { className: 'game-over__tie' }, ['It was a tie!']) : null,
      el('div', { className: 'game-over__list' }, ranked.map((p, i) => el('div', {
        className: 'game-over__row',
      }, [
        el('span', { className: `game-over__rank game-over__rank--${p.rank <= 3 ? ['gold', 'silver', 'bronze'][p.rank - 1] : 'other'}`, attrs: { 'aria-label': `Rank ${p.rank}` } }, [
          p.rank <= 3
            ? icons[['medalGold', 'medalSilver', 'medalBronze'][p.rank - 1]]()
            : String(p.rank),
        ]),
        el('span', { className: 'game-over__name' }, [p.name]),
        el('span', { className: 'game-over__score' }, [`${p.total} pts`]),
      ]))),
    ]),
    el('div', { className: 'screen__footer' }, [playAgain, homeBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}