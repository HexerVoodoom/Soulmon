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
 * A superfície é o `RitualDialog` (`ritual/RitualKit`, o `.dlg` SIS-06
 * centrado sobre o scrim — canvas Social §28, D-S9: diálogo curto = centrado;
 * a folha é para listas): foco preso, Escape, devolução de foco, × 44 por
 * último na ordem de foco. A criatura é a heroína: sprite 256² a 128 (0,5×)
 * num vidro 192² com anel de cobre (D-S1); o galho em `ink` com o glifo de
 * `AlignmentIcons` — identidade, não semáforo (D-S8: `ATTR_COLOR`/`ATTR_INK`
 * do sistema antigo saíram); "Close" em `outline` (D-S10).
 */
import { getStageBranch } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';
import { isSafeSpriteSrc } from '../utils/spriteLibrary';
import { ATTR_LABEL } from '../types/attributes';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { Viewport } from './ui/Viewport';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button } from './form/FormKit';
import type { DirectoryPlayer } from '../utils/community';
import type { Language } from '../utils/i18n';

// Rótulo e ícone vêm de `types/attributes.ts`. Este arquivo mantinha uma
// SEGUNDA cópia do mapa de rótulos, idêntica à de `EvolutionPath` — e enquanto
// as duas concordavam, a `StatsPage` não usava nenhuma e mostrava o nome
// interno cru. Duas cópias que concordam ainda são duas cópias.


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

  return (
    <RitualDialog
      onClose={onClose}
      labelledBy="sm2-player-title"
      closeLabel={isPt ? 'Fechar' : 'Close'}
      closeLast
      maxWidth={340}
    >
      <h2
        id="sm2-player-title"
        className="sm2-lib-h2"
        style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}
      >
        {player.name}
      </h2>

      <div className="sm2-lib-hero">
        {/* WP4.14 — A CRIATURA É VISITÁVEL, e visitar é OLHAR.
            A tela do outro jogador existia como uma ficha pequena; a única
            coisa que a comunidade deste jogo tem de interessante — a criatura
            que a outra pessoa criou — aparecia num quadradinho de 48px.
            Aqui ela ganha tamanho: 256² a 128 (0,5×) no vidro 192² (64 × 3).
            E a visita não tem ESTADO nem NÚMERO (decisão 8 + proibição #21):
            não dá para cutucar, presentear, curtir nem comparar. Uma visita
            que rende alguma coisa deixa de ser visita e vira loop de
            engajamento social — que é exatamente o que este produto recusa
            desde que o `rank` saiu daqui. */}
        <Viewport
          width={64}
          height={64}
          scale={3}
          breathing={false}
          label={isPt ? `Soulmon de ${player.name}` : `${player.name}'s Soulmon`}
          screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={isSafeSpriteSrc(player.spriteUrl) ? player.spriteUrl : getSpriteForStage(player.stage)}
            alt=""
            width={128}
            height={128}
            style={{ display: 'block', width: 128, height: 128, objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        </Viewport>

        <div>
          {player.petName && (
            <p className="sm2-stats-t" style={{ fontWeight: 500 }}>{player.petName}</p>
          )}
          {player.isNpc && (
            <p className="sm2-lib-s" style={{ margin: 0 }}>
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
          <p className="sm2-lib-s sm2-num" style={{ margin: 0 }}>
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
          acima — ele já diz quem a criatura é, sem ranquear ninguém.
          O galho vai em `ink` (D-S8): identidade, não semáforo. */}
      <div className="sm2-lib-path">
        <p className="sm2-stats-lab">
          {isPt ? 'Caminho do pet' : "Pet's path"}
        </p>

        {branch && Glyph && (
          <p className="t">
            <Glyph size={18} color="currentColor" strokeWidth={2.2} />
            <span>{isPt ? ATTR_LABEL[branch].pt : ATTR_LABEL[branch].en}</span>
          </p>
        )}
      </div>

      <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), width: '100%' }}>
        {isPt ? 'Fechar' : 'Close'}
      </button>
    </RitualDialog>
  );
}
