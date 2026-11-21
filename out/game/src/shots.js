// The four staged screenshot scenes behind ?shot=cover|sneak|alarm|exit.
// One job: put the real game into a fixed, readable state for each shot.
// Every scene plays the live rules forward from its staged positions; the
// main loop freezes win/lose transitions while a shot is staged, so the
// frame Chrome captures is the scene, not the screen after it.
import { TILE } from './config.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';

function place(entity, col, row) {
  entity.x = (col + 0.5) * TILE;
  entity.y = (row + 0.5) * TILE;
}

function calmGuards(game) {
  for (const guard of game.guards) {
    guard.suspicion = 0;
    guard.state = 'patrol';
    guard.lastSeen = null;
    guard.unseenFor = 0;
  }
}

/**
 * Set `game` to the named scene and return the screen to draw.
 * Any other name is the cover scene.
 */
export function stageShot(name, game) {
  game.shotMode = true;
  game.lives = 3;
  game.caughtFlash = 0;
  calmGuards(game);
  game.player.hasRelic = false;
  game.level.relic.taken = false;
  game.level.exit.open = false;
  game.player.moveTarget = null;
  game.player.sneaking = false;

  if (name === 'sneak') {
    // The courier crouches behind the crate block while a guard's cone
    // sweeps past the crates, suspicion already half raised.
    game.elapsed = 38;
    place(game.player, 5, 3);
    game.player.sneaking = true;
    game.player.facing = Math.PI;
    const guard = game.guards[0];
    place(guard, 11, 2);
    guard.facing = Math.PI;
    guard.scanBase = Math.PI;
    guard.suspicion = 38;
    guard.state = GUARD_SUSPICIOUS;
    guard.lastSeen = { x: game.player.x, y: game.player.y };
    place(game.guards[1], 20, 12);
    game.guards[1].facing = Math.PI / 2;
    game.guards[1].scanBase = Math.PI / 2;
    return 'play';
  }

  if (name === 'alarm') {
    // Near miss: the relic is taken, the exit is open, and a guard is in
    // full chase a few steps behind the running courier.
    game.elapsed = 61;
    game.player.hasRelic = true;
    game.level.relic.taken = true;
    game.level.exit.open = true;
    place(game.player, 22, 15);
    game.player.facing = 0;
    game.player.moveTarget = { x: (28 + 0.5) * TILE, y: (18 + 0.5) * TILE };
    const guard = game.guards[1];
    place(guard, 19, 13);
    guard.facing = Math.atan2(game.player.y - guard.y, game.player.x - guard.x);
    guard.suspicion = 100;
    guard.state = GUARD_CHASE;
    guard.lastSeen = { x: game.player.x, y: game.player.y };
    place(game.guards[0], 15, 2);
    game.guards[0].facing = 0;
    return 'play';
  }

  if (name === 'exit') {
    // Level complete: the courier stands in the open green exit doorway.
    game.elapsed = 74;
    game.player.hasRelic = true;
    game.level.relic.taken = true;
    game.level.exit.open = true;
    place(game.player, 28, 18);
    game.player.facing = -Math.PI / 2;
    place(game.guards[0], 15, 2);
    game.guards[0].facing = 0;
    place(game.guards[1], 20, 12);
    game.guards[1].facing = Math.PI / 2;
    game.guards[1].scanBase = Math.PI / 2;
    return 'levelclear';
  }

  // Cover: the whole first vault at a glance — cones, cover, relic, exit.
  game.elapsed = 12;
  place(game.player, 3, 3);
  game.player.facing = 0;
  place(game.guards[0], 15, 2);
  game.guards[0].facing = 0;
  place(game.guards[1], 20, 12);
  game.guards[1].facing = Math.PI / 2;
  game.guards[1].scanBase = Math.PI / 2;
  return 'play';
}
