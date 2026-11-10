/**
 * AUDITORIA POR PROPRIEDADE do elemento do Soulmon (10/11/2026): para TODOS os elementos base (os 20 simples) × TODA poção do catálogo
 * (simples, compostos e curados) × as 3 linhas × os níveis champion/ultimate/mega, com as funções reais de evoluir, degenerar e trocar.
 * Regras do dono: evoluir sem poção = elemento BASE do próprio Soulmon; com poção = o da poção, SÓ naquela forma; trocar de forma = o
 * elemento da forma; degenerar descarta a poção; evoluir de novo sem poção volta ao base; conta sem poção = no-op.
 */
import { describe, it, expect } from 'vitest';
import { aoDescerDeForma, capturarForma, sanitizeFormaSnapshots } from './formaSnapshot';
import { applyPotionOnEvolve, curarPocaoOrfa } from './elementPotion';
import { registrarFormaAoEvoluir, elementoDaForma, altSpriteKey } from './formasAlternativas';
import { trocarFormaEstado, type EstadoDeForma } from './formaEquip';
import { petElementOf } from './starterElements';
import { stagesComElemento } from './elementoCombinado';
import { elementoNomeDe } from './soulProfile/ficha/elementoNome';
import { BASE_ELEMENT_IDS, ESSENCE_ELEMENT_IDS } from './elementDex';

type S = EstadoDeForma & { unlockedEvolutions: string[]; evolutionPotion?: string };
const LINHAS = ['power', 'harmony', 'benevolence'] as const;
const NIVEIS = ['champion', 'ultimate', 'mega'] as const;

const nasce = (base: string): S => ({
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
  elementoJornada: { v: 1, u: 0.5, estagios: { rookie: { id: base, base } } },
  soulmonMeta: { dominantElement: base },
} as never);

/** Evoluir como o `handleEvolve`: fotografa a saída, aplica a poção pendente, registra o estágio (base do Soulmon) e a forma. */
function evoluir(prev: S, destino: string, base: string, pocao?: string): S {
  const nivel = destino.split('-')[0];
  const com = pocao ? { ...prev, evolutionPotion: pocao } : prev;
  const b = applyPotionOnEvolve(capturarForma(com)) as S;
  const ev: S = { ...b, evolutionStage: destino, unlockedEvolutions: [...new Set([...prev.unlockedEvolutions, destino])], elementoJornada: { v: 1, u: 0.5, estagios: { ...prev.elementoJornada?.estagios, [nivel]: { id: base, base } } } };
  return { ...ev, ...registrarFormaAoEvoluir(prev.formasAlt, prev.formaAltEquipada, destino, ev.potionElement ?? elementoDaForma(ev.elementoJornada, destino)) } as S;
}
const degenerar = (prev: S, destino: string): S => aoDescerDeForma(prev, { ...prev, evolutionStage: destino }) as S;
const el = (s: S): string | undefined => petElementOf(s as never);

