# FX de ataque cortados — auditoria 29/10/2026

Relato do dono: o ataque à distância de FOGO sai com um pedaço cortado.

## Resumo

- Varridos **1.610 PNGs** em `src/assets/soulmon/fx-ataque/` (230 elementos × 7: `aura`, `aura-96`, `cast`, `defended`, `impact`, `orb`, `slash`).
- **Leitura 1 (opaco encostando na borda, alpha>20): 0 arquivos.** Nenhuma peça toca a moldura da célula — por isso a varredura óbvia não achava nada.
- **Leitura 2 (corte reto DENTRO da margem): 74 peças** cortadas na fonte (+1 falso positivo conferido a olho, `fx-entropia-orb`). Por estado: **orb 35, cast 20, slash 16, aura 3**; `impact` e `aura-96` e `defended` limpos (o escudo `defended` tem lado reto por desenho).
- **Renderização (BattleStage `Fx`/`ActionFx`, `PetPage`, `EvolutionPath`): sem corte.** O `Fx` é `div` sem `overflow`, `img` com `maxWidth:none`, rotação/espelho por `transform`, escala por keyframe (≤1,45). O único `overflow:hidden` no caminho é o palco inteiro (L870), que só corta o que sai da tela. Nada de fatiar spritesheet: cada estado é um PNG 128×128 inteiro.

## Causa do caso do fogo

`fx-fogo-orb.png` (128×128): o bounding box da arte termina **sempre na coluna 122** — em **todos os 230 orbs** (`xs.max == 122`, 230/230). A cabeça incandescente do projétil é serrada por uma reta vertical nessa coluna (trecho reto de 44 px de altura, idêntico 3 px para dentro), deixando 5 px transparentes até a borda. Não é padding nem CSS: **a peça já nasceu cortada** na geração/pós-processo (recorte de caixa fixa na rodada 2). Padding não conserta (a arte está faltando, não apertada); aumentar o box também não. O mesmo padrão aparece no lado esquerdo de `slash` (disco/ponta serrado) e na elipse direita de `cast`.

## Correção

- **Código:** nenhuma necessária (renderização inócua). Nada alterado em componente/CSS.
- **Asset (padding):** não aplicável — nenhuma peça tem a arte intacta e apertada; todas as 74 estão cortadas na fonte.
- **Régua:** `src/utils/fxAtaqueBordas.contract.test.ts` falha se alguma peça tiver pixel opaco na borda OU corte reto interno, exceto as 74 em `PENDENTE_DE_REGERAR` (lista que também falha se uma peça listada já tiver sido consertada — remova-a ao reinstalar).

## Tabela

