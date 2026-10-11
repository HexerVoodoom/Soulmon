package com.hexervoodoom.soulmon.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.hexervoodoom.soulmon.notifications.AlarmReceiver
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.util.Calendar

@CapacitorPlugin(name = "SoulmonAlarm")
class SoulmonAlarmPlugin : Plugin() {

    @PluginMethod
    fun scheduleAlarm(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        val title = call.getString("title") ?: "Soulmon"
        val body = call.getString("body") ?: ""
        val scheduledTime = call.getString("scheduledTime") ?: run { call.reject("Missing scheduledTime"); return }
        scheduleAlarmInternal(context, id, title, body, scheduledTime)
        call.resolve()
    }

    /**
     * Abre a tela de notificações DESTE app nas configurações do sistema. É a
     * saída de quem negou o pedido nativo duas vezes (o Android 13+ deixa de
     * mostrar o diálogo) — só por gesto do usuário.
     */
    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        val intent = android.content.Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, context.packageName)
            .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        try { (activity ?: context).startActivity(intent) } catch (_: Exception) { }
        call.resolve()
    }

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        cancelAlarmInternal(context, id)
        call.resolve()
    }

    companion object {
        private const val PREFS_NAME = "SoulmonAlarms"

        fun scheduleAlarmInternal(context: Context, id: String, title: String, body: String, scheduledTime: String) {
            val parts = scheduledTime.split(":")
            if (parts.size != 2) return
            val hour = parts[0].toIntOrNull() ?: return
            val minute = parts[1].toIntOrNull() ?: return

            val triggerTime = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                // If the time already passed today, schedule for tomorrow
                if (timeInMillis <= System.currentTimeMillis()) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }.timeInMillis

            val notificationId = id.hashCode()
            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra(AlarmReceiver.EXTRA_TITLE, title)
                putExtra(AlarmReceiver.EXTRA_BODY, body)
                putExtra(AlarmReceiver.EXTRA_NOTIFICATION_ID, notificationId)
                // O `id` que o cliente passa É a tag da copy (`pet-nudge-10`,
                // `pet-goodnight`…), a mesma que o worker manda no FCM. Ver
                // `AlarmReceiver`: é o que impede o aviso duplicado.
                putExtra(AlarmReceiver.EXTRA_TAG, id)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context, notificationId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            // Lembrete não é despertador: alguns minutos de janela são aceitáveis, e
            // por isso o app NÃO declara SCHEDULE_EXACT_ALARM (permissão restrita da
            // Play, reservada a despertador/calendário — e que, a partir do target 33,
            // nem vem concedida: setExact* lançava SecurityException). Alarme INEXATO,
            // que ainda acorda em Doze, funciona sem permissão nenhuma.
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)

            // Persist so BootReceiver can reschedule after reboot
            val alarm = JSONObject().apply {
                put("id", id)
                put("title", title)
                put("body", body)
                put("scheduledTime", scheduledTime)
            }
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putString("alarm_$notificationId", alarm.toString()).apply()
        }

        fun cancelAlarmInternal(context: Context, id: String) {
            val notificationId = id.hashCode()
            val intent = Intent(context, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context, notificationId, intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().remove("alarm_$notificationId").apply()
        }

        // Called by BootReceiver after reboot or app update
        fun rescheduleAll(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            for ((_, value) in prefs.all) {
                if (value !is String) continue
                try {
                    val alarm = JSONObject(value)
                    scheduleAlarmInternal(
                        context,
                        alarm.getString("id"),
                        alarm.optString("title", "Soulmon"),
                        alarm.optString("body", ""),
                        alarm.getString("scheduledTime")
                    )
                } catch (_: Exception) { /* skip malformed entries */ }
            }
        }
    }
}
