# QA Rodada 2 — 06 · Som + Arte + Design + Marca

> Repo `D:\Soulmon\repo`, branch `qa/rodada-2-2026-09-22`, HEAD `a6c1cd8a`. 22/09/2026.
> Papéis inline: `squad-som` (diretor + engenheiro), `squad-arte` (`arte-gerador`/`arte-conferente`/
> `arte-instalador`), `squad-design` (design-lead + wireframer), `alpha-marca-critico` +
> `alpha-marca-estrategia`. Somente leitura, exceto o TESTE novo autorizado (§2.3).
> Regra (b): nada das duas rodadas anteriores volta aqui a menos que marcado **ainda aberto**.

---

## 1. Som (`squad-som`)

### 1.1 O que foi rodado

```
npx vitest run src/utils/sounds.contract.test.ts src/utils/sounds.visorTune.test.ts \
  src/utils/audioBus.contract.test.ts src/utils/audioBus.rex.test.ts \
  src/utils/loudness.contract.test.ts src/utils/sonsAssets.contract.test.ts \
  src/utils/cortes.contract.test.ts
→ Test Files 7 passed (7) · Tests 135 passed (135) · 8,80 s
```

### 1.2 Evento × som — cobertura medida

`CATEGORIA_DO_SOM` (`src/utils/loudness.ts`) tem **8** chaves; os 8 `playX` de `src/utils/sounds.ts`
têm chamador vivo (`grep -rn "play\(Presence\|TaskComplete\|Feed\|Shower\|Evolve\|Degenerate\|Sleep\|VisorTune\)\b" src --include=*.ts --include=*.tsx | grep -v test`):

| `playX` | categoria | chamadores (símbolo) | gesto? |
|---|---|---|---|
| `playEvolve` | marco | `App.tsx` › `celebrateHabitMilestone`, `handleEvolve` | sim (toggle de tarefa / cerimônia) |
| `playPresence` | presenca | `CompanionHUD.tsx` › `handlePetClick` (1×/sessão, checa `document.hidden`) | sim |
| `playDegenerate` | degeneracao | `App.tsx` › `handleDegenerate` ← `EvolutionPath.tsx` › `confirmDegenerate` | sim (voluntária) |
| `playVisorTune` | sintonia | `CompanionHUD.tsx`, `EvolutionPath.tsx` (`varrendoSintonia`) | sim |
| `playFeed` | cuidado | `App.tsx` › `handleFeed` (×3), `DungeonGame.tsx`, `NightmareBattle.tsx` | sim |
| `playShower` | cuidado | `CompanionHUD.tsx` › `handleShowerClick` | sim |
| `playSleep` | cuidado | `App.tsx` › `handleSleep` (só DEITAR, C-7) | sim |
| `playTaskComplete` | conclusao | `App.tsx` › `handleToggleTask`/`handleToggleActivityCompletion`, `handleFeed` (glitchtama/heart), `DinoGame.tsx`, `RPSGame.tsx` | sim* |

`*` `DinoGame.tsx` dispara no game-over (colisão) — não é toque, mas é consequência de partida iniciada por gesto; a D11 aceita ("gesto ou consequência do gesto", `audioBus.ts` › `OrigemDoDespacho`).

**Nenhum `playX` sem chamador; nenhum chamador de `playX` cortado** (C-1..C-9 verdes).

**Handlers que mudam estado SEM som** (`grep -o "const handle[A-Za-z]* = " src/App.tsx` → 69): `handleShopBuy`, `handleRebirth`, `handleCheckInConfirm`, `handleNewReading`, `handleRecoverHearts`, `handleDungeonLose`, `handleGlitchtama`, `handleEquipBackground/Furniture`, `handleExchangeCredits`, `handleBuyCreditPack`, `handleAccountUnlocked`, `handleUpgradeRevealed`, `handleTriageResolve`, `handleFreshStart`, `handleCompleteOnboarding`, `handleCompleteTutorial`. Todos coerentes com **R-NOVA** (superfície nasce muda) e com os cortes (C-3 loja ≠ comer). Não é achado — é a regra funcionando. O que a escada de loudness deixa à mostra: as categorias **`transacao`** e **`arcade`** (`loudness.ts` › `ALVO_LUFS`) **não têm nenhum membro** em `CATEGORIA_DO_SOM`. Não é bug (S12 diz que a Arena é muda; `transacao` é reserva), mas o `loudness.contract.test.ts` não trava "categoria vazia é declarada como reserva" — se alguém pendurar `playShopBuy` em `conclusao` por preguiça, nada fica vermelho. Severidade baixa.

### 1.3 Achado S-1 — a trilha NÃO para no sono automático (E0 declarado, não fiado) — **médio**

