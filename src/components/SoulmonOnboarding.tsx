import { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  generateOracle, ORACLE_QUESTIONS,
  type OracleInput, type OracleResult, type LText,
} from '../utils/oracle';
import { PREMADE_CHARACTERS, getDemoSprite, FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL } from '../utils/monetization';
import { purchase, isBillingAvailable } from '../utils/playBilling';
import type { ActivityCategory } from '../types/attributes';

// ---------------------------------------------------------------------------
// SoulmonOnboarding — o ritual de nascimento do Soulmon: o jogador responde
// nome/nascimento + um quiz (uma pergunta por página) e, ao final, recebe SEU
// pet único. O reveal mostra apenas o NOME e uma descrição breve de quem ele é.
// Por último, um cadastro obrigatório de nickname (identidade pública na
// Biblioteca/Torneio) + e-mail (sync na nuvem entre aparelhos).
//
// Dois caminhos a partir da intro (monetização — utils/monetization.ts):
// 'oracle' = compra única (placeholder, ainda sem processador real) libera o
// ritual completo (nome/nascimento/quiz → personagem ÚNICO); 'demo' = escolhe
// um dos 3 personagens pré-prontos, pula o oráculo inteiro.
// Visual: Soulmon design system (claro, minimalista, espiritual+digital).
// ---------------------------------------------------------------------------

export type OnboardingCompleteData = {
  userName: string;
  email: string;
  initialActivities: Array<{ name: string; category: ActivityCategory; emoji: string }>;
} & (
  | { mode: 'oracle'; oracleResult: OracleResult }
  | { mode: 'demo'; demoCharacterId: 'kaelen' | 'orrin' | 'thalindra' }
);

interface SoulmonOnboardingProps {
  onComplete: (data: OnboardingCompleteData) => void | Promise<void>;
}

interface SavedProfile extends OracleInput { seed: number }

