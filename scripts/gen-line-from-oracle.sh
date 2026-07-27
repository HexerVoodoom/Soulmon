#!/bin/bash
# Gera as 4 imagens de UMA linha (rookie->champion->ultimate->mega) usando os
# imagePrompts REAIS produzidos por utils/oracle.ts (simulate-oracle-lines.ts),
# encadeando cada estágio como referência de imagem do próximo.
# Usage: gen-line-from-oracle.sh <line> <json-file>
set -e
SCRATCH="C:/Users/spera/AppData/Local/Temp/claude/D--Soulmon/28a8d95c-239c-4c1c-b355-3fe83f8f2749/scratchpad/hf2"
mkdir -p "$SCRATCH"
LINE="$1"
JSONFILE="$2"
MODEL="gpt_image_2"

prompt_for() {
  node -e "
    const data = require('$JSONFILE');
    const rows = data['$LINE'];
    const row = rows.find(r => r.stage === '$1');
    process.stdout.write(row.imagePrompt);
  "
}

gen() {
  local stage="$1" prompt="$2" ref="$3"
  local out="$SCRATCH/${LINE}-${stage}.png"
  if [ -s "$out" ]; then
    echo "[$LINE/$stage] already exists, skipping" >&2
    printf '%s' "$out"
    return
  fi
  local url
  if [ -n "$ref" ]; then
    url=$(higgsfield generate create "$MODEL" --prompt "$prompt" --image "$ref" --aspect_ratio 1:1 --wait)
  else
    url=$(higgsfield generate create "$MODEL" --prompt "$prompt" --aspect_ratio 1:1 --wait)
  fi
  echo "[$LINE/$stage] $url" >&2
  curl -s -o "$out" "$url"
  printf '%s' "$out"
}

ROOKIE_P=$(prompt_for rookie)
R=$(gen rookie "$ROOKIE_P" "")

for lvl_attr in champion ultimate mega; do
  stage_id=$(node -e "
    const data = require('$JSONFILE');
    const rows = data['$LINE'];
    const row = rows.find(r => r.stage.startsWith('$lvl_attr-'));
    process.stdout.write(row ? row.stage : '');
  ")
  P=$(prompt_for "$stage_id")
  WRAPPED="Evolve the creature in the reference image into its next, more developed and powerful form, just more advanced. $P"
  case "$lvl_attr" in
    champion) C=$(gen champion "$WRAPPED" "$R") ;;
    ultimate) U=$(gen ultimate "$WRAPPED" "$C") ;;
    mega) M=$(gen mega "$WRAPPED" "$U") ;;
  esac
done
echo "[$LINE] done: $R | $C | $U | $M" >&2
