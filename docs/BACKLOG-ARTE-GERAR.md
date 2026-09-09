# Backlog de arte a gerar — Soulmon

> Lista viva. Cada item traz **prompt pronto pra colar**, **arquivo de destino
> dentro do projeto**, **onde é usado** e **o que anexar como referência**.
> Ao concluir um item: marque `✅ feito`, com a data e o gerador usado.

> ## 🎨 A ARTE FOI ADIADA — decisão do dono, 08/09/2026
>
> Não é falta de método nem de item: é ordem de trabalho. As duas frentes
> abertas continuam aqui, prontas para uma sessão dedicada:
>
> - ~~**A20 — as 24 cenas da aventura da noite**~~ — ✅ **feito 08/09/2026.**
>   As 24 estão em `src/assets/soulmon/adventures/` (96×96, o formato das 30
>   cenas de sonho), ligadas por `utils/adventureArt.ts` e consumidas pelo
>   `DailyReportModal` (28 px) e pelo `AdventureDiary` (24 px). **12 comuns
>   geradas** no Gemini; **12 raras/lendárias desenhadas** por
>   `scripts/aventura-desenhar.mjs` — o cabeçalho daquele script registra por
>   que o gerador não pôde entregar a folha. O `emoji` FICA no catálogo (push,
>   título de notificação, log) e o `? :` de fallback continua nos dois
>   consumidores.
> - ~~**5.1 — arte de decoração**~~ — ✅ **feito 08/09/2026.** As 14 peças foram
>   REFEITAS DUAS vezes no mesmo dia. A 1ª rodada corrigiu os defeitos medidos
>   nas peças de 12/08 (256×256 em caixas não-quadradas, então o `objectFit:
>   contain` encolhia cada peça até o menor lado — o tapete renderizava como um
>   selo de 16×16 num slot de 104×16; `furn-books` tinha 2,41% de roxo). A 2ª
>   rodada trocou o ESTILO para **arcano-tech**, por decisão do dono — ver
>   `docs/PROMPT-ARTE-ARCANO-TECH.md`. Todas exportadas no **tamanho do slot ×
>   2**, que dá escala 2:1 nos dois eixos. Detalhe em `_gemini_out/arcano/`.
>
> 👉 **O handoff completo dessa sessão é `docs/HANDOFF-ARTE-GEMINI.md`** — tem
> os prompts prontos das duas frentes, os critérios de aceitação de cada peça e
> o prompt de abertura para colar numa instância nova.
>
> **O que a próxima sessão precisa saber para não redescobrir:** o método de
> gerar em lote pelo **Gemini no navegador** está validado e escrito nas
> instruções globais do dono (fundo verde `#00FF00` + chroma-key em vez de
> "transparente", proporção declarada no FIM do prompt, folha única fatiada por
> projeção de pixels para itens pequenos, uma conversa nova por variação).
> A condição operacional que trava tudo se esquecida: **a janela do Chrome tem
> de estar visível na tela** — minimizada, ela reporta `Viewport: 0x0` e nem
> clique nem digitação chegam.

## Como gerar (leia antes)

**Sempre anexe a referência.** Sem ela o gerador inventa um estilo próprio e o
asset destoa do resto. As referências vivem em `docs/ui-refs/`:

| arquivo | o que é |
|---|---|
| `REF-kit-v12.png` | UI Design Kit v1.2 — paleta, tipografia, botões, ícones, barras |
| `REF-home.png` | a Home aplicada — alvo funcional |
| `REF-splash.png` | tela de carregamento |
| `REF-attr-{poder,harmonia,benevolencia}.png` | os 3 atributos |
| `ref-asset-sheet-v1.png` | folha anterior (sprites, berço, HUD, chat) |

**Paleta obrigatória** (do próprio kit):
`#0B3A40` teal profundo · `#6EFFF8` ciano neon · `#C68642` cobre ·
`#1E9EFE` elétrico · `#0D0D0D` contorno

⚠️ **Proibido magenta, roxo, violeta e rosa — inclusive em brilho, halo, borda
e anti-aliasing.** A paleta ANTIGA do projeto era roxa e o gerador reintroduz
sozinho: 6 PNGs de botão foram para quarentena por 6–12% de pixels magenta.
Diga isso explicitamente em todo prompt.

⚠️ **Fundo transparente de verdade.** Já entrou asset com xadrez de
transparência *assado nos pixels* (`nest-base.png`, `icon-reset.png`) e com
nuvem de ruído pontilhado (7 sprites de criatura). O guard
`src/assets/assets.contract.test.ts` barra os três casos — se ele acusar, o
asset está errado, não o teste.

