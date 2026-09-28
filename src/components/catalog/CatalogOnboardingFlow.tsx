import { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { RitualDialog, ritualTitle } from '../ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text, Chip } from '../form/FormKit';
import { recommendStarterSet } from '../../utils/recommend';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';
import {
  LIFE_AREA_LABEL, LIFE_AREAS,
  STRUGGLE_LABEL, type StruggleId,
  STRENGTH_LABEL, type StrengthId,
  type LifeArea, type CatalogItem,
} from '../../types/activityCatalog';

/**
 * F3 do `docs/PLANO-CATALOGO-ATIVIDADES.md` — o convite do catálogo, tanto
 * para quem cria o pet agora quanto para quem já joga (mesmo intersticial —
 * ver `src/utils/catalogOnboarding.ts`). Curto e pulável em qualquer passo:
 * 4 telas no máximo (áreas → dificuldades → forças → starter set), cada
 * escolha com no máximo 3 itens.
 *
 * Nenhuma atividade existente é tocada: `onComplete` só ACRESCENTA as
 * escolhidas, nunca substitui `activities`.
 */
const STRUGGLES: StruggleId[] = ['comecar', 'constancia', 'esquecer', 'energia', 'ansiedade', 'distracao', 'tempo', 'perfeccionismo'];
const STRENGTHS: StrengthId[] = ['disciplina', 'curiosidade', 'criatividade', 'sociabilidade', 'organizacao', 'energiaFisica', 'calma', 'persistencia'];

interface CatalogOnboardingFlowProps {
  language?: 'pt-BR' | 'en-US';
  onSkip: () => void;
  onComplete: (chosen: CatalogItem[]) => void;
}

type Step = 'areas' | 'struggles' | 'strengths' | 'starter';

function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function toggle<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function CatalogOnboardingFlow({ language = 'en-US', onSkip, onComplete }: CatalogOnboardingFlowProps) {
  const isPt = language === 'pt-BR';
  const [step, setStep] = useState<Step>('areas');
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [struggles, setStruggles] = useState<StruggleId[]>([]);
  const [strengths, setStrengths] = useState<StrengthId[]>([]);
  const [swapped, setSwapped] = useState<Set<string>>(new Set());

  const starterSet = useMemo(
    () => recommendStarterSet({ areas, struggles, strengths }, ACTIVITY_CATALOG),
    [areas, struggles, strengths],
  );
  const finalSet = starterSet.filter((i) => !swapped.has(i.id));

  const titles: Record<Step, string> = {
    areas: isPt ? 'O que você quer melhorar?' : 'What do you want to improve?',
    struggles: isPt ? 'O que mais te trava?' : "What's holding you back most?",
    strengths: isPt ? 'O que já é forte em você?' : "What's already a strength?",
    starter: isPt ? 'Seu ponto de partida' : 'Your starting point',
  };
  const subtitles: Record<Step, string> = {
    areas: isPt ? 'Escolha até 3.' : 'Pick up to 3.',
    struggles: isPt ? 'Escolha até 3 (ou nenhuma).' : 'Pick up to 3 (or none).',
    strengths: isPt ? 'Escolha até 3 (ou nenhuma).' : 'Pick up to 3 (or none).',
    starter: isPt ? 'Sugestões no seu ritmo — troque o que quiser.' : 'Suggestions at your pace — swap anything.',
  };

  const next = () => {
    if (step === 'areas') setStep('struggles');
    else if (step === 'struggles') setStep('strengths');
    else if (step === 'strengths') setStep('starter');
  };
  const back = () => {
    if (step === 'struggles') setStep('areas');
    else if (step === 'strengths') setStep('struggles');
    else if (step === 'starter') setStep('strengths');
  };

  return (
    <RitualDialog label={titles[step]} onClose={onSkip} zIndex={200} maxWidth={380}>
      <h2 style={ritualTitle}>{titles[step]}</h2>
      <p style={sm2Hint}>{subtitles[step]}</p>

      {step === 'areas' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LIFE_AREAS.map((a) => (
            <Chip key={a} selected={areas.includes(a)} onToggle={() => setAreas((v) => toggle(v, a, 3))}>
              {isPt ? LIFE_AREA_LABEL[a].pt : LIFE_AREA_LABEL[a].en}
            </Chip>
          ))}
        </div>
      )}

      {step === 'struggles' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STRUGGLES.map((s) => (
            <Chip key={s} selected={struggles.includes(s)} onToggle={() => setStruggles((v) => toggle(v, s, 3))}>
              {isPt ? STRUGGLE_LABEL[s].pt : STRUGGLE_LABEL[s].en}
            </Chip>
          ))}
        </div>
      )}

      {step === 'strengths' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STRENGTHS.map((s) => (
            <Chip key={s} selected={strengths.includes(s)} onToggle={() => setStrengths((v) => toggle(v, s, 3))}>
              {isPt ? STRENGTH_LABEL[s].pt : STRENGTH_LABEL[s].en}
            </Chip>
          ))}
        </div>
      )}

      {step === 'starter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {starterSet.map((item) => {
            const isSwapped = swapped.has(item.id);
            return (
              <div key={item.id} className="sm2-conta-card" style={{ padding: 10, opacity: isSwapped ? 0.5 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...sm2Text, fontWeight: 600 }}>
                    {item.emoji} {isPt ? item.name.pt : item.name.en}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSwapped((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                      return next;
                    })}
                    style={sm2Button('outline', false, 'sm')}
                  >
                    {isSwapped ? (isPt ? 'Manter' : 'Keep') : (isPt ? 'Trocar' : 'Swap')}
                  </button>
                </div>
                <p style={{ ...sm2Hint, margin: '4px 0 0' }}>{isPt ? item.why.pt : item.why.en}</p>
              </div>
            );
          })}
          {starterSet.length === 0 && (
            <p style={sm2Text}>{isPt ? 'Sem sugestões — você pode ir direto ao catálogo depois.' : 'No suggestions — you can browse the catalog later.'}</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {step !== 'starter' && (
          <button type="button" onClick={next} style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Continuar' : 'Continue'}
          </button>
        )}
        {step === 'starter' && (
          <button
            type="button"
            onClick={() => onComplete(finalSet)}
            style={{ ...sm2Button('primary'), width: '100%' }}
          >
            {isPt ? 'Confirmar' : 'Confirm'}
          </button>
        )}
        {step !== 'areas' && (
          <button type="button" onClick={back} style={{ ...sm2Button('outline'), width: '100%' }}>
            {isPt ? 'Voltar' : 'Back'}
          </button>
        )}
        <button type="button" onClick={onSkip} style={{ ...sm2Button('quiet'), width: '100%' }}>
          {isPt ? 'Pular por agora' : 'Skip for now'}
        </button>
      </div>
    </RitualDialog>
  );
}

/** Constrói as `Activity` a partir dos itens escolhidos — id novo, nível 1,
 *  agenda padrão do nível 1 do item. Não decide nada sobre o resto do save. */
export function activitiesFromCatalogChoice(items: CatalogItem[]): Array<{
  id: string; name: string; category: CatalogItem['category']; emoji: string;
  steps: never[]; weekDays: number[]; catalogId: string; level: 1;
  schedule: CatalogItem['levels'][number]['defaultSchedule'];
}> {
  return items.map((item) => ({
    id: genId(),
    name: item.name.en,
    category: item.category,
    emoji: item.emoji,
    steps: [],
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    catalogId: item.id,
    level: 1,
    schedule: item.levels[0].defaultSchedule,
  }));
}
