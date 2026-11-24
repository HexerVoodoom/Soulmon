// @vitest-environment jsdom
/**
 * REGRESSÃO (24/11/2026, hotfix): o aviso do Fundador ABRIA mas o ✕ e o "Fechar" não faziam nada. Causa: o popup ia direto ao <body>
 * (portal `sobreTelas`) e abria POR CIMA de outro modal da fila; o `useDialogA11y` do outro modal inertiza os irmãos do <body> (o portal
 * inclusive), então o toque no ✕/Fechar morria. Correção: o aviso é item `fundador` da fila central (um modal por vez).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { FundadorAvisoModal } from './FundadorAvisoModal';
import { ModalSheet } from './form/FormKit';
import { pickPresentation } from '../utils/presentationQueue';
import { concederFundador, fundadorPendentes, marcarFundadorAvisados, type FundadorEstado } from '../utils/fundador';

installDomGlobals();
afterEach(cleanup);

/** Mesma ligação do App: pronto = pendentes; fila decide quem aparece; fechar grava `fundadorAvisados`. */
function Harness({ outroAberto, onEstado }: { outroAberto: boolean; onEstado: (s: FundadorEstado) => void }) {
  const [s, setS] = useState<FundadorEstado>(() => concederFundador({ evolutionStage: 'rookie' } as FundadorEstado));
  const [outro, setOutro] = useState(outroAberto);
  const pend = fundadorPendentes(s);
  const vez = pickPresentation({ checkIn: outro, fundador: pend.length > 0 });
  const fechar = () => setS(prev => { const n = marcarFundadorAvisados(prev, fundadorPendentes(prev)); onEstado(n); return n; });
  return (
    <div>
      {vez === 'checkIn' && <ModalSheet open title="Hoje" language="pt-BR" onClose={() => setOutro(false)} placement="center"><p>outro modal</p></ModalSheet>}
      {vez === 'fundador' && <FundadorAvisoModal language="pt-BR" premios={pend} dias={0} onClose={fechar} onEquip={fechar} />}
    </div>
  );
}

const botaoX = () => document.querySelector<HTMLButtonElement>('.sm2-popup-fechar')!;

describe('aviso do Fundador fecha de verdade', () => {
  for (const [nome, achar] of [['✕', botaoX], ['Fechar', () => document.querySelector<HTMLButtonElement>('[data-fundador-close]')!]] as const) {
    it(`${nome} fecha, grava os avisados e não reabre`, () => {
      let ultimo: FundadorEstado | undefined;
      render(<Harness outroAberto={false} onEstado={s => { ultimo = s; }} />);
      expect(document.querySelector('[data-fundador-aviso]')).not.toBeNull();
      fireEvent.click(achar());
      expect(document.querySelector('[data-fundador-aviso]')).toBeNull();
      expect(ultimo?.fundadorAvisados?.length).toBe(4);
      expect(fundadorPendentes(ultimo!)).toEqual([]);
    });
  }
  it('com outro modal na vez: o Fundador espera (nunca empilha, nunca fica inerte) e fecha depois', () => {
    render(<Harness outroAberto onEstado={() => {}} />);
    expect(document.querySelector('[data-fundador-aviso]')).toBeNull();
    fireEvent.click(document.querySelector<HTMLButtonElement>('.sm2-popup-fechar, [aria-label="Fechar"]')!);
    const aviso = document.querySelector('[data-fundador-aviso]');
    expect(aviso).not.toBeNull();
    let el: HTMLElement | null = aviso as HTMLElement;
    while (el) { expect(el.hasAttribute('inert')).toBe(false); el = el.parentElement; }
    fireEvent.click(botaoX());
    expect(document.querySelector('[data-fundador-aviso]')).toBeNull();
  });
});
