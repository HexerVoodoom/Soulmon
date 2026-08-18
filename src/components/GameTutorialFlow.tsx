import { useState, type CSSProperties } from 'react';
import {
  Heart, Utensils, Zap, Sparkles, ShowerHead, ShoppingBag,
  LoaderCircle, Check, Wand2,
} from 'lucide-react';
import { PixelChoiceChip } from './pixel/PixelKit';
import type { Language } from '../utils/i18n';
import type { ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, CATEGORY_ICON_IMG, categoryLabel } from '../types/category-icons';
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
    bodyPt: 'Nos dias em que não der, ele fica meio pra baixo — no máximo um coração, nunca mais que isso. Esfregue nele com carinho, ou marque depois o que você fez: os corações voltam. Se você sumir por uns dias, voltar não custa nada.',
    bodyEn: "On the days you can't, it gets a little low — at most one heart, never more. Rub it gently, or log later what you did: the hearts come back. And if you disappear for a few days, coming back costs nothing.",
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
    bodyPt: 'De vez em quando aparece um cocôzinho — dê um banho quando aparecer — ele fica bem melhor limpinho. Dormir pausa tudo isso até você acordá-lo.',
    bodyEn: "Every so often a little poop shows up — give it a bath when it does, it feels much better clean. Sleep pauses all of that until you wake it up.",
  },
  {
    Icon: ShoppingBag,
    titlePt: 'Loja, minijogos & créditos', titleEn: 'Shop, minigames & credits',
    bodyPt: 'Jogue os minijogos na aba Atividades pra ganhar Bits e gastar na loja (itens, cenários, mobílias). Créditos são uma moeda especial pra ajudas extras.',
    bodyEn: 'Play the minigames in the Activities tab to earn Bits and spend them in the shop (items, backdrops, furniture). Credits are a special currency for extra help.',
  },
];

const CATEGORIES: ActivityCategory[] = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];

/**
 * Tarefas locais para quando a IA não responde. Todas são versões de dois
 * minutos de propósito: o gargalo do modelo de Fogg é Habilidade, não
 * Motivação, e a primeira tarefa da vida do usuário é onde isso mais importa.
 */
const FALLBACK_BY_CATEGORY: Record<ActivityCategory, { pt: string; en: string }> = {
  Health:     { pt: 'Beber um copo de água', en: 'Drink a glass of water' },
  Creativity: { pt: 'Rabiscar por 2 minutos', en: 'Doodle for 2 minutes' },
  Discipline: { pt: 'Arrumar a cama', en: 'Make the bed' },
  Study:      { pt: 'Ler 1 página', en: 'Read 1 page' },
  Work:       { pt: 'Escrever a primeira linha', en: 'Write the first line' },
  Social:     { pt: 'Mandar uma mensagem pra alguém', en: 'Text someone' },
  Wellness:   { pt: 'Respirar fundo 3 vezes', en: 'Take 3 deep breaths' },
  Fitness:    { pt: 'Alongar por 2 minutos', en: 'Stretch for 2 minutes' },
};

function fallbackTasks(cats: ActivityCategory[], isPt: boolean): SuggestedTask[] {
  const usadas = cats.length > 0 ? cats : (['Health', 'Study', 'Wellness'] as ActivityCategory[]);
  return usadas.slice(0, 4).map(category => ({
    name: isPt ? FALLBACK_BY_CATEGORY[category].pt : FALLBACK_BY_CATEGORY[category].en,
    category,
    emoji: CATEGORY_ICONS[category] ?? '✨',
  }));
}

interface GameTutorialFlowProps {
  language: Language;
  /** Teto de atividades do estágio atual (types/progression.ts FORM_REQUIREMENTS) — a
   *  criação obrigatória da 1ª tarefa não pode ultrapassar o mesmo limite do CreateModal normal. */
  maxActivities: number;
  /** Atividades que o jogador já tem (normalmente 0 aqui — só por segurança). */
  existingActivitiesCount?: number;
  onComplete: (activities: Array<{ name: string; category: ActivityCategory; emoji: string }>) => void;
}

