/**
 * A FRONTEIRA DA ASSINATURA COSMÉTICA (D10, `docs/ASSINATURA-SPEC.md`, threat-model R5).
 *
 * A regra mais importante da spec cabe numa frase: **a vigência da assinatura
 * (`subUntil`) só destrava a vitrine do trimestre e NUNCA é lida por regra de
 * jogo.** Uma frase sem teste vira intenção; este arquivo a transforma em
 * reprovação.
 *
 * Como funciona: varre `functions/`, `workers/` e `src/` (sem testes, sem
 * comentários) atrás dos símbolos da assinatura. Só os arquivos da ALLOWLIST
 * podem citá-los. Arquivo novo que cite um deles falha aqui — e a pessoa que
 * mexeu tem que decidir, com a spec aberta, se aquilo é vitrine (entra na
 * allowlist, com justificativa) ou regra de jogo (não pode).
 *
 * Os arquivos de regra nominados em R5 (combate, vínculo, portões, forja…) são
 * checados também por nome, para um renome não esvaziar a checagem em silêncio.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** Símbolos que só a vitrine/servidor da assinatura podem tocar. */
const TOKENS = new RegExp([
  String.raw`\bsubUntil\b`, String.raw`\bsubActive\b`, String.raw`\bsubscriptionActive\b`,
  String.raw`\bSUBSCRIPTION_(?:ITEMS|SKU|QUARTER)\b`,
  String.raw`\bisSubscription\w*`, String.raw`\bapplySubscription\w*`, String.raw`\bsubscriptionClaim\w*`,
  String.raw`\b(?:use|get)SubscriptionStatus\b`, String.raw`\bsetSubscriptionFromEntitlement\b`,
  String.raw`\bent\.sub\b`, String.raw`\bsubscriptionsv2\b`,
  String.raw`['"]subscription['"]`,
].join('|'));

/** Quem PODE citar, e por quê. Entrada nova pede justificativa por escrito. */
const ALLOWLIST: Record<string, string> = {
  // servidor — onde a Google é consultada e a vigência é gravada
  'functions/api/_billing.js': 'catálogo + verificação na Google (subscriptionsv2)',
  'functions/api/_entitlements.js': 'grava e expõe a vigência (ent.sub / publicView)',
  'functions/api/billing.js': 'rota de verificação da assinatura',
  'functions/api/rtdn.js': 'endpoint RTDN (Pub/Sub): reconsulta e fecha a vitrine',
  // cliente — vitrine, tela de Configurações e a ponte de compra
  'src/utils/shop.ts': 'catálogo do trimestre + UnlockReq { kind: "subscription" }',
  'src/utils/shopBuy.ts': 'recusa a COMPRA com moeda de item da assinatura',
  'src/utils/missions.ts': 'isShopItemUnlocked: o cadeado da vitrine',
  'src/utils/subscription.ts': 'store da vigência + divulgação',
  'src/utils/subscriptionShop.ts': 'o resgate de graça',
  'src/utils/entitlements.ts': 'espelho somente-leitura do que o servidor disse',
  'src/utils/playBilling.ts': 'ponte com o plugin de compra',
  'src/components/SubscriptionSection.tsx': 'Configurações: divulgação, assinar, gerenciar',
  'src/components/mercado/SubscriptionShelf.tsx': 'a vitrine "Do trimestre"',
  'src/components/mercado/ShopShelf.tsx': 'tipos de ShopOwnership/ShopActions (props da vitrine)',
  'src/App.tsx': 'ligação fina (ver teste das linhas abaixo)',
};

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.wrangler', 'vendor', 'assets']);
const CODE = /\.(?:[cm]?[jt]sx?)$/;
const isTest = (p: string) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(p) || /\.testkit\./.test(p) || /\.d\.ts$/.test(p);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (CODE.test(name) && !isTest(name)) out.push(full);
  }
  return out;
}

