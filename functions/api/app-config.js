// `/api/app-config` — versão mínima e recomendada do app nativo (versionCode). Pública, sem segredo.
// O cliente decide o que fazer (src/utils/appUpdate.ts); erro/sem rede lá = nunca bloquear.
import { appVersionConfig } from './_appVersion.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ env }) {
  return Response.json(appVersionConfig(env), { headers: { ...CORS, 'Cache-Control': 'public, max-age=300' } });
}
