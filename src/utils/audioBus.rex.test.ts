// @vitest-environment jsdom
/**
 * A R-EX NO DESPACHO — run `som-01`, Fase 3 (fecha o A-2).
 *
 * A P-1 (`squad-alpha-runs/som-01/prototyper/decisoes-regra-p1-p4.md`) atribui a
 * regra ao **despacho**, não ao grafo, e nomeia dois testes obrigatórios:
 *
 * > Teste obrigatório: dois `play*` na mesma passagem síncrona → **uma** fonte
 * > iniciada, e é a de classe mais alta. Segundo teste, de regressão da
 * > **classe** do problema (não do caso morto): um gesto que dispara Cuidado +
 * > Arcade inicia **só** Cuidado.
 *
 * Os dois estão abaixo, nomeados. O resto do arquivo trava os desempates 2 a 4,
 * a borda da janela e o "descartada, nunca enfileirada".
 *
 * ⚠️ **Por que arquivo separado de `audioBus.contract.test.ts`:** aquele mede o
 * GRAFO (ligações, limitador, ducking, ciclo de vida); este mede o DESPACHO
 * (quantas fontes começam). São as duas coisas que o A-2 diz para não
 * confundir — o `120` do D-1 é ducking, o `120` daqui é exclusão.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  JANELA_DE_COINCIDENCIA_MS,
  encerrarBarramento,
  esquecerJanelaDeCoincidencia,
  tocarNa,
} from './audioBus';
import type { CategoriaSom } from './loudness';

/* ── Duplos ──────────────────────────────────────────────────────────────── */

type Evento = { no: string; metodo: string; valor: number };

function instalarAudioFalso() {
  const eventos: Evento[] = [];
  const fontes: string[] = [];
  let nGain = 0;

  const param = (no: string) => ({
    value: 1,
    cancelScheduledValues: () => {},
    setValueAtTime: (v: number) => { eventos.push({ no, metodo: 'set', valor: v }); },
    linearRampToValueAtTime: (v: number) => { eventos.push({ no, metodo: 'linear', valor: v }); },
    exponentialRampToValueAtTime: () => {},
  });

  class ContextoFalso {
    currentTime = 0;
    sampleRate = 48000;
    state: AudioContextState = 'running';
    destination = { __no: 'destination' };
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() {
      // Os 13 primeiros ganhos são o GRAFO (master, ducks, buses, categorias);
      // do 14º em diante são os ganhos POR DESPACHO que a R-EX usa para
      // silenciar uma perdedora. Separar os nomes é o que impede o teste de
      // confundir o duck do D-1 (que também vai a 0) com uma substituição.
      const i = nGain++;
      const nome = i < 13 ? `grafo${i}` : `despacho${i}`;
      return { __no: nome, gain: param(nome), connect: () => {} };
    }
    createWaveShaper() {
      return { oversample: '', curve: null, connect: () => {} };
    }
    createOscillator() {
      return { type: '', frequency: param('osc'), connect: () => {}, start: () => {}, stop: () => {} };
    }
  }

  vi.stubGlobal('AudioContext', ContextoFalso as unknown as typeof AudioContext);
  vi.stubGlobal('localStorage', {
    getItem: () => null, setItem: () => {}, removeItem: () => {},
    clear: () => {}, key: () => null, length: 0,
  });
  return {
    eventos,
    fontes,
    /** Quantas fontes de fato COMEÇARAM. É o número que a R-EX governa. */
    get iniciadas() { return fontes.length; },
    /** Uma fonte foi silenciada por substituição (§4.3 regra 3)? */
    silenciadas: () => eventos.filter(e => e.metodo === 'linear' && e.valor === 0
      && /^despacho\d+$/.test(e.no)).length,
  };
}

let audio: ReturnType<typeof instalarAudioFalso>;
let relogio = 1_000_000;

/** Uma fonte identificável por categoria: é ela que conta como "iniciada". */
const fonteDe = (marca: string) => (ctx: AudioContext, destino: AudioNode) => {
  const osc = ctx.createOscillator();
  osc.connect(destino);
  osc.start();
  audio.fontes.push(marca);
  return 0.2;
};

const tocar = (cat: CategoriaSom, origem?: 'gesto' | 'cascata') =>
  tocarNa(cat, fonteDe(cat), origem);

