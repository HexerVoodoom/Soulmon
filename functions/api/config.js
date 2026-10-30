// Configuração PÚBLICA do servidor — o mínimo que um cliente precisa saber
// antes de decidir como se comportar. Nada aqui é segredo.
//
// Existe por causa do app de desktop: ele precisa saber se deve **exigir
// login** ou se ainda pode aceitar um e-mail digitado (modo de migração, ver
// _auth.js). Sem isso ele teria que adivinhar — e adivinhar errado significa
// ou pedir login onde ele nem está configurado, ou deixar o campo de e-mail
// livre depois que o servidor já exige token, entregando um 403 sem explicação.

import { isBillingDisabled, isChatDisabled } from './_killSwitch.js';
import { isOnboardingVelado } from './_velado.js';

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
    // true = `/api/transcribe` tem provedor configurado. O cliente usa isto
    // para NÃO DESENHAR o botão de microfone quando ele não teria como
    // funcionar — botão que existe e falha é pior que botão que não existe.
    // Provedor = Groq direto; a rota só exige `GROQ_API_KEY`.
    transcribeAvailable: !!env.GROQ_API_KEY,
    // Kill-switches do beta (`_killSwitch.js`, BETA-CONTINGENCIA §0): a UI
    // esconde compra / IA do chat. Quem GARANTE é o servidor, não este campo.
    billingDisabled: isBillingDisabled(env),
    chatDisabled: isChatDisabled(env),
    // Onboarding Velado (plano §7): desligado por padrão.
    onboardingVelado: isOnboardingVelado(env),
  }, {
    headers: { ...CORS, 'Cache-Control': 'public, max-age=300' },
  });
}
