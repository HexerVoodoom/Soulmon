import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA L06-13 (decisão do dono, 21/10/2026): o app gira e, em paisagem (822×331), "Nova atividade" e a lista saem da tela
 * sem rolagem. A MainActivity trava em RETRATO. Só vale com APK novo (o build de release é do dono; ver `docs/DEPENDE-DE-VOCE.md`).
 * Capacitor não tem chave de orientação em `capacitor.config.json`: a trava é só o manifest.
 */
describe('Android: orientação travada em retrato', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const activity = manifest.slice(manifest.indexOf('<activity'), manifest.indexOf('</activity>'));

  it('a MainActivity declara screenOrientation="portrait"', () => {
    expect(activity).toContain('android:name=".MainActivity"');
    expect(activity).toMatch(/android:screenOrientation="portrait"/);
  });
  it('o Capacitor config não inventa uma chave de orientação que ele não reconhece', () => {
    expect(readFileSync('capacitor.config.json', 'utf8')).not.toMatch(/orientation/i);
  });
});
