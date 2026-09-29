# L1 — Conformidade da integração da Guilda (código × `PLANO-GUILDA.md` × `PLANO-COOP.md`)

> **Data:** 29/09/2026 · **HEAD:** `f47302bd` · **Autor:** soulmon-guarda-plataforma (auditoria, sem edição de código de produto)
> **Escopo:** o que existe HOJE (coop da Fase 4.3 embrulhado como "Guilda" em `src/components/guild/GuildSheet.tsx` › `GuildSheet`). O `PLANO-GUILDA.md` é futuro (⛔ gatilho da Camada 3); o `PLANO-COOP.md` é regra viva.

## 0. Portões rodados

```
npx tsc --noEmit                              → exit 0
npx tsc -p tsconfig.server.json --noEmit      → exit 0
npx vitest run functions/api/community.coop.test.js functions/api/account.coopExport.qa2.test.js \
  functions/api/account.deleteConfirm.qa.test.js src/components/CoopPanel.render.test.tsx \
  src/narrativa.contract.test.ts src/plugins/widgetSemCobranca.contract.test.ts \
  src/components/nav/areaLabHall.render.test.tsx src/components/nav/areaLotsNovos.test.ts
                                              → Test Files 8 passed (8) · Tests 76 passed (76)
```

## 1. Mutações (cópia em `/tmp/mut/functions`, repo intocado)

Harness: `cp -r functions /tmp/mut`, uma troca de string por vez, `npx vitest run` (coop + account.coopExport; sobreviventes re-rodados contra **`functions/` inteiro**, 836 testes).

| # | Mutação (arquivo › símbolo) | Invariante | Resultado | Teste que trava |
|---|---|---|---|---|
| M1 | `community.js` › `vistaDoGrupo` ganha `saveId: m` | I2 sem saveId | **morta** (2 vermelhos) | `community.coop.test.js` "nenhum saveId sai na resposta" |
| M1b | `vistaDoGrupo` `id: m` (saveId no lugar do pid) | I2 | **morta** (1) | idem |
| M2 | `coopCheckin` volta a gravar `g.checkins` no blob (`gravarGrupo`) | I3 cada um só a própria chave | **SOBREVIVE** (0/836) | **nenhum** — o teste de corrida não observa QUAIS chaves são escritas |
| M3 | `coopJoin` sem a releitura de confirmação | I4 409 join collision | **morta** (1) | "ninguém recebe um 'você entrou' que era mentira" |
| M4 | `_coop.js` › `gravarGrupo` sem renovar `coopOf:` | I5 | **morta** (13) | vários |
| M4b | `gravarGrupo` sem renovar `coopCode:` | I5 | **morta** (10) | vários |
| M4c | `coopCheckin` sem `renovarPrazos` | I5/I6 | **morta** (1) | "marcar presença renova o ponteiro do membro E o código" |
| M5 | `coopLeave` exige `body.confirm` | saída de um toque | **morta** (5) | "sair encolhe a META…", etc. |
| M5b | `_coop.js` › `coopLeave` lança sem grupo | saída idempotente | **morta** (2) | "sair sem grupo responde ok" + `account.coopExport.qa2` |
| M6 | `target` cacheado em `g.target` | I7 meta derivada | sobrevive — **mutante equivalente** (o `g.target` nunca chega ao KV) | — |
| M6b | `target` fixo em `COOP_MAX_MEMBERS × 5` | I7 meta encolhe | **morta** (5) | "sair encolhe a META junto" |
| M7 | grupo vazio não é apagado no `coopLeave` | grupo vazio some | **morta** (1) | "o último a sair apaga o grupo, sem lápide" |
| M7b | `_coop.js` › `grupoDe` não limpa `coopOf:` órfão (só `if (!g) return null`) | vazio/órfão "apagado na leitura" | **SOBREVIVE** (0/836) | **nenhum** |
| M8 | `coopJoin` aceita `body.groupId` quando não há código | I9 entrada só por código | **SOBREVIVE** (0/836) | **nenhum** — o teste só prova que código inventado dá 404 e que o diretório não lista |
| M9 | ações `coop*` movidas para `HEAVY_ACTIONS` | rate limit LIGHT | **SOBREVIVE** (0/836) | **nenhum** |
| M9b | `if (!gate.ok)` → `if (false)` (sem rate limit nenhum) | rate limit | morta (4) — mas por testes genéricos de `community`, não de coop | `functions/api/community*.test.js` |
| M10 | `coopCreate` sem o 409 `already in a group` | I8 um grupo por pessoa | **morta** (1) | "um grupo por pessoa" |
| M11 | `coopCheckin` sem `denyUnlessOwner` | escreve só sobre si | **morta** (2/836) | fora do arquivo coop (testes de auth de `community`) |
| M12 | `COOP_MAX_MEMBERS = 12` | teto 4 | **morta** (2) | "teto de 4: o quinto é recusado" |
| M13 | `coopCreate` sem re-sorteio de código em colisão | código não é roubado | **SOBREVIVE** (0/836) | **nenhum** |
| M14 | `account.js` › `handleDeleteConfirm` sem `coopLeave` | exclusão tira do grupo | **morta** (1) | `account.coopExport.qa2.test.js` (4) |
| M15 | `coopLeave` não apaga `coopCk:` | progresso de quem sai some | **morta** (1) | "quem sai não deixa o próprio progresso pesando" |

