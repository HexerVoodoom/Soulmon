/**
 * MODO DESAFIO dos jogos (Calabouço, beta3): um jogo real montado com meta curta e um callback de resultado.
 * Com `challenge`, o jogo NÃO paga Bits, NÃO grava recorde e NÃO mostra/submete ranking — só devolve vitória/derrota.
 * Sem a prop, o jogo é exatamente o normal. `goal` tem unidade própria de cada jogo (ver `GAME_GOALS` em rogueDungeon.ts).
 */
export interface GameChallenge {
  goal: number;
  onResult: (won: boolean) => void;
}
