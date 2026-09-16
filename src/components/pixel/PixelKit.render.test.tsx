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
import { PixelButton, PixelCheckbox, PixelSegmentedBar, PixelChip, PixelPanel } from './PixelKit';

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
    const art = container.querySelector('.sm2-kit-check-box')!;
    expect(declaredTargetSize(art).w).toBe(24);
    // e é MENOR que o alvo: se um dia alguém igualar os dois, a arte volta a
    // mandar no toque, que foi a origem do defeito.
    expect(declaredTargetSize(art).w!).toBeLessThan(declaredTargetSize(screen.getByRole('checkbox')).w!);
  });

  it('estado marcado/desmarcado é observável por `aria-checked` e pela classe acesa', () => {
    const { container, rerender } = renderWithCss(<PixelCheckbox checked={false} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveProperty('ariaChecked', 'false');
    expect(container.querySelector('.sm2-kit-check-on')).toBeNull();
    rerender(<PixelCheckbox checked onToggle={() => {}} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
    expect(container.querySelector('.sm2-kit-check-on')).not.toBeNull();
    // o "aceso" precisa ser visível de verdade, não só um nome de classe
    expect(computed(container.querySelector('.sm2-kit-check-on')!, 'border-color')).not.toBe('');
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
    expect(container.querySelectorAll('.sm2-kit-segbar-seg')).toHaveLength(4);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-on')).toHaveLength(2);
  });

  it('max=0 não explode nem acende nada (estado vazio do dia)', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={0} max={0} />);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-on')).toHaveLength(0);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg').length).toBeGreaterThan(0);
  });

  it('valor acima do máximo satura em vez de estourar a barra', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={99} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-on')).toHaveLength(4);
  });

  it('meia unidade = metade do bloco (2,5 de 4 → 2 cheios + 1 meio)', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={2.5} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-on')).toHaveLength(2);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-half')).toHaveLength(1);
  });

  it('o tom "red" da API desenha em COBRE — não existe medidor vermelho', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={1} max={4} tone="red" />);
    const bar = container.querySelector('.sm2-kit-segbar') as HTMLElement;
    expect(bar.style.getPropertyValue('--sm2-kit-tone')).toBe('var(--sm2-gold-fill)');
    expect(bar.style.getPropertyValue('--sm2-kit-tone')).not.toMatch(/danger|red/);
  });

  it('valor negativo não acende bloco nenhum', () => {
    const { container } = renderWithCss(<PixelSegmentedBar value={-5} max={4} segments={4} />);
    expect(container.querySelectorAll('.sm2-kit-segbar-seg-on')).toHaveLength(0);
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

  it('ZERO PNG: o botão não injeta arte nem usa classe do kit pixel antigo', () => {
    // Canvas Sistema (16/09/2026): o botão é vetor sobre `--sm2-*`. Se alguém
    // religar `--sm-px-src`/`.sm-px-btn`, a moldura 9-slice volta para fora do
    // visor — exatamente o que a direção "O Visor" proíbe.
    renderWithCss(<PixelButton onClick={() => {}}>Usar</PixelButton>);
    const btn = screen.getByRole('button', { name: 'Usar' });
    expect(btn.style.getPropertyValue('--sm-px-src')).toBe('');
    expect(btn.className).not.toMatch(/sm-px-/);
    expect(btn.className).toContain('sm2-kit-btn');
  });

  it('`default` é o outline; `primary` é o fill — e ambos são tokens', () => {
    const { container } = renderWithCss(
      <>
        <PixelButton onClick={() => {}}>Later</PixelButton>
        <PixelButton variant="primary" onClick={() => {}}>Feed</PixelButton>
      </>,
    );
    const [out, pri] = Array.from(container.querySelectorAll('button'));
    expect(out.className).toContain('sm2-kit-btn-outline');
    expect(pri.className).toContain('sm2-kit-btn-primary');
    expect(computed(pri, 'background-color')).toBe('var(--sm2-primary-fill)');
    expect(computed(pri, 'color')).toBe('var(--sm2-on-primary)');
    expect(computed(out, 'background-color')).toBe('var(--sm2-surface)');
  });

  it('sm = 44 e lg = 56 de altura, lg ocupa a largura toda', () => {
    const { container } = renderWithCss(
      <>
        <PixelButton size="sm" onClick={() => {}}>a</PixelButton>
        <PixelButton size="lg" onClick={() => {}}>b</PixelButton>
      </>,
    );
    const [sm, lg] = Array.from(container.querySelectorAll('button'));
    expect(computed(sm, 'min-height')).toBe('44px');
    expect(computed(lg, 'min-height')).toBe('56px');
    expect(computed(lg, 'width')).toBe('100%');
  });

  it('`iconName` desenha o ícone Material pelado (sem img, sem box)', () => {
    const { container } = renderWithCss(<PixelButton iconName="restaurant" onClick={() => {}}>Feed</PixelButton>);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.sm2-icon')).not.toBeNull();
  });

  it('`busy` desativa ao toque e anuncia aria-busy, mantendo o rótulo', () => {
    const onClick = vi.fn();
    renderWithCss(<PixelButton busy onClick={onClick}>Feeding…</PixelButton>);
    const btn = screen.getByRole('button', { name: 'Feeding…' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
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
    expect(container.querySelector('.sm2-kit-panel-title')).toBeNull();
  });

  it('o painel com título renderiza o título', () => {
    renderWithCss(<PixelPanel title="DAILY RITUALS">x</PixelPanel>);
    expect(screen.getByText('DAILY RITUALS')).toBeTruthy();
  });
});
