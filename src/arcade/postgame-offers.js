export function normalizeOfferRequest(msg, { currentGame, gameBySlug, playerCount }) {
  if (!msg || typeof msg.id !== 'string' || msg.id.length === 0 || msg.id.length > 64
    || !['again', 'game'].includes(msg.kind) || typeof gameBySlug !== 'function'
    || !Number.isInteger(playerCount) || playerCount < 1) return null;
  const game = msg.kind === 'again' ? currentGame : gameBySlug(msg.game);
  if (!game || game.video || (msg.kind === 'game' && game === currentGame) || playerCount > game.max) return null;
  return { id: msg.id, kind: msg.kind, game };
}

export function applyOfferReply(offer, peerId, msg) {
  if (!offer || offer.source !== 'host' || !(offer.targets instanceof Set)
    || !offer.targets.has(peerId) || !msg || msg.id !== offer.id || typeof msg.accept !== 'boolean') {
    return { offer, outcome: null };
  }
  if (msg.accept) return { offer: null, outcome: 'accepted' };
  const targets = new Set(offer.targets);
  targets.delete(peerId);
  return targets.size
    ? { offer: { ...offer, targets }, outcome: null }
    : { offer: null, outcome: 'declined' };
}
