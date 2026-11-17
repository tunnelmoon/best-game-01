# JAM.md - Starweave (best-game-01)

Jam: make.fun best-game-01 - https://make.fun/bounty/best-game-01
Deadline: 2026-11-18T18:00:00Z / 2026-11-19 01:00 WIB
Started: 2026-11-17 ~14:05 WIB (about 35 hours left)
Rules: original game only, static files under game/, no network request, keyboard + mouse,
complete game (goal, rules, win/lose/score, start, restart, HUD) shown in 3-4 screenshots,
main.ts (Node 22, stdlib only) hands in game/ + screenshots/ + dossier.json.
Submit: NOT by me. Parent handles GitHub + submit. My job ends at a verified repo.

## Concept

You catch falling stars to trace a constellation before the night ends, while comets
break your traced line.

## MVP

- Stargazer moves with mouse + WASD/arrows, catches falling stars.
- Each level shows one target constellation (3-7 nodes); each catch lights the next node.
- Comet hit costs a life and resets the traced chain; 3 lives, game over at 0.
- Per-level night timer; timeout costs a life and restarts the level clock.
- Complete all 6 constellations to win; score with combo multiplier; best score in localStorage.
- Title, play HUD, level-clear banner, win screen, game-over screen with stats + restart.
- Pause (P), mute (M). WebAudio synthesized SFX, particles, trauma shake, hit-stop on clear.
- Deterministic shot mode (?shot=title|play|clear|over&seed=n) for 4 screenshots 1280x720.
- Files split by job: config, rng, input, audio, particles, feedback, entities, levels,
  render, game, shots, main.

## Pacing beats (levels, sawtooth rise, teach first)

1. The Lantern (3 nodes) - teach: slow fall, 1 comet at a time, generous timer.
2. The Fox (4 nodes) - develop: faster fall, comets more often.
3. The Harp (5 nodes) - twist: stars sway wider, timer tighter.
4. The Crown (5 nodes) - build: comet pairs, faster still.
5. The Serpent (6 nodes) - peak: dense fall, short timer.
6. The Phoenix (7 nodes) - climax: fastest, comet streams, then WIN screen.

## Stretch (in cut order)

1. Wish star (golden, counts double, worth 3x points).
2. Ambient pad drone under the SFX.
3. Moon-shard bonus pickups (+50, no chain effect).
4. Constellation ghost lines drawn faintly in the sky as a guide.
5. Screen flash on comet hit (keep under 3 flashes/sec).
6. Settings toggle for shake strength.

## Cut log

- H7 cut ambient pad drone: SFX alone carries the audio; a music loop would risk
  muddying the catch-note ladder. (Stretch 2)
- H7 cut moon-shard bonus pickups: wish stars already give the bonus-pickup
  variety; a third falling kind would blur the read. (Stretch 3)
- H7 cut shake-strength settings toggle: trauma shake is capped low (max 11px)
  and decays fast; a settings screen was out of scope for the ship buffer.
  (Stretch 6)
- Done, not cut: wish stars (from level 3), ghost constellation lines in the
  sky, red flash on comet hit (single flash per hit, under 3/sec).

## Verification (2026-11-17, headless Chromium 1248)

- Live play: title, click start, catches score, comet hit costs a life, pause
  and resume, timeout to game over, R restart, click restart, last-level catch
  to clear banner to win screen to restart. Zero console errors, zero
  non-local requests.
- Shot scenes: title / play (level 2, chain 2, score 1400) / clear (score
  1100, bonus +500) / over (lives 0, stats shown). Each scene renders the same
  bytes twice (deterministic, sha256 identical).
- main.ts twice, different output dirs: outputs byte-identical (diff clean).
- Screenshots: 4 JPEG 1280x720, 31-61 KiB each, under the 256 KiB cap.
- game/: 13 files, 51,683 bytes, index.html 943 bytes. Dossier 317,207 bytes.
- No em dash in any repo file. No external reference in game code.

## Timeline

- H0-1: JAM.md + design lock.
- H1-4: vertical slice (title, play, catch, clear, over, restart) with primitives.
- H4-6: juice + audio + all 6 levels + HUD polish.
- H6-7: shot mode + screenshots + headless playtest + fixes.
- H7-8: main.ts + serve.ts + README + owner.json + determinism check + final verify.
- Buffer: everything after H8 until the parent submits.
