// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss as render, computed } from '../../test/renderEnv';
import { PixelTabs, PixelChoiceChip, PixelSwitch, PixelTag, PixelMeter, PixelSlot } from './PixelKit';

/**
 * G9 travado por teste, não por revisão visual.
 *
 * O defeito da análise de gap era: *"no tema claro a aba inativa parece a
 * selecionada, e no escuro inverte"*. A causa não era a cor escolhida — era
 * **qual propriedade carregava a seleção**. Enquanto a seleção morar em cor de
 * texto ou sublinhado, ela é uma comparação relativa, e comparação relativa
 * inverte quando o fundo inverte.
 *
 * O invariante que estes testes travam é o que impede a regressão:
 *
 *   **exatamente UM item da fileira tem a classe de preenchimento, e ele é o
 *   selecionado — independente de tema, hover ou foco.**
 *
 * Um teste de unidade não enxerga cor computada (jsdom não resolve
 * `color-mix`). Mas ele enxerga a CLASSE, e é a classe que decide o fill nos
 * dois temas: `.sm-px-tab-on` / `.sm-px-chip-on` / `.sm-px-switch-on`. Travar a
 * classe cobre o defeito inteiro, porque o tema só troca o VALOR do token
 * `--sm-px-sel-bg`, nunca quem o recebe.
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
    const preenchidas = abas.filter(a => a.className.includes('sm-px-tab-on'));
    expect(preenchidas).toHaveLength(1);
    expect(preenchidas[0].textContent).toContain('Cenários');
  });

  it('as NÃO selecionadas não têm fill nenhum — o estado normal é vazio', () => {
    render(<PixelTabs items={TABS} value="b" onChange={() => {}} />);
    const outras = screen.getAllByRole('tab').filter(a => a.textContent !== 'Cenários');
    expect(outras).toHaveLength(2);
    for (const a of outras) expect(a.className).not.toContain('sm-px-tab-on');
  });

  it('o estado também existe fora da cor: aria-selected acompanha o fill', () => {
    render(<PixelTabs items={TABS} value="c" onChange={() => {}} />);
    const abas = screen.getAllByRole('tab');
    const marcadas = abas.filter(a => a.getAttribute('aria-selected') === 'true');
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0].className).toContain('sm-px-tab-on');
  });

  it('trocar a seleção move o fill — nunca acende duas', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PixelTabs items={TABS} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Missões'));
    expect(onChange).toHaveBeenCalledWith('c');
    rerender(<PixelTabs items={TABS} value="c" onChange={onChange} />);
    expect(screen.getAllByRole('tab').filter(a => a.className.includes('sm-px-tab-on'))).toHaveLength(1);
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
    expect(screen.getByText('Seg').className).toContain('sm-px-chip-on');
    expect(screen.getByText('Ter').className).not.toContain('sm-px-chip-on');
  });

  it('é checkbox de verdade: o estado não vive só na cor', () => {
    render(<PixelChoiceChip selected onToggle={() => {}} ariaLabel="Segunda">Seg</PixelChoiceChip>);
    const chip = screen.getByRole('checkbox', { name: 'Segunda' });
    expect(chip.getAttribute('aria-checked')).toBe('true');
  });

  it('alvo de toque de 44px na variante de dia (a mais apertada)', () => {
    render(<PixelChoiceChip shape="day" selected={false} onToggle={() => {}}>Qua</PixelChoiceChip>);
    // O tamanho vem de `.sm-px-chip-btn` (min-height 44) + `.sm-px-chip-day`;
    // aqui travamos que as DUAS classes estão presentes — sem `sm-px-chip-btn`
    // o chip de dia herdaria altura de texto (footgun 1: classe ausente não
    // aplica nada, e ninguém percebe até virar screenshot).
    const chip = screen.getByText('Qua');
    expect(chip.className).toContain('sm-px-chip-btn');
    expect(chip.className).toContain('sm-px-chip-day');
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
    expect(sw.className).toContain('sm-px-switch-on');
  });

  it('desligado não é preenchido', () => {
    render(<PixelSwitch checked={false} onToggle={() => {}} ariaLabel="Participar do PvP" />);
    expect(screen.getByRole('switch').className).not.toContain('sm-px-switch-on');
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
    expect(screen.getByText('NPC').className).not.toContain('sm-px-tag-on');
    expect(screen.getByText('Mega').className).toContain('sm-px-tag-on');
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

describe('PixelSlot — o fallback é o quadro vazio, nunca o emoji', () => {
  it('sem arte, ainda desenha a casa (é ela que alinha a coluna de texto)', () => {
    const { container } = render(<PixelSlot />);
    const slot = container.querySelector('.sm-px-slot');
    expect(slot).toBeTruthy();
    expect(slot!.querySelector('img')).toBeNull();
    // E não escorregou nenhum texto/emoji para dentro do quadro.
    expect(slot!.textContent).toBe('');
  });

  it('com arte, renderiza a imagem dentro da casa', () => {
    const { container } = render(<PixelSlot src="/icone.png" />);
    expect(container.querySelector('.sm-px-slot img')).toBeTruthy();
  });
});

describe('T5 — paridade de tema no token de selecao', () => {
  it('o fill da selecao existe nos DOIS temas, e sao valores diferentes', () => {
    // Este e o teste que impede o G9 de voltar por dentro do CSS. Nao basta a
    // classe estar no elemento certo (os casos acima): o token que ela le
    // precisa estar DECLARADO nos dois temas. Se o token sumisse do
    // bloco escuro, a aba selecionada herdaria o teal profundo do claro sobre
    // uma pagina escura — invisivel, que e exatamente o defeito relatado.
    const { container } = render(<div><span className="sm-px-tab sm-px-tab-on">X</span></div>);
    document.documentElement.removeAttribute('data-theme');
    const claro = computed(container.firstElementChild!, 'background-color')
      || getComputedStyle(document.documentElement).getPropertyValue('--sm-px-sel-bg').trim();
    document.documentElement.setAttribute('data-theme', 'dark');
    const escuro = getComputedStyle(document.documentElement).getPropertyValue('--sm-px-sel-bg').trim();
    document.documentElement.removeAttribute('data-theme');
    expect(claro).not.toBe('');
    expect(escuro).not.toBe('');
    expect(claro).not.toBe(escuro);
  });
});
