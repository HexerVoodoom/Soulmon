/**
 * O acervo de sprites: adoção, reversão e os dois terminais.
 *
 * A trava mais importante do arquivo é a última seção: **reverter e
 * re-sintonizar nunca decrementam teto** (gate, "Para o `alpha-frontend`"). Se
 * ela cair, o jogador paga de novo por uma arte que já está no save dele.
 */
import { describe, it, expect } from 'vitest';
import {
  emptySpriteLibrary, normalizeSpriteLibrary, recordSprite, recordFailure,
  displaySprite, hasSprite, tuneVisor, revertVisor, autoTuneDue, cardState,
  canManualRetry, isAccountCapped, isFormCapped,
  SPRITE_MANUAL_COOLDOWN_MS,
} from './spriteLibrary';

const entry = (formId: string) => ({ url: `https://cdn/${formId}.png`, formId, at: 1000 });
const ctx = (over = {}) => ({ generating: [] as string[], imminent: false, reachable: true, online: true, ...over });

describe('o piso: sem sprite próprio, o visor usa a reserva', () => {
  it('acervo vazio devolve null (e null NUNCA é erro — é o Invariante nº 1)', () => {
    expect(displaySprite(emptySpriteLibrary(), 'rookie')).toBeNull();
  });

  it('save corrompido/estranho não derruba nada', () => {
    expect(normalizeSpriteLibrary(null).sprites).toEqual({});
    expect(normalizeSpriteLibrary({ sprites: { rookie: { url: 42 } } }).sprites).toEqual({});
    expect(normalizeSpriteLibrary({ reverted: ['rookie', 7] }).reverted).toEqual(['rookie']);
  });
});

describe('adoção do sprite da forma ATUAL (§2.3.1)', () => {
  it('ocasião A adota na hora: no nascimento não há história a proteger', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'now' });
    expect(displaySprite(lib, 'rookie')?.url).toContain('rookie');
    expect(lib.pendingTune).toBeNull();
  });

  it('pós-cerimônia o sprite chega mas NÃO troca o rosto sozinho', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('champion-virus'), { adopt: 'ask', dayKey: '2026-08-25' });
    expect(hasSprite(lib, 'champion-virus')).toBe(true);
    expect(displaySprite(lib, 'champion-virus')).toBeNull();
    expect(cardState(lib, 'champion-virus', ctx())).toBe('A_SINTONIZAR');
  });

  it('"Sintonizar o Visor" adota, e o card volta a PRÓPRIO', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('champion-virus'), { adopt: 'ask', dayKey: '2026-08-25' });
    lib = tuneVisor(lib, 'champion-virus');
    expect(displaySprite(lib, 'champion-virus')).not.toBeNull();
    expect(cardState(lib, 'champion-virus', ctx())).toBe('PROPRIO');
  });

  it('"Voltar ao traço antigo" devolve a reserva sem apagar o sprite pago', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('champion-virus'), { adopt: 'now' });
    lib = revertVisor(lib, 'champion-virus');
    expect(displaySprite(lib, 'champion-virus')).toBeNull();
    expect(hasSprite(lib, 'champion-virus')).toBe(true);   // continua no save
    lib = tuneVisor(lib, 'champion-virus');
    expect(displaySprite(lib, 'champion-virus')).not.toBeNull();
  });

  it('a oferta expira numa virada de dia; o sprite, nunca', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('champion-virus'), { adopt: 'ask', dayKey: '2026-08-25' });
    expect(autoTuneDue(lib, '2026-08-25')).toBeNull();      // mesmo dia: espera o jogador
    expect(autoTuneDue(lib, '2026-08-26')).toBe('champion-virus');
    expect(autoTuneDue(tuneVisor(lib, 'champion-virus'), '2026-08-26')).toBeNull();
  });
});

