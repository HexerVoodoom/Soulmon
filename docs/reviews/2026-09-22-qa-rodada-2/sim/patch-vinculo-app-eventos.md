# Patch NÃO aplicado — os 6 `BondEvent` mudos do `App.tsx` (achado 2.4)

Escrito pelo guarda do vínculo em 22/09/2026. `App.tsx` está fora do domínio
deste patch (só `pausarTrilha`), então isto fica aqui para quem for dono do
`App.tsx` aplicar **depois** que o dono responder `PERGUNTAS-DO-DONO.md` #59
(a fiação é decisão de calibração: 6 eventos ligados sobem A de L23 → ~L26 em
d90; ligar sem recalibrar a curva contradiz a nota "dia bom ≈ 165 XP" de
`bond.ts`). O `perfectDay` (o único cujo dono é `computeDailyReset`) JÁ foi
ligado nesta rodada — `src/utils/bond.diaCompleto.test.ts`.

Regra que vale para todos: `awardBondXP` dentro do MESMO updater que já grava o
evento (footgun 6: sem efeito colateral fora), `dayKey` = `playerDayKey(new
Date(), prev.playerDayTz)` (o ledger do teto é do dia do JOGADOR).

## 1. `habitMilestone` — `withHabitCompletion` (App.tsx, função pura no topo)

```diff
   const comXP = awardBondXP(prev, {
     kind: 'completion', weight: HABIT_WEIGHT, habitTier: habitTier(after.totalDone),
   }, bondDayKey);
+  // 🌳 Marco de hábito (7/21/66): `milestoneReached` já detecta; a tabela
+  // (`XP_HABIT_MILESTONE`) paga uma vez por marco, e `completeHabit` é
+  // idempotente por dayKey, então não dispara duas vezes.
+  const marco = milestoneReached(before.totalDone, after.totalDone);
+  const dias = marco === 'sprout' ? 7 : marco === 'sapling' ? 21 : marco === 'tree' ? 66 : null;
+  const comMarco = dias ? awardBondXP(comXP, { kind: 'habitMilestone', days: dias }, bondDayKey) : comXP;

   return {
-    ...comXP,
+    ...comMarco,
```

(`milestoneReached` já é importado; conferir o mapa tier→dias contra
`HABIT_MILESTONES` em `types/taskModel.ts` em vez de literais — se lá houver
um helper `milestoneDaysOf`, use-o.)

## 2. `restNight` — `useEffect([isSleeping])` de `recordNight` (App.tsx)

```diff
     if (isSleeping) {
       writeLocal(STORAGE_KEYS.SLEEP_STARTED_AT, now.toISOString(), { silent: true });
-      setGameState(prev => ({ ...prev, rest: recordNight(prev.rest ?? createRestState(), now) }));
+      setGameState(prev => {
+        const rest = prev.rest ?? createRestState();
+        const comNoite = { ...prev, rest: recordNight(rest, now) };
+        // 🛏️ Só a noite DENTRO da janela rende XP — mesma régua da missão
+        // `rest-nights` logo abaixo (premia deitar no horário, nunca dormir).
+        return isWithinWindow(rest.window, now)
+          ? awardBondXP(comNoite, { kind: 'restNight' }, playerDayKey(now, prev.playerDayTz))
+          : comNoite;
+      });
```

Idempotência: `recordNight` é idempotente por manhã, mas `awardBondXP` não —
se o gesto deitar/acordar/deitar se repetir na mesma noite, some um guard
`!rest.nights.some(n => n.date === chaveDaNoite)` antes de premiar.

## 3. `dreamNew` — o `useEffect` do sonho da manhã (App.tsx)

```diff
     setGameState(prev => ({
       ...prev,
       rest: collectDream(prev.rest ?? createRestState(), dreamId, playerDayKey(new Date(), prev.playerDayTz)),
     }));
+    if (isNew) setGameState(prev => awardBondXP(prev, { kind: 'dreamNew' }, playerDayKey(new Date(), prev.playerDayTz)));
```

(ou fundir num único updater; `isNew` já é calculado fora, a partir de `rest.dreams`.)

## 4. `nightmareCleared` — `handleNightmareWin` (App.tsx)

```diff
   const handleNightmareWin = useCallback((rewards: NightmareRewards) => {
-    setGameState(prev => ({
+    setGameState(prev => awardBondXP({
       ...prev,
       healthPoints: …,
       energyPoints: …,
       gamePoints: …,
       nightmares: markFought(…),
-    }));
+    }, { kind: 'nightmareCleared' }, playerDayKey(new Date(), prev.rest?.playerDayTz ?? prev.playerDayTz)));
```

## 5. `dungeonFloor` — novo callback `onFloorCleared` em `DungeonGame.tsx`

`DungeonGame.tsx` não expõe "andar limpo" (só `onEnemyDefeated`, `onEarnPoints`,
`onGlitchtama`). Acrescentar `onFloorCleared?: () => void` na `Props`, chamar
onde `clearBonus(floor)` é creditado, e no `App.tsx`:

```tsx
onFloorCleared={() => setGameState(prev => awardBondXP(prev, { kind: 'dungeonFloor' }, playerDayKey(new Date(), prev.playerDayTz)))}
```

Teto `BOND_DAILY_CAP.dungeon` (120) já limita: 5 andares × 10 + run 60 = 110 —
cabe uma run/dia; a segunda run só rende 10. Conferir se é a intenção.

## 6. `triageCleared` — `handleTriageResolve` / `onClose` do `TriagePile` (App.tsx)

Premiar quando a fila ESVAZIA (a última carta resolvida), nunca por carta:

```tsx
// dentro de handleTriageResolve, depois de aplicar a ação à tarefa:
const restantes = triageQueue(next.tasks, new Date()).length;
if (restantes === 0) next = awardBondXP(next, { kind: 'triageCleared' }, playerDayKey(new Date(), next.playerDayTz));
```

## Guard que falta (para todos): `bond.wiring.test.ts` varrer `src/`

```ts
it('todo kind de BondEvent tem pelo menos um emissor fora de teste', () => {
  const fontes = globSync('src/**/*.{ts,tsx}').filter(f => !/\.test\./.test(f)).map(f => readFileSync(f, 'utf8')).join('\n');
  for (const kind of KINDS) expect(fontes, kind).toMatch(new RegExp(`kind:\\s*'${kind}'`));
});
```

É o "grep de 5 minutos" que `08-produto-maestro` pediu; hoje o teste exercita a
função pura com TODOS os kinds e a fiação com nenhum.
