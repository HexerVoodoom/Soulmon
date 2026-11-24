// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HomeFeedbackButton } from './HomeFeedbackButton';
import { isFeedbackButtonVisible } from '../../utils/feedbackFlag';

describe('flag do besourinho de feedback', () => {
  it('padrão (beta): visível', () => {
    expect(isFeedbackButtonVisible({})).toBe(true);
    const { container } = render(<HomeFeedbackButton language="pt-BR" visible={isFeedbackButtonVisible({})} />);
    expect(container.querySelector('[data-home-feedback]')).not.toBeNull();
  });
  it('versão final (VITE_HIDE_FEEDBACK_BUTTON=1): oculto', () => {
    expect(isFeedbackButtonVisible({ VITE_HIDE_FEEDBACK_BUTTON: '1' })).toBe(false);
    expect(isFeedbackButtonVisible({ VITE_HIDE_FEEDBACK_BUTTON: 'true' })).toBe(false);
    expect(isFeedbackButtonVisible({ VITE_HIDE_FEEDBACK_BUTTON: '0' })).toBe(true);
    const { container } = render(<HomeFeedbackButton language="pt-BR" visible={isFeedbackButtonVisible({ VITE_HIDE_FEEDBACK_BUTTON: '1' })} />);
    expect(container.querySelector('[data-home-feedback]')).toBeNull();
    expect(container.innerHTML).toBe('');
  });
  it('sem a prop, usa o ambiente (testes rodam sem a variável: visível)', () => {
    const { container } = render(<HomeFeedbackButton language="pt-BR" />);
    expect(container.querySelector('[data-home-feedback]')).not.toBeNull();
  });
});
