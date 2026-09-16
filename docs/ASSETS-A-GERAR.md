# Assets a gerar — lista completa, por família, com uso, formato e prompt

> **Data:** 15/09/2026 · **Base:** `INVENTARIO-ASSETS.md` (o que existe, medido) + as decisões do
> dono D1–D9 (15/09). Este documento é a **fila de trabalho**: cada linha "falta" tem uso,
> tela, formato, destino no repo, mapa que registra e o prompt pronto.
> **Quem executa:** a SQUAD-ARTE (`.claude/skills/squad-arte/`), um agente por família (§0).
> **Regra:** pixel art só dentro do visor (`manual/04-IDENTIDADE-VISUAL.md` §1). Nada aqui
> desenha botão, ícone de sistema, moldura ou janela — isso é `--sm2-*` + Material.

---

## 0. Famílias e agentes

| Família | Agente | O que cobre |
|---|---|---|
| Cenários | `arte-cenario` | cenas 1080×1920 (masmorra, arenas, minijogos) e pet-box 1200×648 (loja/palco) |
| Criaturas | `arte-criatura` | sprites das linhas, placeholder de forma pendente, recorte de `branches/` |
| FX e animação | `arte-fx` | partículas, spritesheets, FX de elemento, ganho/movimento |
| Emblemas | `arte-emblema` | as 8 conquistas exibíveis no visor |
| Marca | `arte-marca` | logo canônico (kit E:), favicons, manifest, launcher, splash, ícone de notificação |
| HUD do visor | `arte-hud-visor` | barras HP/XP, moldura 9-slice, sigilos, nós da EvoArvore, glifos do overlay |
| Instalação | `arte-instalador` | copia para o repo, registra nos mapas, bump de cache, testes |
| Conferência | `arte-conferente` | alfa real, xadrez, paleta, tamanho, chão 74%, costura, folha de contato |

Fluxo: `arte-<família>` gera → `arte-conferente` aprova → `arte-instalador` instala → `/soulmon fechar`.

---

## 1. Blocos de estilo (colar no início de todo prompt)

**[CENA]** — cena cheia 1080×1920
```
Retro pixel art background, 16-bit era, TALL VERTICAL PORTRAIT composition, 9:16 aspect ratio, much taller than wide. Dark fantasy meets ancient technology. Palette: deep petrol teal and near-black green as the base, glowing turquoise cyan as the only strong light source, aged copper and gold as accents. Recurring motifs: carved ancient stone, creeping vines and leaves over metal, faint circuit-board traces etched into surfaces, floating turquoise crystals. Mostly dark values with a few bright cyan light points. Flat colors, chunky visible pixels. No characters, no creatures, no text, no logos, no UI, no frame or border. Keep the middle of the image visually calm so sprites stay readable. CRITICAL — THE BOTTOM OF THE IMAGE: the lower 26 percent must be CONTINUOUS floor a character can stand on; do NOT put a black band or any letterboxing.
```

**[PET-BOX]** — faixa da loja / palco 1200×648
```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. Dark fantasy meets ancient technology. Palette: deep petrol teal and near-black green as the base, glowing turquoise cyan as the only strong light source, aged copper and gold as accents. Recurring motifs: carved ancient stone, creeping vines and leaves over metal, faint circuit-board traces etched into surfaces, floating turquoise crystals. Mostly dark values with a few bright cyan light points. Flat colors, chunky visible pixels. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.
```

