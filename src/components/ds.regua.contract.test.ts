/**
 * RÉGUA DO DS PARA CÓDIGO NOVO (01/11/2026, revisão da Hexsmith pela Squad Alpha).
 *
 * Varre `src/components/**\/*.tsx` (sem testes) e reprova:
 *  · `type="checkbox"` fora do FormKit (o checkbox do sistema é o `CheckRow`);
 *  · `all: 'unset'` em estilo (apaga foco/hover/disabled do DS);
 *  · `fontSize:` numérico (fonte só por token `--sm2-text-*`);
 *  · `maxHeight` + `overflowY` num arquivo que usa `ModalSheet` (rolagem dentro de rolagem: só a folha rola).
 *
 * Quem JÁ violava em 01/11/2026 está em `EXCECOES`, CONGELADO com a contagem de cada regra: a contagem só pode cair.
 * Se cair, baixe o número aqui (o teste avisa). Arquivo novo não entra na lista — corrija o arquivo.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));

type Regra = 'checkbox' | 'unset' | 'fontSize' | 'rolagem';

const REGRAS: Record<Regra, (src: string, rel: string) => number> = {
  checkbox: (src, rel) => (rel.startsWith('form/') ? 0 : (src.match(/type=["']checkbox["']/g) ?? []).length),
  unset: (src) => (src.match(/all:\s*['"]unset['"]/g) ?? []).length,
  fontSize: (src) => (src.match(/fontSize:\s*-?\d/g) ?? []).length,
  rolagem: (src) => (/\bModalSheet\b/.test(src) ? Math.min((src.match(/maxHeight/g) ?? []).length, (src.match(/overflowY/g) ?? []).length) : 0),
};

function arquivos(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) arquivos(p, out);
    else if (n.endsWith('.tsx') && !n.includes('.test.')) out.push(p);
  }
  return out;
}

function medir(): Map<string, Partial<Record<Regra, number>>> {
  const m = new Map<string, Partial<Record<Regra, number>>>();
  for (const p of arquivos(RAIZ)) {
    const rel = relative(RAIZ, p).split(sep).join('/');
    const src = readFileSync(p, 'utf-8');
    const r: Partial<Record<Regra, number>> = {};
    for (const k of Object.keys(REGRAS) as Regra[]) { const n = REGRAS[k](src, rel); if (n > 0) r[k] = n; }
    if (Object.keys(r).length) m.set(rel, r);
  }
  return m;
}

/** CONGELADO em 01/11/2026. Só pode diminuir. */
const EXCECOES: Readonly<Record<string, Partial<Record<Regra, number>>>> = {
  'AdventureDiary.tsx': { fontSize: 1 },
  'BestiaryCollection.tsx': { fontSize: 2 },
  'BetaClosedScreen.tsx': { fontSize: 1 },
  'ConsentGate.tsx': { checkbox: 1 },
  'DailyReportModal.tsx': { fontSize: 2 },
  'DreamDex.tsx': { fontSize: 1 },
  'ElementDex.tsx': { fontSize: 1 },
  'LevelUpOverlay.tsx': { fontSize: 7 },
  'LibraryPage.tsx': { fontSize: 1 },
  'MealRhythmRows.tsx': { fontSize: 1 },
  'MorningDream.tsx': { fontSize: 1 },
  'NpcSequence.tsx': { fontSize: 2 },
  'OraclePage.tsx': { checkbox: 2, fontSize: 4 },
  'PetStageDecor.tsx': { fontSize: 2 },
  'PixelizerCard.tsx': { checkbox: 1 },
  'ProtectProgressModal.tsx': { fontSize: 1 },
  'RestSetupModal.tsx': { fontSize: 1 },
  'SoulmonOnboarding.tsx': { fontSize: 3 },
  'TalentTree.tsx': { fontSize: 2 },
  'catalog/CatalogMindNotice.tsx': { checkbox: 1 },
  'form/FormKit.tsx': { rolagem: 1 },
  'games/BattleStage.tsx': { fontSize: 8 },
  'games/GameKit.tsx': { fontSize: 1 },
  'games/ResultScreen.tsx': { fontSize: 2 },
  'guild/ClaProcurar.tsx': { checkbox: 1 },
  'guild/FeiraTrailPlay.tsx': { fontSize: 1 },
  'mercado/ShopItemSheet.tsx': { fontSize: 2 },
  'mercado/ShopShelf.tsx': { fontSize: 1 },
  'mercado/SubscriptionShelf.tsx': { fontSize: 1 },
  'nav/NpcSpeech.tsx': { fontSize: 1 },
  'onboarding/etapas/EtapaAlimentar.tsx': { fontSize: 2 },
  'onboarding/etapas/EtapaDuelo.tsx': { fontSize: 1 },
  'onboarding/etapas/EtapaPuzzle.tsx': { fontSize: 1 },
  'onboarding/intro/IntroCinematica.tsx': { fontSize: 1 },
  'onboarding/sequencia/SequenciaPlayer.tsx': { fontSize: 3 },
  'perfil/ProfileAvatarButton.tsx': { fontSize: 1 },
  'perfil/SoulmonPerfil.tsx': { fontSize: 1 },
  'play/OficinaSheet.tsx': { fontSize: 1 },
  'play/StrollFind.tsx': { fontSize: 1 },
  'ritual/RitualKit.tsx': { rolagem: 1 },
  'ui/InfoTip.tsx': { fontSize: 1, rolagem: 1 },
  'ui/OfflineSeal.tsx': { fontSize: 1 },
};

