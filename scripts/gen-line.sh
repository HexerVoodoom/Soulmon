#!/bin/bash
# Generates one Soulmon line (rookie -> champion -> ultimate -> mega) via the
# Higgsfield CLI, chaining each stage's image as reference for the next.
# Usage: gen-line.sh <line-name> <rookie-prompt> <champion-prompt> <ultimate-prompt> <mega-prompt>
# Resumes from whatever stage files already exist in the scratch dir.
set -e
SCRATCH="C:/Users/spera/AppData/Local/Temp/claude/D--Soulmon/28a8d95c-239c-4c1c-b355-3fe83f8f2749/scratchpad/hf"
mkdir -p "$SCRATCH"
LINE="$1"
P_ROOKIE="$2"
P_CHAMPION="$3"
P_ULTIMATE="$4"
P_MEGA="$5"
MODEL="nano_banana_flash"

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

R=$(gen rookie "$P_ROOKIE" "")
C=$(gen champion "$P_CHAMPION" "$R")
U=$(gen ultimate "$P_ULTIMATE" "$C")
M=$(gen mega "$P_MEGA" "$U")
echo "[$LINE] done: $R | $C | $U | $M" >&2
