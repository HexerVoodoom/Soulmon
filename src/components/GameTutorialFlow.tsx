import { useState } from 'react';
import {
  Heart, Utensils, Zap, Sparkles, ShowerHead, ShoppingBag,
  LoaderCircle, Check, Wand2,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import type { ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, categoryLabel } from '../types/category-icons';
import { suggestTasks, type SuggestedTask } from '../utils/taskSuggestions';

// ---------------------------------------------------------------------------
// GameTutorialFlow — segundo onboarding: depois que o Soulmon nasce (ritual
// do oráculo), antes de entrar no jogo de verdade, um tutorial estilo RPG
// (páginas com setinha triangular pra avançar/voltar) ensina o básico, e
// termina numa tela OBRIGATÓRIA de criação da 1ª tarefa: o jogador digita
// seu objetivo + escolhe tags de área da vida, e um pool de tarefas sugeridas
// por IA (mesma API do chat do pet — functions/api/suggest-tasks.js) aparece
// pra ele escolher o que adicionar. Precisa sair daqui com >=1 tarefa.
// ---------------------------------------------------------------------------

interface TutorialPage {
  Icon: typeof Heart;
  titlePt: string; titleEn: string;
  bodyPt: string; bodyEn: string;
}

const PAGES: TutorialPage[] = [
  {
    Icon: Sparkles,
    titlePt: 'Seu Soulmon nasceu!', titleEn: 'Your Soulmon is born!',
    bodyPt: 'Ele cresce com você — cada tarefa que você cumpre na vida real o ajuda a evoluir. Vamos aprender o básico antes de começar.',
    bodyEn: "It grows with you — every task you complete in real life helps it evolve. Let's learn the basics before you start.",
  },
  {
    Icon: Heart,
    titlePt: 'Corações (HP)', titleEn: 'Hearts (HP)',
    bodyPt: 'Se você não cumprir suas tarefas do dia, seu Soulmon perde corações na virada da noite. Esfregue nele com carinho ou dê um Coraçãozinho pra curar.',
    bodyEn: "If you don't finish your tasks for the day, your Soulmon loses hearts overnight. Rub it gently or give it a Little Heart to heal.",
  },
  {
    Icon: Utensils,
    titlePt: 'Comida & Energia', titleEn: 'Food & Energy',
    bodyPt: 'Cumprir tarefas dá comida — alimentá-lo enche a barra de energia e dá pontos de atributo. A energia cheia no fim do dia é essencial pro dia perfeito.',
    bodyEn: "Finishing tasks earns food — feeding it fills the energy bar and gives attribute points. Full energy at day's end is key to a perfect day.",
  },
  {
    Icon: Zap,
    titlePt: 'Dia perfeito & Evolução', titleEn: 'Perfect day & Evolution',
    bodyPt: 'Cumpra suas tarefas cadastradas + energia cheia = dia perfeito, que soma pontos de evolução. Junte o suficiente e seu Soulmon evolui!',
    bodyEn: 'Finish your registered tasks + full energy = a perfect day, which earns evolution points. Gather enough and your Soulmon evolves!',
  },
  {
    Icon: ShowerHead,
    titlePt: 'Cocô, banho & sono', titleEn: 'Poop, bath & sleep',
    bodyPt: 'De vez em quando aparece um cocôzinho — limpe no banho ou os corações começam a drenar. Dormir pausa tudo isso até você acordá-lo.',
    bodyEn: "Every so often a little poop shows up — clean it in the bath or hearts start draining. Sleep pauses all of that until you wake it up.",
  },
  {
    Icon: ShoppingBag,
    titlePt: 'Loja, minijogos & créditos', titleEn: 'Shop, minigames & credits',
    bodyPt: 'Jogue os minijogos na aba Atividades pra ganhar Bits e gastar na loja (itens, cenários, mobílias). Créditos são uma moeda especial pra ajudas extras.',
    bodyEn: 'Play the minigames in the Activities tab to earn Bits and spend them in the shop (items, backdrops, furniture). Credits are a special currency for extra help.',
  },
];

const CATEGORIES: ActivityCategory[] = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];

