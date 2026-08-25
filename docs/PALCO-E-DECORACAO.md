# O palco do pet — composição e decoração

Especificação da caixa onde o pet vive (`CompanionHUD`) e dos espaços que a
decoração ocupa. **Este é o contrato com quem desenha a arte**: cada espaço tem
tamanho fixo em px, e a arte é feita PARA a caixa — o app não a redimensiona
por conta própria.

Fonte da verdade em código: `src/utils/petStage.ts`. Se este documento e o
código divergirem, o código vence — e o documento está errado.

---

## Geometria

| | |
|---|---|
| Altura do palco | **250 px** |
| Largura útil | ~300 px num aparelho de 412 px (o palco é o que sobra à direita da coluna de botões) |
| **Linha do chão (`GROUND_Y`)** | **74 %** da altura — 185 px do topo |
| Sprite do pet | 80×80 px, centrado em 50 % com `marginTop: -20px` → base exatamente em 74 % |

A linha do chão não é uma escolha estética: é onde os pés do pet caem hoje.
Toda decoração apoiada no piso usa a MESMA linha, e é isso que faz pet e
cenário parecerem estar no mesmo lugar. Há teste travando a conta
(`petStage.test.ts`), então mudar o tamanho do sprite ou a altura do palco
quebra o build em vez de fazer a decoração flutuar em silêncio.

---

## Os cinco espaços

Coordenada `x` é o **centro** da peça, em % da largura do palco.

| Espaço | x | Caixa (px) | Ancoragem | Para quê |
|---|---|---|---|---|
| `rug` | 50 % | **104 × 16** | deitado sobre a linha do chão | tapete/esteira — o pet anda por cima |
| `floor-left` | 16 % | **56 × 56** | base na linha do chão | peça grande: sofá, estante, fogueira, barraca |
| `trophy` | 47 % | **46 × 50** | base na linha do chão | vitrine de conquistas (só itens do Torneio) |
| `floor-right` | 84 % | **48 × 52** | base na linha do chão | peça pequena: luminária, planta, pedra |
| `wall` | 68 % | **56 × 40** (topo em 20 %) | pendurado pelo topo | estandarte, quadro, mural — acima da cabeça do pet |

Regras de desenho:

- **A arte preenche a caixa, ancorada embaixo.** Uma peça mais baixa que a
  caixa deve ter o espaço vazio no TOPO do arquivo, nunca embaixo — senão ela
  flutua acima do chão.
- **Nada de sombra desenhada na arte.** O app desenha uma sombra de contato
  elíptica sob todas as peças de chão; uma segunda sombra na arte dobra.
- **Nenhuma peça de chão fica no centro exato** (o pet passa a maior parte do
  tempo ali) e nenhuma encosta na borda (o box tem cantos arredondados que
  cortam). Há teste garantindo que as peças de chão não se sobrepõem.
- Tudo é desenhado **atrás do pet**. É cenário; o pet anda na frente.

### Espaço vazio é vazio

Sem decoração equipada, o espaço não desenha **nada** — sem contorno tracejado,
sem "+", sem marcação. Quem não decorou vê o cenário limpo, não um formulário
pela metade. Isso é regra de produto, não detalhe de implementação.

---

## Cenários

Todo cenário (`src/utils/backgrounds.ts`) declara três coisas:

- **`setting`** — onde a cena se passa:
  - `indoor` — tem parede e piso (hoje: só o Quarto)
  - `outdoor` — céu aberto e terreno (a maioria)
  - `void` — abstrato, sem chão legível (Matriz Verde, LCD Retrô, Fundo do Mar).
    **Não aceita decoração nenhuma.** Melhor recusar do que desenhar torto.
- **`slots`** — quais dos cinco espaços aquele cenário oferece. Cenas de céu
  aberto sem nenhuma superfície vertical (Céu Noturno, Deserto, Terra Gelada,
  Monte Infinito, Aurora, Synthwave) **não oferecem o `wall`**: um estandarte
  pendurado no nada lê como bug, não como decoração.
- **`horizonY`** — a altura (%) em que o chão começa. Tem que ser **≤ 74 %**,
  senão o pet e a decoração ficam apoiados no céu.

> `horizonY` é um número declarado à mão, e **não** deduzido do CSS, por um
> motivo aprendido na marra: o CSS de um cenário é uma pilha de gradientes onde
> `74%` tanto pode ser a linha do piso quanto a coordenada horizontal de uma
> estrela. A primeira versão do teste procurava a string no CSS inteiro e
> passava sem verificar nada.

### Cenário PINTADO (`url(...)`) — o que muda

Oito cenários já não são gradiente: são arte de 1200×648 com o chão desenhado na
linha do palco. Três coisas neles são diferentes, e as três foram aprendidas
errando:

