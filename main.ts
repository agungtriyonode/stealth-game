// Museum Malam — Pencuri Bayangan. Program penyerah (Node 22, pustaka standar
// saja): game-nya adalah folder game/ di sebelah file ini — file statis yang
// dimuat browser desktop tanpa jaringan (game/index.html + modul ES, tanpa
// library) — dan program ini menyerahkannya. Ia menyalin game/ dan screenshots/
// dari repo ke /output lalu menulis /output/dossier.json, ringkasan yang dibaca
// juri, memakai library make.fun yang divendor.
//
// Di luar kontainer grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Batas-batas scorer (reference/gate.json): hanya text_max_bytes yang membentuk
// byte dossier; sisanya menolak entri yang scorer akan tolak (lebih dari 4
// screenshot atau satu di atas 256 KiB; lebih dari 993 file di game/ atau
// 48 MiB total, atau path di bawah game/ di atas 1000 byte: game/ dihitung
// bersama batas 1000 entri /output, screenshot dan dossier.json-nya).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
