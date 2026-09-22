// DER-23 → DER-27: a INCUBAÇÃO (WP4.29, D-G8b/D-G8c, 22/09/2026).
// A barra encheu, a forma seguinte está sendo feita, e o toque NÃO evolui.
// O canvas Evolução desenhou a página ANTES desta mecânica existir, e a
// página chegou a prometer "toque para evoluir" durante a incubação — o
// defeito que o `evolucaoManual.contract.test.ts` existe para impedir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CONTA = path.join(AQUI, '../../conta/identidade/Main.dc.html');
const OUT = path.join(AQUI, '../identidade');

const fonte = fs.readFileSync(CONTA, 'utf8');
const STYLE = fonte.slice(fonte.indexOf('<style>') + 7, fonte.indexOf('</style>')) + `
.vis{width:192px;height:192px;margin:0 auto;border-radius:var(--sm2-radius-md);background:var(--sm2-viewport-bg);border:4px solid var(--sm2-viewport-ring);box-sizing:border-box;display:flex;align-items:center;justify-content:center;position:relative}
.vis .sil{width:128px;height:128px;border-radius:12px;background:var(--sm2-muted);opacity:.28}
.vis .sp{width:128px;height:128px;border-radius:12px;background:var(--sm2-primary-soft);border:1px dashed var(--sm2-primary-ink)}
.mtr{height:12px;border-radius:999px;background:var(--sm2-surface-2);border:1px solid var(--sm2-muted);overflow:hidden}
.mtr i{display:block;height:100%;background:var(--sm2-primary-fill)}
.fila{display:flex;flex-direction:column;gap:6px}
.fila .k{display:flex;gap:8px;align-items:baseline;font-size:12px;line-height:1.35;color:var(--sm2-muted)}
.fila .k b{color:var(--sm2-ink);font-weight:500}
.fila .k.novo b,.fila .k.novo{color:var(--sm2-primary-ink)}
`;

const RODAPE = `<p><span style="font-weight:700">Artboard</span> <span class="tg">DER-23</span> <span class="tg">DER-24</span> <span class="tg">DER-25</span> <span class="tg">DER-26</span> <span class="tg">DER-27</span> · canvas <b>Deriva — identidade</b> · origem: <code>src/components/EvolutionPath.tsx</code> (prop <code>incubating</code>) · <code>App.tsx</code> (chave <code>'incubacao'</code>) · <code>src/utils/spriteTrigger.ts</code> · commits <code>8be8f9c5 · ae16d213 · 355959b4</code></p>
<h4>Pergunta</h4><p>"A barra encheu — por que tocar não faz nada?" — a página precisa responder ANTES de a pessoa tentar, senão repete o dano que o <code>MANUAL_EVOLUTION</code> já custou uma vez: barra cheia, nada acontece, lê como defeito.</p>
<h4>Notas</h4><ul>
<li><b>R-I — nenhuma contagem.</b> Sem dígito que decresce, sem barra em tempo real, sem hora impressa. Palavra grossa só ("leva um tempo"): relógio visível é o motor da reabertura compulsiva que o corte do push existe para evitar.</li>
<li><b>R-N — a verdade inteira na entrada</b>, nas três metades: <i>leva um tempo</i> · <i>volte quando quiser</i> · <i>nada se perde</i>. Quem não sabe que nada expira se comporta como se expirasse, e aí a mecânica vira o gate que ela não é.</li>
<li>O toque no visor passa a <b>alternar o cadeado</b>, não evoluir (<code>evoluiNoToque</code> exige <code>!incubating</code>) — e o <code>aria-label</code> diz qual dos dois vai acontecer.</li>
<li>A frase da incubação vem <b>antes</b> da do cadeado na cascata: é o estado mais recente, a barra encheu agora.</li>
<li>O aviso da Home é a <b>posição 2</b> da fila 2 — depois do HP, que é a única coisa que cobra, e antes de tudo o mais: é raro (uma vez por evolução) e some sozinho.</li>
<li>⚠️ Ainda <b>falta a silhueta</b> da próxima forma no visor (marcador visual do R-M) e o one-shot <code>notified</code> — o WP4.30 não está pronto. O visor de DER-23 desenha a silhueta como <b>proposta</b>, marcada a tracejado.</li>
</ul>`;