**Invariantes SEM teste que as trave (5):** I3 escrita só na própria chave (M2) · limpeza do órfão na leitura (M7b) · entrada só por código (M8, parcial) · coop na classe LIGHT (M9) · re-sorteio de colisão de código (M13).

## 2. Tabela de conformidade

Severidade: **A** alta (bug de comportamento hoje) · **M** média · **B** baixa · **P** só com o plano (teto 12 / WPG).

| # | Invariante / regra | Estado hoje (`arquivo` › SÍMBOLO) | Teste que trava | Sev. |
|---|---|---|---|---|
| 1 | Nenhuma resposta devolve saveId | ok — `community.js` › `vistaDoGrupo` (`ensurePid`) | `community.coop.test.js` (M1/M1b mortas) | — |
| 2 | Cada membro escreve só `coopCk:` no caminho quente | ok no código — `_coop.js` › `gravarCheckins`; `coopCheckin` não toca o blob | **nenhum** (M2 sobrevive) | M |
| 3 | 409 `join collision` | ok — `coopJoin` (releitura) | sim (M3) | — |
| 4 | Três chaves renovam juntas | ok — `_coop.js` › `gravarGrupo`, `renovarPrazos` | sim (M4/M4b/M4c) | — |
| 5 | Saída de um toque, sem penalidade | ok — `_coop.js` › `coopLeave`; UI sem diálogo | sim (M5/M5b + `CoopPanel.render.test.tsx` "um toque, SEM diálogo") | — |
| 6 | Meta encolhe ao sair | ok — `vistaDoGrupo` (`target = members.length × COOP_CHECKINS_POR_MEMBRO`) | sim (M6b) | — |
| 7 | Grupo vazio apagado | ok na saída (`coopLeave`); órfão limpo em `grupoDe` | saída sim (M7); leitura **não** (M7b) | B |
| 8 | `PLANO-COOP` §3.4: "grupo sem check-in por 4 semanas idem [apagado]" | **não implementado** — só o `COOP_TTL` de 120 d (~17 semanas) | nenhum | B |
| 9 | Entrada só por código | ok — `coopJoin` lê só `coopCodeKey` | parcial (M8 sobrevive) | B |
| 10 | `PLANO-COOP` §4.2: código "de uso único" | **diverge** — o código é reutilizável até o grupo morrer (`coopCodeKey` permanente, renovado) | nenhum | B (doc ou código; decidir) |
| 11 | Rate limit LIGHT | ok — `coop*` fora de `HEAVY_ACTIONS` | **nenhum** (M9 sobrevive) | B |
| 12 | `PLANO-COOP` §4.3: nome passa pelo tratamento do chat + `_redact.js` | **não** — `coopCreate` só `replace/trim/slice(0,24)` (D-1) | nenhum | M |
| 13 | "Hoje" do check-in = dia do jogador | **diverge** — `community.js` › `today()` = `new Date().toISOString().slice(0,10)` (UTC); o gate do cliente (`App.tsx` `metaDoDiaCumprida`, via `useProgressTracking` › `dailyGoalFor`) é do dia local. No BRT, "apareceu hoje" vira às 21h; quem cumpre a meta às 22h conta no dia UTC seguinte e, no dia seguinte até 21h, o botão some ("já apareceu") — um dia de presença perdido. `semanaDe` também é UTC (a semana vira domingo 21h). Mesma família do `playerDay.ts` (CLAUDE.md 🧮) | nenhum | **A** |
| 14 | Número por pessoa | ok — só `apareceuHoje` binário; `CoopPanel` mostra `progress de target` do grupo; `pct` só vira largura da barra | `community.coop.test.js` "presença binária" + `CoopPanel.render.test.tsx` | — |
| 15 | `stage` por membro no payload (D-3) | sai em `vistaDoGrupo` (`stage: perfil?.stage`), **não é renderizado** (`grep stage src/components/CoopPanel.tsx` → 0) | nenhum | P (LV-G10) |
| 16 | Presença nominal (`apareceuHoje` por membro, D-2) | ok com teto 4 (o plano permite ≤4) | teto travado (M12) | P |
| 17 | Push de cobrança | nenhum — `grep -rn "coop\|guild" workers/ functions/api/_pushCopy.js` → 0; `src/utils/notifications.ts` → 0 | **nenhum guard** (`guild.semPush.contract.test.js` é WPG-9, não existe) | B |
| 18 | Widget que cobra | Android não toca coop (`grep -rli "coop\|guild" android desktop` → 0); `widgetSemCobranca.contract.test.ts` verde | sim (widget) | — |
| 19 | Texto que culpa | nada — `falta/faltou/ausente` só em comentário (`CoopPanel.tsx` linhas de comentário); copy diz "ainda não hoje"/"not yet today" | `CoopPanel.render.test.tsx` | — |
| 20 | Copy só PT/só EN | 23 ternários `isPt ?` no `CoopPanel`, nenhum `aria-label` só PT; `areaNpcVoice.ts` (`arena:guilda`/`hall:guilda`) e `areaSheetCopy.ts` (`guilda`) com par PT/EN | `CoopPanel.render.test.tsx` "fala os dois idiomas" | — |
| 21 | Vocabulário | `narrativa.contract.test.ts` verde. Nota: a folha se chama **Guilda/Guild** e o painel dentro dela diz **grupo/group** (6+ strings) — incoerência de nome, não veto | narrativa | B |
| 22 | Grupo em Estatísticas / Home / relatórios | **ausente** — nenhum consumidor além de `CoopPanel`/`GuildSheet`/`LibraryPage`/`AreaView` | — | — (esperado; plano: WPG-12) |
| 23 | Telemetria de coop | **ausente** — `grep -i "coop\|guild" src/utils/telemetry.ts functions/api/metrics.js` → 0 (D-5) | — | P |
| 24 | Exclusão apaga `coopOf`/`coopCk` e tira do blob | ok — `account.js` › `handleDeleteConfirm` passo 3b → `_coop.js` › `coopLeave`; `coopCode:` só some com o grupo vazio (correto: é do grupo) | `account.coopExport.qa2.test.js` (M14) | — |
| 25 | Exportação traz o que é do titular | só `coopGroupId` + nomes de chave (`account.js` › `collect`); os dias de `coopCk:` não vão (D-4) | nenhum | B (portabilidade) |
| 26 | Overlay desktop / widget Android tocam coop | não — 0 ocorrências em `desktop/` e `android/` | — | — (paridade: *não se aplica*) |
| 27 | Nada de coop no `GameState` | ok — 0 em `GameStateContext.tsx`, `src/types/*.ts`, `storageKeys.ts`; ponteiro só em `coopOf:` | **nenhum guard** (`guildNoSave.contract.test.ts` é WPG-8) | B |
| 28 | Aba "Grupo" da `LibraryPage` | **inalcançável**: o único mount (`App.tsx` › `hallContent`) passa `view`, que esconde as abas; o `CoopPanel` só é alcançável pela `GuildSheet` | — | B (código morto) |

