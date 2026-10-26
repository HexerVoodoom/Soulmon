/**
 * O SOULSMITH — os TEXTOS (EN primeiro, PT-BR depois), separados de `forge.ts` porque só a `ForgeCard` (`lazy`) os lê e o orçamento
 * de bytes pesa no chunk de entrada. Vocabulário da NARRATIVA: "Vínculo" para a criatura, "nível" só da PEÇA; sem cobrança, sem pressa,
 * sem palavra de sorte (`copy.semFomo`).
 */
import type { ForgeRefusal } from './forgeActions';
import { FORGE_MAX_LEVEL, LEVEL_MIN_BOND } from './forge';

/** O motivo de uma recusa, neutro e com a saída dita (o que falta, onde vem). */
export function forgeRefusalText(r: ForgeRefusal, isPt: boolean, level = 0): string {
  switch (r) {
    case 'no-materials': return isPt ? 'Ainda faltam materiais. Eles vêm das missões dos prédios, uma por dia, sem pressa.' : 'Some materials are still missing. They come from the buildings’ missions, one a day, no rush.';
    case 'bond': return isPt ? `Este nível abre no Vínculo ${LEVEL_MIN_BOND[level + 1] ?? ''}. Ele cresce com o que você já faz por aqui.` : `This level opens at Bond ${LEVEL_MIN_BOND[level + 1] ?? ''}. It grows with what you already do here.`;
    case 'max-level': return isPt ? `Esta peça já está no nível ${FORGE_MAX_LEVEL}.` : `This piece is already at level ${FORGE_MAX_LEVEL}.`;
    case 'not-owned': return isPt ? 'Esta peça vem da missão do prédio dela.' : 'This piece comes from its building’s mission.';
    case 'no-funds': return isPt ? 'Ainda faltam Bits. Eles chegam jogando, sem pressa.' : 'Not enough Bits yet. They come from playing, no rush.';
    case 'not-earned': return isPt ? 'Refazer só aceita Bits que você ganhou jogando. Os Bits vindos de Créditos servem para outras coisas.' : 'Redoing only takes Bits you earned by playing. Bits that came from Credits are for other things.';
    case 'no-fragments': return isPt ? 'Ainda faltam fragmentos. Eles vêm das descidas completas da Fenda.' : 'Not enough fragments yet. They come from completed Endless Rift runs.';
    case 'same': return isPt ? 'Esta já é a escolha atual.' : 'That is already the current choice.';
    default: return isPt ? 'Isto não está disponível agora.' : 'That is not available right now.';
  }
}

/**
 * O que CADA atributo faz em luta, em palavras diretas (11/10/2026, pedido do dono: "apresente as DUAS opções como iguais — mais dano OU
 * mais velocidade —, sem 'esta seria a correta para este item'"). Nenhum atributo é "o certo" para a peça: as duas opções de um nível
 * valem o MESMO e a diferença é só onde a peça ajuda. `short` é o nome do ganho; `effect` diz o efeito sem número (o número vem de fora).
 */
export const ATTR_EFFECT: Readonly<Record<'atk' | 'def' | 'spd', { readonly shortEn: string; readonly shortPt: string; readonly effectEn: string; readonly effectPt: string }>> = {
  atk: { shortEn: 'More damage', shortPt: 'Mais dano', effectEn: 'Your Soulmon hits a little harder.', effectPt: 'O seu Soulmon bate um pouco mais forte.' },
  def: { shortEn: 'More defense', shortPt: 'Mais defesa', effectEn: 'Your Soulmon takes a little less damage.', effectPt: 'O seu Soulmon recebe um pouco menos de dano.' },
  spd: { shortEn: 'More speed', shortPt: 'Mais velocidade', effectEn: 'Your Soulmon attacks a little faster.', effectPt: 'O seu Soulmon ataca um pouco mais rápido.' },
};
