// ---------------------------------------------------------------------------
// As 6 respostas do ritual, aplicadas sobre os EIXOS da leitura.
//
// Por que este arquivo existe: o `generateOracle` sempre reaplicou as respostas
// do ritual por cima dos eixos, mas só nas cópias LOCAIS dele. Tudo que o
// pipeline novo derivou — ficha do class-system, companheiro, as duas skills
// por estágio e a linhagem do bestiário — lia `soul.oracle` cru e portanto era
// SURDO ao ritual: medido, duas pessoas com o mesmo nascimento e respostas
// opostas recebiam ficha, ofício, essência, companheiro, skills e criatura do
// bestiário IDÊNTICOS. Para quem pula o teste de 20 (o caminho padrão), as 6
// respostas são o único sinal de personalidade que existe — e metade do
// resultado as ignorava.
//
// A escala é a MESMA já documentada no `oracle.ts`: os eixos vêm normalizados
// para somar 100, os efeitos do quiz são inteiros de 1 a 4, então um efeito
// forte move um elemento em ~⅓ da média sem apagar mapa astral e teste.
// ---------------------------------------------------------------------------

import { ORACLE_QUESTIONS, RITUAL_ALIGNMENT_SCALE, RITUAL_REALM_SCALE, ROLE_DOMINANCE_COMPENSATION, REALM_DOMINANCE_COMPENSATION } from '../oracle';
import type { AlignmentId, CaminhoRitual, ElementId, RealmId, RoleId } from '../oracle';
import { CLASS_ELEMENT_ORDER, type ClassElementId, type OracleAxes } from './types';
import { computeDominantClassElements } from './derivedElements';

/**
 * Os 8 elementos do vocabulário do RITUAL → os 17 do class-system.
 *
 * `planta` e `industrial` não existem como base do class-system: viram os
 * vizinhos mais próximos (vida/terra e marcial/terra), o mesmo par que a
 * leitura já usa para eles. Os pesos somam ~1 por elemento de origem, para
 * uma resposta não valer mais só por cair num elemento que espalha.
 */
const RITUAL_TO_CLASS: Record<ElementId, Partial<Record<ClassElementId, number>>> = {
  agua: { agua: 1 },
  fogo: { fogo: 1 },
  terra: { terra: 1 },
  ar: { ar: 1 },
  sombra: { sombra: 1 },
  luz: { luz: 1 },
  planta: { vida: 0.6, terra: 0.4 },
  industrial: { marcial: 0.5, terra: 0.3, eletricidade: 0.2 },
};

function renormalize<K extends string>(scores: Record<K, number>, keys: readonly K[]): Record<K, number> {
  const total = keys.reduce((soma, k) => soma + Math.max(0, scores[k]), 0);
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = total > 0 ? (Math.max(0, scores[k]) / total) * 100 : 100 / keys.length;
  return out;
}

/** Escore cru + compensação — a mesma soma que o `generateOracle` faz antes
 *  de normalizar (o argmax não muda com a normalização). */
function somaComp<K extends string>(scores: Record<K, number>, comp: Record<K, number>): Record<K, number> {
  const out = { ...scores };
  for (const k of Object.keys(comp) as K[]) out[k] = (out[k] ?? 0) + comp[k];
  return out;
}

function argmax<K extends string>(scores: Record<K, number>, keys: readonly K[]): K {
  return keys.reduce((melhor, k) => (scores[k] > scores[melhor] ? k : melhor), keys[0]);
}

/**
 * Devolve uma CÓPIA dos eixos com as respostas do ritual aplicadas. Não muta
 * a entrada: o `soul.oracle` salvo continua sendo a leitura pura, e quem
 * precisa da leitura com ritual pede aqui — uma fonte só (footgun 9).
 */
export function applyRitualAnswers(
  axes: OracleAxes,
  answers: Record<string, string> | undefined,
  /** Caminho do ritual (`soul.psychometric.answeredCount > 0` → `longo`).
   *  Com ele, `dominantRole`/`dominantRealm` levam a MESMA compensação de
   *  dominância do `generateOracle` (Fase 1, 28/09/2026) — sem ela o
   *  bestiário e o reveal liam um papel/reino e a criatura nascia de outro.
   *  Os SHARES (`roles`/`realms`) não mudam: a ficha é calibrada sobre eles. */
  caminho?: CaminhoRitual,
): OracleAxes {
  if (!answers || Object.keys(answers).length === 0) return axes;

  const classElements = { ...axes.classElements };
  const roles = { ...axes.roles };
  const alignments = { ...axes.alignments };
  const realms = { ...axes.realms };

  for (const q of ORACLE_QUESTIONS) {
    const escolhida = q.options.find(o => o.id === answers[q.id]);
    if (!escolhida) continue;
    const fx = escolhida.effects;
    for (const [el, pts] of Object.entries(fx.elements ?? {}) as Array<[ElementId, number]>) {
      for (const [classId, peso] of Object.entries(RITUAL_TO_CLASS[el] ?? {}) as Array<[ClassElementId, number]>) {
        // SEM `RITUAL_ELEMENT_SCALE` de propósito: os 17 do class-system têm
        // calibração própria (`classeElementoOcorrencia.test.ts`) feita sobre
        // estes pesos, e `RITUAL_TO_CLASS` já espalha planta/industrial em
        // vários ids. Medido (Loop B, 28/09/2026): com a escala aqui, `vileza`
        // deixava de alcançar o topo. A escala vive só no rótulo de 8
        // elementos (`generateOracle`), onde o viés do ritual aparecia.
        classElements[classId] += pts * peso;
      }
    }
    for (const [role, pts] of Object.entries(fx.roles ?? {}) as Array<[RoleId, number]>) {
      roles[role] += pts;
    }
    for (const [al, pts] of Object.entries(fx.alignments ?? {}) as Array<[AlignmentId, number]>) {
      alignments[al] += pts * RITUAL_ALIGNMENT_SCALE[al];
    }
    for (const [realm, pts] of Object.entries(fx.realms ?? {}) as Array<[RealmId, number]>) {
      realms[realm] += pts * RITUAL_REALM_SCALE[realm];
    }
  }

  const roleKeys = Object.keys(roles) as RoleId[];
  const alignmentKeys = Object.keys(alignments) as AlignmentId[];
  const realmKeys = Object.keys(realms) as RealmId[];

  const normalizados = {
    classElements: renormalize(classElements, CLASS_ELEMENT_ORDER),
    roles: renormalize(roles, roleKeys),
    alignments: renormalize(alignments, alignmentKeys),
    realms: renormalize(realms, realmKeys),
  };

  return {
    ...axes,
    ...normalizados,
    // dominantes recomputados — senão a linha do reveal ("Essência X · Ofício
    // Y") continuaria anunciando a leitura sem ritual
    dominantRole: caminho
      ? argmax(somaComp(roles, ROLE_DOMINANCE_COMPENSATION[caminho]), roleKeys)
      : argmax(normalizados.roles, roleKeys),
    dominantAlignment: argmax(normalizados.alignments, alignmentKeys),
    dominantRealm: caminho
      ? argmax(somaComp(realms, REALM_DOMINANCE_COMPENSATION[caminho]), realmKeys)
      : argmax(normalizados.realms, realmKeys),
    dominantClassElements: computeDominantClassElements(normalizados.classElements),
  };
}