**Caminhos:** via CLI Higgsfield (`--image-references <arquivo local>`; não
aceita URL) ou pelo Gemini no navegador (anexar o PNG). O Gemini mantém o
estilo dentro da mesma conversa — prefira continuar uma conversa existente.

---

## P1 — desbloqueiam coisa que está feia hoje

### A1 · Berço do pet (regerar limpo) — ✅ feito 14/08/2026, Gemini Pro (navegador)
> Regerado com a `ref-asset-sheet-v1.png` anexada, **com a fumacinha de volta**.
> O Gemini não entrega alfa real (assa o xadrez e ele mesmo avisa) — a saída
> pedida foi **fundo verde chapado #00FF00** e o recorte foi feito por
> algoritmo (chroma-key + despill + descarte de ilhas <24px + recorte da bbox +
> reescala nearest para 360×201, ancorado embaixo). Guard verde: 0,0% de xadrez,
> 0,00% de magenta, 67,8% transparente. **Receita reaproveitável para os
> próximos itens** — pedir fundo verde é o único jeito de sair com alfa honesto.

- **Destino:** `src/assets/soulmon/nest-base.png` (360×201, alfa real)
- **Uso:** base sob o pet na Home (`components/nestArt.ts` → `BASE_SLOTS.nest`)
- **Anexar:** `ref-asset-sheet-v1.png` (bloco "Pet Cradle & Soul Elements")
- **Por quê:** o arquivo atual foi recuperado de uma versão com xadrez assado;
  a fumacinha que saía do cristal **se perdeu** na recuperação e o berço ficou
  sem ela. Funciona, mas é arte remendada.
- **Prompt:**
  > Pixel-art item on a fully transparent background: an ornate copper cradle
  > / crescent-shaped basin, viewed from the front, with engraved filigree on
  > the bowl and small chains hanging from both ends. A single glowing cyan
  > crystal sits in the center, with a soft wisp of cyan smoke rising from it.
  > Crisp 16-bit pixel art, hard pixel edges, no blur, light source top-left.
  > STRICT palette: deep teal #0B3A40, neon cyan #6EFFF8, copper #C68642,
  > near-black #0D0D0D outline. Absolutely NO magenta, purple, violet or pink
  > anywhere — not in glows, halos, rims or anti-aliasing. Transparent PNG,
  > no checkerboard pattern baked into the image, no background rectangle.

### A2 · Botões — estados hover e active (sem magenta) — ✅ feito 18/08/2026, DERIVADO
> Resolvido sem gerar arte nova, e de propósito. O botão é 9-slice e as fatias
> (`--sm-px-slice`: 82/66/43) foram medidas na arte `normal`; arte desenhada à
> parte tem geometria um pouco diferente, e fatia que não bate faz a moldura
> PULAR no hover — o frame em que o olho está no botão. Os três estados saem
> agora do PRÓPRIO `normal` (`gen_button_states.py`): cada pixel é classificado
> em cobre/teal pela relação entre os canais e só então recebe o ajuste, então
> contorno e fio ciano ficam intactos. O resíduo ameixa do arquivo de origem
> foi apagado por inpainting no caminho — os nove medem 0,0000% de magenta
> (antes: quarentena inteira). `PixelKit` passa as quatro artes por CSS var e o
> `index.css` troca `--sm-px-src` em `:hover`/`:active`/`:disabled`, no lugar
> dos filtros `brightness`/`grayscale`. O `drop-shadow` continua em CSS: brilho
> assado no PNG viraria franja no recorte. Guard novo trava a geometria comum.
- **Destino:** `src/assets/soulmon/buttons/button-{hover,active}-{small,medium,large}.png`
  (6 arquivos; substituem os que estão em quarentena)
- **Uso:** `PixelButton` (`components/pixel/PixelKit.tsx`). Hoje os estados são
  derivados por filtro CSS a partir do `normal`.
- **Anexar:** `REF-kit-v12.png` (bloco "Buttons & States")
- **Prioridade real:** o design-critic classificou como **dívida, não
  impedimento** — o CSS resolve. Só vale gerar junto com outra leva.
- **Prompt:**
  > Pixel-art UI button state sheet on a fully transparent background.
  > Grid of 3 columns (Small pill, Medium, Large wide) × 2 rows:
  > row 1 HOVER — copper frame with chamfered corners, deep teal fill, thin
  > neon-cyan inner border and a soft CYAN outer glow;
  > row 2 ACTIVE — solid neon-cyan fill, dark teal text area, copper frame,
  > strong cyan glow. Buttons empty, no text inside.
  > Crisp 16-bit pixel art, hard edges, no blur, light from top-left.
  > STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D.
  > Absolutely NO magenta, purple, violet or pink anywhere — not in glows,
  > halos, rims or anti-aliasing. Transparent PNG.

