package com.hexervoodoom.soulmon.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.hexervoodoom.soulmon.R

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Soulmon"
        val body = intent.getStringExtra(EXTRA_BODY) ?: ""
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0)
        // A TAG é a identidade que o FCM usa (`workers/fcm.js` manda
        // `android.notification.tag`). Sem ela, o mesmo aviso chegava DUAS
        // vezes no mesmo aparelho — uma pelo AlarmManager (por id) e outra
        // pelo FCM (por tag) —, porque tag ≠ id e o Android trata as duas
        // como notificações diferentes. Com a mesma tag, a segunda a chegar
        // SUBSTITUI a primeira, qualquer que seja a ordem.
        // Notificação repetida é a razão nº 1 pela qual alguém desliga push,
        // e desligar push é irreversível na prática.
        val tag = intent.getStringExtra(EXTRA_TAG)

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        createChannelIfNeeded(notificationManager)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        // O id vai ZERO quando há tag, para casar com o padrão do FCM: o par
        // (tag, id) é a chave de substituição do Android, e o FCM não define id.
        if (tag != null) notificationManager.notify(tag, 0, notification)
        else notificationManager.notify(notificationId, notification)
    }

    private fun createChannelIfNeeded(manager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Soulmon Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alarm notifications for Soulmon tasks"
                }
                manager.createNotificationChannel(channel)
            }
        }
    }

    companion object {
        const val CHANNEL_ID = "soulmon_alarms"
        const val EXTRA_TITLE = "title"
        const val EXTRA_BODY = "body"
        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_TAG = "notification_tag"
    }
}
