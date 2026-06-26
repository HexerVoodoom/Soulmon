package com.digipartner.digiapp.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.digipartner.digiapp.notifications.AlarmReceiver
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.util.Calendar

@CapacitorPlugin(name = "DigiAlarm")
class DigiAlarmPlugin : Plugin() {

    @PluginMethod
    fun scheduleAlarm(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        val title = call.getString("title") ?: "DigiApp"
        val body = call.getString("body") ?: ""
        val scheduledTime = call.getString("scheduledTime") ?: run { call.reject("Missing scheduledTime"); return }
        scheduleAlarmInternal(context, id, title, body, scheduledTime)
        call.resolve()
    }

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        cancelAlarmInternal(context, id)
        call.resolve()
    }

    companion object {
        private const val PREFS_NAME = "DigiAppAlarms"

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
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context, notificationId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)

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

        // Called by BootReceiver after device restarts
        fun rescheduleAll(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            for ((_, value) in prefs.all) {
                if (value !is String) continue
                try {
                    val alarm = JSONObject(value)
                    scheduleAlarmInternal(
                        context,
                        alarm.getString("id"),
                        alarm.optString("title", "DigiApp"),
                        alarm.optString("body", ""),
                        alarm.getString("scheduledTime")
                    )
                } catch (_: Exception) { /* skip malformed entries */ }
            }
        }
    }
}
