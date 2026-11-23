// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { BlockedActionModal } from './BlockedActionModal';
import { explainBlocked, GO_TO_BUILDING_EVENT, type BlockedReason } from '../../utils/blockedAction';

afterEach(cleanup);

const recursos: BlockedReason = {
  kind: 'recursos',
  faltam: [{ namePt: 'Brasão', nameEn: 'Crest', have: 4, need: 5 }, { namePt: 'Minério', nameEn: 'Ore', have: 9, need: 2 }],
  fonte: [{ lugarPt: 'Salão da Guilda', lugarEn: 'Guild Hall', rota: 'hall.guilda' }],
};

describe('explainBlocked', () => {
  it('recursos: só os que faltam, com quantidade, PT e EN', () => {
    const pt = explainBlocked(recursos, true);
    expect(pt.title).toBe('Você não tem Brasão suficiente');
    expect(pt.lines).toEqual(['Brasão: tem 4, precisa de 5 (faltam 1)']);
    expect(pt.sources[0]).toMatchObject({ prefix: 'Este recurso pode ser obtido em', label: 'Salão da Guilda', rota: 'hall.guilda' });
    const en = explainBlocked(recursos, false);
    expect(en.title).toBe('You don’t have enough Crest');
    expect(en.sources[0].label).toBe('Guild Hall');
  });
  it('missão, energia, nível, espera e limite', () => {
    expect(explainBlocked({ kind: 'missao', n: 3 }, true).title).toBe('Complete mais 3 tarefas para poder fazer isso');
    expect(explainBlocked({ kind: 'missao', n: 1 }, false).title).toBe('Complete 1 more task to do this');
    const e = explainBlocked({ kind: 'energia', faltam: [{ namePt: 'Energia', nameEn: 'Energy', have: 1, need: 3 }] }, true);
    expect(e.title).toBe('Você não tem energia suficiente');
    expect(e.lines[0]).toBe('Energia: tem 1, precisa de 3 (faltam 2)');
    expect(explainBlocked({ kind: 'nivel', n: 5 }, true).title).toBe('Disponível a partir do nível 5');
    expect(explainBlocked({ kind: 'espera', n: 10 }, false).title).toBe('Come back in 10 min');
    expect(explainBlocked({ kind: 'limite' }, true).title).toBe('Você já chegou ao limite de hoje');
  });
});

describe('BlockedActionModal', () => {
  it('mostra o motivo, fecha com OK, e o lugar tocável pede a navegação e fecha', () => {
    const onClose = vi.fn();
    const { rerender } = render(<BlockedActionModal reason={recursos} onClose={onClose} language="pt-BR" />);
    const box = document.querySelector('[data-blocked-action="recursos"]')!;
    expect(box).not.toBeNull();
    expect(document.body.textContent).toMatch(/Você não tem Brasão suficiente/);
    act(() => { fireEvent.click(document.querySelector('[data-blocked-ok]')!); });
    expect(onClose).toHaveBeenCalledTimes(1);

    const ouvinte = vi.fn();
    window.addEventListener(GO_TO_BUILDING_EVENT, ouvinte);
    act(() => { fireEvent.click(document.querySelector('[data-blocked-go="hall.guilda"]')!); });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect((ouvinte.mock.calls[0][0] as CustomEvent).detail).toBe('hall.guilda');
    window.removeEventListener(GO_TO_BUILDING_EVENT, ouvinte);

    rerender(<BlockedActionModal reason={null} onClose={onClose} language="pt-BR" />);
    expect(document.querySelector('[data-blocked-action]')).toBeNull();
  });

  it('Esc fecha; inglês', () => {
    const onClose = vi.fn();
    render(<BlockedActionModal reason={{ kind: 'energia' }} onClose={onClose} language="en-US" />);
    expect(document.body.textContent).toMatch(/You don’t have enough energy/);
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(onClose).toHaveBeenCalled();
  });
});
