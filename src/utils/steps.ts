/**
 * CONTADOR DE PASSOS (opcional, leve, com degradação graciosa)
 * ===========================================================
 *
 * Camada fininha sobre `@capgo/capacitor-pedometer` (Android:
 * `Sensor.TYPE_STEP_COUNTER`; iOS: `CMPedometer`) mais as funções PURAS que
 * transformam a leitura crua do sensor num agregado diário confiável.
 *
 * REGRAS DE PRODUTO — LEIA ANTES DE LIGAR ISTO EM QUALQUER PONTUAÇÃO
 * -----------------------------------------------------------------
 * 1. **PASSOS NUNCA PONTUAM SOZINHOS.** O princípio do app é
 *    *"declarado pontua, inferido confirma e enriquece"* (`docs/PLANO-TAREFAS.md`,
 *    Parte 3). Passo é sinal INFERIDO. Os dois usos legítimos são:
 *      (a) **selo de "verificado" + bônus pequeno** num hábito de
 *          Fitness/Health que o usuário JÁ marcou como feito — o hábito
 *          marcado é que vale; o passo só confirma;
 *      (b) **missões corporais OPCIONAIS com teto diário** — conteúdo extra,
 *          nunca requisito de meta, de coração, de dia perfeito ou de evolução
 *          (a missão especial diária vive em `utils/specialMissions.ts`).
 *    Nenhuma função deste arquivo devolve HP, energia, `perfectDays` ou peso de
 *    esforço, e nenhuma delas deve passar a devolver.
 * 2. **Quem não tem sensor não pode ficar em desvantagem ESTRUTURAL.** A maior
 *    parte da base joga na PWA, onde não existe sensor nenhum. Tudo aqui
 *    degrada em silêncio: `isStepsAvailable()` responde `false`,
 *    `readStepsToday()` responde `null`, e o app segue idêntico — só sem
 *    passos. Se um dia uma recompensa só alcançável com sensor aparecer, a
 *    regra 1 já foi quebrada.
 *    REVOGADA EM PARTE (dono, 19/10/2026, REGISTRO §106): a missão especial de
 *    passos existe só para quem tem sensor; quem não tem recebe a missão de
 *    descanso no lugar, com o MESMO peso e o mesmo teto (1/dia) — a alternativa
 *    recomendada que perdeu era uma missão equivalente declarada.
 * 3. **Consentimento explícito ANTES de pedir a permissão.** `ACTIVITY_RECOGNITION`
 *    é permissão de runtime simples (não é Health Connect), mas a política do
 *    Play e a LGPD exigem dizer, em texto, O QUE é lido e PARA QUÊ antes do
 *    diálogo do sistema. Esse texto é `stepsConsentCopy(language)` — EN e
 *    PT-BR, como todo texto do app. Chamar `requestStepsPermission()` sem ter
 *    mostrado essa tela é bug de conformidade, não de UX.
 * 4. **Guarda-se só o AGREGADO DIÁRIO** (`{ date, baseline, today }`), nunca a
 *    série bruta, nunca horário de passo, nunca localização. Minimização de
 *    dados; e sem série não há como inferir rotina de ninguém.
 *
 * HEALTH CONNECT (decisão REVISTA pelo dono em 26/10/2026, REGISTRO §176)
 * ------------------------------------------------------------
 * Até 26/10/2026 esta seção dizia "não Health Connect": o custo de conformidade
 * (declaração de saúde no Play Console, política dedicada) parecia grande para
 * um bônus. O dono REVOGOU a linha vermelha em 20/10 (modal) e 26/10 (execução):
 * Health Connect é permitido, SÓ com opt-in explícito (o cartão curto do fim do
 * onboarding), SÓ leitura (`READ_STEPS`), SÓ o total do dia. É ele que conta
 * COM O APP FECHADO (as fontes gravam lá); o app lê ao abrir e em primeiro plano.
 * Fonte preferida: Health Connect; sem ele, cai no contador do aparelho abaixo
 * (APK antigo / aparelho sem o app do Health Connect); sem nenhum, a feature some.
 * - **Google Fit**: continua fora — as APIs morrem no fim de 2026; não se
 *   escreve linha nova contra ele (o Health Connect é a API que o substitui).
 *
 * O RESET DO CONTADOR — O BUG QUE MORA AQUI
 * -----------------------------------------
 * `TYPE_STEP_COUNTER` conta ACUMULADO DESDE O BOOT e **zera no reboot**. E o
 * plugin acrescenta um segundo reset: no Android ele entrega passos desde o
 * `startMeasurementUpdates()` da SESSÃO, então relançar o app também derruba o
 * número para 0. Os dois casos têm exatamente a mesma assinatura — *a leitura
 * crua caiu abaixo da última leitura* — e por isso são tratados pelo mesmo
 * caminho, em função pura e testável (`stepsDeltaFrom` / `updateStepBaseline`).
 * Consequência prática, e é ela que garante o invariante: **nunca devolvemos
 * passo negativo**, e uma queda do acumulado só pode ADICIONAR ao total do
 * dia, jamais subtrair.
 *
 * Limitação honesta do desenho leve: passos dados com o app morto e o aparelho
 * não reiniciado ficam de fora (a sessão do plugin começa do zero). Isso é
 * aceitável exatamente porque passo não pontua sozinho — subcontar não tira
 * nada de ninguém.
 */

