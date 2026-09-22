// Gera os artboards das superficies que entraram no codigo DEPOIS dos canvases
// de Fase 2 (21-22/09/2026) e que por isso nao tem wireframe nenhum.
// Reusa o CSS do canvas Conta, que e o mais completo (switch, grupo, toast,
// dock, alerta), para que a peca nova nasca no mesmo sistema.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CONTA = path.join(AQUI, '../../conta/identidade/Main.dc.html');
const OUT = path.join(AQUI, '../identidade');
fs.mkdirSync(OUT, { recursive: true });

const fonte = fs.readFileSync(CONTA, 'utf8');
// o CSS do canvas Conta aponta para o repo por caminho relativo (5 niveis
// acima); daqui isso nao resolve, entao vira caminho absoluto do repo
const STYLE = fonte
  .slice(fonte.indexOf('<style>') + 7, fonte.indexOf('</style>'))
  ;

function artboard(nome, { tema = 'dark', corpo, rodape }) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
<x-dc>
<helmet>
  <style>
${STYLE}
  </style>
</helmet>
<div class="ab" data-theme="${tema}">
<div class="phone tall"><div class="content">
${corpo}
</div></div>
<footer class="foot">${rodape}</footer>
</div>
</x-dc>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, nome + '.dc.html'), html);
}

const RODAPE = (tags, simbolo, commit, pergunta, notas) =>
  `<p><span style="font-weight:700">Artboard</span> ${tags.map((t) => `<span class="tg">${t}</span>`).join(' ')} · canvas <b>Deriva — identidade</b> (superfícies que entraram no código depois da Fase 2) · origem: <code>${simbolo}</code> · commit <code>${commit}</code></p>` +
  `<h4>Pergunta</h4><p>${pergunta}</p>` +
  `<h4>Notas</h4><ul>${notas.map((n) => `<li>${n}</li>`).join('')}</ul>`;

// ─────────────────────────────────────────────────────────────────────────
// DER-01 · o aviso de termos (8ª chave da fila 2)
// ─────────────────────────────────────────────────────────────────────────
artboard('AvisoTermos', {
  corpo: `
<header class="row" style="min-height:44px"><h1 class="h1">Terms notice</h1></header>
<p class="t" style="color:var(--sm2-muted)">A 8ª chave da fila 2 (<code>'termos'</code>), acrescentada em 21/09/2026. Nasce depois de <code>'carga'</code> e some com "Got it". Fato, nunca alerta: sem filete âmbar, sem ícone de risco.</p>

<div class="strip">
  <p class="cap"><span class="tagd">DER-01</span> <b>both</b> — <code>qualDocMudou()</code> devolveu <code>'both'</code> (os dois documentos mudaram de versão)</p>
  <div class="card" role="region">
    <p class="h3">The Terms and the Privacy Policy changed</p>
    <p class="t">You keep playing as usual. If you want to read what changed, it is here.</p>
    <div class="wrap">
      <span class="btn out sm">Read the Terms</span>
      <span class="btn out sm">Read the Policy</span>
      <span class="btn qui sm">Got it</span>
    </div>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-02</span> <b>terms</b> — só os Termos mudaram: a segunda linha-botão não é renderizada</p>
  <div class="card" role="region">
    <p class="h3">The Terms of Use changed</p>
    <p class="t">You keep playing as usual. If you want to read what changed, it is here.</p>
    <div class="wrap"><span class="btn out sm">Read the Terms</span><span class="btn qui sm">Got it</span></div>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-03</span> <b>privacy</b> — só a Política mudou</p>
  <div class="card" role="region">
    <p class="h3">The Privacy Policy changed</p>
    <p class="t">You keep playing as usual. If you want to read what changed, it is here.</p>
    <div class="wrap"><span class="btn out sm">Read the Policy</span><span class="btn qui sm">Got it</span></div>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-04</span> PT — a mesma superfície em português</p>
  <div class="card" role="region">
    <p class="h3">Os Termos e a Política de Privacidade mudaram</p>
    <p class="t">Você continua jogando normalmente. Se quiser ler o que mudou, está aqui.</p>
    <div class="wrap"><span class="btn out sm">Ler os Termos</span><span class="btn out sm">Ler a Política</span><span class="btn qui sm">Entendi</span></div>
  </div>
</div>

<div class="sec">
  <p class="lab">A fila 2, agora com 9</p>
  <div class="card avisos">
    <p class="cap">0. <code>'firstDay'</code> · 1. <code>'hp'</code> · <b>2. <code>'incubacao'</code></b> · 3. <code>'semanal'</code> · 4. <code>'triagem'</code> · 5. <code>'priming'</code> · 6. <code>'recomeco'</code> · 7. <code>'carga'</code></p>
    <p class="cap" style="color:var(--sm2-primary-ink)">8. <code>'termos'</code> — condição <code>qualDocMudou(consent, TERMS_VERSION, PRIVACY_VERSION)</code> · é o último porque nada que ele diz é perecível: os outros oito morrem sozinhos, este espera</p>
    <p class="cap">A <code>'incubacao'</code> entrou na posição 2 em 22/09/2026 (WP4.29) — desenhada em <b>DER-26</b>.</p>
  </div>
</div>
`,
  rodape: RODAPE(
    ['DER-01', 'DER-02', 'DER-03', 'DER-04'],
    'src/components/TermsUpdateBanner.tsx · App.tsx (chave \'termos\' da IIFE avisos)',
    '42b07bec · a6c1cd8a',
    '"Mudou alguma regra do jogo enquanto eu não estava olhando?" — a resposta tem de caber no slot de avisos sem roubar o lugar do que é perecível.',
    [
      'Os dois links abrem em <b>nova aba</b> e dizem isso no <code>aria-label</code> — o progresso da tela não se perde (<code>(opens in a new tab)</code>).',
      '"Got it" é <code>quiet</code>, não <code>outline</code>: fechar não é uma alternativa à leitura, é dispensar o aviso.',
      'Sem filete âmbar. A regra de tom (L11): isto é como o app funciona, não um risco a avisar — âmbar aqui competiria com os alertas reais.',
      '<code>role="region"</code> com <code>aria-labelledby</code> no título; a variante (<code>terms</code>/<code>privacy</code>/<code>both</code>) decide o título <b>e</b> quantas linhas-botão existem.',
    ],
  ),
});

