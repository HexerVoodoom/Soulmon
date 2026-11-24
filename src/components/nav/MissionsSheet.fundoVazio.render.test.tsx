// @vitest-environment jsdom
/** Modal de Missões: fundo VAZIO (turquesa liso, sem textura) e a Ambra (NPC de função) continua. */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { CROSSINGS_EMPTY } from '../../types/travessias';

afterEach(cleanup);

describe('MissionsSheet: fundo vazio', () => {
  it('a moldura tem a classe --vazio, sem pedra, e o NPC segue', () => {
    render(
      <MissionsSheet initialTab="daily" open onClose={() => {}} language="pt-BR" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()}
        todayKey="2026-10-07" weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }}
        buildings={{ state: undefined, day: '2026-10-07', bondLevel: 1, onClaim: vi.fn() }} />,
    );
    const f = document.querySelector('[data-moldura-modal]')!;
    expect(f.getAttribute('data-moldura-fundo')).toBe('vazio');
    expect(f.classList.contains('sm2-moldura-modal--vazio')).toBe(true);
    expect(f.classList.contains('sm2-moldura-modal--pedra')).toBe(false);
    expect(document.querySelector('[data-area-sheet-npc]')).not.toBeNull();
  });
});