export function GameTutorialFlow({ language, maxActivities, existingActivitiesCount = 0, onComplete }: GameTutorialFlowProps) {
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

  // Contagem "de verdade" — só o que existe agora na tela (evita contar
  // seleções antigas de uma geração anterior que já não aparecem mais).
  const effectiveCount = (selected.has(customKey) && goalText.trim() ? 1 : 0)
    + suggestions.filter(s => selected.has(s.name)).length;
  const remaining = Math.max(0, maxActivities - existingActivitiesCount);
  const atCap = effectiveCount >= remaining;

  const toggleSelected = (key: string, alreadyCounted: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (!alreadyCounted && atCap) return prev; // teto do estágio atingido
        next.add(key);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSearched(true);
    const result = await suggestTasks(goalText.trim(), [...selectedCats], language);
    // A IA devolve [] em QUALQUER falha (rede, provedor fora, resposta
    // inválida). Sem um fallback local, quem digitasse só categorias ficava
    // numa tela sem nada selecionável — e o passo é obrigatório, então não
    // havia como entrar no app. Isso quebrava o princípio de o jogo continuar
    // íntegro com o backend morto.
    setSuggestions(result.length > 0 ? result : fallbackTasks([...selectedCats], isPt));
    setLoading(false);
    // Reseta seleção a cada nova geração — evita "vazamento" de seleções de
    // uma rodada anterior que não existem mais nesta lista.
    setSelected(goalText.trim() ? new Set([customKey]) : new Set());
  };

  const canFinish = effectiveCount > 0;

  const handleFinish = () => {
    const activities: Array<{ name: string; category: ActivityCategory; emoji: string }> = [];
    if (selected.has(customKey) && goalText.trim()) {
      activities.push({ name: goalText.trim().slice(0, 60), category: customCategory, emoji: CATEGORY_ICONS[customCategory] });
    }
    suggestions.forEach(s => {
      if (selected.has(s.name)) activities.push({ name: s.name, category: s.category, emoji: s.emoji });
    });
    onComplete(activities.slice(0, remaining));
  };

  const triangleGlyph = (dir: 'left' | 'right', color = 'var(--sm-primary)') => (
    <span style={{
      display: 'inline-block', width: 0, height: 0,
      borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
      ...(dir === 'right' ? { borderLeft: `10px solid ${color}` } : { borderRight: `10px solid ${color}` }),
    }} />
  );

  const triangle = (dir: 'left' | 'right', onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? (isPt ? 'Voltar' : 'Back') : (isPt ? 'Avançar' : 'Next')}
      /* 44x44 de area de toque com o quadrado de 34px dentro (WCAG 2.2 AA 2.5.8):
         avancar/voltar e a unica navegacao do tutorial. */
      style={{
        width: 44, height: 44, padding: 5, border: 'none', background: 'none',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1, flexShrink: 0,
      }}
    >
      <span aria-hidden="true" style={{
        width: 34, height: 34, borderRadius: 10,
        background: disabled ? 'var(--sm-bg)' : 'var(--sm-primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {triangleGlyph(dir)}
      </span>
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
                /* `flex: 1` faz o cartão ocupar a altura toda; sem
                   `justifyContent` o conteúdo grudava no topo e sobravam ~700px
                   de vazio embaixo (visto no screenshot da rodada 3 — a
                   PRIMEIRA tela que o jogador novo vê). Centralizar resolve sem
                   mudar a moldura. */
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                padding: '36px 24px', marginTop: 40, marginBottom: 4,
                border: '3px solid var(--sm-gold)',
                boxShadow: '0 0 0 4px var(--sm-gold-soft), 0 8px 24px rgba(6, 24, 26,.12)',
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
              /* Medido na rodada 3: saía 71×19 — bem abaixo dos 44 do WCAG
                 2.2 AA (2.5.8). É a saída de quem não quer o tutorial; um
                 alvo desse tamanho prende a pessoa na tela. O sublinhado
                 continua no texto, o alvo é a caixa inteira. */
              style={{ background: 'none', border: 'none', color: 'var(--sm-muted)', fontSize: 12.5, minHeight: 44, padding: '0 16px', margin: '10px auto 0', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isPt ? 'Pular tutorial' : 'Skip tutorial'}
            </button>
          </>
        ) : (
          <>
            {/* Passo obrigatório: criar a 1ª tarefa */}
            <button
              onClick={() => setStep(TASK_STEP - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--sm-muted)', fontSize: 12, margin: '0 0 10px', cursor: 'pointer', padding: 0 }}
            >
              {triangleGlyph('left', 'var(--sm-muted)')}
              {isPt ? 'Rever tutorial' : 'Review tutorial'}
            </button>
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
              className="sm-px-field"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
            />

            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sm-muted)', margin: '14px 0 8px' }}>
              {isPt ? 'Áreas da vida (opcional)' : 'Life areas (optional)'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map(cat => {
                const active = selectedCats.has(cat);
                return (
                  <PixelChoiceChip
                    key={cat}
                    selected={active}
                    onToggle={() => toggleCat(cat)}
                    icon={CATEGORY_ICON_IMG[cat]}
                  >
                    {categoryLabel(cat, isPt)}
                  </PixelChoiceChip>
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
                {goalText.trim() && (() => {
                  const isSel = selected.has(customKey);
                  const disabled = !isSel && atCap;
                  return (
                    <button
                      onClick={() => toggleSelected(customKey, isSel)}
                      aria-pressed={isSel}
                      disabled={disabled}
                      className="sm-card"
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                        borderColor: isSel ? 'var(--sm-primary)' : undefined,
                        backgroundColor: isSel ? 'var(--sm-primary-soft)' : undefined,
                        ...(isSel ? { ['--sm-cham-line' as string]: 'var(--sm-primary)' } : null),
                      } as CSSProperties}
                    >
                      <span style={{ fontSize: '1.3rem', width: 36, height: 36, backgroundColor: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {CATEGORY_ICONS[customCategory]}
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--sm-ink)' }}>{goalText.trim()}</span>
                      {isSel && <Check size={18} strokeWidth={3} color="var(--sm-primary)" />}
                    </button>
                  );
                })()}
                {suggestions.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', textAlign: 'center', margin: '8px 0' }}>
                    {isPt
                      ? 'Não veio sugestão da IA agora — sem problema, use seu objetivo acima ou digite de novo.'
                      : 'No AI suggestions came back — no worries, use your goal above or try again.'}
                  </p>
                ) : suggestions.map(s => {
                  const isSel = selected.has(s.name);
                  const disabled = !isSel && atCap;
                  return (
                    <button
                      key={s.name}
                      onClick={() => toggleSelected(s.name, isSel)}
                      aria-pressed={isSel}
                      disabled={disabled}
                      className="sm-card"
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                        borderColor: isSel ? 'var(--sm-primary)' : undefined,
                        backgroundColor: isSel ? 'var(--sm-primary-soft)' : undefined,
                        ...(isSel ? { ['--sm-cham-line' as string]: 'var(--sm-primary)' } : null),
                      } as CSSProperties}
                    >
                      <span style={{ fontSize: '1.3rem', width: 36, height: 36, backgroundColor: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {s.emoji}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--sm-ink)' }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--sm-muted)' }}>{categoryLabel(s.category, isPt)}</span>
                      </span>
                      {isSel && <Check size={18} strokeWidth={3} color="var(--sm-primary)" />}
                    </button>
                  );
                })}
                {atCap && (
                  <p style={{ fontSize: 11.5, color: 'var(--sm-gold)', textAlign: 'center', margin: '2px 0 0', fontWeight: 600 }}>
                    {isPt
                      ? `Limite de ${remaining} atividades do estágio atingido — desmarque algo pra trocar.`
                      : `Stage limit of ${remaining} activities reached — unselect something to swap.`}
                  </p>
                )}
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
                ? (isPt ? `Adicionar ${effectiveCount} e começar` : `Add ${effectiveCount} and start`)
                : (isPt ? 'Selecione pelo menos 1 tarefa' : 'Select at least 1 task')}
            </button>
          </>
        )}
        <style>{`@keyframes tutspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
