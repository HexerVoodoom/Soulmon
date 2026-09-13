# Handoff — redesenho do Soulmon, Fase 1: wireframes de todas as telas

> **Dono:** `soulmon-coordenador` (orquestrador da SQUAD-DESIGN) · **Data:** 13/09/2026 ·
> **Estado:** pronto para a sessão de desenho — **as 20 decisões prévias estão respondidas em [design/DECISOES-WIREFRAME.md](design/DECISOES-WIREFRAME.md) (13/09/2026)**
> **Verificação:** `docs/design/INVENTARIO-WIREFRAMES.md` (a lista do que desenhar, com
> estado por tela) e `docs/design/PRINCIPIOS-DE-WIREFRAME.md` (o que cada família de tela
> obriga e proíbe, com procedência). O guard do manual continua valendo:
> `npx vitest run src/docsManual.contract.test.ts`.
> **Não cobre:** a Fase 2 (identidade) — ela só começa depois do checkpoint da Fase 1 e
> está descrita no §7. Não cobre código: nenhuma tela é implementada nesta fase.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este handoff.

## 0. Leia nesta ordem, e nada mais antes de desenhar

1. Este arquivo inteiro (10 minutos).
2. `docs/manual/00-MAPA.md` §1 (o protocolo de leitura) e §4, só as linhas do doc 03.
3. `docs/design/PRINCIPIOS-DE-WIREFRAME.md` — inteiro. É a pesquisa (Mobbin, estudos,
   decisões) já reduzida ao que um wireframe precisa obedecer, por família de tela, com a
   seção de origem de cada regra.
4. `docs/design/INVENTARIO-WIREFRAMES.md` — a tabela-mestra: cada tela × estado, com
   prioridade e o estado do wireframe. **Nada se desenha fora dela.**
5. `docs/manual/03-FLUXO-DE-TELAS.md` — por fluxo, na hora de desenhar aquele fluxo:
   é o que a tela FAZ hoje (chega por / sai para / condição de aparição / estados / o que se
   vê), citado do código. O texto real dos rótulos vem daqui e dos componentes.
6. `.claude/skills/squad-design/METODO.md` — as dez regras W1–W10. São o critério de aceite.

O que **não** ler antes de desenhar: `docs/manual/04-IDENTIDADE-VISUAL.md` (é Fase 2 —
ler agora contamina o wireframe com cor), o `docs/PLANO-DESIGN.md` inteiro (o §0 já está
destilado nos princípios; o resto é execução de identidade), `src/App.tsx` (6245 linhas em
09/09/2026 — `grep` acha; ler inteiro não).

## 1. O pedido, nas palavras do dono

> "Redesenhemos o app, começando por wireframes. Use o que aprendemos com o Mobbin e os
> estudos. Desenhar todas as telas do app, primeiro em wireframe, para depois aplicarmos a
> identidade."

Traduzido em entrega: **um canvas por fluxo, com um artboard por tela × estado, em cinza**,
que decide a ESTRUTURA de cada tela — o que está nela, em que ordem, respondendo a que
pergunta, com que estados — antes de qualquer cor. A identidade (que já existe, medida em
`04-IDENTIDADE-VISUAL.md`) é aplicada depois, sobre estrutura aprovada.

## 2. Por que wireframe primeiro (o que já aconteceu)

O redesenho de agosto/2026 (`docs/PLANO-DESIGN.md`) começou pela identidade e a aplicou
sobre a estrutura que já existia. O que sobrou está medido em `04-IDENTIDADE-VISUAL.md`
§11 ("no ar × plano"): tokens, tipografia e "O Visor" entraram; a hierarquia de cada tela
nunca foi decidida — o kit pixel vaza para fora do visor em 28 componentes, a Home acumula
seis cartões de aviso numa fila que só existe porque ninguém desenhou o slot, e o
`03-FLUXO-DE-TELAS.md` §6 lista superfícies inalcançáveis e comentários que prometem o que a
tela não faz. Estilizar de novo sem estrutura repete o erro. Por isso: cinza primeiro.

## 3. A squad que faz isto

`/squad-design` (`.claude/skills/squad-design/`). Quem faz o quê:

