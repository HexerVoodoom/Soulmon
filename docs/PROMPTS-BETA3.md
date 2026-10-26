# Prompts da 1.3.0-beta3 (Higgsfield) — arte dos itens novos do dono

Escrito em 25/10/2026 pela squad de arte. Base: padrão aprovado de 23/09 (`PROMPTS-HIGGSFIELD-2026-09-23.md`), molde de NPC de 30/09 e a regra de transparência real. Contexto dos itens: `BACKLOG-BETA3.md` (rodadas 1 e 2) + pedido novo do dono (Soul Barrage, Dungeon/Endless Rift, Prepare to Focus, Zip/Patches, área digital, ranking).

## 0. Resumo

| | |
|---|---|
| Itens novos cobertos | Soul Barrage · Dash do Obstacle Run · Dungeon (roguelike) · Endless Rift · Prepare to Focus · Mind Workshop (Zip, Patches) · área do Soulmon digital · ranking |
| Assets existentes reaproveitados | **36 entradas verificadas** (cada linha da §2 existe no disco; as 4 famílias de FX por elemento valem 154 arquivos cada) |
| Prompts novos | **19** — **9 P1** (bloqueiam o lançamento) + **10 P2** (provisório aceitável) |
| Peças geradas | 4 prédios (P1-01, P1-02, P2-01, P2-07), 3 NPCs (P1-03, P1-04, P2-08), 3 folhas de ícone/glifo (P1-08, P1-09, P2-02), 3 folhas de sprite (P1-06, P1-07, P2-09), 6 fundos 9:16 (P1-05, P2-03..06, P2-10) |
| Zip e Patches | **0 prompt** (decisão da squad: ícone de card de jogo é Material, ver §2.7) |

**Custo estimado.** Medido nas memórias: `gpt_image_2` 1k = 0,5 low / 2 medium / **4 high** cr; `gpt_image_2_5 --variant flare` 1k high ≈ **3,3 cr**; `nano_banana_pro` 2k = 2 cr. **O custo do `gpt_image_2` 2k high NÃO está registrado em nenhum doc** — o padrão de 23/09 é 2k/high. Estimativa (suposição, medir na 1ª geração e corrigir aqui):

| Cenário | P1 (9) | P2 (10) | Total (19) |
|---|---|---|---|
| `gpt_image_2` 1k high (4 cr, medido) | 36 cr | 40 cr | **76 cr** |
| flare 1k high (3,3 cr, medido) | 30 cr | 33 cr | **63 cr** |
| `gpt_image_2` 2k high (padrão 23/09; ~2x do 1k, suposição) | ~72 cr | ~80 cr | **~152 cr** |

Somar +50% de margem para refazer (fundo opaco/névoa em folha transparente é a falha mais comum). Saldo de referência: 176 cr em 18/10 (`ASSETS-A-GERAR.md` §579) — **o P1 inteiro cabe com folga; o P2 também, no cenário 1k**. Pipeline de execução: `higgsfield-navegador-api-pipeline.md` (Clerk token, até 10 jobs em paralelo, ~13 img/min).

## 1. Regras que valem para TODO prompt abaixo (não reescrever)

1. **Receita de 23/09**: `gpt_image_2`, 2k, `high`, **uma** imagem de referência do próprio projeto (irmão aprovado); NPC **sem** imagem, só o molde de texto. Cadeia: folha para explorar → avulso 1:1 com a escolhida como âncora.
2. **Transparência real**: `--background transparent` (alfa de verdade), **nunca chroma**. Se o `gpt_image_2` transparente falhar, trocar para `gpt_image_2_5 --variant flare --background transparent --quality high --resolution 1k` (funcionou em 30/09; binarizar alfa 250–254). Conferir cada PNG (4 canais, `a0%`, 0 px de chroma) e passar `scripts-arte/limpar-alfa.mjs` (só arredonda, não é chroma). Prévia/conferência em xadrez ou `#08191A`, **nunca magenta/verde**.
3. **Fundos** (cenários 9:16) saem opacos: sem `--background transparent`.
4. **Proporção pedida no fim do prompt** (última frase = `Tall 9:16 vertical composition.` / `True isometric 2:1 angle…` / grade explícita), como no padrão de 23/09.
5. **NPC** = molde de 30/09 inteiro (cabeçalho fixo, BUST ONLY, contornos pretos, `CREATURE / PROFESSION / It belongs to a place… / COLORS`, cristais `#5FF3E0` como assinatura) + só o que sobrou de 30/09: **sem cartola/goggles/arreio/cinto/bolsinhas, cobre como detalhe, expressão calma**. Híbridos (≥3 criaturas misturadas, ≥2 elementos de 2º/3º nível), a maioria dark; só 2–3 fofos por lote, no máx. 1 cogumelo. Cor única por criatura e pixelização pós-processo estão **revogadas** (14/10): não aplicar.
6. **Prédio** = versão final aprovada de 23/09 ("SIMPLE AND BOLD", olhos simples, ~16 cores, vivo tipo Trent de Legend of Mana, isométrico 2:1, luz top-left, `no gears/top hat/leather straps`), corpo na cor natural do material, turquesa só nos cristais e chamas.
7. **Vibe**: arcano + natureza, tech só traço; **nada de steampunk** (engrenagem, vapor, couro, cartola). Fundos: tom da Home, nem claustrofóbico nem diurno, sem robô gigante, sem gore/caveira.
8. Referências **nunca** pixeladas demais/reprovadas e **nunca** Grom/Vultrak. Sprites pequenos usados como ref: ampliar com NEAREST até ≥300 px por lado (mínimo do Higgsfield).
9. Opcional no navegador: anexar ao FIM do prompt a tag do Element `@prop_soul` (`<<<7935a6eb-3ce2-403f-a575-cc1088aeecf7>>>`) — o dono mandou usar em lote; **para reprodução fiel** anexar a imagem original.
10. Instalar: `scripts-arte/fatiar-alfa.mjs` nas folhas (linhas por projeção), reduzir para o tamanho alvo, não mover asset antes de `grep -r` no basename (armadilha da varredura rasa), registrar em `INVENTARIO-ASSETS.md`.

## 2. O que JÁ dá para usar (todos verificados no disco em 25/10/2026)

Caminhos relativos a `src/assets/soulmon/` salvo indicação. Material = subset de 107 ícones em `src/styles/tokens.md` (nome fora do inventário **não renderiza, falha silenciosa**).

