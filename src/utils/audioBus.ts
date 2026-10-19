/**
 * O BARRAMENTO DE ÁUDIO — run `som-01`, Fase 2, fatia 2.
 *
 * ## O que existia antes
 *
 * `sounds.ts` abria **um `AudioContext` novo a cada `play()`**, tocava e fechava
 * em 2 s. Sem barramento, sem sub-mix, sem ducking, sem volume — só um `mute`
 * booleano. Consequência: dois sons simultâneos somavam em cima um do outro sem
 * ninguém arbitrando, e não havia onde pendurar teto de true peak nem volume.
 *
 * ## O que existe agora
 *
 * O desenho medido no spike da Fase 1 (`prototyper/grafo.ts`, provado no
 * Chromium real), promovido: **UM** contexto compartilhado, sub-mix por
 * categoria, master com limitador no teto S3, e os dois duckings da spec §6.2.
 *
 *     fonte → bus da categoria → bus SFX → duckGeral → master → limitador → saída
 *                     ↑ Arcade passa antes pelo duckArcade (D-2)
 *     camadas da trilha → bus Trilha → duckGeral ↑
 *     música-tema (<audio>) → bus Tema → duckGeral ↑
 *     Marco → master  (NÃO passa pelo duckGeral: ele é quem duca — D-1)
 *
 * ## As quatro restrições que este arquivo não pode quebrar
 *
 * 1. **Autoplay.** Um `AudioContext` compartilhado criado cedo demais nasce
 *    `suspended` e fica assim — tratar isso "por acidente" (esperando que algum
 *    clique futuro o destrave) é como se perde som em Safari. Aqui o contexto é
 *    criado **preguiçosamente, na primeira chamada de `tocarNa`**, que neste app
 *    só acontece dentro de um handler de gesto; e se mesmo assim ele nascer
 *    `suspended`, `resume()` é chamado **explicitamente**, a cada tentativa.
 * 2. **D11.** Nada toca com `document.hidden`. A asserção normativa continua no
 *    CHAMADOR (`som-presenca-d11.render.test.tsx`) — é lá que ela é medível,
 *    porque é lá que ela sempre morou. O guard daqui é a segunda linha: um
 *    chamador novo que esqueça a regra não consegue fazer barulho pelo
 *    barramento.
 * 3. **Mudo total.** O gate de mudo é do `sounds.ts` e vem ANTES desta função:
 *    com `SOUND_MUTED`, `tocarNa` nunca é chamada e **nenhum nó é criado** —
 *    nem o barramento. Contexto construído para "não tocar" já é plumbing
 *    vazando (`sounds.contract.test.ts`).
 * 4. **Não vazar.** O contexto de antes era descartado a cada som; este vive.
 *    Então: com a aba oculta ele é **suspenso** (não fechado — fechar obrigaria
 *    a reconstruir o grafo inteiro na volta), e em `pagehide` ele é **fechado**.
 *    O barramento também se reconstrói sozinho se o contexto em cache estiver
 *    `closed` — sem isso, um `pagehide` seguido de volta (bfcache) deixaria o
 *    app mudo para sempre, sem erro nenhum.
 *
 * ## O que NÃO foi promovido, e por quê
 *
 * - **A máquina de 7 estados E0–E6** da trilha: segue PROPOSTA NÃO VERIFICADA.
 *   O `busTrilha` existe e nasce em 0; as camadas não.
 * - **A liberação do D-1 pelo gesto que fecha a cerimônia** (spec §6.2): esse
 *   gesto não tem hook no código — `MilestoneCeremony` não notifica ninguém ao
 *   fechar. Em vez de inventar um, `duckMarco` recebe a duração do próprio som
 *   e agenda a liberação; `liberarMarco` fica exposto para quando a cerimônia
 *   ganhar o hook. Um duck sem liberação garantida silenciaria o app inteiro.
 */
