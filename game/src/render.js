// Semua gambar: lantai, dinding, peti, semak, pintu keluar, artefak, kerucut
// pandang satpam, karakter, lapisan gelap dengan lubang cahaya, HUD, dan layar
// judul/menang/kalah. Canvas 2D saja, tanpa aset luar: semua bentuk digambar
// dari kode supaya screenshot benar-benar render game ini.
import { COLORS, COLS, HUD_HEIGHT, ROWS, TILE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { conePolygon } from './vision.js';
import { guardAlertColor } from './guards.js';

let darkCanvas = null;

function getDarkCanvas() {
  if (!darkCanvas) {
    darkCanvas = document.createElement('canvas');
    darkCanvas.width = VIEW_WIDTH;
    darkCanvas.height = VIEW_HEIGHT;
  }
  return darkCanvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const x = tx * TILE;
      const y = HUD_HEIGHT + ty * TILE;
      const ch = level.grid[ty][tx];
      ctx.fillStyle = ch === 'D' ? COLORS.floorDark : (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      if (ch === 'D') {
        ctx.fillStyle = 'rgba(120, 140, 255, 0.05)';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      }
    }
  }
}

function drawWalls(ctx, level) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      if (level.grid[ty][tx] !== '#') continue;
      const x = tx * TILE;
      const y = HUD_HEIGHT + ty * TILE;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 2, y + 4, TILE, TILE);
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x + 4, y + 8, TILE - 8, TILE - 12);
    }
  }
}

