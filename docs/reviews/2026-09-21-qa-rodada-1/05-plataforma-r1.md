# QA Rodada 1 — PLATAFORMA (guarda-plataforma) — 21/09/2026, noite

Repo `D:\Soulmon\repo` · branch `qa/rodada-a` · HEAD `5228145e`. Só leitura, nada aplicado.
Frente: Android/Kotlin, desktop/Electron, EN, a11y de código. Ledger `docs/plano-melhorias/ledger/plataforma.md`.

Regra da rodada respeitada: o que o consolidado da manhã (`00-CONSOLIDADO.md` A2) já listou está marcado
**ainda aberto** com o porquê; o resto é novo ou "não medido" ontem.

---

## 0. O que mudou hoje em `android/` + `desktop/` (`git log 11e9b237..HEAD -- android desktop`)

Um commit só: `4a8b8049` — `android/app/build.gradle` (versionCode 14→15, `1.1.4`) e `android/variables.gradle`
(`compileSdk`/`targetSdk` = **36**). O próprio commit escreve: *"NÃO foi bumpado aqui de propósito: `BillingPlugin.kt`
chama `enablePendingPurchases()` SEM argumento … subir só esta linha quebra o compile"*. Ou seja: o bump da Play
Billing ficou **conscientemente** para trás e o alvo subiu para 36 sem ler os behavior changes. As duas coisas são o
corpo deste relatório.

---

## 1. FATAL confirmado — `billing-ktx:6.2.1` é recusada pela Play

**Fonte primária (WebFetch, developer.android.com/google/play/billing/deprecation-faq, 21/09/2026):**

| Versão PBL | Novos apps e updates até | Extensão até |
|---|---|---|
| 5 | 31/08/2024 | 01/11/2024 |
| **6** | **31/08/2025** | 01/11/2025 |
| **7** | **31/08/2026** | 01/11/2026 |
| 8 | 31/08/2027 | 01/11/2027 |

Texto literal: *"By Aug 31, 2026, all new apps and updates to existing apps must use Billing Library version 8 or
later. If you need more time to update your app, you can request an extension until Nov 1, 2026."*

Hoje é 21/09/2026 → a 6.x está **dois ciclos** vencida; a 7.x já venceu há 3 semanas. O único alvo que a Play aceita
para o primeiro AAB é **8.x** (release notes: última publicada **8.1.0, 2025-11-06**; conferir no Maven no dia do bump).
minSdk da 8.x = 23; o app tem `minSdkVersion = 26` — sem conflito.

### 1.1 Tudo que muda em `android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt` (6.2.1 → 8.x)

Conferido contra `migrate-gpblv8`, `release-notes` e a referência de `ProductDetailsResponseListener` /
`QueryProductDetailsResult` / `BillingClient.Builder` (WebFetch, todas hoje).

| Símbolo no arquivo | Hoje (6.2.1) | Em 8.x | Quebra compile? |
|---|---|---|---|
| `load()` › `enablePendingPurchases()` | sem argumento | **removido**; só existe `enablePendingPurchases(PendingPurchasesParams)`. Doc: *"the deprecated enablePendingPurchases() is functionally equivalent to `enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())`"* | **SIM** |
| `purchase()` › `client.queryProductDetailsAsync(queryParams) { result, productDetailsList -> … productDetailsList.firstOrNull() }` | 2º parâmetro `List<ProductDetails>` | `ProductDetailsResponseListener.onProductDetailsResponse(BillingResult, QueryProductDetailsResult)` — o 2º parâmetro virou **`QueryProductDetailsResult`** com `.productDetailsList` e `.unfetchedProductList` (`List<UnfetchedProduct>`, com código de status por produto). `.firstOrNull()` não compila mais | **SIM** |
| `getLocalizedPrice()` › mesmo `queryProductDetailsAsync … { result, list -> list.firstOrNull() }` | idem | idem | **SIM** |
| `BillingClient.newBuilder(context).setListener(…)` | ok | ok, inalterado. Novo opcional: `enableAutoServiceReconnection()` — substitui o `connect()` manual em `onBillingServiceDisconnected` (hoje comentado "a próxima operação chama connect() de novo") | não (opcional) |
| `acknowledgeIfNeeded()` › `AcknowledgePurchaseParams` / `acknowledgePurchase` | ok | **inalterado** | não |
| `consume()` › `ConsumeParams` / `consumeAsync` | ok | inalterado | não |
| `getPurchases()` › `QueryPurchasesParams` / `queryPurchasesAsync(params, listener)` | já na forma nova | inalterado (a forma removida era `queryPurchasesAsync(String skuType, …)`, que o arquivo não usa) | não |
| `BillingFlowParams.ProductDetailsParams` / `setObfuscatedAccountId(saveId)` | ok | **inalterado** — o vínculo WP0.6 sobrevive igual | não |
| `Purchase.purchaseToken` / `.purchaseState` / `.isAcknowledged` / `.products` | ok | inalterados | não |
| `queryPurchaseHistoryAsync` | não usado | removido — irrelevante aqui | — |
| Assinaturas (`setOldSkuPurchaseToken`, `setReplaceProrationMode`) | não usado | removidos — irrelevante (só INAPP) | — |

