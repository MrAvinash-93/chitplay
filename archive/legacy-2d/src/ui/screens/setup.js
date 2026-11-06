import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES, AVATAR_COLORS, PLAYER_COUNT } from '../../app/config.js';
import { validatePlayers, MAX_NAME_LENGTH } from '../../core/validation.js';
import { matchStore } from '../../persistence/match-store.js';
import { showModal } from '../components/modal.js';
import { notify } from '../overlays/notifications.js';

let nextId = 1;
const genId = () => `p_${nextId++}_${Date.now().toString(36)}`;

export function SetupScreen({ transition, state }) {
  const saved = matchStore.getSavedPlayerNames() || [];
  const initialPlayers = Array.from({ length: PLAYER_COUNT }, (_, i) => ({
    id: genId(),
    name: saved[i] || `Player ${i + 1}`,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  let players = initialPlayers.map(p => ({ ...p }));
  const inputs = [];

  function updatePlayer(index, updates) {
    players[index] = { ...players[index], ...updates };
  }

  function validateAndGetErrors() {
    const errors = {};
    const names = [];
    for (let i = 0; i < players.length; i++) {
      const trimmed = players[i].name.trim();
      if (!trimmed) { errors[i] = 'Name required'; continue; }
      if (trimmed.length > MAX_NAME_LENGTH) { errors[i] = `Max ${MAX_NAME_LENGTH} chars`; continue; }
      const lower = trimmed.toLowerCase();
      if (names.includes(lower)) { errors[i] = 'Name must be unique'; continue; }
      names.push(lower);
    }
    return errors;
  }

  function refreshErrors() {
    const errors = validateAndGetErrors();
    let firstError = null;
    inputs.forEach((input, i) => {
      const errorEl = input.parentElement.querySelector('.field__error');
      if (errors[i]) {
        input.classList.add('input--error');
        errorEl.textContent = errors[i];
        if (!firstError) firstError = input;
      } else {
        input.classList.remove('input--error');
        errorEl.textContent = '';
      }
    });
    startBtn.disabled = Object.keys(errors).length > 0;
    return errors;
  }

  function renderField(player, index) {
    const input = el('input', {
      className: 'input',
      type: 'text',
      value: player.name,
      maxlength: String(MAX_NAME_LENGTH),
      placeholder: `Player ${index + 1} name`,
      attrs: {
        'aria-label': `Player ${index + 1} name`,
        'autocomplete': 'off',
        'spellcheck': 'false',
      },
      onInput: (e) => {
        updatePlayer(index, { name: e.target.value });
        refreshErrors();
      },
    });
    inputs[index] = input;

    const colorDots = AVATAR_COLORS.map((c) => el('button', {
      className: `color-dot${player.color?.id === c.id ? ' color-dot--active' : ''}`,
      type: 'button',
      attrs: { 'aria-label': `Color ${c.id}`, 'aria-pressed': String(player.color?.id === c.id) },
      style: { '--dot-color': c.hex },
      onClick: () => {
        updatePlayer(index, { color: c });
        colorDots.forEach((dot, ci) => {
          dot.classList.toggle('color-dot--active', AVATAR_COLORS[ci].id === c.id);
          dot.setAttribute('aria-pressed', String(AVATAR_COLORS[ci].id === c.id));
        });
      },
    }));

    return el('div', { className: 'setup__field field' }, [
      el('label', { className: 'field__label', attrs: { for: `player-${index}` } }, [`Player ${index + 1}`]),
      el('div', { className: 'setup__field-row' }, [
        el('div', { className: 'setup__avatar-preview', style: { '--avatar-color': player.color?.hex || '#d4a017' } }, [
          el('span', { className: 'setup__avatar-initial' }, [(player.name.trim()[0] || '?').toUpperCase()]),
        ]),
        el('div', { className: 'setup__input-wrap' }, [input, el('div', { className: 'field__error' })]),
      ]),
      el('div', { className: 'setup__colors' }, [el('span', { className: 'setup__colors-label' }, ['Color']), ...colorDots]),
    ]);
  }

  function buildPlayerFields() {
    return players.map((p, i) => renderField(p, i));
  }

  let startBtn;

  function startMatch() {
    const errors = validateAndGetErrors();
    if (Object.keys(errors).length > 0) {
      refreshErrors();
      notify('Please fix the highlighted names', { type: 'error' });
      return;
    }
    const finalPlayers = players.map(p => ({
      ...p,
      name: p.name.trim(),
    }));
    state.setPlayers(finalPlayers);
    matchStore.savePlayerNames(finalPlayers.map(p => p.name));
    transition(GAME_PHASES.ROUND_INTRO);
  }

  startBtn = createButton({
    label: 'Start Match',
    variant: 'primary',
    size: 'lg',
    icon: icons.play,
    iconPosition: 'right',
    block: true,
    onClick: startMatch,
    disabled: false,
  });

  const backBtn = el('button', {
    className: 'icon-btn',
    type: 'button',
    attrs: { 'aria-label': 'Back to home' },
    onClick: () => {
      showModal({
        title: 'Leave setup?',
        body: 'Your entered names will be lost.',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
        variant: 'danger',
        onConfirm: () => transition(GAME_PHASES.HOME),
      });
    },
  }, [icons.back()]);

  const screen = el('div', { className: 'screen setup anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      backBtn,
      el('h1', { className: 'screen__heading' }, ['Player Setup']),
      el('div', { style: { width: '44px' } }),
    ]),
    el('div', { className: 'screen__body setup__body' }, [
      el('p', { className: 'setup__intro' }, ['Enter four player names. Each round, roles are secretly assigned.']),
      el('div', { className: 'setup__grid' }, buildPlayerFields()),
    ]),
    el('div', { className: 'screen__footer' }, [
      el('p', { className: 'setup__privacy-note' }, [
        el('span', { className: 'setup__privacy-icon' }, ['🔒']),
        ' Pass-and-play privacy depends on players keeping their roles secret.',
      ]),
      startBtn,
    ]),
  ]);

  return {
    element: screen,
    onEnter() { refreshErrors(); },
    onExit() {},
  };
}