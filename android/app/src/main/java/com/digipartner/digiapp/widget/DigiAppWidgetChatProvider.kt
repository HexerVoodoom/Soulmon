package com.digipartner.digiapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import com.digipartner.digiapp.R

// 4x2 widget: animated pet + auto-rotating phrases from the pet to the partner.
class DigiAppWidgetChatProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderChat(context, appWidgetManager, id, R.layout.widget_digiapp_chat)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }
}