### A3 · Ícones dos 3 atributos (nativos 128×128)
- **Destino:** `src/assets/soulmon/icons/icon-attr-{poder,harmonia,benevolencia}.png`
- **Uso:** `types/attributes.ts` → `ATTR_ICON`; aparecem em Estatísticas,
  Evolução e no perfil de jogador
- **Anexar:** `REF-attr-poder.png`, `REF-attr-harmonia.png`, `REF-attr-benevolencia.png`
- **Por quê:** os atuais foram **recortados dos mockups** e reescalados — o
  pixel não é nativo. Funcionam em 20px, mas embaçam em tamanho maior.
- **Prompt (um por atributo, trocando o símbolo):**
  > Pixel-art icon, 128×128, on a fully transparent background: a square
  > copper frame with chamfered corners and pipe-joint details, deep teal
  > interior, containing SÍMBOLO. Soft cyan glow around the symbol.
  > Crisp 16-bit pixel art, hard pixel edges, no blur, front-facing,
  > light from top-left. STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D.
  > NO magenta, purple, violet or pink anywhere. Transparent PNG.
  >
  > - **Poder** → `a glowing neon-cyan triangle outline with a small flame and crystal inside`
  > - **Harmonia** → `a double spiral in teal and copper inside a laurel wreath ring`
  > - **Benevolência** → `a tree whose branches become two open hands holding a glowing droplet, with a small heart at the trunk`

---

---

> ## ⚠️ Quatro itens abaixo estão OBSOLETOS (revisado em ago/2026)
>
> `A3` (ícones dos atributos), `A10` (Banho/Dormir), `A15` (traços de
> nascimento) e `A16` (relatório diário) foram escritos ANTES do `PLANO-DESIGN`
> e o contradizem. A regra §1 de lá — declarada como "não reabro nada disto" —
> é a **fronteira diegética do Visor**: pixel art existe **dentro** do visor do
> aparelho; tudo fora é SVG limpo + Material Symbols. A lista nominal do §3.2
> põe `StatsPage` (traços), a fileira de ações da Home (banho/dormir) e o
> `DailyReportModal` explicitamente do lado SVG.
>
> Gerar esses quatro PNGs seria pagar uma dívida que deixou de existir e criar
> uma nova: superfície falando as duas línguas ao mesmo tempo, que é o defeito
> que a Onda 5 foi feita para eliminar.
>
> **Continua válido** o que é território retrô (`PLANO-DESIGN` §3.1): `A11`
> (mãos do PPT — ✅ feito), `A8` (cocô — ✅ feito), os **30 sonhos do
> `DreamDex`** (✅ feito) e `A12` (berço — ainda aberto).

> ## 💡 Gerar em FOLHA, não peça por peça
>
> Os 34 sprites desta rodada saíram em **8 gerações**, não 34: vários ícones por
> imagem, numa grade 3×2 sobre branco sólido, fatiados depois por
> `scripts-arte/_fatiar.mjs`. O corte é por PROJEÇÃO de pixels opacos (linhas e
> colunas inteiramente vazias), não por grade fixa — se o gerador espaçar
> diferente do pedido, o corte ainda acerta, e ele ABORTA quando a contagem de
> recortes não bate com a de nomes, em vez de salvar 6 arquivos errados.
>
> Duas armadilhas medidas: (a) a aba do Gemini **tem de estar em primeiro
> plano** — em segundo plano a geração trava em "Creating your image" e o clique
> de enviar não registra (o clique só passa depois de um `screenshot`, que traz
> a aba à frente); (b) pedir "aurora" devolveu uma CENA com fundo em vez de um
> objeto recortado — em folha de objetos, dizer `a CUT-OUT object floating alone
> on the white, no sky, no ground, no square tile` é o que conserta.

## P1½ — achados da rodada 5 (auditoria visual de 15/08/2026)

> Rodada que converteu onboarding/tutorial/modais/menu/Evolução para o kit via
> CSS. O que sobrou abaixo é o que SÓ arte resolve — cada item foi visto em
> screenshot antes de entrar aqui.

### A9 · Fundo do Torneio em TEAL (regerar — hoje é roxo com hue-rotate)
- **Destino:** `src/assets/soulmon/bg/tournament.png` (substitui)
- **Uso:** `TournamentPage.tsx` (fundo da página inteira)
- **Anexar:** `REF-kit-v12.png` + o `tournament.png` atual (composição serve)
- **Por quê:** a arte saiu ROXA (paleta antiga). O código aplica
  `hue-rotate(265deg) saturate(0.75)` como paliativo — funciona, mas achata o
  contraste e o anel dourado vira cinza-arroxeado. Ao trocar o PNG, **remova o
  `filter` em `TournamentPage.tsx`** (comentário "RODADA 5" marca o lugar).
