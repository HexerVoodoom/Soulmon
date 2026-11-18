package com.soulmon.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import java.time.LocalDate

/**
 * Widget grande da Home (decisão do dono, 18/11/2026): Soulmon + estado + tarefas de hoje, na vertical.
 *
 * O check SÓ MARCA: grava `task_done` na fila ([WidgetEventQueue]) e redesenha a linha riscada. Não dá comida, XP nem
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
        // Só tarefa que está na lista de HOJE e ainda aberta: a fila nunca recebe id inventado nem lista de ontem.
        val id = intent.getStringExtra(EXTRA_TASK_ID)
        if (id == null || WidgetRenderer.homeTaskItems(context).none { it.id == id && !it.done }) return
        if (WidgetEventQueue.Store.addTaskDone(context, id, LocalDate.now().toString(), System.currentTimeMillis())) {
            android.util.Log.d("SoulmonWidget", "home check queued")
        }
        WidgetRenderer.updateHome(context)
    }

    companion object {
        const val ACTION_CHECK = "com.soulmon.widget.HOME_TASK_CHECK"
        const val EXTRA_TASK_ID = "com.soulmon.widget.EXTRA_TASK_ID"
    }
}
