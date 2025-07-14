// Global types for Nitro server APIs
declare global {
  const defineEventHandler: typeof import('h3').defineEventHandler;
  const defineWebSocketHandler: (handler: {
    message: (peer: any, message: string | Buffer) => void | Promise<void>;
    close?: (peer: any) => void | Promise<void>;
    error?: (peer: any, error: Error) => void | Promise<void>;
    open?: (peer: any) => void | Promise<void>;
  }) => any;
}

export {};