**[SPRITE]** — peça recortada (ícone, emblema, FX, placeholder), gerada em FOLHA sobre branco
```
Pixel-art game sprite in the "SOUL MON" style: 16-bit dark fantasy tech-dungeon. Palette: deep teal #0E2E2E / #123232, neon cyan #6EFFFB, copper-bronze #C98B4B with darker #8A5A2B shading, electric blue #3E9EFF, near-black outline #061414. Chunky readable pixels, HARD aliased edges, 1px dark outline around every shape. STRICT: NO blur, NO soft glow, NO drop shadow, NO gradients, NO translucent aura, NO semi-transparent pixels. PURE SOLID WHITE BACKGROUND (#FFFFFF), nothing else behind the sprites. Each item is a CUT-OUT object floating alone on the white — no sky, no ground, no square tile, no frame. No watermark, no text, no letters, no numbers. Lay the items out in a neat grid with generous empty white gaps between them so they can be cut apart.
```
Recorte depois com `scripts-arte/_fatiar.mjs` (projeção de pixels; aborta se a contagem não bater).
Para peça única que precise de alfa limpo, trocar o fundo por **verde chapado `#00FF00`** e
recortar por chroma-key (`chroma-key.mjs`) — nunca pedir "transparent PNG".

**[ELEMENTO]** — quando o matiz precisar sair do kit (fogo, gelo…): manter a **linguagem** do
[SPRITE] (pixel chapado, contorno quase-preto, sem halo) e liberar só a cor dominante.

---

## 2. Cenários — `arte-cenario`

### Tem
- 9 cenas 1080×1920: `dungeon-6..10`, `tournament-night`, `tournament-final`, `minigame-dino`, `minigame-rps` (`src/assets/soulmon/bg/`, `dungeonScenes.ts`).
- 8 pet-box 1200×648: attic, arcade, library, shrine, rooftop, cloudsea, observatory, swamp (`src/assets/backgrounds/`, `PET_BACKGROUNDS`).
- 1 fundo da Home: `home-scene-1547.png`.
- Guardados (não instalar): `evolution-ritual`, `evolution-ultra` (cerimônia é vídeo); `entrega3/` (dia — descartado, D4).

### Falta — C1: regerar os 5 andares antigos em pé (1080×1920)

Uso: `DungeonGame` (`Jogos › MasmorraTurno/MasmorraAndar`), andares 1–5. Hoje 960×540 com `cover` cortando ~70%. Destino `src/assets/soulmon/bg/dungeon-N.png` (substitui). Mapa: já importado em `dungeonScenes.ts`; atualizar `accent` onde a paleta muda.
Método: **anexar a versão 960×540 atual como referência** e pedir "same scene, redrawn as tall portrait". **Exceção de paleta aberta pelo dono (15/09):** `dungeon-4` mantém o violeta e `dungeon-5` o rosa — nomes e `accent` ficam; o resto da cena segue o kit.

| id | nome (hoje) | prompt (depois de [CENA]) |
|---|---|---|
| `dungeon-1` | Gruta Azul | `SCENE: a flooded blue grotto, wet stone walls with dripping stalactites, a still pool reflecting a few turquoise crystals, copper pipes half-buried in the rock, faint circuit traces under the water. Recreate the attached reference scene faithfully as a tall portrait.` |
| `dungeon-2` | Caverna Verde | `SCENE: a mossy green cavern, roots and vines hanging from the ceiling, bioluminescent fungi in muted cyan, an old copper doorway overgrown at the far end, circuit traces on the doorway lintel.` |
| `dungeon-3` | Salão Dourado | `SCENE: a ruined golden hall, tall copper-gold columns, a cracked ceremonial floor, hanging chains, dim gold light with one turquoise brazier, vines climbing the columns.` |
| `dungeon-4` | Abismo Violeta (exceção: violeta permitido) | `SCENE: a bottomless abyss seen from a narrow stone bridge, copper scaffolding and chains vanishing into darkness below, a muted violet glow rising from far below as this scene's accent, floating crystals. Keep the violet desaturated and deep; everything else stays dark teal and copper.` |
| `dungeon-5` | Fenda Rósea (exceção: rosa permitido) | `SCENE: a narrow crystal rift, jagged crystal walls glowing a muted dusty rose as this scene's accent, a thin path of carved stone, copper anchors bolted into the rock, a few turquoise crystals. Keep the rose desaturated; everything else stays dark teal and copper.` |

