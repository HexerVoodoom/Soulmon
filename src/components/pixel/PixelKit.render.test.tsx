// @vitest-environment jsdom
/**
 * Testes de RENDER dos primitivos do kit pixel.
 *
 * Estes primitivos são o novo ponto único por onde passam a ação central do app
 * (marcar concluído) e o alvo de toque de quase toda tela. Antes desta rodada
 * eles não tinham nenhum teste: `vitest.config.ts` fixava `environment: 'node'`
 * e nenhum componente do projeto jamais foi montado.
 *
 * Cada caso afirma EFEITO OBSERVÁVEL (tamanho computado, rótulo acessível,
 * estado marcado, nº de segmentos acesos), nunca "a função foi chamada".
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize, computed } from '../../test/renderEnv';
import { PixelButton, PixelCheckbox, PixelSegmentedBar, PixelChip, PixelPanel, BAR_MIN_HEIGHT_PX } from './PixelKit';

describe('PixelCheckbox — o componente do bug de 2px', () => {
  it('o ALVO tem 44×44 computados do CSS real (não do que o JSX pretendia)', () => {
    // Este é o teste que teria pego o checkbox de 2px. O bug não era lógica:
    // o JSX usava `w-7 h-7` (Tailwind v3) e o index.css v4 pré-compilado não
    // tem essas classes, então o botão ficava sem largura nenhuma e colapsava
    // no conteúdo. A única forma de ver isso é resolver a cascata de verdade.
    renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} />);
    const box = screen.getByRole('checkbox');
    const { w, h } = declaredTargetSize(box);
    expect(w).toBe(44);
    expect(h).toBe(44);
  });

  it('o quadrado desenhado é menor que o alvo — o alvo não encolhe com a arte', () => {
    const { container } = renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} />);
    const art = container.querySelector('.sm-px-check-box')!;
    expect(declaredTargetSize(art).w).toBe(26);
    // e é MENOR que o alvo: se um dia alguém igualar os dois, a arte volta a
    // mandar no toque, que foi a origem do defeito.
    expect(declaredTargetSize(art).w!).toBeLessThan(declaredTargetSize(screen.getByRole('checkbox')).w!);
  });

  it('estado marcado/desmarcado é observável por `aria-checked` e pela classe acesa', () => {
    const { container, rerender } = renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveProperty('ariaChecked', 'false');
    expect(container.querySelector('.sm-px-check-on')).toBeNull();
    rerender(<PixelCheckbox checked onToggle={() => {}} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
    expect(container.querySelector('.sm-px-check-on')).not.toBeNull();
    // o "aceso" precisa ser visível de verdade, não só um nome de classe
    expect(computed(container.querySelector('.sm-px-check-on')!, 'border-color')).not.toBe('');
  });

  it('tem par PT/EN no rótulo acessível — nenhum estado sai só em português', () => {
    const { unmount } = renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} language="en-US" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe('Mark as completed');
    unmount();
    renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} language="pt-BR" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe('Marcar como concluído');
  });

  it('marcado em EN não vaza texto PT (regressão do aria-label PT-only)', () => {
    renderWithCss(<PixelCheckbox checked onToggle={() => {}} language="en-US" />);
    const label = screen.getByRole('checkbox').getAttribute('aria-label')!;
    expect(label).toBe('Completed');
    expect(label).not.toMatch(/[áàâãéêíóôõúçÁÂÃÉÊÍÓÔÕÚÇ]/);
  });

  it('desabilitado não dispara o toggle (clique real, não espião de props)', () => {
    const onToggle = vi.fn();
    renderWithCss(<PixelCheckbox checked={false} onToggle={onToggle} disabled />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('habilitado dispara o toggle uma vez por clique', () => {
    const onToggle = vi.fn();
    renderWithCss(<PixelCheckbox checked={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('PixelSegmentedBar', () => {
  it('expõe progressbar com os valores reais, não decorativos', () => {
    renderWithCss(<PixelSegmentedBar value={2} max={4} segments={4} label="Step progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(bar.getAttribute('aria-label')).toBe('Step progress');
  });

  it('acende exatamente os blocos correspondentes (2 de 4)', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={2} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm-px-bar-seg')).toHaveLength(4);
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(2);
  });

  it('max=0 não explode nem acende nada (estado vazio do dia)', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={0} max={0} />);
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(0);
    expect(container.querySelectorAll('.sm-px-bar-seg').length).toBeGreaterThan(0);
  });

  it('valor acima do máximo satura em vez de estourar a barra', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={99} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(4);
  });

  it('valor negativo não acende bloco nenhum', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={-5} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(0);
  });
});

describe('PixelButton', () => {
  it('tem altura de alvo declarada no CSS real (48px)', () => {
    renderWithCss(<PixelButton onClick={() => {}}>Usar</PixelButton>);
    const btn = screen.getByRole('button', { name: 'Usar' });
    expect(computed(btn, 'min-height')).toBe('48px');
  });

  it('desabilitado não chama onClick e fica marcado como disabled', () => {
    const onClick = vi.fn();
    renderWithCss(<PixelButton onClick={onClick} disabled>Usar</PixelButton>);
    const btn = screen.getByRole('button', { name: 'Usar' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('o ícone é decorativo (alt vazio) — não duplica o rótulo no leitor de tela', () => {
    const { container } = renderWithCss(<PixelButton icon="/x.png" onClick={() => {}}>Usar</PixelButton>);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
  });

  it('a arte 9-slice é injetada como variável CSS (senão a moldura some)', () => {
    renderWithCss(<PixelButton onClick={() => {}}>Usar</PixelButton>);
    const btn = screen.getByRole('button', { name: 'Usar' });
    expect(btn.style.getPropertyValue('--sm-px-src')).toMatch(/^url\(/);
  });
});

describe('PixelChip / PixelPanel', () => {
  it('a cápsula mostra rótulo e valor como texto de verdade', () => {
    renderWithCss(<PixelChip label="Credits" value={7} />);
    expect(screen.getByText('Credits')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('o painel sem título não renderiza barra de título vazia', () => {
    const { container } = renderWithCss(<PixelPanel>conteúdo</PixelPanel>);
    expect(container.querySelector('.sm-px-panel-title')).toBeNull();
  });

  it('o painel com título renderiza o título', () => {
    renderWithCss(<PixelPanel title="DAILY RITUALS">x</PixelPanel>);
    expect(screen.getByText('DAILY RITUALS')).toBeTruthy();
  });
});

/**
 * REGRESSÃO — a barra segmentada some em silêncio quando é baixa demais.
 *
 * `.sm-px-bar` é `border-box` com 8px de moldura (2px de borda + 2px de
 * padding, em cima e embaixo). Com altura ≤ 8 a caixa de conteúdo zera e o
 * `overflow: hidden` corta os blocos: sobra o sulco escuro. O nó continua com
 * `role="progressbar"` e `aria-valuenow` correto, então NADA acusa — nem tela,
 * nem teste de acessibilidade. Era o item A5 do `docs/BACKLOG-ARTE-GERAR.md`,
 * que pedia trocar a barra por PNG; o defeito não era a arte, era este.
 *
 * O piso vive no primitivo porque é propriedade dele. Antes vivia no
 * `RitualPanel`, como um `height={14}` com comentário — o que protegia UM
 * chamador e deixava o próximo repetir a falha.
 */
