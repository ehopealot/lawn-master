#!/usr/bin/env bash
# Headless test runner for Lawnmaster.
#
# Extracts the game script from index.html, concatenates it with a DOM/canvas
# stub (stub.js) and each test driver, and runs the result under Node. The
# drivers share the game's top-level scope, so they can poke state directly.
#
#   render.js  - validates every sprite map (row widths, palette chars) and
#                exercises every render path headlessly, all seasons included
#   smoke.js   - end-to-end mechanics: driving, mowing, spray/fix/bag actions,
#                beer, house collision, dogs (small and big), events, winter
#                clearing, high scores, HOA game over, restart
#   balance.js - winnability check: a bot mowing a serpentine pattern must
#                survive 3+ days with the current tuning
#
# Requires: node (any recent version), awk.
set -euo pipefail
cd "$(dirname "$0")"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

awk '/<script>/{f=1;next}/<\/script>/{f=0}f' ../index.html > "$tmp/game.js"
node --check "$tmp/game.js"
echo "== syntax OK =="

for driver in render smoke balance; do
  cat stub.js "$tmp/game.js" "$driver.js" > "$tmp/test-$driver.js"
  echo "== $driver =="
  node "$tmp/test-$driver.js"
done

echo "ALL TESTS PASSED"
