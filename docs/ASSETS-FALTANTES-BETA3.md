# Assets faltantes da 1.3.0-beta3 — documento único para o dono

Escrito em 26/10/2026 pela squad de arte. Junta `PROMPTS-BETA3.md` (P1/P2, 25/10) com a Rodada 4 (N1..N10, 26/10) do `BACKLOG-BETA3.md`. Nada foi gerado nem instalado. Caminhos de arquivo citados foram conferidos no disco em 26/10/2026.

**Como ler.** Cada tabela diz: id, nome, para que serve, estado (JÁ EXISTE provisório / FALTA / CANCELADO / REAPROVEITADO), se precisa de TRANSPARÊNCIA real (T) ou não (N), proporção/tamanho alvo, prioridade. Prompts de `P1-xx`/`P2-xx` NÃO são repetidos aqui: abra `docs/PROMPTS-BETA3.md` no id indicado. Só os itens `R4-xx` têm prompt escrito neste documento (§8).

**Regras valem para todo prompt** (resumo, texto completo em `PROMPTS-BETA3.md` §1): `gpt_image_2`, 2k, `high`, uma referência do próprio projeto; transparência real com `--background transparent` (nunca chroma; se falhar, `gpt_image_2_5 --variant flare --background transparent --quality high --resolution 1k`); fundos saem opacos; proporção na última frase do prompt; NPC só com o molde de texto e sem imagem; vibe arcano + natureza, nada de steampunk; nada de pixelização depois; prévia em xadrez ou `#08191A`, nunca magenta.

## 0. Mudanças da Rodada 4 que alteram o plano antigo (ler primeiro)

| Decisão da R4 | Efeito no plano de arte |
|---|---|
| N8: o prédio separado "Prepare to Focus" some; o Focus Workshop abre a etapa Prepare e depois libera o timer | **P1-01 (prédio) e P1-03 (NPC) ficam CANCELADOS.** Não gerar. Continua valendo o prédio e o NPC do Focus Workshop atuais (`areas/lote-exploracao-oficina-v3.png`, `npcs/npc-exploracao-oficina.png`). A chave usa `icones-ui/interacao/recompensa-chave.png` |
| N6: Soul Barrage só com inimigos do elemento ESPAÇO; tiro do inimigo = FX de espaço | **P1-06 (12 inimigos variados) deixa de ser P1 e vira opcional/reduzido** (ver §7). **P1-07 (tiros inimigos quentes) fica CANCELADO**: o tiro inimigo é `fx-ataque/fx-espaco-orb.png` |
| N7: Calabouço vira mapa desenhado em tela cheia, prédio com opções | Novos `R4-01` (mapa) e `R4-02` (4 opções de prédio) |
| N10: Endless Rift vai para a Arena | O prédio da Endless Rift (P2-01) precisa ler bem ao lado dos prédios da Arena; sem mudança de prompt |
| N1: voltam os ícones antigos de dormir/acordar e mochila | P1-09 continua FALTA mas deixa de ser urgente (P2 na prática) |

## 1. ÍCONES

| id | Nome | Serve para | Estado | Transp. | Tamanho alvo | Prio |
|---|---|---|---|---|---|---|
| P1-08 | Nós do mapa (12: combate, quebra-cabeça, minigame, ferramenta, combate obrigatório, início, escada, tesouro, concluído, bloqueado, desconhecido, escolha de bônus) | Mapa do Calabouço/Dungeon (nós) | FALTA. Provisório Material (`swords`, `psychology`, `casino`, `inventory_2`, `lock`) + `icones-ui/masmorra-porta.png`, `masmorra-escada.png`, `masmorra-bau-fechado.png`, `masmorra-bau-aberto.png` (existem) | T | folha 4:3, cada 96x96 | P1 |
| P1-09 = R4-06 | Glifos pasta fechada/aberta e luz do display acesa/apagada | Área digital: mochila vira pasta, dormir/acordar vira luz (M2) | FALTA. Hoje `icones-ui/mochila.png`, `dormir.png`, `sol-acordar.png` (existem; N1 os devolveu à Home) | T | folha 2x2, cada 128x128 (32 na tela) | P2 (era P1; N1 aliviou) |
| P2-02 | Bônus roguelike (12: ataque, defesa, vida, velocidade, energia, sorte, loot, multiplicador, segunda chance, carga especial, recurso, aura de escudo) | Cartas de bônus do Dungeon | FALTA. Provisório `combate-v3/status/st-buff-atk.png`, `st-escudo.png`, `st-hot.png` | T | folha 4:3, cada 96x96 | P2 |
| R4-05 | Pedra, papel, tesoura (3) | Botões de escolha do PPT, sem texto | FALTA. Hoje o PPT usa `icones-ui/ppt.png` e `fx/fx-pedra-*.png` (formas de pedra, não são mão). Prompt em §8 | T | folha 3x1, cada 128x128 | P1 |
| R4-06 | Pasta e lâmpada | Igual a P1-09 | **Já coberto por P1-09** (pasta fechada/aberta e luz acesa/apagada). Nada novo | — | — | — |