import { readFlag, readFlagOr, writeFlag, readJson, writeJson, readLocal, writeLocal, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { CategoriaSom } from './loudness';
import { ORDEM_DA_ESCADA, TETO_DBTP, GANHO_DE_CATEGORIA_DB, db2lin } from './loudness';

/* ── §6.2/§6.3 — os dois duckings e o piso técnico de rampa ──────────────── */

/** D-1: Marco abaixa TUDO ao piso em ≤120 ms; volta em 800 ms. */
export const D1_ATAQUE_S = 0.12;
export const D1_LIBERACAO_S = 0.8;
/** D-2: classe superior soando abaixa SÓ o Arcade em 9 dB. */
export const D2_ATAQUE_S = 0.12;
export const D2_LIBERACAO_S = 0.4;
export const D2_PROFUNDIDADE_DB = -9.0;
/** §6.3 — piso técnico: nenhuma rampa mais curta que isto (clique audível). */
export const RAMPA_MINIMA_S = 0.005;

/* ── R-EX (P-1) — "um gesto produz no máximo UMA fonte iniciada" ─────────── */

/**
 * **A JANELA DE COINCIDÊNCIA DA R-EX, em milissegundos.**
 *
 * ⚠️ **Não confundir com o D-1.** O `120` que já existia neste arquivo é
 * `D1_ATAQUE_S = 0.12` — o tempo em que o Marco **abaixa** todo o resto. Isso é
 * *ducking*: atenua, não exclui. Isto aqui é *despacho*: decide **quantas
 * fontes começam**. Os dois números coincidem porque vêm da mesma origem, não
 * porque um é o outro.
 *
 * Origem do número (P-1 item 1, `prototyper/decisoes-regra-p1-p4.md`): é o
 * `--sm-dur-1` do DS visual (`docs/PLANO-DESIGN.md` §1.3, "feedback de toque"),
 * o mesmo token que já era a janela de fade da regra 1 do §4.3 do inventário.
 * **Reusado, não inventado** — um número por arquivo é o que a decisão proíbe.
 *
 * Por que **relógio de parede** (`Date.now()`) e não `ctx.currentTime`: a janela
 * mede *gesto humano*, e `ctx.currentTime` **congela** com o contexto suspenso
 * (aba oculta, autoplay bloqueado). Um relógio que para transformaria dois
 * gestos separados por minutos numa única janela eterna.
 */
export const JANELA_DE_COINCIDENCIA_MS = 120;

/**
 * **Passo 1 do desempate — a classe do §4.2.** Menor número = classe mais alta.
 *
 * Os seis níveis declarados vêm literalmente do §4.2 do `inventario-sonoro.md`
 * (0 Silêncio protegido — que não é categoria, é ausência de despacho —, 1
 * Marco, 2 Presença, 3 Cuidado, 4 Conclusão, 5 Arcade), com **Transação como
 * PAR de Conclusão**: o §4.2 dá às duas exatamente o mesmo perfil de
 * interrupção ("pode interromper 5 · pode ser interrompida por tudo acima") e
 * **não** numera Transação. Empatá-las aqui é transcrever a tabela; o desempate
 * por orçamento (passo 2) então entrega **Transação > Conclusão**, que é a
 * ordem que a P-1 escreveu em prosa. A ordem sai da regra, não de escolha
 * minha.
 *
 * ⚠️ **`degeneracao` e `sintonia` o §4.2 NÃO classifica** — as duas nasceram
 * depois, na escada de loudness. Em vez de inventar um nível para elas, cada
 * uma **empata** com a classe declarada de que a decisão já a aproxima, e o
 * passo 2 (orçamento) decide:
 * - `sintonia` empata com **Cuidado**; orçamento 0–2 contra ~6 ⇒ ela vence.
 *   É exatamente o que a P-4 escreveu: *"fica ENTRE Presença (1/sessão) e
 *   Cuidado (~6/sessão)"*.
 * - `degeneracao` empata com **Presença** (ambas ≤1/sessão, ambas a −16 LUFS-M
 *   na escada). Empatá-la com **Marco** era proibido pela P-4 por escrito
 *   (*"lhe daria as obrigações do Marco e a poria dentro do motivo"*).
 *
 * **O que falsifica esta transcrição:** o §4.2 ganhar linha própria para
 * `degeneracao` ou `sintonia`. Aí este mapa muda aqui, e só aqui.
 */
const CLASSE_R_EX: Record<CategoriaSom, number> = {
  marco: 1,
  presenca: 2,
  degeneracao: 2,
  sintonia: 3,
  cuidado: 3,
  conclusao: 4,
  transacao: 4,
  arcade: 5,
};

/**
 * **Passo 2 do desempate — orçamento por sessão do §4.2. MENOR VENCE.**
 * O critério é **repetição**, o mesmo que gera a escada de loudness (§3.2 da
 * spec): quem repete mais perde, porque quem repete mais vale menos por
 * disparo. `Infinity` é a transcrição de *"sem teto de contagem"* (Conclusão) e
 * de *"a única classe onde repetição rápida é esperada"* (Arcade).
 */
const ORCAMENTO_POR_SESSAO: Record<CategoriaSom, number> = {
  marco: 1,
  presenca: 1,
  degeneracao: 1,
  sintonia: 2,
  transacao: 3,
  cuidado: 6,
  conclusao: Number.POSITIVE_INFINITY,
  arcade: Number.POSITIVE_INFINITY,
};

/**
 * **Passo 3 do desempate — gesto vence cascata.** O critério da P-1 é
 * *sintático*: vence o `play*` escrito no handler do gesto do usuário, perde o
 * alcançado por cascata a partir dele. O despacho **não consegue inferir isso
 * em tempo de execução** — quem sabe é quem chama. Por isso é parâmetro, com
 * `'gesto'` como padrão: um chamador que não sabe da distinção não pode piorar
 * a decisão, só empatar nela.
 */
export type OrigemDoDespacho = 'gesto' | 'cascata';

/** O despacho vivo da janela corrente. `null` fora de qualquer janela. */
interface DespachoNaJanela {
  /** Início do GESTO, não do último despacho: a janela não desliza. */
  inicioMs: number;
  cat: CategoriaSom;
  origem: OrigemDoDespacho;
  /** Ganho próprio da fonte — o que permite silenciá-la se ela perder. */
  ganho: GainNode | null;
}

let janelaAtual: DespachoNaJanela | null = null;

/**
 * O desempate da R-EX, na ordem da P-1. `true` = o CANDIDATO vence quem já está
 * soando na janela. O empate residual (item 5) devolve `false`: **vence a
 * primeira despachada**, que é determinismo, não estética.
 */
function candidatoVence(
  cat: CategoriaSom, origem: OrigemDoDespacho, vigente: DespachoNaJanela,
): boolean {
  const a = CLASSE_R_EX[cat], b = CLASSE_R_EX[vigente.cat];
  if (a !== b) return a < b;
  const oa = ORCAMENTO_POR_SESSAO[cat], ob = ORCAMENTO_POR_SESSAO[vigente.cat];
  if (oa !== ob) return oa < ob;
  return origem === 'gesto' && vigente.origem === 'cascata';
}

/**
 * A perdedora sai de cena. §4.3 regra 3 chama isso de **substituição**
 * (retrigger), nunca soma; e a rampa é `RAMPA_MINIMA_S` porque cortar um ganho
 * em degrau é clique audível (§6.3). Sem este passo, "no máximo uma fonte
 * iniciada" seria uma frase: a fonte anterior já começou e continuaria soando.
 */
function silenciar(ganho: GainNode | null, quando: number): void {
  if (!ganho) return;
  try {
    const p = ganho.gain;
    p.cancelScheduledValues?.(quando);
    p.setValueAtTime(p.value, quando);
    p.linearRampToValueAtTime(0, quando + RAMPA_MINIMA_S);
  } catch { /* motor sem agendamento: o pior caso é a fonte anterior soar */ }
}

/** Só para teste: esquece a janela da R-EX. */
export function esquecerJanelaDeCoincidencia(): void {
  janelaAtual = null;
}

/** As classes "superiores": soando, disparam o D-2 sobre o Arcade. */
const SUPERIORES: CategoriaSom[] = [
  'marco', 'presenca', 'degeneracao', 'cuidado', 'conclusao', 'transacao',
];

/* ── Volume por categoria e trilha (persistência) ────────────────────────── */

type Volumes = Partial<Record<CategoriaSom, number>>;

const naFaixa = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1);

