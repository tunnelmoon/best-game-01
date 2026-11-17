// The falling sky: stars to catch, comets to dodge, and (from level 3 on)
// wish stars worth more. Spawning is driven by the level table; the world
// step below is pure simulation, so the shot scenes can run it headless.

import { FALL } from './config.js';

export const KIND_STAR = 'star';
export const KIND_COMET = 'comet';
export const KIND_WISH = 'wish';

export function makeSky() {
  return {
    items: [],
    spawnIn: 0.6,
    age: 0,
  };
}

function spawnOne(sky, rng, level) {
  const roll = rng();
  const kind = roll < level.cometChance ? KIND_COMET : KIND_STAR;
  const speed = level.fallSpeed * (kind === KIND_COMET ? 1.35 : 1) * (0.9 + rng() * 0.2);
  sky.items.push({
    kind,
    x: 40 + rng() * 1200,
    y: -30,
    baseX: 0,
    speed,
    swayPhase: rng() * Math.PI * 2,
    radius: kind === KIND_COMET ? FALL.cometRadius : FALL.starRadius,
    active: true,
  });
  const last = sky.items[sky.items.length - 1];
  last.baseX = last.x;
}

// Advance every falling object; returns the ones that left the bottom.
export function stepSky(sky, dt, rng, level, allowWish) {
  sky.age += dt;
  sky.spawnIn -= dt;
  if (sky.spawnIn <= 0) {
    spawnOne(sky, rng, level);
    if (allowWish && rng() < 0.07) {
      const wish = {
        kind: KIND_WISH,
        x: 60 + rng() * 1160,
        y: -30,
        baseX: 0,
        speed: level.fallSpeed * 0.8,
        swayPhase: rng() * Math.PI * 2,
        radius: FALL.starRadius + 3,
        active: true,
      };
      wish.baseX = wish.x;
      sky.items.push(wish);
    }
    sky.spawnIn = level.spawnEvery * (0.85 + rng() * 0.3);
  }
  const gone = [];
  for (const item of sky.items) {
    if (!item.active) continue;
    item.y += item.speed * dt;
    item.x = item.baseX + Math.sin(sky.age * FALL.swayHertz * Math.PI * 2 + item.swayPhase) * FALL.swayPixels;
    if (item.y > FALL.goneY) {
      item.active = false;
      gone.push(item);
    }
  }
  return gone;
}

export function clearSky(sky) {
  sky.items.length = 0;
  sky.spawnIn = 0.6;
  sky.age = 0;
}