function drawCover(ctx, level) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const ch = level.grid[ty][tx];
      const x = tx * TILE;
      const y = HUD_HEIGHT + ty * TILE;
      if (ch === 'C') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + 3, y + 5, TILE - 4, TILE - 4);
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(x + 3, y + 3, TILE - 6, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      } else if (ch === 'B') {
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(x + 11, y + 19, 10, 0, Math.PI * 2);
        ctx.arc(x + 21, y + 21, 10, 0, Math.PI * 2);
        ctx.arc(x + 16, y + 11, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.bushLight;
        ctx.beginPath();
        ctx.arc(x + 12, y + 13, 4, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 16, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawExit(ctx, level, time) {
  const { x, y } = level.exit;
  const cy = HUD_HEIGHT + y;
  const pulse = 0.55 + Math.sin(time * 3) * 0.2;
  const glow = ctx.createRadialGradient(x, cy, 6, x, cy, 64);
  glow.addColorStop(0, `rgba(57, 217, 138, ${0.5 * pulse + 0.25})`);
  glow.addColorStop(1, 'rgba(57, 217, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 64, cy - 64, 128, 128);
  ctx.fillStyle = '#0d2b1d';
  roundRect(ctx, x - 13, cy - 15, 26, 30, 4);
  ctx.fill();
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(x - 13, cy - 15, 26, 5);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, cy + 3);
  ctx.fillStyle = COLORS.exit;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('KELUAR', x, cy - 24);
}

function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const cy = HUD_HEIGHT + item.y + Math.sin(time * 2 + item.x) * 3;
    const glow = ctx.createRadialGradient(item.x, cy, 2, item.x, cy, 26);
    glow.addColorStop(0, 'rgba(255, 217, 77, 0.55)');
    glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(item.x - 26, cy - 26, 52, 52);
    ctx.save();
    ctx.translate(item.x, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.loot;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-7, -7, 14, 5);
    ctx.restore();
  }
}

function drawPatrolPaths(ctx, guards) {
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 228, 216, 0.14)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 8]);
  for (const g of guards) {
    ctx.beginPath();
    g.path.forEach((p, i) => {
      const y = HUD_HEIGHT + p.y;
      if (i === 0) ctx.moveTo(p.x, y);
      else ctx.lineTo(p.x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCones(ctx, level, guards) {
  for (const g of guards) {
    const kind = guardAlertColor(g);
    const fill = kind === 'alert' ? COLORS.coneAlert : kind === 'suspicious' ? COLORS.coneSuspicious : COLORS.conePatrol;
    const poly = conePolygon({ x: g.x, y: HUD_HEIGHT + g.y, dir: g.dir }, level.grid);
    ctx.fillStyle = fill;
    ctx.beginPath();
    poly.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
  }
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    const y = HUD_HEIGHT + g.y;
    const kind = guardAlertColor(g);
    // Badan: seragam + kepala.
    ctx.fillStyle = COLORS.guardUniform;
    ctx.beginPath();
    ctx.arc(g.x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Topi + arah hadap.
    ctx.fillStyle = '#20242e';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.dir) * 5, y + Math.sin(g.dir) * 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,228,216,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x + Math.cos(g.dir) * 8, y + Math.sin(g.dir) * 8);
    ctx.lineTo(g.x + Math.cos(g.dir) * 16, y + Math.sin(g.dir) * 16);
    ctx.stroke();
    // Tanda seru saat curiga / mengejar.
    if (kind !== 'patrol') {
      const bob = Math.sin(time * 6) * 2;
      ctx.fillStyle = kind === 'alert' ? '#ff5252' : '#ff9a3d';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(kind === 'alert' ? '!!' : '!', g.x, y - 24 + bob);
    } else if (g.suspicion > 0.05) {
      // Mata kecil: kecurigaan mulai tumbuh.
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', g.x, y - 22);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  const y = HUD_HEIGHT + p.y;
  const r = p.stance === 'crouch' ? 9 : 12;
  // Bayangan lantai.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, y + 9, r + 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jubah + tudung.
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.moveTo(p.x, y - r);
  ctx.lineTo(p.x - r, y + r);
  ctx.lineTo(p.x + r, y + r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, y - 2, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#062a28';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.dir) * 4, y - 2 + Math.sin(p.dir) * 4, 3, 0, Math.PI * 2);
  ctx.fill();
  // Cincin merah berdenyut saat sedang terlihat satpam.
  if (game.playerSeen) {
    ctx.strokeStyle = `rgba(255, 82, 82, ${0.6 + Math.sin(game.time * 8) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TERLIHAT!', p.x, y - r - 14);
  }
  // Semak menutupi pemain yang bersembunyi di dalamnya.
  const { tx, ty } = { tx: Math.floor(p.x / 32), ty: Math.floor(p.y / 32) };
  if (game.level.grid[ty] && game.level.grid[ty][tx] === 'B') {
    ctx.fillStyle = 'rgba(47, 107, 58, 0.75)';
    ctx.beginPath();
    ctx.arc(p.x - 6, y + 4, 9, 0, Math.PI * 2);
    ctx.arc(p.x + 7, y + 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDarkness(ctx, game) {
  const dark = getDarkCanvas();
  const dctx = dark.getContext('2d');
  dctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  dctx.globalCompositeOperation = 'source-over';
  dctx.fillStyle = 'rgba(6, 8, 16, 0.52)';
  dctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => {
    const g = dctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(x, y, r, 0, Math.PI * 2);
    dctx.fill();
  };
  hole(game.player.x, HUD_HEIGHT + game.player.y, 190, 0.95);
  hole(game.level.exit.x, HUD_HEIGHT + game.level.exit.y, 130, 0.9);
  for (const lamp of game.level.lamps) hole(lamp.x, HUD_HEIGHT + lamp.y, 110, 0.75);
  ctx.drawImage(dark, 0, 0);
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, HUD_HEIGHT - 1, VIEW_WIDTH, 1);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${game.levelIndex + 1} — ${game.level.name}`, 12, HUD_HEIGHT / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(`◆ ${game.player.loot}/${game.level.totalLoot} artefak`, VIEW_WIDTH / 2 - 90, HUD_HEIGHT / 2);
  ctx.fillStyle = COLORS.hudText;
  const mins = Math.floor(game.elapsed / 60);
  const secs = Math.floor(game.elapsed % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, VIEW_WIDTH / 2 + 60, HUD_HEIGHT / 2);
  // Indikator deteksi: mata + bar kecurigaan tertinggi (warna ikut status).
  const cx = VIEW_WIDTH - 150;
  ctx.textAlign = 'left';
  ctx.fillStyle = game.maxSuspicion > 0.85 ? '#ff5252' : game.maxSuspicion > 0.4 ? '#ff9a3d' : '#e8e4d8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('◉', cx, HUD_HEIGHT / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, cx + 26, HUD_HEIGHT / 2 - 7, 96, 14, 7);
  ctx.fill();
  ctx.fillStyle = game.maxSuspicion > 0.85 ? '#ff5252' : game.maxSuspicion > 0.4 ? '#ff9a3d' : '#39d98a';
  if (game.maxSuspicion > 0.01) {
    roundRect(ctx, cx + 26, HUD_HEIGHT / 2 - 7, 96 * game.maxSuspicion, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(game.player.stance === 'run' ? 'LARI' : game.player.stance === 'crouch' ? 'MERANGKAK' : 'JALAN', VIEW_WIDTH - 12, HUD_HEIGHT / 2);
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(6, 8, 16, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function button(ctx, game, id, x, y, w, h, label) {
  const hover = game.input.mouseX >= x && game.input.mouseX <= x + w && game.input.mouseY >= y && game.input.mouseY <= y + h;
  ctx.fillStyle = hover ? '#2dd4a8' : '#39d98a';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#06281c';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  game.uiButtons.push({ id, x, y, w, h });
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_WIDTH / 2, y);
}

function drawTitle(ctx, game) {
  overlay(ctx, 0.72);
  centerText(ctx, 'MUSEUM MALAM', 150, 'bold 64px system-ui, sans-serif', '#ffd94d');
  centerText(ctx, '— Pencuri Bayangan —', 200, 'italic 22px system-ui, sans-serif', '#e8e4d8');
  centerText(ctx, 'Museum tutup. Lampu padam. Satpam berjaga. Curi artefaknya,', 260, '18px system-ui, sans-serif', '#c9cdd8');
  centerText(ctx, 'capai pintu keluar — tanpa ketahuan.', 288, '18px system-ui, sans-serif', '#c9cdd8');
  centerText(ctx, 'WASD / Panah: bergerak      Shift: lari (berisik!)      C: merangkak (sulit terlihat)', 350, '16px system-ui, sans-serif', '#9aa3b5');
  centerText(ctx, 'Semak menyembunyikanmu. Bayangan memperlambat deteksi. Peti menutup pandangan.', 378, '16px system-ui, sans-serif', '#9aa3b5');
  centerText(ctx, 'Bila alarm berbunyi, lari dan sembunyilah sampai satpam kembali berpatroli.', 406, '16px system-ui, sans-serif', '#9aa3b5');
  button(ctx, game, 'start', VIEW_WIDTH / 2 - 130, 450, 260, 56, '▶  MULAI MENCURI');
  centerText(ctx, 'atau tekan Enter', 530, '14px system-ui, sans-serif', '#7c8496');
}

function drawClear(ctx, game) {
  overlay(ctx, 0.6);
  centerText(ctx, `${game.level.name.toUpperCase()} DIBOBOL!`, 220, 'bold 44px system-ui, sans-serif', '#39d98a');
  centerText(ctx, `Artefak ${game.player.loot}/${game.level.totalLoot}   •   Waktu ${formatTime(game.elapsed)}`, 290, '19px system-ui, sans-serif', '#e8e4d8');
  button(ctx, game, 'next', VIEW_WIDTH / 2 - 170, 340, 340, 56, 'LANJUT KE LEVEL BERIKUTNYA');
  centerText(ctx, 'atau tekan Enter', 420, '14px system-ui, sans-serif', '#7c8496');
}

function drawWin(ctx, game) {
  overlay(ctx, 0.72);
  centerText(ctx, 'SEMUA HARTA BERHASIL DICURI!', 210, 'bold 40px system-ui, sans-serif', '#ffd94d');
  centerText(ctx, 'Raka menghilang ke dalam malam sebelum fajar menyingsing.', 270, '19px system-ui, sans-serif', '#e8e4d8');
  centerText(ctx, `Total artefak ${game.totalLoot}/${game.totalLootMax}   •   Total waktu ${formatTime(game.elapsedTotal)}`, 320, '19px system-ui, sans-serif', '#e8e4d8');
  button(ctx, game, 'again', VIEW_WIDTH / 2 - 130, 370, 260, 56, 'MAIN LAGI');
  centerText(ctx, 'atau tekan R', 450, '14px system-ui, sans-serif', '#7c8496');
}

function drawCaught(ctx, game) {
  overlay(ctx, 0.66);
  centerText(ctx, 'KETANGKAP!', 220, 'bold 56px system-ui, sans-serif', '#ff5252');
  centerText(ctx, 'Satpam menangkap Raka di tengah galeri. Alarm masih meraung.', 290, '19px system-ui, sans-serif', '#e8e4d8');
  centerText(ctx, `${game.level.name}   •   Artefak ${game.player.loot}/${game.level.totalLoot}`, 330, '17px system-ui, sans-serif', '#c9cdd8');
  button(ctx, game, 'retry', VIEW_WIDTH / 2 - 130, 380, 260, 56, 'COBA LAGI');
  centerText(ctx, 'atau tekan R', 460, '14px system-ui, sans-serif', '#7c8496');
}

function formatTime(t) {
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  game.uiButtons = [];
  drawFloor(ctx, game.level);
  drawExit(ctx, game.level, game.time);
  drawLoot(ctx, game.level, game.time);
  drawCover(ctx, game.level);
  drawWalls(ctx, game.level);
  drawPatrolPaths(ctx, game.guards);
  drawDarkness(ctx, game);
  drawCones(ctx, game.level, game.guards);
  drawGuards(ctx, game.guards, game.time);
  drawPlayer(ctx, game);
  drawHud(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'clear') drawClear(ctx, game);
  else if (game.screen === 'win') drawWin(ctx, game);
  else if (game.screen === 'caught') drawCaught(ctx, game);
}
