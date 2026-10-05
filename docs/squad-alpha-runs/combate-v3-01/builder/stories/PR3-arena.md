# Story PR3 — Arena no núcleo v3 (run `combate-v3-01`, Builder)

## O que construir
A Arena (`ArenaGame.tsx`) passa a lutar com o núcleo do PR1. Os stats vêm do level do PR2, a curva usa golpes fracionários, o ritmo vem da SPD, o especial tem efeito por família e a sorte é AR(1). A tela segue a mesma, com o resultado novo.

## Por quê
Primeiro consumidor porque **o motor da Arena já tem simulador** (`simulateArenaRunEnergy`, `arena.test.ts`) e aceita rng injetado (`buildArenaRound`). É a troca de motor com menor risco e a que dá a comparação antes/depois mais barata.

## Símbolos donos
- `src/utils/arena.ts`: `getArenaPlayerStats`, `STAGE_BUDGET`, `ROLE_SHAPE`, `playerHitDamage`, `enemyHitDamage`, `SPECIAL_EFFECTS`, `elementMultiplier`, `simulateArenaRunEnergy`. Os símbolos substituídos são **removidos**, não deixados mortos. Removem-se também `simulateArenaRun` e `SPECIAL_CHARGE_TURNS`, se ficarem sem uso.
- `src/components/ArenaGame.tsx`: o `Math.random` da l. ~219 passa a usar a seed por luta do núcleo.
- Consome `src/utils/combate/*` (PR1) e `soulLevel` (PR2).

## Decisões do dono aplicadas
- §2.1 Q5: elemento = ±1 golpe.
- §2.4: régua = tempo no espelho; empate válido; energia por tempo e por dano recebido (1 especial por luta).
- §2.5: dano fracionário, só a exibição arredonda.
- §2.10: AR(1) ρ=0,9, σ=15%.
- §2.3 X4: anel/esquiva/torcida fora da régua, limitados a ±25%.
- §4: duração PvE ~20–29 s.

## Critérios de aceite
1. Elemento: a vantagem tira exatamente 1 golpe e a desvantagem soma 1, medido em golpes exibidos. **Prova de vermelho:** com ×1,3, o teste reprova.
2. Duração mediana por inimigo entre 20 e 29 s. N seeds declarado, amostra de estágios e escolas vinda do módulo.
3. Spread de win rate entre escolas ≤20pp, precedente `arena.test.ts`, reescrito sobre o núcleo.
4. Anel, esquiva e torcida mudam o TTK em no máximo ±25%. **Prova de vermelho** com o anel a 1,5.
5. Determinismo: mesma seed → mesma luta (log de golpes idêntico).
6. Nenhum `Math.random` em `arena.ts`/`ArenaGame.tsx`, verificado por um teste de grep.
7. Cabeçalhos obsoletos corrigidos: `arena.ts` "SEM CONSUMIDOR" (C6) e `PLAYER_STATS` "e a Arena" (C3).
8. tsc, vitest e build verdes.

## Estados de UI
Luta normal, especial (selo genérico até o PR9), empate (texto neutro, sem perdedor), offline (luta 100% local).

## Verificação
```
npx vitest run src/utils/arena src/utils/combate && npx tsc -p . && npm run build
```

## Não-objetivos
Masmorra, Pesadelo, PvP, nome do especial (PR9), talento/equipamento (bônus = 0 aqui), arte e som (§10).

## Dependências
PR1, PR2.

## Riscos
- `ROLE_SHAPE` por escola (N13) não tem decisão do dono. Default: escola só escolhe a família do especial, e o shape sai. Se o dono quiser manter, volta como pergunta.
- A ressalva R do gate: a régua em ticks inteiros não enxerga diferenças <10%. Medir em tempo contínuo.
