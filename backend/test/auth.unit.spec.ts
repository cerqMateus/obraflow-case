import { LoginRateLimit } from '../src/modules/auth/login-rate-limit';
import { configuration } from '../src/infrastructure/configuration';

describe('Login rate window', () => {
  it('counts every attempt, isolates IPs and permits a new window after 15 minutes', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const limiter = new LoginRateLimit();
    // Only the header operation is used; the real HTTP suite verifies its transport.
    const response = { setHeader: jest.fn() };
    const check = (ip: string) => limiter.check(ip, response);
    try {
      for (let count = 0; count < 10; count += 1) check('192.0.2.1');
      expect(() => check('192.0.2.1')).toThrow('Muitas tentativas');
      expect(response.setHeader).toHaveBeenCalledWith('Retry-After', 900);
      expect(() => check('192.0.2.2')).not.toThrow();
      clock.mockReturnValue(901000);
      expect(() => check('192.0.2.1')).not.toThrow();
    } finally { clock.mockRestore(); }
  });
});

describe('Restricted proxy configuration', () => {
  const env = { APP_ENV: 'test', APP_ORIGIN: 'http://frontend', SESSION_SECRET: 'a'.repeat(64),
    DATABASE_URL: 'postgresql://fixture:fixture@postgres:5432/obraflow_test' };
  it.each(['true', '*', 'loopback', '10.0.0.0/8', '127.0.0.1,'])('rejects nonliteral proxy configuration %s', (value) => {
    expect(() => configuration({ ...env, TRUST_PROXY_IPS: value })).toThrow('Invalid TRUST_PROXY_IPS');
  });
  it('accepts an explicit list of proxy IPs and requires HTTPS in production', () => {
    expect(() => configuration({ ...env, TRUST_PROXY_IPS: '127.0.0.1,::1' })).not.toThrow();
    expect(configuration({ ...env, APP_ENV: 'production', APP_ORIGIN: 'https://obraflow.test' }).secureCookie).toBe(true);
  });
});
