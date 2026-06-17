package com.digiapp.prototype;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.digipartner.digiapp.plugins.DigiWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DigiWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
