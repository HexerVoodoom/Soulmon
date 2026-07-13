import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { PixelizerCard } from './PixelizerCard';
import {
  generateOracle, ELEMENT_INFO, ROLE_INFO, ELEMENT_ORDER, ROLE_ORDER,
  ALIGNMENT_INFO, REALM_INFO, ALIGNMENT_ORDER, REALM_ORDER, ORACLE_QUESTIONS,
  type OracleInput, type OracleResult, type OracleOverrides, type OraclePreferences, type LText,
  type ElementId, type RoleId, type AlignmentId, type RealmId,
} from '../utils/oracle';

interface OraclePageProps {
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

interface SavedOracleForm extends OracleInput {
  seed?: number;
  overrides?: OracleOverrides;
}

function allQuestionsAnswered(answers: Record<string, string>): boolean {
  return ORACLE_QUESTIONS.every(q => !!answers[q.id]);
}

const ATTRIBUTE_EMOJI: Record<AlignmentId, string> = { poder: '🦠', harmonia: '💾', benevolencia: '💉' };

function loadSavedForm(): SavedOracleForm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORACLE_FORM);
    return raw ? (JSON.parse(raw) as SavedOracleForm) : null;
  } catch {
    return null;
  }
}

function formComplete(f: SavedOracleForm | null): f is SavedOracleForm {
  return !!f && f.fullName.trim().length >= 3 && !!f.birthDate && !!f.birthTime && f.birthPlace.trim().length >= 2
    && allQuestionsAnswered(f.answers ?? {});
}

