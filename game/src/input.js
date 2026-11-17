// Keyboard and mouse state, in field coordinates. The game reads this, never
// the DOM events directly, so the shot autopilot can drive the same fields.

export function makeInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    mouseX: 640,
    mouseY: 560,
    mouseSeen: false,
    clicked: false,
    pressedKeys: new Set(),
  };

  const KEYMAP = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
  };

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'Space' || event.code === 'Enter') event.preventDefault();
    if (!event.repeat) input.pressedKeys.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  });

  window.addEventListener('blur', () => {
    input.left = input.right = input.up = input.down = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const point = toField(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
    input.mouseSeen = true;
  });

  canvas.addEventListener('mousedown', (event) => {
    const point = toField(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
    input.mouseSeen = true;
    input.clicked = true;
  });

  return input;
}

// Pull and clear the keys pressed since the last frame.
export function takePressed(input) {
  const keys = new Set(input.pressedKeys);
  input.pressedKeys.clear();
  return keys;
}

export function takeClick(input) {
  const was = input.clicked;
  input.clicked = false;
  return was;
}
