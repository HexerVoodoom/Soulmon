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
| **Loja (material da Play)** | `arte-gerador familia=loja` (desde 21/09/2026) | 8 screenshots ×2 idiomas (captura + legenda, não geração), feature graphic 1024×500 ×2 e o recorte `og:image` 1200×630 — §14 |
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
| `bg-gameboy` | LCD Retrô | ✅ 21/09 (R2-6). **Sem o bloco [PET-BOX]** — com ele o gerador devolve masmorra com chão oliva (t1 reprovada). Prompt que obedeceu, com referência sintética (campo `#8BAC0F`/`#9BBC0F`, grade 1px `#7A9A0A` a cada 6px, bisel cobre 24px, 2 px ciano): `Retro pixel art, 16-bit era, WIDE HORIZONTAL BANNER 16:9. The ENTIRE image is the flat LCD screen of an old handheld console seen perfectly straight on, filling the frame edge to edge: a uniform olive-green LCD field (#8BAC0F and #9BBC0F) with a visible fine pixel grid of slightly darker olive lines (#7A9A0A), matte and flat. The only decoration: a thin aged-copper bezel strip (#C68642) along the far LEFT and far RIGHT edges, about 2 percent of the width each, and two tiny cyan (#5FF3E0) status pixels in the top-right corner. The lower 26 percent of the screen is a slightly darker olive band of the same LCD, with a clean horizontal floor line at exactly 74 percent of the image height. No architecture, no stone, no columns, no vines, no crystals, no circuit traces, no characters, no creatures, no text, no logos, no UI, no device body, no hands, no reflections, no gradients, no vignette. Recreate the attached reference faithfully at full resolution; this is a faithful reproduction of an approved design, not a new interpretation. Wide 16:9.` |
| `bg-matrix` | Matriz Verde | `SCENE: a dark void with columns of falling glyph-like pixels in muted green-cyan, denser at the sides and calm in the middle, a flat dark floor of circuit traces. Recreate the attached reference faithfully as a wide banner.` |
| `bg-ocean` | Fundo do Mar | `SCENE: the sea floor at night, dark teal water, a sunken copper machine with cyan lights, kelp silhouettes at the sides, rising bubbles, sand floor. Recreate the attached reference faithfully as a wide banner.` |

---

## 3. Criaturas — `arte-criatura`

### Tem
- 6 linhas × 4 estágios (`lines/`, 256²) + as 11 formas completas de kaelen/orrin/thalindra (`lines/full/`).
- Árvore genérica de 11 formas (`rookie.png`…`ultra.png`, 384²).
- `dungeon-spirit`, `mascot-raven`.
- `branches/` (Igni/Nautil/Astria, 4 formas cada, 2048² com xadrez falso) — **entra na pré-seleção do free (D1)**.

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

## 5. Emblemas — `arte-gerador familia=emblema` (9 conquistas — `ACHIEVEMENT_IDS`)

