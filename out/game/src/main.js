// Shadow Vault: The Silent Courier — the game loop and screen flow.
// One job: own the game state, step it every frame, and draw the screen.
import { CATCH_DISTANCE, HUD_HEIGHT, START_LIVES, VIEW_HEIGHT, VIEW_WIDTH, distance } from './config.js';
import { LEVEL_COUNT, buildLevel } from './level.js';
import { GUARD_CHASE, highestSuspicion, makeGuard, updateGuard } from './guards.js';
import { atExit, makePlayer, tryPickup, updatePlayer } from './player.js';
import { createInput } from './input.js';
import { drawBanner, drawHud } from './hud.js';
import { drawGame, drawTitle } from './render.js';
import { stageShot } from './shots.js';
import {
  ensureAudio,
  playAlertSting,
  playCaught,
  playGuardStep,
  playLevelClear,
  playPickup,
  playPlayerStep,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

// Surface load errors in the page title so a headless check can see them.
window.addEventListener('error', (event) => {
  document.title = `GAME ERROR: ${event.message}`;
});

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const game = {
  levelIndex: 0,
  level: null,
  guards: [],
  player: null,
  lives: START_LIVES,
  elapsed: 0,
  screen: 'title',
  caughtFlash: 0,
  caughtTimer: 0,
  clearTimer: 0,
  shotMode: false,
  wasAlert: false,
  message: '',
  messageTimer: 0,
};
window.__game = game;

const input = createInput(canvas);

/** (Re)build the current level: fresh vault, guards and courier. */
function loadLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.guards = game.level.guards.map((route, i) => makeGuard(route, i));
  game.player = makePlayer(game.level.playerStart);
  game.caughtFlash = 0;
  game.caughtTimer = 0;
  game.message = game.level.hint;
  game.messageTimer = 5;
}

function startGame() {
  ensureAudio();
  game.lives = START_LIVES;
  game.elapsed = 0;
  loadLevel(0);
  game.screen = 'play';
}

function restartLevel() {
  loadLevel(game.levelIndex);
  game.screen = 'play';
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVEL_COUNT) {
    game.screen = 'win';
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.screen = 'play';
}

input.onKey = (code) => {
  ensureAudio();
  if (game.screen === 'title') {
    startGame();
    return;
  }
  if (code === 'KeyR' && (game.screen === 'play' || game.screen === 'gameover')) {
    game.lives = START_LIVES;
    restartLevel();
    return;
  }
  if (game.screen === 'levelclear' && (code === 'Enter' || code === 'Space')) {
    nextLevel();
    return;
  }
  if ((game.screen === 'gameover' || game.screen === 'win') && (code === 'Enter' || code === 'Space')) {
    startGame();
  }
};

input.onClick = (x, y) => {
  ensureAudio();
  if (game.screen === 'title') {
    startGame();
    return;
  }
  if (game.screen === 'levelclear') {
    nextLevel();
    return;
  }
  if (game.screen === 'gameover' || game.screen === 'win') {
    startGame();
    return;
  }
  if (game.screen === 'play') {
    game.player.moveTarget = { x, y: y - HUD_HEIGHT };
  }
};

/** One frame of play: move the courier, the guards, and check the outcomes. */
function updatePlay(dt) {
  game.elapsed += dt;
  game.caughtFlash = Math.max(0, game.caughtFlash - dt);
  if (game.messageTimer > 0) game.messageTimer -= dt;

  const step = updatePlayer(game.level, game.player, input, dt);
  if (step === 'step') playPlayerStep(game.player.sneaking);

  for (const guard of game.guards) {
    updateGuard(game.level, guard, game.player, dt, (g) => playGuardStep(g, game.player));
  }

  const alertNow = game.guards.some((g) => g.state === GUARD_CHASE);
  if (alertNow && !game.wasAlert) playAlertSting();
  game.wasAlert = alertNow;

  if (tryPickup(game.level, game.player)) {
    playPickup();
    game.message = 'Relic taken! Reach the green exit door.';
    game.messageTimer = 4;
  }

  if (atExit(game.level, game.player)) {
    if (!game.shotMode) {
      playLevelClear();
      game.screen = 'levelclear';
      game.clearTimer = 0;
    }
    return;
  }

  // Caught: a chasing guard closes to arm's reach.
  for (const guard of game.guards) {
    if (guard.state === GUARD_CHASE && distance(guard.x, guard.y, game.player.x, game.player.y) < CATCH_DISTANCE) {
      if (game.shotMode) return;
      playCaught();
      game.lives -= 1;
      game.caughtFlash = 1;
      game.screen = 'caught';
      game.caughtTimer = 1.4;
      return;
    }
  }
}

function update(dt) {
  if (game.screen === 'play') {
    updatePlay(dt);
    return;
  }
  if (game.screen === 'caught') {
    game.caughtTimer -= dt;
    game.caughtFlash = Math.max(0, game.caughtFlash - dt);
    if (game.caughtTimer <= 0) {
      if (game.lives <= 0) {
        game.screen = 'gameover';
      } else {
        restartLevel();
      }
    }
    return;
  }
  if (game.screen === 'levelclear') {
    game.clearTimer += dt;
    if (!game.shotMode && game.clearTimer > 3.2) nextLevel();
  }
}

function draw() {
  if (game.screen === 'title') {
    drawTitle(ctx);
    return;
  }
  if (game.screen === 'gameover') {
    drawGame(ctx, game);
    drawBanner(ctx, 'CAUGHT FOR GOOD', 'The vault keeps its secrets. Press Enter to try again.', '#ff5a5a');
    return;
  }
  if (game.screen === 'win') {
    drawGame(ctx, game);
    const total = Math.floor(game.elapsed);
    drawBanner(
      ctx,
      'ALL THREE VAULTS CLEARED',
      `The Silent Courier vanishes into the night — total time ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}. Press Enter to play again.`,
      '#39d98a',
    );
    return;
  }
  if (game.screen === 'levelclear') {
    drawGame(ctx, game);
    const next = game.levelIndex + 1 >= LEVEL_COUNT ? 'the final vault is yours' : `next: ${buildLevel(game.levelIndex + 1).name}`;
    drawBanner(ctx, 'VAULT CLEARED', `Relic secured, exit reached — unseen. ${next}.`, '#39d98a');
    return;
  }
  if (game.screen === 'caught') {
    drawGame(ctx, game);
    drawBanner(ctx, 'CAUGHT!', game.lives > 0 ? `${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left — back to the start of this vault.` : 'Last life gone…', '#ff5a5a');
    return;
  }
  drawGame(ctx, game);
  if (game.messageTimer > 0) {
    ctx.save();
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(232, 236, 244, 0.9)';
    ctx.fillText(game.message, VIEW_WIDTH / 2, 66);
    ctx.restore();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// Start on the title screen; a ?shot= query jumps straight into a staged scene.
loadLevel(0);
if (shotName) {
  game.screen = stageShot(shotName, game);
} else {
  game.screen = 'title';
}
requestAnimationFrame(frame);
