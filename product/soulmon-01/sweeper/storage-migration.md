# Migração do `localStorage` para o `safeStorage` — de fix por arquivo a fix por regra

> Papel: `staff-frontend`. Escopo: **só `src/`** (+ o teste que criei).
> Nada commitado, nada empurrado. Nenhum teste existente afrouxado.
> `workers/`, `functions/` e os testes dessas áreas não foram tocados.

## 0. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **57 arquivos · 735 testes · 735 passam · 0 falham** (revalidado no fim: **58 · 753 · 753 passam** — o outro agente seguiu somando testes no mesmo tree) |
| Build | `npm run build` | **112/112 PNG→WebP (−7,08 MB)**, `✨ Compiled Worker successfully` |

Baseline no início desta sessão: **53 arquivos / 685 testes**. Os 685 continuam
verdes. Dos +50 casos, **12 são meus** (`safeStorage.guard.test.ts`); os outros
~38 vieram do outro agente, que estava trabalhando em paralelo no mesmo working
tree (`workers/`, `functions/`, `src/utils/dailyReset.ts`). Durante a sessão vi
**um** vermelho transitório dele
(`workers/push-scheduler.test.js > quem escolheu EN recebe TÍTULO...`), que já
estava verde no fim; nenhum dos meus arquivos participa desse teste.

---

## 1. O que estava errado (e por que não era "faltou um arquivo")

A rodada 3 criou `src/utils/safeStorage.ts` porque `QuotaExceededError` dentro
de um efeito do React **desmonta a árvore** — tela branca, não perda silenciosa.
A rodada 4 mediu **122 chamadas cruas restantes** e mostrou o dano concreto: a
adoção de save da nuvem gravava a **identidade antes do dado**; com storage
cheio o app trocava de `saveId` sem o save, e o cloud save seguinte sobrescrevia
o save do outro aparelho.

A causa de as 122 terem sobrevivido não foi desatenção — foi **a API ser rasa
demais**. `readLocal`/`writeLocal`/`removeLocal` só cobriam string pura. Todo
call site que precisava de JSON, booleano ou número teria que reimplementar o
`try/catch` em volta do `JSON.parse` — e migrar ficava mais caro do que deixar
como estava. Enquanto a forma correta for mais cara que a errada, a regra não
pega.

Então **estendi a camada primeiro** e migrei depois.

### API acrescentada (`src/utils/safeStorage.ts`)

| forma | por que existe |
|---|---|
| `readJson<T>(key, fallback)` | tira o `JSON.parse` cru de 9 call sites; JSON torto vira `fallback`, nunca exceção |
| `writeJson(key, value, opts?)` | par simétrico; recusa valor não serializável sem lançar |
| `readFlag` / `writeFlag(key, on, opts?)` | o app grava booleano como `'true'`/`'false'` em 11 chaves |
| `readNumber(key, fallback)` | `Number(getItem(...)) || 0` estava copiado em 3 lugares (e `|| 0` engolia `NaN` por acaste, não por decisão) |
| `WriteOptions { silent }` | ver §2 — é a separação entre "falhar calado" e "avisar" |

Nenhuma chave literal nova: tudo continua vindo de `storageKeys.ts`. Aproveitei
para **matar 3 literais que ainda existiam**: `'digiapp-rub-hint-shown'`
(`CompanionHUD`), `'digiapp-language'` (`ErrorBoundary`) e `'digiapp-sound-muted'`
(`sounds.ts`) — as três agora usam `STORAGE_KEYS`.

---

## 2. Como separei "falhar calado" de "avisar o usuário"

O aviso ao usuário é **um recurso escasso por desenho**: `notified` é global e o
listener dispara **uma única vez** por sessão (storage cheio falha em toda
gravação seguinte; um toast por gravação seria uma segunda falha em cima da
primeira). Trocar tudo por `writeLocal` cego teria um efeito perverso: o
**primeiro** toggle de tema que falhasse queimaria o aviso, e a falha que
importa — o save — chegaria depois **em silêncio**.

Daí `{ silent: true }`. Ele **continua registrando no console** (quem depura às
3h precisa ver a chave e o nome do erro) e **não gasta** o aviso.

**A pergunta que usei em cada call site:** *se isto não gravar, o usuário perde
algo que ele fez, ou algo que ele escolheu?*

