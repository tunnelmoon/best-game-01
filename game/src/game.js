// Starweave's state machine and rules. Screens: title, play, clear (banner),
// over, win. The world step is pure simulation on fixed steps, so the shot
// scenes can run it without a browser frame.

import { FIELD, PLAYER, SCORE, LIVES_START } from './config.js';
import { makeSky, stepSky, clearSky, KIND_STAR, KIND_COMET, KIND_WISH } from './entities.js';
import { levelAt, levelCount, levelName, constellationNodes } from './levels.js';
import { makeParticles, burst, ring, floatText, stepParticles } from './particles.js';
import { makeFeedback, addTrauma, addFlash, hitStop, stepFeedback } from './feedback.js';
import {
  makeAudio, unlockAudio, setMuted, playCatch, playWish, playComet,
  playClear, playOver, playWin, playClick,
} from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export const STEP = 1 / 60;
export const BEST_KEY = 'starweave.best';

export function createGame(input, rng) {
  const best = Number(window.localStorage?.getItem(BEST_KEY) ?? 0) || 0;
  const background = [];
  for (let i = 0; i < 110; i += 1) {
    background.push({
      x: rng() * FIELD.width,
      y: rng() * 560,
      radius: 0.6 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      speed: 0.6 + rng() * 2.2,
    });
  }
  return {
    input,
    rng,
    audio: makeAudio(),
    particles: makeParticles(),
    feedback: makeFeedback(),
    sky: makeSky(),
    background,
    screen: SCREEN_TITLE,
    paused: false,
    levelIndex: 0,
    score: 0,
    best,
    combo: 0,
    chain: 0,
    lives: LIVES_START,
    timeLeft: levelAt(0).nightSeconds,
    player: { x: 640, y: 560, shield: 0 },
    banner: null,
    beams: [],
    caught: 0,
    missed: 0,
    cometsHit: 0,
    playSeconds: 0,
    muted: false,
    time: 0,
  };
}

function saveBest(game) {
  if (game.score > game.best) {
    game.best = game.score;
    try {
      window.localStorage?.setItem(BEST_KEY, String(game.best));
    } catch {
      // Storage can be unavailable; the best score just does not persist.
    }
  }
}

export function startRun(game) {
  game.score = 0;
  game.combo = 0;
  game.chain = 0;
  game.lives = LIVES_START;
  game.levelIndex = 0;
  game.caught = 0;
  game.missed = 0;
  game.cometsHit = 0;
  game.playSeconds = 0;
  game.banner = null;
  game.beams.length = 0;
  startLevel(game);
  game.screen = SCREEN_PLAY;
}

export function startLevel(game) {
  const level = levelAt(game.levelIndex);
  game.timeLeft = level.nightSeconds;
  game.chain = 0;
  clearSky(game.sky);
  game.player.x = 640;
  game.player.y = 560;
  game.player.shield = 0;
}

function nodePoint(game, index) {
  const nodes = constellationNodes(game.levelIndex);
  const point = nodes[Math.min(index, nodes.length - 1)];
  return { x: 440 + point[0] * 400, y: 92 + point[1] * 220 };
}

function catchStar(game, item) {
  const level = levelAt(game.levelIndex);
  game.combo += 1;
  game.chain += 1;
  game.caught += 1;
  const mult = Math.min(game.combo, SCORE.comboCap);
  const gained = SCORE.starBase * mult;
  game.score += gained;
  const target = nodePoint(game, game.chain - 1);
  game.beams.push({ x1: game.player.x, y1: game.player.y, x2: target.x, y2: target.y, life: 1.4, max: 1.4 });
  burst(game.particles, item.x, item.y, '#ffd76a', 12, 180, 3, game.rng);
  floatText(game.particles, item.x, item.y - 18, `+${gained}`, '#ffe9a8');
  playCatch(game.audio, game.combo);
  addTrauma(game.feedback, 0.14);
  if (game.chain >= level.nodes.length) completeLevel(game);
}

function catchWish(game, item) {
  game.combo += 1;
  game.chain = Math.min(game.chain + 2, levelAt(game.levelIndex).nodes.length);
  game.caught += 1;
  const mult = Math.min(game.combo, SCORE.comboCap);
  const gained = SCORE.wishBase * mult;
  game.score += gained;
  ring(game.particles, item.x, item.y, '#b8ff5a', 26, 260);
  floatText(game.particles, item.x, item.y - 18, `WISH +${gained}`, '#d8ffa8');
  playWish(game.audio);
  addTrauma(game.feedback, 0.25);
  if (game.chain >= levelAt(game.levelIndex).nodes.length) completeLevel(game);
}

function hitComet(game, item) {
  if (game.player.shield > 0) return;
  game.lives -= 1;
  game.cometsHit += 1;
  game.combo = 0;
  game.chain = 0;
  game.player.shield = PLAYER.shieldSeconds;
  burst(game.particles, item.x, item.y, '#ff5a3c', 22, 240, 3, game.rng);
  floatText(game.particles, game.player.x, game.player.y - 40, 'COMET!', '#ff8a7a');
  playComet(game.audio);
  addTrauma(game.feedback, 0.75);
  addFlash(game.feedback, 0.5, '255, 70, 50');
  if (game.lives <= 0) endRun(game, SCREEN_OVER);
}

