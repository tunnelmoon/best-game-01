// Every pixel Starweave draws: the night sky, the ghost constellation, the
// falling objects, the stargazer, the HUD, and the title, clear, over and win
// screens. Nothing here changes the simulation; it only reads the state.

import { FIELD, PALETTE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_OVER, SCREEN_WIN } from './game.js';
import { constellationNodes, levelName, levelAt, GHOST } from './levels.js';
import { KIND_STAR, KIND_COMET, KIND_WISH } from './entities.js';
import { drawParticles } from './particles.js';
import { shakeOffset, drawFlash } from './feedback.js';

function skyGradient(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawNebula(ctx, time) {
  const blobs = [
    { x: 220 + Math.sin(time * 0.05) * 18, y: 150, r: 260, color: PALETTE.nebulaA },
    { x: 1060 + Math.cos(time * 0.04) * 22, y: 240, r: 300, color: PALETTE.nebulaB },
    { x: 640, y: 620, r: 320, color: PALETTE.nebulaA },
  ];
  for (const blob of blobs) {
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
    gradient.addColorStop(0, blob.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(blob.x - blob.r, blob.y - blob.r, blob.r * 2, blob.r * 2);
  }
}

function drawBackgroundStars(ctx, game) {
  for (const star of game.background) {
    const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(game.time * star.speed + star.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function ghostPoint(index, count) {
  const nodes = constellationNodes(count);
  const point = nodes[Math.min(index, nodes.length - 1)];
  return { x: GHOST.x + point[0] * GHOST.width, y: GHOST.y + point[1] * GHOST.height };
}

function drawGhost(ctx, game) {
  const nodes = constellationNodes(game.levelIndex);
  ctx.save();
  ctx.strokeStyle = PALETTE.ghostLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < nodes.length; i += 1) {
    const p = ghostPoint(i, game.levelIndex);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  for (let i = 0; i < nodes.length; i += 1) {
    const p = ghostPoint(i, game.levelIndex);
    const lit = i < game.chain;
    ctx.beginPath();
    ctx.arc(p.x, p.y, lit ? 9 : 6, 0, Math.PI * 2);
    if (lit) {
      ctx.fillStyle = PALETTE.starGlow;
      ctx.shadowColor = PALETTE.starGlow;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = PALETTE.ghostNode;
      ctx.fill();
    }
    ctx.fillStyle = lit ? '#20160a' : '#cdd6ff';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), p.x, p.y + 4);
  }
  ctx.restore();
}

function drawBeams(ctx, game) {
  for (const beam of game.beams) {
    const alpha = Math.max(beam.life / beam.max, 0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 3;
    ctx.shadowColor = PALETTE.starGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function sparkle(ctx, x, y, radius, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - radius * 1.6, y);
  ctx.lineTo(x + radius * 1.6, y);
  ctx.moveTo(x, y - radius * 1.6);
  ctx.lineTo(x, y + radius * 1.6);
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, item, time) {
  const glow = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius * 3.2);
  glow.addColorStop(0, 'rgba(255, 215, 106, 0.85)');
  glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 3.2, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, item.x, item.y, item.radius, PALETTE.starCore);
  ctx.fillStyle = PALETTE.starCore;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function drawComet(ctx, item) {
  const tail = 64;
  const gradient = ctx.createLinearGradient(item.x, item.y - tail, item.x, item.y);
  gradient.addColorStop(0, 'rgba(255, 90, 60, 0)');
  gradient.addColorStop(1, 'rgba(255, 154, 60, 0.9)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(item.x, item.y - tail);
  ctx.lineTo(item.x, item.y);
  ctx.stroke();
  const glow = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius * 2.6);
  glow.addColorStop(0, 'rgba(255, 90, 60, 0.9)');
  glow.addColorStop(1, 'rgba(255, 90, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd2c2';
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawWish(ctx, item, time) {
  const pulse = 1 + 0.18 * Math.sin(time * 6);
  const glow = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius * 3.6);
  glow.addColorStop(0, 'rgba(184, 255, 90, 0.9)');
  glow.addColorStop(1, 'rgba(184, 255, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 3.6 * pulse, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, item.x, item.y, item.radius * 1.2, PALETTE.wishCore);
  ctx.fillStyle = PALETTE.wishCore;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawItems(ctx, game) {
  for (const item of game.sky.items) {
    if (!item.active) continue;
    if (item.kind === KIND_STAR) drawStar(ctx, item, game.time);
    else if (item.kind === KIND_COMET) drawComet(ctx, item);
    else if (item.kind === KIND_WISH) drawWish(ctx, item, game.time);
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  const blink = p.shield > 0 && Math.floor(game.time * 12) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  const glow = ctx.createRadialGradient(p.x, p.y - 8, 0, p.x, p.y - 8, 64);
  glow.addColorStop(0, 'rgba(111, 183, 255, 0.55)');
  glow.addColorStop(1, 'rgba(111, 183, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 8, 64, 0, Math.PI * 2);
  ctx.fill();
  // Cloak.
  ctx.fillStyle = '#2c4a7a';
  ctx.beginPath();
  ctx.moveTo(p.x - 20, p.y + 22);
  ctx.lineTo(p.x, p.y - 26);
  ctx.lineTo(p.x + 20, p.y + 22);
  ctx.closePath();
  ctx.fill();
  // Hood and face.
  ctx.fillStyle = '#3d639e';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerCore;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  // Little wand star.
  ctx.fillStyle = PALETTE.starGlow;
  ctx.beginPath();
  ctx.arc(p.x + 22, p.y - 30, 5, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, p.x + 22, p.y - 30, 6, PALETTE.starCore);
  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(160, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 4, PLAYER_RADIUS + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

const PLAYER_RADIUS = 26;

function drawHud(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 26, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${game.score}`, 20, 28);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText(`BEST ${game.best}`, 20, 52);
  // Centre: the constellation being traced.
  const nodes = constellationNodes(game.levelIndex);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(levelName(game.levelIndex).toUpperCase(), 640, 24);
  const dotGap = 26;
  const startX = 640 - ((nodes.length - 1) * dotGap) / 2;
  for (let i = 0; i < nodes.length; i += 1) {
    const lit = i < game.chain;
    ctx.beginPath();
    ctx.arc(startX + i * dotGap, 46, lit ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = lit ? PALETTE.starGlow : 'rgba(154, 165, 214, 0.5)';
    ctx.fill();
    if (lit) {
      ctx.strokeStyle = '#fff7d6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // Right: lives and level.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${game.levelIndex + 1}/6`, 1260, 28);
  for (let i = 0; i < 3; i += 1) {
    const x = 1210 + i * 26;
    ctx.fillStyle = i < game.lives ? PALETTE.starGlow : 'rgba(154, 165, 214, 0.35)';
    ctx.beginPath();
    ctx.arc(x, 48, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Night timer bar.
  const max = levelAt(game.levelIndex).nightSeconds;
  const ratio = Math.max(game.timeLeft / max, 0);
  ctx.fillStyle = 'rgba(154, 165, 214, 0.3)';
  ctx.fillRect(440, 70, 400, 8);
  ctx.fillStyle = ratio < 0.25 ? PALETTE.danger : '#8fb7ff';
  ctx.fillRect(440, 70, 400 * ratio, 8);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`NIGHT ${Math.ceil(game.timeLeft)}s`, 640, 92);
  ctx.restore();
}

function drawHint(ctx, game) {
  if (game.levelIndex !== 0 || game.caught > 0) return;
  ctx.save();
  ctx.fillStyle = 'rgba(232, 236, 255, 0.85)';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move with the mouse or WASD - catch the falling stars, dodge the red comets', 640, 690);
  ctx.restore();
}

function panel(ctx, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 9, 28, 0.82)';
  ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTitle(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 26, 0.35)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.starGlow;
  ctx.font = '800 96px system-ui, sans-serif';
  ctx.shadowColor = '#ffd76a';
  ctx.shadowBlur = 34;
  ctx.fillText('STARWEAVE', 640, 250);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText('Catch the falling stars. Trace the constellations before the night ends.', 640, 300);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText('Mouse or WASD to move  -  catch stars in order  -  dodge the red comets', 640, 350);
  ctx.fillText('P pauses  -  M mutes  -  6 constellations to weave, 3 lives a night', 640, 382);
  // The prompt stays at full brightness: a screenshot is one frame, and a
  // blinking prompt can be caught at its dimmest.
  ctx.fillStyle = '#fff7d6';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 470);
  if (game.best > 0) {
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${game.best}`, 640, 520);
  }
  ctx.restore();
}

function drawClear(ctx, game) {
  const banner = game.banner;
  if (!banner) return;
  panel(ctx, 340, 230, 600, 210);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.starGlow;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText(banner.title, 640, 300);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '600 26px system-ui, sans-serif';
  ctx.fillText(`${banner.name} is woven into the sky`, 640, 348);
  ctx.fillStyle = PALETTE.good;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(`BONUS +${banner.bonus}`, 640, 392);
  ctx.restore();
}

function drawStats(ctx, game, title, lines) {
  panel(ctx, 340, 170, 600, 360);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.starGlow;
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText(title, 640, 250);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '600 24px system-ui, sans-serif';
  let y = 310;
  for (const line of lines) {
    ctx.fillText(line, 640, y);
    y += 38;
  }
  // Steady prompt, never blinking: the restart line must read in one frame.
  ctx.fillStyle = '#fff7d6';
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', 640, 500);
  ctx.restore();
}

function drawOver(ctx, game) {
  drawStats(ctx, game, 'THE NIGHT ENDS', [
    `SCORE ${game.score}   -   BEST ${game.best}`,
    `Constellations woven: ${game.levelIndex} of 6`,
    `Stars caught: ${game.caught}   -   Comets hit: ${game.cometsHit}`,
    `Time under the stars: ${Math.floor(game.playSeconds)}s`,
  ]);
}

function drawWin(ctx, game) {
  drawStats(ctx, game, 'THE SKY IS WOVEN', [
    `SCORE ${game.score}   -   BEST ${game.best}`,
    'All 6 constellations shine tonight',
    `Stars caught: ${game.caught}   -   Comets hit: ${game.cometsHit}`,
    `Time under the stars: ${Math.floor(game.playSeconds)}s`,
  ]);
}

function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 26, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '800 56px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 350);
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('Press P to keep playing', 640, 396);
  ctx.restore();
}

export function renderGame(ctx, game) {
  const offset = shakeOffset(game.feedback);
  ctx.save();
  ctx.translate(offset.x, offset.y);
  skyGradient(ctx);
  drawNebula(ctx, game.time);
  drawBackgroundStars(ctx, game);
  if (game.screen !== SCREEN_TITLE) drawGhost(ctx, game);
  drawBeams(ctx, game);
  drawItems(ctx, game);
  drawPlayer(ctx, game);
  drawParticles(ctx, game.particles);
  ctx.restore();
  if (game.screen === SCREEN_TITLE) {
    drawTitle(ctx, game);
    return;
  }
  drawHud(ctx, game);
  drawHint(ctx, game);
  if (game.screen === SCREEN_CLEAR) drawClear(ctx, game);
  if (game.screen === SCREEN_OVER) drawOver(ctx, game);
  if (game.screen === SCREEN_WIN) drawWin(ctx, game);
  if (game.paused && game.screen === SCREEN_PLAY) drawPaused(ctx);
  drawFlash(ctx, game.feedback, FIELD.width, FIELD.height);
}
