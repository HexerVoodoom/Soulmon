// ---------------------------------------------------------------------------
// TORC-5 — a lista pública do Torneio tem que estar (1) DOCUMENTADA na política,
// nas duas línguas, com o MESMO rótulo da tela, e (2) respeitada por TODA rota
// do servidor que serve dado de outra pessoa.
//
// (2) é contrato de fonte, de propósito: o teste de comportamento
// (`community.publicOptOut.test.js`) prova as rotas que existem hoje; este pega
// a rota NOVA que alguém escreva servindo `name`/`petName` sem passar pela régua.
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const raiz = resolve(__dirname, '../..');
const ler = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

describe('política de privacidade × tela de Configurações', () => {
  const html = ler('public/privacidade.html');
  const tela = ler('src/components/SettingsPage.tsx');

  it('cita o rótulo exato do interruptor, em PT e em EN, e o mesmo rótulo está na tela', () => {
    expect(html).toContain('Aparecer na lista pública do Torneio');
    expect(html).toContain('Show me on the public Tournament list');
    expect(tela).toContain('Aparecer na lista pública do Torneio');
    expect(tela).toContain('Show me on the public Tournament list');
  });

  it('diz que é automático no Vínculo 5 e que o grupo cooperativo é um círculo à parte', () => {
    expect(html).toMatch(/Bond level 5/);
    expect(html).toMatch(/Vínculo nível 5/);
    expect(html).toMatch(/invite-only circle/);
    expect(html).toMatch(/círculo à parte/);
  });

  it('não promete mais que os recursos sociais dependem de o jogador "ativar" algo', () => {
    expect(html).not.toMatch(/If you enable the social features/);
    expect(html).not.toMatch(/Se você ativar os recursos sociais/);
  });
});

describe('servidor: toda rota que serve dado de outra pessoa passa pela régua isHidden', () => {
  const src = ler('functions/api/community.js');

  /** Trecho do handler de uma ação, até a próxima `if (action ===` de topo. */
  const trecho = (marca: string) => {
    const i = src.indexOf(marca);
    expect(i, `ação ${marca} sumiu de community.js`).toBeGreaterThan(-1);
    const resto = src.slice(i + marca.length);
    const fim = resto.search(/\n {2}(?:\/\/ ──|if \(\(?action ===)/);
    return fim < 0 ? resto : resto.slice(0, fim);
  };

  it.each([
    ["action === 'players'"],
    ["action === 'player'"],
    ["action === 'opponents'"],
    ["action === 'friends'"],
    ["action === 'gift'"],
  ])('%s consulta isHidden', marca => {
    expect(trecho(marca)).toMatch(/isHidden\(|semEscondidos/);
  });

  it('o ranking e o resultado da season descartam escondidos', () => {
    expect(trecho("(action === 'rank' || action === 'seasonResult')")).toMatch(/isHidden\(/);
  });

  it('o contexto de partida recusa oponente escondido', () => {
    expect(src).toMatch(/!opp\?\.pvpEnabled \|\| isHidden\(opp\)/);
  });
});
