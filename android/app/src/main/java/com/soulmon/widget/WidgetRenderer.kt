package com.soulmon.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews
import com.soulmon.R

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
            // O Bosque: uma linha discreta, só o nome do estágio; GONE sem roda.
            val grove = groveStageLabel(context, prefs.getString("grove_stage", null))
            if (grove != null) {
                views.setViewVisibility(R.id.widget_grove, View.VISIBLE)
                views.setTextViewText(R.id.widget_grove, grove)
                views.setInt(R.id.widget_message, "setMaxLines", 1)
            } else {
                views.setViewVisibility(R.id.widget_grove, View.GONE)
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
     * Por que bitmap e não `setImageViewResource`: os `sprite_*.png` eram 384² e ficavam
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

    private fun spriteBitmap(context: Context, spriteId: Int, sizeDp: Int, maxPx: Int = Int.MAX_VALUE): Bitmap? {
        val px = (sizeDp * context.resources.displayMetrics.density).toInt().coerceIn(1, maxPx)
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

    /**
     * The resizable widget (REGISTRO §221). API 31+ hands the system one RemoteViews per
     * size and it swaps them without waking the app; below that, the size reported in the
     * options picks one layout (portrait reading: minWidth x maxHeight).
     *
     * One sprite bitmap, shared by every layout, capped at the 256px of the source art, so
     * the size map carries the same Bitmap object in each RemoteViews instead of a bigger
     * one per layout: this payload crosses binder.
     */
    fun renderAdaptive(
        context: Context,
        mgr: AppWidgetManager,
        appWidgetId: Int,
        options: Bundle = mgr.getAppWidgetOptions(appWidgetId),
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val spriteId = resolveSprite(
            context,
            prefs.getString("current_stage", "rookie") ?: "rookie",
            prefs.getString("egg_type", "") ?: "",
            prefs.getString("branch_type", "data") ?: "data",
        )
        val sprite = spriteBitmap(context, spriteId, 96, 256)
        val petName = prefs.getString("pet_name", "Soulmon") ?: "Soulmon"
        val line = adaptiveLine(context)
        fun build(shape: WidgetAdaptive.Shape) = adaptiveViews(context, shape, sprite, spriteId, petName, line)

        val views = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            RemoteViews(WidgetAdaptive.SIZE_KEYS.associate { SizeF(it.widthDp, it.heightDp) to build(it.shape) })
        } else {
            build(
                WidgetAdaptive.chooseShape(
                    options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH),
                    options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT),
                ),
            )
        }
        mgr.updateAppWidget(appWidgetId, views)
    }

    private fun adaptiveViews(
        context: Context,
        shape: WidgetAdaptive.Shape,
        sprite: Bitmap?,
        spriteId: Int,
        petName: String,
        line: String,
    ): RemoteViews {
        val layoutId = when (shape) {
            WidgetAdaptive.Shape.SQUARE -> R.layout.widget_soulmon_adaptive_square
            WidgetAdaptive.Shape.HORIZONTAL -> R.layout.widget_soulmon_adaptive_horizontal
            WidgetAdaptive.Shape.VERTICAL -> R.layout.widget_soulmon_adaptive_vertical
        }
        val views = RemoteViews(context.packageName, layoutId)
        if (sprite != null) {
            views.setImageViewBitmap(R.id.widget_sprite, sprite)
            views.setImageViewBitmap(R.id.widget_sprite_2, sprite)
        } else {
            views.setImageViewResource(R.id.widget_sprite, spriteId)
            views.setImageViewResource(R.id.widget_sprite_2, spriteId)
        }
        // The square has no text views: only the creature, by the owner's request.
        if (shape != WidgetAdaptive.Shape.SQUARE) {
            views.setTextViewText(R.id.widget_pet_name, petName)
            views.setTextViewText(R.id.widget_message, line)
        }
        attachClick(context, views)
        return views
    }

    private fun adaptiveLine(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val task = prefs.getString("next_task", null)
        return when (
            WidgetAdaptive.selectMessage(
                now = System.currentTimeMillis(),
                hungryAt = if (prefs.contains("hungry_at")) prefs.getLong("hungry_at", 0L) else null,
                hasPoop = prefs.getBoolean("has_poop", false),
                nextTask = task,
                dayEndsAt = if (prefs.contains("day_ends_at")) prefs.getLong("day_ends_at", 0L) else null,
                completed = prefs.getInt("completed_tasks", 0),
                total = prefs.getInt("total_tasks", 0),
            )
        ) {
            WidgetAdaptive.Message.HUNGRY -> context.getString(R.string.widget_line_hungry)
            WidgetAdaptive.Message.POOP -> context.getString(R.string.widget_line_poop)
            WidgetAdaptive.Message.TASK -> context.getString(R.string.widget_line_task, task)
            WidgetAdaptive.Message.DAY_CLOSED -> context.getString(R.string.widget_line_day_closed)
            WidgetAdaptive.Message.SUPPORT -> context.getString(R.string.widget_line_support)
        }
    }

    /**
     * Widget "Soulmon" (transparent): no background at all, the creature straight on the wallpaper.
     * Text is white with a tight black shadow; only the speech line sits in a low-opacity rounded box.
     */
    fun renderClear(context: Context, mgr: AppWidgetManager, appWidgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val spriteId = resolveSprite(
            context,
            prefs.getString("current_stage", "rookie") ?: "rookie",
            prefs.getString("egg_type", "") ?: "",
            prefs.getString("branch_type", "data") ?: "data",
        )
        val views = RemoteViews(context.packageName, R.layout.widget_soulmon_clear)
        val sprite = spriteBitmap(context, spriteId, 96, 256)
        if (sprite != null) {
            views.setImageViewBitmap(R.id.widget_sprite, sprite)
            views.setImageViewBitmap(R.id.widget_sprite_2, sprite)
        } else {
            views.setImageViewResource(R.id.widget_sprite, spriteId)
            views.setImageViewResource(R.id.widget_sprite_2, spriteId)
        }
        val petName = prefs.getString("pet_name", "Soulmon") ?: "Soulmon"
        val counter = taskCounter(prefs.getInt("completed_tasks", 0), prefs.getInt("total_tasks", 0))
        views.setTextViewText(
            R.id.widget_pet_name,
            if (counter != null) context.getString(R.string.widget_name_count, petName, counter) else petName,
        )
        views.setTextViewText(R.id.widget_message, adaptiveLine(context))
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    /**
     * Widget "Soulmon V-Pet": everything is drawn into ONE 576x384 bitmap (the casing's size),
     * because RemoteViews cannot pin content to a percentage of an aspect-fit image. The LCD,
     * scanlines, creature, speech text and status icons go under the casing (real alpha), and
     * every box comes from `WidgetVpet`, inside the opening, so nothing can overflow the screen.
     */
    fun renderVpet(context: Context, mgr: AppWidgetManager, appWidgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val spriteId = resolveSprite(
            context,
            prefs.getString("current_stage", "rookie") ?: "rookie",
            prefs.getString("egg_type", "") ?: "",
            prefs.getString("branch_type", "data") ?: "data",
        )
        val hungry = WidgetVpet.isHungry(
            System.currentTimeMillis(),
            if (prefs.contains("hungry_at")) prefs.getLong("hungry_at", 0L) else null,
        )
        val poop = prefs.getBoolean("has_poop", false)
        val casing = vpetCasingRes(context, prefs.getString("vpet_frame", ""))
        val views = RemoteViews(context.packageName, R.layout.widget_soulmon_vpet)
        val bmp = try {
            drawVpet(context, spriteId, adaptiveLine(context), hungry, poop, casing)
        } catch (e: OutOfMemoryError) {
            null
        }
        if (bmp != null) views.setImageViewBitmap(R.id.widget_vpet, bmp)
        else views.setImageViewResource(R.id.widget_vpet, casing)
        attachClick(context, views)
        mgr.updateAppWidget(appWidgetId, views)
    }

    /** The chosen element casing if the art is in the APK, else the default one (never throws, never 0). */
    private fun vpetCasingRes(context: Context, frameId: String?): Int {
        val name = WidgetVpet.frameDrawableName(frameId) ?: return R.drawable.vpet_moldura
        val variant = context.resources.getIdentifier(name, "drawable", context.packageName)
        return WidgetVpet.pickCasing(variant, R.drawable.vpet_moldura)
    }

    private fun drawVpet(context: Context, spriteId: Int, line: String, hungry: Boolean, poop: Boolean, casing: Int): Bitmap {
        val raw = BitmapFactory.Options().apply { inScaled = false }
        val out = Bitmap.createBitmap(WidgetVpet.W, WidgetVpet.H, Bitmap.Config.ARGB_8888)
        val c = Canvas(out)
        val crisp = Paint().apply { isFilterBitmap = false; isAntiAlias = false }

        // LCD, a few px larger than the opening so the casing's inner edge hides the seam.
        val lcd = Paint().apply { color = Color.parseColor("#0F2A29") }
        c.drawRect(
            (WidgetVpet.SCREEN_L - 4).toFloat(), (WidgetVpet.SCREEN_T - 4).toFloat(),
            (WidgetVpet.SCREEN_R + 4).toFloat(), (WidgetVpet.SCREEN_B + 4).toFloat(), lcd,
        )
        val scan = Paint().apply { color = Color.argb(46, 0, 0, 0) }
        var y = WidgetVpet.SCREEN_T
        while (y < WidgetVpet.SCREEN_B) {
            c.drawRect(WidgetVpet.SCREEN_L.toFloat(), y.toFloat(), WidgetVpet.SCREEN_R.toFloat(), (y + 1).toFloat(), scan)
            y += 3
        }

        // Creature: square, as large as the sprite box allows, centred horizontally, on the floor.
        val sp = WidgetVpet.sprite
        val side = minOf(sp.w, sp.h)
        val sx = sp.l + (sp.w - side) / 2
        val sy = sp.b - side
        BitmapFactory.decodeResource(context.resources, spriteId, raw)?.let {
            c.drawBitmap(it, null, Rect(sx, sy, sx + side, sy + side), crisp)
            it.recycle()
        }

        // Speech text, white, shrunk until it fits the box; ellipsized as the last resort.
        val tb = WidgetVpet.text
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        fun layout(sizePx: Float, maxLines: Int): StaticLayout {
            tp.textSize = sizePx
            return StaticLayout.Builder.obtain(line, 0, line.length, tp, tb.w)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setMaxLines(maxLines)
                .setEllipsize(TextUtils.TruncateAt.END)
                .build()
        }
        var size = 26f
        var lay = layout(size, Int.MAX_VALUE)
        while (lay.height > tb.h && size > 13f) {
            size -= 1f
            lay = layout(size, Int.MAX_VALUE)
        }
        if (lay.height > tb.h) {
            val fit = (tb.h / (lay.height / lay.lineCount.toFloat())).toInt().coerceAtLeast(1)
            lay = layout(size, fit)
        }
        c.save()
        c.clipRect(tb.l, tb.t, tb.r, tb.b)
        c.translate(tb.l.toFloat(), tb.t + (tb.h - lay.height) / 2f)
        lay.draw(c)
        c.restore()

        // Status icons: low-opacity black silhouette by default, full colour when it applies.
        val row = WidgetVpet.iconRow
        val iy = row.t + (row.h - WidgetVpet.ICON) / 2
        fun icon(resId: Int, x: Int, active: Boolean) {
            val ic = BitmapFactory.decodeResource(context.resources, resId, raw) ?: return
            val p = Paint(crisp)
            if (!active) {
                p.colorFilter = PorterDuffColorFilter(Color.BLACK, PorterDuff.Mode.SRC_IN)
                p.alpha = 70
            }
            c.drawBitmap(ic, null, Rect(x, iy, x + WidgetVpet.ICON, iy + WidgetVpet.ICON), p)
            ic.recycle()
        }
        icon(R.drawable.vpet_icon_fome, row.l, hungry)
        icon(R.drawable.fx_poop, row.l + WidgetVpet.ICON + WidgetVpet.ICON_GAP, poop)

        // Casing on top.
        // A variant that fails to decode (corrupt/oversized art) falls back to the default casing instead of a bare LCD.
        (BitmapFactory.decodeResource(context.resources, casing, raw)
            ?: BitmapFactory.decodeResource(context.resources, R.drawable.vpet_moldura, raw))?.let {
            c.drawBitmap(it, 0f, 0f, crisp)
            it.recycle()
        }
        return out
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
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetAdaptiveProvider::class.java)))
            renderAdaptive(context, mgr, id)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetClearProvider::class.java)))
            renderClear(context, mgr, id)
        for (id in mgr.getAppWidgetIds(ComponentName(context, SoulmonWidgetVpetProvider::class.java)))
            renderVpet(context, mgr, id)
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
     * O sprite do widget, SEMPRE arte nossa (20/10/2026, §138: a árvore genérica do gato-coruja
     * foi aposentada, como no app web — D-104).
     *
     * Mesma regra do app (`getSpriteForStage`, src/utils/sprites.ts):
     *  1. `pet_line == "corvo"` → a forma do corvinho (`CORVO_SPRITES`);
     *  2. `pet_line` = id de um dos 5 INICIAIS (`STARTER_SPRITES`) → o sprite do jogador
     *     (um só, o mesmo em todos os estágios — limitação declarada da arte);
     *  3. sem linha (app antigo, linha aposentada, save sem `demoCharacterId`) → um inicial
     *     por HASH ESTÁVEL do id do estágio (`fallbackStarterId`, igual a `fallbackStarterFor`).
     *
     * `eggType` e `branchType` seguem na assinatura (os chamadores os passam); o id do
     * estágio já carrega o galho.
     */
    private fun resolveSprite(context: Context, stage: String, eggType: String, branchType: String): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val line = prefs.getString("pet_line", "") ?: ""
        if (line == "corvo") {
            return CORVO_SPRITES[stage.lowercase()] ?: R.drawable.sprite_corvo_rookie
        }
        return STARTER_SPRITES[line] ?: STARTER_SPRITES.getValue(fallbackStarterId(stage))
    }

    /**
     * Os 5 iniciais → drawable em `drawable-nodpi/` (256², gerados por
     * `tools/gerar-sprites-widget.mjs` a partir de `src/assets/soulmon/starters/<id>.png`).
     * A ORDEM é a de `STARTER_IDS` (src/utils/sprites.ts): o hash abaixo indexa por ela.
     * Paridade travada por `widgetSprites.contract.test.ts`, que lê este fonte.
     */
    val STARTER_SPRITES: Map<String, Int> = linkedMapOf(
        "industrial" to R.drawable.sprite_starter_industrial,
        "nascente" to R.drawable.sprite_starter_nascente,
        "alento" to R.drawable.sprite_starter_alento,
        "vida" to R.drawable.sprite_starter_vida,
        "meteoro" to R.drawable.sprite_starter_meteoro,
    )

    /**
     * Espelho EXATO de `fallbackStarterFor`/`hashId` (src/utils/sprites.ts):
     * `h = (h * 31 + charCode) >>> 0` sobre o id em minúsculas, módulo 5, indexando os iniciais
     * na ordem acima. `Long` mascarado em 32 bits imita o `>>> 0` do JS (sem sinal).
     */
    private fun fallbackStarterId(stage: String): String {
        var h = 0L
        for (c in stage.lowercase()) h = (h * 31L + c.code.toLong()) and 0xFFFFFFFFL
        val ids = STARTER_SPRITES.keys.toList()
        return ids[(h % ids.size).toInt()]
    }

    /**
     * As 11 formas do corvinho → drawable em `drawable-nodpi/` (cópia 256² de
     * `src/assets/soulmon/corvo/corvo-<forma>-256.png`). Tabela FECHADA com
     * `R.drawable.*` (erro de compilação se um arquivo faltar), e a paridade com
     * `CORVO_FORM_IDS` (src/utils/corvoPet.ts) é travada por
     * `widgetSemCobranca.contract.test.ts`, que lê este fonte.
     */
    private val CORVO_SPRITES: Map<String, Int> = mapOf(
        "rookie" to R.drawable.sprite_corvo_rookie,
        "champion-power" to R.drawable.sprite_corvo_champion_power,
        "champion-harmony" to R.drawable.sprite_corvo_champion_harmony,
        "champion-benevolence" to R.drawable.sprite_corvo_champion_benevolence,
        "ultimate-power" to R.drawable.sprite_corvo_ultimate_power,
        "ultimate-harmony" to R.drawable.sprite_corvo_ultimate_harmony,
        "ultimate-benevolence" to R.drawable.sprite_corvo_ultimate_benevolence,
        "mega-power" to R.drawable.sprite_corvo_mega_power,
        "mega-harmony" to R.drawable.sprite_corvo_mega_harmony,
        "mega-benevolence" to R.drawable.sprite_corvo_mega_benevolence,
        "ultra" to R.drawable.sprite_corvo_ultra,
    )

    /**
     * O nome do estágio do Bosque da Guilda (`grove_stage`), ou `null` = a linha SOME.
     * Só o NOME do lugar: sem número, sem "faltam", sem membros, sem barra. Tabela
     * FECHADA de ids; o texto vem de `res/values` (EN) e `res/values-pt` (PT), que o
     * Android escolhe pelo idioma do aparelho.
     */
    private fun groveStageLabel(context: Context, stageId: String?): String? {
        val res = when (stageId) {
            "clareira" -> R.string.widget_grove_clareira
            "ramagem" -> R.string.widget_grove_ramagem
            "copa" -> R.string.widget_grove_copa
            "mata" -> R.string.widget_grove_mata
            "bosque-antigo" -> R.string.widget_grove_bosque_antigo
            else -> return null
        }
        return context.getString(res)
    }

    /**
     * O rótulo do estágio, lido do PREFIXO do id.
     *
     * ⚠️ Isto era uma tabela com ~30 nomes de personagem da Bandai mapeando
     * espécie → nível, apagada em 07/09/2026 pelo mesmo motivo dos drawables.
     * Ela nem funcionava: a árvore de hoje nasce em `rookie` e usa
     * `champion-power` / `mega-harmony` / `ultra`, então TODO estágio real caía
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
