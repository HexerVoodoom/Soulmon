// Toda resposta de /api/* sai daqui: nosniff e no-store sao fixos e nao podem ser trocados por `extra`.
export function json(corpo, status = 200, extra = {}) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...extra, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
export const erro = (status, e) => json({ ok: false, erro: e }, status);
export const dia = (d = new Date()) => d.toISOString().slice(0, 10);
