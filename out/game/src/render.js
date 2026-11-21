// Everything the eye sees: the vault floor, the cones, the guards, the courier.
// One job: draw the current game state onto the canvas.
import {
  COLORS,
  COLS,
  GUARD_RADIUS,
  HUD_HEIGHT,
  PLAYER_RADIUS,
  ROWS,
  SUSPICION_ALERT_AT,
  SUSPICION_SUSPICIOUS_AT,
  TILE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { conePolygon } from './vision.js';
import { drawHiddenTag, drawHints, drawHud } from './hud.js';

/** Checkerboard floor with a darker trim around the room. */
function drawFloor(ctx, level) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
      ctx.fillRect(col * TILE, row * TILE + HUD_HEIGHT, TILE, TILE);
    }
  }
  ctx.strokeStyle = COLORS.floorTrim;
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col += 1) {
    ctx.beginPath();
    ctx.moveTo(col * TILE, HUD_HEIGHT);
    ctx.lineTo(col * TILE, VIEW_HEIGHT);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, row * TILE + HUD_HEIGHT);
    ctx.lineTo(VIEW_WIDTH, row * TILE + HUD_HEIGHT);
    ctx.stroke();
  }
}

function drawWalls(ctx, level) {
  for (const key of level.walls) {
    const [col, row] = key.split(',').map(Number);
    const x = col * TILE;
    const y = row * TILE + HUD_HEIGHT;
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x, y, TILE, 5);
  }
}

