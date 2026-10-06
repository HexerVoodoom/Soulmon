/**
 * PR14 — a família do especial é ESTÁVEL: só muda com mudança forte de perfil (elemento ou galho dominante).
 * Mede a taxa de troca por evolução nas fichas de teste e trava o teto (meta do dono: <= ~20-25%).
 */
import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { buildFicha } from './buildSheet';
import { applyRitualAnswers } from '../ritualAnswers';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import type { Answers } from '../personality/types';
import { nomeSintetico, nascimentoSintetico } from '../perfisSinteticos';
import { CLASS_ELEMENT_ORDER } from '../types';
import { CUSTO_PONTO_PAR } from './cascata';
import { SPECIAL_FAMILIES } from '../../combate/specials';
import { familiaDoEspecial } from './nomeEspecial';
import { escolaDominante } from './skills';
import { FICHA_STAGE_ORDER, type EscolaSkillId } from './types';
import {
  LIMIARES, TETO_TAXA_TROCA, elementoDominanteDe, elementoMudouDeVerdade, familiasDaJornada, galhoDominanteDe,
  galhoMudouDeVerdade, mesmaLinhagem, perfilMudouForte, type Galho, type PerfilEstagio,
} from './estabilidadeFamilia';

const perfil = (elementos: Record<string, number>, galhos?: Partial<Record<Galho, number>>): PerfilEstagio => ({ elementos, galhos });

describe('regra de estabilidade: limiares nomeados', () => {
  it('mesmo perfil = não mudou', () => {
    const p = perfil({ fogo: 5, agua: 3 }, { poder: 5, harmonia: 3, benevolencia: 2 });
    expect(perfilMudouForte(p, p)).toBe(false);
  });

  it('empate apertado que vira NÃO conta (histerese por margem)', () => {
    const ant = perfil({ fogo: 5.2, agua: 5 });
    const atual = perfil({ fogo: 5, agua: 5.3 });
    expect(elementoDominanteDe(atual.elementos)).toBe('agua');
    expect(elementoMudouDeVerdade(ant, atual)).toBe(false);
  });

  it('troca clara de elemento dominante conta', () => {
    const ant = perfil({ fogo: 8, agua: 2 });
    const atual = perfil({ fogo: 2, agua: 8 });
    expect(elementoMudouDeVerdade(ant, atual)).toBe(true);
    expect(perfilMudouForte(ant, atual)).toBe(true);
  });

  it('o par que REFINA a base dominante é a mesma linhagem: não conta', () => {
    expect(mesmaLinhagem('fogo', 'vapor')).toBe(true);
    expect(mesmaLinhagem('vapor', 'fogo')).toBe(true);
    expect(mesmaLinhagem('fogo', 'gelo')).toBe(false);
    expect(elementoMudouDeVerdade(perfil({ fogo: 9, agua: 1 }), perfil({ vapor: 9, fogo: 2 }))).toBe(false);
  });

  it('galho: liderança curta não conta; liderança clara com deslocamento conta', () => {
    const ant = perfil({ fogo: 1 }, { poder: 50, harmonia: 30, benevolencia: 20 });
    expect(galhoDominanteDe(ant.galhos)?.id).toBe('poder');
    expect(galhoMudouDeVerdade(ant, perfil({ fogo: 1 }, { poder: 36, harmonia: 40, benevolencia: 24 }))).toBe(false);
    expect(galhoMudouDeVerdade(ant, perfil({ fogo: 1 }, { poder: 20, harmonia: 20, benevolencia: 60 }))).toBe(true);
  });

  it('sem pontos de galho (ou lixo): a regra do galho não dispara e nada quebra', () => {
    const a = perfil({ fogo: 1 }), b = perfil({ fogo: 1 }, { poder: 0, harmonia: 0, benevolencia: 0 });
    expect(galhoMudouDeVerdade(a, b)).toBe(false);
    expect(galhoMudouDeVerdade(b, perfil({ fogo: 1 }, { poder: NaN, harmonia: -3, benevolencia: 1 }))).toBe(false);
    expect(elementoMudouDeVerdade(perfil({}), perfil({ fogo: 1 }))).toBe(false);
  });

  it('os limiares são frações válidas', () => {
    for (const v of Object.values(LIMIARES)) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(1); }
  });
});

describe('família ao longo da jornada', () => {
  const stages = FICHA_STAGE_ORDER;
  const escolas = stages.map(() => 'conjuracao' as EscolaSkillId);
  const els = stages.map(() => 'fogo');

  it('perfil que não muda = a família do estágio 1 em todos os 5; estágio 1 = sorteio da seed (como hoje)', () => {
    const p = perfil({ fogo: 5, agua: 2 }, { poder: 4, harmonia: 3, benevolencia: 3 });
    const j = familiasDaJornada({ seedKey: 's1', escolas, elementosEspecial: els, perfis: stages.map(() => p), stages });
    expect(new Set(j.map(x => x.familia)).size).toBe(1);
    expect(j.every(x => !x.trocou)).toBe(true);
    expect(j[0].familia).toBe(familiaDoEspecial({ escola: 'conjuracao', elementoId: 'fogo', seedKey: 's1', stage: stages[0] }));
  });

  it('mudança forte troca a família (nunca para a mesma) e a nova vale até a próxima mudança', () => {
    const a = perfil({ fogo: 8, agua: 1 }), b = perfil({ fogo: 1, agua: 8 });
    for (let s = 0; s < 60; s++) {
      const j = familiasDaJornada({ seedKey: `k${s}`, escolas, elementosEspecial: els, perfis: [a, a, b, b, b], stages });
      expect(j.map(x => x.trocou)).toEqual([false, false, true, false, false]);
      expect(j[2].familia).not.toBe(j[1].familia);
      expect(j[3].familia).toBe(j[2].familia); expect(j[4].familia).toBe(j[2].familia);
      expect(SPECIAL_FAMILIES).toContain(j[2].familia);
    }
  });

  it('determinístico: mesma entrada = mesma sequência', () => {
    const e = { seedKey: 'x', escolas, elementosEspecial: els, perfis: [perfil({ fogo: 8, agua: 1 }), perfil({ agua: 8, fogo: 1 }), perfil({ fogo: 8, agua: 1 }), perfil({ fogo: 8 }), perfil({ terra: 9 })], stages };
    expect(familiasDaJornada(e)).toEqual(familiasDaJornada({ ...e }));
  });
});

