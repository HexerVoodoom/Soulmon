import { useMemo, useState } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { ACTIVITY_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { sm2Button, sm2Hint, sm2Text, Chip, CheckRow, ModalSheet } from '../form/FormKit';
import { recommendStarterSet } from '../../utils/recommend';
import { activitiesFromCatalogChoice, withoutExisting } from '../../utils/catalogChoice';
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
  /** As atividades que a pessoa JÁ tem (beta-2, 7.3): o que já está na lista não é oferecido de novo nem entra duplicado. */
  existingActivities?: ReadonlyArray<{ catalogId?: string | null }>;
}

type Step = 'areas' | 'struggles' | 'strengths' | 'starter';

function toggle<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function CatalogOnboardingFlow({ language = 'en-US', onComplete, existingActivities }: CatalogOnboardingFlowProps) {
  const isPt = language === 'pt-BR';
  const [step, setStep] = useState<Step>('areas');
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [struggles, setStruggles] = useState<StruggleId[]>([]);
  const [strengths, setStrengths] = useState<StrengthId[]>([]);
  /* REGISTRO §64 (dono, 15/10/2026): o ponto de partida nasce DESMARCADO. O "todas marcadas" do beta-2 (7.3) foi SUBSTITUÍDO — a
     pessoa reafirma o que quer fazer e só entra o que ela marcou (mesma regra do modal diário de metas, `DayGoalsModal`).
     Guardamos o que foi MARCADO por id: a lista de sugestões muda quando a pessoa volta e troca as escolhas, e o marcado
     que ainda existe segue marcado. */
  const [checked, setChecked] = useState<Set<string>>(new Set());

  /* O que já está na lista (`catalogId`) não é oferecido de novo: sem tarefa duplicada. */
  const starterSet = useMemo(
    () => withoutExisting(recommendStarterSet({ areas, struggles, strengths }, ACTIVITY_CATALOG), existingActivities),
    [areas, struggles, strengths, existingActivities],
  );
  const finalSet = starterSet.filter((i) => checked.has(i.id));

  /* C9: "o que você quer melhorar" → "Definir metas" / "Set goals". */
  const titles: Record<Step, string> = {
    areas: isPt ? 'Definir metas' : 'Set goals',
    struggles: isPt ? 'O que mais te trava?' : "What's holding you back most?",
    strengths: isPt ? 'O que já é forte em você?' : "What's already a strength?",
    starter: isPt ? 'Adicionar tarefas à lista' : 'Add tasks to list',
  };
  /* C10: mínimo 1 em cada escolha (áreas, travas, forças); C11: no ponto de
     partida, ao menos 1 meta assumida antes de avançar. */
  const subtitles: Record<Step, string> = {
    areas: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    struggles: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    strengths: isPt ? 'Escolha de 1 a 3.' : 'Pick 1 to 3.',
    starter: isPt ? 'Marque o que você quer fazer.' : 'Check what you want to do.',
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

  /* Beta-2 (F4 do crítico, 13/10/2026): o fluxo usava a FOLHA de baixo. 14/10/2026 (dono, por voz): os modais do começo do dia
     NÃO são bottom sheet — são o modal CENTRALIZADO (`placement="center"`). O botão de confirmar segue no rodapé do painel;
     o título e a seta de voltar são os do painel (a seta só do 2º passo em diante). */
  const passoAnterior = step !== 'areas';
  const botaoPrimario = step !== 'starter' ? (
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
  );

  return (
    /* C11: sem "pular". O Esc VOLTA um passo (no primeiro passo não faz nada) — a saída é definir a meta, não fugir dela. */
    <ModalSheet
      open
      title={titles[step]}
      onClose={back}
      onBack={passoAnterior ? back : undefined}
      closeSide={passoAnterior ? 'start' : 'none'}
      dismissOnBackdrop={false}
      placement="center"
      language={language}
      maxWidth={420}
      footer={botaoPrimario}
    >
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
            const name = isPt ? item.name.pt : item.name.en;
            /* C7: sem a descrição pequena sob o cartão; D5: sem emoji como ícone — o nome fala sozinho. A caixa é a
               `CheckRow` do kit (rótulo inteiro = alvo de 44). */
            return (
              <div key={item.id} className="sm2-conta-card" data-starter-item={item.id} style={{ padding: '2px 12px' }}>
                <CheckRow
                  checked={checked.has(item.id)}
                  onChange={(on) => setChecked((prev) => {
                    const nextSet = new Set(prev);
                    if (on) nextSet.add(item.id); else nextSet.delete(item.id);
                    return nextSet;
                  })}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {/* 04/10/2026 (decisão do dono): ícone de atividade em pixel, quando existe. */}
                    {ACTIVITY_ICON_ART[item.id] && <PixelIcon src={ACTIVITY_ICON_ART[item.id]} size={32} style={{ flex: 'none' }} />}
                    <span style={{ fontWeight: 600 }}>{name}</span>
                  </span>
                </CheckRow>
              </div>
            );
          })}
          {starterSet.length === 0 && (
            <p style={sm2Text}>{isPt ? 'Sem sugestões — você pode ir direto ao catálogo depois.' : 'No suggestions — you can browse the catalog later.'}</p>
          )}
        </div>
      )}
    </ModalSheet>
  );
}

// Mora em `utils/catalogChoice.ts` (o `App.tsx` o usa sem carregar este fluxo); reexportado por compat.
export { activitiesFromCatalogChoice };