import { Capacitor } from '@capacitor/core';
import type { Language } from './i18n';

/** Meta diária padrão. Referência de caminhada regular, não meta médica. */
export const DEFAULT_STEP_GOAL = 5000;
export const STEP_GOAL_MIN = 1000;
export const STEP_GOAL_MAX = 30000;
/** Metas oferecidas ao jogador (qualquer inteiro em [MIN, MAX] é aceito ao carregar). */
export const STEP_GOAL_OPTIONS = [3000, 5000, 8000, 10000] as const;

/** Meta escolhida → inteiro em [MIN, MAX]; inválida → padrão. */
export function sanitizeStepGoal(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return DEFAULT_STEP_GOAL;
  return Math.min(STEP_GOAL_MAX, Math.max(STEP_GOAL_MIN, Math.floor(v)));
}

/**
 * O ÚNICO formato persistido (opcional no GameState: `steps?: StepsRecord`).
 * Agregado diário e nada mais.
 */
export interface StepsRecord {
  /** dayKey do dia agregado (`Date.prototype.toDateString`, convenção do repo). */
  date: string;
  /**
   * Última leitura CRUA vista do sensor. É o offset: o que entra em `today` é
   * sempre a diferença contra ele. Guardar a última leitura (e não o valor do
   * início do dia) é o que faz reboot e relançamento caírem no mesmo caso.
   */
  baseline: number;
  /** Total de passos atribuídos a este dia. Monotônico dentro do dia. */
  today: number;
}

/** dayKey do repo (mesma convenção de `habitRhythm`/`restWindow`). */
export function stepsDayKey(date: Date): string {
  return date.toDateString();
}

