/**
 * Extensão do arquivo de áudio pelo mime REAL gravado. O Safari/iOS grava
 * `audio/mp4`; nomear tudo `recording.webm` fazia o provedor rejeitar pelo
 * nome. Padrão: webm.
 */
export function audioExtension(mimeType: string | undefined | null): string {
  const base = (mimeType ?? '').split(';')[0].trim().toLowerCase();
  if (base === 'audio/ogg' || base === 'application/ogg') return 'ogg';
  if (base === 'audio/x-m4a' || base === 'audio/m4a') return 'm4a';
  if (base === 'audio/mp4' || base === 'video/mp4') return 'mp4';
  if (base === 'audio/mpeg' || base === 'audio/mp3') return 'mp3';
  if (base === 'audio/wav' || base === 'audio/x-wav' || base === 'audio/wave') return 'wav';
  return 'webm';
}