export function SoulmonOnboarding({ onComplete }: SoulmonOnboardingProps) {
  const isPt = localStorage.getItem(STORAGE_KEYS.LANGUAGE) === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);

  // Passos: 0 intro · 1 nome · 2 data · 3 hora · 4 local · 5 criatura favorita ·
  //         6..(6+N-1) quiz · then gerando · reveal · register (nick+email, obrigatório)
  // DEMO_PICK é um passo à parte (fora dessa sequência numérica) — o caminho
  // demo pula direto da intro pra lá, sem passar pelo oráculo.
  const FAVORITE_STEP = 5;
  const QUIZ_START = FAVORITE_STEP + 1;
  const QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length; // primeiro passo pós-quiz
  const GENERATING = QUIZ_END;
  const REVEAL = QUIZ_END + 1;
  const REGISTER = REVEAL + 1;
  const DEMO_PICK = -1;

  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState<'oracle' | 'demo' | null>(null);
  const [demoCharacterId, setDemoCharacterId] = useState<'kaelen' | 'orrin' | 'thalindra' | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateText, setBirthDateText] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [favoriteCreature, setFavoriteCreature] = useState('');
  const [skipFavorite, setSkipFavorite] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<OracleResult | null>(null);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const canFinish = nickname.trim().length >= 2 && email.trim().length > 0 && !submitting;
  const demoChar = flow === 'demo' && demoCharacterId ? PREMADE_CHARACTERS.find(c => c.id === demoCharacterId) ?? null : null;
  const registerDisplayName = demoChar?.name ?? result?.creature.baseName ?? '';

  const progress = Math.min(step, REGISTER) / REGISTER;

  const canAdvance = (): boolean => {
    if (step === 1) return fullName.trim().length >= 3;
    if (step === 2) return !!birthDate;
    if (step === 3) return !!birthTime;
    if (step === 4) return birthPlace.trim().length >= 2;
    // Criatura favorita é opcional — sempre dá pra avançar.
    if (step >= QUIZ_START && step < QUIZ_END) {
      return !!answers[ORACLE_QUESTIONS[step - QUIZ_START].id];
    }
    return true;
  };

  const doGenerate = () => {
    const input: OracleInput = {
      fullName: fullName.trim(), birthDate, birthTime, birthPlace: birthPlace.trim(), answers,
      favoriteCreature: skipFavorite ? undefined : (favoriteCreature.trim() || undefined),
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

  const finish = async () => {
    if (!canFinish) return;
    if (flow === 'demo' && !demoCharacterId) return;
    if (flow === 'oracle' && !result) return;
    if (!isValidEmail(email)) { setEmailError(true); return; }
    setSubmitting(true);
    if (flow === 'demo' && demoCharacterId) {
      await onComplete({
        mode: 'demo',
        userName: nickname.trim(),
        email: email.trim().toLowerCase(),
        demoCharacterId,
        initialActivities: [],
      });
    } else if (result) {
      await onComplete({
        mode: 'oracle',
        userName: nickname.trim(),
        email: email.trim().toLowerCase(),
        oracleResult: result,
        initialActivities: [],
      });
    }
    // Nota: o caminho feliz normalmente recarrega a página (troca de saveId
    // pro derivado do e-mail) — não há necessidade de setSubmitting(false) aqui.
  };

  const handleUnlockFull = async () => {
    // Compras digitais no Android têm que passar pela Google Play — no
    // navegador/PWA não há como cobrar, então avisamos em vez de fingir.
    if (!isBillingAvailable()) {
      setUnlockMessage(isPt
        ? 'A compra está disponível no app Android (Google Play). Enquanto isso, experimente o modo demo.'
        : 'Purchases are available in the Android app (Google Play). Try the demo in the meantime.');
      return;
    }
    setUnlockLoading(true);
    setUnlockMessage(null);
    const result = await purchase(FULL_UNLOCK_SKU);
    setUnlockLoading(false);
    if (result.ok) {
      setFlow('oracle');
      setStep(1);
      return;
    }
    setUnlockMessage(
      result.reason === 'cancelled'
        ? (isPt ? 'Compra cancelada.' : 'Purchase cancelled.')
        : (isPt
          ? 'Não foi possível concluir a compra agora. Tente de novo em instantes.'
          : "Couldn't complete the purchase right now. Please try again shortly."),
    );
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
        {step > 0 && step <= REGISTER && (
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
            <button
              className="sm-btn" style={{ width: '100%' }}
              onClick={handleUnlockFull}
              disabled={unlockLoading}
            >
              {unlockLoading
                ? <LoaderCircle size={18} strokeWidth={2.4} style={{ animation: 'soulspin 1.1s linear infinite' }} />
                : (isPt ? `Desbloquear completo — ${FULL_UNLOCK_PRICE_LABEL}` : `Unlock full game — ${FULL_UNLOCK_PRICE_LABEL}`)}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--sm-muted)', margin: '8px 0 18px' }}>
              {isPt ? 'Compra única — seu próprio personagem, tarefas ilimitadas.' : 'One-time purchase — your own character, unlimited tasks.'}
            </p>
            <button
              className="sm-btn sm-btn-secondary" style={{ width: '100%' }}
              onClick={() => { setFlow('demo'); setStep(DEMO_PICK); }}
            >
              {isPt ? 'Experimentar grátis (demo)' : 'Try free (demo)'}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--sm-muted)', margin: '8px 0 0' }}>
              {isPt ? 'Escolha um personagem pronto — 1 tarefa nova por dia.' : 'Pick a ready-made character — 1 new task per day.'}
            </p>
            {unlockMessage && (
              <p style={{ fontSize: 12, color: '#e0483e', marginTop: 16, lineHeight: 1.5 }}>
                {unlockMessage}
              </p>
            )}
            <style>{`@keyframes soulspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* DEMO_PICK — escolha entre os 3 personagens pré-prontos (modo demo) */}
        {step === DEMO_PICK && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 21, margin: '0 0 6px', lineHeight: 1.35, fontWeight: 800 }}>
              {isPt ? 'Escolha seu Soulmon' : 'Choose your Soulmon'}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '0 0 20px' }}>
              {isPt ? 'No modo demo, seu Soulmon evolui até Mega — sem escolha de caminho.' : "In demo mode, your Soulmon evolves up to Mega — no path choice."}
            </p>
            {PREMADE_CHARACTERS.map(c => (
              <button
                key={c.id}
                onClick={() => { setDemoCharacterId(c.id); setStep(REGISTER); }}
                className="sm-card"
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10, cursor: 'pointer' }}
              >
                <img src={getDemoSprite(c.id, 'rookie')} alt="" style={{ width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: 'var(--sm-ink)' }}>{c.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--sm-muted)', lineHeight: 1.4 }}>{isPt ? c.bioPt : c.bioEn}</p>
                </div>
              </button>
            ))}
            <button className="sm-btn sm-btn-secondary" style={{ width: '100%', marginTop: 4 }} onClick={() => { setFlow(null); setStep(0); }}>
              <ArrowLeft size={16} strokeWidth={2.4} />
              {isPt ? 'Voltar' : 'Back'}
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

        {/* 5 — Criatura favorita (opcional) */}
        {step === FAVORITE_STEP && (
          <StepShell title={isPt ? 'Qual sua criatura favorita?' : "What's your favorite creature?"}
            hint={isPt ? 'Opcional — até 2 palavras. Ela influencia a aparência da sua criatura.' : 'Optional — up to 2 words. It shapes how your creature looks.'}>
            <input style={{ ...input, opacity: skipFavorite ? 0.5 : 1 }} type="text" value={favoriteCreature} autoFocus
              disabled={skipFavorite}
              onChange={e => setFavoriteCreature(e.target.value.split(/\s+/).slice(0, 2).join(' '))}
              placeholder={isPt ? 'Ex.: axolote' : 'E.g.: axolotl'}
              onKeyDown={e => e.key === 'Enter' && next()} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={skipFavorite}
                onChange={e => setSkipFavorite(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--sm-muted)' }}>
                {isPt ? 'Prefiro não influenciar o resultado' : "I'd rather not influence the result"}
              </span>
            </label>
          </StepShell>
        )}

        {/* 6..N — Quiz (uma pergunta por página) */}
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

            <button className="sm-btn" style={{ width: '100%' }} onClick={() => setStep(REGISTER)}>
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          </div>
        )}

        {/* Register — nickname (identidade pública) + e-mail (sync), obrigatórios */}
        {step === REGISTER && (result || demoChar) && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 21, margin: '0 0 6px', lineHeight: 1.35, fontWeight: 800 }}>
              {isPt ? 'Últimos detalhes' : 'Last details'}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '0 0 20px' }}>
              {isPt
                ? 'Isso identifica você na Biblioteca/Torneio e sincroniza seu progresso na nuvem.'
                : 'This identifies you in the Library/Tournament and syncs your progress to the cloud.'}
            </p>

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              {isPt ? 'Seu nickname' : 'Your nickname'}
            </label>
            <input style={input} type="text" value={nickname} autoFocus maxLength={24}
              onChange={e => setNickname(e.target.value)}
              placeholder={isPt ? 'Ex.: Mateus' : 'E.g.: Matt'}
              onKeyDown={e => e.key === 'Enter' && canFinish && finish()} />
            <p style={{ fontSize: 11.5, color: 'var(--sm-muted)', margin: '6px 0 18px' }}>
              {isPt ? 'Visível para outros jogadores na Biblioteca e no Torneio.' : 'Visible to other players in the Library and Tournament.'}
            </p>

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              {isPt ? 'Seu e-mail' : 'Your email'}
            </label>
            <input style={input} type="email" value={email} autoComplete="email"
              onChange={e => { setEmail(e.target.value); setEmailError(false); }}
              placeholder="voce@exemplo.com"
              onKeyDown={e => e.key === 'Enter' && canFinish && finish()} />
            <p style={{ fontSize: 11.5, color: emailError ? '#e0483e' : 'var(--sm-muted)', margin: '6px 0 0' }}>
              {emailError
                ? (isPt ? 'Digite um e-mail válido.' : 'Enter a valid email.')
                : (isPt ? 'Obrigatório — garante que seu progresso não se perca ao trocar de aparelho.' : 'Required — makes sure your progress survives a device change.')}
            </p>

            <button className="sm-btn" style={{ width: '100%', marginTop: 24 }} onClick={finish} disabled={!canFinish}>
              {submitting
                ? <LoaderCircle size={18} strokeWidth={2.4} style={{ animation: 'soulspin 1.1s linear infinite' }} />
                : (isPt ? `Nascer ${registerDisplayName}` : `Hatch ${registerDisplayName}`)}
            </button>
            <style>{`@keyframes soulspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Navegação (para passos com input manual) */}
        {step >= 1 && step <= FAVORITE_STEP && (
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
