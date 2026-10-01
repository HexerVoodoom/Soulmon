// @vitest-environment jsdom
/**
 * Testes de RENDER da linha de ritual da Home (G1).
 *
 * Estes casos herdam o que os antigos `TaskCard`/`ActivityCard` travavam (a
 * ação central do app tem `role="checkbox"` e alvo de 44×44) e acrescentam o
 * que é NOVO e frágil na composição densa:
 *
 *  · o nome escrito pelo usuário TRUNCA — e por isso precisa carregar `title`,
 *    senão um nome longo em PT-BR desaparece sem recurso de leitura;
 *  · o selo é o TIPO (`task_alt`/`event_repeat`, D-A2), nunca emoji nem PNG;
 *  · a linha continua com ≥56px de altura mesmo com nome de 40+ caracteres
 *    (canvas Atividades: `.li` 56, checkbox 24 em alvo 44).
 *
 * Cada caso afirma EFEITO OBSERVÁVEL, medido na cascata real do index.css.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize, computed } from '../../test/renderEnv';
import { RitualPanel, RitualRow } from './RitualPanel';

const NOME_LONGO = 'Organizar a manhã inteira antes das nove horas da matina';

function linha(extra: Partial<React.ComponentProps<typeof RitualRow>> = {}) {
  return (
    <RitualRow
      kind="habit"
      name="Beber 2 litros de água"
      subtitle="Saúde"
      value={0}
      max={1}
      onToggle={() => {}}
      onEdit={() => {}}
      language="pt-BR"
      {...extra}
    />
  );
}

describe('RitualRow — a ação central continua acessível na composição densa', () => {
  it('o checkbox mantém `role="checkbox"` e 44×44 computados do CSS real', () => {
    renderWithCss(<ul>{linha()}</ul>);
    const box = screen.getByRole('checkbox');
    const { w, h } = declaredTargetSize(box);
    expect(w).toBe(44);
    expect(h).toBe(44);
    expect(box.getAttribute('aria-checked')).toBe('false');
  });

  it('marcar concluído chama o toggle; concluído não chama de novo', () => {
    const toggle = vi.fn();
    const { unmount } = renderWithCss(<ul>{linha({ onToggle: toggle })}</ul>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(toggle).toHaveBeenCalledTimes(1);
    unmount();

    renderWithCss(<ul>{linha({ onToggle: toggle, done: true })}</ul>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  // D2 (01/10/2026): editar = tocar no ÍCONE DA ESQUERDA (o selo do tipo).
  it('o ícone da esquerda é o botão de EDITAR, com rótulo que diz o nome', () => {
    const edit = vi.fn();
    const { container } = renderWithCss(<ul>{linha({ onEdit: edit })}</ul>);
    const botao = screen.getByRole('button', { name: 'Editar: Beber 2 litros de água' });
    expect(botao.getAttribute('data-ritual-edit')).not.toBeNull();
    expect(botao.querySelector('.sm2-icon')).not.toBeNull();
    fireEvent.click(botao);
    expect(edit).toHaveBeenCalledTimes(1);
    // um só controle de editar por linha (sem lápis/folha extra)
    expect(container.querySelectorAll('[data-ritual-edit]')).toHaveLength(1);
  });

  it('par PT/EN do rótulo de editar', () => {
    renderWithCss(<ul>{linha({ language: 'en-US' })}</ul>);
    expect(screen.getByRole('button', { name: 'Edit: Beber 2 litros de água' })).toBeTruthy();
  });
});

describe('RitualRow — sobreviver ao texto PT-BR (N3 da análise de gap)', () => {
  /* RODADA 5: o mecanismo mudou de ellipsis-de-1-linha para CLAMP DE 2
     LINHAS (com o trilho de evolução ao lado, "Meditation" virava "Medita…"
     já no primeiro ritual; a referência quebra o nome em duas linhas). O
     PROPÓSITO do teste é o mesmo: texto longo não pode vazar da linha, e o
     `title` leva o texto inteiro. */
  it('nome longo é CONTIDO (clamp de 2 linhas) e leva `title` com o texto inteiro', () => {
    const { container } = renderWithCss(<ul>{linha({ name: NOME_LONGO })}</ul>);
    const nome = container.querySelector('.sm2-ritual-name') as HTMLElement;
    expect(nome.getAttribute('title')).toBe(NOME_LONGO);
    expect(computed(nome, 'overflow')).toBe('hidden');
    expect(computed(nome, '-webkit-line-clamp')).toBe('2');
    expect(computed(nome, '-webkit-box-orient')).toBe('vertical');
  });

  it('a altura mínima da linha não depende do tamanho do nome', () => {
    const { container } = renderWithCss(<ul>{linha({ name: NOME_LONGO })}</ul>);
    const row = container.querySelector('.sm2-ritual-row') as HTMLElement;
    // 56px é a linha do canvas Atividades (SIS-03). O alvo do checkbox e da
    // coluna de texto continua 44.
    expect(computed(row, 'min-height')).toBe('56px');
  });
});

