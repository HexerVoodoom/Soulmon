# Prompts — Laboratório (a Estufa de Vidro)

> Etiqueta: **plano / fila de geração** (29/09/2026). Modo SÓ-PROMPTS: nada foi gerado. Fonte: `00-BIBLIA-DAS-AREAS.md` §1–§6 (tema §2.5, lotes §3, NPCs §4.2/4.3, produção §5), `ASSETS-A-GERAR.md` §1, `manual/04` (paleta). Quem gera: dono, no Higgsfield (`nano_banana_2_lite` sai com alfa real), depois `arte-conferente`, depois `arte-instalador`. Entrega em `D:\Soulmon\_gemini_out\cenarios-<data>\` (fundo, zona), `lotes-laboratorio-<data>\`, `npcs-laboratorio-<data>\`, com `raw/`, `_sheet.png` e `INSTALAR.md`.

## Como usar

1. Cada prompt abaixo já começa pela **ÂNCORA DA ÁREA** (copiada idêntica). Cole o bloco inteiro; não resuma a âncora.
2. Proporção vai no FIM do prompt (já está). Fundo pedido sempre em **verde chapado `#00FF00`** nos lotes e NPCs (chroma-key em `chroma-key.mjs`); "transparent PNG" nunca é aceito.
3. Onde o item existe (Vesca, zona), **anexe a arte atual** e use "recreate faithfully, only repaint".
4. O `negative` vale como linha final do prompt ("Avoid: ...") caso o Higgsfield não tenha campo próprio.
5. Escolha entre as variações: descarte tudo com matiz 270°–340° (roxo/magenta/rosa), xadrez assado, texto/letra/número; das que sobram, fica a de silhueta preta mais legível a 64 px.

## ÂNCORA DE ESTILO DA ÁREA (copiar idêntica no início de todo prompt)

```
AREA STYLE ANCHOR — "Glass Greenhouse" (Laboratory). Retro pixel art, 16-bit era, isometric top-down view, chunky visible pixels, hard aliased edges, flat colors, 1px near-black outline #061414 around shapes, NO blur, NO soft glow, NO gradients, NO translucent pixels, NO anti-aliasing smear. Dark fantasy meets ancient technology. Base palette: deep petrol teal #0E2E2E / #123232 and near-black green #071413; aged deep copper #8A5A2B with lighter #C98B4B for window frames and fittings; glowing turquoise #5DF0E0 / #6EFFFB as the ONLY living energy (small sparks, never a big glow). AREA ACCENT: glass ice-blue #BFEFFF. Material: faceted glass panes with copper lattice frames and fern leaves; creeping vines over the structure. Light: cold, diffuse, filtered through glass, with reflections as diagonal light strips (2-3 pixel wide bands of #BFEFFF over darker glass #2C5A66). Shape language: GEOMETRIC — hexagons, faceted domes, circular lenses. Liquids and potions are only turquoise #5DF0E0 or amber #D9A441. FORBIDDEN colors and things: magenta, purple, violet, pink, red or orange as energy, skulls, bones, tombstones, human hands, text, letters, numbers, logos, UI, frames, borders, checkerboard/transparency pattern baked into the image. Do not copy any existing franchise character or artwork.
```

**Nota de paleta**: a âncora usa só verde-petróleo, cobre, turquesa e azul-gelo (matiz 160°–200° e 25°–40°). Nenhum hex nela cai no intervalo 270°–340°.

---

## Ativos

### LAB-01 · `bg-laboratorio` — fundo da área (NOVO)

| Campo | Valor |
|---|---|
| Família | `cenario` (subtipo fundo de área) |
| Destino | `src/assets/soulmon/areas/bg-laboratorio.png` (+ registrar em `areas/index.ts`, dono do fundo de área) |
| Fonte gerada | 768×1376 (9:16); entregar **760×1344**, sem alfa, ≤ 400 KB após WebP |
| Chão | não é palco: **vista isométrica de cima**; NÃO aplicar 74/26 (isso é só do palco/pet-box). Três clareiras vazias e planas onde os lotes pousam: centro em **27%/42%** (Árvore), **72%/42%** (Meu Soulmon) e **50%/72%** (Observatório), cada uma cabendo um quadrado ~300 px do recorte |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

