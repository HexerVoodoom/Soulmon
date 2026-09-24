import { useState } from 'react';
import { AreaScene, type AreaLot } from '../nav/AreaScene';
import { AreaSheet } from '../nav/AreaSheet';
import { DungeonGame } from '../DungeonGame';
import { DinoGame } from '../DinoGame';
import { RPSGame } from '../RPSGame';
import { MasmorraSheet, DinoSheet, PptSheet } from './PlaySheets';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { PLAY_AREA_BG, EXPLORACAO_LOT_ART, JOGOS_LOT_ART } from '../../assets/soulmon/areas/playAreasArt';
import type { Language } from '../../utils/i18n';

/**
 * AS ÁREAS DE JOGAR DO MAPA (minimal-ui F5) — Exploração (Masmorra + Corrida
 * do Dino, NPC Brisa) e Jogos (Pedra, papel e tesoura, NPC Pipo).
 *
 * Substitui a antiga `ActivitiesPage` (o hub de cartões): cada minijogo virou
 * um lote na cena da sua área, a folha do lote mostra o que está em jogo e o
 * CTA abre o MESMO componente de jogo de antes (`DungeonGame`, `DinoGame`,
 * `RPSGame`), por cima de tudo (`GameRoot` é `fixed`). Ao sair do jogo volta-se
 * à cena da área.
 *
 * Nenhuma regra nasce aqui: os handlers (`onDungeonEnter`, `onDungeonLose`,
 * `onEarnPoints`, …) chegam prontos do `App`, os mesmos que a `ActivitiesPage`
 * repassava. Entra por `lazy()` no `App` — nada disto é preciso para a Home
 * abrir (orçamento de bytes, decisão #31).
 *
 * O `App` monta este componente com `key` da view: trocar de área zera a folha
 * e o jogo aberto.
 */
export interface PlayAreaViewProps {
  area: 'exploracao' | 'jogos';
  language: Language;
  evolutionStage: string;
  demoCharacterId?: string;
  totalPoints: number;
  onDungeonEnter: () => { ok: true; level: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onFloorCleared?: () => void;
  onDungeonEnemyDefeated: (enemyKey?: string) => void;
  onDinoScore: (score: number) => void;
  onEarnPoints: (pts: number) => void;
  onSpendBits?: (pts: number) => boolean;
}

type Game = 'masmorra' | 'dino' | 'ppt';

export function PlayAreaView(props: PlayAreaViewProps) {
  const { area, language } = props;
  const [sheet, setSheet] = useState<Game | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const closeLabel = language === 'pt-BR' ? 'Fechar' : 'Close';
  const start = (g: Game) => { setSheet(null); setGame(g); };
  const exitGame = () => setGame(null);

  const lots: AreaLot[] = area === 'exploracao'
    ? exploracaoLots(language).map(l => ({ ...l, art: EXPLORACAO_LOT_ART[l.id], onOpen: () => setSheet(l.id) }))
    : jogosLots(language).map(l => ({ ...l, art: JOGOS_LOT_ART[l.id], onOpen: () => setSheet(l.id) }));
  const open = lots.find(l => l.id === sheet) ?? null;

  return (
    <AreaScene areaId={area} language={language} background={PLAY_AREA_BG[area]} lots={lots}>
      <AreaSheet
        areaId={area}
        title={open?.label ?? ''}
        closeLabel={closeLabel}
        open={!!open}
        onClose={() => setSheet(null)}
      >
        {sheet === 'masmorra' && <MasmorraSheet language={language} onStart={() => start('masmorra')} />}
        {sheet === 'dino' && <DinoSheet language={language} onStart={() => start('dino')} />}
        {sheet === 'ppt' && <PptSheet language={language} onStart={() => start('ppt')} />}
      </AreaSheet>

      {game === 'masmorra' && (
        <DungeonGame
          evolutionStage={props.evolutionStage}
          demoCharacterId={props.demoCharacterId}
          language={language}
          onEnter={props.onDungeonEnter}
          onLose={props.onDungeonLose}
          onHeartDrop={props.onDungeonHeartDrop}
          onGlitchtama={props.onGlitchtama}
          onFloorCleared={props.onFloorCleared}
          onEnemyDefeated={props.onDungeonEnemyDefeated}
          onEarnPoints={props.onEarnPoints}
          /* WP4.5 — o sumidouro recorrente: comprar profundidade com Bits. */
          bits={props.totalPoints}
          onSpendBits={props.onSpendBits}
          onExit={exitGame}
        />
      )}
      {game === 'dino' && (
        <DinoGame
          evolutionStage={props.evolutionStage}
          demoCharacterId={props.demoCharacterId}
          language={language}
          onEarnPoints={props.onEarnPoints}
          onScore={props.onDinoScore}
          onExit={exitGame}
        />
      )}
      {game === 'ppt' && (
        <RPSGame
          evolutionStage={props.evolutionStage}
          demoCharacterId={props.demoCharacterId}
          language={language}
          onEarnPoints={props.onEarnPoints}
          onExit={exitGame}
        />
      )}
    </AreaScene>
  );
}
