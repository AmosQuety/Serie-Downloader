import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const logFile = path.join(app.getPath('userData'), 'app.log');

export function logInfo(message: string) {
  writeLog('INFO', message);
}

export function logError(message: string, error?: any) {
  const errorMsg = error instanceof Error ? error.stack : JSON.stringify(error);
  writeLog('ERROR', `${message}${errorMsg ? ` - ${errorMsg}` : ''}`);
}

function writeLog(level: string, message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export function getLogPath() {
  return logFile;
}
