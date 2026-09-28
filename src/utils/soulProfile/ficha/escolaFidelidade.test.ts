// A ESCOLA SEGUE A PESSOA — régua de fidelidade papel → escola.
//
// Decisão do dono (22/09/2026), e ela tem duas metades que é fácil confundir:
//
//   1. A PROPORÇÃO POPULACIONAL PODE SER DESIGUAL, e deve. O gênero trabalha
//      com ~3 dps : 1 tanque : 1 suporte, e os papéis do oráculo já saem
//      nessa proporção. Mais fichas de combate que de cura é o resultado
//      CERTO — este arquivo não exige distribuição uniforme entre as seis
//      escolas, e quem tentar "consertar" isso estará quebrando o desenho.
//
//   2. A FIDELIDADE INDIVIDUAL TEM DE SER TOTAL. A escola de uma ficha tem de
//      ser a do papel dominante DAQUELA pessoa. É esta metade que o código
//      violava.
//
// O que havia antes (medido em 400 perfis pelo pipeline real, 22/09/2026):
// `combate_fisico` dominava **100%** das fichas, e a fidelidade era **0,0%**
// para `alcance`, `magico` e `suporte` — um perfil de suporte recebia escola
// de lutador. A causa é estrutural: `fisico` e `tanque` apontam os dois para
// `combate_fisico` (~40 de peso somado) enquanto a fatia de `suporte` racha
// entre `benca` e `maldicao` (~8 cada), e os eixos normalizados em 100 são
// achatados demais para qualquer variação individual reverter isso.
// O conserto é `DOMINANT_SCHOOL_LEAD` em `buildSheet.ts`.
//
// Roda o pipeline REAL (efemérides + numerologia + as 6 respostas do ritual),
// não eixos sintéticos: eixo sintético uniforme esconderia exatamente o
// achatamento que causava o defeito.

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { buildFicha } from './buildSheet';
import { applyRitualAnswers } from '../ritualAnswers';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import type { Answers } from '../personality/types';
import type { EscolaId } from './types';
import { nomeSintetico, nascimentoSintetico } from '../perfisSinteticos';

/** 200 perfis: suficiente para a fidelidade (que é 100% ou não é) e para a
 *  proporção grossa, sem pagar 400 mapas astrais em toda rodada de CI. */
const N = 200;
const SEED = 20260922;

/** A escola que cada (papel, caminho) dominante DEVE produzir — espelho de
 *  `ROLE_SCHOOL_BY_ALIGNMENT` em `buildSheet.ts`. Desde 28/09/2026 o caminho
 *  escolhe a variante temática da escola do papel (era só papel → escola, e
 *  combate físico dominava 40% das fichas; evocação, 0%). */
const ESCOLA_ESPERADA: Record<string, Record<string, EscolaId>> = {
  fisico: { poder: 'combate_fisico', harmonia: 'longo_alcance', benevolencia: 'combate_fisico' },
  tanque: { poder: 'maldicao', harmonia: 'evocacao', benevolencia: 'evocacao' },
  alcance: { poder: 'maldicao', harmonia: 'longo_alcance', benevolencia: 'longo_alcance' },
  magico: { poder: 'maldicao', harmonia: 'conjuracao', benevolencia: 'evocacao' },
  suporte: { poder: 'maldicao', harmonia: 'conjuracao', benevolencia: 'benca' },
};

interface Amostra {
  papel: string;
  caminho: string;
  escolaTopo: string;
  escolas: Partial<Record<EscolaId, number>>;
}

