// Tiga level Museum Malam. Peta ditulis sebagai 20 baris x 30 kolom:
// '#' dinding, '.' lantai, 'D' lantai gelap (bayangan, deteksi lebih lambat),
// 'C' peti (menutup jalan + pandangan), 'B' semak (jalan bisa, pandangan tertutup),
// 'P' awal Raka, 'E' pintu keluar, 'L' artefak. Satpam didefinisikan terpisah
// dengan titik patroli (koordinat tile) supaya jalurnya mudah dibaca.
import { COLS, ROWS, TILE } from './config.js';
import { allReachable, isSolid, tileCenter } from './grid.js';

export const LEVELS = [
  {
    name: 'Galeri Lukisan',
    hint: 'Dua satpam berjaga. Merangkaklah di balik peti, manfaatkan semak dan bayangan.',
    map: [
      '##############################',
      '#P....C......#.....L....#....#',
      '#............#..........#....#',
      '#..B....D....#....B.....#....#',
      '#............#..........#....#',
      '#....C.......#....C.....#..L.#',
      '#............#..........#....#',
      '#..D....B....#....D.....#....#',
      '#............#..........#....#',
      '#######..#####.#####..###..###',
      '#............................#',
      '#..L....C......B......C......#',
      '#............................#',
      '#....D.....C......D.....B....#',
      '#............................#',
      '#.C......B......C......L.....#',
      '#............................#',
      '#....B......D......C.....E...#',
      '#............................#',
      '##############################',
    ],
    guards: [
      { spawn: [4, 4], path: [[4, 4], [10, 4]], pause: 1.2 },
      { spawn: [6, 16], path: [[6, 16], [23, 16]], pause: 1.0 },
    ],
    lamps: [[8, 4], [20, 4], [8, 15], [20, 15]],
  },
  {
    name: 'Aula Patung',
    hint: 'Tiga satpam, lorong makin sempit. Lari itu berisik — dengarkan langkahmu.',
    map: [
      '##############################',
      '#P...#......B....#....L......#',
      '#....#...........#...........#',
      '#..C.#....D......#.....C.....#',
      '#....#...........#...........#',
      '#....#..L........#..B....D...#',
      '#....#...........#...........#',
      '#..D..........C...#....L.....#',
      '#....#...........#...........#',
      '##.#####.#########.####.###.##',
      '#............................#',
      '#..B....C.....D......B.......#',
      '#......#....C.....#....C.....#',
      '#..L...#.........#...L.......#',
      '#......#....B....#....D......#',
      '#..C...#.........#.....C.....#',
      '#......#....D....#...........#',
      '#..D...#....C....#..B....E...#',
      '#............................#',
      '##############################',
    ],
    guards: [
      { spawn: [2, 5], path: [[2, 5], [4, 5]], pause: 1.0 },
      { spawn: [8, 3], path: [[8, 3], [15, 3]], pause: 0.8 },
      { spawn: [4, 18], path: [[4, 18], [25, 18]], pause: 0.9 },
    ],
    lamps: [[3, 2], [15, 5], [10, 13], [24, 16]],
  },
  {
    name: 'Ruang Harta Karun',
    hint: 'Empat satpam menjaga harta. Satu langkah salah dan alarm berbunyi.',
    map: [
      '##############################',
      '#P..#....B...#......L...#...L#',
      '#...#........#..........#....#',
      '#..D#...C....#....D....#..C..#',
      '#...#........#..........#....#',
      '#..C#..L.....#..B.......#....#',
      '#...#........#..........#....#',
      '#..B#....D...#....C.....#..D.#',
      '#...#........#..........#....#',
      '##.####.######.#####.####.####',
      '#............................#',
      '#.C...B.....C....D.....B....L#',
      '#....#...D......#...C........#',
      '#..L.#.........D#.....B......#',
      '#....#...C......#...D........#',
      '#.D..#.....B....#.....C......#',
      '#....#...D......#...L........#',
      '#..B.#.....C....#.....D..E...#',
      '#............................#',
      '##############################',
    ],
    guards: [
      { spawn: [6, 2], path: [[6, 2], [11, 2]], pause: 0.9 },
      { spawn: [15, 6], path: [[15, 6], [22, 6]], pause: 0.8 },
      { spawn: [4, 10], path: [[4, 10], [25, 10]], pause: 0.7 },
      { spawn: [24, 12], path: [[24, 12], [24, 17]], pause: 0.8 },
    ],
    lamps: [[8, 2], [18, 6], [8, 15], [22, 14]],
  },
];

// Ubah definisi mentah jadi dunia siap main: grid, posisi awal, exit, artefak,
// satpam (posisi piksel) dan lampu. Sekalian memvalidasi peta supaya level yang
// mustahil (exit tak terjangkau, patroli menabrak dinding) ketahuan sejak awal.
export function parseLevel(def) {
  if (def.map.length !== ROWS) throw new Error(`level ${def.name}: butuh ${ROWS} baris`);
  const grid = def.map.map((row, y) => {
    if (row.length !== COLS) throw new Error(`level ${def.name} baris ${y}: panjang ${row.length}, harus ${COLS}`);
    return row.split('');
  });
  let playerStart = null;
  let exit = null;
  const loot = [];
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const ch = grid[ty][tx];
      if (ch === 'P') playerStart = tileCenter(tx, ty);
      if (ch === 'E') exit = { ...tileCenter(tx, ty), tx, ty };
      if (ch === 'L') loot.push({ ...tileCenter(tx, ty), tx, ty, taken: false });
    }
  }
  if (!playerStart) throw new Error(`level ${def.name}: tidak ada P`);
  if (!exit) throw new Error(`level ${def.name}: tidak ada E`);
  const targets = [{ tx: exit.tx, ty: exit.ty }, ...loot.map((l) => ({ tx: l.tx, ty: l.ty }))];
  const startTile = { tx: Math.floor(playerStart.x / TILE), ty: Math.floor(playerStart.y / TILE) };
  if (!allReachable(grid, startTile, targets)) {
    throw new Error(`level ${def.name}: exit/artefak tidak semua terjangkau`);
  }
  const guards = def.guards.map((g) => {
    const path = g.path.map(([tx, ty]) => {
      if (isSolid(grid, tx, ty)) throw new Error(`level ${def.name}: patroli menabrak dinding di ${tx},${ty}`);
      return tileCenter(tx, ty);
    });
    return { spawn: tileCenter(g.spawn[0], g.spawn[1]), path, pause: g.pause };
  });
  return {
    name: def.name,
    hint: def.hint,
    grid,
    playerStart,
    exit,
    loot,
    guards,
    lamps: def.lamps.map(([tx, ty]) => tileCenter(tx, ty)),
    totalLoot: loot.length,
  };
}
