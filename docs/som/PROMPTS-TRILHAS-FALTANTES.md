# Prompts para as trilhas que faltam (03/11/2026)

> **Etiqueta:** pedido do dono ("uma trilha para cada minigame, diferente para Rift e Masmorra"). Este documento
> **não decide nada e não altera `src/`**: só entrega prompts de Suno e diz onde cada faixa se encaixa. As regras de
> som são as de `docs/SOM.md` (D11, S2, S3, S9, R-NOVA). Os prompts estão em inglês (o Suno rende melhor); o resto, em português.

## 1. Inventário do que toca hoje

O diretor é `src/utils/musica.ts` (tabela `FAIXA_DE_COMBATE`); o manifesto é `MUSICAS_DE_COMBATE` em
`src/utils/sonsAssets.ts`; os arquivos moram em `public/sounds/`. Em 03/11/2026 existiam **7 faixas** (⚠️ 04/11/2026: entraram `tema-respiracao` e `tema-chama`, `SOM.md` §17; a Respiração não usa mais `meditacao`):

| Faixa | Arquivo | Superfície (`Superficie`) |
|---|---|---|
| Stone Hall Decay (tema) | `tema-stone-hall-decay` | `casa` (Home e páginas) |
| Stone Hall Combat | `musica-combate` | `masmorra` (lutas da descida), `arena`, `torneio`, `duelo` |
| Stone Hall Nightmare | `musica-pesadelo` | `pesadelo` |
| Dungeon Theme | `tema-masmorra` | `masmorra-mapa` (Fenda entre lutas e Calabouço) |
| Evolution Theme | `tema-evolucao` | `evolucao` |
| Meditation Theme | `tema-meditacao` | `meditacao` (Respiração e Bolhas calmas) |
| A Parede | `tema-parede` | `intro` |

Situação de cada atividade (lida no código; `entrarNaSuperficie` só é chamado nos componentes que aparecem com faixa própria ou compartilhada):

| Atividade | Componente | Trilha hoje |
|---|---|---|
| Corrida com obstáculos (dino) | `DinoGame.tsx` | **nenhuma** (segue o tema da Home) |
| Pedra·Papel·Tesoura | `RPSGame.tsx` | **nenhuma** (tema da Home) |
| Chuva de Almas (barrage) | `SoulBarrage.tsx` | **nenhuma** (tema da Home) |
| Fusão Elemental (match3) | `Match3Game.tsx` | **nenhuma** (tema da Home) |
| Eco | `mente/EcoGame.tsx` | **nenhuma** (tema da Home) |
| Trilha (zip) | `mente/ZipGame.tsx` | **nenhuma** (tema da Home) |
| Colcha (patches) | `mente/PatchesGame.tsx` | **nenhuma** (tema da Home) |
| Picross | `mente/PicrossGame.tsx` | **nenhuma** (tema da Home) |
| Troca | `mente/TrocaGame.tsx` | **nenhuma** (tema da Home) |
| Revisão | `mente/RevisaoGame.tsx` | **nenhuma** (tema da Home) |
| Bolhas (foco) | `mente/BolhasGame.tsx` com `calma` falso | **nenhuma**; a variante calma usa `meditacao` |
| Refúgio, Respiração | `refugio/RespiracaoGame.tsx` | `meditacao` (compartilhada com Bolhas calmas) |
| Arena | `ArenaGame.tsx` | `combate` (**compartilhada**) |
| Torneio (lobby) | `TournamentPage.tsx` | `combate` (**compartilhada**) |
| Duelo | `DuelScreen.tsx` | `combate` (**compartilhada**) |
| Fenda Sem Fim (Endless Rift) | `DungeonGame.tsx` | `masmorra-mapa` entre lutas, `combate` nas lutas (**compartilhada** com Arena/Duelo e com o Calabouço) |
| Calabouço / Masmorra | `RogueDungeon.tsx` | `masmorra-mapa` = Dungeon Theme (**compartilhada** com a Fenda) |
| Pesadelo | `NightmareBattle.tsx` | `pesadelo` (própria) |
| Chefe da Feira | `guild/FeiraEventoSheet.tsx` | **nenhuma** (a Feira é muda; tema da Home) |
| Evolução, intro | `EvolutionCeremony.tsx`, `IntroCinematica.tsx` | próprias |

