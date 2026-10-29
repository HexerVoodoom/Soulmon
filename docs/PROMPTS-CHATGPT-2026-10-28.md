# Prompts para colar no app ChatGPT — assets que ainda faltam (28/10/2026)

> **Etiqueta: fila de geração (nada gerado, nada instalado).** Base: `ASSETS-A-GERAR.md` (§16 level up, §20 selo, pendência da sereia, §16 Caderno), `ASSETS-FALTANTES-BETA3.md`, `NPCS-NOVOS.md`, `PEDIDOS-DO-DONO-2026-10-28.md` (B5, F2) e as regras de arte do dono (padrão 23/09, vibe arcano+natureza, molde de NPC, transparência real, ChatGPT preferido ao Gemini, proporção no fim do prompt).
> **Estado:** a geração do selo está **PAUSADA até o dono liberar o PC** (ele avisa). Este arquivo existe para a retomada ser só colar.

## 0. Regras que valem para TODO prompt abaixo

1. **Canal:** app ChatGPT desktop (computer-use, janela em monitor separado do Chrome). Uma conversa nova por peça. Anexar referência por clique-direito > Paste (Ctrl+V falha).
2. **Transparência real:** pedir **fundo transparente com alfa de verdade** direto ao ChatGPT (nunca chroma `#00FF00`, nunca "transparent PNG" confiando sem conferir). Conferir cada PNG com Pillow (`python -I`): 4 canais, % de alfa 0, **0 px de chroma**. O ChatGPT às vezes entrega xadrez assado: se vier, regenerar (não recortar à mão). Corpo costuma vir com alfa 250–254: binarizar em 128 e zerar RGB onde alfa = 0.
3. **Prévia/conferência:** xadrez ou `#08191A`. **Nunca** magenta ou verde.
4. **Proporção no FIM do prompt** (última frase). O ChatGPT só tem 1:1, 3:2 e 2:3: peças de proporção extrema saem em 3:2 e são **recortadas pela bounding box** depois (não esticar).
5. **Vibe:** arcano + natureza, cobre só como detalhe, tech só traço. **Proibido:** engrenagem, vapor, couro/arreio, cartola, goggles, relógio, magenta/roxo/rosa-choque. Expressão calma.
6. **Sem texto, letras, números, marca d'água, moldura** em toda arte (única exceção: LU1, cuja palavra é o assunto).
7. **Sem pós-processo de pixelização** (revogado em 14/10). Só redução final com *nearest* para o tamanho alvo, quando o doc pedir.
8. NPC = **molde canônico do dono** (cabeçalho fixo + blocos CREATURE / PROFESSION / place / COLORS). Reprodução de um design aprovado = **anexar a imagem aprovada** e pedir reprodução fiel (descrição em texto perde).
9. Depois de gerar: fluxo `arte-conferente` > `arte-instalador` (fonte = arquivo canônico atual; `CACHE_VERSION` em `public/sw.js`; `npx vitest run` conferindo `Test Files`; commit por caminho; registrar em `INVENTARIO-ASSETS.md`).

## 1. Tabela-índice

| ID | O que é | Prioridade | Tamanho / proporção no ChatGPT | Transparência | Destino no repo | Referência a anexar (caminho) |
|---|---|---|---|---|---|---|
| **SR-1** | Selo/medalha "novo recorde" do `ResultScreen` (proposta D) | **P1** (destrava o ResultScreen; hoje troféu provisório) | 1:1 (1024×1024); instalar 1024 ou reduzir *nearest* | **Sim** (alfa real) | `src/assets/soulmon/icons/icon-record-seal.png` (+ trocar o troféu provisório no `ResultScreen.tsx`) | `src/assets/icons/icon-trophy-gold.png` (estilo) + `src/assets/soulmon/items/item-heart.png` (nível de detalhe) |
| **SP-1** | NPC sereia-pintora, corpo inteiro, **regerar** com fundo transparente (reprodução fiel do design aprovado) | **P1** (fecha a pendência de 28/10; único pendente de `E:/novos npcs`) | 2:3 vertical (1024×1536); instalar bbox, altura 1100, como os outros corpo-inteiro (original era 768×1296) | **Sim** | `src/assets/soulmon/npcs/npc-n-sereiaPintora.png` + `NOVO_NPC_ART` (`npcs/index.ts`) + `NOVO_NPC_VOICE` (`utils/areaNpcVoice.ts`, `category: 'mistico'` sugerida) | **a imagem aprovada:** `E:/novos npcs/hf_20261014_162920_19e8f11a-4fe0-40c3-b9af-89b15cff7639.png` (cópia em `E:/Soulmon-assets/higgsfield-banco/novos-npcs/`) |
| **SP-1b** | Plano B da sereia: molde de texto, sem referência | só se SP-1 falhar 2× | 2:3 | Sim | idem SP-1 | nenhuma (molde de NPC é sem imagem) |
| **LU1** | Palavra **LEVEL UP** (banner) do `LevelUpOverlay` | P3 (opcional; o procedural cobre) | 3:2 com o banner ocupando ~90% da largura; recortar bbox e reduzir para **512×128** nativo (exibido 256) | **Sim** | `src/assets/soulmon/levelup/levelup-banner.png` (nome exato; `levelUpArt('banner')`, sem mexer em código) | `src/assets/soulmon/fx/gain-levelup.png` (chevron já instalado) + `src/assets/soulmon/emblems/perfect-day.png` (aro de cobre, face petróleo) |
| **LU1-PT** | Variante "NOVO NÍVEL" do banner | P3 **só se o dono quiser o par PT** (decisão aberta; exige linha em `LevelUpOverlay`) | igual LU1 | Sim | `levelup-banner-pt.png` (slot a criar) | igual LU1 |
| **LU2** | Burst de raios atrás do número/pet | P3 (opcional) | 1:1; instalar **680×680** (exibido 340, gira devagar: simétrico por rotação de 30°) | **Sim** | `src/assets/soulmon/levelup/levelup-burst.png` | `src/assets/soulmon/fx-ataque/fx-luz-aura.png` (família de FX) |
| **LU3** | Moldura do número "LV 12" | P3 (opcional) | 3:2 com a moldura centrada; recortar bbox, **320×128** (esticada `fill`, bordas repetíveis) | **Sim** | `src/assets/soulmon/levelup/levelup-frame.png` | `src/assets/soulmon/emblems/habit-66.png` (aro de cobre) |
| **CAD-1** | Prédio próprio do **Caderno (Journal)**, tons quentes, contraste com a clareira verde-teal | P3 (opcional; hoje chalé amarelo provisório `lote-exploracao-caderno-campina.png`) | 1:1 isométrico (gerar 1024², reduzir para **300²**, mesmo pós dos `lotes-v2`) | **Sim** | `src/assets/soulmon/areas/lote-exploracao-caderno.png` (substitui; chão a 74%) | `src/assets/soulmon/areas/lote-exploracao-oficina-v3.png` (irmão aprovado da área) + `lote-exploracao-caderno-campina.png` (o que está em uso) |

**Referência de estilo global (anexar junto, se o ChatGPT desviar):** `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/` (52 referências do padrão de 23/09; prancha de UI v1.2 para ícones).

### Não entram (conferido no disco/doc em 28/10/2026)