const corpo = `
<header class="row" style="min-height:44px"><h1 class="h1">Incubation</h1></header>
<p class="t" style="color:var(--sm2-muted)">A barra enche e a forma seguinte <b>começa a ser feita</b>. Espera mínima de 30 min, contada da elegibilidade (D-G8c). O canvas Evolução (§24) desenhou a página antes disto existir.</p>

<div class="strip">
  <p class="cap"><span class="tagd">DER-23</span> Evolução — <b>incubando</b>: barra cheia, cadeado aberto, e o toque <b>não</b> evolui</p>
  <div class="vis"><span class="sil"></span></div>
  <p class="cap" style="text-align:center">silhueta = <b>proposta</b> (R-M, ainda não implementada)</p>
  <div class="mtr"><i style="width:100%"></i></div>
  <p class="t">A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você.</p>
  <p class="cap">EN · The next form is taking shape. It takes a while — come back whenever you like, it waits for you.</p>
  <p class="cap"><code>aria-label</code>: "‹nome›, forma atual. A próxima forma está tomando corpo"</p>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-24</span> Evolução — <b>pronta</b> (o estado que o canvas §24 já desenhava): a incubação terminou e o toque evolui</p>
  <div class="vis"><span class="sp"></span></div>
  <div class="mtr"><i style="width:100%"></i></div>
  <p class="t">O padrão está pronto. Ele espera você encostar. Toque no seu Soulmon para evoluir.</p>
  <p class="cap"><code>aria-label</code>: "‹nome›, forma atual. Pronto — toque para evoluir"</p>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-25</span> Home — o aviso da fila 2 (<code>sm2-notice</code>, sem filete: é fato, não alerta)</p>
  <div class="card">
    <div class="row" style="align-items:flex-start">
      <span class="ico i20 on" aria-hidden="true" style="color:var(--sm2-gold-ink)">egg</span>
      <p class="t" style="flex:1;min-width:0">A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você.</p>
    </div>
  </div>
  <p class="cap">ícone <code>egg</code> 20 <b>FILL 1</b> em <code>gold-ink</code> — ouro é o registro do raro, e isto acontece uma vez por evolução</p>
</div>

<div class="sec">
  <p class="lab"><span class="tagd">DER-26</span> A fila 2, agora com <b>9</b> (era 8 em DER-01)</p>
  <div class="card fila">
    <p class="k"><b>0.</b> <code>'firstDay'</code> — o mais perecível: morre na virada</p>
    <p class="k"><b>1.</b> <code>'hp'</code> — a única que cobra</p>
    <p class="k novo"><b>2.</b> <code>'incubacao'</code> — <b>novo</b> · raro (uma vez por evolução) e some sozinho</p>
    <p class="k"><b>3.</b> <code>'semanal'</code> · <b>4.</b> <code>'triagem'</code> · <b>5.</b> <code>'priming'</code></p>
    <p class="k"><b>6.</b> <code>'recomeco'</code> · <b>7.</b> <code>'carga'</code> · <b>8.</b> <code>'termos'</code></p>
  </div>
</div>

<div class="sec">
  <p class="lab"><span class="tagd">DER-27</span> Onde mais a incubação é dita</p>
  <div class="card grp">
    <p class="h3">Guia</p>
    <p class="t">Quando a barra enche, a próxima forma começa a tomar corpo: leva um tempo até ficar pronta. Volte quando quiser — ela espera por você, e nada se perde no caminho.</p>
  </div>
  <div class="card grp">
    <p class="h3">Glossário — 🥚 Incubação</p>
    <p class="t">Quando a barra enche, a próxima forma começa a tomar corpo — leva um tempo. Volte quando quiser: ela espera por você, e nada se perde.</p>
    <p class="cap">o emoji é <b>conteúdo</b> da entrada do glossário (<code>aria-hidden</code>), não ícone de sistema</p>
  </div>
  <div class="card">
    <p class="cap"><b>Renascimento e upgrade zeram a incubação</b> (<code>ae16d213</code>): a criatura é outra, então a forma que estava sendo feita não é mais a próxima de ninguém.</p>
  </div>
</div>
`;

fs.writeFileSync(path.join(OUT, 'Incubacao.dc.html'), `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<x-dc>
<helmet>
  <style>
${STYLE}
  </style>
</helmet>
<div class="ab" data-theme="dark">
<div class="phone tall"><div class="content">
${corpo}
</div></div>
<footer class="foot">${RODAPE}</footer>
</div>
</x-dc>
</body></html>
`);

console.log('incubação: 1 artboard escrito');
