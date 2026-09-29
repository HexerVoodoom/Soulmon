# Prompts de arte — Área ARENA (o Anfiteatro dos Picos) + lote Feira

> Etiqueta: **plano** (só-prompts, 29/09/2026). Nada aqui foi gerado. O dono gera depois, com crédito no Higgsfield (`nano_banana_2_lite` sai com alfa real; peça única com alfa ruim → fundo `#00FF00` + `chroma-key.mjs`). Fontes: `00-BIBLIA-DAS-AREAS.md` §2.3, §3, §4.2, §5; `ASSETS-A-GERAR.md` §1; `PLANO-GUILDA.md` §9; `manual/04-IDENTIDADE-VISUAL.md`.
> Quem instala é `arte-instalador`, depois do `arte-conferente`. Este arquivo não toca `src/`.
> Fala do Fanfa e strings da Feira são da `/squad-narrativa`; aqui só a arte.

## 0. Regras que valem para todos os ativos

- **Nunca**: magenta, roxo, violeta, rosa; chama vermelha/laranja como energia; caveira, osso humano, lápide, ruína, folha seca, galho caído, cor desbotada; texto, letra, número, logotipo; mão humana; humano genérico; **barra de HP, barra de progresso ou número desenhados**; xadrez assado; aparelho v-pet ovalado.
- **Fenômeno da Feira = tempo da Malha** (névoa, maré, estática, enxame: camada que não assentou). **Nunca** a pilha de pendências de ninguém, nunca criatura com rosto, olho ou boca.
- **Feira é raid cooperativa**: nada aqui sugere duas guildas se enfrentando, placar, adversário com gente dentro, "campeão".
- Alfa real ou fundo sem alfa conforme o ativo; sem "transparent PNG" no prompt. Proporção no FIM do prompt.
- Pixel art só dentro do visor: nada aqui é botão, moldura de página ou ícone de sistema.
- Antes de gerar: conferir `src/assets/soulmon/areas/`, `npcs/`, `fx/` e `D:\Soulmon\_gemini_out\` (o que já existe pode servir de referência anexa).

## 1. ÂNCORA DE ESTILO DA ÁREA (copiar idêntica no início de TODO prompt)

```
AREA STYLE ANCHOR — ARENA, "the Amphitheater of the Peaks". Retro 16-bit pixel art, flat colors, chunky visible pixels with HARD aliased edges, 1px near-black outline (#061414), NO blur, NO soft glow, NO gradients, NO drop shadow, NO semi-transparent pixels, NO checkerboard. Shared kit: deep petrol teal background tones #0E2E2E / #123232, deep aged-copper hardware and trim #C98B4B with darker shading #8A5A2B, turquoise spark #6EFFFB as the ONLY living energy (small, few points), a little creeping vine over structure. AREA ACCENT: sandstone and bone #C8A878 with light bone #EFE3C2 highlights. Material: hewn stone blocks and cloth banners (petrol and bone striped or plain). Light: HIGH HARSH ZENITH SUN from straight above, very short hard dark shadows, the highest contrast and brightest values of any area in the game. Shape language: ANGULAR only — triangles, steps, sawtooth edges, pennant points, mast tips; no round domes. Open sky. FORBIDDEN colors: magenta, purple, violet, pink; red or orange fire as energy. Do not copy any existing franchise character or location.
```

Convenção de aceite comum ao `arte-conferente` (todos os ativos): varredura de matiz 270°–340° = 0 pixels; alfa real onde declarado (nenhum pixel "branco de folha" nas bordas, nenhum xadrez); contorno de 1 px; tamanho exato; **teste da silhueta**: peça toda preta sobre branco continua reconhecível; **teste do cinza**: reduzida a 64 px em escala de cinza, distinguível das outras áreas (Arena = a mais clara e de contraste mais alto, dente de serra).

---

## 2. Fundo da área (refeito)

### `bg-arena` — fundo definitivo da Arena
- **Família**: `cenario` (subtipo área). **Substitui** o provisório `src/assets/soulmon/areas/bg-arena.png` (mesmo kit de Mercado/Exploração: petróleo + cristal azul + tocha turquesa — **sem nada disso**).
- **Destino**: `src/assets/soulmon/areas/bg-arena.png` (gerar 768×1376 ou maior, entregar **760×1344**, 9:16, ≤ 400 KB após WebP). Sem alfa.
- **Vista**: isométrica de cima. Clareiras VAZIAS de chão plano onde os lotes pousam (centro de cada clareira em `left/top` de `areaSheetCopy.ts`): **Torneio 27%/55%** (clareira grande), **Duelo 70%/42%** (clareira média), **Feira 32%/82%** (clareira média-larga, a mais baixa). Trilhas de pedra ligando as três. Sem sprite, sem lote desenhado nas clareiras.
- **Prompt**:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
SCENE: an isometric top-down view of the flat summit of a sandstone peak, hewn open to the sky as an amphitheater. Sharp stepped terraces of sandstone blocks cut into the rock along the far edge in a half-moon sawtooth, a row of tall masts with small triangular pennants (petrol and bone cloth) along the rim, jagged rock spires and sheer cliff edges at the sides with hard black shadows, a few tiny turquoise spark points and a thin copper rail or vine on the blocks. THREE EMPTY FLAT CLEARINGS of bare packed sandstone floor, each with nothing on it: a large one at 27 percent from the left and 55 percent from the top, a medium one at 70 percent from the left and 42 percent from the top, a medium-wide one at 32 percent from the left and 82 percent from the top; narrow carved stone paths connect them. The sky is open at the top edge, pale bone and teal, a few flat pixel clouds, no sun disc. This must read as the BRIGHTEST and highest-contrast place: light sandstone floor, deep black hard shadows. No characters, no creatures, no buildings on the clearings, no circus tent, no crystals in the floor, no torches, no text, no logos, no UI, no frame, no border. TALL VERTICAL PORTRAIT 9:16, full-bleed composition.
```
- **negative**: `magenta, purple, violet, pink, dark cave, torch, blue crystal cluster, market stalls, crane, floating islands, mist, skull, bones, tombstone, ruin, text, letters, numbers, logo, UI, frame, border, checkerboard, blur, soft glow, gradient, characters, creatures, buildings on the clearings`
- **Seeds**: 4 imagens, seeds diferentes, conversa nova por variação. Escolher a que tiver (1) as três clareiras planas e vazias nas posições certas (medir a olho sobre grade 27/55, 70/42, 32/82 — tolerância ±4 pp), (2) maior valor médio e contraste, (3) dente de serra visível. Recolocar a clareira com a imagem anexada se a posição errar ("same scene, move clearing").
- **Aceite**: cinza a 64 px ao lado de `bg-mercado`, `bg-exploracao`, `bg-jogos` novos: Arena é a mais clara e mais contrastada; silhueta preta do topo mostra degraus + mastros em dente de serra; sem cristal azul, sem tocha; sem xadrez; 760×1344; peso ≤ 400 KB.

---

## 3. Lotes (3) — `lote-arena-<loteId>`

Comum: **alfa real**, gerar **768²**, recortar **300²**; centro da BASE no centro-inferior do quadro (é o ponto que `left/top` posiciona); sombra de contato dura inclusa (bloco escuro achatado, não gradiente); fundo do prompt: `PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind` → chroma-key. Proporção no fim: `Square 1:1 full-bleed composition.` Destino em `src/assets/soulmon/areas/`, mapa `areas/index.ts` (`TORNEIO_LOT_ART`/`DUELO_LOT_ART`; o da Feira substitui `GUILDA_LOT_ART` da Arena, id **`feira`**, nunca `guilda`).

Negative comum aos lotes: `magenta, purple, violet, pink, text, letters, numbers, logo, human hand, human figure, skull, bones, tombstone, ruin, blur, soft glow, gradient, drop shadow, checkerboard, white background, ground plane, frame, UI`

### `lote-arena-torneio` — Coliseu em meia-lua
- **Tipo**: lote · `cenario`/lote · 768² → 300² · tamanho relativo **1,0** (cabe inteiro, sem folga).
- **Prompt**:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: one isometric building, a HALF-MOON COLISEUM with a stepped stone grandstand (sandstone blocks, sawtooth silhouette), open arena floor in front, and exactly FIVE small triangular pennants on five masts along the rim, each a different flat cloth shade from pale bone to deep petrol (five ranks), a thin copper trim and a few turquoise spark pixels. Sun from straight above, hard short shadows. The base of the building is centered at the bottom-center of the frame, with a hard flat contact shadow. Do not copy any existing franchise character or building. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
- **Seeds**: 3 imagens. Escolher a com exatamente 5 flâmulas contáveis e meia-lua dentada; base centrada.
- **Aceite**: silhueta preta = meia-lua dentada única entre os 16 lotes; 5 flâmulas contáveis a 100%; alfa limpo (sem franja verde); 300².

### `lote-arena-duelo` — Ringue baixo quadrado
- **Tipo**: lote · 768² → 300² · tamanho **0,7** (baixo e largo).
- **Prompt**:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: one isometric low square fighting ring, a raised flat stone platform with FOUR identical short corner posts of hewn sandstone (angular caps) joined by thick rope in three strands, and on the floor of the ring TWO chalk circles facing each other, bone white. Low and wide, no roof, no seats. Small copper rope-clamps, one turquoise spark pixel on a post. Sun from straight above, hard short shadows. Base centered at the bottom-center of the frame, hard flat contact shadow. Do not copy any existing franchise character or building. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
- **Seeds**: 3 imagens. Escolher a com 4 postes iguais visíveis e os 2 círculos de giz nítidos.
- **Aceite**: silhueta preta = quadrado baixo com quatro pontas iguais, sem cobertura (distinto do Torneio e da tenda); 2 círculos legíveis; alfa limpo.

### `lote-arena-feira` — Tenda-cúpula de circo
- **Tipo**: lote · 768² → 300² · tamanho **0,9**. Substitui o placeholder (= conquistas).
- **Prompt**:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: one isometric circus-style DOME TENT of striped canvas in petrol and bone stripes, a tall central mast with a small pennant on top, and radial festive bunting lines running from the mast tip down to the tent's rim (the ropes must clearly start at the top of the dome), small paper-style lanterns hanging from the bunting, lit with tiny turquoise points; copper ring at the rim, an open front flap showing dark petrol inside. Cheerful, communal, no banner text, no signs. Cloth points are angular pennants. Sun from straight above, hard short shadows. Base centered at the bottom-center of the frame, hard flat contact shadow. Do not copy any existing franchise character or building. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
- **negative adicional**: `red and white circus stripes, clown, animals, ticket booth, ferris wheel, fire`
- **Seeds**: 4 imagens (é a peça mais propensa a virar "circo clichê"). Escolher a com cordas partindo do TOPO da cúpula e listras petróleo/osso, lanternas visíveis.
- **Aceite**: silhueta preta = a única CÚPULA com cordas partindo do topo; sem listras vermelhas; sem texto; lê como "praça de encontro", não como duelo.

---

## 4. NPCs (3) — bustos

Comum: **768²**, alfa real, contorno preto de 1 px, busto da cintura para cima, olhando 3/4 para a **esquerda** (fala à direita). Fundo `#00FF00` + chroma-key. Criatura própria do universo (nunca humano), sem sufixo "-mon". Cláusula obrigatória no prompt: `Do not copy any existing franchise character.` Destino `src/assets/soulmon/npcs/`; mapa `npcs/index.ts` › `LOT_NPC_ART`; voz em `LOT_NPC_VOICE` (`areaNpcVoice.ts`, dono único). Proporção no fim: `Square 1:1 full-bleed composition.`

Negative comum: `magenta, purple, violet, pink, human, human hands, skull, bones, text, letters, numbers, logo, weapon dripping blood, blur, soft glow, gradient, drop shadow, checkerboard, white background, background scenery, frame`

### `npc-arena-feira` — Fanfa (assume a Feira)
- **Tipo**: NPC busto · arena:feira · criatura-sanfona.
**Prompt — 1ª tentativa (`imagePrompt` do oráculo, envolvido pela âncora da área)**
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): stretching and closing its bellows, puffing out a small breath of turquoise sparks. EXPRESSION: festive and communal.
CREATURE (oracle, npcs-oraculo-saida.md › Fanfa, seed 29092027, imagePrompt):
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: accordion creature whose body is a bellows of petrol and bone striped canvas, a friendly mouth in the middle, long thin arms carrying small paper lanterns. a pint-sized simple shape. Flat pale gray-blue and silver-lining colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
**Prompt — 2ª tentativa, se o provedor recusar (`imagePromptFallback`, sem referências de gênero)**
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): stretching and closing its bellows, puffing out a small breath of turquoise sparks. EXPRESSION: festive and communal.
CREATURE (oracle, npcs-oraculo-saida.md › Fanfa, seed 29092027, imagePromptFallback):
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: accordion creature whose body is a bellows of petrol and bone striped canvas, a friendly mouth in the middle, long thin arms carrying small paper lanterns. a pint-sized simple shape. Flat pale gray-blue and silver-lining colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
- **Seeds**: 4 imagens. Escolher: fole listrado legível, boca no centro do fole, ≥1 lanterna nos braços, cabe nos 3/4 à esquerda; nada de rosto humano.
- **Aceite**: silhueta preta = fole com pregas + braços com lanterna, distinta de Vultrak e Rinoco; alfa limpo; paleta ligada à tenda (`lote-arena-feira`).