// ─────────────────────────────────────────────────────────────────────────
// DER-05 · o toast de desfazer
// ─────────────────────────────────────────────────────────────────────────
artboard('ToastDesfazer', {
  corpo: `
<header class="row" style="min-height:44px"><h1 class="h1">Undo toast</h1></header>
<p class="t" style="color:var(--sm2-muted)">Sai por <code>toast.custom</code> quando um hábito é marcado como feito. A janela do toast <b>é</b> a janela da reversão (<code>duration = UNDO_WINDOW_MS</code>, 5 s): o botão nunca some antes de expirar nem fica morto na tela.</p>

<div class="strip">
  <p class="cap"><span class="tagd">DER-05</span> normal — <code>\`\${nome} — marked as done\`</code></p>
  <div class="toast" role="status">
    <span class="t" style="flex:1">Drink water — marked as done</span>
    <span class="btn out sm" style="min-width:44px;font-weight:700;color:var(--sm2-primary-ink);box-shadow:inset 0 0 0 1px var(--sm2-primary-ink)">Undo</span>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-06</span> PT — <code>'— marcado como feito'</code>; o nome acessível do botão é <code>"Desfazer a conclusão"</code>, não só "Desfazer"</p>
  <div class="toast" role="status">
    <span class="t" style="flex:1">Beber água — marcado como feito</span>
    <span class="btn out sm" style="min-width:44px;font-weight:700;color:var(--sm2-primary-ink);box-shadow:inset 0 0 0 1px var(--sm2-primary-ink)">Desfazer</span>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-07</span> nome longo — o texto quebra, o alvo de 44 não encolhe</p>
  <div class="toast" role="status" style="min-height:64px;align-items:flex-start;padding:10px 16px">
    <span class="t" style="flex:1">Ler dez páginas antes de dormir — marcado como feito</span>
    <span class="btn out sm" style="min-width:44px;font-weight:700;color:var(--sm2-primary-ink);box-shadow:inset 0 0 0 1px var(--sm2-primary-ink)">Desfazer</span>
  </div>
</div>

<div class="sec">
  <p class="lab">Onde ele aparece</p>
  <div class="card">
    <p class="t">Sobre a lista, acima da barra de navegação — <code>.toastp</code> (<code>bottom:132px</code>), o mesmo lugar do toast de sistema (SIS-06). Nunca sobre o visor: o pet fala no balão, o sistema fala no slot.</p>
    <p class="cap">Estilo por <b>token inline</b>, não por classe: <code>UndoToast.tsx</code> escreve <code>var(--sm2-surface)</code>, <code>--sm2-line</code>, <code>--sm2-radius-md</code> direto no <code>style</code>, porque classe que não existe no <code>index.css</code> não aplica nada (footgun 1, travado por <code>index.css.contract.test.ts</code>).</p>
  </div>
</div>
`,
  rodape: RODAPE(
    ['DER-05', 'DER-06', 'DER-07'],
    'src/components/UndoToast.tsx · App.tsx (ofereceDesfazer)',
    'cf6315e1',
    '"Marquei sem querer — dá pra voltar?" — e a resposta tem de durar exatamente o tempo em que voltar ainda é possível.',
    [
      'Janela de <b>5 s</b> (<code>UNDO_WINDOW_MS</code>), decisão #40–#71 do dono. O toast e a reversão têm a mesma vida — não existe botão que expirou.',
      'O botão é <code>outline</code> em <code>primary-ink</code>, peso 700, alvo 44×44 — a ação é a única luz forte do bloco.',
      '<code>role="status"</code>: a leitura de tela anuncia sem roubar o foco de onde a pessoa está.',
      'Desfazer restaura por <code>snapshot</code> (<code>snapshotCompletion</code> → <code>undoCompletion</code>), não recalcula — o que volta é o estado exato de antes.',
    ],
  ),
});

