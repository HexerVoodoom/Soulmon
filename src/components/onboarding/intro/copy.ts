/** Legendas da cinemática "A Parede" (docs/roteiro/INTRO-CINEMATICA.md): 9 planos, EN/PT, duração em segundos. Tempos = vídeo real de 66,5 s (12 clipes de 6 s com fusão de 0,5 s; clipe k começa em (k-1)*5,5 s; plano1=c1, 2=c2, 3=c3-4, 4=c5, 5=c6-7, 6=c8, 7=c9-10, 8=c11, 9=c12). */
export interface PlanoIntro { s: number; en: string; pt: string }

export const PLANOS_INTRO: readonly PlanoIntro[] = [
  { s: 5.5, en: 'Long ago, every person could see their own soul.', pt: 'Há muito tempo, cada pessoa enxergava a própria alma.' },
  { s: 5.5, en: 'They walked beside it, like a shadow that listened.', pt: 'Caminhavam com ela, como uma sombra que escuta.' },
  { s: 11, en: 'Then the world grew loud, and the soul went quiet.', pt: 'Então o mundo ficou alto, e a alma se calou.' },
  { s: 5.5, en: 'What pulled us away… also found the way back.', pt: 'O que nos afastou… também achou o caminho de volta.' },
  { s: 11, en: 'A door opened to a world that was always here, beside us.', pt: 'Abriu-se uma porta para um mundo que sempre esteve aqui, ao nosso lado.' },
  { s: 5.5, en: 'Here, as your soul grows, so does your life.', pt: 'Aqui, quando a sua alma cresce, a sua vida cresce junto.' },
  { s: 11, en: 'But every burden you carry finds a shape here too.', pt: 'Mas cada peso que você carrega também ganha forma aqui.' },
  { s: 5.5, en: 'And here, you can face it.', pt: 'E aqui, você pode enfrentá-lo.' },
  { s: 6, en: 'Your Soulmon is waiting.', pt: 'Seu Soulmon está esperando.' },
];
