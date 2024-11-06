/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Custom log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports array with correct type
const transports: winston.transport[] = [
  // Console logging
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
  // File logging - errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
  // File logging - all levels
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

// Add Logtail in production with proper type checking
if (process.env.NODE_ENV === 'production' && process.env.LOGTAIL_SOURCE_TOKEN) {
  const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  transports.push(new LogtailTransport(logtail) as unknown as winston.transport);
}

// Create the logger with proper type
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
const stream = {
  write: (message: string) => {
    winstonLogger.http(message.trim());
  },
};

// Add request context tracking with proper types
interface RequestWithContext {
  id?: string;
  method?: string;
  path?: string;
  ip?: string;
  get?: (key: string) => string | undefined;
}

const addRequestContext = (req: RequestWithContext) => {
  return {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get?.('user-agent'),
  };
};

// Modified interface without extending winston.Logger
interface ExtendedLogger {
  error: winston.LeveledLogMethod;
  warn: winston.LeveledLogMethod;
  info: winston.LeveledLogMethod;
  http: winston.LeveledLogMethod;
  debug: winston.LeveledLogMethod;
  api: (message: string, req: RequestWithContext, extra?: Record<string, unknown>) => void;
  deployment: (message: string, deploymentId: string, extra?: Record<string, unknown>) => void;
  performance: (message: string, metrics: Record<string, unknown>) => void;
  security: (message: string, context?: Record<string, unknown>) => void;
  stream: { write: (message: string) => void };
}

// Create the extended logger
const extendedLogger: ExtendedLogger = {
  error: winstonLogger.error.bind(winstonLogger),
  warn: winstonLogger.warn.bind(winstonLogger),
  info: winstonLogger.info.bind(winstonLogger),
  http: winstonLogger.http.bind(winstonLogger),
  debug: winstonLogger.debug.bind(winstonLogger),
  api: (message: string, req: RequestWithContext, extra = {}) => {
    winstonLogger.info(message, {
      ...addRequestContext(req),
      ...extra,
      type: 'api',
    });
  },
  deployment: (message: string, deploymentId: string, extra = {}) => {
    winstonLogger.info(message, {
      deploymentId,
      ...extra,
      type: 'deployment',
    });
  },
  performance: (message: string, metrics: Record<string, unknown>) => {
    winstonLogger.info(message, {
      ...metrics,
      type: 'performance',
    });
  },
  security: (message: string, context: Record<string, unknown> = {}) => {
    winstonLogger.warn(message, {
      ...context,
      type: 'security',
    });
  },
  stream,
};

// Export the logger
export { extendedLogger as logger };

// Export individual levels
export const {
  error,
  warn,
  info,
  http,
  debug,
  api,
  deployment,
  performance,
  security,
} = extendedLogger; 