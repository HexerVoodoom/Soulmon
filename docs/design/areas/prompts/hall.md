# Prompts — área HALL (Claustro da Manhã): fundo, 3 lotes, 2 NPCs novos, 5 cenários da Guilda

> Etiqueta: **plano / fila de prompts** (29/09/2026). Modo SÓ-PROMPTS: nada foi gerado, nada em `src/` foi tocado. O dono gera quando houver crédito no Higgsfield (`nano_banana_2_lite`, alfa real onde indicado; senão Gemini web pelo `GUIA-GEMINI.md`).
> Fontes: `00-BIBLIA-DAS-AREAS.md` §2.6, §3 (Hall), §4.2 (Nino, Marla), §5; `PLANO-GUILDA.md` §6, §7, §9; `ASSETS-A-GERAR.md` §1 (blocos [CENA]/[PET-BOX]) e §2; `areaSheetCopy.ts` (posições dos lotes).
> Regras que valem em todos: pixel art só dentro do visor (fundo de área, lotes e NPC são arte de visor/mapa; nada de botão ou moldura); sem magenta, roxo, violeta, rosa; sem texto, letra, número, logotipo; sem mão humana; sem caveira/osso/lápide; sem xadrez pintado; nunca "transparent PNG" (alfa = folha sobre branco + `_fatiar.mjs` ou verde `#00FF00` + chroma-key). Proporção vai no FIM do prompt.

## Convenções de entrega

