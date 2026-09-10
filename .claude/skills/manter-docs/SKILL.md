---
name: manter-docs
description: "Sincroniza o manual do Soulmon (`docs/manual/`) com o código depois de um merge — o trabalho do `doc-mantenedor`. Roda `scripts/docs-delta.mjs` (base = `docs/manual/.sincronizado.json`), despacha o redator dono de cada doc afetado com o diff, o `doc-verificador` sobre o que mudou e o `doc-bibliotecario` se nasceu módulo/doc/skill, recarimba, grava o SHA sincronizado, registra no STATUS e fecha com commit + PR + merge. Dispara automaticamente pelo hook de sessão (quando o briefing diz `docs: DEFASADO`), pelo `soulmon-coordenador` no fechamento e pelo workflow `.github/workflows/docs-sync.yml` a cada push na `main`. Use: `/manter-docs [auto | desde <sha> | status]`. NÃO reescreve docs inteiros, NÃO altera código, NÃO sincroniza sem verificação."
---

# MANTER-DOCS — o manual acompanha o merge

Você é o `doc-mantenedor` (leia `.claude/agents/doc-mantenedor.md`). Método:
`.claude/skills/squad-docs/METODO.md` (R1–R10). Donos: `.claude/skills/squad-docs/CONTRACT.md`.

## `status`
`node scripts/docs-delta.mjs` e pare. Não escreve nada.

## `auto` (padrão) / `desde <sha>`

1. **Delta**: `node scripts/docs-delta.mjs --json` (ou `--desde <sha>`). Guarde `base`,
   `head`, `porDoc`, `novos`, `apagados`, `exportsMudaram`. `temDelta: false` → diga
   "sincronizado com <base>" e pare (sem commit).
2. **Contexto do diff**: `git log --format='%h %ad %s' --date=short <base>..<head>` e, por doc,
   `git diff <base>..<head> -- <arquivos daquele doc>`.
3. **Despache em paralelo, um redator por doc** (uma mensagem com todos os `Agent`):
   - doc → redator dono (CONTRACT §2). Briefing: o doc, os arquivos com A/M/D, o diff, a
     ordem "só o que o diff muda; formato intacto; ⚰️ para o que morreu; ⚠️ divergência
     onde o `CLAUDE.md` descreve diferente; nunca `arquivo:linha`".
   - `novos` → `doc-redator-referencia` escreve as entradas (H3 = caminho exato).
   - `apagados` → entrada vira `⚰️ apagado em <sha>`.
   - `exportsMudaram` → reconferir a lista de exports da entrada.
4. **Verificar**: `doc-verificador`, um por doc tocado, com a lista de seções/entradas
   alteradas — só essas, símbolo por símbolo. Recarimba `**Estado:** verificado em
   <dd/mm/aaaa> por doc-verificador`. Devolução aberta = o doc não entra no commit e o
   motivo vai para o STATUS.
5. **Indexar** (só se nasceu doc/módulo/skill/agente): `doc-bibliotecario` → `00-MAPA.md`
   §5/§6/§7.
6. **Guard**: `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`.
7. **Registrar**: `docs/manual/.sincronizado.json` ← `{ "sha": "<head>", "data": "<dd/mm/aaaa>",
   "por": "doc-mantenedor (<sessão|workflow>)" }` + bloco curto no `docs/STATUS.md`.
8. **Fechar**: `git add docs/manual docs/STATUS.md` · commit `docs(manual): sincronização
   pós-merge <head-curto>` · push · PR · merge ff-only na `main`. No workflow, a branch é
   `docs/sync-<head-curto>`.

## Regras duras
- O commit de sincronização só toca `docs/manual/`, `docs/STATUS.md` e `.sincronizado.json`.
- Sem delta, sem commit. Sem verificação, sem carimbo. Sem carimbo, sem commit.
- Código errado não se conserta aqui: ⚠️ divergência no doc + STATUS.