### `npc-arena-duelo` — Rinoco
- **Tipo**: NPC busto · arena:duelo · rinoceronte-bípede (arte falta; hoje placeholder).
**Prompt — 1ª tentativa (`imagePrompt` do oráculo, envolvido pela âncora da área)**
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): knocking its horn against a ring post. EXPRESSION: good-natured, laughing as if it was just hit and liked it.
CREATURE (oracle, npcs-oraculo-saida.md › Rinoco, seed 29092026, imagePrompt):
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: stocky bipedal rhinoceros with sandstone hide, a horn of chipped stone with a thin turquoise vein, a bone cloth headband and a good-natured grin. small and simple with a big head. Flat clay-red and sandstone colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
**Prompt — 2ª tentativa, se o provedor recusar (`imagePromptFallback`, sem referências de gênero)**
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
NPC BUST FORMAT (overrides the sprite format inside the CREATURE block): waist-up bust, three-quarter view facing LEFT, 768x768, on a PURE SOLID GREEN #00FF00 background, 1px near-black outline, hard pixel edges. Ignore "16x16", "transparent background" and the tiny-size words of the CREATURE block: the creature fills the bust frame. The palette and FORBIDDEN list of the area anchor win over the creature colors where they conflict.
POSE (bible §4.2): knocking its horn against a ring post. EXPRESSION: good-natured, laughing as if it was just hit and liked it.
CREATURE (oracle, npcs-oraculo-saida.md › Rinoco, seed 29092026, imagePromptFallback):
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: stocky bipedal rhinoceros with sandstone hide, a horn of chipped stone with a thin turquoise vein, a bone cloth headband and a good-natured grin. small and simple with a big head. Flat clay-red and sandstone colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
Square 1:1 full-bleed composition.
```
- **Seeds**: 3 imagens. Escolher: chifre com veio turquesa legível, sorriso, sem armas, sem sangue.
- **Aceite**: silhueta preta = massa larga + chifre de pedra; destacável de Fanfa (fole) e de Vultrak; 768² alfa.

### `npc-arena` — Vultrak (repintura de acento; nome e fala não mudam)
- **Tipo**: NPC busto · arena:torneio · **anexar o `npc-arena.png` atual** e pedir reprodução fiel com acento arenito. Mantém o nome de arquivo `npc-arena.png` (anfitrião).
- **Prompt**:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached character faithfully, same design, same pose, same proportions, at full resolution; this is a faithful reproduction of an approved design, not a new interpretation. Only change: shift the dominant accent color of its armor, cloth and trim toward sandstone and bone #C8A878 / #EFE3C2, keep copper trim and the turquoise spark, remove any purple, magenta, pink or red. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
- **Seeds**: 2 imagens. Escolher a mais fiel ao original (mesma silhueta) com o acento trocado.
- **Aceite**: silhueta preta idêntica à atual (comparar sobreposição); matiz 270°–340° = 0; acento arenito visível.

---

## 5. O fenômeno da Feira: 4 tipos × 3 estados = 12 sprites

> **Decisão do dono, 29/09/2026:** um sprite próprio por tipo (eram 1 genérico de lajes × 3 estados; **+9 ativos**). Ids finais: `fair-fenomeno-<tipo>-<estado>`, tipo em `nevoa|mare|estatica|enxame`, estado em `aberto|ferido|dissipado`. O tipo da semana vem do servidor (`raid.phenomenon`); o estado, da faixa `hpBand` (lógica do cliente, a arte não a desenha). **Código futuro (não feito aqui):** `FAIR_ART` em `src/utils/fairArt.ts` passa de `fair-fenomeno-<estado>` para um mapa por tipo×estado.

Comum: **"tempo da Malha", uma camada que não assentou** (névoa, maré, estática, enxame). **Sem rosto, sem olho, sem boca, sem inimigo, sem barra de HP, sem número; sem magenta, roxo, rosa.** Cada tipo tem **silhueta e material próprios** (ver cada bloco) e a mesma âncora de estilo da Arena (§1). Os estados `ferido` e `dissipado` são gerados **anexando o `aberto` aprovado do MESMO tipo** ("same object, now …"), mesma escala (±5%) e mesma silhueta-base.
- **Família**: `criatura`/objeto de cena (sprite), **384² alfa, nearest**, sobre `#00FF00` + chroma-key. Destino `src/assets/soulmon/arena/fair-fenomeno-<tipo>-<estado>.png`.
- **Ordem**: gerar primeiro os 4 `aberto` (escolher 1 de cada), depois `ferido` e `dissipado` de cada tipo anexando o aberto. **Teste entre tipos:** os 4 `aberto` em silhueta preta lado a lado devem ser distintos (massa com fendas · onda em camadas · lajes e faíscas retas · nuvem de pontos), e em cinza a 64 px distintos dos lotes.
- **Negative comum**: `face, eyes, mouth, creature, monster, enemy, boss, health bar, progress bar, numbers, letters, text, skull, bones, ruin, dead leaves, fallen branch, wilted, faded, magenta, purple, violet, pink, red, fire, blur, soft glow, gradient, semi-transparent, checkerboard, white background, ground`
- Proporção no fim de cada prompt: `Square 1:1 full-bleed composition.`
- **Estados (vale para os 4 tipos):** `aberto` = inteiro, cheio, no auge; `ferido` = a roda já o abalou: mais aberto, mais leve, mais luz turquesa entre as partes, **nunca** queimado, sangrado, quebrado em ruína; `dissipado` = assentou e se desfez com calma: poucas peças pequenas em repouso e motas subindo, **cor NÃO desbotada** (mesma saturação do aberto), sem entulho.