- Pasta de entrega: `D:\Soulmon\_gemini_out\cenarios-<data>\` (fundo e `bg-guild-*`) e `criaturas-<data>\` (NPC); lotes em `cenarios-<data>\lotes\`. Cada leva com `raw/`, `_sheet.png` de contato e `INSTALAR.md` (destino, mapa, armadilhas).
- Ids seguem `lote-<area>-<loteId>` e `npc-<area>-<loteId>` (§5 da bíblia). Instalação (quem faz é o `arte-instalador`): imports em `src/assets/soulmon/areas/index.ts` (`HALL_LOT_ART`) e `src/assets/soulmon/npcs/index.ts` (`LOT_NPC_ART`); voz em `LOT_NPC_VOICE`; cenários `bg-guild-*` em `src/assets/backgrounds/` + `PET_BACKGROUNDS[id]` (`image`, `baseColor` reamostrado, `slots`, `horizonY <= 74`, `setting:'outdoor'`), **fora** de `SHOP_BG_ACCENTS`.
- Divergência a registrar: PLANO-GUILDA §7 diz que os `bg-guild-*` não vão à loja nem à masmorra (como `bg-mission-*`). Ids do plano mantidos: `bg-guild-clareira`, `bg-guild-ramagem`, `bg-guild-copa`, `bg-guild-mata`, `bg-guild-bosque-antigo`.

## ÂNCORA DE ESTILO DA ÁREA HALL (copiar idêntica no início de TODO prompt abaixo)

```
AREA STYLE ANCHOR — HALL, "the Morning Cloister". Retro pixel art, 16-bit era, clean chunky pixels, hard aliased edges, NO blur, NO soft glow, NO gradients, NO semi-transparent pixels, near-black 1px outline (#061414). Palette: deep petrol teal #0E2E2E / #123232 and near-black green as the base; aged copper #C98B4B with shading #8A5A2B for ironwork and trim; single living-energy spark in turquoise #6EFFFB (sparks, water, small crystals only); AREA ACCENT parchment cream #EFE3C2 for smooth pale stone and paper, with warm pale wood #B98A56 and lawn green #6FA85A (only the grass). Material: smooth pale stone, cut lawn grass, waxed wood, paper and vine growing over structure. Light: soft high MORNING light from the upper left, gentle low-contrast shading, no hard shadows, no glare. Shape language: ARCHES and SYMMETRY, curves, round columns (never angular, never jagged). Forbidden: magenta, purple, violet, pink (including flowers and potions), red or orange flame as energy, skulls, bones, tombstones, text, letters, numbers, logos, human hands, generic human characters, any existing franchise character or brand device.
```

---

## H0 — Fundo da área Hall

- **id:** `bg-hall` · **família:** `cenario` (subtipo fundo de área) · **destino:** `src/assets/soulmon/areas/bg-hall.png` (mapa: novo `HALL_BG` em `areas/index.ts`, ao lado de `bg-mercado` etc.)
- **Formato:** **760×1344** (9:16), sem alfa, ≤ 400 KB após WebP. Gerar em fonte ~768×1376 (ou 1536×2752) e reduzir nearest.
- **Composição obrigatória:** vista isométrica de cima. Três **clareiras vazias e planas** onde os lotes pousam (centro da base de cada lote): Biblioteca em **27% / 42%**, Círculo de Amigos em **72% / 42%**, Salão da Guilda em **50% / 72%** (esquerda/topo). Claustro de arcos contínuos em U em volta de um pátio de grama; fonte pequena de água turquesa no centro-alto (sem coincidir com as clareiras); torre de sino/relógio d'água ao fundo, centralizada, no topo. Calçada de pedra clara ligando as três clareiras.

**Prompt principal (EN)**

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

SCENE: isometric top-down pixel art map background of a sunlit cloister courtyard. A continuous arcade of round arches with copper trim forms a U-shape around the frame, a slender bell-and-water-clock tower stands centered at the very top, a small turquoise fountain in the upper-middle of the lawn, a cut green lawn in the central courtyard, pale stone paths connecting three EMPTY flat stone-paved clearings (empty, with nothing built on them): one at 27% from the left and 42% from the top, one at 72% from the left and 42% from the top, one at 50% from the left and 72% from the top, each about 300 pixels wide at final size and clearly bare. Vines climb the arches over copper ironwork, a few tiny turquoise sparks near the fountain. The whole picture is calm, the light is daytime and the value is the brightest of all areas but low in contrast. No characters, no creatures, no buildings on the three clearings, no text, no frame or border, no UI. TALL VERTICAL PORTRAIT 9:16, full-bleed composition.
```

- **negative:** `pink, magenta, purple, violet, red flowers, hard black shadows, night sky, text, letters, numbers, logo, characters, creatures, human, hands, skull, gravestone, frame, border, UI, blur, gradient, anti-aliasing, photo, 3D render, transparent checkerboard`
- **Sementes/variação:** 4 imagens (conversa nova por variação). Escolher a que (1) deixa as 3 clareiras realmente vazias nas posições certas (sobrepor grade 27/42, 72/42, 50/72), (2) tem grama só no pátio central, (3) o skyline de arcada + torre é o mais simétrico. Descartar quem trouxer flor colorida ou céu escuro.
- **Aceite (`arte-conferente`):** tamanho exato; sem alfa; varredura de matiz 270°–340° = zero; a 64 px de largura em cinza é identificável como Hall e distinto de Arena (mais claro e angular) e Laboratório (hexágonos): o Hall é claro e de **baixo contraste**, a Arena é de muito alto; silhueta preta do skyline = arcada de arcos + uma torre central.

---

## H1 — Lote Biblioteca

- **id:** `lote-hall-biblioteca` · **família:** `cenario` (subtipo lote) · **destino:** `src/assets/soulmon/areas/lote-hall-biblioteca.png` (`HALL_LOT_ART.biblioteca`)
- **Formato:** gerar **768×768** (1:1), recortar **300×300**, **alfa real** (folha sobre `#00FF00` + chroma-key). Tamanho relativo 1,0, vertical: cabe inteiro, sem folga. Centro da BASE no centro-inferior do quadro; sombra de contato inclusa (sólida, sem translucência).

**Prompt principal (EN)**

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

SUBJECT: a single isometric pixel-art building, a TALL NARROW BOOKSHELF TOWER of smooth pale cream stone with waxed wood beams, an EXTERNAL SPIRAL STAIRCASE winding around the outside of the tower (the unique feature), arched windows, a stack of books visible in the top window, a copper-trimmed round roof, vines over copper ironwork, one tiny turquoise spark at the roof. The building stands alone, base centered in the lower middle of the square frame, with a small solid contact shadow under the base. Nothing else in the scene. Background is a flat pure #00FF00 green, nothing else behind it, no ground plane, no frame. Square 1:1 full-bleed composition.
```

- **negative:** `pink, purple, magenta, text, letters, numbers, logo, characters, human, hands, skull, ground tile, frame, checkerboard, blur, gradient, soft shadow, green tones inside the building`
- **Sementes:** 4 imagens; escolher a espiral externa mais legível a 64 px e a base centrada. Descartar as com verde-chroma vazando nas folhas da videira (usar videira mais escura, e se vazar, regerar).
- **Aceite:** 300×300, alfa real, sem franja verde; silhueta preta = torre fina com espiral externa (única do Hall); ao lado dos outros 2 lotes do Hall (gazebo vazado, casa-longa larga) e das 9 artes existentes, a silhueta é a única alta e estreita com espiral.

## H2 — Lote Círculo de Amigos

- **id:** `lote-hall-amigos` · **destino:** `src/assets/soulmon/areas/lote-hall-amigos.png` (`HALL_LOT_ART.amigos`) · **família:** `cenario` (lote)
- **Formato:** 768×768 → **300×300**, alfa real (chroma-key `#00FF00`). Tamanho relativo **0,7** (ocupa ~70% do quadro; centro da base no centro-inferior).

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

SUBJECT: a single isometric pixel-art open round GAZEBO, eight slim round columns of waxed pale wood with copper caps, a shallow domed roof with a turquoise spark on top, a circular bench ring inside, completely OPEN so the background is visible between the columns (see-through silhouette), a small copper mailbox at the entrance step. Cream stone floor disc, a few vines on two columns. Small in the frame (about 70 percent of the frame width), base centered in the lower middle, small solid contact shadow. Background is a flat pure #00FF00 green, also visible through the gaps between the columns. No ground plane, no frame, nothing else. Square 1:1 full-bleed composition.
```

- **negative:** `pink, purple, magenta, text, letters, numbers, logo, characters, human, hands, walls between columns, ground tile, frame, checkerboard, blur, gradient, soft shadow`
- **Sementes:** 4; escolher a que tem 8 colunas contáveis e vão realmente vazado entre elas (chroma limpo). Descartar gazebo com paredes.
- **Aceite:** 300×300, alfa real; **alfa vazado entre as colunas** (verificar que o transparente atravessa); silhueta preta = teto redondo + 8 palitos verticais (única vazada do Hall); tamanho visualmente menor que os outros dois lotes.

## H3 — Lote Salão da Guilda

- **id:** `lote-hall-guilda` · **destino:** `src/assets/soulmon/areas/lote-hall-guilda.png` (`HALL_LOT_ART.guilda`) · **família:** `cenario` (lote)
- **Formato:** 768×768 → **300×300**, alfa real (chroma-key `#00FF00`). Tamanho relativo **1,0, larga** (a maior largura do Hall).
- Nota: a árvore é a galhada da Marla e **a árvore do Bosque: cresce, nunca murcha** (PLANO-GUILDA §6). Vista do lote = estágio maduro-saudável, folhagem turquesa e verde, nunca folha seca.

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

SUBJECT: a single isometric pixel-art LONGHOUSE, wide and low, walls of smooth pale cream stone with waxed wood beams and a long copper-trimmed tiled roof in petrol teal, fronted by a large round ARCH gateway in the middle; INSIDE the arch, in the courtyard behind it, a healthy leafy tree with a wide crown whose leaves are turquoise and green, the crown rising a little above the arch (the unique feature: a tree INSIDE an arch). Vines over copper ironwork along the roof edge, a few tiny turquoise sparks in the crown. Wide building filling the frame width, base centered in the lower middle, small solid contact shadow. Background is a flat pure #00FF00 green, no ground plane, no frame, nothing else. Square 1:1 full-bleed composition.
```

- **negative:** `pink, purple, magenta, dead tree, dry leaves, bare branches, autumn leaves, ruin, cracked stone, text, letters, numbers, logo, characters, human, hands, skull, ground tile, frame, checkerboard, blur, gradient, soft shadow`
- **Sementes:** 4; escolher a árvore mais legível DENTRO do arco (copa acima do arco, tronco visível entre os pilares) e sem franja verde.
- **Aceite:** 300×300, alfa real; sem folha seca nem galho nu (regressão visual vetada); silhueta preta = casa larga com arco central e copa arredondada que sobe dele; distinta da torre (H1) e do gazebo (H2) lado a lado.

---

## H4 — NPC Lumi (anfitrião da Biblioteca) — SEM geração

- **id:** `npc-hall` (existe: `src/assets/soulmon/npcs/npc-hall.png`). Nome e fala mantidos (bíblia §4.3). Único ajuste é conferência: sem roxo/rosa (varredura de matiz), fundo com alfa real. **Só se a conferência reprovar**, regerar com o prompt de busto de H5 trocando a ficha por: a espécie atual de Lumi, anexando `npc-hall.png` e escrevendo `Recreate the attached reference faithfully, only fix the palette`. 0 imagens estimadas.

## H5 — NPC Nino (Círculo de Amigos)

- **id:** `npc-hall-amigos` · **família:** `criatura` (NPC/busto; núcleo do prompt vem do oráculo — `npcs-oraculo-saida.md`, decisão do dono 29/09/2026) · **destino:** `src/assets/soulmon/npcs/npc-hall-amigos.png` (`LOT_NPC_ART['hall:amigos']`; voz em `LOT_NPC_VOICE`, dono `areaNpcVoice.ts`)
- **Formato:** **768×768** (1:1), busto da cintura para cima, olhando 3/4 para a **esquerda** (fala à direita), **alfa real**, contorno preto de 1 px (folha sobre `#00FF00` + chroma-key).
- Ficha (bíblia §4.2): esquilo-planador creme com membrana de pergaminho entre as patas, bolsa de cobre a tiracolo; sociável, rápido, leva recado; gesto: planar entre colunas.

**Prompt — 1ª tentativa (`imagePrompt` do oráculo, envolvido pela âncora da área)**
```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): mid-glide between two columns, membrane spread. EXPRESSION: sociable and quick, open and welcoming.
CREATURE (oracle, npcs-oraculo-saida.md › Nino, seed 29092027, imagePrompt):
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: cream gliding squirrel with a thin parchment membrane between its paws, a small copper courier bag across its chest and a bushy curled tail. a little blob-like body. Flat pale gray-blue and silver-lining colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
**Prompt — 2ª tentativa, se o provedor recusar (`imagePromptFallback`, sem referências de gênero)**
```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): mid-glide between two columns, membrane spread. EXPRESSION: sociable and quick, open and welcoming.
CREATURE (oracle, npcs-oraculo-saida.md › Nino, seed 29092027, imagePromptFallback):
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: cream gliding squirrel with a thin parchment membrane between its paws, a small copper courier bag across its chest and a bushy curled tail. a little blob-like body. Flat pale gray-blue and silver-lining colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```

- **negative:** `human, human hands, pink, purple, magenta, text, letters, numbers, logo, franchise character, Pokemon, Pikachu, mascot, background scenery, frame, checkerboard, blur, gradient, soft shadow, translucent pixels`
- **Sementes:** 4; escolher a leitura mais rápida de "esquilo com membrana" e o ângulo 3/4 à esquerda; comparar contra o cinza do busto de Lumi e Marla (H6).
- **Aceite:** 768×768, alfa real, contorno de 1 px; silhueta preta = corpo pequeno com cauda em S e membrana em asa (reconhecível sem cor); em cinza é claro e liso, sem parecer NPC de Arena (que é grande, angular e de arenito); cláusula anti-franquia presente no prompt; nome sem sufixo `-mon`.

## H6 — NPC Marla (Salão da Guilda)

- **id:** `npc-hall-guilda` · **família:** `criatura` (NPC) · **destino:** `src/assets/soulmon/npcs/npc-hall-guilda.png` (`LOT_NPC_ART['hall:guilda']`; fala nova de Marla em `LOT_NPC_VOICE`, ver bíblia §4.2 — a fala é da `squad-narrativa`)
- **Formato:** 768×768 (1:1), busto, 3/4 para a esquerda, alfa real (chroma-key `#00FF00`), contorno de 1 px.
- Ficha: cervo-árvore grande e lento, galhada que é um pequeno bosque com folhas turquesa; casco de pedra clara; acolhedora; gesto: inclina a galhada e cai uma folha (folha viva, verde-turquesa, nunca seca).

