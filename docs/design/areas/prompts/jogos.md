# Prompts — área JOGOS (Anel dos Cogumelos)

> Modo SÓ-PROMPTS (29/09/2026): nada foi gerado. O dono gera no Higgsfield quando houver crédito. Fonte: bíblia `00-BIBLIA-DAS-AREAS.md` §1.3 (A1), §2.1, §3, §4, §5; blocos de estilo de `ASSETS-A-GERAR.md` §1. Quem instala: `arte-instalador`, depois do `arte-conferente`.

## 0. Decisão que vai ao dono

A bíblia (§0.2, A1) manda **repintar** o fundo de Jogos (só flores rosa e plantas roxas), mantendo a composição. Cada peça tem duas variantes:

- **A — manter como está**: só vale se o dono recusar a repintura. Nesse caso **nada é gerado** e o arquivo atual fica.
- **B — repintura fiel**: mesma composição, mesmos cogumelos, mesma luz; troca só rosa/roxo.

**Achado fora da bíblia (o dono decide):** olhando os PNGs, três outras peças de Jogos também têm rosa forte e a bíblia só citou o fundo (§6 diz "Jogos: só repintura A1"). Entram aqui como B opcional, porque a regra "proibido magenta/roxo/rosa" (§5) vale para toda a área:
- `lote-jogos-ppt.png`: pétala rosa-choque no telhado, flores rosa, bandeirolas rosa, almofadas rosa.
- `npc-jogos.png` (Pipo): axolote com pele e brânquias rosa; chapéu vermelho saturado (a bíblia permite chapéu em ferrugem `#A8553F`, então o vermelho é o que troca junto).
- `mapa/zona-jogos.png`: chapéu rosa-magenta, flor-catavento e "flores-balanço" rosa.

## 1. Âncora de estilo da área (copiar idêntico no início de TODO prompt)

```
Retro pixel art, 16-bit era, isometric top-down view, clean chunky pixels, flat colors, hard aliased edges, 1px near-black outline (#061414), no blur, no soft glow. Palette: deep petrol teal and near-black green as the base, aged copper as trim and hardware, turquoise cyan sparks as the only "living energy". AREA ACCENT "Anel dos Cogumelos": luminous moss green (#9BD46A), giant mushroom caps in muted rust red (#A8553F) with repeated cream spots (#EFE3C2), amber (#D9A441) flowers, petrol-blue leaves. Material: moss, living wood, spongy caps. Light: soft bioluminescence rising from the ground, small glowing dots on the floor. Shape language: ROUNDED, no sharp corners; round mushroom-dome skyline. Forbidden: magenta, purple, violet, pink, red or orange as energy, skulls, bones, text, letters, numbers, logos, human hands, generic humans, any existing franchise character or creature. Do not copy any existing franchise character.
```

**Negative padrão (todas as peças):** `magenta, purple, violet, pink, rose, lilac, text, letters, numbers, logo, watermark, frame, border, UI, human hand, human, skull, bone, blur, anti-aliased soft edges, gradient glow, photo, 3D render, existing franchise character`

**Como usar no Higgsfield:** modo imagem-para-imagem/edição; **anexar o PNG atual como referência** (caminho indicado por peça). Modelo sugerido: `nano_banana_2_lite` (alfa real nas peças com fundo transparente). Downloads em `E:\dowload`; entrega em `D:\Soulmon\_gemini_out\cenarios-<data>/` (fundo, lote, zona) e `.../criaturas-<data>/` (NPC) com `raw/` e `INSTALAR.md`.

---

## 2. Fundo — `bg-jogos`

**Destino:** `src/assets/soulmon/areas/bg-jogos.png` · **760×1344** (9:16), RGB sem alfa, ≤ 400 KB após WebP · gerar em 1536×2752 ou 768×1376 e reduzir com nearest.
**Referência a anexar:** `src/assets/soulmon/areas/bg-jogos.png` (atual).

