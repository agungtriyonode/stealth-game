// Satpam museum. Mesin status: patrol (ronda di jalur) -> suspicious (curiga,
// mendekat ke titik terakhir terlihat) -> chase (mengejar) -> search (mencari
// di titik terakhir, lalu kembali ronda). Kecurigaan naik saat pemain terlihat
// (lebih cepat saat lari/dekat/terang), turun saat pemain hilang. Lari pemain
// juga terdengar. Satu satpam yang alarm membuat satpam dekat ikut siaga.
import {
  CATCH_DISTANCE,
  GUARD_CHASE_SPEED,
  GUARD_HEARING_RANGE,
  GUARD_PATROL_SPEED,
  GUARD_SUSPICION_DECAY,
  SPOT_BASE_RATE,
  SPOT_CROUCH_MULT,
  SPOT_DARK_MULT,
  SPOT_RUN_MULT,
  TILE,
} from './config.js';
import { findPath, isDarkTile, tileOf } from './grid.js';
import { angleDiff, canSeePoint } from './vision.js';

export const GUARD_STATE = { PATROL: 'patrol', SUSPICIOUS: 'suspicious', CHASE: 'chase', SEARCH: 'search' };

export function createGuard(def) {
  return {
    x: def.spawn.x,
    y: def.spawn.y,
    dir: 0,
    path: def.path,
    wpIndex: 1,
    pause: def.pause,
    pauseTimer: 0,
    state: GUARD_STATE.PATROL,
    suspicion: 0,
    lastSeen: null,
    lastSeenTimer: 0,
    searchTimer: 0,
    chasePath: [],
    chaseRepath: 0,
    facing: 0,
  };
}

// Bergerak menuju titik (tx, ty) dengan kecepatan speed; berhenti bila sampai.
// Mengembalikan true bila sudah sampai. Dinding dihindari dengan pemisahan sumbu.
function moveToward(guard, grid, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Gerak sumbu X dulu, lalu Y: menempel dinding lalu meluncur di sisinya.
  if (!hitsWall(grid, nx, guard.y)) guard.x = nx;
  if (!hitsWall(grid, guard.x, ny)) guard.y = ny;
  // Arah hadap hanya diubah saat target masih jauh: di titik tujuan satpam
  // tidak boleh berputar karena goyangan overshoot (itu membuatnya seketika
  // menatap pemain yang jauh dan merusak kesempatan pemain untuk pulih).
  if (dist > 6) guard.dir = Math.atan2(dy, dx);
  return dist - step < 2;
}

function hitsWall(grid, x, y) {
  const r = 11;
  const corners = [[-r, -r], [r, -r], [-r, r], [r, r]];
  for (const [ox, oy] of corners) {
    const { tx, ty } = tileOf(x + ox, y + oy);
    const t = grid[ty] && grid[ty][tx];
    if (t === '#' || t === 'C') return true;
  }
  return false;
}

export function updateGuard(guard, ctx) {
  const { dt, grid, player, time } = ctx;
  const seen = canSeePoint(guard, grid, player.x, player.y);
  const pTile = tileOf(player.x, player.y);
  const inDark = isDarkTile(grid, pTile.tx, pTile.ty);
  const inBush = grid[pTile.ty] && grid[pTile.ty][pTile.tx] === 'B';

  if (seen && !inBush) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    const close = 1 - (dist / 220) * 0.7;
    let rate = SPOT_BASE_RATE * Math.max(0.25, close);
    if (player.stance === 'run') rate *= SPOT_RUN_MULT;
    if (player.stance === 'crouch') rate *= SPOT_CROUCH_MULT;
    if (inDark) rate *= SPOT_DARK_MULT;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lastSeenTimer = 0;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD_SUSPICION_DECAY * dt);
    guard.lastSeenTimer += dt;
  }

  // Langkah lari terdengar meski tak terlihat.
  if (!seen && player.stance === 'run') {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (dist < GUARD_HEARING_RANGE) {
      guard.suspicion = Math.min(1, guard.suspicion + 0.35 * dt);
      if (!guard.lastSeen) guard.lastSeen = { x: player.x, y: player.y };
    }
  }

  if (guard.suspicion >= 1 && guard.state !== GUARD_STATE.CHASE) {
    guard.state = GUARD_STATE.CHASE;
    guard.chasePath = [];
    guard.chaseRepath = 0;
    ctx.events.push({ type: 'alarm', guard });
  }
  if (guard.state === GUARD_STATE.CHASE && guard.lastSeenTimer > 1.2) {
    const nearLastSeen =
      guard.lastSeen && Math.hypot(guard.x - guard.lastSeen.x, guard.y - guard.lastSeen.y) < 14;
    // Kehilangan jejak: kecurigaan reda, atau sudah sampai di titik terakhir
    // terlihat tapi pemain tak ada di sana — berhenti mengejar, mulai mencari.
    if (guard.suspicion < 0.35 || (nearLastSeen && guard.lastSeenTimer > 0.8)) {
      guard.state = GUARD_STATE.SEARCH;
      guard.searchTimer = 3;
    }
  }
  if (guard.state === GUARD_STATE.SEARCH) {
    guard.searchTimer -= dt;
    guard.dir += dt * 1.6; // menoleh ke segala arah
    if (guard.searchTimer <= 0) {
      guard.state = GUARD_STATE.PATROL;
      guard.suspicion = 0;
      guard.lastSeen = null;
    }
  }
  if (guard.state === GUARD_STATE.PATROL && guard.suspicion >= 0.55) {
    guard.state = GUARD_STATE.SUSPICIOUS;
  }
  if (guard.state === GUARD_STATE.SUSPICIOUS && guard.suspicion < 0.25) {
    guard.state = GUARD_STATE.PATROL;
  }

  if (guard.state === GUARD_STATE.PATROL) {
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
    } else {
      const target = guard.path[guard.wpIndex];
      if (moveToward(guard, grid, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.path.length;
        guard.pauseTimer = guard.pause;
      }
    }
  } else if (guard.state === GUARD_STATE.SUSPICIOUS && guard.lastSeen) {
    moveToward(guard, grid, guard.lastSeen.x, guard.lastSeen.y, GUARD_PATROL_SPEED * 1.25, dt);
  } else if (guard.state === GUARD_STATE.CHASE && guard.lastSeen) {
    guard.chaseRepath -= dt;
    if (guard.chaseRepath <= 0) {
      guard.chaseRepath = 0.4;
      const from = tileOf(guard.x, guard.y);
      const to = tileOf(guard.lastSeen.x, guard.lastSeen.y);
      guard.chasePath = findPath(grid, from.tx, from.ty, to.tx, to.ty);
    }
    const next = guard.chasePath[0];
    if (next) {
      if (moveToward(guard, grid, next.x, next.y, GUARD_CHASE_SPEED, dt)) guard.chasePath.shift();
    } else {
      moveToward(guard, grid, guard.lastSeen.x, guard.lastSeen.y, GUARD_CHASE_SPEED, dt);
    }
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DISTANCE) {
      ctx.events.push({ type: 'caught', guard });
    }
  }

  // Arah hadap merata (dipakai render saat diam).
  guard.facing = guard.dir;
  void time;
  void TILE;
}

export function guardAlertColor(guard) {
  if (guard.state === GUARD_STATE.CHASE) return 'alert';
  if (guard.state === GUARD_STATE.SUSPICIOUS || guard.state === GUARD_STATE.SEARCH) return 'suspicious';
  if (guard.suspicion > 0.3) return 'suspicious';
  return 'patrol';
}
