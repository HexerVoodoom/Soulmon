/**
 * O acervo de sprites: adoção, reversão e os dois terminais.
 *
 * A trava mais importante do arquivo é a última seção: **reverter e
 * re-sintonizar nunca decrementam teto** (gate, "Para o `alpha-frontend`"). Se
 * ela cair, o jogador paga de novo por uma arte que já está no save dele.
 */
import { describe, it, expect } from 'vitest';
import {
  emptySpriteLibrary, normalizeSpriteLibrary, recordSprite, recordFailure,
  displaySprite, hasSprite, tuneVisor, revertVisor, autoTuneDue, cardState,
  canManualRetry, isAccountCapped, isFormCapped,
  SPRITE_MANUAL_COOLDOWN_MS, isSafeSpriteUrl,
} from './spriteLibrary';
import { spriteFailText } from './spriteCopy';

const entry = (formId: string) => ({ url: `https://cdn/${formId}.png`, formId, at: 1000 });
const ctx = (over = {}) => ({ generating: [] as string[], imminent: false, reachable: true, online: true, ...over });

describe('o piso: sem sprite próprio, o visor usa a reserva', () => {
  it('acervo vazio devolve null (e null NUNCA é erro — é o Invariante nº 1)', () => {
    expect(displaySprite(emptySpriteLibrary(), 'rookie')).toBeNull();
  });

  it('save corrompido/estranho não derruba nada', () => {
    expect(normalizeSpriteLibrary(null).sprites).toEqual({});
    expect(normalizeSpriteLibrary({ sprites: { rookie: { url: 42 } } }).sprites).toEqual({});
    expect(normalizeSpriteLibrary({ reverted: ['rookie', 7] }).reverted).toEqual(['rookie']);
  });
});

describe('adoção do sprite da forma ATUAL (§2.3.1)', () => {
  it('ocasião A adota na hora: no nascimento não há história a proteger', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'now' });
    expect(displaySprite(lib, 'rookie')?.url).toContain('rookie');
    expect(lib.pendingTune).toBeNull();
  });

  it('pós-cerimônia o sprite chega mas NÃO troca o rosto sozinho', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('champion-power'), { adopt: 'ask', dayKey: '2026-08-25' });
    expect(hasSprite(lib, 'champion-power')).toBe(true);
    expect(displaySprite(lib, 'champion-power')).toBeNull();
    expect(cardState(lib, 'champion-power', ctx())).toBe('A_SINTONIZAR');
  });

  it('"Sintonizar o Visor" adota, e o card volta a PRÓPRIO', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('champion-power'), { adopt: 'ask', dayKey: '2026-08-25' });
    lib = tuneVisor(lib, 'champion-power');
    expect(displaySprite(lib, 'champion-power')).not.toBeNull();
    expect(cardState(lib, 'champion-power', ctx())).toBe('PROPRIO');
  });

  it('"Voltar ao traço antigo" devolve a reserva sem apagar o sprite pago', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('champion-power'), { adopt: 'now' });
    lib = revertVisor(lib, 'champion-power');
    expect(displaySprite(lib, 'champion-power')).toBeNull();
    expect(hasSprite(lib, 'champion-power')).toBe(true);   // continua no save
    lib = tuneVisor(lib, 'champion-power');
    expect(displaySprite(lib, 'champion-power')).not.toBeNull();
  });

  it('a oferta expira numa virada de dia; o sprite, nunca', () => {
    const lib = recordSprite(emptySpriteLibrary(), entry('champion-power'), { adopt: 'ask', dayKey: '2026-08-25' });
    expect(autoTuneDue(lib, '2026-08-25')).toBeNull();      // mesmo dia: espera o jogador
    expect(autoTuneDue(lib, '2026-08-26')).toBe('champion-power');
    expect(autoTuneDue(tuneVisor(lib, 'champion-power'), '2026-08-26')).toBeNull();
  });
});