### 2.1 Soul Barrage (bullet hell vertical)

| # | Uso | Asset existente |
|---|---|---|
| 1 | Tiro ranged do Soulmon por elemento | `fx-ataque/fx-<elemento>-orb.png` (128², 154 arquivos, todos os elementos do Class System incl. os 18 de 1º nível: agua ar arcano eletricidade espaco fogo gravidade luz marcial morte neutro som sombra tempo terra vida vigor vileza) |
| 2 | Impacto do tiro no inimigo | `fx-ataque/fx-<elemento>-impact.png` (128², 154) |
| 3 | Bocal/disparo ao atirar | `fx-ataque/fx-<elemento>-cast.png` (128², 154) |
| 4 | Escudo/defendido | `fx-ataque/fx-<elemento>-defended.png` · `fx/fx-shield.png` |
| 5 | Inimigos grandes/chefes (provisório) | `bosses/boss-*.png` (25 · 512²; ex. `bosses/boss-cuprex.png`) |
| 6 | Inimigos pequenos (provisório, nunca o do jogador) | `novos/<linha>-rookie.png` (17 · 256²; ex. `novos/agua-rookie.png`) |
| 7 | Fundo rolável (provisório até o P1-05) | `bg/minigame-dino.png` (1080×1920) · `bg/dungeon-6.png` … `bg/dungeon-10.png` (1080×1920) |
| 8 | Acerto/derrota/faísca | `fx/fx-hit.png` · `fx/fx-defeat.png` · `fx/fx-corrida-faisca-1.png` · `fx/fx-corrida-estilhaco-1.png` |
| 9 | HUD de vida/energia | `icones-ui/hp.png` · `icones-ui/energia.png` |

### 2.2 Dash do Obstacle Run

| # | Uso | Asset existente |
|---|---|---|
| 10 | Sprite do dash = ataque FÍSICO do elemento | `fx-ataque/fx-<elemento>-slash.png` (128², 154; ex. `fx-ataque/fx-agua-slash.png`) |
| 11 | Rastro/impulso | `fx/move-speed-lines.png` · `fx/move-dust-puff.png` · `fx/move-jump-arc.png` |
| 12 | Obstáculo destruído | `fx/fx-corrida-estilhaco-1.png` (+ 2–4 e `-sheet`) · `dino/dino-obstacle-1.png` (+ variantes b/c, 2–4) |
| 13 | Carga do dash (indicador provisório) | `icones-ui/interacao/status-raio.png` |
| 14 | Chão e parallax | `dino/dino-ground-strip.png` · `dino/dino-parallax-far.png` |

### 2.3 Dungeon (roguelike) e Endless Rift

| # | Uso | Asset existente |
|---|---|---|
| 15 | Prédio da **Endless Rift** (= a masmorra atual, mantém enquanto o P2-01 não sai) | `areas/lote-exploracao-masmorra.png` (300²) · `icons/games/icon-game-dungeon.png` (só ref; Material no app) |
| 16 | Espírito/mascote da masmorra | `dungeon-spirit.png` (128²) |
| 17 | Porta, escada, baú (nós) | `icones-ui/masmorra-porta.png` · `icones-ui/masmorra-escada.png` · `icones-ui/masmorra-bau-fechado.png` · `icones-ui/masmorra-bau-aberto.png` (96²) |
| 18 | Recompensa/bônus escolhido | `icones-ui/interacao/recompensa-bau-fechado.png` · `…/recompensa-estrela.png` · `…/recompensa-gema.png` · `…/recompensa-presente.png` |
| 19 | Bloqueado/liberado | `icones-ui/interacao/status-cadeado.png` · `…/status-cadeado-aberto.png` |
| 20 | Ícones de bônus (provisório até o P2-02) | `combate-v3/status/st-buff-atk.png` · `st-escudo.png` · `st-hot.png` (+ 5 outros `st-*`) · `combate-v3/arvore/talent-node-available.png` / `-bought.png` / `-locked.png` |
| 21 | Fundos de andar/caminho (provisório até P2-03…06) | `bg/dungeon-interior-forja.png` · `…-templo.png` · `…-bazar.png` · `…-biblioteca.png` · `…-taverna.png` · `…-laboratorio-estufa.png` (6 · 608×1080) · `bg/dungeon-1.png`…`dungeon-5.png` |
| 22 | Tipos de nó no provisório (Material, já no subset) | `swords` (combate) · `psychology` (quebra-cabeça) · `casino` (minigame) · `inventory_2` (ferramenta/recurso) · `lock` / `lock_open` · `task_alt` |
| 23 | Prêmio do topo do ranking mensal | `icones-ui/moeda-creditos.png` · `icones-ui/moeda-bits.png` · `emblems/dungeon-10.png` |

### 2.4 Prepare to Focus (prédio novo + chave)

| # | Uso | Asset existente |
|---|---|---|
| 24 | Prédio irmão e ref de estilo (Focus Workshop) | `areas/lote-exploracao-oficina-v3.png` (512²) · `areas/lote-exploracao-oficina.png` |
| 25 | NPC provisório (o do Focus Workshop) | `npcs/npc-exploracao-oficina.png` (768²) |
| 26 | A **CHAVE** que libera o Focus Workshop | `icones-ui/interacao/recompensa-chave.png` · `fx/gain-focus-seal.png` (selo de foco) |
| 27 | Preparação (ícones de atividade) | `icones-ui/interacao/ativ-foco-bloco-25min.png` · `…/ativ-foco-celular-fora.png` · `…/ativ-foco-uma-tarefa-por-vez.png` · `…/ativ-sono-preparar-quarto.png` |

### 2.5 Mind Workshop (Zip, Patches) e ranking

| # | Uso | Asset existente |
|---|---|---|
| 28 | Prédio, NPC e fundos do Mind Workshop | `areas/lote-jogos-mente.png` (+ `areas/lote-jogos-mente-akasha.png`) · `npcs/npc-jogos-mente.png` · `bg/mente-troca-ceu.png` · `bg/mente-troca-gruta.png` |
| 29 | Peças/feedback dos jogos | `fx/fx-pedra-circulo.png` · `fx/fx-pedra-triangulo.png` (+ losango, quadrado) · `fx/fx-bolha-sonho.png` · `fx/fx-pop.png` |
| 30 | Faixas de ranking (8) | `molduras/rank-madeira.png` … `molduras/rank-bronze.png` / `rank-ouro.png` / `rank-grao-mestre.png` (192²) |
| 31 | Campeão / pódio / arena do ranking | `emblems/tournament-champion.png` · `areas/lote-arena-torneio.png` · `bg/tournament-night.png` · `bg/tournament-final.png` (1080×1920) |
| 32 | Material do ranking | `leaderboard` · `emoji_events` · `military_tech` (já no subset) |

