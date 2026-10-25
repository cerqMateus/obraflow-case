import type { NestExpressApplication } from '@nestjs/platform-express';
import { SessionService } from './session.service';

export const configureSession = (app: NestExpressApplication): void => {
  const trustedProxyIps = (process.env.TRUST_PROXY_IPS ?? '').split(',');
  // Default: no forwarded IP/protocol is trusted. Explicit literal proxy IPs may be configured.
  app.set('trust proxy', (address: string, hop: number) =>
    hop === 0 && trustedProxyIps.includes(address));
  app.use(app.get(SessionService).middleware);
};
