# Handoff — terminar a infra do Soulmon numa sessão LOCAL

> **Para quem é este arquivo:** um agente rodando na máquina do dono (Windows,
> repo em `D:\Soulmon\repo`), com acesso ao terminal, ao navegador logado e às
> contas dele. A sessão que escreveu isto rodava na nuvem, num contêiner
> isolado — ela conseguiu mexer na Cloudflare por conector, mas **não tem
> navegador logado**, e por isso Firebase e Play Console ficaram parados.
>
> Estado de referência: `main` em `6e2d991b`, suíte verde (238 arquivos,
> 3470 testes), `tsc` limpo, `npm run build` OK.

---

## 1. O que já está feito (não refaça)

| Item | Estado |
|---|---|
| Worker de push (`digiapp-push-scheduler`) | **Deployado** em 07/09/2026. Crons `0 1`, `0 13`, `0 19` (UTC) = 10h/16h/22h BRT |
| `SEASON_ADMIN_KEY` no scheduler | **Gravado** (`wrangler secret list` confirma) |
| `METRICS_ADMIN_KEY` no worker `soulmon` | **Já existia** |
| E-mail do VAPID | Decidido: `mateus.sprnd@gmail.com`, já no `push-scheduler.js` |
| KV `SOULMON_SAVES` | **Criado e vazio** — `20b3ba78a3e84265b5e2d4cd0d411d43` |
| D1 `soulmon-billing` | **Criado + 2 migrações aplicadas** — `43546903-7f12-4541-9a67-4b0e8ac736da` |
| Bindings no `wrangler.jsonc` | **Escritos** (KV novo + `DB`), commitados, **ainda não deployados** |

---

## 2. O que falta, em ordem

Cada tarefa tem o comando, o que confirma que deu certo, e o que significa se
falhar. **Faça uma de cada vez e confirme antes de seguir.**

### 2.1 Deploy da raiz — ativa o KV novo e o D1

```powershell
cd D:\Soulmon\repo
git pull
npx wrangler deploy
```

**Confirma:** a saída lista `env.SOULMON_SAVES`, `env.DIGIAPP_SAVES`,
`env.PUSH_SUBSCRIPTIONS` **e** `env.DB`. Se o `DB` não aparecer, o
`wrangler.jsonc` não foi lido — pare e investigue, porque é ele que liga a
trava "um recibo, uma conta".

**Consequência declarada:** a partir daqui o app lê o namespace KV **vazio**.
Foi decisão do dono (separar sem migrar, já que ninguém usou o app em
produção). O save local dele, se existir, sobe na primeira sincronização. O
namespace antigo continua intacto e declarado como `DIGIAPP_SAVES`.

⚠️ **Rode da RAIZ, sem `-c`.** Em `workers/` o wrangler pega o config errado:
ele ignorou o `workers/wrangler.toml` e publicou o worker do app. O sintoma é
a saída dizer `Uploaded soulmon` quando você esperava o scheduler.

### 2.2 VAPID — o Web Push nunca funcionou

`wrangler secret list` no scheduler devolve **um** segredo. Não há `VAPID_JWK`,
então `push-scheduler.js` registra `"VAPID_JWK not configured — skipping Web
Push"` e **pula o envio inteiro**. Nenhum sintoma do lado do usuário: a
inscrição é criada normalmente, a notificação só nunca chega.

```powershell
cd D:\Soulmon\repo
node scripts/gerar-vapid.mjs
```

Ele imprime duas coisas:

1. **A chave pública** (base64url, 87 caracteres, começa com `B`) → troque nos
   **TRÊS** arquivos que a fixam. Há teste travando
   (`workers/vapid.parity.test.js`), então rode `npx vitest run
   workers/vapid.parity.test.js` depois de trocar:
   - `src/utils/vapid.ts`
   - `workers/push-scheduler.js`
   - `workers/wrangler.toml`
2. **A chave privada** (JWK) → é SEGREDO. Único destino:

