package com.soulmon.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import java.time.LocalDate

/**
 * Widget grande da Home (decisão do dono, 18/11/2026): Soulmon + estado + tarefas e hábitos de hoje, na vertical.
 *
 * O check SÓ MARCA: grava `task_done`/`habit_done` na fila ([WidgetEventQueue]) e redesenha a linha riscada. Não dá comida, XP nem
 * Bits; quem paga é o app ao abrir (`src/utils/widgetEvents.ts`), pela regra do toque na Home. Sem login nem rede aqui.
 */
class SoulmonWidgetHomeProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) WidgetRenderer.renderHome(context, appWidgetManager, id)
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        WidgetRenderer.renderHome(context, appWidgetManager, appWidgetId, newOptions)
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_CHECK) {
            super.onReceive(context, intent)
            return
        }
        // Só item que está na lista de HOJE, aberto e sem etapas: a fila nunca recebe id inventado nem lista de ontem.
        val id = intent.getStringExtra(EXTRA_TASK_ID)
        val kind = intent.getStringExtra(EXTRA_KIND) ?: WidgetHomeTasks.KIND_TASK
        val eventKind = WidgetEventQueue.eventKindFor(kind) ?: return
        if (id == null || WidgetRenderer.homeTaskItems(context).none { it.id == id && it.kind == kind && it.checkable }) return
        if (WidgetEventQueue.Store.addDone(context, eventKind, id, LocalDate.now().toString(), System.currentTimeMillis())) {
            android.util.Log.d("SoulmonWidget", "home check queued")
        }
        WidgetRenderer.updateHome(context)
    }

    companion object {
        const val ACTION_CHECK = "com.soulmon.widget.HOME_TASK_CHECK"
        const val EXTRA_TASK_ID = "com.soulmon.widget.EXTRA_TASK_ID"
        /** `task` ou `habit` ([WidgetHomeTasks.Item.kind]); ausente = `task` (fill-in de antes do adendo). */
        const val EXTRA_KIND = "com.soulmon.widget.EXTRA_KIND"
    }
}
