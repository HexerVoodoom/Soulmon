package com.soulmon.plugins

import android.content.Intent
import android.net.Uri
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.play.core.review.ReviewManagerFactory

/**
 * Avaliação na Play. `requestReview` usa o Play In-App Review (cota do Google: o painel pode não aparecer,
 * e a API não diz se apareceu — quem chama mede o tempo e cai em `openStore`). Qualquer falha resolve (nunca rejeita).
 */
@CapacitorPlugin(name = "SoulmonReview")
class SoulmonReviewPlugin : Plugin() {

    @PluginMethod
    fun requestReview(call: PluginCall) {
        val act = activity
        if (act == null) { call.resolve(); return }
        try {
            val manager = ReviewManagerFactory.create(act)
            manager.requestReviewFlow().addOnCompleteListener { req ->
                if (!req.isSuccessful) { call.resolve(); return@addOnCompleteListener }
                try {
                    manager.launchReviewFlow(act, req.result).addOnCompleteListener { call.resolve() }
                } catch (e: Exception) {
                    call.resolve()
                }
            }
        } catch (e: Exception) {
            call.resolve()
        }
    }

    @PluginMethod
    fun openStore(call: PluginCall) {
        val pkg = context.packageName
        val flags = Intent.FLAG_ACTIVITY_NEW_TASK
        try {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")).addFlags(flags))
        } catch (e: Exception) {
            try {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$pkg")).addFlags(flags))
            } catch (_: Exception) { }
        }
        call.resolve()
    }
}
