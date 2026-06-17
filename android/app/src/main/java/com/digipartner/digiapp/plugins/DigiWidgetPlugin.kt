package com.digipartner.digiapp.plugins

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.digipartner.digiapp.widget.DigiAppWidgetProvider
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DigiWidget")
class DigiWidgetPlugin : Plugin() {

    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        val ctx = context
        val prefs = ctx.getSharedPreferences(DigiAppWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()

        call.getString("digimonName")?.let { editor.putString("digimon_name", it) }
        call.getString("currentStage")?.let { editor.putString("current_stage", it) }
        call.getString("eggType")?.let { editor.putString("egg_type", it) }
        call.getString("branchType")?.let { editor.putString("branch_type", it) }

        // getInt returns null when key absent; fall back to data from call
        val completedTasks = call.data.optInt("completedTasks", -1)
        val totalTasks = call.data.optInt("totalTasks", -1)
        val hp = call.data.optInt("hp", -1)
        if (completedTasks >= 0) editor.putInt("completed_tasks", completedTasks)
        if (totalTasks >= 0) editor.putInt("total_tasks", totalTasks)
        if (hp >= 0) editor.putInt("hp", hp)

        editor.apply()

        // Push update to all active widget instances
        val manager = AppWidgetManager.getInstance(ctx)
        val ids = manager.getAppWidgetIds(ComponentName(ctx, DigiAppWidgetProvider::class.java))
        for (id in ids) DigiAppWidgetProvider.updateWidget(ctx, manager, id)

        call.resolve()
    }
}
