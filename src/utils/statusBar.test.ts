// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyStatusBarTheme, STATUS_BAR_BG } from './statusBar';

describe('statusBar', () => {
  it('cores = --sm-bg de cada tema no index.css', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(new RegExp(`--sm-bg: ${STATUS_BAR_BG.light};`));
    expect(css).toMatch(new RegExp(`--sm-bg: ${STATUS_BAR_BG.dark};`));
  });
  it('deixa UMA meta theme-color sem media, com a cor do tema', () => {
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#0f766e"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#071413">';
    applyStatusBarTheme('dark');
    applyStatusBarTheme('light');
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute('media')).toBeNull();
    expect(metas[0].getAttribute('content')).toBe(STATUS_BAR_BG.light);
  });
});
