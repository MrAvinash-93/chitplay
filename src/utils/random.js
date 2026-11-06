/**
 * Random utilities with injectable RNG for deterministic testing.
 * Default uses crypto.getRandomValues when available, falling back to Math.random.
 */

function defaultRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

/**
 * Fisher–Yates shuffle. Unbiased, in-place optional.
 * @param {Array} array
 * @param {() => number} rng
 * @returns {Array} new shuffled array
 */
export function shuffle(array, rng = defaultRandom) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomInt(min, max, rng = defaultRandom) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick(array, rng = defaultRandom) {
  return array[Math.floor(rng() * array.length)];
}

export function createSeededRng(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}