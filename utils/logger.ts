type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  component?: string
  action?: string
  [key: string]: unknown
}

class Logger {
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const fullContext = { ...context }
    if (error instanceof Error) {
      fullContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } else if (error) {
      fullContext.error = error
    }
    
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, fullContext))
  }
}

export const logger = new Logger()