### Falta — C3: 17 pet-box que hoje são gradiente CSS (1200×648)

Uso: `Loja › CenariosMobilias` (catálogo) e o palco da Home (`CompanionHUD`). Destino `src/assets/backgrounds/<id>.png`. Mapa: `PET_BACKGROUNDS[id]` ganha `image:`, `baseColor` reamostrado da faixa inferior, `slots`/`horizonY` mantidos; conferir chão em 74% (senão `setting:'void'`). Os 2 de arena se vendem por Emblemas (`TorneioSegmento`).

| id | nome | prompt (depois de [PET-BOX]) |
|---|---|---|
| `bg-arena-champion` | Arena dos Campeões | `SCENE: the floor of an ancient stone arena at night, tiered empty stands as dark silhouettes, copper-gold banners hanging on the far wall, one champion's laurel carved in stone above a gate, turquoise braziers at both sides, circuit traces in the arena floor.` |
| `bg-arena-spotlight` | Arena sob Holofotes | `SCENE: a dark arena floor lit by a single cone of turquoise spotlight from above, copper rigging and cables in the rafters, the crowd only as a dark mass, a chalk circle on the stone floor.` |
| `bg-room` | Quarto | `SCENE: a cozy small bedroom at night, a round window with stars, a wooden desk with a small turquoise screen glowing, a copper reading lamp, a rug, vines on the windowsill, circuit traces on the wall panel.` |
| `bg-night` | Céu Noturno | `SCENE: an open hilltop under a vast night sky, deep teal sky with pinpoint stars and a thin crescent, a single ancient copper obelisk with circuit traces, floating turquoise crystals near the horizon, low grass floor.` |
| `bg-desert` | Deserto Pixel | `SCENE: a dark desert at night, dunes as layered silhouettes, a half-buried copper machine ruin with cyan lights still blinking, a distant carved stone gate, cool teal sand instead of yellow.` |
| `bg-forest` | Floresta Nativa | `SCENE: a dense night forest, tall dark trunks, hanging vines and leaves, fireflies and small turquoise crystals as the only light, an ancient copper marker stone with circuit traces on the path.` |
| `bg-snow` | Terra Gelada | `SCENE: a frozen plain at night, ice-blue snow with a teal cast, a frozen copper pipeline crossing the scene, ice crystals glowing turquoise, aurora as faint cyan bands in the sky.` |
| `bg-lava` | Montanha de Lava | `SCENE: a volcanic slope at night, black rock, lava only as thin copper-orange cracks (muted, not red), a stone forge doorway with circuit traces, heat shimmer drawn as pixel stripes. Copper-orange is the accent, cyan stays as crystal light.` |
| `bg-sakura` | Cerejeira | `SCENE: a night garden with one large tree whose blossoms are pale turquoise-white instead of pink, petals drifting, a carved stone lantern glowing cyan, a copper footbridge over a still pond. NO pink, NO magenta.` |
| `bg-toytown` | Cidade dos Brinquedos | `SCENE: a whimsical miniature town of block-like houses with copper roofs and round cyan windows, toy-like proportions, a small wind-up mechanism visible on one house, circuit traces as the streets.` |
| `bg-synthwave` | Synthwave → **repaletizar** | `SCENE: a retro grid horizon at night, the grid drawn as turquoise circuit traces on dark teal ground, a huge dark sun disc with copper stripes on the horizon, distant mountain silhouettes. NO magenta, NO purple, NO pink — cyan and copper only.` |
| `bg-mission-filecity` | Cidade do Arquivo | `SCENE: a city of towering filing cabinets and stacked drawers as skyscrapers, copper handles and labels, cyan lit slots like windows, a narrow street floor of dark stone with circuit traces.` |
| `bg-mission-infinity` | Monte Infinito | `SCENE: a mountain path climbing into clouds, carved stone steps, prayer-like copper plates hung on a rope, turquoise crystals marking the way up, a summit lost in cyan mist.` |
| `bg-mission-coliseum` | Coliseu Digital | `SCENE: a colosseum whose arches are made of glowing circuit traces, stone and copper structure, holographic-looking cyan pillars, sand floor drawn in dark teal.` |
| `bg-mission-abyss` | Abismo da Masmorra | `SCENE: the mouth of a deep dungeon pit, stone ledge in front, chains and copper cages hanging over the void, faint cyan glow rising from below, vines on the ledge.` |
| `bg-mission-dinoland` | Vale dos Dinos | `SCENE: a prehistoric valley at night, giant fern silhouettes, a huge fossil skeleton half-buried with copper bolts holding it, turquoise crystals growing from the bones, dark grass floor.` |
| `bg-mission-aurora` | Aurora Digital | `SCENE: a snowy ridge under a digital aurora drawn as bands of cyan pixel stripes, an old copper antenna array pointing at the sky, circuit traces glowing in the snow.` |

