import { describe, it, expect } from 'vitest';
import { detectMessageCategory } from './chatKeywords';

describe('detectMessageCategory', () => {
  it('detects greeting', () => {
    expect(detectMessageCategory('hi there')).toBe('greeting');
    expect(detectMessageCategory('hello!')).toBe('greeting');
    expect(detectMessageCategory('Hey!')).toBe('greeting');
    expect(detectMessageCategory('hola')).toBe('greeting');
  });

  it('detects farewell', () => {
    expect(detectMessageCategory('bye')).toBe('farewell');
    expect(detectMessageCategory('goodbye')).toBe('farewell');
    expect(detectMessageCategory('cya later')).toBe('farewell');
  });

  it('detects feeling inquiry', () => {
    // Feeling pattern: how|are|you|doing|feeling|feel
    expect(detectMessageCategory('how are you doing')).toBe('feeling');
    expect(detectMessageCategory('you good')).toBe('feeling');
    // Note: many messages with 'you' or 'are' will match 'feeling' before other categories
    expect(detectMessageCategory('doing alright?')).toBe('feeling');
  });

  it('detects encouragement (no feeling-pattern words)', () => {
    expect(detectMessageCategory("let's go")).toBe('encouragement');
    expect(detectMessageCategory('come on')).toBe('encouragement');
    expect(detectMessageCategory('strength and power')).toBe('encouragement');
  });

  it('detects compliment (no feeling-pattern words)', () => {
    expect(detectMessageCategory('that is awesome')).toBe('compliment');
    expect(detectMessageCategory('so cute')).toBe('compliment');
    expect(detectMessageCategory('amazing work')).toBe('compliment');
  });

  it('detects affection (no feeling-pattern words)', () => {
    expect(detectMessageCategory('I love this')).toBe('affection');
    expect(detectMessageCategory('my dear')).toBe('affection');
    expect(detectMessageCategory('I adore it')).toBe('affection');
  });

  it('detects food/energy keywords (no feeling-pattern words)', () => {
    expect(detectMessageCategory('I am hungry')).toBe('food');
    expect(detectMessageCategory('need to eat')).toBe('food');
    expect(detectMessageCategory('I am weak')).toBe('food');
  });

  it('detects evolution (no feeling-pattern words)', () => {
    expect(detectMessageCategory('time to evolve')).toBe('evolution');
    expect(detectMessageCategory('next level up')).toBe('evolution');
    expect(detectMessageCategory('digivolve now')).toBe('evolution');
  });

  it('detects name inquiry (no feeling-pattern words)', () => {
    expect(detectMessageCategory('what is my name')).toBe('name');
    expect(detectMessageCategory('what is this called')).toBe('name');
    expect(detectMessageCategory('tell me who this is')).toBe('name');
  });

  it('detects task/activity keywords (no feeling-pattern words)', () => {
    expect(detectMessageCategory('let us work')).toBe('task');
    expect(detectMessageCategory('my mission today')).toBe('task');
    expect(detectMessageCategory('set a goal')).toBe('task');
  });

  it('detects time references (no feeling-pattern words)', () => {
    expect(detectMessageCategory('good morning')).toBe('time');
    expect(detectMessageCategory('good night')).toBe('time');
    expect(detectMessageCategory('this afternoon')).toBe('time');
  });

  it('detects help requests', () => {
    expect(detectMessageCategory('I need help')).toBe('help');
    expect(detectMessageCategory('this is difficult')).toBe('help');
    expect(detectMessageCategory('I have a problem')).toBe('help');
  });

  it('detects sadness (no feeling-pattern words)', () => {
    expect(detectMessageCategory('I am sad')).toBe('sad');
    expect(detectMessageCategory('so upset')).toBe('sad');
    expect(detectMessageCategory('I am depressed')).toBe('sad');
  });

  it('detects happiness (no feeling-pattern words)', () => {
    expect(detectMessageCategory('I am happy')).toBe('happy');
    expect(detectMessageCategory('so excited')).toBe('happy');
    expect(detectMessageCategory('so glad')).toBe('happy');
  });

  it('detects yes responses (exact match)', () => {
    expect(detectMessageCategory('yes')).toBe('yes');
    expect(detectMessageCategory('yeah')).toBe('yes');
    expect(detectMessageCategory('ok')).toBe('yes');
    expect(detectMessageCategory('okay')).toBe('yes');
    // should NOT match if not exact
    expect(detectMessageCategory('yes please')).not.toBe('yes');
  });

  it('detects no responses (exact match)', () => {
    expect(detectMessageCategory('no')).toBe('no');
    expect(detectMessageCategory('nope')).toBe('no');
    expect(detectMessageCategory('nah')).toBe('no');
    // should NOT match if not exact
    expect(detectMessageCategory('no thanks')).not.toBe('no');
  });

  it('detects question (ends with ?, no feeling-pattern words)', () => {
    expect(detectMessageCategory('is this correct?')).toBe('question');
    expect(detectMessageCategory('really?')).toBe('question');
    expect(detectMessageCategory('what about that?')).toBe('question');
  });

  it('returns null for unrecognized messages', () => {
    expect(detectMessageCategory('blah blah blah')).toBeNull();
    expect(detectMessageCategory('xyz')).toBeNull();
    expect(detectMessageCategory('')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectMessageCategory('HELLO')).toBe('greeting');
    expect(detectMessageCategory('BYE')).toBe('farewell');
    expect(detectMessageCategory('SAD')).toBe('sad');
  });

  it('feeling pattern takes priority over later patterns when words overlap', () => {
    // 'you' and 'are' are in the feeling regex, so these match 'feeling' before other checks
    expect(detectMessageCategory('I love you')).toBe('feeling');   // 'you' matches feeling
    expect(detectMessageCategory('who are you')).toBe('feeling');  // 'are'+'you' match feeling
    expect(detectMessageCategory('feeling down')).toBe('feeling'); // 'feeling' matches before 'sad'
    expect(detectMessageCategory('I feel sad')).toBe('feeling');   // 'feel' matches before 'sad'
  });
});
