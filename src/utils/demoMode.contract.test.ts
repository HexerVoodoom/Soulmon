/**
 * RÉGUA DE FIAÇÃO DA DEMO LOCAL (07/10/2026) — `utils/demoMode.ts`.
 *
 * "Salva só local, não ganha XP, não faz compras, não entra em PvP" são quatro
 * regras que moram em PONTOS espalhados (a gravação na nuvem, o XP, as portas de
 * compra, os prédios sociais). Cada ponto lê o MESMO predicado, `isDemoMode`. Um
 * teste de comportamento prova cada ponto que existe hoje (`demoMode.test.ts`);
 * ESTE reprova o ponto que ainda não existe:
 *
 *  1. cada ponto de fiação conhecido continua lendo o predicado (se alguém tirar
 *     o `if`, fica vermelho aqui, sem depender de um teste de comportamento);
 *  2. quem ESCREVE `totalXP`, grava na nuvem, chama o billing ou fala com a
 *     comunidade e NÃO está na lista de fiados nem na de isentos (com o motivo)
 *     reprova — o arquivo novo tem de ler o predicado ou entrar na lista de
 *     isentos DE PROPÓSITO, com a razão escrita;
 *  3. ninguém compara `demoLocal` à mão fora dos donos (footgun 9).
 *
 * É o mesmo molde de `playerDay.contract.test.ts`: lê o FONTE, porque o `App`
 * inteiro não monta em jsdom.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = join(__dirname, '..');
const ler = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { arquivos(p, out); continue; }
    if (!/\.(ts|tsx)$/.test(nome) || /\.test\.|\.d\.ts$|\.testkit\./.test(nome)) continue;
    out.push(relative(SRC, p).split(sep).join('/'));
  }
  return out;
}
const FONTES = arquivos(SRC).filter(f => !f.startsWith('test/'));

/** Cada ponto conhecido e o trecho que prova que ele lê o predicado. */
const FIACAO: Array<{ arquivo: string; regra: string; trechos: string[] }> = [
  { arquivo: 'utils/bond.ts', regra: 'XP: awardBondXP é no-op', trechos: ['if (isDemoMode(state)) return state;'] },
  { arquivo: 'utils/careRules.ts', regra: 'XP: comer não rende Vínculo', trechos: ['isDemoMode(state) ? state.totalXP'] },
  { arquivo: 'utils/cloudSave.ts', regra: 'nuvem: cloudSave, cloudSaveComRetry e reconcileSaveId recusam', trechos: ['if (ehDemo(state)) return RECUSA_DEMO;', 'if (ehDemo(estadoLocal))'] },
  { arquivo: 'contexts/GameStateContext.tsx', regra: 'nuvem: o efeito de salvar para antes do POST e do saveId; hydrate lê demoLocal', trechos: ['if (isDemoMode(gameState)) return;', 'demoLocal: loadedState.demoLocal === true'] },
  { arquivo: 'App.tsx', regra: 'compras: loja, câmbio, pacotes, anúncio, desbloqueio, créditos, sumidouro de Bits; aviso de proteger o save', trechos: [
    'const demo = isDemoMode(gameState);',
    'if (reason && demo) { refuseDemo(); return; }',
    'if (isDemoMode(gameState)) { refuseDemo(); return false; }',
    'if (demo) { refuseDemo(); return false; }',
    'if (demo) { refuseDemo(); return; }',
    'if (demo) return;',
    'demo={demo}',
  ] },
  { arquivo: 'components/nav/AreaView.tsx', regra: 'PvP/comunidade: prédios sociais inertes', trechos: ['isDemoBlockedLot(area, lotId)'] },
  { arquivo: 'components/TalentTree.tsx', regra: 'compras: refazer a árvore gasta Bits', trechos: ['isDemoMode(gameState)'] },
  { arquivo: 'components/ForgeCard.tsx', regra: 'compras: a forja gasta Bits/fragmentos', trechos: ['isDemoMode(gameState)'] },
  { arquivo: 'components/SettingsPage.tsx', regra: 'nuvem/conta: Configurações troca conta e dados pelo cartão da demo', trechos: ['demo?: { onLeave: () => void }', '{!demo && ('] },
  { arquivo: 'components/SoulmonOnboarding.tsx', regra: 'o botão DEMO do portão', trechos: ['data-demo-button', 'onStartDemo'] },
];

