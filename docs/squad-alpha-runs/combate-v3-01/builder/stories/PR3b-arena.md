# Story PR3b — Arena no núcleo v3, com grupos N×1 (run `combate-v3-01`, Builder)

> Revisada em 06/10/2026 com as decisões §2.15. Medição em `builder/balanco-motores.md` §6, `_sim/cv3-medir/grupo.ts` e `grupo-final.txt`.
> Depende do PR3a (núcleo v1.1 + `groupFight`) e do PR2 (`soulCombatant`), que o #227 reaplica. Referência do PR2: `70417a61`.

## O que construir
- **Jogador.**
  - É `soulCombatant(state)` com bônus 0, e o especial é `specialOf(familia)`, com `area` vindo de `StageSkill.area` (PR3a).
  - Até o PR9, a família vem de um mapa provisório em `arena.ts`, `ESCOLA_FAMILY_PROVISORIO`: `combate_fisico→direct`, `longo_alcance→dot`, `conjuracao→direct`, `benca→heal`, `maldicao→defDebuff`, `evocacao→atkBuff`.
  - Um teste reprova quando `StageSkill.familia` passar a existir, para forçar a troca.
- **Rodadas.**
  - Ficam as 5 de `ROUND_COMP` (1 medium · 2 weak · 1 medium · 3 weak · boss), **em grupo**, com os inimigos lutando ao mesmo tempo (`groupFightSteps`).
  - HP e energia passam de uma rodada para a outra (`startHp`/`startEnergy`), e `ROUND_CLEAR_HEAL = 0,3` cura entre rodadas.
  - O jogador mira o 1º inimigo vivo, que é o `target()` de hoje.
- **Inimigos.** Vêm de `ARENA_FOES` (ver Calibração) e são relativos ao level do jogador. O bestiário só dá o sabor (nome, elemento, sprite), sorteado com `mulberry32(seedDaRun)`.
- **Cena (`usePveBattle`).**
  - Consome os eventos do gerador e usa o relógio do núcleo, em segundos. `PVE_STEP_MS` sai.
  - No cast do pet, o relógio pausa, o anel aparece e o gerador recebe `RING_MULT[nota] × PVE_FAMILY_POWER.arena[família]`.
  - No cast do inimigo, o relógio pausa, a esquiva aparece e o gerador recebe `1 − DODGE_REDUCE[nota]`.
  - Se um ator recebe um evento novo com a animação ainda rodando, a animação é cortada no impacto. O especial em área desenha o hit em todos os alvos do evento.
- **Auto-defesa.** É o `hitScale` do lado do inimigo: 0 se `acc ≥ perfeito`, senão `(1 − acc)/0,3`.
- **Seed.** Sai o `Math.random` da l. 210 de `ArenaGame.tsx`, e cada run usa `newDefenseSeed()`.

## Símbolos (conferidos na main)
- **Saem de `utils/arena.ts`:** `STAGE_BUDGET`, `getArenaPlayerStats`, `SPECIAL_EFFECTS` (o `targets` dele vira `StageSkill.area` no PR3a), `SPECIAL_CHARGE_TURNS`, `playerHitDamage`, `enemyHitDamage`, `ADVANTAGE_MULT`/`DISADVANTAGE_MULT`, `simulateArenaRun`, `simulateArenaRunEnergy`, `ARENA_HP_SCALE`, `ARENA_FOE_HP_EXTRA`, `ARENA_TORCIDA_MULT`, `arenaTorcidaTurn`, `arenaTurnIsSpecial`, `CLASS_SHAPE`, `MEDIUM_HP_BASE`/`MEDIUM_ATK_BASE`, `ROUND_GROWTH`, `DIFFICULTY_GROWTH`.
- **Entram:** `ARENA_FOES`, `ARENA_ROUND_GROWTH`, `ARENA_ROUND_COMP` (exportado para a régua do PR3a), `arenaFoe(L, cls, r)` e `simulateArenaRunV3(cfg, seed, skill)`.
- **Ficam:** `countersElement`, `buildArenaRound` (só o sabor), `getArenaAttributes` e `ROLE_SHAPE` (ver R3). `elementMultiplier` passa a se chamar `elementAdvantage` e devolve −1, 0 ou 1.
- **Consumidores a ajustar:** `components/arena/DueloSheet.tsx`, `ArenaGame.tsx`, `ArenaGame.render.test.tsx`, `ArenaGame.torcida.render.test.tsx`, `arena.test.ts`, `arena.pr1b.test.ts`, `arena.alocacao.test.ts`, `energia.test.ts`, `mente/balanco.test.ts` e um comentário em `torcida.ts`.
- O cabeçalho "⚠️ SEM CONSUMIDOR" de `arena.ts` está falso e sai.

## Critérios de aceite
Todos medidos em N = 3200 runs, girando 15 levels × 4 builds × 7 famílias × área/único.

1. **Duração por rodada.** A mediana fica entre 20 e 29 s nas rodadas 1, 2, 3 e 5. A R4 (3 weak) pode ir até 32 s, e isso fica declarado.

   | Rodada | Mediana (s) | P95 (s) |
   |---|---|---|
   | R1 | 21,8 | 27,0 |
   | R2 | 19,8 | 27,5 |
   | R3 | 21,0 | 28,8 |
   | R4 | 27,6 | 44,8 |
   | R5 | 24,4 | 37,2 |