describe('medição: taxa de troca por evolução nas fichas de teste', () => {
  const N = 200, SEED = 20261006;

  function amostrar() {
    const rng = mulberry32(SEED);
    const out: Array<{ perfis: PerfilEstagio[]; escolas: EscolaSkillId[]; els: string[]; seedKey: string; tendencia: string }> = [];
    for (let i = 0; i < N; i++) {
      const cidade = CITIES[Math.floor(rng() * CITIES.length)];
      const nome = nomeSintetico(rng);
      const p = buildSoulProfile({
        fullName: nome, ...nascimentoSintetico(rng), timeUnknown: false,
        placeLabel: `${cidade.name}, ${cidade.region || cidade.country}`,
        latitude: cidade.latitude, longitude: cidade.longitude, timeZone: cidade.timeZone,
      }, {} as Answers);
      const resp: Record<string, string> = {};
      for (const q of ORACLE_QUESTIONS) resp[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
      const eixos = applyRitualAnswers(p.oracle, resp);
      const base = new Set<string>(CLASS_ELEMENT_ORDER);
      const perfis: PerfilEstagio[] = [], escolas: EscolaSkillId[] = [], els: string[] = [];
      for (const st of FICHA_STAGE_ORDER) {
        const f = buildFicha(nome, eixos, st, nome);
        const pesos: Record<string, number> = {};
        for (const [id, pts] of Object.entries(f.elementos)) pesos[id] = (pts ?? 0) * (base.has(id) ? 1 : CUSTO_PONTO_PAR);
        perfis.push({ elementos: pesos, galhos: eixos.alignments });
        escolas.push(escolaDominante(f));
        els.push(elementoDominanteDe(pesos) ?? 'fogo');
      }
      out.push({ perfis, escolas, els, seedKey: nome, tendencia: eixos.dominantElement });
    }
    return out;
  }

  it('pipeline real (N=200 x 4 evoluções): a troca é RARA (teto declarado) e todo estágio tem família das 7', () => {
    const fichas = amostrar();
    let evolucoes = 0, trocas = 0, porElemento = 0;
    const porEvolucao = [0, 0, 0, 0];
    const dist: Record<number, number> = {};
    for (const f of fichas) {
      const j = familiasDaJornada({ seedKey: f.seedKey, escolas: f.escolas, elementosEspecial: f.els, perfis: f.perfis, stages: FICHA_STAGE_ORDER, tendencia: f.tendencia });
      let n = 0;
      j.slice(1).forEach((x, i) => {
        evolucoes++;
        expect(SPECIAL_FAMILIES).toContain(x.familia);
        if (x.trocou) { trocas++; n++; porEvolucao[i]++; if (elementoMudouDeVerdade(f.perfis[i], f.perfis[i + 1])) porElemento++; }
      });
      dist[n] = (dist[n] ?? 0) + 1;
    }
    const taxa = trocas / evolucoes;
    console.info(`[PR14] N=${N} evolucoes=${evolucoes} trocas=${trocas} taxa=${(taxa * 100).toFixed(1)}% porElemento=${porElemento} por evolucao(R>C,C>U,U>M,M>X)=${porEvolucao.join('/')} trocas por jornada=${JSON.stringify(dist)}`);
    expect(taxa).toBeLessThanOrEqual(TETO_TAXA_TROCA);
  });

  it('com deriva de galho simulada (cada galho oscila até ±0,15 por estágio) a troca continua rara', () => {
    const rng = mulberry32(SEED + 1);
    let evolucoes = 0, trocas = 0;
    for (let i = 0; i < 2000; i++) {
      const g = [rng(), rng(), rng()].map(v => 0.2 + v * 0.6);
      const perfis: PerfilEstagio[] = FICHA_STAGE_ORDER.map(() => {
        const v = g.map(x => Math.max(0.01, x + (rng() - 0.5) * 0.3));
        return perfil({ fogo: 1 }, { poder: v[0], harmonia: v[1], benevolencia: v[2] });
      });
      for (let s = 1; s < perfis.length; s++) { evolucoes++; if (galhoMudouDeVerdade(perfis[s - 1], perfis[s])) trocas++; }
    }
    const taxa = trocas / evolucoes;
    console.info(`[PR14] deriva simulada: evolucoes=${evolucoes} trocas=${trocas} taxa=${(taxa * 100).toFixed(1)}%`);
    expect(taxa).toBeLessThanOrEqual(TETO_TAXA_TROCA);
  });
});
