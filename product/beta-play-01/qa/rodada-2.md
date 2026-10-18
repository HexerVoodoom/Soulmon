# QA Rodada 2 (bugs funcionais nas features novas) — 15/10/2026

Base: origin/main @ 83117b6c2. Worktree E:/soulmon-qa2. Branch `qa/rodada-2-beta` (o nome `qa/rodada-2` já existe no remoto, de setembro; não reutilizado). PR #358.

## Bugs corrigidos (menor diff, regressão que FALHAVA antes)
1. Watchdog de 8 s da fila de modais nunca disparava com o App re-renderizando.
   - Causa: `LoadWatchdog` (src/components/PresentationSlot.tsx) tinha `onTimeout` nas deps do `useEffect`; o App passa `() => presentation.fail(id)` inline (identidade nova a cada render) e cada render reiniciava o timer. Chunk lento + App re-renderizando = esqueleto preso, item da fila não é pulado.
   - Correção: `onTimeout` em ref, efeito com deps `[]`.
   - Teste: src/components/PresentationSlot.watchdog.qa2.test.tsx (falhava: onFail 0 chamadas após 12 s com re-render a cada 1 s).
2. Balões `NoticeToast` (8 s) e `UnlockToast` (6 s) não sumiam sozinhos enquanto o App re-renderizava (mesma causa: `[onDone]` nas deps; App passa arrow inline em src/App.tsx:8161 e 8164). O balão "não bloqueante" ficava até o toque e, como ocupa a fila, segurava os itens leves seguintes.
   - Correção: `onDone` em ref, deps `[]` (NoticeToast.tsx, UnlockToast.tsx).
   - Teste: src/components/Toasts.timer.qa2.test.tsx (2 testes, falhavam antes).
3. generate-sprite: o polling do Higgsfield abortava o job já aceito e cobrado por QUALQUER falha transitória de uma consulta de status (exceção de rede, 200 com corpo não-JSON de gateway); só `!st.ok` era tolerado. Resultado: 500, unidade de cota DEVOLVIDA (`gate.release`) apesar de o provedor ter cobrado, e o cliente retentando = geração paga repetida. Correção: try/catch em volta de fetch+json dentro do loop, `continue` (o teto segue sendo o timeout de 40 voltas). functions/api/generate-sprite.js.
   - Teste: functions/api/generate-sprite.qa2.test.js (2 testes de polling, falhavam antes).
4. generate-sprite: corpo `null`/JSON quebrado/array dava TypeError -> 500 `internal error` (contrato da rota: 400). Correção: `request.json().catch(() => null)` + 400 `prompt required`. Teste: mesmo arquivo, "REGRESSAO entrada" (falhava antes).
5. billing: `PRODUCTS[productId]` aceitava chaves herdadas de Object.prototype ("constructor", "toString", "__proto__") vindas do cliente como produto válido; passava do `unknown-product` e chamava a API da Google com esse nome (402 `invalid-purchase` em vez de 400 `unknown-product`, e uma chamada externa gasta). Correção: `Object.hasOwn` em `verifyPlayPurchase` (_billing.js) e no desvio de assinatura (billing.js). Sem risco de concessão (a Google devolveria 404); severidade baixa. Teste: functions/api/_billing.qa2.test.js (falhava antes).

Testes adversariais que PASSAM (guardados, sem bug): fuzz de propriedades da fila (60 execuções x 60 passos: um por vez, não expulsa, o mais prioritário entra, falho não volta, onShow/onDismiss que lançam) em src/hooks/usePresentationQueue.fuzz.qa2.test.tsx; sanitizers/claims/fome/energia com entradas hostis em src/utils/missoesFomeHostil.qa2.test.ts (id e Vínculo hostis, __proto__, claim duplo paga uma vez, penalidade de fome sem dupla cobrança e com teto 2); decoder PNG 8/16 bits, paleta+tRNS, entrelaçado -> Error, 300 PNGs corrompidos só lançam Error, chroma (sem verde, tudo verde, ilha < 24 px = bad-chroma, sem franja verde) em functions/api/_pngChroma.hostil.qa2.test.js.

## Bugs encontrados e não corrigidos
Nenhum que exija decisão do dono além das observações abaixo. Não corrigi o mesmo padrão de `st.json()` no polling do SOUL (generate-sprite.js, caminho de reserva) para manter o diff mínimo; registrado na obs. 9.

