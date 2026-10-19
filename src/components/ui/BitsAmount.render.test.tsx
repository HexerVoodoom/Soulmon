// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BitsAmount } from './BitsAmount';
import { RewardLine } from './RewardLine';
import { CurrencyPills } from '../mercado/MercadoSheets';
import { bitsStyle, EMBLEM_COLOR, CREDIT_COLOR } from '../../utils/currencies';

afterEach(cleanup);

describe('BitsAmount — Bits sempre com ícone (D-62, REGISTRO §105)', () => {
  it('ícone da moeda + número em mono primary-ink; "Bits" só para leitor de tela', () => {
    const { container } = render(<BitsAmount value={12} sign="+" />);
    const root = container.querySelector('[data-bits-amount]') as HTMLElement;
    expect(root.querySelector('[data-bits-kind]')).not.toBeNull();
    expect(root.querySelector('.sm2-icon')).toBeNull();
    expect(root.style.fontFamily).toBe('var(--sm2-font-mono)');
    expect(root.style.color).toBe('var(--sm2-primary-ink)');
    expect(root.textContent).toBe('+12 Bits');
    const sr = root.querySelector('.sm2-sr-only') as HTMLElement;
    expect(sr.textContent?.trim()).toBe('Bits');
    // o ícone é decorativo: o nome vem do texto
    expect(root.querySelector('[data-bits-kind]')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('sem saldo (dim) esmaece; `unit` troca o texto de leitor de tela', () => {
    const { container } = render(<BitsAmount value={3} dim unit="Bits por rodada" />);
    const root = container.querySelector('[data-bits-amount]') as HTMLElement;
    expect(root.style.color).toBe('var(--sm2-muted)');
    expect(root.textContent).toContain('Bits por rodada');
  });
});

describe('RewardLine — recompensa em ícones (D-71)', () => {
  it('Bits, energia e coração com ícone e nome em texto; zero some', () => {
    const { container } = render(<RewardLine bits={4} energy={1} hearts={0} language="en-US" />);
    expect(container.querySelector('[data-bits-amount]')).not.toBeNull();
    expect(container.querySelector('[data-reward="energy"] .sm2-icon')).not.toBeNull();
    expect(container.querySelector('[data-reward="hearts"]')).toBeNull();
    expect(container.textContent).toContain('+4 Bits');
    expect(container.textContent).toContain('+1energy');
  });

  it('PT: coração e energia', () => {
    const { container } = render(<RewardLine bits={2} energy={1} hearts={1} language="pt-BR" />);
    expect(container.textContent).toContain('energia');
    expect(container.textContent).toContain('coração');
  });
});

describe('as três moedas nunca se misturam (D-25)', () => {
  it('pílulas: Bits com a moeda própria, Honor com a medalha dourada — ícones e tintas diferentes', () => {
    const picked: string[] = [];
    render(<CurrencyPills tabs={['bits', 'emblems']} value="bits" onChange={c => picked.push(c)} isPt={false} />);
    const bits = screen.getByRole('tab', { name: 'Bits' });
    const honor = screen.getByRole('tab', { name: 'Honor' });
    expect(bits.getAttribute('aria-selected')).toBe('true');
    expect(honor.getAttribute('aria-selected')).toBe('false');
    expect(bits.querySelector('[data-bits-kind]')).not.toBeNull();
    expect(bits.querySelector('.sm2-icon')).toBeNull();
    expect(honor.querySelector('[data-bits-kind]')).toBeNull();
    expect(honor.querySelector('.sm2-icon')).not.toBeNull();
    fireEvent.click(honor);
    expect(picked).toEqual(['emblems']);
  });

  it('a tinta de cada moeda é própria', () => {
    const cores = new Set([bitsStyle.color, EMBLEM_COLOR, CREDIT_COLOR]);
    expect(cores.size).toBe(3);
  });
});

// Contrato: nenhum componente desenha "N Bits" como texto de valor — Bits passam pelo `BitsAmount`.
// Prosa (frases com verbo, ajuda, avisos, aria-label) fica de fora de propósito.
describe('Bits sempre pelo componente', () => {
  function tsx(dir: string, out: string[] = []): string[] {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) tsx(p, out);
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p);
    }
    return out;
  }
  const VALOR = [
    /`\+\$\{[^}]+\} Bits`/,                  // `+${n} Bits`
    />\s*\+?\{[A-Za-z_.()]+\} Bits\s*</,       // >{n} Bits<
    /\+\{[A-Za-z_.()]+\} Bits\s*</,            // +{n} Bits<
  ];
  it('nenhum valor de Bits escrito como texto em componente', () => {
    const achados: string[] = [];
    for (const f of tsx('src/components')) {
      readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
        if (VALOR.some(r => r.test(l))) achados.push(`${f}:${i + 1}`);
      });
    }
    expect(achados).toEqual([]);
  });
});
