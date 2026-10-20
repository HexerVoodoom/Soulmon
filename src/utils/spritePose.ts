/**
 * POSE DO SPRITE (11/10/2026, `beta-play-01`): para onde o Soulmon olha e se ele
 * está no chão ou no ar. DONO ÚNICO — tipo, sanitização, escrita, matemática do
 * espelho e a frase de direção do prompt de geração.
 *
 * Duas preferências do JOGADOR, não do bicho (nenhuma regra de jogo as lê):
 *  · `flipX`    — espelha o sprite no eixo X. Existe porque a arte GERADA nem sempre
 *                 sai virada para o lado que o app espera (a "frente" é a DIREITA —
 *                 ver `SPRITE_FACING_PROMPT`), e o bicho parecia andar de costas.
 *  · `altitude` — 'ground' (pés na linha do chão) ou 'air' (eleva o sprite, a sombra
 *                 fica no chão e o corpo flutua de leve; movimento reduzido: parado).
 *
 * ESCRITA: só `applySpritePose`. A tela de Configurações e a conversa com o
 * Soulmon (ações `flip_soulmon` / `fly` / `land`) passam por ela; ninguém faz
 * `setGameState(... spritePose ...)` por fora. Quem a conecta ao estado é o
 * `GameStateProvider` (`registerSpritePoseWriter`).
 *
 * ONDE VALE (decisão): home (`CompanionHUD`) e overlay do desktop. Combate NÃO —
 * o palco da luta fixa os lados (eu à esquerda, inimigo espelhado) e inverter só
 * o meu bicho o faria encarar para FORA do inimigo; a luta continua usando a
 * orientação da arte. Altitude também fica de fora do combate.
 */

export type SpriteAltitude = 'ground' | 'air';
export type SpritePose = { flipX: boolean; altitude: 'ground' | 'air' };

export const DEFAULT_SPRITE_POSE: Readonly<SpritePose> = Object.freeze({ flipX: false, altitude: 'ground' });

/**
 * A frase de DIREÇÃO do prompt de geração (`composeSpritePrompt`, oracle/motor.ts).
 * O app desenha toda arte "olhando para a DIREITA" e espelha ao andar para a
 * esquerda — então o gerador tem que entregar o bicho virado à direita, em 3/4 (diagonal
 * para o observador, 20/10/2026), nunca de perfil puro e nunca olhando para a esquerda.
 * Travada por teste: mudar aqui sem mudar a regra do render (ou vice-versa) é o
 * defeito "anda de costas".
 */
export const SPRITE_FACING_PROMPT =
  'Three-quarter view, body angled slightly toward the viewer on a diagonal (not a pure side profile), the creature still faces RIGHT, never facing left.';

/** Quanto o sprite sobe no ar, em px de tela (o palco tem 250 de altura). */
export const AIR_LIFT_PX = 22;

/** Lixo → padrão; nunca lança. Aceita só `true` / `'air'` literais. */
export function sanitizeSpritePose(raw: unknown): SpritePose {
  const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    flipX: o.flipX === true,
    altitude: o.altitude === 'air' ? 'air' : 'ground',
  };
}

/**
 * Espelha o desenho? O sprite é mostrado olhando para onde o BICHO ANDA:
 * `andaEsquerda` (direção do passeio) × `arteOlhaEsquerda` (como a arte nasceu) ×
 * `flipX` (a preferência do jogador, que inverte a "frente" da arte).
 */
export function mirrorSprite(andaEsquerda: boolean, arteOlhaEsquerda: boolean, flipX: boolean): boolean {
  const olhaEsquerda = arteOlhaEsquerda !== flipX; // flipX troca o lado para onde a arte olha
  return andaEsquerda !== olhaEsquerda;
}

// ── escrita ─────────────────────────────────────────────────────────────────

type Writer = (patch: Partial<SpritePose>) => void;
let writer: Writer | null = null;

/** O provider liga o estado aqui; devolve o desfazer (cleanup do efeito). */
export function registerSpritePoseWriter(w: Writer): () => void {
  writer = w;
  return () => { if (writer === w) writer = null; };
}

/**
 * ÚNICO dono de escrita da pose. Aceita parcial; valor inválido é ignorado
 * (não derruba nem grava lixo). Devolve o patch efetivamente aplicado, ou
 * `null` se nada válido veio ou o estado ainda não está montado.
 */
export function applySpritePose(patch: Partial<SpritePose>): Partial<SpritePose> | null {
  const clean: Partial<SpritePose> = {};
  if (patch && typeof patch === 'object') {
    if (typeof patch.flipX === 'boolean') clean.flipX = patch.flipX;
    if (patch.altitude === 'ground' || patch.altitude === 'air') clean.altitude = patch.altitude;
  }
  if (Object.keys(clean).length === 0 || !writer) return null;
  writer(clean);
  return clean;
}

// ── leitura ─────────────────────────────────────────────────────────────────

type Reader = () => unknown;
let reader: Reader | null = null;

/** O provider liga a leitura do estado atual aqui; devolve o desfazer. */
export function registerSpritePoseReader(r: Reader): () => void {
  reader = r;
  return () => { if (reader === r) reader = null; };
}

/**
 * Pose ATUAL (sanitizada) — quem precisa alternar (`flip_soulmon` do chat) lê
 * aqui antes de chamar `applySpritePose`. Sem provider montado → padrão.
 */
export function getSpritePose(): SpritePose {
  return sanitizeSpritePose(reader ? reader() : undefined);
}

/** Fusão pura usada pelo writer do provider: `prev` pode ser lixo do save. */
export function mergeSpritePose(prev: unknown, patch: Partial<SpritePose>): SpritePose {
  return { ...sanitizeSpritePose(prev), ...patch };
}
