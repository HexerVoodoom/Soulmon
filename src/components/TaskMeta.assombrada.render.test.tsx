// @vitest-environment jsdom
/**
 * A TAREFA ASSOMBRADA lê pela TINTA, nunca pelo alfa (canvas Home,
 * `PetAssombrado` / F1 / P5, 16/09/2026).
 *
 * A crítica mediu a versão com `opacity: .55` na linha inteira: 3,26:1 escuro
 * e 2,31:1 claro — "a tarefa que a pessoa não consegue ler é a que ela vai
 * adiar". O conserto é estrutural, e é o que este arquivo trava:
 *  · a LINHA (`RitualRow haunted`) põe o título em `--sm2-haunted`, o 4º
 *    acento, sólido, medido em `tokens.contrast.test.ts`;
 *  · o CHIP do `TaskMeta` é `gold-ink` sobre `surface-2` (convite, âmbar);
 *  · nenhum dos dois usa `opacity`, e nenhum usa vermelho.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { TaskMeta } from './TaskMeta';
import { RitualRow } from './pixel/RitualPanel';

const agora = new Date('2026-09-16T12:00:00');
const dias = (n: number) => new Date(agora.getTime() - n * 86400000).toISOString();
const assombrada = { id: 't1', name: 'Call the dentist', completed: false, effort: 1 as const, status: 'open' as const, createdAt: dias(9), lastTouchedAt: dias(9) };

describe('tarefa assombrada — tinta, não alfa', () => {
  it('o chip "haunted · +relief" é gold-ink sobre surface-2, 24px, sem opacidade', () => {
    const { container } = renderWithCss(<TaskMeta task={assombrada} now={agora} language="en-US" />);
    const chip = container.querySelector('[data-haunted-chip]') as HTMLElement;
    expect(chip, 'o chip existe para a tarefa assombrada').toBeTruthy();
    expect(chip.textContent).toContain('haunted · +relief');
    expect(chip.style.color).toBe('var(--sm2-gold-ink)');
    expect(chip.style.backgroundColor).toBe('var(--sm2-surface-2)');
    expect(chip.style.minHeight).toBe('24px');
    expect(chip.style.opacity).toBe('');
    // nada da era `--sm-*` e nada vermelho
    expect(container.innerHTML).not.toMatch(/--sm-haunt|danger/);
  });

  it('nenhum elemento da faixa de metadados carrega `opacity`', () => {
    const { container } = renderWithCss(<TaskMeta task={assombrada} now={agora} language="pt-BR" />);
    const comAlfa = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(e => e.style.opacity !== '' && e.style.opacity !== '1');
    expect(comAlfa).toHaveLength(0);
  });

  it('a linha assombrada é marcada por classe e a tinta do título é o token --sm2-haunted', () => {
    const { container } = renderWithCss(
      <ul>
        <RitualRow kind="task" name="Call the dentist" value={0} max={1} haunted onEdit={() => {}} onToggle={() => {}} language="en-US" />
      </ul>,
    );
    const li = container.querySelector('li')!;
    expect(li.className).toContain('sm2-ritual-haunted');
    expect(li.getAttribute('data-haunted')).toBe('true');
    expect(li.style.opacity).toBe('');
    const nome = li.querySelector('.sm2-ritual-name') as HTMLElement;
    // jsdom não resolve `var()`: o que dá para medir é a regra do index.css.
    expect(getComputedStyle(nome).color).toMatch(/sm2-haunted/);
    // o selo do tipo segue a tinta da linha
    const icone = li.querySelector('.sm2-icon') as HTMLElement;
    expect(icone.style.color).toBe('var(--sm2-haunted)');
    // lápis (a coluna de texto é o botão de editar) e checkbox intactos
    expect(li.querySelector('button[aria-label^="Edit"]')).toBeTruthy();
    expect(li.querySelector('[role="checkbox"]')).toBeTruthy();
  });

  it('concluída, a linha deixa de ser assombrada (o convite já foi aceito)', () => {
    const { container } = renderWithCss(
      <ul>
        <RitualRow kind="task" name="Call the dentist" value={1} max={1} done haunted onEdit={() => {}} onToggle={() => {}} language="pt-BR" />
      </ul>,
    );
    expect(container.querySelector('li')!.className).not.toContain('sm2-ritual-haunted');
  });
});