### 5.1 Névoa — `fair-fenomeno-nevoa-{aberto,ferido,dissipado}`
Massa de vapor em camadas de degraus chapados (bordas em dente de serra, dithering de pixel nas bordas), **fendas turquesa** entre as camadas; tons petróleo-claro e osso, nunca branco puro.

`aberto`:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: an original weather-phenomenon made solid, a large low MASS OF MIST built from about six stacked flat stepped layers of pale teal and bone vapor with jagged sawtooth edges and chunky dithered pixel borders, dark petrol-teal #123232 core between layers, thin glowing turquoise #6EFFFB CRACKS running through the mass, a few tiny turquoise motes drifting off it. Intact, dense and full, readable from far away. NO face, NO eyes, NO mouth, NOT a creature, NOT a cloud with a smile. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`ferido` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached mist mass faithfully, same layers, same scale, same style, at full resolution, and change only its state: it is now LOOSENED. The layers have parted, two or three vapor bands drift away from the core and hang apart, the turquoise cracks are wider and brighter, the mass looks lighter and thinner, calm, not burnt, not damaged, not ruined. No face, no eyes, no mouth, not a creature. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`dissipado` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached mist mass's style faithfully, and change only its state: it has SETTLED and come undone. Only three thin flat bands of pale teal and bone vapor lie low and calm along the ground, with a handful of tiny turquoise motes rising gently above them. Peaceful and resolved, colors as saturated as the original, no debris, no ruins. No face, no eyes, no mouth, not a creature. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
Aceite (3): silhueta = massa de camadas horizontais com fendas; sem rosto nem "nuvem fofa"; `ferido` mais aberto e `dissipado` baixo e horizontal; mesma escala; 0 pixels em 270°-340°; alfa limpo.

