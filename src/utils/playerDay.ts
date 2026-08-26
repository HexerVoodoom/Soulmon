import { tzOffsetMs } from './tzOffset';

// ---------------------------------------------------------------------------
// O DIA DO JOGADOR — a chave de dia dos registros diários que MORAM NO SAVE.
//
// ⚠️ Resíduo do achado **X-4** (commit 9e9f679f), com teste próprio travando-o
// desde então. O conserto anterior tornou `rubHealRecordFor` ordem-consciente e
// matou o furo ILIMITADO do teto de carinho, mas deixou de pé o que a
// comparação de strings não consegue resolver sozinha: o aparelho ADIANTADO
// ainda estreia o teto do dia dele mais cedo, porque um registro de "um dia
// atrás" vindo de outro fuso é indistinguível de um registro de ontem de
// verdade. Fechar isso não é questão de comparar melhor — é questão de os dois
// aparelhos concordarem sobre QUAL DIA É.
//
// A causa raiz é sempre a mesma linha: `new Date().toDateString()` é o dia do
// APARELHO. Enquanto esses registros moravam no `localStorage`, isso era
// correto por construção — o registro e o relógio eram do mesmo aparelho. A
// fatia 2 começou a movê-los para o SAVE, que é sincronizado na nuvem, e a
// premissa morreu: dois aparelhos em fusos diferentes discordam do NOME do dia
// por `|offsetA − offsetB|` horas TODO DIA (BR↔Tóquio: 12h; BR↔Portugal: 4h).
//
// Os registros afetados, e por que só eles usam esta chave. Nasceram quatro; as
// frentes seguintes acharam mais três com o mesmo defeito, e a régua VIVA da
// lista é `playerDay.contract.test.ts` — o guard de AST que pergunta, no ponto
// de uso, quem produz a chave de dia:
//
//   • `careCaps.rubHeal.date` — teto diário de carinho     (o resíduo do X-4)
//   • `lastCheckInDate`       — o ritual de check-in é UM por dia do JOGADOR
//   • `moodLog[].date`        — "como você está hoje" tem de ser um "hoje" só
//   • `poopDrainCharge.day`   — teto diário de perda de HP pelo dreno
//   • `playLog.date`          — brincar é 1×/dia (`PLAY_TIMES_PER_DAY`), e a
//                               UI e o clique têm de concordar sobre qual dia
//   • `rest.nights[].date`    — a MANHÃ: `restConstancy` conta noites na janela
//                               e o sonho é procurado pelo nome do dia
//   • `nightmares.fought[]`   — a escrita carimba e o portão pergunta pelo
//                               MESMO nome; discordando, o pesadelo volta para
//                               sempre a cada abertura
//
// **A comida NÃO entra**, e a exceção é instrutiva: `careCaps.feedTimes` é uma
// janela DESLIZANTE de timestamps (`FOOD_LIMIT_PER_HOUR`), não um registro
// diário. Um instante em ms é o mesmo instante nos dois aparelhos — não tem
// nome de dia para discordar, e portanto não tem o que consertar.
//
// ═══ O QUE ESTE ARQUIVO DELIBERADAMENTE **NÃO** FAZ ═══
//
// **Não toca em `dayKeyOf` (`habitRhythm.ts`).** Aquela é a chave do motor de
// hábitos, de `perfectDays`, da streak e do gatilho de virada em
// `useDailyReset.ts:57`. Redefini-la mudaria o significado de strings JÁ
// GRAVADAS em todo save existente e dispararia uma virada de dia espúria em
// cada um deles — corrigir um teto ao preço de quebrar a streak de todo mundo.
// Por isso o dia do jogador é uma chave NOVA e SEPARADA, com um punhado de
// chamadores nomeados, e não uma redefinição da chave velha.
//
// **Não usa UTC puro.** `App.tsx` já explica por escrito o bug clássico deste
// campo (a nota do `isoDay`, sobre `toISOString`): em fuso negativo o dia UTC
// vira à tarde. Para um brasileiro em UTC−3, o teto de carinho passaria a zerar
// às 21h — o carinho da noite contaria como o de amanhã. Um dia civil que muda
// no meio da noite do jogador não é um dia; é uma armadilha.
//
// ═══ O FORMATO ═══
//
// A chave é uma string com a MESMA FORMA de `toDateString()` ("Wed Aug 26
// 2026"), e isso é a coisa mais importante deste arquivo depois do fuso fixo:
//
//   1. **A migração fica invisível** para quem está no fuso de casa. Ali o
//      offset da âncora é o offset do aparelho, o deslocamento é zero e a
//      string sai IDÊNTICA à que já estava gravada no save. Nenhum registro
//      existente é invalidado, nenhum teto é devolvido, nenhum ritual reabre.
//   2. **`Date.parse` continua funcionando** sobre ela, que é o que mantém a
//      comparação monotônica do `rubHealRecordFor` de pé — este arquivo
//      REFORÇA aquele conserto em vez de substituí-lo. Os dois juntos: a
//      âncora faz os aparelhos concordarem, e a ordem cobre o intervalo em que
//      um save antigo ainda carrega a chave do aparelho.
//
// Migração, o caso ruim, declarado: quem está FORA do fuso de casa no primeiro
// load pode ver a chave saltar de um dia para outro uma única vez. O pior caso
// é UM teto extra concedido de graça, uma vez. Forçar zero pediria carimbar o
// instante em cada registro e migrar todos os campos da lista acima —
// complexidade que só serviria para não presentear um coração a quem trocou de
// continente.
// ---------------------------------------------------------------------------