function lerVolumes(): Volumes {
  const bruto = readJson<Volumes>(STORAGE_KEYS.SOUND_CATEGORY_VOLUMES, {});
  const limpo: Volumes = {};
  if (bruto && typeof bruto === 'object') {
    for (const c of ORDEM_DA_ESCADA) {
      const v = (bruto as Record<string, unknown>)[c];
      if (typeof v === 'number') limpo[c] = naFaixa(v);
    }
  }
  return limpo;
}

/** Volume de uma categoria, 0..1. Sem chave = **1** (o som nasce no alvo). */
export function volumeDe(cat: CategoriaSom): number {
  return lerVolumes()[cat] ?? 1;
}

export function definirVolume(cat: CategoriaSom, v: number): void {
  const volumes = lerVolumes();
  volumes[cat] = naFaixa(v);
  // Preferência cosmética: não vale gastar o aviso único do usuário se o
  // storage estiver degradado (mesma escolha do `setMuted`).
  writeJson(STORAGE_KEYS.SOUND_CATEGORY_VOLUMES, volumes, { silent: true });
  if (barramento) barramento.busCategoria[cat].gain.value = ganhoLinearDe(cat);
}

function ganhoLinearDe(cat: CategoriaSom): number {
  return db2lin(GANHO_DE_CATEGORIA_DB) * volumeDe(cat);
}

