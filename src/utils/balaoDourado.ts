/**
 * BALÕES DOURADOS DO SOULMON (beta12, §G do `docs/BACKLOG-BETA12.md`; pedido do dono, 11/11/2026).
 *
 * Falas de borda dourada (⚰️ "PERSISTENTES, sem timeout" até §383), que LEVAM o jogador ao lugar. Três casos, em ordem de prioridade:
 *   1. `grove`  — o Bosque está sob ataque (o balão leva lá MESMO sem tarefas feitas: só encaminha, nunca cobra);
 *   2. `rift`   — o Soulmon está na Fenda (a plaquinha oferece "Ir à Fenda");
 *   3. `achado` — o Soulmon voltou da missão com um encontro do Mercador.
 * UM balão visível por vez; o dispensado libera o próximo.
 *
 * PERSISTÊNCIA DIÁRIA POR CONTA: a chave `balaoDourado:<tipo>:<AAAA-MM-DD>` vive no SAVE da conta (`GameState.balaoDourado`, não só
 * localStorage), para não reaparecer em outro aparelho. Grava-se ao TOCAR e ser direcionado (nunca ao exibir). "Dia" = dia do
 * jogador (`playerDayIso`, o mesmo corte das tarefas diárias). Só guarda o dia corrente: as chaves de outros dias caem na gravação
 * (o campo não cresce).
 *
 * §383 (dono, 14/11/2026: "Se ignorar 2x ou 5s dispensa") — ⚰️ "persistente, fecha só ao tocar e ser direcionado" (BACKLOG-BETA12 §G).
 * O balão fica `BALAO_DOURADO_VISIVEL_MS` na tela e some sozinho (some o balão, não a ação: o destino segue pelos caminhos normais).
 * Cada sumiço sem toque é 1 "ignorado" (`registrarIgnorado`, contagem POR APARELHO em `STORAGE_KEYS.BALAO_DOURADO_IGNORADOS`); no
 * `BALAO_IGNORADOS_PARA_DISPENSAR`º do mesmo dia do jogador ele entra no MESMO registro de `dispensar` do toque (save da conta).
 *
 * Puro: sem React, sem storage, `dia` por parâmetro. O texto é fixo por tipo (calmo, sem culpa e sem número): a variação por
 * personalidade do Soulmon (item B) entra depois por cima, pelo mesmo `balaoDouradoText`.
 */
import type { Language } from './i18n';

export const BALAO_TIPOS = ['grove', 'rift', 'achado'] as const;
export type BalaoTipo = (typeof BALAO_TIPOS)[number];

/** Do mais prioritário para o menos: Bosque sob ataque > Fenda > achado da volta (G6). */
export const BALAO_PRIORIDADE: readonly BalaoTipo[] = BALAO_TIPOS;

/** O registro persistido: `{ 'balaoDourado:grove:2026-11-15': true }`. */
export type BalaoDispensados = Record<string, true>;

const DIA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const balaoKey = (tipo: BalaoTipo, dia: string): string => `balaoDourado:${tipo}:${dia}`;

export function foiDispensado(reg: BalaoDispensados | undefined, tipo: BalaoTipo, dia: string): boolean {
  return reg?.[balaoKey(tipo, dia)] === true;
}

/** Marca `tipo` como dispensado em `dia` e solta as chaves de outros dias. Idempotente: já dispensado devolve o MESMO objeto. */
export function dispensar(reg: BalaoDispensados | undefined, tipo: BalaoTipo, dia: string): BalaoDispensados {
  if (!DIA_ISO.test(dia)) return reg ?? {};
  if (foiDispensado(reg, tipo, dia)) {
    const outroDia = Object.keys(reg ?? {}).some(k => !k.endsWith(`:${dia}`));
    if (!outroDia) return reg as BalaoDispensados;
  }
  const doDia = Object.fromEntries(Object.entries(reg ?? {}).filter(([k]) => k.endsWith(`:${dia}`))) as BalaoDispensados;
  return { ...doDia, [balaoKey(tipo, dia)]: true };
}