describe('reverter e re-sintonizar NUNCA consomem teto', () => {
  it('nenhuma das três operações de adoção toca `failures`', () => {
    let lib = recordSprite(emptySpriteLibrary(), entry('mega-harmony'), { adopt: 'ask', dayKey: 'd1' });
    const before = JSON.stringify(lib.failures);
    lib = tuneVisor(lib, 'mega-harmony');
    lib = revertVisor(lib, 'mega-harmony');
    lib = tuneVisor(lib, 'mega-harmony');
    lib = revertVisor(lib, 'mega-harmony');
    expect(JSON.stringify(lib.failures)).toBe(before);
    expect(lib.failures).toEqual({});
    expect(hasSprite(lib, 'mega-harmony')).toBe(true);
  });

  it('reverter uma forma sem sprite próprio é no-op (não há o que devolver)', () => {
    const lib = revertVisor(emptySpriteLibrary(), 'rookie');
    expect(lib.reverted).toEqual([]);
  });
});

describe('409 ≠ 402 no acervo', () => {
  it('form-cap fecha UMA forma; a conta segue inteira', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'mega-harmony', 'form-cap');
    expect(isFormCapped(lib, 'mega-harmony')).toBe(true);
    expect(isFormCapped(lib, 'mega-power')).toBe(false);
    expect(isAccountCapped(lib)).toBe(false);
    expect(cardState(lib, 'mega-harmony', ctx())).toBe('RESERVA_FINAL');
    expect(cardState(lib, 'mega-power', ctx({ reachable: false }))).toBe('DISTANTE');
  });

  it('lifetime-cap fecha a conta: TODA forma sem sprite vira RESERVA_FINAL', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'mega-harmony', 'lifetime-cap');
    expect(isAccountCapped(lib)).toBe(true);
    expect(cardState(lib, 'ultra', ctx())).toBe('RESERVA_FINAL');
  });

  it('nem um nem outro oferecem "Tentar de novo" — botão que sempre falha é pior que botão ausente', () => {
    expect(canManualRetry(recordFailure(emptySpriteLibrary(), 'ultra', 'form-cap'), 'ultra')).toBe(false);
    expect(canManualRetry(recordFailure(emptySpriteLibrary(), 'ultra', 'lifetime-cap'), 'ultra')).toBe(false);
  });
});

describe('tentativas e cooldown', () => {
  it('offline não consome tentativa nenhuma — a chamada não aconteceu', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'offline', { at: 0 });
    expect(lib.failures.rookie.attempts).toBe(0);
  });

  it('o botão manual respeita cooldown de 60 s', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { manual: true, at: 0 });
    expect(canManualRetry(lib, 'rookie', 1_000)).toBe(false);
    expect(canManualRetry(lib, 'rookie', SPRITE_MANUAL_COOLDOWN_MS)).toBe(true);
  });

  it('esgotado o teto de tentativas da forma, o cliente para de bater na porta', () => {
    let lib = emptySpriteLibrary();
    for (let i = 0; i < 3; i++) lib = recordFailure(lib, 'rookie', 'error', { at: 0 });
    expect(canManualRetry(lib, 'rookie', 10 * SPRITE_MANUAL_COOLDOWN_MS)).toBe(false);
  });

  it('um sprite que chega limpa a falha anterior daquela forma', () => {
    let lib = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { at: 0 });
    lib = recordSprite(lib, entry('rookie'), { adopt: 'now' });
    expect(lib.failures.rookie).toBeUndefined();
  });
});