```powershell
cd D:\Soulmon\repo\workers
npx wrangler secret put VAPID_JWK -c wrangler.toml
npx wrangler deploy -c wrangler.toml
```

⚠️ **Nunca** cole a privada em chat, commit, issue ou log. Se ela aparecer em
algum desses lugares, gere um par novo e recomece — é mais barato que
raciocinar sobre exposição.

**Por que trocar o par é seguro:** uma inscrição de push é criada CONTRA uma
chave pública. Trocar invalida as existentes — e não existe nenhuma.

**Confirma:** `npx wrangler secret list -c wrangler.toml` mostra `VAPID_JWK` e
`SEASON_ADMIN_KEY`.

### 2.3 `SEASON_ADMIN_KEY` — o outro lado

O scheduler ENVIA a chave; o `functions/api/community.js` COMPARA com a dele.
Hoje só o lado que envia existe, então o fechamento da season leva **401**.

No painel: **Workers & Pages → soulmon → Settings → Runtime variables and
secrets → Add variable**, tipo **Secret**, nome `SEASON_ADMIN_KEY`, com **o
mesmo valor** que já está no scheduler.

Se o dono não tiver mais o valor à mão, gere um novo e ponha nos DOIS lados
(`wrangler secret put SEASON_ADMIN_KEY -c wrangler.toml` + painel).

### 2.4 Firebase — login (é o item de maior impacto)

Sem isto, `functions/api/_auth.js` roda em **modo aberto**: devolve
`{ ok: true }` e todo o `denyUnlessOwner` vira no-op. Como o `saveId` é
`SHA-256("soulmon:" + e-mail)` por algoritmo público, quem souber um e-mail lê
e sobrescreve o save alheio. Também é o que mantém exportação e exclusão de
conta respondendo 503 (`fail-closed` de propósito: indisponível é melhor que
perigosa).

**Decisão que vem antes:** o projeto Firebase ainda é o mesmo do DigiApp. Se o
dono for criar um projeto próprio (`docs/SEPARACAO-DIGIAPP.md`, passo 4), faça
isso ANTES — senão configura duas vezes.

Passos:

1. Firebase Console → o projeto → **Configurações do projeto → Seus apps →
   app Web** → copiar a config do SDK.
2. Ativar **Authentication → Sign-in method → Link de e-mail (sem senha)**.
3. **Authorized domains**: adicionar `soulmon.mateus-sprnd.workers.dev`.
4. Criar `D:\Soulmon\repo\.env` a partir do `.env.example` e preencher
   `VITE_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`.
5. `npm run build` **e** `npx wrangler deploy` — nessa ordem.
6. **Só então**, no painel do worker `soulmon`, a variável de runtime
   `FIREBASE_PROJECT_ID`.

⚠️ **As `VITE_*` são de BUILD, não de runtime.** O Vite as INLINA no bundle
(`import.meta.env` em `src/utils/auth.ts`). Pôr no painel **não faz nada** — e
foi exatamente o que a lista do dono mandou fazer por semanas, até 07/09/2026.
Por isso o passo 5 é build + deploy, não só deploy.

⚠️ **A ORDEM do passo 6 não é preferência.** Ligar o `FIREBASE_PROJECT_ID`
antes do bundle ter as `VITE_*` derruba o login de todo mundo: o servidor passa
a exigir token e o cliente não sabe emitir nenhum.

**Confirma:** abrir o app, pedir o link por e-mail, receber e completar o
login. Depois, uma chamada a `/api/save` de outro `saveId` tem que dar 403.

### 2.5 FCM — push nativo no Android (pode ficar para depois)

Só vale se o dono quiser o canal nativo além do Web Push. O Web Push cobre
PWA/desktop e funciona dentro do WebView do Capacitor; o FCM existe para
entrega mais confiável contra Doze em ROMs de fabricante.

1. Firebase Console → registrar o app **Android** com o pacote
   `com.hexervoodoom.soulmon` → baixar `google-services.json` → substituir
   `android/app/google-services.json`.
