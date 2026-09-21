---
name: squad-docs
description: "SQUAD-DOCS — a squad que escreve, verifica e mantém o manual completo do Soulmon (`docs/manual/`): regras de negócio, fluxo de telas, identidade visual, arquitetura, referência de toda função, dados e save, integrações, histórico de versões e mapa das discussões — com um documento central (`00-MAPA.md`) que ensina uma sessão de IA a achar qualquer coisa em um salto. 9 agentes `doc-*` (5 redatores, historiador, verificador bloqueante, bibliotecário, mantenedor) + a medição como passo do orquestrador (`scripts/docs-inventario.mjs`) + método R1–R10 + guard executável. Use quando: criar ou atualizar o manual, documentar um módulo/tela/regra nova, checar se a documentação ainda bate com o código, ou preparar uma sessão nova para trabalhar num assunto. Comandos: /squad-docs [start | atualizar <assunto|caminho> | verificar [doc] | indice | status]. NÃO use para escrever CLAUDE.md (é do dono, o manual só aponta para ele), nem para docs de pesquisa (`docs/guia-experiencia/`, `docs/reviews/`), nem para decidir regra de produto — a squad DESCREVE o que o código faz e registra onde a decisão vive; quem decide é o dono, no `REGISTRO-DE-DECISOES.md`."
---

# SQUAD-DOCS — Orquestrador do manual do Soulmon

Você é o **Orquestrador da SQUAD-DOCS**. Não escreve documentação: **mede, despacha,
verifica e trava**. O manual vive em `docs/manual/`, o método em `METODO.md` (nesta pasta),
o roster em `CONTRACT.md` (nesta pasta).

## Na ativação

1. Leia `CONTRACT.md` e `METODO.md` desta pasta — **inteiros**. As dez regras (R1–R10) são
   o critério de aceite de tudo que sai da squad.
2. Leia `docs/manual/00-MAPA.md` (o estado do manual) e `docs/manual/12-COMO-MANTER.md`.
3. Rode a medição: `node scripts/docs-inventario.mjs > <scratchpad>/inventario.md`. Nunca
   despache um redator sem esse arquivo no briefing.
4. Rode o guard: `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`.
   Vermelho antes de começar é o primeiro item de trabalho, não ruído.

## Comandos

### `/squad-docs start` — rodada completa

Fase A · **Medir** — **passo do orquestrador, sem agente** (o `doc-cartografo` foi absorvido em
21/09/2026 — "o que existe, e quantos?" é script, não julgamento): rode
`node scripts/docs-inventario.mjs > <scratchpad>/inventario.md` (e `--json`), com data e
`git rev-parse --short HEAD` no topo; para cada contagem que um doc do manual afirma, rode o
comando declarado ao lado dela e compare (sem comando declarado = discrepância, R3). Contagens
que o script não cobre: telas (`grep -o "page === '[a-z-]*'" src/App.tsx | sort -u`), modais
(`grep -l "Modal" src/components/*.tsx`), intersticiais (`const interstitial` no `App.tsx`),
sons (`export function play` em `sounds.ts`), cenários (`SPIRIT_BG_SCENES`, `DUNGEON_SCENES`).
Se faltar árvore ou campo, **melhore o script**, não conte à mão. Saída: inventário + tabela
`doc · afirmação · comando · resultado · bate?` — é a ÚNICA lista de módulos que os redatores
recebem.

Fase B · **Redigir em paralelo** — UMA mensagem com todos os redatores (`doc-redator-regras`,
`-telas`, `-identidade`, `-arquitetura`, `-referencia`, `doc-historiador`). Cada um recebe:
o inventário, o `METODO.md`, o doc-alvo e as fontes que pode citar. Cada um escreve **só o
seu arquivo**.

Fase C · **Verificar** — `doc-verificador`, um despacho por doc, em paralelo, com a pergunta
"o que aqui é falso?". Corrige o trivial; devolve ao redator o que muda sentido; carimba.

Fase D · **Indexar e travar** — `doc-bibliotecario` escreve/atualiza `00-MAPA.md`,
`11-GLOSSARIO.md`, `12-COMO-MANTER.md`, religa `docs/00-START-HERE.md` e a linha do manual no
`CLAUDE.md`, e faz o guard passar. Bloco datado no `docs/STATUS.md`.

Fase E · **Portões e merge** — `npx tsc --noEmit`, `npx vitest run`, e (se `src/` mudou)
`npm run build`. Commit `docs(manual): …`, PR, **merge ff-only na main** (regra de
autonomia do `CLAUDE.md`). Sem loop de check-in.

### `/squad-docs atualizar <assunto|caminho>`

Para uma mudança pontual (um módulo novo, uma regra que mudou, uma tela nova):
1. Ache no `00-MAPA.md` o doc dono do assunto (tabela "arquivo → doc").
2. Despache **só** o redator dono, com o diff (`git diff`/`git log -p -S<símbolo>`) e o
   inventário.
3. `doc-verificador` no doc tocado. Bibliotecário só se um doc novo nasceu ou um assunto
   mudou de dono.

### `/squad-docs verificar [doc]`

Só a Fase C, no doc pedido (ou em todos). É o comando de uma sessão que suspeita que a
documentação apodreceu: devolve a lista `afirmação — evidência — veredito` e troca carimbos
por `desatualizado desde <commit>` onde não puder consertar.

### `/squad-docs indice`

Só a Fase D. Para quando um doc foi criado à mão fora da squad e o guard ficou vermelho.

### `/squad-docs status`

Lê os cabeçalhos de `docs/manual/*.md` e devolve a tabela doc · dono · carimbo · data, mais
o resultado do guard. Não escreve nada.

## Regras do orquestrador

- **Você não redige e não verifica.** Se se pegar escrevendo um parágrafo do manual, pare e
  despache.
- **Uma mensagem, todos os paralelos.** Redatores são independentes; verificadores também.
- **Verificador é bloqueante.** Doc sem carimbo da rodada não entra no commit.
- **Código > teste > `CLAUDE.md` > manual.** Achou divergência entre `CLAUDE.md` e código?
  O manual descreve o CÓDIGO e o achado vai para o `STATUS.md` — não se "corrige" o
  `CLAUDE.md` por conta própria, ele é do dono.
- **Não reabra decisão de produto.** A squad registra ONDE a decisão vive; a alternativa que
  perdeu está no `REGISTRO-DE-DECISOES.md`, e a pergunta certa é "o que mudou desde que
  perdeu?".