### 5.2 Maré — `fair-fenomeno-mare-{aberto,ferido,dissipado}`
Onda e arrasto de água **em camadas**: cristas angulares em dente de serra empilhadas, linha de espuma osso em pixels quadrados, corpo petróleo com crista turquesa. Sem barco, peixe, gente.

`aberto`:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: an original weather-phenomenon made solid, a tall TIDE built from three layered angular wave bodies of deep petrol-teal water stacked behind each other, each with a sawtooth crest edged in turquoise #6EFFFB and a bone #EFE3C2 foam line of chunky square pixels, a long dragging undertow band at the base, a few turquoise droplets in the air. Intact, towering and full. NO face, NO eyes, NO mouth, NOT a creature, no boat, no fish. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`ferido` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached tide faithfully, same layered waves, same scale, same style, at full resolution, and change only its state: it is now LOOSENED. The wave layers are lower and drawn apart, the front crest has broken into a few separate angular water pieces drifting off, gaps between layers show turquoise light, calmer and lighter, not destroyed, not foamy chaos. No face, no eyes, no mouth, not a creature, no boat, no fish. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`dissipado` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached tide's style faithfully, and change only its state: it has SETTLED. Only one low flat sheet of calm petrol-teal water lies along the ground with a thin bone foam line and a few turquoise droplets rising gently. Peaceful and resolved, colors as saturated as the original, no wreckage. No face, no eyes, no mouth, not a creature, no boat, no fish. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
Aceite (3): silhueta = ondas em camadas com dente de serra, distinta da névoa; sem barco/peixe; estados legíveis em silhueta; escala igual; alfa limpo.

