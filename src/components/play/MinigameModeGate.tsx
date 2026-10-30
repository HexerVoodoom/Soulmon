import { useState } from 'react';
import { AreaSheet } from '../nav/AreaSheet';
import { RankingPanel } from '../RankingPanel';
import { sm2Button, ModalSheet } from '../form/FormKit';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import { lotNpcVoice } from '../../utils/areaNpcVoice';
import { difficultyLabel } from '../../utils/minigameDifficulty';
import type { Language } from '../../utils/i18n';
import type { RankedGame } from '../../utils/rankings';

/**
 * A pergunta do Pipo antes de cada minijogo (pedido do dono, 30/10/2026): o NPC do Salão
 * (a mesma folha de NPC das áreas: busto + balão) mostra o botão "Ver ranking", que abre um MODAL com a tabela (RankingPanel inline no quadro de cobre; 2 quadros = abas
 * Comum | Avançado), e deixa escolher. Com dificuldade (Corrida com obstáculos e Pedra·Papel·Tesoura):
 * "Comum" à esquerda, "Avançado" à direita. Sem dificuldade: um único "Jogar".
 * Esquerda = o menor / voltar, direita = avançar. O voltar fecha de volta à área.
 */
export type GateRanking = { game: RankedGame; label?: string };

export function MinigameModeGate({ language, gameName, rankings, saveId, withDifficulty, pveVsPvp = false, onPick, onBack }: {
  language: Language;
  gameName: string;
  rankings: GateRanking[];
  saveId?: string;
  /** Com dificuldade: dois botões (Comum | Avançado); sem: um "Jogar". */
  withDifficulty: boolean;
  /** Dois botões PvE (esquerda) | PvP (direita), como o Fusão Elemental: `onPick(1)` = PvE, `onPick(2)` = PvP. */
  pveVsPvp?: boolean;
  onPick: (level?: 1 | 2) => void;
  onBack: () => void;
}) {
  const isPt = language === 'pt-BR';
  const voice = lotNpcVoice('jogos', 'salao', language);
  const two = withDifficulty || pveVsPvp;
  const line = withDifficulty
    ? (isPt ? 'Você quer jogar no modo Comum ou no modo Avançado?' : 'Common or Advanced mode?')
    : pveVsPvp
      ? (isPt ? 'Você quer enfrentar a fenda (PvE) ou outro jogador (PvP)?' : 'Face the rift (PvE) or another player (PvP)?')
      : (isPt ? 'Pronto para jogar?' : 'Ready to play?');
  const labelOf = (lvl: 1 | 2) => (pveVsPvp ? (lvl === 1 ? 'PvE' : 'PvP') : difficultyLabel(lvl, isPt));
  const [tab, setTab] = useState(0);
  const [rankOpen, setRankOpen] = useState(false);
  const current = rankings[Math.min(tab, rankings.length - 1)];
  return (
    <AreaSheet
      areaId="jogos" lotId="salao" language={language} title={gameName}
      closeLabel={isPt ? 'Voltar' : 'Back'} open onClose={onBack}
      npcArt={lotNpcArt('jogos', 'salao')} npcVoice={{ name: voice.name, line }}
    >
      <div data-minigame-gate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button type="button" data-gate-ranking-open onClick={() => setRankOpen(true)} style={{ ...sm2Button('outline', false), minHeight: 44 }}>
          {isPt ? 'Ver ranking' : 'See ranking'}
        </button>
        <ModalSheet open={rankOpen} onClose={() => setRankOpen(false)} language={language} placement="center" sobreTelas title="Ranking">
          {/* 30/10/2026 (dono): sem a moldura de cobre; a lista ocupa a largura do modal. */}
          <div data-minigame-gate-ranking style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankings.length > 1 && (
              <div role="tablist" aria-label={isPt ? 'Tabelas de ranking' : 'Ranking boards'} style={{ display: 'flex', gap: 6 }}>
                {rankings.map((r, i) => (
                  <button
                    key={r.game} type="button" role="tab" aria-selected={i === tab} data-gate-rank-tab={r.game}
                    onClick={() => setTab(i)}
                    style={{ ...sm2Button(i === tab ? 'primary' : 'outline', false), flex: 1, minWidth: 0, minHeight: 36 }}
                  >
                    {withDifficulty ? difficultyLabel((i + 1) as 1 | 2, isPt) : (r.label ?? r.game)}
                  </button>
                ))}
              </div>
            )}
            {current && (
              <div key={current.game} role={rankings.length > 1 ? 'tabpanel' : undefined}>
                <RankingPanel game={current.game} saveId={saveId} language={language} inline />
              </div>
            )}
          </div>
        </ModalSheet>
        {two ? (
          <div role="group" aria-label={pveVsPvp ? (isPt ? 'Modo' : 'Mode') : (isPt ? 'Dificuldade' : 'Difficulty')} style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-gate-pick="1" onClick={() => onPick(1)} style={{ ...sm2Button('outline', false, 'lg'), flex: 1, minWidth: 0, minHeight: 64 }}>
              {labelOf(1)}
            </button>
            <button type="button" data-gate-pick="2" onClick={() => onPick(2)} style={{ ...sm2Button('primary', false, 'lg'), flex: 1, minWidth: 0, minHeight: 64 }}>
              {labelOf(2)}
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
