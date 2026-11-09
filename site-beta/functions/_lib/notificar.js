const TETO_NOTIFICACAO_DIA = 20;

// Texto puro, sem o e-mail do inscrito. Sem reenvio: a exportacao e a fonte da verdade.
export async function notificar(env, dia, total, fetchFn = fetch) {
  try {
    if (!env.RESEND_API_KEY || !env.NOTIFICAR_PARA) return;
    const r = await env.DB.prepare(
      'INSERT INTO notificacoes (dia, n) VALUES (?, 1) ON CONFLICT(dia) DO UPDATE SET n = n + 1 WHERE n < ?',
    ).bind(dia, TETO_NOTIFICACAO_DIA).run();
    if (!r.meta || r.meta.changes === 0) return;
    const resp = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Soulmon beta <onboarding@resend.dev>',
        to: [env.NOTIFICAR_PARA],
        subject: 'Nova inscrição no beta do Soulmon (total: ' + total + ')',
        text: 'Alguém entrou na lista do beta agora. Total de inscritos: ' + total + '. Para baixar a lista, dê dois cliques em BAIXAR-INSCRITOS.bat na pasta do site-beta.',
      }),
    });
    if (!resp.ok) console.log(JSON.stringify({ evento: 'notificacao_falhou', status: resp.status }));
  } catch {
    console.log(JSON.stringify({ evento: 'notificacao_falhou' }));
  }
}
