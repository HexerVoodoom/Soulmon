package com.digipartner.digiapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import com.digipartner.digiapp.R

// Pet-screen widget: green grid + hearts + animated pet + energy bar.
class DigiAppWidgetScreenProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderScreen(context, appWidgetManager, id, R.layout.widget_digiapp_screen)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }
}