function sane(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Quantos passos NOVOS uma leitura crua representa, dado o último acumulado
 * visto. Função pura — é aqui que o reboot é decidido.
 *
 * - `raw >= baseline`: caminhada normal → `raw - baseline`.
 * - `raw <  baseline`: o contador zerou (reboot do aparelho ou nova sessão do
 *   plugin) → o próprio `raw` é tudo o que foi andado desde o zero.
 * - Entrada inválida (NaN, negativa, indefinida) → 0.
 *
 * NUNCA devolve número negativo.
 */
export function stepsDeltaFrom(baseline: number, raw: number): number {
  const r = sane(raw);
  const b = sane(baseline);
  if (r < b) return r; // contador reiniciou
  return r - b;
}

/**
 * Aplica uma leitura crua ao registro do dia. Pura; `dayKey` entra por
 * parâmetro (nunca `Date.now()` aqui dentro).
 *
 * - Sem registro, ou registro de OUTRO dia → começa o dia zerado ancorado na
 *   leitura atual (`today = 0`, `baseline = raw`). A virada do dia não herda
 *   passo de ontem nem tenta adivinhar quanto do acumulado foi de hoje.
 * - Mesmo dia → soma o delta de `stepsDeltaFrom` e reancora o baseline.
 *
 * `today` só cresce dentro de um mesmo dia.
 */
export function updateStepBaseline(
  record: StepsRecord | null | undefined,
  raw: number,
  dayKey: string,
): StepsRecord {
  const r = sane(raw);

  if (!record || record.date !== dayKey) {
    return { date: dayKey, baseline: r, today: 0 };
  }

  const delta = stepsDeltaFrom(record.baseline, r);
  return {
    date: dayKey,
    baseline: r,
    today: Math.max(0, sane(record.today) + delta),
  };
}

/**
 * Aplica o TOTAL do dia lido do Health Connect (que já é "desde a meia-noite local", agregado pela própria fonte).
 * Diferente de `updateStepBaseline`: não há acumulado-de-boot a diferenciar, então um dia novo NÃO começa em zero (o
 * Health Connect contou o dia inteiro com o app fechado). Dentro do dia `today` só cresce (uma leitura menor — fonte
 * ainda sincronizando, relógio atrasado — nunca desfaz passo já visto). Entrada inválida → devolve o registro como está.
 */
export function applyDayTotal(
  record: StepsRecord | null | undefined,
  total: number,
  dayKey: string,
): StepsRecord {
  const t = sane(total);
  if (!record || record.date !== dayKey) return { date: dayKey, baseline: t, today: t };
  return { date: dayKey, baseline: t, today: Math.max(sane(record.today), t) };
}

/**
 * Progresso da meta, de 0 a 1 (nunca acima de 1, nunca abaixo de 0).
 * Meta inválida (0 ou negativa) devolve 0 — sem meta não há progresso, e
 * dividir por zero não vira 100%.
 */
export function stepsGoalProgress(steps: number, goal: number = DEFAULT_STEP_GOAL): number {
  const g = sane(goal);
  if (g <= 0) return 0;
  const s = sane(steps);
  return Math.min(1, s / g);
}

// ── Consentimento (mostrar ANTES de requestStepsPermission) ────────────────

export interface StepsConsentCopy {
  title: string;
  /** UMA frase: o que acontece ao dizer sim (a missão bônus). */
  what: string;
  /** Meta: pergunta curta sobre quantos passos. */
  goalLabel: string;
  /** Uma linha de privacidade: o que é lido e o que não sai daqui. */
  privacy: string;
  accept: string;
  decline: string;
}

/**
 * Texto do cartão de passos, EN + PT-BR, CURTO (decisão do dono, 20/10/2026: "tira aquele textão"). Ainda precisa
 * dizer o que é lido e que não pontua sozinho — o diálogo do sistema só vem depois do "sim", num fluxo só.
 * O aviso longo vive na política de privacidade (`#steps`).
 */
export function stepsConsentCopy(language: Language): StepsConsentCopy {
  if (language === 'pt-BR') {
    return {
      title: 'Você deseja usar a contagem de passos?',
      what: 'Ao fazer isso você ativa uma missão bônus.',
      goalLabel: 'Quantos passos por dia?',
      privacy: 'Lemos só o total de passos do dia, pelo Health Connect, e nada sai do seu aparelho além disso. Passos nunca valem ponto sozinhos.',
      accept: 'Sim, quero',
      decline: 'Agora não',
    };
  }
  return {
    title: 'Do you want to use step counting?',
    what: 'Doing so turns on a bonus mission.',
    goalLabel: 'How many steps a day?',
    privacy: 'We read only your daily step total, through Health Connect. Steps never score on their own.',
    accept: 'Yes, count them',
    decline: 'Not now',
  };
}

// ── Camada nativa (import DINÂMICO, degradação graciosa) ───────────────────
// Mesmo padrão de `utils/notifications.ts`: fora do app nativo nada é
// carregado e toda função responde com o valor "não tem sensor".

type Pedometer = typeof import('@capgo/capacitor-pedometer')['CapacitorPedometer'];

/** O plugin vai DENTRO de uma caixa: devolver o proxy do Capacitor direto por uma Promise (`.then`/`async`/`await`) faz o JS chamar `.then` nele,
 *  e o Capacitor responde `"CapacitorPedometer.then()" is not implemented on android` — o `.catch` engolia isso e o contador de passos ficava
 *  desligado no Android (33 relatórios por dia, 20/10/2026). Quem usa lê `box.plugin` e nunca devolve o plugin por uma Promise. */
interface PedometerBox { plugin: Pedometer }

let pedometerPromise: Promise<PedometerBox | null> | null = null;
let updatesStarted = false;

async function loadPedometer(): Promise<PedometerBox | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!pedometerPromise) {
    pedometerPromise = import('@capgo/capacitor-pedometer')
      .then((mod) => (mod.CapacitorPedometer ? { plugin: mod.CapacitorPedometer } : null))
      .catch(() => null);
  }
  return pedometerPromise;
}

// ── Health Connect (fonte preferida; REGISTRO §176) ─────────────────────────
// FEATURE DETECT: APK antigo não tem o plugin `SoulmonHealth` (`isPluginAvailable` = false) e a web nunca tem;
// em ambos o Health Connect simplesmente "não existe" e o resto do app segue idêntico. Mesma caixa do pedômetro
// (nunca devolver o proxy do Capacitor por uma Promise).

type HealthPlugin = typeof import('../plugins/SoulmonHealthPlugin')['SoulmonHealth'];
interface HealthBox { plugin: HealthPlugin }

let healthPromise: Promise<HealthBox | null> | null = null;
let healthAvailablePromise: Promise<boolean> | null = null;

async function loadHealth(): Promise<HealthPlugin | null> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('SoulmonHealth')) return null;
  if (!healthPromise) {
    healthPromise = import('../plugins/SoulmonHealthPlugin')
      .then((mod) => (mod.SoulmonHealth ? { plugin: mod.SoulmonHealth } : null))
      .catch(() => null);
  }
  return (await healthPromise)?.plugin ?? null;
}

