import { el, clear } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { createChit } from '../components/chit.js?v=20261015-gamefeel-v2';
import { createRoleDetail } from '../components/role-card.js?v=20261015-gamefeel-v2';
import { GAME_PHASES, ROLE_META } from '../../app/config.js?v=20261015-gamefeel-v2';
import { audioManager } from '../../audio/audio-manager.js';
import { shouldAnimate } from '../../accessibility/reduced-motion.js';

/**
 * Private role reveal. The role is injected into the DOM only after the
 * player opens their chit, then fully removed when they acknowledge.
 */
export function RoleRevealScreen({ transition, state }) {
  const playerId = state.currentRevealPlayerId;
  const player = state.players.find(p => p.id === playerId);
  const role = state.getRoleFor(playerId);

  if (!player || !role) {
    queueMicrotask(() => transition(GAME_PHASES.DETECTIVE_HANDOFF));
    return { element: el('div', { className: 'screen' }), onEnter() {}, onExit() {} };
  }

  const meta = ROLE_META[role];
  let revealed = false;

  const acknowledgeBtn = createButton({
    label: 'I Understand — Hide Role',
    variant: 'primary',
    size: 'lg',
    icon: icons.lock,
    block: true,
    disabled: true,
    onClick: () => {
      // Mark this player as revealed and clear DOM content
      state.markPlayerRevealed(playerId);
      // Remove role content from DOM immediately
      clear(revealContainer);
      audioManager.play('button');
      if (state.allRolesRevealed) {
        transition(GAME_PHASES.DETECTIVE_HANDOFF);
      } else {
        transition(GAME_PHASES.ROLE_HANDOFF);
      }
    },
  });

  const revealContainer = el('div', { className: 'role-reveal__reveal' });

  const chit = createChit({
    onOpen: () => {
      if (revealed) return;
      revealed = true;
      audioManager.unlock();
      audioManager.play('chit-unfold');
      setTimeout(() => {
        audioManager.play('reveal');
        chit.content.appendChild(createRoleDetail(role));
        chit.element.classList.add('chit--revealed');
        acknowledgeBtn.disabled = false;
        acknowledgeBtn.focus();
      }, shouldAnimate() ? 500 : 0);
    },
  });

  revealContainer.appendChild(chit.element);

  const screen = el('div', { className: `screen role-reveal role-reveal--${meta.color} anim-screen-in` }, [
    el('header', { className: 'screen__header' }, [
      el('span', { className: 'badge' }, [player.name]),
    ]),
    el('div', { className: 'screen__body role-reveal__body' }, [
      el('p', { className: 'role-reveal__instruction' }, ['Open your chit to reveal your secret role.']),
      revealContainer,
      el('p', { className: 'role-reveal__warning' }, [
        el('span', { className: 'role-reveal__warning-icon' }, ['🔒']),
        ' Keep your role private. Do not show this screen to anyone.',
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [acknowledgeBtn]),
  ]);

  return {
    element: screen,
    onEnter() {
      // Ensure no stale role content
      clear(revealContainer);
      revealContainer.appendChild(chit.element);
    },
    onExit() {
      // Clear role content on exit to prevent leakage into next screen
      clear(revealContainer);
    },
  };
}