> ⚰️ 21/09/2026 (QA Rodada 1, `06-guardas-squads-r1.md` §11): esta seção dizia **8** conquistas e usava os ids `streak-7`, `milestone-21` e `tasks-100`, que **não existem** em `src/utils/achievements.ts` — os reais são `habit-7`/`habit-21`/`habit-66` (marcos de hábito, Lally 2010) e `dias-completos-30` (decisão #30; ⚰️ `tasks-100`, vetada pela #16). "streak" como id é ainda pior: é a proibição #1 no nome. A régua é o array, não este doc: `node -e "import('./src/utils/achievements.ts')"` não roda em Node puro; use `grep -c "^  '" src/utils/achievements.ts` (→ 9) ou `ls src/assets/soulmon/emblems/ | wc -l` (→ 9).

Uso: conquistas exibíveis no slot `trophy` do palco (`Home`), na `Pet › FichaEstados` e na `Loja › TorneioSegmento` (ao lado da moeda Emblema, que continua sendo número). Formato 64² alfa, pixel, sem texto. Destino `src/assets/soulmon/emblems/<id>.png`; mapa `src/utils/emblemArt.ts` (chave = id da conquista). Nenhuma conquista pode ser comprada.

### Tem (instalado, 9/9 arquivos)

`perfect-day` · `habit-7` · `habit-21` · `habit-66` · `first-evolution` · `mega-form` · `dungeon-10` · `tournament-champion` · `dias-completos-30` — todos em `src/assets/soulmon/emblems/`, mesma folha (aro de cobre, face petróleo, símbolo ciano).

### Falta — E1: rearte de `dias-completos-30` (a arte ainda desenha "100")

`dias-completos-30.png` é o **antigo `tasks-100.png` renomeado** (cabeçalho de `emblemArt.ts`: "três lajes marcadas, cem tarefas") — o símbolo é de pilha de tarefas, exatamente a contagem que a #16 veta. Gerar **uma** peça, mesma folha das outras 8 (anexar `perfect-day.png` + `habit-66.png` como âncora de estilo):

```
[SPRITE] One achievement badge for a virtual-pet game, same small round-ish medal with a copper rim and a dark teal face as the reference badges, the symbol in neon cyan: a small sun with a ring of thirty tiny notches around it — thirty complete days, a cycle closed, NOT a pile of tasks, NOT a checklist, NOT a calendar grid. No digits, no letters. Same size, same rim as the references. Solid white background. Square 1:1 full-bleed composition.
```

Aceite: `arte-conferente` confere aro/face/paleta contra as 8 irmãs a 32px; `arte-instalador` substitui o arquivo **com o mesmo nome** (o mapa não muda) e sobe `CACHE_VERSION`. Conferir também `habit-66` (o prompt antigo só tinha "21 days"; o 66 nasceu depois — se a arte for a de 21 reaproveitada, entra no mesmo pedido).

### Prompt da folha original (registro — não regerar as 8 que já existem)

```
[SPRITE] Eight achievement badges for a virtual-pet game, 4 columns by 2 rows, each a small round-ish medal with a copper rim and a dark teal face, the symbol in neon cyan: (1) a single perfect star; (2) a seven-notch ring like a week wheel; (3) a sprouting seed inside a ring, "21 days"; (4) an upward chevron with a spark, first evolution; (5) a crown-like crest, mega form; (6) a stone gate with the number of steps hinted as 10 notches, dungeon floor 10; (7) a laurel wreath, tournament champion; (8) a stack of three checked slabs, one hundred tasks. No digits, no letters. Same size, same rim. Square 1:1 full-bleed composition.
```

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
| C2 | placeholder dormant/forming/glitch (v4: cristal da Home com o ser dentro + vinhas e brotos) | ✅ gerado e LIGADO: nós da EvoArvore (pago, D1) e casulo do reveal |
| C3 | 17 pet-box + 3 regerados | ✅ gerado e instalado (`559222ed`) |
| C4 | ícone de notificação | ✅ `drawable/ic_notification.xml` (`005a2941`) |
| C5 | glifos do overlay | ✅ ligados (`55f332ad`) |
| Emblemas | 8 | ✅ arte + `achievements.ts` + faixa na Ficha do Pet (visor estreito) |
| F6 | anim-hunger-drop | ✅ gerado, sem chamada |
| M1 | marca vetorizada + derivados | ✅ (`005a2941`) |
| H1 | EvoArvore 3 versões | ✅ dono escolheu **(a) SVG por token** (16/09) — `soulmon/evolution/` (4) e `E:/nodes/` (8) descartados; o canvas de Evolução desenha os nós em vetor |
| H2/H3 | barra + moldura | ✅ barra LIGADA: `VisorBar` (HP + energia) dentro do palco (D3, 16/09); moldura 9-slice em `hudArt.ts` para o canvas Sistema |

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

## 13. Rodada 2 — decisão do dono em 21/09/2026 ("Gerar")

Regra desta rodada: **derivar do que existe sempre que a peça for redução da arte já aprovada** (zero crédito, determinístico, fiel por construção); gerar só o que não existe em nenhuma escala. Teto: 30 cr. Créditos em 21/09: 487,95.

| # | Peça | Uso (artboard) | Formato / destino | Método |
|---|---|---|---|---|
| R2-1 ✅ `118131f4`/`66e32d43` | Miniaturas dos cenários da loja — 28 geradas (só `home-scene-1547` fica fora: 1376×3058) | `Loja.dc.html` card (D-L3) | 96×52 PNG por cenário, `src/assets/backgrounds/thumbs/<id>.png`; `ShopModal` troca o `1200×648` reduzido por CSS | derivar: `sharp` lanczos3 1200×648 → 96×52, leve unsharp; script `scripts-arte/derivar-rodada2.mjs` |
| R2-2 ✅ `118131f4`/`66e32d43` | Ícones-ficha 64² e 32² das 9 linhas × 4 tiers — 72 gerados, `utils/lineIcons.ts` | `Jogos` ranking (D-J13, mini-visor 32) e Dino/oponentes (64) | `src/assets/soulmon/lines/icons/<linha>-<tier>-64.png` e `-32.png`, alfa real | derivar do sprite 256²: bbox → 64 lanczos; 32 = recorte da cabeça (45% superior da bbox) → 32. Um sprite por criatura (D5) continua valendo — ícone é redução, não pose |
| R2-3 ✅ `118131f4`/`66e32d43` | Aura 96² por elemento — 154 geradas, `auraForElement(el, 96)`; `PetPage` aura = vidro inteiro | `Pet.dc.html` vidro 192 (D-P?) | `src/assets/soulmon/fx-ataque/fx-<el>-aura-96.png` (só para os elementos com `-aura.png`) | derivar 128² → 96² nearest-ish (lanczos + threshold de alfa); `auraForElement` ganha variante `size: 96` |
| R2-4 ✅ `118131f4`/`66e32d43` | `anim-sleep-z` em tom claro — `ANIM_ART.sleepZLight`, `CompanionHUD` escolhe por `isDarkBackground` (luminância da `baseColor` < 0,5; hoje os 28 cenários são escuros → a clara sempre) | Home dormindo sobre cenário escuro (D-H?) | `src/assets/soulmon/fx/anim-sleep-z-light.png` (mesma grade 3 quadros) | derivar: recolor da folha atual para `#E9F5F2`/`#5FF3E0`, alfa intacto; `animArt.sleepZLight` |
| R2-5 | Glifos pixel comida/sono do overlay | `ForaDoApp.dc.html` overlay (D-F10) | folha 1×, 2 glifos 32² alfa real → `desktop/renderer/assets/glyph-food-32.png`, `glyph-sleep-32.png`; `EFFECT_ICON` do `main.ts` passa a usar PNG | gerar 1 folha `gpt_image_2 --quality medium --background transparent`, fatiar `fatiar-alfa.mjs`  ✅ 21/09 — 1 cr; folha 3:2 (`2:1` não existe no modelo), alfa binarizado a 128 antes de fatiar; sha256 food `1d284628…3b61`, sleep `d6e81945…c39b`; `EFFECT_ART` mapeia 🍎/🍖/💤, `EFFECT_ICON` removido. Leva `_gemini_out/rodada2-20260921/` |
| R2-6 | `bg-gameboy` regerado | Loja/cenário equipado | 1200×648 → `src/assets/backgrounds/bg-gameboy.png` (substitui) | gerar `nano_banana_pro` 2k 16:9 com referência NOVA: recorte real de LCD de console (verde-oliva, grade de pixel visível), prompt do §4 + "the whole image IS the LCD surface, no device, no hands"; `hf-finalize-bg.mjs`  ✅ 21/09 — 6 cr (3 gerações: t0 perdida numa corrida de jobs, t1 reprovada por virar masmorra, t2 aprovada com prompt sem [PET-BOX], ver §2); chão 73,8 % medido à mão (`findFloor` do `hf-finalize-bg.mjs` pegou a vinheta em 60,5 %); sha256 `378b9f43…64d10`; thumb 96×52 sha256 `d08d8015…0b93`. **`dist/` ainda não rebuildado** |

---

## 14. Material de loja — `arte-gerador familia=loja` (pedido de 21/09/2026)

> Origem: `docs/PLAY-FICHA.md` §6 pedia 8 screenshots ×2 idiomas + feature graphic ×2 + ícone 512 e
> **nenhuma família do `arte-gerador` fazia isso** — pedido sem executor (QA Rodada 1,
> `06-guardas-squads-r1.md` §11, `08-governanca-docs-marca-r1.md` §3.4). A spec (formatos, roteiro
> das 8 telas, legendas PT/EN já passadas pela bíblia §13, composição da feature graphic) **mora na
> ficha, não aqui** — esta seção só dá o id, o destino e o método. Trocar uma legenda = passar pelo
> `soulmon-narrative-critic`.

| # | Peça | Formato / destino | Método |
|---|---|---|---|
| L1 | 8 screenshots PT + 8 EN (roteiro em `PLAY-FICHA.md` §6.2) | 1080×1920 PNG, `docs/loja/play/<pt|en>/0<n>-<slug>.png` | **captura**, não geração: PWA em viewport 360×780 (Browser pane) ou APK no emulador, tema escuro, uma das 6 criaturas de demonstração; legenda em faixa superior composta por script (Rubik, `--sm2-*`), nunca desenhada pelo gerador |
| L2 | Feature graphic PT + EN | 1024×500 sem alfa, margem segura 15 % por lado, `docs/loja/play/<pt|en>/feature-1024x500.png` | **composição**: wordmark (`familia=marca`, vetor) à esquerda + visor da identidade com uma criatura demo dentro à direita + tagline de `PLAY-FICHA.md` §6.3 em Rubik; nada em pixel fora do visor |
| L3 | `og:image` 1200×630 | `public/og-1200x630.png` + `index.html` `og:image` (hoje aponta para `favicon-512x512.png` — funciona como ícone, não como key visual, `manual/04` §10.0) | **recorte/reenquadre de L2**, nunca um terceiro asset — é o mesmo pedido em dois lugares (`04` §10.0 e `PLAY-FICHA` §6.3) com um id só |
| L4 | Ícone 512 sem alfa | `docs/loja/play/icon-512.png` | derivar de `public/favicon-512x512.png` (a marca canônica desde `005a2941`, chama + cristal) sobre fundo sólido — `familia=marca` |

Aceite do `arte-conferente` para esta família: legenda sem cobrança (grep das `PROIBIDAS_PT/EN` de `petVoice.ts` + o `copy.semFomo` sobre o texto da faixa), criatura de demonstração (nunca sprite derivado), nenhum vocabulário Bandai no briefing nem na legenda ("primeira/última forma", não "rookie/mega"), paleta do rebrand (nunca `#2bff95`). O `arte-instalador` só toca `public/`/`index.html` (L3) — `docs/loja/` é entrega, não asset do bundle.

### 14.1 Briefs L2 e L3 — o corpo (QA Rodada 2, 22/09/2026, `reviews/2026-09-22-qa-rodada-2/06-som-arte-design-marca-r2.md` §4.4)

Estado em 22/09: **não gerados** (a rodada proibia gerar); `og:image` continua = `favicon-512x512.png`
e `twitter:card` = `summary`. Os dois briefs abaixo estão no padrão do `arte-gerador.md`; a família
`loja` é **composição** (script Pillow/sharp), não geração — o bloco de geração só entra na única peça
gerada, o fundo do vidro, e só se o dono quiser fundo pintado. A tagline usada é a provisória de #70
("Ela cresce com o seu dia." / "It grows with your day."); se o `narrative-critic` a trocar, troca aqui
— **nunca é desenhada pelo gerador**.

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
       sugerido `kaelen`/Pyraka rookie, `soulmon/lines/kaelen-rookie.png` 256² a 0,5× = 128,
       nearest — escala inteira, como o `BirthCard` §27) centrada no chão do vidro (GROUND_Y 74 %)
