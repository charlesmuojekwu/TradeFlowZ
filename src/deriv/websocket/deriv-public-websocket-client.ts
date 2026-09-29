import { AppError } from "@/lib/errors";

import { mapDerivError } from "@/deriv/mappers/error-mapper";
import type {
  DerivConnectionStatus,
  DerivRequestPayload,
  DerivResponseMessage,
  WebSocketConstructor,
  WebSocketLike,
} from "@/deriv/types/websocket";

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

type ClientOptions = {
  url: string;
  WebSocketCtor?: WebSocketConstructor;
  requestTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
};

export class DerivPublicWebSocketClient {
  private readonly url: string;
  private readonly WebSocketCtor?: WebSocketConstructor;
  private readonly requestTimeoutMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private socket?: WebSocketLike;
  private status: DerivConnectionStatus = "idle";
  private nextReqId = 1;
  private pendingRequests = new Map<number, PendingRequest>();
  private subscriptions = new Map<string, SubscriptionRecord>();
  private reconnectAttempt = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private intentionalDisconnect = false;
  private connectPromise?: Promise<void>;

  constructor(options: ClientOptions) {
    this.url = options.url;
    this.WebSocketCtor = options.WebSocketCtor;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 25_000;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 500;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 10_000;
  }

  get connectionStatus() {
    return this.status;
  }

  async connect() {
    if (this.isOpen()) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const WebSocketImpl = this.WebSocketCtor ?? globalThis.WebSocket;
    if (!WebSocketImpl) {
      throw new AppError({
        code: "CONNECTION_LOST",
        title: "WebSocket unavailable",
        message: "This environment does not provide a WebSocket implementation.",
        retryable: false,
      });
    }

    this.intentionalDisconnect = false;
    this.status = this.status === "idle" ? "connecting" : "reconnecting";
    const shouldRestoreSubscriptions = this.status === "reconnecting";

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const socket = new WebSocketImpl(this.url);
      this.socket = socket;

      const failOpen = (error: AppError) => {
        this.connectPromise = undefined;
        reject(error);
      };

      socket.onopen = () => {
        this.status = "connected";
        this.reconnectAttempt = 0;
        this.connectPromise = undefined;
        this.startHeartbeat();
        if (shouldRestoreSubscriptions) {
          void this.restoreSubscriptions();
        }
        resolve();
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        this.handleRawMessage(event.data);
      };

      socket.onerror = () => {
        if (this.status === "connecting") {
          failOpen(
            new AppError({
              code: "CONNECTION_LOST",
              title: "Connection failed",
              message: "Unable to connect to Deriv public market data.",
              retryable: true,
            }),
          );
        }
      };

      socket.onclose = () => {
        this.connectPromise = undefined;
        this.stopHeartbeat();
        this.rejectPendingRequests(
          new AppError({
            code: "CONNECTION_LOST",
            title: "Connection lost",
            message: "The Deriv public market data connection closed.",
            retryable: true,
          }),
        );

        if (this.intentionalDisconnect) {
          this.status = "disconnected";
          return;
        }

        this.status = "reconnecting";
        this.scheduleReconnect();
      };
    });

    return this.connectPromise;
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.rejectPendingRequests(
      new AppError({
        code: "CONNECTION_LOST",
        title: "Disconnected",
        message: "The WebSocket client was disconnected.",
        retryable: false,
      }),
    );
    this.socket?.close(1000, "client disconnect");
    this.status = "disconnected";
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
            message: "Deriv did not respond before the request timeout.",
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
    } catch {
      this.rejectPendingRequests(
        new AppError({
          code: "UNKNOWN",
          title: "Malformed response",
          message: "Deriv returned a malformed WebSocket response.",
          retryable: true,
        }),
      );
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
        message: "Cannot send a Deriv request until the WebSocket is connected.",
        retryable: true,
      });
    }

    this.socket.send(JSON.stringify(payload));
  }

  private isOpen() {
    const WebSocketImpl = this.WebSocketCtor ?? globalThis.WebSocket;
    return Boolean(this.socket && WebSocketImpl && this.socket.readyState === WebSocketImpl.OPEN);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isOpen()) {
        void this.request({ ping: 1 }).catch(() => undefined);
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private scheduleReconnect() {
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

  private rejectPendingRequests(error: AppError) {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
    });
    this.pendingRequests.clear();
  }
}
