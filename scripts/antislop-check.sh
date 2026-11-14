#!/usr/bin/env bash
# Catraca anti-slop: compara o slop-scan com .antislop/baseline.txt (só pode descer).
# Requer o slop-scan da skill squad-antislop (SLOP_SCAN=<caminho> para outro local) e GNU grep.
# Uso: npm run antislop:check            (confere; exit 1 se algum sinal subiu)
#      npm run antislop:check -- --write (regrava para BAIXO depois de uma limpeza)
set -euo pipefail
cd "$(dirname "$0")/.."
scan="${SLOP_SCAN:-$HOME/.claude/skills/squad-antislop/scripts/slop-scan.sh}"
[[ -f "$scan" ]] || { echo "slop-scan não encontrado: $scan (defina SLOP_SCAN)" >&2; exit 2; }
excl=(--exclude dist --exclude android --exclude memory --exclude public)
if [[ "${1:-}" == "--write" ]]; then
  exec bash "$scan" . --max 0 "${excl[@]}" --write-baseline .antislop/baseline.txt
fi
exec bash "$scan" . --max 0 "${excl[@]}" --baseline .antislop/baseline.txt
