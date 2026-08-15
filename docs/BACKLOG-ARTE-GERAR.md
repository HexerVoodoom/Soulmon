# Backlog de arte a gerar — Soulmon

> Lista viva. Cada item traz **prompt pronto pra colar**, **arquivo de destino
> dentro do projeto**, **onde é usado** e **o que anexar como referência**.
> Ao concluir um item: marque `✅ feito`, com a data e o gerador usado.

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

### A2 · Botões — estados hover e active (sem magenta)
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

## P2 — melhoram, não destravam

### A4 · Nós do Soul Link (grafo de evolução)
- **Destino:** `src/assets/soulmon/nodes/node-{lit,dim,active}.png` (128×128)
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

### A8 · Sprite do cocô
- **Destino:** `src/assets/9087038….png`
- **Uso:** mecânica de cocô na Home
- **Por quê:** registrado em `docs/STATUS.md` §4 como "blob escuro pouco
  legível". Anterior a este trabalho.

---

## Estado da conta de geração (atualizar ao usar)

- **Higgsfield CLI:** `mateus.sprnd@gmail.com`, plano pro — **1,5 crédito**
  (14/08/2026). Custo `gpt_image_2` 1k: low 0,5 · medium 2 · high 4.
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
