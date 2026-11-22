# Proposta Focus Workshop: tetos diários e essência (SÓ PROPOSTA, nenhum número do código foi mudado)

## Estado atual (medido em simulação, ver p0-diagnostico.md §6)
- Tetos: `JOURNEY_ITEMS_DAILY_CAP = 16` itens, `JOURNEY_ESSENCES_DAILY_CAP = 8` essências por dia, 4 foco recompensados + 3 extras (item simples).
- Baús por sessão: 6 (p25) ou 10 (p50); cada baú comum paga 1 item, especiais 2. Média paga por sessão (Floresta, p50 de sorteio): 15,1 / 5,7 / 1,9 / 1,0 itens nas sessões 1..4.
- Efeito: a sessão 1 já consome quase o teto de 16; da 2ª em diante os baús abrem vazios (agora com aviso "Teto do dia atingido").

## Proposta de tetos (decisão do dono; exige paridade cliente + servidor)
Opção A (recomendada): teto POR SESSÃO em vez de só diário, mais um diário maior.
- Teto por sessão: p25 = 6 itens, p50 = 10 itens (igual ao número de baús, 1 item/baú; especiais deixam de pagar 2 e passam a pagar 1 item raro).
- Teto diário de itens: 16 -> 28 (cobre 2 sessões p50 + 1 p25 cheias sem vazio; a 4ª sessão ainda rende só a essência do `completionLoot`).
- Essências: manter 8/dia (já é folgado: média < 3 por dia).
Opção B (mínima): só subir o diário de 16 para 24 e manter o resto. Menos mudança, mas a sessão 1 continua gastando 2/3 do dia.
Onde mudar: `JOURNEY_ITEMS_DAILY_CAP` em `src/utils/focusJourney.ts` e o espelho em `functions/api/_focusJourney.js`; `focusJourney.parity.test.ts` e `focusJourney.balanco.test.ts` precisam acompanhar.
Rollback: reverter a constante nos dois lados (o razão do dia guarda só o contador, sem migração).

## Essência por quantidade de elementos (item 15.5; ASSUNÇÃO: o texto do 15.5 não está no repo, o docs/PEDIDOS-DO-DONO-2026-11-22.md ainda não existe na main)
Se a regra é "quantos elementos a Jornada/ambiente mistura": peso da essência no baú, por número de elementos presentes:
| elementos | chance de o baú comum virar essência | essência por baú especial |
|---|---|---|
| 1 | 10% | 1 |
| 2 | 15% | 1 |
| 3 | 20% | 2 |
| 4 | 25% | 2 |
Racional: mais elementos = mais variedade a custear; o teto de 8/dia limita a inflação. Se o 15.5 pedir outra coisa (ex.: distribuição de ENTRE elementos), me devolva o texto e eu reescrevo.

## DECISÃO (dono, 22/11/2026): Opção A aprovada e implementada
- `JOURNEY_ITEMS_DAILY_CAP` 16 -> 28; `JOURNEY_SESSION_ITEMS_CAP` p25=6 / p50=10 (1 item por baú); baú especial paga 1 item raro; essências seguem 8/dia.
- `ESSENCE_BY_ELEMENTS`: chance no baú comum 10/15/20/25% (1..4 elementos), especial 1/1/2/2. `chestLoot(..., elems = 1)` (aditivo: o cenário de hoje tem 1 elemento até o mapa 20x6 chegar).
- Paridade: `src/utils/focusJourney.ts` + `functions/api/_focusJourney.js`; testes parity/balanco/focusJourney atualizados.
- Rollback: reverter constantes e `chestLoot` nos dois lados (o razão do dia guarda só contadores, sem migração).
