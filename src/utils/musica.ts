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
 *  - **UMA preferência só, "Música" (§129, emenda S17/§102).** Um interruptor nas Configurações (`audioBus.musicaLigada`)
 *    liga/desliga o tema da Home, o combate (Masmorra, Arena, Duelo, Torneio) e o Pesadelo. Nasce LIGADA; só toca depois
 *    de gesto (D11). Entrar numa superfície de combate é um gesto do jogador, então `consentirNestaSessao()` vale como o
 *    primeiro gesto. Desligada = silêncio em todas as superfícies (não há mais "tema mais baixo em combate").
 *  - **Uma música por vez, com crossfade (S17 emendada).** Ao entrar em combate o tema recebe o motivo de pausa `cena`
 *    (desce em `CROSSFADE_MUSICA_S`) enquanto a faixa de combate sobe; ao sair, o inverso, e o tema volta de onde parou.
 *    Combate ↔ pesadelo também é crossfade.
 *  - **Pilha de superfícies**: sair de uma volta à anterior, não à Home (uma Arena aberta de dentro de outra tela).
 */
import { migrarPreferenciaDeMusica, musicaLigada } from './audioBus';
import { pedirFaixa, consentirNestaSessao, ligarTrilha, desligarTrilha } from './trilha';
import { definirTemaEmCombate, pausarTema, retomarTema, ligarTema, desligarTema } from './tema';
import { pedirMusicaDeCombate } from './musicaDeCombate';
import type { MusicaDeCombate } from './sonsAssets';

/** `pesadelo` (15/10/2026): o convite e a luta do Pesadelo. `torneio`/`duelo` (19/10/2026): o lobby e a luta do PvP. */
export type Superficie = 'casa' | 'masmorra' | 'arena' | 'pesadelo' | 'torneio' | 'duelo';
export type FaixaDeMusica = 'tema' | MusicaDeCombate;

/** A tabela superfície → faixa de COMBATE (a que o interruptor de música liga). A Home não tem: é o tema. */
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

/** Pura: a faixa que deve soar dada a superfície e a preferência única. `null` = silêncio. */
export function escolherFaixa(s: Superficie, musicaOn: boolean): FaixaDeMusica | null {
  if (!musicaOn) return null;
  return s === 'casa' ? 'tema' : FAIXA_DE_COMBATE[s];
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
  const f = escolherFaixa(s, musicaLigada());
  if (f === 'tema' || f === null) {
    pedirMusicaDeCombate(null);
    retomarTema('cena');
  } else {
    pausarTema('cena');
    pedirMusicaDeCombate(f, SUPERFICIE_EM_COMBATE[s]);
  }
}

/** A preferência única de música (§129), para a UI das Configurações. */
export function musicaPreferida(): boolean {
  return musicaLigada();
}

/** Gesto do jogador nas Configurações: liga tudo (tema + combate + pesadelo); ligar é o gesto que dá consentimento. */
export function ligarMusica(): void {
  ligarTrilha();
  ligarTema();
  reavaliarMusica();
}

/** Gesto do jogador nas Configurações: desliga tudo. */
export function desligarMusica(): void {
  desligarTrilha();
  desligarTema();
  reavaliarMusica();
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
  migrarPreferenciaDeMusica(); // §129: as três chaves legadas viram a preferência única, uma vez, antes da primeira leitura
  reavaliarMusica();
}

/** Só para teste. */
export function esquecerMusica(): void {
  pilha.splice(1);
}
