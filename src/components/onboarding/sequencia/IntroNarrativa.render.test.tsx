// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { DUELO_CORTE_MS } from '../etapas/EtapaDuelo';
import { TEMPOS, IntroNarrativa, IntroRevisao, type LigacoesIntro } from './IntroNarrativa';
import { INTRO } from './copy';

vi.mock('../etapas/EtapaAlimentar', () => ({
  EtapaAlimentar: (p: { onFeed?: (e: string) => void; onDone: () => void }) => (
    <button type="button" onClick={() => { p.onFeed?.('x'); p.onDone(); }}>comer</button>
  ),
}));

const ctx2d = { createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: vi.fn() };

function reduzirMovimento(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  reduzirMovimento(false);
  ctx2d.putImageData.mockClear();
  HTMLCanvasElement.prototype.getContext = (() => ctx2d) as unknown as HTMLCanvasElement['getContext'];
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avanca = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const raiz = () => screen.getByTestId('intro-narrativa');
const pos = () => `${raiz().getAttribute('data-cena')}:${raiz().getAttribute('data-quadro')}`;
const lig = (o: Partial<LigacoesIntro> = {}): LigacoesIntro => ({ tasks: [], onCreateTask: vi.fn(() => 'nova-1'), onCompleteTask: vi.fn(), foodInventory: { x: 1 }, onFeed: vi.fn(), ...o });
const progresso = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO) ?? 'null');

describe('IntroNarrativa: cenas 1 e 2', () => {
  it('começa preto; a fala só entra depois de 1,2 s e o toque antes disso não avança (D-01)', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} />);
    expect(screen.queryByTestId('intro-fala')).toBeNull();
    fireEvent.click(screen.getByTestId('intro-preto'));
    expect(pos()).toBe('1:0');
    avanca(1250);
    expect(screen.getByTestId('intro-fala').textContent).toContain('Acorda… temos que ir.');
    fireEvent.click(screen.getByTestId('intro-preto'));
    expect(pos()).toBe('1:1');
  });

  it('EN: a fala sai em inglês', () => {
    render(<IntroNarrativa language="en-US" ligacoes={lig()} onDone={() => {}} />);
    avanca(1250);
    expect(screen.getByTestId('intro-fala').textContent).toContain('Wake up… we have to go.');
  });

  it('o olho abre com desfoque (D-02): toque só vale depois de ~1,6 s; o desfoque some', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 1, quadro: 1 }} />);
    const olho = screen.getByTestId('intro-olho');
    fireEvent.click(olho);
    expect(pos()).toBe('1:1');
    avanca(100);
    expect(olho.getAttribute('data-aberto')).toBe('true');
    expect((olho.firstElementChild as HTMLElement).style.filter).toBe('blur(0)');
    avanca(TEMPOS.olhoMs);
    fireEvent.click(olho);
    expect(pos()).toBe('2:0');
  });

  it('com movimento reduzido o olho já nasce aberto, sem desfoque nem transição', () => {
    reduzirMovimento(true);
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 1, quadro: 1 }} />);
    const olho = screen.getByTestId('intro-olho');
    expect(olho.getAttribute('data-pronto')).toBe('true');
    expect((olho.firstElementChild as HTMLElement).style.filter).toBe('blur(0)');
    expect((olho.firstElementChild as HTMLElement).style.transition).toBe('none');
  });

  it('arte ausente = silhueta nomeada, não trava (ancião de costas)', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 2, quadro: 0 }} />);
    expect(document.querySelector('[data-asset="velado-anciao-costas"]')).not.toBeNull();
    expect(screen.getByTestId('intro-fala').textContent).toContain('Precisamos ir.');
  });

  it('túnel: canvas com narração em aria, e avança sozinho depois do tempo', () => {
    const onDone = vi.fn();
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={onDone} inicial={{ cena: 2, quadro: 1 }} />);
    const c = screen.getByTestId('tunel-canvas');
    expect(c.getAttribute('role')).toBe('img');
    expect(c.getAttribute('aria-label')).toMatch(/túnel/);
    avanca(12100);
    expect(pos()).toBe('3:0');
  });

  it('túnel com movimento reduzido: um quadro só, nenhum requestAnimationFrame', () => {
    reduzirMovimento(true);
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 2, quadro: 1 }} />);
    expect(raf).not.toHaveBeenCalled();
    expect(ctx2d.putImageData).toHaveBeenCalledTimes(1);
  });
});

describe('IntroNarrativa: Pular', () => {
  it('pula as falas e PARA na etapa jogável (tarefa); na etapa não há botão Pular', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig({ tasks: [{ id: 'a', name: 'x', completed: false }] })} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Pular'));
    expect(pos()).toBe('4:1');
    expect(raiz().getAttribute('data-tipo')).toBe('slot');
    expect(screen.queryByText('Pular')).toBeNull();
  });
});

