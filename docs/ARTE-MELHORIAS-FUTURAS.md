# Art improvements backlog (Combat v3 pieces installed as-is) / Melhorias futuras de arte

Run `combate-v3-01`. Owner decision (06/10/2026): the pieces that escaped the Gemini prompt are used AS THEY ARE; this file records what to regenerate later. Decisão do dono (06/10/2026): as peças que fugiram do prompt entram COMO ESTÃO; este arquivo registra o que regerar depois.

Original asks: `INVENTARIO-ASSETS.md` of the run (`D:\soulmon-runstate\docs\squad-alpha-runs\combate-v3-01\builder\`). Pedidos originais: o mesmo arquivo.

---

## English

### Context

The Combat v3 sheets came back from Gemini with 11 single pieces and one FX sheet that do not match the prompt, and `fx-target-down` was never generated. Every installed piece went through the standard pipeline (slice by alpha, despill, islands under 24 px removed, bbox, nearest, inventory size) into `src/assets/soulmon/combate-v3/<group>/<id>.png`. Priority: P0 blocks a clean read in the HUD, P1 poor but usable, P2 polish, P3 almost fine.

Check not done: the 16 px grayscale-on-`#0B3A40` readability test required by the inventory, mandatory for `st-buff-atk` x `st-buff-spd` and `st-hot` x `st-cura`. With the current art, `st-buff-atk` and `st-buff-spd` are the same blob plus chevron and are expected to fail it.

### Pieces

| id | path | came | asked | problem | prio |
|---|---|---|---|---|---|
| `st-buff-atk` | `src/assets/soulmon/combate-v3/status/st-buff-atk.png` | clenched fist + upward chevron | short copper sword + upward chevron (64px) | Silhouette collision: the fist belongs to `strike-melee`, the sword to `attr-atk`. 16 px grayscale test (vs st-buff-spd) not run. Prompt deviation. | P0 |
| `st-buff-spd` | `src/assets/soulmon/combate-v3/status/st-buff-spd.png` | bare foot / paw print + upward chevron | winged boot + upward chevron | Silhouette collision with `tal-pvp-03` (also a footprint); close to st-buff-atk at 16 px. Prompt deviation. | P0 |
| `st-debuff-def` | `src/assets/soulmon/combate-v3/status/st-debuff-def.png` | cracked heart + amber chevron | cracked shield + downward chevron | Heart collides with `tal-pve-03` and reads as health, not DEF; rule C1 wants a cracked SHIELD outside the body. Prompt deviation. | P1 |
| `st-hot` | `src/assets/soulmon/combate-v3/status/st-hot.png` | plus cross + round seal with a mark | cross inside an OPEN ring (gap at 1 o'clock) | Differs from `st-cura` only by a side seal; the required 16 px grayscale test vs st-cura was not run. Prompt deviation. | P1 |
| `oficio-combate_fisico` | `src/assets/soulmon/combate-v3/atributos/oficio-combate_fisico.png` | brass knuckles on a bandaged forearm, diagonal | bandaged forearm guard with OPEN hand, no fist (96px) | Knuckle duster is a fist: breaks the one-fist-owner rule (`strike-melee`) and the tone. Thin and diagonal, weak at 16 px. | P2 |
| `fx-dot-loop (1-6 + sheet)` | `src/assets/soulmon/combate-v3/fx/fx-dot-loop-{1..6}.png`, `src/assets/soulmon/combate-v3/fx/fx-dot-loop-sheet.png` | a small crystal creature with legs, dripping, 6 frames | warm amber ember drops dripping down (apply 1-2, loop 3-6) | Not the asked effect: an object instead of drops, and it fills the center where the creature should be. Cyan instead of amber, so it does not read as damage over time. Small inside the 128 cell. | P1 |
| `tal-pvp-01` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-01.png` | sword | diamond tip piercing a ring | Collision: sword is the `attr-atk` owner. Prompt deviation. | P2 |
| `tal-pvp-02` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-02.png` | broken shield | bracer with a diamond stud | Collides with `st-debuff-def` / `attr-def` (shield). Prompt deviation. | P2 |
| `tal-pvp-03` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-03.png` | footprint with blue wisps | dashing arrow with three speed lines | Collides with `st-buff-spd` (footprint). Low-contrast wisps at 16 px. | P1 |
| `tal-pvp-06` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-06.png` | cracked water drop | ember smothered under a lid | Reads as water/cure; collides with `tal-pve-03` (drop) and breaks the amber = damage logic. | P2 |
| `tal-pvp-07` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-07.png` | four-point star in a diamond frame | diamond emblem crowned by a star | Close to the ask; the crown merges into the frame. Low risk. | P3 |
| `tal-pve-06` | `src/assets/soulmon/combate-v3/talentos/tal-pve-06.png` | two shields | arch of light over a small creature | Collides with `st-escudo`, `attr-def` and `tal-pve-02` (shield family). Prompt deviation. | P2 |
| `tal-pve-07` | `src/assets/soulmon/combate-v3/talentos/tal-pve-07.png` | cyan crystal in copper brackets | arch crest crowned by a star | Collides with `eq-nucleo-t1/t2` (same crystal). Prompt deviation. | P2 |
| `tal-pve-02` | `src/assets/soulmon/combate-v3/talentos/tal-pve-02.png` | segmented armor plate | wall of stone blocks | Collides with `eq-carapaca-*`. Installed with reservation. | P2 |
| `tal-pve-03` | `src/assets/soulmon/combate-v3/talentos/tal-pve-03.png` | cyan heart in copper frame | cyan drop rising inside a ring | Heart collides with the cracked heart of `st-debuff-def`. Installed with reservation. | P2 |
| `tal-com-03` | `src/assets/soulmon/combate-v3/talentos/tal-com-03.png` | coin with circular double arrow | hourglass over a coin | Circular arrows are the `talent-respec` owner. Installed with reservation. | P2 |
| `tal-com-07` | `src/assets/soulmon/combate-v3/talentos/tal-com-07.png` | coin with leaf wreath | coin crest crowned by a star | No crown star; the wreath reads as nature. Installed with reservation. | P3 |
| `eq-nucleo-t1 / t2` | `src/assets/soulmon/combate-v3/equip/eq-nucleo-t1.png`, `src/assets/soulmon/combate-v3/equip/eq-nucleo-t2.png` | two almost identical crystals (t2 slightly more polished) | t1 plain copper, t2 polished copper with cyan inlay, visible craftsmanship growth | Tiers hard to tell apart at 48 px; also collide with `tal-pve-07`. Installed with reservation. | P2 |
| `fx-target-down (faltante / missing)` | (nao gerado / not generated) | nothing: the sheet was never produced | 3x2 sheet, 128 px frames: a soft outline loosening into cyan threads drifting down and fading, calm, no skull, no explosion | Not generated, nothing installed. Do not reuse `fx/fx-defeat.png`. | P1 |

### Corrected Gemini prompts

One piece per new conversation. Attach `docs/ui-refs/REF-kit-v12.png` plus the sibling named in the prompt. Every prompt ends with the STYLE block below and the line `Square 1:1 full-bleed composition.`. Single icons also need the background clause (`#00FF00`, then chroma-key). If an approved piece of the same element exists, attach it and ask for a faithful reproduction instead of describing the shape again.

STYLE block:

> [STYLE] Crisp 16-bit pixel art, hard pixel edges, no blur, near-black #0D0D0D outline with an extra 1-pixel light cyan #6EFFF8 rim OUTSIDE the outline, light source top-left. STRICT palette only: deep teal #0B3A40, neon cyan #6EFFF8, copper #C68642, electric blue #1E9EFE, warm amber #D9822B, outline #0D0D0D, plus lighter tints. ABSOLUTELY NO magenta, purple, violet, pink or green anywhere. No text, letters or numbers. Match the attached references exactly.

Background clause for single icons: "on a solid flat pure green #00FF00 background; the item is a CUT-OUT object floating alone: no frame, no tile, no background shape, no green inside and no green fringe."

**`st-buff-atk`**
> A single 64x64 pixel-art status glyph: a short copper sword pointing up with a bold upward chevron beneath it, at most 2 inner colors, must read at 16 px in grayscale. NO fist, NO hand. Attach attr-atk as shape reference.

**`st-buff-spd`**
> A single 64x64 pixel-art status glyph: a winged boot with a bold upward chevron, at most 2 inner colors, readable at 16 px in grayscale. NO footprint, NO paw. Attach attr-spd as shape reference.

**`st-debuff-def`**
> A single 64x64 pixel-art status glyph: a cracked shield (heater shape, one zigzag crack) with a bold warm-amber downward chevron under it, at most 2 inner colors. NO heart. Attach the shield of attr-def as shape reference.

**`st-hot`**
> A single 64x64 pixel-art status glyph: a small cyan plus-cross centered inside an OPEN ring with a clear gap at the top right, at most 2 inner colors, distinct from a solid plus-cross (st-cura) at 16 px in grayscale. NO seal, NO side badge.

**`oficio-combate_fisico`**
> A single 96x96 pixel-art icon: a bandage-wrapped forearm guard with an OPEN hand, palm forward, upright and centered. NO fist, NO knuckle duster, NO weapon.

**`fx-dot-loop (1-6 + sheet)`**
> A pixel-art animation sheet of 6 frames in a 3x2 grid, each frame a 128x128 cell, on a solid flat pure green #00FF00 background; the item is a CUT-OUT object floating alone: no frame, no tile, no background shape, no green inside and no green fringe. Every particle has a #0D0D0D outline. Frames 1-2 = apply (one bright flash); frames 3-6 = seamless loop. Effect: warm amber (#D9822B) ember drops dripping downward. Leave an empty creature-sized space in the center of each frame. Attach fx-buff-loop-sheet as layout reference.

**`tal-pvp-01`**
> A single 96x96 pixel-art talent icon, electric blue accent: a diamond tip piercing a ring. NO sword, NO blade.

**`tal-pvp-02`**
> A single 96x96 pixel-art talent icon, electric blue accent: a forearm bracer with a diamond-shaped stud. NO shield.

**`tal-pvp-03`**
> A single 96x96 pixel-art talent icon, electric blue accent: a dashing arrow pointing right with three speed lines. NO footprint.

**`tal-pvp-06`**
> A single 96x96 pixel-art talent icon, electric blue accent: a small ember glowing under a closed lid (smothered). NO water drop.

**`tal-pvp-07`**
> A single 96x96 pixel-art talent icon, electric blue accent: a diamond crest with a small separate star floating above it as a crown.

**`tal-pve-06`**
> A single 96x96 pixel-art talent icon, copper accent: an arch of cyan light curving over a tiny creature silhouette. NO shield.

**`tal-pve-07`**
> A single 96x96 pixel-art talent icon, copper accent: a shield-arch crest with a small separate star above it as a crown. NO crystal.

**`tal-pve-02`**
> A single 96x96 pixel-art talent icon, copper accent: a short wall of stacked stone blocks. NO armor, NO plate.

**`tal-pve-03`**
> A single 96x96 pixel-art talent icon, copper accent: a cyan drop rising inside a ring. NO heart.

**`tal-com-03`**
> A single 96x96 pixel-art talent icon, neon cyan accent: an hourglass standing over a coin. NO circular arrows.

**`tal-com-07`**
> A single 96x96 pixel-art talent icon, neon cyan accent: a coin crest with a small separate star above it as a crown. NO leaves.

**`eq-nucleo-t1 / t2`**
> A single 96x96 pixel-art equipment icon: a faceted CORE gem. Tier 1: plain copper setting, small dull crystal. Tier 2: polished copper setting with cyan inlay lines and a larger, clearly different crystal silhouette. One tier per conversation. Attach the approved eq-nucleo-t3 as reference.

**`fx-target-down (faltante / missing)`**
> A pixel-art animation sheet of 6 frames in a 3x2 grid, each frame a 128x128 cell, on a solid flat pure green #00FF00 background; the item is a CUT-OUT object floating alone: no frame, no tile, no background shape, no green inside and no green fringe. Every cyan particle has a #0D0D0D outline. Frames 1-2 = start; frames 3-6 = seamless loop. Effect: a soft outline that loosens into cyan threads drifting downward and fading, calm, no skull, no explosion. Leave an empty creature-sized space in the center. Attach fx-debuff-loop-sheet as layout reference.


---

## Português (BR)

### Contexto

As folhas do Combate v3 voltaram do Gemini com 11 peças soltas e uma folha de FX fora do prompt, e o `fx-target-down` nunca foi gerado. Toda peça instalada passou pelo pipeline padrão (fatiar pelo alfa, despill, ilhas abaixo de 24 px, bbox, nearest, tamanho do inventário) para `src/assets/soulmon/combate-v3/<grupo>/<id>.png`. Prioridade: P0 impede leitura limpa no HUD, P1 pobre mas usável, P2 acabamento, P3 quase certo.

Verificação não feita: o teste de legibilidade a 16 px em cinza sobre `#0B3A40` exigido pelo inventário, obrigatório para `st-buff-atk` x `st-buff-spd` e `st-hot` x `st-cura`. Com a arte atual, `st-buff-atk` e `st-buff-spd` são o mesmo borrão com seta e devem reprovar.

### Peças

| id | caminho | veio | pedido | problema | prio |
|---|---|---|---|---|---|
| `st-buff-atk` | `src/assets/soulmon/combate-v3/status/st-buff-atk.png` | punho cerrado + seta para cima | espada de cobre curta + seta para cima (64px) | Colisão de silhueta: o punho é do `strike-melee` e a espada do `attr-atk`. Teste de 16 px em cinza (contra st-buff-spd) não feito. Fuga do prompt. | P0 |
| `st-buff-spd` | `src/assets/soulmon/combate-v3/status/st-buff-spd.png` | pegada de pé/pata + seta para cima | bota alada + seta para cima | Colisão de silhueta com `tal-pvp-03` (também pegada); parecido com st-buff-atk a 16 px. Fuga do prompt. | P0 |
| `st-debuff-def` | `src/assets/soulmon/combate-v3/status/st-debuff-def.png` | coração rachado + seta âmbar | escudo rachado + seta para baixo | Coração colide com `tal-pve-03` e lê como vida, não DEF; a regra C1 pede ESCUDO rachado fora do corpo. Fuga do prompt. | P1 |
| `st-hot` | `src/assets/soulmon/combate-v3/status/st-hot.png` | cruz + selo redondo com marca | cruz dentro de anel ABERTO (abertura a 1h) | Difere do `st-cura` só pelo selo lateral; o teste obrigatório de 16 px em cinza contra st-cura não foi feito. Fuga do prompt. | P1 |
| `oficio-combate_fisico` | `src/assets/soulmon/combate-v3/atributos/oficio-combate_fisico.png` | soqueira em antebraço enfaixado, na diagonal | antebraço enfaixado com mão ABERTA, sem punho (96px) | Soqueira é punho: quebra a regra de um dono para o punho (`strike-melee`) e o tom. Fina e diagonal, fraca a 16 px. | P2 |
| `fx-dot-loop (1-6 + sheet)` | `src/assets/soulmon/combate-v3/fx/fx-dot-loop-{1..6}.png`, `src/assets/soulmon/combate-v3/fx/fx-dot-loop-sheet.png` | pequeno cristal com patas, pingando, 6 quadros | gotas-brasa âmbar pingando (aplicar 1-2, loop 3-6) | Não é o efeito pedido: objeto em vez de gotas, e ocupa o centro onde fica a criatura. Ciano em vez de âmbar, não lê como dano contínuo. Pequeno dentro da célula 128. | P1 |
| `tal-pvp-01` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-01.png` | espada | ponta de losango furando um anel | Colisão: espada é do `attr-atk`. Fuga do prompt. | P2 |
| `tal-pvp-02` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-02.png` | escudo partido | braçadeira com cravo em losango | Colide com `st-debuff-def` / `attr-def` (escudo). Fuga do prompt. | P2 |
| `tal-pvp-03` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-03.png` | pegada com fiapos azuis | flecha de investida com 3 linhas | Colide com `st-buff-spd` (pegada). Fiapos de baixo contraste a 16 px. | P1 |
| `tal-pvp-06` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-06.png` | gota d'água rachada | brasa abafada sob tampa | Lê como água/cura; colide com `tal-pve-03` (gota) e quebra a lógica âmbar = dano. | P2 |
| `tal-pvp-07` | `src/assets/soulmon/combate-v3/talentos/tal-pvp-07.png` | estrela de quatro pontas em moldura de losango | emblema-losango coroado por estrela | Perto do pedido; a coroa se funde à moldura. Risco baixo. | P3 |
| `tal-pve-06` | `src/assets/soulmon/combate-v3/talentos/tal-pve-06.png` | dois escudos | arco de luz sobre criatura pequena | Colide com `st-escudo`, `attr-def` e `tal-pve-02` (família escudo). Fuga do prompt. | P2 |
| `tal-pve-07` | `src/assets/soulmon/combate-v3/talentos/tal-pve-07.png` | cristal ciano em colchetes de cobre | emblema-arco coroado por estrela | Colide com `eq-nucleo-t1/t2` (mesmo cristal). Fuga do prompt. | P2 |
| `tal-pve-02` | `src/assets/soulmon/combate-v3/talentos/tal-pve-02.png` | placa de armadura segmentada | muro de blocos de pedra | Colide com `eq-carapaca-*`. Instalada com ressalva. | P2 |
| `tal-pve-03` | `src/assets/soulmon/combate-v3/talentos/tal-pve-03.png` | coração ciano em moldura de cobre | gota ciano subindo num anel | Coração colide com o coração rachado do `st-debuff-def`. Instalada com ressalva. | P2 |
| `tal-com-03` | `src/assets/soulmon/combate-v3/talentos/tal-com-03.png` | moeda com seta circular dupla | ampulheta sobre moeda | Setas circulares são do `talent-respec`. Instalada com ressalva. | P2 |
| `tal-com-07` | `src/assets/soulmon/combate-v3/talentos/tal-com-07.png` | moeda com coroa de folhas | emblema-moeda coroado por estrela | Sem estrela-coroa; a coroa de folhas lê como natureza. Instalada com ressalva. | P3 |
| `eq-nucleo-t1 / t2` | `src/assets/soulmon/combate-v3/equip/eq-nucleo-t1.png`, `src/assets/soulmon/combate-v3/equip/eq-nucleo-t2.png` | dois cristais quase idênticos (t2 um pouco mais polido) | t1 cobre liso, t2 cobre polido com incrustação ciano, crescimento visível de ofício | Tiers difíceis de distinguir a 48 px; colidem também com `tal-pve-07`. Instalada com ressalva. | P2 |
| `fx-target-down (faltante / missing)` | (nao gerado / not generated) | nada: a folha nunca foi gerada | folha 3x2, quadros 128 px: contorno suave se desfazendo em fiapos ciano que descem e somem, calmo, sem caveira, sem explosão | Não gerado, nada instalado. Não reusar `fx/fx-defeat.png`. | P1 |

### Prompts Gemini corrigidos

Os prompts da seção em inglês são os que se cola no Gemini (ficam em inglês de propósito). Uma peça por conversa nova, anexando `docs/ui-refs/REF-kit-v12.png` mais o irmão citado no prompt, terminando com o bloco STYLE e a linha `Square 1:1 full-bleed composition.`. Ícones soltos pedem fundo `#00FF00` e recorte por chroma-key. Se existe peça aprovada do mesmo elemento, anexá-la e pedir reprodução fiel vale mais que descrever a forma de novo.
