# Handoff — sessão de geração de arte (Gemini no navegador)

> **Escrito em 08/09/2026.** É a sessão de arte que o dono adiou de propósito
> para ser feita sozinha, com atenção inteira.
>
> Este documento tem tudo: o método que já funcionou, os prompts prontos, **como
> avaliar cada resultado antes de aceitar** e os erros que já custaram assets em
> quarentena. Leia inteiro antes de gerar a primeira imagem — metade das
> armadilhas aqui só aparece depois de 20 gerações perdidas.

---

## 1. O que precisa ser gerado

Duas frentes, nesta ordem de prioridade:

| # | O quê | Peças | Onde aparece | Prioridade |
|---|---|---|---|---|
| **A7 / 5.1** | **Decoração do palco** | 14 | os 5 espaços do palco do pet | **Alta** — é o último item aberto da Fase 5, e o `PLANO-EVOLUCAO.md` chama de "maior retorno visual disponível" |
| **A20** | **Cenas da aventura da noite** | 24 | card do relatório noturno + diário na página do pet | Média — funciona com emoji hoje |

Se der tempo para mais, o `docs/BACKLOG-ARTE-GERAR.md` tem outros itens em
aberto (A3, A9, A10, A12, A13, A15, A16). **Não comece por eles.**

---

## 2. O método — validado na marra, não invente outro

### 2.1 A condição que trava tudo

**A janela do Chrome tem de estar VISÍVEL na tela.** Minimizada ou em segundo
plano, a página reporta `Viewport: 0x0`, a geração fica presa em "Creating your
image" e cliques não registram. Um `screenshot` na aba costuma trazê-la à frente
e destravar. Se nada funciona e não há erro nenhum, **é isto**, em 9 de 10 casos.

### 2.2 As cinco regras de prompt que já foram pagas caro

1. **Sempre anexe a referência de estilo.** Sem ela o gerador inventa um estilo
   próprio e o lote sai inconsistente. As referências vivem em `docs/ui-refs/`:
   `REF-kit-v12.png` (paleta, tipografia, ícones), `REF-home.png` (a Home
   aplicada), `ref-asset-sheet-v1.png` (folha anterior).

2. **"Fundo transparente" é mentira do Gemini.** Ele *assa o xadrez de
   transparência nos pixels* em vez de entregar alfa real — ele mesmo avisa isso
   na resposta. Já entraram assets assim no repositório (`nest-base.png`,
   `icon-reset.png`) e o guard os barrou. **Peça fundo verde chapado `#00FF00`**,
   diga explicitamente que a peça não pode ter verde nem franja verde em volta, e
   recorte por chroma-key depois (§4).

3. **A proporção vai no FIM do prompt.** Sem a linha final, o Gemini devolve
   proporção aleatória (medido: razões 0,56 / 0,67 / 1,83, todas erradas). Com
   ela, obedece — confirmado em 2048×2048 exato.

4. **Gere em FOLHA quando os itens forem pequenos e relacionados.** Uma grade
   sobre fundo branco sólido, uma geração só, fatiada depois **por projeção de
   pixels** (linhas/colunas totalmente vazias), nunca por grade fixa — assim o
   corte se adapta se o espaçamento vier diferente do pedido. Troca 24 gerações
   por 1 e evita o gargalo de download. **Não serve** para peça que precisa de
   resolução nativa cheia.

5. **Corrigir um atributo que saiu errado: reprodução fiel bate descrição.** Se
   já existe uma imagem aprovada do MESMO elemento saindo errado, **anexe-a** e
   peça *"recreate this exact illustration, preserving precisely [o atributo] —
   this is a faithful reproduction of an already-approved design, not a new
   interpretation"*. Descrever o atributo de novo por escrito falhou 2 rodadas
   seguidas num caso medido.

### 2.3 O ciclo na UI

1. **Clique por referência de elemento** (`ref` do `find`/`read_page`), **nunca
   por coordenada de pixel** — clique por coordenada frequentemente não registra
   nesta UI.
2. Depois de abrir conversa nova, a **primeira** tentativa de digitar costuma
   falhar em silêncio; a **segunda** pega. **Confira por screenshot que o texto
   entrou** antes de enviar.
3. Espere **~50–60 s**. O texto da resposta aparece antes de a imagem terminar.
4. **Recarregue a conversa pela URL antes de baixar** — sem isso a imagem às
   vezes não "assenta" e o botão de download não funciona.