**Regerar** (decisão 15/09) `bg-gameboy`, `bg-matrix`, `bg-ocean` em 1200×648, anexando o 800² atual como referência:

| id | nome | prompt (depois de [PET-BOX]) |
|---|---|---|
| `bg-gameboy` | LCD Retrô | `SCENE: the inside of a handheld console screen — a flat olive-teal LCD field with a faint pixel grid, a copper bezel visible only at the far left and right edges, two tiny cyan status pixels blinking in a corner. Recreate the attached reference faithfully as a wide banner.` |
| `bg-matrix` | Matriz Verde | `SCENE: a dark void with columns of falling glyph-like pixels in muted green-cyan, denser at the sides and calm in the middle, a flat dark floor of circuit traces. Recreate the attached reference faithfully as a wide banner.` |
| `bg-ocean` | Fundo do Mar | `SCENE: the sea floor at night, dark teal water, a sunken copper machine with cyan lights, kelp silhouettes at the sides, rising bubbles, sand floor. Recreate the attached reference faithfully as a wide banner.` |

---

## 3. Criaturas — `arte-criatura`

### Tem
- 6 linhas × 4 estágios (`lines/`, 256²) + as 11 formas completas de kaelen/orrin/thalindra (`lines/full/`).
- Árvore genérica de 11 formas (`rookie.png`…`ultra.png`, 384²).
- `dungeon-spirit`, `mascot-raven`.
- `branches/` (Igni/Nautilu/Astrase, 4 formas cada, 2048² com xadrez falso) — **entra na pré-seleção do free (D1)**.

### Falta — B1: recortar `branches/` (12) para sprite
Uso: pré-seleção do free (`Onboarding-funil › EscolherPersonagem`) — passa de 6 para 9 linhas. Formato 256² alfa. Pipeline: `scripts/dechecker.mjs` → recorte da bounding box → `finalize-oracle-sprites.sh` (sharp, nearest). Destino `src/assets/soulmon/lines/{igni,nautilu,astrase}-{rookie,champion,ultimate,mega}.png`; mapa `DUNGEON_LINE_SPRITES` + `DUNGEON_LINE_NAMES` (nomes sem `-mon`; o guard `sprites.dungeonRoster.test.ts` exige 6 linhas — **precisa subir para 9 no teste**). Sem geração nova.

### Falta — C2: placeholder de forma pendente (3 estados)
Uso (D1): o pago recebe o rookie gerado; as formas seguintes só são geradas quando ele chega lá. Enquanto isso, `Home › PetDeckEstados`, `Evolução › EvoSpriteEstados/EvoArvore`, `Onboarding-oráculo › Gerando/RevealSemSprite` mostram um placeholder **dentro do visor**. Formato 256² alfa, 3 peças, gerar em folha 3×1 sobre branco.
Destino `src/assets/soulmon/placeholder/`; mapa novo `placeholderArt.ts` (`'egg' | 'cocoon' | 'glitch'`), consumido por `getSpriteForStage` quando `stage.spriteUrl` estiver vazio.

