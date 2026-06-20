import { useState, useEffect } from 'react';
import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import imgContainer from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import { EggSelection, EggType } from './EggSelection';
import { ActivityCategory } from '../types/attributes';

interface InitialActivity {
  name: string;
  category: ActivityCategory;
  emoji: string;
}

interface OnboardingScreenProps {
  onComplete: (data: {
    userName: string;
    eggType: EggType;
    initialActivities: InitialActivity[];
  }) => void;
}

const ispt = navigator.language.startsWith('pt');

const INTRO_TEXTS = ispt ? [
  'Bem-vindo ao DigiApp! Em breve você vai conhecer seu parceiro digital que vai te ajudar a alcançar seus objetivos.',
  'Conforme você completa tarefas e atividades, ele cresce com você. Suas escolhas impactam diretamente seu parceiro.',
  'Seu destino e o destino do seu parceiro estão nas suas mãos!',
] : [
  'Welcome to DigiApp! Soon you will meet your digital partner who will help you achieve your goals.',
  'As you complete tasks and activities, they will grow with you. Your choices directly impact your partner.',
  'Your destiny and your partner\'s destiny are in your hands!',
];

const EGG_FILTERS: Record<string, string> = {
  veemon: 'hue-rotate(200deg) saturate(1.5)',
  salamon: 'hue-rotate(300deg) saturate(1.3) brightness(1.1)',
};

const EGG_GLOW: Record<string, string> = {
  agumon: 'rgba(255,255,255,0.35)',
  veemon: 'rgba(74,144,226,0.45)',
  salamon: 'rgba(255,182,193,0.45)',
};

// ── Challenge chips ──────────────────────────────────────────────────────────
interface Challenge { id: string; emoji: string; label: string }
const CHALLENGES: Challenge[] = [
  { id: 'sleep',        emoji: '💤', label: ispt ? 'Sono'         : 'Sleep' },
  { id: 'exercise',     emoji: '🏃', label: ispt ? 'Exercício'    : 'Exercise' },
  { id: 'study',        emoji: '📚', label: ispt ? 'Estudo'       : 'Study' },
  { id: 'work',         emoji: '💼', label: ispt ? 'Trabalho'     : 'Work' },
  { id: 'diet',         emoji: '🥗', label: ispt ? 'Alimentação'  : 'Diet' },
  { id: 'stress',       emoji: '😤', label: ispt ? 'Estresse'     : 'Stress' },
  { id: 'focus',        emoji: '🎯', label: ispt ? 'Foco'         : 'Focus' },
  { id: 'organization', emoji: '📋', label: ispt ? 'Organização'  : 'Organization' },
  { id: 'social',       emoji: '👥', label: ispt ? 'Social'       : 'Social' },
  { id: 'finances',     emoji: '💰', label: ispt ? 'Finanças'     : 'Finances' },
];

