import { describe, it, expect } from 'vitest';
import { parseUiSkin, DEFAULT_UI_SKIN, UI_SKIN_OPTION_ENABLED } from './uiSkin';

describe('uiSkin', () => {
  it('padrão é arte; valores válidos passam', () => {
    expect(DEFAULT_UI_SKIN).toBe('arte');
    expect(parseUiSkin('arte')).toBe('arte');
    expect(parseUiSkin('minimal')).toBe('minimal');
  });
  it('ausente, inválido ou de tipo estranho vira arte', () => {
    for (const v of [null, undefined, '', 'Minimal', 'win98', 1, {}, true]) expect(parseUiSkin(v)).toBe('arte');
  });
  it('a opção em Configurações está desligada até a fase 2', () => {
    expect(UI_SKIN_OPTION_ENABLED).toBe(false);
  });
});
