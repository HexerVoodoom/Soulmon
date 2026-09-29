# Prompts — Exploração (o Charco das Ilhas)

> Etiqueta: **plano**. Modo só-prompts (29/09/2026): nada aqui foi gerado. Fonte: `00-BIBLIA-DAS-AREAS.md` §2.4, §3, §4.2, §5; blocos de estilo de `ASSETS-A-GERAR.md` §1. Gerar com Higgsfield `nano_banana_2_lite` quando houver crédito; conferir com `arte-conferente`; instalar com `arte-instalador` (só trocar imports em `src/assets/soulmon/areas/index.ts` e `npcs/index.ts`). Este arquivo não toca `src/`.

## Escopo (o que a bíblia manda refazer ou criar)

| Ativo | Por quê |
|---|---|
| `bg-exploracao` | refazer: hoje é o mesmo kit de Mercado/Arena e tem caveiras nos fogos-fátuos (bíblia §2.4, §5.12) |
| `lote-exploracao-masmorra` | a bíblia dá silhueta nova (boca de caverna em rochedo flutuante). Arte própria existe hoje; refazer para casar com o fundo novo |
| `lote-exploracao-dino` | idem: pista-ponte em arco |
| `npc-exploracao-dino` (Trote) | NPC novo; hoje usa o placeholder poring |
| Brisa (`npc-exploracao`) | **não regerar.** Só conferência: sem caveira. Se tiver, abrir pedido à parte |

Posições dos lotes (`src/utils/playAreaLots.ts`, centro da BASE, em % da cena): masmorra `left 27% / top 36%`, dino `left 72% / top 46%`. O fundo deixa clareira vazia nesses dois pontos.

## Âncora de estilo da área (copiar IDÊNTICA no início de todo prompt)

```
AREA STYLE ANCHOR — "Charco das Ilhas" (misty floating-island swamp). Retro pixel art, 16-bit era, isometric view from above, clean hard-edged pixels, no anti-aliasing blur, flat colors, 1px near-black outline #061414 on every shape. Palette: base deep petrol teal #0E2E2E and #123232 with near-black green #071413; aged copper #8A5A2B and #C98B4B only on small hardware and rims; single living energy is small turquoise sparks #6EFFFB; AREA ACCENT is pale green will-o-wisp light #A8F0D0. Support tones: wet stone #2A4A47, peat brown-green #2E3B2A, root bark #3B3226. Material: wet stone, roots, peat. Light: diffuse mist backlight, everything seen in silhouette and rim light, nothing lit from the front; the darkest area of the whole game, very low overall value, low contrast, soft fog bands drawn as flat stepped pixel layers. Shape language: organic and fragmented, broken edges, loose blocks, roots hanging into the void; ground never touches the image border, pieces FLOAT. Will-o-wisps are plain small pale-green flames with NO face, NO skull, NO bone. Vines grow over structures. Strictly forbidden: magenta, purple, violet, pink, red or orange as energy, skulls, bones, tombstones, human hands, text, letters, numbers, logos, UI, frame or border. Do not copy any existing franchise character or location.
```

Kit comum obrigatório (já dentro da âncora): verde-petróleo de fundo, cobre nas bordas, fagulha turquesa, videira sobre estrutura.

---

## 1. `bg-exploracao` — fundo da área

| Campo | Valor |
|---|---|
| id / destino | `bg-exploracao` → `src/assets/soulmon/areas/bg-exploracao.png` (substitui) |
| família | `cenario`, subtipo fundo de área |
| dimensões | gerar 9:16 (768×1376 ou maior), reamostrar para **760×1344**, ≤ 400 KB após WebP |
| alfa | **sem alfa** (fundo opaco, sem xadrez, sem moldura) |
| chão | 74%/26% **não se aplica**: é mapa de área visto de cima (bíblia §5), não palco. O equivalente aqui: nenhuma faixa contínua de chão até a borda inferior; o vazio (névoa) chega às 4 bordas |

