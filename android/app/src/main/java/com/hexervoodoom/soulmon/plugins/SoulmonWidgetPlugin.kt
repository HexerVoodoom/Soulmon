package com.hexervoodoom.soulmon.plugins

import android.content.Context
import com.hexervoodoom.soulmon.widget.WidgetRenderer
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "SoulmonWidget")
class SoulmonWidgetPlugin : Plugin() {

    private companion object {
        val GROVE_STAGE_IDS = setOf("clareira", "ramagem", "copa", "mata", "bosque-antigo")
    }

    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        val ctx = context
        val prefs = ctx.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()

        call.getString("petName")?.let { editor.putString("pet_name", it) }
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
        val habitTierMax = call.data.optInt("habitTierMax", -1)
        if (habitTierMax >= 0) editor.putInt("habit_tier_max", habitTierMax)
        /*
         * ⚠️ `constancy_pct`, `shields` e `bond_level` NÃO são mais gravados
         * (auditoria de 06/09/2026). Os dois últimos eram escritos e nunca
         * lidos pelo renderer; os dois primeiros são o que a spec do dossiê
         * vetou na tela inicial — percentual cru é linha vermelha, e escudo
         * exposto vira placar da proteção que só funciona sendo silenciosa.
         *
         * O que substitui é uma FAIXA (`habit_steady`), chave NOVA: as chaves
         * do bridge são congeladas, então só se acrescenta. Um widget velho
         * lendo `constancy_pct` ausente cai no -1, que ele já trata como
         * "não informado" — nada quebra na tela de quem não atualizou.
         */
        if (call.data.has("habitSteady")) {
            editor.putBoolean("habit_steady", call.data.optBoolean("habitSteady", false))
        } else {
            editor.remove("habit_steady")
        }
        editor.remove("constancy_pct")
        editor.remove("shields")
        editor.remove("bond_level")
        /*
         * 29/09/2026 (decisão do dono) — duas chaves NOVAS (só se acrescenta):
         *  · `pet_line`: só "corvo"; qualquer outro valor (ou vazio) REMOVE a chave.
         *  · `grove_stage`: só um id de estágio do Bosque; qualquer outro REMOVE.
         * Allowlist aqui porque o SharedPreferences é lido pelo renderer sem mais filtro.
         */
        val petLine = call.getString("petLine") ?: ""
        if (petLine == "corvo") editor.putString("pet_line", petLine) else editor.remove("pet_line")
        val groveStage = call.getString("groveStage") ?: ""
        if (groveStage in GROVE_STAGE_IDS) editor.putString("grove_stage", groveStage) else editor.remove("grove_stage")
        editor.putBoolean("needs_intervention", call.data.optBoolean("needsIntervention", false))

        editor.apply()

        // Push update to all active widget instances (all 3 variants)
        WidgetRenderer.updateAll(ctx)

        call.resolve()
    }
}
