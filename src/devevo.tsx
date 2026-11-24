import { createRoot } from 'react-dom/client';
import "@fontsource/silkscreen/latin-400.css";
import "./index.css";
import { GameStateProvider } from './contexts/GameStateContext';
import { AreaView } from './components/nav/AreaView';
import { EvolutionPath } from './components/EvolutionPath';
document.documentElement.setAttribute('data-theme','dark'); document.documentElement.style.colorScheme='dark';
localStorage.setItem('soulmon_state_v1', JSON.stringify({ activities: [], tasks: [], totalXP: 100000 }));
const stage = (over: any) => ({ stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fangmon', description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over });
const NOMES: any = { champion: 'Champion', perfeito: 'Ultimate', mega: 'Mega' };
const ramos = [['poder', 'Pw'], ['harmonia', 'Hm'], ['benevolencia', 'Bn']];
const stages: any[] = [stage({}), ...ramos.flatMap(([b, n]) => ['champion', 'perfeito', 'mega'].map(st => stage({ stage: st, branch: b, name: `${n}-${st}`, stageName: { pt: NOMES[st], en: NOMES[st] } }))), stage({ stage: 'ultra', name: 'Zenite', stageName: { pt: 'Ultra', en: 'Ultra' } })];
const SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#2a8"/><circle cx="32" cy="32" r="18" fill="#fd0"/></svg>');
const lib: any = { sprites: { 'champion-harmony': { url: SVG, formId: 'champion-harmony', at: Date.now() } }, failures: {}, pendingTune: null, reverted: [], tunedUnseen: [] };
const sp = new URLSearchParams(location.search);
const lock = sp.get('lock') === '1';
const branch = sp.get('b') === 'power' ? 'power' : 'harmony';
const evo = (
  <EvolutionPath currentStageId={`champion-${branch}`} currentBranch={branch as any}
    powerPoints={3} harmonyPoints={30} benevolencePoints={1} evolutionPoints={12} todayGauge={4} gaugeGoal={30} stages={stages}
    spriteLibrary={lib} onRevertVisor={() => {}} onToggleEvolutionLock={() => {}} evolutionLocked={lock}
    unlockedEvolutions={['rookie', 'champion-harmony', 'champion-power', 'ultimate-harmony']} language="pt-BR" />
);
const props: any = {
  area: 'laboratorio', language: 'pt-BR',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: evo, potionContent: <p>pocao</p>, hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  initialSheet: sp.get('v') === 'centro' ? 'evolucao' : undefined, onInitialSheetConsumed: () => {},
};
createRoot(document.getElementById('root')!).render(<GameStateProvider><AreaView {...props} /></GameStateProvider>);