```
[SPRITE] Three creature placeholders for a virtual-pet screen, left to right: (1) EGG — a rounded egg with a faint turquoise crack pattern like circuit traces, resting, no face; (2) COCOON — a dark teal cocoon wrapped in copper bands with one cyan glow slit, a silhouette of "something forming" inside; (3) GLITCH — the same egg but drawn as broken pixel blocks shifting sideways, a few blocks displaced, meaning "generation failed". Same size, same ground line. Square 1:1 full-bleed composition.
```

### Não gerar
Idle animado / spritesheet de criatura (D5: um sprite por pet, expressão por deformação em CSS). `entrega5/` arquivada.

---

## 4. FX e animação — `arte-fx`

### Tem (instalado)
- `fx/` 12: care-drop/heart-pair/heart-shine/heart-solid/hug/shower + fx-attack/defeat/dizzy/hit/shield/sparkle (`fxArt.ts`, chave = emoji).
- `fx-ataque/` 816 derivados (`derivedAttackFxArt.ts`).

### Tem (gerado, instalar) — F1..F4
| Leva | Peças | Uso | Destino / mapa |
|---|---|---|---|
| F1 `entrega4/` anims | 7 spritesheets 64² (eat-crumbs 4, heart-burst 4, shower-splash 4, sleep-z 3, poop-plop 3, sparkle-pop 4, dust-step 3) | `Home › PetCarinho` (heart-burst substitui os 3 corações estáticos), banho, `PetDormindo` (sleep-z — hoje sem sinal de sono), cocô ao aparecer, dia perfeito/compra (sparkle), passo (`walkPx`) | `soulmon/fx/anim-*.png`; infra: `background-position` em `steps(N)`, `prefers-reduced-motion` → último quadro |
| F2 `entrega2/` ganho | 6 × 96²: perfect-day, levelup, chest, confetti, evolution-burst, focus-seal | `DailyReportModal` (dia perfeito — só se desenhado no visor), masmorra (andar), evolução | `soulmon/fx/`, `fxArt.ts` |
| F3 `entrega2/` movimento | 6 × 64² + `fx-heal`, `move-poof` | passo, salto/queda do Dino, sono/acordar | idem; sem chamada hoje — instalar junto com a animação |
| F4 `entrega6/` base | 102 × 128² (17 elementos × aura/cast/defended/impact/orb/slash) | D9: `fx-<el>-aura` na Evolução/Ficha pelo galho | `soulmon/fx-ataque/`, unificar `attackFxArt.ts` |
| F5 `entrega4/` Dino | 4 obstáculos 128², chão 384×48, parallax 512×128 | `DinoGame` — substitui silhuetas e a linha de 1px | `soulmon/dino/`; atenção à colisão do obstáculo 3 (largura real) |

### Falta — F6: `anim-hunger-drop` (a única peça da entrega4 que falhou)
Uso: sinal de fome no visor (`HomeHudEstados`), 3 quadros. Falhou 2× por sair branca; trocar o SUJEITO:
```
[SPRITE] A 3-frame horizontal strip, cells 64x64, of a small DARK teal seed-bead falling: frame 1 high and small, frame 2 mid-fall and stretched, frame 3 landed and flattened with two tiny dust pixels. Body is deep petrol teal #123232 with a thick near-black outline; a single cyan highlight pixel. Do NOT draw water, do NOT draw it pale or white.
```

### Não gerar
`fx-hunger` como gota d'água; qualquer FX fora do visor (toast, confete de UI).

---

## 5. Emblemas — `arte-emblema` (aprovado: 8 conquistas)

