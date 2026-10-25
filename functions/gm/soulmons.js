// Página `/gm/soulmons` — casca HTML SEM dados e sem link na navegação do jogo.
// Faz login Firebase (Google) e chama `/api/gm-soulmons`; quem decide é o
// servidor. Config web do Firebase (pública, não é segredo): `FIREBASE_API_KEY`,
// `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` (já existente).

export async function onRequestGet({ env }) {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const cfg = { apiKey: env?.FIREBASE_API_KEY || '', authDomain: env?.FIREBASE_AUTH_DOMAIN || '', projectId: env?.FIREBASE_PROJECT_ID || '' };
  const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>GM · Soulmons gerados</title>
<style>body{font:14px system-ui;margin:16px;background:#14121c;color:#eee}button{padding:8px 14px}#g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}
.c{background:#201c2e;border-radius:8px;padding:8px;word-break:break-all}.c img{width:100%;aspect-ratio:1;object-fit:contain;background:#0006;border-radius:6px}.m{opacity:.7;font-size:12px}</style></head><body>
<h1>Soulmons gerados</h1><div id="s">Carregando…</div><div id="g"></div><button id="more" hidden>Carregar mais</button>
<script nonce="${nonce}" src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script nonce="${nonce}" src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script nonce="${nonce}">
const $=id=>document.getElementById(id);let cursor=null;
function card(i){const d=document.createElement('div');d.className='c';const im=document.createElement('img');im.src=i.image;im.loading='lazy';im.alt='';d.appendChild(im);
for(const t of [i.name||'(sem nome)',i.email||'(sem e-mail: geração antiga)',i.formId+(i.provider?' · '+i.provider:''),i.at?new Date(i.at).toLocaleString('pt-BR'):'']){const p=document.createElement('div');p.className='m';p.textContent=t;d.appendChild(p);}return d;}
async function load(user){const t=await user.getIdToken();const r=await fetch('/api/gm-soulmons'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{headers:{Authorization:'Bearer '+t}});
if(r.status===403){$('s').textContent='Acesso negado.';return;}if(!r.ok){$('s').textContent='Erro '+r.status;return;}
const j=await r.json();$('s').textContent='';j.items.forEach(i=>$('g').appendChild(card(i)));cursor=j.cursor;$('more').hidden=!cursor;}
const cfg=${cfgJson};
if(!cfg.apiKey){$('s').textContent='Firebase não configurado (FIREBASE_API_KEY / FIREBASE_AUTH_DOMAIN).';}else{
firebase.initializeApp(cfg);firebase.auth().onAuthStateChanged(u=>{if(u){load(u);$('more').onclick=()=>load(firebase.auth().currentUser);}else{$('s').innerHTML='';const b=document.createElement('button');b.textContent='Entrar com Google';b.onclick=()=>firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());$('s').appendChild(b);}});}
</script></body></html>`;
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}' https://www.gstatic.com https://apis.google.com; style-src 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com; frame-src https://*.firebaseapp.com https://accounts.google.com; base-uri 'none'; form-action 'none'`,
  } });
}
