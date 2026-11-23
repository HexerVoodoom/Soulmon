// Página `/gm/carta` — envia a carta de teste do Papus para a própria conta do GM (§244). Casca HTML SEM dados e sem link na
// navegação do jogo. Login Firebase (Google) e chamada a `/api/gm-carta-teste`; quem decide é o servidor. Cabeçalhos e SRI: `_gmPage.js`.
import { firebaseScripts, gmHeaders, gmNonce } from './_gmPage.js';

export async function onRequestGet({ env }) {
  const nonce = gmNonce();
  const cfg = { apiKey: env?.FIREBASE_API_KEY || '', authDomain: env?.FIREBASE_AUTH_DOMAIN || '', projectId: env?.FIREBASE_PROJECT_ID || '' };
  const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>GM · Carta de teste</title>
<style>body{font:14px system-ui;margin:16px;background:#14121c;color:#eee}button{padding:12px 16px;min-height:44px}p{margin:12px 0}</style></head><body>
<h1>Carta de teste do Papus</h1><p>Vai só para a sua conta, sem prêmio, no máximo uma por dia.</p><div id="s">Carregando…</div>
${firebaseScripts(nonce)}
<script nonce="${nonce}">
const $=id=>document.getElementById(id);
function botao(t,f){$('s').innerHTML='';const b=document.createElement('button');b.textContent=t;b.onclick=f;$('s').appendChild(b);}
async function enviar(user){$('s').textContent='Enviando…';const t=await user.getIdToken();const r=await fetch('/api/gm-carta-teste',{method:'POST',headers:{Authorization:'Bearer '+t}});
if(r.status===403){$('s').textContent='Acesso negado.';return;}if(!r.ok){$('s').textContent='Erro '+r.status;return;}
const j=await r.json();$('s').textContent=j.status==='sent'?'Carta enviada. Feche e abra o app.':'A carta de hoje já foi enviada. Feche e abra o app.';}
const cfg=${cfgJson};
if(!cfg.apiKey){$('s').textContent='Firebase não configurado.';}else{
firebase.initializeApp(cfg);firebase.auth().onAuthStateChanged(u=>{if(u){botao('Enviar carta para mim',()=>enviar(u));}else{botao('Entrar com Google',()=>firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()));}});}
</script></body></html>`;
  return new Response(html, { headers: gmHeaders(nonce) });
}
