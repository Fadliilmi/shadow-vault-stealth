// Keyboard and mouse input.
// One job: turn keys and clicks into the `input` object the player reads.
export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
  };
  const keys = {};

  function refresh() {
    input.up = !!(keys.ArrowUp || keys.KeyW);
    input.down = !!(keys.ArrowDown || keys.KeyS);
    input.left = !!(keys.ArrowLeft || keys.KeyA);
    input.right = !!(keys.ArrowRight || keys.KeyD);
    input.sneak = !!(keys.ShiftLeft || keys.ShiftRight);
  }

  window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    refresh();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (typeof input.onKey === 'function') input.onKey(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    refresh();
  });
  window.addEventListener('blur', () => {
    for (const code of Object.keys(keys)) keys[code] = false;
    refresh();
  });

  // Click to walk: the player strolls toward the clicked floor tile.
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (typeof input.onClick === 'function') input.onClick(x, y);
  });

  return input;
}
