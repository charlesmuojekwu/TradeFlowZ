import { describe, expect, it, vi } from "vitest";

import { DerivAuthenticatedWebSocketClient } from "@/deriv/websocket";
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

  receive(message: Record<string, unknown>) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(message) }));
  }
}

const WebSocketCtor = FakeWebSocket as unknown as typeof WebSocket;

describe("DerivAuthenticatedWebSocketClient", () => {
  it("obtains a fresh authenticated URL when reconnecting", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi
      .fn()
      .mockResolvedValueOnce("wss://example.test/demo?otp=one")
      .mockResolvedValueOnce("wss://example.test/demo?otp=two");
    const onStatusChange = vi.fn();
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      reconnectBaseDelayMs: 1,
      reconnectMaxDelayMs: 1,
      onStatusChange,
    });

    const connectPromise = client.connect();
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.instances[0].open();
    await connectPromise;

    FakeWebSocket.instances[0].onclose?.(new CloseEvent("close"));
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    FakeWebSocket.instances[1].open();

    expect(getWebSocketUrl).toHaveBeenCalledTimes(2);
    expect(FakeWebSocket.instances[0].url).toContain("otp=one");
    expect(FakeWebSocket.instances[1].url).toContain("otp=two");
    expect(onStatusChange).toHaveBeenCalledWith("connected", undefined);
  });

  it("does not reconnect after an intentional disconnect", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi.fn().mockResolvedValue("wss://example.test/demo?otp=one");
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      reconnectBaseDelayMs: 1,
    });

    const connectPromise = client.connect();
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.instances[0].open();
    await connectPromise;

    client.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(getWebSocketUrl).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("does not retry OTP authorization when the session has expired", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi.fn().mockRejectedValue(new Error("Session expired."));
    const onStatusChange = vi.fn();
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      reconnectBaseDelayMs: 1,
      reconnectMaxDelayMs: 1,
      onStatusChange,
    });

    await expect(client.connect()).rejects.toThrow("Session expired.");
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(getWebSocketUrl).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(onStatusChange).toHaveBeenCalledWith("disconnected", "Session expired.");
  });

  it("restores multiple authenticated subscriptions after reconnecting", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi
      .fn()
      .mockResolvedValueOnce("wss://example.test/demo?otp=one")
      .mockResolvedValueOnce("wss://example.test/demo?otp=two");
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      reconnectBaseDelayMs: 1,
      reconnectMaxDelayMs: 1,
      requestTimeoutMs: 500,
    });

    const balanceSubscribe = client.subscribe("balance:DOT123", { balance: 1 }, vi.fn());
    const contractSubscribe = client.subscribe(
      "proposal_open_contract:123",
      { proposal_open_contract: 1, contract_id: 123 },
      vi.fn(),
    );
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.instances[0].open();
    await vi.waitFor(() => expect(FakeWebSocket.instances[0].sent).toHaveLength(2));

    FakeWebSocket.instances[0].receive({
      req_id: 1,
      subscription: { id: "balance-one" },
      balance: { balance: "1000", currency: "USD" },
    });
    FakeWebSocket.instances[0].receive({
      req_id: 2,
      subscription: { id: "contract-one" },
      proposal_open_contract: { contract_id: 123 },
    });
    await Promise.all([balanceSubscribe, contractSubscribe]);

    FakeWebSocket.instances[0].onclose?.(new CloseEvent("close"));
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    FakeWebSocket.instances[1].open();
    await vi.waitFor(() => expect(FakeWebSocket.instances[1].sent).toHaveLength(2));

    const restoredPayloads = FakeWebSocket.instances[1].sent.map((item) => JSON.parse(item) as Record<string, unknown>);
    expect(restoredPayloads).toEqual([
      expect.objectContaining({ balance: 1, subscribe: 1 }),
      expect.objectContaining({ proposal_open_contract: 1, contract_id: 123, subscribe: 1 }),
    ]);
    client.disconnect();
  });

  it("subscribes to balance updates and forgets the subscription during cleanup", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi.fn().mockResolvedValue("wss://example.test/demo?otp=one");
    const onMessage = vi.fn();
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      requestTimeoutMs: 500,
    });

    const subscribePromise = client.subscribe("balance:DOT123", { balance: 1 }, onMessage);
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.instances[0].open();
    await vi.waitFor(() => expect(FakeWebSocket.instances[0].sent).toHaveLength(1));

    expect(JSON.parse(FakeWebSocket.instances[0].sent[0])).toEqual({
      balance: 1,
      subscribe: 1,
      req_id: 1,
    });

    FakeWebSocket.instances[0].receive({
      req_id: 1,
      msg_type: "balance",
      subscription: { id: "balance-sub" },
      balance: { balance: "1000.00", currency: "USD" },
    });

    const unsubscribe = await subscribePromise;
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: { balance: "1000.00", currency: "USD" },
      }),
    );

    const unsubscribePromise = unsubscribe();
    await vi.waitFor(() => expect(FakeWebSocket.instances[0].sent).toHaveLength(2));
    expect(JSON.parse(FakeWebSocket.instances[0].sent[1])).toEqual({
      forget: "balance-sub",
      req_id: 2,
    });
    FakeWebSocket.instances[0].receive({ req_id: 2, msg_type: "forget" });
    await unsubscribePromise;
  });

  it("restores balance subscriptions after reconnecting with a fresh URL", async () => {
    FakeWebSocket.instances = [];
    const getWebSocketUrl = vi
      .fn()
      .mockResolvedValueOnce("wss://example.test/demo?otp=one")
      .mockResolvedValueOnce("wss://example.test/demo?otp=two");
    const onMessage = vi.fn();
    const client = new DerivAuthenticatedWebSocketClient({
      accountId: "DOT123",
      getWebSocketUrl,
      WebSocketCtor,
      reconnectBaseDelayMs: 1,
      reconnectMaxDelayMs: 1,
      requestTimeoutMs: 500,
      onMessage,
    });

    const subscribePromise = client.subscribe("balance:DOT123", { balance: 1 }, vi.fn());
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.instances[0].open();
    await vi.waitFor(() => expect(FakeWebSocket.instances[0].sent).toHaveLength(1));
    FakeWebSocket.instances[0].receive({
      req_id: 1,
      msg_type: "balance",
      subscription: { id: "balance-one" },
      balance: { balance: "1000.00", currency: "USD" },
    });
    await subscribePromise;

    FakeWebSocket.instances[0].onclose?.(new CloseEvent("close"));
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    FakeWebSocket.instances[1].open();
    await vi.waitFor(() => expect(FakeWebSocket.instances[1].sent).toHaveLength(1));

    expect(JSON.parse(FakeWebSocket.instances[1].sent[0])).toEqual({
      balance: 1,
      subscribe: 1,
      req_id: 2,
    });
    FakeWebSocket.instances[1].receive({
      req_id: 2,
      msg_type: "balance",
      subscription: { id: "balance-two" },
      balance: { balance: "1001.00", currency: "USD" },
    });
    expect(FakeWebSocket.instances[1].url).toContain("otp=two");
    client.disconnect();
  });
});
