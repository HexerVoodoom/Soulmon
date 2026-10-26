package com.soulmon.plugins

import android.app.Activity
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
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
 * PASSOS pelo Health Connect (Rodada 5, Lane C; REGISTRO §176).
 *
 * Leitura APENAS: a única permissão é `READ_STEPS`, e o único dado lido é o TOTAL de passos do dia (agregado
 * `StepsRecord.COUNT_TOTAL`) — nunca a série, nunca horário de passo. O Health Connect é quem conta com o app
 * fechado (as fontes — Google Fit, Samsung Health, o próprio relógio — gravam lá); o app só lê ao abrir e em
 * primeiro plano. Não há serviço em segundo plano nem `READ_HEALTH_DATA_IN_BACKGROUND`.
 *
 * Feature detect: o JS chama `isAvailable()` primeiro. APK antigo (sem este plugin) responde "not implemented"
 * e o JS trata como "sem Health Connect"; aparelho sem o app do Health Connect (Android ≤ 13 sem a Play instalada)
 * responde `available: false`.
 *
 * O pedido de permissão só é chamado DEPOIS do cartão de consentimento do app (um fluxo só: o "Sim" do cartão
 * abre direto o diálogo do Health Connect).
 */
@CapacitorPlugin(name = "SoulmonHealth")
class SoulmonHealthPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val permission = HealthPermission.getReadPermission(StepsRecord::class)

    private fun client(): HealthConnectClient? =
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE)
            HealthConnectClient.getOrCreate(context) else null

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val ret = JSObject()
        ret.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        ret.put("needsUpdate", status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
        call.resolve(ret)
    }

    @PluginMethod
    fun hasPermission(call: PluginCall) {
        val c = client() ?: run { call.resolve(JSObject().put("granted", false)); return }
        scope.launch {
            val granted = try { c.permissionController.getGrantedPermissions().contains(permission) } catch (_: Exception) { false }
            call.resolve(JSObject().put("granted", granted))
        }
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val c = client() ?: run { call.resolve(JSObject().put("granted", false)); return }
        val intent = PermissionController.createRequestPermissionResultContract().createIntent(context, setOf(permission))
        // `c` só prova que o provedor existe; o resultado é relido em `permissionResult`.
        startActivityForResult(call, intent, "permissionResult")
    }

    @ActivityCallback
    private fun permissionResult(call: PluginCall?, @Suppress("UNUSED_PARAMETER") result: ActivityResult) {
        if (call == null) return
        val c = client() ?: run { call.resolve(JSObject().put("granted", false)); return }
        scope.launch {
            val granted = try { c.permissionController.getGrantedPermissions().contains(permission) } catch (_: Exception) { false }
            call.resolve(JSObject().put("granted", granted))
        }
    }

    /** Total de passos de HOJE (da meia-noite local até agora). Sem permissão/erro: rejeita (o JS trata como `null`, nunca 0). */
    @PluginMethod
    fun readStepsToday(call: PluginCall) {
        val c = client() ?: run { call.reject("unavailable"); return }
        scope.launch {
            try {
                if (!c.permissionController.getGrantedPermissions().contains(permission)) { call.reject("no-permission"); return@launch }
                val now = LocalDateTime.now()
                val start = LocalDate.now().atStartOfDay()
                val res = c.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL), TimeRangeFilter.between(start, now)))
                call.resolve(JSObject().put("steps", res[StepsRecord.COUNT_TOTAL] ?: 0L))
            } catch (e: Exception) {
                call.reject("read-failed")
            }
        }
    }
}
