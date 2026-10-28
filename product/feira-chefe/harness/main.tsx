import '../../../src/index.css';
import { createRoot } from 'react-dom/client';
import { FeiraEventoSheet } from '../../../src/components/guild/FeiraEventoSheet';
import type { FeiraEvento, FeiraTrail } from '../../../src/utils/feira';

const q = new URLSearchParams(location.search);
const lang = q.get('lang') === 'pt' ? 'pt-BR' : 'en-US';
const sc = q.get('s') ?? 'boss';
const boss: FeiraEvento = { k: 0, kind: 'boss', level: 3, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 62, canAttack: true };
const trail: FeiraEvento = { k: 2, kind: 'trail', level: 3, trail: { pending: true, cleared: false, marks: 4 }, gate: 'locked' };
const rest: FeiraEvento = { k: 1, kind: 'rest', level: 4, claimable: true, claimK: 0 };
const ev = sc === 'trail' || sc === 'zip' ? trail : sc === 'rest' ? rest : boss;
const zip: FeiraTrail = { k: 2, game: 'zip', seed: 1, puzzle: { size: 4, numbers: [0, 5, 12] } };
const api = {
  attack: async () => ({ dmg: 128, seconds: 30, log: [{ k: 'a', t: 2, s: 0, f: 0.05 }, { k: 'a', t: 5, s: 1, f: 0.1 }, { k: 'c', t: 8, s: 0, f: 0 }, { k: 'a', t: 8, s: 0, f: 0.08 }], boss: { bossId: 'arauto-do-fim', level: 3, bossHpPct: 49, dead: false }, evento: { ...boss, bossHpPct: 49, canAttack: false } }),
  claim: async () => ({ k: 0, level: 4, bossId: 'arauto-do-fim', receipt: 'r', reward: { emblems: 4, bits: 70, sap: 40, trophyId: null, element: 'fogo' } }),
  start: async () => zip,
  sleep: async () => {},
};
createRoot(document.getElementById('root')!).render(
  <FeiraEventoSheet language={lang} saveId="harness" evento={ev} me={{ sprite: '', name: 'Igni', element: 'neutro' }} onClose={() => {}} onCredit={() => {}} api={api as never} />,
);
