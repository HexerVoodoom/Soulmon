import { useState } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  generateOracle, ORACLE_QUESTIONS, ELEMENT_INFO, ALIGNMENT_INFO, REALM_INFO, ROLE_INFO,
  type OracleInput, type OracleResult, type LText, type AlignmentId,
} from '../utils/oracle';
import type { ActivityCategory } from '../types/attributes';

// ---------------------------------------------------------------------------
// SoulmonOnboarding — o onboarding do Soulmon substitui a escolha do ovo:
// o jogador responde nome/nascimento + um quiz (uma pergunta por página) e,
// ao final, recebe SEU pet único com todas as evoluções já definidas.
// (Fase 1: coleta + geração do perfil + revelação textual. As imagens da IA
//  e a substituição do sprite vêm nas fases 2 e 3.)
// ---------------------------------------------------------------------------

type EggType = 'tapirmon' | 'veemon' | 'salamon';

// Ponte temporária p/ o motor de jogo atual (Fase 3 troca a evolução inteira).
const ALIGNMENT_TO_EGG: Record<AlignmentId, EggType> = {
  poder: 'veemon',
  harmonia: 'tapirmon',
  benevolencia: 'salamon',
};

interface SoulmonOnboardingProps {
  onComplete: (data: {
    userName: string;
    eggType: EggType;
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

  const finish = () => {
    if (!result) return;
    onComplete({
      userName: fullName.trim(),
      eggType: ALIGNMENT_TO_EGG[result.dominantAlignment],
      initialActivities: [],
    });
  };

  // --- estilos (dark, cósmico — identidade do Soulmon) ---
  const card: React.CSSProperties = {
    fontFamily: 'monospace', color: '#e8e0ff',
  };
  const btnPrimary: React.CSSProperties = {
    fontFamily: 'monospace', background: 'linear-gradient(135deg,#7c3aed,#c026d3)',
    color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px',
    fontSize: 15, cursor: 'pointer', width: '100%',
  };
  const btnGhost: React.CSSProperties = {
    fontFamily: 'monospace', background: 'transparent', color: '#b9a9e0',
    border: '1px solid #4c3a6e', borderRadius: 12, padding: '10px 16px',
    fontSize: 13, cursor: 'pointer',
  };
  const input: React.CSSProperties = {
    fontFamily: 'monospace', width: '100%', boxSizing: 'border-box',
    background: 'rgba(20,10,40,0.6)', color: '#fff',
    border: '1px solid #4c3a6e', borderRadius: 10, padding: '12px 14px', fontSize: 16,
  };
  const optionBtn = (selected: boolean): React.CSSProperties => ({
    fontFamily: 'monospace', textAlign: 'left', width: '100%', boxSizing: 'border-box',
    background: selected ? 'rgba(124,58,237,0.25)' : 'rgba(20,10,40,0.5)',
    color: selected ? '#fff' : '#cfc3ea',
    border: selected ? '1.5px solid #a855f7' : '1px solid #3a2c56',
    borderRadius: 12, padding: '12px 14px', fontSize: 14, cursor: 'pointer', marginBottom: 8,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      background: 'radial-gradient(circle at 50% 20%, #2a1a4a 0%, #140a24 55%, #0a0616 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '24px 20px 40px', ...card }}>
        {/* Barra de progresso */}
        {step > 0 && step <= REVEAL && (
          <div style={{ height: 4, background: '#2a1e44', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#c026d3)', transition: 'width .3s' }} />
          </div>
        )}

        {/* 0 — Intro */}
        {step === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🔮</div>
            <h1 style={{ fontSize: 30, margin: '0 0 8px', color: '#fff', letterSpacing: 1 }}>Soulmon</h1>
            <p style={{ fontSize: 15, color: '#c3b6e6', lineHeight: 1.6, margin: '0 0 32px' }}>
              {isPt
                ? 'Toda alma carrega uma criatura. Responda algumas perguntas e revele a SUA — única, só sua, com todas as suas evoluções.'
                : 'Every soul carries a creature. Answer a few questions and reveal YOURS — unique, yours alone, with all its evolutions.'}
            </p>
            <button style={btnPrimary} onClick={() => setStep(1)}>
              {isPt ? '✨ Começar' : '✨ Begin'}
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
            <input style={input} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
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
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 56, marginBottom: 20, animation: 'soulspin 1.4s linear infinite' }}>🌀</div>
            <p style={{ fontSize: 16, color: '#d8ccf5' }}>
              {isPt ? 'Revelando a criatura da sua alma…' : 'Revealing your soul\'s creature…'}
            </p>
            <style>{`@keyframes soulspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Reveal */}
        {step === REVEAL && result && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#a99bd0', letterSpacing: 2 }}>
                {isPt ? 'A CRIATURA DA SUA ALMA' : 'YOUR SOUL\'S CREATURE'}
              </div>
              <h1 style={{ fontSize: 32, margin: '6px 0 4px', color: '#fff' }}>{result.creature.baseName}</h1>
              <div style={{ fontSize: 13, color: '#c9bdea' }}>
                {ELEMENT_INFO[result.dominantElement].emoji} {L(ELEMENT_INFO[result.dominantElement].name)}
                {' · '}{ALIGNMENT_INFO[result.dominantAlignment].emoji} {L(ALIGNMENT_INFO[result.dominantAlignment].name)}
                {' · '}{ROLE_INFO[result.dominantRole].emoji} {L(ROLE_INFO[result.dominantRole].name)}
                {' · '}{REALM_INFO[result.dominantRealm].emoji} {L(REALM_INFO[result.dominantRealm].name)}
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#c9bdea', textAlign: 'center', margin: '0 0 8px' }}>
              🧬 {L(result.creature.family.primary.family)} ({L(result.creature.family.primary.subfamily)})
              {!result.creature.family.mono && (
                result.creature.family.secondary.isObject
                  ? ` + 🗡️ ${L(result.creature.family.secondary.subfamily)}`
                  : ` + ${L(result.creature.family.secondary.family)} (${L(result.creature.family.secondary.subfamily)})`
              )}
            </p>

            <p style={{ fontSize: 13, fontStyle: 'italic', color: '#e0d6ff', textAlign: 'center',
              lineHeight: 1.6, margin: '0 0 20px', padding: '0 4px' }}>
              “{L(result.creature.bio)}”
            </p>

            <div style={{ fontSize: 11, color: '#a99bd0', letterSpacing: 1, marginBottom: 8 }}>
              {isPt ? 'LINHA DE EVOLUÇÃO' : 'EVOLUTION LINE'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {result.creature.stages.map(s => (
                <div key={`${s.stage}-${s.branch ?? 'base'}`}
                  style={{ display: 'flex', justifyContent: 'space-between',
                    background: 'rgba(20,10,40,0.5)', border: '1px solid #33254f',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                  <span style={{ color: '#fff' }}>{s.name}</span>
                  <span style={{ color: '#a99bd0' }}>
                    {L(s.stageName)}{s.branch ? ` · ${L(ALIGNMENT_INFO[s.branch].attribute)}` : ''}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#8a7cb0', textAlign: 'center', marginBottom: 14 }}>
              {isPt
                ? '🎨 Em breve: as imagens de cada forma serão geradas e instaladas como seu pet.'
                : '🎨 Soon: each form\'s image will be generated and installed as your pet.'}
            </p>

            <button style={btnPrimary} onClick={finish}>
              {isPt ? `🥚 Nascer ${result.creature.baseName}` : `🥚 Hatch ${result.creature.baseName}`}
            </button>
          </div>
        )}

        {/* Navegação (para passos com input manual) */}
        {step >= 1 && step <= 4 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button style={btnGhost} onClick={back}>← {isPt ? 'Voltar' : 'Back'}</button>
            <button style={{ ...btnPrimary, opacity: canAdvance() ? 1 : 0.4, flex: 1 }}
              onClick={next} disabled={!canAdvance()}>
              {isPt ? 'Continuar →' : 'Continue →'}
            </button>
          </div>
        )}
        {step >= QUIZ_START && step < QUIZ_END && step > QUIZ_START && (
          <button style={{ ...btnGhost, marginTop: 8 }} onClick={back}>← {isPt ? 'Voltar' : 'Back'}</button>
        )}
      </div>
    </div>
  );
}

function StepShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <h2 style={{ fontSize: 20, color: '#fff', margin: '0 0 6px', lineHeight: 1.35 }}>{title}</h2>
      {hint && <p style={{ fontSize: 12, color: '#a99bd0', margin: '0 0 20px' }}>{hint}</p>}
      {children}
    </div>
  );
}
