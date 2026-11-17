// Starweave boot: canvas, input, the fixed-step loop, and the deterministic
// shot mode (?shot=title|play|clear|over&seed=n) the screenshots are taken
// from. Live play runs on requestAnimationFrame; shot mode stages one scene
// and signals window.__shotReady when the frame is drawn.

import { makeInput, takePressed, takeClick } from './input.js';
import { makeRng } from './rng.js';
import {
  createGame, stepGame,
  STEP, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_WIN,
  pressStart, pressRestart, togglePause, toggleMute,
} from './game.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  const width = Math.floor(1280 * scale);
  const height = Math.floor(720 * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

const input = makeInput(canvas);
const rng = shotName ? makeRng(seed) : makeRng((Date.now() % 2147483647) | 1);
const game = createGame(input, rng);
// A debug handle for play-testing (read-only from the console).
window.__game = game;

if (shotName) {
  // Deterministic scene: stage it, draw one frame, signal readiness.
  stageShot(shotName, game, seed);
  renderGame(ctx, game);
  window.__shotReady = true;
} else {
  let last = performance.now();
  let debt = 0;

  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, 0.25);
    last = now;
    debt += elapsed;
    let guard = 0;
    while (debt >= STEP && guard < 5) {
      handleActions();
      stepGame(game, STEP);
      debt -= STEP;
      guard += 1;
    }
    if (guard === 5) debt = 0;
    renderGame(ctx, game);
    requestAnimationFrame(frame);
  }

  function handleActions() {
    const keys = takePressed(input);
    const clicked = takeClick(input);
    if (keys.has('KeyM')) toggleMute(game);
    if (game.screen === SCREEN_TITLE) {
      if (keys.has('Enter') || keys.has('Space') || clicked) pressStart(game);
      return;
    }
    if (game.screen === SCREEN_OVER || game.screen === SCREEN_WIN) {
      if (keys.has('KeyR') || keys.has('Enter') || keys.has('Space') || clicked) pressRestart(game);
      return;
    }
    if (game.screen === SCREEN_PLAY) {
      if (keys.has('KeyP') || keys.has('Escape')) togglePause(game);
    }
  }

  requestAnimationFrame(frame);
}
