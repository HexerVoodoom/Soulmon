// Ícones dos 3 alinhamentos do Soulmon (Poder/Harmonia/Benevolência — o
// "atributo" do oráculo). Formas geométricas com um detalhe interno (não a
// forma pura), pra terem identidade visual própria em vez de emoji genérico.
interface AlignmentIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Poder — triângulo com um triângulo menor concêntrico dentro. */
export function PowerIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: AlignmentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L21 19 H3 Z" />
      <path d="M12 9.5 L16.3 17 H7.7 Z" />
    </svg>
  );
}

/** Harmonia — círculo com uma espiral dentro. */
export function HarmonyIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: AlignmentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12.5c0-2 1.6-3.5 3.5-3.5S19 10.5 19 12.5 17.4 16 15.5 16 13 14.5 13 13.2s1-2.2 2.2-2.2" />
    </svg>
  );
}

/** Benevolência — "Y" (três braços a partir do centro) com um ponto no meio. */
export function BenevolenceIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: AlignmentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V12" />
      <path d="M12 12 4 4.5" />
      <path d="M12 12 20 4.5" />
      <circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}