5. **Baixe imediatamente**, sem navegar para fora da conversa antes. Clique em
   "Baixar imagem no tamanho original" pelo `ref` e espere ~15 s.
6. **Confira por hash (MD5/SHA) que o arquivo é diferente do anterior** — o
   download às vezes reentrega o arquivo já obtido.
7. O botão **"Refazer" NÃO gera imagem nova** (confirmado por MD5 idêntico).
   Para variações reais, **conversa nova com o mesmo prompt**.
8. **Conversa que já falhou o download 2× está "envelhecida"** — não insista.
   Abra conversa nova e baixe logo após renderizar. Isso resolveu 100% dos casos
   travados numa sessão anterior.

### 2.4 Bloqueios que só o dono resolve — avise, não insista

- **Chrome pode parar de aceitar downloads automáticos** depois de vários
  seguidos. Sintoma: o botão responde, a imagem está lá, e nenhum arquivo cai.
  O dono precisa liberar em `chrome://settings/content/automaticDownloads`.
- **Barra nativa "Manter/Descartar"** do Chrome (para tipo incomum como `.jfif`)
  é UI do navegador e **a automação não enxerga nem clica**. Se os downloads
  pararem sem erro, peça ao dono para olhar a barra de downloads.
- `curl`/`fetch` direto na URL da imagem devolve **403** — ela exige a sessão
  autenticada do navegador.
- A extensão **pode aparecer desconectada no meio da sessão**. Não fique
  tentando reconectar: avise o dono e espere.

---

## 3. Regras de arte do projeto — valem para TODA peça

**Paleta obrigatória** (do UI Design Kit v1.2):
`#0B3A40` teal profundo · `#6EFFF8` ciano neon · `#C68642` cobre ·
`#1E9EFE` elétrico · `#0D0D0D` contorno

> ⚠️ **PROIBIDO magenta, roxo, violeta e rosa** — inclusive em brilho, halo,
> borda e anti-aliasing. A paleta ANTIGA do projeto era roxa e **o gerador a
> reintroduz sozinho**: 6 PNGs de botão foram para quarentena por 6–12% de
> pixels magenta. **Diga isso explicitamente em todo prompt.**

> ⚠️ **Não use arte de franquia como referência de estilo.** A referência
> anterior do projeto era arte de terceiro que **saiu do repositório** (ver
> `docs/Attributions.md`). Use os sprites de `src/assets/soulmon/`.

---

## 4. Depois de gerar — a checagem que decide se o asset presta

### 4.1 Recorte por chroma-key

O script existe e está testado:

```bash
node product/soulmon-01/ui/arte-pendente/chroma-key.mjs <entrada.png> <saida.png> <tamanho>
```

Ele faz, em ordem: chroma-key do verde → **despill** (tira a franja verde) →
descarte de ilhas com menos de 24 px (o ruído pontilhado) → recorte da bounding
box → reescala **nearest** (nunca bilinear: borra pixel art) → centraliza numa
tela quadrada de `<tamanho>`. Ele imprime um JSON com `killed` (pixels de ruído
descartados) e a bbox — **se `killed` vier alto, a geração tinha ruído e vale
regerar**.

⚠️ O `chroma-key.mjs` centraliza em **quadrado**, e as caixas da decoração não
são quadradas (ex.: `104×16` do tapete). Para elas use o irmão dele, escrito na
auditoria de 08/09/2026 exatamente para isso:

```bash
node scripts/decor-para-caixa.mjs <entrada.png> <saida.png> <L> <A> [--chao]
```

Mesmo algoritmo de recorte, com a tela de saída **retangular** no tamanho do
slot × 2. O `--chao` ancora a peça embaixo, que é o certo para tudo que fica
apoiado no chão (o `rug`, o `floor-left`, o `floor-right` e o `trophy`) — sem
ele a peça flutua dentro da caixa.

### 4.2 O guard — ele é a régua, não o teste

```bash
npx vitest run src/assets/assets.contract.test.ts
```

Ele barra os três defeitos que já entraram no repositório:

- **xadrez de transparência assado nos pixels**;
- **nuvem de ruído pontilhado** (aconteceu em 7 sprites de criatura);
- **magenta/roxo fora da paleta**.

> **Se ele acusar, o asset está errado — não o teste.** Não altere o guard nem
> mova nada para `QUARANTINE` para "passar".

### 4.3 Avaliação a olho, antes de aceitar

