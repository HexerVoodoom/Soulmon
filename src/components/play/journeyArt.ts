/** Arte da jornada do foco (§247, §27 de docs/ASSETS-A-GERAR.md). Falta arte = fallback desenhado (SVG/ícone). */
import type { JourneyKeyId } from '../../utils/focusJourney';
import floresta from '../../assets/focus-jornada/cenario-floresta.webp';
import costa from '../../assets/focus-jornada/cenario-costa.webp';
import caverna from '../../assets/focus-jornada/cenario-caverna.webp';
import jardim from '../../assets/focus-jornada/cenario-jardim.webp';
import oficina from '../../assets/focus-jornada/cenario-oficina.webp';
import observatorio from '../../assets/focus-jornada/cenario-observatorio.webp';
import bauComum from '../../assets/focus-jornada/bau-comum.webp';
import bauBancada from '../../assets/focus-jornada/bau-bancada.webp';
import bauElo from '../../assets/focus-jornada/bau-elo.webp';
import bauPena from '../../assets/focus-jornada/bau-pena.webp';
import bauRelampago from '../../assets/focus-jornada/bau-relampago.webp';
import chaveBancada from '../../assets/focus-jornada/chave-bancada.webp';
import chaveBrejo from '../../assets/focus-jornada/chave-brejo.webp';
import chaveElo from '../../assets/focus-jornada/chave-elo.webp';
import chavePena from '../../assets/focus-jornada/chave-pena.webp';
import chaveRelampago from '../../assets/focus-jornada/chave-relampago.webp';
import chegada from '../../assets/focus-jornada/cena-chegada.webp';
import bauAbrindo from '../../assets/focus-jornada/bau-abrindo-sheet.webp';

export const JOURNEY_ART: Record<string, string | undefined> = {
  forest: floresta, shore: costa, cavern: caverna, garden: jardim, workshop: oficina, observatory: observatorio,
};
/** Brejo e Quadrantes (baú) e Quadrantes (chave) aguardam nova geração com alfa real. */
export const CHEST_ART: Partial<Record<JourneyKeyId | 'common', string>> = {
  common: bauComum, bancada: bauBancada, elo: bauElo, pena: bauPena, relampago: bauRelampago,
};
export const KEY_ART: Partial<Record<JourneyKeyId, string>> = {
  bancada: chaveBancada, brejo: chaveBrejo, elo: chaveElo, pena: chavePena, relampago: chaveRelampago,
};
export const ARRIVAL_ART = chegada;
/** Folha 768×256, 4 quadros de 192 (fechado → aberto). */
export const CHEST_OPEN_SHEET = bauAbrindo;
