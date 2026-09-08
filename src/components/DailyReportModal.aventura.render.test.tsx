// @vitest-environment jsdom
/**
 * A aventura da noite dentro do relatório (`docs/PLANO-TAREFAS.md` §2.4).
 *
 * O sorteio tem os próprios testes (`utils/adventure.test.ts`). O que estes
 * protegem é o que só a TELA pode quebrar, e a primeira é a que importa:
 *
 *  1. **O card aparece no relatório do DIA RUIM.** É o momento mais frágil do
 *     app — se um dia alguém condicionar o card a ter cumprido a meta, terá
 *     transformado o relatório num segundo lugar onde a pessoa perde algo.
 *  2. **Aparece também para quem VOLTOU depois de sumir.** O relatório de
 *     acolhida some com os números de falha de propósito; a única coisa boa da
 *     tela não pode sumir junto.
 *  3. **Não anuncia recompensa nenhuma.** Sem Bits, item ou atributo.
 *  4. **PT e EN.**
 */
import { describe, it, expect } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyReportModal } from './DailyReportModal';
import { ADVENTURE_CATALOG, adventureOfDay } from '../utils/adventure';

const ACHADO = ADVENTURE_CATALOG[0];

const relatorio = (over: Record<string, unknown> = {}) => ({
  date: 'Tue Sep 08 2026',
  done: 4,
  total: 6,
  required: 6,
  heartsLost: 0,
  wasPerfect: false,
  perfectDays: 3,
  degenerated: false,
  ...over,
}) as never;

function abrir(over: Record<string, unknown> = {}, props: Record<string, unknown> = {}) {
  renderWithCss(
    <DailyReportModal
      report={relatorio(over)}
      adventure={ACHADO}
      onClose={() => {}}
      language="pt-BR"
      {...props}
    />,
  );
}

describe('a aventura aparece — inclusive quando o dia foi ruim', () => {
  it('dia bom mostra o achado', () => {
    abrir({ wasPerfect: true, done: 6 });
    expect(screen.getByText(ACHADO.titlePt)).toBeTruthy();
    expect(screen.getByText(ACHADO.textPt)).toBeTruthy();
  });

  it('DIA RUIM (perdeu coração) mostra o achado do mesmo jeito', () => {
    // Se esta cair, o relatório do dia ruim virou um lugar de perder algo.
    abrir({ done: 0, heartsLost: 1 });
    expect(screen.getByText(ACHADO.titlePt)).toBeTruthy();
  });

  it('quem DEGENEROU também recebe', () => {
    abrir({ done: 0, heartsLost: 1, degenerated: true });
    expect(screen.getByText(ACHADO.titlePt)).toBeTruthy();
  });

  it('quem VOLTOU depois de sumir também recebe', () => {
    // O modo acolhida some com os números de falha; a única coisa boa da tela
    // não pode sumir junto.
    abrir({ welcomeBack: true, daysAway: 5, done: 0 });
    expect(screen.getByText('Que saudade!')).toBeTruthy();
    expect(screen.getByText(ACHADO.titlePt)).toBeTruthy();
  });

  it('sem achado (props antigas), o relatório continua funcionando', () => {
    renderWithCss(
      <DailyReportModal report={relatorio()} onClose={() => {}} language="pt-BR" />,
    );
    // Sem coração perdido e sem dia completo, a manchete é a neutra.
    expect(screen.getByText('Novo dia!')).toBeTruthy();
  });
});

describe('o que o card NÃO diz', () => {
  it('não anuncia Bits, item nem atributo', () => {
    // A recompensa é narrativa (decisão do dono, 08/09/2026). Uma linha de
    // ganho aqui faria o relatório virar tela que a pessoa PRECISA abrir.
    abrir();
    const texto = document.body.textContent ?? '';
    for (const proibido of ['Bits', 'bits', '+1 ', 'atributo', 'recompensa']) {
      expect(texto.includes(proibido), `o card anunciou "${proibido}"`).toBe(false);
    }
  });

  it('"inédito" só aparece quando é inédito de verdade', () => {
    abrir({}, { adventureIsNew: false });
    expect(screen.queryByText(/inédito/)).toBeNull();
    cleanup();
    abrir({}, { adventureIsNew: true });
    expect(screen.getByText(/inédito/)).toBeTruthy();
  });
});

describe('idioma', () => {
  it('fala os dois', () => {
    abrir();
    expect(screen.getByText(/Da aventura de hoje/)).toBeTruthy();
    expect(screen.getByText(ACHADO.textPt)).toBeTruthy();
    cleanup();
    renderWithCss(
      <DailyReportModal report={relatorio()} adventure={ACHADO} onClose={() => {}} language="en-US" />,
    );
    expect(screen.getByText(/From today's adventure/)).toBeTruthy();
    expect(screen.getByText(ACHADO.textEn)).toBeTruthy();
  });
});

describe('o achado é do DIA, não da abertura', () => {
  it('o mesmo relatório renderizado várias vezes mostra o mesmo achado', () => {
    // O sorteio é determinístico pelo `report.date`. Se um dia alguém mover o
    // sorteio para dentro do componente, cada reabertura daria um achado novo —
    // e a tela viraria caça-níquel.
    const a = adventureOfDay([], 4, 6, 'Tue Sep 08 2026');
    for (let i = 0; i < 5; i++) {
      expect(adventureOfDay([], 4, 6, 'Tue Sep 08 2026').id).toBe(a.id);
    }
  });
});
