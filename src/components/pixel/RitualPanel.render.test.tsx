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
 *  · o fallback de ícone é quadro VAZIO, nunca emoji do sistema (G2);
 *  · a linha continua com ≥72px de altura mesmo com nome de 40+ caracteres,
 *    porque é a altura que sustenta a medida de densidade (T4).
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

  it('a coluna de texto é o botão de EDITAR, com rótulo que diz o nome', () => {
    const edit = vi.fn();
    renderWithCss(<ul>{linha({ onEdit: edit })}</ul>);
    const botao = screen.getByRole('button', { name: 'Editar: Beber 2 litros de água' });
    fireEvent.click(botao);
    expect(edit).toHaveBeenCalledTimes(1);
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
    const nome = container.querySelector('.sm-px-ritual-name') as HTMLElement;
    expect(nome.getAttribute('title')).toBe(NOME_LONGO);
    expect(computed(nome, 'overflow')).toBe('hidden');
    expect(computed(nome, '-webkit-line-clamp')).toBe('2');
    expect(computed(nome, '-webkit-box-orient')).toBe('vertical');
  });

  it('a altura mínima da linha não depende do tamanho do nome', () => {
    const { container } = renderWithCss(<ul>{linha({ name: NOME_LONGO })}</ul>);
    const row = container.querySelector('.sm-px-ritual-row') as HTMLElement;
    // 72px é a medida que sustenta a densidade da dobra (T4). Se alguém
    // encolher isto sem refazer a medição, a composição perde o alvo.
    expect(computed(row, 'min-height')).toBe('72px');
  });
});

describe('RitualRow — ícone SEM MOLDURA (rodada 4), e NUNCA emoji', () => {
  it('sem ícone de categoria, a linha começa no TEXTO — sem casa reservada', () => {
    // Era o contrário: a casa existia sempre e ficava vazia (o "quadro de
    // cobre vazio" do G2). Tirada a moldura por direção do dono, um quadro
    // vazio vira 40px de NADA no meio de uma tela de 412px — então a casa
    // deixa de existir e a linha começa no texto.
    const { container } = renderWithCss(<ul>{linha({ icon: undefined })}</ul>);
    expect(container.querySelector('.sm-px-ritual-icon')).toBeNull();
  });

  it('a casa do ícone não tem moldura própria', () => {
    // A regra da rodada 3 ("controle interativo sem superfície = 0") vale para
    // CONTROLE. Esta casa é decorativa (`aria-hidden`); o checkbox e a coluna
    // de texto da linha continuam com superfície e alvo próprios.
    const { container } = renderWithCss(<ul>{linha({ icon: '/icone-fake.png' })}</ul>);
    const casa = container.querySelector('.sm-px-ritual-icon') as HTMLElement;
    expect(computed(casa, 'width')).toBe('40px');
    // `border-style`, não `border-width`: sem estilo a borda não desenha, e o
    // jsdom devolve o *keyword* `medium` para a largura inicial — asserção
    // sobre a largura passaria a medir o jsdom, não a regra.
    expect(computed(casa, 'border-top-style') || 'none').toBe('none');
    expect(computed(casa, 'clip-path') || 'none').toBe('none');
  });

  it('nenhum emoji do sistema sobra no conteúdo da linha', () => {
    const { container } = renderWithCss(<ul>{linha({ icon: undefined, name: 'Ler 10 páginas' })}</ul>);
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(EMOJI.test(container.textContent ?? '')).toBe(false);
  });

  it('com ícone de categoria, renderiza a arte do kit dentro da casa', () => {
    const { container } = renderWithCss(<ul>{linha({ icon: '/icone-fake.png' })}</ul>);
    const img = container.querySelector('.sm-px-ritual-icon img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/icone-fake.png');
    // decorativo: o nome ao lado já diz o que é
    expect(img.getAttribute('alt')).toBe('');
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
      <RitualPanel done={2} total={5} ctaLabel="+ Nova Atividade" onCta={() => {}} language="pt-BR">
        {linha()}
      </RitualPanel>,
    );
    expect(screen.getByText('Rituais diários 2/5')).toBeTruthy();
    unmount();

    renderWithCss(
      <RitualPanel done={2} total={5} ctaLabel="+ New Activity" onCta={() => {}} language="en-US">
        {linha({ language: 'en-US' })}
      </RitualPanel>,
    );
    expect(screen.getByText('Daily rituals 2/5')).toBeTruthy();
  });

  it('o CTA largo existe e dispara (é o que aposentou o FAB flutuante)', () => {
    const cta = vi.fn();
    renderWithCss(
      <RitualPanel done={0} total={1} ctaLabel="+ Nova Atividade" onCta={cta} language="pt-BR">
        {linha()}
      </RitualPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Atividade' }));
    expect(cta).toHaveBeenCalledTimes(1);
  });

  it('estado VAZIO mostra a mensagem e mantém o CTA (não é uma tela morta)', () => {
    renderWithCss(
      <RitualPanel
        done={0} total={0} ctaLabel="+ Nova Atividade" onCta={() => {}} language="pt-BR"
        emptyMessage="Nenhuma atividade cadastrada."
      >
        {null}
      </RitualPanel>,
    );
    expect(screen.getByText('Nenhuma atividade cadastrada.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Nova Atividade' })).toBeTruthy();
    // sem contador quando não há nada para contar
    expect(screen.getByText('Rituais diários')).toBeTruthy();
  });
});
