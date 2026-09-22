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

/** O histograma de `active_days` (0..7) — presença, não meta. */
export function histogramaActiveDays(totais, prefixo = 'week_active') {
  const balde = {};
  for (let i = 0; i <= 7; i++) balde[i] = n(totais, `${prefixo}.active_days.${i}`);
  return balde;
}

/**
 * Seção `--full`: TODO prefixo do agregado com contagem > 0, agrupado pelo
 * primeiro segmento da chave, sem uma linha de código por evento.
 *
 * Por que (QA rodada 2, `04-dados-r2` §4): 14 famílias de chave eram gravadas
 * por `metrics.js` › `applyAggregate` e lidas por ninguém — custo (e, no caso
 * de `active_days`, privacidade) sem retorno. Um leitor genérico garante que
 * chave nova NASCE com leitor; as seções nomeadas acima continuam sendo a
 * leitura interpretada. Chave com contagem 0 não aparece (ruído).
 * @param {Record<string, number>} totais
 * @returns {string[]}
 */
export function renderTudo(totais) {
  const out = [];
  /** @type {Map<string, Array<[string, number]>>} */
  const grupos = new Map();
  for (const [k, v] of Object.entries(totais ?? {})) {
    const num = Number(v);
    if (!Number.isFinite(num) || num <= 0) continue;
    const raiz = k.split('.')[0];
    if (!grupos.has(raiz)) grupos.set(raiz, []);
    grupos.get(raiz).push([k, num]);
  }
  if (grupos.size === 0) return ['TUDO QUE FOI GRAVADO', '  sem dados'];
  out.push('TUDO QUE FOI GRAVADO (toda chave > 0, agrupada pelo primeiro segmento)');
  for (const raiz of [...grupos.keys()].sort()) {
    out.push(`  ${raiz}`);
    for (const [k, v] of grupos.get(raiz).sort((a, b) => a[0].localeCompare(b[0]))) {
      out.push(`    ${k.padEnd(48)} ${String(v).padStart(7)}`);
    }
  }
  return out;
}

/**
 * O relatório inteiro, como linhas de texto.
 * @param {object} payload  o JSON de `GET /api/metrics`
 * @param {{ full?: boolean }} [opts]  `full` acrescenta `renderTudo` no fim.
 */
