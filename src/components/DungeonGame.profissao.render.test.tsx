// @vitest-environment jsdom
/**
 * PROFISSÃO → jeito na masmorra, o lado da TELA (Fase 3 do Oráculo). O lobby
 * nomeia o ofício (PT do snapshot / EN de `PROFISSAO_EN`) e diz o jeito em voz
 * de mundo; sem profissão, a linha não existe. O número fica na run
 * (`utils/profissaoMasmorra.ts` é quem o tem; `manifestacao.test.ts` o trava).
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';

function montar(language: 'pt-BR' | 'en-US', profissao?: string) {
  return renderWithCss(
    <DungeonGame
      evolutionStage="rookie"
      language={language}
      profissao={profissao}
      profissaoNome={profissao ? { pt: 'Ferreiro', en: 'Blacksmith' } : undefined}
      onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={() => {}}
      onHeartDrop={() => false}
      onGlitchtama={() => {}}
      onEnemyDefeated={() => {}}
      onEarnPoints={() => {}}
      onExit={() => {}}
    />,
  );
}

describe('o ofício no lobby da fenda', () => {
  it('PT: "Ofício Ferreiro — aguenta mais pancada"', () => {
    montar('pt-BR', 'ferreiro');
    const linha = document.querySelector('[data-profissao="ferreiro"]');
    expect(linha).not.toBeNull();
    expect(linha!.textContent).toContain('Ofício Ferreiro');
    expect(linha!.textContent).toContain('Aguenta mais pancada.');
  });

  it('EN: nome traduzido e frase EN, nunca o PT', () => {
    montar('en-US', 'ferreiro');
    const linha = document.querySelector('[data-profissao="ferreiro"]')!;
    expect(linha.textContent).toContain('Blacksmith craft');
    expect(linha.textContent).toContain('Takes more hits.');
    expect(linha.textContent).not.toContain('Ferreiro');
  });

  it('sem profissão (save legado, demo), nada — a masmorra de sempre', () => {
    montar('pt-BR');
    expect(document.querySelector('[data-profissao]')).toBeNull();
    expect(document.body.textContent).not.toContain('Ofício');
  });
});
