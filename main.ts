// Shadow Vault: The Silent Courier — the entry program (Node 22, stdlib only).
//
// What it does: the playable game lives in this directory's game/ folder as
// plain static files (game/index.html plus its ES modules, no library, no
// network request at all), and the four screenshots live in screenshots/.
// This program hands both in: it copies game/ and screenshots/ from beside
// this file into /output and writes /output/dossier.json, the summary the
// judge reads, using the vendored make.fun library in vendor/makefun-game.ts.
//
// Run it locally to check the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output.
// Serve the game itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The same caps the scorer enforces: at most 4 screenshots, none over
// 256 KiB; at most 993 files and 48 MiB under game/, no game/ path over
// 1000 bytes; the dossier text capped at 160 KiB. Only text_max_bytes
// changes the bytes written; the rest refuse an entry the scorer would
// refuse, so a local run that passes here is one the gate will accept.
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