### 2.6 Área do Soulmon "digital" (pasta + luz do display)

| # | Uso | Asset existente |
|---|---|---|
| 33 | Mochila que vira pasta (estado atual) | `icones-ui/mochila.png` (32²) |
| 34 | Dormir/acordar (vira apagar/acender a luz) | `icones-ui/dormir.png` · `icones-ui/sol-acordar.png` |
| 35 | Banho (não muda) | `icones-ui/banho.png` · `hud/glyph-bath.png` · `fx/anim-shower-splash.png` |
| 36 | Fundos de visor | `bg/visor-atelie.png` · `bg/visor-feira.png` · `bg/visor-refugio.png` |

### 2.7 O que NÃO precisa de prompt (e por quê)

- **Zip e Patches (cards, ícones)**: o hub de Jogos é aparelho e `icons/games/icon-game-*` estão marcados **FORA → Material** (`INVENTARIO-ASSETS.md` §158–159). O tabuleiro de cada jogo é CSS/SVG. **Ação de código, não de arte:** o subset do Material **não tem** `folder`, `folder_open`, `extension`, `route`, `vpn_key`: acrescentar ao subset (regerar `.woff2` e subir `CACHE_VERSION` de `public/sw.js`) antes de usar — nome fora do subset falha em silêncio. Isso também cobre o fallback de P1-09 (pasta).
- **Ataque ranged/físico por elemento**: já existe nos 154 elementos (§2.1 e §2.2). Não gerar.
- **Páginas de ranking**: layout é UI; só o P2-07/P2-08 adicionam personalidade.

## 3. Mapa de dependência (o que bloqueia o quê)