**Prompt principal**
```
[paste AREA STYLE ANCHOR here, identical]

Retro pixel art game-area background, TALL VERTICAL PORTRAIT 9:16, isometric view from above. A misty marsh where pieces of ground float in the void and roots hang beneath them; the limit of what has been read in the Mesh. Composition: a scatter of 7 to 9 floating islands of wet stone and peat at different sizes, each ringed with hanging roots and small stepping stones between them; broken edges, loose stone blocks drifting near the rims. Long flat stepped fog bands between islands, backlit, so islands read as dark cutouts with a thin pale-green rim light (#A8F0D0). Skyline at the top: a fallen willow tree lying across two distant islands, its long branches drooping, plus small distant floating rocks. Exactly TWO clearings, each a flat empty wet-stone platform about 300 pixels wide with nothing on it, reserved for buildings: one large clearing centered at 27% from the left and 36% from the top of the image, one clearing centered at 72% from the left and 46% from the top, joined to the rest by stepping stones. Scatter 8 to 12 small will-o-wisps (plain pale-green flame drops, no faces) hovering low, and a few turquoise sparks near copper-rimmed stones. Overall the darkest image of the set: mostly near-black teal values, a few pale-green light points, fog as the only mid-tone. Keep the center-bottom calm. Ground pieces do not touch any image border; the void and fog fill all four edges. TALL VERTICAL PORTRAIT 9:16, full-bleed composition.
```

**negative**
```
skull, skulls, bones, skeleton, tombstone, face in flames, magenta, purple, violet, pink, red glow, orange fire, crystal spikes, torches, market stalls, crates, striped awning, crane, sandstone, stepped amphitheater, pennants, mushrooms, glass dome, arches, bright sun, blue sky, characters, creatures, humans, text, letters, numbers, logo, UI, frame, border, black bars, letterbox, checkerboard, transparency grid, blur, soft gradient glow, photo, 3d render
```

**Variação de seed:** 6 imagens (seeds distintos, mesmo prompt). Escolher a que (a) tem as duas clareiras vazias nas posições certas (sobrepor grade 27%/36% e 72%/46%; deslocamento tolerado: 4% da largura), (b) tem o menor valor médio (medir luminância média; alvo ≤ 22% de branco), (c) não tem forma de caveira em nenhum fogo-fátuo nem nas raízes/pedras (olhar a 200%), (d) nenhuma ilha encosta na borda. Se a clareira sair no lugar errado: anexar a melhor imagem e pedir "reproduce faithfully, move only the two empty clearings to X/Y".

**Critério de aceite (arte-conferente)**
- Silhueta em preto (limiar de luminância): massas de ilhas soltas com raízes pendentes, vazio entre elas, fundo contínuo até as bordas; lê como "arquipélago", nunca como faixa de chão.
- Cinza a 64 px de largura: **a mais escura das 6 áreas**, contraste baixo, sem poças de luz quentes (Mercado) e sem massa clara ou dentes de serra (Arena). Um terceiro a identifica ao lado de Mercado, Arena e Hall sem legenda.
- Zero pixels com matiz 270°–340°; zero caveira/osso; nenhum vermelho/laranja como energia; sem alfa, sem xadrez, sem texto.
- Peso ≤ 400 KB em WebP; clareiras vazias (nada desenhado na área de 300² ao redor de cada ponto).

---

## 2. `lote-exploracao-masmorra` — Masmorra

| Campo | Valor |
|---|---|
| id / destino | `lote-exploracao-masmorra` → `src/assets/soulmon/areas/lote-exploracao-masmorra.png` (substitui) |
| família | `cenario`, subtipo lote |
| dimensões | gerar **768×768**, recortar **300×300**; tamanho relativo 1,0 (cabe inteiro, sem folga) |
| alfa | **real** (gerar sobre verde `#00FF00` e chroma-key; nunca pedir "transparent PNG") |
| âncora | centro da BASE no centro-inferior do quadro (ponto que `left 27% / top 36%` posiciona); sombra de contato inclusa |