Reaproveitados sem trabalho: HUD `icones-ui/hp.png`, `icones-ui/energia.png`; recompensa `icones-ui/interacao/recompensa-*.png`; ranking `leaderboard`/`emoji_events`/`military_tech` (Material); zip e patches (Material, ver `PROMPTS-BETA3.md` §2.7).

## 2. NPCs (busto, molde de 30/09)

| id | Nome | Serve para | Estado | Transp. | Tamanho alvo | Prio |
|---|---|---|---|---|---|---|
| P1-03 | Guia do Prepare to Focus | NPC do prédio Prepare to Focus | **CANCELADO (N8)**. Usa `npcs/npc-exploracao-oficina.png` | — | — | — |
| P1-04 | Guia do Dungeon (híbrido besouro-rinoceronte/morcego/carneiro, sombra+terra) | NPC do prédio do Calabouço/Dungeon | FALTA. Provisório: `dungeon-spirit.png` (existe, 128²) | T | 1:1, 768x768 | P1 |
| P2-08 | Arauto do ranking (tentilhão-sino-cervo) | NPC do ranking | FALTA. Provisório `npcs/npc-jogos-mente.png` ou nenhum | T | 1:1, 768x768 | P2 |

## 3. SPRITES

| id | Nome | Serve para | Estado | Transp. | Tamanho alvo | Prio |
|---|---|---|---|---|---|---|
| P1-06 | 12 inimigos variados do Soul Barrage | Inimigos | **REDUZIDO**: a R4 pede só espaço (ver §7). Folha opcional só se o dono achar o roster de espaço pobre | T | folha 3:2, 128 e 192 | opcional |
| P1-07 | 6 tiros inimigos quentes | Tiro inimigo do Barrage | **CANCELADO (N6)**: tiro inimigo = `fx-ataque/fx-espaco-orb.png` | — | — | — |
| P2-09 | Coletável de carga + 3 plataformas suspensas do Obstacle Run | Nível 2 do dash | FALTA. O coletável é substituído por R4-03; **sobram só as 3 plataformas (itens 4–6)** | T | folha 3:2; plataformas 192x48 | P2 |
| R4-03 | Coletável de carga do dash (4 variações) | Obstacle Run nível 2 (hoje "cubo" feio) | FALTA. Prompt §8 | T | folha 2x2, cada 128x128 (usa 64) | P1 |
| R4-04 | Obstáculos maiores e legíveis (4–6) | Obstacle Run níveis 1 e 2 | FALTA. Hoje `dino/dino-obstacle-1.png` … `dino-obstacle-4c.png` (existem, 128², pequenos). Prompt §8 | T | folha 3x2, cada 256x256 | P1 |
| R4-08 | Campo de força do dash | Obstacle Run | **REAPROVEITADO**: `fx-ataque/fx-<elemento>-aura.png` (+ `-orb`). Existem (ex.: `fx-ataque/fx-espaco-aura.png`, `fx-espaco-aura-96.png`, `fx-espaco-orb.png`). Zero asset novo | — | — | — |

Reaproveitados (já existem): tiro do jogador `fx-ataque/fx-<el>-orb.png`, impacto `-impact`, disparo `-cast`, defendido `-defended`; ataque físico `-slash`; rastros `fx/move-speed-lines.png`, `fx/move-dust-puff.png`; estilhaço `fx/fx-corrida-estilhaco-1.png`.

