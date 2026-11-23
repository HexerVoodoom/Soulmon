# Prompts dos FX de status e dos glifos (13/11/2026)

Cópia rastreada no repo. A fonte de trabalho fica fora do git: `E:\Soulmon-assets\_fx-status\PLANO.md` (plano e regras), `novo\*.meta.json` (prompt e tags de cada imagem). Instalação: REGISTRO §336.

## Revogação

O §4.3 ("Prompts prontos") de `D:\Soulmon\planos\efeitos-combate.md` está **REVOGADO para FX/status desde 09/11/2026**. O "bloco fixo" e o "molde de folha" desse §4.3 EXIGEM canos de cobre, circuito, folhas e cristal turquesa. Isso contraria a regra de identidade revista pelo dono em 09/11/2026: a identidade Soulmon NÃO vale para FX, efeitos de status nem ícones de efeito. O lote de 09/11 (REGISTRO §264) saiu assim por causa desse §4.3. O arquivo `efeitos-combate.md` não é rastreado pelo git. A nota de revogação foi escrita nele mesmo, e esta página é a cópia que fica no repo. Os prompts que valem são os de baixo.

## Como foi gerado

- **Gerador:** app ChatGPT, uma conversa por imagem (só a 1ª imagem da conversa vem com alfa real). Sem chroma.
- **Anexo de estilo:** o piloto de veneno, aprovado pelo dono, foi a âncora de estilo das outras 12 folhas.
- **Montagem:** `E:\Soulmon-assets\_fx-status\montar_folha.py` corta por projeção de pixels, usa uma só escala para os 6 quadros e âncora embaixo no centro, células de 128 px, alfa binário em 128, folha de 384×256.
- **Glifos:** recorte da caixa e redução nearest para 64×64.

### Molde das folhas

O piloto usou o molde da PLANO §6.1. As outras 12 folhas usaram este molde, com o veneno aprovado como anexo:

```
Generate this image with the image tool using background=transparent.
A single sprite sheet for a 2D combat game: EXACTLY 6 animation frames in a grid of 3 columns by 2 rows, every cell the same square size with wide empty transparent gaps between cells, frames read left-to-right then top-to-bottom. It is a looping status effect that plays over a creature's body: [EFFECT]. Motion across the 6 frames: [MOTION]. Frame 6 must flow back into frame 1 without a jump. Same anchor point (bottom center of each cell) and same scale in every frame; the effect fills about 70% of its cell.
Style: crisp 16-bit retro pixel art, hard pixel edges, limited palette of at most 6 colors ([PALETTE]), a 1-pixel dark outline in the darkest tone of the palette, one bright highlight color, bold simple silhouette that stays readable at 60 pixels. Match EXACTLY the pixel style, outline weight, shading and frame layout of the attached approved poison sheet (green drop with violet mist) - but use this effect's own subject and palette, not green poison. If a second image is attached, use it ONLY as a reference for what the effect does and how it moves, and IGNORE its copper pipes, crystals, leaves and circuit lines.
FORBIDDEN: copper, pipes, tubes, cables, circuit lines, leaves, plants, turquoise crystals, gears, cogs, steampunk, text, letters, numbers, ground, shadow on the floor, background of any kind.
OUTPUT: real transparent PNG with a true alpha channel. No checkerboard, no solid backdrop. Landscape 3:2 composition (for example 1536x1024).
```

