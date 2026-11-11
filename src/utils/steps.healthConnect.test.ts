import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Passos pelo Health Connect (REGISTRO §283): fonte preferida, com o contador do aparelho de reserva e feature detect para o APK antigo
 * (sem o plugin nativo `SoulmonSteps`). O Capacitor e os dois plugins são simulados: o que se prova aqui é a ESCOLHA da fonte.
 */
const { cap, hc, sensor } = vi.hoisted(() => ({
  cap: { native: true, plugin: true },
  hc: { status: vi.fn(), requestPermission: vi.fn(), readToday: vi.fn() },
  sensor: {
    isAvailable: vi.fn(),
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    startMeasurementUpdates: vi.fn(),
    getMeasurement: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => cap.native,
    isPluginAvailable: (name: string) => cap.plugin && name === 'SoulmonSteps',
  },
  registerPlugin: () => hc,
}));
vi.mock('../plugins/SoulmonStepsPlugin', () => ({ SoulmonSteps: hc }));
vi.mock('@capgo/capacitor-pedometer', () => ({ CapacitorPedometer: sensor }));

import {
  applyHealthTotal,
  hasStepsPermission,
  isStepsAvailable,
  readStepsToday,
  requestStepsPermission,
  stepsDayKey,
  __resetStepsRuntime,
  type StepsRecord,
} from './steps';

const NOW = new Date(2026, 10, 10, 15, 0);
const DAY = stepsDayKey(NOW);

beforeEach(() => {
  __resetStepsRuntime();
  cap.native = true;
  cap.plugin = true;
  for (const m of [...Object.values(hc), ...Object.values(sensor)]) m.mockReset();
  hc.status.mockResolvedValue({ available: true, granted: true });
  hc.requestPermission.mockResolvedValue({ available: true, granted: true });
  hc.readToday.mockResolvedValue({ available: true, granted: true, steps: 4321 });
  sensor.isAvailable.mockResolvedValue({ stepCounting: true });
  sensor.checkPermissions.mockResolvedValue({ activityRecognition: 'granted' });
  sensor.requestPermissions.mockResolvedValue({ activityRecognition: 'granted' });
  sensor.startMeasurementUpdates.mockResolvedValue(undefined);
  sensor.getMeasurement.mockResolvedValue({ numberOfSteps: 100 });
});

describe('applyHealthTotal — o total do dia vindo do Health Connect', () => {
  it('sem registro, ou de outro dia, começa do total lido (sem baseline)', () => {
    expect(applyHealthTotal(undefined, 4321, DAY)).toEqual({ date: DAY, baseline: 0, today: 4321 });
    const ontem: StepsRecord = { date: 'Mon Nov 09 2026', baseline: 5, today: 9999 };
    expect(applyHealthTotal(ontem, 120, DAY)).toEqual({ date: DAY, baseline: 0, today: 120 });
  });

  it('no mesmo dia só cresce: uma leitura menor nunca tira passo', () => {
    const rec: StepsRecord = { date: DAY, baseline: 0, today: 5000 };
    expect(applyHealthTotal(rec, 4000, DAY).today).toBe(5000);
    expect(applyHealthTotal(rec, 6000, DAY).today).toBe(6000);
  });

  it('entrada inválida nunca vira negativo nem NaN', () => {
    expect(applyHealthTotal(undefined, Number.NaN, DAY).today).toBe(0);
    expect(applyHealthTotal(undefined, -9, DAY).today).toBe(0);
  });
});

describe('fonte: Health Connect primeiro', () => {
  it('lê o total do Health Connect e NÃO toca no contador do aparelho', async () => {
    const rec = await readStepsToday(NOW, null);
    expect(rec).toEqual({ date: DAY, baseline: 0, today: 4321 });
    expect(sensor.getMeasurement).not.toHaveBeenCalled();
  });

  it('o pedido de permissão é só o do Health Connect', async () => {
    hc.status.mockResolvedValue({ available: true, granted: false });
    await expect(requestStepsPermission()).resolves.toBe(true);
    expect(hc.requestPermission).toHaveBeenCalledTimes(1);
    expect(sensor.requestPermissions).not.toHaveBeenCalled();
  });

  it('recusou o diálogo do Health Connect: false, e NÃO abre o segundo diálogo do sensor', async () => {
    hc.status.mockResolvedValue({ available: true, granted: false });
    hc.requestPermission.mockResolvedValue({ available: true, granted: false });
    await expect(requestStepsPermission()).resolves.toBe(false);
    expect(sensor.requestPermissions).not.toHaveBeenCalled();
  });

  it('leitura sem `steps` (falhou) devolve null e null NÃO é zero', async () => {
    hc.readToday.mockResolvedValue({ available: true, granted: true });
    sensor.checkPermissions.mockResolvedValue({ activityRecognition: 'denied' });
    await expect(readStepsToday(NOW, { date: DAY, baseline: 0, today: 900 })).resolves.toBeNull();
  });
});

describe('reserva: contador do aparelho', () => {
  it('Health Connect indisponível no aparelho: pede e lê pelo sensor, como antes', async () => {
    hc.status.mockResolvedValue({ available: false, granted: false });
    await expect(isStepsAvailable()).resolves.toBe(true);
    await expect(requestStepsPermission()).resolves.toBe(true);
    expect(hc.requestPermission).not.toHaveBeenCalled();
    expect(sensor.requestPermissions).toHaveBeenCalledTimes(1);
    const rec = await readStepsToday(NOW, null);
    expect(rec).toEqual({ date: DAY, baseline: 100, today: 0 });
  });

  it('Health Connect presente mas SEM permissão e sensor já concedido: segue pelo sensor', async () => {
    hc.status.mockResolvedValue({ available: true, granted: false });
    await expect(hasStepsPermission()).resolves.toBe(true);
    const rec = await readStepsToday(NOW, null);
    expect(rec?.baseline).toBe(100);
    expect(hc.readToday).not.toHaveBeenCalled();
  });
});

describe('APK antigo (sem o plugin nativo) e PWA', () => {
  it('sem o plugin: nem consulta o Health Connect, usa o sensor', async () => {
    cap.plugin = false;
    await expect(isStepsAvailable()).resolves.toBe(true);
    await readStepsToday(NOW, null);
    expect(hc.status).not.toHaveBeenCalled();
    expect(hc.readToday).not.toHaveBeenCalled();
  });

  it('PWA/desktop: nada é carregado, nada está disponível', async () => {
    cap.native = false;
    await expect(isStepsAvailable()).resolves.toBe(false);
    await expect(hasStepsPermission()).resolves.toBe(false);
    await expect(requestStepsPermission()).resolves.toBe(false);
    await expect(readStepsToday(NOW, null)).resolves.toBeNull();
    expect(hc.status).not.toHaveBeenCalled();
  });

  it('o plugin lança: degrada em silêncio, sem estourar', async () => {
    hc.status.mockRejectedValue(new Error('boom'));
    sensor.isAvailable.mockResolvedValue({ stepCounting: false });
    await expect(isStepsAvailable()).resolves.toBe(false);
  });
});
