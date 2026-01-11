import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Cleanup old log files (older than 10 days)
const cleanupOldLogs = () => {
  try {
    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000); // 10 days in milliseconds
    
    files.forEach((file) => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than 10 days (including old error logs and compressed files)
      if (stats.mtime.getTime() < tenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old log files:', error);
  }
};

// Run cleanup on startup
cleanupOldLogs();

// Custom format: [ISO_TIMESTAMP] [LEVEL] MESSAGE
const customLogFormat = winston.format.printf(({ level, message }) => {
  // Convert level to uppercase and remove color codes
  const levelUpper = level.toUpperCase().replace(/\u001b\[[0-9;]*m/g, '');
  // Use ISO timestamp with milliseconds
  const isoTime = new Date().toISOString();
  // Format: [ISO_TIMESTAMP] [LEVEL] MESSAGE (1 space after level)
  // Metadata is excluded - only the message is logged
  return `[${isoTime}] [${levelUpper}] ${message}`;
});

// Define log format for file transport
const fileLogFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  customLogFormat
);

// Define log format for console transport
const consoleLogFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  customLogFormat
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'jira-dashboard-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleLogFormat
    }),
    
    // Single daily rotate file transport for all logs (including errors)
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '10d', // Keep only 10 days of logs, automatically deletes older files
      format: fileLogFormat
    })
  ]
});

export default logger;