export function OraclePage({ theme = 'default', language = 'en-US' }: OraclePageProps) {
  const isPt = language === 'pt-BR';
  const isGlitch = theme === 'glitch';
  const isWin98 = theme === 'win98';
  const L = (t: LText) => (isPt ? t.pt : t.en);

  const saved = loadSavedForm();
  const [fullName, setFullName] = useState(saved?.fullName ?? '');
  const [birthDate, setBirthDate] = useState(saved?.birthDate ?? '');
  const [birthTime, setBirthTime] = useState(saved?.birthTime ?? '12:00');
  const [birthPlace, setBirthPlace] = useState(saved?.birthPlace ?? '');
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [prefs, setPrefs] = useState<OraclePreferences>(saved?.preferences ?? {});
  const [petDescription, setPetDescription] = useState(saved?.petDescription ?? '');

  // Etapa 1: leitura (perfil místico + eixos, tudo ajustável)
  const [profile, setProfile] = useState<OracleResult | null>(() => {
    const s = loadSavedForm();
    if (!formComplete(s)) return null;
    try { return generateOracle(s, 0); } catch { return null; }
  });
  const [overrides, setOverrides] = useState<OracleOverrides>(() => {
    const s = loadSavedForm();
    if (s?.overrides) return s.overrides;
    if (!formComplete(s)) return {};
    try {
      const p = generateOracle(s, 0);
      return {
        dominantElement: p.dominantElement, secondaryElement: p.secondaryElement,
        dominantRole: p.dominantRole, dominantAlignment: p.dominantAlignment, dominantRealm: p.dominantRealm,
      };
    } catch { return {}; }
  });

  // Etapa 2: criatura + prompts (só depois de clicar em "Gerar")
  const [creature, setCreature] = useState<OracleResult | null>(() => {
    const s = loadSavedForm();
    if (!formComplete(s) || s.seed === undefined) return null;
    try { return generateOracle(s, s.seed, s.overrides); } catch { return null; }
  });

  useEffect(() => {
    const form: SavedOracleForm = {
      fullName, birthDate, birthTime, birthPlace,
      answers, preferences: prefs, petDescription,
      seed: creature?.seed,
      overrides: profile ? overrides : undefined,
    };
    localStorage.setItem(STORAGE_KEYS.ORACLE_FORM, JSON.stringify(form));
  }, [fullName, birthDate, birthTime, birthPlace, answers, prefs, petDescription, creature?.seed, overrides, profile]);

  const canReveal = formComplete({ fullName, birthDate, birthTime, birthPlace, answers });

  const input = (): OracleInput => ({
    fullName: fullName.trim(), birthDate, birthTime, birthPlace: birthPlace.trim(),
    answers,
    preferences: (prefs.element || prefs.realm || prefs.alignment) ? prefs : undefined,
    petDescription: petDescription.trim() || undefined,
  });

  const handleReveal = () => {
    if (!canReveal) {
      toast.error(isPt ? 'Preencha todos os campos!' : 'Fill in all fields!');
      return;
    }
    const p = generateOracle(input(), 0);
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

  const handleGenerateCreature = () => {
    // Salt novo a cada clique (variação criativa); eixos vêm dos ajustes
    setCreature(generateOracle(input(), undefined, overrides));
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
      .map(s => `## ${s.name} (${L(s.stageName)})\n${s.imagePrompt}`)
      .join('\n\n');
    copyText(`${header}\n${all}`, isPt ? 'Todos os prompts copiados!' : 'All prompts copied!');
  };

  // --- estilos base (inline p/ cores críticas; classes fora do index.css não aplicam)
  const cardCls = isGlitch
    ? 'border border-[#00ffff]/40 bg-black/40 rounded-lg p-3'
    : isWin98
      ? 'win98-panel p-3'
      : 'border border-[#c0c0c0] bg-white rounded-xl p-3';
  const titleCls = isGlitch ? 'text-[#00ffff]' : 'text-gray-900';
  const mutedCls = isGlitch ? 'text-[#00ffff]/60' : 'text-gray-500';
  const inputCls = isGlitch
    ? 'w-full rounded-md border border-[#00ffff]/40 bg-black/60 text-[#00ffff] px-2 py-1.5'
    : isWin98
      ? 'w-full win98-input px-2 py-1.5 text-black'
      : 'w-full rounded-md border border-[#c0c0c0] bg-white text-gray-900 px-2 py-1.5';
  const btnCls = isGlitch
    ? 'px-3 py-2 rounded-md border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff]/10 transition-colors'
    : isWin98
      ? 'win98-button px-3 py-2 text-black'
      : 'px-3 py-2 rounded-md transition-colors';
  const btnStyle = (!isGlitch && !isWin98)
    ? { background: '#0d9488', color: '#ffffff' }
    : {};
  const smallBtnCls = isGlitch
    ? 'text-xs px-2 py-1 rounded border border-[#00ffff]/50 text-[#00ffff] hover:bg-[#00ffff]/10'
    : isWin98
      ? 'win98-button text-xs px-2 py-1 text-black'
      : 'text-xs px-2 py-1 rounded';
  const smallBtnStyle = (!isGlitch && !isWin98)
    ? { border: '1px solid #5eead4', color: '#0f766e' }
    : {};
  const selectCls = isGlitch
    ? 'rounded border border-[#00ffff]/40 bg-black/60 text-[#00ffff] px-1.5 py-1 text-xs'
    : isWin98
      ? 'win98-input px-1.5 py-1 text-xs text-black'
      : 'rounded border border-[#c0c0c0] bg-white text-gray-900 px-1.5 py-1 text-xs';
  const mono = { fontFamily: 'monospace' } as const;

  const maxElementScore = profile ? Math.max(...ELEMENT_ORDER.map(e => profile.elementScores[e]), 1) : 1;
  const maxRoleScore = profile ? Math.max(...ROLE_ORDER.map(r => profile.roleScores[r]), 1) : 1;
  const maxAlignScore = profile ? Math.max(...ALIGNMENT_ORDER.map(a => profile.alignmentScores[a]), 1) : 1;
  const maxRealmScore = profile ? Math.max(...REALM_ORDER.map(r => profile.realmScores[r]), 1) : 1;

  const adjustLabel = isPt ? 'Ajustar:' : 'Adjust:';

  return (
    <div className="space-y-4" style={mono}>
      {/* Cabeçalho */}
      <div>
        <h2 className={`text-lg ${titleCls}`}>🔮 {isPt ? 'Oráculo de Criaturas' : 'Creature Oracle'}</h2>
        <p className={`text-xs ${mutedCls}`}>
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
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`block text-xs mb-1 ${mutedCls}`}>
                {isPt ? 'Data de nascimento' : 'Birth date'}
              </label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputCls} style={mono} />
            </div>
            <div className="flex-1">
              <label className={`block text-xs mb-1 ${mutedCls}`}>
                {isPt ? 'Horário' : 'Birth time'}
              </label>
              <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} className={inputCls} style={mono} />
            </div>
          </div>
          <div>
            <label className={`block text-xs mb-1 ${mutedCls}`}>
              {isPt ? 'Local de nascimento' : 'Birth place'}
            </label>
            <input
              type="text"
              value={birthPlace}
              onChange={e => setBirthPlace(e.target.value)}
              placeholder={isPt ? 'Ex.: São Paulo, Brasil' : 'E.g.: London, UK'}
              className={inputCls}
              style={mono}
            />
          </div>

          {/* Quiz de personalidade (obrigatório — soma na leitura) */}
          <div className="pt-2">
            <p className={`text-xs mb-2 ${titleCls}`}>
              🧠 {isPt ? 'Sobre você' : 'About you'}
              <span className={mutedCls}> — {isPt ? 'suas respostas entram na leitura' : 'your answers feed the reading'}</span>
            </p>
            <div className="space-y-3">
              {ORACLE_QUESTIONS.map(q => (
                <div key={q.id}>
                  <p className={`text-xs mb-1 ${mutedCls}`}>{L(q.text)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map(opt => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setAnswers(prev => ({ ...prev, [q.id]: opt.id }));
                            setCreature(null);
                          }}
                          className="text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{
                            ...mono,
                            border: selected
                              ? (isGlitch ? '1px solid #00ffff' : '1px solid #0d9488')
                              : (isGlitch ? '1px solid #00ffff44' : '1px solid #c0c0c0'),
                            background: selected ? (isGlitch ? '#00ffff22' : '#ccfbf1') : 'transparent',
                            color: isGlitch ? '#00ffff' : (selected ? '#0f766e' : '#6b7280'),
                          }}
                        >
                          {L(opt.text)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferências diretas (opcionais — 25% de peso) */}
          <div className="pt-2">
            <p className={`text-xs mb-1 ${titleCls}`}>
              ⭐ {isPt ? 'Preferências diretas' : 'Direct preferences'}
              <span className={mutedCls}> — {isPt ? 'opcional, 25% de peso' : 'optional, 25% weight'}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <select
                className={selectCls}
                style={mono}
                value={prefs.element ?? ''}
                onChange={e => { setPrefs(p => ({ ...p, element: (e.target.value || undefined) as ElementId | undefined })); setCreature(null); }}
              >
                <option value="">{isPt ? '✨ Elemento: astros decidem' : '✨ Element: let the stars decide'}</option>
                {ELEMENT_ORDER.map(el => (
                  <option key={el} value={el}>{ELEMENT_INFO[el].emoji} {L(ELEMENT_INFO[el].name)}</option>
                ))}
              </select>
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
              <select
                className={selectCls}
                style={mono}
                value={prefs.realm ?? ''}
                onChange={e => { setPrefs(p => ({ ...p, realm: (e.target.value || undefined) as RealmId | undefined })); setCreature(null); }}
              >
                <option value="">{isPt ? '✨ Reino: astros decidem' : '✨ Realm: let the stars decide'}</option>
                {REALM_ORDER.map(realm => (
                  <option key={realm} value={realm}>{REALM_INFO[realm].emoji} {L(REALM_INFO[realm].name)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição livre do pet (opcional — 50% de peso) */}
          <div className="pt-2">
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
          </div>

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
                🌅 {isPt ? 'Ascendente (aprox.) em' : 'Ascendant (approx.) in'} <strong>{L(profile.western.ascendant.name)}</strong>
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
              <p className={`text-[10px] ${mutedCls}`}>
                {isPt
                  ? '* Ascendente estimado pela hora (método solar simplificado), não substitui um mapa astral completo.'
                  : '* Ascendant estimated from birth time (simplified solar method), not a full birth chart.'}
              </p>
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
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: isGlitch ? '#0a2a2a' : '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxElementScore) * 100}%`,
                            background: isTop ? (isGlitch ? '#00ffff' : '#0d9488') : (isGlitch ? '#00ffff55' : '#99f6e4'),
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
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: isGlitch ? '#0a2a2a' : '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxRoleScore) * 100}%`,
                            background: isTop ? (isGlitch ? '#ff00ff' : '#7c3aed') : (isGlitch ? '#ff00ff55' : '#ddd6fe'),
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
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: isGlitch ? '#0a2a2a' : '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxAlignScore) * 100}%`,
                            background: isTop ? (isGlitch ? '#ffcc00' : '#d97706') : (isGlitch ? '#ffcc0055' : '#fde68a'),
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
                      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: isGlitch ? '#0a2a2a' : '#e5e7eb' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(score / maxRealmScore) * 100}%`,
                            background: isTop ? (isGlitch ? '#00ff88' : '#059669') : (isGlitch ? '#00ff8855' : '#a7f3d0'),
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
            <p className={`text-[10px] -mt-2 ${mutedCls}`}>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className={titleCls}>👾 {creature.creature.baseName}</h3>
              <button onClick={copyAllPrompts} className={smallBtnCls} style={{ ...mono, ...smallBtnStyle }}>
                📋 {isPt ? 'Copiar todos os prompts' : 'Copy all prompts'}
              </button>
            </div>
            <p className={`text-xs mb-1 ${mutedCls}`}>{L(creature.creature.concept)}</p>
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
                  style={{ border: isGlitch ? '1px dashed #00ffff66' : '1px dashed #c0c0c0' }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${titleCls}`} style={{ fontWeight: 700 }}>
                      {{ rookie: '🐤', champion: '🐉', perfeito: '⚡', mega: '🌟', ultra: '👑' }[stage.stage]}{' '}
                      {L(stage.stageName)}
                      {stage.branch && (
                        <> {ATTRIBUTE_EMOJI[stage.branch]} {L(ALIGNMENT_INFO[stage.branch].attribute)}</>
                      )}
                      {' — '}{stage.name}
                    </span>
                    <button
                      onClick={() => copyText(stage.imagePrompt, isPt ? 'Prompt copiado!' : 'Prompt copied!')}
                      className={smallBtnCls}
                      style={{ ...mono, ...smallBtnStyle }}
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
      <PixelizerCard theme={theme} language={language} />
    </div>
  );
}
