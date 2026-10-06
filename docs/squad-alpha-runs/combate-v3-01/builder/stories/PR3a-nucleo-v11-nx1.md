# Story PR3a — Núcleo v1.1: golpe normalizado, passo a passo, ganchos e luta N×1 (run `combate-v3-01`, Builder)

> Escrita em 06/10/2026 com as decisões §2.15 (P1 e P2), medida em `builder/balanco-motores.md` §3 e §6. O código de referência executável está em `_sim/cv3-medir/fightx.ts` (1v1 com ganchos) e em `_sim/cv3-medir/groupfight.ts` (N×1). O PR **porta** esse código para `src/utils/combate/` com tipos e testes; não reinventa nada.
> Dependências: PR1 e PR1b na main. O PR2 está sendo refeito (o #226 reverteu, o #227 corrige), e este PR não depende dele: o núcleo não lê o save. Base de leitura do PR2: `70417a61`.
> **Sem UI.** O único consumidor é o teste. A Arena entra no PR3b.

## O que construir (tudo em `src/utils/combate/`, tudo puro)
1. **Golpe normalizado (P1).**
   - Em `fight.ts`: `HIT_UNIT_H0 = 10` e `hitUnit(L) = hitsToKnockOut(bal, bal) / HIT_UNIT_H0`, com `bal = combatantAt(L, REFERENCE_BUILDS.balanced)`.
   - Cada ataque remove `1/(hits/u)` do HP, e o intervalo de ataque fica ×u.
   - Em `rng.ts`: `VARIANCE = { rho: 0,9, sigma: 0,08, floor: 0,05 }`.
2. **`fightSteps(a, b, opts)`.**
   - É um gerador `Generator<FightEvent, FightResult, number | undefined>`.
   - Em `{ kind: 'cast' }` ele pausa e recebe de volta o multiplicador do cast (anel ou esquiva).
   - O `fight()` passa a ser só o driver que responde 1 a todo cast, e a assinatura não muda.
   - `FightEvent` tem `attack | cast | tick | ko`, com `t`, o lado, a fração, o HP e a energia dos dois lados.
3. **Ganchos em `FightOptions`:** `startHp`, `startEnergy`, `hitScale(who, n)`, `cheer: { t, side }[]` e `stopAtFirstKo`. A semântica é a de `fightx.ts`.
4. **Luta N×1: `groupFightSteps(player, foes[], opts)` e o driver `groupFight`, em `group.ts` (arquivo novo).**
   - O jogador mira o 1º inimigo vivo. Cada inimigo tem stream e fase próprios: o inimigo 0 usa `sideSeed(seed, 2)` e o inimigo i usa `sideSeed(seed ^ i·φ, 2)`.
   - As fases saem da mesma `phaseRng`: jogador, inimigo 0 e os seguintes.
   - A luta acaba quando o jogador cai (`foes`), quando todos os inimigos caem (`player`) ou quando os dois acontecem no mesmo instante (`draw`).
   - O retorno inclui `hpLeft` e `energyLeft`.
5. **Área × único (P2).**
   - `FightSide.area?: 'single' | 'area'`, com padrão `single`. `AREA_FAMILIES = ['direct', 'dot', 'defDebuff']`, ou seja, as famílias que miram o inimigo. Cura, escudo e buffs são pessoais e a área não as afeta.
   - **Regra do orçamento:** os dois gastam o mesmo total E.
     - **Área:** cada inimigo vivo no cast recebe `E / k`.
     - **Único:** o alvo recebe E inteiro.
     - **DoT único:** se o alvo cai, os ticks restantes passam para o próximo alvo vivo, então não se perde nada.
   - O único ganha porque concentra (derruba antes e para o dano que entra). A área ganha porque não desperdiça excesso.
   - `AREA_EFFICIENCY = 1`. O class-system usa `EFICIENCIA_AREA = 0,9`, mas o dono pediu "mesmo orçamento total"; ver o risco R2.
6. **Elemento:** `elementHits(adv)` = `1 − adv / HIT_UNIT_H0`, em `curve.ts`.
7. **Tabelas em `specials.ts`:**
   - `PVE_FAMILY_POWER` por motor: `{ arena: {...}, dungeon: {...} }`, com os valores das seções 3 e 6 do balanço;
   - `CHEER = { tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 3 }` e `cheerEvents(taps, side)`.
8. **Habilidade (P4):** `RING_MULT = { ruim: 0,92, bom: 1, otimo: 1,08 }` e `DODGE_REDUCE = { nada: 0, bom: 0,2, otimo: 0,35 }`, em `utils/energia.ts`. Os dois já têm dono lá; aqui só mudam os valores, e o teste de habilidade do PR3b os trava.

## Fonte de "área ou único" (class-system)
- **O que existe hoje:**
  - o class-system tem o tipo `AreaConfig = { tipo: 'unico' } | { tipo: 'circulo', raioMetros }` (`vendor/class-system/types/engine/skills.d.ts`, l. 44) e a conta de área dentro de `calcularSkill` (`EFICIENCIA_AREA = 0,9`, `alvosEsperados`);
  - o app **nunca escolhe a área**: `StageSkill` (`src/utils/soulProfile/ficha/skills.ts`, l. 34) não tem esse campo, e `realSkillPower.ts` (l. 62) fixa `area: { tipo: 'unico' }`;
  - a única noção de área no app é `arena.ts › SPECIAL_EFFECTS.targets`, por escola: `conjuracao: 'all'`, `longo_alcance: 2`, o resto 1.
- **O que o PR faz:**
  - `StageSkill` ganha `area: AreaConfig`, com o tipo importado do `class-system`;
  - `buildStageSkills` passa a preencher esse campo quando nasce ou evolui, pela regra de Q-AREA;
  - `realSkillPower.ts` passa a usar `skill.area` em vez do valor fixo, e o "poder" mostrado na página do Pet passa a refletir a área;
  - o núcleo recebe `area: skill.area.tipo === 'circulo' ? 'area' : 'single'`.
- **Q-AREA (pendente com o dono, bloqueia só o item 3 deste bloco; os itens 1–8 de "O que construir" podem começar).** Default declarado: **por escola**, espelhando o `targets` de hoje. `conjuracao` e `longo_alcance` ficam com `circulo` de raio `RAIO_MAXIMO_BASE` (4 m) do class-system; as outras escolas ficam com `unico`.

## Critérios de aceite (vitest; as amostras vêm do módulo)
1. **Regressão:** com `u = 1`, sem ganchos e com `sigma` 0,15, `fight()` reproduz a main nas 300 lutas declaradas. **Vermelho:** trocar `PHASE_SALT`.
2. **`fightSteps` e `fight` dão o mesmo resultado**, e a mesma seed dá o mesmo log.
3. **N = 1 é igual ao 1v1:** `groupFight(p, [f])`, com área ligada ou desligada, dá o mesmo 1º KO (|Δt| < 1e−9) e o mesmo vencedor que `fight()` em 300 lutas (medido: 0 de 300 divergências). **Vermelho:** um stream do inimigo 0 diferente de `sideSeed(seed, 2)` reprova.
4. **Golpe normalizado:**
   - `displayHits` do espelho fica em 10 ± 1 em todos os `RULER_LEVELS`;
   - o especial direto encurta o TTK entre 25% e 33% em L1, L21 e L40 (medido 29,1%);
   - **vermelho:** com `u = 1`, o L40 dá 1,4%.
5. **Gates do PR1 seguem verdes:** DEF P95 ≤ 40 s (medido 31,1), +1 Lv ≥ 2% (5,2%), gap ≤ 10% (8,0%), régua 0 de 42.
6. **Sorte por estágio** (N = 400 por estágio): o mais fraco por 5% vence entre 25% e 40% (medido 34–37%) e o de 1 Lv abaixo entre 5% e 35% (8–32%). **Vermelho:** o núcleo da main dá 21% no s4.
7. **Régua pareada área × único:** é uma régua nova, `areaDelta(...)` em `ruler.ts`.
   - Cenário: a composição da Arena (`ARENA_ROUND_COMP`, lida do módulo do PR3b, ou uma cópia declarada `RULER_GROUP_COMP` enquanto o PR3b não existir), as mesmas seeds e cada família de `AREA_FAMILIES`.
   - Critério: |Δ vitória| ≤ 6pp e |Δ tempo médio da run vencida| ≤ 5% (medido: direct −2,4pp/−2,0%, dot −5,4pp/+1,4%, defDebuff −4,2pp/−4,8%; N = 3200 runs por lado).
   - **Vermelho:** se a área der E inteiro a cada alvo, em vez de E/k, reprova.
8. **Área no 1v1:** com N = 1, a área é idêntica ao único (é a mesma luta).
9. **Elemento:** a vantagem tira exatamente 1 golpe exibido, e a desvantagem soma 1, em todo `RULER_LEVELS`. **Vermelho:** ×1,3.
10. **Sem `Math.random`** em `combate/*` (grep). Bytes: o núcleo não entra no `index.js` (`orcamentoDeBytes` verde, folga de 8 KB).
11. **Checagens finais:** tsc (app + server), vitest e build verdes, com o dist commitado.

## Testes vermelho → verde
- `combate/combate.v11.test.ts`: AC 1, 2, 4, 5, 6 e 9.
- `combate/group.test.ts`: AC 3, 7 e 8.
- `soulProfile/ficha/skills.area.test.ts`: `area` é determinística por (ficha, estágio) e segue a regra de Q-AREA; `realSkillPower` respeita `skill.area`.
- Os testes do PR1 (`combate.test.ts`) seguem verdes. Os números que mudam com o σ (o item 7 do PR1, "weaker 25–40%") são revalidados, não afrouxados.

## Verificação
```
npx vitest run src/utils/combate src/utils/soulProfile/ficha && npx tsc -p . && npx tsc -p tsconfig.server.json && npm run build
```

## Riscos
- **R1, DoT único.** Sem o repasse de tick, a área venceria o DoT único por +12 a +20pp (medido antes do repasse). O repasse fica travado por teste.
- **R2, eficiência da área.** Com `AREA_EFFICIENCY = 0,9` (o valor do class-system), o direto em área perde de 6 a 17pp. Fica em 1, e o PR registra que o núcleo de combate **não** usa a eficiência do class-system.
- **R3, ruído das amostras.** Com N baixo, o desvio por célula é de ±9pp. O teste usa N = 400 × 8 células e faixas, não pontos.
