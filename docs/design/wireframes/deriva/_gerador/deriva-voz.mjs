// DER-18 → DER-20: o catalogo da voz da criatura. O balao esta desenhado nos
// canvases (HOME-21/23/24), mas O QUE ela diz — 21 `kind` e a matriz de traco
// — nao esta em artboard nenhum, e e o texto que o jogador mais le.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CONTA = path.join(AQUI, '../../conta/identidade/Main.dc.html');
const OUT = path.join(AQUI, '../identidade');
const fonte = fs.readFileSync(CONTA, 'utf8');
const STYLE = fonte
  .slice(fonte.indexOf('<style>') + 7, fonte.indexOf('</style>'))
  ;

const KINDS = [
  ['task', 'tarefa concluída', 'Mais uma fora da sua cabeça!', 'One more out of your head!'],
  ['cheer', 'conclusão com hábito firme', 'Isso aqui já tem raiz.', 'This one has roots now.'],
  ['rare', 'sorteio de 5 % nas conclusões', 'Isso aqui chegou bonito.', 'That one landed beautifully.'],
  ['milestone', 'marco batido', 'Olha o tamanho disso agora!', 'Look how big this is now!'],
  ['haunted', 'tarefa antiga enfim feita', 'Aquela ali… foi. Respira.', 'That one… is done. Breathe.'],
  ['rub', 'carinho', 'Ahh. Isso aqui firma.', 'Ahh. This one steadies me.'],
  ['healCap', 'teto de carinho do dia', 'Já firmou o que dava hoje. Continua que eu gosto.', "It's as steady as it gets today. Keep going, I like it."],
  ['shower', 'banho', 'Dissolveu tudo. Que leve.', 'It all dissolved. So light.'],
  ['dirty', 'resíduo na cena', 'Tem uma coisa ali que não assentou.', "Something over there didn't settle."],
  ['residue', 'resíduo acumulado', 'Alguma coisa não assentou. Tá ali.', "Something didn't settle. It's over there."],
  ['full', 'recusa de comida — está cheia', 'Tá assentando ainda. Daqui a pouco eu como.', "It's still settling. I'll eat again in a bit."],
  ['steady', 'recusa de item — vida cheia', 'Tô firme. Guarda essa.', "I'm steady. Keep that one."],
  ['hungry', 'fome', 'Barriga fazendo barulho.', 'My belly is making noise.'],
  ['peckish', 'fome começando', 'Começando a dar fome.', 'Getting a bit hungry.'],
  ['starving', 'fome alta', 'Muita fome. Tô mole.', "Very hungry. I'm weak."],
  ['energized', 'energia cheia', 'Cheio. Tô inteiro.', "Full. I'm all here."],
  ['fine', 'tudo em ordem', 'Tô bem assim.', "I'm good like this."],
  ['lowHp', 'sustentação caiu', 'Tô mole hoje. E VOCÊ, como tá?', "I'm weak today. And YOU, how are you?"],
  ['sleep', 'entrou no sono', 'Vou desligar a leitura um pouco.', "I'm switching the reading off for a bit."],
  ['wake', 'acordou', 'Assentou. Tô inteiro.', "It settled. I'm all here."],
  ['idle', 'silêncio — sem gatilho', 'Tô aqui. Tava só olhando a luz.', "I'm here. I was just watching the light."],
];

const TRACOS = [
  ['guloso', 'a comida é a medida de tudo', 'Fez! Isso vira comida, né?'],
  ['carinhoso', 'pede mais do que o teto dá', 'Não para, não para…'],
  ['teimoso', 'aposta na pessoa antes de ela fazer', 'Eu sabia que você ia encarar essa.'],
  ['sortudo', 'lê sorte no dia', 'Hoje o dia está do nosso lado. Sinto isso.'],
  ['madrugador', 'valoriza a hora', 'Limpo e acordado. Assim que se faz.'],
];

const linha = (k, gatilho, pt, en) => `
<div class="strip" style="gap:6px">
  <p class="cap"><span class="tagd">${k}</span> ${gatilho}</p>
  <div class="bubble" style="background:var(--sm2-surface-2);border:1px solid var(--sm2-line);border-radius:var(--sm2-radius-md);padding:8px 12px"><p class="t">${pt}</p></div>
  <p class="cap" style="padding-left:12px">EN · ${en}</p>
</div>`;

