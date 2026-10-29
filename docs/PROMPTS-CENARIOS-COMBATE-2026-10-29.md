# Prompts: cenários de combate com perspectiva de plataformas (29/10/2026)

Pedido do dono: refazer os cenários de COMBATE com a perspectiva de Game Boy/Pokémon, câmera baixa, perto do chão. O Soulmon do jogador fica perto da câmera (embaixo à esquerda, visto de costas/três-quartos) numa plataforma grande; o inimigo, mais longe (em cima à direita), numa plataforma menor.

## 1. Onde o código põe os lutadores (dono: `stageLayout` em `src/components/games/BattleStage.tsx`)

Tudo é calculado em px dentro da CAIXA DO CAMPO (`w × h`; o campo é a tela menos ~48 px do HUD no topo e ~`corner-h`+54 px embaixo; num celular de 390×844 a caixa é ~390×674). `x,y` = centro da plataforma (onde os pés pousam).

| Lutador | x (centro) | y (centro da plataforma) | sprite | plataforma (`sombra-*.png` 256×96 esticada) |
|---|---|---|---|---|
| Jogador (`me`) | `max(0,32·w, size/2+4)` = ~33% da largura | `h − size·0,1 − 8` (~81% da altura da TELA) | `min(300, 0,64·w, 0,38·h)` = ~250 px | largura `size·1,05` = ~67% da largura; altura `size·0,2` = ~6% da tela |
| Inimigo 1v1 | `0,70·w` (70%) | `0,42·h` do campo (~39% da altura da TELA), mínimo `size·0,94+56` | `me·0,66` = ~165 px | largura ~44% da largura; altura ~4% da tela |
| Grupo de 2 / 3 inimigos | (72%, 46%) + (34%, 34%) / (74%, 50%) + (40%, 40%) + (80%, 27%) do campo | idem | `me·0,5` | idem; Masmorra, Arena, Pesadelo e Rogue lutam 1v1 em sequência, então o caso real é 1 inimigo |
| Chefe da Feira (modo `boss`) | 50% | abaixo da barra do pool, no alto | 128/256/512 px (~68% da largura) | jogador encolhido no mesmo canto (33%) |

Conclusão: **há UMA só posição para todas as cenas** (`stageLayout` não recebe a cena). Já está no desenho Game Boy; falta a ARTE alinhar o chão com essas duas elipses.

Referência para os prompts (percentuais da TELA 9:16; com `cover` os lados podem cortar ~8% em tela mais estreita):
- Plataforma PERTO: centro x 33% / y 81%, ~67% da largura × ~6% da altura.
- Plataforma LONGE: centro x 70% / y 39%, ~44% da largura × ~4% da altura.

## 2. Inventário dos cenários de combate

Todos opacos e 9:16. `BattleStage` os desenha com `inset:0` e `center/cover`; um véu escuro (topo 50% até 20%, pé 45% depois de 76%) fica por cima, e a plataforma-sprite `combate/sombra-clara.png` (`sombra-escura.png` só em `luz`) é desenhada por cima da arte, sob cada sprite.

| Grupo | Onde é usado | Quem escolhe | Arquivos | Tamanho atual |
|---|---|---|---|---|
| A. Por ELEMENTO (18: 17 base + neutro) | `DuelScreen` (`sceneElement=oppEl` vence o `scene`); `utils/combatArt.ts` (`combatSceneBg`; derivado usa o 1º componente) | elemento do oponente | `src/assets/soulmon/combate/bg-<elemento>.png` | 360×640 |
| B. Masmorra idle (`DungeonGame`) | 5 clássicas + 29 pintadas (`RUN_SCENE_POOL`, `buildRunScenes`) | sorteio por run | lista na seção 4 | 1080×1920 (dungeon-1..10, classic, tournament, minigame-dino) ou 608×1080 (as 16 novas) |
| C. Arena livre (`ArenaGame`) | `arenaSceneOfSeed(seedLuta)` entre as 2 arenas do Torneio | semente da run | `tournament-night.png`, `tournament-final.png` | 1080×1920 |
| D. Pesadelo (`NightmareBattle`) | `nightmareScene()`, 3 cenas | dia local | `pesadelo-*.png` | 608×1080 |
| E. Rogue (`RogueFight`) | `DUNGEON_SCENES[(andar−1)%5]` = as 5 clássicas | andar | `dungeon-classic-*.png` | 1080×1920 |
| F. Duelo (`DuelScreen`) | `ARENA_SCENE` (= `dungeon-4`), quase sempre coberta por A | fixo | `dungeon-4.png` | 1080×1920 |
| G. Chefe da Feira (`BossFightScreen`) | não passa cena (fundo do visor) | n/a | nenhum | n/a |
| Fora do combate (NÃO entram) | `backgroundPortrait.ts`/`sceneCss` (Bosque, Casa, Guerra, Travessia), cenários do pet; não existe arquivo com prefixo `bg-arena-*`; `GuerraVisor` é visor sem luta; `dungeon-rogue-*`, `calabouco-mapa`, `mente-troca-*` | | | |
| Sem uso | `combate/dominio/*.png` (51; arena por tema REVOGADA em 28/10) e `utils/arenaTema.ts` | | | 360×640 |

