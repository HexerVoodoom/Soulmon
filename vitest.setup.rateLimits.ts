// Isolamento entre testes do estado em MEMÓRIA dos rate limits
// (`functions/api/_rateLimit.js`): no Worker ele vive por isolate; na suíte, o
// mesmo módulo atravessa os testes de um arquivo e um teto por minuto
// (`perMinute` do chat/transcrição, release/beta-1) vazaria de um teste para o
// outro. Zerar antes de cada teste = cada teste começa num isolate novo.
import { beforeEach } from 'vitest';
import { resetRateLimits } from './functions/api/_rateLimit.js';

beforeEach(() => { resetRateLimits(); });