/**
 * O fuso FIXO em que o dia do jogador é contado. Mora no save (`GameState`), é
 * gravado uma vez e viaja com o jogador — é isso que faz dois aparelhos
 * concordarem.
 *
 * `zone` é a fonte preferida: um identificador IANA sabe de horário de verão, e
 * o onboarding já colhe um (a cidade de nascimento, `SoulOnboardingData.timeZone`).
 * `offsetMs` é o fallback de quem nunca fez o ritual longo: o offset do
 * aparelho, congelado no primeiro load. Fixo, ele erra por uma hora durante o
 * horário de verão de quem o tem — mas erra IGUAL nos dois aparelhos, que é a
 * única propriedade de que os tetos precisam. Um fuso combinado e um pouco
 * torto vale mais que dois fusos certos e discordantes.
 */
export interface PlayerDayAnchor {
  /** IANA, ex.: 'America/Sao_Paulo'. Preferido sobre `offsetMs`. */
  zone?: string;
  /** Offset fixo em ms à frente do UTC. Fallback do aparelho. */
  offsetMs?: number;
}

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Offset do APARELHO no instante dado, em ms à frente do UTC. */
export function deviceOffsetMs(now: Date): number {
  return -now.getTimezoneOffset() * 60000;
}

/**
 * O offset que a âncora manda usar no instante dado — ou `null` quando ela não
 * diz nada de útil.
 *
 * `null` (e não "cai no aparelho") é de propósito: quem chama precisa poder
 * distinguir "sem âncora, comporte-se exatamente como antes" de "âncora igual à
 * do aparelho". A primeira é a compatibilidade com save que ainda não migrou.
 */
export function anchorOffsetMs(anchor: PlayerDayAnchor | undefined, now: Date): number | null {
  if (!anchor) return null;
  if (anchor.zone) {
    try {
      return tzOffsetMs(now, anchor.zone);
    } catch {
      // Fuso ilegível (save adulterado, ou base IANA que sumiu do runtime): cai
      // para o offset gravado em vez de explodir. Perder o horário de verão é
      // menos grave que um teto que lança no meio de um carinho.
    }
  }
  return Number.isFinite(anchor.offsetMs) ? (anchor.offsetMs as number) : null;
}