Total a refazer: **55 cenas** = 18 (A) + 29 pintadas (B, incluindo as 2 arenas de C e o `minigame-dino`) + 5 clássicas (B/E) + 3 (D). Gerar em 1080×1920 e reduzir (o grupo A volta a 360×640 por causa do teto de bytes).

## 3. BLOCO-BASE (cole no início de TODO prompt e anexe o arquivo atual da cena como referência de estilo)

> Redo the attached battle background keeping its exact pixel-art style, palette, lighting and theme, but change the camera: a LOW camera close to the ground, like a Game Boy / Game Boy Advance Pokémon battle scene seen in three-quarter view. Show two flat elliptical stone platforms lying on the ground: a LARGE one near the camera at the bottom-left (ellipse centre at 33% from the left edge and 81% from the top, about 67% of the image width wide and 6% of its height tall) and a SMALLER one farther away at the upper-right (ellipse centre at 70% from the left and 39% from the top, about 44% of the width wide and 4% of the height tall). The ground recedes in perspective from the near platform toward the far one, with the horizon in the upper third and the scenery behind the far platform. The platforms are flat, empty, plain surfaces. No characters, no creatures, no text, no UI. No purple, no magenta, no gears or cogs. Fully opaque image, no transparency, no checkerboard. Keep the top 10% and the bottom 25% calm and slightly darker so interface bars read well.

A frase de proporção vai SEMPRE por último: `Vertical 9:16 full-bleed composition.`

## 4. Prompts por cena (BLOCO-BASE + "Theme to keep" + frase de proporção)

### Grupo A: por elemento (combate/bg-*.png, Duelo)

**Elemento agua** · anexar `src/assets/soulmon/combate/bg-agua.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: water: lake or sea shore, turquoise water. Vertical 9:16 full-bleed composition.

**Elemento ar** · anexar `src/assets/soulmon/combate/bg-ar.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: air: open sky with drifting clouds. Vertical 9:16 full-bleed composition.

**Elemento arcano** · anexar `src/assets/soulmon/combate/bg-arcano.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: arcane: runes and glowing crystal ruins. Vertical 9:16 full-bleed composition.

**Elemento eletricidade** · anexar `src/assets/soulmon/combate/bg-eletricidade.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: electricity: storm with lightning. Vertical 9:16 full-bleed composition.

**Elemento espaco** · anexar `src/assets/soulmon/combate/bg-espaco.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: space: floating rock in a starfield. Vertical 9:16 full-bleed composition.

**Elemento fogo** · anexar `src/assets/soulmon/combate/bg-fogo.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: fire: volcanic ground with embers. Vertical 9:16 full-bleed composition.

**Elemento gravidade** · anexar `src/assets/soulmon/combate/bg-gravidade.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: gravity: floating stones bending around a dark core. Vertical 9:16 full-bleed composition.

**Elemento luz** · anexar `src/assets/soulmon/combate/bg-luz.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: light: bright sunlit temple plaza (this one needs a DARK platform tone). Vertical 9:16 full-bleed composition.

**Elemento marcial** · anexar `src/assets/soulmon/combate/bg-marcial.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: martial: stone training courtyard. Vertical 9:16 full-bleed composition.

**Elemento morte** · anexar `src/assets/soulmon/combate/bg-morte.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: death: misty graveyard of pale bones. Vertical 9:16 full-bleed composition.

**Elemento neutro** · anexar `src/assets/soulmon/combate/bg-neutro.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: neutral: calm turquoise open field. Vertical 9:16 full-bleed composition.

**Elemento som** · anexar `src/assets/soulmon/combate/bg-som.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: sound: resonant canyon with sound rings. Vertical 9:16 full-bleed composition.

**Elemento sombra** · anexar `src/assets/soulmon/combate/bg-sombra.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: shadow: dim twilight ruins. Vertical 9:16 full-bleed composition.

**Elemento tempo** · anexar `src/assets/soulmon/combate/bg-tempo.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: time: ruined clock plaza with sand. Vertical 9:16 full-bleed composition.

**Elemento terra** · anexar `src/assets/soulmon/combate/bg-terra.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: earth: rocky canyon floor. Vertical 9:16 full-bleed composition.

**Elemento vida** · anexar `src/assets/soulmon/combate/bg-vida.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: life: lush glade. Vertical 9:16 full-bleed composition.

