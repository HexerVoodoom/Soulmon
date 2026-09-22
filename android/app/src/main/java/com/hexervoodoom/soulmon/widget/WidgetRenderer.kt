package com.hexervoodoom.soulmon.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.view.View
import android.widget.RemoteViews
import com.hexervoodoom.soulmon.R

// Shared rendering for all Soulmon widget variants (horizontal, vertical, pet-only).
object WidgetRenderer {
    const val PREFS_NAME = "DigiWidgetPrefs"

    // Widgets A (horizontal, 180×90) e B (vertical, 110²) — canvas Fora do app (DECISÕES §30).
    // Compartilham `widget_pet_name` e `widget_stage`; só o A tem `widget_tasks` e
    // `widget_message` (no B a frase SAIU e o contador vive na linha do estágio — remover
    // camada em vez de comprimir, exceção (b) do §30).
    fun renderFull(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val petName = prefs.getString("pet_name", "Soulmon") ?: "Soulmon"
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val completedTasks = prefs.getInt("completed_tasks", 0)
        val totalTasks = prefs.getInt("total_tasks", 0)
        val hp = prefs.getInt("hp", 100)
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val vertical = layoutId == R.layout.widget_soulmon_vertical

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(context, views, resolveSprite(context, currentStage, eggType, branchType), if (vertical) 48 else 64)
        views.setTextViewText(R.id.widget_pet_name, petName)
        // O contador só existe com ≥1 feita (13.16): nunca "0/5", nunca um traço no zero.
        val counter = taskCounter(completedTasks, totalTasks)
        if (vertical) {
            views.setTextViewText(
                R.id.widget_stage,
                if (counter != null) "${stageLabel(currentStage)} · $counter" else stageLabel(currentStage),
            )
        } else {
            views.setTextViewText(R.id.widget_stage, stageLabel(currentStage))
            if (counter != null) {
                views.setViewVisibility(R.id.widget_tasks, View.VISIBLE)
                views.setTextViewText(R.id.widget_tasks, counter)
                views.setInt(R.id.widget_message, "setMaxLines", 1)
            } else {
                // A linha some e devolve o espaço à frase (duas linhas).
                views.setViewVisibility(R.id.widget_tasks, View.GONE)
                views.setInt(R.id.widget_message, "setMaxLines", 2)
            }
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
        }
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    /**
     * "3/5" com ≥1 feita; `null` (= a linha SOME) com zero feitas ou zero tarefas.
     * 13.16: o widget nunca mostra "0/N" — zero feitas é o placar de quem ainda não
     * começou, e placar na tela inicial é cobrança. O guard
     * `widgetSemCobranca.contract.test.ts` lê este fonte.
     */
    private fun taskCounter(completed: Int, total: Int): String? =
        if (total > 0 && completed > 0) "$completed/$total" else null

    // Pet-only widget: just the sprite (+ needs-cleaning indicator).
    fun renderPet(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val hasPoop = prefs.getBoolean("has_poop", false)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(context, views, resolveSprite(context, currentStage, eggType, branchType), 32)
        views.setViewVisibility(R.id.widget_poop, if (hasPoop) View.VISIBLE else View.GONE)
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    /**
     * A criatura nos dois quadros do ViewFlipper, como BITMAP no tamanho exato em dp
     * (decisão (a) do §30: `setImageViewBitmap`, uma cara só por estágio).
     *
     * Por que bitmap e não `setImageViewResource`: os `sprite_*.png` são 384² e ficavam
     * em `drawable/` (= mdpi), então um xxxhdpi pré-escalava para 1056² antes de o
     * ImageView reduzir para 64dp — duas reamostragens e ~4 MB por quadro. Agora vivem
     * em `drawable-nodpi/`, são decodificados crus (`inScaled = false`) e reduzidos UMA
     * vez, para `sizeDp × density` px com filtro bilinear (a arte é ilustração, não pixel
     * art de 32 — X2 do canvas). Um bitmap de 64dp a xxxhdpi tem 256² × 4 B = 256 KB,
     * folgado no teto do RemoteViews. Se a decodificação falhar (memória), cai no
     * recurso — o widget nunca fica sem criatura.
     */
    private fun setSprite(context: Context, views: RemoteViews, spriteId: Int, sizeDp: Int) {
        val bmp = spriteBitmap(context, spriteId, sizeDp)
        if (bmp != null) {
            views.setImageViewBitmap(R.id.widget_sprite, bmp)
            views.setImageViewBitmap(R.id.widget_sprite_2, bmp)
        } else {
            views.setImageViewResource(R.id.widget_sprite, spriteId)
            views.setImageViewResource(R.id.widget_sprite_2, spriteId)
        }
    }

    private fun spriteBitmap(context: Context, spriteId: Int, sizeDp: Int): Bitmap? {
        val px = (sizeDp * context.resources.displayMetrics.density).toInt().coerceAtLeast(1)
        return try {
            val opts = BitmapFactory.Options().apply { inScaled = false }
            val raw = BitmapFactory.decodeResource(context.resources, spriteId, opts) ?: return null
            if (raw.width == px && raw.height == px) raw
            else Bitmap.createScaledBitmap(raw, px, px, true).also { if (it !== raw) raw.recycle() }
        } catch (e: OutOfMemoryError) {
            null
        }
    }

    private val CHAT_PHRASE_SLOTS = intArrayOf(
        R.id.widget_phrase_1, R.id.widget_phrase_2, R.id.widget_phrase_3,
        R.id.widget_phrase_4, R.id.widget_phrase_5
    )

    /* ⚰️ "Don't forget about me today!" SAIU (PRINCÍPIOS §12, veto registrado no
       STATUS): é a frase de culpa por excelência — o pet cobrando presença. Teto do pool
       ~22 caracteres (§30 (c), copy com o `redator-ux`); o `ellipsize` do layout é só a rede. */
    /* 22/09/2026 (QA rodada 2, `02-narrativa` §3): "You're my favorite partner!"
       SAIU — L1 (pessoa como sujeito de "ser", no elogio) e `partner` é o termo
       da franquia para o humano (bíblia §12 ⚠️). "Let's tackle our tasks
       together?" (L2, criatura falando de tarefas como interface), "Together
       we're stronger!" (slogan; "stronger" contradiz §5.8 — muda o corpo, não a
       força), "I'm rooting for you!" (§13: não motiva) e "Ready to evolve
       today?" (cutucada; o widget não sabe se a barra está cheia) saíram junto. */
    private val CHAT_FIXED_PHRASES = listOf(
        "Glad you're back!",
        "Want company?",
        "Same road, you and me.",
        // "I missed you!" saiu em 22/09/2026 (QA rodada 1 §4.2, L11): a criatura
        // nunca sente por causa da ausência da pessoa. Reação ao AGORA, não ao tempo.
        "Here when you are.",
        "You can always count on me!",
        "Good to see you!",
        "Side by side."
    )

    // Widget D (chat, 180×40): criatura a 32 + nome + frases girando.
    fun renderChat(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val petName = prefs.getString("pet_name", "Soulmon") ?: "Soulmon"
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val completed = prefs.getInt("completed_tasks", 0)
        val total = prefs.getInt("total_tasks", 0)
        val hp = prefs.getInt("hp", 100)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(context, views, resolveSprite(context, currentStage, eggType, branchType), 32)
        views.setTextViewText(R.id.widget_pet_name, petName)
        // Sem linha de contador no D (180×40 cabe duas linhas, não três — F1/V6, §30 (b)).

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
        // HP baixo: "I miss you..." saiu em 22/09/2026 (L11 + L6 — ligava saudade ao
        // placar de HP). "Quiet day. Me too." saiu no mesmo dia (QA R2): a frase
        // era o exemplo permitido da L11, mas o GATILHO é HP baixo — o placar do
        // dia em que a meta não foi cumprida — e ali vira atribuição ("quiet day"
        // afirma como foi o dia da pessoa). A criatura fala de si (§13).
        if (hp <= 20) contextual.add("Resting close to the ground today.")
        // (o ramo "digiegg" saiu junto com os nomes da Bandai: a árvore nasce
        //  em rookie desde `types/progression.ts`, não existe estágio de ovo)
        when {
            total == 0 -> contextual.add("Let's add a task?")
            // "We crushed it today! ✨" saiu (D-F3 sem emoji; L12 nomeia o ato, não elogia a pessoa).
            completed >= total -> contextual.add("That closed a stretch.")
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

    // Widget E (tela, 180×110): corações `favorite` + criatura a 64 + energia — sem texto.
    fun renderScreen(context: Context, mgr: AppWidgetManager, appWidgetId: Int, layoutId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentStage = prefs.getString("current_stage", "rookie") ?: "rookie"
        val eggType = prefs.getString("egg_type", "") ?: ""
        val branchType = prefs.getString("branch_type", "data") ?: "data"
        val maxH = prefs.getInt("max_health_points", 2).coerceIn(1, SCREEN_HEART_IDS.size)
        val health = prefs.getInt("health_points", maxH).coerceIn(0, maxH)
        val energy = prefs.getInt("energy_points", 0).coerceIn(0, maxH)

        val views = RemoteViews(context.packageName, layoutId)
        setSprite(context, views, resolveSprite(context, currentStage, eggType, branchType), 64)

        // Corações: cheio em `viewport-ink`, vazio em CONTORNO (nunca vermelho — D-F4);
        // os slots além de maxHealth somem.
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
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetProvider::class.java)))
            renderFull(context, mgr, id, R.layout.widget_soulmon)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetVerticalProvider::class.java)))
            renderFull(context, mgr, id, R.layout.widget_soulmon_vertical)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetPetProvider::class.java)))
            renderPet(context, mgr, id, R.layout.widget_soulmon_pet)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetChatProvider::class.java)))
            renderChat(context, mgr, id, R.layout.widget_soulmon_chat)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetScreenProvider::class.java)))
            renderScreen(context, mgr, id, R.layout.widget_soulmon_screen)
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
        // A escada é SÓ EM INGLÊS (REGISTRO 13.18 — o widget não tem idioma) e SEM
        // emoji (D-F3: o RemoteViews não tem fonte de ícone e o emoji é do fabricante;
        // no visor a frase lê sozinha). As 7 frases são a copy do canvas Fora do app
        // (Escada.dc.html), sujeita ao `redator-ux` (V7/X5).
        // HP baixo nunca é alarme: o HP representa o cuidado que a pessoa teve
        // consigo mesma, e um ⚠️ ali converte culpa em vergonha. Também não é
        // saudade da criatura ("I've been missing you" saiu em 22/09/2026, L11):
        // a frase fica no presente, ao lado da pessoa.
        // "Quiet day. Me too." saiu em 22/09/2026 (QA R2): frase certa, gatilho
        // errado — no placar de HP ela afirma como foi o dia da pessoa.
        if (hp <= 20) return "Resting close to the ground today."
        // Quem faltou duas vezes seguidas precisa da porta pequena, não do placar.
        if (needsIntervention) return "Today, just five minutes?"
        if (total == 0) {
            // Sem tarefa hoje, a FAIXA de constância ainda tem o que dizer —
            // e ela é uma faixa, nunca o percentual (ver `habit_steady`).
            // "You've been steady" saiu em 22/09/2026 (L1: pessoa como sujeito de
            // verbo de ser, no elogio). O sujeito passa para o ritmo.
            if (habitSteady == true) return "The rhythm held."
            return "One day at a time"
        }
        val ratio = if (total > 0) completed.toDouble() / total else 0.0
        return when {
            // "Complete day", nunca "perfeito" (regra P5, 07/09): o dia completo é o
            // combinado cumprido, não uma nota.
            ratio >= 1.0 -> "Complete day!"
            ratio >= 0.7 -> "Almost there!"
            ratio >= 0.4 -> "Keep it up!"
            // O degrau de baixo NÃO conta o que falta. Começar já é o passo.
            else -> "You started — that already counts"
        }
    }
}
