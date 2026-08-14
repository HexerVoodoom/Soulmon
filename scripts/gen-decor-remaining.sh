#!/usr/bin/env bash
# Gera as peças restantes via CLI higgsfield (HF_API_KEY sem créditos), depois
# roda scripts/dechecker.mjs pra converter o xadrez fake do gpt_image_2 em
# alpha real. Script descartável — não faz parte do fluxo permanente.
#
# Retry espaçado: a conta tem só 4 slots concorrentes e outra sessão está
# usando ativamente — cada peça tenta, e se bater rate_limit_reached espera
# 90s antes de tentar de novo (até 20 tentativas), em vez de martelar.
cd "$(dirname "$0")/.."
OUT=src/assets/decor

gen() {
  local id="$1"; local prompt="$2"
  if [ -f "$OUT/$id.png" ]; then
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
  curl -fsSL "$url" -o "$OUT/$id.png"
  node scripts/dechecker.mjs "$OUT/$id.png"
}

gen "furn-books" "16-bit pixel art sprite of a three-shelf wooden bookcase with colorful book spines, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x56 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-lamp" "16-bit pixel art sprite of a floor lamp with a shade glowing soft yellow, slim base, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 48x52 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-rug" "16-bit pixel art sprite of an oval rug with a paw-print pattern and fringed ends, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 104x16 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games. Extreme foreshortening: the object is lying flat on the ground, seen at a shallow angle, occupying a very wide and short area."

gen "furn-plant" "16-bit pixel art sprite of a terracotta pot with broad foliage in two shades of green, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 48x52 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-picture" "16-bit pixel art sprite of a rectangular picture frame containing a generic creature portrait, species unidentifiable, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x40 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-campfire" "16-bit pixel art sprite of a campfire of crossed sticks with orange and yellow flames, ringed by stones, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x56 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-tent" "16-bit pixel art sprite of a triangular camping tent with a dark opening and guy stakes, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x56 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furn-rock" "16-bit pixel art sprite of a rounded boulder with moss on top, two shades of gray, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 48x52 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furniture-champion-banner" "16-bit pixel art sprite of a hanging pennant banner, gold with dark trim, V-shaped tip, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x40 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furniture-medal-wall" "16-bit pixel art sprite of a wooden plaque with three medals hanging from ribbons, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 56x40 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furniture-trophy-shelf" "16-bit pixel art sprite of an EMPTY two-tier display shelf, no trophies, no objects on the shelves, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 46x50 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

gen "furniture-podium" "16-bit pixel art sprite of an EMPTY three-step winners podium (2nd-1st-3rd), no trophies, nobody standing on it, drawn as a single object on a fully transparent background, no shadow, no ground line, no scenery. Front view, very slightly from above. Limited palette of 4-6 colors plus a dark 1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing, no gradients, no blur. Even neutral lighting from above. The object must be fully readable at 46x50 pixels. Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games."

echo "done"