2. Configurações do projeto → **Contas de serviço** → Gerar nova chave privada.
3. `cd workers; npx wrangler secret put FIREBASE_SERVICE_ACCOUNT -c wrangler.toml`
   e colar o JSON **inteiro**.

### 2.6 Play Console — quando for publicar

Criar os 4 produtos com os IDs EXATOS (estão em `functions/api/_billing.js`;
errar o id faz a compra ser aceita e não conceder nada):

- `soulmon.unlock.full` (não consumível — concede `tier: paid`)
- `soulmon.credits.60` · `soulmon.credits.150` · `soulmon.credits.400`
  (consumíveis)

Depois: conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e
`ANDROID_PACKAGE_NAME` no painel do worker; `ASSETLINKS_SHA256` (Play Console
→ Integridade do app → certificado de assinatura).

⚠️ **`PLAY_REQUIRE_ACCOUNT_BINDING=true` só DEPOIS do APK novo publicado.**
Antes disso ele recusa toda compra.

---

## 3. Decisões que são do dono — pergunte, não escolha

Estão em `docs/DEPENDE-DE-VOCE.md` com o custo de cada saída:

- **`minSdkVersion`** (hoje 24, e o app usa `oklch()`/`color-mix()`, que são
  Chromium 111+). Palpite registrado: 30.
- **Keystores no histórico do git** — rotacionar a chave no Play Console ou
  reescrever histórico com `git filter-repo`.
- **Exclusão de conta × recibo de pagamento** — saídas A, B ou C, e o prazo
  de retenção se for A.
- **Balanceamento da carga diária** — 4 propostas (P1–P4). A recomendação
  escrita é começar pela P4, que não mexe em regra.
- **TTL de 365 dias no save.**

---

## 4. Regras da casa (valem para qualquer commit)

Do `CLAUDE.md`, resumidas — **leia o arquivo inteiro antes de mexer em regra
de jogo**, ele é a fonte da verdade:

```powershell
npx tsc --noEmit
npx tsc -p desktop/tsconfig.json --noEmit
npx vitest run
npm run build          # dist/ É commitado
```

- Commits em PT-BR, `tipo(escopo): resumo`.
- Fluxo: branch de trabalho → commit → push → merge **ff-only** em `main` →
  push da `main`.
- **Autonomia**: com o gate verde, mergeie na hora. Não crie loop de check-in.
- Texto de UI sempre PT-BR **e** EN (há guard:
  `src/i18nSemPtSozinho.contract.test.ts`).

### Armadilhas que já custaram tempo nesta máquina

- **PowerShell não aceita `&&`.** Um comando por linha, ou `;` — e prefira
  linhas separadas quando a segunda parte publica algo, porque `;` roda mesmo
  se a primeira falhar.
- **`wrangler` pega o config errado dentro de `workers/`** — sempre `-c
  wrangler.toml` lá, e nada de `-c` na raiz.
- **Saída do terminal se sobrepõe** quando dois comandos escrevem juntos: já
  fez um `Current Version ID` parecer sufixo de um nome de segredo. Na dúvida,
  confirme com `secret list` / `deployments list` em vez de ler a saída
  embaralhada.

---

## 5. O que NÃO fazer

- **Não peça, não leia e não escreva senha do dono em lugar nenhum.**
- **Não cole segredo em chat, commit, issue ou log** — nem "só para conferir".
- **Não reescreva histórico do git** sem o dono mandar explicitamente naquela
  hora (o item das keystores é decisão dele).
- **Não apague o namespace KV antigo** (`DIGIAPP_SAVES`,
  `aed229e069fd40d8a141fb1124763d9d`). Ele é a única cópia do dado herdado.
- **Não ligue `PLAY_REQUIRE_ACCOUNT_BINDING`** antes do APK novo publicado.
- **Não invente valor de variável** para "destravar" um passo. Variável errada
  falha em silêncio; ausente falha alto, que é melhor.
