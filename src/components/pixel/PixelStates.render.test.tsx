// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss as render, computed } from '../../test/renderEnv';
import { PixelTabs, PixelChoiceChip, PixelSwitch, PixelTag, PixelMeter, PixelSlot } from './PixelKit';

/**
 * Os estados do kit, travados por teste e não por revisão visual.
 *
 * Herdado do G9: a seleção precisa morar numa propriedade que NÃO inverte
 * quando o tema inverte. No kit vetor (canvas Sistema, 16/09/2026) a seleção
 * é **classe + token**: `.sm2-kit-tab-on` (tinta `primary-ink` + sublinhado
 * ciano de 3px — a mesma pista da nav), `.sm2-kit-chip-on` (tonal:
 * `primary-soft` + borda `primary-ink` + check), `.sm2-kit-switch-on`
 * (trilho `primary-fill`). Os tokens `--sm2-primary-*` existem nos dois temas
 * com valores diferentes (`tokens.contrast.test.ts` cobra a paridade), então
 * a HIERARQUIA não depende de qual fundo é mais claro.
 *
 * O invariante: **exatamente UM item da fileira tem a classe de seleção, e
 * ele é o selecionado — independente de tema, hover ou foco.** jsdom não
 * resolve `color-mix`, mas enxerga a CLASSE e a declaração do token.
 */

const TABS = [
  { key: 'a' as const, label: 'Itens' },
  { key: 'b' as const, label: 'Cenários' },
  { key: 'c' as const, label: 'Missões' },
];

describe('PixelTabs — os 4 estados (G9)', () => {
  it('marca UMA aba como preenchida, e é a selecionada', () => {
    render(<PixelTabs items={TABS} value="b" onChange={() => {}} />);
    const abas = screen.getAllByRole('tab');
    const preenchidas = abas.filter(a => a.className.includes('sm2-kit-tab-on'));
    expect(preenchidas).toHaveLength(1);
    expect(preenchidas[0].textContent).toContain('Cenários');
  });

  it('as NÃO selecionadas não têm fill nenhum — o estado normal é vazio', () => {
    render(<PixelTabs items={TABS} value="b" onChange={() => {}} />);
    const outras = screen.getAllByRole('tab').filter(a => a.textContent !== 'Cenários');
    expect(outras).toHaveLength(2);
    for (const a of outras) expect(a.className).not.toContain('sm2-kit-tab-on');
  });

  it('o estado também existe fora da cor: aria-selected acompanha o fill', () => {
    render(<PixelTabs items={TABS} value="c" onChange={() => {}} />);
    const abas = screen.getAllByRole('tab');
    const marcadas = abas.filter(a => a.getAttribute('aria-selected') === 'true');
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0].className).toContain('sm2-kit-tab-on');
  });

  it('trocar a seleção move o fill — nunca acende duas', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PixelTabs items={TABS} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Missões'));
    expect(onChange).toHaveBeenCalledWith('c');
    rerender(<PixelTabs items={TABS} value="c" onChange={onChange} />);
    expect(screen.getAllByRole('tab').filter(a => a.className.includes('sm2-kit-tab-on'))).toHaveLength(1);
  });

  it('a seleção é sublinhado ciano de 3px, não placa — e a aba não tem borda/fundo', () => {
    render(<PixelTabs items={TABS} value="b" onChange={() => {}} />);
    const on = screen.getByRole('tab', { selected: true });
    expect(computed(on, 'color')).toBe('var(--sm2-primary-ink)');
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(computed(on, 'background-color'));
    // O sublinhado é `::after` — jsdom não computa pseudo-elementos; o que dá
    // para travar é que a aba NÃO carrega fill nem borda (uma barra não é uma
    // caixa — regra do dono, CLAUDE.md › UI).
    expect(computed(on, 'border-width')).not.toMatch(/^[1-9]/);
  });

  it('o rótulo da fileira chega ao tablist (leitor de tela)', () => {
    render(<PixelTabs items={TABS} value="a" onChange={() => {}} ariaLabel="Seções da loja" />);
    expect(screen.getByRole('tablist', { name: 'Seções da loja' })).toBeTruthy();
  });
});