// ─────────────────────────────────────────────────────────────────────────
// DER-08 · o caminho de crise no chat
// ─────────────────────────────────────────────────────────────────────────
artboard('ChatSuporte', {
  corpo: `
<header class="row" style="min-height:44px"><h1 class="h1">Support path</h1></header>
<p class="t" style="color:var(--sm2-muted)">O rodapé fixo do <code>ChatBox</code>. A cláusula SAFETY do servidor manda procurar ajuda; sem esta linha, o app não dizia <b>como chegar lá</b> — o parecer clínico recusou "nenhum caminho" como opção.</p>

<div class="strip">
  <p class="cap"><span class="tagd">DER-08</span> EN — <code>.sm2-chat-support</code>, sempre presente sob a conversa</p>
  <div class="card">
    <p class="t">If you're going through a hard time, please reach out for real help: a health service, a support line where you live, or someone you trust. Soulmon is a habit app and it is not a substitute for that. <span style="color:var(--sm2-primary-ink);text-decoration:underline">Find a helpline</span> · US/Canada: 988. UK/IE: 116 123.</p>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-09</span> PT — a mesma superfície; os serviços nomeados mudam com o idioma</p>
  <div class="card">
    <p class="t">Se você está num momento difícil, procure ajuda de verdade: um serviço de saúde, uma linha de apoio da sua região, ou alguém de confiança. O Soulmon é um app de hábitos e não substitui isso. <span style="color:var(--sm2-primary-ink);text-decoration:underline">Encontrar uma linha de apoio</span> · No Brasil: CVV, 188 (24h, gratuito).</p>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-10</span> no lugar — o bloco fecha a coluna do chat, sob o dock de escrita</p>
  <div class="card" style="gap:12px;padding:0;overflow:hidden">
    <div style="padding:12px 12px 0"><p class="t">Pixel: <i>"I'm right here with you. I won't know what to say, but there are people who do."</i></p></div>
    <div class="dock"><span class="inp"><span class="ph">Talk to your Soulmon</span></span><span class="ico i24" aria-hidden="true">mic</span></div>
    <div style="padding:0 12px 12px"><p class="cap">If you're going through a hard time… · <span style="color:var(--sm2-primary-ink)">Find a helpline</span> · US/Canada: 988.</p></div>
  </div>
</div>

<div class="sec">
  <p class="lab">A regra dura</p>
  <div class="card">
    <p class="t"><b>Esta lista é curada, estática e humana — nunca sai do modelo.</b> Um <code>llama-3.1-8b-instant</code> alucina número de telefone com facilidade, e número alucinado numa tela de crise pune quem teve a coragem de pedir ajuda. A cláusula SAFETY proíbe o modelo de citar qualquer número, serviço ou site: quem cita é esta linha.</p>
    <p class="cap">O diretório (<code>findahelpline.com</code>) resolve <b>por país</b> — é o que Apple e Google usam. Os dois serviços nomeados cobrem o público real medido do app; só o diretório deixaria PT-BR e EN-US a um toque a mais do que precisam estar, e só os dois deixaria o resto do mundo sem caminho nenhum.</p>
  </div>
</div>
`,
  rodape: RODAPE(
    ['DER-08', 'DER-09', 'DER-10'],
    'src/components/ChatBox.tsx (.sm2-chat-support) · src/utils/chatSafety.ts',
    '6ad2e629 · f3654076',
    '"Eu disse uma coisa pesada — e agora?" — a superfície de suporte tem de estar na tela onde a pessoa já está, não a três toques de distância.',
    [
      'O link abre em nova aba (<code>rel="noopener noreferrer"</code>) e é a <b>única</b> âncora externa da tela de chat.',
      'Tinta <code>primary-ink</code> com sublinhado: é link, não botão — a ação da tela continua sendo escrever.',
      'O bloco é <b>fixo</b>, não condicional: não aparece "quando o modelo detecta crise". Detectar mal é pior que estar sempre ali.',
      'A fala da criatura que acompanha a trava vem de <code>chatSafety.ts</code>, curada — o modelo não a escreve.',
    ],
  ),
});

