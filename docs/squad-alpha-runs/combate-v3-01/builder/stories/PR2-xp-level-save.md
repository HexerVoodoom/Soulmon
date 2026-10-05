# Story PR2 — XP e level do Soulmon, derivados e saneados (run `combate-v3-01`, Builder)

> Era o PR5 da ordem proposta. Subiu para PR2: Arena, Masmorra e PvP leem o level. Sem ele, cada motor teria um level provisório, o que dá duas fontes (footgun 9). Ver `README.md`.

## O que construir
O Soulmon passa a ter XP e level **derivados de fatos já persistidos**. O level aparece no app. Quando o level desce por degeneração, a tela mostra o número com texto neutro. Saves antigos já abrem com o level correspondente a `totalPerfectDays`.

## Por quê
§2.7/§2.8: o level define o TOTAL de pontos, e o PR1 já tem `allocate`/curva. Falta a entrada real. `arquitetura-camadas.md` Camada 1: nada derivável é persistido.

## Símbolos donos
- `src/utils/soulXP.ts` › `soulXP(state)`, `soulLevel(state)` (novos) + espelho `functions/api/_soulXP.js`.
- `src/types/progression.ts` › `levelCapFor(stage)`, derivado de `FORM_REQUIREMENTS.cap` (6/13/21/30/40). Proibido número paralelo.
- `src/utils/dailyReset.ts` › `computeDailyReset` / `completeDayReached`: só **leitura**, nenhuma mudança de regra.
- `functions/api/save.js` (saneamento) e `GameStateContext.tsx` (hidratação), apenas se surgir campo novo.
- `src/contexts/GameStateContext.hydrate.fuzz2.qa.test.tsx` (103 → N).

## Decisões do dono aplicadas
- §2.7: XP vem de toda atividade, ~66% do bônus de dia completo e ~34% das tarefas. A evolução continua presa aos dias perfeitos.
- §2.8: XP por dia completo + esforço/meta, **nunca por contagem** de tarefas. O alvo é 66/34. O level desce e é exibido em texto neutro (`copy.semFomo`).
- §2.5: os pontos espelham `perfectDays`, que tira e recupera.
- §2.3 Q9: o retroativo usa `totalPerfectDays`.
- §2.4: a Glitchtama DÁ ponto. Invariante: mesmo estágio + mesmo level ⇒ mesmo total de pontos.
- §2.3 S1: o servidor nunca aceita level ou stats vindos do cliente.

## Critérios de aceite (testáveis)
1. `soulLevel` = `min(levelFor(soulXP), levelCapFor(stage))`. O teste confere o vetor de tetos 6/13/21/30/40, lido de `FORM_REQUIREMENTS`, e não de uma lista escrita no teste.
2. **66/34 por esforço:** numa semana sintética com meta cumprida todo dia, a fração de XP vinda do dia completo fica em 66% ±5pp. Dobrar o **número** de tarefas com o mesmo esforço total não muda o XP. **Prova de vermelho:** com XP por contagem, o teste reprova (cole a saída).
3. **Invariante do total:** para todo par de estados com o mesmo estágio e o mesmo level (com e sem Glitchtama, com degeneração e com o zerar na evolução), `statPoints` é igual. Amostra declarada: gerador de estados no próprio teste, N declarado, sementes fixas.
4. **Desce e volta:** degenerar baixa o level, e recuperar devolve o mesmo level e os mesmos stats. Nenhum XP fica guardado.
5. **Copy:** a string de level que desceu passa no `copy.semFomo.contract.test.ts`. EN primeiro, depois PT-BR. **Prova de vermelho:** uma string com "perdeu" reprova.
6. **Retroativo:** um save antigo sem campo novo hidrata com o level derivado de `totalPerfectDays`. O teste usa um fixture de save real anonimizado.
7. **Paridade:** `soulXP.parity.test.js` mostra que cliente e `_soulXP.js` dão o mesmo resultado em N estados declarados.
8. **Save:** se algum campo novo for persistido, `save.js` o saneia, o teste de contagem passa de 103 para o N exato, e o PR justifica por que o campo não é derivável. O default é **zero campos novos**, e o fuzz2 segue em 103.
9. Rodam verdes: `tsc` (app + `tsconfig.server.json`), `vitest` e `npm run build` (dist commitado).

## Estados de UI
Sucesso (level N); level desceu (neutro); save antigo (level retroativo, sem animação de "subiu"); offline (derivado local, igual ao servidor).

## Verificação
```
npx tsc -p . && npx tsc -p tsconfig.server.json && npx vitest run src/utils/soulXP functions/api && npm run build
```

## Não-objetivos
Motores de combate, chips, talentos, Vínculo, equipamento, nome do especial. Mudar a regra de dia completo ou de evolução (§10).

## Dependências
PR1.

## Riscos
- O "galho do dia" não existe (`dossie-codigo` §2.4). A distribuição usa o galho acumulado já persistido, e o PR não cria um tally novo.
- A Glitchtama soma em `perfectDays` sem somar em `totalPerfectDays`. O retroativo usa `totalPerfectDays` e o vivo usa `perfectDays`. O teste do critério 3 cobre essa divergência.
- Alvo 66/34 com tolerância apertada demais. A tolerância fica declarada no teste.
