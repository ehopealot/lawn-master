# Lawnmaster — project notes for Claude

Retro pixel lawn-care arcade game. One file, zero dependencies.
Live: https://ehopealot.github.io/lawn-master/ (GitHub Pages).

## Layout
- `index.html` — the entire game (~2700 lines vanilla JS on canvas).
- `tests/` — headless Node suites. `tools/make-og.js` — regenerates og.png/icon.png.

## Rules
- **Run `./tests/run.sh` after every change.** Five suites: render (sprite maps +
  all draw paths), smoke (every mechanic), balance (bot must reach day 8+),
  idle (an AFK player must be cited <60s), narrow (phone mode).
- All layout stays parametric on `W/H/GW/GH`. Desktop 30x19 grid; phones
  (coarse pointer) boot a vertical 16x30 grid with a two-row HUD.
- **Mobile sizing is CSS-owned** (fixed container + object-fit:contain).
  Never size the mobile canvas from JS — it races rotation/URL-bar.
- **Touch input uses raw touch events and reconciles against `e.touches`
  in every handler.** Two pointer-event attempts got the stick permanently
  pinned (iOS swallows ups). Do not refactor back to pointer events.
- Text uses the in-canvas 3x5 bitmap font: A-Z 0-9 and `space % + - . ! : /`
  only — no commas, parens, or apostrophes in player-facing strings.
  W is a special 5px-wide glyph.

## Balance philosophy
The game is a losing battle by design. Growth ramps forever;
promotions (+10% speed per rank at score milestones) let skill extend
a run. The near-optimal bot dies ~day 26 at ~77k — just short of the
80k LAWNMASTER rank, and that's intentional. After any pacing change,
run the balance suite AND an extended sim (raise the frame cap in
tests/balance.js to ~80000) to confirm death remains inevitable.

Secret: Cmd/Ctrl+Enter on the title starts in winter (`seasonShift = 3`).