- **I21 e I22** (dash-gem/props/obstáculos R4 e bônus do roguelike): já **instalados** (28/10, branch `arte-instalar-2`); as homônimas de 01/10 (`lote-arena-feira`, visores) também. Nada a gerar.
- **§19 cenários por elemento (AC1–AC12):** RETIRADA em 28/10 (REGISTRO §180).
- **Sombras do Pesadelo (§17):** os 12 slots já têm arte mapeada em `SHADOW_ART` (8 PNG; os demais são alias).
- **E1 `dias-completos-30`:** instalado na I14. **EL1–EL5/EL7/EL8** (linhas fada/industrial/planta, inimigos 139–211, FX `fx-fada-*`/`fx-industrial-*`): já em `novos/`, `novos-arquivo/combinados/` e `fx-ataque/`. **EL9** (pet-box temático) é opcional e sem pedido do dono: fora.
- **Prédios `r4-02a/b/c` e `p1-02`:** o dono escolheu a opção (d); não gerar. **P1-01/P1-03/P1-07:** cancelados.
- **Loja L2/L3:** composição por script (Pillow/sharp), não geração.
- **Mascote (3 poses extras), splash A13, `fruit-broto`/estágios de planta:** ninguém pediu / sem slot.

## 2. Ordem recomendada de geração

| Ordem | Peça | Por quê |
|---|---|---|
| 1 | **SR-1** selo | Único item que **destrava código**: troca o troféu provisório do `ResultScreen`. Barato (1 geração). Fazer assim que o dono liberar o PC. |
| 2 | **SP-1** sereia (SP-1b só se falhar) | Fecha a única pendência de NPC; sem consumidor em tela (NPC-1), então não bloqueia código, mas é rápido e o design já está aprovado. |
| 3 | **LU2**, **LU3**, **LU1** (nessa ordem: burst e moldura são seguros; o banner tem risco de letra errada) | Opcionais: o slot liga sozinho pelo nome do arquivo. Se LU1 sair com letra errada 2×, parar e deixar o procedural. |
| 4 | **CAD-1** | Só se o dono ainda quiser arte própria do Caderno. Conferir sobre o fundo da Exploração antes de instalar. |

**Folhas (regra do CLAUDE.md global):** não há grupo de ícones pequenos e relacionados neste lote, então **nenhuma folha**: o selo é peça única, e LU1/LU2/LU3 têm tamanhos e usos diferentes e exigem legibilidade de texto (LU1). Se o dono pedir mais ícones depois, agrupar em folha 3:2 sobre transparente e fatiar por projeção (`scripts-arte/fatiar-alfa.mjs`).

---

## 3. Prompts

### SR-1 — Selo "novo recorde" (anexar: `icon-trophy-gold.png` + `item-heart.png`)

```
Create a single pixel-art game icon: a round "NEW RECORD" medal seal. Gold-and-copper circular medal with a small glowing turquoise crystal gem (#5FF3E0) set in the center, two tiny leaf laurels hugging the lower half, a short ribbon with two tails below, and a couple of small cyan sparkle stars around it. 16-bit pixel art, crisp hard pixel edges, flat cel shading with 3 tones per material, dark navy 1px outline, same level of detail and same warm gold as the attached trophy icon. Magical-nature mood: arcane, calm, NOT steampunk, no gears, no steam. Handheld creature-collector UI icon look. The medal is centered and fills about 80 percent of the square canvas. The background must be FULLY TRANSPARENT with real alpha: no drawn checkerboard, no ground, no drop shadow, no glow halo. No text, no letters, no numbers. Square 1:1 composition.
```

### SP-1 — Sereia-pintora, reprodução fiel com fundo transparente (anexar: a imagem aprovada, como âncora dominante)

```
Recreate this exact pixel-art character illustration in full resolution, preserving precisely the character, her pose, her face, the long wavy coral-pink hair with white flowers and pearl strands, the translucent lilac fairy wings, the teal skin, the white seashell bodice with the blue starry corset, the pearl-and-gold jewelry, the iridescent turquoise-and-white mermaid tail with the large flowing fin, the paintbrush in her right hand, the framed painting in her left hand, the painter's palette with colored shells, the leather pouch with brushes and rolled scrolls at her hip, and the small floating gold-framed paintings with turquoise crystal pendants around her. This is a faithful reproduction of an already-approved design, not a new interpretation: same colors, same proportions, same pixel-art style with clean outlines and cel shading. Keep her an adult woman with a calm, gentle smile.
The ONLY change: remove the entire dark gradient background and the vignette. The background must be FULLY TRANSPARENT with real alpha (no checkerboard drawn into the pixels, no colored backdrop, no glow haze, no floor shadow). Every pixel outside the character and her floating frames must be transparent, including the gaps between the hair, the wings and the tail. No text, no letters, no watermark, no frame around the whole image. Tall 2:3 vertical full-body composition.
```

### SP-1b — Plano B da sereia (molde canônico do dono, **sem anexar imagem**; usar só se SP-1 falhar 2×)

```
Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Detailed pixel-art CHARACTER, FULL BODY from head to tail tip, three-quarter view facing slightly toward the viewer, centered, fully isolated on a fully transparent background, no frame, no text. Clean bold BLACK OUTLINES around every shape, 32-bit era pixel art with noticeably more detail than a tiny sprite, cel shading with 2 to 3 tones per color, crisp pixels, no blur. The character is an adult fairy-mermaid hybrid NPC with a strong readable silhouette. CREATURE: an adult mermaid with teal skin, small fin-shaped ears, very long wavy coral-pink hair crowned with white flowers and pearl strands, large translucent lilac fairy wings (water and fairy elements with the essences of Tide and Glitter), and a long iridescent turquoise-and-white scaled fish tail ending in a huge flowing fin edged in gold; a calm, gentle, confident smile with open eyes, never laughing. PROFESSION: PAINTER, a dreamy sea-artist who paints the worlds she has seen — make the profession unmistakable through its outfit and props: a long paintbrush with a glowing turquoise tip in one hand, a small gold-framed painting of a floating castle island in the other, a wooden painter's palette dotted with colored seashells, a small pouch of brushes and rolled scrolls at the hip, and a few tiny gold-framed paintings floating around her on turquoise crystal pendants. She wears a white seashell bodice over a starry blue corset with pearl-and-gold chains. It belongs to a place that is a coral studio-grotto under the sea, so its body materials echo that place: pearl, shell, coral and sea glass. COLORS: coral-pink hair, teal skin, white pearl and shell, deep blue corset, gold frames and jewelry, lilac wings, turquoise-and-white tail, plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors. Tall 2:3 vertical full-body composition.
```

### LU2 — Burst de raios (anexar: `fx-luz-aura.png`)

```
Pixel-art game FX, a single radial burst of light rays, perfectly symmetrical around the exact center of the square canvas: 12 long tapering rays alternating neon cyan #6EFFFB and pale ink #E9F5F2, with 12 shorter rays of aged gold #D9A05B between them. The center is empty: a clean circle about 20 percent of the canvas width left completely empty for a creature to sit on. The ray tips end by breaking into a few separated single pixels, never by fading. Hard aliased edges, 1px near-black #061414 outline only on the longest rays. Chunky 16-bit pixel art, flat colors. No text, no letters, no creature, no ground. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no haze, no soft glow, no gradient, no blur, no drop shadow, no semi-transparent pixels. NO purple, NO pink, NO magenta. Square 1:1 composition.
```