## 3. Paridade (as cinco colunas)

| web | APK/widget | overlay | EN | a11y |
|---|---|---|---|---|
| chega (via `GuildSheet`) | chega (APK = URL de produção); widget *não se aplica* | *não se aplica* (controle remoto de cuidado, sem coop) | chega igual (par PT/EN) | barra `role="progressbar"` com `aria-label` PT/EN; meta batida em `role="status"` com 🌿 `aria-hidden`; sair sem diálogo |

## 4. Divergências código × manual (afirmações falsas)

1. **`02-REGRAS-DE-NEGOCIO.md` §56** — "por membro, `apareceuHoje: boolean` e **mais nada**": falso; `vistaDoGrupo` devolve também `id` (pid), `name`, `stage`, `euMesmo`.
2. **02 §56 › Dono** — "`functions/api/community.js` (todas as regras…)": falso desde `592e2c14`; estado, prazos e `coopLeave` moram em `functions/api/_coop.js`.
3. **02 §56 › Onde a UI mostra** — "`LibraryPage.tsx` (abas Todos / Amigos / **Coop**)": falso duas vezes — o rótulo é "Grupo"/"Group", e a aba é inalcançável (`hallContent` sempre passa `view`); o caminho real é `AreaView` → `GuildSheet` → `CoopPanel` (Arena lote `guilda` e Hall lote `guilda`), que o §56 não cita. A palavra "Guilda" não aparece em 02 nem em 03.
4. **02 §56 / `PLANO-COOP.md` §4** — "Tudo abaixo tem teste": falso para o tratamento de nome (item 3, não implementado) e o rate limit LIGHT (item 5, M9 sobrevive).
5. **`03-FLUXO-DE-TELAS.md` §4.22** — "`CoopPanel`: montado dentro da página [Biblioteca]": falso na prática (ver 3); a tela da Guilda não tem seção própria em 03.
6. **`08-INTEGRACOES-E-DEPLOY.md` §2.11** — "17 ações" confere (`grep -o "action === '…'" | sort -u | wc -l` → 17); nada falso encontrado além de não citar a Guilda.
7. **`06-REFERENCIA/api-workers.md`** › `community.js` › Avisos — "O que sai … é só um booleano por membro … e o progresso agregado": falso (mesmos campos do item 1). `wc -l` 908/182 confere.
8. **`06-REFERENCIA/components.md`** › `CoopPanel.tsx` › Chamado por — "`src/components/LibraryPage.tsx`": incompleto/enganoso; hoje é também (e efetivamente só) `guild/GuildSheet.tsx`.
9. **`PLANO-COOP.md` §3.4** ("grupo sem check-in por 4 semanas é apagado") e §4.2 ("código de uso único") — o código não faz nenhum dos dois. Regra viva sem implementação: ou o código ou a linha tem de mudar.

