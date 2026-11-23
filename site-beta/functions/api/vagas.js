import { json } from '../_lib/resp.js';

export async function onRequestGet({ env }) {
  const estado = env.LEVA_ESTADO === 'espera' ? 'espera' : 'abertas';
  return json({ estado });
}

export const onRequest = () => json({ ok: false, erro: 'corpo' }, 405, { Allow: 'GET' });
