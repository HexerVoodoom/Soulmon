import { describe, it, expect } from 'vitest';
import { isAllowedPushEndpoint } from './_pushTargets.js';

// O endpoint de push vira `fetch()` do worker, 4×/dia por um ano, com um JWT
// VAPID assinado pela chave de produção no cabeçalho. Antes desta allowlist,
// qualquer string era aceita.

describe('endpoints de push aceitos', () => {
  it('aceita os serviços de push reais', () => {
    for (const url of [
      'https://fcm.googleapis.com/fcm/send/abc123',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAA',
      'https://wns2-by3p.notify.windows.com/w/?token=xyz',
      'https://web.push.apple.com/QABC123',
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(true);
    }
  });
});

describe('endpoints recusados', () => {
  it('recusa host arbitrário — o SSRF original', () => {
    expect(isAllowedPushEndpoint('https://atacante.example/coleta')).toBe(false);
  });

  it('recusa protocolo que não seja HTTPS', () => {
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/x')).toBe(false);
    expect(isAllowedPushEndpoint('file:///etc/passwd')).toBe(false);
    expect(isAllowedPushEndpoint('data:text/plain,x')).toBe(false);
  });

  it('recusa porta explícita — alvo interno disfarçado', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com:8080/x')).toBe(false);
  });

  it('recusa outros serviços do googleapis.com — só fcm. é endpoint de push', () => {
    // O sufixo era `googleapis.com` inteiro, então estes passavam e viravam
    // alvo de 4 POSTs/dia por um ano, com JWT VAPID de produção no cabeçalho.
    for (const url of [
      'https://googleapis.com/qualquer',
      'https://storage.googleapis.com/bucket/objeto',
      'https://firebasestorage.googleapis.com/v0/b/x/o',
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(false);
    }
  });

  it('recusa sufixo colado, não domínio de verdade', () => {
    // O motivo de a comparação ser por RÓTULO e não por `endsWith` na string:
    // todos estes terminam com um host da lista e nenhum pertence a ela.
    for (const url of [
      'https://googleapis.com.atacante.net/x',
      'https://evil-googleapis.com/x',
      'https://notgoogleapis.com/x',
      'https://push.apple.com.evil.io/x',
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(false);
    }
  });

  it('recusa lixo, vazio e não-string', () => {
    for (const v of ['', 'nem-url', null, undefined, 42, {}, 'https://' + 'a'.repeat(3000)]) {
      expect(isAllowedPushEndpoint(v)).toBe(false);
    }
  });

  it('recusa endereço interno e loopback', () => {
    for (const url of [
      'https://127.0.0.1/x',
      'https://localhost/x',
      'https://10.0.0.5/admin',
      'https://169.254.169.254/latest/meta-data/',
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(false);
    }
  });
});