Uso: conquistas exibíveis no slot `trophy` do palco (`Home`), na `Pet › FichaEstados` e na `Loja › TorneioSegmento` (ao lado da moeda Emblema, que continua sendo número). Formato 64² alfa, pixel, sem texto. Gerar em **uma folha 4×2** sobre branco. Destino `src/assets/soulmon/emblems/`; mapa novo `emblemArt.ts` (chave = id da conquista); gatilhos já existem no código (ver `INVENTARIO-ASSETS.md` §7.1). Nenhuma conquista pode ser comprada.

```
[SPRITE] Eight achievement badges for a virtual-pet game, 4 columns by 2 rows, each a small round-ish medal with a copper rim and a dark teal face, the symbol in neon cyan: (1) a single perfect star; (2) a seven-notch ring like a week wheel; (3) a sprouting seed inside a ring, "21 days"; (4) an upward chevron with a spark, first evolution; (5) a crown-like crest, mega form; (6) a stone gate with the number of steps hinted as 10 notches, dungeon floor 10; (7) a laurel wreath, tournament champion; (8) a stack of three checked slabs, one hundred tasks. No digits, no letters. Same size, same rim. Square 1:1 full-bleed composition.
```
ids: `perfect-day`, `streak-7`, `milestone-21`, `first-evolution`, `mega-form`, `dungeon-10`, `tournament-champion`, `tasks-100`.

---

## 6. Marca — `arte-marca` (D8: kit `E:/logo/` é o canônico)

### Tem
- `E:\Soulmon-assets\out\logo\`: `app-mark-full` (292×481), `app-mark-alt`, `app-icon` (243×328), `app-icon-tile`, `soul-flame-solo`, `soul-flame-alt`, `soul-crystal-solo`, `soul-crystal-alt` — PNG alfa, **baixa resolução**.
- Em uso hoje (a arquivar depois da troca): `public/favicon*.png/svg`, `brand/final/*`, `android/mipmap-*/ic_launcher*`, `drawable/splash.png`, a chama SVG inline do `#splash`.

### Falta — M1: versão em alta / vetor do kit
Uso: favicon 192/512, ícone 1024 (loja), `ic_launcher` (foreground + background adaptativo), `splash.png`, chama do `#splash`. Dois caminhos, na ordem:
1. **Vetorizar** o PNG (pixel art → um `<rect>` por pixel, como a chama atual do splash; `scripts-arte/_montar-frames.mjs` tem a base de leitura de pixels) — sem geração, fiel ao aprovado.
2. Se precisar de bitmap maior: **reprodução fiel** com a imagem anexada:
```
Recreate this exact pixel-art logo in full resolution, preserving precisely every pixel, colour and proportion — this is a faithful reproduction of an already-approved design, not a new interpretation. Pure solid white background. No text added, no glow, no gradient. Square 1:1 full-bleed composition.
```
Destinos: `public/favicon-192x192.png`, `favicon-512x512.png`, `favicon.svg`; `src/assets/brand/final/icon-1024.png`; `android/.../mipmap-*/ic_launcher*.png` + `ic_launcher_foreground`; `drawable/splash.png`; `index.html` (`#splash`, `<meta theme-color>` → `--sm2-viewport-bg`); `manifest.json` (`theme_color`/`background_color` para o escuro canônico).

### Falta — C4: ícone monocromático de notificação (Android)
Uso: `Fora do app › Pushes`. Hoje o Firebase usa `@mipmap/ic_launcher` (colorido — o Android pinta de branco e vira quadrado). Formato: vetor `drawable/ic_notification.xml` (24dp, branco sobre transparente), derivado da **chama** do kit. Sem geração — é SVG por mão. Registrar em `AndroidManifest.xml` `default_notification_icon`.

---

## 7. HUD do visor — `arte-hud-visor`

### Tem
- `progress/` 4 barras (899×254, ~4× o necessário) — D3: pixel dentro do visor → **reescalar para 1×** (nearest) e ligar no HUD (`HomeHudEstados`).
- `soulmon/evolution/` 4 nós; `E:/nodes/` 8 nós.
- `Class-System/assets/sigilos/` 45 × 192² — D6: entram na `Pet › FichaEstados`, dentro do visor. Instalar em `soulmon/sigilos/`, mapa `sigilArt.ts` (glob), reescalar para 64² ou 96² conforme o slot da ficha.

