import { logger } from './logger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
  context?: string;
  timestamp: Date;
  userMessage: string;
}

export class ErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    originalError?: Error | unknown,
    context?: string
  ): AppError {
    const userMessage = this.getUserMessage(type, message);

    const error: AppError = {
      type,
      message,
      originalError,
      context,
      timestamp: new Date(),
      userMessage,
    };

    // ログに記録
    logger.error(`${type}: ${message}`, { originalError, context }, 'ErrorHandler');

    return error;
  }

  static handleError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return this.createError(
          ErrorType.NETWORK,
          'Network connection failed',
          error,
          context
        );
      }

      // API errors
      if (error.message.includes('API') || error.message.includes('status')) {
        return this.createError(
          ErrorType.API,
          'API request failed',
          error,
          context
        );
      }

      // Auth errors
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return this.createError(
          ErrorType.AUTH,
          'Authentication failed',
          error,
          context
        );
      }

      // Generic error
      return this.createError(
        ErrorType.UNKNOWN,
        error.message,
        error,
        context
      );
    }

    // Non-Error objects
    if (typeof error === 'string') {
      return this.createError(
        ErrorType.UNKNOWN,
        error,
        error,
        context
      );
    }

    // Unknown error type
    return this.createError(
      ErrorType.UNKNOWN,
      'Unknown error occurred',
      error,
      context
    );
  }

  private static getUserMessage(type: ErrorType, message: string): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'インターネット接続を確認してください。';
      case ErrorType.API:
        return 'サービスに接続できません。しばらく時間をおいて再試行してください。';
      case ErrorType.AUTH:
        return '認証に失敗しました。再度ログインしてください。';
      case ErrorType.VALIDATION:
        return '入力内容を確認してください。';
      case ErrorType.UNKNOWN:
        if (message.includes('エラー')) {
          return message;
        }
        return 'エラーが発生しました。しばらく時間をおいて再試行してください。';
      default:
        return 'エラーが発生しました。';
    }
  }

  // React Error Boundary用
  static logReactError(error: Error, errorInfo: { componentStack: string }) {
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, 'ErrorBoundary');
  }
}

// よく使われるエラー作成のヘルパー関数
export const createNetworkError = (originalError?: unknown, context?: string) =>
  ErrorHandler.createError(ErrorType.NETWORK, 'Network error', originalError, context);

export const createApiError = (originalError?: unknown, context?: string) =>
  ErrorHandler.createError(ErrorType.API, 'API error', originalError, context);

export const createAuthError = (originalError?: unknown, context?: string) =>
  ErrorHandler.createError(ErrorType.AUTH, 'Authentication error', originalError, context);

export const createValidationError = (message: string, context?: string) =>
  ErrorHandler.createError(ErrorType.VALIDATION, message, undefined, context);