- **Prompt:**
  > Pixel-art background for a tournament screen, portrait 3:4: a dark DEEP
  > TEAL arena under a starry sky, a large ornate GOLDEN ring floating above
  > the horizon as a stage, thin neon-cyan light lines across the floor,
  > subtle copper pipe details on the edges. Crisp 16-bit pixel art, hard
  > pixel edges, no blur. STRICT palette: deep teal #0B3A40, neon cyan
  > #6EFFF8, copper #C68642, gold accents, near-black #0D0D0D. Absolutely NO
  > magenta, purple, violet or pink anywhere — not in sky, glows or shadows.

### A10 · Ícones BANHO e DORMIR em pixel (hoje são vetor chapado)
- **Destino:** `src/assets/soulmon/icons/icon-bath.png` e `icon-sleep.png`
  (substituem; manter também `icon-wake.png` no mesmo estilo)
- **Uso:** fileira de ações da Home (`CompanionHUD.tsx`) — ao lado do
  `icon-items.png`, que JÁ é pixel (a mochila): a diferença de era gráfica na
  mesma fileira é o que denuncia.
- **Anexar:** `REF-kit-v12.png` (bloco "Icons & Items") + `icon-items.png`
- **Prompt (um por ícone, trocando o símbolo):**
  > Pixel-art icon, 128×128, fully transparent background: SÍMBOLO in crisp
  > 16-bit pixel art with a near-black outline, subtle copper/teal shading,
  > hard pixel edges, no blur, no frame around it. STRICT palette: #0B3A40,
  > #6EFFF8, #C68642, #0D0D0D plus natural accent tones. NO magenta, purple,
  > violet or pink. Transparent PNG, no baked checkerboard.
  > - **Banho** → `a water droplet with a small shine, cyan-blue`
  > - **Dormir** → `a crescent moon with two tiny sparkles, pale gold`
  > - **Acordar** → `a rising sun over a horizon line, warm gold`

### A11 · Mãos do Pedra-Papel-Tesoura — ✅ feito ago/2026, Gemini (navegador)
- Geradas as três numa FOLHA só (uma imagem, fundo branco) e fatiadas por
  projeção de pixels — ver `_fatiar.mjs`. Ao trocar emoji por `<img>` foi
  preciso ACRESCENTAR `aria-label` PT/EN nos três botões: emoji carrega nome
  acessível embutido, `<img>` não carrega nada, e sem isso a troca de arte
  teria custado a leitura por voz dos únicos controles da tela.

<details><summary>enunciado original</summary>
- **Destino:** `src/assets/soulmon/icons/games/hand-{rock,paper,scissors}.png`
- **Uso:** `RPSGame.tsx` — os 3 botões de jogada usam ✊ ✋ ✌️ (`HANDS`).
  São os CONTROLES PRIMÁRIOS do minijogo em emoji de sistema — a maior peça
  fora do kit que sobrou num jogo.
- **Anexar:** `REF-kit-v12.png`
- **Prompt:**
  > Three pixel-art hand icons on a fully transparent background, in a row:
  > (1) a closed fist (rock), (2) an open palm facing forward (paper), (3) a
  > fist with index and middle finger extended in a V (scissors). Copper-toned
  > skin with near-black outlines, crisp 16-bit pixel art, hard edges, no
  > blur. STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D. NO magenta,
  > purple, violet or pink. Transparent PNG.

</details>

### A12 · Berço "sentável" (mais largo e raso — Ref C)
- **Destino:** `src/assets/soulmon/nest-base.png` (substitui; manter ~360×~160
  de fonte, reescala nearest)
- **Uso:** Home — base sob o pet (`CompanionHUD.tsx` + `BASE_SLOTS.nest`)
- **Anexar:** `REF-home.png` (o grifo POUSADO no berço) + o `nest-base.png` atual
- **Por quê:** o berço atual (148×83) some INTEIRO atrás de sprites de 200px.
  Foi tentado trazer o aro para a frente por z-index na rodada 5 e revertido:
  a bacia cobria o corpo do pet. A Ref C resolve com ARTE: bacia mais LARGA
  (uns 220px em tela) e mais RASA, com o aro baixo — o pet senta com o corpo
  inteiro visível. Depois de trocar a arte, ajustar `BASE_SLOTS.nest`
  (`utils/petStage.ts`) para `w: 220, h: 70` (aprox.) e, se ficar bom, retomar
  o z-index 2 do aro (comentário "RODADA 5" em `CompanionHUD.tsx`).
