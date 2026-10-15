// @vitest-environment jsdom
/**
 * QA3 — BuildingIntro para TODOS os prédios com Vínculo (`BUILDING_GATES`; o Restaurante em obra não tem portão) nos dois idiomas:
 * cada um monta, mostra 3 falas sem placeholder vazado, com arte e nome de NPC, e "Pular" fecha uma vez.
 * Lista vazia não monta nada (e não prende o voltar do Android).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { BuildingIntro } from './BuildingIntro';
import { BUILDING_INTRO_ORDER } from '../utils/buildingIntro';
import { buildingIntroView } from '../utils/buildingIntroCopy';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); });

describe('QA3 BuildingIntro: todos os prédios', () => {
  it('há prédios na ordem da fila (sanidade do harness)', () => {
    expect(BUILDING_INTRO_ORDER.length).toBeGreaterThan(10);
  });

  for (const language of ['pt-BR', 'en-US'] as const) {
    for (const id of BUILDING_INTRO_ORDER) {
      it(`${language} | ${id}: três falas, sem "{name}" nem "undefined", arte e nome presentes`, () => {
        const v = buildingIntroView(id, language);
        expect(v.lines).toHaveLength(3);
        for (const l of v.lines) {
          expect(l.trim().length).toBeGreaterThan(0);
          expect(l).not.toMatch(/\{name\}|undefined|\bnull\b|\[object/);
        }
        expect(v.npcName.trim().length).toBeGreaterThan(0);
        const onFinish = vi.fn();
        const { container } = render(<BuildingIntro ids={[id]} language={language} onFinish={onFinish} />);
        expect((container.querySelector('[data-npc-art]') as HTMLElement | null)?.getAttribute('src')).toBeTruthy();
        expect(container.textContent).not.toMatch(/undefined|\{name\}/);
        fireEvent.click(container.querySelector('[data-npc-advance]') as HTMLElement);
        fireEvent.click(container.querySelector('[data-npc-advance]') as HTMLElement);
        fireEvent.click(container.querySelector('[data-npc-advance]') as HTMLElement);
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledWith('done');
        cleanup();
      });
    }
  }

  it('todos os prédios numa sequência só: o "Pular" encerra tudo uma vez', () => {
    const onFinish = vi.fn();
    const { container } = render(<BuildingIntro ids={BUILDING_INTRO_ORDER} language="pt-BR" onFinish={onFinish} />);
    const pular = [...container.querySelectorAll('button')].find(b => /pular|skip/i.test(b.textContent ?? '')) as HTMLElement;
    fireEvent.click(pular);
    fireEvent.click(pular);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });

  it('lista vazia: não monta o diálogo (nada cobre a tela)', () => {
    const { container } = render(<BuildingIntro ids={[]} language="en-US" onFinish={() => {}} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
