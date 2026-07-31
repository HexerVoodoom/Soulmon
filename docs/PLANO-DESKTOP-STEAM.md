# Soulmon no desktop + Steam — plano completo

Documento de referência para o Soulmon rodar em **três frentes sincronizadas**:

| Frente | Loja | Estado |
|---|---|---|
| 📱 Android (APK/Capacitor) | Google Play | Código pronto, falta config (`BILLING-SETUP.md`) |
| 🌐 Web / PWA | — (Cloudflare Pages) | No ar |
| 🖥️ Desktop (Electron, overlay) | Steam | **Portado do DigiApp nesta fase** |

> **Como ler:** cada fase tem ✅ (feito), 🔧 (a fazer, eu executo) e
> 🙋 (**depende de você** — conta, credencial, dinheiro ou decisão).
> Os 🙋 estão consolidados no fim, em [Depende de você](#depende-de-você).

---

## 0. Resposta rápida às perguntas que você fez

**"O Soulmon já tem o overlay de desktop?"**
Não tinha. Verifiquei: nenhum Electron, Tauri, `BrowserWindow` ou código de
overlay no repositório do Soulmon.

**"Dá pra pegar do DigiApp?"**
Sim, e peguei. O overlay existe no DigiApp em **duas branches que nunca foram
mergeadas na `main`**:

- `claude/digiapp-desktop-pet-overlay-zb5o0o` — versão inicial;
- `claude/desktop-pet-window-style-ud89ee` — **a boa**: já traz janela de menu
  estilo Win98, leitura do cloud save (`cloudSync.ts`) e um `STEAM.md`.

Portei a segunda. Por isso o `desktop/` do Soulmon já nasce com auto-update,
build de Steam e sincronização de leitura.

**"Dá pra pôr saldo em uma loja e usar na outra?"**
**Dá, e é o padrão da indústria** — desde que a *compra* aconteça na loja da
plataforma onde o usuário está. Detalhes em [Fase 4](#fase-4--monetização-cross-store).
Resumo em uma linha: **carteira única no servidor, caixa registradora por loja.**

---

## 1. O que o overlay é (para alinhar expectativa)

Estilo *Bongo Cat / Taskbar Hero*:

- Uma faixa transparente de 180px de altura, largura do monitor, ancorada no
  topo da barra de tarefas do Windows (`screen.workArea`).
- Sempre por cima de tudo (`setAlwaysOnTop(true, 'screen-saver')`), inclusive
  em tela cheia.
- **Click-through**: cliques atravessam para o que estiver embaixo, *exceto*
  quando o mouse está sobre o pet (`setIgnoreMouseEvents(true, {forward:true})`
  + detecção de hover no renderer via IPC).
- O pet anda de um lado para o outro, para, vira, e solta falas PT/EN.
- Clicar nele abre uma **janela separada** de menu, colada ao pet, com as ações
  (carinho, comida, banho, dormir, tarefas, configurações).
- Ícone na bandeja do sistema: mostrar/ocultar, abrir menu, abrir app completo, sair.

> **Windows-only na v1.** O `forward: true` do click-through é um recurso do
> Windows; macOS/Linux exigem técnica diferente. Está no radar, não na v1.

---

## Fase 1 — Portar o overlay ✅

O que muda em relação ao código do DigiApp:

| Item | DigiApp | Soulmon |
|---|---|---|
| Ponte do preload | `window.digiDesktop` | `window.soulmonDesktop` |
| localStorage | `digiapp_desktop_v1` | `soulmon_desktop_v1` |
| `appId` do instalador | `com.digiapp.desktop` | `com.hexervoodoom.soulmon.desktop` |
| `productName` | "DigiApp Desktop" | "Soulmon" |
| URL do app completo | `digiapp-a5e.pages.dev` | domínio do Soulmon (config) |
| Salt do `saveId` | `digiapp:` | **`soulmon:`** — senão lê o save errado |
| Sprite do pet | tabela fixa de Digimons | `getSpriteForStage()` do próprio jogo |
| Publish do auto-update | repo `DigiApp` | repo `Soulmon` |

**Diferença conceitual importante:** no DigiApp o desktop tinha um *seletor
manual de Digimon* (grade com todos os sprites), porque as formas eram fixas.
No Soulmon **cada jogador tem uma linha evolutiva única gerada pelo oráculo** —
escolher o bicho na mão não faz sentido. A forma vem do save sincronizado.
Isso remove a tela de grade e torna o e-mail de sincronização **obrigatório**,
não opcional.

---

## Fase 2 — Sincronização mobile ↔ desktop

Hoje (herdado do DigiApp): **somente leitura**, e só de `evolutionStage` +
`healthPoints`.

### 2a. Leitura completa 🔧

`GET /api/save?id=<saveId>` já devolve o `GameState` inteiro. O overlay passa a
ler também: `eggType` (linha genérica do sprite), `demoCharacterId`, `energy`,
`foodInventory`, `activities`/`tasks` do dia, `isSleeping`. Assim o menu mostra
o estado real, não um estado paralelo inventado.

### 2b. Escrita de volta 🔧 — o pulo do gato

Hoje as ações do menu mexem só num estado local (`soulmon_desktop_v1`), de
propósito, para não corromper o save real. Para "mexeu num, continua no outro"
de verdade, faltam três coisas, nesta ordem:

1. **Extrair as regras para módulos puros.** Hoje alimentar/carinho/concluir
   tarefa vivem dentro de `src/App.tsx` (React). Precisam virar funções puras
   (`src/utils/careRules.ts`) que recebem `GameState` e devolvem `GameState`,
   usadas **tanto** pelo app quanto pelo desktop. Sem isso, as duas
   implementações divergem e o save fica inconsistente.
2. **`POST /api/save` a partir do desktop**, com debounce, relendo o estado
   antes de aplicar cada ação.
3. **Conflito:** o KV é *last-write-wins*. Para o overlay basta reler antes de
   escrever. Se um dia houver edição simultânea real, o caminho é campo
   `updatedAt` + merge por seção (ou migrar o save para Durable Object).

> **Decisão que tomei:** não vou ligar a escrita antes do passo 1. Duplicar as
> regras de jogo em TypeScript solto é exatamente o tipo de coisa que gera um
> bug de "perdi meus corações" impossível de reproduzir.

### 2c. Autenticação no desktop 🔧 — **bloqueador silencioso**

⚠️ Isto é importante e não é óbvio: quando você definir `FIREBASE_PROJECT_ID`
no Cloudflare (último passo do `BILLING-SETUP.md`), **todas** as rotas passam a
exigir um ID token do Firebase. O desktop, do jeito que veio do DigiApp,
**não faz login** — ele simplesmente pararia de sincronizar, com um erro 403
genérico.

Plano (sem trabalho extra pra você):

- O overlay já sabe abrir o app web completo numa `BrowserWindow`.
- Essa janela recebe um preload próprio que, depois do login por link de
  e-mail, envia o ID token para o processo principal por IPC.
- O processo principal guarda o token (e o refresh) e injeta o
  `Authorization: Bearer` nas chamadas de sync.
- Enquanto `FIREBASE_PROJECT_ID` não existir, tudo segue funcionando sem token
  (é o modo de migração que já está no `_auth.js`).

**Ordem correta:** ligar o login no servidor **depois** que o desktop souber
autenticar. Se inverter, o desktop quebra para todo mundo que já instalou.

---

## Fase 3 — Steam

### 3a. O que já está pronto ✅

- `npm run dist:steam` gera build **desempacotado** (`release/win-unpacked/`),
  que é o formato que o SteamPipe sobe como depot.
- Esse build marca `steamBuild: true` e **desliga o auto-update via GitHub**.
  Isso não é detalhe: se o app se auto-atualizasse puxando do GitHub enquanto a
  Steam também atualiza via SteamPipe, os dois mecanismos brigariam pelo mesmo
  binário instalado.
- Nenhuma regra de jogo muda para rodar na Steam.

### 3b. O que falta no código 🔧

| Item | Por quê |
|---|---|
| Integração Steamworks (`steamworks.js`) | Necessária para 3 coisas: detectar que o app foi lançado pela Steam, verificar propriedade (= tier pago) e vender créditos por MicroTxn |
| `steam_appid.txt` | Só em desenvolvimento; em produção a Steam injeta |
| Provider `steam` no `/api/billing` | Verificar a transação junto à Valve antes de creditar |
| Primeira impressão | Abrir a janela de menu automaticamente no primeiro lançamento — um usuário da Steam clica em "Jogar" e espera **ver** alguma coisa, não só um bicho na barra de tarefas |

### 3c. Conquistas / Steam Cloud

Não entram na v1. Steam Cloud, em particular, seria **redundante e perigoso**:
o save já é sincronizado pelo nosso servidor. Dois sistemas de save
competindo pelo mesmo estado é receita de corrupção. Se um dia entrar, é só
para configurações locais do overlay (posição, idioma), nunca para o `GameState`.

---

## Fase 4 — Monetização cross-store

### A regra das lojas, em bom português

Existe uma confusão comum aqui, então vale separar **comprar** de **usar**:

- **Google Play** exige o Play Billing para compras de conteúdo digital
  *feitas dentro do app Android*. Mas a política de conteúdo multiplataforma
  permite explicitamente que o app **consuma** conteúdo/moeda comprado em
  outro lugar. O que não pode é o app Android **empurrar** o usuário para
  comprar fora (regras de *anti-steering*).
- **Steam** exige que o que for vendido *para a versão Steam* passe pelo
  pagamento da Steam (MicroTxn ou DLC). Também não gosta de você vender chave
  ou moeda da versão Steam mais barato fora dela.

**Conclusão:** carteira **compartilhada** é permitida pelas duas.
Comprar é que é por loja. MMOs na Steam fazem exatamente isso há anos.

### Arquitetura (a boa notícia: já está 90% pronta)

O trabalho de entitlements server-side que fizemos para a Play **já é** a
arquitetura cross-store:

```
                    ┌──────────────────────────┐
   Play Billing ───▶│                          │
                    │  ent:<saveId> no KV      │◀─── mesma conta (e-mail)
   Steam MicroTxn ──▶│  { tier, credits, ... } │      em qualquer plataforma
                    └──────────────────────────┘
                          ▲            ▲
                    Android app    Desktop/Steam
                     (gasta)         (gasta)
```

O `saveId` já é derivado do e-mail. Um jogador que loga com o mesmo e-mail no
celular e no PC **é a mesma carteira**, sem nenhum trabalho adicional.

O que muda no código: `functions/api/billing.js` ganha um segundo provedor.
Hoje ele é `?action=verify` com token da Play; passa a ser
`?action=verify&provider=play|steam`, cada um com sua verificação, gravando no
**mesmo** entitlement e com a **mesma** proteção de replay (`consumedOrders`).

### A decisão de produto que sobra 🙋

O que fazer com o **desbloqueio completo** (hoje `soulmon.unlock.full`, R$29,90
não consumível na Play). Três caminhos:

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| **A. Steam pago** *(recomendo)* | A versão Steam custa um preço na loja. Quem tem o jogo na Steam = tier pago automaticamente | Natural pro público da Steam; ninguém "compra" dentro de um app que já pagou | Quem comprou na Play e quer no PC precisa comprar de novo… **ou não**: o servidor pode honrar o tier pago da Play no desktop |
| **B. Steam grátis + desbloqueio interno** | App gratuito na Steam, desbloqueio vendido por MicroTxn | Uma compra só, vale em tudo | Loja de graça converte menos; MicroTxn dá mais trabalho |
| **C. Steam grátis, só créditos** | Desbloqueio só existe na Play | Menos código | Estranhíssimo: usuário de PC obrigado a instalar um app Android pra desbloquear |

**Minha recomendação:** **A, com reciprocidade.** Steam pago (a loja faz o
trabalho de cobrança e de descoberta), *e* o servidor honra `tier: 'paid'` de
qualquer origem. Quem já pagou na Play e instalar pela Steam não paga de novo —
isso é permitido pelas duas lojas e é o que o usuário espera. Você perde uma
venda dupla e ganha em não ser odiado.

Isso precisa da sua decisão porque envolve preço e receita, não código.

### Taxas e preço (para o cálculo entrar na conta)

| Loja | Comissão | Custo fixo |
|---|---|---|
| Google Play | 15% até US$1M/ano, 30% acima | US$25 (uma vez) |
| Steam | 30% (cai a 25%/20% em volumes altos) | **US$100 por app**, reembolsável após US$1.000 em vendas |

Os preços não precisam ser iguais nas duas lojas (e provavelmente não devem).

### Dívidas conhecidas desta fase 🔧

1. **Reembolso.** Se o jogador comprar 400 créditos, gastar e pedir reembolso,
   hoje o saldo não é estornado. Play tem a *Voided Purchases API*; Steam
   reporta reembolsos no relatório de transações. Precisa de um job que leia os
   dois e debite. Não é bloqueador de lançamento, mas é dinheiro real vazando.
2. **Duas carteiras se o jogador usar e-mails diferentes** em cada loja. É
   inerente ao modelo por e-mail. Mitigação: deixar isso muito claro na tela de
   login do desktop.

---

## Fase 5 — Radar (não é v1)

- Reagir ao teclado/mouse como o Bongo Cat (hook global, `uiohook-napi`).
- Notificações nativas do Windows pelo mesmo push scheduler.
- Multi-monitor: escolher em qual tela o pet anda.
- Auto-start com o Windows (`app.setLoginItemSettings`).
- Assinatura de código (`CSC_*`) — sem isso o SmartScreen mostra "editor
  desconhecido" no instalador. Na Steam isso não aparece (a Steam distribui).
- macOS / Linux.

---

## Depende de você

Consolidado. Nada aqui eu consigo fazer sozinho.

### 🔴 Bloqueia o lançamento na Play (já estava pendente)

Ver `docs/BILLING-SETUP.md` para o passo a passo. Resumo:

1. Registrar `com.hexervoodoom.soulmon` no Firebase e trocar o
   `google-services.json` — **o build Android falha até isso ser feito** (falha
   proposital).
2. Criar os 4 produtos no Play Console com os IDs exatos.
3. Conta de serviço da Play Developer API + secrets `GOOGLE_PLAY_SERVICE_ACCOUNT`
   e `ANDROID_PACKAGE_NAME` no Cloudflare.
4. Firebase Auth: habilitar link de e-mail, registrar app Web, definir as
   `VITE_FIREBASE_*` **antes** e `FIREBASE_PROJECT_ID` **por último**.
   ⚠️ **Novo:** agora só defina `FIREBASE_PROJECT_ID` depois que a Fase 2c
   (login no desktop) estiver publicada, senão o overlay para de sincronizar.
5. Colar a URL da política de privacidade no Play Console + Data safety form.
6. Separação de infra: `docs/SEPARACAO-DIGIAPP.md`.

### 🟠 Bloqueia o lançamento na Steam

7. **Conta Steamworks** em `partner.steamgames.com` e **US$100** de taxa de
   registro do app.
8. **Reservar o App ID** e criar o Depot. Me passa os dois números — eles vão
   nos arquivos `.vdf` e no `steam_appid.txt`.
9. **Decidir a Opção A/B/C** da seção de monetização cross-store (recomendo A
   com reciprocidade).
10. **Definir os preços** — Steam e Play podem ser diferentes.
11. **Arte da loja Steam** (tamanhos exatos, exigência da Valve — eu escrevo os
    textos, mas a arte final precisa ser produzida):

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
    `steamcmd` precisa do seu login de parceiro. Eu não consigo fazer isso
    daqui — é a última milha manual.

### 🟡 Opcional, mas recomendado

14. **Certificado de assinatura de código** (~US$100–400/ano) — remove o aviso
    de "editor desconhecido" do Windows SmartScreen no instalador direto. Não é
    necessário para a Steam.
15. **Domínio próprio do Soulmon** (hoje o desktop e o APK apontam para o Pages
    do DigiApp). Está na Fase 1 do `SEPARACAO-DIGIAPP.md`.

---

## Ordem de execução recomendada

```
1. Portar overlay (Fase 1)                    ← feito nesta leva
2. Sync de leitura completa (2a)              ← eu executo
3. Extrair regras puras + escrita (2b)        ← eu executo
4. Login no desktop (2c)                      ← eu executo
   └── só DEPOIS disso: ligar FIREBASE_PROJECT_ID
5. Play Store no ar                           ← depende de 🔴
6. Steamworks + provider steam no billing     ← depende de 🟠 7-8
7. Steam no ar                                ← depende de 🟠 9-13
```

Steam **depois** da Play, de propósito: a Play já tem o código pronto e valida
a arquitetura de entitlements com usuários reais antes de a gente duplicá-la
para uma segunda loja.