| Papel | Agente | Faz |
|---|---|---|
| Orquestra | a skill `squad-design` | sequencia, briefa, gateia; não desenha |
| Mede | `soulmon-screen-cartographer` | o inventário (já feito: `INVENTARIO-WIREFRAMES.md`) |
| Cura | `design-curador-padroes` | os princípios (já feito: `PRINCIPIOS-DE-WIREFRAME.md`) |
| **Desenha** | `design-wireframer` | um canvas por fluxo, `docs/design/wireframes/<fluxo>/` |
| Opina | `soulmon-product-designer` | IA e fluxo de cada canvas antes da crítica |
| **Critica (bloqueante)** | `design-critic` | W1–W10 item a item + o que o autor não viu |
| Veta | `soulmon-guarda-linha-vermelha` | famílias que tocam perdão, recompensa, oferta, social |
| **Decide** | `soulmon-design-lead` | entra / volta / sai → `docs/design/DECISOES-WIREFRAME.md` |
| Fase 2 | `soulmon-visual-designer` | identidade sobre wireframe aprovado — não antes |

Comandos, na ordem: `/squad-design desenhar <fluxo>` → `/squad-design criticar <fluxo>` →
(corrige) → `/squad-design decidir` → checkpoint com o dono → próximo fluxo. `/squad-design
status` mostra a tabela.

## 4. O que desenhar, em que ordem

Os fluxos, na ordem de frequência de uso (W5) — a Home é vista todo dia; o Oráculo, uma vez:

| # | Fluxo | Pasta | Inclui | Prioridade |
|---|---|---|---|---|
| 1 | **Home** | `wireframes/home/` | visor do pet, HUD (corações/energia/moedas), ações (comer/carinho/banho/dormir/brincar), chat, o slot de avisos com "+N", `FirstDayCard`, `PlayCard`, `RestWindowCard`, `StepsCard` | P0 |
| 2 | **Atividades** | `wireframes/atividades/` | lista (hábitos × tarefas), `QuickAddBar`, criar/editar tarefa e hábito, foco do dia, carga do dia, `TriagePile`, `HabitConstancy`, assombrada, adiamento, someday/dropped | P0 |
| 3 | **Rituais** | `wireframes/rituais/` | `MorningCheckIn`, `DailyReportModal` + humor, `WeeklyReportCard`, fresh start, `MorningDream`, `NightmareBattle`, `BalanceWeekModal`, `ProtectProgressModal` | P0 |
| 4 | **Pet** | `wireframes/pet/` | `PetPage`, `DreamDex`, `AdventureDiary` (canvas próprio por decisão D1 de 13/09) | P0+ |
| 5 | **Onboarding — funil** | `wireframes/onboarding-funil/` | splash, `IntroScreen`, portão de identidade/e-mail (com o valor ANTES do campo, T9), free × pago, `GOAL_STEP`/`STRUGGLE_STEP`, `DEMO_PICK`, `GameTutorialFlow`, `WelcomePromptModal` | P1 |
| 6 | **Evolução** | `wireframes/evolucao/` | `EvolutionPath` (escada, cadeado, galho previsto), `EvolutionCeremony`, `EvolveTaskModal`, `RebirthModal`, `UnlockNudge` (variantes), `MilestoneCeremony` | P1 |
| 7 | **Jogos** | `wireframes/jogos/` | hub de minijogos, `DungeonGame` (andar, escada, cenário, resultado, Glitchtama), `ArenaGame`, `DinoGame`, `RPSGame`, `TournamentPage` (rodada, faixas, ranking, troféus) | P1 |
| 8 | **Loja e economia** | `wireframes/loja/` | `ShopModal` (dois segmentos, seções, item bloqueado com dica), detalhe de item, `ItemsWindow` (pastinha), missões e missões semanais, `CreditsModal`, `UnlockAccountModal`, `TinyOffer` | P1 |
| 9 | **Estatísticas e coleção** | `wireframes/estatisticas/` | `StatsPage`, `BestiaryCard`, `FormAlbum`, `MemoriesCard`, escudos visíveis como posse (T5) | P1 |
| 10 | **Social** | `wireframes/social/` | `LibraryPage` (NPCs, amigos sem escada nem rank — T7), `CoopPanel`, `PlayerDetailModal`, presentear; artboard offline (D9). Canvas próprio por decisão D2; parecer obrigatório do guarda da linha vermelha | P1 |
| 11 | **Conta e configurações** | `wireframes/conta/` | `SettingsPage`, `SettingsModal`, `AISettingsModal`, `AccountSection`, `AccountDataSection`, `NotificationManager`/priming, `InstallPrompt`, `GuideModal`, `HelpModal` | P2 |
| 12 | **Fora do app** | `wireframes/fora-do-app/` | os 5 widgets Android (com o contador "N de M" só com ≥ 1 feita — T2), o overlay Electron (faixa + menu), as notificações push (10h/16h/20h/22h/deitar/cocô) | P2 |
| 13 | **Onboarding — oráculo** | `wireframes/onboarding-oraculo/` | as 6 perguntas, a bifurcação dos 20 itens, geração, reveal **com a oferta dispensável (T1)** e sem retorno psicométrico (T8), `mode='upgrade'` | P2 (último, W5) |

