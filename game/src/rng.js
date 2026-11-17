// A small seeded generator (mulberry32) so the screenshot scenes play out the
// same way every time for a given seed. Live play seeds it from the clock;
// shot mode seeds it from the URL.

export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, low, high) {
  return low + rng() * (high - low);
}

export function pickInt(rng, low, high) {
  return Math.floor(pick(rng, low, high + 1));
}
