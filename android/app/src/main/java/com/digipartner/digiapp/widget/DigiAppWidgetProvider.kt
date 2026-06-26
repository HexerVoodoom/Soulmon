package com.digipartner.digiapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import com.digipartner.digiapp.R

// Variant A — horizontal: sprite on the left, info on the right.
class DigiAppWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderFull(context, appWidgetManager, id, R.layout.widget_digiapp)
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
        const val ACTION_UPDATE_WIDGET = "com.digipartner.digiapp.UPDATE_WIDGET"
    }
}
