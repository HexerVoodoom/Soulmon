# Handoff — redesenho do Soulmon, Fase 2: identidade sobre os wireframes aprovados

> **Dono:** `soulmon-coordenador` (orquestrador da SQUAD-DESIGN) · **Data:** 15/09/2026 ·
> **Estado:** plano validado com o dono em 15/09/2026 (quatro escolhas, §2) — pronto para
> `/squad-design identidade sistema`.
> **Pré-requisito cumprido:** a Fase 1 fechou os 13 canvases (268 linhas `aprovado` + 5 `fora`
> = 273 no `design/INVENTARIO-WIREFRAMES.md`; `design/DECISOES-WIREFRAME.md` §5–§17;
> `REGISTRO-DE-DECISOES.md` 13.1–13.19).
> **Não cobre:** código. Nenhuma tela é implementada nesta fase — o `staff-frontend` entra depois,
> tela a tela, com os canvases de identidade como spec.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este handoff.

## 0. Leia nesta ordem

1. Este arquivo.
2. `docs/manual/04-IDENTIDADE-VISUAL.md` — inteiro. É a identidade **que já existe**, medida:
   §1 a tese "O Visor", §2.8 os 50 tokens `--sm2-*`, §4 tipografia, §5 ícones, §6 movimento,
   §11 o que está no ar × o que o plano prometeu.
3. `src/styles/tokens.md` e `src/styles/tokens.contrast.test.ts` — o contrato dos tokens e a
   régua de AA nos dois temas.
4. O wireframe do fluxo (`docs/design/wireframes/<fluxo>/`) e a sua seção em
   `design/DECISOES-WIREFRAME.md` — a estrutura aprovada, que **não se reabre**.
5. `.claude/skills/squad-design/METODO.md` › "Fase 2 · Identidade" — o aceite.

O que **não** ler: `brand/design-system.md` (é de OUTRO produto — `04` §12);
`docs/PLANO-DESIGN.md` além do §0 (o resto virou o `04` §11).

## 1. O que a Fase 2 é — e o que não é

- **É:** o `soulmon-visual-designer` aplica sobre cada wireframe `aprovado` a identidade
  medida no `04`: os tokens `--sm2-*` (ciano como única luz forte, cobre, petróleo; **tinta ≠
  fill**, texto sobre fill usa `--sm2-on-<acento>`), Fredoka nos títulos, Rubik no texto e nos
  dados (`tabular-nums`), **Silkscreen só dentro do visor** (≥ 14px, caixa alta, nunca frase
  inteira), Material Symbols Rounded (`FILL` 0→1 como estado, ícone **nunca** em box),
  movimento 120/200/320 ms fora do visor e `steps()` dentro, `prefers-reduced-motion`.
- **É:** "O Visor" como fronteira diegética — pixel art **só** dentro do visor (sprite, cenário,
  decoração, FX); tudo fora é o aparelho, em vetor limpo.
- **Não é:** reabrir estrutura. Cada artboard de identidade é o wireframe correspondente com a
  identidade aplicada — mesma hierarquia, mesmos estados, mesma copy, mesma ordem de foco.
  Estrutura que "pedir" para mudar volta como achado para o lead, não muda no canvas.
- **Não é:** token novo. Os 50 `--sm2-*` bastam; se um fluxo precisar de um que não existe,
  vira `[pendente do dono]` com o par claro/escuro proposto e a régua de AA.
- **Não é:** reinventar direção de arte. "O Visor" foi decidido pelo dono (`PLANO-DESIGN.md`
  §0 item 1) e não se reabre.

## 2. As quatro escolhas do dono (15/09/2026)

