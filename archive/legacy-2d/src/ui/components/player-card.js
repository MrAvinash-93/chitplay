import { el } from '../../utils/dom.js';

/**
 * Player representation used in setup, guess selection, and scoreboard.
 * Role is NEVER shown unless explicitly revealed by the caller.
 */
export function createPlayerCard(player, {
  selectable = false,
  selected = false,
  disabled = false,
  onClick,
  showScore = null,
  rank = null,
  winner = false,
  showAvatar = true,
} = {}) {
  const classes = ['player-card'];
  if (selectable) classes.push('player-card--selectable');
  if (selected) classes.push('player-card--selected');
  if (disabled) classes.push('player-card--disabled');
  if (winner) classes.push('player-card--winner');

  const children = [];

  if (showAvatar) {
    const avatar = el('div', {
      className: 'player-card__avatar',
      style: { '--avatar-color': player.color?.hex || '#d4a017' },
    }, [
      el('span', { className: 'player-card__avatar-initial' }, [player.name?.[0]?.toUpperCase() || '?']),
    ]);
    children.push(avatar);
  }

  children.push(el('div', { className: 'player-card__info' }, [
    el('div', { className: 'player-card__name' }, [player.name || 'Player']),
    rank != null ? el('div', { className: 'player-card__rank' }, [`Rank ${rank}`]) : null,
  ]));

  if (showScore != null) {
    children.push(el('div', { className: 'player-card__score' }, [
      el('span', { className: 'player-card__score-value' }, [String(showScore)]),
      el('span', { className: 'player-card__score-label' }, ['pts']),
    ]));
  }

  const card = el(selectable ? 'button' : 'div', {
    className: classes.join(' '),
    type: selectable ? 'button' : undefined,
    disabled: selectable ? disabled : undefined,
    attrs: {
      'aria-pressed': selectable ? String(selected) : undefined,
      'aria-label': selectable ? `Select ${player.name}` : undefined,
    },
    onClick: selectable && !disabled ? () => onClick?.(player) : undefined,
  }, children);

  return card;
}