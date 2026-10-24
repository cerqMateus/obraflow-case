import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const COST = 131072;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;

const derive = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 256 * 1024 * 1024 },
      (error, key) => error ? reject(error) : resolve(key));
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISM}$${salt}$${key.toString('hex')}`;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [algorithm, cost, blockSize, parallelism, salt, encoded, extra] = hash.split('$');
  if (algorithm !== 'scrypt' || cost !== String(COST) || blockSize !== String(BLOCK_SIZE) ||
    parallelism !== String(PARALLELISM) || !salt || !/^[a-f0-9]{32}$/.test(salt) ||
    !encoded || !/^[a-f0-9]{128}$/.test(encoded) || extra !== undefined) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(encoded, 'hex'));
};