describe('estados de card (§2.2)', () => {
  it('GERANDO só enquanto o lote está vivo', () => {
    expect(cardState(emptySpriteLibrary(), 'rookie', ctx({ generating: ['rookie'] }))).toBe('GERANDO');
  });

  it('OFFLINE não é falha: some quando a conexão volta', () => {
    expect(cardState(emptySpriteLibrary(), 'rookie', ctx({ online: false }))).toBe('OFFLINE');
  });

  it('RESERVA vira RESERVA_VÉSPERA quando a evolução está iminente', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-harmony', 'error');
    expect(cardState(lib, 'champion-harmony', ctx())).toBe('RESERVA');
    expect(cardState(lib, 'champion-harmony', ctx({ imminent: true }))).toBe('RESERVA_VESPERA');
  });

  it('o selo NOVO some ao ver, mas o card A-SINTONIZAR manda', () => {
    const own = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'now' });
    expect(cardState(own, 'rookie', ctx({ unseen: true }))).toBe('NOVO');
    expect(cardState(own, 'rookie', ctx())).toBe('PROPRIO');
    const ask = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'ask', dayKey: 'd' });
    expect(cardState(ask, 'rookie', ctx({ unseen: true }))).toBe('A_SINTONIZAR');
  });
});

describe('401 e 403 no acervo: nao sao teto, e nao ficam mudos', () => {
  it('`auth` e `identity` consomem tentativa mas NAO viram terminal', () => {
    for (const kind of ['auth', 'identity'] as const) {
      const lib = recordFailure(emptySpriteLibrary(), 'rookie', kind, { at: 1000 });
      expect(lib.failures.rookie.kind).toBe(kind);
      expect(lib.failures.rookie.attempts).toBe(1);
      expect(lib.failures.rookie.terminal).toBeUndefined();
      expect(isAccountCapped(lib)).toBe(false);
      expect(isFormCapped(lib, 'rookie')).toBe(false);
    }
  });

  it('o botao manual continua existindo depois do cooldown — o gesto do jogador e o conserto', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'auth', { at: 0 });
    expect(canManualRetry(lib, 'rookie', SPRITE_MANUAL_COOLDOWN_MS - 1)).toBe(false);
    expect(canManualRetry(lib, 'rookie', SPRITE_MANUAL_COOLDOWN_MS)).toBe(true);
  });

  it('cada uma tem a sua frase, e as duas pedem acoes DIFERENTES', () => {
    const a = spriteFailText('auth', 'pt-BR');
    const i = spriteFailText('identity', 'pt-BR');
    expect(a).toBeTruthy();
    expect(i).toBeTruthy();
    expect(a).not.toBe(i);
    expect(spriteFailText('auth', 'en-US')).toBeTruthy();
    expect(spriteFailText('identity', 'en-US')).toBeTruthy();
  });

  it('as falhas que ja tem card proprio seguem sem frase — nao inventar ruido', () => {
    for (const kind of ['offline', 'error', 'form-cap', 'lifetime-cap', 'daily-limit', 'budget'] as const) {
      expect(spriteFailText(kind, 'pt-BR')).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F-1 (auditoria-cliente.md) — a `url` do acervo vira `<img src>`
// ─────────────────────────────────────────────────────────────────────────────
//
// **Por que estes testes existem, e por que NÃO são testes de XSS.**
//
// O caminho é: `POST /api/save` (hoje fail-open, N-1 da `auditoria-rotas.md`)
// → `normalizeSpriteLibrary` → `displaySprite` → `<img src>` na tela principal
// (`CompanionHUD`) e na aba Evolução (`EvolutionPath`). Quem escolhe o JSON do
// save escolhe a URL que o navegador da vítima busca.
//
// O que NÃO acontece: `javascript:`, `data:text/html` e SVG-com-`<script>`
// **não executam** em `<img src>` — `<img>` não é sink de navegação e SVG só
// roteia script em contexto de documento. Chamar isto de XSS seria falso
// positivo, e a auditoria recusa esse rótulo de propósito.
//
// O que acontece: **beacon**. Uma URL sob controle do atacante dispara um GET a
// cada render, entregando IP, User-Agent, `Accept-Language` e carimbo de hora —
// e o visor **não tem estado de erro por spec** (§2.1), então uma URL que nunca
// responde é invisível para a vítima. É rastreio silencioso e persistente,
// porque mora no save da nuvem e sobrevive a logout e troca de aparelho.
//
// O conserto é do tamanho do problema: allowlist de **esquema** no ponto de
// normalização que já existe. Fechar o beacon inteiro exige allowlist de HOST,
// que depende de saber o host do provedor — declarado como próximo passo.
describe('F-1: allowlist de esquema na URL do sprite', () => {
  const hostis = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',                 // esquema é case-insensitive
    ' \n\tjavascript:alert(1)',            // o navegador apara C0/espaço antes de resolver
    'java\tscript:alert(1)',               // e ignora TAB/LF dentro do esquema
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Lz48L3N2Zz4=', // nenhum caminho legítimo produz SVG
    'http://evil.example/x.png',           // texto claro: nenhum provedor nosso usa
    'file:///C:/Windows/win.ini',
    'blob:https://evil.example/abcd',      // hoje nenhum código nosso cria blob de sprite
    '//evil.example/x.png',                // relativo a esquema: herda https e vaza igual
    '',
  ];

  it.each(hostis)('descarta a entrada com url hostil: %j', (url) => {
    const lib = normalizeSpriteLibrary({ sprites: { rookie: { url, formId: 'rookie', at: 1 } } });
    expect(lib.sprites['rookie']).toBeUndefined();
    // E o piso continua sendo a arte de reserva, nunca um erro (Invariante nº 1).
    expect(displaySprite(lib, 'rookie')).toBeNull();
  });

  // Sem estes dois o teste passaria por acidente com uma função que rejeita tudo —
  // e aí o Gemini (data URL) e o Higgsfield (URL remota) parariam em silêncio.
  const legitimas = [
    'data:image/png;base64,iVBORw0KGgo=',                 // Gemini: generate-sprite.js:137
    'data:image/jpeg;base64,/9j/4AAQ',                    // idem, outro mime do Gemini
    'https://platform.higgsfield.ai/results/abc.png',      // Higgsfield: HF_BASE
    'https://cdn/rookie.png',
  ];

  it.each(legitimas)('preserva a url legítima: %j', (url) => {
    const lib = normalizeSpriteLibrary({ sprites: { rookie: { url, formId: 'rookie', at: 1 } } });
    expect(lib.sprites['rookie']?.url).toBe(url);
    expect(displaySprite(lib, 'rookie')?.url).toBe(url);
  });

  it('a entrada hostil não contamina as irmãs — descarta UMA, mantém as outras', () => {
    const lib = normalizeSpriteLibrary({
      sprites: {
        rookie: { url: 'https://cdn/rookie.png', formId: 'rookie', at: 1 },
        ultra: { url: 'javascript:alert(1)', formId: 'ultra', at: 2 },
      },
    });
    expect(lib.sprites['rookie']).toBeDefined();
    expect(lib.sprites['ultra']).toBeUndefined();
  });

  // O outro caminho: a resposta do servidor entra no acervo por `recordSprite`
  // SEM passar por `normalizeSpriteLibrary` (useSpriteGeneration.ts:147 grava
  // `url: image` direto). Validar só na normalização deixaria essa porta aberta
  // até o primeiro reload — que é exatamente o "campo extra sobrevive à
  // tipagem TS" que a auditoria manda cobrir.
  it('recordSprite recusa url fora da allowlist e mantém o acervo intacto', () => {
    const antes = recordSprite(emptySpriteLibrary(), entry('rookie'), { adopt: 'now' });
    const depois = recordSprite(antes, { url: 'javascript:alert(1)', formId: 'ultra', at: 5 }, { adopt: 'now' });
    expect(depois.sprites['ultra']).toBeUndefined();
    expect(depois.sprites['rookie']).toBeDefined();
    expect(depois).toEqual(antes);
  });

  it('isSafeSpriteUrl é o guarda reutilizável, e responde a não-string', () => {
    expect(isSafeSpriteUrl(42)).toBe(false);
    expect(isSafeSpriteUrl(null)).toBe(false);
    expect(isSafeSpriteUrl('https://cdn/x.png')).toBe(true);
    expect(isSafeSpriteUrl('data:image/png;base64,AAA')).toBe(true);
  });
});
