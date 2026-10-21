// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast }));

import { spriteFailText } from './spriteCopy';
import { AVISO_CONTA_NAO_PAGA, _resetAvisoContaNaoPaga, avisarContaNaoPaga } from './spriteGen';
import { UNLOCK_NEEDED_EVENT } from './unlockEvent';

afterEach(() => { toast.mockClear(); _resetAvisoContaNaoPaga(); });

/** QA (dono, 21/10/2026): a geração recusada por CONTA NÃO PAGA não pode ser muda — aviso calmo PT/EN + o desbloqueio existente. */
describe('conta não paga: o aviso', () => {
  it('o card do acervo diz o porquê nos dois idiomas (antes era null = mudo)', () => {
    expect(spriteFailText('paid-required', 'en-US')).toMatch(/full account/);
    expect(spriteFailText('paid-required', 'pt-BR')).toMatch(/conta completa/);
  });

  it('o aviso sai UMA vez por sessão e a ação pede o MESMO desbloqueio (evento que o App ouve)', () => {
    const visto = vi.fn();
    window.addEventListener(UNLOCK_NEEDED_EVENT, visto);
    expect(avisarContaNaoPaga()).toBe(true);
    expect(avisarContaNaoPaga()).toBe(false);
    expect(toast).toHaveBeenCalledTimes(1);
    const [texto, opcoes] = toast.mock.calls[0];
    expect(typeof texto).toBe('string');
    expect(opcoes.action.label).toBeTruthy();
    opcoes.action.onClick();
    expect(visto).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNLOCK_NEEDED_EVENT, visto);
  });

  it('o texto é calmo: sem culpa nem cobrança, e existe em PT e EN', () => {
    for (const t of [AVISO_CONTA_NAO_PAGA.en, AVISO_CONTA_NAO_PAGA['pt-BR']]) {
      expect(t).not.toMatch(/erro|falhou|error|failed|você precisa|you must|pague|pay now/i);
    }
  });
});
