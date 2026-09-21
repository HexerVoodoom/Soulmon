#!/bin/bash
# Hook de início de sessão do Soulmon.
#
# Duas tarefas, nesta ordem: (1) garantir que os portões rodam (node_modules —
# em 09/09/2026 uma sessão web nasceu sem eles e `tsc`/`vitest` falharam até
# alguém instalar à mão); (2) imprimir o briefing que ativa o
# `soulmon-coordenador`: estado do git, sincronização do manual, o que depende
# do dono. O stdout deste script vira contexto da sessão — é assim que o
# coordenador "roda sozinho": a sessão nasce lendo a ordem de invocá-lo.
#
# Síncrono de propósito: a sessão só começa quando as dependências existem.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vitest ]; then
  npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || echo "⚠️ npm install falhou — rode à mão antes dos portões"
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo '?')
HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo '?')
git fetch -q origin main 2>/dev/null || true
ATRAS=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo '?')
DELTA=$(node scripts/docs-delta.mjs --resumo 2>/dev/null || echo 'docs: (não medido — scripts/docs-delta.mjs falhou)')
# A fila viva do dono é `docs/PERGUNTAS-DO-DONO.md` (regra de 20/09/2026), não
# um bloco fixo do STATUS: a regex antiga só casava com o bloco de 09/09 e toda
# sessão abria com pendências velhas (achado do QA geral de 21/09/2026). Conta
# as linhas de pergunta (tabela, 1ª coluna numérica) e aponta a última seção.
PERG=$(grep -cE '^\| *[0-9]+ *\|' docs/PERGUNTAS-DO-DONO.md 2>/dev/null || echo 0)
ULTIMA=$(grep -E '^## ' docs/PERGUNTAS-DO-DONO.md 2>/dev/null | tail -1 | sed 's/^## //')
DONO="docs/PERGUNTAS-DO-DONO.md — $PERG pergunta(s) registradas; última seção: ${ULTIMA:-—}"
GUARD=$( (npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts 2>&1 | grep -E '^\s+(Test Files|Tests) ' | sed 's/^ *//') || echo 'guard do manual: não rodou')

cat <<BRIEF
## Soulmon — briefing de início de sessão (hook .claude/hooks/session-start.sh)

- git: branch \`$BRANCH\` em \`$HEAD\`; \`origin/main\` está $ATRAS commit(s) à frente
- $DELTA
- guard do manual: ${GUARD:-não rodou}
- depende do dono: ${DONO}

**Protocolo obrigatório desta sessão:** antes de trabalhar em qualquer assunto,
invoque a skill \`soulmon-coordenador\` (\`/soulmon start\`). Ela lê
\`docs/manual/00-MAPA.md\`, \`docs/STATUS.md\` e \`CLAUDE.md\`, roteia o pedido
para o orquestrador certo (guardas · squad-som · squad-narrativa · squad-docs ·
squad-design · squad-arte · operador · squad-alpha global) e, ao fechar, garante os portões, o bloco no STATUS, o
PR + merge e a sincronização do manual (\`/manter-docs\`). Se a linha "docs:"
acima disser DEFASADO, a sincronização vem ANTES do trabalho novo.
BRIEF
