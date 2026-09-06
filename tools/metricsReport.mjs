/**
 * O LEITOR DOS NÚMEROS — as regras de leitura, separadas do transporte.
 * ====================================================================
 *
 * Este módulo é a metade PURA do WP0.1: recebe o JSON que `functions/api/metrics.js`
 * devolve e produz linhas de texto. Não busca nada, não lê `process.env`, não
 * conhece a chave. Por isso ele pôde ser escrito e testado ANTES de a
 * `METRICS_ADMIN_KEY` existir — que foi a resposta do dono à decisão D1: em vez
 * do plano inteiro esperar por uma variável de ambiente, o leitor espera por ela.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS CINCO REGRAS, e por que elas moram no CÓDIGO e não num README
 * ─────────────────────────────────────────────────────────────────────────────
 * Vêm da palestra de analytics em jogos que o corpus estudado trata como fonte
 * primária ("Data-Driven or Data-Blinded?"), e a tese dela é que o dano dos
 * números não vem de coletar errado — vem de LER errado, com convicção. Uma
 * regra escrita num documento é uma regra que alguém esquece às 2h da manhã
 * olhando um dashboard. Aqui elas são código que se recusa a imprimir:
 *
 *  1. **`n` em toda linha.** Percentual sem denominador é a forma mais barata
 *     de mentir para si mesmo. Nenhuma linha sai sem quantas observações a
 *     sustentam.
 *  2. **Mediana, nunca média, para distribuição.** A média de esforço com um
 *     usuário de 100 e nove de 1 diz "10,9" — um número que descreve ninguém.
 *     `goal_days` já chega como histograma e por isso tem mediana de verdade.
 *  3. **Eixo no zero.** Todo histograma daqui começa em 0. Barra truncada
 *     transforma variação de ruído em tendência.
 *  4. **Razão só dentro da MESMA janela**, e sempre rotulada como aproximada.
 *     Numerador de uma semana sobre denominador de outra é aritmética que
 *     parece análise.
 *  5. **Recusa de conversão com janela < 30 dias.** Não é aviso: a linha não é
 *     impressa. Comparar conversão com poucos dias é o erro que a fonte chama
 *     de "data-blinded", e um aviso ao lado do número não impede ninguém de ler
 *     o número.
 *
 * E há uma sexta, que não é regra de leitura e sim de honestidade: o relatório
 * REPETE o que o servidor diz não saber (`notes.unreadable`). Retenção e coorte
 * não são calculáveis a partir deste agregado — por desenho, não por falta.
 * Ver a resposta à decisão D2 (§15 do PLANO-MELHORIAS): o caminho aprovado é
 * fechar a conta no aparelho, nunca identificar aqui.
 */

/** Janela mínima para qualquer leitura de conversão (regra 5). */
export const MIN_DIAS_CONVERSAO = 30;

const ehNum = (v) => typeof v === 'number' && Number.isFinite(v);
const n = (totais, chave) => (ehNum(totais?.[chave]) ? totais[chave] : 0);

/**
 * Mediana a partir de um histograma `{ valor: contagem }`.
 * `null` quando não há observação — e `null` vira "sem dados", nunca 0.
 */
export function medianaDeHistograma(balde) {
  const pares = Object.entries(balde ?? {})
    .map(([v, c]) => [Number(v), ehNum(c) ? c : 0])
    .filter(([v, c]) => Number.isFinite(v) && c > 0)
    .sort((a, b) => a[0] - b[0]);
  const total = pares.reduce((s, [, c]) => s + c, 0);
  if (total === 0) return null;
  const meio = total / 2;
  let acc = 0;
  for (const [valor, contagem] of pares) {
    acc += contagem;
    if (acc >= meio) return valor;
  }
  return pares[pares.length - 1][0];
}

