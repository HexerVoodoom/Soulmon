import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ViewType } from '../navigation';

const h = vi.hoisted(() => ({
  native: true,
  cb: undefined as undefined | (() => void),
  remove: vi.fn(),
  addListener: vi.fn(),
  minimizeApp: vi.fn(),
  exitApp: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => h.native },
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: h.addListener,
    minimizeApp: h.minimizeApp,
    exitApp: h.exitApp,
  },
}));

import { registerAndroidBack } from './androidBack';

beforeEach(() => {
  h.native = true;
  h.cb = undefined;
  h.remove.mockReset();
  h.addListener.mockReset().mockImplementation((_ev: string, cb: () => void) => {
    h.cb = cb;
    return Promise.resolve({ remove: h.remove });
  });
  h.minimizeApp.mockReset().mockResolvedValue(undefined);
  h.exitApp.mockReset();
});

describe('registerAndroidBack', () => {
  it('fora de plataforma nativa não registra nada', () => {
    h.native = false;
    const off = registerAndroidBack(() => 'map', vi.fn());
    expect(h.addListener).not.toHaveBeenCalled();
    off();
  });

  it('segue o grafo do viewBack: área → Mapa → Home', () => {
    let view: ViewType = 'area:jogos';
    const goBack = vi.fn(() => { view = view === 'map' ? 'home' : 'map'; });
    registerAndroidBack(() => view, goBack);
    expect(h.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));

    h.cb!();
    expect(goBack).toHaveBeenCalledTimes(1);
    expect(view).toBe('map');
    h.cb!();
    expect(goBack).toHaveBeenCalledTimes(2);
    expect(view).toBe('home');
    expect(h.minimizeApp).not.toHaveBeenCalled();
  });

  it('página do menu volta (para a Home) pelo mesmo goBack', () => {
    const goBack = vi.fn();
    registerAndroidBack(() => 'page:settings', goBack);
    h.cb!();
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('na Home devolve ao sistema (minimiza) em vez de travar', async () => {
    const goBack = vi.fn();
    registerAndroidBack(() => 'home', goBack);
    h.cb!();
    expect(goBack).not.toHaveBeenCalled();
    expect(h.minimizeApp).toHaveBeenCalledTimes(1);
  });

  it('se minimizar falhar, sai do app', async () => {
    h.minimizeApp.mockRejectedValue(new Error('x'));
    registerAndroidBack(() => 'home', vi.fn());
    h.cb!();
    await Promise.resolve(); await Promise.resolve();
    expect(h.exitApp).toHaveBeenCalledTimes(1);
  });

  it('a limpeza remove o listener (inclusive se chegar depois)', async () => {
    const off = registerAndroidBack(() => 'home', vi.fn());
    off();
    await Promise.resolve(); await Promise.resolve();
    expect(h.remove).toHaveBeenCalledTimes(1);
  });
});
