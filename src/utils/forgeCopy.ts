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
    case 'no-fragments': return isPt ? 'Ainda faltam fragmentos. Eles vêm das runs completas da Masmorra.' : 'Not enough fragments yet. They come from completed Dungeon runs.';
    case 'same': return isPt ? 'Esta já é a escolha atual.' : 'That is already the current choice.';
    default: return isPt ? 'Isto não está disponível agora.' : 'That is not available right now.';
  }
}
