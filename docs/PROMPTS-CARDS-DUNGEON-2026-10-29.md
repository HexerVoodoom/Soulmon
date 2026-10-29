# Prompts ChatGPT — cards de arte do Calabouço (29/10/2026)

> **Etiqueta: fila de geração (nada gerado, nada instalado).** Regras gerais: `PROMPTS-CHATGPT-2026-10-28.md` §0 (canal ChatGPT desktop, uma conversa por peça, referência por clique-direito > Paste, proporção na ÚLTIMA frase, sem texto, sem pixelização, vibe arcano+natureza, sem engrenagem/vapor/couro, **sem magenta/roxo/rosa**, padrão 23/09). Fluxo pós-geração: `arte-conferente` > `arte-instalador`.

## 1. Inventário (o que o jogador vê)

O Calabouço roguelike diário é `src/components/RogueDungeon.tsx` (mapa em tela cheia, 3 andares, `data-rogue-card`). A Fenda Sem Fim (`DungeonGame.tsx`) é descida automática: **não tem cards de escolha, salas ou eventos** (só cenas de fundo já existentes). Lógica: `src/utils/rogueDungeon.ts` / `rogueDungeonSave.ts` (`PATH_KINDS`, `BONUS_KINDS`). Não existem tipos de sala "elite/boss/loja/descanso/tesouro" no código; o "tesouro" é só o ícone do andar 3.

| ID | Card | PT / EN | Onde renderiza | Visual hoje | Slot alvo |
|---|---|---|---|---|---|
| C1 | `combat` | Combate / Combat | RogueDungeon `paths` (linha ~312); também ícone do cabeçalho do desafio | glifo Material `swords` 32px | card 96-150 x min 132 (retrato ~3:4) |
| C2 | `puzzle` | Quebra-cabeça / Puzzle | idem | glifo `grid_view` | idem |
| C3 | `minigame` | Minigame / Minigame | idem | glifo `casino` | idem |
| C4 | `explore` | Prova de mente / Mind trial | idem | glifo `psychology` | idem |
| B1 | `power` | +6% de ataque / +6% attack | `bonuses` (linha ~307) | `dungeon-rogue/bonus-ataque.png` 96² (arte P2-02) | ícone 32²; card igual aos caminhos |
| B2 | `vigor` | +10% de vida / +10% health | idem | `bonus-vida.png` 96² | idem |
| B3 | `heal` | Proteção de cura / Healing ward | idem | `bonus-aura-escudo.png` 96² | idem |
| F1 | andar 1 | Andar 1 / Floor 1 | nó do mapa (`FLOOR_ICON_ART`) | `icones-ui/masmorra-porta.png` (provisório) | 56² no mapa |
| F2 | andar 2 | Andar 2 / Floor 2 | idem | `masmorra-escada.png` (provisório) | 56² |
| F3 | andar 3 | Andar 3 / Floor 3 | idem | `masmorra-bau-fechado.png` (provisório) | 56² |

Total: **10 cards** (4 caminhos + 3 bônus + 3 andares). Os 9 `bonus-*.png` sem bônus no jogo ficam como estoque (não gerar).

## 2. Decisões de forma (conjunto coerente)