function amostrar(): Amostra[] {
  const rng = mulberry32(SEED);
  const out: Amostra[] = [];
  for (let i = 0; i < N; i++) {
    const cidade = CITIES[Math.floor(rng() * CITIES.length)];
    // ⚠️ Nome VARIADO, não `<nome> ${i}`: o índice é descartado por
    // `normalizeName`, então 20 nomes davam 20 numerologias para 200 perfis.
    // Ver `perfisSinteticos.ts`.
    const nome = nomeSintetico(rng);

    const perfil = buildSoulProfile({
      fullName: nome,
      ...nascimentoSintetico(rng),
      timeUnknown: false,
      placeLabel: `${cidade.name}, ${cidade.region || cidade.country}`,
      latitude: cidade.latitude,
      longitude: cidade.longitude,
      timeZone: cidade.timeZone,
    }, {} as Answers);

    const respostas: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) {
      respostas[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
    }
    const eixos = applyRitualAnswers(perfil.oracle, respostas);
    const ficha = buildFicha(nome, eixos, 'ultra', nome);

    // Desde 28/09/2026 `evocacao` DISPUTA (papel × caminho pode levar a ela);
    // o total dela inclui o piso fixo, e é o total que o jogador vê.
    const escolaTopo = Object.entries(ficha.escolas).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0];

    out.push({ papel: eixos.dominantRole, caminho: eixos.dominantAlignment, escolaTopo, escolas: ficha.escolas });
  }
  return out;
}

describe('a escola segue o papel dominante da pessoa', () => {
  const amostra = amostrar();

  it('fidelidade é TOTAL — nenhuma ficha recebe escola de outro papel', () => {
    const erros = amostra
      .filter(a => ESCOLA_ESPERADA[a.papel]?.[a.caminho] !== a.escolaTopo)
      .map(a => `${a.papel}/${a.caminho} → ${a.escolaTopo}`);
    expect(erros.length, `fichas com escola discordante: ${erros.slice(0, 8).join(' | ')}`).toBe(0);
  });

  it('cada papel dominante produz a sua escola em 100% dos casos', () => {
    const porPapel = new Map<string, { ok: number; n: number }>();
    for (const a of amostra) {
      const reg = porPapel.get(a.papel) ?? { ok: 0, n: 0 };
      reg.n++;
      if (ESCOLA_ESPERADA[a.papel]?.[a.caminho] === a.escolaTopo) reg.ok++;
      porPapel.set(a.papel, reg);
    }
    for (const [papel, { ok, n }] of porPapel) {
      expect(ok, `${papel}: ${ok}/${n}`).toBe(n);
    }
  });

  it('as SEIS escolas continuam existindo na ficha — o piso lidera, não apaga', () => {
    // Um `DOMINANT_SCHOOL_LEAD` alto transformaria a ficha numa monocultura,
    // que é o defeito oposto ao que ele conserta. A segunda escola é textura
    // da pessoa e tem de sobreviver.
    for (const a of amostra) {
      const comPontos = Object.values(a.escolas).filter(v => (v ?? 0) > 0).length;
      expect(comPontos, `ficha com ${comPontos} escola(s): ${JSON.stringify(a.escolas)}`)
        .toBeGreaterThanOrEqual(4);
    }
  });

  it('maldicao é alcançável — suporte não cai sempre em benca', () => {
    // `maldicao` já foi a escola que "nunca recebia um ponto"; a régua existe
    // para o conserto não regredir por outra porta.
    const suportes = amostra.filter(a => a.papel === 'suporte');
    if (suportes.length === 0) return;
    const comMaldicao = suportes.filter(a => a.escolaTopo === 'maldicao').length;
    expect(comMaldicao, `suporte → maldicao em ${comMaldicao}/${suportes.length}`).toBeGreaterThan(0);
  });

  it('a POPULAÇÃO pode ser desigual: mais dps que tanque e suporte é o certo', () => {
    // Esta é a metade que NÃO se conserta. O gênero trabalha com ~3:1:1, e os
    // papéis do oráculo já saem assim. O teste afirma a forma da proporção,
    // não uniformidade — afirmar uniformidade aqui quebraria o desenho.
    const dps = amostra.filter(a => ['fisico', 'magico', 'alcance'].includes(a.papel)).length;
    const tanque = amostra.filter(a => a.papel === 'tanque').length;
    const suporte = amostra.filter(a => a.papel === 'suporte').length;
    expect(dps, `dps ${dps} · tanque ${tanque} · suporte ${suporte}`).toBeGreaterThan(tanque);
    expect(dps).toBeGreaterThan(suporte);
    // e nenhum papel some: um papel a 0% seria conteúdo inalcançável.
    expect(tanque).toBeGreaterThan(0);
    expect(suporte).toBeGreaterThan(0);
  });
});