function escreve(nome, corpo, rodape) {
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
${corpo}
</div></div>
<footer class="foot">${rodape}</footer>
</div>
</x-dc>
</body></html>
`);
}

const RODAPE = (tags, pergunta, notas) =>
  `<p><span style="font-weight:700">Artboard</span> ${tags.map((t) => `<span class="tg">${t}</span>`).join(' ')} · canvas <b>Deriva — identidade</b> · origem: <code>src/utils/petVoice.ts</code> · commit <code>a2ded861 · 1480b632 · 84ae4937</code></p>` +
  `<h4>Pergunta</h4><p>${pergunta}</p><h4>Notas</h4><ul>${notas.map((n) => `<li>${n}</li>`).join('')}</ul>`;

escreve('VozKinds',
  `
<header class="row" style="min-height:44px"><h1 class="h1">The creature's voice</h1></header>
<p class="t" style="color:var(--sm2-muted)">Os <b>21 <code>kind</code></b> de <code>petVoice.ts</code>. O balão está desenhado (HOME-21 · 23 · 24); isto é o que ele <b>diz</b>. Uma frase por família — cada uma tem de 2 a 6 variantes sorteadas.</p>
${KINDS.slice(0, 11).map((r) => linha(...r)).join('')}
`,
  RODAPE(['DER-18'],
    '"Ela está falando comigo ou sobre ela?" — a resposta muda o produto inteiro, e ela mora na frase, não na caixa.',
    [
      'A criatura fala <b>do espaço dela</b>, nunca do que a pessoa sente — limite 2 da §16: o que a pessoa sente, o app não tem como saber.',
      '<code>lowHp</code> dispara <b>no dia em que a meta não foi cumprida</b>. Por isso "Tô com saudade" saiu: emoção da criatura causada pelo que a pessoa deixou de fazer é cobrança.',
      '<code>full</code>, <code>healCap</code> e <code>steady</code> são <b>recusas</b> — a criatura dizendo não. Eram arrays inline no <code>CompanionHUD</code>; frase que mora em componente é frase que nenhum teste de tom varre.',
      '<code>rare</code> sai em ~5 % das conclusões (<code>RARE_CHEER_RATE</code>). A taxa <b>nunca vira alavanca</b>: não sobe com nada, não desce com nada — o prêmio é a frase.',
    ]),
);

escreve('VozKindsTracos',
  `
<header class="row" style="min-height:44px"><h1 class="h1">Voice — states &amp; traits</h1></header>
<p class="t" style="color:var(--sm2-muted)">As dez famílias restantes (corpo, sono, silêncio) e a matriz de traço: o mesmo gatilho, outra frase, conforme a personalidade sorteada no oráculo.</p>
${KINDS.slice(11).map((r) => linha(...r)).join('')}

<div class="sec">
  <p class="lab">Matriz de traço — a mesma conclusão, cinco vozes</p>
  ${TRACOS.map(([t, o, f]) => `
  <div class="strip" style="gap:6px">
    <p class="cap"><span class="tagd">${t}</span> ${o}</p>
    <div class="bubble" style="background:var(--sm2-surface-2);border:1px solid var(--sm2-line);border-radius:var(--sm2-radius-md);padding:8px 12px"><p class="t">${f}</p></div>
  </div>`).join('')}
  <p class="cap">O traço <b>sobrepõe</b> o padrão só onde tem frase própria; onde não tem, cai no <code>kind</code> comum. Um traço que repete o padrão torna a matriz mentirosa — foi o defeito corrigido em <code>carinhoso</code> (21/09).</p>
</div>

<div class="sec">
  <p class="lab">Onde a fala aparece</p>
  <div class="card">
    <p class="t">Balão <b>sobre o vidro</b>, dentro do visor — o canal da criatura. O sistema fala no slot de avisos e no toast; os dois nunca trocam de lugar.</p>
    <p class="cap">Duas famílias <b>saíram</b> do HUD em 21/09 e viraram <code>kind</code> com teste de tom. <code>sleep</code>, <code>wake</code> e <code>residue</code> eram gestos <b>mudos</b> — agora falam.</p>
  </div>
</div>
`,
  RODAPE(['DER-19', 'DER-20'],
    '"Por que ela falou assim comigo hoje?" — porque tem um traço, e o traço é dela, não uma personalização de engajamento.',
    [
      'O traço vem do oráculo, no nascimento — a pessoa não escolhe e não troca.',
      'As cinco falas que <b>cobravam</b> o jogador foram removidas em 21/09 (<code>1480b632</code>): o mundo constata, nunca julga.',
      'PT e EN não são tradução literal um do outro: cada idioma tem o seu conjunto, com o mesmo número de variantes.',
    ]),
);

console.log('voz: 2 artboards escritos');
