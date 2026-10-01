import { useState, useEffect, useCallback, useMemo, useRef, useId, lazy, Suspense, Fragment } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './components/ui/Icon';
import { ScreenSkeleton } from './components/ui/ScreenSkeleton';
import { OfflineSeal } from './components/ui/OfflineSeal';
import { toast } from 'sonner';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useCareSystem } from './hooks/useCareSystem';
import { useDailyReset } from './hooks/useDailyReset';
import {
  track, flush as flushTelemetry, installTelemetryAutoFlush,
  setTelemetryTier, trackDayClosed, telemetryDayKey, trackSoundOff, limparOrigemDaUrl,
  TELEMETRY_UNLOCK_REASON, TELEMETRY_PURCHASE_REASON, TELEMETRY_ACTIVITY_KIND, TELEMETRY_CREATE_PATH,
  unlockReasonCode, TELEMETRY_BAD_DAY,
  openSourceFromUrl, afterBadDayGapBucket, trackRetentionOnOpen,
} from './utils/telemetry';
import { CornerLink } from './components/nav/CornerLink';
import { AreaTopBar } from './components/nav/AreaTopBar';
import { MapPage } from './components/nav/MapPage';
import { HomeMenuSheet } from './components/nav/HomeMenuSheet';
import {
  type ViewType, type AreaId, areaOf, menuPageOf, viewBack, areaView, areaLabel, menuPageLabel,
} from './navigation';
import { registerAndroidBack } from './utils/androidBack';
import { closeTopBackLayer } from './utils/backStack';
import { CompanionHUD } from './components/CompanionHUD';
import { HomeHud, MenuBars } from './components/pixel/HomeHud';
import { DailyRituals } from './components/DailyRituals';
import { CATEGORY_ICONS } from './types/category-icons';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toaster } from './components/ui/sonner';
import { GamePopups } from './components/GamePopups';
import { EvolveTaskModal } from './components/EvolveTaskModal';
import { EvolutionCeremony } from './components/EvolutionCeremony';
import { useSpriteGeneration, libraryOf } from './hooks/useSpriteGeneration';
import { emptyIncubation, incubationFor, incubationReady, isIncubating } from './utils/spriteTrigger';
import { spriteText } from './utils/spriteCopy';
import { emptySpriteLibrary, revertVisor, displaySprite, isNewbornLibrary, markTuneSeen, recordSprite, type SpriteLibrary } from './utils/spriteLibrary';
import { getSpriteForStage } from './utils/sprites';
import { ContentModals } from './components/ContentModals';
import { NotificationManager } from './components/NotificationManager';
import { DailyReportModal } from './components/DailyReportModal';
import { adventureOfNight, collectAdventure } from './utils/adventure';
import { crossingsTouchMap } from './utils/travessiasSave';
import { CROSSINGS_EMPTY, HOME_REGION, type CrossingsState } from './types/travessias';
import { WelcomePromptModal } from './components/WelcomePromptModal';
import { IntroScreen } from './components/IntroScreen';
import { ProtectProgressModal } from './components/ProtectProgressModal';
import { CATEGORY_ATTRIBUTES, type ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { type CareEvent } from './components/CareSystem';
import { FORM_REQUIREMENTS, getStageLevel, canSelectWeekdays, getMaxEnergyForStage } from './types/progression';
import { type Language, useTranslation, resolveLanguage } from './utils/i18n';
import { SoulmonWidget, widgetPetName, widgetPetLine, widgetGroveStage } from './plugins/SoulmonWidgetPlugin';
import { unlockedAchievements } from './utils/achievements';
import { useGameState, getMaxHPForStage, type GameState, type Activity, type Task, type Step } from './contexts/GameStateContext';
import { STORAGE_KEYS } from './utils/storageKeys';
import {
  readFlag, readFlagState, readJson, readLocal, readNumber, removeLocal, writeFlag, writeJson, writeLocal,
} from './utils/safeStorage';
import { initialNotificationsEnabled, readSystemNotificationPermission } from './utils/notificationDefault';
import { hashString, creatureFormId, ELEMENT_INFO } from './utils/oracle';
import type { OracleInput, OracleResult, ElementId } from './utils/oracle';
import type { Manifestacao } from './utils/soulProfile/ficha/manifestacaoSave';
import { applyDecorEquip, type SlotId } from './utils/petStage';

// Identidades estáveis: CompanionHUD é memo() e um `?? {}` inline cria um
// objeto novo a cada render, anulando a memoização (footgun conhecido).
/** Teto do log de conclusões de atividade — registro de ritmo, não arquivo.
 *  A leitura do ritmo olha 14 dias; 90 entradas cobrem isso com folga sem
 *  inchar o save (localStorage e nuvem). */
const ACTIVITY_LOG_CAP = 90;
const EMPTY_DECOR: Partial<Record<SlotId, string>> = {};
const EMPTY_TROPHIES: Array<{ season: string; place: 1 | 2 | 3 }> = [];
import { getNextEvolution, dailyGoalFor, heartGoalFor, degeneratedPerfectDays, registeredForDay, tasksToAvoidHeartLoss, applyRedemption, podeEvoluirDepoisDaQueda, completeDayReached } from './utils/dailyReset';
import {
  feedFood, rubHeal, rubRefusal, completeTask,
  FOOD_LIMIT_PER_HOUR,
} from './utils/careRules';
import { feedTimesFor, rubHealFor } from './utils/careCaps';
import { applyRub, applyFeed, rubDecision } from './utils/careUpdaters';
import { applySpecialItem, specialRefusal } from './utils/specialItemUse';
import { playerDayKey, playerDayIso } from './utils/playerDay';
import { shouldInviteRefuge, markRefugeShown, dismissRefugeInvite, acceptRefugeInvite } from './utils/refugio/convite';
import { RefugeInviteCard } from './components/refugio/RefugeInviteCard';
import { awardBondXP, bondLevelFor, unclaimedBondRewards, applyBondRewards, bondTitle } from './utils/bond';
import { applyPoopDrain, cleanPoop, POOP_DRAIN_PERIOD_MS, remainingDrainToday } from './utils/poopDrain';
import { isMuted, setMuted, playTaskComplete, playFeed, playEvolve, playDegenerate, playSleep } from './utils/sounds';
import { pausarTrilha, retomarTrilha } from './utils/trilha';
import { requestNotificationPermission, showNotification } from './utils/notifications';
// `CHIP_BOOST`/`HEART_HEAL` saíram daqui de propósito: os números do uso de item
// especial agora são lidos uma vez só, dentro de `utils/specialItemUse.ts`.
import { ALL_SHOP_ITEMS, SPECIAL_ITEMS, HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI } from './utils/shop';
import { getDungeonDifficulty, getDungeonBest, rollDungeonHeartDrop } from './utils/dungeon';
import { heartDropBonus, rollPetPassive } from './utils/passives';
import { recordMood, moodFor, moodSummary, type MoodValue } from './utils/mood';
import { computeCarePattern, resolveBranch, careHistory } from './utils/carePattern';
import { evolutionTarget } from './utils/evolutionTarget';
import { getMissionProgress, isShopItemUnlocked } from './utils/missions';
import { getGifts, getPendingTrophies } from './utils/community';
import {
  PREMADE_CHARACTERS, getDemoCreatureStages, canCreateActivity, activityCapFor,
  REROLL_COST_CREDITS,
  type CreditPack, type AccountTier,
} from './utils/monetization';
import { fitHabitCreates } from './utils/habitCreate';
import { applyShopBuy, shopBuyRefusal } from './utils/shopBuy';
import { soulmonDisplayName } from './utils/petName';
import { readingSeed } from './utils/newReading';
import { rolledRareCheer, type PetVoiceKind } from './utils/petVoice';
import {
  emptyFirstDay, markGesture, shouldShowFirstDay, type FirstDayGesture,
} from './utils/firstDay';
import { FirstDayCard } from './components/FirstDayCard';
import { TermsUpdateBanner } from './components/TermsUpdateBanner';
import { marcaAvisoTermos, precisaAvisarTermos, qualDocMudou } from './utils/termsNotice';
import { PRIVACY_VERSION, TERMS_VERSION } from './utils/consent';
import { MilestoneCeremony } from './components/MilestoneCeremony';
import { GroveMilestoneCeremony } from './components/guild/GroveMilestoneCeremony';
import { useGroveWatch } from './hooks/useGroveWatch';
import {
  acknowledgeGroveMilestone, grantGroveScenes, grantGuildScenes, groveAvisoFor, groveStageAt, formatDayLabel,
  CEREMONY_MIN_INDEX,
} from './utils/groveLocal';
import { grantGuildTrophy } from './utils/guildClaimLocal';
import { guildCoreText, groveStageName, type GroveMarcoStage } from './utils/guildCopyCore';
import {
  applyRebirth, canRebirth, rebirthRefusal, rebirthEscolaOptions, rebirthElementOptions, herancaDoCiclo,
} from './utils/rebirth';
import type { RebirthChoices } from './utils/rebirth';
import { anniversaryOn, daysTogether } from './utils/anniversary';
import { memoryToShow, markMemoryShown } from './utils/memories';
import { stampCollected } from './utils/collectionDates';
import { shouldPrimePush, pushPrimingLine } from './utils/pushPriming';
import { shouldOfferAtValueMoment, isoWeekKey } from './utils/offerMoment';
import {
  bumpWeekly, forWeek, claimWeekly, weeklyMissionsFor,
  type WeeklyMissionId,
} from './utils/weeklyMissions';
import { sleepReminderCopy } from '../functions/api/_pushCopy.js';
import { BITS_EXCHANGE, creditMinigameBits, minigameBitsToday } from './utils/currencies';
import { snapshotCompletion, undoCompletion, UNDO_WINDOW_MS } from './utils/completionUndo';
import { UndoToast } from './components/UndoToast';
import { adminFromEntitlement, setAdminFlag, useAdmin } from './utils/adminFlag';
import { isCorvo, spriteLineOf } from './utils/corvoPet';
// G1: `corvoAdocao` (nomes, CORVO_STAGES, adoptCorvo) e `gmTools` só são lidos por admin, no clique —
// import dinâmico, fora do chunk de entrada.
const gmTools = () => import('./utils/gmTools');
const corvoAdocao = () => import('./utils/corvoAdocao');
import { createEntitlementSync } from './utils/entitlementSync';
import { subscribeAuthState } from './utils/auth';
import { fetchEntitlement, spendCredits, claimAdReward, resetSpriteLifetimeAfterRebirth, type Entitlement } from './utils/entitlements';
import { purchase } from './utils/playBilling';

/* ⚰️ `EVOLVE_SEGMENTS` (7/9/11/14/999) saiu em 06/09/2026, junto com
   `digivolutionSegments`/`digivolutionSegmentsNeeded` do `GameState`.

   Era a QUARTA tabela de números de evolução do projeto, e alimentava dois
   campos do save que ninguém lia — o `CompanionHUD` recebia os dois como props
   e não desenhava nenhum (WP4.17). Um número escrito em todo save de todo
   jogador, por anos, sem um único leitor.

   O gate é `FORM_REQUIREMENTS[…].required` comparado com `perfectDays`. Uma
   fonte. Se aparecer a vontade de guardar "quanto falta" no save, lembre que
   ela é derivável na leitura — e que o `bondLevel` (utils/bond.ts) já é
   derivado exatamente por esse motivo. */

/** XP alvo do próximo nível, por nível atual (ver getNextLevelXP). */
const XP_BY_LEVEL: Record<string, number> = {
  rookie: XP_THRESHOLDS.champion,
  champion: XP_THRESHOLDS.ultimate,
  ultimate: XP_THRESHOLDS.mega,
  mega: XP_THRESHOLDS.itto,
  ultra: XP_THRESHOLDS.itto,
};
import { CATEGORY_EMOJIS, AI_CATEGORY_MAP, FOOD_BY_CATEGORY } from './constants/labels';
import type { AISettings } from './components/AISettingsModal';
import type { OnboardingCompleteData } from './components/SoulmonOnboarding';
import { UnlockAccountModal, UnlockNudge, type UnlockReason } from './components/UnlockAccountModal';

// ── O MOTOR DE TAREFAS (docs/PLANO-TAREFAS.md) ──────────────────────────────
// As REGRAS moram nos módulos puros (`taskTriage`, `habitRhythm`, `rituals`,
// `restWindow`); aqui embaixo só existe FIAÇÃO — estado de UI, efeitos e a
// tradução de um gesto do usuário em chamada de regra. Nenhuma fórmula é
// reescrita neste arquivo: regra copiada é regra que diverge em silêncio
// (footgun 9 do CLAUDE.md).
import { MorningCheckIn } from './components/MorningCheckIn';
import { TriagePile, type TriageAction } from './components/TriagePile';
import { MorningDream } from './components/MorningDream';
import { dreamTwin, grantDreamTwin } from './utils/dreamDecorTwin';
import { sanitizeSoulTestAnswers } from './utils/soulTestAnswers';
import { RestSetupModal } from './components/RestSetupModal';
import { shouldShowRestSetup } from './utils/restSetup';
import { chatSettingsFor, personalityProfileFromSave } from './utils/personality';
import { WeeklyReportCard } from './components/WeeklyReportCard';
import {
  needsCheckIn, checkInPlan, completeCheckIn,
  needsWeeklyReport, weeklyReport, stackingSuggestion,
  freshStartOffer, applyFreshStart,
} from './utils/rituals';
import {
  triageQueue, toOpen, toSomeday, drop, postpone, isHaunted, isActive, restore,
  shrink, effortOf, focusComplete, plannedEffort, isOvercommitted,
} from './utils/taskTriage';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './components/form/FormKit';
import { suggestTasks, type SuggestedTask } from './utils/taskSuggestions';
import {
  completeHabit, emptyRhythm, dayKeyOf, attributeMultiplier, milestoneReached, habitTier,
  constancy, needsIntervention, GOOD_CONSTANCY_RATIO,
} from './utils/habitRhythm';
import { normalizeSchedule, weekDaysForSchedule, HABIT_WEIGHT, MAX_DAILY_FOCUS, cheerReached } from './types/taskModel';
import { equilibrarSemana, valeEquilibrar } from './utils/weekBalance';
import { needsCatalogOnboarding, markCatalogOnboardingSeen, onboardingProfileFrom } from './utils/catalogOnboarding';
import { CatalogOnboardingFlow, activitiesFromCatalogChoice } from './components/catalog/CatalogOnboardingFlow';
import { ACTIVITY_CATALOG } from './data/activityCatalog';
import { CatalogBrowserModal } from './components/catalog/CatalogBrowserModal';
import { CatalogLevelInviteModal } from './components/catalog/CatalogLevelInviteModal';
import { pickCatalogLevelInviteCandidate, applyLevelChange } from './utils/catalogLevelSignal';

import type { Schedule, HabitAnchor, Effort } from './types/taskModel';
import {
  createRestState, recordNight, dreamRarity, rollDream, collectDream, DREAM_CATALOG, isWithinWindow,
} from './utils/restWindow';
import type { Dream, RestWindow } from './utils/restWindow';

// ── SONO JOGÁVEL, BRINCAR E PASSOS ──────────────────────────────────────────
// Mesma disciplina do bloco acima: as regras moram nos módulos puros
// (`nightmares`, `petNeeds`, `steps`) e aqui só existe fiação.
import { NightmareBattle } from './components/NightmareBattle';
import { StepsCard } from './components/StepsCard';
import {
  buildNightmareWave, hasPendingNightmare, markFought, nightmareDayKey, nightmaresFor,
  createNightmareState, type NightmareRewards,
} from './utils/nightmares';
import {
  play, canPlay, playedToday, activeBuff, minigameMultiplier, consumeBuff,
  tiredness, tirednessMessage, needsAttention,
} from './utils/petNeeds';
import {
  DEFAULT_STEP_GOAL, isStepsAvailable, hasStepsPermission, requestStepsPermission,
  readStepsToday, stepsDayKey,
} from './utils/steps';

/**
 * Categorias em que um passo pode CONFIRMAR o hábito que o usuário já marcou.
 *
 * O selo é confirmação, nunca pontuação: quem não tem sensor marca o hábito
 * exatamente igual, ganha exatamente a mesma comida e a mesma meta do dia —
 * só não vê o selo. Ver a regra 1 de `utils/steps.ts`.
 */
const STEP_VERIFIABLE: readonly ActivityCategory[] = ['Health', 'Fitness', 'Wellness'];

/**
 * Limiar do selo: METADE da meta de referência, e é DERIVADO dela de propósito
 * (`DEFAULT_STEP_GOAL` é o dono do número) — um limiar inventado aqui viraria
 * uma segunda meta que só quem tem sensor consegue enxergar. Modesto porque o
 * bônus é 1 comida: um limiar alto transformaria o selo numa meta corporal, que
 * é exatamente o que a Parte 3 do plano proíbe.
 */
const STEPS_VERIFIED_MIN = Math.round(DEFAULT_STEP_GOAL / 2);

/** Quanto tempo entre leituras do pedômetro (só com o app em foreground). */
const STEPS_POLL_MS = 5 * 60 * 1000;

/** Ritmo/estado vazios ESTÁVEIS (mesma razão do `EMPTY_RHYTHM`). */
const EMPTY_NIGHTMARES = createNightmareState();

// ---------------------------------------------------------------------------
// O SHEET DE ADIAMENTO — "adiada 3 vezes: decompor / encolher / deixar pra lá"
//
// A mecânica existia inteira e MORTA: `needsPostponeNudge` tinha teste,
// `shrink` tinha teste, o `GuideModal` prometia as três ações ao usuário em PT
// e EN, o `TaskMeta` desenhava o contador sublinhado — e ninguém passava
// `onPostponeNudge`, então o chip nascia `disabled` com `cursor: default`.
// Tocar nele não fazia NADA. Regra documentada, testada na função pura e
// anunciada no guia, mas inexistente no app: a pior das três, porque só o
// usuário descobre.
//
// As três ações não são um menu de opções equivalentes; são as três saídas
// honestas de uma tarefa que a pessoa vem evitando, e nenhuma delas é "faça
// logo isso":
//   · DECOMPOR — o gargalo do modelo de Fogg quase nunca é motivação, é
//     habilidade. Uma tarefa adiada 3× em geral não tem primeiro passo claro.
//   · ENCOLHER — `shrink` (taskTriage), rebaixa o esforço e ZERA o contador:
//     a tarefa mudou, e carregar a marca puniria a decisão certa.
//   · DEIXAR PRA LÁ — `drop`, o Won't Do do TickTick: terminal COM volta
//     atrás. É a saída que quebra o ciclo de falência periódica.
// Não existe quarta opção "fechar sem fazer nada" com peso de fracasso: o X do
// sheet fecha e nada acontece, e o texto diz isso.
// ---------------------------------------------------------------------------

/** Estado da chamada de IA da decomposição. Erro e vazio são estados de
 *  primeira classe: a rede do celular cai, e o sheet não pode virar um spinner
 *  eterno na tela de quem já estava evitando a tarefa. */
type DecomposeState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; items: SuggestedTask[] }
  | { kind: 'empty' }
  | { kind: 'error' };

function PostponeNudgeSheet({
  task, language, onClose, onShrink, onDrop, onDecompose,
}: {
  task: Task | null;
  language: Language;
  onClose: () => void;
  onShrink: (taskId: string) => void;
  onDrop: (taskId: string) => void;
  onDecompose: (taskId: string, picks: SuggestedTask[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const [state, setState] = useState<DecomposeState>({ kind: 'idle' });
  /* A9 (QA rodada 2): o nome acessível do botão era título + explicação (30
     palavras). O título nomeia (`aria-labelledby`), a explicação descreve
     (`aria-describedby`) — o leitor de tela lê o nome e, só depois, a ajuda. */
  const idBase = useId();
  const ids = {
    decT: `${idBase}-dec-t`, decH: `${idBase}-dec-h`,
    encT: `${idBase}-enc-t`, encH: `${idBase}-enc-h`,
    dxT: `${idBase}-dx-t`, dxH: `${idBase}-dx-h`,
  };
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  // Trocar de tarefa (ou fechar) zera o painel — senão o próximo sheet abriria
  // já com as sugestões da tarefa anterior, que é como se oferece à pessoa um
  // passo que não tem nada a ver com o que ela abriu.
  const taskId = task?.id ?? null;
  useEffect(() => {
    setState({ kind: 'idle' });
    setPicked({});
  }, [taskId]);

  const effort = task ? effortOf(task) : 1;
  const canShrink = effort > 1;

  const runDecompose = useCallback(async () => {
    if (!task) return;
    setState({ kind: 'loading' });
    try {
      const items = await suggestTasks(
        task.name,
        [task.category as ActivityCategory],
        isPt ? 'pt-BR' : 'en-US',
      );
      // `suggestTasks` já engole rede caída / IA fora do ar e devolve []. "Não
      // veio nada" e "quebrou" não são a mesma coisa para o usuário, então
      // 'empty' tem texto próprio e caminho manual em vez de um "erro" — e o
      // catch fica de pé para o que a função não prometeu engolir.
      setState(items.length ? { kind: 'ready', items: items.slice(0, 4) } : { kind: 'empty' });
    } catch {
      setState({ kind: 'error' });
    }
  }, [task, isPt]);

  if (!task) return null;

  const picks = state.kind === 'ready' ? state.items.filter(i => picked[i.name]) : [];

  /* Canvas Atividades `NudgeAdiamento` (D-A5): as três saídas são `outline`
     64 de duas linhas (glifo 24 pelado + título 14/500 + pista 12 `muted`),
     NENHUMA primária — a folha mostra, não decide. Inerte ("Shrink it" no
     esforço 1) = fronteira `line` + tinta `muted`, com o motivo escrito, sem
     `opacity` (Home E7). */
  const opt = (disabled = false): React.CSSProperties => ({
    ...sm2Button('outline', disabled),
    ...(disabled ? { backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)' } : null),
    width: '100%', minHeight: 64, flexDirection: 'column', alignItems: 'flex-start',
    gap: 2, padding: '8px 16px', textAlign: 'left', fontSize: 'var(--sm2-text-sm)',
  });
  const optTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 };
  const optHint = (disabled = false): React.CSSProperties => ({ ...sm2Hint, fontWeight: 400, color: disabled ? 'var(--sm2-muted)' : 'var(--sm2-muted)' });

  return (
    <ModalSheet
      open
      onClose={onClose}
      language={language}
      title={isPt ? 'Essa aí tá difícil?' : 'Is this one stuck?'}
      maxWidth={480}
    >
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? `"${task.name}" já foi adiada ${task.postponedCount ?? 0} vezes. Isso é um dado, não uma bronca — e dado tem botão. Escolha uma saída, ou feche: nada acontece se você fechar.`
          : `"${task.name}" has been postponed ${task.postponedCount ?? 0} times. That's data, not a scolding — and data has buttons. Pick a way out, or close: nothing happens if you close.`}
      </p>

      {/* ---- DECOMPOR ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          style={{ ...opt(), cursor: state.kind === 'loading' ? 'progress' : 'pointer' }}
          onClick={runDecompose}
          disabled={state.kind === 'loading'}
          aria-busy={state.kind === 'loading' || undefined}
          aria-labelledby={ids.decT}
          aria-describedby={ids.decH}
        >
          <span style={optTitle} id={ids.decT}>
            <Icon name="psychology" size={24} />
            {isPt ? 'Decompor' : 'Break it down'}
          </span>
          <span style={optHint()} id={ids.decH}>
            {isPt
              ? 'O pet pensa em primeiros passos pequenos e você escolhe quais viram tarefa. O nome da tarefa vai para o provedor de IA.'
              : 'Your pet thinks up small first steps and you pick which become tasks. The task name goes to the AI provider.'}
          </span>
        </button>

        {/* Estados da chamada — todos anunciados, nenhum silencioso. */}
        <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.kind === 'loading' && (
            <span style={sm2Hint}>{isPt ? 'Pensando em passos…' : 'Thinking of steps…'}</span>
          )}

          {state.kind === 'error' && (
            <span style={sm2Hint}>
              {isPt ? 'Não deu pra pensar agora (sem conexão?).' : 'Could not think right now (offline?).'}
            </span>
          )}

          {state.kind === 'empty' && (
            <span style={sm2Hint}>
              {isPt
                ? 'Não achei um passo bom pra essa. Encolher costuma resolver igual — ou deixe pra lá sem culpa.'
                : 'I could not find a good step for this one. Shrinking usually works just as well — or let it go, guilt-free.'}
            </span>
          )}

          {state.kind === 'ready' && (
            <>
              <span style={sm2Hint}>
                {isPt ? 'Toque nos passos que você quer:' : 'Tap the steps you want:'}
              </span>
              {/* Passos sugeridos = linhas de 44 com checkbox 24 (canvas):
                  `role="checkbox"`, a linha inteira é o alvo. */}
              {state.items.map(item => {
                const on = !!picked[item.name];
                return (
                  <button
                    key={item.name}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setPicked(p => ({ ...p, [item.name]: !p[item.name] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, width: '100%',
                      padding: '0 4px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 24, height: 24, boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-sm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${on ? 'var(--sm2-primary-fill)' : 'var(--sm2-muted)'}`,
                        backgroundColor: on ? 'var(--sm2-primary-fill)' : 'transparent',
                        color: 'var(--sm2-on-primary)',
                      }}
                    >
                      {on && <Icon name="check" size={20} fill={1} weight={700} />}
                    </span>
                    <span style={sm2Text}>{item.name}</span>
                  </button>
                );
              })}
              {/* "Add N steps": o único `primary` da folha — há UMA ação;
                  inerte até escolher, rotulado. */}
              <button
                type="button"
                style={{ ...sm2Button('primary', picks.length === 0, 'sm'), alignSelf: 'flex-start' }}
                disabled={picks.length === 0}
                aria-disabled={picks.length === 0 || undefined}
                onClick={() => { onDecompose(task.id, picks); onClose(); }}
              >
                {isPt
                  ? `Adicionar ${picks.length || ''} ${picks.length === 1 ? 'passo' : 'passos'}`.replace('  ', ' ')
                  : `Add ${picks.length || ''} ${picks.length === 1 ? 'step' : 'steps'}`.replace('  ', ' ')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---- ENCOLHER ---- */}
      <button
        type="button"
        style={opt(!canShrink)}
        disabled={!canShrink}
        aria-disabled={!canShrink || undefined}
        onClick={() => { onShrink(task.id); onClose(); }}
        aria-labelledby={ids.encT}
        aria-describedby={ids.encH}
      >
        <span style={optTitle} id={ids.encT}>
          <Icon name="do_not_disturb_on" size={24} />
          {isPt ? 'Encolher' : 'Shrink it'}
        </span>
        <span className="sm2-num" style={optHint(!canShrink)} id={ids.encH}>
          {canShrink
            ? (isPt
              ? `esforço ${effort} → ${effort - 1} · zera o contador`
              : `effort ${effort} → ${effort - 1} · resets the counter`)
            : (isPt
              ? 'Já é do tamanho mínimo — não dá pra encolher mais.'
              : 'Already at the smallest size — nothing left to shrink.')}
        </span>
      </button>

      {/* ---- DEIXAR PRA LÁ ---- `archive` (D-A8): `nightlight` é o Someday. */}
      <button
        type="button"
        style={opt()}
        onClick={() => { onDrop(task.id); onClose(); }}
        aria-labelledby={ids.dxT}
        aria-describedby={ids.dxH}
      >
        <span style={optTitle} id={ids.dxT}>
          <Icon name="archive" size={24} />
          {isPt ? 'Deixar pra lá' : 'Let it go'}
        </span>
        <span style={optHint()} id={ids.dxH}>
          {isPt
            ? 'Sai da lista sem ser concluída e sem ser apagada. Fica guardada, e dá pra trazer de volta quando quiser.'
            : 'Leaves the list without being completed and without being deleted. It stays tucked away, and you can bring it back any time.'}
        </span>
      </button>
    </ModalSheet>
  );
}

// O glossário só existe quando alguém o abre — e ganhou os verbetes da Guilda (B2): fora do JS de entrada.
const HelpModal = lazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })));
const RestWindowCard = lazy(() => import('./components/RestWindowCard').then(m => ({ default: m.RestWindowCard })));
const DreamDex = lazy(() => import('./components/DreamDex').then(m => ({ default: m.DreamDex })));
const AdventureDiary = lazy(() => import('./components/AdventureDiary').then(m => ({ default: m.AdventureDiary })));

/** Ritmo vazio ESTÁVEL para hábito sem histórico — um `emptyRhythm()` inline na
 *  prop cria objeto novo a cada render (mesmo motivo de `EMPTY_DECOR`). */
const EMPTY_RHYTHM = emptyRhythm();

/**
 * Registra a conclusão de um hábito NO MESMO DIA em que ela acontece.
 *
 * A virada do dia (`utils/dailyReset.ts`) já escreve faltas, escudos e a
 * conclusão de ONTEM — isto aqui não duplica aquilo: `completeHabit` é
 * idempotente por dayKey, então quando a virada reprocessar o mesmo dia ela não
 * acha nada para fazer. O que se ganha escrevendo agora é a única coisa que a
 * virada não pode dar: a pessoa marca o hábito e VÊ a constância mexer, em vez
 * de esperar até depois da meia-noite para descobrir se contou.
 *
 * O rendimento de atributo é o BÔNUS de maturidade (`attributeMultiplier`, de
 * `habitRhythm.ts`), e só ele: a base continua vindo da comida, como sempre
 * veio. Um hábito maduro rende MAIS, nunca menos — a "eficiência decrescente"
 * comum em jogos de idle ensinaria a abandonar exatamente o que o app quer
 * preservar. Hábito novo (tier semente) tem multiplicador 1, logo bônus zero:
 * ninguém ganha nada que já não ganhava.
 *
 * Função PURA sobre `prev`, para poder viver dentro de um updater sem violar o
 * footgun 6 (a celebração do marco fica fora, no chamador).
 */
function withHabitCompletion(
  prev: GameState,
  activityId: string,
  category: ActivityCategory,
  todayKey: string,
  /** Dia do JOGADOR (`utils/playerDay.ts`) — a régua do ledger de teto do
   *  Vínculo. Vem por parâmetro, e não de um `new Date()` aqui dentro, porque
   *  esta função roda DENTRO de um updater e precisa continuar pura. */
  bondDayKey: string,
): GameState {
  const before = prev.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  if (after === before) return prev; // já marcado hoje — nada a fazer

  const extra = attributeMultiplier(after.totalDone) - 1;
  const base = CATEGORY_ATTRIBUTES[category] ?? { power: 0, harmony: 0, benevolence: 0 };
  const bonus = {
    power: Math.round(base.power * extra),
    harmony: Math.round(base.harmony * extra),
    benevolence: Math.round(base.benevolence * extra),
  };

  // 🔗 Vínculo: a conclusão do hábito é UM dos eventos que a trilha relê. O
  // multiplicador é o MESMO tier de maturidade que já rege o atributo
  // (`habitRhythm.ts`) — nada de segunda tabela (footgun 9), e nenhuma ação
  // nova é pedida: quem marcaria o hábito de qualquer jeito sobe.
  const comXP = awardBondXP(prev, {
    kind: 'completion', weight: HABIT_WEIGHT, habitTier: habitTier(after.totalDone),
  }, bondDayKey);

  /* 🔗 #59b — 🌳 MARCO DE HÁBITO (7/21/66). Um dos 6 `BondEvent` que a tabela
     do §55 declarava e ninguém emitia (QA rodada 2 §2.4: 7 dos 11 mudos).
     `milestoneReached` é a MESMA detecção que a cerimônia usa — nada de
     segunda tabela (footgun 9) —, e `completeHabit` é idempotente por dayKey,
     então marcar o hábito duas vezes no mesmo dia não paga duas vezes.
     Os dias saem de `HABIT_MILESTONES` (`types/taskModel.ts`), dono único dos
     números, e não de literais. */
  const marco = milestoneReached(before.totalDone, after.totalDone);
  const comMarco = marco
    ? awardBondXP(comXP, { kind: 'habitMilestone', days: after.totalDone }, bondDayKey)
    : comXP;

  return {
    ...comMarco,
    habitRhythms: { ...(prev.habitRhythms ?? {}), [activityId]: after },
    powerPoints: prev.powerPoints + bonus.power,
    harmonyPoints: prev.harmonyPoints + bonus.harmony,
    benevolencePoints: prev.benevolencePoints + bonus.benevolence,
    attributesSinceLastEvolution: {
      power: (prev.attributesSinceLastEvolution?.power ?? 0) + bonus.power,
      harmony: (prev.attributesSinceLastEvolution?.harmony ?? 0) + bonus.harmony,
      benevolence: (prev.attributesSinceLastEvolution?.benevolence ?? 0) + bonus.benevolence,
    },
  };
}

/**
 * O marco (7/21/66 dias) que esta conclusão ACABOU de cruzar, ou `null`.
 *
 * Lido fora do updater, do estado que o handler já tem em mãos: `setGameState`
 * roda 2× no StrictMode, e uma celebração lá dentro tocaria duas vezes.
 */
function habitMilestoneOf(state: GameState, activityId: string, todayKey: string) {
  const before = state.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  return milestoneReached(before.totalDone, after.totalDone);
}

/**
 * WP2.13 — o dia de FALA que acabou de ser cruzado (3/36/51), ou `null`.
 *
 * Mesma leitura de `habitMilestoneOf` e mesmo motivo de estar aqui fora: o
 * updater roda 2× no StrictMode, e a fala tocaria duas vezes lá dentro.
 * Estes números NÃO são marcos: não mudam ícone, não mudam rendimento, não
 * dão nada. Existem porque entre o marco de 21 e o de 66 há quarenta e cinco
 * dias em que nada acontece, e é ali que a maioria das pessoas para.
 */
function habitCheerOf(state: GameState, activityId: string, todayKey: string) {
  const before = state.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  return cheerReached(before.totalDone, after.totalDone);
}

// Sem emoji (canvas Rituais X3 / achado 18): o tier já é o `eco` FILL e o
// emblema no vidro da cerimônia — um glifo colorido na frase repetiria os dois.
const MILESTONE_TEXT: Record<string, { pt: string; en: string }> = {
  sprout: { pt: '7 dias! Este hábito virou broto.', en: '7 days! This habit is a sprout now.' },
  sapling: { pt: '21 dias! Este hábito está criando tronco.', en: '21 days! This habit is growing a trunk.' },
  /* ⚠️ 21/09/2026 — dizia `'virou parte de quem você é'` / `'is part of who
     you are'`, e essa é a L1 violada no marco mais importante do motor de
     hábitos: a pessoa como SUJEITO de um verbo de ser. O checklist da bíblia
     (`docs/NARRATIVA-E-UNIVERSO.md` §17 item 1) reprova isso **mesmo sendo
     elogio** — e é elogio, o que torna o caso mais fácil de deixar passar. O
     sujeito passa para a coisa que cresceu; a celebração não perde nada. */
  tree: { pt: '66 dias! Isso virou raiz.', en: '66 days! This one took root.' },
};

const RebirthModal = lazy(() => import('./components/RebirthModal').then(m => ({ default: m.RebirthModal })));
const EvolutionPath = lazy(() => import('./components/EvolutionPath').then(m => ({ default: m.EvolutionPath })));
const CreditsModal = lazy(() => import('./components/CreditsModal').then(m => ({ default: m.CreditsModal })));
const NewReadingModal = lazy(() => import('./components/NewReadingModal').then(m => ({ default: m.NewReadingModal })));
const GameTutorialFlow = lazy(() => import('./components/GameTutorialFlow').then(m => ({ default: m.GameTutorialFlow })));
const CreateModal = lazy(() => import('./components/CreateModal').then(m => ({ default: m.CreateModal })));
// A barra de captura NÃO é lazy: ela fica na primeira tela e o ganho dela é
// justamente não ter espera nenhuma entre lembrar e anotar.
import type { QuickAddResult } from './utils/quickAdd';
const StatsPage = lazy(() => import('./components/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
// minimal-ui F5 — a `ActivitiesPage` (hub de cartões) saiu: Masmorra e Corrida
// do Dino são lotes da Exploração, o Pedra, papel e tesoura é lote de Jogos —
// todos dentro do `AreaView` (ex-PR #118).
const SoulmonOnboarding = lazy(() => import('./components/SoulmonOnboarding').then(m => ({ default: m.SoulmonOnboarding })));
const BalanceWeekModal = lazy(() => import('./components/BalanceWeekModal').then(m => ({ default: m.BalanceWeekModal })));
const EditModal = lazy(() => import('./components/EditModal').then(m => ({ default: m.EditModal })));
const TaskEditModal = lazy(() => import('./components/TaskEditModal').then(m => ({ default: m.TaskEditModal })));
const OraclePage = lazy(() => import('./components/OraclePage').then(m => ({ default: m.OraclePage })));
const LibraryPage = lazy(() => import('./components/LibraryPage').then(m => ({ default: m.LibraryPage })));
// minimal-ui F5 — a `ShopModal` saiu: a vitrine virou as lojinhas do Mercado
// (`components/mercado/`) e a loja de Emblemas mora no Torneio (Arena).
// A área inteira (cena + lotes + folhas + Torneio/Duelo) entra por `lazy`:
// nada dela é necessário para a Home abrir, e o chunk de entrada está acima do
// orçamento de bytes (decisão #31).
const AreaView = lazy(() => import('./components/nav/AreaView').then(m => ({ default: m.AreaView })));
const PetPage = lazy(() => import('./components/PetPage').then(m => ({ default: m.PetPage })));

/** O que o `<main>` desenha fora das áreas, DERIVADO da navegação
 *  (`navigation.ts`). Desde a F5 toda área é desenhada pelo `AreaView`; o
 *  `pane` delas só importa no Laboratório, onde a sub-aba (`labTab`) decide a
 *  folha. As outras cinco áreas viram `'area'`. */
type Pane = 'main' | 'map' | 'area' | 'evolution' | 'stats' | 'pet' | 'settings' | 'oracle';
type LabTab = 'evolution' | 'pet' | 'stats';

function paneFor(view: ViewType, labTab: LabTab): Pane {
  if (view === 'home') return 'main';
  if (view === 'map') return 'map';
  const page = menuPageOf(view);
  if (page) return page;
  const area = areaOf(view);
  if (area === 'laboratorio') return labTab;
  return area ? 'area' : 'main';
}

export default function App() {
  const { gameState, setGameState } = useGameState();
  const [showIntro, setShowIntro] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  /** Sub-aba do Laboratório (Evolução / Soulmon / Estatísticas). */
  const [labTab, setLabTab] = useState<LabTab>('evolution');
  const pane = paneFor(currentView, labTab);
  /** A área do Mapa da view atual, ou `null` fora de uma área (minimal-ui F4). */
  const area = areaOf(currentView);
  /** O menu ícone da Home (D6). */
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;
  // Id estável de comunidade (Tournament/Biblioteca) — mesmo id do cloud save.
  // Vira o hash do e-mail assim que o onboarding cadastra um (ver
  // handleCompleteOnboarding) — daí o setter, ao contrário do resto do app
  // que troca de identidade via reload.
  const [saveId, setSaveId] = useState(() => {
    let id = readLocal(STORAGE_KEYS.SAVE_ID);
    // Identidade do save: se nao persistir, o jogador vira outra pessoa a cada
    // abertura. E o caso mais grave que existe - a falha AVISA.
    if (!id) { id = crypto.randomUUID(); writeLocal(STORAGE_KEYS.SAVE_ID, id); }
    return id;
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  /** P4 — "Equilibrar minha semana". Só abre por gesto; nunca sozinho. */
  const [balanceOpen, setBalanceOpen] = useState(false);

  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // F4 do catálogo: o CTA de "+" abre o NAVEGADOR primeiro (docs/PLANO-CATALOGO-ATIVIDADES.md
  // §5); "Algo que não está aqui?" dentro dele é que abre o `CreateModal`
  // legado (inalterado) para criar do zero/tarefa avulsa.
  const [catalogBrowserOpen, setCatalogBrowserOpen] = useState(false);
  const [evolveModalStage, setEvolveModalStage] = useState<string | null>(null);
  // Cerimônia de evolução manual (botão sobre o pet) — {from,to} enquanto aberta
  const [evolutionCeremony, setEvolutionCeremony] = useState<{ from: string; to: string } | null>(null);
  // Leitura do ritmo de cuidado (utils/carePattern.ts): alimenta a vitrine em
  // Estatísticas e desempata o galho na evolução. useMemo porque percorre o
  // histórico e o CompanionHUD é memo().
  const carePatternReading = useMemo(
    // `careHistory` junta tarefas avulsas + atividades recorrentes: sem o log
    // de atividades o ritmo fica cego justamente para o mecanismo principal de
    // hábito do app. É a MESMA função usada pela cerimônia de evolução — a
    // previsão e a decisão não podem ler históricos diferentes.
    () => computeCarePattern(careHistory(gameState)),
    [gameState.completedTasks, gameState.activityLog],
  );

  // ── INCUBAÇÃO (D-G8b/D-G8c, 22/09/2026). Duas peças, e as duas são finas de
  //    propósito: a REGRA mora em `utils/spriteTrigger.ts` e nada dela é
  //    reescrito aqui.
  //
  //    1. O relógio. Existe só para o botão acender sozinho quando a espera
  //       termina — sem ele o jogador teria de recarregar a página para
  //       descobrir que já pode, que é a "conferência compulsiva" que o parecer
  //       R-K manda evitar. Tica de minuto em minuto e **só enquanto há forma
  //       incubando**: fora disso o estado nunca muda e o app não re-renderiza.
  //       ⚠️ Ele NÃO vira contagem na tela — o R-I proíbe dígito que decresce,
  //       barra em tempo real e hora impressa. É relógio de porta, não de vitrine.
  const [agoraParaIncubacao, setAgoraParaIncubacao] = useState(() => new Date());
  const incubandoAlgo = useMemo(
    () => Object.keys(gameState.incubation?.since ?? {}).some(
      f => !incubationReady(gameState.incubation, f, agoraParaIncubacao),
    ),
    [gameState.incubation, agoraParaIncubacao],
  );
  useEffect(() => {
    if (!incubandoAlgo) return;
    const id = setInterval(() => setAgoraParaIncubacao(new Date()), 60_000);
    return () => clearInterval(id);
  }, [incubandoAlgo]);

  /** A forma-destino está incubando AGORA? É o que o aviso da Home pergunta —
   *  derivado, nunca persistido (o nível do Vínculo ensinou por que: dois
   *  donos do mesmo número é o footgun 9 na forma mais cara). */
  const incubandoAgora = useMemo(() => {
    const { stage: proxima } = evolutionTarget({
      points: { power: gameState.powerPoints, harmony: gameState.harmonyPoints, benevolence: gameState.benevolencePoints },
      reading: carePatternReading,
      currentBranch: gameState.currentBranch,
      evolutionStage: gameState.evolutionStage,
      unlockedEvolutions: gameState.unlockedEvolutions,
      perfectDays: gameState.perfectDays,
    });
    if (proxima === gameState.evolutionStage) return false;
    return isIncubating(gameState.incubation, proxima, agoraParaIncubacao);
  }, [gameState.incubation, gameState.powerPoints, gameState.harmonyPoints, gameState.benevolencePoints,
      gameState.currentBranch, gameState.evolutionStage, gameState.unlockedEvolutions,
      gameState.perfectDays, carePatternReading, agoraParaIncubacao]);

  //    2. A escrita. Roda quando o jogador fica APTO, e de propósito **não
  //       olha o acervo de sprites**: `spriteBatch` devolve `null` para conta
  //       em `sprite-lifetime-cap`, forma em `sprite-form-cap` e geração
  //       falha, e amarrar a escrita ao lote deixaria justamente esses
  //       jogadores sem incubação — travados fora da própria evolução, já que
  //       o portão exige uma. É o D-G8d, e o parecer R-M o transformou em régua.
  useEffect(() => {
    setGameState(prev => {
      const novo = incubationFor(
        {
          evolutionStage: prev.evolutionStage,
          perfectDays: prev.perfectDays,
          points: { power: prev.powerPoints, harmony: prev.harmonyPoints, benevolence: prev.benevolencePoints },
          reading: carePatternReading,
          currentBranch: prev.currentBranch,
          unlockedEvolutions: prev.unlockedEvolutions,
        },
        prev.incubation,
        new Date(),
      );
      // `incubationFor` é idempotente e devolve a MESMA referência quando nada
      // muda — é isso que impede este efeito de virar spam de cloud save.
      return novo === prev.incubation ? prev : { ...prev, incubation: novo };
    });
  }, [gameState.evolutionStage, gameState.perfectDays, gameState.powerPoints,
      gameState.harmonyPoints, gameState.benevolencePoints, gameState.currentBranch,
      carePatternReading, setGameState]);

  const [guideModalOpen, setGuideModalOpen] = useState(false);
  // Loja — hoje é a área Mercado do Mapa (`navigation.ts`).
  // Créditos (monetização) — modal próprio, aberto pelo menu sanduíche.
  const [creditsOpen, setCreditsOpen] = useState(false);
  /** WP5.7 — a Nova Leitura (o que era o reroll por sorteio). */
  const [newReadingOpen, setNewReadingOpen] = useState(false);
  const [rebirthOpen, setRebirthOpen] = useState(false);
  /** WP2.4 — a cerimônia do marco. `null` = nenhuma acontecendo. */
  const [milestoneCeremony, setMilestoneCeremony] = useState<
    { tier: string; habitName: string; text: string; dateLabel: string; reducedMotion: boolean } | null
  >(null);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [resetOnboardingOpen, setResetOnboardingOpen] = useState(false);
  const [hpBannerDismissed, setHpBannerDismissed] = useState(false);
  /** O convite ao Refúgio foi aceito: a área Jogos monta já com a respiração aberta (one-shot). */
  const [refugeLaunch, setRefugeLaunch] = useState(false);
  /* SLOT DO DIA — a linha "+N avisos" nasce RECOLHIDA. Estado de VISTA, fora
     do GameState de propósito (não vira cloud save a cada toque). */
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  /* Etapas na Home nascem RECOLHIDAS (G1): uma atividade de 4 etapas ocupava 5
     linhas e comia sozinha a dobra. Estado de VISTA, não de jogo — de propósito
     fora do GameState, para não virar cloud save a cada toque. */
  const [expandedRituals, setExpandedRituals] = useState<Record<string, boolean>>({});
  const handleExpandRitual = useCallback((id: string) => setExpandedRituals(prev => ({ ...prev, [id]: !prev[id] })), []);
  const [messageTrigger, setMessageTrigger] = useState(0);
  const [feedAnim, setFeedAnim] = useState<{ emoji: string; n: number } | null>(null);
  const [careEvent, setCareEvent] = useState<CareEvent | null>(null);
  const [showEvolutionChoice, setShowEvolutionChoice] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [soundMuted, setSoundMuted] = useState(() => isMuted());
  const [evolutionFlash, setEvolutionFlash] = useState(false);
  const [newItemsReady, setNewItemsReady] = useState(false);
  // Sleep state persists across app close/reopen — the pet stays asleep until woken.
  const [isSleeping, setIsSleeping] = useState(() => readFlag(STORAGE_KEYS.IS_SLEEPING));
  // O teto de comida por hora mora no SAVE (`gameState.careCaps.feedTimes`), e
  // não mais no localStorage: com PWA e APK o contador por aparelho dava 12
  // comidas/hora ao mesmo jogador. Ver utils/careCaps.ts.
  // Bumped when a feed is refused for being full → pet says it's full.
  const [fullSignal, setFullSignal] = useState(0);
  /** WP3.2 — os gestos que eram mudos. O `kind` escolhe a tabela de frases
   *  (`utils/petVoice.ts`); o `n` é o que dispara. */
  const [speakSignal, setSpeakSignal] = useState<{ n: number; kind: PetVoiceKind } | undefined>();
  /** WP1.3 — marca um dos três gestos do primeiro dia. Pura e idempotente
   *  (`markGesture` devolve a MESMA referência), então pode entrar direto no
   *  updater sem violar o footgun 6. */
  const marcarGestoDoDia = useCallback((gesto: FirstDayGesture) => {
    setGameState(prev => {
      const hoje = playerDayKey(new Date(), prev.playerDayTz);
      // Só marca DENTRO do primeiro dia: fora dele o registro nem existe mais.
      if (!prev.firstDay || prev.firstDay.day !== hoje) return prev;
      const next = markGesture(prev.firstDay, gesto);
      return next === prev.firstDay ? prev : { ...prev, firstDay: next };
    });
  }, []);

  const falar = useCallback((kind: PetVoiceKind) => {
    setSpeakSignal(prev => ({ n: (prev?.n ?? 0) + 1, kind }));
  }, []);
  /** O carinho fala UMA vez por sessão: o gesto é repetido dezenas de vezes
   *  por dia, e um bicho que comenta toda esfregada vira ruído. */
  const rubFalouRef = useRef(false);
  // Daily report: shown once per day, on the first open after the reset ran.
  const [showDailyReport, setShowDailyReport] = useState(false);
  // A virada do dia. Subiu para ANTES da geração incremental porque o
  // `rolloverPending` que ela devolve entra no `busy` do lote (X-7) -- ordem de
  // hook, não de lógica: continua incondicional e única.
  const { rolloverPending } = useDailyReset({
    gameState,
    setGameState,
  });

  // ── Geração incremental de sprite (spec `soulmon-02/spec-geracao-incremental.md`)
  //    A regra não mora aqui: o gatilho é `utils/spriteTrigger.ts`, o acervo é
  //    `utils/spriteLibrary.ts`, e a forma-destino vem da MESMA
  //    `evolutionTarget()` que a cerimônia commita — nada de quarta cópia.
  // O corvinho do administrador (`utils/corvoPet.ts`) tem arte fixa por forma:
  // enquanto a marca existir, o acervo gerado fica guardado no save mas não é
  // desenhado — senão `displaySprite` venceria o corvo em todo lugar.
  const petIsCorvo = isCorvo(gameState);
  const petLine = spriteLineOf(gameState);
  const spriteAcervo = useMemo(
    () => (petIsCorvo ? emptySpriteLibrary() : libraryOf(gameState)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [petIsCorvo, gameState.spriteLibrary],
  );
  const updateSpriteLibrary = useCallback(
    (fn: (prev: SpriteLibrary) => SpriteLibrary) =>
      setGameState(prev => ({ ...prev, spriteLibrary: fn(prev.spriteLibrary ?? emptySpriteLibrary()) })),
    [setGameState],
  );
  const spriteGen = useSpriteGeneration({
    trigger: {
      evolutionStage: gameState.evolutionStage,
      currentBranch: gameState.currentBranch,
      unlockedEvolutions: gameState.unlockedEvolutions,
      perfectDays: gameState.perfectDays,
      points: { power: gameState.powerPoints, harmony: gameState.harmonyPoints, benevolence: gameState.benevolencePoints },
      reading: carePatternReading,
    },
    library: spriteAcervo,
    updateLibrary: updateSpriteLibrary,
    stages: gameState.soulmonStages,
    dayKey: dayKeyOf(new Date()),
    // As quatro regras de janela do §3.3: nada parte (e nada troca de rosto)
    // durante a VIRADA DO DIA, a cerimônia, o relatório diário ou uma animação
    // de cuidado.
    //
    // ⚠️ X-7: até 26/08/2026 este comentário dizia "as quatro" e enumerava três
    // — a virada faltava no valor. O sinal vem do `useDailyReset`, dono único da
    // regra, em vez de recalculado aqui: o próprio `useDailyReset.ts` avisa por
    // escrito contra a segunda cópia.
    busy: rolloverPending || !!evolutionCeremony || showDailyReport || !!careEvent || !!feedAnim,
    // NÃO é pré-checagem de tier (quem decide é o servidor): é o corte de quem
    // não tem árvore própria e portanto não teria prompt para mandar.
    enabled: !gameState.demoCharacterId && !petIsCorvo && (gameState.soulmonStages?.length ?? 0) > 0,
    // F-1: a ocasiao A (`birthBatch`) nao tinha chamador, e quem paga chegava ao
    // reveal vendo a MESMA arte de reserva do demo gratis -- o primeiro sprite
    // proprio so nascia na vespera da primeira evolucao, dias depois.
    //
    // A pergunta e do ACERVO, nao de identidade: `isNewbornLibrary` documenta
    // por que isto NAO depende do `GET /api/whoami` (que nao existe e nao tem
    // dono). `birthBatch` ja filtra o que existe, entao ligar isto nao pode
    // gerar duas vezes.
    newborn: isNewbornLibrary(spriteAcervo),
  });
  const handleTuneVisor = useCallback((formId: string) => spriteGen.tune(formId), [spriteGen]);
  /* O botao "Tentar de novo" do card de falha de credencial. Nasceu INERTE no
     commit 60b0c89b: `onRetrySprite` e opcional, entao a prop faltando nao
     acusava nada nem no TypeScript nem na suite, e o botao simplesmente nao
     era desenhado. Quem manda continua sendo `canManualRetry` (teto manual de
     3 e cooldown de 60 s), dentro do hook — este handler nao decide nada e nao
     abre um segundo caminho de geracao. */
  const handleRetrySprite = useCallback((formId: string) => spriteGen.retry(formId), [spriteGen]);
  /* O anúncio é PONTUAL: some depois de anunciado, para a região viva não
     repetir a mesma frase na próxima mudança dela. 4s é o suficiente para um
     leitor de tela ler "Visor sintonizado" sem cortar. */
  const { tunedAnnouncement: visorAnunciou, clearAnnouncement: limparAnuncio } = spriteGen;
  useEffect(() => {
    if (!visorAnunciou) return;
    const t = setTimeout(limparAnuncio, 4000);
    return () => clearTimeout(t);
  }, [visorAnunciou, limparAnuncio]);

  // X-3: a marca de "adotado sozinho" sai do save quando o jogador vê o card.
  const handleSeenTune = useCallback(
    (formId: string) => updateSpriteLibrary(prev => markTuneSeen(prev, formId)),
    [updateSpriteLibrary],
  );
  const handleRevertVisor = useCallback(
    (formId: string) => updateSpriteLibrary(prev => revertVisor(prev, formId)),
    [updateSpriteLibrary],
  );


  // ── Os rituais do motor de tarefas (utils/rituals.ts) ─────────────────────
  // Check-in matinal: no MÁXIMO 1× por dia (`lastCheckInDate` no save) e
  // pulável sem culpa. O plano é congelado em estado ao abrir, e não recalculado
  // a cada render, para a lista de sugestões não trocar debaixo do dedo.
  const [checkInPlanData, setCheckInPlanData] = useState<ReturnType<typeof checkInPlan> | null>(null);
  // "Arrumar a pilha": a fila também é congelada ao abrir — ela encolhe a cada
  // decisão, e recalcular ao vivo faria o contador "3 de 8" mentir.
  const [triageTasks, setTriageTasks] = useState<Task[] | null>(null);
  // O sonho da manhã. NUNCA aparece à noite (ver o efeito lá embaixo).
  const [morningDream, setMorningDream] = useState<{ dream: Dream | null; isNew: boolean } | null>(null);
  // Recomeço de segunda/dia 1: cartão discreto, dispensável nesta sessão sem
  // gravar nada — recusar um convite não é uma decisão que mereça memória.
  const [freshStartDismissed, setFreshStartDismissed] = useState(false);
  // Termos/Política atualizados (decisão #24): a marca da última versão que a
  // pessoa dispensou com "Ok" fica no aparelho — aviso lido, não consentimento.
  const [termsNoticeSeen, setTermsNoticeSeen] = useState<string | null>(() => readLocal(STORAGE_KEYS.TERMS_NOTICE_SEEN));
  // A3 (QA rodada 2): o banner de Termos ficava preso atrás do "+N" desde a
  // primeira aparição. Lido UMA vez por abertura: se a marca desta versão
  // ainda não foi exibida, o banner entra em posição 1 nesta sessão inteira
  // (a marca é gravada no efeito abaixo, mas o estado não muda até o reload).
  const [termsNoticeShown] = useState<string | null>(() => readLocal(STORAGE_KEYS.TERMS_NOTICE_SHOWN));
  const termsNoticePrimeiraVez = termsNoticeShown !== marcaAvisoTermos(TERMS_VERSION, PRIVACY_VERSION);
  useEffect(() => {
    if (!termsNoticePrimeiraVez) return;
    if (!precisaAvisarTermos(gameState.consent, TERMS_VERSION, PRIVACY_VERSION, termsNoticeSeen)) return;
    writeLocal(STORAGE_KEYS.TERMS_NOTICE_SHOWN, marcaAvisoTermos(TERMS_VERSION, PRIVACY_VERSION), { silent: true });
  }, [termsNoticePrimeiraVez, gameState.consent, termsNoticeSeen]);
  // O COMBATE do pesadelo: a outra face da mesma noite que rendeu o sonho.
  // Também só de manhã, também nunca à noite (ver o efeito lá embaixo).
  const [nightmareOpen, setNightmareOpen] = useState(false);
  // Passos: `null` = ainda não perguntei ao aparelho. Na PWA vira `false` e
  // nada de passos aparece em lugar nenhum (a camada já degrada sozinha).
  const [stepsAvailable, setStepsAvailable] = useState<boolean | null>(null);
  const [stepsPermission, setStepsPermission] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    return readJson<AISettings>(STORAGE_KEYS.AI_SETTINGS, {
      tone: 'casual',
      emojiIntensity: 'medium',
      motivationStyle: 'balanced',
      customKeywords: '',
      temperature: 0.85,
    });
  });
  /* G7 (01/10/2026): a personalidade do chat é DERIVADA das forças e
     dificuldades do onboarding (`utils/personality.ts`; racional em
     `docs/PERSONALIDADE-DERIVADA.md`) e saiu das Configurações. Do que estava
     guardado sobra só o que não é personalidade (instruções livres,
     criatividade). Perfil ausente = fallback seguro. */
  const onboardingProfileRaw = (gameState as { onboardingProfile?: unknown }).onboardingProfile;
  const chatPersonality = useMemo(
    () => chatSettingsFor(personalityProfileFromSave({ onboardingProfile: onboardingProfileRaw }), aiSettings),
    [onboardingProfileRaw, aiSettings],
  );
  // Idioma inicial resolvido em utils/i18n.ts (mesma função usada no
  // onboarding, para as duas telas nunca discordarem).
  const [language, setLanguage] = useState<Language>(
    () => resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)),
  );
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return readFlag(STORAGE_KEYS.ONBOARDING_COMPLETE);
  });
  /**
   * P4 — as atividades que o "Equilibrar minha semana" pode reorganizar.
   *
   * SÓ as de dias fixos. `timesPerWeek` e `everyNDays` ficam de fora porque já
   * carregam perdão embutido: fixar dias para elas seria TIRAR flexibilidade
   * em nome de equilíbrio (ver `utils/weekBalance.ts`).
   */
  const atividadesDeDiasFixos = useMemo(
    () => gameState.activities
      .filter(a => (normalizeSchedule(a).kind) === 'weekdays')
      .map(a => ({ id: a.id, name: a.name, weekDays: a.weekDays ?? [] })),
    [gameState.activities],
  );

  /** Aparece só quando há um dia acima do requisito E a proposta melhora —
   *  oferecer "equilibrar" a quem já está bem insinua falha onde não há. */
  const podeEquilibrar = useMemo(() => {
    const teto = FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required;
    const p = equilibrarSemana(
      atividadesDeDiasFixos.map(a => ({ id: a.id, days: a.weekDays })),
      teto,
    );
    return valeEquilibrar(p, teto);
  }, [atividadesDeDiasFixos, gameState.evolutionStage]);

  /**
   * Aplica a proposta JÁ CONFIRMADA pelo jogador.
   *
   * Escreve `weekDays` e o `schedule` juntos: o campo antigo continua sendo
   * lido pelo widget Android e pelo overlay de desktop, que não carregam o
   * motor novo — deixar um dos dois para trás faria o hábito cobrar num ritmo
   * na tela e noutro no widget.
   */
  const handleAplicarEquilibrio = useCallback((mudancas: { id: string; days: number[] }[]) => {
    const porId = new Map(mudancas.map(m => [m.id, m.days]));
    setGameState(prev => ({
      ...prev,
      activities: prev.activities.map(a => {
        const dias = porId.get(a.id);
        if (!dias) return a;
        return { ...a, weekDays: dias, schedule: { kind: 'weekdays' as const, days: dias } };
      }),
    }));
    toast.success(language === 'pt-BR' ? 'Semana espalhada 🌿' : 'Week spread out 🌿');
  }, [setGameState, language]);

  // Segundo onboarding: tutorial do jogo (estilo RPG) + criação obrigatória
  // da 1ª tarefa — mostrado uma vez, logo após o ritual de nascimento.
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    if (readFlag(STORAGE_KEYS.TUTORIAL_COMPLETE)) return true;
    // Adoção automática pra quem já jogava antes desse gate existir — jamais
    // interromper um jogador estabelecido com a tela de "crie sua 1ª tarefa".
    const saveAntigo = readJson<Record<string, any> | null>(STORAGE_KEYS.GAME_STATE, null);
    if (saveAntigo && ((saveAntigo.activities?.length ?? 0) > 0 || (saveAntigo.tasks?.length ?? 0) > 0
      || (saveAntigo.completedTasks?.length ?? 0) > 0 || (saveAntigo.perfectDays ?? 0) > 0)) {
      // Marca de "ja passou pelo tutorial": no pior caso ele reaparece uma vez.
      writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE, true, { silent: true });
      return true;
    }
    return false;
  });
  const [userName, setUserName] = useState(() => {
    return readLocal(STORAGE_KEYS.USER_NAME) || '';
  });
  const [showFirstTaskPopup, setShowFirstTaskPopup] = useState(false);
  const [hasShownFirstTaskPopup, setHasShownFirstTaskPopup] = useState(() => {
    if (readFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN)) return true;
    // Auto-mark for established users (have completed-task history or activity stats)
    const saveAntigo = readJson<Record<string, any> | null>(STORAGE_KEYS.GAME_STATE, null);
    if (saveAntigo && ((saveAntigo.completedTasks?.length ?? 0) > 0
      || Object.keys(saveAntigo.activityStats ?? {}).length > 0 || (saveAntigo.perfectDays ?? 0) > 0)) {
      writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
      return true;
    }
    return false;
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  /* G6 (01/10/2026): o padrão da preferência é LIGADO, condicionado à
     permissão que o sistema já deu (`utils/notificationDefault.ts`). Quem já
     escolheu manda; quem nunca escolheu e ainda não tem permissão continua
     esperando o convite certo (priming), nunca um pedido na abertura. */
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => initialNotificationsEnabled(
    readFlagState(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
    readSystemNotificationPermission(),
  ));
  /** O usuário (ou o convite) mexeu na chave nesta sessão. Sem isso, o
   *  "desligado por falta de permissão" do primeiro render seria GRAVADO e o
   *  "nunca decidiu" viraria "decidiu desligar" — o padrão ligado morreria na
   *  segunda abertura. */
  const notifTouchedRef = useRef(false);

  // Presentes de amigos (Biblioteca): reivindica bits pendentes ao abrir o app.
  useEffect(() => {
    getGifts(saveId, true).then(({ gifts }) => {
      if (!gifts.length) return;
      const total = gifts.reduce((sum, g) => sum + g.bits, 0);
      setGameState(prev => ({ ...prev, gamePoints: (prev.gamePoints ?? 0) + total }));
      toast.success(
        language === 'pt-BR'
          ? `Você recebeu ${total} Bits de amigos!`
          : `You received ${total} Bits from friends!`,
      );
    }).catch(() => {});
    getPendingTrophies(saveId, true).then(({ trophies }) => {
      if (!trophies.length) return;
      setGameState(prev => ({ ...prev, trophies: [...(prev.trophies ?? []), ...trophies] }));
      const place = trophies[0].place;
      toast.success(
        language === 'pt-BR'
          ? `Torneio: você ficou em ${place}º lugar na season ${trophies[0].season}!`
          : `Tournament: you placed #${place} in season ${trophies[0].season}!`,
      );
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveId]);

  useEffect(() => {
    // Personalidade da IA: preferencia. Falhar reverte ao padrao. Silencioso.
    writeJson(STORAGE_KEYS.AI_SETTINGS, aiSettings, { silent: true });
  }, [aiSettings]);

  useEffect(() => {
    // G6: um "desligado" que só veio do PADRÃO não é escolha — não grava.
    if (!notificationsEnabled && !notifTouchedRef.current
      && readFlagState(STORAGE_KEYS.NOTIFICATIONS_ENABLED) === 'absent') return;
    writeFlag(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled, { silent: true });
  }, [notificationsEnabled]);

  // ─────────────────────────────────────────────────────────── B-R1
  //
  // RE-DERIVAÇÃO DO `saveId` DE QUEM JÁ ESTÁ AUTENTICADO.
  //
  // Quem nunca logou tem `SAVE_ID = crypto.randomUUID()` (a linha ~548 acima e
  // a gêmea no `GameStateContext`). Esse UUID passa no `VALID_ID` do servidor,
  // então hoje funciona. Quando a fatia 1 ligar o `enforced: true`, o servidor
  // vai comparar `emailToSaveId(email)` com o UUID, não vai bater, e vai
  // devolver **403 permanente** — e re-login NÃO conserta, porque o erro está
  // no `SAVE_ID` local, não no token. É um beco sem saída.
  //
  // Os quatro handlers de login abaixo já realinham o id no caminho feliz. O
  // que faltava era a rede de segurança para quem CHEGA nesta sessão já
  // autenticado e desalinhado — porque o `writeLocal` daquele momento falhou
  // (storage cheio), porque o login aconteceu em outra aba, ou porque a sessão
  // do Firebase sobreviveu a um caminho que não passou por nenhum handler.
  // Este efeito fecha todos de uma vez, no ponto onde o sintoma apareceria.
  //
  // Barato no caso comum: quem já está alinhado (todo mundo que logou hoje)
  // sai de `reconcileSaveId` antes de tocar a rede. Sem sessão, não faz nada —
  // quem nunca logou continua jogando local exatamente como antes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { getCurrentEmail } = await import('./utils/auth');
      const email = await getCurrentEmail();
      if (cancelled || !email) return;
      const { reconcileSaveId } = await import('./utils/cloudSave');
      // O estado LOCAL é o que sobe quando a chave derivada está vazia — é o
      // "subindo o estado que ela já tinha" da decisão do dono.
      const r = await reconcileSaveId(email, gameState);
      if (cancelled || r.estado === 'sem-mudanca' || r.estado === 'sem-email') return;
      if (r.estado === 'migrado') {
        // A identidade trocou e o dado é o mesmo que já está em memória: nada
        // a recarregar. Só o id de comunidade precisa acompanhar.
        setSaveId(r.saveId);
        return;
      }
      if (r.estado === 'adotado') {
        // O save da nuvem substituiu o local. Recarregar é o caminho que o app
        // já usa para trocar de identidade COM troca de dado — o estado em
        // memória é de outra conta e não pode continuar sendo escrito.
        window.location.reload();
      }
      // 'indeterminado' e 'storage': nada foi movido de propósito. A próxima
      // abertura tenta de novo, e até lá o jogo segue local (que é o modo
      // normal deste app).
    })();
    return () => { cancelled = true; };
    // Uma vez por abertura. `gameState` é lido como snapshot de propósito: pôr
    // ele nas deps faria a reconciliação re-rodar a cada gesto do jogador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retorno do link de acesso por e-mail: se o app abriu a partir dele,
  // conclui o login antes de qualquer chamada de API (as rotas de save e
  // dinheiro passam a exigir o token). Ver src/utils/auth.ts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        isAuthConfigured, isPendingLoginLink, completeLoginFromLink, startDesktopAuthBridge,
      } = await import('./utils/auth');
      // Quando esta página roda dentro do app de desktop, ela é quem autentica
      // o overlay da barra de tarefas (ver docs/PLANO-DESKTOP-STEAM.md, 2c).
      void startDesktopAuthBridge();
      if (!isAuthConfigured() || !(await isPendingLoginLink())) return;
      const res = await completeLoginFromLink();
      if (cancelled || !res.ok || !res.email) return;
      // O saveId é derivado do e-mail agora COMPROVADO — realinha e recarrega
      // para o estado inteiro vir da conta certa.
      const { emailToSaveId, cloudLoad, adoptCloudSave, checarContaExcluidaNoLogin } = await import('./utils/cloudSave');
      // F1 (QA rodada 2): conta com lápide não entra — o helper já deslogou e
      // gravou o aviso; o reload devolve ao portão, que o mostra.
      if (await checarContaExcluidaNoLogin(res.email)) {
        if (!cancelled) window.location.reload();
        return;
      }
      const id = await emailToSaveId(res.email);
      // Se já existe save nesse e-mail, `adoptCloudSave` grava o DADO antes da
      // identidade — a ordem inversa (identidade primeiro) com storage cheio
      // deixava o app apontado para um save que nunca chegou, e o próximo
      // cloud save subia o estado local antigo por cima do save do outro
      // aparelho (rodada 4, §3). Este call site tinha escapado daquele fix.
      const existente = await cloudLoad(id);
      if (cancelled) return;
      if (existente) {
        if (adoptCloudSave(id, existente, res.email) !== 'ok') return;
      } else {
        // Conta nova: o save local é que vai subir. Só troca a identidade se
        // ela realmente persistiu; senão o reload voltaria ao id antigo.
        if (!writeLocal(STORAGE_KEYS.SAVE_ID, id)) return;
        writeLocal(STORAGE_KEYS.USER_EMAIL, res.email);
      }
      window.location.reload();
    })();
    return () => { cancelled = true; };
  }, []);

  // Pedido de e-mail adiado: só aparece quando já existe progresso que doeria
  // perder. Quem não deu e-mail no onboarding joga local — sem isso, uma
  // reinstalação apagaria tudo em silêncio.
  const [protectPrompt, setProtectPrompt] = useState<'evolution' | 'streak' | null>(null);

  // Desbloqueio completo DENTRO do jogo (ver UnlockAccountModal.tsx). Só abre
  // por toque do usuário; `upgradeRitual` é o ritual do oráculo que roda
  // DEPOIS da compra, para quem entrou pelo caminho grátis e agora tem direito
  // à criatura própria.
  const [unlockReason, setUnlockReason] = useState<UnlockReason | null>(null);
  // R1: camada de tela cheia aberta numa área (folha/jogo/duelo) — esconde o topo sobre a cena.
  const [areaLayerOpen, setAreaLayerOpen] = useState(false);
  const [upgradeRitual, setUpgradeRitual] = useState(false);
  // Booleanos, e não os arrays: dependendo de `unlockedEvolutions`/
  // `completedTasks` o efeito re-rodava a cada setGameState (a identidade do
  // array muda sempre), reiniciando o timer abaixo antes de ele disparar — o
  // pedido nunca aparecia.
  const jaEvoluiu = (gameState.unlockedEvolutions?.length ?? 0) > 1;
  const jaEngajou = (gameState.completedTasks?.length ?? 0) >= 5;
  useEffect(() => {
    if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
    if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;   // já protegido
    // Um pedido por semana, no máximo: insistir todo dia vira ruído.
    const last = readNumber(STORAGE_KEYS.PROTECT_PROMPT_AT, 0);
    if (Date.now() - last < 7 * 24 * 3600_000) return;
    if (!jaEvoluiu && !jaEngajou) return;

    // Espera o app assentar antes de aparecer. Na abertura já disputam espaço o
    // pedido de notificação e o relatório diário — dois modais empilhados é
    // confuso, e o de cima rouba o clique do de baixo (visto em teste).
    const t = window.setTimeout(() => {
      if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;
      setProtectPrompt(jaEvoluiu ? 'evolution' : 'streak');
    }, 15_000);
    return () => window.clearTimeout(t);
  }, [hasCompletedOnboarding, hasCompletedTutorial, jaEvoluiu, jaEngajou]);

  const dismissProtectPrompt = useCallback(() => {
    // So adia o proximo pedido; falhar faz o pedido voltar antes. Silencioso.
    writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()), { silent: true });
    setProtectPrompt(null);
  }, []);

  /** Passa o save local para a identidade do e-mail e sobe pra nuvem. */
  const handleProtectProgress = useCallback(async (email: string) => {
    const { emailToSaveId, cloudLoad, cloudSave, adoptCloudSave } = await import('./utils/cloudSave');
    const newSaveId = await emailToSaveId(email);

    // Já existe um Soulmon nesse e-mail (outro aparelho): adota em vez de
    // sobrescrever — apagar o save antigo de alguém seria bem pior do que
    // perder o progresso local recente.
    const existing = await cloudLoad(newSaveId);
    if (existing) {
      // `adoptCloudSave` grava o SAVE antes da identidade e nunca lança: com o
      // storage cheio, trocar o id sem o dado faria o próximo cloud save subir
      // o estado local antigo por cima do save do outro aparelho.
      if (adoptCloudSave(newSaveId, existing, email) !== 'ok') {
        toast.error(language === 'pt-BR'
          ? 'Não consegui carregar o progresso deste e-mail neste aparelho. Nada foi alterado.'
          : "Couldn't load this email's progress on this device. Nothing was changed.");
        return;
      }
      writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()));
      window.location.reload();
      return;
    }
    writeLocal(STORAGE_KEYS.USER_EMAIL, email);
    writeLocal(STORAGE_KEYS.SAVE_ID, newSaveId);
    writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()));
    await cloudSave(newSaveId, gameState);
    setSaveId(newSaveId);
    setProtectPrompt(null);
    toast(language === 'pt-BR' ? 'Progresso salvo na nuvem!' : 'Progress saved to the cloud!');
  }, [gameState, language]);

  // Sincroniza tier/créditos com o SERVIDOR ao abrir e ao trocar de save. O
  // que estiver no localStorage é só espelho — se alguém editou à mão, isto
  // sobrescreve com a verdade. Offline mantém o espelho (o servidor recusa
  // qualquer gasto mesmo assim, então não dá pra gastar o que não existe).
  //
  // Refaz a consulta quando (a) o usuário do Firebase muda (login sem troca de
  // `saveId`, token que só existe depois), (b) o app volta ao primeiro plano
  // (no máx. 1 por 30 s) e (c) uma vez, 2,5 s depois, se a 1ª vier `null`.
  // Ver `utils/entitlementSync.ts` — sem timer recorrente.
  useEffect(() => {
    const sync = createEntitlementSync<Entitlement>({
      fetch: fetchEntitlement,
      apply: ent => {
        // Admin/GM: SÓ da resposta do servidor, só em memória (`utils/adminFlag.ts`).
        // Falha de rede / sem saveId = não-admin.
        setAdminFlag(adminFromEntitlement(ent));
        if (!ent) return;
        setGameState(prev => (prev.credits === ent.credits && prev.accountTier === ent.tier)
          ? prev
          : { ...prev, credits: ent.credits, accountTier: ent.tier });
      },
    });
    sync.run('mount');
    const offAuth = subscribeAuthState(() => sync.run('auth'));
    const onVisible = () => { if (document.visibilityState === 'visible') sync.run('visible'); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      sync.dispose();
      offAuth();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [saveId, setGameState]);

  // Detect when food items are added to inventory
  const prevInventoryTotalRef = useRef(
    Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0)
  );
  useEffect(() => {
    const total = Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0);
    if (total > prevInventoryTotalRef.current) setNewItemsReady(true);
    prevInventoryTotalRef.current = total;
  }, [gameState.foodInventory]);

  useCareSystem({
    gameState,
    careEvent,
    setCareEvent,
    setMessageTrigger,
    setGameState,
    language,
    isSleeping,
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // TELEMETRIA (src/utils/telemetry.ts) — a fiação, e só ela.
  //
  // O módulo existia inteiro, testado, e nunca era chamado: zero evento saía de
  // um aparelho. Estes efeitos são os pontos de emissão. Regras que valem para
  // todos eles:
  //  · `track` NUNCA lança, nunca é `await`ado e nunca dispara com o app oculto
  //    (guard dentro do próprio módulo).
  //  · nenhum deles escreve no GameState — efeito em timer que grava estado
  //    vira spam de cloud save (CLAUDE.md, GameStateContext).
  //  · nenhum carrega texto do usuário: a allowlist do módulo só aceita número.
  // ═══════════════════════════════════════════════════════════════════════════

  /** Boot: `install` (dedupe de uma vez na vida é do módulo) + o flush
   *  oportunista de quando a aba morre — sem ele, o último passo do funil se
   *  perde justamente em quem abandona. */
  useEffect(() => {
    track('install');
    /* WP0.11 — de onde esta abertura veio. A marca é o `?src=` que o
       `sw.js` põe ao abrir pelo push (e que o widget/atalho podem usar); sem
       marca nenhuma, é abertura direta. Dedupe por dia E por origem, no
       módulo. Serve para UMA decisão: cortar push que traz gente e não vira
       dia ativo — comparar `app_open.1` com `day_active` responde isso, e
       nenhuma outra leitura é o propósito declarado desta métrica. */
    track('app_open', { source: openSourceFromUrl(window.location.search) });
    /* Lida, a origem sai da URL: o portão recarrega a página e um favorito
       com `?src=convite` reemitiria `invite` toda semana (review 07 §2). */
    limparOrigemDaUrl();
    /* WP0.2 — RETENÇÃO. Emitida NA ABERTURA e não no fechamento: o ledger
       semanal só despacha no dia seguinte, então quem abandona nunca despacha
       — viés aceitável para a métrica-norte e inaceitável justamente para
       retenção, que mede quem ficou contra quem foi embora.
       A data de instalação fica no aparelho e NUNCA é enviada (decisão D1/D2:
       ledger local, nada de id); o que sai é um inteiro de marco. */
    trackRetentionOnOpen();
    const stop = installTelemetryAutoFlush();
    return stop;
  }, []);

  /** `first_task_done`: a primeira conclusão REAL. Um ponto só, ancorado no
   *  popup que já é disparado pelos três handlers de conclusão — repetir a
   *  condição nos três seria regra copiada (footgun 9). */
  useEffect(() => {
    if (showFirstTaskPopup) track('first_task_done');
  }, [showFirstTaskPopup]);

  /** O TIER, declarado num lugar só (G-2). `setTelemetryTier` não emite nada:
   *  ele só diz ao módulo qual é o balde, e o módulo carimba todo evento que
   *  declara `tier`. Passar o tier em cada `track` seria a mesma regra escrita
   *  em seis call sites (footgun 9), e o call site que esquecesse não perderia
   *  o evento — mandaria ele para o balde errado, que é pior. */
  useEffect(() => {
    setTelemetryTier(gameState.accountTier ?? null);
  }, [gameState.accountTier]);

  /** O FECHAMENTO DO DIA — `day_active` e a métrica-norte, do MESMO fato.
   *
   *  A virada é o único momento em que o peso do dia está fechado
   *  (`lastDayReport`, computado por `computeDailyReset`); fora dela o número
   *  ainda ia crescer. `trackDayClosed` recebe os três dados desse fechamento e
   *  cuida do resto: emite `day_active` e vai somando, NO APARELHO, os dias
   *  ativos e os dias em que a meta foi batida — despachando `week_active`
   *  quando a semana vira. Ver o bloco "A MÉTRICA-NORTE" em `utils/telemetry.ts`.
   *
   *  `goalMet` compara com `report.required`, que É o `dailyGoalFor` DAQUELE dia
   *  daquela pessoa — a meta própria, e não um número fixo. `required <= 0`
   *  (ninguém cadastrou nada) não conta como meta batida: bater zero não é
   *  atingir objetivo nenhum, e contá-lo inflaria o numerador da métrica-norte
   *  justamente com os dias vazios.
   *
   *  A data vem de `report.date`, que é `toDateString()` (o formato do motor de
   *  hábitos); `telemetryDayKey` a converte para o ISO que a telemetria usa.
   *  Lê o relatório de FORA do updater do setGameState — efeito colateral
   *  dentro do updater roda 2× em StrictMode (footgun 6). */
  useEffect(() => {
    const report = gameState.lastDayReport;
    if (!report) return;
    const effort = Number(report.done ?? 0);
    const required = Number(report.required ?? 0);
    if (!Number.isFinite(effort)) return;
    const closed = new Date(report.date);
    if (Number.isNaN(closed.getTime())) return;
    trackDayClosed({
      day: telemetryDayKey(closed),
      effort,
      goalMet: Number.isFinite(required) && required > 0 && effort >= required,
    });
  }, [gameState.lastDayReport]);

  /**
   * O tier para efeito de REGRA. `accountTier` é opcional no save, e save antigo
   * chega sem ele — tratar `undefined` como `demo` apertaria, de uma atualização
   * para a outra, quem nunca escolheu o modo grátis. O módulo de monetização
   * falha ABERTO por decisão explícita (ver o comentário de `recordDemoCreation`
   * que existia lá: a regra AVISA, nunca bloqueia por acidente técnico), e esta
   * linha é a mesma decisão dita no ponto de uso. Não é trava de segurança — é
   * desenho de produto, 100% cliente.
   */
  const tierForRules: AccountTier = gameState.accountTier === 'demo' ? 'demo' : 'paid';
  /**
   * O TETO EFETIVO de hábitos ativos — o número que a UI mostra e o portão usa.
   *
   * Um só nome para os dois lados de propósito: mostrar o teto do ESTÁGIO a um
   * demo seria prometer uma vaga que o portão vai negar — a pessoa escreveria a
   * atividade inteira para o Salvar recusar no fim.
   */
  const activityCap = activityCapFor(tierForRules, gameState.maxActivityCap);

  /**
   * O PORTÃO DE CRIAÇÃO DE HÁBITO — ponto ÚNICO de escrita em `activities`.
   *
   * Antes de D-12 a regra do modo grátis morava numa prop do `CreateModal`, e o
   * `CreateModal` tinha um único ponto de abertura no app inteiro: o botão
   * principal da tela inicial, a IA do chat e o lote do tutorial criavam por
   * fora, sem consultar teto e sem contar nada. A regra existia e ninguém
   * passava por ela. Agora existe UMA porta, e `activityCreate.contract.test.ts`
   * fica vermelho para quem tentar cavar outra.
   *
   * Devolve quantos foram criados — o tutorial cria um LOTE, e o que não coube
   * precisa ser visível para quem chamou, nunca descartado em silêncio.
   *
   * ⚠️ O teto é decidido DUAS vezes, e isso é o conserto de X-6 (instância 3).
   * O `track` é efeito colateral e rodaria 2× no StrictMode dentro do updater
   * (footgun 6), então a contagem para telemetria e para o retorno continua
   * saindo de fora, contra `gameState.activities`. O que mudou é que ela não é
   * mais a ÚNICA: `fitHabitCreates` roda de novo sobre o `prev`, dentro do
   * updater, e é ele quem decide o que de fato entra na lista. Antes, duas
   * criações no mesmo lote do React (duplo submit, ou tutorial + clique) liam a
   * mesma contagem, ambas passavam, e a lista terminava acima de
   * `activityCapFor` — furando a fronteira de monetização do demo e o teto de
   * estágio do pagante. Nada disso quebrava o TypeScript.
   */
  const commitHabitCreate = useCallback((novos: Activity[], createPath: number): number => {
    const cabem = fitHabitCreates(
      { activities: gameState.activities, maxActivityCap: gameState.maxActivityCap },
      novos,
      tierForRules,
    );
    if (cabem.length === 0) {
      // `demo_cap_hit` (G-4) é o DENOMINADOR da pergunta "o teto é a fronteira
      // certa?": sem ele, o `unlock_view` de `task-limit` é um numerador sem
      // denominador. Só o demo conta — o pagante que bate no teto do estágio
      // dele não está encontrando uma fronteira de monetização, e somar os dois
      // daria a média de duas populações que nunca se encontram.
      if (tierForRules === 'demo') track('demo_cap_hit', { path: createPath });
      return 0;
    }
    setGameState(prev => ({
      ...prev,
      // O teto reconferido sobre o `prev`: a segunda criação do mesmo lote já
      // enxerga o que a primeira escreveu. É esta a linha que fecha X-6 aqui.
      activities: [
        ...prev.activities,
        ...fitHabitCreates(prev, cabem, tierForRules),
      ],
    }));
    for (let i = 0; i < cabem.length; i++) {
      // Um evento por atividade: o tutorial é o único caminho que cria várias de
      // uma vez, e contar o LOTE como 1 faria a soma dos caminhos nunca fechar.
      track('activity_create', {
        kind: TELEMETRY_ACTIVITY_KIND.habit,
        path: createPath,
      });
    }
    setMessageTrigger(prev => prev + 1);
    return cabem.length;
  }, [tierForRules, gameState.activities.length, gameState.maxActivityCap]);

  /**
   * O PORTÃO DE CRIAÇÃO DE TAREFA — ponto ÚNICO de escrita em `tasks`.
   *
   * Ele pergunta a `canCreateActivity` e a resposta é sempre sim. Isso é de
   * propósito, e a pergunta fica escrita: tarefa avulsa NÃO consome teto porque
   * é o uso espontâneo, o gerador da métrica-norte — no desenho antigo ela
   * custava a mesma cota de um hábito, e quem anotava "ligar pro médico"
   * gastava o orçamento inteiro do dia na coisa de menor valor. Passar pelo
   * portão mesmo assim é o que impede a regra de voltar a divergir entre as
   * duas listas sem ninguém perceber.
   *
   * `posicao` existe porque as duas listas do app já divergiam: a tela inicial
   * põe a tarefa nova no TOPO (é o que se acabou de decidir) e o `CreateModal`
   * põe no fim. Preservado como estava — não é assunto desta mudança.
   */
  const commitTaskCreate = useCallback((novo: Task, createPath: number, posicao: 'topo' | 'fim' = 'topo') => {
    if (!canCreateActivity({
      tier: tierForRules,
      kind: 'task',
      habitCount: gameState.activities.length,
      stageCap: gameState.maxActivityCap,
    })) return false;
    setGameState(prev => ({
      ...prev,
      tasks: posicao === 'topo' ? [novo, ...prev.tasks] : [...prev.tasks, novo],
    }));
    track('activity_create', {
      kind: TELEMETRY_ACTIVITY_KIND.task,
      path: createPath,
    });
    setMessageTrigger(prev => prev + 1);
    return true;
  }, [tierForRules, gameState.activities.length, gameState.maxActivityCap]);

  /**
   * `demo_cap_hit` quando a PAREDE APARECE, e não só quando o portão recusa.
   *
   * Os dois modais desabilitam o Salvar no teto — então, por eles, a recusa do
   * portão nunca chega a acontecer, e contar só ela zeraria o denominador
   * justamente nos dois caminhos onde o teto mais morde. Encontrar o teto é o
   * evento; ser recusado é só uma das formas de encontrá-lo.
   *
   * O `path` distingue os dois modais porque eles são convites diferentes: o
   * `create_modal` só abre a partir da tela de evolução, o `home_edit` é o botão
   * principal da tela inicial. Somá-los daria de novo a média de duas
   * populações — o defeito que o `funnel` já resolveu para o `onboarding_step`.
   */
  const atCapForDemo = tierForRules === 'demo' && gameState.activities.length >= activityCap;
  useEffect(() => {
    if (!atCapForDemo || !createModalOpen) return;
    track('demo_cap_hit', { path: TELEMETRY_CREATE_PATH.create_modal });
  }, [atCapForDemo, createModalOpen]);
  useEffect(() => {
    // `editingActivity` preenchido é EDIÇÃO: não encontra teto nenhum.
    if (!atCapForDemo || !editModalOpen || editingActivity) return;
    track('demo_cap_hit', { path: TELEMETRY_CREATE_PATH.home_edit });
  }, [atCapForDemo, editModalOpen, editingActivity]);

  /** `unlock_view` COM O MOTIVO (G-5). Vive aqui, e não no modal, porque é aqui
   *  que `unlockReason` existe — o modal recebia o motivo mas não tinha como
   *  saber o tier, e os dois convites (bati no teto × quero a criatura que é
   *  minha) testam hipóteses opostas sobre por que alguém paga. Somados, davam
   *  um número que não descreve nenhum dos dois.
   *
   *  Montar É ver: este modal nunca abre sozinho (ver o cabeçalho dele). */
  useEffect(() => {
    if (!unlockReason) return;
    track('unlock_view', { reason: unlockReasonCode(unlockReason) });
  }, [unlockReason]);

  // ═══════════════════════════════════════════════════════════════════════════
  // A FILA DE INTERSTICIAIS — UMA prioridade explícita, e só UM monta por vez.
  //
  // Esta é a regra que evita o próximo modal empilhado. LEIA antes de acrescentar
  // qualquer tela que se abra sozinha: ela entra AQUI, na ordem, e nunca com um
  // guard ad-hoc do tipo `x && !y`.
  //
  //   triagem → relatório diário → check-in → sonho → pesadelo → welcome prompt
  //
  // Por que a fila: todos esses modais são `position: fixed` no MESMO z-index
  // (200; o pesadelo em 210) e vários montam focus-trap próprio. Dois abertos ao
  // mesmo tempo davam três defeitos de uma vez — o de cima cobria o de baixo, que
  // ficava montado e inalcançável; um Escape fechava os DOIS; e o trap do de
  // baixo puxava o Tab para um diálogo invisível. Acontecia todo dia 1
  // (check-in × welcome prompt) e em qualquer manhã com noite registrada
  // (sonho × check-in). Havia um único guard escrito à mão (`nightmareOpen &&
  // !morningDream`), e ele cobria só um dos três pares.
  //
  // O que NÃO muda: quem está mais abaixo na fila continua com o estado
  // PENDENTE, e monta sozinho assim que o de cima fecha. Nada é descartado.
  //
  // A triagem vem primeiro por ser a única aberta por TOQUE do usuário — uma
  // ação explícita não pode ser engolida por um automático. O welcome prompt vem
  // por último porque é o único que decide sozinho se tem algo a dizer (ele
  // devolve `null` quando não tem), então não dá para consultá-lo daqui.
  //
  // ── A CONDIÇÃO DE ENTRADA (o que faltava na fila) ─────────────────────────
  // A fila só ordenava QUEM aparece antes de quem; ela nunca disse QUANDO um
  // item tem direito de entrar. O pedido de notificação (metade do welcome
  // prompt) entrava sempre, e numa carga limpa era a PRIMEIRA coisa da vida do
  // app: um diálogo de permissão sobre um produto que a pessoa ainda não usou,
  // com a tela inteira inerte atrás. Ordem certa, momento errado.
  //
  // O critério agora é: **o pedido de notificação só entra na fila depois de um
  // MOMENTO DE VALOR — a primeira conclusão do jogador (`jaConcluiuAlgo`:
  // qualquer tarefa avulsa, atividade recorrente ou hábito já concluído, algum
  // dia).** Escolhido em vez de "segunda sessão" por três motivos: (a) é
  // DERIVADO do save que já existe, sem chave nova de localStorage e sem
  // contador de sessões para sincronizar na nuvem; (b) amarra a permissão ao
  // que o lembrete de fato serve (quem nunca concluiu nada não tem o que ser
  // lembrado); (c) uma segunda sessão pode acontecer sem que nada de valor
  // tenha ocorrido — seria só adiar a mesma cobrança. O convite de INSTALAR a
  // PWA não muda: é oferta, não permissão do sistema, e não deixa o app inerte
  // esperando decisão de um prompt do navegador.
  //
  // Regra para quem acrescentar item novo: além da POSIÇÃO na ordem acima,
  // declare a CONDIÇÃO DE ENTRADA. Nenhum intersticial pede permissão de
  // sistema antes de o app ter entregado alguma coisa.
  // ═══════════════════════════════════════════════════════════════════════════
  // CAT-7 (docs/PERGUNTAS-DO-DONO.md) — o gatilho REAL do convite de nível de
  // um item do catálogo. Varre as atividades com `catalogId`, na ORDEM do
  // array (determinístico — não sorteia qual hábito "vence" quando dois
  // qualificam no mesmo dia), e para na primeira que `catalogLevelSignal`
  // sugerir algo. `lastCatalogLevelInviteDayKey` é o teto de **1 convite por
  // dia** (app inteiro, não por hábito) — checado ANTES de varrer, para não
  // fazer o trabalho à toa nem oferecer duas vezes no mesmo dia.
  const catalogLevelInviteCandidate = useMemo(
    () => pickCatalogLevelInviteCandidate(
      (gameState.activities ?? []) as any,
      gameState.habitRhythms,
      new Date(),
      (gameState as any).lastCatalogLevelInviteDayKey,
    ),
    [gameState.activities, gameState.habitRhythms, (gameState as any).lastCatalogLevelInviteDayKey],
  );

  // F3 do catálogo de atividades (docs/PLANO-CATALOGO-ATIVIDADES.md): o
  // convite de onboarding roda no MENOR grau de prioridade da fila — depois
  // de tudo que é ritual diário (relatório/check-in/sonho/pesadelo) ou pedido
  // explícito (triagem), porque é UMA VEZ SÓ. O convite de nível (CAT-7) vem
  // logo depois — também não é ritual diário, e o teto de 1/dia já garante
  // que ele não compete com nada todo santo dia.
  /* O BOSQUE DA GUILDA (WPG-8, fatia B1). `grove` é a memória DO APARELHO sobre o
     estágio da roda (`utils/groveLocal.ts`, fora do save); `useGroveWatch` a
     mantém e entrega os cenários `bg-guild-*` ao save (fora de updater — a
     entrega é idempotente). O marco pendente só vira intersticial depois de
     relatório e check-in e ANTES do sonho: é raro e descritivo, então cede a
     vez ao que a pessoa faz todo dia, mas não espera o adiável. */
  const grove = useGroveWatch({
    saveId,
    playerDayTz: gameState.playerDayTz,
    onScenes: useCallback((ids: string[]) => setGameState(prev => grantGroveScenes(prev, ids)), [setGameState]),
  });
  const grovePendente: GroveMarcoStage | null = grove?.pending && grove.pending.index >= CEREMONY_MIN_INDEX
    ? (groveStageAt(grove.pending.index) as GroveMarcoStage | null) : null;
  /* G8 (01/10/2026) — O CONVITE DO SONO. Condição de entrada: primeira
     abertura a partir do 2º dia de uso, uma vez só (`utils/restSetup.ts`).
     Posição: o ÚLTIMO antes de 'welcome' — é uma vez só como o catálogo, e
     cede a vez a tudo que é ritual diário. Não pede permissão de sistema. */
  const [restSetupShown, setRestSetupShown] = useState(() => readFlag(STORAGE_KEYS.REST_SETUP_SHOWN));
  const needsRestSetup = shouldShowRestSetup({
    shown: restSetupShown,
    bornAt: gameState.bornAt,
    todayKey: playerDayKey(new Date(), gameState.playerDayTz),
  });
  const closeRestSetup = useCallback(() => {
    writeFlag(STORAGE_KEYS.REST_SETUP_SHOWN, true, { silent: true });
    setRestSetupShown(true);
  }, []);
  const interstitial: 'triage' | 'dailyReport' | 'checkIn' | 'groveMilestone' | 'dream' | 'nightmare' | 'catalogOnboarding' | 'catalogLevelInvite' | 'restSetup' | 'welcome' =
    triageTasks ? 'triage'
      : showDailyReport && gameState.lastDayReport ? 'dailyReport'
        : checkInPlanData ? 'checkIn'
          : grovePendente ? 'groveMilestone'
          : morningDream ? 'dream'
            : nightmareOpen ? 'nightmare'
              : needsCatalogOnboarding(gameState as any) ? 'catalogOnboarding'
                : catalogLevelInviteCandidate ? 'catalogLevelInvite'
                  : needsRestSetup ? 'restSetup'
                    : 'welcome';

  const { dailyTotal, dailyDone, progress } = useProgressTracking(gameState);
  // Quantos itens de HOJE evitam a perda de coração na virada — regra única em
  // `utils/dailyReset.ts`, derivada da própria fórmula da perda.
  const hpSafeToday = tasksToAvoidHeartLoss(gameState, new Date().getDay(), new Date().toDateString());
  /* O FIO da Guilda vale a meta de CORAÇÃO (`heartGoalFor`, G1): a Guilda não pode
     cobrar mais do que o app cobra para não perder coração — dia parcial firma.
     `done`/`heart`/`full` são PESO de esforço, a mesma unidade de tudo acima; o
     servidor confere `done ≥ heart`. Nunca `dailyTotal` cru (que é a meta inteira). */
  const heartGoalHoje = heartGoalFor(gameState, new Date().getDay(), new Date().toDateString());
  const fioGoal = { done: dailyDone, heart: heartGoalHoje, full: dailyTotal };
  const fioMetaCumprida = dailyTotal > 0 && dailyDone >= heartGoalHoje;
  const minhaCriaturaUrl = displaySprite(spriteAcervo, gameState.evolutionStage)?.url
    ?? getSpriteForStage(gameState.evolutionStage, petLine);
  /* O selo "Dia completo" da lista (minimal-ui F2). A condição é a da VIRADA —
     `completeDayReached`, a mesma função que `computeDailyReset` usa para
     contar o dia — aplicada ao dia de hoje: meta inteira feita, ≥1 cadastrada
     e energia ≥ meta. Se a tela e a virada lessem réguas diferentes, o selo
     prometeria um dia que a virada não conta. */
  const diaCompletoHoje = completeDayReached({
    registered: registeredForDay(gameState as any, new Date().getDay(), new Date().toDateString()),
    goal: dailyTotal,
    done: dailyDone,
    energy: gameState.energyPoints ?? 0,
  });

  /**
   * "O jogador já concluiu ALGUMA coisa, algum dia?"
   *
   * Derivado do estado que já existe, sem campo novo: `activityStats` guarda
   * `completionCount` acumulado por hábito (nunca zerado), `completedTasks`
   * guarda as tarefas avulsas e `activityLog` guarda as conclusões recorrentes.
   * Usado pelo card de BRINCAR — ver o comentário no ponto de render.
   */
  const jaConcluiuAlgo = useMemo(
    () => (gameState.completedTasks?.length ?? 0) > 0
      || (gameState.activityLog?.length ?? 0) > 0
      || Object.values(gameState.activityStats ?? {}).some(s => (s?.completionCount ?? 0) > 0),
    [gameState.completedTasks, gameState.activityLog, gameState.activityStats],
  );

  const t = useTranslation(language);

  // Detect a digivolution (level up) to show the task-goal modal. We track the
  // previous stage LEVEL so branch swaps at the same level don't trigger it, and
  // degeneration (level down) never does. FORM_REQUIREMENTS.required increases
  // monotonically per level, so a higher requirement means a higher stage.
  const prevStageLevelRef = useRef(getStageLevel(gameState.evolutionStage));
  useEffect(() => {
    const currentLevel = getStageLevel(gameState.evolutionStage);
    const prevLevel = prevStageLevelRef.current;
    if (currentLevel !== prevLevel) {
      const leveledUp =
        FORM_REQUIREMENTS[currentLevel].required > FORM_REQUIREMENTS[prevLevel].required;
      prevStageLevelRef.current = currentLevel;
      if (leveledUp) setEvolveModalStage(gameState.evolutionStage);
    }
  }, [gameState.evolutionStage]);

  // Sync game state to Android home screen widget
  useEffect(() => {
    SoulmonWidget.updateWidgetData({
      /* ⚠️ Este campo se chamava `digimonName`, e o comentário aqui dizia que
         ele NÃO era renomeado de propósito, "porque o APK instalado lê
         `digimonName` no Kotlin e trocar quebraria o widget de quem não
         atualizasse". Não havia APK instalado: ninguém nunca usou o app em
         produção (07/09/2026). O Kotlin foi renomeado junto (`pet_name`), e o
         widget exige APK novo de qualquer forma. */
      // O nome da Home, não o estágio — dono: `widgetPetName` (utils/petName por baixo).
      petName: widgetPetName(gameState.soulmonMeta),
      currentStage: gameState.evolutionStage,
      eggType: gameState.eggType ?? 'ignar',
      branchType: gameState.currentBranch,
      completedTasks: dailyDone,
      totalTasks: dailyTotal,
      hp: Math.round((gameState.healthPoints / gameState.maxHealthPoints) * 100),
      healthPoints: Math.floor(gameState.healthPoints),
      maxHealthPoints: gameState.maxHealthPoints,
      energyPoints: gameState.energyPoints ?? 0,
      hasPoop: (gameState.poopEventsShown || []).some(i => !(gameState.poopEventsCompleted || []).includes(i)),
      /* WP2.6 — o widget passa a saber de HÁBITO. Ele mostrava só tarefas do
         dia, HP e energia: o motor de constância, a peça mais central do
         produto, era invisível na única superfície que a pessoa vê sem abrir
         o app. Chaves ACRESCENTADAS, nunca renomeadas. */
      ...(() => {
        const agora = new Date();
        const ritmos = gameState.habitRhythms ?? {};
        const devidos = Object.values(ritmos).map(r => constancy(r, agora)).filter(c => c.window > 0);
        const media = devidos.length
          ? devidos.reduce((soma, c) => soma + c.ratio, 0) / devidos.length
          : null;
        const marco = Object.values(ritmos).reduce((max, r) => {
          const t = habitTier(r.totalDone ?? 0);
          return Math.max(max, t === 'tree' ? 3 : t === 'sapling' ? 2 : t === 'sprout' ? 1 : 0);
        }, 0);
        return {
          // Vai uma FAIXA, nunca o percentual — ver o cabeçalho de
          // `SoulmonWidgetData.habitSteady`. `null` (sem histórico) vira ausência
          // do campo, que é diferente de "não está firme": 0% para quem ainda
          // não tem histórico é a mesma mentira que a constância dotada evita.
          ...(media === null ? {} : { habitSteady: media >= GOOD_CONSTANCY_RATIO }),
          habitTierMax: marco,
          needsIntervention: Object.values(ritmos).some(r => needsIntervention(r, agora)),
        };
      })(),
      // 29/09/2026 (decisão do dono): a linha de arte (só o corvinho) e o nome
      // do estágio do Bosque que ESTE aparelho viu (`groveLocal`, fora do save).
      // Vazio = o plugin remove a chave. Sem timer: roda quando `grove` muda.
      petLine: widgetPetLine(gameState),
      groveStage: widgetGroveStage(grove),
    }).catch(() => {});
  }, [gameState.evolutionStage, gameState.currentBranch, gameState.eggType,
      gameState.healthPoints, gameState.maxHealthPoints, gameState.energyPoints,
      gameState.poopEventsShown, gameState.poopEventsCompleted, dailyDone, dailyTotal,
      gameState.habitRhythms, gameState.totalXP, gameState.soulmonMeta, grove]);

  /**
   * A fatia que `utils/petNeeds.ts` lê. `hasPoop` é DERIVADO (o dono do cocô é
   * o sistema de cuidado), e o resto vem do save como está.
   */
  const petNeedsView = {
    ...gameState,
    hasPoop: (gameState.poopEventsShown || []).some(
      i => !(gameState.poopEventsCompleted || []).includes(i),
    ),
  };

  /**
   * CANSAÇO DERIVADO — e ele é **só cosmético/narrativo**.
   *
   * Nunca reduz recompensa, nunca trava ação, nunca entra em dia perfeito, HP
   * ou evolução: quem aparece 'tired' é exatamente quem trabalhou demais ou
   * dormiu fora de hora, e cobrar dessa pessoa seria punir quem mais precisa de
   * acolhimento. O pet sonolento existe para o dono se VER, não para pagar.
   */
  const tirednessLevel = tiredness(petNeedsView, new Date());

  // Determine companion mood based on progress
  const getCompanionMood = (): 'idle' | 'happy' | 'tired' => {
    // Sonolento é EXPRESSÃO, não estado de jogo — só muda a carinha.
    if (tirednessLevel === 'tired') return 'tired';
    if (progress >= 60) return 'happy'; // Fica feliz mais fácil
    if (progress <= 15) return 'tired'; // Só fica cansado se MUITO baixo (antes era 30%)
    return 'idle';
  };

  // Get companion message based on progress and HP
  /**
   * WP2.12 — os três focos do dia foram concluídos?
   *
   * `useMemo` e não estado: é uma LEITURA do que já está no save, e guardar a
   * resposta criaria uma segunda fonte para um fato derivável — o mesmo erro
   * que `bondLevel` evita (footgun 9). Some sozinho na virada porque o
   * `dayKey` muda; nada a limpar, nada a expirar.
   */
  /**
   * WP3.2 — há tarefa assombrada AGORA? É isto que faz o pet virar o olhar.
   *
   * `useMemo` sobre a lista, e não um efeito com timer: a assombração muda de
   * estado no máximo uma vez por dia (é idade em dias), então recalcular a
   * cada render da lista é mais barato e mais correto que um relógio.
   */
  const hauntedWatching = useMemo(
    () => (gameState.tasks ?? []).some(t => isActive(t) && isHaunted(t, new Date())),
    [gameState.tasks],
  );

  const focoDoDiaCompleto = useMemo(
    () => focusComplete(
      gameState.tasks, gameState.completedTasks,
      playerDayKey(new Date(), gameState.playerDayTz),
    ),
    [gameState.tasks, gameState.completedTasks, gameState.playerDayTz],
  );

  const getCompanionMessage = (): string => {
    if (gameState.healthPoints <= 1) {
      return t.main.companionNeedHelp;
    }
    // UMA sugestão de cada vez (`needsAttention` devolve no máximo um item) —
    // nunca um painel de pendências, que é a fatura do Habitica. Nenhuma delas
    // tem contador nem vira penalidade se for ignorada.
    const wish = needsAttention(petNeedsView, new Date())[0];
    if (wish) return language === 'pt-BR' ? wish.pt : wish.en;
    // Sem nada a sugerir, o pet fala do próprio sono. 'tired' é cumplicidade
    // ("a gente descansa junto"), nunca diagnóstico.
    if (tirednessLevel !== 'normal') return tirednessMessage(tirednessLevel, language);
    if (progress >= 70) return t.main.companionAmazing;
    if (progress >= 40) return t.main.companionGoodProgress;
    if (progress >= 20) return t.main.companionYouGotThis;
    return t.main.companionBelieve;
  };

  // Get current day
  const getCurrentDay = () => {
    const days = [
      t.main.daySunday,
      t.main.dayMonday,
      t.main.dayTuesday,
      t.main.dayWednesday,
      t.main.dayThursday,
      t.main.dayFriday,
      t.main.daySaturday,
    ];
    return days[new Date().getDay()];
  };

  // Nome de exibição de uma forma: procura na árvore ÚNICA do jogador
  // (gameState.soulmonStages, gerada pelo oráculo no onboarding). Sem árvore
  // ainda (save antigo/reset) cai pro nível capitalizado como fallback seguro.
  const getStageNameById = (stageId: string): string => {
    const match = gameState.soulmonStages?.find(s => creatureFormId(s) === stageId);
    if (match) return match.name;
    return stageId.charAt(0).toUpperCase() + stageId.slice(1);
  };

  const getCurrentStageName = (): string => getStageNameById(gameState.evolutionStage);

  const getDominantBranch = (): 'power' | 'harmony' | 'benevolence' | 'balanced' => {
    const { powerPoints, harmonyPoints, benevolencePoints } = gameState;
    const total = powerPoints + harmonyPoints + benevolencePoints;

    if (total === 0) return 'balanced';

    const max = Math.max(powerPoints, harmonyPoints, benevolencePoints);
    if (powerPoints === max && powerPoints > harmonyPoints && powerPoints > benevolencePoints) return 'power';
    if (harmonyPoints === max && harmonyPoints > powerPoints && harmonyPoints > benevolencePoints) return 'harmony';
    if (benevolencePoints === max && benevolencePoints > powerPoints && benevolencePoints > harmonyPoints) return 'benevolence';
    return 'balanced';
  };

  // Limiar de XP do próximo nível. O switch anterior listava espécies que não
  // existem mais na árvore (a árvore nasce em rookie e os ids carregam o nível
  // no prefixo), então TODO estágio caía no default — a barra mostrava sempre o
  // mesmo alvo. Agora o alvo sai do nível de verdade.
  const getNextLevelXP = (): number => {
    const level = getStageLevel(gameState.evolutionStage);
    return XP_BY_LEVEL[level];
  };

  /**
   * Celebra o marco de maturidade do hábito, se esta conclusão cruzou um.
   *
   * Os cortes são 7/21/66 dias EFETIVOS (Lally et al., 2010 — mediana real de
   * 66 dias até a automaticidade), não os "21 dias" populares, que vêm de um
   * cirurgião plástico de 1960. `milestoneReached` só responde uma vez por
   * corte, então a festa não repete a cada reload.
   */
  const celebrateHabitMilestone = useCallback((activityId: string, name: string, todayKey: string) => {
    const tier = habitMilestoneOf(gameState, activityId, todayKey);
    if (!tier) {
      // WP2.13 — não é marco, mas pode ser um dos dias em que o pet comenta.
      // Sem toast e sem som: é só uma fala, e o valor dela é ser só isso.
      if (habitCheerOf(gameState, activityId, todayKey)) falar('cheer');
      return;
    }
    const text = MILESTONE_TEXT[tier];
    if (!text) return;
    playEvolve();
    // WP3.2: o marco ganhou fala PRÓPRIA. O `setMessageTrigger` genérico
    // repetia a fala de humor do momento, que não tem nada a ver com o marco.
    falar('milestone');
    /* WP2.4 — a CERIMÔNIA. Cruzar 7/21/66 dias era um som, um toast e uma
       fala: três coisas que o app faz o tempo todo por qualquer motivo, ou
       seja, o momento mais raro da constância era indistinguível de concluir
       uma tarefa.
       ⚠️ Em movimento reduzido isto CAÍA para o `toast.success` de sempre — o
       mesmo de concluir qualquer tarefa. Entregava MENOS cerimônia justamente
       a quem tem mais chance de precisar de acessibilidade, e o que se reduz é
       o MOVIMENTO, nunca a pausa (auditoria de 06/09/2026). A cerimônia é a
       mesma; a flag só desliga as animações e o háptico. */
    const movimentoReduzido = typeof window !== 'undefined'
      && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setMilestoneCeremony({
      tier,
      habitName: name,
      text: language === 'pt-BR' ? text.pt : text.en,
      // A data do marco: marco é permanente, e a data é o que o torna memória
      // em vez de notificação.
      dateLabel: new Date().toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
      reducedMotion: movimentoReduzido,
    });
  }, [gameState, language, falar]);

  const handleUpdateStep = (activityId: string, stepId: string) => {
    const activity = gameState.activities.find(a => a.id === activityId);
    const step = activity?.steps.find(s => s.id === stepId);

    // Completed steps cannot be unchecked — only daily reset restores them
    if (step?.completed) return;

    // Esta etapa fecha a atividade? Calculado FORA do updater, para o resumo de
    // ganhos não depender de ler estado de dentro dele (StrictMode roda o
    // updater 2×).
    const justFinishedActivity =
      activity && activity.steps.every(s => s.completed || s.id === stepId) ? activity : null;

    // Allow checking without confirmation
    setGameState(prev => {
        const updatedActivities = prev.activities.map(act =>
          act.id === activityId
            ? {
              ...act,
              steps: act.steps.map(s =>
                s.id === stepId ? { ...s, completed: true } : s
              ),
            }
            : act
        );

        // Check if activity is now fully completed
        const updatedActivity = updatedActivities.find(a => a.id === activityId);
        const isFullyCompleted = updatedActivity?.steps.every(s => s.completed);

        // Update activity stats if fully completed
        let newActivityStats = prev.activityStats;
        if (isFullyCompleted && updatedActivity) {
          const activityKey = `activity-${updatedActivity.id}`;
          const currentStats = prev.activityStats[activityKey] || {
            name: updatedActivity.name,
            emoji: updatedActivity.emoji,
            category: updatedActivity.category,
            completionCount: 0,
          };

          newActivityStats = {
            ...prev.activityStats,
            [activityKey]: {
              ...currentStats,
              completionCount: currentStats.completionCount + 1,
            },
          };
        }

        // Concluir a última etapa rende a comida da categoria. (Ramo morto de
        // "estágio inicial ganha energia" removido — a árvore nasce em rookie.)
        let newFoodInventory = prev.foodInventory;
        let newActivityLog = prev.activityLog ?? [];
        if (isFullyCompleted && updatedActivity) {
          const food = FOOD_BY_CATEGORY[updatedActivity.category as keyof typeof FOOD_BY_CATEGORY];
          if (food) {
            newFoodInventory = {
              ...prev.foodInventory,
              [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
            };
          }
          newActivityLog = [...newActivityLog, new Date().toISOString()].slice(-ACTIVITY_LOG_CAP);
        }

        const next: GameState = {
          ...prev,
          activities: updatedActivities,
          activityStats: newActivityStats,
          foodInventory: newFoodInventory,
          activityLog: newActivityLog,
        };

        // Um hábito de etapas fecha na ÚLTIMA etapa — a constância dele precisa
        // ser alimentada aqui também, senão só os hábitos sem etapas contariam.
        return isFullyCompleted && updatedActivity
          ? withHabitCompletion(
            next, activityId, updatedActivity.category,
            new Date().toDateString(), playerDayKey(new Date(), prev.playerDayTz),
          )
          : next;
      });

      playTaskComplete();
      if (justFinishedActivity) {
        queueTaskGains(justFinishedActivity.category);
        // ↩️ #57 — a última etapa FECHA o hábito, então ela também abre a
        // janela de desfazer. Sem isto, hábito com etapas seria a metade do
        // app onde o toque errado continua sem volta.
        ofereceDesfazer(gameState, justFinishedActivity.name);
        celebrateHabitMilestone(
          justFinishedActivity.id, justFinishedActivity.name, new Date().toDateString(),
        );
        // Selo de "verificado": o hábito de saúde JÁ contou; os passos só
        // confirmam e rendem uma comida a mais. Sem sensor, nada muda.
        grantStepsVerified(justFinishedActivity.category);
      }

      // Check if this is the first task/step ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        // Check if ANY step has been completed before this one
        const anyStepCompleted = gameState.activities.some(a =>
          a.steps.some(s => s.completed && s.id !== stepId)
        ) || gameState.tasks.some(t => t.completed);

        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
        }
      }

      // NÃO limpa o cocô. Quem limpa é o 🚿 BANHO — está assim na tabela de
      // regras e é a única leitura possível para o jogador. Aqui havia um
      // `if (careEvent) handleCareEventComplete()`, herança de quando existiam
      // eventos de comida atrelados a tarefa (`CareEvent.type` ainda declara
      // 'food', mas nada produz esse tipo e `handleCareEventComplete` já o
      // ignora): na prática, marcar QUALQUER tarefa desligava o dreno de −1
      // coração/6h sem o pet ter tomado banho nenhum.
  };

  // Handler para atividades sem etapas
  const handleToggleActivityCompletion = (activityId: string) => {
    const today = new Date().toDateString();
    const activity = gameState.activities.find(a => a.id === activityId);
    // Completed activities cannot be unchecked — only daily reset restores them
    if (activity?.completedToday && activity?.lastCompletedDate === today) return;

    setGameState(prev => {
      const activity = prev.activities.find(a => a.id === activityId);
      if (!activity) return prev;

      const isCurrentlyCompleted = activity.completedToday && activity.lastCompletedDate === today;
      const newCompletedState = !isCurrentlyCompleted;

      const updatedActivities = prev.activities.map(act =>
        act.id === activityId
          ? {
            ...act,
            completedToday: newCompletedState,
            lastCompletedDate: newCompletedState ? today : act.lastCompletedDate,
          }
          : act
      );

      // Update activity stats if completing
      let newActivityStats = prev.activityStats;
      if (newCompletedState && activity) {
        const activityKey = `activity-${activity.id}`;
        const currentStats = prev.activityStats[activityKey] || {
          name: activity.name,
          emoji: activity.emoji,
          category: activity.category,
          completionCount: 0,
        };

        newActivityStats = {
          ...prev.activityStats,
          [activityKey]: {
            ...currentStats,
            completionCount: currentStats.completionCount + 1,
          },
        };
      }

      // Concluir atividade rende a comida da categoria. (O ramo antigo de
      // "estágio inicial ganha energia direto" saiu: a árvore nasce em rookie,
      // então getStageLevel nunca devolvia os estágios de ovo/bebê e ele era inalcançável
      // — o mesmo ramo morto que já tinha sido removido do caminho das tarefas.)
      let newFoodInventory = prev.foodInventory;
      let newActivityLog = prev.activityLog ?? [];
      if (newCompletedState && activity) {
        const food = FOOD_BY_CATEGORY[activity.category as keyof typeof FOOD_BY_CATEGORY];
        if (food) {
          newFoodInventory = {
            ...prev.foodInventory,
            [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
          };
        }
        // Registra a conclusão para o ritmo de cuidado enxergar atividades —
        // `completedTasks` só recebe tarefas avulsas, e `lastCompletedDate`
        // some na virada do dia.
        newActivityLog = [...newActivityLog, new Date().toISOString()].slice(-ACTIVITY_LOG_CAP);
      }

      const next: GameState = {
        ...prev,
        activities: updatedActivities,
        activityStats: newActivityStats,
        foodInventory: newFoodInventory,
        activityLog: newActivityLog,
      };

      // A constância do hábito é alimentada NO MESMO DIA (ver
      // `withHabitCompletion`), e não só na virada — senão marcar o hábito não
      // move nada visível até depois da meia-noite.
      return newCompletedState
        ? withHabitCompletion(
          next, activityId, activity.category, today,
          playerDayKey(new Date(), prev.playerDayTz),
        )
        : next;
    });

    // Mesmo resumo das tarefas: uma ação, várias barras. Fora do updater porque
    // efeito colateral dentro de setGameState roda 2× no StrictMode.
    if (activity) queueTaskGains(activity.category);

    // ↩️ #57 — a janela de 5 s. `gameState` aqui é o estado ANTES do updater
    // acima (o React só o troca no próximo render), que é exatamente a foto
    // que a reversão precisa.
    if (activity && !(activity.completedToday && activity.lastCompletedDate === today)) {
      ofereceDesfazer(gameState, activity.name);
    }

    // Marco de maturidade (7/21/66 dias de Lally et al.) — celebra UMA vez, no
    // dia em que o corte é cruzado. Fora do updater pelo mesmo motivo.
    if (activity && !(activity.completedToday && activity.lastCompletedDate === today)) {
      celebrateHabitMilestone(activity.id, activity.name, today);
      // Ver `grantStepsVerified`: confirmação, nunca pontuação.
      grantStepsVerified(activity.category);
    }

    // Check if this is the first task ever completed and show popup
    if (!hasShownFirstTaskPopup) {
      const anyTaskCompleted = gameState.activities.some(a =>
        a.steps.some(s => s.completed)
      ) || gameState.tasks.some(t => t.completed);

      if (!anyTaskCompleted) {
        setShowFirstTaskPopup(true);
        setHasShownFirstTaskPopup(true);
        writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
      }
    }

    // Sem limpeza de cocô aqui — ver o comentário no handler de etapas: o dreno
    // só para com o 🚿 BANHO.
  };

  /** Abre o modal de Créditos (linha do menu da nav). Identidade estável em
   *  vez de lambda inline na prop — mesma disciplina do CompanionHUD. */
  const openCredits = useCallback(() => setCreditsOpen(true), []);

  const handleEditActivity = useCallback((activityId: string) => {
    setEditingActivity(activityId);
    setEditModalOpen(true);
  }, []);

  /**
   * Salva um hábito vindo do `EditModal`.
   *
   * `schedule` e `anchor` são REPASSADOS, e isso é o conserto principal daqui:
   * o modal já perguntava "3× por semana" e "depois do café da manhã", e este
   * handler montava o objeto campo a campo e jogava as respostas fora — o
   * usuário respondia e o app esquecia. `weekDays` continua sendo escrito ao
   * lado de `schedule` porque o widget Android e o app de desktop leem ELE, e
   * nenhum dos dois carrega o motor de recorrência novo.
   */
  const handleSaveActivity = (data: {
    name: string; category: string; emoji: string; steps: Step[];
    weekDays?: number[]; alarm?: { time: string };
    schedule?: Schedule; anchor?: HabitAnchor;
  }) => {
    if (editingActivity) {
      setGameState(prev => ({
        ...prev,
        activities: prev.activities.map(activity =>
          activity.id === editingActivity
            ? {
              ...activity,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              steps: data.steps,
              ...(data.weekDays ? { weekDays: data.weekDays } : {}),
              ...(data.alarm !== undefined ? { alarm: data.alarm } : {}),
              ...(data.schedule ? { schedule: data.schedule } : {}),
              ...(data.anchor !== undefined ? { anchor: data.anchor } : {}),
            }
            : activity
        ),
      }));
    } else {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        steps: data.steps,
        weekDays: data.weekDays ?? [0, 1, 2, 3, 4, 5, 6], // Available all days by default
        alarm: data.alarm,
        schedule: data.schedule,
        anchor: data.anchor,
      };
      // Este e o caminho PRINCIPAL de criacao da tela inicial — e era por ele
      // que o teto do modo gratis vazava inteiro (D-12). Agora ele entra pela
      // mesma porta que todos os outros. A bolha de fala e o evento vivem
      // DENTRO do portao: um caminho que cria sem contar volta a ser invisivel
      // no agregado, que foi como o vazamento durou tanto.
      commitHabitCreate([newActivity], TELEMETRY_CREATE_PATH.home_edit);
    }
    setEditingActivity(null);
  };

  const handleDeleteActivity = useCallback((activityId: string) => {
    setGameState(prev => ({
      ...prev,
      activities: prev.activities.filter(activity => activity.id !== activityId),
    }));
    setEditModalOpen(false);
    setEditingActivity(null);
  }, []);

  const handleAICreateActivity = useCallback((activity: {
    name: string;
    category: string;
    points: { power: number; harmony: number; benevolence: number };
  }) => {
    if (import.meta.env.DEV) console.log('AI creating activity:', activity);

    const category = AI_CATEGORY_MAP[activity.category] || 'Study';
    const emoji = CATEGORY_EMOJIS[category] || '✨';

    // Create auto-generated steps based on category and points
    const steps: Step[] = [
      {
        id: `${Date.now()}-1`,
        label: `Complete ${activity.name}`,
        completed: false
      }
    ];

    // Create the activity with custom points. `schedule` nasce junto de
    // `weekDays` (os dois dizendo a mesma coisa): um hábito criado pela IA sem
    // o campo novo cairia no `normalizeSchedule` de save antigo — funciona,
    // mas a lista mostraria "todo dia" sem que ninguém tenha decidido isso.
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: activity.name,
      category,
      emoji,
      steps,
      weekDays: [0, 1, 2, 3, 4, 5, 6], // Available all days by default
      schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] },
    };

    // Criar pela IA nao e um privilegio: o portao vale igual (D-12).
    const criadas = commitHabitCreate([newActivity], TELEMETRY_CREATE_PATH.ai_chat);

    if (import.meta.env.DEV) {
      console.log(criadas ? 'Activity created successfully:' : 'Activity refused by cap:', newActivity);
    }
  }, [commitHabitCreate]);

  /**
   * Salva uma tarefa vinda do `TaskEditModal` (criação e edição).
   *
   * Os campos do contrato de EXECUÇÃO são repassados inteiros:
   *  - `effort` — a recompensa e a meta do dia escalam com ELE, nunca com a
   *    contagem de itens (é o defeito do Karma do Todoist);
   *  - `startDate` — o "When" do Things 3, separado do prazo: só ele traz a
   *    tarefa para o Hoje;
   *  - `createdAt`/`lastTouchedAt` — a idade da tarefa, que é o que `isHaunted`
   *    lê. Sem eles `daysStale` responde 0 e a tarefa nunca envelhece;
   *  - `status: 'open'` — o padrão explícito de uma tarefa viva.
   *
   * Na EDIÇÃO, `lastTouchedAt` anda: mexer na tarefa é uma decisão real sobre
   * ela, então ela não deve continuar assombrando por tempo parado.
   */
  const handleSaveTask = (data: {
    name: string; category: string; emoji: string;
    steps?: Step[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    effort?: Effort; startDate?: string; lastTouchedAt?: string;
  }) => {
    const nowIso = new Date().toISOString();
    if (editingTask) {
      // Editing existing task
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === editingTask
            ? {
              ...task,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              steps: data.steps,
              deadline: data.deadline,
              alarm: data.alarm,
              effort: data.effort ?? task.effort,
              startDate: data.startDate,
              createdAt: task.createdAt ?? nowIso,
              lastTouchedAt: data.lastTouchedAt ?? nowIso,
            }
            : task
        ),
      }));
    } else {
      // Creating new task
      const newTask: Task = {
        id: Date.now().toString(),
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        completed: false,
        steps: data.steps,
        deadline: data.deadline,
        alarm: data.alarm,
        effort: data.effort,
        startDate: data.startDate,
        status: 'open',
        createdAt: nowIso,
        lastTouchedAt: data.lastTouchedAt ?? nowIso,
      };
      // Quarto caminho de criacao, e ele nao emitia evento NENHUM: a tarefa
      // criada pela tela inicial nao existia no agregado. Pelo portao ela passa
      // a contar — e segue sem consumir teto, que e a decisao de D-12.
      commitTaskCreate(newTask, TELEMETRY_CREATE_PATH.home_edit, 'topo');
    }

    if (editingTask) setMessageTrigger(prev => prev + 1);
    setEditingTask(null);
  };

  // Handle toggling task completion
  const handleToggleTask = (taskId: string) => {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return; // completed tasks cannot be unchecked

    if (!task.completed) {
      playTaskComplete();

      /**
       * BÔNUS DE ALÍVIO — concluir uma tarefa ASSOMBRADA (vencida ou parada há
       * 7 dias, `isHaunted`) comemora mais alto e rende uma comida extra.
       *
       * É a peça mais Soulmon do plano: a pilha de atrasadas é a causa nº1
       * documentada de abandono da categoria, e em vez de pintá-la de vermelho
       * e cobrar, ela vira o conteúdo com a MAIOR recompensa do laço. Nada de
       * moeda nova nem regra nova — a recompensa é o alívio (fala + animação
       * que o app já tem) mais uma comida, que é exatamente o que concluir uma
       * tarefa já dá.
       *
       * Calculado FORA do updater: efeito colateral dentro de setGameState roda
       * 2× no StrictMode (footgun 6) e daria comida em dobro.
       */
      const relief = isHaunted(task, new Date());
      // WP0.13: o numerador de "a pilha de culpa virou loop de jogo?". Aqui,
      // FORA do updater (footgun 6), e sem nada da tarefa — só o fato.
      if (relief) track('haunted_done');
      if (relief) contarMissao('haunted-done');

      // Mark task as completed first
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      }));

      if (relief) {
        const food = FOOD_BY_CATEGORY[task.category];
        if (food) {
          setGameState(prev => ({
            ...prev,
            foodInventory: {
              ...prev.foodInventory,
              [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
            },
          }));
          setFeedAnim(prev => ({ emoji: food.emoji, n: (prev?.n ?? 0) + 1 }));
        }
        // O mesmo caminho de fala do resto do app — o pet reage, não um banner.
        setMessageTrigger(prev => prev + 1);
        toast(language === 'pt-BR'
          ? '👻 Você enfrentou uma tarefa assombrada! Seu Soulmon comemorou (e ganhou comida extra).'
          : '👻 You faced a haunted task! Your Soulmon cheered (and got extra food).');
      }

      // Check if this is the first task ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        const anyStepCompleted = gameState.activities.some(a =>
          a.steps.some(s => s.completed)
        ) || gameState.tasks.some(t => t.completed && t.id !== taskId);

        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
        }
      }

      // Depois de 3s: sai da lista, entra no histórico e vira comida. A
      // transição toda mora em utils/careRules.ts — o app de desktop marca
      // tarefa exatamente igual, e duas implementações divergiriam.
      //
      // (O ramo antigo de "estágio inicial dá energia em vez de comida" saiu:
      // a árvore do Soulmon não tem mais ovo/baby, então getStageLevel nunca
      // devolvia esses níveis e o ramo era inalcançável.)
      setTimeout(() => {
        let concluiu = false;
        setGameState(prev => {
          const feito = completeTask(prev, taskId) ?? prev;
          // 🔗 Vínculo: a tarefa rende XP pelo PESO DE ESFORÇO dela (`effortOf`),
          // nunca por contagem de itens — é a mesma unidade da meta do dia. Se
          // rendesse por item, cadastrar cinco triviais valeria mais que encarar
          // a difícil, que é o defeito documentado do Karma do Todoist.
          //
          // Só rende se a conclusão ACONTECEU (`completeTask` devolve o mesmo
          // objeto quando não há o que fazer): tocar duas vezes não paga duas.
          const next = feito === prev ? prev : awardBondXP(
            feito,
            { kind: 'completion', weight: effortOf(task) },
            playerDayKey(new Date(), prev.playerDayTz),
          );
          // Nada de `queueMicrotask` DENTRO do updater (footgun 6: StrictMode
          // invoca 2× e o toast saía dobrado). A flag é idempotente; quem
          // dispara é a linha depois do updater.
          concluiu = next !== prev;
          return next;
        });
        // Microtask: React 18 agenda o flush do lote num microtask criado no
        // primeiro `setState`, então este roda DEPOIS do updater acima.
        queueMicrotask(() => {
          if (!concluiu) return;
          queueTaskGains(task.category);
          // A assombrada tem fala PRÓPRIA, e é de alívio. Concluir a que
          // estava te olhando não pode soar igual a concluir qualquer uma —
          // é a peça que transforma a pilha de culpa em recompensa.
          /* WP2.14 — a fala RARA (~5%), que não vale NADA e não é anunciada
             em lugar nenhum: sem contador, sem "raro!", sem coleção. Uma
             surpresa com medidor deixa de ser surpresa e vira mais uma barra
             para encher. A assombrada tem fala própria e vence o sorteio —
             o alívio dela é mais específico que uma frase bonita. */
          const assombrada = isHaunted(task, new Date());
          falar(assombrada ? 'haunted' : rolledRareCheer(Math.random()) ? 'rare' : 'task');
          marcarGestoDoDia('task');
        });
      }, 3000);
    }
  };

  /**
   * "Uma ação, várias barras": concluir UMA tarefa avança várias coisas ao mesmo
   * tempo, e o jogador precisa VER isso num lugar só. É o que faz um km no
   * Pokémon GO valer a pena — ele avança ovo, companheiro, missão e recompensa
   * semanal de uma vez, e o jogo mostra tudo junto.
   *
   * Fica fora do updater de propósito: efeito colateral dentro de setGameState
   * roda 2× no StrictMode (footgun 6).
   */
  /**
   * O toast NÃO reconta mais nada.
   *
   * Ele reimplementava a contagem e divergia em três frentes ao mesmo tempo:
   *  · comparava CONTAGEM DE ITENS contra `dailyGoalFor`, que é PESO DE ESFORÇO
   *    — quem concluía uma tarefa `effort:3` lia "📋 1/3 do dia" tendo feito
   *    100% da meta (a assimetria de unidade que o CLAUDE.md proíbe);
   *  · `activities.filter(a => a.completedToday)` ignorava hábitos COM ETAPAS
   *    (a conclusão deles é derivada de `steps.every`, e `completedToday` nunca
   *    é escrito), então quem só usa hábitos em etapas lia sempre "0/N";
   *  · no caminho de hábito recebia o `gameState` PRÉ-update, então o item que
   *    o jogador acabara de marcar não entrava no próprio anúncio dele.
   *
   * Agora os dois números vêm de `useProgressTracking` — a mesma fonte da barra,
   * do widget e do humor do pet, que por sua vez usa `dailyGoalFor` e
   * `doneWeightFor` (footgun 9: regra copiada é regra que diverge em silêncio).
   * O disparo é via `queueTaskGains` + efeito, para o toast ser calculado depois
   * do render que já aplicou a conclusão.
   */
  const announceTaskGains = useCallback((category: ActivityCategory) => {
    const isPt = language === 'pt-BR';
    const food = FOOD_BY_CATEGORY[category];
    const parts = [
      isPt ? `${food?.emoji ?? '🍎'} +1 comida` : `${food?.emoji ?? '🍎'} +1 food`,
    ];
    if (dailyTotal > 0) {
      parts.push(isPt ? `📋 ${dailyDone}/${dailyTotal} do dia` : `📋 ${dailyDone}/${dailyTotal} today`);
    }
    // Só oferece o próximo passo se ele existir de verdade: a condição do dia
    // perfeito é energia ≥ meta do dia, então com a energia já cheia isto seria
    // uma cobrança inventada em cima de quem acabou de fechar tudo.
    if (dailyTotal > 0 && dailyDone >= dailyTotal && (gameState.energyPoints ?? 0) < dailyTotal) {
      parts.push(isPt ? '⚡ falta encher a energia' : '⚡ energy left to fill');
    }
    toast(parts.join('  ·  '));
  }, [language, dailyDone, dailyTotal, gameState.energyPoints]);

  /**
   * Fila de UM anúncio: o handler só ENFILEIRA (`queueTaskGains`) e o efeito
   * abaixo dispara depois do render, quando `dailyDone`/`dailyTotal` já refletem
   * a conclusão. `n` existe para duas conclusões seguidas da mesma categoria
   * contarem como dois sinais distintos.
   */
  const [gainSignal, setGainSignal] = useState<{ category: ActivityCategory; n: number } | null>(null);
  /**
   * ↩️ #57 — A JANELA DE 5 SEGUNDOS PARA DESFAZER UMA CONCLUSÃO.
   *
   * DECISÃO DO DONO #57 (22/09/2026): *"Marcar feita: toast 'Desfazer' 5 s
   * revertendo a conclusão inteira (comida/XP/vínculo/constância); depois
   * disso, imutável"*.
   *
   * O `snapshot` é tirado FORA do updater, do `gameState` que o handler já tem
   * em mãos — mesmo lugar e mesmo motivo de `habitMilestoneOf` (o updater roda
   * 2× no StrictMode, e duas fotos do mesmo instante seriam iguais mas o toast
   * sairia dobrado). A REVERSÃO é que roda dentro de um updater, sobre o
   * `prev`: entre o clique no "Desfazer" e o commit pode ter havido outra
   * mudança de estado, e o `prev` é a única leitura que enxerga ela.
   *
   * `duration` = `UNDO_WINDOW_MS` porque a janela do toast **é** a janela da
   * reversão: o botão nunca some antes de expirar nem fica morto na tela.
   */
  const ofereceDesfazer = useCallback((antes: GameState, nomeDoHabito: string) => {
    const snapshot = snapshotCompletion(antes);
    const mensagem = language === 'pt-BR'
      ? `${nomeDoHabito} — marcado como feito`
      : `${nomeDoHabito} — marked as done`;
    toast.custom(
      (t) => (
        <UndoToast
          language={language}
          mensagem={mensagem}
          onUndo={() => {
            setGameState(prev => undoCompletion(prev, snapshot));
            toast.dismiss(t);
          }}
        />
      ),
      { duration: UNDO_WINDOW_MS },
    );
  }, [language, setGameState]);

  const queueTaskGains = useCallback((category: ActivityCategory) => {
    setGainSignal(prev => ({ category, n: (prev?.n ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    if (!gainSignal) return;
    announceTaskGains(gainSignal.category);
    // `announceTaskGains` FORA das deps de propósito: ele muda a cada alteração
    // de meta/feito, e incluí-lo faria o mesmo anúncio tocar de novo a cada
    // conclusão seguinte. O gatilho é o sinal, nunca o formatador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gainSignal]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  /**
   * Tira a tarefa da gaveta e devolve para a lista ativa.
   *
   * `restore` (taskTriage) atualiza o toque junto, senão a tarefa voltaria já
   * assombrada pelo tempo que passou guardada — o que puniria exatamente a
   * decisão saudável de ter guardado em vez de arrastar a culpa.
   */
  const handleRestoreTask = useCallback((taskId: string) => {
    const agoraLocal = new Date();
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? restore(t, agoraLocal) : t)),
    }));
  }, []);

  // -------------------------------------------------------------------------
  // ADIAMENTO: o chip do `TaskMeta` agora ABRE alguma coisa.
  //
  // `onPostponeNudge` é passado por AQUI — sem ele o botão nasce `disabled`.
  // O handler só guarda o id (efeito nenhum dentro de updater, footgun 6); as
  // três ações lá embaixo é que mexem no estado, cada uma delegando para a
  // função pura dona da regra em `utils/taskTriage.ts`.
  // -------------------------------------------------------------------------
  const [nudgeTaskId, setNudgeTaskId] = useState<string | null>(null);
  const handlePostponeNudge = useCallback((taskId: string) => setNudgeTaskId(taskId), []);
  const handleCloseNudge = useCallback(() => setNudgeTaskId(null), []);

  /** ENCOLHER — `shrink` rebaixa o esforço e ZERA o contador de adiamentos.
   *  Nada é reimplementado aqui de propósito (footgun 9). */
  const handleShrinkTask = useCallback((taskId: string) => {
    const now = new Date();
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? shrink(t, now) : t)),
    }));
  }, [setGameState]);

  /** DEIXAR PRA LÁ — `drop`. Terminal e reversível; a gaveta de guardadas já
   *  existe na página de Atividades com `handleRestoreTask` do outro lado. */
  const handleDropTask = useCallback((taskId: string) => {
    const now = new Date();
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? drop(t, now) : t)),
    }));
    toast(language === 'pt-BR'
      ? 'Guardada. Dá pra trazer de volta.'
      : 'Tucked away. You can bring it back.');
  }, [setGameState, language]);

  /**
   * DECOMPOR — os passos escolhidos viram tarefas novas de esforço 1.
   *
   * A tarefa ORIGINAL fica, e fica com o contador zerado: ela mudou de tamanho
   * na cabeça da pessoa no momento em que ganhou um primeiro passo, e é a
   * mesma tese do `shrink` ("carregar a marca puniria a decisão certa"). O que
   * NÃO acontece aqui é apagar ou concluir a original em nome dela — se a
   * pessoa quiser que ela suma, "deixar pra lá" está no mesmo sheet.
   */
  const handleDecomposeTask = useCallback((taskId: string, picks: SuggestedTask[]) => {
    if (!picks.length) return;
    const nowIso = new Date().toISOString();
    const stamp = Date.now();
    setGameState(prev => {
      const parent = prev.tasks.find(t => t.id === taskId);
      const novos: Task[] = picks.map((p, i) => ({
        id: `task-${stamp}-${i}`,
        name: p.name,
        category: (p.category ?? parent?.category ?? 'Personal') as ActivityCategory,
        emoji: p.emoji,
        completed: false,
        // Esforço 1 é a razão de existir da decomposição: o gargalo era
        // habilidade, não motivação. Um "passo" de esforço 3 não é um passo.
        effort: 1,
        startDate: parent?.startDate,
        status: 'open',
        createdAt: nowIso,
        lastTouchedAt: nowIso,
      }));
      return {
        ...prev,
        tasks: [
          ...novos,
          ...prev.tasks.map(t => (t.id === taskId ? { ...t, postponedCount: 0, lastTouchedAt: nowIso } : t)),
        ],
      };
    });
    toast(language === 'pt-BR'
      ? `${picks.length === 1 ? 'Passo adicionado' : `${picks.length} passos adicionados`}. Comece pelo menor.`
      : `${picks.length === 1 ? 'Step added' : `${picks.length} steps added`}. Start with the smallest one.`);
  }, [setGameState, language]);

  const handleEditTask = useCallback((taskId: string) => {
    setEditingTask(taskId);
    setTaskEditModalOpen(true);
  }, []);

  /**
   * Grava o que a barra de captura de uma linha entendeu.
   *
   * Reusa `commitTaskCreate` / `commitHabitCreate` de propósito: são eles que
   * conhecem o teto do modo grátis, o teto do estágio e a telemetria de
   * criação. Uma segunda rota de gravação que não os consultasse seria um jeito
   * de furar o teto sem ninguém perceber (footgun 9).
   *
   * `false` significa "não coube" — a barra mostra o aviso e mantém o texto,
   * para a pessoa não perder o que digitou.
   */
  const handleQuickAdd = useCallback((r: QuickAddResult): boolean => {
    const categoria = (r.category ?? 'Discipline') as ActivityCategory;
    const emoji = CATEGORY_ICONS[categoria];
    const agora = new Date().toISOString();

    if (r.kind === 'activity' && r.schedule) {
      const dias = weekDaysForSchedule(r.schedule);
      const nova: Activity = {
        id: `activity-${Date.now()}`,
        name: r.name,
        category: categoria,
        emoji,
        steps: [],
        // `weekDays` E `schedule` juntos: o campo antigo é o que o widget
        // Android e o overlay de desktop leem, e nenhum dos dois carrega o
        // motor novo. Gravar só um faria o hábito cobrar num ritmo na tela e
        // noutro no widget.
        weekDays: dias,
        schedule: r.schedule,
      };
      return commitHabitCreate([nova], TELEMETRY_CREATE_PATH.home_edit) > 0;
    }

    // Data solta é `startDate` ("quando pretendo fazer"), NÃO prazo — é o que
    // traz a tarefa para o Hoje. A regra é do `CreateModal.applyQuickAdd`, e
    // repeti-la diferente aqui faria a MESMA linha digitada produzir coisas
    // distintas conforme a tela (footgun 9). Quem quer prazo marca prazo, que
    // é outra decisão e continua no modal.
    const nova: Task = {
      id: `task-${Date.now()}`,
      name: r.name,
      category: categoria,
      emoji,
      completed: false,
      startDate: r.date,
      effort: r.effort,
      status: 'open',
      createdAt: agora,
      lastTouchedAt: agora,
    };
    return commitTaskCreate(nova, TELEMETRY_CREATE_PATH.home_edit, 'topo');
  }, [commitTaskCreate, commitHabitCreate]);

  /**
   * UM modal de criação só (canvas Atividades, A1 / achado 8): o CTA da lista
   * abre o `CreateModal` — captura rápida + "More options" — e não mais o
   * `EditModal` sem `initialData`. Editar continua no `EditModal`, que perdeu
   * o caminho de criação (e com ele o nudge do teto, ATIV-18).
   */
  const handleAddNewActivity = useCallback(() => {
    setCatalogBrowserOpen(true);
  }, []);

  /**
   * Abrir a cerimônia de evolução a partir do HUD.
   *
   * Isto era uma LAMBDA INLINE na prop `onEvolveRequest` — a única entre os 14
   * handlers do `CompanionHUD`, que é `memo()`. Identidade nova a cada render
   * anula a memoização inteira (footgun 5), e o `App` re-renderiza sozinho no
   * polling do cocô (10s), no check da virada (30s) e a cada tecla do chat: o
   * HUD inteiro (sprites, respiração, piscada, gesto de esfregar) redesenhava
   * junto, que é exatamente o que o `memo` existe para evitar.
   *
   * As deps são os campos CRUS que a decisão lê — nada de `getDominantBranch`,
   * que é recriada a cada render e devolveria a identidade instável pela porta
   * dos fundos. Assim a identidade só muda quando a DECISÃO muda (ganhou
   * atributo, evoluiu, destravou galho), e não a cada tique do relógio.
   * (`carePatternReading` é `useMemo` sobre `completedTasks`/`activityLog`, então
   * entra nas deps sem reintroduzir identidade instável.)
   *
   * A decisão em si NÃO mora aqui: quem anuncia o destino chama a MESMA
   * `evolutionTarget` que o `handleEvolve` commita. Este handler reimplementava
   * a regra à mão e mandava todo empate para `data`, sem consultar o ritmo —
   * empate poder/benevolência com leitura confiável anunciava `ultimate-harmony` e
   * gravava `ultimate-power`. Ver `utils/evolutionTarget.ts` (footgun 9).
   */
  const { powerPoints, harmonyPoints, benevolencePoints, evolutionStage, unlockedEvolutions, currentBranch, perfectDays, degeneratedByHP } = gameState;
  const handleEvolveRequest = useCallback(() => {
    const { stage: next } = evolutionTarget({
      points: { power: powerPoints, harmony: harmonyPoints, benevolence: benevolencePoints },
      reading: carePatternReading,
      currentBranch,
      evolutionStage,
      unlockedEvolutions,
      perfectDays,
    });
    // #59 — a cerimônia não abre na mesma abertura da queda: ela tocaria POR
    // causa de uma queda, e o `handleEvolve` do outro lado recusaria de
    // qualquer jeito, deixando o jogador diante de um ritual que não commita.
    if (degeneratedByHP) return;
    if (next !== evolutionStage) setEvolutionCeremony({ from: evolutionStage, to: next });
  }, [powerPoints, harmonyPoints, benevolencePoints, evolutionStage, unlockedEvolutions, currentBranch, perfectDays, carePatternReading, degeneratedByHP]);

  const handleEvolve = useCallback(() => {
    setGameState(prev => {
      // Evolution padlock (Evolution page): while locked, never evolve.
      if (prev.evolutionLocked) return prev;
      // Evolução manual: só evolui com a barra de dias perfeitos cheia.
      const req = FORM_REQUIREMENTS[getStageLevel(prev.evolutionStage)].required;
      if (prev.perfectDays < req) return prev;
      // #59 (decisão do dono, 22/09/2026): "Queda: exigir uma virada completa
      // antes de re-evoluir (acaba a cura grátis por um clique)". A regra mora
      // em `utils/dailyReset.ts` — aqui só se delega, porque ela tem DOIS
      // chamadores (este e o `canEvolve` que acende o botão) e regra copiada
      // diverge em silêncio. Reconferida sobre o `prev`, e não só no botão: é
      // o updater que commita, e o botão é sinal de UI.
      if (!podeEvoluirDepoisDaQueda(prev)) return prev;
      let newEvolutionStage = prev.evolutionStage;
      let newHP = prev.healthPoints;

      // O galho vem dos atributos (que vêm da comida, e portanto da CATEGORIA
      // das tarefas). No EMPATE, quem decide é o padrão de cuidado do jogador —
      // antes isso era resolvido por uma ordem fixa no código (poder, benevolência,
      // dado), sem significado nenhum. É a ideia dos care mistakes do v-pet de
      // 97: o jeito como você cuidou define quem seu bicho vira, e nenhum jeito
      // é melhor que o outro. Ver utils/carePattern.ts.
      const alvo = evolutionTarget({
        points: { power: prev.powerPoints, harmony: prev.harmonyPoints, benevolence: prev.benevolencePoints },
        // `careHistory(prev)`, não `prev.completedTasks`: a página de Evolução
        // prevê o galho com tarefas + activityLog, e ler só as tarefas aqui
        // fazia a cerimônia entregar um galho diferente do prometido.
        reading: computeCarePattern(careHistory(prev)),
        currentBranch: prev.currentBranch,
        evolutionStage: prev.evolutionStage,
        unlockedEvolutions: prev.unlockedEvolutions,
        perfectDays: prev.perfectDays,
      });
      // INCUBAÇÃO (D-G8c): ficar apto abre a espera; o gesto só completa depois
      // dela. Reconferida sobre o `prev` pelo mesmo motivo do `podeEvoluirDepoisDaQueda`
      // acima — é este updater que commita, o botão é sinal de UI. A regra mora
      // em `utils/spriteTrigger.ts` e NÃO é reescrita aqui.
      if (!incubationReady(prev.incubation, alvo.stage, new Date())) return prev;
      const newCurrentBranch = alvo.branch;
      newEvolutionStage = alvo.stage;
      newHP = getMaxHPForStage(newEvolutionStage);

      // WP4.19 — subir de novo depois de uma queda por HP apaga a marca da
      // queda e acende a da volta. A regra é de `dailyReset.ts` (dona), não
      // daqui: `App.tsx` só delega. Cosmética, opt-in, e nunca marca de queda.
      const base = applyRedemption(prev, newEvolutionStage !== prev.evolutionStage);
      return {
        ...base,
        evolutionStage: newEvolutionStage,
        currentBranch: newCurrentBranch,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        perfectDays: 0,
        attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
        unlockedEvolutions: prev.unlockedEvolutions.includes(newEvolutionStage)
          ? prev.unlockedEvolutions
          : [...prev.unlockedEvolutions, newEvolutionStage],
        // WP4.10 — a data da forma. Sem ela a coleção é uma lista; com ela é
        // uma história ("essa foi na primeira semana"). Nunca reescrita.
        formReachedAt: stampCollected(
          prev.formReachedAt,
          newEvolutionStage,
          playerDayKey(new Date(), prev.playerDayTz),
        ),
      };
    });
    playEvolve();
    setEvolutionFlash(true);
    setTimeout(() => setEvolutionFlash(false), 2000);
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleCareEventComplete = useCallback(() => {
    if (!careEvent) return;

    setGameState(prev => {
      // Only poop care events exist now (scheduled food events were removed).
      if (careEvent.type !== 'poop') return prev;
      // A regra do banho mora em `utils/poopDrain.ts`, ao lado de quem lê o que
      // ela escreve (`applyPoopDrain`). Aqui sobra só o efeito — som e o fim do
      // evento. O overlay do desktop refaz este trabalho à mão hoje; agora há
      // função para ele importar (ver o cabeçalho de `cleanPoop`).
      return cleanPoop(prev, { at: careEvent.requestTime }).state;
    });

    // C-9 (run `som-01`): `playPoopClean` foi apagado. Este call-site era o
    // unico, e so alcancavel pelo BANHO (`CareSystem.tsx` desliga o clique no
    // coco por codigo) — o som ja soava junto com `playShower` no mesmo gesto.
    // O canal que confirma "limpo e dreno parado" e o `setCareEvent(null)`
    // abaixo, que esconde o sprite no mesmo ciclo de render (R-35).
    setCareEvent(null);
    setMessageTrigger(prev => prev + 1);
  }, [careEvent]);

  // Consume one food item → energy + attribute points (NOT HP; HP is only healed
  // via "carinho"). Limited to 5 feedings per rolling hour; once full, the pet
  // just says it's full (no other feedback).
  const handleFeed = useCallback((foodEmoji: string) => {
    // No item in stock → nothing happens (don't burn a feed slot or animate).
    if ((gameState.foodInventory[foodEmoji] ?? 0) <= 0) return;

    // Special items (shop consumables) behave differently from food: chips only
    // grant attribute points (no energy) and the heart item only heals HP.
    // Neither counts against the 5-feeds-per-hour food limit.
    const special = SPECIAL_ITEMS[foodEmoji];
    if (special) {
      // A REGRA mora em `utils/specialItemUse.ts` (leia o cabeçalho de lá para
      // saber por que não é o `careUpdaters.ts`). Aqui sobra só o efeito: o som
      // de cada tipo, a animação de comer e o toast do glitchtama.
      //
      // Só a RECUSA acontece fora do updater — ela acende o `healCapSignal`, e
      // efeito colateral dentro de updater roda 2× no StrictMode (footgun 6).
      // O `applySpecialItem` reconfere a recusa sobre o `prev`: era o furo do
      // coraçãozinho, que dois toques no mesmo lote queimavam curando zero.
      const agora = new Date();
      const refused = specialRefusal(gameState, foodEmoji, agora);
      if (refused === 'no-stock') return;
      if (refused === 'daily-cap') {
        // O item VOLTA para a pastinha e vale amanhã — por isso a mensagem diz
        // o que fazer, e não o que foi negado. Nada de toast de erro: o teto do
        // Glitchtama existe para devolver o atalho ao calendário, não para
        // repreender quem farmou a masmorra.
        toast(language === 'pt-BR'
          ? '🌀 Um Glitchtama por dia. Ele te espera amanhã.'
          : "🌀 One Glitchtama a day. It'll wait for you tomorrow.");
        return;
      }
      if (refused === 'already-full') {
        // Copy §5.1: a vida cheia recusa PROTEGENDO o item — a fala é da
        // criatura ("Tô firme. Guarda essa."), kind `steady` de `petVoice.ts`.
        falar('steady');
        return;
      }

      // C-5 (run `som-01`): o Glitchtama NAO usa mais o som de evolucao. Ele e
      // um item de inventario sendo usado; a evolucao e o evento identitario do
      // produto. Emprestar o som da evolucao para um item que da +1 dia completo
      // e a forma sonora de escalar celebracao com contagem (veto #16). Vai no
      // mesmo peso do coracaozinho: item especial.
      if (special.kind === 'glitchtama' || special.kind === 'heart') playTaskComplete();
      else playFeed();

      setGameState(prev => applySpecialItem(prev, foodEmoji, agora).state);
      setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));

      if (special.kind === 'glitchtama') {
        toast(language === 'pt-BR' ? '🌀 Glitchtama! +1 dia completo' : '🌀 Glitchtama! +1 complete day');
      }
      return;
    }

    // Comida comum: a regra mora em utils/careRules.ts, compartilhada com o app
    // de desktop. Aqui ficam só os efeitos (som, animação, fala do pet).
    // Só a decisão de RECUSAR precisa acontecer fora do updater (ela dispara
    // fala/animação, que são efeitos colaterais — e efeito dentro de updater
    // roda 2× no StrictMode). A mutação em si vai no updater, sobre o `prev`.
    const now = Date.now();
    if ((gameState.foodInventory[foodEmoji] ?? 0) <= 0) return;
    if (feedTimesFor(gameState.careCaps, now).length >= FOOD_LIMIT_PER_HOUR) {
      setFullSignal(n => n + 1); // pet says "I'm full"
      return;
    }

    playFeed();
    // A janela é lida do `prev`, e NÃO da leitura de fora: dois toques dentro do
    // mesmo lote do React veriam o mesmo `gameState` e a segunda comida furaria
    // o teto. Aqui a segunda passada já enxerga o timestamp da primeira. A
    // checagem de fora existe só pela recusa, que dispara fala/animação e por
    // isso não pode morar dentro do updater (footgun 6).
    setGameState(prev => applyFeed(prev, foodEmoji, now).state);
    // WP1.3 — só a comida COMUM conta o gesto: o item especial (coraçãozinho,
    // chip) sai por outro caminho e não é o que se está ensinando aqui.
    marcarGestoDoDia('feed');
    setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
  }, [gameState.foodInventory, gameState.careCaps, gameState.healthPoints, gameState.maxHealthPoints, language]);

  // Shower: cosmetic wash (no energy cost). Also properly completes an active poop event.
  const handleShower = useCallback(() => {
    contarMissao('shower');
    if (careEvent?.type === 'poop') {
      handleCareEventComplete();
    }
    falar('shower');
  }, [careEvent, handleCareEventComplete, falar]);

  // ── ADMIN / GM (29/09/2026) ────────────────────────────────────────────────
  // `useAdmin()` vem SÓ da resposta do servidor nesta abertura
  // (`utils/adminFlag.ts`). Nada aqui toca rota de servidor: tudo é o save
  // LOCAL, com updaters puros de `utils/gmTools.ts` / `utils/corvoPet.ts`.
  const isAdmin = useAdmin();
  // Auto-adoção do corvinho: UMA vez por sessão, só para o admin. `adoptCorvo`
  // é idempotente (mesma referência se já é corvo), então o StrictMode rodar o
  // updater 2× não muda nada. Sem toast: a troca de pele não é aviso.
  // Não é "uma vez por sessão": se um save remoto SEM corvo entrar depois da
  // adoção (cloud save de outro aparelho), o efeito vê `!isCorvo` de novo e
  // adota outra vez — a marca do admin vence. O ref só evita import duplo em voo.
  const corvoAdoptingRef = useRef(false);
  const stateIsCorvo = isCorvo(gameState);
  useEffect(() => {
    if (!isAdmin || stateIsCorvo || corvoAdoptingRef.current) return;
    corvoAdoptingRef.current = true;
    void corvoAdocao()
      .then(m => setGameState(m.adoptCorvo))
      .finally(() => { corvoAdoptingRef.current = false; });
  }, [isAdmin, stateIsCorvo, setGameState]);
  const gmActions = useMemo(() => ({
    isCorvo: petIsCorvo,
    currentForm: gameState.evolutionStage,
    onGiveBalance: () => { void gmTools().then(m => setGameState(m.gmGiveBalance)); },
    onUnlockAll: () => { void gmTools().then(m => setGameState(m.gmUnlockAll)); },
    onGoToForm: (formId: string) => { void gmTools().then(m => setGameState(prev => m.gmGoToForm(prev, formId))); },
    onAdoptCorvo: () => { void corvoAdocao().then(m => setGameState(m.adoptCorvo)); },
    onFillCare: () => {
      // O cocô NA TELA é um `careEvent`: fecha pelo mesmo caminho do banho,
      // fora do updater (footgun 6), e depois enche o save.
      if (careEvent?.type === 'poop') handleCareEventComplete();
      void gmTools().then(m => setGameState(m.gmFillCare));
    },
    onAddPerfectDays: (n: number) => { void gmTools().then(m => setGameState(prev => m.gmAddPerfectDays(prev, n))); },
  }), [petIsCorvo, gameState.evolutionStage, setGameState, careEvent, handleCareEventComplete]);

  // Uncleaned poop drains 1 heart every 6 hours (paused while sleeping). The
  // clock starts when a poop is on screen and stops the moment it's cleaned.
  const poopDrainWarnedAtRef = useRef(0);
  useEffect(() => {
    const drain = () => {
      // Warn ~30min before a drain tick so the user can react (bath) in time.
      {
        const shown = gameState.poopEventsShown || [];
        const cleaned = gameState.poopEventsCompleted || [];
        const clock = gameState.poopPenaltyClockAt ?? 0;
        const now = Date.now();
        // Só avisa se o tick FOR cobrar: com o teto do dia já gasto, o aviso
        // prometeria um dano que não acontece.
        if (!isSleeping && clock !== 0 && shown.some(i => !cleaned.includes(i))
            && remainingDrainToday(gameState, now) > 0) {
          const periodStart = clock + Math.floor((now - clock) / POOP_DRAIN_PERIOD_MS) * POOP_DRAIN_PERIOD_MS;
          const msToNextTick = periodStart + POOP_DRAIN_PERIOD_MS - now;
          if (msToNextTick <= 30 * 60000 && poopDrainWarnedAtRef.current !== periodStart) {
            poopDrainWarnedAtRef.current = periodStart;
            const ispt = language === 'pt-BR';
            showNotification(
              ispt ? '🚽 Seu Soulmon está na sujeira!' : '🚽 Your Soulmon is in a mess!',
              {
                body: ispt
                  ? 'Cocô não limpo tira 1 coração em breve. Dê um banho!'
                  : 'Uncleaned poop will drain 1 heart soon. Give it a bath!',
                tag: 'poop-drain-warning',
              },
            );
          }
        }
      }
      // A regra do dreno mora em `utils/poopDrain.ts` (teto diário, traço
      // Teimoso e perdão por ausência). Aqui só sobra o efeito.
      const now = Date.now();
      setGameState(prev => applyPoopDrain(prev, { now, isSleeping }));
    };
    drain();
    const id = setInterval(drain, 60000);
    return () => clearInterval(id);
  }, [isSleeping, setGameState, gameState.poopEventsShown, gameState.poopEventsCompleted, gameState.poopPenaltyClockAt, language]);

  const handleSleep = useCallback(() => {
    setIsSleeping(prev => {
      const next = !prev;
      writeFlag(STORAGE_KEYS.IS_SLEEPING, next, { silent: true });
      // C-7 (run `som-01`): so DEITAR soa. Um som que nao distingue a direcao do
      // estado nao confirma acao nenhuma — so avisa que um botao foi apertado,
      // coisa que o botao ja faz. E acordar e o comeco do dia, onde a Janela de
      // Descanso proibe qualquer feedback avaliativo (veto #12). O estado
      // dormindo/acordado ja e visivel e persistente na tela do pet.
      if (next) playSleep();
      return next;
    });
    /* Copy §1.4/§1.5 (21/09/2026): dormir e acordar eram MUDOS. A fala é do
       GESTO manual (o sono automático continua calado: ninguém está olhando),
       e sai FORA do updater (footgun 6), lendo o estado que o gesto inverte.
       A criatura fala do corpo dela — ⚠️ `wake` nunca comenta a noite de quem
       lê (veto #12); há teste em `petVoice.test.ts`. */
    falar(isSleeping ? 'wake' : 'sleep');
    // E0: a trilha NÃO é pausada aqui — é no `useEffect([isSleeping])` logo
    // abaixo, que cobre o gesto manual E o sono automático com um caminho só.
  }, [isSleeping, falar]);

  /* E0 (S13, peça extraída; `SOM.md` §2.1): dormindo, a trilha para — e
     "dormindo" inclui o sono AUTOMÁTICO e o app aberto com o pet já dormindo.
     Até 22/09/2026 a pausa vivia dentro de `handleSleep`, então só o gesto
     manual parava a trilha: o `useEffect` da janela de sono automático
     (`AUTO_SLEEP_*`) trocava `isSleeping` sem tocar nela, e o primeiro gesto
     sonoro de uma sessão aberta depois das 23h religava a trilha com o pet
     dormindo (achado S-1 da QA rodada 2). Efeito sobre o ESTADO, não sobre o
     gesto: quem quer que mude `isSleeping`, a trilha obedece. */
  useEffect(() => {
    if (isSleeping) pausarTrilha('sono'); else retomarTrilha('sono');
  }, [isSleeping]);

  /* E0, a outra metade: a janela de descanso (`rest.window`, `restWindow.ts`)
     também cala a trilha, pelo relógio — sem a tolerância de 45 min do
     `isWithinWindow`, que existe para premiar DEITAR cedo, não para calar som
     antes da hora. Checado a cada 60 s, como o sono automático. */
  const restWindowStart = gameState.rest?.window?.start;
  const restWindowEnd = gameState.rest?.window?.end;
  useEffect(() => {
    const janela = restWindowStart && restWindowEnd
      ? { start: restWindowStart, end: restWindowEnd }
      : createRestState().window;
    const check = () => {
      if (isWithinWindow(janela, new Date(), 0)) pausarTrilha('descanso');
      else retomarTrilha('descanso');
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [restWindowStart, restWindowEnd]);

  /* Copy §1.6: a borra apareceu — ela constata e aponta (L3, §5.6). Só na
     CHEGADA do evento; o dreno cobrando sustentação segue mudo de propósito
     (a criatura anunciando o próprio dano é a família de `'HP baixo...'`). */
  const borraAnteriorRef = useRef(false);
  useEffect(() => {
    const agora = careEvent?.type === 'poop';
    if (agora && !borraAnteriorRef.current) falar('residue');
    borraAnteriorRef.current = agora;
  }, [careEvent, falar]);

  // Dungeon: no daily cap — entry is blocked only at ≤1 heart (a loss costs a
  // real heart, so the player must be able to afford it). As long as HP allows,
  // they can go as often as they like. Returns the monthly difficulty + best.
  // A masmorra NÃO é mais gated por HP. Antes, perder custava 1 coração real e
  // não dava pra entrar com ≤1 coração — o que trancava fora do conteúdo
  // divertido justamente quem tinha tido uma semana ruim, e cada tentativa
  // aprofundava o buraco. É a mesma estrutura do encarecimento dos Remote Raid
  // Passes que custou jogadores ao Pokémon GO em 2023.
  //
  // O jogo nunca deve cobrar da barra que representa o cuidado que o usuário
  // teve consigo mesmo. O que está em jogo aqui é a própria run: perder custa os
  // bônus de andar, o Glitchtama e o placar. Se farmar Bits virar problema, a
  // alavanca é um custo de ENTRADA em Bits — não o retorno do custo em corações.
  const handleDungeonEnter = useCallback((): { ok: true; level: number; best: number } => {
    return { ok: true, level: getDungeonDifficulty(), best: getDungeonBest() };
  }, []);

  // Perder encerra a run e não toca no HP. (A contabilidade de placar/dificuldade
  // vive no componente do jogo, via utils/dungeon.)
  const handleDungeonLose = useCallback(() => {}, []);

  // Heart item can drop in the dungeon (capped per day). Adds it to the Items
  // folder and returns whether one dropped. The dungeon no longer drops food.
  const handleDungeonHeartDrop = useCallback((): boolean => {
    // Sortudo (utils/passives.ts) acha coraçãozinho com mais frequência.
    if (!rollDungeonHeartDrop(heartDropBonus(gameState.petPassive))) return false;
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [HEART_ITEM_EMOJI]: (prev.foodInventory[HEART_ITEM_EMOJI] ?? 0) + 1 },
    }));
    return true;
  }, [gameState.petPassive]);

  /**
   * WP4.7 — o ÚNICO ponto que conta missão semanal.
   *
   * ⚠️ `utils/weeklyMissions.ts` existia completo, testado e com **zero
   * consumidores** (auditoria de 06/09/2026) — a terceira repetição do padrão
   * que o WP4.15 consertou no Vínculo e o WP4.16 nas estações: quanto mais
   * completo o módulo, menos óbvio que ele está mudo. E o custo aqui era de
   * economia: `TOURNAMENT_ITEMS` somam 245 Emblemas, a 3 por vitória são ~82
   * vitórias, e depois disso a moeda do Torneio **nunca mais compra nada**.
   * As missões semanais são a torneira e o ralo ao mesmo tempo.
   *
   * Um ponto só, e não um `bumpWeekly` espalhado por doze handlers, porque a
   * virada de semana (`forWeek`) tem de acontecer no MESMO updater que soma —
   * senão um contador de semana passada recebe +1 antes de ser zerado.
   */
  const contarMissao = useCallback((id: WeeklyMissionId) => {
    setGameState(prev => {
      const semana = isoWeekKey(playerDayKey(new Date(), prev.playerDayTz));
      if (!semana) return prev;
      return { ...prev, weeklyMissions: bumpWeekly(forWeek(prev.weeklyMissions, semana), id) };
    });
  }, []);

  /* ── NAVEGAÇÃO (minimal-ui F1): Home ↔ Mapa → áreas ────────────────────
     O grafo do voltar é `viewBack` (`navigation.ts`), UM só para os três
     caminhos: o voltar da tela, o voltar do navegador (`popstate`) e o botão
     físico do Android. A pilha do `history` acompanha a PROFUNDIDADE do
     grafo (Home 0 · Mapa/menu 1 · área 2): ir mais fundo empilha, trocar de
     área para área substitui, e voltar pela tela é `history.back()` — assim o
     voltar do sistema e o da tela nunca discordam sobre onde a pessoa está. */
  const goTo = useCallback((v: ViewType) => {
    const atual = currentViewRef.current;
    if (v === atual) return;
    // A missão "visite a árvore de evolução" conta a NAVEGAÇÃO até ela.
    if (areaOf(v) === 'laboratorio') contarMissao('evolve-view');
    const lateral = areaOf(v) !== null && areaOf(atual) !== null;
    try {
      if (lateral) window.history.replaceState({ smView: v }, '');
      else window.history.pushState({ smView: v }, '');
    } catch { /* history indisponível (sandbox): a navegação segue sem ela */ }
    setCurrentView(v);
  }, [contarMissao]);

  const goBack = useCallback(() => {
    if (viewBack(currentViewRef.current) === null) return;
    const st = window.history.state as { smView?: string } | null;
    // Só delega ao `history` se a entrada atual é NOSSA; senão (recarga no meio
    // do caminho) resolve direto pelo grafo.
    if (st && typeof st.smView === 'string' && st.smView !== 'home') window.history.back();
    else setCurrentView(v => viewBack(v) ?? v);
  }, []);

  useEffect(() => {
    try { window.history.replaceState({ smView: 'home' }, ''); } catch { /* idem */ }
    const onPop = () => {
      /* Camada aberta por cima da tela (folha de lote, minijogo): o voltar a
         fecha e a tela continua — a entrada de history já foi consumida pelo
         navegador, então repõe a mesma para o próximo voltar. */
      if (closeTopBackLayer()) {
        try { window.history.pushState({ smView: currentViewRef.current }, ''); } catch { /* idem */ }
        return;
      }
      const alvo = viewBack(currentViewRef.current);
      if (alvo) setCurrentView(alvo);
    };
    window.addEventListener('popstate', onPop);
    /* Botão voltar do ANDROID (`@capacitor/app`): o MESMO grafo, e na Home
       devolve ao sistema (minimiza). Só registra em plataforma nativa — na
       web/PWA fica o `popstate` acima. Dono: `utils/androidBack.ts`. */
    const offBack = registerAndroidBack(() => currentViewRef.current, goBack);
    return () => {
      window.removeEventListener('popstate', onPop);
      offBack();
    };
  }, [goBack]);

  /* O foco acompanha a troca de tela: sem isto, depois de tocar numa área o
     foco fica num botão que não existe mais e o leitor de tela não anuncia a
     tela nova. Vai para o `<main>` (tabIndex -1), não para o primeiro botão. */
  const primeiraTela = useRef(true);
  useEffect(() => {
    if (primeiraTela.current) { primeiraTela.current = false; return; }
    const main = document.getElementById('conteudo');
    main?.focus({ preventScroll: true });
    if (main) main.scrollTop = 0;
  }, [currentView]);

  // 🌀 Glitchtama — guaranteed reward for clearing all 5 dungeon floors.
  // Also counts a completed run for the missions.
  const handleGlitchtama = useCallback(() => {
    setGameState(prev => ({
      // 🔗 Vínculo: a run completa (os 5 andares) é o evento de masmorra que o
      // app tem em mãos, e ele passa pelo TETO DIÁRIO SUAVE de `bond.ts` —
      // ao bater, simplesmente para de somar. Nada é subtraído e a masmorra
      // continua inteira (Bits, Glitchtama, placar): o teto diz "o pet já está
      // satisfeito", nunca "você jogou demais".
      ...awardBondXP(prev, { kind: 'dungeonRun' }, playerDayKey(new Date(), prev.playerDayTz)),
      foodInventory: { ...prev.foodInventory, [GLITCHTAMA_EMOJI]: (prev.foodInventory[GLITCHTAMA_EMOJI] ?? 0) + 1 },
      dungeonRunsCompleted: (prev.dungeonRunsCompleted ?? 0) + 1,
    }));
    contarMissao('dungeon-runs');
  }, [contarMissao]);

  /* 🔗 #59b — 🧱 ANDAR LIMPO DA MASMORRA. Um dos 6 `BondEvent` mudos que a
     QA rodada 2 (§2.4) mediu: a tabela do §55 declarava `dungeonFloor` e
     `grep -rn "kind: 'dungeonFloor'" src` não achava emissor nenhum. */
  const handleDungeonFloorCleared = useCallback(() => {
    setGameState(prev => awardBondXP(prev, { kind: 'dungeonFloor' }, playerDayKey(new Date(), prev.playerDayTz)));
  }, []);

  // 🏅 Mission counters
  const handleDungeonEnemyDefeated = useCallback((enemyKey?: string) => {
    setGameState(prev => ({
      ...prev,
      dungeonKills: (prev.dungeonKills ?? 0) + 1,
      /* WP4.6 — o BESTIÁRIO. A masmorra tem seis linhas × seis tiers e o jogo
         não guardava NADA do que o jogador enfrentou: cada run apagava a
         anterior. Registrar é o que transforma "matei uns bichos" em coleção.
         Só cresce, e o `Set` mantém a idempotência (matar o mesmo tipo cem
         vezes é uma entrada). */
      bestiary: enemyKey && !(prev.bestiary ?? []).includes(enemyKey)
        ? [...(prev.bestiary ?? []), enemyKey]
        : prev.bestiary,
    }));
  }, []);

  /* 🫧 CONVITE AO REFÚGIO — a regra inteira é de `utils/refugio/convite.ts`;
     aqui só se grava o estado e se navega. Nada paga, nada conta. */
  const handleRefugeShown = useCallback(() => {
    setGameState(prev => {
      const next = markRefugeShown(prev.refugeInvite, playerDayIso(new Date(), prev.playerDayTz));
      return next === prev.refugeInvite ? prev : { ...prev, refugeInvite: next };
    });
  }, [setGameState]);
  const handleRefugeDismiss = useCallback(() => {
    setGameState(prev => ({ ...prev, refugeInvite: dismissRefugeInvite(prev.refugeInvite, playerDayIso(new Date(), prev.playerDayTz)) }));
  }, [setGameState]);
  const handleRefugeAccept = useCallback(() => {
    setGameState(prev => ({ ...prev, refugeInvite: acceptRefugeInvite(prev.refugeInvite, playerDayIso(new Date(), prev.playerDayTz)) }));
    setRefugeLaunch(true);
  }, [setGameState]);
  const handleRefugeLaunchConsumed = useCallback(() => setRefugeLaunch(false), []);

  const handleDinoScore = useCallback((score: number) => {
    setGameState(prev => (score > (prev.dinoBest ?? 0) ? { ...prev, dinoBest: score } : prev));
  }, []);

  // Mission progress — derived from GameState counters. Dino's best also reads
  // the pre-existing localStorage record so old feats keep counting.
  const missionState = {
    evolutionStage: gameState.evolutionStage,
    unlockedEvolutions: gameState.unlockedEvolutions,
    dungeonKills: gameState.dungeonKills ?? 0,
    dungeonRunsCompleted: gameState.dungeonRunsCompleted ?? 0,
    dinoBest: Math.max(gameState.dinoBest ?? 0, readNumber(STORAGE_KEYS.DINO_BEST, 0)),
    totalPerfectDays: gameState.totalPerfectDays ?? 0,
    // #41/#60 (22/09/2026): a MISSÃO segue contando o 🌀; a CONQUISTA não.
    // `?? totalPerfectDays` para save anterior à decisão não andar para trás.
    missionPerfectDays: gameState.missionPerfectDays ?? gameState.totalPerfectDays ?? 0,
  };
  const missionProgress = getMissionProgress(missionState);

  /**
   * O buff de brincar já foi gasto NESTA sessão de minijogo?
   *
   * Existe porque uma run de Masmorra credita Bits VÁRIAS vezes (por inimigo e
   * por andar) dentro do mesmo tick de render: sem esta trava, `gameState`
   * ainda traria o buff nas chamadas seguintes e o +20% seria aplicado de novo
   * a cada inimigo. Volta a `false` quando uma brincadeira nova concede o buff.
   */
  const playBuffSpentRef = useRef(false);

  // 🪙 Bits — minigame currency; accumulates in GameState (cloud-synced), spent in the shop.
  // O buff de BRINCAR (utils/petNeeds.ts) é consumido AQUI, que é o funil único
  // por onde passam os Bits de Dino, PPT e Masmorra. `minigameMultiplier` é
  // sempre ≥ 1 por construção — este caminho não tem como reduzir ganho.
  const handleEarnGamePoints = useCallback((pts: number) => {
    if (pts <= 0) return;
    const mult = playBuffSpentRef.current ? 1 : minigameMultiplier(gameState, new Date());
    const total = mult > 1 ? Math.round(pts * mult) : pts;
    setGameState(prev => {
      // Gasta o buff junto do crédito: assim ele nunca sobrevive ao minijogo
      // que ele bonificou. `consumeBuff` mantém `playLog.date` (1×/dia segue
      // de pé). O spread vem ANTES do `gamePoints` — invertido, o estado
      // devolvido por `consumeBuff` sobrescreveria os Bits recém-creditados.
      const base = mult > 1 ? consumeBuff(prev) : prev;
      /* 💠 #61/#63 — o TETO DE BITS DE MINIJOGO do dia
         (`MINIGAME_BITS_PER_DAY`, `utils/currencies.ts`, onde está escrito por
         que ele é em Bits/dia e não em runs/dia). Este handler é o funil ÚNICO
         de Dino, PPT e Masmorra, então uma linha aqui cobre os três. A regra é
         pura e mora no updater junto do crédito: a masmorra credita várias
         vezes por run no mesmo lote do React, e um teto lido de fora passaria
         duas vezes (família de bug do X-6). Bater o teto não tira nada e não
         interrompe minijogo nenhum — os Bits só param de somar. */
      return creditMinigameBits(base, total, playerDayKey(new Date(), prev.playerDayTz));
    });
    if (mult > 1) {
      // Fora do updater (footgun 6): no StrictMode ele roda 2×.
      playBuffSpentRef.current = true;
      toast(language === 'pt-BR'
        ? `🎈 A brincadeira rendeu: +${total - pts} Bits extras!`
        : `🎈 Playtime paid off: +${total - pts} bonus Bits!`);
    }
  }, [gameState, language, setGameState]);

  /**
   * BRINCAR — oferta, nunca obrigação (a regra inteira é de `utils/petNeeds.ts`).
   *
   * A recusa (`refused`) é uma frase carinhosa do pet, JAMAIS um erro vermelho:
   * "já brincamos hoje" e "falta energia" não são falhas do usuário, são a
   * oferta não estar de pé agora. Quem não brincou não perdeu nada — brincar
   * não entra em dia perfeito, HP nem evolução.
   */
  const handlePlay = useCallback(() => {
    const now = new Date();
    // Dia do JOGADOR: `playLog` mora no save e tem teto de 1×/dia. Com
    // `dayKeyOf` (o dia do APARELHO) o mesmo instante rendia dois nomes de dia
    // em fusos diferentes, e a segunda leitura reabria a oferta — teto furado em
    // ponto de atributo e num segundo multiplicador de Bits. Ver
    // `utils/petNeeds.fuso.test.ts`.
    const todayKey = playerDayKey(now, gameState.playerDayTz);
    const preview = play(gameState, todayKey, now);
    if (preview.refused) {
      /* Os dois toasts 🎈 SAÍRAM (canvas Home, E7): recusa de cuidado é fala
         do pet, nunca aviso do sistema. Quem recusa é o deck do
         `CompanionHUD` — "já brincou" é célula inerte, "sem energia" é a
         criatura falando no balão. Aqui só se garante que a regra não fura. */
      return;
    }
    contarMissao('play-days');
    setGameState(prev => play(prev, todayKey, now).state);
    playFeed();
    playBuffSpentRef.current = false; // buff novo, pronto para o próximo minijogo
    setMessageTrigger(prev => prev + 1);
  }, [gameState, language, setGameState]);

  /* A 5ª célula do deck, memoizada: `CompanionHUD` é `memo()` e um objeto
     novo por render anularia o memo (footgun 5). A MESMA régua do
     `handlePlay`: o que a UI oferece e o que o clique aceita têm de ser o
     mesmo dia do jogador. */
  const playDeck = useMemo(() => {
    const agoraPlay = new Date();
    const chave = playerDayKey(agoraPlay, gameState.playerDayTz);
    return {
      available: jaConcluiuAlgo,
      canPlay: canPlay(petNeedsView, chave),
      playedToday: playedToday(petNeedsView, chave),
      onPlay: handlePlay,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jaConcluiuAlgo, gameState.energyPoints, gameState.playLog, gameState.playerDayTz, handlePlay]);

  // 🛒 Shop purchase — charges points and applies the item's effect. Items can
  // be locked behind a mission (utils/shop.ts `unlock`).
  /**
   * Troca Créditos por Bits. O gasto de Crédito é do SERVIDOR (é dinheiro
   * real); os Bits só entram depois que ele confirma. A troca inversa não
   * existe — ver utils/currencies.ts.
   */
  const handleExchangeCredits = useCallback(async (creditos: number): Promise<boolean> => {
    const pack = BITS_EXCHANGE.find(p => p.credits === creditos);
    if (!pack) return false;
    const ent = await spendCredits(pack.credits, 'exchange-bits');
    if (!ent) {
      toast(language === 'pt-BR' ? 'Créditos insuficientes.' : 'Not enough credits.');
      return false;
    }
    setGameState(prev => ({
      ...prev,
      gamePoints: (prev.gamePoints ?? 0) + pack.bits,
      credits: ent.credits,
      accountTier: ent.tier,
    }));
    toast(language === 'pt-BR' ? `+${pack.bits} Bits!` : `+${pack.bits} Bits!`);
    return true;
  }, [language, setGameState]);

  const handleShopBuy = useCallback((itemId: string): boolean => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (!isShopItemUnlocked(item, missionProgress)) return false;
    // A recusa lida AQUI decide o retorno do botão e o som — efeito colateral
    // não entra em updater (footgun 6). Ela NÃO é mais a única: `applyShopBuy`
    // reconfere sobre o `prev` (utils/shopBuy.ts). Enquanto era só esta, dois
    // cliques no mesmo lote com saldo exatamente igual ao preço passavam os
    // dois — saldo negativo, e o cenário entrando duas vezes na lista de posse.
    if (shopBuyRefusal(gameState, item)) return false;

    setGameState(prev => applyShopBuy(prev, item).state);
    // C-3 (run `som-01`): comprar deixa de soar como COMER. Era o mesmo som
    // para o unico evento do app que gasta moeda, e o gasto e irreversivel —
    // quem nao olha a tela nao tinha como distinguir os dois. Categoria
    // "transacao" ainda nao tem som proprio; ate ter, o canal e o visual:
    // `setGameState` roda ANTES daqui e saldo/posse ja aparecem no proximo
    // render (R-33).
    return true;
    // `gameState` inteiro: a recusa externa lê saldo em DUAS moedas e as duas
    // listas de posse, e `gameState.emblems` estava faltando na lista antiga —
    // a compra em Emblemas decidia sobre um saldo velho.
  }, [gameState, missionProgress]);

  /** Emblemas ganhos: UM caminho só, o do Torneio E o do resgate da Feira (a mesma moeda). */
  const earnEmblems = useCallback((amount: number) => {
    setGameState(prev => ({ ...prev, emblems: (prev.emblems ?? 0) + amount }));
  }, [setGameState]);

  /** Resgate da Feira confirmado pelo servidor (a folha já filtrou o recibo repetido): Emblemas +
   *  a Concha da Maré, quando veio. Idempotente para a peça (`grantGuildTrophy`). */
  const handleGuildClaimed = useCallback((claim: { emblems: number; trophyId: string | null }) => {
    earnEmblems(claim.emblems);
    const trophyId = claim.trophyId;
    if (trophyId) setGameState(prev => grantGuildTrophy(prev, trophyId));
  }, [earnEmblems, setGameState]);

  /** Cenários que a Feira/Salão diz já liberados (chegam pela folha; os do `useGroveWatch` seguem o outro caminho). */
  const handleGuildScenes = useCallback((ids: string[]) => {
    setGameState(prev => grantGuildScenes(prev, ids));
  }, [setGameState]);

  const handleEquipBackground = useCallback((id: string | null) => {
    setGameState(prev => ({ ...prev, equippedBackground: id }));
  }, []);

  /**
   * Equipa/desequipa decoração. `id` null limpa o espaço; caso contrário o item
   * ocupa o SEU espaço, substituindo quem estava lá. Não existe "equipar em
   * outro lugar" — o espaço faz parte da identidade do item, porque a arte é
   * desenhada para aquela caixa (utils/petStage.ts).
   */
  const handleEquipFurniture = useCallback((id: string | null, slot: SlotId) => {
    setGameState(prev => ({ ...prev, equippedDecor: applyDecorEquip(prev.equippedDecor ?? {}, id, slot) }));
  }, []);

  // 💎 Créditos (monetização) — TODA operação de saldo passa pelo SERVIDOR
  // (utils/entitlements.ts). O `credits` do GameState é só espelho pra UI;
  // quem decide é functions/api/_entitlements.js. Nunca aplique o efeito de
  // uma compra sem o servidor ter confirmado.
  const syncEntitlement = useCallback((ent: { tier: 'demo' | 'paid'; credits: number }) => {
    setGameState(prev => ({ ...prev, credits: ent.credits, accountTier: ent.tier }));
  }, []);

  const handleWatchAd = useCallback(async (): Promise<boolean> => {
    const ent = await claimAdReward();
    if (!ent) return false;
    syncEntitlement(ent);
    return true;
  }, [syncEntitlement]);

  const handleBuyCreditPack = useCallback(async (pack: CreditPack): Promise<boolean> => {
    const result = await purchase(pack.id);
    if (!result.ok) return false;
    syncEntitlement(result.ent);
    return true;
  }, [syncEntitlement]);

  /* ⚰️ D7 + D15 (06/09/2026) — a CURA INSTANTÂNEA por Créditos foi REMOVIDA,
     junto com `utils/instantHeal.ts` e o coraçãozinho na loja de Bits.

     O produto vendia a volta do coração por dois caminhos: 10 Créditos aqui, e
     15 Créditos pelo câmbio Créditos→Bits→💗 (sem cap). Enquanto existiam, a
     tese "dinheiro nunca compra a barra de cuidado" precisava de um asterisco,
     e havia incentivo estrutural para o coração doer — se não dói, a cura não
     vale 10 Créditos; se vale, alguém vai querer que doa mais.

     O coraçãozinho CONTINUA existindo e curando: ele só deixou de ser
     comprável. Vem da masmorra (`handleDungeonHeartDrop`, drop raro) e se usa
     na pastinha por `SPECIAL_ITEMS` — catálogo diferente de `SHOP_ITEMS`, e foi
     isso que permitiu cortar a compra sem quebrar o item de quem já tem um.
     Cura mesmo continua sendo CARINHO.

     Não reintroduza por nenhum dos dois caminhos. Ver §15 do
     `docs/PLANO-MELHORIAS.md`. */


  // Reroll: regenera o personagem do oráculo com uma seed NOVA (mesmos dados
  // de nascimento salvos no onboarding) — recomeça do Rookie, mantém
  // atividades/tarefas e Bits. Só existe pra contas 'paid' (modo demo não tem
  // perfil de oráculo salvo).
  /**
   * NOVA LEITURA (WP5.7 / decisão H.4) — o que era um sorteio pago.
   *
   * A semente vinha de `Math.random()`: 50 Créditos de dinheiro real por um
   * resultado aleatório, que o próprio `termos.html` chamava de "sorteio pago".
   * Era a única violação declarada da lista de proibições ainda de pé no
   * código, e ela desmentia a promessa central do produto ("a criatura veio de
   * VOCÊ") exatamente no momento em que essa promessa custa mais caro.
   *
   * Agora a semente sai das RESPOSTAS (`utils/newReading.ts`), e a tela diz a
   * regra antes de cobrar. `readings` é um contador que só avança quando uma
   * leitura é CONCLUÍDA — abrir a tela e desistir não muda nada, e por isso
   * repetir a mesma resposta continua devolvendo a mesma criatura.
   */
  const handleNewReading = useCallback(async (novasRespostas: Record<string, string>): Promise<boolean> => {
    const saved = readJson<(OracleInput & { seed: number; readings?: number }) | null>(
      STORAGE_KEYS.SOULMON_PROFILE, null);
    // Confere o perfil ANTES de cobrar — cobrar e depois falhar seria roubo.
    if (!saved) return false;
    const leituras = Number(saved.readings ?? 0) + 1;
    const newSeed = readingSeed(novasRespostas, leituras);
    saved.answers = novasRespostas;
    // GERA ANTES DE COBRAR. Conferir só a existência do perfil não bastava: um
    // perfil salvo corrompido (sem `oracle.classElements`, sem `psychometric`,
    // sem `astrology`) faz a geração lançar — e a ordem antiga já tinha
    // debitado os 50 Créditos de DINHEIRO REAL. Cobrar e falhar seria roubo,
    // e o comentário acima só valia para metade dos modos de falha.
    // Perfil novo (tem soulProfile) → pipeline completo: o reroll re-sorteia
    // também a criatura-inspiração do bestiário, não só a parte criativa.
    // Perfil de antes da troca de motor → caminho legado, intacto.
    let result: OracleResult;
    try {
      if (saved.soulProfile) {
        const { generateOracleComplete } = await import('./utils/soulProfile');
        result = (await generateOracleComplete(saved, newSeed)).result;
      } else {
        const { generateOracleAsync } = await import('./utils/oracle');
        result = await generateOracleAsync(saved, newSeed);
      }
    } catch {
      return false; // nada foi cobrado
    }
    const ent = await spendCredits(REROLL_COST_CREDITS, 'reroll');
    if (!ent) return false;
    // Reroll JA COBRADO em Creditos (dinheiro real): perder a seed nova e
    // perder o que a pessoa pagou. AVISA.
    writeJson(STORAGE_KEYS.SOULMON_PROFILE, { ...saved, seed: result.seed, readings: leituras });
    const GENERIC_LINES = ['ignar', 'lumel', 'serah'] as const;
    const genericLine = GENERIC_LINES[hashString(String(result.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);
    setGameState(prev => ({
      ...prev,
      credits: ent.credits,
      accountTier: ent.tier,
      eggType: genericLine,
      evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'],
      healthPoints: getMaxHPForStage('rookie'),
      maxHealthPoints: getMaxHPForStage('rookie'),
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      perfectDays: 0,
      powerPoints: 0,
      harmonyPoints: 0,
      benevolencePoints: 0,
      attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
      currentBranch: 'harmony',
      degeneratedByHP: false,
      soulmonStages: result.creature.stages,
      soulmonMeta: {
        seed: result.seed,
        baseName: result.creature.baseName,
        dominantElement: result.dominantElement,
        dominantAlignment: result.dominantAlignment,
        dominantRealm: result.dominantRealm,
      },
    }));
    return true;
  }, []);

  /**
   * RENASCIMENTO (`utils/rebirth.ts`). Parece a Nova Leitura e é o oposto
   * dela em três pontos que importam:
   *  · **não cobra nada** — o preço já foi pago em meses de cuidado, e o
   *    Rebirth é o que se ganha por ter chegado ao ultra;
   *  · **não zera coleção**: `unlockedEvolutions`, `perfectDays` e tudo mais
   *    passam intactos (a Nova Leitura zera, porque ali a criatura é OUTRA
   *    desde a origem; aqui é a mesma alma renascida);
   *  · a semente vem das ESCOLHAS do jogador, não das respostas sobre ele.
   *
   * Gera ANTES de escrever, pelo mesmo motivo do reroll: perfil corrompido
   * faz a geração lançar, e um Rebirth que consome a única chance do save
   * sem entregar criatura seria a pior falha possível deste app.
   */
  const handleRebirth = useCallback(async (choices: RebirthChoices): Promise<boolean> => {
    if (!canRebirth(gameState)) return false;
    const saved = readJson<(OracleInput & { seed: number }) | null>(
      STORAGE_KEYS.SOULMON_PROFILE, null);
    if (!saved) return false;

    const escolaNome = rebirthEscolaOptions().find(o => o.id === choices.escola)?.nome ?? '';
    const elementoNome = rebirthElementOptions().find(o => o.id === choices.elemento)?.nome ?? '';
    if (!escolaNome || !elementoNome) return false;

    // Fase 3 (decisão 1): o traço herdado do ciclo anterior sai do save
    // (`herancaDoCiclo`), nunca da tela — o jogador escolhe três coisas, e a
    // quarta é o que ficou dele mesmo.
    const heranca = herancaDoCiclo(gameState);
    const comEscolhas: OracleInput = {
      ...saved,
      rebirth: {
        criatura: choices.criatura, escolaNome, elementoNome,
        ...(heranca ? { herdado: { elemento: heranca.elemento as ElementId } } : {}),
      },
    };
    // Semente própria: duas pessoas que escolherem a mesma criatura, escola e
    // elemento sobre leituras diferentes continuam recebendo bichos
    // diferentes — a leitura de quem elas são segue no meio.
    const novaSeed = hashString(
      `${saved.seed}|${choices.criatura}|${choices.escola}|${choices.elemento}`,
    );
    let result: OracleResult;
    try {
      if (saved.soulProfile) {
        const { generateOracleComplete } = await import('./utils/soulProfile');
        result = (await generateOracleComplete(comEscolhas, novaSeed)).result;
      } else {
        const { generateOracleAsync } = await import('./utils/oracle');
        result = await generateOracleAsync(comEscolhas, novaSeed);
      }
    } catch {
      return false; // a chance única NÃO foi gasta
    }

    writeJson(STORAGE_KEYS.SOULMON_PROFILE, { ...comEscolhas, seed: result.seed });
    // A decisão de SE renasce é tomada aqui fora, sobre o estado que a tela
    // viu; o updater só reaplica a mesma função pura sobre o `prev` — nada de
    // escrever variável de fora dentro dele (footgun 6: StrictMode invoca 2×,
    // e `applyRebirth` é idempotente justamente para a 2ª passada ser inócua).
    const now = new Date();
    if (!applyRebirth(gameState, choices, now).applied) return false;
    setGameState(prev => {
      const { state, applied } = applyRebirth(prev, choices, now);
      if (!applied) return prev;
      return {
        ...state,
        healthPoints: getMaxHPForStage('rookie'),
        maxHealthPoints: getMaxHPForStage('rookie'),
        maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
        attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
        currentBranch: 'harmony',
        degeneratedByHP: false,
        soulmonStages: result.creature.stages,
        soulmonMeta: {
          seed: result.seed,
          baseName: result.creature.baseName,
          dominantElement: result.dominantElement,
          dominantAlignment: result.dominantAlignment,
          dominantRealm: result.dominantRealm,
        },
      };
    });
    /* 🥚 #62 — o teto VITALÍCIO de sprite volta a zero no renascimento
       (decisão do dono, 22/09/2026). Ele mora no servidor
       (`ent:<saveId>.aiLifetime.sprite`) porque o cliente é editável, então
       tudo o que cabe aqui é avisar. `void` de propósito: a rota é idempotente
       e confere sozinha que o renascimento aconteceu, e **falhar não pode
       bloquear o renascimento** — ele é uma vez só na vida do save, e perdê-lo
       por um erro de rede seria um dano irreversível para economizar imagem. */
    void resetSpriteLifetimeAfterRebirth();
    return true;
  }, [gameState]);

  // Desbloqueio completo comprado NO MEIO do jogo (UnlockAccountModal.tsx).
  // O servidor já confirmou a compra quando isto roda.
  const handleAccountUnlocked = useCallback((ent: Entitlement) => {
    // `purchase` no ponto em que o SERVIDOR já confirmou — não no clique, que
    // contaria intenção como receita. `flushTelemetry` porque a compra costuma
    // ser seguida de saída do app, e 5s de debounce perderia o evento mais caro
    // que existe aqui.
    // WP0.9 — `reason` com o MESMO vocabulário do convite, para compra e
    // convite serem comparáveis: sem ele, todas as compras eram um número só
    // e não dava para saber qual convite trouxe cada uma.
    track('purchase', { reason: unlockReasonCode(unlockReason ?? 'task-limit') });
    flushTelemetry();
    syncEntitlement(ent);
    setUnlockReason(null);
    // A compra promete "uma criatura gerada só pra você" — o ritual do oráculo
    // é o que entrega isso. Sem este passo o jogador pagaria e continuaria com
    // o personagem de demonstração.
    setUpgradeRitual(true);
  }, [syncEntitlement]);

  // Fim do ritual pós-compra: troca SÓ a criatura. Estágio, atividades,
  // tarefas, Bits e histórico continuam de pé — mandar quem acabou de pagar de
  // volta pro Rookie seria punir a compra (diferente do reroll, que é escolha
  // explícita e avisa que reseta).
  const handleUpgradeRevealed = useCallback((
    result: OracleResult,
    revealSprite?: { url: string; formId: string; at: number },
  ) => {
    setUpgradeRitual(false);
    const GENERIC_LINES = ['ignar', 'lumel', 'serah'] as const;
    const genericLine = GENERIC_LINES[hashString(String(result.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);
    setGameState(prev => ({
      ...prev,
      accountTier: 'paid',
      eggType: genericLine,
      demoCharacterId: undefined,
      /* `bornAt` NÃO é tocado aqui, e a ausência é a decisão (D17): o upgrade
         é "trocou de pele", não "nasceu de novo". Quem joga há 40 dias
         continua tendo 40 dias juntos depois de comprar — comprar não pode
         zerar o único número do produto que só sobe. Se um save de antes do
         WP1.16 chegar aqui sem `bornAt`, ele continua sem: inferir a data de
         outra coisa seria inventar. */
      soulmonStages: result.creature.stages,
      /* Adota o desenho do reveal, exatamente como o nascimento faz. Sem isto
         o acervo de quem acabou de comprar (que nasce VAZIO — o demo nunca
         gera sprite) pediria a forma inicial de novo e entregaria outro bicho.
         `adopt: 'now'` porque aqui também não há história a proteger: é a
         primeira criatura autoral deste save. */
      spriteLibrary: revealSprite
        ? recordSprite(prev.spriteLibrary ?? emptySpriteLibrary(), revealSprite, { adopt: 'now' })
        : prev.spriteLibrary,
      soulmonMeta: {
        seed: result.seed,
        baseName: result.creature.baseName,
        dominantElement: result.dominantElement,
        dominantAlignment: result.dominantAlignment,
        dominantRealm: result.dominantRealm,
      },
      /* WP4.29 — o relógio da incubação zera com a criatura, pelo MESMO motivo
         que zera no Renascimento (`utils/rebirth.ts`): ele é por FORMA e
         sobrevive de propósito à degeneração (parecer R-L), mas a fronteira
         daquele perdão é *dentro da mesma vida*. As formas aqui são outras
         (`soulmonStages` acabou de ser substituído), então um `since` da
         criatura anterior seria carimbo herdado — liberaria a primeira
         evolução da criatura nova sem incubação nenhuma.
         ⚠️ Note que isto NÃO contradiz o `bornAt` logo acima: lá o que se
         preserva é o tempo JUNTOS, que é do jogador; aqui o que se descarta é
         um relógio que pertencia a formas que não existem mais. */
      incubation: emptyIncubation(),
    }));
  }, []);

  // 🔒 Evolution padlock (Evolution page): tapping the current Soulmon toggles
  // it. While locked, the pet never evolves at the day turn; unlocking lets the
  // (already met) criteria trigger the evolution on the NEXT day turn.
  // Cache das skills no save: a página do Pet recomputa do perfil local e
  // devolve aqui, para o conteúdo sobreviver a um aparelho novo (o perfil do
  // oráculo não sobe para a nuvem, as skills agora sim).
  const handleSkillsComputed = useCallback((skills: NonNullable<GameState['soulmonSkills']>) => {
    setGameState(prev => (prev.soulmonSkills ? prev : { ...prev, soulmonSkills: skills }));
  }, [setGameState]);

  const handleClassTitlesComputed = useCallback((titles: NonNullable<GameState['soulmonClassTitles']>) => {
    setGameState(prev => (prev.soulmonClassTitles ? prev : { ...prev, soulmonClassTitles: titles }));
  }, [setGameState]);

  // Fase 3 do Oráculo (decisão 2): o companheiro visível e nomeado, mesmo
  // padrão de cache — grava uma vez, nunca sobrescreve o que já está no save.
  const handleCompanheiroComputed = useCallback((companheiro: NonNullable<GameState['soulmonCompanheiro']>) => {
    setGameState(prev => (prev.soulmonCompanheiro ? prev : { ...prev, soulmonCompanheiro: companheiro }));
  }, [setGameState]);

  /* Fase 3 do Oráculo (§3, "nenhum cálculo sem manifestação"): talento →
     fala do pet, profissão → jeito na masmorra. Computado AQUI, na primeira
     abertura com perfil, e não só quando a Ficha é visitada — a Home e a fenda
     são as superfícies que consomem, então o cache não pode depender de uma
     visita à página do Pet (o precedente de `soulmonSkills` tem esse buraco).
     Imports dinâmicos: só a ficha (0,06 ms), nunca o barril `soulProfile`. */
  const manifestacaoPronta = !!gameState.soulmonManifestacao;
  useEffect(() => {
    if (manifestacaoPronta) return;
    const saved = readJson<(OracleInput & { seed: number }) | null>(STORAGE_KEYS.SOULMON_PROFILE, null);
    if (!saved?.soulProfile) return;
    let vivo = true;
    Promise.all([
      import('./utils/soulProfile/ficha/fromInput'),
      import('./utils/soulProfile/identity'),
      import('./utils/soulProfile/ficha/manifestacao'),
    ]).then(([{ buildFichaESkills }, { identityKey }, { manifestacaoDaFicha }]) => {
      if (!vivo) return;
      const m = manifestacaoDaFicha(buildFichaESkills(saved, identityKey(saved)).fichaByStage);
      setGameState(prev => (prev.soulmonManifestacao ? prev : { ...prev, soulmonManifestacao: m }));
    }).catch(() => { /* perfil corrompido: a masmorra e a voz seguem no padrão */ });
    return () => { vivo = false; };
  }, [manifestacaoPronta, setGameState]);
  const manifestacaoAtual = gameState.soulmonManifestacao?.[getStageLevel(gameState.evolutionStage) as keyof Manifestacao];

  const handleToggleEvolutionLock = useCallback(() => {
    setGameState(prev => ({ ...prev, evolutionLocked: !(prev.evolutionLocked ?? false) }));
  }, []);

  /* minimal-ui F2: a MOCHILA da Home substitui a pastinha como entrada de
     item. Abrir a mochila apaga o ponto de "item novo", como a pastinha fazia. */
  const handleBackpackSeen = useCallback(() => setNewItemsReady(false), []);

  // Show the daily report once when a fresh reset summary exists.
  useEffect(() => {
    const report = gameState.lastDayReport;
    if (!report) return;
    if (readLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN) === report.date) return;
    setShowDailyReport(true);
  }, [gameState.lastDayReport]);

  /**
   * WP2.15 — os DOIS eventos da virada, emitidos aqui e não lá dentro.
   *
   * `welcome_back` e `shield_used` estavam no `EVENT_SCHEMA` desde o WP0.5 e
   * **nunca eram emitidos**: o schema existia, a régua não. Sem eles, a decisão
   * D3 (baixar `REST_SHIELD_MAX` de 3 para 2) seria tomada no escuro — o escudo
   * é consumido em silêncio de propósito, e por isso ninguém nunca soube com
   * que frequência ele salvou alguém.
   *
   * **Por que num efeito, e não em `computeDailyReset`:** a virada roda dentro
   * de `setGameState(prev => …)`, e o StrictMode invoca updater duas vezes
   * (footgun 6) — telemetria ali contaria tudo em dobro. O efeito observa o
   * RESULTADO, que é a única leitura honesta.
   *
   * A trava é a mesma chave que já impede o relatório de reaparecer: um
   * `lastDayReport` que já foi contado não conta de novo, nem depois de recarregar.
   */
  const viradaContadaRef = useRef<string | null>(null);
  useEffect(() => {
    const report = gameState.lastDayReport;
    if (!report?.date) return;
    if (viradaContadaRef.current === report.date) return;
    viradaContadaRef.current = report.date;

    // `days` é FAIXA, nunca o número cru: dia exato de retorno, cruzado com o
    // resto, começa a descrever uma pessoa. 0 = voltou no dia seguinte,
    // 1 = 2–4 dias, 2 = 5–14, 3 = 15+.
    if (report.welcomeBack) {
      const d = Number(report.daysAway ?? 0);
      track('welcome_back', { days: d <= 1 ? 0 : d <= 4 ? 1 : d <= 14 ? 2 : 3 });
    }
    // UMA vez por virada em que ALGUM escudo foi gasto — a pergunta da D3 é
    // "quantos dias o escudo salvou", que é por dia e não por hábito. O evento
    // não carrega props, então contar por hábito não seria representável.
    if (Number(report.shieldsSpent ?? 0) > 0) track('shield_used');

    /* WP0.10 — `after_bad_day`, fechado NO APARELHO.
       A pergunta é: depois de um dia ruim, a pessoa volta? E ela existe para
       UMA finalidade declarada — saber se o convite de carinho funciona.
       NUNCA para calibrar cobrança, que é o uso que esta mesma métrica torna
       possível e que o produto proíbe.
       A marca do dia ruim (`LAST_BAD_DAY`) fica no localStorage e não sai
       daqui: o que é despachado é a DISTÂNCIA em faixa. Data de dia ruim,
       cruzada com o resto, descreve uma pessoa. */
    /* A marca é `<data>|<kind>`: a data para medir a distância, e o TIPO do
       dia ruim que ficou para trás.
       ⚠️ O `kind` era a constante `1` — um bit que só assume um valor não
       carrega informação nenhuma, e mesmo assim ocupava schema e uma linha na
       política em PT e EN (auditoria de 06/09/2026: o exemplar mais limpo de
       coleta ociosa do repositório). A distinção que o estudo especificou é a
       que importa: perder coração é a hipótese nº1 de churn; a DEGENERAÇÃO é
       outro evento, muito mais raro e muito mais caro. Voltar depois de uma
       não diz nada sobre voltar depois da outra. */
    const marca = readLocal(STORAGE_KEYS.LAST_BAD_DAY);
    const [diaRuim, kindRuim] = (marca ?? '').split('|');
    if (diaRuim && diaRuim !== report.date) {
      const dias = Math.round((Date.parse(report.date) - Date.parse(diaRuim)) / 86400000);
      if (Number.isFinite(dias) && dias > 0) {
        track('after_bad_day', {
          gap: afterBadDayGapBucket(dias),
          // Marca antiga (sem o `|`) cai em `heart`, que era o caso comum — e
          // nunca inventa uma degeneração que não se sabe se houve.
          kind: kindRuim === '1' ? TELEMETRY_BAD_DAY.degeneration : TELEMETRY_BAD_DAY.heart,
        });
      }
      removeLocal(STORAGE_KEYS.LAST_BAD_DAY);
    }
    // Dia ruim é o que CUSTOU coração — não "não foi perfeito". Um dia sem
    // dia perfeito é a maioria dos dias de qualquer pessoa; marcar todos eles
    // como ruins transformaria a métrica num contador de vida normal.
    if (Number(report.heartsLost ?? 0) > 0) {
      const tipo = report.degenerated ? TELEMETRY_BAD_DAY.degeneration : TELEMETRY_BAD_DAY.heart;
      writeLocal(STORAGE_KEYS.LAST_BAD_DAY, `${report.date}|${tipo}`, { silent: true });
    }
  }, [gameState.lastDayReport]);

  /**
   * WP2.15 — `bond_level`, o terceiro evento que existia e não saía.
   *
   * O nível do Vínculo NUNCA é persistido (é sempre `bondLevelFor(totalXP)`,
   * ver o footgun 9): então o evento também é derivado, e o que se compara é o
   * nível DERIVADO agora contra o da renderização anterior. Emitir na subida e
   * só na subida — o nível não desce, e um evento por render seria ruído.
   */
  /**
   * WP4.15 — a escada do Vínculo passa a ENTREGAR.
   *
   * `BOND_REWARDS` (12 itens, níveis 2–13) e `unclaimedBondRewards` estavam
   * escritos e testados, e `bondRewardsClaimed` nunca era escrito por ninguém:
   * um jogador no nível 11 tinha três decorações, dois cenários e três sonhos
   * esperando desde sempre e não sabia. Só o título chegava, porque é derivado.
   *
   * A regra mora em `applyBondRewards` (utils/bond.ts), que é PURA e
   * IDEMPOTENTE — rodar duas vezes no StrictMode não duplica nada. O anúncio
   * (fala do pet) fica FORA do updater, calculado do `gameState` de agora.
   */
  useEffect(() => {
    const pendentes = unclaimedBondRewards(
      gameState.totalXP ?? 0, gameState.bondRewardsClaimed ?? [],
    );
    if (pendentes.length === 0) return;
    setGameState(prev => applyBondRewards(prev).state);
    // Uma frase só, mesmo quando vários degraus caem juntos (save antigo que
    // nasce no nível 9): um toast por item viraria fila de notificação.
    const nomes = pendentes.map(r => (language === 'pt-BR' ? r.namePt : r.nameEn)).join(', ');
    toast(language === 'pt-BR'
      ? `O Vínculo de vocês rendeu: ${nomes}`
      : `Your bond brought you: ${nomes}`);
    setMessageTrigger(prev => prev + 1);
  }, [gameState.totalXP, gameState.bondRewardsClaimed, language, setGameState]);

  /**
   * WP1.16 — o aniversário da criatura.
   *
   * Uma fala, uma vez, no dia. Sem XP, sem item, sem push: o Vínculo não pede
   * ação nova, e um aniversário que rende recompensa vira mais uma coisa a não
   * perder. Usa o canal de fala que o WP3.8 acabou de religar — antes dele,
   * isto seria mais um sinal caindo no vazio.
   */
  const aniversarioRef = useRef<string | null>(null);
  useEffect(() => {
    const hoje = playerDayKey(new Date(), gameState.playerDayTz);
    if (aniversarioRef.current === hoje) return;
    const tipo = anniversaryOn(gameState.bornAt, hoje);
    if (!tipo) return;
    aniversarioRef.current = hoje;
    const nome = soulmonDisplayName(gameState.soulmonMeta);
    toast(language === 'pt-BR'
      ? (tipo === 'year'
        ? `Hoje faz um ano que você e ${nome} se conhecem.`
        : `Hoje faz um mês que você e ${nome} se conhecem.`)
      : (tipo === 'year'
        ? `Today is one year since you and ${nome} met.`
        : `Today is one month since you and ${nome} met.`));
    setMessageTrigger(prev => prev + 1);
  }, [gameState.bornAt, gameState.playerDayTz, gameState.soulmonMeta, language]);

  const bondLevelRef = useRef<number | null>(null);
  useEffect(() => {
    const nivel = bondLevelFor(gameState.totalXP ?? 0);
    const anterior = bondLevelRef.current;
    bondLevelRef.current = nivel;
    // `null` é a montagem: quem abre o app no nível 7 não "subiu" para o 7.
    if (anterior !== null && nivel > anterior) track('bond_level', { level: nivel });
  }, [gameState.totalXP]);

  /**
   * "Eu fiz, só esqueci de marcar." Devolve os corações que a virada cobrou —
   * mas NÃO o dia perfeito, que já passou. É o retro-tracking do Pokémon Sleep:
   * recupera o dano, não a glória.
   *
   * Dá para usar isso para não perder coração nunca. É de propósito: num app de
   * produtividade pessoal quem mente só engana a si mesmo, e o atrito de um
   * antifraude custaria mais aos honestos do que o benefício.
   */
  const handleRecoverHearts = useCallback(() => {
    setGameState(prev => {
      const report = prev.lastDayReport;
      if (!report || report.heartsRecovered || report.heartsLost <= 0) return prev;
      return {
        ...prev,
        healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + report.heartsLost),
        lastDayReport: { ...report, heartsRecovered: true },
      };
    });
  }, []);

  /**
   * Check-in de humor. É opcional, e o dado NUNCA entra em pontuação — nem em
   * dia perfeito, nem em HP, nem em evolução (há teste travando isso em
   * utils/mood.test.ts). Se virasse insumo de score, a pessoa passaria a
   * responder o que rende mais ponto em vez do que sente.
   */
  const handlePickMood = useCallback((mood: MoodValue) => {
    // Dia do JOGADOR: `moodLog` mora no save, e com o dia do aparelho o mesmo
    // dia rendia DUAS entradas em fusos diferentes (ver `utils/mood.ts`).
    const today = playerDayKey(new Date(), gameState.playerDayTz);
    setGameState(prev => ({ ...prev, moodLog: recordMood(prev.moodLog, today, mood) }));
    contarMissao('mood-checkins');
  }, [gameState.playerDayTz]);

  /**
   * A AVENTURA DA NOITE (`utils/adventure.ts`, `docs/PLANO-TAREFAS.md` §2.4).
   *
   * Derivada, nunca sorteada aqui: a seed é o `date` do próprio relatório, então
   * reabrir a tela devolve sempre o mesmo achado. Se o sorteio morasse num
   * `useState`, cada reabertura daria um achado novo — e a pessoa aprenderia a
   * reabrir o relatório em vez de viver o dia.
   *
   * `done` e `required` vêm do relatório, que é quem já sabe o que o dia foi.
   * Recalcular a meta aqui seria uma segunda cópia da regra (footgun 9).
   */
  /*
   * 🧭 O PASSEIO (30/09/2026, `utils/travessias.ts`) funde-se aqui: o achado
   * da noite passa a depender do destino e das regiões que a noite abriu.
   * O catálogo das regiões NÃO mora no chunk de entrada (orçamento de bytes):
   * `utils/travessias` só é carregado quando o save já mexeu no mapa
   * (`crossingsTouchMap`) — sem isso o achado é EXATAMENTE a Aventura comum,
   * e `adventureOfNight` responde sem o catálogo.
   */
  const crossings = gameState.crossings ?? CROSSINGS_EMPTY;
  const usaMapa = crossingsTouchMap(crossings);
  const [trv, setTrv] = useState<typeof import('./utils/travessias') | null>(null);
  useEffect(() => {
    if (!usaMapa || trv) return;
    let vivo = true;
    import('./utils/travessias').then(m => { if (vivo) setTrv(m); }).catch(() => { /* offline: tenta de novo no próximo render que precisar */ });
    return () => { vivo = false; };
  }, [usaMapa, trv]);

  const aventuraDaNoite = useMemo(() => {
    const r = gameState.lastDayReport;
    if (!r) return null;
    const entries = gameState.adventures ?? [];
    const c = gameState.crossings ?? CROSSINGS_EMPTY;
    if (trv) {
      // A noite se assenta ao ABRIR o relatório (efeito abaixo); a tela já
      // mostra o estado assentado para não piscar o achado comum antes.
      const settled = showDailyReport ? trv.settleNight(c, r.date).state : c;
      return trv.passeioFindOfDay({ crossings: settled, entries, feito: r.done, meta: r.required, dayKey: r.date });
    }
    // Mapa tocado e catálogo ainda chegando: espera um instante em vez de
    // mostrar um achado que vai trocar.
    if (crossingsTouchMap(c)) return null;
    return adventureOfNight(entries, r.done, r.required, r.date);
  }, [gameState.lastDayReport, gameState.adventures, gameState.crossings, trv, showDailyReport]);

  /** Inédito = não estava no diário ANTES desta noite. Só muda o rótulo na tela. */
  const aventuraInedita = useMemo(
    () => !!aventuraDaNoite && !(gameState.adventures ?? []).some(e =>
      e.id === aventuraDaNoite.id && e.day !== gameState.lastDayReport?.date),
    [aventuraDaNoite, gameState.adventures, gameState.lastDayReport],
  );

  /**
   * Guarda no diário assim que o relatório aparece — e, no MESMO passo, assenta
   * a noite do Passeio (`settleNight`: abre no máximo uma região guardada).
   *
   * Ao ABRIR e não ao fechar, ao contrário da memória de marco logo abaixo: a
   * memória é um evento raro que seria desperdiçado se contasse sem ser vista, e
   * o achado é o oposto — ele é o conteúdo da tela, e perdê-lo por fechar rápido
   * seria tirar da pessoa a única coisa que ela ganhou naquele dia.
   *
   * Footgun 6: o updater é PURO e reconfere tudo sobre `prev` (`settleNight` e
   * `collectAdventure` são idempotentes; StrictMode rodando 2× não abre duas
   * regiões nem duplica o diário). Nada mudou → devolve `prev`.
   */
  useEffect(() => {
    const r = gameState.lastDayReport;
    if (!showDailyReport || !r || !aventuraDaNoite) return;
    const dia = r.date;
    setGameState(prev => {
      const c0 = prev.crossings ?? CROSSINGS_EMPTY;
      if (!trv && crossingsTouchMap(c0)) return prev;
      const c1 = trv ? trv.settleNight(c0, dia).state : c0;
      const diario = prev.adventures ?? [];
      const achado = trv
        ? trv.passeioFindOfDay({ crossings: c1, entries: diario, feito: r.done, meta: r.required, dayKey: dia })
        : adventureOfNight(diario, r.done, r.required, dia);
      const novoDiario = collectAdventure(diario, achado.id, dia);
      const diarioMudou = novoDiario.length !== diario.length;
      if (c1 === c0 && !diarioMudou) return prev;
      return {
        ...prev,
        ...(c1 !== c0 ? { crossings: c1 } : {}),
        ...(diarioMudou ? { adventures: novoDiario } : {}),
      };
    });
  }, [showDailyReport, aventuraDaNoite, gameState.lastDayReport, trv, setGameState]);

  /** A folha do Passeio muda o estado por uma função PURA sobre `prev` (footgun 6). */
  const handleCrossings = useCallback((f: (c: CrossingsState) => CrossingsState) => {
    setGameState(prev => {
      const c0 = prev.crossings ?? CROSSINGS_EMPTY;
      const c1 = f(c0);
      return c1 === c0 ? prev : { ...prev, crossings: c1 };
    });
  }, [setGameState]);

  /** O palco "passeando": o nome da região de destino (≠ casa), ou null. */
  const passeandoEm = useMemo(() => {
    const dest = crossings.destination;
    if (!trv || !dest || dest === HOME_REGION) return null;
    const r = trv.regionById(dest);
    return r ? (language === 'pt-BR' ? r.namePt : r.nameEn) : null;
  }, [trv, crossings.destination, language]);

  const handleCloseDailyReport = useCallback(() => {
    if (gameState.lastDayReport) {
      // "ja mostrei o relatorio hoje": no pior caso ele reabre. Silencioso.
      writeLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN, gameState.lastDayReport.date, { silent: true });
    }
    setShowDailyReport(false);
  }, [gameState.lastDayReport]);

  // ═══════════════════════════════════════════════════════════════════════════
  // OS RITUAIS (docs/PLANO-TAREFAS.md §2.4) — check-in, triagem, sono, semana
  // ═══════════════════════════════════════════════════════════════════════════

  /** 'YYYY-MM-DD' local — o formato que os `<input type="date">` do app usam e
   *  que `taskTriage`/`rituals` sabem ler. `toISOString` daria o dia ERRADO em
   *  fuso negativo (é UTC), que é o bug clássico deste campo. */
  const isoDay = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  /**
   * Abre o check-in matinal UMA vez por dia.
   *
   * Mesmo padrão do `DailyReportModal` ("mostrar 1× por dia"), só que a marca
   * mora no save (`lastCheckInDate`) em vez do localStorage: o ritual é do
   * jogador, não do aparelho, e reabri-lo em cada celular seria transformar
   * planejamento em interrupção.
   *
   * O `ref` é o que impede o efeito de reabrir a tela a cada `setGameState` —
   * `gameState` está nas deps porque o plano depende dele, e sem a trava o
   * check-in voltaria sozinho depois de qualquer alteração de estado.
   *
   * Não abre com o plano vazio (usuário sem hábito e sem tarefa): um ritual de
   * planejamento sobre uma lista vazia é só uma tela a mais entre a pessoa e o
   * pet dela.
   */
  /* A trava guarda o DIA, não um booleano de sessão. Sendo `true` para sempre,
     ela era definitiva por sessão: numa PWA/desktop deixada aberta a noite
     toda, no dia seguinte `needsCheckIn` voltava a ser verdadeiro e o efeito
     retornava na primeira linha — o ritual só reaparecia depois de um reload
     que ninguém faz. Comparar com o dia de hoje rearma sozinho na virada. */
  const checkInPromptedRef = useRef<string | null>(null);
  useEffect(() => {
    const now = new Date();
    // Mesma régua de `needsCheckIn`: com `dayKeyOf` aqui, a trava de sessão
    // rearmaria na virada do APARELHO e a leitura na virada do JOGADOR.
    const hoje = playerDayKey(now, gameState.playerDayTz);
    if (checkInPromptedRef.current === hoje) return;
    if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
    if (!needsCheckIn(gameState, now)) return;
    const plan = checkInPlan(gameState, now);
    if (plan.habitsToday.length === 0 && plan.suggestedFocus.length === 0 && plan.carryOver.length === 0) return;
    checkInPromptedRef.current = hoje;
    // WP0.14: o DENOMINADOR de `checkin_commit`, emitido no único ponto que
    // sabe que a oferta chegou à tela — depois de todos os gates, antes do
    // modal. Dedupe diário em `ONCE_PER_DAY`.
    track('checkin_shown');
    setCheckInPlanData(plan);
  }, [gameState, hasCompletedOnboarding, hasCompletedTutorial]);

  /** Fecha o check-in gravando os focos escolhidos (a regra é de `setFocus`). */
  const handleCheckInConfirm = useCallback((focusIds: string[]) => {
    // `playerDayKey` e NÃO `dayKeyOf`: quem lê este carimbo é `needsCheckIn`,
    // que passou a contar o dia do jogador. Gravar aqui com a chave do aparelho
    // deixaria a leitura e a escrita em réguas diferentes — o pior dos dois
    // mundos, porque o ritual reabriria no MESMO aparelho.
    const dayKey = playerDayKey(new Date(), gameState.playerDayTz);
    contarMissao('checkins');
    // 🔗 Vínculo: o check-in é evento de esforço que JÁ existia (`bondXP`), e
    // ele é naturalmente 1×/dia — `lastCheckInDate` é a mesma trava que impede
    // o ritual de reabrir, então não há teto a inventar aqui.
    setGameState(prev => awardBondXP(
      completeCheckIn(prev, focusIds, dayKey), { kind: 'checkIn' }, dayKey,
    ));
    // WP2.3: só o CONFIRM emite — pular não é compromisso e não conta.
    // Fora do updater (footgun 6: StrictMode invoca updater 2×).
    track('checkin_commit', { focus_count: Math.min(focusIds.length, MAX_DAILY_FOCUS) });
    setCheckInPlanData(null);
  }, [setGameState, gameState.playerDayTz]);

  /**
   * Pular. Marca o dia do mesmo jeito — e isso é de propósito: um ritual que
   * reaparece porque você não quis fazê-lo é cobrança, e o app não cobra.
   */
  const handleCheckInSkip = useCallback(() => {
    const dayKey = playerDayKey(new Date(), gameState.playerDayTz);
    setGameState(prev => ({ ...prev, lastCheckInDate: dayKey }));
    setCheckInPlanData(null);
  }, [setGameState, gameState.playerDayTz]);

  /**
   * "Arrumar a pilha" — o Smart Schedule do Todoist com ergonomia de jogo.
   *
   * Cada carta vira uma chamada de `taskTriage`, e nenhuma regra é reescrita
   * aqui: 'today' devolve a tarefa ao Hoje (`toOpen` + `startDate` de hoje),
   * 'week' é um adiamento CONTADO (`postpone`, +7 dias — é o contador do
   * Sunsama que torna evitação crônica um dado), 'someday' é a lista inerte do
   * Things 3 e 'drop' é o Won't Do do TickTick, terminal e reversível.
   */
  const handleOpenTriage = useCallback(() => {
    setTriageTasks(triageQueue(gameState.tasks, new Date()));
  }, [gameState.tasks]);

  /* Handlers do SLOT DO DIA. `useCallback` com deps vazias (todos são setters
     de estado, estáveis por contrato do React) — e não lambdas inline: a Home
     re-renderiza a cada tick de jogo, e função nova por render é o que anula
     `memo()` mundo abaixo (footgun 5). */
  const handleDismissHpBanner = useCallback(() => setHpBannerDismissed(true), []);
  const handleDismissFreshStart = useCallback(() => setFreshStartDismissed(true), []);
  const handleTermsNoticeOk = useCallback(() => {
    // Gravar FORA do updater (footgun 6): a marca é uma string fixa, e a
    // segunda chamada do StrictMode escreveria o mesmo valor — mas o padrão é
    // o padrão.
    const marca = marcaAvisoTermos(TERMS_VERSION, PRIVACY_VERSION);
    writeLocal(STORAGE_KEYS.TERMS_NOTICE_SEEN, marca, { silent: true });
    setTermsNoticeSeen(marca);
  }, []);
  const handleToggleAvisos = useCallback(() => setAvisosAbertos(v => !v), []);

  const handleTriageResolve = useCallback((taskId: string, action: TriageAction) => {
    const now = new Date();
    const weekAhead = new Date(now.getTime());
    weekAhead.setDate(weekAhead.getDate() + 7);
    setGameState(prev => {
      const tasks = prev.tasks.map(task => {
        if (task.id !== taskId) return task;
        switch (action) {
          case 'today': return toOpen({ ...task, startDate: isoDay(now) }, now);
          case 'week': return postpone(task, now, isoDay(weekAhead));
          case 'someday': return toSomeday(task, now);
          case 'drop': return drop(task, now);
          default: return task;
        }
      });
      const proximo = { ...prev, tasks };
      /* 🔗 #59b — 🧹 PILHA ARRUMADA. Premia ESVAZIAR a fila, nunca a carta:
         pagar por carta seria recompensa por CONTAGEM (linha vermelha #16), e
         o que alivia é ter terminado de planejar (Masicampo & Baumeister), não
         ter mexido em N itens. A fila é recontada sobre o estado JÁ aplicado. */
      return triageQueue(tasks, now).length === 0 && triageQueue(prev.tasks, now).length > 0
        ? awardBondXP(proximo, { kind: 'triageCleared' }, playerDayKey(now, prev.playerDayTz))
        : proximo;
    });
  }, [setGameState]);

  /**
   * Registra a NOITE quando o pet dorme e quando acorda (`recordNight`).
   *
   * Fica num efeito sobre `isSleeping` — e não dentro do `handleSleep` — porque
   * o sono AUTOMÁTICO (a janela das Configurações) também troca esse estado, e
   * um registro preso ao botão perderia justamente as noites de quem configurou
   * o app para não precisar do botão.
   *
   * O `ref` começa em `null` e a primeira execução só sincroniza: abrir o app
   * com o pet já dormindo não inventa uma noite que não aconteceu (noite sem
   * registro é NEUTRA, nunca uma falha).
   */
  const sleepStateRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (sleepStateRef.current === null) { sleepStateRef.current = isSleeping; return; }
    if (sleepStateRef.current === isSleeping) return;
    sleepStateRef.current = isSleeping;
    const now = new Date();
    if (isSleeping) {
      // Perder isto só custa a hora de deitar da noite em curso. Silencioso.
      writeLocal(STORAGE_KEYS.SLEEP_STARTED_AT, now.toISOString(), { silent: true });
      /* 🔗 #59b — 🛏️ NOITE DE DESCANSO. Só a noite DENTRO da janela rende XP:
         é a MESMA régua da missão `rest-nights` logo abaixo, e premiar toda
         noite pagaria por ir dormir em vez de por ir no horário — o que a
         Janela de Descanso existe para não fazer (nada de score de sono).
         O guard `nights.some(...)` impede que deitar/levantar/deitar na mesma
         noite pague duas vezes: `recordNight` é idempotente por manhã,
         `awardBondXP` não é. */
      setGameState(prev => {
        const rest = prev.rest ?? createRestState();
        const chaveDaNoite = playerDayKey(now, prev.playerDayTz);
        const jaRegistrada = rest.nights.some(n => n.date === chaveDaNoite);
        const comNoite = { ...prev, rest: recordNight(rest, now) };
        return !jaRegistrada && isWithinWindow(rest.window, now)
          ? awardBondXP(comNoite, { kind: 'restNight' }, chaveDaNoite)
          : comNoite;
      });
      // Conta a noite só quando o deitar caiu DENTRO da janela escolhida: a
      // missão premia o comportamento, exatamente como a Janela de Descanso —
      // contar toda noite pagaria por ir dormir, não por ir no horário.
      if (isWithinWindow((gameState.rest ?? createRestState()).window, now)) contarMissao('rest-nights');
      return;
    }
    const startedIso = readLocal(STORAGE_KEYS.SLEEP_STARTED_AT);
    const started = startedIso ? new Date(startedIso) : null;
    if (!started || Number.isNaN(started.getTime())) return;
    // Idempotente por manhã: isto ATUALIZA o registro criado ao deitar.
    setGameState(prev => ({ ...prev, rest: recordNight(prev.rest ?? createRestState(), started, now) }));
    removeLocal(STORAGE_KEYS.SLEEP_STARTED_AT, { silent: true });
  }, [isSleeping, setGameState]);

  /**
   * O SONHO DA MANHÃ — e a palavra "manhã" é a regra, não o enfeite.
   *
   * Todo feedback de sono acontece de manhã, dentro do app, e vem em forma de
   * recompensa colecionável. NUNCA à noite: a ortossonia é ansiedade ANTES de
   * dormir, e um app que comenta seu sono às 23h45 é exatamente o estímulo que
   * atrapalha o sono que ele diz proteger. Nada aqui exibe nota, duração ou
   * veredito — a raridade sai da REGULARIDADE (`dreamRarity`) e o pior
   * resultado possível é um sonho comum.
   *
   * `rollDream` é determinístico pela seed (o dayKey), então recarregar a
   * página de manhã não re-sorteia até achar um lendário.
   */
  /* Mesma correção do check-in: a trava guarda o DIA. Um booleano de sessão
     nunca rearmava, então o app aberto a noite toda pulava o sonho da manhã
     seguinte inteiro. */
  const dreamShownRef = useRef<string | null>(null);
  useEffect(() => {
    if (isSleeping) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 4 || hour >= 12) return; // só de manhã
    const rest = gameState.rest;
    if (!rest) return;
    // `playerDayKey` e NÃO `dayKeyOf`: esta chave é comparada contra
    // `RestNight.date`, que `recordNight` passou a carimbar no dia do JOGADOR.
    // Lida do aparelho, ela não encontraria a noite que o outro aparelho
    // gravou e a manhã inteira (sonho E pesadelo) sumiria em silêncio.
    // `dayKeyOf` continua sendo a chave certa no resto deste arquivo — hábito,
    // streak, semana, fresh start e virada.
    const key = playerDayKey(now, rest.playerDayTz);
    if (dreamShownRef.current === key) return;
    if (!rest.nights.some(n => n.date === key)) return; // nenhuma noite registrada
    // "já mostrei o sonho desta manhã": no pior caso ele reaparece uma vez.
    if (readLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN) === key) return;

    const dreamId = rollDream(rest, dreamRarity(rest, now), hashString(key));
    const isNew = !rest.dreams.includes(dreamId);
    dreamShownRef.current = key;
    writeLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN, key, { silent: true });
    // WP4.10 — a data entra junto: coleção sem data é lista; com data é
    // história. Dia do JOGADOR, nunca do aparelho.
    /* 🔗 #59b — 🌠 SONHO INÉDITO. Mesma régua da missão `dream-new` logo
       abaixo: repetir um sonho que já está no dex não acrescenta ao acervo, e
       por isso não paga. Um updater só, com o crédito junto da coleta. */
    setGameState(prev => {
      const comSonho = {
        ...prev,
        rest: collectDream(
          prev.rest ?? createRestState(),
          dreamId,
          playerDayKey(new Date(), prev.playerDayTz),
        ),
        /* F2 (dono, 01/10/2026): o sonho DÁ a decoração gêmea da cena (o
           sofá do "Esparramado no sofá"). Idempotente — quem já tem não ganha
           outro. `utils/dreamDecorTwin.ts`. */
        ownedFurniture: grantDreamTwin(prev.ownedFurniture, dreamId),
      };
      return isNew
        ? awardBondXP(comSonho, { kind: 'dreamNew' }, playerDayKey(new Date(), prev.playerDayTz))
        : comSonho;
    });
    // Só o sonho INÉDITO conta: a missão é de coleção, e repetir um que já
    // está no dex não acrescenta nada ao acervo.
    if (isNew) contarMissao('dream-new');
    setMorningDream({ dream: DREAM_CATALOG.find(d => d.id === dreamId) ?? null, isNew });
  }, [gameState.rest, isSleeping, setGameState]);

  /**
   * O PESADELO DA MANHÃ — a face jogável da mesma noite que rendeu o sonho.
   *
   * O sonho é a COLETA (passiva, colecionável) e o pesadelo é o COMBATE: as
   * duas metades da noite, e por isso os dois vivem no MESMO momento e sob a
   * MESMA janela de horas do sonho (4h–12h). Nada de sono aparece à noite —
   * ortossonia é ansiedade ANTES de dormir, e um app que às 23h avisa que há
   * uma luta pendente é o estímulo exato que a Janela de Descanso existe para
   * não produzir.
   *
   * Aparece depois do sonho (`!morningDream`) porque dois modais empilhados
   * fazem o de cima roubar o clique do de baixo — já visto em teste.
   */
  useEffect(() => {
    if (nightmareOpen) return;
    if (isSleeping) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 4 || hour >= 12) return; // só de manhã
    const rest = gameState.rest;
    if (!rest) return;
    if (!hasPendingNightmare(gameState.nightmares ?? EMPTY_NIGHTMARES, rest, now)) return;
    setNightmareOpen(true);
  }, [gameState.rest, gameState.nightmares, isSleeping, nightmareOpen]);

  /**
   * A onda vem PRONTA de `buildNightmareWave` — o componente não decide inimigo
   * nenhum, e o motor de combate continua sendo o da Masmorra (o módulo delega
   * a `buildDungeonWave`; regra copiada é regra que diverge em silêncio).
   *
   * `nightmareDayKey` nas deps, e não o `Date` inteiro: sem isso a onda seria
   * re-sorteada a cada render e o inimigo trocaria no meio da luta.
   */
  const nightmareKey = nightmareDayKey(new Date(), gameState.rest?.playerDayTz);
  const nightmareWave = useMemo(
    () => (nightmareOpen
      ? buildNightmareWave(gameState.rest ?? createRestState(), gameState.evolutionStage, new Date())
      : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightmareOpen, nightmareKey, gameState.evolutionStage],
  );
  const nightmareRarity = useMemo(
    () => nightmaresFor(gameState.rest ?? createRestState(), new Date(), gameState.evolutionStage).rarity,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightmareKey, gameState.evolutionStage, gameState.rest],
  );

  /**
   * Fecha a noite. **Sempre** chamado — vitória, derrota ou fechar a tela.
   *
   * Deixar o pesadelo pendente faria a oferta reaparecer na próxima abertura, e
   * uma recompensa que insiste vira cobrança. `markFought` é idempotente por
   * dayKey, então o StrictMode (que roda o updater 2×) não duplica nada.
   */
  const closeNightmare = useCallback(() => {
    // A âncora sai de DENTRO do updater: `prev.rest` é o estado corrente, e
    // carimbar com uma âncora capturada por fechamento seria gravar um nome de
    // dia que o portão (`hasPendingNightmare`, que lê `rest.playerDayTz`)
    // poderia não reconhecer — o modal reabriria para sempre.
    setGameState(prev => ({
      ...prev,
      nightmares: markFought(
        prev.nightmares ?? EMPTY_NIGHTMARES,
        nightmareDayKey(new Date(), prev.rest?.playerDayTz),
      ),
    }));
    setNightmareOpen(false);
  }, [setGameState]);

  /**
   * Vitória: energia (teto do estágio), meio coração no máximo (teto de
   * `NIGHTMARE_MAX_HEART_CURE`, respeitando `maxHealthPoints`) e Bits.
   *
   * Perder não credita nada — `nightmareRewards(rarity,false)` devolve zeros e
   * este caminho nem é chamado. O som/fala ficam FORA do updater (footgun 6).
   */
  const handleNightmareWin = useCallback((rewards: NightmareRewards) => {
    /* 🔗 #59b — 👻 PESADELO VENCIDO. `awardBondXP` envolve o MESMO updater que
       grava `markFought` (footgun 6: nada de efeito colateral fora), e o dia é
       o do JOGADOR, como todo ledger de teto do Vínculo. */
    setGameState(prev => awardBondXP({
      ...prev,
      healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + (rewards.hearts ?? 0)),
      energyPoints: Math.min(
        getMaxEnergyForStage(prev.evolutionStage),
        (prev.energyPoints ?? 0) + (rewards.energy ?? 0),
      ),
      gamePoints: (prev.gamePoints ?? 0) + (rewards.bits ?? 0),
      nightmares: markFought(
        prev.nightmares ?? EMPTY_NIGHTMARES,
        nightmareDayKey(new Date(), prev.rest?.playerDayTz),
      ),
    }, { kind: 'nightmareCleared' }, playerDayKey(new Date(), prev.playerDayTz)));
    setMessageTrigger(prev => prev + 1);
  }, [setGameState]);

  /** Aceita o recomeço. NUNCA apaga progresso — ver `applyFreshStart`. */
  const handleFreshStart = useCallback(() => {
    setGameState(prev => applyFreshStart(prev, new Date()));
    setFreshStartDismissed(true);
    toast(language === 'pt-BR'
      ? 'Recomeço aceito. Nada do seu progresso foi tocado.'
      : 'Fresh start taken. None of your progress was touched.');
  }, [language, setGameState]);

  const handleDismissWeeklyReport = useCallback(() => {
    setGameState(prev => ({ ...prev, lastWeeklyReportDate: dayKeyOf(new Date()) }));
  }, [setGameState]);

  /** A Janela de Descanso (Configurações). Só o usuário escolhe os horários. */
  const handleChangeRestWindow = useCallback((window: RestWindow) => {
    setGameState(prev => ({ ...prev, rest: { ...(prev.rest ?? createRestState()), window } }));
  }, [setGameState]);

  /** "Não quero ver métricas": esconde NÚMEROS, preserva RECOMPENSAS. */
  const handleToggleRestMetrics = useCallback((hide: boolean) => {
    setGameState(prev => ({ ...prev, rest: { ...(prev.rest ?? createRestState()), hideMetrics: hide } }));
  }, [setGameState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSOS (utils/steps.ts) — opcional, e a palavra opcional é literal
  // ═══════════════════════════════════════════════════════════════════════════

  // Este aparelho tem contador? Na PWA (a maior parte da base) a resposta é
  // `false` e NADA de passos aparece em lugar nenhum — sem erro, sem medidor
  // vazio, sem "você está perdendo isto".
  useEffect(() => {
    let cancelled = false;
    isStepsAvailable().then(ok => { if (!cancelled) setStepsAvailable(ok); });
    hasStepsPermission().then(ok => { if (!cancelled) setStepsPermission(ok); });
    return () => { cancelled = true; };
  }, []);

  /* O agregado anterior por REF: `readStepsToday` precisa dele para calcular o
     delta, e colocá-lo nas deps do efeito abaixo reiniciaria o polling a cada
     leitura. */
  const stepsRecordRef = useRef(gameState.steps);
  stepsRecordRef.current = gameState.steps;

  /**
   * Lê o pedômetro só com o app EM FOREGROUND e só com consentimento.
   *
   * `null` NÃO é 0: sem sensor, sem permissão ou com leitura falha o registro
   * anterior fica exatamente como está — zerar o dia por uma leitura que não
   * respondeu seria apagar passo que a pessoa deu.
   */
  useEffect(() => {
    if (gameState.stepsConsent !== 'granted') return;
    let cancelled = false;
    const read = () => {
      if (document.hidden) return;
      readStepsToday(new Date(), stepsRecordRef.current).then(record => {
        if (cancelled || !record) return; // null nunca vira 0
        setGameState(prev => {
          const p = prev.steps;
          // Só grava quando algo mudou: todo setGameState agenda cloud save.
          if (p && p.date === record.date && p.today === record.today && p.baseline === record.baseline) return prev;
          return { ...prev, steps: record };
        });
      }).catch(() => {});
    };
    read();
    const id = setInterval(read, STEPS_POLL_MS);
    document.addEventListener('visibilitychange', read);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', read);
    };
  }, [gameState.stepsConsent, setGameState]);

  /**
   * Consentimento → diálogo do sistema. NUNCA o contrário: chamar
   * `requestStepsPermission` sem ter mostrado `stepsConsentCopy` (que é o que o
   * `StepsCard` renderiza) é bug de conformidade (política do Play + LGPD).
   */
  const handleStepsRequestPermission = useCallback(async () => {
    const granted = await requestStepsPermission();
    setStepsPermission(granted);
    setGameState(prev => ({ ...prev, stepsConsent: granted ? 'granted' : 'declined' }));
  }, [setGameState]);

  /**
   * Recusar. Grava `'declined'` PARA SEMPRE — sem esta marca o cartão voltaria
   * a cada abertura para quem já disse não, e insistir depois de um "não" é
   * assédio, não onboarding. Não existe custo: quem recusa não perde nada.
   */
  const handleStepsDecline = useCallback(() => {
    setGameState(prev => ({ ...prev, stepsConsent: 'declined' }));
  }, [setGameState]);

  /** Passos de HOJE (0 se o registro é de outro dia — nada é herdado da véspera). */
  const stepsToday = gameState.steps && gameState.steps.date === stepsDayKey(new Date())
    ? gameState.steps.today
    : 0;

  /**
   * SELO DE "VERIFICADO" — declarado pontua, inferido CONFIRMA.
   *
   * O hábito marcado é que vale: ele já rendeu a comida da categoria, já entrou
   * na meta do dia e já alimentou a constância, com ou sem sensor. Isto aqui
   * acrescenta UMA comida e um selo por cima, e só isso. Não existe meta, item
   * ou conquista alcançável apenas com sensor — quem joga na PWA não fica atrás
   * de nada (regra 2 de `utils/steps.ts`).
   *
   * Fora do updater, como todo efeito colateral (footgun 6).
   */
  const grantStepsVerified = useCallback((category: ActivityCategory) => {
    if (!STEP_VERIFIABLE.includes(category)) return;
    if (stepsToday < STEPS_VERIFIED_MIN) return;
    const food = FOOD_BY_CATEGORY[category];
    if (food) {
      setGameState(prev => ({
        ...prev,
        foodInventory: {
          ...prev.foodInventory,
          [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
        },
      }));
      setFeedAnim(prev => ({ emoji: food.emoji, n: (prev?.n ?? 0) + 1 }));
    }
    toast(language === 'pt-BR'
      ? `🥾 Verificado pelos seus passos hoje — +1 comida de bônus.`
      : `🥾 Verified by today's steps — +1 bonus food.`);
  }, [stepsToday, language, setGameState]);

  // Optional auto-sleep schedule: puts the pet to sleep when entering the
  // configured window and wakes it when leaving. Only acts on window EDGES, so
  // a manual wake/sleep inside the window isn't fought by the automation.
  const autoSleepPrevInWindowRef = useRef<boolean | null>(null);
  useEffect(() => {
    const parseHM = (s: string | null, fallback: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(s || fallback);
      return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
    };
    const check = () => {
      if (!readFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED)) {
        autoSleepPrevInWindowRef.current = null;
        return;
      }
      const start = parseHM(readLocal(STORAGE_KEYS.AUTO_SLEEP_START), '23:00');
      const end = parseHM(readLocal(STORAGE_KEYS.AUTO_SLEEP_END), '07:00');
      const nowD = new Date();
      const cur = nowD.getHours() * 60 + nowD.getMinutes();
      // Window may cross midnight (e.g. 23:00–07:00)
      const inWindow = start <= end ? cur >= start && cur < end : cur >= start || cur < end;
      const prev = autoSleepPrevInWindowRef.current;
      autoSleepPrevInWindowRef.current = inWindow;
      // Act on window transitions, plus on the very first check when already
      // inside the window (app opened after bedtime → pet goes to sleep).
      const shouldAct = prev === null ? inWindow : prev !== inWindow;
      if (!shouldAct) return;
      setIsSleeping(sleeping => {
        if (inWindow === sleeping) return sleeping;
        writeFlag(STORAGE_KEYS.IS_SLEEPING, inWindow, { silent: true });
        return inWindow;
      });
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  // Carinho: the ONLY way to heal HP. Called by CompanionHUD after every ~2s of
  // rubbing — each grant restores half a heart, capped at 1 full heart PER DAY
  // (so rubbing can't trivialize the daily heart loss). Animation always plays.
  // O teto diário de cura por carinho mora no SAVE (`gameState.careCaps.rubHeal`):
  // no localStorage, PWA + APK davam 2 corações/dia ao mesmo jogador.
  // Bumped when rubbing can't heal because today's cap was reached → pet comments.
  const [healCapSignal, setHealCapSignal] = useState(0);

  const handlePet = useCallback(() => {
    // Regra em utils/careRules.ts, compartilhada com o app de desktop. A
    // checagem usa só HP (deps estreitas de propósito: CompanionHUD é memo(),
    // e depender do gameState inteiro anularia o memo — footgun 5).
    // Dia do JOGADOR, em fuso fixo do save (`utils/playerDay.ts`), e não o dia
    // do APARELHO: `careCaps.rubHeal` viaja na nuvem, e com `toDateString()` o
    // aparelho adiantado estreava o teto do dia dele mais cedo — o resíduo que
    // o X-4 (commit 9e9f679f) mediu, travou num teste e deixou aberto.
    const today = playerDayKey(new Date(), gameState.playerDayTz);
    // `petPassive` entra na checagem: sem ele o teto lido aqui era sempre 1, e o
    // traço Carinhoso (que o CLAUDE.md declara como "cura até 1,5/dia") era
    // anulado pela checagem de fora antes de a regra pura sequer rodar.
    // `rubDecision` lê o `petPassive` do ESTADO, e não de um parâmetro que quem
    // chama possa esquecer — foi assim que o Traço Carinhoso ficou desligado na
    // prática, barrado em 1,0 enquanto o CLAUDE.md declarava 1,5 (X-6).
    const refused = rubDecision(gameState, today);
    if (refused) {
      // "Já está cheio" é silencioso; "acabou o carinho de hoje" o pet comenta.
      if (refused === 'daily-cap') setHealCapSignal(n => n + 1);
      return;
    }
    // C-4 (run `som-01`): o carinho deixa de soar como um mordisco. Medido: o
    // gesto NAO e pontual — `CompanionHUD.rubTick` chama isto a cada 2 s de
    // arrasto, entao um arrasto de 10 s disparava `playFeed` cinco vezes. Fica
    // sem som ate a decisao de vinculo sobre C-4 fechar (as saidas em aberto sao
    // "variacao do motivo de presenca" ou "nenhum som"); a recusa por teto
    // continua distinguivel pela fala do pet, que e o canal real (R-34).
    contarMissao('rub-days');
    if (!rubFalouRef.current) {
      rubFalouRef.current = true;
      falar('rub');
    }
    marcarGestoDoDia('pet');
    // O teto é reconferido sobre o `prev` — quem manda é a regra pura, sobre o
    // registro que está no save. Antes chegava aqui `{ healed: 0 }` fixo, o que
    // desligava o teto DENTRO do updater e deixava a trava inteira dependendo da
    // checagem de fora.
    setGameState(prev => applyRub(prev, today).state);
  }, [gameState.healthPoints, gameState.maxHealthPoints, gameState.careCaps, gameState.petPassive, gameState.playerDayTz]);

  // targetStage é sempre um ID da árvore ('rookie' | 'champion-power' | ...),
  // não mais um nome de exibição — a árvore é única por jogador, então não dá
  // pra inverter nome→id globalmente como antes (DEGENERATION_STAGE_MAP).
  const handleDegenerate = useCallback((targetStage: string) => {
    setGameState(prev => {
      const newHP = getMaxHPForStage(targetStage);
      const newStageLevel = getStageLevel(targetStage);
      /* MESMA regra da degeneração automática, e a função é a de `dailyReset`
         (dona da regra). Aqui havia uma cópia: `= floor(required/2)`, uma
         ATRIBUIÇÃO onde o outro caminho já era PISO + custo fixo. Um mega com
         39 dias perfeitos que descia de propósito caía para 2; o mesmo mega
         que deixava o HP zerar por descuido ficava com 34. O comentário
         prometia "recuperação mais fácil que o descuido" e a linha entregava o
         oposto exato. Não reescreva a expressão aqui — chame a função. */
      const newPerfectDays = degeneratedPerfectDays(prev.perfectDays, newStageLevel);

      return {
        ...prev,
        evolutionStage: targetStage,
        healthPoints: newHP,
        maxHealthPoints: newHP,
        perfectDays: newPerfectDays,
        degeneratedByHP: false,
        // Reset recent branch window — next evolution reflects habits going forward
        attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
      };
    });
    playDegenerate();
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleEvolveToUnlocked = useCallback((targetStage: string) => {
    setGameState(prev => {
      if (!prev.unlockedEvolutions.includes(targetStage)) return prev;

      const newHP = getMaxHPForStage(targetStage);

      return {
        ...prev,
        evolutionStage: targetStage,
        healthPoints: newHP,
        maxHealthPoints: newHP,
        degeneratedByHP: false,
      };
    });
    setMessageTrigger(prev => prev + 1);
    setShowEvolutionChoice(false);
  }, []);

  // Um só handler para o mudo, usado pela SettingsPage (o caminho vivo do jogador,
  // canvas Conta §29). ⚰️ 21/09/2026: o `SettingsModal` ("Ajustes rápidos"), que
  // também o usava, foi apagado — era duplicata da SettingsPage (decisão #37).
  const handleToggleSound = useCallback(() => {
    const mudo = !soundMuted;
    setMuted(mudo);
    setSoundMuted(mudo);
    // E0: o mudo global também cala a trilha; religar devolve só se ela estava ligada por gesto.
    if (mudo) pausarTrilha('mudo'); else retomarTrilha('mudo');
    // som-01 — só a transição LIGADO → MUDO é medida, e só ela. É o
    // único evento que mede o perfil "usuário em público" sendo
    // punido, e ele mede por REJEIÇÃO explícita, nunca por inferência.
    // Religar o som não emite nada: não há decisão pendurada nisso.
    if (mudo) trackSoundOff();
  }, [soundMuted]);

  const handleCompleteOnboarding = async (data: OnboardingCompleteData) => {
    /* O ponto de partida (B4) é resolvido ANTES de qualquer `await`, e o
       tutorial é dado como feito NO MESMO lote em que o onboarding é dado
       como completo. Até 01/10/2026 a marca do tutorial vinha DEPOIS das
       idas à nuvem (`emailToSaveId`/`cloudLoad`): nesse intervalo o app já
       renderizava "onboarding completo + tutorial pendente" e o tutorial
       antigo ("crie sua 1ª tarefa") piscava — e ficava, se a pessoa fechasse
       o app ali ou se a adoção de um save da nuvem recarregasse a página. */
    const catalogItems = (data.catalogChoice?.itemIds ?? [])
      .map(id => ACTIVITY_CATALOG.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
    if (catalogItems.length > 0) {
      writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE, true, { silent: true });
      setHasCompletedTutorial(true);
    }
    // Fim do onboarding: perder isto refaz o ritual do zero. AVISA.
    writeLocal(STORAGE_KEYS.USER_NAME, data.userName);
    writeFlag(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    setUserName(data.userName);
    setHasCompletedOnboarding(true);

    // E-mail é OPCIONAL no caminho grátis (ver SoulmonOnboarding). Sem ele o
    // jogo roda local, com o saveId aleatório que já existe — e o app pede o
    // e-mail depois, quando houver progresso a perder (ProtectProgressModal).
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setHasCompletedOnboarding(true);
    } else {
      // O e-mail vira a identidade de sync — mesmo mecanismo do login manual em
      // Configurações (saveId = hash do e-mail).
      const { emailToSaveId, cloudLoad, adoptCloudSave } = await import('./utils/cloudSave');
      const newSaveId = await emailToSaveId(normalizedEmail);
      writeLocal(STORAGE_KEYS.USER_EMAIL, normalizedEmail);

      // Esse e-mail já tem um Soulmon salvo na nuvem (reinstalação/outro
      // aparelho) — adota o save existente em vez de sobrescrever com uma
      // criatura nova. Precisa de reload: o gameState inteiro muda de baixo do
      // GameStateProvider, o que setGameState não faz de forma segura.
      const existing = await cloudLoad(newSaveId);
      // Só recarrega se o save da nuvem REALMENTE ficou gravado. Falhou =
      // segue o ritual normal com o progresso local, em vez de recarregar num
      // id que não tem dado nenhum por trás.
      if (existing && adoptCloudSave(newSaveId, existing, normalizedEmail) === 'ok') {
        window.location.reload();
        return;
      }

      writeLocal(STORAGE_KEYS.SAVE_ID, newSaveId);
      setSaveId(newSaveId);
    }

    const newActivitiesBase: Activity[] = data.initialActivities.map((item, i) => ({
      id: `${Date.now() + i}`,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    }));
    /* B4 (checklist do dono, 01/10/2026): as metas do catálogo (áreas,
       dificuldades, forças e o ponto de partida) agora são respondidas DENTRO
       do onboarding. O que a pessoa manteve vira atividade aqui, com o mesmo
       construtor do intersticial (`activitiesFromCatalogChoice`), e o
       intersticial do catálogo é dado como visto — perguntar de novo seria a
       mesma pergunta duas vezes. Com ≥1 atividade a home já não nasce vazia,
       então o tutorial de "crie sua 1ª tarefa" também não abre (a pergunta
       aberta de objetivo dele seria a terceira cópia da mesma pergunta). */
    const catalogActivities = activitiesFromCatalogChoice(catalogItems, language === 'pt-BR') as unknown as Activity[];
    const newActivities: Activity[] = [...newActivitiesBase, ...catalogActivities];
    // 01/10/2026 — o perfil do onboarding (forças + o que atrapalha) entra no
    // save nos DOIS caminhos; quem lê é a personalidade do Soulmon.
    const onboardingProfile = onboardingProfileFrom(data.catalogChoice);
    const catalogSeen = catalogActivities.length > 0
      ? (markCatalogOnboardingSeen({}, new Date()) as Record<string, unknown>)
      : {};

    // Modo demo (utils/monetization.ts): personagem pré-pronto, sem árvore do
    // oráculo — evolui num caminho ÚNICO (getSpriteForStage resolve o sprite
    // via demoCharacterId, ver utils/sprites.ts).
    if (data.mode === 'demo') {
      const premade = PREMADE_CHARACTERS.find(c => c.id === data.demoCharacterId);
      writeLocal(STORAGE_KEYS.EGG_TYPE, 'ignar');
      setGameState(prev => ({
        ...prev,
        activities: newActivities,
        tasks: [],
        eggType: 'ignar',
        evolutionStage: 'rookie',
        unlockedEvolutions: ['rookie'],
        healthPoints: getMaxHPForStage('rookie'),
        maxHealthPoints: getMaxHPForStage('rookie'),
        maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
        soulmonStages: premade ? getDemoCreatureStages(premade) : [],
        // `petName` só entra quando a pessoa trocou o sugerido — assim o save
        // de quem manteve continua idêntico ao que sempre foi.
        soulmonMeta: premade
          ? { baseName: premade.name, ...(data.petName && data.petName !== premade.name ? { petName: data.petName } : {}) }
          : undefined,
        accountTier: 'demo',
        demoCharacterId: data.demoCharacterId,
        // WP1.12 — a tonalidade escolhida. Cosmética: nenhuma regra a lê.
        demoTint: data.demoTint ?? 0,
        soulGoal: data.soulGoal,
        soulStruggle: data.soulStruggle,
        // Forças + o que atrapalha, em ids do catálogo → `derivePersonality`.
        onboardingProfile: onboardingProfile ?? prev.onboardingProfile,
        // 01/10/2026 (dono): as 20 do teste longo entram no save também no
        // grátis — o upgrade não pergunta de novo (`utils/soulTestAnswers.ts`).
        soulTestAnswers: sanitizeSoulTestAnswers(data.soulTestAnswers) ?? prev.soulTestAnswers,
        ...catalogSeen,
        // Prova do consentimento (timestamp + versão dos documentos). Vem do
        // onboarding e entra no save — é o que sobrevive ao cloud save.
        consent: data.consent ?? prev.consent,
        petPassive: rollPetPassive(),
        // WP1.16 — a data de nascimento da criatura, no dia do JOGADOR.
        bornAt: playerDayKey(new Date(), prev.playerDayTz),
        /* WP1.3 — o check-in NÃO dispara no D0.
           A fila de intersticiais podia abrir o ritual de planejamento em
           cima de quem tinha acabado de conhecer a criatura: a primeira coisa
           depois do nascimento seria um formulário de metas. Marcar o dia de
           hoje como já feito é o jeito honesto — não é uma exceção escondida
           na fila, é o ritual de hoje considerado cumprido, que é o que ele
           de fato foi (a pessoa acabou de escolher tudo no onboarding). */
        lastCheckInDate: playerDayKey(new Date(), prev.playerDayTz),
        // WP1.3 — o cartão dos três gestos nasce aqui e morre no fim do dia.
        firstDay: emptyFirstDay(playerDayKey(new Date(), prev.playerDayTz)),
      }));
      return;
    }

    // Linha de sprite GENÉRICA (visual provisório até a Fase 2 assumir) —
    // sorteada uma vez, determinística pela seed do oráculo. Não é mais uma
    // escolha do jogador; a árvore de verdade é a de soulmonStages.
    const GENERIC_LINES = ['ignar', 'lumel', 'serah'] as const;
    const genericLine = GENERIC_LINES[hashString(String(data.oracleResult.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);

    // O onboarding É o ritual de nascimento — o pet já nasce Rookie na SUA
    // forma única (sem ovo/baby).
    setGameState(prev => ({
      ...prev,
      activities: newActivities,
      tasks: [],
      eggType: genericLine,
      evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'],
      healthPoints: getMaxHPForStage('rookie'),
      maxHealthPoints: getMaxHPForStage('rookie'),
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      soulmonStages: data.oracleResult.creature.stages,
      /* WP1.1 — ADOTA o desenho que a pessoa acabou de ver no reveal.
         Sem isto o acervo geraria a forma inicial de novo, e a criatura que
         entra no jogo seria OUTRA — a cerimônia teria mostrado um bicho que
         não é o dela. `adopt: 'now'` porque no nascimento não há história a
         proteger (é a exceção que a regra da adoção já prevê). */
      spriteLibrary: data.revealSprite
        ? recordSprite(prev.spriteLibrary ?? emptySpriteLibrary(), data.revealSprite, { adopt: 'now' })
        : prev.spriteLibrary,
      soulmonMeta: {
        seed: data.oracleResult.seed,
        baseName: data.oracleResult.creature.baseName,
        // Idem: batismo só existe no save de quem batizou.
        ...(data.petName && data.petName !== data.oracleResult.creature.baseName
          ? { petName: data.petName }
          : {}),
        dominantElement: data.oracleResult.dominantElement,
        dominantAlignment: data.oracleResult.dominantAlignment,
        dominantRealm: data.oracleResult.dominantRealm,
      },
      accountTier: 'paid',
      demoCharacterId: undefined,
      soulGoal: data.soulGoal,
      soulStruggle: data.soulStruggle,
      onboardingProfile: onboardingProfile ?? prev.onboardingProfile,
      soulTestAnswers: sanitizeSoulTestAnswers(data.soulTestAnswers) ?? prev.soulTestAnswers,
      ...catalogSeen,
      consent: data.consent ?? prev.consent,
      petPassive: rollPetPassive(),
      bornAt: playerDayKey(new Date(), prev.playerDayTz),
      // WP1.3 — idem ao caminho demo: o ritual de planejamento não abre em
      // cima de quem acabou de conhecer a criatura. Ver a nota lá em cima.
      lastCheckInDate: playerDayKey(new Date(), prev.playerDayTz),
      firstDay: emptyFirstDay(playerDayKey(new Date(), prev.playerDayTz)),
    }));
  };

  // Segundo onboarding (GameTutorialFlow): tarefas escolhidas na criação
  // obrigatória da 1ª tarefa. Chega SEMPRE com >=1 item (o componente não
  // deixa terminar sem selecionar nada).
  const handleCompleteTutorial = (activities: Array<{ name: string; category: ActivityCategory; emoji: string }>) => {
    writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE, true, { silent: true });
    setHasCompletedTutorial(true);
    const newActivities: Activity[] = activities.map((item, i) => ({
      id: `${Date.now() + i}`,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    }));
    // O lote do tutorial tambem passa pelo portao — e o portao corta o que nao
    // couber, em vez de gravar por cima do teto. O `GameTutorialFlow` ja recebe
    // `maxActivities` com o teto EFETIVO, entao na pratica nao ha corte: as
    // duas reguas sao a mesma, e essa e a questao.
    commitHabitCreate(newActivities, TELEMETRY_CREATE_PATH.tutorial);
  };


  // Handle reset onboarding (DEBUG ONLY)
  const handleResetOnboarding = () => setResetOnboardingOpen(true);
  const handleConfirmResetOnboarding = () => {
    removeLocal(STORAGE_KEYS.ONBOARDING_COMPLETE);
    removeLocal(STORAGE_KEYS.USER_NAME);
    removeLocal(STORAGE_KEYS.EGG_TYPE);
    window.location.reload();
  };

  /* ── WP1.5 — O SEGUNDO CONVITE DE NOTIFICAÇÃO ─────────────────────────
     O primeiro convite já estava certo: só depois da PRIMEIRA conclusão real.
     O que faltava era o segundo — quem dispensou no dia 1 nunca mais era
     convidado, e no dia 1 ninguém ainda sabe se este app vai importar.
     A regra (as quatro travas: nunca no D0/D1, nunca depois do D3, uma vez
     só, nunca em cima de quem voltou de ausência) mora em `utils/pushPriming.ts`
     e é testada lá; aqui fica só a leitura do estado e a tela. */
  const [primingDispensado, setPrimingDispensado] = useState(
    () => readFlag(STORAGE_KEYS.NOTIFICATION_PRIMING_DISMISSED),
  );
  const mostrarPrimingDePush = useMemo(() => shouldPrimePush({
    daysWithPet: daysTogether(gameState.bornAt, playerDayKey(new Date(), gameState.playerDayTz)),
    notificationsEnabled,
    // Sem o carimbo de hora (dispensou antes desta versão) a espera de 24h já
    // passou — é a leitura segura, e não reperguntar seria pior que perguntar.
    firstDismissedAt: (() => {
      const at = Number(readLocal(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED_AT));
      if (Number.isFinite(at) && at > 0) return at;
      return readFlag(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED) ? 0 : null;
    })(),
    secondDismissed: primingDispensado,
    returningFromAbsence: gameState.lastDayReport?.welcomeBack === true,
    now: Date.now(),
  }), [
    gameState.bornAt, gameState.playerDayTz, gameState.lastDayReport?.welcomeBack,
    notificationsEnabled, primingDispensado,
  ]);

  /**
   * As 3 missões da semana, prontas para a tela. DETERMINÍSTICO por semana: a
   * mesma `weekKey` devolve as mesmas três em qualquer aparelho — se a lista
   * mudasse a cada abertura, a pessoa aprenderia a reabrir o app até cair uma
   * fácil, que é o oposto do que missão semanal existe para fazer.
   */
  const missoesDaSemana = useMemo(() => {
    const semana = isoWeekKey(playerDayKey(new Date(), gameState.playerDayTz));
    if (!semana) return [];
    const progresso = forWeek(gameState.weeklyMissions, semana);
    return weeklyMissionsFor(semana).map(mission => {
      const count = progresso.counts[mission.id] ?? 0;
      return {
        mission,
        count,
        done: count >= mission.target,
        claimed: progresso.claimed.includes(mission.id),
      };
    });
  }, [gameState.weeklyMissions, gameState.playerDayTz]);

  /** Paga os Emblemas de uma missão pronta. `claimWeekly` é idempotente e
   *  devolve 0 se já estava paga — pagar duas vezes é bug de economia. */
  const resgatarMissao = useCallback((id: WeeklyMissionId) => {
    setGameState(prev => {
      const semana = isoWeekKey(playerDayKey(new Date(), prev.playerDayTz));
      if (!semana) return prev;
      const progresso = forWeek(prev.weeklyMissions, semana);
      const missao = weeklyMissionsFor(semana).find(m => m.id === id);
      if (!missao) return prev;
      const { progress, emblems } = claimWeekly(progresso, missao);
      if (emblems === 0) return prev;
      return { ...prev, weeklyMissions: progress, emblems: (prev.emblems ?? 0) + emblems };
    });
  }, []);

  /* WP5.1 — a oferta no primeiro dia perfeito. Quatro travas, e nenhuma delas
     mora nesta tela: nunca no D0 (vender antes de entregar), nunca em cima de
     quem voltou de uma ausência (quem some e volta encontra saudade, não
     vitrine), no máximo 1×/semana e só para quem ainda não comprou. */
  const ofereceNoRelatorio = useMemo(() => {
    const hoje = playerDayKey(new Date(), gameState.playerDayTz);
    const semana = isoWeekKey(hoje);
    if (!semana) return false;
    return shouldOfferAtValueMoment({
      dismissed: gameState.offerDismissed === true,
      tier: gameState.accountTier,
      wasPerfect: gameState.lastDayReport?.wasPerfect === true,
      welcomeBack: gameState.lastDayReport?.welcomeBack === true,
      daysWithPet: daysTogether(gameState.bornAt, hoje),
      lastShownWeek: gameState.offerShownWeek ?? null,
      currentWeek: semana,
    });
  }, [
    gameState.accountTier, gameState.lastDayReport, gameState.bornAt,
    gameState.playerDayTz, gameState.offerShownWeek,
  ]);

  /* 13.11 (dono, 14/09/2026; STATUS i) — a semana da oferta conta ao MOSTRAR,
     não ao tocar. Carimbar `offerShownWeek` derruba `ofereceNoRelatorio` no
     mesmo render, então o relatório ABERTO segura o convite por um trinco
     próprio (a data do relatório); dispensar continua vencendo tudo. */
  const [ofertaMostradaEm, setOfertaMostradaEm] = useState<string | null>(null);
  useEffect(() => {
    if (interstitial !== 'dailyReport' || !ofereceNoRelatorio) return;
    const report = gameState.lastDayReport;
    if (!report || ofertaMostradaEm === report.date) return;
    const semana = isoWeekKey(playerDayKey(new Date(), gameState.playerDayTz));
    setOfertaMostradaEm(report.date);
    if (semana) setGameState(prev => ({ ...prev, offerShownWeek: semana }));
  }, [interstitial, ofereceNoRelatorio, gameState.lastDayReport, gameState.playerDayTz, ofertaMostradaEm, setGameState]);
  const mostraOfertaNoRelatorio = gameState.offerDismissed !== true
    && (ofereceNoRelatorio || (!!gameState.lastDayReport && ofertaMostradaEm === gameState.lastDayReport.date));

  const dispensarPriming = useCallback(() => {
    setPrimingDispensado(true);
    writeFlag(STORAGE_KEYS.NOTIFICATION_PRIMING_DISMISSED, true, { silent: true });
  }, []);

  // Handle toggle notifications
  const handleToggleNotifications = async () => {
    notifTouchedRef.current = true;
    if (!notificationsEnabled) {
      // Request permission when enabling.
      // NOTE: requestNotificationPermission is imported statically (not via dynamic
      // import) so the browser permission prompt stays inside the user-gesture and
      // actually shows up. A dynamic import here loses the user-activation context.
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        // User denied permission - guide them to browser settings
        toast.warning(
          language === 'pt-BR' ? '🔔 Permissão Negada' : '🔔 Permission Denied',
          {
            description: language === 'pt-BR'
              ? 'Clique no cadeado 🔒 na barra de endereço → Notificações → Permitir, depois recarregue.'
              : 'Click the lock 🔒 in the address bar → Notifications → Allow, then reload the page.',
            duration: 8000,
          }
        );
      }
    } else {
      // Disable notifications
      // WP0.11 — desligar o push é o sinal mais direto de que a régua de
      // notificação passou do ponto, e não era medido. Sem prop: é o FATO,
      // nunca o motivo (motivo exigiria perguntar, e perguntar na saída é
      // exatamente o padrão escuro que este produto recusa).
      track('push_optout');
      setNotificationsEnabled(false);
    }
  };

  // Splash de abertura — sempre exibido brevemente antes de tudo o mais.
  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  // E1 (QA rodada 2): o selo de "sem sinal" era montado só na Home, então o
  // onboarding, o tutorial e o ritual de upgrade — as três telas com mais
  // chamada de rede por minuto (login, geração da criatura, compra) — não
  // sabiam dizer que estavam offline. O mesmo selo, acima dos três `return`.
  const selo = <OfflineSeal language={language} topOffset={8} />;

  // Show onboarding if not completed — Soulmon: quiz da alma no lugar do ovo
  if (!hasCompletedOnboarding) {
    return (
      <>
        {selo}
        <Suspense fallback={<ScreenSkeleton language={language} />}><SoulmonOnboarding onComplete={handleCompleteOnboarding} /></Suspense>
      </>
    );
  }

  // Segundo onboarding: tutorial do jogo + criação obrigatória da 1ª tarefa —
  // mostrado uma vez, depois que o Soulmon já nasceu, antes de liberar o app.
  if (!hasCompletedTutorial) {
    return (
      <Suspense fallback={<ScreenSkeleton language={language} />}>
        {selo}
        <GameTutorialFlow
          language={language}
          maxActivities={activityCap}
          existingActivitiesCount={gameState.activities.length}
          /* WP1.4 — o que a pessoa escreveu volta como a PRIMEIRA área da
             lista. Casamento por palavra-chave, no aparelho: o texto não sai
             daqui (decisão D8, e `_redact.js` já declarava a mesma linha). */
          soulGoal={gameState.soulGoal}
          soulStruggle={gameState.soulStruggle}
          /* A criatura que acabou de nascer, no vidro do tutorial (canvas
             Onboarding-funil D-O13): o mesmo sprite/tonalidade da Home. */
          spriteUrl={displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine)}
          petName={soulmonDisplayName(gameState.soulmonMeta) || undefined}
          demoTint={gameState.demoCharacterId ? gameState.demoTint : undefined}
          onComplete={handleCompleteTutorial}
        />
      </Suspense>
    );
  }

  // Ritual do oráculo pós-compra — ocupa a tela inteira como o onboarding, mas
  // sem intro nem cadastro (ver SoulmonOnboarding mode='upgrade').
  if (upgradeRitual) {
    return (
      <Suspense fallback={<ScreenSkeleton language={language} />}>
        {selo}
        <SoulmonOnboarding
          mode="upgrade"
          // 01/10/2026: com as 20 do teste já no save (grátis), o ritual pula o teste.
          savedTestAnswers={gameState.soulTestAnswers}
          onComplete={handleCompleteOnboarding}
          onRevealed={handleUpgradeRevealed}
          onCancel={() => setUpgradeRitual(false)}
        />
      </Suspense>
    );
  }

  /* ── CONTEÚDO DO LABORATÓRIO E DO HALL (minimal-ui F5) ──────────────
     Montado aqui, antes do `return`, porque cada peça mora em DOIS lugares
     ou dentro do `AreaSheet`: Estatísticas é também página do menu da Home
     (D6), e Evolução/Soulmon/Biblioteca só existem dentro da folha do lote.
     Nenhuma regra nasce aqui — são os mesmos componentes e handlers de antes
     (`EvolutionPath` + `handleEvolveRequest`, `LibraryPage`), só reempacotados. */
  const statsPage = (<Suspense fallback={<ScreenSkeleton language={language} />}><StatsPage
              /* WP1.6 — a MESMA peça do reveal, agora como lembrança. */
              birth={gameState.bornAt || gameState.soulmonMeta?.baseName || gameState.demoCharacterId ? {
                /* ⚠️ O jogador GRÁTIS tinha o cartão de nascimento
                   permanentemente sem criatura (auditoria de 06/09/2026):
                   `displaySprite` lê o ACERVO, e o demo nunca gera sprite —
                   embora a arte dele exista e seja desenhada todo dia na Home
                   por `getSpriteForStage`.
                   A regra "nunca arte de reserva" no `BirthCard` foi escrita
                   para o oráculo, onde reserva significa OUTRA criatura. No
                   demo o pré-pronto É a criatura da pessoa, então a regra
                   estava bloqueando justamente o caso em que ela não se
                   aplica — e a faixa grátis é a que menos posse recebe. */
                spriteUrl: displaySprite(spriteAcervo, 'rookie')?.url
                  ?? (petLine
                    ? getSpriteForStage('rookie', petLine)
                    : null),
                name: soulmonDisplayName(gameState.soulmonMeta) || '—',
                soulGoal: gameState.soulGoal ?? null,
                bornAt: gameState.bornAt ?? null,
              } : null}
              bestiary={gameState.bestiary ?? []}
              /* WP4.6/WP4.10 — o álbum das formas: as onze da árvore, com a
                 arte que já existe e a data de quando cada uma chegou. */
              album={(gameState.soulmonStages ?? []).map(st => {
                const id = st.branch ? `${st.stage}-${st.branch}` : st.stage;
                return { id, name: st.name, spriteUrl: displaySprite(spriteAcervo, id)?.url ?? (petIsCorvo ? getSpriteForStage(creatureFormId(st), petLine) : null) };
              })}
              formReachedAt={gameState.formReachedAt}
              completedTasks={gameState.completedTasks}
              activityStats={gameState.activityStats}
              language={language}
              gamePoints={gameState.gamePoints}
              totalXP={gameState.totalXP}
              streakDays={gameState.totalPerfectDays ?? 0}
              powerPoints={gameState.powerPoints}
              harmonyPoints={gameState.harmonyPoints}
              benevolencePoints={gameState.benevolencePoints}
              petPassive={gameState.petPassive}
              carePattern={carePatternReading.confident ? carePatternReading.pattern : null}
              /* Janela de Descanso: esconde os números da tela, preserva as
                 recompensas (DECISÕES §13 V3; canvas §27, achado 6). */
              hideMetrics={gameState.rest?.hideMetrics === true}
              /* WP2.11 — "N dias juntos". Lê de `bornAt` (WP1.16) e não de um
                 segundo contador: três guardas propuseram medir "há quanto
                 tempo" de três jeitos diferentes, e uma fonte só é o conserto.
                 `null` quando o save não tem data — e aí a linha não aparece,
                 em vez de aparecer com um número inventado. */
              daysTogether={daysTogether(gameState.bornAt, playerDayKey(new Date(), gameState.playerDayTz))}
              season={{
                state: gameState.season,
                counters: {
                  totalPerfectDays: gameState.totalPerfectDays ?? 0,
                  dungeonRunsCompleted: gameState.dungeonRunsCompleted ?? 0,
                },
                rest: gameState.rest,
              }}
              journey={{
                unlockedEvolutions: gameState.unlockedEvolutions,
                soulmonStages: gameState.soulmonStages,
                totalPerfectDays: gameState.totalPerfectDays,
                dungeonKills: gameState.dungeonKills,
                dungeonRunsCompleted: gameState.dungeonRunsCompleted,
                dinoBest: gameState.dinoBest,
                droppedItems: gameState.droppedItems,
                soulGoal: gameState.soulGoal,
              }}
            /></Suspense>);
  const labContent = (
    <>
          {/* As antigas abas Evolução/Soulmon/Stats saíram (29/09/2026): cada
              uma virou uma construção do mapa do Laboratório (`AreaView`), que
              escolhe `labTab` ao abrir a folha. */}
          {/* Ponto de conversão natural: quem está de frente para a árvore de
              um personagem de demonstração (as 3 linhas iguais) é exatamente
              quem entende o que a própria árvore significa. Só aqui e no
              limite de criação — em nenhum outro lugar do jogo. */}
          {labTab === 'evolution' && gameState.demoCharacterId && (
            <div style={{ padding: '0 4px 10px' }}>
              <UnlockNudge
                language={language}
                reason="evolution"
                variant={gameState.accountTier === 'paid' ? 'reveal' : 'buy'}
                onOpen={() => {
                  if (gameState.accountTier === 'paid') setUpgradeRitual(true);
                  else setUnlockReason('evolution');
                }}
              />
            </div>
          )}

          {labTab === 'evolution' && (
            <Suspense fallback={<ScreenSkeleton language={language} />}><EvolutionPath
              currentStageId={gameState.evolutionStage}
              currentBranch={getDominantBranch() === 'balanced' ? 'harmony' : getDominantBranch() as 'power' | 'harmony' | 'benevolence'}
              powerPoints={gameState.powerPoints}
              harmonyPoints={gameState.harmonyPoints}
              benevolencePoints={gameState.benevolencePoints}
              perfectDays={gameState.perfectDays}
              incubating={incubandoAgora}
              gateDays={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
              onDegenerate={handleDegenerate}
              stages={gameState.soulmonStages ?? []}
              eggType={gameState.eggType}
              demoCharacterId={petLine}
              unlockedEvolutions={gameState.unlockedEvolutions}
              evolutionLocked={gameState.evolutionLocked ?? false}
              onToggleEvolutionLock={handleToggleEvolutionLock}
              // O visor da forma atual é o gesto (V2): com a barra cheia e o
              // cadeado aberto, o toque abre a MESMA cerimônia que o HUD abre.
              onEvolveRequest={handleEvolveRequest}
              language={language}
              carePattern={carePatternReading.confident ? carePatternReading.pattern : null}
              spriteLibrary={spriteAcervo}
              dominantElement={gameState.soulmonMeta?.dominantElement}
              onTuneVisor={handleTuneVisor}
              onRetrySprite={handleRetrySprite}
              onRevertVisor={handleRevertVisor}
              onSeenTune={handleSeenTune}
              // O lote VIVO: sem esta prop o card `GERANDO` (§2.2) existia na
              // copy e em `cardState` e nunca aparecia em runtime.
              generatingSprites={spriteGen.generating}
              forecastBranch={resolveBranch(
                { power: gameState.powerPoints, harmony: gameState.harmonyPoints, benevolence: gameState.benevolencePoints },
                carePatternReading,
                gameState.currentBranch,
              )}
            /></Suspense>
          )}

          {/* RENASCIMENTO — mora na página de Evolução porque é o último
              degrau da escada que essa página conta, e só aparece para quem
              PODE (ultra + comprou + nunca usou). Nunca abre sozinho: o
              convite é um card, o gesto é do jogador. Quem já renasceu vê a
              marca, não o botão — é um registro, não uma oferta repetida. */}
          {labTab === 'evolution' && canRebirth(gameState) && (
            <div
              data-rebirth-block
              style={{ marginTop: 16, padding: 12, borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <p style={{ ...sm2Text, margin: 0 }}>
                {language === 'pt-BR'
                  ? 'Sua criatura chegou ao topo. Você pode devolvê-la ao ovo e escolher quem ela renasce.'
                  : 'Your creature reached the top. You can return them to the egg and choose who they are reborn as.'}
              </p>
              {/* "Rebirth" primário com `egg` 24 pelado (canvas EVO-16). */}
              <button
                type="button"
                onClick={() => setRebirthOpen(true)}
                style={{ ...sm2Button('primary'), width: '100%' }}
              >
                <Icon name="egg" size={24} tone="inherit" />
                {language === 'pt-BR' ? 'Renascimento' : 'Rebirth'}
              </button>
            </div>
          )}
          {/* ⚠️ A recusa MOTIVADA, que a auditoria de 06/09/2026 achou morta.
              `rebirthRefusal` distingue `not-paid` de `not-ultra` justamente
              porque cada motivo tem uma saída diferente — e o app só usava
              `canRebirth`, então um jogador `demo` no ultra via NADA, enquanto
              o guia prometia o Renascimento a todos sem dizer que é pago.
              Beco sem saída no ponto mais alto da escada, para o usuário mais
              engajado que existe.
              Só o `not-paid` vira convite: `not-ultra` é "continue subindo" (a
              própria página já conta isso) e `already-used` é registro, não
              oferta repetida. O motivo de telemetria continua sendo
              `evolution` porque é literalmente onde o card está. */}
          {/* Canvas Evolução EVO-20: a recusa `not-paid` é o MESMO card-convite
              âmbar, sem frase em cima — a frase antiga dizia "chegou ao topo"
              para um rookie demo, porque `rebirthRefusal` responde `not-paid`
              antes de olhar o estágio. E só quando o convite do demo (o
              primeiro bloco da página) não está montado: dois convites iguais
              na mesma tela é cobrança, não convite. */}
          {labTab === 'evolution' && rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId && (
            <div style={{ marginTop: 16 }} data-rebirth-block>
              <UnlockNudge
                language={language}
                reason="evolution"
                onOpen={() => setUnlockReason('evolution')}
              />
            </div>
          )}
          {/* Copy §5.4 (21/09/2026): `not-ultra` ganha a sua frase — contexto
              em `sm2Hint`, e acabou. NÃO vira convite nem botão: a saída é a
              própria página, que já conta a escada (canvas Evolução §24:
              "not-ultra sem convite"). Só fora do demo, que tem o convite dele. */}
          {labTab === 'evolution' && rebirthRefusal(gameState) === 'not-ultra' && !gameState.demoCharacterId && (
            <p style={{ ...sm2Hint, marginTop: 16, textAlign: 'center' }} data-rebirth-block>
              {language === 'pt-BR'
                ? 'O padrão ainda não chegou ao limite do que esta forma ocupa.'
                : "The pattern hasn't yet reached the edge of what this form can hold."}
            </p>
          )}
          {/* EVO-21: o registro — linha 12 `muted` com `egg` FILL 1 20; memória,
              nunca oferta repetida (a linha `rebirth` do save nunca é apagada).
              Copy §5.6: a 2ª frase é a família obrigatória da §11 ("É ele.
              Ainda é ele.") — sem ela, somada a "parte da alma" e ao fato de
              renascer ser compra, a cena lê como morte de um ente. Proibidas
              aqui: morrer, morte, partir, despedida, adeus. */}
          {labTab === 'evolution' && gameState.rebirth && (
            <p style={{ ...sm2Hint, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }} data-rebirth-block>
              <Icon name="egg" size={20} fill={1} tone="muted" />
              <span>
                {language === 'pt-BR'
                  ? `Já aconteceu, uma vez. Renasceu do ${gameState.rebirth.fromStage} como "${gameState.rebirth.criatura}". É ele. Ainda é ele.`
                  : `It already happened, once. Reborn from ${gameState.rebirth.fromStage} as "${gameState.rebirth.criatura}". Same pattern. Still the same one.`}
                {/* Fase 3 (decisão 1): o traço que ficou do ciclo anterior — o
                    mundo nomeia o que continuou, nunca o que se perdeu (L4/L5). */}
                {gameState.rebirth.heranca && ELEMENT_INFO[gameState.rebirth.heranca.elemento as ElementId] && (
                  <span data-rebirth-heranca={gameState.rebirth.heranca.elemento}>
                    {language === 'pt-BR'
                      ? ` Do ciclo anterior ficou ${ELEMENT_INFO[gameState.rebirth.heranca.elemento as ElementId].name.pt.toLowerCase()}.`
                      : ` From the previous cycle, ${ELEMENT_INFO[gameState.rebirth.heranca.elemento as ElementId].name.en.toLowerCase()} stayed.`}
                  </span>
                )}
              </span>
            </p>
          )}

          {labTab === 'pet' && (
            <Suspense fallback={<ScreenSkeleton language={language} />}><PetPage
              headingLevel={2}
              stages={gameState.soulmonStages ?? []}
              dominantElement={gameState.soulmonMeta?.dominantElement}
              achievements={unlockedAchievements(gameState)}
              unlockedEvolutions={gameState.unlockedEvolutions}
              currentStageId={gameState.evolutionStage}
              demoCharacterId={petLine}
              petName={soulmonDisplayName(gameState.soulmonMeta) || undefined}
              savedSkills={gameState.soulmonSkills}
              onSkillsComputed={handleSkillsComputed}
              savedClassTitles={gameState.soulmonClassTitles}
              onClassTitlesComputed={handleClassTitlesComputed}
              savedCompanheiro={gameState.soulmonCompanheiro}
              onCompanheiroComputed={handleCompanheiroComputed}
              language={language}
            /></Suspense>
          )}

          {/* DEX DE SONHOS na página do PET, e não em Configurações: é uma
              COLEÇÃO do bicho — cenas dele dormindo —, então mora onde já vive
              a ficha dele (formas, descrições, habilidades). Em Configurações
              ele leria como um painel de métrica de sono, que é exatamente a
              leitura que a Parte 3 do plano manda evitar. */}
          {labTab === 'pet' && (
            <div style={{ marginTop: 16 }}>
              <Suspense fallback={<ScreenSkeleton language={language} />}>
                <DreamDex rest={gameState.rest ?? createRestState()} language={language} />
              </Suspense>
            </div>
          )}

          {/* O diário de aventuras fica ao lado do Dex pelo mesmo motivo dele:
              é coleção DA CRIATURA, não métrica do jogador. Numa tela de
              estatísticas viraria painel de desempenho. */}
          {labTab === 'pet' && (
            <div style={{ marginTop: 16 }}>
              <Suspense fallback={<ScreenSkeleton language={language} />}>
                <AdventureDiary entries={gameState.adventures ?? []} language={language} />
              </Suspense>
            </div>
          )}
          {labTab === 'stats' && statsPage}
    </>
  );
  const hallContent = (view: 'directory' | 'friends') => (<Suspense fallback={<ScreenSkeleton language={language} />}>
              <LibraryPage
                view={view}
                saveId={saveId}
                friends={gameState.friends ?? []}
                canGiftToday={gameState.energyPoints >= getMaxEnergyForStage(gameState.evolutionStage)}
                onFriendsChange={(friends) => setGameState(prev => ({ ...prev, friends }))}
                onGiftSent={() => {}}
                onVisitPlayer={() => contarMissao('friend-visit')}
                metaDoDiaCumprida={dailyTotal > 0 && dailyDone >= dailyTotal}
                playerDayTz={gameState.playerDayTz}
                language={language}
                embedded
              />
            </Suspense>);


  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col sm-app-bg">
        {/* ── O VISOR SINTONIZOU SOZINHO ───────────────────────────────────
            X-3: a adoção automática da virada do dia trocava o rosto do bicho
            sem nenhum aviso fora da aba Evolução. Esta região vive na RAIZ, e
            não dentro da aba, exatamente porque o achado é sobre quem nunca
            abre a aba.

            Fora da tela em vez de `display:none`: região viva escondida com
            `display:none` não é anunciada por leitor de tela nenhum. */}
        <div
          aria-live="polite"
          data-testid="sm-tuned-live"
          style={{
            position: 'absolute', width: 1, height: 1, overflow: 'hidden',
            clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap',
          }}
        >
          {visorAnunciou ? spriteText('tuned', language) : ''}
        </div>
        {/* ── PULAR PARA O CONTEÚDO ────────────────────────────────────────
            PRIMEIRO nó focável do documento, de propósito: a barra de
            navegação é montada antes do `<main>` no DOM, então quem navega
            por teclado atravessava os 5 botões da nav (e, com o popover
            aberto, mais 4 linhas) antes de alcançar o conteúdo — em TODA
            troca de tela.

            Padrão consagrado, inteiro: fica fora da tela em repouso (nunca
            `display:none`, que o tiraria da ordem de foco e o tornaria
            inútil), aparece ao receber foco e leva ao `<main id="conteudo">`,
            que tem `tabIndex={-1}` para ser um alvo de foco programático de
            verdade — sem isso o `href="#…"` move a âncora do documento mas o
            Tab seguinte volta para a nav, que é o defeito clássico. */}
        <a href="#conteudo" className="sm-skip-link">
          {language === 'pt-BR' ? 'Pular para o conteúdo' : 'Skip to content'}
        </a>
        {/* Aqui morava um `<PixelFrame />` — a borda de cobre fina em volta da
            TELA INTEIRA (`.sm-screen-frame`). Saiu em 27/08/2026 e não deve
            voltar: com o `.sm2-device` ganhando borda própria no mesmo dia
            ("box com bordas onde o Soulmon fica"), o app passou a empilhar
            QUATRO bordas de cobre concêntricas — a da página, a do corpo do
            aparelho, a pintada na foto de fundo e o anel do `.sm2-viewport`.
            A da página era a única sem função: ela tinha perdido os 4 cantos
            de pixel art (pedido do dono no mesmo dia) e virou uma linha de 3px
            sem propósito.

            28/08/2026: o `SoulmonOnboarding` também parou de montá-lo — o dono
            pediu consistência total, nenhuma tela leva mais a borda. O
            COMPONENTE continua existindo, sem chamador nenhum no momento (ver
            `PixelFrame.tsx`): apagar a peça inteira por um pedido de estética
            jogaria fora trabalho que a referência do kit pode pedir de volta. */}
        {/* Selo de "sem sinal": montado UMA vez, aqui, e por isso cobre todas
            as superfícies do app sem redesenhar nenhuma. Ele se acende sozinho
            pelos eventos `online`/`offline` do window (ver OfflineSeal) e some
            quando a rede volta; não bloqueia nada, porque o jogo roda local. */}
        {/* Dentro de uma área o título fica no centro do topo: o selo desce para
            baixo da barra em vez de cobri-lo (QA da Guilda L1 #22). */}
        <OfflineSeal language={language} topOffset={area ? 64 : 8} />
        {unlockReason && (
          <UnlockAccountModal
            language={language}
            reason={unlockReason}
            onUnlocked={handleAccountUnlocked}
            onClose={() => setUnlockReason(null)}
          />
        )}
        {/* ⚠️ `interstitial === 'welcome'` (= nenhum intersticial na tela) é o
            gate, e ele substitui a esperança depositada no `setTimeout(15s)`.
            Este modal monta em z-120 (`ModalSheet`), ABAIXO do relatório
            diário e do check-in (200): numa manhã cheia ele aparecia debaixo,
            com focus-trap próprio, e a pessoa perdia o único pedido semanal
            de proteger o save — o bug que a fila de intersticiais foi criada
            para matar, reintroduzido por uma porta lateral (auditoria de
            06/09/2026). O timer fica: ele evita a montagem instantânea na
            abertura. Quem decide agora é a fila, e o gate é REATIVO — quando
            o último intersticial fecha, o pedido aparece sozinho. */}
        {protectPrompt && interstitial === 'welcome' && (
          <ProtectProgressModal
            language={language}
            reason={protectPrompt}
            onDismiss={dismissProtectPrompt}
            onConfirm={handleProtectProgress}
          />
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <Suspense fallback={null}>
            <HelpModal
              isOpen
              onClose={() => setShowHelpModal(false)}
              language={language}
            />
          </Suspense>
        )}

        {/* Créditos (monetização) — modal próprio, aberto pelo menu sanduíche. */}
        {creditsOpen && (
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
            <CreditsModal
              language={language}
              credits={gameState.credits ?? 0}
              accountTier={gameState.accountTier ?? 'paid'}
              canReroll={!!readLocal(STORAGE_KEYS.SOULMON_PROFILE)}
              onWatchAd={handleWatchAd}
              onBuyPack={handleBuyCreditPack}
              /* WP5.7 — a linha da Loja de Créditos apenas ABRE a Nova
                 Leitura; quem cobra é a tela que mostra as perguntas. */
              onReroll={() => { setCreditsOpen(false); setNewReadingOpen(true); }}
              onClose={() => setCreditsOpen(false)}
            />
          </Suspense>
        )}

        {/* WP5.7 (H.4) — a Nova Leitura. O que era um sorteio pago com
            `Math.random()` (e que o `termos.html` chamava de "sorteio pago")
            passou a ser uma leitura DETERMINÍSTICA das respostas. */}
        {newReadingOpen && (
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
            <NewReadingModal
              language={language}
              credits={gameState.credits ?? 0}
              answers={readJson<{ answers?: Record<string, string> }>(
                STORAGE_KEYS.SOULMON_PROFILE, {},
              ).answers ?? {}}
              onConfirm={async respostas => {
                const ok = await handleNewReading(respostas);
                if (ok) setNewReadingOpen(false);
                return ok;
              }}
              onClose={() => setNewReadingOpen(false)}
            />
          </Suspense>
        )}

        {/* WP2.4 — a cerimônia do marco. Fora da fila de intersticiais de
            propósito (z-300): ela não pede nada além do gesto e não pode
            esperar a vez — comemorar depois não é comemorar. */}
        {milestoneCeremony && (
          <MilestoneCeremony
            tier={milestoneCeremony.tier}
            habitName={milestoneCeremony.habitName}
            text={milestoneCeremony.text}
            dateLabel={milestoneCeremony.dateLabel}
            reducedMotion={milestoneCeremony.reducedMotion}
            spriteUrl={displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine)}
            language={language}
            onDone={() => setMilestoneCeremony(null)}
          />
        )}

        {rebirthOpen && (
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
            <RebirthModal
              language={language}
              onConfirm={async escolhas => {
                const ok = await handleRebirth(escolhas);
                if (ok) setRebirthOpen(false);
                return ok;
              }}
              onClose={() => setRebirthOpen(false)}
            />
          </Suspense>
        )}

        {/* O FAB "Nova Atividade" SAIU da Home (G1/G8). Ele flutuava sobre a
            lista e, em 412×915, cobria exatamente a última linha visível — o
            controle de criar tapava o conteúdo que ele cria. A referência não
            tem FAB: tem CTA largo no fim do painel, que é onde a lista termina
            e onde o gesto de "adicionar mais um" nasce. Ver
            `RitualPanel`/`ctaLabel`. A regra `.sm-px-fab` ficou no index.css
            SEM consumidor — é peça de kit, e apagá-la só criaria trabalho se
            outra tela precisar de um flutuante. */}

        {/* ── O FUNDO DA HOME = o corpo do aparelho (canvas Home, D-H1) ────
            A página É o aparelho: `--sm2-bg` sólido, e por cima dele a TEXTURA
            P4 — `home-scene-1547.png` (a moldura pintada do dono) a 10% de
            opacidade, numa camada `fixed`, `pointer-events: none`, abaixo de
            todo conteúdo (`z-index: 0`; o `<main>` está em 1). É a exceção
            declarada à tese do Visor, decidida pelo dono em 16/09/2026
            (DECISÕES §19): os cards continuam SÓLIDOS e o contraste é medido
            contra a superfície, nunca contra a cena. Estática — nada a cortar
            em `prefers-reduced-motion`.

            O que SAIU daqui: o cenário equipado pintado como fundo de PÁGINA
            (era pixel fora do visor — ele já é pintado DENTRO do vidro pelo
            `CompanionHUD`) e a grade de circuito (`.sm-circuit-bg`, G10).

            O arquivo é `home-scene-texture.webp` (688×1529, 32 KB), derivado
            da arte original de 4,2 MB: a 10% de opacidade nenhum detalhe da
            resolução nativa sobrevive, e 4 MB no caminho do LCP da tela mais
            aberta do app é orçamento de performance jogado fora. A regra do
            `.sm-pet-sticky` (index.css) repete a mesma camada com
            `background-attachment: fixed` para a faixa fixa do pet casar
            pixel a pixel com o fundo que rola por baixo dela. */}
        {pane === 'main' && (
          <div aria-hidden="true" className="sm2-home-bg" data-home-texture />
        )}

        {/* Scrollable Content - padding bottom pra não ficar atrás do link de canto (+ chat na home)

            `<main>` e não `<div>`: o app só tinha `<nav>`. Sem landmark de
            conteúdo principal, um leitor de tela não tem para onde pular
            depois da navegação — ele percorre a barra inferior e cai no meio
            do conteúdo sem saber que entrou nele. É UM `<main>` por documento,
            e ele fica aqui (o container de rolagem que troca de conteúdo por
            `currentView`), não dentro de cada página. */}
        <main
          id="conteudo"
          /* Alvo do "pular para o conteúdo": `-1` = focável por programa,
             fora da ordem de Tab. Ver o comentário no atalho lá em cima. */
          tabIndex={-1}
          /* Gutter 16 na Home (canvas Home, P1) — TEM de casar com o
             `margin-inline: -16px` do `.sm-pet-sticky` (index.css). As outras
             views seguem em 24. */
          className={pane === 'main' ? 'flex-1 overflow-y-auto px-4' : 'flex-1 overflow-y-auto px-6'}
          style={{
            position: 'relative', zIndex: 1,
            /* RODADA 4: o `pt-3` virou TOKEN porque a área fixa do pet precisa
               cancelar exatamente este padding no `top` do sticky. Com os dois
               valores cravados em lugares diferentes, sobrava uma fresta de
               12px em que a lista aparecia rolando ACIMA do pet (visto em
               screenshot, 412×700) — e divergiriam na primeira vez que alguém
               mexesse num deles. */
            paddingTop: 'var(--sm-scroll-pt)',
            /* B5: `--sm-chatdock-h` (altura real do dock) + 16px de folga,
               no lugar do `100px` mágico. Ver o token no index.css. */
            /* `--sm-corner-h`: a faixa do link de canto (Mapa na Home, Home
               no Mapa). A barra inferior saiu; as áreas não têm link de canto,
               mas a folga igual evita o último item colado no rodapé. */
            /* minimal-ui F2: na Home o terminal e o link do Mapa dividem a
               MESMA faixa do rodapé — a folga é a do dock, só. */
            paddingBottom: pane === 'main'
              ? 'calc(env(safe-area-inset-bottom, 0px) + var(--sm-chatdock-h) + 16px)'
              : 'calc(var(--sm-corner-h) + env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          {/* ── O `<h1>` DA TELA ──────────────────────────────────────────────
              Nenhuma tela tinha heading; Evolução e Estatísticas não tinham
              NADA. Aqui cada view ganha o seu.

              **O CRITÉRIO (uma página, um `<h1>`):** se o COMPONENTE da view já
              é dono do próprio `<h1>`, o App NÃO injeta; se não é, o App injeta.
              Nada de heurística no meio. Donas do próprio `<h1>` — e por isso
              ausentes do mapa abaixo:
               · `main`       — o wordmark "Soulmon" do `HomeHud`;
               · `pet`        — o nome da criatura, na `PetPage`;
               · `games`      — "Activities"/"Atividades", na `ActivitiesPage`;
               · `tournament` — "Tournament"/"Torneio", na `TournamentPage`;
               · `library`    — "Library"/"Biblioteca", na `LibraryPage`.
              As três últimas estavam no mapa E na própria página: a tela de
              Atividades renderizava DOIS `<h1>` com o mesmo texto (medido), o
              que faz o índice de headings de um leitor de tela anunciar dois
              começos de página. Tela nova: só entra no mapa se o componente
              dela não tiver `<h1>` — e nunca as duas coisas.
              Título de tela nasce em inglês com par PT-BR, como todo texto. */}
          {(() => {
            /* minimal-ui F1: o `<h1>` das áreas e das páginas do menu vem do
               TOPO NOVO (`AreaTopBar`: voltar em círculo + título central).
               Desde a F5 nenhuma área renderiza uma página dona do próprio
               `<h1>` (o conteúdo mora nas folhas do `AreaView`), então o
               `AreaTopBar` é sempre o dono do título. A Home tem o wordmark
               do `HomeHud`; o Mapa, o `<h1>` do `MapPage`. */
            const isPtH = language === 'pt-BR';
            const area = areaOf(currentView);
            const page = menuPageOf(currentView);
            if (!area && !page) return null;
            return (
              <AreaTopBar
                title={area ? areaLabel(area, isPtH) : menuPageLabel(page!, isPtH)}
                backLabel={area
                  ? (isPtH ? 'Voltar ao mapa' : 'Back to map')
                  : (isPtH ? 'Voltar ao início' : 'Back to home')}
                onBack={goBack}
                icon={area ? 'map' : 'arrow_back'}
                overScene={!!area}
                covered={!!area && areaLayerOpen}
              />
            );
          })()}

          {pane === 'map' && (
            <MapPage
              language={language}
              onOpenArea={(id: AreaId) => goTo(areaView(id))}
              bits={gameState.gamePoints ?? 0}
              emblems={gameState.emblems ?? 0}
              credits={gameState.credits ?? 0}
            />
          )}

          {/* ── AS ÁREAS DO MAPA (minimal-ui F4 molde + F5 conteúdo) ─────────
              `AreaScene` (fundo + lotes + NPC anfitrião) + o `AreaSheet` do
              lote aberto. As SEIS áreas têm o conteúdo real (F5), todas num
              `AreaView` só: Mercado (lojinhas com abas por moeda,
              Conquistas), Arena (Torneio, Duelo), Exploração (Masmorra,
              Corrida com obstáculos), Jogos (Pedra, papel e tesoura), Laboratório
              (Evolução/Soulmon/Stats) e Hall (Biblioteca). */}
          {area && (
            <Suspense fallback={<ScreenSkeleton language={language} />}>
              {/* `key` da view: trocar de área remonta e fecha a folha aberta. */}
              <AreaView
                key={currentView}
                area={area}
                initialGame={area === 'jogos' && refugeLaunch ? 'respiracao' : undefined}
                onInitialGameConsumed={handleRefugeLaunchConsumed}
                onLayerChange={setAreaLayerOpen}
                language={language}
                ownership={{
                  ownedBackgrounds: gameState.ownedBackgrounds ?? [],
                  equippedBackground: gameState.equippedBackground ?? null,
                  ownedFurniture: gameState.ownedFurniture ?? [],
                  equippedDecor: gameState.equippedDecor ?? EMPTY_DECOR,
                  missionProgress,
                }}
                actions={{ onBuy: handleShopBuy, onEquip: handleEquipBackground, onEquipFurniture: handleEquipFurniture }}
                points={gameState.gamePoints ?? 0}
                emblems={gameState.emblems ?? 0}
                credits={gameState.credits ?? 0}
                onExchangeCredits={handleExchangeCredits}
                accountTier={gameState.accountTier}
                onUnlock={() => setUnlockReason('shop')}
                tournament={{
                  saveId,
                  petStage: gameState.evolutionStage,
                  petLine,
                  pvpEnabled: !!gameState.pvpEnabled,
                  onTogglePvp: (enabled) => setGameState(prev => ({ ...prev, pvpEnabled: enabled })),
                  trophies: gameState.trophies ?? [],
                  language,
                  emblems: gameState.emblems ?? 0,
                  onEarnEmblems: amount => {
                    earnEmblems(amount);
                    // A missão conta a PARTIDA, não a vitória: pagar só por
                    // vitória faria a missão semanal recompensar resultado, e o
                    // Torneio já mede o jogador contra ele mesmo pela faixa.
                    contarMissao('tournament-match');
                  },
                  totalXP: gameState.totalXP,
                  onMatchPlayed: won => setGameState(prev => awardBondXP(
                    prev, { kind: 'tournamentMatch', won }, playerDayKey(new Date(), prev.playerDayTz),
                  )),
                  weeklyMissions: missoesDaSemana,
                  onClaimWeekly: resgatarMissao,
                }}
                evolutionStage={gameState.evolutionStage}
                demoCharacterId={petLine}
                skills={gameState.soulmonSkills}
                profissao={manifestacaoAtual?.profissao}
                profissaoNome={manifestacaoAtual?.profissaoNome}
                onEarnPoints={handleEarnGamePoints}
                /* Exploração + Jogos: os MESMOS handlers que a antiga
                   `ActivitiesPage` recebia. */
                play={{
                  onDungeonEnter: handleDungeonEnter,
                  onDungeonLose: handleDungeonLose,
                  onDungeonHeartDrop: handleDungeonHeartDrop,
                  onGlitchtama: handleGlitchtama,
                  /* 🔗 #59b — ⚔️ ANDAR LIMPO. O teto `BOND_DAILY_CAP.dungeon`
                     (`bond.ts`) é quem decide quanto uma segunda run ainda
                     rende; aqui só se emite o evento. */
                  onFloorCleared: handleDungeonFloorCleared,
                  onDungeonEnemyDefeated: handleDungeonEnemyDefeated,
                  onDinoScore: handleDinoScore,
                  /* 🏛️ Prédios de Jogos (30/09/2026): o dia do JOGADOR em ISO
                     (Picross do dia, Revisão) e os cartões da Revisão da
                     Malha, que moram no save. A regra é de `utils/mente/revisao`;
                     aqui só se grava o estado que o jogo devolveu. */
                  todayKey: playerDayIso(new Date(), gameState.playerDayTz),
                  review: gameState.review,
                  minigameBitsToday: minigameBitsToday(gameState, playerDayKey(new Date(), gameState.playerDayTz)),
                  onReviewChange: (next) => setGameState(prev => ({ ...prev, review: next })),
                  /* WP4.5 — o sumidouro. A cobrança é conferida sobre o `prev`
                     (dois toques no mesmo lote do React leriam o mesmo saldo e
                     comprariam duas vezes com o dinheiro de uma). */
                  onSpendBits: (pts) => {
                    if ((gameState.gamePoints ?? 0) < pts) return false;
                    setGameState(prev => (prev.gamePoints ?? 0) < pts
                      ? prev
                      : { ...prev, gamePoints: (prev.gamePoints ?? 0) - pts });
                    return true;
                  },
                }}
                /* Laboratório e Hall: o conteúdo real (`labContent`,
                   `hallContent`, montados antes do `return`). */
                /* 🧭 Passeio + Travessias (30/09/2026): o estado do save e o
                   ÚNICO caminho de escrita (função pura sobre `prev`). */
                passeio={{ crossings, onChange: handleCrossings }}
                labTab={labTab}
                onLabTab={setLabTab}
                labContent={labContent}
                hallContent={hallContent}
                guild={{ saveId, metaDoDiaCumprida: fioMetaCumprida, fioGoal, mySprite: minhaCriaturaUrl, playerDayTz: gameState.playerDayTz, onClaimed: handleGuildClaimed, onScenes: handleGuildScenes, accountTier: gameState.accountTier, onUnlock: () => setUnlockReason('shop'), onLogin: () => goTo('page:settings') }}
              />
            </Suspense>
          )}

          {pane === 'main' && (
            <div className="space-y-4">
              {/* HUD do topo: SÓ a marca (o `<h1>` da Home) + o selo do dia.
                  A leitura de HP/energia mora no VIDRO (`VisorBar`, em pixel,
                  no `CompanionHUD`) — e só lá. A barra DOM que este componente
                  desenhava (a "segunda leitura", achado 1 do canvas Home)
                  SAIU em 16/09/2026 (DECISÕES §19). */}
              <HomeHud
                /* WP2.12 — o selo do dia. `focusComplete` existia com teste e
                   nenhum chamador, e o guia prometia "completar os 3 rende o
                   selo". Binário de propósito: nunca "2 de 3". */
                focusSealed={focoDoDiaCompleto}
                language={language}
                /* D6 — o menu SÓ ÍCONE da Home: tudo que morava no sanduíche
                   da barra inferior. Ícone `acoes` (grade 3×3 de gemas, arte
                   do squad de arte) pelado (regra do dono),
                   alvo de 44 no botão, divulgação com `aria-expanded`. */
                trailing={(
                  <button
                    type="button"
                    onClick={() => setHomeMenuOpen(true)}
                    aria-label={language === 'pt-BR' ? 'Menu' : 'Menu'}
                    aria-expanded={homeMenuOpen}
                    title={language === 'pt-BR' ? 'Menu' : 'Menu'}
                    data-home-menu-btn
                    className="sm2-corner-link"
                    style={{
                      width: 44, height: 44, flex: '0 0 44px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                    }}
                  >
                    {/* C1 (01/10/2026): hambúrguer simples — três tracinhos. */}
                    <MenuBars size={28} />
                  </button>
                )}
              />

              {/* Pet — acima, sem estar contido em uma caixa */}
              <CompanionHUD
                companionMood={getCompanionMood()}
                energyLevel={progress}
                message={getCompanionMessage()}
                currentStage={getCurrentStageName()}
                evolutionStage={gameState.evolutionStage}
                eggType={gameState.eggType}
                demoCharacterId={petLine}
                /* Sprite próprio SÓ depois de adotado (§2.3.1) — senão o visor
                   segue na arte de reserva, que nunca é erro. */
                ownSpriteUrl={displaySprite(spriteAcervo, gameState.evolutionStage)?.url}
                healthPoints={gameState.healthPoints}
                maxHealthPoints={gameState.maxHealthPoints}
                dominantBranch={getDominantBranch()}
                currentXP={gameState.totalXP}
                nextLevelXP={getNextLevelXP()}
                triggerMessage={messageTrigger}
                energyPoints={gameState.energyPoints}
                maxEnergyPoints={getMaxEnergyForStage(gameState.evolutionStage)}
                talento={manifestacaoAtual?.talento}
                equippedDecor={gameState.equippedDecor ?? EMPTY_DECOR}
                trophies={gameState.trophies ?? EMPTY_TROPHIES}
                fullSignal={fullSignal}
                perfectDays={gameState.perfectDays}
                onEvolve={handleEvolve}
                canEvolve={(() => {
                  const req = FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required;
                  if (gameState.evolutionLocked || gameState.perfectDays < req) return false;
                  // #59 — depois de uma queda por HP, o botão só acende na
                  // virada seguinte. Mesma função que o `handleEvolve` commita.
                  if (!podeEvoluirDepoisDaQueda(gameState)) return false;
                  // Mesma fonte que anuncia e que commita (utils/evolutionTarget.ts):
                  // `getDominantBranch` mandava todo empate para `data` e podia
                  // liberar/travar o botão contra um destino que não era o real.
                  const { stage: next } = evolutionTarget({
                    points: { power: gameState.powerPoints, harmony: gameState.harmonyPoints, benevolence: gameState.benevolencePoints },
                    reading: carePatternReading,
                    currentBranch: gameState.currentBranch,
                    evolutionStage: gameState.evolutionStage,
                    unlockedEvolutions: gameState.unlockedEvolutions,
                    perfectDays: gameState.perfectDays,
                  });
                  if (next === gameState.evolutionStage) return false;
                  // INCUBAÇÃO (D-G8c) — mesma função que o `handleEvolve`
                  // commita. Regra copiada diverge em silêncio (footgun 9), e
                  // estes dois já divergiram uma vez.
                  return incubationReady(gameState.incubation, next, agoraParaIncubacao);
                })()}
                onEvolveRequest={handleEvolveRequest}
                careEvent={careEvent}
                onCareEventComplete={handleCareEventComplete}
                foodInventory={gameState.foodInventory}
                onFeed={handleFeed}
                onShower={handleShower}
                hasNewItems={newItemsReady}
                onBackpackSeen={handleBackpackSeen}
                onSleep={handleSleep}
                isSleeping={isSleeping}
                onPet={handlePet}
                healCapSignal={healCapSignal}
                speakSignal={speakSignal}
                /* WP3.10 — o traço de nascimento chega à VOZ. Ele existia só
                   como efeito de regra e uma linha em Estatísticas: dois pets
                   do mesmo estágio se comportavam diferente e falavam igual. */
                petPassive={gameState.petPassive}
                /* WP3.1 — o chat passa a saber há quanto tempo estão juntos. */
                bondLevel={bondLevelFor(gameState.totalXP ?? 0)}
                /* WP1.12 — a tonalidade do demo. Cosmética e só. */
                demoTint={gameState.demoTint}
                /* WP3.3 — nome e título do Vínculo na home. O título é
                   DERIVADO na leitura (`bondLevelFor(totalXP)`); guardá-lo no
                   save seria duas fontes para o mesmo número (footgun 9). */
                petDisplayName={soulmonDisplayName(gameState.soulmonMeta) || undefined}
                bondTitleText={bondTitle(bondLevelFor(gameState.totalXP ?? 0), language)}
                redeemedMark={!!gameState.redeemed && !!gameState.showRedeemed}
                hauntedWatching={hauntedWatching}
                /* 🧭 O palco "passeando" (30/09/2026): só o nome da região de
                   destino — um marcador sem texto perto do pet, que não bloqueia
                   gesto nenhum. Nunca vai ao widget, ao desktop nem ao push. */
                walkingTo={passeandoEm}
                /* WP2.7 — o reencontro é por DIAS. `welcomeBack` do relatório
                   já sabia quantos; a VOZ é que não sabia. */
                daysAway={gameState.lastDayReport?.welcomeBack ? (gameState.lastDayReport.daysAway ?? 0) : 0}
                /* WP3.1 — humor de HOJE para o chat. Mesma leitura do
                   DailyReportModal; opcional por definição (o check-in é
                   opcional) e nunca alimenta pontuação. */
                moodToday={moodFor(gameState.moodLog, playerDayKey(new Date(), gameState.playerDayTz))}
                equippedBackground={gameState.equippedBackground ?? null}
                useAI={useAI}
                aiSettings={chatPersonality}
                onCreateActivity={handleAICreateActivity}
                language={language}
                evolutionFlash={evolutionFlash}
                feedAnim={feedAnim}
                play={playDeck}
              />

              {/* minimal-ui F2 (abordagem B): o SLOT DO DIA mora logo abaixo da
                  faixa do pet — a ordem da tela é marca → cena → avisos → lista.
                  A fila e a prioridade não mudaram (filaDeAvisos.contract). */}
              {/* ═══════════════════════════════════════════════════════════
                  SLOT DO DIA — UM cartão contextual por vez, e essa é a REGRA
                  ═══════════════════════════════════════════════════════════

                  PRIORIDADE FIXA:  HP  >  TRIAGEM  >  SEMANAL  >  RECOMEÇO

                  **Só o primeiro da fila renderiza.** Os demais viram uma
                  linha discreta ("+2 avisos") que expande sob toque.

                  Por que isto existe, e por que a prioridade é escrita aqui e
                  não distribuída: os quatro avisos podem coincidir. Num
                  DOMINGO que também seja DIA 1, com a pilha atrasada e o HP em
                  1, a Home abria com banner de HP + botão de arrumar a pilha +
                  relatório semanal + cartão de recomeço — quatro superfícies
                  de meta-gestão empilhadas ANTES da primeira tarefa, no dia em
                  que a pessoa está pior. Cada um deles foi acrescentado
                  sozinho e parecia barato sozinho; o custo só existe na soma,
                  e ninguém é dono da soma. Esta lista é a dona.

                  A ordem não é estética, é de CONSEQUÊNCIA:
                   1. HP — é a única com dano de jogo em curso hoje;
                   0. PRIMEIRO DIA — o mais perecível: morre na virada;
                   1. HP;
                   2. SEMANAL — raro (1×/semana) e é a única superfície
                      reflexiva da constância; por isso vem ANTES da triagem,
                      que aparece todo dia;
                   3. TRIAGEM — a única acionável em um toque, e planejar é o
                      que alivia (Masicampo & Baumeister);
                   4. PRIMING DE PUSH — pedido do app, e pedido cede a vez;
                   5. RECOMEÇO — convite, e o mais adiável de todos.

                  **Cartão novo na Home entra NESTA fila, com posição
                  declarada — nunca como mais um `&&` solto.** É a mesma
                  restrição da fila única de intersticiais (App.tsx, mais
                  acima), que continua intacta e independente desta. */}
              {(() => {
                const isPtA = language === 'pt-BR';
                const agoraA = new Date();
                const pilhaA = triageQueue(gameState.tasks, agoraA).length;
                const recomecoA = freshStartDismissed ? null : freshStartOffer(gameState, agoraA, language);
                const semanaA = needsWeeklyReport(gameState, agoraA);
                const hpA = gameState.healthPoints <= 1 && gameState.healthPoints > 0
                  && dailyDone < hpSafeToday && !hpBannerDismissed;

                const avisos: { key: string; node: ReactNode }[] = [];

                /* ── 0. PRIMEIRO DIA ──────────────────────────────────────
                   Entra na fila em PRIMEIRO porque é o mais perecível de
                   todos: ele morre na virada, completo ou não. Um cartão que
                   tem um dia de vida não pode ceder a vez para outro que
                   volta amanhã.
                   ⚠️ Ele e o priming abaixo eram dois `&&` SOLTOS acima do
                   HUD — furando a fila logo abaixo do comentário que manda
                   entrar nela (auditoria de 06/09/2026). */
                if (shouldShowFirstDay(gameState.firstDay ?? null, playerDayKey(new Date(), gameState.playerDayTz))) {
                  avisos.push({
                    key: 'firstDay',
                    node: (
                      <FirstDayCard progress={gameState.firstDay!} language={language} />
                    ),
                  });
                }

                /* ── 0b. CONVITE AO REFÚGIO ───────────────────────────────
                   Logo depois do primeiro dia e ANTES do HP: num dia difícil,
                   o primeiro cartão não pode ser coração perdido (parecer do
                   psicólogo, 30/09/2026). A regra (humor 1–2, 1×/dia, 3 dias
                   de intervalo, silêncio após 2 recusas) é de
                   `utils/refugio/convite.ts`; o cartão marca "exibido" ao
                   montar, então escondido no "+N" não gasta a vez. */
                if (shouldInviteRefuge(gameState.refugeInvite, moodFor(gameState.moodLog, playerDayKey(agoraA, gameState.playerDayTz)), playerDayIso(agoraA, gameState.playerDayTz))) avisos.push({
                  key: 'refugio',
                  node: (
                    <RefugeInviteCard
                      language={language}
                      onShown={handleRefugeShown}
                      onDismiss={handleRefugeDismiss}
                      onAccept={() => { handleRefugeAccept(); goTo(areaView('jogos')); }}
                    />
                  ),
                });

                // ── 1. HP ────────────────────────────────────────────────
                // O número vem de `tasksToAvoidHeartLoss`, dono da regra.
                // ÂMBAR (token de ouro), nunca `danger`: vermelho + prazo +
                // imperativo fazia deste o texto mais duro do app, exatamente
                // no dia pior. O perdão (o carinho) vem na MESMA frase.
                if (hpA) avisos.push({
                  key: 'hp',
                  node: (
                    <div className="sm2-notice sm2-notice-warn">
                      <div className="sm2-notice-row">
                        <Icon name="volunteer_activism" size={20} fill={1} tone="gold" />
                        <p className="sm2-notice-body" style={{ flex: 1, minWidth: 0, marginTop: 0 }}>
                          {isPtA
                            ? `Seu Soulmon está com pouco fôlego. ${hpSafeToday} ${hpSafeToday === 1 ? 'item' : 'itens'} hoje já seguram — ou um carinho devolve meio coração.`
                            : `Your Soulmon is short of breath. ${hpSafeToday} ${hpSafeToday === 1 ? 'item' : 'items'} today already holds it — or a rub gives half a heart back.`}
                        </p>
                        <button
                          type="button"
                          className="sm2-notice-dismiss"
                          onClick={handleDismissHpBanner}
                          aria-label={isPtA ? 'Dispensar' : 'Dismiss'}
                        >
                          <Icon name="close" size={20} />
                        </button>
                      </div>
                    </div>
                  ),
                });

                /* ── 1-A. INCUBAÇÃO (D-G8c, parecer R-N/R-O) ──────────────
                   Depois do HP, que é a única coisa que cobra, e antes de tudo
                   o mais: é raro (uma vez por evolução) e some sozinho.

                   A copy diz a VERDADE INTEIRA na entrada, que é a condição
                   R-N: leva um tempo · volta quando quiser · nada se perde.
                   Quem não sabe que nada expira se comporta como se expirasse,
                   e aí a mecânica vira o gate que ela não é.

                   ⚠️ R-I: **nenhuma contagem**. Nada de dígito que decresce,
                   barra em tempo real ou hora impressa — nem aqui, nem na
                   Evolução, nem em fala do pet. Palavra grossa só ("leva um
                   tempo"), porque relógio visível é o motor da reabertura
                   compulsiva que o corte do push (#76) existe para evitar. */
                if (incubandoAgora) avisos.push({
                  key: 'incubacao',
                  node: (
                    <div className="sm2-notice">
                      <div className="sm2-notice-row">
                        <Icon name="egg" size={20} fill={1} tone="gold" />
                        <p className="sm2-notice-body" style={{ flex: 1, minWidth: 0, marginTop: 0 }}>
                          {isPtA
                            ? 'A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você.'
                            : 'The next form is taking shape. It takes a while — come back whenever you like, it waits for you.'}
                        </p>
                      </div>
                    </div>
                  ),
                });

                /* ── 2. SEMANAL (domingo) ─────────────────────────────────
                   ⚠️ Ele vinha DEPOIS da triagem, e a auditoria de 06/09/2026
                   mostrou o efeito: `triageQueue` quase nunca está vazia para
                   quem tem histórico, e o slot renderiza só o PRIMEIRO — então
                   num domingo típico a única superfície reflexiva da semana já
                   nascia colapsada atrás do "+N". O adiável estava ganhando do
                   raro. A triagem volta amanhã; o relatório da semana, não. */
                if (semanaA) avisos.push({
                  key: 'semanal',
                  node: (
                    <WeeklyReportCard
                      report={weeklyReport(gameState, agoraA)}
                      suggestion={stackingSuggestion(gameState, agoraA, language)}
                      /* A janela de 7 de cada hábito — a mesma da lista. */
                      rhythms={gameState.habitRhythms}
                      now={agoraA}
                      language={language}
                      onDismiss={handleDismissWeeklyReport}
                    />
                  ),
                });

                // ── 3. TRIAGEM ───────────────────────────────────────────
                // 200 itens vermelhos viram uma sequência de decisões de um
                // clique. Só existe com pilha de verdade — um botão de arrumar
                // sobre uma lista limpa é cobrança gratuita.
                if (pilhaA > 0) avisos.push({
                  key: 'triagem',
                  node: (
                    <button
                      type="button"
                      className="sm2-notice-more"
                      style={{ borderStyle: 'solid', color: 'var(--sm2-ink)' }}
                      onClick={handleOpenTriage}
                    >
                      <Icon name="cleaning_services" size={20} tone="primary" />
                      <span>{isPtA ? 'Arrumar a pilha' : 'Tidy the pile'}</span>
                      <span className="sm2-num" style={{ fontWeight: 600 }}>({pilhaA})</span>
                    </button>
                  ),
                });

                /* ── 4. PRIMING DE PUSH ──────────────────────────────────
                   O segundo convite de notificação, na voz do PET. Cartão e
                   não modal: o primeiro pedido já foi um modal e foi recusado,
                   e repetir a mesma interrupção seria insistir. Aparece uma
                   vez só; "agora não" encerra. Fica abaixo do que descreve o
                   DIA porque é um pedido do app, e pedido cede a vez. */
                if (mostrarPrimingDePush) avisos.push({
                  key: 'priming',
                  node: (

                  <section
                    style={{
                      padding: 14, borderRadius: 12, marginBottom: 12,
                      border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
                    }}
                  >
                    <p style={{ ...sm2Text, margin: '0 0 10px' }}>{pushPrimingLine(language === 'pt-BR')}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={{ ...sm2Button('primary'), flex: 1 }}
                        onClick={() => { dispensarPriming(); void handleToggleNotifications(); }}
                      >
                        {language === 'pt-BR' ? 'Pode sim' : 'Yes, please'}
                      </button>
                      <button
                        type="button"
                        style={{ ...sm2Button('outline'), flex: 1 }}
                        onClick={dispensarPriming}
                      >
                        {language === 'pt-BR' ? 'Agora não' : 'Not now'}
                      </button>
                    </div>
                  </section>
                  ),
                });

                // ── 5. RECOMEÇO (segunda / dia 1) ────────────────────────
                // Cartão discreto, JAMAIS um modal que tranca a tela: o *fresh
                // start effect* funciona porque relega as imperfeições ao
                // período anterior; um convite que bloqueia o app viraria mais
                // uma cobrança de segunda.
                if (recomecoA) avisos.push({
                  key: 'recomeco',
                  node: (
                    <div className="sm2-notice">
                      <p className="sm2-notice-title">{recomecoA.title}</p>
                      <p className="sm2-notice-body">{recomecoA.body}</p>
                      <div className="sm2-notice-actions">
                        <button type="button" className="sm-btn" style={{ fontSize: 12, padding: '10px 14px' }} onClick={handleFreshStart}>
                          {isPtA ? 'Recomeçar' : 'Start fresh'}
                        </button>
                        <button
                          type="button"
                          className="sm-btn sm-btn-secondary"
                          style={{ fontSize: 12, padding: '10px 14px' }}
                          onClick={handleDismissFreshStart}
                        >
                          {isPtA ? 'Agora não' : 'Not now'}
                        </button>
                      </div>
                    </div>
                  ),
                });

                // ── 6. CARGA DO DIA (canvas Atividades, `CargaDoDia` / D10) ──
                // `plannedEffort` (ponderado) > `OVERCOMMIT_EFFORT` → um TEXTO
                // em `gold-ink` com `info` 20, `role="status"`, sem moldura
                // (PRINCÍPIOS §2: aviso é texto; âmbar = convite). É AVISO,
                // NUNCA BLOQUEIO: a lista inteira continua viva. Última da
                // fila — é o mais adiável de todos os avisos.
                if (isOvercommitted(plannedEffort(gameState.tasks, gameState.activities, dayKeyOf(agoraA), gameState.habitRhythms))) avisos.push({
                  key: 'carga',
                  node: (
                    <p
                      role="status"
                      style={{
                        display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, padding: '4px 4px',
                        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', lineHeight: 1.4,
                        color: 'var(--sm2-gold-ink)',
                      }}
                    >
                      <Icon name="info" size={20} tone="gold" style={{ marginTop: 1, flexShrink: 0 }} />
                      <span>
                        {isPtA
                          ? 'É bastante pra um dia só — quer deixar uma pra amanhã? (Tudo bem de qualquer jeito.)'
                          : 'That’s a lot for one day — want to leave one for tomorrow? (It’s fine either way.)'}
                      </span>
                    </p>
                  ),
                });

                /* ── 6-A. MARCO DO BOSQUE (Guilda, `PLANO-GUILDA.md` §4) ─────
                   Um aviso, ÚLTIMO dos que falam do bosque e só NO DIA em que
                   este aparelho viu o estágio novo (`groveAvisoFor` compara com
                   o dia do jogador; na virada some sozinho — é aviso, não
                   pendência). Fica atrás de recomeço e de carga: é o mais
                   adiável de todos. Sem "não perca", sem número (L4). */
                const marcoBosque = groveAvisoFor(grove, playerDayKey(new Date(), gameState.playerDayTz));
                if (marcoBosque) {
                  const idAviso = groveStageAt(marcoBosque);
                  if (idAviso) avisos.push({
                    key: 'marcoBosque',
                    node: (
                      <div className="sm2-notice" data-guild-marco-aviso>
                        <div className="sm2-notice-row">
                          <Icon name="eco" size={20} fill={1} tone="primary" />
                          <p className="sm2-notice-body" style={{ flex: 1, minWidth: 0, marginTop: 0 }}>
                            {guildCoreText(language, 'guild.marco.aviso', { estagio: groveStageName(language, idAviso) })}
                          </p>
                        </div>
                      </div>
                    ),
                  });
                }

                // ── 7. TERMOS ATUALIZADOS (decisão #24, 21/09/2026) ────────
                // Informativo, sem re-aceite, o ÚLTIMO da fila: é o único
                // aviso que não fala do dia da pessoa. A regra de quando
                // aparecer é de `utils/termsNotice.ts`.
                // EXCEÇÃO (A3, QA rodada 2): na PRIMEIRA abertura em que a
                // versão nova aparece, ele vai para a posição 1 — senão a
                // triagem diária o escondia atrás do "+N" e ninguém ficava
                // sabendo que o texto mudou. Da abertura seguinte em diante,
                // último de novo (`termsNoticePrimeiraVez`).
                if (precisaAvisarTermos(gameState.consent, TERMS_VERSION, PRIVACY_VERSION, termsNoticeSeen)) {
                  const termos = {
                    key: 'termos',
                    node: <TermsUpdateBanner language={language} changed={qualDocMudou(gameState.consent!, TERMS_VERSION, PRIVACY_VERSION)} onOk={handleTermsNoticeOk} />,
                  };
                  if (termsNoticePrimeiraVez) avisos.unshift(termos); else avisos.push(termos);
                }

                if (avisos.length === 0) return null;
                const resto = avisos.length - 1;
                return (
                  <div className="sm2-notice-slot">
                    {avisos[0].node}
                    {resto > 0 && (
                      <>
                        <button
                          type="button"
                          className="sm2-notice-more"
                          aria-expanded={avisosAbertos}
                          onClick={handleToggleAvisos}
                        >
                          <Icon name={avisosAbertos ? 'expand_less' : 'expand_more'} size={20} />
                          <span className="sm2-num" style={{ fontWeight: 600 }}>+{resto}</span>
                          <span>
                            {isPtA
                              ? (resto === 1 ? 'aviso' : 'avisos')
                              : (resto === 1 ? 'notice' : 'notices')}
                          </span>
                        </button>
                        {avisosAbertos && avisos.slice(1).map(a => (
                          <div key={a.key}>{a.node}</div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* BRINCAR saiu do card (`PlayCard`) e virou a 5ª célula do deck
                  do `CompanionHUD` (canvas Home, E1+E2 / PlayEstados): é um
                  gesto de CUIDADO, ao lado de banho/dormir/itens. A linha do
                  buff ("+20% Bits · N min") sai da Home e vai para o canvas
                  Jogos. O gate é o mesmo: não existe antes da PRIMEIRA
                  conclusão (`jaConcluiuAlgo`) — célula inerte, não card
                  ausente. */}

              {/* ── A LISTA DO DIA (canvas Atividades, §20) ─────────────────
                  UM painel de rituais, linhas de 56px, e a gaveta do que saiu
                  de vista — tudo em `components/DailyRituals.tsx` (a
                  composição da linha em `components/pixel/RitualPanel.tsx`). */}
              {(() => {
                /* A trilha de evolução (`EvoTrail`) SAIU da Home — decisão S1
                   do canvas Home (`DECISOES-WIREFRAME.md` §5, aprovada em
                   14/09/2026): escada de altura fora da própria tela, e o
                   destino (a célula Evolução da barra) está a um toque. O
                   componente foi apagado no canvas Evolução (§24), quando o nó
                   virou SVG por token e a trilha ficou sem consumidor. */
                const agora = new Date();
                /* Recomeço, relatório semanal e "arrumar a pilha" NÃO moram
                   mais aqui: os três entraram no SLOT DO DIA lá em cima, com
                   posição declarada na fila de prioridade. Eram três `&&`
                   independentes que, no domingo dia 1 com pilha atrasada,
                   empilhavam antes da primeira tarefa. */

                return (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                  {/* minimal-ui F2: a captura de uma linha (`QuickAddBar`) saiu da
                      Home — o mock aprovado tem só o "+" do cabeçalho da lista,
                      que abre o `CreateModal`. O componente segue no repo. */}

                  {/* P4 — "Equilibrar minha semana". Convite, nunca alarme:
                      aparece só quando algum dia passou do requisito E a
                      proposta melhora de fato (`valeEquilibrar`). Oferecer
                      isso a quem já está equilibrado insinuaria falha onde não
                      há — e a voz do produto encoraja, nunca cobra. */}
                  {podeEquilibrar && (
                    <button
                      type="button"
                      onClick={() => setBalanceOpen(true)}
                      style={{
                        width: '100%', marginBottom: 10, minHeight: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        borderRadius: 12, cursor: 'pointer',
                        border: '1px solid var(--sm2-line)',
                        backgroundColor: 'var(--sm2-surface-2)',
                        color: 'var(--sm2-ink)',
                        fontFamily: 'var(--sm2-font-text)',
                        fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
                      }}
                    >
                      {/* `calendar_month` (D-A8): `eco` é o glifo de MATURIDADE
                          do hábito e não pode ter dois papéis; `balance` não
                          está no subset (nome fora do inventário renderiza
                          VAZIO, sem erro — `src/styles/tokens.md`). */}
                      <Icon name="calendar_month" size={24} />
                      {language === 'pt-BR' ? 'Equilibrar minha semana' : 'Balance my week'}
                    </button>
                  )}
                  <DailyRituals
                    tasks={gameState.tasks}
                    activities={gameState.activities}
                    completedTasks={gameState.completedTasks}
                    habitRhythms={gameState.habitRhythms}
                    /* WP2.8 — a MESMA chave da Janela de Descanso. */
                    hideMetrics={gameState.rest?.hideMetrics === true}
                    language={language}
                    now={agora}
                    expanded={expandedRituals}
                    onExpand={handleExpandRitual}
                    onToggleTask={handleToggleTask}
                    onEditTask={handleEditTask}
                    onPostponeNudge={handlePostponeNudge}
                    onEditActivity={handleEditActivity}
                    onToggleActivity={handleToggleActivityCompletion}
                    onUpdateStep={handleUpdateStep}
                    onRestoreTask={handleRestoreTask}
                    onCreate={handleAddNewActivity}
                    ctaLabel={t.activities.addNew}
                    emptyMessage={t.main.noActivityRegistered}
                    /* Home B: cabeçalho "Hoje N/M" + botão "+" (CreateModal) e o
                       selo do DIA COMPLETO — derivado da MESMA regra da virada
                       (`completeDayReached`, utils/dailyReset.ts), nunca uma
                       segunda definição (footgun 9). */
                    variant="home"
                    dayComplete={diaCompletoHoje}
                  />
                  </div>
                  </div>
                );
              })()}
            </div>
          )}

          {pane === 'stats' && !area && statsPage}

          {pane === 'settings' && (
            <Suspense fallback={<ScreenSkeleton language={language} />}><SettingsPage
              soundMuted={soundMuted}
              onToggleSound={handleToggleSound}
              /* WP4.19 — a marca da volta. Só existe para quem já caiu e
                 subiu de novo, e vem desligada: contar isso é escolha do
                 jogador, não do app. */
              redeemed={gameState.redeemed}
              showRedeemed={gameState.showRedeemed}
              onToggleShowRedeemed={() => setGameState(prev => ({ ...prev, showRedeemed: !prev.showRedeemed }))}
              gm={isAdmin ? gmActions : undefined}
              useAI={useAI}
              onToggleAI={() => setUseAI(!useAI)}
              language={language}
              onChangeLanguage={(lang) => {
                setLanguage(lang);
                writeLocal(STORAGE_KEYS.LANGUAGE, lang, { silent: true });
              }}
              onOpenGuide={() => setGuideModalOpen(true)}
              onOpenGlossary={() => setShowHelpModal(true)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
              onRestoreFromCloud={async (id) => {
                const { cloudLoad, adoptCloudSave } = await import('./utils/cloudSave');
                const state = await cloudLoad(id);
                if (!state) return false;
                // `false` (e não um reload cego) quando a gravação local falha:
                // a UI já trata isso como "não deu" e o save antigo continua.
                if (adoptCloudSave(id, state) !== 'ok') return false;
                window.location.reload();
                return true;
              }}
              onLoginWithEmail={async (email) => {
                const { emailToSaveId, cloudLoad, cloudSave, adoptCloudSave, checarContaExcluidaNoLogin } = await import('./utils/cloudSave');
                // F1 (QA rodada 2): e-mail com lápide não vira identidade —
                // lançar cai no estado de erro do SettingsPage.
                if (await checarContaExcluidaNoLogin(email)) throw new Error('account-deleted');
                const id = await emailToSaveId(email);
                const state = await cloudLoad(id);
                if (state) {
                  // Existing account on this email — adopt its cloud progress.
                  // Dado primeiro, identidade depois: trocar o `saveId` sem o
                  // save gravado faz o próximo cloud save subir o estado LOCAL
                  // por cima do save do outro aparelho.
                  // Lançar aqui é de propósito: o `catch` do SettingsPage já
                  // mostra o estado de erro, e é melhor do que recarregar num
                  // `saveId` sem save por trás.
                  if (adoptCloudSave(id, state, email) !== 'ok') {
                    throw new Error('adoptCloudSave falhou');
                  }
                } else {
                  writeLocal(STORAGE_KEYS.SAVE_ID, id);
                  writeLocal(STORAGE_KEYS.USER_EMAIL, email.trim().toLowerCase());
                  // First login for this email — claim it with the current progress
                  await cloudSave(id, gameState);
                }
                window.location.reload();
                return state ? 'loaded' : 'created';
              }}
            /></Suspense>
          )}

          {/* JANELA DE DESCANSO em CONFIGURAÇÕES: é uma preferência (os
              horários que combinam com a vida da pessoa) e mora ao lado da
              janela de sono automático, que ela conversa. O switch "não quero
              ver métricas" também é preferência — e esconder números sem tirar
              recompensa é a regra do `restWindow.ts`. */}
          {pane === 'settings' && (
            <div style={{ marginTop: 16 }}>
              <Suspense fallback={<ScreenSkeleton language={language} />}>
                <RestWindowCard
                  rest={gameState.rest ?? createRestState()}
                  now={new Date()}
                  language={language}
                  onChangeWindow={handleChangeRestWindow}
                  onToggleMetrics={handleToggleRestMetrics}
                  /* WP1.8 — a permissão de push pedida no MOMENTO-OURO: a
                     pessoa acabou de escolher a hora de deitar. Antes ela só
                     saía do interruptor geral, em Configurações, longe de
                     qualquer motivo. */
                  notificationsEnabled={notificationsEnabled}
                  onEnableReminder={() => { void handleToggleNotifications(); }}
                  reminderPreview={sleepReminderCopy(
                    getCurrentStageName(),
                    language,
                  ).body}
                />
              </Suspense>
            </div>
          )}

          {/* PASSOS em CONFIGURAÇÕES, logo abaixo da Janela de Descanso: é uma
              PREFERÊNCIA de privacidade (ligar/desligar um sensor, com o texto
              de consentimento), e não conteúdo de jogo — na Home ou na página
              do Pet ele leria como mais um medidor a administrar, que é
              exatamente o que a Parte 3 do plano proíbe.

              Some por completo quando não há sensor (PWA, a maior parte da
              base) e quando a pessoa já disse não: `'declined'` é definitivo,
              porque insistir depois de um "não" é assédio. */}
          {pane === 'settings' && stepsAvailable === true && gameState.stepsConsent !== 'declined' && (
            <div style={{ marginTop: 16 }}>
              <StepsCard
                steps={stepsToday}
                available
                hasPermission={gameState.stepsConsent === 'granted' && stepsPermission}
                language={language}
                onRequestPermission={handleStepsRequestPermission}
                onDismiss={handleStepsDecline}
              />
            </div>
          )}

          {pane === 'oracle' && (
            <Suspense fallback={<ScreenSkeleton language={language} />}>
              <OraclePage language={language} />
            </Suspense>
          )}


        </main>

      {/* ── NAVEGAÇÃO (minimal-ui F1) ──────────────────────────────────────
          A barra inferior de 5 abas SAIU (decisão 1 do dono, 23/09/2026).
          Sobra UM link de canto por tela de topo: o Mapa no canto inferior
          direito da Home e a Home no canto inferior esquerdo do Mapa. As
          áreas voltam pelo topo (`AreaTopBar`). **Depois do `<main>` no DOM**,
          pelo mesmo motivo da barra antiga: é `fixed` no rodapé, e a ordem de
          foco tem que visitar o conteúdo antes (WCAG 2.4.3). */}
      {currentView === 'home' && (
        <CornerLink
          icon="mapa"
          side="right"
          label={language === 'pt-BR' ? 'Mapa' : 'Map'}
          onClick={() => goTo('map')}
          ring
        />
      )}
      {currentView === 'map' && (
        <CornerLink
          icon="home"
          side="left"
          label={language === 'pt-BR' ? 'Início' : 'Home'}
          onClick={goBack}
          glow
          ring
        />
      )}
      <HomeMenuSheet
        open={homeMenuOpen}
        onClose={() => setHomeMenuOpen(false)}
        language={language}
        onOpenPage={(p) => goTo(`page:${p}`)}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenCredits={openCredits}
        onResetOnboarding={handleResetOnboarding}
      />

      {/* P4 — a tela de antes/depois. Nunca monta sozinha: só por gesto no
          convite acima, e aplicar exige confirmação dentro dela. */}
      {balanceOpen && (
        <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
          <BalanceWeekModal
            open={balanceOpen}
            onClose={() => setBalanceOpen(false)}
            language={language}
            atividades={atividadesDeDiasFixos}
            teto={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
            onAplicar={handleAplicarEquilibrio}
          />
        </Suspense>
      )}

      {editModalOpen && (
        <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
          <EditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingActivity(null);
            }}
            onSave={handleSaveActivity}
            onDelete={editingActivity ? () => handleDeleteActivity(editingActivity) : undefined}
            initialData={
              editingActivity
                ? gameState.activities.find(a => a.id === editingActivity)
                : undefined
            }
            canEditWeekdays={canSelectWeekdays(gameState.evolutionStage)}
            rhythm={editingActivity ? (gameState.habitRhythms?.[editingActivity] ?? EMPTY_RHYTHM) : undefined}
            hideMetrics={gameState.rest?.hideMetrics === true}
            language={language}
          />
        </Suspense>
      )}

      {taskEditModalOpen && (
        <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
          <TaskEditModal
            isOpen={taskEditModalOpen}
            onClose={() => {
              setTaskEditModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
            onDelete={editingTask ? () => {
              handleDeleteTask(editingTask);
              setTaskEditModalOpen(false);
              setEditingTask(null);
            } : undefined}
            initialData={
              editingTask
                ? gameState.tasks.find(t => t.id === editingTask)
                : undefined
            }
            title={editingTask ? t.main.editTask : t.main.newTask}
            language={language}
          />
        </Suspense>
      )}

      <CatalogBrowserModal
        isOpen={catalogBrowserOpen}
        onClose={() => setCatalogBrowserOpen(false)}
        language={language}
        onAdd={(item) => {
          commitHabitCreate(activitiesFromCatalogChoice([item], language === 'pt-BR'), TELEMETRY_CREATE_PATH.create_modal);
          setCatalogBrowserOpen(false);
        }}
        onCreateFromScratch={() => { setCatalogBrowserOpen(false); setCreateModalOpen(true); }}
      />

      {createModalOpen && (
        <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}><CreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          evolutionStage={gameState.evolutionStage}
          activitiesCount={gameState.activities.length}
          activitiesCap={activityCap}
          /* O convite de compra so faz sentido para quem PODE comprar, e so
             quando o teto que morde e o do modo gratis. Um pagante no teto do
             estagio dele nao esta encontrando uma fronteira de monetizacao. */
          capIsDemoBoundary={gameState.accountTier === 'demo'}
          onUnlock={() => { setCreateModalOpen(false); setUnlockReason('task-limit'); }}
          onSaveTask={(data) => {
            // Esforço, "quando" e idade vêm do modal e são gravados — sem eles
            // a tarefa nasce sem peso (meta do dia contaria item, não esforço)
            // e sem idade (nunca envelheceria, nunca assombraria).
            const newTask: Task = {
              id: `task-${Date.now()}`,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              completed: false,
              deadline: data.deadline,
              alarm: data.alarm,
              steps: data.steps,
              effort: data.effort,
              startDate: data.startDate,
              status: data.status ?? 'open',
              createdAt: data.createdAt ?? new Date().toISOString(),
              lastTouchedAt: data.lastTouchedAt ?? new Date().toISOString(),
            };
            commitTaskCreate(newTask, TELEMETRY_CREATE_PATH.create_modal, 'fim');
          }}
          onSaveActivity={(data) => {
            const newActivity: Activity = {
              id: `activity-${Date.now()}`,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              steps: data.steps,
              weekDays: data.weekDays,
              alarm: data.alarm,
              // Recorrência flexível + âncora ("depois do café da manhã"): o
              // modal já pergunta as duas coisas, e jogá-las fora aqui era o
              // buraco principal do motor de hábitos.
              schedule: data.schedule,
              anchor: data.anchor,
            };
            commitHabitCreate([newActivity], TELEMETRY_CREATE_PATH.create_modal);
          }}
          language={language}
        /></Suspense>
      )}

      <ConfirmDialog
        isOpen={resetOnboardingOpen}
        onClose={() => setResetOnboardingOpen(false)}
        onConfirm={handleConfirmResetOnboarding}
        /* O botão dizia "Recomeçar do zero", o diálogo falava em inglês de
           "egg choice" (estágio que não existe mais) e o código só limpa nome e
           linha de sprite — o save de jogo continua inteiro. Os três agora
           dizem a mesma coisa, e ela é verdade. */
        title={language === 'pt-BR' ? 'Refazer o ritual' : 'Redo the ritual'}
        message={language === 'pt-BR'
          ? 'Você vai responder o ritual de novo e escolher seu nome outra vez. Seu Soulmon, suas atividades, seus Bits e todo o progresso continuam como estão.'
          : 'You will go through the ritual again and pick your name once more. Your Soulmon, activities, Bits and all progress stay exactly as they are.'}
        confirmLabel={language === 'pt-BR' ? 'Refazer' : 'Redo'}
        cancelLabel={language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
      />

      <ContentModals
        guideModalOpen={guideModalOpen}
        onCloseGuide={() => setGuideModalOpen(false)}
        language={language}
      />

      <GamePopups
        showFirstTaskPopup={showFirstTaskPopup}
        onCloseFirstTaskPopup={() => setShowFirstTaskPopup(false)}
        language={language}
        spriteUrl={displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine)}
      />

      {evolutionCeremony && (
        <EvolutionCeremony
          fromStage={evolutionCeremony.from}
          toStage={evolutionCeremony.to}
          toName={getStageNameById(evolutionCeremony.to)}
          language={language}
          demoCharacterId={petLine}
          fromSpriteUrl={displaySprite(spriteAcervo, evolutionCeremony.from)?.url}
          toSpriteUrl={displaySprite(spriteAcervo, evolutionCeremony.to)?.url}
          reachedAt={gameState.formReachedAt?.[evolutionCeremony.to]}
          onEvolved={handleEvolve}
          onClose={() => setEvolutionCeremony(null)}
        />
      )}

      {/* O sheet das três saídas da tarefa adiada. Vive aqui em cima e não
          dentro da lista: a lista re-renderiza a cada conclusão, e um sheet
          montado lá dentro perderia o estado da decomposição no meio dela. */}
      <PostponeNudgeSheet
        task={nudgeTaskId ? (gameState.tasks.find(t => t.id === nudgeTaskId) ?? null) : null}
        language={language}
        onClose={handleCloseNudge}
        onShrink={handleShrinkTask}
        onDrop={handleDropTask}
        onDecompose={handleDecomposeTask}
      />

      {/* ⚠️ `evolutionCeremony === null` é o encadeamento, e ele faltava
          (auditoria de 06/09/2026): evoluir abria a CERIMÔNIA (z-500) e este
          modal montava por baixo (z-50), reaparecendo assim que ela fechava.
          O momento mais emocional do produto terminava num modal cobrando
          "crie mais atividades" — a cerimônia entrega identidade e o modal
          seguinte cobra requisito, na ordem emocionalmente invertida. O gate
          é reativo: quando a cerimônia fecha, o modal aparece se ainda fizer
          sentido. */}
      <EvolveTaskModal
        isOpen={evolveModalStage !== null && evolutionCeremony === null}
        onClose={() => setEvolveModalStage(null)}
        onCreateTask={() => { setEvolveModalStage(null); setCreateModalOpen(true); }}
        requiredTasks={FORM_REQUIREMENTS[getStageLevel(evolveModalStage ?? gameState.evolutionStage)].required}
        /* Cadastradas PARA HOJE (dia da semana + tarefas já concluídas hoje),
           via o dono da regra. Com `activities.length` cru, o modal de evolução
           contava atividades de seg–sex para quem estava olhando aquilo num
           sábado e dizia "você já tem tarefas suficientes" sobre um dia vazio. */
        registeredTasks={registeredForDay(gameState, new Date().getDay(), new Date().toDateString())}
        stageName={evolveModalStage ? getStageNameById(evolveModalStage) : ''}
        language={language}
      />

      {/* Notification Manager */}
      <NotificationManager
        activities={gameState.activities}
        tasks={gameState.tasks}
        userName={userName}
        petName={getCurrentStageName()}
        /* WP1.17 — a idade da criatura viaja com a inscrição de push, e morre
           com ela: cancelar o push apaga a idade junto. */
        bornAt={gameState.bornAt}
        /* WP3.11 — a janela da PESSOA é quem dá a hora do único push que esta
           mecânica manda. `sleepReminderAt` existia, com teste, e nunca tinha
           sido chamado por ninguém. */
        restWindow={gameState.rest?.window ?? null}
        isSleeping={isSleeping}
        /* #23 — a inscrição de push leva o `saveId` para que apagar a conta
           alcance o push no servidor; muda no login e o manager reenvia. */
        saveId={saveId}
        language={language}
        enabled={notificationsEnabled}
        healthPoints={gameState.healthPoints}
        maxHealthPoints={gameState.maxHealthPoints}
        completedSteps={dailyDone}
        /* A meta é min(cadastradas, requisito do estágio) — a MESMA de
           computeDailyReset, e por isso vem de `dailyGoalFor` em vez de uma
           cópia da fórmula. Passar o requisito puro fazia as notificações
           cobrarem quem já tinha cumprido a própria meta: um rookie com 2
           atividades tem meta 2, mas levava 3 cobranças por dia por "faltar"
           até 4. A correção da época consertou o TETO e deixou a FONTE: com
           `activities.length` cru, uma atividade de seg–sex ainda contava na
           meta de sábado, e a cobrança voltava exatamente no fim de semana. */
        /* Com o `dayKey`: `completedSteps` (dailyDone) JÁ conta as tarefas que
           saíram da lista ao serem concluídas; sem o dayKey aqui o denominador
           ignorava essas mesmas tarefas e as duas props do mesmo componente
           passavam a medir populações diferentes. */
        totalRequired={dailyGoalFor(gameState, new Date().getDay(), new Date().toDateString())}
      />
      {/* Ordem da fila em `interstitial` (perto do topo do componente). */}
      {interstitial === 'dailyReport' && gameState.lastDayReport && (
        <DailyReportModal
          report={gameState.lastDayReport}
          adventure={aventuraDaNoite}
          adventureIsNew={aventuraInedita}
          onClose={() => {
            /* WP4.8 — o marco é registrado ao FECHAR: se fosse ao abrir, um
               relatório reaberto no mesmo dia gastaria a memória sem ela ter
               sido vista. `markMemoryShown` é idempotente. */
            const hoje = playerDayKey(new Date(), gameState.playerDayTz);
            const marco = memoryToShow({
              daysWithPet: daysTogether(gameState.bornAt, hoje),
              shown: gameState.memoriesShown,
            });
            if (marco !== null) {
              setGameState(prev => ({
                ...prev,
                memoriesShown: markMemoryShown(prev.memoriesShown, marco),
              }));
            }
            handleCloseDailyReport();
          }}
          onRecoverHearts={handleRecoverHearts}
          moodToday={moodFor(gameState.moodLog, playerDayKey(new Date(), gameState.playerDayTz))}
          onPickMood={handlePickMood}
          moodNote={moodSummary(gameState.moodLog, language === 'pt-BR' ? 'pt-BR' : 'en-US')}
          language={language}
          soulGoal={gameState.soulGoal}
          /* WP5.1 — o convite no VALUE MOMENT (o primeiro dia perfeito). A
             regra de quando ele pode aparecer é de `utils/offerMoment.ts`;
             aqui só chega o resultado dela. */
          /* WP4.8 — as memórias de 30/90 dias. `memoryToShow` compara com
             IGUALDADE, não com `>=`: com `>=` o cartão apareceria todo dia
             depois do trigésimo, e a coisa que fazia dele um momento (ser
             raro) desapareceria na segunda vez. */
          memories={(() => {
            const hoje = playerDayKey(new Date(), gameState.playerDayTz);
            const marco = memoryToShow({
              daysWithPet: daysTogether(gameState.bornAt, hoje),
              shown: gameState.memoriesShown,
            });
            if (marco === null) return null;
            return {
              mark: marco,
              petName: soulmonDisplayName(gameState.soulmonMeta) || '—',
              spriteUrl: displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine),
              formNames: (gameState.unlockedEvolutions ?? []).map(id => {
                const st = (gameState.soulmonStages ?? []).find(
                  x => (x.branch ? `${x.stage}-${x.branch}` : x.stage) === id,
                );
                return st?.name ?? id;
              }),
              dreamCount: (gameState.rest?.dreams ?? []).length,
              soulGoal: gameState.soulGoal ?? null,
            };
          })()}
          showOffer={mostraOfertaNoRelatorio}
          /* A semana já foi carimbada ao MOSTRAR (13.11) — aqui só abre. */
          onOpenOffer={() => setUnlockReason('report')}
          /* R4 / D-H7 — a criatura na peça do retorno. */
          spriteUrl={displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine)}
          onDismissOffer={() => setGameState(prev => ({ ...prev, offerDismissed: true }))}
        />
      )}
      {/* CHECK-IN MATINAL — o ritual de ≤20s. Só um por dia e pulável sem
          culpa. Posição na fila: depois do relatório diário. */}
      {interstitial === 'checkIn' && checkInPlanData && (
        <MorningCheckIn
          open
          plan={checkInPlanData}
          /* WP2.5 — `soulStruggle` era escrito no onboarding e NUNCA lido em
             lugar nenhum do app. Ele volta aqui, no único momento em que
             reconhecer o que a pessoa contou não é enfeite: a segunda falta
             seguida, quando o pet oferece a versão de 5 minutos. */
          soulStruggle={gameState.soulStruggle}
          /* WP2.10 — aceitar a versão reduzida usa o MESMO caminho de conclusão
             de sempre. "Conta como feito" é literal: mesma constância, mesmos
             atributos, mesmo XP de Vínculo. Um caminho paralelo aqui seria uma
             segunda regra de conclusão (footgun 9) e um "meio-feito" que a
             tese do produto não tem. */
          onTinyHabit={handleToggleActivityCompletion}
          /* D-R5 — a etiqueta do hábito leva o `eco` de maturidade (o mesmo
             glifo da lista), então o check-in precisa do tier de cada um. */
          habitTiers={Object.fromEntries(checkInPlanData.habitsToday.map(h =>
            [h.id, habitTier(gameState.habitRhythms?.[h.id]?.totalDone ?? 0)]))}
          language={language}
          onConfirm={handleCheckInConfirm}
          onSkip={handleCheckInSkip}
        />
      )}

      {/* MARCO DO BOSQUE — a irmã da cerimônia de hábito: espera o gesto, z 300,
          movimento reduzido reduz o movimento e NUNCA a pausa. Posição na fila:
          depois de relatório e check-in, antes do sonho. Uma vez por estágio novo. */}
      {interstitial === 'groveMilestone' && grovePendente && grove?.pending && (
        <GroveMilestoneCeremony
          stage={grovePendente}
          spriteUrl={minhaCriaturaUrl}
          dateLabel={formatDayLabel(grove.pending.day, language)}
          sceneGranted={(grove.scenes ?? 0) >= grove.pending.index}
          language={language}
          onDone={acknowledgeGroveMilestone}
        />
      )}

      {/* ARRUMAR A PILHA — fila de cartas com quatro saídas grandes. Topo da
          fila de intersticiais: é a única aberta por toque do usuário. */}
      {interstitial === 'triage' && triageTasks && (
        <TriagePile
          open
          tasks={triageTasks}
          language={language}
          /* A reação do pet no fim: o MESMO sprite do visor. */
          petSprite={displaySprite(spriteAcervo, gameState.evolutionStage)?.url ?? getSpriteForStage(gameState.evolutionStage, petLine)}
          onResolve={handleTriageResolve}
          onClose={() => setTriageTasks(null)}
        />
      )}

      {/* G8 — o convite do sono (sono automático + janela), uma vez só. */}
      {interstitial === 'restSetup' && (
        <RestSetupModal
          language={language}
          now={new Date()}
          window={(gameState.rest ?? createRestState()).window}
          onChangeWindow={handleChangeRestWindow}
          onClose={closeRestSetup}
        />
      )}

      {/* O SONHO DA MANHÃ — recompensa, nunca veredito. Só de manhã. */}
      {interstitial === 'dream' && morningDream && (
        <MorningDream
          open
          dream={morningDream.dream}
          isNew={morningDream.isNew}
          language={language}
          onClose={() => setMorningDream(null)}
          /* F2 (dono, 01/10/2026): cena com gêmeo na decoração → o jogador
             já GANHOU a peça no updater do sonho, e o "Equipar" aparece
             sempre, equipando na hora (`utils/dreamDecorTwin.ts`). */
          {...(() => {
            const twin = dreamTwin(morningDream.dream?.id);
            return twin
              ? {
                decor: { namePt: twin.item.namePt, nameEn: twin.item.nameEn },
                onEquip: () => { handleEquipFurniture(twin.decorId, twin.slot); setMorningDream(null); },
              }
              : {};
          })()}
        />
      )}

      {/* O PESADELO DA MANHÃ — a face jogável da mesma noite do sonho. Entra
          DEPOIS dele (posição na fila), e nunca à noite. Perder não custa nada,
          e a tela diz isso. */}
      {interstitial === 'nightmare' && (
        <NightmareBattle
          open
          wave={nightmareWave}
          rarity={nightmareRarity}
          petStage={gameState.evolutionStage}
          demoCharacterId={petLine}
          language={language}
          onWin={handleNightmareWin}
          onLose={closeNightmare}
          onClose={closeNightmare}
        />
      )}

      {/* ÚLTIMO da fila: ele mesmo decide se tem algo a pedir (instalar a PWA /
          notificações) e devolve `null` quando não tem — por isso não dá para
          consultá-lo daqui e ele só é montado quando mais nada está aberto.
          Efeito colateral aceito: se um ritual estiver aberto na abertura do
          app, o `beforeinstallprompt` daquela sessão pode passar sem ouvinte e
          o convite de instalar volta na sessão seguinte. Perder um convite
          adiável é mais barato que dois diálogos empilhados com dois
          focus-traps. */}
      {interstitial === 'catalogOnboarding' && (
        <CatalogOnboardingFlow
          language={language}
          onComplete={(chosen) => setGameState(prev => {
            const withFlag = markCatalogOnboardingSeen(prev as any, new Date()) as any;
            return {
              ...withFlag,
              // ACRESCENTA, nunca substitui — nenhuma atividade existente é
              // tocada (decisão do dono, 28/09/2026).
              activities: [...(prev.activities ?? []), ...activitiesFromCatalogChoice(chosen, language === 'pt-BR')],
            };
          })}
        />
      )}
      {interstitial === 'catalogLevelInvite' && catalogLevelInviteCandidate && (
        <CatalogLevelInviteModal
          isOpen
          direction={catalogLevelInviteCandidate.suggestion === 'up' ? 'up' : 'down'}
          itemName={language === 'pt-BR' ? catalogLevelInviteCandidate.item.name.pt : catalogLevelInviteCandidate.item.name.en}
          language={language}
          onAccept={() => setGameState(prev => {
            const hoje = dayKeyOf(new Date());
            const nowIso = new Date().toISOString();
            const alvo = catalogLevelInviteCandidate.activity;
            const novoNivel = applyLevelChange((alvo as any).level ?? 1, catalogLevelInviteCandidate.suggestion === 'up' ? 'up' : 'down');
            return {
              ...prev,
              lastCatalogLevelInviteDayKey: hoje,
              activities: (prev.activities ?? []).map((a: any) => a.id === alvo.id
                ? { ...a, level: novoNivel, catalogLevelSetAt: nowIso, catalogLevelDeclinedAt: undefined }
                : a),
            } as any;
          })}
          onDecline={() => setGameState(prev => {
            const hoje = dayKeyOf(new Date());
            const nowIso = new Date().toISOString();
            const alvo = catalogLevelInviteCandidate.activity;
            const isDown = catalogLevelInviteCandidate.suggestion === 'down';
            return {
              ...prev,
              lastCatalogLevelInviteDayKey: hoje,
              // Recusar "subir" não inicia cooldown (nada de errado em oferecer
              // de novo assim que a constância seguir alta); recusar "descer"
              // inicia o cooldown de LEVEL_DOWN_COOLDOWN_DAYS — é o que impede
              // o convite de "você piorou" reaparecer todo dia.
              activities: isDown
                ? (prev.activities ?? []).map((a: any) => a.id === alvo.id ? { ...a, catalogLevelDeclinedAt: nowIso } : a)
                : prev.activities,
            } as any;
          })}
        />
      )}
      {interstitial === 'welcome' && (
        <WelcomePromptModal
          language={language}
          notificationsEnabled={notificationsEnabled}
          /* CONDIÇÃO DE ENTRADA do pedido de notificação — ver a fila de
             intersticiais lá em cima. `jaConcluiuAlgo` é o momento de valor:
             uma conclusão, qualquer uma, algum dia. */
          notificationsUnlocked={jaConcluiuAlgo}
          onEnableNotifications={handleToggleNotifications}
        />
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}