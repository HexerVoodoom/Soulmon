/** Arte da jornada do foco (§247, §27 de docs/ASSETS-A-GERAR.md). Falta arte = fallback desenhado (SVG/ícone). */
import type { JourneyKeyId } from '../../utils/focusJourney';
import floresta from '../../assets/soulmon/jornada/bloco-floresta.webp';
import costa from '../../assets/soulmon/jornada/bloco-costa.webp';
import caverna from '../../assets/soulmon/jornada/bloco-caverna.webp';
import jardim from '../../assets/soulmon/jornada/bloco-jardim.webp';
import oficina from '../../assets/soulmon/jornada/bloco-oficina.webp';
import observatorio from '../../assets/soulmon/jornada/bloco-observatorio.webp';
import bauComum from '../../assets/focus-jornada/bau-comum.webp';
import bauBancada from '../../assets/focus-jornada/bau-bancada.webp';
import bauElo from '../../assets/focus-jornada/bau-elo.webp';
import bauPena from '../../assets/focus-jornada/bau-pena.webp';
import bauBrejo from '../../assets/focus-jornada/bau-brejo.webp';
import bauQuadrantes from '../../assets/focus-jornada/bau-quadrantes.webp';
import chaveQuadrantes from '../../assets/focus-jornada/chave-quadrantes.webp';
import brilho from '../../assets/focus-jornada/brilho-bau-sheet.webp';
import bauRelampago from '../../assets/focus-jornada/bau-relampago.webp';
import chaveBancada from '../../assets/focus-jornada/chave-bancada.webp';
import chaveBrejo from '../../assets/focus-jornada/chave-brejo.webp';
import chaveElo from '../../assets/focus-jornada/chave-elo.webp';
import chavePena from '../../assets/focus-jornada/chave-pena.webp';
import chaveRelampago from '../../assets/focus-jornada/chave-relampago.webp';
import bauAbrindo from '../../assets/focus-jornada/bau-abrindo-sheet.webp';

export const JOURNEY_ART: Record<string, string | undefined> = {
  forest: floresta, shore: costa, cavern: caverna, garden: jardim, workshop: oficina, observatory: observatorio,
};
export const CHEST_ART: Partial<Record<JourneyKeyId | 'common', string>> = {
  common: bauComum, bancada: bauBancada, elo: bauElo, pena: bauPena, relampago: bauRelampago, brejo: bauBrejo, quadrantes: bauQuadrantes,
};
export const KEY_ART: Partial<Record<JourneyKeyId, string>> = {
  bancada: chaveBancada, brejo: chaveBrejo, elo: chaveElo, pena: chavePena, relampago: chaveRelampago, quadrantes: chaveQuadrantes,
};
/** Folha 768×256, 4 quadros de 192 (fechado → aberto). */
export const CHEST_OPEN_SHEET = bauAbrindo;
/** Folha 384×128, 3 quadros de 128; o 1º brilha atrás do baú especial cuja chave o jogador tem. */
export const CHEST_GLOW_SHEET = brilho;

/**
 * Salas de descanso (§301): uma por cenário, slot `src/assets/soulmon/jornada/oasis-<cenário>.(webp|png)` (1024×2048, opaco).
 * Sem arquivo, `RestRoom` desenha o fundo em código com `OASIS_TONE`. Prompts: `docs/ASSETS-A-GERAR.md` (1ª seção).
 */
const OASIS_FILES = import.meta.glob('../../assets/soulmon/jornada/oasis-*.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const OASIS_ART: Record<string, string | undefined> = {};
for (const [path, url] of Object.entries(OASIS_FILES)) {
  const env = path.split('/').pop()!.replace(/^oasis-/, '').replace(/\.(webp|png)$/, '');
  if (!OASIS_ART[env] || path.endsWith('.webp')) OASIS_ART[env] = url;
}
export interface OasisTone { sky: string; mid: string; ground: string; glow: string; water: string; waterDeep: string }
/** Paleta calma de cada cenário para o fundo gerado em código. */
export const OASIS_TONE: Record<string, OasisTone> = {
  forest: { sky: '#12362f', mid: '#1c5a48', ground: '#0f2c25', glow: '#bff5d0', water: '#5fc9b4', waterDeep: '#1d6f66' },
  shore: { sky: '#12384a', mid: '#2a7088', ground: '#143a44', glow: '#cdf3f7', water: '#6fd4e0', waterDeep: '#1f7f93' },
  cavern: { sky: '#0e2a30', mid: '#1b4a52', ground: '#0b1f24', glow: '#9ff3f0', water: '#58e0e0', waterDeep: '#17757c' },
  garden: { sky: '#183d38', mid: '#2c6e57', ground: '#14322b', glow: '#ffe9b8', water: '#7ed6b6', waterDeep: '#25806b' },
  workshop: { sky: '#17312f', mid: '#38544a', ground: '#14241f', glow: '#ffd89a', water: '#6cc3a8', waterDeep: '#25705f' },
  observatory: { sky: '#0a2030', mid: '#154459', ground: '#0a1a24', glow: '#d7e8ff', water: '#6fb6e8', waterDeep: '#1d5f8f' },
};
