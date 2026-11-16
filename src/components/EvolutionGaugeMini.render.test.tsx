// @vitest-environment jsdom
/**
 * 🧬 O gauge compacto da Home (11/10/2026): descreve, nunca cobra; PT e EN.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
afterEach(() => cleanup());
import { EvolutionGaugeMini } from './EvolutionGaugeMini';

/** 13/11/2026: o termo "fragmento de alma" sai destacado (`SoulFragmentTerm`), então a frase se divide em nós: casa pelo texto inteiro. */
const textoInteiro = (t: string) => (_: string, el: Element | null) => !!el && el.textContent === t && Array.from(el.children).every(c => c.textContent !== t);


describe('EvolutionGaugeMini', () => {
  it('EN: rótulo, contagem, prévia de hoje e progressbar com os números do gauge', () => {
    render(<EvolutionGaugeMini language="en-US" evolutionPoints={12} evolutionStage="rookie" todayWeight={2} />);
    expect(screen.getByText(textoInteiro('Soul Fragments gathered'))).toBeTruthy();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuemax')).toBe('30');
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(document.querySelector('[data-evo-gauge-mini-count]')?.textContent).toBe('12/30 · +2 today');
  });

  it('PT: cheio diz que a forma está pronta (sem número de falta)', () => {
    render(<EvolutionGaugeMini language="pt-BR" evolutionPoints={45} evolutionStage="champion-power" todayWeight={3} />);
    expect(screen.getByText('A próxima forma está pronta')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-mini-count]')?.textContent).toBe('45/45');
  });

  it('no topo (ultra) não há barra', () => {
    const { container } = render(<EvolutionGaugeMini language="en-US" evolutionPoints={10} evolutionStage="ultra" todayWeight={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('o texto nunca cobra: sem "only", "left", "faltam", "só"', () => {
    const { container } = render(<EvolutionGaugeMini language="pt-BR" evolutionPoints={1} evolutionStage="rookie" todayWeight={0} />);
    const t = container.textContent ?? '';
    expect(t).not.toMatch(/\bonly\b|\bleft\b|faltam|\bsó\b/i);
  });

  it('16/11/2026: mega com menos de 3 megas não mostra barra, diz quantas megas já vieram (PT/EN, sem cobrança)', () => {
    const pt = render(<EvolutionGaugeMini language="pt-BR" evolutionPoints={200} evolutionStage="mega-power" unlockedEvolutions={['mega-power', 'mega-harmony']} todayWeight={6} />);
    expect(pt.container.textContent).toBe('Libere as 3 Megas para abrir o Ultra · 2/3');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(pt.container.textContent).not.toMatch(/faltam|só|perde/i);
    cleanup();
    const en = render(<EvolutionGaugeMini language="en-US" evolutionPoints={0} evolutionStage="mega-power" todayWeight={0} />);
    expect(en.container.textContent).toBe('Unlock all 3 Megas to open the Ultra · 0/3');
    cleanup();
    render(<EvolutionGaugeMini language="en-US" evolutionPoints={10} evolutionStage="mega-power" unlockedEvolutions={['mega-power', 'mega-harmony', 'mega-benevolence']} todayWeight={0} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('270');
  });
});
