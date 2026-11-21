# Museum Malam — Pencuri Bayangan

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/agungtriyonode/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/agungtriyonode/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Game stealth 2D top-down orisinal untuk bounty [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) di make.fun.

Museum tutup. Lampu padam. Satpam berjaga. Kamu Raka, pencuri bayangan:
curi artefaknya dan capai pintu keluar — tanpa ketahuan.

## Cara main

- **WASD / panah** — bergerak
- **Shift** — lari (cepat, tapi berisik dan mudah terlihat)
- **C** — merangkak (lambat, sulit terlihat)
- **Mouse** — klik tombol di layar judul / menang / kalah
- **Enter / R** — mulai, lanjut level, coba lagi

## Fitur

- 3 level dengan kesulitan naik (Galeri Lukisan, Aula Patung, Ruang Harta Karun)
- Satpam berpatroli dengan kerucut pandang yang terhalang dinding, peti, dan semak
- Sistem deteksi: curiga → kejar → cari → kembali patroli; pemain bisa pulih dari nyaris ketahuan
- Cover: peti menutup pandangan, semak menyembunyikan, lantai gelap memperlambat deteksi
- Artefak opsional, HUD (level, artefak, timer, meter deteksi), layar menang/kalah
- Suara sintetis WebAudio (langkah kaki, bip curiga, sirene alarm) — tanpa file audio

## Menjalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Tanpa build step, tanpa dependensi, tanpa network request: `game/` murni file
statis (vanilla JS + canvas). `main.ts` menyerahkan game + screenshot ke
make.fun (`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`).

## Lisensi

MIT — lihat [LICENSE](LICENSE).