describe('IntroNarrativa: tarefa, retomar sem pagar duas vezes (§11.1)', () => {
  it('sem tarefa aberta cria uma sugerida pequena direto, grava o id e conclui UMA vez', () => {
    const l = lig();
    render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 1 }} />);
    expect(l.onCreateTask).toHaveBeenCalledTimes(1);
    expect((l.onCreateTask as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ kind: 'task', category: 'corpo' });
    expect(progresso()).toMatchObject({ cena: 4, quadro: 1, tarefaId: 'nova-1' });
    const b = screen.getByRole('button', { name: 'Já fiz' });
    fireEvent.click(b); fireEvent.click(b);
    expect(l.onCompleteTask).toHaveBeenCalledTimes(1);
    expect(l.onCompleteTask).toHaveBeenCalledWith('nova-1');
    avanca(800);
    expect(pos()).toBe('4:2');
  });

  it('usa a tarefa aberta que o jogador já tem, sem criar outra', () => {
    const l = lig({ tasks: [{ id: 'minha', name: 'Arrumar a mesa', completed: false }] });
    render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 1 }} />);
    expect(l.onCreateTask).not.toHaveBeenCalled();
    expect(screen.getAllByText('Arrumar a mesa').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Já fiz' }));
    expect(l.onCompleteTask).toHaveBeenCalledWith('minha');
  });

  it('o cartão é o da Home (RitualRow), não o GameTutorialFlow', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 4, quadro: 1 }} />);
    expect(document.querySelector('.sm2-ritual-name')).not.toBeNull();
    expect(document.querySelector('[data-tutorial-flow]')).toBeNull();
  });

  it('fechar depois de "Já fiz" e reabrir NÃO conclui uma 2ª tarefa', () => {
    const l = lig();
    const a = render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Já fiz' }));
    expect(l.onCompleteTask).toHaveBeenCalledTimes(1);
    a.unmount(); // fechou o app antes de a cena seguir: o progresso ficou na etapa, com o id
    expect(progresso()).toMatchObject({ cena: 4, quadro: 1, tarefaId: 'nova-1' });
    const l2 = lig({ tasks: [{ id: 'nova-1', name: 'Beber um copo de água', completed: true }] });
    render(<IntroNarrativa language="pt-BR" ligacoes={l2} onDone={() => {}} />);
    expect(l2.onCompleteTask).not.toHaveBeenCalled();
    expect(l2.onCreateTask).not.toHaveBeenCalled();
    expect(pos()).toBe('4:2');
  });

  it('retomar com a tarefa já fora da lista (foi para o histórico) também só segue', () => {
    const l = lig({ tasks: [] });
    render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 1, tarefaId: 'sumiu' }} />);
    expect(l.onCompleteTask).not.toHaveBeenCalled();
    expect(l.onCreateTask).not.toHaveBeenCalled();
    expect(pos()).toBe('4:2');
  });
});

describe('IntroNarrativa: alimentar (§11.1)', () => {
  it('alimenta uma vez e grava `alimentou` antes de gastar a comida', () => {
    const l = lig();
    render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 2, tarefaId: 't' }} />);
    fireEvent.click(screen.getByText('comer'));
    expect(l.onFeed).toHaveBeenCalledTimes(1);
    expect(progresso()).toMatchObject({ alimentou: true });
    expect(pos()).toBe('4:3');
  });

  it('retomar com `alimentou` já gravado pula a etapa e NÃO gasta uma 2ª comida', () => {
    const l = lig();
    render(<IntroNarrativa language="pt-BR" ligacoes={l} onDone={() => {}} inicial={{ cena: 4, quadro: 2, tarefaId: 't', alimentou: true }} />);
    expect(l.onFeed).not.toHaveBeenCalled();
    expect(screen.queryByText('comer')).toBeNull();
    expect(pos()).toBe('4:3');
    expect(screen.getByTestId('intro-fala').textContent).toContain('Agora estamos prontos.');
  });
});

