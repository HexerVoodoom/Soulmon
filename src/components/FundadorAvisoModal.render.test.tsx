// @vitest-environment jsdom
/** Aviso do Conjunto Fundador (23/11/2026, PR 2/2): render (4 de uma vez; marco único), equipar e idempotência do estado `fundadorAvisados`. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { FundadorAvisoModal } from './FundadorAvisoModal';
import { FUNDADOR_PREMIOS, concederFundador, fundadorPendentes, marcarFundadorAvisados, registrarDiaComTarefa, sanitizeFundadorAvisados } from '../utils/fundador';

installDomGlobals();
afterEach(cleanup);

describe('FundadorAvisoModal (um por prêmio)', () => {
  const casos: Array<[string, string, string, number, boolean]> = [
    ['founder-fundo', 'Fundo Fundador', 'Ganho por constância: 1 dia.', 1, true],
    ['founder-moldura', 'Moldura Fundadora', 'Ganho por constância: 2 dias.', 2, true],
    ['founder-retrato', 'Retrato Fundador', 'Ganho por constância: 3 dias.', 3, true],
    ['furn-cristal-fundador', 'Cristal Fundador', 'Ganho por constância: 5 dias.', 5, false],
  ];
  for (const [id, nome, frase, , equipa] of casos) {
    it(`${id}: arte, nome PT, frase e ${equipa ? 'Equipar + ✕' : 'só o ✕, sem rodapé'}`, () => {
      const onClose = vi.fn(); const onEquip = vi.fn();
      render(<FundadorAvisoModal language="pt-BR" premio={id} onClose={onClose} onEquip={onEquip} />);
      expect(document.querySelectorAll('[data-fundador-arte]').length).toBe(1);
      expect(document.body.textContent).toContain(nome);
      expect(document.body.textContent).toContain(frase);
      expect(!!document.querySelector('[data-fundador-equip]')).toBe(equipa);
      if (equipa) { fireEvent.click(document.querySelector('[data-fundador-equip]')!); expect(onEquip).toHaveBeenCalledWith(id); }
      expect(document.querySelector('[data-fundador-close]')).toBeNull(); // sem botão Close no rodapé
      expect(Array.from(document.querySelectorAll('button')).some(b => /^(Fechar|Close)$/.test(b.textContent?.trim() ?? ''))).toBe(false);
      fireEvent.click(document.querySelector('.sm2-popup-fechar')!);
      expect(onClose).toHaveBeenCalled();
    });
  }
  it('Cristal: nenhum botão de rodapé (só o ✕ no topo)', () => {
    render(<FundadorAvisoModal language="pt-BR" premio="furn-cristal-fundador" onClose={() => {}} onEquip={() => {}} />);
    const botoes = Array.from(document.querySelectorAll('button'));
    expect(botoes.length).toBe(1);
    expect(botoes[0].classList.contains('sm2-popup-fechar')).toBe(true);
  });
  it('EN: nome e frase em inglês', () => {
    render(<FundadorAvisoModal language="en-US" premio="founder-fundo" onClose={() => {}} onEquip={() => {}} />);
    expect(document.body.textContent).toContain('Founder Background');
    expect(document.body.textContent).toContain('Earned by consistency: 1 day.');
  });
});

describe('fundadorAvisados (idempotência)', () => {
  it('conta existente: 4 pendentes; depois de marcar, 2ª carga não repete', () => {
    const s0 = concederFundador({ evolutionStage: 'rookie' } as never) as { fundadorPremios: string[]; fundadorAvisados?: string[] };
    expect(fundadorPendentes(s0)).toEqual([...FUNDADOR_PREMIOS]);
    const s1 = marcarFundadorAvisados(s0, fundadorPendentes(s0));
    expect(fundadorPendentes(s1)).toEqual([]);
    expect(marcarFundadorAvisados(s1, [...FUNDADOR_PREMIOS])).toBe(s1);
    expect(fundadorPendentes(concederFundador(s1))).toEqual([]);
  });
  it('conta nova: cada marco gera um pendente novo', () => {
    let s: { fundadorPremios?: string[]; fundadorAvisados?: string[] } = { fundadorPremios: [] };
    s = registrarDiaComTarefa(s, new Date('2026-11-23T12:00:00Z'));
    expect(fundadorPendentes(s)).toEqual(['founder-fundo']);
    s = marcarFundadorAvisados(s, ['founder-fundo']);
    s = registrarDiaComTarefa(s, new Date('2026-11-24T12:00:00Z'));
    expect(fundadorPendentes(s)).toEqual(['founder-moldura']);
  });
  it('leitura tolerante', () => {
    expect(sanitizeFundadorAvisados(undefined)).toEqual([]);
    expect(sanitizeFundadorAvisados(['x', 'founder-retrato', 3])).toEqual(['founder-retrato']);
  });
});