## 4. PRÉDIOS (isométrico 2:1, luz top-left)

| id | Nome | Serve para | Estado | Transp. | Tamanho alvo | Prio |
|---|---|---|---|---|---|---|
| P1-01 | Prepare to Focus | Prédio novo | **CANCELADO (N8)** | — | — | — |
| P1-02 | Dungeon (criatura-pedregulho com 3 bocas de caverna) | Prédio da masmorra roguelike | FALTA. Provisório `areas/lote-exploracao-masmorra.png` (300², existe) | T | 1:1, 512x512 | P1 |
| R4-02 | 4 opções de prédio do Calabouço (a: gruta com runas, b: torre invertida/poço, c: árvore-portal oca, d: cripta de cristal) | Escolha do dono; a escolhida substitui P1-02 | FALTA. Prompts §8 (4 prompts). **Se o dono escolher uma R4-02, P1-02 não é gerado** | T | 1:1, 512x512 cada | P1 |
| P2-01 | Endless Rift (fenda aberta) | Prédio na área Arena (N10) | JÁ EXISTE provisório: `areas/lote-exploracao-masmorra.png` | T | 1:1, 512x512 | P2 |
| P2-07 | Pódio do ranking | Ranking | FALTA. Provisório `areas/lote-arena-torneio.png` (existe) | T | 3:2, 512x341 | P2 |

## 5. MAPAS / FUNDOS (opacos, sem transparência)

| id | Nome | Serve para | Estado | Transp. | Tamanho alvo | Prio |
|---|---|---|---|---|---|---|
| R4-01 | Mapa do Calabouço (fundo desenhado, 3 pontos e trilha) | Tela cheia do Calabouço | FALTA. Prompt §8. Provisório `bg/dungeon-interior-templo.png` + `mapa/bg-mapa.png` (existem) | N | 9:16, 1080x1920 | P1 |
| P1-05 | Fundo rolável do Soul Barrage (tile vertical sem emenda) | Soul Barrage | FALTA. Provisório `bg/minigame-dino.png` (existe) | N | 9:16, 1080x1920 | P1 |
| P2-03 | Bifurcação com 3 túneis | Dungeon (escolha de caminho) | FALTA. Provisório `bg/dungeon-interior-templo.png` | N | 9:16, 1080x1920 | P2 |
| P2-04 / P2-05 / P2-06 | Andares 1, 2 e 3 do Dungeon | Dungeon (combate) | FALTA. Provisório `bg/dungeon-interior-forja.png`, `dungeon-interior-biblioteca.png`, `dungeon-6.png` (existem) | N | 9:16, 1080x1920 cada | P2 |
| P2-10 | Fundo rolável 2 do Soul Barrage (tempestade) | Barrage, ondas finais | FALTA. Gerar só depois de aprovado P1-05 | N | 9:16, 1080x1920 | P2 |
| R4-07 | Fundo do novo PPT | PPT | **JÁ EXISTE e serve**: `bg/minigame-rps.png`. A tela nova põe o campo do duelo no meio, e um fundo de cenário sem personagens cabe. Gerar o fundo condicional (§8) só se o dono reprovar o atual olhando a tela montada | N | 9:16 | só se reprovar |
| R4-07b | Fundo do Soul Barrage | Barrage | Coberto por P1-05 (acima) | N | — | — |

Existem e entram como provisório: `bg/dungeon-1.png` … `dungeon-10.png`, `bg/dungeon-interior-*.png` (6), `bg/tournament-night.png`, `bg/tournament-final.png`, `bg/visor-atelie.png`, `bg/visor-feira.png`, `bg/visor-refugio.png`, `bg/mente-troca-ceu.png`, `bg/mente-troca-gruta.png`.

## 6. SOM

Fora do escopo de prompt de imagem (`PROMPTS-BETA3.md` §7). O áudio é procedural (`src/utils/sounds.ts`, `sfxCombate.ts`, `audioBus.ts`) com assets de IA da squad de som. Pendente, sem arquivo conferido: música do Soul Barrage, música/SFX do Dungeon/Calabouço, SFX do dash e da coleta de carga, SFX do campo de força. Estado: FALTA (a squad de som decide), prioridade P2, não se aplica transparência.

