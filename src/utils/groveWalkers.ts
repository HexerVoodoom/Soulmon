/**
 * OS MEMBROS ANDANDO NO BOSQUE (D-51/D-52, 19/10/2026) — a parte PURA: quem anda, por onde e quando fala.
 *
 * Regras (K-13, `docs/PLANO-GUILDA.md` e REGISTRO):
 *  · **TODOS os membros andam**, até `GUILD_MAX_MEMBERS` (12) sprites — o teto é o próprio máximo do clã.
 *    Acima de `GUILD_PRESENCE_NOMINAL_MAX` (4) ninguém tem estado de presença, então o sprite NUNCA depende de
 *    "veio hoje" nem de contribuição: todos andam sempre, do mesmo jeito (a leitura do estado de presença
 *    nem existe aqui);
 *  · ordem = a ORDEM DE CHEGADA que o servidor manda (nada de reordenar);
 *  · a criatura dos OUTROS é uma das nossas linhas escolhida por hash do id público (`spriteForMember`): nunca o
 *    estágio, a linha nem o HP de outra pessoa (LV-G10);
 *  · o NOME só existe para a UI mostrar ao TOCAR, e nunca vem com número nem contribuição;
 *  · a animação é CSS (uma por sprite, sem JS por frame): aqui só saem os números que alimentam as variáveis.
 */
import { GUILD_MAX_MEMBERS } from './guildRules';
import { spriteForMember } from './groveStage';
import type { GuildView } from './community';

/** Teto de sprites no cenário: o máximo do clã. */
export const GROVE_WALKERS_MAX = GUILD_MAX_MEMBERS;
/** Pausa mínima entre dois balões (D-52: intervalo aleatório, nunca menos que isto). */
export const BUBBLE_MIN_MS = 20_000;
export const BUBBLE_SPAN_MS = 25_000;
/** Quantas frases existem em `guild.bosque.fala.1..N`. */
export const BUBBLE_PHRASES = 8;

export interface GroveWalker {
  /** Chave estável (id público do membro, ou a posição). */
  key: string;
  own: boolean;
  /** Só existe para os OUTROS (a própria vem do App, que sabe o estágio). */
  sprite: string | null;
  /** Nome para mostrar ao TOCAR; `null` = o texto genérico. Nunca número. */
  nome: string | null;
  /** Ponto de repouso, em % da largura da cena. */
  home: number;
  /** Meia-amplitude da caminhada, em % da largura (a criatura vai de `home - amp` a `home + amp`). */
  amp: number;
  /** 0..2 — três "faixas" de profundidade, para ninguém andar em fila indiana. */
  lane: number;
  /** Duração de UMA travessia, em s. */
  dur: number;
  /** Atraso (negativo) em s: cada sprite começa num ponto diferente do trajeto. */
  delay: number;
}

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Quem anda: todos os membros (até 12) na ordem de chegada. Se a vista não traz a SUA criatura entre os
 * membros, ela entra na frente (quem olha sempre se vê). Sem membros (vista vazia), só a sua.
 */
export function groveWalkers(guild: Pick<GuildView, 'members'>): GroveWalker[] {
  const todos = guild.members.slice(0, GROVE_WALKERS_MAX);
  const temEu = todos.some(m => m.euMesmo);
  const lista = temEu ? todos : [null, ...guild.members.slice(0, GROVE_WALKERS_MAX - 1)];
  const n = lista.length;
  const amp = Math.max(7, Math.min(30, Math.round(110 / n)));
  return lista.map((m, i) => {
    const own = m === null || m.euMesmo;
    const key = own ? 'eu' : (m!.id ?? `m${i}`);
    const h = hash(own ? `eu-${i}` : key);
    const home = Math.max(amp + 2, Math.min(100 - amp - 2, ((i + 0.5) / n) * 100));
    const dur = 14 + (h % 7) * 2; // 14..26 s por travessia
    return {
      key: own ? 'eu' : key,
      own,
      sprite: own ? null : spriteForMember(key),
      nome: own ? null : (m!.name ?? null),
      home: Math.round(home * 10) / 10,
      amp,
      lane: (h >>> 4) % 3,
      dur,
      delay: -Math.round(((h >>> 8) % (dur * 10))) / 10,
    };
  });
}

/** Pausa até o próximo balão: `rand` em [0,1) -> 20..45 s. */
export function nextBubbleDelay(rand: number): number {
  return BUBBLE_MIN_MS + Math.floor(Math.max(0, Math.min(0.999999, rand)) * BUBBLE_SPAN_MS);
}

/** Quem fala e o que diz: dois sorteios em [0,1) -> (índice do sprite, 1..N da frase). Sem sprites, nada. */
export function pickBubble(walkers: number, randWho: number, randWhat: number): { who: number; phrase: number } | null {
  if (walkers <= 0) return null;
  const clamp = (r: number) => Math.max(0, Math.min(0.999999, r));
  return { who: Math.floor(clamp(randWho) * walkers), phrase: 1 + Math.floor(clamp(randWhat) * BUBBLE_PHRASES) };
}
