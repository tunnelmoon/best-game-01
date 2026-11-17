// Starweave tuning: every number the game balances on lives here, so a playtest
// that changes the feel only touches this file.

export const FIELD = {
  width: 1280,
  height: 720,
  // The stargazer roams the lower two thirds of the sky.
  floor: 690,
  ceiling: 360,
  margin: 48,
};

export const PLAYER = {
  radius: 26,
  speed: 540,
  // How fast the stargazer eases toward the mouse.
  mouseEase: 14,
  // Seconds of blinking safety after a comet hit.
  shieldSeconds: 1.4,
};

export const FALL = {
  starRadius: 11,
  cometRadius: 14,
  // Sway of a falling star, in pixels and cycles per second.
  swayPixels: 34,
  swayHertz: 1.1,
  // A star that passes this line is gone for good.
  goneY: 748,
};

// One entry per level: the constellation to trace, how fast the sky falls,
// how often it spawns, how often a spawn is a comet, and how long the night lasts.
export const LEVELS = [
  {
    name: 'The Lantern',
    nodes: [[0.5, 0.12], [0.28, 0.72], [0.72, 0.72]],
    fallSpeed: 92,
    spawnEvery: 1.15,
    cometChance: 0.1,
    nightSeconds: 75,
  },
  {
    name: 'The Fox',
    nodes: [[0.14, 0.2], [0.5, 0.46], [0.86, 0.2], [0.5, 0.86]],
    fallSpeed: 108,
    spawnEvery: 1.0,
    cometChance: 0.15,
    nightSeconds: 70,
  },
  {
    name: 'The Harp',
    nodes: [[0.2, 0.14], [0.5, 0.3], [0.8, 0.14], [0.66, 0.76], [0.34, 0.76]],
    fallSpeed: 124,
    spawnEvery: 0.88,
    cometChance: 0.19,
    nightSeconds: 65,
  },
  {
    name: 'The Crown',
    nodes: [[0.1, 0.76], [0.26, 0.2], [0.5, 0.56], [0.74, 0.2], [0.9, 0.76]],
    fallSpeed: 140,
    spawnEvery: 0.78,
    cometChance: 0.23,
    nightSeconds: 60,
  },
  {
    name: 'The Serpent',
    nodes: [[0.14, 0.2], [0.4, 0.46], [0.62, 0.24], [0.44, 0.62], [0.7, 0.76], [0.86, 0.5]],
    fallSpeed: 158,
    spawnEvery: 0.68,
    cometChance: 0.27,
    nightSeconds: 55,
  },
  {
    name: 'The Phoenix',
    nodes: [[0.5, 0.08], [0.24, 0.36], [0.5, 0.5], [0.76, 0.36], [0.3, 0.76], [0.5, 0.6], [0.7, 0.76]],
    fallSpeed: 178,
    spawnEvery: 0.58,
    cometChance: 0.31,
    nightSeconds: 50,
  },
];

export const SCORE = {
  starBase: 100,
  // The combo multiplier stops growing here.
  comboCap: 8,
  // Bonus for finishing a constellation, times the level number.
  clearBonus: 500,
  wishBase: 300,
};

export const LIVES_START = 3;

export const PALETTE = {
  skyTop: '#070b24',
  skyBottom: '#1c1445',
  nebulaA: 'rgba(124, 92, 220, 0.16)',
  nebulaB: 'rgba(46, 190, 178, 0.12)',
  starCore: '#fff7d6',
  starGlow: '#ffd76a',
  cometCore: '#ff5a3c',
  cometGlow: '#ff9a3c',
  wishCore: '#e8ff9a',
  wishGlow: '#b8ff5a',
  line: 'rgba(255, 215, 106, 0.85)',
  ghostLine: 'rgba(150, 170, 255, 0.20)',
  ghostNode: 'rgba(190, 205, 255, 0.35)',
  playerCore: '#cfe8ff',
  playerGlow: '#6fb7ff',
  hud: '#e8ecff',
  hudDim: '#9aa5d6',
  danger: '#ff6a5e',
  good: '#ffd76a',
};