`docs/SOM.md` §2.1 S13: *"E0 (`document.hidden` · app sem foco · `isSleeping` · janela de descanso) … vale para os SFX que existem hoje"* e o cabeçalho de `src/utils/trilha.ts` diz *"`pausar()` é o gancho do App para dormir/janela de descanso"*.

Medido: `grep -rn "pausarTrilha\|retomarTrilha" src --include=*.ts --include=*.tsx | grep -v test` → **2** pontos, ambos no `App.tsx`: `handleSleep` (gesto manual) e `handleToggleSound` (mudo). O **sono automático** (`App.tsx`, o `useEffect` com `AUTO_SLEEP_START`/`AUTO_SLEEP_END` que faz `setIsSleeping(… inWindow …)` a cada 60 s) **não chama `pausarTrilha()`**. Consequências:

1. Trilha ligada por gesto às 22:50 → 23:00 o pet dorme sozinho → a trilha continua em loop com o pet dormindo (o próprio hint da `SettingsPage` diz "Para sozinha quando o app sai de vista" — e dormir não é "sair de vista").
2. App aberto depois de 23:00 (pet já dormindo) → primeiro `play*` → `aoGestoSonoro` → `ligarTrilha()` → a trilha começa **com o pet dormindo**, porque `comecar()` só checa `pausada`/`isMuted()`, nunca `isSleeping`.
3. A **janela de descanso** (`rest.window`, `restWindow.ts`) não toca `pausarTrilha` em lugar nenhum — o E0 a cita e ela não está fiada.

Não há teste: `grep -rln "pausarTrilha\|retomarTrilha" src | grep test` → só `settingsSom.render.test.tsx` cita por prosa. **Conserto**: mover a chamada de `handleSleep` para um `useEffect([isSleeping])` (cobre o automático e o manual com um caminho só) e escrever `trilha.e0.test.ts` (liga por gesto → `setIsSleeping(true)` → `trilhaTocando() === false`). Dono: `squad-som` (engenheiro).

### 1.4 `prefers-reduced-motion` / mudo do sistema

`grep -rn "prefers-reduced-motion\|matchMedia" src/utils/{sounds,audioBus,trilha,sonsAssets,loudness}.ts` → **0**. Correto por desenho: reduced-motion é preferência de MOVIMENTO (o `04` §6.4 a aplica no CSS), não de áudio, e a Web não expõe "mudo do sistema" (o `AudioContext` toca no volume do aparelho; mudo físico = silêncio). A trilha nasce desligada (S2) e o mudo global cala tudo (`isMuted()` antes de qualquer nó, `sounds.contract.test.ts`). Sem achado. Único ponto cinza: **`ligarTrilha()` com `soundMuted` ligado** persiste `SOUND_TRACK_ENABLED=true` e não toca; ao desligar o mudo, `retomarTrilha()` religa — coerente com o hint da tela ("Com os sons desligados, a trilha fica em silêncio").

### 1.5 D11 / autoplay — chamada antes de gesto?

`grep -n "new AudioContext\|AudioContext(" src/utils/*.ts` → só `audioBus.ts` › `construtorDeContexto`, chamado por `garantirBarramento()`; chamadores fora do módulo: `trilha.ts` › `comecar()` (só após `ligarTrilha`/`retomarTrilha`) e `tocarNa` (só via `play()`). `prepararAssets` só dentro de `playComAsset`. **Nenhum caminho cria contexto no carregamento.** A única retomada sem gesto direto é `trilha.ts` › `aoTrocarVisibilidade` (aba volta), guardada por `ligadaNestaSessao` — S13 E0 a autoriza explicitamente.

Detalhe: `play()` chama `aoGestoSonoro()` **antes** de `tocarNa` checar `abaOculta()`. Se um `play*` for disparado com a aba oculta (hoje nenhum é: os timers não tocam), a trilha ligaria sem a aba visível. Guard preventivo barato: `aoGestoSonoro` só quando `!document.hidden`. Severidade baixa.

### 1.6 Verificação adversarial das correções da R1 (som)

- "Sobre declara sons" (`SettingsPage.sobre.render.test.tsx`) e `settingsSom.render.test.tsx` → passaram no lote de 135. `sonsAssets.contract.test.ts` re-hasheia `public/sounds/*.webm` × manifesto × `Attributions.md` (não é tautológico: lê o disco).
- A/B cego (S16) **ainda aberto** — depende do dono ouvir; nenhuma rodada pode fechar.

---

## 2. Arte (`squad-arte`)

### 2.1 Inventário × disco