/** Tira comentários (de bloco e de linha), preservando strings e URLs `://`. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\w])\/\/.*$/gm, '$1');
}

const rel = (p: string) => relative(ROOT, p).split(sep).join('/');
const files = ['functions', 'workers', 'src'].flatMap(d => walk(join(ROOT, d))).map(rel);

describe('R5 — vigência da assinatura nunca é lida por regra de jogo', () => {
  it('a varredura enxerga arquivos de verdade (não passa por estar vazia)', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files).toContain('functions/api/_entitlements.js');
    expect(files).toContain('src/App.tsx');
  });

  it('só a allowlist cita os símbolos da assinatura', () => {
    const violacoes: string[] = [];
    for (const f of files) {
      if (f in ALLOWLIST) continue;
      const hit = TOKENS.exec(stripComments(read(f)));
      if (hit) violacoes.push(`${f}: "${hit[0]}"`);
    }
    expect(violacoes, `Arquivo fora da allowlist citando a assinatura. Se é vitrine, justifique em ALLOWLIST; se é regra de jogo, NÃO PODE (docs/ASSINATURA-SPEC.md):\n${violacoes.join('\n')}`).toEqual([]);
  });

  it('todo arquivo da allowlist existe (renome não esvazia a checagem)', () => {
    for (const f of Object.keys(ALLOWLIST)) expect(existsSync(join(ROOT, f)), f).toBe(true);
  });

  it('as regras de jogo nominadas em R5 existem e estão limpas', () => {
    const regras = [
      'functions/api/_combate.js', 'functions/api/_duel.js', 'functions/api/_bond.js', 'functions/api/_gates.js',
      'functions/api/_soulXP.js', 'functions/api/_talents.js', 'functions/api/_equipment.js', 'functions/api/_forge.js',
      'functions/api/_mealRhythm.js', 'functions/api/_aiGuard.js', 'functions/api/save.js', 'functions/api/entitlements.js',
      'src/utils/combat.ts', 'src/utils/careCaps.ts', 'src/utils/evolution.ts', 'src/utils/equipment.ts', 'src/utils/currencies.ts',
      'src/utils/monetization.ts', 'src/utils/seasons.ts',
    ].filter(f => existsSync(join(ROOT, f)));
    expect(regras.length).toBeGreaterThanOrEqual(10);
    for (const f of regras) expect(TOKENS.test(stripComments(read(f))), f).toBe(false);
  });

  it('App.tsx só liga a vitrine: toda linha com símbolo da assinatura tem uma das formas esperadas', () => {
    const permitidas = [
      /^\s*import .* from '\.\/utils\/(?:subscription|subscriptionShop|playBilling)';?\s*$/,
      /\bsetSubscriptionFromEntitlement\(ent\);/,
      /\breconcileSubscription\(SUBSCRIPTION_SKU\)\.then\(/,
      /\bconst subscription = useSubscriptionStatus\(\);/,
      /\bisShopItemUnlocked\(item, missionProgress, subscription\.active\)/,
      /\bapplySubscriptionClaim\(gameState, item, subscription\.active\)\.refused/,
      /\bsetGameState\(prev => applySubscriptionClaim\(prev, item, subscription\.active\)\.state\);/,
      /\}, \[gameState, missionProgress, subscription\.active, refuseDemo\]\);/,
      /\bsubscriptionActive: subscription\.active,/,
      /onClaimSubscription: handleClaimSubscription/,
    ];
    const linhas = stripComments(read('src/App.tsx')).split(/\r?\n/).filter(l => TOKENS.test(l));
    expect(linhas.length).toBeGreaterThan(0);
    const fora = linhas.filter(l => !permitidas.some(re => re.test(l)));
    expect(fora, `App.tsx leu a assinatura fora da vitrine:\n${fora.join('\n')}`).toEqual([]);
  });

  it('a vigência nunca entra no GameState nem no save', () => {
    const ctx = stripComments(read('src/contexts/GameStateContext.tsx'));
    expect(/\bsub(?:Until|Active)\b|\bsubscription/i.test(ctx)).toBe(false);
    const save = stripComments(read('functions/api/save.js'));
    expect(/\bsub(?:Until|Active)\b/.test(save)).toBe(false);
  });
});

describe('o catálogo do servidor não concede nada de jogo pela assinatura', () => {
  it('PRODUCTS: assinatura com grantTier null e grantCredits 0, e nenhum outro SKU virou assinatura', async () => {
    const caminho = '../../functions/api/_billing.js'; // variável: o arquivo é JS do servidor, sem .d.ts
    const { PRODUCTS, SUBSCRIPTION_SKU } = await import(/* @vite-ignore */ caminho) as { PRODUCTS: Record<string, { kind?: string }>; SUBSCRIPTION_SKU: string };
    expect(PRODUCTS[SUBSCRIPTION_SKU]).toMatchObject({ kind: 'subscription', grantTier: null, grantCredits: 0 });
    const subs = Object.entries(PRODUCTS).filter(([, p]) => (p as { kind?: string }).kind === 'subscription');
    expect(subs.map(([id]) => id)).toEqual([SUBSCRIPTION_SKU]);
  });
});

