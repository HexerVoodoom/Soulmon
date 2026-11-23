// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FormasAlternativasSheet } from './FormasAlternativasSheet';

const base = {
  isPt: true, formId: 'ultimate-power', nomeDaForma: 'Poder',
  itens: [{ elemento: 'fogo' }, { elemento: 'sabbat' }],
  formasAlt: { 'ultimate-power': ['fogo', 'sabbat'] }, equipada: 'fogo', onEquip: () => {}, onClose: () => {},
};

describe('FormasAlternativasSheet: forma de OUTRA linha (mesmo nível)', () => {
  it('fora da forma atual o botão é "Trocar forma" e nenhuma variante aparece como EQUIPADA', () => {
    const { getAllByRole, queryByText } = render(<FormasAlternativasSheet {...base} ehAtual={false} />);
    expect(getAllByRole('button', { name: 'Trocar forma' })).toHaveLength(2);
    expect(queryByText('EQUIPADA')).toBeNull();
  });
  it('na forma atual segue "Equipar" / EQUIPADA', () => {
    const { getAllByRole, getByText } = render(<FormasAlternativasSheet {...base} />);
    expect(getAllByRole('button', { name: 'Equipar' })).toHaveLength(1);
    expect(getByText('EQUIPADA')).toBeTruthy();
  });
});
