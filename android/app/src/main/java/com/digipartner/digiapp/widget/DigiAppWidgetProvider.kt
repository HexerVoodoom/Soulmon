package com.digipartner.digiapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.digipartner.digiapp.R

class DigiAppWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DigiAppWidgetProvider::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }
    }

    companion object {
        const val PREFS_NAME = "DigiWidgetPrefs"
        const val ACTION_UPDATE_WIDGET = "com.digipartner.digiapp.UPDATE_WIDGET"

        private val HEART_IDS = intArrayOf(
            R.id.widget_heart_1, R.id.widget_heart_2, R.id.widget_heart_3,
            R.id.widget_heart_4, R.id.widget_heart_5
        )

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val currentStage = prefs.getString("current_stage", "digiegg") ?: "digiegg"
            val eggType = prefs.getString("egg_type", "agumon") ?: "agumon"
            val branchType = prefs.getString("branch_type", "data") ?: "data"
            val maxHealth = prefs.getInt("max_health_points", 3).coerceIn(1, HEART_IDS.size)
            val health = prefs.getInt("health_points", maxHealth).coerceIn(0, maxHealth)

            val views = RemoteViews(context.packageName, R.layout.widget_digiapp)

            // Sprite: resolve by drawable name, fall back to triceramon_dot
            val spriteId = resolveSprite(context, currentStage, eggType, branchType)
            views.setImageViewResource(R.id.widget_sprite, spriteId)

            // Hearts: red = full energy, black = empty. Hide slots beyond maxHealth.
            for (i in HEART_IDS.indices) {
                if (i < maxHealth) {
                    views.setViewVisibility(HEART_IDS[i], View.VISIBLE)
                    views.setImageViewResource(
                        HEART_IDS[i],
                        if (i < health) R.drawable.heart_full else R.drawable.heart_empty
                    )
                } else {
                    views.setViewVisibility(HEART_IDS[i], View.GONE)
                }
            }

            // Tap → open app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pi = PendingIntent.getActivity(
                    context, 0, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pi)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun resolveSprite(context: Context, stage: String, eggType: String, branchType: String): Int {
            val candidateName = "sprite_${stage.replace("-", "_")}"
            val id = context.resources.getIdentifier(candidateName, "drawable", context.packageName)
            return if (id != 0) id else R.drawable.triceramon_dot
        }
    }
}
