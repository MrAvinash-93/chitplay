import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js?v=20261015-gamefeel-v2';
import { GAME_PHASES } from '../../app/config.js?v=20261105-story';
import { audioManager } from '../../audio/audio-manager.js';
import { settingsStore } from '../../persistence/settings-store.js?v=20261014-profile-v4';
import { notify } from '../overlays/notifications.js';
import { createCharacter } from '../components/character.js?v=20261015-gamefeel-v2';

export function HomeScreen({ transition, state }) {
  const soundOn = settingsStore.get('soundEnabled');

  const emblem = el('div', { className: 'home__emblem', attrs: { 'aria-hidden': 'true' } }, [
    el('div', { className: 'home__emblem-ring' }),
    el('div', { className: 'home__character-scene' }, [
      createCharacter('detective', { className: 'home__character home__character--detective' }),
      createCharacter('thief', { className: 'home__character home__character--thief', mood: 'sneaky' }),
      el('span', { className: 'home__scene-spark', attrs: { 'aria-hidden': 'true' } }, ['?']),
    ]),
  ]);

  const wordmark = el('div', { className: 'home__wordmark' }, [
    el('h1', { className: 'home__title' }, ['ChitPlay']),
    el('p', { className: 'home__tagline' }, ['Fold the chit. Catch the cheat.']),
    el('span', { className: 'home__nostalgia' }, ['☀️ Garmiyon ki chhutti edition · 1998']),
  ]);

  const bachpanBtn = createButton({
    label: '🎬 3D Bachpan Mode',
    variant: 'primary',
    size: 'lg',
    className: 'home__bachpan',
    onClick: () => transition(GAME_PHASES.BACHPAN),
  });

  const playBtn = createButton({
    label: 'Play Local',
    variant: 'secondary',
    size: 'lg',
    icon: icons.play,
    onClick: () => transition(GAME_PHASES.PLAYER_SETUP),
  });

  const multiplayerBtn = createButton({
    label: 'Play on 4 Phones',
    variant: 'secondary',
    size: 'lg',
    icon: icons.users,
    onClick: () => transition(GAME_PHASES.MULTIPLAYER),
  });

  const howBtn = createButton({
    label: 'How to Play',
    variant: 'secondary',
    icon: icons.book,
    onClick: () => transition(GAME_PHASES.HOW_TO_PLAY),
  });

  const settingsBtn = createButton({
    label: 'Settings',
    variant: 'ghost',
    icon: icons.gear,
    onClick: () => transition(GAME_PHASES.SETTINGS),
  });

  const soundToggle = el('button', {
    className: 'icon-btn home__sound',
    type: 'button',
    attrs: { 'aria-label': soundOn ? 'Mute sound' : 'Unmute sound', 'aria-pressed': String(soundOn) },
    onClick: () => {
      const next = !settingsStore.get('soundEnabled');
      settingsStore.set('soundEnabled', next);
      audioManager.setEnabled(next);
      if (next) { audioManager.unlock(); audioManager.play('select'); }
      notify(next ? 'Sound on' : 'Sound off', { duration: 1500 });
      soundToggle.replaceWith(createSoundToggle(next));
    },
  }, [(soundOn ? icons.soundOn : icons.soundOff)()]);

  function createSoundToggle(isOn) {
    const btn = el('button', {
      className: 'icon-btn home__sound',
      type: 'button',
      attrs: { 'aria-label': isOn ? 'Mute sound' : 'Unmute sound', 'aria-pressed': String(isOn) },
      onClick: () => {
        const next = !settingsStore.get('soundEnabled');
        settingsStore.set('soundEnabled', next);
        audioManager.setEnabled(next);
        if (next) { audioManager.unlock(); audioManager.play('select'); }
        notify(next ? 'Sound on' : 'Sound off', { duration: 1500 });
        btn.replaceWith(createSoundToggle(next));
      },
    }, [(isOn ? icons.soundOn : icons.soundOff)()]);
    return btn;
  }

  const screen = el('div', { className: 'screen home anim-screen-in' }, [
    el('div', { className: 'home__top' }, [soundToggle]),
    el('div', { className: 'home__hero' }, [emblem, wordmark]),
    el('div', { className: 'home__actions' }, [bachpanBtn, playBtn, multiplayerBtn, howBtn, settingsBtn]),
    el('div', { className: 'home__footer' }, [
      el('span', { className: 'home__version' }, ['v1.0 · Local & Phone Play']),
    ]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}