/**
 * A trilha de combate **nasce LIGADA** desde 19/10/2026 (decisão do dono, revoga o
 * "nasce desligada" da S2 para as faixas de combate) mas o autoplay segue vetado (D11): ligada é PREFERÊNCIA, o som só
 * sai depois de um gesto. Só `'false'` gravado desliga: quem já gravou um valor mantém o que gravou. A chave é
 * PRÓPRIA, separada do `mute` global — ver o comentário em `storageKeys.ts`.
 */
export function trilhaLigada(): boolean {
  return readFlagOr(STORAGE_KEYS.SOUND_TRACK_ENABLED, true);
}

/**
 * MIGRAÇÃO ÚNICA das preferências de som (REGISTRO §126, 19/10/2026). Bug do dono: "entrei no combate e não mudou a
 * trilha" — num aparelho que passou pela era da S2 (a trilha nascia DESLIGADA) a chave podia estar gravada como
 * `'false'`, e `trilhaLigada()` só trata AUSENTE como ligada: Masmorra/Duelo seguiam com o tema, sem música de combate.
 * Quem está sem a marca de versão não pode ter escolhido nada DEPOIS do §102 (a marca nasce com este código), então o
 * `'false'` que tem é herança e sai uma vez (volta ao padrão LIGADO). Depois a marca vale `'1'` e um `'false'` vindo do
 * interruptor é escolha e nunca mais é tocado. Idempotente. Chame antes da primeira leitura.
 */
export function migrarPreferenciasDeSom(): void {
  if (readLocal(STORAGE_KEYS.SOUND_PREFS_VERSION) === '1') return;
  if (readLocal(STORAGE_KEYS.SOUND_TRACK_ENABLED) === 'false') removeLocal(STORAGE_KEYS.SOUND_TRACK_ENABLED, { silent: true });
  writeLocal(STORAGE_KEYS.SOUND_PREFS_VERSION, '1', { silent: true });
}

export function definirTrilhaLigada(on: boolean): void {
  writeFlag(STORAGE_KEYS.SOUND_TRACK_ENABLED, on, { silent: true });
  if (barramento) barramento.busTrilha.gain.value = on ? 1 : 0;
}

/* ── O barramento ────────────────────────────────────────────────────────── */

interface Barramento {
  ctx: AudioContext;
  master: GainNode;
  busSfx: GainNode;
  busTrilha: GainNode;
  /** A música-TEMA do jogo (07/10/2026): sempre aberto (0 dB); a chave dela mora em `utils/tema.ts`. */
  busTema: GainNode;
  duckGeral: GainNode;
  duckArcade: GainNode;
  busCategoria: Record<CategoriaSom, GainNode>;
}

let barramento: Barramento | null = null;
/** O construtor com que o contexto em cache foi feito (ver `obterBarramento`). */
let ctorEmUso: unknown = null;

type ComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function construtorDeContexto(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as ComWebkit).webkitAudioContext || null;
}

/** Curva de clipping duro no teto S3, para o WaveShaper com oversample 4x. */
function curvaClip(teto: number, n = 8193): Float32Array<ArrayBuffer> {
  const c = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.max(-teto, Math.min(teto, x));
  }
  return c;
}

