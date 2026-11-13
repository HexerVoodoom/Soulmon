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
// PL-9 — LEMBRETE NÃO PRECISA DE ALARME EXATO (beta-play-01).
// Android 14+ com target ≥ 33 não pré-concede SCHEDULE_EXACT_ALARM; setExact*
// lançava SecurityException e o JS engolia (`.catch(() => {})`). A permissão é
// restrita na Play (despertador/calendário) e um lembrete tolera minutos de
// janela, então ela saiu: alarme inexato, sem permissão e sem convite na UI.
// BETA12 (item I): o AVISO DO FOCO (fim do Pomodoro) precisa do minuto certo com o app fechado. Só ele usa
// `scheduleExactAlarm` (timestamp em ms): `setExactAndAllowWhileIdle` quando `canScheduleExactAlarms()`, senão cai no
// inexato. A permissão volta ao manifesto por isso (declarar na ficha da Play); o lembrete comum segue inexato.
// ---------------------------------------------------------------------------
const gradle = readFileSync('android/app/build.gradle', 'utf8');
const billing = readFileSync(
  'android/app/src/main/java/com/soulmon/plugins/BillingPlugin.kt',
  'utf8',
);
const alarm = readFileSync(
  'android/app/src/main/java/com/soulmon/plugins/SoulmonAlarmPlugin.kt',
  'utf8',
);
const boot = readFileSync(
  'android/app/src/main/java/com/soulmon/notifications/BootReceiver.kt',
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

describe('PL-9 › lembrete comum com alarme INEXATO; só o aviso do Foco pede o minuto exato (beta12, item I)', () => {
  const codigoAlarm = semComentarios(alarm);

  it('SCHEDULE_EXACT_ALARM é declarada UMA vez e o BootReceiver continua sem reagir à mudança dela', () => {
    expect(semComentarios(manifest).match(/android\.permission\.SCHEDULE_EXACT_ALARM/g)?.length).toBe(1);
    expect(semComentarios(manifest)).not.toMatch(/USE_EXACT_ALARM/);
    expect(semComentarios(boot)).not.toMatch(/EXACT_ALARM/);
  });

  it('o lembrete comum (scheduleAlarmInternal) segue só com setAndAllowWhileIdle', () => {
    const comum = codigoAlarm.slice(codigoAlarm.indexOf('fun scheduleAlarmInternal'), codigoAlarm.indexOf('fun scheduleAtInternal'));
    expect(comum).toMatch(/alarmManager\.setAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP/);
    expect(comum).not.toMatch(/setExact|setAlarmClock|canScheduleExactAlarms|canExact/);
  });

  it('o aviso do Foco (scheduleAtInternal) usa setExactAndAllowWhileIdle SÓ com canScheduleExactAlarms e cai no inexato sem ela', () => {
    expect(codigoAlarm).toMatch(/fun canExact\(/);
    expect(codigoAlarm).toMatch(/am\.canScheduleExactAlarms\(\)/);
    const foco = codigoAlarm.slice(codigoAlarm.indexOf('fun scheduleAtInternal'), codigoAlarm.indexOf('private fun pendingFor'));
    expect(foco).toMatch(/if \(canExact\(context\)\)/);
    expect(foco).toMatch(/setExactAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP/);
    expect(foco).toMatch(/catch \(_: SecurityException\)/);
    expect(foco).toMatch(/if \(!exact\) alarmManager\.setAndAllowWhileIdle\(/);
  });

  it('o BootReceiver refaz o alarme de instante só se ainda está no futuro (não reaparece aviso velho)', () => {
    expect(codigoAlarm).toMatch(/alarm\.has\("atMs"\)/);
    expect(codigoAlarm).toMatch(/if \(at > System\.currentTimeMillis\(\)\)/);
  });

  it('o JS não tem convite de "Alarmes e lembretes"; segue o atalho de notificações', () => {
    const ts = readFileSync('src/plugins/SoulmonAlarmPlugin.ts', 'utf8');
    expect(ts).not.toMatch(/ACTION_REQUEST_SCHEDULE_EXACT_ALARM|openExactAlarmSettings/);
    expect(ts).toMatch(/scheduleExactAlarm\(options: \{ id: string; title: string; body: string; atMs: number \}\)/);
    expect(ts).toMatch(/openNotificationSettings\(\)/);
    expect(codigoAlarm).toMatch(/fun openNotificationSettings\(/);
    expect(codigoAlarm).toMatch(/fun scheduleExactAlarm\(/);
  });
});
