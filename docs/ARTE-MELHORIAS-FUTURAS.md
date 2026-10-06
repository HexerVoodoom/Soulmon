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

---

## QA de acessibilidade visual a 16 px (medição de 06/10/2026)

Só medição; nenhuma imagem foi gerada nem alterada. Scripts e folhas de contato em `E:\tmp\artqa\` (`common.py`, `metrics.py`, `report.py`, `cvd.py`; folhas `sheet_*.png`, `pairs_fail_*.png`, `pairs_tiers.png`, `cvd_fx.png`, `cvd_status.png`). English summary: 64 of 1953 piece pairs fail the 16 px shape-only test (10 of them equipment tiers); every piece has a 1.69:1 dark outline against `#0B3A40` (below 3:1), so legibility depends on the inner fills.

### Condição de teste

- Fonte: `origin/main` @ `3c2dc8298`, `src/assets/soulmon/combate-v3/` (status, atributos, hud `gate-*`/`soul-*`/`vinculo-*`/`talent-*`, arvore `talent-*`, talentos `tal-*`, equip `eq-*`): 63 peças. FX só entra no daltonismo (são folhas de 128 px, o teste de 16 px não se aplica).
- Render: recorte pelo bbox do alfa, redução proporcional LANCZOS para caber em 16x16 (e 24x24), centrado, composto sobre `#0B3A40`; cinza = luma ITU-R 601. Sem aparelho real; tudo é script, a conferência das folhas foi visual (manual).
- Contraste: WCAG 2.x (luminância relativa), fundo L = 0,034.
- Similaridade: IoU da máscara de alfa (>50%) a 16 px; SSIM em cinza a 16 px (janela 5, média só sobre a união das máscaras dilatada em 1 px, para o fundo liso não inflar o número). Nos 1953 pares: SSIM mediana 0,10, p90 0,25, p99 0,43.
- Limites propostos (o inventário não fixa número; decisão do dono): **reprova** = SSIM >= 0,35, ou IoU >= 0,80 com SSIM >= 0,20; **alerta** = SSIM >= 0,28 ou IoU >= 0,80. IoU sozinho não reprova: quase toda peça preenche o quadrado e o número sobe sem a forma interna ser parecida.
- Daltonismo: matrizes de Machado et al. 2009 (severidade 1,0) em RGB linear; distância CIEDE2000 entre a cor de destaque média (pixels de croma alto) de cada glifo/folha de FX.

### 1. Contraste não-texto (WCAG 1.4.11)

- **Todas as 63 peças** têm contorno `#0D0D0D` contra `#0B3A40` a **1,69:1** (mediana do anel de borda), abaixo de 3:1. O aro ciano `#6EFFF8` pedido no STYLE block **não aparece** no PNG instalado (o pixel mais externo é sempre o preto). A forma só se separa do fundo pelo preenchimento interno, nunca pela borda. Bordas melhores: `tal-pvp-04` 3,61:1, `tal-pvp-05` 2,0, `oficio-benca` 1,96. Pior: `talent-point-chip` 1,14.
- Critério proposto: >= 20% dos pixels do glifo a 16 px com >= 3:1 contra o fundo (cor viva que carrega a forma). Piores casos:

| peça | pixels >= 3:1 a 16 px | tinta a 16 px (px) | resultado | prio |
|---|---|---|---|---|
| `oficio-maldicao` | 0% | 168 | reprova | P0 |
| `talent-node-locked` | 0% | 125 | reprova | P0 |
| `talent-root-pvp` | 1% | 90 | reprova | P0 |
| `gate-torneio` | 1% | 85 | reprova | P0 |
| `tal-com-04` | 2% | 178 | reprova | P0 |
| `talent-root-pve` | 2% | 111 | reprova | P0 |
| `oficio-combate_fisico` | 2% | 131 | reprova | P0 |
| `oficio-longo_alcance` | 3% | 74 | reprova | P0 |
| `gate-arena` | 6% | 149 | reprova | P1 |
| `tal-pve-02` | 8% | 147 | reprova | P1 |
| `tal-pve-04` | 8% | 122 | reprova | P1 |
| `tal-com-05` | 9% | 134 | reprova | P1 |
| `eq-rastro-t2` | 10% | 115 | reprova | P1 |
| `eq-rastro-t1` | 10% | 127 | reprova | P1 |
| `tal-pve-05` | 11% | 121 | reprova | P1 |
| `strike-melee` | 11% | 118 | reprova | P1 |
| `tal-pve-06` | 11% | 172 | reprova | P1 |
| `soul-lv-badge` | 11% | 126 | reprova | P1 |
| `st-maldicao` | 11% | 141 | reprova | P1 |
| `soul-cap-mark` | 12% | 78 | reprova | P1 |
| `st-dot` | 12% | 81 | reprova | P2 |
| `talent-node-available` | 12% | 113 | reprova | P2 |
| `eq-rastro-t3` | 13% | 126 | reprova | P2 |
| `tal-pvp-05` | 13% | 124 | reprova | P2 |
| `vinculo-badge` | 14% | 133 | reprova | P2 |

