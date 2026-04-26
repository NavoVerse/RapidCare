const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0 && metadata.stack) {
        msg += `\n${metadata.stack}`;
    } else if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    defaultMeta: { service: 'rapidcare-backend' },
    transports: [
        // Write all logs with level 'error' and below to 'error.log'
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        // Write all logs with level 'info' and below to 'combined.log'
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        })
    ]
});

// If we're not in production, also log to the console with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'HH:mm:ss' }),
            consoleFormat
        )
    }));
}

module.exports = logger;
