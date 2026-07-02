// Purchasable pet-box backgrounds (pure CSS — no assets needed, 8-bit vibes).
// Keyed by shop item id; CompanionHUD falls back to the default cyberpunk PNG
// when nothing is equipped.
export interface PetBackground {
  namePt: string;
  nameEn: string;
  /** CSS `background` shorthand value. */
  css: string;
}

export const PET_BACKGROUNDS: Record<string, PetBackground> = {
  'bg-night': {
    namePt: 'Céu Noturno',
    nameEn: 'Night Sky',
    css: [
      'radial-gradient(1px 1px at 12% 22%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 34% 10%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 58% 30%, #ffe9a8 50%, transparent 51%)',
      'radial-gradient(1px 1px at 76% 14%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 90% 40%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 22% 48%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, #0b1026 0%, #1b2350 70%, #2c2a5e 100%)',
    ].join(', '),
  },
  'bg-desert': {
    namePt: 'Deserto Pixel',
    nameEn: 'Pixel Desert',
    css: [
      'radial-gradient(28px 28px at 78% 22%, #ffd75e 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 62%, #c98a4b 62%, #c98a4b 74%, #b0713a 74%)',
      'linear-gradient(180deg, #ff9a5c 0%, #ffb56b 55%, #e8a05c 100%)',
    ].join(', '),
  },
  'bg-matrix': {
    namePt: 'Matriz Verde',
    nameEn: 'Green Matrix',
    css: [
      'repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(43,255,149,0.16) 15px)',
      'repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(43,255,149,0.16) 15px)',
      'linear-gradient(180deg, #01130a 0%, #03200f 100%)',
    ].join(', '),
  },
};
