import { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  generateOracle, ORACLE_QUESTIONS,
  type OracleInput, type OracleResult, type LText,
} from '../utils/oracle';
import type { ActivityCategory } from '../types/attributes';

// ---------------------------------------------------------------------------
// SoulmonOnboarding — o ritual de nascimento do Soulmon: o jogador responde
// nome/nascimento + um quiz (uma pergunta por página) e, ao final, recebe SEU
// pet único. O reveal mostra apenas o NOME e uma descrição breve de quem ele é.
// Visual: Soulmon design system (claro, minimalista, espiritual+digital).
// ---------------------------------------------------------------------------

interface SoulmonOnboardingProps {
  onComplete: (data: {
    userName: string;
    oracleResult: OracleResult;
    initialActivities: Array<{ name: string; category: ActivityCategory; emoji: string }>;
  }) => void;
}

interface SavedProfile extends OracleInput { seed: number }

export function SoulmonOnboarding({ onComplete }: SoulmonOnboardingProps) {
  const isPt = localStorage.getItem(STORAGE_KEYS.LANGUAGE) === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);

  // Passos: 0 intro · 1 nome · 2 data · 3 hora · 4 local · 5..(5+N-1) quiz ·
  //         then gerando · reveal
  const QUIZ_START = 5;
  const QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length; // primeiro passo pós-quiz
  const GENERATING = QUIZ_END;
  const REVEAL = QUIZ_END + 1;

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateText, setBirthDateText] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<OracleResult | null>(null);

  const progress = Math.min(step, REVEAL) / REVEAL;

  const canAdvance = (): boolean => {
    if (step === 1) return fullName.trim().length >= 3;
    if (step === 2) return !!birthDate;
    if (step === 3) return !!birthTime;
    if (step === 4) return birthPlace.trim().length >= 2;
    if (step >= QUIZ_START && step < QUIZ_END) {
      return !!answers[ORACLE_QUESTIONS[step - QUIZ_START].id];
    }
    return true;
  };

  const doGenerate = () => {
    const input: OracleInput = {
      fullName: fullName.trim(), birthDate, birthTime, birthPlace: birthPlace.trim(), answers,
    };
    const r = generateOracle(input);
    setResult(r);
    const profile: SavedProfile = { ...input, seed: r.seed };
    localStorage.setItem(STORAGE_KEYS.SOULMON_PROFILE, JSON.stringify(profile));
    setStep(REVEAL);
  };

  const next = () => {
    if (!canAdvance()) return;
    if (step === QUIZ_END - 1) {
      // última pergunta respondida → tela de geração e gera
      setStep(GENERATING);
      setTimeout(doGenerate, 1400); // deixa a animação respirar
      return;
    }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  // Máscara DD/MM/AAAA: só dígitos, insere as barras sozinho enquanto digita.
  const handleBirthDateChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setBirthDateText(masked);

    if (digits.length === 8) {
      const day = Number(digits.slice(0, 2));
      const month = Number(digits.slice(2, 4));
      const year = Number(digits.slice(4, 8));
      const valid = year >= 1900 && year <= new Date().getFullYear()
        && month >= 1 && month <= 12
        && day >= 1 && day <= new Date(year, month, 0).getDate();
      setBirthDate(valid ? `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}` : '');
    } else {
      setBirthDate('');
    }
  };

  const finish = () => {
    if (!result) return;
    onComplete({
      userName: fullName.trim(),
      oracleResult: result,
      initialActivities: [],
    });
  };

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', color: 'var(--sm-ink)',
    border: '2px solid var(--sm-line)', borderRadius: 14, padding: '13px 15px', fontSize: 16,
    outline: 'none',
  };
  const optionBtn = (selected: boolean): React.CSSProperties => ({
    textAlign: 'left', width: '100%', boxSizing: 'border-box',
    background: selected ? 'var(--sm-primary-soft)' : '#fff',
    color: selected ? 'var(--sm-primary)' : 'var(--sm-ink)',
    border: selected ? '2px solid var(--sm-primary)' : '2px solid var(--sm-line)',
    borderRadius: 14, padding: '13px 15px', fontSize: 14, cursor: 'pointer', marginBottom: 8,
    fontWeight: selected ? 700 : 500,
    transition: 'all .12s ease',
  });

  return (
    <div className="sm-app-bg" style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: 'var(--sm-ink)',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '24px 20px 40px' }}>
        {/* Barra de progresso */}
        {step > 0 && step <= REVEAL && (
          <div style={{ height: 10, background: 'var(--sm-line)', borderRadius: 8, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--sm-primary)', borderRadius: 8, transition: 'width .3s' }} />
          </div>
        )}

        {/* 0 — Intro */}
        {step === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{
              width: 88, height: 88, margin: '0 auto 18px', borderRadius: 28,
              background: 'var(--sm-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={44} color="var(--sm-primary)" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 32, margin: '0 0 8px', fontWeight: 800, letterSpacing: -0.5 }}>Soulmon</h1>
            <p style={{ fontSize: 15, color: 'var(--sm-muted)', lineHeight: 1.6, margin: '0 0 32px' }}>
              {isPt
                ? 'Toda alma carrega uma criatura. Responda algumas perguntas e revele a SUA — única, só sua, com todas as suas evoluções.'
                : 'Every soul carries a creature. Answer a few questions and reveal YOURS — unique, yours alone, with all its evolutions.'}
            </p>
            <button className="sm-btn" style={{ width: '100%' }} onClick={() => setStep(1)}>
              {isPt ? 'Começar' : 'Begin'}
            </button>
          </div>
        )}

        {/* 1 — Nome */}
        {step === 1 && (
          <StepShell title={isPt ? 'Qual é o seu nome completo?' : 'What is your full name?'}
            hint={isPt ? 'Seu nome molda a numerologia da sua criatura.' : 'Your name shapes your creature\'s numerology.'}>
            <input style={input} type="text" value={fullName} autoFocus
              onChange={e => setFullName(e.target.value)}
              placeholder={isPt ? 'Ex.: Maria da Silva' : 'E.g.: Jane Doe'}
              onKeyDown={e => e.key === 'Enter' && next()} />
          </StepShell>
        )}

        {/* 2 — Data */}
        {step === 2 && (
          <StepShell title={isPt ? 'Quando você nasceu?' : 'When were you born?'}
            hint={isPt ? 'Define seus signos e elementos.' : 'Sets your signs and elements.'}>
            <input style={input} type="text" inputMode="numeric" autoComplete="off"
              value={birthDateText} autoFocus
              placeholder={isPt ? '__/__/____ (DD/MM/AAAA)' : '__/__/____ (DD/MM/YYYY)'}
              onChange={e => handleBirthDateChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
              maxLength={10} />
          </StepShell>
        )}

        {/* 3 — Hora */}
        {step === 3 && (
          <StepShell title={isPt ? 'A que horas?' : 'At what time?'}
            hint={isPt ? 'A hora afina o ascendente e o tom da criatura.' : 'The hour tunes the ascendant and the creature\'s tone.'}>
            <input style={input} type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} />
          </StepShell>
        )}

        {/* 4 — Local */}
        {step === 4 && (
          <StepShell title={isPt ? 'Onde você nasceu?' : 'Where were you born?'}
            hint={isPt ? 'O lugar deixa seu eco no reino de origem.' : 'The place leaves its echo on the home realm.'}>
            <input style={input} type="text" value={birthPlace} autoFocus
              onChange={e => setBirthPlace(e.target.value)}
              placeholder={isPt ? 'Ex.: São Paulo, Brasil' : 'E.g.: London, UK'}
              onKeyDown={e => e.key === 'Enter' && next()} />
          </StepShell>
        )}

        {/* 5..N — Quiz (uma pergunta por página) */}
        {step >= QUIZ_START && step < QUIZ_END && (() => {
          const q = ORACLE_QUESTIONS[step - QUIZ_START];
          return (
            <StepShell title={L(q.text)}
              hint={isPt ? `Pergunta ${step - QUIZ_START + 1} de ${ORACLE_QUESTIONS.length}` : `Question ${step - QUIZ_START + 1} of ${ORACLE_QUESTIONS.length}`}>
              <div>
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button key={opt.id} style={optionBtn(selected)}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [q.id]: opt.id }));
                        // avança sozinho após escolher (fluido)
                        setTimeout(() => {
                          if (step === QUIZ_END - 1) { setStep(GENERATING); setTimeout(doGenerate, 1400); }
                          else setStep(s => s + 1);
                        }, 180);
                      }}>
                      {L(opt.text)}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          );
        })()}

        {/* Gerando */}
        {step === GENERATING && (
          <div style={{ textAlign: 'center', paddingTop: 90 }}>
            <LoaderCircle size={52} color="var(--sm-primary)" strokeWidth={2}
              style={{ animation: 'soulspin 1.1s linear infinite', marginBottom: 20 }} />
            <p style={{ fontSize: 16, color: 'var(--sm-muted)' }}>
              {isPt ? 'Revelando a criatura da sua alma…' : 'Revealing your soul\'s creature…'}
            </p>
            <style>{`@keyframes soulspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Reveal — apenas nome + descrição breve */}
        {step === REVEAL && result && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 12, color: 'var(--sm-muted)', letterSpacing: 2, fontWeight: 700 }}>
              {isPt ? 'A CRIATURA DA SUA ALMA' : 'YOUR SOUL\'S CREATURE'}
            </div>
            <h1 style={{ fontSize: 36, margin: '10px 0 18px', fontWeight: 800, letterSpacing: -0.5 }}>
              {result.creature.baseName}
            </h1>

            <div className="sm-card" style={{ padding: '18px 16px', marginBottom: 28 }}>
              <p style={{ fontSize: 14, color: 'var(--sm-ink)', lineHeight: 1.7, margin: 0 }}>
                {L(result.creature.bio)}
              </p>
            </div>

            <button className="sm-btn" style={{ width: '100%' }} onClick={finish}>
              {isPt ? `Nascer ${result.creature.baseName}` : `Hatch ${result.creature.baseName}`}
            </button>
          </div>
        )}

        {/* Navegação (para passos com input manual) */}
        {step >= 1 && step <= 4 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="sm-btn sm-btn-secondary" onClick={back} aria-label={isPt ? 'Voltar' : 'Back'}>
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
            <button className="sm-btn" style={{ flex: 1 }} onClick={next} disabled={!canAdvance()}>
              {isPt ? 'Continuar' : 'Continue'}
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}
        {step >= QUIZ_START && step < QUIZ_END && step > QUIZ_START && (
          <button className="sm-btn sm-btn-secondary" style={{ marginTop: 8 }} onClick={back}>
            <ArrowLeft size={16} strokeWidth={2.4} />
            {isPt ? 'Voltar' : 'Back'}
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <h2 style={{ fontSize: 21, margin: '0 0 6px', lineHeight: 1.35, fontWeight: 800 }}>{title}</h2>
      {hint && <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '0 0 20px' }}>{hint}</p>}
      {children}
    </div>
  );
}