beforeEach(() => {
  audio = instalarAudioFalso();
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  relogio = 1_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => relogio);
  esquecerJanelaDeCoincidencia();
});
afterEach(() => {
  encerrarBarramento();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* ── Os dois testes que a P-1 nomeia ─────────────────────────────────────── */

describe('R-EX · um gesto produz no máximo UMA fonte iniciada', () => {
  it('dois `play*` na mesma passagem síncrona → UMA fonte soando, a de classe mais alta', () => {
    // Mesma passagem síncrona: o relógio não anda entre as duas chamadas.
    expect(tocar('conclusao')).toBe(true);
    expect(tocar('cuidado')).toBe(true); // Cuidado é classe mais alta: vence e SUBSTITUI

    // Duas foram montadas, mas só uma continua audível: a perdedora foi levada
    // a ganho 0. É esta asserção que separa "a regra existe" de "o limitador
    // conteve a soma" — o D-2 atenua 9 dB, ele não exclui.
    expect(audio.silenciadas()).toBe(1);
    expect(audio.fontes).toEqual(['conclusao', 'cuidado']);
  });

  it('a de classe mais BAIXA chegando depois é DESCARTADA, nunca enfileirada', () => {
    expect(tocar('cuidado')).toBe(true);
    expect(tocar('conclusao')).toBe(false); // descartada no despacho
    expect(audio.iniciadas).toBe(1);
    expect(audio.silenciadas()).toBe(0);    // nada precisou ser silenciado
  });

  it('regressão da CLASSE do problema: gesto que dispara Cuidado + Arcade inicia só Cuidado', () => {
    expect(tocar('cuidado')).toBe(true);
    expect(tocar('arcade')).toBe(false);
    expect(audio.fontes).toEqual(['cuidado']);

    // E na ordem inversa, o resultado audível é o mesmo: quem fica é Cuidado.
    esquecerJanelaDeCoincidencia();
    audio.fontes.length = 0;
    expect(tocar('arcade')).toBe(true);
    expect(tocar('cuidado')).toBe(true);
    expect(audio.silenciadas()).toBe(1);
  });

  it('o caso concreto do A-2: `playFeed` + `playTaskComplete` no mesmo tick → um som', () => {
    // Era o defeito medido em `ArenaGame.tsx` (especial mata o último inimigo).
    // O corte da Fase 3 tirou os dois `play*` de lá; a R-EX é o que impede a
    // MESMA forma de defeito de voltar por qualquer outra tela.
    expect(tocarNa('cuidado', fonteDe('playFeed'))).toBe(true);
    expect(tocarNa('conclusao', fonteDe('playTaskComplete'))).toBe(false);
    expect(audio.fontes).toEqual(['playFeed']);
  });
});

/* ── Os desempates, na ordem da P-1 ──────────────────────────────────────── */

describe('R-EX · os desempates', () => {
  it('empate de classe → vence o MENOR orçamento por sessão (Transação sobre Conclusão)', () => {
    // §4.2 dá às duas o mesmo perfil de interrupção; o orçamento (≤3 contra
    // "sem teto") é que decide. É a ordem que a P-1 escreveu em prosa, obtida
    // pela regra e não por escolha.
    expect(tocar('conclusao')).toBe(true);
    expect(tocar('transacao')).toBe(true);
    expect(audio.silenciadas()).toBe(1);

    esquecerJanelaDeCoincidencia();
    expect(tocar('transacao')).toBe(true);
    expect(tocar('conclusao')).toBe(false);
  });

  it('empate de orçamento → vence o GESTO, perde a CASCATA', () => {
    // `degeneracao` e `presenca` empatam em classe e em orçamento (≤1/sessão).
    expect(tocar('presenca', 'cascata')).toBe(true);
    expect(tocar('degeneracao', 'gesto')).toBe(true); // gesto vence cascata
    expect(audio.silenciadas()).toBe(1);
  });

  it('empate residual → vence a PRIMEIRA despachada (determinismo, não estética)', () => {
    expect(tocar('cuidado')).toBe(true);
    expect(tocar('cuidado')).toBe(false);
    expect(audio.iniciadas).toBe(1);
  });

  it('o Marco vence tudo, inclusive chegando depois', () => {
    expect(tocar('arcade')).toBe(true);
    expect(tocar('marco')).toBe(true);
    expect(audio.silenciadas()).toBe(1);
  });
});

/* ── A janela ────────────────────────────────────────────────────────────── */

describe('R-EX · a janela de coincidência', () => {
  it('é de 120 ms — o `--sm-dur-1`, não um número novo', () => {
    expect(JANELA_DE_COINCIDENCIA_MS).toBe(120);
  });

  it('na borda (exatamente 120 ms) ainda é o MESMO gesto', () => {
    expect(tocar('cuidado')).toBe(true);
    relogio += JANELA_DE_COINCIDENCIA_MS;
    expect(tocar('conclusao')).toBe(false);
  });

  it('passada a janela, é outro gesto e os dois sons tocam', () => {
    expect(tocar('cuidado')).toBe(true);
    relogio += JANELA_DE_COINCIDENCIA_MS + 1;
    expect(tocar('conclusao')).toBe(true);
    expect(audio.iniciadas).toBe(2);
    expect(audio.silenciadas()).toBe(0);
  });

  it('a janela NÃO desliza: uma cascata longa não estica o gesto para sempre', () => {
    expect(tocar('arcade')).toBe(true);
    relogio += 100;
    expect(tocar('cuidado')).toBe(true);   // ainda o mesmo gesto (100 ms)
    relogio += 30;                          // 130 ms desde o INÍCIO do gesto
    expect(tocar('conclusao')).toBe(true);  // gesto novo, não descartada
    expect(audio.fontes).toEqual(['arcade', 'cuidado', 'conclusao']);
  });

  it('a R-EX não trata repetição no tempo (carinho a cada 2 s continua legítimo)', () => {
    // P-1, seção "o que a R-EX NÃO resolve": repetição é assunto do C-4 e do
    // teto de frequência por evento, nunca desta regra.
    for (let i = 0; i < 5; i++) {
      expect(tocar('cuidado')).toBe(true);
      relogio += 2000;
    }
    expect(audio.iniciadas).toBe(5);
  });

  it('a janela morre com o contexto: um gesto não atravessa um `pagehide`', () => {
    expect(tocar('cuidado')).toBe(true);
    encerrarBarramento();
    expect(tocar('conclusao')).toBe(true);
  });
});
