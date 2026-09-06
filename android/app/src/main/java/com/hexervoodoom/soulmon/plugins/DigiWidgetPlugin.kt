package com.hexervoodoom.soulmon.plugins

import android.content.Context
import com.hexervoodoom.soulmon.widget.WidgetRenderer
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
        editor.putBoolean("has_poop", call.data.optBoolean("hasPoop", false))

        /*
         * WP2.6 — O WIDGET PASSA A SABER DE HÁBITO.
         *
         * Ele recebia só tarefas do dia, HP e energia: o motor de constância
         * inteiro (a peça mais central do produto) era invisível na superfície
         * que a pessoa vê SEM abrir o app — e a pesquisa aponta o widget como
         * tão eficaz quanto push.
         *
         * ⚠️ As chaves do bridge são CONGELADAS: só se ACRESCENTA. Um widget
         * antigo instalado continua lendo as antigas, e renomear uma quebraria
         * a tela de quem não atualizou.
         *
         * `-1` = "não informado" e é diferente de zero: o renderer trata como
         * ausência de dado, não como "constância zero" — mostrar 0% para quem
         * ainda não tem histórico é a mesma mentira que a constância dotada
         * existe para evitar.
         */
        val constancyPct = call.data.optInt("constancyPct", -1)
        val shields = call.data.optInt("shields", -1)
        val habitTierMax = call.data.optInt("habitTierMax", -1)
        val bondLevel = call.data.optInt("bondLevel", -1)
        if (constancyPct >= 0) editor.putInt("constancy_pct", constancyPct)
        if (shields >= 0) editor.putInt("shields", shields)
        if (habitTierMax >= 0) editor.putInt("habit_tier_max", habitTierMax)
        if (bondLevel >= 0) editor.putInt("bond_level", bondLevel)
        editor.putBoolean("needs_intervention", call.data.optBoolean("needsIntervention", false))

        editor.apply()

        // Push update to all active widget instances (all 3 variants)
        WidgetRenderer.updateAll(ctx)

        call.resolve()
    }
}
