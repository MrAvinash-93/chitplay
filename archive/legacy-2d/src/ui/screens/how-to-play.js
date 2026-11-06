import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { icons } from '../components/icons.js';
import { GAME_PHASES, ROLE_META, ROLES } from '../../app/config.js?v=20261015-gamefeel-v2';
import { createRoleCard, createRoleIcon } from '../components/role-card.js?v=20261015-gamefeel-v2';

export function HowToPlayScreen({ transition }) {
  const backBtn = createButton({
    label: 'Back',
    variant: 'secondary',
    icon: icons.back,
    block: true,
    onClick: () => transition(GAME_PHASES.HOME),
  });

  const sections = [
    {
      title: '1. Set Up',
      body: 'Enter four player names. Each player will take the device in turn to view their secret role.',
    },
    {
      title: '2. View Your Role',
      body: 'Pass the device around. Each player opens their folded chit privately. Keep your role secret!',
    },
    {
      title: '3. The Detective Investigates',
      body: 'After everyone has seen their role, the Detective takes the device and accuses one suspect.',
    },
    {
      title: '4. Reveal & Score',
      body: 'All roles are revealed. Points are awarded based on the outcome.',
    },
  ];

  const screen = el('div', { className: 'screen how-to-play anim-screen-in' }, [
    el('header', { className: 'screen__header' }, [
      el('h1', { className: 'screen__heading' }, ['How to Play']),
    ]),
    el('div', { className: 'screen__body how-to-play__body' }, [
      el('div', { className: 'how-to-play__roles' }, [
        createRoleCard(ROLES.KING, { compact: true }),
        createRoleCard(ROLES.QUEEN, { compact: true }),
        createRoleCard(ROLES.DETECTIVE, { compact: true }),
        createRoleCard(ROLES.THIEF, { compact: true }),
      ]),
      ...sections.map(s => el('div', { className: 'how-to-play__section card' }, [
        el('h2', { className: 'card__title' }, [s.title]),
        el('p', { className: 'card__subtitle' }, [s.body]),
      ])),
      el('div', { className: 'how-to-play__scoring card' }, [
        el('h2', { className: 'card__title' }, ['Scoring']),
        el('ul', { className: 'how-to-play__score-list' }, [
          ...[
            [ROLES.KING, 'King — 1000 points every completed round'],
            [ROLES.QUEEN, 'Queen — 800 points every completed round'],
            [ROLES.DETECTIVE, 'Detective — 500 points if correct, 0 if wrong'],
            [ROLES.THIEF, 'Cheat — 1000 points if you fool the Detective, 0 if caught'],
          ].map(([role, label]) => el('li', { className: `how-to-play__score-item how-to-play__score-item--${ROLE_META[role].color}` }, [
            el('span', { className: 'how-to-play__score-icon', attrs: { 'aria-hidden': 'true' } }, [createRoleIcon(role)]),
            label,
          ])),
        ]),
      ]),
    ]),
    el('div', { className: 'screen__footer' }, [backBtn]),
  ]);

  return { element: screen, onEnter() {}, onExit() {} };
}