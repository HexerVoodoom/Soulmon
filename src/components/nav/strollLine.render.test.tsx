// @vitest-environment jsdom
/** REGISTRO §413: a linha do passeio na Home — "Stroll" em turquesa + qual é o passeio, e "Done" direto no cartão (mesmo caminho do NPC). */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { strollEntries } from './StrollQuestLine';
import { CROSSINGS_EMPTY } from '../../types/travessias';
import { dailyOffer, markDone, pickMission } from '../../utils/travessias';
import { travessiaTitle } from '../../utils/travessiaTitles';

const DAY = '2026-11-16';
const NOW = Date.now();
const m = dailyOffer(DAY, 's')[0];
const escolhida = { ...CROSSINGS_EMPTY, ...pickMission(CROSSINGS_EMPTY, DAY, 's', m.region.id, m.challenge.id, NOW) };
const mostra = (crossings: typeof escolhida, lang: 'en-US' | 'pt-BR' = 'en-US', onDone = vi.fn()) =>
  render(<ul>{strollEntries({ language: lang, crossings, todayKey: DAY, onClaim: () => {}, onDone }).map(e => e.node)}</ul>);

afterEach(cleanup);

describe('linha "Stroll" da Home', () => {
  it('escolhido: "Stroll" no token turquesa + o nome do passeio; o "Done" conclui', () => {
    const onDone = vi.fn();
    const { container } = mostra(escolhida, 'en-US', onDone);
    const palavra = container.querySelector('[data-stroll-word]') as HTMLElement;
    expect(palavra.textContent).toBe('Stroll');
    expect(palavra.style.color).toBe('var(--sm2-primary-ink)');
    expect(container.textContent).toContain(travessiaTitle(m.challenge.id, false)!);
    fireEvent.click(container.querySelector('[data-stroll-done]') as HTMLButtonElement);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('PT-BR: "Passeio" + o nome', () => {
    const { container } = mostra(escolhida, 'pt-BR');
    expect(container.querySelector('[data-stroll-word]')!.textContent).toBe('Passeio');
  });
  it('sem passeio escolhido: só aponta, sem "Done"', () => {
    const { container } = mostra({ ...CROSSINGS_EMPTY });
    expect(container.textContent).toContain('Take a stroll');
    expect(container.querySelector('[data-stroll-done]')).toBeNull();
  });
  it('feito hoje: sem "Done" (resgatada), o nome segue na linha', () => {
    const feito = markDone(escolhida, DAY, NOW);
    const { container } = mostra({ ...feito, claimDay: DAY });
    expect(container.querySelector('[data-stroll-done]')).toBeNull();
    expect(container.querySelector('[data-stroll-word]')).not.toBeNull();
  });
});
