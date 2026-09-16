/**
 * Página do PET — a ficha viva da criatura, forma a forma.
 *
 * REVAMP: **a criatura é a heroína da tela.** Antes ela aparecia como uma
 * miniatura de 56px empilhada dentro de cartões iguais, sem hierarquia nenhuma;
 * agora a forma ATUAL abre a página dentro do `<Viewport>` — o elemento de
 * marca, a fronteira entre o pixel (dentro) e o vetor (fora) — em escala
 * INTEIRA, e tudo o mais é legenda dela.
 *
 * O que a página mostra (a lógica é a mesma de antes, nada foi inventado):
 * TODAS as formas já desbloqueadas (nunca as futuras), a descrição gerada pelo
 * oráculo e as DUAS habilidades do estágio (básica e especial). A CLASSE do
 * estágio (`classTitle`) já era computada aqui e nunca era renderizada — agora
 * ela aparece, porque é exatamente o tipo de dado que esta tela deveria dar:
 * uma PALAVRA nomeada, não um número.
 *
 * As skills são recomputadas sob demanda do perfil salvo (SOULMON_PROFILE =
 * OracleInput + seed) pelo pipeline completo — determinístico, mesma
 * identidade = mesmas skills, sem campo novo no save. Saves legados (sem
 * soulProfile) simplesmente não mostram a seção de habilidades.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CreatureStage, OracleInput } from '../utils/oracle';
import { creatureFormId } from '../utils/oracle';
import { getSpriteForStage } from '../utils/sprites';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readJson } from '../utils/safeStorage';
import { FICHA_STAGE_ORDER, type FichaStage } from '../utils/soulProfile/ficha/types';
import type { StageSkills, StageSkill } from '../utils/soulProfile/ficha/skills';
import type { ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import { auraForElement } from '../utils/attackFxArt';
import { ACHIEVEMENT_IDS, ACHIEVEMENT_LABELS, type AchievementId } from '../utils/achievements';
import { emblemArt } from '../utils/emblemArt';
import { Viewport } from './ui/Viewport';
import { Icon } from './ui/Icon';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';

interface PetPageProps {
  stages: CreatureStage[];
  /** Elemento dominante do oráculo — aura elemental atrás da forma atual, dentro do visor (D9). */
  dominantElement?: string;
  /** Conquistas abertas (`utils/achievements.ts`, derivadas do save pelo App). Vazio = sem faixa. */
  achievements?: readonly AchievementId[];
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

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  padding: 16,
};

/**
 * HIERARQUIA DE HEADING — a tela era navegável só com os olhos.
 *
 * A página do Pet tinha `<h1>`/`<h2>` só no caminho FELIZ: quando nenhuma forma
 * estava revelada, ela renderizava um card sem heading nenhum, e uma tela sem
 * heading é uma tela que leitor de tela não consegue percorrer (não há como
 * pular para "o que ela sabe fazer" nem saber onde a página começa). Os dois
 * estilos abaixo são o par único da página: `h1` = a criatura, `h2` = as
 * seções. A `DreamDex` logo abaixo entra como `<h2>` irmã.
 */
const h1Style: CSSProperties = {
  fontFamily: 'var(--sm2-font-display)',
  fontSize: 'var(--sm2-text-xl)',
  fontWeight: 600,
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
  margin: 0,
};

const h2Style: CSSProperties = {
  fontFamily: 'var(--sm2-font-display)',
  fontSize: 'var(--sm2-text-md)',
  fontWeight: 600,
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
  margin: 0,
};

/** O sprite dentro do visor: escala inteira e nada de suavização. */
const spriteInScreen: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  imageRendering: 'pixelated',
};

/**
 * Uma habilidade. `basica`/`especial` viram PALAVRA ("Básica · custo baixo") e
 * o poder — quando o motor devolve um — segue como número com `tabular-nums`,
 * porque ali o número É a informação (dois ataques se comparam por ele).
 */
function SkillRow({ skill, isPt }: { skill: StageSkill; isPt: boolean }) {
  const nome = isPt ? skill.nome.pt : skill.nome.en;
  const desc = isPt ? skill.descricao.pt : skill.descricao.en;
  const especial = skill.tipo !== 'basica';
  const tipo = especial ? (isPt ? 'Especial' : 'Special') : (isPt ? 'Básica' : 'Basic');
  const custo = skill.custo === 'baixo' ? (isPt ? 'custo baixo' : 'low cost') : (isPt ? 'custo alto' : 'high cost');
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Icon
        name={especial ? 'auto_awesome' : 'bolt'}
        size={24}
        fill={especial ? 1 : 0}
        tone={especial ? 'gold' : 'primary'}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>
          {nome}
          {typeof skill.poder === 'number' && (
            <span className="sm2-num" style={{ ...sm2Hint, marginLeft: 8 }}>
              {isPt ? `poder ${skill.poder}` : `power ${skill.poder}`}
            </span>
          )}
        </p>
        <p style={{ ...sm2Hint, marginTop: 2 }}>{`${tipo} · ${custo}`}</p>
        <p style={{ ...sm2Hint, marginTop: 4 }}>{desc}</p>
      </div>
    </div>
  );
}

