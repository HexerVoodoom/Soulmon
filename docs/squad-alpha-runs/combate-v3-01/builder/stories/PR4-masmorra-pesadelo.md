# Story PR4 — Masmorra e Pesadelo no núcleo v3 (run `combate-v3-01`, Builder)

> Revisada em 06/10/2026 contra `origin/main` bd6adbed e medida (`builder/balanco-motores.md` §3). Depende do PR3, que traz `fightSteps`, os ganchos, `PVE_FAMILY_POWER` e o `usePveBattle` v3.

## O que construir
A Masmorra e o Pesadelo passam a usar o adaptador PvE do PR3. Os dois já são 1v1 em sequência (`reset({ foes: 1, keepPet: true })`), então a sequência deles muda pouco. Mudam três coisas:
1. **Stats do jogador.** Vêm de `soulCombatant(state)` (PR2) e não mais de `playerStatsFor` (`PLAYER_STATS`).
2. **Inimigos.** Vêm de `DUNGEON_SLOTS` (6 slots, baby-i..mega), **relativos ao level do jogador**, e crescem por andar em vida e força (`DUNGEON_FLOOR_GROWTH`). `dmgReduction` sai: a escada sobe em golpes, não em %.
3. **Seed.** `buildDungeonWave(level, petStage, rng)` passa a receber o rng, semeado por `mulberry32(seedDaRun ^ andar)`, e o `Math.random` da l. 132 sai.

O Pesadelo monta a onda pelos slots `top−1..top` do **andar 1**, sempre, e não mais pelo `max(1, top−1)` de hoje.

## Símbolos donos (conferidos na main)
- **`utils/dungeon.ts`:**
  - **Saem:** `PLAYER_STATS`, `playerStatsFor`, `TIER_BASE`, o campo `DungeonEnemy.dmgReduction` e as contas de `hpMult`/`atkMult`/`speedBump` de `buildDungeonWave`.
  - **Entram:** `DUNGEON_SLOTS`, `DUNGEON_FLOOR_GROWTH` e `dungeonFoe(L, slot, floor)`.
  - **Ficam:** `points`, `DUNGEON_BITS_FACTOR`, o sprite e o nome.
- **`utils/nightmares.ts` › `buildNightmareWave`:** recebe `rng` e `playerLevel`. A regra `count`/`tier` de `nightmaresFor` não muda.
- **`utils/energia.ts`:**
  - **Saem do PvE:** `pveStrikeDamage`, `pveFoeHitDamage`, `PVE_HP_SCALE`, `PVE_FOE_HP_EXTRA`, `PVE_SPECIAL_MULT`, `PVE_FOE_SPECIAL_MULT`, `PVE_BASE_FRAC`, `pveHp` e `pveFoeHp`. Os re-exports `ENERGY_*`/`CHEER_*` de `_duel.js` ficam até o PR5.
  - **Ficam:** `RING_*`, `ringSpec`, `ringGrade`, `DODGE_*`, `dodgeSpec` e `dodgeGrade`, que são mecânica da cena.
- **Ofício, `utils/profissaoMasmorra.ts` › `jeitoDaProfissao`:** o `JeitoNaMasmorra` é mapeado para modificadores do adaptador, e esse mapeamento tem um dono só, `jeitoParaPve(jeito)` em `profissaoMasmorra.ts`:

  | Campo do jeito | No v3 |
  |---|---|
  | `hp` | HP do jogador × hp |
  | `dmg` | `hitScale` do jogador × dmg e cast × dmg |
  | `perfeito` | limiar da auto-defesa |
  | `tempoDefesaExtra` / `velocidadeDefesa` | `jeitoDefesaBonus` (já existe) |
  | `velocidadeAtaque` | `hitScale` do jogador × 1/v |
  | `reducaoDano` | recebido × (1 − 0,1·r) |
  | `contraAtaque` | no bloqueio perfeito, o próximo básico ganha +min(0,5·c, 0,6) |
  | `atravessaGuarda` | `hitScale` × (1 + 0,1·a), porque a "guarda" deixou de existir |
  | `curaAndar` | cura entre andares |
- **`utils/autoDefesa.ts`:** `autoDefense` fica. O comentário que cita `PLAYER_STATS` é atualizado.
- **Telas** (o caminho certo é `src/components/`, **não** `src/components/games/`, como a versão anterior da story dizia):
  - `src/components/DungeonGame.tsx`, nas l. 124–128 (stats e jeito) e 236–260 (regras);
  - `src/components/NightmareBattle.tsx`, nas l. 103–105 e 167–190.
- **Outros consumidores de `buildDungeonWave`:** `src/App.tsx`, que é zona da sessão irmã (só ajustar a assinatura e avisar), `utils/attackFxArt.ts`, `autoDefesa.test.ts`, `energia.test.ts`, `mente/balanco.test.ts` e o doc `assets/soulmon/fx-ataque/INSTALAR.md`.

## Decisões do dono aplicadas
- **§2.3 X4:** ofício, bloqueio, anel e esquiva ficam fora da régua, com no máximo ±25% no TTK.
- **§2.3 F2:** piso de 3 golpes.
- **§2.6:** cura e escudo calibrados por estágio. Com o golpe normalizado (PR3), isso já vale em todo level.
- **§20.1:** perder não custa coração.
- **§2.7:** os gates de andar ficam no PR7; aqui não há gate.

