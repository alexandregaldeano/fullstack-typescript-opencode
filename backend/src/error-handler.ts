import type { ErrorRequestHandler } from 'express';

import type { ApiError } from '@shared/interfaces';

import { logger } from './logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Internal server error');
  const error: ApiError = { error: 'Internal Server Error' };
  res.status(500).json(error);
};
