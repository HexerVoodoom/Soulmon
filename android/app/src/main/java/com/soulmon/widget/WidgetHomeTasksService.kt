package com.soulmon.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
import android.util.TypedValue
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.soulmon.R

/**
 * A lista do widget grande da Home. `RemoteViewsService` funciona do minSdk (26) até hoje: um caminho só, sem o
 * checkbox nativo da API 31+. Cada linha: o check (fill-in com o id da tarefa → [SoulmonWidgetHomeProvider]) e o nome.
 * Feita (no app ou com check pendente na fila) = riscada, e sem clique.
 */
class WidgetHomeTasksService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        Factory(applicationContext, intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID))

    private class Factory(private val context: Context, private val widgetId: Int) : RemoteViewsFactory {
        private var items: List<WidgetHomeTasks.Item> = emptyList()
        private var spec = WidgetHomeLayout.textSpec(0)

        override fun onCreate() {}

        override fun onDataSetChanged() {
            items = WidgetRenderer.homeTaskItems(context)
            val width = if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) 0
            else AppWidgetManager.getInstance(context).getAppWidgetOptions(widgetId).getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            spec = WidgetHomeLayout.textSpec(width)
        }

        override fun onDestroy() {}

        override fun getCount(): Int = items.size

        override fun getViewAt(position: Int): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_home_task_item)
            val item = items.getOrNull(position) ?: return views
            val name: CharSequence = if (item.done) {
                SpannableString(item.name).apply { setSpan(StrikethroughSpan(), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) }
            } else item.name
            views.setTextViewText(R.id.widget_home_task_name, name)
            views.setTextViewTextSize(R.id.widget_home_task_name, TypedValue.COMPLEX_UNIT_SP, spec.taskSp)
            views.setTextColor(R.id.widget_home_task_name, if (item.done) DONE_TEXT else OPEN_TEXT)
            views.setImageViewResource(R.id.widget_home_check, if (item.done) R.drawable.widget_home_check_on else R.drawable.widget_home_check_off)
            views.setContentDescription(
                R.id.widget_home_check_hit,
                context.getString(
                    when {
                        item.done -> R.string.widget_home_check_done
                        item.lock -> R.string.widget_home_check_steps
                        else -> R.string.widget_home_check_mark
                    },
                    item.name,
                ),
            )
            // Hábito com etapas: na Home ele fecha pelas etapas, então aqui o aro fica apagado e sem clique.
            views.setInt(R.id.widget_home_check, "setImageAlpha", if (item.lock) 90 else 255)
            if (item.checkable) {
                views.setOnClickFillInIntent(
                    R.id.widget_home_check_hit,
                    Intent().putExtra(SoulmonWidgetHomeProvider.EXTRA_TASK_ID, item.id).putExtra(SoulmonWidgetHomeProvider.EXTRA_KIND, item.kind),
                )
            }
            return views
        }

        override fun getLoadingView(): RemoteViews? = null
        override fun getViewTypeCount(): Int = 1
        override fun getItemId(position: Int): Long = items.getOrNull(position)?.key?.hashCode()?.toLong() ?: position.toLong()
        override fun hasStableIds(): Boolean = true
    }

    private companion object {
        val OPEN_TEXT = Color.parseColor("#F2E3C6")
        val DONE_TEXT = Color.parseColor("#7FA7A3")
    }
}