## 7. Soul Barrage: roster de ESPAÇO (conferido no código e no disco)

Fonte: `src/utils/enemyRoster.ts`, `enemyRosterData.ts`, `novosSoulmonData.ts`. O elemento de combate do inimigo é o 1º elemento da entrada; só existem 16 combinados com ESPAÇO como 1º elemento e nenhum com espaço como 2º.

**Criatura base de espaço: Voidlet** (id `voidlet`, linha harmonia; golpes "Warp Jab" e "Rift Tear").

| Estágio | Nome | Arquivo (existe) |
|---|---|---|
| rookie | Voidlet | `src/assets/soulmon/novos/espaco-rookie.png` (256²) |
| champion | Rifthound | `src/assets/soulmon/novos/espaco-champion.png` |
| ultimate | Riftfang | `src/assets/soulmon/novos/espaco-ultimate.png` |
| mega | Voidwarden | `src/assets/soulmon/novos/espaco-mega.png` |
| ultra (só chefe da Arena, não sorteia) | Cosmarch | `src/assets/soulmon/novos/espaco-ultra.png` |

Os 4 estágios que o Barrage precisa (rookie/champion/ultimate/mega) **existem para a base**. FALTA: nada obrigatório.

**Combinados com espaço (só forma rookie, em `src/assets/soulmon/novos-arquivo/combinados/`, os 16 arquivos existem):** 121-meteoro (Alizesa, +fogo), 122-cometa (Futoren, +água), 123-asteroide (Montide, +terra), 124-estratosfera (Fufrosta, +ar), 125-pulsar (Glacupu, +eletricidade), 126-portal (Fulgopo, +arcano), 127-vazio (Cavravia, +sombra), 128-constelacao (Alizecao, +luz), 129-devorador (Umbrador, +vileza), 130-nebulosa (Vesprasa, +morte), 131-semente_estelar (Tezonda, +vida), 132-gigante_estelar (Aerola, +vigor), 133-lamina_sideral (Siventi, +marcial), 134-continuum (Saondra, +tempo), 135-silencio_cosmico (Zephycis, +som), 136-dobra (Teraror, +gravidade).

Observação ao dono: não achei nome "toupeirinha" no roster de espaço; a criatura mais próxima do que descreveu é **123-asteroide Montide (espaço + terra)** (confirme olhando o PNG). Para a "outra criatura de espaço que faz sentido": **Voidlet** (rookie, é a base). Lacuna real: os 16 combinados só têm rookie; "às vezes champion, às vezes ultimate" no Barrage sai todo da linha Voidlet (Rifthound, Riftfang). Se quiser mais variedade nas levas fortes, a opção é gerar champion/ultimate de 2–3 combinados (não listei prompt: depende da sua escolha de quais).

**FX do tiro inimigo** `fx-espaco-orb`: existe (`src/assets/soulmon/fx-ataque/fx-espaco-orb.png`, também `-impact`, `-cast`, `-aura`, `-defended`, `-slash`). Risco de legibilidade (parece o do jogador se o jogador também for espaço): resolver no código com tint/escala, não com asset.

## 8. Prompts novos da Rodada 4 (prontos para colar)