describe('1. cada ponto de fiação continua lendo o predicado', () => {
  for (const f of FIACAO) {
    it(`${f.arquivo} — ${f.regra}`, () => {
      const src = ler(f.arquivo);
      for (const t of f.trechos) expect(src, `${f.arquivo} perdeu: ${t}`).toContain(t);
    });
  }

  it('o `App` pega TODA porta de compra: cada handler de dinheiro/Bits abre com o predicado', () => {
    const app = ler('App.tsx');
    for (const handler of ['handleExchangeCredits', 'handleShopBuy', 'handleBuyCreditPack', 'handleWatchAd']) {
      const i = app.indexOf(`const ${handler} = useCallback(`);
      expect(i, `${handler} sumiu do App`).toBeGreaterThan(-1);
      const corpo = app.slice(i, i + 900);
      expect(corpo, `${handler} não confere a demo`).toContain('isDemoMode(gameState)');
    }
  });

  it('o convite de compra (UnlockNudge) não monta na demo, e o relatório e o teto de criação não o oferecem', () => {
    const app = ler('App.tsx');
    expect(app).toContain("labTab === 'evolution' && gameState.demoCharacterId && !demo");
    expect(app).toContain("rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId && !demo");
    expect(app).toContain('showOffer={mostraOfertaNoRelatorio && !demo}');
    expect(app).toContain("capIsDemoBoundary={gameState.accountTier === 'demo' && !demo}");
  });

  it('a lista dos prédios sociais cobre o PvP, o ranking e a comunidade', () => {
    const area = ler('components/nav/AreaView.tsx');
    // Os seis lotes existem de verdade no mapa — a lista da demo não pode apontar para um id que sumiu.
    const copy = ler('utils/areaSheetCopy.ts');
    for (const [, ids] of Object.entries({ arena: ['torneio', 'duelo', 'feira'], hall: ['biblioteca', 'amigos', 'guilda'] })) {
      for (const id of ids) expect(copy, `lote ${id}`).toContain(`id: '${id}'`);
    }
    expect(area).toContain('demoBlocks(l.id)');
  });
});

