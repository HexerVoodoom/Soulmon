// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConsentGate } from './ConsentGate';
import { buildConsentRecord, isConsentCurrent, PRIVACY_VERSION, TERMS_VERSION } from '../utils/consent';

afterEach(cleanup);

describe('ConsentGate (reaceite, REGISTRO §184)', () => {
  it('só libera "Aceitar" com a caixa marcada e mostra os dois links', () => {
    const onAccept = vi.fn();
    render(<ConsentGate language="pt-BR" onAccept={onAccept} />);
    const btn = screen.getByRole('button', { name: 'Aceitar e continuar' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onAccept).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(btn);
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[href="/termos.html#pt"]')).not.toBeNull();
    expect(document.querySelector('a[href="/privacidade.html#pt"]')).not.toBeNull();
  });
  it('em EN aponta para as âncoras em inglês', () => {
    render(<ConsentGate language="en-US" onAccept={() => {}} />);
    expect(document.querySelector('a[href="/termos.html"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Accept and continue' })).toBeTruthy();
  });
});

describe('o gate do App', () => {
  it('registro antigo ou ausente = gate; o registro gravado pelo aceite é vigente', () => {
    expect(isConsentCurrent(undefined)).toBe(false);
    expect(isConsentCurrent({ acceptedAt: 'x', termsVersion: TERMS_VERSION, privacyVersion: '2026-10-26' })).toBe(false);
    const r = buildConsentRecord(new Date('2026-10-28T12:00:00Z'));
    expect(isConsentCurrent(r)).toBe(true);
    expect(r.privacyVersion).toBe(PRIVACY_VERSION);
    expect(PRIVACY_VERSION).toBe('2026-10-28');
  });
});
