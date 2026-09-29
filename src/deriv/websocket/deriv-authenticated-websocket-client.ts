import { mapDerivError } from "@/deriv/mappers/error-mapper";
import type {
  DerivRequestPayload,
  DerivResponseMessage,
  WebSocketConstructor,
  WebSocketLike,
} from "@/deriv/types/websocket";
import { AppError } from "@/lib/errors";
import type { ConnectionStatus } from "@/types";

type PendingRequest = {
  resolve: (message: DerivResponseMessage) => void;
  reject: (error: AppError) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type SubscriptionRecord = {
  key: string;
  payload: DerivRequestPayload;
  onMessage: (message: DerivResponseMessage) => void;
  onError?: (error: AppError) => void;
  subscriptionId?: string;
};

type AuthenticatedClientOptions = {
  accountId: string;
  getWebSocketUrl?: (accountId: string) => Promise<string>;
  WebSocketCtor?: WebSocketConstructor;
  requestTimeoutMs?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
  onStatusChange?: (status: ConnectionStatus, error?: string) => void;
  onMessage?: (message: Record<string, unknown>) => void;
};

export class DerivAuthenticatedWebSocketClient {
  private readonly accountId: string;
  private readonly getWebSocketUrl: (accountId: string) => Promise<string>;
  private readonly WebSocketCtor?: WebSocketConstructor;
  private readonly requestTimeoutMs: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private onStatusChange?: (status: ConnectionStatus, error?: string) => void;
  private readonly onMessage?: (message: Record<string, unknown>) => void;
  private socket?: WebSocketLike;
  private nextReqId = 1;
  private pendingRequests = new Map<number, PendingRequest>();
  private subscriptions = new Map<string, SubscriptionRecord>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempt = 0;
  private intentionalDisconnect = false;
  private status: ConnectionStatus = "idle";
  private connectPromise?: Promise<void>;

  constructor(options: AuthenticatedClientOptions) {
    this.accountId = options.accountId;
    this.getWebSocketUrl = options.getWebSocketUrl ?? getDefaultWebSocketUrl;
    this.WebSocketCtor = options.WebSocketCtor;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 800;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 10_000;
    this.onStatusChange = options.onStatusChange;
    this.onMessage = options.onMessage;
  }

  get connectionStatus() {
    return this.status;
  }

  setStatusHandler(handler?: (status: ConnectionStatus, error?: string) => void) {
    this.onStatusChange = handler;
  }

  async connect() {
    if (this.isOpen()) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.intentionalDisconnect = false;
    this.setStatus(this.status === "idle" ? "connecting" : "reconnecting");
    const shouldRestoreSubscriptions = this.status === "reconnecting";

    this.connectPromise = this.getWebSocketUrl(this.accountId)
      .then((url) => this.openSocket(url, shouldRestoreSubscriptions))
      .catch((caught) => {
        this.connectPromise = undefined;
        const message = caught instanceof Error ? caught.message : "Unable to connect authenticated trading socket.";
        this.setStatus("disconnected", message);
        if (!isAuthorizationFailure(message)) {
          this.scheduleReconnect();
        }
        throw caught;
      });

    return this.connectPromise;
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.clearReconnectTimer();
    this.rejectPendingRequests(
      new AppError({
        code: "CONNECTION_LOST",
        title: "Disconnected",
        message: "The authenticated trading connection was disconnected.",
        retryable: false,
      }),
    );
    this.subscriptions.clear();
    this.socket?.close(1000, "account switch");
    this.socket = undefined;
    this.setStatus("disconnected");
  }

  async request(payload: DerivRequestPayload) {
    await this.connect();

    const reqId = this.nextRequestId();
    const requestPayload = { ...payload, req_id: reqId };

    return new Promise<DerivResponseMessage>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(
          new AppError({
            code: "CONNECTION_LOST",
            title: "Request timed out",
            message: "Deriv did not respond before the authenticated request timeout.",
            retryable: true,
          }),
        );
      }, this.requestTimeoutMs);

      this.pendingRequests.set(reqId, { resolve, reject, timeoutId });
      this.send(requestPayload);
    });
  }

  async subscribe(
    key: string,
    payload: DerivRequestPayload,
    onMessage: (message: DerivResponseMessage) => void,
    onError?: (error: AppError) => void,
  ) {
    const subscription: SubscriptionRecord = {
      key,
      payload,
      onMessage,
      onError,
    };

    this.subscriptions.set(key, subscription);
    await this.startSubscription(subscription);

    return async () => {
      this.subscriptions.delete(key);

      if (subscription.subscriptionId) {
        try {
          await this.request({ forget: subscription.subscriptionId });
        } catch (caught) {
          onError?.(caught instanceof AppError ? caught : mapDerivError(undefined, "Unable to unsubscribe."));
        }
      }
    };
  }

  private async openSocket(url: string, shouldRestoreSubscriptions: boolean) {
    const WebSocketImpl = this.WebSocketCtor ?? globalThis.WebSocket;

    if (!WebSocketImpl) {
      throw new Error("This environment does not provide WebSocket.");
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocketImpl(url);
      this.socket = socket;

      socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.connectPromise = undefined;
        this.setStatus("connected");
        if (shouldRestoreSubscriptions) {
          void this.restoreSubscriptions();
        }
        resolve();
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        this.handleRawMessage(event.data);
      };

      socket.onerror = () => {
        reject(new Error("Authenticated trading WebSocket failed."));
      };

      socket.onclose = () => {
        this.connectPromise = undefined;
        this.socket = undefined;
        this.rejectPendingRequests(
          new AppError({
            code: "CONNECTION_LOST",
            title: "Connection lost",
            message: "The authenticated trading WebSocket closed.",
            retryable: true,
          }),
        );

        if (this.intentionalDisconnect) {
          this.setStatus("disconnected");
          return;
        }

        this.setStatus("reconnecting", "Authenticated trading WebSocket disconnected.");
        this.scheduleReconnect();
      };
    });
  }

  private async startSubscription(subscription: SubscriptionRecord) {
    try {
      const firstMessage = await this.request({ ...subscription.payload, subscribe: 1 });
      const subscriptionId = firstMessage.subscription?.id;

      if (subscriptionId) {
        subscription.subscriptionId = subscriptionId;
      }

      subscription.onMessage(firstMessage);
    } catch (caught) {
      const error = caught instanceof AppError ? caught : mapDerivError(undefined, "Subscription failed.");
      subscription.onError?.(error);
      throw error;
    }
  }

  private async restoreSubscriptions() {
    const subscriptions = Array.from(this.subscriptions.values());

    for (const subscription of subscriptions) {
      subscription.subscriptionId = undefined;
      try {
        await this.startSubscription(subscription);
      } catch {
        // The subscriber receives the mapped error through its onError callback.
      }
    }
  }

  private handleRawMessage(data: string) {
    let message: DerivResponseMessage;

    try {
      message = JSON.parse(data) as DerivResponseMessage;
      this.onMessage?.(message);
    } catch {
      this.rejectPendingRequests(
        new AppError({
          code: "UNKNOWN",
          title: "Malformed response",
          message: "Deriv returned a malformed authenticated WebSocket response.",
          retryable: true,
        }),
      );
      this.onStatusChange?.("connected", "Received malformed trading WebSocket message.");
      return;
    }

    if (message.req_id && this.pendingRequests.has(message.req_id)) {
      const pending = this.pendingRequests.get(message.req_id);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(message.req_id);

      if (message.error) {
        pending.reject(mapDerivError(message.error));
        return;
      }

      pending.resolve(message);
      return;
    }

    if (message.error) {
      const error = mapDerivError(message.error);
      this.subscriptions.forEach((subscription) => subscription.onError?.(error));
      return;
    }

    const subscriptionId = message.subscription?.id;
    if (!subscriptionId) {
      return;
    }

    const subscription = Array.from(this.subscriptions.values()).find(
      (item) => item.subscriptionId === subscriptionId,
    );

    subscription?.onMessage(message);
  }

  private scheduleReconnect() {
    if (this.intentionalDisconnect) {
      return;
    }

    this.clearReconnectTimer();
    const delay = Math.min(
      this.reconnectMaxDelayMs,
      this.reconnectBaseDelayMs * 2 ** this.reconnectAttempt,
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      void this.connect().catch(() => this.scheduleReconnect());
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private nextRequestId() {
    const reqId = this.nextReqId;
    this.nextReqId += 1;
    return reqId;
  }

  private send(payload: DerivRequestPayload) {
    if (!this.socket || !this.isOpen()) {
      throw new AppError({
        code: "CONNECTION_LOST",
        title: "Connection unavailable",
        message: "Cannot send a Deriv request until the authenticated WebSocket is connected.",
        retryable: true,
      });
    }

    this.socket.send(JSON.stringify(payload));
  }

  private isOpen() {
    const WebSocketImpl = this.WebSocketCtor ?? globalThis.WebSocket;
    return Boolean(this.socket && WebSocketImpl && this.socket.readyState === WebSocketImpl.OPEN);
  }

  private rejectPendingRequests(error: AppError) {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
    });
    this.pendingRequests.clear();
  }

  private setStatus(status: ConnectionStatus, error?: string) {
    this.status = status;
    this.onStatusChange?.(status, error);
  }
}

function isAuthorizationFailure(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("session expired") || normalized.includes("not authenticated") || normalized.includes("unauthorized");
}

async function getDefaultWebSocketUrl(accountId: string) {
  const response = await fetch("/api/auth/trading-websocket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ accountId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Unable to authorize trading WebSocket.");
  }

  const body = (await response.json()) as { url?: string };

  if (!body.url) {
    throw new Error("Trading WebSocket URL was not returned.");
  }

  return body.url;
}