39 de 63 peças reprovam (tabela mostra as 25 piores). Passam as que têm ciano/âmbar vivo (`st-cura`, `tal-pve-07`, `tal-pve-03`, `eq-nucleo-*`); o resto do kit é cobre/teal escuro e some no fundo. `talent-node-locked` com 0% é esperado (estado bloqueado), mas fica invisível a 16 px.

### 2. Pares que reprovam "distinguível só pela forma" a 16 px em cinza

Total: **64 pares reprovam** (P0 5, P1 21, P2 38), mais 93 em alerta, de 1953. Prioridade por contexto de uso: P0 = peças que aparecem lado a lado na mesma barra (status x status, atributo/strike, badges de HUD); P1 = mesma árvore de talentos, tiers de equipamento ou colisão de dono de silhueta entre telas; P2 = telas diferentes e rotuladas. Valores IoU / SSIM.

| par | IoU | SSIM | resultado | prio |
|---|---|---|---|---|
| `soul-lv-badge` x `talent-respec` | 0.70 | 0.56 | reprova | P0 |
| `soul-lv-badge` x `vinculo-badge` | 0.84 | 0.48 | reprova | P0 |
| `st-buff-atk` x `st-buff-spd` | 0.75 | 0.43 | reprova | P0 |
| `talent-respec` x `vinculo-badge` | 0.79 | 0.42 | reprova | P0 |
| `st-cura` x `st-hot` | 0.76 | 0.37 | reprova | P0 |
| `eq-carapaca-t1` x `eq-carapaca-t2` | 0.91 | 0.84 | reprova (tiers) | P1 |
| `eq-nucleo-t1` x `eq-nucleo-t3` | 0.90 | 0.83 | reprova (tiers) | P1 |
| `eq-nucleo-t1` x `eq-nucleo-t2` | 0.86 | 0.76 | reprova (tiers) | P1 |
| `eq-nucleo-t2` x `eq-nucleo-t3` | 0.85 | 0.66 | reprova (tiers) | P1 |
| `eq-nucleo-t2` x `tal-pve-07` | 0.79 | 0.48 | reprova | P1 |
| `eq-nucleo-t1` x `tal-pve-07` | 0.73 | 0.47 | reprova | P1 |
| `eq-carapaca-t2` x `eq-carapaca-t3` | 0.86 | 0.45 | reprova (tiers) | P1 |
| `talent-node-available` x `talent-node-locked` | 0.82 | 0.45 | reprova (tiers) | P1 |
| `eq-nucleo-t3` x `tal-pve-07` | 0.77 | 0.44 | reprova | P1 |
| `talent-path-pvp` x `tal-pve-02` | 0.69 | 0.41 | reprova | P1 |
| `talent-path-pvp` x `tal-pvp-07` | 0.67 | 0.40 | reprova | P1 |
| `attr-atk` x `gate-torneio` | 0.51 | 0.39 | reprova | P1 |
| `talent-root-com` x `talent-root-pve` | 0.72 | 0.37 | reprova (tiers) | P1 |
| `tal-pve-07` x `tal-pvp-06` | 0.69 | 0.37 | reprova | P1 |
| `tal-pve-03` x `tal-pve-07` | 0.68 | 0.36 | reprova | P1 |
| `talent-path-pvp` x `tal-com-02` | 0.64 | 0.36 | reprova | P1 |
| `tal-com-01` x `tal-pvp-06` | 0.64 | 0.35 | reprova | P1 |
| `eq-nucleo-t3` x `tal-pve-02` | 0.84 | 0.35 | reprova | P1 |
| `eq-nucleo-t2` x `tal-pve-02` | 0.87 | 0.34 | reprova | P1 |
| `eq-carapaca-t1` x `eq-carapaca-t3` | 0.81 | 0.34 | reprova (tiers) | P1 |
| `tal-pve-02` x `tal-pve-07` | 0.84 | 0.24 | reprova | P1 |
| `eq-rastro-t1` x `eq-rastro-t3` | 0.77 | 0.63 | reprova (tiers) | P2 |
| `eq-nucleo-t3` x `tal-com-02` | 0.63 | 0.48 | reprova | P2 |
| `eq-rastro-t1` x `eq-rastro-t2` | 0.74 | 0.48 | reprova (tiers) | P2 |
| `talent-node-available` x `vinculo-badge` | 0.73 | 0.48 | reprova | P2 |
| `eq-nucleo-t2` x `tal-com-07` | 0.72 | 0.47 | reprova | P2 |
| `talent-respec` x `tal-com-03` | 0.56 | 0.45 | reprova | P2 |
| `attr-atk` x `tal-com-02` | 0.58 | 0.44 | reprova | P2 |
| `st-escudo` x `tal-pve-07` | 0.80 | 0.44 | reprova | P2 |
| `eq-nucleo-t2` x `st-cura` | 0.73 | 0.44 | reprova | P2 |
| `eq-nucleo-t3` x `tal-pve-03` | 0.68 | 0.43 | reprova | P2 |
| `eq-carapaca-t2` x `eq-nucleo-t1` | 0.68 | 0.42 | reprova | P2 |
| `oficio-evocacao` x `tal-com-07` | 0.45 | 0.42 | reprova | P2 |
| `eq-nucleo-t1` x `tal-com-02` | 0.61 | 0.42 | reprova | P2 |
| `talent-path-comercio` x `talent-respec` | 0.66 | 0.42 | reprova | P2 |
| `eq-nucleo-t1` x `st-cura` | 0.70 | 0.42 | reprova | P2 |
| `st-escudo` x `tal-pve-04` | 0.72 | 0.41 | reprova | P2 |
| `eq-carapaca-t2` x `tal-pve-03` | 0.82 | 0.40 | reprova | P2 |
| `eq-carapaca-t2` x `eq-nucleo-t3` | 0.68 | 0.40 | reprova | P2 |
| `eq-nucleo-t2` x `st-escudo` | 0.81 | 0.40 | reprova | P2 |
| `talent-point-chip` x `tal-com-02` | 0.59 | 0.40 | reprova | P2 |
| `st-cura` x `tal-pve-07` | 0.71 | 0.40 | reprova | P2 |
| `oficio-evocacao` x `eq-nucleo-t2` | 0.50 | 0.39 | reprova | P2 |
| `eq-carapaca-t1` x `eq-nucleo-t1` | 0.65 | 0.39 | reprova | P2 |
| `soul-lv-badge` x `tal-com-03` | 0.60 | 0.39 | reprova | P2 |
| `talent-point-chip` x `tal-pvp-07` | 0.58 | 0.39 | reprova | P2 |
| `eq-nucleo-t3` x `st-escudo` | 0.82 | 0.38 | reprova | P2 |
| `eq-carapaca-t2` x `eq-nucleo-t2` | 0.69 | 0.38 | reprova | P2 |
| `eq-nucleo-t3` x `st-cura` | 0.73 | 0.37 | reprova | P2 |
| `talent-path-pvp` x `talent-point-chip` | 0.59 | 0.36 | reprova | P2 |
| `eq-nucleo-t1` x `tal-pve-03` | 0.68 | 0.36 | reprova | P2 |
| `talent-root-pve` x `soul-lv-badge` | 0.62 | 0.36 | reprova | P2 |
| `eq-nucleo-t2` x `tal-pve-03` | 0.71 | 0.35 | reprova | P2 |
| `eq-nucleo-t1` x `tal-com-07` | 0.63 | 0.35 | reprova | P2 |
| `st-escudo` x `tal-pve-03` | 0.80 | 0.35 | reprova | P2 |
| `attr-atk` x `tal-pve-02` | 0.37 | 0.35 | reprova | P2 |
| `st-escudo` x `tal-pve-02` | 0.89 | 0.33 | reprova | P2 |
| `eq-carapaca-t3` x `tal-pve-03` | 0.81 | 0.28 | reprova | P2 |
| `talent-node-bought` x `oficio-maldicao` | 0.81 | 0.22 | reprova | P2 |

