import { describe, expect, it, vi } from "vitest";

import { DerivPublicWebSocketClient } from "@/deriv/websocket";
import type { WebSocketLike } from "@/deriv/types/websocket";

class FakeWebSocket implements WebSocketLike {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  sent: string[] = [];

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  receive(message: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(message) }));
  }
}

const WebSocketCtor = FakeWebSocket as unknown as typeof WebSocket;

describe("DerivPublicWebSocketClient", () => {
  it("correlates request responses by req_id", async () => {
    FakeWebSocket.instances = [];
    const client = new DerivPublicWebSocketClient({
      url: "wss://example.test/ws",
      WebSocketCtor,
      heartbeatIntervalMs: 999_999,
    });

    const requestPromise = client.request({ active_symbols: "brief" });
    const socket = FakeWebSocket.instances[0];
    socket.open();

    await vi.waitFor(() => expect(socket.sent).toHaveLength(1));
    const sent = JSON.parse(socket.sent[0] ?? "{}") as { req_id: number };
    socket.receive({ msg_type: "active_symbols", req_id: sent.req_id, active_symbols: [] });

    await expect(requestPromise).resolves.toMatchObject({
      msg_type: "active_symbols",
      active_symbols: [],
    });
  });

  it("sends forget when a subscription is unsubscribed", async () => {
    FakeWebSocket.instances = [];
    const client = new DerivPublicWebSocketClient({
      url: "wss://example.test/ws",
      WebSocketCtor,
      heartbeatIntervalMs: 999_999,
    });
    const onMessage = vi.fn();

    const subscribePromise = client.subscribe("ticks:R_100", { ticks: "R_100" }, onMessage);
    const socket = FakeWebSocket.instances[0];
    socket.open();

    await vi.waitFor(() => expect(socket.sent).toHaveLength(1));
    const subscribeRequest = JSON.parse(socket.sent[0] ?? "{}") as { req_id: number };
    socket.receive({
      msg_type: "tick",
      req_id: subscribeRequest.req_id,
      subscription: { id: "sub-123" },
      tick: { symbol: "R_100", quote: 1000, epoch: 1 },
    });

    const unsubscribe = await subscribePromise;
    const unsubscribePromise = unsubscribe();
    await vi.waitFor(() => expect(socket.sent).toHaveLength(2));

    const forgetRequest = JSON.parse(socket.sent[1] ?? "{}") as { forget: string; req_id: number };
    expect(forgetRequest.forget).toBe("sub-123");
    socket.receive({ msg_type: "forget", req_id: forgetRequest.req_id, forget: 1 });
    await unsubscribePromise;
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it("restores active subscriptions after reconnect", async () => {
    FakeWebSocket.instances = [];
    const client = new DerivPublicWebSocketClient({
      url: "wss://example.test/ws",
      WebSocketCtor,
      heartbeatIntervalMs: 999_999,
      reconnectBaseDelayMs: 1,
      reconnectMaxDelayMs: 1,
    });

    const subscribePromise = client.subscribe("ticks:R_100", { ticks: "R_100" }, vi.fn());
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    await vi.waitFor(() => expect(firstSocket.sent).toHaveLength(1));
    const firstRequest = JSON.parse(firstSocket.sent[0] ?? "{}") as { req_id: number };
    firstSocket.receive({
      msg_type: "tick",
      req_id: firstRequest.req_id,
      subscription: { id: "sub-1" },
      tick: { symbol: "R_100", quote: 1000, epoch: 1 },
    });
    await subscribePromise;

    firstSocket.readyState = FakeWebSocket.CLOSED;
    firstSocket.onclose?.(new CloseEvent("close"));
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    const secondSocket = FakeWebSocket.instances[1];
    secondSocket.open();

    await vi.waitFor(() => expect(secondSocket.sent.length).toBeGreaterThan(0));
    const restoredRequest = JSON.parse(secondSocket.sent[0] ?? "{}") as { ticks: string; subscribe: number };
    expect(restoredRequest).toMatchObject({ ticks: "R_100", subscribe: 1 });
  });
});
