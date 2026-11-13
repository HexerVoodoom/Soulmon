// "O usuário logado está no teste da intro narrativa?" Só responde sobre o PRÓPRIO token; nunca devolve a lista.
import { verifyIdToken, bearerToken } from './_auth.js';
import { isIntroTester } from './_intro.js';

export async function onRequestGet({ request, env }) {
  const claims = await verifyIdToken(bearerToken(request), env.FIREBASE_PROJECT_ID);
  const tester = claims ? await isIntroTester(env, claims.email) : false;
  return Response.json({ tester }, { headers: { 'Cache-Control': 'private, no-store' } });
}
