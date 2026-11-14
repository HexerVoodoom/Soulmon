// @vitest-environment jsdom
/**
 * §376 — "Adicionei a Walk e não apareceu" / "Hábitos pré-prontos não estão sendo adicionados" (dono, 14/11/2026).
 *
 * Causa: todo item do catálogo nasce hábito de TODO DIA (§295, `activitiesFromCatalogChoice`) e ocupa uma vaga da cota
 * (`consomeCotaDeHabito`). Com a cota cheia o portão (`commitHabitCreate` → `fitHabitCreates`) devolve 0, e o catálogo
 * fechava como se tivesse adicionado. A regra do teto NÃO muda; o que muda é que o catálogo avisa em vez de calar.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent } from '@testing-library/react';
import { aquecerRender, renderWithCss } from '../../test/renderEnv';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';
import { activitiesFromCatalogChoice, catalogHabitCapNotice } from '../../utils/catalogChoice';
import { fitHabitCreates } from '../../utils/habitCreate';
import { consomeCotaDeHabito, activityBucket } from '../../utils/atividadesLista';
import { habitCountsOn } from '../../utils/habitRhythm';
import { dayPlanView, isHiddenByPlan, bornTodayIds } from '../../utils/dayPlan';
import { FORM_REQUIREMENTS } from '../../types/progression';

beforeAll(aquecerRender, 60_000);

const walk = ACTIVITY_CATALOG.find(i => i.id === 'corpo-caminhar')!;
const CAP = FORM_REQUIREMENTS.rookie.cap; // 6
const cheia = Array.from({ length: CAP }, (_, i) => ({ id: `h${i}`, schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } }));

describe('§376 — hábito pré-pronto (Walk) e o teto', () => {
  it('a causa: todo item do catálogo ocupa a cota, e com ela cheia o portão não deixa entrar nenhum', () => {
    for (const a of activitiesFromCatalogChoice(ACTIVITY_CATALOG, false)) {
      expect(activityBucket(a)).toBe('habit');
      expect(consomeCotaDeHabito(a)).toBe(true);
    }
    const [w] = activitiesFromCatalogChoice([walk], false);
    expect(fitHabitCreates({ activities: cheia, maxActivityCap: CAP }, [w], 'paid')).toHaveLength(0);
    expect(fitHabitCreates({ activities: cheia.slice(1), maxActivityCap: CAP }, [w], 'paid')).toHaveLength(1);
  });

  it('com vaga, a Walk do catálogo é devida hoje em qualquer dia (sábado 14/11 incluído) e aparece mesmo antes da reafirmação', () => {
    const [w] = activitiesFromCatalogChoice([walk], false);
    for (let d = 9; d <= 15; d++) expect(habitCountsOn(w, undefined, new Date(2026, 10, d, 10))).toBe(true);
    const nascida = { ...w, createdAt: new Date(2026, 10, 14, 10).toISOString() };
    const view = dayPlanView({ day: '2026-11-13', offered: [], picked: [], confirmed: true }, '2026-11-14', true,
      bornTodayIds([nascida], '2026-11-14'));
    expect(isHiddenByPlan(view, w.id)).toBe(false);
  });

  it('o aviso: nulo enquanto cabe; texto claro na cota cheia (modo grátis cita o teto do demo)', () => {
    expect(catalogHabitCapNotice(CAP - 1, CAP, true)).toBeNull();
    expect(catalogHabitCapNotice(0, undefined, true)).toBeNull();
    expect(catalogHabitCapNotice(CAP, CAP, true)).toMatch(/Limite atingido.*6 de 6/);
    expect(catalogHabitCapNotice(CAP, CAP, false, true)).toMatch(/Limit reached.*Soulmon raises/);
  });

  it('cota cheia: o catálogo mostra o aviso e o "Adicionar" não dispara (antes: fechava calado)', () => {
    const onAdd = vi.fn();
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={onAdd} onCreateFromScratch={vi.fn()}
        habitsCount={CAP} habitsCap={CAP} />,
    );
    expect(document.querySelector('[data-catalog-cap]')?.textContent).toMatch(/Limite atingido/);
    expect(screen.queryAllByRole('button', { name: /^adicionar$/i })).toHaveLength(0);
    const limite = screen.getAllByRole('button', { name: /^limite$/i });
    expect(limite.length).toBe(ACTIVITY_CATALOG.length);
    fireEvent.click(limite[0]);
    expect(onAdd).not.toHaveBeenCalled();
    // A saída continua: criar o próprio (lá dá para escolher tarefa em dias específicos, sem limite).
    expect(screen.getByRole('button', { name: /criar o meu próprio hábito/i })).toBeTruthy();
  });

  it('com vaga, nada muda: sem aviso e o "Adicionar" adiciona', () => {
    const onAdd = vi.fn();
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={onAdd} onCreateFromScratch={vi.fn()}
        habitsCount={CAP - 1} habitsCap={CAP} />,
    );
    expect(document.querySelector('[data-catalog-cap]')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /^adicionar$/i })[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('App: o catálogo recebe a cota e só fecha quando o portão criou algo; a sugestão do "Hoje" só devolve o que entrou', () => {
    const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
    const bloco = app.slice(app.indexOf('<CatalogBrowserModal'), app.indexOf('onCreateFromScratch=', app.indexOf('<CatalogBrowserModal')));
    expect(bloco).toMatch(/habitsCount=\{contaCotaDeHabitos\(gameState\.activities\)\}/);
    expect(bloco).toMatch(/habitsCap=\{activityCap\}/);
    expect(bloco).toMatch(/const criados = commitHabitCreate\(/);
    expect(bloco).toMatch(/if \(criados > 0\) setCatalogBrowserOpen\(false\)/);
    expect(app).toMatch(/return novas\.slice\(0, criados\)\.map\(a => a\.id\)/);
  });
});