### LU3 — Moldura do número (anexar: `habit-66.png`)

```
Pixel-art game UI, a single horizontal plaque frame, EMPTY inside: a rounded-rectangle frame made of carved teal stone #123232 with an aged copper-bronze #C98B4B border about 6 pixels thick (at 320x128 scale), small cyan #6EFFFB circuit-trace notches at the four corners and two tiny leaf tips curling over the top edge. The INSIDE is a flat, smooth, empty dark teal #0E2E2E rectangle with no content at all (numbers will be drawn later in code). The side borders must be simple and repeatable because the piece will be stretched. Hard aliased edges, 1px near-black #061414 outline, flat colors, chunky 16-bit pixel art. No text, no numbers, no creature. The frame is centered and fills about 90 percent of the canvas width. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no glow, no gradient, no drop shadow, no semi-transparent pixels. NO purple, NO pink, NO magenta. Wide 3:2 horizontal composition.
```

### LU1 — Banner "LEVEL UP" (anexar: `gain-levelup.png` + `perfect-day.png`). Única peça com texto: conferir letra por letra.

```
Pixel-art game title banner reading exactly the two words "LEVEL UP" and nothing else, in chunky 16-bit block letters: every letter clearly legible, evenly spaced, spelled L-E-V-E-L space U-P, no extra characters, no other words. Letters in aged gold #D9A05B with a lighter top edge #F0C987 and copper-bronze #8A5A2B underside shading, each letter outlined 2px near-black #061414. A thin carved copper rule above and below the word, with tiny circuit-trace notches at both ends. Flat colors, hard aliased edges, crisp pixels. The banner is centered and spans about 90 percent of the canvas width. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no glow, no gradient, no drop shadow, no soft haze, no semi-transparent pixels. NO purple, NO pink, NO magenta. Wide 3:2 horizontal composition.
```

### LU1-PT — Banner "NOVO NÍVEL" (só se o dono aprovar o par PT)

```
Pixel-art game title banner reading exactly the two words "NOVO NIVEL" and nothing else, in chunky 16-bit block letters: every letter clearly legible, evenly spaced, spelled N-O-V-O space N-I-V-E-L, no accents, no extra characters, no other words. Letters in aged gold #D9A05B with a lighter top edge #F0C987 and copper-bronze #8A5A2B underside shading, each letter outlined 2px near-black #061414. A thin carved copper rule above and below the word, with tiny circuit-trace notches at both ends. Flat colors, hard aliased edges, crisp pixels. The banner is centered and spans about 90 percent of the canvas width. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no glow, no gradient, no drop shadow, no soft haze, no semi-transparent pixels. NO purple, NO pink, NO magenta. Wide 3:2 horizontal composition.
```

### CAD-1 — Prédio do Caderno (anexar: `lote-exploracao-oficina-v3.png` + `lote-exploracao-caderno-campina.png`)

```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Detailed crisp 16-bit pixel art matching the attached reference buildings exactly in line weight, level of detail, scale and light: true isometric 2:1 angle, light from top-left, simple and bold shapes, about 16 colors. The building is a small WRITING STUDIO for a journal: a cozy inkwell-shaped cottage with a big quill pen leaning on its roof, a round window, a little writing desk visible at the window, a few rolled parchment scrolls stacked at the door, and a small hanging lantern. Built from its OWN WARM MATERIAL: ochre and amber plaster walls, light honey-colored wood beams, an ivory roof with a deep amber trim — warm tones only, NO dark values, NO green and NO teal as a dominant color, so it stands out clearly against a dark teal-green forest clearing. Only tiny accents of turquoise (#5FF3E0): one small soul crystal on the roof tip and the lantern flame. The base sits on packed bare earth (no wooden platform, no grass tile). Calm, arcane-nature mood, NOT steampunk: no gears, no top hat, no leather straps, no steam. Square 1:1 composition.
```

---

## 4. Conferência por peça (antes de instalar)

| Peça | Aceite |
|---|---|
| SR-1 | 4 canais, alfa 0 nas bordas, 0 px de xadrez/chroma, nenhum magenta/roxo (`r>g+40 && b>g+40` = 0), legível a 48–64 px, contorno azul-marinho, **sem texto**. Prévia em `#08191A` ao lado do `icon-trophy-gold`. |
| SP-1 / SP-1b | Mesma personagem do aprovado (cabelo, asas, cauda, pincel, paleta); **0 bolsão de fundo** entre cabelo, asas e cauda (checar alfa nos vãos); bbox, altura 1100, alfa binarizado em 128, RGB zerado onde alfa 0; **expressão calma**. Personagem adulta, vestido não mais revelador que o aprovado. |
| LU1 | Palavra grafada exatamente `LEVEL UP` (IA erra letra: reprovou, regera; 2 falhas = ficar no procedural). Sem glow/gradiente. |
| LU2 | Simétrico por rotação de 30° (girar 30° e subtrair: diferença desprezível); miolo livre; sem texto. |
| LU3 | Miolo liso e vazio; bordas laterais repetíveis (esticar 2× e ver se emenda). |
| CAD-1 | Folha de contato **sobre o fundo da Exploração** (`bg-exploracao.png`): o prédio tem de saltar do fundo; sem verde/teal dominante; chão a 74% da célula; 300² com alfa binário. |

## 5. Contagem

- **Prompts prontos para colar: 8** (SR-1, SP-1, SP-1b, LU1, LU1-PT, LU2, LU3, CAD-1). **Essenciais (pendentes de verdade): 2**, SR-1 e SP-1. **Opcionais:** LU1, LU2, LU3; LU1-PT e CAD-1 só se o dono quiser; SP-1b é reserva.
- **Gerações estimadas:** caminho mínimo **2** (SR-1 + SP-1); com os opcionais LU1/LU2/LU3 + CAD-1, **6**; com todos os 8 prompts, **8**. Somar margem de refazer (+50%; falhas típicas: xadrez assado/fundo opaco, letra errada no LU1): **~3 no mínimo, ~12 no máximo**. Nenhuma folha: cada peça é uma geração.

---

## 6. Cenários de conquista (CQ-01..CQ-14)

Os 6 cenários-prêmio existentes são `bg-mission-{filecity,infinity,coliseum,abyss,dinoland,aurora}` (`src/assets/backgrounds/`, pet-box **1200×648**, chão a **74%**, opacos, miniatura 96×52 em `backgrounds/thumbs/`). Todos P3, opacos (**sem transparência**).
**Referência a anexar em todos:** `src/assets/backgrounds/bg-mission-aurora.png` (mais dentro do tom da Home) + o irmão temático mais próximo (indicado em cada item). **Proporção:** ChatGPT gera 3:2 (1536×1024); recortar para 1200×648 (1,85:1) centrado e **conferir o chão a 74%** medindo à mão (o detector automático já errou); depois derivar a miniatura 96×52. Nunca anexar fundo pixelado demais. Para cada um: `bgReward` da missão = id novo, preço 300 como os demais (decisão do dono), fora do sorteio da masmorra.

