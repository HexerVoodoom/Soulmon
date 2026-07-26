#!/bin/bash
# Remove background (Higgsfield) + resize (sharp) for each generated stage
# image, writing straight into src/assets/soulmon/lines/, deleting scratch
# originals immediately to avoid filling the disk.
set -e
SCRATCH="C:/Users/spera/AppData/Local/Temp/claude/D--Soulmon/28a8d95c-239c-4c1c-b355-3fe83f8f2749/scratchpad/hf"
DEST="src/assets/soulmon/lines"
mkdir -p "$DEST"

for f in "$SCRATCH"/*-rookie.png "$SCRATCH"/*-champion.png "$SCRATCH"/*-ultimate.png "$SCRATCH"/*-mega.png; do
  base=$(basename "$f" .png)
  echo "== $base =="
  url=$(higgsfield generate create image_background_remover --image_references "$f" --wait)
  tmp="$SCRATCH/${base}-nobg.png"
  curl -s -o "$tmp" "$url"
  node -e "
    const sharp = require('sharp');
    sharp('$tmp').resize(256, 256, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).png().toFile('$DEST/${base}.png')
      .then(() => console.log('saved $DEST/${base}.png'))
      .catch(e => { console.error(e); process.exit(1); });
  "
  rm -f "$tmp" "$f"
done
echo "all done"
