import { hashPassword, verifyPassword } from '../src/infrastructure/security/password';

describe('Password hashing', () => {
  it('uses random salts, verifies credentials and refuses malformed hashes', async () => {
    const password = 'A fictional password with spaces ';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toEqual(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword(password.trim(), first)).toBe(false);
    expect(await verifyPassword(password, 'scrypt$invalid')).toBe(false);
    expect(await verifyPassword(password, first.replace('$131072$', '$999999999$'))).toBe(false);
  });
});
