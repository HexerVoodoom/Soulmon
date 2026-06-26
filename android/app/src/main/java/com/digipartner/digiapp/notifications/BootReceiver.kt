package com.digipartner.digiapp.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.digipartner.digiapp.plugins.DigiAlarmPlugin

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> DigiAlarmPlugin.rescheduleAll(context)
        }
    }
}
