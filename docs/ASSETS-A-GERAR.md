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

**Blocos do padrão de 23/09/2026** (`GUIA-CONSISTENCIA-2026-09-23.md`; prompts completos em `PROMPTS-HIGGSFIELD-2026-09-23.md`). Gerados no Higgsfield (`gpt_image_2`, 2k, high), com **uma** imagem de referência do próprio projeto; fundo `transparent` salvo mapa/cena.

**[PRÉDIO]** — 1:1 (avulso) ou 3:2 (folha de 3 ou 6, `3 columns x 2 rows grid with wide empty gaps`)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Detailed crisp 16-bit pixel art matching the attached reference exactly: dark deep-teal stone and metal (#071413, #0F2A29, #163735), copper/bronze trim (#C68642), small green vines, circuit-line engravings, arcane-tech ancient ruins mood. Signature details: faceted glowing turquoise SOUL CRYSTALS (#5FF3E0) with a tiny flame inside and TURQUOISE FLAMES burning in small braziers. True isometric 2:1 angle, light from top-left, same scale for every piece of the batch. Built from its OWN MATERIAL with its own small accent color: <PRÉDIO — material — acento>.
```

**[PRÉDIO-VIVO]** — igual ao [PRÉDIO], trocando a última frase
```
… The structure is CLEARLY A CREATURE, like the Trent of Legend of Mana: the whole building IS the being, with an unmistakable expressive face sculpted into its body (big eyes with brows and lids, a nose or snout, a real mouth with lips or teeth, cheeks, wrinkles), a personality and a pose. Never humanoid: no human body, no arms, no legs, it stays rooted like a building. COLOR: the body uses the natural rich colors of its own material (not all teal) - teal is reserved for the soul crystals and flames; keep values dark and moody, saturated but not candy.
```

**[MAPA-ISO]** — 3:4 (ou 9:16), opaco
```
Isometric pixel-art game map background, top-down 2:1 isometric view, EXACTLY the same art style and palette as the attached reference (dark deep-teal stone #071413/#0F2A29, copper/bronze accents #C68642, glowing cyan crystals and circuit-line runes #5FF3E0, mossy green vines, arcane-tech ancient ruins). NO buildings, NO characters, NO text, NO UI. Crisp 16-bit pixel art, dark moody edges fading into a #08191A void so the map floats. A single floating island plateau with 6 empty flat square plots in a regular grid of 2 columns by 3 rows, connected by glowing circuit-line stone paths, a central plaza with a cyan crystal obelisk, scattered crystals, ruin fragments and vines.
```

**[UI-KIT]** — 4:3 / 3:2 / 1:1, `transparent`; só vale DENTRO do visor (fora dele é `--sm2-*` + Material)
```
Match EXACTLY the attached reference UI kit style (SOUL MON UI DESIGN KIT v1.2): flat front-facing pixel-art UI, dark deep-teal panels (#0F2A29), thin copper pipe borders with small rivets, glowing turquoise neon (#5FF3E0) for active states, restrained and clean, straight edges suitable for 9-slice. Every piece fully isolated on a fully transparent background with wide empty gaps. NO text, NO letters, NO numbers on any piece. Icons: bold simple shapes readable at 24px, max 5 colors, no box behind them.
```

**[NPC-BUSTO]** — 1:1, 2k, high, `transparent`, **sem imagem de referência** (molde canônico do dono; ver também memória `npc-molde-e-gpt-image-2-5-flare`)
```
Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY: head, shoulders and upper chest, cropped at mid-torso, three-quarter view facing slightly toward the viewer, centered, fully isolated on a fully transparent background, no frame, no text. Clean bold BLACK OUTLINES around every shape, 32-bit era pixel art with noticeably more detail than a tiny sprite, cel shading with 2 to 3 tones per color, crisp pixels, no blur. The creature is NOT human; it is an expressive monster NPC with a strong readable silhouette. CREATURE: <espécie + elemento + essências>. PROFESSION: <função> — make the profession unmistakable through its outfit and props: <adereços>. It belongs to a place that is <local>, so its body materials echo that place. COLORS: <cores>, plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors.
```
⚠️ Decisão do dono de 14/10/2026: em NPC, sem cartola/goggles/arreio/cinto/penca de bolsinhas, cobre só como detalhe, expressão calma; a regra de "uma cor dominante por criatura" foi **revogada**; sem pós-processo de pixel.

**[ELEMENTO]** — quando o matiz precisar sair do kit (fogo, gelo…): manter a **linguagem** do
[SPRITE] (pixel chapado, contorno quase-preto, sem halo) e liberar só a cor dominante.

---

## 2. Cenários — `arte-cenario`

### Tem
- 9 cenas 1080×1920: `dungeon-6..10`, `tournament-night`, `tournament-final`, `minigame-dino`, `minigame-rps` (`src/assets/soulmon/bg/`, `dungeonScenes.ts`).
- 5 cenas 1080×1920 `dungeon-classic-{retro,vhs,sol,crt,glitch}` — os andares clássicos de `DUNGEON_SCENES`, que eram gradiente CSS (rodada 3 extras v3, instaladas 30/09/2026, §8 I9).
- 8 pet-box 1200×648: attic, arcade, library, shrine, rooftop, cloudsea, observatory, swamp (`src/assets/backgrounds/`, `PET_BACKGROUNDS`).
- 7 pet-box 1200×648 noturnos (fundos-v2, instalados 30/09/2026, §8 I10): os 5 estágios do Bosque `bg-guild-{clareira,ramagem,copa,mata,bosque-antigo}` (chão 66%, eram gradiente CSS) e os postais do Passeio `bg-campina`/`bg-cavernas` (chão 74%, não vendidos).
- 2 fundos de área 760×1344: `bg-hall`, `bg-laboratorio` (`src/assets/soulmon/areas/`, `HALL_BG`/`LABORATORIO_BG`; §8 I10) — o Hall e o Laboratório deixaram de cair no degradê do `AreaScene`.
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
| I9 | `E:/Soulmon-assets/out/rodada3/extras/final/dungeon-classic-{retro,vhs,sol,crt,glitch}.png` (5 · 1080×1920 RGB, v3; sha256 conferido contra `extras/MANIFEST.md`) | `soulmon/bg/` | `DUNGEON_SCENES` (`dungeonScenes.ts`) — substitui os 5 clássicos em gradiente CSS (dois magenta). Nomes EN/PT: Floating Garden/Jardim Flutuante, Terrace of Two Suns/Terraço dos Dois Sóis, Broken Observatory/Observatório Partido, Mirror Lake/Lago-Espelho, Fractured Archipelago/Arquipélago Fraturado; `accent` teal/cobre; `bg` = `url(...) center/cover <cor média>` | ✅ 30/09 (branch `feat/arte-masmorras-classicas`) — cenas não são persistidas (sem id no save); WebP 77–96 KB no `dist/` |

| I10 | `E:/Soulmon-assets/out/rodada3/fundos-v2/final/` (9 fundos noturnos + 7 miniaturas 96×52; sha256 conferido contra `fundos-v2/MANIFEST.md` antes e depois da cópia) | `soulmon/areas/` (`bg-hall`, `bg-laboratorio`, 760×1344) · `backgrounds/` + `backgrounds/thumbs/` (7 pet-box 1200×648) | `HALL_BG`/`LABORATORIO_BG` (`areas/index.ts` → `AreaView.tsx`); `PET_BACKGROUNDS` (`bg-guild-*` trocam o gradiente por `url()` + `baseColor` amostrada da faixa inferior, `horizonY` 66; `bg-campina`/`bg-cavernas` novos, `horizonY` 74, **fora da loja**); `REGIONS[campina/cavernas].bgId` (`travessiasCatalog.ts`) | ✅ 30/09 (branch `feat/arte-fundos-v2-tom`). Lotes reposicionados pelas clareiras medidas: Laboratório `evolucao`/`pet` 42→50%→54% (centraliza no hexágono), Hall `guilda` 72→78% (`areaSheetCopy.ts`). O WebP da leva não entra no repo: o build converte o PNG. `GroveVisor`/`GroveMilestoneCeremony`/`GuildOwnedShelf` ganharam `center bottom / auto 100%` (ou `cover` na miniatura) — pintavam o `css` cru, que com `url()` ladrilharia |
| I11 | `E:/Soulmon-assets/out/rodada3/_tom-home-v2/<pasta>/` (53 telas — só matiz + highlight; `RELATORIO.md`) | mesmo nome e caminho: `soulmon/areas/` (4), `backgrounds/` (27), `soulmon/bg/` (15), `soulmon/mapa/` (7) — nada de mapa de código muda | — | ✅ 30/09 (mesma branch). Os 54 originais de `_tom-home/_orig/` bateram byte a byte (sha256) com o repo antes da troca; `bg-gameboy` ficou de fora (matiz global mudaria 11°). Fora do tom por escopo: os 9 da I10 e os 5 `dungeon-classic-*`. As 27 miniaturas `backgrounds/thumbs/` correspondentes foram rederivadas do PNG retonado no PR seguinte (método R2-1 de `scripts-arte/derivar-rodada2.mjs`: lanczos3 + unsharp σ0,6; o método reproduz byte a byte as miniaturas antigas a partir dos originais, 27/27) |
| I12 | `E:/Soulmon-assets/out/rodada3/npcs-flare/final/` (16 bustos 768², alfa binário; sha256 conferido contra `npcs-flare/ROSTER.md` antes e depois — ROSTER `225e1ce3…` inalterado) | `soulmon/npcs/` | 10 de lote → `LOT_NPC_ART` (`npcs/index.ts`) + `LOT_NPC_VOICE` (`utils/areaNpcVoice.ts`, falas do ROSTER; Feira/Salão seguem em `guildCopy.ts`): Tuska, Fanfare, Tessela, Bobbi, **Medra** (voz própria, antes herdava o Grom), Nino, Marla, **Bento** (ex-nome de terceiro), Quill, **Brume** (Passeio; antes Zeph). 6 de função → `FUNCTION_NPC_ART` + `FUNCTION_NPC_VOICE` (Ambra, Iris, Faro, Sona, Nuri, Tobi) — **sem chamada** (onde entram: `PERGUNTAS-DO-DONO.md`, NPC-1). `npc-arauto-do-fim` NÃO instalado (criatura de chefe) | ✅ 30/09 (branch `feat/arte-npcs-bustos`). Saíram do bundle `npc-placeholder-poring` e `npc-placeholder-coruja-cervo` e o símbolo `PLACEHOLDER_NPC_ART` (bíblia das áreas §1.3 A3/A4) |
| I13 | `E:/Soulmon-assets/out/rodada3/lotes-v2/final/` (10 lotes 300², versão LIMPA — não `final-pix/`; sha256 conferido contra `lotes-v2/MANIFEST.md` antes e depois — MANIFEST `1d315dec…` inalterado) | `soulmon/areas/lote-<área>-<lote>.png` | `JOGOS_LOT_ART.mente/refugio`, `EXPLORACAO_LOT_ART.passeio`, `LABORATORIO_LOT_ART.*`, `HALL_LOT_ART.*`, `MERCADO_LOT_ART.conquistas` (`areas/index.ts`) | ✅ 30/09 (mesma branch). `lote-loja-conquistas` segue só como placeholder da Feira (`ARENA_LOT_ART.feira`, fora desta leva). **`lote-exploracao-dino.png` ficou sem consumidor** (emprestava ao Ateliê): arquivo em disco, sem import |
| I14 | `E:/Soulmon-assets/out/rodada3/fx-itens/final/` (20; sha256 conferido contra `fx-itens/MANIFEST.md` antes e depois da cópia) | `decor/trophy-concha-mare` · `soulmon/icones-ui/{mochila,sol-acordar}` · `soulmon/emblems/dias-completos-30` (substitui) · `soulmon/arena/fair-fenomeno-<tipo>-<estado>` (12) · `soulmon/fx/fx-fair-<tipo>` (4) | `DECOR_ART` (sai o `CONCHA_PLACEHOLDER` em SVG) · `UI_ICON_ART.mochila/acordar` (`CompanionHUD`: mochila do passeio no lugar do 🎒, sol de "Acordar" no lugar do `wb_sunny`) · `emblemArt` (glob) · `FAIR_ART` (glob; a chave do `FeiraVisor` passou a ser **tipo × estado** via `fairFenomenoId`, SVG de lajes como fallback) | ✅ 30/09 (branch `feat/arte-rodada3-levas`) |
| I15 | `E:/Soulmon-assets/out/rodada3/extras/final/` (22 ícones; sha256 idem) | `soulmon/icones-ui/` | `TIER_INSIGNIA_ART` → card "Sua faixa" do `TournamentPage` (glifo Material como fallback; faixa futura dessaturada por filtro). **Sem chamada**: `SKY_ART` (sol + 5 luas — nenhum visor desenha céu), `DUNGEON_PROP_ART` (porta/baús/escada — a `DungeonGame` não os desenha), `CURRENCY_ART` (Bits sem ícone por regra; Honra/Créditos em UI de sistema vetorial), `ATTRIBUTE_ART` (medalhão; se virar ícone solto, recortar só o símbolo — "ícone nunca em box") | ✅ 30/09 (mesma branch). Rótulo da moeda do Torneio: **Honra / Honor** (ids e save seguem `emblems`) |
| I16 | `E:/Soulmon-assets/out/rodada3/corrida/final/` (25; sha256 idem) | `soulmon/dino/` (chão, parallax, obstáculos 1–4 substituem; variantes `b`/`c` e `icone-corrida` novos) · `soulmon/fx/` (`fx-corrida-estilhaco-*`, `fx-corrida-faisca-*`, sheets, `cristal-moeda`) | `OBSTACLE_TIERS` com **3 variantes por tier**, sorteadas no spawn, cada uma com `hit` e `top` medidos (bbox do alfa) — `size` 38/44/50/56 intocado. **Sem chamada**: FX de estilhaço/faísca, `cristal-moeda`, `icone-corrida` | ✅ 30/09 (mesma branch). Jogo renomeado na UI: **Corrida com obstáculos / Obstacle Run** (ids `dino`, `dinoBest`, `DINO_BEST`, `mission-dino-1000`, `bg-mission-dinoland` intactos) |
| I17 | `E:/Soulmon-assets/out/rodada3/postais/final/` (48 · 96²; sha256 idem) | `soulmon/adventures/adv-trv-<regiao>-<nome>.png` | `ADVENTURE_ART` (glob `adv-trv-*` → chave `trv-<regiao>-<nome>`), lido pelo `AdventureDiary` e pelo `DailyReportModal` | ✅ 30/09 (mesma branch) |
| I18 | `E:/Soulmon-assets/out/rodada3/poderosos/final/` (24 · 512², alfa binário; sha256 conferido contra `poderosos/MANIFEST.md` antes e depois) | `soulmon/bosses/boss-<id>.png` | `src/data/bossRoster.ts` (`BOSS_ROSTER`: id, nome PT/EN, guardião/chefe, função + papel, elementos do class-system, lore PT/EN; `BOSS_ART` por glob). EN de essência novo em `essenceLabels.ts` › `COMBO_EN` (Symphony, Hurricane, Jungle, Core, Last Judgment). **Sem chamada** (masmorra/arena intocadas; `PERGUNTAS-DO-DONO.md` BOSS-1) — por isso ainda fora do `dist/` (tree-shaking) | ✅ 01/10 (branch `feat/arte-chefes-npcs-f`) |
| I19 | `E:/Soulmon-assets/out/rodada3/npcs-femininas/final/` (12 · 768²; sha256 idem) | `soulmon/npcs/npc-f-<id>.png` (`npc-f-domadora` → **`npc-f-feras`**: termo vetado pela `narrativa.contract`) | `EXTRA_NPC_ART` (`npcs/index.ts`) + `EXTRA_NPC_VOICE` (`utils/areaNpcVoice.ts`, nome/ofício/fala PT+EN do ROSTER; fala da Datura sem "darling/querido"). **Sem chamada** (NPC-1). WebP no dist: 12 arquivos, 1,37 MB, maior 142 KB | ✅ 01/10 (mesma branch) |
| I20 | `E:/Soulmon-assets/out/rodada3/hall-lab-v2/final/` (2 fundos 760×1344 + 6 lotes 300², alfa binário; sha256 conferido contra `hall-lab-v2/MANIFEST.md` antes e depois — MANIFEST `0245eda8…` inalterado) | `soulmon/areas/bg-hall.png`, `bg-laboratorio.png` (PNG, o build converte; os `.webp` do banco NÃO entram) e `lote-{hall-biblioteca,hall-amigos,hall-guilda,laboratorio-evolucao,laboratorio-pet,laboratorio-stats}.png` — **substituem** os de mesmo nome | `HALL_BG`/`LABORATORIO_BG`, `HALL_LOT_ART`, `LABORATORIO_LOT_ART` (`areas/index.ts`, imports inalterados). Clareiras: `areaSheetCopy.ts` já está no alvo do MANIFEST (Hall 27/42, 72/42, 50/78; Lab 27/54, 72/54, 50/72) — conferido no preview 390×844, sem ajuste. `lote-bonus-amigos-sorvete` (alternativa) NÃO instalado, fica no banco | ✅ 01/10 (branch `feat/arte-rodada3-instalacao-1`) |
| I21 | `E:/Soulmon-assets/beta3-geradas/chatgpt/` `r4-03-dash-charge-1..4`, `p2-09-prop-*` (6), `r4-04-obst-01..06` (alfa binário em 128, RGB zerado onde alfa 0; obstáculos deslocados para os pés tocarem a base, sem reamostrar) | `soulmon/dino/dash-gem-*`, `dash-pickup*`, `dash-spark`, `dash-plat-*`, `dino-obstacle-r4-*` | `OBSTACLE_TIERS` + coletável/plataforma do nível 2 (`DinoGame.tsx`); prints em `product/arte-instalada/prints/` | ✅ 28/10 (branch `arte-instalar-2`) |
| I22 | `E:/Soulmon-assets/beta3-geradas/chatgpt/p2-02-bonus-*.png` (12, 96², alfa binário) | `soulmon/dungeon-rogue/bonus-*.png` | `utils/rogueBonusArt.ts` (glob) + bloco novo em `artMaps.contract.test.ts`; 3 usados (`RogueDungeon.tsx`), 9 em estoque | ✅ 28/10 (branch `arte-instalar-2`) |
| I21 | `E:/Soulmon-assets/out/rodada3/lotes-v2/final/lote-arena-feira.png` (versão LIMPA, sha256 `573b3704…` conferido) | `soulmon/areas/lote-arena-feira.png` | `ARENA_LOT_ART.feira` (antes `lote-loja-conquistas`). **`lote-loja-conquistas.png` ficou sem consumidor**: arquivo em disco, sem import (mesmo padrão do `lote-exploracao-dino`) | ✅ 01/10 (mesma branch) |
| I22 | `E:/Soulmon-assets/out/rodada3/visores/final/` (5 cenas + ovo 256² + 9 sprites 48²; sha256[:16] conferido contra `visores/MANIFEST.md`) | `soulmon/bg/{mente-troca-ceu,mente-troca-gruta,visor-atelie,visor-refugio,visor-feira}.png`; `soulmon/fx/{ovo-renascimento,fx-pedra-*,fx-bolha-sonho,fx-bolha-respiro,fx-fiapo,fx-pop,fx-fumaca}.png` | **Ligados** via `utils/visorScenes.ts` (dono único da receita da faixa e do mapa `MINI_FX`): `TrocaGame` (céu/gruta), `EcoGame` (cena do Ateliê + as 4 pedras trocam o CSS pelo sprite, mesmo `data-eco-shape`), `RevisaoGame` (cena do Ateliê), `BolhasGame` (cena do Refúgio + bolha-sonho, fiapo, pop e fumaça no lugar do CSS) e `RespiracaoGame` (cena do Refúgio + bolha-respiro), `FeiraVisor` (fundo `visor-feira` sob o fenômeno), `RebirthModal` (ovo 128 sobre o texto). A faixa 696×160 entra em tamanho nativo ancorada embaixo (a 348 de largura mostra o miolo — `cover` borraria a 0,9×/1,5×); no Bolhas (240) o que sobra em cima é um degradê que parte da cor do topo da arte | ✅ 01/10 (mesma branch) |
| I23 | `E:/Soulmon-assets/out/rodada3/arvore-generica/final/` (11 · 384²) e `final256-android/` (11 · 256²); sha256[:16] conferido contra `arvore-generica/MANIFEST.md` antes e depois — MANIFEST `53704d50…` inalterado | `soulmon/{rookie,champion-*,ultimate-*,mega-*,ultra}.png` e `android/app/src/main/res/drawable-nodpi/sprite_<estágio>.png` — **substituem** os 11 + 11 que eram o corvo repetido (11 arquivos, o mesmo sha) | `SOULMON_SPRITES` (`utils/sprites.ts`) e `WidgetRenderer.kt` — imports/mapas inalterados. **Noctyl** (coruja + lince + mariposa): power obsidiana/âmbar, harmony cristal/turquesa, benevolence sálvia/osso. O corvo (`corvo/`, `sprite_corvo_*`, `mascot-raven.png`) e seu mapa NÃO mudam. Guard de franquia/`-mon` (`sprites.dungeonRoster.test.ts`, varre o `dist/`) e `assets.contract`/`orcamentoDeBytes` passam sem ajuste; nenhum teste de hash travava o corvo duplicado | ✅ 01/10 (branch `feat/arte-rodada3-instalacao-2`) |
| I24 | `E:/Soulmon-assets/out/rodada3/criaturas/final/` (40 · 256²: ignar, lumel, serah, igni × champion/ultimate/mega × 3 galhos + ultra; sha256 inteiro conferido contra `criaturas/MANIFEST.md`; MANIFEST `e28f0c24…` inalterado) | `soulmon/lines/full/<linha>-<estágio>[-<galho>].png` (agora 69 arquivos; `igni-*-power` é cópia dos sprites que a linha já tinha, a mesma forma do oráculo) | **Sem consumidor** (hoje `DUNGEON_LINE_SPRITES` usa 4 por linha). Mapa novo `utils/lineFullArt.ts` (glob eager, `lineFullSprite(linha, estágio, galho?)`, `undefined` sem arte) + 3 testes em `artMaps.contract.test.ts`; fora do bundle até alguém importá-lo. **nautilu e astrase NÃO instalados** (pendentes, sem créditos). `serah-mega-power` e `lumel-ultimate-*` entram como estão | ✅ 01/10 (mesma branch) |
| I25 | `E:/Soulmon-assets/out/rodada3/extras/final/duelo-oponente-{1..6}.png` (6 · 128², alfa binário; sha256 conferido contra `extras/MANIFEST.md`; MANIFEST `e4613cb2…` inalterado) | `soulmon/duelo/duelo-oponente-<n>.png` | Mapa `utils/dueloArt.ts` (`DUELO_OPONENTE_ART`, `dueloOponenteArt(chave)` estável). **Sem chamada**: o oponente do Torneio é um amigo real, desenhado no estágio REAL dele (`getSpriteForStage(opp.stage)`); trocar por retrato genérico apagaria essa informação e não existe oponente sem sprite (`PERGUNTAS-DO-DONO.md`, DUELO-1) | ✅ 01/10 (mesma branch) |
| I26 | `E:/Soulmon-assets/out/rodada3/poderosos/final/boss-arauto-do-fim-full.png` (512², sha256 `8e3429ab…` conferido contra `poderosos/MANIFEST.md`; MANIFEST `62eb7faa…` inalterado) | `soulmon/bosses/boss-arauto-do-fim-full.png` | `bossRoster.ts`: campo `formas` (`BossForm`: `busto`/`corpo-inteiro`) — só o Arauto declara os dois; `BOSS_FULL_ART` + `bossArt(id, forma)`. O busto aprovado (`boss-arauto-do-fim.png`) segue intacto e é o padrão. `bossRoster.test.ts` ganhou o caso do corpo inteiro. **Sem chamada** (BOSS-1); MANIFEST marca o corpo inteiro como "pendente do dono" | ✅ 01/10 (mesma branch) |
| I27 | `E:/Soulmon-assets/out/rodada3/gemini-recriados/` (67 PNG, mesmo tamanho e modo dos originais; sha256 inteiro conferido contra `gemini-recriados/MANIFEST.md` e `_work/metrics.json`; MANIFEST `afbd599e…` inalterado). **Antes**: cada original do repo foi medido (`_tools/furos.py`: furos, área, fragmentos) e bateu com o "antes" do MANIFEST nos 67 — nenhum pulado | **substituem** o arquivo de mesmo nome: `soulmon/fx-ataque/fx-{aco,agua,ar,fogo,luz,sombra,terra,vida}-aura.png` (128²) e `-aura-96.png` (16), `soulmon/items/food-rice.png`, `soulmon/fx/fx-defeat.png`, `decor/furn-crystal.png`, e 48 ícones `soulmon/elementos/el-*.png` — abismo, acido, agua_viva, alento, areia, aurora, chama_azul, chama_solar, correnteza, cristal, enxofre, eter, fenix, fervor, flora, fluxo, fogo_feiticeiro, fogo_infernal, fogo_negro, fulgor, galvanismo, gelo, impeto, incendio, lava, magnetismo, mare, miasma, murmurio, nascente, obsidiana, ocultismo, ossuario, ouro_vivo, pacto, pantano, plasma, prisma, reflexo, runa, sinapse, solo_profano, tempestade, tita, tormento, trovao_negro, vapor, veneno | mapas inalterados (`attackFxArt.ts`, `itemArt.ts`, `fxArt.ts`, `decorArt.ts`, `elementIconArt.ts`): só o conteúdo muda. Os outros 89 `el-*` do MANIFEST (folhas 4–9) **não foram gerados** (bloqueio de créditos) e ficam como estão | ✅ 01/10 (branch `feat/arte-rodada3-instalacao-3`) |
| I28 | `E:/Soulmon-assets/out/rodada3/npc-lua/raw/npc-rainha-busto.png` e `npc-martelo/raw/npc-ferreiro-martelo.png` + `npc-ferreira-fit.png` (1024², alfa real) | finalizados com o mesmo pós das 12 extras (768² lanczos3 + alfa nearest + `limpar-alfa` binário + matiz 270–340° travado, preservando o vinho; 0 semitransparente, 0% roxo) em `E:/Soulmon-assets/out/rodada3/{npc-lua,npc-martelo}/final/` e instalados como `soulmon/npcs/npc-f-{lua,ferreiro,ferreira}.png` | `EXTRA_NPC_ART` + `EXTRA_NPC_VOICE` (`ExtraNpcId` ganha `lua`, `ferreiro`, `ferreira`): **Selene** (rainha arlequina da lua — função futura: deusa da lua, sombras, morte, mistérios e pântano), **Mallo** (ferreiro e forjador de martelos), **Kova** (ferreira); falas PT+EN sem cobrança nem flerte. **Sem chamada** — NPC-1. `bossRoster.test.ts` passou de 12 para 15 extras | ✅ 01/10 (mesma branch) |
| I29 | `E:/novos npcs/` (17 PNG Higgsfield, 15–16/10; 768×1296, 1024², 2048²) | 15 instalados como `soulmon/npcs/npc-n-<id>.png` (bbox, 768² centrado / corpo inteiro 1100 de altura, alfa binarizado em 128; enfermeira e alquimista: fundo xadrez/preto recortado por flood-fill). 1 pendente (sereia: fundo em degradê, ver pendência 28/10 no fim deste arquivo); 28/10: alquimista de costas instalada como `npc-n-alquimistaLimoCostas.png` (id `alquimistaLimoCostas`, sem chamada) | `NOVO_NPC_ART` (`npcs/index.ts`) + `NOVO_NPC_VOICE` (`utils/areaNpcVoice.ts`, com `category`). **Sem chamada** — NPC-1. `bossRoster.test.ts` ganhou o bloco dos 15 novos. Detalhe em `docs/NPCS-NOVOS.md` | ✅ 15/10 |

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

O Salão de Jogos usa `lote-jogos-ppt.png`, que já era dele.
✅ **30/09/2026**: os dois prédios e os NPCs (`jogos:mente` Tessela, `jogos:refugio` Bobbi) foram
instalados (§8 I12/I13).

## 16. Prédio do Caderno (Journal) — pedido de 11/10/2026

O dono achou o prédio do Caderno "massa, mas muito misturado com o background" (santuário do Pântano, verde-escuro sobre a clareira verde-escura da Exploração). **Troca provisória** com arte que já existia: o chalé `lote-exploracao-caderno-campina.png` (amarelo-quente). Higgsfield não esteve disponível nesta sessão.

Se o dono quiser arte própria, o pedido de geração (lote `arte-gerador familia=cenario`, destino `src/assets/soulmon/areas/lote-exploracao-caderno.png`):

- **Prédio isométrico 300², alfa real**, no mesmo pós dos `lotes-v2`: um estúdio de escrita (casinha-tinteiro com pena / escrivaninha à janela / pergaminhos), **telhado e paredes em tons QUENTES** (ocre, âmbar, madeira clara, marfim) com detalhe turquesa pequeno para manter a paleta do Soulmon.
- **Contraste é o critério:** a clareira de baixo da Exploração é verde-teal escura (`bg-exploracao.png`); o prédio não pode ter verde/teal dominante nem valor escuro. Conferir sobre o fundo (folha de contato) antes de instalar.
- Sem texto, sem personagem, base assentada em chão de terra batida (sem tablado), chão a 74%.

## 17. Sombras do Pesadelo — Solmons como obstáculos (pedido do dono, 11/10/2026)

No **Pesadelo** da Corrida com obstáculos (`DinoGame.tsx`, modo "Nightmare: shadow"), os obstáculos viram **sombras de Solmons específicos: silhueta preta, só os olhos de luz**. Visual apenas — física, caixa de colisão (`OBSTACLE_TIERS` › `hit`/`top`), placar e recompensas não mudam. Higgsfield/CLI de arte **não estava disponível** nesta sessão: hoje roda um **placeholder** (o sprite da própria linha pintado de preto em tempo de desenho + dois olhos acesos — `src/utils/nightmareShadows.ts`). Este é o **pedido de geração** para a `squad-arte` (`arte-gerador familia=criatura`, 12 ativos × ~3 seeds ≈ 36 imagens, estimativa).

### 17.1 Entrega (drop-in)

| | |
|---|---|
| Destino | `src/assets/soulmon/dino/dino-shadow-<id>.png` (ids abaixo) + registrar em `SHADOW_ART` (`src/utils/nightmareShadows.ts`) — **o placeholder some sozinho** quando o id aparece ali |
| Formato | PNG **128×128**, **alfa real** (sem xadrez assado), alfa binário (pixel art), mesma célula e mesmas proporções de `dino-obstacle-*` |
| Caixa opaca | **igual à do obstáculo que a sombra substitui** (coluna `hit`/`top` da tabela): a forma tem de caber nela — o que se vê é o que acerta. Conferir sobre a folha de contato com a caixa desenhada |
| Orientação | a criatura **encara a ESQUERDA** (o obstáculo vem da direita, de frente para o pet) — o placeholder espelha em código; a arte real já sai virada |

### 17.2 Regras de cor (a parte que torna a arte "sombra")

- **Corpo: preto quase puro** `#05080C`, **sem nenhum detalhe interno claro** (sem boca, sem dentes, sem marcas). Contorno externo de **1 px** em roxo-azulado escuro `#3B2A7A` só para separar do fundo escuro do Pesadelo (é o mesmo halo `#763bff` que o pet-sombra usa).
- **Os ÚNICOS pixels claros são os olhos**: dois blocos de 2–3 px em turquesa-claro `#A9FBFF` com 1 px de brilho `#5EE7FF` ao redor. **Nada além dos olhos acende.** Sem magenta, sem rosa, sem vermelho, sem roxo claro.
- A silhueta mantém o **gesto reconhecível da criatura** (orelhas, cauda, asas, chifres) — é "a sombra DESTE Solmon", não um blob.

### 17.3 Os 12 slots (um Solmon por slot)

| id | substitui | criatura (linha · estágio) | pose / forma pedida | `hit` · `top` (frações de 128) |
|---|---|---|---|---|
| `dino-shadow-1` | `dino-obstacle-1` | Lumel · rookie | agachada, orelhas baixas, corpo largo | [4,124] · 1 |
| `dino-shadow-1b` | `dino-obstacle-1b` | Serah · rookie | **só a metade de baixo** da célula: rastejando rente ao chão | [1,127] · 65 |
| `dino-shadow-1c` | `dino-obstacle-1c` | Igni · rookie | sentada, cauda enrolada à frente | [6,122] · 1 |
| `dino-shadow-2` | `dino-obstacle-2` | Ignar · champion | em quatro apoios, ombros altos | [6,121] · 1 |
| `dino-shadow-2b` | `dino-obstacle-2b` | Pyraka (`kaelen`) · champion | baixa e comprida (corpo alongado) | [1,127] · 15 |
| `dino-shadow-2c` | `dino-obstacle-2c` | Nautil (`nautilu`) · champion | casca/concha arredondada, tentáculos curtos | [1,127] · 4 |
| `dino-shadow-3` | `dino-obstacle-3` | Akashai (`orrin`) · ultimate | **coluna alta e estreita** (de pé, esguia) | [40,88] · 1 |
| `dino-shadow-3b` | `dino-obstacle-3b` | Nimbrata (`thalindra`) · ultimate | coluna alta, capa/cauda caindo reta | [38,89] · 1 |
| `dino-shadow-3c` | `dino-obstacle-3c` | Astria (`astrase`) · ultimate | coluna alta, halo reduzido a contorno | [41,86] · 1 |
| `dino-shadow-4` | `dino-obstacle-4` | Lumel · mega | **voadora**, asas abertas, na metade de cima | [1,127] · 38 |
| `dino-shadow-4b` | `dino-obstacle-4b` | Serah · mega | voadora baixa (metade de baixo da célula) | [1,127] · 66 |
| `dino-shadow-4c` | `dino-obstacle-4c` | Astria · mega | voadora média, asas em arco | [1,127] · 45 |

### 17.4 Prompts (consistência com o estilo)

**Regra do projeto (não violar):** o **corpo da criatura vem do oráculo** — gerar com `generateOracleWithFamilies` → `composeSpritePrompts` (forma e linha da tabela acima, semente fixa por slot), **nas duas variantes** (`imagePrompt` e `imagePromptFallback`, a recusa do provedor degrada sozinha) e **mantendo a cláusula `Do not copy any existing franchise character`**. Escrever o prompt de criatura à mão está proibido. O que o **pacote** acrescenta é o **sufixo de sombra**, igual para os 12 (cole depois do prompt do oráculo):

```
SHADOW TREATMENT (override all colors above): render ONLY the creature's silhouette as a flat solid near-black fill #05080C,
with absolutely no interior detail, no highlights, no shading, no mouth, no teeth, no markings. A 1-pixel dark
blue-violet outline #3B2A7A around the outside edge only. The ONLY light pixels in the whole image are the two eyes:
two small 2-3 pixel blocks of pale cyan #A9FBFF, each with a 1-pixel cyan glow #5EE7FF around it. Nothing else glows.
Pixel art, crisp hard edges, no anti-aliasing, no gradients, no blur, no text, transparent background,
128x128, the creature faces LEFT, feet/ground contact at the bottom edge unless it is a flying pose.
No magenta, pink, red or light purple anywhere.
```

Sufixo de pose por linha da tabela: `POSE: <pose / forma pedida>; keep the silhouette inside the box: <hit> of 128 horizontally, top margin <top>/128.`

**Negative (todos):** `interior detail, shading, highlights, colored body, glowing body, glowing mouth, extra glowing parts, red, magenta, pink, light purple, text, watermark, border, frame, checkerboard, photographic`.

### 17.5 Conferência (`arte-conferente`, bloqueante)

1. Alfa real, 128², alfa binário. 2. **Único pixel claro = os olhos** (varredura: nenhum pixel com luminância > limiar fora das duas caixas dos olhos). 3. Silhueta **dentro da caixa de colisão** da tabela (sobrepor `hit`/`top`). 4. Sobre o fundo do Pesadelo (`minigame-dino`) a forma **lê** com o halo. 5. Legível a **44–56 px** de lado (o tamanho em jogo). 6. Sem magenta/rosa/vermelho/roxo claro. 7. Folha de contato para o checkpoint do dono.

### 17.6 Depois de instalar

Acrescentar os 12 ids em `SHADOW_ART` e **bump `CACHE_VERSION`** em `public/sw.js` (abrir o arquivo e somar 1). O teste `nightmareShadows.test.ts` hoje exige `SHADOW_ART` vazio ("até a leva entrar") — trocar por "todo id declarado tem PNG" junto da instalação.
## 16. Level up do Vínculo — pedido do dono em 11/10/2026

O display de LEVEL UP (`src/components/LevelUpOverlay.tsx`) funciona **hoje sem arte nova**: a palavra
é texto na voz do aparelho (Silkscreen), a luz é o canvas da cerimônia de evolução, e o chevron triplo
`fx/gain-levelup.png` (96², F2, **já instalado** — gate "Existe?": não regerar) ao lado do número. Os
**três slots abaixo são opcionais**: instalar o PNG em `src/assets/soulmon/levelup/` liga o slot sozinho
(`utils/levelUpArt.ts`, glob eager) — nenhuma linha de código muda; o arquivo ausente ou que falha ao
carregar cai no procedural. Tudo mora **DENTRO do vidro** do visor (regra-mãe; artboard = o vidro 340×340
do overlay, `data-lvup-glass`), nunca solto sobre o véu escuro. **Bloqueio: crédito/assinatura do
Higgsfield (do dono)** — não há CLI nem credencial neste ambiente; pacote pronto para o `arte-gerador`
(`familia=fx`, lote de 3 peças) rodar quando houver crédito. Pasta de entrega: `_gemini_out/fx-<AAAAMMDD>-levelup/`.
Instalação, destino e conferência: `src/assets/soulmon/levelup/INSTALAR.md`.

| id | peça | arquivo final | nativo (exibido) | fundo / alfa | uso |
|---|---|---|---|---|---|
| LU1 | palavra **LEVEL UP** | `levelup-banner.png` | 512×128 (exibido a 256 = 0,5×) | alfa real (gerar sobre `#00FF00`, recortar por chroma-key) | topo do vidro, acima do pet |
| LU2 | burst de raios | `levelup-burst.png` | 680×680 (exibido a 340 = 0,5×) | alfa real (idem) | atrás de tudo no vidro; gira devagar (24 s) — tem de ser simétrico por rotação, SEM texto |
| LU3 | moldura do número | `levelup-frame.png` | 320×128 (exibido ~160×64 = 0,5×, esticado `fill`) | alfa real (idem) | atrás do "LV 12"; miolo vazio e liso (o número em cima é texto); bordas simples e **repetíveis** (a peça é esticada) |

**Regras que o conferente reprova:** paleta do app — petróleo `#0E2E2E`/`#123232`, ciano `#6EFFFB`,
tinta `#E9F5F2`, cobre `#C98B4B`/`#8A5A2B`, ouro `#D9A05B`, contorno quase-preto `#061414`;
**nenhum magenta, roxo, violeta nem rosa** (`r > g+40 && b > g+40` = 0); pixel chapado com borda
aliased, **sem blur, sem brilho suave, sem sombra projetada, sem gradiente, sem pixel semitransparente**
(o brilho é feito de pixels duros); sem chão (não é cenário, não há linha de 74%); sem criatura, sem
personagem de terceiro, sem marca de franquia.

**Blocos de estilo** — colar o [SPRITE] da §1 e acrescentar a linha da peça. Peça única: fundo
**verde chapado `#00FF00`** (nunca pedir "transparent PNG"); recortar com `chroma-key.mjs` e conferir o
alfa real (sem xadrez assado).

**LU1 — banner (texto é o ASSUNTO; é a ÚNICA peça do pacote em que "no text" não vale):**
```
[SPRITE] A single horizontal pixel-art title banner, canvas 512x128, reading exactly the two words "LEVEL UP" in chunky 16-bit block letters (every letter clearly legible, evenly spaced, no extra characters, no other words). Letters in aged gold #D9A05B with a lighter top edge #F0C987 and copper-bronze #8A5A2B underside shading, each letter outlined 2px near-black #061414; a thin carved copper rule above and below the word, with tiny circuit-trace notches at both ends. Flat colors, hard aliased edges. Background SOLID PURE GREEN #00FF00 only, nothing else behind it. NO glow, NO gradient, NO drop shadow, NO purple, NO pink, NO magenta.
```
**LU2 — burst:**
```
[SPRITE] A single radial burst of light rays, canvas 680x680, perfectly symmetrical around the exact center, 12 long tapering pixel-art rays alternating neon cyan #6EFFFB and pale ink #E9F5F2, with 12 shorter rays of aged gold #D9A05B between them; the center is empty (a clean 140px circle left EMPTY for a creature to sit on) and the ray tips fade by breaking into a few separated single pixels, never by transparency. Hard aliased edges, 1px near-black #061414 outline only on the longest rays. No text, no letters, no creature, no ground. Background SOLID PURE GREEN #00FF00 only. NO soft glow, NO gradient, NO blur, NO purple, NO pink, NO magenta.
```
**LU3 — moldura do número:**
```
[SPRITE] A single horizontal pixel-art plaque frame, canvas 320x128, an EMPTY rounded-rectangle frame made of carved teal stone #123232 with an aged copper-bronze #C98B4B border 6px thick, small cyan #6EFFFB circuit-trace notches at the four corners and two tiny leaf tips curling over the top edge; the INSIDE is a flat empty dark teal #0E2E2E rectangle with no content (numbers are drawn later). Hard aliased edges, 1px near-black #061414 outline. No text, no numbers, no creature. Background SOLID PURE GREEN #00FF00 only. NO glow, NO gradient, NO drop shadow, NO purple, NO pink, NO magenta.
```
**Aceite (arte-conferente):** alfa real; palavra legível e grafada `LEVEL UP` (LU1 — IA erra letra:
reprovou, regera; o procedural cobre o intervalo); LU2 simétrico por rotação de 30° e miolo vazio;
LU3 com miolo liso; folha de contato no vidro de 340² com o sprite do pet a 128 no centro; dono vê o
recorte antes de instalar. **Decisão do dono em aberto:** o banner é em inglês ("LEVEL UP") nos dois
idiomas — termo universal de jogo, mas a regra do idioma pede o par PT; se quiser "NOVO NÍVEL" no PT,
é uma 4ª peça (LU1-PT) e uma linha em `LevelUpOverlay`.

## Guerra de Clãs / Praça / Plantio — arte instalada (18/10/2026, SQUAD-ARTE)
Higgsfield CLI `gpt_image_2_5` flare, `--background transparent`, `@char_sprite-style`/`@char_npcs`, saldo 182,25 → 176,25 cr. Instalados: `npcs/npc-arena-guerra.png` (Mirevesper, 768²), `areas/lote-arena-guerra.png` (300², caixa em `areaLotGeometry.ts`), `items/item-chip-big-{power,harmony,benevolence}.png` + `item-chip-prism.png` (ligados em `itemArt.ts`), `items/item-gift.png` (PracaVisor), `plantio/fruit-{girassol,melancia,abobora,pinheiro}.png` (PlantioVisor, fruto maduro). Sobra: `plantio/fruit-broto.png` (broto, sem slot) e os estágios 0–3 da planta, que seguem SVG procedural; cenário/canteiro das três salas continuam SVG.

## 18. Elementos base novos — Fada, Industrial e Planta (pedido do dono, 25/10/2026)

O class-system passou de 17 para **20 bases** (Class-System `56546d9`, branch
`feat/elementos-fada-industrial-planta`): +54 pares e 3 triplas curadas novas
(**Pestilência** = planta+morte+vileza · **Maldição** = fada+sombra+vileza ·
**Cyber** = industrial+eletricidade+arcano). Nada abaixo foi gerado: **fila para quando
houver créditos Higgsfield**. Regras de prompt: `PROMPTS-BETA3.md` §1 (receita de 23/09,
transparência real, nada de steampunk — Industrial é *fábrica arcana*: pedra, cobre e
cristal turquesa, **sem engrenagem/vapor/couro**).

Vibe de cada base (para o bloco COLORS do prompt):
- **Fada** — rosa, arco-íris, corações, glitter; asas translúcidas, brilho de purpurina; nada de verde puro.
- **Industrial** — metal fundido, cobre, chaminé de pedra, faíscas turquesa; corpo blindado e sólido.
- **Planta** — folha, raiz, espinho, flor e semente; verde de folha (não `#00FF00`).

| ID | Peça | Qtde | Formato / destino | Referência a anexar |
|---|---|---|---|---|
| EL1 | Linha de Soulmon `fada` (rookie→ultra) | 5 | 1:1 transparente → `src/assets/soulmon/novos/fada-{rookie,champion,ultimate,mega,ultra}.png` + entrada em `novosSoulmonData.ts` (nome EN + par PT) | `novos/luz-*` e `novos/vida-*` (irmãos aprovados) |
| EL2 | Linha de Soulmon `industrial` | 5 | idem → `novos/industrial-*.png` | `novos-arquivo/combinados/138-industrial.png` + `novos/terra-*` |
| EL3 | Linha de Soulmon `planta` | 5 | idem → `novos/planta-*.png` | `novos-arquivo/combinados/137-planta.png` + `novos/vida-*` |
| EL4 | Inimigos dos 54 pares novos | 54 | 1:1 transparente → `novos-arquivo/combinados/139-…192-<id>.png` (ordem = `elementos.ts` do Class-System: fada+X, industrial+X, planta+X) + linhas em `enemyRosterData.ts` | o combinado de cada componente; gerar em **folha** 3×3 por família |
| EL5 | Inimigos das triplas Pestilência, Maldição, Cyber | 3 | 1:1 transparente → `combinados/193-pestilencia.png`, `194-maldicao.png`, `195-cyber.png` | os pares-filhos (espinheiro/murcha · pesadelo_doce/encanto_traicoeiro · usina/artificio) |
| EL6 | Sigilos das 3 bases no simulador do Class-System | 3 | gerado por `npm run sigilos` (procedural) — só conferir; sem crédito | — |
| EL7 | Pixel-art dos 57 derivados novos no simulador | 57 | folha de ícones 32px → `Class-System/assets/icones-elementos/` + `npm run icones` | folha atual do simulador |
| EL8 | FX de ataque por elemento (4 famílias) para fada/industrial/planta | 3×4 | mesmo formato das famílias de FX por elemento (`PROMPTS-BETA3.md` §2) | FX de `luz`, `terra`, `vida` |
| EL9 | Pet-box/cenário temático (opcional) | 3 | 1200×648 opaco, bloco **[PET-BOX]** §1 | pet-box atuais |

**Prédios e NPCs:** esta mudança não cria nenhum. Regra do dono (25/10/2026): todo Soulmon,
prédio ou NPC novo entra **nesta fila** com prompt e destino antes de ir para o código.

> Atualização 26/10/2026: os 76 elementos novos (ícone + FX) dos ELEMENTOS compostos/especiais foram INSTALADOS (arte em `elementos/` e `fx-ataque/`); fada/industrial/planta continuam fora de `VISUAL_ELEMENTS` (faltam escudo e cenário).

## 19. Arena: cenários por elemento (pedido do dono, 27/10/2026) — RETIRADA em 28/10/2026

> **RETIRADA (dono, 28/10/2026, REGISTRO §180):** a Arena livre deixou de usar cenário por elemento; usa as duas arenas do Torneio. NENHUM dos itens AC1–AC12 deve ser gerado. Texto abaixo mantido só como histórico.

A Arena agora pinta o cenário do **domínio do elemento do jogador** (`utils/arenaTema.ts`; arte reduzida em
`src/assets/soulmon/combate/dominio/<dominio>-<1..3>.png`, 360×640, a partir de `dominios/<dominio>/masmorra/`).
Os 17 domínios = 8 elementos do Oráculo + 9 reinos. **Os 8 do Oráculo têm domínio próprio** (agua, fogo, terra, ar,
sombra, luz, planta, industrial). Os outros **12 elementos-base NÃO têm cenário próprio** e usam o domínio mais
próximo (nada foi inventado). Fila para quando houver créditos: 1 cenário 9:16 opaco por elemento, no padrão dos
`dominios/*/masmorra` (pintura 608×1080, terço inferior livre para os lutadores, paleta petróleo/turquesa/cobre da
casa, sem personagem, sem texto, sem steampunk). Destino: `src/assets/dominios/<id>/masmorra/bg-<id>-masmorra-{1,2,3}.png`
+ trocar a linha em `DOMINIO_DO_ELEMENTO_BASE` (`proprio: true`) e rodar o redutor (360×640, paleta 64).

| ID | Elemento | Domínio usado hoje (mais próximo) | Prompt sugerido (bloco CENA) |
|---|---|---|---|
| AC1 | eletricidade | picos | storm-struck mountain ridge at dusk, forked lightning arcing between crystal pylons, turquoise sparks, wet dark rock; open lower third |
| AC2 | arcano | akasha | floating library-observatory of runes, drifting glyph rings, violet-and-gold twilight, starlit stone floor; open lower third |
| AC3 | tempo | akasha | ruined clockwork-free sundial plaza, hourglass sand rivers frozen mid-air, amber dusk haze; open lower third |
| AC4 | espaco | akasha | stone platform at the edge of a nebula rift, floating islets, soft starfield, deep indigo and turquoise; open lower third |
| AC5 | gravidade | cavernas | cavern where boulders hover in a slow orbit around a dark core, pale dust trails, heavy cold light; open lower third |
| AC6 | som | cavernas | resonant crystal amphitheatre cave, visible concentric sound ripples on a still pool, warm copper and turquoise glow; open lower third |
| AC7 | vileza | pantano | sour green-brown bog at night, twisted dead roots, pale toxic mist, leering lantern glow far away; open lower third |
| AC8 | morte | pantano | misty bone-and-lantern marsh graveyard, pale grey-blue light, still black water, wilted reeds; calm, not gory; open lower third |
| AC9 | vida | floresta | sunlit ancient grove, huge living trunks, glowing seedlings and moss, warm green-gold light; open lower third |
| AC10 | fada | campina | pink-lilac twilight meadow, glitter motes, tiny floating lanterns, rainbow haze at the horizon; open lower third |
| AC11 | vigor | campina | open training meadow with worn stone circle, banners in wind, bright morning, strong warm light; open lower third |
| AC12 | marcial | deserto | sandstone dojo courtyard in the desert, rope-and-wood posts, long shadows, copper dusk; open lower third |

Pares derivados: usam o domínio do 1º componente, exceto `gelo`→gelo, `areia`→deserto, `pantano`→pantano,
`mare`/`abismo`/`correnteza`→oceano. Se quiser cenário exato para mais pares, é uma linha em `DOMINIO_DO_PAR`.

**Limite de pool, para decidir depois:** há exatamente **1 criatura por elemento-base** (`NOVOS_DATA`), então
no tema a Arena mostra a MESMA espécie em Rookie/Champion/Ultra (e repete na rodada 4). Mais variedade pede mais
linhas de Soulmon por elemento (nova fila, não incluída aqui).

## 20. Selo "novo recorde" do ResultScreen (pedido do dono, 28/10/2026)

**Status:** PAUSADO a pedido do dono (ele está usando o PC; avisa quando liberar). Gerar pelo app ChatGPT desktop (ver `docs/` e a memória `chatgpt-preferido-sobre-gemini`), com alfa real.

| Peça | Qtd | Destino | Formato | Referência a anexar |
|---|---|---|---|---|
| Selo/medalha "novo recorde" | 1 | `src/assets/soulmon/icons/icon-record-seal.png` | PNG RGBA 1024x1024 (reduzir com *nearest* se preciso), fundo transparente | `items/item-heart.png`, `icons/icon-trophy-gold.png` (estilo) |

Prompt (EN): "Create a single pixel-art game icon: a round 'NEW RECORD' medal seal. Gold-and-copper circular medal with a small teal crystal gem in the center, two tiny leaf laurels hugging the lower half, a short ribbon with two tails below, a couple of small cyan sparkle stars around it. 16-bit pixel art, crisp hard pixel edges, flat shading with 3 tones per material, dark navy 1px outline, magical-nature mood (arcane, calm, NOT steampunk, no gears), handheld creature-collector UI icon look. Centered, ~80% of the square canvas. TRANSPARENT background with real alpha (no drawn checkerboard, no shadow, no glow halo). No text, letters or numbers."

Conferência: Pillow (`python -I`), prévia em #08191A (nunca magenta/verde). Enquanto não existe, o ResultScreen usa o troféu dourado (`icons/icon-trophy-gold.png`) como selo provisório.

## Instalados do lote beta3 (28/10/2026)

- ✅ 28/10 — 3 mãos do PPT (`r4-05-ppt-{pedra,papel,tesoura}`) → `soulmon/icons/games/hand-{rock,paper,scissors}.png` (troca no lugar; `RPSGame.tsx` já usava).
- ✅ 28/10 — 4 glifos `p1-09-glifo-*` → `soulmon/icones-ui/{pasta,pasta-aberta,display-luz-acesa,display-luz-apagada}.png`, exportados em `icones-ui/index.ts`; sem consumidor.

**Beta3 (28/10/2026) — INSTALADOS**: `p2-01-endless-rift` (prédio do Endless Rift), `r4-02d` (prédio do Dungeon, opção d do dono), `p2-07` (pódio, sem chamada) e `p2-08` (NPC Arauto/Tilin, sem chamada). Detalhe em `INVENTARIO-ASSETS.md` (seção "Beta3 — prédios e pódio"). Não instalados: `r4-02a/b/c`, `p1-02-dungeon-pedregulho`.


## Pendência 28/10/2026 — sereia-pintora (NPC novo)

| Item | Fonte | Motivo | O que fazer |
|---|---|---|---|
| NPC-N sereia-pintora (corpo inteiro, 768×1296) | `E:/novos npcs/hf_20261014_162920_19e8f11a-4fe0-40c3-b9af-89b15cff7639.png` (cópia em `E:/Soulmon-assets/higgsfield-banco/novos-npcs/`) | Fundo é degradê colorido com vinheta e brilho, sem alfa. Flood-fill (tol. 6 e 14) tira só o fundo externo; sobram bolsões marrom/oliva entre cabelo, asas e cauda, e o azul-escuro do vestido e o marrom da bolsa têm o tom do fundo (remoção global comeria a personagem). Não instalada, para não entrar recorte sujo. | Regerar sereia-pintora com fundo transparente real (`gpt_image_2_5` flare, `--background transparent`; molde NPC-BUSTO/corpo inteiro). Precisa do PC livre / ChatGPT. Depois: `npc-n-sereiaPintora.png` + entrada em `NOVO_NPC_VOICE`/`NOVO_NPC_ART`. |

## 21. A Forja e a nova divisão das áreas (pedido do dono, 28/10/2026, REGISTRO #187)

**Como funciona:** a arte final tem **nome-alvo fixo** na pasta de cada família. Enquanto o arquivo NÃO existe, vale a arte provisória (reaproveitada); no dia em que ele cair na pasta com o nome certo, assume SOZINHO (resolvedores `resolveArt` em `src/assets/soulmon/areas/index.ts` e `resolveMapaZona` em `src/assets/soulmon/mapa/zonas.ts`; sem editar código). Todos com **alfa real** (regra `assets-transparencia-real`), pelo ChatGPT desktop, receita `GUIA-CONSISTENCIA-2026-09-23.md` (`[PRÉDIO]`/`[MAPA-ISO]`/`[NPC-BUSTO]`). Depois de instalar um prédio novo, **remedir** `LOT_ART_BOUNDS` (`utils/areaLotGeometry.ts`; o contrato `areaLotGeometry.contract.test.ts` diz os números) e conferir `left/top/width` em 5 viewports.

| Arquivo-alvo (pasta `src/assets/soulmon/…`) | Tamanho / proporção | O que mostra | Posição hoje (% da cena) | Provisório | NPC dono |
|---|---|---|---|---|---|
| `mapa/zona-forja.png` | 512×512, 1:1, alfa | a construção da Forja no Mapa geral: oficina industrial (forno, chaminé de cobre/pedra petróleo, bigorna) no kit do Mapa | `AREA_POS.forja` = 19% / 74,5% (centro da base), largura 34% | `zona-exploracao.png` | — |
| `mapa/bg-mapa.png` (opcional) | 800×1415 | o fundo do Mapa ganha a plataforma da Forja embaixo à esquerda (hoje já existe uma plataforma de portal livre ali, centro ~19/73 do fundo) | — | o atual | — |
| `areas/bg-forja.png` | 760×1344, 9:16 | o fundo da área A Forja: industrial, com 4 plataformas/tablados: cima-esq (Soulsmith), meio-dir (Oficina do Foco), esq-meio-baixo (Caderno), baixo-dir (Refúgio) | tablados nos mesmos pontos do `bg-exploracao.png`: Soulsmith 22,6/21 · Oficina 80,1/34,4 · Caderno 28/64 · Refúgio 72/86 | `bg-exploracao.png` | — |
| `areas/lote-forja-ferreiro.png` | 512×512, 1:1, alfa | o Soulsmith (forja de equipamentos): fornalha de lava/vidro, bigorna | 22,6% / 21%, largura 44% | `lote-mercado-ferreiro.png` | Vitra (espírito-do-forno vidraceiro) |
| `areas/lote-forja-oficina.png` | 512×512, alfa | a Oficina do Foco: ampulhetas/timers de cristal, ritmo | 80,1% / 34,4%, largura 66% | `lote-exploracao-oficina-v3.png` | Lume (vagalume do coro) |
| `areas/lote-forja-caderno.png` | 512×512, alfa | o Caderno (journaling): scriptorium com livro aberto e pena | 28% / 64%, largura 47% | `lote-exploracao-caderno-v3.png` | Opala (geleia-fantasma arquivista) |
| `areas/lote-forja-refugio.png` | 512×512, alfa | o Refúgio (momentos difíceis): casa-gruta calma; NÃO pode parecer industrial agressivo | 72% / 86%, largura 40% | `lote-jogos-refugio.png` | Marim |
| `areas/lote-lab-biblioteca-v2.png` | 512×512, alfa | Biblioteca nova (prédio de arte nova do Laboratório) | 16,2% / 44,4%, largura 32% | `lote-hall-biblioteca.png` | Lumi |
| `areas/lote-lab-vinculo-v2.png` | 512×512, alfa | Santuário do Vínculo novo (o grande do alto) | 50% / 38,2%, largura 64% | `lote-laboratorio-stats.png` | Sumi |
| `areas/lote-lab-evolucao-v2.png` | 512×512, alfa | Centro de Evolução novo | 26,7% / 68,6%, largura 40% | `lote-laboratorio-evolucao.png` | Vesca |

**Também sem arte (decisões do dono pendentes):** (a) anfitriã própria da Forja (hoje a Vitra faz a voz da área; `AREA_NPC_ART.forja`); (b) **fundo novo da Exploração** — a área ficou com o Passeio + Fenda Sem Fim + Calabouço sobre o `bg-exploracao.png` (as posições da Fenda e do Calabouço são as das antigas Oficina e Caderno, provisórias); o canto de baixo à direita está LIVRE para a terceira masmorra; (c) o Mercado ficou sem prédio embaixo à esquerda (onde estava o Soulsmith, 26/81) e o Laboratório sem os prédios de baixo à direita (Arquivo) e do flanco direito (Amigos), e Jogos sem o lobo de baixo (Calabouço): as plataformas ficam vazias até a arte pedir outra coisa; (d) o Arquivo e o Círculo de Amigos perderam o lote (viraram seções do Perfil e do Salão do Clã); os bustos da Tinta e da Zumi seguem só na apresentação do prédio.

## Faísca de Alma / Soul Spark (30/10/2026, REGISTRO §191)

Item `✨` (`SPARK_ITEM_EMOJI`): hoje reusa `icones-ui/energia.png` (`itemArt.ts`). Falta arte própria: ícone 512×512 com alfa real, faísca/chama azul-turquesa (cor de energia do Soulmon), mesmo traço dos itens `item-heart.png` e `item-glitchtama.png`, sem moldura. Trocar é UMA linha em `src/utils/itemArt.ts`.

## Quadro da tabela de ranking (pergunta do Pipo, 30/10/2026)

A tabela de ranking agora aparece direto no topo do portão de cada minijogo (`MinigameModeGate`). Hoje o quadro é CSS (borda `--sm2-gold-fill`, fundo `--sm2-surface`, raio `--sm2-radius-sm`). Para ficar lapidado, falta UMA arte (não gerada; pedir pelo ChatGPT desktop):

| Arquivo-alvo | Tamanho | Alfa | O que mostra |
|---|---|---|---|
| `src/assets/soulmon/icones-ui/quadro-ranking.png` | 9-slice 96×96 (borda de ~24 px, miolo transparente/liso para esticar) | alfa real | moldura de placar pixel-art no estilo Arcano: cobre/latão com cantos de cristal turquesa, sem texto, sem fundo no miolo; mesma paleta e traço de `item-heart.png`. Esticável em largura (cabe de 280 a 420 px) |

Quando existir: trocar o `border`/`boxShadow` de `[data-minigame-gate-ranking]` por `border-image` (9-slice) em `MinigameModeGate.tsx`.
