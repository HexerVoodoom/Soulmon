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
  'bg-forest': {
    namePt: 'Floresta Nativa',
    nameEn: 'Native Forest',
    css: [
      'radial-gradient(22px 30px at 18% 66%, #166534 49%, transparent 51%)',
      'radial-gradient(26px 34px at 46% 64%, #15803d 49%, transparent 51%)',
      'radial-gradient(22px 30px at 74% 67%, #166534 49%, transparent 51%)',
      'radial-gradient(18px 26px at 95% 68%, #15803d 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 76%, #14532d 76%, #14532d 82%, #052e16 82%)',
      'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #86efac 100%)',
    ].join(', '),
  },
  'bg-ocean': {
    namePt: 'Fundo do Mar',
    nameEn: 'Deep Sea',
    css: [
      'radial-gradient(2px 2px at 22% 66%, rgba(255,255,255,0.9) 50%, transparent 51%)',
      'radial-gradient(3px 3px at 27% 44%, rgba(255,255,255,0.7) 50%, transparent 51%)',
      'radial-gradient(2px 2px at 33% 26%, rgba(255,255,255,0.8) 50%, transparent 51%)',
      'radial-gradient(2px 2px at 72% 58%, rgba(255,255,255,0.75) 50%, transparent 51%)',
      'radial-gradient(3px 3px at 78% 34%, rgba(255,255,255,0.6) 50%, transparent 51%)',
      'linear-gradient(115deg, transparent 42%, rgba(125,211,252,0.22) 50%, transparent 58%)',
      'linear-gradient(180deg, #075985 0%, #0c4a6e 55%, #082f49 100%)',
    ].join(', '),
  },
  'bg-gameboy': {
    namePt: 'LCD Retrô',
    nameEn: 'Retro LCD',
    css: [
      'repeating-linear-gradient(0deg, rgba(15,56,15,0.10), rgba(15,56,15,0.10) 2px, transparent 2px, transparent 6px)',
      'repeating-linear-gradient(90deg, rgba(15,56,15,0.10), rgba(15,56,15,0.10) 2px, transparent 2px, transparent 6px)',
      'linear-gradient(180deg, #9bbc0f 0%, #8bac0f 100%)',
    ].join(', '),
  },
  'bg-snow': {
    namePt: 'Terra Gelada',
    nameEn: 'Freezeland',
    css: [
      'radial-gradient(2px 2px at 14% 22%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 38% 12%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 60% 28%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 84% 16%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 26% 46%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 70% 52%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #e0f2fe 74%, #e0f2fe 82%, #bae6fd 82%)',
      'linear-gradient(180deg, #60a5fa 0%, #93c5fd 55%, #dbeafe 100%)',
    ].join(', '),
  },
  'bg-lava': {
    namePt: 'Montanha de Lava',
    nameEn: 'Lava Mountain',
    css: [
      'radial-gradient(3px 3px at 28% 64%, #fde047 50%, transparent 51%)',
      'radial-gradient(2px 2px at 55% 56%, #fb923c 50%, transparent 51%)',
      'radial-gradient(3px 3px at 78% 68%, #fde047 50%, transparent 51%)',
      'radial-gradient(2px 2px at 42% 38%, #f97316 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 78%, #ea580c 78%, #f97316 84%, #7c2d12 84%)',
      'linear-gradient(180deg, #1c0a06 0%, #431407 60%, #7c2d12 100%)',
    ].join(', '),
  },
  'bg-sakura': {
    namePt: 'Cerejeira',
    nameEn: 'Cherry Blossom',
    css: [
      'radial-gradient(3px 3px at 18% 28%, #f472b6 50%, transparent 51%)',
      'radial-gradient(2px 2px at 42% 14%, #f9a8d4 50%, transparent 51%)',
      'radial-gradient(3px 3px at 64% 34%, #f472b6 50%, transparent 51%)',
      'radial-gradient(2px 2px at 84% 20%, #f9a8d4 50%, transparent 51%)',
      'radial-gradient(3px 3px at 30% 52%, #ec4899 50%, transparent 51%)',
      'radial-gradient(2px 2px at 74% 58%, #f472b6 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 82%, #86efac 82%)',
      'linear-gradient(180deg, #fdf2f8 0%, #fce7f3 55%, #fbcfe8 100%)',
    ].join(', '),
  },
  'bg-toytown': {
    namePt: 'Cidade dos Brinquedos',
    nameEn: 'Toy Town',
    css: [
      'radial-gradient(4px 4px at 20% 28%, #fff 50%, transparent 51%)',
      'radial-gradient(4px 4px at 55% 16%, #fff 50%, transparent 51%)',
      'radial-gradient(4px 4px at 82% 34%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 70%, #f87171 70%, #f87171 78%, #fbbf24 78%, #fbbf24 86%, #34d399 86%)',
      'linear-gradient(180deg, #a5f3fc 0%, #cffafe 60%, #fef9c3 100%)',
    ].join(', '),
  },
  'bg-synthwave': {
    namePt: 'Synthwave',
    nameEn: 'Synthwave',
    css: [
      'radial-gradient(30px 30px at 50% 34%, #fbbf24 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 33%, rgba(219,39,119,0.5) 34%, transparent 35%, transparent 40%, rgba(219,39,119,0.5) 41%, transparent 42%)',
      'linear-gradient(180deg, transparent 58%, rgba(244,114,182,0.9) 58%, transparent 59.5%, transparent 68%, rgba(244,114,182,0.65) 68%, transparent 69.5%, transparent 80%, rgba(244,114,182,0.45) 80%, transparent 81.5%, transparent 92%, rgba(244,114,182,0.35) 92%, transparent 93.5%)',
      'linear-gradient(180deg, #2e1065 0%, #6d28d9 40%, #db2777 56%, #1e1b4b 57%, #312e81 100%)',
    ].join(', '),
  },
};