**Faltam 17 faixas:** as 11 atividades sem trilha (dino, ppt, barrage, match3, eco, zip, colcha, picross, troca,
revisão, bolhas de foco), mais Arena, Torneio e Duelo (hoje dividem o Combate), o Chefe da Feira, e as duas
separações pedidas (Fenda Sem Fim e Calabouço). Dino, Chuva de Almas e Fusão são os que o dono nomeou; os demais entram pela regra "uma por minigame".

## 2. Regras comuns a todos os prompts

- **Identidade Soulmon:** arcano e místico, cristal turquesa escuro, natureza com um fio digital/mecânico sutil
  (relógio de quartzo, grão de glitch, harpa de cristal). Calma até no combate. **Não é steampunk** (nada de engrenagem a
  vapor, apito, metal pesado). **Sem vocais** (`instrumental` no estilo).
- **Loop:** o player (`streamMusica.ts`) recomeça o arquivo com fade-in e uma pausa (`pausaEntreVoltasS`), então a faixa
  precisa de **começo e fim limpos** (intro curta, fade-out de 3 s na masterização, tônica no fim) e não depende de
  loop sem emenda. Prefira 90-150 s nos minijogos (rodadas curtas) e 180-220 s nas lutas e na exploração.
- **Nível:** a faixa chega masterizada para o alvo de música de `utils/loudness.ts` (−22,0 LUFS-S; ≤ −16 LUFS integrado, ≤ −1 dBTP).
  Minijogo de pensar fica mais baixo e esparso; ação pode ter pulso.
- **Codec (SOM.md §1, S9):** dois arquivos por faixa, `public/sounds/<arquivo>.webm` (Opus 64 kbps, estéreo, sem
  metadados nem capa) e `<arquivo>.m4a` (AAC-LC 64 kbps, faststart), ≤ 2,5 MB cada, fora do pré-cache e do S6.
  Convenção de nome: `tema-<chave>` para exploração/calma e `musica-<chave>` para ação, como as existentes.
- **Plugue (igual para todas, não repetido abaixo):** (1) incluir a chave em `MUSICAS_DE_COMBATE` (e no `satisfies
  Record<...>`) de `sonsAssets.ts` com `nome`, `duracaoS` (medida), `pausaEntreVoltasS`, `fadeInS`, `origem`,
  `geradoEm` e `formatos` com SHA-256 e bytes; (2) acrescentar a `Superficie` em `musica.ts`, em `FAIXA_DE_COMBATE` e em
  `SUPERFICIE_EM_COMBATE` (`true` só se for luta); (3) chamar `useEffect(() => entrarNaSuperficie('<superficie>'), [])`
  no componente; (4) trim em `TRIM_MUSICAS_DE_COMBATE_DB` (`loudness.ts`) e linha em `docs/Attributions.md` no mesmo passo
  (origem, prompt, data, hash); (5) atualizar `musica.test.ts` e `sonsAssets.contract.test.ts`. **R-NOVA:** hoje esses
  jogos são mudos de propósito; ligar a trilha é decisão consciente, e o gesto de abrir o jogo dá o consentimento (D11).
- **Formato do Suno:** *Style* (≤ 200 caracteres) e, quando ajuda, *Description* com a estrutura.

## 3. Os prompts

### 3.1 Corrida com obstáculos (dino)
Arquivo `musica-corrida` · superfície `corrida` · `DinoGame.tsx` · `SUPERFICIE_EM_COMBATE`: false.
Mecânica: corre sem parar e pula no ritmo; o pulso ajuda o salto, sem estresse. 120 s · 112 BPM · Ré dórico.
- **Style:** `instrumental, light arcane chiptune-meets-crystal, 112 bpm, D dorian, steady pulse, glass marimba, soft square bass, airy pad, calm focus`
- **Description:** Endless-runner theme for a small spirit creature running through a moonlit crystal forest. Four-bar arpeggio loop on glass marimba over a soft pulsing bass, a faint digital shimmer, no drums harder than a brushed kick. 4-bar intro, ends on the tonic. Mystical and calm, never frantic.

