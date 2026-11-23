package com.soulmon.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

/** Widget "Companheiro" (beta12 A3): o conteudo do Cage com a criatura grande (`WidgetRenderer.renderCompanion`). */
class SoulmonWidgetCompanionProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderCompanion(context, appWidgetManager, id)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
        WidgetFramesSyncWorker.schedule(context)
    }
}
