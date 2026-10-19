import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 3.1 (beta-2) — Android em tela cheia (modo imersivo) na casca nativa.
 *
 * A casca não roda no vitest; o que dá para travar daqui é a CONFIGURAÇÃO que decide o comportamento (o resto — gesto de voltar com as
 * barras ocultas, revelação por deslize, teclado — é verificado no `assembleDebug` e no aparelho; ver docs/FRENTE-B-REGRAS-BETA2.md).
 * Cada asserção abaixo é uma decisão com razão escrita no `MainActivity.java`.
 */
const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const MAIN = read('android/app/src/main/java/com/soulmon/MainActivity.java');
const STYLES = read('android/app/src/main/res/values/styles.xml');
const MANIFEST = read('android/app/src/main/AndroidManifest.xml');
// o código sem comentários (as asserções "não pode ter" olham só o que executa)
const CODIGO = MAIN.replace(/\/\/[^\n]*/g, '');

describe('modo imersivo da casca Android', () => {
  it('oculta as barras do sistema pelo WindowInsetsControllerCompat (status + navegação)', () => {
    expect(CODIGO).toContain('WindowCompat.getInsetsController(');
    expect(CODIGO).toMatch(/\.hide\(WindowInsetsCompat\.Type\.systemBars\(\)\)/);
  });
  it('o comportamento é "barras transitórias por deslize": o gesto de voltar e a revelação da navegação por botões continuam funcionando', () => {
    expect(CODIGO).toContain('BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE');
  });
  it('reaplica ao ganhar o foco (diálogo do sistema, login do Google, notificações e volta do segundo plano trazem as barras de volta)', () => {
    expect(CODIGO).toMatch(/onWindowFocusChanged\(boolean hasFocus\)[\s\S]*?if \(hasFocus\) enterImmersiveMode\(\)/);
    expect(CODIGO).toMatch(/super\.onCreate\(savedInstanceState\);[\s\S]*?enterImmersiveMode\(\);/);
  });
  it('NÃO usa FLAG_FULLSCREEN, windowFullscreen nem setDecorFitsSystemWindows(false): quebrariam o teclado (adjustResize) no Android < 11', () => {
    expect(CODIGO).not.toMatch(/FLAG_FULLSCREEN/);
    expect(CODIGO).not.toMatch(/setDecorFitsSystemWindows/);
    expect(STYLES).not.toMatch(/windowFullscreen/);
    expect(STYLES).not.toMatch(/windowLayoutInDisplayCutoutMode/); // as áreas seguras da página seguem como estavam
  });
  it('não mexe nas áreas seguras: o recorte (notch) fica no padrão do sistema', () => {
    expect(CODIGO).not.toMatch(/layoutInDisplayCutoutMode/);
  });
  it('o tema pós-splash continua o do Capacitor (AppTheme.NoActionBar) e a Activity continua com singleTask + as configChanges', () => {
    expect(STYLES).toMatch(/<style name="AppTheme\.NoActionBar" parent="Theme\.AppCompat\.DayNight\.NoActionBar">/);
    expect(MANIFEST).toMatch(/android:launchMode="singleTask"/);
    expect(MANIFEST).toMatch(/android:configChanges="orientation\|keyboardHidden\|keyboard\|screenSize\|locale\|smallestScreenSize\|screenLayout\|uiMode"/);
  });
  it('os plugins nativos continuam registrados antes do super.onCreate (o registro depois do bridge nunca funciona)', () => {
    const i = CODIGO.indexOf('registerPlugin(BillingPlugin.class)');
    const j = CODIGO.indexOf('super.onCreate(savedInstanceState)');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(j);
  });
  it('as dependências do AndroidX usadas existem no projeto (core ≥ 1.5 traz o WindowInsetsControllerCompat)', () => {
    const vars = read('android/variables.gradle');
    const m = /androidxCoreVersion = '(\d+)\.(\d+)/.exec(vars)!;
    expect(Number(m[1]) * 100 + Number(m[2])).toBeGreaterThanOrEqual(105);
  });
});
