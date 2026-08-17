/**
 * Página do PET — a ficha viva da criatura, forma a forma.
 *
 * Mostra TODAS as formas já desbloqueadas (nunca as futuras): sprite, nome,
 * estágio, a descrição gerada pelo oráculo (personalidade, hábitos e poderes
 * — o campo `description` de cada forma existia no save desde a geração e
 * nunca tinha sido renderizado) e as DUAS habilidades do estágio, derivadas
 * da ficha do class-system: a básica (custo baixo, frequente) e a especial
 * (custo alto, rara).
 *
 * As skills são recomputadas sob demanda do perfil salvo (SOULMON_PROFILE =
 * OracleInput + seed) pelo pipeline completo — determinístico, mesma
 * identidade = mesmas skills, sem campo novo no save. Saves legados (sem
 * soulProfile) simplesmente não mostram a seção de habilidades.
 */
import { useEffect, useMemo, useState } from 'react';
import type { CreatureStage, OracleInput } from '../utils/oracle';
import { creatureFormId } from '../utils/oracle';
import { getSpriteForStage } from '../utils/sprites';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readJson } from '../utils/safeStorage';
import { FICHA_STAGE_ORDER, type FichaStage } from '../utils/soulProfile/ficha/types';
import type { StageSkills, StageSkill } from '../utils/soulProfile/ficha/skills';
import type { ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import { PixelTag } from './pixel/PixelKit';

interface PetPageProps {
  stages: CreatureStage[];
  /** Skills já persistidas no save (vêm da nuvem). */
  savedSkills?: Record<FichaStage, StageSkills>;
  /** Chamado quando a página recomputa as skills a partir do perfil local —
   *  é assim que o cache do save se preenche sozinho, sem tocar nos pontos de
   *  criação/reroll/upgrade. */
  onSkillsComputed?: (skills: Record<FichaStage, StageSkills>) => void;
  /** Classe por estágio (arquétipo real do class-system), mesmo padrão de
   *  cache de `savedSkills`/`onSkillsComputed`. */
  savedClassTitles?: Record<FichaStage, ClassTitle>;
  onClassTitlesComputed?: (titles: Record<FichaStage, ClassTitle>) => void;
  unlockedEvolutions: string[];
  currentStageId: string;
  demoCharacterId?: string;
  petName?: string;
  language?: 'pt-BR' | 'en-US';
}

function SkillRow({ skill, isPt }: { skill: StageSkill; isPt: boolean }) {
  const nome = isPt ? skill.nome.pt : skill.nome.en;
  const desc = isPt ? skill.descricao.pt : skill.descricao.en;
  const tipo = skill.tipo === 'basica' ? (isPt ? 'Básica' : 'Basic') : (isPt ? 'Especial' : 'Special');
  const custo = skill.custo === 'baixo' ? (isPt ? 'custo baixo' : 'low cost') : (isPt ? 'custo alto' : 'high cost');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <PixelTag>{tipo}</PixelTag>
        <span style={{ fontWeight: 700 }}>{nome}</span>
        <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>· {custo}</span>
        {typeof skill.poder === 'number' && (
          <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>
            · {isPt ? 'poder' : 'power'} {skill.poder}
          </span>
        )}
      </div>
      <div className="text-xs" style={{ color: 'var(--sm-muted)', lineHeight: 1.35 }}>{desc}</div>
    </div>
  );
}

