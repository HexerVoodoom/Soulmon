import { describe, it, expect } from 'vitest';
import { AREAS, areaOf, areaView, menuPageOf, viewBack, areaLabel, areaHint, menuPageLabel, MENU_PAGES } from './navigation';

describe('navigation — o grafo do voltar (um só para tela, navegador e Android)', () => {
  it('área → Mapa → Home; na Home o voltar é do sistema', () => {
    for (const id of AREAS) expect(viewBack(areaView(id))).toBe('map');
    expect(viewBack('map')).toBe('home');
    expect(viewBack('home')).toBeNull();
  });

  it('páginas do menu voltam para a Home, não para o Mapa', () => {
    for (const p of MENU_PAGES) expect(viewBack(`page:${p}`)).toBe('home');
  });

  it('areaOf / menuPageOf reconhecem só o que existe', () => {
    expect(areaOf('area:hall')).toBe('hall');
    expect(areaOf('map')).toBeNull();
    expect(areaOf('area:loja' as never)).toBeNull();
    expect(menuPageOf('page:oracle')).toBe('oracle');
    expect(menuPageOf('area:hall')).toBeNull();
  });

  it('todo texto de navegação tem par PT/EN não vazio', () => {
    for (const id of AREAS) {
      for (const pt of [true, false]) {
        expect(areaLabel(id, pt).length).toBeGreaterThan(1);
        expect(areaHint(id, pt).length).toBeGreaterThan(1);
      }
      expect(areaHint(id, true)).not.toBe(areaHint(id, false));
    }
    for (const p of MENU_PAGES) expect(menuPageLabel(p, true)).not.toBe(menuPageLabel(p, false));
  });
});