### Falta — H1: as 3 versões da EvoArvore (D2: dono escolhe)
Uso: `Evolução › EvoArvore`, os nós em 4 estados (current, forecast, locked, reached). Entregar **uma folha de contato** com a mesma árvore em: (a) SVG por token `--sm2-*`; (b) `soulmon/evolution/` 4 nós; (c) `E:/nodes/` cristal/orbe/shard. Sem geração; montagem por script (`_montar-frames.mjs`) ou HTML. Checkpoint do dono antes do canvas de Evolução.

### Falta — H2: barra segmentada fina (`A5`)
Uso: HP/XP compactos no HUD do visor. Formato: moldura 96×8 + preenchimento 1 segmento 6×6 (repetível), alfa. Verde `#00FF00` de fundo para chroma.
```
[SPRITE, background solid green #00FF00 instead of white] A thin segmented pixel bar for a virtual-pet HUD: an empty copper frame 96 pixels wide and 8 tall with a dark teal inner track, and beside it one separate cyan fill segment 6x6 that will be repeated inside the track. Hard edges, 1px near-black outline. No green in the pieces.
```

### Falta — H3: moldura de cano + vinha 9-slice (`A6`)
Uso: borda do visor / folhas dentro do visor. Formato 96×96 com cantos de 24px, centro vazio, alfa.
```
[SPRITE, background solid green #00FF00] A square 9-slice frame 96x96 for a pixel-art device screen: copper pipes as the border with rivets at the four corners, a thin vine with two leaves crossing the top edge, a small turquoise crystal set in the top-left corner, the inside completely empty (green). Border thickness 24 pixels, straight repeatable middles. No green in the frame itself.
```

### Falta — C5: os 2 glifos do overlay de desktop (`A21.1`)
Uso: `Fora do app › OverlayPrincipal` — rótulo do botão Carinho (hoje 🫶) e o efeito de banho (🫧), dentro do visor do overlay. Formato 32² alfa, folha 2×1.
```
[SPRITE] Two tiny 32x32 icons side by side: (1) two small open hands cupped together with a cyan heart-spark above, "affection"; (2) a cluster of three soap bubbles with cyan highlights, "bath". Chunky pixels, hard edges.
```

---

## 8. Instalação — `arte-instalador` (o que já está gerado e só falta entrar)

| # | Leva | Destino | Mapa | Observação |
|---|---|---|---|---|
| I1 | `entrega4/` Dino (6) | `soulmon/dino/` | `DinoGame.tsx` (`OBSTACLE_TIERS`, chão, parallax) | ✅ 15/09 (`dd214688`) — colisão por largura opaca |
| I2 | `entrega2/nest-cradle-wide.png` | `soulmon/` | `nestArt` (`h:104`, não 70) | ✅ 15/09 (`dd214688`) |
| I3 | `Class-System/sigilos/` (45) | `soulmon/sigilos/` | `sigilArt.ts` (glob) | ✅ 15/09 (`ddd87def`), sem consumidor |
| I4 | `entrega6/` base (108, incl. neutro) | `soulmon/fx-ataque/` | `attackFxArt.ts` | ✅ 15/09 (`ddd87def`) — aura ligada em Evolução/Ficha |
| I5 | `entrega4/` anims (7) + F6 | `soulmon/fx/` | `animArt.ts` + `SpriteAnim` | ✅ 15/09 (`55f332ad`) — ligados coração/banho/sono/migalhas/cocô; `entrega2/` (ganho/movimento) ainda não |
| I6 | `progress/` reescalado | `soulmon/progress/` (1×) | HUD | ⏳ com o canvas Sistema (A5/A6 já entregues em `hudArt.ts`) |
| I7 | `branches/` recortado (12) | `soulmon/lines/` | `DUNGEON_LINE_SPRITES` (9 linhas) | ✅ 15/09 (`c11dc49d`) |
| I8 | `E:/scenery/bg-circuit-tile.png` | `soulmon/` | textura do visor (`A14`) | ⏳ opcional |

