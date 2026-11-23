// @vitest-environment jsdom
/** Aviso do Conjunto Fundador (23/11/2026, PR 2/2): render (4 de uma vez; marco único), equipar e idempotência do estado `fundadorAvisados`. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { FundadorAvisoModal } from './FundadorAvisoModal';
import { FUNDADOR_PREMIOS, concederFundador, fundadorPendentes, marcarFundadorAvisados, registrarDiaComTarefa, sanitizeFundadorAvisados } from '../utils/fundador';

installDomGlobals();
afterEach(cleanup);

describe('FundadorAvisoModal', () => {
  it('conta existente: UM popup com os 4, só Fechar', () => {
    const onClose = vi.fn(); const onEquip = vi.fn();
    render(<FundadorAvisoModal language="pt-BR" premios={[...FUNDADOR_PREMIOS]} dias={0} onClose={onClose} onEquip={onEquip} />);
    expect(document.querySelectorAll('[data-fundador-aviso]').length).toBe(1);
    expect(document.querySelectorAll('[data-fundador-arte]').length).toBe(4);
    const txt = document.body.textContent ?? '';
    for (const n of ['Fundo Fundador', 'Moldura Fundadora', 'Retrato Fundador', 'Cristal Fundador']) expect(txt).toContain(n);
    expect(document.querySelector('[data-fundador-equip]')).toBeNull();
    fireEvent.click(document.querySelector('[data-fundador-close]')!);
    expect(onClose).toHaveBeenCalled();
  });
  it('marco novo (1 dia): fundo com frase, Equipar chama onEquip', () => {
    const onEquip = vi.fn();
    render(<FundadorAvisoModal language="en-US" premios={['founder-fundo']} dias={1} onClose={() => {}} onEquip={onEquip} />);
    expect(document.body.textContent).toContain('Founder Background');
    expect(document.body.textContent).toContain('Earned by consistency: 1 day.');
    fireEvent.click(document.querySelector('[data-fundador-equip]')!);
    expect(onEquip).toHaveBeenCalledWith('founder-fundo');
  });
  it('Cristal (5 dias): sem Equipar', () => {
    render(<FundadorAvisoModal language="pt-BR" premios={['furn-cristal-fundador']} dias={5} onClose={() => {}} onEquip={() => {}} />);
    expect(document.querySelector('[data-fundador-equip]')).toBeNull();
    expect(document.body.textContent).toContain('Ganho por constância: 5 dias.');
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