// ─────────────────────────────────────────────────────────────────────────
// DER-11 · Configurações: Som, Sobre e a linha do chat
// ─────────────────────────────────────────────────────────────────────────
artboard('ConfigSomSobre', {
  corpo: `
<header class="row" style="min-height:44px"><h1 class="h1">Settings — Sound &amp; About</h1></header>
<p class="t" style="color:var(--sm2-muted)">Três grupos da <code>SettingsPage</code> que o canvas Conta não alcançou: <b>Sound</b> (21/09), <b>About</b> com a declaração de IA (21/09) e a linha "What the chat receives".</p>

<div class="card grp">
  <p class="h2">Sound</p>
  <div class="swrow">
    <span class="switch on" aria-hidden="true"></span>
    <span class="tx"><span class="t b">Sound effects</span><span class="hint">They confirm what you did. Never play on their own.</span></span>
  </div>
  <div class="swrow">
    <span class="switch" aria-hidden="true"></span>
    <span class="tx"><span class="t b">Music</span><span class="hint">Two calm looping layers. Stops by itself when the app is out of view.</span></span>
  </div>
  <p class="cap"><span class="tagd">DER-11</span> normal — som ligado, trilha desligada (ela <b>nasce</b> desligada: este toque É o gesto que a liga)</p>
</div>

<div class="card grp">
  <p class="h2">Sound</p>
  <div class="swrow">
    <span class="switch" aria-hidden="true"></span>
    <span class="tx"><span class="t b">Sound effects</span><span class="hint">They confirm what you did. Never play on their own.</span></span>
  </div>
  <div class="swrow">
    <span class="switch" aria-hidden="true"></span>
    <span class="tx"><span class="t b">Music</span><span class="hint">With sound off, music stays silent.</span></span>
  </div>
  <p class="cap"><span class="tagd">DER-12</span> mudo — a <b>dica da trilha muda</b>, o switch não trava: a pessoa pode deixar a trilha armada para quando religar o som</p>
</div>

<div class="card grp">
  <p class="h2">About</p>
  <p class="t">Soulmon is a habit app with a virtual pet. It does not assess, diagnose or treat anything, and it is not a substitute for health care.</p>
  <p class="t">The personality questionnaire is not a validated test, and the birth chart predicts nothing: both exist to generate your creature.</p>
  <p class="t">Soulmon knows nothing about your life beyond what you typed into it.</p>
  <p class="t">Nothing shown here is a statement about your health, your mind or your future.</p>
  <p class="t">Your creature's image, the chat lines and some sounds (evolution, regression and task completion) are AI-generated.</p>
  <div class="arow"><span class="tx t"><span class="b">What the chat receives</span><br><span class="hint">In the privacy policy.</span></span><span class="ico i24" aria-hidden="true">chevron_right</span></div>
  <p class="cap"><span class="tagd">DER-13</span> os quatro limites em <b>mesmo peso tipográfico</b> + a IA declarada · a linha do chat é <code>ActionRow</code> com <code>href</code>, alvo 44</p>
</div>

<div class="card grp">
  <p class="h2">Help</p>
  <div class="arow"><span class="tx t"><span class="b">Talk to the people who make Soulmon</span><br><span class="hint">Opens your email app. The app version is already filled in.</span></span><span class="ico i24" aria-hidden="true">chevron_right</span></div>
  <p class="cap"><span class="tagd">DER-14</span> <code>FeedbackLink</code> — o corpo do e-mail já vai com <code>Version</code>, <code>Code</code> (12 caracteres do save) e <code>From: settings</code>; da tela de erro vai também <code>Error:</code> e o assunto vira "Soulmon — error"</p>
</div>
`,
  rodape: RODAPE(
    ['DER-11', 'DER-12', 'DER-13', 'DER-14'],
    'src/components/SettingsPage.tsx (Group Sound/About) · src/components/FeedbackLink.tsx',
    '980bc84c · ee79fd44 · 42b07bec · a6c1cd8a',
    '"Como eu faço isso calar a boca — e quem está escrevendo essas falas?" — as duas perguntas moram no mesmo lugar.',
    [
      'D11: som <b>só por gesto</b>; o app funciona 100 % mudo. A trilha tem chave própria e nasce desligada.',
      'A dica da trilha é <b>condicional</b>: com os sons desligados ela diz o que realmente acontece, em vez de prometer duas camadas que não vão tocar.',
      'A declaração de IA tem tom de <b>fato</b>, não de alerta (L11): não é um risco a avisar, é como o app funciona.',
      '<code>FeedbackLink</code> abre o cliente de e-mail com contexto preenchido — não é formulário, não sobe nada sozinho.',
    ],
  ),
});

