import logger from './logger';

export const logError = (message: string, error: unknown, context?: Record<string, any>) => {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : undefined,
    ...context
  };
  
  logger.error(message, errorInfo);
};

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};
