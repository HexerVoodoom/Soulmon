import { useState, useRef, useEffect, lazy, Suspense, type CSSProperties } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import { Icon } from './ui/Icon';
import { ScreenSkeleton } from './ui/ScreenSkeleton';
import { sm2Button, sm2Hint, sm2Label, sm2Text, sm2TitleStyle, Field, CheckRow } from './form/FormKit';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readLocal, writeJson, removeLocal } from '../utils/safeStorage';
import { readOracleDraft, writeOracleDraft, clearOracleDraft } from '../utils/oracleDraft';
import {
  buildConsentRecord, isAgeBlocked, isAgeBlockedByMonth, monthYearFromText, MIN_AGE_YEARS,
  type ConsentRecord,
} from '../utils/consent';
import {
  generateOracle, ORACLE_QUESTIONS,
  type OracleInput, type OracleResult, type LText,
} from '../utils/oracle';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';
import type { Answers as SoulAnswers } from '../utils/soulProfile/personality/types';
import { cityLabel, type City } from '../utils/soulProfile/cities';
import { CityPicker } from './CityPicker';
import { SoulTestItem, itemHint, itemPrompt } from './SoulTestItem';
import { PREMADE_CHARACTERS, getDemoSprite, FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL } from '../utils/monetization';
import { purchase, isBillingAvailable } from '../utils/playBilling';
import { isAuthConfigured, sendLoginLink, getCurrentEmail } from '../utils/auth';
import { resolveLanguage } from '../utils/i18n';
import { track, flush as flushTelemetry, onboardingStepCode, TELEMETRY_FUNNEL } from '../utils/telemetry';
import type { ActivityCategory } from '../types/attributes';

// Ferramenta interna de dev — não entra no bundle inicial da intro (mesmo
// motivo do lazy() em App.tsx).
const OraclePage = lazy(() => import('./OraclePage').then(m => ({ default: m.OraclePage })));

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
//
// ── A ROUPA NOVA (onda final da limpeza) ────────────────────────────────────
// Esta é a PRIMEIRA superfície do app e era a mais antiga: `sm-px-*`, `sm-card`,
// `sm-btn`, três blocos de `@keyframes` inline iguais, ícones `lucide-react` e
// texto a 11,5px. Passou pela mesma régua das outras telas:
//
//   · tokens `--sm2-*`, tipografia Fredoka (título) / Rubik (texto), PISO DE
//     12px — não existe mais `fontSize: 11.5`;
//   · UMA ação dominante por passo. O que foi cortado é o que não decidia nada:
//     os dois parágrafos de propaganda embaixo dos botões da intro (o preço já
//     está no rótulo do botão), a legenda dupla do cadastro e a repetição do
//     "modo demo" na escolha de personagem;
//   · glifos pela `<Icon>` (`arrow_back`/`arrow_forward`/`sync`, os três
//     conferidos no inventário de `src/styles/tokens.md`);
//   · `Suspense fallback={null}` do atalho de debug virou `ScreenSkeleton`.
//
// O QUE NÃO MUDOU, de propósito: o FLUXO. O ritual continua com as 6 perguntas
// e o teste longo continua com os 20 itens — são regra de PRODUTO, não roupa.
// A barra de progresso mantém o denominador corrigido (inclui o tutorial que
// vem depois) e o desconto do bloco de 20 para quem recusa o teste.
// ---------------------------------------------------------------------------

/**
 * Os `@keyframes` do giro do carregando. Existiam TRÊS blocos `<style>`
 * idênticos espalhados pelo componente (intro, gerando, cadastro); agora é um
 * só, montado uma vez. `prefers-reduced-motion` corta o giro — o ícone fica
 * parado e o texto ao lado continua dizendo o que está acontecendo, então
 * nenhuma informação vive só no movimento.
 */
const SPIN_CSS = `
@keyframes soulspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){[data-sm-spin]{animation:none !important}}
`;

/** O giro do carregando. `sync` está no inventário da fonte; `progress_activity` não. */
function Spinner({ size = 20 }: { size?: number }) {
  return (
    // O giro vive num `<span>` de fora e não na `<Icon>`: o componente de
    // ícone não repassa props soltas, e um seletor por ATRIBUTO (em vez de
    // classe) é o que mantém o `prefers-reduced-motion` funcionando sem
    // declarar classe nova — `index.css` tem outro dono e classe fantasma não
    // aplica nada e não avisa (footgun 1).
    <span
      data-sm-spin=""
      aria-hidden="true"
      style={{ display: 'inline-flex', animation: 'soulspin 1.1s linear infinite' }}
    >
      <Icon name="sync" size={size} />
    </span>
  );
}

export type OnboardingCompleteData = {
  userName: string;
  /**
   * O nome que a PESSOA deu ao Soulmon depois de ele ser gerado. Opcional de
   * propósito: ausente = fica valendo o nome sugerido pelo oráculo
   * (`creature.baseName`). Quem já jogava nunca teve este campo, e um save
   * antigo não pode ser forçado a nada.
   */
  petName?: string;
  email: string;
  initialActivities: Array<{ name: string; category: ActivityCategory; emoji: string }>;
  /** O "porquê" do usuário, perguntado ANTES de qualquer mecânica de jogo. */
  soulGoal: string;
  soulStruggle: string;
  /**
   * Prova do consentimento específico: timestamp + versão de CADA documento
   * aceito (utils/consent.ts). Opcional no TIPO porque o modo 'upgrade' e os
   * saves antigos não têm — ausência NUNCA vira bloqueio.
   */
  consent?: ConsentRecord;
} & (
  | { mode: 'oracle'; oracleResult: OracleResult }
  | { mode: 'demo'; demoCharacterId: 'kaelen' | 'orrin' | 'thalindra' }
);

interface SoulmonOnboardingProps {
  onComplete: (data: OnboardingCompleteData) => void | Promise<void>;
  /**
   * 'upgrade' = o MESMO ritual do oráculo, mas para quem já joga e acabou de
   * comprar o desbloqueio no meio do jogo. Pula a intro (não há mais o que
   * escolher), o caminho demo e o cadastro (nickname/e-mail já existem), e
   * termina no reveal chamando `onRevealed` — quem chama decide o que fazer
   * com o progresso atual. Reaproveitar este componente é de propósito: um
   * segundo quiz copiado divergiria em silêncio do original.
   */
  mode?: 'onboarding' | 'upgrade';
  /** Só em 'upgrade': entrega o resultado do oráculo e encerra. */
  onRevealed?: (result: OracleResult) => void;
  /** Só em 'upgrade': desistir e voltar ao jogo. */
  onCancel?: () => void;
}

interface SavedProfile extends OracleInput { seed: number }

