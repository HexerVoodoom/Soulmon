# Beta12 · QA alpha (12/11/2026)

Branch `feat/beta12` (HEAD 186e27cc2). Só leitura + execução; nenhum código editado. Prova por execução: saída bruta em `E:/tmp/q/run1.log` (os 25 arquivos de teste da beta12) e `E:/tmp/q/full.log` (suíte inteira).

## 1. Execução

```
npx vitest run <25 arquivos tocados pela beta12> --reporter=verbose
 Test Files  25 passed (25)
      Tests  453 passed (453)      (0 skip, 0 todo; 192 deles são o fuzz de hidratação)
npx tsc --noEmit -p .            -> exit 0, sem saída
npx vitest run (suíte inteira)   -> ver §1b
```

### 1b. Suíte inteira
```
 Test Files  3 failed | 1370 passed | 1 skipped (1374)
      Tests  3 failed | 16176 passed | 1 expected fail | 11 skipped | 4 todo (16195)
```
As 3 falhas, nenhuma na área da beta12; reexecutadas isoladas 2x: `Test Files 3 passed (3) / Tests 52 passed (52)` nas duas.
- `src/deploy/appUrl.contract.test.ts`: durante a minha corrida, `capacitor.config.json` apontava para `https://beta12-soulmon.mateus-sprnd.workers.dev` (alguém, provavelmente o build do AAB de teste, trocou a URL do app; ao reexecutar já estava de volta em `soulmon.mateus-sprnd.workers.dev` e `git status` limpo). NÃO é defeito do código, mas **RISCO DE PROCESSO**: o build do AAB de prévia muda arquivo versionado; conferir que `capacitor.config.json` e `android/app/src/main/assets/capacitor.config.json` voltam à URL de produção antes de commitar/mergear (este teste é a rede de segurança).
- `src/utils/match3Combat.test.ts` (balanço) e `src/components/hex/HexsmithSheet.render.test.tsx`: timeout de 15 s / "render quebrou" sob a carga da suíte inteira (1374 arquivos, node_modules compartilhado); passam isolados. RUÍDO por carga; Hexsmith veio do #836 (fora da beta12). Não "maquiei" nada.
Obs.: a corrida inteira passou 3 em ~16 mil; pelas regras, 1 passe completo foi feito e as 3 falhas foram explicadas e reproduzidas verdes isoladas.

## 2. Tabela critério → teste → resultado