export function renderRelatorio(payload, opts = {}) {
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

  // ── Presença: `active_days` (QA rodada 1 review 07 N3, QA rodada 2 04 §4 —
  //    a chave era gravada e não tinha leitor). É a hipótese de HÁBITO de E0
  //    ("ativo em >= 2 de 4 dias"): `goal_days` mede meta batida, este mede
  //    presença. Mediana pela mesma regra 2.
  const histPresenca = histogramaActiveDays(totais);
  const semanasPresenca = Object.values(histPresenca).reduce((s, v) => s + v, 0);
  out.push('SEMANAS FECHADAS — dias em que a pessoa APARECEU (concluiu algo)');
  if (semanasPresenca > 0) {
    out.push(...barras(histPresenca));
    out.push(`  mediana: ${medianaDeHistograma(histPresenca)} dia(s) de 7   (n = ${semanasPresenca} semanas)`);
    for (const tier of ['demo', 'paid']) {
      const h = histogramaActiveDays(totais, `week_active.${tier}`);
      const nT = Object.values(h).reduce((s, v) => s + v, 0);
      if (nT > 0) out.push(`  ${tier.padEnd(5)} │ mediana ${medianaDeHistograma(h)} dia(s)   (n = ${nT})`);
    }
  } else {
    out.push('  sem dados');
  }
  out.push('');

  // ── Oferta: razões da mesma janela, e a recusa da regra 5 ────────────────
  out.push('OFERTA');
  const viu = n(totais, 'unlock_view');
  const recusou = n(totais, 'unlock_dismiss');
  out.push(`  ${linhaDeRazao('recusas declaradas ÷ visualizações', razao(recusou, viu))}`);
  // POR ORIGEM: o WP5.1 pôs a oferta no primeiro dia perfeito e só se pode
  // julgá-la contra os convites de RECUSA se os baldes forem separados. Até
  // 06/09/2026 os emissores colapsavam `report` em `evolution`.
  for (const origem of ['task_limit', 'evolution', 'report', 'shop']) {
    const v = n(totais, `unlock_view.${origem}`);
    if (v === 0) continue;
    const c = n(totais, `purchase.${origem}`);
    out.push(`    ${origem.padEnd(11)} │ viu ${String(v).padStart(5)} │ recusou ${String(n(totais, `unlock_dismiss.${origem}`)).padStart(5)} │ comprou ${String(c).padStart(4)}`);
  }
  if (dias >= MIN_DIAS_CONVERSAO) {
    out.push(`  ${linhaDeRazao('compras ÷ visualizações', razao(n(totais, 'purchase'), viu))}`);
  } else {
    out.push(`  conversão: NÃO IMPRESSA — janela de ${dias} dia(s), mínimo ${MIN_DIAS_CONVERSAO}.`);
    out.push('    Não é aviso: com janela curta o número existe e engana. Espere.');
  }
  out.push('');

  // ── O FUNIL DO NASCIMENTO ────────────────────────────────────────────────
  //
  // ⚠️ Esta seção não existia, e o dado era gravado por funil desde sempre
  // (auditoria de 06/09/2026). O cabeçalho de `telemetry.ts` diz que
  // `onboarding_step` existe porque TRÊS auditorias erraram a contagem de
  // telas do onboarding — e o único leitor não mostrava onde as pessoas
  // desistem. Por funil, porque o demo e o ritual pago são populações que
  // nunca se encontram: a média das duas não descreve nenhuma.
  out.push('FUNIL DO NASCIMENTO');
  for (const funil of ['demo', 'paid']) {
    const passos = Object.keys(totais)
      .filter(k => k.startsWith(`onboarding_step.${funil}.`))
      .map(k => [Number(k.slice(`onboarding_step.${funil}.`.length)), totais[k]])
      .filter(([passo]) => Number.isFinite(passo))
      .sort((a, b) => a[0] - b[0]);
    if (passos.length === 0) continue;
    const primeiro = passos[0][1];
    out.push(`  ${funil}:`);
    for (const [passo, quantos] of passos) {
      const pct = primeiro > 0 ? Math.round((quantos / primeiro) * 100) : 0;
      out.push(`    passo ${String(passo).padStart(3)} │ ${String(quantos).padStart(5)} │ ${pct}% de quem começou`);
    }
  }
  if (!Object.keys(totais).some(k => k.startsWith('onboarding_step.'))) {
    out.push('  sem dados');
  }
  // O reveal é o número que julga o WP1.1. ⚠️ `has_sprite` sozinho é ENVIESADO
  // PARA CIMA: `reveal_seen` só é emitido por quem AVANÇA, então quem abandona
  // no reveal não aparece. A taxa honesta é `reveal_seen ÷ onboarding_step` no
  // passo do reveal — por isso as duas leituras ficam na mesma seção.
  const comSprite = n(totais, 'reveal_seen.demo.sprite_yes') + n(totais, 'reveal_seen.paid.sprite_yes');
  const semSprite = n(totais, 'reveal_seen.demo.sprite_no') + n(totais, 'reveal_seen.paid.sprite_no');
  if (comSprite + semSprite > 0) {
    out.push(`  ${linhaDeRazao('reveal COM o desenho ÷ reveals', razao(comSprite, comSprite + semSprite))}`);
    out.push('    ⚠️ entre quem AVANÇOU. Quem desistiu no reveal não emite.');
  }
  out.push('');

  // ── RETENÇÃO ─────────────────────────────────────────────────────────────
  //
  // ⚠️ Também não existia. O WP0.2 estava VERIFICADO e a retenção era
  // ilegível por DOIS motivos independentes: o agregado colapsava os marcos
  // num contador único (consertado no servidor) e o leitor não os imprimia.
  out.push('RETENÇÃO');
  const marcos = [['d1', 'D1'], ['d7', 'D7'], ['d30', 'D30']];
  const temRetencao = marcos.some(([k]) => n(totais, `retained.${k}`) > 0);
  if (temRetencao) {
    for (const [chave, rotulo] of marcos) {
      out.push(`  ${rotulo.padEnd(4)} │ ${String(n(totais, `retained.${chave}`)).padStart(5)}`);
    }
    out.push('  ⚠️ é CONTAGEM de marcos cruzados na janela, não coorte: o');
    out.push('     denominador (quantos instalaram no dia certo) não existe por');
    out.push('     desenho — ver a lista de cegueiras no topo.');
  } else {
    out.push('  sem dados');
  }
  // WP0.11: a decisão é uma só — cortar push que abre o app e não vira dia
  // ativo. Sem a origem no agregado, push e abertura direta eram um número só.
  const origens = ['direct', 'push', 'widget', 'shortcut', 'invite'];
  if (origens.some(o => n(totais, `app_open.${o}`) > 0)) {
    out.push('  aberturas por origem:');
    for (const o of origens) out.push(`    ${o.padEnd(9)} │ ${String(n(totais, `app_open.${o}`)).padStart(5)}`);
  }
  out.push('');

  // ── Ritual do dia: o denominador que o WP0.14 criou ──────────────────────
  const ofertado = n(totais, 'checkin_shown');
  out.push('RITUAL DO DIA');
  out.push(`  ${linhaDeRazao('assumiram a meta ÷ ritual oferecido', razao(n(totais, 'checkin_commit'), ofertado))}`);
  out.push('');

  if (opts?.full) {
    out.push(...renderTudo(totais));
    out.push('');
  }

  return out;
}
