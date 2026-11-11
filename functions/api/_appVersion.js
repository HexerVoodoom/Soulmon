// Versão mínima/recomendada do APP NATIVO (versionCode da Play) — alimenta o modal de atualização.
// O código web é servido pelo Worker (`server.url`), então mudar isto é só deploy do Worker, sem APK novo.
// Dono muda: (a) var `APP_MIN_VERSION_CODE` / `APP_RECOMMENDED_VERSION_CODE` no painel do Worker (vale sem deploy), ou
// (b) as constantes abaixo + deploy. A var, quando numérica, vence a constante.
//   min = 0 → ninguém é forçado. recomendada = 31 (beta11) → só sugere.
export const DEFAULT_MIN_VERSION_CODE = 0;
export const DEFAULT_RECOMMENDED_VERSION_CODE = 31;

function codigo(valor, padrao) {
  const n = typeof valor === 'string' ? Number(valor.trim()) : valor;
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : padrao;
}

export function appVersionConfig(env) {
  return {
    minVersionCode: codigo(env?.APP_MIN_VERSION_CODE, DEFAULT_MIN_VERSION_CODE),
    recommendedVersionCode: codigo(env?.APP_RECOMMENDED_VERSION_CODE, DEFAULT_RECOMMENDED_VERSION_CODE),
  };
}