### O que a imagem atual tem (medido olhando o PNG, 760×1344)
- Vista isométrica de cima de uma **clareira de floresta noturna**, moldura densa de folhagem em todas as bordas, céu/fundo preto-esverdeado nos cantos.
- **Duas clareiras vazias de terra batida** (marrom, pedrinhas em escama) onde os lotes pousam: uma **elipse grande no terço superior** (aprox. x 155–625, y 255–570), circundada por anel de musgo verde, e uma **clareira estreita/afunilada no terço inferior** (aprox. x 235–545, y 700–1130). As duas se ligam por **degraus de pedra** no centro (aprox. x 325–440, y 580–700), flanqueados por muretas de tronco com musgo. O lote de Jogos pousa em `left 50% / top 40%`, sobre a elipse superior: **ela precisa continuar vazia e no mesmo lugar**.
- **Cogumelos gigantes** de chapéu vermelho com pintas creme: 2 no topo (esq. ~x 90,y 220; centro ~x 300,y 95; dir. ~x 535,y 50 e ~x 655,y 190), 1 à esquerda no meio (~x 75,y 535), 2 à direita no meio (~x 655,y 510 e ~x 580,y 620), 1 grande direita-baixo (~x 660,y 920), 1 esquerda-baixo (~x 95,y 1090). Vários cogumelinhos vermelhos menores e roxos/rosados espalhados; tocos de árvore com musgo.
- **Cristais turquesa** alongados (esq. ~x 55,y 320; ~x 120,y 490; ~x 140,y 630; ~x 65,y 745; dir. ~x 675,y 420; ~x 680,y 650; centro-baixo ~x 515,y 1090) e **chamas fantasma turquesa** finas (topo esq./dir., ~x 95,y 950).
- **Fora da paleta (o que sai):** flor grande **rosa-magenta** no topo (~x 400,y 120) e outra embaixo à esquerda (~x 170,y 1240); **plantas roxas** (topo dir. ~x 545,y 150 e ~x 700,y 285; esquerda ~x 30,y 690; baixo esq. ~x 205,y 1170; pequenas ~x 640,y 770 e ~x 495,y 1240); **dezenas de pontinhos rosa/magenta brilhantes** no chão e na borda das clareiras; cogumelinhos violeta.
- **Fica:** flores **laranja-âmbar** (~x 455,y 195; ~x 160,y 985; ~x 665,y 1060), folhagem verde e verde-petróleo, cogumelos vermelhos com pintas, cristais e chamas turquesa, terra e degraus.

### Variante A — manter exatamente como está
Nenhum prompt. **Se o dono recusar a repintura: nada a gerar**, `bg-jogos.png` permanece; registrar a recusa no `REGISTRO-DE-DECISOES` e tirar A1 da fila. n = 0.

### Variante B — repintura fiel (n = 4, escolher 1)
```
[ÂNCORA DE ESTILO DA ÁREA — bloco da §1, colar aqui]

EDIT the attached reference image. Recreate it FAITHFULLY as the same tall portrait 9:16 image: identical composition, identical layout, identical giant mushrooms in the same positions with the same red caps and cream spots, identical two empty dirt clearings (a large ellipse in the upper third, a narrower tapering clearing in the lower third) joined by the same central stone steps, same mossy ring around the clearings, same tree stumps, same turquoise crystals, same thin turquoise ghost flames, same amber-orange flowers, same lighting and pixel density. Keep both clearings completely empty and unchanged so sprites can be placed on them.
CHANGE ONLY these elements: (1) the two large pink-magenta flowers become cream and amber flowers with pale-cream petals and amber centers, same shape and position; (2) every purple plant and purple small mushroom becomes deep petrol-blue or moss-green foliage, same shape and position; (3) all the tiny glowing pink/magenta dots on the ground and clearing edges become tiny glowing moss-green (#9BD46A) and amber (#D9A441) dots, same count and placement; (4) shift the mushroom cap red slightly toward muted rust (#A8553F) while keeping the cream spots.
Do not add, remove, move or resize any object. No characters, no creatures, no text. TALL VERTICAL PORTRAIT 9:16, full-bleed composition.
Negative: [negative padrão da §1]
```
**Critério de aceite:** lado a lado com a atual, a composição é reconhecível de imediato: as duas clareiras e os degraus no mesmo lugar (±10 px em 760×1344), mesmos cogumelos gigantes nas mesmas posições, mesma luz. Varredura de matiz 270°–340° = **zero** pixels relevantes; ambas as clareiras sem objeto; RGB sem alfa; ≤ 400 KB em WebP. Em cinza a 64 px de largura continua lendo "bolinhas" (pintas claras repetidas) e domos de cogumelo. Se algum cogumelo mudou de lugar, descartar (não corrigir a mão).

