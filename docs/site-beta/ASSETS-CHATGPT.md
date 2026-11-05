# Assets do site a gerar no ChatGPT

> Revisado pela squad-design, 05/11/2026.

**Conversa nova; nunca "Branch · Criar site portfólio".** ChatGPT só entrega alfa real na 1ª imagem de cada conversa: uma peça por conversa, baixar e conferir o alfa. "Mesmo X, anexado" também é conversa NOVA com o arquivo aprovado anexado (nunca segunda imagem da mesma conversa).

**Anexar sempre (3 arquivos):** `E:\Soulmon-assets\entrada-dono\01-logo\logo-soulmon-v1.png` (régua de pixel e paleta), `src/assets/soulmon/novos/planta-ultra.png` (só a densidade de pixel e o sombreado; NÃO copiar as cores verde-vivo dela) e uma captura da Home do jogo (turquesa escuro). A linha do ciclo e do hero é **planta**, não fogo.

**Régua de pixel (vale para toda peça):** o pixel de arte tem o mesmo tamanho relativo do logo e do sprite anexados; moldura com 3 a 4 pixels de arte de espessura; contorno escuro de 1 pixel; sem gradiente suave, sem brilho borrado, sem anti-aliasing. O script `preparar-assets.mjs` reduz à grade lógica por *nearest* e exporta em escala inteira; peça que sair fora da grade é reprovada.

**Fim comum de todo prompt:**

