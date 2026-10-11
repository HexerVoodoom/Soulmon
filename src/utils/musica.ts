/**
 * O DIRETOR DE MÚSICA — qual faixa toca em qual superfície (11/10/2026, pedido do dono: "gosto das duas, a música
 * tema e a de loop; a de LOOP pode ser usada na DUNGEON; e pensar numa outra para o combate da ARENA").
 *
 *     Home / páginas ........ tema  ("Stone Hall Decay", `tema.ts`)
 *     Masmorra .............. loop  (as duas camadas da trilha, `trilha.ts`, em combate)
 *     Arena ................. faixa DERIVADA (as camadas a 1,2× + percussão procedural, `trilhaArena.ts`)
 *
 * Este módulo é só a TABELA e o apply: não toca nada, não tem constante de loudness, não lê relógio. Quem toca é o
 * `tema.ts` (streaming, `busTema`) e o `trilha.ts` (buffers, `busTrilha`); a política de nível é de `loudness.ts`.
 *
 * Regras que ele cumpre, cada uma com teste em `musica.test.ts`:
 *  - **Nasce desligada / só por gesto (S2 + D11).** O tema continua a única música que nasce ligada (S17) e só
 *    começa no primeiro gesto. As faixas de combate são do interruptor "Música de masmorra e arena" das
 *    Configurações (`SOUND_TRACK_ENABLED`, nasce DESLIGADO). Entrar na masmorra/arena é um gesto do jogador (ele
 *    abriu o jogo), então `consentirNestaSessao()` vale como o primeiro gesto da S2 — mas só com o interruptor ligado.
 *  - **Uma música por vez, com crossfade (S17 emendada).** Antes "ligar uma desliga a outra"; agora as duas
 *    preferências convivem e o diretor garante que NUNCA soam juntas: ao entrar em combate o tema recebe o motivo
 *    de pausa `cena` (desce em `CROSSFADE_MUSICA_S`) enquanto a faixa de combate sobe; ao sair, o inverso, e o
 *    tema volta de onde parou.
 *  - **Sem interruptor de combate, nada muda**: o tema segue tocando na masmorra/arena (só mais baixo, o degrau do
 *    combate em `loudness.ts`).
 *  - **Pilha de superfícies**: sair de uma volta à anterior, não à Home (uma Arena aberta de dentro de outra tela).
 */
import { pedirFaixa, consentirNestaSessao, trilhaPreferida, type FaixaDaTrilha } from './trilha';
import { definirTemaEmCombate, pausarTema, retomarTema, temaPreferido } from './tema';

export type Superficie = 'casa' | 'masmorra' | 'arena';
export type FaixaDeMusica = 'tema' | FaixaDaTrilha;

/** A tabela superfície → faixa de COMBATE (a que o interruptor de combate liga). A Home não tem: é o tema. */
export const FAIXA_DE_COMBATE: Record<Exclude<Superficie, 'casa'>, FaixaDaTrilha> = {
  masmorra: 'masmorra',
  arena: 'arena',
};

/** Pura: a faixa que deve soar dada a superfície e as duas preferências. `null` = silêncio. */
export function escolherFaixa(s: Superficie, temaOn: boolean, combateOn: boolean): FaixaDeMusica | null {
  if (s === 'casa') return temaOn ? 'tema' : combateOn ? 'loop' : null; // sem tema, quem ligou só o loop o tem na Home (legado)
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
  const f = escolherFaixa(s, temaPreferido(), trilhaPreferida());
  definirTemaEmCombate(s !== 'casa');
  if (f === 'tema' || f === null) {
    pedirFaixa(null);
    retomarTema('cena');
  } else {
    pausarTema('cena');
    pedirFaixa(f);
  }
}

/**
 * O jogador abriu uma superfície (Masmorra, Arena): chame de um `useEffect` de montagem e devolva o retorno como
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
  reavaliarMusica();
}

/** Só para teste. */
export function esquecerMusica(): void {
  pilha.splice(1);
}
