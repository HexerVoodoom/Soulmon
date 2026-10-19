# Beta fechado na Google Play — runbook do dono

> **Run `beta-play-01`** (11/10/2026). Este é o passo a passo COMPLETO, na ordem que
> evita retrabalho. Substitui, para o beta, o roteiro de `PLAY-LANCAMENTO.md` (que
> descreve teste interno + produção e não cobre a trilha de teste fechado).
> Plano B para o que quebrar: [`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md).
> Recrutamento e onboarding dos testadores: [`BETA-TESTADORES.md`](BETA-TESTADORES.md).
>
> **Objetivo:** 12+ testadores com opt-in contínuo por 14 dias seguidos em teste
> FECHADO (regra de conta pessoal nova), compra de teste ponta a ponta, zero crash,
> zero perda de save.
>
> **Conferido na `release/beta-1`** (11/10/2026), que incorpora #311 fix/beta-prontidao,
> #312 feat/sprite-pose, #313 feat/chat-soulmon-agente, #314 feat/assinatura-trimestral e
> #310 este runbook. Os antigos marcadores "[conferir no PR]" foram trocados pelos valores
> reais do código:
> (a) assinatura trimestral `soulmon_cosmetic_quarterly`, R$ 9,90, sem trial, com
> RTDN em `/api/rtdn`; (b) fix de fuso (`dayKeyToDate`), tela de erro de rede via
> `server.errorPath`, crash reporting próprio em `/api/crash` (diagnóstico **não
> vinculado** à conta) e **remoção** de `SCHEDULE_EXACT_ALARM` (feita em #311: alarme inexato
> `setAndAllowWhileIdle`; o manifesto mesclado não a tem); (c) chat agente com Groq
> (`GROQ_API_KEY`, modelo pela var `CHAT_MODEL`, padrão `openai/gpt-oss-120b`, plano GRATUITO) e
> fallback Gemini (`GEMINI_API_KEY`).

## Legenda

| Etiqueta | Significa |
|---|---|
| **[DONO]** | Exige segredo, conta, aparelho ou decisão sua. A squad nunca digita senha, keystore, JSON de service account nem dado bancário. |
| **[SQUAD pode fazer via Chrome com confirmação]** | Texto público/navegação no Play Console, Firebase ou Cloud logados na SUA sessão (extensão Claude in Chrome). A squad para antes de todo botão irreversível e espera o seu "sim" naquele passo. |
| **Verificação** | Como saber que o passo ficou feito. Não pule: cada passo posterior assume o anterior. |

Convenções: tudo em `E:\` (nunca `C:\`); comandos em PowerShell, na raiz do repo
`D:\Soulmon\repo` salvo indicação; segredos nunca vão na linha de comando nem no chat.

---

## Visão geral da ordem (e por que é esta)

```
FASE 0  Ler o PR #315 + migração D1 + backup de saves -> merge     (evita subir AAB com bug conhecido)
FASE 1  Keystore de upload                                          (sem ela não há AAB assinado)
FASE 2  Criar o app no Play Console + ficha/Data Safety/IARC/IA     (pode andar em paralelo com a 3)
FASE 3  Build local do AAB (assinado)
FASE 4  1º upload (teste INTERNO) -> Play App Signing -> SHA        (o SHA de App Signing só nasce aqui)
FASE 5  Firebase (SHA) + restrição da API key + google-services     (só depois do SHA da Fase 4)
FASE 6  Perfil de pagamentos + produtos (INAPP + assinatura)        (só abrem depois do 1º upload)
FASE 7  Service account + secrets do Worker + RTDN + worker de push
FASE 8  Teste de compra no INTERNO -> liga PLAY_REQUIRE_ACCOUNT_BINDING
FASE 8B Controles do beta: BETA_EMAILS (dono + revisor + testadores) -> sal de IP -> alertas -> BETA_CLOSED por último
FASE 9  Trilha de TESTE FECHADO + Google Group + opt-in + revisão
FASE 10 O relógio dos 14 dias + operação diária
```

A lógica: o **teste interno** (sem revisão do Google, minutos) serve para provar tudo
que depende da Play (SHA, billing, binding) **antes** de abrir o teste fechado. O relógio
dos 14 dias só deve começar quando o app já estiver provado — um bug achado no dia 3
custa o relógio inteiro se você precisar trocar de AAB e perder testadores.

---

## FASE 0 — Antes de qualquer coisa de conta

### 0.1 Fechar o código do beta `[DONO decide; squad executa]`

**Já feito pela squad em 11/10/2026:** a `release/beta-1` existe (worktree da squad em
`E:/soulmon-beta-rel`) e incorpora os 5 PRs (#311, #312, #313, #314, #310) mais os
controles do beta. Ela está aberta como **PR #315** para a `main`, **sem merge**. Durante
os 14 dias, a release só aceita correção, nunca feature.

O que resta para você:

1. Ler o PR #315 (o corpo resume tudo) e conferir a saída real dos testes em
   `product/beta-play-01/sweeper/test-run.log`.
2. Fazer **0.3 (migração + backup) ANTES** de mergear o #315. O push na `main` publica o
   Worker sozinho em cerca de 2 minutos.
3. Mergear o #315 (botão *Merge* no GitHub) só depois de 0.3.

### 0.2 Portão local (o CI está parado por cobrança desde 16/09) `[SQUAD pode fazer]`

```powershell
npm run portoes -- --build
```

**Verificação:** termina verde. Antes de o fix de fuso entrar, o único vermelho real era
`taskSteps.rule.test` (F1: `dayKeyToDate` no fuso BRT). Se o vermelho for só
`filaDeAvisos.contract` (CRLF no Windows, F2), é artefato de checkout; peça o
`.gitattributes` (`* text=auto eol=lf`) em vez de ignorar. Prova rápida do fuso:

```powershell
$env:TZ = "America/Sao_Paulo"; npx vitest run src/utils/taskSteps.rule.test.ts; Remove-Item Env:TZ
```

### 0.3 Migração D1 remota `[DONO]` (precisa de `wrangler login`)

**Faça ANTES do merge do PR #315**, porque o push na `main` publica o Worker sozinho
(~2 min) e o código novo espera a tabela. Sem a tabela `rtdn_messages` o RTDN continua
correto, porque a dedupe degrada e não quebra (teste A4 em `functions/api/rtdn.test.js`),
mas **a migração é obrigatória antes do merge** por regra deste runbook.

**Também ANTES do merge: backup dos saves.** O código novo muda as regras de gravação
(beta fechado, limite por IP):

```powershell
npx wrangler login
node scripts/backup-saves.mjs          # -> E:\soulmon-backups\SOULMON_SAVES-<data>.json (só leitura do KV)
```
 A migração deve ser só aditiva
(`CREATE`/`ADD COLUMN`) — confira o arquivo novo em `migrations/` antes de aplicar.
**Nova nesta release: `migrations/0003_rtdn_messages.sql`** — só `CREATE TABLE IF NOT EXISTS
rtdn_messages` (idempotência do RTDN); `order_claims` não muda. Reverter = `DROP TABLE`
(sem ponto de não retorno; sem a tabela o código cai no KV).

```powershell
npx wrangler login
npx wrangler d1 migrations list soulmon-billing --remote
npx wrangler d1 migrations apply soulmon-billing --remote
npx wrangler d1 migrations list soulmon-billing --remote
```

**Verificação:** a última listagem diz `No migrations to apply`, e
`npx wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(order_claims)"`
mostra 4+ colunas incluindo `expires_at`, e
`npx wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(rtdn_messages)"`
mostra `message_id`, `received_at`, `expires_at`. **Nunca** use `d1 execute --file` como migração
(lápide em `migrations/README.md`).

### 0.4 Higiene do repo para segredos `[SQUAD pode fazer]`

O `android/.gitignore` já ignora `*.jks` e `*.keystore`. Garanta também no `.gitignore` da
raiz (e `keystore.properties`):

```
*.jks
*.keystore
keystore.properties
```

**Verificação:** `git check-ignore -v E:\x.jks android/app/x.jks` não é necessário; basta
`git status` nunca mostrar `.jks` depois da Fase 1. Se o guard de commit da branch de
segurança existir, ele reprova esses arquivos.

---

## FASE 1 — Keystore de upload `[DONO]`

A chave **de upload** só prova que o AAB é seu. A chave que assina o APK entregue aos
usuários é gerada e guardada pelo Google (Play App Signing, Fase 4). Se você perder a
chave de upload, dá para trocar por formulário — mas só se a conta Play for sua e o App
Signing estiver ligado. Mesmo assim, faça backup.

### 1.1 Gerar com o `keytool` do JBR do Android Studio

```powershell
New-Item -ItemType Directory -Force E:\soulmon-secrets | Out-Null
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore E:\soulmon-secrets\soulmon-upload.jks `
  -alias soulmon-upload -keyalg RSA -keysize 4096 -validity 10000
```

O `keytool` pergunta as senhas e seus dados no prompt (nome pode ser o seu; use a mesma
senha para store e key para reduzir erro). **Digite você mesmo; nunca cole no chat.**

**Verificação:**

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -list -v -keystore E:\soulmon-secrets\soulmon-upload.jks -alias soulmon-upload
```

Mostra `Alias name: soulmon-upload`, `Validity ... until 2054+`, e as linhas `SHA1:` e
`SHA256:` (anote o SHA1 e o SHA256 de **upload**, vão ao Firebase na Fase 5).

### 1.2 Backup (obrigatório, antes de seguir)

1. Copie o `.jks` para **um pendrive/HD externo offline** e para o **gerenciador de
   senhas** (anexo). Guarde lá também alias, store password, key password.
2. Nunca em `D:\Soulmon\repo`, nunca em nuvem sincronizada sem criptografia, nunca no chat.

**Verificação:** abra o `.jks` do backup com o mesmo `keytool -list` acima. Se não abrir,
o backup não vale.

---

## FASE 2 — Criar o app no Play Console + declarações

### 2.1 Criar o app `[SQUAD pode fazer via Chrome com confirmação]` (o botão "Criar app" é confirmação sua)

`https://play.google.com/console/` -> **Todos os apps -> Criar app**. Valores exatos:
`PLAY-LANCAMENTO.md` §D.1 (nome `Soulmon`, idioma padrão en-US, gratuito, declarações
marcadas). "Gratuito" é irreversível.

**Verificação:** o painel do app abre com o nome `Soulmon` e o pacote ainda vazio.

### 2.2 Ficha, Data Safety, IARC, IA, política `[SQUAD pode fazer via Chrome com confirmação]`

Cada "Enviar" é confirmação sua. Fonte de texto (não reescreva, cole):

| Seção do Console | Fonte |
|---|---|
| Ficha principal PT/EN, categoria, contato | [`PLAY-FICHA.md`](PLAY-FICHA.md) §0-§2 |
| Política de privacidade + exclusão de conta | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html` (exclusão: `#exclusao`) |
| Classificação de conteúdo (IARC) | `PLAY-FICHA.md` §4 (compras: **1 não consumível + 3 consumíveis + 1 assinatura**) |
| Público-alvo 18+, anúncios "não" | `PLAY-FICHA.md` §0 |
| Segurança de dados | [`PLAY-DATA-SAFETY.md`](PLAY-DATA-SAFETY.md) §3 (resumo) e tabela de permissões §2.4b |
| Recursos de IA generativa | `PLAY-FICHA.md` §5 |
| Acesso ao app (instruções para o revisor) | **[DONO]** crie uma conta de e-mail/senha só para o revisor (Firebase Auth) e cole as instruções; a squad não digita a senha. **O e-mail do revisor precisa estar em `BETA_EMAILS` ANTES de submeter** (Fase 8B). Sem isso, o revisor vê a tela "beta fechado" e a revisão é rejeitada |

> Gráficos (ícone 512, feature graphic 1024x500, screenshots) são obrigatórios na ficha
> **de produção**. Para as trilhas de teste o Console pode deixar enviar sem eles
> **[a confirmar no Console]**; se pedir, suba placeholders e troque antes da produção.

**Verificação:** painel "Conteúdo do app" sem nenhuma linha "Ação necessária" (exceto as
que dependem de produtos, Fase 6).

---

## FASE 3 — Build local do AAB assinado (sem GitHub Actions)

### 3.1 Preparar o ambiente `[SQUAD pode fazer, sem segredos]`

```powershell
cd D:\Soulmon\repo
git checkout release/beta-1; git pull --ff-only
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"   # JBR 17; o CI usava JDK 21
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

O `JAVA_HOME` do sistema é 1.8 e **não serve** (QA 11/10). Precisa existir
`android\local.properties` com `sdk.dir=C:/Users/spera/AppData/Local/Android/Sdk` (arquivo
local, ignorado pelo git).

### 3.2 Bump do `versionCode` `[SQUAD pode fazer]`

`android/app/build.gradle` -> `defaultConfig.versionCode` (hoje 15, `versionName "1.1.4"`).
Regra: **nenhum AAB subiu ainda**, então o 15 pode ser o primeiro; mas se as branches
mexeram em Kotlin/manifest, suba para 16 e `versionName` para `1.2.0-beta1` para não
confundir. **Cada upload novo precisa de `versionCode` maior que todos os anteriores,
inclusive os de teste interno** (o piso nunca desce).

```powershell
Select-String -Path android\app\build.gradle -Pattern "versionCode|versionName"
```

### 3.3 Build web + sync + AAB `[DONO digita as senhas; squad pode rodar o resto]`

As senhas entram como variáveis de ambiente `ORG_GRADLE_PROJECT_*` (o Gradle as lê como
propriedades `-P`; assim não ficam na linha de comando nem no histórico):

```powershell
npm run build
npx cap sync android

$env:ORG_GRADLE_PROJECT_RELEASE_STORE_FILE = "E:/soulmon-secrets/soulmon-upload.jks"
$env:ORG_GRADLE_PROJECT_RELEASE_KEY_ALIAS  = "soulmon-upload"
$env:ORG_GRADLE_PROJECT_RELEASE_STORE_PASSWORD = Read-Host "store password" -MaskInput
$env:ORG_GRADLE_PROJECT_RELEASE_KEY_PASSWORD   = Read-Host "key password"   -MaskInput

cd android
.\gradlew.bat clean bundleRelease
cd ..

Remove-Item Env:ORG_GRADLE_PROJECT_RELEASE_STORE_PASSWORD, Env:ORG_GRADLE_PROJECT_RELEASE_KEY_PASSWORD
```

Sem `RELEASE_STORE_FILE` o Gradle **não falha**: gera AAB **não assinado** que a Play
recusa. Por isso a verificação abaixo é obrigatória.

**Verificação (assinatura + conteúdo):**

```powershell
$aab = "android\app\build\outputs\bundle\release\app-release.aab"
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify -verbose -certs $aab | Select-String "jar verified|unsigned|SHA"
& "$env:JAVA_HOME\bin\keytool.exe" -printcert -jarfile $aab | Select-String "SHA1|SHA256"
```

Esperado: `jar verified.` e SHA1/SHA256 **iguais** aos da Fase 1.1. Se disser `jar is
unsigned`, as variáveis não chegaram: repita 3.3.

Conferir também as permissões mescladas (devem bater com `PLAY-DATA-SAFETY.md` §2.4b):

```powershell
Select-String -Path android\app\build\intermediates\merged_manifests\release\AndroidManifest.xml -Pattern "uses-permission" | ForEach-Object { $_.Line.Trim() }
```

### 3.4 Limpar a árvore `[SQUAD pode fazer]`

O build local reescreve centenas de arquivos de `dist/` (hash/CRLF) e o `cap sync` marca
dois `.gradle` só por EOL. **Não commite isso** junto com o release:

```powershell
git status --short | Select-Object -First 5
git restore dist android/capacitor.build.gradle android/capacitor.settings.gradle
```

**Verificação:** `git status` limpo (exceto o bump do `versionCode`, que você commita).

---

## FASE 4 — Primeiro upload (teste INTERNO) e Play App Signing

### 4.1 Subir no teste interno `[DONO]` (upload do arquivo é seu; "Iniciar lançamento" é confirmação)

**Testar e lançar -> Testes -> Teste interno -> Criar nova versão.**

1. **Assinatura de apps pela Play:** aceitar *"Deixar o Google gerenciar e proteger a
   chave de assinatura"* (Play App Signing). A chave da Fase 1 vira a de **upload**.
2. Upload de `app-release.aab`.
3. Notas: `Beta 1` / `Beta 1`.
4. Testadores internos: só o seu e-mail agora.
5. Salvar -> Revisar -> **Iniciar lançamento para teste interno**.

**Verificação:** a versão aparece como *Disponível para testadores internos* e o link
de opt-in abre. Instale pelo link no seu aparelho.

> Se a Play recusar o upload por Billing Library: `billing-ktx` tem que ser 8.x (já é
> 8.3.0 no repo). O build local já provou compilar (QA 11/10).

### 4.2 Ler os SHA da Play `[SQUAD pode fazer via Chrome com confirmação]` (só leitura)

**Testar e lançar -> Configuração -> Integridade do app -> Assinatura de apps pela Play.**
Copie: **SHA-1 e SHA-256 do certificado da chave de assinatura do app** (App Signing) e,
na mesma tela, os do **certificado da chave de upload**.

**Verificação:** o SHA-256 de upload na tela == o da Fase 1.1. Os de App Signing são
**diferentes** (é normal; é o que o aparelho vê quando instala pela Play).

---

## FASE 5 — Firebase, API key e assetlinks

### 5.1 Cadastrar os SHA no Firebase `[SQUAD pode fazer via Chrome com confirmação]`

`https://console.firebase.google.com/project/soulmon-app/settings/general` -> app Android
`com.soulmon` -> **Adicionar impressão digital**: SHA-1 e SHA-256 de
**App Signing** e de **upload** (4 valores). O app Android **já existe** e o
`android/app/google-services.json` **já é do projeto `soulmon-app`** (corrige o que
diziam `PLAY-LANCAMENTO.md` §C.2 e `BILLING-SETUP.md`).

Depois baixe o `google-services.json` de novo e compare:

```powershell
git diff --stat android/app/google-services.json
```

- **Sem diff** (ou diff só de `certificate_hash` irrelevantes): o AAB da Fase 3 continua
  valendo.
- **Diff real:** commite o arquivo (não é segredo) e **refaça a Fase 3** com `versionCode`
  +1, e suba no mesmo teste interno.

**Verificação:** `grep -c '"package_name": "com.soulmon"' android/app/google-services.json` -> `1`.

### 5.2 Restringir a API key `[DONO]` (verificação de 5 min; bloqueia o beta, achado F8)

`https://console.cloud.google.com/apis/credentials?project=soulmon-app`

- A key do `google-services.json` (`current_key`): **Restrições de aplicativo -> Apps
  Android** -> adicionar pacote `com.soulmon` + os **4 SHA-1** (debug fixo
  do build.gradle, upload, App Signing). **Restrições de API:** só as de Firebase usadas
  (Identity Toolkit, Token Service, Firebase Installations, FCM Registrations).
- **ATENÇÃO:** a chave **Web** (`VITE_FIREBASE_API_KEY`, inlinada no bundle) é outra. O
  app roda dentro do WebView carregando o Worker, então **o login passa por ela**. Ela
  deve ter restrição por **referenciador HTTP** (`soulmon.mateus-sprnd.workers.dev/*`),
  **nunca** restrição Android (quebraria o login de todos).

**Verificação:** login por e-mail no APK instalado da Play continua funcionando **depois**
de salvar as restrições. Faça este teste imediatamente.

### 5.3 `ASSETLINKS_SHA256` `[DONO]` (secret do Worker)

```powershell
npx wrangler secret put ASSETLINKS_SHA256     # cole o SHA-256 de APP SIGNING, com ":"
```

**Verificação:** `curl.exe -s https://soulmon.mateus-sprnd.workers.dev/.well-known/assetlinks.json`
traz o pacote e o fingerprint.

---

## FASE 6 — Pagamentos e produtos

### 6.1 Perfil de pagamentos `[DONO]`

**Monetizar -> Configurar perfil de pagamentos** (dados bancários/fiscais; só você). Sem
isso os produtos não abrem. Pode levar dias para validar — **inicie logo na Fase 2** se
ainda não tiver.

**Verificação:** a tela de Monetização deixa de pedir configuração de perfil.

### 6.2 Os 4 produtos INAPP `[SQUAD pode fazer via Chrome com confirmação]` (cada "Criar" é confirmação)

`PLAY-LANCAMENTO.md` §D.7 tem a tabela: `soulmon.unlock.full` (não consumível),
`soulmon.credits.60/150/400` (consumíveis). **Preços:** o doc sugere R$ 29,90 / 4,90 /
9,90 / 19,90 e o USD de referência dos Termos é `FULL_UNLOCK_PRICE_LABEL_USD` (US$ 6.99).
O dono ainda não confirmou os preços (lacuna do contexto) -> **decida antes de criar**; no
beta ninguém é cobrado (licença de teste), mas o preço aparece na folha da Play.

**Verificação:** os 4 *Ativos*; o US$ exibido de `soulmon.unlock.full` bate com a constante
(senão muda-se a constante, não o console).

### 6.3 Assinatura trimestral `[SQUAD pode fazer via Chrome com confirmação]`

**Monetizar -> Produtos -> Assinaturas -> Criar assinatura.**

| Campo | Valor |
|---|---|
| ID do produto | `soulmon_cosmetic_quarterly` (exato; conferido: `SUBSCRIPTION_SKU` em `functions/api/_billing.js`) |
| Nome | `Soulmon Cosmético Trimestral` / `Soulmon Cosmetic Quarterly` |
| Plano base | ID livre (sugestão `quarterly`) — conferido: o app **não** lê o ID do plano; `BillingPlugin.kt` escolhe a oferta base sem fase grátis (`baseOffer`) e recusa (`no-base-offer`) se não houver; **Renovação automática**; período de faturamento **3 meses** |
| Preço | **R$ 9,90** (BRL); deixe a Play converter as demais moedas |
| **Oferta / teste gratuito** | **NENHUM.** Não crie oferta de introdução, trial nem "primeiro mês grátis" (regra D10 e R6 do threat model) |
| Período de tolerância (grace) | Padrão da Play (o servidor concede em `IN_GRACE_PERIOD`) |
| Benefícios (texto para o usuário) | "Itens cosméticos do trimestre (cenários e decoração). Não dá vantagem de jogo." |

Ative o plano base. **Verificação:** produto e plano base *Ativos*, **sem** oferta alguma.

> Divulgação pré-compra (compliance): na tela de compra do app deve constar o preço
> localizado, "a cada 3 meses", "renova automaticamente" e "cancele na Play". Isso é do PR
> da assinatura; **confira na tela** na Fase 8.

---

## FASE 7 — Service account, secrets, RTDN, worker de push

### 7.1 Conta de serviço da Play `[DONO]`

1. **Play Console -> Configurações -> Acesso à API** -> vincular ao projeto `soulmon-app`.
2. `https://console.cloud.google.com/iam-admin/serviceaccounts?project=soulmon-app` ->
   criar `play-billing-verify` -> **Chaves -> Adicionar chave -> JSON** (arquivo baixa para
   `E:\soulmon-secrets\`; **é segredo**).
3. Ativar a **Google Play Android Developer API** no mesmo projeto.
4. **Play Console -> Usuários e permissões -> Convidar** o e-mail da conta de serviço com
   **Ver dados financeiros** + **Gerenciar pedidos e assinaturas**. (O escopo de OAuth é o
   mesmo `androidpublisher` para compra única e assinatura — a spec antiga dizia "outro
   escopo", F11 do threat model corrigiu.)

**Verificação:** o e-mail da conta de serviço aparece na lista de usuários do app. A
propagação leva **horas**; antes disso `/api/billing` responde 502 `verification-failed`.

### 7.2 Secrets do Worker raiz `[DONO]`

Na raiz do repo (valor sempre no prompt, nunca na linha):

```powershell
npx wrangler secret put GOOGLE_PLAY_SERVICE_ACCOUNT   # JSON inteiro em UMA linha; abra o .json, copie, cole no prompt
npx wrangler secret put ANDROID_PACKAGE_NAME          # com.soulmon
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT      # o MESMO JSON do workers/ (7.4), agora também na RAIZ: push de alerta ao dono
npx wrangler secret put GROQ_API_KEY                  # org Groq no plano FREE
npx wrangler secret put GEMINI_API_KEY                # projeto do AI Studio SEM faturamento (só o gratuito do chat)
npx wrangler secret list
```

Chat agente: `GROQ_API_KEY` (principal) e `GEMINI_API_KEY` (fallback) como secrets;
`CHAT_MODEL` é **var** opcional (padrão `openai/gpt-oss-120b`). **Custo zero:** a `GROQ_API_KEY` vem de uma org Groq
no plano **Free** e a `GEMINI_API_KEY` de um projeto do AI Studio **sem faturamento** — não ative billing em nenhum dos
dois. Limites e cota: `docs/CHAT-SOULMON.md` §5.
Kill-switches do beta (vars, sem segredo): `BILLING_DISABLED` e `CHAT_DISABLED` — ver
[`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md) §0.

Opcional, mas recomendado para operar o beta: `METRICS_ADMIN_KEY` (também é a chave de
leitura do `/api/crash`), `ENTITLEMENTS_ADMIN_KEY`
(cortesia), `COURTESY_MAX_ACCOUNTS` (estado de 22/09: ausentes; reconfira com `secret list`).
Depois **apague o `.json` da service account** de `E:\soulmon-secrets\` (guarde só no
gerenciador de senhas): `Remove-Item E:\soulmon-secrets\play-billing-verify*.json`.

**Verificação:** `secret list` mostra os nomes. Sem `GOOGLE_PLAY_SERVICE_ACCOUNT`, a rota
da Play responde 503 e **nada é concedido** (proposital).

### 7.3 RTDN (Pub/Sub) para a assinatura `[DONO cria; SQUAD pode ler/conferir via Chrome]`

1. `https://console.cloud.google.com/cloudpubsub/topic/list?project=soulmon-app` -> **Criar
   tópico** `play-rtdn`.
2. Permissões do tópico: dar **Publicador do Pub/Sub** (`roles/pubsub.publisher`) a
   `google-play-developer-notifications@system.gserviceaccount.com`.
3. Criar uma **service account de push** (ex.: `rtdn-push`) só para assinar o OIDC.
4. **Assinatura** do tópico: tipo **Push**, endpoint `https://soulmon.mateus-sprnd.workers.dev/api/rtdn`,
   **Ativar autenticação** com a service account `rtdn-push`, **audience** = o mesmo URL do
   endpoint. Prazo de confirmação 20-60 s; retry com backoff.
5. Secrets do Worker com o e-mail da SA de push e o `aud` (nomes conferidos em
   `functions/api/_pubsubAuth.js`; sem os dois o `/api/rtdn` recusa tudo):
   ```powershell
   npx wrangler secret put RTDN_AUDIENCE        # https://soulmon.mateus-sprnd.workers.dev/api/rtdn (igual ao audience da assinatura push)
   npx wrangler secret put RTDN_PUSH_SA_EMAIL   # rtdn-push@soulmon-app.iam.gserviceaccount.com
   ```
6. **Play Console -> Monetizar -> Configuração de monetização -> Notificações em tempo
   real do desenvolvedor**: colar o nome completo do tópico
   (`projects/soulmon-app/topics/play-rtdn`), tipo *Assinaturas e todos os produtos
   avulsos*, **Enviar notificação de teste**.

**Verificação:** a notificação de teste chega (200) e aparece no log do Worker sem token:
`npx wrangler tail soulmon --format pretty` durante o clique. Sem Bearer o endpoint deve
responder 401 (`curl.exe -i -X POST https://soulmon.mateus-sprnd.workers.dev/api/rtdn`).

### 7.4 Worker de push `[DONO]` (precisa de login)

O `workers/` **não builda no push da `main`**; o redeploy está pendente desde o ritmo das
refeições (cron `*/30`). FCM do APK não envia sem a conta de serviço do Firebase.

```powershell
cd D:\Soulmon\repo\workers
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # Firebase Console -> Contas de serviço -> Gerar chave; cole o JSON
npx wrangler secret put SEASON_ADMIN_KEY           # MESMO valor da raiz (se ainda não tiver feito)
npx wrangler secret list -c wrangler.toml          # esperado: VAPID_JWK, FIREBASE_SERVICE_ACCOUNT, SEASON_ADMIN_KEY
../node_modules/.bin/wrangler deploy --config ./wrangler.toml
npx wrangler deployments list -c wrangler.toml
cd ..
```

O worker se chama `digiapp-push-scheduler` (nome herdado). **Verificação:**
`deployments list` mostra deploy com data de hoje; no APK instalado, ligar notificações
registra um token `fcm:*` (conferir `npx wrangler kv key list --binding PUSH_SUBSCRIPTIONS --prefix fcm:`
traz 1+ chave depois de você ativar).

---

## FASE 8 — Provar a compra no teste INTERNO e ligar o vínculo de conta

### 8.1 Licença de teste `[SQUAD pode fazer via Chrome com confirmação]`

**Play Console (página inicial, fora do app) -> Configurações -> Teste de licença** (é por
conta de desenvolvedor). Adicionar **seu Gmail** agora e, na Fase 9, os dos testadores.
Resposta de licença: **RESPOND_NORMALLY**. Compras de licença de teste não cobram cartão.

### 8.2 Compra ponta a ponta (flag ainda DESLIGADA) `[DONO precisa do aparelho]`

No aparelho instalado pelo link do teste interno, logado com o Gmail de teste:

1. Comprar `Desbloqueio completo` -> folha da Play com aviso de **compra de teste** ->
   concluir. `Configurações -> Conta e compras` mostra o tier pago.
2. Comprar um pacote de créditos (consumível) -> créditos sobem.
3. Assinar o trimestral: a tela mostra preço, "a cada 3 meses", renovação automática;
   concluir. A vitrine do trimestre abre (só `bg`/`furniture`).
4. Esperar a renovação acelerada de teste e ver o RTDN chegar (`wrangler tail`); a
   assinatura **continua ativa depois de 3 dias** (prova do acknowledge).
5. Desinstalar, reinstalar, **Restaurar compras**: tudo volta.

**Verificação:** os 5 itens ok. Se a compra devolver 502 `verification-failed`, a
propagação da service account ainda não terminou; espere horas.

### 8.3 Ligar `PLAY_REQUIRE_ACCOUNT_BINDING=true` `[DONO]` (momento certo)

**Só agora:** o AAB em teste já manda `setObfuscatedAccountId` (compra 8.2 funcionou) e
nenhum APK antigo existe. Ligado cedo demais = zero compras concedidas sem erro visível;
nunca ligado = um recibo vira N contas pagas (SEC-4).

```powershell
npx wrangler secret put PLAY_REQUIRE_ACCOUNT_BINDING     # valor: true
```

(É secret, não var: variável comum some no próximo `wrangler deploy` — ver comentário em
`wrangler.jsonc`.)

**Verificação:** repita uma compra de teste (consumível) no aparelho: concedida. Se todas
passarem a falhar com `account-mismatch`, desfaça (`npx wrangler secret delete
PLAY_REQUIRE_ACCOUNT_BINDING`) e veja `BETA-CONTINGENCIA.md` §3.

---

## FASE 8B — Controles do beta `[DONO]` (antes da Fase 9)

Todos são `wrangler secret put` na raiz do repo. Valem na hora, sem deploy. Detalhes e o
que cada um faz estão em [`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md) §0.

**A ordem importa.** Se `BETA_CLOSED` for ligado antes da lista estar completa, você e o
revisor do Google ficam trancados para fora.

1. **`BETA_EMAILS`** — e-mails separados por vírgula. Coloque **primeiro** o SEU e-mail,
   depois a **conta do revisor** (a de e-mail/senha da Fase 2.2) e por último os
   testadores (o e-mail EXATO com que cada um vai logar, ver `BETA-TESTADORES.md`). No Gmail,
   pontos e `+tag` não importam; nos outros domínios o endereço precisa ser idêntico.
   ```powershell
   npx wrangler secret put BETA_EMAILS     # voce@gmail.com,revisor@...,testador1@gmail.com,...
   ```
   Desde 18/10/2026 (REGISTRO §98) quem está nesta lista entra **como plano pago** (Soulmon próprio, sem comprar). Para testar a compra de verdade, use uma conta FORA da lista.
2. **`IP_HASH_SALT`** — gere o valor e cole no prompt:
   ```powershell
   $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
   npx wrangler secret put IP_HASH_SALT
   ```
3. **`ADMIN_PUSH_TARGET`** (token FCM do seu aparelho) e **`FIREBASE_SERVICE_ACCOUNT`** na
   raiz (já citado no 7.2). Servem para o push de alerta quando um uso passa de 80 %.
4. **Interruptores de emergência.** Todos ficam **desligados por padrão** (ausentes) e só se
   ligam quando algo der errado:
   - `BILLING_DISABLED`: fecha a loja para compra nova; restaurar continua funcionando.
   - `CHAT_DISABLED`: desliga a IA do chat; o pet responde localmente.
   - `SPRITE_DISABLED`: fecha o ateliê de imagens; fica a arte de reserva.
   - `CRASH_DISABLED`: `/api/crash` aceita e descarta.
5. **Regra de Rate Limiting** em `/api/crash*`: 5 por minuto por IP, bloqueio de 10 minutos
   (passo a passo em `BETA-CONTINGENCIA.md` §0.4).
6. **`BETA_CLOSED` POR ÚLTIMO:**
   ```powershell
   npx wrangler secret put BETA_CLOSED     # true
   ```

**Verificação** (a squad pode rodar a 1ª):
- E-mail fora da lista recebe `403 beta-closed` em `/api/save`. Logue no app web com um
  Gmail que não está na lista: aparece a tela "O Soulmon está em teste fechado" com o
  e-mail mostrado. Sem login, `curl.exe -i "https://soulmon.mateus-sprnd.workers.dev/api/save?id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"`
  responde 403 ou 401.
- A **conta do revisor** loga numa **instalação limpa** (aparelho ou perfil de navegador
  novo) e vê o app normal, não a tela fechada.
- O seu e-mail também entra normalmente.

---

## FASE 9 — Trilha de TESTE FECHADO

> Só comece com o app provado nas fases 4-8. O relógio dos 14 dias corre daqui.

### 9.1 Google Group de testadores `[DONO cria; SQUAD pode ajudar via Chrome]`

`https://groups.google.com/` -> **Criar grupo**: nome `Soulmon Beta`, e-mail
`soulmon-beta@googlegroups.com` (ou o disponível). Configurações: *Quem pode participar:
qualquer pessoa pode pedir para participar* e **ative aprovação manual**; *quem pode ver
membros: só proprietários*. O Play Console aceita o e-mail do grupo como lista de testadores
(é o jeito de adicionar/tirar gente sem mexer no Console).

**Verificação:** você é Proprietário e o grupo aparece em `groups.google.com`.

### 9.2 Criar a faixa de teste fechado `[SQUAD pode fazer via Chrome com confirmação]`

**Testar e lançar -> Testes -> Teste fechado -> Criar faixa** (nome `Beta Soulmon`; a faixa
padrão "Alfa" também serve). Aba **Testadores**: **Criar lista de e-mails** (ou escolher
**Google Groups**) -> colocar `soulmon-beta@googlegroups.com`. Países: Brasil (+ onde
tiver testadores). **Salvar.**

Aba **Versões -> Criar nova versão**: **reaproveitar o AAB** já no teste interno (botão
"Adicionar da biblioteca") ou subir um novo com `versionCode` maior. Notas: PT e EN.
**Antes de submeter:** confirme que o e-mail da conta do revisor (Fase 2.2) está em
`BETA_EMAILS` e que ela entra numa instalação limpa (Fase 8B, verificação).
**Revisar -> Iniciar lançamento para teste fechado** `[submissão: confirmar]`.

**Verificação:** a faixa mostra *Em análise* e depois *Disponível para testadores*. A
**primeira** versão de uma trilha fechada passa por revisão do Google (horas a poucos
dias; o relógio dos 14 dias **não** conta enquanto estiver em análise **[a confirmar no
Console]**).

### 9.3 Link de opt-in `[SQUAD pode ler via Chrome]`

Na aba **Testadores** da faixa: **Como os testadores participam -> Copiar link**. É
`https://play.google.com/apps/testing/com.soulmon` (a página web de opt-in) e
o link direto da loja. Este link vai para todos os testadores
(`BETA-TESTADORES.md`).

**Verificação:** abra o link em janela anônima logado como outro Gmail que esteja no
grupo: aparece "Tornar-se testador".

### 9.4 Cadastrar os e-mails de licença de teste `[SQUAD pode fazer via Chrome com confirmação]`

Cada testador **também** vai em **Configurações -> Teste de licença** para a compra não
cobrar. Depois da lista final: faça uma planilha `E:\soulmon-beta\testadores.csv` (nome,
Gmail, canal, data de opt-in, status) que serve de controle do relógio.

**Verificação:** quantidade de e-mails em Teste de licença == quantidade no grupo.

---

## FASE 10 — O relógio dos 14 dias

### 10.1 A regra (informada pelo Google para conta pessoal nova; confira o texto vigente em `support.google.com/googleplay/android-developer/answer/14151465` **[a confirmar]**)

- **12 testadores com opt-in ativo**, em teste fechado, **por 14 dias seguidos**.
- Depois, o painel libera **Candidatar-se à produção** (formulário com perguntas sobre o
  teste: como recrutou, feedback, o que mudou). O Google responde em ~7 dias.
- Se o número cair abaixo de 12 durante o período, o relógio **pode** reiniciar
  **[a confirmar]**. Tratar como se reiniciasse.
- **Recomendado: 15+ testadores opted-in desde o dia 1** (margem para 3 desistências).
  Ideal: 20, com reserva descrita em `BETA-CONTINGENCIA.md` §6.

### 10.2 Calendário

| Dia | O que fazer |
|---|---|
| D0 | Dia do 12º opt-in **com a versão disponível**. Registre data/hora no CSV. |
| D1-D3 | Cheque o painel todo dia (10.3). Corrija quem não instalou. Smoke manual (10.4). |
| D4 | Mensagem de meio de jornada (`BETA-TESTADORES.md` §7). |
| D7 | Checkpoint: testadores ativos >= 15? crash? compras? |
| D10 | Lembrete de "não desinstalar" + recrutar reserva se < 15. |
| D13 | Pesquisa de saída (`BETA-TESTADORES.md` §9). |
| D14 | Verifique em **Painel** o contador "14 dias" completo; clique **Candidatar-se à produção**. |

### 10.3 Checagem diária `[SQUAD pode ler via Chrome]` (5 minutos)

1. Play Console -> **Testes -> Teste fechado -> Testadores:** contagem de opted-in e
   instalados.
2. **Qualidade -> Android vitals / ANRs e falhas:** zero? (12-15 testadores dão pouco
   sinal; por isso o `/api/crash` próprio.)
3. `/api/crash`: novas ocorrências desde ontem —
   `$env:METRICS_ADMIN_KEY = "<valor>"; node scripts/crash-report.mjs --days 2` (GET com
   cabeçalho `X-Metrics-Key`; sem a chave a rota responde 404 de propósito; `--json` para
   bruto). Registros expiram em 14 dias.
4. `npx wrangler tail soulmon --format pretty` por 1 minuto: erros 5xx em `/api/save`,
   `/api/billing`, `/api/rtdn`?
5. Formulário de bugs (`BETA-TESTADORES.md` §6): respostas novas.

Se algo aparecer, siga [`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md) pelo cenário.

### 10.4 Smoke manual no aparelho (D1 e a cada AAB novo) `[DONO]`

Instalar pelo link, login, criar uma tarefa, completar, encerrar o app (swipe), reabrir
(save voltou), modo avião (aparece a tela de erro de rede com a identidade do app, não
tela branca), voltar online, comprar de teste, desinstalar/reinstalar e restaurar.

### 10.5 Publicar correção durante o relógio

- Correção **só web** (frontend/Worker): o APK carrega `server.url`, então vale na hora
  para todos, sem tocar na Play. É o caminho preferido.
- Correção **nativa** (Kotlin, manifesto, plugin): novo AAB (`versionCode` +1) e nova
  versão **na mesma trilha**. Os testadores atualizam sozinhos; não perde opt-in.
- **Nunca** trocar o pacote nem mexer na lista de testadores para tirar gente.

### 10.6 Fechando

D14 cumprido -> **Candidatar-se à produção** (formulário). Enquanto o Google analisa,
mantenha o teste aberto e os testadores instalados. Só depois do "ok" siga a produção
(`PLAY-LANCAMENTO.md` §D.12). Produção exige gráficos finais e Data Safety/Ficha já
revisados.

---

## Anexo A — Quem faz o quê (resumo)

| Passo | Quem |
|---|---|
| 0.1-0.2, 0.4, 3.1-3.2, 3.4, 5.1 (diff) | Squad |
| 0.3 migração D1, 1 keystore, 3.3 senhas, 4.1 upload, 5.2, 5.3, 6.1, 7.1, 7.2, 7.4, 8.2, 8.3, 9.1 | Dono |
| 2.1-2.2, 4.2, 6.2-6.3, 8.1, 9.2-9.4, 10.3 | Squad via Chrome, com o seu "sim" em cada envio |

## Anexo B — Erros comuns

| Sintoma | Causa | Ação |
|---|---|---|
| Play recusa o upload: "o APK/AAB está assinado no modo debug" ou "sem assinatura" | build sem `RELEASE_STORE_FILE` | repetir 3.3 e conferir `jar verified` |
| "Versão com código 15 já usada" | `versionCode` repetido | +1 em `build.gradle` |
| Login falha só no APK da Play | SHA de App Signing não está no Firebase / restrição da key errada | Fase 5.1-5.2 |
| `/api/billing` 503 | falta `GOOGLE_PLAY_SERVICE_ACCOUNT` ou `ANDROID_PACKAGE_NAME` | 7.2 |
| `/api/billing` 502 `verification-failed` | service account ainda propagando, sem permissão financeira, ou API não ativada | 7.1; espere horas |
| `/api/billing` 403 `account-mismatch` | binding ligado e a compra veio sem `obfuscatedAccountId` | AAB desatualizado: peça atualização |
| Produto não aparece no app | app nunca foi enviado a nenhuma trilha, ou produto inativo, ou conta não é testadora | 4.1, 6.2, 8.1 |
| RTDN não chega | tópico sem permissão do `google-play-developer-notifications@...`, `aud` errado ou 401 por OIDC | 7.3 |