Resumo: **3 pontos quebram o compile** (1 no `load()`, 2 lambdas de `queryProductDetailsAsync`). O resto do plugin passa
intacto. Nada de lógica de negócio muda: o plugin segue devolvendo só o `purchaseToken`.

### 1.2 PATCH proposto (diff em texto — NÃO aplicado)

```diff
--- android/app/build.gradle
-    implementation "com.android.billingclient:billing-ktx:6.2.1"
+    // Play recusa < 8 desde 31/08/2026 (developer.android.com/google/play/billing/deprecation-faq).
+    // 8.1.0 = última das release notes em 21/09/2026; conferir Maven antes do AAB.
+    implementation "com.android.billingclient:billing-ktx:8.1.0"

--- android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt
 import com.android.billingclient.api.ConsumeParams
+import com.android.billingclient.api.PendingPurchasesParams
 import com.android.billingclient.api.ProductDetails
 import com.android.billingclient.api.Purchase
 import com.android.billingclient.api.PurchasesUpdatedListener
 import com.android.billingclient.api.QueryProductDetailsParams
+import com.android.billingclient.api.QueryProductDetailsResult
 import com.android.billingclient.api.QueryPurchasesParams
@@ override fun load()
         billingClient = BillingClient.newBuilder(context)
             .setListener(purchasesUpdatedListener)
-            .enablePendingPurchases()
+            // PBL 8: a forma sem argumento não existe mais. `enableOneTimeProducts()`
+            // é o equivalente exato do que a 6.x fazia (só INAPP; sem prepaid plans).
+            .enablePendingPurchases(
+                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
+            )
+            // Reconexão automática: substitui o "a próxima operação chama connect()".
+            .enableAutoServiceReconnection()
             .build()
@@ fun purchase(call)  — dentro de connect { … }
-            client.queryProductDetailsAsync(queryParams) { result, productDetailsList ->
+            client.queryProductDetailsAsync(queryParams) { result, queryResult: QueryProductDetailsResult ->
                 if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                     call.reject("product-query-failed-${result.responseCode}")
                     return@queryProductDetailsAsync
                 }
-                val details: ProductDetails = productDetailsList.firstOrNull() ?: run {
+                val details: ProductDetails = queryResult.productDetailsList.firstOrNull() ?: run {
+                    // PBL 8 devolve o motivo por produto: `unfetchedProductList[i].statusCode`.
+                    // Vai no reject para o JS distinguir "não existe" de "sem faixa de teste".
+                    val motivo = queryResult.unfetchedProductList.firstOrNull()?.statusCode
                     // Produto não existe no Play Console ou o app não está
                     // publicado numa faixa de teste.
-                    call.reject("product-not-found")
+                    call.reject(if (motivo != null) "product-not-found-$motivo" else "product-not-found")
                     return@queryProductDetailsAsync
                 }
@@ fun getLocalizedPrice(call)
-            client.queryProductDetailsAsync(queryParams) { result, list ->
+            client.queryProductDetailsAsync(queryParams) { result, queryResult ->
                 val preco = if (result.responseCode == BillingClient.BillingResponseCode.OK) {
-                    list.firstOrNull()?.oneTimePurchaseOfferDetails?.formattedPrice ?: ""
+                    queryResult.productDetailsList.firstOrNull()?.oneTimePurchaseOfferDetails?.formattedPrice ?: ""
                 } else ""
```

⚠️ `src/utils/playBilling.ts` trata `reason` como string opaca (`product-not-found`); se o sufixo `-$motivo` entrar,
conferir `grep -n "product-not-found" src` para que nenhum `===` estrito quebre. Alternativa mais conservadora: manter
`"product-not-found"` sem sufixo e só logar o `statusCode`.

### 1.3 O que muda em `functions/api/_billing.js`

**Nada.** `verifyPlayPurchase(env, { productId, purchaseToken, saveId })` chama
`androidpublisher/v3/applications/{pkg}/purchases/products/{productId}/tokens/{purchaseToken}` e lê
`purchaseState` (0/1/2) e `obfuscatedExternalAccountId` (`isPlayPurchaseBoundTo`). O `purchaseToken` é o mesmo
objeto nas duas bibliotecas — a PBL 8 muda a API do **cliente**, não a Developer API do servidor nem o formato do token.
`isPlayPurchaseVoided` idem. Contrato JS↔Kotlin (`src/utils/playBilling.ts` › `purchase`/`consume`/`getPurchases`)
também não muda: os campos devolvidos (`purchaseToken`, `productId`, `formattedPrice`) são os mesmos.

### 1.4 Régua que falta (PL-8, proposta)

Nenhum teste em `node` alcança o Gradle. Guard textual, no padrão de `widgetSemCobranca.contract.test.ts` (lê o fonte):
`android/app/build.gradle` deve casar `/billing(-ktx)?:(8|9|[1-9]\d)\./` e `BillingPlugin.kt` deve casar
`/enablePendingPurchases\(\s*PendingPurchasesParams/` e **não** casar `/enablePendingPurchases\(\)/`. Entra no MESMO
commit do bump. Quem prova o compile é só o CI (`android-build.yml`) — isso continua sendo verdade e continua sem
substituto.