describe('reverter e re-sintonizar NUNCA consomem teto', () => {
  it('nenhuma das três operações de adoção toca `failures`', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('mega-data'), { adopt: 'ask', dayKey: 'd1' });
    const before = JSON.stringify(lib.failures);
    lib = tuneVisor(lib, 'mega-data');
    lib = revertVisor(lib, 'mega-data');
    lib = tuneVisor(lib, 'mega-data');
    lib = revertVisor(lib, 'mega-data');
    expect(JSON.stringify(lib.failures)).toBe(before);
    expect(lib.failures).toEqual({});
    expect(hasSprite(lib, 'mega-data')).toBe(true);
  });

  it('reverter uma forma sem sprite próprio é no-op (não há o que devolver)', () => {
    const lib = revertVisor(emptySpriteLibrary(), 'rookie');
    expect(lib.reverted).toEqual([]);
  });
});

describe('409 ≠ 402 no acervo', () => {
  it('form-cap fecha UMA forma; a conta segue inteira', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'mega-data', 'form-cap');
    expect(isFormCapped(lib, 'mega-data')).toBe(true);
    expect(isFormCapped(lib, 'mega-virus')).toBe(false);
    expect(isAccountCapped(lib)).toBe(false);
    expect(cardState(lib, 'mega-data', ctx())).toBe('RESERVA_FINAL');
    expect(cardState(lib, 'mega-virus', ctx({ reachable: false }))).toBe('DISTANTE');
  });

  it('lifetime-cap fecha a conta: TODA forma sem sprite vira RESERVA_FINAL', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'mega-data', 'lifetime-cap');
    expect(isAccountCapped(lib)).toBe(true);
    expect(cardState(lib, 'ultra', ctx())).toBe('RESERVA_FINAL');
  });

  it('nem um nem outro oferecem "Tentar de novo" — botão que sempre falha é pior que botão ausente', () => {
    expect(canManualRetry(recordFailure(emptySpriteLibrary(), 'ultra', 'form-cap'), 'ultra')).toBe(false);
    expect(canManualRetry(recordFailure(emptySpriteLibrary(), 'ultra', 'lifetime-cap'), 'ultra')).toBe(false);
  });
});

describe('tentativas e cooldown', () => {
  it('offline não consome tentativa nenhuma — a chamada não aconteceu', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'offline', { at: 0 });
    expect(lib.failures.rookie.attempts).toBe(0);
  });

  it('o botão manual respeita cooldown de 60 s', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { manual: true, at: 0 });
    expect(canManualRetry(lib, 'rookie', 1_000)).toBe(false);
    expect(canManualRetry(lib, 'rookie', SPRITE_MANUAL_COOLDOWN_MS)).toBe(true);
  });

  it('esgotado o teto de tentativas da forma, o cliente para de bater na porta', () => {
    let lib = emptySpriteLibrary();
    for (let i = 0; i < 3; i++) lib = recordFailure(lib, 'rookie', 'error', { at: 0 });
    expect(canManualRetry(lib, 'rookie', 10 * SPRITE_MANUAL_COOLDOWN_MS)).toBe(false);
  });

  it('um sprite que chega limpa a falha anterior daquela forma', () => {
    let lib = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { at: 0 });
    lib = recordSprite(lib, entry('rookie'), { adopt: 'now' });
    expect(lib.failures.rookie).toBeUndefined();
  });
});

describe('estados de card (§2.2)', () => {
  it('GERANDO só enquanto o lote está vivo', () => {
    expect(cardState(emptySpriteLibrary(), 'rookie', ctx({ generating: ['rookie'] }))).toBe('GERANDO');
  });

  it('OFFLINE não é falha: some quando a conexão volta', () => {
    expect(cardState(emptySpriteLibrary(), 'rookie', ctx({ online: false }))).toBe('OFFLINE');
  });

  it('RESERVA vira RESERVA_VÉSPERA quando a evolução está iminente', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-data', 'error');
    expect(cardState(lib, 'champion-data', ctx())).toBe('RESERVA');
    expect(cardState(lib, 'champion-data', ctx({ imminent: true }))).toBe('RESERVA_VESPERA');
  });

  it('o selo NOVO some ao ver, mas o card A-SINTONIZAR manda', () => {
    const own = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'now' });
    expect(cardState(own, 'rookie', ctx({ unseen: true }))).toBe('NOVO');
    expect(cardState(own, 'rookie', ctx())).toBe('PROPRIO');
    const ask = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'ask', dayKey: 'd' });
    expect(cardState(ask, 'rookie', ctx({ unseen: true }))).toBe('A_SINTONIZAR');
  });
});
