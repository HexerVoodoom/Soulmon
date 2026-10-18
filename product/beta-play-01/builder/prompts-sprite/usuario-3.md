# Usuário 3 — Iara Nascimento Pires (simulado)

Gerado com o código REAL (branch integ/beta-2) via `buildSoulProfile` + `generateOracleComplete` (seed fixa 3003). Nenhuma API chamada.

## 1. Entrada

- Nome: Iara Nascimento Pires
- Nascimento: 2001-03-15 14:05, Recife
- Quiz de 6 perguntas: grupo=cuida, objetivo=cuidar, pressao=flui, energia=natureza, lugar=praia, conflito=defende
- Teste de 20 itens (padrão sintético "mix"): openness 63, conscientiousness 58, extraversion 44, agreeableness 56, neuroticism 50, honestyHumility 67

## 2. Eixos lidos (OracleAxes)

- Elemento: **agua** (secundário: planta) — top: ar 15.64, luz 14.92, industrial 14.61
- Papel: **suporte** — top: magico 22.46, fisico 21.45, suporte 21.09
- Alinhamento: **benevolencia** — harmonia 35.84, benevolencia 32.75, poder 31.41
- Reino: **oceano** — top: gelo 13.59, campina 12.71, picos 12.01
- Elementos de classe: Aceleração, Morte, Luz

## 3. Saída do oráculo

- Arquétipo: healing and blooming mandrake / Mandrágora curador e florescente
- Nome-base: **Verdirea**
- Família: Eel (electric eel) + Tree (oak), mono=false
- Fusão: electric eel + oak
- Bio EN: Tide Priestess of the electric eel-oak bloodline, marked by something root-laced. Bonded with a Lesser Angel companion.
- Conceito EN: Eel family (electric eel) + Tree (oak), born in the Deep Ocean realm 🌊. Water element with Plant traits, Benevolence alignment (Benevolence attribute), Support role — incarnation of the archetype "healing and blooming mandrake". From the rookie, 3 evolution lines branch out (Power, Harmony and Benevolence), and the three Megas fuse into the Ultra.
- Criatura do bestiário que inspirou o estágio 0: Puffy Verde · companheiro capturado: anjo_menor
- Caminho escolhido para a linha completa: **benevolencia (benevolence)**

## 4. Linha completa rookie → champion → ultimate → mega → ultra (caminho benevolence)

### rookie — Verdirea (Awakened / Desperto)

- formId: `rookie` · caracteres do prompt: **816** (fallback: 609)
- Provedor: Higgsfield Soul, rota `/v1/text2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: nenhuma (text2image)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): Verdirea is the base form: a small, simple little monster where the electric eel-oak blend already shows, selfless and watchful. All 3 evolution lines branch from here. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Puffy Verde. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. a pint-sized simple shape. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-benevolence — BellVerdirea (Ascendant / Ascendente)

- formId: `champion-benevolence` · caracteres do prompt: **839** (fallback: 636)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): BellVerdirea — Champion of the Benevolence (Benevolence) line: Verdirea evolves into a flower dragon with petal wings, selfless and watchful. Bigger and wilder, yet with the same face and crest. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Goldeen. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. it has evolved into a flower dragon with petal wings. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultimate-benevolence — ArchVerdirea (Transcendent / Transcendente)

- formId: `ultimate-benevolence` · caracteres do prompt: **857** (fallback: 648)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do champion escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): ArchVerdirea — Perfect of the Benevolence (Benevolence) line: full metamorphosis — it becomes a glacier maiden crowned with aurora ice. Its element materializes (a small living garden sprouting along the spine) and a nautilus-spiral emblem of the Deep Ocean marks its body. Same face, same crest. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Tubarão Negro. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. it has transformed into a glacier maiden crowned with aurora ice. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### mega-benevolence — SeraphVerdirea (Apotheosis / Apoteose)

- formId: `mega-benevolence` · caracteres do prompt: **869** (fallback: 659)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do ultimate escolhido (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): SeraphVerdirea — Mega of the Benevolence (Benevolence) line: the apotheosis — it ascends as an aurora stag god with antlers of northern lights. Guardian seraph apotheosis. Its body partially transmutes into living Water. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Tubarão Veneno. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. in its final form, it is an aurora stag god with antlers of northern lights. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### ultra — TriuneVerdirea (Zenith / Zênite)

- formId: `ultra` · caracteres do prompt: **871** (fallback: 669)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do mega atual (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): TriuneVerdirea is the Ultra: the fusion of the three Megas — a doom serpent vast enough to bite the horizon, a world-tree avatar with continents of moss on its shoulders and an aurora stag god with antlers of northern lights — into a single transcendent being uniting the ferocity of Power, the balance of Harmony and the nobility of Benevolence. The absolute apex of the archetype "healing and blooming mandrake". Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Skrelp. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. a supreme combined silhouette, the ultra fusion of its three mega forms. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with red, cyan and gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 5. Champions das outras 2 ramificações (comparação)

### champion-power — RageVerdirea (Ascendant / Ascendente)

- formId: `champion-power` · caracteres do prompt: **856** (fallback: 653)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): RageVerdirea — Champion of the Power (Power) line: Verdirea evolves into a savage four-legged wolf beast with bristling fur, fierce and sharp-witted. Bigger and wilder, yet with the same face and crest. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Goldeen. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. it has evolved into a savage four-legged wolf beast with bristling fur. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with red accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

### champion-harmony — SageVerdirea (Ascendant / Ascendente)

- formId: `champion-harmony` · caracteres do prompt: **855** (fallback: 652)
- Provedor: Higgsfield Soul, rota `/v1/image2image/soul`, `width_and_height 1536x1536`, `quality 720p`, `batch_size 1`
- Referência de imagem anexada: sprite do rookie (URL republicada `/api/sprite-image?k=...`; só 1 referência; mesmo a ultra)
- Fundo: sem chroma; pede "no background, transparent background"; pós-processo no cliente remove fundo CLARO conectado às bordas e reduz a grid 16x16 / 4 cores
- Descrição exibida ao jogador (EN): SageVerdirea — Champion of the Harmony (Harmony) line: Verdirea evolves into a sleek quadruped beast with a blade-tipped tail, serene and observant. Bigger and wilder, yet with the same face and crest. Caretaker profile: strengthens, heals and keeps the group standing. Seeks to care for, protect and uplift those around.

```text
Generate an original creature for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Draw inspiration from Goldeen. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. it has evolved into a sleek quadruped beast with a blade-tipped tail. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with cyan accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## 6. Variante fallback (sem referências de franquia, sem "Draw inspiration from")

Usada quando o provedor recusa por política (isRefusal). Idêntica ao prompt principal menos duas frases. Exemplo (rookie):

```text
Generate an original creature for a monster-raising RPG. Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: electric eel-oak, Tide Priestess, root-laced, hourglass and clockwork motifs. a pint-sized simple shape. Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left. Flat turquoise and pearl-white colors with gold accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

Os demais 10 fallbacks seguem a mesma regra (ver dados-brutos.json).
