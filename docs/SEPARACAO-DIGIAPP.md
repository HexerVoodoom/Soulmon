# Separar o Soulmon do DigiApp

O Soulmon nasceu de um fork do DigiApp e ainda divide infraestrutura com ele.
Este é o inventário do que continua compartilhado, o risco de cada item e a
ordem segura de separar.

## Situação atual

| Item | Onde | Estado |
|---|---|---|
| `applicationId` Android | `android/app/build.gradle` | ✅ **Separado** — `com.hexervoodoom.soulmon` |
| Nome do app | `strings.xml`, `capacitor.config.json` | ✅ **Separado** — "Soulmon" |
| Chave dos saves | `utils/cloudSave.ts` (salt `soulmon:`) | ✅ **Separado** — e-mail igual gera chave diferente nos dois apps |
| Namespace KV | `wrangler.jsonc` → `DIGIAPP_SAVES` | ⚠️ **Compartilhado** — mesmo namespace físico |
| URL de produção | `capacitor.config.json` → `server.url` | ⚠️ **Compartilhado** — aponta para `digiapp-a5e.pages.dev` |
| Projeto Firebase | `google-services.json` | ⚠️ **Compartilhado** |
| Chaves de localStorage | `utils/storageKeys.ts` (prefixo `digiapp-`) | ⚠️ Herdado (só cosmético — o armazenamento é por origem) |
| Canal de notificação | `MainActivity.java` → id `digiapp_push` | ⚠️ Herdado (só interno; o nome exibido já é "Soulmon") |

> As chaves de localStorage e o id do canal são **intencionalmente** mantidos:
> trocá-los faria os usuários atuais perderem o progresso local e as
> preferências de notificação. Renomear exigiria uma migração — só vale a pena
> se houver outro motivo.

---

## Ordem segura de separação

### 1. Novo projeto no Cloudflare Pages

Criar um projeto Pages próprio (ex.: `soulmon`), apontando para este repo.

Reconfigurar **todas** as variáveis nele (elas não vêm junto):

| Variável | Observação |
|---|---|
| `GROQ_API_KEY` | Chat do pet e sugestão de tarefas |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | Verificação de compra |
| `ANDROID_PACKAGE_NAME` | `com.hexervoodoom.soulmon` |
| `VITE_FIREBASE_*` | Só quando for ligar o login (ver BILLING-SETUP.md) |
| `FIREBASE_PROJECT_ID` | **Por último** — é o que passa a exigir token |

### 2. Namespace KV próprio

Hoje `DIGIAPP_SAVES` aponta para o namespace `aed229e069fd40d8a141fb1124763d9d`,
o mesmo do DigiApp. O salt `soulmon:` já garante que as **chaves** não colidem,
mas os dados moram no mesmo lugar.

1. Cloudflare → **Workers & Pages → KV** → criar `SOULMON_SAVES`.
2. No projeto Pages: **Settings → Functions → KV namespace bindings** →
   vincular o namespace novo ao nome `DIGIAPP_SAVES`.

> **Por que manter o nome do binding `DIGIAPP_SAVES`?** É o nome usado no
> código (`env.DIGIAPP_SAVES`). Trocar o binding exigiria alterar todos os
> arquivos em `functions/api/` **e** acertar o Cloudflare no mesmo instante —
> qualquer descompasso derruba save, créditos e compras ao mesmo tempo. O
> nome é feio, mas é só um rótulo. Se quiser renomear depois, faça isolado,
> com o app fora do ar por alguns minutos.

**Migrar os saves existentes?** Só se quiser preservar quem já joga. As chaves
do Soulmon no namespace antigo começam com o hash do salt `soulmon:` e os
prefixos `ent:` / `profile:`. Sem migração, quem já joga recomeça (mas as
**compras** voltam pelo "Restaurar compras", porque pertencem à conta Google).

### 3. Domínio próprio

Depois que o Pages novo estiver no ar, atualizar `capacitor.config.json`:

```json
"server": { "url": "https://SEU-NOVO-DOMINIO", "cleartext": false }
```

> ⚠️ O APK carrega essa URL. Enquanto ela apontar para o Pages antigo, o app
> Android continua servindo o deploy antigo — mesmo com o código novo aqui.
> Trocar exige **gerar um APK novo** e publicar.

### 4. Projeto Firebase próprio (recomendado)

Dá para só adicionar o pacote novo ao projeto atual, mas com projetos
separados as notificações, o login e as métricas de cada app ficam isolados.

Se criar um projeto novo:
1. Registrar o app **Android** `com.hexervoodoom.soulmon` → novo
   `google-services.json`.
2. Registrar o app **Web** → chaves `VITE_FIREBASE_*`.
3. Habilitar **Authentication → Link de e-mail**.
4. Refazer a chave do FCM e o secret `FIREBASE_SERVICE_ACCOUNT` do worker de
   push (`workers/`).

### 5. Limpeza

- ✅ `bubblewrap_build/` — **removido** (49 MB, 560 arquivos rastreados). Era o
  artefato de um build TWA do DigiApp, sem uso desde a migração para Capacitor.
  Está no `.gitignore` para não voltar.
- ✅ `src/imports/` — **removido** (41 arquivos de protótipo do Figma, nenhum
  referenciado). Conferido com typecheck, testes e build depois da remoção.
- ✅ `package.json` / `package-lock.json` — `name` era `DigiApp Design
  Prototype`, virou `soulmon`. Campo inerte (nada lê), só cosmético.

### 6. Digital Asset Links

`functions/.well-known/assetlinks.json.js` declarava o pacote e o fingerprint do
**DigiApp** direto no código. Continua servindo esses valores por padrão — é o
que o domínio compartilhado exige hoje —, mas agora eles vêm de variáveis do
projeto Pages:

| Variável | Valor do Soulmon |
|---|---|
| `ASSETLINKS_PACKAGE_NAME` | `com.hexervoodoom.soulmon` |
| `ASSETLINKS_SHA256` | SHA-256 do certificado de assinatura do release |

O fingerprint sai do Play Console → **Configuração → Integridade do app →
Certificado da chave de assinatura do app**. Sem as variáveis, o endpoint
responde exatamente como respondia antes.

### 7. Sobras que precisam de decisão sua

- `workers/push-scheduler.js` → `CONTACT = 'mailto:contact@digiapp.app'`. É o
  endereço de contato do VAPID, enviado aos serviços de push. Não troquei porque
  precisa ser um endereço que você controle de verdade — inventar um é pior que
  manter o antigo.
- `wrangler.jsonc` diz `"name": "soulmon"`, mas `capacitor.config.json` aponta o
  APK para `digiapp-a5e.pages.dev`. Ou já existe um projeto Pages `soulmon` (e aí
  falta só o passo 3 abaixo), ou o nome do wrangler está adiantado. **Confira no
  painel do Cloudflare antes de mexer no `server.url`.**

Ao trocar a URL de produção, são **três** arquivos, e todos de uma vez:

- `capacitor.config.json` → `server.url`
- `desktop/renderer/src/config.ts` → `APP_URL`
- `desktop/electron/main.js` → `FULL_APP_URL` (já aceita `SOULMON_APP_URL`)

---

## Ordem que evita ficar fora do ar

1. Criar Pages novo + KV novo + variáveis → conferir com a URL `*.pages.dev`
   do projeto novo, sem mexer no que está no ar.
2. Publicar o domínio próprio.
3. Só então atualizar `capacitor.config.json`, gerar APK novo e publicar.
4. Por último, aposentar o Pages antigo.

Fazer na ordem inversa (mexer no `server.url` antes de o destino existir)
quebra o app de todo mundo que já tem o APK instalado.