**Elemento vigor** · anexar `src/assets/soulmon/combate/bg-vigor.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: vigor: sunlit rocky arena with banners. Vertical 9:16 full-bleed composition.

**Elemento vileza** · anexar `src/assets/soulmon/combate/bg-vileza.png` · uso: DuelScreen
> [BLOCO-BASE] Theme to keep: vileness: murky swamp edge. Vertical 9:16 full-bleed composition.

### Grupos B a F: cenas de bg/ (dungeonScenes.ts)

**Gruta Azul** · anexar `src/assets/soulmon/bg/dungeon-1.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: blue grotto with glowing blue crystals. Vertical 9:16 full-bleed composition.

**Caverna Verde** · anexar `src/assets/soulmon/bg/dungeon-2.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: green cavern with moss and glowing plants. Vertical 9:16 full-bleed composition.

**Salão Dourado** · anexar `src/assets/soulmon/bg/dungeon-3.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: golden hall with warm copper light. Vertical 9:16 full-bleed composition.

**Abismo Violeta (sem violeta)** · anexar `src/assets/soulmon/bg/dungeon-4.png` · uso: Masmorra e ARENA_SCENE do Duelo
> [BLOCO-BASE] Theme to keep: deep abyss ledge in teal and deep blue, NO violet. Vertical 9:16 full-bleed composition.

**Fenda Rósea (sem rosa)** · anexar `src/assets/soulmon/bg/dungeon-5.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: rift fissure with warm copper glow, NO pink. Vertical 9:16 full-bleed composition.

**Ruína Submersa** · anexar `src/assets/soulmon/bg/dungeon-6.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: sunken ruin underwater. Vertical 9:16 full-bleed composition.

**Forja das Almas** · anexar `src/assets/soulmon/bg/dungeon-7.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: soul forge with copper embers, no gears. Vertical 9:16 full-bleed composition.

**Necrópole de Ossos** · anexar `src/assets/soulmon/bg/dungeon-8.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: bone necropolis in pale grey-green. Vertical 9:16 full-bleed composition.

**Núcleo de Dados** · anexar `src/assets/soulmon/bg/dungeon-9.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: glowing teal data core, no gears. Vertical 9:16 full-bleed composition.

**Céu Partido** · anexar `src/assets/soulmon/bg/dungeon-10.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: shattered sky with floating islands. Vertical 9:16 full-bleed composition.

**Corredor em Ruínas** · anexar `src/assets/soulmon/bg/minigame-dino.png` · uso: Masmorra (arquivo também é fundo do Dino: gerar arquivo novo de combate)
> [BLOCO-BASE] Theme to keep: ruined stone hall. Vertical 9:16 full-bleed composition.

**Arena Noturna** · anexar `src/assets/soulmon/bg/tournament-night.png` · uso: Masmorra e Arena livre
> [BLOCO-BASE] Theme to keep: night arena with torches. Vertical 9:16 full-bleed composition.

**Coliseu Ancião** · anexar `src/assets/soulmon/bg/tournament-final.png` · uso: Masmorra e Arena livre (também fundo do ResultScreen do Torneio: arquivo novo)
> [BLOCO-BASE] Theme to keep: elder colosseum in warm sand light. Vertical 9:16 full-bleed composition.

**Caverna Cristalina** · anexar `src/assets/soulmon/bg/dungeon-caverna-cristalina.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: crystal cavern. Vertical 9:16 full-bleed composition.

**Cidade em Ruínas** · anexar `src/assets/soulmon/bg/dungeon-cidade-em-ruinas.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: ruined city streets. Vertical 9:16 full-bleed composition.

**Costa Vulcânica** · anexar `src/assets/soulmon/bg/dungeon-costa-vulcanica.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: volcanic coast. Vertical 9:16 full-bleed composition.

**Floresta de Outono** · anexar `src/assets/soulmon/bg/dungeon-floresta-de-outono.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: autumn forest. Vertical 9:16 full-bleed composition.

**Ilhas do Céu** · anexar `src/assets/soulmon/bg/dungeon-ilhas-do-ceu.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: sky isles. Vertical 9:16 full-bleed composition.

**Jardim Lunar** · anexar `src/assets/soulmon/bg/dungeon-jardim-lunar.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: moon garden. Vertical 9:16 full-bleed composition.

**Oásis do Deserto** · anexar `src/assets/soulmon/bg/dungeon-oasis-deserto.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: desert oasis. Vertical 9:16 full-bleed composition.

**Penhasco de Bambu** · anexar `src/assets/soulmon/bg/dungeon-penhasco-de-bambu.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: bamboo cliff. Vertical 9:16 full-bleed composition.

