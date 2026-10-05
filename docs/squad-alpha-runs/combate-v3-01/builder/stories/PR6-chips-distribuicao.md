# Story PR6 — Chips só influenciam a distribuição (run `combate-v3-01`, Builder)

## O que construir
Os chips de atributo deixam de somar +3 em `powerPoints/harmonyPoints/benevolencePoints`. Passam a pesar só no **caminho** (Poder/Harmonia/Benevolência) usado pela distribuição na evolução, sem mudar o total de pontos.

## Por quê
§2.8. Fecha a exceção "Créditos compram atributo" (`dossie-progressao` Fato 2), porque o total = level, e o chip só mexe na forma. O gate prova: 455 distribuições, gap +6,5%, total = L.

## Símbolos donos
- `src/utils/shop.ts`: `chip-power/harmony/benevolence`, `CHIP_BOOST`.
- `src/utils/specialItemUse.ts` (uso do chip).
- `src/utils/combate/allocate.ts` (entrada do caminho).
- `docs/manual/02-REGRAS-DE-NEGOCIO.md` §47: remover a ressalva "além dos três chips".

## Decisões do dono aplicadas
- §2.8: chips sem +3, só distribuição.
- §2.10: piso de 15% mantido.
- §2.8: concentração máxima de 45%.
- §6: Créditos não compram atributo.

## Critérios de aceite
1. Usar um chip não altera `powerPoints/harmonyPoints/benevolencePoints` nem o total de pontos de combate. **Prova de vermelho:** com `CHIP_BOOST`=3, o teste reprova.
2. Varredura de todas as combinações de chips (amostra gerada pelo módulo, ≥455): o total = L, e cada atributo fica entre 15% e 45%.
3. Gap entre builds com chips ≤ o gap medido no gate (+6,5%) + tolerância declarada.
4. Chip já comprado em save antigo: segue no inventário com o efeito novo, sem reembolso automático (a pergunta de reembolso fica registrada no PR para o dono).
5. A copy da loja descreve "muda o caminho", em EN e PT, e passa no `copy.semFomo`.
6. tsc, vitest e build verdes.

## Estados de UI
Loja (descrição nova), uso do chip (feedback de caminho), sem chips (vazio).

## Verificação
```
npx vitest run src/utils/shop src/utils/specialItemUse src/utils/combate && npm run build
```

## Não-objetivos
Preço do chip, câmbio Créditos→Bits (PR8), economia de galhos (§10: não mudar `powerPoints…` como regra de evolução).

## Dependências
PR2. Para a medição completa, também PR3.

## Riscos
- §10 proíbe mudar a economia de galhos. O chip deixar de alimentar `powerPoints` mexe no galho de evolução. Se isso contar como "mudar a economia", é pergunta ao dono **antes do merge**.