interface GameTutorialFlowProps {
  language: Language;
  onComplete: (activities: Array<{ name: string; category: ActivityCategory; emoji: string }>) => void;
}

export function GameTutorialFlow({ language, onComplete }: GameTutorialFlowProps) {
  const isPt = language === 'pt-BR';
  const TASK_STEP = PAGES.length;
  const [step, setStep] = useState(0);

  const [goalText, setGoalText] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<ActivityCategory>>(new Set());
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleCat = (cat: ActivityCategory) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const customCategory = selectedCats.size > 0 ? [...selectedCats][0] : 'Wellness';
  const customKey = 'custom:' + goalText.trim();

  const toggleSelected = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSearched(true);
    const result = await suggestTasks(goalText.trim(), [...selectedCats], language);
    setSuggestions(result);
    setLoading(false);
    // Auto-seleciona o objetivo digitado (se houver) pra facilitar sair com >=1.
    if (goalText.trim()) setSelected(prev => new Set(prev).add(customKey));
  };

  const canFinish = selected.size > 0;

  const handleFinish = () => {
    const activities: Array<{ name: string; category: ActivityCategory; emoji: string }> = [];
    if (selected.has(customKey) && goalText.trim()) {
      activities.push({ name: goalText.trim().slice(0, 60), category: customCategory, emoji: CATEGORY_ICONS[customCategory] });
    }
    suggestions.forEach(s => {
      if (selected.has(s.name)) activities.push({ name: s.name, category: s.category, emoji: s.emoji });
    });
    onComplete(activities);
  };

  const triangle = (dir: 'left' | 'right', onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? (isPt ? 'Voltar' : 'Back') : (isPt ? 'Avançar' : 'Next')}
      style={{
        width: 34, height: 34, borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: disabled ? 'var(--sm-bg)' : 'var(--sm-primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        display: 'inline-block', width: 0, height: 0,
        borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
        ...(dir === 'right'
          ? { borderLeft: '10px solid var(--sm-primary)' }
          : { borderRight: '10px solid var(--sm-primary)' }),
      }} />
    </button>
  );

  return (
    <div className="sm-app-bg" style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: 'var(--sm-ink)',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '24px 20px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {step < TASK_STEP ? (
          <>
            {/* Página do tutorial — moldura estilo RPG (borda dourada dupla) */}
            <div
              className="sm-card"
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                padding: '36px 24px', marginTop: 40,
                border: '3px solid var(--sm-gold)',
                boxShadow: '0 0 0 4px var(--sm-gold-soft), 0 8px 24px rgba(42,36,64,.12)',
              }}
            >
              <div style={{
                width: 84, height: 84, borderRadius: 24, marginBottom: 22,
                background: 'var(--sm-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(() => { const Icon = PAGES[step].Icon; return <Icon size={42} color="var(--sm-primary)" strokeWidth={1.8} />; })()}
              </div>
              <h1 style={{ fontSize: 22, margin: '0 0 12px', fontWeight: 800 }}>
                {isPt ? PAGES[step].titlePt : PAGES[step].titleEn}
              </h1>
              <p style={{ fontSize: 14.5, color: 'var(--sm-muted)', lineHeight: 1.7, margin: 0 }}>
                {isPt ? PAGES[step].bodyPt : PAGES[step].bodyEn}
              </p>
            </div>

            {/* Navegação: setinhas triangulares + pontos de progresso */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 20 }}>
              {triangle('left', () => setStep(s => Math.max(0, s - 1)), step === 0)}
              <div style={{ display: 'flex', gap: 6 }}>
                {PAGES.map((_, i) => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i === step ? 'var(--sm-primary)' : 'var(--sm-line)',
                  }} />
                ))}
              </div>
              {triangle('right', () => setStep(s => Math.min(TASK_STEP, s + 1)), false)}
            </div>

            <button
              onClick={() => setStep(TASK_STEP)}
              style={{ background: 'none', border: 'none', color: 'var(--sm-muted)', fontSize: 12.5, margin: '18px auto 0', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isPt ? 'Pular tutorial' : 'Skip tutorial'}
            </button>
          </>
        ) : (
          <>
            {/* Passo obrigatório: criar a 1ª tarefa */}
            <h1 style={{ fontSize: 21, margin: '8px 0 4px', fontWeight: 800 }}>
              {isPt ? 'Qual é o seu objetivo?' : "What's your goal?"}
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {isPt
                ? 'Conte pra gente o que você quer alcançar — vamos sugerir tarefas pra ajudar. Você precisa adicionar pelo menos 1 pra continuar.'
                : "Tell us what you want to achieve — we'll suggest tasks to help. You need to add at least 1 to continue."}
            </p>

            <textarea
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              placeholder={isPt ? 'Ex.: Quero ficar mais em forma e menos ansioso' : 'E.g.: I want to get fitter and less anxious'}
              rows={3}
              maxLength={300}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'none',
                background: '#fff', color: 'var(--sm-ink)', border: '2px solid var(--sm-line)',
                borderRadius: 14, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              }}
            />

            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sm-muted)', margin: '14px 0 8px' }}>
              {isPt ? 'Áreas da vida (opcional)' : 'Life areas (optional)'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map(cat => {
                const active = selectedCats.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
                      border: active ? '2px solid var(--sm-primary)' : '2px solid var(--sm-line)',
                      background: active ? 'var(--sm-primary-soft)' : '#fff',
                      color: active ? 'var(--sm-primary)' : 'var(--sm-ink)',
                      fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>
                    {categoryLabel(cat, isPt)}
                  </button>
                );
              })}
            </div>

            <button
              className="sm-btn"
              style={{ width: '100%' }}
              onClick={handleGenerate}
              disabled={loading || (!goalText.trim() && selectedCats.size === 0)}
            >
              {loading
                ? <LoaderCircle size={18} strokeWidth={2.4} style={{ animation: 'tutspin 1.1s linear infinite' }} />
                : <><Wand2 size={16} strokeWidth={2.2} /> {isPt ? 'Sugerir tarefas com IA' : 'Suggest tasks with AI'}</>}
            </button>

            {searched && !loading && (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goalText.trim() && (
                  <button
                    onClick={() => toggleSelected(customKey)}
                    className="sm-card"
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer',
                      borderColor: selected.has(customKey) ? 'var(--sm-primary)' : undefined,
                      background: selected.has(customKey) ? 'var(--sm-primary-soft)' : undefined,
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', width: 36, height: 36, borderRadius: 10, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {CATEGORY_ICONS[customCategory]}
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--sm-ink)' }}>{goalText.trim()}</span>
                    {selected.has(customKey) && <Check size={18} strokeWidth={3} color="var(--sm-primary)" />}
                  </button>
                )}
                {suggestions.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', textAlign: 'center', margin: '8px 0' }}>
                    {isPt
                      ? 'Não veio sugestão da IA agora — sem problema, use seu objetivo acima ou digite de novo.'
                      : 'No AI suggestions came back — no worries, use your goal above or try again.'}
                  </p>
                ) : suggestions.map(s => (
                  <button
                    key={s.name}
                    onClick={() => toggleSelected(s.name)}
                    className="sm-card"
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer',
                      borderColor: selected.has(s.name) ? 'var(--sm-primary)' : undefined,
                      background: selected.has(s.name) ? 'var(--sm-primary-soft)' : undefined,
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', width: 36, height: 36, borderRadius: 10, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.emoji}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--sm-ink)' }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--sm-muted)' }}>{categoryLabel(s.category, isPt)}</span>
                    </span>
                    {selected.has(s.name) && <Check size={18} strokeWidth={3} color="var(--sm-primary)" />}
                  </button>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button
              className="sm-btn"
              style={{ width: '100%', marginTop: 20 }}
              disabled={!canFinish}
              onClick={handleFinish}
            >
              {canFinish
                ? (isPt ? `Adicionar ${selected.size} e começar` : `Add ${selected.size} and start`)
                : (isPt ? 'Selecione pelo menos 1 tarefa' : 'Select at least 1 task')}
            </button>
          </>
        )}
        <style>{`@keyframes tutspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
