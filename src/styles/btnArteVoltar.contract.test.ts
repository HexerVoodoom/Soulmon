/** Grupo B (fase 4): o voltar (BackCircleButton, seta) leva a arte `sm2-voltar` só sob `html[data-ui="arte"]`; o voltar "mapa" fica de fora; o glifo continua no DOM. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const comp = readFileSync(resolve(process.cwd(), 'src/components/ui/BackCircleButton.tsx'), 'utf8');
// O bloco B termina onde começa o bloco C (fechar ✕, `btnArteFechar.contract.test.ts`), que tem as suas próprias `url(`.
const fimB = css.indexOf('Grupo C (fase 4)') > -1 ? css.indexOf('Grupo C (fase 4)') : css.indexOf('Drop-down de categoria do CreateModal');
const bloco = css.slice(css.indexOf('Grupo B (fase 4)'), fimB);

describe('arte no voltar', () => {
  it('as variáveis da arte (normal e pressed) ficam num lugar só e as regras só valem para a seta, sob html[data-ui="arte"]', () => {
    expect(bloco).toContain("--sm2-voltar-arte: url('./assets/soulmon/ui/sm2/sm2-voltar.webp')");
    expect(bloco).toContain("--sm2-voltar-press: url('./assets/soulmon/ui/sm2/sm2-voltar-press.webp')");
    expect(bloco.match(/url\(/g)).toHaveLength(2);
    for (const l of bloco.split('\n').filter(x => /^\S.*\{\s*$|^\S.*\{.*\}\s*$/.test(x) && !x.startsWith('/*') && !x.startsWith('   '))) expect(l.startsWith('html[data-ui="arte"]')).toBe(true);
    expect(bloco).toContain('[data-back-icon="arrow_back"]:active:not(:disabled)');
  });
  it('o componente marca o ícone e mantém aria-label e o glifo no DOM (só some da vista)', () => {
    expect(comp).toContain('data-back-icon={icon}');
    expect(comp).toContain('aria-label={name}');
    expect(bloco).toContain('> * { opacity: 0; }');
    expect(bloco).not.toMatch(/display: none/);
  });
});
