export type DerivJsonValue =
  | string
  | number
  | boolean
  | null
  | DerivJsonValue[]
  | { [key: string]: DerivJsonValue };

export type DerivRequestPayload = Record<string, DerivJsonValue>;

export type DerivErrorPayload = {
  code?: string;
  message?: string;
};

export type DerivSubscriptionPayload = {
  id?: string;
};

export type DerivResponseMessage = {
  msg_type?: string;
  req_id?: number;
  error?: DerivErrorPayload;
  subscription?: DerivSubscriptionPayload;
  [key: string]: unknown;
};

export type DerivConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export type WebSocketLike = {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type WebSocketConstructor = {
  readonly CONNECTING: number;
  readonly OPEN: number;
  readonly CLOSING: number;
  readonly CLOSED: number;
  new (url: string): WebSocketLike;
};