function montar(ctx: AudioContext): Barramento {
  const master = ctx.createGain();
  master.gain.value = 1;

  // O limitador é a rede de segurança do teto S3 (−1 dBTP). `createWaveShaper`
  // é checado porque nem todo motor de áudio o tem (WebKit antigo, e os duplos
  // dos testes) — sem ele o master vai direto à saída, que é o comportamento
  // de antes desta fatia, não uma regressão nova.
  if (typeof ctx.createWaveShaper === 'function') {
    const ws = ctx.createWaveShaper();
    ws.curve = curvaClip(db2lin(TETO_DBTP));
    ws.oversample = '4x';
    master.connect(ws);
    ws.connect(ctx.destination);
  } else {
    master.connect(ctx.destination);
  }

  const duckGeral = ctx.createGain();
  duckGeral.gain.value = 1;
  duckGeral.connect(master);

  const busSfx = ctx.createGain();
  busSfx.gain.value = 1;
  busSfx.connect(duckGeral);

  const busTrilha = ctx.createGain();
  busTrilha.gain.value = trilhaLigada() ? 1 : 0;
  busTrilha.connect(duckGeral);

  // Música-tema: bus PRÓPRIO, em 0 dB, no mesmo degrau da trilha (abaixo dos SFX,
  // sob o D-1). O arquivo já sai mestrado no alvo da trilha (`loudness.ts`), então
  // nenhum ganho de nível entra aqui; ligar/desligar é do `utils/tema.ts`.
  const busTema = ctx.createGain();
  busTema.gain.value = 1;
  busTema.connect(duckGeral);

  const duckArcade = ctx.createGain();
  duckArcade.gain.value = 1;
  duckArcade.connect(busSfx);

  const busCategoria = {} as Record<CategoriaSom, GainNode>;
  for (const c of ORDEM_DA_ESCADA) {
    const g = ctx.createGain();
    g.gain.value = ganhoLinearDe(c);
    if (c === 'marco') g.connect(master);           // D-1: Marco não se duca
    else if (c === 'arcade') g.connect(duckArcade); // D-2 age aqui
    else g.connect(busSfx);
    busCategoria[c] = g;
  }

  // `suspended`/`interrupted` com a aba VISÍVEL e sem ninguém ter pedido: retoma (ver `retomarContexto`).
  try {
    ctx.addEventListener?.('statechange', () => {
      const st = ctx.state as string;
      if (st === 'suspended' || st === 'interrupted') retomarContexto();
    });
  } catch { /* motor sem EventTarget no contexto */ }

  return { ctx, master, busSfx, busTrilha, busTema, duckGeral, duckArcade, busCategoria };
}

/**
 * **Retomada do contexto (auditoria da música, 11/10/2026).** O contexto é suspenso com a aba
 * oculta (restrição 4) e o navegador também o suspende sozinho (iOS `interrupted` numa chamada,
 * Chrome ao perder o foco de áudio, APK voltando do segundo plano). Quem lia "a música às vezes
 * não toca" encontrava sempre o mesmo estado: fontes ainda ligadas, `ctx.state === 'suspended'`,
 * e NINGUÉM mandando `resume()` — a trilha só chamava `resume` ao COMEÇAR, e voltar para a aba
 * não começa nada. Aqui é o dono único dessa retomada.
 *
 * D11 intacta: só existe contexto depois de um gesto (`obterBarramento` é chamado de dentro de
 * `tocarNa`/`ligarTrilha`/gesto do tema), e `resume()` sem gesto, num motor que o exige, apenas
 * fica pendente — não toca nada que o jogador não tenha ligado. Aba oculta nunca retoma.
 */
export function retomarContexto(): void {
  const b = barramento;
  if (!b || abaOculta()) return;
  const st = b.ctx.state as string;
  if (st === 'running' || st === 'closed') return;
  try { void b.ctx.resume?.()?.catch?.(() => { /* sem gesto: o próximo gesto tenta */ }); } catch { /* motor sem resume */ }
}

/** A aba dormiu: suspende o contexto em vez de fechá-lo (ver restrição 4); ao voltar, retoma. */
function aoTrocarVisibilidade(): void {
  if (!barramento) return;
  if (typeof document !== 'undefined' && document.hidden) {
    try { void barramento.ctx.suspend?.(); } catch { /* motor sem suspend */ }
    return;
  }
  retomarContexto();
}

/** Voltou do bfcache / do segundo plano do APK / ganhou o foco: o contexto pode ter ficado `suspended`. */
function aoVoltar(): void { retomarContexto(); }