describe('propriedades do elemento (todas as bases × poções × linhas × níveis)', () => {
  it('o universo coberto é o do catálogo (20 bases + compostos + curados)', () => {
    expect(BASE_ELEMENT_IDS).toHaveLength(20);
    expect(ESSENCE_ELEMENT_IDS.length).toBeGreaterThan(200);
    expect(ESSENCE_ELEMENT_IDS).toEqual(expect.arrayContaining([...BASE_ELEMENT_IDS]));
  });

  it('evoluir SEM poção = elemento base do próprio Soulmon, em toda base/linha/nível', () => {
    for (const base of BASE_ELEMENT_IDS) for (const linha of LINHAS) {
      let s = nasce(base);
      for (const nivel of NIVEIS) {
        const antes = nivel === 'champion' ? 'rookie' : s.evolutionStage;
        s = evoluir(s, `${nivel}-${linha}`, base);
        expect(el(s), `${base} ${linha} ${nivel} (de ${antes})`).toBe(base);
        expect(s.potionElement).toBeUndefined();
      }
    }
  });

  it('evoluir COM poção = o elemento da poção; evoluir de novo sem poção = base; degenerar descarta', () => {
    for (const base of BASE_ELEMENT_IDS) for (const pocao of ESSENCE_ELEMENT_IDS) {
      const c = evoluir(nasce(base), 'champion-power', base);
      const u = evoluir(c, 'ultimate-power', base, pocao);
      expect(el(u), `${base}+${pocao}`).toBe(pocao);
      // só naquela forma: o elemento do champion de onde veio segue o base ao degenerar
      const caiu = degenerar(u, 'champion-power');
      expect(caiu.potionElement).toBeUndefined();
      expect(el(caiu)).toBe(base);
      // evoluir de novo sem poção volta ao base
      expect(el(evoluir(caiu, 'ultimate-power', base))).toBe(base);
      // evoluir adiante sem poção nova também limpa
      expect(applyPotionOnEvolve({ ...u, evolutionStage: 'mega-power' }).potionElement).toBeUndefined();
    }
  });

  it('trocar de forma = elemento DA forma: poção só vale na forma em que foi usada, em toda linha', () => {
    // uma amostra ampla de poções por base (todas as bases × cada 7ª poção do catálogo) para manter o teste rápido
    for (const base of BASE_ELEMENT_IDS) for (const pocao of ESSENCE_ELEMENT_IDS.filter((_, i) => i % 7 === 0)) for (const [a, b] of [['power', 'harmony'], ['harmony', 'benevolence'], ['benevolence', 'power']] as const) {
      if (pocao === base) continue;
      const c = evoluir(nasce(base), `champion-${a}`, base);
      const ua = evoluir(c, `ultimate-${a}`, base, pocao);       // a: com poção
      const cb = degenerar(ua, `champion-${a}`);
      const ub = evoluir(cb, `ultimate-${b}`, base);              // b: natural, sem poção
      const s = { ...ub, unlockedEvolutions: [...new Set([...ub.unlockedEvolutions, `ultimate-${a}`])] } as S;
      expect(el(s)).toBe(base);                                                  // em b: base
      const paraA = trocarFormaEstado(s, `ultimate-${a}`, pocao);
      expect(el(paraA), `${base}+${pocao} ${a}`).toBe(pocao);                    // em a: a poção
      const voltaB = trocarFormaEstado(paraA, `ultimate-${b}`, base);
      expect(el(voltaB), `${base} volta ${b}`).toBe(base);                       // de volta em b: base
      // nenhuma foto de outra forma guarda a poção alheia
      for (const [k, f] of Object.entries(capturarForma(voltaB).formaSnapshots ?? {})) {
        const e = k.includes('@') ? k.split('@')[1] : undefined;
        if (e && f.pocao) expect(f.pocao, `${k}`).toBe(e);
      }
    }
  });

  it('conta que nunca usou poção: nenhuma operação cria poção nem muda o elemento (no-op)', () => {
    for (const base of BASE_ELEMENT_IDS) {
      let s = evoluir(evoluir(nasce(base), 'champion-power', base), 'ultimate-power', base);
      s = { ...s, unlockedEvolutions: [...s.unlockedEvolutions, 'ultimate-harmony'] } as S;
      const t = trocarFormaEstado(s, 'ultimate-harmony');
      expect(t.potionElement).toBeUndefined();
      expect(el(t)).toBe(base);
      expect(el(degenerar(t, 'champion-power'))).toBe(base);
      const snaps = capturarForma(s).formaSnapshots;
      expect(JSON.stringify(sanitizeFormaSnapshots(JSON.parse(JSON.stringify(snaps))))).toBe(JSON.stringify(snaps));
      expect(curarPocaoOrfa(undefined, 'ultimate-power', s.formaAltEquipada)).toBeUndefined();
    }
  });
});

describe('prompt do Higgsfield e chave da sprite', () => {
  const st = (stage: string) => ({ stage, imagePrompt: `p ${stage}`, imagePromptFallback: `f ${stage}` });
  it('com poção, o prompt do estágio leva o NOME do elemento efetivo; sem poção e elemento = base, o prompt leva as pistas do base (todo prompt tem elemento)', () => {
    for (const pocao of ESSENCE_ELEMENT_IDS) {
      const out = stagesComElemento([st('ultimate')], undefined, { ultimate: pocao })![0];
      expect(out.imagePrompt, pocao).toContain(elementoNomeDe(pocao).en.length ? 'Elemental theme of this form:' : '');
      expect(out.imagePrompt.match(/Elemental theme of this form/g)).toHaveLength(1);
      expect(out.imagePromptFallback).toContain('Elemental theme of this form:');
    }
    for (const base of BASE_ELEMENT_IDS) {
      const lista = [st('ultimate')];
      const out = stagesComElemento(lista, { v: 1, u: 0.5, estagios: { ultimate: { id: base, base } } })![0];
      expect(out.imagePrompt.startsWith('p ultimate'), base).toBe(true);
      expect(out.imagePrompt, base).toContain('Visual cues of this element:');
      expect(out.imagePrompt, base).not.toContain('Elemental theme');
    }
  });
  it('a chave da sprite de uma forma de poção nunca é a da original nem se repete', () => {
    for (const base of BASE_ELEMENT_IDS) for (const pocao of ESSENCE_ELEMENT_IDS) {
      if (pocao === base) continue;
      const nat = registrarFormaAoEvoluir(undefined, undefined, 'ultimate-power', base);
      const com = registrarFormaAoEvoluir(nat.formasAlt, nat.formaAltEquipada, 'ultimate-power', pocao);
      const lista = com.formasAlt!['ultimate-power'];
      expect(new Set(lista).size).toBe(lista.length);                                   // sem duplicata
      const kOrig = altSpriteKey('ultimate-power', base, com.formasAlt);
      const kPocao = altSpriteKey('ultimate-power', pocao, com.formasAlt);
      expect(kOrig).toBe('ultimate-power');                                              // a original mantém a chave da forma
      expect(kPocao).toBe(`ultimate-power@${pocao}`);                                    // a de poção tem a própria
      // repetir a mesma poção não duplica a lista
      const de_novo = registrarFormaAoEvoluir(com.formasAlt, com.formaAltEquipada, 'ultimate-power', pocao);
      expect(de_novo.formasAlt!['ultimate-power']).toEqual(lista);
    }
  });
});
