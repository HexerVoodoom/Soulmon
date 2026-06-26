package com.digipartner.digiapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import com.digipartner.digiapp.R

// Variant C — pet only: just the sprite, same footprint as the horizontal widget.
class DigiAppWidgetPetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderPet(context, appWidgetManager, id, R.layout.widget_digiapp_pet)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }
}
