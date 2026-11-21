// Raka si pencuri bayangan: jalan, lari (cepat tapi berisik dan mudah terlihat),
// merangkak (lambat tapi sulit terlihat). Tabrakan lingkaran lawan tile padat
// dengan pemisahan sumbu, jadi bisa meluncur di sepanjang dinding.
import {
  PLAYER_CROUCH_SPEED,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
  TILE,
} from './config.js';
import { isSolid, tileOf } from './grid.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    dir: -Math.PI / 2,
    stance: 'walk',
    moving: false,
    stepTimer: 0,
    loot: 0,
    noise: 0,
  };
}

function hitsSolid(grid, x, y) {
  const r = PLAYER_RADIUS;
  const corners = [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]];
  for (const [ox, oy] of corners) {
    const { tx, ty } = tileOf(x + ox, y + oy);
    if (isSolid(grid, tx, ty)) return true;
  }
  return false;
}

export function updatePlayer(player, input, grid, dt) {
  const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.stance = input.run ? 'run' : input.crouch ? 'crouch' : 'walk';
  player.noise = player.stance === 'run' ? 1 : player.stance === 'crouch' ? 0.08 : 0.35;
  if (!player.moving) {
    player.stepTimer = 0;
    return;
  }
  const speed = player.stance === 'run' ? PLAYER_RUN_SPEED : player.stance === 'crouch' ? PLAYER_CROUCH_SPEED : PLAYER_WALK_SPEED;
  const vx = (mx / len) * speed * dt;
  const vy = (my / len) * speed * dt;
  if (!hitsSolid(grid, player.x + vx, player.y)) player.x += vx;
  if (!hitsSolid(grid, player.x, player.y + vy)) player.y += vy;
  player.dir = Math.atan2(my, mx);
  // Penanda langkah untuk suara: makin cepat makin sering.
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    player.stepTimer = player.stance === 'run' ? 0.27 : player.stance === 'crouch' ? 0.6 : 0.44;
    player.stepped = true;
  } else {
    player.stepped = false;
  }
  void TILE;
}

// Ambil artefak yang terinjak; mengembalikan yang baru diambil (atau null).
export function tryPickup(player, loot) {
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) < TILE * 0.62) {
      item.taken = true;
      player.loot += 1;
      return item;
    }
  }
  return null;
}
