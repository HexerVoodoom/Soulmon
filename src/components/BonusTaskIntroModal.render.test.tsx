// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, render } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { BonusTaskIntroModal } from './BonusTaskIntroModal';
import { CompletionTag } from './CompletionTag';
import { RitualRow } from './pixel/RitualPanel';
import { emphasizeSoulFragment } from './ui/SoulFragmentTerm';

describe('tarefa bônus — UI (13/11/2026)', () => {
  it('a linha bônus é a MESMA linha, só o título em bronze (--sm2-check-fill), sem texto extra', () => {
    const { container } = render(<ul>
      <RitualRow kind="habit" name="Alongar" value={0} max={1} bonus onToggle={() => {}} language="pt-BR" />
      <RitualRow kind="habit" name="Ler" value={0} max={1} onToggle={() => {}} language="pt-BR" />
    </ul>);
    const [b, n] = Array.from(container.querySelectorAll('li'));
    expect(b.getAttribute('data-bonus')).toBe('true');
    expect((b.querySelector('.sm2-ritual-name') as HTMLElement).style.color).toBe('var(--sm2-check-fill)');
    expect((n.querySelector('.sm2-ritual-name') as HTMLElement).style.color).toBe('var(--sm2-ink)');
    expect(b.textContent).toBe('Alongar');
  });

  it('o modal mostra "Item comum" e "Item especial" e a frase do dono; Entendi fecha', () => {
    const onClose = vi.fn();
    renderWithCss(<BonusTaskIntroModal open language="pt-BR" onClose={onClose} />);
    expect(screen.getByText('Item comum')).toBeTruthy();
    expect(screen.getByText('Item especial')).toBeTruthy();
    expect(document.querySelector('[data-bonus-intro-example="bonus"] li')!.getAttribute('data-bonus')).toBe('true');
    expect(document.querySelector('[data-bonus-intro-example="comum"] li')!.getAttribute('data-bonus')).toBeNull();
    expect(screen.getByText('Algumas tarefas podem receber bônus para te ajudar a completá-las. Essas tarefas concedem um ponto extra em direção à evolução.')).toBeTruthy();
    fireEvent.click(screen.getByText('Entendi'));
    expect(onClose).toHaveBeenCalled();
  });

  it('o toast mostra "+1 fragmento de alma" com o termo destacado; sem fragmento, nada', () => {
    const r = render(<CompletionTag language="pt-BR" name="Ler" items={[{ kind: 'xp', amount: 40 }]} fragments={1} onUndo={() => {}} />);
    const f = document.querySelector('[data-completion-fragments]')!;
    expect(f.textContent).toBe('+1 fragmento de alma');
    const term = f.querySelector('[data-soul-fragment-term]') as HTMLElement;
    expect(term.tagName).toBe('STRONG');
    expect(term.style.color).toBe('var(--sm2-primary-ink)');
    r.unmount();
    render(<CompletionTag language="pt-BR" name="Ler" items={[]} onUndo={() => {}} />);
    expect(document.querySelector('[data-completion-fragments]')).toBeNull();
  });

  it('emphasizeSoulFragment destaca PT e EN, singular e plural, e deixa o resto intacto', () => {
    const { container } = render(<p>{emphasizeSoulFragment('Ganhe Fragmentos de Alma e 1 soul fragment.')}</p>);
    const termos = Array.from(container.querySelectorAll('[data-soul-fragment-term]')).map(e => e.textContent);
    expect(termos).toEqual(['Fragmentos de Alma', 'soul fragment']);
    expect(container.textContent).toBe('Ganhe Fragmentos de Alma e 1 soul fragment.');
    expect(emphasizeSoulFragment('Bits')).toBe('Bits');
  });
});