## Critérios de aceite
1. **A escada sobe em golpes.** Para o slot mega e cada level de `RULER_LEVELS`, `displayHits` do jogador balanceado sobe pelo menos 1 do andar n para o n+1, em n = 1..5 (medido no L1: 9/10/11/12/13/14). **Vermelho:** `DUNGEON_FLOOR_GROWTH.hp = 0,05` reprova no L1.
2. **Piso de 3 golpes.** O inimigo de HP mínimo (`slot 0`, andar 1) contra o jogador ATK puro do L40 com vantagem elemental leva ≥ 3 golpes exibidos (`Math.max(3, …)` fica em `dungeonFoe`). **Vermelho:** sem o piso, dá menos de 3 e reprova.
3. **Ofício limitado.** Cada ofício de `PROFISSAO_MASMORRA` muda o TTK médio em no máximo ±25% (medido: artesão −7,7%, escriba −8,4%, os demais ≤ 4%). A lista vem do módulo. **Vermelho:** `contraAtaque: 10` sem o teto de +0,6 reprova. O ×2 do alquimista sozinho não chega a reprovar, porque o efeito medido é −2,1%.
4. **Pesadelo pelo mesmo caminho.** O Pesadelo usa `dungeonFoe` e o mesmo adaptador. A divergência "`base.dmg` cru" (o `NightmareBattle` não aplicava o jeito) se resolve assim: o Pesadelo **aplica** `jeitoParaPve`, igual à Masmorra. O PR documenta isso.
5. **Duração.** TTK mediano por inimigo entre 20 e 29 s nos andares 1 a 5 (medido 20,4–24,8 s) e no Pesadelo como um todo (18,7–21,8 s; os tops 1–2 ficam um pouco abaixo de 20 s, o que é aceito e declarado). N = 600 runs.
6. **Escada da Masmorra, mesmo level e habilidade `media`.** Termina o andar 1 em pelo menos 95% das runs, o andar 3 entre 80% e 100%, o andar 5 entre 15% e 60% e o andar 6 em no máximo 10% (medido 100/100/40/0). **Vermelho:** `DUNGEON_FLOOR_GROWTH.power = 0,25` derruba o andar 2 para 7% e reprova.
7. **Sem `Math.random`** em `dungeon.ts`, `nightmares.ts`, `DungeonGame.tsx` e `NightmareBattle.tsx` na luta e na onda. `rollDungeonHeartDrop` (l. 271) **fica** com `Math.random`, porque é o drop de coração e não faz parte da luta; isso vai declarado no teste de grep. A mesma seed gera a mesma onda e a mesma luta.
8. **Derrota sem custo.** A derrota não altera `hp` nem os corações do save, e o teste existente segue verde.
9. **Bytes.** `orcamentoDeBytes` verde, porque `DungeonGame` e `NightmareBattle` já são chunks lazy.
10. **Checagens finais.** tsc, vitest e build verdes, com o dist commitado.

## Testes vermelho → verde
1. `dungeon.v3.test.ts`: AC 1, 2, 5, 6 e 7.
2. `profissaoMasmorra.v3.test.ts`: AC 3.
3. `nightmares.v3.test.ts`: AC 4 e 5, sem mexer nos testes de regra de noite (`count`/raridade), que ficam.
4. `energia.test.ts` e `autoDefesa.test.ts`: tiram o que medem de `pveStrikeDamage` e `PLAYER_STATS` e mantêm anel, esquiva e auto-defesa.

## Calibração (medida)
`DUNGEON_SLOTS`:

| Slot | hp | power | Especial |
|---|---|---|---|
| baby-i | 0,74 | 0,03 | — |
| baby-ii | 0,78 | 0,04 | — |
| rookie | 0,82 | 0,05 | — |
| champion | 0,86 | 0,06 | — |
| ultimate | 0,90 | 0,07 | — |
| mega | 0,94 | 0,09 | `direct` |

- `DUNGEON_FLOOR_GROWTH = { hp: 0,09, power: 0,15 }`.
- O inimigo do slot no andar f é `{ ...combatantAt(L, balanced), hp: hp × slot.hp × (1 + 0,09·(f−1)), bonus: slot.power × (1 + 0,15·(f−1)) − 1 }`.
- Cura entre andares: `curaAndar` do jeito (padrão 0,25).
- HP e energia passam de um inimigo para o próximo (`startHp`/`startEnergy`), como o `keepPet` de hoje.
- O nível base semanal (`getDungeonDifficulty`) e o `deepStart` continuam somando andares.

## Estados de UI
Luta · especial (anel) · esquiva · derrota (sem custo) · empate (conta como derrota sem custo) · onda vazia (impossível; `assert` com erro tratado na tela) · offline.

## Verificação
```
npx vitest run src/utils/dungeon src/utils/nightmares src/utils/energia src/utils/profissaoMasmorra src/utils/autoDefesa src/components/DungeonGame src/components/NightmareBattle && npx tsc -p . && npm run build
```

## Não-objetivos
Gates de andar (PR7), equipamento (PR8), nome do especial (PR9) e a economia de Bits (`points` e `DUNGEON_BITS_FACTOR` não mudam; `mente/balanco.test.ts` tem de continuar verde).

## Riscos
- **A parede é a mesma para todos.** Como o inimigo é relativo ao jogador, todo level bate a parede no andar 5. A progressão de poder fica no level absoluto do jogador **contra o nível base semanal**, que soma andares. Se o dono quiser inimigos absolutos (o "andar 3 é brutal para rookie" de hoje), é decisão nova e não entra neste PR.
- **Bloqueio perfeito.** O bloqueio perfeito com contra-ataque (N5) vira `hitScale` com teto. Se o dono quiser o bloqueio fora do jogo, isso vira pergunta.
- **Cura fora da régua.** A cura entre andares (`curaAndar`, N16) fica fora da régua, e isso é declarado.
- **Coeficientes sensíveis.** A sequência de 6 lutas é sensível aos coeficientes (ver o risco R1 do PR3).
