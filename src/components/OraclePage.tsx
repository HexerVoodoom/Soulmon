import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readLocal, writeJson } from '../utils/safeStorage';
import { PixelizerCard } from './PixelizerCard';
import { generateAllSprites } from '../utils/spriteGen';
import {
  generateOracleAsync, creatureFormId, ELEMENT_INFO, ROLE_INFO, ELEMENT_ORDER, ROLE_ORDER,
  ALIGNMENT_INFO, REALM_INFO, ALIGNMENT_ORDER, REALM_ORDER,
  type OracleInput, type OracleResult, type OracleOverrides, type OraclePreferences, type LText,
  type ElementId, type RoleId, type AlignmentId, type RealmId,
} from '../utils/oracle';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';
import { isComplete as testComplete } from '../utils/soulProfile/personality/scoring';
import { traitLabels, traitLevelLabels, jungAxisLabels } from '../utils/soulProfile/personality/labels';
import { TRAIT_DIMENSIONS, JUNG_AXES } from '../utils/soulProfile/personality/types';
import type { Answers as SoulAnswers } from '../utils/soulProfile/personality/types';
import { cityLabel, type City } from '../utils/soulProfile/cities';
import { signLabel } from '../utils/soulProfile/astrology/labels';
import type { SoulProfile } from '../utils/soulProfile/profile';
import { CityPicker } from './CityPicker';
import { SoulTestItem, itemPrompt } from './SoulTestItem';

interface OraclePageProps {
  language?: Language;
  /** Semeia o checkbox "Modo debug" já ligado — usado pelo atalho oculto da
   *  tela de intro (SoulmonOnboarding), que abre esta página direto no modo
   *  sem custo em vez de deixar o dono procurar o checkbox. */
  initialDebugMode?: boolean;
}

interface SavedOracleForm extends OracleInput {
  seed?: number;
  overrides?: OracleOverrides;
  /** Respostas do teste + cidade escolhida, para recarregar a página sem
   *  perder o que foi digitado. O `soulProfile` já vai no OracleInput. */
  testAnswers?: SoulAnswers;
  city?: City | null;
  timeUnknown?: boolean;
}

const ATTRIBUTE_EMOJI: Record<AlignmentId, string> = { poder: '👊', harmonia: '🎶', benevolencia: '🤲' };

/**
 * Controles diretos DESLIGADOS por decisão do dono (ago/2026): elemento
 * favorito, bioma/reino e a descrição livre de 50% de impacto. A criatura
 * passa a vir da LEITURA (mapa astral + teste + as 6 perguntas) em vez de o
 * usuário escolher o resultado a dedo. "Se os usuários pedirem mais controle
 * no futuro nós reativamos" — por isso é uma flag, não código deletado:
 * virar `true` devolve os três de uma vez.
 *
 * `alignment` (Tipo) NÃO estava na lista do dono e continua valendo.
 */
const DIRECT_CONTROLS_ENABLED = false;

function loadSavedForm(): SavedOracleForm | null {
  try {
    const raw = readLocal(STORAGE_KEYS.ORACLE_FORM);
    if (!raw) return null;
    const form = JSON.parse(raw) as SavedOracleForm;
    if (DIRECT_CONTROLS_ENABLED) return form;
    /* Sanitiza NA CARGA, e não só no JSX. Os inicializadores de `useState`
       abaixo (a restauração assíncrona) chamam `generateOracleAsync(s, …)` com este objeto DIRETO — sem esta
       poda, um rascunho gravado antes do desligamento continuaria mandando
       elemento/bioma/descrição para o gerador, invisível na tela e ativo no
       resultado. É o pior tipo de bug: some da UI e segue valendo. */
    const { element: _el, realm: _rl, ...prefsMantidas } = form.preferences ?? {};
    void _el; void _rl;
    return { ...form, preferences: prefsMantidas, petDescription: undefined };
  } catch {
    return null;
  }
}

// Uma leitura só é reconstruível se o perfil de alma dela foi salvo junto: o
// motor novo precisa do mapa astral inteiro, e recalculá-lo aqui exigiria
// import dinâmico dentro de um inicializador de useState (síncrono). Rascunho
// sem perfil = formulário preenchido, não leitura pronta.
function formComplete(f: SavedOracleForm | null): f is SavedOracleForm {
  return !!f && f.fullName.trim().length >= 3 && !!f.birthDate && !!f.soulProfile;
}

