// One pooled particle list and one floating-text list. Nothing is allocated
// while the game runs: bursts reuse dead slots.

export function makeParticles(capacity = 240) {
  const pool = [];
  for (let i = 0; i < capacity; i += 1) {
    pool.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff' });
  }
  return { pool, cursor: 0, texts: [] };
}

function nextSlot(bag) {
  for (let i = 0; i < bag.pool.length; i += 1) {
    bag.cursor = (bag.cursor + 1) % bag.pool.length;
    if (!bag.pool[bag.cursor].alive) return bag.pool[bag.cursor];
  }
  return bag.pool[bag.cursor];
}

export function burst(bag, x, y, color, count, speed, size = 3, rng = Math.random) {
  for (let i = 0; i < count; i += 1) {
    const p = nextSlot(bag);
    const angle = rng() * Math.PI * 2;
    const push = speed * (0.35 + rng() * 0.65);
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * push;
    p.vy = Math.sin(angle) * push - speed * 0.25;
    p.max = 0.5 + rng() * 0.45;
    p.life = p.max;
    p.size = size * (0.6 + rng() * 0.8);
    p.color = color;
  }
}

export function ring(bag, x, y, color, count = 26, speed = 260) {
  for (let i = 0; i < count; i += 1) {
    const p = nextSlot(bag);
    const angle = (i / count) * Math.PI * 2;
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.max = 0.7;
    p.life = p.max;
    p.size = 3;
    p.color = color;
  }
}

export function floatText(bag, x, y, text, color) {
  bag.texts.push({ x, y, text, color, life: 1.1, max: 1.1 });
  if (bag.texts.length > 24) bag.texts.shift();
}

export function stepParticles(bag, dt) {
  for (const p of bag.pool) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.alive = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 140 * dt;
    p.vx *= 1 - 1.6 * dt;
  }
  for (let i = bag.texts.length - 1; i >= 0; i -= 1) {
    const t = bag.texts[i];
    t.life -= dt;
    t.y -= 42 * dt;
    if (t.life <= 0) bag.texts.splice(i, 1);
  }
}

export function drawParticles(ctx, bag) {
  for (const p of bag.pool) {
    if (!p.alive) continue;
    const alpha = Math.max(p.life / p.max, 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of bag.texts) {
    const alpha = Math.max(t.life / t.max, 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
