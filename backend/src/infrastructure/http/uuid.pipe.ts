import { ParseUUIDPipe } from '@nestjs/common';
import { invalidField } from './api-error';

export class UuidPipe extends ParseUUIDPipe {
  constructor() { super({ exceptionFactory: () => invalidField('id') }); }
}