## 5. Dívidas D-1..D-5 (`docs/reviews/guilda/05-servidor.md` §0)

| # | Ainda verdadeira? | Evidência | Bug HOJE ou só com o plano |
|---|---|---|---|
| D-1 nome sem tratamento | **sim** | `community.js` › `coopCreate`: `String(body.name ?? '').replace(/\s+/g,' ').trim().slice(0, 24)` | **Bug hoje** (promessa do `PLANO-COOP` §4.3 não cumprida; leitores = só quem tem o código, severidade M) |
| D-2 presença nominal >4 | sim (latente) | `vistaDoGrupo` › `apareceuHoje` por membro; teto `COOP_MAX_MEMBERS = 4` | **Só com o plano** (vira LV-G2 no dia do teto 12) |
| D-3 `stage` na vista | **sim** | `vistaDoGrupo` › `stage: perfil?.stage ?? null`; não renderizado | **Só com o plano** (hoje: payload para ≤3 convidados, não exibido) |
| D-4 export sem progresso próprio | **sim** | `account.js` › `collect` devolve só `coopGroupId`; `coopCk:` listado por nome, não por conteúdo | Bug hoje **baixo** (portabilidade de dado do titular); cresce com os fios cumulativos |
| D-5 sem telemetria | **sim** | 0 ocorrências em `telemetry.ts` / `metrics.js` | **Só com o plano** (lacuna de medição, não defeito) |

## 6. A divergência mais cara hoje

**O "hoje" do coop é UTC; o do resto do jogo é o dia do jogador** (linha 13). `functions/api/community.js` › `today()` e `_coop.js` › `semanaDe` usam UTC, enquanto o gate do botão vem de `dailyGoalFor` no dia local. Prova:

```
grep -n "const today = " functions/api/community.js
# 69:const today = () => new Date().toISOString().slice(0, 10);
grep -n "playerDayKey\|playerDayTz" functions/api/community.js functions/api/_coop.js   # → vazio
```

Teste que falta: `community.coop.test.js` com relógio fixo em 22:30 BRT (01:30Z) + 20:00 BRT do dia seguinte (23:00Z), exigindo 2 check-ins. Handoff: `staff-backend` (o servidor não sabe o `playerDayTz`; a saída é o cliente mandar o `dayKey` do jogador, validado como ±1 dia do UTC), `soulmon-guarda-linha-vermelha` (é regra de presença).
