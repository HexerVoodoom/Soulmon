# Prompts — área JOGOS (Anel dos Cogumelos)

> Modo SÓ-PROMPTS (29/09/2026): nada foi gerado. O dono gera no Higgsfield quando houver crédito. Fonte: bíblia `00-BIBLIA-DAS-AREAS.md` §1.3 (A1), §2.1, §3, §4, §5; blocos de estilo de `ASSETS-A-GERAR.md` §1. Quem instala: `arte-instalador`, depois do `arte-conferente`.

## 0. Decisão do dono (29/09/2026): repintar SÓ O FUNDO

> Resposta do dono no modal: "a do Pipo eu gostei, deixa como está" + **repintar só o fundo**. Portanto o único ativo a gerar é **`bg-jogos`, variante B (repintura fiel: rosa/roxo para verde-musgo/âmbar/petróleo, mesma composição)**. O **lote do PPT, o Pipo (`npc-jogos`) e a zona do mapa (`zona-jogos`) NÃO são repintados** (§3 a §5: 0 imagens). A variante A do fundo (manter) fica descartada.

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

### Variante A — descartada
O dono decidiu repintar o fundo (29/09/2026); não há mais o caminho "manter" para `bg-jogos`.

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

## 3. Lote — `lote-jogos-ppt`: NÃO REPINTAR (decisão do dono, 29/09/2026)

O arquivo atual `src/assets/soulmon/areas/lote-jogos-ppt.png` fica como está. **0 imagens.** Os prompts B1/B2 desta seção foram retirados da fila (o rosa do telhado e das almofadas é dívida de paleta conhecida e aceita; o gatilho para reabrir é o dono pedir).

## 4. NPC — `npc-jogos` (Pipo): NÃO REPINTAR (decisão do dono, 29/09/2026)

"A do Pipo eu gostei, deixa como está." `src/assets/soulmon/npcs/npc-jogos.png` permanece, com a pele rosa e o chapéu vermelho. **0 imagens.** Voz (`areaNpcVoice.ts`) não muda — Pipo é o benchmark de tom.

## 5. Zona do mapa — `zona-jogos`: NÃO REPINTAR (decisão do dono, 29/09/2026)

`src/assets/soulmon/mapa/zona-jogos.png` permanece. **0 imagens.**

---

## 6. Tabela final

| id | tipo | nº de imagens | prioridade |
|---|---|---|---|
| `bg-jogos` B (repintura fiel) | fundo 760×1344 | 4 | **P1** (A1 da bíblia; único ativo ativo) |
| `lote-jogos-ppt` | lote | 0 | não repintar, decisão do dono 29/09/2026 |
| `npc-jogos` (Pipo) | NPC | 0 | não repintar, decisão do dono 29/09/2026 |
| `zona-jogos` | zona do mapa | 0 | não repintar, decisão do dono 29/09/2026 |

Total: **1 ativo, 4 imagens** (antes: 4 a 8 ativos, 4 a 20 imagens).
