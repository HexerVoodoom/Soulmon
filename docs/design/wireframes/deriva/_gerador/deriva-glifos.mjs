// DER-21 · DER-22: os glifos PRÓPRIOS do Soulmon (src/components/ui/NavGlyphs).
// A app troca 39 Material Symbols por desenho autoral; os wireframes foram
// feitos com Material, então o conjunto autoral não está em artboard nenhum.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CONTA = path.join(AQUI, '../../conta/identidade/Main.dc.html');
const OUT = path.join(AQUI, '../identidade');
const fonte = fs.readFileSync(CONTA, 'utf8');
const STYLE = fonte
  .slice(fonte.indexOf('<style>') + 7, fonte.indexOf('</style>'))
   + `
.glif{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.glif .cel{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;border:1px solid var(--sm2-line);border-radius:var(--sm2-radius-sm)}
.glif .cel .nm{font-size:10px;color:var(--sm2-muted);text-align:center;word-break:break-word;line-height:1.2}
.glif svg{color:var(--sm2-ink)}
.par{display:flex;gap:10px;align-items:center;justify-content:center}
`;

const glifos = JSON.parse(fs.readFileSync(path.join(OUT, '_glifos.json'), 'utf8'));

// cada render reiniciou o contador de useId; sem prefixo proprio as mascaras
// colidem quando os 39 entram na mesma pagina
function unico(svg, tag) {
  return svg.replace(/sm2-hole-([A-Za-z0-9_]+)/g, (m, id) => 'sm2-hole-' + tag + '-' + id);
}

const nomes = Object.keys(glifos);
const celula = (n, i) => `<div class="cel">
  <div class="par">${unico(glifos[n].outline, 'o' + i)}${unico(glifos[n].solid, 's' + i)}</div>
  <span class="nm">${n}</span>
</div>`;

function escreve(nome, titulo, intro, lista, rodape) {
  fs.writeFileSync(path.join(OUT, nome + '.dc.html'), `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<x-dc>
<helmet>
  <style>
${STYLE}
  </style>
</helmet>
<div class="ab" data-theme="dark">
<div class="phone tall"><div class="content">
<header class="row" style="min-height:44px"><h1 class="h1">${titulo}</h1></header>
<p class="t" style="color:var(--sm2-muted)">${intro}</p>
<div class="card"><div class="glif">${lista.map((n) => celula(n, nomes.indexOf(n))).join('')}</div></div>
<p class="cap">Cada célula traz o par <b>contorno · cheio</b> a 32px — o mesmo <code>FILL 0 / FILL 1</code> do Material, porque o glifo próprio copia a métrica do Material (caixa 24dp, traço 2px, junta arredondada) para parecer parte do conjunto em vez de adesivo colado.</p>
</div></div>
<footer class="foot">${rodape}</footer>
</div>
</x-dc>
</body></html>
`);
}

const RODAPE = (tags, extra) =>
  `<p><span style="font-weight:700">Artboard</span> ${tags.map((t) => `<span class="tg">${t}</span>`).join(' ')} · canvas <b>Deriva — identidade</b> · origem: <code>src/components/ui/NavGlyphs.tsx</code> (extraído por render real, não redesenhado)</p>` +
  `<h4>Pergunta</h4><p>"Isto aqui é o app de alguém, ou é mais um app Material?" — no teste dos 200×200 (a nav recortada, sem logo e sem contexto) a barra com Material Symbols reprovava: era indistinguível de qualquer app Android.</p>` +
  `<h4>Notas</h4><ul>${extra.map((n) => `<li>${n}</li>`).join('')}</ul>`;

const NOTAS_COMUNS = [
  '<b>Não é outro estilo — é o mesmo estilo com autoria.</b> Caixa de 24dp (<code>viewBox="0 0 24 24"</code>), o mesmo grid do Material.',
  'Critério de corte declarado no arquivo: <b>um Material honesto é melhor que um glifo próprio feio.</b> O que ficou em Material está listado no fim do bloco, com o motivo.',
  '⚠️ <b>Divergência conhecida:</b> os 199 artboards dos canvases do repo foram desenhados com <b>Material Symbols</b>. O app entrega estes 39 no lugar. Onde a tela mostra um ícone desta lista, o desenho real é o daqui.',
  'Os buracos (a porta da casa, o miolo do d-pad) são <code>&lt;mask&gt;</code> com <code>useId</code> — ao juntar os 39 na mesma página os ids foram prefixados, senão uma máscara apaga a outra.',
];

escreve('GlifosNavDeck', 'Own glyphs — nav &amp; deck',
  'Os <b>39 glifos próprios</b> do Soulmon, na ordem do arquivo: primeiro os cinco da barra, depois o deck do aparelho (o que aparece em toda sessão).',
  nomes.slice(0, 20),
  RODAPE(['DER-21'], NOTAS_COMUNS));

escreve('GlifosUtilitarios', 'Own glyphs — list &amp; utilities',
  'O segundo lote: a lista diária (concluir, marcar, expandir), as moedas e os utilitários de toda tela (fechar, seta, cadeado, relógio, carregando).',
  nomes.slice(20),
  RODAPE(['DER-22'], NOTAS_COMUNS));

console.log('glifos: ' + nomes.length + ' em 2 artboards');
