# Soulmon no desktop + Steam — estado real e o que falta

> **Esta é a 2ª redação.** A 1ª foi escrita sem rodar nada, e a auditoria do run
> `soulmon-02` (`squad-alpha-runs/soulmon-02/auditoria-desktop.md`) mediu o
> resultado: **"a coluna de estado inteira é falsa"** — cinco selos ✅ sobre um
> renderer que não compilava desde 09/ago/2026. O documento continuava útil como
> *pesquisa* (política de loja, taxas, o que o overlay é) e inútil como *plano*.
>
> Esta versão **preserva a pesquisa e amputa a coluna de estado**, substituindo-a
> por estados verificados. A pesquisa de mercado e as decisões que dependem do
> dono não foram replanejadas — não é isso que estava errado.

**Verificação desta redação:** 26/ago/2026, branch `frente/wt-med`.
Toda linha marcada ✅ tem `arquivo:linha` ou saída de comando. O que não pôde ser
executado está marcado **`[não verificado]`** — e isso é diferente de ❌.

> ### 🔄 3ª redação parcial — 26/ago/2026, branch `frente/wt-docs2`, `HEAD = 2be666d5`
>
> Esta redação **não reescreve o documento**: ela conserta o que envelheceu nos
> merges de `c6961d69..2be666d5` (poucas horas depois da 2ª redação). Gate desta
> reverificação: `npx tsc --noEmit` EXIT=0 · `npx vitest run` → **142 arquivos,
> 2483 passed, 2 skipped**.
>
> O que mudou de fato, e onde:
>
> | O quê | Onde neste doc | Commit |
> |---|---|---|
> | O teto de carinho do desktop **deixou de ser por dispositivo** | §3b, §3c-2, §8 item 11 | `f6fb5f30` / merge `69f7f157` |
> | O desktop **importa** as regras de cuidado em vez de reimplementá-las, via `desktop/renderer/src/care.ts` | §3b, §8 | idem |
> | Referências de linha de `_entitlements.js` escorregaram (+66 linhas de comentário de TTL) | §5b, §5c | `b2a35465` / merge `b3cdfabc` |
> | Retenção de 5 anos com TTL **renovável** em `ent:`/`ord:` | §5b (nota nova) | idem |
>
> **Banho e sono continuam teatro** — confirmado por leitura em `menu.ts:496-507`
> nesta árvore. ⚠️ Existe uma frente ATIVA em `E:/tmp/claude/wt-banho`
> (`frente/wt-banho`), hoje ainda em `2be666d5` — **nenhum commit dela chegou
> aqui**. Onde este documento fala de banho/dormir, o estado é `[em andamento
> nesta sessão]`: verdadeiro agora, provavelmente falso amanhã.
>
> ↳ **Foi falso no mesmo dia.** Ver a 4ª redação abaixo: `86341fcb` mergeou.

> ### 🔄 4ª redação parcial — 26/ago/2026 (fim do dia), `HEAD = 33fd94cc`
>
> Gate desta reverificação: `npx tsc --noEmit` **EXIT=0** ·
> `npx tsc -p desktop/tsconfig.json --noEmit` **EXIT=0** · `npx vitest run` →
> **149 arquivos, 2631 passed, 2 skipped**.
>
> | O quê | Onde neste doc | Commit |
> |---|---|---|
> | **Empacotamento EXECUTADO pela primeira vez** — deixou de ser `[não verificado]` | §4a, §7 (itens novos), §8 item 3 | `2f3cd4f6` / merge `33fd94cc` |
> | **Banho e dormir escrevem no save** — os "2 de 4 botões falsos" acabaram | §3b, §8 item 7, criticais | `3e1e92d5` / merge `86341fcb` |
> | **O overlay quase não reimplementa mais regra**: HP/energia/`stageLevel` e a energia da comida deixaram de ser cópia | §3b (nota nova) | `2bc9af3a` / `d56bba7a`, `d9765d09` / `f6716ec5` |
> | **CI do desktop passou a rodar em PR** (`tsc -p desktop/tsconfig.json`) | §8 item 18, criticais | `3795020b` / merge `a3c581d5` |
> | **Login do desktop: veredito = GUARDA DELIBERADA**, não bug e não caminho morto | §3d | `2f3cd4f6` |
> | 🔴 **Caminho errado corrigido**: a tabela do §8 escrevia `auth.ts:175` como se fosse `desktop/renderer/src/auth.ts`. É **`src/utils/auth.ts`** | §8 item 8 | idem |
> | Pendências novas do dono: Modo de Desenvolvedor do Windows, `author` no `desktop/package.json` | §7 | idem |
>
> **Uma correção de MÉTODO, não de fato.** Este documento envelheceu duas vezes
> em ~8h, sempre pelo mesmo mecanismo: `arquivo:linha`. Daqui em diante a
> referência canônica é **`arquivo` + SÍMBOLO** (`doShower` em `menu.ts`, não
> `menu.ts:498`), pelo motivo detalhado no cabeçalho do `docs/STATUS.md`. As
> linhas que sobraram abaixo foram reconferidas contra `33fd94cc`.

## A regra que passa a valer

> **Nenhuma fase recebe ✅ sem evidência colada** — `arquivo:linha` para o que é
> código, saída de terminal para o que é comportamento. "Portado" não é
> "funciona"; "escrito" não é "executado". O custo de não ter essa regra já é
> conhecido: uma ADR e um run inteiro foram construídos sobre um fato que não
> existia.

### Legenda

| Marca | Significa |
|---|---|
| ✅ | verificado nesta redação, com evidência |
| ⚠️ | o código existe e **nunca foi executado** — não conte com ele |
| ❌ | não existe |
| `[não verificado]` | não consegui executar daqui; nem afirmo nem nego |
| 🙋 | depende do dono (conta, credencial, dinheiro ou decisão) |

---

## 0. As três frentes

| Frente | Loja | Estado verificado |
|---|---|---|
| 📱 Android (APK/Capacitor) | Google Play | Código pronto; **bloqueado**: `android/app/google-services.json` ainda é do DigiApp (`project_id: digiapp-88296`, pacotes `com.digiapp.app`), enquanto o app é `com.hexervoodoom.soulmon` (`android/app/build.gradle:5,8`). Ver `docs/BILLING-SETUP.md` |
| 🌐 Web / PWA | — (Cloudflare) | No ar. `capacitor.config.json:6` e `desktop/renderer/src/config.ts:6` apontam para `https://soulmon.mateus-sprnd.workers.dev` |
| 🖥️ Desktop (Electron, overlay) | Steam | Renderer **compila** e o app **abre**; o cliente Steamworks **não existe** |

---

## 1. O que o overlay é (inalterado — esta seção estava certa)

A auditoria conferiu esta seção contra `desktop/electron/main.js` e ela bate.
Fica como estava, agora com as linhas:

- Faixa transparente de **180 px** de altura (`main.js:21`), largura do monitor,
  ancorada no topo da barra de tarefas via `screen.getPrimaryDisplay().workArea`
  (`main.js:109-111`) — `workArea` exclui a barra, então o rodapé encosta nela.