#### CQ-01 — Chuva sob controle (mission-barrage-1000)
Destino: `src/assets/backgrounds/bg-mission-chuva.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a night sky over a calm stone plateau where glowing turquoise soul-raindrops fall in neat slow columns and are caught by floating crystal bowls, vines on carved pillars at both sides. Wide 3:2 horizontal composition, opaque.
```

#### CQ-02 — Fio da meada (mission-zip-10)
Destino: `src/assets/backgrounds/bg-mission-meada.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a quiet mossy workshop clearing where a single long glowing turquoise thread winds across the floor and between standing stones, spools of light on stone pedestals, vines and fireflies. Wide 3:2 horizontal composition, opaque.
```

#### CQ-03 — Colcha de retalhos (mission-patches-10)
Destino: `src/assets/backgrounds/bg-mission-colcha.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a meadow at dusk whose ground is a patchwork of differently colored soft fields stitched by glowing thin turquoise seams, a clothesline of cloth squares between two old trees, fireflies. Wide 3:2 horizontal composition, opaque.
```

#### CQ-04 — Corrida no Normal (mission-dino-normal-500)
Destino: `src/assets/backgrounds/bg-mission-corrida.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a long open path through a night valley of ferns and standing stones, faint carved distance markers, soft turquoise crystal lanterns along the way, calm sense of a track. Sibling reference: bg-mission-dinoland.png. Wide 3:2 horizontal composition, opaque.
```

#### CQ-05 — Campo de força (mission-dino-dash-30)
Destino: `src/assets/backgrounds/bg-mission-campo.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a stone arena path surrounded by a shimmering dome-like curtain of thin turquoise light rings (no solid shield, just drawn light), shattered stone chunks resting at the edges, crystals on the borders. Sibling reference: bg-mission-dinoland.png. Wide 3:2 horizontal composition, opaque.
```

#### CQ-06 — Mão de mestre (mission-ppt-normal-5)
Destino: `src/assets/backgrounds/bg-mission-mao.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a small round stone dueling plaza with three carved pedestals (a rounded stone, a flat leaf-like slab, and a pair of crossed crystal shards, no hands, no creatures), glowing cyan rune circle, vines, calm night. Wide 3:2 horizontal composition, opaque.
```

#### CQ-07 — Primeiros andares (mission-rogue-floors-3)
Destino: `src/assets/backgrounds/bg-mission-andares.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: the first levels of a gentle dungeon: a wide stone stair descending in soft steps, mossy walls, a few turquoise crystal torches, a small glowing doorway ahead. Sibling reference: bg-mission-abyss.png. Wide 3:2 horizontal composition, opaque.
```

#### CQ-08 — Fundo do Calabouço (mission-rogue-floors-15)
Destino: `src/assets/backgrounds/bg-mission-fundo.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: the deepest chamber of a dungeon: an enormous vine-covered stone hall with roots hanging from a high ceiling, a ring of large glowing turquoise crystals on the floor, cold deep teal light, calm not scary, no gore. Sibling reference: bg-mission-abyss.png. Wide 3:2 horizontal composition, opaque.
```

#### CQ-09 — Habitante da Fenda (mission-rift-runs-15)
Destino: `src/assets/backgrounds/bg-mission-habitante.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a rift cut into the air above a stone platform: a tall vertical crack of soft turquoise light with drifting crystal shards and vines growing along its edges, a worn path and small campfire-like turquoise brazier showing someone lives there. Wide 3:2 horizontal composition, opaque.
```

#### CQ-10 — Guardião da Fenda (mission-rift-kills-500)
Destino: `src/assets/backgrounds/bg-mission-guardiao.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a stone gate-plaza before a luminous turquoise rift, two tall carved guardian pillars with leaf crowns (empty, no statues of creatures), laurel vines, crystal braziers, a sense of watchfulness. Wide 3:2 horizontal composition, opaque.
```

#### CQ-11 — Cliente do clã (mission-clan-shop-3)
Destino: `src/assets/backgrounds/bg-mission-cliente.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a cozy market-stall courtyard at night, a vine-draped wooden counter with jars of glowing turquoise essence, hanging lanterns, banners with plain leaf patterns (no writing), flagstone floor. Wide 3:2 horizontal composition, opaque.
```

#### CQ-12 — Outro traço (mission-regen-1)
Destino: `src/assets/backgrounds/bg-mission-traco.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a mirror pond in a forest clearing reflecting a slightly different sky, soft turquoise glyph ripples, two stone paths forking, seeds and petals drifting, feeling of a new beginning. Wide 3:2 horizontal composition, opaque.
```

#### CQ-13 — Espaço preparado (mission-focus-prepared-10)
Destino: `src/assets/backgrounds/bg-mission-espaco.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a tidy small study nook inside a hollow tree: round desk of living wood, a single lit turquoise crystal lamp, neatly stacked scrolls and a small plant, warm calm light, night window with stars. Sibling reference: bg-mission-infinity.png. Wide 3:2 horizontal composition, opaque.
```

#### CQ-14 — Faixa de ouro (mission-rank-gold)
Destino: `src/assets/backgrounds/bg-mission-ouro.png` + entrada em `BACKGROUNDS` (`utils/backgrounds.ts`) e `bgReward` em `utils/missions.ts`.

```
Retro pixel art background, 16-bit era, WIDE HORIZONTAL BANNER composition. Arcane nature and ancient magic: deep petrol teal and near-black green as the base, glowing turquoise cyan as the strongest light, aged gold and moss green as accents, carved ancient stone, creeping vines and leaves, floating turquoise crystals. Mostly dark values with a few bright cyan light points, flat colors, chunky visible pixels, same style as the attached reference. No characters, no creatures, no text, no letters, no logos, no UI, no frame or border, no gears, no steam, no purple, no magenta, no pink. The floor line sits at exactly 74 percent of the image height, with clean empty continuous floor below it for a character to stand on, no black band. SCENE: a victory terrace on a hilltop at golden dusk, a carved gold-trimmed stone podium (empty), laurel vines, floating turquoise crystals, warm gold light against the teal base. Sibling reference: bg-mission-coliseum.png. Wide 3:2 horizontal composition, opaque.
```

**Contagem desta seção:** 14 prompts, 14 gerações (+50% de margem ≈ 21); um por conversa, sem folha (fundos opacos de resolução cheia). Conferir: 0 texto, 0 magenta/roxo (`r>g+40 && b>g+40`), chão a 74%, miolo calmo para o sprite.

---

## 7. Forja e Laboratório (arte nova, pedido de 28/10/2026)

> **Etiqueta: fila de geração (nada gerado).** Regras da §0 valem inteiras (alfa real nos prédios, proporção na última frase, sem texto, expressão calma, sem pixelização pós). Padrão 23/09: prédios = isométrico 2:1, luz de cima-esquerda, ~16 cores, 1024² reduzido *nearest* para **300²** (mesmo pós dos `lotes-v2`); fundo = 9:16 pintado denso como os `bg-*`, reduzido para **760×1344** (teto 400 KB; ver `orcamentoDeBytes.contract.test.ts`).
> **Contexto lido no código:** a Exploração hoje tem `passeio`, `oficina` (Focus Workshop), `caderno` (Journal), `refugio` e `preparar` (Prepare to Focus, arte provisória reusada); a Fenda Sem Fim já foi para a Arena. O Soulforge do pedido é o **Soulsmith** (`mercado:ferreiro`, NPC **Vitra**, hoje oficina de lava do domínio Fogo).
> **Tema A Forja:** industrial ARCANO, foco em produtividade e disciplina: bigornas, fornalhas de cristal, trilhos de pedra, oficinas com runas, metal escovado com detalhe turquesa `#5FF3E0`. **Proibido:** engrenagem, vapor, chaminé fumegante, cartola, couro/arreio, relógio, magenta/roxo. Sem robô/autômato gigante.
> **Integração (fora deste doc):** o mapa novo exige `AreaId 'forja'`, `FORJA_LOTS`, `LOT_ART_BOUNDS`, voz de NPC e mover os lotes; só depois de aprovar a arte.

