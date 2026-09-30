/**
 * O CONTRATO COMUM dos minijogos dos prédios novos da área Jogos (30/09/2026,
 * pedido do dono: um prédio de jogos livres, um de jogos de mente e um para
 * momentos difíceis — `docs/BENCHMARK-MINIJOGOS.md` §6).
 *
 * É a mesma assinatura que Dino/PPT já tinham (`language`, `evolutionStage`,
 * `demoCharacterId`, `onExit`, e `onEarnPoints` para quem paga Bits). Os Bits
 * passam pelo funil único do `App` (`handleEarnGamePoints`), que aplica o teto
 * diário de minijogo — nenhum jogo decide teto por conta própria.
 *
 * Regras que TODO jogo daqui cumpre (benchmark §1 e §7):
 *  · nasce MUDO (R-NOVA, `docs/SOM.md`) — nenhum import de `utils/sounds`;
 *  · perder não custa nada além da rodada; nada de vermelho, nada de "errou";
 *  · nenhum texto promete efeito cognitivo ("treina o cérebro", "melhora a
 *    memória") — a copy DESCREVE o que o jogo pede (caso FTC × Lumosity);
 *  · nenhum número-veredito (idade do cérebro, percentil, ranking).
 */
import type { Language } from '../../utils/i18n';

export interface MiniGameBaseProps {
  language: Language;
  evolutionStage: string;
  /** Linha de arte do save (`spriteLineOf`) — para desenhar o pet. */
  demoCharacterId?: string;
  onExit: () => void;
}

/** Jogos que pagam Bits (os de mente). Os do Refúgio NÃO recebem isto. */
export interface EarningGameProps extends MiniGameBaseProps {
  onEarnPoints: (pts: number) => void;
}
