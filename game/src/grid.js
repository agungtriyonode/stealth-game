// Grid dan pathfinding. Satu-satunya tempat yang tahu arti tiap huruf peta:
// '#' dinding, '.' lantai, 'D' lantai gelap (bayangan), 'C' peti, 'B' semak,
// 'P' awal pemain, 'E' pintu keluar, 'L' artefak. BFS 4-arah dipakai satpam
// saat mengejar dan autopilot screenshot saat menyusup.
import { COLS, ROWS, TILE } from './config.js';

export function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return grid[ty][tx];
}

export function isSolid(grid, tx, ty) {
  const t = tileAt(grid, tx, ty);
  return t === '#' || t === 'C';
}

export function blocksSight(grid, tx, ty) {
  const t = tileAt(grid, tx, ty);
  return t === '#' || t === 'C' || t === 'B';
}

export function isDarkTile(grid, tx, ty) {
  return tileAt(grid, tx, ty) === 'D';
}

export function tileOf(x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// Garis pandang: sampel tiap 4 piksel; terhalang bila satu sampel pun jatuh di
// tile penutup. Titik ujung ikut dihitung, jadi pemain yang berdiri di dalam
// semak tidak terlihat, dan satpam di balik peti pun tidak bisa mengintip.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 0; i <= steps; i += 1) {
    const x = x0 + (dx * i) / steps;
    const y = y0 + (dy * i) / steps;
    const { tx, ty } = tileOf(x, y);
    if (blocksSight(grid, tx, ty)) return false;
  }
  return true;
}

// BFS 4-arah dari tile awal ke tile tujuan; mengembalikan daftar titik tengah
// tile yang harus dilewati (tanpa tile awal). [] bila tujuan tak terjangkau.
export function findPath(grid, sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  if (isSolid(grid, tx, ty)) return [];
  const key = (x, y) => y * COLS + x;
  const prev = new Map();
  const queue = [[sx, sy]];
  prev.set(key(sx, sy), null);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (isSolid(grid, nx, ny)) continue;
      if (prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), [cx, cy]);
      if (nx === tx && ny === ty) {
        const path = [];
        let cur = [tx, ty];
        while (cur) {
          path.unshift(tileCenter(cur[0], cur[1]));
          cur = prev.get(key(cur[0], cur[1]));
        }
        path.shift(); // buang tile awal
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return [];
}

// Banjir dari tile awal: true bila semua target (exit + artefak) terjangkau.
export function allReachable(grid, start, targets) {
  const seen = new Set();
  const queue = [start];
  seen.add(start.ty * COLS + start.tx);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0) {
    const { tx, ty } = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (isSolid(grid, nx, ny)) continue;
      const k = ny * COLS + nx;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ tx: nx, ty: ny });
    }
  }
  return targets.every((t) => seen.has(t.ty * COLS + t.tx));
}