Isometric top-down view of a faceted glass greenhouse courtyard grown around an ancient tree, seen from above, as the map background of a game area. Hexagonal glass floor tiles in dark petrol teal with faint hexagonal copper grid lines, copper-framed hexagonal greenhouse domes ("honeycomb domes") rising along the top edge, and a small brass telescope lens pointing up at the top-left edge as skyline. Ferns and vine leaves creep over the copper lattice. Diagonal ice-blue reflection strips cross the glass. Small drips of condensation and a few turquoise sparks. Exactly THREE empty flat clearings of hexagonal paving, each about a fifth of the image width, kept completely empty of props: one at 27% from left and 42% from top, one at 72% from left and 42% from top, one at 50% from left and 72% from top. Paths of paving connect the three clearings. Overall value medium-high (lightest area of the glass, but darker than the Hall), contrast in diagonal bands. No characters, no creatures, no buildings inside the clearings, no text, no frame. TALL VERTICAL PORTRAIT 9:16.
```

**Negative**: `purple, violet, magenta, pink, warm red glow, fire, torches, skulls, checkerboard, text, buildings or props inside the three clearings, black letterbox bands, blue crystals in the floor (that is the Market's old kit), mushrooms`

**Variação**: n = **4** (seeds distintas). Escolha a que tem as 3 clareiras nas posições certas (medir com overlay do `left/top`), reflexos diagonais visíveis e nenhum cristal no chão. Se nenhuma acertar as clareiras, gerar a melhor sem clareiras marcadas e pedir edição com a imagem anexada ("keep everything, clear the three areas").

**Aceite (arte-conferente)**: 760×1344, sem alfa; ≤ 400 KB WebP; varredura de matiz 270°–340° = 0; a 64 px de largura em cinza é identificável entre os 6 fundos (valor médio-alto, faixas diagonais de reflexo, grade hexagonal) e distinto de Hall (curvas/simétrico, contraste baixo) e Arena (angular, contraste muito alto); clareiras livres nas três posições.

---

### LAB-02 · `lote-laboratorio-evolucao` — Árvore da Evolução (lote)

| Campo | Valor |
|---|---|
| Família | `cenario` (lote) |
| Destino | `src/assets/soulmon/areas/lote-laboratorio-evolucao.png`; instalar em `LABORATORIO_LOT_ART` (`areas/index.ts`) |
| Fonte | 768×768 sobre `#00FF00`; recortar/chroma-key para **300×300 alfa real** |
| Âncora | centro da BASE no centro-inferior do quadro; sombra de contato pixelada inclusa; tamanho relativo **1,0** (cabe inteiro, sem folga) |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

A single isometric game building on a PURE SOLID GREEN BACKGROUND #00FF00 (nothing else behind it): a tree-house — a huge ancient tree trunk that passes through the roof of a small faceted glass greenhouse, so the leafy canopy sticks out ABOVE the glass roof (the canopy must be the tallest, widest part of the silhouette). Faceted hexagonal glass walls with copper lattice, a small round copper door at the front. Three branches each holding one glowing turquoise cocoon (three small distinct oval cocoons of turquoise light, one per branch). Ferns at the base, a tiny pixel contact shadow under the building. Ice-blue diagonal reflection strips on the glass. The base of the building is centered horizontally at the bottom-center of the frame, the building fills the frame with no cropping. Cut-out object, hard pixel edges, no ground plane beyond the contact shadow. Square 1:1 full-bleed composition.
```

**Negative**: `purple, pink, magenta, red, fire, skull, text, numbers, humans, characters, checkerboard, green pixels inside the building (it would be eaten by chroma-key: keep leaf greens dark teal-green #1E5A45, never #00FF00-like), extra buildings, ground tile`

**Variação**: n = **4**. Escolha: silhueta preta com COPA saindo por cima do telhado (única do conjunto), 3 casulos legíveis, sem verde vivo que sofra chroma-key.

**Aceite**: 300×300 alfa real, sem franja verde; silhueta preta = copa larga sobre caixa facetada, distinta de Meu Soulmon (sino liso) e Observatório (torre fina); paleta sem matiz 270°–340°; sem texto.

---

### LAB-03 · `lote-laboratorio-pet` — Meu Soulmon (lote)

| Campo | Valor |
|---|---|
| Família | `cenario` (lote) |
| Destino | `src/assets/soulmon/areas/lote-laboratorio-pet.png`; `LABORATORIO_LOT_ART` |
| Fonte | 768×768 sobre `#00FF00` → **300×300 alfa real** |
| Âncora | base no centro-inferior; sombra de contato; tamanho relativo **0,7** (a menor peça: deixar margem ~15% em volta no quadro gerado) |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

A single isometric game building on a PURE SOLID GREEN BACKGROUND #00FF00: a bell-jar vivarium — ONE smooth single glass dome (a plain bell shape, NOT faceted, no panes) sitting on a round copper pedestal with a small step. Inside the dome, visible through the glass: a round cushion and a small round standing mirror with a copper rim (both in muted teal and copper). A single ice-blue diagonal reflection strip on the dome and a few turquoise sparks. Small fern at the pedestal. Tiny pixel contact shadow. The building is small: it occupies about 70 percent of the frame width and height, centered horizontally, with its base at the bottom-center. Cut-out object, hard pixel edges. Square 1:1 full-bleed composition.
```

**Negative**: `hexagonal panes, tower, tree, telescope, purple, pink, red, skull, text, humans, creature inside the dome, checkerboard, bright green`

**Variação**: n = **4**. Escolha: cúpula lisa (sino) inequívoca, almofada e espelho legíveis, menor que as outras duas.

**Aceite**: 300×300 alfa real; silhueta preta = sino/cúpula única sobre pedestal, a mais baixa e mais estreita da área; distinta das outras duas do Laboratório; sem roxo.

---

### LAB-04 · `lote-laboratorio-stats` — Observatório (lote)

| Campo | Valor |
|---|---|
| Família | `cenario` (lote) |
| Destino | `src/assets/soulmon/areas/lote-laboratorio-stats.png`; `LABORATORIO_LOT_ART` |
| Fonte | 768×768 sobre `#00FF00` → **300×300 alfa real** |
| Âncora | base no centro-inferior; sombra de contato; tamanho **0,9, vertical** (alta e estreita) |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

A single isometric game building on a PURE SOLID GREEN BACKGROUND #00FF00: a lens tower — a thin tall copper cylinder tower with a few small round glass windows, and at the top a large brass telescope tilted diagonally upward to the upper right; above and around the telescope, two thin astrolabe rings (circles of copper with small tick notches, no numerals, no letters) hovering and turning, with a single turquoise spark at their center. Ice-blue reflection strip on the telescope lens. Tiny fern at the base, tiny pixel contact shadow. The tower is tall and narrow: about 45 percent of the frame width, 90 percent of the height, centered horizontally, base at bottom-center. Cut-out object, hard pixel edges. Square 1:1 full-bleed composition.
```

**Negative**: `numbers on the rings, clock digits, letters, hexagonal dome, tree, bell jar, purple, pink, red, skull, humans, checkerboard, bright green`

**Variação**: n = **4**. Escolha: tubo diagonal claro, anéis sem marcas de número, torre a mais fina do conjunto.

**Aceite**: 300×300 alfa real; silhueta preta = torre fina com tubo diagonal e dois anéis (única vertical estreita da área); sem dígitos/letras nos anéis; sem roxo.

---

### LAB-05 · `npc-laboratorio-pet` — Bento (busto) — NOVO

| Campo | Valor |
|---|---|
| Família | `criatura`/NPC (busto; prompt de personagem próprio, não vem do oráculo) |
| Destino | `src/assets/soulmon/npcs/npc-laboratorio-pet.png`; `LOT_NPC_ART['laboratorio:pet']` em `npcs/index.ts`; voz em `LOT_NPC_VOICE` (Tico → **Bento**, A4) |
| Fonte | 768×768 sobre `#00FF00` → **768×768 alfa real**, contorno preto de 1 px |
| Pose | busto da cintura para cima, 3/4 olhando para a ESQUERDA (fala à direita) |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

NPC portrait bust on a PURE SOLID GREEN BACKGROUND #00FF00, waist-up, three-quarter view facing LEFT. "Bento": a small owl-deer creature (owl face and feathered chest, small deer body and ears) with tiny antlers made of clear ice-blue glass, petrol-teal feathers with darker #123232 shading, round copper-framed lenses (glasses) over big calm eyes, fur/feathers touched by ice-blue light on one side. Careful, attentive, gentle expression. One wing tip raised, adjusting the glasses. Small turquoise spark near the antlers. 1px near-black outline all around, hard pixel edges, an original creature of this universe. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```

**Negative**: `human, humanoid face, hands, purple, pink, magenta, red, skull, text, name tag with letters, checkerboard, franchise mascot look, owl from any known game or film, soft glow, background scenery`

**Variação**: n = **4**. Escolha: leitura de "coruja-cervo" (bico + chifres de vidro) e óculos redondos de cobre; gesto de ajustar óculos; menos parecido com qualquer mascote conhecido. Se sair de outra pose, anexar a melhor e pedir "reproduce faithfully".

**Aceite**: 768×768 alfa real, sem franja verde; contorno 1 px; sem roxo/rosa; silhueta preta = cabeça redonda + chifres finos + óculos redondos, distinta de Quill e Vesca; sem texto; sem cópia de personagem (arte-conferente compara com o placeholder `npc-placeholder-coruja-cervo.png`: mesma ideia, repintada).

---

### LAB-06 · `npc-laboratorio-stats` — Quill (busto) — NOVO

| Campo | Valor |
|---|---|
| Família | `criatura`/NPC |
| Destino | `src/assets/soulmon/npcs/npc-laboratorio-stats.png`; `LOT_NPC_ART['laboratorio:stats']` (substitui o placeholder poring, A2/A3) |
| Fonte | 768×768 sobre `#00FF00` → **768×768 alfa real** |
| Pose | busto, 3/4 para a ESQUERDA |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

NPC portrait bust on a PURE SOLID GREEN BACKGROUND #00FF00, waist-up (upper thorax and head), three-quarter view facing LEFT. "Quill": a praying-mantis creature made of greenish translucent glass (pale teal-green #5FB8A0 body with ice-blue #BFEFFF highlight strips), whose two front forelegs end in feather quill pens (cream feathers with copper nibs), a small copper notebook strapped to its back, slim geometric angular head with two calm round eyes. Meticulous and serene expression. One forelimb turning a page of a blank copper-bound notebook (pages blank, NO writing). Small turquoise spark at the nib. 1px near-black outline, hard pixel edges, an original creature of this universe. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```

**Negative**: `writing on pages, letters, numbers, human, hands, purple, pink, magenta, red, skull, checkerboard, soft glow, scenery, insect from any game or anime franchise`

**Variação**: n = **4**. Escolha: mantis de vidro legível, penas como patas dianteiras, caderno sem escrita; silhueta fina e geométrica.

**Aceite**: 768×768 alfa real; caderno sem letras; sem roxo (o verde-vidro fica em matiz ~160°); silhueta preta = mantis de braços em pena, distinta de Bento (redondo) e Vesca; sem cópia de franquia.

---

### LAB-07 · `npc-laboratorio` — Vesca (REPINTAR, sem roxo)

| Campo | Valor |
|---|---|
| Família | `criatura`/NPC (repintura, A2) |
| Destino | `src/assets/soulmon/npcs/npc-laboratorio.png` (sobrescreve; arquivar o atual em `brand-archive` da squad antes) |
| Fonte | 768×768 (mesma dimensão do atual) sobre `#00FF00` → **768×768 alfa real** |
| Entrada | **anexar `npc-laboratorio.png` atual** |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

Attached is the current portrait of the NPC "Vesca". Recreate it faithfully — same character, same pose, same silhouette, same 3/4 view facing left, same proportions, same pixel style — on a PURE SOLID GREEN BACKGROUND #00FF00, and ONLY repaint the colors: every purple, violet, magenta or pink area (potions, flasks, liquid, clothing, accents) becomes turquoise #5DF0E0 or amber #D9A441; any purple-ish shading becomes deep petrol teal #123232; keep copper fittings. Vials and flasks must hold only turquoise or amber liquid. Keep the 1px near-black outline. An original creature of this universe. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```

**Negative**: `purple, violet, magenta, pink, changing the character design, changing the pose, text, checkerboard, new props`

**Variação**: n = **3**. Escolha: a mais fiel à silhueta do original, sem nenhum pixel de matiz 270°–340°.

**Aceite**: varredura de matiz 270°–340° = **0**; silhueta idêntica à atual (sobreposição); alfa real; 768²; frascos turquesa/âmbar.

---

### LAB-08 · `zona-laboratorio` — zona do mapa (REPINTAR, sem roxo)

| Campo | Valor |
|---|---|
| Família | `cenario` (peça do mapa) |
| Destino | `src/assets/soulmon/mapa/zona-laboratorio.png` (sobrescreve; arquivar o atual) |
| Fonte | **512×512** (medido) sobre `#00FF00` → **512×512 alfa real** |
| Entrada | **anexar `zona-laboratorio.png` atual**. Tema §2.5: cúpulas em favo + lente; frascos viram turquesa/âmbar |

**Prompt**

```
[ÂNCORA DE ESTILO DA ÁREA — colar aqui, idêntica]

Attached is the current map zone art for the Laboratory. Recreate it faithfully — same layout, composition, silhouette and scale on the map — as an isometric map-zone piece on a PURE SOLID GREEN BACKGROUND #00FF00, and repaint: all purple/violet/magenta/pink flasks and liquid become turquoise #5DF0E0 or amber #D9A441; where possible turn the roofs into a cluster of copper-framed hexagonal glass domes (honeycomb) with a telescope lens pointing up, ice-blue diagonal reflection strips. Keep it one cut-out object with a tiny contact shadow. Do not copy any existing franchise character or artwork. Square 1:1 full-bleed composition.
```

**Negative**: `purple, violet, magenta, pink, red glow, text, characters, checkerboard, changing the footprint`

**Variação**: n = **3**. Escolha: fiel ao recorte original (mesmo footprint no mapa), zero matiz 270°–340°, cúpulas em favo legíveis a 64 px.

**Aceite**: 512×512 alfa real; matiz proibido = 0; a 64 px em cinza distinto das outras 5 zonas; footprint compatível com `bg-mapa`.

---

## Tabela de produção (ordem da bíblia §6, item 2 — Laboratório)

| id | tipo | nº de imagens estimado | prioridade |
|---|---|---|---|
| `bg-laboratorio` | fundo de área (novo) | 4 | 1 (destrava a área inteira) |
| `lote-laboratorio-evolucao` | lote (novo) | 4 | 2 (Evolução, uso semanal) |
| `lote-laboratorio-stats` | lote (novo) | 4 | 3 (Estatísticas, uso semanal) |
| `lote-laboratorio-pet` | lote (novo) | 4 | 4 |
| `npc-laboratorio-pet` (Bento) | NPC (novo) | 4 | 5 |
| `npc-laboratorio-stats` (Quill) | NPC (novo) | 4 | 6 |
| `npc-laboratorio` (Vesca) | NPC repintura | 3 | 7 |
| `zona-laboratorio` | zona do mapa, repintura | 3 | 8 |

**Total: 8 ativos, 30 imagens** (cada um até 2× se houver refazer; teto prático 45).

## Pendências para o dono / instalador
- `INSTALAR.md` da leva deve registrar: `areas/index.ts` (`LABORATORIO_LOT_ART`, `bg-laboratorio`), `npcs/index.ts` (`LOT_NPC_ART`), `LOT_NPC_VOICE['laboratorio:pet']` Tico → Bento (A4), fala de cada NPC vem da bíblia §4.2 e passa por `soulmon-copy-redator`.
- A ficha da Vesca (§4.3) só diz "perde o roxo"; por isso LAB-07 é repintura fiel sobre a arte anexada, sem redesenho.
- `npc-placeholder-poring.png` sai do bundle só depois que Quill e os outros NPCs da §4 chegarem (A3).