```
find src/assets -type f | wc -l                → 1726 (1723 imagens/vídeos + 2 .md + 1 .ts)
por família: soulmon 1618 · backgrounds 58 · decor 33 · brand 8 · icons 4 · raiz 3 · video 2
por extensão: png 1716 · webp 3 · mp4 3 · md 2 · ts 1 · svg 1
du -sh src/assets → 121 MB  (bg 43 M · backgrounds 36 M · fx-ataque 20 M)
git count-objects -vH → size-pack 553 MiB
```

`docs/INVENTARIO-ASSETS.md` §0 diz **1.352** arquivos e "≈150 sem referência"; §2 ainda lista `soulmon/buttons/` (13), `soulmon/ui/` (3), `soulmon/evolution/node-*` (4), `brand/mascot-*` (42), `brand/logo-raw.svg` — **nenhuma dessas pastas existe mais** (`ls src/assets/soulmon/`, `ls src/assets/brand/`). O doc se declara "estado ANTES da rodada; re-varrer com `/squad-arte inventario`" — e ninguém re-varreu em 7 dias. Achado **A-1 (doc apodrecido, baixo)**: o inventário conta arquivos que foram apagados e não conta os 371 que entraram (lines/icons 72, sigilos 45, elementos/fx-ataque…). Conserto: rodar `/squad-arte inventario` e datar §0/§2. Dono: `arte-conferente`.

### 2.2 Assets sem consumidor — **102**, 9,6 MB (script `scratchpad/qa3/orfaos.mjs`)

Método: todo `'../…/*.png|webp|mp4|svg'` em `src/**/*.{ts,tsx}` (sem `.test.`) + `figma:asset/` + os 6 diretórios de `import.meta.glob` + `url()` do `index.css`.

