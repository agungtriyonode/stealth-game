// Scene screenshot (?shot=start|play|alarm|win). Tiap scene memainkan aturan
// game yang sebenarnya maju selangkah demi selangkah dari dunia segar, disetir
// autopilot sederhana (BFS ke target, merangkak saat terlihat, menunggu bila
// jalan di depan tertutup kerucut, lari bila dikejar), jadi tiap frame adalah
// tampilan game yang sesungguhnya — dan seed yang sama selalu memberi frame
// yang sama. Tanpa Math.random: semua deterministik.
import { STEP } from './config.js';
import { findPath, tileOf } from './grid.js';
import { canSeePoint } from './vision.js';

const SAMPLE = STEP;

function inputFor(game, target, opts = {}) {
  const p = game.player;
  const grid = game.level.grid;
  const threat = game.guards.find((g) => g.state === 'chase' || g.suspicion > 0.6);
  const out = { up: false, down: false, left: false, right: false, run: false, crouch: false };

  // Dikejar: lari menjauhi satpam terdekat.
  if (threat) {
    const dx = p.x - threat.x;
    const dy = p.y - threat.y;
    const len = Math.hypot(dx, dy) || 1;
    out.run = true;
    if (dy < -len * 0.3) out.up = true;
    if (dy > len * 0.3) out.down = true;
    if (dx < -len * 0.3) out.left = true;
    if (dx > len * 0.3) out.right = true;
    return out;
  }

  const from = tileOf(p.x, p.y);
  const to = tileOf(target.x, target.y);
  const path = findPath(grid, from.tx, from.ty, to.tx, to.ty);
  const next = path.length > 0 ? path[0] : target;
  const dx = next.x - p.x;
  const dy = next.y - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4 && path.length === 0) return { ...out, arrived: true };

  // Sedang terlihat: mundur menjauhi satpam yang melihat (jalan biasa, bukan
  // lari — lari berisik dan justru menarik perhatian). Jangan terus maju
  // menembus kerucut: itu cara tercepat ketangkap. (noFlee: untuk scene alarm,
  // pemain justru diam di dalam kerucut supaya alarm menyala.)
  const seers = game.guards.filter((g) => canSeePoint(g, grid, p.x, p.y));
  if (seers.length > 0 && !opts.noFlee) {
    const g = seers[0];
    const ax = p.x - g.x;
    const ay = p.y - g.y;
    const len = Math.hypot(ax, ay) || 1;
    if (ay < -len * 0.3) out.up = true;
    if (ay > len * 0.3) out.down = true;
    if (ax < -len * 0.3) out.left = true;
    if (ax > len * 0.3) out.right = true;
    return out;
  }

  // Titik berikutnya terlihat satpam? Tunggu (merangkak di tempat) sampai
  // patroli berlalu; tapi jangan menunggu selamanya.
  const nextSeen = game.guards.some((g) => canSeePoint(g, grid, next.x, next.y));
  if (nextSeen && !opts.bold) {
    game.shotWait = (game.shotWait || 0) + SAMPLE;
    if (game.shotWait < 6) return { ...out, crouch: true, waiting: true };
  } else {
    game.shotWait = 0;
  }
  if (dx < -4) out.left = true;
  if (dx > 4) out.right = true;
  if (dy < -4) out.up = true;
  if (dy > 4) out.down = true;
  return out;
}

// Mainkan dunia maju; kembalikan true bila pemain sampai di target.
function driveTo(game, target, maxSeconds, opts = {}) {
  const steps = Math.floor(maxSeconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const input = inputFor(game, target, opts);
    if (input.arrived) return true;
    game.stepWorld(SAMPLE, input);
    if (game.screen !== 'play') return false;
  }
  return false;
}

export function stageShot(name, game) {
  game.shotWait = 0;
  if (name === 'play') {
    game.loadLevel(0);
    game.screen = 'play';
    // Susup ke artefak paling jauh di ruang bawah (tepat di atas jalur patroli
    // satpam bawah), lalu berhenti di sana — frame menyusup melewati kerucut.
    const loot = game.level.loot[game.level.loot.length - 1];
    driveTo(game, { x: loot.x, y: loot.y }, 45);
    return;
  }
  if (name === 'alarm') {
    game.loadLevel(0);
    game.screen = 'play';
    // Dua langkah: (1) susup ke tile aman di utara jalur patroli satpam atas
    // (tak pernah terlihat dari sana); (2) turun satu tile ke ujung timur
    // jalur patrolinya dan diam — satpam yang meronda ke timur melihat pemain
    // dari jauh, kecurigaan naik, alarm menyala. Frame diambil tepat saat
    // status berubah kejar, sebelum satpam sempat menangkap.
    const idle = { up: false, down: false, left: false, right: false, run: false, crouch: false };
    driveTo(game, { x: 11 * 32 + 16, y: 2 * 32 + 16 }, 30);
    if (game.screen !== 'play') return;
    driveTo(game, { x: 11 * 32 + 16, y: 4 * 32 + 16 }, 15, { bold: true, noFlee: true });
    if (game.screen !== 'play') return;
    const steps = Math.floor(12 / SAMPLE);
    for (let i = 0; i < steps; i += 1) {
      game.stepWorld(SAMPLE, idle);
      if (game.guards.some((g) => g.state === 'chase')) break;
      if (game.screen !== 'play') break;
    }
    return;
  }
  if (name === 'win') {
    // Coba menangkan level terakhir langsung ke pintu keluar (artefak
    // opsional — tidak dikejar dulu supaya paparan ke satpam minimal);
    // bila autopilot gagal, menangkan level 1 sebagai gantinya.
    game.loadLevel(2);
    game.screen = 'play';
    driveTo(game, game.level.exit, 60);
    if (game.screen === 'win') return;
    game.loadLevel(0);
    game.screen = 'play';
    driveTo(game, game.level.exit, 45);
    return;
  }
  // start (default): level 1 utuh — kerucut, peti, semak, exit semua terlihat.
  game.loadLevel(0);
  game.screen = 'play';
  for (let i = 0; i < 2 / SAMPLE; i += 1) {
    game.stepWorld(SAMPLE, { up: false, down: false, left: false, right: false, run: false, crouch: false });
  }
}
