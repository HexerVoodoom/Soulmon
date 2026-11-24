/**
 * OS 7 QUADRADOS DOS DIAS DA SEMANA (Dom → Sáb) — componente compartilhado.
 *
 * Nasce nos filtros de dia da Home (`DailyRituals` → `AllFilters`) e é o mesmo
 * que o "Quando" da Nova tarefa vai usar depois: um seletor só, em vez de dois
 * desenhos de "dia da semana" que divergem.
 *
 *  · É APRESENTACIONAL e controlado: recebe `days` (os selecionados) e avisa
 *    `onToggle(dia)`. Quem decide o que a seleção significa é o pai — este
 *    componente nunca grava nada nem toca em `schedule`.
 *  · `mode='multi'` — vários dias ligados ao mesmo tempo (o "Quando").
 *  · `mode='single-filter'` — filtro: no máximo um dia; o pai trata o toque no
 *    dia já ligado como "limpar" (voltar a Todos).
 *  · Dom=0 … Sáb=6, o mesmo `Date#getDay` do `schedule.days`.
 *  · Cada quadrado é um `<button>` com `aria-pressed`, alvo ≥ 44px
 *    (`.sm2-day-square`, em `index.css`, só com tokens `--sm2-*`).
 */
import type { Language } from '../utils/i18n';

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const WEEK_DAYS: readonly WeekDay[] = [0, 1, 2, 3, 4, 5, 6];

const CURTOS: Record<'pt' | 'en', readonly string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const LONGOS: Record<'pt' | 'en', readonly string[]> = {
  pt: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export interface DaySquaresProps {
  /** Dias selecionados (Dom=0 … Sáb=6). */
  days: readonly WeekDay[];
  onToggle: (day: WeekDay) => void;
  mode: 'multi' | 'single-filter';
  language: Language;
  /** Rótulo do grupo para leitor de tela. */
  groupLabel?: string;
}

export function DaySquares({ days, onToggle, mode, language, groupLabel }: DaySquaresProps) {
  const l = language === 'pt-BR' ? 'pt' : 'en';
  return (
    <div
      className="sm2-day-squares"
      role="group"
      aria-label={groupLabel ?? (l === 'pt' ? 'Dias da semana' : 'Days of the week')}
      data-day-squares={mode}
    >
      {WEEK_DAYS.map(d => {
        const on = days.includes(d);
        return (
          <button
            key={d}
            type="button"
            className="sm2-day-square"
            data-day={d}
            aria-pressed={on}
            aria-label={LONGOS[l][d]}
            onClick={() => onToggle(d)}
          >
            {CURTOS[l][d]}
          </button>
        );
      })}
    </div>
  );
}

export default DaySquares;