| pasta | qtd | veredito |
|---|---|---|
| `soulmon/icons/` raiz + `categories/` + `games/` | 54 | pixel FORA do visor — `04` §1 e `INVENTARIO` §2 já vetam. **Ainda no repo** (não no bundle). Apagar |
| `soulmon/lines/full/` | 29 | "guardar" pelo `INVENTARIO` §2 — ok, mas 29 × 256² sem mapa: se um dia entrarem, precisam de `*Art.ts` com glob |
| `brand/final/` | 7 | `icon-512.png` é **byte a byte igual** a `public/favicon-512x512.png` (`md5sum` = `f46ba897…`); `logo.svg` (1230 `<rect>`) ≠ `public/favicon.svg` (637 `<rect>`) — **duas vetorizações da mesma chama no repo**; `loading.mp4` 1,6 MB + `loading-thumb.webp` sem consumidor. Decidir qual é fonte (D8 diz `E:/logo/`) e apagar a cópia |
| `backgrounds/home-scene-1547.png` | 1 · **4,2 MB** | a versão leve (`home-scene-texture.webp`, 32 KB) é a usada no CSS; o PNG original é arquivo de processo → `D:\Soulmon\brand-archive\` |
| `soulmon/progress/` (4), `windows/` (1), `hud/glyph-*` (2), `soulmon/bg/tournament.png` (1), `icons/confetti-burst.png` (1), `7e77…png` (1) | 10 | `tournament.png` 960×540 é o formato antigo já substituído por `tournament-night/final`; hash-PNG = sobra de export; os outros são "decisão do dono" no `INVENTARIO` §2 há 7 dias |

**Não é achado de bundle** (nada disso entra em `dist/`), é de **peso de repo e de inventário mentindo**.

### 2.3 Consumidor sem asset — TESTE NOVO (autorizado) `src/assets/artMaps.contract.test.ts`

```
npx vitest run src/assets/artMaps.contract.test.ts → 14 passed (14)
```

Cobre as 3 direções por mapa: (a) todo id do domínio tem arte; (b) toda arte na pasta do glob é alcançada por um id; (c) todo `import … from '../assets/…'` dos `*Art.ts` + `dungeonScenes.ts`/`sprites.ts`/`backgrounds.ts` resolve em disco; + autoverificação (id inventado → `undefined`).

| mapa | domínio | resultado |
|---|---|---|
| `emblemArt` | `ACHIEVEMENT_IDS` (9) ↔ `soulmon/emblems/` | 9/9, 0 órfãos |
| `lineIcons` | `DUNGEON_LINE_NAMES` (9) × 4 tiers × {32,64} | 72/72 |
| `ShopModal` › `BG_THUMBS` | `PET_BACKGROUNDS` (28) ↔ `backgrounds/thumbs/` | 28/28 |
| `ITEM_ART` | `FOOD_BY_CATEGORY` (8) + `CHIP_EMOJI` (3) + coração + glitchtama | 13/13 |
| `DREAM_ART` | `DREAM_CATALOG` (30) | 30/30 |
| `ADVENTURE_ART` | `ADVENTURE_CATALOG` (24) | 24/24 |
| `DECOR_ART` | `ALL_SHOP_ITEMS` kind=furniture (34) | 34/34 |

**Zero consumidor sem asset, zero asset de mapa sem consumidor.** O buraco que o teste fecha é o das 924 auras com chave errada (20/09) — antes só `attackFxArt.test.ts` cobria um mapa. Custo: 33 ms.

### 2.4 Tamanhos > 400 KB

`find src/assets -type f -size +400k | wc -l` → **46** (43 PNG + 3 MP4). Todos os 43 PNG viram WebP no `dist/` pelo `convert-to-webp.mjs` — maior imagem em `dist/assets`: `dungeon-2-*.webp` **212 KB** (< `TETO_IMAGEM` 400 KB de `orcamentoDeBytes.contract.test.ts`). Os 2 MP4 (3,9 MB + 2,5 MB) estão na `DIVIDA_ATUAL` da R1 — **ainda aberto** (correção #3, WebM/CSS). Sem achado novo.

### 2.5 E1 — rearte de `dias-completos-30` — **ainda aberto** (visto, não só lido)

`src/assets/soulmon/emblems/dias-completos-30.png` (64², 7.720 B, último commit `4a8b8049`) ampliado 6× (`scratchpad/qa3/emblem6x.png`): **três lajes com ✓ empilhadas** — é o `tasks-100` renomeado, símbolo de pilha de tarefas (o que a #16 veta). O emblema **é renderizado**: `PetPage.tsx` › `emblemArt(id)` (ficha) e `MilestoneCeremony.tsx` › `emblemFor`. O prompt de E1 está pronto em `ASSETS-A-GERAR.md` §5; falta rodar `/squad-arte gerar emblema E1`. Dono: `arte-gerador` (gerar) + dono (aprovar a folha). Severidade média (é conquista visível que contradiz a linha vermelha de contagem).

---

## 3. Design (`squad-design`)

### 3.1 Telas/estados novos pós-R1 sem canvas

Delta `a6c1cd8a` em `src/components` + `index.html`, cruzado com `docs/design/INVENTARIO-WIREFRAMES.md`:

| estado novo | código | linha no inventário | veredito |
|---|---|---|---|
| **Aviso "conta excluída"** no portão | `SoulmonOnboarding.tsx` › `avisoContaExcluida` (lê e apaga `ACCOUNT_DELETED_NOTICE`) | `grep -in "exclu\|410" INVENTARIO-WIREFRAMES.md` → **0** | **dívida de canvas** — é estado do `IDENTITY_STEP` (ONB-05..09 não o têm). Nova linha `ONB-09a` + célula em `PortaoEstados`. Uma vez só, mensagem terminal: cabe na folha de estados |
| `TermsUpdateBanner` com variantes (termos / privacidade / ambos, `region`, "abre em nova aba", "Entendi") | `TermsUpdateBanner.tsx` | `RIT-02` cita `termos` como 8º aviso, "reusam `.sm2-notice` — sem artboard novo" | **canvas Sistema cobre** o bloco; as 3 variantes são copy. Registrar na linha `RIT-02` que são 3 textos, não 1 |
| Gate de WebView **por plataforma** (Android → 2 botões da Play; não-Android → texto; `mailto`, `lang`) | `index.html` (script inline, `var android = /Android/i…`) | `ONB-02` = um estado | **dívida de canvas leve**: `SplashWebView` desenha um; hoje são 2 ramos com CTA diferente. Acrescentar `ONB-02b` (Android) na mesma folha |
| Hints "isto vai para a IA" (tutorial `soulGoal`, humor no check-in, `customKeywords`) | `GameTutorialFlow.tsx`, `MorningCheckIn.tsx`, `AISettingsModal.tsx` | `ia.camposEnviados.contract.test.ts` exige o hint; inventário não cita | **canvas Sistema cobre** (`sm2Hint`). Sem artboard; anotar em `ONB-39`/`RIT-03`/`CONTA-14` |
| Sobre + `FeedbackLink` na `SettingsPage` (9 grupos) | `SettingsPage.tsx` | `CONTA-01` já diz "dívida de canvas, não de componente" | **ainda aberto** (R1) |
| `ErrorBoundary` com feedback | `FeedbackLink.tsx` | `HOME-47` | coberto |

### 3.2 Fila da Fase 3 (o que desenhar ANTES dos 10 usuários)

Critério W5 (frequência × quem vê) + o bloqueador do E0 (`02-discovery-e0.md` §4.3):

1. **Onboarding do convidado com cortesia (R-D1)** — *ainda aberto e não executado*: `grep -n "key: '" src/App.tsx` → 8 avisos (`firstDay`…`termos`); **nenhum** é "sua leitura completa está liberada". `grep -rin "cortesia" src/App.tsx src/components/*.tsx | grep -v test` → 0. O convidado que recebe `accountTier:'paid'` por `fetchEntitlement` **continua sem ser avisado** da porta do Oráculo (só `UnlockNudge variant='reveal'` na Evolução). Desenhar: (a) card na **Fila 2**, posição declarada entre `hp` e `semanal` (é raro e é o evento mais importante do E0), `[novo]`; (b) estado `HOME-xx` "cortesia liberada" na folha `HomeAvisosCartoes`; (c) CTA → `SoulmonOnboarding mode='upgrade'`. Guard: `filaDeAvisos.contract.test.ts` (posição) + `copy.semFomo`. **P0 para o E0.**
2. `ONB-09a` aviso de conta excluída (§3.1) — P1, é o estado que uma exclusão real produz e que hoje só o código conhece.
3. `ONB-02b` gate de WebView Android — P2 (raro, mas é a primeira coisa que um convidado com WebView velho vê).
4. `CONTA-01` com 9 grupos (Sobre/Feedback) — P2, ainda aberto da R1.
5. Runbook de suporte visual (R7 do E0): não é canvas, mas a tela "Precisamos de uma atualização" + "compra só no Android" + "instalar no iPhone" precisam de **um artboard cada** para o dono responder com print. P2.

**Não desenhar antes do E0:** Social/Biblioteca (gate de Vínculo 5, ninguém chega em 14 dias), Renascimento (só após ultra), Torneio final.

Dono: `soulmon-design-lead` decide a ordem; `design-wireframer` desenha; item 1 precisa do `alpha-product-manager` (texto) antes.

---

## 4. Marca (`alpha-marca-critico` + `alpha-marca-estrategia`)

### 4.1 Plataforma de marca existe como doc? — **Não.** (médio)

O que existe, e o que cada um cobre:

| doc | cobre | não cobre |
|---|---|---|
| `docs/manual/04-IDENTIDADE-VISUAL.md` §1 | tese visual ("O Visor"), tokens, tipografia, ícones, movimento, marca como asset (§10) | propósito, posicionamento, promessa, personalidade, RTB |
| `docs/NARRATIVA-E-UNIVERSO.md` | 12 leis de escrita (voz), vocabulário canônico, o que nunca se diz | posicionamento contra alternativas; não é "a marca", é "o mundo" |
| `docs/BOOKLET-UNIVERSO.md` (1084 linhas, PT+EN) | tom, lore, "o que ele nunca vai saber sobre você" (§VII — a promessa de privacidade em prosa) | nada de mercado; sem tagline; sem arquitetura |
| `docs/PLAY-FICHA.md` §6.3 | **a única tagline escrita**: "Ela cresce com o seu dia." / "It grows with your day." | não passou pelo `narrative-critic` (R1 #6, **ainda aberto**); não aparece em `01-VISAO`, `NARRATIVA`, `BOOKLET` (`grep -rn "cresce com o seu dia" docs/` → só a ficha) |
| `docs/HANDOFF-IDENTIDADE.md` §2 | 4 escolhas de processo (canvas primeiro, sistema antes de tela, escuro, checkpoint) | zero conteúdo de marca |
| **`brand/design-system.md`** | **é da Consultech360** ("Plataforma de Conexão 360°", azul corporativo) — sabido desde 09/09 (`04` §12) | **e continua sendo carregado como canônico por 2 agentes locais**: `.claude/agents/design-critic.md` (passo 1: "Load `brand/design-system.md` (canonical tokens)") e `.claude/agents/staff-frontend.md` (passo 1). R1 (`08` §1) achou os dois "duplicados local×global" mas não que apontam para marca alheia |

Consequência prática, medida: **três frases de marca para o mesmo produto, em três lugares, sem dono**: `index.html` › `og:title` "o bichinho que evolui com você" · `PLAY-FICHA` "Ela cresce com o seu dia." · `manifest.json`/título Play EN "próprio" (R1). Nenhuma passou por um documento que diga qual é a promessa.

**Conserto (alpha-marca-estrategia):** um `docs/MARCA.md` de uma página — propósito (a essência já existe: "avatar que evolui COM o usuário e o encoraja — nunca um cobrador", `01-VISAO` §2), posicionamento contra Finch/Habitica/Forest (o benchmark de `PLANO-EVOLUCAO` já dá a matéria), personalidade com contraexemplos (as L1–L12 já são a régua), promessa (uma frase — escolher entre as três acima, com o `narrative-critic`), RTB (sem streak que zera, sem cobrança, sem sensor, leitura do Oráculo). Depois: apagar `brand/design-system.md` (ou substituir pelo ponteiro) e corrigir os 2 agentes. Dono: dono do projeto decide a promessa; a squad escreve.

### 4.2 Teste de troca de logo — Home e `BirthCard`

- **Home**: a marca é o `<h1 class="sm2-hud-wordmark">Soulmon</h1>` (`src/components/pixel/HomeHud.tsx`) — **texto em Fredoka 600**, sem símbolo. Troque a string por "Finch" e nada mais na Home denuncia: a chama (`BrandFlame`) só aparece no portão (`SoulmonOnboarding`) e no splash. **A tela mais vista do app carrega a marca só como palavra tipográfica** — não reprova (é uma decisão do canvas Home, `.wordmark`), mas o teste de troca falha por ausência de símbolo, não por fraqueza do símbolo.
- **`BirthCard`**: `grep -n -i "brand\|flame\|logo\|Soulmon\|wordmark" src/components/BirthCard.tsx` → **0**. O cartão que a R1 chamou de "único ativo viral" (`share_birthcard` proposto) **não leva marca nenhuma** — nem wordmark, nem chama, nem URL. Se um dia for compartilhado como imagem (hoje não há `navigator.share`/`toBlob` em lugar nenhum: `grep -rn "navigator.share\|toBlob" src` → 0), sai anônimo. **Achado M-2 (baixo hoje, alto quando o share existir):** definir no canvas Estatísticas (§27) o rodapé de marca do cartão — "Soulmon" + chama 1× no canto, fora do vidro — antes de implementar `share_birthcard`. Dono: `soulmon-design-lead` + `alpha-marca-direcao-arte`.
- **Sem wordmark vetorial**: `familia=marca` M1 (`005a2941`) vetorizou a **chama** (`public/favicon.svg` 637 rects; `src/assets/brand/final/logo.svg` 1230 rects — duas versões, §2.2). Não existe wordmark como vetor; a L2 da fila `loja` pede "wordmark (`familia=marca`, vetor) à esquerda" — **hoje isso é Fredoka renderizada**, não um asset. Ou a família `marca` entrega um `wordmark.svg` (Fredoka 600 convertida em paths, licença OFL permite) ou a L2 diz "texto Fredoka, não asset". Dono: `arte-gerador familia=marca`.

### 4.3 `BOOKLET-UNIVERSO.md` como ativo de marca (tom × ficha × app)

- **Tom**: o booklet fala em 2ª pessoa, íntimo, sem imperativo ("O que ele nunca vai saber sobre você"). A ficha da Play (§6.2 legendas) segue ("Ela mudou de forma com o seu dia."). O app segue nas falas do pet (`petVoice.ts`, L1–L12 travadas por `narrativa.contract.test.ts`). **Coerente.**
- **Onde diverge**: `index.html` › `og:description` — "Cadastre hábitos e tarefas de verdade; sua criatura cresce, evolui e ramifica em função do que você fez. Retrô, pixel art, sem cobrança." — voz de release, 3ª pessoa, "cadastre" imperativo, "retrô, pixel art" (fala do meio, não do mundo). O booklet nunca diz "pixel art"; diz "visor". **Achado M-3 (baixo)**: o `<head>` inteiro (title/og/description) fora do vocabulário do booklet — R1 #6 já pediu revisão do `narrative-critic` para ficha + `<head>` juntos; **ainda aberto**.
- **Ativo**: o booklet é a única peça que junta promessa (§VII), universo (§III–§V) e vocabulário (§XVII) nas duas línguas. É **o brandbook que não se chama brandbook**. Recomendação: `docs/MARCA.md` (§4.1) aponta para ele como "voz e mundo", em vez de reescrever.

### 4.4 `og:image` = favicon — **ainda aberto** — e o BRIEF pedido

`index.html` › `og:image` → `https://soulmon.mateus-sprnd.workers.dev/favicon-512x512.png`; `twitter:card` = `summary` (miniatura quadrada). `04` §10.0 e `PLAY-FICHA` §6.3 pedem o key visual; a fila `loja` (L2/L3) existe desde 21/09 e **não rodou**. Abaixo o BRIEF no padrão do `arte-gerador.md` (família `loja` = **composição**, não geração — o bloco de geração só entra na única peça gerada, o fundo).

#### BRIEF L2 — Feature graphic 1024×500 (PT e EN)

```
familia=loja  id=L2  método=COMPOSIÇÃO (script Pillow/sharp), saída sem alfa
saída: docs/loja/play/pt/feature-1024x500.png · docs/loja/play/en/feature-1024x500.png
grade: 1024×500 · margem segura 154 px por lado (15 %) e 75 px em cima/embaixo · tudo que
       importa dentro de 716×350 central
fundo: --sm2-bg escuro #08191A sólido (nada em pixel fora do visor; sem gradiente, sem textura)
esquerda (x 154→470): wordmark "Soulmon" Fredoka 600, 64 px, --sm2-ink #E9F5F2, caixa alta como
       .sm2-hud-wordmark; abaixo, 20 px de vão, tagline Rubik 400 28 px, --sm2-muted #9DBCB4:
       PT "Ela cresce com o seu dia."  ·  EN "It grows with your day."
       (uma linha; se o narrative-critic trocar a frase, troca aqui — nunca desenhada pelo gerador)
direita (x 560→870, centrado em y): o VISOR do sistema — o mesmo `Viewport` da Home:
       vidro 256×256 com anel de cobre (--sm2-gold-ink #EBBE84 sobre #8A5A2B), fundo do vidro
       --sm2-viewport-bg #071413; DENTRO, uma criatura de demonstração (PREMADE_CHARACTERS —
       sugerido `kaelen`/Pyraka rookie, `soulmon/lines/kaelen-rookie.png` 256² a **0,5× = 128**,
       nearest — escala inteira, como o `BirthCard` §27) centrada no chão do vidro (GROUND_Y 74 %)
chama: BrandFlame scale 2 (38×60) no canto superior direito do vidro, dentro do anel — a marca
       aparece 2× (palavra + símbolo), é o que o teste de troca de logo pede
proibido: dígitos, "rookie/mega", emoji, #2bff95, magenta/roxo, texto pequeno, qualquer pixel
       fora do vidro, sprite derivado (só demo)
aceite (arte-conferente): copy.semFomo sobre a tagline; PROIBIDAS_PT/EN; formato exato;
       amostra de pixel: fundo == #08191A em (10,10) e (1014,490); nada com alfa
```

Se o dono quiser um **fundo pintado** dentro do vidro (em vez de vidro liso), a única geração é uma cena `[PET-BOX]` (bloco §1, 1200×648) reduzida para 256² **dentro** do vidro:

```
[PET-BOX] … The floor line sits at exactly 74% of the image height … — acrescentar no fim:
"Keep the composition simple and readable at 256 pixels wide: one stone floor, two vine-covered
pillars at the edges, one floating turquoise crystal top-right, the centre empty for a creature."
```

#### BRIEF L3 — `og:image` 1200×630

```
familia=loja  id=L3  método=RECORTE/REENQUADRE de L2 (nunca um terceiro asset)
saída: public/og-1200x630.png (+ index.html › og:image absoluto; twitter:card → summary_large_image)
como: renderizar a MESMA composição de L2 numa grade 1200×630 (1,905:1 vs 2,048:1 — não esticar):
      fundo #08191A, wordmark+tagline à esquerda (x 120→560), visor à direita (x 720→1080),
      margem segura 60 px; a versão PT (og:locale pt_BR) — uma só, o crawler não troca idioma
peso: ≤ 300 KB PNG (crawler do WhatsApp corta acima de ~600 KB); sem alfa
instala: arte-instalador, depois do arte-conferente; CACHE_VERSION sobe (public/ muda)
aceite: og:image resolve 200 com `curl -sI`; Facebook Sharing Debugger / opengraph.xyz mostra o
      visor e a palavra inteiros no corte 1,91:1 e no corte quadrado (WhatsApp 1:1 → o visor tem
      de caber sozinho no centro: por isso ele fica em x 720→1080 e não no canto)
```

Os dois briefs vão para `docs/ASSETS-A-GERAR.md` §14 (L2/L3 já têm linha; falta o corpo acima). **Não gerado nesta rodada** (a tarefa proíbe).

---

## 5. Tabela final

| # | achado | severidade | conserto | dono |
|---|---|---|---|---|
| S-1 | Trilha não para no **sono automático** nem na janela de descanso; `ligarTrilha` toca com o pet dormindo (E0 declarado em `SOM.md` §2.1 e no cabeçalho de `trilha.ts`, fiado só no gesto manual) | **médio** | `useEffect([isSleeping])` → `pausarTrilha/retomarTrilha`; `comecar()` recusa se dormindo; teste `trilha.e0.test.ts` | `squad-som` |
| S-2 | `aoGestoSonoro()` roda antes de `abaOculta()`; categorias `transacao`/`arcade` vazias sem guard de "reserva declarada" | baixo | guard `!document.hidden` em `aoGestoSonoro`; `loudness.contract` lista as categorias-reserva | `squad-som` |
| S-3 | A/B cego S16 não ouvido | — | **ainda aberto** (R1) | dono |
| A-1 | `INVENTARIO-ASSETS.md` conta 1.352 arquivos (disco: 1.723) e lista pastas apagadas (`buttons/`, `ui/`, `evolution/`, `mascot-*`) | baixo | `/squad-arte inventario`, datar §0/§2 | `arte-conferente` |
| A-2 | 102 assets sem consumidor (9,6 MB): 54 ícones pixel fora do visor, `home-scene-1547.png` 4,2 MB, `brand/final/icon-512.png` duplicado byte a byte do favicon, 2 vetorizações da chama (`logo.svg` ≠ `favicon.svg`) | baixo (repo, não bundle) | apagar/arquivar em `D:\Soulmon\brand-archive\`; declarar `public/favicon.svg` como única chama vetorial | `arte-instalador` |
| A-3 | **E1** `dias-completos-30.png` ainda desenha 3 lajes ✓ (pilha de tarefas) e **é renderizado** (`PetPage`, `MilestoneCeremony`) | médio | `/squad-arte gerar emblema E1` (prompt pronto §5) | `arte-gerador` → dono aprova |
| A-4 | Consumidor sem asset / asset de mapa sem consumidor | **nenhum** — teste novo `src/assets/artMaps.contract.test.ts` 14/14 | manter no CI | — |
| A-5 | 2 MP4 acima do teto (3,9 + 2,5 MB) | — | **ainda aberto** (R1 `DIVIDA_ATUAL`) | `squad-arte` |
| D-1 | Aviso "conta excluída" no portão sem linha/canvas | baixo | `ONB-09a` em `PortaoEstados` | `design-wireframer` |
| D-2 | Gate WebView com 2 ramos, 1 artboard | baixo | `ONB-02b` | `design-wireframer` |
| D-3 | Banner de termos (3 variantes) e hints IA — canvas Sistema cobre | — | anotar nas linhas `RIT-02`/`ONB-39`/`RIT-03`/`CONTA-14` | `design-wireframer` |
| D-4 | **Convidado com cortesia nunca é avisado** (R-D1 não executado; 8 avisos na Fila 2, nenhum é "leitura liberada") | **alto p/ E0** | card na Fila 2 (posição declarada) + `HOME-xx` + CTA → `mode='upgrade'`; item 1 da Fase 3 | `alpha-product-manager` (texto) → `design-lead` → `staff-frontend` |
| D-5 | `CONTA-01` 9 grupos sem canvas | — | **ainda aberto** (R1) | `design-wireframer` |
| M-1 | Não existe plataforma de marca; 3 taglines em 3 lugares; `brand/design-system.md` é da **Consultech360** e 2 agentes locais o carregam como canônico | **médio** | `docs/MARCA.md` (1 página: propósito/posicionamento/personalidade/promessa/RTB) apontando para BOOKLET e NARRATIVA; apagar `brand/design-system.md`; corrigir `design-critic.md`/`staff-frontend.md` | dono (promessa) + `alpha-marca-estrategia` |
| M-2 | `BirthCard` (futuro ativo viral) sem marca nenhuma; Home só com wordmark tipográfico; não existe wordmark vetorial (L2 pede um) | baixo hoje | rodapé de marca no cartão (canvas Estatísticas §27) antes do `share_birthcard`; `familia=marca` entrega `wordmark.svg` ou a L2 diz "texto Fredoka" | `design-lead` + `arte-gerador familia=marca` |
| M-3 | `<head>` (`og:title`/`og:description`) fora da voz do booklet ("cadastre…", "retrô, pixel art") | baixo | **ainda aberto** (R1 #6): ficha + `<head>` pelo `narrative-critic` | `soulmon-narrative-critic` |
| M-4 | `og:image` = favicon; L2/L3 da fila `loja` não rodaram | médio (é a cara do app em todo link compartilhado) | briefs L2/L3 acima → `ASSETS-A-GERAR.md` §14; `/squad-arte gerar loja L2 L3` | `arte-gerador familia=loja` → `arte-conferente` → `arte-instalador` |

**Sem dono:** (1) quem decide **a promessa** entre as três frases (é do dono — mas ninguém a colocou em `PERGUNTAS-DO-DONO.md`; proposta: #54 "Tagline única: A 'Ela cresce com o seu dia.' · B 'o bichinho que evolui com você' · C outra"); (2) o **peso do repo** (553 MiB de pack, 121 MB em `src/assets`) — nenhum guard mede `git count-objects`, nenhum agente é dono de "o que sai do git para o archive"; (3) categoria `transacao` da escada de loudness — reserva sem decisão registrada de "nunca terá membro" ou "terá quando".
