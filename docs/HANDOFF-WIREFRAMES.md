# Handoff — redesenho do Soulmon, Fase 1: wireframes de todas as telas

> **Dono:** `soulmon-coordenador` (orquestrador da SQUAD-DESIGN) · **Data:** 13/09/2026 ·
> **Estado:** pronto para a sessão de desenho
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
| 4 | **Onboarding** | `wireframes/onboarding/` | splash, `IntroScreen`, portão de identidade/e-mail, free × pago, `GOAL_STEP`/`STRUGGLE_STEP`, `DEMO_PICK`, as 6 perguntas, a bifurcação dos 20 itens, geração, reveal, `GameTutorialFlow`, `WelcomePromptModal`, `mode='upgrade'` | P1 |
| 5 | **Evolução** | `wireframes/evolucao/` | `EvolutionPath` (escada, cadeado, galho previsto), `EvolutionCeremony`, `EvolveTaskModal`, `RebirthModal`, `UnlockNudge` (variantes), `MilestoneCeremony` | P1 |
| 6 | **Jogos** | `wireframes/jogos/` | hub de minijogos, `DungeonGame` (andar, escada, cenário, resultado, Glitchtama), `ArenaGame`, `DinoGame`, `RPSGame`, `TournamentPage` (rodada, faixas, ranking, troféus) | P1 |
| 7 | **Loja e economia** | `wireframes/loja/` | `ShopModal` (dois segmentos, seções, item bloqueado com dica), detalhe de item, `ItemsWindow` (pastinha), missões e missões semanais, `CreditsModal`, `UnlockAccountModal`, `TinyOffer` | P1 |
| 8 | **Estatísticas e coleção** | `wireframes/estatisticas/` | `StatsPage`, `BestiaryCard`, `FormAlbum`, `DreamDex`, `MemoriesCard`, `AdventureDiary`, `PetPage` | P1 |
| 9 | **Conta e configurações** | `wireframes/conta/` | `SettingsPage`, `SettingsModal`, `AISettingsModal`, `AccountSection`, `AccountDataSection`, `NotificationManager`/priming, `InstallPrompt`, `GuideModal`, `HelpModal`, `LibraryPage`, `CoopPanel`, `PlayerDetailModal` | P2 |
| 10 | **Fora do app** | `wireframes/fora-do-app/` | os 5 widgets Android, o overlay Electron (faixa + menu), as notificações push (10h/16h/20h/22h/deitar/cocô) | P2 |

A lista exata de telas × estados, com o `id` de cada artboard, está no
`INVENTARIO-WIREFRAMES.md` §1: **150 telas, 272 artboards** (45 P0 · 121 P1 · 106 P2,
medidos em 13/09/2026 com os comandos da §4 dele). A diferença para as 114 superfícies do
`INVENTARIO-TELAS.md` de 19/08/2026 é a matriz de estados que W3 exige e que nunca foi
desenhada. O que está fora (superfícies mortas ou inalcançáveis: `OraclePage`,
`PixelizerCard`, o atalho de dono sem chamador, a aba Missões, as frases de cobrança do
widget) está no §3.1 — não desenhe o que o código não alcança.

**Antes do primeiro `desenhar`, o `soulmon-design-lead` responde as 11 dúvidas do
`INVENTARIO-WIREFRAMES.md` §3.2** — quatro travam o começo: onde vive a sub-aba `pet`
(Evolução ou canvas próprio), onde vive a Biblioteca (hoje hospedada em Conta só pelo
caminho do menu), se o Onboarding parte em duas metades (funil em 4º, ritual do oráculo em
7º), e o seletor de comida (`HOME-35`, P0) sem descrição no manual — medir no código ou
desenhar como hipótese marcada. E as **9 tensões pesquisa × decisão** do
`PRINCIPIOS-DE-WIREFRAME.md` §14 (paywall no reveal, contador no widget, "FOMO saudável",
card mensal, estoque de escudo visível, prestígio visual, estágio real do amigo,
psicométrico invisível, valor antes de cadastro) **não se decidem no wireframe**: o
wireframe segue a decisão registrada e o rodapé anota a tensão para o dono.

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
- **Texto real (W2):** rótulos e microcopy vêm do código (via `03-FLUXO` §4 e o componente).
  Texto proposto leva a marca `[novo]`. Nunca lorem. EN + PT quando o rótulo é de UI (basta
  PT no artboard e a nota "EN: …" no rodapé quando diferir de forma que importe).
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
- As 21 linhas vermelhas (`01-VISAO.md` §7) e as decisões do `REGISTRO-DE-DECISOES.md`.
  Onde a pesquisa contradiz uma decisão, os princípios registram a tensão; quem decide é o
  dono, não o wireframe.
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
