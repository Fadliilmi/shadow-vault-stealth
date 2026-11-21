// The courier: movement, sneaking, hiding and the relic.
// One job: where the player is, how fast they move, and what they carry.
import {
  COLS,
  PLAYER_RADIUS,
  PLAYER_SNEAK_SPEED,
  PLAYER_WALK_SPEED,
  ROWS,
  TILE,
  clamp,
} from './config.js';
import { inShadow, isSolid } from './level.js';

/** A fresh player standing at the level's start. */
export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    sneaking: false,
    moving: false,
    stepPhase: 0,
    hasRelic: false,
    hidden: false,
    moveTarget: null,
  };
}

/** True when a circle at (x, y) with the player's radius overlaps a solid tile. */
function hitsWall(level, x, y) {
  const left = Math.floor((x - PLAYER_RADIUS) / TILE);
  const right = Math.floor((x + PLAYER_RADIUS) / TILE);
  const top = Math.floor((y - PLAYER_RADIUS) / TILE);
  const bottom = Math.floor((y + PLAYER_RADIUS) / TILE);
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      if (isSolid(level, col, row)) {
        const nearestX = clamp(x, col * TILE, (col + 1) * TILE);
        const nearestY = clamp(y, row * TILE, (row + 1) * TILE);
        const dx = x - nearestX;
        const dy = y - nearestY;
        if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS) return true;
      }
    }
  }
  return false;
}

/** Slide along walls: try the x move, then the y move, keeping what fits. */
function tryMove(level, player, dx, dy) {
  if (dx !== 0 && !hitsWall(level, player.x + dx, player.y)) player.x += dx;
  if (dy !== 0 && !hitsWall(level, player.x, player.y + dy)) player.y += dy;
  player.x = clamp(player.x, PLAYER_RADIUS, COLS * TILE - PLAYER_RADIUS);
  player.y = clamp(player.y, PLAYER_RADIUS, ROWS * TILE - PLAYER_RADIUS);
}

/**
 * Move the player for `dt` seconds. `input` carries the held keys
 * (up/down/left/right/sneak) and an optional click-to-walk target.
 * Returns 'step' on every footstep, so the caller can play the sound.
 */
export function updatePlayer(level, player, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;

  if (dx === 0 && dy === 0 && player.moveTarget) {
    const tx = player.moveTarget.x - player.x;
    const ty = player.moveTarget.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 8) {
      player.moveTarget = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  }

  const length = Math.hypot(dx, dy);
  player.moving = length > 0;
  player.sneaking = !!input.sneak;
  if (player.moving) {
    const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    const nx = (dx / length) * speed * dt;
    const ny = (dy / length) * speed * dt;
    tryMove(level, player, nx, ny);
    player.facing = Math.atan2(dy, dx);
    // Footsteps: slow and soft while sneaking, brisk while walking.
    player.stepPhase += (speed / (player.sneaking ? 46 : 78)) * dt;
    if (player.stepPhase >= 1) {
      player.stepPhase -= 1;
      return 'step';
    }
  } else {
    player.stepPhase = 0;
  }
  player.hidden = player.sneaking && inShadow(level, player.x, player.y);
  return null;
}

/** Pick up the relic when the courier stands on it. Returns true on pickup. */
export function tryPickup(level, player) {
  if (level.relic.taken) return false;
  const dx = player.x - level.relic.x;
  const dy = player.y - level.relic.y;
  if (dx * dx + dy * dy < (PLAYER_RADIUS + 18) * (PLAYER_RADIUS + 18)) {
    level.relic.taken = true;
    player.hasRelic = true;
    level.exit.open = true;
    return true;
  }
  return false;
}

/** True when the courier, relic in hand, reaches the open exit door. */
export function atExit(level, player) {
  if (!level.exit.open) return false;
  const dx = player.x - level.exit.x;
  const dy = player.y - level.exit.y;
  return dx * dx + dy * dy < (PLAYER_RADIUS + 20) * (PLAYER_RADIUS + 20);
}