| Perde o que **fez** → **AVISA** (padrão) | Perde o que **escolheu** → **silent** |
|---|---|
| `SAVE_ID` (identidade), `GAME_STATE`, `USER_EMAIL` | `THEME`, `LANGUAGE`, `SOUND_MUTED`, `AI_SETTINGS` |
| `SOULMON_PROFILE` (seed do reroll — **pago em Créditos**) | `AUTO_SLEEP_*`, `IS_SLEEPING` |
| `FOOD_FEED_TIMES` (teto de 5/h), `RUB_HEAL_DAY` (teto de cura/dia) | `PWA_INSTALL_DISMISSED`, `NOTIFICATION_PROMPT_DISMISSED` |
| `DUNGEON_DIFFICULTY`, `DUNGEON_BEST`, `DUNGEON_HEART_DROPS`, `DINO_BEST` | `RUB_HINT_SHOWN`, `DAILY_REPORT_SHOWN`, `TUTORIAL_COMPLETE` (auto-adoção) |
| `DEMO_TASKS_CREATED_TODAY` (cap do modo grátis) | `PROTECT_PROMPT_AT`, `DAILY_NOTIFICATION_CHECK`, `FCM_TOKEN` |
| `SCHEDULED_NOTIFICATIONS` (lembrete que o usuário **pediu**) | `ORACLE_FORM` (rascunho de formulário) |
| `USER_NAME` + `ONBOARDING_COMPLETE` (refazer o ritual) | `FIRST_TASK_POPUP_SHOWN` |

Três casos de fronteira, com o critério explícito:

- **`SCHEDULED_NOTIFICATIONS` avisa.** É preferência na aparência, mas o efeito
  de perder é o app **deixar de avisar sem dizer que deixou** — o usuário confia
  num lembrete que não vai chegar.
- **`DAILY_REPORT_SHOWN`/`TUTORIAL_COMPLETE` são silenciosos.** O pior caso é
  uma tela **reaparecer**, nunca um dado sumir.
- **`FOOD_FEED_TIMES` avisa** apesar de parecer bobagem: é o teto de 5 comidas
  por hora, ou seja, **regra de economia**. Perder em silêncio é o jogo mudar de
  regra sem contar.

E um caso onde nem avisar bastava: `sendLoginLink` (§3.2).

---

## 3. Chamadas migradas, por arquivo

**104 chamadas cruas** de `getItem`/`setItem`/`removeItem` (as 5 linhas restantes
que o `rg` contava eram **comentários** que explicam o bug — ver §4).

| arquivo | chamadas |
|---|---|
| `src/App.tsx` | **52** |
| `src/utils/notifications.ts` | 11 |
| `src/components/SettingsPage.tsx` | 8 |
| `src/utils/dungeon.ts` | 7 |
| `src/components/WelcomePromptModal.tsx` | 4 |
| `src/utils/auth.ts` | 3 |
| `src/utils/sounds.ts` · `monetization.ts` · `ThemeContext.tsx` · `LanguageContext.tsx` · `SoulmonOnboarding.tsx` · `OraclePage.tsx` · `InstallPrompt.tsx` · `DinoGame.tsx` · `CompanionHUD.tsx` | 2 cada (18) |
| `src/utils/entitlements.ts` · `aiClient.ts` · `ErrorBoundary.tsx` | 1 cada (3) |
| **total** | **104 → 0** |

### 3.1 Dois defeitos reais que apareceram na varredura

**🟠 O login por link de e-mail ainda trocava a IDENTIDADE sem o DADO**
(`src/App.tsx`, retorno do `completeLoginFromLink`). Era **exatamente** o achado
§3 da rodada 4 — e este era o **quinto** call site, que passou batido no fix dos
quatro. Fazia:

```js
localStorage.setItem(USER_EMAIL, res.email);
localStorage.setItem(SAVE_ID, id);      // identidade nova, save local ANTIGO
window.location.reload();
```

Sem buscar o save da nuvem: o app recarregava apontado para o `saveId` novo com
o `GAME_STATE` do aparelho antigo, e o debounce de 3 s subia esse estado por
cima do save do outro aparelho. Agora faz `cloudLoad` + `adoptCloudSave` (dado
antes da identidade, nunca lança) e, quando não há save na nuvem, só troca a
identidade **se a gravação persistiu**.

