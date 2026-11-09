// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import { FormasAlternativasSheet } from './FormasAlternativasSheet';

describe('FormasAlternativasSheet: nome da variante', () => {
  it('negrito = nome da forma (+ elemento nas variantes); embaixo, ícone + nome do elemento', () => {
    const { getByTestId } = render(
      <FormasAlternativasSheet isPt formId="rookie" nomeDaForma="Pyraka" itens={[{ elemento: '__atual' }, { elemento: 'fogo' }]}
        formasAlt={undefined} equipada="__atual" onEquip={() => {}} onClose={() => {}} />,
    );
    const orig = getByTestId('sm-forma-alt-__atual');
    expect(within(orig).getByTestId('sm-forma-alt-nome').textContent).toBe('Pyraka');
    expect(within(orig).getByTestId('sm-forma-alt-nome').style.fontWeight).toBe('700');
    const alt = getByTestId('sm-forma-alt-fogo');
    const nome = within(alt).getByTestId('sm-forma-alt-nome').textContent!;
    const el = within(alt).getByTestId('sm-forma-alt-elemento').textContent!;
    expect(nome).toBe(`Pyraka ${el}`);
    expect(el.length).toBeGreaterThan(0);
  });
});
