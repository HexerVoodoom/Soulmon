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
 * estágio (`classTitle`) continua sendo computada aqui — pelo SIGILO no canto
 * do visor e pelo cache do save — mas **o nome dela nunca é renderizado**
 * (`docs/PLANO-ORACULO.md` §2, decisão 3 do dono, 28/09/2026: "a classe nunca
 * aparece ao jogador; age por trás"). ⚰️ Até a Fase 3 do Oráculo esta página
 * escrevia `· <nome do arquétipo>` ao lado do estágio, na forma atual e nas anteriores,
 * contra a decisão registrada em `docs/ORACULO.md` (rodada 7) e contra a
 * régua de comportamento (`plano-comportamento.md` §6.7: expor a classe é
 * rótulo fixo — "você é um Guardião das Sombras"). A régua viva é
 * `src/components/classeNuncaVisivel.contract.test.tsx`.
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
import { sigilArt } from '../utils/sigilArt';
import { ACHIEVEMENT_IDS, ACHIEVEMENT_LABELS, type AchievementId } from '../utils/achievements';
import { emblemArt } from '../utils/emblemArt';
import { Viewport } from './ui/Viewport';
import { MiniGlass } from './ui/MiniGlass';
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
  /** minimal-ui F5 — dentro da folha do Laboratório o `<h1>` da tela é o do
   *  `AreaTopBar`; aqui o nome da criatura desce para `<h2>`. Padrão 1. */
  headingLevel?: 1 | 2;
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

/**
 * A COMPOSIÇÃO DA HEROÍNA no vidro 192² (`Viewport 64×64×3`) — canvas Pet
 * (`docs/design/wireframes/pet/identidade/`, D-P2/D-P3/D-P4), medidas em CSS px:
 *
 *  · **sprite 256² a 128, centrado** (`left/top 32`) — 0,5× em DPR 1, 1× em
 *    DPR 2, a MESMA escala da Home (DECISÕES §18 P2 a): uma criatura, um
 *    tamanho. Antes ele esticava ao vidro (192 = 0,75×), e três escalas da
 *    mesma arte (Home 0,5×, Ficha 0,75×, anterior 0,19×) liam como três
 *    criaturas.
 *  · **aura 96² a 2× (192 = o vidro inteiro), atrás, a opacidade 1** — o
 *    PNG já traz o alfa; nenhuma opacidade no aparelho (Home F1). A 96² é a
 *    derivada da rodada 2 (`auraForElement(el, 96)`, R2-3, 21/09/2026); sem
 *    ela cai na 128² e o corte de X3 b volta (a 2× o anel mede 256, 32 px de
 *    cada lado fora — `AURA_128`).
 *  · **sigilo de classe 192² a 48 (0,25×)**, canto superior esquerdo a 8 px,
 *    à frente da aura — só quando a classe do estágio traz `sigilo`
 *    (`classTitle.ts`); nunca solto no aparelho (D6).
 */
const HERO: CSSProperties = {
  position: 'absolute', left: 32, top: 32, width: 128, height: 128, imageRendering: 'pixelated',
};
const AURA: CSSProperties = {
  position: 'absolute', left: 0, top: 0, width: 192, height: 192, maxWidth: 'none', imageRendering: 'pixelated',
};
const AURA_128: CSSProperties = {
  // `maxWidth: 'none'`: o preflight (`img { max-width: 100% }`) encolhia a aura
  // para os 192 do vidro — medido no browser (largura 192 em vez de 256).
  ...AURA, left: -32, top: -32, width: 256, height: 256,
};
const SIGIL: CSSProperties = {
  position: 'absolute', left: 8, top: 8, width: 48, height: 48, imageRendering: 'pixelated',
};

/**
 * O VISOR DE EMBLEMAS (D-P5): `Viewport 158×41×2` = 316×82 CSS, com **duas
 * linhas de 158×20 (×2 = 316×40)** e 2 px entre elas — emblemas 64² a 32
 * (0,5×), `gap` 2 + `padding` 4. A conta: com 9 conquistas (`ACHIEVEMENT_IDS`)
 * o visor 142×20 do código de 15/09 não comportava as nove abertas
 * (9 × 32 + 8 × 2 + 8 = 312 > 284); em duas linhas cada conquista tem casa
 * FIXA (as `ceil(9/2)` primeiras em cima, o resto embaixo — pela ordem
 * canônica), então abrir uma nova nunca embaralha as outras. Só os abertos
 * são desenhados; os fechados não viram cadeado nem silhueta (o app não
 * cobra). Um `role="img"` só, com o MESMO texto da linha quieta sob o visor
 * (X2: o vidente vê o que o leitor ouve).
 */
const EMBLEM_ROW_W = 158;
const EMBLEM_ROW_H = 20;
const EMBLEM_ROWS = 2;
const EMBLEM_ROW_GAP = 1; // lógico; ×2 = 2 CSS px entre as linhas
const EMBLEM_PER_ROW = Math.ceil(ACHIEVEMENT_IDS.length / EMBLEM_ROWS);
const emblemRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px', boxSizing: 'border-box',
  width: EMBLEM_ROW_W * 2, height: EMBLEM_ROW_H * 2,
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
  savedSkills, onSkillsComputed, savedClassTitles, onClassTitlesComputed, language = 'pt-BR', headingLevel = 1,
}: PetPageProps) {
  const isPt = language === 'pt-BR';
  const H = headingLevel === 2 ? 'h2' : 'h1';
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
        const { fichaByStage, stageSkills, dominantElement } = buildFichaESkills(saved, identityKey(saved));
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
          const titulos = await computeClassTitlesAllStages(fichaByStage, dominantElement);
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
  /** A aura 96² (R2-3) quando existe; senão a 128² com o corte declarado. */
  const aura = auraForElement(dominantElement, 96);
  const auraStyle = aura && aura === auraForElement(dominantElement, 128) ? AURA_128 : AURA;
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
            {aura && <img src={aura} alt="" aria-hidden="true" data-aura style={auraStyle} />}
            <img src={getSpriteForStage(creatureFormId(atual), demoCharacterId)} alt="" data-hero style={HERO} />
            {classeAtual?.sigilo && sigilArt(classeAtual.sigilo) && (
              <img src={sigilArt(classeAtual.sigilo)} alt="" aria-hidden="true" data-sigil={classeAtual.sigilo} style={SIGIL} />
            )}
          </Viewport>

          {/* Emblemas de CONQUISTA (15/09/2026): pixel, logo DENTRO de um segundo visor
              estreito — nunca soltos no aparelho (`04` §1). Só os abertos são
              desenhados; os fechados não viram cadeado nem silhueta (o app não cobra). */}
          {achievements.length > 0 && (() => {
            const abertos = ACHIEVEMENT_IDS.filter(id => achievements.includes(id));
            const rotulo = isPt
              ? `Conquistas · ${abertos.length} de ${ACHIEVEMENT_IDS.length}`
              : `Achievements · ${abertos.length} of ${ACHIEVEMENT_IDS.length}`;
            const linhas = Array.from({ length: EMBLEM_ROWS }, (_, i) =>
              ACHIEVEMENT_IDS.slice(i * EMBLEM_PER_ROW, (i + 1) * EMBLEM_PER_ROW).filter(id => abertos.includes(id)));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Viewport
                  width={EMBLEM_ROW_W}
                  height={EMBLEM_ROW_H * EMBLEM_ROWS + EMBLEM_ROW_GAP * (EMBLEM_ROWS - 1)}
                  scale={2}
                  breathing={false}
                  label={rotulo}
                  style={{ borderRadius: 12 }}
                  screenStyle={{ display: 'flex', flexDirection: 'column', gap: EMBLEM_ROW_GAP * 2 }}
                >
                  {linhas.map((ids, i) => (
                    <div key={i} data-emblem-row={i} style={emblemRow}>
                      {ids.map(id => (
                        <img
                          key={id}
                          src={emblemArt(id)}
                          alt={isPt ? ACHIEVEMENT_LABELS[id].pt : ACHIEVEMENT_LABELS[id].en}
                          title={isPt ? ACHIEVEMENT_LABELS[id].pt : ACHIEVEMENT_LABELS[id].en}
                          width={32}
                          height={32}
                          data-emblem={id}
                          style={{ imageRendering: 'pixelated', display: 'block' }}
                        />
                      ))}
                    </div>
                  ))}
                </Viewport>
                {/* A contagem de POSSE como linha quieta (E5/13.7) — nunca "faltam N". */}
                <p className="sm2-num" data-achievements-count style={{ ...sm2Hint, textAlign: 'center' }}>{rotulo}</p>
              </div>
            );
          })()}

          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <H style={h1Style}>{atual.name}</H>
            {/* Só o estágio: uma palavra nomeada, nenhum número — e nunca a
                classe (decisão 3 do plano do Oráculo; ver o cabeçalho). */}
            <p style={{ ...sm2Hint, marginTop: 4 }}>
              {L(atual.stageName)}
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
          <H style={{ ...h1Style, fontSize: 'var(--sm2-text-lg)', marginTop: 8 }}>
            {isPt ? 'Seu Soulmon' : 'Your Soulmon'}
          </H>
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
              return (
                <article key={formId} style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* A forma anterior num vidro 80² sem anel, sprite 256² a 64
                      (0,25× — D-P9, miniatura sempre em vidro, D-H7); antes era um
                      <img 48> solto no card (achado 7). */}
                  <MiniGlass size={80}>
                    <img
                      // a linha demo vale para TODAS as formas da jornada: passar o id só na
                      // forma atual desenhava um bicho na atual e o placeholder genérico
                      // nas anteriores — duas criaturas diferentes na mesma "jornada"
                      src={getSpriteForStage(formId, demoCharacterId)}
                      alt=""
                      data-form-sprite={formId}
                      style={{ width: 64, height: 64, display: 'block', imageRendering: 'pixelated' }}
                    />
                  </MiniGlass>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{form.name}</p>
                    <p style={{ ...sm2Hint, marginTop: 2 }}>
                      {L(form.stageName)}
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
