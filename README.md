# 🚜 Lawnmaster

Play: https://lawnmaster.gg/

A retro pixel-art lawn-care arcade game in a single HTML file. Mow the lawn,
spray the weeds, honk at the squirrels, bag what the dog leaves behind — and
whatever you do, don't let the HOA catch the yard below code.

Everything — game engine, pixel art, seasons, chiptune soundtrack, sound
effects — is dependency-free vanilla JavaScript on a `<canvas>`. No build
step, no assets, no network requests. All sprites are drawn from pixel maps,
the grass tiles are procedurally pre-rendered at boot, and the music is a
step sequencer running on the Web Audio API.

## Play

Open `index.html` in a browser. That's it.

| Input | Action |
| --- | --- |
| WASD / arrows | Drive the mower |
| Space | Context action: spray weed · bag poop · fill hole · reseed dirt · honk · grab a cold one at the house |
| P | Pause |
| M | Mute |
| Enter | Clock in / new contract |

On touch devices, drag anywhere to drive — a joystick appears under your
finger. Tap to act (a second finger while steering works too).

## The job

- **Grass grows.** Mow it. Mowing earns your supplies: weed spray,
  fertilizer, and poop bags (tall grass pays double).
- **Weeds** sprout and spread. Pull up next to one and spray it.
- **Squirrels** dig holes. Get close or honk to send them packing. Fill the
  holes with fertilizer.
- **The neighborhood dog** wanders in to do his business. Interrupt the squat
  if you can; bag it if you can't. The **big dog** doesn't scare easily — he
  just relocates. Chase him three times to be rid of him.
- **Dry patches** bake into the lawn from day 2. Reseed with fertilizer.
- **The HOA is watching.** Below 40% lawn health, the complaint meter fills.
  You'll be warned when they start drafting. **One letter and you're done.**
- **The cooler on the porch** holds a cold one: +35% speed for 12 seconds,
  steering optional.
- **Seasons** turn every 4 days: summer, golden late summer, autumn with
  falling leaves — and winter, when the mower becomes a snowblower and the
  HOA inspects your snow clearing instead. Each season has its own
  soundtrack.
- **Events** hit every so often: squirrel stampedes, dog park takeovers,
  droughts (summer only) — and, if you're lucky, a gnome party.
- **High scores** — your top five runs are kept in localStorage.

## Secrets

<details>
<summary>One secret handshake (spoiler)</summary>

Press <b>Cmd+Enter</b> (or Ctrl+Enter) on the title screen to clock in
mid-winter, snow already on the ground.

</details>

## Development

The whole game lives in `index.html`. The test suite runs headlessly under
Node — a small stub fakes just enough DOM/canvas for the game script to boot,
and the drivers share its top-level scope:

```sh
./tests/run.sh
```

- `tests/render.js` — validates every sprite map (row widths, palette
  references) and exercises every render path, across all four seasons.
- `tests/smoke.js` — end-to-end mechanics: mowing, all Space actions, beer,
  house collision, both dogs, all four events, winter clearing, high-score
  ranking, and the HOA game-over → restart loop.
- `tests/balance.js` — winnability check: a bot that mows a serpentine
  pattern (and routes around the house) must survive 3+ days on current
  tuning. This exists because version one of the game was accidentally,
  mathematically unwinnable.

## Credits

Built by Erik Hope with [Claude Code](https://claude.com/claude-code).
A Hope Lawn Co. production.

## License

[MIT](LICENSE)
