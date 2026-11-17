import { describe, it, expect } from 'vitest';
import { registrarRestauracao, registrarStatusDaNuvem, textoDiagnosticoLogin } from './loginDiag';

describe('diagnóstico visível do login', () => {
  it('mostra restauração, HTTP e 6 chars do saveId, sem e-mail', () => {
    registrarRestauracao('nao-chamada', 'abcdef123456');
    registrarStatusDaNuvem(401);
    registrarRestauracao('indeterminado');
    const t = textoDiagnosticoLogin();
    expect(t).toContain('rest=indeterminado');
    expect(t).toContain('http=401');
    expect(t).toContain('id=abcdef');
    expect(t).not.toContain('123456');
    expect(t).toMatch(/\| web \|/);
  });
});
