package com.soulmon.plugins

import android.view.WindowManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Tela acordada durante a sessao do Foco (beta12, item H). Plugin leve proprio (sem dependencia nova): liga/desliga
 * `FLAG_KEEP_SCREEN_ON` na janela da Activity. A forma casa com `@capacitor-community/keep-awake` (`keepAwake`, `allowSleep`,
 * `isSupported`, `isKeptAwake`), que e o que `src/utils/keepAwake.ts` espera. A flag morre sozinha com a Activity, e
 * [handleOnDestroy] a solta por garantia.
 */
@CapacitorPlugin(name = "KeepAwake")
class KeepAwakePlugin : Plugin() {

    @PluginMethod
    fun keepAwake(call: PluginCall) {
        setKeepOn(true)
        call.resolve()
    }

    @PluginMethod
    fun allowSleep(call: PluginCall) {
        setKeepOn(false)
        call.resolve()
    }

    @PluginMethod
    fun isSupported(call: PluginCall) {
        call.resolve(JSObject().put("isSupported", true))
    }

    @PluginMethod
    fun isKeptAwake(call: PluginCall) {
        val on = (activity?.window?.attributes?.flags ?: 0) and WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON != 0
        call.resolve(JSObject().put("isKeptAwake", on))
    }

    override fun handleOnDestroy() {
        setKeepOn(false)
        super.handleOnDestroy()
    }

    private fun setKeepOn(on: Boolean) {
        val act = activity ?: return
        act.runOnUiThread {
            if (on) act.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            else act.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
}
