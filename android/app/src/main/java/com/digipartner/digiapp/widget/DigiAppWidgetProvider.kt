package com.digipartner.digiapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.digipartner.digiapp.R

class DigiAppWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DigiAppWidgetProvider::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }
    }

    companion object {
        const val PREFS_NAME = "DigiWidgetPrefs"
        const val ACTION_UPDATE_WIDGET = "com.digipartner.digiapp.UPDATE_WIDGET"

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val digimonName = prefs.getString("digimon_name", "DigiEgg") ?: "DigiEgg"
            val currentStage = prefs.getString("current_stage", "digiegg") ?: "digiegg"
            val completedTasks = prefs.getInt("completed_tasks", 0)
            val totalTasks = prefs.getInt("total_tasks", 0)
            val hp = prefs.getInt("hp", 100)
            val eggType = prefs.getString("egg_type", "agumon") ?: "agumon"
            val branchType = prefs.getString("branch_type", "data") ?: "data"

            val views = RemoteViews(context.packageName, R.layout.widget_digiapp)

            // Sprite: resolve by drawable name, fall back to triceramon_dot
            val spriteId = resolveSprite(context, currentStage, eggType, branchType)
            views.setImageViewResource(R.id.widget_sprite, spriteId)

            // Name + stage
            views.setTextViewText(R.id.widget_digimon_name, digimonName)
            views.setTextViewText(R.id.widget_stage, stageLabel(currentStage))

            // Task progress
            val taskText = if (totalTasks > 0) "$completedTasks/$totalTasks" else "—"
            views.setTextViewText(R.id.widget_tasks, taskText)

            // Contextual message
            views.setTextViewText(R.id.widget_message, contextualMessage(completedTasks, totalTasks, hp))

            // Tap → open app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pi = PendingIntent.getActivity(
                    context, 0, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pi)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun resolveSprite(context: Context, stage: String, eggType: String, branchType: String): Int {
            val candidateName = when {
                stage == "digiegg" -> "sprite_digiegg"
                stage in listOf("pichimon", "chicomon", "yukimibotamon") -> "sprite_intraining1_$eggType"
                stage in listOf("pukamon", "chibimon", "nyaromon") -> "sprite_intraining2_$eggType"
                stage in listOf("tapirmon", "veemon", "plotmon") -> "sprite_rookie_$eggType"
                else -> "sprite_${stage.replace("-", "_")}"
            }
            val id = context.resources.getIdentifier(candidateName, "drawable", context.packageName)
            return if (id != 0) id else R.drawable.triceramon_dot
        }

        private fun stageLabel(stage: String): String = when (stage) {
            "digiegg" -> "Ovo Digital"
            "pichimon", "chicomon", "yukimibotamon" -> "Baby I"
            "pukamon", "chibimon", "nyaromon" -> "Baby II"
            "tapirmon", "veemon", "plotmon" -> "Rookie"
            "monochromon", "tuskmon", "bakemon",
            "exveemon", "veedramon", "flamdramon",
            "gatomon", "blackgatomon", "mikemon" -> "Champion"
            "gigadramon", "triceramon", "digitamamon",
            "paildramon", "aeroveedramon", "raidramon",
            "angewomon", "ladydevimon", "nefertimon" -> "Ultimate"
            "gaioumon", "ultimatebrachiomon", "titamon",
            "imperialdramon", "ulforceveemon", "magnamon",
            "ophanimon", "lilithmon", "holydramon" -> "Mega"
            "gaioumon-itto", "imperialdramonpaladin", "mastemon" -> "Ultra"
            else -> stage.replaceFirstChar { it.uppercase() }
        }

        private fun contextualMessage(completed: Int, total: Int, hp: Int): String {
            if (hp <= 20) return "⚠️ Cuide de mim!"
            if (total == 0) return "📋 Adicione tarefas!"
            val ratio = if (total > 0) completed.toDouble() / total else 0.0
            return when {
                ratio >= 1.0 -> "✨ Dia perfeito!"
                ratio >= 0.7 -> "💪 Quase lá!"
                ratio >= 0.4 -> "🔥 Continue assim!"
                else -> "📋 $completed de $total feitas"
            }
        }
    }
}
