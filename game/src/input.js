// Masukan keyboard + mouse. WASD/panah untuk bergerak, Shift lari, C/Ctrl
// merangkak, Enter/R untuk layar menu. Mouse dipakai untuk tombol di layar
// judul/menang/kalah. State mentah dibaca tiap frame oleh main.js.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    crouch: false,
    mouseX: 0,
    mouseY: 0,
    clicked: false,
    pressedEnter: false,
    pressedR: false,
  };

  function refresh() {
    input.up = keys.has('KeyW') || keys.has('ArrowUp');
    input.down = keys.has('KeyS') || keys.has('ArrowDown');
    input.left = keys.has('KeyA') || keys.has('ArrowLeft');
    input.right = keys.has('KeyD') || keys.has('ArrowRight');
    input.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.crouch = keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight');
  }

  function onKeyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Enter') input.pressedEnter = true;
    if (event.code === 'KeyR') input.pressedR = true;
    refresh();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
    refresh();
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }

  function onClick(event) {
    onMouseMove(event);
    input.clicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  return input;
}

// Dipanggil tiap akhir frame supaya klik/tekan tombol hanya berlaku sekali.
export function consumeTransient(input) {
  input.clicked = false;
  input.pressedEnter = false;
  input.pressedR = false;
}