**🟠 `sendLoginLink` podia mandar um link que nunca completa** (`src/utils/auth.ts`).
O `PENDING_LOGIN_EMAIL` era gravado **depois** de o Firebase mandar o e-mail. Com
storage cheio, o usuário recebia o link, clicava, e o retorno caía em
`missing-email` — sem explicação, e sem caminho de volta. Agora grava **antes** e
devolve `{ ok: false, error: 'storage' }` se não conseguiu; o
`SoulmonOnboarding` já tem o ramo de erro que mostra a mensagem. Aqui não bastava
"avisar depois": a ordem é que estava errada, e é a mesma lição do `adoptCloudSave`.

### 3.2 Um footgun documentado, fechado de passagem

`SettingsPage.tsx` gravava `AUTO_SLEEP_ENABLED` **dentro do updater do
`setState`** — o footgun nº 6 do `CLAUDE.md` (StrictMode invoca 2×), apontado
como observação na rodada 4 §7. A gravação saiu do updater.

---

## 4. Exceções que ficaram

**Uma só**, declarada na lista do guard:

| arquivo | por quê |
|---|---|
| `src/utils/safeStorage.ts` | É o **dono da regra**: o único lugar que pode tocar `localStorage`, porque é ele que embrulha o `try/catch` que todo o resto consome. |

Fora da lista, o guard **ignora comentários** e **arquivos de teste**:

- **Comentários** (`cloudSave.ts:72-73`, `ErrorBoundary.tsx:25`,
  `test/renderEnv.tsx:103-104`): são os comentários que **explicam** o bug. Um
  guard que ficasse vermelho por causa deles ensinaria a apagar a explicação —
  que é justamente a parte que impede o bug de voltar. Há caso provando que o
  removedor de comentários **não** engole código depois de um comentário.
- **`*.test.ts(x)` e `src/test/`**: montam storage falso de propósito — inclusive
  os que **provam** que o `safeStorage` sobrevive a um storage hostil.

A lista tem um teste próprio (`toEqual(['utils/safeStorage.ts'])`): **crescer ali
quebra o teste de propósito**. Exceção nova exige olhar o caso — e, na maioria
das vezes, a resposta certa vai ser estender a API, não abrir exceção.

---

## 5. O guard e a prova de que ele enxerga

`src/utils/safeStorage.guard.test.ts` — **12 casos**, dois blocos:

1. **O guard** varre `src/**/*.{ts,tsx}` (recursivo, real `readdirSync`), tira
   comentários e falha em qualquer `localStorage` seguido de `.`, `?.` ou `[`.
   A mensagem de erro lista arquivo:linha e diz o que fazer ("use safeStorage ou
   **estenda a API**").
2. **As formas derivadas** (`readJson`/`writeJson`/`readFlag`/`readNumber`/`silent`),
   testadas contra um storage falso que realmente lança `QuotaExceededError`.

### Autoverificação (guard sem prova passa pelo motivo errado — já aconteceu 2× aqui)

Quatro camadas, todas medidas:

- **A regex enxerga as formas cruas**: `localStorage.setItem`, `.getItem`,
  `.removeItem`, `window.localStorage.…`, `localStorage?.getItem`,
  `localStorage['x']` → todos `true`. E **`globalThis.localStorage` também conta**
  — se não contasse, bastava prefixar para escapar do guard (é por isso que o
  `safeStorage` precisa ser exceção nominal, e não escapar por acaso da regex).
- **A regex não acusa a forma correta**: `writeLocal(...)`, `readJson<number[]>(...)` → `false`.
- **O varredor lê arquivos de verdade**: exige >50 arquivos e a presença de
  `utils/safeStorage.ts` e `App.tsx` na lista — sem isso, um varredor que
  devolvesse `[]` passaria para sempre.
- **Controle negativo da exceção**: o teste afirma que o conteúdo de
  `safeStorage.ts` **casa** com a regex. Ou seja, a exceção é *necessária* — não
  é uma entrada decorativa numa lista.

### Prova de ponta a ponta (injeção real, medida)

Injetei uma chamada crua num arquivo de produção e rodei:

```
+ export function _tmp(){ return localStorage.getItem("x"); }   → src/utils/sounds.ts

Tests  1 failed | 11 passed (12)
  utils/sounds.ts:155  export function _tmp(){ return localStorage.getItem("x"); }
```

Revertido o arquivo: `Tests 12 passed (12)`. **Vermelho com a chamada, verde sem
ela** — verificado nas duas pontas, não afirmado.

O teste da API também tem autoverificação do **instrumento**: antes de afirmar
que `writeJson` devolve `false`, o caso prova que o storage falso
**realmente lança** (`expect(() => localStorage.setItem(...)).toThrow(/cheio/)`).
Sem isso, o caso passaria com um storage que nunca falha.

E há um caso travando a política de §2: com storage cheio, uma gravação
`silent` **não** dispara o listener e **não** consome `storageNoticeSent()`,
mas uma gravação normal logo em seguida **dispara** — e só uma vez.

---

## 6. Verificação de comportamento (Playwright)

`E:/pw` com `PLAYWRIGHT_BROWSERS_PATH=E:/pw/browsers`, interop CJS no import,
contra `npx vite preview` (`BROWSER=none`, senão o `open: true` do
`vite.config.ts` atrapalha), semeando o storage com `addInitScript` — footgun 7.

**Verificado:**
- Save estabelecido (atividade, rookie, 3 HP, 120 Bits): o app **monta normal**,
  relatório diário abre, HUD/energia/rodapé intactos. `digiapp-save-id` gerado,
  `digiapp-language` preservado, **zero `pageerror`** (só dois 404 de recurso,
  pré-existentes do preview).
- **Preferências com JSON corrompido** (`digiapp-ai-settings = '{{{corrompido'`,
  `digiapp-food-feed-times = 'nao-e-json'`, `digiapp-rub-heal-day = '[[['`): o app
  **monta igual**, sem `pageerror`. Antes, `AI_SETTINGS` era `JSON.parse` cru
  **dentro do inicializador do `useState`** — teria derrubado a árvore. Os dois
  screenshots são visualmente idênticos.

**NÃO verificado por navegador** (e não vou fingir que foi):
- O caminho do **login por link de e-mail** (§3.1) — exige Firebase configurado e
  um clique em link real de e-mail; está coberto só pelos testes de unidade do
  `adoptCloudSave` que já existiam.
- **Storage realmente cheio** num navegador de verdade (~5 MB na origem
  compartilhada); o teste usa storage falso que lança `QuotaExceededError`, que é
  o mecanismo, não a condição.
- Android/WebView e o overlay Electron.

---

## 7. Arquivos tocados

```
NOVO
  src/utils/safeStorage.guard.test.ts     (12 casos: guard + API, com autoverificação e prova de injeção)

ALTERADOS
  src/utils/safeStorage.ts                (+ readJson/writeJson/readFlag/writeFlag/readNumber, WriteOptions.silent)
  src/App.tsx                             (52 chamadas; + o 5º call site de adoção de save)
  src/utils/notifications.ts              (11)
  src/components/SettingsPage.tsx         (8; + footgun 6 fechado)
  src/utils/dungeon.ts                    (7)
  src/utils/auth.ts                       (3; + ordem gravar→enviar link)
  src/components/WelcomePromptModal.tsx   (4)
  src/utils/{sounds,monetization,entitlements,aiClient}.ts
  src/contexts/{ThemeContext,LanguageContext}.tsx
  src/components/{SoulmonOnboarding,OraclePage,InstallPrompt,DinoGame,CompanionHUD,ErrorBoundary}.tsx
  dist/**                                 (subproduto do `npm run build`)
```

`src/index.css`, assets, `.github/`, `workers/`, `functions/` e testes existentes:
**não tocados**.

---

## 8. O que fica aberto

- **`src/utils/dailyReset.ts` aparece no diff do working tree mas não é meu** —
  é do agente do guard de duplicação de regra, que estava no mesmo tree.
- **`desktop/renderer/`** tem storage próprio e ficou fora do escopo (é outro
  bundle). Se ele ganhar persistência local, precisa de um `safeStorage`
  equivalente ou do mesmo guard apontado para lá — vale um item de rodada.
- **O guard olha `src/`, não `functions/`/`workers/`** (que nem têm
  `localStorage`). Se algum dia o desktop entrar, estenda o `SRC` do varredor em
  vez de duplicar o teste — duplicar guard é o footgun 9 aplicado ao próprio
  guard.