### R4-01 · MAPA do Calabouço · 9:16 · 1080x1920 · FUNDO OPACO
- Destino: `src/assets/soulmon/bg/calabouco-mapa.png`
- Modelo: gpt_image_2 2k high, SEM `--background transparent`
- Referência anexada: `src/assets/soulmon/mapa/bg-mapa.png` (mapa-mestre aprovado) e, se o Higgsfield aceitar duas, `src/assets/soulmon/bg/dungeon-interior-templo.png`
```
Tall 9:16 portrait hand-painted pixel-art ADVENTURE MAP, full screen, seen from above like a game world map, crisp detailed 16-bit pixel art in the same moody magical arcane palette and drawing style as the attached map reference (dark deep-teal #071413 / #0F2A29, copper/bronze accents #C68642, faceted glowing turquoise soul crystals #5FF3E0, mossy green). Subject: the underground realm of a dungeon drawn as a map: ancient cavern terrain with mossy rock plateaus, a dark still pool, hanging roots, crystal clusters, old ruined arches and softly glowing turquoise-flame braziers, nature and arcane magic, a little ancient circuit-line runes, no machines. Composition: a clearly readable winding PATH of worn pale stone and packed earth runs from the bottom to the top of the picture in a gentle S curve and splits into THREE open clearings in the upper half, each clearing a flat empty stone circle about 15 percent of the image width, spaced left, center and right at different heights, with the path visibly connecting the bottom start to every clearing; leave those three clearings and the path empty and uncluttered, because game UI nodes will be placed on top of them. Keep the clearings and the path lighter and slightly more contrasted than the surroundings so they read at a glance; the edges and corners are darker with soft vignette and atmospheric mist. No UI, no nodes, no icons, no markers, no dots, no numbers, no text, no letters, no compass, no frame, no border, no characters, no creatures, no buildings. Calm, mysterious, not claustrophobic, not gory, no skulls. Tall 9:16 vertical composition.
```

### R4-02 · 4 opções de PRÉDIO do Calabouço · 1:1 · 512x512 · TRANSPARENTE
Para as quatro: modelo `gpt_image_2` 2k high `--background transparent`; referência anexada `src/assets/soulmon/areas/lote-exploracao-oficina-v3.png` (irmão aprovado) + `lote-exploracao-masmorra.png` (ampliar com NEAREST, mínimo 300 px). Destino da escolhida: `src/assets/soulmon/areas/lote-exploracao-calabouco.png`. Deve ser claramente diferente da masmorra atual (torre índigo) e da Endless Rift (fenda).

**R4-02a · Entrada de gruta com runas**
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON OPTION A - RUNE CAVE MOUTH: a mossy grey-green rocky hillock whose front is one wide dark cave mouth like an open jaw, a ring of large carved glowing turquoise RUNE stones standing around the entrance like teeth, two narrow glowing slit eyes set in the rock brow above the opening, a worn stone path leading in, a few big crystal shards growing from the top and a turquoise-flame brazier on each side; accent deep teal and moss green with pale bone stone.
```

**R4-02b · Torre invertida / poço**
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON OPTION B - INVERTED TOWER WELL: a wide round stone well-rim at ground level, and rising out of its dark center a tall slender tower standing UPSIDE DOWN with its point hanging down into the pit and its broad base flush with the rim, a spiral stair of pale stone winding around the hanging tower, glowing turquoise crystals along the stair, a calm face carved into the broad base with two narrow glowing slit eyes, soft mist rising from the pit, one turquoise-flame brazier beside the well; accent slate blue and pale stone with a hint of violet depth.
```

