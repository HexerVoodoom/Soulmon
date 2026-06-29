package com.digipartner.digiapp.plugins

import android.content.Context
import com.digipartner.digiapp.widget.WidgetRenderer
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DigiWidget")
class DigiWidgetPlugin : Plugin() {

    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        val ctx = context
        val prefs = ctx.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()

        call.getString("digimonName")?.let { editor.putString("digimon_name", it) }
        call.getString("currentStage")?.let { editor.putString("current_stage", it) }
        call.getString("eggType")?.let { editor.putString("egg_type", it) }
        call.getString("branchType")?.let { editor.putString("branch_type", it) }

        // getInt returns null when key absent; fall back to data from call
        val completedTasks = call.data.optInt("completedTasks", -1)
        val totalTasks = call.data.optInt("totalTasks", -1)
        val hp = call.data.optInt("hp", -1)
        val healthPoints = call.data.optInt("healthPoints", -1)
        val maxHealthPoints = call.data.optInt("maxHealthPoints", -1)
        val energyPoints = call.data.optInt("energyPoints", -1)
        if (completedTasks >= 0) editor.putInt("completed_tasks", completedTasks)
        if (totalTasks >= 0) editor.putInt("total_tasks", totalTasks)
        if (hp >= 0) editor.putInt("hp", hp)
        if (healthPoints >= 0) editor.putInt("health_points", healthPoints)
        if (maxHealthPoints >= 0) editor.putInt("max_health_points", maxHealthPoints)
        if (energyPoints >= 0) editor.putInt("energy_points", energyPoints)

        editor.apply()

        // Push update to all active widget instances (all 3 variants)
        WidgetRenderer.updateAll(ctx)

        call.resolve()
    }
}