1. **O visor desenha com `auto 100%`, nunca `cover`.** A ALTURA é o eixo onde
   mora a linha do chão, então é ela que tem de mapear 1:1. `cover` parece certo
   no celular e quebra no desktop: numa caixa de 1500×185 (~8:1) ele escala pela
   largura e o chão vai parar centenas de px abaixo da borda de baixo.
   `100% 100%` resolveria a linha, mas deforma o pixel.
2. **A arte é pintada na CAIXA DA COMPOSIÇÃO** (250px, ancorada embaixo), e não
   na tela do visor — que corta pelo topo e por isso tem outra altura. Medir os
   72% da arte contra a janela e os 74% do `GROUND_Y` contra os 250px é comparar
   duas réguas: a decoração ficava ~13px acima do piso desenhado.
3. **`baseColor`** preenche o que sobra nas laterais quando a caixa é mais larga
   que a proporção da arte. Amostrada da faixa de baixo do próprio PNG.

O teste de deriva (`petStage.test.ts`) só sabe conferir gradiente, então ele
**pula** quem começa com `url(`. O que garante esses oito é a arte ter sido
encomendada para a caixa — a mesma regra da decoração.

---

## Itens de decoração

Todo item `kind: 'furniture'` (`src/utils/shop.ts`) declara:

- **`slot`** — qual espaço ocupa. Faz parte da identidade do item, porque a arte
  é desenhada para aquela caixa. Não existe "equipar em outro lugar".
- **`fits`** — em que tipo de cenário faz sentido: `indoor`, `outdoor` ou `any`.

Equipar coloca o item no seu espaço e **substitui** quem estava lá — um espaço,
um item, nunca empilha. Tocar de novo no botão **Equipado** desequipa e deixa o
espaço vazio (e vazio é vazio: some sem deixar marcação).

A regra vive em `applyDecorEquip` (`utils/petStage.ts`), função pura e testada.
Ela exige o `slot` explicitamente, inclusive ao desequipar: com `itemId: null`
não há item de onde deduzir o espaço. A primeira versão deduzia pelo id e, ao
desequipar, não achava nada e devolvia o estado intocado — o botão "Equipado"
simplesmente não fazia nada. Há teste de regressão.

Um item equipado que não combina com o cenário atual **não é desenhado**, mas a
loja diz isso na cara: *"Equipado, mas não aparece no cenário atual — troque de
cenário para vê-lo."* Sumir em silêncio é bug; sumir com explicação é
composição.

Há teste garantindo que **todo espaço tem pelo menos um item que o ocupa** e
que **os espaços de chão têm opção para cenário externo** — a maioria dos
cenários é ao ar livre, e um catálogo só de móvel de sala deixaria esses
jogadores sem decoração nenhuma.

---

## A vitrine de troféus

O espaço `trophy` existe por causa do Torneio e só aceita itens comprados com
**Emblemas** (há teste travando isso — abrir a vitrine para Bits esvaziaria o
sentido de ganhar troféu).

O que ele exibe não é enfeite genérico: sobre o móvel aparecem até **3 medalhas
das seasons realmente vencidas** (`gameState.trophies`, 🥇🥈🥉 conforme a
colocação). Sem troféus ganhos, aparece só o móvel — a vitrine vazia é a
verdade, não uma falha.

---

## Estado no save

```ts
equippedDecor?: Partial<Record<SlotId, string>>
// { 'floor-left': 'furn-sofa', trophy: 'furniture-podium', wall: 'furn-picture' }
```

Substituiu o antigo `equippedFurniture` (um item só, desenhado como badge de
32 px no canto). Saves antigos são migrados no load (`migrateDecor` em
`GameStateContext.tsx`): o item que estava equipado vai para o espaço que ele
declara, e o campo antigo é **apagado do estado na mesma hora** — some do save
no próximo gravar. `equippedFurniture` continua no tipo, marcado como
deprecated, só para conseguir ler saves velhos.

Duas coisas que a migração tem que acertar, ambas com teste:

- **Rodar uma vez só.** Enquanto o campo antigo sobrevivia no save, a migração
  reaparecia a cada carga.
- **`equippedDecor` vazio (`{}`) é decisão do jogador**, não ausência de
  migração. Tratar os dois como a mesma coisa fazia com que quem tinha save
  antigo desequipasse o item, recarregasse e ele voltasse sozinho.

---

## Cocô e comida

Os sprites de cuidado (`CareSystem.tsx`) também se apoiam na linha do chão, em
x = 66 % — a faixa livre entre a vitrine (47 %) e o canto direito (84 %). Antes
eram `bottom-3 right-3`, uma regra anterior ao palco que os deixava boiando
abaixo do piso; com o resto da cena alinhada, isso ficou visível.

