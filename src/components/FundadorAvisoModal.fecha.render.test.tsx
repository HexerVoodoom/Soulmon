// @vitest-environment jsdom
/**
 * REGRESSÃO (24/11/2026, hotfix): o aviso do Fundador ABRIA mas o ✕ não faziam nada. Causa: o popup ia direto ao <body>
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
  const fechar = (id: string) => setS(prev => { const n = marcarFundadorAvisados(prev, [id]); onEstado(n); return n; });
  return (
    <div>
      {vez === 'checkIn' && <ModalSheet open title="Hoje" language="pt-BR" onClose={() => setOutro(false)} placement="center"><p>outro modal</p></ModalSheet>}
      {vez === 'fundador' && <FundadorAvisoModal key={pend[0]} language="pt-BR" premio={pend[0]} onClose={() => fechar(pend[0])} onEquip={fechar} />}
    </div>
  );
}

const botaoX = () => document.querySelector<HTMLButtonElement>('.sm2-popup-fechar')!;

const vistos = () => [...document.querySelectorAll('[data-fundador-aviso]')].map(e => e.getAttribute('data-fundador-aviso'));
const ORDEM = ['founder-fundo', 'founder-moldura', 'founder-retrato', 'furn-cristal-fundador'];

describe('aviso do Fundador: um modal por prêmio, em sequência, e fecha de verdade', () => {
  for (const [nome, achar] of [['✕', botaoX]] as const) {
    it(`${nome} fecha cada um, grava só aquele id, abre o próximo e no fim não reabre`, () => {
      let ultimo: FundadorEstado | undefined;
      render(<Harness outroAberto={false} onEstado={s => { ultimo = s; }} />);
      for (let i = 0; i < ORDEM.length; i++) {
        expect(vistos()).toEqual([ORDEM[i]]); // um por vez, na ordem
        fireEvent.click(achar());
        expect(ultimo?.fundadorAvisados).toEqual(ORDEM.slice(0, i + 1)); // aditivo: só o fechado
      }
      expect(vistos()).toEqual([]);
      expect(fundadorPendentes(ultimo!)).toEqual([]);
    });
  }
  it('só os pendentes: sem Fundo/Moldura pendentes, começa no Retrato', () => {
    const s0 = marcarFundadorAvisados(concederFundador({ evolutionStage: 'rookie' } as FundadorEstado), ['founder-fundo', 'founder-moldura']);
    expect(fundadorPendentes(s0)).toEqual(['founder-retrato', 'furn-cristal-fundador']);
  });
  it('com outro modal na vez: o Fundador espera (nunca empilha, nunca fica inerte) e fecha depois', () => {
    render(<Harness outroAberto onEstado={() => {}} />);
    expect(document.querySelector('[data-fundador-aviso]')).toBeNull();
    fireEvent.click(document.querySelector<HTMLButtonElement>('.sm2-popup-fechar, [aria-label="Fechar"]')!);
    const aviso = document.querySelector('[data-fundador-aviso]');
    expect(aviso).not.toBeNull(); expect(vistos()).toEqual(['founder-fundo']);
    let el: HTMLElement | null = aviso as HTMLElement;
    while (el) { expect(el.hasAttribute('inert')).toBe(false); el = el.parentElement; }
    fireEvent.click(botaoX());
    expect(vistos()).toEqual(['founder-moldura']); // o ✕ do Fundo fechou e o próximo abre em seguida
  });
});
