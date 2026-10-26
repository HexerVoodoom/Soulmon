package com.soulmon;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.soulmon.plugins.SoulmonWidgetPlugin;
import com.soulmon.plugins.SoulmonAlarmPlugin;
import com.soulmon.plugins.BillingPlugin;
import com.soulmon.plugins.SoulmonHealthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoulmonWidgetPlugin.class);
        registerPlugin(SoulmonAlarmPlugin.class);
        registerPlugin(BillingPlugin.class);
        registerPlugin(SoulmonHealthPlugin.class);
        super.onCreate(savedInstanceState);
        createPushNotificationChannel();
        enterImmersiveMode();
    }

    // MODO IMERSIVO (beta-2 item 3.1): barras de status e de navegação ocultas, o app ocupa a tela toda.
    //
    // Por que assim e não de outro jeito (cada escolha tem uma razão e um teste em tests/androidImersivo.test.ts):
    //  · BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE: deslizar a partir da borda mostra as barras POR UM INSTANTE e elas somem sozinhas;
    //    o gesto de voltar (e o botão Voltar da navegação por 3 botões, revelado por esse deslize) continua funcionando. Sem
    //    isso o comportamento padrão MOSTRA as barras de vez no primeiro toque.
    //  · Só o WindowInsetsControllerCompat (API 26+ pelo AndroidX, API 30+ nativo): NÃO usa FLAG_FULLSCREEN nem
    //    setDecorFitsSystemWindows(false) — os dois quebram o redimensionamento do teclado (adjustResize) em Android < 11, e o app
    //    tem campos de texto (tarefas, nome). Do Android 15 em diante o edge-to-edge já é obrigatório (targetSdk 36) e o
    //    Capacitor (SystemBars) injeta as áreas seguras na página; nada disso é tocado aqui.
    //  · Reaplica em onWindowFocusChanged: as barras voltam depois de um diálogo do sistema, do seletor de login do Google, da
    //    barra de notificações ou do app em segundo plano — sem isto o modo imersivo "some" depois da primeira interrupção.
    //  · A área de recorte (notch) NÃO é alterada (layoutInDisplayCutoutMode padrão): as áreas seguras da página seguem como estavam.
    private void enterImmersiveMode() {
        Window window = getWindow();
        if (window == null) return;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller == null) return;
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }

    // FCM remote push notifications land on this channel when the app is
    // backgrounded (id referenced by the manifest's default_notification_channel_id).
    private void createPushNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null && manager.getNotificationChannel("soulmon_push") == null) {
                NotificationChannel channel = new NotificationChannel(
                    "soulmon_push",
                    "Soulmon",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notificações do Soulmon");
                manager.createNotificationChannel(channel);
            }
        }
    }
}
