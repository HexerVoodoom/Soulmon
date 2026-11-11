package com.soulmon.plugins

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * O Health Connect exige uma tela que explique o uso da permissão (`ACTION_SHOW_PERMISSIONS_RATIONALE`, Android 13 e antes) e
 * o alias para a "visualização de uso" (Android 14+). Aqui é só a ponte: abre a política de privacidade do Soulmon (§2 e §6
 * falam dos passos) no navegador e fecha. Sem UI própria, sem dado nenhum.
 */
class HealthRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse("https://soulmon.mateus-sprnd.workers.dev/privacidade.html"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (_: Exception) { }
        finish()
    }
}
