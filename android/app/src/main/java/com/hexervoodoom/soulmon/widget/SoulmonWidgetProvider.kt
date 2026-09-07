package com.hexervoodoom.soulmon.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import com.hexervoodoom.soulmon.R

// Variant A — horizontal: sprite on the left, info on the right.
class SoulmonWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderFull(context, appWidgetManager, id, R.layout.widget_soulmon)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) WidgetRenderer.updateAll(context)
    }

    companion object {
        const val PREFS_NAME = WidgetRenderer.PREFS_NAME
        const val ACTION_UPDATE_WIDGET = "com.hexervoodoom.soulmon.UPDATE_WIDGET"
    }
}
