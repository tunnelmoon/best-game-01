// The screenshot scenes behind ?shot=title|play|clear|over. Each one plays the
// real rules forward from a fresh run for a fixed number of 1/60 s steps,
// steered by a simple autopilot, so the frame is what a short game really
// looks like and the same seed always gives the same frame.

import { STEP, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_OVER, SCREEN_WIN, SCREEN_TITLE, startRun, stepGame } from './game.js';
import { makeRng } from './rng.js';
import { FIELD } from './config.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 30;
const LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

// The over scene's pilot: it hunts comets on purpose, so the game over is
// reached through the real rules (three comet hits) instead of a staged state.
function recklessPilot(game) {
  const input = game.input;
  const p = game.player;
  input.left = input.right = input.up = input.down = false;
  let comet = null;
  let cometDist = Infinity;
  let star = null;
  let starDist = Infinity;
  for (const item of game.sky.items) {
    if (!item.active) continue;
    const dx = item.x - p.x;
    const dy = item.y - p.y;
    const dist = dx * dx + dy * dy;
    if (item.kind === 'comet' && dist < cometDist) {
      cometDist = dist;
      comet = item;
    } else if (item.kind !== 'comet' && dist < starDist) {
      starDist = dist;
      star = item;
    }
  }
  const target = comet ?? star;
  if (target) {
    input.mouseX = target.x;
    input.mouseY = Math.min(Math.max(target.y, FIELD.ceiling), FIELD.floor);
    input.mouseSeen = true;
    return;
  }
  input.mouseX = FIELD.width / 2;
  input.mouseY = 560;
  input.mouseSeen = true;
}
// path is clear of comets for `horizon` seconds, else back away from the
// nearest comet. A short horizon makes a careless pilot that gets hit.
// With dodge off, the pilot never checks safety and never backs away: it
// chases the nearest star, or the nearest comet when no star is near.
function autopilot(game, horizon, dodge = true) {
  const input = game.input;
  const p = game.player;
  input.left = input.right = input.up = input.down = false;

  let star = null;
  let starDist = Infinity;
  let comet = null;
  let cometDist = Infinity;
  for (const item of game.sky.items) {
    if (!item.active) continue;
    const dx = item.x - p.x;
    const dy = item.y - p.y;
    const dist = dx * dx + dy * dy;
    if (item.kind === 'comet') {
      if (dist < cometDist) {
        cometDist = dist;
        comet = item;
      }
    } else if (dist < starDist) {
      starDist = dist;
      star = item;
    }
  }

  let target = null;
  if (star) {
    let safe = !dodge;
    if (dodge) {
      safe = true;
      for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
        const sx = star.x + Math.sin((game.sky.age + t) * 1.1 * Math.PI * 2 + star.swayPhase) * 34;
        const sy = star.y + star.speed * t;
        for (const item of game.sky.items) {
          if (!item.active || item.kind !== 'comet') continue;
          const cx = item.x + Math.sin((game.sky.age + t) * 1.1 * Math.PI * 2 + item.swayPhase) * 34;
          const cy = item.y + item.speed * t;
          if (Math.abs(cx - sx) < 90 && Math.abs(cy - sy) < 90) {
            safe = false;
            break;
          }
        }
        if (!safe) break;
      }
    }
    if (safe) target = star;
  }
  if (target) {
    input.mouseX = target.x;
    input.mouseY = Math.min(Math.max(target.y + 30, FIELD.ceiling), FIELD.floor);
    input.mouseSeen = true;
    return;
  }
  if (comet) {
    if (dodge) {
      input.mouseX = comet.x < p.x ? Math.min(p.x + 220, FIELD.width - 48) : Math.max(p.x - 220, 48);
      input.mouseY = p.y;
    } else {
      // Reckless: walk straight into the comet.
      input.mouseX = comet.x;
      input.mouseY = Math.min(Math.max(comet.y, FIELD.ceiling), FIELD.floor);
    }
    input.mouseSeen = true;
    return;
  }
  input.mouseX = FIELD.width / 2;
  input.mouseY = 560;
  input.mouseSeen = true;
}

function runSteps(game, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (pilot) autopilot(game, pilot);
    stepGame(game, STEP);
    if (game.screen !== SCREEN_PLAY && game.screen !== SCREEN_TITLE) break;
  }
}

// Stage the named scene on a fresh run and return the screen to show.
export function stageShot(name, game, seed) {
  game.rng = makeRng(seed);
  // Fresh twinkling sky from the same seed, so the frame is reproducible.
  for (const star of game.background) {
    star.x = game.rng() * FIELD.width;
    star.y = game.rng() * 560;
    star.phase = game.rng() * Math.PI * 2;
  }
  game.screen = SCREEN_TITLE;
  if (name === 'title') {
    runSteps(game, START_SECONDS, null);
    game.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  startRun(game);
  if (name === 'play') {
    // Play on the second constellation, mid-trace: two nodes lit of four, the
    // thread visible, the sky busy. The clear banner between levels is stepped
    // through, not treated as an end.
    const steps = Math.floor(90 / STEP);
    for (let i = 0; i < steps; i += 1) {
      autopilot(game, 0.7);
      stepGame(game, STEP);
      if (game.screen === SCREEN_OVER || game.screen === SCREEN_WIN) break;
      if (game.screen === SCREEN_PLAY && game.levelIndex === 1 && game.chain >= 2) {
        const busy = game.sky.items.filter((item) => item.active).length;
        if (busy >= 4) break;
      }
    }
    return SCREEN_PLAY;
  }
  if (name === 'clear') {
    const steps = Math.floor(LIMIT_SECONDS / STEP);
    for (let i = 0; i < steps; i += 1) {
      autopilot(game, 0.7);
      stepGame(game, STEP);
      if (game.screen === SCREEN_CLEAR) break;
      if (game.screen === SCREEN_OVER) break;
    }
    return game.screen;
  }
  // over: a reckless pilot that hunts comets until the night ends.
  const steps = Math.floor(LIMIT_SECONDS / STEP);
  for (let i = 0; i < steps; i += 1) {
    recklessPilot(game);
    stepGame(game, STEP);
    if (game.screen === SCREEN_OVER) break;
  }
  // Let the comet-hit flash and particles settle so the results stay readable.
  for (let i = 0; i < 45; i += 1) stepGame(game, STEP);
  return game.screen;
}
