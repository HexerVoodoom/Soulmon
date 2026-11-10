package com.soulmon.widget

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class WidgetRefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        android.util.Log.d("SoulmonWidget", "refresh (worker)")
        WidgetRenderer.updateAll(applicationContext)
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "soulmon_widget_refresh"
        private const val HUNGER_WORK = "soulmon_widget_hunger"

        /** Redesenha no instante em que o bichinho fica com fome (app fechado): `hungry_at` e um instante, sem JS. */
        fun scheduleHunger(context: Context, hungryAtMs: Long?) {
            val wm = WorkManager.getInstance(context)
            val delay = if (hungryAtMs == null) -1L else hungryAtMs - System.currentTimeMillis()
            if (delay <= 0L) { wm.cancelUniqueWork(HUNGER_WORK); return }
            wm.enqueueUniqueWork(HUNGER_WORK, ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<WidgetRefreshWorker>().setInitialDelay(delay, TimeUnit.MILLISECONDS).build())
        }
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<WidgetRefreshWorker>(15, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request
            )
        }
    }
}
