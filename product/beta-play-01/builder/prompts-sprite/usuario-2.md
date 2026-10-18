# Usuário 2 — Caio Mendes Albuquerque (simulado)

Gerado com o código REAL (branch integ/beta-2) via `buildSoulProfile` + `generateOracleComplete` (seed fixa 2002). Nenhuma API chamada.

## 1. Entrada

- Nome: Caio Mendes Albuquerque
- Nascimento: 1988-12-02 23:15, Manaus
- Quiz de 6 perguntas: grupo=planeja, objetivo=sabedoria, pressao=recolhe, energia=noite, lugar=oculto, conflito=estrategia
- Teste de 20 itens (padrão sintético "lo"): openness 38, conscientiousness 8, extraversion 19, agreeableness 44, neuroticism 69, honestyHumility 17

## 2. Eixos lidos (OracleAxes)

- Elemento: **sombra** (secundário: nenhum) — top: sombra 19.83, agua 16.74, fogo 13.57
- Papel: **magico** — top: magico 30.97, suporte 25.45, fisico 20.44
- Alinhamento: **harmonia** — harmonia 36.51, poder 35, benevolencia 28.49
- Reino: **akasha** — top: akasha 15.48, oceano 14.53, pantano 13.8
- Elementos de classe: Trovão, Vigor, Sombra

## 3. Saída do oráculo

- Arquétipo: enigmatic and nocturnal eclipse / Eclipse enigmático e noturno
- Nome-base: **Animade**
- Família: Reptile (komodo dragon) + Reptile (komodo dragon), mono=true
- Fusão: komodo dragon + komodo dragon
- Bio EN: Void Mage of the komodo dragon bloodline. Bonded with a Lesser Phoenix companion.
- Conceito EN: Reptile family (monitor), born in the Akasha Realm realm 🌗. pure Shadow element, Harmony alignment (Harmony attribute), Magic damage role — incarnation of the archetype "enigmatic and nocturnal eclipse". From the rookie, 3 evolution lines branch out (Power, Harmony and Benevolence), and the three Megas fuse into the Ultra.
- Criatura do bestiário que inspirou o estágio 0: Agumon -Yuki no Kizuna- · companheiro capturado: fenix_menor
- Caminho escolhido para a linha completa: **harmonia (harmony)**

## 4. Linha completa rookie → champion → ultimate → mega → ultra (caminho harmony)

### rookie — Animade (Awakened / Desperto)

- formId: `rookie` · caracteres do prompt: **815** (fallback: 596)
- Provedor: Higgsfield Soul, rota `/v1/text2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: nenhuma (text2image)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): Animade is the base form: a small, simple little monster where the komodo dragon family already shows, patient and resourceful. All 3 evolution lines branch from here. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Agumon -Yuki no Kizuna-. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. small and simple with a big head. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-harmony — EchoAnimade (Ascendant / Ascendente)

- formId: `champion-harmony` · caracteres do prompt: **839** (fallback: 624)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): EchoAnimade — Champion of the Harmony (Harmony) line: Animade evolves into a mystic fox with multiple flowing tails, contemplative and precise. Bigger and wilder, yet with the same face and crest. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Doomguard Guerreiro. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. it has evolved into a mystic fox with multiple flowing tails. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultimate-harmony — AstraAnimade (Transcendent / Transcendente)

- formId: `ultimate-harmony` · caracteres do prompt: **853** (fallback: 630)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do champion escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): AstraAnimade — Perfect of the Harmony (Harmony) line: full metamorphosis — it becomes an enigmatic sphinx posing eternal riddles. Its element materializes (a veil of dusk that dims the light around it) and a twin-crescent emblem of light and shadow of the Akasha Realm marks its body. Same face, same crest. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Demônio do Círculo Radiação. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. it has transformed into an enigmatic sphinx posing eternal riddles. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### mega-harmony — AeonAnimade (Apotheosis / Apoteose)

- formId: `mega-harmony` · caracteres do prompt: **865** (fallback: 649)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do ultimate escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): AeonAnimade — Mega of the Harmony (Harmony) line: the apotheosis — it ascends as a world-tree avatar with continents of moss on its shoulders. World-clock apotheosis. Its body partially transmutes into living Shadow. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Belphemon(Rage Mode). Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. in its final form, it is a world-tree avatar with continents of moss on its shoulders. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultra — TriuneAnimade (Zenith / Zênite)

- formId: `ultra` · caracteres do prompt: **866** (fallback: 657)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do mega atual (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): TriuneAnimade is the Ultra: the fusion of the three Megas — a twin-souled yin-yang beast, half light and half shadow, a world-tree avatar with continents of moss on its shoulders and a citadel guardian colossus sheltering a tiny town on its back — into a single transcendent being uniting the ferocity of Power, the balance of Harmony and the nobility of Benevolence. The absolute apex of the archetype "enigmatic and nocturnal eclipse". Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Eligor Divino. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. a towering tri-part fusion silhouette, the ultra fusion of its three mega forms. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with red, cyan and gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 5. Champions das outras 2 ramificações (comparação)

### champion-power — DarkAnimade (Ascendant / Ascendente)

- formId: `champion-power` · caracteres do prompt: **843** (fallback: 628)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): DarkAnimade — Champion of the Power (Power) line: Animade evolves into a hooded venomous serpent with dripping fangs, voracious and fearless. Bigger and wilder, yet with the same face and crest. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Doomguard Guerreiro. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. it has evolved into a hooded venomous serpent with dripping fangs. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-benevolence — HolyAnimade (Ascendant / Ascendente)

- formId: `champion-benevolence` · caracteres do prompt: **847** (fallback: 632)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): HolyAnimade — Champion of the Benevolence (Benevolence) line: Animade evolves into a giant dawn songbird with radiant tail feathers, gentle and protective. Bigger and wilder, yet with the same face and crest. Arcane profile: channels unseen forces and wins through the mind. Seeks balance, knowledge and the natural flow of things.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Doomguard Guerreiro. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. it has evolved into a giant dawn songbird with radiant tail feathers. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 6. Variante fallback (sem referências de franquia, sem "Draw inspiration from")

Usada quando o provedor recusa por política (isRefusal). Idêntica ao prompt principal menos duas frases. Exemplo (rookie):

```text
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: komodo dragon, Void Mage, sound-wave ripple markings. small and simple with a big head. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat midnight blue and smoky black colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

Os demais 10 fallbacks seguem a mesma regra (ver dados-brutos.json).