**Prompt — 1ª tentativa (`imagePrompt` do oráculo, envolvido pela âncora da área)**
```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): tilting its antlers so one fresh green leaf falls (no dry leaves). EXPRESSION: welcoming and slow, kind.
CREATURE (oracle, npcs-oraculo-saida.md › Marla, seed 29092027, imagePrompt):
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: large calm tree-stag with a cream and pale-stone coat, antlers that are a small living grove of turquoise and green leaves, pale stone hooves. a baby-sized round form. Flat sage green and sunflower colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
**Prompt — 2ª tentativa, se o provedor recusar (`imagePromptFallback`, sem referências de gênero)**
```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): tilting its antlers so one fresh green leaf falls (no dry leaves). EXPRESSION: welcoming and slow, kind.
CREATURE (oracle, npcs-oraculo-saida.md › Marla, seed 29092027, imagePromptFallback):
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: large calm tree-stag with a cream and pale-stone coat, antlers that are a small living grove of turquoise and green leaves, pale stone hooves. a baby-sized round form. Flat sage green and sunflower colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```

- **negative:** `human, hands, dead leaves, dry leaves, autumn colors, orange leaves, bare antlers, pink, purple, magenta, text, letters, numbers, logo, franchise character, deer mascot, scenery background, frame, checkerboard, blur, gradient, soft shadow, translucent pixels`
- **Sementes:** 4; escolher a galhada que mais parece um bosque (3+ ramos com copa), com contorno preto fechado e o cervo lendo como cervo em silhueta preta. Descartar galhada nua ou folha alaranjada.
- **Aceite:** 768×768, alfa real; silhueta preta = cabeça de cervo + galhada em copa (reconhece-se como "cervo-árvore" sem cor); folhas só turquesa/verde (varredura de matiz); nunca folha seca; distinta em cinza de Nino (H5, pequeno, com cauda) e de Lumi; cláusula anti-franquia presente.

---

## Salão da Guilda — 5 cenários `bg-guild-*` (um por estágio)

> **Tom confirmado pelo dono em 29/09/2026: DIURNO, tom do Hall (creme).** A âncora do Hall e os cinco SCENE já são diurnos (luz suave de manhã; `night sky` no negative), então os prompts abaixo **não mudam**.

Todos: **`cenario`, pet-box 1200×648** (fonte ~1408×752), **sem alfa**, **chão contínuo em 74%** (linha do chão medida com `sharp` + projeção de cor por linha; se não bater, `setting:'void'` no `INSTALAR.md`), `horizonY ≤ 74`, `setting:'outdoor'`. Destino `src/assets/backgrounds/bg-guild-<estagio>.png`. Bloco de estilo do repo: **[PET-BOX]** colado depois da âncora. Mapa: `PET_BACKGROUNDS[id]` com `baseColor` reamostrado da faixa inferior; entra em `accent` de `dungeonScenes.ts` só se o plano usar as cenas na masmorra (PLANO-GUILDA §7 diz que **não**).

**Regra de série (o jogador vê o MESMO lugar amadurecendo):** mesma câmera (frontal baixa), mesmo enquadramento e a mesma **geometria fixa** em todos os cinco: um arco de pedra clara ao fundo, centralizado, com o tronco central de uma árvore alta no centro-esquerdo (a "árvore do Bosque", posição fixa a 38% da largura), duas colunas de pedra baixas a 12% e 88%, um poço/marco de cobre pequeno a 78%, e o **chão aberto e liso na faixa central** onde até 4 criaturas ficam na linha do chão (a área do meio permanece calma). O que muda a cada estágio é só a **quantidade de camadas de vegetação e luz**, sempre para MAIS. **Nunca** folha seca, galho caído, cor desbotada, ruína ou regressão (PLANO-GUILDA §9): o estágio N+1 contém tudo do N. Gerar **primeiro** a Clareira (4 imagens); os outros quatro nascem **anexando a Clareira escolhida (ou o estágio anterior aprovado) como referência** com a frase de fidelidade abaixo, para manter a composição.

**Frase de continuidade (nos estágios 2 a 5, no fim do SCENE):** `Recreate the attached reference scene faithfully — same camera, same arch, same central tree position, same stone columns, same well, same floor — and only ADD the described growth. Everything in the reference stays; nothing is removed, dried or damaged.`

### G1 — `bg-guild-clareira` (estágio 1)

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.

SCENE: a small open grove clearing, stage one. A round pale-stone arch stands at the back center; a single young-but-sturdy tree trunk at 38% from the left with only a few leaves; two low round stone columns at 12% and 88%; a small copper well marker at 78%. Bare open lawn and pale stone floor in the middle. Only the FIRST thin green vine threads climbing the arch and one column and one or two turquoise sparks; a wide open sky in soft morning light, light and airy, not empty-looking but freshly begun. Everything healthy and green.
```

