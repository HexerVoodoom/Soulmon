import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  generateOracle, ELEMENT_INFO, ROLE_INFO, ELEMENT_ORDER, ROLE_ORDER,
  type OracleInput, type OracleResult, type LText,
} from '../utils/oracle';

interface OraclePageProps {
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

interface SavedOracleForm extends OracleInput { seed?: number }

function loadSavedForm(): SavedOracleForm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORACLE_FORM);
    return raw ? (JSON.parse(raw) as SavedOracleForm) : null;
  } catch {
    return null;
  }
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
  const [result, setResult] = useState<OracleResult | null>(() => {
    const s = loadSavedForm();
    if (s?.fullName && s.birthDate && s.seed !== undefined) {
      try { return generateOracle(s, s.seed); } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    const form: SavedOracleForm = { fullName, birthDate, birthTime, birthPlace, seed: result?.seed };
    localStorage.setItem(STORAGE_KEYS.ORACLE_FORM, JSON.stringify(form));
  }, [fullName, birthDate, birthTime, birthPlace, result?.seed]);

  const canGenerate = fullName.trim().length >= 3 && !!birthDate && !!birthTime && birthPlace.trim().length >= 2;

  const handleGenerate = () => {
    if (!canGenerate) {
      toast.error(isPt ? 'Preencha todos os campos!' : 'Fill in all fields!');
      return;
    }
    const input: OracleInput = {
      fullName: fullName.trim(),
      birthDate,
      birthTime,
      birthPlace: birthPlace.trim(),
    };
    // Salt novo a cada clique: varia arquétipo/criatura; o perfil místico
    // (numerologia, signos, pontuações) é determinístico e não muda.
    setResult(generateOracle(input));
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
    if (!result) return;
    const all = result.creature.stages
      .map(s => `## ${s.name} (${L(s.stageName)})\n${s.imagePrompt}`)
      .join('\n\n');
    copyText(all, isPt ? 'Todos os prompts copiados!' : 'All prompts copied!');
  };

  // --- estilos base (inline p/ posicionamento crítico; ver footgun do index.css)
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
  // Botões com cor via style inline — classes utilitárias fora do index.css
  // pré-compilado não aplicam nada (footgun conhecido do projeto).
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
  const mono = { fontFamily: 'monospace' } as const;

  const maxElementScore = result ? Math.max(...ELEMENT_ORDER.map(e => result.elementScores[e]), 1) : 1;
  const maxRoleScore = result ? Math.max(...ROLE_ORDER.map(r => result.roleScores[r]), 1) : 1;

  return (
    <div className="space-y-4" style={mono}>
      {/* Cabeçalho */}
      <div>
        <h2 className={`text-lg ${titleCls}`}>🔮 {isPt ? 'Oráculo de Criaturas' : 'Creature Oracle'}</h2>
        <p className={`text-xs ${mutedCls}`}>
          {isPt
            ? 'Numerologia + astrologia ocidental, chinesa e védica → seu monstrinho pessoal.'
            : 'Numerology + Western, Chinese and Vedic astrology → your personal little monster.'}
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
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGenerate}
              className={`flex-1 ${btnCls}`}
              style={{ ...mono, ...btnStyle, opacity: canGenerate ? 1 : 0.5 }}
              disabled={!canGenerate}
            >
              {result ? (isPt ? '🎲 Gerar novamente' : '🎲 Generate again') : (isPt ? '✨ Revelar criatura' : '✨ Reveal creature')}
            </button>
          </div>
          {result && (
            <p className={`text-[10px] ${mutedCls}`}>
              {isPt ? 'Semente' : 'Seed'}: {result.seed} — {isPt
                ? 'o perfil místico é fixo; gerar de novo só varia arquétipo e criatura.'
                : 'the mystic profile is fixed; regenerating only varies archetype and creature.'}
            </p>
          )}
        </div>
      </div>

      {result && (
        <>
          {/* Numerologia */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🔢 {isPt ? 'Numerologia do nome' : 'Name numerology'}</h3>
            <div className="space-y-1.5 text-xs">
              {([
                ['lifePath', isPt ? 'Caminho de vida' : 'Life path', result.numerology.lifePath],
                ['expression', isPt ? 'Expressão' : 'Expression', result.numerology.expression],
                ['soulUrge', isPt ? 'Motivação (vogais)' : 'Soul urge (vowels)', result.numerology.soulUrge],
                ['personality', isPt ? 'Impressão (consoantes)' : 'Personality (consonants)', result.numerology.personality],
              ] as const).map(([key, label, num]) => (
                <div key={key}>
                  <span className={titleCls}>{label}: <strong>{num}</strong></span>
                  <span className={` ${mutedCls}`}> — {L(result.numerology.meanings[key])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Astrologia */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🌌 {isPt ? 'Céu de nascimento' : 'Birth sky'}</h3>
            <div className="space-y-1.5 text-xs">
              <div className={titleCls}>
                ☀️ {isPt ? 'Sol em' : 'Sun in'} <strong>{L(result.western.sun.name)}</strong>
                <span className={mutedCls}> — {L(result.western.sun.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🌅 {isPt ? 'Ascendente (aprox.) em' : 'Ascendant (approx.) in'} <strong>{L(result.western.ascendant.name)}</strong>
                <span className={mutedCls}> — {L(result.western.ascendant.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🐉 {isPt ? 'Chinês' : 'Chinese'}: <strong>{L(result.chinese.animal)}</strong> {isPt ? 'de' : 'of'} {L(result.chinese.element)} ({result.chinese.yinYang})
                <span className={mutedCls}> — {L(result.chinese.traits[0])}</span>
              </div>
              <div className={titleCls}>
                🕉️ {isPt ? 'Védico' : 'Vedic'}: <strong>{result.vedic.rashi}</strong> ({L(result.vedic.equivalent)})
                <span className={mutedCls}> — {L(result.vedic.traits[0])}</span>
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
                .sort((a, b) => result.elementScores[b] - result.elementScores[a])
                .map(el => {
                  const info = ELEMENT_INFO[el];
                  const score = result.elementScores[el];
                  const isTop = el === result.dominantElement;
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
            <p className={`text-xs mt-2 ${titleCls}`}>
              {ELEMENT_INFO[result.dominantElement].emoji} <strong>{L(ELEMENT_INFO[result.dominantElement].name)}</strong>
              {' + '}
              {ELEMENT_INFO[result.secondaryElement].emoji} {L(ELEMENT_INFO[result.secondaryElement].name)}
            </p>
            <p className={`text-xs ${mutedCls}`}>{L(ELEMENT_INFO[result.dominantElement].personality)}</p>
          </div>

          {/* Funções */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🎯 {isPt ? 'Função' : 'Role'}</h3>
            <div className="space-y-1">
              {[...ROLE_ORDER]
                .sort((a, b) => result.roleScores[b] - result.roleScores[a])
                .map(role => {
                  const info = ROLE_INFO[role];
                  const score = result.roleScores[role];
                  const isTop = role === result.dominantRole;
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
            <p className={`text-xs mt-2 ${mutedCls}`}>{L(ROLE_INFO[result.dominantRole].profile)}</p>
          </div>

          {/* Personalidade + Arquétipo */}
          <div className={cardCls}>
            <h3 className={`mb-2 ${titleCls}`}>🧬 {isPt ? 'Arquétipo' : 'Archetype'}</h3>
            <p className={`text-sm mb-2 ${titleCls}`} style={{ fontWeight: 700 }}>
              “{L(result.archetype.phrase)}”
            </p>
            <p className={`text-xs ${mutedCls}`}>{L(result.personalitySummary)}</p>
          </div>

          {/* Criatura */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={titleCls}>👾 {result.creature.baseName}</h3>
              <button onClick={copyAllPrompts} className={smallBtnCls} style={{ ...mono, ...smallBtnStyle }}>
                📋 {isPt ? 'Copiar todos os prompts' : 'Copy all prompts'}
              </button>
            </div>
            <p className={`text-xs mb-3 ${mutedCls}`}>{L(result.creature.concept)}</p>

            <div className="space-y-3">
              {result.creature.stages.map(stage => (
                <div
                  key={stage.stage}
                  className="rounded-lg p-2"
                  style={{ border: isGlitch ? '1px dashed #00ffff66' : '1px dashed #c0c0c0' }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${titleCls}`} style={{ fontWeight: 700 }}>
                      {stage.stage === 'crianca' ? '🐣' : stage.stage === 'adulto' ? '🐉' : stage.stage === 'perfeito' ? '⚡' : '🌟'}{' '}
                      {L(stage.stageName)} — {stage.name}
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
    </div>
  );
}
