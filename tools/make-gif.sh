#!/usr/bin/env bash
# Convert a screen recording into a crisp pixel-art GIF (and an mp4 for
# Reddit/Twitter, which prefer video and re-encode GIFs anyway).
#
#   ./tools/make-gif.sh recording.mov [out-basename] [width]
#
# nearest-neighbor scaling keeps pixels square; two-pass palette keeps
# the GIF small and the greens exact. ~15fps reads smooth and stays light.
set -euo pipefail
in="$1"
out="${2:-lawnmaster-clip}"
w="${3:-480}"
ffmpeg -y -v warning -i "$in" -vf "fps=15,scale=${w}:-1:flags=neighbor,palettegen=stats_mode=diff" /tmp/gifpal.png
ffmpeg -y -v warning -i "$in" -i /tmp/gifpal.png \
  -filter_complex "fps=15,scale=${w}:-1:flags=neighbor[x];[x][1:v]paletteuse=dither=none" "${out}.gif"
ffmpeg -y -v warning -i "$in" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -an "${out}.mp4"
ls -lh "${out}.gif" "${out}.mp4"
