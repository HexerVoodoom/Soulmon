/**
 * O QUE CADA FORMA CARREGA (pedido do dono, 09/11/2026) — dono único.
 *
 * "Quando o user evoluir usando poção elemental e degenerar ele deve voltar ao elemento da forma degenerada. Além disso, ao usar
 * a função de equipar outra forma de um mesmo estágio de evolução, deve-se equipar tudo - elementos, tipo de ataque, tipo de especial."
 *
 * Cada forma (o id do estágio, mais `@<elemento>` quando há forma alternativa equipada — `formasAlternativas.ts`) guarda uma FOTO do
 * que a define em combate: o elemento da poção (`potionElement`, ou nenhum), o registro do elemento do nível (`elementoJornada`) e o
 * par de skills do nível (`soulmonSkills[nível]`: ataque básico/forma de golpe e especial). A foto é tirada ao SAIR da forma (evoluir,
 * degenerar, trocar de forma) — o estado vivo é sempre a verdade da forma atual — e aplicada ao ENTRAR nela de novo.
 *
 * Limite honesto: forma sem foto (save de antes de 09/11/2026, ou forma nunca vivida) não tem o que restaurar. Na queda, a poção é
 * limpa (o elemento volta ao do registro do nível); na troca, nada além do que já mudava é aplicado. Funções PURAS; `App.tsx` e
 * `dailyReset.ts` só delegam.
 */
import { getStageLevel } from '../types/progression';
import { elementoDoEstagioAtual, type ElementoDoEstagio, type ElementoJornada } from './elementoJornada';
import type { StageSkills } from './soulProfile/ficha/skills';
import type { FichaStage } from './soulProfile/ficha/types';
import { fichaStageOf } from './soulProfile/ficha/stageSkillsFor';
import { ALT_ORIGINAL, formaTemAlternativas } from './formasAlternativas';

export interface FormaSnapshot {
  /** O elemento da poção da forma; ausente = a forma não tinha poção. */
  pocao?: string;
  /** O registro do elemento do nível nesta forma. */
  elemento?: ElementoDoEstagio;
  /** Ataque básico (escola/forma de golpe) e especial da forma. */
  skills?: StageSkills;
}
export type FormaSnapshots = Record<string, FormaSnapshot>;

export interface FormaState {
  evolutionStage: string;
  potionElement?: string;
  elementoJornada?: ElementoJornada;
  soulmonSkills?: Partial<Record<FichaStage, StageSkills>>;
  formaAltEquipada?: Record<string, string>;
  formaSnapshots?: FormaSnapshots;
  soulmonMeta?: { dominantElement?: string } | null;
}

const ORDEM = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const nivelIdx = (stage: string): number => ORDEM.indexOf(getStageLevel(stage));

/** A chave de uma forma: o id do estágio, mais o elemento da alternativa equipada. */
export const chaveDaForma = (formId: string, equip?: Record<string, string>): string =>
  equip?.[formId] ? `${formId}@${equip[formId]}` : formId;

/**
 * A poção pertence à forma cujo ELEMENTO (a parte `@elemento` da chave) é ela. Foto de `forma@original` ou `forma@sabbat` com poção
 * `fada` é a poção de OUTRA forma, gravada por cima (o app antigo fazia a forma sem foto herdar a poção e a fotografava ao sair —
 * save real do dono, 10/11/2026). Chave sem `@` (forma sem alternativa equipada) não é julgada.
 */
const pocaoDaChave = (chave: string, pocao: string | undefined): string | undefined => {
  const el = chave.includes('@') ? chave.split('@')[1] : undefined;
  return el && pocao !== el ? undefined : pocao;
};

/** A conta já usou poção? (poção ativa ou alguma foto com poção.) Sem isso, nenhuma regra de poção/original age. */
const usouPocao = (s: FormaState): boolean =>
  !!s.potionElement || Object.values(s.formaSnapshots ?? {}).some(f => !!f.pocao);

/**
 * A forma ORIGINAL (`forma@original`) é SEMPRE o elemento BASE do Soulmon (ex.: Sombra), sem poção e sem o elemento combinado do
 * registro (dono, 10/11/2026). Quem tem a original equipada assume o base como elemento; o registro do estágio não é tocado.
 */
