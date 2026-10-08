# Fluxo de telas do Soulmon

> **Dono:** doc-redator-telas · **Data:** 07/10/2026 (sincronização `e3d55bb8..e71061b8`, Combate v3 PR1–PR18, prédios, missões, avatar: o menu sanduíche saiu (Configurações pelo avatar, Créditos pela SettingsPage)); anterior: 01/10/2026 (delta `bcfe7ca6..e3d55bb8`, rodada 3 de arte: Corrida com obstáculos, Honra, cenas da masmorra, fundos/lotes/NPCs, mini-visores); anterior: 30/09/2026 (delta `cfe27cc7..3532ccf5`: §1.3 a Exploração ganha o lote Passeio (folha `PasseioSheet`) e o marcador 🎒 no palco); anterior: 30/09/2026 (sincronização `8e6d0d9a..ae366480`: §1.3 mapa interno (ícone de mapa, fundo full screen, topo escondido, NPC 1,4×); §4.23 painel de GM); anterior: 28/09/2026 (sincronização do delta `1d9e278d..8110efc5`: §1.3 — `AreaScene` perdeu o NPC anfitrião fixo do rodapé, que passou a morar dentro da `AreaSheet`, por sub-loja (`lotNpcArt`), com a folha em altura fixa 2/3 da tela); anterior: 27/09/2026 (sincronização do delta `78ef5367..c510c7e4`, correções pós-F3 da minimal-ui: §1.1 o voltar físico do Android sai do `App.tsx` para `utils/androidBack.ts` (minimiza, não fecha), §1.2 `CornerLink icon="mapa"` e o saldo do Mapa no canto inferior direito em pílulas `chip-moeda`, §4.2 ⚰️ o deck de CINCO ações (não existe desde a F2) e no lugar dele OS TRÊS CUIDADOS (`sm3-cuidar`) com a arte em pixel; anterior: 24/09/2026 (fechamento F6 da minimal-ui: §1 reescrito para Home + Mapa + 6 áreas — `navigation.ts`, `goTo`/`goBack`/`viewBack`, `HomeMenuSheet`, `AreaView`; lápides ⚰️ em §4.2b `ItemsWindow`, §4.4 `ActivitiesPage`, §4.6 `ShopModal`; §4.1/§4.9/§4.10/§4.13/§4.14/§4.15/§4.22/§4.23a e a tabela do §6 com o caminho novo; conferido contra o fonte, sem passar pelo doc-verificador); anterior: 22/09/2026 (5ª sincronização do dia, delta `89554b5d..c7bca6d`: a linha `FAVORITE_STEP` da tabela de passos do ritual virou ⚰️ e ganhou o parágrafo do degrau pulado nos dois sentidos (e do rascunho antigo desviado); anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: §4.5 marcar feito abre 5 s de "Desfazer" (os dois handlers, inclusive a última etapa) e §4.25 ganhou a linha do `UndoToast` entre as superfícies globais (#57); anterior: 2ª sincronização do dia, delta `a6c1cd8a..592e2c14`, QA Rodada 2: §2.1 gate `; wv)`, §2.3 portão com lápide ANTES do onboarding + região viva + `OfflineSeal`, §2.4 falha de IA com nome e hint que fica, §3.2 banner de termos em posição 1 na primeira vez, §4.2 fallback do sprite e falas do fallback, §4.17 âncora visível, §4.23 Termos na Ajuda e `#en`, §4.25 selo nas telas pré-Home))) · **Estado:** verificado em 01/10/2026 por doc-verificador (delta `bcfe7ca6..e3d55bb8` — só as passagens tocadas, conferidas contra o fonte em `e3d55bb8`: §1.3 (`assets/soulmon/areas/index.ts`, `npcs/index.ts` › `LOT_NPC_ART`/`FUNCTION_NPC_ART`/`EXTRA_NPC_ART`, `areaNpcVoice.ts`, `AreaView.tsx`), §4.2 (`CompanionHUD.tsx` › `UI_ICON_ART.mochila`, `PixelIcon name="acordar"`), §4.14 (`DinoGame.tsx` › `OBSTACLE_TIERS`, `visorScenes.ts`, jogos da Mente/Refúgio, `dungeonScenes.ts`), §4.15 (`TournamentPage.tsx` › `TierMark`, `currencies.ts` › `name` Honra, `dueloArt.ts`), §4.26 (`FeiraVisor.tsx`, `fairArt.ts`), Honra em `MercadoSheets`/`ShopShelf`/`MapPage`/`GmPanel`/`HelpModal`/`RebirthModal`; a contagem "53 telas" é do commit, não remedida); anterior: verificado em 28/09/2026 por doc-verificador (delta `1d9e278d..8110efc5` — §1.3 conferido contra `src/components/nav/AreaScene.tsx` (sem bloco `data-area-npc`, sem import de `areaNpcVoice`/`AREA_NPC_ART`) e `src/components/nav/AreaSheet.tsx` (`height: '66.6667dvh'`, `data-area-sheet-npc-zone` com `flex: '0 0 50%'`, props `lotId`/`language`) e `src/assets/soulmon/npcs/index.ts` (`lotNpcArt`, `LOT_NPC_ART`, `PLACEHOLDER_NPC_ART`)); anterior: verificado em 27/09/2026 por doc-verificador (delta `78ef5367..c510c7e4` — §1.1 contra `src/utils/androidBack.ts` (`Capacitor.isNativePlatform`, `App.minimizeApp`/`exitApp`) e `src/App.tsx`; §1.2 contra `CornerLink.tsx` (`icon: 'mapa' | 'home'`) e `MapPage.tsx` (`zIndex: 2`, `bottom`, `border-image`); §4.2 contra `CompanionHUD.tsx` (`sm3-cuidar`, `data-cuidado`, `sm3-cuidado-inerte`, `aria-pressed`) e `grep -c 'sm2-deck"'` → 0; alvo de 44 medido em `.sm3-cuidado` do `index.css`); anterior: verificado em 24/09/2026 por doc-verificador (HEAD `78ef5367` — §3.2 slot `'incubacao'` (`incubandoAgora`, `isIncubating`, `Icon egg`, copy) e §4.10 `evoluiNoToque`/`incubating`/`fraseProgresso`/`rotuloDoVisor` conferidos em `App.tsx` e `EvolutionPath.tsx`; §1 e amostra de §4.1/§4.9/§4.13–§4.15/§4.22/§4.23a/§6 contra `navigation.ts`, `goTo`/`goBack`/`backButton`, `HomeMenuSheet`, `CornerLink`, `AreaView`; corrigidos: fila 2 sem `incubacao` no diagrama §1.4 e §6 #9, contagem "oito"→"nove", §4.9 `pane === 'oracle'` e `OraclePage`/`PixelizerCard` alcançáveis em §4.9 e §6 #7); anterior: verificado em 22/09/2026 por doc-verificador (delta `89554b5d..c7bca6d` — `FAVORITE_STEP = 5` e `QUIZ_START = FAVORITE_STEP + 1` intactos no fonte; os dois desvios (`next()` em `FAVORITE_STEP - 1`, `back()` em `QUIZ_START`) e o inicializador de `step` conferidos em `SoulmonOnboarding.tsx`; nenhum bloco `step === FAVORITE_STEP` renderiza); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `src/components/UndoToast.tsx` e as duas chamadas de `ofereceDesfazer` no `src/App.tsx` conferidas); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — as seções acima conferidas símbolo a símbolo contra `index.html`, `SoulmonOnboarding.tsx`, `GameTutorialFlow.tsx`, `App.tsx`, `CompanionHUD.tsx`, `MorningCheckIn.tsx`, `SettingsPage.tsx`; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — §2.1 gate por plataforma (`index.html`), §2.3 aviso de conta excluída no portão (`SoulmonOnboarding.tsx` › `avisoContaExcluida`), §2.4 hint de IA, §3.2 item 7 `changed`/`region`/"Entendi", §4.23 Sobre e Ajuda conferidos símbolo a símbolo contra o fonte; anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §2.1 aviso de WebView, §3.2 item 6 `termos`, §4.23 grupo Sobre, §4.23a/§4.23b ⚰️ `SettingsModal`, §4.25 `ErrorBoundary` conferidos símbolo a símbolo; anterior: §4.23/§4.23b, delta `5ac3d351..8d318529`, som/S16 + grupo "Som" na `SettingsPage`; verificação anterior do mesmo dia: delta `dc72579e..9875477b`, 30 commits: copy da bíblia §1–§6-bis, superfície de suporte, rodada 2 da arte; verificação anterior do delta `2580b73a..dc72579e`, Fase 2, identidade "O Visor", 14 fluxos: 21/09/2026)
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — §1.3/§1.4/§3.2/§4.3/§4.4/§4.14/§4.15/§6 #9 conferidos símbolo a símbolo: `LOT_NPC_ART` = 17 lotes (medido), `AreaTopBar` `PixelIcon name="mapa"`, `PlaySheets.tsx` (`SalaoSheet`/`MenteSheet`/`RefugioSheet`, `BitsHoje`), `AreaView.tsx` (`PlayGame`, `initialGame`), fila 2 de `App.tsx` e `utils/refugio/convite.ts` (constantes), `supportLine.ts`/`SupportNote`/`ChatBox`, `TermsUpdateBanner` (`#pt`), `DUNGEON_BITS_FACTOR`/`clearBonus`, `TournamentPage`/`DuelScreen`; corrigidos: `BolhasGame` mora em `components/mente/`, `GameRow` só no Ateliê e no Refúgio); anterior: verificado em 30/09/2026 por doc-mantenedor (sem verificador independente nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — `_admin.js`, `gmTools.ts`, `corvoAdocao.ts`, `AreaTopBar.tsx`, `npcScale.ts`, `attributes.ts`; só as seções tocadas; delta `8e6d0d9a..ae366480`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/components/filaDeAvisos.contract.test.ts src/components/evolucaoManual.contract.test.ts src/components/ofertaDoisCanais.contract.test.ts src/components/upgradeReveal.contract.test.ts src/components/textoBilingue.contract.test.ts src/plugins/widgetSemCobranca.contract.test.ts src/components/SoulmonOnboarding.oraculo.render.test.tsx src/components/StatsPage.render.test.tsx src/utils/petVoice.test.ts src/narrativa.contract.test.ts` · guard do manual: `npx vitest run src/docsManual.contract.test.ts`
> **Não cobre:** aparência (cor, tipografia, espaçamento, tokens `--sm2-*`) — é do `04-IDENTIDADE-VISUAL.md`; as REGRAS que as telas aplicam (corações, meta do dia, evolução, moedas) — são do `02-REGRAS-DE-NEGOCIO.md`; a assinatura de cada componente — é de [`06-REFERENCIA/components.md`](06-REFERENCIA/components.md); percurso real com o app rodando — é do procedimento "Inventário de superfícies" de `.claude/skills/squad-design/METODO.md` (⚰️ agente `soulmon-screen-cartographer`, 21/09/2026), cuja medição de 19/08/2026 está em [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## Como ler este documento

Cada superfície é descrita por sete campos fixos:

| Campo | O que é |
|---|---|
| **Chega por** | o gesto e o SÍMBOLO que faz a transição (`setCurrentView('shop')`, `handleOpenTriage`) |
| **Sai para** | o símbolo que fecha ou navega para fora |
| **Aparece quando** | a condição **transcrita** do código, em bloco — nunca parafraseada |
| **Estados** | vazio · carregando · erro · travado · demo × pago · movimento reduzido |
| **O que se vê/faz** | as ações que a tela oferece |
| **Dono** | o arquivo do componente |
| **Régua** | o teste que trava o comportamento, ou `régua: nenhuma` |

Duas medições que este documento usa e que envelhecem — o comando está junto para
poder ser refeito. Em 09/09/2026 → em 20/09/2026 (delta `2580b73a..dc72579e`) → em
21/09/2026 (delta `dc72579e..9875477b`):

```
wc -l src/App.tsx                       → 6245 → 6100 → 6139
wc -l src/components/SoulmonOnboarding.tsx → 1979 → 2302 → 2302
grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l → 6 → 6 (conjunto diferente, ver §4.13) → 6
```

**O que o delta `dc72579e..9875477b` (21/09/2026, 30 commits) mudou NESTE
documento** — nenhuma tela nasceu nem morreu; mudaram **textos que o jogador lê**
(a copy da bíblia `docs/NARRATIVA-E-UNIVERSO.md`, régua `src/narrativa.contract.test.ts`)
e **três superfícies ganharam conteúdo novo**: a linha de suporte fixa no `ChatBox`
(§4.3), o grupo "Sobre" das Configurações (§4.23) e a frase do `not-ultra` na
Evolução (§4.10). As falas de comida cheia e teto de carinho saíram do
`CompanionHUD` para `petVoice.ts`, e dormir/acordar/borra ganharam fala (§4.2,
§4.2a, §4.2b). A rodada 2 da `squad-arte` trocou o que se vê nos mini-visores
(miniaturas na Loja §4.6, ícones-ficha no Torneio §4.15 e na Corrida com obstáculos §4.14, aura 96²
na Ficha §4.7, `sleep-z` claro sobre cenário escuro §4.2) — o que é aparência fica
no `04-IDENTIDADE-VISUAL.md`; aqui entra só o símbolo que decide o que se vê.
⚰️ `src/components/EvoTrail.tsx` continua morto — foi apagado em `7ea27825`
(delta anterior, `2580b73a..dc72579e`), não neste; as lápides de §1.4, §4.1 e
§4.10 já valem.

**O que a Fase 2 (identidade "O Visor", 16–20/09/2026) mudou NESTE documento**:
pixel só existe dentro de um vidro (`Viewport`/`MiniGlass`/`GameVisor`); tudo o
resto virou vetor sobre tokens `--sm2-*` e ícones Material Symbols. Isso é
assunto do `04-IDENTIDADE-VISUAL.md`. O que entra aqui é só o que mudou de
**fluxo**: passo novo no ritual grátis (`REVEAL_DEMO`, §2.3), o Brincar que saiu
do card e virou célula do deck (§4.2, §4.14), a trilha `EvoTrail` que morreu
(§1.4, §4.1, §4.10), a lista do dia que ganhou dono (`DailyRituals`, §4.1), o
`EditModal` que deixou de criar (§4.5, §4.13), o toque no visor da Evolução que
evolui (§4.10), a cerimônia como `role="dialog"` (§4.11), `hideMetrics` chegando à
`StatsPage` (§4.8), a escada do widget em inglês e o contador que some no zero
(§5.1) e o overlay com ícones em vez de emoji (§5.2). Fonte de decisão por
fluxo: `docs/design/DECISOES-WIREFRAME.md` §18–§31.

A medição por percurso real mais recente é de **19/08/2026**
([`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md), 114 superfícies contadas). O que
mudou depois dela está medido aqui no código e marcado com a data.

---

## 1. Mapa de navegação

> **Reescrito em 24/09/2026 (minimal-ui F6).** A navegação de 5 abas
> (`BottomNav` + `ActivitiesPage` + `ShopModal` como página) saiu nas fatias
> F1–F5 da minimal-ui (`docs/design/minimal-ui/`, PRs das fatias F1–F5). O que
> segue descreve a navegação **Home + Mapa + 6 áreas**. As seções de §4 que
> ainda citam `currentView === '<aba>'` descrevem o CONTEÚDO da tela, que
> continua o mesmo; o caminho até ela é o desta seção.

### 1.1 O estado que decide a tela

Não existe roteador. A tela vem de **um** estado no `src/App.tsx`, com o tipo
definido em `src/navigation.ts`:

```ts
export const AREAS = ['mercado', 'jogos', 'arena', 'exploracao', 'laboratorio', 'hall'] as const;
export const MENU_PAGES = ['settings', 'oracle', 'stats'] as const;
export type ViewType = 'home' | 'map' | `area:${AreaId}` | `page:${MenuPageId}`;
const [currentView, setCurrentView] = useState<ViewType>('home');
```

Toda troca passa por `goTo(v)` (empilha no `history`; área → área substitui) e
todo voltar por `goBack()`. O grafo do voltar é **uma** função pura,
`viewBack` (`navigation.ts`): área → Mapa → Home; página do menu → Home; Home →
`null` (o voltar é do sistema). O mesmo grafo serve ao voltar da tela
(`AreaTopBar`), ao voltar do navegador (`popstate`) e ao botão físico do
Android. ⚠️ Até 24/09/2026 o plugin do Android era **procurado em tempo de
execução** (`window.Capacitor.Plugins.App`) porque `@capacitor/app` não estava
instalado, e na Home ele chamava `exitApp` — FECHAR o app onde o Android manda
apenas mandar a tarefa para trás. Hoje o pacote é dependência de verdade e o
dono da fiação é `src/utils/androidBack.ts` (`registerAndroidBack`): mesmo
grafo, e na Home `App.minimizeApp()` (com `exitApp()` só se o minimizar
falhar), porque registrar o listener DESLIGA o padrão do Capacitor e sem esse
ramo o voltar na Home travaria o app. Só registra em plataforma nativa
(`Capacitor.isNativePlatform()`) — na web/PWA fica o `popstate`. Réguas:
`src/components/nav/nav.render.test.tsx` e `src/utils/androidBack.test.ts`.

Antes de `currentView` chegar a decidir qualquer coisa, o `App` tem **quatro portões
de tela cheia**, nesta ordem literal (`src/App.tsx`, `showIntro` →
`hasCompletedOnboarding` → `hasCompletedTutorial` → `upgradeRitual`):

```
showIntro            → <IntroScreen>            (retorna, nada mais renderiza)
!hasCompletedOnboarding → <SoulmonOnboarding>   (retorna)
!hasCompletedTutorial   → <GameTutorialFlow>    (retorna)
upgradeRitual           → <SoulmonOnboarding mode="upgrade">  (retorna)
```

### 1.2 Home, Mapa e o menu ícone

- **Home** (`'home'`): um único link para o Mapa, `CornerLink icon="mapa"` no
  canto **SUPERIOR direito** ("Mapa"/"Map"; B2, 02/10/2026 — era o inferior). O header (`HomeHud`) é `[avatar do usuário] [nome do Soulmon] [Mapa]`: desde 07/10/2026 (Tarefa C) o botão de avatar (`ProfileAvatarButton`: foto NPC + moldura) abre `page:settings` e ⚰️ substituiu o sanduíche/`HomeMenuSheet`, cujas linhas viraram: Configurações (`page:settings`, a própria porta), Guia e Créditos em Configurações › Ajuda, Oráculo e "Refazer o ritual" ocultos (`MENU_SHOWS_RITUAL_TOOLS`, em `SettingsPage`); Configurações › Perfil › Editar perfil abre o `ProfileEditor`; a Home mostra só o NOME do Soulmon (B1) — o título do Vínculo ("Companheiro") não é desenhado nela:
  Configurações (`page:settings`), Oráculo (`page:oracle`, oculto), Guia
  (`GuideModal`), Créditos (`CreditsModal`, só se a prop existir) e "Refazer o
  ritual" (só se a prop existir). ⚠️ **Estatísticas saiu do menu em 02/10/2026
  (G2)**: moram só no Laboratório, no lote Santuário do Vínculo (ex-Observatório) (`labTab` `stats`).
- **Mapa** (`'map'`, `src/components/nav/MapPage.tsx`): cena isométrica com as
  6 construções (cada uma um `<button>` que chama `goTo(areaView(id))`), o
  saldo das 3 moedas no canto inferior **direito** (⚠️ ficava no topo até
  24/09/2026, e a arte do "Jogos" pintava por cima dele; hoje `zIndex` 2, e é
  o espelho do link da Home, no esquerdo) e um único link para a Home,
  `CornerLink icon="home"` no canto **SUPERIOR esquerdo** (B2, 02/10/2026; "Início"/"Home",
  `goBack`). Cada moeda é uma **pílula** com a moldura `chip-moeda` do squad
  de arte em 9-slice (`border-image`, miolo opaco) — é moldura de TEXTO, não
  de ícone, então a regra "ícone nunca dentro de box" não se aplica.
- **Páginas do menu** (`page:*`): `AreaTopBar` com "Voltar ao início"/"Back to
  home"; Configurações e Oráculo renderizam as páginas de sempre.

### 1.3 As 6 áreas

Toda área é desenhada por **um** componente, `src/components/nav/AreaView.tsx`
(lazy), sob o `AreaTopBar` ("Voltar ao mapa"/"Back to map" + título da área).
Cada uma é uma `AreaScene` (fundo + lotes/construções, sem NPC próprio) e cada
lote abre um `AreaSheet` (folha de baixo). ⚠️ **Até o PR #125 (main
`8110efc5`) o NPC anfitrião morava na `AreaScene`, fixo no rodapé da cena, e
"espiava" por cima da folha por posição absoluta com `top` negativo — hoje ele
saiu da cena e mora DENTRO da `AreaSheet`.** A folha tem altura FIXA em 2/3 da
tela (`height: '66.6667dvh'`, antes era um range `min-height:62%`/`max-height:82%`)
e reserva a metade de cima dela (= 1/3 da tela) para o NPC + balão, numa
`data-area-sheet-npc-zone` com `flex: '0 0 50%'`. A **arte** do NPC agora é
resolvida por SUB-LOJA (lote), não mais por área inteira: `lotNpcArt(areaId,
lotId)` (`src/assets/soulmon/npcs/index.ts`, tabela `LOT_NPC_ART` cobrindo os
17 lotes (medido em 30/09/2026: `jogos:salao`, `jogos:mente`, `jogos:refugio` entram no lugar de `jogos:ppt`/`exploracao:dino`); todos com busto próprio desde 30/09/2026 (leva `npcs-flare`); ⚰️ `PLACEHOLDER_NPC_ART` (a coruja-cervo e o poring) saiu do bundle). Há ainda dois mapas de bustos **sem chamada hoje** — nenhuma tela os desenha, decisão de design pendente do dono (`PERGUNTAS-DO-DONO.md`, NPC-1): `FUNCTION_NPC_ART` (seis NPCs de função: Ambra/onboarding, Iris/oráculo, Faro/conta, Sona/sono, Nuri/cuidados, Tobi/config; fala em `functionNpcVoice`) e `EXTRA_NPC_ART` (15 bustos de ofício, Scoria, Kama, Sable… Selene, Mallo, Kova; fala em `EXTRA_NPC_VOICE`). Nomes dos 17: Medra (`mercado:conquistas`), Tuska (`arena:duelo`), Fanfare (`arena:feira`), Brume (`exploracao:passeio`, ⚰️ Zeph), Tessela (`jogos:mente`), Bobbi (`jogos:refugio`), Bento (`laboratorio:pet`, ⚰️ Tico — nome de terceiro), Quill (`laboratorio:stats`), Nino (`hall:amigos`), Bastia (`hall:guilda`; era a Marla-árvore até 02/10/2026).
A **fala** (nome + linha) continua vindo de `areaNpcVoice(areaId, language)` —
ainda por ÁREA, não por sub-loja. `AreaSheet` ganhou as props `lotId?: string |
null` e `language: Language` (agora obrigatória):

**Fundos e prédios da rodada 3 (30/09–01/10/2026, arte aprovada pelo dono).** Hall e Laboratório deixaram o degradê de tokens do `AreaScene`: `AreaView` passa `background={HALL_BG}` / `{LABORATORIO_BG}` (`assets/soulmon/areas`, fundos noturnos 760×1344; as posições dos lotes em `areaSheetCopy.ts` › `LABORATORIO_LOTS`/`HALL_LOTS` seguem as clareiras medidas) e os seis lotes ganharam prédio próprio (`lote-laboratorio-*`, `lote-hall-*`; ⚰️ os empréstimos das isométricas do Mercado e de Jogos); Mercado › Conquistas ganhou a torre-treliça (`lote-mercado-conquistas`) e a Feira a tenda-cúpula (`lote-arena-feira`, ⚰️ o empréstimo `lote-loja-conquistas`, que ficou sem consumidor). Os fundos noturnos `fundos-v2` e o tom da Home v2 chegaram em 53 telas (contagem do commit `1c834193`, não remedida aqui); os cinco estágios do Bosque (`bg-guild-*`, `utils/backgrounds.ts`) viraram arte pintada 1200×648 — `GroveVisor`, `GroveMilestoneCeremony` e a prateleira `GuildOwnedShelf` desenham `url(...) center bottom` em vez do degradê — e a campina e as cavernas ganharam o postal que faltava no Passeio (`bgId` deixou de ser `null`). O vidro da Feira é a cena pintada `visor-feira`. O `RebirthModal` abre com o ovo da cerimônia (`OVO_RENASCIMENTO`, `data-rebirth-egg`, 128 px) e diz "Bits, Honra, Créditos" no que não se perde. As formas de linha por galho (`utils/lineFullArt.ts`, `LINE_FULL_ART`, 29 + 40 da rodada 3) e o corpo inteiro do Arauto estão instalados, mas `lineFullArt` está **sem consumidor** (a Masmorra usa só 4 sprites por linha, `DUNGEON_LINE_SPRITES`); os postais das Travessias são 48 PNGs `adv-trv-*` (`utils/adventureArt.ts`).

**Reforma dos lotes + o Soulsmith (07/10/2026, pedido do dono: "Focus, Workshop e Journal estão horríveis, o Hall muito monocromático; Market, Arena e Games são os bons exemplos").** Medido nos PNG (alfa > 20) e na cena de 390×812: nos lotes bons, **~60% dos pixels saturados dos prédios são quentes** (matiz 0–75°/330°+: Itens 60, Decoração 65, Duelo 59) contra o fundo frio, a largura opaca fica entre 25% e 48% da tela e os pés da mesma fila diferem ≤ 2,5 pontos. Nos ruins era o inverso: Oficina 9%, Caderno 13%, Biblioteca 12%, Amigos 18%, **Guilda 4%** de quente (teal sobre teal), Caderno com 30% de largura opaca contra 47% da Oficina e pés a 88%/91% (colados no rodapé, 3 pontos de diferença). Troca, só com arte própria que já estava no repo (`src/assets/dominios/<dom>/predios`, copiada para `assets/soulmon/areas/` porque o contrato de geometria lê só essa pasta): Oficina → `deserto-oficina` (quente 69%), Caderno → `campina-abrigo` (87%), Amigos → `campina-loja` (78%), Guilda → `luz-oficina` (52%), Mente → `akasha-oficina` (pálido, 80% ciano — aqui o ganho é o CONTRASTE com o chão de terra do cogumelo; o cogumelo antigo sumia entre os cogumelos do fundo). A Biblioteca (cassete) ficou. Escala e linha de chão (`left`/`top`/`width`, % da cena): Oficina 28/86/50 → 27/80/50 (larg. opaca 47→46%, pé 88,0→81,7%); Caderno 71/90/40 → 73/82/44 (30→39%, pé 91,2→82,8%: os dois pés agora a 1,1 ponto, eram 3,2); Mente 69/39/52 → 73/38/50 (28→38%, pé 41,2→39,9%, afastada do Salão, que ocupa 9–53% e ela 54–92%); Amigos larg. opaca 33→38%; Guilda 38→51%. O **Ferreiro** (`mercado.ferreiro`, EN "Blacksmith", PT "Ferreiro") ocupa o chão livre do meio-baixo do Mercado (50/83/50 → 46% opaca, pé a 84,2%, 63% quente) e usa `dominios/fogo/predios/lote-fogo-oficina` (lava, a oficina mais coerente de um ferreiro; arte própria pedida em `docs/ARTE-MELHORIAS-FUTURAS.md`). Abre a `EquipmentCard` (PR8b, lazy, **saiu da `StatsPage`**; nada apagado) por `AreaView`; Vínculo mínimo **2** em `BUILDING_GATES`/`_gates.js` (o mesmo da Decoração: o Vínculo 1 é a Loja de Itens e a vitrine abre com o uso); NPC Mallo (`LOT_NPC_ART`/`LOT_NPC_VOICE`, busto `npc-f-ferreiro` já no bundle). O aprimoramento de equipamento é de outra frente; marca de missão também.

**Mapa interno (29–30/09/2026, pedidos do dono).** (1) **Ícone de mapa no voltar:** o `AreaTopBar` das áreas recebe `icon='map'` (desde 30/09/2026 o ícone ILUSTRADO `PixelIcon name="mapa"` a 32px — o mesmo do `CornerLink` da Home —, ⚰️ o glifo `map` da `NavGlyphs`) — o ícone diz o DESTINO; Pet/Biblioteca/menu da Home seguem com `arrow_back` (voltam à Home), ainda pelo `NavGlyph`. (2) **Fundo full screen:** a `AreaScene` é `position: fixed; inset: 0; zIndex: 0` — o fundo pintado cobre a tela inteira, atrás do topo (safe-area) e do rodapé; lote e clareira usam a mesma caixa (a correspondência `left/top` em % não escorrega em nenhuma proporção). O topo sobe com `overScene` (tinta clara fixa `#E9F5F2` + degradê escuro sob ele, sem box no ícone) e nada rola. (3) **Topo escondido sob camada:** com folha (`AreaSheet`), jogo ou duelo abertos o `AreaView` avisa por `onLayerChange`, o `App` guarda `areaLayerOpen` e passa `covered` — o topo fica `visibility:hidden` (R1: não compete com o ✕ da camada). (4) **NPC 1,4×:** `src/components/nav/npcScale.ts` › `NPC_SCALE = 1.4` sobre o teto de largura de 46% (`NPC_MAX_WIDTH_PCT` = 64,4%); a ALTURA segue presa à zona de 1/3 da tela, então em tela baixa o ganho fica abaixo de 1,4×; o balão ficou 13px e não passa do topo em viewport baixa (R2).

| Área (`AreaId`) | Rótulo PT / EN | Lotes → o que a folha abre |
|---|---|---|
| `mercado` | Mercado / Market | Itens, Decoração, Background (abas por moeda, `MercadoSheets` + `utils/mercadoCatalog.ts`) · Conquistas |
| `jogos` | Jogos / Games | **três prédios** (30/09/2026; ⚰️ o lote único `ppt`): **Salão de Jogos** (`salao`, `SalaoSheet`: Corrida com obstáculos → `DinoGame` (⚰️ "Corrida do Dino" / "Dino Runner", renomeada em 30/09/2026 por decisão do dono; EN "Obstacle Run"; o id `dino`, a pasta `dino/` e as chaves de save não mudaram) e Pedra-papel-tesoura → `RPSGame`) · **Ateliê da Mente** (`mente`, `MenteSheet`: cinco linhas → `EcoGame`, `BolhasGame mode="foco"`, `TrocaGame`, `PicrossGame`, `RevisaoGame`, em `components/mente/`) · **Refúgio** (`refugio`, `RefugioSheet`: Respirar → `RespiracaoGame` em `components/refugio/`, Bolhas calmas → `BolhasGame mode="calma"` de `components/mente/`) — §4.14 |
| `arena` | Arena | Torneio (`TournamentPage`, com a loja de Honra — a moeda `emblems`, rótulo "Honra"/"Honor" desde 30/09/2026, `REGISTRO-DE-DECISOES.md` §17; ⚠️ reverte a D3 de 23/09/2026, que mantinha "Emblemas"; só o rótulo mudou, o campo `emblems` e `EMBLEMS_PER_WIN` ficam, e os emblemas de CONQUISTA da Ficha não mudaram de nome) · Duelo (`DueloSheet` → `ArenaGame`) · **Feira** (`GuildSheet room="feira"`, NPC Fanfare — [§4.26](#guilda-tela); ⚰️ o lote `guilda` da Arena virou a Feira) |
| `exploracao` | Exploração / Exploration | Masmorra (`MasmorraSheet` → `DungeonGame`; ⚰️ a Corrida com obstáculos (antes "do Dino") saiu para o Salão de Jogos) · **Passeio / Stroll** (`passeio`, desde `3532ccf5`, clareira da direita; NPC Brume, `exploracao:passeio`; prédio próprio — a ilha flutuante com arco de raízes, `lote-exploracao-passeio`, desde a leva `lotes-v2` de 30/09/2026; ⚰️ o placeholder da galeria de cenários e o nome Zeph): folha `PasseioSheet` (lazy) — postais das regiões abertas para escolher o destino (casa inclusa) e, se não escondidas, as Travessias (a ativa com "Fiz" / "Trocar" / "Deixar pra lá", os "Fiz" guardados, as regiões em névoa sem número) e o link "Esconder/Mostrar Travessias"; sem jogo em tela cheia. Com destino ≠ casa, a Home mostra 🎒 nas costas do pet (`CompanionHUD` › `walkingTo`, sem bloquear gesto). Regra: [02 §43](02-REGRAS-DE-NEGOCIO.md#aventura) · **Oficina do Foco** (`oficina`, clareira de baixo à esquerda; NPC Tique; folha `OficinaSheet`: timer 25/5 e 50/10 + 7 técnicas em cards com `InfoTip`) e **Caderno / Journal** (`caderno`, clareira de baixo à direita; NPC Sépia; folha `CadernoSheet`: journaling sensível, no save na nuvem do titular), desde 04/10/2026; arte e bustos provisórios. Regra: [02 §61](02-REGRAS-DE-NEGOCIO.md#oficina-foco) |
| `laboratorio` | Laboratório / Laboratory | Evolução — abas sublinhadas Evolução / Soulmon / Estatísticas (`labTab`) |
| `hall` | Hall | Biblioteca (`LibraryPage`, decisão D4) · **Salão da Guilda** (`GuildSheet room="salao"`, NPC Bastia — [§4.26](#guilda-tela)) |

**Passeio — missões do dia (04/10/2026).** O lote do Passeio leva a marca de missão
("!" = missão do dia por fazer ou em andamento; nada depois do "Fiz"). **Marcas de missão
(07/10/2026, `utils/questMarks.ts`):** o card de missões saiu da Home; todas as missões moram na
folha do ícone do canto direito, e cada local (ícone, Passeio, Torneio, Conquistas) mostra "!"
com missão disponível e "?" com missão pronta — com as duas, só o "?". **Cor (07/10/2026, dono: "Missão semanal fica com ! e ? azul"):** as marcas das missões SEMANAIS (aba Missões do Torneio, seção "Da semana") são azuis (token `--sm2-primary-ink`); Passeio e Conquistas seguem amarelas; as permanentes só acendem "?" quando prontas (nunca "!"); o ícone do canto herda o tom da marca vencedora. Dentro da folha: os destinos, e em Travessias os 3 cards do dia (postal da
região, título, área) — tocar abre o ato, a versão pequena e "Escolher esta"; escolhida, vira o
card da missão com "Fiz" e "Recuar". Depois do "Fiz": "esta noite o Soulmon viaja para
<região>" e, no relatório do dia seguinte, a historinha da viagem. O total ("Marcos de
Aventura · N") aparece discreto a partir de 1. Textos explicativos ficam atrás do `InfoTip`.

Rótulos: `areaLabel` (`navigation.ts`); lotes: `utils/areaSheetCopy.ts`
(Mercado, Arena, lote único de Laboratório/Hall) e `utils/playAreaLots.ts`
(Exploração, Jogos). Os jogos montam **por cima** da área e voltam a ela no
`onExit`. `PlayGame` (`AreaView.tsx`) = `'masmorra' | SalaoGame | MenteGame | RefugioGame`. Réguas: `areaShell.render.test.tsx`, `areaLabHall.render.test.tsx`,
`play/playArea.render.test.tsx`, `mercado/MercadoSheets.render.test.tsx`.

⚰️ **Saíram na minimal-ui**: `BottomNav.tsx` (F1), `ActivitiesPage.tsx` e
`ShopModal.tsx` (F5), a tela `ItemsWindow` (pastinha, F6 — a Mochila da Home,
`home/Mochila.tsx`, é a entrada de item desde a F2; o arquivo ficou só com os
helpers `getFoodName`/`getFoodDesc`).

### 1.4 Diagrama

```
[splash do index.html]  (estática, some no 1º frame — main.tsx)
        │
        ▼
  IntroScreen ──(onFinish)──▶ SoulmonOnboarding ──(onComplete)──▶ GameTutorialFlow ──(onComplete)──▶ app
                                    │                                        (handleCompleteTutorial)
                                    └─ mode='upgrade' (compra no meio do jogo) ──(onRevealed)──▶ app

   Home ('home') ──CornerLink mapa─▶ Mapa ('map') ──construção──▶ área ('area:<id>')
    │  ▲                               │  ▲                          │  (AreaTopBar voltar → Mapa)
    │  └──────── CornerLink home ──────┘  └──────────────────────────┘
    │                                        área ─lote─▶ AreaSheet ─▶ jogo por cima (onExit volta)
    ├── avatar ▸ page:settings (Perfil › Editar perfil; Ajuda › Créditos) (voltar → Home)
    │                               · Guia · Créditos · Refazer o ritual (modais)
    ├── FILA 1: intersticiais (um por vez, tela cheia)
    │     triage → dailyReport → checkIn → dream → nightmare → welcome
    │
    └── FILA 2: slot de avisos da Home (só o primeiro; resto vira "+N")
          firstDay → refugio → hp → incubacao → semanal → triagem → priming → recomeco → carga → termos
```

Não há mais `setCurrentView('<literal>')` espalhado: os três únicos
`setCurrentView` do `App.tsx` estão em `goTo`, `goBack` e no `popstate`
(medido em 24/09/2026 com `grep -n "setCurrentView(" src/App.tsx`).
**O Oráculo agora é alcançável** (menu da Home → `page:oracle`); a nota de §4.9
de que ele era inalcançável vale só até a F1.

---

### 1.5 Convenção de voltar e fechar (I3, 02/10/2026)

Três gestos, três lugares — valem para toda tela, folha e diálogo do app:

| Gesto | Quando | Onde | Peça |
|---|---|---|---|
| **Voltar** | sair de uma sub-tela para a anterior | seta no canto superior ESQUERDO, ACIMA do título | `BackArrow` (`arrow_back`); em folha com sub-tela, `ModalSheet onBack` |
| **Fechar** (modal/folha simples) | descartar uma folha que não encerra conteúdo significativo | MESMO lugar do voltar, ícone `close` | `BackArrow icon="close"`; já embutido em `ModalSheet` e `RitualDialog` (`closeSide="start"`, padrão), `AreaSheet` e `Mochila` |
| **Encerrar atividade** | fechar ENCERRA algo em andamento (luta, minijogo, run) | X no canto superior DIREITO | `GameHeader` (jogos) e `RitualDialog closeSide="end"` (pesadelo) |

**Minijogos e lutas (`GameHeader`, `BattleStage`).** O ✕ só vai para a DIREITA enquanto há partida em andamento (`activity`/`exitConfirm`); ocioso (lobby, carregando, erro, resultado, formulário) ele vira o ✕ do canto superior ESQUERDO (`data-game-close-start`) e, havendo `onBack`, só a seta de voltar. Quando sair PERDE progresso, `exitConfirm` abre o diálogo "Continuar / Sair" e `onPauseChange` pausa a partida (Dino, Troca, Bolhas, Masmorra e Arena pausam; o Eco e o Picross não têm relógio). Sem confirmação, por não perderem nada: Pedra-Papel-Tesoura em 0×0, Respiração (sessão de bem-estar) e Bolhas no modo calmo; a Revisão grava a cada resposta.

**Classificação das superfícies (auditoria de 04/10/2026):**

| Superfície | Classe | Como fica |
|---|---|---|
| `ModalSheet` (Guia, Glossário, Renascimento, Triagem, Edição, Criação, Ajustes de IA, créditos…) | fechar-modal | ✕ à esquerda; sem botão "Fechar/Voltar" de texto no pé (Guia, Glossário e a Pilha perderam o deles) |
| `ModalSheet onBack` (Renascimento em confirmação, aviso do catálogo) | voltar | seta à esquerda; o "Voltar/Agora não" do pé do Renascimento saiu |
| `RitualDialog` (relatório do dia, sonho, descanso, 1ª tarefa, jogador) | fechar-modal | ✕ à esquerda (`closeSide="start"`); o "Fechar" de texto do jogador saiu |
| `RitualDialog closeSide="end"` (Pesadelo) | encerrar-atividade | ✕ à direita |
| `AreaSheet`, Mochila, lightbox de fundo | fechar-modal | ✕ à esquerda |
| Minijogos e Masmorra/Arena/Duelo | encerrar-atividade | ✕ à direita + confirmação quando perde progresso |
| Lobby/erro/resultado dos jogos | fechar-modal | ✕ à esquerda (o "Voltar" de texto da Arena saiu) |
| Tutorial do primeiro jogo, ferramenta do Oráculo (dev) | voltar / fechar | seta/✕ no topo esquerdo (o "Voltar" de texto saiu) |
| Cerimônias (evolução, marco, bosque) e "Entendi" | reconhecimento | CTA primário no pé (ação, não saída) |
| Ofertas ("Agora não": check-in, Desbloquear conta, Instalar, Proteger progresso, Boas-vindas, Leitura nova) | recusa | CTA no pé — é recusa de oferta |
| "Cancelar/Salvar" (Edição, Criação, Confirmar) e "Voltar" do apagar conta | decisão | par de ações com consequência; o ✕ do topo também existe |
| Banners e cards (aviso de HP, convite do relatório, relatório da semana, busca do catálogo, remover passo) | dispensar-inline | ✕/"Fechar" no próprio card; não é modal |

O contrato `src/components/ui/voltarFechar.contract.test.ts` reprova um ✕ novo fora desta tabela e um ✕ de base à direita fora do ramo `end`.

Folhas de BASE (`ModalSheet`, `AreaSheet`, Mochila) entram SUBINDO (`translateY(100%)→0`, 260 ms, com o véu em fade de 220 ms; classes `sm2-sheet-rise`/`sm2-sheet-fade` do `index.css`). Só a entrada anima — a saída continua instantânea, para o foco devolvido do `useDialogA11y` não esperar. Movimento reduzido: aparece direto (regra no bloco canônico do `index.css`).

## 2. Primeira abertura, passo a passo

### 2.1 Splash estática do `index.html`

- **Chega por**: carregar a página. É HTML puro, pintado **antes** do bundle.
- **Sai para**: `main.tsx` a remove — `requestAnimationFrame` duplo adiciona a
  classe `done` e o `transitionend` chama `remover()`; um `window.setTimeout(remover, 1200)`
  é agendado **fora** do rAF, como rede de segurança.
- **Aparece quando**: sempre. `<div id="splash" aria-hidden="true">`.
- **Estados**: **erro de WebView** — um `<script>` inline testa
  `CSS.supports('color','oklch(0 0 0)')`, `color-mix` e, desde `42b07bec`
  (decisão #19), **`CSS.supports('selector(&)')`** — o aninhamento CSS que o
  `src/index.css` usa em mais de cem regras (`grep -c "^\s*&" src/index.css` → 101, 21/09/2026; o comentário do `index.html` diz 122) só existe a partir do Chromium 112, e um WebView
  111 passava no teste antigo e abria o app sem hover/foco/variante (pior que a
  tela branca, porque parece bug nosso); falhando, ele monta um
  aviso bilíngue ("Precisamos de uma atualização" / "An update is needed") no
  `#root` **e remove a splash**, senão o aviso ficaria por baixo dela para sempre.
  **Desde `a6c1cd8a` o aviso tem DOIS ramos por plataforma** (skeptic #4 /
  design D1–D4, QA Rodada 1): o ramo Android exige a marca de WebView no UA —
  **`/; wv\)/`** ou o UA antigo `Version/x.y … Chrome/` (desde `592e2c14`,
  `00-skeptic-r2` #5; ⚰️ `/Android/i` sozinho mandava Samsung Internet e Firefox
  no Android, que NÃO são WebView, atualizar o "Android System WebView") → corpo
  "Android System WebView desatualizado" + **dois `<a>` para a Play** (criados
  por `createElement`, 44 px de altura: "Atualizar Android System WebView" →
  `com.google.android.webview` e "Atualizar Google Chrome" →
  `com.android.chrome`); **não-Android** (iOS/Firefox/desktop) → "Seu navegador
  está desatualizado" + "Atualize o navegador (ou abra o Soulmon em outro mais
  recente)" — ⚰️ antes todo mundo recebia a instrução da Play, que não vale para
  iPhone. Os dois ramos trazem `documentElement.lang` (`pt-BR`/`en`) e um
  `mailto:` de contato (o mesmo endereço de `FEEDBACK_EMAIL` — contrato em
  `tests/indexHtmlGateWebView.test.ts`); a última linha diz "WebView: …" ou
  "Browser: …" conforme o ramo.
  **Idioma**: um segundo script troca `LOADING DATA...` por `CARREGANDO DADOS...`
  quando `navigator.language` começa com `pt`.
- **O que se vê/faz**: nada é clicável.
- **Dono**: `index.html` (`#splash`) + `src/main.tsx` (`remover`).
- **Régua**: `src/security/oldWebview.test.ts` (o aviso em vez de tela branca; ⚠️ o caso "antigo" só falha em oklch/color-mix — `selector(&)` não é exercitado sozinho), `tests/indexHtmlGateWebView.test.ts` (desde `a6c1cd8a`: os dois ramos, os dois links da Play só no Android, `lang`, o e-mail igual ao de `FeedbackLink.tsx`) e `src/security/csp.test.ts` (o hash do script mudou em `42b07bec` e de novo em `a6c1cd8a`, e a CSP em `public/_headers` acompanhou as duas vezes).

⚠️ O rAF sozinho não era rede de segurança: numa aba em segundo plano ele nunca
dispara, e o `setTimeout` agendado dentro dele também não — a splash ficava por
cima de um app já carregado. Corrigido em 27/08/2026 (comentário em `main.tsx`).

### 2.2 `IntroScreen` — o vídeo de marca

- **Chega por**: `showIntro` nasce `true` (`useState(true)`). **Tela de abertura (07/10/2026, S17):** antes do vídeo, o `IntroScreen` mostra o pôster da marca + "Tap to start"/"Toque para começar" (`role=button`, toque/Enter/Espaço); o toque inicia a música-tema por gesto real e monta o vídeo. Pulada se o jogador já interagiu (`userActivation.hasBeenActive`), o tema está desligado ou o app mudo.
- **Sai para**: `onFinish` → `setShowIntro(false)`.
- **Aparece quando**:

  ```jsx
  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }
  ```

- **Estados**: **erro** — `onError` do `<video>` liga `videoFailed` e a tela cai
  no mascote + wordmark dentro do mesmo `.sm2-splash`, com `scheduleFinish(1500)`
  (⚰️ o gradiente Tailwind e o literal `#0b0d16` saíram em `f6a0fadf`, 20/09/2026).
  **Duração**: `onLoadedMetadata` assume a duração real do vídeo; sem ela, 1500 ms.
- **O que se vê/faz**: **a superfície inteira é o alvo "Pular introdução" /
  "Skip intro"** — o `<div>` raiz recebe `role="button"`, `tabIndex={0}`,
  `aria-label={skipLabel}`, `onClick={skip}` e Enter/Espaço (`onKeyDown`); `skip`
  reagenda a saída para 400 ms. Com `videoFailed` o alvo **não** é montado
  (`const alvo = videoFailed ? {} : {…}`): a tela de erro sai sozinha em 1,5 s.
  Desde `f6a0fadf` (canvas Onboarding-funil, `DECISOES-WIREFRAME.md` §23, D-O3/X4)
  a intro é a continuação da splash do `index.html` no mesmo `.sm2-splash`.
- **Dono**: `src/components/IntroScreen.tsx`.
- **Régua**: nenhuma.

### 2.3 `SoulmonOnboarding` — o ritual

Dono: `src/components/SoulmonOnboarding.tsx`. Um único estado `step` percorre a
sequência inteira. **Os passos negativos existem para não renumerar o ritual** —
é a mesma razão declarada de `DEMO_PICK`.

| Constante | Valor | O que é | Pulável? |
|---|---|---|---|
| `IDENTITY_STEP` | −6 | portão: "Continue with Google" ou "New User" | não (é o passo inicial) |
| `GOOGLE_STEP` | −9 | aceite dos Termos + 18+ e então o pop-up do Google | volta ao portão (`back`) |
| `EMAIL_STEP` | −8 | e-mail + senha, aceite e 18+ | volta ao portão (`back`) |
| `GOAL_STEP` | −2 | "por que você quer mudar" (`soulGoal`) | **sim** — botão que limpa o campo e chama `next()` |
| `STRUGGLE_STEP` | −3 | "o que te atrapalha" (`soulStruggle`) | **sim**, idem |
| `CHOICE_STEP` | −7 | grátis × completo | não |
| `REVEAL_DEMO` | −4 | **novo em `a1181a5b` (20/09/2026)** — a leitura do caminho GRÁTIS: criatura em silhueta + descrição + oferta `UnlockNudge reason="reveal-demo"`; só renderiza com `demoReading` | é a própria escolha: "Continuar com um personagem demo" e o × "Agora não" levam os dois a `DEMO_PICK` |
| `DEMO_LOCAL_PICK` | −13 | **novo em 07/10/2026** — a escolha dos mesmos 5 iniciais, aberta pelo botão **DEMO** do portão (`IDENTITY_STEP`); escolher chama `onStartDemo(id)` e o `App` abre o jogo sem login, Vínculo 5, só no aparelho (`02-REGRAS-DE-NEGOCIO.md` §62). Código de telemetria 37 (acima de `REGISTER`). O botão só existe quando há auth configurada (sem ela o portão nem aparece) | seta de voltar → portão |
| `DEMO_PICK` | −1 | os **5** personagens iniciais (`PREMADE_CHARACTERS` em `utils/monetization.ts`: `industrial`, `nascente`, `alento`, `vida`, `meteoro` — eram 6 até 07/10/2026) | volta ao `REVEAL_DEMO` quando há `demoReading`; senão ao `CHOICE_STEP` |
| `AGE_BLOCK` | −5 | muro de idade | saída única: `restartFromAgeBlock` |
| `1` | 1 | nome completo | não |
| `2` | 2 | data de nascimento (mapa astral **e** 18+) | não |
| `3` | 3 | hora | não |
| `4` | 4 | cidade (`CityPicker`) | não |
| ⚰️ `FAVORITE_STEP` | 5 | **não renderiza mais nada** — o degrau da criatura favorita saiu em 22/09/2026 (decisão do dono: texto do jogador no prompt só depois do Renascimento). A constante **continua valendo 5** porque `utils/oracleDraft.ts` persiste o `step`, e renumerar mandaria quem retomou um rascunho para a tela errada | — |
| `QUIZ_START`..`QUIZ_END − 1` | 6..11 | as 6 de `ORACLE_QUESTIONS`, uma por página (`QUIZ_END` = 12 é o "primeiro passo pós-quiz", pelo comentário do código). **Desde `a1181a5b` o caminho grátis também passa por aqui** (`flow === 'demo'`): ao escolher a última, `setDemoReading(generateOracle({… answers: nextAnswers}))` e `setStep(REVEAL_DEMO)` em vez de `s + 1` | não (avançam sozinhas ao escolher); `back()` na 1ª com `flow === 'demo'` volta ao `CHOICE_STEP` |
| `REFINE_OFFER` | 12 | a bifurcação do teste longo | é a própria escolha |
| `DEEP_START`..`DEEP_END − 1` | 13..32 | os 20 de `SOUL_TEST_ITEMS` (`DEEP_END` = 33, que é o próprio `GENERATING`) | só quem aceitou |
| `GENERATING` | — | tela de geração — o `role="status"` é o casulo `forming` num `BirthCard`/vidro, pulsando por posição (`55d02ccc`; ⚰️ o corvo e o `Spinner` saíram) | — |
| `REVEAL` | — | `BirthCard` (nome + epíteto + batismo). **Estados do sprite**: `pending='forming'` enquanto `revealEsperando`; passado `REVEAL_WAIT_MS`, `pending='dormant'` (cristal apagado) e a frase "The drawing is still being made — it arrives on its own, later." — nunca arte de reserva | — |
| `REGISTER` | — | apelido (+ tonalidade, no demo) | — |

Os números 1..5 e 6..11 vêm das constantes derivadas
(`QUIZ_START = FAVORITE_STEP + 1`, `QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length`),
não de literais escritos à mão.

**O degrau 5 é pulado nos dois sentidos** (22/09/2026): `next()` em
`FAVORITE_STEP − 1` (a cidade) vai direto a `QUIZ_START`, e `back()` em
`QUIZ_START` volta a `FAVORITE_STEP − 1`. Cair no 5 mostraria o casco do
onboarding vazio — sem título, sem botão, sem saída. Pela mesma razão, o
inicializador de `step` desvia para `QUIZ_START` o **rascunho salvo antes de
22/09/2026** que estiver parado em `FAVORITE_STEP`.

**Aparece quando**:

```jsx
if (!hasCompletedOnboarding) {
  return <Suspense …><SoulmonOnboarding onComplete={handleCompleteOnboarding} /></Suspense>;
}
```

**O portão de conta (`IDENTITY_STEP`)**

- `next()` **não** atravessa o portão:

  ```ts
  if (step === IDENTITY_STEP || step === EMAIL_STEP || step === GOOGLE_STEP) return;
  ```

  Quem atravessa é `aposAutenticar`, que grava o e-mail, carimba o
  `ConsentRecord` e faz `setStep(GOAL_STEP)`.
- **Sem Firebase configurado o portão não tranca**: `aoContinuarSemConta` existe
  exatamente para isso, e o cabeçalho diz que "falta de configuração vira
  ausência de conta, nunca porta trancada" — mas o aceite e o 18+ continuam
  obrigatórios (`podeAutenticar`).
- **Aviso de conta excluída** (desde `a6c1cd8a`, adendo 11; **reescrito em
  `592e2c14`**, QA Rodada 2 F1/A1/A2): quando o servidor respondeu **410
  `account-deleted`** ao cloud save (a conta foi apagada neste ou em outro
  aparelho), `reagirContaExcluida` (`utils/cloudSave.ts`) guardou o local em
  `CONFLICT_BACKUP`, limpou o save, deslogou e recarregou — e o portão é para
  onde a pessoa volta. `avisoContaExcluida` é um `useState` cujo inicializador
  **lê e apaga** `STORAGE_KEYS.ACCOUNT_DELETED_NOTICE` (uma vez; não reaparece
  na abertura seguinte). **O portão também confere a lápide NO LOGIN, antes de
  qualquer passo do ritual**: `aposAutenticar(mail)` (os dois logins, senha e
  Google) chama `checarContaExcluidaNoLogin` — conta com lápide **não entra no
  "porquê"**: apaga a notice, mostra o aviso, limpa o e-mail e volta a
  `IDENTITY_STEP`. ⚰️ Na R1 a lápide só era vista DEPOIS de a pessoa criar conta
  nova sob o mesmo saveId — 410 → wipe → login → onboarding → 410, em loop, por
  30 dias (FATAL). O aviso hoje é uma `<section aria-labelledby>` com cabeçalho
  **"Conta excluída" / "Account deleted"** e a frase de `mensagemContaExcluida`
  com a data: "Esta conta foi excluída em DD/MM. O servidor libera o e-mail no
  próximo login — tente entrar de novo." (⚰️ "excluída neste ou em outro
  aparelho", sem saída para "se não foi você"). A região
  `<div aria-live="polite" aria-atomic data-account-deleted-live>` existe
  **vazia na primeira pintura** e o texto entra pós-montagem
  (`avisoAnunciado`, `setTimeout(0)`) — senão o leitor de tela não anuncia.
  Idioma por `resolveLanguage`. O `OfflineSeal` cobre o onboarding, o tutorial
  e o upgrade desde `592e2c14` (E1 — ⚰️ o portão não tinha selo; um login
  offline falhava sem dizer por quê). Régua:
  `SoulmonOnboarding.contaExcluida.render.test.tsx`.
- **Estados**: `authEmail === null` = ainda não se sabe (checagem assíncrona);
  `''` = deslogado; string = comprovado. `authOcupado` desabilita o botão, e
  `GOOGLE_SEM_RESPOSTA_MS` (120 000 ms) é a **rede de segurança**: passado o
  prazo o botão volta e uma mensagem honesta aparece, **sem cancelar a promessa
  original**. Erros vêm de `textoErroAuth`, tabelados nos dois idiomas
  (`popup-bloqueado`, `dominio-nao-autorizado`, `sem-resposta`, …).
- **Rascunho**: `readGateDraft()` (de `utils/gateDraft.ts`) devolve objetivo,
  dificuldade e aceite quando o link de e-mail levou a pessoa para fora do app e
  o `App.tsx` recarregou a página.

**Free × pago (`CHOICE_STEP`)**

```jsx
onClick={() => { setFlow('demo'); setDemoReading(null); setStep(QUIZ_START); }}   // "Começar agora — é grátis"
onClick={handleUnlockFull}                                                        // "Quero o completo — <precoLabel>"
```

⚰️ Até `a1181a5b` o grátis ia direto a `DEMO_PICK` (`setStep(DEMO_PICK)`). Hoje
responde as 6 perguntas e vê o `REVEAL_DEMO` antes de escolher o personagem
(`REGISTRO-DE-DECISOES.md` §13.19; canvas Onboarding-oráculo,
`DECISOES-WIREFRAME.md` §31). A oferta do `REVEAL_DEMO` compra pelo **mesmo**
`handleUnlockFull`; o × emite `track('unlock_dismiss', { reason: unlockReasonCode('reveal-demo') })`
e a montagem emite `unlock_view` com o mesmo motivo.

`handleUnlockFull` (mesmo arquivo) tem quatro saídas:

1. `!isBillingAvailable()` → mensagem "A compra está disponível no app Android
   (Google Play)…" e nada acontece;
2. `authUsavel && !authEmail` → recusa com "Entre com seu e-mail antes de
   comprar" (a compra manda o `saveId` como `obfuscatedAccountId`, e comprar
   antes do login amarra o recibo a um id que a conta abandona);
3. `result.ok` → `track('purchase', …)`, `setFlow('oracle')` e `setStep(1)`;
4. compra recusada → `setUnlockMessage`, com texto próprio para
   `result.reason === 'cancelled'` ("Compra cancelada.") e outro para o resto.

**O reveal**

O botão "Nascer <nome>" emite `track('reveal_seen', { has_sprite, funnel, duration })`
e então bifurca:

```ts
if (isUpgrade) onRevealed?.(result, revealSprite ?? undefined); else setStep(REGISTER);
```

`REVEAL_WAIT_MS` = 12 000 ms é o teto da espera pelo sprite; passado ele, o
reveal segue só com o texto e o desenho entra pelo acervo depois.

**`mode='upgrade'`**

- **Chega por**: `setUpgradeRitual(true)` — disparado no card da página de
  Evolução quando `gameState.accountTier === 'paid'` e ainda há
  `demoCharacterId`.
- **Aparece quando**:

  ```jsx
  if (upgradeRitual) { return <SoulmonOnboarding mode="upgrade" onComplete={handleCompleteOnboarding} onRevealed={handleUpgradeRevealed} onCancel={() => setUpgradeRitual(false)} /> }
  ```

- **O que muda**: `step` começa em `1`, `flow` já é `'oracle'`, não há portão,
  não há `CHOICE_STEP`, não há `DEMO_PICK` e não há `REGISTER`. `back()` no
  passo 1 chama `onCancel?.()` e volta ao jogo.
- **Régua**: `src/components/upgradeReveal.contract.test.ts`.

**Estados gerais do ritual**: barra de progresso (`.meter` do kit) montada sob
`(step > 0 && step <= lastStep) || step === REVEAL_DEMO` (no reveal demo ela
conta como `REVEAL`: `const progressStep = step === REVEAL_DEMO ? REVEAL : step`);
rascunho do ritual por `readOracleDraft(mode, DEEP_END - 1)` (nunca retoma na
geração ou depois); `generateError` renderiza um `role="alert"` na bifurcação.
"Continuar" inerte é por **superfície** (`aria-disabled`, fora do Tab), nunca
`disabled`/opacidade (`2b334035`).

**Régua**: `SoulmonOnboarding.portao.render.test.tsx`,
`SoulmonOnboarding.batismo.render.test.tsx`,
`SoulmonOnboarding.reveal.render.test.tsx`,
`SoulmonOnboarding.rascunho.render.test.tsx`,
`SoulmonOnboarding.copyRitual.render.test.tsx`,
`SoulmonOnboarding.funil.render.test.tsx` e
`SoulmonOnboarding.oraculo.render.test.tsx` (os dois novos na Fase 2; o ritual
grátis é atravessado nos testes por `src/test/ritualDemo`).

### 2.4 `GameTutorialFlow` — o segundo onboarding

- **Chega por**: o portão `if (!hasCompletedTutorial)`, depois do onboarding.
- **Sai para**: `onComplete(activities.slice(0, remaining))` →
  `handleCompleteTutorial`.
- **Aparece quando**: `!hasCompletedTutorial`.
- **O que se vê/faz**: `PAGES.length` = **1** tela de conceito ("Seu Soulmon
  nasceu!" / "Your Soulmon is born!") e depois `TASK_STEP` — a criação
  **obrigatória** da primeira atividade. O jogador digita o objetivo, escolhe
  áreas de vida (`CATEGORIES`, 8) e recebe sugestões da API.
- **Estados**: **erro/offline** — `fallbackTasks` devolve até 4 tarefas locais
  de dois minutos (`FALLBACK_BY_CATEGORY`); **desde `592e2c14` a falha tem
  nome** (E1, QA Rodada 2): `suggestTasksResult` distingue `offline`
  (`navigator.onLine === false` ou a requisição nem saiu) de `error` (o
  provedor não respondeu), e a tela mostra `<p role="status"
  data-ai-failure="offline|error">` — "Sem conexão agora — estas são sugestões
  locais. Com rede, toque de novo para pedir à IA." / "A IA não respondeu agora
  — estas são sugestões locais. Pode tentar de novo." (⚰️ os três casos —
  offline, erro e vazio legítimo — mostravam o mesmo "não veio sugestão"); vazio
  legítimo não mostra falha nenhuma. O hint "Este texto vai para o provedor de
  IA…" (`data-ai-hint`) **fica enquanto o botão puder ser tocado** (A10; ⚰️
  sumia depois da 1ª busca com o texto ainda saindo a cada toque); **primeira ordenação** —
  `orderCategoriesForGoal` põe na frente a área que o `soulGoal` descreveu, e
  essa ORDENAÇÃO não sai do aparelho (decisão D8). ⚠️ **Mas o campo do objetivo
  nasce pré-preenchido com o `soulGoal`** (`useState(soulGoal ?? '')`), e o que
  está no campo VAI ao provedor de IA quando a pessoa pede sugestões — a
  política dizia que o `soulGoal` não passava por IA (compliance #2, QA Rodada
  1). Desde `a6c1cd8a` o hint sob o campo diz "Este texto vai para o provedor
  de IA se você pedir sugestões." (⚰️ "Seu objetivo é enviado à IA para
  escrever as sugestões."), a tela de conceito diz "O nome da tarefa vai para o
  provedor de IA", e a política §2b declara os dois; provisório "declarar" até
  o dono decidir declarar × cortar (#42). A fronteira tem dono:
  `src/ia.camposEnviados.contract.test.ts`.
- **Dono**: `src/components/GameTutorialFlow.tsx`.
- **Régua**: `src/components/GameTutorialFlow.render.test.tsx` (desde `5513b5b6`, 20/09/2026; ⚰️ "nenhuma") e `textoBilingue.contract.test.ts` para o texto bilíngue.

⚰️ As **5 páginas de conceito** (HP, comida/energia, dia perfeito, cocô/banho/sono,
loja/moedas) **não existem mais** — quatro estavam ditas melhor no `GuideModal`, e
o assunto restante virou a constante exportada `SHOP_AND_CURRENCY_PRIMER`.

### 2.5 `FirstDayCard`

- **Chega por**: desde 07/10/2026 NÃO é mais um aviso da Home — é uma **missão**, e missão vive no menu de Missões: `MissionsSheet`, seção "Primeiro dia" (`id="first-day"`), com a marca "!" no ícone de missões da Home (`questMarks().firstDay`). Nunca na lista de tarefas.
- **Sai para**: some sozinho na virada — não tem botão de fechar.
- **Aparece quando**:

  ```jsx
  if (shouldShowFirstDay(gameState.firstDay ?? null, playerDayKey(new Date(), gameState.playerDayTz))) {
  ```

  e a regra é `src/utils/firstDay.ts` (`shouldShowFirstDay`): `false` sem
  progresso, `false` se `p.day !== today`, e `!allGesturesDone(p)`.
- **O que se vê/faz**: três gestos (`FIRST_DAY_GESTURES`) — carinho, comida,
  concluir uma atividade — cada um com uma dica. **Não dá prêmio, não abre modal
  e não cobra.**
- **Dono**: `src/components/FirstDayCard.tsx`.
- **Régua**: `src/components/filaDeAvisos.contract.test.ts` (exige que o cartão
  NÃO volte à fila, que `shouldShowFirstDay(` apareça **uma vez só** no `App` e
  que o `MissionsSheet` o monte) +
  `FirstDayCard.render.test.tsx`.

### 2.6 `WelcomePromptModal`

- **Chega por**: é o **último** da fila de intersticiais.
- **Aparece quando**: `interstitial === 'welcome'` — ou seja, **nada mais está
  aberto**. Ele decide sozinho se tem o que dizer e devolve `null` quando não
  tem, e é por isso que não dá para consultá-lo de fora.
- **Estados**: duas metades independentes. **Instalar a PWA** some com
  `Capacitor.isNativePlatform()`, com `display-mode: standalone`, com
  `PWA_INSTALL_DISMISSED` ou sem `beforeinstallprompt` (há um `setTimeout(800)`
  antes de decidir). **Notificações** exigem `notificationsUnlocked`, que o
  `App.tsx` alimenta com `jaConcluiuAlgo`:

  ```ts
  const jaConcluiuAlgo = useMemo(
    () => (gameState.completedTasks?.length ?? 0) > 0
      || (gameState.activityLog?.length ?? 0) > 0
      || Object.values(gameState.activityStats ?? {}).some(s => (s?.completionCount ?? 0) > 0),
  ```

- **Dono**: `src/components/WelcomePromptModal.tsx`.
- **Régua**: nenhuma específica; a condição de entrada está descrita no bloco da
  fila em `src/App.tsx`.

---

## 3. As duas filas

### 3.1 Fila 1 — os intersticiais (um por vez, tela cheia)

A prioridade é **uma expressão só**, no `src/App.tsx` (`const interstitial`):

```ts
const interstitial: 'welcomeTour' | 'triage' | 'dailyReport' | 'checkIn' | 'groveMilestone' | 'dream' | 'nightmare'
  | 'catalogOnboarding' | 'catalogLevelInvite' | 'welcome' =
  welcomeTourOpen ? 'welcomeTour'
    : triageTasks ? 'triage'
    : showDailyReport && gameState.lastDayReport ? 'dailyReport'
      : checkInPlanData ? 'checkIn'
        : grovePendente ? 'groveMilestone'
          : morningDream ? 'dream'
            : nightmareOpen ? 'nightmare'
              : needsCatalogOnboarding(gameState) ? 'catalogOnboarding'
                : catalogLevelInviteCandidate ? 'catalogLevelInvite'
                  : 'welcome';
```

Ordem: **tour do corvo (07/10/2026, §4.27) → triagem → relatório diário → check-in → marco do Bosque (`groveMilestone`,
Guilda, 29/09/2026) → sonho → pesadelo → onboarding do catálogo → convite de nível
do catálogo → welcome prompt**. (⚰️ esta lista omitia os dois do catálogo — ver o
`const interstitial` do `App.tsx`; a régua é `filaDeAvisos.contract.test.ts`, que
trava a ordem inteira e a posição do `groveMilestone`: depois de relatório e
check-in, ANTES do sonho — é raro e descritivo, cede a vez ao que se faz todo
dia, mas não espera o adiável.) Quem está mais abaixo continua **pendente** e monta sozinho quando o de
cima fecha — nada é descartado. A triagem vem primeiro por ser a única aberta
por TOQUE do usuário; o welcome prompt vem por último porque é o único que decide
sozinho se tem algo a dizer.

Duas superfícies **entram por gate reativo** em vez de entrar na fila:

```jsx
{protectPrompt && interstitial === 'welcome' && (   // ProtectProgressModal
<EvolveTaskModal isOpen={evolveModalStage !== null && evolutionCeremony === null} …/>
```

- **Régua**: `src/components/filaDeAvisos.contract.test.ts` — trava as duas
  strings acima, literalmente.

### 3.2 Fila 2 — o slot de avisos da Home

Uma IIFE monta o array `avisos` e **renderiza só `avisos[0]`**; o resto vira um
botão `+N` (`resto = avisos.length - 1`) que expande com `avisosAbertos`. A
ordem literal dos `push`, com a chave de cada um:

| # | `key` | Condição (do código) | Componente |
|---|---|---|---|
| ~~0~~ | ~~`'firstDay'`~~ | saiu da fila em 07/10/2026: é missão, vive no menu de Missões (§2.5) | — |
| 0b | `'refugio'` | `shouldInviteRefuge(gameState.refugeInvite, moodFor(gameState.moodLog, playerDayKey(agoraA, gameState.playerDayTz)), playerDayIso(agoraA, gameState.playerDayTz))` (`utils/refugio/convite.ts`; humor de hoje em `REFUGE_INVITE_MOODS` = 1–2, intervalo `REFUGE_INVITE_GAP_DAYS` = 3, silêncio por `REFUGE_INVITE_SILENCE_DAYS` = 7 após `REFUGE_INVITE_DISMISSALS_TO_SILENCE` = 2 recusas) — entra **depois do `firstDay` e ANTES do `hp`** (comentário do código: num dia difícil o primeiro cartão não pode ser coração perdido). Nada paga, nada conta | `RefugeInviteCard` (`data-refugio-convite`): "Um respiro?" / "A breather?"; **`onShown`** roda ao MONTAR (`handleRefugeShown` → `markRefugeShown`; escondido no "+N" não gasta a vez); "Respirar com o Soulmon" → `handleRefugeAccept` (`acceptRefugeInvite` + `setRefugeLaunch(true)`) e `goTo(areaView('jogos'))` — a área Jogos monta com `initialGame='respiracao'` (one-shot, `onInitialGameConsumed` → `handleRefugeLaunchConsumed`); "Hoje não" / "Not today" → `handleRefugeDismiss` (`dismissRefugeInvite`) |
| 1 | `'hp'` | `gameState.healthPoints <= 1 && gameState.healthPoints > 0 && dailyDone < hpSafeToday && !hpBannerDismissed` | bloco `sm2-notice-warn` inline |
| 2 | `'incubacao'` | `incubandoAgora` (`useMemo` no `App.tsx`: a forma de `evolutionTarget(...)` é diferente de `gameState.evolutionStage` **e** `isIncubating(gameState.incubation, proxima, agoraParaIncubacao)`) — WP4.29, D-G8c, incubação de 30 min na elegibilidade | bloco `sm2-notice` inline com `Icon egg` dourado: "A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você." — **sem contagem nem hora** (R-I); some sozinho |
| 3 | `'semanal'` | `needsWeeklyReport(gameState, agoraA)` | `WeeklyReportCard` |
| 4 | `'triagem'` | `triageQueue(gameState.tasks, agoraA).length > 0` | botão "Arrumar a pilha" → `handleOpenTriage` |
| 5 | `'priming'` | `mostrarPrimingDePush` (`shouldPrimePush`, `utils/pushPriming.ts`) | seção inline com "Pode sim" / "Agora não" |
| 6 | `'recomeco'` | `freshStartDismissed ? null : freshStartOffer(gameState, agoraA, language)` | bloco `sm2-notice` inline |
| 7 | `'carga'` | `isOvercommitted(plannedEffort(gameState.tasks, gameState.activities, dayKeyOf(agoraA), gameState.habitRhythms))` (`utils/taskTriage.ts`; `OVERCOMMIT_EFFORT` em `types/taskModel.ts`) — **é AVISO, NUNCA BLOQUEIO** (`CLAUDE.md` › Carga do dia); canvas Atividades D10 | `<p role="status">` inline com `Icon info` dourado: "É bastante pra um dia só — quer deixar uma pra amanhã? (Tudo bem de qualquer jeito.)". ⚰️ esta tabela omitia a linha até 21/09/2026 (QA Rodada 1, `07-growth-comportamento-r1.md` N5) |
| 8 | `'marcoBosque'` | `groveAvisoFor(grove, playerDayKey(new Date(), gameState.playerDayTz))` (`utils/groveLocal.ts`) — só NO DIA em que ESTE aparelho viu o estágio novo; na virada some sozinho (é aviso, não pendência). Atrás de `recomeco` e `carga`: é o mais adiável. Sem "não perca", sem número | bloco `sm2-notice` inline (`data-guild-marco-aviso`, ícone `eco`, texto `guild.marco.aviso`) |
| 9 | `'termos'` | `precisaAvisarTermos(gameState.consent, TERMS_VERSION, PRIVACY_VERSION, termsNoticeSeen)` (`utils/termsNotice.ts`, desde `42b07bec`, decisão #24 — só quem já consentiu a uma versão ANTERIOR; save sem registro nunca vê) | `TermsUpdateBanner changed={qualDocMudou(gameState.consent!, TERMS_VERSION, PRIVACY_VERSION)}` (`.sm2-notice`, **`role="region"` + `aria-labelledby`** desde `a6c1cd8a` — ⚰️ `role="status"`): o título diz **qual documento mudou** ("Os Termos de Uso mudaram" / "A Política de Privacidade mudou" / "Os Termos e a Política de Privacidade mudaram", por `changed`), só o link do que mudou ("Ler os Termos" / "Ler a Política", em aba nova, com "(abre em nova aba)" no nome acessível; EN aponta para a página sem âncora e PT para `#pt` — inglês primeiro desde 30/09/2026, ⚰️ `#en`), subtítulo "Você continua jogando normalmente. Se quiser ler o que mudou, está aqui." (⚰️ "Nada muda no seu jogo…") e **"Entendi" / "Got it"** (⚰️ "Ok"), que grava `marcaAvisoTermos` em `STORAGE_KEYS.TERMS_NOTICE_SEEN`. Informativo, **sem re-aceite**, e **o último da fila** — é o único aviso que não fala do dia da pessoa; travado como último em `filaDeAvisos.contract.test.ts` desde `a6c1cd8a`; o comentário do código o chama de "7." porque conta o `hp` como 1. As versões subiram para **2026-09-22** em `a6c1cd8a` (mudança material da política — o que vai ao Groq), então quem consentiu antes vê o banner de "ambos" uma vez |

- **Régua**: `src/components/filaDeAvisos.contract.test.ts` — exige as chaves
  `'firstDay'` e `'priming'`, exige que `shouldShowFirstDay(` e
  `if (mostrarPrimingDePush) avisos.push` apareçam **uma vez cada**, e trava a
  ordem `key: 'semanal'` **antes** de `key: 'triagem'`.

⚠️ O comentário do slot no `App.tsx` numera "1. HP" duas vezes (a primeira antes
do item 0). É defeito de comentário, não de comportamento: a ordem executada é a
dos `push`, que é a da tabela acima (o convite ao Refúgio, `0b`, é o segundo: entre `firstDay` e `hp`, desde 30/09/2026) — sete itens desde `42b07bec`, nove desde a incubação, **dez** desde o marco do Bosque (29/09/2026) (contando a `carga`, que a tabela omitia até 21/09/2026; WP4.29, `8be8f9c5`; `'incubacao'` entra logo depois do `hp`), o banner de
termos por último ("é o único aviso que não fala do dia da pessoa") — **exceto
na PRIMEIRA aparição de cada versão, que entra em posição 1** (desde
`592e2c14`, QA Rodada 2 A3: `termsNoticePrimeiraVez` = `STORAGE_KEYS.TERMS_NOTICE_SHOWN`
≠ `marcaAvisoTermos(...)` → `avisos.unshift(termos)`, senão `push`; um
`useEffect` grava `TERMS_NOTICE_SHOWN` na primeira exibição; ⚰️ um banner que
nunca chegava ao topo nunca era lido — o "+N" o escondia atrás do HP e da
triagem todo dia). `filaDeAvisos.contract.test.ts` trava o `unshift`/`push`
literal. Régua do banner: `src/components/TermsUpdateBanner.render.test.tsx` e
`src/utils/termsNotice.test.ts` (`qualDocMudou` com versão ilegível → `'both'`,
desde `592e2c14`).

---

## 4. As superfícies, uma a uma

### 4.1 Home — `currentView === 'home'` (`pane === 'main'`)

**Chega por**: valor inicial de `currentView`; `CornerLink icon="home"` do Mapa
(`goBack`) e o voltar de qualquer página do menu (§1.1) · **Sai para**:
`CornerLink icon="mapa"` → `goTo('map')`, ou o avatar do canto (`ProfileAvatarButton`,
§1.2). ⚠️ Desde a minimal-ui F2 a Home segue a abordagem B (faixa de cenário
com o pet grande, HP/EN, 3 cuidados — mochila, lua/sol, banho —, lista do dia
com botão +, `ChatBox` sempre aberto); onde o texto abaixo descreve o deck de
cinco ações ou a pastinha, vale o que o `CompanionHUD` e `home/Mochila.tsx`
desenham hoje.

A Home empilha, nesta ordem de render:

1. **`HomeHud`** — o `<h1>` da Home (o wordmark) + `focusSealed` (o selo do dia,
   binário: `focoDoDiaCompleto`). **Só isso**: ⚰️ a barra DOM de HP/energia
   (`hideMeters`) saiu em `f5ead7c0` (16/09/2026, canvas Home achado 1,
   `DECISOES-WIREFRAME.md` §19) — a leitura de HP/energia mora **uma vez**, na
   `VisorBar` dentro do vidro do `CompanionHUD`.
2. **O slot de avisos** (§3.2).
3. **`CompanionHUD`** — §4.2. Brincar é a **5ª célula do deck** dele
   (`play={playDeck}`), não um card.
4. ⚰️ **`PlayCard`** — não é mais montado (`f5ead7c0`); o arquivo
   `src/components/PlayCard.tsx` continua no repo **sem consumidor**
   (`grep -rn "PlayCard" src --include=*.tsx` devolve só um comentário do
   `App.tsx`, 20/09/2026).
5. ⚰️ **`EvoTrail`** — apagado em `72196da2` (S1 do canvas Home): a escada de
   altura fora da própria tela saiu, e a célula Evolução da barra é o caminho.
6. **`QuickAddBar`** (`onCommit={handleQuickAdd}`).
7. **Botão "Equilibrar minha semana"**, sob `{podeEquilibrar && (…)}` →
   `setBalanceOpen(true)`.
8. **`DailyRituals`** (`src/components/DailyRituals.tsx`, novo em `682835a3`,
   canvas Atividades §20) — a lista do dia inteira ganhou dono: o `RitualPanel`
   com as tarefas (`RitualRow` + `TaskMeta`), as atividades (`RitualRow` +
   `StepRow` + `HabitConstancy`) **e** a gaveta "Guardadas" (`<details>` sob
   `{guardadas.length > 0 && (…)}`, com `guardadas = tasks.filter(t => !isActive(t))`
   e o botão "Retomar" → `onRestoreTask`). Ordem declarada no cabeçalho: tarefas
   ativas → hábitos devidos hoje → hábitos fora do dia → concluídas de hoje por
   último. O `App.tsx` só passa o save e os handlers.

**Estados**: **vazio** — `DailyRituals` passa ao `RitualPanel`
`emptyMessage={tarefas.length + atividades.length + feitasHoje.length === 0 ? emptyMessage : undefined}`
(com `emptyMessage={t.main.noActivityRegistered}` vindo do `App`);
**hábito fora do dia** — `dimmed={!activity.disponivelHoje}` e as etapas ficam
inertes (esmaecer é tinta `muted`, nunca `opacity` — é regra do componente);
**sem métricas** — `hideMetrics={gameState.rest?.hideMetrics === true}` desce
pelo `DailyRituals` até o `HabitConstancy`; **contador "feitos/total"** = devido
hoje + concluídas de hoje (a tarefa concluída fica riscada na lista até a virada);
**"N/M steps" só com N ≥ 1** — antes do primeiro passo é "M steps".

**Dono**: `src/App.tsx` (bloco `currentView === 'main'`) +
`src/components/DailyRituals.tsx` · **Régua**:
`src/components/dailyList.sm2.render.test.tsx`,
`src/components/p5DiaCompleto.contract.test.ts`.

### 4.2 `CompanionHUD` — a área do pet

**Chega por**: está montado o tempo todo na Home · **Sai para**: nada (não navega).

- **O balão ocioso e o do toque** (desde `592e2c14`, QA Rodada 2 `07` §2.9): a
  escada de fallback — borra (`dirty`), pedido de comida (`hungry`) e as quatro
  faixas de energia (`energized` ≥ 1 / `fine` ≥ 0,6 / `peckish` ≥ 0,1 / `starving`)
  — vem de `petVoiceLine` (`utils/petVoice.ts`), nunca de literal no componente.
  ⚰️ "Me limpa!", "Me alimenta!", "Me alimenta por favor!" — a única fala que o
  jogador que menos faz ouvia (89 de 90 dias na simulação), e era pedido
  imperativo (L12). Hoje a criatura fala do corpo dela e constata ("Barriga
  fazendo barulho.", "Tô perto do chão hoje."). **O sprite próprio** (URL do
  acervo) cai na arte de reserva por `onError` quando não carrega (offline, cache
  do provedor fora — E2; ⚰️ visor quebrado).
- **O gesto de carinho**: um `<button>` transparente sobreposto ao sprite
  (`className="sm2-rub"`), com `aria-label` "Fazer carinho no Soulmon (segure
  para curar)" / "Pet your Soulmon (hold to heal)", `onPointerDown/Move/Up` e
  `onKeyDown` (Enter/Espaço rodam um ciclo de 2 s). A regra e o teto de cura são
  de `onPet` (`handlePet` no `App.tsx`), nunca daqui.
- ⚰️ **O deck de CINCO ações** (`div.sm2-deck`, `role="group"`: `feed`, `items`,
  `bath`, `sleep`, `play`) **não existe mais** — saiu na Home B da minimal-ui
  (F2, `78dc6ddb`). `grep -n "sm2-deck\"" src/components/CompanionHUD.tsx` → 0.
  Comer virou **arrasto da Mochila até o pet** (`components/home/Mochila.tsx`);
  **brincar e carinho não têm botão**, são gesto sobre o pet.
- **OS TRÊS CUIDADOS** (`div.sm3-cuidar`, `role="group"`, `aria-label`
  "Cuidar do pet"/"Care for your pet"), no canto inferior DIREITO da cena, na
  ordem literal: **mochila** (`data-cuidado="mochila"` → `openMochila`, com
  `aria-haspopup="dialog"` + `aria-expanded`), **dormir**
  (`data-cuidado="dormir"` → `onSleep`, `aria-pressed={isSleeping}`,
  `data-on` quando dormindo) e **banho** (`data-cuidado="banho"` →
  `handleShowerClick`; `showerCooldown` põe a classe `sm3-cuidado-inerte` e
  `aria-disabled` — é cooldown de 5 s contra o toque duplo, **não** gate de
  regra: o banho está sempre disponível). Ícone de **24** (degrau `action`),
  alvo de 44 no botão. Estes três são a **exceção D1** do dono (23/09/2026): é
  a única caixa em volta de ícone na Home. Desde 24/09/2026 o ícone é a ARTE em
  pixel do squad (`PixelIcon` `itens`/`dormir`/`banho`); só o estado "acordar"
  o "acordar" também é arte (`PixelIcon name="acordar"`, o sol da rodada 3, 30/09/2026; ⚰️ o glifo `wb_sunny`). O marcador 🎒 do Passeio também é arte desde 30/09/2026 (`UI_ICON_ART.mochila`, 20 px; ⚰️ o emoji).
- **Botão "Evoluir"**: montado sob `{canEvolve && !isSleeping && (…)}`, chama
  `onEvolveRequest` — hoje é a placa "EVOLVE" na moldura do vidro.
- **Estados**: `hauntedWatching` acrescenta a classe `sm-pet-haunted` ao sprite —
  é gesto, sem texto junto; `hasNewItems` acende o selo do botão de itens
  (o ponto `sm2-deck-dot` sobre o ícone `itens` — ⚰️ era o glifo `inventory_2`
  com `fill={1}`, e a arte em pixel **não tem eixo de FILL**, então desde
  24/09/2026 o selo é só o ponto); `isSleeping` troca a ação de dormir por
  acordar.
- **A voz do gesto (21/09/2026, copy §1 da bíblia)**: `fullSignal` e
  `healCapSignal` continuam sendo os contadores que o `App.tsx` acende, mas a
  frase vem do dono único `PET_VOICE_LINES` (`src/utils/petVoice.ts`, kinds
  `full` e `healCap`) — ⚰️ as três frases inline de cada um ("Estou cheio! Me dá
  uma horinha…", "Já recebi muito carinho hoje!") não existem mais:

  ```ts
  speak(petVoiceLine('full', language === 'pt-BR', Math.random(), petPassive), 3500);
  speak(petVoiceLine('healCap', language === 'pt-BR', Math.random(), petPassive), 3500);
  ```

  Três gestos que eram mudos falam pelo `falar(kind)` do `App.tsx`
  (`setSpeakSignal`): **dormir/acordar manual** — `falar(isSleeping ? 'wake' : 'sleep')`
  fora do updater, só no toque (o sono automático segue calado); **a borra que
  chegou** — `falar('residue')` na transição `careEvent?.type === 'poop'`
  (`borraAnteriorRef`), nunca no dreno; **vida cheia ao usar 💗** — `falar('steady')`
  (§4.2b). `wake` nunca comenta a noite de quem lê — `src/utils/petVoice.test.ts`
  exige.
- **O "Z" do sono** troca de folha pelo cenário: `isDarkBackground(equippedBackground)`
  (`utils/backgrounds.ts`) escolhe `ANIM_ART.sleepZLight` sobre cenário escuro e
  `ANIM_ART.sleepZ` nos demais (R2-4 da `squad-arte`, 21/09/2026).
- **Dono**: `src/components/CompanionHUD.tsx` · **Régua**:
  `CompanionHUD.render.test.tsx`, `CompanionHUD.cta.test.tsx`,
  `CompanionHUD.vinculo.render.test.tsx`, `CompanionHUD.voz.render.test.tsx`,
  `CompanionHUD.reacao.render.test.tsx`, `src/components/som-presenca-d11.render.test.tsx`.

### 4.2a O seletor de comida — a folha "Alimentar" (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: a ação `feed` do deck do `CompanionHUD` —
`onClick: () => setFeedOpen(true)` · **Sai para**:
`onClose={() => setFeedOpen(false)}`, o × / Escape do `ModalSheet`, ou escolher
uma comida — `handleDeckFeed` **fecha a folha antes** de chamar `onFeed`.
Desde `91b0deb8` (16/09/2026) a folha sai por **`createPortal(folha, document.body)`**:
montada dentro do `.sm-pet-sticky`, ela ficava presa sob o dock do chat e a nav
(medido no comentário do próprio arquivo); sem `document` (jsdom/SSR) fica onde
estava.

**Aparece quando** (condição literal):

```jsx
<ModalSheet
  open={feedOpen}
  onClose={() => setFeedOpen(false)}
  title={language === 'pt-BR' ? 'Alimentar' : 'Feed'}
  language={language}
>
  {foodStock.length === 0 ? (…parágrafo…) : (…grade…)}
</ModalSheet>
```

com

```ts
const foodStock = Object.entries(foodInventory)
  .filter(([emoji, n]) => n > 0 && !isSpecialItem(emoji))
  .sort((a, b) => b[1] - a[1]);
```

**Estados** — os três existem, e o terceiro **não é uma tela**:

| Estado | Condição | O que se vê |
|---|---|---|
| com estoque (`HOME-35`) | `foodStock.length > 0` | grade `.sm2-gcell-grid` (canvas `AlimentarFolha`, D-H6, desde `91b0deb8`); cada célula é um `<button className="sm2-gcell">` com a arte (`ITEM_ART[emoji]`, 48px, dentro de `.sm2-gcell-art`), o nome (`FOOD_NAME_BY_EMOJI[emoji] ?? ''`), `×N` em `sm2-num`, e `aria-label` = `` `${FOOD_NAME_BY_EMOJI[emoji] ?? emoji} × ${n}` ``. ⚰️ **Item sem arte não cai mais no emoji do sistema** — mostra o quadro vazio. Abaixo, a dica: "Cada comida dá +1 de energia e pontos de atributo. Se a barriga estiver cheia, seu Soulmon avisa." / "Each food gives +1 energy and attribute points. If its belly is full, your Soulmon will say so." |
| vazio | `foodStock.length === 0` | **um parágrafo, e só** — "Sua pastinha está sem comida. Conclua uma tarefa ou hábito para ganhar comida — é assim que seu Soulmon come." / "You're out of food. Complete a task or habit to earn some — that's how your Soulmon eats." Sem grade, sem botão, sem ilustração |
| recusa por teto (`HOME-36`) | acontece **depois** de a folha fechar | ver abaixo |

**A recusa (`HOME-36`) é fala do pet, não superfície.** `handleDeckFeed` faz
`setFeedOpen(false)` e delega; quem recusa é o `handleFeed` do `App.tsx`:

```ts
if (feedTimesFor(gameState.careCaps, now).length >= FOOD_LIMIT_PER_HOUR) {
  setFullSignal(n => n + 1); // pet says "I'm full"
  return;
}
```

`fullSignal` é um contador que **só cresce**; no `CompanionHUD` ele dispara um
`speak(…, 3500)` com `petVoiceLine('full', …)` — a frase mora em `PET_VOICE_LINES`
(`src/utils/petVoice.ts`) desde 21/09/2026; ⚰️ até então eram três frases inline
no `CompanionHUD` ("Estou cheio! Me dá uma horinha…" / "I'm full! Give me an
hour…"), fora do alcance do teste de tom. **Sem toast, sem modal, sem estado de
erro na folha** — e o item **não** é decrementado (o `return` é antes do
updater). `FOOD_LIMIT_PER_HOUR` é `MAX_STAGE_REQUIREMENT` (derivado do maior
`FORM_REQUIREMENTS[…].required`, nunca um literal) e a janela é deslizante de
1 h sobre `careCaps.feedTimes`, que mora no SAVE.

**Item especial não entra aqui**: `isSpecialItem` (dono: `src/utils/shop.ts`)
tira 🌀 / 💗 / 👊 / 🎶 / 🤲 do `foodStock` — eles se usam na pastinha (§4.2b).
Misturá-los faria "Alimentar" gastar um consumível caro por engano.

**Dono**: `src/components/CompanionHUD.tsx` (`feedOpen`, `foodStock`,
`handleDeckFeed`) para a TELA; a REGRA é do `handleFeed` (`src/App.tsx`) sobre
`src/utils/careRules.ts` (`feedFood`, `FOOD_LIMIT_PER_HOUR`) ·
**Régua**: `src/components/CompanionHUD.cta.test.tsx` (abre a folha, escolhe a
comida, exige que o especial NÃO apareça e que o vazio explique como conseguir),
`src/utils/careRules.test.ts` (o teto por hora).

### 4.2b `ItemsWindow` — a pastinha: o vazio e o uso de item especial (medido em 13/09/2026, a pedido do inventário de wireframes)

> ⚰️ **A tela da pastinha foi apagada no fechamento da minimal-ui (F6,
> 24/09/2026)**: desde a F2 nada abria `showItemsWindow` (o `handleOpenItems`
> ficou sem chamador quando a Mochila da Home, `src/components/home/Mochila.tsx`,
> virou a entrada de item — itens se usam arrastando até o pet). O
> `ItemsWindow.tsx` guarda só `getFoodName`/`getFoodDesc`. O texto abaixo é
> registro histórico.

**Chega por**: a ação `items` do deck → `onOpenItems` → `handleOpenItems`, que
**alterna** (`setShowItemsWindow(prev => !prev)`) e apaga o selo
(`setNewItemsReady(false)`) · **Sai para**:
`onClose={() => setShowItemsWindow(false)}`.

**Aparece quando**: `{showItemsWindow && (<ItemsWindow … />)}` na raiz do
`App.tsx` (§4.25). O componente não tem prop `open` própria: monta já com
`<ModalSheet open …>`. O selo do botão do deck vem de `hasNewItems={newItemsReady}`,
e `newItemsReady` acende quando o total do inventário cresce
(`if (total > prevInventoryTotalRef.current) setNewItemsReady(true);`).

**Estados**:

| Estado | Condição literal | O que se vê |
|---|---|---|
| vazio (`HOME-38`) | `items.length === 0`, com `const items = Object.entries(foodInventory).filter(([, c]) => c > 0)` | **ilustração, não texto cru**: `mascot-raven.png` 72×72 **dentro de um `Viewport` 32×32 a `scale={3}`** (pixel só vive em vidro — canvas Home `ItensVazio`, D-H7; ⚰️ o `opacity: .85` saiu em `91b0deb8`), centralizado, e a frase "Sua pastinha está vazia. Conclua uma atividade para ganhar comida." / "Your item folder is empty. Complete an activity to earn food." **Sem rodapé** — o `footer` do `ModalSheet` só existe com `detail` |
| com itens, nada escolhido | `detail === null` | grade de 3 (`.sm2-gcell-grid`, a mesma da folha Alimentar — §4.2a); cada célula (`.sm2-gcell`) tem arte (`ITEM_ART`, 48px; ⚰️ sem fallback de emoji desde `91b0deb8`), nome e `×N`, com `aria-pressed={active}` e `aria-label` = `` `${getFoodName(emoji, language)} ×${count}` `` |
| item escolhido | `const detail = selected && foodInventory[selected] > 0 ? selected : null` | a célula ganha borda `--sm2-primary-ink` e fundo `--sm2-primary-soft`; o **rodapé** mostra nome + `effectLine` e o botão "Usar" / "Use" |

**O uso (`HOME-39`)**. "Usar" chama `use(emoji)` → `onFeed(emoji)` (que é o
`handleFeed` do `App.tsx`) e limpa a seleção. **A tela não decide nada**:
`effectLine` lê `CHIP_BOOST` / `HEART_HEAL` de `src/utils/shop.ts` — nunca um
número à mão —, e o dono do USO é `src/utils/specialItemUse.ts`
(`specialRefusal` / `applySpecialItem`), não o `careUpdaters.ts`. As três
recusas, transcritas do `handleFeed`:

```ts
const refused = specialRefusal(gameState, foodEmoji, agora);
if (refused === 'no-stock') return;
if (refused === 'daily-cap') {
  toast(language === 'pt-BR'
    ? '🌀 Um Glitchtama por dia. Ele te espera amanhã.'
    : "🌀 One Glitchtama a day. It'll wait for you tomorrow.");
  return;
}
if (refused === 'already-full') { falar('steady'); return; }
```

- **`'daily-cap'`** (🌀 Glitchtama além de `GLITCHTAMA_PER_DAY`): **toast**, e a
  pastinha continua aberta com o item **ainda na grade** — a recusa acontece
  antes do decremento, então ele volta e vale amanhã. A frase diz o que fazer,
  não o que foi negado.
- **`'already-full'`** (💗 Coraçãozinho com `healthPoints >= maxHealthPoints`):
  **fala do pet**, kind `steady` de `petVoice.ts` ("Tô firme. Guarda essa.") via
  `falar('steady')` (21/09/2026, copy §5.1: a recusa PROTEGE o item). ⚰️ Até
  então acendia o `healCapSignal`, o canal do teto de carinho — a frase dizia que
  o carinho tinha acabado, não que a vida estava cheia. Nenhum toast, nenhum
  texto dentro da pastinha.
- **`'no-stock'`**: silêncio total.

**Sucesso**: `playTaskComplete()` para 🌀 e 💗, `playFeed()` para chip;
`setFeedAnim` roda a mesma animação de comer do caminho comum; só o 🌀 ganha
toast ("🌀 Glitchtama! +1 dia completo" / "🌀 Glitchtama! +1 complete day").
A folha **não fecha** ao usar — só a seleção é limpa.

**Dono**: `src/components/ItemsWindow.tsx` (a tela) + `src/utils/specialItemUse.ts`
(a regra) · **Régua**: `src/utils/specialItemUse.test.ts` (cada número e as três
recusas, inclusive os dois toques no mesmo lote do React).
⚠️ **A TELA não tem régua**: não existe nenhum `ItemsWindow.*.test.tsx`
(`ls src/components | grep ItemsWindow` devolve só o `.tsx`, 13/09/2026).

### 4.3 `ChatBox` — a barra de conversa

**Chega por**: montada dentro do `CompanionHUD` · **Sai para**: nada.

- **O botão da direita é UM só, e troca de ação** — nunca dois em `? :`, porque
  desmontar o nó no instante do envio derruba o foco do teclado:

  ```jsx
  onClick={hasText || micDisponivel === false ? handleSendMessage : handleMicClick}
  ```

- **O microfone**: `micDisponivel` nasce `null` (**otimista**: `null` desenha o
  microfone) e só vira `false` quando o servidor responde. A busca acontece na
  **primeira interação** com a barra, nunca na montagem — há guard exigindo que
  montar o `CompanionHUD` não toque a rede (`CompanionHUD.render.test.tsx`, caso
  "monta sem tocar a rede"):

  ```ts
  const garantirConfig = useCallback(async () => {
    const { transcribeAvailable } = await fetchServerConfig();
    setMicDisponivel(transcribeAvailable);
    return transcribeAvailable;
  }, []);
  ```

  ⚠️ **Divergência com o `CLAUDE.md`**, que diz "sem elas o botão de microfone
  **não é desenhado**": com `micDisponivel === false` o **botão continua no DOM**
  — o que muda é o glifo (vira `send`) e o `aria-disabled` quando também não há
  texto. O comentário do próprio arquivo explica: "continua no DOM: o nó do foco
  tem que ser estável".
- **Estados**: `isLoading` → glifo `sync` girando; `isRecording` → `stop_circle`
  em tom `danger`; permissão negada → o pet fala "Não consegui acessar o
  microfone. Dá para escrever aqui do mesmo jeito 🎤" / "I could not reach the
  microphone. You can still type here 🎤".
- **Memória**: `history` vive em `useState`, cortado em 6 entradas — **nada vai
  para o save nem para o `localStorage`**.
- **A superfície de suporte** (`6ad2e629` + `f3654076`, 21/09/2026 — parecer
  clínico, `docs/NARRATIVA-COPY.md` §6): um `<p className="sm2-chat-support">`
  **sempre montado** sob o campo, sem condição, sem ícone, sem caixa — é a única
  tela em que a pessoa escreve texto livre para a criatura, então o caminho de
  ajuda mora aqui e não nas Configurações. Ordem da frase: o caminho primeiro
  ("procure ajuda de verdade: um serviço de saúde, uma linha de apoio da sua
  região, ou alguém de confiança"), a limitação do produto depois ("O Soulmon é
  um app de hábitos e não substitui isso"). Um link `<a href={HELPLINE_DIRECTORY_URL} target="_blank" rel="noopener noreferrer">` (`https://findahelpline.com`; desde 30/09/2026 o link, o rótulo e os números vêm do dono único `utils/supportLine.ts` — `helplineDirectoryLabel`, `helplineNumbers` —, o mesmo do `SupportNote` do Refúgio)
  ("Encontrar uma linha de apoio" / "Find a helpline") e dois serviços fixos por
  idioma — PT: "No Brasil: CVV, 188 (24h, gratuito)"; EN: "US/Canada: 988. UK/IE:
  116 123". A lista é **estática e humana**: faz par com a cláusula SAFETY de
  `functions/api/chat.js`, que **proíbe o modelo** de citar número, serviço ou
  site — quem cita é esta linha. Mais serviços ou um diretório diferente é
  decisão do dono.
- **Dono**: `src/components/ChatBox.tsx` · **Régua**:
  `src/security/supabase.contract.test.ts` (as quatro peças da transcrição);
  a linha de suporte: `régua: nenhuma` (`grep -rl "sm2-chat-support" src --include=*.test.*`
  → vazio em 21/09/2026).

### 4.4 ⚰️ `ActivitiesPage` — `currentView === 'games'` (apagada na minimal-ui F5)

> **Registro histórico.** O hub de cartões saiu: a Masmorra é o lote da área Exploração, a Corrida com obstáculos (então "do Dino") e o Pedra-papel-tesoura moram no Salão de Jogos (prédio da área Jogos, desde 30/09/2026; antes o Dino era da Exploração e o PPT o lote único de Jogos), a Arena (duelo)
> é lote da área Arena e o Torneio é o outro lote da Arena — todos no
> `AreaView` (§1.3). Os jogos montam por cima da área e saem por `onExit`.

**Chega por**: célula 2 da `BottomNav` · **Sai para**: `onOpenTournament` →
`setCurrentView('tournament')`; cada jogo monta **dentro** desta página.

- **O que se vê/faz**: um card destacado (`featured: true`) para o **Torneio** e
  a lista `games` com **quatro** minijogos, na ordem literal do array:
  `dungeon` (Masmorra), `arena` (Arena), `dino` (Corrida do Dino), `rps`
  (Pedra, Papel e Tesoura). Cada card é um `<button>` inteiro.
- **Aparece quando**: o jogo monta sob `{openGame === '<id>' && (…)}` — estado
  `useState<'dungeon' | 'arena' | 'dino' | 'rps' | null>(null)`; cada jogo sai
  por `onExit={() => setOpenGame(null)}`.
- ⚠️ **A Arena está viva desde então**: o `../INVENTARIO-TELAS.md` de 19/08/2026
  a lista como código morto ("`grep -rn "ArenaGame" src --include=*.tsx` fora do
  próprio arquivo: zero"). Em 09/09/2026 ela é o segundo card da lista. O
  comentário da `BottomNav.tsx` ainda descreve a página como "dungeon + dino +
  pedra-papel-tesoura + torneio" — **são quatro minijogos, não três**. O
  `CLAUDE.md` não descreve os minijogos da página (`grep -ni 'arena\|dino' CLAUDE.md`
  devolve só as linhas de Bits, Masmorra e áudio).
- **Dono**: `src/components/ActivitiesPage.tsx` · **Régua**:
  `src/components/ArenaGame.render.test.tsx`, `src/utils/cortes.contract.test.ts`
  (a régua de som que a Arena reintroduziu).

### 4.5 A lista de atividades (Home) e seus modais

| Superfície | Chega por | Aparece quando | Sai para | Dono |
|---|---|---|---|---|
| `QuickAddBar` | está na Home | sempre (acima do painel) | `onCommit={handleQuickAdd}` | `QuickAddBar.tsx` |
| `CreateModal` | CTA `+ Nova atividade` (`handleAddNewActivity`) e `EvolveTaskModal.onCreateTask` | `{createModalOpen && (…)}` | `onClose={() => setCreateModalOpen(false)}` | `CreateModal.tsx` |
| `EditModal` | toque no lápis de uma atividade (`handleEditActivity`, **único gatilho**: `setEditingActivity(id); setEditModalOpen(true)`) | `{editModalOpen && (…)}` | `onClose` limpa `editModalOpen` e `editingActivity` | `EditModal.tsx` |
| `TaskEditModal` | toque no lápis de uma tarefa (`handleEditTask`) | `{taskEditModalOpen && (…)}` | idem, com `editingTask` | `TaskEditModal.tsx` |
| `PostponeNudgeSheet` | `TaskMeta` → `handlePostponeNudge` | `task={nudgeTaskId ? … : null}` | `handleCloseNudge` | dentro do `App.tsx` |
| `BalanceWeekModal` | botão "Equilibrar minha semana" | `{balanceOpen && (…)}` | `onClose={() => setBalanceOpen(false)}` | `BalanceWeekModal.tsx` |
| `TriagePile` | botão "Arrumar a pilha" → `handleOpenTriage` | `interstitial === 'triage' && triageTasks` | `onClose={() => setTriageTasks(null)}` | `TriagePile.tsx` |

**Demo × pago**: `CreateModal` recebe `capIsDemoBoundary={gameState.accountTier === 'demo'}`
e `onUnlock={() => { setCreateModalOpen(false); setUnlockReason('task-limit'); }}`.
⚰️ **O `EditModal` não monta mais o `UnlockNudge`** (`d044fb2e`, 20/09/2026,
canvas Atividades A1 — "um modal de criação só"): as props `atCap` /
`capIsDemoBoundary` / `activitiesCap` / `onUnlock` saíram, e ele **só edita** —
hoje recebe `rhythm` (a ficha do hábito: janela de 7, "N of the last 7",
maturidade, escudos) e `hideMetrics`. O teto do demo bate num lugar só, o
`CreateModal`. ⚠️ **Divergência com o `CLAUDE.md`**, que ainda diz que o
`EditModal` "passou a exibir o `UnlockNudge` também" (item "Desbloqueio no meio
do jogo") — ver §4.13 e §6.

**`TriagePile`**: quatro saídas de peso igual, `TriageAction = 'today' | 'week' | 'someday' | 'drop'`;
quem aplica é `handleTriageResolve` no `App.tsx`, delegando a `toOpen`,
`postpone`, `toSomeday` e `drop`. A fila é **congelada** ao abrir (`setTriageTasks(triageQueue(…))`),
para o contador não mentir enquanto encolhe.

**Marcar feito abre 5 s de "Desfazer"** (desde 22/09/2026, decisão do dono
**#57**): os dois handlers de conclusão do `App.tsx` chamam `ofereceDesfazer`
— o da atividade inteira e o da ÚLTIMA etapa, que é a que fecha um hábito com
etapas. O toast é global (§4.25, `UndoToast`), então ele aparece igual na Home e
na lista de atividades; a regra e o que a reversão devolve estão em
[02 §24-A](02-REGRAS-DE-NEGOCIO.md#desfazer). Passada a janela, marcar continua
sendo irreversível — não existe caminho de desmarcar na UI.

**Régua**: `CreateModal.presets.render.test.tsx`, `QuickAddBar.render.test.tsx`,
`TaskMeta.render.test.tsx`, `StepRow.render.test.tsx`,
`HabitConstancy.hideMetrics.render.test.tsx`,
`BalanceWeekModal.render.test.tsx`.

### 4.6 Loja — `currentView === 'shop'` (hoje: área Mercado)

> ⚠️ **Minimal-ui F5**: o `ShopModal` foi apagado. A vitrine virou as lojinhas
> do Mercado (`area:mercado` → lotes Itens/Decoração/Background com abas por
> moeda e Conquistas, `src/components/mercado/MercadoSheets.tsx` +
> `ShopShelf.tsx`, catálogo em `src/utils/mercadoCatalog.ts`), e a loja de
> Honra (a moeda `emblems`, antes rotulada "Emblemas") mora no Torneio da Arena. O texto abaixo descreve o comportamento
> que as lojinhas herdaram (card sem saldo, troca Créditos → Bits); onde cita
> `ShopModal`, leia `ShopShelf`/`MercadoSheets`.

**Chega por** (histórico): célula 4 da `BottomNav` · **Sai para**: `onClose={() => setCurrentView('main')}`.

⚠️ **Divergência com o `CLAUDE.md`**, que descreve "Loja em ABAS
(Itens/Cenários/Mobílias/Torneio/Missões)". O código tem **dois segmentos**:

```ts
type ShopSegment = 'shop' | 'tournament';
```

- Dentro de `'shop'` há **três seções** de rolagem única (`sections`): Itens
  (`kind === 'chip' || kind === 'heart'`), Cenários (`kind === 'bg'`) e Mobílias
  (`kind === 'furniture'`).
- Dentro de `'tournament'` há uma seção (`TOURNAMENT_ITEMS`) e, **no topo**, as
  missões semanais, sob `{seg === 'tournament' && (weeklyMissions?.length ?? 0) > 0 && (…)}`.
- ⚰️ **A aba Missões não existe mais** — o próprio card bloqueado diz a missão e
  o progresso; o estado `hintFor` ("tocar para revelar") saiu junto.
- **Demo × pago**: `{seg === 'shop' && accountTier === 'demo' && onUnlock && (…)}`
  monta o `UnlockNudge` com `reason="shop"`.
- **Como página × como modal**: `asPage` (o valor que o `App.tsx` passa) devolve
  um `<div>` com o saldo no topo; sem ele, a mesma `body` vai dentro de um
  `ModalSheet` com título "Loja"/"Shop".
- **O que o card de cenário mostra** (`66e32d43`, rodada 2 da `squad-arte`,
  21/09/2026): `const src = BG_THUMBS[item.id] ?? bgImage(bg?.css);` — a
  miniatura 96×52 de `src/assets/backgrounds/thumbs/<id>.png` (`import.meta.glob`
  eager em `BG_THUMBS`); cenário sem miniatura cai na ilustração 1200×648
  reduzida por CSS, ⚰️ que era o caminho de todos até então ("transição
  declarada").
- **Dono**: `src/components/mercado/MercadoSheets.tsx` · **Régua**:
  `mercado/MercadoSheets.render.test.tsx`, `mercadoCatalog.test.ts`,
  `src/utils/weeklyMissions.fiacao.test.ts`.
- **Missão por prédio (07/10/2026).** Entrar num lote aberto (fora do Mercado) conta a
  missão do dia dele (`AreaView` › `enter` → `onVisitBuilding`), mas o lote **não** leva marca
  e a folha do prédio **não** tem painel de missão: a UI vive só no menu de Missões da Home
  (`MissionsSheet`: seções "Hoje"/"Today" e "Esta semana"/"This week"; o ícone some sem
  nada a fazer nem a entregar). Ver
  [§50-B](02-REGRAS-DE-NEGOCIO.md#50-b-missao-por-predio--materiais-decisao-do-dono-07102026).

### 4.6a Loja — o card sem saldo (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: tocar o card de um item cujo preço passa do saldo da moeda dele
(`LOJA-07`) · **Sai para**: nada — não navega, não fecha, não abre modal.

⚠️ **O card NÃO é desabilitado por saldo.** `disabled={!action}` só alcança o
item bloqueado por missão (`unlocked === false`, que deixa `action` `undefined`)
e o item já possuído troca a ação por equipar. Com saldo insuficiente o card
segue clicável, e a recusa é o retorno de `onBuy`:

```ts
const buy = (item: ShopItem) => {
  const name = isPt ? item.namePt : item.nameEn;
  const ok = onBuy(item.id);
  say(item.id, ok, ok
    ? (isPt ? `${name} comprado.` : `${name} purchased.`)
    : (isPt ? `Saldo insuficiente para ${name}.` : `Not enough to buy ${name}.`));
};
```

**Aparece quando** — dois sinais, um permanente e um momentâneo:

```ts
const affordable = (isEmblem ? emblems : points) >= item.price;   // permanente
const failing = flash?.id === item.id && !flash.ok;               // 2600 ms
```

**O que se vê/faz**:

- **Antes do toque**, só o PREÇO esmaece: `opacity: affordable ? 1 : 0.5` no
  número (Bits em `bitsNum`, **sem ícone**; Honra em `emblemNum` com o
  `military_tech` dourado ao lado). Arte, nome, descrição e borda **não mudam** —
  a loja continua mostrando o catálogo inteiro.
- **No toque**, `say(...)` acende `flash` e três coisas duram 2600 ms: a borda do
  card vira `--sm2-danger-ink`; a linha `sub` do card (a descrição) troca de cor
  para `--sm2-danger-ink`; e a região `role="status" aria-live="polite"` do topo
  substitui a dica ("Ganhe Bits nos minijogos.") pela frase de recusa, em tinta
  de perigo. Junto vai `navigator.vibrate?.(60)` — o sucesso vibra 25.
- Passados os 2600 ms, `setFlash(f => (f && f.id === id ? null : f))` devolve
  tudo ao estado normal. **Não há tela de "comprar Bits"**, nem atalho para o
  minijogo, nem convite de Créditos no ponto da recusa.

⚠️ **A frase é a mesma para as duas recusas de `shopBuyRefusal`** (`'no-funds'`
e `'already-owned'`): a prateleira (`mercado/ShopShelf.tsx`) lê só o `boolean`, nunca o motivo. Na prática
só `'no-funds'` chega pelo card, pelo desvio de ação descrito acima.

**Dono**: `src/components/mercado/ShopShelf.tsx` (`buy`, `say`, `affordable`, `failing`)
para a TELA; a regra é de `src/utils/shopBuy.ts` (`shopBuyRefusal`, reconferida
sobre o `prev` em `applyShopBuy`) e do `handleShopBuy` (`src/App.tsx`) ·
**Régua**: `src/utils/shopBuy.test.ts` (a recusa `'no-funds'` e o duplo clique
com saldo exatamente igual ao preço) e, para o ESTADO VISUAL (preço em tinta
`muted`, filete e região em `gold-ink`, nunca `danger`), desde 24/09/2026
`src/components/mercado/MercadoSheets.render.test.tsx` ("saldo insuficiente").

### 4.6b Loja — a troca Créditos → Bits (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: rolar até o fim do segmento `'shop'` (`LOJA-13`) · **Sai para**:
nada — a troca acontece ali mesmo.

**Aparece quando**: `{seg === 'shop' && exchange}` — **último nó do corpo da
Loja**, depois das três seções e depois do `UnlockNudge` do demo. No segmento
`'tournament'` ela não existe.

**O que se vê/faz**: uma linha de cabeçalho com o ícone `diamond` (tom primário)
+ "Trocar Créditos por Bits — você tem N" / "Swap Credits for Bits — you have N",
e abaixo os **três** degraus de `BITS_EXCHANGE`, lado a lado, cada um `flex: 1`:

```ts
export const CREDIT_TO_BITS = 10;
export const BITS_EXCHANGE = [
  { credits: 10, bits: 10 * CREDIT_TO_BITS },
  { credits: 25, bits: 25 * CREDIT_TO_BITS },
  { credits: 60, bits: 60 * CREDIT_TO_BITS },
] as const;
```

Cada botão é `diamond` + `credits` → `arrow_forward` → `bits`, com `aria-label`
"Trocar N Créditos por M Bits" / "Swap N Credits for M Bits".

**Estados**:

| Estado | Condição literal | O que se vê |
|---|---|---|
| disponível | `const can = credits >= pack.credits && exchanging === null` | `sm2Button('ghost')`, ícones em tom primário |
| sem Créditos | `credits < pack.credits` | `disabled`, `sm2Button('ghost', true)`, ícones em `muted` |
| em voo | `const busy = exchanging === pack.credits` | o `diamond` do degrau em voo vira `sync`; **os outros dois também ficam `disabled`**, porque `can` exige `exchanging === null` |
| falhou | `ok === false` no `await onExchangeCredits(pack.credits)` | a região `aria-live` diz "A troca não foi concluída. Tente de novo." / "The swap did not go through. Try again."; e o `handleExchangeCredits` do `App.tsx` ainda dá `toast('Créditos insuficientes.')` quando é o servidor que recusa |
| concluiu | `ok === true` | "+M Bits." na região `aria-live` + `toast('+M Bits!')`; o saldo do rodapé (ou do topo, com `asPage`) já mostra o número novo |

**A direção é uma só, e a ausência é a regra**: não existe Bits → Créditos, porque
Créditos são a moeda que libera gerar o pet próprio e farmá-los em minijogo
anularia a única coisa que o dinheiro real compra com exclusividade
(`src/utils/currencies.ts`). **O gasto é do SERVIDOR**:
`spendCredits(pack.credits, 'exchange-bits')`; os Bits só entram depois que ele
confirma, e `credits`/`accountTier` são reescritos com o que ele devolveu (`ent`).

⚠️ **O achado de 19/08/2026 do [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md)
§5.11 — o emoji 💎 convivendo com `icon-gem.png` nesta tela — não vale mais.**
Hoje há **um** desenho de Crédito no app, o glifo `diamond` do `<Icon>`, e a
lápide está no cabeçalho do `ShopModal.tsx` ("o emoji de gem e o `icon-gem.png`
que conviviam NESTA tela morreram aqui"). Bits continuam **sem ícone nenhum** —
a ausência é a distinção.

**Dono**: `src/components/ShopModal.tsx` (`exchange`, `exchanging`, `say`) +
`src/utils/currencies.ts` (`BITS_EXCHANGE`, `CREDIT_TO_BITS`) +
`handleExchangeCredits` (`src/App.tsx`) · **Régua**:
`src/utils/currencies.test.ts` (os degraus e a fronteira das três moedas).
⚠️ **Nenhum teste monta os botões de troca.**

### 4.7 Soulmon — `currentView === 'pet'`

**Chega por**: chip "Soulmon" da fileira de sub-abas · **Sai para**: os outros
dois chips.

Três blocos, cada um com condição própria e cada um em `Suspense` com
`<ScreenSkeleton language={language} />`:

```jsx
{currentView === 'pet' && (<Suspense …><PetPage …/></Suspense>)}
{currentView === 'pet' && (… <DreamDex rest={gameState.rest ?? createRestState()} …/> …)}
{currentView === 'pet' && (… <AdventureDiary entries={gameState.adventures ?? []} …/> …)}
```

- **`PetPage`** mostra as formas **já desbloqueadas** (nunca as futuras), a
  descrição do oráculo, a classe do estágio (`classTitle`) e as duas habilidades.
  **Novo no delta** (`a388ddb9` em 15/09/2026, refeito em `f1413ddc` pelo canvas
  Pet, `DECISOES-WIREFRAME.md` §22): o **visor de emblemas** — prop
  `achievements={unlockedAchievements(gameState)}` (`utils/achievements.ts`,
  `ACHIEVEMENT_IDS` = 9); **só os abertos são desenhados**, os fechados não viram
  cadeado nem silhueta, e a linha quieta sob o visor diz "Achievements · N of 9";
  o **sigilo de classe** aparece no canto do vidro sob
  `{classeAtual?.sigilo && sigilArt(classeAtual.sigilo) && (…)}`.
  **A aura atrás do herói** (`66e32d43`, 21/09/2026): `auraForElement(dominantElement, 96)`
  — a 96² da rodada 2 preenche o vidro inteiro (`AURA`); quando a 96² não
  existe e a chamada devolve a 128², entra `AURA_128` (o anel a 256 num vidro de
  192, 32 px de cada lado fora — ⚰️ era o único caminho até então):

  ```ts
  const aura = auraForElement(dominantElement, 96);
  const auraStyle = aura && aura === auraForElement(dominantElement, 128) ? AURA_128 : AURA;
  ```

  **Estado**: save legado sem `soulProfile` simplesmente não mostra habilidades;
  sem conquista aberta, sem faixa.
- **`DreamDex`**: os 30 do `DREAM_CATALOG`; o não coletado é **silhueta**, nunca
  "faltando".
- **`AdventureDiary`**: só o que já aconteceu — **não** mostra lacuna, de
  propósito (o contrário do Dex).
- **Régua**: `AdventureDiary.render.test.tsx`.

### 4.8 Estatísticas — Laboratório › Santuário do Vínculo (ex-Observatório) (`labTab === 'stats'`)

> **Árvore de talentos (07/10/2026):** a árvore abre sempre a 100% (sem zoom, rolagem nativa). Tocar num nó abre um modal sobre ele: descrição, o que falta (texto), quantos pontos atribuir e Confirmar/Cancelar. Detalhe: `docs/manual/06-REFERENCIA/components.md` › `TalentTree.tsx`.

**Chega por**: área Laboratório → lote Santuário do Vínculo (G2, 02/10/2026: não é mais página do menu da Home) · **Sai para**: os outros dois chips.

Quatro cartões, cada um com condição literal dentro da `StatsPage`:

| Cartão | Aparece quando | Observação |
|---|---|---|
| `BirthCard` | `{birth && (…)}` — o `App.tsx` monta `birth` sob `gameState.bornAt \|\| gameState.soulmonMeta?.baseName \|\| gameState.demoCharacterId` | **Demo**: `displaySprite` lê o acervo, que o demo nunca preenche, então há fallback `getSpriteForStage('rookie', gameState.demoCharacterId)` |
| ⚰️ `BestiaryCard`, `FormAlbum` e a linha "Formas já alcançadas" | — | **Saíram do Santuário do Vínculo em 07/10/2026 (pedido do dono: "Encounters e Forms lived podem sair")**. `bestiary` e `formReachedAt` seguem no save (masmorra, cerimônia de evolução); só a tela saiu. |

`MemoriesCard` **não mora aqui** — ele é montado dentro do `DailyReportModal`
(§4.16).

**`hideMetrics` chega à `StatsPage`** (`05808e27`, 20/09/2026, canvas Estatísticas
§27 — até então não chegava): `hideMetrics={gameState.rest?.hideMetrics === true}`
esconde os NÚMEROS — "Nível N" e o `role="progressbar"` do vínculo
(`{!hideMetrics && (…)}`), `daysTogether`, os `feitos`, as frações da estação e
"done N×" — e **preserva as recompensas**: a palavra do vínculo, o `BirthCard`,
as artes do bestiário e do álbum, as medalhas e as listas sem contagem. O
`BirthCard` é o **mesmo** do reveal (§2.3).

**Régua**: `StatsPage.render.test.tsx` (novo — cobre `hideMetrics`),
`BirthCard.render.test.tsx`, `MemoriesCard.render.test.tsx`.

### 4.8a Estatísticas — a primeira vez / o vazio (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: o chip "Estatísticas" no primeiro uso (`STAT-02`) · **Sai para**:
os outros dois chips.

⚠️ **A medição de 19/08/2026 do [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md)
está vencida.** Ela descreve **três** listas vazias em texto cru ("No activities
completed yet." / "No tasks completed yet." / "No history yet."); nenhuma das três
strings existe hoje — `grep -n "No activities\|No tasks\|No history" src/components/StatsPage.tsx`
não devolve nada (13/09/2026). As duas tabelas de topo viraram **uma** ("O que
você mais repete"), e as frases foram reescritas.

**O que a tela mostra com o save zerado**, seção por seção:

| Seção | Condição literal | Na primeira vez |
|---|---|---|
| Vínculo | nenhuma — **sempre monta** | a PALAVRA primeiro: `title ?? (isPt ? 'Recém-chegados' : 'Just met')`, "Nível 0" embaixo, `role="progressbar"` em 0% e a frase "Ele só sobe. Cuidar de você é o que aproxima vocês dois — nada aqui desce, nunca." |
| Quem é o seu Soulmon | `{(passive || carePattern) && (…)}` | **some inteira** sem traço nem ritmo. Com o traço de nascimento sorteado, aparece só ele: `carePattern` só é passado quando a leitura é confiável (§ `utils/carePattern.ts`) |
| A jornada | nenhuma — **sempre monta** | "0 dias completos até aqui" (`streakDays`, em `--sm2-font-display`). Tudo o mais é condicional: `daysTogether` (`typeof daysTogether === 'number'`), `BirthCard` (`{birth && …}`), `BestiaryCard` (`{(bestiary?.length ?? 0) > 0 && …}`), `FormAlbum` (`{album && album.length > 0 && …}`), a linha legada (`{!album && formNames.length > 0 && …}`), `feitos` (`{feitos.length > 0 && …}`) e `soulGoal` (`{journey?.soulGoal && …}`) |
| A estação | `{season && (…)}` | o rótulo da estação; **os caminhos só aparecem andados** (`const andados = status.paths.filter(p => p.current >= 1)`) — progresso zero **não** vira `0/20` na tela |
| O que você mais repete | `topRepeated.length === 0` | "Nada concluído ainda. A primeira vez já aparece aqui." / "Nothing finished yet. The very first one shows up here." |
| Últimas conclusões | `recent.length === 0` | "O histórico começa na sua próxima conclusão." / "History starts at your next completion." |

com (as duas derivações, sem o `useMemo` que as envolve no arquivo):

```ts
const topRepeated = Object.entries(activityStats)
  .filter(([, s]) => s.completionCount > 0)
  .sort((a, b) => b[1].completionCount - a[1].completionCount)
  .slice(0, 5);
const recent = completedTasks.slice(-10).reverse();
```

**O vazio tem forma declarada, e ela é mínima**: as duas listas **mantêm** o
`<section>` e o `<h3>`, e trocam só o `<ul>` por um `<p style={sm2Hint}>`.
**Não há ilustração e não há CTA** — ao contrário da pastinha (§4.2b), que usa o
mascote. As duas frases falam do FUTURO ("já aparece aqui", "começa na sua
próxima conclusão"), nunca da falta; é a mesma trava de forma que proíbe o
`0/20` da estação e o "faltam N" do bestiário.

**Dono**: `src/components/StatsPage.tsx` (`topRepeated`, `recent`) ·
**Régua**: `StatsPage.render.test.tsx` — existe desde `05808e27` (20/09/2026).
⚰️ Até 13/09/2026 **nenhum teste montava a `StatsPage`**; hoje
`ls src/components | grep -i 'StatsPage.*test'` devolve o arquivo. Os cartões
continuam com `BirthCard.render.test.tsx` (os de `BestiaryCard`/`FormAlbum` saíram com os componentes). A linha "Nível 0" e o `progressbar` da tabela acima
**somem** com `hideMetrics` (§4.8).

### 4.9 `OraclePage` — `currentView === 'oracle'`, inalcançável (até a minimal-ui F1)

> ⚠️ **Mudou em 23/09/2026 (minimal-ui F1, decisão D6)**: o Oráculo é linha do
> menu ícone da Home (⚰️ o menu da Home saiu; a flag `MENU_SHOWS_RITUAL_TOOLS` vive em `SettingsPage`), e portanto
> **alcançável**. As medições abaixo são o registro de antes.

- **Aparece quando**: `{pane === 'oracle' && (…)}` (`pane = paneFor(currentView, labTab)`, com `currentView === 'page:oracle'`; ⚰️ antes `{currentView === 'oracle' && (…)}`).
- **Como se sabe que é inalcançável** — duas medições de 09/09/2026:
  1. `grep -rn "setCurrentView(" src/ --include=*.tsx | grep -o "setCurrentView('[a-z]*'"`
     devolve **só** `'evolution'`, `'main'` e `'tournament'`; a `BottomNav`
     oferece `main`, `games`, `evolution`, `shop`, `library` e `settings`.
     **Nada leva a `'oracle'`.**
  2. O segundo caminho, o atalho de dono do onboarding, **também morreu**:
     `grep -n "startOracleDebugHold\|cancelOracleDebugHold" src/components/SoulmonOnboarding.tsx`
     devolve apenas as duas **declarações** (`const startOracleDebugHold = () =>`
     e `const cancelOracleDebugHold = () =>`) e **nenhuma chamada** — a intro de
     marca que segurava o mascote por 1,8 s foi apagada quando o portão de
     identidade virou a primeira tela. Sem chamador, `setOracleDebugOpen(true)`
     nunca roda, e o `{oracleDebugOpen ? … : …}` fica preso no ramo falso.
- **Consequência** (até a F1): `PixelizerCard` também era inalcançável — o único
  `<PixelizerCard` do `src/` está dentro da `OraclePage`; desde a F1 chega junto com ela.
- **Dono**: `src/components/OraclePage.tsx`, `src/components/PixelizerCard.tsx`.
- **Régua**: nenhuma. ⚠️ Vai para o `../STATUS.md` como achado.

### 4.10 Evolução — `currentView === 'evolution'`

**Chega por**: área Laboratório (`area:laboratorio`, lote Evolução — `goTo`
chama `contarMissao('evolve-view')` ao entrar na área); ⚰️ a célula 3 da
`BottomNav` saiu na minimal-ui F1 e `EvoTrail.onOpen` não existe mais
(`72196da2`, 20/09/2026) · **Sai para**: as abas sublinhadas Evolução /
Soulmon / Estatísticas (`labTab`) ou o voltar ao Mapa.

Seis blocos, com estas condições literais (a quarta ganhou `!gameState.demoCharacterId`
em `acf4413e` — dois convites iguais na mesma tela é cobrança, EVO-20; o quinto
nasceu em `84ae4937`, 21/09/2026 — eram cinco):

```jsx
{currentView === 'evolution' && gameState.demoCharacterId && (…UnlockNudge…)}
{currentView === 'evolution' && (…EvolutionPath…)}
{currentView === 'evolution' && canRebirth(gameState) && (…botão Renascimento…)}
{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId && (…UnlockNudge…)}
{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-ultra' && !gameState.demoCharacterId && (…frase "O padrão ainda não chegou ao limite do que esta forma ocupa."…)}
{currentView === 'evolution' && gameState.rebirth && (…linha "Já aconteceu, uma vez. Renasceu do … como …. É ele. Ainda é ele."…)}
```

- **`not-ultra`** (copy §5.4): é **uma frase em `sm2Hint`**, `data-rebirth-block`,
  sem botão e sem convite — a própria página já conta a escada. O `CLAUDE.md`
  ("`not-ultra` não vira convite") continua verdadeiro: o que entrou é
  contexto, não saída. **`already-used`** segue sendo a linha de registro, que
  ganhou a família obrigatória da §11 ("É ele. Ainda é ele." / "Same pattern.
  Still the same one.") — ⚰️ dizia só "Renasceu do X como "Y"".

- **Demo × pago no convite**: `variant={gameState.accountTier === 'paid' ? 'reveal' : 'buy'}`;
  `onOpen` chama `setUpgradeRitual(true)` para quem já pagou e
  `setUnlockReason('evolution')` para quem não pagou.
- **`EvolutionPath`**: o visor da forma atual é **um gesto com dois sentidos**
  (`acf4413e`, canvas Evolução V2, `DECISOES-WIREFRAME.md` §24):

  ```ts
  const evoluiNoToque = prontoParaEvoluir && !incubating && !evolutionLocked && Boolean(onEvolveRequest);
  const acaoDoVisor = evoluiNoToque ? onEvolveRequest : onToggleEvolutionLock;
  ```

  Com a barra cheia, sem incubação e o cadeado aberto o toque **evolui** (`onEvolveRequest` →
  `handleEvolveRequest`, o mesmo do botão "EVOLVE" da Home); nos outros casos
  alterna `evolutionLocked` (`onToggleEvolutionLock` → `handleToggleEvolutionLock`).
  O `aria-label` do visor (`rotuloDoVisor`) diz qual dos dois vai acontecer
  ("Pronto — toque para evoluir" / "Evolução segurada, toque para liberar" /
  "Evolução liberada, toque para segurar"). O `title` do visor (`tituloDoVisor`)
  nomeia o gesto desde `84ae4937` (21/09/2026, copy §3.2/§3.3): "Encostar" /
  "Touch it" quando evolui, "Soltar" / "Release" quando segurada, "Segurar" /
  "Hold" quando liberada — ⚰️ era "Evoluir" / "Liberar evolução" / "Segurar
  evolução"; nunca "travar"/"lock" em texto de jogador. A frase da barra
  (`fraseProgresso`) com a barra cheia: cadeado aberto → "O padrão está pronto.
  Ele espera você encostar. Toque no seu Soulmon para evoluir." (a 2ª oração
  continua ensinando o gesto — `evolucaoManual.contract.test.ts` exige); cadeado
  fechado → "Ele espera. Esperar não tira nada dele." ⚰️ ("Pronto para evoluir —
  mas você segurou a evolução."). A dica sob o cadeado fechado perdeu "nos dias
  difíceis": "Segurar a forma não protege os corações." O mesmo estado do cadeado continua
  como botão de 44px (`data-lock-button`, `aria-pressed={evolutionLocked}`) para
  quem não descobre o gesto; segurada = placa "ON HOLD"/"SEGURADA" dentro do
  vidro. ⚰️ Até `2580b73a` o toque no visor **só** alternava o cadeado.
  **Incubação** (WP4.29, D-G8c, `8be8f9c5`/`355959b4`): `EvolutionPath` recebe
  `incubating={incubandoAgora}`. Com a barra cheia e a incubação correndo, o
  toque **não evolui** (o `!incubating` do `evoluiNoToque` acima) — e a frase da barra (que vem **antes** do ramo do cadeado) e o `aria-label`
  do visor dizem por quê: "A próxima forma está tomando corpo. Leva um tempo —
  volte quando quiser, ela espera por você." / "A próxima forma está tomando
  corpo". Sem número nem unidade de tempo (R-I). ⚰️ Antes de `355959b4` a
  página dizia "toque para evoluir" durante a incubação. A mesma frase aparece
  na Home como aviso `'incubacao'` (§3.2).
  **Nós da árvore** são `SoulNode` (SVG por token, `evolution/nodeArt.tsx`);
  ⚰️ os PNGs de nó saíram junto com o `EvoTrail`.
  **Estados de sprite**: `generatingSprites` (o card `GERANDO`), `onRetrySprite`,
  `onRevertVisor`, `onTuneVisor`, `onSeenTune`; `carePattern` só é passado
  quando `carePatternReading.confident`.
- **Régua**: `src/components/evolucaoManual.contract.test.ts` (a régua VIVA da
  evolução manual), `EvolutionPath.estados.render.test.tsx`,
  `EvolutionPath.silhueta.render.test.tsx`, `EvolutionPath.sprite.render.test.tsx`,
  `EvolutionPath.credencial.render.test.tsx`,
  `EvolutionPath.sintonia-anuncio.render.test.tsx`.

### 4.11 `EvolutionCeremony` e `EvolveTaskModal`

- **`EvolutionCeremony`** — **Chega por**: `handleEvolveRequest`, que só abre se
  o destino for diferente do estágio atual:

  ```ts
  if (next !== evolutionStage) setEvolutionCeremony({ from: evolutionStage, to: next });
  ```

  **Aparece quando**: `{evolutionCeremony && (…)}` · **Sai para**:
  `onEvolved={handleEvolve}` (o commit) e `onClose={() => setEvolutionCeremony(null)}`.
  **O que se vê**: um **visor de tela cheia** (`b83f30cd`, canvas Evolução D-E6):
  o vídeo é o cenário **dentro** do vidro; os sprites da forma atual e da
  próxima intercalam por `TOTAL_MS` (3000 ms), brancos, até estabilizar na
  evoluída — **nunca abaixo de `MIN_STEP_MS` (340 ms)** entre trocas (WCAG
  2.3.1; antes o intervalo caía a 55 ms). Fora do vidro, a faixa "EVOLVED INTO" +
  nome + data (`reachedAt`) + o primário "Seguimos juntos" / "We keep going
  together" (`84ae4937`, 21/09/2026, copy §3.2 — a mesma saída do
  `MilestoneCeremony`; ⚰️ era "Vamos seguir juntos" / "Let's keep going together").
  É `role="dialog"` + `aria-modal` com foco preso (`useDialogA11y`); **Escape só
  depois de `done`** — fechar antes seria abandonar a evolução no meio, e o commit
  acontece em `onEvolved`.
  **Movimento reduzido** (`usePrefersReducedMotion`): muda a ESTRUTURA, não a
  pausa — quadro parado antes (64) → `arrow_forward` → depois (128), sem burst e
  sem vídeo, com a evolução commitada na montagem; a cerimônia continua
  esperando o gesto.

- **`EvolveTaskModal`** — **Aparece quando**:

  ```jsx
  isOpen={evolveModalStage !== null && evolutionCeremony === null}
  ```

  ⚠️ O `evolutionCeremony === null` é o encadeamento que **faltava**: evoluir
  abria a cerimônia (z-500) e este modal montava por baixo (z-50), reaparecendo
  cobrando "crie mais atividades" quando ela fechava.
  **Sai para**: `onCreateTask` → `setEvolveModalStage(null)` + `setCreateModalOpen(true)`.
  **Número que ele mostra**: `registeredForDay(gameState, new Date().getDay(), new Date().toDateString())`
  — cadastradas **para hoje**, nunca `activities.length` cru; o texto
  "complete N tasks per day" tem plural real (`acf4413e`, X7).
  **Superfície**: desde `acf4413e` é um `RitualDialog` (`ritual/RitualKit.tsx`,
  `zIndex={200}`) — trap, Escape e devolução de foco vêm dele.
- **Régua**: `src/components/filaDeAvisos.contract.test.ts` trava a string do
  `isOpen`.

### 4.12 `RebirthModal`

- **Chega por**: botão "Renascimento" da página de Evolução ·
  **Aparece quando**: `{rebirthOpen && (…)}`, e o botão que o abre só existe sob
  `canRebirth(gameState)`.
- **Sai para**: `onConfirm` (async — só fecha com `ok`) e `onClose`.
- **Estados**: a confirmação exige **um segundo toque** (`confirmando`); a perda
  é dita **antes** de qualquer escolha, com nome e número, e o que **não** se
  perde é dito junto. "Renascer" sem nome de criatura (`podeSeguir = criaturaLimpa.length > 0 && !ocupado`)
  é inerte **por superfície** (`aria-disabled={!podeSeguir}`, tinta `muted`),
  nunca opacidade; o erro é um
  `role="alert"` âmbar (`acf4413e`).
- **Recusa motivada**: `rebirthRefusal` distingue `not-paid` / `not-ultra` /
  `already-used`; só `not-paid` vira convite (`UnlockNudge` com `reason="evolution"`),
  e só quando o convite do demo não está na mesma tela (§4.10).
- **Dono**: `src/components/RebirthModal.tsx` + `src/utils/rebirth.ts`.

### 4.13 `UnlockNudge` e `UnlockAccountModal`

- **`UnlockAccountModal`** — **Aparece quando**: `{unlockReason && (…)}`, na raiz
  do `App`. **Nunca abre sozinho.** `UnlockReason = 'task-limit' | 'evolution' | 'report' | 'shop' | 'reveal-demo'`
  (o quinto entrou em `a1181a5b`, com o código `revealDemo` no schema de
  telemetria, cliente e servidor).
  **Sai para**: `onUnlocked={handleAccountUnlocked}` (só depois de o **servidor**
  confirmar) e `onClose={() => setUnlockReason(null)}`.
- **`UnlockNudge`** — ⚠️ **Divergência com o `CLAUDE.md`**, que fala em "dois
  lugares" e depois corrige para "TRÊS", **e cita o `EditModal`, que já não
  monta o convite**. Medido em 20/09/2026
  (`grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l` → **6**,
  o mesmo número de 09/09/2026 com um lugar trocado):

  | Onde | `reason` | Condição |
  |---|---|---|
  | `CreateModal.tsx` | `task-limit` | teto do demo |
  | ⚰️ `EditModal.tsx` | `task-limit` | **saiu em `d044fb2e`** (A1 do canvas Atividades: um modal de criação só — o `EditModal` não cria mais, então não há teto para bater) |
  | `SoulmonOnboarding.tsx` (`REVEAL_DEMO`) | `reveal-demo` | `step === REVEAL_DEMO && demoReading` — novo em `a1181a5b` (§2.3) |
  | `mercado/MercadoSheets.tsx` (⚰️ antes `ShopModal.tsx`, apagado na minimal-ui F5) | `shop` | `seg === 'shop' && accountTier === 'demo' && onUnlock` |
  | `DailyReportModal.tsx` | `report` | `showOffer` (`ofereceNoRelatorio`, com cap semanal por `offerShownWeek`) |
  | `App.tsx` (Evolução) | `evolution` | `currentView === 'evolution' && gameState.demoCharacterId` |
  | `App.tsx` (Renascimento) | `evolution` | `rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId` |

- **Régua**: `src/components/ofertaDoisCanais.contract.test.ts`,
  `UnlockAccountModal.copy.render.test.tsx`,
  `UnlockAccountModal.dismiss.render.test.tsx`.

### 4.14 Os jogos

| Jogo | Chega por | Sai para | Estados | Dono |
|---|---|---|---|---|
| `DungeonGame` | lote da área Exploração (⚰️ card na `ActivitiesPage` até a F5) | `onExit` | `phase`: `intro` → `attack`/`defend`/`result` → `enemy-down` → `floor-clear` → `run-complete` \| `lost`; `floor` até `MAX_FLOORS` (5); o bônus por camada `clearBonus` passa por `DUNGEON_BITS_FACTOR` (desde 30/09/2026 → 4/6/8/10/12 Bits; ⚰️ 10/15/20/25/30) e a folha `MasmorraSheet` mostra `BitsHoje`. **O vocabulário na tela é o da bíblia desde `84ae4937` (21/09/2026, copy §4)**: o subtítulo diz "Camada N de 5" / "Layer N of 5" (números de `MAX_FLOORS`, nunca à mão); o primário do `intro` é "Descer" / "Go down" (⚰️ "Entrar na masmorra"); `enemy-down` diz "‹nome› parou de insistir aqui." (⚰️ "derrotado!" — nenhuma criatura da Malha morre); `floor-clear` = "Camada N limpa."; `run-complete` = "As 5 camadas ficaram para trás." + a frase do Glitchtama "com um dia inteiro preso dentro" + "Descer de novo" (⚰️ "Nova run"); `lost` = "Você subiu. A descida ficou pelo caminho — e só ela." + "Seus corações continuam intactos." | `DungeonGame.tsx` |
| `ArenaGame` | lote Duelo da área Arena (⚰️ card na `ActivitiesPage` até a F5) | `onExit` | usa a ficha (`skills`, elemento) | `ArenaGame.tsx` |
| `DinoGame` | **Salão de Jogos** (`SalaoSheet` → `onStart('dino')`; desde 30/09/2026 — ⚰️ lote da Exploração e card da `ActivitiesPage` até a F5) | `onExit` | `onScore={onDinoScore}` alimenta o recorde; **Obstáculos** (rodada 3, 30/09/2026): ossos e cristais de fogo frio, cada um dos quatro degraus (`OBSTACLE_TIERS`) com TRÊS variantes `a`/`b`/`c` sorteadas no spawn, cada uma com a própria caixa de colisão medida (`hit` na horizontal e `top` de vazio acima); o título da folha é "Corrida com obstáculos"/"Obstacle Run". O corredor é `lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(…)` (`utils/lineIcons.ts`, rodada 2, 21/09/2026 — o ícone-ficha 64² da linha; sprite a 0,25× quando o estágio não é de linha) | `DinoGame.tsx` |
| `RPSGame` | **Salão de Jogos** (`SalaoSheet` → `onStart('ppt')`; ⚰️ lote único `ppt` da área Jogos e card da `ActivitiesPage` até a F5) | `onExit` | duelo curto | `RPSGame.tsx` |
| `EcoGame` · `BolhasGame` (`mode="foco"`) · `TrocaGame` · `PicrossGame` · `RevisaoGame` | **Ateliê da Mente** (`MenteSheet` → `onStart(id)`; `MenteGame` = `'eco' \| 'bolhas' \| 'troca' \| 'picross' \| 'revisao'`) | `onExit` | cada jogo tem o vidro pintado (`GameVisor scene=`): `ATELIE_SCENE` na Eco/Revisão, `REFUGIO_SCENE` nas Bolhas, `trocaCeuScene`/`trocaGrutaScene` na Troca, e sprites 48² de `MINI_FX` (pedras da Eco por FORMA — anel, losango, quadrado, triângulo —, bolha-sonho/fiapo/pop/fumaça nas Bolhas) — leva `visores`, 01/10/2026, `utils/visorScenes.ts`; pagam Bits pelo **mesmo funil** (`onEarnPoints`, teto diário); `PicrossGame` e `RevisaoGame` recebem `todayKey` (`playerDayIso`) e a `RevisaoGame` os cartões do save (`review` / `onReviewChange` → `gameState.review`); a linha da Revisão mostra "N para hoje" (`dueCards`) ou `REVIEW_SESSION_BITS` | `mente/*.tsx` |
| `RespiracaoGame` · `BolhasGame` (`mode="calma"`) | **Refúgio** (`RefugioSheet` → `onStart('respiracao' \| 'bolhas-calmas')`; ou o convite da fila 2, §3.2 `'refugio'`, que abre a respiração direto) | `onExit` | **não recebem `onEarnPoints`**: não pagam, não pontuam; vidro `REFUGIO_SCENE` e a bolha da respiração é o sprite `MINI_FX.bolhaRespiro` a 144 px (3×); rodapé `SupportNote` (aviso de ajuda, `tel:188` em PT) sempre visível na folha | `refugio/*.tsx` |
| `NightmareBattle` | **fila de intersticiais** | `onWin={handleNightmareWin}` / `onLose`/`onClose` = `closeNightmare`; desde `6fe6c73a` é um `RitualDialog` (trap, Escape, devolução de foco) | perder não custa nada, e a tela diz isso | `NightmareBattle.tsx` |
| ⚰️ `PlayCard` | **não é mais montado** (`f5ead7c0`, 16/09/2026) — Brincar é a célula `play` do deck do `CompanionHUD` (§4.2) | — | `available` / `canPlay` / `playedToday` (`playDeck` no `App.tsx`) | `PlayCard.tsx` segue no repo sem consumidor |

**Os três prédios de Jogos (30/09/2026)** — `AreaView` monta `SalaoSheet`,
`MenteSheet` ou `RefugioSheet` conforme `open?.id` (`'salao'`/`'mente'`/`'refugio'`)
e o jogo por cima quando `game` é setado (`start`); cada linha de jogo do Ateliê e do Refúgio é uma porta
(`GameRow`: nome, o que pede, descrição, "até N Bits" ou meta, CTA "Jogar"/"Abrir"/"Começar").
`Salão`, `Ateliê` e a `Masmorra` mostram `BitsHoje` ("Bits de minijogo hoje: X de
`MINIGAME_BITS_PER_DAY`", de `minigameBitsToday` via `PlayHandlers.minigameBitsToday`; cheio
= jogos abertos, Bits voltam amanhã); o Refúgio não mostra. **Mudos:** `DinoGame` e
`RPSGame` deixaram de chamar `playTaskComplete` ao vencer (C-11, 30/09/2026 — vencer
minijogo não é concluir tarefa, R-CAT).

**Chrome comum dos quatro jogos** (`src/components/games/GameKit.tsx`, novo em
`6fe6c73a`, canvas Jogos §25): `GameRoot` (a página, `position: fixed`, **reserva a
faixa da nav inferior** — a nav continua visível, e sair pelo Início é caminho
legítimo) › `GameHeader` (título + × 44 que chama `onClose` = o `onExit` do jogo, e
é **o primeiro interativo** da tela) › `GameVisor` (o minijogo é o conteúdo do
vidro) › `HpBars`/`TimingBar`/`FxPopup` (`role="status"`) embaixo — ⚠️ a LUTA da Masmorra, do Pesadelo e da Arena saiu do visor e é a `BattleStage` em tela cheia (04/10/2026, REGISTRO §20.10; o visor segue nos lobbies, na Home e no Dino) (`TimingBar` mora em
`src/components/pixel/TimingBar.tsx`; os outros dois no `GameKit`). Sem `Suspense`
novo: ⚰️ o ponto de montagem era `{openGame === '<id>' && (…)}` na
`ActivitiesPage`; desde a minimal-ui F5 é `{game === '<id>' && (…)}` no
`AreaView`, por cima da área, dentro de um `Suspense`.

**`NightmareBattle` — aparece quando** (efeito no `App.tsx`, transcrito):

```ts
if (nightmareOpen) return;
if (isSleeping) return;
const hour = now.getHours();
if (hour < 4 || hour >= 12) return; // só de manhã
const rest = gameState.rest;
if (!rest) return;
if (!hasPendingNightmare(gameState.nightmares ?? EMPTY_NIGHTMARES, rest, now)) return;
setNightmareOpen(true);
```

`não percorrida` — depende de noite registrada e da janela 4h–12h.

**Brincar — a célula `play` do deck**: `available: jaConcluiuAlgo` (`playDeck`,
`useMemo` no `App.tsx`). ⚰️ O `PlayCard` era montado sob `{jaConcluiuAlgo && (…)}`;
o gate é o mesmo, mas hoje é **célula inerte, não card ausente** — antes da
primeira conclusão `canPlay` exige energia ≥ `PLAY_ENERGY_COST` (1), energia vem
de comida e comida vem de concluir, então no dia 1 a célula nasce inerte com o
rótulo "Brincar — depois da primeira atividade".

**Cenas da masmorra (30/09/2026):** os cinco andares clássicos deixaram de ser degradês CSS (dois deles magenta, fora do kit) e viraram CINCO cenas pintadas 1080×1920 na paleta petróleo/turquesa/cobre da Home (`utils/dungeonScenes.ts`, `bg/dungeon-classic-*`; ⚰️ Retro Pet/VHS/Neon Sunset/CRT/Glitch como degradês); a cena não é gravada no save, só os nomes mudaram. `bg` agora é o SHORTHAND `url(...) center/cover <cor>` (cor de reserva = média da cena).

**`MAX_FLOORS`** mora em `src/components/DungeonGame.tsx` (medido em 09/09/2026;
o `CLAUDE.md` já registra que ele **não** está em `utils/dungeon.ts`).
⚠️ **Divergência de vocabulário com o `CLAUDE.md`** (linha ⚔️ Masmorra: "uma run =
5 andares", "Concluir os 5 andares"): desde 21/09/2026 o jogador lê **descida** e
**camada**; `run`/`andar`/`floor` seguem sendo os nomes de código (`MAX_FLOORS`,
`floor`, `startRun`, `'run-complete'`). A mecânica não mudou — só o texto.

### 4.15 Torneio — `currentView === 'tournament'`

**Chega por**: área Arena → lote Torneio (`AreaSheet`, minimal-ui F5); ⚰️ antes,
`onOpenTournament` da `ActivitiesPage` · **Sai para**: fechar a folha ou voltar ao Mapa.

- **O que se vê/faz** (desde 02/10/2026): o menu tem **três entradas só de ícone** —
  Desafiar (`swords`), Missões (`task_alt`) e Loja (`storefront`, só com `shop`); o nome
  fica em `aria-label`/`title`. A folha **abre em Desafiar** (cai direto no combate). A
  linha do topo é só `tournamentWindowLabel` ("Dias restantes: N" / "Remaining days: N")
  + a Honra. ⚰️ A aba "Faixa" saiu do menu: a **faixa** atual virou um **indicador no canto
  direito da linha do título** (`data-tier-indicator`, `TierMark` 32 px, portal para o
  `headSlotRef` do `AreaSheet`); tocar abre a **folha das faixas** (`RitualDialog`, seta de
  voltar no topo esquerdo `data-tiers-back`) com a faixa atual, as cinco insígnias, o
  progresso e "só sobe". A faixa (`getTierStanding`) continua **antes** do ranking; o ranking é uma **janela de ±`RANK_WINDOW` (3) posições**, com a season inteira a um toque; o
  placar de derrota é tinta neutra; perder também rende Honra e a tela diz. A marca da faixa (`TierMark`) é, desde a rodada 7 (A1, 04/10/2026), um GLIFO sem box (`TIER_ICON`: park · military_tech · star · emoji_events · auto_awesome · diamond · swords para Madeira→Mestre; 32 px na faixa atual e 24 px na escada de sete); `TIER_INSIGNIA_ART` ficou vazio (as insígnias antigas da rodada 3 não casam com as faixas novas — arte de metal por faixa é o prompt P3 do dono). A aba de Missões do Torneio usa o "?" amarelo (`question`, A2). O oponente continua com o sprite do ESTÁGIO REAL dele; `dueloArt.ts` (`dueloOponenteArt`, seis retratos de criatura por elemento) está **sem chamada** (DUELO-1 em `PERGUNTAS-DO-DONO.md`).
- **Estados**: **requisito** — desde 02/10/2026 (H13) NÃO há interruptor de PvP (o
  personagem já nasce nele). Abaixo do Vínculo `BOND_PVP_MIN_LEVEL` (5) a aba Desafiar
  mostra o card `data-torneio-requisito`: "O Torneio abre no Vínculo 5", barra de
  progresso, onde a pessoa está e quanto falta, o porquê (é social) e "sem pressa"; o
  gate real continua sendo decidido pelo servidor. Aberto, sobra o aviso do apelido
  público (`data-torneio-aviso-publico`).
- **Efeitos ao jogar**: `onEarnEmblems` soma Honra **e** chama
  `contarMissao('tournament-match')` (conta a PARTIDA, não a vitória);
  `onMatchPlayed` credita XP de Vínculo.
- **Duelo fantasma (30/09/2026)**: se o oponente traz `opp.duel` e o servidor mandou
  `myDuel` (`r.me?.duel`), o "Desafiar" chama `startDuel` (o servidor gasta a partida e
  sorteia `seed`) e `setDuel(...)`; o componente devolve `<DuelScreen>` **no lugar** da
  página, em **TELA CHEIA** (`games/BattleStage.tsx`, rodada 5/I10, 02/10/2026): o background da
  Arena cobre a viewport, o seu Soulmon fica embaixo à esquerda (grande) e o oponente em
  cima à direita (menor), cada um com as barras de HP e de ENERGIA EM CIMA do personagem
  (desde 04/10/2026, REGISTRO §20.10, e os lutadores ficaram BEM maiores); a barra de
  cheer (24 toques, lenta; "?" com a explicação — nenhuma frase na cena) fica no pé, ao
  lado do **mascote da torcida** (um bichinho de pixel no canto inferior direito que pula e
  grita "VAI!"/"CHEER!" a cada toque), e o **X no canto superior
  direito** pede confirmação ("Sair do duelo? Conta como derrota."). Os pets lutam sozinhos
  num passo de ~1,7 s (~35–42 s no total; investida ou projétil com a arte de skill do
  ELEMENTO; o especial é o projétil grande); toque em QUALQUER lugar enche a barra de cheer e,
  cheia, ela despeja energia no pet; **energia cheia de qualquer um dos dois = o ESPECIAL,
  DIRETO, sem mecânica de uso nem de defesa**. A torcida só soma; não torcer não tira nada. Fim da luta (`phase === 'done'`,
  "Conferindo o resultado…") → `onDone(cheers)` → `resolveMatch(opp, cheers)` →
  `playMatch(saveId, opp.id, cheers, forfeit)`. **Sair** ("Sair do duelo"/"Leave the
  duel", `onClose`, inerte em `done`) → `leaveDuel` → `resolveMatch(opp, [], true)` =
  **derrota**. Sem a ficha de luta (servidor antigo) a partida segue direto por
  `resolveMatch(opp, [])`. Falha → `fightError` ("A partida não aconteceu. Tente de
  novo."). A tela nasce **muda** (R-NOVA, `docs/SOM.md`); o Guia (`GuideModal`) ganhou
  o parágrafo "No duelo do Torneio os pets lutam sozinhos…". Dono: `DuelScreen.tsx`
  (regra em `functions/api/_duel.js`); `não percorrida`.
- **Resultado da partida**: um `RitualDialog` (`zIndex={400}`, `3f359acc`) com as
  duas criaturas em mini-visor; "Fight" tem nome acessível "Fight — challenge
  ‹nome›" (WCAG 2.5.3). (⚰️ o switch de PvP travado, inerte por forma, saiu em 02/10/2026.)
- **O que os mini-visores mostram** (`66e32d43`, rodada 2, 21/09/2026 — D-J13
  cumprida): o oponente a 64 é `lineIconForStage(o.stage, 64) ?? getSpriteForStage(o.stage)`;
  a linha do ranking a 32 é `lineIconForStage(r.stage, 32)` com `imageRendering:
  'pixelated'`, e cai no sprite a 0,125× com `imageRendering: 'auto'` (⚰️ o
  único caminho, "transição até os ícones 32²") quando o estágio não é de linha.
- **Dono**: `src/components/TournamentPage.tsx` · **Régua**:
  `TournamentPage.bondGate.test.tsx`.

### 4.16 `DailyReportModal` (+ humor, aventura, memórias, oferta)

- **Chega por**: a fila de intersticiais · **Aparece quando**:

  ```jsx
  {interstitial === 'dailyReport' && gameState.lastDayReport && (
  ```

  e o `showDailyReport` é ligado por um efeito com a trava de 1×/dia:

  ```ts
  if (readLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN) === report.date) return;
  setShowDailyReport(true);
  ```

- **Sai para**: `onClose` — que **primeiro** grava o marco de memória
  (`markMemoryShown`, idempotente; registrado ao FECHAR, não ao abrir) e depois
  chama `handleCloseDailyReport`.
- **O que se vê/faz**: o resumo do dia; o **check-in de humor** (5 carinhas,
  `moodToday={moodFor(…)}` / `onPickMood={handlePickMood}` — opcional e nunca
  alimenta pontuação); `onRecoverHearts`; a aventura da noite (`aventuraDaNoite`,
  com `adventureIsNew`); o `MemoriesCard` sob `memories !== null`
  (`memoryToShow` compara por **igualdade**, então o cartão aparece uma vez em 30
  e uma em 90 dias); e a **oferta** sob `showOffer={ofereceNoRelatorio}`, que ao
  abrir marca a semana **antes** (`offerShownWeek`) e chama `setUnlockReason('report')`.
- **Estados**: `soulGoal` volta em dias completos e no retorno de ausência.
- **As manchetes e as notas** (`84ae4937`, 21/09/2026, copy §2 — o mundo
  constata, sem `!`; a decisão ordena `welcome` → `degenerated` → `wasPerfect` →
  `heartsLost > 0` → o resto): `welcome` → "Que saudade!" (mantida, decisão 3 do
  dono); `degenerated` → "Ele recolheu para uma forma que se sustenta com menos."
  (⚰️ "Seu Soulmon voltou um estágio") **mais a nota** "Nada do que foi
  descoberto saiu. O caminho de volta é o mesmo caminho."; `wasPerfect` → "Um
  trecho fechou." (⚰️ "Dia completo!") **mais a nota** "A fagulha firmou.";
  `heartsLost > 0` → "Um dia mais devagar."; senão "Dia novo." (⚰️ "Novo dia!").
  A linha de corações com perda diz "O padrão afrouxou um pouco." (⚰️ "meio em
  recuperação" / "N em recuperação" — sem número, sem causa). `restDayUsed` →
  "A maré absorveu ontem. Nada foi cobrado. Ela recarrega na segunda." (⚰️ "usou
  a folga da semana"); `weeklyRelief` → "A maré devolveu um pouco. Semana nova."
  **Sem saldo** de folga em lugar nenhum (§10 da bíblia).
- **Dono**: `src/components/DailyReportModal.tsx` · **Régua**:
  `DailyReportModal.aventura.render.test.tsx`,
  `src/components/ofertaDoisCanais.contract.test.ts`, `src/narrativa.contract.test.ts`
  (vocabulário vetado).

### 4.17 `MorningCheckIn`

- **Chega por**: a fila · **Aparece quando**: `{interstitial === 'checkIn' && checkInPlanData && (…)}`,
  e o plano é congelado por um efeito com **quatro** guardas literais:

  ```ts
  if (checkInPromptedRef.current === hoje) return;
  if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
  if (!needsCheckIn(gameState, now)) return;
  const plan = checkInPlan(gameState, now);
  if (plan.habitsToday.length === 0 && plan.suggestedFocus.length === 0 && plan.carryOver.length === 0) return;
  ```

- **Sai para**: `onConfirm={handleCheckInConfirm}` (grava focos, conta missão,
  credita XP, emite `checkin_commit`) ou `onSkip={handleCheckInSkip}` (**marca o
  dia do mesmo jeito** — um ritual que reaparece por ter sido recusado é
  cobrança).
- **O que se vê/faz**: pendências de ontem primeiro, hábitos do dia, até
  `MAX_DAILY_FOCUS` focos, humor. Na segunda falta seguida o pet oferece a
  **versão reduzida**, e aceitar usa o **mesmo** caminho de conclusão
  (`onTinyHabit={handleToggleActivityCompletion}`).
  A **âncora** do hábito ("depois do café — na cozinha", `h.anchor.after`/`where`)
  é texto visível ao lado do nome (`data-habit-anchor`, 12 px `--sm2-muted`) desde
  `592e2c14` (A12 — ⚰️ vivia num `title`, que só existe no hover: no celular e no
  leitor de tela, nunca).
- **Dono**: `src/components/MorningCheckIn.tsx` · **Régua**:
  `MorningCheckIn.commit.render.test.tsx`,
  `MorningCheckIn.ofertaReduzida.render.test.tsx`.

### 4.18 `MorningDream`

- **Chega por**: a fila · **Aparece quando**: `{interstitial === 'dream' && morningDream && (…)}`.
  As guardas do efeito, transcritas:

  ```ts
  if (isSleeping) return;
  if (hour < 4 || hour >= 12) return; // só de manhã
  if (!rest) return;
  if (dreamShownRef.current === key) return;
  if (!rest.nights.some(n => n.date === key)) return; // nenhuma noite registrada
  if (readLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN) === key) return;
  ```

- **Sai para**: `onClose={() => setMorningDream(null)}`.
- **Estados**: `dream === null` → um bom-dia neutro. **Nenhuma variante julga a
  noite** — sem score, sem duração, sem nota.
- **Dono**: `src/components/MorningDream.tsx`. `não percorrida`.

### 4.19 `WeeklyReportCard`

- **Chega por**: posição 2 da fila de avisos · **Aparece quando**:
  `needsWeeklyReport(gameState, agoraA)` (checado por **semana**, não por dia).
- **Sai para**: `onDismiss={handleDismissWeeklyReport}`.
- **O que se vê/faz**: constância por hábito, esforço concluído, categoria
  dominante, sonhos e `stackingSuggestion` — que devolve `null` sem dados
  suficientes, e o silêncio é a metade importante.
- **Dono**: `src/components/WeeklyReportCard.tsx`. `não percorrida` (domingo).

### 4.20 `MilestoneCeremony`

- **Chega por**: `setMilestoneCeremony({…})` quando um hábito cruza um marco.
- **Aparece quando**: `{milestoneCeremony && (…)}` — **fora das duas filas**, de
  propósito.
- **Sai para**: `onDone={() => setMilestoneCeremony(null)}`.
- **Estados**: `reducedMotion` é calculado no `App.tsx` por
  `window.matchMedia?.('(prefers-reduced-motion: reduce)').matches` e **só
  desliga as animações e o háptico** — a cerimônia é a mesma, com a mesma pausa.
- ⚰️ **Divergência fechada em `4f5d2aac` (20/09/2026)**: o comentário do `App.tsx`
  dizia que ela "some sozinha em 2,5s"; hoje diz "não pede nada além do gesto".
  O componente continua sem `setTimeout` (`grep -n "setTimeout" src/components/MilestoneCeremony.tsx`
  → vazio), é `zIndex: 300` e **espera o gesto**. Desde o canvas Rituais (§21) é
  um `RitualDialog` (`role="dialog"` + `aria-labelledby`), com o sprite e o emblema
  do marco (`emblemFor(tier)`) num vidro.
- **O texto do marco** vem de `MILESTONE_TEXT[tier]` no `App.tsx`; o de 66 dias
  diz "66 dias! Isso virou raiz." / "66 days! This one took root." desde
  `84ae4937` (21/09/2026) — ⚰️ dizia "virou parte de quem você é" / "is part of
  who you are", a pessoa como sujeito de um verbo de ser (L1 da bíblia). O botão
  de saída é "Seguimos juntos" / "We keep going together" (o EN era "Let's keep
  going together").
- **Dono**: `src/components/MilestoneCeremony.tsx` · **Régua**:
  `MilestoneCeremony.render.test.tsx`.

### 4.21 `ProtectProgressModal`

- **Chega por**: um efeito com quatro guardas + um `setTimeout(15_000)`:

  ```ts
  if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
  if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;   // já protegido
  const last = readNumber(STORAGE_KEYS.PROTECT_PROMPT_AT, 0);
  if (Date.now() - last < 7 * 24 * 3600_000) return;
  if (!jaEvoluiu && !jaEngajou) return;
  ```

- **Aparece quando** (o **gate**, que substituiu a esperança depositada no timer):

  ```jsx
  {protectPrompt && interstitial === 'welcome' && (
  ```

- **Sai para**: `onDismiss={dismissProtectPrompt}` (só adia o próximo pedido) ou
  `onConfirm={handleProtectProgress}`. **Nunca bloqueia.**
- **Dono**: `src/components/ProtectProgressModal.tsx` · **Régua**:
  `src/components/filaDeAvisos.contract.test.ts` (trava a string do gate).

### 4.22 Biblioteca — `currentView === 'library'`

**Chega por**: área Hall → lote Biblioteca (minimal-ui F5, decisão D4); ⚰️ antes,
linha "Biblioteca" do menu sanduíche da `BottomNav` (⚰️ o menu sanduíche inteiro saiu em 07/10/2026) · **Sai para**: fechar a
folha ou voltar ao Mapa.

- **O que se vê/faz**: uma ação dominante por linha — tocar no jogador abre o
  `PlayerDetailModal` (e chama `onVisitPlayer` → `contarMissao('friend-visit')`).
  Presentear e adicionar/remover amigo são botões com rótulo e 44px. NPCs de
  `utils/libraryNpcs.ts` aparecem misturados aos jogadores reais, marcados por
  `isNpc`.
- **Estados**: **quatro, e é de propósito** — carregando · vazio · erro · sem
  rede. ⚰️ A versão anterior tratava falha de rede como "nenhum jogador
  encontrado" (`.catch(() => setPlayers([]))`), a pior mentira possível numa tela
  social.
- **`CoopPanel`** ⚰️ (corrigido em 29/09/2026 — dizia "montado dentro da página"): o único
  mount na Biblioteca passa `view`, que esconde as abas, então a aba "Grupo" é
  **inalcançável**; a Guilda vive nas duas salas do [§4.26](#guilda-tela), e `CoopPanel`
  é só um reexport de `GuildSheet`. A meta que autoriza o fio vem do `App.tsx`
  (`fioMetaCumprida`, pela meta de CORAÇÃO) — o painel não tem segunda cópia dela.
- **Superfícies desde `f757ed26`** (canvas Social, `DECISOES-WIREFRAME.md` §28):
  o `PlayerDetailModal` é um `RitualDialog` com × "Fechar"/"Close"; as abas são
  `role="tab"`; ação sem rede/sem saldo é **inerte por forma** (tracejado +
  `muted` + `aria-disabled`, fora do Tab); alertas `role="alert"` em âmbar (⚰️ o
  `danger-ink` saiu); a criatura do outro aparece em `MiniGlass` (nunca avatar).
- **Dono**: `src/components/LibraryPage.tsx`, `CoopPanel.tsx`,
  `PlayerDetailModal.tsx` · **Régua**: `LibraryPage.amigos.render.test.tsx`,
  `CoopPanel.render.test.tsx`, `PlayerDetailModal.semMetrica.render.test.tsx`.

### 4.23 Configurações — `currentView === 'settings'`

**Chega por**: botão de avatar do topo da Home (`ProfileAvatarButton` → `goTo('page:settings')`; ⚰️ antes, a linha "Configurações" do menu sanduíche, removido em 07/10/2026) · **Sai para**: a barra.

Três blocos, com condições literais:

```jsx
{currentView === 'settings' && (…SettingsPage…)}
{currentView === 'settings' && (…RestWindowCard…)}
{currentView === 'settings' && stepsAvailable === true && gameState.stepsConsent !== 'declined' && (…StepsCard…)}
```

- **Painel de GM / GM panel** (29/09/2026): `GmPanel` (`src/components/GmPanel.tsx`) é um grupo extra das Configurações, **só desenhado para o administrador** (`useAdmin() === true`; o `App` só passa a prop `gm` a ele — para os demais o grupo não existe no DOM). Ações: dar saldo (Bits e Honra 999999), desbloquear tudo, adotar o Corvinho (só se ainda não é), encher cuidados, ir para uma das 11 formas, somar 1/7/30 dias completos. Aviso na tela: a mudança vai para a conta inteira (M-2, o save sobe à nuvem). Regra em [02 §60](02-REGRAS-DE-NEGOCIO.md#administrador-gm).
- **`SettingsPage`**: grupos por intenção (`grep -c "<Group title=" src/components/SettingsPage.tsx`
  → **9** em 21/09/2026 depois de `980bc84c`, dois deles condicionais — "Sua
  história" só sob `redeemed && onToggleShowRedeemed`, "Som" só sob
  `onToggleSound`; ⚰️ "8" era a contagem antes de `980bc84c` no mesmo dia e
  "cinco grupos" a de 09/09/2026), uma ação dominante
  (entrar/sincronizar). Contém `AccountSection` (conta e compras, com
  "Restaurar compras" — exigido pela Play), `AccountDataSection` (exportar e
  apagar), `InstallPrompt` (cartão, **não** modal) e os botões que abrem o
  `GuideModal` (`onOpenGuide`) e o `HelpModal` (`onOpenGlossary`).
  **Grupo "Sobre" / "About"** (`5b91717c`, 21/09/2026 — os três limites da §16
  da bíblia, em voz de PRODUTO, sem metáfora): três parágrafos `sm2Text` — o
  Soulmon "não avalia, não diagnostica, não trata e não substitui acompanhamento
  de saúde"; o questionário "não é um teste validado" e o mapa astral "não prevê
  nada"; o app "não sabe nada sobre a sua vida além do que você escreveu nele" —
  e um `sm2Hint` de fecho ("Nada do que aparece aqui é uma afirmação sobre a sua
  saúde, a sua mente ou o seu futuro"). Sempre montado, entre "Ajuda" e "Seu
  ritmo". Desde `42b07bec` o grupo ganhou três linhas (⚰️ "sem botão, sem
  link"): o **aviso de IA** (decisão #22, tom de fato — "A imagem da sua criatura
  e as falas do chat são geradas por IA (Higgsfield e Gemini para a imagem, Groq
  para a conversa)"), o `ActionRow` **"O que o chat recebe"** →
  `/privacidade.html#chat-contexto` (EN: `#chat-context`), e a linha de **feedback** `FeedbackRow`
  (no grupo **Ajuda** desde `a6c1cd8a` — que desde `592e2c14`, QA Rodada 2 A4/A5/A6,
  também tem o `ActionRow` **"Termos de Uso" / "Terms of Use"** → `/termos.html`
  (⚰️ os Termos não tinham link dentro do app) e a **Política** abrindo por idioma:
  desde 30/09/2026 os dois documentos são **inglês primeiro**: EN abre a página
  sem âncora e PT vai para **`#pt`** (`/termos.html#pt`, `/privacidade.html#pt`;
  ⚰️ antes era PT no topo e EN em `#en`; ⚰️ antes disso abria sempre a versão PT), com o sufixo só-para-leitor-de-tela "(abre em nova
  aba)" / "(opens in a new tab)" em todo `ActionRow` externo — o `mailto:` não
  ganha o sufixo; régua `SettingsPage.sobre.render.test.tsx`)
  ("Falar com quem faz o Soulmon" / "Talk to the people who make Soulmon", hint
  "Abre seu e-mail para <endereço>. A versão do app já vai preenchida.") — um `mailto:` para
  `FEEDBACK_EMAIL` com assunto "Soulmon", `APP_VERSION`, 8 caracteres do `saveId`
  e `Origem: configurações` (`src/components/FeedbackLink.tsx`; não é formulário porque
  não há backend de suporte). **Desde `a6c1cd8a` (QA Rodada 1, design-critic B3/C1/C2) a linha de
  feedback mora no grupo AJUDA**, logo acima da linha "Soulmon `APP_VERSION`" (que mostra
  **1.1.4**, vinda do `package.json` via `__APP_VERSION__` — ⚰️ "1.0.2"); o aviso de IA
  passou a dizer "A imagem da sua criatura, as falas do chat e alguns sons (evolução,
  regressão e conclusão de tarefa) são gerados por IA (…), sem revisão humana. O chat não é
  um serviço de emergência."; e o fecho da §16.3 é `sm2Text` como os outros dois limites
  (⚰️ `sm2Hint`). O `ActionRow` de `mailto:` abre sem `_blank` (`FormKit.tsx`). Régua:
  `src/components/SettingsPage.sobre.render.test.tsx`.
  **Grupo "Som" / "Sound"** (`980bc84c`, 21/09/2026 — achado do
  doc-mantenedor: o `SettingsModal` ficou sem gatilho e com ele o mudo e a
  trilha eram inalcançáveis): dois `SwitchRow`, entre "Sua história" e "O que o
  Soulmon te manda" — **"Sons" / "Sound effects"** (`checked={!soundMuted}`,
  toque → `onToggleSound`, que é `handleToggleSound` do `App.tsx`: `setMuted`,
  `setSoundMuted`, `pausarTrilha()`/`retomarTrilha()`, `trackSoundOff()` só ao
  ficar mudo; hint "Confirmam o que você fez. Nunca tocam sozinhos.") e
  **"Trilha" / "Music"** (`checked={trilha}`, estado local iniciado por
  `trilhaPreferida()`; toque → `desligarTrilha()` se ligada, senão
  `ligarTrilha()` — este toque É o gesto da S2; hint com `soundMuted`: "Com os
  sons desligados, a trilha fica em silêncio.", senão "Duas camadas calmas, em
  loop. Para sozinha quando o app sai de vista."). O grupo **só monta se
  `onToggleSound` chegar** — sem a prop, nada de switch morto. Régua:
  `src/components/settingsSom.render.test.tsx` (PT/EN, o toque chega ao dono).
  Regra em [`02` §58-A](02-REGRAS-DE-NEGOCIO.md#som).
  **Estados do `AccountDataSection`**: `503` é **estado**, não erro — o botão
  nasce desabilitado com o motivo escrito, em tinta neutra.
- **`RestWindowCard`**: escolhe a janela (`onChangeWindow`), o switch "não quero
  ver métricas" (`onToggleMetrics`) e pede a permissão de push no momento-ouro
  (`onEnableReminder`, com `reminderPreview`). **Proibido nesta tela**: score de
  0 a 100 e gráfico de estágios do sono.
- **`StepsCard`**: **some por completo** sem sensor (PWA) e quando
  `stepsConsent === 'declined'` — `'declined'` é definitivo, porque insistir
  depois de um "não" é assédio. O consentimento vem **antes** do diálogo do
  sistema.
- ⚰️ **`SettingsModal`** (o painel rápido "Ajustes rápidos") **foi apagado em
  `4a8b8049`** (decisão do dono #37): `{settingsOpen && (…)}`, `settingsOpen`,
  `handleOpenAISettings` e o `lazy()` saíram do `App.tsx`, e a prop
  `onOpenAISettings` saiu de `CompanionHUD` e `ChatBox` (`grep -rn
  "onOpenAISettings\|SettingsModal" src --include=*.tsx` → só três comentários
  ⚰️, 21/09/2026). O
  caminho real de "Personalidade" continua sendo esta página (§4.23a), e o par
  "Sons"/"Trilha" só existe no grupo "Som" acima — a `SettingsPage` é o ÚNICO
  caminho do mudo (comentário da prop `soundMuted`).
- **Dono**: `src/components/SettingsPage.tsx` e vizinhos · **Régua**:
  `AccountDataSection.render.test.tsx`,
  `src/components/settingsTelemetry.render.test.tsx`,
  `src/components/settingsSom.render.test.tsx`.

### 4.23a `AISettingsModal` — o caminho real de abertura (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: **`SettingsPage` → `ActionRow` "Personalidade" / "Personality" →
`setShowAISettings(true)`**, no mesmo grupo que tem o switch "Conversa com IA" /
"AI chat". E a `SettingsPage` chega-se pela linha "Configurações" do menu ícone
da Home (botão de avatar → `goTo('page:settings')`; ⚰️ antes, o menu
sanduíche da `BottomNav`) · **Sai para**:
`onClose={() => setShowAISettings(false)}`; "Salvar" / "Save" faz
`onSave(settings)` e fecha no mesmo gesto.

⚠️ **Este é o achado do inventário de wireframes (`CONTA-14`), e os dois docs
discordavam**: o [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md) (19/08/2026)
diz "via `CompanionHUD`", e este documento não repetia o caminho. **O caminho
pelo `CompanionHUD` existe como FIAÇÃO e está MORTO** — medido em 13/09/2026:

```
$ grep -n "handleOpenAISettings" src/App.tsx
4072:  const handleOpenAISettings = useCallback(() => setSettingsOpen(true), []);
5032:                onOpenAISettings={handleOpenAISettings}

$ grep -n "onOpenAISettings" src/components/ChatBox.tsx
19:  onOpenAISettings?: () => void;
48:  onOpenAISettings,
```

A prop descia `App.tsx` → `CompanionHUD` → `ChatBox`, e o `ChatBox` **nunca a
chamava**: as duas ocorrências eram a declaração no tipo e a desestruturação.
Como `handleOpenAISettings` era o único chamador de `setSettingsOpen(true)`,
`{settingsOpen && (…SettingsModal…)}` **nunca montava** — e com ele ficava
inalcançável a **segunda** instância de `AISettingsModal`, a que vivia dentro do
`SettingsModal`. Era a mesma família do §4.9 (`OraclePage`): componente montado
atrás de um estado sem gatilho. ⚰️ **Fechado em `4a8b8049`** (decisão #37): o
modal, o estado, o handler e a prop foram apagados — a medição acima fica como
registro; hoje só existe UMA instância de `AISettingsModal`, a desta página.

**Aparece quando**: `<AISettingsModal isOpen={showAISettings} … />` — a folha é o
próprio componente (`ModalSheet` com `open={isOpen}`, `role="dialog"`,
`aria-modal="true"`, `aria-label` "Personalidade" / "Personality", z-index 120,
Escape e foco presos por `useDialogA11y`).

**O que se vê/faz** — quatro grupos de chips, todos PT/EN, e um bloco escondido:

| Bloco | Campo | Opções |
|---|---|---|
| "Como seu Soulmon fala" / "How it talks" | `tone` | Tranquilo · Elétrico · Sereno · Brincalhão |
| "Emojis" | `emojiIntensity` | Nenhum · Poucos · Alguns · Muitos |
| "Como seu Soulmon te incentiva" / "How it encourages you" | `motivationStyle` | Anima · Provoca · Acolhe · Equilibrado |
| `Disclosure` "Mais opções" / "More options" | `temperature` (`CREATIVITY`, três degraus; o marcado é `nearestCreativity(s.temperature)`) e `customKeywords` (`<textarea>` de `maxLength={500}`) | Previsível · Equilibrado · Criativo |

O contador do `<textarea>` **só aparece perto do limite**
(`{s.customKeywords.length > 400 && (…)}`), em `aria-live="polite"`. O rodapé tem
dois botões: "Padrão" / "Default" (`setS(defaultSettings)`, **local** — não
salva) e "Salvar" / "Save".

**Estados**: o estado local `s` é ressincronizado a cada abertura —
`useEffect(() => { setS(currentSettings || defaultSettings); }, [currentSettings, isOpen])`
—, então **fechar sem salvar descarta** tudo o que foi mexido.

**Dono**: `src/components/AISettingsModal.tsx` (a folha) e
`src/components/SettingsPage.tsx` (o caminho vivo) · **Régua: nenhuma.**
`grep -rln "AISettingsModal" src --include=*.test.tsx` devolve um único arquivo,
`src/components/settingsTelemetry.render.test.tsx`, e **só por `import type`** —
ele monta a `SettingsPage`, nunca a folha (13/09/2026).
⚠️ **Nada trava o caminho de abertura** (a morte do `SettingsModal` já aconteceu).

### 4.23b ⚰️ `SettingsModal` "Ajustes rápidos" / "Quick settings" — apagado em `4a8b8049` (21/09/2026, decisão #37)

**Registro histórico.** O arquivo `src/components/SettingsModal.tsx` não existe
mais (`ls src/components/SettingsModal.tsx` → não encontrado, 21/09/2026); tudo
abaixo descreve o que ele montava **se** abrisse — e ele nunca abria (§4.23a).
Motivo da remoção: duplicata da `SettingsPage` (as quatro linhas já viviam lá)
sem gatilho vivo. **Chegava por**: `{settingsOpen && (…SettingsModal…)}` da raiz
do `App` — reconferido em `8d318529`, sem gatilho vivo. Desde `980bc84c` o par
"Sons"/"Trilha" tem caminho vivo na `SettingsPage` (§4.23, grupo "Som") ·
**Saía para**: X/Escape do `ModalSheet` (`onClose`).

**O que se vê/faz** — `ModalSheet` com `title` "Ajustes rápidos" / "Quick
settings" e, desde `ee79fd44`, **quatro** linhas de `SwitchRow`/`ActionRow`, na
ordem do arquivo:

| Linha | Rótulo PT / EN | Gesto | Hint |
|---|---|---|---|
| 1 | "Sons" / "Sound" | `onToggleSound?.()` → `handleToggleSound` em `App.tsx` (único desde `980bc84c`, o mesmo da `SettingsPage`): `setMuted`, `setSoundMuted`, e **`pausarTrilha()` se ficou mudo / `retomarTrilha()` se religou** (E0: o mudo global cala a trilha); `trackSoundOff()` só na transição ligado → mudo | — |
| 2 | **"Trilha" / "Music"** | `checked={trilha}` (estado local iniciado por `trilhaPreferida()`); toque: `if (trilha) desligarTrilha(); else ligarTrilha(); setTrilha(!trilha)` — este toque É o gesto da S2 | com `soundMuted`: "Com os sons desligados, a trilha fica em silêncio." / "With sound off, music stays silent."; senão: "Duas camadas calmas, em loop. Para sozinha quando o app sai de vista." / "Two calm looping layers. Stops by itself when the app is out of view." (⚰️ dizia "Uma camada" até `980bc84c`) |
| 3 | "Conversa com IA" / "AI chat" | `onToggleAI` | "Desligado, seu Soulmon responde por palavras-chave." / "Off, it answers from keywords." |
| 4 | "Personalidade" / "Personality" | `setShowAISettings(true)` → segunda instância de `AISettingsModal` | — |

**Aparece quando**: a linha 2 não tem condição própria — monta sempre que o
modal monta, mudo ou não; o que muda com `soundMuted` é só o hint.

**Estados**: `trilha` é estado local lido uma vez na montagem
(`useState(() => trilhaPreferida())`, isto é, a chave
`STORAGE_KEYS.SOUND_TRACK_ENABLED`); não reage a mudança externa enquanto o
modal está aberto. A trilha em si para sozinha em `document.hidden`, no sono
(`handleSleep` chama `pausarTrilha`/`retomarTrilha`) e no mudo — regra em
[`02` §58-A](02-REGRAS-DE-NEGOCIO.md#som).

⚰️ **Consequência do gatilho morto, fechada em `980bc84c`** (21/09/2026,
mesmo dia): entre `ee79fd44` e `980bc84c`, `ligarTrilha` só era chamada por
esta linha e por `aoGestoSonoro` (`src/utils/trilha.ts`, que exige a chave já
ligada), e `setMuted` só pelo `onToggleSound` deste modal — **não existia
caminho vivo** para o jogador ligar a trilha nem mudar o mudo global. Hoje
`ligarTrilha`/`desligarTrilha` são chamadas também pela `SettingsPage` (§4.23,
grupo "Som"; `grep -rln "ligarTrilha" src/components` → `SettingsModal.tsx`,
`SettingsPage.tsx` e a régua `settingsSom.render.test.tsx`) e `setMuted` continua sendo chamado só em `App.tsx`
(`handleToggleSound`; `grep -rn "setMuted(" src --include=*.tsx` → só
`App.tsx`), agora alcançável pela página. Registrado como fechado no
[`../STATUS.md`](../STATUS.md). ⚰️ O hint dizia "Uma camada" com a trilha em
**duas** (`CAMADAS_DA_TRILHA`, `8a930657`) — D33 em
[`02` §59](02-REGRAS-DE-NEGOCIO.md#divergencias), fechada em `980bc84c`.

**Dono (era)**: `src/components/SettingsModal.tsx` (⚰️ `4a8b8049`) · `src/App.tsx`
(`handleToggleSound`, `handleSleep` — continuam, agora só para a `SettingsPage`) ·
**Régua: nenhuma** para o modal, nunca houve; o par de chaves na `SettingsPage` é
travado por `src/components/settingsSom.render.test.tsx`, e a chave separada do
mudo por `src/utils/audioBus.contract.test.ts`.

### 4.24 Créditos e Nova Leitura

```jsx
{creditsOpen && (…CreditsModal…)}
{newReadingOpen && (…NewReadingModal…)}
```

- **`CreditsModal`** — **Chega por**: `onOpenCredits` (linha "Créditos" da `SettingsPage`; ⚰️ antes, a linha do menu sanduíche, removido em 07/10/2026)
  → `openCredits`. **Sai para**: `onClose`, e a linha de reroll faz
  `setCreditsOpen(false); setNewReadingOpen(true)`. `canReroll` é
  `!!readLocal(STORAGE_KEYS.SOULMON_PROFILE)`.
- **`NewReadingModal`** — **Chega por**: só do `CreditsModal`. ⚰️ Substituiu o
  reroll por `Math.random()` que o `termos.html` chamava de "sorteio pago": a
  semente passa a vir das respostas (`utils/newReading.ts`). **Sai para**:
  `onConfirm` (async; só fecha com `ok`) e `onClose`.

### 4.27 O tour de boas-vindas do corvo <a id="tour-corvo"></a>

- **Chega por**: o intersticial `welcomeTour`, **o primeiro da fila 1** (§3.1) — depois do ritual (`SoulmonOnboarding`) e do tutorial de 1ª tarefa (`GameTutorialFlow`), antes do check-in e do priming. Condição (`needsWelcomeTour`): flag local `STORAGE_KEYS.WELCOME_TOUR_SHOWN` (`soulmon-welcome-tour-shown`) ausente E nenhuma conclusão no save (`jaConcluiuAlgo`) — quem já joga não é interrompido. Roda igual na demo (flag local, sem XP). Replay: Configurações › Ajuda › "Replay tutorial" (`onReplayWelcomeTour`), sem gravar nada. Sem campo novo no save.
- **Estados**: oito cartões, `WelcomeTour` (`RitualDialog` z-200). Parte 1 (básico): boas-vindas · hábitos e tarefas · por que importam (comida/energia, dia completo — meta inicial lida de `FORM_REQUIREMENTS.rookie.required`) · evolução manual · cuidado em uma frase. Parte 2 (mapa): Laboratório/Mercado/Arena · Jogos/Exploração/Hall · Missões (ícone do canto da Home) e Mochila (entre os cuidados). Os cartões do mapa são texto: o tour NÃO navega o app.
- **Sai para**: "Let's go" no último = `finished`; "Skip" (sempre visível) ou Esc = `skipped`. Os dois gravam a MESMA flag, uma vez; pular nunca repete nem cobra. Texto só em EN por enquanto (`{ en }`, fallback para pt-BR). Muda (R-NOVA). Dono: `src/components/WelcomeTour.tsx`, `src/utils/welcomeTour.ts`.

### 4.25 Superfícies globais (montadas uma vez, cobrem tudo)

| Superfície | Aparece quando | O que faz | Dono |
|---|---|---|---|
| `ErrorBoundary` | envolve a árvore inteira em `main.tsx` | `getDerivedStateFromError` troca a tela pelo fallback; loga só em `DEV` | `ErrorBoundary.tsx` |
| `OfflineSeal` | montado na raiz do `App`, sempre — e desde `592e2c14` também nas três telas ANTES da Home (onboarding, tutorial, upgrade: `const selo = <OfflineSeal language={language} topOffset={8} />` antes do `Suspense`; ⚰️ o portão ficava sem selo, E1) | acende pelos eventos `online`/`offline`; **não bloqueia nada** | `ui/OfflineSeal` |
| "Pular para o conteúdo" | primeiro nó focável do documento | `<a href="#conteudo">` para o `<main tabIndex={-1}>` | `App.tsx` |
| região `aria-live` do visor | sempre, fora da tela | anuncia `spriteText('tuned', language)` quando `visorAnunciou` | `App.tsx` |
| `Toaster` (sonner) | último nó do `App` | avisos de uma linha | `ui/sonner.tsx` |
| `UndoToast` | 5 s depois de MARCAR um hábito como feito (Home e lista de atividades), montado por `toast.custom` de `ofereceDesfazer` (`App.tsx`) com `duration = UNDO_WINDOW_MS` | "«nome» — marcado como feito" + botão **Desfazer**, que reverte a conclusão inteira e fecha o toast (decisão do dono **#57**, 22/09/2026 — [02 §24-A](02-REGRAS-DE-NEGOCIO.md#desfazer)). É o ÚNICO toast do app que o usuário precisa **acionar**, e por isso o único com marcação própria: `role="status"` (anuncia sem roubar o foco — `alert` interromperia, e isto é uma oferta, não um erro) e alvo de **44×44** no botão. O `sonner` 2.0.3 não põe `role` nenhum no `<li>` e o botão de ação dele tem ~24px de alvo | `UndoToast.tsx` |
| `NotificationManager` | sempre | agenda os pushes locais — §5.3 | `NotificationManager.tsx` |
| `ItemsWindow` | `{showItemsWindow && (…)}` | a pastinha; `handleOpenItems` **alterna** e zera `newItemsReady` | `ItemsWindow.tsx` |
| `GamePopups` → `FirstTaskCompletedPopup` | `showFirstTaskPopup` | **uma vez na vida**, guardado por `FIRST_TASK_POPUP_SHOWN` e por uma varredura (`anyStepCompleted` / `anyTaskCompleted`). Desde `eb932ebb` (canvas Rituais R8/S8) mudou de CLASSE: ⚰️ era `ModalSheet` em z-120, **sob** os intersticiais (invisível quando o gatilho era o "só 5 minutos?" do check-in); hoje é `RitualDialog` **z-300, espera o gesto**, como a cerimônia do marco — fora das filas de propósito | `GamePopups.tsx` |
| `ContentModals` → `GuideModal` | `guideModalOpen` | o guia; os números saem das CONSTANTES | `GuideModal.tsx` |
| `HelpModal` | `showHelpModal` | o glossário, idem; a linha de abertura diz, desde `5b91717c` (21/09/2026, copy §6): "O que cada palavra da tela quer dizer. O Soulmon tem um universo próprio: estes são os nomes dele, e nenhum deles descreve você." — a 2ª oração bloqueia a leitura de tipologia ("então eu sou akasha") | `HelpModal.tsx` |
| `ConfirmDialog` | `resetOnboardingOpen` | "Refazer o ritual" — o texto diz que Soulmon, atividades, Bits e progresso **continuam** | `ConfirmDialog.tsx` |
| `ScreenSkeleton` | `Suspense fallback` de toda página carregada por `lazy()` | ⚰️ substituiu os `Suspense fallback={null}` que deixavam a tela **em branco** (13 pontos, medidos em 19/08/2026) | `ui/ScreenSkeleton.tsx` |

**Régua**: `GuideModal.gateReal.render.test.tsx`,
`src/components/textoBilingue.contract.test.ts`.

### 4.26 A Guilda — o Salão (Hall) e a Feira (Arena) <a id="guilda-tela"></a>

**Chega por**: área **Hall** → lote **Salão da Guilda** (NPC Bastia, `hall:guilda`) abre
`GuildSheet room="salao"`; área **Arena** → lote **Feira** (NPC **Fanfare**, `arena:feira`)
abre `GuildSheet room="feira"` — a mesma folha, duas salas (`AreaView`). ⚰️ Até a fatia B2
a Arena tinha um lote `guilda` que abria a folha inteira. · **Sai para**: fechar a folha
(o foco volta ao lote que abriu, `useDialogA11y`) ou o voltar do sistema.

- **Salão** — UM scroll com três seções, e **vazio é SILÊNCIO** (seção sem nada a dizer
  não desenha nem título):
  - **Bosque**: o visor (`GroveVisor`: cenário `bg-guild-<estágio>` e as criaturas na linha
    do chão — 5–12 membros → só a SUA; ≤ 4 → todos, em ordem de chegada), o nome do estágio,
    uma frase `perto` BINÁRIA e o botão do fio (só existe quando a meta de coração do dia
    foi cumprida; "ainda não" é silêncio, nunca frase). Sem roda: a **Clareira** no vazio e
    o formulário de criar/entrar.
  - **Roda**: os três gestos fixos e anônimos (`aceno`, `luz`, `descanso`, um de cada por
    dia; os gestos recebidos aparecem **no topo**), presença nominal só com ≤ 4 (e só quando
    é verdade — ausência não desenha nada), e com 5+ UMA frase qualitativa quando há fio.
  - **Mural**: os marcos com a DATA em que ESTE aparelho os viu e as peças de maré colhidas.
  - **Rodapé fixo**: "Sair" (um toque, sem diálogo) e, para o anfitrião, renomear e trocar o código.
- **Feira** — o visor do fenômeno (`FeiraVisor`: três estados `aberto`/`ferido`/`dissipado`,
  quatro tipos `nevoa`/`mare`/`estatica`/`enxame`; arte real por TIPO × ESTADO desde 30/09/2026 (`fairFenomenoId` → `fair-fenomeno-<tipo>-<estado>` em `FAIR_ART`, 12 sprites; o SVG ficou de fallback para id sem arte), o FX (`fx-fair-*`) como motivo 64² espelhado nos dois cantos de cima, sobre o fundo pintado `visor-feira` (`VISOR_ART.visorFeira`, `utils/visorScenes.ts`), sem rosto, número
  nem barra de HP), UM botão de rodada por dia (`guild.feira.rodada.botao` → `...feita`),
  a frase sóbria com a Honra (`guild.feira.sobria`, números de `RAID_EMBLEMS`/`_FLOOR`)
  e o **cartão de colher** — visível também para quem já saiu da roda. Sem roda: um convite
  curto (`guild.feira.semroda`).
- **Estados de erro**: falha de CARGA nunca vira "sem roda" — é tela de erro com "tentar de
  novo"; **401** vira "Entrar na conta" (+ `UnlockNudge` para o demo), nunca um formulário morto.
  409/429/404 do resgate e da rodada são estados, não frases (a folha relê em silêncio).
- **Fora da folha, no App**: (1) a **cerimônia `groveMilestone`** (`GroveMilestoneCeremony`,
  z 300, espera o gesto, saídas botão/Escape/voltar, sem "parabéns" nem número) entra na fila de
  intersticiais ([§3.1](#3-as-duas-filas)) a partir da **Ramagem** (`CEREMONY_MIN_INDEX` = 2; a
  Clareira é o chão e a primeira vez que o aparelho vê a roda é baseline, sem cerimônia);
  (2) o **aviso `marcoBosque`** da Home ([§3.2](#3-as-duas-filas)); (3) **"Do bosque"** no
  topo dos segmentos Background e Decoração do Mercado (`GuildOwnedShelf`: os cenários e a
  Concha da Maré que a roda deu — só equipa, sem preço, e a seção nem aparece se não há nada).
- **Dono**: `src/components/guild/GuildSheet.tsx`, `GroveVisor.tsx`, `FeiraVisor.tsx`,
  `GroveMilestoneCeremony.tsx`; `src/components/mercado/GuildOwnedShelf.tsx`;
  `src/hooks/useGroveWatch.ts`; `src/utils/groveLocal.ts`, `groveStage.ts`, `guildCopy.ts` ·
  **Régua**: `guild/GuildSheet.render.test.tsx`, `guild/GuildSheet.feira.render.test.tsx`,
  `guild/GroveMilestoneCeremony.render.test.tsx`, `guild/guildSemCobranca.contract.test.ts`,
  `filaDeAvisos.contract.test.ts`. Regra: [02 §56-A](02-REGRAS-DE-NEGOCIO.md#guilda).
- ⚠️ **Wireframes GUI-01..16 ainda não existem** (WPG-W); o desenho acima é o do código.

---

## 5. Superfícies fora do app

### 5.1 Widgets Android

Cinco provedores, todos em `android/app/src/main/java/com/hexervoodoom/soulmon/widget/`:
`SoulmonWidgetProvider`, `SoulmonWidgetVerticalProvider`, `SoulmonWidgetPetProvider`,
`SoulmonWidgetChatProvider`, `SoulmonWidgetScreenProvider`. Os cinco `android:label`
do `AndroidManifest.xml` são "Soulmon", "Soulmon Vertical", "Soulmon Pet",
"Soulmon Chat" e "Soulmon Tela" — é o texto que a pessoa lê na lista de widgets.

- **O que mostram** (`WidgetRenderer.kt`, refeito em `6affd501` pelo canvas
  Fora do app, `DECISOES-WIREFRAME.md` §30): nome do pet (`pet_name`), rótulo do
  estágio, o contador `"$completed/$total"` **só com ≥1 feita**
  (`taskCounter` devolve `null` e a linha `widget_tasks` vai a `View.GONE` com zero
  feitas ou zero tarefas — REGISTRO 13.16; ⚰️ o `"—"` no zero saiu), corações,
  barra de energia, sprite (a criatura do estágio via `setImageViewBitmap`) e uma
  **frase do pet**. Por widget: **A** (`renderFull`, horizontal) tem contador e
  frase; **B** (vertical) tem o contador **na linha do estágio** e ⚰️ **sem
  frase**; **C** (`renderPet`) só sprite + cocô; **D** (`renderChat`) frases e
  ⚰️ **sem contador**; **E** (`renderScreen`) corações + energia + sprite.
- **Para onde levam**: `attachClick` monta um `PendingIntent` com o
  `getLaunchIntentForPackage` e o liga ao `R.id.widget_root` — **tocar em
  qualquer lugar do widget abre o app**. Não há alvo por região.
- **O widget NÃO cobra** — a escada de frases (`contextualMessage`), na ordem em
  que a função decide (três `if` e então um `when`), **só em inglês e sem emoji**
  (REGISTRO 13.18 — o widget não tem idioma; D-F3 — o RemoteViews não tem fonte
  de ícone): `hp <= 20` → "I've been missing you"; `needsIntervention` → "Today,
  just five minutes?"; `total == 0` → "You've been steady" (com `habit_steady`)
  ou "One day at a time"; depois `ratio >= 1.0` → "Complete day!"; `>= 0.7` →
  "Almost there!"; `>= 0.4` → "Keep it up!"; senão → "You started — that already
  counts". No widget D (`buildChatPhrases`): `hp <= 20` → "I miss you...";
  `total == 0` → "Let's add a task?"; `completed >= total` → "We crushed it
  today! ✨"; senão "Whenever you're ready, I'm here."; ⚰️ "Don't forget about
  me today!" saiu do pool.
  ⚰️ `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"` e
  `"N task(s) left, let's go!"` **não existem mais**; ⚰️ a escada em PT-BR
  ("💛 Tô com saudade de você" … "✨ Dia perfeito!") **também não** — saiu em
  `6affd501` (20/09/2026).
- **O corvinho e o Bosque (29/09/2026, decisão do dono)**: com `pet_line == "corvo"`
  no bridge, `resolveSprite` usa a tabela fechada `CORVO_SPRITES` (11 formas →
  `drawable-nodpi/sprite_corvo_<forma>.png`, forma desconhecida → `sprite_rookie`),
  nos cinco widgets. Só o **A** (`renderFull`, horizontal) ganha a linha
  `widget_grove`: o NOME do estágio do Bosque que este aparelho viu por último
  (`grove_stage`), 11sp em `#AAB6B4`, sem número, sem "faltam", sem membros, sem
  barra; `View.GONE` sem roda, e a frase cai para 1 linha quando ela aparece. É a
  única string do widget com idioma: vem de `res/values` (EN) / `res/values-pt`
  (PT) pelo idioma do aparelho — a escada de frases continua só EN (13.18).
- **Régua**: `src/plugins/widgetSemCobranca.contract.test.ts` — lê o FONTE
  Kotlin, porque nenhum teste em `node` alcança Kotlin; desde `6affd501` trava
  também `"0/"`, o traço e o veto de presença.

⚰️ As duas observações de 09/09/2026 (frase só em PT-BR; "Dia perfeito!" no topo
da escada) **fecharam em `6affd501`**: a escada é só em inglês por decisão
(13.18) e o degrau diz "Complete day!" (P5).

### 5.2 Overlay Electron

Dono da fronteira: `desktop/renderer/src/menu.ts` (`renderMain`, `renderTasks`,
`renderSettings`) — e a fronteira de **cuidado** é `desktop/renderer/src/care.ts`,
não este arquivo.

- **Painel principal** (`renderMain`, refeito em `e2e196b2` pelo canvas Fora do
  app, `DECISOES-WIREFRAME.md` §30 D-F7..D-F13): cabeçalho com `stageName` (por
  `textContent`, nunca `innerHTML` — o nome vem do save remoto), a linha de
  estado `statusLine()` — corações `favorite` num `role="img"` com `aria-label`
  "N de M corações", `bolt` + `energy/maxEnergy` **só com energia > 0**,
  `restaurant` + `×foodCount` (⚰️ os emojis ❤️/⚡/🍎 saíram; a linha **não é
  montada dormindo**: `if (!state.sleeping) pb.appendChild(statusLine())`), o
  retrato do pet num vidro (dormindo = filtro + Z, nunca opacidade), a fala
  (`aria-live="polite"`), e a **fileira de cuidado** com quatro `careButton`:
  `volunteer_activism` Carinho (`doPet`), `restaurant` Comida (`doFeed`),
  `shower` Banho (`doShower`) e `bedtime` Dormir / `wb_sunny` Acordar
  (`doSleepToggle`).
- **Tarefas de hoje**: `button('task_alt', …)` **sem dígito** (REGISTRO 13.17 —
  ⚰️ o contador na porta da lista saiu) → `panel = 'tasks'; render()`.
- **Para onde leva**: `window.soulmonDesktop?.openFullApp()` — a linha
  "📱 Abrir Soulmon completo" nas Configurações e o botão de entrar quando não há
  sessão. **Criar e editar tarefas é só no app**, e a nota do painel diz isso:
  "Tudo aqui vale no celular também. Criar e editar tarefas é no app."
- **Estados**: sem conta — "Conecte a sua conta para cuidar do pet e marcar
  tarefas daqui."; com conta — e-mail + "🔄 Sincronizar agora" (`syncNow`).
- **Régua**: `desktop/renderer/src/cloudSync.test.ts`,
  `care.parity.test.ts`, `care.feed.parity.test.ts`,
  `care.banhoSono.parity.test.ts`.

### 5.3 Notificações

Dono único do texto e do horário: `functions/api/_pushCopy.js`.

```js
export const PUSH_HOURS_BRT = [10, 16, 22];
export const PUSH_HOURS_UTC = PUSH_HOURS_BRT.map(h => (h + 3) % 24).sort((a, b) => a - b);
```

| Hora | `tag` | Título (PT) | Para onde leva |
|---|---|---|---|
| 10h | `pet-nudge-10` | "<nome> passou pra dizer oi" | abre o app |
| 10h, `ageDays` 1 ou 2 | `pet-newborn` | "<nome> acordou" | abre o app |
| 16h | `pet-nudge-16` | "<nome> pensou em você" | abre o app |
| 20h (só no cliente) | `evening-reminder` ou `hp-critical-evening` | "🌙 <nome> está te esperando" / "<nome> está meio pra baixo" | abre o app |
| 22h | `pet-goodnight` | "🌙 <nome> te deseja boa noite" | abre o app |
| janela −30 min | `pet-sleep-reminder` | "<nome> está ficando com sono" | abre o app |

- **As 20h moram no cliente**, e a **condição** tem de continuar lá — o worker
  não sabe se a meta foi cumprida. As guardas do `NotificationManager`,
  transcritas:

  ```ts
  if (hh !== 20 || mm !== 0) return;
  if (lastEveningWarnDate.current === today) return;
  if (completedSteps >= totalRequired) return;
  if (restWindow) return;
  ```

  A última é a **precedência do lembrete de deitar**: com a janela padrão
  (23:00) a noite mandava três pushes em 2h30, e o das 20h é o único dos três
  que pede EXECUÇÃO — então é ele que cede.
- **Ícones** (`3e758a81`, canvas Fora do app D-F14/D-F15): Web Push e
  `AlarmReceiver.kt` levam `push-large-192.png` (mini-visor redondo com a chama)
  como `largeIcon`/`setLargeIcon` e `badge-96.png` alfa-only; o FCM v1 **não tem
  `largeIcon`** (e `image` viraria BigPicture), então `workers/fcm.js` manda só
  `android.notification.icon = ic_notification` + `color`. A copy de
  `_pushCopy.js` e os horários **não mudaram**.
- **Dedupe entre os dois canais**: a **tag da copy** é o que impede a duplicata;
  o `AlarmReceiver.kt` usa `notify(tag, 0, …)` casando com o
  `android.notification.tag` do `workers/fcm.js`.
- ⚰️ O nudge das 21h **não existe mais**, e o comentário de `PUSH_HOURS_BRT` diz
  por quê: "nada deve pedir uma quarta visita ao app".
- **Régua**: `workers/pushCopy.parity.test.js` (trava as três árvores).

---

## 6. Divergências abertas (para o `../STATUS.md`)

| # | Afirmação | Onde está | O que o código diz (09/09/2026; recheado em 20/09/2026 sobre `dc72579e`; linhas 12–13 medidas em 21/09/2026 sobre `9875477b`) |
|---|---|---|---|
| 1 | "Loja em ABAS (Itens/Cenários/Mobílias/Torneio/Missões)" | `CLAUDE.md` | `type ShopSegment = 'shop' \| 'tournament'` — **dois** segmentos; Itens/Cenários/Mobílias são seções de um scroll, e a aba Missões não existe |
| 2 | ⚰️ "a página é dungeon + dino + pedra-papel-tesoura + torneio" — **fechada na minimal-ui** (`BottomNav.tsx` e `ActivitiesPage.tsx` apagados; os jogos são lotes das áreas, §1.3) | comentário de `BottomNav.tsx` | `openGame` aceita `'dungeon' \| 'arena' \| 'dino' \| 'rps'` — **quatro** minijogos |
| 3 | "`UnlockNudge` só aparece em dois lugares… hoje são TRÊS", e "o `EditModal` passou a exibir o `UnlockNudge` também" | `CLAUDE.md` | `grep -rn "<UnlockNudge" src --include=*.tsx \| grep -v "\.test\." \| wc -l` → **6**; e o `EditModal` **não** monta mais o convite desde `d044fb2e` (o sexto lugar é o `REVEAL_DEMO` do onboarding) — §4.13 |
| 4 | "sem elas o botão de microfone **não é desenhado**" | `CLAUDE.md` | o `<button>` continua montado; com `micDisponivel === false` ele vira o botão de enviar, com `aria-disabled` quando não há texto |
| 5 | ⚰️ "a cerimônia de marco… some sozinha em 2,5s" | comentário do `src/App.tsx` | **fechada em `4f5d2aac`** (20/09/2026): o comentário passou a dizer "não pede nada além do gesto"; o componente segue sem `setTimeout`, `zIndex: 300` |
| 6 | "`ArenaGame` é código morto" | `docs/INVENTARIO-TELAS.md` §6.3 (19/08/2026) | foi o segundo card da `ActivitiesPage`; desde a minimal-ui F5 é o lote Duelo da área Arena (`DueloSheet` → `ArenaGame`) |
| 7 | "`OraclePage` é alcançável pelo atalho de dono (segurar o mascote)" — o atalho segue morto, mas desde a minimal-ui F1 o Oráculo é linha do menu da Home (§4.9) | `SoulmonOnboarding.tsx` (comentário) e `docs/INVENTARIO-TELAS.md` §5.13 | `startOracleDebugHold`/`cancelOracleDebugHold` **não têm chamador** — a intro que os usava foi apagada. ⚰️ "`OraclePage` e `PixelizerCard` são inalcançáveis" valeu até a F1; hoje os dois chegam pelo menu da Home (⚰️ o menu da Home saiu; a flag `MENU_SHOWS_RITUAL_TOOLS` vive em `SettingsPage`) |
| 8 | ⚰️ frase do widget e nome do dia | `WidgetRenderer.kt` | **fechada em `6affd501`** (20/09/2026): a escada é só em inglês por decisão (REGISTRO 13.18) e o topo diz "Complete day!" (P5) — §5.1 |
| 9 | comentário do slot de avisos numera "1. HP" duas vezes | `src/App.tsx` | a ordem executada é a dos `push`: firstDay → refugio → hp → incubacao → semanal → triagem → priming → recomeco → carga → termos (8 desde 21/09/2026, 9 desde a incubação `8be8f9c5`; o `refugio` entra em 30/09/2026) |
| 10 | "Brincar" é um card na Home (`PlayCard`), e a IIFE do `PlayCard` no `App.tsx` é consumidora de `playLog` | `CLAUDE.md` (linha 🧮, "**brincar** `playLog` (`utils/petNeeds.ts` + a IIFE do `PlayCard` no `App.tsx`)") | o `PlayCard` não é montado desde `f5ead7c0`; Brincar é a célula `play` do deck do `CompanionHUD`, alimentada por `playDeck` (`useMemo` no `App.tsx`) — §4.2, §4.14. `src/components/PlayCard.tsx` segue no repo sem consumidor |
| 11 | "o fundo do widget é vetor `pet_grid.xml`" | `CLAUDE.md` (footgun 4) | `android/app/src/main/res/drawable/pet_grid.xml` foi **apagado** no delta (`6affd501`); o fundo é `widget_bg.xml` (`<shape>`, `drawable/` e `drawable-v31/`) — §5.1 |
| 12 | "uma **run = 5 andares**", "Concluir os 5 andares", "bônus de andar" | `CLAUDE.md` (linha ⚔️ Masmorra) e linha ⭐ ("os 5 andares da masmorra") | desde `84ae4937` (21/09/2026) o jogador lê **descida** e **camada** ("Camada N de 5", "Descer", "Descer de novo", "As 5 camadas ficaram para trás"); `run`/`floor`/`MAX_FLOORS` continuam sendo os nomes de código — vocabulário, não mecânica — §4.14 |
| 13 | "Recusa = pet fala que está cheio (sem toast)" e a tabela 🫶 sem dizer o que acontece ao usar 💗 com a vida cheia | `CLAUDE.md` (linhas 🍎 e 🫶) | continua sem toast; mas a frase de comida cheia vem de `PET_VOICE_LINES.full` (`petVoice.ts`), não do `CompanionHUD`, e a vida cheia ao usar 💗 fala `steady` ("Tô firme. Guarda essa."), ⚰️ não mais o canal do teto de carinho (`healCapSignal`) — §4.2, §4.2b |
| 14 | "`CoopPanel`: montado dentro da página [Biblioteca]" e "`LibraryPage` (abas Todos / Amigos / Coop)" | `03 §4.22` (antes de 29/09/2026) e `02 §56` | a aba é inalcançável (`hallContent` passa `view`); a Guilda mora em `GuildSheet` (Salão no Hall, Feira na Arena), e o comentário do `CoopPanel.tsx` é um reexport de uma linha (L1-conformidade #28) |

### Prédios por Vínculo e renome do Laboratório (Tarefa A, 07/10/2026)

Cada prédio do Mapa abre num Vínculo mínimo (`BUILDING_GATES` em `src/utils/gates.ts`, espelho em `functions/api/_gates.js`, paridade em `gates.parity.test.js`; números só lá, decisão do dono, confirmada em 07/10/2026 (ajuste só em `gates.ts`)). Trancado = arte cinza + cadeado SVG com "Vínculo N"/"Bond N" (`components/ui/LockBadge.tsx`) e aviso neutro ao tocar. A área do Mapa só trava se todos os seus prédios travam (`areaLockedAt`). Sempre livres: `BUILDINGS_ALWAYS_OPEN`. Laboratório (ids internos `evolucao`/`pet`/`stats` intactos): Centro de Evolução / Evolution Center, Arquivo / Archive (sem a seção de formas anteriores), Santuário do Vínculo / Bond Sanctum.

**O Soulsmith (07/10/2026, aprimoramento).** O lote `mercado.ferreiro` abre a `ForgeCard` (`src/components/ForgeCard.tsx`, lazy): sem texto introdutório nem painel de materiais — só UMA entrada por tipo de peça (3 cards; o nome acompanha o tier da peça possuída, já equipada, sem Equipar nem Tirar; peça ainda não obtida = card informativo da missão, sem botão), cada uma em seu card com "Lv N → Lv N+1" (ou "Max", sem botão), bônus atual e próximo, os custos como chips e o botão Upgrade (desabilitado com o motivo em texto), modal de ESCOLHA A/B com Confirmar/Cancelar e "Refazer escolha" (confirmação, Bits ganhos ou fragmentos). Reforma de apresentação (07/10/2026): regra intacta. **Mochila → Especiais (07/10/2026):** a seção Materiais lista os 16 materiais sempre (×0 incluso); tocar no ícone abre um painel "onde conseguir mais" com "Go there"/"Ir lá", que fecha a Mochila e leva ao prédio (Caderno: menu de Missões; os outros: área + folha do lote).