describe('régua do DS (código novo)', () => {
  const atual = medir();

  it('nenhum arquivo fora de EXCECOES viola a régua, e nenhum excede a contagem congelada', () => {
    const erros: string[] = [];
    for (const [arq, r] of atual) {
      const teto = EXCECOES[arq] ?? {};
      for (const [k, n] of Object.entries(r) as [Regra, number][]) {
        if (n > (teto[k] ?? 0)) erros.push(`${arq}: ${k} = ${n} (teto ${teto[k] ?? 0})`);
      }
    }
    expect(erros).toEqual([]);
  });

  it('a lista congelada não guarda folga (contagem caiu → baixe o número)', () => {
    const folga: string[] = [];
    for (const [arq, teto] of Object.entries(EXCECOES)) {
      for (const [k, n] of Object.entries(teto) as [Regra, number][]) {
        const agora = atual.get(arq)?.[k] ?? 0;
        if (agora < n) folga.push(`${arq}: ${k} ${n} → ${agora}`);
      }
    }
    expect(folga).toEqual([]);
  });

  it('a Hexsmith não está na lista de exceções e está limpa', () => {
    expect(Object.keys(EXCECOES).filter((k) => k.startsWith('hex/'))).toEqual([]);
    expect([...atual.keys()].filter((k) => k.startsWith('hex/'))).toEqual([]);
  });

  it('as regras pegam o que devem', () => {
    expect(REGRAS.checkbox('<input type="checkbox" />', 'x.tsx')).toBe(1);
    expect(REGRAS.checkbox('<input type="checkbox" />', 'form/FormKit.tsx')).toBe(0);
    expect(REGRAS.unset("style={{ all: 'unset' }}", 'x.tsx')).toBe(1);
    expect(REGRAS.fontSize('fontSize: 11', 'x.tsx')).toBe(1);
    expect(REGRAS.fontSize("fontSize: 'var(--sm2-text-xs)'", 'x.tsx')).toBe(0);
    expect(REGRAS.rolagem('<ModalSheet/> maxHeight: 1, overflowY', 'x.tsx')).toBe(1);
    expect(REGRAS.rolagem('maxHeight: 1, overflowY', 'x.tsx')).toBe(0);
  });
});
