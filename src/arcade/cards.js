/** A standard 52-card pack. A card is rank + suit: 'AS', '10H', 'KD'. No betting anywhere. */
import { shuffle } from './lib.js?v=20261114-1549';

export const SUITS = ['S', 'H', 'D', 'C'];
export const SUIT_ICON = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const suitOf = (c) => c[c.length - 1];
export const rankOf = (c) => c.slice(0, -1);
export const power = (c) => RANKS.indexOf(rankOf(c));
export const showCard = (c) => `${rankOf(c)}${SUIT_ICON[suitOf(c)]}`;
export const isRed = (c) => suitOf(c) === 'H' || suitOf(c) === 'D';
export const newPack = (rng) => shuffle(SUITS.flatMap(s => RANKS.map(r => r + s)), rng);
export const sortHand = (hand) => hand.slice().sort((a, b) => SUITS.indexOf(suitOf(a)) - SUITS.indexOf(suitOf(b)) || power(b) - power(a));
