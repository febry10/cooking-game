// A small seeded random generator for Golden Skillet, written for this game.
// It is a counter-based hash generator: the state advances by a fixed odd step
// and is scrambled with multiply/xor/shift rounds before each draw, so the same
// seed always produces the same stream. That repeatability is what lets the
// screenshot scenes (?shot=...&seed=N) compose exactly the same frame on every
// machine, and it keeps the order rush identical between two runs of a test.

export function createRandom(seed) {
  let state = (seed | 0) ^ 0x9e3779b9;
  if (state === 0) state = 0x2545f491;

  function nextFloat() {
    state = (state + 0x6d2b79f5) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z = (z ^ (z >>> 15)) >>> 0;
    return z / 4294967296;
  }

  return {
    /** A float in [0, 1). */
    float: nextFloat,
    /** A float in [min, max). */
    range(min, max) {
      return min + nextFloat() * (max - min);
    },
    /** An integer in [min, max], both ends included. */
    int(min, max) {
      return min + Math.floor(nextFloat() * (max - min + 1));
    },
    /** One element of a non-empty array. */
    pick(list) {
      return list[Math.floor(nextFloat() * list.length)];
    },
    /** True with probability p. */
    chance(p) {
      return nextFloat() < p;
    },
  };
}