| arquivo | borda cortada | causa | correção |
|---|---|---|---|
| `fx-alento-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-alento-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ar-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-asteroide-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-asteroide-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-aurora-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-aurora-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-aurora-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-bravura-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-carnificina-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-carnificina-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_azul-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_azul-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_azul-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_solar-aura.png` | esquerda (um fragmento solto do halo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_solar-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-chama_solar-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-devorador-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-devorador-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-enxofre-aura.png` | esquerda (um fragmento solto do halo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-enxofre-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-equilibrio-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-espectro-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-espectro-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fenix-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fenix-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fenix-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-flora-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-florescer-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fogo-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fogo-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fogo-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fogo_negro-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-forja-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-forja-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fornalha_estelar-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-fossil-aura.png` | esquerda (um fragmento solto do halo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-frenesi-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-frenesi-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-heresia-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-jugo-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-jugo-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-lamina_viva-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-lava-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-lava-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-lava-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-luz-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-meteoro-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-meteoro-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-morte-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-mutacao-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-mutacao-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-nucleo-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ocaso-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ocaso-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ocaso-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ossuario-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ouro_vivo-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-pira_eterna-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-pira_eterna-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-pira_eterna-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-praga-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-praga-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-prisma-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ruina-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-ruina-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-santidade-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-santidade-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-santidade-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-solo_profano-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-tita-cast.png` | direita (a elipse do círculo) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-tita-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-tita-slash.png` | esquerda (o disco/ponta do crescente) | asset (cortado na fonte) | regerar (prompt abaixo) |
| `fx-trovao-orb.png` | direita (a cabeça do projétil) | asset (cortado na fonte) | regerar (prompt abaixo) |

## Prompts de regeração (ChatGPT, GPT Image 2.5)

Anexar como referência de estilo as outras peças do mesmo elemento (`fx-<id>-impact.png` e a peça cortada). Fundo transparente REAL (alfa verdadeiro, nunca xadrez nem chroma), pixel art 128×128 no mesmo estilo das demais FX do elemento, sem texto, margem transparente de ~8 px em todos os lados. Última frase = proporção.

**`fx-alento-cast.png`** — Pixel art VFX sprite, same style and palette as the other alento attack effects of this game: a alento-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-alento-orb.png`** — Pixel art VFX sprite, same style and palette as the other alento attack effects of this game: a compact alento-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ar-orb.png`** — Pixel art VFX sprite, same style and palette as the other ar attack effects of this game: a compact ar-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-asteroide-cast.png`** — Pixel art VFX sprite, same style and palette as the other asteroide attack effects of this game: a asteroide-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-asteroide-orb.png`** — Pixel art VFX sprite, same style and palette as the other asteroide attack effects of this game: a compact asteroide-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-aurora-cast.png`** — Pixel art VFX sprite, same style and palette as the other aurora attack effects of this game: a aurora-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-aurora-orb.png`** — Pixel art VFX sprite, same style and palette as the other aurora attack effects of this game: a compact aurora-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-aurora-slash.png`** — Pixel art VFX sprite, same style and palette as the other aurora attack effects of this game: a single aurora-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-bravura-orb.png`** — Pixel art VFX sprite, same style and palette as the other bravura attack effects of this game: a compact bravura-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-carnificina-cast.png`** — Pixel art VFX sprite, same style and palette as the other carnificina attack effects of this game: a carnificina-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-carnificina-slash.png`** — Pixel art VFX sprite, same style and palette as the other carnificina attack effects of this game: a single carnificina-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_azul-cast.png`** — Pixel art VFX sprite, same style and palette as the other chama azul attack effects of this game: a chama azul-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_azul-orb.png`** — Pixel art VFX sprite, same style and palette as the other chama azul attack effects of this game: a compact chama azul-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_azul-slash.png`** — Pixel art VFX sprite, same style and palette as the other chama azul attack effects of this game: a single chama azul-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_solar-aura.png`** — Pixel art VFX sprite, same style and palette as the other chama solar attack effects of this game: a chama solar-element vertical oval aura ring, hollow in the middle so a creature can stand inside, the whole ring complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_solar-cast.png`** — Pixel art VFX sprite, same style and palette as the other chama solar attack effects of this game: a chama solar-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-chama_solar-orb.png`** — Pixel art VFX sprite, same style and palette as the other chama solar attack effects of this game: a compact chama solar-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-devorador-cast.png`** — Pixel art VFX sprite, same style and palette as the other devorador attack effects of this game: a devorador-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-devorador-orb.png`** — Pixel art VFX sprite, same style and palette as the other devorador attack effects of this game: a compact devorador-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-enxofre-aura.png`** — Pixel art VFX sprite, same style and palette as the other enxofre attack effects of this game: a enxofre-element vertical oval aura ring, hollow in the middle so a creature can stand inside, the whole ring complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-enxofre-orb.png`** — Pixel art VFX sprite, same style and palette as the other enxofre attack effects of this game: a compact enxofre-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-equilibrio-orb.png`** — Pixel art VFX sprite, same style and palette as the other equilibrio attack effects of this game: a compact equilibrio-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-espectro-cast.png`** — Pixel art VFX sprite, same style and palette as the other espectro attack effects of this game: a espectro-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-espectro-orb.png`** — Pixel art VFX sprite, same style and palette as the other espectro attack effects of this game: a compact espectro-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fenix-cast.png`** — Pixel art VFX sprite, same style and palette as the other fenix attack effects of this game: a fenix-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fenix-orb.png`** — Pixel art VFX sprite, same style and palette as the other fenix attack effects of this game: a compact fenix-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fenix-slash.png`** — Pixel art VFX sprite, same style and palette as the other fenix attack effects of this game: a single fenix-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-flora-cast.png`** — Pixel art VFX sprite, same style and palette as the other flora attack effects of this game: a flora-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-florescer-slash.png`** — Pixel art VFX sprite, same style and palette as the other florescer attack effects of this game: a single florescer-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fogo-cast.png`** — Pixel art VFX sprite, same style and palette as the other fogo attack effects of this game: a fogo-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fogo-orb.png`** — Pixel art VFX sprite, same style and palette as the other fogo attack effects of this game: a compact fogo-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fogo-slash.png`** — Pixel art VFX sprite, same style and palette as the other fogo attack effects of this game: a single fogo-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fogo_negro-orb.png`** — Pixel art VFX sprite, same style and palette as the other fogo negro attack effects of this game: a compact fogo negro-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-forja-orb.png`** — Pixel art VFX sprite, same style and palette as the other forja attack effects of this game: a compact forja-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-forja-slash.png`** — Pixel art VFX sprite, same style and palette as the other forja attack effects of this game: a single forja-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fornalha_estelar-orb.png`** — Pixel art VFX sprite, same style and palette as the other fornalha estelar attack effects of this game: a compact fornalha estelar-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-fossil-aura.png`** — Pixel art VFX sprite, same style and palette as the other fossil attack effects of this game: a fossil-element vertical oval aura ring, hollow in the middle so a creature can stand inside, the whole ring complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-frenesi-orb.png`** — Pixel art VFX sprite, same style and palette as the other frenesi attack effects of this game: a compact frenesi-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-frenesi-slash.png`** — Pixel art VFX sprite, same style and palette as the other frenesi attack effects of this game: a single frenesi-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-heresia-orb.png`** — Pixel art VFX sprite, same style and palette as the other heresia attack effects of this game: a compact heresia-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-jugo-orb.png`** — Pixel art VFX sprite, same style and palette as the other jugo attack effects of this game: a compact jugo-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-jugo-slash.png`** — Pixel art VFX sprite, same style and palette as the other jugo attack effects of this game: a single jugo-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-lamina_viva-orb.png`** — Pixel art VFX sprite, same style and palette as the other lamina viva attack effects of this game: a compact lamina viva-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-lava-cast.png`** — Pixel art VFX sprite, same style and palette as the other lava attack effects of this game: a lava-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-lava-orb.png`** — Pixel art VFX sprite, same style and palette as the other lava attack effects of this game: a compact lava-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-lava-slash.png`** — Pixel art VFX sprite, same style and palette as the other lava attack effects of this game: a single lava-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-luz-orb.png`** — Pixel art VFX sprite, same style and palette as the other luz attack effects of this game: a compact luz-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-meteoro-cast.png`** — Pixel art VFX sprite, same style and palette as the other meteoro attack effects of this game: a meteoro-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-meteoro-orb.png`** — Pixel art VFX sprite, same style and palette as the other meteoro attack effects of this game: a compact meteoro-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-morte-orb.png`** — Pixel art VFX sprite, same style and palette as the other morte attack effects of this game: a compact morte-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-mutacao-orb.png`** — Pixel art VFX sprite, same style and palette as the other mutacao attack effects of this game: a compact mutacao-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-mutacao-slash.png`** — Pixel art VFX sprite, same style and palette as the other mutacao attack effects of this game: a single mutacao-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-nucleo-slash.png`** — Pixel art VFX sprite, same style and palette as the other nucleo attack effects of this game: a single nucleo-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ocaso-cast.png`** — Pixel art VFX sprite, same style and palette as the other ocaso attack effects of this game: a ocaso-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ocaso-orb.png`** — Pixel art VFX sprite, same style and palette as the other ocaso attack effects of this game: a compact ocaso-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ocaso-slash.png`** — Pixel art VFX sprite, same style and palette as the other ocaso attack effects of this game: a single ocaso-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ossuario-orb.png`** — Pixel art VFX sprite, same style and palette as the other ossuario attack effects of this game: a compact ossuario-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ouro_vivo-orb.png`** — Pixel art VFX sprite, same style and palette as the other ouro vivo attack effects of this game: a compact ouro vivo-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-pira_eterna-cast.png`** — Pixel art VFX sprite, same style and palette as the other pira eterna attack effects of this game: a pira eterna-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-pira_eterna-orb.png`** — Pixel art VFX sprite, same style and palette as the other pira eterna attack effects of this game: a compact pira eterna-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-pira_eterna-slash.png`** — Pixel art VFX sprite, same style and palette as the other pira eterna attack effects of this game: a single pira eterna-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-praga-cast.png`** — Pixel art VFX sprite, same style and palette as the other praga attack effects of this game: a praga-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-praga-orb.png`** — Pixel art VFX sprite, same style and palette as the other praga attack effects of this game: a compact praga-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-prisma-cast.png`** — Pixel art VFX sprite, same style and palette as the other prisma attack effects of this game: a prisma-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ruina-cast.png`** — Pixel art VFX sprite, same style and palette as the other ruina attack effects of this game: a ruina-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-ruina-orb.png`** — Pixel art VFX sprite, same style and palette as the other ruina attack effects of this game: a compact ruina-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-santidade-cast.png`** — Pixel art VFX sprite, same style and palette as the other santidade attack effects of this game: a santidade-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-santidade-orb.png`** — Pixel art VFX sprite, same style and palette as the other santidade attack effects of this game: a compact santidade-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-santidade-slash.png`** — Pixel art VFX sprite, same style and palette as the other santidade attack effects of this game: a single santidade-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-solo_profano-orb.png`** — Pixel art VFX sprite, same style and palette as the other solo profano attack effects of this game: a compact solo profano-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-tita-cast.png`** — Pixel art VFX sprite, same style and palette as the other tita attack effects of this game: a tita-element conjuring circle seen in perspective: glowing runes ring on the ground with a rising flame/energy wisp in the center, the whole ellipse complete and inside the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-tita-orb.png`** — Pixel art VFX sprite, same style and palette as the other tita attack effects of this game: a compact tita-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-tita-slash.png`** — Pixel art VFX sprite, same style and palette as the other tita attack effects of this game: a single tita-element crescent slash arc cutting diagonally, complete from tip to tip, no stray fragments cut by the frame. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

**`fx-trovao-orb.png`** — Pixel art VFX sprite, same style and palette as the other trovao attack effects of this game: a compact trovao-element energy projectile flying to the RIGHT: a COMPLETE rounded bright head fully inside the frame, with a tapering trail streaming to the left, small sparks around. Real transparent background (true alpha channel), no text, no frame. Square 1:1 composition, 128x128.

## Auditoria 2 (30/10/2026) — caco de vizinha (relato do dono: ataque corpo a corpo da MORTE)

- Defeito: `fx-morte-slash.png` trazia um caco solto à esquerda do crescente (ponta da cabeça do `orb`, que cruza a divisa da folha 3x2). Era a classe "fragmento de peça vizinha", que a régua de borda/corte reto não via (a peça tinha margem e nenhuma reta na arte principal). Medido nas 1.380 peças: 42 com caco grande e lado reto (slash 25, aura 17), e várias outras com cacos menores ou de escala distorcida pelo caco (impact, orb, defended).
- Correção: `tools/regerar-fx-cortados.py` reescrito (âncoras grandes por centroide, fragmento -> âncora mais próxima, layout 3x2 ou linha de 6, casamento por formato/cor com a peça instalada, só troca se a nova é mais limpa). Trocadas 391 PNGs (169 elementos; inclui aura-96). Antes/depois em `D:/Soulmon/prints-2026-10-29/v4/fx-audit/pares-antes-depois/`.
- `espinheiro-slash` estava QUEBRADA (duas sementes, sem o crescente) — refeita da folha.
- Reprovadas a olho e deixadas como estavam (peça nova veio com vizinha colada ou outro desenho): `halo_gravitacional-defended`, `ariete-cast`, `runa-cast` — pendem de regeração/revisão manual.
- Régua: `fxAtaqueBordas.contract.test.ts` agora também reprova caco de vizinha (`strayCuts`, com teste sintético), peça fora do centro (>7 px), vazia/parcial (área < 500 px ou envergadura < 70%).