- **Prompt:**
  > Pixel-art item on a fully transparent background: a WIDE and SHALLOW
  > ornate copper basin / cradle seen from the front — clearly wider than it
  > is tall, low rim, engraved filigree, small chains on both ends, a glowing
  > cyan crystal at the front center with a soft wisp of cyan smoke. The
  > center of the basin is OPEN so a creature can sit inside it. Crisp 16-bit
  > pixel art, hard edges, light top-left. STRICT palette: #0B3A40, #6EFFF8,
  > #C68642, #0D0D0D. NO magenta, purple, violet or pink. Transparent PNG.

### A13 · Splash / tela de carregamento (Ref A — nada disso existe)
- **Destino:** `src/assets/soulmon/splash/` —
  `logo-soulmon.png` (wordmark) · `frame-pipes.png` (moldura completa 9:16
  com vinhas, para usar como IMAGEM DE FUNDO da splash, não como 9-slice) ·
  `crystals-pedestal.png` (os 3 cristais acorrentados do rodapé)
- **Uso:** `IntroScreen.tsx` (hoje: vídeo/fade simples). A splash é a ÚNICA
  tela onde a moldura de cano na borda não briga com rolagem — o veto N4 do
  design-critic vale para telas roláveis, não aqui.
- **Anexar:** `REF-splash.png`
- **Prompt (wordmark):**
  > Pixel-art game logo on a fully transparent background: the word "SOUL" in
  > hollow letters with a glowing NEON CYAN outline, and the word "MON" in
  > solid COPPER with a dark outline, side by side, with a small cyan flame
  > rising behind the letters and thin circuit traces dripping below like
  > data rain. Crisp 16-bit pixel art, hard edges. STRICT palette: #0B3A40,
  > #6EFFF8, #C68642, #0D0D0D. NO magenta, purple, violet or pink.
- **Prompt (moldura 9:16):**
  > Full-screen pixel-art frame, portrait 9:16, on a fully transparent
  > background: an ornate COPPER PIPE border running along all four edges,
  > with elbow joints and glowing cyan crystals at the corners, and green
  > vines with small leaves wrapped asymmetrically around the pipes (denser
  > at the top corners). The CENTER IS EMPTY/transparent. Crisp 16-bit pixel
  > art, hard edges. STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D plus
  > muted green vines. NO magenta, purple, violet or pink.
- **Prompt (cristais):**
  > Pixel-art element on a fully transparent background: three large glowing
  > cyan crystals on small stone pedestals, connected to each other by
  > hanging copper chains, front view. Crisp 16-bit pixel art, hard edges.
  > STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D. NO magenta, purple,
  > violet or pink.

### A14 · Textura de circuito (opcional — o CSS já cobre)
- **Estado:** a rodada 5 aplicou a grade de circuito por CSS
  (`.sm-circuit-bg`) no fundo padrão da Home. Uma TEXTURA de arte (traços de
  circuito orgânicos, nós, pontos de solda como na Ref C) ficaria mais rica —
  mas é refinamento, não lacuna.
- **Prompt (se um dia valer):**
  > Seamless tileable pixel-art texture, 256×256: faint neon-cyan circuit
  > board traces (thin lines, right angles, small solder dots and diamond
  > nodes) over PURE TRANSPARENCY, very low contrast, meant as a subtle
  > overlay on a dark teal background. Crisp pixels, no blur, no glow blobs.
  > STRICT palette: cyan #6EFFF8 at low opacity only. NO magenta, purple,
  > violet or pink. Transparent PNG.

### A15 · Ícones dos traços de nascimento (hoje emoji do sistema)
- **Destino:** `src/assets/soulmon/icons/traits/trait-{guloso,carinhoso,teimoso,sortudo,madrugador}.png` (64×64)
- **Uso:** `utils/passives.ts` → cartão de identidade em Estatísticas (hoje
  mostra 🍖 🫶 🪨 🍀 🌅 do sistema) e o mesmo emoji no relatório/HUD.
- **Anexar:** `REF-kit-v12.png` (bloco "Icons & Items")
- **Prompt (um por traço, trocando o símbolo):**
  > Pixel-art icon, 64×64, fully transparent background: SÍMBOLO, crisp
  > 16-bit pixel art, near-black outline, hard edges, no frame. STRICT
  > palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D plus natural accent tones.
  > NO magenta, purple, violet or pink. Transparent PNG.
  > - **Guloso** → `a roasted meat drumstick`
  > - **Carinhoso** → `two hands cupping a small glowing heart`
  > - **Teimoso** → `a small sturdy rock with a determined face`
  > - **Sortudo** → `a four-leaf clover with a tiny sparkle`
  > - **Madrugador** → `a rising sun over a horizon line`