**R4-02c · Árvore-portal oca**
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON OPTION C - HOLLOW PORTAL TREE: a huge gnarled ancient tree with a thick dark-brown trunk and a dense dark-green crown, a tall pointed hollow in the trunk that opens like a doorway onto a swirling turquoise-and-violet portal, two knot-hole glowing slit eyes above the hollow, twisting roots that grip the ground like a stairway, copper-toned bark plates as a small detail, hanging vines, glowing turquoise crystal fruit among the leaves and a turquoise-flame lantern at the roots; accent leaf green and warm brown with a violet portal glow.
```

**R4-02d · Cripta de cristal**
```
A single isometric pixel-art building, centered, fully isolated on a fully transparent background, no ground tile, no text, no letters, no glow haze, no drop shadow outside its base. Crisp 16-bit pixel art in the same moody magical arcane-ruins vibe and color approach as the attached reference: dark shadows, copper fittings, a few green vines, faceted turquoise SOUL CRYSTALS with a tiny inner flame and TURQUOISE FLAMES as the unifying signature; the body keeps the natural rich colors of its material. SIMPLE AND BOLD: big clear readable shapes and silhouette that read well at small size, few large details, no clutter, no tiny props, no small trinkets, clean flat pixel shading, limited palette around 16 colors. The structure is clearly a CREATURE (Trent of Legend of Mana spirit): the building IS the being with a strong simple face. EYES: small simple pixel-art eyes - glowing hollow sockets, or narrow glowing slits, or single-color dots; NO anime eyes, no big shiny pupils, no highlights, no eyelashes, no cute cartoon features. Ancient, calm, a little strange, never humanoid, no arms, no legs. No gears, no top hat, no leather straps, no steam chimneys. True isometric 2:1 angle, light from top-left. DUNGEON OPTION D - CRYSTAL CRYPT: a low squat vault built of dark slate blocks, its whole roof grown over with a cluster of large faceted translucent turquoise and pale-violet crystals pointing upward like a crown, a heavy arched stone door in the front with a glowing crystal set in the keystone as its single calm eye plus two small slit eyes in the brow, short stone steps down to the door, a few thin green vines on the slate, a turquoise-flame brazier on each side of the steps; no bones, no skulls, no coffins; accent slate grey with glacial blue and violet crystal light.
```

### R4-03 · Coletável de carga do dash · folha 2x2 · cada 128x128 · TRANSPARENTE
- Destino: `src/assets/soulmon/dino/dash-charge-sheet.png`, fatiar em `dash-charge-1..4.png` (substituem o "cubo"; na tela ~48 px)
- Modelo: gpt_image_2 2k high `--background transparent`; fatiar com `scripts-arte/fatiar-alfa.mjs`, `limpar-alfa.mjs`
- Referência anexada: `src/assets/soulmon/dino/dino-obstacle-1.png` (ampliar com NEAREST) e `src/assets/soulmon/fx-ataque/fx-espaco-orb.png` só como medida de linguagem
```
Sprite sheet of 4 variations of ONE pickup item for an endless-runner minigame, arranged in a clean 2 columns x 2 rows grid with wide empty gaps, each variation fully isolated on a fully transparent background, no ground, no shadow, no text, no letters, no frames, no boxes, no circles behind them. Crisp 16-bit pixel art with a thick dark outline in the same moody teal palette and copper/bronze details as the attached reference. The item is a DASH CHARGE: a collectible burst of energy that must read instantly as "pick me up" at 48 pixels, front-facing, centered, glowing but compact, big bold silhouette, max 5 colors per variation, clearly NOT a cube or a box. Variation 1: a faceted turquoise soul-crystal shaped like a lightning bolt with a tiny inner flame. Variation 2: a winged crystal teardrop, turquoise core with two small pale feathered wings. Variation 3: a glowing turquoise seed pod split open, a small flame floating inside, two leaves. Variation 4: a copper-ringed turquoise orb with a swirl of wind inside and three small speed streaks. All four the same visual weight and size, no tiny details, no gears, no steam.
```

### R4-04 · Obstáculos maiores do Obstacle Run · folha 3x2 · cada 256x256 · TRANSPARENTE
- Destino: `src/assets/soulmon/dino/obstaculos-sheet.png`, fatiar em `obst-01..06.png` (usar 4–6; ocupam ~96 px de altura na tela)
- Modelo: gpt_image_2 2k high `--background transparent`; fatiar por projeção
- Referência anexada: `src/assets/soulmon/dino/dino-obstacle-1.png` (ampliar com NEAREST: é pequeno demais, por isso este item)
```
Sprite sheet of 6 side-view OBSTACLES for an endless-runner minigame, arranged in a clean 3 columns x 2 rows grid with wide empty gaps, each obstacle fully isolated on a fully transparent background, no ground line, no shadow, no text, no letters, no frames. Crisp 16-bit pixel art with a thick dark outline, same moody dark teal palette and copper/bronze details as the attached reference, faceted glowing turquoise soul crystals as the signature, arcane nature with ancient ruins, no gears, no steam. Each obstacle is BIG and its silhouette is instantly readable at a glance while running: a bold blocky shape, tallest part about twice the height of a small pet, flat base so it sits on the ground, a hostile but calm look, limited palette around 8 colors per obstacle, no tiny details. The six: (1) a jagged dark-slate rock spire with a turquoise crystal cluster; (2) a twisted thorny root arch, low and wide, glowing green sap; (3) a broken ancient stone pillar with moss and one glowing rune; (4) a thick wall of tangled vines with a few sharp amber thorns; (5) an obsidian crystal fence of three tall black shards with violet light; (6) a mossy ruined stone gate stub with a hanging chain-free arch and a small turquoise flame on top.
```

### R4-05 · Pedra, papel e tesoura · folha 3x1 · cada 128x128 · TRANSPARENTE
- Destino: `src/assets/soulmon/icones-ui/ppt-pedra.png`, `ppt-papel.png`, `ppt-tesoura.png`
- Modelo: gpt_image_2 2k high `--background transparent`; fatiar por projeção
- Referência anexada: `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/referencias/ref_1c3efe44.png` (folha de ícones #79 de 23/09; existe, caminho corrigido: o de PROMPTS-BETA3 omite `referencias/`)
```
Sprite sheet of 3 game ICONS in pixel art, arranged in a clean 3 columns x 1 row grid with wide empty gaps, each icon fully isolated on a fully transparent background, no boxes, no frames, no circles behind them, no text, no letters, no numbers. Same crisp pixel-art technique and palette mood as the attached reference (copper/bronze, dark teal outlines, glowing turquoise soul-crystal accents), but designed as ICONS: front-facing flat view, bold simple silhouette, thick dark outline, very few colors (max 5 per icon), large shapes readable at 32 pixels, no tiny details, all three the same visual weight and size, clearly three DIFFERENT silhouettes (round, flat, pointed). (1) ROCK - a round faceted grey-slate stone with one glowing turquoise crystal vein; (2) PAPER - a flat folded parchment scroll with a curled corner and a small turquoise rune, cream and copper; (3) SCISSORS - an open pair of old copper scissors with moss-green handles and a tiny turquoise crystal on the pivot. No hands, no fists, no faces.
```

### R4-07 (condicional) · Fundo do PPT, só se o dono reprovar `bg/minigame-rps.png` · 9:16 · 1080x1920 · FUNDO OPACO
- Destino: `src/assets/soulmon/bg/minigame-rps-2.png`. Modelo: gpt_image_2 2k high, opaco. Referência: `src/assets/soulmon/bg/minigame-rps.png`
```
Tall 9:16 portrait pixel-art game background scene for a duel minigame, crisp detailed 16-bit pixel art in the same moody magical arcane palette as the attached reference (dark deep-teal stone, copper/bronze accents, faceted glowing turquoise soul crystals, mossy vines). A calm ancient stone dueling ground seen slightly from above: in the exact middle band a large flat round stone arena floor with a faint carved rune ring, clean and uncluttered for game pieces; the top fifth is a dark misty alcove, the bottom fifth is a low stone ledge, both quiet and low-contrast so sprites and buttons stay readable; crystals, hanging vines and two turquoise-flame braziers only near the left and right edges. No characters, no creatures, no text, no UI, no frame. Tall 9:16 vertical composition.
```

## 9. Resumo numérico

Contagem por id. "Prompts a gerar" conta cada prompt (R4-02 vale 4).

| Categoria | Ids | JÁ EXISTE/reaproveitado | FALTA | Cancelado/reduzido/cond. | Prompts a gerar | Precisa transparência (T) | Sem transparência (N) |
|---|---|---|---|---|---|---|---|
| ÍCONES | 5 (P1-08, P1-09=R4-06, P2-02, R4-05) | 1 (R4-06 coberto por P1-09) | 4 | 0 | 4 folhas (31 ícones: 12+4+12+3) | 4 | 0 |
| NPCs | 3 | 0 | 2 | 1 (P1-03) | 2 | 2 | 0 |
| SPRITES | 6 | 1 (R4-08) | 3 (P2-09 reduzido, R4-03, R4-04) | 2 (P1-06 opcional, P1-07 cancelado) | 3 | 3 | 0 |
| PRÉDIOS | 5 | 1 (P2-01 provisório) | 3 ids (P1-02 ou R4-02, P2-07; mais R4-02) | 1 (P1-01) | 6 (P1-02, P2-01, P2-07 + 4 de R4-02, menos P1-02 se o dono escolher R4-02 = 6 a 7) | 4 ids | 0 |
| MAPAS/FUNDOS | 9 | 1 (R4-07 PPT existe) + R4-07b coberto | 7 (R4-01, P1-05, P2-03..06, P2-10) | 1 (R4-07 condicional) | 7 | 0 | 7 |
| SOM | 4 itens | 0 verificado | 4 (squad de som) | 0 | 0 de imagem | n/a | n/a |

Totais de prompts de imagem: 4 ícones + 2 NPCs + 3 sprites + 7 prédios (P1-02, P2-01, P2-07, R4-02 a..d; 6 se o dono escolher uma R4-02 e dispensar P1-02) + 7 fundos = **23 prompts** (22 se dispensar P1-02). **16 com transparência real** (4+2+3+7) e **7 sem** (fundos). Folha de ícones/sprites conta como 1 prompt cada.

Prioridade: P1 = P1-08, P1-04, P1-02/R4-02, P1-05, R4-01, R4-03, R4-04, R4-05 (8 frentes). P2 = P1-09, P2-02, P2-08, P2-09, P2-01, P2-07, P2-03..06, P2-10 e som.

Custo: usar a tabela de `PROMPTS-BETA3.md` §0 (4 cr por imagem 1k high medido; 2k high não medido). 23 prompts a 1k high ≈ 92 cr, +50% de margem de refazer ≈ 138 cr; 2k high pode dobrar. Saldo de referência 176 cr em 18/10.

## 10. Folhas e galeria com os assets disponíveis ENUMERADOS (todos confirmados no disco em 26/10/2026)

**Galeria do banco Higgsfield** (864 PNGs numerados: 738 disponíveis + 126 em uso, segundo `BANCO-HIGGSFIELD.md`; contagem não recontada):
- `E:\Soulmon-assets\higgsfield-banco\_meta\index.html` (533.729 bytes, filtro por texto; "em uso" esmaecido)
- Números estáveis: coluna `n` de `E:\Soulmon-assets\higgsfield-banco\_meta\manifesto.csv` (536.668 bytes)
- Número para arquivo: `python E:\Soulmon-assets\higgsfield-banco\_meta\achar.py N` (ou `--termo palavra`); script existe

**Folhas do banco** em `E:\Soulmon-assets\higgsfield-banco\_meta\folhas\` (19 arquivos):

| Arquivo | Bytes |
|---|---|
| 0923-folhas-predios-1.png | 804.312 |
| 0923-folhas-predios-2.png | 259.983 |
| 0923-mapas-1.png | 1.630.424 |
| 0923-npcs-1.png | 1.719.110 |
| 0923-predios-avulsos-1.png | 1.025.243 |
| 0923-ui-1.png | 265.046 |
| Mapas-disponiveis-1.png | 1.973.986 |
| Mapas-disponiveis-2.png | 2.019.573 |
| Mapas-disponiveis-3.png | 1.865.475 |
| Mapas-disponiveis-4.png | 1.721.559 |
| NPCs-disponiveis-1.png | 3.650.227 |
| NPCs-disponiveis-2.png | 3.332.720 |
| NPCs-disponiveis-3.png | 3.725.167 |
| NPCs-disponiveis-4.png | 3.485.110 |
| NPCs-disponiveis-5.png | 174.881 |
| NPCs-femininas-1.png | 4.084.447 |
| NPCs-femininas-2.png | 1.503.540 |
| Predios-disponiveis-1.png | 1.814.511 |
| Predios-disponiveis-2.png | 1.106.510 |

**Folhas de NPCs enumerados** em `D:\Soulmon\folhas\`:
- `npcs-enumerados.png` (5.077.151 bytes) e `npcs-enumerados.txt` (1.732 bytes; lista numerada de arquivos `npc-*.png`)
- `npcs-pagina-1.png` (3.428.484), `npcs-pagina-2.png` (3.362.478), `npcs-pagina-3.png` (2.117.003)

Referências de estilo para os prompts R4: `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/referencias/` (52 arquivos; `ref_1c3efe44.png` confirmado) e `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/folha-referencias.png`. Atenção: `PROMPTS-BETA3.md` P1-08 e P2-02 citam o caminho sem `referencias/` (errado).


- **Soulmons dos desafiantes do Torneio (Espina, Quartzo, Maré): FEITOS em 26/10/2026**, 4 formas cada (12 sprites, ver `INVENTARIO-ASSETS.md`); o starter da demo só vale como reserva.
