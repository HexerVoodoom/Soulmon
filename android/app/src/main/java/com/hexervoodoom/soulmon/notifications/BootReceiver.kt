package com.hexervoodoom.soulmon.notifications

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hexervoodoom.soulmon.plugins.SoulmonAlarmPlugin

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> SoulmonAlarmPlugin.rescheduleAll(context)
            // Usuário concedeu/revogou "Alarmes e lembretes": reagendar para o
            // alarme trocar de inexato para exato (ou o contrário) sem esperar o
            // app abrir. Constante é API 31+; em aparelho mais antigo a string
            // simplesmente nunca chega.
            AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED ->
                SoulmonAlarmPlugin.rescheduleAll(context)
        }
    }
}