Para cada peça, nesta ordem:

1. **Abra em 100% do tamanho final** (48–56 px na decoração; ~28 px nas cenas de
   aventura). Pixel art que só lê em 512 px **não serve** — é o erro mais comum
   e o mais fácil de deixar passar.
2. **Contorno escuro de 1 px** em volta da silhueta. Sem ele a peça some sobre
   os cenários escuros (há 11 cenários à venda, claros e escuros).
3. **Sem sombra projetada no arquivo** — o palco já desenha a sua.
4. **Sem anti-aliasing suave, sem gradiente, sem blur.**
5. **4 a 6 cores por peça**, mais o contorno.
6. **Franja verde**: amplie as bordas. Se sobrou verde, o despill falhou —
   regere em vez de tentar limpar à mão.

### 4.4 Fechamento

1. Salvar no caminho de destino exato.
2. Rodar o guard (§4.2).
3. `npm run build` (converte PNG→WebP).
4. **Subir o `CACHE_VERSION` em `public/sw.js`** — sem isso quem já tem o app
   instalado continua com a arte velha.
5. Marcar `✅ feito` no `docs/BACKLOG-ARTE-GERAR.md`, com data e gerador.

---

## 5. Frente 1 — Decoração (14 peças)

**Brief completo:** `docs/BRIEF-ARTE-DECORACAO.md` — leia. Aqui vai o resumo
operacional.

**Destino:** `src/assets/decor/<id>.png` · **Uso:** `utils/petStage.ts`

### 5.1 As caixas (a peça tem de ler NESTE tamanho)

| Espaço | Caixa (px) | Ancoragem |
|---|---|---|
| `rug` | **104 × 16** | deitado no chão, o pet anda POR CIMA |
| `floor-left` | **56 × 56** | apoiado no chão, peça grande |
| `trophy` | **46 × 50** | apoiado no chão |
| `floor-right` | **48 × 52** | apoiado no chão, peça pequena |
| `wall` | **56 × 40** | pendurado, acima da cabeça |

### 5.2 As 14 peças

| id | Espaço · caixa | Direção de arte |
|---|---|---|
| `furn-sofa` | floor-left · 56×56 | sofá de dois lugares, de frente, almofadas visíveis, tecido em tom quente |
| `furn-chair` | floor-left · 56×56 | poltrona de orelha, mais estreita que o sofá, encosto alto |
| `furn-books` | floor-left · 56×56 | estante de 3 prateleiras, lombadas coloridas, madeira |
| `furn-lamp` | floor-right · 48×52 | luminária de pé, cúpula acesa em amarelo suave, base fina |
| `furn-rug` | rug · 104×16 | tapete oval visto de cima em forte perspectiva, patinhas estampadas, franja nas pontas |
| `furn-plant` | floor-right · 48×52 | vaso de barro com folhagem larga, folhas em dois tons de verde |
| `furn-picture` | wall · 56×40 | moldura retangular com retrato genérico de criatura, **sem identificar espécie** |
| `furn-campfire` | floor-left · 56×56 | gravetos cruzados, chama laranja/amarela, pedras na base |
| `furn-tent` | floor-left · 56×56 | barraca triangular de camping, abertura escura, estacas |
| `furn-rock` | floor-right · 48×52 | pedra arredondada com musgo no topo, dois tons de cinza |
| `furniture-champion-banner` | wall · 56×40 | flâmula pendurada, dourada com detalhe escuro, ponta em V |
| `furniture-medal-wall` | wall · 56×40 | placa de madeira com 3 medalhas penduradas por fitas |
| `furniture-trophy-shelf` | trophy · 46×50 | estante de 2 prateleiras **VAZIA** — o jogo desenha os troféus por cima |
| `furniture-podium` | trophy · 46×50 | pódio de 3 degraus (2º–1º–3º) **VAZIO** — os troféus entram por cima |

⚠️ As duas últimas **têm de sair vazias**. Se vierem com troféu desenhado, o
jogo empilha troféu sobre troféu.

### 5.3 O prompt (uma peça por geração)

Troque `<PEÇA>` pela direção de arte e `<L>×<A>` pela caixa.