- Sempre por cima: `setAlwaysOnTop(true, 'screen-saver')` (`main.js:145`).
- **Click-through**: `setIgnoreMouseEvents(true, { forward: true })`
  (`main.js:149`), com a exceção sobre o pet alternada por IPC (`main.js:260`).
- Janela de menu separada, `frame: false` + `transparent: true`
  (`main.js:167-176`), posicionada colada ao pet.
- Bandeja do sistema (`main.js:209-213`).
- Reposiciona em `display-metrics-changed` (`main.js:56`).

> **Windows-only na v1.** O `forward: true` do click-through é recurso do
> Windows. macOS/Linux exigem técnica diferente. Continua no radar, não na v1.

---

## 2. Fase 1 — Portar o overlay do DigiApp

**Estado: ✅ concluído — mas o ✅ anterior foi dado 16 dias cedo demais.**

A tabela de renomeações está correta e verificada:

| Item | Alvo | Evidência |
|---|---|---|
| Ponte do preload | `window.soulmonDesktop` | `desktop/electron/preload.js:3` |
| localStorage | `soulmon_desktop_v1` | `desktop/renderer/src/config.ts:9` |
| `appId` do instalador | `com.hexervoodoom.soulmon.desktop` | `desktop/package.json:27` |
| `productName` | "Soulmon" | `desktop/package.json:28` |
| URL do app completo | `soulmon.mateus-sprnd.workers.dev` | `config.ts:6`, `main.js:26` |
| Salt do `saveId` | `soulmon:` | `cloudSync.ts:59`, idêntico a `src/utils/cloudSave.ts:18` |
| Sprite do pet | `getSpriteForStage()` do jogo | `desktop/renderer/src/sprites.ts:24` |
| Publish do auto-update | repo `Soulmon` | `desktop/package.json:47-51` |

### 🔴 O que a 1ª redação escondeu, e importa mais que a tabela

O ✅ original dizia: *"Portei a segunda [branch]. Por isso o `desktop/` do Soulmon
já nasce com auto-update, build de Steam e sincronização de leitura."*

**Portar não é funcionar.** De **09/ago a 25/ago/2026 o renderer não compilava**:
o commit `1b14d2b8` removeu `LEFT_FACING_STAGES` e mudou a assinatura de
`getSpriteForStage`, e `desktop/renderer/src/sprites.ts` ficou para trás. Os três
scripts de build (`dev`, `dist`, `dist:steam`) começam por `vite build`
(`desktop/package.json:11,13,15`) e os três terminavam em `EXIT=1`. **Não existia
binário.**

Consertado pela sonda do run `soulmon-02` (`sprites.ts` alinhado a
`getSpriteForStage(stage, demoCharId)`), com regressão nomeada nascendo junto:
`desktop/renderer/src/sprites.parity.test.ts`, 4 casos que **executam** a
fronteira — `tsc` verde não bastava.

**Verificado nesta redação, saída real:**

```
$ npx vite build -c desktop/vite.config.ts
✓ built in 276ms
EXIT=0

$ npx tsc --noEmit -p desktop/tsconfig.json
EXIT=0
```

### A diferença conceitual (esta parte estava certa)

No DigiApp o desktop tinha um seletor manual de Digimon, porque as formas eram
fixas. No Soulmon cada jogador tem uma linha evolutiva única gerada pelo oráculo
— escolher o bicho na mão não faz sentido. A forma vem do save sincronizado.
Isso removeu a tela de grade e torna a identificação da conta **obrigatória**.

---

## 3. Fase 2 — Sincronização mobile ↔ desktop

### 3a. Leitura completa — ✅ (a 1ª redação dizia 🔧, e errava para MENOS)

O documento antigo listava isto como "a fazer". Está feito, com uma exceção
nomeada. `RemoteSnapshot` (`desktop/renderer/src/cloudSync.ts:63-76`) já carrega:

| Campo | Evidência |
|---|---|
| `stage`, `stageName` | `cloudSync.ts:64-65`, `stageDisplayName` em `:85-100` |
| `eggType` → `genericLine` | `cloudSync.ts:131,305` |
| `demoCharacterId` | `cloudSync.ts:140,310` |
| `hearts` / `maxHearts` | `cloudSync.ts:68-69` |
| `energy` / `maxEnergy` | `cloudSync.ts:143,313` |
| `foodInventory` | `cloudSync.ts:145,315` |
| `tasks` (pendentes do dia) | `cloudSync.ts:146,316`, via `pendingTasks` |
| Carteira (`tier`, `credits`) | `cloudSync.ts:166-178` — **não estava no plano antigo** |

**❌ `isSleeping` NÃO é lido.** `grep -rn isSleeping desktop/` → **zero
ocorrências**. Ver 3c.

### 3b. Escrita de volta — ✅ parcial, e o plano antigo não disse "parcial"

**Funciona, com prova:**

| Ação | Escreve no save? | Evidência (reverificada em `2be666d5`) |
|---|---|---|
| Carinho | ✅ sim, **e agora com o teto do SAVE** | `menu.ts:418` → `pushCareAction(…, remote => remoteRub(remote, new Date()).next)` |
| Comida | ✅ sim, **e agora com a janela do SAVE** | `menu.ts:474-478` → `remoteFeed` |
| Marcar tarefa feita | ✅ sim | `menu.ts:517-520` → `completeTask` |
| **Banho** | ✅ **sim** (`86341fcb`) | `menu.ts:498` (`doShower`) → `remoteShower` em `care.ts`. Marca o cocô mostrado como limpo e **para o relógio de 6h** do `applyPoopDrain`. Antes eram três linhas sem escrita nenhuma, e o pet perdia coração apertando o botão que existe para impedir isso |
| **Dormir / Acordar** | ✅ **sim** (`86341fcb`) | `menu.ts:525` (`doSleepToggle`) → `remoteSleep`/`remoteWake`, que chamam `recordNight` de `src/utils/restWindow.ts` (import puro). `sleepStartedAt` sobrevive à noite para o `wokeAt` fechar o registro. A janela (`onTime`) continua no relógio do APARELHO, de propósito, e há teste |

> ✅ **Fechado.** A frente `frente/wt-banho` mergeou em `86341fcb` no mesmo dia:
> não há mais ❌ nesta tabela. As quatro ações de cuidado do overlay escrevem no
> save.

As regras são de fato **compartilhadas, não copiadas**, e desde `f6fb5f30` isso
vale para a família INTEIRA de cuidado, não só para as duas funções que já
importavam:

- `menu.ts:15` importa `feedFood`, `completeTask` de `src/utils/careRules.ts`;
  `state.ts:11,69` importa `recentFeeds`/`feedsLeft`/`FOOD_LIMIT_PER_HOUR` de lá.