describe('Android — SUBS entra, INAPP fica intacto', () => {
  const kt = read('android/app/src/main/java/com/soulmon/plugins/BillingPlugin.kt');

  it('suporta SUBS: oferta base (sem fase grátis), offerToken, reconciliação e acknowledge', () => {
    expect(kt).toContain('ProductType.SUBS');
    expect(kt).toContain('setOfferToken');
    expect(kt).toMatch(/offer\.offerId == null/); // nunca escolhe oferta/teste grátis
    expect(kt).toMatch(/phases\.size == 1/);
    expect(kt).toContain('queryPurchasesAsync');
    expect(kt).toMatch(/findOwned\(token, listOf\(BillingClient\.ProductType\.INAPP, BillingClient\.ProductType\.SUBS\)\)/);
    expect(kt).toContain('setObfuscatedAccountId');
  });

  it('INAPP continua sendo o padrão (sem productType = produto único)', () => {
    expect(kt).toContain('BillingClient.ProductType.INAPP');
    expect(kt).toMatch(/if \(call\.getString\("productType"\) == "subs"\) BillingClient\.ProductType\.SUBS else BillingClient\.ProductType\.INAPP/);
    expect(kt).toContain('fun consume(');
    expect(kt).toContain('fun getPurchases(');
    expect(kt).toContain('fun acknowledge(');
  });
});

describe('D1 — a migração da assinatura', () => {
  it('0003 existe, é numerada em sequência e declara a tabela de idempotência do RTDN', () => {
    const nomes = readdirSync(join(ROOT, 'migrations')).filter(n => n.endsWith('.sql')).sort();
    expect(nomes.map(n => n.slice(0, 4))).toEqual(['0001', '0002', '0003']);
    const sql = read('migrations/0003_rtdn_messages.sql');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS rtdn_messages/);
    expect(sql).toMatch(/message_id\s+TEXT PRIMARY KEY/);
    expect(sql).toMatch(/Linhas existentes/i);
  });
});

describe('documentação e textos jurídicos', () => {
  it('ASSINATURA-SPEC: estado implementado e a correção do escopo da service account', () => {
    const spec = read('docs/ASSINATURA-SPEC.md');
    expect(spec).toMatch(/Implementado/);
    expect(spec).not.toMatch(/outro escopo de service account/);
    expect(spec).toMatch(/mesmo escopo/);
    expect(spec).toContain('subscriptionsv2');
  });

  it('BILLING-SETUP traz o passo a passo do Console e as envs do RTDN', () => {
    const doc = read('docs/BILLING-SETUP.md');
    for (const s of [
      'soulmon_cosmetic_quarterly', 'RTDN_AUDIENCE', 'RTDN_PUSH_SA_EMAIL', 'pubsub.publisher',
      'google-play-developer-notifications@system.gserviceaccount.com', '/api/rtdn', 'free trial',
      'migrations apply',
    ]) expect(doc, s).toContain(s);
  });

  // Até 11/10/2026 este teste exigia que os trechos ficassem EM COMENTÁRIO
  // (rascunho). O dono decidiu publicá-los para o beta (REGISTRO, DEPENDE-DE-VOCE
  // D2b): agora o contrato é o inverso — publicados, fora de comentário, PT e EN,
  // sem marcador de decisão pendente, e com a versão dos termos/privacidade subida.
  it('termos e privacidade: trechos da assinatura PUBLICADOS (fora de comentário), PT+EN, sem pendência', () => {
    const semComentario = (h: string) => h.replace(/<!--[\s\S]*?-->/g, '');
    const termos = semComentario(read('public/termos.html'));
    expect(termos).toMatch(/<h2>4b\. Subscription/);
    expect(termos).toMatch(/<h2>4b\. Assinatura/);
    const priv = semComentario(read('public/privacidade.html'));
    expect(priv).toMatch(/<h2>6b\. Subscription/);
    expect(priv).toMatch(/<h2>6b\. Assinatura/);
    expect(priv).toMatch(/<h2>6c\. Crash diagnostics/);
    expect(priv).toMatch(/<h2>6c\. Diagnóstico de falhas/);
    for (const f of ['public/termos.html', 'public/privacidade.html']) {
      const html = read(f);
      expect(html, f).not.toMatch(/RASCUNHO — dono aprova/);
      expect(html, f).not.toMatch(/\[dono decide/);
    }
    const consent = read('src/utils/consent.ts');
    expect(consent).toMatch(/TERMS_VERSION = '2026-10-11'/);
    expect(consent).toMatch(/PRIVACY_VERSION = '2026-10-11'/);
  });
});
