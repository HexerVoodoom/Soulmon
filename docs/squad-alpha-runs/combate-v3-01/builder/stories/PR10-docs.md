# Story PR10 — Documentação do combate v3 (run `combate-v3-01`, Builder)

## O que construir
O manual e o REGISTRO passam a descrever o combate v3 como está no código. Os trechos obsoletos são marcados, e `PLANO-COMBATE-V3.md` sai de "(em validação)".

## Por quê
§5/§8: o guard `docsManual.contract.test.ts` exige 00-MAPA, Dono/Verificação e arquivo:linha válidos. Os cabeçalhos C3/C6/C7 mentiam (`dossie-codigo` §5).

## Símbolos donos
- `docs/manual/02-REGRAS-DE-NEGOCIO.md` (combate, chips §47, Vínculo).
- `docs/manual/00-MAPA.md` (l. ~416).
- `docs/REGISTRO-DE-DECISOES.md`: §24 (pendente desde §2.10) + revogações do PR7.
- `docs/manual/06-REFERENCIA/` (constantes).
- Cabeçalho de `_duel.js` sobre a torcida (C7).

## Decisões do dono aplicadas
- §2.10: o REGISTRO §24 fica pendente até liberarem E:.
- §2.8: registrar as revogações com as alternativas que perderam.
- §7: EN primeiro + PT-BR.

## Critérios de aceite
1. `docsManual.contract.test.ts` verde no worktree limpo. **Prova de vermelho:** um doc novo sem entrada no 00-MAPA reprova.
2. Toda constante citada no manual existe no código com o mesmo valor. Teste novo ou extensão do guard (d): a tabela de constantes é lida do módulo, não copiada à mão. **Prova de vermelho:** um valor alterado no doc reprova.
3. Nenhuma menção viva a `golpesParaDerrubar = hp + def − atk`, `CHIP_BOOST` +3, ×1,3/×0,8 ou "recompensa só cosmética". Teste de grep com lista declarada.
4. REGISTRO §20 itens 1/6/9/10 marcados como substituídos pela §24.

## Verificação
```
npx vitest run src/**/docsManual.contract.test.ts
```

## Não-objetivos
Docs do run (`squad-alpha-runs`, git-ignorado), docs de marketing.

## Dependências
PR2–PR9 mergeados. Se o PR8 continuar bloqueado, documentar sem ele e marcar "pendente: decisão lootbox".

## Riscos
- `squad-alpha-runs` local faz o guard (a) falhar fora do worktree (`dossie-codigo` §8). Rodar no worktree limpo.