export function OraclePage({ language = 'en-US', initialDebugMode = false }: OraclePageProps) {
  const isPt = language === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);

  const saved = loadSavedForm();
  const [fullName, setFullName] = useState(saved?.fullName ?? '');
  const [birthDate, setBirthDate] = useState(saved?.birthDate ?? '');
  const [birthTime, setBirthTime] = useState(saved?.birthTime ?? '12:00');
  const [birthCity, setBirthCity] = useState<City | null>(saved?.city ?? null);
  const [timeUnknown, setTimeUnknown] = useState(saved?.timeUnknown ?? false);
  const [answers, setAnswers] = useState<SoulAnswers>(saved?.testAnswers ?? {});
  const [soulProfile, setSoulProfile] = useState<SoulProfile | undefined>(saved?.soulProfile);
  const [revealing, setRevealing] = useState(false);
  const birthPlace = birthCity ? cityLabel(birthCity, isPt) : (saved?.birthPlace ?? '');
  const [prefs, setPrefs] = useState<OraclePreferences>(saved?.preferences ?? {});
  const [petDescription, setPetDescription] = useState(saved?.petDescription ?? '');

  // Etapa 1: leitura (perfil místico + eixos, tudo ajustável)
  const [profile, setProfile] = useState<OracleResult | null>(null);
  const [overrides, setOverrides] = useState<OracleOverrides>(() => loadSavedForm()?.overrides ?? {});

  // Etapa 2: criatura + prompts (só depois de clicar em "Gerar")
  const [creature, setCreature] = useState<OracleResult | null>(null);

  /* Restauração da leitura salva. Era síncrona (`generateOracle` em
     inicializador de `useState`); desde a Fase 2 do Oráculo a geração é
     `generateOracleAsync` (famílias visuais fora do chunk de entrada), então
     ela acontece num efeito de montagem. Enquanto restaura, o rascunho NÃO é
     regravado — senão o efeito abaixo gravaria `seed`/`overrides` vazios
     por cima do que está sendo restaurado. */
  const [restaurando, setRestaurando] = useState(() => formComplete(loadSavedForm()));
  useEffect(() => {
    const s = loadSavedForm();
    if (!formComplete(s)) return;
    let vivo = true;
    (async () => {
      try {
        const p = await generateOracleAsync(s, 0);
        if (!vivo) return;
        setProfile(p);
        if (!s.overrides) {
          setOverrides({
            dominantElement: p.dominantElement, secondaryElement: p.secondaryElement,
            dominantRole: p.dominantRole, dominantAlignment: p.dominantAlignment, dominantRealm: p.dominantRealm,
          });
        }
        if (s.seed !== undefined) {
          const c = await generateOracleAsync(s, s.seed, s.overrides);
          if (vivo) setCreature(c);
        }
      } catch {
        // leitura irrecuperável: fica o formulário, como antes
      } finally {
        if (vivo) setRestaurando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (restaurando) return;
    const form: SavedOracleForm = {
      fullName, birthDate, birthTime, birthPlace,
      preferences: prefs, petDescription,
      soulProfile,
      testAnswers: answers, city: birthCity, timeUnknown,
      seed: creature?.seed,
      overrides: profile ? overrides : undefined,
    };
    // Rascunho do formulário: conveniência, não progresso.
    writeJson(STORAGE_KEYS.ORACLE_FORM, form, { silent: true });
  }, [restaurando, fullName, birthDate, birthTime, birthPlace, answers, birthCity, timeUnknown, soulProfile, prefs, petDescription, creature?.seed, overrides, profile]);

  const canReveal = fullName.trim().length >= 3 && !!birthDate && !!birthCity
    && (timeUnknown || !!birthTime) && testComplete(answers) && !revealing;

  /* Segunda barreira (a primeira é a poda em `loadSavedForm`): aqui o gate
     pega o estado VIVO, caso alguém reative um campo no JSX e esqueça deste
     caminho. */
  const input = (soul = soulProfile): OracleInput => {
    // `alignment` (Tipo) NÃO entrou na lista do dono e continua valendo.
    const prefsAtivas: OraclePreferences = DIRECT_CONTROLS_ENABLED
      ? prefs
      : (prefs.alignment ? { alignment: prefs.alignment } : {});
    return {
      fullName: fullName.trim(), birthDate, birthTime, birthPlace: birthPlace.trim(),
      preferences: (prefsAtivas.element || prefsAtivas.realm || prefsAtivas.alignment) ? prefsAtivas : undefined,
      petDescription: DIRECT_CONTROLS_ENABLED ? (petDescription.trim() || undefined) : undefined,
      soulProfile: soul,
    };
  };

  const handleReveal = async () => {
    if (!canReveal || !birthCity) {
      toast.error(isPt ? 'Preencha todos os campos!' : 'Fill in all fields!');
      return;
    }
    setRevealing(true);
    // Import dinâmico: o motor puxa a engine de efemérides e não deve pesar no
    // bundle inicial de quem nunca abre esta página.
    let soul: SoulProfile;
    try {
      const { buildSoulProfile } = await import('../utils/soulProfile');
      soul = buildSoulProfile({
        fullName: fullName.trim(), birthDate, birthTime, timeUnknown,
        placeLabel: birthPlace,
        latitude: birthCity.latitude, longitude: birthCity.longitude, timeZone: birthCity.timeZone,
      }, answers);
    } catch {
      setRevealing(false);
      toast.error(isPt ? 'Não consegui calcular seu mapa agora.' : "Couldn't compute your chart right now.");
      return;
    }
    setSoulProfile(soul);
    setRevealing(false);
    const p = await generateOracleAsync(input(soul), 0);
    setProfile(p);
    setOverrides({
      dominantElement: p.dominantElement, secondaryElement: p.secondaryElement,
      dominantRole: p.dominantRole, dominantAlignment: p.dominantAlignment, dominantRealm: p.dominantRealm,
    });
    setCreature(null);
  };

  const setOverride = <K extends keyof OracleOverrides>(key: K, value: OracleOverrides[K]) => {
    setOverrides(prev => {
      const next = { ...prev, [key]: value };
      // Secundário não pode ser igual ao dominante
      if (next.secondaryElement === next.dominantElement) {
        next.secondaryElement = ELEMENT_ORDER.find(e => e !== next.dominantElement);
      }
      return next;
    });
    setCreature(null); // valores mudaram → precisa gerar de novo
  };

  const handleGenerateCreature = async () => {
    // Salt novo a cada clique (variação criativa); eixos vêm dos ajustes
    setCreature(await generateOracleAsync(input(), undefined, overrides));
  };

  const copyText = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(okMsg);
    } catch {
      toast.error(isPt ? 'Não consegui copiar' : 'Could not copy');
    }
  };

  const copyAllPrompts = () => {
    if (!creature) return;
    const header = `# ${creature.creature.baseName}\n${L(creature.creature.bio)}\n`;
    const all = creature.creature.stages
      // Os dois prompts: o principal (com referências) e o de reserva, para
      // quem for gerar à mão ter o mesmo fallback que o servidor usa.
      .map(s => `## ${s.name} (${L(s.stageName)})\n${s.imagePrompt}\n\n### ${isPt ? 'Sem referências (reserva)' : 'No references (fallback)'}\n${s.imagePromptFallback}`)
      .join('\n\n');
    copyText(`${header}\n${all}`, isPt ? 'Todos os prompts copiados!' : 'All prompts copied!');
  };

  // --- Geração automática das imagens (via IA + Pixelador) ---
  const [genSprites, setGenSprites] = useState<Record<string, string>>({});
  const [genBusy, setGenBusy] = useState(false);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0 });
  // Modo debug: o botão "Gerar imagens" NUNCA chama /api/generate-sprite
  // (Higgsfield/Gemini, dinheiro de verdade + cota diária de _aiGuard.js) —
  // só entrega os prompts, igual ao botão "Prompts" já fazia. Serve pra
  // iterar em nome/ficha/prompt sem gastar a cota de 20/dia por conta nem a
  // global de 400/dia (AI_LIMITS.sprite em functions/api/_aiGuard.js).
  const [debugMode, setDebugMode] = useState(initialDebugMode);

  const stageKey = (s: OracleResult['creature']['stages'][number]) => `${s.stage}-${s.branch ?? 'base'}`;

  const handleGenerateImages = async () => {
    if (!creature || genBusy) return;
    if (debugMode) {
      // Zero chamada de rede — custo R$0 garantido pela ausência da
      // chamada, não por um limite que ainda assim bateria na API.
      copyAllPrompts();
      toast.success(
        isPt
          ? 'Modo debug: nenhuma imagem foi gerada (custo R$0) — prompts copiados.'
          : 'Debug mode: no image was generated ($0 cost) — prompts copied.',
      );
      return;
    }
    setGenBusy(true);
    setGenSprites({});
    setGenProgress({ done: 0, total: creature.creature.stages.length });
    // `formId` vai junto: é ele que liga o teto POR FORMA do servidor
    // (`_aiGuard.js`, `perFormLifetime: 3`). Sem ele, um loop de retentativa
    // numa forma só consome o vitalício de 26 da conta inteira.
    const stages = creature.creature.stages.map(s => ({
      key: stageKey(s),
      prompt: s.imagePrompt,
      promptFallback: s.imagePromptFallback,
      formId: creatureFormId(s),
    }));
    const { sprites, errors } = await generateAllSprites(stages, {
      onProgress: (done, total) => setGenProgress({ done, total }),
    });
    setGenSprites(Object.fromEntries(sprites.map(s => [s.key, s.sprite])));
    setGenBusy(false);
    if (errors.length === stages.length) {
      const first = errors[0]?.message || '';
      toast.error(
        /not configured|503/.test(first)
          ? (isPt ? 'Geração de imagem ainda não configurada no servidor.' : 'Image generation not configured on the server yet.')
          : (isPt ? 'Falha ao gerar imagens.' : 'Failed to generate images.'),
      );
    } else if (errors.length > 0) {
      toast.warning(isPt ? `${errors.length} imagem(ns) falharam.` : `${errors.length} image(s) failed.`);
    } else {
      toast.success(isPt ? 'Imagens geradas!' : 'Images generated!');
    }
  };

  // --- estilos base (inline p/ cores críticas; classes fora do index.css não aplicam)
  /* RODADA 5 — a página estava FORA da UI do app (direção do dono).
     Era um card BRANCO com inputs e botões cinza cravado dentro de um app
     pixel-art escuro: o teste de personalidade, que é o mesmo componente do
     onboarding, aqui renderizava sem nenhuma peça do kit. Agora usa as
     mesmas classes do resto do app (`sm-card`, `sm-px-field`, `sm-px-choice`)
     e os tokens de tema — nada de hex solto, que era justamente o que
     prendia a página no tema claro. */
  const cardCls = 'sm-card p-3';
  const titleCls = 'text-[color:var(--sm-ink)]';
  const mutedCls = 'text-[color:var(--sm-muted)]';
  const inputCls = 'sm-px-field w-full px-2 py-1.5';
  const btnCls = 'sm-btn';
  const btnStyle = {};
  const smallBtnCls = 'sm-btn sm-btn-secondary text-xs px-2 py-1';
  const smallBtnStyle = {};
  const selectCls = 'sm-px-field px-1.5 py-1 text-xs';
  const mono = { fontFamily: 'var(--sm-font-pixel)' } as const;

  const maxElementScore = profile ? Math.max(...ELEMENT_ORDER.map(e => profile.elementScores[e]), 1) : 1;
  const maxRoleScore = profile ? Math.max(...ROLE_ORDER.map(r => profile.roleScores[r]), 1) : 1;
  const maxAlignScore = profile ? Math.max(...ALIGNMENT_ORDER.map(a => profile.alignmentScores[a]), 1) : 1;
  const maxRealmScore = profile ? Math.max(...REALM_ORDER.map(r => profile.realmScores[r]), 1) : 1;

  const adjustLabel = isPt ? 'Ajustar:' : 'Adjust:';

  return (
    <div className="space-y-4" style={mono}>
      {/* Cabeçalho — fica direto sobre o fundo escuro da página, fora dos cards brancos,
          então usa as vars do tema escuro em vez de titleCls/mutedCls (que assumem card branco) */}
      <div>
        <h2 className="text-lg" style={{ color: 'var(--sm-ink)' }}>🔮 {isPt ? 'Oráculo de Criaturas' : 'Creature Oracle'}</h2>
        <p className="text-xs" style={{ color: 'var(--sm-muted)' }}>
          {isPt
            ? '1) Revele a leitura → 2) ajuste o que quiser → 3) gere a criatura e os prompts.'
            : '1) Reveal the reading → 2) adjust anything → 3) generate the creature and prompts.'}
        </p>
      </div>

      {/* Formulário */}
      <div className={cardCls}>
        <div className="space-y-2">
          <div>
            <label className={`block text-xs mb-1 ${mutedCls}`}>
              {isPt ? 'Nome completo' : 'Full name'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={isPt ? 'Ex.: Maria da Silva' : 'E.g.: Jane Doe'}
              className={inputCls}
              style={mono}
            />
          </div>
          {/* `minWidth: 0` nos dois: `flex-1` sozinho não encolhe abaixo do
              min-content, e com a fonte PIXEL (mais larga que a monoespaçada
              anterior) o campo de hora vazava para fora do painel. */}
          <div className="flex gap-2">
            <div className="flex-1" style={{ minWidth: 0 }}>
              <label className={`block text-xs mb-1 ${mutedCls}`}>
                {isPt ? 'Data de nascimento' : 'Birth date'}
              </label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputCls} style={mono} />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <label className={`block text-xs mb-1 ${mutedCls}`}>
                {isPt ? 'Horário' : 'Birth time'}
              </label>
              <input type="time" value={birthTime} disabled={timeUnknown}
                onChange={e => { setBirthTime(e.target.value); setSoulProfile(undefined); }}
                className={inputCls} style={{ ...mono, opacity: timeUnknown ? 0.5 : 1 }} />
            </div>
          </div>
          <label className={`flex items-center gap-2 text-xs ${mutedCls}`}>
            <input type="checkbox" checked={timeUnknown}
              onChange={e => { setTimeUnknown(e.target.checked); setSoulProfile(undefined); }} />
            {isPt
              ? 'Não sei a hora — o mapa fica sem Ascendente e sem casas'
              : "I don't know the time — the chart goes without Ascendant and houses"}
          </label>
          <div>
            <label className={`block text-xs mb-1 ${mutedCls}`}>
              {isPt ? 'Cidade de nascimento' : 'Birth city'}
            </label>
            {/* Cidade da tabela, não texto livre: o mapa precisa de lat/lon e do
                fuso IANA (que carrega o horário de verão histórico). */}
            <CityPicker
              value={birthCity}
              onChange={c => { setBirthCity(c); setSoulProfile(undefined); }}
              isPt={isPt}
              /* Classes do kit, iguais às do onboarding: sem elas este campo
                 ficava BRANCO no meio da página escura (o `#fff` inline abaixo
                 é que prendia). Cor e moldura vêm do kit; aqui só layout. */
              inputClass="sm-px-field"
              optionClass="sm-px-choice"
              inputStyle={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', fontFamily: 'var(--sm-font-pixel)', fontSize: 13 }}
              optionStyle={() => ({
                width: '100%', boxSizing: 'border-box', fontSize: 12,
                padding: '7px 9px', marginBottom: 5,
              })}
            />
          </div>

          {/* Teste de personalidade — 20 itens (obrigatório: é a base da leitura) */}
          <div className="pt-2">
            <p className={`text-xs mb-2 ${titleCls}`}>
              🧠 {isPt ? 'Teste de personalidade' : 'Personality test'}
              <span className={mutedCls}>
                {' '}— {isPt
                  ? `${Object.keys(answers).length}/${SOUL_TEST_ITEMS.length} respondidos · Big Five + Honestidade-Humildade`
                  : `${Object.keys(answers).length}/${SOUL_TEST_ITEMS.length} answered · Big Five + Honesty-Humility`}
              </span>
            </p>
            <div className="space-y-3">
              {SOUL_TEST_ITEMS.map(item => (
                <div key={item.id}>
                  <p className={`text-xs mb-1 ${mutedCls}`}>{L(itemPrompt(item))}</p>
                  <SoulTestItem
                    item={item}
                    answer={answers[item.id]}
                    isPt={isPt}
                    /* Mesma classe do kit que o ONBOARDING passa: o teste é o
                       mesmo componente nos dois lugares e agora tem a mesma
                       cara. Cor/borda/estado selecionado vêm de `.sm-px-choice`
                       (tokens de tema) — aqui fica só o layout. */
                    optionClass="sm-px-choice"
                    optionStyle={() => ({
                      width: '100%', boxSizing: 'border-box',
                      fontSize: 12, padding: '7px 9px', marginBottom: 5,
                    })}
                    onAnswer={answer => {
                      setAnswers(prev => ({ ...prev, [item.id]: answer }));
                      // Resposta nova invalida a leitura E a criatura: o perfil
                      // inteiro é recalculado no próximo "Revelar".
                      setSoulProfile(undefined);
                      setCreature(null);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preferências diretas (opcionais — 25% de peso) */}
          <div className="pt-2">
            <p className={`text-xs mb-1 ${titleCls}`}>
              ⭐ {isPt ? 'Preferências diretas' : 'Direct preferences'}
              <span className={mutedCls}> — {isPt ? 'opcional, 25% de peso' : 'optional, 25% weight'}</span>
              {/* Sem esta nota o bloco mente por omissão: o título continua no
                  plural e sobrou UM controle, então quem abrir a página vai
                  procurar elemento/bioma achando que sumiram por bug. */}
              {!DIRECT_CONTROLS_ENABLED && (
                <span className={`block ${mutedCls}`}>
                  {isPt
                    ? 'Elemento, bioma e descrição livre estão desligados — a criatura vem da leitura.'
                    : 'Element, biome and free description are off — the creature comes from the reading.'}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DIRECT_CONTROLS_ENABLED && <select
                className={selectCls}
                style={mono}
                value={prefs.element ?? ''}
                onChange={e => { setPrefs(p => ({ ...p, element: (e.target.value || undefined) as ElementId | undefined })); setCreature(null); }}
              >
                <option value="">{isPt ? '✨ Elemento: astros decidem' : '✨ Element: let the stars decide'}</option>
                {ELEMENT_ORDER.map(el => (
                  <option key={el} value={el}>{ELEMENT_INFO[el].emoji} {L(ELEMENT_INFO[el].name)}</option>
                ))}
              </select>}
              <select
                className={selectCls}
                style={mono}
                value={prefs.alignment ?? ''}
                onChange={e => { setPrefs(p => ({ ...p, alignment: (e.target.value || undefined) as AlignmentId | undefined })); setCreature(null); }}
              >
                <option value="">{isPt ? '✨ Tipo: astros decidem' : '✨ Type: let the stars decide'}</option>
                {ALIGNMENT_ORDER.map(al => (
                  <option key={al} value={al}>{ALIGNMENT_INFO[al].emoji} {L(ALIGNMENT_INFO[al].name)} ({L(ALIGNMENT_INFO[al].attribute)})</option>
                ))}
              </select>
              {DIRECT_CONTROLS_ENABLED && <select
                className={selectCls}
                style={mono}
                value={prefs.realm ?? ''}
                onChange={e => { setPrefs(p => ({ ...p, realm: (e.target.value || undefined) as RealmId | undefined })); setCreature(null); }}
              >
                <option value="">{isPt ? '✨ Reino: astros decidem' : '✨ Realm: let the stars decide'}</option>
                {REALM_ORDER.map(realm => (
                  <option key={realm} value={realm}>{REALM_INFO[realm].emoji} {L(REALM_INFO[realm].name)}</option>
                ))}
              </select>}
            </div>
          </div>

          {/* Descrição livre do pet (opcional — 50% de peso) */}
          {DIRECT_CONTROLS_ENABLED && <div className="pt-2">
            <p className={`text-xs mb-1 ${titleCls}`}>
              💭 {isPt ? 'Como você imagina seu pet?' : 'How do you imagine your pet?'}
              <span className={mutedCls}> — {isPt ? 'opcional, 50% de peso' : 'optional, 50% weight'}</span>
            </p>
            <textarea
              value={petDescription}
              onChange={e => { setPetDescription(e.target.value); setCreature(null); }}
              placeholder={isPt
                ? 'Ex.: um lobo de gelo protetor, calmo, com olhos azuis...'
                : 'E.g.: a protective ice wolf, calm, with blue eyes...'}
              maxLength={300}
              rows={2}
              className={inputCls}
              style={{ ...mono, resize: 'vertical' }}
            />
            <p className={`text-[10px] ${mutedCls}`}>
              {isPt
                ? 'Deixe em branco para 100% leitura (nome, nascimento e respostas).'
                : 'Leave empty for 100% reading (name, birth and answers).'}
            </p>
          </div>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReveal}
              className={`flex-1 ${btnCls}`}
              style={{ ...mono, ...btnStyle, opacity: canReveal ? 1 : 0.5 }}
              disabled={!canReveal}
            >
              {profile ? (isPt ? '🔮 Refazer leitura' : '🔮 Redo reading') : (isPt ? '✨ Revelar leitura' : '✨ Reveal reading')}
            </button>
          </div>
          {!canReveal && (
            <p className={`text-[10px] ${mutedCls}`}>
              {isPt ? 'Preencha os dados e responda todas as perguntas.' : 'Fill in your data and answer all questions.'}
            </p>
          )}
        </div>
      </div>

      {profile && (
        <>
          {/* Perfil psicométrico — a ÚNICA camada da leitura com evidência
              empírica, e por isso a primeira. Astrologia e numerologia vêm
              depois, declaradas como o que são: geradores simbólicos. */}
          {soulProfile && (
            <div className={cardCls}>
              <h3 className={`mb-2 ${titleCls}`}>🧠 {isPt ? 'Perfil psicométrico' : 'Psychometric profile'}</h3>
              <div className="space-y-1.5">
                {TRAIT_DIMENSIONS.map(dim => {
                  const trait = soulProfile.psychometric.traits[dim];
                  return (
                    <div key={dim}>
                      <div className="flex justify-between text-xs">
                        <span className={titleCls}>{L(traitLabels[dim].name)}</span>
                        <span className={mutedCls}>{trait.score} — {L(traitLevelLabels[trait.level])}</span>
                      </div>
                      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${trait.score}%`, background: '#0d9488' }} />
                      </div>
                      <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                        {L(traitLabels[dim].low)} ↔ {L(traitLabels[dim].high)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className={`text-xs mt-2 ${titleCls}`}>
                {isPt ? 'Tipo junguiano' : 'Jungian type'}: <strong>{soulProfile.psychometric.jung.code}</strong>
                <span className={mutedCls}>
                  {' '}({JUNG_AXES.map(a => `${L(jungAxisLabels[a].name)} ${soulProfile.psychometric.jung.axes[a].pole}`).join(' · ')})
                </span>
              </p>
              {/* Índices de validade: não medem personalidade, medem se o
                  protocolo PODE ser lido como um resultado de personalidade. */}
              {!soulProfile.psychometric.validity.trustworthy && (
                <div className="mt-2" style={{ color: '#b45309', fontSize: 11 }}>
                  {soulProfile.psychometric.validity.flags.map((f, i) => (
                    <p key={i} style={{ margin: 0 }}>⚠️ {L(f)}</p>
                  ))}
                </div>
              )}
              <p className="text-[10px] mt-2" style={{ color: '#9ca3af' }}>
                {isPt
                  ? '* Teste construído segundo princípios psicométricos, mas NÃO validado: os itens nunca passaram por análise fatorial ou normatização. Não serve para uso clínico nem para decisão sobre ninguém.'
                  : '* Test built according to psychometric principles, but NOT validated: the items never went through factor analysis or norming. Not for clinical use or decisions about anyone.'}
              </p>
            </div>
          )}

          {/* Numerologia */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🔢 {isPt ? 'Numerologia do nome' : 'Name numerology'}</h3>
            <div className="space-y-1.5 text-xs">
              {([
                ['lifePath', isPt ? 'Caminho de vida' : 'Life path', profile.numerology.lifePath],
                ['expression', isPt ? 'Expressão' : 'Expression', profile.numerology.expression],
                ['soulUrge', isPt ? 'Motivação (vogais)' : 'Soul urge (vowels)', profile.numerology.soulUrge],
                ['personality', isPt ? 'Impressão (consoantes)' : 'Personality (consonants)', profile.numerology.personality],
              ] as const).map(([key, label, num]) => (
                <div key={key}>
                  <span className={titleCls}>{label}: <strong>{num}</strong></span>
                  <span className={` ${mutedCls}`}> — {L(profile.numerology.meanings[key])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Astrologia */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🌌 {isPt ? 'Céu de nascimento' : 'Birth sky'}</h3>
            <div className="space-y-1.5 text-xs">
              <div className={titleCls}>
                ☀️ {isPt ? 'Sol em' : 'Sun in'} <strong>{L(profile.western.sun.name)}</strong>
                <span className={mutedCls}> — {L(profile.western.sun.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🌅 {soulProfile?.astrology.bigThree.ascendant
                  ? (isPt ? 'Ascendente em' : 'Ascendant in')
                  : (isPt ? 'Ascendente (aprox.) em' : 'Ascendant (approx.) in')} <strong>{L(profile.western.ascendant.name)}</strong>
                <span className={mutedCls}> — {L(profile.western.ascendant.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🐉 {isPt ? 'Chinês' : 'Chinese'}: <strong>{L(profile.chinese.animal)}</strong> {isPt ? 'de' : 'of'} {L(profile.chinese.element)} ({profile.chinese.yinYang})
                <span className={mutedCls}> — {L(profile.chinese.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🕉️ {isPt ? 'Védico' : 'Vedic'}: <strong>{profile.vedic.rashi}</strong> ({L(profile.vedic.equivalent)})
                <span className={mutedCls}> — {L(profile.vedic.traits[0])}</span>
              </div>
              {soulProfile ? (
                <>
                  {/* Com o motor novo o mapa é REAL: efemérides, Ascendente por
                      fórmula fechada e casas Placidus. O bloco acima (chinês,
                      védico) continua sendo leitura simbólica extra. */}
                  {/* A Lua é o terceiro do "big three" e só o mapa real tem —
                      Sol e Ascendente já aparecem acima. */}
                  <div className={titleCls}>
                    🌙 {isPt ? 'Lua em' : 'Moon in'} <strong>{signLabel(soulProfile.astrology.bigThree.moon, isPt)}</strong>
                  </div>
                  <div className={mutedCls}>
                    {isPt ? 'Casas' : 'Houses'}: {soulProfile.astrology.houseSystem === 'placidus' ? 'Placidus' : (isPt ? 'Signos Inteiros' : 'Whole Sign')}
                    {' · '}{soulProfile.astrology.aspects.length} {isPt ? 'aspectos' : 'aspects'}
                    {' · '}{soulProfile.onboarding.timeZone}
                  </div>
                  {soulProfile.astrology.warnings.map((w, i) => (
                    <p key={i} className="text-[10px]" style={{ color: '#b45309' }}>⚠️ {L(w)}</p>
                  ))}
                  <p className={`text-[10px] ${mutedCls}`}>
                    {isPt
                      ? '* Posições geocêntricas reais (VSOP87/ELP) na eclíptica verdadeira da data. O cálculo é verificável; a interpretação astrológica não tem validade preditiva demonstrada.'
                      : '* Real geocentric positions (VSOP87/ELP) on the true ecliptic of date. The computation is verifiable; the astrological interpretation has no demonstrated predictive validity.'}
                  </p>
                </>
              ) : (
                <p className={`text-[10px] ${mutedCls}`}>
                  {isPt
                    ? '* Ascendente estimado pela hora (método solar simplificado), não substitui um mapa astral completo.'
                    : '* Ascendant estimated from birth time (simplified solar method), not a full birth chart.'}
                </p>
              )}
            </div>
          </div>

          {/* Elementos */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🧪 {isPt ? 'Elementos' : 'Elements'}</h3>
            <div className="space-y-1">
              {[...ELEMENT_ORDER]
                .sort((a, b) => profile.elementScores[b] - profile.elementScores[a])
                .map(el => {
                  const info = ELEMENT_INFO[el];
                  const score = profile.elementScores[el];
                  const isTop = el === overrides.dominantElement;
                  return (
                    <div key={el} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center">{info.emoji}</span>
                      <span className={`w-20 ${isTop ? titleCls : mutedCls}`} style={isTop ? { fontWeight: 700 } : undefined}>
                        {L(info.name)}
                      </span>
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxElementScore) * 100}%`,
                            background: isTop ? '#0d9488' : '#99f6e4',
                          }}
                        />
                      </div>
                      <span className={`w-6 text-right ${isTop ? titleCls : mutedCls}`}>{score}</span>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className={mutedCls}>✏️ {adjustLabel}</span>
              <select
                className={selectCls}
                style={mono}
                value={overrides.dominantElement}
                onChange={e => setOverride('dominantElement', e.target.value as ElementId)}
              >
                {ELEMENT_ORDER.map(el => (
                  <option key={el} value={el}>{ELEMENT_INFO[el].emoji} {L(ELEMENT_INFO[el].name)}</option>
                ))}
              </select>
              <span className={mutedCls}>+</span>
              <select
                className={selectCls}
                style={mono}
                value={overrides.secondaryElement ?? ''}
                onChange={e => setOverride('secondaryElement', (e.target.value || null) as ElementId | null)}
              >
                <option value="">{isPt ? '— único (sem 2º) —' : '— single (no 2nd) —'}</option>
                {ELEMENT_ORDER.filter(el => el !== overrides.dominantElement).map(el => (
                  <option key={el} value={el}>{ELEMENT_INFO[el].emoji} {L(ELEMENT_INFO[el].name)}</option>
                ))}
              </select>
            </div>
            <p className={`text-xs mt-2 ${titleCls}`}>
              {overrides.dominantElement && (
                <>
                  {ELEMENT_INFO[overrides.dominantElement].emoji} <strong>{L(ELEMENT_INFO[overrides.dominantElement].name)}</strong>
                  {overrides.secondaryElement
                    ? <> + {ELEMENT_INFO[overrides.secondaryElement].emoji} {L(ELEMENT_INFO[overrides.secondaryElement].name)}</>
                    : <span className={mutedCls}> ({isPt ? 'elemento único' : 'single element'})</span>}
                </>
              )}
            </p>
            <p className={`text-xs ${mutedCls}`}>
              {overrides.dominantElement ? L(ELEMENT_INFO[overrides.dominantElement].personality) : ''}
            </p>
          </div>

          {/* Funções */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🎯 {isPt ? 'Função' : 'Role'}</h3>
            <div className="space-y-1">
              {[...ROLE_ORDER]
                .sort((a, b) => profile.roleScores[b] - profile.roleScores[a])
                .map(role => {
                  const info = ROLE_INFO[role];
                  const score = profile.roleScores[role];
                  const isTop = role === overrides.dominantRole;
                  return (
                    <div key={role} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center">{info.emoji}</span>
                      <span className={`w-28 ${isTop ? titleCls : mutedCls}`} style={isTop ? { fontWeight: 700 } : undefined}>
                        {L(info.name)}
                      </span>
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxRoleScore) * 100}%`,
                            background: isTop ? '#7c3aed' : '#ddd6fe',
                          }}
                        />
                      </div>
                      <span className={`w-6 text-right ${isTop ? titleCls : mutedCls}`}>{score}</span>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className={mutedCls}>✏️ {adjustLabel}</span>
              <select
                className={selectCls}
                style={mono}
                value={overrides.dominantRole}
                onChange={e => setOverride('dominantRole', e.target.value as RoleId)}
              >
                {ROLE_ORDER.map(role => (
                  <option key={role} value={role}>{ROLE_INFO[role].emoji} {L(ROLE_INFO[role].name)}</option>
                ))}
              </select>
            </div>
            <p className={`text-xs mt-2 ${mutedCls}`}>
              {overrides.dominantRole ? L(ROLE_INFO[overrides.dominantRole].profile) : ''}
            </p>
          </div>

          {/* Alinhamento */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>⚖️ {isPt ? 'Alinhamento' : 'Alignment'}</h3>
            <div className="space-y-1">
              {[...ALIGNMENT_ORDER]
                .sort((a, b) => profile.alignmentScores[b] - profile.alignmentScores[a])
                .map(al => {
                  const info = ALIGNMENT_INFO[al];
                  const score = profile.alignmentScores[al];
                  const isTop = al === overrides.dominantAlignment;
                  return (
                    <div key={al} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center">{info.emoji}</span>
                      <span className={`w-28 ${isTop ? titleCls : mutedCls}`} style={isTop ? { fontWeight: 700 } : undefined}>
                        {L(info.name)}
                      </span>
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxAlignScore) * 100}%`,
                            background: isTop ? '#d97706' : '#fde68a',
                          }}
                        />
                      </div>
                      <span className={`w-6 text-right ${isTop ? titleCls : mutedCls}`}>{score}</span>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className={mutedCls}>✏️ {adjustLabel}</span>
              <select
                className={selectCls}
                style={mono}
                value={overrides.dominantAlignment}
                onChange={e => setOverride('dominantAlignment', e.target.value as AlignmentId)}
              >
                {ALIGNMENT_ORDER.map(al => (
                  <option key={al} value={al}>
                    {ALIGNMENT_INFO[al].emoji} {L(ALIGNMENT_INFO[al].name)} ({L(ALIGNMENT_INFO[al].attribute)})
                  </option>
                ))}
              </select>
            </div>
            {overrides.dominantAlignment && (
              <>
                <p className={`text-xs mt-2 ${titleCls}`}>
                  {ALIGNMENT_INFO[overrides.dominantAlignment].emoji}{' '}
                  <strong>{L(ALIGNMENT_INFO[overrides.dominantAlignment].name)}</strong>
                  {' ≈ '}
                  {isPt ? 'atributo' : 'attribute'}{' '}
                  <strong>{L(ALIGNMENT_INFO[overrides.dominantAlignment].attribute)}</strong>{' '}
                  {ATTRIBUTE_EMOJI[overrides.dominantAlignment]}
                </p>
                <p className={`text-xs ${mutedCls}`}>{L(ALIGNMENT_INFO[overrides.dominantAlignment].profile)}</p>
              </>
            )}
          </div>

          {/* Reino */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🗺️ {isPt ? 'Reino de origem' : 'Home realm'}</h3>
            <div className="space-y-1">
              {[...REALM_ORDER]
                .sort((a, b) => profile.realmScores[b] - profile.realmScores[a])
                .slice(0, 4)
                .map(realm => {
                  const info = REALM_INFO[realm];
                  const score = profile.realmScores[realm];
                  const isTop = realm === overrides.dominantRealm;
                  return (
                    <div key={realm} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center">{info.emoji}</span>
                      <span className={`w-36 ${isTop ? titleCls : mutedCls}`} style={isTop ? { fontWeight: 700 } : undefined}>
                        {L(info.name)}
                      </span>
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxRealmScore) * 100}%`,
                            background: isTop ? '#059669' : '#a7f3d0',
                          }}
                        />
                      </div>
                      <span className={`w-6 text-right ${isTop ? titleCls : mutedCls}`}>{score}</span>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className={mutedCls}>✏️ {adjustLabel}</span>
              <select
                className={selectCls}
                style={mono}
                value={overrides.dominantRealm}
                onChange={e => setOverride('dominantRealm', e.target.value as RealmId)}
              >
                {REALM_ORDER.map(realm => (
                  <option key={realm} value={realm}>{REALM_INFO[realm].emoji} {L(REALM_INFO[realm].name)}</option>
                ))}
              </select>
            </div>
            <p className={`text-xs mt-2 ${mutedCls}`}>
              {overrides.dominantRealm ? L(REALM_INFO[overrides.dominantRealm].description) : ''}
            </p>
          </div>

          {/* Botão: gerar criatura */}
          <button
            onClick={handleGenerateCreature}
            className={`w-full ${btnCls}`}
            style={{ ...mono, ...btnStyle }}
          >
            {creature
              ? (isPt ? '🎲 Gerar outra variação' : '🎲 Generate another variation')
              : (isPt ? '👾 Gerar criatura e prompts' : '👾 Generate creature and prompts')}
          </button>
          {!creature && (
            <p className="text-[10px] -mt-2" style={{ color: 'var(--sm-muted)' }}>
              {isPt
                ? 'Os prompts de imagem só aparecem depois de gerar. Ajustou algum valor? Ele será respeitado.'
                : 'Image prompts only appear after generating. Adjusted a value? It will be respected.'}
            </p>
          )}
        </>
      )}

      {profile && creature && (
        <>
          {/* Personalidade + Arquétipo */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🧬 {isPt ? 'Arquétipo' : 'Archetype'}</h3>
            <p className={`text-sm mb-2 ${titleCls}`} style={{ fontWeight: 700 }}>
              “{L(creature.archetype.phrase)}”
            </p>
            <p className={`text-xs ${mutedCls}`}>{L(creature.personalitySummary)}</p>
          </div>

          {/* Criatura */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h3 className={titleCls}>👾 {creature.creature.baseName}</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <label
                  className={`text-[10px] flex items-center gap-1 ${mutedCls}`}
                  title={isPt
                    ? 'Com o modo debug ligado, "Gerar imagens" nunca chama a API paga — só copia os prompts.'
                    : 'With debug mode on, "Generate images" never calls the paid API — it just copies the prompts.'}
                >
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={e => setDebugMode(e.target.checked)}
                  />
                  🐛 {isPt ? 'Modo debug (custo R$0)' : 'Debug mode ($0 cost)'}
                </label>
                <button
                  onClick={handleGenerateImages}
                  disabled={genBusy}
                  className={smallBtnCls}
                  style={{ ...mono, ...smallBtnStyle, opacity: genBusy ? 0.5 : 1 }}
                >
                  {genBusy
                    ? `⏳ ${genProgress.done}/${genProgress.total}`
                    : debugMode
                      ? `📋 ${isPt ? 'Gerar (debug)' : 'Generate (debug)'}`
                      : `🎨 ${isPt ? 'Gerar imagens' : 'Generate images'}`}
                </button>
                <button onClick={copyAllPrompts} className={smallBtnCls} style={{ ...mono, ...smallBtnStyle }}>
                  📋 {isPt ? 'Prompts' : 'Prompts'}
                </button>
              </div>
            </div>
            <p className={`text-xs mb-1 ${mutedCls}`}>{L(creature.creature.concept)}</p>
            {(() => {
              const f = creature.creature.family;
              return (
                <p className={`text-xs mb-1 ${titleCls}`}>
                  🧬 {isPt ? 'Família' : 'Family'}: <strong>{L(f.primary.family)}</strong> ({L(f.primary.subfamily)})
                  {!f.mono && (
                    f.secondary.isObject
                      ? <> + 🗡️ {isPt ? 'objeto' : 'object'} <strong>{L(f.secondary.subfamily)}</strong></>
                      : <> + <strong>{L(f.secondary.family)}</strong> ({L(f.secondary.subfamily)})</>
                  )}
                </p>
              );
            })()}
            <p className={`text-xs mb-2 ${titleCls}`} style={{ fontStyle: 'italic' }}>
              “{L(creature.creature.bio)}”
            </p>
            <p className={`text-[10px] mb-3 ${mutedCls}`}>
              {isPt ? 'Semente' : 'Seed'}: {creature.seed}
            </p>

            <div className="space-y-3">
              {creature.creature.stages.map(stage => (
                <div
                  key={`${stage.stage}-${stage.branch ?? 'base'}`}
                  className="rounded-lg p-2"
                  style={{ border: '1px dashed #c0c0c0' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${titleCls} flex items-center gap-2`} style={{ fontWeight: 700 }}>
                      {genSprites[stageKey(stage)] && (
                        <img
                          src={genSprites[stageKey(stage)]}
                          alt={stage.name}
                          style={{ width: 40, height: 40, imageRendering: 'pixelated', borderRadius: 6, flexShrink: 0 }}
                        />
                      )}
                      <span>
                        {{ rookie: '🐤', champion: '🐉', perfeito: '⚡', mega: '🌟', ultra: '👑' }[stage.stage]}{' '}
                        {L(stage.stageName)}
                        {stage.branch && (
                          <> {ATTRIBUTE_EMOJI[stage.branch]} {L(ALIGNMENT_INFO[stage.branch].attribute)}</>
                        )}
                        {' — '}{stage.name}
                      </span>
                    </span>
                    <button
                      onClick={() => copyText(stage.imagePrompt, isPt ? 'Prompt copiado!' : 'Prompt copied!')}
                      className={smallBtnCls}
                      style={{ ...mono, ...smallBtnStyle, flexShrink: 0 }}
                    >
                      📋 Prompt
                    </button>
                  </div>
                  <p className={`text-xs mt-1 ${mutedCls}`}>{L(stage.description)}</p>
                  <details className="mt-1">
                    <summary className={`text-[10px] cursor-pointer ${mutedCls}`}>
                      {isPt ? 'Ver prompt de imagem (EN)' : 'View image prompt (EN)'}
                    </summary>
                    <p
                      className={`text-[10px] mt-1 ${mutedCls}`}
                      style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                    >
                      {stage.imagePrompt}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pixelador — converte a imagem gerada pela IA em sprite v-pet real */}
      <PixelizerCard language={language} />
    </div>
  );
}
