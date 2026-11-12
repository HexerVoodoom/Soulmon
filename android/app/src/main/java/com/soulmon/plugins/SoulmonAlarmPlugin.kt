package com.soulmon.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.soulmon.notifications.AlarmReceiver
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
     * Beta12 (item I): aviso do Pomodoro no INSTANTE exato (timestamp em ms), com o app fechado. So o foco usa: lembrete comum
     * continua inexato (`scheduleAlarm`). Se o aparelho nao concede o alarme exato (Android 12+ sem a permissao "Alarmes e
     * lembretes"), cai no inexato com a mesma janela de Doze: o aviso chega, so pode atrasar alguns minutos.
     * Resolve `{ exact }` para a web saber qual dos dois valeu.
     */
    @PluginMethod
    fun scheduleExactAlarm(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        val title = call.getString("title") ?: "Soulmon"
        val body = call.getString("body") ?: ""
        val atMs = call.data.optLong("atMs", -1L)
        if (atMs <= System.currentTimeMillis()) { call.reject("atMs must be in the future"); return }
        val exact = scheduleAtInternal(context, id, title, body, atMs)
        call.resolve(JSObject().put("exact", exact))
    }

    /** Se o app pode agendar alarme exato agora (antes do Android 12 sempre pode). */
    @PluginMethod
    fun canScheduleExactAlarms(call: PluginCall) {
        call.resolve(JSObject().put("value", canExact(context)))
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

        /** Android 12+ so deixa agendar exato com "Alarmes e lembretes" concedido; antes disso sempre pode. */
        fun canExact(context: Context): Boolean {
            if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S) return true
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            return try { am.canScheduleExactAlarms() } catch (_: Exception) { false }
        }

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
            val pendingIntent = pendingFor(context, id, title, body, notificationId)
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            // Lembrete não é despertador: alguns minutos de janela são aceitáveis. Alarme INEXATO, que ainda acorda em Doze,
            // funciona sem permissão nenhuma. (O aviso do foco, que precisa do minuto certo, usa `scheduleAtInternal`.)
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

        /**
         * Alarme no instante `atMs` (beta12, item I). Exato (`setExactAndAllowWhileIdle`) quando [canExact]; sem a permissao,
         * ou se o sistema recusar (SecurityException), cai no inexato. Devolve se ficou exato. Guarda `atMs` para o
         * BootReceiver refazer; instante que ja passou no reboot e descartado (nao reaparece aviso velho).
         */
        fun scheduleAtInternal(context: Context, id: String, title: String, body: String, atMs: Long): Boolean {
            val notificationId = id.hashCode()
            val pendingIntent = pendingFor(context, id, title, body, notificationId)
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            var exact = false
            if (canExact(context)) {
                try {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pendingIntent)
                    exact = true
                } catch (_: SecurityException) { /* permissao revogada entre a checagem e a chamada */ }
            }
            if (!exact) alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pendingIntent)
            val alarm = JSONObject().apply {
                put("id", id)
                put("title", title)
                put("body", body)
                put("atMs", atMs)
            }
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putString("alarm_$notificationId", alarm.toString()).apply()
            return exact
        }

        private fun pendingFor(context: Context, id: String, title: String, body: String, notificationId: Int): PendingIntent {
            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra(AlarmReceiver.EXTRA_TITLE, title)
                putExtra(AlarmReceiver.EXTRA_BODY, body)
                putExtra(AlarmReceiver.EXTRA_NOTIFICATION_ID, notificationId)
                // O `id` que o cliente passa É a tag da copy (`pet-nudge-10`, `pet-goodnight`…), a mesma que o worker manda
                // no FCM. Ver `AlarmReceiver`: é o que impede o aviso duplicado.
                putExtra(AlarmReceiver.EXTRA_TAG, id)
            }
            return PendingIntent.getBroadcast(
                context, notificationId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
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
                    if (alarm.has("atMs")) {
                        // Alarme de instante exato (foco): so refaz se ainda esta no futuro; vencido some (nao reaparece aviso velho).
                        val at = alarm.getLong("atMs")
                        if (at > System.currentTimeMillis()) {
                            scheduleAtInternal(context, alarm.getString("id"), alarm.optString("title", "Soulmon"), alarm.optString("body", ""), at)
                        } else {
                            prefs.edit().remove("alarm_" + alarm.getString("id").hashCode()).apply()
                        }
                        continue
                    }
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
