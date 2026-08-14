# Rodada 3 — fechamento de backend

> Papel: `staff-backend`. Alvo: B-2/B-3 (`round2-structural.md`), N-3/N-7/R-8
> (`security-verification.md`), O-8 e o item 10 da lista mínima (`skeptic-review.md`),
> e o smoke do APK. **Nada commitado, nada empurrado. Nenhum teste existente foi
> afrouxado; dois foram REESCRITOS para a garantia nova, como o próprio round 2
> instruía.** `FIREBASE_PROJECT_ID`, D1 `order_claims` e
> `PLAY_REQUIRE_ACCOUNT_BINDING` continuam intocados.

---

## 0. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **49 arquivos · 651 testes · 651 passam · 0 falham** (baseline 44/600). **+5 arquivos, +51 casos** |
| Build | `npm run build` | **✓ built in 3,59s**, 112/112 PNG→WebP (−7,08 MB), `✨ Compiled Worker successfully` |
| Bundle | — | `index-*.js` **391,17 kB** · `vendor` 141,72 kB (inalterado) · `index-*.css` **90,65 kB**. O +1,87 kB de JS é meu (`safeStorage` + guardas do provider); o CSS não é (não toquei em `index.css`) |
| CSP no navegador | Chromium real sobre o `dist/` com os headers do `_headers` aplicados | **0 violações, 0 erros de console**, service worker registrado, app chega ao onboarding — §4 |

---

## 1. B-2 / B-3 — o storage deixou de derrubar o app

### O que era

`GameStateContext.tsx:359` fazia `localStorage.setItem` dentro de um `useEffect`
**sem `try/catch`**: `QuotaExceededError` subia pelo React e **desmontava a
árvore**. E o `try/catch` da carga (`:243`) cobria **uma linha** — `:249`, `:304`,
`:368`, `:371`, `:381`, `:382` liam/gravavam fora dele e lançavam `SecurityError`
com storage bloqueado (Safari em modo privado, WebView com storage desabilitado).

### O que mudou

| Arquivo:linha | Mudança |
|---|---|
| `src/utils/safeStorage.ts` (**novo**, 130 linhas) | `readLocal` / `writeLocal` / `removeLocal` — **nunca lançam**; `onStorageDegraded` entrega **um** aviso por sessão; `storageDegradedMessage` com par PT/EN e texto diferente para cota vs. storage bloqueado; log estruturado (`kind`, `key`, `error`) throttled por chave |
| `src/contexts/GameStateContext.tsx:245-252` | `hydrateSave()` extraída — a migração do save vira expressão que o inicializador consegue embrulhar |
| `src/contexts/GameStateContext.tsx:307-311` | `freshGameState()` extraída — é o fallback de QUALQUER falha de carga |
| `src/contexts/GameStateContext.tsx:361-370` | O provider registra o avisador (toast, 10 s, no idioma do usuário) |
| `src/contexts/GameStateContext.tsx:372-407` | Inicializador refeito: leitura por `readLocal`, **save que não é objeto é recusado** (array/primitivo viravam `{}` e apagavam tudo em silêncio), `hydrateSave` embrulhada em `try/catch` com `console.error` contextualizado |
| `src/contexts/GameStateContext.tsx:410-413, 422-428, 435-436` | Persistência e leituras de `SAVE_ID`/`USER_NAME`/`LANGUAGE` por `writeLocal`/`readLocal` |

**A escolha que importa:** não engoli o erro. O round 2 recusou o fix justamente
porque "engolir troca queda por perda silenciosa, que é pior no moat" — está
certo, e por isso **o aviso ao jogador é parte do fix**, não um extra. O jogo
continua em memória e a pessoa sabe que não está sendo salvo. Uma vez, não a
cada gravação (um storage cheio falha em toda escrita seguinte; um toast por
escrita seria uma segunda falha em cima da primeira).

**Detalhe que só apareceu ao rodar:** a primeira falha acontece **antes** de
existir quem avise — o provider lê o save dentro do inicializador do `useState`,
que roda antes de qualquer efeito. Sem uma fila de um item (`pending` em
`safeStorage.ts:29`), justamente o caso mais grave (storage bloqueado no boot)
sairia **sem aviso nenhum**. O teste do §1 mede isso.

### Testes