/** Leitura tolerante do save: só chaves `balaoDourado:<tipo>:<dia>` de tipos conhecidos, valor `true`, no máximo uma por tipo/dia. */
export function sanitizeBalaoDourado(raw: unknown): BalaoDispensados | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: BalaoDispensados = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v !== true) continue;
    const m = /^balaoDourado:([a-z]+):(\d{4}-\d{2}-\d{2})$/.exec(k);
    if (!m || !(BALAO_TIPOS as readonly string[]).includes(m[1])) continue;
    out[k] = true;
  }
  return Object.keys(out).length ? out : undefined;
}

/** O balão que aparece AGORA: o de maior prioridade entre os que têm condição e ainda não foram dispensados hoje. `null` = nenhum. */
export function escolherBalao(presentes: Partial<Record<BalaoTipo, boolean>>, reg: BalaoDispensados | undefined, dia: string): BalaoTipo | null {
  return BALAO_PRIORIDADE.find(t => presentes[t] === true && !foiDispensado(reg, t, dia)) ?? null;
}

/** §383: quanto tempo o balão de evento fica na tela antes de sumir sozinho (igual com movimento reduzido). */
export const BALAO_DOURADO_VISIVEL_MS = 5_000;
/** §383: quantos sumiços sem toque, no mesmo dia do jogador, dispensam o balão até o dia seguinte. */
export const BALAO_IGNORADOS_PARA_DISPENSAR = 2;

/** Contagem de "ignorados" por aparelho: `{ 'balaoDourado:rift:2026-11-15': 1 }`. Só o dia corrente sobrevive. */
export type BalaoIgnorados = Record<string, number>;

/** Leitura tolerante do aparelho: chaves `balaoDourado:<tipo>:<dia>` de tipos conhecidos, inteiros 1..99. */
export function sanitizeBalaoIgnorados(raw: unknown): BalaoIgnorados {
  const out: BalaoIgnorados = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const m = /^balaoDourado:([a-z]+):(\d{4}-\d{2}-\d{2})$/.exec(k);
    if (!m || !(BALAO_TIPOS as readonly string[]).includes(m[1])) continue;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 99) continue;
    out[k] = v;
  }
  return out;
}

/** Conta 1 "ignorado" de `tipo` em `dia` (solta os outros dias). `dispensa` = chegou ao limite: o chamador grava `dispensar`. */
export function registrarIgnorado(reg: BalaoIgnorados | undefined, tipo: BalaoTipo, dia: string): { reg: BalaoIgnorados; dispensa: boolean } {
  if (!DIA_ISO.test(dia)) return { reg: reg ?? {}, dispensa: false };
  const doDia = Object.fromEntries(Object.entries(reg ?? {}).filter(([k]) => k.endsWith(`:${dia}`))) as BalaoIgnorados;
  const n = (doDia[balaoKey(tipo, dia)] ?? 0) + 1;
  return { reg: { ...doDia, [balaoKey(tipo, dia)]: n }, dispensa: n >= BALAO_IGNORADOS_PARA_DISPENSAR };
}

/** A fala do balão (PT-BR e EN). Sem cobrança, sem número, sem "não perca". */
export function balaoDouradoText(tipo: BalaoTipo, language: Language): string {
  const pt = language === 'pt-BR';
  switch (tipo) {
    case 'grove': return pt ? 'O Bosque está sendo atacado. Quer dar uma olhada?' : 'The Grove is under attack. Want to take a look?';
    case 'rift': return pt ? 'Estou na Fenda. Quer ir até lá?' : 'I am in the Rift. Want to go there?';
    case 'achado': return pt ? 'Voltei e encontrei uma coisa. Vem ver?' : 'I am back and found something. Come see?';
  }
}

/** O rótulo para leitor de tela: anuncia o DESTINO ("Abrir o Bosque"), não só a fala. */
export function balaoDouradoAria(tipo: BalaoTipo, language: Language): string {
  const pt = language === 'pt-BR';
  switch (tipo) {
    case 'grove': return pt ? 'Abrir o Bosque' : 'Open the Grove';
    case 'rift': return pt ? 'Ir à Fenda' : 'Go to the Rift';
    case 'achado': return pt ? 'Ver o que o Soulmon encontrou' : 'See what your Soulmon found';
  }
}
