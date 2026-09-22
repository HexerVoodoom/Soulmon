package com.hexervoodoom.soulmon.plugins

import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryProductDetailsResult
import com.android.billingclient.api.QueryPurchasesParams
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Google Play Billing — ponte nativa para src/utils/playBilling.ts.
 *
 * Este plugin SÓ abre o fluxo de compra e devolve o purchaseToken. Ele nunca
 * decide se o jogador ganhou algo: quem concede é o servidor, depois de
 * perguntar à própria Google se a compra é real (functions/api/billing.js).
 * Por isso aqui não há nenhuma lógica de "liberar item" — de propósito.
 *
 * Fluxo:
 *   purchase(productId) → launchBillingFlow → onPurchasesUpdated → resolve(token)
 *   [o JS manda o token pro servidor verificar]
 *   consume(token)      → só para consumíveis (pacotes de crédito)
 *   getPurchases()      → restaurar compras (desbloqueio permanente)
 */
@CapacitorPlugin(name = "Billing")
class BillingPlugin : Plugin() {

    private var billingClient: BillingClient? = null
    /** Call pendente aguardando o callback assíncrono da Play. */
    private var pendingPurchaseCall: PluginCall? = null

    private val purchasesUpdatedListener = PurchasesUpdatedListener { result, purchases ->
        val call = pendingPurchaseCall
        pendingPurchaseCall = null
        if (call == null) return@PurchasesUpdatedListener

        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchase = purchases?.firstOrNull()
                if (purchase == null) {
                    call.reject("no-purchase")
                    return@PurchasesUpdatedListener
                }
                // Compras pendentes (ex.: boleto) ainda não valem — o servidor
                // também rejeitaria, mas evitamos a ida desnecessária.
                if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
                    call.reject("pending")
                    return@PurchasesUpdatedListener
                }
                // Reconhecer a compra é OBRIGATÓRIO (a Play estorna o que não
                // for reconhecido em 3 dias) — mas NÃO AQUI. QA rodada 2
                // (01-seguranca §8): reconhecer antes de `/api/billing` verificar
                // fechava a janela de estorno automático de uma compra que o
                // servidor ainda podia recusar. O JS chama `acknowledge` DEPOIS
                // do verify ok (`src/utils/playBilling.ts`); o token só volta.
                call.resolve(JSObject().put("purchaseToken", purchase.purchaseToken))
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> call.reject("cancelled")
            else -> call.reject("billing-error-${result.responseCode}")
        }
    }

    override fun load() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            // PBL 8 (bump 6.2.1 → 8.3.0 em 22/09/2026, QA rodada 1 §1): a forma sem
            // argumento não existe mais. `enableOneTimeProducts()` é o equivalente
            // exato do que a 6.x fazia (só INAPP; sem prepaid plans) — release notes
            // 8.0.0: "functionally equivalent to enablePendingPurchases(
            // PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())".
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            // Reconexão automática (disponível desde a 8.0.0): substitui o
            // "a próxima operação chama connect()" de onBillingServiceDisconnected.
            .enableAutoServiceReconnection()
            .build()
        connect(null)
    }

    /** Garante conexão com a Play antes de qualquer operação. */
    private fun connect(onReady: ((Boolean) -> Unit)?) {
        val client = billingClient
        if (client == null) { onReady?.invoke(false); return }
        if (client.isReady) { onReady?.invoke(true); return }

        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                onReady?.invoke(result.responseCode == BillingClient.BillingResponseCode.OK)
            }
            override fun onBillingServiceDisconnected() {
                // enableAutoServiceReconnection() (PBL 8) reconecta sozinho; a
                // próxima operação ainda passa por connect() como cinto extra.
            }
        })
    }

    private fun acknowledgeIfNeeded(purchase: Purchase, onDone: (BillingResult?) -> Unit) {
        if (purchase.isAcknowledged) { onDone(null); return }
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        val client = billingClient
        if (client == null) { onDone(null); return }
        client.acknowledgePurchase(params) { result -> onDone(result) }
    }

    /**
     * Reconhece uma compra JÁ VERIFICADA pelo servidor (QA rodada 2,
     * 01-seguranca §8). Chamado pelo JS depois que `/api/billing?action=verify`
     * respondeu ok — nunca antes: sem verificação, a Play estorna sozinha em
     * 3 dias, que é exatamente a rede de segurança para um comprovante que o
     * servidor recusou. Idempotente: compra já reconhecida resolve na hora.
     */
    @PluginMethod
    fun acknowledge(call: PluginCall) {
        val token = call.getString("purchaseToken") ?: run { call.reject("Missing purchaseToken"); return }
        connect { ready ->
            if (!ready) { call.reject("billing-unavailable"); return@connect }
            val params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
            billingClient?.queryPurchasesAsync(params) { result, purchases ->
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    call.reject("query-failed-${result.responseCode}")
                    return@queryPurchasesAsync
                }
                val purchase = purchases.firstOrNull { it.purchaseToken == token }
                if (purchase == null) { call.reject("not-owned"); return@queryPurchasesAsync }
                acknowledgeIfNeeded(purchase) { ack ->
                    if (ack == null || ack.responseCode == BillingClient.BillingResponseCode.OK) call.resolve()
                    else call.reject("acknowledge-failed-${ack.responseCode}")
                }
            }
        }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val productId = call.getString("productId") ?: run { call.reject("Missing productId"); return }
        /*
         * WP0.6 — O VÍNCULO DA COMPRA COM O SAVE.
         *
         * `setObfuscatedAccountId` amarra a compra do Play à conta do jogo. Sem
         * ele, `isPlayPurchaseBoundTo` (functions/api/_billing.js) não tem o que
         * conferir, e um mesmo comprovante pode ser apresentado por saves
         * diferentes — `claimOrder` barra a REUTILIZAÇÃO, mas não sabe dizer de
         * QUEM era a compra.
         *
         * É opcional aqui de propósito: o servidor só passa a EXIGIR o vínculo
         * quando `PLAY_REQUIRE_ACCOUNT_BINDING=true`, e ligar isso antes de o
         * APK com esta linha estar publicado recusaria toda compra.
         */
        val saveId = call.getString("saveId")
        val activity = activity ?: run { call.reject("no-activity"); return }

        connect { ready ->
            if (!ready) { call.reject("billing-unavailable"); return@connect }
            val client = billingClient ?: run { call.reject("billing-unavailable"); return@connect }

            val queryParams = QueryProductDetailsParams.newBuilder()
                .setProductList(listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build(),
                ))
                .build()

            // PBL 8: o 2º parâmetro virou QueryProductDetailsResult
            // (`.productDetailsList` + `.unfetchedProductList`), não List<ProductDetails>.
            client.queryProductDetailsAsync(queryParams) { result, queryResult: QueryProductDetailsResult ->
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    call.reject("product-query-failed-${result.responseCode}")
                    return@queryProductDetailsAsync
                }
                val details: ProductDetails = queryResult.productDetailsList.firstOrNull() ?: run {
                    // Produto não existe no Play Console ou o app não está
                    // publicado numa faixa de teste. O motivo por produto
                    // (`unfetchedProductList[i].statusCode`) só vai para o log:
                    // src/utils/playBilling.ts compara "product-not-found" como
                    // string opaca e um sufixo quebraria o contrato JS.
                    val motivo = queryResult.unfetchedProductList.firstOrNull()?.statusCode
                    android.util.Log.w("BillingPlugin", "product-not-found productId=$productId statusCode=$motivo")
                    call.reject("product-not-found")
                    return@queryProductDetailsAsync
                }

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .build(),
                    ))
                    .also { builder ->
                        // WP0.6 — só quando o cliente mandou. O Play recusa id
                        // vazio, e um `saveId` ausente não pode virar recusa de
                        // compra para quem está com um app mais antigo.
                        if (!saveId.isNullOrBlank()) builder.setObfuscatedAccountId(saveId)
                    }
                    .build()

                pendingPurchaseCall = call
                call.setKeepAlive(true)
                activity.runOnUiThread { client.launchBillingFlow(activity, flowParams) }
            }
        }
    }

    /**
     * WP5.8 — O PREÇO QUE O PLAY VAI COBRAR, na moeda de quem está olhando.
     *
     * O app mostrava um rótulo de preço fixo em BRL, escrito no cliente. Para
     * quem está fora do Brasil isso é um número errado na tela de compra — e
     * um preço errado na tela de compra é a pior linha de texto possível: ela
     * é lida como promessa.
     *
     * `formattedPrice` vem do próprio Play, já com moeda e formatação do país
     * da conta. Devolve vazio quando não dá para consultar; quem chama trata
     * isso caindo no rótulo de sempre, nunca mostrando uma tela em branco.
     */
    @PluginMethod
    fun getLocalizedPrice(call: PluginCall) {
        val productId = call.getString("productId") ?: run { call.reject("Missing productId"); return }
        connect { ready ->
            if (!ready) { call.resolve(JSObject().put("formattedPrice", "")); return@connect }
            val client = billingClient ?: run {
                call.resolve(JSObject().put("formattedPrice", "")); return@connect
            }
            val queryParams = QueryProductDetailsParams.newBuilder()
                .setProductList(listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build(),
                ))
                .build()
            client.queryProductDetailsAsync(queryParams) { result, queryResult: QueryProductDetailsResult ->
                val preco = if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryResult.productDetailsList.firstOrNull()?.oneTimePurchaseOfferDetails?.formattedPrice ?: ""
                } else ""
                call.resolve(JSObject().put("formattedPrice", preco))
            }
        }
    }

    @PluginMethod
    fun consume(call: PluginCall) {
        val token = call.getString("purchaseToken") ?: run { call.reject("Missing purchaseToken"); return }
        connect { ready ->
            if (!ready) { call.reject("billing-unavailable"); return@connect }
            val params = ConsumeParams.newBuilder().setPurchaseToken(token).build()
            billingClient?.consumeAsync(params) { result, _ ->
                if (result.responseCode == BillingClient.BillingResponseCode.OK) call.resolve()
                else call.reject("consume-failed-${result.responseCode}")
            }
        }
    }

    /** Compras ativas da conta Google — base do "restaurar compras". */
    @PluginMethod
    fun getPurchases(call: PluginCall) {
        connect { ready ->
            if (!ready) { call.reject("billing-unavailable"); return@connect }
            val params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
            billingClient?.queryPurchasesAsync(params) { result, purchases ->
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    call.reject("query-failed-${result.responseCode}")
                    return@queryPurchasesAsync
                }
                val arr = JSArray()
                // Sem reconhecer aqui: o restore também passa pelo verify do
                // servidor antes, e o JS chama `acknowledge` só depois do ok.
                purchases
                    .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    .forEach { purchase ->
                        purchase.products.forEach { productId ->
                            arr.put(JSObject()
                                .put("productId", productId)
                                .put("purchaseToken", purchase.purchaseToken))
                        }
                    }
                call.resolve(JSObject().put("purchases", arr))
            }
        }
    }

    override fun handleOnDestroy() {
        billingClient?.endConnection()
        billingClient = null
        super.handleOnDestroy()
    }
}
