import type { Sign } from './types';

/** Display names for the zodiac signs. The `Sign` id stays Portuguese (it is a
 *  stable key used by the engine tables); English is the base for display. */
const SIGN_EN: Record<Sign, string> = {
  'Áries': 'Aries', 'Touro': 'Taurus', 'Gêmeos': 'Gemini', 'Câncer': 'Cancer',
  'Leão': 'Leo', 'Virgem': 'Virgo', 'Libra': 'Libra', 'Escorpião': 'Scorpio',
  'Sagitário': 'Sagittarius', 'Capricórnio': 'Capricorn', 'Aquário': 'Aquarius',
  'Peixes': 'Pisces',
};

export function signLabel(sign: Sign | string, isPt: boolean): string {
  return isPt ? sign : (SIGN_EN[sign as Sign] ?? sign);
}
