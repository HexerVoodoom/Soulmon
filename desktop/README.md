# Soulmon Desktop — pet overlay na barra de tarefas (Windows)

Versão desktop do Soulmon no estilo **Bongo Cat / Taskbar Hero**: a criatura
vive numa faixa transparente rente à barra de tarefas do Windows, **sempre por
cima de todas as janelas**, andando de um lado para o outro e soltando frases de
vez em quando. A janela é *click-through* — cliques atravessam para o que
estiver embaixo — **exceto** quando o mouse está sobre o pet.

> **Origem:** portado do overlay do DigiApp (branch
> `claude/desktop-pet-window-style-ud89ee`, que nunca foi mergeada lá).
> As diferenças de adaptação estão em `docs/PLANO-DESKTOP-STEAM.md`.

Clicar no pet abre uma **janela separada, ao lado dele** (`menu.html` +
`menu.css`): cartão flutuante com cantos arredondados e sombra, título flat com
3 botões (⚙ configurações, `_` minimizar, `✕` fechar o app):

- 🫶 **Fazer carinho** (chuva de corações; cura +0.5 ❤️, máx. 1×/dia)
- 🍎 **Alimentar** (gasta 1 comida do bolso; +1 ⚡; máx. 5/hora)
- 🚿 **Dar banho**
- 💤 **Colocar pra dormir / Acordar**

As 4 ações de cuidado ficam **numa fileira de ícones própria**, separada do
resto — tarefas e configurações são outra categoria:

- ✅ **Tarefas de hoje** — as tarefas reais do app; marcar como feita dá +1
  comida, igual no celular. **Criar, editar e apagar é no app** (a agenda
  continua sendo dona da lista).
- ⚙️ **Configurações** — conta, saldo, idioma PT/EN, abrir o Soulmon completo

Na bandeja do sistema: mostrar/ocultar o pet, abrir o menu, abrir o Soulmon
completo e sair.

## ⚠️ Duas coisas que valem saber antes de mexer

1. **A criatura não se escolhe aqui.** No DigiApp o desktop tinha uma grade com
   todos os Digimons para escolher na mão. No Soulmon **cada jogador tem uma
   linha evolutiva única**, gerada pelo oráculo no onboarding — a forma vem do
   save sincronizado, sempre. Por isso o e-mail é o controle central das
   Configurações, não um extra.
2. **O desktop é um controle remoto, não um segundo jogo.** Carinho, comida e
   marcar tarefa escrevem no save real; criar/editar/apagar tarefa e tudo mais
   é no app. As regras vêm de `src/utils/careRules.ts`, importadas pelo app do
   celular E por aqui — não existe uma segunda implementação.

## Rodar em desenvolvimento (Windows)

```bash
cd desktop
npm install
npm run dev        # builda o renderer (Vite) e abre o Electron
```

Para só conferir o renderer sem Electron (Linux/CI serve), dá para usar o Vite
da raiz — foi assim que a verificação visual deste port foi feita:

```bash
npx tsc --noEmit -p desktop/tsconfig.json
npx vite build -c desktop/vite.config.ts
```

## Gerar o instalador

```bash
cd desktop
npm run dist            # gera o NSIS installer em desktop/release/ (não publica)
npm run dist:publish    # idem, e publica/atualiza o GitHub Release (fonte do auto-update)
```

Também há CI, e desde 26/08/2026 são **dois arquivos**, porque **build e
publicação foram separados de propósito**:

| Workflow | Dispara em | Faz | `permissions` |
|---|---|---|---|
| `.github/workflows/desktop-build.yml` | push na **`main`** (só quando `desktop/**`, `src/utils/sprites.ts`, `src/assets/**` ou o próprio workflow mudam) + `workflow_dispatch` | builda com `--publish never` e sobe o `.exe` como **artefato de Actions** (retido 30 dias). **NÃO cria nem atualiza Release.** | `contents: read` |
| `.github/workflows/desktop-release.yml` | **só** push de tag `v[0-9]+.[0-9]+.[0-9]+` (`v1.2.3` entra; `v1.2`, `v1.2.3-beta` e `vqualquercoisa` NÃO) | `electron-builder --publish always` → cria/atualiza o **GitHub Release**, que é a fonte do auto-update | `contents: write` |

