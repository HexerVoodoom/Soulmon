# Prompt: cristal da alma com chama (site do beta)

Gerar em 3 imagens, com alfa real (`--background transparent`; nunca chroma). Anexar como referência `src/assets/brand/final/logo-wordmark.png` e `src/assets/soulmon/novos/planta-rookie.png`, e pedir a mesma densidade de pixel do sprite.

## Base

> 16-bit pixel art game object on a real transparent background, square 1:1, centered, full object visible with margin. A tall soul crystal, faceted, dark turquoise (#0F2A29 shadows, #29C9B8 mid, #5FF3E0 highlights), with a living turquoise flame inside its core. The crystal sits on a small copper socket (#C68642, #D9A05B, #EBBE84). One thin copper pipe and one cable leave the socket from the bottom, with tiny digital circuit traces glowing along them, and two or three small green leaf sprigs growing around the socket, plant integrated into the machine. Arcane nature-and-magic mood, calm. Same pixel density and shading as the attached creature sprite. No gears, no cogs, no clock parts, no steampunk, no harness, no text, no ground, no background, no shadow plate.

## Estados (acrescentar um por geração)

1. **Apagado:** `The crystal is dormant: dim, desaturated dark turquoise, the inner flame is only a tiny faint ember, circuit traces off.`
2. **Acendendo:** `The crystal is waking: medium glow, the inner flame is small and rising, circuit traces glowing halfway up the cable.`
3. **Aceso:** `The crystal is fully awake: bright glow, tall inner flame, circuit traces fully lit, small sparks around the tip.`

Manter composição idêntica entre os três, anexando o primeiro aprovado como referência dos demais.

**Destino:** `site-beta/public/provisorio/` é substituído por `site-beta/public/arte/cristal-{apagado,acendendo,aceso}.png`.