Pares esperados pelo pedido:

| par esperado | IoU | SSIM | resultado |
|---|---|---|---|
| `st-buff-atk` x `st-buff-spd` | 0.75 | 0.43 | reprova |
| `st-hot` x `st-cura` | 0.76 | 0.37 | reprova |
| `oficio-combate_fisico` x `strike-melee` | 0.49 | 0.12 | passa na métrica |
| `st-debuff-def` x `tal-pve-03` | 0.82 | 0.02 | passa na métrica |
| `tal-pvp-03` x `st-buff-spd` | 0.51 | 0.02 | passa na métrica |
| `tal-pvp-01` x `attr-atk` | 0.30 | -0.00 | passa na métrica |
| `tal-pve-06` x `st-escudo` | 0.80 | 0.04 | passa na métrica |
| `tal-pve-02` x `eq-carapaca-t1` | 0.64 | 0.24 | passa na métrica |
| `tal-com-03` x `talent-respec` | 0.56 | 0.45 | reprova |

Leitura: `oficio-combate_fisico` x `strike-melee`, `tal-pvp-01` x `attr-atk`, `tal-pve-02` x `eq-carapaca-t1` e `tal-pvp-03` x `st-buff-spd` passam na métrica (a forma interna difere), mas violam a regra "um dono por silhueta" (punho, espada, placa, pegada repetidos); seguem no backlog acima pela regra de dono, não pela medição. `st-debuff-def` x `tal-pve-03` e `tal-pve-06` x `st-escudo` têm IoU alto (>= 0,80) e SSIM ~0 (mesmo bloco, miolo diferente): alerta, não reprova. Evidência visual: `pairs_fail_1.png`, `pairs_fail_2.png`, `pairs_tiers.png`.