export function SoulmonOnboarding({ onComplete, mode = 'onboarding', onRevealed, onCancel }: SoulmonOnboardingProps) {
  const isUpgrade = mode === 'upgrade';
  const isPt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);

  // Atalho oculto pro dono: segurar o mascote na intro (~1.8s) abre a
  // OraclePage (ferramenta de dev, sem entrada na navegação) já no modo
  // debug. Nenhum indício visual pro jogador comum — sem esse gesto,
  // ninguém encontra isso por acidente.
  const [oracleDebugOpen, setOracleDebugOpen] = useState(false);
  const oracleDebugHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startOracleDebugHold = () => {
    if (oracleDebugHoldTimer.current) clearTimeout(oracleDebugHoldTimer.current);
    oracleDebugHoldTimer.current = setTimeout(() => setOracleDebugOpen(true), 1800);
  };
  const cancelOracleDebugHold = () => {
    if (oracleDebugHoldTimer.current) {
      clearTimeout(oracleDebugHoldTimer.current);
      oracleDebugHoldTimer.current = null;
    }
  };

  // Passos: 0 intro · 1 nome · 2 data · 3 hora · 4 local · 5 criatura favorita ·
  //         6..11 as 6 perguntas do ritual · 12 a bifurcação do refinamento ·
  //         13..32 os 20 itens (SÓ para quem aceitar) · gerando · reveal ·
  //         register (nick+email, obrigatório)
  // DEMO_PICK é um passo à parte (fora dessa sequência numérica) — o caminho
  // demo pula direto da intro pra lá, sem passar pelo oráculo.
  //
  // O ritual continua sendo as 6 perguntas: é o que praticamente todo mundo vai
  // responder, e 20 itens psicométricos como porta de entrada obrigatória são
  // um formulário, não um ritual. O teste longo vira uma ESCOLHA oferecida
  // depois delas — e ANTES do reveal, de propósito: assim a criatura nasce uma
  // vez só, já com a leitura que a pessoa escolheu. Oferecer depois do reveal
  // significaria trocar por outra a criatura que ela acabou de conhecer.
  const FAVORITE_STEP = 5;
  const QUIZ_START = FAVORITE_STEP + 1;
  const QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length; // primeiro passo pós-quiz
  const REFINE_OFFER = QUIZ_END;
  const DEEP_START = REFINE_OFFER + 1;
  const DEEP_END = DEEP_START + SOUL_TEST_ITEMS.length;
  const GENERATING = DEEP_END;
  const REVEAL = GENERATING + 1;
  const REGISTER = REVEAL + 1;
  const DEMO_PICK = -1;
  // O "porquê" vem ANTES de nome, data e quiz: a razão para mudar precisa vir
  // da pessoa, não do app (Goal-Setting Theory + autonomia da SDT), e nenhuma
  // mecânica de jogo aparece antes dela. Ids negativos, como DEMO_PICK, para
  // não renumerar a sequência do ritual.
  const GOAL_STEP = -2;
  const STRUGGLE_STEP = -3;
  // Termos + Política ANTES da coleta de nome e data (D-07). Também id
  // negativo: a numeração do ritual não se mexe por causa de uma tela nova.
  const CONSENT_STEP = -4;
  // Muro de idade: aparece ao AVANÇAR do passo da data, quando ela dá <18.
  // Não é alerta genérico — é um passo próprio, com o mesmo casco dos outros.
  const AGE_BLOCK = -5;

  // No upgrade o ritual começa direto na primeira pergunta: a intro só existe
  // para escolher entre grátis e completo, e essa escolha já foi feita (paga).
  // WP1.7 — rascunho do ritual (`utils/oracleDraft.ts`). Lido UMA vez, na
  // montagem: se a pessoa fechou o app no meio do ritual pago, volta para o
  // mesmo passo com tudo que já respondeu. Nunca retoma na geração ou depois
  // (`DEEP_END - 1` é o último item do teste), e só no mesmo modo.
  const [draft] = useState(() => readOracleDraft(mode, DEEP_END - 1));
  const [step, setStep] = useState(draft ? draft.step : isUpgrade ? 1 : 0);
  const [flow, setFlow] = useState<'oracle' | 'demo' | null>(draft || isUpgrade ? 'oracle' : null);
  const [demoCharacterId, setDemoCharacterId] = useState<'kaelen' | 'orrin' | 'thalindra' | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  /** A caixa de consentimento vive FORA do texto legal: é elemento de UI
   *  próprio, com rótulo e foco, e o botão de avançar só liga com ela marcada.
   *  Caixa embutida dentro do parágrafo dos Termos não é consentimento
   *  específico (achado do run 01, PLANO-TAREFAS.md:187). */
  const [consentChecked, setConsentChecked] = useState(!!draft?.consent);
  const [consent, setConsent] = useState<ConsentRecord | null>(draft?.consent ?? null);
  /** Mês/ano de nascimento pedido SÓ no caminho demo, e SÓ para conferir 18+
   *  (utils/consent.ts). O demo pula o Oráculo inteiro e nunca chega ao passo
   *  da data — sem isto, o 18+ do dono valeria só para quem paga. Fica em
   *  estado de componente e NÃO é persistido: aqui ele não alimenta mapa astral
   *  nenhum, então guardar seria coletar sem finalidade. */
  const [demoAgeText, setDemoAgeText] = useState('');
  const demoAgeMonth = monthYearFromText(demoAgeText);
  /** O passo de consentimento é o ponto comum aos dois caminhos e vem ANTES da
   *  bifurcação — é onde a idade custa menos fricção no demo. No caminho do
   *  Oráculo o campo não aparece: a data cheia do mapa astral já confere. */
  const demoNeedsAge = flow === 'demo';
  const [soulGoal, setSoulGoal] = useState(draft?.soulGoal ?? '');
  const [soulStruggle, setSoulStruggle] = useState(draft?.soulStruggle ?? '');
  const [fullName, setFullName] = useState(draft?.fullName ?? '');
  const [birthDate, setBirthDate] = useState(draft?.birthDate ?? '');
  const [birthDateText, setBirthDateText] = useState(draft?.birthDateText ?? '');
  const [birthTime, setBirthTime] = useState(draft?.birthTime ?? '12:00');
  // O local vira CIDADE da tabela (lat/lon/fuso IANA) em vez de texto livre: o
  // mapa astral precisa dos três, e o fuso é o que carrega o horário de verão
  // histórico. `birthPlace` continua existindo porque é o campo que o
  // `OracleInput` sempre teve (e o que os perfis já salvos guardam) — passa a
  // ser o rótulo legível da cidade escolhida.
  const [birthCity, setBirthCity] = useState<City | null>(draft?.birthCity ?? null);
  const birthPlace = birthCity ? cityLabel(birthCity) : '';
  const [timeUnknown, setTimeUnknown] = useState(draft?.timeUnknown ?? false);
  const [favoriteCreature, setFavoriteCreature] = useState(draft?.favoriteCreature ?? '');
  const [skipFavorite, setSkipFavorite] = useState(draft?.skipFavorite ?? false);
  /** As 6 perguntas do ritual — todo mundo responde. */
  const [answers, setAnswers] = useState<Record<string, string>>(draft?.answers ?? {});
  /** Os 20 itens psicométricos — só de quem aceitou refinar. */
  const [testAnswers, setTestAnswers] = useState<SoulAnswers>(draft?.testAnswers ?? {});
  /** null = ainda não decidiu. É uma decisão SEM VOLTA, por escolha de
   *  produto: não existe caminho para responder o teste depois. O rascunho
   *  guarda a decisão como está — retomar não reabre a bifurcação. */
  const [refine, setRefine] = useState<boolean | null>(draft?.refine ?? null);
  const [result, setResult] = useState<OracleResult | null>(null);
  /** Essência do class-system + ofício, calculados pelo pipeline completo —
   *  aparecem como UMA linha no reveal. Pontuações continuam invisíveis. */
  const [essence, setEssence] = useState<{ pt: string; en: string } | null>(null);
  const [nickname, setNickname] = useState('');
  /** Batismo do Soulmon. `null` = a pessoa não encostou no campo, e o que
   *  aparece na tela é a sugestão (`registerDisplayName`). Guardar assim, em
   *  vez de semear o estado por efeito, é o que faz MANTER o sugerido custar
   *  zero toque — e continua funcionando se a criatura mudar antes do
   *  cadastro (reroll do demo, por exemplo). */
  const [petNameEdit, setPetNameEdit] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Link de acesso enviado — a tela passa a pedir que o usuário abra o e-mail. */
  const [linkSent, setLinkSent] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  // No caminho grátis o e-mail é OPCIONAL: pedir dado de contato antes de a
  // pessoa ter visto o pet andar é o maior ponto de abandono de um onboarding.
  // Ele é pedido depois, quando já existe progresso a proteger (ver
  // ProtectProgressModal). No caminho pago continua obrigatório — a compra fica
  // amarrada ao saveId derivado do e-mail, e perder isso é bem pior.
  const emailRequired = flow !== 'demo';
  const canFinish = nickname.trim().length >= 2
    && (!emailRequired || email.trim().length > 0)
    && !submitting;
  const demoChar = flow === 'demo' && demoCharacterId ? PREMADE_CHARACTERS.find(c => c.id === demoCharacterId) ?? null : null;
  const registerDisplayName = demoChar?.name ?? result?.creature.baseName ?? '';
  /** O que o campo do batismo mostra. */
  const petNameValue = petNameEdit ?? registerDisplayName;
  /** O que SAI daqui. Campo apagado ou só com espaços volta para o sugerido:
   *  o pet nunca fica sem nome por causa de um campo em branco. */
  const petNameFinal = petNameValue.trim() || registerDisplayName;

  // O denominador inclui o tutorial que vem DEPOIS do onboarding: antes a
  // barra chegava a 100% aqui e ainda apareciam várias telas, dando a
  // impressão de que o fluxo tinha acabado. No upgrade não há tutorial nem
  // cadastro depois — o reveal É o fim, e a barra pode chegar a 100%.
  const lastStep = isUpgrade ? REVEAL : REGISTER;
  // Quem recusa o teste longo pula 20 passos de uma vez. Sem descontar esse
  // bloco, a barra daria um salto de ~60% e depois diria que falta muito — a
  // barra tem que medir o caminho QUE A PESSOA escolheu, não o mais longo
  // possível.
  const deepBlock = SOUL_TEST_ITEMS.length;
  const skipDeep = refine === false;
  const shrink = (n: number) => (skipDeep && n > REFINE_OFFER ? n - deepBlock : n);
  const progress = Math.min(shrink(step), shrink(lastStep)) / shrink(isUpgrade ? lastStep : REGISTER + 1);

  const canAdvance = (): boolean => {
    if (step === CONSENT_STEP) return consentChecked && (!demoNeedsAge || !!demoAgeMonth);
    if (step === 1) return fullName.trim().length >= 3;
    if (step === 2) return !!birthDate;
    if (step === 3) return timeUnknown || !!birthTime;
    if (step === 4) return !!birthCity;
    // Criatura favorita é opcional — sempre dá pra avançar.
    if (step >= QUIZ_START && step < QUIZ_END) {
      return !!answers[ORACLE_QUESTIONS[step - QUIZ_START].id];
    }
    // A bifurcação não tem "Continuar": as duas saídas são os próprios botões.
    if (step === REFINE_OFFER) return false;
    if (step >= DEEP_START && step < DEEP_END) {
      return !!testAnswers[SOUL_TEST_ITEMS[step - DEEP_START].id];
    }
    return true;
  };

  // -------------------------------------------------------------------------
  // Telemetria do funil (utils/telemetry.ts).
  //
  // O `onboarding_step` sozinho media a MÉDIA de duas populações opostas — o
  // demo de 4 telas e o ritual pago de 8+ — e por isso não respondia nada
  // (evidencia-comportamento.md §3). A prop `funnel` é o que separa as duas.
  //
  // Um efeito só, aqui, em vez de uma chamada em cada `setStep`: fiação
  // espalhada por 15 transições esquece uma e vira buraco silencioso no funil.
  // Nenhum texto do usuário entra — o passo é um NÚMERO e nada mais.
  // -------------------------------------------------------------------------
  const funnel = isUpgrade || flow === 'oracle'
    ? TELEMETRY_FUNNEL.paid
    : flow === 'demo'
      ? TELEMETRY_FUNNEL.demo
      : TELEMETRY_FUNNEL.unknown;
  useEffect(() => {
    const code = onboardingStepCode(step);
    if (code === null) return;
    track('onboarding_step', { step: code, funnel });
  }, [step, funnel]);

  const [generateError, setGenerateError] = useState(false);

  // WP1.7 — grava o rascunho a cada mudança, só DENTRO do ritual pago (do nome
  // ao último item do teste) e só enquanto não existe resultado. Fora disso o
  // rascunho é apagado, não deixado para trás: um rascunho velho retomaria um
  // ritual que a pessoa já terminou.
  const inRitual = (isUpgrade || flow === 'oracle') && step >= 1 && step < GENERATING && !result;
  useEffect(() => {
    if (!inRitual) return;
    writeOracleDraft({
      mode, step, soulGoal, soulStruggle, fullName, birthDate, birthDateText, birthTime,
      birthCity, timeUnknown, favoriteCreature, skipFavorite, answers, testAnswers, refine, consent,
    });
  }, [inRitual, mode, step, soulGoal, soulStruggle, fullName, birthDate, birthDateText, birthTime,
    birthCity, timeUnknown, favoriteCreature, skipFavorite, answers, testAnswers, refine, consent]);

  /** Dispara a geração e, se ela falhar, devolve o usuário à última pergunta
   *  com um aviso — travar na animação de "revelando" para sempre é o pior
   *  final possível para um ritual que a pessoa acabou de responder inteiro. */
  const runGenerate = (finalTest?: SoulAnswers) => {
    setGenerateError(false);
    void doGenerate(finalTest).catch(() => {
      setGenerateError(true);
      // Volta para a bifurcação, que é onde os dois caminhos se encontram —
      // mandar de volta para "a última pergunta" só funcionaria para quem fez
      // o teste longo, e deixaria quem recusou preso na animação.
      setRefine(null);
      setStep(REFINE_OFFER);
    });
  };

  // `finalTest` existe porque o último item do teste dispara a geração no MESMO
  // clique que o responde: o `testAnswers` do estado ainda é o anterior nesse
  // instante, e sem isso a 20ª resposta nunca chegava ao perfil de alma.
  const doGenerate = async (finalTest: SoulAnswers = testAnswers) => {
    // O motor da leitura (utils/soulProfile/) puxa a engine de efemérides e é
    // pesado — vem por import DINÂMICO, aqui na tela de geração, que é o único
    // momento do app em que ele é necessário e o único em que já existe uma
    // animação cobrindo a espera.
    const { buildSoulProfile } = await import('../utils/soulProfile');
    // O perfil de alma é montado NOS DOIS caminhos: mesmo sem o teste longo,
    // ele traz o mapa astral REAL e a numerologia completa, que já são melhores
    // que o ascendente estimado do motor antigo. O que muda é a camada
    // psicométrica: com as 20 respostas ela existe; sem elas, os traços ficam
    // neutros e quem decide são o céu de nascimento, o nome e as 6 respostas.
    const soulProfile = birthCity
      ? buildSoulProfile({
        fullName: fullName.trim(),
        birthDate,
        birthTime,
        timeUnknown,
        placeLabel: birthPlace,
        latitude: birthCity.latitude,
        longitude: birthCity.longitude,
        timeZone: birthCity.timeZone,
      }, refine ? finalTest : {})
      : undefined;

    const input: OracleInput = {
      fullName: fullName.trim(), birthDate, birthTime, birthPlace,
      // As 6 do ritual entram na leitura sempre — são o único sinal de
      // personalidade de quem não faz o teste longo.
      answers,
      favoriteCreature: skipFavorite ? undefined : (favoriteCreature.trim() || undefined),
      soulProfile,
    };
    let r: OracleResult;
    if (soulProfile) {
      // Pipeline completo: distribui os pontos na ficha do class-system,
      // captura o companheiro e busca a criatura-inspiração no bestiário —
      // a geração da criatura já sai alinhada com tudo isso.
      const { generateOracleComplete, essenceLabel, CLASS_DATA, PROFISSAO_EN } = await import('../utils/soulProfile');
      const complete = await generateOracleComplete(input);
      r = complete.result;
      const dominant = soulProfile.oracle.dominantClassElements[0];
      const profId = Object.keys(complete.fichaByStage.rookie.profissoes)[0];
      const profPt = CLASS_DATA.profissoes[profId as keyof typeof CLASS_DATA.profissoes]?.nome ?? profId;
      setEssence({
        pt: `Essência ${essenceLabel(dominant, true)} · Ofício ${profPt}`,
        en: `${essenceLabel(dominant, false)} essence · ${PROFISSAO_EN[profId] ?? profId}`,
      });
    } else {
      r = generateOracle(input);
      setEssence(null);
    }
    setResult(r);
    // O ritual acabou: o rascunho sai AGORA, antes do reveal. Quem fechar no
    // reveal tem o perfil com `seed` abaixo — retomar no item 20 regeneraria
    // a criatura, e geração custa.
    clearOracleDraft();
    const profile: SavedProfile = { ...input, seed: r.seed };
    // Perfil da alma = semente para REGERAR a criatura. Perder isso tira do
    // jogador o reroll pelo qual ele pode ter pagado. AVISA.
    writeJson(STORAGE_KEYS.SOULMON_PROFILE, profile);
    setStep(REVEAL);
  };

  const next = () => {
    if (step === GOAL_STEP) { setStep(STRUGGLE_STEP); return; }
    if (step === STRUGGLE_STEP) { setStep(CONSENT_STEP); return; }
    if (step === CONSENT_STEP) {
      if (!canAdvance()) return;
      // Gate 18+ do caminho DEMO, aqui porque este passo é o último ponto comum
      // antes da bifurcação. Mesma trava do caminho pago: mês/ano ausente ou
      // ilegível NÃO bloqueia — só bloqueia declaração legível de menor.
      if (demoNeedsAge && isAgeBlockedByMonth(demoAgeMonth)) { setStep(AGE_BLOCK); return; }
      // O carimbo é feito no MOMENTO do aceite, não no fim do onboarding: é
      // esse instante que a prova precisa registrar.
      setConsent(buildConsentRecord());
      setStep(flow === 'demo' ? DEMO_PICK : 1);
      return;
    }
    if (!canAdvance()) return;
    // Gate 18+ (D-06): a MESMA data do mapa astral confirma a idade mínima.
    // `isAgeBlocked` só bloqueia data legível de menor — data vazia ou
    // ilegível segue o fluxo, que é o que impede barrar alguém por engano.
    if (step === 2 && isAgeBlocked(birthDate)) { setStep(AGE_BLOCK); return; }
    if (step === DEEP_END - 1) {
      // último item do teste longo respondido → tela de geração e gera
      setStep(GENERATING);
      setTimeout(runGenerate, 1400); // deixa a animação respirar
      return;
    }
    setStep(s => s + 1);
  };

  /** Saídas da bifurcação. Escolher aqui é definitivo — ver `refine`. */
  const chooseRefine = (yes: boolean) => {
    setRefine(yes);
    if (yes) { setStep(DEEP_START); return; }
    setStep(GENERATING);
    setTimeout(runGenerate, 1400);
  };
  // No upgrade não existe passo 0 (intro): voltar da primeira pergunta é
  // desistir do ritual e voltar ao jogo.
  const back = () => {
    if (isUpgrade && step === 1) { onCancel?.(); return; }
    if (step === GOAL_STEP) { setStep(0); return; }
    if (step === STRUGGLE_STEP) { setStep(GOAL_STEP); return; }
    if (step === CONSENT_STEP) { setStep(STRUGGLE_STEP); return; }
    if (step === DEMO_PICK) { setStep(CONSENT_STEP); return; }
    if (step === 1 && !isUpgrade) { setStep(CONSENT_STEP); return; }
    // Voltar de dentro do teste longo devolve a escolha: quem entrou sem
    // querer não fica preso em 20 perguntas.
    if (step === DEEP_START) { setRefine(null); setStep(REFINE_OFFER); return; }
    setStep(s => Math.max(isUpgrade ? 1 : 0, s - 1));
  };

  /** Saída do muro de idade: nada de nome/data fica guardado, e o ritual
   *  recomeça do zero. Não é castigo — é não segurar dado de quem o app não
   *  pode atender. */
  const restartFromAgeBlock = () => {
    setFullName('');
    setBirthDate('');
    setBirthDateText('');
    setBirthCity(null);
    setAnswers({});
    setTestAnswers({});
    setRefine(null);
    setConsentChecked(false);
    setConsent(null);
    setDemoAgeText('');
    setFlow(null);
    removeLocal(STORAGE_KEYS.SOULMON_PROFILE);
    clearOracleDraft();
    setStep(0);
  };

  /** Máscara MM/AAAA do campo de idade do demo. Só dígitos, barra sozinha. */
  const handleDemoAgeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setDemoAgeText(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

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
    // Vazio é permitido no caminho grátis; se digitou algo, tem que ser válido.
    if (email.trim().length > 0 && !isValidEmail(email)) { setEmailError(true); return; }
    if (emailRequired && !isValidEmail(email)) { setEmailError(true); return; }
    setSubmitting(true);

    // Com o login por e-mail ligado, é preciso PROVAR a posse do e-mail antes
    // de criar o save — senão qualquer um poderia reivindicar o e-mail alheio
    // (o saveId é derivado dele). Manda o link e aguarda o retorno; o resto do
    // onboarding continua quando o app reabrir pelo link.
    if (email.trim().length > 0 && isAuthConfigured() && !(await getCurrentEmail())) {
      const sent = await sendLoginLink(email.trim().toLowerCase());
      setSubmitting(false);
      setLinkSent(sent.ok);
      if (!sent.ok) {
        setEmailError(true);
        setUnlockMessage(isPt
          ? 'Não foi possível enviar o link de acesso. Confira o e-mail e tente de novo.'
          : "Couldn't send the sign-in link. Check the address and try again.");
      }
      return;
    }

    // Defensivo: a geração já apagou o rascunho; o demo nunca cria um.
    clearOracleDraft();
    if (flow === 'demo' && demoCharacterId) {
      await onComplete({
        mode: 'demo',
        userName: nickname.trim(),
        petName: petNameFinal,
        email: email.trim().toLowerCase(),
        demoCharacterId,
        initialActivities: [],
        soulGoal: soulGoal.trim(),
        soulStruggle: soulStruggle.trim(),
        consent: consent ?? undefined,
      });
    } else if (result) {
      await onComplete({
        mode: 'oracle',
        userName: nickname.trim(),
        petName: petNameFinal,
        email: email.trim().toLowerCase(),
        oracleResult: result,
        initialActivities: [],
        soulGoal: soulGoal.trim(),
        soulStruggle: soulStruggle.trim(),
        consent: consent ?? undefined,
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
      // Só depois de a compra voltar OK — clique não é receita.
      track('purchase');
      flushTelemetry();
      setFlow('oracle');
      setStep(GOAL_STEP);
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

  /* Campo, opção e cartão vivem em `style` inline sobre os tokens `--sm2-*`:
     o Tailwind daqui é PRÉ-COMPILADO, então classe utilitária que não existe
     no `index.css` não aplica nada e não avisa (footgun 1). O kit `sm-px-*`
     (moldura chanfrada, banda de quina) saiu — ele fica dentro do visor e nas
     telas de arcade, e um formulário nunca foi nenhum dos dois. */
  const fieldStyle: CSSProperties = {
    width: '100%', boxSizing: 'border-box', minHeight: 44,
    padding: '10px 12px', borderRadius: 10,
    border: '1px solid var(--sm2-line)',
    backgroundColor: 'var(--sm2-surface-2)',
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    lineHeight: 'var(--sm2-leading-body)',
    color: 'var(--sm2-ink)',
    outline: 'none',
  };
  /** Opção de escolha única. Selecionado = FILL, e o texto por cima usa
   *  `--sm2-on-primary` — nunca o `*-ink` do mesmo acento. */
  const optionBtn = (selected: boolean): CSSProperties => ({
    width: '100%', boxSizing: 'border-box', textAlign: 'left',
    minHeight: 44, padding: '12px 14px', marginBottom: 8, borderRadius: 10,
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    lineHeight: 'var(--sm2-leading-body)',
    fontWeight: selected ? 600 : 400,
    cursor: 'pointer',
    border: selected ? '1px solid transparent' : '1px solid var(--sm2-line)',
    backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)',
    color: selected ? 'var(--sm2-on-primary)' : 'var(--sm2-ink)',
    transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: 'var(--sm2-bg)',
      color: 'var(--sm2-ink)',
      fontFamily: 'var(--sm2-font-text)',
    }}>
      <style>{SPIN_CSS}</style>
      {/* 28/08/2026: a moldura saiu DAQUI TAMBÉM — vivia só nesta tela desde
          27/08 (o `App.tsx` já tinha parado de montá-la), mas isso nunca foi
          uma decisão de design; era o resíduo de tirar o `PixelFrame` da
          Home. O dono revisou e pediu consistência total: nenhuma tela do
          app leva mais a linha de cobre ao redor. */}
      {oracleDebugOpen ? (
        /* Ferramenta interna de dev, carregada por `lazy()`. O `fallback` era
           `null` — meio segundo de tela branca; agora é o esqueleto do visor. */
        <Suspense fallback={<ScreenSkeleton language={isPt ? 'pt-BR' : 'en-US'} />}>
          <div style={{ width: '100%', maxWidth: 440, padding: '20px 20px 40px' }}>
            <button
              type="button"
              style={{ ...sm2Button('ghost'), marginBottom: 12 }}
              onClick={() => setOracleDebugOpen(false)}
            >
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Fechar' : 'Close'}
            </button>
            <OraclePage language={isPt ? 'pt-BR' : 'en-US'} initialDebugMode />
          </div>
        </Suspense>
      ) : (
      <div style={{ width: '100%', maxWidth: 440, padding: '24px 20px 40px' }}>
        {/* Barra de progresso. O DENOMINADOR não mudou nesta rodada: ele já
            inclui o tutorial que vem depois do onboarding (antes a barra
            chegava a 100% e ainda apareciam telas) e já desconta o bloco de 20
            itens de quem recusa o teste longo. */}
        {step > 0 && step <= lastStep && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={isPt ? 'Progresso do ritual' : 'Ritual progress'}
            style={{
              height: 6, borderRadius: 999, marginBottom: 24, overflow: 'hidden',
              backgroundColor: 'var(--sm2-surface-2)',
              border: '1px solid var(--sm2-line)',
            }}
          >
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              backgroundColor: 'var(--sm2-primary-fill)',
              transition: 'width var(--sm2-dur-page) var(--sm2-ease)',
            }} />
          </div>
        )}

        {/* 0 — Intro. UMA ação dominante: começar. Os dois parágrafos de
            propaganda que ficavam embaixo dos botões saíram — nenhum deles
            decidia nada que o rótulo do botão já não dissesse, e eram a
            primeira parede de texto que o app mostrava. */}
        {step === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            {/* Corvo + wordmark são UM logo só, e é ele o alvo do gesto oculto
                (segurar ~1.8s abre a OraclePage em modo debug). Como o alvo
                inclui TEXTO, `userSelect`/`touchCallout` precisam sair: segurar
                em texto no mobile abre seleção e menu de contexto, que comeriam
                o gesto. `touchAction: manipulation` mata o atraso de
                duplo-toque sem bloquear o scroll da página. */}
            <div
              style={{
                display: 'inline-block',
                userSelect: 'none', WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none', touchAction: 'manipulation',
              }}
              onPointerDown={startOracleDebugHold}
              onPointerUp={cancelOracleDebugHold}
              onPointerLeave={cancelOracleDebugHold}
              onPointerCancel={cancelOracleDebugHold}
            >
              <img src={ravenMascot} alt="" width={72} height={72}
                style={{ display: 'block', margin: '0 auto 16px', objectFit: 'contain', imageRendering: 'pixelated' }}
                draggable={false} />
              <h1 style={{
                fontFamily: 'var(--sm2-font-display)',
                fontSize: 'var(--sm2-text-2xl)',
                lineHeight: 'var(--sm2-leading-title)',
                fontWeight: 600, letterSpacing: '.01em',
                color: 'var(--sm2-ink)', margin: '0 0 10px',
              }}>Soulmon</h1>
            </div>
            <p style={{ ...sm2Text, color: 'var(--sm2-muted)', margin: '0 0 28px' }}>
              {isPt
                ? 'Toda alma carrega uma criatura. Responda algumas perguntas e revele a SUA.'
                : 'Every soul carries a creature. Answer a few questions and reveal YOURS.'}
            </p>
            {/* Começar grátis é o caminho PRINCIPAL. Pedir R$ 29,90 de quem
                ainda não viu o app funcionar é o jeito mais caro de perder o
                usuário; quem gostar encontra a compra no app inteiro. */}
            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => { setFlow('demo'); setStep(GOAL_STEP); }}
            >
              {isPt ? 'Começar agora — é grátis' : 'Start now — it’s free'}
            </button>
            {/* A compra continua acessível, mas em voz baixa: é a segunda ação
                da tela, e duas ações do mesmo peso não têm ação dominante. */}
            <button
              type="button"
              style={{ ...sm2Button('quiet', unlockLoading), width: '100%', marginTop: 8 }}
              onClick={handleUnlockFull}
              disabled={unlockLoading}
            >
              {unlockLoading
                ? <Spinner />
                : (isPt ? `Quero o completo — ${FULL_UNLOCK_PRICE_LABEL}` : `Get the full game — ${FULL_UNLOCK_PRICE_LABEL}`)}
            </button>
            {unlockMessage && (
              <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)', marginTop: 16 }}>
                {unlockMessage}
              </p>
            )}
          </div>
        )}

        {/* GOAL_STEP / STRUGGLE_STEP — o "porquê", antes de qualquer mecânica */}
        {(step === GOAL_STEP || step === STRUGGLE_STEP) && (
          <div style={{ paddingTop: 28 }}>
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 8 }}>
              {step === GOAL_STEP
                ? (isPt ? 'O que você quer melhorar na sua vida?' : 'What do you want to improve in your life?')
                : (isPt ? 'E o que mais te atrapalha hoje?' : 'And what gets in your way the most?')}
            </h2>
            <p style={{ ...sm2Hint, marginBottom: 16 }}>
              {step === GOAL_STEP
                ? (isPt
                    ? 'Escreva do seu jeito. Nada aqui vira nota ou cobrança.'
                    : 'In your own words. None of this becomes a score.')
                : (isPt
                    ? 'Saber onde você costuma travar ajuda seu Soulmon nos dias difíceis.'
                    : 'Knowing where you tend to get stuck helps your Soulmon on the hard days.')}
            </p>
            <textarea
              rows={4}
              autoFocus
              style={{ ...fieldStyle, resize: 'none', fontFamily: 'var(--sm2-font-text)' }}
              value={step === GOAL_STEP ? soulGoal : soulStruggle}
              onChange={e => (step === GOAL_STEP ? setSoulGoal : setSoulStruggle)(e.target.value.slice(0, 280))}
              placeholder={step === GOAL_STEP
                ? (isPt ? 'Ex.: quero voltar a estudar sem me cobrar tanto' : 'e.g. get back to studying without beating myself up')
                : (isPt ? 'Ex.: começo animado e largo na segunda semana' : 'e.g. I start strong and quit in week two')}
            />
            <button type="button" style={{ ...sm2Button('primary'), width: '100%', marginTop: 16 }} onClick={next}>
              {isPt ? 'Continuar' : 'Continue'}
              <Icon name="arrow_forward" size={20} />
            </button>
            {/* Pular é de propósito: obrigar a escrever antes de ver o app é o
                jeito mais rápido de perder alguém logo na primeira tela. */}
            <button
              type="button"
              style={{ ...sm2Button('quiet'), width: '100%', marginTop: 4 }}
              onClick={() => { (step === GOAL_STEP ? setSoulGoal : setSoulStruggle)(''); next(); }}
            >
              {isPt ? 'Prefiro não responder agora' : 'I’d rather not say right now'}
            </button>
          </div>
        )}

        {/* CONSENT_STEP — Termos + Política ANTES de nome e data de nascimento
            (D-07). A caixa de aceite fica FORA e visualmente separada do bloco
            dos links legais: é elemento de UI próprio, com rótulo e foco. Uma
            caixa embutida no meio do texto dos Termos não vale como
            consentimento específico (achado do run 01). */}
        {step === CONSENT_STEP && (
          <StepShell
            title={isPt ? 'Antes de começar' : 'Before we start'}
            hint={isPt
              ? 'Você pode ler os dois documentos agora — eles abrem numa aba nova e seu progresso aqui não se perde.'
              : 'You can read both documents now — they open in a new tab and nothing here is lost.'}>
            <p style={{ ...sm2Text, color: 'var(--sm2-muted)', margin: '0 0 16px' }}>
              {isPt
                ? 'Para criar sua conta, precisamos que você leia (ou pelo menos saiba que existem) nossos Termos de Uso e nossa Política de Privacidade. Neles explicamos o que o Soulmon faz com seus dados e o que esperamos um do outro.'
                : 'To create your account, we need you to read (or at least know they exist) our Terms of Use and our Privacy Policy. They explain what Soulmon does with your data and what we expect from each other.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <a
                href={isPt ? '/termos.html' : '/termos.html#en'}
                target="_blank" rel="noopener noreferrer"
                style={{ ...sm2Button('ghost'), width: '100%', textDecoration: 'none' }}
              >
                {isPt ? 'Ler os Termos de Uso' : 'Read the Terms of Use'}
              </a>
              <a
                href={isPt ? '/privacidade.html' : '/privacidade.html#en'}
                target="_blank" rel="noopener noreferrer"
                style={{ ...sm2Button('ghost'), width: '100%', textDecoration: 'none' }}
              >
                {isPt ? 'Ler a Política de Privacidade' : 'Read the Privacy Policy'}
              </a>
            </div>
            {/* Separador: a caixa não pertence ao bloco de links acima. */}
            <div style={{ height: 1, backgroundColor: 'var(--sm2-line)', margin: '0 0 12px' }} />
            {/* Idade no caminho DEMO. O caminho do Oráculo confere pela data
                cheia do mapa astral (passo 2); o demo nunca chega lá, e sem
                este campo o 18+ valeria só para quem paga. Pede o MÍNIMO que
                responde a pergunta — mês e ano — e diz para que serve. */}
            {demoNeedsAge && (
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="sm-demo-age" style={{ ...sm2Label, display: 'block', marginBottom: 6 }}>
                  {isPt ? 'Em que mês e ano você nasceu?' : 'What month and year were you born?'}
                </label>
                <Field id="sm-demo-age" type="text" inputMode="numeric" autoComplete="off"
                  value={demoAgeText}
                  placeholder={isPt ? '__/____ (MM/AAAA)' : '__/____ (MM/YYYY)'}
                  onChange={e => handleDemoAgeChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  maxLength={7} />
                <p style={{ ...sm2Hint, marginTop: 6 }}>
                  {isPt
                    ? `Serve só para confirmar que você tem ${MIN_AGE_YEARS} anos ou mais, a idade mínima do Soulmon. Por isso pedimos só o mês e o ano — não guardamos essa resposta e ela não é usada para mais nada.`
                    : `This is only to confirm you're ${MIN_AGE_YEARS} or older, Soulmon's minimum age. That's why we ask for the month and year only — we don't store this answer and it isn't used for anything else.`}
                </p>
              </div>
            )}
            <CheckRow checked={consentChecked} onChange={setConsentChecked}>
              {isPt
                ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
                : 'I have read and agree to the Terms of Use and the Privacy Policy'}
            </CheckRow>
            <button
              type="button"
              style={{ ...sm2Button('primary', !canAdvance()), width: '100%', marginTop: 16 }}
              onClick={next}
              disabled={!canAdvance()}
            >
              {isPt ? 'Continuar' : 'Continue'}
              <Icon name="arrow_forward" size={20} />
            </button>
            {!canAdvance() && (
              <p style={{ ...sm2Hint, marginTop: 8, textAlign: 'center' }}>
                {!consentChecked
                  ? (isPt ? 'Marque a caixa acima para continuar.' : 'Check the box above to continue.')
                  : (isPt ? 'Preencha o mês e o ano (MM/AAAA) para continuar.' : 'Fill in the month and year (MM/YYYY) to continue.')}
              </p>
            )}
            <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 4 }} onClick={back}>
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
          </StepShell>
        )}

        {/* AGE_BLOCK — muro de idade. Convite adiado, NÃO expulsão: sem "erro",
            sem ícone de alerta, sem vermelho. A voz do produto encoraja, e isso
            vale inclusive aqui. */}
        {step === AGE_BLOCK && (
          <StepShell
            title={isPt ? 'Ainda não dá para continuar' : 'Not quite yet'}
            hint={isPt
              ? `O Soulmon pede ${MIN_AGE_YEARS} anos.`
              : `Soulmon asks for ${MIN_AGE_YEARS}+.`}>
            <p style={{ ...sm2Text, color: 'var(--sm2-muted)', margin: '0 0 20px' }}>
              {isPt
                ? 'O Soulmon é feito para maiores de 18 anos, e pelo que você respondeu você ainda não chegou lá. Não é nada que você tenha feito errado — é só o tanto que o app pede pra funcionar do jeito que ele foi pensado. Volte quando fizer 18 anos; vamos estar aqui.'
                : "Soulmon is built for people 18 and older, and based on what you entered, you're not there yet. This isn't about anything you did wrong — it's just what the app needs to work the way it was designed. Come back when you turn 18; we'll be here."}
            </p>
            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={restartFromAgeBlock}
            >
              {isPt ? 'Voltar ao início' : 'Back to start'}
            </button>
          </StepShell>
        )}

        {/* DEMO_PICK — escolha entre os 3 personagens pré-prontos */}
        {step === DEMO_PICK && (
          <div style={{ paddingTop: 20 }}>
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 16 }}>
              {isPt ? 'Escolha seu Soulmon' : 'Choose your Soulmon'}
            </h2>
            {PREMADE_CHARACTERS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { track('demo_pick'); setDemoCharacterId(c.id); setStep(REGISTER); }}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, marginBottom: 8, cursor: 'pointer',
                  borderRadius: 12, border: '1px solid var(--sm2-line)',
                  backgroundColor: 'var(--sm2-surface)',
                }}
              >
                <img src={getDemoSprite(c.id, 'rookie')} alt="" style={{ width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...sm2Text, fontWeight: 500, display: 'block' }}>{c.name}</span>
                  <span style={{ ...sm2Hint, display: 'block', marginTop: 2 }}>{isPt ? c.bioPt : c.bioEn}</span>
                </span>
              </button>
            ))}
            <button type="button" style={{ ...sm2Button('quiet'), marginTop: 4 }} onClick={() => { setFlow(null); setStep(0); }}>
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
          </div>
        )}

        {/* 1 — Nome */}
        {step === 1 && (
          <StepShell title={isPt ? 'Qual é o seu nome completo?' : 'What is your full name?'}
            hint={isPt ? 'Seu nome molda a numerologia da sua criatura.' : 'Your name shapes your creature\'s numerology.'}>
            <Field type="text" value={fullName} autoFocus
              onChange={e => setFullName(e.target.value)}
              placeholder={isPt ? 'Ex.: Maria da Silva' : 'E.g.: Jane Doe'}
              onKeyDown={e => e.key === 'Enter' && next()} />
          </StepShell>
        )}

        {/* 2 — Data */}
        {step === 2 && (
          /* A data tem DOIS propósitos e a tela diz os dois: mapa astral E
             confirmação de 18+ (D-06). Um campo que verifica idade sem avisar
             é coleta silenciosa. */
          <StepShell title={isPt ? 'Quando você nasceu?' : 'When were you born?'}
            hint={isPt
              ? `Sua data de nascimento faz duas coisas aqui: define os elementos do seu mapa astral e confirma que você tem ${MIN_AGE_YEARS} anos ou mais, a idade mínima do Soulmon.`
              : `Your birth date does two things here: it sets your astral chart's elements and confirms you're ${MIN_AGE_YEARS} or older, Soulmon's minimum age.`}>
            <Field type="text" inputMode="numeric" autoComplete="off"
              value={birthDateText} autoFocus
              placeholder={isPt ? '__/__/____ (DD/MM/AAAA)' : '__/__/____ (DD/MM/YYYY)'}
              onChange={e => handleBirthDateChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
              maxLength={10} />
          </StepShell>
        )}

        {/* 3 — Hora (com saída honesta para quem não sabe) */}
        {step === 3 && (
          <StepShell title={isPt ? 'A que horas?' : 'At what time?'}
            hint={isPt
              ? 'A hora define o Ascendente e as casas do seu mapa.'
              : 'The hour sets the Ascendant and the houses of your chart.'}>
            <Field type="time" value={birthTime}
              disabled={timeUnknown}
              style={{ opacity: timeUnknown ? 0.5 : 1 }}
              onChange={e => setBirthTime(e.target.value)} />
            {/* Sem hora, o mapa NÃO inventa Ascendente — ele desliga o cálculo
                e avisa. Obrigar um palpite seria pedir para a pessoa mentir
                num dado que desloca o mapa inteiro. */}
            <div style={{ marginTop: 8 }}>
              <CheckRow checked={timeUnknown} onChange={setTimeUnknown}>
                {isPt ? 'Não sei a hora que nasci' : "I don't know my birth time"}
              </CheckRow>
            </div>
            {timeUnknown && (
              <p style={{ ...sm2Hint, marginTop: 4 }}>
                {isPt
                  ? 'Sem problema: usamos meio-dia, e o mapa fica sem Ascendente em vez de fingir precisão.'
                  : 'No problem: we use noon, and the chart goes without an Ascendant instead of faking precision.'}
              </p>
            )}
          </StepShell>
        )}

        {/* 4 — Local (cidade da tabela: lat/lon + fuso IANA) */}
        {step === 4 && (
          <StepShell title={isPt ? 'Onde você nasceu?' : 'Where were you born?'}
            hint={isPt
              ? 'O lugar posiciona o céu do seu nascimento — e o fuso certo.'
              : 'The place positions the sky at your birth — and the right timezone.'}>
            <CityPicker value={birthCity} onChange={setBirthCity} isPt={isPt}
              inputStyle={fieldStyle} optionStyle={optionBtn} />
          </StepShell>
        )}

        {/* 5 — Criatura favorita (opcional) */}
        {step === FAVORITE_STEP && (
          <StepShell title={isPt ? 'Qual sua criatura favorita?' : "What's your favorite creature?"}
            hint={isPt ? 'Opcional — até 2 palavras. Ela influencia a aparência da sua criatura.' : 'Optional — up to 2 words. It shapes how your creature looks.'}>
            <Field type="text" value={favoriteCreature} autoFocus
              disabled={skipFavorite}
              style={{ opacity: skipFavorite ? 0.5 : 1 }}
              onChange={e => setFavoriteCreature(e.target.value.split(/\s+/).slice(0, 2).join(' '))}
              placeholder={isPt ? 'Ex.: axolote' : 'E.g.: axolotl'}
              onKeyDown={e => e.key === 'Enter' && next()} />
            <div style={{ marginTop: 8 }}>
              <CheckRow checked={skipFavorite} onChange={setSkipFavorite}>
                {isPt ? 'Prefiro não influenciar o resultado' : "I'd rather not influence the result"}
              </CheckRow>
            </div>
          </StepShell>
        )}

        {/* 6..11 — As 6 perguntas do ritual (uma por página). O NÚMERO delas é
            regra de produto e não muda: só a roupa mudou. */}
        {step >= QUIZ_START && step < QUIZ_END && (() => {
          const q = ORACLE_QUESTIONS[step - QUIZ_START];
          return (
            <StepShell title={L(q.text)}
              hint={isPt
                ? `Pergunta ${step - QUIZ_START + 1} de ${ORACLE_QUESTIONS.length}`
                : `Question ${step - QUIZ_START + 1} of ${ORACLE_QUESTIONS.length}`}>
              <div>
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button key={opt.id} type="button" aria-pressed={selected} style={optionBtn(selected)}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [q.id]: opt.id }));
                        // avança sozinho após escolher (fluido)
                        setTimeout(() => setStep(s => s + 1), 180);
                      }}>
                      {L(opt.text)}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          );
        })()}

        {/* 12 — A bifurcação. Decisão SEM VOLTA, e a tela diz isso. */}
        {step === REFINE_OFFER && (
          <StepShell
            title={isPt ? 'Quer afinar a leitura?' : 'Want to sharpen the reading?'}
            hint={isPt
              ? 'Esta escolha não tem volta — não dá para responder o teste depois.'
              : "This choice is final — there's no answering the test later."}>
            <p style={{ ...sm2Text, color: 'var(--sm2-muted)', margin: '0 0 18px' }}>
              {isPt
                ? `Seu Soulmon já pode nascer agora. Se quiser, dá para responder mais ${SOUL_TEST_ITEMS.length} perguntas sobre você — elas afinam quem seu Soulmon vai ser.`
                : `Your Soulmon can be born right now. If you like, you can answer ${SOUL_TEST_ITEMS.length} more questions about yourself — they sharpen who it turns out to be.`}
            </p>
            <button type="button" style={{ ...sm2Button('primary'), width: '100%', marginBottom: 8 }}
              onClick={() => chooseRefine(true)}>
              {isPt ? `Responder mais ${SOUL_TEST_ITEMS.length} perguntas` : `Answer ${SOUL_TEST_ITEMS.length} more questions`}
            </button>
            <button type="button" style={{ ...sm2Button('ghost'), width: '100%' }}
              onClick={() => chooseRefine(false)}>
              {isPt ? 'Revelar meu Soulmon agora' : 'Reveal my Soulmon now'}
            </button>
            {generateError && (
              <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)', marginTop: 14 }}>
                {isPt
                  ? 'Não foi possível revelar sua criatura agora. Escolha de novo para tentar outra vez.'
                  : "We couldn't reveal your creature just now. Choose again to retry."}
              </p>
            )}
          </StepShell>
        )}

        {/* 13..32 — O teste longo, só para quem aceitou (um item por página) */}
        {step >= DEEP_START && step < DEEP_END && (() => {
          const item = SOUL_TEST_ITEMS[step - DEEP_START];
          const index = step - DEEP_START;
          return (
            <StepShell title={L(itemPrompt(item))} hint={itemHint(item, index, SOUL_TEST_ITEMS.length, isPt)}>
              <SoulTestItem
                item={item}
                answer={testAnswers[item.id]}
                isPt={isPt}
                optionStyle={optionBtn}
                onAnswer={answer => {
                  const nextTest = { ...testAnswers, [item.id]: answer };
                  setTestAnswers(nextTest);
                  setTimeout(() => {
                    if (step === DEEP_END - 1) { setStep(GENERATING); setTimeout(() => runGenerate(nextTest), 1400); }
                    else setStep(s => s + 1);
                  }, 180);
                }}
              />
            </StepShell>
          );
        })()}

        {/* Gerando */}
        {step === GENERATING && (
          <div style={{ textAlign: 'center', paddingTop: 90 }} role="status" aria-live="polite">
            <img src={ravenMascot} alt="" width={64} height={64}
              style={{ display: 'block', margin: '0 auto 8px', objectFit: 'contain', imageRendering: 'pixelated' }} />
            <Spinner size={32} />
            <p style={{ ...sm2Text, color: 'var(--sm2-muted)', marginTop: 12 }}>
              {isPt ? 'Revelando a criatura da sua alma…' : 'Revealing your soul\'s creature…'}
            </p>
          </div>
        )}

        {/* Reveal — apenas nome + descrição breve */}
        {step === REVEAL && result && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ ...sm2Hint, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 500 }}>
              {isPt ? 'A criatura da sua alma' : 'Your soul\'s creature'}
            </p>
            <h1 style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-2xl)',
              lineHeight: 'var(--sm2-leading-title)',
              fontWeight: 600, color: 'var(--sm2-ink)',
              margin: '8px 0 8px',
            }}>
              {result.creature.baseName}
            </h1>

            {essence && (
              <p style={{ ...sm2Hint, color: 'var(--sm2-gold-ink)', fontWeight: 500, margin: '0 0 16px' }}>
                {isPt ? essence.pt : essence.en}
              </p>
            )}

            <div style={{
              padding: '16px 16px', marginBottom: 24, borderRadius: 12,
              border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
              textAlign: 'left',
            }}>
              <p style={{ ...sm2Text, margin: 0 }}>{L(result.creature.bio)}</p>
            </div>

            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => { if (isUpgrade) onRevealed?.(result); else setStep(REGISTER); }}
            >
              {isUpgrade
                ? (isPt ? `Nascer ${result.creature.baseName}` : `Hatch ${result.creature.baseName}`)
                : (isPt ? 'Continuar' : 'Continue')}
              <Icon name="arrow_forward" size={20} />
            </button>
          </div>
        )}

        {/* Register — nickname (identidade pública) + e-mail (sync) */}
        {step === REGISTER && (result || demoChar) && (
          <div style={{ paddingTop: 20 }}>
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 18 }}>
              {isPt ? 'Últimos detalhes' : 'Last details'}
            </h2>

            {/* BATISMO — o Soulmon já foi gerado e já tem nome sugerido; o
                campo vem PREENCHIDO com ele. Manter é seguir em frente, trocar
                é digitar por cima. Um formulário vazio aqui obrigaria a
                inventar um nome no meio do cadastro. */}
            <label style={sm2Label} htmlFor="onb-petname">
              {isPt ? 'Batize seu Soulmon' : 'Name your Soulmon'}
            </label>
            <Field id="onb-petname" type="text" value={petNameValue} maxLength={24}
              onChange={e => setPetNameEdit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canFinish && finish()} />
            <p style={{ ...sm2Hint, margin: '6px 0 18px' }}>
              {isPt
                ? `${registerDisplayName} é o nome que veio com seu Soulmon. Se quiser dar outro, é só escrever por cima.`
                : `${registerDisplayName} is the name it came with. Want to give it another? Just type over it.`}
            </p>

            <label style={sm2Label} htmlFor="onb-nick">
              {isPt ? 'Seu apelido' : 'Your nickname'}
            </label>
            <Field id="onb-nick" type="text" value={nickname} autoFocus maxLength={24}
              onChange={e => setNickname(e.target.value)}
              placeholder={isPt ? 'Ex.: CorvoAzul' : 'E.g.: BlueRaven'}
              onKeyDown={e => e.key === 'Enter' && canFinish && finish()} />
            {/* Enquadramento, não aviso: este apelido aparece para outros
                jogadores, e a pessoa escolhe o que mostrar. Dizer que pode ser
                inventado é o que faz o nome real deixar de vazar por engano —
                sem transformar a tela num alerta de perigo. */}
            <p style={{ ...sm2Hint, margin: '6px 0 18px' }}>
              {isPt
                ? 'Aparece para outros jogadores na Biblioteca e no Torneio. Pode ser um apelido inventado — não precisa ser seu nome real.'
                : "Shown to other players in the Library and Tournament. It can be a made-up name — it doesn't have to be your real name."}
            </p>

            <label style={sm2Label} htmlFor="onb-email">
              {isPt ? 'Seu e-mail' : 'Your email'}
              {!emailRequired && (isPt ? ' (opcional)' : ' (optional)')}
            </label>
            <Field id="onb-email" type="email" value={email} autoComplete="email"
              aria-invalid={emailError || undefined}
              onChange={e => { setEmail(e.target.value); setEmailError(false); }}
              placeholder="voce@exemplo.com"
              onKeyDown={e => e.key === 'Enter' && canFinish && finish()} />
            <p style={{ ...sm2Hint, color: emailError ? 'var(--sm2-danger-ink)' : 'var(--sm2-muted)', margin: '6px 0 0' }}>
              {emailError
                ? (isPt ? 'Digite um e-mail válido.' : 'Enter a valid email.')
                : emailRequired
                  ? (isPt ? 'Garante que seu progresso não se perca ao trocar de aparelho.' : 'Makes sure your progress survives a device change.')
                  : (isPt ? 'Só serve para não perder o progresso. Dá para deixar em branco.' : 'Only used so your progress survives a device change. You can leave it blank.')}
            </p>

            {linkSent ? (
              // Link enviado: o onboarding continua quando o usuário voltar
              // pelo e-mail (App.tsx detecta o link e conclui o login).
              <div style={{
                marginTop: 24, padding: 16, borderRadius: 12,
                backgroundColor: 'var(--sm2-primary-soft)',
              }}>
                <p style={{ ...sm2Text, fontWeight: 500, margin: 0, color: 'var(--sm2-primary-ink)' }}>
                  {isPt ? 'Confira seu e-mail' : 'Check your email'}
                </p>
                <p style={{ ...sm2Hint, marginTop: 6 }}>
                  {isPt
                    ? `Mandamos um link de acesso para ${email.trim().toLowerCase()}. Abra o link NESTE aparelho para continuar.`
                    : `We sent a sign-in link to ${email.trim().toLowerCase()}. Open it ON THIS DEVICE to continue.`}
                </p>
                <button
                  type="button"
                  style={{ ...sm2Button('ghost'), width: '100%', marginTop: 14 }}
                  onClick={() => { setLinkSent(false); setUnlockMessage(null); }}
                >
                  {isPt ? 'Usar outro e-mail' : 'Use a different email'}
                </button>
              </div>
            ) : (
              <>
                <button type="button" style={{ ...sm2Button('primary', !canFinish), width: '100%', marginTop: 24 }}
                  onClick={finish} disabled={!canFinish}>
                  {submitting
                    ? <Spinner />
                    : (isPt ? `Nascer ${petNameFinal}` : `Hatch ${petNameFinal}`)}
                </button>
                {/* Sem isto o botão só ficava apagado e o toque não fazia nada —
                    o usuário não tinha como saber o que faltava. */}
                {!canFinish && !submitting && (
                  <p style={{ ...sm2Hint, marginTop: 8, textAlign: 'center' }}>
                    {nickname.trim().length < 2
                      ? (isPt ? 'Escolha um apelido com pelo menos 2 letras.' : 'Pick a nickname with at least 2 letters.')
                      : (isPt ? 'Falta o e-mail.' : 'Your email is missing.')}
                  </p>
                )}
              </>
            )}
            {unlockMessage && !linkSent && (
              <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)', marginTop: 12 }}>{unlockMessage}</p>
            )}
          </div>
        )}

        {/* Navegação (para passos com input manual) */}
        {step >= 1 && step <= FAVORITE_STEP && (
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button type="button" style={sm2Button('ghost')} onClick={back} aria-label={isPt ? 'Voltar' : 'Back'}>
              <Icon name="arrow_back" size={20} />
            </button>
            <button type="button" style={{ ...sm2Button('primary', !canAdvance()), flex: 1 }} onClick={next} disabled={!canAdvance()}>
              {isPt ? 'Continuar' : 'Continue'}
              <Icon name="arrow_forward" size={20} />
            </button>
          </div>
        )}
        {/* Passos que avançam sozinhos ao escolher: só precisam de "voltar".
            Cobre as 6 do ritual (da 2ª em diante) E os 20 itens do teste — do
            PRIMEIRO item em diante, porque voltar de lá devolve a bifurcação
            para quem entrou no teste longo sem querer. */}
        {((step > QUIZ_START && step < QUIZ_END) || (step >= DEEP_START && step < DEEP_END)) && (
          <button type="button" style={{ ...sm2Button('quiet'), marginTop: 4 }} onClick={back}>
            <Icon name="arrow_back" size={20} />
            {isPt ? 'Voltar' : 'Back'}
          </button>
        )}
      </div>
      )}
    </div>
  );
}

/** O casco de um passo: título em Fredoka, legenda em Rubik no piso de 12px. */
function StepShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 6 }}>{title}</h2>
      {hint && <p style={{ ...sm2Hint, marginBottom: 18 }}>{hint}</p>}
      {children}
    </div>
  );
}