```
16-bit pixel art sprite of <PEÇA>, drawn as a single object on a solid flat
chroma green background (#00FF00). The object itself must contain no green at
all, and must have no green fringe or halo around its edges. No shadow, no
ground line, no scenery.
Front view, very slightly from above. Limited palette of 4-6 colors plus a dark
1px outline around the silhouette. Crisp hard-edged pixels, no anti-aliasing,
no gradients, no blur. Even neutral lighting from above.
Absolutely no magenta, purple, violet or pink anywhere — not in the object, not
in glows, outlines or edges.
The object must be fully readable at <L>×<A> pixels.
Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games.
Square 1:1 full-bleed composition.
```

**Só para `furn-rug`**, acrescente antes da última linha:

```
Extreme foreshortening: the object is lying flat on the ground, seen at a very
shallow angle, occupying a very wide and short area.
```

> **Alternativa mais rápida, se o dono topar:** `scripts/gen-decor.mjs` já gera
> as 14 pelo CLI da Higgsfield, com o prompt-base montado. Não roda em sandbox
> de agente (403 no CONNECT para `higgsfield.ai`) e a conta tem **1,5 crédito**
> — o suficiente para 3 peças em `low`. Confira o saldo antes.

---

## 6. Frente 2 — As 24 cenas da aventura (A20)

**Destino:** `src/assets/soulmon/adventures/<id>.png`
**Fonte da verdade dos ids:** `ADVENTURE_CATALOG` em `src/utils/adventure.ts`
— confira lá antes de gerar; a tabela abaixo é cópia e cópia diverge.

**Tamanho de uso:** 28 px no card do relatório, 24 px no diário. São peças
pequenas → **gere em FOLHA** (§2.2, regra 4).

### 6.1 A regra de tom, e ela é o ponto

> **São objetos e paisagens SEM A CRIATURA DENTRO.**

Quem viajou foi ela; quem lê ficou em casa. A cena é **o que ela viu**, não um
retrato dela. Uma peça com o pet no meio vira ilustração de mascote e desfaz o
sentido inteiro da mecânica. Diga isso no prompt e **rejeite qualquer peça com
personagem**.

### 6.2 As 24 cenas

| id | faixa | cena |
|---|---|---|
| `adv-orvalho` | comum | dew on a broad leaf |
| `adv-pegadas` | comum | footprints in soil, looping around |
| `adv-pedra-lisa` | comum | a smooth river stone |
| `adv-vento-morno` | comum | tall grass bending in warm wind |
| `adv-semente` | comum | a sprout growing from a crack in rock |
| `adv-eco` | comum | a narrow valley between two cliffs |
| `adv-caminho-curto` | comum | a forking dirt path |
| `adv-chuva-curta` | comum | a big mushroom in light rain |
| `adv-sombra-boa` | comum | a small tree casting a pool of shade |
| `adv-passaro` | comum | a small bird perched, facing viewer |
| `adv-concha` | comum | a seashell lying in a grass field |
| `adv-nuvem` | comum | a single cloud in a clear sky |
| `adv-porta-arvore` | raro | a tiny door in a tree trunk, with a handle |
| `adv-lago-espelho` | raro | a still lake reflecting a starry night under an overcast sky |
| `adv-mapa-rasgado` | raro | half of an old torn map |
| `adv-sino` | raro | a small bronze bell with no clapper |
| `adv-escada` | raro | a wooden ladder standing upright, leaning on nothing |
| `adv-carta` | raro | a sealed letter with a blank front |
| `adv-flor-fora` | raro | a single flower in bloom amid bare branches |
| `adv-trilha-antiga` | raro | a small abandoned house, empty doorway |
| `adv-cometa` | lendário | a bright streak across a daytime sky |
| `adv-guardiao` | lendário | a huge weathered stone statue head, moss-covered |
| `adv-ponte` | lendário | an old stone bridge disappearing into mist |
| `adv-aurora` | lendário | an aurora across the whole sky |

### 6.3 O prompt da folha (uma geração para 12 peças)

Gere **duas folhas de 12** — 24 numa grade só sai pequeno demais para o
fatiamento ficar limpo. Liste as 12 cenas da folha no lugar de `<LISTA>`,
numeradas.