---

## 2. `SoulmonAlarmPlugin.kt` › `setExactAndAllowWhileIdle` sem `canScheduleExactAlarms()`

**Fonte (WebFetch, developer.android.com/develop/background-work/services/alarms/schedule):** *"The
`SCHEDULE_EXACT_ALARM` permission is not pre-granted to fresh installs of apps targeting Android 13 (API level 33)
and higher. If a user transfers app data to a device running Android 14 through a backup-and-restore operation, the
`SCHEDULE_EXACT_ALARM` permission will be denied on the new device."* E: *"call `canScheduleExactAlarms()` before
trying to set an exact alarm"* — sem a permissão, `setExactAndAllowWhileIdle()` lança `SecurityException`.

### 2.1 O que acontece hoje, caminho por caminho

| Caminho | Símbolo | Efeito com a permissão negada (todo Android 14+ com install limpo, target 36) |
|---|---|---|
| App → `SoulmonAlarm.scheduleAlarm` (`src/utils/notifications.ts` › `syncActivityAlarms`/`syncTaskAlarms`, ambos com `.catch(() => {})`) | `scheduleAlarmInternal` › `alarmManager.setExactAndAllowWhileIdle` | `SecurityException` dentro do método do plugin; o Capacitor converte em reject, o JS engole. **Nenhum alarme de tarefa toca no APK, em silêncio.** O `putString("alarm_…")` vem DEPOIS do `set` → nada é persistido |
| Boot / update → `BootReceiver` › `rescheduleAll` | mesmo `scheduleAlarmInternal`, **sem try/catch em volta do `set`** (o `try` do laço pega `Exception`, `SecurityException` é `RuntimeException` → pego, ok) | Não crasha (o `catch (_: Exception)` engole), mas engole também o motivo: o usuário que tinha a permissão, gravou alarmes e a perdeu por backup-restore fica sem NENHUM alarme e sem aviso |
| `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` | não existe receiver | Quando o usuário concede a permissão depois, nada reagenda até o app abrir |

O manifesto declara `SCHEDULE_EXACT_ALARM` (correto — `USE_EXACT_ALARM` é só para despertador/calendário por política
da Play; o Soulmon não se qualifica). O que falta é o gate e o fallback.

### 2.2 PATCH proposto (não aplicado)

```diff
--- android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonAlarmPlugin.kt
+import android.os.Build
+import android.provider.Settings
@@ companion object
         fun scheduleAlarmInternal(context: Context, id: String, title: String, body: String, scheduledTime: String) {
             …
             val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
-            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
+            // Android 14+ (target ≥ 33) NÃO pré-concede SCHEDULE_EXACT_ALARM; sem ela o
+            // setExact* lança SecurityException. Lembrete de tarefa não é despertador:
+            // um minuto de janela é aceitável, silêncio total não é. Fallback INEXATO
+            // (setAndAllowWhileIdle), nunca "não agendar".
+            if (canExact(alarmManager)) {
+                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
+            } else {
+                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
+            }
@@
+        fun canExact(alarmManager: AlarmManager): Boolean =
+            Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
+
+        /** Para o JS decidir se mostra o convite "Alarmes e lembretes" nas Configurações. */
+        fun exactAlarmSettingsIntent(context: Context): Intent? =
+            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
+                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).setData(android.net.Uri.parse("package:${context.packageName}"))
+            else null
@@ class SoulmonAlarmPlugin
+    /** Devolve `{ exact: boolean }` — o app mostra o convite só quando `false`. */
+    @PluginMethod
+    fun canScheduleExact(call: PluginCall) {
+        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
+        call.resolve(com.getcapacitor.JSObject().put("exact", canExact(am)))
+    }
+
+    /** Abre a tela do sistema "Alarmes e lembretes" (gesto do usuário, nunca sozinho). */
+    @PluginMethod
+    fun openExactAlarmSettings(call: PluginCall) {
+        val intent = exactAlarmSettingsIntent(context) ?: run { call.resolve(); return }
+        activity?.startActivity(intent); call.resolve()
+    }

--- android/app/src/main/AndroidManifest.xml
         <receiver android:name=".notifications.BootReceiver" android:exported="false">
             <intent-filter>
                 <action android:name="android.intent.action.BOOT_COMPLETED" />
                 <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
+                <!-- usuário concedeu/revogou "Alarmes e lembretes": reagendar (doc oficial) -->
+                <action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" />
             </intent-filter>

--- android/app/src/main/java/com/hexervoodoom/soulmon/notifications/BootReceiver.kt
             Intent.ACTION_BOOT_COMPLETED,
-            Intent.ACTION_MY_PACKAGE_REPLACED -> SoulmonAlarmPlugin.rescheduleAll(context)
+            Intent.ACTION_MY_PACKAGE_REPLACED,
+            AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED -> SoulmonAlarmPlugin.rescheduleAll(context)
```

Lado JS (`src/plugins/SoulmonAlarmPlugin.ts`): acrescentar `canScheduleExact()` e `openExactAlarmSettings()` à
interface, com web no-op. O convite na UI é **opcional e por gesto** (o texto nasce EN + PT); sem ele o fallback
inexato já cobre o essencial. Guard textual: `SoulmonAlarmPlugin.kt` casa `/canScheduleExactAlarms\(\)/` e
`/setAndAllowWhileIdle\(/`.

