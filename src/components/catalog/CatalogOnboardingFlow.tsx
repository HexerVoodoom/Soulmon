import { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { PixelIcon } from '../ui/PixelIcon';
import { ACTIVITY_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { RitualDialog, ritualTitle } from '../ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text, Chip } from '../form/FormKit';
import { recommendStarterSet } from '../../utils/recommend';
import { activitiesFromCatalogChoice } from '../../utils/catalogChoice';
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
 * ver `src/utils/catalogOnboarding.ts`). Curto:
 * 4 telas no máximo (áreas → dificuldades → forças → starter set), cada
 * escolha com 1 a 3 itens. ⚠️ Desde 01/10/2026 (C10/C11 do dono) NÃO é mais
 * pulável: cada passo exige ao menos 1 escolha e o ponto de partida exige ao
 * menos 1 meta assumida.
 *
 * Nenhuma atividade existente é tocada: `onComplete` só ACRESCENTA as
 * escolhidas, nunca substitui `activities`.
 */
const STRUGGLES: StruggleId[] = ['comecar', 'constancia', 'esquecer', 'energia', 'ansiedade', 'distracao', 'tempo', 'perfeccionismo'];
const STRENGTHS: StrengthId[] = ['disciplina', 'curiosidade', 'criatividade', 'sociabilidade', 'organizacao', 'energiaFisica', 'calma', 'persistencia'];

interface CatalogOnboardingFlowProps {
  language?: 'pt-BR' | 'en-US';
  /** ⚰️ C11 (01/10/2026): o fluxo não tem mais "pular" — a prop fica opcional
   *  só para quem ainda a passa; não é chamada. */
  onSkip?: () => void;
  onComplete: (chosen: CatalogItem[]) => void;
}

type Step = 'areas' | 'struggles' | 'strengths' | 'starter';

function toggle<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function CatalogOnboardingFlow({ language = 'en-US', onComplete }: CatalogOnboardingFlowProps) {
  const isPt = language === 'pt-BR';
  const [step, setStep] = useState<Step>('areas');
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [struggles, setStruggles] = useState<StruggleId[]>([]);
  const [strengths, setStrengths] = useState<StrengthId[]>([]);
  /* C12 (navegação do dono, 01/10/2026): o starter set deixou de nascer
     ACEITO. Antes cada sugestão entrava na lista a menos que a pessoa tocasse
     "Trocar" — e foi assim que hábitos que o dono "não definiu" apareceram na
     Home (C8). Agora cada sugestão tem um botão "Assumir"/"Commit" que, ao
     toque, vira uma caixa MARCADA (toque de novo desmarca). Só entra o que
     foi assumido. */
  const [committed, setCommitted] = useState<Set<string>>(new Set());

  const starterSet = useMemo(
    () => recommendStarterSet({ areas, struggles, strengths }, ACTIVITY_CATALOG),
    [areas, struggles, strengths],
  );
  const finalSet = starterSet.filter((i) => committed.has(i.id));

  /* C9: "o que você quer melhorar" → "Definir metas" / "Set goals". */
  const titles: Record<Step, string> = {
    areas: isPt ? 'Definir metas' : 'Set goals',
    struggles: isPt ? 'O que mais te trava?' : "What's holding you back most?",
    strengths: isPt ? 'O que já é forte em você?' : "What's already a strength?",
    starter: isPt ? 'Seu ponto de partida' : 'Your starting point',
  };
  /* C10: mínimo 1 em cada escolha (áreas, travas, forças); C11: no ponto de
     partida, ao menos 1 meta assumida antes de avançar. */
  const subtitles: Record<Step, string> = {
    areas: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    struggles: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    strengths: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    starter: isPt ? 'Assuma ao menos uma para começar.' : 'Commit to at least one to begin.',
  };

  const canAdvance =
    step === 'areas' ? areas.length >= 1
      : step === 'struggles' ? struggles.length >= 1
        : step === 'strengths' ? strengths.length >= 1
          /* Sem sugestão nenhuma (perfil sem par no catálogo) a exigência não
             pode virar parede: confirma vazio e o catálogo segue no "+". */
          : (starterSet.length === 0 || finalSet.length >= 1);

  const next = () => {
    if (!canAdvance) return;
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
    /* C11: sem "pular". O Esc do diálogo VOLTA um passo (no primeiro passo
       não faz nada) — a saída é definir a meta, não fugir dela. */
    <RitualDialog label={titles[step]} onClose={back} zIndex={200} maxWidth={380}>
      {/* Back padronizado (B6/I3): seta no canto superior ESQUERDO, acima do
          título — nunca botão "Voltar" embaixo. */}
      {step !== 'areas' && (
        <button
          type="button"
          onClick={back}
          aria-label={isPt ? 'Voltar' : 'Back'}
          title={isPt ? 'Voltar' : 'Back'}
          data-flow-back
          style={{
            alignSelf: 'flex-start', width: 44, height: 44, margin: '-8px 0 -8px -10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--sm2-ink)',
          }}
        >
          <Icon name="arrow_back" size={24} />
        </button>
      )}
      <h2 style={ritualTitle}>{titles[step]}</h2>
      {step === 'areas' && (
        /* C9: em uma linha, o benefício de engajar — descreve o mecanismo,
           sem veredito sobre a pessoa (bíblia §17). */
        <p style={{ ...sm2Text, margin: 0 }} data-goal-why>
          {isPt
            ? 'O que você definir vira sua lista do dia — cada uma concluída alimenta seu Soulmon.'
            : 'What you set becomes your daily list — each one you finish feeds your Soulmon.'}
        </p>
      )}
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
            const isOn = committed.has(item.id);
            const name = isPt ? item.name.pt : item.name.en;
            const toggleItem = () => setCommitted((prev) => {
              const nextSet = new Set(prev);
              if (nextSet.has(item.id)) nextSet.delete(item.id); else nextSet.add(item.id);
              return nextSet;
            });
            /* C7: sem a descrição pequena sob o cartão; D5: sem emoji como
               ícone — o nome fala sozinho. */
            return (
              <div key={item.id} className="sm2-conta-card" data-starter-item={item.id} style={{ padding: '6px 6px 6px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  {/* 04/10/2026 (decisão do dono): ícone de atividade em pixel, quando existe. */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {ACTIVITY_ICON_ART[item.id] && <PixelIcon src={ACTIVITY_ICON_ART[item.id]} size={32} style={{ flex: 'none' }} />}
                    <span style={{ ...sm2Text, fontWeight: 600 }}>{name}</span>
                  </span>
                  {isOn ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked="true"
                      aria-label={isPt ? `Assumida: ${name}` : `Committed: ${name}`}
                      onClick={toggleItem}
                      data-starter-committed
                      style={{
                        width: 44, height: 44, flex: '0 0 44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 24, height: 24, borderRadius: 'var(--sm2-radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'var(--sm2-primary-fill)', color: 'var(--sm2-on-primary)',
                        }}
                      >
                        <Icon name="check" size={20} fill={1} weight={700} />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleItem}
                      aria-label={isPt ? `Assumir: ${name}` : `Commit: ${name}`}
                      style={{ ...sm2Button('outline', false, 'sm'), minHeight: 32, height: 32, padding: '0 12px' }}
                    >
                      {isPt ? 'Assumir' : 'Commit'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {starterSet.length === 0 && (
            <p style={sm2Text}>{isPt ? 'Sem sugestões — você pode ir direto ao catálogo depois.' : 'No suggestions — you can browse the catalog later.'}</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {step !== 'starter' ? (
          <button
            type="button"
            onClick={next}
            aria-disabled={!canAdvance || undefined}
            style={{ ...sm2Button('primary', !canAdvance), width: '100%' }}
          >
            {isPt ? 'Continuar' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { if (canAdvance) onComplete(finalSet); }}
            aria-disabled={!canAdvance || undefined}
            style={{ ...sm2Button('primary', !canAdvance), width: '100%' }}
          >
            {isPt ? 'Confirmar' : 'Confirm'}
          </button>
        )}
      </div>
    </RitualDialog>
  );
}

// Mora em `utils/catalogChoice.ts` (o `App.tsx` o usa sem carregar este fluxo); reexportado por compat.
export { activitiesFromCatalogChoice };