---

## 3. Lote — `lote-jogos-ppt` (opcional, achado fora da bíblia)

**Destino:** `src/assets/soulmon/areas/lote-jogos-ppt.png` · gerar 768², recortar **300²**, **alfa real** (gerar sobre `#00FF00` + chroma-key, nunca "transparent PNG"); centro da base no centro-inferior do quadro.
**Referência a anexar:** `src/assets/soulmon/areas/lote-jogos-ppt.png`.

**Atual:** casa-de-toco sob telhado em **pétala rosa-choque** (com folhas verdes em cima: uma tesoura-folha e uma "rocha" de folhagem), janela redonda âmbar acesa, cilindro vermelho decorado com coração/símbolo, cristal turquesa no telhado, flores rosa espalhadas, bandeirolas rosa, deque de madeira com degraus, almofadas rosa na varanda, lanternas de cobre nos postes, pergaminho no topo à esquerda.
Bíblia §3 pede: **toco-mesa sob um cogumelo-guarda-chuva gigante** com três marcas entalhadas (pedra, folha, graveto). A arte atual já cumpre a estrutura mas não tem o cogumelo-guarda-chuva; o prompt B corrige isso junto com a cor, o dono confirma se quer só repintar ou também refazer a silhueta (variante B2).

**Variante A — manter:** nada a gerar (n = 0).

**Variante B1 — repintura fiel (n = 4):**
```
[ÂNCORA DE ESTILO DA ÁREA]
EDIT the attached 300x300 isometric building sprite. Recreate it FAITHFULLY: same house-in-a-tree-stump, same wooden deck and stairs, same round amber lit window, same copper lanterns on posts, same turquoise crystal, same scroll, same leaf ornaments, same shapes, same camera angle and size. CHANGE ONLY colors: the hot-pink petal roof becomes a muted rust (#A8553F) petal roof with cream spots; every pink flower becomes a cream or amber flower; pink pennant flags become moss-green and amber flags; pink cushions become amber and cream cushions; the red cylinder becomes copper-brown. No pink, no magenta. Single object centered, base center at the bottom-center of the frame, small contact shadow, on PURE FLAT GREEN #00FF00 background, no text. Square 1:1 full-bleed composition.
Negative: [padrão]
```
**Variante B2 — silhueta da bíblia (n = 4, só se o dono pedir):** mesma âncora + `SUBJECT: a round tree-stump table under one giant umbrella mushroom cap (muted rust cap, cream spots), three carved marks on the stump face — a small stone, a leaf, a twig (never a human hand) — moss on the stump, copper lanterns on two posts, amber lit round window in the stump, turquoise sparks. Keep the deck and stairs from the reference. Size 1.0 of the 300 frame, largest dome in the area.`
**Aceite:** lado a lado com a atual: mesma massa, mesma base, mesmas escadas e janela; nenhum pixel entre 270°–340° de matiz; alfa real (sem verde nas bordas); 300×300; base centrada.

---

## 4. NPC — `npc-jogos` (Pipo; opcional, achado fora da bíblia)

**Destino:** `src/assets/soulmon/npcs/npc-jogos.png` (o anfitrião mantém o nome) · **768²**, **alfa real**, contorno preto de 1 px, busto da cintura para cima, olhando 3/4 para a esquerda (a fala fica à direita). n = 4.
**Referência a anexar:** `src/assets/soulmon/npcs/npc-jogos.png`.

