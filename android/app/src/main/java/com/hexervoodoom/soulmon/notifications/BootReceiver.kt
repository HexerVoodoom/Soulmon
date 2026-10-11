package com.hexervoodoom.soulmon.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hexervoodoom.soulmon.plugins.SoulmonAlarmPlugin

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> SoulmonAlarmPlugin.rescheduleAll(context)
        }
    }
}