## A arte (feita)

Todas as peças à venda têm PNG de verdade em `src/assets/decor/`, registrado em
`utils/decorArt.ts` — o emoji do `ShopItem` sobrou só como identidade de
inventário. Os sprites são gerados em 3× a caixa do slot (312×48 para o
`rug` de 104×16, 168×168 para um `floor-left` de 56×56) com fundo alfa de
verdade, recortados até a margem transparente e encaixados com `contain`.

Duas coisas aprendidas ao fechar isso, e que valem para a próxima leva:

- **O `rug` era o buraco real.** Existia UM tapete e ele era `indoor`, enquanto
  o pet passa a maior parte do tempo em cenário aberto — quem jogava lá fora não
  tinha chão nenhum para comprar. Ao acrescentar peça de chão, cheque a
  distribuição por `fits`, não só a contagem por slot.
- **Peça de chão é 6,5:1 e some no card quadrado da loja.** `ShopModal` desenha
  as peças de `rug` com `object-fit: cover` justamente por isso: chão é textura,
  e um pedaço ampliado dela diz mais que a tira inteira espremida em 7px.

---

## A mobília base (o berço) — `BASE_SLOTS`

Além dos cinco espaços de decoração, existe **um espaço que o app preenche
sempre**, sem passar pela loja: a mobília debaixo do pet. Hoje é o berço.

| Espaço | x | Caixa (px) | Origem vertical |
|---|---|---|---|
| `nest` | 50 % | **148 × 83** | `top: 50%` da área do pet + `yPx` |

Por que ele **não** é um `SlotId`:

- os cinco espaços são o catálogo do jogador — a loja vende para eles,
  `equippedDecor` os grava no save, e há teste exigindo que todo `SlotId` tenha
  ao menos um item à venda. O berço não é comprado nem equipado;
- pôr o berço no `rug` roubaria do jogador o espaço do tapete que ele comprou.

**A arte entra por fora.** `src/components/nestArt.ts` é a fronteira de troca —
o único arquivo que sabe *com que PNG* o espaço é desenhado, no mesmo contrato
do `components/evolution/nodeArt.tsx`. Trocar o berço por outra mobília é: pôr o
PNG em `src/assets/soulmon/`, acrescentar uma entrada em `NEST_ART`, e mudar
qual id o `CompanionHUD` pede. Nenhuma outra linha muda, e nenhuma geometria se
mexe.

### ⚠️ `GROUND_Y` está defasado

O berço **não** é posicionado por `GROUND_Y`. Os 74 % foram medidos quando o
sprite do pet tinha 80 px; hoje ele tem **152 px** (`PET_BOX`) e a renderização
real deixou de bater com a tabela do começo deste documento. Enquanto a conta do
palco não for refeita, pet e berço dividem uma origem única e declarada
(`PET_TOP_OFFSET` e `BASE_SLOTS.nest.yPx`, em `utils/petStage.ts`).

Enquanto isso valer, a decoração dos cinco espaços continua ancorada em
`GROUND_Y` — ou seja, **ela e o pet não estão exatamente na mesma linha de
chão**. Refazer essa conta é trabalho próprio, e está registrado como pendência.


#### Os números, medidos (ago/2026)

Com cenário PINTADO o desalinhamento deixou de ser teórico: a decoração se
apoia numa linha de piso desenhada e o pet fica **54px abaixo dela**. Medido no
navegador, numa composição de `STAGE_HEIGHT` = 250:

| o quê | px do fundo da composição |
|---|---|
| `GROUND_Y` (74%) — onde a decoração encosta | **65** |
| base da caixa de render do pet (`PET_BOTTOM_IN_STAGE`) | **11** |
| base do berço | 25 |

Para o pet pisar na linha, `PET_TOP_OFFSET` teria de ir de **−38 para −92**
(`125 + X + PET_GROUND_KEEP = GROUND_Y_px − PET_RENDER`). O topo da caixa de
render sobe de 111 para **57**.

**E é aqui que a conta esbarra numa decisão que não é técnica:** a janela do
palco corta pelo TOPO. Com `--sm-petstage-h: 215px` ela começa em y=35, e 57 >
35 — cabe. Mas em tela baixa (`max-height: 800px` → 175px) ela começa em
**y=75**, e o pet perderia **18px de cabeça**.

Ou seja: hoje o pet flutua abaixo do piso em todas as telas; o conserto o põe no
lugar e corta a cabeça dele nas telas baixas, a menos que a janela também
cresça (o que custa altura da lista de atividades — o motivo declarado de a
janela existir). É troca de um defeito por outro e a escolha é do dono. Mexer em
`PET_TOP_OFFSET` sem mexer em `--sm-petstage-h` **não** é o conserto.