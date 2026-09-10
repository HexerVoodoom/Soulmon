# Contrato — SQUAD-DOCS (Soulmon)

Fonte única da verdade de como os agentes de documentação, o orquestrador e o método se
encaixam. Segue o §1 do `squad-som/CONTRACT.md` (mesmo formato de agente).

- **Método:** `METODO.md` nesta pasta (R1–R10 + ciclo). Vale para qualquer sessão que toque
  em `docs/manual/`, com ou sem a squad.
- **Prefixo dos agentes:** `doc-` → `.claude/agents/doc-*.md`.
- **Artefato:** `docs/manual/` (o manual) + `scripts/docs-inventario.mjs` (a medição) +
  `src/docsManual.contract.test.ts` (a trava).
- **Workdir de rascunho:** o scratchpad da sessão. Nada de `squad-alpha-runs/` — o manual é
  para o git, não para a máquina de quem escreveu.

## 1. Formato de arquivo de agente

- Frontmatter: `name`, `description` (1 parágrafo, com os **NÃO faz** e para quem encaminha),
  `tools` declarado, `model` explícito.
- Corpo, H2 nesta ordem: `## Mandato` · `## Entradas` · `## Framework Operacional` ·
  `## Barra de Qualidade` · `## Anti-Padrões` · `## Handoffs` · `## Voz`.

## 2. Roster (10)

| id | model | possui | pergunta que possui |
|---|---|---|---|
| `doc-cartografo` | sonnet | a MEDIÇÃO: inventário, contagens, o que existe | "o que existe, e quantos?" |
| `doc-redator-regras` | opus | `01-VISAO.md` (objetivo, essência, princípios, linhas vermelhas) e `02-REGRAS-DE-NEGOCIO.md` | "qual é a regra, quem decide, quem trava, por quê?" |
| `doc-redator-telas` | opus | `03-FLUXO-DE-TELAS.md` | "de onde se vem, para onde se vai, o que se vê em cada estado?" |
| `doc-redator-identidade` | opus | `04-IDENTIDADE-VISUAL.md` | "o que faz um recorte de 200px ser reconhecível como Soulmon?" |
| `doc-redator-arquitetura` | opus | `05-ARQUITETURA.md`, `07-DADOS-E-SAVE.md`, `08-INTEGRACOES-E-DEPLOY.md` | "por onde o dado passa, quem grava, onde roda?" |
| `doc-redator-referencia` | sonnet | `06-REFERENCIA/*` (todo módulo, todo export) | "o que cada função faz, e quem a chama?" |
| `doc-historiador` | sonnet | `09-HISTORICO.md`, `10-DISCUSSOES-E-DECISOES.md` | "quando mudou, por quê, e onde a discussão está registrada?" |
| `doc-verificador` | opus | o carimbo `verificado` — **bloqueante** | "isto está escrito é o que o código faz?" |
| `doc-bibliotecario` | opus | `00-MAPA.md`, `11-GLOSSARIO.md`, `12-COMO-MANTER.md`, a ligação com `00-START-HERE.md`/`CLAUDE.md` | "uma sessão nova acha isto em um salto?" |
| `doc-mantenedor` | opus | a **sincronização pós-merge** (skill `manter-docs`): `scripts/docs-delta.mjs`, `docs/manual/.sincronizado.json`, o despacho dos redatores/verificador por delta | "o que mudou no código desde a última vez que o manual foi verdade?" |

### Agentes do repositório reusados (sem clone)

| agente | para quê |
|---|---|
| `soulmon-guarda-linha-vermelha` | parecer sobre o `01-VISAO.md` (as linhas vermelhas têm de estar nele, inteiras, sem suavizar) |
| `soulmon-screen-cartographer` | quando o `03-FLUXO-DE-TELAS.md` precisar de percurso no app rodando (Playwright) — o `doc-redator-telas` lê código; quem percorre é ele |
| `qa-sweeper` | os três portões (`tsc` · `vitest` · `build`) antes do commit |

## 3. Regras de despacho

- **Um redator, um doc.** Dois redatores nunca escrevem no mesmo arquivo na mesma rodada.
- **Todo redator recebe**: o caminho do inventário medido, o `METODO.md`, a lista de fontes
  do seu assunto (docs existentes que ele pode CITAR) e a instrução de ler o código.
- **O verificador nunca recebe o doc do redator "para revisar"** — recebe o doc e a pergunta
  "o que aqui é falso?". Devolve lista, não elogio.
- **O bibliotecário roda por último** e é o único que edita `00-MAPA.md`, `docs/00-START-HERE.md`
  e a linha do manual no `CLAUDE.md`.

## 4. Artefatos e estado

| artefato | dono | estado vive em |
|---|---|---|
| `docs/manual/*.md` | o redator nomeado no cabeçalho | o cabeçalho (`rascunho` / `verificado em` / `desatualizado desde`) |
| `scripts/docs-inventario.mjs` | `doc-cartografo` | — (é código; muda por PR) |
| `src/docsManual.contract.test.ts` | `doc-bibliotecario` | vermelho/verde |
| a linha do manual em `docs/STATUS.md` | orquestrador | o bloco datado |

## 5. Checkpoint

A rodada termina quando: todos os docs tocados têm carimbo `verificado em` da rodada; o
guard está verde; o `00-MAPA.md` lista cada doc; o `STATUS.md` tem o bloco datado da
rodada. Sem isso não há commit — e, pela regra de autonomia do `CLAUDE.md`, com isso há
PR **e merge**, sem esperar.