**Pico Nevado** · anexar `src/assets/soulmon/bg/dungeon-pico-nevado.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: snowy peak. Vertical 9:16 full-bleed composition.

**Recife Profundo** · anexar `src/assets/soulmon/bg/dungeon-recife-profundo.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: deep reef. Vertical 9:16 full-bleed composition.

**Biblioteca Perdida** · anexar `src/assets/soulmon/bg/dungeon-interior-biblioteca.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: lost library interior. Vertical 9:16 full-bleed composition.

**Forja de Cristal** · anexar `src/assets/soulmon/bg/dungeon-interior-forja.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: crystal forge interior, no gears. Vertical 9:16 full-bleed composition.

**Taverna da Lareira** · anexar `src/assets/soulmon/bg/dungeon-interior-taverna.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: hearth tavern interior. Vertical 9:16 full-bleed composition.

**Estufa-Laboratório** · anexar `src/assets/soulmon/bg/dungeon-interior-laboratorio-estufa.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: greenhouse lab interior. Vertical 9:16 full-bleed composition.

**Templo das Águas** · anexar `src/assets/soulmon/bg/dungeon-interior-templo.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: water temple interior. Vertical 9:16 full-bleed composition.

**Bazar Escondido** · anexar `src/assets/soulmon/bg/dungeon-interior-bazar.png` · uso: Masmorra
> [BLOCO-BASE] Theme to keep: hidden bazaar interior. Vertical 9:16 full-bleed composition.

**Jardim Flutuante** · anexar `src/assets/soulmon/bg/dungeon-classic-retro.png` · uso: Masmorra e Rogue andar 1
> [BLOCO-BASE] Theme to keep: floating garden. Vertical 9:16 full-bleed composition.

**Terraço dos Dois Sóis** · anexar `src/assets/soulmon/bg/dungeon-classic-vhs.png` · uso: Masmorra e Rogue andar 2
> [BLOCO-BASE] Theme to keep: terrace of two suns. Vertical 9:16 full-bleed composition.

**Observatório Partido** · anexar `src/assets/soulmon/bg/dungeon-classic-sol.png` · uso: Masmorra e Rogue andar 3
> [BLOCO-BASE] Theme to keep: broken observatory. Vertical 9:16 full-bleed composition.

**Lago-Espelho** · anexar `src/assets/soulmon/bg/dungeon-classic-crt.png` · uso: Masmorra e Rogue andar 4
> [BLOCO-BASE] Theme to keep: mirror lake. Vertical 9:16 full-bleed composition.

**Arquipélago Fraturado** · anexar `src/assets/soulmon/bg/dungeon-classic-glitch.png` · uso: Masmorra e Rogue andar 5
> [BLOCO-BASE] Theme to keep: fractured archipelago. Vertical 9:16 full-bleed composition.

**Pesadelo: Abismo Glitch** · anexar `src/assets/soulmon/bg/pesadelo-abismo-glitch.png` · uso: Pesadelo
> [BLOCO-BASE] Theme to keep: dark glitch abyss with cyan accents, NO purple. Vertical 9:16 full-bleed composition.

**Pesadelo: Corredor Impossível** · anexar `src/assets/soulmon/bg/pesadelo-corredor-impossivel.png` · uso: Pesadelo
> [BLOCO-BASE] Theme to keep: impossible corridor, dark teal. Vertical 9:16 full-bleed composition.

**Pesadelo: Quarto sem Fim** · anexar `src/assets/soulmon/bg/pesadelo-quarto-sem-fim.png` · uso: Pesadelo
> [BLOCO-BASE] Theme to keep: endless room, dark teal. Vertical 9:16 full-bleed composition.

## 5. Mudanças de código que acompanham a arte nova

1. **Nada de posição precisa ser unificado**: `stageLayout` já é única. Se alguém mudar `meSize`/`fr` (ex.: inimigo 1v1 em `[0.7, 0.42]`), refazer os percentuais do BLOCO-BASE.
2. **Plataforma do código vs. da arte**: `Platform` desenha `sombra-clara.png` por cima do cenário. Com plataforma pintada na arte, desligar esse `<img>` (ou deixar só como sombra suave) para não dobrar a elipse.
3. **Largura varia** (`cover` corta os lados): validar em 360, 390 e 412 px; se o corte desalinhar, ancorar o `stageLayout` à proporção 9:16 da imagem.
4. **Grupo A** volta a 360×640 e paleta limitada (teto de 400 KB do `orcamentoDeBytes`).
5. **`minigame-dino.png` e `tournament-final.png` têm outros usos** (Dino, ResultScreen): gerar arquivos novos de combate em vez de sobrescrever.
6. **Chefe da Feira** não passa cena; dar perspectiva lá é trabalho de código (passar `scene`), com posição própria (chefe no alto, centro). Fora deste lote.