| Folha | Usada por (`statusLoopId`) | [EFFECT] | [MOTION] | [PALETTE] |
|---|---|---|---|---|
| `fx-veneno-loop-sheet` | veneno | a thick violet-green toxic drop hanging in the air, swelling and dripping, with small round toxic bubbles rising around it and a faint sickly green glow; small skull-free droplets fall from its tip | the drop swells in frames 1-3 and releases one droplet in frame 4 that falls through frames 5-6, while 3 bubbles drift upward and pop in turn | acid green #8BE04A, toxic lime #C6FF5E, violet #7A3FB8, deep plum #2E1240 outline, pale highlight #F0FFD0 |
| `fx-queimadura-loop-sheet` | queimadura | a tall fierce flame licking upward with loose embers, no base object | the flame tongues flare higher in frames 2-3 and sink in 5-6; 3 embers rise and fade | #FF8A1E, #FFD23F, #E0401A, #5A1408 outline, #FFF6C0 |
| `fx-dot-loop-sheet` | dot | a jagged crimson wound slash floating in the air, oozing heavy red drops | the slash pulses brighter at frame 3, with drops sliding down and falling at the bottom by frame 6 | #C8283C, #FF5A6E, #6A0E1C outline, #2A0408, #FFC0C8 |
| `fx-maldicao-loop-sheet` | maldicao | a grey skull floating, breathing violet-black mist, eyes glowing violet. Keep the motif and silhouette of the second attached image; this is a style-unification redraw | only the mist wisps curl and the eye glow pulses; the skull does not move | #5A1E8C, #B060FF, #9A9AA6, #1A0A26 outline, #E8D8FF |
| `fx-lento-loop-sheet` | lento (todas as variantes) | a heavy downward spiral of sand grains winding around an invisible core, like an hourglass draining, with weight lines pressing down | the spiral turns slowly and the sand grains drift downward 2 px per frame | #B89A5E, #E6CF8E, #6E5A34, #2C2414 outline, #FFF2C8 |
| `fx-silencio-loop-sheet` | silencio | a crossed-out musical note in the centre, with concentric sound-wave arcs on both sides cracking and shattering into fragments | the arcs expand outward and break into pieces by frame 5, then reform; the note stays still | #A8D8FF, #FFFFFF, #E04848 for the slash, #1C2A44 outline, #5C7CA8 |
| `fx-debuff-def-loop-sheet` | debuff/def | a steel-grey round shield cracking apart with red downward chevrons sinking through it | the crack spreads in frames 1-3 and shards chip off, while 2 red chevrons slide down and fade | #8C96A8, #D0D6E0, #E23B3B, #1E2430 outline, #FF8A8A |
| `fx-debuff-loop-sheet` | debuff (padrão) | three bold red downward chevrons stacked vertically, falling through a dim reddish haze column | the chevrons descend 3 px per frame in a staggered order and wrap back to the top; the haze pulses | #E23B3B, #FF8A8A, #7A1414, #2A0606 outline, #FFD0D0 |
| `fx-buff-atk-loop-sheet` | buff/atk, fisico, magico | a golden blade pointing up, wrapped in a rising aura with upward sparks | the aura flickers taller in frames 2-4 and sparks rise 3 px per frame; the blade stays | #FFC83D, #FFF0A0, #C8641E, #4A2808 outline, #FFFFFF |
| `fx-buff-spd-loop-sheet` | buff/spd, aceleracao | sky-blue wind streaks rushing sideways with two bright forward chevrons | the streaks slide right 4 px per frame and wrap around; the chevrons pulse | #4FC3F7, #B8ECFF, #1A6E9C, #0A2438 outline, #FFFFFF |
| `fx-buff-loop-sheet` | buff (padrão e demais variantes) | a soft column of warm golden light with three bright upward chevrons rising inside it | the chevrons climb 3 px per frame in a staggered order and wrap; the column brightens at frame 3 | #FFE680, #FFC83D, #FFFFFF, #6A4A10 outline, #FFF6D0 |
| `fx-regen-loop-sheet` | hot | a gentle spiral of spring-green healing light rising, with tiny sparkles and two small leaves (the leaves belong to healing nature here, not to any machine). No crystal, no pipe, no cable | the spiral rises and rotates, and the sparkles climb 2 px per frame and fade at the top | #6BDB7A, #C8FFB0, #2E8A46, #0E2A16 outline, #FFFFFF |
| `fx-cura-loop-sheet` | cura | a burst of soft mint-white light with small plus-shaped crosses floating upward | the burst blooms in frames 1-2 and softens, while the crosses rise 3 px per frame and fade out | #B6FFD9, #FFFFFF, #3CC88A, #0E3A26 outline, #E8FFF4 |

### Glifos (64×64)

Molde (PLANO §6.4), com `background=transparent` e os anexos `st-maldicao` (estilo) + a folha nova do mesmo efeito:

```
A single game status icon, centered, square 1:1 full-bleed composition, designed to stay readable at 22 pixels: [SYMBOL]. Crisp 16-bit pixel art, bold simple silhouette, very high contrast, 1-pixel dark outline, at most 5 colors ([PALETTE]). Same pixel style as the attached skull icon. No medallion, no frame, no crystal, no copper, no pipe, no leaves, no circuit lines, no gears, no text. OUTPUT: real transparent PNG with true alpha, no checkerboard, no backdrop.
```

| Glifo | [SYMBOL] |
|---|---|
| `st-veneno` | a violet-green toxic drop with two bubbles |
| `st-queimadura` | a flame |
| `st-dot` | a jagged crimson wound slash dripping one heavy red drop |
| `st-maldicao` | a grey skull with glowing violet eyes and a wisp of violet mist |
| `st-retardo` | a sand hourglass |
| `st-silencio` | a crossed-out music note |
| `st-debuff-def` | a cracked grey round shield with a red down arrow |
| `st-seta-desce` | three bold red downward chevrons stacked vertically |
| `st-seta-sobe` | three bright golden upward chevrons stacked vertically |
| `st-buff-atk` | a golden sword pointing up with a small upward aura flame |
| `st-buff-spd` | two bright sky-blue forward chevrons with wind streaks behind them |
| `st-hot` | a green plus with an upward spiral of healing light |
| `st-cura` | a mint-white plus cross over a soft light burst |

## Correção dos 2 saltos de loop (edição de pixel, sem regerar)

O dono pediu: "instala, e corrige os 2 pulos". O script é `E:\Soulmon-assets\_fx-status\fix\corrigir_saltos.py`. Ele lê sempre os originais em `novo\_backup-pre-fix\` e grava em `novo\`. Rodar duas vezes dá o mesmo arquivo (mesmo MD5).

- **`fx-debuff-def`:** o escudo racha ao longo dos 6 quadros, e o loop pulava de quebrado para inteiro. O quadro 6 virou um cross-fade do quadro 6 para o quadro 1 sobre a silhueta do quadro 1, para não ficar com contorno duplo. A cor é 60% do quadro 1 e 40% do quadro 6. Onde o quadro 6 tinha vão entre cacos, a cor escurece 40% para o contorno `#1E2430`: as rachaduras clareiam e as setas voltam esmaecidas. As lascas soltas do quadro 6 continuam.
- **`fx-cura`:** o quadro 6 era bem mais fraco que o quadro 1 (1951 px opacos contra 2235). Ele ganhou o surto da parte de baixo do quadro 1 (y ≥ 76 na célula) por baixo dele e um ganho de brilho. Resultado: 2250 px opacos e luminância média de 140,0, contra 137,4 do quadro 1.
- **Nas duas folhas:** 6 quadros distintos por hash e alfa binário (0/255).
