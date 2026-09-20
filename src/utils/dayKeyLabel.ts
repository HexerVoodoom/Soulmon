/**
 * A data CURTA de um `dayKey` do jogador, para as coleções (Dex de Sonhos,
 * Diário de Aventuras) — "12/09" em PT, "Sep 12" em EN.
 *
 * `day` pode ser ISO (`2026-09-08`) ou o `toDateString()` (`Tue Sep 08 2026`),
 * porque as duas formas circulam no save.
 *
 * ⚠️ O ISO é montado NA MÃO, e não com `new Date(day)`: a string `AAAA-MM-DD`
 * é interpretada pelo JS como **meia-noite UTC**, então em qualquer fuso
 * negativo (o Brasil inteiro) ela vira o dia ANTERIOR na hora de exibir. O
 * diário mostraria 07/09 para um achado do dia 08. Um teste pegou isto
 * (`AdventureDiary.render.test.tsx`). Nasceu no `AdventureDiary` e veio para
 * cá quando o Dex ganhou "#NN · data" (canvas Pet, P2) — a segunda casa.
 */
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayKeyLabel(day: string, isPt: boolean): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (iso) {
    const [, , mes, dia] = iso;
    if (isPt) return `${dia}/${mes}`;
    return `${MESES_EN[Number(mes) - 1]} ${Number(dia)}`;
  }
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return isPt
    ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
