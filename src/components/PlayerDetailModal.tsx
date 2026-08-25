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
        <Viewport
          width={48}
          height={48}
          scale={2}
          breathing={false}
          label={isPt ? `Soulmon de ${player.name}` : `${player.name}'s Soulmon`}
          screenStyle={{ position: 'relative' }}
        >
          <img
            src={player.spriteUrl ?? getSpriteForStage(player.stage)}
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
          {/* `tasksDone` SAIU daqui de propósito: expor "X tarefas feitas" de
              outro jogador num diretório pesquisável é exatamente o score de
              vida real que `docs/PLANO-PRODUTO.md:69-71` proíbe — o Torneio
              mede por FAIXA (utils/tournamentTiers.ts) pelo mesmo motivo.
              Ficam os dois números que são do JOGO, não da vida. */}
          <p className="sm2-num" style={{ ...sm2Hint, marginTop: 6 }}>
            {isPt
              ? `${player.daysPlaying} dias jogando · rank ${player.rankPoints}`
              : `${player.daysPlaying} days playing · rank ${player.rankPoints}`}
          </p>
        </div>
      </div>

      {/* Caminho do pet — TODO o branch já desbloqueado, não só o nível atual */}
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {branchLevels.length === 0 ? (
            <span style={sm2Hint}>{isPt ? 'Ainda não escolhido' : 'Not chosen yet'}</span>
          ) : branchLevels.map(stage => {
            const level = getStageLevel(stage);
            const isCurrent = stage === player.stage;
            return (
              /* O estágio ATUAL é o único preenchido, e nunca o contrário — as
                 pílulas anteriores davam ao não-atual um fundo sólido que no
                 tema claro chamava tanto quanto o atual. */
              <span
                key={stage}
                style={{
                  fontFamily: 'var(--sm2-font-text)',
                  fontSize: 'var(--sm2-text-xs)',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 999,
                  ...(isCurrent
                    ? { backgroundColor: 'var(--sm2-primary-fill)', color: 'var(--sm2-on-primary)', border: '1px solid transparent' }
                    : { border: '1px solid var(--sm2-line)', color: 'var(--sm2-muted)' }),
                }}
              >
                {isPt ? LEVEL_LABEL[level].pt : LEVEL_LABEL[level].en}
                {isCurrent && ` · ${isPt ? 'atual' : 'current'}`}
              </span>
            );
          })}
        </div>
      </div>
    </ModalSheet>
  );
}
