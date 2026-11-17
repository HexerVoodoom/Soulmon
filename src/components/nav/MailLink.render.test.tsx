// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CornerLink } from './CornerLink';
import { MailLink } from './MailLink';

afterEach(cleanup);

describe('MailLink x CornerLink', () => {
  it('a carta tem o MESMO tamanho do Mapa: mesma escala, mesma origem, mesmo alvo de toque', () => {
    const { container } = render(<><CornerLink icon="mapa" side="right" label="Mapa" onClick={() => {}} /><MailLink unread={false} label="Cartas" unreadLabel="nova" onClick={() => {}} /></>);
    const mapa = container.querySelector('[data-corner-map-icon]') as HTMLElement;
    const carta = container.querySelector('[data-mail-icon]') as HTMLElement;
    expect(carta.style.transform).toBe(mapa.style.transform);
    expect(carta.style.transformOrigin).toBe(mapa.style.transformOrigin);
    const a = container.querySelector('[data-corner-link]') as HTMLElement;
    const b = container.querySelector('[data-mail-link]') as HTMLElement;
    expect(parseInt(b.style.width)).toBeGreaterThanOrEqual(44);
    expect(b.style.width).toBe(a.style.width);
    expect(b.style.right).toBe(a.style.right);
  });
});
