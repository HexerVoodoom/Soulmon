// "O usuário logado está no teste do Velado?" (plano §7). Só responde sobre o PRÓPRIO token; nunca devolve a lista.
import { verifyIdToken, bearerToken } from './_auth.js';
import { isVeladoTester } from './_velado.js';

export async function onRequestGet({ request, env }) {
  const claims = await verifyIdToken(bearerToken(request), env.FIREBASE_PROJECT_ID);
  const tester = claims ? await isVeladoTester(env, claims.email) : false;
  return Response.json({ tester }, { headers: { 'Cache-Control': 'private, no-store' } });
}