- **Novo:** `desktop/renderer/src/care.ts` — um adaptador fino que **não decide
  nada de cuidado**. Ele importa `applyRub`/`applyFeed` de
  `src/utils/careUpdaters`, `rubRefusal`/`rubHealRecordFor`/`RUB_HEAL_STEP` de
  `src/utils/careRules` e `playerDayKey`/`sanitizePlayerDayAnchor` de
  `src/utils/playerDay` (`care.ts:24-29`), veste o `GameState` cru no formato que
  a regra pede e chama a regra do app. Coberto por
  `desktop/renderer/src/care.parity.test.ts`.
- **Por que o adaptador existe, e não a decisão dentro do `menu.ts`:** o
  `menu.ts` faz `document.getElementById` no topo, então **nenhum teste em `node`
  consegue importá-lo** — enquanto a decisão de cuidado morava lá, ela era na
  prática intestável. É a razão MECÂNICA de o defeito do `healed: 0` ter
  sobrevivido à fatia 2 inteira, e está escrita no cabeçalho de `care.ts:1-22`.

A rede de segurança contra `NaN` existe (`normalizeForRules` em `cloudSync.ts`,
coberta em `cloudSync.snapshot.test.ts`), e a releitura antes de gravar existe.

> ### ✅ 26/08, fim do dia: o overlay quase não reimplementa mais REGRA
>
> Duas cópias que ainda restavam saíram, e as duas **escondiam defeito**:
>
> - **HP / energia / `stageLevel`** (`2bc9af3a`). `cloudSync.ts` tinha
>   `MAX_HP_BY_LEVEL`, `ENERGY_BY_LEVEL` e uma `stageLevel` própria. A
>   justificativa escrita ("importar `types/progression` arrasta o roster legado
>   da masmorra") era **falsa** — aquele arquivo não importa nada, e o próprio
>   `cloudSync.test.ts` já o importava. E a cópia divergia onde mais dói: a
>   `stageLevel` do desktop lia só o **prefixo** do id, enquanto a
>   `getStageLevel` do app cai em `LEGACY_FORM_TIERS` — a compatibilidade que
>   mantém um save antigo em `gaioumon` como **MEGA**. O overlay rebaixava esse
>   jogador a rookie em silêncio (3 corações em vez de 4), e o `maxHealthPoints`
>   errado **voltava para o SAVE** em `normalizeForRules`, fazendo `applyRub`
>   cortar a cura do mega no teto de um rookie. O bloco de testes que guardava as
>   cópias virou teste de **delegação** — igualdade de tabela, agora, seria
>   tautologia.
> - **A energia da comida** (`d9765d09`). `menu.ts` recalculava
>   `Math.min(maxEnergy, energy + 1)` **depois** de `feedFood` já ter aplicado o
>   teto. Davam o mesmo número por sorte de origem — e por baixo havia um
>   `as unknown as` rodando sobre `undefined` (`DesktopState` não tem
>   `evolutionStage`, `energyPoints`, `virusPoints` nem `totalXP`). A regra
>   devolvia energia errada e atributos `NaN`, e **só não aparecia porque o
>   `menu.ts` jogava tudo fora e recalculava à mão**. A cópia não era redundância
>   inofensiva: era o curativo que mantinha o cast quebrado invisível. `localFeed`
>   veste o estado de verdade, e o tipo **não tem** campo `maxEnergy` — não há
>   onde o chamador passar o teto errado. Saíram junto o pré-teste `feedsLeft` do
>   menu e um wrapper morto.
>
> **A dívida `menu.ts:459` declarada na 3ª redação está paga.** O que sobra de
> cópia declarada no overlay é a derivação do `saveId` — e ela agora tem guard
> **comportamental** das três implementações (app, desktop, servidor) em
> `functions/api/saveId.parity.test.js`.

**A decisão de produto ("o desktop é um controle remoto, não um segundo jogo")
continua válida — e agora ela descreve um controle remoto de verdade.** Os
"2 de 4 botões falsos" acabaram em `86341fcb`: as quatro ações escrevem.

### 3c. 🔴 Dois defeitos de regra que o plano antigo não menciona

Não são do desktop — são da arquitetura. O desktop é só o primeiro a fazê-los doer.

1. **Sem `revision`, duas plataformas apagam o save uma da outra em silêncio.**
   `grep -n revision functions/api/save.js` → **vazio**. O KV é
   last-write-wins. A 1ª redação dizia *"Conflitos: last-write-wins do KV,
   mitigado pela releitura"* — **a releitura fecha ~1 ida-e-volta**, não a janela
   real (celular de manhã, PC à noite). O contrato de conflito desenhado na
   `adr-conta-e-save.md` §3–§4 **não existe em lado nenhum**.
2. ~~**O teto de carinho é por dispositivo, não por conta.** `menu.ts:412` chama
   `rubHeal(remote, { date: day, healed: 0 }, day)` — **sempre `healed: 0`**.~~
   ✅ **CONSERTADO em `f6fb5f30`** (merge `69f7f157`), e o conserto foi maior que
   a linha. Ver §3c-bis abaixo.

### 3c-bis. ✅ O teto de cuidado do desktop virou o teto do SAVE (`f6fb5f30`)

**O defeito, e o dano concreto.** `menu.ts:412` passava `{ healed: 0 }` **fixo**
para `rubHeal`. Com o registro sempre zerado, o ramo `daily-cap` de `rubRefusal`
**nunca disparava**, e o registro devolvido era descartado — o desktop nunca
gravava o gasto. Quem tinha o overlay aberto curava **1 coração no celular E
mais 1 no desktop, todo dia**: o teto de 1/dia do produto simplesmente não
existia para essa pessoa.

**Mas o `healed: 0` era só o topo.** O desktop estava atrasado em **seis**
consertos que o app já tinha feito:

| # | Conserto do app | Como estava no desktop |
|---|---|---|
| 1 | **D-33** — os tetos moram no SAVE (`careCaps`), não no `localStorage` | a janela de comida vinha de `state.feedTimes`, o `localStorage` DO OVERLAY, e voltava para lá |
| 2 | **X-4** — `rubHealRecordFor` ordem-consciente | ausente |
| 3 | **X-5** — higienização do timestamp | ausente |
| 4 | **X-6** — updaters puros (`applyRub`/`applyFeed`) leem e regravam o registro | reimplementado à mão |
| 5 | **Dia do jogador em fuso fixo** (`playerDayTz` no save) | chave própria `YYYY-MM-DD` do overlay |
| 6 | **Janela de comida vinda do `prev`** | vinda do estado local |

Isso é o footgun 9 medido: **copiar regra não diverge um pouco, diverge em
tudo, com o tempo.**

**A saída foi IMPORTAR, não recopiar** — e a verificação veio antes da decisão:
`menu.ts` e `state.ts` **já** importavam `careRules` do app (precedente
deliberado), o `vite.config` do desktop já resolve fora do root, e o `vitest` da
raiz já inclui os testes do renderer. Não havia razão técnica para a cópia — era
histórica, do tempo em que o desktop não escrevia no save.

**Um detalhe de formato que evitou um bug pior.** A chave gravada é
`toDateString()` (`care.ts:remoteDayKey`), o formato que o app compara. Se o
desktop tivesse gravado o `YYYY-MM-DD` antigo, `Date.parse` o entenderia — **de
um ANO errado** — e o registro viraria "dia à frente" para sempre, **congelando o
teto do celular**. Está documentado em `care.ts:33-46` como a restrição nº 1
daquela fronteira.

**O que NÃO foi consertado:** o teto por conta **do PWA + APK** continua
dependendo de os aparelhos estarem no mesmo save e de o save na nuvem ser
confiável — ou seja, da `revision` (§3c-1), que continua ❌.

---

### 3d. Autenticação no desktop — ⚠️ **o ✅ mais caro da 1ª redação**

O documento antigo marcava esta fase **✅** e descrevia o fluxo em detalhe. O
código descrito **existe** (`desktop/electron/auth-preload.js`,
`src/utils/auth.ts:173-195`). **Ele nunca rodou uma vez sequer.**

```ts
// src/utils/auth.ts:173-175
export async function startDesktopAuthBridge(): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge || !isAuthConfigured()) return;   // ← sai aqui
```

`isAuthConfigured()` (`auth.ts:29-31`) exige `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN` e `VITE_FIREBASE_PROJECT_ID`. Nenhuma está definida.
E o servidor responde `authRequired: false` — `functions/api/config.js` devolve
`!!env.FIREBASE_PROJECT_ID`, e a variável não existe em produção.

**Estado honesto: ⚠️ escrito, nunca executado, nem em teste.** O único caminho
vivo hoje é o e-mail digitado.

> ### ✅ Veredito de 26/08 (fim do dia): **guarda deliberada, não bug**
>
> Isto foi reinvestigado em `2f3cd4f6` e o veredito importa para ninguém
> "consertar" o que não está quebrado: `startDesktopAuthBridge` **não é caminho
> morto e não é defeito**. Ele sai porque `isAuthConfigured()` exige
> `VITE_FIREBASE_API_KEY` / `AUTH_DOMAIN` / `PROJECT_ID`, e **nenhuma existe
> nesta árvore** — nem `.env`, nem CI, nem vite config; só menção em docs. O
> próprio `src/utils/auth.ts` documenta que isso é proposital, e o chamador
> existe e roda (`App.tsx`). **É a fatia 1 do dono.** Nada foi mockado nem
> forçado para produzir um ✅ falso.
>
> ⚠️ **Correção de caminho, e ela induziu um agente ao erro.** A tabela do §8
> escrevia só `auth.ts:175`, e o leitor natural conclui
> `desktop/renderer/src/auth.ts` — arquivo que **não existe**. É
> **`src/utils/auth.ts`**, do app. Corrigido no item 8.
>
> **O que DAVA para exercitar foi exercitado.** `desktop/electron/auth-preload.js`
> é código nosso, síncrono, sem rede, e **nunca tinha rodado uma vez**.
> `authBridge.test.ts` carrega o **arquivo de produção** (sem cópia) com um
> `electron` falso só no lugar do host, e trava o contrato inteiro contra
> `src/utils/auth.ts` e `main.js`: o nome exposto, a tradução do payload, o
> logout, a recusa de payload sem token de texto, e-mail ausente virando string
> vazia. Provado vermelho: mutando o nome exposto e a checagem de token, **3 dos
> 7 casos quebram**.
>
> 🔴 **Ponto cego documentado e NÃO consertado** (é decisão, não limpeza):
> `auth-preload.js` faz `Number(payload.expiresAt) || 0`, e `main.js` lê `exp: 0`
> como **"nunca expira"** (o guard é `if (authSession.exp && Date.now() >= …)`).
> Validade ausente, `NaN` ou `null` produz uma sessão que o overlay nunca
> considera vencida. Ainda não dói porque o caminho não roda em produção — mas
> ele vai rodar exatamente quando o login for ligado, que é o pior momento para
> descobrir. Ver `docs/STATUS.md` §4.

**O aviso de ordem continua correto e continua importante:** ligar
`FIREBASE_PROJECT_ID` no servidor **depois** de publicar uma versão do desktop
com o login funcionando. Se inverter, o overlay para de sincronizar para quem já
instalou, com 403 genérico. Só que hoje isso é pior do que o plano dizia: o
caminho a publicar **nunca foi provado**, então "publicar antes" não é suficiente
— tem de ser "provar, publicar, e só então ligar".

---

## 4. Fase 3 — Steam

### 4a. Build para SteamPipe

| Item | Estado | Evidência |
|---|---|---|
| `dist:steam` gera build desempacotado | ✅ **EXECUTADO** em 26/08/2026 | `EXIT=0`, saída real abaixo e em `desktop/STEAM.md` |
| A etapa `vite build` do script | ✅ | `EXIT=0`, saída em §2 |
| Marcação `steamBuild: true` | ✅ **e agora provada BOOLEANA**, lida de dentro do asar | `isSteamBuild` em `main.js`: `require('../package.json').steamBuild === true` |
| Auto-update desligado no build Steam | ✅ | `checkForUpdates()` em `main.js` só corre quando não é build Steam |
| Nenhuma regra de jogo muda na Steam | ✅ | nenhuma referência a Steam em `src/` |

O raciocínio original continua certo: se o app se auto-atualizasse pelo GitHub
enquanto a Steam atualiza via SteamPipe, os dois brigariam pelo mesmo binário.

### ✅ 26/08/2026 — o empacotamento saiu de `[não verificado]`

**A 1ª redação dizia "3a. O que já está pronto ✅"; a 2ª e a 3ª marcaram
`[não verificado]`, porque a metade que importa — gerar o pacote — nunca tinha
sido executada por ninguém.** Foi executada (`2f3cd4f6`). Saída real, Windows 10
x64, `desktop/node_modules` instalado do zero (426 pacotes, 28 s):

```
> vite build && electron-builder --win --dir --publish never -c.extraMetadata.steamBuild=true
  • electron-builder  version=25.1.8 os=10.0.19045
  • packaging  platform=win32 arch=x64 electron=33.4.11 appOutDir=release\win-unpacked
  • no signing info identified, signing is skipped
EXIT=0
```

`release/win-unpacked/` com **274 MB**, `Soulmon.exe` de **188 MB**,
`resources/app.asar` de **5,1 MB**.

**O achado que só apareceu porque rodou, e ninguém sabia de que lado estava.**
Lendo o `package.json` de dentro do asar empacotado:

```
steamBuild = true | typeof boolean
```

`-c.extraMetadata.steamBuild=true` na linha de comando vira **booleano**, não a
string `"true"` — então a comparação **estrita** de `main.js` (`=== true`)
acerta e o auto-update fica desligado no build de Steam. **Se tivesse virado
string**, `"true" === true` seria `false`, o auto-update ficaria LIGADO, e o
build da Steam se auto-atualizaria pelo GitHub por cima do que o SteamPipe
instalou — exatamente o conflito que esta variante existe para evitar. Era um
50/50 invisível: `tsc` não vê, teste nenhum via, e só empacotar responde.
**Código que nunca rodou não é código pronto.**

**O tropeço, porque ele vai voltar.** A primeira tentativa falhou **depois** de
já ter gerado o `.exe`, ao extrair o `winCodeSign`: o `7za` não consegue criar
os dois symlinks de macOS (`libcrypto.dylib` / `libssl.dylib`) sem o **Modo de
Desenvolvedor do Windows** ligado. Não é defeito do repositório e não tem
conserto no código — os dois arquivos são irrelevantes num build `--win` e
matam o build inteiro mesmo assim. **Pendência de MÁQUINA, não de projeto**;
está no §7. Saída real e as duas saídas possíveis em `desktop/STEAM.md`.

### 4b. O que falta no código

| Item | Estado | Evidência |
|---|---|---|
| Integração Steamworks (`steamworks.js`) | ❌ **não existe** | `grep -rn "steamworks\|SteamAPI_Init\|greenworks"` em `desktop/ src/ functions/` → **zero**. Confirmado por `desktop/STEAM.md:26-27` |
| `steam_appid.txt` | ❌ | `find . -name steam_appid.txt` → nada |
| `.vdf` de depot | ❌ | `find . -name "*.vdf"` → nada |
| Provider `steam` no `/api/billing` | ✅ **existe** | `functions/api/_billing.js:232-400`; despacho em `billing.js:65-66` |
| Primeira impressão (menu abre no 1º lançamento) | ✅ | `main.js:76-83`, marcador em `app.getPath('userData')` |
| Qualquer teste que exercite `desktop/electron/` | ✅ **parcial** (`2f3cd4f6`) | `authBridge.test.ts` carrega `auth-preload.js` de produção. `main.js` continua sem teste |

O provedor do servidor está pronto e **desligado**; o que falta é o cliente, e
ele **depende do App ID real** para ser escrito e testado. É por isso que os
itens 🙋 7–8 destravam esta parte.

> ⚠️ **`desktop/STEAM.md:32-34` está desatualizado** e mente **para menos**:
> afirma que "o endpoint só verifica compras da Google Play". Falso — há Steam
> completo em `_billing.js`, com Family Sharing e reembolso. Corrigir aquele
> arquivo é trabalho de uma linha e não foi feito aqui.

### 4c. Conquistas / Steam Cloud — ✅ decisão mantida, e confirmada por segunda fonte

Não entram na v1. Steam Cloud, em particular, seria **redundante e perigoso**: o
save já é sincronizado pelo nosso servidor, e dois sistemas competindo pelo mesmo
estado é receita de corrupção. Se um dia entrar, é só para configurações locais
do overlay (posição, idioma), nunca para o `GameState`.

**A `adr-conta-e-save.md` §7.2 chegou à mesma conclusão por caminho
independente.** A auditoria registrou isso como o único ponto do documento
antigo em que duas fontes concordam.

---

## 5. Fase 4 — Monetização cross-store

### 5a. A regra das lojas (pesquisa — sobreviveu à auditoria intacta)

Vale separar **comprar** de **usar**:

- **Google Play** exige o Play Billing para compras de conteúdo digital *feitas
  dentro do app Android*. Mas a política de conteúdo multiplataforma permite
  explicitamente que o app **consuma** conteúdo/moeda comprado em outro lugar. O
  que não pode é o app Android **empurrar** o usuário para comprar fora
  (*anti-steering*).
- **Steam** exige que o que for vendido *para a versão Steam* passe pelo
  pagamento da Steam (MicroTxn ou DLC). Também não gosta de você vender chave ou
  moeda da versão Steam mais barato fora dela.

**Conclusão: carteira compartilhada é permitida pelas duas. Comprar é que é por
loja.** Carteira única no servidor, caixa registradora por loja.

### 5b. Arquitetura — ✅ implementada e verificada

```
                    ┌──────────────────────────┐
   Play Billing ───▶│                          │
                    │  ent:<saveId> no KV      │◀─── mesma conta (e-mail)
   Steam MicroTxn ─▶│  { tier, credits, ... }  │      em qualquer plataforma
                    └──────────────────────────┘
                          ▲            ▲
                    Android app    Desktop/Steam
                     (gasta)         (gasta)
```

`functions/api/billing.js` é uma rota fina que despacha para provedores em
`functions/api/_billing.js` (`billing.js:65-66`,
`?action=verify&provider=play|steam`). Cada um verifica com a sua loja e grava no
**mesmo** entitlement, com a mesma proteção de replay.

Na Steam há dois caminhos:

- `{ id, ticket }` → **tier pago**, a partir da posse do app
  (`verifySteamOwnership`, `_billing.js:291`, com `AuthenticateUserTicket` em
  `:252` e `CheckAppOwnership` em `:311`).
- `{ id, orderId }` → **créditos**, via `ISteamMicroTxn/QueryTxn`, só quando o
  status for `Succeeded`.

**Uma compra = uma conta**, com duas travas verificadas:

1. **`steamid === ownersteamid`** no ticket (`_billing.js:307`) — quem pegou a
   biblioteca emprestada por Family Sharing joga, mas não herda o tier pago.
2. **`claimOrder`** (`_entitlements.js:256` — **era `:203`; escorregou 53 linhas
   com o bloco de TTL de `b2a35465`** —, prefixo `ord:` em `:18`, chamado em
   `billing.js:108`) — um comprovante pertence a uma conta só, globalmente.
   Vale para as duas lojas: o desbloqueio da Play é não consumível, então sem
   essa trava bastava trocar de e-mail e restaurar para clonar a conta paga.

> **🆕 Retenção dos dois registros de dinheiro (`b2a35465`, merge `b3cdfabc`).**
> `ent:` e `ord:` eram gravados **sem TTL nenhum** — para sempre. Agora têm
> **5 anos** (`RETENTION_TTL_SECONDS`, `_entitlements.js:65`), decisão do dono
> (CDC + prazo fiscal), **renovado a cada escrita** (`:164-170` e `:271`).
> A renovação é a metade que importa para esta fase: com prazo fixo contado do
> nascimento, o `ent:` expiraria e **levaria junto o `tier: 'paid'`** de quem
> comprou e continua jogando — retenção de dados não é tomar de volta o que a
> pessoa pagou. O registro só morre após **5 anos de silêncio absoluto**.
> No `ord:`, sem renovação a trava anti-fraude do `claimOrder` cairia 5 anos
> após a compra **mesmo com o comprador ativo** — e restaurar compras passaria a
> poder clonar conta paga. Raciocínio inteiro em `_entitlements.js:20-63`.
> ⚠️ **O caminho D1 de `claimOrder` (`order_claims`) NÃO expira** — banco não
> apaga linha sozinho (`:61-63`). Endereçado ao dono.

⚠️ Fica **desligado (503)** enquanto `STEAM_PUBLISHER_KEY`/`STEAM_APP_ID` não
existirem, e **nada disso foi testado contra a Valve** — não há App ID. Os
caminhos das interfaces precisam ser conferidos na documentação atual do
Steamworks antes de ligar (`_billing.js:226-230` registra isso).

> **Correção de número:** a 1ª redação dizia "Coberto por 17 testes em
> `_billing.test.js`". Hoje são **32** em `_billing.test.js` e **39** em
> `_billing.steamRefund.test.js`. O número estava desatualizado para menos.

### 5c. Reembolso — ✅ implementado

`auditRefunds` (`functions/api/_entitlements.js:356` — **era `:294`**) roda na
leitura do saldo (no máximo 1×/dia por conta, `AUDIT_INTERVAL_MS`, razão escrita
em `:340-349`) e desfaz compra da Play
(`_billing.js:186-219`), microtransação da Steam (`:445-467`) e posse do app na
Steam (`:411-438`). Se a loja não responder, o benefício é **mantido**. Ver
`docs/BILLING-SETUP.md`.

### 5d. 🙋 A decisão de produto que sobra — **e ela agora conflita com a ADR**

O que fazer com o **desbloqueio completo** (hoje `soulmon.unlock.full`, R$29,90
não consumível na Play):

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| **A. Steam pago** | A versão Steam custa um preço na loja. Quem tem o jogo na Steam = tier pago automaticamente | Natural pro público da Steam; ninguém "compra" dentro de um app que já pagou | Quem comprou na Play e quer no PC precisa comprar de novo… ou não: o servidor pode honrar o tier pago da Play no desktop |
| **B. Steam grátis + desbloqueio interno** | App gratuito na Steam, desbloqueio vendido por MicroTxn | Uma compra só, vale em tudo | Loja de graça converte menos; MicroTxn dá mais trabalho |
| **C. Steam grátis, só créditos** | Desbloqueio só existe na Play | Menos código | Usuário de PC obrigado a instalar um app Android pra desbloquear |

> 🔴 **Conflito de documento a resolver pelo dono, não por mim.** A 1ª redação
> recomendava **A com reciprocidade** *e* mantinha MicroTxn no desenho. A
> `adr-conta-e-save.md` §7.3 **tira MicroTxn do escopo** e manda usar **resgate
> de chave** — que não existe no código (`grep` → nada). Hoje existe código de
> MicroTxn pronto que a ADR diz para não usar. **A ADR é mais nova; um dos dois
> tem de ceder, e a decisão é de produto e receita, não de código.**

Não replanejo isso aqui. Registro que a contradição existe e que ela **trava** os
itens 🙋 9 e o item C2 de esforço.

### 5e. Taxas e preço (pesquisa — inalterada)

| Loja | Comissão | Custo fixo |
|---|---|---|
| Google Play | 15% até US$1M/ano, 30% acima | US$25 (uma vez) |
| Steam | 30% (cai a 25%/20% em volumes altos) | **US$100 por app**, reembolsável após US$1.000 em vendas |

Os preços não precisam ser iguais nas duas lojas (e provavelmente não devem).

### 5f. Dívida conhecida desta fase

**Duas carteiras se o jogador usar e-mails diferentes** em cada loja. É inerente
ao modelo por e-mail (o `saveId` é derivado do e-mail — `src/utils/cloudSave.ts:18`).
Mitigação: deixar isso muito claro na tela de login do desktop.

---

## 6. Fase 5 — Radar (não é v1)

Nada aqui foi escrito, e radar não tem premissa a corrigir.

- Reagir ao teclado/mouse como o Bongo Cat (hook global, `uiohook-napi`).
- Notificações nativas do Windows pelo mesmo push scheduler.
- Multi-monitor: escolher em qual tela o pet anda.
- Auto-start com o Windows (`app.setLoginItemSettings`).
- Assinatura de código (`CSC_*`) — sem isso o SmartScreen mostra "editor
  desconhecido" no instalador direto. Na Steam não aparece (a Steam distribui).
- macOS / Linux.

---

## 7. 🙋 Depende de você

Consolidado. Nada aqui eu consigo fazer sozinho.

### 🔴 Bloqueia o lançamento na Play

Ver `docs/BILLING-SETUP.md`. Resumo, com o que pude verificar:

1. **Registrar `com.hexervoodoom.soulmon` no Firebase e trocar o
   `google-services.json`.** ✅ **verificado que continua pendente**: o arquivo
   em `android/app/google-services.json` tem `project_id: digiapp-88296` e
   pacotes `com.digiapp.app` / `com.digipartner.digiapp` — nenhum deles é o do
   app. O build Android falha até isso ser feito (falha proposital).
2. Criar os 4 produtos no Play Console com os IDs exatos. `[não verificado]` —
   é console externo.
3. Conta de serviço da Play Developer API + secrets
   `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` no Cloudflare.
   `[não verificado]` — são secrets, não estão no repositório.
4. Firebase Auth: habilitar link de e-mail, registrar app Web, definir as
   `VITE_FIREBASE_*` **antes** e `FIREBASE_PROJECT_ID` **por último**.
   ✅ verificado que **nada disso está ligado**: `isAuthConfigured()` é falso e
   `/api/config` devolve `authRequired: false`.
   ⚠️ **E agora com uma exigência a mais:** só defina `FIREBASE_PROJECT_ID`
   depois que o login do desktop (§3d) tiver sido **executado e provado**, não
   apenas publicado. Ele nunca rodou.
5. Colar a URL da política de privacidade no Play Console + Data safety form.
   `[não verificado]`.
6. Separação de infra: `docs/SEPARACAO-DIGIAPP.md`.

### 🟠 Bloqueia o lançamento na Steam

7. **Conta Steamworks** em `partner.steamgames.com` e **US$100** de taxa.
8. **Reservar o App ID** e criar o Depot. Os dois números vão nos `.vdf` e no
   `steam_appid.txt` — nenhum dos dois arquivos existe hoje.
9. **Resolver a contradição da §5d** (Opção A/B/C **e** MicroTxn vs. resgate de
   chave da ADR §7.3).
10. **Definir os preços** — Steam e Play podem ser diferentes.
11. **Arte da loja Steam** (tamanhos exatos, exigência da Valve; eu escrevo os
    textos, a arte final precisa ser produzida):

    | Asset | Tamanho |
    |---|---|
    | Header capsule | 460×215 |
    | Small capsule | 231×87 |
    | Main capsule | 616×353 |
    | Library capsule | 600×900 |
    | Library hero | 3840×1240 |
    | Library logo | 1280×720 (fundo transparente) |
    | Screenshots | mín. 1280×720 |

12. **Classificação etária / formulário de conteúdo** da Steam.
13. **Upload do build**: `npm run dist:steam` precisa rodar **no Windows** e o
    `steamcmd` precisa do seu login de parceiro. É a última milha manual.
    ✅ **A metade do `dist:steam` deixou de ser incógnita** em 26/08 (§4a): roda,
    EXIT=0, 274 MB. Falta o `steamcmd`.
13b. 🖥️ **Ligar o Modo de Desenvolvedor do Windows** — Configurações →
    Privacidade e segurança → Para desenvolvedores. É **pendência de MÁQUINA,
    não de projeto**, e é sua porque mexe em configuração do sistema. Sem ele o
    `electron-builder` morre ao extrair o `winCodeSign` (dois symlinks de macOS
    que nem servem num build `--win`), **depois** de já ter gerado o `.exe`. A
    alternativa é pré-extrair o `.7z` na mão a cada limpeza de cache — foi assim
    que o build de 26/08 passou, e não é sustentável. Detalhe em
    `desktop/STEAM.md`.
13c. 🏷️ **Preencher `author` em `desktop/package.json`.** O electron-builder
    avisa `author is missed in the package.json`. No `--dir` é só aviso — mas o
    **`nsis`** do `npm run dist` usa o `author` como **Publisher do
    instalador**: é o nome que aparece no aviso do Windows e nas propriedades do
    `.exe`. Não foi preenchido de propósito: é **identidade, não código**.

### 🟡 Opcional, mas recomendado

14. **Certificado de assinatura de código** (~US$100–400/ano) — remove o aviso
    de "editor desconhecido" do SmartScreen no instalador direto. Não é
    necessário para a Steam.
15. ~~**Domínio próprio do Soulmon** (hoje o desktop e o APK apontam para o
    Pages do DigiApp)~~ — **este item estava FALSO.** `config.ts:6`,
    `main.js:26` e `capacitor.config.json:6` apontam para
    `https://soulmon.mateus-sprnd.workers.dev`. O que continua valendo de
    `SEPARACAO-DIGIAPP.md` é o domínio *próprio* (não um `workers.dev`), e a
    separação de infra do item 6.

---

## 8. Estado consolidado — a tabela que substitui a "ordem de execução ✅"

A lista antiga ("1. Portar overlay ✅ … 5. Extrair regras ✅") era o **mecanismo
do erro**, não um sintoma: foi ela que fez a ADR e um run inteiro tratarem como
base algo que não existia. Substituída por estado, não por sequência.

| # | Item | Estado real | Evidência |
|---|---|---|---|
| 1 | Overlay portado e compilando | ✅ | `vite build` EXIT=0; `tsc -p desktop/tsconfig.json` EXIT=0 |
| 2 | O `.exe` abre e desenha o pet | ✅ desempacotado | screenshots em `sweeper/sonda-overlay-pet.png`, `sonda-menu.png` (sonda do run 02) |
| 3 | Empacotamento (`dist:steam`) | ✅ **EXECUTADO** (`2f3cd4f6`) | `EXIT=0`, 274 MB, `Soulmon.exe` 188 MB. E a flag `steamBuild` provada **booleana** lendo de dentro do asar — se fosse string, o build da Steam se auto-atualizaria por cima do SteamPipe. Ver §4a e `desktop/STEAM.md`. ⚠️ Exige **Modo de Desenvolvedor do Windows** (§7 item 13b). O `dist` com `nsis` **continua** `[não verificado]` |
| 4 | Hover IPC, multi-monitor, `display-metrics-changed` | `[não verificado]` | código existe (`main.js:56,260`); nunca exercido |
| 5 | Leitura do save | ✅ (menos `isSleeping`) | §3a |
| 6 | Escrita: carinho, comida, tarefa | ✅ | `menu.ts:418,474,517` |
| 7 | Escrita: banho, dormir | ✅ **feito** (`86341fcb`) | `doShower` → `remoteShower` e `doSleepToggle` → `remoteSleep`/`remoteWake`, em `menu.ts` → `care.ts`. ✅ **A dívida do `cleanPoop()` foi paga** em `46a6e542`: ele saiu do `App.tsx` para `poopDrain.ts`, ao lado de `applyPoopDrain`, e o `App` passou a delegar — a extração criou fonte única em vez de terceira cópia. O que **continua** valendo: banho é a única transição cujo caminho não nasceu de regra pura própria, e por isso o teste **executa** `applyPoopDrain` sobre o resultado e exige que ela pare de cobrar. Quem julga limpeza continua sendo `poopDrain.ts` |
| 8 | Login por token no desktop | ⚠️ escrito, **nunca executado** — mas é **GUARDA DELIBERADA**, não bug (§3d) | `startDesktopAuthBridge` em **`src/utils/auth.ts`** (⚠️ **não** `desktop/renderer/src/auth.ts`, que não existe — a redação anterior escrevia só `auth.ts:175` e isso induziu um agente ao erro). Sai porque `isAuthConfigured()` exige três `VITE_FIREBASE_*` inexistentes nesta árvore. O outro lado da ponte (`auth-preload.js`) **foi** exercitado: `authBridge.test.ts`, 7 casos, 3 vermelhos sob mutação |
| 9 | `revision` / 409 / contrato de conflito | ❌ | `grep revision functions/api/save.js` → vazio |
| 10 | `GET /api/whoami` (ADR §2) | ❌ | arquivo não existe em `functions/api/` |
| 11 | Teto de carinho/comida por CONTA **no desktop** | ✅ **corrigido** (`f6fb5f30`) | `desktop/renderer/src/care.ts` importa `applyRub`/`applyFeed` do app; `care.parity.test.ts` |
| 11b | Teto por CONTA entre PWA+APK **em escrita concorrente** | ❌ ainda depende de `revision` | ver item 9 |
| 12 | Provider `steam` no servidor | ✅ (desligado por 503) | `_billing.js:232-400` |
| 13 | Reembolso cross-store | ✅ | `_entitlements.js:294` |
| 14 | Cliente Steamworks | ❌ | grep → zero |
| 15 | `steam_appid.txt` / `.vdf` / depot | ❌ | find → nada |
| 16 | Resgate de chave Steam (ADR §7.3) | ❌ | grep → nada |
| 17 | Teste de `desktop/electron/` | ✅ **deixou de ser 0** (`2f3cd4f6`) | `authBridge.test.ts` carrega `desktop/electron/auth-preload.js`, o arquivo de PRODUÇÃO, com um `electron` falso no lugar do host. O `main.js` em si continua sem teste |
| 18 | CI do desktop | ✅ **roda em PR** (`3795020b`) | `ci.yml` ganhou o step `tsc -p desktop/tsconfig.json`. O buraco era **menor** do que "não existe CI do desktop", e foi medido antes de propor: os testes do desktop já rodavam em PR (`vitest.config.ts` inclui `desktop/renderer`; medido: 6 arquivos, 113 testes). Faltava exatamente UM comando, que só existia no `desktop-build.yml` — que não roda em PR **e** tem filtro de `paths` que não inclui `src/utils/careRules.ts` nem a família de cuidado, ou seja, quebrar o overlay via `src/utils/` era invisível dos DOIS lados. Isso passou a importar hoje: o desktop deixou de reimplementar as regras e ganhou acoplamento junto. Custo: **2,4 s**, sem `npm install` dentro de `desktop/`, sem segredo — roda em fork. O caminho de FALHA foi exercitado, não suposto |
| 19 | CI da raiz (`tsc` + `vitest`) | ✅ existe | `.github/workflows/ci.yml:11-14,113-126` — roda em `pull_request` e `push: main` |

### Os criticais que continuam abertos

1. 🔴 **Sem `revision`, duas plataformas apagam o save uma da outra em
   silêncio.** É o único aberto que pode custar o progresso de um jogador — e o
   overlay ter passado a abrir **aproxima** esse risco em vez de afastá-lo:
   agora existe mesmo um segundo dispositivo escrevendo. **Publicar na Steam
   antes de fechar isto é vender corrupção de progresso.**
2. ~~🟠 **Banho e sono são teatro**~~ ✅ **fechado** (`86341fcb`). As quatro ações
   escrevem no save.
3. ~~🟠 **Tetos de carinho/comida por dispositivo**~~ ✅ **fechado no desktop**
   (`f6fb5f30`). O que sobra é o caso de escrita CONCORRENTE entre aparelhos, que
   é o critical 1 (`revision`) e não um defeito do desktop.
4. ~~🟠 **CI do desktop não é obrigatório e não roda em PR**~~ ✅ **fechado**
   (`3795020b`): `tsc -p desktop/tsconfig.json` roda em `pull_request`.
5. 🟡 **`desktop/STEAM.md:32-34` desatualizado** (nega o provider Steam; ele existe).
6. 🖥️ **NOVO, e não é do repositório:** o empacotamento exige o **Modo de
   Desenvolvedor do Windows** ligado na máquina que builda (§7 item 13b), e o
   `desktop/package.json` está **sem `author`**, que vira o Publisher do
   instalador NSIS (§7 item 13c). Nenhum dos dois é código.
7. 🔵 **NOVO, e é o mais instrutivo:** `Number(expiresAt) || 0` no
   `auth-preload.js` colapsa validade ilegível em `exp: 0`, que o `main.js` lê
   como **"nunca expira"**. Documentado, travado por teste, **não consertado** —
   é decisão, não limpeza (§3d).

**Depois desta rodada, o critical 1 (`revision`) ficou sozinho.** Vale registrar
o que isso significa: dos cinco criticais abertos de manhã, quatro eram baratos
e foram pagos no mesmo dia; o que sobra é o único que exige contrato novo entre
cliente e servidor. **É a confirmação da tese do fim deste documento — o gargalo
nunca foi o overlay.** E o overlay ter passado a escrever de verdade **aproxima**
o risco do `revision` em vez de afastá-lo: agora existe mesmo um segundo
dispositivo gravando no save, e em mais duas ações que ontem.

---

## 9. Onde este documento e a auditoria discordaram — e quem venceu

A auditoria (`squad-alpha-runs/soulmon-02/auditoria-desktop.md`) é de
25/ago/2026 sobre `main @ e84a0b26`. Esta redação é de 26/ago sobre
`frente/wt-med`, que já contém a sonda. Onde diferem:

| Ponto | Auditoria (25/ago) | Verificado agora (26/ago) | Quem vence, e por quê |
|---|---|---|---|
| "Não existe binário" (critical 🔴 nº 1) | 🔴 `vite build` EXIT=1 | ✅ EXIT=0 | **Esta redação.** A auditoria estava certa na data dela; a sonda consertou `sprites.ts` **e** o `TS7016` do `desktop/tsconfig.json` depois. Reexecutei os dois comandos |
| "Ninguém nunca executou o overlay" (🔴 nº 2) | 🔴 zero verificação | ✅ executado, com screenshot | **A própria sonda da auditoria**, que corrigiu o item no fim do documento dela. Não reexecutei o `.exe`; aceito a evidência de screenshot |
| `demoCharacterId` descartado | ❌ defeito aberto | ✅ corrigido | **Esta redação.** `sprites.ts:23-25` tem 2 parâmetros, e `sprites.parity.test.ts` executa a fronteira |
| Plano: "domínio próprio — hoje aponta pro Pages do DigiApp" | não avaliado | **FALSO** | **Esta redação.** As 3 fontes apontam para `soulmon.mateus-sprnd.workers.dev` |
| Plano: "17 testes em `_billing.test.js`" | não avaliado | **desatualizado**: 32 + 39 | **Esta redação**, por contagem |
| "Sem CI" (dívida 4 de `flake-assets-contract.md`) | sem CI de `tsc`/`vitest` em PR | ✅ `ci.yml` existe e roda em `pull_request` | **Esta redação.** O `ci.yml` foi criado depois daquele registro |
| Banho/sono são teatro | 🟠 aberto | ✅ **fechado no mesmo dia** (`86341fcb`) | **A auditoria estava certa na data dela.** Foi 🟠 confirmado por leitura de manhã e ✅ à noite — este é o exemplo mais curto de envelhecimento deste documento: **~8 horas** |
| Sem `revision`/`whoami` | 🔴 / 🟠 abertos | **abertos, confirmados por grep** | **Empate — nada mudou** |
| Cliente Steamworks | ❌ | ❌ **confirmado por grep** | **Empate — nada mudou** |
| Estimativas de esforço (§5 da auditoria) | 10–22 semanas para A+B+C | **não reavaliadas aqui** | **A auditoria.** Estimar não era o trabalho desta redação, e refazer número sem medir seria repetir o erro que ela apontou |

**Resumo do padrão:** onde discordamos, a auditoria estava certa **na data
dela** e o código andou depois. Nenhuma discordância foi por leitura errada de
nenhum dos dois lados — foi por tempo. Por isso o cabeçalho desta redação traz
data e branch: sem isso, este documento vira o próximo a ficar falso em silêncio.

**O que NÃO mudou desde a auditoria são exatamente os itens caros** — `revision`,
`whoami`, Steamworks, banho/sono, tetos por dispositivo. O que mudou foi o
barato (6 linhas de `sprites.ts` e um `allowJs`). Isso é informação sobre o
projeto, não coincidência: **o gargalo nunca foi o overlay.**

> **Pós-escrito de 26/08 à noite, e ele CORRIGE o parágrafo acima em parte.**
> Banho/sono e tetos por dispositivo saíram da lista dos "caros" — foram
> fechados no mesmo dia, junto com o CI do desktop e o empacotamento. A tese
> geral sobrevive (**`revision`, `whoami` e Steamworks continuam intocados, e
> são os que exigem contrato novo ou dinheiro do dono**), mas a classificação
> "caro" estava inflada por três itens que ninguém tinha tentado. O que os
> distinguia dos verdadeiramente caros não era tamanho: era **ninguém ter
> executado**. `dist:steam` era `[não verificado]` havia semanas e levou uma
> sessão; o veredito do login levou uma leitura. **Não confunda "não
> verificado" com "difícil"** — é a mesma lição do empacotamento, aplicada ao
> planejamento em vez de ao código.
