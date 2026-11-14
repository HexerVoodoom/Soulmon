import { describe, it, expect } from 'vitest';
import { hexIdentity, type HexOverrides } from './hexsmith';
import { chaveDaIdentidade, meleeImpactOf } from './combate/golpeImpacto';
import { SPECIAL_FAMILIES } from './combate/specials';
import type { FighterIdentity } from './fighterIdentity';

// BUG 13/11/2026 (dono): equipar a Coroa de DoT (dano ao longo do tempo) trocou o TIPO do ataque básico de Magia para Corte à
// distância. Só as Luvas podem trocar o tipo; Coroa, Amuleto e Garra trocam família/elemento e mais nada.

/** O que a cena desenha no básico (mesma expressão de ArenaGame/DungeonGame/NightmareBattle/RogueFight/GroveRaidFight). */
const impactoDoBasico = (id: FighterIdentity) => id.basico.impacto || meleeImpactOf({ element: id.basico.elemento, key: chaveDaIdentidade(id) });

const ELS = ['fogo', 'agua', 'terra', 'ar', 'arcano', 'sombra', 'luz', 'som', 'planta', 'gravidade'];
const ESCOLAS = [null, 'conjuracao', 'longo_alcance', 'benca', 'maldicao'] as const;
const identidades: FighterIdentity[] = [];
for (const el of ELS) for (const esc of ESCOLAS) for (const fam of SPECIAL_FAMILIES) {
  identidades.push({ basico: { elemento: el, escola: esc, forma: 'ranged' }, especial: { elemento: el, escola: esc, forma: 'ranged', familia: fam } });
}

describe('Hexsmith: só as Luvas trocam o tipo do ataque básico', () => {
  it('Coroa (qualquer família, inclusive dot) não troca Magia ↔ Corte do básico', () => {
    for (const id of identidades) {
      const antes = impactoDoBasico(id);
      for (const fam of SPECIAL_FAMILIES) {
        const depois = hexIdentity(id, { specialFamily: fam });
        expect(impactoDoBasico(depois), `${chaveDaIdentidade(id)} + coroa:${fam}`).toBe(antes);
        expect(depois.basico.forma).toBe(id.basico.forma);
      }
    }
  });

  it('Amuleto e Garra também não trocam o tipo (só o elemento exibido)', () => {
    for (const id of identidades) {
      const antes = impactoDoBasico(id);
      for (const hx of [{ specialElement: 'morte' }, { basicElement: 'vigor' }] as HexOverrides[]) {
        expect(impactoDoBasico(hexIdentity(id, hx))).toBe(antes);
      }
    }
  });

  it('o caso do dono existe sem a correção: a chave com a família de dot sorteia outro acabamento', () => {
    // Prova de que o teste acima morde: sem fixar, ao menos uma identidade mudaria de tipo ao equipar a Coroa de DoT.
    const mudaria = identidades.filter(id => id.especial.familia !== 'dot').some(id =>
      meleeImpactOf({ element: id.basico.elemento, key: chaveDaIdentidade(id) })
        !== meleeImpactOf({ element: id.basico.elemento, key: chaveDaIdentidade({ ...id, especial: { ...id.especial, familia: 'dot' } }) }));
    expect(mudaria).toBe(true);
  });

  it('as Luvas continuam trocando o tipo, mesmo com a Coroa', () => {
    const id = identidades[0];
    expect(hexIdentity(id, { strike: 'ranged-slash', specialFamily: 'dot' }).basico.impacto).toBe('corte');
    expect(hexIdentity(id, { strike: 'magic', specialFamily: 'dot' }).basico.impacto).toBe('concussao');
  });
});
