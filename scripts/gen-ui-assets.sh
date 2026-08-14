#!/usr/bin/env bash
# Gera ícones (com transparência, via gpt_image_2 + dechecker) e cenários de
# fundo (imagem cheia, sem transparência) pra substituir CSS/emoji na UI.
# Script descartável desta rodada — mesmo padrão de scripts/gen-decor-remaining.sh.
cd "$(dirname "$0")/.."
ICON_OUT=src/assets/icons
BG_OUT=src/assets/backgrounds
mkdir -p "$ICON_OUT" "$BG_OUT"

gen() {
  local out_dir="$1"; local id="$2"; local prompt="$3"; local transparent="$4"
  if [ -f "$out_dir/$id.png" ]; then
    echo "== $id == já existe, pulando"
    return
  fi
  echo "== $id =="
  local attempt=0
  local url=""
  while [ -z "$url" ]; do
    attempt=$((attempt+1))
    local raw
    raw=$(higgsfield generate create gpt_image_2 --prompt "$prompt" --wait --json 2>&1)
    url=$(echo "$raw" | node -e "
      let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{
        try { const j = JSON.parse(s); const u = j[0]?.result_url; if (u) console.log(u); }
        catch(e) {}
      });")
    if [ -z "$url" ]; then
      if echo "$raw" | grep -q "rate_limit_reached"; then
        echo "  slots ocupados (tentativa $attempt), esperando 90s…"
        sleep 90
      else
        echo "  erro inesperado: $raw"
        return
      fi
      if [ "$attempt" -ge 20 ]; then
        echo "  desisti de $id após $attempt tentativas"
        return
      fi
    fi
  done
  curl -fsSL "$url" -o "$out_dir/$id.png"
  if [ "$transparent" = "1" ]; then
    node scripts/dechecker.mjs "$out_dir/$id.png"
  fi
}

ICON_BASE="16-bit pixel art game icon of ICON_ART, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "$ICON_OUT" "icon-heart-item" "16-bit pixel art game icon of a glowing pink-red heart with a small sparkle, healing item icon, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-trophy-gold" "16-bit pixel art game icon of a gold first-place trophy cup, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-trophy-silver" "16-bit pixel art game icon of a silver second-place trophy cup, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-trophy-bronze" "16-bit pixel art game icon of a bronze third-place trophy cup, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-chip-virus" "16-bit pixel art game icon of a small green computer chip cartridge with a virus/microbe symbol etched on it, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-chip-data" "16-bit pixel art game icon of a small blue computer chip cartridge with a data/floppy-disk symbol etched on it, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$ICON_OUT" "icon-chip-vaccine" "16-bit pixel art game icon of a small purple-pink computer chip cartridge with a syringe/vaccine symbol etched on it, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front-facing, centered. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 1

gen "$BG_OUT" "bg-matrix" "16-bit pixel art scene of a glowing green digital matrix room, vertical streams of falling green code characters, a faint floor line about three quarters down the frame, dark near-black background, no characters, no creatures, no text, no logos. Wide landscape composition. Limited palette of greens and near-black, plus a dark outline style. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 0

gen "$BG_OUT" "bg-ocean" "16-bit pixel art scene of a deep sea ocean floor, dark blue water gradient, scattered small bubbles and light rays from above, a faint sandy floor line about three quarters down the frame, no fish, no creatures, no text, no logos. Wide landscape composition. Limited palette of blues, plus a dark outline style. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games." 0

gen "$BG_OUT" "bg-gameboy" "16-bit pixel art scene styled as a monochrome green LCD handheld game screen, olive-green background, faint pixel grid texture, a subtle horizontal floor line about three quarters down the frame, no characters, no creatures, no text, no logos. Wide landscape composition. Limited palette of 2-3 shades of olive green only, plus a dark outline style. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Retro virtual-pet toy aesthetic, in the style of late-90s Game Boy screens." 0

echo "done"
