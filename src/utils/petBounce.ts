/**
 * Curva do "bouncing" do pet — pura, sem DOM. Nasceu da respiração da Home
 * (`CompanionHUD`: `scaleY` 0,97 ↔ 1,0, origem nos pés, 1,5 s por meio-ciclo) e
 * serve a Corrida com obstáculos (`DinoGame`): a mesma criatura, agora correndo.
 *
 * Tudo sai como pose `{ sx, sy, dy, rot }` aplicada com origem nos PÉS. Teto de
 * deformação ±8% (`MAX_SQUASH`); em movimento reduzido o teto cai a ±2% e não há
 * inclinação nem salto vertical. Nada aqui toca em regra, pontuação ou tempo.
 */
export interface PetPose {
  /** Escala horizontal (1 = sem deformar). */
  sx: number;
  /** Escala vertical (1 = sem deformar). */
  sy: number;
  /** Deslocamento vertical em px (negativo = sobe), inteiro — a grade fica nítida. */
  dy: number;
  /** Inclinação em radianos (positivo = para a frente, sentido da corrida). */
  rot: number;
}

export const MAX_SQUASH = 0.08;
export const REDUCED_SQUASH = 0.02;

const clampTo = (v: number, lim: number) => Math.max(1 - lim, Math.min(1 + lim, v));

/** Idle: a respiração da Home, suavizada (0,97 ↔ 1,0, período de 3 s). */
export function idlePose(t: number, reduced = false): PetPose {
  const period = reduced ? 5.2 : 3;
  const sy = 0.985 + 0.015 * Math.cos((2 * Math.PI * t) / period);
  return { sx: 1, sy: reduced ? clampTo(sy, REDUCED_SQUASH) : sy, dy: 0, rot: 0 };
}

/** Passadas por segundo: acompanha a velocidade do chão, com teto para não vibrar. */
export function strideHz(speed: number): number {
  return Math.min(5.5, Math.max(3.2, speed / 70));
}

export interface RunInput {
  /** Segundos desde o início da corrida. */
  t: number;
  /** Velocidade do chão (px/s). */
  speed: number;
  /** Altura do pulo em px (0 = no chão). */
  h: number;
  /** Velocidade vertical do pulo (px/s, positivo = subindo). */
  vy: number;
  /** Segundos desde o último pouso (grande = nenhum recente). */
  sinceLand: number;
  reduced?: boolean;
}

export const LAND_MS = 140;
const JUMP_VY = 660;

/** Pose da corrida: quique da passada no chão, estica no ar, achata no pouso. */
export function runPose({ t, speed, h, vy, sinceLand, reduced = false }: RunInput): PetPose {
  const lim = reduced ? REDUCED_SQUASH : MAX_SQUASH;
  if (h > 0 || vy > 0) {
    // Impulso/subida estica (até +6% em Y, −3% em X); a descida relaxa.
    const k = Math.max(-0.4, Math.min(1, vy / JUMP_VY));
    const stretch = 0.06 * Math.max(0, k) + 0.02 * Math.max(0, -k);
    return { sx: clampTo(1 - stretch / 2, lim), sy: clampTo(1 + stretch, lim), dy: 0, rot: reduced ? 0 : 0.05 * k };
  }
  const landing = sinceLand * 1000 < LAND_MS ? 1 - (sinceLand * 1000) / LAND_MS : 0;
  const ph = 2 * Math.PI * strideHz(speed) * t;
  const bump = Math.abs(Math.sin(ph / 2));      // 0..1, um quique por passada
  const sy = 1 + 0.035 * (0.5 - bump) - 0.05 * landing;
  const sx = 1 - 0.015 * (0.5 - bump) + 0.04 * landing;
  return {
    sx: clampTo(sx, lim),
    sy: clampTo(sy, lim),
    dy: reduced ? 0 : -Math.round(bump * 2),
    rot: reduced ? 0 : 0.035 + 0.015 * Math.sin(ph),
  };
}