⚠️ **Este parágrafo dizia "builda no push (quando `desktop/**` ou os sprites
mudam), publica/atualiza um GitHub Release".** A parte do "publica" ficou falsa
na separação. E o que ela descrevia era o defeito que motivou a separação:
enquanto publicar era efeito colateral de commitar, um push numa branch de
rascunho (`claude/ui-layout-z-index-coth3e` estava na lista de gatilhos) virava
**atualização automática instalada na máquina de quem tem o desktop** — sem
assinatura Authenticode (`CSC_IDENTITY_AUTO_DISCOVERY: 'false'`), então o
updater não tinha como validar a origem do que instalava.

A separação é em **dois arquivos** e não em dois jobs porque o poder de publicar
acompanha o `permissions:` do ARQUIVO: um arquivo que nunca dispara em branch
não tem como publicar por acidente.

**Para publicar hoje: empurre a tag de versão.** Não há `workflow_dispatch` no
release, e a ausência é escolha — um botão "publicar" que roda sobre qualquer
ref é exatamente o efeito colateral que a separação eliminou.

O filtro de caminhos do `desktop-build.yml` **não** cobre a família de regras de
cuidado que o overlay importa (`careRules`, `careUpdaters`, `playerDay`,
`restWindow`, `poopDrain`) — de propósito: quem cobre isso é o `ci.yml`, que roda
`npx tsc -p desktop/tsconfig.json --noEmit` em **todo PR** e em todo push da
`main`, sem filtro de paths e sem runner Windows.

**Auto-update**: `electron-updater` baixa a versão nova sozinho em segundo plano
e instala na próxima vez que o app fechar (`autoInstallOnAppQuit`). O updater só
considera "nova" uma versão cujo número seja maior que o instalado — **bump o
campo `version` em `desktop/package.json`** antes de **criar a tag** que deva
chegar como atualização. (Dizia "antes de um push"; desde a separação nenhum
push publica.) O número da tag e o `version` do `package.json` precisam
concordar — quem lê o `latest.yml` é o updater, e ele compara o `version`.

**Steam**: `npm run dist:steam` gera um build alternativo (pasta desempacotada,
sem publicar no GitHub) com o auto-update via GitHub desligado — nessa variante
quem distribui e atualiza é o SteamPipe. Ver `STEAM.md`.

## Arquitetura

```
desktop/
├── electron/
│   ├── main.js          # overlay (transparente, always-on-top, click-through) + menu + bandeja + auto-update + sessão de auth
│   ├── preload.js       # expõe window.soulmonDesktop nas janelas do overlay/menu
│   └── auth-preload.js  # expõe window.soulmonDesktopAuth NA JANELA DO APP WEB (ponte de login)
└── renderer/
    ├── index.html       # janela do overlay (faixa que anda)
    ├── menu.html        # janela de menu
    └── src/
        ├── main.ts      # overlay: caminhada, balão de falas, escuta efeitos/updates
        ├── menu.ts      # janela de menu: painéis (ações/tarefas/configurações)
        ├── menu.css     # visual da janela de menu
        ├── style.css    # estilos do overlay (pet/balão/fx)
        ├── config.ts    # URL do app + chave do localStorage
        ├── state.ts     # estado local (localStorage soulmon_desktop_v1)
        ├── cloudSync.ts # leitura do GameState via /api/save?id=sha256('soulmon:'+email)
        ├── phrases.ts   # falas PT-BR + EN
        └── sprites.ts   # reaproveita getSpriteForStage() de src/utils/sprites.ts
```

Overlay e menu são **janelas/processos separados** — só se falam por IPC via
`window.soulmonDesktop`: `state-changed` avisa a outra janela pra recarregar o
localStorage; `pet-effect` manda o menu pedir pro overlay tocar a animação de
uma ação (o pet visível é a faixa; a janela de menu não anima nada sozinha).

Pontos técnicos:

- A faixa cobre a largura do monitor primário, ancorada no topo da barra de
  tarefas (`screen.workArea`). Reposiciona sozinha se a resolução ou a barra
  mudarem (`display-metrics-changed`).