### 5.3 Estática — `fair-fenomeno-estatica-{aberto,ferido,dissipado}`
**Lajes e faíscas geométricas, sem rosto**: blocos retangulares de pixel em petróleo escuro, osso e turquesa, rasgos de linha de varredura deslocados, blocos de cobre. Reprova automática se sair magenta (o glitch tende a isso).

`aberto`:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: an original weather-phenomenon made solid, a dense STATIC-NOISE mass built from hard rectangular slabs and chunky square pixel blocks in near-black teal #123232, bone #EFE3C2 and turquoise #6EFFFB, a few copper #C98B4B blocks, thin horizontal scanline tears displaced sideways through it, small angular turquoise sparks flicking off the edges. Geometric, angular, intact and full. Only teal, bone, turquoise and copper: no magenta, no red, no purple. NO face, NO eyes, NO mouth, NOT a screen with a face, NOT a creature. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`ferido` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached static mass faithfully, same slabs, same scale, same style, at full resolution, and change only its state: it is now LOOSENED. Several slabs and pixel blocks have drifted apart from the core with wider gaps, the scanline tears are wider, more turquoise light shows through, fewer blocks remain in the core, lighter and calmer, not burnt, not broken into ruins. Only teal, bone, turquoise, copper. No face, no eyes, no mouth, not a creature. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`dissipado` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached static mass's style faithfully, and change only its state: it has SETTLED. Only about six small rectangular slabs lie flat and neatly aligned in a low row on the ground, with a few tiny turquoise sparks rising gently. Peaceful and resolved, colors as saturated as the original, no debris, no ruins. Only teal, bone, turquoise, copper. No face, no eyes, no mouth, not a creature. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
Aceite (3): silhueta = blocos retos e rasgos horizontais, distinta de névoa e maré; **0 pixels em 270°-340°**; sem rosto de TV/tela; estados legíveis; alfa limpo.