describe('IntroNarrativa: duelo, corda, cristal, fim', () => {
  it('duelo: 5 golpes cortam a luta, a fala do ancião aparece e a corda vem depois', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 5, quadro: 0 }} />);
    const atacar = screen.getByRole('button', { name: 'Atacar' });
    for (let i = 0; i < 4; i++) fireEvent.click(atacar);
    expect(pos()).toBe('5:0');
    fireEvent.click(atacar);
    expect(screen.getByTestId('hp-jogador').getAttribute('data-hp')).toBe('40');
    avanca(DUELO_CORTE_MS + 50);
    expect(pos()).toBe('5:1');
    expect(screen.getByTestId('intro-fala').textContent).toContain('Basta. Só precisamos ganhar tempo.');
    avanca(400);
    fireEvent.click(screen.getByTestId('intro-cena'));
    expect(pos()).toBe('6:0');
  });

  it('corda: balão no alto, botão único Subir, que leva ao cristal', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 6, quadro: 0 }} />);
    expect(screen.getByTestId('balao-alto').textContent).toContain('Vamos, suba depressa!');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
    expect(pos()).toBe('7:0');
  });

  it('cristal: escuro, cristal, luz em rampa >= 0,6 s até o branco total, e segue sozinho', () => {
    render(<IntroNarrativa language="en-US" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 7, quadro: 0 }} />);
    const c = screen.getByTestId('intro-cristal');
    expect(c.getAttribute('data-fase')).toBe('escuro');
    avanca(TEMPOS.cristalEscuroMs + 10);
    expect(c.getAttribute('data-fase')).toBe('cristal');
    avanca(TEMPOS.cristalMs);
    expect(c.getAttribute('data-fase')).toBe('luz');
    const branco = screen.getByTestId('intro-branco');
    const dur = Number(/opacity (\d+)ms/.exec(branco.style.transition)?.[1]);
    expect(dur).toBeGreaterThanOrEqual(600);
    expect(TEMPOS.luzMs).toBeGreaterThanOrEqual(600);
    avanca(TEMPOS.luzMs);
    expect(c.getAttribute('data-fase')).toBe('branco');
    avanca(TEMPOS.brancoMs + 10);
    expect(pos()).toBe('8:0');
  });

  it('cidade: entra saindo do branco e a boas-vindas vem em duas falas (Malha, não "outro mundo")', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 8, quadro: 0 }} />);
    expect(screen.getByTestId('intro-branco-saida')).toBeTruthy();
    expect(screen.getByTestId('intro-fala').textContent).toContain(INTRO.bemVindo1.pt);
    avanca(400);
    fireEvent.click(screen.getByTestId('intro-cena'));
    expect(screen.getByTestId('intro-fala').textContent).toContain('Malha');
  });

  it('descanse: fade para preto, onDone UMA vez, progresso apagado', () => {
    const onDone = vi.fn();
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={onDone} inicial={{ cena: 9, quadro: 0 }} />);
    expect(screen.getByTestId('intro-fala').textContent).toContain('Agora, descanse.');
    avanca(400);
    fireEvent.click(screen.getByTestId('intro-cena'));
    expect(pos()).toBe('9:1');
    expect(onDone).not.toHaveBeenCalled();
    avanca(TEMPOS.fadeFinalMs + 100);
    expect(onDone).toHaveBeenCalledTimes(1);
    avanca(3000);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO)).toBeNull();
  });

  it('o último Pular (depois da corda) vai direto ao fim e entrega para a Home', () => {
    const onDone = vi.fn();
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={onDone} inicial={{ cena: 7, quadro: 0 }} />);
    fireEvent.click(screen.getByText('Pular'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('duplo toque numa fala não pula um quadro', () => {
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} inicial={{ cena: 8, quadro: 0 }} />);
    avanca(400);
    const c = screen.getByTestId('intro-cena');
    fireEvent.click(c); fireEvent.click(c);
    expect(pos()).toBe('8:1');
  });
});

describe('IntroNarrativa: progresso e "Rever a história"', () => {
  it('persiste a posição a cada quadro e retoma de onde parou', () => {
    const a = render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} />);
    avanca(1250);
    fireEvent.click(screen.getByTestId('intro-preto'));
    expect(progresso()).toMatchObject({ cena: 1, quadro: 1 });
    a.unmount();
    render(<IntroNarrativa language="pt-BR" ligacoes={lig()} onDone={() => {}} />);
    expect(pos()).toBe('1:1');
  });

  it('IntroRevisao não lê nem grava o progresso e nunca chama os handlers do save', () => {
    localStorage.setItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO, JSON.stringify({ cena: 6, quadro: 0 }));
    const antes = localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO);
    render(<IntroRevisao language="pt-BR" ligacoes={{}} onDone={() => {}} />);
    expect(pos()).toBe('1:0'); // começa do começo, ignorando o progresso guardado
    avanca(1250);
    fireEvent.click(screen.getByTestId('intro-preto'));
    expect(pos()).toBe('1:1');
    expect(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO)).toBe(antes);
    expect(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_VISTA)).toBeNull();
  });

  it('IntroRevisao: tarefa e comida num estado local (o save fica intacto)', () => {
    render(<IntroRevisao language="pt-BR" ligacoes={{}} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Pular'));
    expect(pos()).toBe('4:1');
    fireEvent.click(screen.getByRole('button', { name: 'Já fiz' }));
    avanca(800);
    expect(pos()).toBe('4:2');
    fireEvent.click(screen.getByText('comer'));
    expect(pos()).toBe('4:3');
    expect(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO)).toBeNull();
  });
});
