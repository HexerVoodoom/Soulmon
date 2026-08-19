/**
 * BRINCAR — o cartão da OFERTA.
 *
 * Apresentação PURA de `utils/petNeeds.ts` (seção 1): recebe tudo por props,
 * não lê GameState, não toca localStorage, não decide nada. Quem chama `play()`
 * e persiste é o App.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ISTO É UMA OFERTA. NUNCA UMA COBRANÇA.
 * ───────────────────────────────────────────────────────────────────────────
 * O que esta tela **não pode** ganhar, em nenhuma rodada futura:
 *
 *   · **barra de diversão** — nem cheia, nem vazia, nem em nenhuma cor. Medidor
 *     que sobe e desce sozinho com o tempo é cobrança desacoplada da vida real,
 *     e é exatamente o que a regra de ouro de `petNeeds.ts` proíbe. Aqui o
 *     único medidor é o do BUFF que a pessoa já ganhou — um prêmio escoando,
 *     não uma necessidade enchendo;
 *   · **contador regressivo para brincar de novo** ("volte em 6h14"). Isso é o
 *     desenho que transforma oferta em compromisso agendado;
 *   · **alerta, ponto vermelho ou badge** por não ter brincado. `canPlay ===
 *     false` não é falha: é a oferta simplesmente não estar de pé agora.
 *
 * Já brincou hoje → uma frase carinhosa e mais nada. Quem não brincou não
 * perdeu absolutamente nada (petNeeds.ts: brincar nunca entra em dia perfeito,
 * HP ou evolução).
 *
 * O CUSTO E O PRÊMIO APARECEM ANTES DO CLIQUE, sempre: 1 de energia, +20% de
 * Bits no próximo minijogo. Ninguém deve descobrir o preço depois de pagar.
 */
import type { CSSProperties } from 'react';
import {
  PLAY_BUFF_MULTIPLIER,
  PLAY_ENERGY_COST,
  type PlayAttribute,
  type PlayBuff,
} from '../utils/petNeeds';
import type { Language } from '../utils/i18n';
import { PixelButton, PixelPanel, PixelTag } from './pixel/PixelKit';

export interface PlayCardProps {
  /** `canPlay(state, todayKey)`. `false` NÃO é erro e não vira aviso. */
  canPlay: boolean;
  /** `playedToday(state, todayKey)`. */
  playedToday: boolean;
  /** `activeBuff(state, now)` — buff válido, ou `null`. */
  buff: PlayBuff | null;
  language: Language;
  /** Instante de referência do tempo restante do buff. Entra por props. */
  now?: Date;
  onPlay: () => void;
}

const ATTRIBUTE_LABEL: Record<PlayAttribute, { en: string; pt: string }> = {
  virus: { en: 'Virus', pt: 'Vírus' },
  data: { en: 'Data', pt: 'Dado' },
  vaccine: { en: 'Vaccine', pt: 'Vacina' },
};

const mutedLine: CSSProperties = {
  fontSize: '0.76rem',
  color: 'var(--sm-muted)',
  lineHeight: 1.45,
  margin: 0,
};

/** Minutos restantes do buff, arredondados para cima. Nunca negativo. */
function minutesLeft(buff: PlayBuff, now: Date): number {
  const at = new Date(buff.expiresAt).getTime();
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.ceil((at - now.getTime()) / 60000));
}

export function PlayCard({
  canPlay, playedToday, buff, language, now = new Date(), onPlay,
}: PlayCardProps) {
  const isPt = language === 'pt-BR';
  const bonusPct = Math.round((PLAY_BUFF_MULTIPLIER - 1) * 100);

  // Buff ativo: um prêmio que a pessoa TEM, com o tempo que resta. Não é um
  // relógio de obrigação — quando ele acabar, nada de ruim acontece.
  const buffBlock = buff ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
      <PixelTag filled>
        {isPt ? `+${bonusPct}% de Bits` : `+${bonusPct}% Bits`}
      </PixelTag>
      <span style={mutedLine}>
        {isPt
          ? `no próximo minijogo · ${minutesLeft(buff, now)} min · ${ATTRIBUTE_LABEL[buff.attribute].pt}`
          : `on your next minigame · ${minutesLeft(buff, now)} min · ${ATTRIBUTE_LABEL[buff.attribute].en}`}
      </span>
    </div>
  ) : null;

  // ── Já brincou hoje: carinho, e ponto final ────────────────────────────
  if (playedToday) {
    return (
      <PixelPanel title={isPt ? 'BRINCAR' : 'PLAY'}>
        {buffBlock}
        <p style={{ fontSize: '0.86rem', color: 'var(--sm-ink)', lineHeight: 1.5, margin: 0 }}>
          {isPt ? 'Já brincamos hoje!' : 'We already played today!'}
        </p>
        <p style={{ ...mutedLine, marginTop: 4 }}>
          {isPt
            ? 'Seu Soulmon ficou feliz da vida. Amanhã tem mais, se você quiser.'
            : 'Your Soulmon had a great time. There will be more tomorrow, if you feel like it.'}
        </p>
      </PixelPanel>
    );
  }

  // ── A oferta ───────────────────────────────────────────────────────────
  return (
    <PixelPanel title={isPt ? 'BRINCAR' : 'PLAY'}>
      {buffBlock}

      <p style={{ fontSize: '0.86rem', color: 'var(--sm-ink)', lineHeight: 1.5, margin: '0 0 6px' }}>
        {isPt ? 'Vamos brincar um pouquinho?' : 'Want to play for a bit?'}
      </p>

      {/* Custo e prêmio, honestos, ANTES do clique. */}
      <p style={{ ...mutedLine, marginBottom: 10 }}>
        {isPt
          ? `Custa ${PLAY_ENERGY_COST} de energia e dá +${bonusPct}% de Bits no próximo minijogo, mais um ponto de atributo.`
          : `Costs ${PLAY_ENERGY_COST} energy and grants +${bonusPct}% Bits on your next minigame, plus one attribute point.`}
      </p>

      {canPlay ? (
        <PixelButton size="lg" variant="primary" onClick={onPlay}>
          {isPt ? 'Brincar' : 'Play'}
        </PixelButton>
      ) : (
        // Sem energia. Frase NEUTRA — sem alerta, sem cor de erro, sem
        // "você precisa": a energia vem de comer, e comida vem de concluir
        // tarefa. Cobrar aqui seria cobrar tarefa por tabela.
        <p style={mutedLine}>
          {isPt
            ? `Brincar pede ${PLAY_ENERGY_COST} de energia — dá pra deixar pra depois de uma comidinha.`
            : `Playing takes ${PLAY_ENERGY_COST} energy — it can wait until after a snack.`}
        </p>
      )}
    </PixelPanel>
  );
}

export default PlayCard;
