[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/tunnelmoon/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/tunnelmoon/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

# Starweave

Catch the falling stars. Trace the constellations before the night ends.

An entry for the [make.fun best game bounty](https://make.fun/bounty/best-game-01).
Referral code: `jg1vyr82`.

## How to play

You are the stargazer, a small hooded figure with a lantern, standing under a
falling sky. Stars drop from the night; move to catch them. Each level shows
one constellation to trace: every star you catch lights the next node of the
pattern. Light them all and the constellation is woven into the sky.

Red comets fall too. Touch one and you lose a life and your traced line
breaks. You have 3 lives a night, and each level has its own night timer:
when it runs out, dawn breaks, you lose a life, and the level clock restarts.

Weave all 6 constellations (The Lantern, The Fox, The Harp, The Crown, The
Serpent, The Phoenix) to win the night. Golden wish stars, from level 3 on,
are worth triple and light two nodes at once.

## Controls

- Move: mouse or WASD / arrow keys
- Start / restart: click, Enter, Space, or R on the end screens
- Pause: P or Esc
- Mute: M

## Scoring

- Star: 100 points times your combo (up to x8)
- Wish star: 300 points times your combo, lights two nodes
- Finishing a constellation: 500 points times the level number
- Best score is kept in localStorage

## Run it

Serve `game/` with any static server and open `index.html` in desktop Chrome.
No network request is made; every sound is synthesized with WebAudio.

```sh
node serve.ts
# open http://localhost:8080
```

Hand the entry in (writes `dossier.json` beside the copied game):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Shots

The screenshots in `screenshots/` are real renders of the game, staged
deterministically with `?shot=title|play|clear|over&seed=1` (see `shots.json`).