- `src/contexts/GameStateContext.storage.test.tsx` (**novo**, 11 casos): a camada
  isolada (não lança na leitura, na escrita nem no remove; aviso único mesmo com
  N falhas; listener que explode não derruba quem gravou; par PT/EN e **EN sem
  acento**, que é o bug do push das 22h) + o provider montado (storage cheio →
  monta, três atualizações andam em memória, `gamePoints` chega a 13, **1** aviso;
  storage bloqueado → monta em `rookie` e avisa; aviso em PT quando o idioma é PT;
  save `[1,2,3]` não vira estado vazio; **storage funcionando continua
  persistindo** — o fix não desligou a gravação).
- `src/contexts/GameStateContext.hostile.test.tsx:79,103` — os dois casos que
  afirmavam o comportamento **de hoje** (`expect(() => montar()).toThrow(...)`)
  foram reescritos para a garantia nova, exatamente como o comentário deles
  mandava. Não é afrouxamento: o `toThrow` virou asserção de que o app **monta e
  fica jogável**, que é uma exigência estritamente mais forte.

---

## 2. Teto de requisição por IP (R-8 / O-8) — custo, não segurança

### O que foi feito

| Arquivo:linha | Mudança |
|---|---|
| `functions/api/_rateLimit.js` (**novo**) | Janela deslizante **em memória do isolate**, `Map` com teto de 5000 chaves e varredura preguiçosa; IP de `CF-Connecting-IP` (reescrito pela borda, não forjável por trás do proxy); `tooManyRequests()` sempre com `Retry-After` |
| `functions/api/community.js:52-66` | Duas classes de cota: **20/min/IP** para `players`/`opponents`/`rank`/`seasonResult` (as que varrem até 300 chaves) e 120/min/IP para o resto |
| `functions/api/community.js:145-190` | `onRequest` virou portão (teto → cache → handler); o roteador original virou `handleCommunity`. **Nenhuma regra de autorização mudou de lugar** |
| `functions/api/community.js:161-186` | **Cache de borda** (`caches.default`, 60 s) para `players`/`rank`/`seasonResult` — respostas públicas e iguais para todo mundo. Cada acerto é uma varredura de 300 chaves de KV que não acontece. `opponents` (aleatório) e `player` (cardinalidade alta) ficam de fora |
| `functions/api/subscribe.js:6-19, 22-23, 105-107` | **10/min/IP** no POST e no DELETE |
| `functions/api/subscribe.js:57-90` | Escrita condicional: reenviar a MESMA inscrição não gasta escrita de KV (o cliente reenvia a cada abertura do app) |

**Por que não um contador em KV** (foi pedido explicitamente, e concordo): custaria
uma escrita por requisição — multiplicaria o problema — e KV é eventualmente
consistente, então nem contaria certo.

**O que este teto NÃO é, com todas as letras:** o contador vive na memória de cada
isolate. A Cloudflare roda N isolates em M colos, então o teto real é
`limite × isolates vivos`. Isso derruba a ordem de grandeza de um abuso vindo de
uma máquina (que é o cenário de custo) e **não para um distribuído**. É
amortecedor de custo, não controle de segurança — está escrito no cabeçalho do
módulo para ninguém confundir depois.

**Armadilha que evitei no `subscribe`:** o TTL é de 1 ano e só renova na escrita.
Se a comparação sozinha decidisse, um jogador ativo com inscrição inalterada
**perderia o push no aniversário dela**, em silêncio — o pior modo de falha deste
canal. Por isso a gravação também acontece quando o registro passa de 30 dias
(`refreshedAt`), e há um caso de teste só para isso.

### Testes

- `functions/api/_rateLimit.test.js` (**novo**, 9 casos): origem do IP; **sem
  header não limita** (falha aberto de propósito — derrubar o app por um header
  ausente seria pior que o risco tratado); janela desliza; IPs e baldes não se
  misturam; 6000 IPs rotativos não fazem o limitador virar vazamento de memória.
- `functions/api/costCeiling.test.js` (**novo**, 11 casos): a 21ª varredura é 429
  **e não custa nenhuma leitura de KV** (medido no contador do KV falso, não na
  resposta); o 429 mantém CORS (senão o app vê "erro de rede" e nunca o 429); ação
  leve segue atendida; outro IP não é afetado; a 11ª inscrição é 429 **sem
  gravar**; reenvio idêntico → **1** escrita de KV para 3 chamadas; mudança real de
  idioma **ainda grava**; registro de 40 dias é reescrito para renovar TTL;
  endpoint fora da allowlist continua recusado antes de qualquer escrita.

