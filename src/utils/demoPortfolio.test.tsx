// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readyFor, INERT_READY, pickPresentation, PRESENTATION_IDLE } from './presentationQueue';
import { keepDemoVitalsFull } from './demoStart';
import { HUNGER_MAX } from './hunger';
import { DemoSoundButton } from '../components/perfil/DemoSoundButton';
import { dinoPetMirrored } from '../components/DinoGame';

describe('demo portfólio', () => {
  it('fila inerte na demo: nada entra sozinho', () => {
    const ready = { dailyReport: true, dayGoals: true, welcomeTour: true };
    expect(pickPresentation(readyFor(true, ready), PRESENTATION_IDLE, new Set())).toBe(PRESENTATION_IDLE);
    expect(readyFor(true, ready)).toBe(INERT_READY);
    expect(readyFor(false, ready)).toBe(ready);
  });
  it('vida/energia/fome cheias, mesma referência se já cheio', () => {
    const s: { healthPoints: number; maxHealthPoints: number; energyPoints: number; evolutionStage: string; hunger?: { v: number; at: number } } = { healthPoints: 1, maxHealthPoints: 3, energyPoints: 0, evolutionStage: 'rookie' };
    const f = keepDemoVitalsFull(s, 1000);
    expect(f.healthPoints).toBe(3);
    expect(f.energyPoints).toBeGreaterThan(0);
    expect(f.hunger?.v).toBe(HUNGER_MAX);
    expect(keepDemoVitalsFull(f, 1000)).toBe(f);
  });
  it('botão de som alterna, alvo 44, aria PT/EN', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<DemoSoundButton muted={false} language="en-US" onToggle={onToggle} />);
    const b = screen.getByRole('button', { name: 'Turn sound off' });
    expect(b.style.width).toBe('44px');
    fireEvent.click(b);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(<DemoSoundButton muted language="pt-BR" onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Ligar o som' })).toBeTruthy();
  });
  it('DinoGame espelha só arte de perfil esquerdo (corvo); o Bolid novo olha à direita (20/10/2026)', () => {
    expect(dinoPetMirrored('rookie', 'corvo')).toBe(true);
    expect(dinoPetMirrored('rookie', 'nascente')).toBe(false);
    expect(dinoPetMirrored('rookie', 'meteoro')).toBe(false);
  });
});