export function PetPage({
  stages,
  dominantElement, achievements = [], unlockedEvolutions, currentStageId, demoCharacterId, petName,
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

  // A heroína: a forma ATUAL. Se o save aponta para uma forma que não está na
  // lista desbloqueada (save antigo), cai na última alcançada — a tela nunca
  // fica sem protagonista.
  const atual = formas.find(f => creatureFormId(f) === currentStageId) ?? formas[formas.length - 1] ?? null;
  const anteriores = formas.filter(f => f !== atual).reverse();

  const nome = petName ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon');
  const classeAtual = atual ? classTitles?.[getStageLevel(creatureFormId(atual)) as FichaStage] : undefined;
  const skillsAtuais = atual ? skills?.[getStageLevel(creatureFormId(atual)) as FichaStage] : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

      {/* ─────────── A HEROÍNA ─────────── */}
      {atual ? (
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Viewport
            width={64}
            height={64}
            scale={3}
            label={isPt ? `${nome}, forma atual` : `${nome}, current form`}
            screenStyle={{ position: 'relative' }}
          >
            {auraForElement(dominantElement) && (
              <img src={auraForElement(dominantElement)} alt="" aria-hidden="true" data-aura style={{ ...spriteInScreen, opacity: 0.6 }} />
            )}
            <img src={getSpriteForStage(creatureFormId(atual), demoCharacterId)} alt="" style={spriteInScreen} />
          </Viewport>

          {/* Emblemas de CONQUISTA (15/09/2026): pixel, logo DENTRO de um segundo visor
              estreito — nunca soltos no aparelho (`04` §1). Só os abertos são
              desenhados; os fechados não viram cadeado nem silhueta (o app não cobra). */}
          {achievements.length > 0 && (
            <Viewport
              width={142}
              height={20}
              scale={2}
              breathing={false}
              label={isPt ? `Conquistas: ${achievements.length} de ${ACHIEVEMENT_IDS.length}` : `Achievements: ${achievements.length} of ${ACHIEVEMENT_IDS.length}`}
              screenStyle={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 2px' }}
            >
              {ACHIEVEMENT_IDS.filter(id => achievements.includes(id)).map(id => (
                <img
                  key={id}
                  src={emblemArt(id)}
                  alt={isPt ? ACHIEVEMENT_LABELS[id].pt : ACHIEVEMENT_LABELS[id].en}
                  title={isPt ? ACHIEVEMENT_LABELS[id].pt : ACHIEVEMENT_LABELS[id].en}
                  width={16}
                  height={16}
                  data-emblem={id}
                  style={{ imageRendering: 'pixelated', display: 'block' }}
                />
              ))}
            </Viewport>
          )}

          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h1 style={h1Style}>{atual.name}</h1>
            {/* Estágio e CLASSE: duas palavras nomeadas, e nenhum número. */}
            <p style={{ ...sm2Hint, marginTop: 4 }}>
              {L(atual.stageName)}
              {classeAtual ? ` · ${L(classeAtual.nome)}` : ''}
            </p>
            <p style={{ ...sm2Text, marginTop: 12 }}>{L(atual.description)}</p>
          </div>
        </section>
      ) : (
        <section style={{ ...card, textAlign: 'center' }}>
          <Icon name="egg" size={48} tone="muted" />
          {/* O ESTADO VAZIO também tem `<h1>`: sem ele esta tela ficava sem
              heading nenhum, e é justamente o estado em que a pessoa mais
              precisa saber onde está. */}
          <h1 style={{ ...h1Style, fontSize: 'var(--sm2-text-lg)', marginTop: 8 }}>
            {isPt ? 'Seu Soulmon' : 'Your Soulmon'}
          </h1>
          <p style={{ ...sm2Text, marginTop: 8 }}>
            {isPt ? 'Nenhuma forma revelada ainda.' : 'No form revealed yet.'}
          </p>
          <p style={{ ...sm2Hint, marginTop: 4 }}>
            {isPt
              ? 'Cuide do seu Soulmon: a primeira forma aparece aqui assim que seu Soulmon evoluir.'
              : 'Care for your Soulmon: the first form shows up here as soon as it evolves.'}
          </p>
        </section>
      )}

      {/* ─────────── O que ela sabe fazer ─────────── */}
      {skillsAtuais && (
        <section style={card}>
          <h2 style={{ ...h2Style, marginBottom: 14 }}>
            {isPt ? 'O que seu Soulmon sabe fazer' : 'What they can do'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkillRow skill={skillsAtuais.basica} isPt={isPt} />
            <SkillRow skill={skillsAtuais.especial} isPt={isPt} />
          </div>
        </section>
      )}

      {/* ─────────── As formas anteriores ─────────── */}
      {anteriores.length > 0 && (
        <section>
          <h2 style={{ ...h2Style, marginBottom: 12 }}>
            {isPt ? 'Quem seu Soulmon já foi' : 'Who they used to be'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {anteriores.map(form => {
              const formId = creatureFormId(form);
              const stageKey = getStageLevel(formId) as FichaStage;
              const classe = classTitles?.[stageKey];
              return (
                <article key={formId} style={{ ...card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <img
                    // a linha demo vale para TODAS as formas da jornada: passar o id só na
                    // forma atual desenhava um bicho na atual e o placeholder genérico
                    // nas anteriores — duas criaturas diferentes na mesma "jornada"
                    src={getSpriteForStage(formId, demoCharacterId)}
                    alt=""
                    style={{ width: 48, height: 48, flexShrink: 0, imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{form.name}</p>
                    <p style={{ ...sm2Hint, marginTop: 2 }}>
                      {L(form.stageName)}{classe ? ` · ${L(classe.nome)}` : ''}
                    </p>
                    <p style={{ ...sm2Hint, marginTop: 6 }}>{L(form.description)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