A lista exata de telas × estados, com o `id` de cada artboard, está no
`INVENTARIO-WIREFRAMES.md` §1: **150 telas, 272 artboards** (45 P0 · 121 P1 · 106 P2,
medidos em 13/09/2026 com os comandos da §4 dele). A diferença para as 114 superfícies do
`INVENTARIO-TELAS.md` de 19/08/2026 é a matriz de estados que W3 exige e que nunca foi
desenhada. O que está fora (superfícies mortas ou inalcançáveis: `OraclePage`,
`PixelizerCard`, o atalho de dono sem chamador, a aba Missões, as frases de cobrança do
widget) está no §3.1 — não desenhe o que o código não alcança.

**As 11 dúvidas do `INVENTARIO-WIREFRAMES.md` §3.2 e as 9 tensões do
`PRINCIPIOS-DE-WIREFRAME.md` §14 já foram respondidas pelo dono em 13/09/2026** — a tabela
completa está em [design/DECISOES-WIREFRAME.md](design/DECISOES-WIREFRAME.md). Resumo do que
muda o desenho: Pet e Social viram canvases próprios; Onboarding parte em funil (5º) e
oráculo (último); ramos de save antigo e a loja-sheet ficam `fora`; as seis superfícies sem
descrição foram medidas no código (03-FLUXO §4); `reduced-motion` só onde a estrutura muda;
**inglês é a língua do artboard**; carga do dia no check-in e no topo da lista; offline nas
quatro superfícies de rede; e cinco decisões de produto reabertas (oferta no reveal,
contador no widget, live-ops que não tira, card mensal, escudos visíveis).

## 5. Como desenhar (o formato)

- **Ferramenta:** a skill `design` (canvas de artboards, publicado como Artifact). Um canvas
  por fluxo. Arquivos de trabalho commitados em `docs/design/wireframes/<fluxo>/`:
  `Main.dc.html` (a primeira tela do fluxo), um `<TelaEstado>.dc.html` por tela × estado
  (stem em CamelCase: `HomeVazio.dc.html`, `AtivTriagem.dc.html`), e `canvas.json` com
  frames **390×844**, ≥80 px entre colunas e ≥120 px entre linhas; `pages` por sub-fluxo
  quando passar de ~12 artboards. O `.html` semeado que se publica **não** é commitado.
- **Cinza (W1):** texto `#111`, secundário `#666`, caixas `#ddd`, bordas `#999`. Sem cor de
  marca, sem fonte de marca (system-ui), sem sprite — no visor, um retângulo com "PET".
  Ícone = círculo com rótulo textual. Sem barra de status falsa, sem teclado falso.
- **Texto real, em inglês (W2):** rótulos e microcopy vêm do código (via `03-FLUXO` §4 e o
  componente), em **inglês** — a língua principal do produto e do wireframe (decisão D8,
  13/09/2026). PT-BR vai como nota `PT: …` no rodapé; artboard extra só onde o comprimento
  muda a caixa (a barra inferior, botões de largura fixa — é o caso medido de "ATIVIDADES"
  em 61px numa caixa de 54px). Texto proposto leva a marca `[novo]`. Nunca lorem.