| Feature | P1 que a libera | Provisório enquanto não sai |
|---|---|---|
| Soul Barrage | P1-05 fundo, P1-06 inimigos, P1-07 tiros inimigos | §2.1 #5–#7 (bosses, rookies, minigame-dino) — **tiros inimigos sem asset: usar o `fx-<el>-orb` de um elemento hostil, mas fica ilegível contra o do jogador** (por isso P1-07 é P1) |
| Dash | nenhum (tudo existe) | — |
| Dungeon (roguelike) | P1-02 prédio, P1-04 NPC, P1-08 nós do mapa | Material (§2.3 #22) |
| Endless Rift | nenhum | prédio atual |
| Prepare to Focus | P1-01 prédio, P1-03 NPC | prédio/NPC do Focus Workshop (confunde os dois: por isso P1) |
| Área digital | P1-09 pasta + luz | Material `folder` após o subset |
| Ranking | nenhum | §2.5 |


## 4. Prompts P1 — bloqueiam o lançamento da feature

### P1-01 · 1:1 · 512x512 (gerar 2k, reduzir; alfa binario como os lotes)
- Destino: `src/assets/soulmon/areas/lote-exploracao-prepare-focus.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-oficina-v3.png (irmao: Focus Workshop)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. PREPARE TO FOCUS - ETHEREAL/MINERAL ANTECHAMBER: a small ancient standing-stone gatehouse, two leaning pale-grey monoliths and a lintel forming a low arch, moss on top, a sealed round door in the middle that looks like a closed mouth with a glowing turquoise KEYHOLE as its single calm eye; a few soft floating wisps and a small turquoise-flame brazier on each side, a quiet pre-meditation mood, it clearly reads as the porch that leads to a bigger workshop. Accent soft amber lantern light on the dark teal-and-stone body.
```

### P1-02 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png (a masmorra atual, que vira Endless Rift; ampliar com NEAREST, 300 px e o minimo) + lote-exploracao-oficina-v3.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON (the new daily roguelike) - MINERAL LABYRINTH BEAST: a squat dark obsidian-and-slate boulder creature half sunk in the ground, THREE arched cave mouths side by side on its front, each one lit by a different small light (a violet glow, a leaf-green glow, an ember-orange glow) so it reads as THREE PATHS to choose from; two narrow glowing slit eyes under a heavy stone brow above the middle mouth, a few large crystal shards on its back, a small floor-number marker carved on the base; accent deep indigo and violet, clearly different from the old tall indigo tower dungeon.
```

### P1-03 · 1:1 · 768x768
- Destino: `src/assets/soulmon/npcs/npc-exploracao-prepare-focus.png`
- Modelo: gpt_image_2 2k high, --background transparent (fallback se falhar: gpt_image_2_5 --variant flare --background transparent --quality high --resolution 1k)
- Referência anexada: nenhuma (so o molde de texto)
```
Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY: head, shoulders and upper chest, cropped at mid-torso, three-quarter view facing slightly toward the viewer, centered, fully isolated on a fully transparent background, no frame, no text. Clean bold BLACK OUTLINES around every shape, 32-bit era pixel art with noticeably more detail than a tiny sprite, cel shading with 2 to 3 tones per color, crisp pixels, no blur. The creature is NOT human; it is an expressive monster NPC with a strong readable silhouette, calm open eyes, at most a faint gentle smile, never laughing and never angry. CREATURE: a hermit moth-owl creature of the light and air element with aurora and quiet-silence essences, a tortoise-like stone shell on its back covered in moss, soft powdery moth wings folded like a cloak, round half-open amber eyes. PROFESSION: FOCUS PREPARATION GUIDE who gets visitors ready before deep work — make the profession unmistakable through its props: holding up a small glowing brass-and-crystal KEY in one wing, a tiny hourglass of glowing sand hanging at its chest, an unlit candle on its shell, a folded checklist scroll. It belongs to a place that is a small standing-stone gatehouse with a keyhole door, so its body materials echo that place. COLORS: warm cream and powder-lavender wings, mossy green shell with slate grey stone, amber eyes, plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors. No top hat, no goggles, no harness, no belt, no pouches, no gears; copper only as a small detail.
```

### P1-04 · 1:1 · 768x768
- Destino: `src/assets/soulmon/npcs/npc-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent (fallback se falhar: gpt_image_2_5 --variant flare --background transparent --quality high --resolution 1k)
- Referência anexada: nenhuma (so o molde de texto)
```
Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY: head, shoulders and upper chest, cropped at mid-torso, three-quarter view facing slightly toward the viewer, centered, fully isolated on a fully transparent background, no frame, no text. Clean bold BLACK OUTLINES around every shape, 32-bit era pixel art with noticeably more detail than a tiny sprite, cel shading with 2 to 3 tones per color, crisp pixels, no blur. The creature is NOT human; it is an expressive monster NPC with a strong readable silhouette, calm open eyes, at most a faint gentle smile, never laughing and never angry. CREATURE: a dark, badass labyrinth warden, a hybrid of a rhinoceros beetle, a cave bat and a ram, of the shadow and earth element with dusk and obsidian essences: a long curved beetle horn of black obsidian, ram-style swept horns wrapped in glowing runes, folded leathery bat-wing ears, sharp calm violet eyes, a rocky plated shoulder armor with embedded crystals. PROFESSION: DUNGEON GUIDE who tells adventurers which of three paths to take — make the profession unmistakable through its props: a lantern hanging from one horn, a rolled stone map in one hand, three small colored crystal tokens (violet, green, ember orange) floating in front of its chest, a heavy iron key at its collar. It belongs to a place that is a boulder-creature dungeon with three cave mouths, so its body materials echo that place. COLORS: obsidian black and slate grey armor, deep indigo and violet runes, bone-white horn tips, ember-orange lantern glow, plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors. No top hat, no goggles, no harness, no belt, no pouches, no gears; copper only as a small detail.
```

### P1-05 · 9:16 · 1080x1920, TILE VERTICAL SEM EMENDA (a tela rola para cima)
- Destino: `src/assets/soulmon/bg/soul-barrage-1.png`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/minigame-dino.png (cenario de minigame 1080x1920 aprovado)
```
Seamless VERTICAL SCROLLING game background for a top-down bullet-hell minigame, tall 9:16 portrait, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal #071413 / #0F2A29, copper/bronze accents #C68642, faceted glowing turquoise soul crystals #5FF3E0, mossy green vines). Open mystical night sky seen from above: dark void and soft cosmos with faint stars, a loose scatter of ancient floating stone platforms, small ruined arches and drifting crystal shards far below, thin glowing circuit-line runes on the platforms, wisps of mist. IMPORTANT: the TOP edge and the BOTTOM edge of the image must match exactly so the picture tiles endlessly when scrolling vertically; keep the center and the left and right edges calm and low-contrast so bullets and sprites stay readable on top; the brightest details only near the sides. No characters, no creatures, no buildings, no text, no UI, no frame, no horizon line. Tall 9:16 vertical composition.
```

### P1-06 · 3:2 · folha 3:2 (2k); cada inimigo 128x128 (1-8) ou 192x192 (9-12), alfa real
- Destino: `src/assets/soulmon/soul-barrage/enemies-sheet.png, fatiar em enemy-01..12.png`
- Modelo: gpt_image_2 2k high, --background transparent; fatiar com scripts-arte/fatiar-alfa.mjs; conferir a0% e limpar nevoa com scripts-arte/limpar-alfa.mjs
- Referência anexada: src/assets/soulmon/bosses/boss-cuprex.png (so estilo, nao copiar a criatura; conferir que o dono aprovou)
```
Sprite sheet of 12 original small ENEMY creatures for a vertical top-down bullet-hell minigame in a monster-raising RPG, arranged in a clean 4 columns x 3 rows grid with wide empty gaps, every enemy fully isolated on a fully transparent background, no ground, no shadow, no text, no letters, no labels, no frames. Match the attached reference style: detailed 32-bit era pixel-art creature sprites, clean bold BLACK OUTLINES, cel shading with 2 to 3 tones, crisp pixels, no blur, moody dark fantasy with arcane nature and a little ancient tech. All enemies are seen from ABOVE and slightly in front, facing DOWN toward the player, with a strong readable silhouette at small size; they are hostile but calm-looking, no gore, no skulls, no humanoids. Each enemy has its OWN distinct color group so they are told apart at a glance, plus small glowing soul-crystal accents (#5FF3E0) as the shared signature of the world. Row 1 (small, fast drifters): (1) a shadow moth with dusk-purple wings; (2) a thorny seed pod with a single glowing eye, leaf green; (3) a cracked obsidian beetle with ember-orange seams; (4) a pale jellyfish spirit with trailing tendrils, sky blue. Row 2 (small shooters): (5) a floating mossy stone idol head with a crystal in its mouth; (6) an old copper scarab drone with a turquoise core, mossy and ancient; (7) a bone-white cave bat spirit made of mist; (8) a coral-red spined sea urchin hovering in the air. Row 3 (medium, tougher, drawn about 1.5x larger): (9) a slate-grey crystal golem bust with violet quartz spikes; (10) an old tree-root horror with a hollow glowing face and hanging vines; (11) a violet-and-teal armored rhino beetle seen from above; (12) a floating ruined portal arch with a ghostly face in its keystone and orbiting wisps. No top hat, no goggles, no harness, no steam.
```

### P1-07 · 3:2 · folha 3:2 (2k); cada tiro 48x48 alfa real (32 na tela)
- Destino: `src/assets/soulmon/soul-barrage/enemy-bullets-sheet.png, fatiar em bullet-01..06.png`
- Modelo: gpt_image_2 2k high, --background transparent; fatiar por projecao
- Referência anexada: src/assets/soulmon/fx-ataque/fx-fogo-orb.png (so medida de linguagem; 128x128, ampliar com NEAREST: minimo 300 px por lado)
```
Sprite sheet of 6 ENEMY BULLET projectiles for a vertical bullet-hell minigame, pixel art, arranged in a clean 3 columns x 2 rows grid with wide empty gaps, each projectile fully isolated on a fully transparent background, no trails, no text, no letters, no frames. Crisp 16-bit pixel art with a thick dark outline, glowing but compact, drawn front-facing and centered so it reads clearly over a dark teal background. IMPORTANT readability rule: enemy bullets must look clearly DIFFERENT from the player's turquoise and elemental projectiles - use a hostile warm palette (ember red, hot orange, magenta-violet with a pale yellow-white core) and never turquoise. The six: (1) small round orb; (2) large round orb with a dark ring; (3) pointed diamond shard; (4) thin needle dart, vertical; (5) spinning four-point star; (6) crescent blade. All the same visual weight, bold silhouettes, readable at 24 pixels, no tiny details.
```

### P1-08 · 4:3 · folha 4:3 (2k); cada icone 96x96 alfa real
- Destino: `src/assets/soulmon/dungeon-rogue/nodes-sheet.png, fatiar em node-*.png`
- Modelo: gpt_image_2 2k high, --background transparent; fatiar por projecao
- Referência anexada: E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/ref_1c3efe44.png (folha de icones #79 de 23/09)
```
Sprite sheet of 12 game ICONS in pixel art, arranged in a clean 4 columns x 3 grid with wide empty gaps, each icon fully isolated on a fully transparent background, no boxes, no frames, no circles behind them, no text, no letters, no numbers. Same crisp pixel-art technique and palette mood as the attached reference (copper/bronze, dark teal outlines, glowing turquoise soul-crystal accents), but designed as ICONS: front-facing flat view (not isometric), bold simple silhouette, thick dark outline, very few colors (max 5 per icon), large shapes readable at 24 pixels, no tiny details, all icons same visual weight and size. These are MAP NODE icons for a branching dungeon map. Row 1: (1) COMBAT - two crossed swords over a small shield; (2) PUZZLE - a glowing turquoise interlocking rune tile, a puzzle piece; (3) MINIGAME - a retro game controller with a tiny star; (4) TOOL - a small pickaxe crossed with a leaf, for exploration resources. Row 2: (5) MANDATORY COMBAT - a bold single sword wrapped in red flames inside a thick red ring, clearly more dangerous than icon 1; (6) START - a small open door with a turquoise lantern; (7) STAIRS TO NEXT FLOOR - a spiral stair going down; (8) TREASURE - a small closed chest with a copper clasp. Row 3: (9) CLEARED - a round check mark inside a turquoise ring; (10) LOCKED - a copper padlock; (11) UNKNOWN PATH - a mysterious question mark inside a dark teal circle; (12) BONUS CHOICE - a glowing turquoise gem floating over a small open hand.
```

### P1-09 · 1:1 · folha 2x2 (2k); cada glifo 128x128 alfa real (32 na tela)
- Destino: `src/assets/soulmon/icones-ui/pasta.png, pasta-aberta.png, display-luz-acesa.png, display-luz-apagada.png`
- Modelo: gpt_image_2 2k high, --background transparent; fatiar por projecao
- Referência anexada: src/assets/soulmon/icones-ui/mochila.png (32x32 atual, ampliar com NEAREST ate >=300 px) + src/assets/soulmon/icones-ui/dormir.png
```
Sprite sheet of 4 tiny pixel-art GLYPHS arranged in a clean 2 columns x 2 rows grid with wide empty gaps, each glyph fully isolated on a fully transparent background, no boxes, no frames, no circles behind them, no text, no letters. Same crisp pixel-art technique and palette mood as the attached reference (the small backpack glyph used beside the pet): copper/bronze, dark teal outline, a little glowing turquoise soul-crystal accent, front-facing flat view, bold simple silhouette with a thick dark outline, max 5 colors per glyph, large shapes readable at 32 pixels, no tiny details, all four the same visual weight. (1) FOLDER CLOSED - a digital file folder with a copper tab and a tiny turquoise crystal sticker, replacing the old backpack; (2) FOLDER OPEN - the same folder open with a glowing turquoise sheet peeking out; (3) DISPLAY LIGHT ON - a small handheld-display lamp, a glowing turquoise bulb with soft pixel rays; (4) DISPLAY LIGHT OFF - the same lamp unlit, dull dark teal glass, no rays, a tiny Z next to it.
```


## 5. Prompts P2 — arte provisória aceitável

### P2-01 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-endless-rift.png (hoje a arte e lote-exploracao-masmorra: aceitavel ate sair)`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. ENDLESS RIFT (the infinite descending dungeon) - ETHEREAL: a tall jagged crack in the ground held open by two dark slate rock walls, a bottomless glowing turquoise-and-violet abyss inside with a spiral of stone steps descending out of sight, ghostly mist rising, a few floating crystal shards and spirit wisps around the rim, a stern stone brow and two slit eyes carved above the crack; accent cool violet and bone white.
```

### P2-02 · 4:3 · folha 4:3 (2k); cada icone 96x96 alfa real
- Destino: `src/assets/soulmon/dungeon-rogue/bonus-sheet.png, fatiar em bonus-*.png`
- Modelo: gpt_image_2 2k high, --background transparent; fatiar por projecao
- Referência anexada: E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/ref_1c3efe44.png (folha de icones #79 de 23/09)
```
Sprite sheet of 12 game ICONS in pixel art, arranged in a clean 4 columns x 3 grid with wide empty gaps, each icon fully isolated on a fully transparent background, no boxes, no frames, no circles behind them, no text, no letters, no numbers. Same crisp pixel-art technique and palette mood as the attached reference (copper/bronze, dark teal outlines, glowing turquoise soul-crystal accents), but designed as ICONS: front-facing flat view (not isometric), bold simple silhouette, thick dark outline, very few colors (max 5 per icon), large shapes readable at 24 pixels, no tiny details, all icons same visual weight and size. These are ROGUELIKE BONUS icons shown on cards. Row 1: (1) ATTACK UP - a sword with a rising arrow; (2) DEFENSE UP - a round shield with a rising arrow; (3) HEALTH UP - a heart with a small plus; (4) SPEED UP - a winged boot. Row 2: (5) ENERGY - a lightning bolt inside a ring; (6) LUCK - a four-leaf clover; (7) LOOT BONUS - an open bag spilling small gems; (8) SCORE MULTIPLIER - a star with a small x2 glyph. Row 3: (9) SECOND CHANCE - a heart with a circular arrow; (10) SPECIAL CHARGE - a glowing crystal with a flame inside; (11) RESOURCE BONUS - a leaf and a pebble together; (12) SHIELD AURA - a translucent turquoise dome over a small footprint.
```

### P2-03 · 9:16 · 1080x1920
- Destino: `src/assets/soulmon/bg/dungeon-rogue-fork.png`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/dungeon-interior-templo.png (608x1080 aprovado; ampliar)
```
Tall 9:16 portrait pixel-art game background scene, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal stone, copper/bronze accents, faceted glowing turquoise soul crystals, mossy vines). Inside a vast ancient cavern hall: in the lower third a flat open stone landing, empty, for a small pet character and a map overlay; in the upper two thirds THREE dark tunnel mouths side by side leading away into the distance, the left one lit with a faint violet glow, the middle one with a leaf-green glow, the right one with an ember-orange glow, each with a small turquoise-flame brazier beside it; stalactites and hanging vines frame the top, crystals scattered on the rock walls. Calm, mysterious, not claustrophobic, not gory. No characters, no creatures, no text, no UI, no frame. Tall 9:16 vertical composition.
```

### P2-04 · 9:16 · 1080x1920
- Destino: `src/assets/soulmon/bg/dungeon-rogue-andar-1.png (andar 1 de 3)`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/dungeon-interior-forja.png (mesma serie; aprovado, 608x1080, ampliar)
```
Tall 9:16 portrait pixel-art game background scene for a roguelike dungeon floor, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal stone, copper/bronze accents, faceted glowing turquoise soul crystals, mossy vines). Scene: a flooded crystal grotto, a still turquoise pool reflecting glowing quartz, wet slate walls, drifting spores. A flat walkable ground band across the lower 26 percent of the image, plain and uncluttered for characters to stand on and enemies to face; the upper part is atmospheric depth. Calm, mysterious, no gore, no skulls. No characters, no creatures, no text, no UI, no frame. Tall 9:16 vertical composition.
```

### P2-05 · 9:16 · 1080x1920
- Destino: `src/assets/soulmon/bg/dungeon-rogue-andar-2.png (andar 2 de 3)`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/dungeon-interior-forja.png (mesma serie; aprovado, 608x1080, ampliar)
```
Tall 9:16 portrait pixel-art game background scene for a roguelike dungeon floor, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal stone, copper/bronze accents, faceted glowing turquoise soul crystals, mossy vines). Scene: an overgrown ruined library crypt, toppled shelves wrapped in roots and moss, soft green bioluminescent fungi, stone lantern posts with turquoise flames. A flat walkable ground band across the lower 26 percent of the image, plain and uncluttered for characters to stand on and enemies to face; the upper part is atmospheric depth. Calm, mysterious, no gore, no skulls. No characters, no creatures, no text, no UI, no frame. Tall 9:16 vertical composition.
```

### P2-06 · 9:16 · 1080x1920
- Destino: `src/assets/soulmon/bg/dungeon-rogue-andar-3.png (andar 3 de 3)`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/dungeon-interior-forja.png (mesma serie; aprovado, 608x1080, ampliar)
```
Tall 9:16 portrait pixel-art game background scene for a roguelike dungeon floor, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal stone, copper/bronze accents, faceted glowing turquoise soul crystals, mossy vines). Scene: a deep violet-and-obsidian forge cavern, cooling rivers of dim ember light, tall black crystal columns, a faint dusk-orange glow. A flat walkable ground band across the lower 26 percent of the image, plain and uncluttered for characters to stand on and enemies to face; the upper part is atmospheric depth. Calm, mysterious, no gore, no skulls. No characters, no creatures, no text, no UI, no frame. Tall 9:16 vertical composition.
```

### P2-07 · 3:2 · 512x341
- Destino: `src/assets/soulmon/areas/ranking-podium.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-arena-torneio.png (Tournament)
```
A single isometric pixel-art monument, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no numbers, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES in two small braziers. SIMPLE AND BOLD big readable shapes, limited palette around 16 colors. RANKING PODIUM: a three-step winners podium carved from pale stone, the center step tallest, with three round pedestals on top holding a gold, a silver and a bronze glowing crystal orb, a few hanging pennants, calm ancient mood. True isometric 2:1 angle, light from top-left. No gears, no top hat, no leather straps.
```

