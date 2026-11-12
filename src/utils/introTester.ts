import { setIntroTester } from '../components/onboarding/sequencia/flagIntro';

/** Pergunta ao servidor se o usuário logado está no teste da intro narrativa e aplica o resultado. Nunca lança; falha = desligado. */
export async function refreshIntroTester(idToken: string | null | undefined): Promise<boolean> {
  let on = false;
  try {
    if (idToken) {
      const r = await fetch('/api/intro-teste', { headers: { Authorization: `Bearer ${idToken}` } });
      on = r.ok && (await r.json())?.tester === true;
    }
  } catch { on = false; }
  setIntroTester(on);
  return on;
}
