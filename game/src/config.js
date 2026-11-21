// Museum Malam — Pencuri Bayangan. Konfigurasi pusat: ukuran arena, kecepatan,
// jarak pandang satpam, dan palet warna. Semua angka gameplay tinggal di sini
// supaya penyeimbangannya gampang diubah tanpa menyentuh logika lain.
export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const HUD_HEIGHT = 40;
export const VIEW_WIDTH = COLS * TILE; // 960
export const VIEW_HEIGHT = HUD_HEIGHT + ROWS * TILE; // 680
export const STEP = 1 / 60;

// Pemain: Raka si pencuri bayangan.
export const PLAYER_RADIUS = 11;
export const PLAYER_WALK_SPEED = 126;
export const PLAYER_RUN_SPEED = 196;
export const PLAYER_CROUCH_SPEED = 68;

// Satpam: patroli pelan, kejar sedikit lebih lambat dari lari pemain.
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 108;
export const GUARD_VISION_RANGE = 195;
export const GUARD_VISION_HALF_ANGLE = 0.61; // ~35 derajat ke tiap sisi
export const GUARD_SUSPICION_DECAY = 0.45; // per detik saat pemain tak terlihat
export const GUARD_HEARING_RANGE = 130; // langkah lari terdengar sejauh ini
export const CATCH_DISTANCE = 17;

// Seberapa cepat kecurigaan naik (per detik, pada jarak nol, jalan biasa, terang).
export const SPOT_BASE_RATE = 1.05;
export const SPOT_RUN_MULT = 1.6;
export const SPOT_CROUCH_MULT = 0.55;
export const SPOT_DARK_MULT = 0.55;

export const COLORS = {
  floorA: '#2b2f3a',
  floorB: '#262a33',
  floorDark: '#1b1e26',
  wall: '#4a5064',
  wallTop: '#6b7390',
  crate: '#7a5a34',
  crateTop: '#a07c46',
  bush: '#2f6b3a',
  bushLight: '#4a9a58',
  exit: '#39d98a',
  loot: '#ffd94d',
  player: '#19c2b8',
  playerDark: '#0e7c78',
  guard: '#e8e4d8',
  guardUniform: '#3d5a80',
  conePatrol: 'rgba(255, 217, 77, 0.30)',
  coneSuspicious: 'rgba(255, 140, 40, 0.38)',
  coneAlert: 'rgba(255, 60, 60, 0.42)',
  hudBg: '#14161d',
  hudText: '#e8e4d8',
  danger: '#ff5252',
  calm: '#39d98a',
};