### O que fica pendente por falta de recurso provisionado

**Teto exato e global exige Durable Object ou o binding de Rate Limiting da
Cloudflare — nenhum dos dois está provisionado neste projeto**, e provisionar é
mudança de `wrangler.toml`/painel, ou seja decisão do dono. Não fiz. O que existe
hoje reduz o custo de pico e deixa registro (`console.warn` com `action` e
`retryAfter`); o que **não** existe é garantia contra um abuso distribuído.

---

## 3. N-3 — o caminho REAL do texto livre até o Groq

Verifiquei antes de mexer. **O `investor-skeptic` (O-7) está certo e o relatório de
segurança está errado neste ponto.** O caminho real, hoje:

| # | Origem | Rota | Chega ao Groq? |
|---|---|---|---|
| **1** | `src/components/ChatBox.tsx:127` → `message` = **o que o usuário digita para o pet** | `aiClient` → `functions/api/chat.js:96` | **Sim, verbatim.** É a maior superfície de texto livre do produto e o relatório **não a nomeou** |
| 2 | `src/components/GameTutorialFlow.tsx:108,149` → `goalText`, **estado local do tutorial** | `src/utils/taskSuggestions.ts:23` → `functions/api/suggest-tasks.js:50` | Sim |
| 3 | `src/components/CompanionHUD.tsx:298,338` | `/api/chat` | **Não** — manda só template nosso (`[ALEATÓRIO] Diga algo espontâneo…`), zero texto do usuário |
| 4 | `soulGoal` / `soulStruggle` (`GameStateContext.tsx:195-196`) | `cloudSave.ts` → `functions/api/save.js` → KV, TTL 365 d | **NÃO chegam ao Groq.** Grep confirma: zero ocorrências em `taskSuggestions.ts`, em `chat.js` e em qualquer corpo enviado ao Groq. Os únicos consumidores são `DailyReportModal.tsx:122` e `StatsPage.tsx:192`, ambos locais |

Ou seja: a cadeia citada em N-3 (`GameTutorialFlow → taskSuggestions` carregando
`soulGoal`) **não existe**. O achado LGPD sobrevive — há texto livre indo a
processador nos EUA — mas a fonte principal é o **chat**, não o onboarding da
alma. Registro isso porque a diferença muda quem precisa de aviso e onde.

### O que mudou

| Arquivo:linha | Mudança |
|---|---|
| `functions/api/_redact.js` (**novo**) | `minimizeForAi(texto, teto)` — remove **identificadores diretos** (e-mail, URL, CPF, CNPJ, telefone, sequência longa de dígitos, @perfil), corta no teto e devolve **contagem por tipo** para log |
| `functions/api/chat.js:90-107` | Mensagem do usuário minimizada e limitada a 500 chars antes de sair; `customKeywords` (texto livre que entra no *system prompt*) minimizado em 120; `petName` limitado a 40 |
| `functions/api/chat.js:115-116, 131-141` | O Groq passa a receber `safeMessage`; a detecção de "criar atividade" também |
| `functions/api/suggest-tasks.js:28-36` | `goalText` minimizado antes do envio |

O log registra **só contagem por tipo** (`{redactions: {email: 1}, truncated: false}`).
Conteúdo de usuário nunca entra em log — isso é regra, e o `console.error` do erro
do Groq já não carregava o texto.

Também verifiquei o que **já** estava certo e vale declarar: o `saveId` vai no
corpo para `_aiGuard` cobrar cota, e **não** é repassado ao Groq. O texto chega lá
pseudonimizado.

### O que isto NÃO resolve — e é o ponto honesto

**Regex não resolve LGPD.** "Estou em depressão e não consigo levantar" continua
saindo do país, e há um caso de teste que **afirma** isso (`_redact.test.js`) para
que ninguém leia a camada como "agora pode mandar qualquer coisa". O que falta é
do dono e é político, não técnico:

1. **Política de privacidade publicada** (🔴 em `STATUS.md` §3.2) com aviso de
   transferência internacional (art. 33) e base legal (art. 7º I / art. 11 I);