### A16 · Ícones do relatório diário (cabeçalho por tipo de dia)
- **Destino:** `src/assets/soulmon/icons/report/report-{perfect,good,slow,return}.png` (96×96)
- **Uso:** `DailyReportModal.tsx` (`headIcon` via `RowIcon` — hoje line-art
  da lucide: estrela/sol/nuvem, o último line-art de destaque que sobrou).
- **Anexar:** `REF-kit-v12.png`
- **Prompt (um por tipo):**
  > Pixel-art icon, 96×96, fully transparent background: SÍMBOLO with a soft
  > cyan glow, crisp 16-bit pixel art, near-black outline, hard edges.
  > STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D plus warm gold.
  > NO magenta, purple, violet or pink. Transparent PNG.
  > - **Dia perfeito** → `a big shining star with small sparks`
  > - **Dia bom** → `a bright sun with straight pixel rays`
  > - **Dia mais devagar** → `a small rain cloud with two cyan drops`
  > - **Retorno** → `a sunrise with an upward arrow`

## P2 — melhoram, não destravam

### A4 · Nós do Soul Link (grafo de evolução) — ✅ feito 18/08/2026, Gemini (navegador)
> Gerados na rodada de UI do Gemini e recortados por algoritmo (o Gemini assa o
> xadrez no PNG; o recorte detecta os dois tons do xadrez pela borda, varre as
> costuras de anti-aliasing e faz trim — ferramentas em `E:\Soulmon-assets`).
> Saíram **4** estados em vez dos 3 previstos, porque `NodeArt` sempre teve
> quatro: `locked` (cristal morto) · `forecast` (shard aceso) · `reached` (gema
> cheia) · `current` (gema com raios). A hierarquia é de PRESENÇA visual
> crescente, que é o que carrega o significado sem depender de cor.
> Guard (`assets.contract.test.ts`): 0,00% de magenta, 0,6–2,2% de cinza
> (teto 5%), 12–23% de transparência real. `nodeArt.tsx` trocou de SVG para
> PNG e ganhou teste de render (`nodeArt.render.test.tsx`) travando o contrato
> que antes só existia no comentário do topo. `SoulNode.tsx` e
> `EvolutionPath.tsx` não mudaram uma linha, como o arquivo prometia.

- **Destino (real):** `src/assets/soulmon/evolution/node-{current,reached,forecast,locked}.png` (128×128)
- **Uso:** `components/evolution/nodeArt.tsx` — **a fronteira de troca já está
  pronta**: só esse arquivo sabe com o que o nó é desenhado; `SoulNode.tsx` e
  `EvolutionPath.tsx` não mudam uma linha.
- **Anexar:** `REF-home.png` (a coluna de nós à esquerda)
- **Por quê é P2:** o design-critic avaliou a versão CSS atual como *"a leitura
  mais fiel do bloco SOUL LINK que existe"*. Trocar é refinamento.
- **Prompt:**
  > Three pixel-art diamond-shaped crystal nodes on a fully transparent
  > background, in a row: (1) LIT — bright cyan crystal with a copper rim and
  > soft glow; (2) DIM — the same crystal desaturated and dark, no glow, as if
  > locked; (3) ACTIVE — the lit crystal surrounded by a glowing cyan ring.
  > Crisp 16-bit pixel art, hard edges, no blur. STRICT palette: #0B3A40,
  > #6EFFF8, #C68642, #0D0D0D. NO magenta, purple, violet or pink.
  > Transparent PNG.

### A5 · Barra segmentada fina
- **Destino:** `src/assets/soulmon/progress/bar-segmented-thin.png`
- **Uso:** linhas do painel "Rituais Diários" (`PixelSegmentedBar`)
- **Anexar:** `REF-kit-v12.png` (bloco "Progress Bars & Gauges")
- **Nota:** hoje a barra é CSS e funciona. ⚠️ Bug conhecido do primitivo: ele
  **some em silêncio abaixo de 9px** de altura (border-box com 4px de borda +
  4px de padding), e o `aria-valuenow` continua correto — o que esconde a falha.
- **Prompt:**
  > A thin horizontal pixel-art progress bar on a fully transparent background:
  > copper frame, dark teal empty track, filled with discrete neon-cyan
  > segments (blocks with 1px gaps between them). Two variants stacked: one
  > mostly filled, one mostly empty. Crisp 16-bit pixel art, hard edges.
  > STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D. NO magenta, purple,
  > violet or pink. Transparent PNG.

### A6 · Moldura de cano + vinha em 9-slice
- **Destino:** `src/assets/soulmon/frames/pipe-{corner-tl,corner-tr,corner-bl,corner-br,edge-h,edge-v}.png`
- **Uso:** **só splash e talvez modal**
- **Anexar:** `REF-kit-v12.png` e `REF-splash.png`
- **⚠️ REBAIXADO de P1 para P2 pelo design-critic (N4), e a razão é boa:** numa
  tela rolável a moldura come 40–60px de cada lado (~25% da largura útil em
  412px), briga com a safe area do iOS e com o gesto de voltar do Android, e
  **piora a densidade**, que é o bloqueador nº 1 da Home. Em volta da tela
  inteira, **não fazer**.