| ID | Critério | Teste que prova | Resultado | Evidência / lacuna |
|---|---|---|---|---|
| D-01 | moldura só por web, cache em disco, fallback embutida | `src/plugins/widgetBeta12.contract.test.ts` (manifesto, sha256/bytes/PNG, dist igual, headers, host/https, renderer sem rede) + `WidgetFrameStoreTest.kt` (JUnit) | 16/16 verdes (TS). Kotlin NÃO rodado aqui | Os testes TS são de CONTRATO (leem arquivo/regex). A lógica de sync/cache/fallback é Kotlin: só o CI ou o aparelho prova. Conferi à mão: 20 hashes do manifesto = arquivos, em `public/` e `dist/` (0 divergências) |
| D-02 | widget sem moldura vertical, fala abaixo | `widgetBeta12.contract` (clear: 1 célula, teto 4, layout vertical) + `WidgetAdaptiveTest.kt` | 16/16 verdes; Kotlin não rodado | Só se prova em launcher real (1x2, 1x3, 1x4, 2x2) |
| D-03 | rótulo "Cage" pt/en | `widgetBeta12.contract` "rótulos" | verde | grep nas strings.xml; aparência só no aparelho |
| D-04 | Companheiro 3ª opção, 2x2/3x3, receivers antigos ficam | `widgetBeta12.contract` "NENHUM receiver antigo saiu" + diff do AndroidManifest (só linhas adicionadas, 0 removidas) | verde | Seletor do app com o 3º item: sem teste de render (nenhum teste cobre o seletor). Preview é placeholder |
| D-05 | KeepAwake nativo detectado por `keepAwake.ts` | `widgetBeta12.contract` (2 testes: plugin Kotlin + hook usa `isPluginAvailable`) | verde | SEM teste de comportamento do hook (mock de `Capacitor`). Só contrato textual |
| D-06 | alarme exato com timestamp ms e fallback | `src/utils/focusNotify.test.ts` (5) + `billingPbl8.contract.test.ts` (9, guard da permissão) | 14/14 verdes | Lado JS coberto; Kotlin (`scheduleAtInternal`, `canExact`, BootReceiver) sem teste algum |
| D-07 | versionCode 32 / 1.3.0-beta12 | `widgetBeta12.contract` "beta12 = versionCode 32" | verde | |
| D-08 | Big Five complementar; sem teste = neutro; tipo invisível | `soulmonCharacter.test.ts` (23), `personality.test.ts` (15) | 38/38 verdes | Inclui alcançabilidade das 7 vozes e "integração com o teste de verdade" |
| D-09 | falas diretas; toggle (padrão complementar); veto prevalece em SIMILAR; chat recebe caráter | `petVoice.carater.test.ts` (14), `voiceModeSettings.contract.test.ts` (4), `functions/api/chat.personalidade.test.js` (7), `soulmonCharacter.test.ts` bloco "veto ... DOIS modos" | 25/25 verdes | Veto em SIMILAR: provado em 3 dificuldades x 2 modos x 6 extremos. Ver edge E-03 |
| D-10 | 20/dia no grátis; depois fala padrão | `chat.personalidade.test.js` (21ª = 200 + fala, sem chamar provedor; 20ª passa), `_aiGuard.tierCap.qa2.test.js` (6), `chat.freeTier.test.js` (6) | 19/19 verdes | Ver BUG-02 (pago também é 20) e BUG-03 (dia UTC) |
| D-11 | fichas de NPC; ultra só poucos; nada visível; falas reescritas; tabela | `src/data/npcFichas.contract.test.tsx` (18) + `docs/beta12/TABELA-NPCS.md` | 18/18 verdes | Provas fortes: ninguém importa `npcFichas`; falas não citam classe/estágio/arquétipo; chave sem ficha reprova. Conferi no dist: nada de ficha |
| D-12 | meia tela, ~20 msgs, fechar à esq., mic/ações/safety | `ChatBox.painel.render.test.tsx` (10), `ui/voltarFechar.contract.test.ts` (5) | 15/15 verdes | Teclado real (`visualViewport`) só no aparelho |
| D-13 | tela cheia, sprite sup. esq. + fechar, volta sem perder sessão | `ChatBox.painel.render.test.tsx` | verde | idem |
| D-14 | G1–G8 balões dourados | `balaoDourado.test.ts` (17), `CompanionHUD.balaoDourado.render.test.tsx` (7), `balaoDouradoETarefaLink.contract.test.ts` (15) | 39/39 verdes | G8 PARCIAL: falas fixas, sem variação por personalidade (declarado em DECISOES-gj). G4 (`useGroveAtaque`, rede/intervalo 60 s) sem teste unitário do hook |
| D-15 | J tarefas linkadas A1–A12 | `tarefaLink.test.ts` (19), `catalogResources.contract.test.ts` (4), `NoticeToast.taskTag.render.test.tsx` (5), `DailyRituals.recurso.render.test.tsx` (10), `CreateModal.habito.render.test.tsx` (5), `GameStateContext.hydrate.fuzz2.qa.test.tsx` (192) | 235/235 verdes | `autoCheck` do App.tsx (ref + toggle) NÃO tem teste de integração: só o módulo puro. Ver edge E-02 |
| D-16 | tabela Soulmons+NPCs E2.6 1–12 | `tests/tabelaSoulmonsNpcs.test.ts` (22) | 22/22 verdes | Cola de DOM do HTML não testada (jsdom quebrado); a frente diz ter conferido no navegador |
| D-17 | revisão PT | fora do escopo (tarefa dom 15/11) | n/a | |
| D-18 | assets só listados | fora dos testes; ver `docs/ASSETS-A-GERAR.md` | n/a | Preview do Companheiro = placeholder |
| D-19 | entrega | `orcamentoDeBytes.contract.test.ts` (9), `index.css.contract.test.ts` (10) | 19/19 verdes | CI/AAB: não é daqui |

Critério SEM teste de comportamento: D-04 (seletor), D-05 (hook), todo o Kotlin de D-01/02/04/06 (só JUnit no CI; a frente A admite que não compilou o Kotlin dependente de Android).

## 3. Edge cases (caça por classe)