### 5.4 Enxame — `fair-fenomeno-enxame-{aberto,ferido,dissipado}`
**Massa de pontos em movimento, e NÃO inseto**: dezenas de motas abstratas de 3 a 5 px numa espiral densa. ⚠️ **Risco do aceite ("enxame que vire inseto"):** sem asa, antena, olho, corpo segmentado, perna, nem pares simétricos; se algum ponto ler como abelha/mosca/pássaro, reprova. Nenhum ponto maior que os outros (um ponto grande vira "cabeça").

`aberto`:
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
OBJECT: an original weather-phenomenon made solid, a dense SWARM OF MOTES: about sixty tiny abstract angular motes, each 3 to 5 pixels in turquoise #6EFFFB, bone #EFE3C2 or copper #C98B4B with a 1px dark outline, all nearly the same size, drifting together in a thick spiral cloud, densest at the center and thinning at the arms, a few dark petrol #123232 motes mixed in for depth. They are only motes of light and dust: NOT insects, NOT bees, NOT birds, NOT animals, no wings, no legs, no antennae, no eyes, no faces, no larger body inside. Intact, dense, full. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`ferido` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached swarm of motes faithfully, same mote size, same style, same scale, at full resolution, and change only its state: it is now LOOSENED. The spiral has thinned and opened, fewer motes in the center, some motes drifted away in loose strands with wide gaps, calmer and lighter, not scattered into chaos. Still only abstract motes: no wings, no legs, no antennae, no eyes, no faces, not insects, not animals. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
`dissipado` (anexar o `aberto`):
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Recreate the attached swarm's mote style faithfully, and change only its state: it has SETTLED. Only about a dozen motes rest calmly in a small low loose ring, a few more rising gently above. Peaceful and resolved, colors as saturated as the original. Still only abstract motes: no wings, no legs, no antennae, no eyes, no faces, not insects, not animals. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background, nothing else behind. Square 1:1 full-bleed composition.
```
Aceite (3): silhueta = nuvem de pontos em espiral, distinta dos outros três; **nenhum ponto lê como inseto, ave ou olho** (pareidolia reprova); densidades `aberto` > `ferido` > `dissipado` legíveis; alfa limpo; distinto de `fx-sparkle`.

**Seeds (os 12):** `aberto` 4 imagens por tipo, `ferido` e `dissipado` 3 por tipo = **40 imagens** para os 12 sprites. Escolher o `aberto` que passa no teste entre tipos e sem traço de rosto/inseto; sobrepor `aberto`/`ferido`/`dissipado` de cada tipo a 50% para conferir escala.

---

## 6. FX da Feira (4) — `fx-fair-*`

Família `fx`, **128² alfa**, **rotação semanal** (o servidor sorteia `phenomenonId`), sobre o visor, **sem sprite de inimigo, sem criatura, sem pé/bota**. Fenômeno = tempo da Malha. Comum: camada de efeito estática (movimento reduzido mostra o mesmo quadro), gerada sobre `#00FF00` + chroma-key; mesmo estilo do bloco [SPRITE]; cores restritas ao kit (petróleo, ciano, cobre, osso); nada semitransparente (a "névoa" é feita de pixel chapado em degraus, dithering em xadrez de pixel de 2 px é permitido como TEXTURA de arte, mas o arquivo final não pode ter xadrez de fundo). Destino `src/assets/soulmon/fx/fx-fair-<id>.png`; mapa: chave `'fair:<id>'` em `fxArt.ts` (a chave por emoji do `Popup.icon` **não muda**; é o save). Proporção no fim: `Square 1:1 full-bleed composition.`

