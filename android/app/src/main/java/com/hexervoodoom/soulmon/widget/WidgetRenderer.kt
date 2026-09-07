package com.hexervoodoom.soulmon.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.hexervoodoom.soulmon.R

// Shared rendering for all Soulmon widget variants (horizontal, vertical, pet-only).
object WidgetRenderer {
    const val PREFS_NAME = "DigiWidgetPrefs"

    // Full widget: sprite + name/stage/tasks/message. Layouts A (horizontal) and B (vertical)
    // share the same view IDs, so they reuse this renderer with a different layout resource.
    fun renderFull(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val digimonName = prefs.getString("digimon_name", "Soulmon") ?: "Soulmon"
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val completedTasks = prefs.getInt("completed_tasks", 0)
        val totalTasks = prefs.getInt("total_tasks", 0)
        val hp = prefs.getInt("hp", 100)
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))
        views.setTextViewText(R.id.widget_digimon_name, digimonName)
        views.setTextViewText(R.id.widget_stage, stageLabel(currentStage))
        views.setTextViewText(R.id.widget_tasks, if (totalTasks > 0) "$completedTasks/$totalTasks" else "—")
        views.setTextViewText(
            R.id.widget_message,
            contextualMessage(
                completedTasks,
                totalTasks,
                hp,
                prefs.getBoolean("needs_intervention", false),
                if (prefs.contains("habit_steady")) prefs.getBoolean("habit_steady", false) else null,
            ),
        )
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    // Pet-only widget: just the sprite (+ needs-cleaning indicator).
    fun renderPet(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val hasPoop = prefs.getBoolean("has_poop", false)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))
        views.setViewVisibility(R.id.widget_poop, if (hasPoop) View.VISIBLE else View.GONE)
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
        "Glad you're back!",
        "Let's tackle our tasks together?",
        "You're my favorite partner!",
        "Ready to evolve today?",
        "I missed you!",
        "You can always count on me!",
        "Good to see you!",
        "Together we're stronger!",
        "Don't forget about me today!",
        "I'm rooting for you!"
    )

    // Chat widget (4x2): animated sprite + auto-rotating phrases.
    fun renderChat(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val digimonName = prefs.getString("digimon_name", "Soulmon") ?: "Soulmon"
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
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
        // Mesma régua da `contextualMessage`: o pet fala com a pessoa, não lê
        // o placar dela. "N task(s) left, let's go!" saiu na auditoria de
        // 06/09/2026 — contar o que falta, na tela inicial, é cobrança.
        val contextual = mutableListOf<String>()
        if (hp <= 20) contextual.add("I miss you...")
        // (o ramo "digiegg" saiu junto com os nomes da Bandai: a árvore nasce
        //  em rookie desde `types/progression.ts`, não existe estágio de ovo)
        when {
            total == 0 -> contextual.add("Let's add a task?")
            completed >= total -> contextual.add("We crushed it today! ✨")
            else -> contextual.add("Whenever you're ready, I'm here.")
        }
        val result = (contextual + CHAT_FIXED_PHRASES.shuffled()).toMutableList()
        while (result.size < CHAT_PHRASE_SLOTS.size) result.add(CHAT_FIXED_PHRASES.random())
        return result.take(CHAT_PHRASE_SLOTS.size)
    }

    private val SCREEN_HEART_IDS = intArrayOf(
        R.id.widget_heart_1, R.id.widget_heart_2, R.id.widget_heart_3,
        R.id.widget_heart_4, R.id.widget_heart_5
    )
    // index 0 = bottom segment (bar fills from the bottom up)
    private val SCREEN_ENERGY_IDS = intArrayOf(
        R.id.widget_energy_1, R.id.widget_energy_2, R.id.widget_energy_3,
        R.id.widget_energy_4, R.id.widget_energy_5
    )

    // Pet-screen widget: green grid + hearts (health) + animated pet + energy bar.
    fun renderScreen(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val maxH = prefs.getInt("max_health_points", 2).coerceIn(1, SCREEN_HEART_IDS.size)
        val health = prefs.getInt("health_points", maxH).coerceIn(0, maxH)
        val energy = prefs.getInt("energy_points", 0).coerceIn(0, maxH)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(views, resolveSprite(context, currentStage, eggType, branchType))

        // Hearts: red = current health, dark = empty; hide slots beyond maxHealth.
        for (i in SCREEN_HEART_IDS.indices) {
            if (i < maxH) {
                views.setViewVisibility(SCREEN_HEART_IDS[i], View.VISIBLE)
                views.setImageViewResource(
                    SCREEN_HEART_IDS[i],
                    if (i < health) R.drawable.heart_full else R.drawable.heart_empty
                )
            } else {
                views.setViewVisibility(SCREEN_HEART_IDS[i], View.GONE)
            }
        }

        // Energy bar: one segment per max-health unit (like the hearts), filled from
        // the bottom by energyPoints. Hide segments beyond maxHealth.
        for (i in SCREEN_ENERGY_IDS.indices) {
            if (i < maxH) {
                views.setViewVisibility(SCREEN_ENERGY_IDS[i], View.VISIBLE)
                views.setImageViewResource(
                    SCREEN_ENERGY_IDS[i],
                    if (i < energy) R.drawable.bar_on else R.drawable.bar_off
                )
            } else {
                views.setViewVisibility(SCREEN_ENERGY_IDS[i], View.GONE)
            }
        }

        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
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
        for (id in mgr.getAppWidgetIds(ComponentName(context, DigiAppWidgetScreenProvider::class.java)))
            renderScreen(context, mgr, id, R.layout.widget_digiapp_screen)
    }

    private fun attachClick(context: Context, views: RemoteViews) {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
        val pi = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pi)
    }

    /**
     * O sprite do estágio, SEMPRE arte nossa.
     *
     * ⚠️ Até 07/09/2026 o fallback era `R.drawable.triceramon_dot` — arte da
     * Bandai —, e ele não era um caso de borda: os drawables existentes eram
     * os 40 nomes da franquia (`sprite_agumon`, `sprite_veemon`…) e nenhum
     * casava com os estágios REAIS da árvore de hoje (`rookie`,
     * `champion-virus`, `ultra`…). Ou seja, `getIdentifier` falhava sempre e
     * **o widget mostrava um personagem registrado para todo usuário, o
     * tempo todo** — no APK que vai para a Play Store.
     *
     * O `docs/Attributions.md` declarava que a arte da Bandai "saiu tudo".
     * Saiu do bundle WEB; `android/res/drawable` é outra árvore e ninguém
     * olhou. Os 40 arquivos foram apagados e os 11 estágios da árvore ganharam
     * a arte de `src/assets/soulmon/`.
     *
     * `eggType` e `branchType` continuam na assinatura porque os dois
     * chamadores os passam, mas o id do estágio já carrega o galho
     * (`champion-virus`) — não há o que resolver a mais.
     */
    private fun resolveSprite(context: Context, stage: String, eggType: String, branchType: String): Int {
        val candidateName = "sprite_${stage.replace("-", "_")}"
        val id = context.resources.getIdentifier(candidateName, "drawable", context.packageName)
        // Sem correspondência (save adulterado, estágio de uma versão futura):
        // o rookie, que é onde a árvore nasce. NUNCA arte de terceiro.
        return if (id != 0) id else R.drawable.sprite_rookie
    }

    /**
     * O rótulo do estágio, lido do PREFIXO do id.
     *
     * ⚠️ Isto era uma tabela com ~30 nomes de personagem da Bandai mapeando
     * espécie → nível, apagada em 07/09/2026 pelo mesmo motivo dos drawables.
     * Ela nem funcionava: a árvore de hoje nasce em `rookie` e usa
     * `champion-virus` / `mega-data` / `ultra`, então TODO estágio real caía
     * no `else`. Trinta nomes de terceiro no APK para descrever criaturas que
     * o app não tem mais.
     */
    private fun stageLabel(stage: String): String = when (stage.substringBefore('-')) {
        "rookie" -> "Rookie"
        "champion" -> "Champion"
        "ultimate" -> "Ultimate"
        "mega" -> "Mega"
        "ultra" -> "Ultra"
        else -> stage.replaceFirstChar { it.uppercase() }
    }

    /**
     * WP2.6 — a frase do widget passa a saber de HÁBITO.
     *
     * Ela só sabia de tarefas do dia e HP: o motor de constância — a peça mais
     * central do produto — era invisível na única superfície que a pessoa vê
     * sem abrir o app.
     *
     * Duas regras herdadas do app, e as duas importam aqui mais do que lá,
     * porque o widget fica na tela inicial o dia inteiro:
     *  · **nada de "%" cru na tela.** A constância entra como ESTADO ("de pé
     *    firme"), nunca como nota — porcentagem num quadradinho da tela
     *    inicial é um boletim permanente.
     *  · **a intervenção vem antes de tudo**, e é convite: quem faltou duas
     *    vezes seguidas recebe a versão de cinco minutos, não uma cobrança.
     * `-1` é AUSÊNCIA de dado (app antigo, sem hábito) e cai no texto de
     * sempre — nunca em "0%".
     */
    private fun contextualMessage(
        completed: Int,
        total: Int,
        hp: Int,
        needsIntervention: Boolean = false,
        habitSteady: Boolean? = null,
    ): String {
        /*
         * ⚠️ Esta função foi reescrita na auditoria de 06/09/2026, e o motivo
         * precisa ficar aqui porque a tentação de reverter é grande.
         *
         * Ela dizia "⚠️ Cuide de mim!" com HP baixo e "📋 $completed de $total
         * feitas" no fim da escada. As duas são COBRANÇA, e o widget é a
         * superfície mais exposta do telefone — vista dezenas de vezes por dia,
         * sem que a pessoa tenha decidido abrir nada. É o `Save your streak!`
         * do Duolingo em tom baixo, e a spec do dossiê mandou REMOVER, não
         * acrescentar.
         *
         * O caso do "N de M feitas" é o mais instrutivo: ele só aparece quando
         * a razão é BAIXA, ou seja, exatamente no dia em que a pessoa menos
         * conseguiu. O placar aparece para quem está perdendo.
         *
         * A régua da reescrita: nada que conte o que falta, nada que peça, e
         * a voz é do PET falando com a pessoa — não do app lendo a própria UI.
         */
        // HP baixo é saudade, nunca alarme: o HP representa o cuidado que a
        // pessoa teve consigo mesma, e um ⚠️ ali converte culpa em vergonha.
        if (hp <= 20) return "💛 Tô com saudade de você"
        // Quem faltou duas vezes seguidas precisa da porta pequena, não do placar.
        if (needsIntervention) return "🌱 Hoje, só 5 minutos?"
        if (total == 0) {
            // Sem tarefa hoje, a FAIXA de constância ainda tem o que dizer —
            // e ela é uma faixa, nunca o percentual (ver `habit_steady`).
            if (habitSteady == true) return "🌳 Você tem estado firme"
            return "🌤️ Um dia de cada vez"
        }
        val ratio = if (total > 0) completed.toDouble() / total else 0.0
        return when {
            ratio >= 1.0 -> "✨ Dia perfeito!"
            ratio >= 0.7 -> "💪 Quase lá!"
            ratio >= 0.4 -> "🔥 Continue assim!"
            // O degrau de baixo NÃO conta o que falta. Começar já é o passo.
            else -> "🌱 Começou — isso já conta"
        }
    }
}
