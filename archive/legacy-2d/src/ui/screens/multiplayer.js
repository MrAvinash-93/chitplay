import { el } from '../../utils/dom.js';
import { createButton } from '../components/button.js';
import { createRoleDetail, createRoleIcon } from '../components/role-card.js?v=20261015-gamefeel-v2';
import { icons } from '../components/icons.js';
import { GAME_PHASES, ROLE_META, DEFAULT_MATCH_ROUNDS } from '../../app/config.js?v=20261015-gamefeel-v2';
import { assignRoles } from '../../core/role-assignment.js';
import { computeRoundScores, applyScores, rankPlayers } from '../../core/scoring-engine.js';
import { PeerRoomGuest, PeerRoomHost } from '../../network/peer-room.js?v=20261015-gamefeel-v3';
import { settingsStore } from '../../persistence/settings-store.js?v=20261014-profile-v4';

export function MultiplayerScreen({ transition }) {
  const root = el('div', { className: 'screen screen--wide multiplayer anim-screen-in' });
  const model = {
    view: 'choice',
    role: null,
    roleVisible: false,
    ready: false,
    name: settingsStore.get('playerName'),
    joinCode: '',
    answerCode: '',
    inviteCode: '',
    error: '',
    status: '',
    host: null,
    guest: null,
    playerId: null,
    players: [],
    rounds: DEFAULT_MATCH_ROUNDS,
    round: 0,
    phase: 'lobby',
    assignment: [],
    disconnectedPlayers: new Set(),
    totals: {},
    roundScores: {},
    result: null,
    guessId: null,
    matchRounds: DEFAULT_MATCH_ROUNDS,
    creatingInvite: false,
    acceptingAnswer: false,
  };

  function closeAndGoHome() {
    model.view = 'choice';
    model.host?.close();
    model.guest?.close();
    model.host = null;
    model.guest = null;
    transition(GAME_PHASES.HOME);
  }

  function setError(error) {
    model.error = error?.message || String(error);
    render();
  }

  function alertBox(text, isError = false) {
    return text ? el('p', {
      className: `multiplayer__notice${isError ? ' multiplayer__notice--error' : ''}`,
      attrs: { role: isError ? 'alert' : 'status' },
    }, [text]) : null;
  }

  function inviteSteps() {
    return el('ol', { className: 'multiplayer__steps' }, [
      el('li', {}, ['Create a fresh invite for one guest and share it through WhatsApp.']),
      el('li', {}, ['Your friend opens ChitPlay on their phone, pastes the invite, and shares their answer code back.']),
      el('li', {}, ['Paste their answer here. Once they join, create a new invite for the next guest.']),
    ]);
  }

  function makeShell(title, subtitle, content, footer = []) {
    return el('div', { className: 'multiplayer__shell' }, [
      el('header', { className: 'screen__header' }, [
        model.host || model.guest ? null : el('button', {
          className: 'icon-btn',
          type: 'button',
          attrs: { 'aria-label': 'Return home' },
          onClick: closeAndGoHome,
        }, [icons.back()]),
        el('div', { className: 'multiplayer__heading' }, [
          el('h1', { className: 'screen__heading' }, [title]),
          subtitle ? el('p', { className: 'multiplayer__subtitle' }, [subtitle]) : null,
        ]),
        el('span', { className: 'multiplayer__header-icon', attrs: { 'aria-hidden': 'true' } }, [icons.users()]),
        model.host || model.guest ? createButton({
          label: model.host ? 'Close Room' : 'Disconnect',
          variant: 'danger',
          size: 'sm',
          icon: icons.close,
          onClick: closeAndGoHome,
        }) : null,
      ]),
      ...content.filter(Boolean),
      footer.length ? el('footer', { className: 'screen__footer' }, footer) : null,
    ]);
  }

  function startHost() {
    if (typeof RTCPeerConnection === 'undefined') {
      model.error = 'This browser does not support direct phone connections. Open ChitPlay in the latest Chrome or Safari.';
      render();
      return;
    }
    if (!isSecureContext && location.hostname !== 'localhost') {
      model.error = 'Phone connections require ChitPlay over HTTPS. Open the secure chitplay.com address and try again.';
      render();
      return;
    }
    model.name = settingsStore.get('playerName');
    model.playerId = 'host';
    model.players = [{ id: 'host', name: model.name, isHost: true }];
    model.totals = { host: 0 };
    model.view = 'host';
    model.host = new PeerRoomHost({
      onMessage: handleHostMessage,
      onChange: render,
      onError: message => { model.error = message; render(); },
    });
    model.error = '';
    render();
  }

  async function createInvite() {
    if (model.creatingInvite) return;
    model.creatingInvite = true;
    model.error = '';
    model.status = 'Preparing connection invite…';
    render();
    try {
      model.inviteCode = await model.host.createInvite();
      model.status = 'Invite ready. Share it with one friend, then connect their answer.';
    } catch (error) {
      model.error = error.message;
    } finally {
      model.creatingInvite = false;
      render();
    }
  }

  async function acceptAnswer() {
    if (model.acceptingAnswer) return;
    const answer = root.querySelector('[name="answer-code"]')?.value.trim() || '';
    model.acceptingAnswer = true;
    model.status = 'Connecting guest…';
    render();
    try {
      await model.host.acceptAnswer(answer);
      model.answerCode = '';
      model.error = '';
      model.status = 'Answer accepted. Waiting for that phone to join…';
    } catch (error) {
      model.error = error.message;
    } finally {
      model.acceptingAnswer = false;
      render();
    }
  }

  async function cancelCurrentInvite() {
    if (!model.inviteCode || model.acceptingAnswer) return;
    model.acceptingAnswer = true;
    model.error = '';
    try {
      await model.host.cancelInvite(model.inviteCode);
      model.inviteCode = '';
      model.answerCode = '';
      model.status = 'Old invite cancelled. Create a fresh one for the next player.';
    } catch (error) {
      model.error = error.message;
    } finally {
      model.acceptingAnswer = false;
      render();
    }
  }

  function uniqueRoomName(name, playerId) {
    const baseName = (name || '').trim().slice(0, 20) || settingsStore.get('playerName');
    const existingNames = new Set(model.players.map(player => player.name.toLocaleLowerCase()));
    if (!existingNames.has(baseName.toLocaleLowerCase())) return baseName;

    const suffix = playerId.replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase();
    let candidate = `${baseName.slice(0, 14)}-${suffix}`;
    let attempt = 2;
    while (existingNames.has(candidate.toLocaleLowerCase())) {
      const discriminator = `${suffix}${attempt++}`;
      candidate = `${baseName.slice(0, 19 - discriminator.length)}-${discriminator}`;
    }
    return candidate;
  }

  function handleHostMessage(message) {
    if (message.type === 'join') {
      if (model.phase !== 'lobby') {
        message.send({ type: 'error', message: 'This match has already started.' });
        return;
      }
      if (model.players.length >= 4) {
        message.send({ type: 'error', message: 'This room already has four players.' });
        return;
      }
      const playerName = uniqueRoomName(message.name, message.playerId);
      model.players.push({ id: message.playerId, name: playerName, isHost: false });
      model.totals[message.playerId] = 0;
      message.send({ type: 'welcome', playerId: message.playerId, players: model.players });
      model.host.broadcast({ type: 'roster', players: model.players });
      model.status = `${playerName} joined the room.`;
      model.error = '';
      render();
      return;
    }

    if (message.type === 'disconnect') {
      const player = model.players.find(entry => entry.id === message.playerId);
      if (model.phase === 'lobby') {
        model.players = model.players.filter(entry => entry.id !== message.playerId);
        delete model.totals[message.playerId];
        model.status = `${player?.name || 'A guest'} disconnected. Invite them again before starting.`;
      } else {
        model.disconnectedPlayers.add(message.playerId);
        if (model.phase !== 'result' && model.phase !== 'gameover' && model.phase !== 'disconnected') {
          model.phase = 'disconnected';
          model.status = `${player?.name || 'A guest'} disconnected. This match cannot continue. Return home and start a new room.`;
          model.host.broadcast({ type: 'closed', message: model.status });
        }
      }
      render();
      return;
    }

    if (message.type === 'ready') {
      if (model.phase !== 'roles' || !model.assignment.some(entry => entry.playerId === message.playerId)) return;
      model.readyPlayers.add(message.playerId);
      model.status = `${model.readyPlayers.size} of 4 players have seen their role.`;
      if (model.readyPlayers.size === 4) {
        model.phase = 'guess';
        model.guessId = findRole('detective');
        broadcast({ type: 'guess', detectiveId: findRole('detective') });
      }
      render();
      return;
    }

    if (message.type === 'guess') {
      const detectiveId = findRole('detective');
      if (model.phase !== 'guess' || message.playerId !== detectiveId) return;
      const suspect = model.players.find(player => player.id === message.suspectId);
      if (!suspect || suspect.id === detectiveId) return;
      finishRound(suspect.id);
    }
  }

  function broadcast(message) {
    model.host.broadcast(message);
    render();
  }

  function findRole(role) {
    return model.assignment.find(entry => entry.role === role)?.playerId;
  }

  function startMatch() {
    if (model.players.length !== 4) {
      model.error = 'All four players must join before the match can start.';
      render();
      return;
    }
    model.matchRounds = model.rounds;
    model.round = 0;
    model.disconnectedPlayers = new Set();
    model.totals = Object.fromEntries(model.players.map(player => [player.id, 0]));
    startRound();
  }

  function startRound() {
    model.round += 1;
    model.assignment = assignRoles(model.players);
    model.readyPlayers = new Set();
    model.phase = 'roles';
    model.roleVisible = false;
    model.ready = false;
    model.result = null;
    for (const entry of model.assignment) {
      if (entry.playerId === 'host') {
        model.role = entry.role;
      } else {
        model.host.sendTo(entry.playerId, {
          type: 'role',
          role: entry.role,
          round: model.round,
          rounds: model.matchRounds,
        });
      }
    }
    broadcast({ type: 'round', round: model.round, rounds: model.matchRounds });
    render();
  }

  function markHostReady() {
    if (model.ready) return;
    model.ready = true;
    model.readyPlayers.add('host');
    model.status = `${model.readyPlayers.size} of 4 players have seen their role.`;
    model.host.broadcast({ type: 'ready-count', count: model.readyPlayers.size });
    if (model.readyPlayers.size === 4) {
      model.phase = 'guess';
      model.guessId = findRole('detective');
      broadcast({ type: 'guess', detectiveId: findRole('detective') });
    }
    render();
  }

  function finishRound(suspectId) {
    const { breakdown, detectiveGuessedCorrectly, detectivePlayerId, thiefPlayerId } =
      computeRoundScores(model.assignment, suspectId);
    model.roundScores = Object.fromEntries(Object.entries(breakdown).map(([id, entry]) => [id, entry.points]));
    model.totals = applyScores(model.totals, breakdown);
    model.result = {
      detectiveGuessedCorrectly,
      detectivePlayerId,
      thiefPlayerId,
      assignment: model.assignment,
      scores: model.roundScores,
      totals: model.totals,
      players: model.players,
      round: model.round,
      rounds: model.matchRounds,
    };
    model.phase = 'result';
    model.host.broadcast({ type: 'result', result: model.result });
    render();
  }

  function nextRound() {
    if (model.disconnectedPlayers.size) {
      model.phase = 'gameover';
      model.matchRounds = model.round;
      model.host.broadcast({
        type: 'gameover',
        players: model.players,
        totals: model.totals,
        rounds: model.round,
      });
      render();
      return;
    }
    if (model.round >= model.matchRounds) {
      model.phase = 'gameover';
      model.host.broadcast({
        type: 'gameover',
        players: model.players,
        totals: model.totals,
        rounds: model.matchRounds,
      });
      render();
      return;
    }
    startRound();
  }

  async function createGuestAnswer() {
    const offer = root.querySelector('[name="offer-code"]')?.value.trim() || '';
    if (!offer) {
      model.error = 'Paste the invite code sent by the host.';
      render();
      return;
    }
    model.name = settingsStore.get('playerName');
    model.guest = new PeerRoomGuest({
      onMessage: handleGuestMessage,
      onChange: render,
      onError: message => { model.error = message; render(); },
    });
    try {
      model.answerCode = await model.guest.createAnswer(offer, model.name);
      model.view = 'answer';
      model.error = '';
      model.status = 'Share this answer back to the host through WhatsApp.';
      render();
    } catch (error) {
      model.guest.close();
      model.guest = null;
      setError(error);
    }
  }

  function handleGuestMessage(message) {
    switch (message.type) {
      case 'welcome':
        model.playerId = message.playerId;
        model.players = message.players;
        model.view = 'game';
        model.status = 'Connected to the host. Waiting for the other players…';
        break;
      case 'roster':
        model.players = message.players;
        break;
      case 'role':
        model.role = message.role;
        model.roleVisible = false;
        model.ready = false;
        model.round = message.round;
        model.matchRounds = message.rounds;
        model.phase = 'roles';
        break;
      case 'round':
        model.round = message.round;
        model.matchRounds = message.rounds;
        model.phase = 'roles';
        model.roleVisible = false;
        model.ready = false;
        break;
      case 'ready-count':
        model.status = `${message.count} of 4 players have seen their role.`;
        break;
      case 'guess':
        model.phase = 'guess';
        model.guessId = message.detectiveId;
        break;
      case 'result':
        model.phase = 'result';
        model.result = message.result;
        model.players = message.result.players;
        model.totals = message.result.totals;
        model.assignment = message.result.assignment;
        model.roundScores = message.result.scores;
        break;
      case 'gameover':
        model.phase = 'gameover';
        model.players = message.players;
        model.totals = message.totals;
        model.matchRounds = message.rounds;
        break;
      case 'closed':
        model.phase = 'disconnected';
        model.status = message.message;
        break;
      case 'disconnect':
        model.phase = 'disconnected';
        model.status = 'The host disconnected. Return home to leave this room.';
        break;
      case 'error':
        model.error = message.message;
        break;
      default:
        return;
    }
    render();
  }

  function readyGuest() {
    model.ready = true;
    model.guest.send({ type: 'ready' });
    model.status = 'Role hidden. Waiting for all players…';
    render();
  }

  function sendGuess(suspectId) {
    model.guest.send({ type: 'guess', suspectId });
    model.status = 'Accusation locked. Waiting for the reveal…';
    model.phase = 'waiting';
    render();
  }

  async function shareText(text, label) {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ChitPlay phone game', text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        model.status = `${label} copied. Open WhatsApp and paste it into your group.`;
      } else {
        model.status = `Select and copy the ${label.toLowerCase()} code below, then paste it into WhatsApp.`;
      }
      model.error = '';
    } catch (error) {
      if (error.name !== 'AbortError') model.error = `Could not share: ${error.message}`;
    }
    render();
  }

  function hostView() {
    const connectedGuests = model.players.length - 1;
    const reservedSpots = model.host.connectionCount + model.host.pendingCount;
    const canInvite = !model.creatingInvite && model.host.pendingCount === 0 && reservedSpots < 3 && connectedGuests < 3;
    const playerRows = model.players.map((player, index) => el('li', { className: 'multiplayer__player' }, [
      el('span', { className: 'multiplayer__player-rank' }, [String(index + 1)]),
      el('span', { className: 'multiplayer__player-name' }, [player.name]),
      player.isHost ? el('span', { className: 'multiplayer__host-tag' }, ['Host']) : null,
      !player.isHost ? createButton({
        label: 'Disconnect',
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          try {
            model.host.disconnectPlayer(player.id);
          } catch (error) {
            setError(error);
          }
        },
      }) : null,
    ]));
    const content = [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Bring three players into the case']),
        inviteSteps(),
        model.inviteCode ? el('textarea', {
          className: 'input multiplayer__code',
          name: 'invite-display',
          readonly: true,
          attrs: { 'aria-label': 'Invitation code', rows: '5', spellcheck: 'false' },
          value: model.inviteCode,
        }) : null,
        model.inviteCode ? el('div', { className: 'multiplayer__actions' }, [
          createButton({
            label: 'Share Invite',
            variant: 'secondary',
            icon: icons.users,
            onClick: () => shareText(`Join my ChitPlay game. Open ${location.origin} on the host hotspot, then paste this invitation code:\n\n${model.inviteCode}`, 'Invite'),
          }),
          createButton({
            label: 'Copy Invite',
            variant: 'ghost',
            onClick: () => shareText(model.inviteCode, 'Invite'),
          }),
        ]) : null,
        model.inviteCode && model.host.pendingCount > 0 ? createButton({
          label: model.acceptingAnswer ? 'Cancelling…' : 'Cancel stale invite',
          variant: 'ghost',
          size: 'sm',
          onClick: cancelCurrentInvite,
        }) : null,
        createButton({
          label: model.creatingInvite
            ? 'Preparing Invite…'
            : model.host.pendingCount > 0
              ? 'Waiting for this guest — cancel if stuck'
              : canInvite
                ? `Create Invite (${connectedGuests}/3 guests joined)`
                : 'All guest spots in use',
          variant: 'primary',
          disabled: !canInvite,
          onClick: createInvite,
        }),
      ]),
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Admit a player']),
        el('textarea', {
          className: 'input multiplayer__code',
          name: 'answer-code',
          placeholder: 'Paste the answer code they send back',
          attrs: { 'aria-label': 'Guest answer code', rows: '4', spellcheck: 'false' },
          value: model.answerCode,
        }),
        createButton({
          label: model.acceptingAnswer ? 'Connecting…' : 'Accept Guest Answer',
          variant: 'secondary',
          disabled: model.acceptingAnswer,
          onClick: acceptAnswer,
        }),
      ]),
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, [`Players (${model.players.length}/4)`]),
        el('ol', { className: 'multiplayer__players' }, playerRows),
        el('label', { className: 'field__label', attrs: { for: 'multiplayer-rounds' } }, ['Rounds per match']),
        el('select', {
          className: 'input multiplayer__rounds',
          attrs: { id: 'multiplayer-rounds', 'aria-label': 'Rounds per match' },
          onChange: event => { model.rounds = Number(event.target.value); },
        }, [3, 5, 7].map(rounds => el('option', {
          value: String(rounds),
          attrs: { selected: model.rounds === rounds },
        }, [String(rounds)]))),
        createButton({
          label: 'Start 4-Player Match',
          variant: 'primary',
          size: 'lg',
          icon: icons.play,
          disabled: model.players.length !== 4,
          onClick: startMatch,
        }),
      ]),
    ];
    return makeShell('Host a phone game', 'No account or cloud server. Keep all four phones on this hotspot.', content);
  }

  function choiceView() {
    const content = [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Host this phone']),
        el('p', { className: 'card__subtitle' }, ['Turn on this phone’s hotspot first. Three friends join with their phones; share the connection codes in WhatsApp.']),
        el('p', { className: 'multiplayer__privacy-note' }, [`Playing as ${settingsStore.get('playerName')}. Change your name in Settings → Player Profile.`]),
        el('div', { className: 'multiplayer__actions' }, [
          createButton({ label: 'Create Local Room', variant: 'primary', icon: icons.users, onClick: startHost }),
          createButton({ label: 'Join a Room', variant: 'secondary', onClick: () => { model.view = 'join'; model.error = ''; render(); } }),
        ]),
      ]),
      el('p', { className: 'multiplayer__privacy-note' }, [
        'Direct WebRTC connection only. Invite/answer codes must be exchanged manually; no game data is sent to a ChitPlay server.',
      ]),
    ];
    return makeShell('Play on four phones', 'Free, peer-to-peer play on the same Wi-Fi hotspot.', content);
  }

  function joinView() {
    const offerInput = el('textarea', {
      className: 'input multiplayer__code',
      name: 'offer-code',
      placeholder: 'Paste the host invitation from WhatsApp',
      attrs: { 'aria-label': 'Host invitation code', rows: '5', spellcheck: 'false' },
      value: model.joinCode,
      onInput: event => { model.joinCode = event.target.value; },
    });
    const content = [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Join the host']),
        el('p', { className: 'card__subtitle' }, [`Connect to the host phone’s hotspot and paste the invitation code. You’ll join as ${settingsStore.get('playerName')}.`]),
        offerInput,
        createButton({ label: 'Create Answer for Host', variant: 'primary', icon: icons.arrowRight, onClick: createGuestAnswer }),
        createButton({ label: 'Back', variant: 'ghost', onClick: () => { model.view = 'choice'; model.error = ''; render(); } }),
      ]),
    ];
    return makeShell('Join a phone game', 'Your role will be sent privately to this phone.', content);
  }

  function answerView() {
    const content = [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Send this answer to the host']),
        el('p', { className: 'card__subtitle' }, ['Share this full code back in WhatsApp. Leave this page open while the host accepts it.']),
        el('textarea', {
          className: 'input multiplayer__code',
          name: 'answer-display',
          readonly: true,
          attrs: { 'aria-label': 'Answer code', rows: '6', spellcheck: 'false' },
          value: model.answerCode,
        }),
        el('div', { className: 'multiplayer__actions' }, [
          createButton({
            label: 'Share Answer',
            variant: 'primary',
            icon: icons.users,
            onClick: () => shareText(model.answerCode, 'Answer'),
          }),
          createButton({
            label: 'Copy Answer',
            variant: 'secondary',
            onClick: () => shareText(model.answerCode, 'Answer'),
          }),
        ]),
        alertBox(model.status),
      ]),
    ];
    return makeShell('Connect to host', 'Send the answer code back to the host through WhatsApp.', content);
  }

  function renderRoleView() {
    const meta = ROLE_META[model.role];
    const revealButton = createButton({
      label: model.roleVisible ? 'Hide My Role' : 'Reveal My Role',
      variant: 'primary',
      size: 'lg',
      icon: model.roleVisible ? icons.lock : icons.eye,
      onClick: () => {
        model.roleVisible = !model.roleVisible;
        if (!model.roleVisible) {
          if (model.playerId === 'host') markHostReady();
          else readyGuest();
        }
        else render();
      },
    });
    const content = [
      el('section', { className: `multiplayer__card card multiplayer__private multiplayer__private--${meta?.color || 'king'}` }, [
        el('h2', { className: 'card__title' }, [`Round ${model.round} of ${model.matchRounds}`]),
        model.roleVisible ? createRoleDetail(model.role) : el('p', { className: 'card__subtitle' }, ['Tap only when you are alone. Your secret role stays on this phone.']),
        !model.ready ? revealButton : alertBox('Role hidden. Waiting for the other players…'),
      ]),
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Players']),
        playerList(model.players),
        alertBox(model.status),
      ]),
    ];
    return makeShell('Your secret role', 'Only this player’s browser receives this role.', content);
  }

  function playerList(players) {
    return el('ul', { className: 'multiplayer__players' }, players.map(player => el('li', { className: 'multiplayer__player' }, [
      el('span', { className: 'multiplayer__player-rank' }, [player.isHost ? icons.crown() : icons.users()]),
      el('span', { className: 'multiplayer__player-name' }, [player.name]),
      player.id === model.playerId ? el('span', { className: 'multiplayer__host-tag' }, ['You']) : null,
    ])));
  }

  function renderGuessView() {
    const isDetective = model.playerId === model.guessId;
    const suspects = model.players.filter(player => player.id !== model.guessId);
    const content = [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, [isDetective ? 'Choose the Cheat' : 'Detective is investigating']),
        el('p', { className: 'card__subtitle' }, [isDetective ? 'Your suspects are shown below. This accusation cannot be changed.' : 'Wait while the Detective makes a private accusation.']),
        isDetective ? el('div', { className: 'multiplayer__suspects' }, suspects.map(player => createButton({
          label: `Accuse ${player.name}`,
          variant: model.selectedSuspect === player.id ? 'primary' : 'secondary',
          icon: icons.mask,
          onClick: () => { model.selectedSuspect = player.id; render(); },
        }))) : null,
        isDetective ? createButton({
          label: 'Lock in accusation',
          variant: 'primary',
          size: 'lg',
          disabled: !model.selectedSuspect,
          onClick: () => {
            const suspectId = model.selectedSuspect;
            model.selectedSuspect = null;
            if (model.playerId === 'host') finishRound(suspectId);
            else sendGuess(suspectId);
          },
        }) : null,
      ]),
      playerList(model.players),
    ];
    return makeShell('Detective phase', `Round ${model.round} of ${model.matchRounds}`, content);
  }

  function resultView() {
    const result = model.result;
    const players = result.players || model.players;
    const ranked = rankPlayers(players, result.totals);
    const isHost = model.playerId === 'host';
    const content = [
      el('section', { className: 'multiplayer__result card' }, [
        el('div', { className: 'multiplayer__result-icon' }, [result.detectiveGuessedCorrectly ? icons.check() : icons.mask()]),
        el('h2', { className: 'card__title' }, [result.detectiveGuessedCorrectly ? 'Cheat caught!' : 'Cheat escaped!']),
        el('p', { className: 'card__subtitle' }, [
          `${players.find(player => player.id === result.detectivePlayerId)?.name} ${result.detectiveGuessedCorrectly ? 'caught' : 'missed'} the Cheat, ${players.find(player => player.id === result.thiefPlayerId)?.name}.`,
        ]),
      ]),
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Round roles & points']),
        el('div', { className: 'multiplayer__results' }, players.map(player => {
          const role = result.assignment.find(entry => entry.playerId === player.id)?.role;
          const meta = ROLE_META[role];
          return el('div', { className: 'multiplayer__result-row' }, [
            el('span', { className: 'multiplayer__result-player' }, [player.name]),
            el('span', { className: `multiplayer__role multiplayer__role--${meta.color}` }, [createRoleIcon(role), meta.name]),
            el('strong', { className: 'multiplayer__points' }, [`+${result.scores[player.id] || 0}`]),
          ]);
        })),
      ]),
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Leaderboard']),
        el('ol', { className: 'multiplayer__leaderboard' }, ranked.map(player => el('li', { className: 'multiplayer__player' }, [
          el('span', { className: `multiplayer__rank-medal multiplayer__rank-medal--${player.rank <= 3 ? ['gold', 'silver', 'bronze'][player.rank - 1] : 'other'}` }, [
            player.rank <= 3 ? icons[['medalGold', 'medalSilver', 'medalBronze'][player.rank - 1]]() : String(player.rank),
          ]),
          el('span', { className: 'multiplayer__player-name' }, [player.name]),
          el('strong', { className: 'multiplayer__points' }, [`${player.total} pts`]),
        ]))),
      ]),
    ];
    const footer = isHost ? [
      model.disconnectedPlayers.size ? alertBox('A guest disconnected. The round result is saved; the match will end after this leaderboard.') : null,
      createButton({
      label: model.disconnectedPlayers.size || model.round >= model.matchRounds ? 'Finish Match' : 'Next Round',
      variant: 'primary',
      size: 'lg',
      icon: icons.arrowRight,
      onClick: nextRound,
    })] : [alertBox('Waiting for the host to continue…')];
    return makeShell('Round complete', `Round ${model.round} of ${model.matchRounds}`, content, footer);
  }

  function gameOverView() {
    const ranked = rankPlayers(model.players, model.totals);
    const content = [
      el('section', { className: 'multiplayer__result card' }, [
        el('div', { className: 'multiplayer__result-icon' }, [icons.trophy()]),
        el('h2', { className: 'card__title' }, ['Match complete']),
        el('p', { className: 'card__subtitle' }, [`${ranked[0].name} wins with ${ranked[0].total} points!`]),
      ]),
      el('ol', { className: 'multiplayer__leaderboard card' }, ranked.map(player => el('li', { className: 'multiplayer__player' }, [
        el('span', { className: `multiplayer__rank-medal multiplayer__rank-medal--${player.rank <= 3 ? ['gold', 'silver', 'bronze'][player.rank - 1] : 'other'}` }, [
          player.rank <= 3 ? icons[['medalGold', 'medalSilver', 'medalBronze'][player.rank - 1]]() : String(player.rank),
        ]),
        el('span', { className: 'multiplayer__player-name' }, [player.name]),
        el('strong', { className: 'multiplayer__points' }, [`${player.total} pts`]),
      ]))),
    ];
    return makeShell('Final leaderboard', `${model.matchRounds} rounds played`, content);
  }

  function waitingView() {
    return makeShell('Accusation locked', 'The Detective has submitted a suspect.', [
      el('section', { className: 'multiplayer__card card' }, [
        el('div', { className: 'multiplayer__waiting-icon' }, [icons.eye()]),
        el('h2', { className: 'card__title' }, ['Waiting for the reveal…']),
        playerList(model.players),
      ]),
    ]);
  }

  function disconnectedView() {
    return makeShell('Connection lost', 'This game cannot continue without all four phones connected.', [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Match stopped']),
        alertBox(model.status, true),
        el('p', { className: 'multiplayer__card-note' }, ['Return home and create a new room after all players are ready to stay connected.']),
        createButton({ label: 'Return to Home', variant: 'primary', onClick: closeAndGoHome }),
      ]),
    ]);
  }

  function renderGameView() {
    if (model.phase === 'disconnected') return disconnectedView();
    if (model.phase === 'roles') return renderRoleView();
    if (model.phase === 'guess') return renderGuessView();
    if (model.phase === 'waiting') return waitingView();
    if (model.phase === 'result') return resultView();
    if (model.phase === 'gameover') return gameOverView();
    return makeShell('Connected to host', 'Waiting for all four players to join.', [
      el('section', { className: 'multiplayer__card card' }, [
        el('h2', { className: 'card__title' }, ['Players']),
        playerList(model.players),
        alertBox(model.status),
      ]),
    ]);
  }

  function render() {
    while (root.firstChild) root.removeChild(root.firstChild);
    let body;
    if (model.view === 'choice') body = choiceView();
    else if (model.view === 'host') body = model.phase === 'lobby' ? hostView() : renderGameView();
    else if (model.view === 'join') body = joinView();
    else if (model.view === 'answer') body = answerView();
    else if (model.view === 'game') body = renderGameView();
    root.appendChild(body);
    if (model.error) root.appendChild(alertBox(model.error, true));
    if (model.status && model.view !== 'answer' && model.phase === 'lobby') root.appendChild(alertBox(model.status));
  }

  model.readyPlayers = new Set();
  render();

  return {
    element: root,
    onEnter() {},
    onExit() {
      model.host?.close();
      model.guest?.close();
    },
  };
}