export function forcarOriginal<T extends FormaState>(s: T): T {
  if (s.formaAltEquipada?.[s.evolutionStage] !== 'original') return s;
  // Só atua em quem JÁ usou poção (assinatura do problema). Conta sem poção nenhuma: no-op — nada muda para as outras contas.
  if (!usouPocao(s)) return s;
  // O base é POR Soulmon (Oráculo): `soulmonMeta.dominantElement`; sem ele, o `base` gravado no registro do estágio. Nunca um valor fixo.
  const base = s.soulmonMeta?.dominantElement ?? s.elementoJornada?.estagios?.[fichaStageOf(s.evolutionStage)]?.base;
  return base && s.potionElement !== base ? { ...s, potionElement: base } : s;
}

/** Fotografa a forma ATUAL (o estado vivo é a verdade dela). */
export function capturarForma<T extends FormaState>(s: T): T {
  const nivel = fichaStageOf(s.evolutionStage);
  const foto: FormaSnapshot = {};
  const chave = chaveDaForma(s.evolutionStage, s.formaAltEquipada);
  const pocao = pocaoDaChave(chave, s.potionElement);
  if (pocao) foto.pocao = pocao;
  const el = s.elementoJornada?.estagios?.[nivel];
  if (el && !(chave.endsWith('@original') && usouPocao(s))) foto.elemento = el;
  const sk = s.soulmonSkills?.[nivel];
  if (sk) foto.skills = sk;
  return { ...s, formaSnapshots: { ...(s.formaSnapshots ?? {}), [chave]: foto } };
}

/**
 * Forma SEM foto (nunca fotografada): a poção da forma de saída NÃO a acompanha; vale o elemento equipado dela (`formaAltEquipada`,
 * como poção) ou, sem ele, o registro do estágio. Nunca grava no registro (imutável): não é permanente, a próxima evolução volta ao base.
 */
function elementoDaFormaSemFoto<T extends FormaState>(s: T): T | undefined {
  // Forma que chega SEM foto não herda a poção da forma de onde saiu: aquela poção ficou fotografada na de saída (voltar a ela a
  // restaura). Causa raiz do bug "troquei para a forma Sabá e o elemento continuou Fada" (10/11/2026): a poção da forma anterior
  // seguia valendo sobre o registro do estágio da forma nova.
  const el = s.formaAltEquipada?.[s.evolutionStage];
  const valido = !!el && el !== 'original' && /^[a-z_]{2,24}$/.test(el);
  const registrado = elementoDoEstagioAtual(s.elementoJornada, s.evolutionStage)?.id;
  const nova = valido && el !== registrado ? el : undefined;
  return s.potionElement === nova ? undefined : { ...s, potionElement: nova };
}

/** Aplica a foto da forma ATUAL (já com `evolutionStage`/`formaAltEquipada` do destino). Sem foto = `undefined`. */
function aplicarFotoAtual<T extends FormaState>(s: T): T | undefined {
  const foto = s.formaSnapshots?.[chaveDaForma(s.evolutionStage, s.formaAltEquipada)];
  if (!foto) return undefined;
  const nivel = fichaStageOf(s.evolutionStage);
  const original = s.formaAltEquipada?.[s.evolutionStage] === 'original' && usouPocao(s);
  let out: T = { ...s, potionElement: original ? undefined : foto.pocao };
  if (!original && foto.elemento && s.elementoJornada) {
    out = { ...out, elementoJornada: { ...s.elementoJornada, estagios: { ...s.elementoJornada.estagios, [nivel]: foto.elemento } } };
  }
  if (foto.skills && s.soulmonSkills) {
    out = { ...out, soulmonSkills: { ...s.soulmonSkills, [nivel]: foto.skills } };
  }
  return out;
}

/**
 * TROCA de forma no MESMO nível (troca lateral de galho ou forma alternativa equipada): fotografa a de saída, troca, e aplica
 * tudo da de entrada. `trocar` faz a troca em si (a regra de quem pode trocar continua no dono dela); se ela não trocou nada, o
 * MESMO objeto volta.
 */
export function trocarFormaCompleta<T extends FormaState>(prev: T, trocar: (s: T) => T): T {
  const trocado = trocar(prev);
  if (trocado === prev) return prev;
  const antes = chaveDaForma(prev.evolutionStage, prev.formaAltEquipada);
  if (chaveDaForma(trocado.evolutionStage, trocado.formaAltEquipada) === antes) return forcarOriginal(trocado);
  const comFoto = { ...trocado, formaSnapshots: capturarForma(prev).formaSnapshots };
  return forcarOriginal(aplicarFotoAtual(comFoto) ?? elementoDaFormaSemFoto(comFoto) ?? comFoto);
}