2. **Aviso no ponto de coleta** — é UI, e `src/components/` está com outro agente
   nesta rodada. Não toquei. O lugar é o `ChatBox` (primeira mensagem) e o
   `GameTutorialFlow`;
3. **Rota de exclusão de conta** (art. 18) e retenção definida;
4. **Não enviar nada ao Groq** é a única medida que fecha de verdade — e é decisão
   de produto, porque o chat com o pet É o produto.

---

## 4. N-7 — CSP, verificada com o app rodando

`public/_headers:13-38`: `Content-Security-Policy` completa +
`Strict-Transport-Security`.

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
form-action 'self'; script-src 'self' 'sha256-…' 'sha256-…';
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;
font-src 'self' data:; media-src 'self' data: blob:;
connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com
  https://*.firebaseio.com wss://*.firebaseio.com;
worker-src 'self'; manifest-src 'self'; frame-src 'self' https://*.firebaseapp.com
```

`script-src` usa **hash**, não `'unsafe-inline'` — usar `unsafe-inline` seria
devolver exatamente o que a política existe para tirar. `style-src` precisa de
`'unsafe-inline'` porque o app usa `style={{}}` de propósito (footgun nº 1) e o
`sonner` injeta `<style>`; atributo de estilo não executa script.

### 🔴 O defeito que só apareceu porque eu abri o navegador

A primeira versão desta CSP estava **correta no papel e bloqueava os dois scripts
inline no Chromium**: o navegador hasheia o texto do script **depois de normalizar
CRLF→LF**, e os arquivos deste repositório estão em CRLF. Hash do arquivo cru ≠
hash que o navegador calcula. Efeito medido: `data-theme` não aplicado (flash
branco na abertura) e **service worker com 0 registros** — offline e push mortos,
sem erro visível para ninguém.

Corrigido (`public/_headers:38`) e **travado**: `src/security/csp.test.ts` (8 casos)
recalcula os hashes a partir de `index.html` **e** de `dist/index.html` (que é o
arquivo que a Cloudflare serve e que é commitado), com a mesma normalização, e
falha se alguém editar um script inline sem atualizar a política. Tem controle
negativo (um script alterado produz hash que a política não tem) e casos que
proíbem `'unsafe-inline'`/`'unsafe-eval'` e exigem que `worker-src`/`img-src`
continuem permitindo o SW e o sprite do Higgsfield.

### Verificação com o app rodando (não no papel)

Servi o `dist/` com os headers do `_headers` **realmente aplicados** e abri num
Chromium de verdade (Playwright), coletando `securitypolicyviolation`:

```
violações CSP: NENHUMA
erros de console: nenhum
data-theme (script inline 1): dark
service workers (script inline 2): 1
texto na tela: ANTES DE TUDO | O que você quer melhorar na sua vida? | …
```

Splash renderiza com arte e CSS, o app chega ao onboarding, service worker
registra. Screenshot conferido.

---

## 5. Smoke do APK no CI

`.github/workflows/android-build.yml:58-131` — job `smoke` (depende do `build`,
baixa o artefato, habilita KVM, sobe emulador headless com
`reactivecircus/android-emulator-runner@v2`, API 30 `google_apis` x86_64) e
`.github/scripts/apk-smoke.sh` (**novo**).

O que ele **afirma**, em ordem:

1. `adb install` funciona e `am start` sobe a activity;
2. **o processo continua vivo** depois de 25 s — pega crash de inicialização, que
   hoje chegaria à Play Store sem nada avisar;
3. **sem `FATAL EXCEPTION` e sem ANR** no logcat;
4. a WebView/Capacitor inicializou (linhas do Capacitor no logcat);
5. **a ponte respondeu**: `run-as com.hexervoodoom.soulmon cat
   shared_prefs/DigiWidgetPrefs.xml` existe **e contém `current_stage`**. Esse
   arquivo só pode ter sido escrito pelo Kotlin de `DigiWidgetPlugin.kt:14-45`
   depois de o JS chamar `DigiWidget.updateWidgetData` (`src/App.tsx:411`). É
   **JS → Capacitor → Kotlin → SharedPreferences medido na ponta** — exatamente a
   fronteira da previsão nº 1 do skeptic;
6. artefato com `logcat-full.txt`, `DigiWidgetPrefs.xml`, `tela.png` e a versão do
   pacote, sempre (inclusive quando falha).

O passo 6 usa retry (12 × 5 s) de propósito: um smoke que dá falso vermelho é
desligado na terceira vez, e aí a ponte volta a não ter dono.

**Limite honesto, escrito no próprio workflow:** o APK carrega a **URL de
produção** (`capacitor.config.json > server.url`), então este smoke exercita a
ponte contra o site que está no ar, **não contra o `dist/` deste commit**. Ele pega
regressão nativa (Kotlin, manifesto, registro de plugin, Gradle, e o
`allowBackup`/`dataExtractionRules` da rodada passada, que nunca foram compilados)
e **não** pega regressão web do PR. Servir o build local ao emulador exigiria mudar
a configuração do Capacitor — arquitetura, não deste job.

**Não consegui executar este job aqui**: não há toolchain Android nem KVM nesta
máquina (Windows, sem emulador). Validei a sintaxe do YAML e do shell
(`bash -n`, parser de YAML) e cada asserção contra o código real (nome do pacote,
`.MainActivity`, `@CapacitorPlugin(name = "DigiWidget")`, `PREFS_NAME =
"DigiWidgetPrefs"`, as chaves `current_stage`/`digimon_name`). **A primeira
execução no GitHub Actions é a verificação de verdade** — se falhar, falha no
runner, que é onde deveria falhar.

---

## 6. Arquivos tocados

```
NOVOS
  src/utils/safeStorage.ts
  src/contexts/GameStateContext.storage.test.tsx
  src/security/csp.test.ts
  functions/api/_rateLimit.js
  functions/api/_rateLimit.test.js
  functions/api/_redact.js
  functions/api/_redact.test.js
  functions/api/costCeiling.test.js
  .github/scripts/apk-smoke.sh