function completeLevel(game) {
  const level = levelAt(game.levelIndex);
  const bonus = SCORE.clearBonus * (game.levelIndex + 1);
  game.score += bonus;
  game.combo = 0;
  game.banner = {
    title: 'CONSTELLATION COMPLETE',
    name: levelName(game.levelIndex),
    bonus,
    timer: 2.6,
  };
  ring(game.particles, 640, 200, '#ffd76a', 40, 320);
  playClear(game.audio);
  addTrauma(game.feedback, 0.5);
  hitStop(game.feedback, 0.12, 0.05);
  game.screen = SCREEN_CLEAR;
}

function endRun(game, screen) {
  saveBest(game);
  game.screen = screen;
  if (screen === SCREEN_OVER) playOver(game.audio);
  if (screen === SCREEN_WIN) playWin(game.audio);
}

function loseNight(game) {
  game.lives -= 1;
  game.combo = 0;
  game.chain = 0;
  floatText(game.particles, 640, 300, 'DAWN BREAKS - TOO SLOW', '#9aa5d6');
  playComet(game.audio);
  addFlash(game.feedback, 0.3, '120, 140, 255');
  if (game.lives <= 0) {
    endRun(game, SCREEN_OVER);
    return;
  }
  game.timeLeft = levelAt(game.levelIndex).nightSeconds;
}

function movePlayer(game, dt) {
  const input = game.input;
  const p = game.player;
  let vx = 0;
  let vy = 0;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;
  if (vx !== 0 || vy !== 0) {
    const length = Math.hypot(vx, vy);
    p.x += (vx / length) * PLAYER.speed * dt;
    p.y += (vy / length) * PLAYER.speed * dt;
  } else if (input.mouseSeen) {
    const kx = 1 - Math.exp(-PLAYER.mouseEase * dt);
    p.x += (input.mouseX - p.x) * kx;
    p.y += (input.mouseY - p.y) * kx;
  }
  p.x = Math.min(FIELD.width - FIELD.margin, Math.max(FIELD.margin, p.x));
  p.y = Math.min(FIELD.floor, Math.max(FIELD.ceiling, p.y));
  p.shield = Math.max(p.shield - dt, 0);
}

function checkCatches(game) {
  const p = game.player;
  for (const item of game.sky.items) {
    if (!item.active) continue;
    const dx = item.x - p.x;
    const dy = item.y - p.y;
    const reach = PLAYER.radius + item.radius;
    if (dx * dx + dy * dy > reach * reach) continue;
    item.active = false;
    if (item.kind === KIND_STAR) catchStar(game, item);
    else if (item.kind === KIND_WISH) catchWish(game, item);
    else if (item.kind === KIND_COMET) hitComet(game, item);
    if (game.screen !== SCREEN_PLAY) return;
  }
}

export function stepGame(game, realDt) {
  game.time += realDt;
  const feedback = game.feedback;
  stepFeedback(feedback, realDt);
  const worldDt = realDt * feedback.timeScale;
  stepParticles(game.particles, worldDt);
  for (let i = game.beams.length - 1; i >= 0; i -= 1) {
    game.beams[i].life -= worldDt;
    if (game.beams[i].life <= 0) game.beams.splice(i, 1);
  }

  if (game.screen === SCREEN_TITLE) {
    // The title sky stays alive behind the menu.
    stepSky(game.sky, worldDt, game.rng, levelAt(0), false);
    return;
  }
  if (game.screen === SCREEN_CLEAR) {
    if (game.banner) {
      game.banner.timer -= realDt;
      if (game.banner.timer <= 0) {
        game.banner = null;
        game.levelIndex += 1;
        if (game.levelIndex >= levelCount()) {
          endRun(game, SCREEN_WIN);
        } else {
          startLevel(game);
          game.screen = SCREEN_PLAY;
        }
      }
    }
    return;
  }
  if (game.screen !== SCREEN_PLAY || game.paused) return;

  game.playSeconds += worldDt;
  movePlayer(game, worldDt);
  const gone = stepSky(game.sky, worldDt, game.rng, levelAt(game.levelIndex), game.levelIndex >= 2);
  game.missed += gone.length;
  checkCatches(game);
  if (game.screen !== SCREEN_PLAY) return;

  game.timeLeft -= worldDt;
  if (game.timeLeft <= 0) loseNight(game);
}

// One-shot actions from keys and clicks, handled by main.js.
export function pressStart(game) {
  unlockAudio(game.audio);
  playClick(game.audio);
  startRun(game);
}

export function pressRestart(game) {
  unlockAudio(game.audio);
  playClick(game.audio);
  startRun(game);
}

export function togglePause(game) {
  if (game.screen !== SCREEN_PLAY) return;
  game.paused = !game.paused;
  playClick(game.audio);
}

export function toggleMute(game) {
  game.muted = !game.muted;
  setMuted(game.audio, game.muted);
}
