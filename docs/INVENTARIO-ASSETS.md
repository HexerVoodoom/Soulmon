# Inventário de assets — o que existe, onde vai, o que falta

> **Data:** 22/09/2026 (§0 recontado por comando e §2b — os 102 órfãos — pela QA Rodada 2, [`reviews/2026-09-22-qa-rodada-2/06-som-arte-design-marca-r2.md`](reviews/2026-09-22-qa-rodada-2/06-som-arte-design-marca-r2.md) §2; anterior: 15/09/2026) · **Escopo:** TODO asset visual disponível para o Soulmon — no repo,
> nas levas do Gemini (`D:\Soulmon\_gemini_out\`), no kit de UI gerado no Gemini
> (`E:\Soulmon-assets\`), no Class-System, e a marca. Medido por varredura de arquivo
> (dimensão, alfa, referência no código), não por memória.
> **Propósito:** ser o projeto de "onde vai cada coisa" ANTES de qualquer execução da
> Fase 2 (identidade). Nada aqui foi instalado, movido ou gerado.
> **Regra que governa tudo:** a tese "O Visor" (`manual/04-IDENTIDADE-VISUAL.md` §1) —
> pixel art **só dentro do visor**; tudo fora é SVG + Material Symbols. Cada asset abaixo
> recebe um veredito **dentro / fora / decisão do dono** por essa régua.

---

> **Atualização 15/09/2026 (fim da rodada da SQUAD-ARTE):** as levas `entrega2` (berço), `entrega4` (Dino + 7 anims),
> `entrega6` base (108), `branches/` (12 → linhas igni/nautilu/astrase), `Class-System/sigilos` (45) e as novas
> `cenarios-20260915` (25), `criaturas-20260915` (12), `sprites-20260915` (8 emblemas, 3 placeholders, 2 glifos,
> 3 HUD, 1 anim) e `marca-20260915` (kit E:/logo vetorizado) estão **instaladas**. A marca anterior foi para
> `D:\Soulmonrand-archiverand-anterior\`. Estado por peça em `ASSETS-A-GERAR.md` §11. Os §1–§4 abaixo
> descrevem o estado ANTES da rodada; re-varrer com `/squad-arte inventario`.

## 0. Números

| Origem | Arquivos de imagem | Estado |
|---|---|---|
| `repo/src/assets/` | **1.723** imagens/vídeos (`find src/assets -type f \| wc -l` → 1 726 = 1 723 + 2 `.md` + 1 `.ts`; por família: soulmon 1 618 · backgrounds 58 · decor 33 · brand 8 · icons 4 · raiz 3 · video 2; por extensão: png 1 716 · webp 3 · mp4 3 · svg 1; `du -sh src/assets` → **121 MB**, bg 43 M · backgrounds 36 M · fx-ataque 20 M; medido em 22/09/2026) — ⚰️ dizia **1.352** e "≈150 sem referência" (15/09): não contava os 371 que entraram depois (lines/icons 72, sigilos 45, elementos/fx-ataque…) e contava pastas já apagadas | instalado; **102 sem nenhum consumidor** (9,6 MB — §2b; nada disso entra em `dist/`) |
| `repo/public/` | 6 (3 favicons + 3 screenshots) | instalado |
| `repo/android/.../drawable/` | 21 (11 sprites `sprite_*`, splash, partner_area, ui_t_bg_01) | instalado no widget |
| `D:\Soulmon\_gemini_out\` | ~1.900 (contando `raw/` e derivados) | **5 levas não instaladas** (§3) |
| `E:\Soulmon-assets\out\` | 179 (kit de UI pixel: botões, nav, ícones, barras, nós, janelas, logo) | **nunca instalado; quase todo FORA do visor** (§4) |
| `D:\Soulmon\Class-System\assets\` | 137 elementos (já no repo) + **45 sigilos** (não instalados) | §5 |
| `C:\Users\spera\Desktop\icones\ui\` (memória de 27/08) | **pasta não existe mais** | a `image 1547` virou `src/assets/backgrounds/home-scene-1547.png` |

Varredura: `E:\tmp\claude\D--Soulmon\...\scratchpad\census.tsv` (caminho, dimensão, alfa, bytes).

---

## 1. O que está instalado E em uso — por família

Todos abaixo têm importador real no `src/`. Coluna "fluxo" usa os nomes dos 13 canvases da
Fase 1 (`design/INVENTARIO-WIREFRAMES.md`).

### 1.1 Criaturas (dentro do visor — sempre)

| Pasta | Qtd · formato | Mapa | Fluxo / artboard |
|---|---|---|---|
| `soulmon/lines/` | 36 · 256² alfa — 9 linhas × 4 estágios (ignar, lumel, serah, kaelen, orrin, thalindra + igni, nautilu, astrase desde 15/09) | `DUNGEON_LINE_SPRITES` (`utils/sprites.ts`) | Jogos (`MasmorraTurno`, `Arena`, `PesadeloIntro`), Onboarding-funil (`EscolherPersonagem`), Social (NPCs da Biblioteca), Home (modo demo) |
| `soulmon/lines/icons/` | 72 · 64² e 32² alfa — ícones-ficha das 9 linhas × 4 tiers, DERIVADOS do 256² (`scripts-arte/derivar-rodada2.mjs`, rodada 2 R2-2, 21/09/2026) | `lineIcon`/`lineIconForStage` (`utils/lineIcons.ts`) | Jogos (`TournamentPage` ranking 32 e oponente 64, `DinoGame` pet 64) |
| `soulmon/rookie.png` … `ultra.png` | 11 · 384² — árvore genérica do jogador (rookie, 3×champion, 3×ultimate, 3×mega, ultra) | `SOULMON_SPRITES` | Home (`PetDeckEstados`, `TrilhaEvolucao`), Pet (`FichaEstados`), Evolução (`EvoSpriteEstados`), Onboarding-oráculo (`Reveal`) |
| `soulmon/dungeon-spirit.png` | 1 · 128² | `DUNGEON_SPIRIT_SPRITE` | Jogos (`MasmorraLobby`) |
| `soulmon/mascot-raven.png` | 1 · 512² | IntroScreen | Onboarding-funil (`IntroEstados`) |
| `android/res/drawable/sprite_*.png` | 11 — a mesma árvore genérica, para o widget | `WidgetRenderer.kt` | Fora do app (`Tamanhos`, `Escada`) |

### 1.2 Cenários (dentro do visor)

| Pasta | Qtd · formato | Mapa | Fluxo |
|---|---|---|---|
| `soulmon/bg/dungeon-6..10`, `tournament-night`, `tournament-final`, `minigame-dino`, `minigame-rps` | 9 · **1080×1920** (formato certo) | `dungeonScenes.ts`, `RPSGame.tsx` | Jogos |
| `soulmon/bg/dungeon-classic-{retro,vhs,sol,crt,glitch}` | 5 · **1080×1920** RGB (rodada 3 extras v3, instaladas 30/09/2026) | `DUNGEON_SCENES` (`dungeonScenes.ts`) | Jogos (Masmorra) — substituem os 5 clássicos em gradiente CSS; fonte `E:/Soulmon-assets/out/rodada3/extras/final/` (`MANIFEST.md` com sha256) |
| `soulmon/bg/dungeon-1..5`, `tournament.png` | 6 · **960×540** (formato antigo, deitado) | `dungeonScenes.ts` | Jogos — ⚠️ **inconsistência**: 5 andares deitados + 5 em pé; `background-size: cover` corta ~70% dos deitados (achado §11 do `04`) |
| `backgrounds/bg-attic … bg-swamp` | 8 · **1200×648** (pet-box da loja, formato certo) | `PET_BACKGROUNDS` (`utils/backgrounds.ts`) | Loja (`CenariosMobilias`), Home (palco do pet) |
| `backgrounds/bg-guild-{clareira,ramagem,copa,mata,bosque-antigo}` | 5 · **1200×648** RGB noturnos, chão 66% (rodada 3 fundos-v2, instalados 30/09/2026; antes gradiente CSS) | `PET_BACKGROUNDS` | Guilda (`GroveVisor`, cerimônia de marco, prateleira da Guilda) e palco da Home quando equipado — ganhos por conquista, nunca vendidos; fonte `E:/Soulmon-assets/out/rodada3/fundos-v2/final/` (`MANIFEST.md` com sha256) |
| `backgrounds/bg-campina`, `bg-cavernas` | 2 · **1200×648** RGB noturnos, chão 74% (fundos-v2, 30/09/2026) | `PET_BACKGROUNDS` + `REGIONS[].bgId` (`data/travessiasCatalog.ts`) | Exploração › Passeio (postal da região) — **não vendidos** (fora de `shop.ts`/`SHOP_BG_ACCENTS`) |
| `soulmon/areas/bg-hall`, `bg-laboratorio` | 2 · **760×1344** RGB (fundos-v2, 30/09/2026) | `HALL_BG`/`LABORATORIO_BG` (`areas/index.ts` → `AreaView.tsx`) | Mapa › Hall e › Laboratório — antes caíam no degradê do `AreaScene` |
| `backgrounds/bg-gameboy`, `bg-matrix`, `bg-ocean` | 3 · **800×800** (formato antigo, `setting:'void'`) | idem | Loja — ⚠️ cortam nas laterais |
| `backgrounds/thumbs/` | 35 · **96×52** — miniatura de cada cenário 1200×648, DERIVADA (lanczos3 + sharpen leve; rodada 2 R2-1, 21/09/2026); as 7 de fundos-v2 vieram prontas da leva. as 27 dos cenários retonados em 30/09 (tom da Home v2) foram rederivadas pelo mesmo método | `BG_THUMBS` (glob em `ShopModal.tsx`) | Loja (`CenariosMobilias`, mini-visor do card) |
| `backgrounds/home-scene-1547.png` | 1 · 1376×3058 | `CompanionHUD.tsx` | Home (fundo do palco) — é a "image 1547" da pasta do Desktop |
| `video/evolution-bg.mp4` + thumb | 1 | `EvolutionCeremony.tsx` | Evolução (`Cerimonia`) |
| `brand/intro.mp4` | 1 · 720×1280 | `IntroScreen.tsx` | Onboarding-funil (`IntroEstados`) |

### 1.3 Decoração, itens, sonhos, aventuras (dentro do visor)

| Pasta | Qtd | Mapa (chave) | Fluxo |
|---|---|---|---|
| `decor/` | 33 (14 delas refeitas em 08/09 — `decor-v2`) | `decorArt.ts` (id do item) | Loja (`CenariosMobilias`), Home (palco) |
| `soulmon/nest-base.png` (+cushion, basket) | 3 · 444×249 | `nestArt` / `PetStageDecor` | Home (palco) |
| `soulmon/items/` | 13 · 96² — 8 comidas + 3 chips + coração + glitchtama | `itemArt.ts` (**emoji**) | Home (`ItensPastinha`, `AlimentarFolha`, `ItensUsar`) |
| `soulmon/dreams/` | 30 · 96² | `dreamArt.ts` (`Dream.id`) | Rituais (`SonhoComCena`), Pet (`DexCompleto/Parcial`) |
| `soulmon/adventures/` | 72 · 96² — 24 achados da aventura + **48 postais das Travessias** (`adv-trv-*`, rodada 3, 30/09/2026) | `adventureArt.ts` (glob para os `trv-*`) | Rituais (`RelatorioNormal`, aventura da noite), Exploração (diário do Passeio) |
| `soulmon/arena/fair-fenomeno-<tipo>-<estado>` + `soulmon/fx/fx-fair-<tipo>` | 12 · 384² + 4 · 128² (rodada 3, 30/09/2026) | `fairArt.ts` (glob) | Arena (`FeiraVisor`) |
| `soulmon/icones-ui/{mochila,sol-acordar}` | 32² · 128² (rodada 3) | `UI_ICON_ART` | Home (`CompanionHUD`: mochila do passeio, botão Acordar) |
| `soulmon/icones-ui/insignia-faixa-*` | 5 · 64² (rodada 3) — **sem consumidor desde 04/10/2026 (rodada 7 / A1)**: as faixas viraram Madeira→Mestre e `TIER_INSIGNIA_ART` está vazio | `TIER_INSIGNIA_ART` (vazio) | Arena (`TournamentPage`, card "Sua faixa") |
| `soulmon/icones-ui/{ceu-*,masmorra-*,moeda-*,atributo-*}` | 17 · 64²/96² (rodada 3) | `SKY_ART`, `DUNGEON_PROP_ART`, `CURRENCY_ART`, `ATTRIBUTE_ART` | ⚠️ **sem chamada** (o mapa é importado pelo `PixelIcon`, então entram no `dist/` — ~30 KB em WebP) |
| `soulmon/dino/dino-obstacle-{1..4}{,b,c}` + chão + parallax + `icone-corrida` | 12 · 128² + 384×48 + 512×128 + 128² (rodada 3; tema ossos/cristal) | `OBSTACLE_TIERS` (`DinoGame.tsx`) | Jogos (Corrida com obstáculos). `icone-corrida` ⚠️ **sem chamada** |
| `soulmon/fx/{fx-corrida-estilhaco-*,fx-corrida-faisca-*,cristal-moeda}` | 9 + 2 sheets (rodada 3) | — | ⚠️ **sem chamada** (a Corrida não tem FX de impacto nem moeda coletável hoje) |
| `soulmon/fx/` | 12 · 64²/128² — 6 partículas de cuidado + 6 FX de batalha | `fxArt.ts` (**emoji** do `Popup.icon`) | Home (`PetCarinho`, banho), Jogos (`MasmorraTurno`, `PesadeloFim`) |
| `soulmon/fx/anim-sleep-z-light.png` | 1 · 192×64 (3 quadros) — a folha `anim-sleep-z` recolorida em claro (`#E9F5F2`/`#5FF3E0`, alfa intacto; rodada 2 R2-4) | `ANIM_ART.sleepZLight` (`animArt.ts`) | Home (`CompanionHUD` dormindo sobre cenário escuro — `isDarkBackground`) |
| `soulmon/fx-ataque/fx-<el>-aura-96.png` | 154 · **96²** — aura por elemento (desde 04/10/2026, 153 refeitas da folha nova por nearest; `neutro` segue a de R2-3) | `auraForElement(el, 96)` (`attackFxArt.ts`) | Pet (`FichaEstados` — aura a 2× = o vidro 192 inteiro) |
| `soulmon/icons/games/hand-*` | 3 · 128² | `RPSGame.tsx` | Jogos (`PPT`) |
| `soulmon/icons/categories/icon-cat-*` | 8 · 128² | `types/category-icons.ts` | Atividades (`LinhaHabitoEstados`, `CriarAtividade`) — ⚠️ **pixel FORA do visor** (lista de tarefas é aparelho). Divergência a registrar no canvas de Atividades, não a reproduzir |
| `soulmon/elementos/` | 154 · **96²** (17 base + 136 derivados, rodada 2 do Higgsfield, 04/10/2026; `el-neutro` 128² antigo) | `elementIconArt.ts` (glob) | Arena (`DueloSheet`, 32 px) |
| `soulmon/fx-ataque/` | 924 · 128² — 154 elementos (17 base + 136 derivados + neutro) × 6 estados; os 153 com folha nova trocados em 04/10/2026 (rodada 2 do Higgsfield, sem a franja branca) | `attackFxArt.ts` (glob, chunk preguiçoso da luta) via `combatFx.ts` | `BattleStage` (Arena, Duelo, Pesadelo, Masmorra) + aura da Ficha/Evolução |
| `soulmon/combate/` | 17 `bg-<base>` (360×640, ampliados `pixelated`) · 17 `escudo-<base>` (128²) · `sombra-clara`/`sombra-escura` (256×96) — 04/10/2026 | `combatArt.ts` | `BattleStage`: cenário por elemento do INIMIGO (Arena, Duelo), escudo do defensor no bloqueio, plataforma sob os pés |

### 1.4 Marca e PWA (fora do visor — vetor/imagem de marca, não pixel)

| Asset | Onde |
|---|---|
| `public/favicon.svg`, `favicon-192x192.png`, `favicon-512x512.png` | `index.html`, `manifest.json` |
| `android/res/mipmap-*/ic_launcher*.png`, `drawable/splash.png` | app Android |
| Splash `#splash` — chama em SVG inline (109 `<rect>`), wordmark Silkscreen | `index.html` (não é arquivo) |
| `src/assets/brand/final/logo.svg`, `icon-1024/512/192.png`, `loading.mp4` | **sem importador** — fonte dos favicons; guardar como "master" da marca |

---

## 2. Instalado mas SEM uso (≈150 arquivos) — veredito um a um

> ⚰️ **Foto de 15/09/2026.** Em 22/09 (QA Rodada 2 `06` §2.1) **nenhuma destas pastas existe mais**:
> `soulmon/buttons/` (13), `soulmon/ui/` (3), `soulmon/evolution/node-*` (4), `brand/mascot-*` (42),
> `brand/logo-raw.svg` (`ls src/assets/soulmon/`, `ls src/assets/brand/`). A tabela fica como registro
> do veredito que valeu; **o que ainda está no disco e sem consumidor é a §2b**.

Varredura: basename de cada arquivo em `src/assets/` procurado em todo `src/**/*.{ts,tsx,css}` e `index.html`.

| Pasta | Qtd | O que é | Veredito |
|---|---|---|---|
| `soulmon/buttons/` | 13 · 878×252 etc. | botões pixel em 3 tamanhos × 4 estados | **FORA do visor → não usar.** Botão é `--sm2-*` + SVG (`04` §2.5). Candidatos a remoção do bundle |
| `soulmon/ui/btn-sm/md/lg.png` | 3 | idem (esses 3 ainda são importados em 1 lugar) | idem — achado a registrar no canvas Sistema |
| `soulmon/windows/window-inventory-frame.png` | 1 · 1100×821 | moldura de janela de inventário | **FORA** (folha/`ModalSheet` é vetor). Não usar |
| `soulmon/progress/` | 4 · ~900×254 | barras HP/XP pixel (segmentada ciano/vermelha, lisa) | **DENTRO** se a barra ficar no HUD do visor (`HomeHudEstados`); **FORA** se ficar no card de stats. **Decisão do dono** — o wireframe da Home põe o HUD onde? Se dentro: reescalar para 1× (hoje 900px é 3–4× o necessário) |
| `soulmon/icons/` (raiz) | 32 · 128² — home, profile, gear, bell, search, trash, lock, map, potion, skull, flame, bolt, sleep, bath, wake, evolution, activities, items, attr-poder/harmonia/benevolencia… | ícones pixel de SISTEMA | **FORA → não usar.** Todos têm equivalente Material Symbols (`Icon.tsx`). `A3` (atributos) e `A10` (banho/dormir) já marcados obsoletos no backlog |
| `soulmon/icons/games/icon-game-*` | 5 · 128² — dino, dungeon, rps, tournament, activities | ícones dos cards de jogo | **FORA** (o hub de Jogos é aparelho). Material. Não usar |
| `soulmon/evolution/node-*` | 4 · 128² — current/forecast/locked/reached | nós da árvore de evolução | **Decisão do dono**: `EvoArvore` é visor ou aparelho? O `04` §3.1 lista `EvolutionCeremony` como retrô mas não a árvore. Ver também os 8 nós do kit `E:` (§4) — dois conjuntos concorrentes |
| `soulmon/lines/full/` | 69 · 256² — kaelen/orrin/thalindra nas 11 formas + (01/10/2026, §8 I24) ignar/lumel/serah/igni em 3 estágios × 3 galhos + ultra | árvore completa das linhas curadas | **DENTRO.** Mapa `utils/lineFullArt.ts`; sem consumidor porque `DUNGEON_LINE_SPRITES` só usa 4 por linha. Uso possível: `EvoArvore` de demo, `Bestiario`, inimigos por galho. Guardar |
| `icons/icon-chip-*`, `icon-heart-item` | 4 · 128² | versão antiga dos itens (duplicada em `soulmon/items/`) | duplicata → remover |
| `brand/mascot-candidates/` (15), `mascot-branches/` (18), `mascot-*.png` (8), `mascot-ingame/idle.png` | 42 · 2048² | exploração de mascote (Higgsfield/Gemini, jul/2026) | **fora do app** — arquivo de processo. Tirar do `src/` (pesa no repo, não no bundle). Guardar em `D:\Soulmon\brand-archive\` |
| `brand/logo-raw.svg`, `logo-v1-raw.png`, `logo-preview.png` | 3 | rascunhos de logo | idem — arquivo |
| `src/assets/7e77…png`, `9087…png`, `90d2…png` | 3 · hash como nome | sobras de export | remover |

---

## 2b. Os 102 órfãos de 22/09/2026 — PEDIDO DE LIMPEZA (nada apagado ainda)

Método (QA Rodada 2 `06` §2.2, script `orfaos.mjs` da rodada): todo `'../…/*.png|webp|mp4|svg'` em
`src/**/*.{ts,tsx}` (sem `.test.`) + `figma:asset/` + os 6 diretórios de `import.meta.glob` + `url()`
do `index.css`; o que não é alcançado por nenhum é órfão. **Não é achado de bundle** — nada disso entra
em `dist/`; é peso de repo (9,6 MB; `git count-objects -vH` → size-pack 553 MiB) e inventário mentindo.
**Quem executa:** `arte-instalador`, com aval do dono para as linhas marcadas "decisão"; arquivo de
processo vai para `D:\Soulmonrand-archive\`, nunca para o lixo.

| Pasta / arquivo | Qtd | Veredito | Ação pedida |
|---|---|---|---|
| `soulmon/icons/` raiz + `categories/` + `games/` | 54 | pixel FORA do visor — `04` §1 e a §2 acima já vetam; continuam no repo | **apagar** |
| `soulmon/lines/full/` | 69 | "guardar" (§2) — 69 × 256²; mapa `utils/lineFullArt.ts` desde 01/10/2026 (glob eager, fora do bundle sem importador) | manter; sem consumidor |
| `brand/final/` | 7 | `icon-512.png` é **byte a byte igual** a `public/favicon-512x512.png` (`md5sum` = `f46ba897…`); `logo.svg` (1 230 `<rect>`) ≠ `public/favicon.svg` (637 `<rect>`) — **duas vetorizações da mesma chama**; `loading.mp4` 1,6 MB + `loading-thumb.webp` sem consumidor | **decisão do dono**: declarar `public/favicon.svg` como a única chama vetorial (D8 diz que a fonte é `E:/logo/`) e apagar a cópia; `loading.*` → arquivo |
| `backgrounds/home-scene-1547.png` | 1 · **4,2 MB** | a versão leve (`home-scene-texture.webp`, 32 KB) é a usada no CSS; o PNG é arquivo de processo | **arquivar** em `D:\Soulmonrand-archive\` |
| `soulmon/progress/` (4), `windows/` (1), `hud/glyph-*` (2), `soulmon/bg/tournament.png` (1), `icons/confetti-burst.png` (1), `7e77…png` (1) | 10 | `tournament.png` 960×540 é o formato antigo já substituído por `tournament-night/final`; hash-PNG = sobra de export; os outros são "decisão do dono" na §2 há 7 dias | `tournament.png` e `7e77…png` **apagar**; os 8 restantes: decisão do dono |
| **Total** | **102** | 9,6 MB | — |

Contraparte que a mesma rodada fechou: **zero consumidor sem asset e zero asset de mapa sem
consumidor** — `src/assets/artMaps.contract.test.ts` (novo, 14/14) cobre `emblemArt` (9/9),
`lineIcons` (72/72), `BG_THUMBS` (28/28), `ITEM_ART` (13/13), `DREAM_ART` (30/30), `ADVENTURE_ART`
(24/24), `DECOR_ART` (34/34) nas três direções. Tamanhos: 46 arquivos > 400 KB em `src/assets`
(43 PNG viram WebP no `dist/`, maior 212 KB; os 2 MP4 acima do teto seguem na `DIVIDA_ATUAL`).
**E1** (`dias-completos-30.png` ainda desenha 3 lajes ✓, e é renderizado) continua aberto —
`ASSETS-A-GERAR.md` §5.

---

## 3. Gerado e NÃO instalado (`_gemini_out/`) — por leva

| Leva | Qtd · formato | O que é | Visor? | Ponto de chamada hoje | Veredito |
|---|---|---|---|---|---|
| `E:\Soulmon-assets\instalados\criaturas\` (rodada 4 do Higgsfield, 04/10/2026) | 40 · 256² + 64² (alfa binário, nearest) | criaturas pequenas fofas, "NPC ajudante" no log | dentro | **nenhum** | **Decisão do dono (04/10): não entram agora** — processadas e guardadas com prancha + `MANIFEST.md`; `dragaozinho-casca` lembra franquia, revisar |
| `entrega2/` | 6 movimento 64² + 6 ganho 96² + `fx-heal` + `move-poof` + `nest-cradle-wide` 660×312 | poeira de passo, Z de sono, espreguiçar, selo de dia perfeito, level-up, baú, confete, burst de evolução, selo de foco; berço largo (`A12`) | dentro | **nenhum** para os 6 de movimento; ganho tem momento (`DailyReportModal`, masmorra, evolução); berço substitui `nest-base` | **instalar berço** (`nestArt`, `h:104`); ganho/movimento entram quando a animação for escrita (Home/Rituais/Evolução) |
| `entrega3/` | 8 · 1200×648 | os 8 cenários da loja em versão DIA (solar punk) | dentro | `PET_BACKGROUNDS` aceita | **Decisão do dono**: par dia/noite (pelo relógio do app?) ou descarte. O `HANDOFF-GERACAO` diz que o teste solar punk "não continua" |
| `entrega4/` | 7 spritesheets anim (células 64²) + **6 do Dino** (4 obstáculos 128², chão 384×48, parallax 512×128) | comer, coração, banho, sono, cocô, faísca, poeira — quadro a quadro; conjunto do Dino Runner | dentro | anim: nenhum (novo); **Dino: substitui silhuetas + linha de 1px em `DinoGame.tsx`** | **Dino = instalar já** (é o buraco mais visível; atenção à colisão do obstáculo 3). Anims: Home (`PetCarinho`, `PetDormindo`, banho) quando houver infra de spritesheet |
| `entrega5/` | `anim-spirit-float` 384×96 · `idle-ignar` 256×128 | espírito flutuando (lobby da masmorra), idle animado do Ignar | dentro | nenhum | protótipo de "pet animado" — decisão: vale animar as 6 linhas? (6 × N gerações) |
| `entrega6/` (raiz) | **102** · 128² — 17 elementos BASE × 6 estados | FX de ataque por elemento | dentro | nenhum (combate não tem elemento) | instalar junto com os 816 derivados quando o combate ganhar elemento; caminho barato: `fx-<el>-aura` na Evolução (galho já é elemental) |
| `backgrounds/evolution-ritual`, `evolution-ultra` | 2 · 1080×1920 | fundos estáticos da cerimônia | dentro | a cerimônia usa vídeo | guardados; entram só se a cerimônia ganhar variação por galho |
| `icones/tilesF/`, `aventura2/tilesD/` | 16 + 15 · 128²/96² | folhas fatiadas cruas (`F-00…`, `D-00…`) | — | — | intermediários de fatiamento; os finais já estão no repo (`elementos/`, `adventures/`). Ignorar |
| `branches/` | 12 · 2048² + refs 512² | Igni/Nautil/Astria (3 runs do oráculo, 4 formas cada) | dentro | nenhum — nunca viraram sprite (xadrez falso, precisam `dechecker`) | **Decisão**: são 3 linhas a mais (9 no total) ou foram substituídas por kaelen/orrin/thalindra? Se entram: recortar + 256² |
| `processed/` (30) e raiz (30 × 1024²) | kaelen/orrin/thalindra 11 formas | já instalados em `lines/full/` | — | — | fonte; ignorar |

**Rodada 3 (30/09/2026) — instaladas**: `fundos-v2/final/` (9 fundos + 7 miniaturas, `ASSETS-A-GERAR.md` §8 I10) e `_tom-home-v2/` (53 telas retonadas só em matiz + highlight, substituídas no mesmo caminho — `bg-gameboy` fora; §8 I11); `npcs-flare/final/` (16 bustos de NPC — 10 de lote em `LOT_NPC_ART`, 6 de função em `FUNCTION_NPC_ART` **sem chamada**; §8 I12; saíram `npc-placeholder-poring`/`-coruja-cervo`) e `lotes-v2/final/` (10 prédios de lote; §8 I13; `lote-exploracao-dino.png` ficou sem consumidor). `npc-arauto-do-fim` da mesma pasta não é NPC (criatura de chefe) e não foi instalado. **01/10/2026 — instaladas**: `poderosos/final/` (24 chefes 512² em `soulmon/bosses/`, `data/bossRoster.ts`, **sem chamada**; §8 I18 — inclui o `boss-arauto-do-fim`) e `npcs-femininas/final/` (12 bustos `npc-f-*` em `EXTRA_NPC_ART`, **sem chamada**; §8 I19).

**Rodada 3 — instalação final (01/10/2026), PR 1**: `hall-lab-v2/final/` (2 fundos + 6 lotes do Hall/Laboratório, substituem os de mesmo nome; §8 I20), `lotes-v2/final/lote-arena-feira.png` (§8 I21; `lote-loja-conquistas.png` sem consumidor) e `visores/final/` (5 cenas de mini-visor, ovo e 9 sprites 48², ligados a Troca/Eco/Revisão/Bolhas/Respiração/FeiraVisor/RebirthModal por `utils/visorScenes.ts`; §8 I22). Ficam no banco: `hall-lab-v2/final/lote-bonus-amigos-sorvete.png` (alternativa) e os `.webp` dos dois fundos.

**Rodada 3 — instalação final, PR 2 (01/10/2026)**: `arvore-generica/` (11 sprites 384² Noctyl em `soulmon/` + 11 de 256² em `drawable-nodpi/` — saiu o corvo repetido; §8 I23), `criaturas/final/` (40 PNG de ignar/lumel/serah/igni em `lines/full/`, mapa `lineFullArt.ts`, sem consumidor; nautilu/astrase pendentes; §8 I24), `extras/final/duelo-oponente-1..6` (`soulmon/duelo/` + `dueloArt.ts`, sem chamada; §8 I25) e `poderosos/final/boss-arauto-do-fim-full.png` (corpo inteiro do Arauto, `bossRoster.ts`; §8 I26).

**Rodada 3 — instalação final, PR 3 (01/10/2026)**: `gemini-recriados/` (67 PNG que substituem o de mesmo nome — 16 auras de ataque, `food-rice`, `fx-defeat`, `furn-crystal` e 48 `el-*`; §8 I27) e 3 NPCs extras do banco (`npc-f-lua` Selene, `npc-f-ferreiro` Mallo, `npc-f-ferreira` Kova; §8 I28, sem chamada). Com isto, **tudo o que a rodada 3 gerou e estava aprovado está no repo**; o que ainda não existe é arte pendente de geração (nautilu/astrase, 89 `el-*`) ou alternativa deixada de propósito no banco (`lote-bonus-amigos-sorvete`).

Levas já instaladas (conferido por nome): `backgrounds` (17/19), `decor` (21), `decor-v2` (14), `icons` (58/59 — falta só `poop.png`, que virou outro nome), `arcano` (14), `aventura` + `aventura2` (24), `entrega7/icones` (137), `berco` (1).

---

## 4. Kit de UI pixel — `E:\Soulmon-assets\out\` (179, nunca instalado)

Gerado no Gemini a partir do "UI Design Kit v1.2" (petróleo/turquesa/cobre), alfa real, fatiado.
**Problema estrutural: é um kit de UI em pixel art, e a tese do Visor põe a UI do lado vetor.**
A maior parte contradiz o `04` §1 e §5.4 ("ícone nunca em box") e o `README` do kit é anterior à tese.

| Pasta | Qtd | Veredito pela tese |
|---|---|---|
| `buttons/` 13, `controls/` 20 (nav, chips, checkbox, radio, toggle, avatar-frame, badge), `glyphs/` 14, `icons/` 45, `window/` 7, `panels/` 2 (`frame-9slice`, `panel-card`), `bars/` 6 | 107 | **FORA do visor → não instalar.** São o que os tokens `--sm2-*` + Material Symbols já resolvem. Servem só como **referência de linguagem** para o canvas Sistema (chanfro, cobre, ciano) |
| `nodes/` 8 (cristal/orbe/shard × locked/available/complete) | 8 | mesma decisão dos `soulmon/evolution/node-*` (§2): se `EvoArvore` for visor, escolher UM dos dois conjuntos |
| `evolution-fx/evolve-01..06` 192² | 6 | dentro (cerimônia) — mas a cerimônia é vídeo; concorre com `gain-evolution-burst` da entrega2. Guardar |
| `scenery/bg-circuit-tile` 256² (tileável), `balloon`, `tooltip` | 3 | tile = `A14` do backlog ("opcional, o CSS já cobre"); balão/tooltip são FORA. Só o tile tem chance, como textura do visor |
| `logo/` 8 (marca completa ×2, ícone de app ×2, chama, cristal) | 8 | **concorre com `brand/final/logo.svg`** já em uso nos favicons. Decisão do dono: qual é a marca canônica? Hoje o app usa a do repo |

---

## 5. Class-System — `D:\Soulmon\Class-System\assets\`

| Pasta | Qtd | Estado |
|---|---|---|
| `elementos/` | 137 · 128² | **já no repo** (`soulmon/elementos/`, idêntico) |
| `sigilos/` | 45 · 192² alfa — um por classe/elemento base (agua, ar, arcano, benca, combate_fisico…) | **não instalado, sem consumidor no app.** O Class-System ainda não está integrado ao Soulmon (é repo à parte). Uso futuro: Pet (`FichaEstados` — classe), Evolução (galho). Dentro do visor se acompanhar o sprite; fora se for chip de ficha (aí vira SVG). **Decisão de produto antes de arte** |

---

## 6. Mapa fluxo → assets (o "projeto de onde vai cada coisa")

Legenda: ✅ existe e está ligado · 📦 existe, falta instalar · ❓ decisão do dono · ✏️ falta criar (→ §7)

| Fluxo | Superfícies com arte bitmap (dentro do visor) | Estado |
|---|---|---|
| **Sistema** | nenhuma — tokens, tipografia, Material, SVG. Splash inline. Favicons/ícone de app | ✅ (marca) · ❓ marca canônica (repo × kit `E:`) |
| **Home** | sprite do pet (11 formas / 6 linhas) · palco: `home-scene-1547` + pet-box · berço · 33 decorações · partículas de cuidado · itens (13) · cocô · HUD (barras) | ✅ sprites/decor/itens/FX · 📦 berço largo, anims (comer/coração/banho/sono/passo) · ❓ barras pixel no HUD · ✏️ **sprite do jogador** (hoje placeholder SVG quando não é linha demo) |
| **Atividades** | nenhuma (é aparelho) — ícones de categoria hoje em pixel | ❓ registrar divergência; trocar por Material no canvas |
| **Rituais** | 30 sonhos · 24 aventuras · selos de ganho (dia perfeito, marco 21 dias) | ✅ sonhos/aventuras · 📦 `gain-perfect-day`, `gain-focus-seal` (só se o marco for desenhado no visor; o relatório é SVG — `A16` obsoleto) |
| **Pet** | sprite grande na ficha · 137 ícones de elemento · Dex (sonhos) · sigilos de classe | ✅ · ❓ sigilos |
| **Onboarding-funil** | `intro.mp4` · `mascot-raven` · 6 linhas (`EscolherPersonagem`) · splash | ✅ |
| **Onboarding-oráculo** | `Gerando` (loading) · `Reveal` (sprite gerado) · `RevealSemSprite` · `Nascimento` | ✏️ **placeholder de "ovo/silhueta"** para geração pendente ou falha · ✏️ animação de "gerando" no visor (hoje?) |
| **Evolução** | `EvoArvore` (nós) · `Cerimonia` (vídeo) · `EvoSpriteEstados` · `Renascimento` | ✅ vídeo · ❓ nós (2 conjuntos concorrentes) · 📦 `gain-evolution-burst` / `evolve-01..06` / `fx-<el>-aura` |
| **Jogos** | Masmorra (10 andares, inimigos, FX, espírito) · Dino (chão, obstáculos, parallax, cena) · PPT (mãos, altar) · Torneio (2 arenas) · Pesadelo | ✅ cenas 6–10, PPT, arenas, inimigos · ✏️ **regerar `dungeon-1..5` em 1080×1920** · 📦 conjunto do Dino · 📦 FX por elemento (102 + 816) quando o combate tiver elemento · ❓ Pesadelo usa qual cena? |
| **Loja** | 8 pet-box · 33 decorações · `TorneioSegmento` (emblemas de vitrine) | ✅ · ✏️ substituir/retirar `bg-gameboy/matrix/ocean` (800²) · ❓ versão dia (entrega3) · ✏️ **arte de Emblema** (slot `trophy` = "território de Emblemas", nenhum PNG existe) |
| **Estatísticas** | `Album`, `Bestiario` (criaturas do pool procedural) | ✏️ ❓ o bestiário mostra imagem? Hoje só texto; se sim, é geração em massa (decisão) |
| **Social** | sprite do outro jogador (`PerfilJogador`), NPCs | ✅ (linhas) · depende do "sprite do jogador" |
| **Conta** | nenhuma | — |
| **Fora do app** | widget Android (11 `sprite_*`, `partner_area`, `ui_t_bg_01`, barras/corações em XML) · overlay desktop (🫶 🫧 — `A21.1`) · pushes | ✅ sprites · ✏️ glifos do overlay (2) · ✏️ **ícone monocromático de notificação** (Android `small icon` — não existe) · ❓ `ui_t_bg_01`/`partner_area` são arte antiga: conferir origem |

---

## 7. Lista de assets A CRIAR

Ordenada por valor. Formato e regra de geração já resolvidos onde possível (ver `HANDOFF-GERACAO.md` §3 e `scripts-arte/GUIA-GEMINI.md`).

### P1 — buraco visível ou bloqueia fluxo

| # | Asset | Formato | Onde | Observação |
|---|---|---|---|---|
| C1 | **`dungeon-1..5` em pé** (regerar as 5 cenas antigas) | 1080×1920, chão contínuo nos 26% de baixo | Jogos › Masmorra | anexar a versão 960×540 como referência para manter a cena; mesma receita das 6–10 |
| C2 | **Placeholder de criatura "em gestação"** (ovo/silhueta/glitch) | 256² alfa, pixel | Onboarding-oráculo › `RevealSemSprite`, `Gerando`; Home quando o sprite do jogador ainda não existe | hoje cai em SVG genérico. É a peça que segura a experiência enquanto a via #1 (API) não tem crédito |
| C3 | **17 cenários pet-box que hoje são só gradiente CSS** — `bg-arena-champion`, `bg-arena-spotlight` (Torneio), `bg-room`, `bg-night`, `bg-desert`, `bg-forest`, `bg-snow`, `bg-lava`, `bg-sakura`, `bg-toytown`, `bg-synthwave`, `bg-mission-{filecity,infinity,coliseum,abyss,dinoland,aurora}` | 1200×648, chão em 74% | Loja › `CenariosMobilias`, `TorneioSegmento`; Home (palco) | corrigido: os 6 itens vendidos por Emblemas JÁ têm arte em `decorArt`; o buraco real é o catálogo de cenários — 28 vendidos, 11 com imagem (8 no formato certo). **Decisão prévia:** gerar os 17 ou podar o catálogo no canvas da Loja (vários são paleta antiga: synthwave, toytown, sakura) |
| C4 | **Ícone monocromático de notificação** | SVG/PNG 24dp branco sobre transparente (Android) | Fora do app › `Pushes` | é vetor (fora do visor) — derivar da chama do splash, não gerar |
| C5 | Os 2 glifos do overlay desktop (Carinho, banho) — `A21.1` | 128² alfa, pixel | Fora do app › `OverlayPrincipal` | dentro do visor do overlay |

### P2 — decisões do dono (respondidas em 15/09/2026)

| # | Decisão | Consequência para os assets |
|---|---|---|
| D1 | **Free escolhe de uma pré-seleção; pago recebe o rookie gerado e as formas seguintes são geradas conforme avança** | pré-seleção = as 6 linhas (+ `lines/full/` para as 3 do oráculo). Decidir se `branches/` (Igni/Nautil/Astria) entra na pré-seleção → recortar. **C2 (placeholder de forma ainda não gerada) vira obrigatório** para o pago. Seguir os wireframes (`EscolherPersonagem`, `Reveal`, `RevealSemSprite`) |
| D2 | **Fazer os 3 para escolher** | montar folha de contato da `EvoArvore` em 3 versões: SVG por token · `soulmon/evolution/` (4) · `E:/nodes/` (8). Checkpoint do dono antes do canvas de Evolução |
| D3 | **Pixel dentro do visor** | reescalar `progress/` (4) para 1×; `A5` (segmentada fina) e `A6` (moldura 9-slice) voltam ao backlog como P2 |
| D4 | **Descartar versão dia** | `entrega3/` arquivada; nenhuma cena dia será gerada |
| D5 | **Um sprite por pet; expressão por deformação (bounce/squash, como no andar e no carinho)** | NÃO gerar idle nem spritesheet de criatura (`entrega5` descartada). As 7 anims de `entrega4` são FX ao redor do pet (migalhas, coração, respingo, Z, cocô, faísca, poeira) — continuam válidas como efeito, não como sprite |
| D6 | **Sigilos entram na Ficha do Pet, dentro do visor** | instalar os 45 de `Class-System/assets/sigilos/` (192² → conferir escala no visor); exige definir de onde vem a classe do bicho (Class-System) |
| D7 | **Bestiário não tem superfície visual** | nada a gerar; `Estatísticas › Bestiario` sai do inventário de arte |
| D8 | **Marca canônica = kit `E:/logo/` (chama + cristal)** | trocar favicons, `manifest.json`, `ic_launcher`, `drawable/splash.png` e a chama do `#splash`. ⚠️ Os PNGs do kit têm ~250–480px — insuficiente para ícone 1024². Precisa **vetorizar** (ou regerar em alta) antes. Arquivar `brand/final/` |
| D9 | **Elemento vem do galho; só na Evolução por agora** | instalar `entrega6/` base (102) junto dos 816 e unificar em `attackFxArt.ts`; estrear `fx-<el>-aura` em Evolução/Ficha. Combate segue genérico |
| Limpeza | **Aprovada** | feita em 15/09: mascotes (42), rascunhos de logo (3), sobras com hash (3) e `icons/` duplicada (4) movidos para `D:\Soulmon\brand-archive\` (124 MB). `assets.contract.test.ts` passou (25/26). **Não movidos:** `buttons/`, `ui/`, `windows/`, `progress/`, `icons/` raiz — `PixelKit.tsx` (componente em uso) importa `ui/btn-*.png` e o teste de contrato os mede; é divergência a registrar no canvas Sistema, não um `mv` |
| Emblemas | **Aprovados os 8** (§7.1) | gerar — `arte-emblema` |
| C3 | **Gerar os 17** | `arte-cenario` |
| `branches/` | **Entra na pré-seleção** | recortar as 12 (B1) — 9 linhas |

### 7.1 Proposta de 8 Emblemas (a aprovar) — só se o slot `trophy` ganhar conquistas, não moeda

Hoje Emblema é **moeda** (`currencies.ts`: "ganhe vencendo no Torneio", também por missão semanal) e os itens da vitrine já têm arte. Se a ideia é conquista exibível no visor, proposta pelo que o jogo já mede:

| # | Emblema | Gatilho já existente |
|---|---|---|
| 1 | Primeiro Dia Perfeito | `report.wasPerfect` |
| 2 | 7 dias seguidos | streak (`habitRhythm`) |
| 3 | Marco de 21 dias | `A21.2` / cerimônia de marco |
| 4 | Primeira Evolução | `EvolutionCeremony` |
| 5 | Forma Mega | estágio `mega` |
| 6 | Andar 10 da Masmorra | `dungeon-10` |
| 7 | Campeão do Torneio | `closeSeason` / ranking 1º |
| 8 | 100 tarefas concluídas | contador de tarefas |

Formato: 64² alfa, pixel, paleta do kit, sem texto. Aguarda "sim" do dono e a decisão moeda × conquista.

### P3 — melhora, não destrava (backlog antigo ainda válido)

| # | Asset | Ref |
|---|---|---|
| E1 | `A13` splash/loading como conteúdo de visor (hoje é SVG inline e funciona) | `BACKLOG-ARTE-GERAR.md` |
| E2 | `A5` barra segmentada fina, `A6` moldura cano+vinha 9-slice — **D3 disse "dentro": válidos** | idem |
| E3 | `A14` textura de circuito tileável — já existe em `E:/scenery/bg-circuit-tile.png` (256²); é instalar, não gerar | idem |
| E4 | Variação de decoração para cenários claros — só se D4 aprovar o dia | `HANDOFF-GERACAO` §5 |

### O que NÃO criar (já decidido)

`A3` ícones de atributo, `A10` banho/dormir, `A15` traços, `A16` relatório, qualquer botão/ícone/moldura/janela pixel para fora do visor, ícone de Bits, arte de terceiro. Fundo da página do Torneio (removido de propósito).

---

## 8. Limpeza recomendada (antes de executar, para o inventário parar de mentir)

1. Tirar do `src/assets/` o que é arquivo de processo: `brand/mascot-*` (42), rascunhos de logo (3), os 3 PNGs com hash — mover para `D:\Soulmon\brand-archive\` (fora do repo ou em `docs/`). ~90 MB de repo.
2. Remover duplicata `src/assets/icons/` (4) — os mesmos itens vivem em `soulmon/items/`.
3. Marcar como "não usar" (ou remover) `soulmon/buttons/`, `soulmon/ui/`, `soulmon/windows/`, `soulmon/icons/` raiz e `icons/games/icon-game-*` — pixel fora do visor. Antes, conferir o único importador de `ui/btn-*.png` e registrar a divergência.
4. Atualizar a memória: a pasta `Desktop\icones\ui\` não existe mais; `image 1547` já está instalada.
5. Fechar no `BACKLOG-ARTE-GERAR.md`: `A12` (berço) e `A20` (aventura) estão gerados; `A21.1` pendente; acrescentar C1–C5.

---

## 9. Execução

Fila com uso/formato/prompt: `docs/ASSETS-A-GERAR.md`. Squad: `/squad-arte` (8 agentes `arte-*`).

### 9.1 Ordem

1. Limpeza (§8) → o `src/assets/` passa a conter só o que o app usa ou vai usar.
2. Instalar o que já existe e tem ponto de chamada: **Dino** (entrega4), **berço largo** (entrega2), `bg-circuit-tile` (se D3/E3).
3. Gerar C1–C5.
4. Só então `/squad-design identidade sistema` — o canvas Sistema nasce sabendo que não há bitmap fora do visor e o canvas de cada fluxo referencia esta tabela (§6) como lista fechada de arte.

## Corvinho (11 formas) - derivado do mascote

`soulmon/corvo/corvo-<id>.png` (512, RGBA) e `corvo-<id>-256.png`, 11 ids da arvore (rookie = mascote original). Recolor programatico de `mascot-raven.png` por `scripts/gen-corvo-forms.py`; conferencia `scripts/check-corvo-forms.py`. Ainda sem consumidor (integracao e de outra fatia). Notas: `docs/reviews/admin-corvo/arte-notas.md`.
