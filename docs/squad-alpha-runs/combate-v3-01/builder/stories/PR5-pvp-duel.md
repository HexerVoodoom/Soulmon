# Story PR5 — PvP/Torneio no núcleo v3, com paridade e clamp S1 (run `combate-v3-01`, Builder)

> Revisada em 06/10/2026 contra `origin/main` bd6adbed e o PR2 (`origin/combate-v3/pr2` 1b956d91), e medida (`builder/balanco-motores.md`).
> Depende do PR2 (`_soulXP.js`; o #226 reverteu e o #227 reaplica; leia `70417a61`) e do PR3a (núcleo v1.1). O PvP é 1v1 e não usa área: o especial em área age como único, porque N = 1. **P3 decidida (§2.15):** o teto é a data da 1ª gravação no metadata do KV, limita a 1 level por dia de servidor e vale só no duelo.

## Achados no código (corrigem a versão anterior)
- **Não existe `combatStats`** em `save.js`, no save nem em lugar nenhum da main (grep vazio). No v3 os stats são **derivados**: o PR2 deriva o level de `evolutionStage` e `perfectDays` e não persiste nada. Por isso o S1 deixa de ser "clampar `combatStats`" e passa a ser **derivar no servidor e limitar o level com um relógio do servidor**.
- **`duelStats(profile)` lê o PERFIL público** (`profile.stage`, `profile.attrs`), que o cliente grava em `community.js action=profile` (l. 362–430) a partir do corpo do POST. O duelo v3 lê o **SAVE** de cada lado (KV `saveId`, o mesmo que `bondLevelOf` em `_bond.js` já lê).
- **O `_soulXP.js` do PR2 só tem XP e level.** Faltam `distributePoints`, `autoHp`, `combatantAt` e o `fight`. As Pages Functions não importam de `src/`, então o núcleo precisa de um espelho JS. A decisão está abaixo.
- **A torcida de hoje é "toques por golpe próprio"** (`sanitizeTaps`, `DUEL_CHEER_WINDOWS = 13`). No v3 o número de golpes varia com o SPD e o buff, então a torcida passa a ser **por balde de tempo** (`CHEER.bucketSeconds = 3`).
- **O fluxo do servidor fica igual** e já é seguro: `duelStart` gasta a partida e sorteia a seed depois do compromisso (`crypto.getRandomValues`), e `match` reusa a `pending.seed`. O AC 2 só precisa travar isso no v3.

## Decisão de arquitetura (ADR curto)
- **Contexto.** O servidor precisa do mesmo `fight` que o cliente. As Pages Functions não importam `src/`. O precedente é `_soulXP.js` + `soulXP.parity.test.js` e `_bond.js` + `bond.parity.test.js`.
- **Decisão.** O espelho fica em **`functions/api/_combate.js`**, com tipos em `_combate.d.ts`, e contém curve, level, rng, specials (`SPECIAL_POWER`, `ENERGY`, `CHEER`), `fight` e `soulCombatant(save)`. Quem trava é `functions/api/combate.parity.test.js`. Os tetos de estágio são importados de `_soulXP.js`, não copiados.
- **Alternativas consideradas:**

  | Opção | Prós | Contras |
  |---|---|---|
  | (b) Mover o núcleo para `functions/api/_combate.js` e deixar `src/utils/combate/*.ts` como re-export | fonte única | perde o `strict` do TS no núcleo; `level.ts` deriva os tetos de `FORM_REQUIREMENTS`, em `src/`; reabre o PR1 |
  | (c) Bundle do núcleo no build das Functions | — | não existe pipeline de build das Functions hoje; é infra nova |
- **Consequência aceita.** São duas cópias, 250 linhas cada. O teste de paridade é a cerca.
- **Sinal para reverter (para b).** Uma divergência de paridade em produção, ou um terceiro motor no servidor.

## O que construir
1. **`functions/api/_combate.js`.** É o espelho descrito acima. O teste de paridade compara o log de eventos e o `winner` de `fight()` dos dois lados em 15 `RULER_LEVELS` × 4 builds × 7 famílias × 10 seeds, com e sem `cheer`.
2. **`_duel.js` v3:**
   - `duelCombatant(save, { maxLevel })` substitui `duelStats(profile)`. Ela deriva `soulCombatant` do save e limita o level a `maxLevel` (S1).
   - `simulateDuel({ me, opp, seed, taps })` vira o driver `fight(me, opp, { seed, hpScale: PVP_HP_SCALE, cheer: cheerEvents(sanitizeTaps(taps), 0) })` e devolve `{ events, winner: 'me' | 'opp' | 'draw', hpMe, hpOpp }`.
   - **Saem:** `STAGE_POWER`, `DUEL_HP_BASE`, `DUEL_HP_PER_STAGE`, `DUEL_DMG_SPREAD`, `DUEL_SPECIAL_MULT`, `DUEL_MAX_TURNS`, `DUEL_ENERGY_DEALT`/`TAKEN`/`CHEER`/`MAX`, `DUEL_CHEER_STRIKES`, `sanitizeCheers`, `cheerMultiplier`, `TIMING_CHEER_ENABLED`, `DUEL_PERFECT_*` e o `mulberry32` local (vem de `_combate.js`).
   - `DUEL_TAPS_FULL`/`DUEL_TAPS_CAP` passam a ser re-exports de `CHEER`. `sanitizeTaps` fica, agora por balde: `DUEL_CHEER_BUCKETS = ceil(60 / bucketSeconds)` = 20.
3. **`community.js`:**
   - `duelStart`, `match` e a lista de oponentes carregam o save dos dois lados (`kvOrThrow(env).get(saveId)`). Na lista são até 3 oponentes, ou seja, +3 leituras de KV.
   - O resultado passa a ter 3 valores. `settleMatch({ …, outcome })`, com `outcome: 'win' | 'loss' | 'draw'`, substitui o `won`. No `draw` nenhum lado ganha pontos nem Honra, e a partida conta como jogada. A resposta leva `draw: true`.
   - `myScore`/`oppScore` continuam sendo o % de HP restante.
4. **Clamp S1** (§2.15 P3).
   - `save.js` passa a gravar `metadata.f` (primeira gravação, em ms) e preserva o `f` anterior em todo `put`. `getWithMetadata` já é usado no GET (l. 158), e o POST lê o metadata antes do `put`. Nenhum campo novo no state; a contagem de campos (`fuzz2`, 103) não muda.
   - `maxLevel = 1 + floor((agora − f) / 86 400 000)`, ou seja, no máximo 1 level por dia de servidor. Save sem `f` (gravado antes desta mudança) recebe `f = agora` na primeira gravação e, até lá, `maxLevel = levelCapFor(stage)`.
   - O teto vale **só no duelo** (`_duel.js`). O save não é reescrito, para não brigar com a evolução do cliente.
5. **Cliente:**
   - `TournamentPage.tsx` (l. 268–270, 480) e `DuelScreen.tsx` (l. 41, 111, 151) usam o `fight` de `src/utils/combate` (o mesmo código do espelho) com a seed e os stats que vêm do servidor. O cliente nunca deriva o oponente.
   - A cena consome `fightSteps`, como no PR3b, mas sem anel e sem esquiva, porque no PvP ninguém age; a torcida só soma.
6. **NPC de treino (`tournamentNpcs.ts` › `npcAtk`).** É substituído por `npcCombatant(L) = combatantAt(max(1, L − NPC_LEVEL_GAP), balanced)`, com `NPC_LEVEL_GAP = 2` como valor inicial. O treino continua sem contar partida (§23.4).

## Decisões do dono aplicadas
- **§5:** paridade cliente/servidor travada por teste.
- **§2.3 S1:** teto no servidor, corrigido (o valor é limitado, não rejeitado).
- **§2.4:** empate válido; sai o desempate por % de HP e por seed.
- **§2.9:** o bônus de 5% vale no PvP, e o canal é `combinedBonus`, igual a 0 até o PR7/PR8.
- **§2.10:** AR(1) com a seed do servidor.
- **§2.13:** torcida normal dá ~65% contra o fantasma; uma barra, um uso.
- **§4:** PvP de 35 a 42 s.
- **§23.4:** NPC é treino.

## Critérios de aceite
1. **Paridade.** `combate.parity.test.js` dá o mesmo log de eventos (tempo, lado, fração, cast) e o mesmo `winner` em `src/utils/combate` e em `_combate.js`, na amostra do item 1 de "O que construir", lida dos módulos. **Vermelho:** trocar `VARIANCE.sigma` só no espelho reprova.
2. **Seed.** A seed nasce em `duelStart`, depois de a partida ser gasta. Um `match` com `seed` forjado no corpo é ignorado, e o teste mostra o mesmo resultado com e sem o campo. A lista de oponentes não traz seed (o teste existente segue).
3. **S1.** Um save com `perfectDays: 999` e `evolutionStage: 'ultra-*'`, com `f` de 3 dias atrás, luta com level ≤ 4: o valor é limitado, não rejeitado. Um save válido passa intacto. **Vermelho:** sem o teto, o mesmo save vence ≥ 95% contra um par legítimo, e o teste reprova.
4. **Fonte única dos stats.** `_duel.js` não lê `profile.attrs` nem `attrSum` (N17). Teste de grep em `_duel.js` e `community.js`, nas rotas `duelStart`, `match` e lista.
5. **Empate.** `winner: 'draw'` existe. Com seed e stats forçados ao espelho sem variância, a rota devolve `draw: true`, e pontos e Honra não sobem para nenhum lado.
6. **Duração.** A mediana do PvP fica entre 35 e 42 s em cada estágio de rookie a mega (medido 38,1–39,1 s com `PVP_HP_SCALE = 1,7`; P95 ~57 s). N = 600 por estágio.
7. **Mais fraco.** No PvP, o mais fraco por 5% vence entre 25% e 40% e o de 1 Lv abaixo entre 10% e 30%, na média (medido 33,0% e 18,6%).
8. **Torcida.** Com o teto de toques em todos os baldes, contra o fantasma sem torcida, a vitória no espelho fica entre 55% e 70% (medido ≈ 58–66% para +0,5–0,67 energia/s), e o TTK de quem torce muda menos de 25%. **Vermelho:** `energyPerDischarge = 36` (o `DUEL_ENERGY_CHEER` antigo) reprova.
9. **NPC.** No treino, o jogador vence o NPC entre 75% e 92% em cada estágio. Calibrar `NPC_LEVEL_GAP` no teste se sair da faixa. O teste existente de "treino não conta partida" segue verde.
10. **Erro de rede.** Se o servidor falha, a luta não acontece e nada é cobrado (a partida só é gasta no `duelStart` que respondeu 200; o teste existente segue).
11. **Checagens finais.** tsc (app + `tsconfig.server.json`), vitest e build verdes. `orcamentoDeBytes` verde: `TournamentPage` importa `_duel.js` hoje; confirmar no build que `_combate.js` não entra no `index.js`, ou parar e reportar.

## Testes vermelho → verde
1. `functions/api/combate.parity.test.js`: AC 1.
2. `functions/api/_duel.v3.test.js`: AC 3, 5, 6, 7 e 8. **Reescrever** `_duel.test.js`, `_duel.pr1b.test.js` e `_duel.qa3.test.js` no que eles medem do motor velho (turnos, `DUEL_SPECIAL_MULT`, a faixa de ~65% do PR1b), mantendo os testes de rota e de autorização.
3. `community.duel.v3.test.js`: AC 2, 4, 5 e 10, com o kit de KV dos testes existentes.
4. `save.firstSeen.test.js`: preserva `metadata.f` em gravações seguidas e não muda a contagem de campos.
5. `src/components/DuelScreen.render.test.tsx`, `strikeForm.pr1b.screens.test.tsx` e `combatFx.test.ts`: atualizar os imports de `duelStats` e `simulateDuel`.

## Calibração (medida)
`PVP_HP_SCALE = 1,7` · `CHEER = { tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 3 }` (teto ≈ 0,67 energia/s, com o tempo dando 2/s) · `NPC_LEVEL_GAP = 2` (inicial) · σ, `HIT_UNIT_H0` e famílias vêm do PR3a. **Sem** `PVE_FAMILY_POWER` no PvP.

## Estados de UI
Aguardando o servidor (carregando) · erro de rede (a luta não acontece, nada é cobrado) · offline (só treino local, rotulado) · vitória · derrota · empate (texto neutro, EN/PT, sem perdedor).

## Verificação
```
npx tsc -p tsconfig.server.json && npx tsc -p . && npx vitest run functions/api src/utils/combate src/utils/tournamentNpcs src/components/DuelScreen src/components/TournamentPage && npm run build
```

## Não-objetivos
Talentos PvP (PR7), equipamento (PR8), nome do especial (PR9), matchmaking e ranking, e qualquer mudança no gate de Vínculo (`BOND_PVP_MIN_LEVEL`).

## Riscos
- **Custo.** O duelo passa a ler +2 saves por partida e +3 na lista. No plano gratuito do KV (100 mil leituras/dia) isso cabe até cerca de 10 mil partidas por dia. Acima disso, guardar o combatente derivado no perfil, **gravado pelo servidor** em `save.js`.
- **5% de bônus.** O "~90%" da §2.9 medido hoje dá 64–67% com o núcleo v1.1. Aqui só se prepara o canal; o valor entra no PR7/PR8.
- **Chips +3 legados (§2.11).** No v3 os chips só pesam a distribuição, via `powerPoints` etc. e `soulWeights`, então não existe +3 direto para clampar. O PR registra isso.
- **Espelho duplicado.** O teste de paridade é obrigatório antes de qualquer constante mudar.
