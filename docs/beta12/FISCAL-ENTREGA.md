# Beta12 · Fiscal de entrega (12/11/2026)

Placar: 14 de 19 FEITO, 4 PARCIAL/SÓ-APARELHO, 1 delegado (D-17); 0 NÃO FEITO. Extras: 0 relevantes.
Base: HEAD `ae54c9c95` (feat/beta12), `git status` limpo. Só leitura + execução.

## Execução (esta conferência)
- `npx vitest run <25 arquivos de teste tocados>`: Test Files 25 passed (25), Tests 459 passed (459).
- `npx vitest run functions/api/chat.personalidade.test.js _aiGuard.tierCap.qa2.test.js chat.freeTier.test.js`: 3 passed, 22 tests.
- `npx tsc --noEmit -p .`: exit 0.
- Suíte inteira NÃO reexecutada aqui; última (QA-ALPHA §1b, commit anterior): 3 falhas de ruído/carga, verdes isoladas.
- Chat pago 100/dia: `functions/api/_aiGuard.js:102` = `{ demo: 20, paid: 100 }`; teste `_aiGuard.tierCap.qa2` "paid: 100 passam, a 101ª é 429" verde. Fecha o BUG-02 do QA.
- Preview Worker `https://beta12-soulmon.mateus-sprnd.workers.dev/` responde HTTP 200.

## Itens
| ID | Status | Evidência |
|---|---|---|
| D-01 molduras remotas | PARCIAL / SÓ-APARELHO | `widgetBeta12.contract.test.ts` verde; `WidgetFramesSync.kt`, `WidgetFrameStore.kt` + `WidgetFrameStoreTest.kt` no diff. Sync/cache/fallback é Kotlin: JUnit só no CI, nada rodado local |
| D-02 widget sem moldura vertical | SÓ-APARELHO | `widget_soulmon_clear_vertical.xml`, `WidgetAdaptive.kt(+Test)` no diff; contrato verde; launcher real não testado |
| D-03 rótulo Cage pt/en | FEITO (texto) | `values/strings.xml` e `values-pt/strings.xml` no diff; teste "rótulos" verde |
| D-04 Companheiro | PARCIAL | Provider + layout + `soulmon_widget_companion_info.xml` + manifest só com linhas `+`; preview é placeholder (ASSETS-A-GERAR:1196); 2x2/3x3 e seletor sem teste de comportamento |
| D-05 KeepAwake nativo | FEITO (contrato) | `KeepAwakePlugin.kt`, `KeepAwakePlugin.ts`, `keepAwake.ts` no diff; só teste textual; tela acesa só no aparelho |
| D-06 alarme exato ms | FEITO (lado JS) | `focusNotify.test.ts` + `billingPbl8.contract.test.ts` verdes; Kotlin `SoulmonAlarmPlugin.kt` sem teste; `dumpsys alarm` só no aparelho |
| D-07 versão | FEITO | `android/app/build.gradle:25-26` versionCode 32 / "1.3.0-beta12"; `package.json` 1.3.0-beta12 |
| D-08 Big Five | FEITO | `soulmonCharacter.ts` + `.test.ts` (23), `personality.test.ts` verdes |
| D-09 falas/toggle/veto/chat | FEITO | `petVoice.carater.test.ts`, `voiceModeSettings.contract.test.ts`, `chat.personalidade.test.js` verdes; toggle em `SettingsPage.tsx` no diff |
| D-10 limite chat | FEITO | grátis 20 (21ª = fala padrão sem chamar provedor), pago 100 (decisão do dono pós-registro); testes verdes. Pendência técnica baixa: dia do limite é UTC (BUG-03, QA) | — **CORRIGIDO em b6dc0e86c** (dia local via X-Player-Day, limitado a UTC-12h..+14h).
| D-11 fichas NPC | FEITO | `npcFichas.ts` + contrato (18) verde; ninguém importa a ficha; `TABELA-NPCS.md` + CSV + JSON em docs/beta12 |
| D-12 chat meia tela | FEITO (jsdom) | `ChatBox.painel.render.test.tsx` verde; teclado real e botão voltar do Android (BUG-05 provável) só no aparelho |
| D-13 tela cheia | FEITO (jsdom) | idem; volta sem perder sessão testado |
| D-14 balões dourados | PARCIAL | `balaoDourado.ts` + testes 39 verdes; G8 sem variação por personalidade (declarado em DECISOES-gj); G4 `useGroveAtaque` sem teste unitário |
| D-15 tarefas linkadas | FEITO | `tarefaLink.ts` + testes (235 com o fuzz) verdes; lacuna: `autoCheck` do App.tsx sem integração; BUG-04 (dia aparelho x jogador) baixo |
| D-16 tabela E2 | PARCIAL (publicação) | `tests/tabelaSoulmonsNpcs.test.ts` 22 verde; `docs/beta12/tabela-soulmons-npcs.html` existe (561 KB); Artifact privado NÃO publicado |
| D-17 revisão PT | FORA DO ESCOPO | delegado à tarefa agendada dom 15/11 sobre a main; depois merge da main na branch |
| D-18 assets | FEITO | `docs/ASSETS-A-GERAR.md` +4 linhas (prévia do Companheiro etc.), placeholders no lugar |
| D-19 entrega | PARCIAL | AAB unsigned existe (152.657.422 B, sem META-INF de assinatura, `server.url` de produção); APK prévia existe (158.563.367 B, `server.url` = beta12 worker); PR #851 draft; CI do commit ae54c9c95 AINDA PENDENTE (jobs em andamento), o 10/10 verde era do commit anterior; QA em QA-ALPHA.md; este fiscal |

## Pendências
1. Esperar CI do `ae54c9c95` (`gh pr checks 851`) ficar verde antes de declarar D-19.
2. Publicar o Artifact privado da tabela (D-16) e anotar o link.
3. Aparelho (dono, via APK prévia): D-01, D-02, D-04 (2x2/3x3, seletor), D-05, D-06, D-12/13 (teclado, botão voltar), D-14 toque real; JUnit Kotlin só no CI (`./gradlew testDebugUnitTest`).
4. Antes do merge: `capacitor.config.json` e `android/app/src/main/assets/capacitor.config.json` na URL de produção (hoje OK, git limpo; `appUrl.contract.test` é a rede). AAB assinado é passo do dono (`ASSINAR-AAB.ps1`).
5. Decisões do dono abertas: BUG-03 (dia UTC do limite, zera 21h BRT); declaração `SCHEDULE_EXACT_ALARM` na Play Console. — **CORRIGIDO em b6dc0e86c** (dia local via X-Player-Day, limitado a UTC-12h..+14h).
6. Aceitos como dívida: G8 sem variação por personalidade, prévia do Companheiro placeholder, sem observabilidade remota do sync de molduras.
