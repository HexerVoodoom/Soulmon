/**
 * FORMAS ALTERNATIVAS (pedido do dono, 05/11/2026) — dono único.
 *
 * Uma forma (champion/ultimate/mega/ultra; NUNCA o rookie nem o bb) pode ter uma versão por ELEMENTO: quem degenera e evolui de
 * novo para o MESMO estágio com outro elemento (poção elemental, `utils/elementPotion.ts`) desbloqueia uma forma nova daquele
 * nível. A lista é por forma, na ordem em que foram desbloqueadas — a primeira é a forma original.
 *
 * Arte: a original continua na chave da forma (`champion-benevolence`) do acervo; cada alternativa tem a chave
 * `champion-benevolence@<elemento>` (o servidor aceita esse id — `VALID_FORM_ID`, `functions/api/_aiGuard.js`), então nunca
 * reaproveita o desenho da original (o achado que abriu isto: "evoluiu para a mesma forma").
 *
 * O jogador EQUIPA qualquer forma já desbloqueada daquele nível (`formaAltEquipada[formId] = elemento`; ausente = a original).
 * Cosmético: não muda atributo, galho nem regra — só qual desenho representa a forma. Funções PURAS; o `App.tsx` só delega.
 */
import { displaySprite, type SpriteLibrary } from './spriteLibrary';
import { getStageLevel } from '../types/progression';
import type { ElementoJornada } from './elementoJornada';

export type FormasAlt = Record<string, string[]>;
export type FormaAltEquipada = Record<string, string>;

/** Quantas formas ocultas (???) aparecem abaixo das desbloqueadas. */
export const ALT_OCULTAS = 3;

const FORM_RE = /^(?:ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))$/;
const EL_RE = /^[a-z_]{2,24}$/;

/** A forma admite alternativas? (rookie e bb ficam de fora — decisão do dono.) */
export const formaTemAlternativas = (formId: string): boolean => FORM_RE.test(formId);

export function sanitizeFormasAlt(raw: unknown): FormasAlt | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: FormasAlt = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!FORM_RE.test(k) || !Array.isArray(v)) continue;
    const els = Array.from(new Set(v.filter((e): e is string => typeof e === 'string' && EL_RE.test(e)))).slice(0, 400);
    if (els.length) out[k] = els;
  }
  return Object.keys(out).length ? out : undefined;
}