function drawShadows(ctx, level) {
  for (const key of level.shadows) {
    const [col, row] = key.split(',').map(Number);
    const x = col * TILE;
    const y = row * TILE + HUD_HEIGHT;
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = COLORS.shadowEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    // A little shrub: three dark leaves so the patch reads as cover.
    ctx.fillStyle = '#2c5a40';
    for (const [ox, oy] of [[10, 12], [22, 10], [16, 24], [28, 24]]) {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCrates(ctx, level) {
  for (const key of level.crates) {
    const [col, row] = key.split(',').map(Number);
    const x = col * TILE;
    const y = row * TILE + HUD_HEIGHT;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = COLORS.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + TILE - 2, y + TILE - 2);
    ctx.moveTo(x + TILE - 2, y + 2);
    ctx.lineTo(x + 2, y + TILE - 2);
    ctx.stroke();
  }
}

/** The exit door: dark until the relic is taken, then glowing green. */
function drawExit(ctx, level) {
  const x = level.exit.x;
  const y = level.exit.y + HUD_HEIGHT;
  ctx.save();
  if (level.exit.open) {
    const pulse = 0.5 + 0.3 * Math.sin(performance.now() / 280);
    ctx.fillStyle = `rgba(57, 217, 138, ${0.25 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = level.exit.open ? COLORS.exit : '#3f6b52';
  ctx.fillRect(x - 18, y - 18, 36, 36);
  ctx.strokeStyle = level.exit.open ? '#b8ffdd' : '#24402f';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 18, y - 18, 36, 36);
  ctx.fillStyle = '#0c0e14';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, y);
  ctx.restore();
}

/** The golden relic, bobbing gently until the courier takes it. */
function drawRelic(ctx, level) {
  if (level.relic.taken) return;
  const x = level.relic.x;
  const y = level.relic.y + HUD_HEIGHT + Math.sin(performance.now() / 400) * 3;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 211, 77, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.relic;
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 13);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x, y + 7);
  ctx.lineTo(x - 5, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function coneColor(guard) {
  if (guard.suspicion >= SUSPICION_ALERT_AT) return COLORS.coneAlert;
  if (guard.suspicion >= SUSPICION_SUSPICIOUS_AT) return COLORS.coneWary;
  return COLORS.coneCalm;
}

/** A guard: vision cone first, then the body, then a ? or ! over its head. */
function drawGuard(ctx, level, guard) {
  const x = guard.x;
  const y = guard.y + HUD_HEIGHT;
  const polygon = conePolygon(level, guard);
  ctx.save();
  ctx.fillStyle = coneColor(guard);
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y + HUD_HEIGHT);
  for (let i = 1; i < polygon.length; i += 1) ctx.lineTo(polygon[i].x, polygon[i].y + HUD_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  // Shadow under the boots.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a red-uniformed guard with a dark cap, facing its patrol direction.
  ctx.translate(x, y);
  ctx.rotate(guard.facing);
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(0, 0, GUARD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(4, 0, 8, -Math.PI / 2.4, Math.PI / 2.4);
  ctx.fill();
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath();
  ctx.arc(9, -5, 2.2, 0, Math.PI * 2);
  ctx.arc(9, 5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Suspicion: a ? while wary, a ! while chasing, with a small meter.
  if (guard.suspicion > 8) {
    ctx.save();
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.suspicion >= SUSPICION_ALERT_AT ? COLORS.danger : '#ffb03c';
    const mark = guard.suspicion >= SUSPICION_ALERT_AT ? '!' : '?';
    ctx.fillText(mark, x, y - GUARD_RADIUS - 10);
    ctx.fillStyle = '#22262f';
    ctx.fillRect(x - 16, y - GUARD_RADIUS - 6, 32, 4);
    ctx.fillStyle = guard.suspicion >= SUSPICION_ALERT_AT ? COLORS.danger : '#ffb03c';
    ctx.fillRect(x - 16, y - GUARD_RADIUS - 6, 32 * (guard.suspicion / SUSPICION_ALERT_AT), 4);
    ctx.restore();
  }
}

/** The courier: a blue cloak, pale hood, and a soft shadow. */
function drawPlayer(ctx, player) {
  const x = player.x;
  const y = player.y + HUD_HEIGHT;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y);
  ctx.rotate(player.facing);
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(5, 0, 7, -Math.PI / 2.2, Math.PI / 2.2);
  ctx.fill();
  ctx.restore();
  if (player.hidden) drawHiddenTag(ctx, { x: player.x, y: player.y + HUD_HEIGHT });
}

/** The title screen: name, premise, controls, and the goal in one glance. */
export function drawTitle(ctx) {
  ctx.save();
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // A faint vault floor behind the title.
  ctx.fillStyle = '#1d212b';
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      if ((col + row) % 2 === 0) ctx.fillRect(col * 80, 520 + row * 35, 80, 35);
    }
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.relic;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('A STEALTH GAME IN THREE VAULTS', VIEW_WIDTH / 2, 150);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('SHADOW VAULT', VIEW_WIDTH / 2, 225);
  ctx.fillStyle = COLORS.playerCloak;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('The Silent Courier', VIEW_WIDTH / 2, 268);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Slip past the guards. Steal the golden relic. Reach the green exit — unseen.', VIEW_WIDTH / 2, 320);
  ctx.fillText('Vision cones show what a guard can see. Crates block sight.', VIEW_WIDTH / 2, 348);
  ctx.fillText('Sneak (SHIFT) inside a shadow patch and no guard can spot you.', VIEW_WIDTH / 2, 376);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('Click or press any key to begin', VIEW_WIDTH / 2, 440);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      SHIFT — sneak      Click — walk there      R — restart level', VIEW_WIDTH / 2, 480);
  ctx.restore();
}

/** Draw the whole playfield for one frame of play. */
export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  ctx.clip();
  drawFloor(ctx, game.level);
  drawWalls(ctx, game.level);
  drawShadows(ctx, game.level);
  drawCrates(ctx, game.level);
  drawExit(ctx, game.level);
  drawRelic(ctx, game.level);
  for (const guard of game.guards) drawGuard(ctx, game.level, guard);
  drawPlayer(ctx, game.player);
  ctx.restore();
  drawHud(ctx, game);
  drawHints(ctx);
  if (game.caughtFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 40, 40, ${Math.min(0.35, game.caughtFlash * 0.3)})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.restore();
  }
}
