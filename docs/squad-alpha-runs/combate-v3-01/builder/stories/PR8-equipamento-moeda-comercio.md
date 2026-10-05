# Story PR8 — Equipamento, moeda, Comércio e teto de 5% (run `combate-v3-01`, Builder)

> **BLOQUEADO** pela decisão de lootbox (§2.10: "avaliar lootbox com teto — pity, odds exibidas, compliance/legal, faixa etária"). Não despachar até o dono decidir. O catálogo e o modificador (critérios 1–3) podem ser **preparados**, mas sem merge da parte de aquisição.

## O que construir
O Soulmon equipa itens com efeito **percentual** dentro do teto global de 5%. Itens são comprados com Bits ganhos jogando. Créditos→Bits é permitido com teto diário de +25% sobre o grátis. Comércio = slots pagos dentro do mesmo teto.

## Por quê
§2.7 (theory crafting, uso da moeda). A forma percentual vem do spike: +1 ponto plano = +11,1% no L1, o que estoura o teto.

## Símbolos donos
- `src/utils/equipment.ts` › catálogo + `equipModifier(items, level)` + `functions/api/_equipment.js`. Persistidos: posse e slot.
- `src/utils/currencies.ts` › `CREDIT_TO_BITS`, `BITS_EXCHANGE` (teto diário).
- `src/utils/shop.ts`; `src/utils/combate/` › `bonus()`.
- `functions/api/save.js` + fuzz2.

## Decisões do dono aplicadas
- §2.9: não pode ser P2W, mas dinheiro real pode acelerar um pouco.
- §2.10: Créditos→Bits com teto diário de +25%; Comércio pago no mesmo teto; lootbox **em avaliação**.
- §2.8: nada comprável com dinheiro real dá %, e a ambiguidade vai como pergunta.
- §6: atributo nunca é vantagem paga.

## Critérios de aceite
1. `equipModifier` é percentual e escala com o level. Com talento, Comércio e Renascimento, `bonus()` ≤5%. **Prova de vermelho:** item plano de +1 ponto no L1 reprova (>5%).
2. 256+ combinações (amostra gerada pelo catálogo): gap máximo ≤5% + tolerância declarada.
3. Paridade `equipment.parity.test.js`. O servidor recalcula o efeito, e um slot forjado é descartado.
4. Teto diário de câmbio: num dia, os Bits vindos de Créditos ficam ≤25% dos Bits ganhos jogando. Teste de borda (exato, +1). **Prova de vermelho:** sem teto, reprova.
5. Item com % só pode ser comprado com Bits, e a origem do Bit respeita o teto do critério 4.
6. Se houver lootbox (decisão do dono): odds exibidas = odds sorteadas (teste estatístico N declarado), pity determinístico, e a regra de faixa etária aplicada.
7. Save: posse/slot saneados, fuzz2 com o N exato.
8. tsc, vitest e build verdes.

## Estados de UI
Inventário vazio, item equipado, slot bloqueado, Bits insuficientes (texto neutro), teto diário de câmbio atingido (neutro, sem FOMO), erro de compra (nada é debitado), offline (compra desabilitada).

## Verificação
```
npx vitest run src/utils/equipment src/utils/currencies src/utils/shop functions/api && npm run build
```

## Não-objetivos
Arte nova (§10), som, lootbox sem decisão do dono, preços finais.

## Dependências
PR7 (canal de bônus + Comércio), **decisão do dono sobre lootbox** (bloqueante), e D1 (Bits ganhos × comprados).

## Riscos
- Compliance de lootbox (legal, faixa etária): não há jurídico separado (§9). Lacuna vai ao dono.
- O teto de 25% exige rastrear a origem do Bit. Se isso não for possível sem campo novo, o campo entra com saneamento.
