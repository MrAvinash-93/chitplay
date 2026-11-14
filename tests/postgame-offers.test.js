import { describe, it, expect } from './harness.js';
import { applyOfferReply, normalizeOfferRequest } from '../src/arcade/postgame-offers.js';

const currentGame = { slug: 'tic-tac-toe', max: 2 };
const games = {
  chess: { slug: 'chess', max: 2 },
  video: { slug: 'video', max: 2, video: true },
  small: { slug: 'small', max: 1 },
};
const findGame = slug => games[slug] || null;
const request = (msg, playerCount = 2) => normalizeOfferRequest(msg, { currentGame, gameBySlug: findGame, playerCount });

describe('Postgame multiplayer offers', () => {
  it('accepts a same-game rematch for the current table', () => {
    const result = request({ id: 'offer-1', kind: 'again' });
    expect(result.kind).toBe('again');
    expect(result.game).toBe(currentGame);
  });

  it('accepts another game only when every current player fits', () => {
    const result = request({ id: 'offer-2', kind: 'game', game: 'chess' });
    expect(result.game).toBe(games.chess);
    expect(request({ id: 'offer-3', kind: 'game', game: 'small' })).toBe(null);
  });

  it('rejects malformed, same-game, unknown, and video-game offers', () => {
    expect(request({ id: '', kind: 'again' })).toBe(null);
    expect(request({ id: 'x'.repeat(65), kind: 'again' })).toBe(null);
    expect(request({ id: 'offer-4', kind: 'other' })).toBe(null);
    expect(request({ id: 'offer-5', kind: 'game', game: currentGame.slug })).toBe(null);
    expect(request({ id: 'offer-6', kind: 'game', game: 'missing' })).toBe(null);
    expect(request({ id: 'offer-7', kind: 'game', game: 'video' })).toBe(null);
  });

  it('ignores stale replies and replies from a peer who was not invited', () => {
    const offer = { id: 'offer-8', source: 'host', targets: new Set(['guest-a']) };
    expect(applyOfferReply(offer, 'guest-a', { id: 'old-id', accept: true }).offer).toBe(offer);
    expect(applyOfferReply(offer, 'guest-b', { id: offer.id, accept: true }).offer).toBe(offer);
    expect(applyOfferReply(offer, 'guest-a', { id: offer.id, accept: 'yes' }).offer).toBe(offer);
    expect(applyOfferReply(null, 'guest-a', { id: offer.id, accept: true }).outcome).toBe(null);
  });

  it('starts on the first acceptance', () => {
    const offer = { id: 'offer-9', source: 'host', targets: new Set(['guest-a', 'guest-b']) };
    const result = applyOfferReply(offer, 'guest-a', { id: offer.id, accept: true });
    expect(result.outcome).toBe('accepted');
    expect(result.offer).toBe(null);
  });

  it('keeps waiting after one decline and resolves when all decline', () => {
    const offer = { id: 'offer-10', source: 'host', targets: new Set(['guest-a', 'guest-b']) };
    const first = applyOfferReply(offer, 'guest-a', { id: offer.id, accept: false });
    expect(first.outcome).toBe(null);
    expect(first.offer.targets.has('guest-b')).toBe(true);
    const last = applyOfferReply(first.offer, 'guest-b', { id: offer.id, accept: false });
    expect(last.outcome).toBe('declined');
    expect(last.offer).toBe(null);
  });
});
