# QA Rodada 1 (saúde técnica) — 15/10/2026

Base: origin/main @ 83117b6c2 (PR #357). Worktree E:/soulmon-qa1, branch qa/rodada-1 (sem commits; nenhum PR aberto).

## Bugs corrigidos
Nenhum. Nada falhou; nenhum defeito claro encontrado dentro do escopo. Sem PR (conforme a regra).

## Falhas conhecidas não corrigidas e por quê
Nenhuma falha de teste/tsc/build. Único achado "de saúde": `npm audit` (ver Obs. 1), só reportado por ordem do dono.

## Observações para o dono (NÃO alteradas)
1. [média] `npm audit --omit=dev`: 5 high, todas na cadeia @grpc/grpc-js <=1.13.5 -> @firebase/firestore -> firebase -> @capacitor-firebase/authentication (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4). O "fix" proposto (`--force`, firebase@9.14.0) é downgrade quebrante; não aplicado. O app só usa Auth (Firestore não é usado em runtime, a verificar), então o risco prático tende a baixo.
2. [média] `SAVE_SCHEMA_VERSION`/`schemaVersion` NÃO existe no código (só em comentário, src/contexts/GameStateContext.tsx:562; ADR-006 já diz "aceita != implementada"). Migração hoje é só `??` + sanitizers por campo. Os campos beta-2 (hungerPenalty :1276, dailyMissions :1325, missionsClaimed :1326, firstTimes :1327, buildingIntrosSeen :1329, mapTutorialSeen :1330) têm sanitizer e semeadura para save antigo; fuzz existente (GameStateContext.hydrate.fuzz2.qa.test.tsx, 98 campos x valores hostis; legacySave.test.tsx) passa. Risco: um save de versão futura não é detectado.
3. [baixa] src/components/nav/AreaView.tsx:386 — fallback `new Date().toISOString().slice(0,10)` usa dia UTC (no Brasil vira "amanhã" após 21h). Hoje inalcançável em produção: App.tsx:6932 sempre passa `todayKey` via `playerDayIso`. Só pega se alguém montar AreaView sem `play.todayKey`.
4. [baixa] Fuso: Brasil não tem horário de verão; para cobrir DST rodei também `src/utils` em America/New_York e Pacific/Auckland: verde.
5. [baixa] Falso positivo descartado: ids "duplicados" em TalentTree.tsx (pvp/pve, dois mapas diferentes), focoTecnicas.ts (tipo de união + item), personality/questions.ts (opções a-d por pergunta). Nenhum id duplicado real em tabelas varridas por regex (src/**, `id:`); chaves de STORAGE_KEYS: 72, sem valores duplicados; nenhum uso de localStorage com literal fora de storageKeys.
6. [baixa] 64 `console.error` em src/functions/workers e vários `.catch(() => null)` em functions/api (billing, metrics, crash, community); são idiomáticos (parse de body/KV opcional), nenhum `catch {}` vazio. Não auditei cada um por semântica.
7. [baixa] Servidor sem `any` em functions/ (0 ocorrências em .ts; a pasta é JS).
8. [info] i18n: src/translations/pt.ts e en.ts, 109 chaves cada, diferença vazia nos dois sentidos. Contratos i18n do vitest verdes.
9. [info] PWA/Android: CSP (hashes) conferida pelo src/security/csp.test.ts contra index.html fonte e dist recém-buildado: verde (14 arquivos/145 testes em src/security + tests). sw.js CACHE_VERSION='v199' (sw tests verdes); offline.html e offline.js existem em public/; capacitor.config.json: server.url https://soulmon.mateus-sprnd.workers.dev, cleartext false, errorPath offline.html; Manifest: INTERNET, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, ACTIVITY_RECOGNITION, RECORD_AUDIO; versionCode 18 / versionName 1.3.0-beta1 = package.json 1.3.0-beta1. Observação: o fallback offline de navegação do sw.js (linha 106) devolve `/index.html` em cache, não `offline.html` (o offline.html só serve ao errorPath do Capacitor); parece intencional, só registro.
10. [info] Limite do que verifiquei: build não foi instalado em aparelho; Android/Capacitor foram lidos, não executados; Registro §40-§63 não foi relido linha a linha porque nenhuma mudança foi proposta.

## Comandos executados e saída final
- `npx tsc --noEmit` -> exit 0
- `npx tsc -p tsconfig.server.json --noEmit` -> exit 0
- `npx tsc -p desktop/tsconfig.json --noEmit` -> exit 0
- `TZ=UTC npx vitest run --maxWorkers=50%`:
  Test Files 777 passed (777) | Tests 9703 passed | 1 expected fail | 2 skipped | 4 todo (9710) | 514 s | exit 0
- `TZ=America/Sao_Paulo npx vitest run --maxWorkers=50%`:
  Test Files 777 passed (777) | Tests 9703 passed | 1 expected fail | 2 skipped | 4 todo (9710) | 520 s | exit 0
- `TZ=America/New_York` e `TZ=Pacific/Auckland` `vitest run src/utils`: 320 files, 4087 passed, 4 todo, cada.
- `npm run gen:chat-kb`: "214 trechos -> functions/api/_chatKnowledge.data.js", `git status` limpo (sem diff).
- `npm run build`: exit 0 (vite build + webp 2123/2123 + wrangler "Compiled Worker successfully"). dist/ é rastreado e o build o altera; restaurado com `git checkout -- dist` + `git clean` (nada commitado).
- `npm audit --omit=dev`: 5 high (Obs. 1). Logs brutos: E:/tmp/q1/*.log.
- 2 skipped / 4 todo / 1 expected fail já existem no main (não toquei).
