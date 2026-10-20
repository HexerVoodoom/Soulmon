/**
 * O DIRETOR DE MÚSICA — qual faixa toca em qual superfície (reescrito em 19/10/2026, REGISTRO §102, três faixas do Suno).
 *
 *     Home / páginas ........ tema  ("Stone Hall Decay", `tema.ts`)
 *     Masmorra, Arena,
 *     Torneio, Duelo ........ "combate" ("Stone Hall Combat", streaming, `musicaDeCombate.ts`)
 *     Pesadelo .............. "pesadelo" ("Stone Hall Nightmare", streaming, `musicaDeCombate.ts`)
 *
 * Este módulo é só a TABELA e o apply: não toca nada, não tem constante de loudness, não lê relógio. Quem toca é o
 * `tema.ts` (streaming, `busTema`) e o `musicaDeCombate.ts` (streaming, `busTrilha`); o loop de camadas de `trilha.ts`
 * não toca em superfície nenhuma (o diretor sempre pede `null`). A política de nível é de `loudness.ts`.
 *
 * Regras que ele cumpre, cada uma com teste em `musica.test.ts`:
 *  - **Nasce desligada / só por gesto (S2 + D11).** O tema continua a única música que nasce ligada (S17) e só
 *    começa no primeiro gesto. As faixas de combate são do interruptor "Música de combate" das
 *    Configurações (`SOUND_TRACK_ENABLED`, nasce LIGADO desde 19/10/2026, REGISTRO §102; só toca depois de gesto).
 *    Entrar numa superfície de combate é um gesto do jogador (ele abriu o jogo), então `consentirNestaSessao()`
 *    vale como o primeiro gesto da S2 — mas só com o interruptor ligado.
 *  - **Uma música por vez, com crossfade (S17 emendada).** As preferências convivem e o diretor garante que NUNCA soam
 *    juntas: ao entrar em combate o tema recebe o motivo de pausa `cena` (desce em `CROSSFADE_MUSICA_S`) enquanto a
 *    faixa de combate sobe; ao sair, o inverso, e o tema volta de onde parou. Combate ↔ pesadelo também é crossfade.
 *  - **O interruptor "Música de combate" cobre combate + pesadelo.** Desligado, o Pesadelo segue como as demais
 *    superfícies de combate: o tema (se ligado) fica, só mais baixo (o degrau do combate em `loudness.ts`); senão, silêncio.
 *  - **Pilha de superfícies**: sair de uma volta à anterior, não à Home (uma Arena aberta de dentro de outra tela).
 */
import { migrarPreferenciasDeSom } from './audioBus';
import { pedirFaixa, consentirNestaSessao, trilhaPreferida } from './trilha';
import { definirTemaEmCombate, pausarTema, retomarTema, temaPreferido } from './tema';
import { pedirMusicaDeCombate } from './musicaDeCombate';
import type { MusicaDeCombate } from './sonsAssets';

/** `pesadelo` (15/10/2026): o convite e a luta do Pesadelo. `torneio`/`duelo` (19/10/2026): o lobby e a luta do PvP. */
export type Superficie = 'casa' | 'masmorra' | 'arena' | 'pesadelo' | 'torneio' | 'duelo';
export type FaixaDeMusica = 'tema' | MusicaDeCombate;

/** A tabela superfície → faixa de COMBATE (a que o interruptor de combate liga). A Home não tem: é o tema. */
export const FAIXA_DE_COMBATE: Record<Exclude<Superficie, 'casa'>, MusicaDeCombate> = {
  masmorra: 'combate',
  arena: 'combate',
  torneio: 'combate',
  duelo: 'combate',
  pesadelo: 'pesadelo',
};

/** Em combate a música desce o offset da política. O lobby do Torneio NÃO é luta. */
export const SUPERFICIE_EM_COMBATE: Record<Superficie, boolean> = {
  casa: false, torneio: false, masmorra: true, arena: true, duelo: true, pesadelo: true,
};

/**
 * Pura: a faixa que deve soar dada a superfície e as duas preferências. `null` = silêncio.
 * O legado "só o loop ligado → loop na Home" SAIU (19/10/2026): o interruptor agora nasce LIGADO e se chama "Música
 * de combate"; quem desligou o tema ganharia o loop na Home sem pedir.
 */
export function escolherFaixa(s: Superficie, temaOn: boolean, combateOn: boolean): FaixaDeMusica | null {
  if (s === 'casa') return temaOn ? 'tema' : null;
  if (combateOn) return FAIXA_DE_COMBATE[s];
  return temaOn ? 'tema' : null;
}

const pilha: Superficie[] = ['casa'];
const topo = (): Superficie => pilha[pilha.length - 1];

export function superficieAtual(): Superficie {
  return topo();
}

/** Reaplica a escolha: chamado ao trocar de superfície e depois de cada interruptor das Configurações. */
export function reavaliarMusica(): void {
  const s = topo();
  definirTemaEmCombate(SUPERFICIE_EM_COMBATE[s]);
  pedirFaixa(null); // o loop de camadas não toca em superfície nenhuma
  const f = escolherFaixa(s, temaPreferido(), trilhaPreferida());
  if (f === 'tema' || f === null) {
    pedirMusicaDeCombate(null);
    retomarTema('cena');
  } else {
    pausarTema('cena');
    pedirMusicaDeCombate(f, SUPERFICIE_EM_COMBATE[s]);
  }
}

/**
 * O jogador abriu uma superfície (Masmorra, Arena, Torneio, Duelo, Pesadelo): chame de um `useEffect` de montagem e devolva o retorno como
 * limpeza. Sair volta à superfície anterior.
 */
export function entrarNaSuperficie(s: Superficie): () => void {
  pilha.push(s);
  if (s !== 'casa') consentirNestaSessao();
  reavaliarMusica();
  let saiu = false;
  return () => {
    if (saiu) return;
    saiu = true;
    const i = pilha.lastIndexOf(s);
    if (i > 0) pilha.splice(i, 1);
    reavaliarMusica();
  };
}

/** `main.tsx`: põe o diretor na Home logo na partida, antes do primeiro gesto (não toca nada — só decide). */
export function iniciarMusica(): void {
  migrarPreferenciasDeSom(); // §127: o 'false' herdado da S2 sai uma vez, antes da primeira leitura
  reavaliarMusica();
}

/** Só para teste. */
export function esquecerMusica(): void {
  pilha.splice(1);
}
