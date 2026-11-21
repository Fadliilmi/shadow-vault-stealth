// The three vaults: their floor plans, patrol routes and objectives.
// One job: turn a text map into the walls, crates, shadows, relic, exit and
// guard waypoints a level plays with. Legend: '#' wall, 'C' crate (blocks
// sight and movement), 's' shadow (hide here while sneaking), 'R' relic,
// 'E' exit door, 'P' the courier's start. Guard patrols are tile waypoints.
import { COLS, ROWS, TILE } from './config.js';

const MAPS = [
  {
    name: 'Level 1 — The Quiet Vault',
    hint: 'Learn the patrols. Crates block sight; shadows hide you while you sneak.',
    rows: ['################################',
      '#P......#.........s............#',
      '#.......#......................#',
      '#..CC...#....CC........CC......#',
      '#..CC...#....CC................#',
      '#.......#......................#',
      '#............s.................#',
      '###.#####....##########.########',
      '#.......#......................#',
      '#..s....#....CC......CC........#',
      '#.......#....CC......CC....R...#',
      '#.......#......................#',
      '#..CC...#....s.................#',
      '#..CC...#......................#',
      '#.................CC...........#',
      '###.#####....#######.###########',
      '#.......#......................#',
      '#..s....#....CC........CC......#',
      '#.......#....CC.........CC..E..#',
      '################################'],
    guards: [
      { waypoints: [[10, 2], [20, 2], [20, 5], [10, 5]], pause: 1.2 },
      { waypoints: [[24, 9], [24, 16], [16, 16], [16, 9]], pause: 1.0 },
    ],
  },
  {
    name: 'Level 2 — The Lantern Gallery',
    hint: 'Three guards now. Wait for a cone to sweep past, then cross.',
    rows: ['################################',
      '#P...s......#..........CC......#',
      '#......................CC......#',
      '#..CC.......#....s.............#',
      '#..CC...#####.#####......R.....#',
      '#...........#.....#............#',
      '#....s......#..CC.#....CC......#',
      '#####.#######.....#....CC......#',
      '#...........#.....#............#',
      '#..CC..........s..#............#',
      '#..CC....s..#.....#####.########',
      '#...........#..................#',
      '#....CC.....#....CC.......s....#',
      '#....CC.....#....CC............#',
      '#...........#..........CC......#',
      '###.#########....#######.#######',
      '#......s...........#...........#',
      '#..CC...................CC.....#',
      '#..CC......CC......#....CC..E..#',
      '################################'],
    guards: [
      { waypoints: [[5, 1], [10, 1], [10, 3], [5, 3]], pause: 0.8 },
      { waypoints: [[20, 2], [28, 2], [28, 7], [20, 7]], pause: 1.4 },
      { waypoints: [[4, 11], [14, 11], [14, 17], [6, 17]], pause: 1.0 },
    ],
  },
  {
    name: 'Level 3 — The Inner Sanctum',
    hint: 'Four guards, tight corridors. Patience is the only way through.',
    rows: ['################################',
      '#P......#......s......#........#',
      '#..CC...#............#...CC....#',
      '#..CC...#....CC......#...CC..R.#',
      '#.......#....CC......#.........#',
      '###.####......#######.###.######',
      '#..............................#',
      '#..s....#....CC......CC....s...#',
      '#.......#....CC......CC........#',
      '#..CC...#......................#',
      '#..CC...#####.#####.....CC.....#',
      '#.......#........#.....CC......#',
      '#...s...#...CC...#.............#',
      '#.......#...CC...#....s........#',
      '####.####........#.............#',
      '#.......#....CC..#....CC.......#',
      '#..CC...#....CC.......CC.......#',
      '#..CC...#........#.............#',
      '#..s....#....s...#......E......#',
      '################################'],
    guards: [
      { waypoints: [[4, 1], [11, 1], [11, 4], [4, 4]], pause: 0.9 },
      { waypoints: [[17, 1], [26, 1], [26, 4], [17, 4]], pause: 1.1 },
      { waypoints: [[5, 7], [11, 7], [11, 12], [5, 12]], pause: 0.8 },
      { waypoints: [[19, 8], [27, 8], [27, 17], [19, 17]], pause: 1.2 },
    ],
  },
];

/** Parse one text map into the pieces the game plays with. */
export function buildLevel(index) {
  const def = MAPS[index % MAPS.length];
  const walls = new Set();
  const crates = new Set();
  const shadows = new Set();
  let playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
  let relic = { x: 0, y: 0, taken: false };
  let exit = { x: 0, y: 0, open: false };
  for (let row = 0; row < ROWS; row += 1) {
    const line = def.rows[row];
    if (line.length !== COLS) throw new Error(`level ${index} row ${row} is ${line.length} wide, expected ${COLS}`);
    for (let col = 0; col < COLS; col += 1) {
      const key = `${col},${row}`;
      const cell = line[col];
      if (cell === '#') walls.add(key);
      else if (cell === 'C') crates.add(key);
      else if (cell === 's') shadows.add(key);
      else if (cell === 'P') playerStart = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
      else if (cell === 'R') relic = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE, taken: false };
      else if (cell === 'E') exit = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE, open: false };
    }
  }
  const guards = def.guards.map((g) => ({
    waypoints: g.waypoints.map(([col, row]) => ({ x: (col + 0.5) * TILE, y: (row + 0.5) * TILE })),
    pause: g.pause,
  }));
  return {
    index,
    name: def.name,
    hint: def.hint,
    walls,
    crates,
    shadows,
    playerStart,
    relic,
    exit,
    guards,
  };
}

export const LEVEL_COUNT = MAPS.length;

/** True when the tile at (col, row) blocks movement. */
export function isSolid(level, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  const key = `${col},${row}`;
  return level.walls.has(key) || level.crates.has(key);
}

/** True when the tile at (col, row) blocks a guard's line of sight. */
export function blocksSight(level, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  const key = `${col},${row}`;
  return level.walls.has(key) || level.crates.has(key);
}

/** True when the point (x, y) sits inside a shadow patch. */
export function inShadow(level, x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return level.shadows.has(`${col},${row}`);
}
