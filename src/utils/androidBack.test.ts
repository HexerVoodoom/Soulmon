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
import { pushBackLayer } from './backStack';

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

  it('na Home NÃO faz nada: não minimiza, não sai, não navega', async () => {
    const goBack = vi.fn();
    registerAndroidBack(() => 'home', goBack);
    h.cb!();
    await Promise.resolve();
    expect(goBack).not.toHaveBeenCalled();
    expect(h.minimizeApp).not.toHaveBeenCalled();
    expect(h.exitApp).not.toHaveBeenCalled();
  });

  it('com uma camada aberta (folha/jogo) fecha só ela; a tela não muda', () => {
    const goBack = vi.fn();
    const fecha = vi.fn();
    const off = pushBackLayer(fecha);
    registerAndroidBack(() => 'area:arena', goBack);
    h.cb!();
    expect(fecha).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
    off();
    h.cb!();
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('a camada mais recente fecha primeiro', () => {
    const ordem: string[] = [];
    const off1 = pushBackLayer(() => ordem.push('folha'));
    const off2 = pushBackLayer(() => ordem.push('jogo'));
    registerAndroidBack(() => 'area:arena', vi.fn());
    h.cb!();
    expect(ordem).toEqual(['jogo']);
    off2(); off1();
  });

  it('a limpeza remove o listener (inclusive se chegar depois)', async () => {
    const off = registerAndroidBack(() => 'home', vi.fn());
    off();
    await Promise.resolve(); await Promise.resolve();
    expect(h.remove).toHaveBeenCalledTimes(1);
  });
});