### 3. Daltonismo (protanopia, deuteranopia, tritanopia)

- A cor não é o único diferenciador dos status e a simulação confirma: âmbar/cobre (`st-dot`, `st-maldicao`, `st-debuff-def`, chevron do `fx-debuff`) vira oliva-amarelado em protanopia/deuteranopia e salmão em tritanopia; o ciano vira azul-acinzentado. Os dois grupos continuam separados em matiz e luminância nas três simulações (`cvd_status.png`, `cvd_fx.png`).
- Pares que a cor sozinha NÃO separa nem na visão normal (CIEDE2000 < 6, só a forma salva): `st-buff-atk` x `st-buff-spd` 2,2; `st-buff-atk` x `st-escudo` 2,6; `st-buff-spd` x `st-escudo` 0,8; `st-cura` x `st-hot` 0,9; `st-dot` x `st-maldicao` 5,3 (ambos laranja). A simulação não piora estes (variação <= 0,3); somam ao problema de forma da seção 2.
- FX: as quatro folhas são teal dominante (`fx-debuff` x `fx-maldicao` 2,7; `fx-debuff` x `fx-dot` 5,3; `fx-dot` x `fx-maldicao` 5,8 na visão normal): quem distingue é a forma (chevrons, cristal, corrente), não a cor. Os acentos âmbar/cobre sobrevivem em protanopia/deuteranopia; em tritanopia viram vermelho/salmão sem perder contraste com o teal. A conferência das simulações das folhas foi só visual. FX é decorativo (estado vai por glifo + texto `aria-label`, já previsto no inventário). P2.

### 4. Recomendação de regeração (só texto; a geração é manual do dono)

Regras para todos os prompts abaixo: uma peça por conversa, anexar `docs/ui-refs/REF-kit-v12.png` e a peça-irmã citada, terminar com o STYLE block e `Square 1:1 full-bleed composition.`, ícone único com a cláusula de fundo `#00FF00` + chroma-key. Acréscimos obrigatórios desta medição, para todo o lote: (a) **sem miolo texturizado**: no máximo 2 tons internos e uma forma cheia, para o SSIM a 16 px cair; (b) **aro externo claro** de 1 px `#6EFFF8` sobre o contorno preto, mantido no PNG final (hoje sumiu e deixa a borda em 1,69:1); (c) glifo ocupando pelo menos 70% do quadrado. Depois de gerar: refazer `metrics.py` e exigir SSIM < 0,28 contra cada vizinho da tabela e >= 20% de pixels a 3:1.

Se existir peça aprovada do mesmo elemento, anexá-la e pedir reprodução fiel em vez de redescrever a forma.