- **Rodapé fixo em todo artboard:** **Pergunta** (a única que a tela responde, W4) ·
  **Chega por / Sai para** (do `03`) · **Sai da tela atual** (o que o wireframe remove, com
  motivo — W9) · **Fontes** (as seções dos princípios e as regras do `02` usadas — W8).
- **Todo estado (W3):** vazio · carregando · erro · primeira vez · demo × pago · travado
  quando existir. Se dois estados diferem só por um cartão, um artboard com os dois lado a
  lado é aceitável; se diferem em estrutura, dois artboards.
- **Toque 44 px, rótulo em toda ação, ordem de foco anotada (W10).**
- **Nada cobra (W6):** sem vermelho de alerta, contagem regressiva, imperativo, percentual
  cru, "faltam N". Se a tela atual tem, o wireframe tira e o rodapé diz por quê.

## 6. Aceite de um fluxo (o que o `design-critic` confere)

Um fluxo está pronto quando, para CADA artboard: W1–W10 passam item a item; a pergunta do
rodapé é uma só; todo estado do inventário existe; o que sai está nomeado; toda escolha
estrutural tem fonte. O `soulmon-product-designer` dá parecer de IA/fluxo (time-to-value,
hierarquia) e o `soulmon-guarda-linha-vermelha` veta onde tocar perdão/recompensa/oferta/
social. O `soulmon-design-lead` escreve a decisão (entra/volta/sai) e o **dono do produto
fecha o checkpoint** olhando o canvas e a decisão — a squad não apresenta opções soltas;
apresenta uma recomendação com o que perdeu e por quê.

## 7. Fase 2 — identidade (só depois do checkpoint da Fase 1)

Não é este handoff, mas fica combinado: o `soulmon-visual-designer` aplica sobre os
wireframes aprovados **a identidade que já existe** — os tokens `--sm2-*`, a tipografia
(Silkscreen só dentro do visor, Fredoka títulos, Rubik texto), Material Symbols Rounded,
"O Visor" como fronteira diegética — tudo medido em `04-IDENTIDADE-VISUAL.md`, sem
reinventar. Aceite: recorte 200×200 reconhecível como Soulmon (`PLANO-DESIGN.md` §0 item 8)
e contraste AA nos dois temas (`src/styles/tokens.contrast.test.ts`). Só então
`staff-frontend` implementa, tela a tela, com os footguns 1/5/6/10 do `CLAUDE.md`.

## 8. Regras que não se reabrem nesta fase

- A direção de arte "O Visor" (pixel dentro, limpo fora) — decidida pelo dono; a Fase 1 não
  a discute porque não usa cor, e a Fase 2 a aplica.
- As 21 linhas vermelhas (`01-VISAO.md` §7) e as decisões do `REGISTRO-DE-DECISOES.md` —
  **com as cinco reaberturas de 13/09/2026 já registradas lá (§13)**: oferta no reveal,
  contador no widget, live-ops rotativo que não tira, card mensal, escudos visíveis. O
  wireframe desenha essas cinco como decisão NOVA e marca `[decisão 13/09]`; tudo o mais
  segue o registro. Tensão nova que apareça no desenho vai para o rodapé e para o dono.
- Regras de jogo: o wireframe mostra a regra como ela É (`02-REGRAS-DE-NEGOCIO.md`); mudar
  regra é outro fluxo (`/implementar-wp`).

## 9. Fechamento de cada sessão de desenho

Pelo protocolo do coordenador (`/soulmon fechar`): commit dos `.dc.html` + `canvas.json` +
inventário atualizado (`desenhado` / `criticado` / `aprovado`, com o link do canvas) +
`DECISOES-WIREFRAME.md`; bloco datado no `docs/STATUS.md`; PR + merge ff-only na `main`;
`/manter-docs auto` (o `00-MAPA.md` precisa citar todo `.md` novo em `docs/design/` — o
guard fica vermelho se não citar).

## 10. Checklist da primeira sessão de desenho

- [ ] `/soulmon start` (o hook já pede) → o coordenador roteia para `/squad-design`.
- [ ] `/squad-design status` — confirma inventário e princípios presentes.
- [ ] `/squad-design desenhar home` → `criticar home` → corrigir → `decidir` → checkpoint.
- [ ] Repetir para `atividades` e `rituais` (os P0). Só então os P1.
- [ ] `/soulmon fechar`.
