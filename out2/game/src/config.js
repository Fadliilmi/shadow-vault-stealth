// Shared numbers and colours for Shadow Vault: The Silent Courier.
// One job: the constants every other module reads, so tuning stays in one place.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;
export const HUD_HEIGHT = 46;
export const VIEW_WIDTH = COLS * TILE;
export const VIEW_HEIGHT = HUD_HEIGHT + ROWS * TILE;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 92;
export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_INVESTIGATE_SPEED = 96;

export const CONE_RANGE = 235;
export const CONE_HALF_ANGLE = Math.PI / 5.2;
export const CONE_RAYS = 26;

export const SUSPICION_RISE_BASE = 58;
export const SUSPICION_DECAY = 16;
export const SUSPICION_SUSPICIOUS_AT = 60;
export const SUSPICION_ALERT_AT = 100;
export const CATCH_DISTANCE = 26;
export const LOSE_SIGHT_SECONDS = 4;

export const START_LIVES = 3;

export const COLORS = {
  floorLight: '#3a3f4a',
  floorDark: '#343945',
  floorTrim: '#2c303a',
  wall: '#1d212b',
  wallTop: '#4a5160',
  crate: '#7a5a33',
  crateEdge: '#543d20',
  shadow: '#1e3a2a',
  shadowEdge: '#2c5a40',
  exit: '#39d98a',
  exitGlow: '#1d7a4c',
  relic: '#ffd34d',
  player: '#e8ecf4',
  playerCloak: '#4d7dd1',
  guard: '#c94f4f',
  guardDark: '#8e2f2f',
  coneCalm: 'rgba(255, 214, 90, 0.30)',
  coneWary: 'rgba(255, 150, 60, 0.38)',
  coneAlert: 'rgba(255, 60, 60, 0.42)',
  hudBack: 'rgba(12, 14, 20, 0.82)',
  hudText: '#e8ecf4',
  hudDim: '#9aa3b2',
  danger: '#ff5a5a',
  safe: '#39d98a',
};

/** Clamp a number into [lo, hi]. */
export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

/** Distance between two points. */
export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Smallest absolute angle between two headings, in radians. */
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