### P2-08 · 1:1 · 768x768
- Destino: `src/assets/soulmon/npcs/npc-ranking-arauto.png`
- Modelo: gpt_image_2 2k high, --background transparent (fallback se falhar: gpt_image_2_5 --variant flare --background transparent --quality high --resolution 1k)
- Referência anexada: nenhuma (so o molde de texto)
```
Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character. Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY: head, shoulders and upper chest, cropped at mid-torso, three-quarter view facing slightly toward the viewer, centered, fully isolated on a fully transparent background, no frame, no text. Clean bold BLACK OUTLINES around every shape, 32-bit era pixel art with noticeably more detail than a tiny sprite, cel shading with 2 to 3 tones per color, crisp pixels, no blur. The creature is NOT human; it is an expressive monster NPC with a strong readable silhouette, calm open eyes, at most a faint gentle smile, never laughing and never angry. CREATURE: a cute-but-proud hybrid of a sun finch, a bell and a tiny stag: round golden-feathered body, small antlers with a hanging crystal bell on each tip, a fluffy cream chest crest, bright attentive eyes. PROFESSION: RANKING HERALD who announces who is on top — make the profession unmistakable through its props: a rolled parchment with blank ranked lines in one wing, a small brass bell and a little podium ribbon, a laurel wreath resting on its head. It belongs to a place that is a stone winners podium, so its body materials echo that place. COLORS: golden yellow and cream feathers, antler brown, laurel green, bronze bell, plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors. No top hat, no goggles, no harness, no belt, no pouches, no gears; copper only as a small detail.
```