**P0 `st-buff-atk` / `st-buff-spd`** (hoje punho x pegada, SSIM 0,43; ambos blob + chevron)
> A single 64x64 pixel-art status glyph, flat 2-tone: a short upright copper sword pointing up, thin blade and crossguard, NOT a fist, NOT a hand, with one bold upward chevron under the hilt. The sword must fill 70% of the height and have a wide empty gap on both sides so the outline is a tall narrow vertical. Light cyan 1-pixel rim outside the black outline. Reads at 16 px in grayscale. Attach attr-atk as shape reference.

> A single 64x64 pixel-art status glyph, flat 2-tone: a winged boot in profile, one wing pointing back-left, bold upward chevron under it. The silhouette must be a wide diagonal shape, clearly different from the tall narrow sword of st-buff-atk and from any footprint or paw. Light cyan 1-pixel rim outside the black outline. Reads at 16 px in grayscale. Attach attr-spd as shape reference.

**P0 `st-hot` x `st-cura`** (SSIM 0,37; hoje cruz + selo)
> A single 64x64 pixel-art status glyph, flat 2-tone: a thin cyan plus-cross centered inside a large OPEN ring with a clear wide gap at 1 o'clock; the ring is as large as the glyph and carries a small arrowhead at the gap (continuous effect). The cross must be at most 40% of the width, so the overall silhouette is a ring, not a plus. NO side seal, NO badge. Reads at 16 px in grayscale as a ring, distinct from the solid plus of st-cura.

**P0 `soul-lv-badge` x `vinculo-badge` x `talent-respec`** (anéis hexagonais/circulares, SSIM 0,42 a 0,56)
> A single 64x64 pixel-art HUD badge: a solid filled hexagon (not a ring) with a bold copper numeral-free chevron stack inside (two upward chevrons), thick 3-pixel copper border. NO hollow center. Attach the current soul-lv-badge as the style anchor.

> A single 128x128 pixel-art bond badge: a solid filled heart-shaped shield with a small linked-chain loop crossing its lower half, 3-pixel copper border, NO hollow ring, NO dots around the edge.

> A single 64x64 pixel-art icon for "reset": one thick circular arrow (about 270 degrees) with a single arrowhead, cyan on teal, NO second arrow, NO copper dotted ring. It must have a clear opening in the circle so it is not a ring badge.

**P1 `eq-nucleo-t1/t2/t3`, `eq-carapaca-t1/t2`** (tiers SSIM 0,66 a 0,84 entre si; confundem com `tal-pve-07`)
> Three tiers of the same piece, each its own generation, 96x96: t1 plain dull copper crystal with NO inlay and 3 facets; t2 same shape with polished copper bracket and 2 cyan inlay stripes; t3 bigger crystal with 6 facets, electric blue core and 4 copper prongs breaking the silhouette. Each tier must differ in silhouette (number of prongs and height), not only in tint.

**P1 `tal-pve-07`** (SSIM 0,36 a 0,48 contra `eq-nucleo-*`, `st-escudo`, `st-cura`)
> A single 96x96 pixel-art talent icon: an arched stone crest (doorway arch) crowned by a four-point star above it. NO crystal, NO gem, NO hexagon.

**P1 `tal-pvp-07`, `tal-com-02`, `tal-com-01`, `tal-pvp-06`, `tal-com-03`** (SSIM 0,35 a 0,56 contra `talent-point-chip`, `talent-path-pvp`, `talent-respec`)
> Use the already corrected prompts above for `tal-pvp-06` (ember under a lid) and `tal-com-03` (hourglass over a coin). For `tal-pvp-07`: a single 96x96 icon, a rectangular banner-diamond emblem with a small star above, NO diamond frame ring. For `tal-com-02` and `tal-com-01`: attach the approved piece and ask for a faithful reproduction with the silhouette widened to at least 70% of the frame, flat 2-tone.

**P2 `fx-*-loop`** (formas ok, cor quase igual): pedir só que a faixa de cor de cada FX tenha um matiz próprio (debuff: âmbar dominante; dot: âmbar; buff: ciano; maldição: cobre + ciano), e a luminância do tom quente maior que a do teal.


### 5. Os 5 piores (prioridade, depois SSIM)

1. `soul-lv-badge` x `talent-respec`: IoU 0.70, SSIM 0.56.
2. `soul-lv-badge` x `vinculo-badge`: IoU 0.84, SSIM 0.48.
3. `st-buff-atk` x `st-buff-spd`: IoU 0.75, SSIM 0.43.
4. `talent-respec` x `vinculo-badge`: IoU 0.79, SSIM 0.42.
5. `st-cura` x `st-hot`: IoU 0.76, SSIM 0.37.