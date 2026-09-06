/**
 * Perfil resumido de outro jogador (Biblioteca) — nick, tempo de jogo,
 * tarefas feitas, rank e o branch ATUAL do pet com TODO o progresso já
 * desbloqueado nele (não só o nível atual) — sempre derivado do próprio
 * `unlockedStages`, então nunca vaza forma além da já alcançada.
 *
 * REVAMP: o Soulmon do outro jogador é a heroína do cartão e mora dentro do
 * `<Viewport>`, em escala inteira. As três linhas de ícone+rótulo+valor viraram
 * UMA frase — ninguém decide nada com "Tempo de jogo: 47 dias" empilhado em
 * cima de "Rank: 340", e três ícones para três números era exatamente o tipo de
 * mobília que o revamp corta.
 *
 * A superfície é o `ModalSheet` do kit (`form/FormKit`): ele traz foco preso,
 * Escape e devolução de foco — o modal artesanal daqui não tinha nenhum dos
 * três, e ele era focável por cima da página inteira.
 */
import { FORM_REQUIREMENTS, getStageBranch, getStageLevel } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';
import { isSafeSpriteSrc } from '../utils/spriteLibrary';
import { ATTR_COLOR, ATTR_INK, ATTR_LABEL } from '../types/attributes';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { Viewport } from './ui/Viewport';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { DirectoryPlayer } from '../utils/community';
import type { Language } from '../utils/i18n';

// Rótulo e ícone vêm de `types/attributes.ts`. Este arquivo mantinha uma
// SEGUNDA cópia do mapa de rótulos, idêntica à de `EvolutionPath` — e enquanto
// as duas concordavam, a `StatsPage` não usava nenhuma e mostrava o nome
// interno cru. Duas cópias que concordam ainda são duas cópias.

const LEVEL_LABEL: Record<string, { pt: string; en: string }> = {
  rookie: { pt: 'Rookie', en: 'Rookie' },
  champion: { pt: 'Campeão', en: 'Champion' },
  ultimate: { pt: 'Supremo', en: 'Ultimate' },
  mega: { pt: 'Mega', en: 'Mega' },
  ultra: { pt: 'Ultra', en: 'Ultra' },
};
const LEVEL_ORDER = Object.keys(FORM_REQUIREMENTS);

/** O mesmo jogo de ícone de atributo da Evolução — vetor, e um só no app. */
const ATTR_GLYPH = { virus: PowerIcon, data: HarmonyIcon, vaccine: BenevolenceIcon } as const;

interface PlayerDetailModalProps {
  player: DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string };
  language: Language;
  onClose: () => void;
}

export function PlayerDetailModal({ player, language, onClose }: PlayerDetailModalProps) {
  const isPt = language === 'pt-BR';
  const branch = getStageBranch(player.stage);
  const Glyph = branch ? ATTR_GLYPH[branch] : null;

  // Todos os estágios desbloqueados NO branch atual (rookie é o tronco
  // comum, sem branch, sempre incluído), ordenados por nível.
  const branchLevels = (player.unlockedStages ?? [])
    .filter(s => s === 'rookie' || getStageBranch(s) === branch)
    .sort((a, b) => LEVEL_ORDER.indexOf(getStageLevel(a)) - LEVEL_ORDER.indexOf(getStageLevel(b)));

  return (
    <ModalSheet
      open
      onClose={onClose}
      language={language}
      title={player.name}
      footer={
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Fechar' : 'Close'}
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* WP4.14 — A CRIATURA É VISITÁVEL, e visitar é OLHAR.
            A tela do outro jogador existia como uma ficha pequena; a única
            coisa que a comunidade deste jogo tem de interessante — a criatura
            que a outra pessoa criou — aparecia num quadradinho de 48px.
            Aqui ela ganha tamanho.
            E a visita não tem ESTADO nem NÚMERO (decisão 8 + proibição #21):
            não dá para cutucar, presentear, curtir nem comparar. Uma visita
            que rende alguma coisa deixa de ser visita e vira loop de
            engajamento social — que é exatamente o que este produto recusa
            desde que o `rank` saiu daqui. */}
        <Viewport
          width={48}
          height={48}
          scale={3}
          breathing={false}
          label={isPt ? `Soulmon de ${player.name}` : `${player.name}'s Soulmon`}
          screenStyle={{ position: 'relative' }}
        >
          <img
            src={isSafeSpriteSrc(player.spriteUrl) ? player.spriteUrl : getSpriteForStage(player.stage)}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        </Viewport>

        <div style={{ textAlign: 'center' }}>
          {player.petName && (
            <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{player.petName}</p>
          )}
          {player.isNpc && (
            <p style={{ ...sm2Hint, marginTop: 2 }}>
              {isPt ? 'Personagem de demonstração' : 'Demo character'}
            </p>
          )}
          {/* `tasksDone` saiu daqui há tempos (score de vida real). Em
              06/09/2026 o `rank` saiu junto (WP4.11, exposição E3): a
              **proibição #21** diz que nenhuma tela mostra métrica de
              DESEMPENHO de outro jogador, e um número que sobe e desce conforme
              o outro joga é exatamente isso. O Torneio já media por FAIXA pelo
              mesmo motivo — a tela do amigo tinha ficado para trás.

              `daysPlaying` fica: é duração, só cresce, e não ordena ninguém. */}
          <p className="sm2-num" style={{ ...sm2Hint, marginTop: 6 }}>
            {isPt ? `${player.daysPlaying} dias jogando` : `${player.daysPlaying} days playing`}
          </p>
        </div>
      </div>

      {/* Caminho do pet — o GALHO, e só o galho.

          Aqui havia a escada inteira (Rookie→Mega) com o estágio atual
          preenchido. Ela dizia ao visitante QUÃO LONGE o outro chegou, que é a
          armadilha do Mimo e a leitura que a proibição #21 fecha: o galho é
          IDENTIDADE (que caminho essa criatura seguiu), a altura é PLACAR.
          A decisão 8b do dono foi ratificada com essa condição exata (D13):
          mostrar a criatura do amigo no estágio real, desde que a UI mostre
          galho e não altura. É por isso que o sprite continua inteiro logo
          acima — ele já diz quem a criatura é, sem ranquear ninguém. */}
      <div>
        <p style={{ ...sm2Hint, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          {isPt ? 'Caminho do pet' : "Pet's path"}
        </p>

        {branch && Glyph && (
          <p style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px' }}>
            <Glyph size={18} color={ATTR_COLOR[branch]} strokeWidth={2.2} />
            <span style={{ color: ATTR_INK[branch], fontWeight: 500 }}>
              {isPt ? ATTR_LABEL[branch].pt : ATTR_LABEL[branch].en}
            </span>
          </p>
        )}

      </div>
    </ModalSheet>
  );
}
