package com.hexervoodoom.soulmon.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
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
     * `{ exact: boolean }` — o app mostra o convite "Alarmes e lembretes" só
     * quando `false`. Sem a permissão o agendamento já cai no inexato sozinho
     * (ver `scheduleAlarmInternal`); isto existe para a UI poder explicar.
     */
    @PluginMethod
    fun canScheduleExact(call: PluginCall) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        call.resolve(JSObject().put("exact", canExact(am)))
    }

    /** Abre a tela do sistema "Alarmes e lembretes" — só por gesto do usuário. */
    @PluginMethod
    fun openExactAlarmSettings(call: PluginCall) {
        val intent = exactAlarmSettingsIntent(context) ?: run { call.resolve(); return }
        activity?.startActivity(intent)
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

        /**
         * Android 12+ exige SCHEDULE_EXACT_ALARM para setExact*; a partir do
         * target 33 ela NÃO é pré-concedida (install limpo, backup-restore) e o
         * setExact* lança SecurityException. Fonte: developer.android.com/develop/
         * background-work/services/alarms/schedule (lido em 21/09/2026, QA rodada 1 §2).
         */
        fun canExact(alarmManager: AlarmManager): Boolean =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

        fun exactAlarmSettingsIntent(context: Context): Intent? =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                    .setData(Uri.parse("package:${context.packageName}"))
            else null

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
            // Lembrete de tarefa não é despertador: um minuto de janela é
            // aceitável, silêncio total não é. Sem a permissão, fallback INEXATO
            // (setAndAllowWhileIdle) — nunca "não agendar". Antes disto o
            // SecurityException virava reject engolido pelo JS (`.catch(() => {})`)
            // e nenhum alarme tocava no APK, em silêncio.
            if (canExact(alarmManager)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
            }

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

        // Called by BootReceiver after reboot, app update, or when the user
        // grants/revokes "Alarms & reminders" (SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED)
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