**Atual:** axolote sorridente, boca aberta, olhos verdes grandes, **pele e brânquias rosa** com manchas, barriga creme; **chapéu de cogumelo enorme vermelho saturado** com pintas creme e mais cogumelinhos e musgo em cima, um cristal turquesa no chapéu; cachecol listrado verde e creme; colar com **apito de latão**; mão esquerda segurando uma **bola amarela pintada** com folhinha; mão direita aberta; bolsa de couro marrom com um cogumelo pintado; folhas presas ao corpo e pulseiras de folha com cogumelinhos.

**Variante A — manter:** nada a gerar (n = 0).

**Variante B — repintura fiel:**
```
[ÂNCORA DE ESTILO DA ÁREA]
EDIT the attached bust portrait of a friendly axolotl creature. Recreate it FAITHFULLY: same pose, same happy open-mouth expression, same large green eyes, same giant mushroom-cap hat with the small mushrooms, moss and turquoise crystal, same striped scarf, same brass whistle on a cord, same yellow painted ball held in the left hand, same open right hand, same brown leather satchel with a mushroom emblem, same leaves and bracelets. CHANGE ONLY colors: the pink skin, gills and freckles become a warm cream-beige skin with moss-green (#9BD46A) gills and pale petrol-teal freckles; the bright red mushroom cap becomes muted rust (#A8553F) with cream spots (#EFE3C2); the pink mouth interior becomes deep rust-brown. No pink, no magenta. Original creature, do not copy any existing franchise character. Bust from the waist up, facing 3/4 to the left, on PURE FLAT GREEN #00FF00 background, 1px near-black outline, no text. Square 1:1 full-bleed composition.
Negative: [padrão]
```
**Aceite:** mesma pose, expressão e acessórios lado a lado; zero pixels 270°–340°; alfa real; 768²; contorno de 1 px; criatura reconhecível como o mesmo Pipo. Voz (`areaNpcVoice.ts`) não muda — Pipo é o benchmark de tom.

---

## 5. Zona do mapa — `zona-jogos` (opcional, achado fora da bíblia)

**Destino:** `src/assets/soulmon/mapa/zona-jogos.png` · 512² alfa real (tamanho atual medido pela leitura: 512×512) · **Referência:** o próprio arquivo.
**Atual:** cabana-cogumelo com chapéu **rosa-magenta** com pintas creme, tronco petróleo com cristais turquesa, escorregador de folha verde, deque de madeira e bandeirolas rosa, janelas redondas âmbar, balanço de corda com "flores" rosa, catavento-flor rosa no topo, cogumelinhos rosa.
**A — manter:** n = 0.
**B — repintura fiel (n = 4):** mesma âncora + `EDIT the attached isometric mushroom-house sprite. Recreate it FAITHFULLY (same house, slide, deck, stairs, swing, windows, crystals, camera angle). CHANGE ONLY colors: magenta-pink cap becomes muted rust (#A8553F) with cream spots; every pink flower, pennant and small mushroom becomes cream, amber or moss-green. No pink, no magenta. Original design, do not copy any existing franchise character. Single object centered on PURE FLAT GREEN #00FF00, no text. Square 1:1 full-bleed composition.` **Aceite:** igual ao lote.

---

## 6. Tabela final

| id | tipo | nº de imagens | prioridade |
|---|---|---|---|
| `bg-jogos` A (manter) | fundo — só se o dono recusar | 0 | — |
| `bg-jogos` B (repintura fiel) | fundo 760×1344 | 4 | **P1** (A1 da bíblia) |
| `lote-jogos-ppt` A (manter) | lote — só se recusar | 0 | — |
| `lote-jogos-ppt` B1/B2 (repintura / silhueta) | lote 300², alfa | 4 (+4 se B2) | P2, decisão do dono |
| `npc-jogos` A (manter) | NPC — só se recusar | 0 | — |
| `npc-jogos` B (repintura fiel) | NPC 768², alfa | 4 | P2, decisão do dono |
| `zona-jogos` A (manter) | zona do mapa — só se recusar | 0 | — |
| `zona-jogos` B (repintura fiel) | zona 512², alfa | 4 | P3, decisão do dono |

Total se tudo for aprovado: 16 imagens (20 com B2); só o fundo (P1) = 4.