/**
 * QUEDA (manual ou por HP): `next` é o estado já com o estágio de destino. Fotografa a forma que cai (de `prev`), apaga o registro de
 * elemento dos níveis ACIMA do destino (a próxima subida registra o elemento de novo, como na primeira vez), aplica a foto do destino
 * e DESCARTA a poção (o elemento volta ao do registro do nível). Não caiu de nível = o MESMO `next`.
 */
export function aoDescerDeForma<T extends FormaState>(prev: FormaState, next: T): T {
  const alvo = nivelIdx(next.evolutionStage);
  if (alvo >= nivelIdx(prev.evolutionStage)) return next;
  let out: T = { ...next, formaSnapshots: capturarForma(prev).formaSnapshots };
  const j = next.elementoJornada;
  if (j?.estagios) {
    const estagios: ElementoJornada['estagios'] = {};
    for (const [st, e] of Object.entries(j.estagios) as [FichaStage, ElementoDoEstagio][]) {
      if (ORDEM.indexOf(st) <= alvo) estagios[st] = e;
    }
    out = { ...out, elementoJornada: { ...j, estagios } };
  }
  // REGRA DO DONO (10/11/2026): degenerar DESCARTA a poção — o Soulmon volta ao elemento do registro do nível (a base) e a poção só
  // vale para a evolução em que foi usada. O resto da foto (elemento e skills do nível) segue sendo restaurado.
  // A forma ORIGINAL equipada no destino segue sendo o elemento BASE do Soulmon (como na troca de forma), nao o registro do nivel.
  // DECISÃO DO DONO (10/11/2026): degenerar de uma forma de POÇÃO desequipa-a — o destino volta à forma ORIGINAL do nível (elemento
  // base do Soulmon, `soulmonMeta.dominantElement`), em vez de ficar com a arte de poção equipada e o elemento do nível (inconsistente).
  if (saiuDeFormaDePocao(prev) && formaTemAlternativas(next.evolutionStage)) {
    out = { ...out, formaAltEquipada: { ...(out.formaAltEquipada ?? {}), [out.evolutionStage]: ALT_ORIGINAL } };
  }
  const fim = forcarOriginal({ ...(aplicarFotoAtual(out) ?? out), potionElement: undefined });
  // Base igual ao elemento já registrado do nível = nada a sobrepor (a poção continua descartada de fato).
  return fim.potionElement && fim.potionElement === elementoDoEstagioAtual(fim.elementoJornada, fim.evolutionStage)?.id ? { ...fim, potionElement: undefined } : fim;
}

/** A forma de onde se cai era de poção? (poção viva, ou alternativa equipada que não é a original nem o elemento registrado do nível.) */
function saiuDeFormaDePocao(prev: FormaState): boolean {
  if (prev.potionElement) return true;
  const eq = prev.formaAltEquipada?.[prev.evolutionStage];
  if (!eq || eq === ALT_ORIGINAL) return false;
  const registrado = prev.elementoJornada?.estagios?.[fichaStageOf(prev.evolutionStage)]?.id;
  return eq !== registrado;
}

/** Leitura tolerante do save. */
export function sanitizeFormaSnapshots(raw: unknown): FormaSnapshots | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: FormaSnapshots = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 200)) {
    if (!/^[a-z-]{2,40}(@[a-z_]{2,24})?$/.test(k) || !v || typeof v !== 'object' || Array.isArray(v)) continue;
    const r = v as Record<string, unknown>;
    const f: FormaSnapshot = {};
    // Migração tolerante: saves já gravados com a poção de outra forma na foto (ver `pocaoDaChave`) são curados na leitura.
    if (typeof r.pocao === 'string' && /^[a-z_]{2,24}$/.test(r.pocao)) { const p = pocaoDaChave(k, r.pocao); if (p) f.pocao = p; }
    const e = r.elemento as Record<string, unknown> | undefined;
    // `forma@original` COM poção na foto é a assinatura exata do save contaminado: poção e elemento combinado saem. Foto sem poção não é tocada (conta sem poção = no-op).
    if (k.endsWith('@original') && typeof r.pocao === 'string') { if (r.skills && typeof r.skills === 'object' && !Array.isArray(r.skills)) f.skills = r.skills as StageSkills; out[k] = f; continue; }
    if (e && typeof e === 'object' && typeof e.id === 'string' && typeof e.base === 'string') f.elemento = { id: e.id, base: e.base };
    if (r.skills && typeof r.skills === 'object' && !Array.isArray(r.skills)) f.skills = r.skills as StageSkills;
    out[k] = f;
  }
  return Object.keys(out).length ? out : undefined;
}
