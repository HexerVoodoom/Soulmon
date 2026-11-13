# Prompts de arte — intro narrativa (6 assets)

Destino: `src/assets/soulmon/onboarding/` (mesmo nome do arquivo; a troca não exige mudança de código: `sequencia/assets.ts` marca `pendente: true`, tirar a flag ao instalar).
Regras: estilo painted 16-bit / "darker dusk" dos fundos de Arena; identidade Soulmon SUTIL (turquesa escuro, cristal, cobre, circuito digital fino, folhas); SEM engrenagem; sem texto na imagem. Registrar prompt+tags em `E:\Soulmon-assets\_banco\registro.jsonl` e `meta.json` por imagem.

## A. ChatGPT (fundos/objetos; máx. 3 imagens por conversa; apagar a conversa depois de salvar)
Anexar SEMPRE: `E:\Soulmon-assets\referencias-identidade\02-fundo-moldura-vertical-cristais.png` e `04-tela-home-soul-pets-referencia.png`, e um fundo existente como âncora de estilo: `src/assets/soulmon/onboarding/bg-core-cidade.jpg`.
Fundo opaco = JPG, 9:16, 720x1280 (ao fim do prompt: `Vertical 9:16 full-bleed composition.`). Objeto com alfa = PNG: pedir alfa real na PRIMEIRA imagem da conversa, com a ferramenta de imagem e background=transparent (o "Remover fundo" do visualizador assa xadrez nos pixels: NÃO usar; nunca chroma verde). Salvar em `E:\Soulmon-assets\_intro-arte\`.

1. **bg-penhasco-topo.jpg** — opaco 720x1280. tags: `intro, penhasco-topo, cristal, fundo, cenario`.
   `Painted 16-bit style, darker dusk. Top of a high cliff at twilight: a rough stone platform, a tall dark-turquoise soul crystal glowing softly at the centre, a few thin copper veins in the rock and small leaves at the edges, floating islands faint in the far sky. Calm, no characters, no text, no gears. Subtle Soulmon identity only. Vertical 9:16 full-bleed composition.`
2. **penhasco-panorama.jpg** — opaco 1280x720 (16:9, paisagem). tags: `intro, penhasco, ilhas-flutuantes, panorama, fundo`.
   `Painted 16-bit style, darker dusk. A wide panoramic slice of a vast sky seen from a cliff edge: several floating islands with ancient ruins, small turquoise crystals, green leaves, drifting clouds, thin copper glints. No characters, no text, no gears. Wide 16:9 full-bleed composition.`
3. **penhasco-borda.png** — alfa, 1280x360 (faixa horizontal para o primeiro plano). tags: `intro, penhasco, primeiro-plano, borda`.
   `Painted 16-bit style foreground ledge: the rocky lip of a cliff, dark stone with thin copper veins, a few small turquoise crystals and leaves along the edge, flat top surface, seen straight from the side. Transparent background (real alpha), horizontal strip 32:9, no text, no gears.` (1ª imagem da conversa, background=transparent)
4. **cristal-praca.png** — alfa, 768x1024 (vertical). tags: `intro, cristal, praca-central, objeto`.
   `Painted 16-bit style tall dark-turquoise soul crystal with an inner flame glow, standing on a round stone pedestal ringed with copper and a few leaves. Same crystal as the central square of the Remendados. Transparent background (real alpha), vertical 3:4, no text, no gears.` (1ª imagem da conversa, background=transparent) Anexar o cristal da praça (ver `bg-core-cidade.jpg`).

## B. Higgsfield API (personagens/criaturas, alfa real; NUNCA ChatGPT)
Pipeline: `fetch` dentro de open.higgsfield.ai (playground, headers do playground), `gpt_image_2` com background transparente ("--background transparent"), 512x512, ver memórias `soulmon-sprite-via-playground` e `higgsfield-api-playground-headers`. Âncora de estilo e personagem: `onboarding/velado-anciao.png` (o mesmo velho, mesmas vestes).

5. **velado-anciao-costas.png** — alfa 512x512. tags: `intro, velado, anciao, costas, personagem`.
   `Same elder of the Remendados as the attached reference, seen entirely from behind, full body, walking away, patched dark-turquoise cloak with copper stitching, hood up. Painted 16-bit style, transparent background, no text.`
6. **anciao-soulmon.png** — alfa 512x512 (criatura aliada do ancião no duelo). tags: `intro, soulmon, aliado, anciao, criatura`.
   `A calm ally creature of the elder: a mid-sized soulmon with its own colour (warm grey-brown fur), alert and steady expression, side view facing right, painted 16-bit style, transparent background. No copper pipes, no circuit lines, no leaves, no turquoise crystals, no gears.` (criatura: identidade Soulmon NÃO se aplica.)