Regras do instalador: fonte = arquivo canônico atual (nunca backup); `CACHE_VERSION` em `public/sw.js`; `npx vitest run` (conferir `Test Files`, não só `Tests`); commit por caminho; `docs/Attributions.md` intocado (arte própria).

---

## 9. Descartado (não gerar, não instalar)

`entrega3/` (dia), `entrega5/` (idle), `evolution-ritual/ultra` (guardar), fundo do Torneio (removido de propósito), `A3/A10/A15/A16`, qualquer botão/ícone/janela pixel para fora do visor, ícone de Bits, bestiário com imagem (D7), arte de terceiro.

---

## 10. Execução — decisões de 15/09/2026

- **Canal:** CLI `higgsfield` (conta pro, 567,95 cr em 15/09). Estimar com `higgsfield generate cost` antes de cada lote; lotes ≤4 jobs concorrentes. Teto desta rodada: **150 cr**.
- **Autonomia:** até o fim; parar só em H1 (EvoArvore — dono escolhe) e em falha. Relatório final com todas as folhas de contato.
- **Sigilos:** instalar arte + `sigilArt.ts`; ligar na Ficha quando o Class-System entrar.
- **Anims:** escrever a infra de spritesheet e ligar heart-burst, shower-splash, sleep-z, eat-crumbs, poop-plop, sparkle-pop; movimento do Dino junto com o conjunto do Dino.
- **Linhas novas:** `igni`, `nautilu`, `astrase` (ids e nomes).
- **Git:** commit por caminho na `main` + push ao fim de cada leva; `dist/` rebuildado; testes colados.

## 11. Estado em 15/09/2026 (fim da rodada)

| # | Peça | Estado |
|---|---|---|
| C1 | dungeon-1..5 em pé | ✅ gerado e instalado (`559222ed`) |
| C2 | placeholder egg/cocoon/glitch | ✅ gerado, `placeholderArt.ts`; ligação em `displaySprite`/Reveal = Fase 2 |
| C3 | 17 pet-box + 3 regerados | ✅ gerado e instalado (`559222ed`) |
| C4 | ícone de notificação | ✅ `drawable/ic_notification.xml` (`005a2941`) |
| C5 | glifos do overlay | ✅ ligados (`55f332ad`) |
| Emblemas | 8 | ✅ arte + `achievements.ts`; UI = canvas |
| F6 | anim-hunger-drop | ✅ gerado, sem chamada |
| M1 | marca vetorizada + derivados | ✅ (`005a2941`) |
| H1 | EvoArvore 3 versões | 📋 folha em `_gemini_out/hud-20260915/H1-evoarvore-3-versoes.png` — **dono escolhe** |
| H2/H3 | barra + moldura | ✅ gerados, `hudArt.ts`; consumidor = canvas Sistema |

Créditos Higgsfield: 567,95 → ver `account status` (≈ 52 cenários + 12 remover-fundo + ~8 folhas ≈ 75 cr).

## 12. Contagem (planejada)

| | Tem | Instalar | Gerar |
|---|---|---|---|
| Cenários | 18 | 0 | **25** (5 + 17 + 3) |
| Criaturas | 66 | 12 (recorte) | **3** (placeholder) |
| FX | 828 | 134 | **1** |
| Emblemas | 0 | 0 | **8** |
| Marca | 8 (baixa) | — | **1 vetorização + 1 ícone SVG** |
| HUD | 57 | 49 | **3** (+ 3 versões da árvore, sem geração) |

Gerações novas: ~38 imagens (as folhas reduzem: emblemas 1, placeholder 1, glifos 1, barra 1, moldura 1, hunger 1, cenários 22 individuais).
