// Página `/gm/rift` — revisão dos prêmios do Endless Rift (decisão do dono 1, QA beta3). Casca HTML SEM dados e sem link na
// navegação do jogo. Login Firebase (Google) e chamada a `/api/gm-rift-payout`; quem decide é o servidor.
// Cabeçalhos e SRI: `_gmPage.js`.
import { firebaseScripts, gmHeaders, gmNonce } from './_gmPage.js';

export async function onRequestGet({ env }) {
  const nonce = gmNonce();
  const cfg = { apiKey: env?.FIREBASE_API_KEY || '', authDomain: env?.FIREBASE_AUTH_DOMAIN || '', projectId: env?.FIREBASE_PROJECT_ID || '' };
  const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>GM · Prêmios da Fenda</title>
<style>body{font:14px system-ui;margin:16px;background:#14121c;color:#eee}button{padding:8px 14px;margin-right:8px}#l{display:grid;gap:12px;margin-top:14px}
.c{background:#201c2e;border-radius:8px;padding:12px}.m{opacity:.75;font-size:12px;margin-top:4px}.ok{color:#8f8}.no{color:#f98}</style></head><body>
<h1>Prêmios do Endless Rift</h1><p class="m">O fechamento do mês só grava o top 3. Os Créditos saem quando você aprova aqui.</p><div id="s">Carregando…</div><div id="l"></div>
${firebaseScripts(nonce)}
<script nonce="${nonce}">
const $=id=>document.getElementById(id);
function line(d,t,c){const p=document.createElement('div');p.className='m'+(c?' '+c:'');p.textContent=t;d.appendChild(p);}
async function act(user,it,action){const t=await user.getIdToken();const r=await fetch('/api/gm-rift-payout',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({month:it.month,saveId:it.saveId,action:action})});const j=await r.json().catch(()=>({}));$('s').textContent=r.ok?('Resultado: '+j.status):('Erro '+r.status);load(user);}
function card(user,it){const d=document.createElement('div');d.className='c';const h=document.createElement('strong');h.textContent=it.month+' · #'+it.place+' · '+(it.name||'(sem nome)')+' · score '+it.score+' · '+it.credits+' Créditos';d.appendChild(h);
const p=it.progresso;line(d,p?('Lastro do mês: começou na camada '+p.base+', '+p.camadasComecadas+' camadas começadas, recorde do servidor '+p.recordeDoServidor):'Sem lastro registrado (o servidor não viu esta conta descer neste mês)');
line(d,'Histórico: '+(it.historico.length?it.historico.map(h=>h.month+' → '+h.best).join(' · '):'sem meses anteriores no ranking'));
line(d,'Situação: '+it.status+(it.refused?(' (recusado: '+it.refused+')'):''),it.status==='paid'?'ok':(it.status==='rejected'?'no':''));
if(it.status==='pending'){const a=document.createElement('button');a.textContent='Aprovar e creditar';a.onclick=()=>act(user,it,'approve');const r=document.createElement('button');r.textContent='Rejeitar';r.onclick=()=>act(user,it,'reject');d.appendChild(a);d.appendChild(r);}return d;}
async function load(user){const t=await user.getIdToken();const r=await fetch('/api/gm-rift-payout',{headers:{Authorization:'Bearer '+t}});
if(r.status===403){$('s').textContent='Acesso negado.';return;}if(!r.ok){$('s').textContent='Erro '+r.status;return;}
const j=await r.json();if(!$('s').textContent.startsWith('Resultado'))$('s').textContent=j.items.length?'':'Nada a revisar.';$('l').textContent='';j.items.forEach(i=>$('l').appendChild(card(user,i)));}
const cfg=${cfgJson};
if(!cfg.apiKey){$('s').textContent='Firebase não configurado (FIREBASE_API_KEY / FIREBASE_AUTH_DOMAIN).';}else{
firebase.initializeApp(cfg);firebase.auth().onAuthStateChanged(u=>{if(u){load(u);}else{$('s').innerHTML='';const b=document.createElement('button');b.textContent='Entrar com Google';b.onclick=()=>firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());$('s').appendChild(b);}});}
</script></body></html>`;
  return new Response(html, { headers: gmHeaders(nonce) });
}
