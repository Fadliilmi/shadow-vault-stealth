# Shadow Vault: The Silent Courier

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/Fadliilmi/shadow-vault-stealth/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/Fadliilmi/shadow-vault-stealth/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down 2D stealth game: slip past patrolling guards, steal the golden
relic, and reach the green exit — unseen. Three vaults, each with its own
floor plan and patrol routes to learn.

## How it plays

- **Move** with WASD or the arrow keys, or click a floor tile to walk there.
- **Sneak** by holding SHIFT: slower and quieter, and much harder to spot.
- **Vision cones** show exactly what each guard can see; walls and crates
  block their sight. A guard's suspicion rises while you are in its cone —
  `?` means it is getting wary, `!` means it is chasing you.
- **Hide**: crouch-sneak inside a dark shadow patch and no guard can spot
  you at all, however close its cone sweeps.
- **Recover**: break line of sight and the chase fades — the guard searches
  where it last saw you, then goes back to its patrol.
- **Win a vault**: take the golden relic, then reach the green exit door.
  Get caught and you lose a life and restart the vault; lose all three
  lives and the run is over.
- **Sound** is generated live with WebAudio — soft courier steps, heavy
  guard boots that get louder (and pan left/right) as a guard nears, an
  alarm sting, a pickup chime and a quiet vault hum. No audio files.

## Run it

No build step, no network. Serve `game/` with any static server and open
`game/index.html` in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

## Files

- `game/src/level.js` — the three vaults: floor plans and patrol routes
- `game/src/vision.js` — line of sight and the vision-cone polygon
- `game/src/guards.js` — patrol / suspicious / chase behaviour
- `game/src/player.js` — movement, sneaking, hiding, the relic, the exit
- `game/src/audio.js` — all sound, synthesised with WebAudio
- `game/src/input.js` — keyboard and click-to-walk input
- `game/src/render.js` — everything drawn on the canvas
- `game/src/hud.js` — level, objective, detection meter, lives, timer
- `game/src/shots.js` — the four staged screenshot scenes (`?shot=…`)
- `game/src/main.js` — the game loop and screen flow
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` (run with `MAKEFUN_OUTPUT_DIR=out`)

Built for the [make.fun "Make the best stealth game" competition](https://make.fun/c/best-stealth-game-20261121-1759)
with the make.fun kit. Original game, art, sounds and names; MIT licensed.
