# Usuário 1 — Helena Ribeiro Duarte (simulado)

Gerado com o código REAL (branch integ/beta-2) via `buildSoulProfile` + `generateOracleComplete` (seed fixa 1001). Nenhuma API chamada.

## 1. Entrada

- Nome: Helena Ribeiro Duarte
- Nascimento: 1994-07-23 05:40, Curitiba
- Quiz de 6 perguntas: grupo=ataca, objetivo=conquistar, pressao=explode, energia=sol, lugar=extremos, conflito=enfrenta
- Teste de 20 itens (padrão sintético "hi"): openness 100, conscientiousness 75, extraversion 94, agreeableness 38, neuroticism 50, honestyHumility 83

## 2. Eixos lidos (OracleAxes)

- Elemento: **fogo** (secundário: industrial) — top: industrial 18.06, fogo 14.19, terra 14.02
- Papel: **fisico** — top: fisico 23.61, alcance 20.53, tanque 20.41
- Alinhamento: **poder** — poder 37.76, harmonia 34.87, benevolencia 27.37
- Reino: **deserto** — top: deserto 12.71, cavernas 12.65, picos 12.35
- Elementos de classe: Fogo Feiticeiro, Eletricidade, Terra

## 3. Saída do oráculo

- Arquétipo: untamable and ingenious phoenix / Fênix indomável e engenhoso
- Nome-base: **Gearhex**
- Família: Elemental (earth elemental) + Eel (eel), mono=false
- Fusão: earth elemental + eel
- Bio EN: Berserker of the earth elemental-eel bloodline, marked by something polluted. Bonded with a Voltaic Automaton companion.
- Conceito EN: Elemental family (earth elemental) + Eel (eel), born in the Arid Desert realm 🏜️. Fire element with Industrial traits, Power alignment (Power attribute), Physical damage role — incarnation of the archetype "untamable and ingenious phoenix". From the rookie, 3 evolution lines branch out (Power, Harmony and Benevolence), and the three Megas fuse into the Ultra.
- Criatura do bestiário que inspirou o estágio 0: Spider Ancião · companheiro capturado: automato
- Caminho escolhido para a linha completa: **poder (power)**

## 4. Linha completa rookie → champion → ultimate → mega → ultra (caminho power)

### rookie — Gearhex (Awakened / Desperto)

- formId: `rookie` · caracteres do prompt: **801** (fallback: 592)
- Provedor: Higgsfield Soul, rota `/v1/text2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: nenhuma (text2image)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): Gearhex is the base form: a small, simple little monster where the earth elemental-eel blend already shows, voracious and fearless. All 3 evolution lines branch from here. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Spider Ancião. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. a tiny bouncy body. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-power — GrimGearhex (Ascendant / Ascendente)

- formId: `champion-power` · caracteres do prompt: **840** (fallback: 634)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): GrimGearhex — Champion of the Power (Power) line: Gearhex evolves into a haunted marionette with living strings, bold and territorial. Bigger and wilder, yet with the same face and crest. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Chelicerae. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. it has evolved into a haunted marionette with living strings. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultimate-power — WarGearhex (Transcendent / Transcendente)

- formId: `ultimate-power` · caracteres do prompt: **846** (fallback: 639)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do champion escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): WarGearhex — Perfect of the Power (Power) line: full metamorphosis — it becomes a chained war minotaur with cracked horns. Its element materializes (bolted mechanical augments, pistons and antenna arrays) and a scarab-seal emblem of the Arid Desert marks its body. Same face, same crest. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Deathweaver. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. it has transformed into a chained war minotaur with cracked horns. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### mega-power — ZeedGearhex (Apotheosis / Apoteose)

- formId: `mega-power` · caracteres do prompt: **854** (fallback: 643)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do ultimate escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): ZeedGearhex — Mega of the Power (Power) line: the apotheosis — it ascends as a dragon overlord clad in black spiked armor. Grand-gladiator apotheosis. Its body partially transmutes into living Fire. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Spidoc Vermelho. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. in its final form, it is a dragon overlord clad in black spiked armor. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultra — TriuneGearhex (Zenith / Zênite)

- formId: `ultra` · caracteres do prompt: **872** (fallback: 668)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do mega atual (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): TriuneGearhex is the Ultra: the fusion of the three Megas — a dragon overlord clad in black spiked armor, a quicksilver divine duelist with liquid-metal blades and a life goddess of the eternal garden trailing blossoms — into a single transcendent being uniting the ferocity of Power, the balance of Harmony and the nobility of Benevolence. The absolute apex of the archetype "untamable and ingenious phoenix". Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Ettercap. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. a towering tri-part fusion silhouette, the ultra fusion of its three mega forms. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red, cyan and gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 5. Champions das outras 2 ramificações (comparação)

### champion-harmony — EchoGearhex (Ascendant / Ascendente)

- formId: `champion-harmony` · caracteres do prompt: **840** (fallback: 634)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): EchoGearhex — Champion of the Harmony (Harmony) line: Gearhex evolves into a proud beast with a blazing flame mane, curious and balanced. Bigger and wilder, yet with the same face and crest. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Chelicerae. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. it has evolved into a proud beast with a blazing flame mane. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-benevolence — BellGearhex (Ascendant / Ascendente)

- formId: `champion-benevolence` · caracteres do prompt: **848** (fallback: 642)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): BellGearhex — Champion of the Benevolence (Benevolence) line: Gearhex evolves into a gentle snow yeti guardian with icicle bracers, warm-hearted and brave. Bigger and wilder, yet with the same face and crest. Competitive profile: melee combat, direct and relentless. Seeks to conquer, master challenges and leave a mark on the world.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Chelicerae. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. it has evolved into a gentle snow yeti guardian with icicle bracers. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 6. Variante fallback (sem referências de franquia, sem "Draw inspiration from")

Usada quando o provedor recusa por política (isRefusal). Idêntica ao prompt principal menos duas frases. Exemplo (rookie):

```text
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: earth elemental-eel, Berserker, polluted, glowing rune markings. a tiny bouncy body. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat sunset orange and molten-gold colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

Os demais 10 fallbacks seguem a mesma regra (ver dados-brutos.json).