// ── Suggested activities pool ────────────────────────────────────────────────
interface Suggestion { name: string; emoji: string; category: ActivityCategory }
const POOL: Record<string, Suggestion[]> = {
  sleep: [
    { name: ispt ? 'Horário de dormir fixo'       : 'Consistent sleep time',    emoji: '🛏️', category: 'Wellness' },
    { name: ispt ? 'Sem tela 1h antes de dormir'  : 'No screens 1h before bed', emoji: '📵', category: 'Wellness' },
    { name: ispt ? 'Rotina matinal'               : 'Morning routine',          emoji: '🌅', category: 'Wellness' },
  ],
  exercise: [
    { name: ispt ? '30min de treino'    : '30min workout',     emoji: '🏋️', category: 'Fitness' },
    { name: ispt ? 'Caminhada 20min'    : 'Daily walk 20min',  emoji: '🚶', category: 'Fitness' },
    { name: ispt ? 'Alongamento 10min'  : 'Stretch 10min',     emoji: '🧘', category: 'Fitness' },
  ],
  study: [
    { name: ispt ? 'Estudar 1h'            : 'Study 1h',       emoji: '📖', category: 'Study' },
    { name: ispt ? 'Ler 20min'             : 'Read 20min',     emoji: '📚', category: 'Study' },
    { name: ispt ? 'Revisar anotações'     : 'Review notes',   emoji: '✏️', category: 'Study' },
  ],
  work: [
    { name: ispt ? 'Trabalho focado 90min' : 'Deep work 90min', emoji: '💻', category: 'Work' },
    { name: ispt ? 'Planejar amanhã'       : 'Plan next day',   emoji: '📅', category: 'Work' },
    { name: ispt ? 'Limpar inbox'          : 'Clear inbox',     emoji: '📬', category: 'Work' },
  ],
  diet: [
    { name: ispt ? 'Beber 2L de água'        : 'Drink 2L water',         emoji: '💧', category: 'Health' },
    { name: ispt ? 'Refeição saudável'        : 'Healthy meal',           emoji: '🥗', category: 'Health' },
    { name: ispt ? 'Sem ultraprocessado'      : 'No ultra-processed food',emoji: '🚫', category: 'Health' },
  ],
  stress: [
    { name: ispt ? 'Meditar 10min'  : 'Meditate 10min', emoji: '🧘', category: 'Wellness' },
    { name: ispt ? 'Diário 10min'   : 'Journal 10min',  emoji: '📓', category: 'Wellness' },
    { name: ispt ? '1h sem celular' : '1h phone-free',  emoji: '📵', category: 'Wellness' },
  ],
  focus: [
    { name: ispt ? 'Pomodoro 25min'      : 'Pomodoro 25min',       emoji: '🍅', category: 'Discipline' },
    { name: ispt ? 'Bloco de foco único' : 'Single-task block',    emoji: '🎯', category: 'Discipline' },
    { name: ispt ? 'Sem redes sociais'   : 'No social media today',emoji: '🔕', category: 'Discipline' },
  ],
  organization: [
    { name: ispt ? 'Limpar mesa'       : 'Clear desk',       emoji: '🗂️', category: 'Discipline' },
    { name: ispt ? 'Revisão semanal'   : 'Weekly review',    emoji: '📊', category: 'Discipline' },
    { name: ispt ? 'Lista de compras'  : 'Grocery list',     emoji: '📝', category: 'Discipline' },
  ],
  social: [
    { name: ispt ? 'Ligar para um amigo'               : 'Call a friend',            emoji: '📞', category: 'Social' },
    { name: ispt ? 'Tempo de qualidade com família'    : 'Quality time with family', emoji: '👨‍👩‍👧', category: 'Social' },
  ],
  finances: [
    { name: ispt ? 'Registrar gastos do dia'    : 'Track daily expenses',    emoji: '💳', category: 'Discipline' },
    { name: ispt ? 'Revisar orçamento mensal'   : 'Review monthly budget',   emoji: '💰', category: 'Discipline' },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'name' | 'egg' | 'intro' | 'goals'>('name');
  const [introIndex, setIntroIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedEgg, setSelectedEgg] = useState<EggType | null>(null);
  const [previewedEgg, setPreviewedEgg] = useState<EggType | null>(null);
  const [squashFrame, setSquashFrame] = useState(0);

  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  const [randomName] = useState(`obs-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    const interval = setInterval(() => setSquashFrame(prev => (prev + 1) % 60), 50);
    return () => clearInterval(interval);
  }, []);

  const getSquashScale = () => squashFrame === 0 ? 0.9 : 1.0;

  const handleNameSubmit = () => { if (userName.trim()) setStep('egg'); };
  const handleEggConfirm = (egg: EggType) => { setSelectedEgg(egg); setStep('intro'); };
  const handleIntroNext = () => {
    if (introIndex < INTRO_TEXTS.length - 1) setIntroIndex(introIndex + 1);
    else setStep('goals');
  };

  const toggleChallenge = (id: string) => {
    setSelectedChallenges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Remove activities belonging only to this challenge
        const otherChallenges = [...next];
        const stillAvailable = new Set(otherChallenges.flatMap(c => POOL[c]?.map(a => a.name) ?? []));
        setSelectedActivities(prevActs => {
          const filtered = new Set<string>();
          prevActs.forEach(n => { if (stillAvailable.has(n)) filtered.add(n); });
          return filtered;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleActivity = (name: string) => {
    setSelectedActivities(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Build deduplicated pool from selected challenges
  const poolItems: Suggestion[] = [];
  const seen = new Set<string>();
  selectedChallenges.forEach(id => {
    (POOL[id] ?? []).forEach(s => {
      if (!seen.has(s.name)) { seen.add(s.name); poolItems.push(s); }
    });
  });

  const handleConfirmGoals = () => {
    const activities: InitialActivity[] = poolItems
      .filter(s => selectedActivities.has(s.name))
      .map(s => ({ name: s.name, category: s.category, emoji: s.emoji }));

    // Require at least one selection
    if (activities.length === 0) return;

    onComplete({ userName, eggType: selectedEgg as EggType, initialActivities: activities });
  };

  const displayEgg = previewedEgg ?? selectedEgg;
  const eggFilter = displayEgg ? (EGG_FILTERS[displayEgg] ?? 'none') : 'none';
  const eggGlow = displayEgg ? EGG_GLOW[displayEgg] : undefined;

  // ── Shared button style ───────────────────────────────────────────────────
  const primaryBtn = (disabled = false) =>
    `bg-[#00ff99] rounded-xl px-10 py-3 transition-all hover:brightness-110 active:scale-95 ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`;
  const btnStyle = { fontFamily: 'Consolas, monospace', fontSize: '0.875rem', fontWeight: '700', color: '#000', letterSpacing: '0.05em' };

  return (
    <div className="relative w-full min-h-screen bg-[#0a2f1a] flex flex-col">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <img alt="" className="w-full h-full object-cover" src={imgUiTBg01} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-8 max-w-md mx-auto w-full gap-6">

        {/* ── Top Content Area ───────────────────────────────────────────── */}
        <div className="w-full flex-1 flex items-center justify-center pt-8">

          {/* Step: name */}
          {step === 'name' && (
            <div className="w-full space-y-4 max-w-[280px]">
              <div className="bg-[#0d1420] relative rounded-xl w-full">
                <input
                  type="text"
                  autoComplete="new-password"
                  data-form-type="other"
                  spellCheck="false"
                  autoCapitalize="off"
                  name={randomName}
                  id={randomName}
                  readOnly={isInputReadOnly}
                  onFocus={() => setIsInputReadOnly(false)}
                  onBlur={() => setIsInputReadOnly(true)}
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleNameSubmit()}
                  maxLength={30}
                  placeholder={ispt ? 'seu nome' : 'enter your name'}
                  className="w-full px-6 py-3 bg-transparent text-white text-center border-0 outline-none placeholder-[#4a5568] rounded-[inherit]"
                  style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', letterSpacing: '0.02em' }}
                  autoFocus
                />
                <div aria-hidden="true" className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" />
              </div>
              <div className="w-full flex justify-center">
                <button onClick={handleNameSubmit} disabled={!userName.trim()} className={primaryBtn(!userName.trim())} style={btnStyle}>
                  {ispt ? 'continuar' : 'continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step: egg */}
          {step === 'egg' && (
            <div className="w-full max-w-[320px]">
              <div className="bg-[#0d1420] relative rounded-xl w-full">
                <EggSelection onSelect={handleEggConfirm} onPreview={setPreviewedEgg} />
                <div aria-hidden="true" className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" />
              </div>
            </div>
          )}

          {/* Step: intro */}
          {step === 'intro' && (
            <div className="w-full space-y-4 max-w-[320px]">
              <div className="bg-[#0d1420] relative rounded-xl w-full">
                <div className="px-6 py-8 min-h-[200px] flex items-center justify-center">
                  <p className="text-[#d0d0d0] text-center" style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', lineHeight: '1.6', letterSpacing: '0.01em' }}>
                    {INTRO_TEXTS[introIndex]}
                  </p>
                </div>
                <div aria-hidden="true" className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" />
              </div>
              <div className="w-full flex justify-center">
                <button onClick={handleIntroNext} className={primaryBtn()} style={btnStyle}>
                  {ispt ? 'continuar' : 'continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step: goals (challenge + activity suggestions) */}
          {step === 'goals' && (
            <div className="w-full max-w-[340px] space-y-4">
              <div className="bg-[#0a1628] relative rounded-xl w-full border border-[#1e3a5a]">
                <div className="px-5 py-5">
                  {/* Challenge chips */}
                  <p className="text-[#00ff99] text-xs mb-3 font-bold" style={{ fontFamily: 'Consolas, monospace', letterSpacing: '0.05em' }}>
                    {ispt ? 'o que te desafia?' : 'what challenges you?'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {CHALLENGES.map(c => {
                      const active = selectedChallenges.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleChallenge(c.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
                            active
                              ? 'bg-[#00ff99] text-[#061510] border-[#00ff99] shadow-[0_0_8px_rgba(0,255,153,0.5)]'
                              : 'bg-[#162840] text-[#e0f0ff] border-[#3a6090] hover:border-[#00ff99] hover:bg-[#1e3a58]'
                          }`}
                          style={{ fontFamily: 'Consolas, monospace' }}
                        >
                          {c.emoji} {c.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Activity pool */}
                  {poolItems.length > 0 && (
                    <>
                      <p className="text-[#00ff99] text-xs mb-3 font-bold" style={{ fontFamily: 'Consolas, monospace', letterSpacing: '0.05em' }}>
                        {ispt ? 'selecione suas atividades:' : 'pick your activities:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {poolItems.map(s => {
                          const active = selectedActivities.has(s.name);
                          return (
                            <button
                              key={s.name}
                              onClick={() => toggleActivity(s.name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                                active
                                  ? 'bg-[#00ff99] text-[#061510] border-[#00ff99] shadow-[0_0_8px_rgba(0,255,153,0.5)]'
                                  : 'bg-[#162840] text-[#e0f0ff] border-[#3a6090] hover:border-[#00ff99] hover:bg-[#1e3a58]'
                              }`}
                              style={{ fontFamily: 'Consolas, monospace' }}
                            >
                              {s.emoji} {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {selectedChallenges.size === 0 && (
                    <p className="text-[#6090c0] text-xs text-center py-4" style={{ fontFamily: 'Consolas, monospace' }}>
                      {ispt ? '↑ selecione ao menos um desafio' : '↑ select at least one challenge'}
                    </p>
                  )}
                </div>
                <div aria-hidden="true" className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" />
              </div>

              <div className="w-full flex justify-center">
                <button
                  onClick={handleConfirmGoals}
                  disabled={selectedActivities.size === 0}
                  className={primaryBtn(selectedActivities.size === 0)}
                  style={btnStyle}
                >
                  {ispt ? 'começar →' : 'start →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Egg Preview ────────────────────────────────────────────────── */}
        <div className="relative w-full max-w-[200px] mx-auto flex-shrink-0 pb-4">
          <div className="bg-[#6a7282] rounded-[28px] p-3 shadow-lg">
            <div className="relative w-full aspect-square overflow-hidden rounded-xl">
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-xl">
                <img alt="" className="absolute max-w-none object-cover rounded-xl size-full" src={imgContainer} />
                <div className="absolute bg-gradient-to-b from-[#cdded4] inset-0 rounded-xl to-[#cfcfcf]" />
              </div>
              <div aria-hidden="true" className="absolute border-[#1f2a39] border-[3px] border-solid inset-0 pointer-events-none rounded-xl" />
              {eggGlow && (
                <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: `radial-gradient(circle at center, ${eggGlow} 0%, transparent 70%)` }} />
              )}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img
                  alt="DigiEgg"
                  className="object-contain pointer-events-none transition-all duration-300"
                  src={digiEggSprite}
                  style={{ imageRendering: 'pixelated', width: '110px', height: '110px', transform: `scaleY(${getSquashScale()})`, transformOrigin: 'center', filter: eggFilter }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
