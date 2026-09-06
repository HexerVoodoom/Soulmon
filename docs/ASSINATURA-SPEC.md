# WP5.4 — Assinatura e trial: a especificação, e por que ela quase toda diz "não"

> Documento, **não implementação**. Nada aqui está no código, e nada aqui deve
> ir para o código sem o dono dizer "vai". A decisão **D10** já respondeu a
> pergunta central — **vitalício + cosmético trimestral, SEM trial** — e este
> texto existe para registrar o que isso significa em termos de arquivo e de
> regra, e o que fica proibido por consequência.

## O que foi decidido (D10)

| Pergunta | Resposta do dono | Consequência |
|---|---|---|
| Assinatura no lugar do vitalício? | **Não.** O vitalício continua sendo o produto. | `FULL_UNLOCK_SKU` segue como está; `accountTier: 'paid'` não vira estado com validade. |
| Assinatura AO LADO do vitalício? | **Sim, como cosmético trimestral.** | Um SKU novo que entrega COSMÉTICO recorrente, e nada mais. |
| Trial de 7 dias? | **Não.** | Nada de acesso temporário que expira. |

## Por que "sem trial" é a decisão mais consequente

Trial é acesso que **expira**, e expirar é a única coisa que este produto não
pode fazer com a criatura. A tese está escrita no `CLAUDE.md`: perda só sobre
item recuperável, nunca sobre identidade ou progresso acumulado. Um trial que
termina ou tira a criatura autoral de volta (e aí o produto tirou o que já era
"meu") ou não tira nada (e aí não é trial, é presente com nome errado).

Não existe terceiro caminho, e é por isso que este documento não descreve
mecanismo de trial nenhum: descrever seria deixar a semente pronta.

## O que a assinatura cosmética PODE ser

Uma linha só, e ela cabe nas regras que já existem:

- **Só `bg` e `furniture`.** É a mesma régua da aba Torneio, que o
  `CLAUDE.md` já declara: *"tudo na aba é COSMÉTICO e isso é regra"*. Um item
  de assinatura que mexa em HP, energia, atributo, requisito, evolução, teto de
  cuidado ou masmorra está fora — e há teste travando a fronteira das moedas.
- **Trimestral**, com um conjunto por trimestre. A cadência espelha a estação
  (`utils/seasons.ts`), que já existe e já tem virada testada.
- **O que foi entregue NÃO é retirado ao cancelar.** Cosmético entregue é
  posse. Um armário que esvazia quando a assinatura acaba é a mesma família do
  trial: perda sobre coisa que já era da pessoa.
- **Nunca desconta do vitalício, nem o substitui.** Quem comprou o completo
  continua com o completo; quem assina ganha o cosmético do trimestre.

## O que ficaria proibido, e é a parte que precisa estar escrita

- **Double dipping.** Vender o mesmo item nas duas portas (Bits e assinatura)
  transforma a loja num teste de paciência: a pessoa aprende que esperar a
  assinatura é sempre melhor que comprar. Item de assinatura tem `unlock`
  próprio e **nunca** entra em `SHOP_ITEMS` com preço.
- **Promoção em cadência previsível.** Desconto que aparece no mesmo dia todo
  mês ensina a nunca comprar a preço cheio; e desconto por urgência fabricada
  ("só hoje!") é o padrão escuro que este produto recusa em todas as outras
  telas.
- **Créditos recorrentes como parte da assinatura.** Créditos são a moeda de
  DINHEIRO REAL e liberam a criatura autoral. Dar Créditos por assinatura é
  fazer a criatura autoral virar aluguel, e o `CLAUDE.md` é explícito: é a
  única coisa que uma compra verificada concede.
- **Qualquer benefício de CUIDADO.** Nem cura, nem escudo, nem teto maior, nem
  perdão extra. O Sprint 2 fechou os dois caminhos pelos quais dinheiro comprava
  coração (D7 e D15) justamente para a frase *"pagar nunca deixa sua criatura
  mais forte"* poder existir na tela de compra. Uma assinatura que devolva
  qualquer um deles apaga essa frase.

## O que precisaria mudar no código (quando e se)

| Arquivo | O que muda |
|---|---|
| `functions/api/_billing.js` | `PRODUCTS` ganha o SKU de assinatura; `verifyPlayPurchase` passa a precisar de `purchases.subscriptions` da API do Play, que é **outro endpoint** e outro escopo de service account — não é o mesmo caminho de `purchases.products`. |
| `functions/api/_entitlements.js` | Um campo de vigência (`subUntil`) que **só destrava a vitrine do trimestre**; ele nunca pode ser lido por regra de jogo. |
| `src/utils/shop.ts` | `unlock: { kind: 'subscription' }`, no mesmo molde de `mission` — o item aparece escurecido e explica, nunca some em silêncio. |
| `src/utils/currencies.ts` | Nada. E é uma linha importante deste documento: se a assinatura exigisse uma quarta moeda, a resposta certa seria não fazer a assinatura. |

## Estado

**Não implementado, de propósito.** O que existe hoje é o vitalício, e ele
funciona. Este documento fecha o WP5.4 como o plano previa — *"fica como anexo
de decisão, não como WP"* — e a decisão está tomada: se a assinatura for feita
um dia, é cosmética, trimestral, sem trial, sem Créditos e sem tocar em nada
que a pessoa já tenha.