ALTERADOS
  src/contexts/GameStateContext.tsx
  src/contexts/GameStateContext.hostile.test.tsx   (2 casos reescritos p/ a garantia nova)
  functions/api/community.js
  functions/api/subscribe.js
  functions/api/chat.js
  functions/api/suggest-tasks.js
  public/_headers
  .github/workflows/android-build.yml
  dist/**                                          (subproduto do `npm run build`)
```

**Não toquei** em `src/components/`, `src/index.css` nem em assets.

---

## 7. Pendente por falta de recurso provisionado

| Item | O que falta | Por quê não fiz |
|---|---|---|
| Teto de requisição **exato** | Durable Object **ou** binding de Rate Limiting da Cloudflare | Nenhum dos dois provisionado; exige `wrangler.toml`/painel, decisão do dono. O que existe é amortecedor de custo por isolate, declarado como tal |
| Cache de borda medido | Um deploy | `caches.default` não existe no runtime de teste; o teste exercita **sem** cache (pior caso). A eficácia real só aparece com tráfego |
| Correção do `_pushTargets`/`webpush` na borda | `wrangler deploy` dentro de `workers/` | Continua sem deploy automático — herdado da rodada anterior e ainda válido |
| Smoke do APK | Uma execução do GitHub Actions | Sem toolchain Android nem KVM aqui |

## 8. Continua dependendo do dono

1. **`FIREBASE_PROJECT_ID`** (N-1) — não liguei, como mandado. O pré-requisito
   (N-2, `Authorization` no CORS) segue fechado desde a rodada anterior.
2. **D1 `order_claims` + `PLAY_REQUIRE_ACCOUNT_BINDING`** — não toquei. Continuam
   valendo antes de qualquer chave de billing.
3. **N-3, a metade que não é código:** política de privacidade publicada, aviso no
   ponto de coleta (é UI, e o chat é o ponto principal — ver §3), base legal para
   dado de saúde, retenção e rota de exclusão de conta. **Nenhuma linha de regex
   substitui isso**, e é o item da lista mínima com prazo externo (Play Store).
4. **TTL de 365 dias no save** (#10) — segue precisando de um "sim, é isso mesmo"
   escrito; colide com o guardrail nº 1.
5. **Âncora de tempo do servidor** (B-4) e **versionamento de save** (§5.6 do round
   2) — continuam abertos e são desenho de produto.
6. **N-6** (origem compartilhada com o DigiApp): a CSP reduz o dano de um XSS,
   mas **não** separa as origens. Qualquer script publicado no Pages do DigiApp
   continua lendo o `localStorage` do Soulmon. Só o passo 1 de
   `docs/SEPARACAO-DIGIAPP.md` fecha isso.
