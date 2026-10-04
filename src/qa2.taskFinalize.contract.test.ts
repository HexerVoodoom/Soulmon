/**
 * QA2 (04/10/2026) — a conclusão da tarefa avulsa (3 s depois do toque) não pode
 * depender de um `setTimeout` solto: fechar o app nesse intervalo deixava a
 * tarefa marcada sem pagar comida/Vínculo. O comportamento do adiamento está em
 * `hooks/useDeferredFlush.test.tsx`; aqui só se trava que o `App` o usa.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('handleToggleTask usa o adiamento que sobrevive à página', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  const ini = app.indexOf('const handleToggleTask = ');
  const corpo = app.slice(ini, app.indexOf('const announceTaskGains', ini));

  it('não há setTimeout cru no handler', () => {
    expect(corpo).not.toMatch(/setTimeout\(/);
    expect(corpo).toMatch(/adiarConclusaoDeTarefa\(\(\) => \{/);
  });

  it('o hook é o de 3000 ms', () => {
    expect(app).toMatch(/const adiarConclusaoDeTarefa = useDeferredFlush\(3000\)/);
  });
});