## Observações para o dono (NÃO alteradas)
1. [média] Cota do modo grátis: `activityBucket` (src/utils/atividadesLista.ts:20-24) só trata como hábito o `weekdays` com 7 dias distintos; `timesPerWeek` ("3x por semana") e `everyNDays` caem em 'scheduled' e NÃO gastam a cota. Se o CreateModal oferece esses tipos, dá para criar hábitos ilimitados no grátis. O §46 diz "dias específicos"; decisão sua se esses tipos contam.
2. [média] Missão diária e fuso: `dailyForDay` (src/utils/dailyMissions.ts, função `dailyForDay`) zera `claimed` quando o `day` do save difere do dia atual, inclusive se o dia ficar PARA TRÁS (relógio/fuso voltou). Trocar o fuso de D+1 para D e voltar permite resgatar de novo a mesma missão (1 material, limitado por `MATERIAL_CAP`). Só relevante se `playerDayTz` for alterável.
3. [baixa] Voltar do Android com balão (`unlockToast`/`noticeToast`) na tela: src/hooks/usePresentationQueue.ts registra `useBackLayer` para qualquer item != idle, então o voltar fecha o balão em vez de navegar (consome um toque). Provavelmente aceitável.
4. [baixa] Ordem das camadas de voltar: o hook do App registra a camada DEPOIS do filho (efeitos do filho rodam primeiro), logo o voltar fecha o item inteiro da fila (ex.: resumo do dia) mesmo que o componente tenha camada própria para voltar de página interna. Decisão de UX.
5. [baixa] Folha de Missões aberta atravessando a meia-noite: `day` é calculado no render (App.tsx:7845-7852); o resgate usa o relógio fresco no updater, então um toque após a virada vira no-op silencioso (idempotente, sem pagamento indevido), mas a linha mostra "pronta" de ontem até outro render. A memo de marcas (App.tsx:6010) tampouco depende do dia.
6. [baixa] `taskIsForToday` (atividadesLista.ts:47-53) usa o dia LOCAL do aparelho, não `playerDayTz`; diverge só quando o fuso do jogador difere do aparelho.
7. [baixa] Servidor, dupla concessão em corrida: `applyVerifiedPurchase` (_entitlements.js ~L630-655) lê-modifica-grava no KV sem CAS; duas requisições simultâneas do MESMO pedido podem creditar duas vezes. O cliente serializa (reconcile x restore x compra, playBilling.ts:235-305) e `claimOrder` é best-effort; risco só com dois aparelhos da mesma conta em corrida exata. Mesma classe do lock de sprite já declarada no código.
8. [baixa] `consumedOrders` é podado em 200 (_entitlements.js:650); um comprovante consumível antigo ainda listado pela Play depois de 200 pedidos novos seria creditado de novo (a trava `already-consumed` usa essa lista). Praticamente inalcançável.
9. [baixa] generate-sprite: o polling do Soul (~L410) ainda aborta em exceção/JSON ruim (mesmo padrão do bug 3, só no fallback); `isRefusal` por regex de texto pode classificar 5xx com "blocked/policy" no corpo como recusa (cobra 2 unidades).
10. [info] `starvingSince` e o tier divergem por 1 ms exatamente na fronteira (v == 20); sem efeito prático.
11. [info] Splash: `window.setTimeout(remover, 1200)` (main.tsx) remove a splash em 1,2 s mesmo se o app ainda não pintou; intencional (rede de segurança de 27/08).
12. [info] Lido e considerado correto, sem bug achado: `presentationQueue.ts` (regras 1-4), `hunger.ts`/`hungerPenalty.ts` (idempotência, teto 2 perdoando excedente, piso na raiz), migração 2x -> 3x (`sanitizeDungeonSpeed`), `missionsClaimed` (migração e idempotência), espelho `_dailyMissions.js` + save.js (sanitização, listas fechadas), `sessionReset.ts`, `EnergyTimer`/`LoadingBar`, FunctionNpcNote (config, conta, sono; ausente na Mochila), claim de conta excluída (`deleted`).
13. Limite do que verifiquei: não rodei dev server nem Android/Capacitor. account.js, RitualPanel/CreateModal/EditModal/TaskEditModal, DailyReportModal, BuildingIntro, areaLotGeometry e composeSpritePrompt foram cobertos só por leitura parcial e pelos testes existentes (sem testes novos). Não declaro essas áreas livres de bug.

## Comandos e saída
- `git worktree add E:/soulmon-qa2 origin/main -b qa/rodada-2-beta`; `npm ci --cache E:/npm-cache --prefer-offline` ok.
- Regressões ANTES da correção: PresentationSlot.watchdog (1 failed), Toasts.timer (2 failed), generate-sprite.qa2 (3 failed | 3 passed), _billing.qa2 (1 failed). DEPOIS: todos verdes.
- `npx tsc --noEmit` e `npx tsc -p tsconfig.server.json --noEmit`: exit 0, sem saída.
- `TZ=America/Sao_Paulo npx vitest run --maxWorkers=50%`: Test Files 784 passed (784) | Tests 9730 passed | 1 expected fail | 2 skipped | 4 todo (9737) | 532 s | exit 0 (log E:/tmp/q2/full-sp.log).
- PR #358: resultado de `gh pr checks` no fim deste arquivo.
- gh pr checks 358: todos pass (tsc app/desktop/servidor, vitest 4 shards, vendor, Workers Builds). Merge feito com --merge.
