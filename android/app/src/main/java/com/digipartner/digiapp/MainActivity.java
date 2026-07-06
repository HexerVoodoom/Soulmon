package com.digipartner.digiapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.digipartner.digiapp.plugins.DigiWidgetPlugin;
import com.digipartner.digiapp.plugins.DigiAlarmPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DigiWidgetPlugin.class);
        registerPlugin(DigiAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        createPushNotificationChannel();
    }

    // FCM remote push notifications land on this channel when the app is
    // backgrounded (id referenced by the manifest's default_notification_channel_id).
    private void createPushNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null && manager.getNotificationChannel("digiapp_push") == null) {
                NotificationChannel channel = new NotificationChannel(
                    "digiapp_push",
                    "DigiApp Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Push notifications from DigiApp");
                manager.createNotificationChannel(channel);
            }
        }
    }
}
