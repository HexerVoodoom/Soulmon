import { registerPlugin } from '@capacitor/core';

export interface SoulmonReviewPlugin {
  /** Abre o fluxo de avaliação DENTRO do app (Play In-App Review). A cota é do Google: pode não aparecer; resolve ao fim do fluxo. */
  requestReview(): Promise<void>;
  /** Abre a ficha do app na Play (market://, senão https). */
  openStore(): Promise<void>;
}

export const SoulmonReview = registerPlugin<SoulmonReviewPlugin>('SoulmonReview', {
  web: {
    async requestReview() {},
    async openStore() { window.open('https://play.google.com/store/apps/details?id=com.soulmon', '_blank', 'noopener'); },
  },
});
