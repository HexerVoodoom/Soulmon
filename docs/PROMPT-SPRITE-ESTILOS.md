# Estilos do prompt de sprite (§47, fundo verde §48)

> **§48 (14/10/2026):** a API do Higgsfield não gera alfa. Os dois templates pedem fundo **verde `#00FF00` chapado** (a cláusula abaixo substitui o antigo "transparent background, ... no checkerboard") e o servidor remove o verde por chroma-key (`functions/api/_chroma.js`). Ver `REGISTRO-DE-DECISOES.md` §48.

Seleção: `VITE_SPRITE_PROMPT_STYLE=legacy|v-pet` (padrão `v-pet`) ou argumento `style` em `composeSpritePrompt` (`src/utils/oracle/motor.ts`).

## v-pet (atual, 14/10/2026)

Bloco único `VPET_TEMPLATE` em `motor.ts`. Com referências:

```
Generate this RPG creature inspired by <GENRE_REFERENCES>. Do not copy any existing franchise character. Tamagotchi-style v-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe: <conceito>. <levelBlock>. <rebirth> <SPRITE_FACING_PROMPT> Flat <cores> colors with <acentos> accents, no shading, no outlines, no anti-aliasing.
```

Fallback (recusa do provedor): abertura `Generate this original RPG creature.`, estilo `Retro virtual-pet sprite, ...`, sem nomes de franquia, mesmas cláusulas de segurança. Parâmetros: `openRefs`, `openClean`, `antiCopy`, `styleRefs`, `styleClean`, `finish`, `hueGuard`.

## legacy (backup, texto até 13/10/2026)

`composeSpritePromptLegacy`:

```
Generate an original creature for a monster-raising RPG inspired by <refs>. [Draw inspiration from <bestiário>. ] Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe: <conceito>. <levelBlock>. <rebirth> <facing> Flat <cores> colors with <acentos> accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```

## Tempo: um motivo só (§324, 13/11/2026)

Nos dois estilos, toda criatura de tempo (o elemento `tempo` e todo combinado que o tenha: Cronomancia, Entropia, Éon, Ruína, Ocaso, Instante, Aceleração, Contratempo, Florescer, Frenesi, Relojoaria…) leva **OU ampulheta OU relógio**, nunca os dois. Dono da regra: `src/utils/motivoTempo.ts` (`umMotivoDeTempo`), aplicado no fim do Oráculo (`motor.ts`) e em `stagesComElemento` (`elementoCombinado.ts`). Quem escolhe: a variante do elemento (`motivoTempoDoElemento`: areia/ruína/decadência → ampulheta; mecânico/velocidade → relógio; kit de arte do próprio elemento vence), senão o motivo que a criatura já tem, senão o hash estável da semente. O prompt termina com a cláusula:

```
Time motif: at most ONE small <hourglass|clockwork dial> on the creature, never both an hourglass and a clock on the same creature, not repeated and not scattered over the body; the species and its element lead, not the decoration.
```
