# Método SQUAD-DESIGN — do wireframe à identidade, sem pular o wireframe

## Por que duas fases, nesta ordem

O redesenho anterior (agosto/2026, `docs/PLANO-DESIGN.md`) começou pela **identidade**
(tokens, tipografia, "O Visor") e a aplicou tela a tela sobre a estrutura que já existia.
O resultado está medido no `docs/manual/04-IDENTIDADE-VISUAL.md` §11 ("no ar × plano"): a
identidade entrou, a **estrutura** das telas não foi decidida — 28 `.tsx` usam o kit pixel
fora do visor, o `App.tsx` tem 6245 linhas de composição ad hoc, e o `03-FLUXO-DE-TELAS.md`
lista 40 superfícies cuja hierarquia ninguém desenhou antes de estilizar.

Por isso a Fase 1 é **wireframe**: estrutura, hierarquia, estados, navegação — em cinza,
sem cor, sem fonte, sem pixel art. A Fase 2 aplica a identidade (que já existe e está
medida) sobre uma estrutura decidida. Wireframe não é rascunho da tela bonita; é a decisão
de **o que está na tela, em que ordem e por quê** — e ela é verificável contra as regras.

## As dez regras do wireframe (W1–W10)

| # | Regra | Fonte |
|---|---|---|
| **W1** | **Cinza, sem identidade.** Só caixas, texto real e hierarquia. Zero cor de marca, zero fonte de marca, zero sprite (um placeholder "PET" no lugar do visor). Se dá para dizer que é o Soulmon pela cor, é mockup, não wireframe. | método |
| **W2** | **Texto real, nunca lorem.** Os rótulos, títulos e microcopy são os do código (`03-FLUXO-DE-TELAS.md`, componentes) ou propostos com marca `[novo]`. Copy é estrutura. | `docs/manual/03` |
| **W3** | **Todo estado desenhado**: vazio · carregando · erro · primeira vez · demo × pago · reduced-motion onde muda a estrutura. Um wireframe só do "caso feliz" não está pronto. | `03-FLUXO` §4 (estados) |
| **W4** | **Uma pergunta por tela.** Cada wireframe declara, no rodapé, a pergunta que o jogador responde ali ("o que faço agora?", "como está meu bicho?"). Tela com duas perguntas vira duas telas ou uma hierarquia clara. | Mobbin §15.1, `PLANO-PRODUTO` |
| **W5** | **Frequência manda na ordem**: Home e lista de tarefas primeiro; Oráculo por último. Prioridade = quantas vezes por dia a tela é vista. | `soulmon-design-lead` |
| **W6** | **Nada cobra.** Nenhum vermelho de alerta, contagem regressiva, imperativo, percentual cru de constância, "faltam N". A linguagem é convite. As 20 linhas vermelhas valem no wireframe. | `01-VISAO` §linhas vermelhas, `mobbin/linha-vermelha.md` |
| **W7** | **As duas filas são estrutura, não overlay.** Intersticiais montam UM por vez em ordem declarada; o slot de avisos mostra o primeiro e colapsa em "+N". O wireframe da Home desenha o slot. | `03-FLUXO` §3, `filaDeAvisos.contract.test.ts` |
| **W8** | **Referência com procedência.** Todo padrão importado cita o app e a seção do dossiê Mobbin (`docs/guia-experiencia/09-mobbin-dossie.md` §N) ou o estudo. "Igual ao Finch" sem seção não entra. | `docs/plano-melhorias/mobbin/*` |
| **W9** | **O que sai é nomeado.** Cada wireframe lista o que a tela atual tem e o novo não tem, com o motivo. Redesenho que só adiciona falhou. | `soulmon-design-lead` |
| **W10** | **Aceite executável onde houver.** Toque mínimo 44px, contraste não se aplica (cinza), mas ordem de foco, rótulo de toda ação e texto EN+PT são conferíveis — e o `design-critic` confere antes do checkpoint. | `CLAUDE.md` › UI, `docs/PLANO-DESIGN.md` §6 |

## Fase 1 · Wireframes

1. **Inventário** (`docs/design/INVENTARIO-WIREFRAMES.md`): toda superfície do
   `03-FLUXO-DE-TELAS.md`, com estados e prioridade. Nada se desenha fora dele.
2. **Princípios** (`docs/design/PRINCIPIOS-DE-WIREFRAME.md`): o que a pesquisa (Mobbin,
   estudos, benchmark) e as decisões registradas obrigam ou proíbem em cada família de tela.
3. **Desenho** (`design-wireframer`): um canvas por fluxo, com a skill `design`. Os
   arquivos de trabalho ficam em `docs/design/wireframes/<fluxo>/` — `Main.dc.html` (a
   primeira tela do fluxo), um `<TelaEstado>.dc.html` por tela × estado (stem em CamelCase,
   ex.: `HomeVazio.dc.html`, `AtivTriagem.dc.html`), e `canvas.json` (frames 390×844, ≥80 px
   entre colunas, ≥120 px entre linhas, `pages` por sub-fluxo quando passar de ~12
   artboards). **Os `.dc.html` e o `canvas.json` são commitados**; o `.html` semeado que
   se publica NÃO é (é gerado; ~2 MiB). O link do canvas publicado vai para o
   `INVENTARIO-WIREFRAMES.md`, na linha do fluxo. Cinza.
4. **Crítica** (`design-critic`): W1–W10 item a item, mais "o que o autor não viu".
5. **Decisão** (`soulmon-design-lead`): entra / volta / sai, com motivo, em
   `docs/design/DECISOES-WIREFRAME.md`. O dono vê o canvas e decide o checkpoint.

## Fase 2 · Identidade

Só depois do checkpoint da Fase 1. O `soulmon-visual-designer` aplica os tokens `--sm2-*`,
tipografia e "O Visor" (medidos em `04-IDENTIDADE-VISUAL.md`) sobre os wireframes
aprovados — sem reabrir estrutura. Aceite: recorte 200×200 reconhecível como Soulmon
(`PLANO-DESIGN.md` §0 item 8) + contraste AA nos dois temas (`tokens.contrast.test.ts`).

## O que conta como evidência

Padrão de mercado → seção do dossiê Mobbin ou do estudo. Regra de produto → linha do
`REGISTRO-DE-DECISOES.md` ou do `02-REGRAS-DE-NEGOCIO.md`. Estado/condição → citação do
código via `03-FLUXO-DE-TELAS.md`. "Fica melhor assim" não é evidência.
