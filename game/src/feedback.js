// Trauma shake and hit-stop, after the game-feel pattern: trauma adds up and
// decays in real time, the shake is trauma squared through summed sines (never
// a fresh random per frame), and hit-stop freezes the world while the shake
// keeps settling. Only the newest hit-stop owns the restore.

export function makeFeedback() {
  return {
    trauma: 0,
    time: 0,
    timeScale: 1,
    hitStopId: 0,
    flash: 0,
    flashColor: '255,255,255',
    shakeStrength: 1,
  };
}

export function addTrauma(feedback, amount) {
  feedback.trauma = Math.min(feedback.trauma + amount, 1);
}

export function addFlash(feedback, strength, color) {
  feedback.flash = Math.min(feedback.flash + strength, 0.85);
  feedback.flashColor = color;
}

export function hitStop(feedback, duration, slow = 0.06) {
  feedback.hitStopId += 1;
  const id = feedback.hitStopId;
  feedback.timeScale = slow;
  const restoreAt = feedback.time + duration;
  feedback.restoreAt = restoreAt;
  feedback.restoreId = id;
}

// Advance the shake clock in real seconds; call every frame with real dt.
export function stepFeedback(feedback, realDt) {
  feedback.time += realDt;
  if (feedback.restoreAt !== undefined && feedback.time >= feedback.restoreAt) {
    if (feedback.restoreId === feedback.hitStopId) feedback.timeScale = 1;
    feedback.restoreAt = undefined;
  }
  feedback.trauma = Math.max(feedback.trauma - 1.5 * realDt, 0);
  feedback.flash = Math.max(feedback.flash - 2.2 * realDt, 0);
}

// The camera offset for this frame (visual only, never the simulation).
export function shakeOffset(feedback) {
  const shake = feedback.trauma * feedback.trauma * feedback.shakeStrength;
  const t = feedback.time * 30;
  return {
    x: 11 * shake * (0.6 * Math.sin(t * 1.7) + 0.4 * Math.sin(t * 2.9)),
    y: 8 * shake * (0.6 * Math.sin(t * 2.3) + 0.4 * Math.sin(t * 3.1)),
  };
}

export function drawFlash(ctx, feedback, width, height) {
  if (feedback.flash <= 0.01) return;
  ctx.fillStyle = `rgba(${feedback.flashColor}, ${feedback.flash.toFixed(3)})`;
  ctx.fillRect(0, 0, width, height);
}
