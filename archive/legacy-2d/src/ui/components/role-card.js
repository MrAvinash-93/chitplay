import { el } from '../../utils/dom.js';
import { ROLE_META } from '../../app/config.js?v=20261015-gamefeel-v2';
import { icons } from './icons.js?v=20261015-gamefeel-v2';
import { createCharacter } from './character.js?v=20261015-gamefeel-v2';

const ICON_MAP = {
  crown: icons.crown,
  'queen-crown': icons.queenCrown,
  policeBadge: icons.policeBadge,
  magnifier: icons.magnifier,
  mask: icons.mask,
};

export function createRoleIcon(role) {
  const meta = ROLE_META[role];
  if (!meta) return icons.crown();
  return (ICON_MAP[meta.icon] || icons.crown)();
}

export function createRoleCard(role, { revealed = true, compact = false } = {}) {
  const meta = ROLE_META[role];
  if (!meta) return el('div');

  const card = el('div', {
    className: `role-card role-card--${meta.color}${compact ? ' role-card--compact' : ''}${revealed ? ' role-card--revealed' : ''}`,
    attrs: { 'data-role': role },
  }, [
    el('div', { className: 'role-card__icon' }, [createRoleIcon(role)]),
    el('div', { className: 'role-card__name' }, [meta.name]),
    el('div', { className: 'role-card__tagline' }, [meta.tagline]),
  ]);

  return card;
}

export function createRoleDetail(role) {
  const meta = ROLE_META[role];
  return el('div', { className: `role-detail role-detail--${meta.color}` }, [
    createCharacter(meta.color, { className: 'role-detail__character', mood: meta.color === 'thief' ? 'sneaky' : 'curious' }),
    el('div', { className: 'role-detail__icon anim-role-icon' }, [createRoleIcon(role)]),
    el('h2', { className: 'role-detail__name' }, [meta.name]),
    el('p', { className: 'role-detail__tagline' }, [meta.tagline]),
    el('p', { className: 'role-detail__desc' }, [meta.description]),
    el('div', { className: 'role-detail__points' }, [
      el('span', { className: 'role-detail__points-label' }, ['Scoring']),
      el('span', { className: 'role-detail__points-value' }, [meta.pointsLabel]),
    ]),
  ]);
}