**Prompt principal**
```
[paste AREA STYLE ANCHOR here, identical]

Single game building sprite, isometric view from above, centered, on a PURE SOLID GREEN BACKGROUND (#00FF00), nothing else behind it. A heavy chunk of wet rock floating in the air, seen whole: a dark cave mouth cut into its front face, a stone staircase descending from the opening into pure black darkness, thick roots and vines falling from the broken underside rim and hanging in the void, a few small drifting stone blocks near the edge, a tiny copper-rimmed stone lantern beside the entrance with one turquoise spark, and two or three plain pale-green will-o-wisp flames near the mouth (no faces, no skull). Silhouette: a single massive heavy mass with one black opening. The base of the rock is at the bottom center of the frame with a small hard-edged contact shadow. Fills the frame with a thin margin. Solid flat green background (#00FF00), no ground plane, no fog, no text. Square 1:1 full-bleed composition.
```

**negative**
```
skull, bones, tombstone, magenta, purple, violet, pink, red, orange fire, torch, crates, awning, crane, bridge, planks, arches, mushroom, glass, characters, creatures, humans, text, letters, numbers, logo, UI, frame, green tint on the subject, green fringe, checkerboard, transparency grid, blur, soft glow, drop shadow gradient
```

**Variação de seed:** 4 imagens. Escolher a com boca de caverna + escada visíveis, raízes caindo da borda, base centrada, borda sem franja verde após chroma-key, e sem forma de caveira na abertura nem nos fogos-fátuos. Descartar as que trazem ponte/tábuas (é a silhueta do Dino).

**Critério de aceite**
- Silhueta preta: **uma massa pesada com uma abertura negra**; lida ao lado do Dino, os dois não se confundem (aqui compacta e alta, lá longa e horizontal).
- Cinza: mais escuro que qualquer lote de Mercado/Arena; nenhum toldo, degrau de arquibancada ou guindaste.
- Alfa real, sem franja verde; 300×300; paleta sem matiz 270°–340°; sem caveira, sem texto; base centrada.

---

## 3. `lote-exploracao-dino` — Corrida do Dino

| Campo | Valor |
|---|---|
| id / destino | `lote-exploracao-dino` → `src/assets/soulmon/areas/lote-exploracao-dino.png` (substitui) |
| família | `cenario`, subtipo lote |
| dimensões | gerar **768×768**, recortar **300×300**; tamanho relativo 0,8, **horizontal** (ocupa a largura toda e ~40% da altura, base no centro-inferior) |
| alfa | **real** (verde `#00FF00` + chroma-key) |
| âncora | centro da base no centro-inferior (ponto `left 72% / top 46%`); sombra de contato inclusa |

**Prompt principal**
```
[paste AREA STYLE ANCHOR here, identical]

Single game building sprite, isometric view from above, centered, on a PURE SOLID GREEN BACKGROUND (#00FF00), nothing else behind it. A long low bridge-track: a wide gentle arch of wooden planks held by rope rails, spanning between two small floating stone islets at its two ends, roots hanging under both islets and under the planks. At the left end, on the islet, a small starting flag on a wooden pole with a plain triangular cloth flag (no symbol, no letters); a few worn stepping stones in front of it. Rope lanterns are NOT used; only one or two plain pale-green will-o-wisp flames near the flag and a few turquoise sparks on the copper-bound plank ends. Silhouette: long, thin and horizontal, clearly wider than tall, taking about 80 percent of the frame width and about 40 percent of its height, with the base line at the bottom center and a small hard-edged contact shadow. Solid flat green background (#00FF00), no ground plane, no fog, no text. Square 1:1 full-bleed composition.
```

**negative**
```
skull, bones, magenta, purple, violet, pink, red flag, red, orange fire, torches, tall tower, cave mouth, dome, striped tent, crates, crane, arches of stone, mushrooms, characters, creatures, humans, text, letters, numbers, checkered flag pattern, logo, UI, frame, green fringe, checkerboard, transparency grid, blur, soft glow
```

**Variação de seed:** 4 imagens. Escolher a com a maior razão largura/altura da forma (≥ 2:1), bandeira de largada legível como triângulo liso (sem símbolo), duas ilhotas nas pontas, base centrada. Descartar as que ficaram verticais ou têm o arco alto demais.

