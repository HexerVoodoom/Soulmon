package com.soulmon.health

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * Ponte exigida pelo Health Connect (`ACTION_SHOW_PERMISSIONS_RATIONALE` / `VIEW_PERMISSION_USAGE`): abre a política
 * de privacidade (seção dos passos) no navegador e fecha. Nenhum dado é lido aqui.
 */
class HealthRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://soulmon.mateus-sprnd.workers.dev/privacidade.html#steps")))
        } catch (_: Exception) { }
        finish()
    }
}