### P2-09 · 3:2 · folha 3:2 (2k)
- Destino: `src/assets/soulmon/dino/dash-pickup-sheet.png, fatiar (coletavel 64x64; plataformas 192x48)`
- Modelo: gpt_image_2 2k high, --background transparent; so gerar se a lane L7 (beta3) nao tiver produzido esta arte
- Referência anexada: src/assets/soulmon/dino/dino-obstacle-1.png (128x128, ampliar com NEAREST)
```
Sprite sheet of 6 side-view pixel-art game props for an endless-runner minigame, arranged in a clean 3 columns x 2 rows grid with wide empty gaps, each piece fully isolated on a fully transparent background, no ground, no text, no letters, no frames. Same crisp pixel-art technique, dark moody teal palette and copper/bronze details as the attached reference, faceted glowing turquoise soul crystals as the signature. Row 1: (1) DASH CHARGE pickup - a floating glowing turquoise crystal bolt with a tiny inner flame, bold and readable at 32 pixels; (2) DASH CHARGE pickup spent - the same crystal dull and dark; (3) a small spark burst for the moment of pickup. Row 2: (4) a SHORT suspended stone platform seen from the side, mossy top edge, copper end caps, hanging vines; (5) a MEDIUM suspended platform of the same style; (6) a LONG suspended platform of the same style with a small turquoise lantern. Flat straight tops so the pet can run along them.
```