/** O app está sendo fechado: aí sim o contexto morre, e o cache com ele. */
function aoSair(): void {
  encerrarBarramento();
}

/**
 * Os ouvintes são registrados UMA vez na vida do módulo, nunca por contexto.
 * Registrá-los a cada reconstrução acumularia um par a mais por ciclo — o mesmo
 * vazamento que esta fatia veio matar, só que em `document` em vez de em
 * `AudioContext`. Eles são inofensivos com o barramento nulo: ambos começam
 * checando se existe barramento.
 */
let cicloLigado = false;
function ligarCicloDeVida(): void {
  if (cicloLigado) return;
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  // O `resume` do Capacitor (Android) chega como evento do documento; `pageshow`/`focus` cobrem bfcache e foco.
  document.addEventListener('resume', aoVoltar);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', aoSair);
    window.addEventListener('pageshow', aoVoltar);
    window.addEventListener('focus', aoVoltar);
  }
  cicloLigado = true;
}

/**
 * O barramento, construído na primeira necessidade. Devolve `null` quando não
 * há motor de áudio — falhar em silêncio é o contrato de sempre deste módulo.
 *
 * ⚠️ O cache guarda **o construtor usado**. Um contexto em cache cujo construtor
 * não é mais o global vigente é um contexto órfão: no navegador isso nunca
 * acontece (o construtor é o mesmo para sempre), e é justamente por isso que a
 * checagem é barata; num ambiente que troca o motor por baixo, ela é a
 * diferença entre reconstruir e ficar mudo sem erro.
 */
function obterBarramento(): Barramento | null {
  const Ctor = construtorDeContexto();
  if (!Ctor) return null;
  if (barramento && (ctorEmUso !== Ctor || barramento.ctx.state === 'closed')) {
    barramento = null;
  }
  if (!barramento) {
    try {
      const ctx = new Ctor();
      barramento = montar(ctx);
      ctorEmUso = Ctor;
      ligarCicloDeVida();
    } catch {
      return null;
    }
  }
  return barramento;
}

/** Fecha o contexto e esquece o cache. Idempotente. */
export function encerrarBarramento(): void {
  const b = barramento;
  barramento = null;
  ctorEmUso = null;
  // A janela da R-EX é estado do contexto que morreu: mantê-la faria o primeiro
  // som depois de um `pagehide` disputar com um gesto de outra vida do app.
  janelaAtual = null;
  if (!b) return;
  try { void b.ctx.close?.(); } catch { /* já fechado */ }
}

/** Só para teste: o barramento vivo, ou `null`. Não usar em produção. */
export function barramentoAtual(): Barramento | null {
  return barramento;
}

/**
 * O barramento, construído se preciso — para quem toca fora de `tocarNa`
 * (hoje só `utils/trilha.ts`, que tem gesto próprio e vai ao `busTrilha`).
 * Mesmo contrato: `null` = sem motor, falhar em silêncio.
 */
export function garantirBarramento(): Barramento | null {
  return obterBarramento();
}

/**
 * D-1 (§6.2): o Marco abaixa Trilha + SFX ao piso em ≤120 ms. `duracaoDoSom`
 * agenda a liberação, porque o gesto que fecha a cerimônia não tem hook (ver o
 * cabeçalho). Sem essa liberação agendada, um Marco silenciaria o app.
 */
export function duckMarco(quando: number, duracaoDoSom: number): void {
  const b = barramento;
  if (!b) return;
  const p = b.duckGeral.gain;
  p.cancelScheduledValues?.(quando);
  p.setValueAtTime(1, quando);
  p.linearRampToValueAtTime(0, quando + D1_ATAQUE_S);
  const solta = quando + Math.max(D1_ATAQUE_S, duracaoDoSom);
  p.setValueAtTime(0, solta);
  p.linearRampToValueAtTime(1, solta + D1_LIBERACAO_S);
}

/** D-1, liberação por gesto — para quando a cerimônia ganhar o hook. */
export function liberarMarco(quandoGesto: number): void {
  const b = barramento;
  if (!b) return;
  const p = b.duckGeral.gain;
  p.cancelScheduledValues?.(quandoGesto);
  p.setValueAtTime(0, quandoGesto);
  p.linearRampToValueAtTime(1, quandoGesto + D1_LIBERACAO_S);
}

