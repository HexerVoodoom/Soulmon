// @vitest-environment jsdom
/**
 * WP1.1 — o reveal com cerimônia de espera.
 *
 * O momento mais importante do app acontecia SEM a criatura: nome, descrição
 * e nenhuma imagem. O desenho só chegava depois, já dentro do jogo — ou seja,
 * a tela que existe para apresentar a criatura era a única que não a mostrava.
 *
 * O teste tem duas metades, e a segunda é a que protege o usuário: a espera é
 * cerimônia enquanto tem FIM. Geração lenta ou falha não pode virar tela
 * travada no primeiro minuto de uso de alguém.
 */
import { describe, it, expect } from 'vitest';
import { REVEAL_WAIT_MS } from './SoulmonOnboarding';
import { revealDurationBucket } from '../utils/telemetry';

describe('WP1.1 — a espera do reveal tem fim anunciado', () => {
  it('o teto existe e é da ordem de segundos, não de minutos', () => {
    // Sem teto, a "cerimônia" é uma tela travada. Com teto grande demais, é a
    // mesma coisa com outro nome.
    expect(REVEAL_WAIT_MS).toBeGreaterThan(3_000);
    expect(REVEAL_WAIT_MS).toBeLessThanOrEqual(20_000);
  });

  it('a espera cabe dentro das faixas de `duration` que o evento sabe medir', () => {
    // Se o teto passasse da última faixa, todo reveal cairia no mesmo balde e
    // a métrica que justifica a cerimônia não distinguiria nada.
    expect(revealDurationBucket(REVEAL_WAIT_MS / 1000)).toBeLessThanOrEqual(3);
    expect(revealDurationBucket(REVEAL_WAIT_MS / 1000)).toBeGreaterThanOrEqual(1);
  });
});
