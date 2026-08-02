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
declara. A migração é idempotente e `equippedFurniture` continua no tipo, marcado
como deprecated, só para isso.

---

## Cocô e comida

Os sprites de cuidado (`CareSystem.tsx`) também se apoiam na linha do chão, em
x = 66 % — a faixa livre entre a vitrine (47 %) e o canto direito (84 %). Antes
eram `bottom-3 right-3`, uma regra anterior ao palco que os deixava boiando
abaixo do piso; com o resto da cena alinhada, isso ficou visível.

## Ainda falta (arte)

Os itens são **emoji** hoje, escalados para a caixa do slot. A estrutura já
está pronta para arte de verdade: quando os PNGs existirem, o que muda é o
render de `PetStageDecor.tsx` (trocar o `<span>` do emoji por `<img>`) — as
caixas, as posições e a linha do chão continuam iguais. Desenhe nos tamanhos da
tabela acima, em 2× (112×112 para uma peça de 56×56) para telas retina.
