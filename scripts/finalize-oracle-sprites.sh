#!/bin/bash
# Redimensiona os 12 sprites gerados a partir do sistema real do oráculo
# (já vêm com alpha, sem precisar de remoção de fundo) e salva em
# src/assets/soulmon/lines/, no lugar dos placeholders/versão anterior.
set -e
SCRATCH="C:/Users/spera/AppData/Local/Temp/claude/D--Soulmon/28a8d95c-239c-4c1c-b355-3fe83f8f2749/scratchpad/hf2"
DEST="src/assets/soulmon/lines"
mkdir -p "$DEST"

for f in "$SCRATCH"/*.png; do
  base=$(basename "$f" .png)
  node -e "
    const sharp = require('sharp');
    sharp('$f').resize(256, 256, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).png().toFile('$DEST/${base}.png')
      .then(() => console.log('saved $DEST/${base}.png'))
      .catch(e => { console.error(e); process.exit(1); });
  "
done
echo "all done"
