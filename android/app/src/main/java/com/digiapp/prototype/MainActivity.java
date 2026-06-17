package com.digiapp.prototype;

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
    }
}
