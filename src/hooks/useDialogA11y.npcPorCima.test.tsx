// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';
import { useDialogA11y } from './useDialogA11y';

function Dlg({ npc }: { npc?: boolean }) {
  const ref = useDialogA11y<HTMLDivElement>(true, () => {});
  return <div ref={ref} role="dialog" aria-modal="true" {...(npc ? { 'data-npc-sequence': '' } : {})}><button>ok</button></div>;
}

describe('a fala do NPC nunca vira inerte por um diálogo que monta depois', () => {
  it('folha montada depois da fala não inertiza a fala', () => {
    const { container, rerender } = render(<div><div id="npc"><Dlg npc /></div></div>);
    rerender(<div><div id="npc"><Dlg npc /></div><div id="sheet"><Dlg /></div></div>);
    const npc = container.querySelector('#npc') as HTMLElement & { inert?: boolean };
    expect(npc.hasAttribute('data-sm2-inert')).toBe(false);
    expect(npc.inert).toBeFalsy();
    expect(npc.getAttribute('aria-hidden')).toBeNull();
  });
});