export function PetPage({
  stages, unlockedEvolutions, currentStageId, demoCharacterId, petName,
  savedSkills, onSkillsComputed, savedClassTitles, onClassTitlesComputed, language = 'pt-BR',
}: PetPageProps) {
  const isPt = language === 'pt-BR';
  const L = (t: { pt: string; en: string }) => (isPt ? t.pt : t.en);

  const [skills, setSkills] = useState<Record<FichaStage, StageSkills> | null>(savedSkills ?? null);
  const [classTitles, setClassTitles] = useState<Record<FichaStage, ClassTitle> | null>(savedClassTitles ?? null);
  useEffect(() => {
    let vivo = true;
    (async () => {
      // try/catch obrigatório: um perfil salvo corrompido faria isto virar
      // unhandled rejection e a seção de skills sumiria sem sinal nenhum.
      // A página tem que ficar de pé mostrando as formas — as skills são o
      // extra, não o conteúdo principal.
      try {
        const saved = readJson<(OracleInput & { seed: number }) | null>(STORAGE_KEYS.SOULMON_PROFILE, null);
        if (!saved?.soulProfile) return;
        // Importa só o que a página precisa (ficha → skills). Puxar o barril
        // `soulProfile` inteiro arrastava a astronomy-engine e o pool de 2.000
        // criaturas do bestiário — ~144 KB gzip e ~18 ms de linhagem — para
        // renderizar duas skills que custam 0,06 ms e dependem só da ficha.
        const [{ buildFichaESkills }, { identityKey }] = await Promise.all([
          import('../utils/soulProfile/ficha/fromInput'),
          import('../utils/soulProfile/identity'),
        ]);
        const { fichaByStage, stageSkills } = buildFichaESkills(saved, identityKey(saved));
        if (!vivo) return;
        setSkills(stageSkills);
        // guarda no save: o perfil do oráculo vive só no localStorage e não
        // sobe para a nuvem, então sem este cache um aparelho novo (ou um save
        // restaurado) mostrava as formas e perdia as habilidades em silêncio.
        onSkillsComputed?.(stageSkills);

        // Poder REAL via `calcularSkill` do motor — puxa o registro completo
        // do class-system, por isso vem DEPOIS e não bloqueia a primeira
        // pintura da tela. Se falhar (import, ficha degenerada), a página
        // segue com o par qualitativo que já está na tela.
        try {
          const { withRealPowerAllStages } = await import('../utils/soulProfile/ficha/realSkillPower');
          const comPoder = await withRealPowerAllStages(fichaByStage, stageSkills);
          if (!vivo) return;
          setSkills(comPoder as Record<FichaStage, StageSkills>);
          onSkillsComputed?.(comPoder as Record<FichaStage, StageSkills>);
        } catch {
          // fica com o par qualitativo — nunca some skill nenhuma por causa disto
        }

        // Classe por estágio — mesmo motor, mesma ficha, mesmo cuidado: falhar
        // aqui nunca pode tirar formas/skills da tela.
        try {
          const { computeClassTitlesAllStages } = await import('../utils/soulProfile/ficha/classTitle');
          const titulos = await computeClassTitlesAllStages(fichaByStage);
          if (!vivo) return;
          setClassTitles(titulos as Record<FichaStage, ClassTitle>);
          onClassTitlesComputed?.(titulos as Record<FichaStage, ClassTitle>);
        } catch {
          // sem classe é melhor que sem página
        }
      } catch {
        // segue com o que veio do save (se veio) — as formas continuam na tela
      }
    })();
    return () => { vivo = false; };
  }, [onSkillsComputed, onClassTitlesComputed]);

  // Só as formas JÁ desbloqueadas, em ordem de estágio — nunca as futuras.
  const formas = useMemo(() => {
    const unlocked = new Set(unlockedEvolutions);
    return stages
      .filter(s => unlocked.has(creatureFormId(s)))
      .sort((a, b) =>
        FICHA_STAGE_ORDER.indexOf(getStageLevel(creatureFormId(a)) as FichaStage) -
        FICHA_STAGE_ORDER.indexOf(getStageLevel(creatureFormId(b)) as FichaStage));
  }, [stages, unlockedEvolutions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
      <div className="sm-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          {petName ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon')}
        </div>
        <div className="text-xs" style={{ color: 'var(--sm-muted)', marginTop: 2 }}>
          {isPt
            ? 'A jornada até aqui: cada forma que vocês já alcançaram, com o jeito e os poderes dela.'
            : 'The journey so far: every form you have reached, with its ways and its powers.'}
        </div>
      </div>

      {formas.length === 0 && (
        <div className="sm-card" style={{ padding: 14, textAlign: 'center' }}>
          <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>
            {isPt ? 'Nenhuma forma revelada ainda.' : 'No form revealed yet.'}
          </span>
        </div>
      )}

      {formas.map(form => {
        const formId = creatureFormId(form);
        const stageKey = getStageLevel(formId) as FichaStage;
        const isCurrent = formId === currentStageId;
        const stageSkills = skills?.[stageKey];
        const classTitle = classTitles?.[stageKey];
        return (
          <div key={formId} className="sm-card" style={{ padding: 12, boxShadow: isCurrent ? 'inset 0 0 0 2px var(--sm-ink)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                // a linha demo vale para TODAS as formas da jornada: passar o id só na
                // forma atual desenhava um bicho na atual e o placeholder genérico
                // nas anteriores — duas criaturas diferentes na mesma "jornada"
                src={getSpriteForStage(formId, demoCharacterId)}
                alt={form.name}
                style={{ width: 56, height: 56, imageRendering: 'pixelated', objectFit: 'contain' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800 }}>{form.name}</span>
                  <PixelTag>{L(form.stageName)}</PixelTag>
                  {isCurrent && <PixelTag>{isPt ? 'atual' : 'current'}</PixelTag>}
                </div>
                {classTitle && (
                  <div className="text-xs" style={{ color: 'var(--sm-gold)', fontWeight: 700, marginTop: 2 }}>
                    {L(classTitle.nome)}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: '8px 0 0' }}>
              {L(form.description)}
            </p>
            {stageSkills && (
              <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <SkillRow skill={stageSkills.basica} isPt={isPt} />
                <SkillRow skill={stageSkills.especial} isPt={isPt} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