describe('2. ponto novo sem o predicado reprova', () => {
  const lerFonte = (f: string) => ler(f);
  const usaPredicado = (f: string) => /\bisDemoMode\b|\bisDemoBlockedLot\b|\behDemo\b/.test(lerFonte(f));

  it('quem ESCREVE `totalXP` lê o predicado (ou é isento, com motivo)', () => {
    const ISENTOS: Record<string, string> = {
      'contexts/GameStateContext.tsx': 'carga do save e save novo (zero) — não é ganho',
      'utils/demoStart.ts': 'monta o save da demo: grava o mínimo do nível 5',
    };
    const escritores = FONTES.filter(f => /totalXP:[^\n]*\+|\.totalXP\s*\+=/.test(lerFonte(f)));
    expect(escritores.length, 'a regra de varredura ficou cega').toBeGreaterThanOrEqual(2);
    const sem = escritores.filter(f => !usaPredicado(f) && !(f in ISENTOS));
    expect(sem, `escreve totalXP sem ler isDemoMode: ${sem.join(', ')}`).toEqual([]);
  });

  it('quem GRAVA na nuvem lê o predicado (ou é isento, com motivo)', () => {
    const ISENTOS: Record<string, string> = {
      'App.tsx': 'handleProtectProgress/login: só alcançáveis fora da demo (aviso de proteger some; Configurações troca a conta pelo cartão da demo; cloudSave recusa o save demo de qualquer jeito)',
    };
    const gravadores = FONTES.filter(f => /\bcloudSave(?:ComRetry)?\(/.test(lerFonte(f)));
    expect(gravadores.length).toBeGreaterThanOrEqual(2);
    const sem = gravadores.filter(f => !usaPredicado(f) && !(f in ISENTOS));
    expect(sem, `grava na nuvem sem ler isDemoMode: ${sem.join(', ')}`).toEqual([]);
  });

  it('quem chama o billing / entitlements lê o predicado ou é isento (com motivo)', () => {
    const ISENTOS: Record<string, string> = {
      'utils/entitlements.ts': 'a definição do cliente HTTP (o servidor exige conta)',
      'utils/playBilling.ts': 'a definição da ponte com a Play',
      'utils/monetization.ts': 'o scaffold de produtos/preços (não executa compra)',
      'components/UnlockAccountModal.tsx': 'só abre por `setUnlockReason`, que recusa na demo',
      'components/CreditsModal.tsx': 'só abre por `openCredits`, que recusa na demo',
      'components/AccountSection.tsx': 'login em Configurações — a demo troca a seção pelo cartão da demo',
      'components/SoulmonOnboarding.tsx': 'o desbloqueio do portão é ANTES de existir uma demo (a demo pula o onboarding)',
    };
    const chamadores = FONTES.filter(f => /\b(?:spendCredits|claimAdReward|purchaseFullUnlock)\(|\bpurchase\(/.test(lerFonte(f)));
    expect(chamadores.length).toBeGreaterThanOrEqual(2);
    const sem = chamadores.filter(f => !usaPredicado(f) && !(f in ISENTOS));
    expect(sem, `compra sem ler isDemoMode: ${sem.join(', ')}`).toEqual([]);
  });

  it('quem fala com a COMUNIDADE (PvP, ranking, Guilda) é um prédio bloqueado, um dono, ou entrou na lista de propósito', () => {
    // Todo arquivo que importa `utils/community` — as superfícies sociais. Elas só são alcançadas pelos
    // prédios de `DEMO_BLOCKED_LOTS` (inertes na demo) ou por código de conta; arquivo NOVO que importe
    // `community` tem de ser ligado à demo e entrar aqui, com a razão.
    const CONHECIDOS: Record<string, string> = {
      'utils/community.ts': 'o cliente HTTP — o servidor exige token de conta',
      'contexts/GameStateContext.tsx': 'publica o perfil — o efeito de salvar para antes, na demo',
      'App.tsx': 'orquestra; os prédios chegam por AreaView (bloqueado na demo)',
      'components/nav/AreaView.tsx': 'só TIPOS; é quem bloqueia os prédios',
      'components/TournamentPage.tsx': 'prédio `arena.torneio` — bloqueado na demo',
      'components/LibraryPage.tsx': 'prédio `hall.biblioteca`/`hall.amigos` — bloqueado na demo',
      'components/PlayerDetailModal.tsx': 'aberto só dentro da Biblioteca/Torneio (bloqueados)',
      'components/guild/FeiraVisor.tsx': 'prédio `arena.feira` — bloqueado na demo',
      'components/guild/GuildSheet.tsx': 'prédios `arena.feira`/`hall.guilda` — bloqueados na demo',
      'components/guild/GroveVisor.tsx': 'prédio `hall.guilda` — bloqueado na demo',
      'components/perfil/ProfileEditor.tsx': 'só abre em Configurações > Perfil; o perfil público só sobe com PvP ligado (nunca na demo)',
      'hooks/useGroveWatch.ts': 'só consulta quem já tem memória de roda no aparelho — a demo não tem (Guilda bloqueada)',
    };
    // Só import de VALOR conta: `import type` não executa nada (fairArt, groveLocal, groveStage, guildCopy e
    // libraryNpcs só pegam tipos do cliente HTTP).
    const importadores = FONTES.filter(f => /^import\s+(?!type\b)[^;]*?from\s+'[^']*\/community'/m.test(lerFonte(f)));
    expect(importadores.length).toBeGreaterThanOrEqual(5);
    const novos = importadores.filter(f => !(f in CONHECIDOS) && !usaPredicado(f));
    expect(novos, `fala com a comunidade sem estar ligado à demo: ${novos.join(', ')}`).toEqual([]);
    // E a lista de conhecidos não pode apontar para arquivo que sumiu.
    for (const f of Object.keys(CONHECIDOS)) expect(FONTES, `${f} sumiu`).toContain(f);
  });
});

describe('3. ninguém compara `demoLocal` à mão', () => {
  it('só o dono do predicado, quem monta o save, o hydrate e a leitura de tipo mencionam o campo', () => {
    const PERMITIDOS = new Set([
      'utils/demoMode.ts',                 // o predicado
      'utils/demoStart.ts',                // monta o save
      'contexts/GameStateContext.tsx',     // o campo e o hydrate
      'utils/bond.ts', 'utils/careRules.ts', // a fatia estrutural que passa o save ao predicado
    ]);
    const fora = FONTES.filter(f => /\bdemoLocal\b/.test(ler(f)) && !PERMITIDOS.has(f));
    expect(fora, `compara demoLocal sem passar por isDemoMode: ${fora.join(', ')}`).toEqual([]);
  });
});
