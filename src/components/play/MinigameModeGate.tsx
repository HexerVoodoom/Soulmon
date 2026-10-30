import { AreaSheet } from '../nav/AreaSheet';
import { RankingPanel } from '../RankingPanel';
import { sm2Button } from '../form/FormKit';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import { lotNpcVoice } from '../../utils/areaNpcVoice';
import { difficultyLabel } from '../../utils/minigameDifficulty';
import type { Language } from '../../utils/i18n';
import type { RankedGame } from '../../utils/rankings';

/**
 * A pergunta do Pipo antes de cada minijogo (pedido do dono, 30/10/2026): o NPC do Salão
 * (a mesma folha de NPC das áreas: busto + balão) mostra o RANKING do jogo no topo e, só
 * depois, deixa escolher. Com dificuldade (Corrida com obstáculos e Pedra·Papel·Tesoura):
 * "Comum" à esquerda, "Avançado" à direita. Sem dificuldade: um único "Jogar".
 * Esquerda = o menor / voltar, direita = avançar. O voltar fecha de volta à área.
 */
export type GateRanking = { game: RankedGame; label?: string };

export function MinigameModeGate({ language, gameName, rankings, saveId, withDifficulty, onPick, onBack }: {
  language: Language;
  gameName: string;
  rankings: GateRanking[];
  saveId?: string;
  /** Com dificuldade: dois botões (Comum | Avançado); sem: um "Jogar". */
  withDifficulty: boolean;
  onPick: (level?: 1 | 2) => void;
  onBack: () => void;
}) {
  const isPt = language === 'pt-BR';
  const voice = lotNpcVoice('jogos', 'salao', language);
  const line = withDifficulty
    ? (isPt ? 'Você quer jogar no modo Comum ou no modo Avançado?' : 'Common or Advanced mode?')
    : (isPt ? 'Pronto para jogar?' : 'Ready to play?');
  return (
    <AreaSheet
      areaId="jogos" lotId="salao" language={language} title={gameName}
      closeLabel={isPt ? 'Voltar' : 'Back'} open onClose={onBack}
      npcArt={lotNpcArt('jogos', 'salao')} npcVoice={{ name: voice.name, line }}
    >
      <div data-minigame-gate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-minigame-gate-ranking style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rankings.map(r => (
            <div key={r.game}>
              {r.label && <b style={{ display: 'block', marginBottom: 2 }}>{r.label}</b>}
              <RankingPanel game={r.game} saveId={saveId} language={language} />
            </div>
          ))}
        </div>
        {withDifficulty ? (
          <div role="group" aria-label={isPt ? 'Dificuldade' : 'Difficulty'} style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-gate-pick="1" onClick={() => onPick(1)} style={{ ...sm2Button('outline', false, 'lg'), flex: 1, minWidth: 0, minHeight: 64 }}>
              {difficultyLabel(1, isPt)}
            </button>
            <button type="button" data-gate-pick="2" onClick={() => onPick(2)} style={{ ...sm2Button('primary', false, 'lg'), flex: 1, minWidth: 0, minHeight: 64 }}>
              {difficultyLabel(2, isPt)}
            </button>
          </div>
        ) : (
          <button type="button" data-gate-play onClick={() => onPick()} style={{ ...sm2Button('primary', false, 'lg'), minHeight: 64 }}>
            {isPt ? 'Jogar' : 'Play'}
          </button>
        )}
      </div>
    </AreaSheet>
  );
}
