/**
 * BALÕES DE DICA DO SOULMON (pedido do dono, 13/11/2026 — REGISTRO §333).
 *
 * Falas de CONTEXTO que também ensinam uma regra verdadeira do jogo. Quatro tipos, dois jeitos de aparecer:
 *   · DOURADO (tocável, leva ao lugar pelo `requestGoToBuilding`): `relaxar` (Refúgio da Forja) e `lilia` (Grove);
 *   · COMUM (o balão de fala, some sozinho): `fome` e `cochilo`.
 *
 * Cada condição lê a REGRA do dono da regra (nada de número copiado):
 *   · energia baixa = a energia assentada (`settleEnergy`) está em `ENERGIA_BAIXA_FRACAO` do máximo ou menos;
 *   · `relaxar` = energia baixa E o Refúgio dá energia AGORA — a MESMA régua da moeda do mapa (`LOT_COIN_RULES` em `lotMarks.ts`:
 *     o do dia não foi tomado e a energia não está cheia) E o prédio abre neste Vínculo (`buildingGateFor`);
 *   · `cochilo` = energia baixa, o Refúgio NÃO dá energia agora, e o Soulmon não está faminto: dormir multiplica a regeneração
 *     (`SLEEP_ENERGY_REGEN_BONUS`), mas faminto a regeneração é 0 e 0 × 1,5 = 0 — aí a dica seria falsa e quem fala é a `fome`;
 *   · `fome` = abaixo de "bem alimentado" (`HUNGER_FED_MIN`), COM OU SEM comida na pastinha (dono, 13/11: a fome aparece mesmo de
 *     pastinha vazia). A fala é a MESMA nos dois casos porque não pede nada: o Soulmon diz que está com fome e a regra verdadeira
 *     (bem alimentado regenera a 100%, mediano a 50%, faminto a 0, `REGEN_*_PCT`). Sem verbo de tarefa, sem "vá", sem culpa;
 *   · `lilia` = a meta do dia foi cumprida (a MESMA régua que libera aguar/defender: `fioMetaCumprida`, `groveTend.ts`), o Grove
 *     abre neste Vínculo, e o servidor diz que há cuidado do dia por fazer (`bosqueCuidavel`).
 *
 * FREQUÊNCIA: um tipo não volta antes do seu `DICA_COOLDOWN_MS` (conta a partir de quando APARECEU). O registro mora no aparelho
 * (`STORAGE_KEYS.BALAO_DICAS_VISTAS`): é conveniência de UI, não progresso. Nunca empilha: a dica dourada só entra quando nenhum
 * balão dourado de evento (Bosque atacado, Fenda, achado) está na vez, e o balão dourado já cede a vez ao balão de fala.
 *
 * Puro: sem React, sem storage, `now` por parâmetro. Texto sem número, sem cobrança, sem "não perca".
 */
import type { Language } from './i18n';
import type { BuildingId } from './gates';
import type { HungerTier } from './hunger';

export const DICA_TIPOS = ['relaxar', 'fome', 'cochilo', 'lilia'] as const;
export type DicaTipo = (typeof DICA_TIPOS)[number];
export type DicaDouradaTipo = 'relaxar' | 'lilia';

/** Do mais útil para o menos: o que devolve energia na hora > o que destrava a regeneração > o cochilo > o passeio ao Grove. */
export const DICA_PRIORIDADE: readonly DicaTipo[] = DICA_TIPOS;

export const DICA_DOURADA: Readonly<Record<DicaTipo, boolean>> = { relaxar: true, lilia: true, fome: false, cochilo: false };

const H = 60 * 60 * 1000;
/** Intervalo mínimo entre duas aparições do MESMO tipo. */
export const DICA_COOLDOWN_MS: Readonly<Record<DicaTipo, number>> = { relaxar: 6 * H, fome: 4 * H, cochilo: 6 * H, lilia: 8 * H };

/** Quanto tempo a dica DOURADA fica no visor antes de sair sozinha (ela não é persistente como as de evento: dica não cobra). */
export const DICA_DOURADA_VISIVEL_MS = 45_000;

/** "Energia baixa": esta fração do máximo, ou menos. */
export const ENERGIA_BAIXA_FRACAO = 0.2;

/** Para onde a dica dourada leva. */
export const DICA_DESTINO: Readonly<Record<DicaDouradaTipo, BuildingId>> = { relaxar: 'forja.refugio', lilia: 'hall.grove' };

