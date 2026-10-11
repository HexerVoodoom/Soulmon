# Auditoria de segurança, armazenamento e dados — lançamento (11/10/2026)

Etiqueta: **registro** (fotografia de 11/10/2026; a régua viva são os testes citados).
Escopo: Higgsfield ativado (geração de sprite paga), Créditos reais, cloud save
em KV, auth Firebase, push, chat Groq, transcrição Supabase, desktop Electron,
APK Capacitor. Base: `origin/main` em `89e0e7b71`. Achados antigos e já
fechados estão em `docs/STATUS.md` §1 — aqui só o que esta rodada mediu.

Regra usada: só entra como achado o que tem caminho de exploração real.

> **Atualização de 11/10/2026 (manter-docs, `f3acead1`):** as correções abaixo
> já estão na `main` (PR #292) e nenhum commit posterior tocou `functions/api/`
> de forma que mude o que foi medido — `transcribe`, `generate-sprite`, `subscribe`,
> `fcm-subscribe`, `metrics`, `save`, `guild`, `community` seguem como descritos.
> O que continua dependendo do painel/dono (Rate Limiting do Cloudflare, host do
> Higgsfield) está em [`LANCAMENTO-CHECKLIST.md`](LANCAMENTO-CHECKLIST.md).

## Corrigido nesta rodada

### ALTO — `/api/transcribe` era anônima (proxy gratuito de transcrição)
- **Evidência:** `functions/api/transcribe.js` › `onRequestPost` — o único freio
  era `takeToken` por IP (`_rateLimit.js`), que vive na memória de cada isolate
  e zera trocando de IP. Nenhum token exigido.
- **Exploração:** qualquer um faz `POST /api/transcribe` com áudio de até 4 MB e
  recebe texto, pago pela conta Supabase do dono, a 6/min por IP por isolate.
  Fica ativo assim que `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY` forem setados.
- **Correção:** exige ID token do Firebase verificado (`verifyIdToken`),
  **fail-closed** (503 sem `FIREBASE_PROJECT_ID`). `ChatBox.tsx` › `transcribeAudio`
  manda `authHeaders()`. Régua: `functions/api/transcribe.test.js` (bloco
  "auditoria de lançamento").

### ALTO — `referenceImageUrls` do `/api/generate-sprite` ia cru ao Higgsfield (SSRF de terceiro)
- **Evidência:** `functions/api/generate-sprite.js` › `generateHiggsfield` repassava
  `image_url`/`image_urls` vindos do corpo do cliente, sem validação nem limite.
- **Exploração:** um jogador pago manda `referenceImageUrls: ["https://qualquer/…"]`
  (ou mil entradas): o provedor BUSCA as URLs com a nossa credencial —
  varredura/beacon em nome da conta, e imagem de terceiro (inclusive arte
  protegida) injetada no pipeline image2image.
- **Correção:** `referenciasSeguras` só aceita `https://<mesma origem>/api/sprite-image?k=<32 hex>`
  (a arte que nós republicamos), no máximo 4; o resto é DESCARTADO (cai em
  text2image, nunca recusa a geração). Régua: `functions/api/generate-sprite.entrada.test.js`.

### MÉDIO — prompt do `/api/generate-sprite` sem teto de tamanho
- **Evidência:** mesmo handler; `prompt`/`promptFallback` só checavam tipo.
- **Exploração:** corpo de MB repassado ao provedor pago (custo/erro do lado
  dele, e prompt arbitrário longo na conta). A cota limita QUANTAS, não o tamanho.
- **Correção:** `MAX_PROMPT_CHARS` = 12000 → 400 antes de qualquer portão.
  `src/utils/oracle.test.ts` trava que os prompts reais ficam abaixo.

### CRÍTICO (dependência) — `@capacitor/android` 8.4.0 (GHSA-rvm3-566m-v7fv)
- **Evidência:** `npm audit --omit=dev`: "remote content can be loaded at the app
  origin via the internal HTTP proxy path", faixa `>=8.3.5 <8.4.3`.
- **Correção:** lock e `package.json` para `@capacitor/android|core|cli` **8.4.3**
  (publicada em 31/08/2026; patch). Efeito só no APK: precisa do próximo build
  do `android-build.yml` e de um APK novo na Play.

## Aberto — recomendado, não mexido

| Sev. | Achado | Evidência | Recomendação | Dono? |
|---|---|---|---|---|
| ALTO | Host do CDN do Higgsfield não fixado | `generate-sprite.js` › `republicar` busca `doneJob.results.raw.url` sem allowlist de host e lê o corpo inteiro antes do teto `MAX_BLOB_BYTES` | Fixar o host do CDN depois de ver a primeira resposta real; checar `content-length` antes do `arrayBuffer` | **Dono** (o host só se confirma com a assinatura ativa) |
| MÉDIO | Rate limit por IP é por isolate | `_rateLimit.js` (memória) usado em transcribe/chat/etc. | Regra de Rate Limiting no painel Cloudflare para `/api/*` caras | **Dono** (painel) |
| MÉDIO | `firebase` 12.x arrasta `@grpc/grpc-js` vulnerável (via firestore) | `npm audit` (5 high) | Atualizar `firebase`/`@capacitor-firebase/authentication` quando houver versão compatível; o app não usa Firestore no cliente, exposição real baixa | Time |
| BAIXO | Auth do save é fail-open sem `FIREBASE_PROJECT_ID` | `_auth.js` › `authorizeSaveAccess` (decisão de migração documentada) | Manter a variável setada; teste `firebaseNoBuild.contract` | **Dono** (painel) |
| BAIXO | Blob de sprite mora na KV de saves, sem TTL | `generate-sprite.js` › `guardarBlob` | Mover para R2 (achado B-2 já registrado) | **Dono** |

## Conferido e considerado seguro nesta rodada
- `sprite-image.js`: token de 128 bits, `nosniff` + CSP `sandbox`, Content-Type só `image/*`.
- `generate-sprite.js`: `requirePaidTier` (fail-closed) → `authorizeSaveAccess` →
  dedupe → `guardAiRequest`, nessa ordem; `formId` validado antes de virar chave.
- Segredos: `git grep` só achou as chaves públicas do Firebase (`.env.production`,
  `google-services.json`) e placeholders em docs/testes.
- Android: `allowBackup` com exclusão de `app_webview` (PII do oráculo),
  receivers internos `exported="false"`, só widgets exportados (exigido pelo sistema).
- Electron: as três janelas com `contextIsolation: true`, `nodeIntegration: false`.
- XSS: nenhum `dangerouslySetInnerHTML` com dado de usuário; os `innerHTML` do
  desktop são literais/limpeza.

## Fora do que esta rodada mediu
Política de privacidade vs. coleta, exclusão/exportação (`account.js`,
`requireVerifiedOwner`), billing/`claimOrder` e comunidade foram auditados em
rodadas anteriores (STATUS §1.1–1.3, QA rodadas 1–2) e têm réguas próprias; não
foram re-auditados linha a linha aqui.
