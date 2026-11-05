/**
 * TREINO COM AMIGO (§242). Luta de treino contra a criatura de um amigo, 100% LOCAL e unilateral: sem rede, sem aprovação dele,
 * e SEM VALOR. Não paga Bits, Honra, pontos, XP de Vínculo, missão nem ranking, não gasta a partida do dia e não grava nada no
 * save. O oponente nasce só de dado PÚBLICO do amigo (estágio, elemento, arte): nunca da ficha nem do save dele.
 *
 * É a mesma `DuelScreen` e a mesma simulação do treino do Torneio; o aviso de fim diz "treino, sem prêmio".
 */
import { useState } from 'react';
import { DuelScreen } from './DuelScreen';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button } from './form/FormKit';
import { simulatePvp, type DuelSide } from '../utils/combate/duel';
import { specialOf } from '../utils/combate/specials';
import { soulCombatant, type SoulXPState } from '../utils/soulXP';
import { familyOfSkill } from '../utils/arena';
import { fxDoLutador } from '../utils/fighterIdentity';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { hexFamily } from '../utils/hexsmith';
import { useHexOverrides } from '../hooks/useHexOverrides';
import { usePvpTalents } from '../contexts/useTalentBonus';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { getSpriteForStage } from '../utils/sprites';
import { opponentSprite, type OpponentArtSource } from '../utils/opponentArt';
import { opponentElementFor } from '../utils/combatFx';
import { SCENE_BG } from '../utils/fxPackArt';

/** O pedaço PÚBLICO de um amigo que o treino usa (o que `action=player` já devolve a qualquer um). */
export interface TrainingFriend extends OpponentArtSource {
  name: string;
  petName?: string;
  element?: string | null;
}

export interface FriendTrainerProps {
  petStage: string;
  petLine?: string;
  petElement?: string;
  skills?: FichaSkills;
}

/** O lado do amigo no treino: só o estágio público dele. Especial comum (o treino ensina a torcer, não as famílias). */
export function friendTrainingSide(friend: Pick<TrainingFriend, 'stage'>): DuelSide {
  return { combatant: soulCombatant({ evolutionStage: friend.stage }), special: specialOf('direct') };
}

export function FriendTraining({ friend, trainer, isPt, onClose }: { friend: TrainingFriend; trainer: FriendTrainerProps; isPt: boolean; onClose: () => void }) {
  const ctx = useGameStateOptional();
  const hx = useHexOverrides();
  const talentos = usePvpTalents();
  const gs = ctx?.gameState;
  const [fight] = useState(() => {
    const estado: SoulXPState = gs
      ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP, evoStatFloor: gs.evoStatFloor }
      : { evolutionStage: trainer.petStage };
    const par = stageSkillsFor(trainer.skills, trainer.petStage);
    const me: DuelSide = {
      combatant: soulCombatant(estado, talentos.bonus),
      cheerScale: talentos.cheerScale,
      startEnergy: talentos.startEnergy,
      dotResist: talentos.dotResist,
      special: specialOf(hexFamily(familyOfSkill(par?.especial), hx)),
      fx: fxDoLutador(par, trainer.petElement),
    };
    return { seed: Math.floor(Math.random() * 0xffffffff), me, opp: friendTrainingSide(friend) };
  });
  const [outcome, setOutcome] = useState<'win' | 'loss' | 'draw' | null>(null);
  const nome = friend.petName || friend.name;

  if (outcome) {
    const text = outcome === 'win'
      ? (isPt ? 'Você levou a melhor no treino.' : 'You got the better of the training.')
      : outcome === 'loss'
        ? (isPt ? 'Dessa vez o treino foi do seu amigo.' : 'This time the training went to your friend.')
        : (isPt ? 'O treino terminou empatado.' : 'The training ended in a draw.');
    return (
      <RitualDialog onClose={onClose} labelledBy="sm2-treino-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320} closeOnBackdrop>
        <h2 id="sm2-treino-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>
          {isPt ? `Treino com ${nome}` : `Training with ${nome}`}
        </h2>
        <p className="sm2-lib-s" data-treino-resultado={outcome} style={{ margin: '0 0 8px' }}>{text}</p>
        {/* A regra dita em voz alta: treino não vale nada, e é de propósito. */}
        <p className="sm2-lib-s" data-treino-sem-premio style={{ margin: '0 0 12px' }}>
          {isPt ? 'Sem prêmio e sem custo: não conta para nada.' : 'No prize and no cost: it counts for nothing.'}
        </p>
        <button type="button" onClick={onClose} style={{ ...sm2Button('outline', false, 'sm'), width: '100%' }}>{isPt ? 'Fechar' : 'Close'}</button>
      </RitualDialog>
    );
  }

  return (
    <DuelScreen
      scene={SCENE_BG.torneioLobby}
      me={fight.me}
      opp={fight.opp}
      seed={fight.seed}
      petSprite={getSpriteForStage(trainer.petStage, trainer.petLine, 256)}
      oppSprite={opponentSprite(friend, 256)}
      oppStage={friend.stage}
      oppElement={opponentElementFor({ id: friend.id ?? '', element: friend.element })}
      petElement={trainer.petElement}
      petStage={trainer.petStage}
      skills={trainer.skills}
      petName={isPt ? 'Você' : 'You'}
      oppName={nome}
      isPt={isPt}
      onDone={taps => {
        const w = simulatePvp({ me: fight.me, opp: fight.opp, seed: fight.seed, taps }).winner;
        setOutcome(w === 'me' ? 'win' : w === 'opp' ? 'loss' : 'draw');
      }}
      onClose={onClose}
    />
  );
}