### 3.2 Pedra·Papel·Tesoura (ppt)
`tema-ppt` · superfície `ppt` · `RPSGame.tsx`. Mecânica: melhor de poucas rodadas, tensão leve de "qual ele vai jogar". 90 s · 92 BPM · Lá menor.
- **Style:** `instrumental, playful mystic, 92 bpm, A minor, plucked harp, hand percussion, glass bells, light suspense, calm`
- **Description:** Cheerful standoff music for a hand game between two spirit creatures. Plucked harp riff with clapping hand percussion and sparse crystal bell stabs on the off-beats, a short call-and-answer phrase that suggests "guess my move". Warm and teasing, never aggressive. Clean ending on A.

### 3.3 Chuva de Almas (barrage)
`musica-chuva-almas` · superfície `chuva-almas` · `SoulBarrage.tsx` · `SUPERFICIE_EM_COMBATE`: true (é ação, com boss a cada 600 pts). Mecânica: esquiva e dispara numa chuva de almas. 150 s · 128 BPM · Mi menor.
- **Style:** `instrumental, cosmic arcade, shimmering synth arpeggios, 128 bpm, E minor, pulsing bass, glass percussion, rising tension, starlight`
- **Description:** Bullet-heaven theme under a sky raining glowing souls, dark turquoise palette. Fast crystalline arpeggios over a driving but soft pulse, builds in 16-bar waves and drops back to calm so a boss section can ride on the denser layer. Mystical, not industrial. Ends on E minor.

### 3.4 Fusão Elemental (match3)
`tema-fusao` · superfície `fusao` · `Match3Game.tsx`. Mecânica: combinar elementos, cascata satisfatória sem pressa. 120 s · 100 BPM · Fá maior.
- **Style:** `instrumental, magical puzzle, 100 bpm, F major, celesta, kalimba, warm pad, bubbling arpeggios, elemental chimes, gentle`
- **Description:** Relaxed match-three music about elements fusing: water, fire, leaf, stone, light. Celesta and kalimba trade short motifs, a soft chime rises when phrases resolve like a cascade, light digital grain underneath. Cozy and satisfying, no urgency. Ends on the tonic.

### 3.5 Eco
`tema-eco` · superfície `eco` · `mente/EcoGame.tsx`. Mecânica: memorizar e repetir uma sequência que cresce. O jogo é mudo por decisão (sem tom por pedra, `PROPOSTA-SOM-MINIJOGOS-2026-09-30.md` §3), então a faixa **não pode ter notas definidas nem melodia** que soem como o jogo. 120 s · 70 BPM · Dó eólio, sem melodia marcada.
- **Style:** `instrumental, ambient, cave echoes, 70 bpm, C aeolian, sparse sustained pads, distant reverb, soft sub drone, no melody`
- **Description:** Underground cavern ambience for a memory game, long reverb tails, a slow breathing drone, rare soft water drops. No recognizable tune and no distinct pitched notes that could be mistaken for the game's own cues. Meditative focus. Fades to near silence at the end.

### 3.6 Trilha (zip)
`tema-zip` · superfície `zip` · `mente/ZipGame.tsx`. Mecânica: traçar um caminho único ligando pontos. 120 s · 84 BPM · Sol lídio.
- **Style:** `instrumental, forest path, 84 bpm, G lydian, soft acoustic guitar, flute, gentle strings, flowing, hint of crystal glitch, calm`
- **Description:** A winding path through luminous moss and crystal roots. Fingerpicked guitar that never stops moving, a breathy flute line that traces long arcs, a soft string bed. One flowing bar after another, no sharp accents. Peaceful and concentrated. Ends on G.

### 3.7 Colcha (patches)
`tema-colcha` · superfície `colcha` · `mente/PatchesGame.tsx`. Mecânica: encaixar retalhos numa colcha. 120 s · 76 BPM · Ré maior.
- **Style:** `instrumental, cozy folk lullaby, 76 bpm, D major, felt piano, music box, soft strings, warm, handmade, tiny crystal chimes`
- **Description:** Quiet crafting music for stitching a patchwork quilt by lamplight. Felt piano and music box play a simple repeating figure, a warm string pad underneath, tiny turquoise chimes as accents. Tender, unhurried, nostalgic. Ends on the tonic.