// ─────────────────────────────────────────────────────────────────────────
// DER-15 · a lápide (conta excluída)
// ─────────────────────────────────────────────────────────────────────────
artboard('ContaExcluida', {
  corpo: `
<header class="row" style="min-height:44px"><h1 class="h1">Account deleted</h1></header>
<p class="t" style="color:var(--sm2-muted)">O servidor responde <b>410 <code>account-deleted</code></b> e o portão precisa dizer isso sem parecer erro de rede. A região viva está <b>sempre</b> no DOM, vazia; o texto entra pós-montagem.</p>

<div class="strip">
  <p class="cap"><span class="tagd">DER-15</span> a lápide sobre o portão — <code>data-account-deleted-notice</code>, centrada, acima do <code>StepShell</code></p>
  <div class="card" style="text-align:center;gap:4px">
    <p class="lab" style="margin:0">Account deleted</p>
    <p class="t">This account was deleted. You can start over — nothing from it comes back.</p>
  </div>
  <div class="card">
    <p class="h3">Before we start</p>
    <p class="t">You can read both documents now — they open in a new tab and nothing here is lost.</p>
    <div class="wrap"><span class="btn out sm">Terms of Use</span><span class="btn out sm">Privacy policy</span></div>
    <span class="btn pri full">Continue</span>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-16</span> reabertura no login posterior — a mesma lápide aparece quando a pessoa tenta <b>entrar</b>, não só quando volta pelo link</p>
  <div class="card" style="text-align:center;gap:4px">
    <p class="lab" style="margin:0">Conta excluída</p>
    <p class="t">Esta conta foi excluída. Você pode começar de novo — nada dela volta.</p>
  </div>
  <div class="card">
    <p class="h3">Entrar no Soulmon</p>
    <p class="t">Sua conta guarda o progresso e amarra qualquer compra a você. A sessão fica salva — não precisa entrar de novo a cada vez.</p>
    <span class="inp"><span class="ph">seu@email.com</span></span>
    <span class="btn pri full">Entrar</span>
  </div>
</div>

<div class="strip">
  <p class="cap"><span class="tagd">DER-17</span> região viva vazia — o estado <b>antes</b> do aviso: o <code>aria-live</code> existe no DOM sem cabeçalho, e é por isso que o anúncio é lido quando chega</p>
  <div class="card" style="border-style:dashed;min-height:56px;align-items:center;justify-content:center">
    <p class="cap" style="text-align:center"><code>&lt;div aria-live="polite" aria-atomic="true" data-account-deleted-live&gt;</code> — vazia</p>
  </div>
</div>
`,
  rodape: RODAPE(
    ['DER-15', 'DER-16', 'DER-17'],
    'src/components/SoulmonOnboarding.tsx (data-account-deleted-notice)',
    '592e2c14 · a6c1cd8a',
    '"Eu apaguei minha conta — o que aparece quando eu voltar?" — a resposta não pode ser uma tela de erro genérica.',
    [
      'Não é alerta: é <code>sm2Label</code> + texto, centrado, sem filete e sem cor de perigo. A conta acabou porque a pessoa pediu.',
      'A região <code>aria-live="polite"</code> nasce <b>vazia e montada</b>; o texto entra depois. Montar a região junto com o texto não anuncia nada.',
      'A lápide reabre no login posterior (correção da rodada 2 de QA) — antes ela só aparecia no retorno pelo link.',
      'O portão atrás dela continua inteiro: a saída é começar de novo, e ela está a um toque.',
    ],
  ),
});

console.log('artboards escritos em ' + OUT);