describe('RitualRow — o selo é o TIPO (D-A2), pelado, e NUNCA emoji', () => {
  it('hábito = `event_repeat`, tarefa = `task_alt`, 24 e decorativos', () => {
    const { container, unmount } = renderWithCss(<ul>{linha({ kind: 'habit' })}</ul>);
    const selo = container.querySelector('.sm2-icon') as HTMLElement;
    expect(selo.textContent).toBe('event_repeat');
    expect(selo.getAttribute('aria-hidden')).toBe('true');
    expect(selo.style.fontSize).toBe('24px');
    unmount();
    const r2 = renderWithCss(<ul>{linha({ kind: 'task' })}</ul>);
    expect((r2.container.querySelector('.sm2-icon') as HTMLElement).textContent).toBe('task_alt');
  });

  it('o selo não ganha caixa e nunca é PNG', () => {
    const { container } = renderWithCss(<ul>{linha()}</ul>);
    const selo = container.querySelector('.sm2-icon') as HTMLElement;
    expect(selo.style.backgroundColor).toBe('');
    expect(selo.style.border).toBe('');
    expect(container.querySelectorAll('img').length).toBe(0);
  });

  it('nenhum emoji do sistema sobra no conteúdo da linha', () => {
    const { container } = renderWithCss(<ul>{linha({ name: 'Ler 10 páginas' })}</ul>);
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(EMOJI.test(container.textContent ?? '')).toBe(false);
  });

  it('esmaecer é TINTA, nunca `opacity` (D-A3): fora do dia, concluída e assombrada', () => {
    for (const extra of [{ dimmed: true }, { done: true }, { haunted: true }] as const) {
      const { container, unmount } = renderWithCss(<ul>{linha(extra)}</ul>);
      const comAlfa = Array.from(container.querySelectorAll<HTMLElement>('*'))
        .filter(e => e.style.opacity !== '' && e.style.opacity !== '1');
      expect(comAlfa, JSON.stringify(extra)).toHaveLength(0);
      const nome = container.querySelector('.sm2-ritual-name') as HTMLElement;
      expect(nome.style.color).toBe('haunted' in extra ? 'var(--sm2-haunted)' : 'var(--sm2-muted)');
      unmount();
    }
  });

  it('fora do dia, o checkbox é tracejado e `aria-disabled`', () => {
    renderWithCss(<ul>{linha({ dimmed: true })}</ul>);
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-disabled')).toBe('true');
    const caixa = box.querySelector('span') as HTMLElement;
    expect(caixa.style.border).toContain('dashed');
  });
});

describe('RitualRow — etapas nascem recolhidas', () => {
  it('sem expandir, as etapas não estão no DOM; o expansor anuncia o estado', () => {
    const { container } = renderWithCss(
      <ul>{linha({
        onToggle: undefined, expandable: true, expanded: false, onExpand: () => {},
        children: <p>Revisar anotações</p>,
      })}</ul>,
    );
    expect(container.textContent).not.toContain('Revisar anotações');
    const exp = screen.getByRole('button', { name: /Expandir etapas/ });
    expect(exp.getAttribute('aria-expanded')).toBe('false');
    expect(declaredTargetSize(exp).w).toBe(44);
  });

  it('expandido, as etapas aparecem', () => {
    renderWithCss(
      <ul>{linha({
        onToggle: undefined, expandable: true, expanded: true, onExpand: () => {},
        children: <p>Revisar anotações</p>,
      })}</ul>,
    );
    expect(screen.getByText('Revisar anotações')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Recolher etapas/ }).getAttribute('aria-expanded')).toBe('true');
  });
});

describe('RitualPanel — um painel só, com contador e CTA largo', () => {
  it('título traz o par PT/EN e o contador feitos/total', () => {
    const { unmount } = renderWithCss(
      <RitualPanel done={2} total={5} ctaLabel="Nova Atividade" onCta={() => {}} language="pt-BR">
        {linha()}
      </RitualPanel>,
    );
    expect(screen.getByText('Rituais diários')).toBeTruthy();
    expect(screen.getByText('2/5')).toBeTruthy();
    unmount();

    renderWithCss(
      <RitualPanel done={2} total={5} ctaLabel="New Activity" onCta={() => {}} language="en-US">
        {linha({ language: 'en-US' })}
      </RitualPanel>,
    );
    expect(screen.getByText('Daily rituals')).toBeTruthy();
    expect(screen.getByText('2/5')).toBeTruthy();
  });

  it('o contador só existe com feitos ≥ 1 (piso de dígitos E5) e o CTA é `outline` com a lista viva', () => {
    const { container } = renderWithCss(
      <RitualPanel done={0} total={3} ctaLabel="Nova Atividade" onCta={() => {}} language="pt-BR">
        {linha()}
      </RitualPanel>,
    );
    expect(screen.queryByText('0/3')).toBeNull();
    const cta = screen.getByRole('button', { name: /Nova Atividade/ }) as HTMLElement;
    expect(cta.style.backgroundColor).toBe('var(--sm2-surface)');
    expect(container.querySelector('.sm2-ritual-list')).toBeTruthy();
  });

  it('o CTA largo existe e dispara (é o que aposentou o FAB flutuante)', () => {
    const cta = vi.fn();
    renderWithCss(
      <RitualPanel done={0} total={1} ctaLabel="Nova Atividade" onCta={cta} language="pt-BR">
        {linha()}
      </RitualPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Nova Atividade/ }));
    expect(cta).toHaveBeenCalledTimes(1);
  });

  it('estado VAZIO mostra a mensagem e mantém o CTA (não é uma tela morta)', () => {
    renderWithCss(
      <RitualPanel
        done={0} total={0} ctaLabel="Nova Atividade" onCta={() => {}} language="pt-BR"
        emptyMessage="Nenhuma atividade cadastrada."
      >
        {null}
      </RitualPanel>,
    );
    expect(screen.getByText('Nenhuma atividade cadastrada.')).toBeTruthy();
    // vazio: o CTA é o ÚNICO primário da tela (ListaVazia)
    const cta = screen.getByRole('button', { name: /Nova Atividade/ }) as HTMLElement;
    expect(cta.style.backgroundColor).toBe('var(--sm2-primary-fill)');
    // sem contador quando não há nada para contar
    expect(screen.getByText('Rituais diários')).toBeTruthy();
  });
});
