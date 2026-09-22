# Referência — desktop (Electron)

> **Dono:** doc-redator-referencia · **Data:** 22/09/2026 · **Estado:** verificado em 22/09/2026 por doc-verificador (delta `f4086ce0..a6c1cd8a`, QA Rodada 1 §5 — `auth-preload.js` › `DEFAULT_TOKEN_TTL_MS` e `main.js` › `auth-get` conferidos no fonte; anterior: delta `9f4e5a7a..f9faf7a7`, QA geral — só as passagens que o diff tocou, conferidas por grep; anterior: mecânico completo; delta `dc72579e..9875477b` conferido símbolo a símbolo, sha a sha)
> **Verificação:** `npx tsc -p desktop/tsconfig.json --noEmit && npx vitest run desktop`
> **Não cobre:** regra de negócio em profundidade (→ `02-REGRAS-DE-NEGOCIO.md`), o build/release do desktop (→ `08-INTEGRACOES-E-DEPLOY.md`, `desktop/README.md`), as regras de cuidado em si (→ `src/utils/careRules.ts` em `06-REFERENCIA/utils.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice
- [Visão geral](#visão-geral)
- [desktop/electron — processo principal](#desktopelectron--processo-principal) — `main.js` · `navigationPolicy.js` · `updatePolicy.js` · `preload.js` · `auth-preload.js`
- [desktop/renderer/src — overlay](#desktoprendererSrc--overlay) — `care.ts` · `cloudSync.ts` · `config.ts` · `state.ts` · `sprites.ts` · `phrases.ts` · `main.ts` · `menu.ts` · `tokens.css`
- [Testes de paridade como régua](#testes-de-paridade-como-régua)

---

## Visão geral

`desktop/` é um app Electron **separado** do bundle web — um "controle remoto" do Soulmon: uma faixa transparente encostada na barra de tarefas do Windows onde o pet anda, mais uma janela de menu para ações de cuidado (carinho, comida, banho, dormir, marcar tarefa). Criar/editar tarefa e todo o resto continuam só no app web. O overlay lê e escreve o MESMO save do celular, via `/api/save` — nunca duplica a regra de cuidado: `care.ts` importa as regras de `src/utils/` (ver footgun 9 do `CLAUDE.md`, item "as regras de CUIDADO deixaram de ser cópia").

A separação de responsabilidade é física, não estilística: `desktop/electron/main.js` faz `require('electron')` e cria janela no corpo do módulo — nenhum teste em `node` consegue importá-lo. Por isso as DECISÕES (política de navegação, política de auto-update) vivem em módulos puros ao lado (`navigationPolicy.js`, `updatePolicy.js`), testáveis, e `main.js` fica só com a FIAÇÃO (chamar, não decidir). O mesmo padrão se repete no renderer: `menu.ts` toca o DOM no topo e não é importável por teste — a fronteira de cuidado testável é `care.ts`.

---

## desktop/electron — processo principal

### `desktop/electron/main.js` (349 linhas — corrigido de "350" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** o processo principal do Electron — cria a janela do overlay (transparente, sempre no topo, click-through exceto sobre o pet) e a janela de menu, gerencia a bandeja (Tray), o IPC entre as janelas, a sessão de auth capturada da janela do app completo, e o auto-update (delegando a DECISÃO a `updatePolicy.js`).
**Exports:** nenhum (`module.exports` ausente) — é o entrypoint do processo principal, carregado pelo `package.json` (`main`), sem chamador dentro do próprio repositório em JS.
**Chamado por:** processo Electron (entrypoint), não por outro módulo.
**Régua:** nenhuma direta (não é importável); as decisões que ele delega são travadas por `desktop/renderer/src/navigationPolicy.test.ts` e `updatePolicy.test.ts`.
**Avisos do arquivo:** a DECISÃO de quem pode navegar e de quem pode publicar token mora em `navigationPolicy.js` "porque este aqui não é importável por teste nenhum" (comentário próprio, em PT sem acento — estilo do autor original desta seção). ⚰️ `FULL_APP_URL` citava, em comentário, "aponta pro Pages compartilhado" — resíduo de antes da migração de URL, corrigido em `f9faf7a7` (QA geral de 21/09/2026; o comentário agora nomeia as três fontes e a régua); a URL efetiva (`https://soulmon.mateus-sprnd.workers.dev`) já está certa nas três fontes, travada por `src/deploy/appUrl.contract.test.ts`.

**Estrutura interna (não exportada, para orientação de leitura):**
- `createOverlay()` — janela transparente, `frame:false`, `skipTaskbar:true`, `setAlwaysOnTop(true,'screen-saver')`, `setIgnoreMouseEvents(true,{forward:true})` por padrão (click-through; o renderer avisa via `set-interactive` quando o mouse está sobre o pet). Faixa com `STRIP_HEIGHT = 72` e criatura `PET_SIZE = 64` (era 180/96 até `e2e196b2` — a criatura a 64, ÷6 de 384, escala inteira, rente ao chão; o balão passou a ficar AO LADO dela, não em cima, então não precisa mais de espaço acima do pet).
- `createMenuWindow(petCenterX)` — janela de menu posicionada colada ao pet (`positionMenuNearPet`), transparente para o CSS desenhar cantos arredondados. O card visível mede `MENU_CARD = {340, 520}`; a janela Electron soma `MENU_SHADOW = 12` de cada lado (`MENU_SIZE`), que é o espaço onde a sombra e os cantos arredondados aparecem sobre o desktop — o `body` de `menu.css` usa o mesmo padding.
- `createTray()` — ícone de bandeja com menu (mostrar/ocultar, abrir menu, abrir app completo, sair).
- `openFullApp()` — abre o app web completo numa `BrowserWindow` própria, com `auth-preload.js`, partição persistente (`persist:soulmon-app`) e as duas travas de navegação (`will-navigate`/`will-redirect` → `decideNavigation`; `setWindowOpenHandler` → `decideWindowOpen`), descritas no achado F-2 da auditoria (ver `navigationPolicy.js`).
- Canais IPC: `set-interactive`, `open-menu`, `open-full-app`, `app-quit`, `menu-minimize`, `state-changed` (propaga entre overlay/menu), `pet-effect` (menu → overlay, toca animação), `auth-token` (auth-preload → main, checado por origem via `isTrustedAuthSender`; desde `a6c1cd8a` o `exp` é normalizado AQUI também — ilegível/ausente/0/negativo vira `Date.now() + 1h`, o contrato do SDK do Firebase), `auth-get` (`ipcMain.handle`, devolve `null` se expirado em até 30s de folga; ⚰️ até `f4086ce0` a checagem era `authSession.exp && …`, e `exp: 0` era lido como **sessão eterna** — QA Rodada 1 §5; hoje `exp` é sempre > 0 e a comparação não tem `&&`).
- `isFirstRun()` — marca em `userData/first-run-done`; primeiro lançamento abre o menu sozinho depois de 1,2s.

### `desktop/electron/navigationPolicy.js`
**Dono de:** a política de navegação e de confiança da janela do app completo — qual é a origem legítima, se uma navegação de topo pode acontecer, o que fazer com `window.open`, e se um remetente de IPC pode injetar token de auth. Extraído de `main.js` de propósito (achado F-2): decisão pura, testável.
**Exports:**
- `DEFAULT_APP_URL` — `https://soulmon.mateus-sprnd.workers.dev`, tem que bater com `main.js` e com `desktop/renderer/src/config.ts` (travado por `src/deploy/appUrl.contract.test.ts`).
- `appOrigin(rawUrl)` — origem confiável derivada da URL efetivamente carregada; só `https:` (ou `http:` em localhost) — qualquer outra coisa (env var com lixo, `file:`, `data:`) cai no default, nunca em origem opaca `'null'`.
- `decideNavigation(targetUrl, origemConfiavel)` — `{allow, openExternal}`; só a própria origem navega DENTRO da janela com o `auth-preload`; `https:` externo vai para o navegador do sistema; qualquer outro esquema é recusado.
- `decideWindowOpen(targetUrl)` — `window.open`/`target="_blank"` NUNCA abre dentro do Electron (seria uma janela sem barra de endereço, herdando preload) — sempre `allow:false`, `https:` externaliza.
- `isTrustedAuthSender(senderUrl, origemConfiavel)` — o remetente do IPC `auth-token` tem direito de gravar a sessão? Checa `event.senderFrame.url` (o FRAME, não a janela — um `<iframe>` de terceiro compartilha `event.sender` mas tem URL própria).
**Chamado por:** `desktop/electron/main.js`.
**Régua:** `desktop/renderer/src/navigationPolicy.test.ts`.
**Avisos do arquivo:** o ataque do achado F-2 é CONTRAINTUITIVO — `auth-preload.js` só expõe canal de SAÍDA, então uma página hostil não LÊ o token da vítima; o que ela consegue é o INVERSO — publicar o token DELA, e o overlay da vítima passa a sincronizar os dados dela para a conta do atacante (fixação de sessão ao contrário). Por isso a checagem é de ORIGEM do remetente, nunca de formato do payload.

### `desktop/electron/updatePolicy.js`
**Dono de:** a decisão "este processo pode se auto-atualizar sozinho?" — extraída de `main.js` pelo mesmo motivo de `navigationPolicy.js`.
**Exports:**
- `isSteamBuild(pkg)` — o `package.json` empacotado marca este build como Steam? Tolerante de propósito (booleano `true` OU string `'true'` contam) — o erro caro é o falso-negativo (build de Steam se auto-atualizando pelo GitHub por cima do SteamPipe).
- `shouldAutoUpdate({isPackaged, pkg})` — `isPackaged === true` E NÃO é build de Steam (lá quem atualiza é o SteamPipe; os dois mecanismos brigariam pelo mesmo binário).
**Chamado por:** `desktop/electron/main.js`.
**Régua:** `desktop/renderer/src/updatePolicy.test.ts`.
**Avisos do arquivo:** em 26/08/2026 foi PROVADO, lendo o `.asar`, que o valor chega como booleano para uma versão específica do electron-builder; a tolerância à string existe caso isso mude, porque uma comparação estrita `=== true` erraria para o lado PERIGOSO (silenciosamente).

### `desktop/electron/preload.js`
**Dono de:** a ponte `window.soulmonDesktop` exposta na janela do overlay/menu — o único canal entre o renderer (sandboxed, `contextIsolation:true`) e o processo principal.
**Exports:** (via `contextBridge.exposeInMainWorld`, não `module.exports`) `setInteractive`, `openMenu`, `minimizeMenu`, `openFullApp`, `quit`, `onUpdateReady`, `notifyStateChanged`, `onStateChanged`, `sendEffect`, `onEffect`, `getAuth` (invoke → `auth-get`), `onAuthChanged`.
**Chamado por:** `desktop/renderer/src/main.ts` e `menu.ts`, como `window.soulmonDesktop`.
**Régua:** nenhuma direta; a superfície é exercitada pelos testes que montam `window.soulmonDesktop` como mock (`care.*.parity.test.ts`, `pushCareAction.test.ts`).
**Avisos do arquivo:** nenhum comentário de aviso próprio além dos JSDoc de cada método citados nos exports.

### `desktop/electron/auth-preload.js`
**Dono de:** a ponte de LOGIN — exposta só na janela do app web completo (`openFullApp`), nunca no overlay/menu.
**Exports:** `window.soulmonDesktopAuth = { isDesktop: true, publish(payload) }` — `publish` é o ÚNICO canal, e é de SAÍDA: a página não consegue ler nada do Electron nem executar nada no processo principal. `payload.token === null` sinaliza logout.
**Chamado por:** o app web completo (`src/`), quando roda dentro desta janela — detecta `window.soulmonDesktopAuth?.isDesktop` para saber que está no desktop e publica o ID token do Firebase sempre que ele muda/renova.
**Régua:** `desktop/renderer/src/authBridge.test.ts` (desde `a6c1cd8a` fecha o buraco do `exp` em vez de documentá-lo: guard textual de que `main.js` não compara com `&&`).
**Avisos do arquivo:** o token vai só para a MEMÓRIA do processo principal (`authSession` em `main.js`), nunca para disco; expira em ~1h e é reemitido pelo SDK dentro da própria janela. Desde `a6c1cd8a`: `DEFAULT_TOKEN_TTL_MS = 1h` — validade DESCONHECIDA (`expiresAt` NaN/ausente/0) é "vence em 1h", nunca "nunca vence" (⚰️ colapsava em `exp: 0`).

### `desktop/electron/jwtExp.js` (novo em 22/09/2026 — QA Rodada 2, `01-seguranca-r2.md` #10; **em curso**, entrada provisória do doc-mantenedor até o próximo `/manter-docs`)
**Dono de:** ler a validade (`exp`) do PRÓPRIO ID token do Firebase em vez de chutar "+1 h" — ⚰️ até `a6c1cd8a` o `auth-preload.js`/`main.js` usavam `DEFAULT_TOKEN_TTL_MS = 1h` quando `expiresAt` não vinha (token renovado há 50 min era tratado como novo).
**Exports:** `expDoJwtMs(token)` → validade em ms (epoch) ou `null` se o token não tiver a forma `a.b.c` com `exp` numérico positivo no payload (base64url; **não verifica assinatura** — isso é do servidor).
**Chamado por:** `desktop/electron/auth-preload.js`/`main.js` (o caminho do `expiresAt` ausente). CJS puro, sem `electron`, para o teste em `node` conseguir importá-lo.
**Régua:** o teste que nasce com ele na R2 (`desktop/renderer/src/authBridge.test.ts` estendido ou arquivo próprio — conferir no commit).

---

## desktop/renderer/src — overlay

### `desktop/renderer/src/care.ts` (348 linhas — corrigido de "349" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** a FRONTEIRA de cuidado do desktop — adapta o `GameState` cru (vindo do servidor ou do estado local do overlay) para o formato que as regras de `src/utils/careRules.ts`/`careUpdaters.ts`/`playerDay.ts`/`restWindow.ts`/`poopDrain.ts` pedem, e chama a regra. NÃO decide nada de cuidado — cada função é um adaptador fino, deliberadamente, porque `menu.ts` (onde a decisão morava antes) não é importável por teste, e foi assim que o teto de carinho ficou por aparelho sem ninguém ver.
**Exports:**
- `RemoteState` — o `GameState` como chega do servidor: `Record<string, unknown>`, sem tipo.
- `remoteDayKey(remote, now)` — o dia do jogador do save remoto (`playerDayKey` + `sanitizePlayerDayAnchor(remote.playerDayTz)`), na MESMA forma (`toDateString()`) que o app usa — divergir de formato congelaria o teto do celular num "dia à frente" permanente.
- `CareOutcome<R>` — `{next: RemoteState} | {next: null, refused: R}`.
- `remoteRub(remote, now)` — carinho aplicado ao save REAL, via `applyRub` (`careUpdaters.ts`) — consertou o defeito em que o desktop passava `{date, healed:0}` fixo e nunca gravava o teto de volta (1 coração/dia curado duas vezes, uma por aparelho).
- `remoteFeed(remote, foodEmoji, now)` — comida aplicada ao save REAL, via `applyFeed` — mesmo defeito, outro contador (janela de 1h vinha do `localStorage` do overlay, nunca ia para `careCaps.feedTimes` do save).
- `LocalHearts`, `localRub(local, now)` — carinho SEM conta sincronizada (overlay sem save onde escrever); ainda assim usa `rubHealRecordFor`/`rubRefusal`/`RUB_HEAL_STEP` do app, não `hearts + 0.5` escrito à mão.
- `remoteRestState(remote)` — sanea o `rest` cru do save para `RestState` (`createRestState()` como padrão; `nights`/`dreams` só se REALMENTE forem listas) e injeta a âncora do dia (`playerDayTz`) de dentro do topo do save — sem isso o desktop nomearia a manhã pelo relógio do aparelho, ressuscitando o bug de noite duplicada.
- `remoteSleep(remote, sleptAt)` / `remoteWake(remote, sleptAt, wokeAt)` — deitar/acordar via `recordNight` (idempotente por dayKey da manhã); a JANELA continua no relógio de PAREDE local (deitar cedo é um gesto do mundo real), só a âncora do dia vem do save.
- `ShowerRefusal = 'already-clean'`, `remoteShower(remote)` — banho GERAL (sem `at`, porque o overlay não sabe qual dos cocôs está na tela do celular) via `cleanPoop`.
- `LocalFeedState`, `localFeed(local, foodEmoji, now)` — comida SEM conta, via `feedFood` (regra real, não recálculo à mão) — era a última regra reimplementada do `menu.ts` (energia somada manualmente, `+1` até um número em cache).
**Chamado por:** `desktop/renderer/src/menu.ts` (as 6 chamadas de `pushCareAction` que aplicam carinho/comida/banho/sono/acordar/tarefa passam por estas funções).
**Régua:** `desktop/renderer/src/care.parity.test.ts`, `care.feed.parity.test.ts`, `care.banhoSono.parity.test.ts`.
**Avisos do arquivo:** "regra copiada diverge em silêncio" (footgun 9) é citado no cabeçalho do próprio arquivo como o motivo de existir — tudo abaixo importa do app, nada reescreve.

### `desktop/renderer/src/cloudSync.ts`
**Dono de:** sincronização com o save do app mobile/web — o MESMO mecanismo de `src/utils/cloudSave.ts` (e-mail → SHA-256 → saveId, GET/POST em `/api/save`), leitura (`fetchRemoteSnapshot`) e escrita de volta (`pushCareAction`).
**Exports:**
- `isAuthRequired()` — pergunta a `/api/config`; em caso de dúvida responde `true` (melhor pedir login à toa do que deixar o campo de e-mail livre com um servidor que já exige token).
- `emailToSaveId(email)` — a MESMA derivação do cliente web e do servidor (`soulmon:` + SHA-256, corte em 32) — a terceira das três implementações do footgun 9 citado em `CLAUDE.md`.
- `RemoteSnapshot`, `SyncResult` — tipos do snapshot exibido no overlay.
- `fetchRemoteSnapshot(email)` — GET `/api/save?id=`, com o ID token de `window.soulmonDesktop.getAuth()` quando existe; extrai `stage`, `stageName` (via `stageDisplayName`, procurando o nome na árvore única do jogador em `soulmonStages`), `hearts`/`maxHearts` (via `MAX_HP_BY_FORM[getStageLevel(stage)]`), `energy`/`maxEnergy`, `foodInventory`, `tasks` pendentes.
- `Wallet`, `fetchWallet(email)` — GET `/api/entitlements?id=`; a MESMA carteira de todas as plataformas (crédito comprado no celular aparece aqui); só leitura.
- `PushResult`, `pushCareAction(email, mutate)` — SEMPRE relê o save antes de escrever (KV é last-write-wins), aplica `mutate` sobre `normalizeForRules(current)`, valida com `isSaneCareState` antes de gravar (nunca salva `NaN`/estado incompleto), faz o POST com `?id=` na URL (contrato de `save.js`).
- `normalizeForRules(state)` — completa campos derivados que as regras de cuidado leem (`maxHealthPoints` derivado do estágio, `energyPoints`/atributos com fallback numérico).
- `isSaneCareState(state)` — os números que acabaram de ser mexidos continuam sendo números finitos e não-negativos?
**Chamado por:** `desktop/renderer/src/menu.ts`.
**Régua:** `desktop/renderer/src/cloudSync.test.ts`, `cloudSync.snapshot.test.ts`, `pushCareAction.test.ts`.
**Avisos do arquivo:** até `d56bba7a` este arquivo tinha TRÊS cópias próprias (`MAX_HP_BY_LEVEL`, `ENERGY_BY_LEVEL`, uma `stageLevel` própria que só lia o PREFIXO do id) — a justificativa escrita ("importar `types/progression` arrasta o roster legado da masmorra") era falsa, e a cópia rebaixava save antigo de mega para rookie no overlay (3 corações em vez de 4), e o `maxHealthPoints` errado voltava para o SAVE em `normalizeForRules`, cortando a cura do mega no teto de um rookie. Hoje importa `MAX_HP_BY_FORM`/`getStageLevel`/`getMaxEnergyForStage` direto de `src/types/progression.ts`.

### `desktop/renderer/src/config.ts`
**Dono de:** as duas constantes compartilhadas pelo renderer do desktop.
**Exports:**
- `APP_URL = 'https://soulmon.mateus-sprnd.workers.dev'` — uma das três fontes que `src/deploy/appUrl.contract.test.ts` obriga a concordar (junto com `capacitor.config.json` e `desktop/electron/main.js`).
- `STORAGE_KEY = 'soulmon_desktop_v1'` — namespace local do desktop, separado do save real de propósito (o que mora aqui é DESTE APARELHO: idioma, cama, cache de leitura da nuvem).
**Chamado por:** `desktop/renderer/src/cloudSync.ts`, `state.ts`.
**Régua:** `src/deploy/appUrl.contract.test.ts` (as três fontes).
**Avisos do arquivo:** o comentário do arquivo registra que ele mesmo já afirmou, incorretamente, apontar para o Pages herdado do DigiApp — corrigido, mas citado como exemplo do padrão "referência que apodrece mais rápido que o número" do `CLAUDE.md`.

### `desktop/renderer/src/state.ts`
**Dono de:** o estado local do overlay (`DesktopState`), num namespace PRÓPRIO (`STORAGE_KEY`) — mistura de um CACHE de leitura do save real (pet/corações/energia) com campos de ação puramente locais (idioma, cama, janela deslizante de comida sem conta).
**Exports:**
- `RemoteTask` — tarefa de hoje, espelhada do save (`{id, name, emoji}`); o desktop NÃO cria tarefas.
- `DesktopState` — a interface inteira: campos espelho do save (`stage`, `stageName`, `genericLine`, `demoCharacterId?`, `hearts`, `maxHearts`, `energy`, `maxEnergy`, `foodInventory`) + campos só do desktop (`language`, `tasks`, `sleeping`, `sleepStartedAt`, `feedTimes`, `rubHeal?` — teto de carinho SÓ do modo sem conta —, `syncEmail`, `lastSyncAt`).
- `FOOD_LIMIT_PER_HOUR` — reexportado de `src/utils/careRules.ts` (nunca redefinido aqui, para não virar segunda cópia).
- `loadState()` / `saveState(state)` — leitura/escrita em `localStorage`, com fallback de padrões (`{...defaults(), ...parsed}`) e captura de exceção (modo privado/sem espaço).
- `formatLastSync(iso, isPt)` — rótulo da última sincronização; devolve `''` (não "Invalid Date") para ISO ilegível — extraído para cá porque `menu.ts` não é importável por teste.
- `foodCount(inventory)` — total de comidas no bolso.
- `firstFood(inventory)` — primeira comida disponível, ou `null` (o desktop não escolhe sabor).
**Chamado por:** `desktop/renderer/src/main.ts`, `menu.ts`, `care.ts` (via os tipos `LocalHearts`/`LocalFeedState` compatíveis).
**Régua:** `desktop/renderer/src/formatLastSync.test.ts`.
**Avisos do arquivo:** este cabeçalho já afirmou, incorretamente, que "a escrita de volta não existe (fase 2b)" — falso desde `f6fb5f30`/`86341fcb`; corrigido, com a nota "verificado em `menu.ts` (as seis chamadas de `pushCareAction`) antes de corrigir". `feedsLeft(state)` foi removida de propósito — havia duas portas para a mesma recusa (este pré-teste e o `hourly-limit` que a regra do app já devolve); quem precisa da janela chama `localFeed` (`care.ts`).

### `desktop/renderer/src/sprites.ts`
**Dono de:** nada de tabela própria — reaproveita `src/utils/sprites.ts` para a criatura do overlay ser exatamente a mesma do celular (o Soulmon não tem formas fixas escolhíveis à mão, como o DigiApp de origem tinha).
**Exports:**
- `GenericLine = 'tapirmon' | 'veemon' | 'salamon'` — `eggType` do save; ainda existe no save/snapshot, mas NÃO é mais parâmetro de sprite desde `1b14d2b8` (a arte vem toda de `src/assets/soulmon/`).
- `petSprite(stage, demoCharId?)` — `getSpriteForStage(stage, demoCharId)`.
- `facesLeft(_stage)` — sempre `false`; existe como função (não removida) porque `main.ts` espelha o sprite ao andar e precisa saber a orientação natural — a lista `LEFT_FACING_STAGES` que ela substituiu já era sempre falsa antes de a árvore nascer direto em rookie.
**Chamado por:** `desktop/renderer/src/main.ts`.
**Régua:** `desktop/renderer/src/sprites.parity.test.ts`.
**Avisos do arquivo:** nenhum além dos citados nos exports.

### `desktop/renderer/src/phrases.ts`
**Dono de:** as falas do pet no overlay — curtas, fofas, sem emoji (mesma convenção do `speak()` do app), PT-BR + EN sempre.
**Exports:**
- `idlePhrase(lang)` — fala aleatória do banco `IDLE` (ocioso, chamado periodicamente por `main.ts`).
- `eventPhrase(event, lang)` — fala aleatória de `BY_EVENT[event]` (`pet`, `petHealed`, `feed`, `full`, `noFood`, `shower`, `sleep`, `wake`, `taskDone`, `taskNew`).
**Chamado por:** `desktop/renderer/src/main.ts` (idle), `menu.ts` (evento de cuidado, repassado via `sendEffect`/`onEffect`).
**Régua:** nenhum teste próprio; conteúdo estático de texto.
**Avisos do arquivo:** nenhum.

### `desktop/renderer/src/main.ts`
**Dono de:** o overlay visível — o pet andando na faixa, o balão de fala, os efeitos de partícula, e a ponte com o processo principal via `window.soulmonDesktop`. Não é importado por nenhum outro módulo (é o entrypoint do `dist-renderer/index.html`).
**Exports:** nenhum (script de entrypoint, sem `export`).
**Chamado por:** carregado como script pela janela do overlay (`createOverlay` em `main.js`).
**Régua:** nenhuma direta — comportamento coberto pelos testes dos módulos que ele orquestra (`sprites.ts`, `state.ts`, `phrases.ts`).
**Avisos do arquivo:** nenhum comentário de aviso formal; a lógica de caminhada (`tick`, `PET_SIZE=64`, `SPEED=28px/s`) e o espelhamento do sprite (`facesLeft`) estão descritos no corpo. Desde `e2e196b2` (canvas "Fora do app"): `PET_SIZE` caiu de 96 para 64 (espelha o mesmo valor em `desktop/electron/main.js`); o balão (`positionBubble`) passou a se posicionar AO LADO da criatura (`BUBBLE_GAP`), com o rabicho trocando de lado (`side-right`/`side-left`) perto da borda direita, em vez de centralizado acima dela; `burst()` desenha os efeitos com os PNGs de `EFFECT_ART` — carinho/banho (`glyph-affection`/`glyph-bath`, do HUD do app) e, desde `02d483af` (21/09/2026, R2-5), comida/sono (`glyph-food-32`/`glyph-sleep-32`, só do desktop, em `desktop/renderer/assets/`); emoji sem glifo cai no ícone Material `favorite` (nunca emoji do sistema). ⚰️ `EFFECT_ICON` (o mapa emoji → ícone Material `restaurant`/`bedtime`) foi apagado em `02d483af`.

### `desktop/renderer/src/menu.ts` (636 linhas — corrigido de "637" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** a UI da janela de menu — painéis (principal, tarefas, configurações), os botões de ação de cuidado, e a orquestração de sincronização/carteira. NÃO decide regra de cuidado — delega tudo a `care.ts`/`cloudSync.ts`/`careRules.ts` (`completeTask` importado direto do app). Toca o DOM no topo do módulo (`document.getElementById`), por isso **nenhum teste em `node` consegue importá-lo** — foi assim que o teto de carinho ficou por aparelho sem ninguém ver, antes de `care.ts` existir.
**Exports:** nenhum (script de entrypoint da janela de menu, sem `export`).
**Chamado por:** carregado como script pela janela de menu (`createMenuWindow` em `main.js`).
**Régua:** nenhuma direta (não importável); a fronteira de cuidado que ele invoca é travada pelos testes de `care.ts`/`cloudSync.ts` listados acima.
**Avisos do arquivo:** o próprio cabeçalho explica por que a fronteira de cuidado mora em `care.ts` e não aqui. Estrutura interna (não exportada): `renderMain`/`renderTasks`/`renderSettings` (painéis), `doPet`/`doFeed`/`doShower`/`doSleepToggle`/`doCompleteTask` (as seis chamadas de `pushCareAction`, via `care.ts`), `syncNow(email)` (sincronização manual), `applySnapshot(s)`/`pushFailed(reason)` (aplica o resultado da sincronização ao `DesktopState` local).
Desde `e2e196b2` (canvas "Fora do app", identidade visual Fase 2): a UI foi reformada sobre os tokens de `tokens.css` (ver entrada abaixo), mas a fronteira de comportamento não mudou — segue nenhum export, mesmas seis chamadas de `care.ts`. Mudanças de estrutura interna (não decisão de design, só o que passou a existir na função): `icon(name, size, fill)` monta um `<span class="ico">` da Material Symbols Rounded (ícone sempre pelado, nunca em caixa); `statusLine()` substituiu `heartsLabel()` — desenha corações/energia/comida como ícones (`favorite`/`bolt`/`restaurant`) em vez de string de emoji; `button()` ganhou parâmetro `iconName` (ícone + texto, nunca mais `innerHTML` com emoji); `careButton()` idem, ícone 24 pelado na fileira de cuidado; `labelTitlebar()` é novo — aplica `aria-label`/`title` em PT/EN nos três botões da barra de título (o HTML é estático, sem idioma); `body()` é novo — cria o container `.pb` (corpo do painel) que cada `render*` usa no lugar de anexar direto em `content`. "Tarefas de hoje" não exibe mais contagem numérica (nenhum `badge`) — decisão de produto registrada como 13.17 no `REGISTRO-DE-DECISOES.md`, não deste doc.

### `desktop/renderer/src/tokens.css`
**Dono de:** os tokens visuais do overlay/menu (cor, fonte, raio, espaçamento) e das três fontes web (`Fredoka`, `Rubik`, `Material Symbols Rounded`) embarcadas via `@font-face` a partir de `public/fonts/*.woff2`. Não é módulo TypeScript — é CSS puro, importado por `style.css` (overlay) e `menu.css` (janela de menu) com `@import './tokens.css'`.
**Exports:** (custom properties CSS, não `export` de JS) — bloco `:root` do tema escuro (canônico: `--sm2-bg`, `--sm2-surface`, `--sm2-surface-2`, `--sm2-line`, `--sm2-ink`, `--sm2-muted`, `--sm2-primary-ink`, `--sm2-primary-fill`, `--sm2-primary-deep`, `--sm2-primary-soft`, `--sm2-on-primary`, `--sm2-gold-ink`, `--sm2-gold-fill`, `--sm2-on-gold`, `--sm2-viewport-bg`, `--sm2-viewport-ink`, `--sm2-viewport-ring`, `--sm2-viewport-ring-deep`, `--sm2-credit-ink`, `--sm2-icon-grad`); o mesmo conjunto redefinido sob `@media (prefers-color-scheme: light)` para o tema claro; as invariantes que não mudam por tema (`--sm2-font-display`, `--sm2-font-text`, `--sm2-font-icon`, `--sm2-font-mono`, escala de texto `--sm2-text-xs/sm/md/lg`, `--sm2-leading-body/title`, raios `--sm2-radius-sm/md/lg`, `--sm2-dur-tap`, `--sm2-ease`); e um conjunto de classes "átomo" reutilizadas por `menu.ts` — `.ico`/`.on`/`.i18`/`.i20`/`.i24` (ícone Material, nunca em caixa), `.iconbtn` (alvo de toque 44×44), `.btn`/`.out`/`.gho`/`.full`/`.left` (botão de texto), `.ring`/`.screen`/`.glass` (o "visor" do retrato do pet — anel de cobre + vidro), `.num` (números tabulares) e `.note` (texto auxiliar pequeno).
**Chamado por:** `desktop/renderer/src/style.css` (overlay) e `desktop/renderer/src/menu.css` (janela de menu), ambos via `@import`.
**Régua:** `src/styles/overlayTokens.parity.test.ts`.
**Avisos do arquivo:** é **cópia DECLARADA** do bloco `--sm2-*` de `src/index.css` (commit `e2e196b2`, "tokens.css = copia declarada do --sm2-*") — o renderer do desktop não carrega o CSS do app principal (outro bundle, outro processo Electron), então os valores hex precisam existir fisicamente aqui também. Isso é o footgun 9 ("regra copiada diverge em silêncio") admitido por escrito no próprio cabeçalho do arquivo, e por isso existe `overlayTokens.parity.test.ts`: lê este arquivo e `index.css` e compara token a token, nos dois temas — quem mudar um valor no app e esquecer aqui quebra o teste, não descobre em produção. O tema **escuro é o canônico** (é o `:root` sem media query); o claro segue `prefers-color-scheme: light` do sistema operacional — a janela de menu acompanha o tema do Windows, a faixa em si é transparente e só pinta o balão de fala e os glifos de efeito. A paleta roxa herdada do DigiApp (`--sm-bg`, `--sm-surface`, `--sm-ink` etc., hardcoded antes deste commit) saiu inteira.

---

## Testes de paridade como régua

Estes testes não pertencem a um único módulo — travam o ENCONTRO entre o desktop e o app web/servidor, porque a regra é importada (não copiada) e a fronteira ainda pode divergir em silêncio se alguém alterar só um lado do tipo:

- **`desktop/renderer/src/care.parity.test.ts`** — carinho (`remoteRub`/`localRub`) bate com `src/utils/careUpdaters.ts`/`careRules.ts`.
- **`desktop/renderer/src/care.feed.parity.test.ts`** — comida (`remoteFeed`/`localFeed`) bate com `applyFeed`/`feedFood`.
- **`desktop/renderer/src/care.banhoSono.parity.test.ts`** — banho e sono (`remoteShower`/`remoteSleep`/`remoteWake`) batem com `cleanPoop`/`recordNight`.
- **`desktop/renderer/src/cloudSync.test.ts`** e **`cloudSync.snapshot.test.ts`** — `emailToSaveId` bate com `src/utils/cloudSave.ts` e `functions/api/_auth.js` (a terceira ponta do footgun 9 "sobrou a derivação do saveId"); snapshot lido do save bate com o que o app grava.
- **`desktop/renderer/src/sprites.parity.test.ts`** — o sprite mostrado no overlay é o mesmo que `getSpriteForStage` devolveria no app.
- **`desktop/renderer/src/navigationPolicy.test.ts`** e **`updatePolicy.test.ts`** — as políticas puras extraídas de `main.js` (ver acima).
- **`desktop/renderer/src/authBridge.test.ts`** — o contrato de `auth-preload.js` (`publish`, canal só de saída).
- **`desktop/renderer/src/pushCareAction.test.ts`** — o ciclo reler→mutar→gravar de `cloudSync.ts`, incluindo `isSaneCareState` recusando escrita de `NaN`.
- **`desktop/renderer/src/formatLastSync.test.ts`** — `state.ts`, ISO ilegível vira `''`, nunca "Invalid Date".
- **`src/styles/overlayTokens.parity.test.ts`** — `desktop/renderer/src/tokens.css` bate token a token com o bloco `--sm2-*` de `src/index.css`, nos dois temas (escuro e claro).

`functions/api/saveId.parity.test.js` (em `functions/api/`, listado em `api-workers.md`) também cobre a terceira ponta desta fronteira, do lado do servidor.
