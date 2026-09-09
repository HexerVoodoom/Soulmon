// @vitest-environment jsdom
/**
 * som-01 (SQUAD-SOM) — `sound_state` e `sound_off`.
 *
 * O desenho aprovado está em `squad-alpha-runs/som-01/discovery/metrica-de-som.md`.
 * Este arquivo prova as três coisas que o documento exige do INSTRUMENTO:
 *
 *  1. **Paridade cliente ↔ servidor** dos dois eventos novos. O `EVENT_SCHEMA`
 *     é cópia deliberada em dois arquivos e falha FECHADO: uma faixa alargada
 *     de um lado só faz o servidor rejeitar o evento inteiro, em silêncio, e a
 *     leitura vira "ninguém usa a trilha" por um motivo que não tem nada a ver
 *     com som.
 *  2. **O guard da leitura TRI-ESTADO.** `isMuted()` devolve `false` quando o
 *     storage falha; num app que nasce sonoro, isso faz leitura degradada
 *     parecer ADOÇÃO. Aqui se prova que o evento NÃO SAI quando o estado é
 *     desconhecido — evento faltando é honesto, evento no balde errado não.
 *  3. **A fiação do denominador**: `sound_state` sai do mesmo ponto de
 *     fechamento que o `day_active` e só quando ele sai. Mover um dos dois
 *     trocaria a população do denominador de S-b sem nenhum erro.
 *
 * E mais uma, que é de PRIVACIDADE e não de forma: o guardrail G6 — a
 * preferência de som não tem consumidor fora do módulo de som, da telemetria e
 * do interruptor da tela de ajustes. É a versão executável da proibição
 * "`sound_off` nunca vira nudge de reengajamento".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EVENT_SCHEMA, TELEMETRY_EVENTS, pendingTelemetry, resetTelemetryForTest,
  trackDayClosed, trackSoundOff, noteMusicStarted, soundStateProps, telemetryDayKey,
} from './telemetry';
// A Pages Function é JS puro e não tem tipos — é por não poder importar TS que
// ela carrega a segunda cópia do schema. Mesmo molde do `telemetry.test.ts`.
// @ts-expect-error módulo JS sem declaração de tipos
import { EVENT_SCHEMA as SERVER_SCHEMA, applyAggregate } from '../../functions/api/metrics.js';
import { STORAGE_KEYS } from './storageKeys';

const only = (e: string) => pendingTelemetry().filter(r => r.e === e);

/** Todos os fontes de `src/`, menos os testes. */
function fontesDoApp(dir = 'src'): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(resolve(process.cwd(), dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`;
    if (ent.isDirectory()) out.push(...fontesDoApp(rel));
    else if (/\.tsx?$/.test(ent.name) && !/\.test\.tsx?$/.test(ent.name)) out.push(rel);
  }
  return out;
}

/** Storage em memória, no mesmo molde dos outros testes de telemetria. */
function installMemoryStorage(quebrarSom = false): Map<string, string> {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => {
        // Aba privativa / cota estourada / WebView de fabricante: `getItem`
        // LANÇA. É o caso que fazia a leitura degradada parecer adoção.
        if (quebrarSom && k === STORAGE_KEYS.SOUND_MUTED) {
          throw new DOMException('storage bloqueado', 'SecurityError');
        }
        return map.has(k) ? map.get(k)! : null;
      },
      setItem: (k: string, v: string) => { map.set(k, String(v)); },
      removeItem: (k: string) => { map.delete(k); },
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() { return map.size; },
    },
  });
  return map;
}

let store: Map<string, string>;
beforeEach(() => { store = installMemoryStorage(); resetTelemetryForTest(); });
afterEach(() => { vi.useRealTimers(); });

describe('som-01: os dois eventos são os DOIS, e a paridade vale para eles', () => {
  it('estão declarados no cliente com as faixas fechadas', () => {
    expect(TELEMETRY_EVENTS).toContain('sound_state');
    expect(TELEMETRY_EVENTS).toContain('sound_off');
    expect(EVENT_SCHEMA.sound_state).toEqual({ muted: { min: 0, max: 1 }, music: { min: 0, max: 1 } });
    expect(EVENT_SCHEMA.sound_off).toEqual({ age: { min: 0, max: 2 } });
  });

  it('o servidor declara EXATAMENTE o mesmo, faixas inclusive', () => {
    const server = JSON.parse(JSON.stringify(SERVER_SCHEMA)) as Record<string, unknown>;
    expect(server.sound_state).toEqual(EVENT_SCHEMA.sound_state);
    expect(server.sound_off).toEqual(EVENT_SCHEMA.sound_off);
  });

  it('o run NÃO instrumenta `sound_asset_fail` — não há áudio em ARQUIVO hoje', () => {
    expect(TELEMETRY_EVENTS).not.toContain('sound_asset_fail');
  });

  it('nenhum dos eventos recusados no §2 entrou de contrabando', () => {
    for (const proibido of ['volume_change', 'sound_played', 'music_duration', 'headphones_connected']) {
      expect(TELEMETRY_EVENTS).not.toContain(proibido);
    }
    // Nem como PROP: nada de volume, hora, id de trilha ou device de saída.
    const props = [
      ...Object.keys(EVENT_SCHEMA.sound_state ?? {}),
      ...Object.keys(EVENT_SCHEMA.sound_off ?? {}),
    ];
    expect(props.sort()).toEqual(['age', 'music', 'muted']);
  });

  it('o agregado do servidor LÊ as duas props — coleta sem leitura é custo de privacidade sem retorno', () => {
    const agg = applyAggregate({}, [
      { e: 'sound_state', d: '2026-09-09', p: { muted: 0, music: 1 } },
      { e: 'sound_state', d: '2026-09-09', p: { muted: 1, music: 0 } },
      { e: 'sound_off', d: '2026-09-09', p: { age: 0 } },
    ]);
    expect(agg['sound_state.muted_no']).toBe(1);
    expect(agg['sound_state.muted_yes']).toBe(1);
    expect(agg['sound_state.music_yes']).toBe(1);
    expect(agg['sound_off.age_0']).toBe(1);
  });
});

describe('som-01: o GUARD da leitura tri-estado (§6 — onde o instrumento mentiria)', () => {
  it('storage que LANÇA na leitura ⇒ estado desconhecido ⇒ `sound_state` NÃO SAI', () => {
    installMemoryStorage(true);
    resetTelemetryForTest();
    expect(soundStateProps('2026-09-09')).toBeNull();
    trackDayClosed({ day: '2026-09-09', effort: 4, goalMet: true });
    expect(only('sound_state')).toHaveLength(0);
  });

  it('…e o `day_active` continua saindo: o guard cala o SOM, não a métrica-norte', () => {
    installMemoryStorage(true);
    resetTelemetryForTest();
    trackDayClosed({ day: '2026-09-09', effort: 4, goalMet: true });
    expect(only('day_active')).toHaveLength(1);
    expect(only('sound_state')).toHaveLength(0);
  });

  it('valor fora do formato de flag também é DESCONHECIDO — não vira 0 plausível', () => {
    store.set(STORAGE_KEYS.SOUND_MUTED, 'sim');
    expect(soundStateProps('2026-09-09')).toBeNull();
  });

  it('chave AUSENTE com storage vivo é o default declarado do app, e conta como som ligado', () => {
    // A fronteira fina: ausência com storage que RESPONDE é valor conhecido;
    // ausência porque o storage não respondeu não é.
    expect(soundStateProps('2026-09-09')).toEqual({ muted: 0, music: 0 });
    store.set(STORAGE_KEYS.SOUND_MUTED, 'true');
    expect(soundStateProps('2026-09-09')).toEqual({ muted: 1, music: 0 });
  });
});

describe('som-01: a fiação do denominador (S-b)', () => {
  it('`sound_state` sai do MESMO fechamento do `day_active`, com o MESMO dia', () => {
    trackDayClosed({ day: '2026-09-09', effort: 3, goalMet: false });
    expect(only('sound_state')).toEqual([
      { e: 'sound_state', d: '2026-09-09', p: { muted: 0, music: 0 } },
    ]);
    expect(only('day_active')[0]?.d).toBe('2026-09-09');
  });

  it('dia SEM esforço não emite nem um nem outro — o denominador é "fez algo", não "abriu"', () => {
    trackDayClosed({ day: '2026-09-09', effort: 0, goalMet: false });
    expect(only('day_active')).toHaveLength(0);
    expect(only('sound_state')).toHaveLength(0);
  });

  it('o despacho está literalmente colado no do `day_active` (fiação, não convenção)', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/telemetry.ts'), 'utf-8');
    const corpo = fonte.slice(fonte.indexOf('export function trackDayClosed'));
    const iDia = corpo.indexOf("track('day_active'");
    const iSom = corpo.indexOf("track('sound_state'");
    expect(iDia, 'day_active saiu de trackDayClosed').toBeGreaterThan(-1);
    expect(iSom, 'sound_state precisa sair do MESMO fechamento').toBeGreaterThan(iDia);
    // E perto: se alguém mover o despacho para outro ponto (`app_open`, por
    // exemplo), o denominador de S-b troca de população sem nenhum erro.
    expect(iSom - iDia).toBeLessThan(700);
  });

  it('uma vez por dia: chamar duas vezes não duplica (dedupe de ONCE_PER_DAY)', () => {
    trackDayClosed({ day: '2026-09-09', effort: 3, goalMet: false });
    trackDayClosed({ day: '2026-09-09', effort: 9, goalMet: true });
    expect(only('sound_state')).toHaveLength(1);
  });

  it('`music` é 1 só no DIA em que a trilha foi iniciada por gesto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 9, 10));
    noteMusicStarted();
    const hoje = telemetryDayKey();
    expect(soundStateProps(hoje)).toEqual({ muted: 0, music: 1 });
    expect(soundStateProps('2026-09-08')).toEqual({ muted: 0, music: 0 });
  });
});

describe('som-01: `sound_off` — faixa fechada no aparelho, nunca data', () => {
  const comInstalacao = (dia: string) => {
    store.set('soulmon-telemetry-install', JSON.stringify(dia));
  };

  it('emite a FAIXA certa, e o dia da instalação nunca acompanha o evento', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 9, 12));
    const hoje = telemetryDayKey();
    const casos: Array<[string, number]> = [[hoje, 0], ['2026-09-06', 1], ['2026-08-01', 2]];
    for (const [inicio, age] of casos) {
      store.clear();
      resetTelemetryForTest();
      comInstalacao(inicio);
      trackSoundOff();
      expect(only('sound_off')).toEqual([{ e: 'sound_off', d: hoje, p: { age } }]);
    }
  });

  it('sem data de instalação conhecida, o evento NÃO SAI — faixa inventada é pior que faixa faltando', () => {
    trackSoundOff();
    expect(only('sound_off')).toHaveLength(0);
    store.set('soulmon-telemetry-install', JSON.stringify('ontem'));
    trackSoundOff();
    expect(only('sound_off')).toHaveLength(0);
  });

  it('no máximo um por dia', () => {
    comInstalacao('2026-01-01');
    trackSoundOff();
    trackSoundOff();
    expect(only('sound_off')).toHaveLength(1);
  });

  it('religar o som não emite nada: o interruptor só mede a transição para MUDO', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    expect(app).toMatch(/if \(mudo\) trackSoundOff\(\);/);
    expect(app).not.toMatch(/trackSoundOn|sound_on\b/);
  });
});

describe('som-01: G6 — a preferência de som não tem consumidor fora da linha', () => {
  it('quem lê a preferência é o áudio, o dicionário de chaves, a telemetria ou a UI — nunca um módulo de engajamento', () => {
    // A asserção é por CATEGORIA e não por lista fechada de propósito: o eixo
    // sonoro está crescendo (barramento, loudness) e uma lista literal ficaria
    // vermelha por motivo certo nenhum. O que NÃO pode variar é a natureza do
    // leitor: som lê preferência para TOCAR; telemetria lê para MEDIR; nada
    // mais tem por que saber se a pessoa está com o som desligado.
    const proibido = /notif|push|remind|nudge|reengaj|engagement|campaign|copy|offer|paywall|unlock|score|streak|reward|bond|mission|quest/i;
    const leitores = fontesDoApp().filter(f => (
      /SOUND_MUTED|isMuted\(/.test(readFileSync(resolve(process.cwd(), f), 'utf-8'))
    ));
    expect(leitores).toContain('src/utils/telemetry.ts');
    for (const f of leitores) {
      expect(proibido.test(f), `leitor de preferência de som em módulo de engajamento: ${f}`).toBe(false);
    }
  });

  it('nenhum push, copy, badge ou oferta pendura em `sound_off`', () => {
    // A regra é de USO, não de coleta: quem quiser reagir a "a pessoa desligou
    // o som" tem de passar por aqui, e a resposta está escrita no §5 do desenho
    // e no bloco SOM de `telemetry.ts` — não pode. Um push do tipo "notamos que
    // você desligou o som, quer tentar de novo?" é o app cobrando por uma
    // escolha da pessoa.
    const suspeitos = fontesDoApp()
      .filter(f => f !== 'src/utils/telemetry.ts')
      .filter(f => /sound_off|sound_state/.test(readFileSync(resolve(process.cwd(), f), 'utf-8')));
    expect(suspeitos, 'consumidor novo de preferência de som fora da telemetria').toEqual([]);
  });
});
