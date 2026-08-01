// Configuração PÚBLICA do servidor — o mínimo que um cliente precisa saber
// antes de decidir como se comportar. Nada aqui é segredo.
//
// Existe por causa do app de desktop: ele precisa saber se deve **exigir
// login** ou se ainda pode aceitar um e-mail digitado (modo de migração, ver
// _auth.js). Sem isso ele teria que adivinhar — e adivinhar errado significa
// ou pedir login onde ele nem está configurado, ou deixar o campo de e-mail
// livre depois que o servidor já exige token, entregando um 403 sem explicação.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ env }) {
  return Response.json({
    // true = todas as rotas de save/dinheiro exigem ID token do Firebase.
    authRequired: !!env.FIREBASE_PROJECT_ID,
  }, {
    headers: { ...CORS, 'Cache-Control': 'public, max-age=300' },
  });
}
