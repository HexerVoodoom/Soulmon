// Shim mínimo de tipos do runtime de Workers/Pages Functions.
//
// Por que um shim e não `@cloudflare/workers-types`: o pacote não está
// instalado e acrescentá-lo mexeria em `package.json`/`package-lock.json` —
// dependência nova por causa de UMA propriedade não se paga. Aqui declaramos
// só o que o código realmente usa e que o lib DOM não conhece.
//
// `caches.default` é a cache de borda da Cloudflare (não existe na Web API
// padrão) — usada em `functions/api/community.js`.
interface CacheStorage {
  default: Cache;
}
