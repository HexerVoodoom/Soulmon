# Fila de assets — onboarding do Velado e intro (30/10/2026)

> Tudo que falta gerar, na ordem. Gerador: **ChatGPT desktop** (memória
> `chatgpt-preferido-sobre-gemini`); vídeos no **Gemini**. Saída bruta em
> `E:\Soulmon-assets\gerados-2026-10-30\<lote>\`; instalação nos caminhos abaixo (o
> código já aponta para eles e mostra placeholder tracejado enquanto faltam).

## Lote A — bustos (transparente, 1:1) → `src/assets/soulmon/onboarding/`

Prompts completos em `PROMPTS-VELADOS.md`. Gerar os 7 bustos base, aprovar com o dono,
depois as poses (reprodução fiel do busto aprovado, só muda a pose).

| Arquivo | Origem |
|---|---|
| `velado-anciao.png` | busto base |
| `velado-anciao-mao.png` | pose: mão estendida (cena 2) |
| `velado-anciao-preocupado.png` | pose: protegendo/assustado (cenas 3, 6, 7) |
| `velado-mao.png` | busto base |
| `velado-mao-lanterna.png` | pose: lançando a lanterna-granada (cena 8) |
| `desfeito.png`, `desfeito-pesadelo.png` | bustos base (duelo, cena 3) |
| `merc-filtrador.png`, `merc-tecelao.png`, `merc-rompente.png` | bustos base (Guilda) |
| `anciao-soulmon.png` | o bichinho atual do oráculo, recortado (D1) — reuso, não gerar |

## Lote B — fundos (sem transparência, 9:16) → `src/assets/soulmon/onboarding/`

Prompt-base comum: *Vertical full-bleed 16-bit pixel-art game background, no text, no
UI, no characters. Detailed crisp pixel art, dark moody mystical atmosphere, deep teal
shadows, glowing turquoise soul-crystals (#5FF3E0), nature reclaiming ancient stone and
faint glowing circuit lines in the rock. No purple, no magenta. Vertical 9:16
composition.*

| Arquivo | Bloco específico |
|---|---|
| `bg-malha-escura.png` | A pitch-dark void of the Mesh: barely visible floating stone fragments, a single faint turquoise glow in the distance, pixel dust dissolving at the edges. |
| `bg-malha-clara.png` | The same place as light returns: floating stone platforms over a soft teal mist, crystals waking up, a quiet ruined path leading forward. |
| `bg-bifurcacao.png` | A stone path splitting in two among roots and crystals: left path lit warm amber, right path lit cool turquoise, a broken signpost carved with glyphs. |
| `bg-core-cidade.png` | Wide view of the CORE, a city of Soulmon: terraced buildings of stone, crystal and living plants on floating platforms, warm windows, small creature silhouettes on bridges, turquoise sun. |

## Lote C — quadros-chave da intro (9:16) → `E:\Soulmon-assets\gerados-2026-10-30\intro\`

Roteiro e movimento por plano em `docs/roteiro/INTRO-CINEMATICA.md`. Prompt-base comum:
*A cave wall seen up close, painted with authentic prehistoric cave paintings (ochre,
charcoal and white pigment, finger-drawn figures, hand stencils, stylized animals). Thin
glowing digital circuit traces and ancient code-like glyphs are embedded in the rock.
Raw crystals are set into the stone. Warm torchlight mixed with cold turquoise glow
(#5FF3E0). Cinematic, painterly, no text, no gears, no steam. Vertical 9:16.* + a
coluna "Quadro" do plano. Quadro final extra nos planos 3, 5, 7 e 8.

## Lote D — vídeos (Gemini, mudo) → `src/assets/soulmon/onboarding/` e `src/assets/soulmon/intro/`

| Arquivo | Origem |
|---|---|
| `intro-parede.mp4` | 9 clipes da intro concatenados (ffmpeg), sem legenda queimada |
| `video-fuga.mp4` | cena 3: o Desfeito persegue no escuro, glitch; quadros do lote A/B |
| `video-resgate.mp4` | cena 8: o Velado da Mão lança a lanterna, clarão turquesa |

## Lote E — som (`/squad-som`)

Faixa de suspense (cenas 2–3) e trilha da intro (~60 s, arco dos 9 planos, sem voz).

## Lote F — pool de BBs (D21)

~200 BBs fofinhos e redondos, marcados por elemento/reino, para `src/data/bbPool.ts`.
Higgsfield em lote (~US$ 5). Pede aval do dono antes (gasto).
