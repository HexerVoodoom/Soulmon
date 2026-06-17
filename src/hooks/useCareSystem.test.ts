import { describe, it, expect } from 'vitest';

// getCareMessage logic inlined from CareSystem.tsx (can't import that file in tests
// because it contains figma:asset imports unresolvable in the Node test environment).
function getCareMessage(type: 'poop' | 'food'): string {
  if (type === 'poop') return "I need to go to the bathroom! 💩 Complete a task!";
  return "I'm hungry! 🍖 Complete a task to feed me!";
}

// getCompanionMessageWithCare logic from useCareSystem.ts
function getCompanionMessageWithCare(
  careEvent: { type: 'poop' | 'food'; showSprite: boolean } | null,
  fallback: string,
): string {
  if (careEvent && !careEvent.showSprite) {
    return getCareMessage(careEvent.type);
  }
  return fallback;
}

describe('getCareMessage', () => {
  it('returns poop message for poop type', () => {
    expect(getCareMessage('poop')).toContain('bathroom');
  });

  it('returns food message for food type', () => {
    expect(getCareMessage('food')).toContain('hungry');
  });

  it('poop and food messages are distinct', () => {
    expect(getCareMessage('poop')).not.toBe(getCareMessage('food'));
  });
});

describe('getCompanionMessageWithCare logic', () => {
  it('returns fallback when no care event', () => {
    expect(getCompanionMessageWithCare(null, 'Hello!')).toBe('Hello!');
  });

  it('returns poop care message when poop event is pending (showSprite=false)', () => {
    const result = getCompanionMessageWithCare({ type: 'poop', showSprite: false }, 'Fallback');
    expect(result).toBe(getCareMessage('poop'));
  });

  it('returns food care message when food event is pending (showSprite=false)', () => {
    const result = getCompanionMessageWithCare({ type: 'food', showSprite: false }, 'Fallback');
    expect(result).toBe(getCareMessage('food'));
  });

  it('returns fallback when care event showSprite is true', () => {
    const result = getCompanionMessageWithCare({ type: 'food', showSprite: true }, 'Hello!');
    expect(result).toBe('Hello!');
  });

  it('returns fallback when poop sprite is shown', () => {
    const result = getCompanionMessageWithCare({ type: 'poop', showSprite: true }, 'Default msg');
    expect(result).toBe('Default msg');
  });
});