### 3.8 Picross
`tema-picross` · superfície `picross` · `mente/PicrossGame.tsx`. Mecânica: dedução lógica, silêncio de raciocínio. 150 s · 80 BPM · Mi bemol maior.
- **Style:** `instrumental, minimalist, 80 bpm, Eb major, soft piano, light vibraphone, faint ticking pulse, clean, contemplative`
- **Description:** Logic-puzzle background about slowly revealing a picture. Sparse piano figure, soft vibraphone, a faint quartz-clock tick underneath. Clean and uncluttered so it never distracts from counting cells. One quiet idea that slowly evolves. Ends on the tonic.

### 3.9 Troca
`tema-troca` · superfície `troca` · `mente/TrocaGame.tsx`. Mecânica: separar cartas e perceber a regra que muda. O som não pode entregar a mudança, então **sem mudança de clima ao longo da faixa**. 90 s · 104 BPM · Si bemol maior.
- **Style:** `instrumental, light curious jazz-tinged, 104 bpm, Bb major, pizzicato strings, soft vibraphone, brushed drums, steady, even`
- **Description:** Upbeat but even sorting-game music for quick decisions. Pizzicato strings, vibraphone, brushed kit, the same texture from start to finish with no sudden section changes. Light and alert. Ends on the tonic.

### 3.10 Revisão
`tema-revisao` · superfície `revisao` · `mente/RevisaoGame.tsx`. Mecânica: virar cartões, estudar com calma. 180 s · 66 BPM · Lá bemol maior.
- **Style:** `instrumental, calm study, 66 bpm, Ab major, warm piano, soft pad, light rain texture, slow, comforting`
- **Description:** Gentle study-session music for reviewing flashcards. Slow warm piano chords with a soft sustained pad and distant rain, almost no rhythm. Long phrases, no climax. Ends on the tonic with a long tail.

### 3.11 Bolhas (foco)
`tema-bolhas` · superfície `bolhas` · `mente/BolhasGame.tsx`, só quando `calma` for falso (a calma segue com `meditacao`). Mecânica: estourar sonhos claros por 60 s. 90 s · 108 BPM · Dó maior.
- **Style:** `instrumental, bubbly, light, 108 bpm, C major, marimba, water droplets, soft synth bass, sparkling glass, cheerful`
- **Description:** Playful 60-second pop-the-bubbles theme under water. Marimba hooks, liquid droplet textures, soft round bass, glassy sparkles. Bright but gentle, with nothing sharp that could be confused with the game's own pop. Ends on C.

### 3.12 Arena (separar do Combate)
`musica-arena` · superfície `arena` (já existe) · `ArenaGame.tsx` · `SUPERFICIE_EM_COMBATE`: true. Mecânica: rodadas de combate em arena. 180 s · 120 BPM · Ré menor.
- **Style:** `instrumental, epic arcane, 120 bpm, D minor, soft taiko drums, cello ostinato, crystal pads, rising, controlled`
- **Description:** Duel-arena theme in a hall of dark turquoise crystal, round after round. Cello ostinato and deep soft drums, bright glass accents on the offbeats, builds in clear eight-bar steps and resets so each round feels like a fresh start. Heroic but composed, not aggressive. Ends on D.

### 3.13 Torneio (lobby)
`tema-torneio` · superfície `torneio` (já existe) · `TournamentPage.tsx` · `SUPERFICIE_EM_COMBATE`: false (o lobby NÃO é luta). Mecânica: espera, ranking, preparação. 180 s · 96 BPM · Sol menor.
- **Style:** `instrumental, ceremonial, 96 bpm, G minor, soft brass-like swells, harp, bells, anticipatory, noble, calm`
- **Description:** Waiting-hall music before a tournament match. Harp ostinato, slow synth swells like distant horns, far bells, a feeling of banners and anticipation. Only a soft heartbeat pulse for percussion. Ends on G.

### 3.14 Duelo (separar do Combate)
`musica-duelo` · superfície `duelo` (já existe) · `DuelScreen.tsx` · `SUPERFICIE_EM_COMBATE`: true. Mecânica: PvP contra outro treinador, resultado do servidor. 180 s · 132 BPM · Mi menor.
- **Style:** `instrumental, tense arcane duel, 132 bpm, E minor, driving staccato strings, glassy synth lead, taiko hits, sharp but clean`
- **Description:** One-on-one duel music, tenser and faster than the Arena track. Staccato strings drive the pulse, a glassy synth lead plays a short answering motif that suggests two sides trading blows. Never gritty or distorted. Resolves on E minor with no outro jingle.