Negative comum: `creature, monster, enemy, face, eyes, boot, foot, hand, character, health bar, numbers, letters, text, skull, bones, dead leaves, ruin, fire, red, magenta, purple, violet, pink, blur, soft glow, gradient, semi-transparent, checkerboard, white background, ground, frame`

**Momento no jogo (para o `INSTALAR.md`)**: sala da Feira, camada do fenômeno da semana, atrás/ao redor do sprite `fair-fenomeno-<tipo>-<estado>` do mesmo tipo (o FX continua; decisão do dono 29/09/2026 só multiplicou os sprites); sem chamada hoje até `FeiraSheet` existir (WPG-10): "instalar junto com a sala".

### `fx-fair-nevoa` — névoa
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Pixel-art FX only, no creature: three horizontal drifting bands of MIST drawn as flat stepped pixel shapes in pale bone #EFE3C2 and pale teal, with jagged angular edges, dithered at the edges, a few tiny turquoise #6EFFFB spark pixels caught inside, all floating on the chroma green background, filling a 128 pixel square. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background. Square 1:1 full-bleed composition.
```
Aceite: lê "névoa" sem contorno de nuvem fofa; sem rosto/animal; a peça não é "pálida demais" (se sair branca, trocar o SUJEITO: bandas mais escuras petróleo com bordas osso, não a cor).

### `fx-fair-mare` — maré alta
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Pixel-art FX only, no creature: a tall angular TIDE-WAVE crest drawn as flat stepped pixel shapes in deep petrol teal with turquoise #6EFFFB crest edge and a bone #EFE3C2 foam line made of chunky square pixels, sawtooth crest, a few floating turquoise motes, on the chroma green background, filling a 128 pixel square. No boat, no fish, no person. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background. Square 1:1 full-bleed composition.
```
Aceite: onda angular (dente de serra), sem barco/peixe.

### `fx-fair-estatica` — estática
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Pixel-art FX only, no creature: a cluster of STATIC NOISE and glitch lines, chunky square pixel blocks in near-black teal, bone #EFE3C2 and turquoise #6EFFFB scattered in a rough disc, several thin horizontal scanline tears displaced sideways, a couple of copper #C98B4B blocks, all on the chroma green background, filling a 128 pixel square. Only teal, bone, turquoise and copper — no magenta, no red, no purple. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background. Square 1:1 full-bleed composition.
```
Aceite: 0 pixels em 270°–340° (o glitch tende a sair magenta — reprova automática); sem rosto de TV; sem texto.

### `fx-fair-enxame` — enxame
```
[AREA STYLE ANCHOR — copiar o bloco da §1 aqui, idêntico]
Pixel-art FX only: a SWARM of about twenty tiny abstract motes, each a 3 to 5 pixel angular mote in turquoise #6EFFFB, bone #EFE3C2 or copper #C98B4B with a 1px dark outline, drifting together in a loose spiral cloud, denser in the center. They are only light-motes, NOT insects, NOT birds, NOT animals, no wings, no eyes, no faces, on the chroma green background, filling a 128 pixel square. Do not copy any existing franchise character. PURE SOLID CHROMA GREEN #00FF00 background. Square 1:1 full-bleed composition.
```
Aceite: sem asa/olho/inseto legível (motas abstratas); silhueta = nuvem em espiral; distinto de `fx-sparkle`.

**Seeds (os 4)**: 3 imagens cada. Escolher a que (1) diferencia os quatro em silhueta preta lado a lado (bandas horizontais · crista de onda · disco de ruído · espiral de motas), (2) tem contraste sobre o petróleo do visor `#071413` (medir por pixel, não a olho), (3) não é pálida. Entregar folha de contato `_sheet.png` com os 4 sobre o fundo do visor.