/** Dias inteiros cobertos por `from`..`to`, inclusivo. */
export function diasDaJanela(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * Razão entre duas contagens da MESMA janela (regras 1 e 4).
 * Devolve `null` sem denominador — não existe "0%" quando ninguém foi contado.
 */
export function razao(numerador, denominador) {
  if (!ehNum(denominador) || denominador <= 0) return null;
  return { valor: numerador / denominador, num: numerador, den: denominador };
}

/** `taxa` já formatada com o `n` grudado, como a regra 1 exige. */
export function linhaDeRazao(rotulo, r) {
  if (!r) return `${rotulo}: sem dados (denominador zero)`;
  const pct = (r.valor * 100).toFixed(1);
  return `${rotulo}: ~${pct}%  (${r.num} de ${r.den})`;
}

/** Histograma em texto, com o eixo ancorado em ZERO (regra 3). */
export function barras(balde, { largura = 24 } = {}) {
  const linhas = [];
  const valores = Object.entries(balde ?? {})
    .map(([k, v]) => [k, ehNum(v) ? v : 0])
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  const max = valores.reduce((m, [, v]) => Math.max(m, v), 0);
  for (const [k, v] of valores) {
    // `max` no denominador e piso em zero: a barra é proporcional ao valor
    // absoluto, nunca à diferença entre o menor e o maior.
    const cheio = max > 0 ? Math.round((v / max) * largura) : 0;
    linhas.push(`  ${String(k).padStart(2)} │${'█'.repeat(cheio)}${' '.repeat(largura - cheio)}│ ${v}`);
  }
  return linhas;
}

/** Rótulo humano de cada balde de esforço (`effortBucket`, WP0.8). */
export const FAIXA_ESFORCO = ['1–2', '3–4', '5–6', '7–9', '10+'];

/** O histograma de esforço (WP0.8). Vazio em período anterior ao pacote. */
export function histogramaEsforco(totais) {
  const balde = {};
  for (let i = 0; i < FAIXA_ESFORCO.length; i++) balde[i] = n(totais, `effort_bucket.${i}`);
  return balde;
}

/** O histograma de `goal_days` (0..7) a partir das chaves do agregado. */
export function histogramaGoalDays(totais, prefixo = 'week_active') {
  const balde = {};
  for (let i = 0; i <= 7; i++) balde[i] = n(totais, `${prefixo}.goal_days.${i}`);
  return balde;
}

/**
 * O relatório inteiro, como linhas de texto.
 * @param {object} payload  o JSON de `GET /api/metrics`
 */
export function renderRelatorio(payload) {
  const out = [];
  const totais = payload?.totals ?? {};
  const dias = diasDaJanela(payload?.from, payload?.to);

  out.push(`Soulmon — números de ${payload?.from ?? '?'} a ${payload?.to ?? '?'} (${dias} dia(s))`);
  out.push('');

  // ── O que este agregado NÃO responde. Vem primeiro de propósito: quem lê um
  //    relatório decide nos dez primeiros segundos, e a ausência tem de estar
  //    entre eles.
  const cegos = payload?.notes?.unreadable;
  if (Array.isArray(cegos) && cegos.length) {
    out.push('NÃO é calculável a partir daqui (por desenho, não por falta):');
    for (const c of cegos) out.push(`  · ${c}`);
    out.push('');
  }

  // ── Atividade ────────────────────────────────────────────────────────────
  const ativos = n(totais, 'day_active');
  const instalou = n(totais, 'install');
  out.push('ATIVIDADE');
  out.push(`  dias-ativos contados: ${ativos}`);
  out.push(`  instalações: ${instalou}`);
  out.push('  ⚠️ dias-ativos NÃO é gente: uma pessoa em dez dias e dez pessoas');
  out.push('     num dia dão o mesmo número. Ver a linha de cima sobre coorte.');
  out.push('');

  // ── Esforço: MEDIANA pelo histograma, com a média só como nota (regra 2) ──
  const somaEsforco = ['unknown', 'demo', 'paid'].reduce((s, t) => s + n(totais, `effort_sum.${t}`), 0);
  const baldeEsforco = histogramaEsforco(totais);
  const diasComBalde = Object.values(baldeEsforco).reduce((s, v) => s + v, 0);
  out.push('ESFORÇO POR DIA-ATIVO');
  if (diasComBalde > 0) {
    out.push(...barras(baldeEsforco).map((l, i) => `${l}   ${FAIXA_ESFORCO[i] ?? ''}`));
    const b = medianaDeHistograma(baldeEsforco);
    out.push(`  mediana: na faixa ${FAIXA_ESFORCO[b] ?? '?'}   (n = ${diasComBalde} dias)`);
    if (ativos > 0 && somaEsforco > 0) {
      out.push(`  (a média seria ${(somaEsforco / ativos).toFixed(2)} — guardada como nota, não como leitura)`);
    }
  } else if (ativos > 0 && somaEsforco > 0) {
    // Agregado ANTERIOR ao WP0.8: só existe a soma. Dizer isso é melhor que
    // imprimir a média como se ela fosse a resposta.
    out.push(`  só há soma neste período: média ${(somaEsforco / ativos).toFixed(2)} em ${ativos} dias.`);
    out.push('  ⚠️ média de distribuição com cauda descreve ninguém. Este período');
    out.push('     é anterior ao histograma — não decida por este número.');
  } else {
    out.push('  sem dados');
  }
  out.push('');

  // ── A métrica-norte: histograma e MEDIANA (regras 2 e 3) ─────────────────
  const hist = histogramaGoalDays(totais);
  const mediana = medianaDeHistograma(hist);
  const semanas = Object.values(hist).reduce((s, v) => s + v, 0);
  out.push('SEMANAS FECHADAS — dias em que a pessoa bateu o PRÓPRIO objetivo');
  if (semanas > 0) {
    out.push(...barras(hist));
    out.push(`  mediana: ${mediana} dia(s) de 7   (n = ${semanas} semanas)`);
  } else {
    out.push('  sem dados');
  }
  out.push('');

  // ── Oferta: razões da mesma janela, e a recusa da regra 5 ────────────────
  out.push('OFERTA');
  const viu = n(totais, 'unlock_view');
  const recusou = n(totais, 'unlock_dismiss');
  out.push(`  ${linhaDeRazao('recusas declaradas ÷ visualizações', razao(recusou, viu))}`);
  if (dias >= MIN_DIAS_CONVERSAO) {
    out.push(`  ${linhaDeRazao('compras ÷ visualizações', razao(n(totais, 'purchase'), viu))}`);
  } else {
    out.push(`  conversão: NÃO IMPRESSA — janela de ${dias} dia(s), mínimo ${MIN_DIAS_CONVERSAO}.`);
    out.push('    Não é aviso: com janela curta o número existe e engana. Espere.');
  }
  out.push('');

  // ── Ritual do dia: o denominador que o WP0.14 criou ──────────────────────
  const ofertado = n(totais, 'checkin_shown');
  out.push('RITUAL DO DIA');
  out.push(`  ${linhaDeRazao('assumiram a meta ÷ ritual oferecido', razao(n(totais, 'checkin_commit'), ofertado))}`);
  out.push('');

  return out;
}
