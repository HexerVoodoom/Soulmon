// RETRATOS DE OPONENTE DO DUELO (rodada 3, 01/10/2026 — `E:/Soulmon-assets/out/rodada3/extras/`,
// folha "faltantes-1", 6 × 128², pixel de 2, alfa binário): criaturas originais por elemento, para
// o oponente de duelo que não tem sprite próprio.
//
// R8 (04/10/2026): agora tem chamada — os três desafiantes NPC do Torneio vazio (`utils/tournamentNpcs.ts`,
// treino com outra roupa, sem partida do dia e sem ganho). O oponente de jogador de verdade continua com o
// sprite do ESTÁGIO REAL dele (`TournamentPage` › `getSpriteForStage(opp.stage)`): trocar isso por um retrato
// genérico apagaria a informação de estágio (DUELO-1, `docs/PERGUNTAS-DO-DONO.md`).
import op1 from '../assets/soulmon/duelo/duelo-oponente-1.png';
import op2 from '../assets/soulmon/duelo/duelo-oponente-2.png';
import op3 from '../assets/soulmon/duelo/duelo-oponente-3.png';
import op4 from '../assets/soulmon/duelo/duelo-oponente-4.png';
import op5 from '../assets/soulmon/duelo/duelo-oponente-5.png';
import op6 from '../assets/soulmon/duelo/duelo-oponente-6.png';

/** Os seis retratos, na ordem da folha: planta espinhosa (Flora/Veneno), inseto (Obsidiana/Trovão Negro),
 *  réptil (Lava/Titã), cristal (Cristal/Aurora — o único fofo), aquática (Abismo/Água-Viva), espírito (Espectro/Murmúrio). */
export const DUELO_OPONENTE_ART = [op1, op2, op3, op4, op5, op6] as const;

/** Um retrato estável para uma chave (id do oponente, semente do duelo): o mesmo valor devolve sempre o mesmo. */
export function dueloOponenteArt(key: string | number): string {
  const s = String(key);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return DUELO_OPONENTE_ART[h % DUELO_OPONENTE_ART.length];
}