describe('PixelSegmentedBar — piso de altura (regressão)', () => {
  it('altura abaixo do piso é elevada, em vez de apagar os blocos', () => {
    const { container } = renderWithCss(
      <PixelSegmentedBar value={2} max={4} segments={4} height={6} />,
    );
    const bar = container.querySelector('.sm-px-bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(parseInt(bar.style.height, 10)).toBe(BAR_MIN_HEIGHT_PX);
  });

  it('altura acima do piso é respeitada — o piso não vira altura fixa', () => {
    const { container } = renderWithCss(
      <PixelSegmentedBar value={2} max={4} segments={4} height={20} />,
    );
    const bar = container.querySelector('.sm-px-bar') as HTMLElement;
    expect(parseInt(bar.style.height, 10)).toBe(20);
  });

  it('o piso deixa espaço de conteúdo para o bloco aceso existir', () => {
    // 8px de moldura + pelo menos 3px de bloco: o número que o primitivo usa
    // não pode cair para dentro da moldura sem ninguém notar.
    expect(BAR_MIN_HEIGHT_PX).toBeGreaterThanOrEqual(11);
  });

  it('os blocos acesos seguem a razão, e o piso não mexe nisso', () => {
    const { container } = renderWithCss(
      <PixelSegmentedBar value={3} max={4} segments={4} height={4} />,
    );
    expect(container.querySelectorAll('.sm-px-bar-seg-on').length).toBe(3);
  });
});
