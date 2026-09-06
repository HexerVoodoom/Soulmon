// @vitest-environment jsdom
/**
 * WP2.10 — a intervenção do never-miss-twice existe de verdade.
 *
 * O `CLAUDE.md` e o `GuideModal` prometem, com estas palavras: "o pet oferece
 * uma versão bem menor do hábito — aceitar já conta como feito". A regra
 * (`needsIntervention`) tinha teste próprio e QUARENTA linhas de comentário
 * explicando por que a intervenção só vem na segunda falta… e **nenhum
 * componente a chamava**. A primeira falha não gerava nada visível (correto) e
 * a segunda também não (que é a promessa quebrada).
 *
 * Três travas de forma, e cada uma separa companhia de cobrança:
 *  · **nenhum dígito de falta.** Nunca "você falhou 2 dias" — a pessoa sabe. O
 *    único número na frase é o 5 dos minutos.
 *  · **aceitar conta como feito, literalmente**: o mesmo caminho de conclusão
 *    de sempre, com os mesmos ganhos. Um caminho paralelo seria uma segunda
 *    regra de conclusão e um "meio-feito" que a tese não tem.
 *  · **não existe botão de recusar.** Ignorar é a recusa, e ela não custa nada
 *    nem aparece em lugar nenhum.
 */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { MorningCheckIn, type CheckInPlanShape } from './MorningCheckIn';

const plano = (over: Partial<CheckInPlanShape> = {}): CheckInPlanShape => ({
  habitsToday: [{ id: 'h1', name: 'Alongar' }, { id: 'h2', name: 'Ler' }],
  suggestedFocus: [], carryOver: [], plannedEffort: 0, overcommitted: false,
  ...over,
});

describe('MorningCheckIn — a oferta reduzida (WP2.10)', () => {
  it('sem falta acumulada, nenhuma oferta aparece', () => {
    renderWithCss(
      <MorningCheckIn open plan={plano()} language="pt-BR"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={() => {}} />,
    );
    expect(screen.queryByText(/só 5 minutos/i)).toBeNull();
  });

  it('com o hábito na lista de oferta, o pet oferece a versão menor', () => {
    renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1'] })} language="pt-BR"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={() => {}} />,
    );
    expect(screen.getByText('Alongar: hoje, só 5 minutos?')).toBeTruthy();
    // Só o que está na lista — o outro hábito segue sem oferta.
    expect(screen.queryByText(/^Ler:/)).toBeNull();
  });

  it('aceitar chama o caminho de conclusão com o id do hábito', () => {
    const aceitos: string[] = [];
    renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1'] })} language="pt-BR"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={id => aceitos.push(id)} />,
    );
    fireEvent.click(screen.getByText('Alongar: hoje, só 5 minutos?'));
    expect(aceitos).toEqual(['h1']);
  });

  it('a oferta NUNCA diz quantas faltas houve', () => {
    renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1', 'h2'] })} language="pt-BR"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={() => {}} />,
    );
    const bloco = screen.getByText('Aceitar já conta como feito.').parentElement!;
    const texto = bloco.textContent ?? '';
    // O único dígito permitido é o 5 dos minutos.
    expect(texto.replace(/5 minutos|5 minutes/g, ''), 'apareceu um número de falta')
      .not.toMatch(/\d/);
    expect(texto).not.toMatch(/falt|miss|perdeu|seguidos/i);
  });

  it('não existe botão de recusar — ignorar é a recusa, e não custa nada', () => {
    renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1'] })} language="pt-BR"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={() => {}} />,
    );
    expect(screen.queryByText(/não posso|not today.*habit|recusar|dispensar/i)).toBeNull();
  });

  it('em inglês também, e sem o handler a oferta simplesmente não existe', () => {
    const r = renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1'] })} language="en-US"
        onConfirm={() => {}} onSkip={() => {}} onTinyHabit={() => {}} />,
    );
    expect(screen.getByText('Alongar: just 5 minutes today?')).toBeTruthy();
    r.unmount();
    renderWithCss(
      <MorningCheckIn open plan={plano({ tinyOffer: ['h1'] })} language="en-US"
        onConfirm={() => {}} onSkip={() => {}} />,
    );
    expect(screen.queryByText(/5 minutes today/)).toBeNull();
  });
});
