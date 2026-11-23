import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * RÉGUA DOS PASSOS PELO HEALTH CONNECT (REGISTRO §283). O que se protege aqui é a SUPERFÍCIE DE PERMISSÃO (o que vai para a ficha do
 * Play e para o formulário de saúde do Console) e o feature detect (o APK antigo não tem o plugin). Guard de fonte.
 */
// sem comentários: o que vale é o que o manifesto DECLARA, não o que a prosa menciona
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const kt = readFileSync('android/app/src/main/java/com/soulmon/plugins/SoulmonStepsPlugin.kt', 'utf8');
const steps = readFileSync('src/utils/steps.ts', 'utf8');
const gradle = readFileSync('android/app/build.gradle', 'utf8');
const main = readFileSync('android/app/src/main/java/com/soulmon/MainActivity.java', 'utf8');

describe('permissão: SÓ ler passos', () => {
  it('o manifesto declara exatamente UMA permissão do Health Connect: READ_STEPS', () => {
    const usos = [...manifest.matchAll(/<uses-permission[^>]*android\.permission\.health\.([A-Z_]+)/g)].map(m => m[1]);
    expect(usos).toEqual(['READ_STEPS']);
  });

  it('nenhuma escrita, nenhum segundo plano, nenhum histórico', () => {
    expect(manifest).not.toMatch(/permission\.health\.WRITE_/);
    expect(manifest).not.toContain('READ_HEALTH_DATA_IN_BACKGROUND');
    expect(manifest).not.toContain('READ_HEALTH_DATA_HISTORY');
  });

  it('o plugin nativo só pede READ_STEPS e só agrega o total (sem série, sem registros crus)', () => {
    expect([...kt.matchAll(/android\.permission\.health\.([A-Z_]+)/g)].map(m => m[1])).toEqual(['READ_STEPS']);
    expect(kt).toContain('StepsRecord.COUNT_TOTAL');
    expect(kt).not.toMatch(/readRecords|insertRecords|ReadRecordsRequest/);
  });

  it('a tela de racional exigida pelo Health Connect existe (sem ela o diálogo de permissão não abre)', () => {
    expect(manifest).toContain('androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE');
    expect(manifest).toContain('android.intent.action.VIEW_PERMISSION_USAGE');
  });

  it('o Google Fit continua proibido: nenhuma dependência dele', () => {
    expect(gradle).not.toMatch(/play-services-fitness|play-services-fit/);
  });
});

describe('feature detect: o APK antigo não tem o plugin', () => {
  it('o plugin é registrado na MainActivity e a dependência está no gradle', () => {
    expect(main).toContain('registerPlugin(SoulmonStepsPlugin.class)');
    expect(gradle).toContain('androidx.health.connect:connect-client');
  });

  it('o JS só toca no plugin depois de `Capacitor.isPluginAvailable("SoulmonSteps")`, e só em utils/steps.ts', () => {
    expect(steps).toContain("Capacitor.isPluginAvailable('SoulmonSteps')");
    const fora = ['src/App.tsx', 'src/components/StepsCard.tsx', 'src/components/StepsInviteModal.tsx'].filter(f => readFileSync(f, 'utf8').includes('SoulmonSteps.'));
    expect(fora).toEqual([]);
  });

  it('nenhuma função de passos devolve HP, energia, dia perfeito ou peso (passos nunca pontuam sozinhos)', () => {
    expect(steps).not.toMatch(/perfectDays\s*[:=]|hearts\s*[:=]|energy\s*[:=]/);
  });
});
