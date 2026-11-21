// Penglihatan satpam: kerucut pandang + garis pandang. Kerucut digambar sebagai
// poligon hasil raycast (tiap sinar berhenti di dinding/peti/semak), jadi
// bayangan di balik cover benar-benar gelap. Semua hitungan di sini murni
// geometri supaya mudah diuji dari Node tanpa browser.
import { GUARD_VISION_HALF_ANGLE, GUARD_VISION_RANGE, TILE } from './config.js';
import { blocksSight, hasLineOfSight, tileOf } from './grid.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Apakah satpam melihat titik (x, y)? Syarat: dalam jangkauan, dalam sudut
// kerucut, dan garis pandang tidak terhalang.
export function canSeePoint(guard, grid, x, y) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VISION_RANGE) return false;
  if (dist > 1 && Math.abs(angleDiff(Math.atan2(dy, dx), guard.dir)) > GUARD_VISION_HALF_ANGLE) return false;
  return hasLineOfSight(grid, guard.x, guard.y, x, y);
}

// Poligon kerucut untuk digambar: 25 sinar dari -sudut sampai +sudut; tiap sinar
// melangkah 6 piksel sampai menabrak tile penutup atau mencapai jangkauan.
export function conePolygon(guard, grid) {
  const points = [{ x: guard.x, y: guard.y }];
  const rays = 25;
  for (let i = 0; i <= rays; i += 1) {
    const a = guard.dir - GUARD_VISION_HALF_ANGLE + (2 * GUARD_VISION_HALF_ANGLE * i) / rays;
    let r = GUARD_VISION_RANGE;
    for (let d = TILE / 4; d < GUARD_VISION_RANGE; d += 6) {
      const x = guard.x + Math.cos(a) * d;
      const y = guard.y + Math.sin(a) * d;
      const { tx, ty } = tileOf(x, y);
      if (blocksSight(grid, tx, ty)) {
        r = d;
        break;
      }
    }
    points.push({ x: guard.x + Math.cos(a) * r, y: guard.y + Math.sin(a) * r });
  }
  return points;
}
