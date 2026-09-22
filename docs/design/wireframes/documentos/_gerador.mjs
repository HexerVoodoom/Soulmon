// Os dois documentos que o app abre em nova aba — Termos de Uso e Política de
// Privacidade. São páginas que o jogador LÊ, servidas de `public/`, e nenhum
// canvas de wireframe as cobre.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(AQUI, '../../../../public');
const OUT = path.join(AQUI, 'identidade');
fs.mkdirSync(OUT, { recursive: true });

const DOCS = [
  { arquivo: 'termos.html', nome: 'Termos', titulo: 'DOC-01 · Termos de Uso (PT + EN na mesma página)' },
  { arquivo: 'privacidade.html', nome: 'Privacidade', titulo: 'DOC-02 · Política de Privacidade (PT + EN)' },
];

// o CSS dos dois e byte a byte o mesmo; entra uma vez, e o merge escopa
const base = fs.readFileSync(path.join(PUB, DOCS[0].arquivo), 'utf8');
const STYLE = base.slice(base.indexOf('<style>') + 7, base.indexOf('</style>')) +
  `
/* o documento e servido em <body> proprio; aqui ele vira uma folha dentro do
   artboard, com a mesma medida de linha (720px) e a mesma cor */
.folha{max-width:760px;box-sizing:border-box}
.ab{width:760px}
`;

// a altura real so se sabe medindo no navegador; se ja houver um canvas.json
// medido, ela e preservada (um h errado abre buraco na grade da pagina unica)
const ANTIGO = (() => {
  const p = path.join(OUT, 'canvas.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
})();
const alturaConhecida = (nome) => ANTIGO?.artboards?.find((a) => a.file === nome + '.dc.html')?.h;

const artboards = [];
for (const d of DOCS) {
  const html = fs.readFileSync(path.join(PUB, d.arquivo), 'utf8');
  const corpo = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>')).trim();
  const saida = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<x-dc>
<helmet>
  <style>
${STYLE}
  </style>
</helmet>
<div class="ab">
<div class="folha">
${corpo}
</div>
<footer class="foot"><p><span style="font-weight:700">Artboard</span> · <span class="tg">${d.titulo.split(' · ')[0]}</span> · canvas <b>Documentos</b> · origem: <code>public/${d.arquivo}</code> (servido como página própria, abre em nova aba)</p><h4>Pergunta</h4><p>"O que eu aceitei, e o que eles fazem com o que eu escrevo?" — a resposta não mora no app: mora nesta página, e ela é tão parte do produto quanto qualquer tela.</p><h4>Notas</h4><ul><li>Medida de linha de <b>720px</b> e tipografia de sistema — não é o aparelho, é documento; misturar Fredoka aqui seria vestir de jogo o que é contrato.</li><li>PT e EN na <b>mesma</b> página, com âncora <code>#en</code>: um só endereço para os dois idiomas, e nada quebra quando o app troca de língua.</li><li>É para onde apontam <code>TermsUpdateBanner</code> (DER-01), a linha "What the chat receives" (DER-13) e os links legais do portão.</li></ul></footer>
</div>
</x-dc>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, d.nome + '.dc.html'), saida);
  artboards.push({ file: d.nome + '.dc.html', title: d.titulo, x: 0, y: 0, w: 760, h: alturaConhecida(d.nome) || 6600, page: 'page-1' });
}

fs.writeFileSync(
  path.join(OUT, 'canvas.json'),
  JSON.stringify({ artboards, pages: ['page-1'], grid: { cols: 2, colW: 860 } }, null, 2),
);
console.log('documentos escritos em ' + OUT);