**Critério de aceite**
- Silhueta preta: **a única forma longa e horizontal** da área (razão ≥ 2:1), com uma haste de bandeira numa ponta; inconfundível ao lado da Masmorra.
- Cinza: mesmo valor baixo do fundo; sem listras de toldo nem degraus.
- Alfa real, sem franja verde; 300×300; bandeira sem letra/número/xadrez; paleta sem matiz 270°–340°; sem caveira.

---

## 4. `npc-exploracao-dino` — Trote (anfitrião do lote Dino)

| Campo | Valor |
|---|---|
| id / destino | `npc-exploracao-dino` → `src/assets/soulmon/npcs/npc-exploracao-dino.png` (novo; registrar em `LOT_NPC_ART`; voz em `LOT_NPC_VOICE`, `src/utils/areaNpcVoice.ts`) |
| família | `criatura` (NPC busto) |
| dimensões | **768×768**, busto da cintura para cima, 3/4 olhando para a **esquerda** (a fala fica à direita) |
| alfa | **real**, contorno preto de 1 px (verde `#00FF00` + chroma-key) |

**Prompt principal**
```
[paste AREA STYLE ANCHOR here, identical]

Character bust portrait, chest-up, three-quarter view facing LEFT, centered, on a PURE SOLID GREEN BACKGROUND (#00FF00). Original creature "Trote": a tall-legged running bird with a short beak, restless and eager. Body feathers in peat brown-green (#2E3B2A) with tips glowing pale will-o-wisp green (#A8F0D0), one single loose feather falling from its crest, bright round curious eyes, a tiny copper ring on one leg, a few turquoise sparks near the feet. Cheerful, springy expression, head slightly forward as if about to start a race. Not a human, no clothing, no hands. 1px near-black outline (#061414) around the whole silhouette, chunky hard pixels, no blur, no glow halo. Waist-up crop (bird chest and upper legs visible). Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```

**negative**
```
human, humanoid, hands, fingers, clothing, skull, bones, magenta, purple, violet, pink, red, orange, existing franchise character, mascot lookalike, roadrunner cartoon, text, letters, numbers, logo, UI, frame, background scenery, ground, green fringe, checkerboard, transparency grid, blur, soft glow, gradient, drop shadow
```

**Variação de seed:** 4 imagens. Escolher a com silhueta de ave-corredora legível (pescoço + pernas longas, bico curto), pena solta visível, olhar 3/4 à esquerda, contorno de 1 px contínuo, e **nenhuma semelhança com personagem existente** (revisão manual). Se as penas saírem muito claras: trocar o sujeito (mais turfa escura), não a cor do acento.

**Critério de aceite**
- Silhueta preta: ave alta e magra com crista/pena solta, distinta de Brisa (o anfitrião da Masmorra) e de Pipo.
- Cinza: mais escuro que os NPCs do Mercado e da Arena; acento só nas pontas das penas.
- Alfa real, contorno preto 1 px, 768²; sem humano/mão; sem matiz 270°–340°; sem caveira; sem texto; cláusula "Do not copy any existing franchise character" presente no prompt usado (registrar seed no `INSTALAR.md`).
- Nome **Trote** conferido: sem sufixo "-mon".

---

## Tabela final

| id | tipo | nº de imagens estimado | prioridade |
|---|---|---|---|
| `bg-exploracao` | fundo de área (cenário, 760×1344, sem alfa) | 6 | 1 (é o item que falha o teste de cinza e tem caveiras) |
| `lote-exploracao-masmorra` | lote (300², alfa) | 4 | 2 |
| `lote-exploracao-dino` | lote (300², alfa) | 4 | 3 |
| `npc-exploracao-dino` (Trote) | NPC busto (768², alfa) | 4 | 4 (hoje o Dino usa placeholder que sai do bundle) |
| **Total** | **4 ativos** | **18 imagens** | Brisa: só conferência, 0 imagens |

Ordem de instalação sugerida: fundo primeiro (lotes e NPC precisam casar com ele), depois os dois lotes, por fim Trote. Depois de instalar o fundo, `arte-conferente` roda o teste de 64 px cinza contra os outros cinco fundos.
