// Guard behaviour: patrol, suspicion, investigation and chase.
// One job: move each guard and track how close it is to spotting the courier.
import {
  GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED,
  GUARD_PATROL_SPEED,
  LOSE_SIGHT_SECONDS,
  SUSPICION_ALERT_AT,
  SUSPICION_DECAY,
  SUSPICION_RISE_BASE,
  SUSPICION_SUSPICIOUS_AT,
  clamp,
  distance,
} from './config.js';
import { canSee } from './vision.js';
import { inShadow } from './level.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';

/** A fresh guard standing on the first waypoint of its patrol route. */
export function makeGuard(route, index) {
  const start = route.waypoints[0];
  return {
    index,
    x: start.x,
    y: start.y,
    facing: 0,
    waypoint: 1 % route.waypoints.length,
    pauseLeft: 0,
    scanBase: 0,
    route,
    state: GUARD_PATROL,
    suspicion: 0,
    lastSeen: null,
    unseenFor: 0,
    searchLeft: 0,
    stepPhase: index * 0.7,
    stepped: false,
  };
}

/** Walk toward (tx, ty) at `speed`, facing the way we move. Returns true on arrival. */
function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const move = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * move;
  guard.y += (dy / dist) * move;
  guard.facing = Math.atan2(dy, dx);
  return dist - move < 2;
}

/** Patrol: follow the waypoints, pausing at each one to scan the room. */
function updatePatrol(guard, dt) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    // Scan: slowly sweep the cone back and forth around where we stopped.
    guard.facing = guard.scanBase + Math.sin(performance.now() / 1100 + guard.index * 2.1) * 0.7;
    return;
  }
  const target = guard.route.waypoints[guard.waypoint];
  if (walkToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.waypoints.length;
    guard.pauseLeft = guard.route.pause;
    guard.scanBase = guard.facing;
  }
}

/** Update one guard for `dt` seconds against the player's current position. */
export function updateGuard(level, guard, player, dt, onFootstep) {
  const hidden = player.sneaking && inShadow(level, player.x, player.y);
  const seen = canSee(level, guard, player.x, player.y, hidden);

  if (seen) {
    const dist = distance(guard.x, guard.y, player.x, player.y);
    const closeness = 1 - dist / 260;
    const rate = SUSPICION_RISE_BASE * (0.35 + closeness) * (player.sneaking ? 0.45 : 1);
    guard.suspicion = clamp(guard.suspicion + rate * dt, 0, SUSPICION_ALERT_AT);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.unseenFor = 0;
  } else {
    guard.suspicion = clamp(guard.suspicion - SUSPICION_DECAY * dt, 0, SUSPICION_ALERT_AT);
    guard.unseenFor += dt;
  }

  if (guard.suspicion >= SUSPICION_ALERT_AT) {
    guard.state = GUARD_CHASE;
  } else if (guard.suspicion >= SUSPICION_SUSPICIOUS_AT && guard.state === GUARD_PATROL) {
    guard.state = GUARD_SUSPICIOUS;
  } else if (guard.state !== GUARD_PATROL && guard.suspicion < SUSPICION_SUSPICIOUS_AT / 2) {
    guard.state = GUARD_PATROL;
    guard.searchLeft = 0;
  }

  if (guard.state === GUARD_CHASE) {
    if (seen) {
      walkToward(guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
    } else if (guard.unseenFor > LOSE_SIGHT_SECONDS) {
      // Lost the trail: give up the chase and go back to the patrol route.
      guard.state = GUARD_PATROL;
      guard.suspicion = SUSPICION_SUSPICIOUS_AT / 2;
      guard.unseenFor = 0;
    } else if (guard.lastSeen) {
      walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_CHASE_SPEED, dt);
    }
  } else if (guard.state === GUARD_SUSPICIOUS) {
    if (guard.lastSeen) {
      const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_INVESTIGATE_SPEED, dt);
      if (arrived) {
        if (guard.searchLeft <= 0) guard.searchLeft = 2.2;
        guard.searchLeft -= dt;
        guard.facing += dt * 1.6;
        if (guard.searchLeft <= 0) {
          guard.state = GUARD_PATROL;
          guard.suspicion = SUSPICION_SUSPICIOUS_AT / 2;
        }
      }
    }
  } else {
    updatePatrol(guard, dt);
  }

  // Footstep sound, paced by how fast this guard is moving.
  const moving = guard.state === GUARD_CHASE ? GUARD_CHASE_SPEED : guard.state === GUARD_SUSPICIOUS ? GUARD_INVESTIGATE_SPEED : GUARD_PATROL_SPEED;
  guard.stepPhase += (moving / 62) * dt;
  if (guard.stepPhase >= 1) {
    guard.stepPhase -= 1;
    if (onFootstep) onFootstep(guard);
  }
}

/** The highest suspicion of any guard: the number the HUD's alarm bar shows. */
export function highestSuspicion(guards) {
  let top = 0;
  for (const guard of guards) top = Math.max(top, guard.suspicion);
  return top;
}