---

## 7. Tabela

| id | tipo | nº de imagens estimado | prioridade |
|---|---|---|---|
| `bg-arena` | fundo de área (cenario) | 4 | P1 |
| `lote-arena-torneio` | lote | 3 | P2 |
| `lote-arena-duelo` | lote | 3 | P2 |
| `lote-arena-feira` | lote | 4 | P1 |
| `npc-arena-feira` (Fanfa) | NPC busto | 4 | P1 |
| `npc-arena-duelo` (Rinoco) | NPC busto | 3 | P2 |
| `npc-arena` (Vultrak, repintura) | NPC busto | 2 | P3 |
| `fair-fenomeno-nevoa-aberto` | sprite do fenômeno (névoa) | 4 | P1 |
| `fair-fenomeno-nevoa-ferido` | sprite do fenômeno (névoa) | 3 | P1 |
| `fair-fenomeno-nevoa-dissipado` | sprite do fenômeno (névoa) | 3 | P1 |
| `fair-fenomeno-mare-aberto` | sprite do fenômeno (maré) | 4 | P1 |
| `fair-fenomeno-mare-ferido` | sprite do fenômeno (maré) | 3 | P1 |
| `fair-fenomeno-mare-dissipado` | sprite do fenômeno (maré) | 3 | P1 |
| `fair-fenomeno-estatica-aberto` | sprite do fenômeno (estática) | 4 | P1 |
| `fair-fenomeno-estatica-ferido` | sprite do fenômeno (estática) | 3 | P1 |
| `fair-fenomeno-estatica-dissipado` | sprite do fenômeno (estática) | 3 | P1 |
| `fair-fenomeno-enxame-aberto` | sprite do fenômeno (enxame) | 4 | P1 |
| `fair-fenomeno-enxame-ferido` | sprite do fenômeno (enxame) | 3 | P1 |
| `fair-fenomeno-enxame-dissipado` | sprite do fenômeno (enxame) | 3 | P1 |
| `fx-fair-nevoa` | fx | 3 | P2 |
| `fx-fair-mare` | fx | 3 | P2 |
| `fx-fair-estatica` | fx | 3 | P2 |
| `fx-fair-enxame` | fx | 3 | P2 |

**Total: 23 ativos, ~75 imagens** (eram 14 ativos e ~45 antes da decisão do dono de 29/09/2026: 12 sprites de fenômeno em vez de 3, +9 ativos, +30 imagens; mais retentativas: teto de ~100). Ordem sugerida: `bg-arena` → Fanfa + `lote-arena-feira` + 4 `aberto` de fenômeno, depois `ferido`/`dissipado` (a Feira é a porta da Guilda, WPG-10) → Torneio/Duelo/Rinoco → FX → Vultrak.

## 8. Decisões que ficam com o dono / observações

- **Posição do lote Feira**: os prompts assumem o `left/top` atual do `guilda` da Arena (32%/82%). Se `ArenaLotId` `'feira'` mudar a posição, refazer só a clareira de `bg-arena`.
- **Fenômeno: um sprite por tipo (decidido pelo dono em 29/09/2026)**: 4 tipos × 3 estados = 12 sprites (eram 3 genéricos, +9 ativos). Pendência de código, fora deste arquivo: `FAIR_ART` (`src/utils/fairArt.ts`) precisa de mapa por tipo×estado.
- `PLACEHOLDER_NPC_ART.poring` / `npc-placeholder-poring.png` sai do bundle quando Rinoco chegar (A3 da bíblia): ninguém aponta mais para ele; renomear enquanto isso é do instalador.
- Falas de Fanfa e strings da Feira: `soulmon-copy-redator`; nenhuma cita contribuição individual.