### G2 — `bg-guild-ramagem` (estágio 2)

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.

SCENE: the same grove, stage two, the vine found structure: the central tree now has several branches with leaves, thin copper support poles and a wooden trellis frame lattice built between the two columns and the arch so the vines climb it, a few more turquoise sparks along the vines, the well marker now wrapped with a vine. Still open lawn and stone floor in the middle, a wide sky still visible. All leaves are green and alive. Recreate the attached reference scene faithfully — same camera, same arch, same central tree position, same stone columns, same well, same floor — and only ADD the described growth. Everything in the reference stays; nothing is removed, dried or damaged.
```

### G3 — `bg-guild-copa` (estágio 3)

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.

SCENE: the same grove, stage three, the canopy closes overhead: the central tree crown has spread wide and joins the vine trellis so a leafy roof covers the top third of the image, sky visible only as small gaps with soft light shafts, leaves in green and turquoise, more turquoise sparks, small clusters of turquoise crystal blossoms on the vines. The middle floor stays open, lit by the soft morning light. Recreate the attached reference scene faithfully — same camera, same arch, same central tree position, same stone columns, same well, same floor — and only ADD the described growth. Everything in the reference stays; nothing is removed, dried or damaged.
```

### G4 — `bg-guild-mata` (estágio 4)

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.