> 16-bit pixel art in the exact style and pixel density of the attached game art. Real transparent background (true alpha channel), no checkerboard, no solid backdrop, no shadow plate, no text, no letters, no numerals unless stated. Soulmon identity: dark turquoise (#08191A, #0F2A29, #29C9B8, #5FF3E0), copper (#C68642, #D9A05B, #EBBE84), thin digital circuit traces, a few small green leaf sprigs, soul crystal with turquoise flame where stated. Arcane nature-and-magic mood, calm. No gears, no cogs, no rivets, no bolts, no valves, no pressure gauges, no straps, no steampunk.

**Destino:** `E:\Soulmon-marketing\site-assets\<nome>.png`. O site troca provisório por asset sem mudar layout.

**Regras de uso no site (decididas na revisão):**
- Rótulo, números (1/2/3), "Forma N de 5", abas e "?" são **texto real** (Rubik para texto de interface; Cinzel só se já for a fonte de título do site), nunca dentro da arte. Mínimo 16 px, contraste 4,5:1 sobre a placa escura, sem Silkscreen fora do visor. Moldura pixel com texto limpo é padrão de jogo e é aceito; não aplicar `image-rendering: pixelated` ao texto.
- Peças marcadas **9-slice** são exibidas por `border-image` com escala de pixel inteira (2x, 3x ou 4x); só o miolo plano e as bordas retas esticam. Ornamento (cristal, folhinha, circuito) fica só nos cantos e nas pontas.
- Hover, foco e pressionado são CSS sobre o MESMO asset (`filter: brightness`, contorno de foco); não há asset de hover.

| # | Nome | Proporção | Prompt |
|---|---|---|---|
| 1 | `logo-completo` | 1:1 | Anexar o logo. "Recreate this exact SOUL MON logo faithfully: same lettering, same crystal-blue SOUL with the turquoise flame, same copper stone MON with the dark crystal in the O. Keep the lettering unchanged and build the full version around it: turquoise flame rising behind the letters, slim copper conduits wrapping around them, small leaf sprigs growing from the conduits, a faint digital mesh behind. Remove the dark backdrop and golden halo, real transparent background." Pedido literal do dono no feedback do preview; a squad-design recomendou só alfa, sem acréscimos, e isso vai como ponto a confirmar. |
| 2 | `botao-beta` **9-slice** | 4:1, largo | "A wide empty game button frame, 9-slice friendly: flat copper border 3 pixels thick with a 1-pixel dark outline, dark turquoise inner plate completely flat and uniform. Ornament ONLY in the two end caps: a small soul crystal socket and one tiny leaf sprig on each end. Between the end caps the top edge, bottom edge and plate are plain, uniform and repeatable, no circuit traces, no decoration in the middle 60% of the width. Empty center, no text." |
| 3 | `barra-corpo` (tile vertical) | 1:4 | "One vertical section of a thin copper conduit with a glass channel in the center, built to repeat seamlessly top to bottom: strictly uniform along its height, the same cross-section on every row, only straight vertical lines, one thin continuous vertical circuit trace on the copper, empty glass channel. No joints, no rings, no ornaments that break the repetition." Conferir: empilhar 3 cópias; se aparecer emenda, regenerar (nunca ajustar à mão). |
| 4 | `barra-corpo-cheio` | 1:4 | Nova conversa, anexar `barra-corpo` aprovado: "Same conduit, identical silhouette and pixel positions, channel filled with glowing turquoise soul energy." Mesmas dimensões, pixel a pixel (o site recorta por altura para mostrar o progresso). |
| 5 | `barra-capa` | 1:1 | Nova conversa, anexar `barra-corpo`: "A small copper end cap for this conduit, seen from the front, same width as the conduit, with one tiny leaf sprig and a small soul crystal. Flat bottom edge so it joins the conduit; the site mirrors it for the top." Substitui a antiga "junta": os 5 estágios usam `cristal-*` como nós. |
| 6 | `disco` | 3:2 | "A round display platform seen from slightly above, a wide flat ellipse: thick copper ring with a 1-pixel dark outline, dark turquoise center plate completely flat and empty, a small soul crystal set into the front rim, two or three leaf sprigs on the ring. The center must stay empty and uniform for a creature sprite to stand on it, no glow, no vignette." |
| 7 | `passo-1` | 1:1 | "A round copper medallion with a small soul crystal at the bottom edge, a dark turquoise inner disc, and inside it a glowing envelope icon with an @ sign. Keep the top-left corner of the medallion free of ornament. NO numeral, NO text anywhere." O número 1 é texto real posto por CSS. |
| 8 | `passo-2` | 1:1 | Nova conversa, anexar `passo-1`: "Same medallion, same frame and crystal, new icon inside: a glowing sealed letter with a small turquoise flame seal. No numeral, no text." |
| 9 | `passo-3` | 1:1 | Nova conversa, anexar `passo-1`: "Same medallion, same frame and crystal, new icon inside: a smartphone with a small calm creature on its screen. No numeral, no text." |
| 10 | `cristal-{apagado,acendendo,aceso}` | 1:1 | Ver `PROMPT-CRISTAL.md` (anexo de estilo: usar `planta-rookie.png`, não `fogo-rookie.png`). Também servem de nós dos 5 estágios do ciclo e da árvore. |
| 11 | `popup-moldura` **9-slice** | 3:2 | "An empty dialog frame, 9-slice friendly: copper border 3 pixels thick with a 1-pixel dark outline, dark turquoise panel completely flat and uniform, a small leaf sprig on each of the four corners. Edges plain and repeatable, nothing on the top center (the site places a crystal image there). Empty center, no text, no glow." Texto cresce em PT/EN/lista de espera: por isso 9-slice, não imagem fixa. |
| 12 | `painel-universo` **9-slice** | 16:9 | "An empty wide panel frame for a tabbed gallery, 9-slice friendly: thin copper border 3 pixels thick, 1-pixel dark outline, dark turquoise plate completely flat and uniform, small crystal-and-leaf ornament only in the four corners, plain repeatable edges, the top edge plain so tabs can sit on it. Empty, no text." |
| 13 | `aba` **9-slice** | 3:1 | "One empty tab frame for the panel, 9-slice friendly: copper border, flat dark turquoise plate, square-ish top corners, open bottom edge so it joins the panel, no ornament in the middle, no text." Aba ativa = CSS (brilho + sublinhado); inativa = o mesmo asset com `brightness(.7)`. |
| 14 | `celula` **9-slice** | 1:1 | "One empty square slot frame for a gallery grid (inhabitants, games, elements): thin copper border, 1-pixel dark outline, flat dark turquoise plate, a single tiny leaf sprig in one corner. Empty, no text." O "?" dos itens ocultos é texto real sobre a célula; a silhueta usa o sprite com `brightness(0)`. |
| 15 | `seta` | 1:1 | "A small right-pointing arrow made of copper with a thin turquoise circuit trace along it and one tiny leaf at the tail, simple and readable at small size." O site gira por CSS em múltiplos de 90 graus (setas da árvore de evolução e do ciclo). |

**Peso:** cada peça exportada em WebP sem perda, no menor tamanho lógico da grade de pixel (o site amplia por escala inteira): botão e popup como 9-slice pequeno (até 192 px de largura), segmentos até 96 px. O script `src/tools/preparar-assets.mjs` faz a conversão. Nada além do logo e do botão entra na disputa do LCP.

**Fora desta lista (não é ChatGPT):** loop real de 8 a 15 s ou sequência de capturas (Fatia 1, §17), poster do vídeo, animação do cabo (só efeito, sem copy), silhuetas da árvore (sprites com `brightness(0)`), mapas.

**Prontos, não gerar:** 20 ícones `src/assets/soulmon/elementos/el-<base>.png`, sprites de `novos/` (usar linha **planta**), mapas de `areas/` e `mapa/`.
