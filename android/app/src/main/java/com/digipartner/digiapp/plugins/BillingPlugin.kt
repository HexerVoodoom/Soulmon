package com.digipartner.digiapp.plugins

import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
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
                // Reconhecer a compra é OBRIGATÓRIO: a Play estorna
                // automaticamente o que não for reconhecido em 3 dias.
                acknowledgeIfNeeded(purchase)
                call.resolve(JSObject().put("purchaseToken", purchase.purchaseToken))
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> call.reject("cancelled")
            else -> call.reject("billing-error-${result.responseCode}")
        }
    }

    override fun load() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases()
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
                // A próxima operação chama connect() de novo.
            }
        })
    }

    private fun acknowledgeIfNeeded(purchase: Purchase) {
        if (purchase.isAcknowledged) return
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        billingClient?.acknowledgePurchase(params) { /* melhor esforço */ }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val productId = call.getString("productId") ?: run { call.reject("Missing productId"); return }
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

            client.queryProductDetailsAsync(queryParams) { result, productDetailsList ->
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    call.reject("product-query-failed-${result.responseCode}")
                    return@queryProductDetailsAsync
                }
                val details: ProductDetails = productDetailsList.firstOrNull() ?: run {
                    // Produto não existe no Play Console ou o app não está
                    // publicado numa faixa de teste.
                    call.reject("product-not-found")
                    return@queryProductDetailsAsync
                }

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .build(),
                    ))
                    .build()

                pendingPurchaseCall = call
                call.setKeepAlive(true)
                activity.runOnUiThread { client.launchBillingFlow(activity, flowParams) }
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
                purchases
                    .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    .forEach { purchase ->
                        acknowledgeIfNeeded(purchase)
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
