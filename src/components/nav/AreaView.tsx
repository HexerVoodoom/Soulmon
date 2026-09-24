import { lazy, Suspense, useState, type ComponentProps } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { areaDemoLot, mercadoLots, arenaLots, type MercadoLotId } from '../../utils/areaSheetCopy';
import { AREA_BG, MERCADO_LOT_ART, ARENA_LOT_ART } from '../../assets/soulmon/areas';
import { STALL_NPC_ART } from '../../assets/soulmon/npcs';
import { sm2Hint, sm2Text } from '../form/FormKit';
import type { ShopActions, ShopOwnership } from '../mercado/ShopShelf';
import type { TournamentPage as TournamentPageT } from '../TournamentPage';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';

/**
 * UMA ÁREA DO MAPA, INTEIRA (minimal-ui F4 molde + F5 conteúdo) — a cena
 * (`AreaScene`), o lote aberto (`AreaSheet`) e o que entra dentro dele.
 *
 * Mora fora do `App.tsx` e entra por `lazy()` de propósito: o chunk de entrada
 * está acima do orçamento de bytes (`orcamentoDeBytes.contract.test.ts`,
 * decisão #31), e nada disto é necessário para a Home abrir. O `App` só passa
 * dados e handlers prontos — nenhuma regra nasce aqui: a compra é o
 * `handleShopBuy`, a troca é o `handleExchangeCredits`, a partida é do
 * `TournamentPage`, a luta é da `ArenaGame`.
 *
 * O estado "qual folha está aberta" é LOCAL: o `App` monta este componente com
 * `key` da view, então trocar de área zera a folha (nunca reabre "fantasma"
 * numa área diferente).
 */
const MercadoStallSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.MercadoStallSheet })));
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
const TournamentPage = lazy(() => import('../TournamentPage').then(m => ({ default: m.TournamentPage })));
const DueloSheet = lazy(() => import('../arena/DueloSheet').then(m => ({ default: m.DueloSheet })));
const ArenaGame = lazy(() => import('../ArenaGame').then(m => ({ default: m.ArenaGame })));

type TournamentProps = Omit<ComponentProps<typeof TournamentPageT>, 'shop'>;

export interface AreaViewProps {
  area: AreaId;
  language: Language;
  /** Posse + progresso de missão — o mesmo objeto para Mercado e Torneio. */
  ownership: ShopOwnership;
  actions: ShopActions;
  points: number;
  emblems: number;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** As props do Torneio, prontas no `App` (partida, missões da semana…). */
  tournament: TournamentProps;
  /** Duelo → `ArenaGame`. */
  evolutionStage: string;
  demoCharacterId?: string;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  onEarnPoints: (points: number) => void;
}

/** Espera curta dentro da folha — o conteúdo é `lazy`, e a folha já está
 *  aberta: nunca um branco sem explicação. */
function SheetLoading({ language }: { language: Language }) {
  return (
    <p role="status" style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0', margin: 0 }}>
      {language === 'pt-BR' ? 'Abrindo…' : 'Opening…'}
    </p>
  );
}

export function AreaView(props: AreaViewProps) {
  const { area, language, ownership, actions } = props;
  const [sheet, setSheet] = useState<string | null>(null);
  const [duelOpen, setDuelOpen] = useState(false);
  const closeLabel = language === 'pt-BR' ? 'Fechar' : 'Close';
  const close = () => setSheet(null);

  if (area === 'mercado') {
    const lots = mercadoLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    const stall = open && open.id !== 'conquistas' ? open.id as Exclude<MercadoLotId, 'conquistas'> : null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.mercado}
        lots={lots.map(l => ({ ...l, art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot))}
      >
        <AreaSheet
          areaId={area}
          title={open?.label ?? ''}
          closeLabel={closeLabel}
          open={!!open}
          npcArt={stall ? STALL_NPC_ART[stall] : undefined}
          onClose={close}
        >
          <Suspense fallback={<SheetLoading language={language} />}>
            {stall && (
              <MercadoStallSheet
                key={stall}
                stall={stall}
                language={language}
                points={props.points}
                emblems={props.emblems}
                credits={props.credits}
                onExchangeCredits={props.onExchangeCredits}
                accountTier={props.accountTier}
                onUnlock={props.onUnlock}
                {...ownership}
                {...actions}
              />
            )}
            {open?.id === 'conquistas' && (
              <ConquistasSheet language={language} missionProgress={ownership.missionProgress} />
            )}
          </Suspense>
        </AreaSheet>
      </AreaScene>
    );
  }

  if (area === 'arena') {
    const lots = arenaLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.arena}
        lots={lots.map(l => ({ ...l, art: ARENA_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot))}
      >
        <AreaSheet areaId={area} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'torneio' && (
              <TournamentPage {...props.tournament} shop={{ ownership, actions }} />
            )}
            {open?.id === 'duelo' && (
              <DueloSheet
                language={language}
                evolutionStage={props.evolutionStage}
                skills={props.skills}
                onStart={() => { setSheet(null); setDuelOpen(true); }}
              />
            )}
          </Suspense>
        </AreaSheet>
        {duelOpen && (
          <Suspense fallback={<SheetLoading language={language} />}>
            <ArenaGame
              evolutionStage={props.evolutionStage}
              demoCharacterId={props.demoCharacterId}
              language={language}
              skills={props.skills}
              onEarnPoints={props.onEarnPoints}
              onExit={() => setDuelOpen(false)}
            />
          </Suspense>
        )}
      </AreaScene>
    );
  }

  // Áreas ainda sem F5: UM lote de exemplo com placeholder (o molde F4).
  const demo = areaDemoLot(area, language);
  return (
    <AreaScene
      areaId={area}
      language={language}
      lots={[{ id: 'exemplo', label: demo.label, left: '50%', top: '38%', ariaLabel: demo.label, onOpen: () => setSheet('exemplo') } satisfies AreaLot]}
    >
      <AreaSheet areaId={area} title={demo.label} closeLabel={closeLabel} open={sheet === 'exemplo'} onClose={close}>
        <p style={{ ...sm2Text, margin: 0 }}>{demo.placeholder}</p>
      </AreaSheet>
    </AreaScene>
  );
}