| # | Área | Cenário | Veredito | Arquivo:linha |
|---|---|---|---|---|
| E-01 | Virada de dia nos balões | Dispensado às 23:59, relê às 00:01: `diaBalao` recalcula no render e a chave muda; `dispensar` descarta chaves de outros dias; chave de ontem não vale hoje (teste 13 e 27) | OK | `balaoDourado.ts:36-49`, `App.tsx:4710-4717` |
| E-01b | idem | `diaBalao` só é recalculado em render; Home parada atravessando a meia-noite mantém o balão dispensado até o próximo render | RUÍDO | `App.tsx:4710` |
| E-02 | Tarefa automática, idempotência | Chave `<dia>|<id>` gravada na ref ANTES do toggle; segundo disparo no mesmo tick não refaz; recarregar não refaz; ontem não bloqueia hoje (testes `tarefaLink` 54-65) | OK | `App.tsx:6829-6845`, `tarefaLink.ts:80-96` |
| E-02b | idem | `feitaHoje` usa `now.toDateString()` (dia do aparelho) enquanto a chave usa `playerDayIso` (dia do jogador). Com fuso do jogador diferente do aparelho, entre as duas viradas o hábito pode deixar de ser marcado, ou ser marcado de novo | FIXÁVEL (baixo) | `tarefaLink.ts:138` vs `:158` |
| E-02c | idem | A chave é gravada antes do toggle; se o toggle retorna cedo (hábito sumiu), a chave do dia fica queimada | RUÍDO | `App.tsx:6841-6844`, `:3262-3266` |
| E-03 | Veto em SIMILAR | Ansiedade/perfeccionismo/cansaço nunca dão `direto/animado/mentor`; também suaviza traços enviados ao chat; testado por construção (`pickArchetype(..., SAFE)`) e por grade | OK | `soulmonCharacter.ts:178-194` |
| E-03b | idem | Grade do teste só varia UMA dimensão por vez; a garantia vem da construção (só `SAFE` entra no pick), então o buraco é teórico | RUÍDO | `soulmonCharacter.test.ts:105-111` |
| E-04 | Limite 20/dia, 21ª | 200 + `limited:true` + fala padrão, não chama provedor; 20ª passa; sem entitlement = demo = 20 | OK | `chat.js:662-665`, `_aiGuard.js:399-401` |
| E-04b | Tier pago "não limitado" | NÃO: `perAccountByTier.paid = 20`, igual ao demo. O pago (e o admin x multiplicador) também chega à fala "tô de voz curtinha". Se o dono entende "20 só no grátis", não há diferenciação nenhuma entre grátis e pago | VER BUG-02 | `_aiGuard.js:102` |
| E-04c | Virada do dia do limite | Contador usa dia UTC: no Brasil o limite zera às 21h, não à meia-noite | VER BUG-03 | `_aiGuard.js:132,333` |
| E-05 | Chat teclado/maximizar/fechar | `host` do input é movido (portal estável), `useState` das mensagens vive no `ChatBox` montado: fechar/maximizar não apaga a sessão (teste render). Escape fecha; `fecharChat` faz blur | OK (jsdom) | `ChatBox.tsx:84-118`, `ChatPanel.tsx:99-112` |
| E-05b | Teclado aberto | Meia tela = 50% da área VISÍVEL (já sem teclado): com teclado de ~40% a tela, painel fica com ~30% da tela para cabeçalho + lista + campo | SÓ NO APARELHO | `ChatPanel.tsx:92-94` |
| E-05c | Botão voltar do Android com painel aberto | Nenhum handler de back/popstate no painel: o voltar pode sair da tela em vez de fechar a meia tela | SÓ NO APARELHO (provável fixável) | `ChatBox.tsx` (sem `backButton`/`popstate`); `ChatPanel.tsx:99` só trata Escape |
| E-06 | Fichas de NPC nunca visíveis | Teste de AST: nenhum `.tsx`/App importa `npcFichas`; `grep` no `dist/assets/*.js` por "enigmatico": 0; tabela/CSV só em `docs/`, fora de `public/` e `dist/` | OK | `npcFichas.contract.test.tsx:194` |
| E-07 | Receivers antigos no AndroidManifest | `git diff` contra a base: só linhas `+` (Companheiro + `SCHEDULE_EXACT_ALARM`), 0 removidas | OK | `AndroidManifest.xml:92-103,218-221` |
| E-08 | Molduras remotas, manifesto inválido | JSON inválido ou HTML do SPA (200) → `parseManifest` null → IOException → FAILED, cache intacto; sha/bytes/dimensão errados → descartado; schema/enabled/geometria ruins → apaga cache e volta às embutidas; manifesto de versão menor é ignorado; redirect não seguido; teto 64 KB/256 KB | OK (por leitura) | `WidgetFramesSync.kt:53-98,115-136`, `WidgetFrameStore.kt:149-175` |
| E-08b | Kill-switch | `enabled:false` só vale se a `version` for >= à guardada; manifesto desligado com versão MENOR é ignorado em silêncio. Quem desliga tem que subir a versão | RUÍDO (documentar) | `WidgetFramesSync.kt:64-68` |
| E-09 | Alarme exato sem permissão | `canExact` false (ou `SecurityException`) → `setAndAllowWhileIdle` e resolve `{exact:false}`; método ausente (APK antigo) ou rejeitado → `scheduleAlarm` "HH:mm" | OK (por leitura) | `SoulmonAlarmPlugin.kt:118-137`, `focusNotify.ts:38-41` |
| E-09b | Corrida | Se o nativo rejeita "atMs must be in the future" (o instante passou entre JS e nativo), o `.catch(legacy)` agenda "HH:mm" que o `scheduleAlarmInternal` empurra para o dia seguinte: aviso velho 24 h depois | RUÍDO (janela de ms) | `focusNotify.ts:40`, `SoulmonAlarmPlugin.kt:~36-40,88-100` |
| E-09c | Reboot | Alarme com `atMs` vencido é descartado; no futuro é refeito | OK (por leitura) | `SoulmonAlarmPlugin.kt:181-194` |
| E-10 | KeepAwake nativo | Se `keepAwake()` rejeita (activity nula), não cai no Wake Lock da web; só engole o erro | RUÍDO | `keepAwake.ts:39-43` |

