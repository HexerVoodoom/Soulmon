# Story PR3 — Núcleo v1.1 (golpe normalizado + passo a passo) e Arena no núcleo v3 (run `combate-v3-01`, Builder)

> Revisada em 06/10/2026 contra `origin/main` bd6adbed e medida com o núcleo real (`builder/balanco-motores.md`).
> Dependências: PR1 (#221) e PR1b (#224) mergeados; PR2 (`soulCombatant`) mergeado antes deste PR.
> **Bloqueio:** P1 (golpe normalizado + σ 8%) e P2 (Arena 1v1 em sequência) precisam de resposta do dono. Se P1 = B (manter o núcleo), a parte A se reduz aos ganchos e as constantes da §Calibração passam a ser as da coluna "main" do balanço.

## O que construir
**Parte A, núcleo (`src/utils/combate/`):** é a única mudança no PR1 de que este run precisa.
1. **Golpe normalizado.** `HIT_UNIT_H0 = 10` e `hitUnit(L) = hitsToKnockOut(bal(L), bal(L)) / HIT_UNIT_H0`, com `bal = combatantAt(L, REFERENCE_BUILDS.balanced)`. No `fight`, cada ataque usa `hits / u` e o intervalo é multiplicado por u, com `u = hitUnit(windowLevel)`. `VARIANCE.sigma` passa de 0,15 para 0,08.
2. **`fightSteps`.** É um gerador que emite os eventos da luta e **pausa no cast**: o gerador entrega `{ kind: 'cast', side, family, n }` e recebe de volta o multiplicador. O `fight()` vira um driver fino desse gerador e continua com a mesma assinatura e o mesmo resultado para quem já o chama.
3. **Ganchos novos em `FightOptions`.** Todos são opcionais e, desligados, dão o resultado de hoje:
   - `startHp?: [number, number]`: fração de HP inicial, para carregar o HP de uma luta para a outra;
   - `startEnergy?: [number, number]`;
   - `hitScale?: (side: 0 | 1, n: number) => number`: multiplica o n-ésimo ataque básico do lado (auto-defesa, ofício, contra-ataque);
   - `cheer?: readonly { t: number; side: 0 | 1 }[]`: descargas de torcida, cada uma soma `CHEER.energyPerDischarge`;
   - `stopAtFirstKo?: boolean`: o PvE para no 1º KO, sem "fantasma", e devolve `hpLeft`/`energyLeft`.
4. **Elemento.** `elementHits(adv: -1 | 0 | 1) = 1 − adv / HIT_UNIT_H0` multiplica os golpes do atacante: a vantagem tira 1 golpe e a desvantagem soma 1. Fica em `curve.ts`.
5. **`PVE_FAMILY_POWER`** em `specials.ts`, com a tabela do balanço §3. O adaptador do PvE a aplica como multiplicador do cast. Ela nunca entra na régua do espelho.
6. **`CHEER`** em `specials.ts`: `{ tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 3 }`, e `cheerEvents(taps, side)`, uma função pura que converte toques por balde em descargas. Os números saem de `_duel.js` (24/16) e passam a ter dono aqui; o PR5 espelha.

**Parte B, Arena (`src/utils/arena.ts`, `src/components/ArenaGame.tsx`, `src/components/games/usePveBattle.ts`):**
- **Jogador.** É `soulCombatant(state)` do PR2, com bônus 0. O especial é `specialOf(familia)`. Até o PR9 a família vem de um mapeamento **provisório** escola→família em `arena.ts`, `ESCOLA_FAMILY_PROVISORIO`: `combate_fisico→direct`, `longo_alcance→dot`, `conjuracao→direct`, `benca→heal`, `maldicao→defDebuff`, `evocacao→atkBuff`. Um teste reprova quando `StageSkill.familia` (PR9) existir, para forçar a troca.
- **Inimigos.** Saem de `ARENA_FOES` (balanço §3), relativos ao level do jogador. As 5 rodadas mantêm a composição de `ROUND_COMP`, mas **cada inimigo é uma luta 1v1 em sequência** (P2). HP e energia passam de uma luta para a seguinte, e `ROUND_CLEAR_HEAL = 0,3` cura entre rodadas.
- **Cena (`usePveBattle`).** O hook consome `fightSteps`, e o relógio da cena passa a ser o do núcleo, em segundos. `PVE_STEP_MS` sai dos motores v3. Se um evento chega enquanto a animação do mesmo ator ainda roda, a animação é cortada no impacto e o dano entra no tempo do núcleo.
  - **Cast do pet:** pausa o relógio, mostra o anel e responde `RING_MULT[nota] × PVE_FAMILY_POWER[família]`.
  - **Cast do inimigo:** pausa o relógio, mostra a esquiva e responde `1 − DODGE_REDUCE[nota]`.
- **Auto-defesa.** Entra como `hitScale` do lado do inimigo: 0 se `acc ≥ perfeito`, senão `(1 − acc)/0,3`. O sorteio continua com `autoDefense()`, pela seed da luta.
- **Seed.** A run usa `newDefenseSeed()` e não mais o `Math.random` da l. 210 (`buildArenaRound(n, 1, Math.random, …)`). O bestiário (`pool`) só dá sabor (nome, elemento e sprite), sorteado por `mulberry32(seedDaRun)`.

## Símbolos donos (conferidos na main)
- **Núcleo, novos ou alterados:**
  - `combate/fight.ts`: `fight`, `fightSteps` (novo), `FightOptions`, `windowSeconds`, `HIT_UNIT_H0`/`hitUnit` (novos);
  - `combate/curve.ts`: `elementHits` (novo);
  - `combate/specials.ts`: `PVE_FAMILY_POWER`, `CHEER`, `cheerEvents` (novos);
  - `combate/rng.ts`: `VARIANCE`.
- **`utils/arena.ts`:**
  - **Saem:** `STAGE_BUDGET`, `getArenaPlayerStats`, `SPECIAL_EFFECTS`, `SPECIAL_CHARGE_TURNS`, `playerHitDamage`, `enemyHitDamage`, `ADVANTAGE_MULT`/`DISADVANTAGE_MULT`, `simulateArenaRun`, `simulateArenaRunEnergy`, `ARENA_HP_SCALE`, `ARENA_FOE_HP_EXTRA`, `ARENA_TORCIDA_MULT`, `arenaTorcidaTurn`, `arenaTurnIsSpecial`, `CLASS_SHAPE`, `MEDIUM_HP_BASE`, `MEDIUM_ATK_BASE`, `ROUND_GROWTH`, `DIFFICULTY_GROWTH`.
  - **Entram:** `ARENA_FOES`, `ARENA_ROUND_GROWTH`, `arenaFoe(L, cls, round)` e `simulateArenaRunV3(cfg, seed, skill)`, o motor do teste, construído sobre `fightSteps`.
  - **Ficam:** `countersElement`, `buildArenaRound` (só nome, elemento e sprite) e `getArenaAttributes`. `elementMultiplier` é reescrito como `elementAdvantage` e devolve −1, 0 ou 1. `ROLE_SHAPE` também fica (R3).
- **Consumidores a ajustar** (grep na main):
  - telas: `components/arena/DueloSheet.tsx` (`getArenaPlayerStats`) e `ArenaGame.tsx`;
  - testes: `ArenaGame.render.test.tsx`, `ArenaGame.torcida.render.test.tsx`, `arena.test.ts`, `arena.pr1b.test.ts`, `arena.alocacao.test.ts`, `energia.test.ts` (usa `simulateArenaRun*`) e `mente/balanco.test.ts` (`buildArenaRound`);
  - `torcida.ts`, só no comentário que cita `simulateArenaRun`.
- O cabeçalho "⚠️ SEM CONSUMIDOR" de `arena.ts` (l. 1–15) está **falso** desde que a Arena passou a ser jogada (PR1b). Ele dá lugar ao cabeçalho do motor v3.
- `dungeon.ts` (`PLAYER_STATS` e o comentário "mexer aqui muda a Masmorra, o Pesadelo e a Arena") **não** é tocado aqui, porque pertence ao PR4. A Arena não usa `PLAYER_STATS` hoje.

## Decisões do dono aplicadas
- **§2.1 Q5:** elemento vale ±1 golpe.
- **§2.4:** empate é válido; a energia vem por tempo e por dano; há 1 especial por luta.
- **§2.5:** dano fracionário.
- **§2.10:** AR(1) com ρ 0,9; o σ depende de P1.
- **§2.3 X4:** anel, esquiva, torcida e ofício ficam fora da régua, com no máximo ±25% no TTK.
- **§2.11:** `ROLE_SHAPE` fica, limitado a ±25% (R3).
- **§2.13:** uma barra, um uso.
- **§4:** PvE de 20 a 29 s.
- **§2.14 M4:** a maré de sorte fica oculta; nenhum indicador de sorte na UI.

## Critérios de aceite (todos em vitest; as amostras vêm do módulo)
1. **Regressão do núcleo.** Com `u = 1` e sem ganchos, `fight()` devolve o mesmo `FightResult` da main em 300 lutas (15 `RULER_LEVELS` × 4 builds × 7 famílias, seeds fixas). **Vermelho:** trocar `PHASE_SALT` reprova.
2. **`fightSteps` ≡ `fight`.** Drenar o gerador respondendo 1 a todo cast dá o mesmo resultado que `fight()`, e a mesma seed dá o mesmo log de eventos.
3. **Golpe normalizado.** O espelho balanceado tem `displayHits` = 10 ± 1 em todos os `RULER_LEVELS`. O especial direto encurta o TTK do espelho entre 25% e 33% em L1, L21 e L40 (medido 29,1%). **Vermelho:** com `u = 1`, o L40 dá 1,4% e reprova.
4. **Os gates do PR1 seguem verdes** com o núcleo novo:
   - DEF P95 ≤ 40 s (medido 31,1 s);
   - +1 Lv ≥ 2% (5,2%);
   - gap ≤ 10% (8,0%);
   - régua com 0/42 células fora;
   - bônus pelo `combinedBonus`.
5. **Sorte uniforme por estágio** (N = 400 por estágio, IC95 declarado):
   - o mais fraco por 5% vence entre 25% e 40% (medido 34–37%);
   - o 1 Lv abaixo vence entre 5% e 35% (medido 8–32%).

   **Vermelho:** o núcleo da main (σ 0,15, sem normalizar) dá 21% no s4 e reprova.
6. **Elemento.** No espelho balanceado de cada `RULER_LEVELS`, a vantagem baixa `displayHits` exatamente em 1 e a desvantagem sobe em 1. **Vermelho:** ×1,3 (o antigo `ADVANTAGE_MULT`) reprova.
7. **Duração na Arena.** TTK mediano por inimigo entre 20 e 29 s (medido 20,5 s; P95 29,0 s). N = 1600 runs, rotacionando 15 levels × 4 builds × 7 famílias.
8. **Spread na Arena:**
   - vitória da run por build com spread ≤ 20pp (medido 5,8pp);
   - por família ≤ 20pp (medido 14,3pp);
   - vitória média com habilidade `media` entre 55% e 85% (medido 70%).

   **Vermelho:** sem `PVE_FAMILY_POWER` o spread por família vai a 28pp e reprova.
9. **Fora da régua, no máximo ±25% no TTK** médio do jogador: anel (tudo `ruim` × tudo `otimo`), esquiva, torcida no teto (`CHEER`) e `ROLE_SHAPE`. **Vermelho:** `RING_MULT.otimo = 4` reprova.
10. **Determinismo.** A mesma seed da run com os mesmos gestos dá o mesmo log de eventos. A prova que já existe no `usePveBattle` é estendida.
11. **Sem `Math.random`** em `arena.ts`, `ArenaGame.tsx` e `combate/*`. Teste de grep, no padrão dos contratos existentes.
12. **Empate e derrota.** Uma luta empatada encerra a run do mesmo jeito que a derrota: o pet não avança e a tela usa texto neutro (EN/PT), sem perdedor. Nenhum dos dois casos muda `hp` nem corações do save (§20.1); um teste trava isso.
13. **Bytes.** `orcamentoDeBytes.contract.test.ts` fica verde, e o núcleo só é importado por chunks lazy (`ArenaGame` já é `React.lazy`). Se o `index.js` crescer mais que `FOLGA_JS_CSS` (8 KB), **parar e reportar**.
14. **Checagens finais.** tsc (app + `tsconfig.server.json`), vitest e `npm run build` verdes, com o dist commitado.

## Testes vermelho → verde (nesta ordem)
1. `combate/combate.v11.test.ts`: AC 1, 2, 3, 5 e 6. Ficam vermelhos até a Parte A entrar.
2. `arena.v3.test.ts`: AC 7, 8 e 9. Substitui a parte de balanço de `arena.test.ts`, `arena.alocacao.test.ts` e `arena.pr1b.test.ts`; os testes desses arquivos que não medem balanço (ficha, elemento, nome) ficam. Cada teste apagado aparece listado no PR.
3. `ArenaGame.render.test.tsx` e `.torcida.render.test.tsx`: o selo continua com o nome da skill (PR1b N1) e a energia passa a vir do evento do núcleo.
4. `arena.semRandom.contract.test.ts`: AC 11.

## Estados de UI
- luta;
- cast com anel, com o relógio pausado;
- esquiva do especial do inimigo;
- empate, com texto neutro e sem perdedor;
- derrota, sem custo;
- vitória da run;
- offline, 100% local;
- movimento reduzido: sem investida, mas o anel desenhado por JS continua (WCAG 2.3.3).

## Verificação
```
npx vitest run src/utils/combate src/utils/arena src/components/ArenaGame src/components/games && npx tsc -p . && npx tsc -p tsconfig.server.json && npm run build
```

## Calibração (valores medidos; o teste trava faixas, não pontos)
| Constante | Valor |
|---|---|
| `HIT_UNIT_H0` | 10 |
| `VARIANCE.sigma` | 0,08 |
| `ARENA_FOES.weak` | hp 0,75 · power 0,125 |
| `ARENA_FOES.medium` | hp 0,95 · power 0,21 |
| `ARENA_FOES.boss` | hp 1,2 · power 0,445 · especial `direct` |
| `ARENA_ROUND_GROWTH` | hp 0,04 · power 0,13 |
| `ROUND_CLEAR_HEAL` | 0,3 |
| `PVE_FAMILY_POWER` | direct 1 · dot 1,1 · heal 0,8 · shield 1 · atkBuff 1,3 · defDebuff 1,3 · spdBuff 1,5 |
| `CHEER.energyPerDischarge` | 3 |

Inimigo da classe `cls` na rodada r (0..4): `{ ...combatantAt(L, balanced), hp: hp × cls.hp × (1 + 0,04·r), bonus: cls.power × (1 + 0,13·r) − 1 }`.

## Não-objetivos
Masmorra e Pesadelo (PR4); PvP e `_duel.js` (PR5); nome e família reais do especial (PR9); FX de status (PR11); talento e equipamento (bônus 0); arte e som.

## Riscos
- **R1, sensibilidade.** As 8 lutas em sequência são quase determinísticas: com power 0,12 a vitória dá 86%, com 0,13 dá 60%. Por isso o teste usa faixas largas (AC 8). Recalibrar com o script, não à mão.
- **R2, habilidade.** Sem agir, a vitória fica em 39%; com anel e esquiva bons, em 82%. Passa no X4 (o TTK varia ±8%), mas a vitória oscila 43pp (P4).
- **R3, `ROLE_SHAPE`.** A §2.11 manda manter, limitado a ±25%. No v3 ele vira um multiplicador de HP e de dano por escola básica, aplicado como HP do jogador e `hitScale`, e o AC 9 o trava. Se passar de ±25%, encolher até o teto.
- **R4, cena.** O intervalo médio de cada lado é ~2,5 s, mas o `spdBuff` o corta pela metade (~1,1–1,3 s), abaixo dos 1250 ms da animação ranged. A regra de corte da animação precisa de teste de render.
- **R5, sessão irmã.** Ela mexe em `App.tsx` e `AreaView.tsx` (§2.13). Este PR não toca esses arquivos; se precisar, o rebase preserva as duas mudanças.
