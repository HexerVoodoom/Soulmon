import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// PL-8 — A PLAY SÓ ACEITA PLAY BILLING LIBRARY ≥ 8.
//
// developer.android.com/google/play/billing/deprecation-faq (lido 21/09/2026):
// v6 recusada desde 31/08/2025, v7 desde 31/08/2026. O app estava em 6.2.1
// com o bump adiado DE PROPÓSITO (commit 4a8b8049) porque `enablePendingPurchases()`
// sem argumento não compila na 8.x. Este guard lê o FONTE porque nenhum teste
// em `node` alcança o Gradle — quem prova o compile continua sendo só o CI
// (`android-build.yml`), e este teste não substitui isso.
//
// PL-9 — ALARME EXATO SEM PERMISSÃO NÃO PODE VIRAR SILÊNCIO.
// Android 14+ com target ≥ 33 não pré-concede SCHEDULE_EXACT_ALARM; sem o
// gate `canScheduleExactAlarms()` o setExact* lança SecurityException e o JS
// engole (`.catch(() => {})`) — nenhum lembrete de tarefa tocava no APK.
// ---------------------------------------------------------------------------
const gradle = readFileSync('android/app/build.gradle', 'utf8');
const billing = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt',
  'utf8',
);
const alarm = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonAlarmPlugin.kt',
  'utf8',
);
const boot = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/notifications/BootReceiver.kt',
  'utf8',
);
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

const semComentarios = (fonte: string) =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('PL-8 › Play Billing Library ≥ 8', () => {
  const codigoGradle = semComentarios(gradle);
  const codigoBilling = semComentarios(billing);

  it('build.gradle não volta para billing 0.x–7.x', () => {
    expect(codigoGradle).not.toMatch(/billing(-ktx)?:[0-7]\./);
    expect(codigoGradle).toMatch(/billing(-ktx)?:(8|9|[1-9]\d)\./);
  });

  it('enablePendingPurchases leva PendingPurchasesParams (a forma sem argumento não existe na 8)', () => {
    expect(codigoBilling).not.toMatch(/enablePendingPurchases\(\s*\)/);
    expect(codigoBilling).toMatch(/enablePendingPurchases\(\s*PendingPurchasesParams/);
  });

  it('queryProductDetailsAsync lê QueryProductDetailsResult.productDetailsList', () => {
    expect(codigoBilling).toMatch(/import com\.android\.billingclient\.api\.QueryProductDetailsResult/);
    expect(codigoBilling).toMatch(/queryResult\.productDetailsList/);
  });

  it('o reject "product-not-found" continua sem sufixo (contrato opaco com playBilling.ts)', () => {
    expect(codigoBilling).toMatch(/call\.reject\("product-not-found"\)/);
    expect(codigoBilling).not.toMatch(/product-not-found-\$/);
  });
});

describe('PL-9 › alarme exato com gate e fallback', () => {
  const codigoAlarm = semComentarios(alarm);

  it('setExactAndAllowWhileIdle só atrás de canScheduleExactAlarms()', () => {
    expect(codigoAlarm).toMatch(/canScheduleExactAlarms\(\)/);
    expect(codigoAlarm).toMatch(/setAndAllowWhileIdle\(/);
    expect(codigoAlarm).toMatch(/if \(canExact\(alarmManager\)\) \{\s*alarmManager\.setExactAndAllowWhileIdle/);
  });

  it('a mudança da permissão reagenda (receiver + manifesto)', () => {
    expect(semComentarios(boot)).toMatch(/ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED/);
    expect(manifest).toMatch(/android\.app\.action\.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED/);
  });

  it('o JS pode perguntar e convidar, com no-op web', () => {
    const ts = readFileSync('src/plugins/SoulmonAlarmPlugin.ts', 'utf8');
    expect(ts).toMatch(/canScheduleExact\(\)/);
    expect(ts).toMatch(/openExactAlarmSettings\(\)/);
    expect(codigoAlarm).toMatch(/fun canScheduleExact\(/);
    expect(codigoAlarm).toMatch(/fun openExactAlarmSettings\(/);
  });
});
