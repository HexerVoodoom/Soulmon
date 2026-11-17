import { describe, it, expect } from 'vitest';
import { ENEMY_ROSTER, pickEnemy, rosterEntryOfKey } from './enemyRoster';
import { NOVOS_DATA, FORMAS_ALTAS } from './novosSoulmonData';
import { LEGADO_DATA } from './enemyRosterLegado.data';
import { RAMOS_ART } from './enemyRosterArt';
import { rosterSpriteOf } from './novosSoulmon';

describe('ramos LEGADOS (REGISTRO §445, 16/11/2026): as formas antigas de 5 linhas em outro elemento', () => {
  const esperado = [
    ['lgvibri', 'som', 'ar', ['Zephrill', 'Zephwing', 'Zephmoth']],
    ['lgvoltrix', 'eletricidade', 'espaco', ['Voidspark', 'Voidserp', 'Voidhalo']],
    ['lgchronib', 'tempo', 'industrial', ['Smeltoise', 'Smeltick', 'Smeltgryph']],
    ['lgrunix', 'arcano', 'luz', ['Solimur', 'Solowl', 'Solsphinx']],
    ['lgkenjo', 'marcial', 'agua', ['Bubbonin', 'Bubbotrident', 'Bubbohydra']],
  ] as const;
  const legados = ENEMY_ROSTER.filter(e => e.artFile?.startsWith('legado/'));
  it('15 entradas (5 × champion/ultimate/mega): id, hospedeiro, nome e arquivo exatos; PT = EN (um nome só, como os outros ramos)', () => {
    expect(LEGADO_DATA).toHaveLength(5);
    expect(legados).toHaveLength(15);
    for (const [id, origem, host, nomes] of esperado) {
      (['champion', 'ultimate', 'mega'] as const).forEach((stage, i) => {
        const e = rosterEntryOfKey(`${id}-${stage}`)!;
        expect(e, `${id}-${stage}`).toBeDefined();
        expect([e.id, e.stage, e.kind, e.element, e.name, e.artFile]).toEqual([id, stage, 'ramo', host, nomes[i], `legado/${id}-${stage}`]);
        expect(e.elements).toEqual([host]);
        expect(e.basico).toBe(NOVOS_DATA.find(n => n.element === host)!.basico);
        expect(rosterSpriteOf(e), e.key).toBe(RAMOS_ART[`legado/${id}-${stage}`]);
        expect(rosterSpriteOf(e), e.key).toBeTruthy();
      });
      expect(LEGADO_DATA.find(d => d[0] === id)![1]).toBe(origem);
    }
  });
  it('id novo sem hífen, fora do elemento de origem, e nenhum nome repete o de outra espécie (nem as formas altas das linhas)', () => {
    const outrosNomes = ENEMY_ROSTER.filter(e => !legados.includes(e)).map(e => e.name.toLowerCase());
    const altos = Object.values(FORMAS_ALTAS).flatMap(o => Object.values(o)).map(n => n.toLowerCase());
    for (const [id, origem, host] of LEGADO_DATA) {
      expect(id).toMatch(/^lg[a-z]+$/);
      expect(host).not.toBe(origem);
      expect(ENEMY_ROSTER.filter(e => e.id === id)).toHaveLength(3);
    }
    for (const e of legados) {
      expect(outrosNomes).not.toContain(e.name.toLowerCase());
      expect(altos).not.toContain(e.name.toLowerCase());
    }
  });
  it('ficam NO FIM do roster (o #N do Bestiário das entradas antigas não muda)', () => {
    expect(ENEMY_ROSTER.slice(-15)).toEqual(legados);
  });
  it('entram nos pools que já recebem ramos: sorteio comum (champion/ultimate/mega) e o do elemento do hospedeiro; nunca em rookie', () => {
    for (const stage of ['champion', 'ultimate', 'mega'] as const) {
      const vistos = new Set<string>();
      for (let i = 0; i < 30000; i++) { const e = pickEnemy(30, () => (i + 0.5) / 30000, { stage }); if (e.artFile?.startsWith('legado/')) vistos.add(e.key); }
      expect(vistos.size, stage).toBe(5);
      for (const [id, , host] of esperado) {
        const deHost = new Set<string>();
        for (let i = 0; i < 4000; i++) deHost.add(pickEnemy(30, () => (i + 0.5) / 4000, { stage, element: host }).key);
        expect(deHost.has(`${id}-${stage}`), `${id}-${stage} no pool de ${host}`).toBe(true);
      }
    }
    expect(legados.some(e => (e.stage as string) === 'rookie')).toBe(false);
  });
});