- `setIgnoreMouseEvents(true, { forward: true })` mantém o overlay
  atravessável; o renderer detecta *hover* sobre `[data-hit]` (o pet) e liga a
  interatividade via IPC. O `forward: true` é um recurso do **Windows** — por
  isso o alvo v1 é só Windows.
- A janela de menu usa `frame: false` + `transparent: true` — o cartão
  arredondado com sombra é desenhado em CSS sobre a janela transparente (por
  isso a janela Electron é maior que o cartão visível: sobra pra sombra não
  ficar cortada). Arrasta pela barra de título via `-webkit-app-region: drag`.
  Abre centrada no pet, encostada logo acima do sprite.
- **Orientação do sprite**: a maioria dos sprites do jogo olha para a DIREITA;
  os de `LEFT_FACING_STAGES` são a exceção. O overlay espelha só quando a
  direção do movimento discorda da orientação natural (`facesLeft()` em
  `sprites.ts`). No DigiApp era o contrário — lá todos olhavam pra esquerda.
- `sprites.ts` importa `getSpriteForStage` de `../../../src/utils/sprites.ts` —
  precisa do alias `figma:asset/<hash>.png`, gerado automaticamente em
  `vite.config.ts` a partir dos arquivos hash-nomeados em `src/assets/` (evita
  duplicar a lista gigante do `vite.config.ts` da raiz).

### Login (por que existe a `auth-preload.js`)

Quando `FIREBASE_PROJECT_ID` estiver definido no Cloudflare, **todas** as rotas
de API passam a exigir um ID token do Firebase. O overlay não tem SDK de auth
próprio — e um fluxo de link de e-mail dentro de uma janela sem barra de
endereço seria péssimo. Então:

1. "Abrir Soulmon completo" abre o app web numa `BrowserWindow` com
   `auth-preload.js` e partição persistente (`persist:soulmon-app`).
2. O app web detecta a ponte (`window.soulmonDesktopAuth`) e, via
   `onIdTokenChanged`, publica o token — cobrindo login, logout **e** a
   renovação de hora em hora (ver `startDesktopAuthBridge` em
   `src/utils/auth.ts`).
3. O processo principal guarda o token **só em memória** e o entrega ao
   renderer via `soulmonDesktop.getAuth()`.
4. `cloudSync.ts` manda `Authorization: Bearer`. Um 401/403 vira
   `unauthenticated` e a UI abre o app completo pra logar — em vez de dizer
   "save não encontrado" e mandar o usuário caçar o problema no lugar errado.

Enquanto `FIREBASE_PROJECT_ID` não existir, tudo funciona sem token (modo de
migração de `functions/api/_auth.js`).

## 📡 Radar / Roadmap

Ver `docs/PLANO-DESKTOP-STEAM.md` para o plano completo (inclui Steam e a
carteira cross-store). Resumo do que falta aqui:

### Escrita de volta

Feito para as ações de cuidado (`pushCareAction` em `cloudSync.ts`): relê o save
antes de escrever, aplica a regra compartilhada e grava. Duas proteções que não
são opcionais:

- **Reler antes de escrever.** O KV é last-write-wins; montar o estado a partir
  do cache local apagaria o que o celular fez desde a última sincronização.
- **`isSaneCareState` aborta a gravação** se a mutação gerar número inválido.
  `JSON.stringify(NaN)` vira `null`, e gravar isso apaga o progresso em
  silêncio — foi exatamente o que aconteceu num save sem `maxHealthPoints`
  durante o desenvolvimento.

Cobre carinho, comida e conclusão de tarefa. Falta só merge por seção, se um
dia houver edição simultânea de verdade.

### Outras ideias

- Reagir ao teclado/mouse como o Bongo Cat (hook global, ex.: `uiohook-napi`).
- Notificações nativas do Windows pelo mesmo push scheduler.
- Multi-monitor: escolher em qual tela o pet anda.
- Auto-start com o Windows (`app.setLoginItemSettings`).
- Assinatura de código (`CSC_*`) pra sumir com o aviso de "editor desconhecido"
  do SmartScreen — hoje o build é intencionalmente não assinado (na Steam isso
  não aparece).
- macOS/Linux depois (o `forward: true` do click-through é Windows-only).
