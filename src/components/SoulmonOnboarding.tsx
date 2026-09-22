import { useState, useRef, useEffect, lazy, Suspense, type CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { Viewport } from './ui/Viewport';
import { BrandFlame } from '../brand/BrandFlame';
import { BirthCard } from './BirthCard';
import { DEMO_TINTS, demoTintFilter, getSpriteForStage } from '../utils/sprites';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';
import { ScreenSkeleton } from './ui/ScreenSkeleton';
import { sm2Button, sm2Hint, sm2Label, sm2Text, sm2TitleStyle, Field, CheckRow } from './form/FormKit';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readLocal, writeJson, removeLocal } from '../utils/safeStorage';
import { readOracleDraft, writeOracleDraft, clearOracleDraft } from '../utils/oracleDraft';
import { readGateDraft, writeGateDraft, clearGateDraft } from '../utils/gateDraft';
import {
  buildConsentRecord, isAgeBlocked, MIN_AGE_YEARS,
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
import { PREMADE_CHARACTERS, getDemoSprite, FULL_UNLOCK_SKU } from '../utils/monetization';
import { useUnlockPriceLabel } from '../utils/priceLabel';
import { purchase, isBillingAvailable } from '../utils/playBilling';
import { checarContaExcluidaNoLogin } from '../utils/cloudSave';
import {
  isAuthConfigured, getCurrentEmail, entrarComSenha, criarContaComSenha,
  entrarComGoogle, mandarResetDeSenha, type AuthErro,
} from '../utils/auth';
import { resolveLanguage } from '../utils/i18n';
import { track, flush as flushTelemetry, onboardingStepCode, TELEMETRY_FUNNEL, TELEMETRY_PURCHASE_REASON, revealDurationBucket, unlockReasonCode } from '../utils/telemetry';
import { UnlockNudge } from './UnlockAccountModal';
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

/**
 * Todo `role=alert` do funil é ÂMBAR (canvas Onboarding-funil D-O7 / SIS-06):
 * filete 3px `gold-ink` + texto 14 `ink`. Nenhuma dessas mensagens é culpa
 * da pessoa (pop-up bloqueado, janela sem resposta, compra cancelada, loja
 * indisponível) — âmbar convida, vermelho acusa; `danger-ink` fica para o
 * irreversível. O `role=status` (boa notícia: reset enviado) leva o filete
 * em `primary-ink`.
 */
const alertStyle: CSSProperties = {
  ...sm2Text,
  margin: 0,
  paddingLeft: 12,
  borderLeft: '3px solid var(--sm2-gold-ink)',
};
const statusStyle: CSSProperties = { ...alertStyle, borderLeftColor: 'var(--sm2-primary-ink)' };

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
  | {
      mode: 'oracle';
      oracleResult: OracleResult;
      /** WP1.1 — o sprite da forma inicial, quando ele chegou a tempo do
       *  reveal. Vem daqui para o app poder ADOTAR o mesmo desenho que a
       *  pessoa acabou de ver: gerar de novo depois entregaria outro bicho no
       *  primeiro minuto, que é o oposto do que a cerimônia promete. */
      revealSprite?: { url: string; formId: string; at: number };
    }
  | {
      mode: 'demo';
      demoCharacterId: 'kaelen' | 'orrin' | 'thalindra' | 'igni' | 'nautilu' | 'astrase';
      /** WP1.12 — tonalidade escolhida. Cosmética; 0 = arte original. */
      demoTint?: number;
    }
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
  onRevealed?: (result: OracleResult, revealSprite?: { url: string; formId: string; at: number }) => void;
  /** Só em 'upgrade': desistir e voltar ao jogo. */
  onCancel?: () => void;
}

/**
 * WP1.1 — quanto o reveal espera pelo desenho antes de seguir só com o texto.
 *
 * 12s e não "o tempo que precisar": a espera é cerimônia enquanto tem fim
 * anunciado; sem teto ela vira tela travada, e travar alguém no primeiro
 * minuto de uso é o pior lugar possível para isso acontecer. Se o desenho
 * chegar depois, ele entra no jogo pelo caminho normal do acervo.
 */
export const REVEAL_WAIT_MS = 12_000;

/**
 * REDE DE SEGURANÇA DO LOGIN COM GOOGLE — o botão não pode travar para sempre.
 *
 * O fluxo de pop-up do Firebase descobre que a pessoa desistiu de UMA forma só:
 * `pollUserCancellation`, um laço que lê `popup.closed` de 2 em 2 segundos. É
 * ele que rejeita com `auth/popup-closed-by-user`, e é a única coisa que faz o
 * `await entrarComGoogle()` terminar quando a janela é fechada sem escolher
 * conta.
 *
 * Em 09/09/2026 o console de produção mostrou, duas vezes:
 *
 *     Cross-Origin-Opener-Policy policy would block the window.closed call.
 *       pollUserCancellation → setTimeout → …
 *
 * O `accounts.google.com` manda COOP e corta a relação com a janela que o
 * abriu, então esse `closed` fica ilegível deste lado. O caminho felizo passa
 * (confirmado pelo dono: entrou normalmente), mas se a promessa não terminar
 * quando alguém fecha a janela, o `authOcupado` nunca volta a `false` e o botão
 * fica desabilitado, sem mensagem, na PRIMEIRA tela do app — com recarregar a
 * página como única saída.
 *
 * ⚠️ **É hipótese, e não reprodução**: leitura do código (não existe timeout
 * nenhum em `utils/auth.ts`) mais o aviso do COOP. Não deu para reproduzir o
 * fechamento da janela em ambiente automatizado, e não verifiquei se o Firebase
 * desiste sozinho depois de algum tempo.
 *
 * Por isso a correção é uma REDE, não um cancelamento: passado este prazo o
 * botão volta e uma mensagem honesta aparece, **e a promessa original continua
 * viva**. Se o login concluir depois, `aposAutenticar` roda e a pessoa entra
 * normalmente — a rede nunca derruba um login de verdade.
 *
 * 2 minutos: escolher conta, digitar senha e resolver um segundo fator cabem
 * folgados. O outro caminho, mexer no `Cross-Origin-Opener-Policy` do
 * `public/_headers`, é decisão do dono e está registrado em `docs/STATUS.md` —
 * cabeçalho já derrubou este login uma vez (a CSP, em 07/09/2026).
 */
export const GOOGLE_SEM_RESPOSTA_MS = 120_000;

interface SavedProfile extends OracleInput { seed: number }

