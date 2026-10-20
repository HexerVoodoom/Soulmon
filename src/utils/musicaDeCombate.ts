/**
 * AS MÚSICAS DE COMBATE em streaming — `combate` ("Stone Hall Combat") e `pesadelo` ("Stone Hall Nightmare") (decisão do
 * dono, 19/10/2026, `docs/REGISTRO-DE-DECISOES.md` §102): Masmorra, Arena, Torneio e Duelo tocam `combate`; o Pesadelo toca
 * `pesadelo` (ver `musica.ts`, o diretor). Este módulo é o ÚNICO dono de toda música de combate (não há trilha procedural).
 * Trocar `combate` ↔ `pesadelo` é crossfade: a velha desce, a nova sobe (`pedirMusicaDeCombate`).
 *
 * Este módulo é o DONO DO ESTADO delas (qual foi pedida, se há consentimento, as pausas por motivo); o `<audio>` em si é
 * de `streamMusica.ts` (o mesmo player do tema), ligado ao `busTrilha` — então o interruptor "Música"
 * (`musicaLigada`, nasce LIGADA desde 19/10/2026, §129) e o duck do Marco valem para elas como valem para a trilha.
 *
 * - **D11 / autoplay**: nada toca sem `consentirMusicaDeCombate(true)`, que o `trilha.ts` só dá depois de um gesto
 *   (o interruptor ligado + o primeiro gesto sonoro ou o toque que abriu a superfície). Ligado é preferência.
 * - **Pausas por motivo** (sono / descanso / mudo): o mesmo vocabulário da trilha; `trilha.ts` repassa para cá. Um motivo
 *   não libera o outro. Aba escondida: o player pausa na hora e volta ao reaparecer.
 * - **Nível**: o ganho é decidido por `utils/loudness.ts` (`GANHO_MUSICA_DB`, o trim da faixa e o degrau de combate);
 *   nenhum número de loudness é escrito aqui.
 * - Não importa `trilha.ts` (evita ciclo): é o `trilha.ts` quem avisa este módulo.
 */
import { MUSICAS_DE_COMBATE, CROSSFADE_MUSICA_S, type MusicaDeCombate } from './sonsAssets';
import { criarPlayerDeStreaming, type PlayerDeStreaming } from './streamMusica';
import { db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_MUSICAS_DE_COMBATE_DB } from './loudness';

/** Mesmos motivos da trilha e do tema: quem pausa por um não libera o outro. */
export type MotivoDePausa = 'sono' | 'descanso' | 'mudo';

/** O interruptor de combate ligado + o gesto desta sessão (o `trilha.ts` informa). */
let consentida = false;
let pedida: MusicaDeCombate | null = null;
/** Em combate a música desce o degrau da política; o lobby do Torneio não é luta. */
let emCombate = true;
const pausas = new Set<MotivoDePausa>();
const players: Partial<Record<MusicaDeCombate, PlayerDeStreaming>> = {};
let cicloLigado = false;

const podeTocar = (f: MusicaDeCombate): boolean => consentida && pausas.size === 0 && pedida === f;

function alvo(f: MusicaDeCombate): number {
  return db2lin(GANHO_MUSICA_DB + TRIM_MUSICAS_DE_COMBATE_DB[f] + (emCombate ? OFFSET_MUSICA_EM_COMBATE_DB : 0));
}

function playerDe(f: MusicaDeCombate): PlayerDeStreaming {
  let p = players[f];
  if (!p) {
    p = criarPlayerDeStreaming({
      manifesto: MUSICAS_DE_COMBATE[f],
      bus: b => b.busTrilha,
      podeTocar: () => podeTocar(f),
      alvo: () => alvo(f),
    });
    players[f] = p;
  }
  return p;
}

const faixas = (): MusicaDeCombate[] => Object.keys(players) as MusicaDeCombate[];

function aoTrocarVisibilidade(): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    for (const f of faixas()) players[f]?.ocultar();
    return;
  }
  if (pedida && podeTocar(pedida)) playerDe(pedida).comecar();
}

function ligarCicloDeVida(): void {
  if (cicloLigado || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pageshow', aoTrocarVisibilidade);
  }
  cicloLigado = true;
}

/**
 * O DIRETOR (`musica.ts`) pede a faixa da superfície (`null` = nenhuma música de combate agora). Trocar de faixa é
 * crossfade: a velha desce, a nova sobe. `combate` (padrão `true`) é o degrau da política para esta superfície.
 */
export function pedirMusicaDeCombate(f: MusicaDeCombate | null, combate = true): void {
  const velha = pedida;
  const mudouCombate = emCombate !== combate;
  emCombate = combate;
  pedida = f;
  if (velha !== f) {
    if (velha) players[velha]?.parar(CROSSFADE_MUSICA_S);
    if (f) playerDe(f).comecar(CROSSFADE_MUSICA_S);
    return;
  }
  if (!f) return;
  if (mudouCombate) players[f]?.rampaParaAlvo(CROSSFADE_MUSICA_S);
  playerDe(f).comecar(CROSSFADE_MUSICA_S); // idempotente: já tocando devolve true
}

/** `trilha.ts`: o interruptor ligado + gesto (`on`) ou desligado (`!on`). */
export function consentirMusicaDeCombate(on: boolean): void {
  consentida = on;
  if (on) {
    ligarCicloDeVida();
    if (pedida) playerDe(pedida).comecar(CROSSFADE_MUSICA_S);
    return;
  }
  for (const f of faixas()) players[f]?.parar(CROSSFADE_MUSICA_S);
}

/** Gancho do App (via `pausarTrilha`): sono / descanso / mudo. Um motivo por chamada. */
export function pausarMusicaDeCombate(m: MotivoDePausa): void {
  pausas.add(m);
  for (const f of faixas()) players[f]?.parar(); // dormir/mudo não é troca de cena: rampa curta
}

/** Fim de UMA pausa: só volta se nenhum outro motivo segue vivo e há faixa pedida. */
export function retomarMusicaDeCombate(m: MotivoDePausa): void {
  pausas.delete(m);
  if (pedida && podeTocar(pedida)) playerDe(pedida).comecar();
}

/** A faixa que está de fato soando, ou `null`. */
export function musicaDeCombateTocando(): MusicaDeCombate | null {
  for (const f of faixas()) if (players[f]?.tocando()) return f;
  return null;
}

export function musicaDeCombatePedida(): MusicaDeCombate | null {
  return pedida;
}

/** Só para teste. */
export function esquecerMusicaDeCombate(): void {
  for (const f of faixas()) players[f]?.esquecer();
  for (const f of faixas()) delete players[f];
  consentida = false;
  pedida = null;
  emCombate = true;
  pausas.clear();
}