Observação de paridade que fica: o alarme é ONE-SHOT ("HH:mm" → próximo horário) e só é re-agendado quando o JS roda
`syncTaskAlarms` de novo (app aberto). Não é regressão de hoje, mas é a razão pela qual o FCM do worker é o canal que
de fato chega — registrar, não consertar agora.

---

## 3. `targetSdk 36` — behavior changes do Android 16 que o código exercita

Fonte: WebFetch de `about/versions/16/behavior-changes-16` (só quem mira 36) e `behavior-changes-all` (todos), hoje.
Só o que o Soulmon toca; o resto (Bluetooth, health, Mali, local network, MediaStore) não se aplica.

| Mudança (A16) | Onde toca no app | Estado | Ação |
|---|---|---|---|
| **Edge-to-edge**: `R.attr#windowOptOutEdgeToEdgeEnforcement` "deprecated and disabled" para target 36 em aparelho A16 | `MainActivity` (WebView do Capacitor 8.4) — `styles.xml` › `AppTheme.NoActionBar` não declara opt-out nem insets; o app web é quem trata `safe-area-inset-*` | **Não medido** — Capacitor 8 já mira edge-to-edge, mas o conteúdo web precisa de `viewport-fit=cover` + `env(safe-area-inset-*)`; `grep -rn "safe-area-inset" src/index.css` é a régua | Medir no emulador A16 (→ `soulmon-operador`); se a barra de status cobrir a nav superior, o conserto é CSS, não Kotlin |
| **Predictive back ligado por padrão**: `onBackPressed()` não é chamado; `KEYCODE_BACK` não é despachado | `MainActivity.java` não sobrescreve `onBackPressed` (grep = 0 em `android/app/src/main/java`); o Capacitor 8 usa `OnBackInvokedCallback` | OK por herança do Capacitor 8.4 | Nada; conferir depois do bump de `@capacitor/android` se houver |
| **Orientação/resizability ignoradas em sw ≥ 600dp** | `MainActivity` não fixa `screenOrientation` (manifest) → não há restrição a perder | OK | Nada |
| **`scheduleAtFixedRate` executa só 1 missed** | nenhum `ScheduledExecutorService` em Kotlin; `WidgetRefreshWorker` é WorkManager | não se aplica | — |
| **JobScheduler/WorkManager quotas por standby bucket** (todos os apps) | `WidgetRefreshWorker.kt` (WorkManager periódico) | Em bucket `rare`/`restricted` o refresh do widget atrasa mais — o widget mostra estado velho por mais tempo | Aceitar; o `updateWidgetData` do app (`SoulmonWidgetPlugin`) já empurra atualização quando o app abre |
| **Notificações**: nenhum item do A16 muda `NotificationCompat` simples (`AlarmReceiver` usa canal + `notify(tag, 0, …)`); o rate-limit/cooldown de notificação é do A15 e já vale | `AlarmReceiver.kt`, `workers/fcm.js` | OK | Nada |
| **Alarmes exatos**: A16 não muda a regra; a regra dura é do A14 (§2 acima) e o target 36 a **ativa** neste APK | `SoulmonAlarmPlugin.kt` | **Aberto** (§2) | Patch §2 |
| **`allowBackup`**: A16 não muda backup. `backup_rules.xml` exclui `app_webview` (PII do oráculo) e mantém `SharedPreferences` (`SoulmonWidget*`, `SoulmonAlarms`) | `AndroidManifest.xml` › `android:fullBackupContent`/`dataExtractionRules` | OK — mas note o cruzamento com §2: `SoulmonAlarms` restaurado + `SCHEDULE_EXACT_ALARM` negada no aparelho novo = `rescheduleAll` engolindo `SecurityException` para todo alarme | Patch §2 resolve (fallback inexato) |
| **16 KB page size** (todos): "compatibility mode dialog shown to users on launch" para app alinhado a 4 KB | nenhuma `.so` própria; as do Capacitor/Firebase/Billing 8.x são alinhadas | Não medido — `unzip -l app.aab | grep "\.so$"` + `zipalign -c -P 16` é a régua | → `soulmon-operador` no CI |
| **Intent redirection hardening** (todos) | `WidgetRenderer.attachClick` abre a própria `MainActivity` (explícito); `BootReceiver` e `AlarmReceiver` `exported=false` | OK | Nada |
| **`announceForAccessibility` deprecated** (todos) | não usado em Kotlin; a11y do app é web | — | — |
| **Ícone temático automático (A16 QPR2)** | `mipmap/ic_launcher` — sem camada `monochrome`? (`grep -rn monochrome android/app/src/main/res/mipmap-anydpi*` = **não conferido**) | Não medido | Baixo: se faltar, o sistema tinge o ícone sozinho |

Conclusão de §3: o bump para 36 não introduz quebra nova além de **ativar** a regra de alarme exato do A14 (§2) e de
deixar duas medições pendentes (edge-to-edge no WebView e 16 KB) que só um emulador/AAB prova — ambos do `operador`.

