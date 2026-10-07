#!/usr/bin/env bash
# Gera TODOS os ícones/thumbs a partir do LOGO definitivo do dono
# (`src/assets/brand/final/logo-wordmark.png`, 480x357, pixel art, instalado em
# 04/10/2026). Nada de arte nova: só enquadramento sobre o fundo do visor
# (#071413) com ampliação em INTEIRO (nearest ×4) e redução suave depois — o
# pixel do logo nunca fica borrado nem irregular.
# Uso: bash scripts/gerar-icones-logo.sh   (precisa de ImageMagick `convert`)
set -euo pipefail
cd "$(dirname "$0")/.."
LOGO=src/assets/brand/final/logo-wordmark.png
BG='#071413'
T="$(mktemp -d)"
convert "$LOGO" -filter point -resize 400% "$T/logo4x.png"   # 1920x1428, pixel inteiro
# flame-O: o recorte do "O" com a chama (peça central do logo) para 16/32 px, onde o wordmark não lê
convert "$LOGO" -crop 110x190+140+0 +repage -filter point -resize 400% "$T/flame4x.png"

# quadrado BG x BG com o logo a PCT% da largura; $4 = fundo (transparent p/ foreground)
quad() { # out size pct bg
  convert -size "$2x$2" "xc:$4" \( "$T/logo4x.png" -filter Lanczos -resize "$(( $2 * $3 / 100 ))x" \) -gravity center -composite "$1"
}
quad public/favicon-512x512.png 512 82 "$BG"
quad public/favicon-192x192.png 192 82 "$BG"
quad public/favicon-maskable-512.png 512 60 "$BG"   # zona segura do maskable (círculo de 80%)
quad public/apple-touch-icon.png 180 80 "$BG"
for s in 32 16; do
  convert -size "${s}x${s}" "xc:$BG" \( "$T/flame4x.png" -filter Lanczos -resize "x$(( s * 88 / 100 ))" \) -gravity center -composite "public/favicon-$s.png"
done
# og:image 1200x630
convert -size 1200x630 "xc:$BG" \( "$T/logo4x.png" -filter Lanczos -resize x440 \) -gravity center -composite public/og-image.png

R=android/app/src/main/res
declare -A LEG=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
for d in "${!LEG[@]}"; do
  l=${LEG[$d]}; f=$(( l * 9 / 4 ))   # foreground adaptativo = 108dp
  quad "$R/mipmap-$d/ic_launcher.png" "$l" 82 "$BG"
  # redondo: o mesmo quadro recortado em círculo, logo menor para caber
  quad "$T/r.png" "$l" 62 "$BG"
  convert "$T/r.png" \( -size "${l}x${l}" xc:black -fill white -draw "circle $((l/2)),$((l/2)) $((l/2)),0" \) -alpha off -compose CopyOpacity -composite "$R/mipmap-$d/ic_launcher_round.png"
  quad "$R/mipmap-$d/ic_launcher_foreground.png" "$f" 50 none
done
# splash (tela de abertura do Android): logo sobre o fundo do visor, em todas as densidades
for f in $(find "$R" -name splash.png); do
  dim=$(identify -format '%wx%h' "$f"); w=${dim%x*}; h=${dim#*x}
  m=$(( w < h ? w : h ))
  convert -size "${w}x${h}" "xc:$BG" \( "$T/logo4x.png" -filter Lanczos -resize "$(( m * 62 / 100 ))x" \) -gravity center -composite "$f"
done
rm -rf "$T"
