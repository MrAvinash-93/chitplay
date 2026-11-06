import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES } from '../../app/config.js';
import { settingsStore } from '../../persistence/settings-store.js?v=20261014-profile-v4';
import { matchStore } from '../../persistence/match-store.js';
import { showModal } from '../components/modal.js';
import { audioManager } from '../../audio/audio-manager.js';
import { notify } from '../overlays/notifications.js';

function toggleRow({ label, description, key, onChange }) {
  const current = settingsStore.get(key);
  const track = el('button', {
    className: `toggle${current ? ' toggle--on' : ''}`,
    type: 'button',
    attrs: { role: 'switch', 'aria-checked': String(current), 'aria-label': label },
    onClick: () => {
      const next = !settingsStore.get(key);
      settingsStore.set(key, next);
      track.classList.toggle('toggle--on', next);
      track.setAttribute('aria-checked', String(next));
      if (key === 'soundEnabled') {
        audioManager.setEnabled(next);
        if (next) { audioManager.unlock(); audioManager.play('select'); }
      }
      onChange?.(next);
    },
  }, [el('span', { className: 'toggle__thumb' })]);

  return el('div', { className: 'settings__row' }, [
    el('div', { className: 'settings__row-info' }, [
      el('div', { className: 'settings__row-label' }, [label]),
      description ? el('div', { className: 'settings__row-desc' }, [description]) : null,
    ]),
    track,
  ]);
}

export function SettingsScreen({ transition }) {
  const profileName = el('input', {
    className: 'input',
    type: 'text',
    maxlength: '20',
    attrs: { 'aria-label': 'Player name', autocomplete: 'nickname', maxlength: '20' },
    value: settingsStore.get('playerName'),
  });

  const saveProfileBtn = createButton({
    label: 'Save Player Name',
    variant: 'secondary',
    onClick: () => {
      const name = profileName.value.trim();
      if (!name) {
        notify('Player name cannot be empty', { type: 'error' });
        profileName.focus();
        return;
      }
      settingsStore.set('playerName', name);
      notify('Player name saved', { type: 'success' });
    },
  });

  const backBtn = createButton({
    label: 'Back',
    variant: 'secondary',
    icon: icons.back,
    block: true,
    onClick: () => transition(GAME_PHASES.HOME),
  });

  const resetBtn = createButton({
    label: 'Reset All Data',
    variant: 'danger',
    block: true,
    onClick: () => {
      showModal({
        title: 'Reset all data?',
        body: 'This clears settings, statistics, and saved names. This cannot be undone.',
        confirmLabel: 'Reset Everything',
        cancelLabel: 'Cancel',
        variant: 'danger',
        onConfirm: () => {
          settingsStore.reset();
          matchStore.resetAll();
          notify('All data reset', { type: 'success' });
          transition(GAME_PHASES.HOME);
        },
      });
    },
  });

  const matchRoundsControl = (() => {
    const current = settingsStore.get('matchRounds');
    const options = [3, 5, 7];
    return el('div', { className: 'settings__row' }, [
      el('div', { className: 'settings__row-info' }, [
        el('div', { className: 'settings__row-label' }, ['Rounds per Match']),
        el('div', { className: 'settings__row-desc' }, ['How many rounds before the match ends']),
      ]),
      el('div', { className: 'settings__pill-group' }, options.map(n => el('button', {
        className: `settings__pill${current === n ? ' settings__pill--active' : ''}`,
        type: 'button',
        attrs: { 'aria-pressed': String(current === n) },
        onClick: () => {
          settingsStore.set('matchRounds', n);
          document.querySelectorAll('.settings__pill').forEach((pill, i) => {
            const isActive = options[i] === n;
            pill.classList.toggle('settings__pill--active', isActive);
            pill.setAttribute('aria-pressed', String(isActive));
          });
        },
      }, [String(n)]))),
    ]);
  })();

  const screen = el('div', { className: 'screen settings anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('h1', { className: 'screen__heading' }, ['Settings']),
    ]),
    el('div', { className: 'screen__body settings__body' }, [
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Player Profile']),
        el('p', { className: 'card__subtitle' }, ['Your name is saved on this device and used automatically when hosting or joining a phone game.']),
        profileName,
        saveProfileBtn,
      ]),
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Audio']),
        toggleRow({ label: 'Sound Effects', description: 'Play sounds during the game', key: 'soundEnabled' }),
      ]),
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Nostalgia']),
        toggleRow({ label: '3D Bachpan Room', description: 'Chatai, ceiling fan, power cuts — the 3D room behind the game', key: 'world3d' }),
        toggleRow({ label: 'VHS Camcorder Filter', description: 'Grain, scanlines and a 1998 date stamp', key: 'vhsFilter' }),
      ]),
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Motion']),
        toggleRow({ label: 'Reduce Motion', description: 'Minimize animations and transitions', key: 'reducedMotion' }),
        toggleRow({ label: 'Enable Animations', description: 'Play chit unfolding and reveal effects', key: 'animationsEnabled' }),
      ]),
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Match']),
        matchRoundsControl,
      ]),
      el('div', { className: 'settings__group card' }, [
        el('h2', { className: 'card__title' }, ['Data']),
        el('p', { className: 'card__subtitle', style: { marginBottom: '16px' } }, [
          'ChitPlay stores only your preferences and local match statistics on this device. No data is sent anywhere.',
        ]),
        resetBtn,
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [backBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}