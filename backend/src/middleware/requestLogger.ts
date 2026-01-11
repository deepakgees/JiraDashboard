import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Format HTTP method and path for logging
 */
function formatMethodAndPath(method: string, url: string): string {
  // Extract just the path, removing query strings
  const path = url.split('?')[0];
  return `[${method} ${path}]`;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const methodAndPath = formatMethodAndPath(req.method, req.originalUrl);
  const path = req.originalUrl.split('?')[0];
  const userInfo = '[User: Anonymous]';
  
  // Log incoming request
  logger.info(`${userInfo} ${methodAndPath}   Incoming ${req.method} request to ${path}`);

  // Override res.end to log response
  setupResponseLogging(res, start, userInfo, methodAndPath);
  
  next();
};

/**
 * Setup response logging by overriding res.end
 */
function setupResponseLogging(res: Response, start: number, userInfo: string, methodAndPath: string) {
  const originalEnd = res.end;
  (res as any).end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const statusInfo = `[Status: ${res.statusCode}]`;
    const durationInfo = `[Duration: ${duration}ms]`;
    
    // Log response with user info, method/path, status, and duration
    logger.info(`${userInfo} ${methodAndPath} ${statusInfo} ${durationInfo} API Access`);
    
    originalEnd.call(this, chunk, encoding);
  };
}

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('HTTP Error', {
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};