### 7.1 Tabela-índice

Caminhos de arte abaixo: `A/` = `D:/Soulmon/repo/src/assets/soulmon/areas/`, `N/` = `D:/Soulmon/repo/src/assets/soulmon/npcs/`.

| ID | O que é | Tamanho no ChatGPT | Transparência | Destino no repo | Referências a anexar |
|---|---|---|---|---|---|
| **FJ-BG** | Fundo do mapa **A Forja** (9:16) com 4 plataformas livres para prédios + 1 vaga grande embaixo | 2:3 (1024×1536), cover para 760×1344 | Não (opaco) | `A/bg-forja.png` | `A/bg-mercado.png` (formato e densidade: 4 losangos de cobre sobre pedra petróleo) + `A/bg-exploracao.png` |
| **FJ-01** | Oficina do Foco (Focus Workshop; NPC Sépia, escriba-polvo) | 1:1 | Sim | `A/lote-forja-oficina.png` | `A/lote-exploracao-oficina-v3.png` (irmão) + `N/npc-exploracao-caderno.png` (Sépia) |
| **FJ-02** | Caderno (Journal; NPC Opala, geleia-fantasma arquivista) | 1:1 | Sim | `A/lote-forja-caderno.png` | `A/lote-exploracao-caderno-v3.png` + `N/npc-akasha-exploracao-caderno.png` (Opala) |
| **FJ-03** | Refúgio (NPC Marim, mensageiro da maré) | 1:1 | Sim | `A/lote-forja-refugio.png` | `A/lote-jogos-refugio.png` + `N/npc-oceano-jogos-refugio.png` (Marim) |
| **FJ-04** | Prepare to Focus (planejar a sessão e ganhar a chave do dia) | 1:1 | Sim | `A/lote-forja-preparar.png` | `A/lote-exploracao-oficina-v3.png` + `A/lote-mercado-ferreiro.png` |
| **FJ-05** | Soulforge / Soulsmith (NPC Vitra) | 1:1 | Sim | `A/lote-forja-soulsmith.png` (substitui `lote-mercado-ferreiro.png` quando o prédio mudar de mapa) | `A/lote-mercado-ferreiro.png` (atual) + `N/npc-mercado-ferreiro.png` (Vitra) |
| **LB-01** | Biblioteca, inspirada em **Lumi** (arraia-anfitriã azul-gelo e ouro, livro aberto) | 1:1 | Sim | `A/lote-laboratorio-biblioteca.png` (substitui `lote-hall-biblioteca.png`, 300²) | `A/lote-hall-biblioteca.png` (atual) + `N/npc-hall.png` (Lumi) |
| **LB-02** | Vínculo (Bond), inspirado em **Sumi** (koi-dragão: escamas laranja e marfim, folhas, lótus, fogo-d'água turquesa) | 1:1 | Sim | `A/lote-laboratorio-vinculo.png` (substitui `lote-laboratorio-stats.png`) | `A/lote-laboratorio-stats.png` + `N/npc-agua-laboratorio-stats.png` (Sumi) |
| **LB-03** | Centro de Evolução, inspirado em **Vesca** (alquimista-slime: verde-limão e violeta-escuro, coroa de galhos, óculos, jaleco, frascos) | 1:1 | Sim | `A/lote-laboratorio-evolucao.png` (substitui; 512²) | `A/lote-laboratorio-evolucao.png` + `N/npc-laboratorio.png` (Vesca) |

Referência global de estilo se desviar: `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/`.

**Cabeçalho comum dos prédios (FJ-01..05 e LB-01..03), colar antes do bloco específico:**

```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background (real alpha), no ground tile, no text, no letters, no numbers, no glow haze, no drop shadow outside its base. Detailed crisp 16-bit pixel art matching the attached reference building exactly in line weight, level of detail, scale and light: true isometric 2:1 angle, light from top-left, simple and bold shapes, about 16 colors. Calm arcane-nature mood, NOT steampunk: no gears, no steam, no chimney smoke, no top hat, no goggles, no leather straps, no clock. Only small accents of turquoise soul-crystal (#5FF3E0). The base sits on a flat stone footing.
```

### FJ-BG — Fundo de A Forja (anexar: `bg-mercado.png` + `bg-exploracao.png`)

```
Vertical full-bleed isometric pixel-art game map background, no text, no UI, no characters. Detailed crisp 16-bit pixel art, same density, camera angle and lighting as the attached reference map. An ARCANE INDUSTRIAL FORGE-VALLEY seen from above: dark slate-teal brushed-metal floor plates and rune-carved stone, long straight stone rails running between zones, crystal furnaces glowing soft turquoise (#5FF3E0) with warm amber embers inside, anvils carved from dark stone with turquoise runes, hanging crystal lanterns, vines and moss softly reclaiming the edges so nature and magic balance the industry. NOT steampunk: no gears, no steam, no smokestacks, no pipes with vapor, no top hats, no leather, no clocks, no giant robot. Layout exactly like the reference: four clean empty diamond-shaped stone platforms with brushed-metal trim (two upper, two lower, kept completely empty and flat so buildings can sit on them), one larger empty hexagonal stone plaza at the bottom center, a clear central walkway between them. Dark moody cave-forge atmosphere with deep teal shadows and a few amber highlights, no purple, no magenta. Vertical 2:3 composition.
```

### FJ-01 — Oficina do Foco (anexar: `lote-exploracao-oficina-v3.png` + `npc-exploracao-caderno.png`)

```
[cabeçalho comum]
The building is a FOCUS WORKSHOP, inspired by its keeper Sépia, a calm scribe-octopus with an owl-like face: a low round stone workshop with rune-carved walls, a wide brushed-metal workbench built into the front with a glowing turquoise crystal timer on a stone pedestal, a small crystal furnace glowing amber with turquoise runes, a rounded roof of overlapping curved stone petals like soft tentacle curves, and a few rolled parchment scrolls neatly stacked at the door. Discipline and steady rhythm: everything orderly and symmetrical. Materials: dark slate stone, brushed steel with turquoise inlay, deep warm teal and muted amber from the furnace. Square 1:1 composition.
```

### FJ-02 — Caderno (anexar: `lote-exploracao-caderno-v3.png` + `npc-akasha-exploracao-caderno.png`)

```
[cabeçalho comum]
The building is a JOURNAL SCRIPTORIUM, inspired by its keeper Opala, a gentle ghost-jelly archivist: a tall rounded stone scriptorium with a translucent crystal dome roof shaped like a soft jellyfish bell glowing pale turquoise, a giant open stone book with a brushed-metal spine forming the entrance, a large quill carved from a crystal shard standing beside it, rune-carved shelves of sealed books visible through arched windows, and a small stone writing desk at the door. Quiet, private, kept-safe feeling. Materials: pale slate and brushed silver metal, milky translucent crystal, soft warm lantern light. Square 1:1 composition.
```

### FJ-03 — Refúgio (anexar: `lote-jogos-refugio.png` + `npc-oceano-jogos-refugio.png`)

```
[cabeçalho comum]
The building is a REST HAVEN, inspired by its keeper Marim, a tide-courier sea creature: a rounded stone grotto-house built into a low crystal hill that is only softly warm, a small basin of still turquoise water at its foot with a stone rail-channel leading the water in and out like a calm tide, a round door with a woven reed awning, a curved brushed-metal bench, and a crystal lantern. Nothing urgent here: low, wide, restful silhouette. Materials: smooth slate stone, brushed metal with turquoise inlay, pale sand-colored accents. Square 1:1 composition.
```

### FJ-04 — Prepare to Focus (anexar: `lote-exploracao-oficina-v3.png` + `lote-mercado-ferreiro.png`)

```
[cabeçalho comum]
The building is a PLANNING HALL where a focus session is prepared and the key of the day is forged: a compact stone hall with a flat stone planning table on its roof terrace holding a glowing turquoise crystal map, a small crystal furnace in front where a single stone key is being shaped (the key glows turquoise, no text), a rail-track of carved stone leading from the door, and rune-lit wide steps. Orderly, calm, purposeful. Materials: dark slate, brushed steel, turquoise crystal, a touch of amber ember. Square 1:1 composition.
```

### FJ-05 — Soulforge / Soulsmith (anexar: `lote-mercado-ferreiro.png` + `npc-mercado-ferreiro.png`)

```
[cabeçalho comum]
The building is the SOULFORGE, the great forge of gear, inspired by its keeper Vitra, a calm salamander smith with a glowing amber lantern hat, dark scales veined with molten orange and a glass ladle staff: a wide stone forge-hall with a big crystal furnace at its heart glowing molten orange behind a rounded glass window, a large dark stone anvil with turquoise runes in the front yard, a stone trough of glowing liquid, rune-carved brushed-metal doors, and crystal lanterns. Warm molten orange and amber as the dominant glow against dark charcoal stone, copper only as small trim, turquoise soul-crystals as accents. No chimney smoke, no gears. Square 1:1 composition.
```

### LB-01 — Biblioteca (anexar: `lote-hall-biblioteca.png` + `npc-hall.png`)

```
[cabeçalho comum]
The building is the LIBRARY, inspired by its keeper Lumi, a friendly sky-blue manta-ray host with gold ornaments, a bow tie and an open starry book: a pale ice-blue and ivory pavilion with wide sweeping manta-wing roof eaves in soft translucent blue-white, gold trim and small gold-and-turquoise hanging orbs on the roof corners, a giant open book carved over the arched entrance with a star-sparkle emblem (no letters), a curved floating-feeling staircase, tall arched windows showing shelves. Welcoming and bright for a lab cave: pale blue, ivory, gold, turquoise. Square 1:1 composition.
```

### LB-02 — Vínculo (anexar: `lote-laboratorio-stats.png` + `npc-agua-laboratorio-stats.png`)

```
[cabeçalho comum]
The building is the BOND SANCTUM, inspired by its keeper Sumi, a wise koi-dragon with orange-and-ivory scales, green leaf mane, a lotus crown and a staff holding a turquoise water-flame: a sanctuary with a sweeping serpentine roof shaped like a koi-dragon body arching over the building, roof tiles in an overlapping orange and ivory scale pattern, a large lotus-shaped crystal finial on top, a small still turquoise pool wrapping the front with two koi-shaped stone bridges, jade-green leaf canopies and vine-wrapped wooden railings, a floating turquoise water-flame lantern at the door. Serene, ancient, patient. Colors: koi orange, ivory, jade green, deep teal-green wood, turquoise. Large and imposing silhouette. Square 1:1 composition.
```

### LB-03 — Centro de Evolução (anexar: `lote-laboratorio-evolucao.png` + `npc-laboratorio.png`)

```
[cabeçalho comum]
The building is the EVOLUTION CENTER, inspired by its keeper Vesca, a witty slime alchemist with lime-green and dark-violet body, a crown of twisting branches with a turquoise gem, round glasses and a cream lab coat: an organic alchemy lab-tower grown from twisted dark branches and cream plaster, with a big round bubbling glass flask-dome on top full of luminous lime-green slime and tiny floating turquoise crystals, branch-shaped roof beams with a few orange leaves, clean cute slime drips running down the walls (not gross), a cream canvas awning over the door, stacked parchment scrolls and test tubes visible at a window. Dark violet used only as a deep shadow tone inside the flask, never magenta. Square 1:1 composition.
```

### 7.2 Conferência e contagem

- **Aceite dos prédios:** 4 canais, alfa 0 nas bordas, 0 px de xadrez/chroma/magenta, chão a ~74% da célula, legível a 300², sem texto. Conferir sobre `bg-forja` (FJ) e sobre `bg-laboratorio.png` (LB) antes de instalar: o prédio tem de saltar do fundo. LB: o NPC tem de ser reconhecível pela cor e pelo material (Lumi azul-ouro, Sumi laranja-jade, Vesca verde-limão).
- **Aceite do fundo:** 4 losangos e 1 plaza realmente vazios e planos, 0 px de matiz 262–345 (roxo/magenta), WebP <= 400 KB.
- **Prompts prontos: 9** (FJ-BG, FJ-01..05, LB-01..03). **Gerações:** 9 no mínimo; com margem de refazer (+50%) ~14. Nenhuma folha.
- **Ordem sugerida:** FJ-BG primeiro (define a paleta da Forja), FJ-05, FJ-01/02/03/04, depois LB-03, LB-02, LB-01.

---

## 8. Hall e Arena (refazer no mesmo nível, pedido de 28/10/2026)

> **Etiqueta: fila de geração (nada gerado).** Mesmas regras da §0 e do cabeçalho comum da §7 (alfa real, proporção no fim, sem texto, sem steampunk). Cada prédio é **inspirado no NPC responsável**: anexar o retrato dele e traduzir cores, materiais e personalidade em arquitetura.
> **Estado do código lido em `D:/soulmon-wt-mapas` (commit `d35ea3d16`, #186):** `ARENA_LOTS` = `torneio`, `duelo` (Arena livre), `guerra`. A Fenda Sem Fim e o Calabouço/Masmorra **saíram** da Arena (a vaga de cima-esquerda fica livre). `HALL_LOTS` = `feira` (Missão), `grove`, `guilda` (rótulo "Salão do Clã"/"Clan Hall"). O Círculo de Amigos **não tem mais lote**: foi absorvido pelo Salão do Clã (e a Biblioteca segue no Laboratório, ver LB-01). No repo principal (`D:/Soulmon/repo`) o código ainda é o antigo (Fenda na Arena, Amigos no Laboratório): usar sempre a lista abaixo.
> **Caminhos:** `A/` = `D:/Soulmon/repo/src/assets/soulmon/areas/`, `N/` = `D:/Soulmon/repo/src/assets/soulmon/npcs/` (os mesmos arquivos existem em `D:/soulmon-wt-mapas/src/assets/soulmon/`). Prédios: 1024² reduzido *nearest* para **300²**, exceto onde indicado.
> **Conceito "prédio vivo" (lido na arte, `A/lote-arena-guerra.png`):** a Guerra de Clãs é um **colosso de pedra deitado**: o coliseu é o DORSO de uma criatura de rocha, com **olhos vermelhos brilhantes** num rosto de pedra, a **boca de presas de cristal como portão** (tapete vermelho saindo como língua), **patas de pedra com garras de cristal azul** nos cantos, **cristais crescendo nas costas como espinhos** e musgo/vinhas sobre o corpo. Ou seja: criatura + arquitetura fundidas, olhar e boca como entrada. **O dono GOSTA dos prédios atuais**: os prompts AR-xx são **reprodução fiel do prédio atual (anexado como âncora dominante) + o conceito vivo**, não redesign. Mantém composição, pódio/ringue, cores, tapete, bandeiras e tochas azuis; acrescenta uma criatura de pedra/cristal fundida na base e nos cantos, com olhos e uma entrada-boca, inspirada no NPC do prédio (cada um com a sua criatura, nunca a mesma da Guerra).
> **Cuidado de vibe:** sem gore, sem sangue, sem caveira gigante, sem magenta/rosa-choque; olhos brilhantes e presas de cristal, expressão firme e calma (guardião, não monstro).
> **Fundos com personalidade:** AR-BG e HL-BG espalham, **perto do lote de cada NPC**, os elementos, cores e motivos dele (ver prompts); as vagas dos prédios continuam VAZIAS.

### 8.1 Tabela-índice

| ID | O que é | Tamanho / proporção no ChatGPT | Transparência | Destino no repo | Referências a anexar |
|---|---|---|---|---|---|
| **AR-01** | Torneio VIVO (reprodução do atual + criatura-abutre de rocha fundida; NPC **Vultrak**) | 1:1, 300² | Sim | `A/lote-arena-torneio.png` (substitui) | `A/lote-arena-torneio.png` (atual, âncora) + `A/lote-arena-guerra.png` (exemplo do conceito vivo) + `N/npc-arena.png` (Vultrak) |
| **AR-02** | Arena livre VIVA (reprodução do atual + serpente de pedra fundida; `duelo`, NPC **Naia**) | 1:1, 300² | Sim | `A/lote-arena-duelo.png` (substitui) | `A/lote-arena-duelo.png` (atual, âncora) + `A/lote-arena-guerra.png` (conceito vivo) + `N/npc-extra-arena-duelo.png` (Naia) |
| **AR-03** | Guerra de Clãs: já é o prédio vivo de referência, **NÃO regerar** (prompt só de reserva; NPC **Mirevesper**) | 1:1, **512²** (a atual é 512²) | Sim | `A/lote-arena-guerra.png` (substitui) | `A/lote-arena-guerra.png` + `N/npc-arena-guerra.png` (Mirevesper) |
| **AR-BG** | Fundo da Arena 9:16 definitivo, com motivos de cada NPC perto da vaga dele (o atual `bg-arena.png` é provisório, 1269×1700; pendência #8 do `BACKLOG-CREDITOS.md`) | 2:3 (1024×1536), cover para 760×1344 | Não | `A/bg-arena.png` | `A/bg-arena.png` (layout dos dois tablados/quatro vagas) + `A/bg-mercado.png` (densidade) |
| **HL-01** | Salão do Clã (`guilda`; NPC **Aurea**, leoa solar; absorve o Círculo de Amigos, **Zumi**, filhote de mel) | 1:1, 300² | Sim | `A/lote-hall-guilda-luz.png` (substitui) | `A/lote-hall-guilda-luz.png` + `N/npc-luz-hall-guilda.png` (Aurea) + `N/npc-extra-filhote-de-mel.png` (Zumi, só para os detalhes de mel) |
| **HL-02** | Grove (NPC **Lilia**, musa-estátua de mármore com vinhas, flores e lira) | 1:1, **512²** (o atual é 512²) | Sim | `A/lote-hall-grove.png` (substitui) | `A/lote-hall-grove.png` + `N/npc-n-musa.png` (Lilia) |
| **HL-03** | Missão / Feira (`feira`; NPC **Fanfare**, criatura-tenda listrada turquesa e creme) | 1:1, 300² | Sim | `A/lote-arena-feira.png` (substitui; o arquivo mantém o nome da leva) | `A/lote-arena-feira.png` + `N/npc-arena-feira.png` (Fanfare) |
| **HL-BG** | Fundo do Hall 9:16 com motivos dos NPCs (**opcional**: o atual, `bg-hall.png`, é de 04/10 e tem 2 losangos em cima e 1 plaza embaixo, que servem aos 3 prédios; só refazer se o dono quiser o Hall no tom novo) | 2:3, cover para 760×1344 | Não | `A/bg-hall.png` | `A/bg-hall.png` + `A/bg-laboratorio.png` |

### Prompts (cada um usa o **cabeçalho comum da §7.1** antes do bloco)

### AR-01 — Torneio vivo (anexar: `lote-arena-torneio.png` como âncora dominante + `lote-arena-guerra.png` só como exemplo do conceito vivo + `npc-arena.png`)

```
[cabeçalho comum da §7.1]
Recreate this exact isometric building from the first attached image in full resolution, preserving precisely its composition, colors and details: the dark crystalline-lava rock mass, the golden crown with a turquoise crystal on top, the podium with three steps (plain shapes, no readable numbers), the red carpet stairs, the red banners, the blue crystal-flame braziers and the glowing red lava veins. This is a faithful reproduction of an already-approved design, not a new interpretation. Add ONLY the "living building" concept, as in the second attached image (a stone colossus whose body is the building): the whole rock mass is the back of a huge crouching bearded-vulture-shaped rock creature (inspired by its keeper Vultrak, a stern bearded-vulture arena master): two glowing amber eyes under a stone brow just above the red-carpet entrance, a hooked beak of dark stone forming the arch of the gate, folded stone-feather wings (layered dark slate plates edged with cream and orange feather-colored veins) wrapping both sides of the podium, and talons of dark crystal gripping the base corners. Firm, calm guardian expression, no gore. Square 1:1 composition.
```

### AR-02 — Arena livre viva (anexar: `lote-arena-duelo.png` como âncora dominante + `lote-arena-guerra.png` só como exemplo do conceito vivo + `npc-extra-arena-duelo.png`)

```
[cabeçalho comum da §7.1]
Recreate this exact isometric building from the first attached image in full resolution, preserving precisely its composition, colors and details: the round copper-and-teal fighting ring with rope railings, the crossed-swords emblem on the red floor, the corner posts with blue flames, the red carpet stairs, the red banner with crossed swords, the barrels and crates and the little red awning. This is a faithful reproduction of an already-approved design, not a new interpretation. Add ONLY the "living building" concept, as in the second attached image (a stone colossus whose body is the building): the ring base is the coiled body of a huge jade-green stone serpent-creature (inspired by its keeper Naia, a medusa net-fisher with a trident): scale-textured green stone coils wrap the lower walls, a calm serpent head of stone with glowing amber eyes rises at the front above the stairs with the entrance between its jaws (small crystal fangs), and a woven stone net is draped between two corner posts. Firm, calm guardian expression, no gore. Square 1:1 composition.
```

### AR-03 — Guerra de Clãs (já é o prédio vivo de referência: NÃO regerar; prompt só se quiser render novo; anexar `lote-arena-guerra.png` como âncora dominante)

```
[cabeçalho comum da §7.1]
Recreate this exact isometric building from the attached image in full resolution, preserving precisely its composition, colors and details: the purple-grey rock colossus lying down with glowing red eyes and a fanged mouth gate with a red carpet tongue, the blue crystal claws on its paws, the crystal spikes on its back, the circular coliseum on its back with red banners and blue-flame torches, and the mossy vines. This is a faithful reproduction of an already-approved design, not a new interpretation. Square 1:1 composition.
```

### AR-BG — Fundo da Arena com personalidade (anexar: `bg-arena.png` como âncora de layout + `bg-mercado.png`)

```
Recreate the attached arena map background (same vertical isometric composition, same dark teal stone floating platform with crystals and blue-flame pillars, same two flat empty platforms and stairway between them, kept completely empty so buildings can sit on them), as a vertical full-bleed 16-bit pixel-art game map with no text, no UI and no characters, but give it much more PERSONALITY by scattering each resident's motifs on the terrain NEAR the platform slot where its building will stand, as props around (never on) the empty platforms. Near the Tournament slot (lower platform, left): a perched bearded-vulture statue, loose orange-and-cream feathers, dark slate wing-shaped rocks and a laurel-wreath emblem on a stone slab, a warm lava glow in cracks. Near the Open Arena slot (lower platform, right): coils of jade-green scaled serpent-stone along the platform edge, fishing nets draped on posts with small bronze bells, a trident stuck in the rock, still water pools. Near the Clan War slot (upper platform): jagged stone claws and crystal spikes breaking out of the ground, chains and war-horn shapes, tattered teal and cream pennants on poles, a faint red glow. The turquoise crystals tie all zones together. Dark moody atmosphere, deep teal shadows, no gore, no purple or magenta, no steam, no gears, no giant robot. Vertical 2:3 composition.
```

### HL-01 — Salão do Clã (anexar: `lote-hall-guilda-luz.png` + `npc-luz-hall-guilda.png` + `npc-extra-filhote-de-mel.png`)

```
[cabeçalho comum da §7.1]
The building is the CLAN HALL, inspired by its keeper Aurea, a serene solar lioness priestess with a golden flame-like mane, sunflowers, white and orange robes and a sun-orb staff, and it also houses the friends' gathering room (a warm honey touch inspired by Zumi, a small honey cub): a grand welcoming hall in ivory and warm white stone with a gold-trimmed sun-disc crown on the roof, a golden sunflower garland around the entrance, a sun-orb finial with a turquoise crystal heart, a wide round gathering terrace in front with a ring of small stone seats around a campfire-bowl, and a few honeycomb-shaped amber windows and a small honey-colored banner. Safe, warm, communal, never a fortress. Materials: ivory stone, warm gold, soft orange, honey amber, small turquoise crystals. Square 1:1 composition.
```

### HL-02 — Grove (anexar: `lote-hall-grove.png` + `npc-n-musa.png`)

```
[cabeçalho comum da §7.1]
The building is the GROVE, inspired by its keeper Lilia, a calm garden muse with a marble-white statue-like body covered in moss, vines and flowers, a lily crown and a golden lyre: a crystal pavilion of white marble with carved flowing drapery columns wrapped in vines, white lilies and small pink and yellow flowers, a bird's-nest basket of blossoms on one pillar, a golden lyre shape worked into the arched entrance, and a young luminous tree growing in the middle under a glass-like turquoise-crystal canopy. Quiet, tender, in bloom. Materials: white veined marble, green moss and leaves, pastel flowers (soft pink and yellow, never magenta), gold, turquoise crystal. Square 1:1 composition.
```

### HL-03 — Missão / Feira (anexar: `lote-arena-feira.png` + `npc-arena-feira.png`)

```
[cabeçalho comum da §7.1]
The building is the MISSION FAIR, inspired by its keeper Fanfare, a cheerful striped tent-creature in teal and cream with a big open mouth, a jester-like peak, a gold bell and two paper-lantern poles: a big domed circus tent with teal and cream vertical stripes, a crooked jester-peak top with a small gold bell and a turquoise crystal, two tall poles with glowing round paper lanterns carrying a four-point star (no letters) on both sides of a wide round entrance, scalloped awning edges with hanging small crystal drops, and a red sash banner. Festive and inviting, set off by small sparkles. Materials: teal and cream cloth, gold trim, warm lantern glow, turquoise crystals. Square 1:1 composition.
```

### HL-BG — Fundo do Hall com personalidade (opcional; anexar: `bg-hall.png` como âncora de layout + `bg-laboratorio.png`)

```
Recreate the attached hall map background (same vertical isometric composition and the same flat empty platforms, kept completely empty so buildings can sit on them), as a vertical full-bleed 16-bit pixel-art game map with no text, no UI and no characters, with much more PERSONALITY by scattering each resident's motifs on the terrain NEAR the platform slot where its building will stand, as props around (never on) the empty platforms. Near the Clan Hall slot: golden sunflowers, small sun-disc stone carvings, honey-amber glowing crystals, a soft warm golden light from above, a few little honeycomb-shaped stones. Near the Grove slot: white marble statue fragments draped in moss and vines, white lilies, pastel pink and yellow flowers, a small lyre-shaped stone and a gentle stream. Near the Mission Fair slot: teal and cream striped pennant poles, round paper lanterns with four-point stars, a small golden bell on a post and sparkles. The turquoise crystals tie the zones together. Calm, warm, communal mood, not dark; no purple, no magenta, no steam, no gears. Vertical 2:3 composition.
```

### 8.2 Conferência e contagem

- **Aceite:** o da §7.2 (alfa real, 0 px de xadrez/chroma/magenta, chão a ~74% da célula, legível a 300², sem texto). Conferir cada prédio sobre o fundo do próprio mapa (`bg-arena`/`bg-hall`). O NPC tem de ser reconhecível na arquitetura (Vultrak osso+laranja, Naia verde-escama+bronze, Mirevesper marrom-bordô+osso, Aurea ouro-solar, Lilia mármore+flores, Fanfare listras turquesa).
- **Guerra e Grove são 512²** (já eram); **boxes de toque** em `areaLotGeometry.ts` (`LOT_ART_BOUNDS`) precisam ser remedidos pelo alfa depois de instalar, como nas levas anteriores.
- **AR-01/02 são reprodução + conceito vivo:** comparar lado a lado com o prédio atual (composição, cores e detalhes mantidos; só a criatura fundida é nova); reprovar redesign. AR-03 não se regera. **HL-01..03 (Hall) seguem o redesign inspirado no NPC** (o dono só pediu reprodução + vivo para a Arena).
- **Prompts: 8** (AR-01..03, AR-BG, HL-01..03, HL-BG); AR-03 é só reserva. **Gerações:** 6 (AR-01, AR-02, AR-BG, HL-01..03) + HL-BG opcional (~10 com margem de refazer).