---

## 4. `WidgetRenderer.kt` › `CHAT_FIXED_PHRASES` só EN, "I missed you!" (L11)

### 4.1 Primeiro: EN-only é DECISÃO, não esquecimento

`docs/REGISTRO-DE-DECISOES.md` › **13.18** (modal final, 15/09/2026): *"A copy dos widgets Android é só em INGLÊS
— a escada de frases, o contador e o chat; nada de PT no widget (⚠️ diverge do `CLAUDE.md` › Idioma … o dono
decidiu a exceção)"*. Alternativa que perdeu: *"estender o bridge com `language` e ter PT e EN"*. Gatilho para
reabrir: *"se o público do APK for majoritariamente PT e a home screen em inglês gerar estranhamento (avaliações)"*.
E há régua travando: `widgetSemCobranca.contract.test.ts` › *"a escada é só EN e sem emoji (13.18, D-F3)"* reprova
`saudade|Quase lá|…`.

Logo: **o consolidado A2 ("9 frases só EN") não é achado de plataforma — é a 13.18 funcionando.** Não reabro. O que
fica devendo é o `CLAUDE.md` › Idioma registrar a exceção (a própria 13.18 pede: *"o `CLAUDE.md` precisa
registrar"*) — `grep -n "13.18" CLAUDE.md` = 0. Dono: `soulmon-guarda-dono`/coordenador (é edição do CLAUDE.md).

### 4.2 O que É achado, independente de idioma: L6/L11

Bíblia L11: a criatura *"nunca … sente por causa do que a pessoa fez ou deixou de fazer ao longo do tempo"*; L6:
*"Ausência é saudade, nunca fatura"* + §1045 *"A frase implica espera, saudade, solidão … da criatura durante a
[ausência]"*. Em `WidgetRenderer.kt`:

| Frase | Símbolo | Lei | Veredito |
|---|---|---|---|
| `"I missed you!"` | `CHAT_FIXED_PHRASES` | L11 (emoção causada pela ausência) | **sai** |
| `"I miss you..."` (quando `hp <= 20`) | `buildChatPhrases` › `contextual` | L11 + L6 — é PIOR: liga a saudade ao PLACAR de HP, exatamente o `lowHp` que a bíblia §412–422 chama de "cobrança" | **sai** |
| `"You're my favorite partner!"` | `CHAT_FIXED_PHRASES` | L12 (elogio à pessoa) | discutível → `redator-ux` |
| `"We crushed it today! ✨"` | `buildChatPhrases` (`completed >= total`) | L12 + D-F3 "sem emoji" (o ✨ ficou) | emoji sai; frase → `redator-ux` |
| as outras 7 | — | passam (notar/estar presente/convidar) | ficam |

**Buraco na régua:** o guard veta `saudade` (PT) mas não `miss(ed)? you` (EN) — a 13.18 tornou o widget só EN e o
teste ficou vigiando o idioma que saiu. Proposta de `it` novo em `widgetSemCobranca.contract.test.ts`:
`expect(codigo).not.toMatch(/miss(ed)? you|waited for you|lonely|alone without/i)` + `expect(codigo).not.toMatch(/✨/)`.

Substitutas EN dentro do teto ~22 chars (README fora-do-app §11) e das leis, para o `redator-ux` fechar:
`"I missed you!"` → `"You're here. Good."` (L11-permitido: reação ao agora) · `"I miss you..."` (hp≤20) →
`"Quiet day. Me too."` (é o exemplo literal permitido da L11, EN) · `"We crushed it today! ✨"` → `"That closed a stretch."`
(L12-permitido: nomeia o ato).

### 4.3 O mecanismo de idioma — pronto para o dia em que a 13.18 reabrir (não implementar agora)

Pergunta da tarefa: *"o widget sabe o `language` do save?"* **Não.** `SoulmonWidgetPlugin.kt` › `updateWidgetData`
grava `pet_name`, `current_stage`, `egg_type`, `branch_type`, contadores, `habit_*`, `needs_intervention` — **nenhuma
chave de idioma** (`grep -n language` nos 3 arquivos = 0). `WidgetRenderer.kt` não lê `Locale` também. O
`language` vive no `App.tsx` (`useState<Language>` via `resolveLanguage`) e não é passado no `updateWidgetData`.

Desenho (respeita "chave nova = acrescenta; nunca renomeia"):
1. `src/plugins/SoulmonWidgetPlugin.ts` › `DigiWidgetData.language?: 'en-US' | 'pt-BR'` (opcional).
2. `App.tsx` › `updateWidgetData({ …, language })` e `language` entra nas deps do `useEffect`.
3. `SoulmonWidgetPlugin.kt`: `call.getString("language")?.let { editor.putString("language", it) }`.
4. `WidgetRenderer.kt`: `val pt = prefs.getString("language", null) == "pt-BR"`; `CHAT_FIXED_PHRASES` vira
   `CHAT_FIXED_PHRASES_EN`/`_PT` de mesmo tamanho; **fallback quando a chave falta = EN** (é a base; nunca
   `Locale.getDefault()` — `resolveLanguage` é o ponto único e ele está no app, não no aparelho).
5. Régua: `it('PT e EN têm o mesmo número de frases')` lendo o fonte + o veto EN da §4.2 aplicado às duas listas.

Fica registrado como a "alternativa que perdeu", com custo estimado (5 toques, 1 chave nova), para não ser
redesenhado quando o gatilho da 13.18 disparar.

### 4.4 Achado NOVO de paridade no mesmo bridge (a divergência mais cara desta rodada fora do dinheiro)

`src/App.tsx` › o `useEffect` "Sync game state to Android home screen widget":
```ts
const petName = gameState.evolutionStage.charAt(0).toUpperCase() + gameState.evolutionStage.slice(1);
SoulmonWidget.updateWidgetData({ petName: petName, … })
```
O widget recebe **"Rookie"/"Champion"** como `pet_name`, enquanto o app inteiro exibe
`soulmonDisplayName(gameState.soulmonMeta)` (`src/utils/petName.ts`: nome batizado > `baseName`) — 3 usos no
`App.tsx`. A criatura que se chama "Pyraka" na Home aparece como "Rookie" nos widgets A, B e D
(`views.setTextViewText(R.id.widget_pet_name, petName)`). Comando que prova: `grep -n "petName = gameState.evolutionStage"
src/App.tsx` (1 hit) vs `grep -c "soulmonDisplayName(gameState.soulmonMeta)" src/App.tsx` (3). É footgun 9 puro:
o nome tem dono (`soulmonDisplayName`) e o bridge reimplementou "nome = estágio". Conserto de 1 linha:
`petName: soulmonDisplayName(gameState.soulmonMeta) || 'Soulmon'`; régua: `widgetSemCobranca.contract.test.ts` (ou
um `widgetNome.contract.test.ts`) exigindo `soulmonDisplayName` no bloco do `updateWidgetData`. Dono: `staff-frontend`.

---

## 5. Desktop — `exp: 0` = "nunca expira" (`main.js` › `ipcMain.handle('auth-get')`)

Cadeia hoje (todos os símbolos lidos):
- `src/utils/auth.ts` › `startDesktopAuthBridge` publica `expiresAt: Date.parse(result.expirationTime)` — `NaN` se o
  Firebase devolver formato que `Date.parse` não lê.
- `desktop/electron/auth-preload.js` › `publish`: `exp: Number(payload.expiresAt) || 0` — NaN/undefined/`'amanhã'`
  colapsam em **0**.
- `desktop/electron/main.js` › `ipcMain.on('auth-token')`: `exp: Number(payload.exp) || 0`; › `auth-get`:
  `if (authSession.exp && Date.now() >= authSession.exp - 30_000) return null;` → com `exp === 0` o `&&` curto-circuita
  e a sessão é **entregue para sempre** (só em memória, morre ao fechar o overlay — mas um overlay que fica dias aberto
  manda ID token vencido para `/api/save`, que devolve 401 em loop sem o renderer pedir login).
- `desktop/renderer/src/authBridge.test.ts` › *"exp = 0 é lido por main.js:295 como 'nunca expira' — está documentado,
  não consertado"* — o teste **prova o buraco** e o mantém.

### 5.1 Comportamento proposto: **tratar validade desconhecida como VENCIDA-EM-1h, nunca como eterna**

Recusar (`publish` → `null`) é pior: um `Date.parse` que falhe uma vez deslogaria o overlay a cada renovação, e o app
web continua logado — divergência visível. Tratar como já vencido (`exp = 0 → null` no `auth-get`) também é ruim: a
sessão nunca entra. O ID token do Firebase vale 1h por contrato do SDK (o próprio comentário do `main.js` diz
"expira em ~1h"), então **a validade desconhecida é `agora + 1h`, fixada no momento em que o token chega** — o SDK
reemite antes disso e o payload seguinte substitui.

```diff
--- desktop/electron/auth-preload.js
+  /** Validade do ID token do Firebase por contrato do SDK: 1h. Só usada quando o app não manda `expiresAt` legível. */
+  const DEFAULT_TOKEN_TTL_MS = 60 * 60 * 1000;
   publish(payload) {
     …
+    const exp = Number(payload.expiresAt);
     ipcRenderer.send('auth-token', {
       token: payload.token,
       email: payload.email ?? '',
-      exp: Number(payload.expiresAt) || 0,
+      // NaN/ausente/0 NÃO viram "nunca expira": viram "1h a partir de agora".
+      exp: Number.isFinite(exp) && exp > 0 ? exp : Date.now() + DEFAULT_TOKEN_TTL_MS,
     });
   },

--- desktop/electron/main.js  › ipcMain.on('auth-token')
-    ? { token: String(payload.token), email: String(payload.email ?? ''), exp: Number(payload.exp) || 0 }
+    ? { token: String(payload.token), email: String(payload.email ?? ''),
+        exp: Number.isFinite(Number(payload.exp)) && Number(payload.exp) > 0
+          ? Number(payload.exp) : Date.now() + 60 * 60 * 1000 }
--- › ipcMain.handle('auth-get')
-  if (authSession.exp && Date.now() >= authSession.exp - 30_000) return null;
+  // exp é SEMPRE > 0 depois da normalização acima; sem `&&` para nenhum zero passar.
+  if (Date.now() >= authSession.exp - 30_000) return null;
```

### 5.2 O teste que muda — `desktop/renderer/src/authBridge.test.ts` › `describe('validade do token …')`

```diff
-    it('validade ilegível ou ausente colapsa em exp = 0', () => {
-      for (const ruim of [Number.NaN, undefined, null, 'amanhã', 0]) {
-        …
-        expect((enviados[0][1] as { exp: number }).exp, String(ruim)).toBe(0);
+    it('validade ilegível ou ausente vira "1h a partir de agora", nunca 0', () => {
+      const antes = Date.now();
+      for (const ruim of [Number.NaN, undefined, null, 'amanhã', 0, -5]) {
+        enviados.length = 0;
+        bridge.publish({ token: 'jwt', email: 'eu@exemplo.com', expiresAt: ruim });
+        const exp = (enviados[0][1] as { exp: number }).exp;
+        expect(exp, String(ruim)).toBeGreaterThan(antes);
+        expect(exp - antes, String(ruim)).toBeLessThanOrEqual(60 * 60 * 1000 + 1_000);
+      }
+    });
+    it('validade legível passa intacta', () => {
+      bridge.publish({ token: 'jwt', expiresAt: 1_700_000_000_000 });
+      expect((enviados[0][1] as { exp: number }).exp).toBe(1_700_000_000_000);
     });

-    it('exp = 0 é lido por main.js:295 como "nunca expira" — está documentado, não consertado', () => {
-      const expirou = (exp: number, agora: number) => !!exp && agora >= exp - 30_000;
-      expect(expirou(0, Date.now())).toBe(false);              // <- o ponto cego
+    it('main.js não tem mais o ramo "exp falsy = nunca expira"', () => {
+      // Guard textual no FONTE (mesmo padrão do widget): o `&&` que abria o buraco não pode voltar.
+      expect(fonteMain).not.toMatch(/authSession\.exp\s*&&\s*Date\.now\(\)/);
+      expect(fonteMain).toMatch(/Date\.now\(\)\s*>=\s*authSession\.exp\s*-\s*30_000/);
```
(`fonteMain` = `import fonteMain from '../../electron/main.js?raw'`, como já se faz com o preload.) O teste deixa de
"documentar" o buraco e passa a fechá-lo nos dois arquivos — `authBridge.test.ts` hoje é o único teste que alcança
`auth-preload.js`, e nenhum alcança `main.js` (ver PL-6). Dono: `soulmon-operador` (Electron) com `staff-frontend`
para `auth.ts` se quiser mandar `expiresAt` já saneado do lado do app (opcional; a defesa fica no preload).

---

## 6. Paridades PL-1..PL-7 — comandos rodados hoje (21/09/2026, HEAD 5228145e)

```
npx vitest run desktop/renderer/src/care.parity.test.ts desktop/renderer/src/care.feed.parity.test.ts \
  desktop/renderer/src/care.banhoSono.parity.test.ts functions/api/saveId.parity.test.js \
  desktop/renderer/src/cloudSync.test.ts src/plugins/widgetSemCobranca.contract.test.ts \
  workers/pushCopy.parity.test.js workers/vapid.parity.test.js src/styles/iconScale.contract.test.ts \
  desktop/renderer/src/authBridge.test.ts
 Test Files  10 passed (10)
      Tests  151 passed (151)
```

| Id | Estado (vocabulário `LEDGER.md`) | Saída colada | Observação |
|---|---|---|---|
| PL-1 | **VERIFICADO** | 3 arquivos `care*.parity` no lote acima, verdes | primeira vez que a saída é colada, como o ledger pedia |
| PL-2 | **VERIFICADO** | `saveId.parity.test.js` + `cloudSync.test.ts` verdes | — |
| PL-3 | **VERIFICADO** (com ressalva §4.2) | `widgetSemCobranca.contract.test.ts` verde | verde não prova L11: o guard veta `saudade` (PT) e não `miss you` (EN) — régua a estender |
| PL-4 | **VERIFICADO** | `pushCopy.parity` + `vapid.parity` verdes | — |
| PL-5 | **IMPLEMENTADO** parcial → régua rodada: `grep -rn "aria-label=\"[^\"]*[ãõçáéíóú]" src` → **0**; `grep -rn "'pt-BR' ?" src \| grep -v ":"` → **0**; aria EN-literal sem ternário → **0** | — | **1 divergência nova**: `src/components/CompanionHUD.tsx` › `aria-label={\`${FOOD_NAME_BY_EMOJI[emoji] ?? emoji} × ${n}\`}` usa `FOOD_BY_CATEGORY[].name` (`src/constants/labels.ts`, só EN: Protein/Salad/…) enquanto `src/components/ItemsWindow.tsx` usa `getFoodName(emoji, language)` para o MESMO item. Leitor de tela em PT ouve "Protein × 2" no deck e "Proteína ×2" na pastinha. Conserto: `getFoodName(emoji, language)` no `CompanionHUD`; régua: `grep -rn "FOOD_NAME_BY_EMOJI" src` deve ir a 0 |
| PL-6 | **PROPOSTO** (inalterado) | `find android/app/src -name "*Test*.kt" \| wc -l` → **0**; `ls desktop/electron/*.test.* \| wc -l` → **0** | ressalva: 3 testes do renderer alcançam `desktop/electron/*` via `?raw` (`authBridge`, `navigationPolicy`, `updatePolicy`) — `main.js` segue sem nenhum; §5.2 põe o primeiro guard nele |
| PL-7 | **IMPLEMENTADO** parcial (inalterado) | `iconScale.contract.test.ts` verde; `grep -c "prefers-reduced-motion" src/index.css` → **8** | leitor de tela segue **nunca medido** (→ `alpha-perf-a11y`) |
| PL-8 (novo) | **PROPOSTO** | — | régua textual do Gradle/PBL ≥ 8 (§1.4) |
| PL-9 (novo) | **PROPOSTO** | — | régua textual `canScheduleExactAlarms` + `setAndAllowWhileIdle` (§2.2) |

Medida de contexto: `grep -rc "language === 'pt-BR'" src` soma **188** ternários.

---

## 7. Tabela final

| # | Achado | Sev. | Conserto | Dono |
|---|---|---|---|---|
| 1 | `billing-ktx:6.2.1` recusada pela Play desde 31/08/2025 (v6) e agora só 8.x passa (v7 venceu 31/08/2026) — fonte primária citada §1; **ainda aberto** (A2 da manhã dizia "conferir Billing ≥ 7": a resposta é ≥ 8) | **fatal** | patch §1.2 (gradle 8.1.0 + 3 pontos no `BillingPlugin.kt`); `_billing.js` inalterado; PL-8 no mesmo commit; compile provado só pelo `android-build.yml` | `soulmon-operador` (build/CI) + `staff-backend` (revisar `playBilling.ts` `reason`) |
| 2 | `setExactAndAllowWhileIdle` sem `canScheduleExactAlarms()` — com target 36, todo Android 14+ limpo nega a permissão: alarmes de tarefa **nunca tocam no APK**, em silêncio (`.catch(() => {})`); backup-restore idem | **alto** | patch §2.2 (gate + fallback inexato + receiver de mudança de permissão); PL-9 | `soulmon-operador` (Kotlin) · `staff-frontend` (convite opcional EN+PT) |
| 3 | Widget mostra **"Rookie"** como nome do pet (`App.tsx` › `petName = evolutionStage…`), app mostra `soulmonDisplayName` — footgun 9 no bridge | **alto** | 1 linha no `App.tsx` + régua textual | `staff-frontend` |
| 4 | `"I missed you!"` / `"I miss you..."` (hp≤20) violam L11/L6; guard vigia `saudade` mas não `miss you` (EN); `✨` sobrevive à D-F3 | **médio** | trocar 2–3 frases (sugestões §4.2, fechar com `redator-ux`); `it` novo no `widgetSemCobranca.contract.test.ts` | `soulmon-guarda-vinculo`/`redator-ux` + este guarda (régua) |
| 5 | Desktop: `exp: 0` = sessão eterna em `main.js` › `auth-get`; teste documenta em vez de fechar | **médio** | patch §5.1 (TTL 1h para validade desconhecida) + teste §5.2 | `soulmon-operador` |
| 6 | `CompanionHUD.tsx` › `FOOD_NAME_BY_EMOJI` em `aria-label` só EN; `ItemsWindow.tsx` já usa `getFoodName(emoji, language)` | **médio** | usar `getFoodName`; `grep FOOD_NAME_BY_EMOJI src` → 0 | `staff-frontend` |
| 7 | target 36: edge-to-edge no WebView e 16 KB page size **não medidos** (§3) | **baixo** (até medir) | emulador A16 + `zipalign -c -P 16` no AAB | `soulmon-operador` |
| 8 | `CLAUDE.md` › Idioma não registra a exceção 13.18 (widget só EN), que a própria decisão exige | **baixo** | 1 parágrafo no `CLAUDE.md` | coordenador/`guarda-dono` (CLAUDE.md é do dono) |
| 9 | "9 frases só EN" (A2 da manhã) — **fechado como não-achado**: é a decisão 13.18 (15/09/2026) funcionando; mecanismo PT+EN fica desenhado (§4.3) para o gatilho de reabertura | — | — | — |

## O que continua sem dono

- **Provar que o `BillingPlugin.kt` compila com 8.x** — só o CI Android faz isso; ninguém roda Gradle local nesta
  máquina e nenhum teste em `node` alcança Kotlin. O patch §1.2 é diff textual até o `android-build.yml` ficar verde.
- **Extensão na Play Console** ("Policy status" → formulário, até 01/11/2026 para a v7): irrelevante — o app está em
  6.x, abaixo até do que a extensão cobre. Só o bump resolve; se o primeiro AAB precisar sair antes do bump, **não há
  caminho** — é decisão do dono adiar o upload.
- **Leitor de tela nunca medido** (PL-7) e **edge-to-edge/16 KB no A16** (§3): medição real, `alpha-perf-a11y` e
  `soulmon-operador`, nenhum dos dois acionado hoje.
- **Alarme one-shot que só re-agenda com o app aberto** (§2, observação): comportamento antigo, sem WP, sem dono.