/**
 * A CHAVE DO DIA DO JOGADOR.
 *
 * Sem âncora, devolve exatamente `now.toDateString()` — o comportamento antigo,
 * byte a byte. É o que permite ligar isto sem migração de campo: um save que
 * ainda não tem âncora se comporta como sempre se comportou, e ganha a âncora
 * no primeiro load (ver `resolvePlayerDayAnchor`).
 *
 * Com âncora, desloca o INSTANTE pelo offset dela e lê o relógio de parede
 * resultante em UTC. Ler em UTC depois de deslocar é o que torna o resultado
 * independente do aparelho: dois celulares em continentes diferentes, no mesmo
 * instante, com a mesma âncora, produzem a MESMA string. Que é o teto de
 * carinho parando de vazar, escrito em uma linha.
 */
export function playerDayKey(now: Date, anchor: PlayerDayAnchor | undefined): string {
  const offset = anchorOffsetMs(anchor, now);
  if (offset === null) return now.toDateString();
  const d = new Date(now.getTime() + offset);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${DIAS[d.getUTCDay()]} ${MESES[d.getUTCMonth()]} ${dia} ${d.getUTCFullYear()}`;
}

/**
 * Higieniza o que veio do save. Save é dado NÃO CONFIÁVEL: veio da nuvem, pode
 * ter sido editado à mão, pode ser de uma versão futura.
 *
 * `offsetMs` é limitado a ±26h porque é o intervalo real de offsets civis no
 * mundo (UTC−12 a UTC+14) com folga — um número absurdo aqui deslocaria o dia
 * do jogador por semanas e o teto nunca mais zeraria.
 */
export function sanitizePlayerDayAnchor(raw: unknown): PlayerDayAnchor | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const e = raw as Record<string, unknown>;
  const out: PlayerDayAnchor = {};
  if (typeof e.zone === 'string' && e.zone.length > 0) {
    try {
      tzOffsetMs(new Date(), e.zone);
      out.zone = e.zone;
    } catch {
      // Fuso que o runtime não conhece não entra: guardado, ele faria toda
      // leitura pagar um try/catch e cair no fallback em silêncio.
    }
  }
  if (typeof e.offsetMs === 'number' && Number.isFinite(e.offsetMs) && Math.abs(e.offsetMs) <= 26 * 3600000) {
    out.offsetMs = e.offsetMs;
  }
  return out.zone || out.offsetMs !== undefined ? out : undefined;
}

/**
 * A âncora a gravar no save, no load.
 *
 * Ordem, e o porquê de cada degrau:
 *
 *  1. **O que já está no save vence.** A âncora existe para ser ESTÁVEL. Se ela
 *     fosse recalculada a cada load, quem viaja veria o dia do jogador andar
 *     junto com o avião e estaríamos de volta ao bug, só que com mais código.
 *  2. **O fuso do onboarding**, quando há perfil. É a cidade que o jogador
 *     declarou, sabe de horário de verão, e é o mesmo dado que o mapa astral já
 *     consome — reuso de verdade, não um campo novo pedido ao usuário.
 *  3. **O offset DESTE aparelho, congelado.** Sem perfil, o melhor palpite
 *     sobre onde o jogador vive é onde ele está agora. Congelar é o ponto: o
 *     valor vai para o save e o segundo aparelho passa a obedecer a ele.
 *
 * Devolve o MESMO objeto quando já havia âncora, para o chamador poder decidir
 * por identidade se precisa persistir.
 */
export function resolvePlayerDayAnchor(
  existing: PlayerDayAnchor | undefined,
  profileZone: string | undefined,
  now: Date,
): PlayerDayAnchor {
  if (existing && (existing.zone || existing.offsetMs !== undefined)) return existing;
  if (profileZone) {
    const limpo = sanitizePlayerDayAnchor({ zone: profileZone });
    if (limpo) return limpo;
  }
  return { offsetMs: deviceOffsetMs(now) };
}
