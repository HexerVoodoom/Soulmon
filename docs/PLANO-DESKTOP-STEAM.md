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

| Ação | Escreve no save? | Evidência |
|---|---|---|
| Carinho | ✅ sim | `menu.ts:411` → `pushCareAction` |
| Comida | ✅ sim | `menu.ts:461` |
| Marcar tarefa feita | ✅ sim | `menu.ts:503` → `completeTask` |
| **Banho** | ❌ **não** | `menu.ts:482-486`: toca a frase e o efeito, e **retorna**. Nenhum `pushCareAction` |
| **Dormir / Acordar** | ❌ **não** | `menu.ts:488-492`: `state.sleeping = !state.sleeping` no `localStorage` local |

As regras são de fato **compartilhadas, não copiadas** — `menu.ts:15` e
`state.ts:11,56` importam `src/utils/careRules.ts` de verdade. A rede de
segurança contra `NaN` existe (`cloudSync.ts:293-299`, coberta em
`cloudSync.snapshot.test.ts:528`), e a releitura antes de gravar existe.

**A decisão de produto ("o desktop é um controle remoto, não um segundo jogo")
continua válida** — mas hoje ela descreve um controle remoto com **2 de 4 botões
falsos**. O usuário dá banho, vê a bolha, e no celular o cocô continua drenando
−1 coração/6h. Isso não é uma limitação declarada; é a UI oferecendo uma ação
que não acontece.

### 3c. 🔴 Dois defeitos de regra que o plano antigo não menciona

Não são do desktop — são da arquitetura. O desktop é só o primeiro a fazê-los doer.

1. **Sem `revision`, duas plataformas apagam o save uma da outra em silêncio.**
   `grep -n revision functions/api/save.js` → **vazio**. O KV é
   last-write-wins. A 1ª redação dizia *"Conflitos: last-write-wins do KV,
   mitigado pela releitura"* — **a releitura fecha ~1 ida-e-volta**, não a janela
   real (celular de manhã, PC à noite). O contrato de conflito desenhado na
   `adr-conta-e-save.md` §3–§4 **não existe em lado nenhum**.
2. **O teto de carinho é por dispositivo, não por conta.** `menu.ts:412` chama
   `rubHeal(remote, { date: day, healed: 0 }, day)` — **sempre `healed: 0`**,
   informando à regra compartilhada que ninguém curou hoje. Celular + PC =
   2 corações/dia onde a regra diz 1. Já vale hoje para PWA+APK.

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
| `dist:steam` gera build desempacotado | `[não verificado]` | `desktop/package.json:15` tem `--dir --publish never -c.extraMetadata.steamBuild=true`. **Não executei**: `desktop/node_modules` não existe nesta árvore (electron-builder não instalado) |
| A etapa `vite build` do script | ✅ | `EXIT=0`, saída em §2 |
| Marcação `steamBuild: true` | ✅ lida em `main.js:17` | `require('../package.json').steamBuild === true` |
| Auto-update desligado no build Steam | ✅ | `main.js:17,67` — `checkForUpdates()` só corre quando não é build Steam |
| Nenhuma regra de jogo muda na Steam | ✅ | nenhuma referência a Steam em `src/` |

O raciocínio original continua certo: se o app se auto-atualizasse pelo GitHub
enquanto a Steam atualiza via SteamPipe, os dois brigariam pelo mesmo binário.

**A 1ª redação dizia "3a. O que já está pronto ✅". A metade que importa —
gerar o pacote — nunca foi executada por ninguém.** Marcar `[não verificado]` em
vez de ✅ é a correção.

### 4b. O que falta no código

| Item | Estado | Evidência |
|---|---|---|
| Integração Steamworks (`steamworks.js`) | ❌ **não existe** | `grep -rn "steamworks\|SteamAPI_Init\|greenworks"` em `desktop/ src/ functions/` → **zero**. Confirmado por `desktop/STEAM.md:26-27` |
| `steam_appid.txt` | ❌ | `find . -name steam_appid.txt` → nada |
| `.vdf` de depot | ❌ | `find . -name "*.vdf"` → nada |
| Provider `steam` no `/api/billing` | ✅ **existe** | `functions/api/_billing.js:232-400`; despacho em `billing.js:65-66` |
| Primeira impressão (menu abre no 1º lançamento) | ✅ | `main.js:76-83`, marcador em `app.getPath('userData')` |
| Qualquer teste que exercite `desktop/electron/` | ❌ | 0 arquivos |

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
2. **`claimOrder`** (`_entitlements.js:203`, prefixo `ord:` em `:18`, chamado em
   `billing.js:108`) — um comprovante pertence a uma conta só, globalmente.
   Vale para as duas lojas: o desbloqueio da Play é não consumível, então sem
   essa trava bastava trocar de e-mail e restaurar para clonar a conta paga.