2. **Vitória por build e por estágio.**
   - Spread entre builds ≤ 20pp (medido 4,6pp).
   - Vitória média com habilidade `media` entre 55% e 80% (medido 66,0%).
   - Por estágio, entre 50% e 80% (medido 63,7–68,9%).
3. **Vitória por família e área.** Spread ≤ 20pp nas 14 células (medido 7,4pp). **Vermelho:** com `PVE_FAMILY_POWER.arena` todo em 1, o spread passa de 20pp (medido 34pp).
4. **Área × único.** A régua do PR3a fica verde sobre a composição da Arena: no máximo 6pp de diferença na vitória e 5% no tempo.
5. **Habilidade (P4).** Entre `nenhuma` (sem tocar, sem esquivar) e `boa`, a vitória difere no máximo 25pp (medido 47,9% contra 71,9%, ou seja, 24,0pp). **Vermelho:** o `RING_MULT`/`DODGE_REDUCE` antigo dá 51,6pp.
6. **Fora da régua.** Anel, esquiva, torcida no teto e `ROLE_SHAPE` mudam o TTK médio em no máximo ±25%.
7. **Elemento.** Vale ±1 golpe exibido (o critério do PR3a, aplicado aqui com o elemento da skill contra o do inimigo).
8. **Determinismo.** A mesma seed com os mesmos gestos dá o mesmo log. Um teste de grep garante que não há `Math.random` em `arena.ts` nem em `ArenaGame.tsx`.
9. **Empate e derrota.** Os dois encerram a run sem custo, com texto neutro (EN/PT), e não mudam `hp` nem corações do save (§20.1).
10. **Build.** `orcamentoDeBytes` fica verde (`ArenaGame` é lazy). tsc, vitest e build verdes, com o dist commitado.

## Testes vermelho → verde
- **`arena.v3.test.ts`:** cobre os AC 1–6. Sai a parte de balanço de `arena.test.ts`, `arena.alocacao.test.ts` e `arena.pr1b.test.ts`, e o PR lista cada teste apagado. Os testes de ficha, elemento e nome ficam.
- **`ArenaGame.render.test.tsx` e `.torcida.render.test.tsx`:** o selo continua com o nome da skill, o especial em área desenha N hits e a energia vem do evento.
- **`arena.semRandom.contract.test.ts`:** cobre o AC 8.

## Calibração (medida)
| Constante | Valor |
|---|---|
| `ARENA_FOES.weak` | hp 0,45 · power 0,12 |
| `ARENA_FOES.medium` | hp 0,95 · power 0,235 |
| `ARENA_FOES.boss` | hp 1,2 · power 0,495 · especial `direct`, alvo único |
| `ARENA_ROUND_GROWTH` | hp 0,04 · power 0,13 |
| `ROUND_CLEAR_HEAL` | 0,3 |
| `PVE_FAMILY_POWER.arena` | direct 1 · dot 0,95 · heal 1,25 · shield 1,2 · atkBuff 1,35 · defDebuff 1,55 · spdBuff 1,25 |
| `RING_MULT` (ruim / bom / ótimo) | 0,92 / 1 / 1,08 |
| `DODGE_REDUCE` (nada / bom / ótimo) | 0 / 0,2 / 0,35 |

Inimigo da classe `cls` na rodada r (0..4): `{ ...combatantAt(L, balanced), hp: hp × cls.hp × (1 + 0,04·r), bonus: cls.power × (1 + 0,13·r) − 1 }`.

## Estados de UI
- luta em grupo;
- cast com anel, com o relógio pausado;
- especial em área, com hit em todos os alvos;
- esquiva;
- empate, com texto neutro;
- derrota, sem custo;
- vitória;
- offline;
- movimento reduzido: sem investida, mas o anel desenhado por JS continua.

## Verificação
```
npx vitest run src/utils/arena src/components/ArenaGame src/components/games src/utils/combate && npx tsc -p . && npm run build
```

## Não-objetivos
Masmorra (PR4), PvP (PR5), família real do especial (PR9), FX de status (PR11), talento e equipamento.

## Riscos
- **R1, sensibilidade.** Os coeficientes mexem muito no resultado: o power do DoT a 0,85 dá 56% de vitória, e a 1,1 dá 79%. Recalibrar com `grupo.ts`, nunca à mão.
- **R2, tabela por motor.** A cura rende pouco em grupo e muito na sequência 1v1. Por isso `PVE_FAMILY_POWER` tem uma tabela por motor (`arena` e `dungeon`).
- **R3, `ROLE_SHAPE`.** Fica (§2.11), agora como HP e `hitScale` por escola básica, limitado a ±25% pelo AC 6.
- **R4, cena.** Com `spdBuff`, o intervalo entre ataques cai para ~1,1–1,3 s. A regra de corte de animação precisa de um teste de render.
- **R5, sessão irmã.** Ela mexe em `App.tsx`/`AreaView.tsx`; este PR não toca esses arquivos.
