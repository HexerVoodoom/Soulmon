import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Rodada 5, lane C (REGISTRO §176): o Health Connect dos passos é SÓ leitura, SÓ passos, SÓ com opt-in, e a ficha/política
// andam junto. Nenhum teste em `node` alcança o Kotlin; esta régua lê o FONTE (como `widgetSemCobranca`).
const ler = (p: string) => readFileSync(p, 'utf8');
const semComentarios = (f: string) => f.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');

const manifest = semComentarios(ler('android/app/src/main/AndroidManifest.xml'));
const plugin = semComentarios(ler('android/app/src/main/java/com/soulmon/plugins/SoulmonHealthPlugin.kt'));
const gradle = ler('android/app/build.gradle');
const main = ler('android/app/src/main/java/com/soulmon/MainActivity.java');
const privacidade = ler('public/privacidade.html');
const playDs = ler('docs/PLAY-DATA-SAFETY.md');
const claude = ler('CLAUDE.md');
const steps = ler('src/utils/steps.ts');
const app = ler('src/App.tsx');

describe('Health Connect dos passos: só leitura, só passos', () => {
  it('o manifesto pede READ_STEPS e mais nada de saúde', () => {
    expect(manifest).toMatch(/android\.permission\.health\.READ_STEPS/);
    const saude = manifest.match(/android\.permission\.health\.[A-Z_]+/g) ?? [];
    expect(saude).toEqual(['android.permission.health.READ_STEPS']);
    expect(manifest).not.toMatch(/READ_HEALTH_DATA_IN_BACKGROUND/);
    expect(manifest).not.toMatch(/health\.WRITE_/);
  });
  it('declara o provedor em <queries> e as duas portas de "por que o app lê passos"', () => {
    expect(manifest).toMatch(/<queries>[\s\S]*com\.google\.android\.apps\.healthdata[\s\S]*<\/queries>/);
    expect(manifest).toMatch(/androidx\.health\.ACTION_SHOW_PERMISSIONS_RATIONALE/);
    expect(manifest).toMatch(/android\.intent\.action\.VIEW_PERMISSION_USAGE/);
    expect(manifest).toMatch(/android\.intent\.category\.HEALTH_PERMISSIONS/);
    expect(manifest).toMatch(/START_VIEW_PERMISSION_USAGE/);
  });
  it('o plugin só LÊ o agregado de passos: nada de escrita, série ou segundo plano', () => {
    expect(plugin).toMatch(/getReadPermission\(StepsRecord::class\)/);
    expect(plugin).toMatch(/StepsRecord\.COUNT_TOTAL/);
    expect(plugin).not.toMatch(/getWritePermission|insertRecords|updateRecords|deleteRecords|readRecords|WorkManager|Service\b/);
  });
  it('está registrado e a dependência existe; versionCode subiu do 22', () => {
    expect(main).toMatch(/registerPlugin\(SoulmonHealthPlugin\.class\)/);
    expect(gradle).toMatch(/androidx\.health\.connect:connect-client/);
    expect(Number(/versionCode (\d+)/.exec(gradle)![1])).toBeGreaterThanOrEqual(23);
  });
});

describe('o aviso e o consentimento andam com o dado', () => {
  it('o JS faz feature detect e nunca pede permissão sem o cartão', () => {
    expect(steps).toMatch(/isPluginAvailable\('SoulmonHealth'\)/);
    expect(app).toMatch(/stepsAskPending/);
    // o diálogo do sistema só sai do "sim" do cartão
    expect(app.match(/requestStepsPermission\(\)/g)?.length).toBe(1);
  });
  it('a política cobre READ_STEPS em EN e PT e a ficha do Play foi atualizada', () => {
    expect(privacidade).toMatch(/id="steps"/);
    expect(privacidade).toMatch(/id="passos"/);
    expect(privacidade.match(/READ_STEPS/g)?.length).toBe(2);
    expect(playDs).toMatch(/READ_STEPS/);
    expect(playDs).not.toMatch(/não é o Health\s+Connect/);
  });
  it('a revogação da linha vermelha está registrada no CLAUDE.md', () => {
    expect(claude).toMatch(/REVOGADA pelo dono em 26\/10\/2026/);
    expect(claude).toMatch(/Health Connect/);
  });
});