export interface DicaEntrada {
  /** O Soulmon está na Home, acordado e não ausente (masmorra/missão). Falso = nenhuma dica. */
  presente: boolean;
  /** Energia já assentada (`settleEnergy`) e o máximo do estágio. */
  energia: number;
  energiaMax: number;
  fome: HungerTier;
  /** O Refúgio dá energia agora (prédio aberto, o do dia não tomado, energia não cheia). */
  refugioDaEnergia: boolean;
  /** A meta do dia está cumprida (`fioMetaCumprida`). */
  metaDoDia: boolean;
  /** O prédio do Grove abre neste Vínculo e o destino é alcançável. */
  groveAberto: boolean;
  /** O servidor diz que há cuidado do dia no Grove (planta de pé, não madura, ação sorteável ou sorteada). */
  bosqueCuidavel: boolean;
}

export const energiaBaixa = (energia: number, max: number): boolean => max > 0 && energia <= max * ENERGIA_BAIXA_FRACAO;

/** Quais dicas têm condição AGORA (sem olhar a frequência). */
export function dicasPresentes(e: DicaEntrada): Record<DicaTipo, boolean> {
  if (!e.presente) return { relaxar: false, fome: false, cochilo: false, lilia: false };
  const cansado = energiaBaixa(e.energia, e.energiaMax);
  return {
    relaxar: cansado && e.refugioDaEnergia,
    fome: e.fome !== 'fed',
    cochilo: cansado && !e.refugioDaEnergia && e.fome !== 'starving',
    lilia: e.metaDoDia && e.groveAberto && e.bosqueCuidavel,
  };
}

/** `{ relaxar: <ms da última aparição>, ... }`. */
export type DicaVistas = Partial<Record<DicaTipo, number>>;

export function emCooldown(vistas: DicaVistas | undefined, tipo: DicaTipo, now: number): boolean {
  const t = vistas?.[tipo];
  if (typeof t !== 'number' || !Number.isFinite(t)) return false;
  if (t > now) return false; // relógio que voltou não prende a dica para sempre
  return now - t < DICA_COOLDOWN_MS[tipo];
}

/** A dica da vez: a de maior prioridade com condição e fora do cooldown. `jeito` filtra dourada/comum. `null` = nenhuma. */
export function escolherDica(presentes: Partial<Record<DicaTipo, boolean>>, vistas: DicaVistas | undefined, now: number, jeito: 'dourada' | 'comum'): DicaTipo | null {
  return DICA_PRIORIDADE.find(t => DICA_DOURADA[t] === (jeito === 'dourada') && presentes[t] === true && !emCooldown(vistas, t, now)) ?? null;
}

/** Grava a aparição; só guarda tipos conhecidos (o registro não cresce). */
export function marcarVista(vistas: DicaVistas | undefined, tipo: DicaTipo, now: number): DicaVistas {
  return { ...sanitizeDicaVistas(vistas), [tipo]: now };
}

/** Leitura tolerante do aparelho: só tipos conhecidos com número finito. */
export function sanitizeDicaVistas(raw: unknown): DicaVistas {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: DicaVistas = {};
  for (const t of DICA_TIPOS) {
    const v = (raw as Record<string, unknown>)[t];
    if (Object.prototype.hasOwnProperty.call(raw, t) && typeof v === 'number' && Number.isFinite(v) && v > 0) out[t] = v;
  }
  return out;
}

/** A fala (PT-BR e EN), na voz do Soulmon: carinhosa, leve, sem cobrança e sem número. */
export function dicaTexto(tipo: DicaTipo, language: Language): string {
  const pt = language === 'pt-BR';
  switch (tipo) {
    case 'relaxar': return pt ? 'Estou cansado. Bem que eu poderia usar um relaxamento...' : 'I am tired. I could really use a moment to relax...';
    case 'cochilo': return pt ? 'Estou cansado. Bem que eu poderia tirar um cochilo agora para me recuperar mais rápido.' : 'I am tired. A little nap right now would help me recover faster.';
    case 'fome': return pt ? 'Nossa, estou com fome. De barriga cheia minha energia recupera mais rápido.' : 'Oh, I am hungry. With a full belly my energy comes back faster.';
    case 'lilia': return pt ? 'A gente poderia visitar a Lilia lá no Grove.' : 'We could visit Lilia over at the Grove.';
  }
}

/** Rótulo do balão dourado para leitor de tela: anuncia o DESTINO. */
export function dicaAria(tipo: DicaDouradaTipo, language: Language): string {
  const pt = language === 'pt-BR';
  return tipo === 'relaxar' ? (pt ? 'Ir ao Refúgio da Forja' : 'Go to the Forge Refuge') : (pt ? 'Abrir o Grove' : 'Open the Grove');
}

export const ehDicaDourada = (t: string): t is DicaDouradaTipo => t === 'relaxar' || t === 'lilia';
