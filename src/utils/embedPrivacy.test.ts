// @vitest-environment jsdom
/**
 * /embed SEM TERMO E SEM DADO (13/11/2026, condição do dono): no embed a demo pula o termo de
 * consentimento e a abertura, e por isso NENHUMA chamada de telemetria, crash, conta, nuvem ou
 * push pode sair. Fora do embed tudo segue como antes (termo, abertura e telemetria ligados).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installEmbedNetworkGuard, resetEmbedGuardForTest, isEmbedMode } from './embedMode';
import { track, flush, isTelemetryEnabled, pendingTelemetry, resetTelemetryForTest } from './telemetry';
import { reportCrash } from './crashReport';
import { subscribeToPush, registerForPushNotifications } from './notifications';
import { mostraVideoDeMarca, tocaCinematicaInicial, exigeTermo } from './embedGates';
import { buildConsentRecord } from './consent';

const API_DE_DADO = ['/api/metrics', '/api/crash', '/api/account', '/api/save', '/api/subscribe', '/api/fcm-subscribe', '/api/entitlements', '/api/feedback'];

let realFetch: typeof fetch;
let realBeacon: PropertyDescriptor | undefined;
let rede: ReturnType<typeof vi.fn>;
let beacon: ReturnType<typeof vi.fn>;

function irPara(caminho: string) {
  window.history.pushState({}, '', caminho);
}

beforeEach(() => {
  realFetch = window.fetch;
  realBeacon = Object.getOwnPropertyDescriptor(window.navigator, 'sendBeacon');
  // A "rede de verdade": todo pedido que chegasse aqui teria saído do aparelho.
  rede = vi.fn(async () => new Response('{}', { status: 200 }));
  beacon = vi.fn(() => true);
  window.fetch = rede as unknown as typeof fetch;
  Object.defineProperty(window.navigator, 'sendBeacon', { configurable: true, writable: true, value: beacon });
  resetEmbedGuardForTest();
  resetTelemetryForTest();
});

afterEach(() => {
  window.fetch = realFetch;
  if (realBeacon) Object.defineProperty(window.navigator, 'sendBeacon', realBeacon);
  else delete (window.navigator as unknown as Record<string, unknown>).sendBeacon;
  irPara('/');
});

const urls = () => [...rede.mock.calls.map(c => String(c[0] instanceof Request ? c[0].url : c[0])), ...beacon.mock.calls.map(c => String(c[0]))];

describe('modo embed (/embed): nada sai do aparelho', () => {
  beforeEach(() => irPara('/embed'));

  it('a telemetria está DESLIGADA por guard duro, mesmo com a preferência ligada', () => {
    expect(isEmbedMode()).toBe(true);
    window.localStorage.setItem('soulmon-telemetry-enabled', 'true');
    expect(isTelemetryEnabled()).toBe(false);
    track('install');
    track('app_open', { source: 0 });
    expect(pendingTelemetry()).toEqual([]);
    flush();
    expect(beacon).not.toHaveBeenCalled();
    expect(rede).not.toHaveBeenCalled();
  });

  it('crash e push não enviam nada', async () => {
    expect(reportCrash('error', new Error('boom'))).toBe(false);
    expect(await subscribeToPush('Pet', 'en-US')).toBe(false);
    expect(await registerForPushNotifications('Pet', 'en-US')).toBe(false);
    expect(urls()).toEqual([]);
  });

  it('o guard de rede corta /api/* (conta, nuvem, métricas) e todo beacon', async () => {
    expect(installEmbedNetworkGuard()).toBe(true);
    for (const url of API_DE_DADO) {
      const res = await window.fetch(url, { method: 'POST', body: '{}' });
      expect(res.status).toBe(503);
      const abs = await window.fetch(`https://soulmon.app${url}`, { method: 'POST' });
      expect(abs.status).toBe(503);
    }
    expect(window.navigator.sendBeacon('/api/metrics', new Blob(['{}']))).toBe(false);
    expect(urls()).toEqual([]); // nenhuma chamada chegou à rede
    // asset que não é /api continua passando (o jogo carrega normalmente)
    await window.fetch('/assets/x.json');
    expect(urls()).toEqual(['/assets/x.json']);
  });

  it('pula a abertura e o termo, sem gravar consentimento', () => {
    expect(mostraVideoDeMarca()).toBe(false);
    expect(tocaCinematicaInicial(false)).toBe(false);
    expect(exigeTermo(undefined)).toBe(false);
  });
});

describe('fora do embed: comportamento de sempre', () => {
  beforeEach(() => irPara('/'));

  it('o guard não instala e a telemetria segue ligada e enviando', () => {
    expect(isEmbedMode()).toBe(false);
    expect(installEmbedNetworkGuard()).toBe(false);
    expect(window.fetch).toBe(rede);
    expect(isTelemetryEnabled()).toBe(true);
    track('install');
    expect(pendingTelemetry().map(r => r.e)).toContain('install');
    flush();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(String(beacon.mock.calls[0][0])).toBe('/api/metrics');
  });

  it('vídeo de marca, cinemática da 1ª abertura e termo continuam valendo', () => {
    expect(mostraVideoDeMarca()).toBe(true);
    window.localStorage.removeItem('soulmon-intro-cinematica-vista');
    expect(tocaCinematicaInicial(false)).toBe(true);
    expect(tocaCinematicaInicial(true)).toBe(false);
    expect(exigeTermo(undefined)).toBe(true);
    expect(exigeTermo(buildConsentRecord(new Date()))).toBe(false);
  });

  it('o parâmetro explícito decide igual nos dois modos', () => {
    expect(mostraVideoDeMarca(true)).toBe(false);
    expect(tocaCinematicaInicial(false, true)).toBe(false);
    expect(exigeTermo(undefined, true)).toBe(false);
    expect(exigeTermo(undefined, false)).toBe(true);
  });
});
