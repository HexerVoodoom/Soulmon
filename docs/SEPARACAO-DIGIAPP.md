# Separar o Soulmon do DigiApp

O Soulmon nasceu de um fork do DigiApp e ainda divide infraestrutura com ele.
Este é o inventário do que continua compartilhado, o risco de cada item e a
ordem segura de separar.

## Situação atual (07/09/2026)

> ⚠️ **A limpeza inteira foi feita em 07/09/2026**, depois de o dono informar
> que **ninguém nunca usou o app em produção**. Metade desta tabela justificava
> manter herança "para não quebrar quem já joga" — não havia quem.

| Item | Onde | Estado |
|---|---|---|
| `applicationId` Android | `android/app/build.gradle` | ✅ Separado — `com.hexervoodoom.soulmon` |
| Nome do app | `strings.xml`, `capacitor.config.json` | ✅ Separado — "Soulmon" |
| Chave dos saves | `utils/cloudSave.ts` (salt `soulmon:`) | ✅ Separado |
| URL de produção | `capacitor.config.json` → `server.url` | ✅ Separado — `soulmon.mateus-sprnd.workers.dev` |
| **Nome do binding KV** | `functions/api/_kv.js` → `kv(env)` | ✅ Separado — aceita `SOULMON_SAVES` **e** `DIGIAPP_SAVES`, então trocar no painel não exige sincronia |
| **Chaves de localStorage** | `utils/storageKeys.ts` | ✅ Separado — prefixo `soulmon-`, com migração one-shot |
| **Canal de notificação** | `MainActivity.java` | ✅ Separado — `soulmon_push` (e `soulmon_alarms`) |
| **Campo do bridge** | `SoulmonWidgetPlugin` | ✅ Separado — `petName` / `pet_name` |
| **Widgets Android** | classes, layouts, `android:label` | ✅ Separado — os cinco rótulos diziam "DigiApp" na LISTA DE WIDGETS do celular |
| **Digital Asset Links** | `functions/.well-known/` | ✅ Separado — o padrão era o **pacote do DigiApp**, ou seja, uma declaração falsa de propriedade do nosso domínio. Sem fingerprint, hoje responde vazio |
| **Chat paralelo** | `src/supabase/.../chat.tsx` | ✅ Apagado — segundo endpoint de LLM, publicado, sem autenticação e sem NENHUMA das travas do `functions/api/chat.js` |
| **Arte e nomes de franquia** | bundle, APK, bestiário | ✅ Removidos — ver `docs/Attributions.md` |
| Namespace KV (os DADOS) | Cloudflare → KV | ⚠️ **Ainda o mesmo namespace físico.** Só o dono separa (passo 2) |
| Projeto Firebase | `google-services.json` | ✅ **Separado em 07/09/2026** — projeto próprio `soulmon-app` (passo 4 feito) |
| `virus`/`data`/`vaccine` | `types/attributes.ts` | ⚪ Mantidos DE PROPÓSITO — palavras genéricas, em dezenas de arquivos, e o jogador nunca as vê (ele lê Poder/Harmonia/Benevolência) |

**O que sobra depende do painel do Cloudflare e do Firebase — não do código.**

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

> ### ✅ Decidido em 07/09/2026: **namespace NOVO e VAZIO**
>
> O dono escolheu criar um `SOULMON_SAVES` limpo, sem migrar dado nenhum. O
> que torna isso seguro é o fato registrado no topo do `CLAUDE.md`: **ninguém
> nunca usou o app em produção**, então não existe save de terceiro para
> perder. O save do próprio dono, se houver, reaparece ao logar com o mesmo
> e-mail (o `saveId` é derivado do e-mail, não do aparelho) — e se ele
> preferir garantir antes, o caminho é um script de cópia, não a manutenção
> do namespace compartilhado.
>
> **O que isso deixa de exigir:** nada de janela de manutenção, nada de
> sincronizar merge com clique no painel. O `kv(env)` aceita os dois nomes.

1. Cloudflare → **Workers & Pages → KV** → criar `SOULMON_SAVES` (namespace
   novo, vazio).
2. No projeto Pages: **Settings → Functions → KV namespace bindings** →
   vincular o namespace novo ao nome **`SOULMON_SAVES`** (o nome novo — o
   `_kv.js` o prefere; o binding antigo pode ficar durante a transição).

> ⚠️ **Este parágrafo dizia para manter o nome `DIGIAPP_SAVES`** porque trocá-lo
> "exigiria alterar todos os arquivos em `functions/api/` **e** acertar o
> Cloudflare no mesmo instante — qualquer descompasso derruba save, créditos e
> compras ao mesmo tempo", e concluía que a troca exigiria o app fora do ar.
>
> **O risco estava certo; a conclusão, não.** Desde 07/09/2026 o binding é
> resolvido em um lugar só — `functions/api/_kv.js` (`kv(env)`) —, que prefere
> `SOULMON_SAVES` e cai em `DIGIAPP_SAVES`. A ordem entre mergear e clicar no
> painel deixou de importar, e não existe janela de queda:
>
> 1. no painel, acrescente um binding `SOULMON_SAVES` para o MESMO namespace
>    (ou para um novo, se quiser separar os dados de vez);
> 2. confirme que o app segue funcionando;
> 3. remova o `DIGIAPP_SAVES` do painel;
> 4. só então apague o fallback de `_kv.js` e o caso do `_kv.test.js`.
>
> Há teste varrendo `functions/api/` contra qualquer leitura direta de
> `env.*_SAVES` — um acesso solto continuaria funcionando hoje e quebraria no
> passo 3, que é a pior hora para descobrir.

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

### 4. Projeto Firebase próprio — ✅ FEITO em 07/09/2026

Projeto **`soulmon-app`**, criado pelo dono. O que ficou pronto:

1. ✅ App **Web** registrado → as quatro `VITE_FIREBASE_*`, gravadas em `.env`
   **e** em `.env.production` (este é commitado de propósito — ver `CLAUDE.md`,
   seção Deploy, e `src/deploy/firebaseNoBuild.contract.test.ts`).
2. ✅ **Authentication** com **Google** e **e-mail/senha** habilitados
   (o desenho mudou de link-por-e-mail para senha; ver
   `docs/PLANO-TELA-IDENTIDADE.md`, seção 3-bis).
3. ✅ Domínios de produção autorizados, e `apis.google.com` liberado na CSP
   (`public/_headers`) — sem isso o popup do Google falha com um
   `auth/internal-error` genérico.

Falta, e **depende do dono**:

4. ⬜ Registrar o app **Android** `com.hexervoodoom.soulmon` → novo
   `google-services.json` (o atual ainda é do projeto do DigiApp).
5. ⬜ Refazer a chave do FCM e o secret `FIREBASE_SERVICE_ACCOUNT` do worker de
   push (`workers/`) para o projeto novo.

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

- ✅ `workers/push-scheduler.js` → `CONTACT`. **Decidido em 07/09/2026:**
  `mailto:mateus.sprnd@gmail.com`. O item ficou aberto por meses com a
  justificativa "precisa ser um endereço que você controle" — e a resposta era
  o e-mail do dono, que sempre esteve disponível. Fica pendente só o
  `wrangler deploy` dentro de `workers/`.
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
