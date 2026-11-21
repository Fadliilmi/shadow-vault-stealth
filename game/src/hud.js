// The heads-up display: level, objective, alarm meter, lives and timer.
// One job: everything drawn on top of the playfield.
import { COLORS, SUSPICION_ALERT_AT, SUSPICION_SUSPICIOUS_AT, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { highestSuspicion } from './guards.js';

const BAR_WIDTH = 260;
const BAR_HEIGHT = 14;

/** The top bar: level name, objective, alarm meter, lives and time. */
export function drawHud(ctx, game) {
  const alarm = highestSuspicion(game.guards);
  ctx.save();
  ctx.fillStyle = COLORS.hudBack;
  ctx.fillRect(0, 0, VIEW_WIDTH, 46);

  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.level.name, 14, 24);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  const objective = game.player.hasRelic
    ? 'Relic taken — reach the green exit door'
    : 'Steal the golden relic, unseen';
  ctx.fillText(objective, 14, 40);

  // Alarm meter in the middle: calm green, wary amber, alert red.
  const barX = VIEW_WIDTH / 2 - BAR_WIDTH / 2;
  const barY = 12;
  ctx.fillStyle = '#22262f';
  ctx.fillRect(barX - 2, barY - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4);
  ctx.fillStyle = alarm >= SUSPICION_ALERT_AT ? COLORS.danger : alarm >= SUSPICION_SUSPICIOUS_AT ? '#ff9a3c' : COLORS.safe;
  ctx.fillRect(barX, barY, BAR_WIDTH * (alarm / SUSPICION_ALERT_AT), BAR_HEIGHT);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const alarmLabel = alarm >= SUSPICION_ALERT_AT ? 'SPOTTED!' : alarm >= SUSPICION_SUSPICIOUS_AT ? 'SUSPICIOUS…' : 'UNSEEN';
  ctx.fillText(`DETECTION  ${alarmLabel}`, VIEW_WIDTH / 2, barY + BAR_HEIGHT + 11);

  // Lives and time on the right.
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.danger;
  ctx.fillText('♥'.repeat(game.lives) + '♡'.repeat(Math.max(0, 3 - game.lives)), VIEW_WIDTH - 14, 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  const totalSeconds = Math.floor(game.elapsed);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  ctx.fillText(`TIME ${minutes}:${seconds}`, VIEW_WIDTH - 14, 38);

  // The relic the courier carries, drawn beside the level name when held.
  if (game.player.hasRelic) {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(14 + ctx.measureText(game.level.name).width + 18, 24, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A small "HIDDEN" tag under the player while shadows conceal them. */
export function drawHiddenTag(ctx, player) {
  ctx.save();
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.safe;
  ctx.fillText('HIDDEN', player.x, player.y + 30);
  ctx.restore();
}

/** A big centred message, with a smaller line under it. */
export function drawBanner(ctx, title, subtitle, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 12, 18, 0.72)';
  ctx.fillRect(0, VIEW_HEIGHT / 2 - 86, VIEW_WIDTH, 172);
  ctx.textAlign = 'center';
  ctx.fillStyle = color || COLORS.hudText;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(subtitle, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 28);
  ctx.restore();
}

/** The control hints along the bottom of the playfield. */
export function drawHints(ctx) {
  ctx.save();
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232, 236, 244, 0.55)';
  ctx.fillText(
    'WASD / arrows — move      SHIFT — sneak (slow, quiet, hidden in shadows)      Click — walk there      R — restart level',
    VIEW_WIDTH / 2,
    VIEW_HEIGHT - 10,
  );
  ctx.restore();
}