### P2-10 · 9:16 · 1080x1920, tile vertical sem emenda
- Destino: `src/assets/soulmon/bg/soul-barrage-2.png`
- Modelo: gpt_image_2 2k high, fundo OPACO (sem --background transparent)
- Referência anexada: src/assets/soulmon/bg/soul-barrage-1.png (depois de gerado e aprovado no P1-05)
```
Seamless VERTICAL SCROLLING game background for a top-down bullet-hell minigame, tall 9:16 portrait, crisp detailed 16-bit pixel art, EXACTLY the same art style, palette and mood as the attached reference but a DIFFERENT zone for later waves: a dark storm layer above a sea of clouds, violet-teal thunderheads with faint lightning, floating broken crystal ruins and a few drifting stone arches, thin glowing circuit-line runes. IMPORTANT: the TOP edge and the BOTTOM edge must match exactly so the picture tiles endlessly when scrolling vertically; keep the center and left and right edges calm and low-contrast so bullets stay readable; brightest details only near the sides. No characters, no creatures, no buildings, no text, no UI, no frame. Tall 9:16 vertical composition.
```


## 6. Checklist de conferência do lote (arte-conferente)

- Todos os prédios na mesma escala/ângulo/luz do irmão anexado; cada um legível a 100 px; olhos simples (sem olho de anime); nenhum com engrenagem/cartola/couro/vapor.
- NPCs: expressão calma, sem gargalhada e sem cara brava; ≥3 criaturas misturadas; cristal `#5FF3E0` presente; sem cartola/goggles/arreio/cinto/bolsinhas; fundo alfa real.
- Inimigos do Soul Barrage legíveis a 128 px, de cima, virados para baixo; **tiros inimigos quentes (vermelho/laranja/magenta) e nunca turquesa**, distintos dos tiros do jogador.
- Fundo rolável: bordas superior e inferior idênticas (testar emendando a imagem consigo mesma), centro de baixo contraste.
- Folhas: fatiar por projeção, conferir que nenhuma peça saiu cortada, `a0%` alto, 0 px de chroma.
- Nada pixelizado depois (revogado em 14/10); ícones só em pixel **dentro do visor**; fora do visor é Material.
- Rodar 2 vezes o script de instalação: a 2ª tem que ser no-op (regra do CLAUDE.md global: a fonte é sempre o arquivo canônico atual, nunca um backup).
- Registrar cada peça aprovada em `INVENTARIO-ASSETS.md` e o prompt exato usado em `PROMPTS-HIGGSFIELD-*.md` do dia.

## 7. Fora de escopo deste doc

- Nenhuma imagem foi gerada nem instalada; nada foi commitado. Este doc só lista o que existe e o que falta.
- Música/SFX do Soul Barrage e da Dungeon: squad de som (`soulmon-squad-som`).
- Arte do quebra-cabeça e dos minigames sorteados dentro da Dungeon: reutilizam os jogos existentes (Match 3, Obstacle Run, PPT, Zip, Patches, Pet Cycle).


## 8. Rodada 4 (26/10/2026) — artes provisórias de N3/N6

Provisórias em uso (código já funciona com elas): obstáculo do Obstacle Run = os `dino-obstacle-*` atuais ampliados ~40%; coletável do Normal = cristal `fx-<elemento>-defended`; campo de força do dash = `fx-<elemento>-aura`; inimigos do Soul Barrage = rookie/champion/ultimate do elemento espaço do `enemyRoster` e tiro inimigo `fx-espaco-orb`.

### P3-01 · 1:1 · folha 3:2 (2k); cada obstáculo 256x256 alfa real
- Destino: `src/assets/soulmon/dino/dino-obstacle-r4-sheet.png`, fatiar (3 variantes por tier; medir a caixa opaca de cada uma para `hit`/`top` em `DinoGame.tsx`)
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/dino/dino-obstacle-3.png (128x128, ampliar com NEAREST)
```
Sprite sheet of 6 large side-view pixel-art obstacles for an endless-runner minigame, arranged in a clean 3 columns x 2 rows grid with wide empty gaps, each piece fully isolated on a fully transparent background, no ground, no text, no letters, no frames. Same crisp pixel-art technique, dark moody teal palette and copper/bronze details as the attached reference, faceted glowing turquoise soul crystals as the signature. Bold, big, readable silhouettes that fill most of their square, seen from the side and standing on their base: row 1 low and medium obstacles (a cluster of jagged cold-fire crystals, a toppled mossy stone pillar with a crystal growing from it, a gnarled root arch with a small turquoise flame); row 2 tall obstacles (a tall crystal spire with a floating shard, a ruined stone gate half sunk in moss, a thorny bone-white tree with glowing crystal fruit). Calm and mysterious, no gore, no skulls, no gears, no leather straps.
```

### P3-02 · 3:2 · folha 3:2 (2k); cada peça 128x128 alfa real
- Destino: `src/assets/soulmon/dino/dash-gem-sheet.png`, fatiar (coletável de carga do dash, 1 por elemento é opcional; o provisório já usa o `defended` do elemento)
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/fx-ataque/fx-espaco-defended.png (128x128)
```
Sprite sheet of 3 small pixel-art collectible gems for an endless-runner minigame, arranged in one row with wide empty gaps, each fully isolated on a fully transparent background, no text, no frames, no ground shadow. Same crisp pixel-art technique and faceted-crystal look as the attached reference, but each gem is a clean CUBE-like faceted crystal (readable at 40 pixels): (1) turquoise soul crystal with a tiny inner flame, (2) the same crystal slightly brighter with a soft sparkle for the moment of pickup, (3) the same crystal dull and dark for an empty charge. Bold outline, 3 tones per color, no gears, no straps.

```

## 9. Opções de prédio do Calabouço (N7, 26/10/2026)

O Calabouço (`jogos.dungeon`) hoje usa a arte provisória da Masmorra. São 4 conceitos DISTINTOS para o dono escolher (nenhum gerado ainda). Mesmo template de 23/09 dos demais prédios (`gpt_image_2` 2k `high`, `--background transparent`, uma referência do próprio projeto, isométrico 2:1, luz top-left, sem engrenagem/cartola/couro/vapor), vibe arcano + natureza, e "três caminhos" como ideia comum (o Calabouço oferece 3 caminhos a cada passo). Instalar a escolhida como `src/assets/soulmon/areas/lote-jogos-dungeon.png` (512², alfa binário) e trocar o import `loteMasmorra` de `JOGOS_LOT_ART.dungeon` em `assets/soulmon/areas/index.ts`; remedir a caixa em `areaLotGeometry.ts`.

