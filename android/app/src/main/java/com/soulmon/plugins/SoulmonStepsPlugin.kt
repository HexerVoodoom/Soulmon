package com.soulmon.plugins

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * PASSOS PELO HEALTH CONNECT (REGISTRO §283) — o total de passos de HOJE, lido do Health Connect, que continua somando
 * com o app FECHADO (o relógio/o celular gravam lá; o Soulmon só pergunta ao abrir).
 *
 * UMA permissão só: `READ_STEPS`. Nada de escrita, nada de outro tipo de dado, nada de leitura em segundo plano, nada de histórico:
 * a pergunta é sempre "quantos passos hoje?" (agregado `COUNT_TOTAL` de 00:00 até agora). Sem série, sem horário.
 *
 * FEATURE DETECT: o APK antigo não tem este plugin — o lado JS (`utils/healthSteps.ts`) checa `Capacitor.isPluginAvailable`.
 * Aqui dentro, qualquer falha resolve com `available=false`/`granted=false` (nunca rejeita): a camada de cima cai no contador do aparelho.
 */
@CapacitorPlugin(name = "SoulmonSteps")
class SoulmonStepsPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        const val READ_STEPS = "android.permission.health.READ_STEPS"
    }

    private fun isAvailable(): Boolean = try {
        HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    } catch (e: Throwable) {
        false
    }

    private suspend fun isGranted(): Boolean = try {
        HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions().contains(READ_STEPS)
    } catch (e: Throwable) {
        false
    }

    /** `{ available, granted }`. `available` = o Health Connect existe e está pronto neste aparelho. */
    @PluginMethod
    fun status(call: PluginCall) {
        scope.launch {
            val available = isAvailable()
            val granted = available && isGranted()
            call.resolve(JSObject().put("available", available).put("granted", granted))
        }
    }

    /** Abre o diálogo do Health Connect para `READ_STEPS`. SÓ chamar depois da tela de consentimento do app. */
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (!isAvailable()) {
            call.resolve(JSObject().put("available", false).put("granted", false))
            return
        }
        scope.launch {
            if (isGranted()) {
                call.resolve(JSObject().put("available", true).put("granted", true))
                return@launch
            }
            try {
                val intent = PermissionController.createRequestPermissionResultContract()
                    .createIntent(context, setOf(READ_STEPS))
                activity.runOnUiThread { startActivityForResult(call, intent, "permissionResult") }
            } catch (e: Throwable) {
                call.resolve(JSObject().put("available", true).put("granted", false))
            }
        }
    }

    @ActivityCallback
    private fun permissionResult(call: PluginCall?, @Suppress("UNUSED_PARAMETER") result: ActivityResult?) {
        if (call == null) return
        scope.launch {
            val available = isAvailable()
            call.resolve(JSObject().put("available", available).put("granted", available && isGranted()))
        }
    }

    /** `{ available, granted, steps? }`: `steps` só vem quando de fato leu — ausente NUNCA significa zero. */
    @PluginMethod
    fun readToday(call: PluginCall) {
        scope.launch {
            val available = isAvailable()
            val granted = available && isGranted()
            val out = JSObject().put("available", available).put("granted", granted)
            if (granted) {
                try {
                    val start = LocalDate.now().atStartOfDay()
                    val response = HealthConnectClient.getOrCreate(context).aggregate(
                        AggregateRequest(
                            metrics = setOf(StepsRecord.COUNT_TOTAL),
                            timeRangeFilter = TimeRangeFilter.between(start, LocalDateTime.now()),
                        )
                    )
                    out.put("steps", response[StepsRecord.COUNT_TOTAL] ?: 0L)
                } catch (e: Throwable) {
                    // sem `steps`: o JS mantém o registro que já tinha
                }
            }
            call.resolve(out)
        }
    }
}
