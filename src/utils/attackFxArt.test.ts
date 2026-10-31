/**
 * O mapa de FX de ataque tem de ser ENCONTRÁVEL, não só cheio.
 *
 * Até 20/09/2026 o glob achava as 924 peças e a regex gravava cada uma sob a
 * chave errada (`ataque/fx-fogo:aura` em vez de `fogo:aura`): `ATTACK_FX_COUNT`
 * dizia 924 e `auraForElement('fogo')` devolvia `undefined` — a aura da Ficha
 * nunca foi desenhada, sem erro nenhum. Contar não prova nada; procurar prova.
 */
import { describe, it, expect } from 'vitest';
import { attackFx, auraForElement, ATTACK_FX_COUNT, AURA_96_COUNT, ATTACK_FX_STATES } from './attackFxArt';

describe('attackFxArt', () => {
  it('as 1680 peças estão no mapa (280 elementos × 6 estados)', () => {
    expect(ATTACK_FX_COUNT).toBe(1680);
  });

  it('todo elemento BASE tem os 6 estados encontráveis pela chave `<id>:<estado>`', () => {
    for (const id of ['fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz',
      'vileza', 'morte', 'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco']) {
      for (const estado of ATTACK_FX_STATES) {
        expect(attackFx(id, estado), `${id}:${estado}`).toMatch(/fx-[a-z_]+-[a-z]+\.png$/);
      }
    }
  });

  it('derivado com underscore no id também é encontrável', () => {
    expect(attackFx('aco_voltaico', 'aura')).toBeTruthy();
  });

  it('auraForElement: elemento do oráculo → aura; planta/industrial têm aura própria', () => {
    expect(auraForElement('fogo')).toMatch(/fx-fogo-aura/);
    expect(auraForElement('planta')).toMatch(/fx-planta-aura/);
    expect(auraForElement('industrial')).toMatch(/fx-industrial-aura/);
    expect(auraForElement(undefined)).toBeUndefined();
    expect(auraForElement('elemento-que-nao-existe')).toBeUndefined();
  });

  it('R2-3: uma aura 96² por elemento com `-aura.png` (280), separada do mapa 128² e servida por `size: 96`', () => {
    expect(AURA_96_COUNT).toBe(280);
    expect(ATTACK_FX_COUNT).toBe(1680); // a -aura-96 NÃO entra como 7º estado
    expect(auraForElement('fogo', 96)).toMatch(/fx-fogo-aura-96\.png$/);
    expect(auraForElement('planta', 96)).toMatch(/fx-planta-aura-96\.png$/);
    expect(auraForElement('fogo', 128)).toMatch(/fx-fogo-aura\.png$/);
    expect(auraForElement('fogo')).toMatch(/fx-fogo-aura\.png$/);
  });
});
