// The night's six constellations and the pacing between them. Each level is a
// beat: teach first, then develop, twist, build, peak, climax, with a rest in
// the clear banner between spikes. The ghost constellation drawn in the sky
// uses these same node points, so the HUD diagram and the sky always agree.

import { LEVELS } from './config.js';

export function levelCount() {
  return LEVELS.length;
}

export function levelAt(index) {
  return LEVELS[Math.min(Math.max(index, 0), LEVELS.length - 1)];
}

// Node points in a 0..1 box; render scales them to wherever it draws.
export function constellationNodes(index) {
  return levelAt(index).nodes;
}

export function levelName(index) {
  return levelAt(index).name;
}

// Where the ghost constellation hangs in the sky, and how big it is drawn.
export const GHOST = {
  x: 440,
  y: 92,
  width: 400,
  height: 220,
};

// The beat list the pacing check reads: intensity per level, with the clear
// banner as the rest beat after each spike.
export function pacingBeats() {
  return [
    { level: 1, type: 'teach', intensity: 0.2 },
    { level: 1, type: 'rest', intensity: 0.1 },
    { level: 2, type: 'develop', intensity: 0.4 },
    { level: 2, type: 'rest', intensity: 0.1 },
    { level: 3, type: 'twist', intensity: 0.55 },
    { level: 3, type: 'rest', intensity: 0.1 },
    { level: 4, type: 'build', intensity: 0.7 },
    { level: 4, type: 'rest', intensity: 0.1 },
    { level: 5, type: 'peak', intensity: 0.85 },
    { level: 5, type: 'rest', intensity: 0.1 },
    { level: 6, type: 'climax', intensity: 1.0 },
  ];
}

// The pacing rule from the level-design skill: no more than two high beats in
// a row, a rest before the climax, and a teach beat first.
export function pacingProblems(beats) {
  const problems = [];
  let run = 0;
  for (let i = 0; i < beats.length; i += 1) {
    const beat = beats[i];
    run = beat.intensity >= 0.7 ? run + 1 : 0;
    if (run > 2) problems.push(`level ${beat.level}: ${run} high-intensity beats in a row`);
    if (beat.type === 'climax' && (i === 0 || beats[i - 1].type !== 'rest')) {
      problems.push(`level ${beat.level}: no rest beat right before the climax`);
    }
  }
  if (beats.length > 0 && beats[0].type !== 'teach') {
    problems.push('the night does not open with a teach beat');
  }
  return problems;
}
