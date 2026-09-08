// @vitest-environment jsdom
/**
 * A tela de confirmação do "Equilibrar minha semana" (P4).
 *
 * O que estes testes protegem:
 *
 *  1. **Nada é aplicado sem confirmação.** Autoria da meta é o que sustenta a
 *     motivação intrínseca; um app que reorganiza a semana da pessoa sozinho é
 *     o chefe de novo. Abrir a tela NÃO pode escrever nada.
 *  2. **A confirmação é informada.** Quem aceita vê o antes/depois e a lista
 *     nominal do que muda — "confie em mim" não é consentimento.
 *  3. **Honestidade quando não resolve.** Carga que não cabe em `7 × teto` não
 *     pode ser vendida como resolvida a quem já chegou dizendo que se sente
 *     sobrecarregado.
 *  4. **"Agora não" é ação de primeira classe**, e não um X escondido: recusar
 *     precisa ser tão fácil quanto aceitar.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { BalanceWeekModal } from './BalanceWeekModal';

const empilhadas = [
  { id: 'a', name: 'Correr', weekDays: [1] },
  { id: 'b', name: 'Ler', weekDays: [1] },
  { id: 'c', name: 'Água', weekDays: [1] },
  { id: 'd', name: 'Alongar', weekDays: [1] },
];

function abrir(
  atividades = empilhadas,
  teto = 2,
  language: 'pt-BR' | 'en-US' = 'en-US',
) {
  const onAplicar = vi.fn();
  const onClose = vi.fn();
  renderWithCss(
    <BalanceWeekModal
      open
      onClose={onClose}
      language={language}
      atividades={atividades}
      teto={teto}
      onAplicar={onAplicar}
    />,
  );
  return { onAplicar, onClose };
}

describe('BalanceWeekModal', () => {
  it('ABRIR não aplica nada — a escrita só acontece com confirmação', () => {
    const { onAplicar } = abrir();
    expect(onAplicar).not.toHaveBeenCalled();
  });

  it('mostra antes e depois, e a lista NOMINAL do que muda', () => {
    abrir();
    expect(screen.getByText('How it is today')).toBeTruthy();
    expect(screen.getByText('How it would look')).toBeTruthy();
    // Os nomes das atividades que serão movidas aparecem.
    expect(screen.getByText('Ler')).toBeTruthy();
  });

  it('diz, em texto, que a FREQUÊNCIA não muda', () => {
    // É o mal-entendido mais provável da tela, e o mais caro: a pessoa acha
    // que o app vai reduzir o quanto ela faz.
    abrir();
    expect(screen.getByText(/same number of times per week/)).toBeTruthy();
  });

  it('confirmar entrega SÓ o que mudou, e fecha', () => {
    const { onAplicar, onClose } = abrir();
    fireEvent.click(screen.getByText('Go ahead'));
    expect(onAplicar).toHaveBeenCalledTimes(1);
    const mudancas = onAplicar.mock.calls[0][0] as Array<{ id: string; days: number[] }>;
    expect(mudancas.length).toBeGreaterThan(0);
    // Cada atividade continua com a MESMA quantidade de dias.
    for (const m of mudancas) expect(m.days).toHaveLength(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('"Agora não" fecha sem aplicar', () => {
    const { onAplicar, onClose } = abrir();
    fireEvent.click(screen.getByText('Not now'));
    expect(onAplicar).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('quando NÃO cabe, avisa em vez de prometer alívio', () => {
    // 15 ocorrências com teto 2: não entra em 7 × 2 = 14.
    const demais = Array.from({ length: 5 }, (_, i) => ({
      id: `x${i}`, name: `Hábito ${i}`, weekDays: [0, 1, 2],
    }));
    abrir(demais, 2);
    expect(screen.getByRole('status').textContent).toMatch(/won't solve it alone/);
  });

  it('semana já equilibrada: diz isso e NÃO oferece aplicar', () => {
    abrir([
      { id: 'a', name: 'Correr', weekDays: [1] },
      { id: 'b', name: 'Ler', weekDays: [3] },
    ], 4);
    expect(screen.getByText(/already balanced/)).toBeTruthy();
    expect(screen.queryByText('Go ahead')).toBeNull();
    expect(screen.getByText('Got it')).toBeTruthy();
  });

  it('fala os DOIS idiomas', () => {
    abrir(empilhadas, 2, 'pt-BR');
    expect(screen.getByText(/Quer que eu espalhe isso pela semana/)).toBeTruthy();
    expect(screen.getByText('Pode espalhar')).toBeTruthy();
    expect(screen.getByText('Agora não')).toBeTruthy();
    cleanup();
    abrir(empilhadas, 2, 'en-US');
    expect(screen.getByText('Go ahead')).toBeTruthy();
  });
});