- **Prompt:**
  > Pixel-art 9-slice frame pieces on a fully transparent background, laid out
  > separately with space between them: four corner pieces and two edge pieces
  > (horizontal and vertical) of an ornate copper pipe frame with elbow joints
  > at the corners, glowing cyan crystals set into the corner joints, and green
  > vines wrapping around the pipes. Tileable edges. Crisp 16-bit pixel art,
  > hard edges, no blur. STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D,
  > plus muted green for the vines. NO magenta, purple, violet or pink.
  > Transparent PNG.

---

## P3 — pendências antigas, ainda válidas

### A7 · Arte da decoração (14 peças)
- **Destino:** ver `docs/BRIEF-ARTE-DECORACAO.md` (brief completo, caixa em px
  e prompt-base já prontos)
- **Uso:** os 5 espaços do palco do pet (`utils/petStage.ts`)
- **Estado:** hoje são **emoji**. `node scripts/gen-decor.mjs` já existe e gera
  as 14 — falta rodar num lugar com acesso a `higgsfield.ai` (a política de
  rede do sandbox de agente responde 403 no CONNECT para esse host).

### A8 · Sprite do cocô — ✅ feito ago/2026, Gemini (navegador)
- **Destino:** `src/assets/9087038….png`
- **Uso:** mecânica de cocô na Home
- **Por quê:** registrado em `docs/STATUS.md` §4 como "blob escuro pouco
  legível". Anterior a este trabalho.

---

## A20 · Cenas da aventura da noite (24 peças) — ⬜ pendente

**Contexto:** `utils/adventure.ts` (08/09/2026). Cada achado que a criatura traz
do dia tem hoje um **emoji**, e a estrutura já aceita PNG — o mesmo caminho que
os Sonhos e a decoração percorreram (nasceram emoji, ganharam arte depois, sem
reescrever nada). O emoji **fica** mesmo depois da arte: é o único glifo que
cabe num push, num título de notificação ou num log, onde não há `<img>`.

**Onde aparece:** o card do `DailyReportModal` (28 px) e a lista do
`AdventureDiary` (24 px). Peças pequenas, lidas em miniatura — o mesmo tamanho
dos ícones de sonho.

**Destino:** `src/assets/soulmon/adventures/<id>.png`, com um mapa
`ADVENTURE_ART` espelhando `dreamArt.ts` (o `id` é a chave; ver o comentário de
lá sobre por que o mapa não mora no módulo puro).

**A lista de ids está no catálogo**, e é a fonte da verdade — não copie os nomes
para cá, que é como duas listas divergem. `ADVENTURE_CATALOG` traz `id`, `emoji`
e o texto da cena nos dois idiomas; o texto é o briefing de cada peça.

⚠️ **Tom:** são objetos e paisagens **sem a criatura dentro**. Quem viajou foi
ela, e quem lê ficou em casa — a cena é o que ela viu, não um retrato dela. Uma
peça com o pet no meio vira ilustração de mascote e desfaz o ponto.

**Como gerar:** folha única em grade sobre fundo branco (são 24 itens pequenos e
relacionados — ver a regra de "gerar em FOLHA" no topo deste arquivo), fatiada
por projeção de pixels depois.

---

## A21 · Os glifos que renderizam VAZIO — ⬜ pendente

**Contexto (sessão de QA, 08/09/2026).** Nove emojis do app são do bloco
`Symbols and Pictographs Extended-A` (U+1FA70–U+1FAFF), que começa no Emoji 12.0
(Android 10, set/2019). Fonte de sistema mais velha **não desenha nada**: sai
uma caixa vazia `▯`, sem erro e sem log. Medido por canvas, comparando o desenho
de cada glifo com o de um caractere garantidamente ausente da fonte — na máquina
do dono nem o Emoji 12.0 desenha. Guard: `src/styles/emojiSuportado.contract.test.ts`,
que também impede a lista de crescer.

**Isto não é um item de arte novo — é a PRIORIDADE dos que já existem.** Cada
glifo quebrado já tinha destino:

| glifo | onde o jogador vê a caixa vazia | quem já cobre |
|---|---|---|
| 🪨 🪞 🪜 | 3 das 24 cenas da aventura (card do relatório + diário) | **A20** |
| 🪑 🪴 🪨 🪵 🪟 | 5 mobílias, na loja **e** no palco do pet | **A7** |
| 🫶 | traço Carinhoso, cartão de Estatísticas | **A15** |
| 🫶 🫧 | botão de Carinho e efeito de banho do **overlay de desktop** | ⬅️ nada cobria |
| 🪴 | o **texto** do marco de 21 dias (`App.tsx`, PT e EN) | ⬅️ arte não resolve |

