// ---------------------------------------------------------------------------
// A tela de decisão do elemento (D-150..D-160): antes do desenho, a Iris diz
// quem é o Soulmon e a pessoa pode pedir "outro lado" da própria alma.
//
// Módulo PURO e sem acaso: nada aqui sorteia, lê relógio ou cria identidade.
// A mesma entrada dá sempre a mesma saída — a escolha do elemento regera a
// criatura com a MESMA seed (ver `SoulmonOnboarding`), então pedir outro lado
// nunca vira um reroll disfarçado. Os números (elementScores) ficam aqui
// dentro: quem chama recebe só ids de elemento, nunca pontos.
// ---------------------------------------------------------------------------

import { ELEMENT_ORDER } from './oracle';
import type { ElementId, OracleResult } from './oracle';
import { ELEMENT_INFO } from './oracle/base';

type Lang = 'pt' | 'en';

/**
 * Os elementos que a pessoa pode trocar pelo dominante, em ordem (pontuação
 * desc, depois `ELEMENT_ORDER`). São todos os não-dominantes que empatam com o
 * 2º colocado, mais o secundário declarado se ele estiver fora desse grupo.
 */
export function elementChoiceCandidates(result: OracleResult): ElementId[] {
  const pos = (e: ElementId) => ELEMENT_ORDER.indexOf(e);
  const score = (e: ElementId) => result.elementScores[e] ?? 0;
  const ordenar = (a: ElementId, b: ElementId) => score(b) - score(a) || pos(a) - pos(b);
  const others = ELEMENT_ORDER.filter(e => e !== result.dominantElement).sort(ordenar);
  if (others.length === 0) return [];
  const corte = score(others[0]);
  const candidatos = others.filter(e => score(e) === corte);
  const sec = result.secondaryElement;
  if (sec && sec !== result.dominantElement && !candidatos.includes(sec)) candidatos.push(sec);
  return candidatos.sort(ordenar);
}

/** A parte da personalidade ANTES do travessão, sem ponto final. */
function antesDoTravessao(el: ElementId, lang: Lang): string {
  const txt = ELEMENT_INFO[el].personality[lang];
  const i = txt.indexOf('—');
  return (i >= 0 ? txt.slice(0, i) : txt).trim().replace(/[.\s]+$/, '');
}

const minuscula = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const maiuscula = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** A fala da Iris sobre o resultado (copy aprovada pelo redator). */
export function falaDaIris(result: OracleResult, lang: Lang): string {
  const nome = result.creature.baseName;
  const el = ELEMENT_INFO[result.dominantElement].name[lang];
  const sec = result.secondaryElement && result.secondaryElement !== result.dominantElement
    ? ELEMENT_INFO[result.secondaryElement].name[lang]
    : null;
  const pers = minuscula(antesDoTravessao(result.dominantElement, lang));
  if (lang === 'pt') {
    return sec
      ? `Seu Soulmon é ${nome}. Uma alma de ${el}, tocada por ${sec}: ${pers}.`
      : `Seu Soulmon é ${nome}. Uma alma de ${el}: ${pers}.`;
  }
  const art = /^[AEIOU]/i.test(el) ? 'An' : 'A';
  return sec
    ? `Your Soulmon is ${nome}. ${art} ${el} soul, touched by ${sec}: ${pers}.`
    : `Your Soulmon is ${nome}. ${art} ${el} soul: ${pers}.`;
}

/** Uma linha por elemento para a lista de escolha: "Fluido, empático e profundo." */
export function descricaoCurtaElemento(el: ElementId, lang: Lang): string {
  return `${maiuscula(antesDoTravessao(el, lang))}.`;
}
