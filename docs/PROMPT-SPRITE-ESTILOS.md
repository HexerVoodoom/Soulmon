# Estilos do prompt de sprite (§46)

Seleção: `VITE_SPRITE_PROMPT_STYLE=legacy|v-pet` (padrão `v-pet`) ou argumento `style` em `composeSpritePrompt` (`src/utils/oracle/motor.ts`).

## v-pet (atual, 14/10/2026)

Bloco único `VPET_TEMPLATE` em `motor.ts`. Com referências:

```
Generate this RPG creature inspired by <GENRE_REFERENCES>. Do not copy any existing franchise character. Tamagotchi-style v-pet sprite, 16x16 pixel art, transparent background, isolated subject, no backdrop, no checkerboard: <conceito>. <levelBlock>. <rebirth> <SPRITE_FACING_PROMPT> Flat <cores> colors with <acentos> accents, no shading, no outlines, no anti-aliasing.
```

Fallback (recusa do provedor): abertura `Generate this original RPG creature.`, estilo `Retro virtual-pet sprite, ...`, sem nomes de franquia, mesmas cláusulas de segurança. Parâmetros: `openRefs`, `openClean`, `antiCopy`, `styleRefs`, `styleClean`, `finish`, `hueGuard`.

## legacy (backup, texto até 13/10/2026)

`composeSpritePromptLegacy`:

```
Generate an original creature for a monster-raising RPG inspired by <refs>. [Draw inspiration from <bestiário>. ] Do not copy any existing franchise character. Retro virtual-pet sprite, 16x16 pixel art, transparent background, isolated subject, no backdrop, no checkerboard: <conceito>. <levelBlock>. <rebirth> <facing> Flat <cores> colors with <acentos> accents, no shading, no outlines, no anti-aliasing. Do not tint the whole creature in a single hue — use clearly distinct colors. Grayscale/black-and-white is acceptable.
```
