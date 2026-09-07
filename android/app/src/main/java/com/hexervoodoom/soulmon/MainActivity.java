package com.hexervoodoom.soulmon;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.hexervoodoom.soulmon.plugins.SoulmonWidgetPlugin;
import com.hexervoodoom.soulmon.plugins.SoulmonAlarmPlugin;
import com.hexervoodoom.soulmon.plugins.BillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoulmonWidgetPlugin.class);
        registerPlugin(SoulmonAlarmPlugin.class);
        registerPlugin(BillingPlugin.class);
        super.onCreate(savedInstanceState);
        createPushNotificationChannel();
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
