package com.digipartner.digiapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import com.digipartner.digiapp.R

// Variant B — vertical: sprite on top, info below.
class DigiAppWidgetVerticalProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderFull(context, appWidgetManager, id, R.layout.widget_digiapp_vertical)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }
}