```
A single image containing a 4x3 grid of 12 separate small pixel-art icons on a
solid flat white background, evenly spaced, each icon clearly separated from the
others with generous empty white margin between them.
Each icon is a 16-bit pixel art vignette of a scene or object from nature, drawn
as a single small subject. NO CHARACTERS, no creatures, no people, no mascots —
objects and landscapes only.
The 12 icons, in reading order:
<LISTA>
Style for every icon: crisp hard-edged pixels, no anti-aliasing, no gradients,
no blur. Limited palette of 4-6 colors per icon plus a dark 1px outline around
the silhouette. Even neutral lighting. Quiet, gentle, contemplative mood.
Absolutely no magenta, purple, violet or pink anywhere — not in the objects, not
in glows, outlines or edges. (The aurora may use teal, cyan and green only.)
Each icon must be fully readable at 28x28 pixels.
Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games.
Square 1:1 full-bleed composition.
```

⚠️ **`adv-aurora` é a armadilha do lote**: aurora puxa roxo, e roxo é proibido.
A linha entre parênteses existe para isso. Se vier roxa mesmo assim, gere essa
peça **sozinha**, fora da folha.

### 6.4 O fatiamento

Fatie **por projeção de pixels** — encontre as linhas e colunas totalmente
brancas e corte nelas —, **nunca por grade fixa**. O Gemini não respeita o
espaçamento pedido com precisão, e a grade fixa corta peça no meio.

Depois de fatiar, cada peça passa pelo chroma-key? **Não** — a folha é sobre
fundo BRANCO, não verde. Para peças pequenas de folha, remova o branco por
limiar e faça o recorte da bbox. Se preferir alfa perfeito, gere as peças
individualmente sobre `#00FF00` e use o `chroma-key.mjs`.

### 6.5 O código que consome

Depois das 24 prontas, criar `src/utils/adventureArt.ts` espelhando
`src/utils/dreamArt.ts`:

```ts
export const ADVENTURE_ART: Record<string, string> = { 'adv-orvalho': ..., };
```

O mapa fica **fora** de `utils/adventure.ts` de propósito — aquele módulo é de
funções puras, testado em Node, e um `import ... from '*.png'` ali amarraria a
regra ao pipeline do Vite. O mesmo comentário está em `dreamArt.ts`.
**O `emoji` FICA no catálogo mesmo depois da arte**: é o único glifo que cabe
num push, num título de notificação ou num log, onde não há `<img>`.

Consumidores a atualizar: o card em `DailyReportModal` e a lista em
`AdventureDiary` — os dois hoje renderizam `achado.emoji`.

---

## 7. O prompt para abrir a sessão

Copie daqui para baixo.

---

Você vai gerar **arte para o Soulmon usando o Gemini no navegador**, na máquina
do dono, com o Chrome logado na conta dele.

**Leia primeiro:** `docs/HANDOFF-ARTE-GEMINI.md` — foi escrito para você e tem o
método, os prompts prontos, os critérios de aceitação e os erros que já custaram
assets em quarentena. Depois `docs/BRIEF-ARTE-DECORACAO.md` e o topo de
`docs/BACKLOG-ARTE-GERAR.md`.

**Antes de começar, confirme com o dono que a janela do Chrome está visível na
tela** — minimizada, o Gemini reporta viewport 0x0 e nada funciona, sem erro
nenhum.

**Ordem do trabalho:**

1. **As 14 peças da decoração** (§5 do handoff). É o último item aberto da Fase
   5 e o de maior retorno visual.
2. **As 24 cenas da aventura** (§6), em duas folhas de 12.

**Três coisas que decidem se o trabalho presta, e que eu quero que você trate
como não-negociáveis:**

- **Nada de magenta, roxo, violeta ou rosa** — nem em brilho, borda ou
  anti-aliasing. A paleta antiga do projeto era roxa e o gerador a reintroduz
  sozinho; 6 PNGs já foram para quarentena por isso.
- **Peça que só lê em 512 px não serve.** Abra cada uma no tamanho FINAL
  (48–56 px na decoração, ~28 px nas cenas) antes de aceitar.
- **As cenas de aventura não têm criatura, pessoa ou mascote dentro** — são
  objetos e paisagens. Quem viajou foi o pet; a cena é o que ele viu.

**Depois de cada lote:** rode `npx vitest run src/assets/assets.contract.test.ts`.
Se ele acusar, **o asset está errado, não o teste** — não mexa no guard nem use
a lista de quarentena para passar. Feche com `npm run build` e o bump do
`CACHE_VERSION` em `public/sw.js`.

**Ambiente:** use o Node 22 portátil de `E:/tools/node/node-v22.23.2-win-x64`.

**Me mostre as primeiras 3 peças antes de gerar as outras 11** — se o estilo
estiver errado, quero saber antes de você gastar o lote inteiro.
