// @vitest-environment jsdom
/**
 * QA rodada 3 — DailyReportModal com `lastDayReport` hostil. A hidratação (`GameStateContext`) só confere que
 * `date` é string: o resto do relatório chega CRU do disco/nuvem. Contrato mínimo: a folha monta sem lançar e
 * nunca escreve "NaN"/"undefined"/"Infinity"/"null"/"[object" na tela, em PT e EN, em todas as seções.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyReportModal } from './DailyReportModal';

const base = {
  date: 'Tue Oct 13 2026', done: 4, total: 6, required: 4, heartsLost: 0, wasPerfect: false, perfectDays: 3, degenerated: false,
  gaugeGain: 3, evolutionPoints: 12,
};

const HOSTIS: Array<[string, Record<string, unknown>]> = [
  ['numeros negativos', { done: -3, total: -1, required: -9, heartsLost: -2, perfectDays: -5 }],
  ['NaN/Infinity vindos de JSON? (null)', { done: null, total: null, required: null, heartsLost: null, perfectDays: null }],
  ['strings no lugar de numeros', { done: 'abc', total: '6', required: {}, heartsLost: 'x', perfectDays: [] }],
  ['gigantes', { done: 1e12, total: 1e12, required: 1e12, heartsLost: 1e9, perfectDays: 1e15, hungerHeartsLost: 1e9 }],
  ['decimais estranhos', { done: 2.5, total: 0.1, required: 1e-9, heartsLost: 0.5, hungerHeartsLost: 0.5, shieldsSpent: 2.7 }],
  ['total zero (divisao por zero)', { done: 0, total: 0, required: 0 }],
  ['done maior que total', { done: 9, total: 3, required: 3 }],
  ['acolhida com dias fora absurdos', { welcomeBack: true, daysAway: 1e9, done: 0 }],
  ['acolhida com dias fora negativos/NaN', { welcomeBack: true, daysAway: -4 }],
  ['acolhida sem daysAway', { welcomeBack: true }],
  ['perda com fome e escudos', { heartsLost: 2, hungerHeartsLost: 1, shieldsSpent: 3, weeklyRelief: true, heartsRecovered: true }],
  ['data lixo', { date: '' }],
  ['data nao-data', { date: 'not a date at all \u0000 <b>x</b>' }],
];

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const LIXO = /\bNaN\b|undefined|Infinity|\bnull\b|\[object/;

describe('QA3 DailyReportModal: relatório hostil', () => {
  for (const language of ['pt-BR', 'en-US'] as const) {
    for (const [nome, over] of HOSTIS) {
      it(`${language} | ${nome}: monta, percorre as seções e não escreve lixo`, () => {
        const onClose = vi.fn();
        const r = renderWithCss(
          <DailyReportModal report={{ ...base, ...over } as never} onClose={onClose} language={language} onPickMood={() => {}} maxHearts={3} />,
        );
        for (let i = 0; i < 4; i++) {
          expect(document.body.textContent ?? '', `seção ${i}`).not.toMatch(LIXO);
          const next = document.querySelector('[data-report-next]') as HTMLElement | null;
          if (!next) break;
          fireEvent.click(next);
        }
        r.unmount();
      });
    }
  }
});