/** O Health Connect está instalado e pronto neste aparelho? (cacheado: a resposta não muda com o app aberto) */
export async function isHealthConnectAvailable(): Promise<boolean> {
  const health = await loadHealth();
  if (!health) return false;
  if (!healthAvailablePromise) {
    healthAvailablePromise = health.isAvailable().then((r) => r?.available === true).catch(() => false);
  }
  return healthAvailablePromise;
}

async function hasHealthPermission(): Promise<boolean> {
  if (!(await isHealthConnectAvailable())) return false;
  try {
    return (await (await loadHealth())!.hasPermission())?.granted === true;
  } catch {
    return false;
  }
}

/** O aparelho tem como contar passos (Health Connect OU contador do aparelho)? Web/PWA e aparelho sem nenhum → false. */
export async function isStepsAvailable(): Promise<boolean> {
  if (await isHealthConnectAvailable()) return true;
  return isPedometerAvailable();
}

async function isPedometerAvailable(): Promise<boolean> {
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return false;
  try {
    const result = await pedometer.isAvailable();
    return result?.stepCounting === true;
  } catch {
    return false;
  }
}

/** Já temos permissão (em qualquer das fontes)? Não abre diálogo nenhum. */
export async function hasStepsPermission(): Promise<boolean> {
  if (await hasHealthPermission()) return true;
  return hasPedometerPermission();
}

async function hasPedometerPermission(): Promise<boolean> {
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return false;
  try {
    const status = await pedometer.checkPermissions();
    return status?.activityRecognition === 'granted';
  } catch {
    return false;
  }
}

/**
 * Pede a permissão de reconhecimento de atividade.
 * **Só chame depois de mostrar `stepsConsentCopy`** (ver regra 3 no topo).
 */
export async function requestStepsPermission(): Promise<boolean> {
  // Um fluxo só: o "sim" do cartão abre direto o diálogo do Health Connect. Negou lá = recusa (sem cair no contador
  // do aparelho por baixo dos panos: a pessoa disse não à leitura de passos).
  if (await isHealthConnectAvailable()) {
    try {
      return (await (await loadHealth())!.requestPermission())?.granted === true;
    } catch {
      return false;
    }
  }
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return false;
  try {
    if (!(await isPedometerAvailable())) return false;
    const status = await pedometer.requestPermissions();
    return status?.activityRecognition === 'granted';
  } catch {
    return false;
  }
}

/**
 * Lê a leitura crua do sensor. `null` = sem sensor, sem permissão ou erro —
 * e `null` NUNCA é 0: zerar o dia por causa de uma leitura que falhou seria
 * apagar passo que o usuário deu.
 */
async function readRawSteps(now: Date): Promise<number | null> {
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return null;
  try {
    if (!(await hasPedometerPermission())) return null;

    // No Android o `getMeasurement` só responde algo útil com as atualizações
    // ligadas (o valor é relativo ao início da sessão). Idempotente.
    if (!updatesStarted) {
      await pedometer.startMeasurementUpdates();
      updatesStarted = true;
    }

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    // `start`/`end` são usados pelo CMPedometer no iOS; o Android ignora.
    const measurement = await pedometer.getMeasurement({
      start: start.getTime(),
      end: now.getTime(),
    });
    const steps = measurement?.numberOfSteps;
    return typeof steps === 'number' && Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : null;
  } catch {
    updatesStarted = false;
    return null;
  }
}

/**
 * Agregado de passos de hoje. Recebe o registro anterior (o que estaria no
 * GameState) e devolve o registro atualizado, ou `null` quando não há sensor /
 * permissão / leitura — caso em que o chamador deve manter o registro que já
 * tinha, sem tocar em nada.
 */
export async function readStepsToday(
  now: Date,
  previous?: StepsRecord | null,
): Promise<StepsRecord | null> {
  // Health Connect primeiro (é o que conta com o app fechado); `null` NUNCA é 0.
  if (await hasHealthPermission()) {
    try {
      const r = await (await loadHealth())!.readStepsToday();
      if (typeof r?.steps === 'number' && Number.isFinite(r.steps)) return applyDayTotal(previous, r.steps, stepsDayKey(now));
    } catch { /* cai no contador do aparelho, se houver */ }
  }
  const raw = await readRawSteps(now);
  if (raw === null) return null;
  return updateStepBaseline(previous, raw, stepsDayKey(now));
}

/** Só para os testes: esquece o módulo carregado e o estado da sessão. */
export function __resetStepsRuntime(): void {
  healthPromise = null;
  healthAvailablePromise = null;
  pedometerPromise = null;
  updatesStarted = false;
}