export function SoulmonOnboarding({ onComplete, mode = 'onboarding', onRevealed, onCancel }: SoulmonOnboardingProps) {
  // WP5.8 — o preço que o Play vai cobrar NESTE aparelho; fora do Android
  // nativo cai na constante publicada (`utils/priceLabel.ts`).
  const isUpgrade = mode === 'upgrade';
  const isPt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
  const precoLabel = useUnlockPriceLabel(isPt);
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
  // REGISTRO 13.19 (canvas Onboarding-oráculo §31, achado 10): o caminho
  // grátis responde as 6 perguntas do ritual e vê o REVEAL DEMO — a leitura
  // de quem ele seria, com a criatura em SILHUETA e a oferta da 13.1 — ANTES
  // de escolher o personagem pronto. Id negativo como os outros; -4 estava
  // livre e vira o código 41 na telemetria (`onboardingStepCode`).
  const REVEAL_DEMO = -4;
  // O "porquê" vem ANTES de nome, data e quiz: a razão para mudar precisa vir
  // da pessoa, não do app (Goal-Setting Theory + autonomia da SDT), e nenhuma
  // mecânica de jogo aparece antes dela. Ids negativos, como DEMO_PICK, para
  // não renumerar a sequência do ritual.
  const GOAL_STEP = -2;
  const STRUGGLE_STEP = -3;
  // Muro de idade: aparece ao AVANÇAR do passo da data, quando ela dá <18.
  // Não é alerta genérico — é um passo próprio, com o mesmo casco dos outros.
  const AGE_BLOCK = -5;
  // PORTÃO DE IDENTIDADE — e-mail comprovado antes de QUALQUER decisão de
  // dinheiro. Vem depois do consentimento e do 18+ de propósito: e-mail é dado
  // pessoal (D-07 exige os Termos antes) e mandar link para menor antes de
  // conferir a idade seria escrever para quem o app não pode atender.
  const IDENTITY_STEP = -6;
  // A escolha grátis/completo, que MORAVA no passo 0. Desceu para cá porque
  // `handleUnlockFull` compra com `saveId` — e o saveId só existe derivado do
  // e-mail. Comprar antes do portão mandava a compra ao Play sem
  // `obfuscatedExternalAccountId`, e com `PLAY_REQUIRE_ACCOUNT_BINDING` ligado
  // ela seria RECUSADA: a pessoa pagaria e não receberia.
  const CHOICE_STEP = -7;
  // A segunda tela da conta: e-mail e senha. Separada da primeira a pedido do
  // dono — a primeira oferece só Google ou "New User", e o formulário vive
  // aqui em vez de empilhar tudo numa tela só.
  const EMAIL_STEP = -8;
  // A tela do Google. Existe porque o aceite dos Termos e o 18+ SAÍRAM da
  // primeira tela (pedido do dono: ela mostra só as duas portas) — e entrar
  // com Google TAMBÉM cria conta. Sem esta tela, esse caminho abriria conta
  // sem aceite e sem checagem de idade, que é exatamente o que as duas travas
  // existem para impedir.
  const GOOGLE_STEP = -9;

  // No upgrade o ritual começa direto na primeira pergunta: a intro só existe
  // para escolher entre grátis e completo, e essa escolha já foi feita (paga).
  // WP1.7 — rascunho do ritual (`utils/oracleDraft.ts`). Lido UMA vez, na
  // montagem: se a pessoa fechou o app no meio do ritual pago, volta para o
  // mesmo passo com tudo que já respondeu. Nunca retoma na geração ou depois
  // (`DEEP_END - 1` é o último item do teste), e só no mesmo modo.
  const [draft] = useState(() => readOracleDraft(mode, DEEP_END - 1));
  /** Rascunho do trecho ANTES da escolha (`utils/gateDraft.ts`). Existe por
   *  causa do portão: abrir o link de e-mail leva a pessoa para FORA do app, e
   *  `App.tsx` recarrega a página ao concluir o login — sem isto, a viagem
   *  cobraria de volta o objetivo, a dificuldade e o aceite dos Termos. */
  const [gate] = useState(() => (isUpgrade ? null : readGateDraft()));
  // O onboarding ABRE no portão de identidade. Antes abria numa intro de
  // marca ("Começar") e a conta vinha três telas depois; o dono pediu a conta
  // logo após o carregamento, e a marca virou o cabeçalho do próprio portão.
  const [step, setStep] = useState(draft ? draft.step : isUpgrade ? 1 : IDENTITY_STEP);
  /** Adendo 11 (21/09/2026): o servidor respondeu 410 `account-deleted` e
   *  `reagirContaExcluida` limpou o aparelho e voltou para cá. A mensagem é
   *  lida UMA vez e apagada — não pode reaparecer na próxima abertura. */
  const [avisoContaExcluida, setAvisoContaExcluida] = useState<string | null>(() => {
    const m = readLocal(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE);
    if (m) removeLocal(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE, { silent: true });
    return m;
  });
  /** A1 (QA rodada 2): região viva que já existe VAZIA na primeira pintura e
   *  só recebe o texto DEPOIS de montar — leitor de tela não anuncia
   *  `role=status` que já nasce com conteúdo. O `<h2>` dá âncora de
   *  navegação por cabeçalho. */
  const [avisoAnunciado, setAvisoAnunciado] = useState<string | null>(null);
  useEffect(() => {
    if (!avisoContaExcluida) { setAvisoAnunciado(null); return; }
    const t = window.setTimeout(() => setAvisoAnunciado(avisoContaExcluida), 0);
    return () => window.clearTimeout(t);
  }, [avisoContaExcluida]);
  const [flow, setFlow] = useState<'oracle' | 'demo' | null>(draft || isUpgrade ? 'oracle' : null);
  /** `null` = ainda não sabemos (a checagem é assíncrona); string = e-mail já
   *  comprovado; `''` = deslogado. O portão só decide depois de saber. */
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUsavel, setAuthUsavel] = useState(false);
  const [senha, setSenha] = useState('');
  const [criandoConta, setCriandoConta] = useState(false);
  const [authErro, setAuthErro] = useState<AuthErro | null>(null);
  const [authOcupado, setAuthOcupado] = useState(false);
  /** Temporizador da rede de segurança do Google (`GOOGLE_SEM_RESPOSTA_MS`).
   *  Em ref, e não em estado, porque ele não desenha nada — e porque o
   *  StrictMode monta o componente duas vezes, então um timer em estado
   *  ficaria órfão na primeira montagem. */
  const redeGoogleRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (redeGoogleRef.current !== null) clearTimeout(redeGoogleRef.current);
  }, []);
  const [resetEnviado, setResetEnviado] = useState(false);
  const [demoCharacterId, setDemoCharacterId] = useState<'kaelen' | 'orrin' | 'thalindra' | 'igni' | 'nautilu' | 'astrase' | null>(null);
  /** WP1.12 — tonalidade escolhida no demo. 0 = a arte original. */
  const [demoTint, setDemoTint] = useState(0);
  const [areaFoco, setAreaFoco] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  /** A caixa de consentimento vive FORA do texto legal: é elemento de UI
   *  próprio, com rótulo e foco, e o botão de avançar só liga com ela marcada.
   *  Caixa embutida dentro do parágrafo dos Termos não é consentimento
   *  específico (achado do run 01, PLANO-TAREFAS.md:187). */
  const [consentChecked, setConsentChecked] = useState(!!(draft?.consent ?? gate?.consent));
  const [consent, setConsent] = useState<ConsentRecord | null>(draft?.consent ?? gate?.consent ?? null);
  /** Mês/ano de nascimento pedido SÓ no caminho demo, e SÓ para conferir 18+
   *  (utils/consent.ts). O demo pula o Oráculo inteiro e nunca chega ao passo
   *  da data — sem isto, o 18+ do dono valeria só para quem paga. Fica em
   *  estado de componente e NÃO é persistido: aqui ele não alimenta mapa astral
   *  nenhum, então guardar seria coletar sem finalidade. */
  /** 07/09/2026 — o campo de mês/ano virou uma CAIXA de maioridade, por
   *  decisão do dono. O Google NÃO informa a idade (o login devolve e-mail,
   *  nome e foto; data de nascimento não vem), então não havia como delegar a
   *  checagem a ele — a alternativa real era declarar, e declarar cabe numa
   *  caixa. O caminho PAGO segue conferindo pela data cheia do mapa astral
   *  (`isAgeBlocked`, passo 2), que é mais estrita e continua levando ao
   *  `AGE_BLOCK`. */
  const [maiorIdadeChecked, setMaiorIdadeChecked] = useState(false);
  /** O passo de consentimento é o ponto comum aos dois caminhos e vem ANTES da
   *  bifurcação — é onde a idade custa menos fricção no demo. No caminho do
   *  Oráculo o campo não aparece: a data cheia do mapa astral já confere. */
  // Antes valia só para o caminho demo, porque a escolha grátis/completo
  // acontecia no passo 0 e o `flow` já era conhecido no consentimento. Com a
  // escolha DEPOIS do portão, o fluxo ainda é desconhecido aqui — e o 18+ tem
  // de valer para todo mundo antes de qualquer e-mail sair. O caminho pago
  // reconfere pela data de nascimento mais adiante (`isAgeBlocked`).
  const precisaDeclararIdade = !isUpgrade;
  /** Nada de autenticar sem aceite dos Termos e sem a idade preenchida: criar
   *  conta é coletar dado pessoal (D-07) e abrir conta para menor é o que o
   *  18+ existe para impedir. Vale para TODOS os caminhos do portão — senha,
   *  criação e Google —, porque o Google também cria conta quando ela não
   *  existe. Se a idade declarada for de menor, quem barra é `aoAutenticar`,
   *  que manda para o `AGE_BLOCK` antes de tocar na rede. */
  const podeAutenticar = consentChecked && (!precisaDeclararIdade || maiorIdadeChecked);
  /** Os controles de conta só aparecem para quem PRECISA deles: sem auth
   *  configurada não há conta a oferecer, e quem já está autenticado não tem o
   *  que fazer com um formulário de login. Nos dois casos a tela vira só o
   *  aceite dos Termos e a idade, com um "Continuar". */
  const mostrarAuth = authUsavel && !authEmail;
  const [soulGoal, setSoulGoal] = useState(draft?.soulGoal ?? gate?.soulGoal ?? '');
  const [soulStruggle, setSoulStruggle] = useState(draft?.soulStruggle ?? gate?.soulStruggle ?? '');
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
  /** A leitura do REVEAL DEMO: só as 6 respostas (sem nome, data, hora,
   *  cidade — o demo não deu nenhum), pelo caminho legado do oráculo. É uma
   *  leitura de quem a pessoa seria; a criatura própria só nasce pagando. */
  const [demoReading, setDemoReading] = useState<OracleResult | null>(null);
  /** Essência do class-system + ofício, calculados pelo pipeline completo —
   *  aparecem como UMA linha no reveal. Pontuações continuam invisíveis. */
  const [essence, setEssence] = useState<{ pt: string; en: string } | null>(null);
  /* ── WP1.1 — A CERIMÔNIA DE ESPERA DO REVEAL ────────────────────────────
     O reveal é o momento mais importante do app e acontecia SEM a criatura:
     nome, descrição e nenhuma imagem — o desenho só chegava depois, já dentro
     do jogo. Agora ele segura alguns segundos com a cerimônia do casulo
     enquanto a forma inicial é gerada.
     A SAÍDA é a metade que importa: `REVEAL_WAIT_MS` corre contra a geração e
     o que vier primeiro manda. Geração que falha, ou que demora, não pode
     virar tela travada no primeiro minuto de uso de alguém. */
  const [revealSprite, setRevealSprite] = useState<{ url: string; formId: string; at: number } | null>(null);
  const [revealEsperando, setRevealEsperando] = useState(false);
  /** Quando o reveal apareceu — vira FAIXA em `reveal_seen.duration` (WP0.12). */
  const revealAbertoEmRef = useRef(0);
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

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  // No caminho grátis o e-mail é OPCIONAL: pedir dado de contato antes de a
  // pessoa ter visto o pet andar é o maior ponto de abandono de um onboarding.
  // Ele é pedido depois, quando já existe progresso a proteger (ver
  // ProtectProgressModal). No caminho pago continua obrigatório — a compra fica
  // amarrada ao saveId derivado do e-mail, e perder isso é bem pior.
  // `emailRequired` saiu junto com o campo de e-mail deste passo: com o portão
  // antes da escolha, TODO onboarding chega aqui com e-mail comprovado (ou com
  // a auth desligada, e aí não há e-mail nenhum a exigir). A regra virou
  // pré-condição do fluxo em vez de validação de formulário.
  const canFinish = nickname.trim().length >= 2 && !submitting;
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
  // O demo nunca faz o teste longo: o bloco sai da conta dele também. O
  // reveal demo mede como o `REVEAL` (14/16 = 88 % — X4 da crítica: o número
  // que a fórmula R2 dá para o caminho curto; o denominador do demo é decisão
  // registrada no canvas, não um valor copiado do reveal pago).
  const skipDeep = refine === false || flow === 'demo';
  const shrink = (n: number) => (skipDeep && n > REFINE_OFFER ? n - deepBlock : n);
  const progressStep = step === REVEAL_DEMO ? REVEAL : step;
  const progress = Math.min(shrink(progressStep), shrink(lastStep)) / shrink(isUpgrade ? lastStep : REGISTER + 1);

  const canAdvance = (): boolean => {
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
  // `unlock_view` COM O MOTIVO (G-5) para o convite do reveal demo: é o
  // denominador honesto da 13.1 — sem ele a conversão desta tela não existe.
  useEffect(() => {
    if (step === REVEAL_DEMO) track('unlock_view', { reason: unlockReasonCode('reveal-demo') });
  }, [step]);

  const [generateError, setGenerateError] = useState(false);

  // PORTÃO — resolve o estado de autenticação UMA vez, na montagem.
  //
  // `authUsavel` é falso quando `isAuthConfigured()` é falso (build sem as
  // `VITE_FIREBASE_*`). Nesse caso o portão NÃO EXISTE: um passo obrigatório
  // que depende de um serviço não configurado trancaria o app inteiro, e um
  // build de contribuidor sem `.env` deixaria de abrir. Falta de config vira
  // ausência de portão, nunca porta trancada.
  //
  // Se a pessoa já está autenticada (voltou pelo link, ou já entrou antes), o
  // portão também não aparece — e, com o aceite já guardado no rascunho, o
  // fluxo retoma direto na escolha grátis/completo, que é onde ela parou.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (isUpgrade) return;
      const usavel = isAuthConfigured();
      const atual = usavel ? await getCurrentEmail() : null;
      if (cancelado) return;
      setAuthUsavel(usavel);
      setAuthEmail(atual ?? '');
      // Retomada da viagem ao e-mail: autenticado + aceite já provado = a
      // pessoa já passou pelo consentimento e pelo 18+ nesta instalação.
      // Retomada: autenticado e com aceite já provado nesta instalação, o
      // portão não tem mais o que perguntar — segue para o "porquê".
      if (atual && (gate?.consent ?? null) && step === IDENTITY_STEP) setStep(GOAL_STEP);
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rascunho do portão: gravado enquanto a pessoa está no trecho anterior à
  // escolha. Some assim que o onboarding termina (ver `finish`).
  const noPortao = !isUpgrade
    && [IDENTITY_STEP, GOOGLE_STEP, EMAIL_STEP, GOAL_STEP, STRUGGLE_STEP, CHOICE_STEP].includes(step);
  useEffect(() => {
    if (!noPortao) return;
    writeGateDraft({ soulGoal, soulStruggle, consent });
  }, [noPortao, soulGoal, soulStruggle, consent]);

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
    revealAbertoEmRef.current = Date.now();
    iniciarCerimoniaDoReveal(r);
  };

  /**
   * WP1.1 — pede o desenho da forma INICIAL e corre contra o relógio.
   *
   * Só a forma inicial: as outras dez são geradas depois, dentro do jogo, pelo
   * acervo (`useSpriteGeneration`). Pedir onze aqui multiplicaria por onze o
   * custo e a espera no exato ponto em que a pessoa ainda não sabe se fica.
   *
   * Nunca lança: qualquer falha simplesmente encerra a espera, e o reveal
   * segue com o texto — que é o comportamento que existia antes desta peça.
   */
  const iniciarCerimoniaDoReveal = (r: OracleResult) => {
    const inicial = r.creature.stages.find(st => st.stage === 'rookie') ?? r.creature.stages[0];
    if (!inicial) return;
    setRevealEsperando(true);
    let encerrado = false;
    const encerra = () => { if (!encerrado) { encerrado = true; setRevealEsperando(false); } };
    const relogio = setTimeout(encerra, REVEAL_WAIT_MS);
    void (async () => {
      try {
        const { requestSprite } = await import('../utils/spriteGen');
        const { image } = await requestSprite(inicial.imagePrompt, {
          promptFallback: inicial.imagePromptFallback,
          formId: 'rookie',
        });
        // Chegou DEPOIS do teto: não empurra o desenho numa tela que a pessoa
        // já leu como "sem imagem" — o acervo entrega no jogo, no tempo dele.
        if (encerrado) return;
        setRevealSprite({ url: image, formId: 'rookie', at: Date.now() });
      } catch {
        /* falha de geração não é falha do ritual */
      } finally {
        clearTimeout(relogio);
        encerra();
      }
    })();
  };

  const next = () => {
    // O portão não avança por `next()`: quem o atravessa é uma autenticação
    // bem-sucedida (ver `aposAutenticar`).
    if (step === IDENTITY_STEP || step === EMAIL_STEP || step === GOOGLE_STEP) return;
    if (step === GOAL_STEP) { setStep(STRUGGLE_STEP); return; }
    if (step === STRUGGLE_STEP) { setStep(CHOICE_STEP); return; }
    if (!canAdvance()) return;
    // Gate 18+ (D-06): a MESMA data do mapa astral confirma a idade mínima.
    // `isAgeBlocked` só bloqueia data legível de menor — data vazia ou
    // ilegível segue o fluxo, que é o que impede barrar alguém por engano.
    if (step === 2 && isAgeBlocked(birthDate)) { setStep(AGE_BLOCK); return; }
    if (step === DEEP_END - 1) {
      // último item do teste longo respondido → tela de geração e gera
      setStep(GENERATING);
      runGenerate();
      return;
    }
    setStep(s => s + 1);
  };

  /** Saídas da bifurcação. Escolher aqui é definitivo — ver `refine`. */
  const chooseRefine = (yes: boolean) => {
    setRefine(yes);
    if (yes) { setStep(DEEP_START); return; }
    setStep(GENERATING);
    /* ⚠️ Havia 1,4s de `setTimeout` aqui "para a animação respirar", e a
       auditoria de 06/09/2026 mostrou o custo: o pedido do SPRITE só sai
       depois de `doGenerate` terminar, e ele corre contra `REVEAL_WAIT_MS`
       (12s). A encenação comprava ~12% do orçamento da corrida que o WP1.1
       existe para vencer — decoração cobrando do `has_sprite`.
       A espera real não sumiu: a leitura do soulProfile e o import DINÂMICO do
       motor de efemérides (astronomy-engine, pesado de propósito) já produzem
       tempo de tela suficiente para a animação. */
    runGenerate();
  };
  // No upgrade não existe passo 0 (intro): voltar da primeira pergunta é
  // desistir do ritual e voltar ao jogo.
  const back = () => {
    if (isUpgrade && step === 1) { onCancel?.(); return; }
    // Das duas telas de conta volta-se para a primeira do portão.
    if (step === EMAIL_STEP || step === GOOGLE_STEP) { setStep(IDENTITY_STEP); return; }
    // Do "porquê" não se volta para o portão: a conta já existe, e desfazê-la
    // não é o que um botão de voltar deve sugerir.
    if (step === GOAL_STEP) return;
    if (step === STRUGGLE_STEP) { setStep(GOAL_STEP); return; }
    if (step === CHOICE_STEP) { setStep(STRUGGLE_STEP); return; }
    // 13.19: da escolha do personagem volta-se ao reveal demo (a leitura
    // continua lá); da 1ª pergunta do ritual grátis, à escolha grátis/completo.
    if (step === DEMO_PICK) { setStep(demoReading ? REVEAL_DEMO : CHOICE_STEP); return; }
    if (step === QUIZ_START && flow === 'demo') { setFlow(null); setStep(CHOICE_STEP); return; }
    // O "Back" do cadastro demo (canvas ONB-34, B1): volta à escolha do
    // personagem — o passo anterior na numeração é o REVEAL, que só existe
    // no caminho do oráculo e renderizaria vazio.
    if (step === REGISTER && flow === 'demo') { setStep(DEMO_PICK); return; }
    if (step === 1 && !isUpgrade) { setStep(CHOICE_STEP); return; }
    // Voltar de dentro do teste longo devolve a escolha: quem entrou sem
    // querer não fica preso em 20 perguntas.
    if (step === DEEP_START) { setRefine(null); setStep(REFINE_OFFER); return; }
    // O PISO É 1 NOS DOIS MODOS. Era `0` fora do upgrade, e o passo 0 era a
    // intro de marca — que foi APAGADA quando o portão virou a primeira tela.
    // Hoje nada renderiza no 0: quem caísse ali veria o casco do onboarding
    // vazio, sem título, sem botão e sem saída. Não há caminho vivo que chegue
    // lá (o passo 1 e todos os negativos têm ramo próprio acima), então isto é
    // uma trava, não um conserto de sintoma — o próximo `back` de uma tela nova
    // não vai estrear numa tela em branco.
    setStep(s => Math.max(1, s - 1));
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
    setMaiorIdadeChecked(false);
    setFlow(null);
    removeLocal(STORAGE_KEYS.SOULMON_PROFILE);
    clearOracleDraft();
    // O rascunho do portão também some: ele guarda o ACEITE, e quem foi
    // barrado por idade não pode voltar com o aceite já dado de brinde.
    clearGateDraft();
    setConsentChecked(false);
    setStep(IDENTITY_STEP);
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
  /** Texto do erro de autenticação, nos dois idiomas. */
  const textoErroAuth = (() => {
    if (!authErro) return '';
    const pt: Record<AuthErro, string> = {
      'email-invalido': 'Digite um e-mail válido.',
      'senha-fraca': 'A senha precisa de pelo menos 6 caracteres.',
      'credencial-invalida': 'E-mail ou senha não conferem.',
      'email-em-uso': 'Já existe conta com esse e-mail. Toque em "Já tenho conta — entrar".',
      'nao-encontrado': 'Não achamos conta com esse e-mail. Toque em "Criar conta".',
      'muitas-tentativas': 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
      'rede': 'Sem conexão agora. Confira a internet e tente de novo.',
      'popup-fechado': 'A janela do Google fechou antes de terminar. Pode tentar de novo.',
      /* ⚠️ A PROMESSA FOI TIRADA DAQUI, e o motivo está registrado no
         `docs/STATUS.md`: o redirecionamento é tentado, mas pode não concluir.
         O `authDomain` é `soulmon-app.firebaseapp.com` e o app roda noutro
         domínio, e desde o SDK 9.19 o Firebase avisa que `signInWithRedirect`
         para de funcionar onde o armazenamento de terceiros é bloqueado —
         Chrome, Safari/ITP e Firefox/ETP, que são exatamente os navegadores
         que também bloqueiam pop-up. Prometer "estamos te levando para lá" a
         quem talvez não chegue a lugar nenhum deixa a pessoa esperando por uma
         tela que não vem. A saída que SEMPRE funciona é a que aparece primeiro:
         liberar o pop-up, ou entrar com e-mail e senha. */
      'popup-bloqueado': 'Seu navegador bloqueou a janela do Google. Libere pop-ups para este site e toque de novo — ou entre com e-mail e senha, que não abre janela nenhuma.',
      'dominio-nao-autorizado': 'Este endereço ainda não está liberado para entrar com Google. Use e-mail e senha por enquanto.',
      'provedor-desligado': 'Esse jeito de entrar está indisponível agora.',
      // Serve para os dois casos, porque daqui não se sabe qual é.
      'sem-resposta': 'A janela do Google não respondeu. Se ela ainda estiver aberta, termine por lá; se não, pode tentar de novo.',
      'desconhecido': 'Não deu para entrar agora. Tente de novo em instantes.',
    };
    const en: Record<AuthErro, string> = {
      'email-invalido': 'Enter a valid email.',
      'senha-fraca': 'The password needs at least 6 characters.',
      'credencial-invalida': "Email or password don't match.",
      'email-em-uso': 'An account with that email already exists. Tap "I already have an account".',
      'nao-encontrado': 'No account found with that email. Tap "Create account".',
      'muitas-tentativas': 'Too many attempts in a row. Wait a moment and try again.',
      'rede': 'No connection right now. Check the internet and try again.',
      'popup-fechado': 'The Google window closed before finishing. You can try again.',
      'popup-bloqueado': 'Your browser blocked the Google window. Allow pop-ups for this site and tap again — or sign in with email and password, which opens no window at all.',
      'dominio-nao-autorizado': 'This address is not approved for Google sign-in yet. Use email and password for now.',
      'provedor-desligado': 'That way of signing in is unavailable right now.',
      'sem-resposta': 'The Google window didn’t respond. If it’s still open, finish there; if not, you can try again.',
      'desconhecido': "Couldn't sign in right now. Please try again shortly.",
    };
    return isPt ? pt[authErro] : en[authErro];
  })();

  /** Depois de autenticar, `App.tsx` recarrega a página e conclui a adoção do
   *  save. Aqui só registramos o e-mail e seguimos para a escolha — se o
   *  reload vier antes, melhor ainda. */
  const aposAutenticar = async (mail?: string) => {
    // F1 (QA rodada 2, FATAL): e-mail com lápide (410) NÃO entra no
    // onboarding. `checarContaExcluidaNoLogin` já deslogou e gravou o aviso;
    // aqui a pessoa fica no portão, com a mensagem e o caminho de volta
    // (o próximo login limpa a lápide no servidor).
    if (mail) {
      setAuthOcupado(true);
      const excluida = await checarContaExcluidaNoLogin(mail).catch(() => null);
      setAuthOcupado(false);
      if (excluida) {
        removeLocal(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE, { silent: true });
        setAvisoContaExcluida(excluida.mensagem);
        setAuthEmail('');
        setStep(IDENTITY_STEP);
        return;
      }
    }
    setAvisoContaExcluida(null);
    setAuthEmail(mail ?? '');
    setResetEnviado(false);
    // O carimbo do aceite é feito NO MOMENTO em que a conta nasce, não no fim
    // do onboarding: é esse instante que a prova precisa registrar.
    if (!consent) setConsent(buildConsentRecord());
    // Autenticado, o "porquê" vem antes de qualquer mecânica de jogo.
    setStep(GOAL_STEP);
  };

  /** SEM AUTH CONFIGURADA o portão não pode trancar o app.
   *
   *  Um build sem as `VITE_FIREBASE_*` (contribuidor sem `.env`, ou o app
   *  antes da configuração) não tem como autenticar ninguém. Com o portão
   *  sendo o PRIMEIRO passo, exigir conta ali deixaria o app sem abrir. Falta
   *  de configuração vira ausência de conta, nunca porta trancada — mas o
   *  aceite dos Termos e o 18+ continuam obrigatórios, porque eles não
   *  dependem do Firebase. */
  const aoContinuarSemConta = () => {
    if (!podeAutenticar) return;
    if (!consent) setConsent(buildConsentRecord());
    setStep(GOAL_STEP);
  };

  /* O portão não tem mais muro de idade próprio: com uma CAIXA, quem não tem
     a idade mínima simplesmente não a marca, e sem ela nenhuma conta nasce
     (ver `podeAutenticar`). Não há declaração de menoridade a interceptar. O
     `AGE_BLOCK` continua existindo para o caminho PAGO, onde a data cheia do
     mapa astral pode revelar um menor que já preencheu meia dúzia de telas. */

  /** "New User" → formulário de e-mail e senha, já em modo de criação. */
  const aoAbrirEmail = () => {
    setCriandoConta(true);
    setAuthErro(null);
    setResetEnviado(false);
    setStep(EMAIL_STEP);
  };

  /** "Continue with Google" → tela com o aceite e a idade, e só então o
   *  popup. A ordem importa: uma vez aberta a conta no Google, desfazê-la é
   *  bem mais difícil do que perguntar antes. */
  const aoAbrirGoogle = () => {
    setAuthErro(null);
    setStep(GOOGLE_STEP);
  };

  /** O que ainda falta para deixar uma conta nascer. Sem isto o botão só fica
   *  apagado e o toque não faz nada — a pessoa não tem como saber o motivo. */
  const faltaParaAutenticar = !maiorIdadeChecked
    ? (isPt
      ? `Confirme que você tem ${MIN_AGE_YEARS} anos ou mais para continuar.`
      : `Confirm you are ${MIN_AGE_YEARS} or older to continue.`)
    : (isPt ? 'Marque a caixa dos Termos para continuar.' : 'Check the Terms box to continue.');

  /** TERMOS + 18+, um só bloco usado nas DUAS telas que criam conta.
   *
   *  Escrito uma vez e reusado de propósito: duas cópias do mesmo bloco legal
   *  divergem em silêncio, e a que divergir vai ser justamente a que ninguém
   *  olhou. A caixa de aceite fica FORA do bloco dos links — embutida no texto
   *  legal não vale como consentimento específico (achado do run 01). */
  const blocoLegal = (
    <>
      {/* Os dois links como GHOST 44 em `primary-ink` (D-O6, W10): a cor + o
          verbo já dizem "abre"; `role=link` é o do `<a>`; abrem em aba nova.
          Empilhados, sem separador (X6) — os dois já são lista. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, marginBottom: 4 }}>
        <a
          href={isPt ? '/termos.html' : '/termos.html#en'}
          target="_blank" rel="noopener noreferrer"
          style={{ ...sm2Button('ghost', false, 'sm'), padding: '0 8px', textDecoration: 'none' }}
        >
          {isPt ? 'Ler os Termos de Uso' : 'Read the Terms of Use'}
        </a>
        <a
          href={isPt ? '/privacidade.html' : '/privacidade.html#en'}
          target="_blank" rel="noopener noreferrer"
          style={{ ...sm2Button('ghost', false, 'sm'), padding: '0 8px', textDecoration: 'none' }}
        >
          {isPt ? 'Ler a Política de Privacidade' : 'Read the Privacy Policy'}
        </a>
        <p style={{ ...sm2Hint, marginLeft: 8, marginBottom: 8 }}>
          {isPt ? '(aba nova; nada aqui se perde)' : '(new tab; nothing here is lost)'}
        </p>
      </div>
      {/* AS DUAS CAIXAS JUNTAS, aceite em cima e idade logo abaixo — pedido
          do dono. Continuam sendo DUAS, e não uma frase só: juntar "sou
          maior" com "aceito os Termos" faz um marcar o outro por tabela, e aí
          nenhum dos dois é uma declaração específica, que é justamente o que
          o aceite precisa ser (achado do run 01). São perguntas diferentes;
          ficam vizinhas, não fundidas. */}
      <CheckRow checked={consentChecked} onChange={setConsentChecked}>
        {isPt
          ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
          : 'I have read and agree to the Terms of Use and the Privacy Policy'}
      </CheckRow>
      {precisaDeclararIdade && (
        <div style={{ marginTop: 10 }}>
          <CheckRow checked={maiorIdadeChecked} onChange={setMaiorIdadeChecked}>
            {isPt
              ? `Tenho ${MIN_AGE_YEARS} anos ou mais`
              : `I am ${MIN_AGE_YEARS} or older`}
          </CheckRow>
          <p style={{ ...sm2Hint, marginTop: 6 }}>
            {isPt
              ? `${MIN_AGE_YEARS} anos é a idade mínima do Soulmon. Não pedimos nem guardamos sua data de nascimento.`
              : `${MIN_AGE_YEARS} is Soulmon's minimum age. We don't ask for or store your date of birth.`}
          </p>
        </div>
      )}
    </>
  );

  const aoEntrarComGoogle = async () => {
    if (authOcupado || !podeAutenticar) return;
    setAuthOcupado(true);
    setAuthErro(null);
    // Rede de segurança: ver `GOOGLE_SEM_RESPOSTA_MS`. Ela LIBERA a tela sem
    // cancelar nada — a promessa segue viva, e um login que conclua depois
    // entra pelo caminho normal, logo abaixo.
    if (redeGoogleRef.current !== null) clearTimeout(redeGoogleRef.current);
    redeGoogleRef.current = window.setTimeout(() => {
      redeGoogleRef.current = null;
      setAuthOcupado(false);
      setAuthErro('sem-resposta');
    }, GOOGLE_SEM_RESPOSTA_MS);

    const r = await entrarComGoogle();

    if (redeGoogleRef.current !== null) {
      clearTimeout(redeGoogleRef.current);
      redeGoogleRef.current = null;
    }
    setAuthOcupado(false);
    if (r.ok) { await aposAutenticar(r.email); return; }
    setAuthErro(r.erro ?? 'desconhecido');
  };

  const aoEnviarSenha = async () => {
    if (authOcupado || !podeAutenticar) return;
    const mail = email.trim().toLowerCase();
    if (!isValidEmail(mail)) { setEmailError(true); setAuthErro('email-invalido'); return; }
    // O piso de 6 é do próprio Firebase; conferir aqui evita uma ida à rede
    // só para receber `auth/weak-password`.
    if (criandoConta && senha.length < 6) { setAuthErro('senha-fraca'); return; }
    if (!senha) { setAuthErro('credencial-invalida'); return; }
    setAuthOcupado(true);
    setAuthErro(null);
    const r = criandoConta
      ? await criarContaComSenha(mail, senha)
      : await entrarComSenha(mail, senha);
    setAuthOcupado(false);
    if (r.ok) { await aposAutenticar(r.email ?? mail); return; }
    setAuthErro(r.erro ?? 'desconhecido');
  };

  const aoEsquecerSenha = async () => {
    if (authOcupado) return;
    const mail = email.trim().toLowerCase();
    if (!isValidEmail(mail)) { setEmailError(true); setAuthErro('email-invalido'); return; }
    setAuthOcupado(true);
    setAuthErro(null);
    const r = await mandarResetDeSenha(mail);
    setAuthOcupado(false);
    // Sucesso e "não existe conta" dão a MESMA resposta de propósito: dizer
    // "não achamos esse e-mail" aqui entregaria a quem perguntar quais
    // endereços têm conta no app.
    if (r.ok || r.erro === 'nao-encontrado') { setResetEnviado(true); return; }
    setAuthErro(r.erro ?? 'desconhecido');
  };

  const finish = async () => {
    if (!canFinish) return;
    if (flow === 'demo' && !demoCharacterId) return;
    if (flow === 'oracle' && !result) return;
    setSubmitting(true);

    // O e-mail NAO e mais pedido aqui: quem prova a posse dele e o PORTAO
    // (`IDENTITY_STEP`), antes da escolha gratis/completo. Dois campos para o
    // mesmo dado divergem, e o de baixo nao provava nada — criava save com um
    // e-mail apenas DIGITADO, e o saveId e derivado dele: bastava digitar o
    // endereco alheio para reivindicar o save do outro.

    // Defensivo: a geracao ja apagou o rascunho; o demo nunca cria um.
    clearOracleDraft();
    // O trecho do portao acabou. Rascunho velho aqui faria uma instalacao
    // seguinte retomar um portao que esta pessoa ja atravessou.
    clearGateDraft();
    if (flow === 'demo' && demoCharacterId) {
      await onComplete({
        mode: 'demo',
        userName: nickname.trim(),
        petName: petNameFinal,
        email: authEmail ?? '',
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
        email: authEmail ?? '',
        oracleResult: result,
        // WP1.1 — o MESMO desenho que a pessoa viu no reveal. Sem isto o app
        // geraria de novo e entregaria outra criatura no primeiro minuto.
        revealSprite: revealSprite ?? undefined,
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
    // SEM E-MAIL COMPROVADO NÃO SE COBRA.
    //
    // `purchase()` manda o `saveId` como `obfuscatedAccountId`. Antes do
    // login esse saveId é um UUID ALEATÓRIO gerado por `App.tsx` na primeira
    // abertura — e ao entrar com e-mail ele é SUBSTITUÍDO pelo SHA-256 do
    // endereço. `isPlayPurchaseBoundTo` compara os dois por igualdade:
    //
    //     if (bound) return !!saveId && String(bound) === String(saveId);
    //
    // Comprar antes do login amarra o recibo a um id que a conta abandona no
    // login seguinte, e o resgate é RECUSADO — inclusive com
    // `PLAY_REQUIRE_ACCOUNT_BINDING` desligado, porque o campo vem preenchido
    // e cai no ramo da igualdade. A pessoa paga e não recebe.
    //
    // Por isso a guarda é o E-MAIL, não a presença do saveId: o saveId sempre
    // existe. O portão já torna isto inalcançável pela UI; esta linha existe
    // para que uma refatoração não reabra o furo em silêncio.
    if (authUsavel && !authEmail) {
      setUnlockMessage(isPt
        ? 'Entre com seu e-mail antes de comprar — é ele que amarra a compra à sua conta.'
        : 'Sign in with your email before buying — it is what ties the purchase to your account.');
      return;
    }
    setUnlockLoading(true);
    setUnlockMessage(null);
    const result = await purchase(FULL_UNLOCK_SKU);
    setUnlockLoading(false);
    if (result.ok) {
      // Só depois de a compra voltar OK — clique não é receita.
      // WP0.9: `onboarding` é o caminho que não passa por convite nenhum.
      track('purchase', { reason: TELEMETRY_PURCHASE_REASON.onboarding });
      flushTelemetry();
      setFlow('oracle');
      // O "porquê" e o consentimento já aconteceram antes do portão; a compra
      // entra direto no ritual.
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

  /* Campo, opção e cartão vivem em `style` inline sobre os tokens `--sm2-*`:
     o Tailwind daqui é PRÉ-COMPILADO, então classe utilitária que não existe
     no `index.css` não aplica nada e não avisa (footgun 1). O kit `sm-px-*`
     (moldura chanfrada, banda de quina) saiu — ele fica dentro do visor e nas
     telas de arcade, e um formulário nunca foi nenhum dos dois. */
  const fieldStyle: CSSProperties = {
    width: '100%', boxSizing: 'border-box', minHeight: 44,
    padding: '10px 12px', borderRadius: 'var(--sm2-radius-md)',
    /* Fronteira `muted` 1px (SIS-03, F2 do canvas Sistema: `line` dá 1,3:1). */
    border: '1px solid var(--sm2-muted)',
    backgroundColor: 'var(--sm2-surface-2)',
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    lineHeight: 'var(--sm2-leading-body)',
    color: 'var(--sm2-ink)',
    outline: 'none',
  };
  /** O campo INERTE por forma (D-Q3 / Nascimento ONB-24): fundo transparente,
   *  tracejado `muted`, tinta `muted` — o mesmo desenho do `.is-inert` da Conta. */
  const inertFieldStyle: CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px dashed var(--sm2-muted)',
    color: 'var(--sm2-muted)',
    boxShadow: 'none',
    cursor: 'default',
  };
  /** Opção de escolha única — as 6 do ritual E os 20 itens do teste (canvas
   *  Onboarding-oráculo D-Q4): card SIS-03 de 44 com anel `muted` 1px e texto
   *  14 centrado; a escolhida é TONAL — `primary-soft` + anel 2px
   *  `primary-ink` + tinta `primary-ink` 500 (Pet D-P1). Nunca placa cheia:
   *  nestas telas não há primário, escolher avança. O padding cai 1px quando o
   *  anel engrossa, para a caixa não pular. */
  const optionBtn = (selected: boolean): CSSProperties => ({
    width: '100%', boxSizing: 'border-box', textAlign: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: selected ? '7px 11px' : '8px 12px', marginBottom: 8,
    borderRadius: 'var(--sm2-radius-md)',
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    lineHeight: 1.3,
    fontWeight: selected ? 500 : 400,
    cursor: 'pointer',
    border: selected ? '2px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-muted)',
    backgroundColor: selected ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface)',
    color: selected ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
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
              style={{ ...sm2Button('outline'), marginBottom: 12 }}
              onClick={() => setOracleDebugOpen(false)}
            >
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Fechar' : 'Close'}
            </button>
            <OraclePage language={isPt ? 'pt-BR' : 'en-US'} initialDebugMode />
          </div>
        </Suspense>
      ) : (
      /* Coluna flex de altura inteira: é o que leva a nav dos passos com
         campo ao PÉ do telefone (`marginTop: auto` — canvas Onboarding-oráculo,
         dobra F2 da Home: voltar + "Continue" em 718–766 a 844). */
      <div style={{
        width: '100%', maxWidth: 440, padding: '24px 20px 40px', boxSizing: 'border-box',
        minHeight: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Barra de progresso. O DENOMINADOR não mudou nesta rodada: ele já
            inclui o tutorial que vem depois do onboarding (antes a barra
            chegava a 100% e ainda apareciam telas) e já desconta o bloco de 20
            itens de quem recusa o teste longo. */}
        {/* Canvas Onboarding-oráculo D-Q1: a barra é o `.meter` SIS-07 a 8px —
            trilho `surface-2` + anel `muted` 1px + água `primary-fill` (o
            trilho sobre `bg` sozinho lia 1,2:1; o anel é o que faz a barra
            existir). Era um `div` 6px com fronteira `line`. */}
        {((step > 0 && step <= lastStep) || step === REVEAL_DEMO) && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={isPt ? 'Progresso do ritual' : 'Ritual progress'}
            className="sm2-kit-meter sm2-ora-meter"
          >
            <div className="sm2-kit-meter-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* PORTAO DE IDENTIDADE.
            Entrar com Google, ou e-mail + senha com "Entrar" e "Criar conta".
            O Google existe porque nao depende de e-mail CHEGAR: o link deste
            projeto cai no spam do Gmail (remetente `firebaseapp.com` sem
            dominio proprio). Um caminho que nao passa por caixa de entrada e
            o que garante que da para entrar no app. */}
        {/* PORTÃO — TELA 1: SÓ as duas portas.
            "Continue with Google" ou "New User", e nada mais. O aceite dos
            Termos e o 18+ saíram daqui a pedido do dono e vivem nas telas
            seguintes — nas DUAS, porque entrar com Google também cria conta:
            deixar o aceite só no caminho do e-mail abriria conta sem aceite e
            sem checagem de idade por um lado da bifurcação. */}
        {step === IDENTITY_STEP && (
          <>
          {/* A MARCA = a chama do kit num slot-visor (D-O4 / X3): a chama é
              pixel (um `<rect>` por pixel, `crispEdges`) e pixel vive DENTRO
              do vidro — solta sobre a página clara os pixels claros somem a
              1,10:1. Slot 64×80 `viewport-bg` sem anel (SIS-07), a chama a
              2× (38×60), o wordmark Fredoka 16 FORA; o mesmo fundo nos dois
              temas. O corvo-mascote só aparece no vidro da intro. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 24 }}>
            <span role="img" aria-label="Soulmon" style={{ display: 'inline-flex' }}>
              <MiniGlass size={64} style={{ height: 80 }}>
                <BrandFlame scale={2} />
              </MiniGlass>
            </span>
            <span style={{
              fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)',
              fontWeight: 600, letterSpacing: '.01em', color: 'var(--sm2-ink)', lineHeight: 'var(--sm2-leading-title)',
            }}>Soulmon</span>
          </div>
          {/* A1: a região viva está SEMPRE no DOM (vazia) e o texto entra
              pós-montagem via `avisoAnunciado`; o cabeçalho só aparece com
              o aviso. */}
          <div aria-live="polite" aria-atomic="true" data-account-deleted-live>
            {avisoAnunciado && (
              <section aria-labelledby="sm2-conta-excluida-titulo" style={{ margin: '12px 0 0', textAlign: 'center' }} data-account-deleted-notice>
                <h2 id="sm2-conta-excluida-titulo" style={{ ...sm2Label, margin: 0 }}>
                  {isPt ? 'Conta excluída' : 'Account deleted'}
                </h2>
                <p style={{ ...sm2Text, margin: '4px 0 0' }}>{avisoAnunciado}</p>
              </section>
            )}
          </div>
          <StepShell
            title={!mostrarAuth
              ? (isPt ? 'Antes de começar' : 'Before we start')
              : (isPt ? 'Entrar no Soulmon' : 'Sign in to Soulmon')}
            hint={!mostrarAuth
              ? (isPt
                ? 'Você pode ler os dois documentos agora — eles abrem numa aba nova e seu progresso aqui não se perde.'
                : 'You can read both documents now — they open in a new tab and nothing here is lost.')
              : (isPt
                ? 'Sua conta guarda o progresso e amarra qualquer compra a você. A sessão fica salva — não precisa entrar de novo a cada vez.'
                : 'Your account keeps your progress and ties any purchase to you. The session is saved — no need to sign in every time.')}>
            {mostrarAuth ? (
              <>
                <button
                  type="button"
                  style={{ ...sm2Button('primary'), width: '100%' }}
                  onClick={aoAbrirGoogle}
                >
                  {isPt ? 'Entrar com Google' : 'Continue with Google'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                  <span style={{ flex: 1, height: 1, backgroundColor: 'var(--sm2-line)' }} />
                  <span style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'ou' : 'or'}</span>
                  <span style={{ flex: 1, height: 1, backgroundColor: 'var(--sm2-line)' }} />
                </div>

                {/* Segunda PORTA = `outline` (D-O5): ghost ciano ao lado de um
                    primário ciano lê como a mesma ação; outline diz "outra
                    porta". */}
                <button
                  type="button"
                  style={{ ...sm2Button('outline'), width: '100%' }}
                  onClick={aoAbrirEmail}
                >
                  {isPt ? 'Novo usuário' : 'New User'}
                </button>
              </>
            ) : (
              /* Sem auth configurada não há conta a oferecer, e quem já está
                 autenticado não tem o que fazer com um formulário. Nos dois
                 casos o portão vira só o aceite e a idade: falta de
                 configuração nunca pode virar porta trancada. */
              <>
                {blocoLegal}
                <button
                  type="button"
                  style={{ ...sm2Button('primary', !podeAutenticar), width: '100%', marginTop: 20 }}
                  onClick={aoContinuarSemConta}
                  disabled={!podeAutenticar}
                >
                  {isPt ? 'Continuar' : 'Continue'}
                </button>
                {!podeAutenticar && <p style={{ ...sm2Hint, marginTop: 12, textAlign: 'center' }}>{faltaParaAutenticar}</p>}
              </>
            )}
          </StepShell>
          </>
        )}

        {/* PORTÃO — TELA DO GOOGLE: aceite e idade ANTES do popup.
            Perguntar antes é o que evita ter de desfazer uma conta já criada
            no Google, que é bem mais difícil do que uma pergunta a mais. */}
        {step === GOOGLE_STEP && (
          <StepShell
            title={isPt ? 'Entrar com Google' : 'Continue with Google'}
            hint={isPt
              ? 'Antes de criar sua conta, confirme os dois documentos e sua idade.'
              : 'Before your account is created, confirm the two documents and your age.'}>
            {blocoLegal}
            {authErro && (
              <p role="alert" style={{ ...alertStyle, marginTop: 12 }}>
                {textoErroAuth}
              </p>
            )}
            <button
              type="button"
              style={{ ...sm2Button('primary', authOcupado || !podeAutenticar), width: '100%', marginTop: 20 }}
              onClick={aoEntrarComGoogle}
              /* O rótulo NÃO pode sumir enquanto o botão gira: com só um
                 `<Spinner />` dentro, o nome acessível vira vazio e o leitor
                 de tela anuncia "botão, desabilitado" sem dizer de quê. O
                 `aria-label` fixo mantém o nome, e o `aria-busy` é o que
                 conta a espera. (QA de 09/09/2026, quatro botões do
                 onboarding.) */
              aria-label={isPt ? 'Entrar com Google' : 'Continue with Google'}
              aria-busy={authOcupado}
              disabled={authOcupado || !podeAutenticar}
            >
              {authOcupado ? <Spinner size={24} /> : (isPt ? 'Entrar com Google' : 'Continue with Google')}
            </button>
            {!podeAutenticar && <p style={{ ...sm2Hint, marginTop: 12, textAlign: 'center' }}>{faltaParaAutenticar}</p>}
            <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 8 }} onClick={back}>
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
          </StepShell>
        )}

        {/* PORTÃO — TELA DO E-MAIL: formulário, aceite e idade.
            O modo abre em "criar conta", que é o que o botão prometeu, e
            alterna para entrar: quem já tem conta de e-mail precisa de um
            caminho, e ele não pode ser um beco sem saída. */}
        {step === EMAIL_STEP && (
          <StepShell
            title={criandoConta
              ? (isPt ? 'Criar sua conta' : 'Create your account')
              : (isPt ? 'Entrar' : 'Sign in')}
            hint={isPt
              ? 'A sessão fica salva neste aparelho — não precisa entrar de novo a cada vez.'
              : 'The session is saved on this device — no need to sign in every time.'}>

            <label style={sm2Label} htmlFor="onb-gate-email">
              {isPt ? 'E-mail' : 'Email'}
            </label>
            {/* E-mail malformado = anel ÂMBAR do `Field` (`warn`) + `aria-invalid`
                + a frase "Enter a valid email." em `role=alert` logo abaixo
                do bloco (X2: erro em texto, nunca só por cor). */}
            <Field id="onb-gate-email" type="email" value={email} autoComplete="email"
              warn={emailError}
              aria-invalid={emailError || undefined}
              onChange={e => { setEmail(e.target.value); setEmailError(false); setAuthErro(null); }}
              placeholder={isPt ? 'voce@exemplo.com' : 'you@example.com'} />

            <label style={{ ...sm2Label, marginTop: 14 }} htmlFor="onb-gate-senha">
              {isPt ? 'Senha' : 'Password'}
            </label>
            <Field id="onb-gate-senha" type="password" value={senha}
              autoComplete={criandoConta ? 'new-password' : 'current-password'}
              onChange={e => { setSenha(e.target.value); setAuthErro(null); }}
              placeholder={isPt ? 'Mínimo de 6 caracteres' : 'At least 6 characters'}
              onKeyDown={e => e.key === 'Enter' && aoEnviarSenha()} />
            {/* A regra "6 caracteres" sumia junto com o placeholder ao digitar
                (achado 5 do canvas): fica como dica enquanto faltar. */}
            {criandoConta && senha.length > 0 && senha.length < 6 && (
              <p style={{ ...sm2Hint, marginTop: 4 }}>
                {isPt ? 'Mínimo de 6 caracteres.' : 'At least 6 characters.'}
              </p>
            )}

            <div style={{ height: 1, backgroundColor: 'var(--sm2-line)', margin: '22px 0 14px' }} />
            {blocoLegal}

            {authErro && (
              <p role="alert" style={{ ...alertStyle, marginTop: 12 }}>
                {textoErroAuth}
              </p>
            )}
            {resetEnviado && (
              <p role="status" style={{ ...statusStyle, marginTop: 12 }}>
                {isPt
                  ? 'Mandamos um e-mail para trocar a senha. Se não aparecer, olhe no spam.'
                  : 'We sent an email to reset your password. If it does not show up, check your spam.'}
              </p>
            )}

            <button
              type="button"
              style={{ ...sm2Button('primary', authOcupado || !podeAutenticar), width: '100%', marginTop: 20 }}
              onClick={aoEnviarSenha}
              aria-label={criandoConta ? (isPt ? 'Criar conta' : 'Create account') : (isPt ? 'Entrar' : 'Sign in')}
              aria-busy={authOcupado}
              disabled={authOcupado || !podeAutenticar}
            >
              {authOcupado
                ? <Spinner size={24} />
                : criandoConta
                  ? (isPt ? 'Criar conta' : 'Create account')
                  : (isPt ? 'Entrar' : 'Sign in')}
            </button>
            {!podeAutenticar && <p style={{ ...sm2Hint, marginTop: 12, textAlign: 'center' }}>{faltaParaAutenticar}</p>}

            {/* A inversão criar/entrar é um LINK (ghost), não uma porta. */}
            <button
              type="button"
              style={{ ...sm2Button('ghost'), width: '100%', marginTop: 8 }}
              onClick={() => { setCriandoConta(v => !v); setAuthErro(null); setResetEnviado(false); }}
            >
              {criandoConta
                ? (isPt ? 'Já tenho conta — entrar' : 'I already have an account — sign in')
                : (isPt ? 'Criar conta' : 'Create account')}
            </button>

            {!criandoConta && (
              <button
                type="button"
                style={{ ...sm2Button('quiet', authOcupado), width: '100%', marginTop: 4 }}
                onClick={aoEsquecerSenha}
                disabled={authOcupado}
              >
                {isPt ? 'Esqueci minha senha' : 'I forgot my password'}
              </button>
            )}

            <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 4 }} onClick={back}>
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
          </StepShell>
        )}

        {/* ESCOLHA gratis/completo — depois da identidade, nunca antes. */}
        {step === CHOICE_STEP && (
          <StepShell
            title={isPt ? 'Como você quer começar?' : 'How do you want to start?'}
            hint={isPt
              ? 'Dá para mudar depois: a compra continua disponível dentro do app.'
              : 'You can change later: the purchase stays available inside the app.'}>
            {/* Comecar gratis segue sendo o caminho PRINCIPAL. Pedir dinheiro
                de quem ainda nao viu o app funcionar e o jeito mais caro de
                perder o usuario. */}
            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => { setFlow('demo'); setDemoReading(null); setStep(QUIZ_START); }}
            >
              {isPt ? 'Começar agora — é grátis' : 'Start now — it’s free'}
            </button>
            {/* A segunda escolha = `outline` (D-O5): peso igual ao de uma
                porta, sem dourado, sem badge — a bifurcação sem empurrão. O
                preço em `tabular-nums`. */}
            <button
              type="button"
              className="sm2-num"
              style={{ ...sm2Button('outline', unlockLoading), width: '100%', marginTop: 12 }}
              onClick={handleUnlockFull}
              aria-label={isPt ? `Quero o completo — ${precoLabel}` : `Get the full game — ${precoLabel}`}
              aria-busy={unlockLoading}
              disabled={unlockLoading}
            >
              {unlockLoading
                ? <Spinner size={24} />
                : (isPt ? `Quero o completo — ${precoLabel}` : `Get the full game — ${precoLabel}`)}
            </button>
            {/* ONB-17/18/19: compra cancelada / loja indisponível / falha — âmbar,
                filete, sob os botões; nada de modal, nada de vermelho (D-O7). */}
            {unlockMessage && (
              <p role="alert" style={{ ...alertStyle, marginTop: 16 }}>
                {unlockMessage}
              </p>
            )}
            {/* "Back" `[novo]` (B1): `back()` já suportava CHOICE → STRUGGLE. */}
            <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 12 }} onClick={back}>
              <Icon name="arrow_back" size={20} />
              {isPt ? 'Voltar' : 'Back'}
            </button>
          </StepShell>
        )}


        {/* GOAL_STEP / STRUGGLE_STEP — o "porquê", antes de qualquer mecânica */}
        {(step === GOAL_STEP || step === STRUGGLE_STEP) && (
          <div style={{ paddingTop: 28 }}>
            {/* WP1.9 — o eco. A pessoa acabou de escrever por que quer mudar de
                vida e o texto sumia sem uma palavra: o passo seguinte abria
                como se nada tivesse sido dito. Uma linha só, e só para quem
                escreveu — quem pulou não recebe eco de coisa nenhuma, porque
                aí a frase viraria mentira. Nada disso vira estado no save: o
                gatilho é o `soulGoal` que já está em memória. */}
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 8 }}>
              {step === GOAL_STEP
                ? (isPt ? 'O que você quer melhorar na sua vida?' : 'What do you want to improve in your life?')
                : (isPt ? 'E o que mais te atrapalha hoje?' : 'And what gets in your way the most?')}
            </h2>
            {/* A justificativa do campo (O2, canvas Objetivo): por que perguntar. */}
            {step === GOAL_STEP && (
              <p style={{ ...sm2Hint, marginBottom: 16 }}>
                {isPt
                  ? 'Seu Soulmon traz isso de volta nos dias que importam.'
                  : 'Your Soulmon brings this back on the days that count.'}
              </p>
            )}
            {/* O eco (canvas Atrapalha): `check_circle` 20 FILL 1 + 12 em
                `primary-ink` — a única luz forte da tela além do primário. Era
                `var(--sm2-accent-ink)`, token que não existe. */}
            {step === STRUGGLE_STEP && soulGoal.trim().length > 0 && (
              <p style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 12px', color: 'var(--sm2-primary-ink)' }}>
                <Icon name="check_circle" size={20} fill={1} tone="inherit" />
                {isPt ? 'Anotado. Seu Soulmon vai lembrar disso.' : 'Noted. Your Soulmon will remember.'}
              </p>
            )}
            <textarea
              rows={4}
              autoFocus
              className="sm2-form-field"
              aria-label={step === GOAL_STEP
                ? (isPt ? 'O que você quer melhorar na sua vida?' : 'What do you want to improve in your life?')
                : (isPt ? 'E o que mais te atrapalha hoje?' : 'And what gets in your way the most?')}
              onFocus={() => setAreaFoco(true)}
              onBlur={() => setAreaFoco(false)}
              style={{
                ...fieldStyle, minHeight: 96, padding: 12, resize: 'none', fontFamily: 'var(--sm2-font-text)',
                /* Foco = fronteira + anel 2px `primary-ink` (o mesmo mecanismo do `Field`). */
                border: `1px solid ${areaFoco ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
                boxShadow: areaFoco ? '0 0 0 2px var(--sm2-primary-ink)' : 'none',
              }}
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
            {/* "Back" no Atrapalha (O4/B1 — `back()` já sabia voltar, nada o
                chamava). Não existe no Objetivo: a conta está atrás, o ritual
                à frente. */}
            {step === STRUGGLE_STEP && (
              <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 4 }} onClick={back}>
                <Icon name="arrow_back" size={20} />
                {isPt ? 'Voltar' : 'Back'}
              </button>
            )}
          </div>
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

        {/* DEMO_PICK — escolha entre os 6 personagens pré-prontos (canvas
            EscolherPersonagem, D-O9/D-O10): grade 2×3 de cards SIS-03, cada um
            com o sprite 256² a 128 (0,5×, P2 a) num vidro 128² com anel — uma
            criatura, um tamanho; nome Rubik 14/500, bio 12 `muted`; iguais em
            peso. Os 6 cabem em 844 sem rolar. */}
        {step === DEMO_PICK && (
          <div style={{ paddingTop: 20 }}>
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 12 }}>
              {isPt ? 'Escolha seu Soulmon' : 'Choose your Soulmon'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {PREMADE_CHARACTERS.map(c => {
                const bio = isPt ? c.bioPt : c.bioEn;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-demo-char={c.id}
                    aria-label={`${c.name} — ${bio}`}
                    onClick={() => { track('demo_pick'); setDemoCharacterId(c.id); setStep(REGISTER); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: 8, cursor: 'pointer', textAlign: 'center',
                      borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-line)',
                      backgroundColor: 'var(--sm2-surface)', color: 'var(--sm2-ink)',
                    }}
                  >
                    <Viewport width={64} height={64} scale={2} breathing={false} style={{ borderRadius: 'var(--sm2-radius-md)' }}>
                      <img src={getDemoSprite(c.id, 'rookie')} alt="" width={128} height={128}
                        style={{ width: 128, height: 128, display: 'block', imageRendering: 'pixelated' }} />
                    </Viewport>
                    <span style={{ ...sm2Text, fontWeight: 500, lineHeight: 1.2, marginTop: 4 }}>{c.name}</span>
                    <span style={{ ...sm2Hint, lineHeight: 1.35 }}>{bio}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 12 }} onClick={back}>
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
            {/* D-Q3: inerte por FORMA — tracejado `muted` + tinta `muted`,
                `aria-disabled`, fora do Tab; nunca `opacity .5`. O campo
                continua no DOM porque é o que mostra o meio-dia assumido. */}
            <Field type="time" value={birthTime}
              readOnly={timeUnknown}
              aria-disabled={timeUnknown || undefined}
              tabIndex={timeUnknown ? -1 : undefined}
              aria-label={isPt ? 'Hora de nascimento' : 'Birth time'}
              style={timeUnknown ? inertFieldStyle : undefined}
              onChange={e => { if (!timeUnknown) setBirthTime(e.target.value); }} />
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
            {/* Os resultados = linhas de 44 num card SIS-03 (W10 — eram 36),
                separadas por `line`; a classe é a lista inteira. */}
            <CityPicker value={birthCity} onChange={setBirthCity} isPt={isPt}
              inputStyle={fieldStyle} optionStyle={() => ({})} optionClass="sm2-ora-cityrow" />
          </StepShell>
        )}

        {/* 5 — Criatura favorita (opcional) */}
        {step === FAVORITE_STEP && (
          <StepShell title={isPt ? 'Qual sua criatura favorita?' : "What's your favorite creature?"}
            hint={isPt ? 'Opcional — até 2 palavras. Ela influencia a aparência da sua criatura.' : 'Optional — up to 2 words. It shapes how your creature looks.'}>
            <Field type="text" value={favoriteCreature} autoFocus
              readOnly={skipFavorite}
              aria-disabled={skipFavorite || undefined}
              tabIndex={skipFavorite ? -1 : undefined}
              aria-label={isPt ? 'Criatura favorita' : 'Favorite creature'}
              style={skipFavorite ? inertFieldStyle : undefined}
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
                        const nextAnswers = { ...answers, [q.id]: opt.id };
                        setAnswers(nextAnswers);
                        // avança sozinho após escolher (fluido)
                        setTimeout(() => {
                          if (flow === 'demo' && step === QUIZ_END - 1) {
                            // 13.19 — a leitura do demo nasce aqui, com as 6
                            // respostas já completas (o estado ainda é o
                            // anterior neste instante, como no 20º item).
                            setDemoReading(generateOracle({
                              fullName: '', birthDate: '', birthTime: '', birthPlace: '', answers: nextAnswers,
                            }));
                            setStep(REVEAL_DEMO);
                            return;
                          }
                          setStep(s => s + 1);
                        }, 180);
                      }}>
                      {L(opt.text)}
                    </button>
                  );
                })}
              </div>
              {/* WP1.11 — FEEDBACK DE ORIGEM. O ritual pedia seis respostas e
                  não dizia o que fazia com nenhuma, então lia como
                  formulário. O hint diz de ONDE a resposta entra — nunca como
                  a criatura vai ficar: alvo transformaria a leitura num
                  formulário de otimização, e a pessoa passaria a responder o
                  que rende o bicho que ela quer. */}
              {q.hint && <p style={{ ...sm2Hint, marginTop: 12 }}>{L(q.hint)}</p>}
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
              {/* WP1.10 — o que muda e quanto custa. A copy anterior prometia
                  que o teste longo "afinava" a criatura: uma palavra que não
                  diz nada e não deixa ninguém decidir. (Ela não é reproduzida
                  aqui de propósito — o aceite do WP1.10 procura a frase antiga
                  neste arquivo, e um comentário que a repete reprova o próprio
                  pacote. É a terceira vez que essa armadilha aparece.) Os
                  DOIS caminhos são legítimos (as 6 respostas do ritual entram
                  na leitura nos dois), então a copy não promete criatura
                  vantagem nenhuma — promete uma leitura com MAIS FONTES. O nº sai
                  da constante; o tempo é a única estimativa, e é conservadora. */}
              {isPt
                ? `Seu Soulmon já pode nascer agora. Com mais ${SOUL_TEST_ITEMS.length} perguntas (~2 min), a leitura usa seus traços de personalidade além das respostas de agora.`
                : `Your Soulmon can be born right now. With ${SOUL_TEST_ITEMS.length} more questions (~2 min), the reading uses your personality traits on top of the answers you just gave.`}
            </p>
            {/* ONB-29 (D-Q12): o erro de geração vem ANTES das portas, em
                âmbar — a falha não é da pessoa; escolher de novo tenta outra vez. */}
            {generateError && (
              <p role="alert" style={{ ...alertStyle, margin: '0 0 18px' }}>
                {isPt
                  ? 'Não foi possível revelar sua criatura agora. Escolha de novo para tentar outra vez.'
                  : "We couldn't reveal your creature just now. Choose again to retry."}
              </p>
            )}
            {/* D-Q5 (X5 da crítica, a resposta da §17 V3): as DUAS portas em
                `outline`, o teste primeiro. Numa decisão declarada final sem
                porta "certa", o primário seria recomendação implícita — "sem
                empurrão" vale para a forma. A ordem já diz qual é o caminho
                longo. */}
            <button type="button" style={{ ...sm2Button('outline'), width: '100%', marginBottom: 8 }}
              onClick={() => chooseRefine(true)}>
              {isPt ? `Responder mais ${SOUL_TEST_ITEMS.length} perguntas` : `Answer ${SOUL_TEST_ITEMS.length} more questions`}
            </button>
            <button type="button" style={{ ...sm2Button('outline'), width: '100%' }}
              onClick={() => chooseRefine(false)}>
              {isPt ? 'Revelar meu Soulmon agora' : 'Reveal my Soulmon now'}
            </button>
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

        {/* Gerando — A ESPERA É RITUAL (canvas Onboarding-oráculo D-Q6/D-Q11,
            ONB-31): o `role=status` é o casulo — o placeholder `forming` (D1,
            o cristal aceso) 256² a 128 num vidro 192² com anel, pulsando
            DENTRO do vidro por POSIÇÃO em `steps(2)` (nunca opacidade — Home
            F1); `sync` 24 `primary-ink` girando fora do vidro (R1, o único
            movimento fora dele); a frase 14 `ink`. O corvo a 64 saiu: é a
            marca, não a criatura (funil D-O4 — só no vidro da intro); o
            spinner de sistema saiu com ele. Reduced-motion: o casulo e o
            `sync` param, e o anúncio fica (a frase é o conteúdo da região). */}
        {step === GENERATING && (
          <div role="status" aria-live="polite" className="sm2-ora-wait" style={{ paddingTop: 24 }}>
            <Viewport
              width={64}
              height={64}
              scale={3}
              breathing={false}
              screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                className="sm2-ora-cocoon sm2-ora-pulse"
                src={PLACEHOLDER_ART.forming}
                alt=""
                width={128}
                height={128}
              />
            </Viewport>
            <span className="sm2-ora-spin" aria-hidden="true">
              <Icon name="sync" size={24} tone="primary" />
            </span>
            <p style={{ ...sm2Text, margin: 0 }}>
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

            {/* WP1.1 — O CASULO, e depois a criatura — DENTRO do vidro do
                cartão (canvas Onboarding-oráculo D-Q9: uma peça, um lugar; a
                criatura toma forma onde vai ficar). Enquanto o desenho vem, o
                casulo `forming` pulsa por posição no vidro 192² (D-Q11) numa
                região `role=status` com texto. Passado o teto (`REVEAL_WAIT_MS`,
                D9), o vidro mostra o cristal APAGADO (`dormant` — "ainda vai
                nascer", que é a definição do D1) e uma linha diz que o desenho
                chega sozinho: nunca `glitch` (rachado = falhou + retry, e aqui
                não há retry), nunca arte de reserva (S4). O sprite tardio entra
                no jogo pelo acervo, no tempo dele.
                WP1.6 — o cartão de nascimento é a MESMA peça que aparece
                depois nas Estatísticas. Ser a mesma coisa é o ponto: um
                cartão desenhado duas vezes divergiria, e o que a pessoa
                guarda na memória não seria o que ela reencontra. */}
            <div style={{ margin: '8px 0 20px' }}>
              <BirthCard
                spriteUrl={revealSprite?.url}
                pending={revealSprite ? null : revealEsperando ? 'forming' : 'dormant'}
                name={result.creature.baseName}
                epithet={essence ? (isPt ? essence.pt : essence.en) : null}
                soulGoal={soulGoal}
                language={isPt ? 'pt-BR' : 'en-US'}
              />
              {!revealSprite && !revealEsperando && (
                /* §17 V6 / achado e — a frase sob a moldura sem sprite (copy
                   proposta pelo canvas, `RevealSemSprite`): 12 `muted`, sem
                   `role`, sem "retry", sem erro. */
                <p style={{ ...sm2Hint, margin: '12px 0 0', textAlign: 'center' }}>
                  {isPt
                    ? 'O desenho ainda está sendo feito — chega sozinho, mais tarde.'
                    : 'The drawing is still being made — it arrives on its own, later.'}
                </p>
              )}
            </div>

            <div style={{
              padding: '16px 16px', marginBottom: 20, borderRadius: 12,
              border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
              textAlign: 'left',
            }}>
              <p style={{ ...sm2Text, margin: 0 }}>{L(result.creature.bio)}</p>
            </div>

            {/* WP1.15 — O BATISMO ACONTECE AQUI, e não no cadastro.
                Batizar é o gesto de posse do momento em que a criatura
                aparece; no meio de "últimos detalhes", entre apelido e
                e-mail, ele lia como mais um campo de formulário. O campo vem
                PREENCHIDO com o nome sugerido: manter é seguir em frente,
                trocar é digitar por cima. */}
            {!isUpgrade && (
              <div style={{ textAlign: 'left', marginBottom: 20 }}>
                <label style={sm2Label} htmlFor="onb-petname">
                  {isPt ? 'Batize seu Soulmon' : 'Name your Soulmon'}
                </label>
                <Field
                  id="onb-petname"
                  type="text"
                  value={petNameValue}
                  maxLength={24}
                  onChange={e => setPetNameEdit(e.target.value)}
                />
                <p style={{ ...sm2Hint, margin: '6px 0 0' }}>
                  {isPt
                    ? `${registerDisplayName} é o nome que veio com ele. Se quiser dar outro, é só escrever por cima.`
                    : `${registerDisplayName} is the name it came with. Want to give it another? Just type over it.`}
                </p>
              </div>
            )}

            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => {
                /* WP0.12 — `reveal_seen` com a FAIXA de tempo. O schema
                   existia desde o WP0.5 com `has_sprite`, e a duração entrou
                   no WP0.8/0.12 esperando exatamente esta fiação: sem ela não
                   dava para saber se o reveal foi OLHADO ou pulado — que é a
                   única pergunta que justifica ter feito a cerimônia. */
                const seg = (Date.now() - (revealAbertoEmRef.current || Date.now())) / 1000;
                track('reveal_seen', {
                  has_sprite: revealSprite ? 1 : 0,
                  funnel: TELEMETRY_FUNNEL.paid,
                  duration: revealDurationBucket(seg),
                });
                // ⚠️ O `revealSprite` viaja JUNTO, e a auditoria de 06/09/2026
                // achou esta assinatura sem ele: o upgrade mostrava um bicho no
                // reveal e o app gerava outro logo depois, porque a biblioteca
                // do recém-comprador nasce vazia (o demo nunca gera sprite) e o
                // `birthBatch` pedia a forma inicial do zero. É o MESMO dano
                // que o WP1.1 consertou no nascimento, sobrevivendo na única
                // rota de quem acabou de pagar pela criatura própria.
                if (isUpgrade) onRevealed?.(result, revealSprite ?? undefined); else setStep(REGISTER);
              }}
            >
              {/* Sem seta: o verbo já é o botão (canvas Reveal — "Hatch ‹nome›"
                  primário, 2 paradas de foco no reveal pago: o nome e este). */}
              {isPt ? `Nascer ${registerDisplayName}` : `Hatch ${registerDisplayName}`}
            </button>
          </div>
        )}

        {/* REVEAL DEMO (REGISTRO 13.19 / canvas §31 `RevealDemo`, ONB-44): a
            leitura de quem a pessoa seria, feita das 6 respostas, com a
            criatura em SILHUETA (D-Q8 — a mesma peça por `mask-image` de uma
            linha pronta; nenhuma é "a dela": a criatura própria, sprite e
            árvore, só pagando); sem "Born" (o demo nasce no cadastro); sem
            epíteto (a linha de essência vem do pipeline completo, que precisa
            do mapa astral que o demo não deu). Abaixo, a descrição e a
            OFERTA da 13.1: card dispensável de 280 com o × 44 ("Not now"), e
            "Continue with a demo character" com PESO DE PRIMÁRIO (D-Q13 /
            F1 da crítica — a régua de morte da 13.1 mede a conversão desta
            tela, e uma saída grátis mais fraca do que o decidido mediria outra
            coisa). Dispensar ou continuar → `DEMO_PICK`; a leitura fica para
            o upgrade. */}
        {step === REVEAL_DEMO && demoReading && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ ...sm2Hint, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 500 }}>
              {isPt ? 'A criatura da sua alma' : 'Your soul\'s creature'}
            </p>
            <div style={{ margin: '8px 0 20px' }}>
              <BirthCard
                spriteUrl={getDemoSprite(PREMADE_CHARACTERS[0].id, 'rookie')}
                silhouette
                name={demoReading.creature.baseName}
                soulGoal={soulGoal}
                language={isPt ? 'pt-BR' : 'en-US'}
              />
            </div>
            <div style={{
              padding: '16px 16px', marginBottom: 20, borderRadius: 12,
              border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
              textAlign: 'left',
            }}>
              <p style={{ ...sm2Text, margin: 0 }}>{L(demoReading.creature.bio)}</p>
            </div>
            {/* A oferta (13.1): largura parcial — a assimetria diz "opcional";
                o × é o "Not now" com o próprio alvo 44, pelado (ícone nunca em
                box). A compra sai por `handleUnlockFull`, o mesmo caminho do
                `CHOICE_STEP` (reason `onboarding`). */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <div data-nudge style={{ flex: '0 1 280px', minWidth: 0, textAlign: 'left' }}>
                <UnlockNudge
                  language={isPt ? 'pt-BR' : 'en-US'}
                  reason="reveal-demo"
                  onOpen={() => { void handleUnlockFull(); }}
                />
              </div>
              <button
                type="button"
                className="sm2-ora-back"
                aria-label={isPt ? 'Agora não' : 'Not now'}
                onClick={() => {
                  track('unlock_dismiss', { reason: unlockReasonCode('reveal-demo') });
                  setStep(DEMO_PICK);
                }}
              >
                <Icon name="close" size={24} tone="inherit" />
              </button>
            </div>
            {unlockMessage && (
              <p role="alert" style={{ ...alertStyle, marginBottom: 12, textAlign: 'left' }}>{unlockMessage}</p>
            )}
            <button
              type="button"
              style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => setStep(DEMO_PICK)}
            >
              {isPt ? 'Continuar com um personagem demo' : 'Continue with a demo character'}
            </button>
          </div>
        )}

        {/* Register — nickname (identidade pública) + e-mail (sync) */}
        {step === REGISTER && (result || demoChar) && (
          <div style={{ paddingTop: 20 }}>
            <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 18 }}>
              {isPt ? 'Últimos detalhes' : 'Last details'}
            </h2>

            {/* WP1.15 — o BATISMO saiu daqui e foi para o REVEAL. Batizar é
                o gesto de posse do momento em que a criatura aparece; entre
                apelido e e-mail ele lia como mais um campo de formulário.
                Quem chega do caminho DEMO não passa pelo reveal, então para
                ele o campo continua aqui. */}
            {/* WP1.12 — MICRO-POSSE NO DEMO.
                Os três personagens pré-prontos são iguais para todo mundo, e
                "meu bichinho" começa sendo o bichinho de todo mundo. O tint é
                a menor coisa possível que transforma um personagem emprestado
                em algo escolhido — e é o oposto de uma mecânica: nenhuma
                regra, atributo ou preço olha para ele. */}
            {/* O NASCIMENTO COM A CRIATURA (O1, D-O11): vidro 192² com anel
                (sprite 256² a 128 — a mesma peça da Ficha, Pet D-P2), na
                tonalidade escolhida. `role=img` porque a criatura é conteúdo,
                não decoração (R6). */}
            {demoChar && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                <Viewport
                  width={96}
                  height={96}
                  scale={2}
                  label={isPt ? `${registerDisplayName}, na tonalidade ${demoTint + 1}` : `${registerDisplayName}, in tint ${demoTint + 1}`}
                  screenStyle={{ position: 'relative' }}
                >
                  <img
                    src={getSpriteForStage('rookie', demoChar.id)}
                    alt=""
                    data-hero
                    width={128}
                    height={128}
                    style={{ position: 'absolute', left: 32, top: 32, width: 128, height: 128, imageRendering: 'pixelated', filter: demoTintFilter(demoTint) }}
                  />
                </Viewport>
              </div>
            )}
            {/* As 4 tonalidades como SLOTS 64² (D-O12: SIS-07 `viewport-bg`,
                sprite a 64 = 0,25×, `hue-rotate` — o único filtro aceito no
                vidro, muda matiz e não alfa); seleção = anel INTERNO 2px
                `primary-ink` (forma, não só cor). Eram 48 com o sprite a 36. */}
            {demoChar && (
              <div style={{ marginBottom: 18 }}>
                <span style={sm2Label}>{isPt ? 'Tonalidade' : 'Tint'}</span>
                <div role="group" aria-label={isPt ? 'Tonalidade' : 'Tint'} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {DEMO_TINTS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={demoTint === i}
                      aria-label={isPt ? `Tonalidade ${i + 1}` : `Tint ${i + 1}`}
                      onClick={() => setDemoTint(i)}
                      style={{
                        width: 64, height: 64, padding: 0, border: 'none', background: 'none',
                        borderRadius: 'var(--sm2-radius-md)', cursor: 'pointer', display: 'inline-flex',
                      }}
                    >
                      <MiniGlass
                        size={64}
                        style={{
                          borderRadius: 'var(--sm2-radius-md)',
                          boxShadow: demoTint === i ? 'inset 0 0 0 2px var(--sm2-primary-ink)' : undefined,
                        }}
                      >
                        <img
                          src={getSpriteForStage('rookie', demoChar.id)}
                          alt=""
                          width={64}
                          height={64}
                          style={{ width: 64, height: 64, display: 'block', imageRendering: 'pixelated', filter: demoTintFilter(i) }}
                        />
                      </MiniGlass>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {demoChar && (
              <>
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
              </>
            )}

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
            <button type="button" style={{ ...sm2Button('primary', !canFinish), width: '100%', marginTop: 24 }}
              onClick={finish} disabled={!canFinish}
              aria-label={isPt ? `Nascer ${petNameFinal}` : `Hatch ${petNameFinal}`}
              aria-busy={submitting}>
              {submitting
                ? <Spinner />
                : (isPt ? `Nascer ${petNameFinal}` : `Hatch ${petNameFinal}`)}
            </button>
            {/* Sem isto o botao so ficava apagado e o toque nao fazia nada —
                o usuario nao tinha como saber o que faltava. O e-mail saiu da
                lista de pendencias: ele ja foi comprovado no portao. */}
            {!canFinish && !submitting && (
              <p style={{ ...sm2Hint, marginTop: 8, textAlign: 'center' }}>
                {isPt ? 'Escolha um apelido com pelo menos 2 letras.' : 'Pick a nickname with at least 2 letters.'}
              </p>
            )}
            {unlockMessage && (
              <p role="alert" style={{ ...alertStyle, marginTop: 12 }}>{unlockMessage}</p>
            )}
            {/* "Back" `[novo]` (B1): o bloco global de "Voltar" cobre só
                `1..FAVORITE_STEP`; no demo volta à escolha do personagem. */}
            {demoChar && (
              <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 12 }} onClick={back}>
                <Icon name="arrow_back" size={20} />
                {isPt ? 'Voltar' : 'Back'}
              </button>
            )}
          </div>
        )}

        {/* Navegação (para passos com input manual) */}
        {/* D-Q2: o voltar é `arrow_back` 24 PELADO num alvo 44 em `ink` (regra
            do dono: ícone nunca em box), rótulo só no nome acessível;
            "Continue" primário toma o resto da linha e é INERTE POR SUPERFÍCIE
            (`surface-2` + `muted`, D-Q3) até o passo valer. Sem seta no
            "Continue": o verbo já é o botão. */}
        {step >= 1 && step <= FAVORITE_STEP && (
          <div className="sm2-ora-nav" style={{ marginTop: 'auto', paddingTop: 24 }}>
            <button type="button" className="sm2-ora-back" onClick={back} aria-label={isPt ? 'Voltar' : 'Back'}>
              <Icon name="arrow_back" size={24} tone="inherit" />
            </button>
            <button
              type="button"
              style={{ ...sm2Button('primary', !canAdvance()), flex: 1, minWidth: 0 }}
              onClick={next}
              aria-disabled={!canAdvance() || undefined}
              tabIndex={canAdvance() ? undefined : -1}
            >
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          </div>
        )}
        {/* Passos que avançam sozinhos ao escolher: só precisam de "voltar",
            sozinho na linha. Cobre as 6 do ritual — DA PRIMEIRA (§17 V2,
            decisão do dono 15/09: a 1ª volta à criatura favorita; era o único
            passo do ritual pago sem saída de correção) — E os 20 itens do
            teste, do primeiro em diante, porque voltar de lá devolve a
            bifurcação para quem entrou no teste longo sem querer. */}
        {((step >= QUIZ_START && step < QUIZ_END) || (step >= DEEP_START && step < DEEP_END)) && (
          <div className="sm2-ora-nav" style={{ marginTop: 4 }}>
            <button type="button" className="sm2-ora-back" onClick={back} aria-label={isPt ? 'Voltar' : 'Back'}>
              <Icon name="arrow_back" size={24} tone="inherit" />
            </button>
          </div>
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
