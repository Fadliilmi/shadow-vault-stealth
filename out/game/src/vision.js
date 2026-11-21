// Line of sight and vision cones.
// One job: decide what a guard can see, and draw the cone the player sees.
import { CONE_HALF_ANGLE, CONE_RANGE, CONE_RAYS, TILE, angleDifference } from './config.js';
import { blocksSight } from './level.js';

/** True when the straight line from (ax, ay) to (bx, by) crosses no wall or crate. */
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(length / (TILE / 4)));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const col = Math.floor((ax + dx * t) / TILE);
    const row = Math.floor((ay + dy * t) / TILE);
    if (blocksSight(level, col, row)) return false;
  }
  return true;
}

/**
 * True when the guard's cone covers the point (x, y) and nothing blocks the view.
 * `hidden` is true while the player sneaks inside a shadow patch: then the
 * guard cannot see them at all, however close the cone sweeps.
 */
export function canSee(level, guard, x, y, hidden) {
  if (hidden) return false;
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  const angleTo = Math.atan2(dy, dx);
  if (angleDifference(angleTo, guard.facing) > CONE_HALF_ANGLE) return false;
  return hasLineOfSight(level, guard.x, guard.y, x, y);
}

/**
 * The cone as a polygon: cast CONE_RAYS rays across the arc and stop each
 * one at the first wall or crate (or at full range), so the cone hugs the
 * walls instead of shining through them.
 */
export function conePolygon(level, guard) {
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const angle = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / CONE_RAYS;
    const stepX = Math.cos(angle) * (TILE / 4);
    const stepY = Math.sin(angle) * (TILE / 4);
    let x = guard.x;
    let y = guard.y;
    let travelled = 0;
    while (travelled < CONE_RANGE) {
      x += stepX;
      y += stepY;
      travelled += TILE / 4;
      const col = Math.floor(x / TILE);
      const row = Math.floor(y / TILE);
      if (blocksSight(level, col, row)) break;
    }
    points.push({ x, y });
  }
  return points;
}
