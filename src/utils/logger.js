import winston from 'winston';

export function createLogger({ level = 'info', filePath } = {}) {
  const transports = [new winston.transports.Console({
    level,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`)
    )
  })];

  if (filePath) {
    transports.push(new winston.transports.File({ filename: filePath, level: 'debug', format: winston.format.json() }));
  }

  return winston.createLogger({ level, transports });
}

