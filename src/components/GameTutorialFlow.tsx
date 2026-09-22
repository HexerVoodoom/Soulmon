import { useMemo, useState, type CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { Viewport } from './ui/Viewport';
import { Chip, sm2Button, sm2Hint, sm2Label, sm2Text, sm2TitleStyle } from './form/FormKit';
import type { Language } from '../utils/i18n';
import type { ActivityCategory } from '../types/attributes';
import { orderCategoriesForGoal } from '../utils/goalToCategory';
import { CATEGORY_ICONS, categoryLabel } from '../types/category-icons';
import { demoTintFilter } from '../utils/sprites';
import { suggestTasksResult, type SuggestedTask } from '../utils/taskSuggestions';

// ---------------------------------------------------------------------------
// GameTutorialFlow — segundo onboarding: depois que o Soulmon nasce (ritual
// do oráculo), antes de entrar no jogo de verdade. São DUAS telas, e nenhuma
// a mais: (1) a promessa central, (2) a criação OBRIGATÓRIA da 1ª atividade —
// o jogador digita seu objetivo + escolhe tags de área da vida, e um pool de
// tarefas sugeridas por IA (mesma API do chat do pet —
// functions/api/suggest-tasks.js) aparece pra ele escolher o que adicionar.
// Precisa sair daqui com >=1 tarefa, pra home nunca nascer vazia.
//
// Por que só duas: o dia 1 tinha ~12 telas antes de o usuário tocar em nada
// (splash + 4 do onboarding demo + 6 páginas de conceito aqui + criação +
// WelcomePromptModal), contra ~6 do benchmark do gênero (Finch). As 5 páginas
// de conceito que saíram (HP, comida/energia, dia perfeito, cocô/banho/sono,
// loja/moedas) cobravam teoria antes de qualquer contato — e 4 delas já
// estavam ditas, melhor e com os NÚMEROS vindos das constantes, no
// `GuideModal` (seções 1, 2 e 6) e no glossário do `HelpModal`. Ver
// `docs/PLANO-PRODUTO.md`, Parte 0 ("Correção da correção").
//
// IDENTIDADE (canvas `docs/design/wireframes/onboarding-funil/identidade/`,
// DECISÕES §23, 20/09/2026 — `TutorialConceito`, `TutorialTarefa`,
// `TutorialSugestoes`, `TutorialErro`): o tutorial é o APARELHO — tudo aqui é
// vetor sobre os tokens `--sm2-*`, e o único pixel é a criatura que acabou de
// nascer, dentro de um vidro 192² com anel (D-O13; era o glifo `pets` 48).
//  · pontinhos 8px (`primary-fill` / anel 2px `muted`) com `role=progressbar`;
//  · o campo do objetivo JÁ PREENCHIDO com o `soulGoal` (O3 — era um campo
//    vazio fazendo a mesma pergunta três telas depois);
//  · chips e sugestões em VETOR (`FormKit.Chip`, cards SIS-03 com
//    `check_circle`/`radio_button_unchecked` como estado — D-O14; os
//    `PixelChoiceChip`/`.sm-px-*`/`.sm-card`/`.sm-btn` eram pixel fora do visor);
//  · a sugestão além do teto é INERTE POR FORMA (tracejado 1px `muted` +
//    tinta `muted` + `aria-disabled`), nunca `opacity: .5` (D-O15);
//  · o teto do estágio anunciado em `role=status` (muda sob o dedo — D-A4),
//    em `gold-ink` sem moldura;
//  · "Suggest tasks with AI" VIVO com o objetivo no campo (X1): só desliga
//    com o campo vazio E nenhuma área;
//  · o aviso de que o objetivo vai para a IA (O6), 12 `muted`.
// O QUE NÃO MUDOU: o fluxo, o teto (`maxActivities`), o fallback local e o
// próprio objetivo como 1ª linha selecionável (`customKey` — achado para o
// lead, mantido no código).
// ---------------------------------------------------------------------------

interface TutorialPage {
  titlePt: string; titleEn: string;
  bodyPt: string; bodyEn: string;
}

/**
 * A única tela de conceito que sobrou: a promessa central, e nada que não seja
 * acionável no minuto zero. HP, energia, cocô e loja não existem ainda para
 * quem acabou de chegar — nenhum desses botões faz sentido antes da primeira
 * atividade existir.
 */
const PAGES: TutorialPage[] = [
  {
    titlePt: 'Seu Soulmon nasceu!', titleEn: 'Your Soulmon is born!',
    bodyPt: 'Seu Soulmon cresce com você — cada tarefa que você cumpre na vida real ajuda na evolução. Vamos começar pela primeira.',
    bodyEn: "It grows with you — every task you complete in real life helps it evolve. Let's start with the first one.",
  },
];

/**
 * O ÚNICO assunto das 5 páginas removidas que o `GuideModal` ainda não cobre:
 * Bits, Créditos, loja e minijogos não aparecem em nenhuma seção do guia nem
 * no glossário do `HelpModal` (conferido, não presumido). Os outros quatro
 * assuntos foram descartados por duplicidade real — corações (Guia §2 e §6),
 * comida/energia (§2), dia perfeito/evolução (§1) e cocô/banho/sono (§2 e §6)
 * já estão lá, com os números lidos das constantes em vez de escritos à mão.
 *
 * Fica exportado, e não inline no guia, porque este arquivo é o único dono
 * deste texto agora: quem for mexer no `GuideModal` consome daqui e apaga esta
 * constante no mesmo PR.
 */
export const SHOP_AND_CURRENCY_PRIMER = {
  titlePt: 'Loja, minijogos & créditos', titleEn: 'Shop, minigames & credits',
  bodyPt: 'Jogue os minijogos na aba Atividades pra ganhar Bits e gastar na loja (itens, cenários, mobílias). Créditos são uma moeda especial pra ajudas extras.',
  bodyEn: 'Play the minigames in the Activities tab to earn Bits and spend them in the shop (items, backdrops, furniture). Credits are a special currency for extra help.',
} as const;

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

/** O giro do carregando, com `prefers-reduced-motion` (mesmo padrão do onboarding). */
const SPIN_CSS = `
@keyframes tutspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){[data-sm-spin]{animation:none !important}}
`;

interface GameTutorialFlowProps {
  language: Language;
  /** Teto de atividades do estágio atual (types/progression.ts FORM_REQUIREMENTS) — a
   *  criação obrigatória da 1ª tarefa não pode ultrapassar o mesmo limite do CreateModal normal. */
  maxActivities: number;
  /** Atividades que o jogador já tem (normalmente 0 aqui — só por segurança). */
  existingActivitiesCount?: number;
  onComplete: (activities: Array<{ name: string; category: ActivityCategory; emoji: string }>) => void;
  /** WP1.4 — o que a pessoa escreveu no onboarding. Usado SÓ no aparelho, por
   *  palavra-chave (`utils/goalToCategory.ts`), para pôr a área de vida que
   *  ela descreveu na frente da lista — e, desde o canvas (O3), como o valor
   *  inicial do campo do objetivo. O texto não sai daqui (decisão D8). */
  soulGoal?: string;
  soulStruggle?: string;
  /** A criatura que acabou de nascer, no vidro 192² (D-O13). Sprite 256² a 128. */
  spriteUrl?: string;
  /** Nome da criatura, para o `aria-label` do vidro. */
  petName?: string;
  /** Tonalidade do demo (`demoTintFilter`); ausente no caminho do oráculo. */
  demoTint?: number;
}

export function GameTutorialFlow({
  language, maxActivities, existingActivitiesCount = 0, onComplete, soulGoal, soulStruggle,
  spriteUrl, petName, demoTint,
}: GameTutorialFlowProps) {
  const isPt = language === 'pt-BR';
  const TASK_STEP = PAGES.length;
  const [step, setStep] = useState(0);

  // O3: o objetivo escrito no onboarding chega já no campo (editável). Quem
  // pulou o Objetivo vê o placeholder.
  const [goalText, setGoalText] = useState((soulGoal ?? '').trim());
  const [areaFoco, setAreaFoco] = useState(false);
  const [selectedCats, setSelectedCats] = useState<Set<ActivityCategory>>(new Set());
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  /** E1 (QA rodada 2): "não veio nada" ≠ "sem rede/quebrou". */
  const [falhaIa, setFalhaIa] = useState<'offline' | 'error' | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleCat = (cat: ActivityCategory) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  /* WP1.4 — a área que a pessoa DESCREVEU vem primeiro.
     `soulGoal`/`soulStruggle` eram escritos no onboarding e nunca lidos por
     ninguém: quem escrevia "quero dormir melhor" recebia, na tela seguinte,
     as oito áreas em ordem fixa — e aprendia ali que o que escreveu não
     importa. O casamento é por palavra-chave, no aparelho; o texto não vai
     para a rede (decisão D8). REORDENA, nunca esconde: um palpite por
     palavra-chave não pode virar decisão tomada no lugar da pessoa. */
  const categoriasOrdenadas = useMemo(
    () => orderCategoriesForGoal(CATEGORIES, soulGoal, soulStruggle),
    [soulGoal, soulStruggle],
  );

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
    const r = await suggestTasksResult(goalText.trim(), [...selectedCats], language);
    const result = r.ok ? r.items : [];
    setFalhaIa(r.ok ? null : r.reason);
    // A IA devolve vazio em QUALQUER falha (rede, provedor fora, resposta
    // inválida). Sem um fallback local, quem digitasse só categorias ficava
    // numa tela sem nada selecionável — e o passo é obrigatório, então não
    // havia como entrar no app. Isso quebrava o princípio de o jogo continuar
    // íntegro com o backend morto. O MOTIVO (`falhaIa`) é mostrado à parte.
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

  /**
   * Pontinhos de progresso (S4): 8px, aceso = `primary-fill`, apagado = anel
   * 2px `muted`. O denominador inclui a criação da 1ª atividade
   * (`TASK_STEP + 1`), e não só as páginas de conceito — a barra do
   * `SoulmonOnboarding` já foi corrigida uma vez pelo mesmo motivo: barra que
   * enche antes do fim do fluxo mente sobre quanto falta.
   */
  const dots = (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TASK_STEP + 1}
      aria-valuenow={step + 1}
      aria-label={isPt ? `Passo ${step + 1} de ${TASK_STEP + 1}` : `Step ${step + 1} of ${TASK_STEP + 1}`}
      style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}
    >
      {Array.from({ length: TASK_STEP + 1 }, (_, i) => (
        <span key={i} data-dot={i <= step ? 'on' : 'off'} style={{
          width: 8, height: 8, borderRadius: '50%', boxSizing: 'border-box',
          border: `2px solid ${i <= step ? 'var(--sm2-primary-fill)' : 'var(--sm2-muted)'}`,
          background: i <= step ? 'var(--sm2-primary-fill)' : 'transparent',
        }} />
      ))}
    </div>
  );

  const heroLabel = petName
    ? (demoTint !== undefined
      ? (isPt ? `${petName}, na tonalidade ${demoTint + 1}` : `${petName}, in tint ${demoTint + 1}`)
      : (isPt ? `${petName}, seu Soulmon` : `${petName}, your Soulmon`))
    : (isPt ? 'Seu Soulmon' : 'Your Soulmon');

  /** Card de sugestão SIS-03 (44): estado pelo glifo, seleção por `primary-soft` + anel. */
  const sugestao = (key: string, texto: string, isSel: boolean, ariaLabel?: string) => {
    const inerte = !isSel && atCap;
    return (
      <button
        key={key}
        type="button"
        onClick={() => { if (!inerte) toggleSelected(key, isSel); }}
        aria-pressed={isSel}
        aria-disabled={inerte || undefined}
        aria-label={ariaLabel}
        data-suggestion={inerte ? 'inert' : isSel ? 'on' : 'off'}
        style={{
          width: '100%', boxSizing: 'border-box', minHeight: 44, textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: isSel ? '7px 11px' : '8px 12px',
          borderRadius: 'var(--sm2-radius-md)',
          cursor: inerte ? 'not-allowed' : 'pointer',
          /* Inerte por FORMA (D-O15): tracejado 1px `muted` + tinta `muted`,
             fundo transparente — nunca `opacity`. */
          border: inerte
            ? '1px dashed var(--sm2-muted)'
            : isSel ? '2px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-line)',
          backgroundColor: inerte ? 'transparent' : isSel ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface)',
          color: inerte ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-sm)',
          lineHeight: 'var(--sm2-leading-body)',
        }}
      >
        {isSel
          ? <Icon name="check_circle" size={24} fill={1} tone="primary" />
          : <Icon name="radio_button_unchecked" size={24} tone="muted" />}
        <span style={{ flex: 1, minWidth: 0 }}>{texto}</span>
      </button>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: 'var(--sm2-bg)',
      color: 'var(--sm2-ink)',
      fontFamily: 'var(--sm2-font-text)',
    }}>
      <style>{SPIN_CSS}</style>
      <div style={{ width: '100%', maxWidth: 440, padding: '24px 16px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
        {step < TASK_STEP ? (
          <>
            {dots}
            {/* A promessa: a criatura que acabou de nascer, no vidro (D-O13),
                título Fredoka 20, texto Rubik 14, um primário no pé. */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
              <Viewport width={96} height={96} scale={2} label={heroLabel} screenStyle={{ position: 'relative' }}>
                {spriteUrl && (
                  <img
                    src={spriteUrl}
                    alt=""
                    data-hero
                    width={128}
                    height={128}
                    style={{ position: 'absolute', left: 32, top: 32, width: 128, height: 128, imageRendering: 'pixelated', filter: demoTintFilter(demoTint) }}
                  />
                )}
              </Viewport>
              <h2 className="sm2-title" style={sm2TitleStyle}>
                {isPt ? PAGES[step].titlePt : PAGES[step].titleEn}
              </h2>
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt ? PAGES[step].bodyPt : PAGES[step].bodyEn}
              </p>
            </div>

            {/* Uma tela, uma saída. */}
            <div style={{ paddingBottom: 12 }}>
              <button
                type="button"
                style={{ ...sm2Button('primary'), width: '100%' }}
                onClick={() => setStep(TASK_STEP)}
              >
                {isPt ? 'Começar' : "Let's start"}
              </button>
            </div>
          </>
        ) : (
          <>
            {dots}
            {/* Passo obrigatório: criar a 1ª tarefa */}
            <button
              type="button"
              onClick={() => setStep(TASK_STEP - 1)}
              style={{ ...sm2Button('quiet', false, 'sm'), alignSelf: 'flex-start', padding: '0 8px' }}
            >
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
            <h2 className="sm2-title" style={sm2TitleStyle}>
              {isPt ? 'Qual é o seu objetivo?' : "What's your goal?"}
            </h2>

            <textarea
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onFocus={() => setAreaFoco(true)}
              onBlur={() => setAreaFoco(false)}
              aria-label={isPt ? 'Qual é o seu objetivo?' : "What's your goal?"}
              placeholder={isPt ? 'Ex.: Quero ficar mais em forma e menos ansioso' : 'E.g.: I want to get fitter and less anxious'}
              rows={3}
              maxLength={300}
              className="sm2-form-field"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 96, padding: 12, resize: 'none', outline: 'none',
                borderRadius: 'var(--sm2-radius-md)',
                border: `1px solid ${areaFoco ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
                boxShadow: areaFoco ? '0 0 0 2px var(--sm2-primary-ink)' : 'none',
                backgroundColor: 'var(--sm2-surface-2)',
                fontFamily: 'var(--sm2-font-text)',
                fontSize: 'var(--sm2-text-sm)',
                lineHeight: 'var(--sm2-leading-body)',
                color: 'var(--sm2-ink)',
              }}
            />

            <div>
              <span style={sm2Label} id="tut-areas-label">{isPt ? 'Áreas da vida (opcional)' : 'Life areas (optional)'}</span>
              <div role="group" aria-labelledby="tut-areas-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categoriasOrdenadas.map(cat => (
                  <Chip
                    key={cat}
                    selected={selectedCats.has(cat)}
                    onToggle={() => toggleCat(cat)}
                    style={{ padding: '0 12px', fontSize: 'var(--sm2-text-xs)' }}
                  >
                    {categoryLabel(cat, isPt)}
                  </Chip>
                ))}
              </div>
            </div>

            {/* VIVO com o objetivo no campo (X1): só desliga com o campo vazio E
                nenhuma área. Depois de responder vira `outline` (já respondeu). */}
            <button
              type="button"
              style={{ ...sm2Button(searched && !loading ? 'outline' : 'primary', loading || (!goalText.trim() && selectedCats.size === 0)), width: '100%' }}
              onClick={handleGenerate}
              disabled={loading || (!goalText.trim() && selectedCats.size === 0)}
              aria-busy={loading}
              aria-label={isPt ? 'Sugerir tarefas com IA' : 'Suggest tasks with AI'}
            >
              {loading
                ? <span data-sm-spin="" aria-hidden="true" style={{ display: 'inline-flex', animation: 'tutspin 1.1s linear infinite' }}><Icon name="sync" size={24} /></span>
                : (isPt ? 'Sugerir tarefas com IA' : 'Suggest tasks with AI')}
            </button>
            {/* O aviso da IA (O6 + compliance #2, 21/09/2026): o campo nasce
                pré-preenchido com o `soulGoal` do onboarding — que a política
                diz não passar por IA — então o aviso tem que dizer que ESTE
                texto sai do aparelho, e só se a pessoa pedir sugestões.
                Provisório "declarar" até o dono decidir declarar × cortar. */}
            {/* A10 (QA rodada 2): o aviso sumia depois da 1ª busca, mas o
                botão continua vivo e o texto continua saindo a cada toque.
                Fica enquanto o botão puder ser tocado. */}
            {(goalText.trim() || selectedCats.size > 0) && !loading && (
              <p style={{ ...sm2Hint, textAlign: 'center' }} data-ai-hint>
                {isPt ? 'Este texto vai para o provedor de IA se você pedir sugestões.' : 'This text goes to the AI provider if you ask for suggestions.'}
              </p>
            )}

            {searched && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goalText.trim() && sugestao(customKey, goalText.trim(), selected.has(customKey))}
                {/* E1: falha com nome. As sugestões locais vêm mesmo assim. */}
                {falhaIa && (
                  <p role="status" style={{ ...sm2Hint, textAlign: 'center', margin: '8px 0' }} data-ai-failure={falhaIa}>
                    {falhaIa === 'offline'
                      ? (isPt ? 'Sem conexão agora — estas são sugestões locais. Com rede, toque de novo para pedir à IA.' : 'No connection right now — these are local suggestions. Once online, tap again to ask the AI.')
                      : (isPt ? 'A IA não respondeu agora — estas são sugestões locais. Pode tentar de novo.' : 'The AI did not answer right now — these are local suggestions. You can try again.')}
                  </p>
                )}
                {suggestions.length === 0 ? (
                  <p style={{ ...sm2Hint, textAlign: 'center', margin: '8px 0' }}>
                    {isPt
                      ? 'Não veio sugestão da IA agora — sem problema, use seu objetivo acima ou digite de novo.'
                      : 'No AI suggestions came back — no worries, use your goal above or try again.'}
                  </p>
                ) : suggestions.map(s => sugestao(s.name, s.name, selected.has(s.name), `${s.name} · ${categoryLabel(s.category, isPt)}`))}
                {/* O teto muda sob o dedo: `role=status` (D-A4), `gold-ink` sem moldura. */}
                <p role="status" aria-live="polite" style={{ ...sm2Hint, textAlign: 'center', color: 'var(--sm2-gold-ink)', minHeight: atCap ? undefined : 0 }}>
                  {atCap
                    ? (isPt
                      ? `Limite de ${remaining} atividades do estágio atingido — desmarque algo pra trocar.`
                      : `Stage limit of ${remaining} activities reached — unselect something to swap.`)
                    : ''}
                </p>
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button
              type="button"
              style={{ ...sm2Button('primary', !canFinish), width: '100%' }}
              disabled={!canFinish}
              onClick={handleFinish}
            >
              {canFinish
                ? (isPt ? `Adicionar ${effectiveCount} e começar` : `Add ${effectiveCount} and start`)
                : (isPt ? 'Selecione pelo menos 1 tarefa' : 'Select at least 1 task')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
