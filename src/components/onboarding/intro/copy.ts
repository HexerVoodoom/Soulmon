/** Legendas da cinemática "A Parede" (docs/roteiro/INTRO-CINEMATICA.md): 9 planos, EN/PT, duração em segundos. v3 (04/11/2026, dono: "muito longo"): de 72,9 s para ~35 s; v3.1 (mesmo dia): +20% (~42,5 s) e o logo animado entra no fim (IntroCinematica). */
export interface PlanoIntro { s: number; en: string; pt: string }

export const PLANOS_INTRO: readonly PlanoIntro[] = [
  { s: 4.3, en: 'Long ago, every person could see their own soul.', pt: 'Há muito tempo, cada pessoa enxergava a própria alma.' },
  { s: 4.3, en: 'They walked beside it, like a shadow that listened.', pt: 'Caminhavam com ela, como uma sombra que escuta.' },
  { s: 5, en: 'Then the world grew loud, and the soul went quiet.', pt: 'Então o mundo ficou alto, e a alma se calou.' },
  { s: 4.6, en: 'What pulled us away… also found the way back.', pt: 'O que nos afastou… também achou o caminho de volta.' },
  { s: 5.5, en: 'A door opened to a world that was always here, beside us.', pt: 'Abriu-se uma porta para um mundo que sempre esteve aqui, ao nosso lado.' },
  { s: 4.6, en: 'Here, as your soul grows, so does your life.', pt: 'Aqui, quando a sua alma cresce, a sua vida cresce junto.' },
  { s: 5, en: 'But every burden you carry finds a shape here too.', pt: 'Mas cada peso que você carrega também ganha forma aqui.' },
  { s: 3.8, en: 'And here, you can face it.', pt: 'E aqui, você pode enfrentá-lo.' },
  { s: 5.4, en: 'Your Soulmon is waiting.', pt: 'Seu Soulmon está esperando.' },
];
