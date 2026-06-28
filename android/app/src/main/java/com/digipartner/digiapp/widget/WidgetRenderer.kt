package com.digipartner.digiapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import com.digipartner.digiapp.R

// Shared rendering for all DigiApp widget variants (horizontal, vertical, pet-only).
object WidgetRenderer {
    const val PREFS_NAME = "DigiWidgetPrefs"

    // Full widget: sprite + name/stage/tasks/message. Layouts A (horizontal) and B (vertical)
    // share the same view IDs, so they reuse this renderer with a different layout resource.
    fun renderFull(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val digimonName = prefs.getString("digimon_name", "DigiEgg") ?: "DigiEgg"
        val currentStage = prefs.getString("current_stage", "digiegg") ?: "digiegg"
        val completedTasks = prefs.getInt("completed_tasks", 0)
        val totalTasks = prefs.getInt("total_tasks", 0)
        val hp = prefs.getInt("hp", 100)
        val eggType = prefs.getString("egg_type", "agumon") ?: "agumon"
        val branchType = prefs.getString("branch_type", "data") ?: "data"

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))
        views.setTextViewText(R.id.widget_digimon_name, digimonName)
        views.setTextViewText(R.id.widget_stage, stageLabel(currentStage))
        views.setTextViewText(R.id.widget_tasks, if (totalTasks > 0) "$completedTasks/$totalTasks" else "—")
        views.setTextViewText(R.id.widget_message, contextualMessage(completedTasks, totalTasks, hp))
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    // Pet-only widget: just the sprite.
    fun renderPet(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentStage = prefs.getString("current_stage", "digiegg") ?: "digiegg"
        val eggType = prefs.getString("egg_type", "agumon") ?: "agumon"
        val branchType = prefs.getString("branch_type", "data") ?: "data"

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    // Both ViewFlipper frames use the same sprite (frame 2 is offset in XML for the bounce).
    private fun setSprite(views: RemoteViews, spriteId: Int) {
        views.setImageViewResource(R.id.widget_sprite, spriteId)
        views.setImageViewResource(R.id.widget_sprite_2, spriteId)
    }

    private val CHAT_PHRASE_SLOTS = intArrayOf(
        R.id.widget_phrase_1, R.id.widget_phrase_2, R.id.widget_phrase_3,
        R.id.widget_phrase_4, R.id.widget_phrase_5
    )

    private val CHAT_FIXED_PHRASES = listOf(
        "Tô feliz que você voltou!",
        "Vamos cuidar das tarefas juntos?",
        "Você é meu parceiro favorito!",
        "Bora evoluir hoje?",
        "Senti sua falta!",
        "Conta comigo sempre!",
        "Que bom te ver!",
        "Juntos somos mais fortes!",
        "Não esquece de mim hoje, hein!",
        "Tô torcendo por você!"
    )

    // Chat widget (4x2): animated sprite + auto-rotating phrases.
    fun renderChat(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val digimonName = prefs.getString("digimon_name", "DigiEgg") ?: "DigiEgg"
        val currentStage = prefs.getString("current_stage", "digiegg") ?: "digiegg"
        val eggType = prefs.getString("egg_type", "agumon") ?: "agumon"
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val completed = prefs.getInt("completed_tasks", 0)
        val total = prefs.getInt("total_tasks", 0)
        val hp = prefs.getInt("hp", 100)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))
        views.setTextViewText(R.id.widget_digimon_name, digimonName)
        views.setTextViewText(R.id.widget_tasks, if (total > 0) "$completed/$total" else "—")

        val phrases = buildChatPhrases(currentStage, completed, total, hp)
        for (i in CHAT_PHRASE_SLOTS.indices) {
            views.setTextViewText(CHAT_PHRASE_SLOTS[i], phrases[i % phrases.size])
        }

        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    private fun buildChatPhrases(stage: String, completed: Int, total: Int, hp: Int): List<String> {
        val contextual = mutableListOf<String>()
        if (hp <= 20) contextual.add("Tô precisando de carinho...")
        if (stage == "digiegg") contextual.add("Logo logo eu choco!")
        when {
            total == 0 -> contextual.add("Bora adicionar uma tarefa?")
            completed >= total -> contextual.add("Arrasamos hoje! ✨")
            else -> contextual.add("Faltam ${total - completed} tarefa(s), bora!")
        }
        val result = (contextual + CHAT_FIXED_PHRASES.shuffled()).toMutableList()
        while (result.size < CHAT_PHRASE_SLOTS.size) result.add(CHAT_FIXED_PHRASES.random())
        return result.take(CHAT_PHRASE_SLOTS.size)
    }

    // Refresh every active instance of all widget variants.
    fun updateAll(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)
        for (id in mgr.getAppWidgetIds(ComponentName(context, DigiAppWidgetProvider::class.java)))
            renderFull(context, mgr, id, R.layout.widget_digiapp)
        for (id in mgr.getAppWidgetIds(ComponentName(context, DigiAppWidgetVerticalProvider::class.java)))
            renderFull(context, mgr, id, R.layout.widget_digiapp_vertical)
        for (id in mgr.getAppWidgetIds(ComponentName(context, DigiAppWidgetPetProvider::class.java)))
            renderPet(context, mgr, id, R.layout.widget_digiapp_pet)
        for (id in mgr.getAppWidgetIds(ComponentName(context, DigiAppWidgetChatProvider::class.java)))
            renderChat(context, mgr, id, R.layout.widget_digiapp_chat)
    }

    private fun attachClick(context: Context, views: RemoteViews) {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
        val pi = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pi)
    }

    private fun resolveSprite(context: Context, stage: String, eggType: String, branchType: String): Int {
        val candidateName = "sprite_${stage.replace("-", "_")}"
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