chama: BrandFlame scale 2 (38×60) no canto superior direito do vidro, dentro do anel — a marca
       aparece 2× (palavra + símbolo), é o que o teste de troca de logo pede
proibido: dígitos, "rookie/mega", emoji, #2bff95, magenta/roxo, texto pequeno, qualquer pixel
       fora do vidro, sprite derivado (só demo)
aceite (arte-conferente): copy.semFomo sobre a tagline; PROIBIDAS_PT/EN; formato exato;
       amostra de pixel: fundo == #08191A em (10,10) e (1014,490); nada com alfa
```

Se o dono quiser um **fundo pintado** dentro do vidro (em vez de vidro liso), a única geração é uma
cena `[PET-BOX]` (bloco §1, 1200×648) reduzida para 256² **dentro** do vidro, acrescentando no fim do
prompt: *"Keep the composition simple and readable at 256 pixels wide: one stone floor, two
vine-covered pillars at the edges, one floating turquoise crystal top-right, the centre empty for a
creature."*

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

Comando: `/squad-arte gerar loja L2 L3` → `arte-conferente` → `arte-instalador` (L3 toca `public/` e
`index.html`, então `CACHE_VERSION` sobe).

## 15. Prédios de Jogos — pedido do dono em 30/09/2026

A área Jogos passou a ter três construções (`src/utils/playAreaLots.ts`). Duas
ainda usam arte emprestada (`src/assets/soulmon/areas/index.ts` › `JOGOS_LOT_ART`):

| id | construção | hoje (placeholder) | pedido |
|---|---|---|---|
| `lote-jogos-mente` | **Ateliê da Mente** — jogos de memória, lógica e revisão | `lote-exploracao-dino.png` | isométrica 300² com alfa real, no estilo dos lotes F5: uma oficina/biblioteca pequena com pedras elementais e um quadro de pixels na fachada |
| `lote-jogos-refugio` | **Refúgio** — respiração e bolhas calmas | `lote-loja-decoracao.png` | isométrica 300² com alfa real: um abrigo pequeno e quieto (copa de árvore, lanterna, bolhas subindo), paleta fria e sem vermelho |

O Salão de Jogos usa `lote-jogos-ppt.png`, que já era dele. NPCs de lote seguem os
placeholders de `src/assets/soulmon/npcs/index.ts` (`jogos:mente`, `jogos:refugio`).