| # | Pergunta | Decisão | O que perde |
|---|---|---|---|
| 1 | Entregável | **Canvas de identidade primeiro; código depois** — um canvas por fluxo, ao lado do wireframe (`docs/design/wireframes/<fluxo>/identidade/`) | Um passo antes de ver no celular |
| 2 | Sistema antes de tela | **Sim** — o primeiro canvas é "Sistema": tokens, tipografia, os átomos (botão nas três variantes, card, chip, folha/`ModalSheet`, `BottomNav`, o Visor, campo, switch, estados de foco), no escuro e no claro | Um checkpoint a mais antes da primeira tela real |
| 3 | Temas | **Escuro em todos os artboards (o Soulmon é noturno); o claro só no `Main` de cada fluxo**, para provar o AA visualmente | Estados secundários sem versão clara desenhada (o token garante) |
| 4 | Checkpoint | **Do dono, por canvas** — modal por fluxo, com o recorte 200×200 | Ritmo: 14 modais |

## 3. Ordem

`Sistema` → Home → Atividades → Rituais → Pet → Onboarding-funil → Evolução → Jogos → Loja →
Estatísticas → Social → Conta → Fora do app → Onboarding-oráculo (a ordem de frequência da
Fase 1, W5).

## 4. O ciclo por canvas

1. `/squad-design identidade <fluxo>` — `soulmon-visual-designer` produz o canvas
   (`Main.dc.html` + `<TelaEstado>.dc.html` + `canvas.json`; artboards 390×844; **cada artboard
   leva o id da linha do inventário e o nome do artboard do wireframe que replica**; rodapé com
   os tokens usados e as divergências com o código de hoje).
2. Crítica: `design-critic` (bloqueante — AA nos dois temas por token, a tese do Visor, ícone
   fora de box, ≥ 14px na Silkscreen, alvos ≥ 44px, fidelidade ao wireframe: nada estrutural
   mudou) ∥ `soulmon-product-designer` (a hierarquia visual serve à pergunta da tela?);
   `soulmon-guarda-linha-vermelha` onde a cor tocar oferta/recompensa/punição (vermelho de
   alerta, badge, medidor vazio acusando — o app **nunca cobra**).
3. `soulmon-design-lead` decide (entra/volta/sai) em `design/DECISOES-WIREFRAME.md` §18+, uma
   seção por canvas de identidade.
4. Checkpoint com o dono: o canvas + a decisão + **o recorte 200×200 de um artboard** ("dá para
   dizer que é o Soulmon?").
5. Fechar (`/soulmon fechar`): inventário — a tabela dos canvases ganha o link do canvas de
   identidade e a linha do fluxo passa a `identidade`; bloco no `STATUS.md`; PR + merge ff-only;
   `/manter-docs auto`.

## 5. Aceite

- **Recorte 200×200 sem logo, reconhecível como Soulmon** (`PLANO-DESIGN.md` §0 item 8;
  `04` §11.1 item 8: critério humano, sem régua — é o dono quem responde no checkpoint).
- **Contraste AA nos dois temas**, por token (`src/styles/tokens.contrast.test.ts`); todo texto
  funcional ≥ 12px; Silkscreen ≥ 14px; alvo ≥ 44px.
- **Fidelidade ao wireframe aprovado**: o `design-critic` compara artboard a artboard.

## 6. O que o código de hoje diverge da tese — e o canvas desenha a tese

Medido no `04` §1 e §11 (09/09/2026): pixel FORA do visor em 28 `.tsx` (`.sm-px-*`, 82
classes); o rótulo da `BottomNav` em Silkscreen a 12px (abaixo do piso de 14px); `lucide-react`
em 8 arquivos; `ArenaGame.tsx` e `OraclePage.tsx` ainda no bundle; nenhum token de espaço
(grid de 4px é literal). O canvas de identidade **desenha a tese** ("O Visor") e registra cada
divergência no rodapé como achado para o `staff-frontend` — não desenha o kit pixel antigo.

## 7. Regras que não se reabrem

- "O Visor" (pixel dentro, limpo fora) — decidida pelo dono.
- As 21 linhas vermelhas (`01-VISAO.md` §7) e o `REGISTRO-DE-DECISOES.md` §13 (13.1–13.19).
- As regras visuais do dono medidas no `04` §11.1 item 7: ícone nunca em box · sublinhado
  ciano na nav · `.sm-pet-sticky` · `index.css` único CSS · não reintroduzir
  `--foreground`/`--background`.
- A estrutura aprovada na Fase 1 (`DECISOES-WIREFRAME.md` §5–§17).