⚠️ Fica **desligado (503)** enquanto `STEAM_PUBLISHER_KEY`/`STEAM_APP_ID` não
existirem, e **nada disso foi testado contra a Valve** — não há App ID. Os
caminhos das interfaces precisam ser conferidos na documentação atual do
Steamworks antes de ligar (`_billing.js:226-230` registra isso).

> **Correção de número:** a 1ª redação dizia "Coberto por 17 testes em
> `_billing.test.js`". Hoje são **32** em `_billing.test.js` e **39** em
> `_billing.steamRefund.test.js`. O número estava desatualizado para menos.

### 5c. Reembolso — ✅ implementado

`auditRefunds` (`functions/api/_entitlements.js:294`) roda na leitura do saldo
(no máximo 1×/dia por conta, `:270`) e desfaz compra da Play
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
| 3 | Empacotamento (`dist` / `dist:steam`) | `[não verificado]` | `desktop/node_modules` ausente; exige Windows + `npm install` |
| 4 | Hover IPC, multi-monitor, `display-metrics-changed` | `[não verificado]` | código existe (`main.js:56,260`); nunca exercido |
| 5 | Leitura do save | ✅ (menos `isSleeping`) | §3a |
| 6 | Escrita: carinho, comida, tarefa | ✅ | `menu.ts:411,461,503` |
| 7 | Escrita: banho, dormir | ❌ **teatro** | `menu.ts:482-492` |
| 8 | Login por token no desktop | ⚠️ escrito, **nunca executado** | `auth.ts:175` |
| 9 | `revision` / 409 / contrato de conflito | ❌ | `grep revision functions/api/save.js` → vazio |
| 10 | `GET /api/whoami` (ADR §2) | ❌ | arquivo não existe em `functions/api/` |
| 11 | Teto de carinho/comida por CONTA | ❌ é por dispositivo | `menu.ts:412` (`healed: 0` fixo) |
| 12 | Provider `steam` no servidor | ✅ (desligado por 503) | `_billing.js:232-400` |
| 13 | Reembolso cross-store | ✅ | `_entitlements.js:294` |
| 14 | Cliente Steamworks | ❌ | grep → zero |
| 15 | `steam_appid.txt` / `.vdf` / depot | ❌ | find → nada |
| 16 | Resgate de chave Steam (ADR §7.3) | ❌ | grep → nada |
| 17 | Teste de `desktop/electron/` | ❌ | 0 arquivos |
| 18 | CI do desktop | ⚠️ existe, **não é obrigatório** | `.github/workflows/desktop-build.yml:4-6`: dispara só em `push` para `main` (e uma branch morta, `claude/ui-layout-z-index-coth3e`), **nunca em `pull_request`** |
| 19 | CI da raiz (`tsc` + `vitest`) | ✅ existe | `.github/workflows/ci.yml:11-14,113-126` — roda em `pull_request` e `push: main` |

### Os criticais que continuam abertos

1. 🔴 **Sem `revision`, duas plataformas apagam o save uma da outra em
   silêncio.** É o único aberto que pode custar o progresso de um jogador — e o
   overlay ter passado a abrir **aproxima** esse risco em vez de afastá-lo:
   agora existe mesmo um segundo dispositivo escrevendo. **Publicar na Steam
   antes de fechar isto é vender corrupção de progresso.**
2. 🟠 **Banho e sono são teatro** — 2 de 4 botões de cuidado não fazem nada.
3. 🟠 **Tetos de carinho/comida por dispositivo** — "mesma conta em qualquer
   plataforma" dobra a cura diária. Já vale para PWA+APK hoje.
4. 🟠 **CI do desktop não é obrigatório e não roda em PR.** O problema nunca foi
   falta de gate; foi gate não honrado.
5. 🟡 **`desktop/STEAM.md:32-34` desatualizado** (nega o provider Steam; ele existe).

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
| Banho/sono são teatro | 🟠 aberto | 🟠 **aberto, confirmado por leitura** | **Empate — nada mudou.** `menu.ts:482-492` |
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