describe('PixelChoiceChip — seleção múltipla', () => {
  it('só o chip selecionado é preenchido', () => {
    render(
      <>
        <PixelChoiceChip selected onToggle={() => {}}>Seg</PixelChoiceChip>
        <PixelChoiceChip selected={false} onToggle={() => {}}>Ter</PixelChoiceChip>
      </>,
    );
    expect(screen.getByText('Seg').className).toContain('sm2-kit-chip-on');
    expect(screen.getByText('Ter').className).not.toContain('sm2-kit-chip-on');
  });

  it('selecionado ganha o check (pista de forma além da cor); o de dia não', () => {
    const { container, rerender } = render(<PixelChoiceChip selected onToggle={() => {}}>Today</PixelChoiceChip>);
    expect(container.querySelector('.sm2-icon')).not.toBeNull();
    rerender(<PixelChoiceChip selected shape="day" onToggle={() => {}}>M</PixelChoiceChip>);
    expect(container.querySelector('.sm2-icon')).toBeNull();
  });

  it('é checkbox de verdade: o estado não vive só na cor', () => {
    render(<PixelChoiceChip selected onToggle={() => {}} ariaLabel="Segunda">Seg</PixelChoiceChip>);
    const chip = screen.getByRole('checkbox', { name: 'Segunda' });
    expect(chip.getAttribute('aria-checked')).toBe('true');
  });

  it('alvo de toque de 44px na variante de dia (a mais apertada)', () => {
    render(<PixelChoiceChip shape="day" selected={false} onToggle={() => {}}>Qua</PixelChoiceChip>);
    // O alvo vem de `.sm2-kit-chip` (min-height 44) + `.sm2-kit-chip-day`
    // (min-width 44). Medido do CSS real (footgun 1: classe ausente não
    // aplica nada, e ninguém percebe até virar screenshot).
    const chip = screen.getByText('Qua');
    expect(chip.className).toContain('sm2-kit-chip');
    expect(chip.className).toContain('sm2-kit-chip-day');
    expect(computed(chip, 'min-height')).toBe('44px');
    expect(computed(chip, 'min-width')).toBe('44px');
  });

  it('desabilitado não dispara', () => {
    const onToggle = vi.fn();
    render(<PixelChoiceChip selected={false} disabled onToggle={onToggle}>Sex</PixelChoiceChip>);
    fireEvent.click(screen.getByText('Sex'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('PixelSwitch', () => {
  it('ligado = preenchido, e o switch se anuncia', () => {
    render(<PixelSwitch checked onToggle={() => {}} ariaLabel="Participar do PvP" />);
    const sw = screen.getByRole('switch', { name: 'Participar do PvP' });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.className).toContain('sm2-kit-switch-on');
  });

  it('o alvo é 44 de altura mesmo com trilho de 32', () => {
    const { container } = render(<PixelSwitch checked={false} onToggle={() => {}} ariaLabel="x" />);
    expect(computed(screen.getByRole('switch'), 'height')).toBe('44px');
    expect(computed(container.querySelector('.sm2-kit-switch-track')!, 'height')).toBe('32px');
  });

  it('desligado não é preenchido', () => {
    render(<PixelSwitch checked={false} onToggle={() => {}} ariaLabel="Participar do PvP" />);
    expect(screen.getByRole('switch').className).not.toContain('sm2-kit-switch-on');
  });
});

describe('PixelTag', () => {
  it('etiqueta comum não é preenchida; a "filled" é', () => {
    render(
      <>
        <PixelTag>NPC</PixelTag>
        <PixelTag filled>Mega</PixelTag>
      </>,
    );
    expect(screen.getByText('NPC').className).not.toContain('sm2-kit-tag-on');
    expect(screen.getByText('Mega').className).toContain('sm2-kit-tag-on');
  });
});

describe('PixelMeter', () => {
  it('reporta a proporção em porcentagem e satura nas pontas', () => {
    const { rerender } = render(<PixelMeter ratio={0.42} label="Faixa" />);
    expect(screen.getByRole('progressbar', { name: 'Faixa' }).getAttribute('aria-valuenow')).toBe('42');
    rerender(<PixelMeter ratio={3} label="Faixa" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    rerender(<PixelMeter ratio={-1} label="Faixa" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('PixelMeter — nunca vermelho', () => {
  it('trilho `surface-2` + fronteira `muted`; tom "red" cai em cobre', () => {
    const { container } = render(<PixelMeter ratio={0.1} tone="red" label="HP" />);
    const meter = container.querySelector('.sm2-kit-meter') as HTMLElement;
    expect(computed(meter, 'background-color')).toBe('var(--sm2-surface-2)');
    // jsdom descarta `var()` em `border-color`; o que dá para medir é que a
    // fronteira EXISTE (1px sólida) — a cor (`--sm2-muted`, ≥ 3:1) é lida do
    // CSS cru pelo `tokens.contrast.test.ts`.
    expect(computed(meter, 'border-width')).toBe('1px');
    expect(computed(meter, 'border-style')).toBe('solid');
    expect(meter.style.getPropertyValue('--sm2-kit-tone')).toBe('var(--sm2-gold-fill)');
  });
});

describe('PixelSlot — o fallback é o quadro vazio, nunca o emoji', () => {
  it('sem arte, ainda desenha a casa (é ela que alinha a coluna de texto)', () => {
    const { container } = render(<PixelSlot />);
    const slot = container.querySelector('.sm2-kit-slot');
    expect(slot).toBeTruthy();
    expect(slot!.querySelector('img')).toBeNull();
    // E não escorregou nenhum texto/emoji para dentro do quadro.
    expect(slot!.textContent).toBe('');
  });

  it('com arte, renderiza a imagem dentro da casa', () => {
    const { container } = render(<PixelSlot src="/icone.png" />);
    expect(container.querySelector('.sm2-kit-slot img')).toBeTruthy();
  });
});

describe('T5 — paridade de tema no token de seleção', () => {
  it('o fill da seleção existe nos DOIS temas, e são valores diferentes', () => {
    // Este é o teste que impede o G9 de voltar por dentro do CSS. Não basta a
    // classe estar no elemento certo (os casos acima): o token que ela lê
    // precisa estar DECLARADO nos dois temas. Se `--sm2-primary-ink` sumisse
    // do bloco escuro, a aba selecionada herdaria o teal profundo do claro
    // sobre uma página escura — invisível, que é exatamente o defeito relatado.
    render(<div><span className="sm2-kit-tab sm2-kit-tab-on">X</span></div>);
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    const claro = getComputedStyle(root).getPropertyValue('--sm2-primary-ink').trim();
    root.setAttribute('data-theme', 'dark');
    const escuro = getComputedStyle(root).getPropertyValue('--sm2-primary-ink').trim();
    root.removeAttribute('data-theme');
    expect(claro).not.toBe('');
    expect(escuro).not.toBe('');
    expect(claro).not.toBe(escuro);
  });
});