## 4. Bugs

Fatal (bloqueia merge): **nenhum encontrado**.

Fixável:
- **BUG-02 (decisão do dono, não código):** `AI_LIMITS.chat.perAccountByTier = { demo: 20, paid: 20 }` (`functions/api/_aiGuard.js:102`). Pedido de QA dizia "tier pago não limitado"; o backlog §F 3 diz "20 no plano grátis" e nada sobre o pago. Hoje o pago também é cortado na 21ª com a fala padrão. Confirmar a intenção; se pago = ilimitado/maior, é uma linha e um teste (o teste `_aiGuard.tierCap.qa2` "paid: 20 chamadas passam, a 21ª é 429" hoje trava o contrário).
- **BUG-03:** o dia do limite é UTC (`day()` em `_aiGuard.js:132`): para o jogador em UTC-3 o limite de 20 zera às 21h. O próprio `playerDay.ts` documenta esse tipo de armadilha. O servidor não conhece o fuso do jogador; opção barata: aceitar o dia do jogador enviado pelo cliente (validado contra ±1 dia do UTC) ou documentar. Regressão sugerida: `chat 20 msgs às 20:59 BRT e 21ª às 21:01 BRT`.
- **BUG-04 (baixo):** `feitaHoje` (dia do aparelho) x chave (dia do jogador) em `tarefaLink.ts:138/158`; ver E-02b. Regressão sugerida: `atividadesParaAutoCheck` com `tz` diferente do fuso do runner, antes e depois da virada de cada um.
- **BUG-05 (provável):** painel de chat sem tratamento do botão voltar do Android (E-05c). Confirmar no aparelho; se confirmado, regressão = teste do hook de back/popstate.

Ruído: E-01b, E-02c, E-03b, E-08b, E-09b, E-10. Também: `GameStateContext.hydrate.fuzz2` descreve "98 campos" no nome, enquanto `DECISOES-gj` fala em contagem 185→187 (não é falha; só conferir que o número citado no doc é o do teste).

## 5. Só se prova no aparelho
1. Kotlin inteiro: `WidgetRenderer`, `WidgetFramesSync`, plugins (`KeepAwake`, `SoulmonAlarm`), Companheiro 2x2/3x3, widget sem moldura 1x2/1x3/1x4/2x2 em mais de um launcher, cache de molduras com rede real/ruim, `./gradlew testDebugUnitTest` (JUnit só no CI).
2. `adb shell dumpsys alarm | grep foco` (alarme exato) e o fluxo sem a permissão "Alarmes e lembretes"; reboot com alarme pendente.
3. Flag de tela acesa durante o Foco (e que solta ao fechar).
4. Chat com teclado real (altura útil do painel), maximizar/fechar mantendo sessão, botão voltar, microfone gravando durante troca de modo.
5. Balões dourados: toque Bosque/Fenda/achado em save real; virada de dia com app aberto à meia-noite.
6. Declaração de `SCHEDULE_EXACT_ALARM` na Play Console (risco de recusa do AAB).

## 6. Prontidão
- Rollback: web é reversível por redeploy; molduras remotas têm kill-switch (`enabled:false` com versão maior); nativo só volta com outro AAB (versionCode 32).
- Observabilidade: o sync de molduras só loga em `Log.w` local; nada chega ao servidor. Quebrou às 3 da manhã = sem sinal remoto.
- Tech-debt aceito: balões G8 sem variação por personalidade; consentimento de passos (`stepsConsentCopy`) sem revisão; cenários fora do manifesto remoto; preview do Companheiro placeholder; fala do servidor só PT/EN fixa.
