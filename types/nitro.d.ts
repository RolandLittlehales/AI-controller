// Global types for Nitro server APIs
interface WebSocketPeer {
  send: (data: string) => void;
  close: () => void;
}

interface WebSocketHandler {
  message: (peer: WebSocketPeer, message: string | Buffer) => void | Promise<void>;
  close?: (peer: WebSocketPeer) => void | Promise<void>;
  error?: (peer: WebSocketPeer, error: Error) => void | Promise<void>;
  open?: (peer: WebSocketPeer) => void | Promise<void>;
}

declare global {
  const defineEventHandler: typeof import("h3").defineEventHandler;
  const defineWebSocketHandler: (handler: WebSocketHandler) => unknown;
  const readBody: typeof import("h3").readBody;
}

export {};