export function sanitizeFormaAltEquipada(raw: unknown): FormaAltEquipada | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: FormaAltEquipada = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (FORM_RE.test(k) && typeof v === 'string' && EL_RE.test(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** O elemento que a jornada registrou para o NÍVEL desta forma. */
export function elementoDaForma(jornada: ElementoJornada | undefined, formId: string): string | undefined {
  return jornada?.estagios?.[getStageLevel(formId) as keyof ElementoJornada['estagios']]?.id;
}

/** A chave de acervo de (forma, elemento): a primeira desbloqueada (ou a primeira vez) usa a chave da própria forma. */
export function altSpriteKey(
  formId: string, elemento: string | undefined, formas: FormasAlt | undefined, lib?: SpriteLibrary,
): string {
  if (!elemento || !formaTemAlternativas(formId)) return formId;
  const lista = formas?.[formId];
  // Forma já desenhada ANTES desta lista existir (save de antes de 05/11/2026): o elemento daquela arte é desconhecido,
  // então a volta ao estágio pede arte nova em vez de reaproveitar a antiga.
  if ((!lista || lista.length === 0) && lib?.sprites[formId]) return `${formId}@${elemento}`;
  if (!lista || lista.length === 0 || lista[0] === elemento) return formId;
  return `${formId}@${elemento}`;
}

/**
 * O elemento a equipar ao ENTRAR numa forma (troca lateral): o pedido (ou o já equipado) se a arte dele existe no acervo; senão o
 * primeiro da lista COM arte — trocar de forma nunca pede imagem nova (10/11/2026). Sem nenhum com arte, devolve o pedido/equipado.
 */
export function elementoEquipavelComArte(
  formId: string, formas: FormasAlt | undefined, equip: FormaAltEquipada | undefined, lib: SpriteLibrary | undefined, pedido?: string,
): string | undefined {
  const preferido = pedido ?? equip?.[formId];
  const lista = formas?.[formId] ?? [];
  const temArte = (el: string) => !!lib?.sprites[altSpriteKey(formId, el, formas, lib)];
  if (preferido && temArte(preferido)) return preferido;
  return lista.find(temArte) ?? preferido;
}

/**
 * A chave de acervo da forma como ela está EQUIPADA (`estágio` = a original/1ª da lista; `estágio@elemento` = forma de poção). Toda ação
 * sobre a arte de uma forma (gerar de novo, tentar de novo, sintonizar, voltar ao traço antigo) usa ESTA chave, nunca só o id do estágio —
 * senão mexe na arte da original quando a de poção está equipada (bug do dono, 10/11/2026).
 */
export const chaveDaFormaEquipada = (formId: string, formas: FormasAlt | undefined, equip: FormaAltEquipada | undefined): string =>
  altSpriteKey(formId, equip?.[formId], formas);

/** A forma de uma chave de acervo (`mega-power@fire` → `mega-power`). */
export const baseFormOfKey = (key: string): string => key.split('@')[0];

/** O elemento-sentinela da arte de antes da lista (elemento desconhecido). */
export const ALT_ORIGINAL = 'original';

/** Ao COMMITAR a evolução para `formId` com `elemento`: registra (idempotente) e equipa essa forma. */
export function registrarFormaAoEvoluir(
  formas: FormasAlt | undefined, equip: FormaAltEquipada | undefined, formId: string, elemento: string | undefined,
  lib?: SpriteLibrary,
): { formasAlt: FormasAlt | undefined; formaAltEquipada: FormaAltEquipada | undefined } {
  if (!elemento || !formaTemAlternativas(formId)) return { formasAlt: formas, formaAltEquipada: equip };
  const salva = formas?.[formId] ?? [];
  // A arte antiga (de antes da lista) vira a 1ª entrada, para continuar equipável.
  const lista = salva.length === 0 && lib?.sprites[formId] && lib.sprites[`${formId}@${elemento}`] ? [ALT_ORIGINAL] : salva;
  const novaLista = lista.includes(elemento) ? lista : [...lista, elemento];
  const formasAlt = novaLista === salva && formas ? formas : { ...(formas ?? {}), [formId]: novaLista };
  const formaAltEquipada = equip?.[formId] === elemento ? equip : { ...(equip ?? {}), [formId]: elemento };
  return { formasAlt, formaAltEquipada };
}

/** Equipa uma forma JÁ desbloqueada (recusa o que não está na lista). */
export function equiparFormaAlt(
  formas: FormasAlt | undefined, equip: FormaAltEquipada | undefined, formId: string, elemento: string,
): FormaAltEquipada | undefined {
  if (!formas?.[formId]?.includes(elemento)) return equip;
  return { ...(equip ?? {}), [formId]: elemento };
}

/**
 * O acervo como o VISOR o vê: em cada forma com alternativa equipada (e já desenhada), a arte da alternativa ocupa a chave da
 * forma. Só para EXIBIR — a geração continua lendo o acervo real.
 */
export function spriteVisorOf(lib: SpriteLibrary, formas: FormasAlt | undefined, equip: FormaAltEquipada | undefined): SpriteLibrary {
  if (!equip || !formas) return lib;
  let sprites: SpriteLibrary['sprites'] | null = null;
  for (const [formId, el] of Object.entries(equip)) {
    const key = altSpriteKey(formId, el, formas);
    // 1ª da lista = a chave da própria forma. Se a arte dela mora numa chave `forma@elemento` (gerada antes da lista existir), a
    // forma não pode ficar SEM arte — o app cairia na 1ª do acervo, a Rookie (bug do dono, 10/11/2026): usa a 1ª alternativa que existe.
    if (key === formId) {
      if (lib.sprites[formId]) continue;
      const prefixo = `${formId}@`;
      const outra = Object.keys(lib.sprites).find(k => k.startsWith(prefixo));
      if (!outra) continue;
      sprites = sprites ?? { ...lib.sprites };
      sprites[formId] = { ...lib.sprites[outra], formId };
      continue;
    }
    const alt = lib.sprites[key];
    if (!alt) continue;
    sprites = sprites ?? { ...lib.sprites };
    sprites[formId] = { ...alt, formId };
  }
  if (!sprites) return lib;
  // Uma regeneração pendente/revertida da original não pode mascarar a alternativa equipada.
  const reverted = lib.reverted.filter(id => !(id in equip) || altSpriteKey(id, equip[id], formas) === id);
  const pendingTune = lib.pendingTune && sprites[lib.pendingTune.formId] !== lib.sprites[lib.pendingTune.formId] ? null : lib.pendingTune;
  return { ...lib, sprites, reverted, pendingTune };
}

/** Quantos elementos ainda faltam desbloquear nesta forma (para o número de "???"). */
export function ocultasDaForma(formas: FormasAlt | undefined, formId: string, total: number): number {
  const tem = formas?.[formId]?.length ?? 1;
  return Math.max(0, Math.min(ALT_OCULTAS, total - Math.max(1, tem)));
}

/**
 * O mapa forma → url que o App entrega a `setOwnSprites` (a arte que o app MOSTRA de cada forma), a partir do acervo já visto pelo visor.
 * - forma com arte própria: ela (mesmo com `reverted` e sem `previousSprites` — não há traço antigo para voltar, então vale a própria arte;
 *   antes a forma "revertida" ficava sem arte e o app mostrava a de OUTRA variante: bug do dono, original = Sabá, 10/11/2026);
 * - forma SEM arte própria, mas com alternativa (`forma@elemento`): usa a alternativa (nunca cai na Rookie).
 */
export function mapaDeSpritesProprios(visor: SpriteLibrary): Record<string, string> {
  const map: Record<string, string> = {};
  for (const formId of Object.keys(visor.sprites)) {
    if (formId.includes('@')) continue; // forma alternativa: entra pela chave da forma quando equipada
    const url = displaySprite(visor, formId)?.url ?? visor.sprites[formId]?.url;
    if (url) map[formId.toLowerCase()] = url;
  }
  for (const formId of Object.keys(visor.sprites)) {
    if (!formId.includes('@')) continue;
    const base = formId.split('@')[0].toLowerCase();
    const url = visor.sprites[formId]?.url;
    if (url && !map[base] && !visor.sprites[base]) map[base] = url;
  }
  return map;
}