/** D-2 (§6.2): classe superior soando abaixa SÓ o Arcade em 9 dB. */
function duckArcadePor(b: Barramento, cat: CategoriaSom, quando: number, duracao: number): void {
  if (!SUPERIORES.includes(cat)) return;
  const p = b.duckArcade.gain;
  const piso = db2lin(D2_PROFUNDIDADE_DB);
  p.cancelScheduledValues?.(quando);
  p.setValueAtTime(1, quando);
  p.linearRampToValueAtTime(piso, quando + D2_ATAQUE_S);
  const solta = quando + Math.max(D2_ATAQUE_S, duracao);
  p.setValueAtTime(piso, solta);
  p.linearRampToValueAtTime(1, solta + D2_LIBERACAO_S);
}

/** D11, segunda linha: aba oculta não faz barulho. */
function abaOculta(): boolean {
  return typeof document !== 'undefined' && document.hidden === true;
}

/**
 * Toca alguma coisa numa categoria. `montarFonte` recebe o contexto e o nó de
 * ENTRADA do despacho — nunca `ctx.destination`, que é o que fazia cada som
 * ignorar o mix. Devolve a duração do som em segundos (para os duckings) ou
 * nada.
 *
 * Devolve `false` quando não tocou: sem motor, aba oculta, erro do motor, **ou
 * porque a R-EX a descartou** (outro `play*` do mesmo gesto venceu).
 *
 * ⚠️ **Este é o ponto único onde a R-EX mora.** A P-1 atribui a regra ao
 * DESPACHO, não ao grafo, e não existe segunda cópia dela: um `play*` novo
 * herda a regra por passar por aqui, sem que ninguém precise lembrar dela.
 */
export function tocarNa(
  cat: CategoriaSom,
  montarFonte: (ctx: AudioContext, destino: AudioNode) => number | void,
  origem: OrigemDoDespacho = 'gesto',
): boolean {
  if (abaOculta()) return false;
  const b = obterBarramento();
  if (!b) return false;

  // ── R-EX (P-1): um gesto produz no máximo UMA fonte iniciada ────────────
  // A janela é medida em relógio de parede e NÃO desliza: `inicioMs` continua
  // sendo o do primeiro despacho do gesto, senão uma cascata longa esticaria um
  // gesto indefinidamente.
  const agoraMs = Date.now();
  const dentroDaJanela =
    janelaAtual !== null && agoraMs - janelaAtual.inicioMs <= JANELA_DE_COINCIDENCIA_MS;
  const vigente = dentroDaJanela ? janelaAtual : null;
  if (vigente && !candidatoVence(cat, origem, vigente)) {
    // Item 6 da P-1, e regra 2 do §4.3: **descartada, nunca enfileirada.**
    // Enfileirar transformaria um gesto em dois sons, que é o defeito que a
    // regra existe para apagar.
    return false;
  }

  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();

    // Cada despacho ganha um ganho próprio entre a fonte e o bus da categoria.
    // Ele existe por UM motivo: sem um nó que eu possa baixar, "a perdedora é
    // descartada" só valeria para a fonte que ainda não começou — a que já
    // começou continuaria soando, e a soma que a R-EX veio apagar voltaria pela
    // porta dos fundos. O bus da categoria segue em 0,00 dB (§6.4 item 1): este
    // nó nasce em 1 e só se move para silenciar uma perdedora.
    let ganho: GainNode | null = null;
    if (typeof b.ctx.createGain === 'function') {
      ganho = b.ctx.createGain();
      ganho.gain.value = 1;
      ganho.connect(b.busCategoria[cat]);
    }
    const destino: AudioNode = ganho ?? b.busCategoria[cat];

    const dur = montarFonte(b.ctx, destino) ?? 0;
    const agora = b.ctx.currentTime;

    // A substituição só acontece DEPOIS de a vencedora ter sido montada sem
    // erro: silenciar antes deixaria o app mudo se `montarFonte` lançasse.
    if (vigente) silenciar(vigente.ganho, agora);

    janelaAtual = { inicioMs: vigente ? vigente.inicioMs : agoraMs, cat, origem, ganho };

    if (cat === 'marco') duckMarco(agora, dur);
    else duckArcadePor(b, cat, agora, dur);
    return true;
  } catch {
    // Alguns navegadores recusam áudio sem gesto: falhar em silêncio é o
    // contrato de sempre deste módulo.
    return false;
  }
}