### 3.15 Fenda Sem Fim (Rift), distinta da Masmorra
`musica-rift` · superfície nova `rift` · `DungeonGame.tsx`, **em toda a Fenda**, mapa e luta (hoje usa `masmorra-mapa` e `combate`; o componente decide pela prop de ranking `riftSaveId` ou pela rota da Fenda). `SUPERFICIE_EM_COMBATE`: true. Mecânica: descida infinita, camadas que só ficam mais fundo, ranking mensal; a faixa sugere **profundidade e vazio** (o cristal vira vazio, o digital aparece mais). 210 s · 100 BPM · Fá sustenido menor, cresce por camadas.
- **Style:** `instrumental, endless descent, dark ambient with pulse, 100 bpm, F# minor, sub drone, glassy arps, slow rising layers, void, mystical`
- **Description:** Theme for an infinite rift that goes deeper with every floor. Starts with a sub drone and one crystal arpeggio, and adds a layer every 16 bars (soft kick, higher glass line, digital shimmer) without ever resolving; it ends by falling back to the drone. Cold, vast, dark turquoise, a touch of glitch. Not heroic, not steampunk. Last note is a low sustained F#.

### 3.16 Calabouço / Masmorra (RogueDungeon), distinta da Fenda
`tema-calabouco` · superfície nova `calabouco` · `RogueDungeon.tsx` (hoje `masmorra-mapa`); a Dungeon Theme atual deixa de servir ao Calabouço. `SUPERFICIE_EM_COMBATE`: false (exploração por mapa; as lutas seguem com `combate`). Mecânica: explorar salas, escolher caminhos, risco medido; **terroso, orgânico, pedra e raiz**, com ritmo de passos. 200 s · 88 BPM · Dó menor.
- **Style:** `instrumental, exploration, ancient stone dungeon, 88 bpm, C minor, low flute, plucked strings, frame drum, dripping water, mossy, curious`
- **Description:** Roguelite dungeon-crawl exploration music through old stone rooms with moss and roots. Slow frame-drum footsteps, plucked strings, a low breathy flute exploring a modal theme, water drips and a faint crystal hum. Curious and slightly uneasy, warm earth tones rather than the Rift's void. Resolves on C.

### 3.17 Chefe da Feira
`musica-feira-chefe` · superfície nova `feira-chefe` · `guild/FeiraEventoSheet.tsx`, só quando o evento ativo for o chefe (o resto da Feira segue mudo, R-NOVA); `SUPERFICIE_EM_COMBATE`: false (a folha é lobby de clã; o ataque 1×/dia é tocado pela `BossFightScreen`, que pode ganhar a mesma faixa depois). Mecânica: o clã inteiro bate num chefe grande ao longo do dia. 150 s · 90 BPM · Ré menor.
- **Style:** `instrumental, communal fantasy fair with looming boss, 90 bpm, D minor, folk strings, deep drums, low synth brass, ominous but warm`
- **Description:** A village fair at dusk with a giant shadow on the horizon. A folk dance rhythm and warm strings are shadowed by slow deep drums and a low brass line that signal the boss; cooperative and ominous, not scary. Ends on D with a long low note.

## 4. Fora desta lista

Pesadelo, Evolução, Meditação e a intro já têm faixa própria e ficam como estão. Para trocar uma delas, use o mesmo formato e a regra de reprodução fiel do CLAUDE.md global.

## 5. Ordem sugerida de geração

1. Rift e Calabouço (a separação mais audível e a que o dono pediu por nome).
2. Dino, Chuva de Almas, Fusão (os três nomeados).
3. Arena, Duelo, Torneio.
4. Os minijogos da Mente (Eco, Zip, Colcha, Picross, Troca, Revisão, Bolhas), Chefe da Feira e ppt.

Cada geração rende 2 a 3 versões no Suno; o dono escolhe de ouvido (S8: fone **e** alto-falante de celular).
Nenhum arquivo entra no repo sem a linha em `docs/Attributions.md` no mesmo commit.
