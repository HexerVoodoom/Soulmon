// @vitest-environment jsdom
/** P2/BL3: 5º campo "O que importa hoje", escrita livre em botão largo e prefixo fixo da gratidão. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CadernoSheet } from './CadernoSheet';
import { addEntry, normalizeEntries, CADERNO_CARDS, type CadernoEntry } from '../../utils/cadernoLocal';

afterEach(cleanup);

function montar(language: 'pt-BR' | 'en-US' = 'pt-BR') {
  let lista: CadernoEntry[] = [];
  const onChange = vi.fn((f: (c: CadernoEntry[]) => CadernoEntry[]) => { lista = f(lista); });
  const { container } = render(<CadernoSheet language={language} todayKey="2026-11-23" entries={[]} onChange={onChange} />);
  return { container, onChange, get lista() { return lista; } };
}

describe('Caderno: cinco campos', () => {
  it('a grade tem 4 cards e a escrita livre é um botão largo à parte', () => {
    const { container } = montar();
    const grupo = container.querySelector('[role="radiogroup"]')!;
    expect(CADERNO_CARDS).toHaveLength(4);
    expect(screen.getByText('O que importa hoje')).toBeTruthy();
    const livre = grupo.querySelector('[data-caderno-livre]') as HTMLElement;
    expect(livre.style.gridColumn).toBe('1 / -1');
    expect(livre.textContent).toBe('Escrita livre');
  });

  it('"O que importa hoje" mostra as perguntas-guia e guarda a entrada', () => {
    const m = montar();
    fireEvent.click(screen.getByText('O que importa hoje'));
    expect(m.container.querySelector('[data-caderno-guia]')!.querySelectorAll('li')).toHaveLength(3);
    fireEvent.change(m.container.querySelector('[data-caderno-texto]')!, { target: { value: 'ligar para minha mãe' } });
    fireEvent.click(m.container.querySelector('[data-caderno-guardar]')!);
    expect(m.lista[0].formato).toBe('importa');
  });

  it('gratidão: prefixo fixo em turquesa, fora do campo editável, e vai junto no texto guardado', () => {
    const m = montar();
    fireEvent.click(screen.getByText('Gratidão'));
    const prefixo = m.container.querySelector('[data-caderno-prefixo]') as HTMLElement;
    expect(prefixo.textContent).toBe('Eu sou grato por');
    expect(prefixo.style.color).toBe('var(--sm2-primary-ink)');
    const campo = m.container.querySelector('[data-caderno-texto]') as HTMLTextAreaElement;
    expect(campo.value).toBe('');
    expect((m.container.querySelector('[data-caderno-guardar]') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(campo, { target: { value: 'um dia de sol' } });
    fireEvent.click(m.container.querySelector('[data-caderno-guardar]')!);
    expect(m.lista[0].text).toBe('Eu sou grato por um dia de sol');
  });

  it('EN: prefixo e rótulos em inglês', () => {
    const m = montar('en-US');
    fireEvent.click(screen.getByText('Gratitude'));
    expect(m.container.querySelector('[data-caderno-prefixo]')!.textContent).toBe('I am grateful for');
    expect(screen.getByText('What matters today')).toBeTruthy();
  });

  it('save antigo segue valendo e o formato novo é aceito pela higienização', () => {
    const velho = { id: 'a1', day: '2026-10-04', formato: 'livre', text: 'oi', at: 5 };
    expect(normalizeEntries([velho, { ...velho, id: 'b2', formato: 'importa' }])).toHaveLength(2);
    expect(addEntry([], '2026-11-23', 'importa', 'x', 1)[0].formato).toBe('importa');
  });
});
