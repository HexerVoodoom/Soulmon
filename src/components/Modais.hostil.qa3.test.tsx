// @vitest-environment jsdom
/**
 * QA rodada 3 — os três modais de cadastro/edição com dado hostil:
 *  · `initialData` vindo de um save velho/corrompido (esquema ausente, tipos trocados, listas com `null`);
 *  · limites do modo grátis (`activitiesCount`/`activitiesCap`) fora de faixa;
 *  · salvar nunca lança e nunca entrega ao pai um objeto com NaN/undefined no nome.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EditModal } from './EditModal';
import { TaskEditModal } from './TaskEditModal';
import { CreateModal } from './CreateModal';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const HOSTIS: Array<[string, Record<string, unknown>]> = [
  ['schedule nulo e weekDays com lixo', { schedule: null, weekDays: ['a', null, 99, -1, 1.5] }],
  ['schedule de tipo desconhecido', { schedule: { kind: 'lunar', n: 'x' } }],
  ['everyNDays com n absurdo', { schedule: { kind: 'everyNDays', n: 1e9, from: 'completion' } }],
  ['everyNDays com n negativo/NaN', { schedule: { kind: 'everyNDays', n: -5, from: 7 } }],
  ['timesPerWeek fora de faixa', { schedule: { kind: 'timesPerWeek', target: 99 } }],
  ['timesPerWeek zero', { schedule: { kind: 'timesPerWeek', target: 0 } }],
  ['weekdays vazio', { schedule: { kind: 'weekdays', days: [] } }],
  ['steps com campos de tipo errado (null é saneado por hydrateStep antes de chegar aqui)', { steps: [{}, { id: 1, label: 5, completed: 'sim' }] }],
  ['categoria desconhecida', { category: 'Astrologia' }],
  ['nome gigante', { name: 'x'.repeat(100000) }],
  ['alarme com tipo lixo', { alarm: { type: 'weekly', time: 25 } }],
  ['prazo sem hora e data lixo', { deadline: { date: 'ontem', time: '' } }],
  ['esforço fora da escala', { effort: 99 }],
  ['âncora lixo', { anchor: { kind: 'x', text: 42 } }],
];

const base = { name: 'Beber água', category: 'Health', emoji: '💧' };

describe('QA3 modais: initialData hostil não derruba a folha', () => {
  for (const [nome, over] of HOSTIS) {
    it(`EditModal | ${nome}`, () => {
      const onSave = vi.fn();
      const r = renderWithCss(<EditModal isOpen onClose={() => {}} onSave={onSave} initialData={{ ...base, ...over } as never} language="pt-BR" />);
      const salvar = screen.getByText('Salvar').closest('button') as HTMLButtonElement;
      if (!salvar.disabled) fireEvent.click(salvar);
      for (const c of onSave.mock.calls) expect(JSON.stringify(c[0])).not.toMatch(/NaN|undefined/);
      r.unmount();
    });
    it(`TaskEditModal | ${nome}`, () => {
      const onSave = vi.fn();
      const r = renderWithCss(<TaskEditModal isOpen onClose={() => {}} onSave={onSave} initialData={{ ...base, ...over } as never} language="en-US" />);
      const salvar = screen.getByText('Save').closest('button') as HTMLButtonElement;
      if (!salvar.disabled) fireEvent.click(salvar);
      r.unmount();
    });
  }

  const LIMITES: Array<[string, Record<string, unknown>]> = [
    ['teto zero', { activitiesCount: 0, activitiesCap: 0 }],
    ['teto negativo', { activitiesCount: 3, activitiesCap: -1 }],
    ['contagem acima do teto', { activitiesCount: 50, activitiesCap: 3, capIsDemoBoundary: true }],
    ['NaN', { activitiesCount: NaN, activitiesCap: NaN }],
    ['Infinity', { activitiesCount: Infinity, activitiesCap: Infinity }],
    ['sem props de limite', {}],
  ];
  for (const [nome, props] of LIMITES) {
    for (const kind of ['task', 'habit'] as const) {
      it(`CreateModal ${kind} | ${nome}: monta sem lançar e sem "NaN" na tela`, () => {
        const r = renderWithCss(
          <CreateModal isOpen initialKind={kind} onClose={() => {}} onSaveTask={() => {}} onSaveActivity={() => {}} onUnlock={() => {}} language="en-US" {...props as object} />,
        );
        expect(document.body.textContent ?? '').not.toMatch(/\bNaN\b|undefined|Infinity/);
        r.unmount();
      });
    }
  }
});
