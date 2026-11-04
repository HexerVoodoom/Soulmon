package com.soulmon.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class SoulmonWidgetClearProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderClear(context, appWidgetManager, id)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }
}