- **Cards C1-C4 e B1-B3 (7 peças):** ilustração de carta **retrato 2:3 (1024x1536)**, redução *nearest* para **300x450** (cobre o slot ~150x200 em 2x). Cena única centrada sobre **fundo opaco verde-azulado escuro** (#0B2A2C a #08191A, tom do app), com uma **borda fina cobre/ouro envelhecido de 2 px** nos 4 lados (mesma borda em todas: é o "quadro" do conjunto) e cantos levemente arredondados. Sem texto, sem número, sem etiqueta: o rótulo continua sendo texto do app. Luz de acento ciano #5FF3E0 em cada cena (assinatura do mundo).
- **Andares F1-F3 (3 peças):** ícone **1:1 (1024x1024)**, **alfa real**, reduzido *nearest* para 112² (2x do slot 56²), sem a moldura de carta (são nós do mapa).
- Os 4 caminhos usam cenas distintas; cada um tem **cor dominante própria** (combate = âmbar-terra, quebra-cabeça = musgo, minigame = dourado-quente, prova de mente = azul-névoa), todas dentro de teal/natureza, nada roxo.

## 3. Referências a anexar (existentes no repo)

- **Estilo/paleta de cena:** `src/assets/soulmon/bg/dungeon-rogue-fork.png` (a bifurcação do Calabouço) e `src/assets/soulmon/bg/dungeon-rogue-andar-1.png`.
- **Nível de detalhe do ícone:** `src/assets/soulmon/dungeon-rogue/bonus-ataque.png` (B1-B3 e F1-F3).
- **Andares:** anexar o ícone provisório correspondente de `src/assets/soulmon/icones-ui/` (porta, escada, baú) como base de forma.
- Se o ChatGPT desviar de estilo: `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/`.

## 4. Índice

| ID | Proporção ChatGPT | Alfa | Anexar | Destino no repo | Slot/resolvedor a ligar |
|---|---|---|---|---|---|
| C1 | 2:3 | não | `dungeon-rogue-fork.png` | `src/assets/soulmon/dungeon-rogue/cards/card-combate.png` | **precisa de slot**: novo `src/utils/rogueCardArt.ts` (espelho de `rogueBonusArt.ts`, `import.meta.glob('.../cards/card-*.png')`) + `RogueDungeon.tsx` troca `<Icon name={PATH_COPY[p].icon}>` por `<img>` quando existir |
| C2 | 2:3 | não | idem | `.../cards/card-quebra-cabeca.png` | idem (chave `puzzle`) |
| C3 | 2:3 | não | idem | `.../cards/card-minigame.png` | idem (chave `minigame`) |
| C4 | 2:3 | não | idem | `.../cards/card-prova-de-mente.png` | idem (chave `explore`) |
| B1 | 2:3 | não | `dungeon-rogue-fork.png` + `bonus-ataque.png` | `.../cards/card-bonus-ataque.png` | `rogueCardArt.ts` (chave `power`); `BonusIcon` segue como fallback |
| B2 | 2:3 | não | + `bonus-vida.png` | `.../cards/card-bonus-vida.png` | chave `vigor` |
| B3 | 2:3 | não | + `bonus-aura-escudo.png` | `.../cards/card-bonus-cura.png` | chave `heal` |
| F1 | 1:1 | **sim** | `masmorra-porta.png` | `src/assets/soulmon/icones-ui/masmorra-porta.png` (substitui) | já ligado: import de `floorDoor` / `FLOOR_ICON_ART[1]` |
| F2 | 1:1 | **sim** | `masmorra-escada.png` | `.../masmorra-escada.png` (substitui) | `FLOOR_ICON_ART[2]` |
| F3 | 1:1 | **sim** | `masmorra-bau-fechado.png` | `.../masmorra-bau-fechado.png` (substitui) | `FLOOR_ICON_ART[3]` |

Ao instalar: `CACHE_VERSION` em `public/sw.js`, `npx vitest run` conferindo `Test Files`, commit por caminho, linha em `INVENTARIO-ASSETS.md`. Alfa dos F: conferir com Pillow (`python -I`), 0 px de chroma, nunca prévia em magenta/verde.

## 5. Prompts

### C1 — Combate (anexar `dungeon-rogue-fork.png`)

```
Pixel-art game card illustration, same crisp 16-bit style, flat cel shading with 3 tones per material and dark navy 1px outlines as the attached dungeon scene. Subject: a small guardian beast of living stone and moss rearing up in a dark cave clearing, one clawed foreleg raised mid-strike, thin amber light cracks across its body, a few turquoise #5FF3E0 sparks at its chest. Mood: tense but calm, arcane nature, NOT steampunk, no gears, no steam, no leather straps. Dominant palette: earthy amber and dark moss on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### C2 — Quebra-cabeça (anexar `dungeon-rogue-fork.png`)

```
Pixel-art game card illustration, same crisp 16-bit style, flat cel shading with 3 tones per material and dark navy 1px outlines as the attached dungeon scene. Subject: a mossy stone pedestal in a quiet cave holding a glowing grid of nine carved rune tiles (abstract leaf and wave shapes, no letters), two tiles slightly out of place, vines growing between them, a small turquoise #5FF3E0 light on the tile that fits. Mood: calm, thoughtful, arcane nature, NOT steampunk, no gears. Dominant palette: soft moss green and stone grey on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### C3 — Minigame (anexar `dungeon-rogue-fork.png`)

```
Pixel-art game card illustration, same crisp 16-bit style, flat cel shading with 3 tones per material and dark navy 1px outlines as the attached dungeon scene. Subject: a playful scene of three polished river stones with simple glowing symbols (a leaf, a wave, a flame, no letters) tumbling in the air above a small mossy ledge, tiny warm gold sparkles, a turquoise #5FF3E0 glint on the middle stone, a feeling of a quick lucky game. Mood: light and cheerful but calm, arcane nature, NOT steampunk, no gears, no dice with numbers. Dominant palette: warm gold and cream on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### C4 — Prova de mente (anexar `dungeon-rogue-fork.png`)

```
Pixel-art game card illustration, same crisp 16-bit style, flat cel shading with 3 tones per material and dark navy 1px outlines as the attached dungeon scene. Subject: a still underground pool in a cave reflecting a ring of five softly glowing crystal stones floating in a circle above the water, ripples spreading, a faint mist, one stone brighter in turquoise #5FF3E0 as if remembered. Mood: serene, meditative, memory and focus, arcane nature, NOT steampunk, no gears, no clocks. Dominant palette: misty blue and pale cyan on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### B1 — Bônus de ataque (anexar `dungeon-rogue-fork.png` + `bonus-ataque.png`)

```
Pixel-art game card illustration, same crisp 16-bit style and same iconography as the attached bonus icon, scene lighting as the attached dungeon scene. Subject: a curved bone-white claw-blade of crystal growing from a mossy stone, wrapped in a ribbon of amber energy that flares upward, a few turquoise #5FF3E0 sparks, a sense of striking harder. Arcane nature, NOT steampunk, no gears, no leather. Dominant palette: amber and cream on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### B2 — Bônus de vida (anexar `dungeon-rogue-fork.png` + `bonus-vida.png`)

```
Pixel-art game card illustration, same crisp 16-bit style and same iconography as the attached bonus icon, scene lighting as the attached dungeon scene. Subject: a small ancient tree sprouting from a cave floor, its trunk swelling into a root bulb, fresh green leaves unfurling and a warm coral-red glowing fruit at the center, turquoise #5FF3E0 motes drifting up, a sense of more vitality. Arcane nature, NOT steampunk, no gears. Dominant palette: fresh green and soft coral-red on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### B3 — Proteção de cura (anexar `dungeon-rogue-fork.png` + `bonus-aura-escudo.png`)

```
Pixel-art game card illustration, same crisp 16-bit style and same iconography as the attached bonus icon, scene lighting as the attached dungeon scene. Subject: a translucent round shield of woven light and tiny leaves hovering above a glowing spring of water, soft white-gold healing particles rising through it, turquoise #5FF3E0 rim light, a sense of gentle protection before the next fight. Arcane nature, NOT steampunk, no gears. Dominant palette: soft gold-white and turquoise on a deep teal-green background (#0B2A2C to #08191A), fully opaque. A thin 2 px aged copper-gold border runs around all four edges of the card, slightly rounded corners, nothing else as frame. No text, no letters, no numbers, no watermark. NO purple, NO pink, NO magenta. Tall 2:3 vertical card composition.
```

### F1 — Andar 1: porta (anexar `masmorra-porta.png`)

```
Pixel-art game map-node icon, same style and level of detail as the attached door icon. Subject: an arched wooden door set into a mossy stone wall, with a small turquoise #5FF3E0 lantern glowing beside it and a few vines over the frame, welcoming and calm, arcane nature, NOT steampunk, no gears, no iron straps. 16-bit pixel art, crisp hard edges, flat cel shading, dark navy 1px outline. The object is centered and fills about 80 percent of the canvas. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no ground, no drop shadow, no glow halo. No text, no letters, no frame. NO purple, NO pink, NO magenta. Square 1:1 composition.
```

### F2 — Andar 2: escada (anexar `masmorra-escada.png`)

```
Pixel-art game map-node icon, same style and level of detail as the attached stairs icon. Subject: a short spiral of carved stone steps descending into a dark opening, moss and small glowing turquoise #5FF3E0 mushrooms along the edges, roots framing the top, a sense of going deeper, arcane nature, NOT steampunk, no gears, no metal railings. 16-bit pixel art, crisp hard edges, flat cel shading, dark navy 1px outline. The object is centered and fills about 80 percent of the canvas. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no ground, no drop shadow, no glow halo. No text, no letters, no frame. NO purple, NO pink, NO magenta. Square 1:1 composition.
```

### F3 — Andar 3: baú do tesouro (anexar `masmorra-bau-fechado.png`)

```
Pixel-art game map-node icon, same style and level of detail as the attached closed chest icon. Subject: a closed treasure chest of dark carved wood and aged copper-gold bands covered in small leaf engravings, a turquoise #5FF3E0 crystal set into the lock, a few golden sparkles above the lid, final-reward feeling, arcane nature, NOT steampunk, no gears, no leather straps. 16-bit pixel art, crisp hard edges, flat cel shading, dark navy 1px outline. The object is centered and fills about 80 percent of the canvas. The background must be FULLY TRANSPARENT with real alpha: no checkerboard, no ground, no drop shadow, no glow halo. No text, no letters, no frame. NO purple, NO pink, NO magenta. Square 1:1 composition.
```
