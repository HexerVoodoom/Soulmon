# Prompts de arte — MERCADO (a Galeria de Caixotes)

> Etiqueta: **plano / só-prompts** (29/09/2026). Nada foi gerado. Fonte: `docs/design/areas/00-BIBLIA-DAS-AREAS.md` §2.2, §3, §4.2, §5, §6 · blocos de estilo de `docs/ASSETS-A-GERAR.md` §1 · paleta do Visor (`manual/04`). O dono gera no Higgsfield quando houver crédito; depois `arte-conferente` → `arte-instalador`.

## Escopo (o que entra e o que NÃO entra)

Entra (bíblia §6, item 1): fundo do Mercado (refeito, A5), lote **Conquistas** (novo; hoje é o placeholder compartilhado), NPCs **Medra** (novo) e **Tamba / Musga / Panora** (refeitos em alta, BACKLOG-CREDITOS #5–#7).
Não entra: lotes `itens`, `decoracao`, `background` (têm arte própria e a bíblia não manda refazer — só fica a checagem de que a silhueta deles não colide com o novo fundo) e **Grom** (anfitrião, existe, sem ajuste na §4.3).
Nomes fora do que a bíblia definiu não se inventam aqui.

## Âncora de estilo da área (COPIAR IDÊNTICA no início de todo prompt)

```
[MERCADO-ANCHOR] Retro pixel art, 16-bit era, clean chunky pixels, hard aliased edges, NO anti-aliasing blur, NO soft glow, NO gradients, near-black 1px outline (#061414). Area: "the Crate Gallery" — an old mine turned into a bazaar, everything stacked in rectangular crates, shelves and scaffolds. Palette: deep petrol teal #0E2E2E / #123232 and near-black green as the base; brass/amber accent #D9A441 (lantern light, brass fittings); deep copper #8A5A2B / #C98B4B for hardware and frames; cream #EFE3C2 for awning stripes and paper; turquoise cyan #6EFFFB used ONLY as tiny spark points (the only living energy). Material: crate wood + striped canvas awning + brass. Light: warm point lanterns, small pools of amber light on a dark scene, lit from the upper right. Shape language: RECTANGULAR STACKED (boxes, shelves, scaffolding), straight horizontal and diagonal lines; awnings striped petrol/cream; loading crane and thin chimneys with a thread of steam on the skyline; creeping vines over the structure. FORBIDDEN: magenta, purple, violet, pink, red or orange as energy or fire, crystals on the ground, skulls or bones, text, letters, numbers, logos, UI, frame, border, human hands, generic humans, any existing franchise character, creature or name.
```

Comum a todos: em caso de erro de atributo, **anexar a imagem aprovada e pedir reprodução fiel**, não redescrever. Transparência: pedir **fundo verde chapado `#00FF00`** e recortar por chroma-key (`chroma-key.mjs`); nunca "transparent PNG"; nunca xadrez. A proporção vai no FIM do prompt.

---

## 1. `bg-mercado` — fundo da área

| Campo | Valor |
|---|---|
| Família | `cenario` (subtipo fundo de área) |
| Destino | `src/assets/soulmon/areas/bg-mercado.png` (substitui; import em `areas/index.ts`) |
| Dimensão | gerar 9:16 e reduzir para **760×1344**, ≤ 400 KB após WebP |
| Alfa | **não** (fundo cheio). Sem faixa preta/letterbox |
| Perspectiva | isométrica de cima; **este NÃO é o palco do pet**, então o chão-74% não se aplica — o que vale é a regra de clareiras abaixo |

**Clareiras vazias** onde os lotes pousam (centro da base, `areaSheetCopy.ts`): Itens 26%/33%, Decoração 72%/33%, Background 26%/55%, Conquistas 72%/55% (x/y em % do quadro). Cada clareira ~ 300 px de largura livre, chão liso de pátio de tábua/trilho, **sem nenhum objeto, sem estrutura, sem luz forte** dentro delas.

**Prompt**
```
[MERCADO-ANCHOR]
Isometric top-down view of a mine-turned-bazaar courtyard seen from above, TALL VERTICAL PORTRAIT 9:16. Dark petrol-teal floor of packed planks and old mine rail tracks running diagonally. Around the edges only: stacked crates in tiers, scaffolding, striped petrol-and-cream canvas awnings, a loading crane silhouette and thin chimneys with a thin thread of steam at the top edge, brass lanterns hanging from poles casting SMALL warm amber pools of light on the dark planks. Vines creeping over crates. A few tiny turquoise spark points. Keep FOUR wide empty flat clearings of bare plank floor, each about a quarter of the image width, centred at these positions: (26% from left, 33% from top), (72%, 33%), (26%, 55%), (72%, 55%) — NOTHING inside them, no props, no shadows from objects, calm and readable. Lower 8 percent is continuous plank floor, no black band. No crystals anywhere. Mostly dark values, value contrast low-to-medium, with amber light pools as the only bright areas. No characters, no creatures, no text. Tall vertical portrait 9:16, full-bleed composition.
```
**Negative**: `crystals, blue crystal, purple, magenta, pink, violet, red fire, skull, bones, text, letters, numbers, logo, UI, border, frame, characters, creatures, humans, buildings inside the clearings, black bands, blur, gradient glow, anti-aliasing`

**Seeds**: gerar **4** (seeds diferentes). Escolher a que (1) tem as 4 clareiras realmente vazias (sobrepor grade 26/72 × 33/55), (2) tem guindaste + toldo listrado legíveis no topo, (3) menos cristal/azul. Se sair azul-cristal dominante, trocar o sujeito ("crates and lanterns"), não só a cor.

**Aceite (arte-conferente)**: silhueta preta do skyline = guindaste diagonal + toldos horizontais retos; a 64 px de largura em cinza, distinguível de Exploração (névoa uniforme, muito escura) e de Arena (clara, dente de serra); Mercado tem **poças de luz** sobre fundo baixo-médio. Zero cristal. Varredura de matiz 270°–340° = 0. Clareiras vazias medidas. Peso final dentro do orçamento.

---

## 2. `lote-mercado-conquistas` — guindaste-mostruário

| Campo | Valor |
|---|---|
| Família | `cenario` (lote) |
| Destino | `src/assets/soulmon/areas/lote-mercado-conquistas.png` (substitui o `lote-loja-conquistas` compartilhado — a instalação troca o import em `areas/index.ts`; renomear é decisão do instalador, registrar no `INSTALAR.md`) |
| Dimensão | gerar **768×768**, recortar **300×300**, tamanho relativo 1,0 (cabe inteiro) |
| Alfa | **real** (gerar sobre `#00FF00`, chroma-key) |
| Ponto de ancoragem | **centro da base no centro-inferior do quadro**; sombra de contato inclusa e sólida (sem semitransparência) |

**Prompt**
```
[MERCADO-ANCHOR]
Single isometric pixel-art building on a PURE SOLID GREEN #00FF00 background, nothing else behind it. Subject: a "display crane" — a tall brass lattice-truss tower with one long DIAGONAL jib arm, and from its chain a chest (a small wooden trunk with brass corners) hoisted in mid-air, with a single round medal hanging from the chain beneath the chest. Base of the tower sits on a small plank platform with a flat solid contact shadow. Crate-wood, brass truss, a few cream awning stripes on a small counter at the base, tiny amber lantern, tiny turquoise spark. Silhouette must read as: vertical truss tower + diagonal arm + hanging object. The base centre is at the bottom centre of the frame, the whole structure fits inside the frame with a small margin. Square 1:1 full-bleed composition.
```
**Negative**: `green on the object, checkerboard, transparent-looking pattern, purple, magenta, pink, text, numbers, letters, human, skull, red fire, glow, blur, soft shadow, background scenery`

**Seeds**: **4**. Escolher a de silhueta preta mais clara (torre + braço diagonal + objeto suspenso) e sem verde vazando na borda.

**Aceite**: teste da silhueta preta lado a lado com carroça (Itens, rodas), casa-caixote (Decoração) e tenda de molduras (Background): é a única com braço diagonal + objeto suspenso; escala de cinza distinta; alfa real (canto = 0); base centrada; sem halo verde; sem roxo/rosa.

---

## 3. `npc-mercado-conquistas` — Medra (jabuti de casco de latão)

| Campo | Valor |
|---|---|
| Família | `criatura` (NPC, busto — **prompt escrito à mão porque NPC de lote não vem do oráculo**; seguir o bloco de estilo da área) |
| Destino | `src/assets/soulmon/npcs/npc-mercado-conquistas.png`; `LOT_NPC_ART` em `npcs/index.ts`; voz em `LOT_NPC_VOICE` |
| Dimensão | **768×768**, busto da cintura para cima, 3/4 olhando para a **esquerda** |
| Alfa | real (gerar sobre `#00FF00`), contorno preto 1 px |

**Prompt**
```
[MERCADO-ANCHOR]
Bust portrait of an old wise tortoise NPC, waist-up, three-quarter view facing LEFT, on a PURE SOLID GREEN #00FF00 background. Calm, memory-keeping expression, half-closed kind eyes, wrinkled skin in muted olive-teal. Its shell is made of brass plates, each plate engraved with a simple medal emblem (no letters, no numbers), moss growing at the shell's rim, a couple of tiny turquoise spark points. Warm amber lantern light from the upper right. Original creature design. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```
**Negative**: `green on the character, purple, magenta, pink, text, letters, numbers, human, hands, skull, red, glow, blur, checkerboard, background scenery, logo`

**Seeds**: **3**. Escolher: leitura inequívoca de jabuti + casco com placas de latão (não tartaruga marinha), olhar para a esquerda, alfa limpo.
**Aceite**: silhueta preta = cabeça + casco em cúpula com borda; não parece nenhum personagem de franquia; latão/âmbar coerente com o fundo; sem roxo.

---

## 4. `npc-mercado-itens` — Tamba (caranguejo-eremita, concha-gaveteiro)

Refeito em alta (a arte atual `npc-loja-itens` é rascunho). Destino `src/assets/soulmon/npcs/npc-mercado-itens.png`; os imports `LOT_NPC_ART['mercado:itens']` passam a apontar para o novo. 768², alfa real, busto 3/4 esquerda.

**Prompt**
```
[MERCADO-ANCHOR]
Bust portrait of a small precise hermit-crab NPC the size of a dog, waist-up view, three-quarter view facing LEFT, on a PURE SOLID GREEN #00FF00 background. Its shell is a brass chest of six small drawers with tiny knobs (stacked rectangular, one drawer half open, held by its claw). Body in muted teal-grey with cream markings, two antennae with turquoise tips, attentive counting expression. Amber lantern light from the upper right. Original creature design. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```
**Negative**: `green on the character, purple, magenta, pink, text, letters, numbers, human, hands, skull, red, glow, blur, checkerboard, scenery`
**Seeds**: **3**. Escolher a que mostra as **seis** gavetas e a garra abrindo uma.
**Aceite**: silhueta = retângulo empilhado (concha) + antenas + garra; distinta de Medra (cúpula) em preto; sem roxo.

## 5. `npc-mercado-decoracao` — Musga (lesma de musgo com quarto nas costas)

Destino `src/assets/soulmon/npcs/npc-mercado-decoracao.png`. 768², alfa real.

**Prompt**
```
[MERCADO-ANCHOR]
Bust portrait of a big slow moss slug NPC, waist-up view, three-quarter view facing LEFT, on a PURE SOLID GREEN #00FF00 background. On its back it carries a whole tiny room like a snail shell: a plank roof, a small window glowing warm amber, crate-wood walls, a little vine on the roof. Body in soft moss-green and teal, gentle homey expression, half-lidded eyes on short stalks. Original creature design. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```
**Negative**: `green on the character, purple, magenta, pink, text, letters, numbers, human, hands, skull, red, glow, blur, checkerboard, scenery, snail shell spiral`
**Seeds**: **3**. Escolher a com quarto retangular legível (janela acesa) e não concha espiral.
**Aceite**: silhueta = corpo baixo + caixa com telhado nas costas; única com telhado inclinado; alfa limpo; sem roxo.

## 6. `npc-mercado-background` — Panora (lula de terra com manto-tela)

Destino `src/assets/soulmon/npcs/npc-mercado-background.png`. 768², alfa real.

**Prompt**
```
[MERCADO-ANCHOR]
Bust portrait of a dreamy land-squid NPC, waist-up view, three-quarter view facing LEFT, on a PURE SOLID GREEN #00FF00 background. Cream-coloured body; its mantle is a stretched canvas screen in a thin copper frame showing a small pixel landscape (hills, a horizon, rain clouds in teal, cream and amber only), soft wistful expression, tentacles curled. A few turquoise spark points. Original creature design. Do not copy any existing franchise character. Square 1:1 full-bleed composition.
```
**Negative**: `green on the character, purple, magenta, pink, violet sky, text, letters, numbers, human, hands, skull, red, glow, blur, checkerboard, scenery outside the mantle`
**Seeds**: **3**. Escolher a com paisagem no manto sem tons roxos/rosados (céu em petróleo/creme/âmbar) e moldura de cobre legível.
**Aceite**: silhueta = manto retangular emoldurado + tentáculos; distinta de Tamba/Musga/Medra; varredura 270°–340° = 0 (paisagem do manto é o ponto de risco).

---

## Tabela de produção (ordem da bíblia §6, item 1)

| id | tipo | nº de imagens estimado | prioridade |
|---|---|---|---|
| `bg-mercado` | fundo de área (cenario) | 4 | 1 |
| `lote-mercado-conquistas` | lote (alfa) | 4 | 2 |
| `npc-mercado-conquistas` (Medra) | NPC novo | 3 | 3 |
| `npc-mercado-itens` (Tamba) | NPC refeito | 3 | 4 |
| `npc-mercado-decoracao` (Musga) | NPC refeito | 3 | 5 |
| `npc-mercado-background` (Panora) | NPC refeito | 3 | 6 |

**Total: 6 ativos, 20 imagens** (mais reprises só se o aceite reprovar). Depois de gerar: `INSTALAR.md` em `_gemini_out/cenarios-<data>/` e `criaturas-<data>/` com o destino acima, sha256 e a nota de que `lote-loja-conquistas` deixa de ser usado por Mercado (o placeholder ainda serve Laboratório:stats e Hall:guilda até essas áreas chegarem — não apagar).
