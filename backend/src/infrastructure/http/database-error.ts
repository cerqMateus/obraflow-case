import { Prisma } from '../../../generated/prisma';
import { ApiError } from './api-error';

// Only unambiguous constraint errors are translated. Context-dependent conflicts
// (versions, rule revisions, eligibility) must be raised by their authorized use case.
export const databaseError = (error: unknown): unknown => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
  if (error.code === 'P2002') {
    const target: unknown = error.meta?.target;
    if (Array.isArray(target) && target.length === 1 && target[0] === 'email') {
      return new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'Já existe uma conta com este e-mail.');
    }
  }
  if (error.code === 'P2003' || error.code === 'P2025') {
    return new ApiError(404, 'RESOURCE_NOT_FOUND', 'Recurso não encontrado.');
  }
  if (error.code === 'P2000' || error.code === 'P2004') {
    return new ApiError(400, 'VALIDATION_ERROR', 'Revise os campos informados.');
  }
  return error;
};