### Opção A · Raiz-portal (natureza viva) · 1:1 · 512x512 (gerar 2k, reduzir; alfa binario como os lotes)
- Destino: `src/assets/soulmon/areas/lote-jogos-dungeon-opcao-a.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-oficina-v3.png (irmão aprovado, estilo e escala) e lote-jogos-mente.png (irmão da mesma área; ampliar com NEAREST se precisar)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. PREPARE TO FOCUS - ETHEREAL/MINERAL ANTECHAMBER: a small ancient standing-stone gatehouse, two leaning pale-grey monoliths and a lintel forming a low arch, moss on top, a sealed round door in the middle that looks like a closed mouth with a glowing turquoise KEYHOLE as its single calm eye; a few soft floating wisps and a small turquoise-flame brazier on each side, a quiet pre-meditation mood, it clearly reads as the porch that leads to a bigger workshop. Accent soft amber lantern light on the dark teal-and-stone body.
```

### P1-02 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png (a masmorra atual, que vira Endless Rift; ampliar com NEAREST, 300 px e o minimo) + lote-exploracao-oficina-v3.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON - LIVING ROOT GATE: an ancient hollow tree-stump creature as wide as it is tall, its thick roots forming a low stone-and-wood arch over THREE hollow doorways on its front (the left one lit violet, the middle one leaf-green, the right one ember-orange, so it reads as THREE PATHS), two narrow glowing slit eyes in the bark above the middle doorway, a few pale turquoise crystal shards growing from the roots, drifting soft wisps; accent deep forest green and violet over dark bark and slate, a quiet descent-below mood.
```

### Opção B · Geodo aberto (cristal) · 1:1 · 512x512 (gerar 2k, reduzir; alfa binario como os lotes)
- Destino: `src/assets/soulmon/areas/lote-jogos-dungeon-opcao-b.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-oficina-v3.png (irmão aprovado, estilo e escala) e lote-jogos-mente.png (irmão da mesma área; ampliar com NEAREST se precisar)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. PREPARE TO FOCUS - ETHEREAL/MINERAL ANTECHAMBER: a small ancient standing-stone gatehouse, two leaning pale-grey monoliths and a lintel forming a low arch, moss on top, a sealed round door in the middle that looks like a closed mouth with a glowing turquoise KEYHOLE as its single calm eye; a few soft floating wisps and a small turquoise-flame brazier on each side, a quiet pre-meditation mood, it clearly reads as the porch that leads to a bigger workshop. Accent soft amber lantern light on the dark teal-and-stone body.
```

### P1-02 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png (a masmorra atual, que vira Endless Rift; ampliar com NEAREST, 300 px e o minimo) + lote-exploracao-oficina-v3.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON - SPLIT GEODE BEAST: a squat round boulder creature cracked open like a geode, a ring of large faceted turquoise-and-violet crystals around a dark central mouth that leads down, two narrow glowing slit eyes set in the grey stone rim above it, three small stone arches carved low along the base each with a tiny different lantern glow (violet, green, ember orange) as the THREE PATHS, a little moss on top; accent indigo and violet crystals on warm slate.
```

### Opção C · Poco-escadaria (descida) · 1:1 · 512x512 (gerar 2k, reduzir; alfa binario como os lotes)
- Destino: `src/assets/soulmon/areas/lote-jogos-dungeon-opcao-c.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-oficina-v3.png (irmão aprovado, estilo e escala) e lote-jogos-mente.png (irmão da mesma área; ampliar com NEAREST se precisar)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. PREPARE TO FOCUS - ETHEREAL/MINERAL ANTECHAMBER: a small ancient standing-stone gatehouse, two leaning pale-grey monoliths and a lintel forming a low arch, moss on top, a sealed round door in the middle that looks like a closed mouth with a glowing turquoise KEYHOLE as its single calm eye; a few soft floating wisps and a small turquoise-flame brazier on each side, a quiet pre-meditation mood, it clearly reads as the porch that leads to a bigger workshop. Accent soft amber lantern light on the dark teal-and-stone body.
```

### P1-02 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png (a masmorra atual, que vira Endless Rift; ampliar com NEAREST, 300 px e o minimo) + lote-exploracao-oficina-v3.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON - SUNKEN STAIR WELL: a round ancient stone well-tower half sunk in the ground, a spiral stairway curving down its outside into the dark, THREE arched doorways at different heights on the wall (each with a different small glow: violet, green, ember orange, the THREE PATHS), a single big glowing slit eye like a sealed round window at the top, mossy rim, a few floating wisps and turquoise crystals on the stair edge; accent cool teal shadow and soft violet glow over pale-grey stone.
```

### Opção D · Concha-labirinto (caracol de pedra) · 1:1 · 512x512 (gerar 2k, reduzir; alfa binario como os lotes)
- Destino: `src/assets/soulmon/areas/lote-jogos-dungeon-opcao-d.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-oficina-v3.png (irmão aprovado, estilo e escala) e lote-jogos-mente.png (irmão da mesma área; ampliar com NEAREST se precisar)
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. PREPARE TO FOCUS - ETHEREAL/MINERAL ANTECHAMBER: a small ancient standing-stone gatehouse, two leaning pale-grey monoliths and a lintel forming a low arch, moss on top, a sealed round door in the middle that looks like a closed mouth with a glowing turquoise KEYHOLE as its single calm eye; a few soft floating wisps and a small turquoise-flame brazier on each side, a quiet pre-meditation mood, it clearly reads as the porch that leads to a bigger workshop. Accent soft amber lantern light on the dark teal-and-stone body.
```

### P1-02 · 1:1 · 512x512
- Destino: `src/assets/soulmon/areas/lote-exploracao-dungeon.png`
- Modelo: gpt_image_2 2k high, --background transparent
- Referência anexada: src/assets/soulmon/areas/lote-exploracao-masmorra.png (a masmorra atual, que vira Endless Rift; ampliar com NEAREST, 300 px e o minimo) + lote-exploracao-oficina-v3.png
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON - LABYRINTH SHELL SNAIL: a calm giant stone-snail creature whose spiral shell is a carved LABYRINTH (clear bold spiral channels, readable at small size), its soft mossy body low to the ground, two stalk eyes as simple glowing dots, a wide low cave-mouth between its stalks, THREE small colored lanterns hanging along the shell spiral (violet, green, ember orange) as the THREE PATHS, a few turquoise crystals studding the shell; accent warm earthy brown stone, deep green moss and violet glow.
```
