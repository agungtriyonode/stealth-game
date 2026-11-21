// Museum Malam — Pencuri Bayangan. Titik masuk game: loop requestAnimationFrame
// dengan langkah tetap 1/60 detik, mesin layar (title/play/clear/win/caught),
// dan mode screenshot (?shot=...) yang membekukan satu frame hasil simulasi.
import { HUD_HEIGHT, STEP, TILE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createGuard, updateGuard } from './guards.js';
import { createPlayer, tryPickup, updatePlayer } from './player.js';
import { consumeTransient, createInput } from './input.js';
import { SoundFX } from './audio.js';
import { render } from './render.js';
import { canSeePoint } from './vision.js';
import { stageShot } from './shots.js';
import { tileOf } from './grid.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = createInput(canvas);
    this.sound = new SoundFX();
    this.screen = 'title';
    this.levelIndex = 0;
    this.time = 0;
    this.elapsed = 0;
    this.elapsedTotal = 0;
    this.totalLoot = 0;
    this.totalLootMax = LEVELS.reduce((n, def) => n + def.map.join('').split('L').length - 1, 0);
    this.playerSeen = false;
    this.maxSuspicion = 0;
    this.anyAlert = false;
    this.frozen = false;
    this.uiButtons = [];
    this.lastBeep = 0;
    this.loadLevel(0);
    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = parseLevel(LEVELS[index]);
    this.player = createPlayer(this.level.playerStart);
    this.guards = this.level.guards.map(createGuard);
    this.elapsed = 0;
    this.playerSeen = false;
    this.maxSuspicion = 0;
    this.anyAlert = false;
    this.sound.alarmStop();
  }

  // Satu langkah dunia (dipakai loop utama dan autopilot screenshot).
  stepWorld(dt, input) {
    if (this.screen !== 'play') return;
    this.time += dt;
    this.elapsed += dt;
    updatePlayer(this.player, input, this.level.grid, dt);
    if (this.player.stepped) this.sound.footstep(this.player.stance === 'run');
    const ctx = { dt, grid: this.level.grid, player: this.player, time: this.time, events: [] };
    for (const guard of this.guards) updateGuard(guard, ctx);
    for (const event of ctx.events) {
      if (event.type === 'alarm') {
        this.sound.alarmStart();
        this.sound.suspicionBeep(1);
      }
      if (event.type === 'caught') this.onCaught();
    }
    const picked = tryPickup(this.player, this.level.loot);
    if (picked) this.sound.pickup();
    // Status deteksi untuk HUD.
    const pTile = tileOf(this.player.x, this.player.y);
    const inBush = this.level.grid[pTile.ty] && this.level.grid[pTile.ty][pTile.tx] === 'B';
    this.playerSeen = !inBush && this.guards.some((g) => canSeePoint(g, this.level.grid, this.player.x, this.player.y));
    this.maxSuspicion = Math.max(0, ...this.guards.map((g) => g.suspicion));
    this.anyAlert = this.guards.some((g) => g.state === 'chase');
    if (!this.anyAlert) this.sound.alarmStop();
    if (this.maxSuspicion > 0.25 && this.time - this.lastBeep > 0.5) {
      this.lastBeep = this.time;
      this.sound.suspicionBeep(this.maxSuspicion);
    }
    // Sampai di pintu keluar?
    const exit = this.level.exit;
    if (Math.hypot(this.player.x - exit.x, this.player.y - exit.y) < TILE * 0.7) {
      this.onExit();
    }
  }

  onExit() {
    this.totalLoot += this.player.loot;
    this.elapsedTotal += this.elapsed;
    this.sound.win();
    this.sound.alarmStop();
    if (this.levelIndex + 1 < LEVELS.length) {
      this.screen = 'clear';
    } else {
      this.screen = 'win';
    }
  }

  onCaught() {
    if (this.screen !== 'play') return;
    this.screen = 'caught';
    this.sound.caught();
    this.sound.alarmStop();
  }

  nextLevel() {
    this.loadLevel(this.levelIndex + 1);
    this.screen = 'play';
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.screen = 'play';
  }

  restartGame() {
    this.totalLoot = 0;
    this.elapsedTotal = 0;
    this.loadLevel(0);
    this.screen = 'title';
  }

  handleButtons() {
    if (!this.input.clicked) return;
    for (const b of this.uiButtons) {
      if (this.input.mouseX >= b.x && this.input.mouseX <= b.x + b.w && this.input.mouseY >= b.y && this.input.mouseY <= b.y + b.h) {
        this.sound.ensure();
        this.sound.click();
        if (b.id === 'start') this.screen = 'play';
        if (b.id === 'next') this.nextLevel();
        if (b.id === 'again') this.restartGame();
        if (b.id === 'retry') this.restartLevel();
        break;
      }
    }
  }

  handleKeys() {
    if (this.input.pressedEnter) {
      this.sound.ensure();
      if (this.screen === 'title') this.screen = 'play';
      else if (this.screen === 'clear') this.nextLevel();
    }
    if (this.input.pressedR) {
      this.sound.ensure();
      if (this.screen === 'caught') this.restartLevel();
      else if (this.screen === 'win') this.restartGame();
      else if (this.screen === 'clear') this.nextLevel();
    }
  }

  fitCanvas() {
    const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
    this.canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
    this.canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
  }

  frame(dt) {
    if (!this.frozen) {
      this.handleButtons();
      this.handleKeys();
      this.stepWorld(dt, this.input);
    }
    render(this.ctx, this);
    consumeTransient(this.input);
  }

  run() {
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += delta;
      let n = 0;
      while (acc >= STEP && n < 5) {
        this.frame(STEP);
        acc -= STEP;
        n += 1;
      }
      if (n === 5) acc = 0;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Boot: ?shot=start|play|alarm|win memanggungkan satu scene lalu membekukan
// frame-nya; tanpa itu game berjalan interaktif dari layar judul.
const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const game = new Game(canvas);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, game);
  game.frozen = true;
  game.frame(0);
} else {
  game.run();
}
window.__game = game;