E três que estão no código mas **não chegam à tela** — ficam registrados para
ninguém gerar arte à toa: os 4 sonhos (`restWindow.ts`) já renderizam o PNG de
`dreamArt.ts` e o emoji sobrevive só como glifo de push; `HABIT_TIER_EMOJI` não
tem consumidor nenhum; e o 🪙 dos Bits só existe em comentário.

### A21.1 · Os dois glifos do overlay de desktop

- **Destino:** `src/assets/soulmon/icons/desktop/{carinho,banho}.png` (32×32 —
  a faixa do overlay é baixa; ver `desktop/renderer/src/menu.ts`, `careButton`)
- **Uso:** rótulo do botão de Carinho e o efeito de banho, hoje `🫶` e `🫧`
- **Anexar:** `REF-kit-v12.png` (bloco "Icons & Items")
- **Prompt:**
  > Pixel-art icon, 32×32, solid pure green background `#00FF00`: SÍMBOLO,
  > crisp 16-bit pixel art, near-black outline, hard edges, no frame. The
  > subject must contain NO green at all and must not have any green fringe
  > around it. STRICT palette: #0B3A40, #6EFFF8, #C68642, #0D0D0D plus natural
  > accent tones. NO magenta, purple, violet or pink — not even in glow, halo,
  > border or anti-aliasing. Square 1:1 full-bleed composition.
  > - **Carinho** → `two hands cupping a small glowing heart`
  > - **Banho** → `three rising soap bubbles with a highlight in each`

### A21.2 · O marco de 21 dias — **isto é TROCA DE GLIFO, não arte**

O 🪴 do marco de 21 dias está **dentro de uma frase** (`App.tsx`, mensagem PT e
EN do tier `sapling`), e texto inline não aceita `<img>`. Arte não resolve: a
frase precisa de um glifo que exista em qualquer aparelho.

⚠️ **Decisão do dono, ainda em aberto.** A troca natural é `🌿` (Emoji 1.0),
que já é o glifo do tier anterior (`sprout`) — usar o mesmo nos dois tiers
apagaria a progressão visual. As alternativas sem esse problema: `🌾`, `☘️` ou
`🎍`. Enquanto não houver decisão, o marco de 21 dias — que é um dos momentos
que o produto trata como alto — aparece com uma caixa vazia no meio da frase.

### Como gerar esta folha

São peças pequenas e relacionadas: **uma folha só**, em grade sobre fundo verde
chapado, fatiada por projeção de pixels depois (linhas e colunas totalmente
vazias), nunca por grade fixa. E **fundo verde, não "transparente"**: o gerador
assa o xadrez de transparência nos pixels em vez de entregar alfa de verdade —
já entrou asset assim neste repositório, e é o que o
`src/assets/assets.contract.test.ts` barra. O recorte é por chroma-key depois
(chroma-key → despill → descarte de ilhas de ruído → recorte da bounding box →
reescala *nearest*).

---

## Estado da conta de geração (atualizar ao usar)

- **Higgsfield CLI:** `mateus.sprnd@gmail.com`, plano pro — **1,5 crédito**
  (14/08/2026; conferido 15/08 — o sandbox desta sessão não alcança o gerador,
  então a rodada 5 só escreveu prompts, não gerou). Custo `gpt_image_2` 1k: low 0,5 · medium 2 · high 4.
  Rode `higgsfield generate cost <job> --quality X --prompt "..."` antes de
  lotes grandes. Limite de **4 jobs concorrentes** no plano — disparar mais
  derruba TODOS com `rate_limit_reached`, inclusive os que caberiam.
- **Gemini (navegador):** conta logada, com histórico de gerações no mesmo
  estilo. ⚠️ A janela do Chrome precisa estar **visível na tela** — minimizada
  ela reporta `Viewport: 0x0` e cliques/digitação não chegam.

## Depois de gerar — checklist

1. Salvar no caminho de destino exato desta lista.
2. `npx vitest run src/assets/assets.contract.test.ts` — o guard barra xadrez
   assado, ruído pontilhado e pixel fora da paleta. **Se acusar, o asset está
   errado.**
3. Se substituiu um arquivo em quarentena, tirar a entrada de `QUARANTINE` no
   guard (ele exige que o defeito ainda exista, senão falha).
4. `npm run build` (converte PNG→WebP) e **bump `CACHE_VERSION`** em
   `public/sw.js`.
5. Marcar `✅ feito` aqui, com data e gerador.