SCENE: the same grove, stage four, layers upon layers: a second and third layer of trees and ferns behind the arch in receding depth, thick hanging vines and leaf curtains at both sides, the columns half-covered in moss and copper-veined vines, the canopy dense overhead with light filtering through, many turquoise sparks and crystal blossoms at different heights. The center floor strip stays open, calm and clean. Recreate the attached reference scene faithfully — same camera, same arch, same central tree position, same stone columns, same well, same floor — and only ADD the described growth. Everything in the reference stays; nothing is removed, dried or damaged.
```

### G5 — `bg-guild-bosque-antigo` (estágio 5)

```
[AREA STYLE ANCHOR — copiar o bloco acima, idêntico]

Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition, about 1.85:1, wider than tall. No characters, no creatures, no text, no logos, no UI, no frame or border. The floor line sits at exactly 74% of the image height, with clean empty floor below it for a character to stand on.

SCENE: the same grove, stage five, the ancient grove: the central tree is now enormous, its trunk wrapped in thick copper-veined roots that carry faint turquoise circuit traces, copper has taken over the trim of the arch and columns (aged copper glowing softly), the canopy is a full ceiling with soft golden-green light filtering down in slim shafts and drifting turquoise sparks like pollen, ferns and vines at every layer, small turquoise crystal blossoms everywhere. It is the richest and most layered of the five, yet warm and healthy, never dark or gloomy. The center floor strip stays open and calm. Recreate the attached reference scene faithfully — same camera, same arch, same central tree position, same stone columns, same well, same floor — and only ADD the described growth. Everything in the reference stays; nothing is removed, dried or damaged.
```

### Comuns aos 5 cenários

- **negative:** `pink, magenta, purple, violet, dry leaves, fallen leaves, autumn colors, orange leaves, dead branches, fallen branch, cracked stone, ruin, decay, faded colors, gray desaturated look, black band, letterboxing, characters, creatures, human, text, letters, numbers, logo, frame, border, UI, blur, gradient, anti-aliasing, photo, 3D render, checkerboard`
- **Sementes:** Clareira 4 imagens (escolher pela geometria fixa legível: arco, árvore a 38%, colunas, poço, chão liso na faixa central e linha do chão a 74%). Estágios 2 a 5: **3 imagens cada**, com a referência anexada; escolher a que mais preserva a geometria da Clareira (sobrepor as duas em 50% de opacidade: arco, tronco, colunas e poço no mesmo pixel ± 8 px) e só acrescenta vegetação. Se a costura sair errada, regerar anexando a imagem aprovada, não redescrever.
- **Aceite (`arte-conferente`):** 1200×648 sem alfa; linha do chão **medida** em 74% (± 1%); `baseColor` reamostrado; varredura de matiz 270°–340° = zero; **teste da série:** a folha de contato `_sheet.png` dos cinco lado a lado lê como o mesmo lugar crescendo, com **contagem de camadas de vegetação estritamente crescente** e nenhum elemento removido de um estágio para o seguinte; nenhuma folha seca, galho caído ou tom desbotado; chão central aberto e calmo para as 4 criaturas do palco; silhueta preta de cada um mostra o mesmo arco e a mesma árvore, com copa maior a cada passo; em cinza distinguível dos cenários de Jogos (cogumelos) e Exploração (escuro, ilhas). Nomes fora da paleta: nenhum; renomear é do dono.

---

## Tabela de ativos

| id | tipo | nº de imagens estimado | prioridade |
|---|---|---|---|
| `bg-hall` | cenário (fundo de área, 760×1344) | 4 | P1 (Hall hoje sem fundo) |
| `bg-guild-clareira` | cenário pet-box 1200×648 | 4 | P1 (estágio inicial, todo grupo começa aqui) |
| `bg-guild-ramagem` | cenário pet-box | 3 | P2 |
| `bg-guild-copa` | cenário pet-box | 3 | P2 |
| `bg-guild-mata` | cenário pet-box | 3 | P3 |
| `bg-guild-bosque-antigo` | cenário pet-box | 3 | P3 |
| `lote-hall-guilda` | lote 300² alfa | 4 | P1 |
| `npc-hall-guilda` (Marla) | NPC busto 768² alfa | 4 | P1 |
| `lote-hall-biblioteca` | lote 300² alfa | 4 | P2 |
| `lote-hall-amigos` | lote 300² alfa | 4 | P2 |
| `npc-hall-amigos` (Nino) | NPC busto 768² alfa | 4 | P2 |
| `npc-hall` (Lumi) | NPC existente, conferência | 0 (até 4 se reprovar) | P3 |

Total: 11 ativos a gerar (12 linhas contando Lumi), **40 imagens** estimadas.
