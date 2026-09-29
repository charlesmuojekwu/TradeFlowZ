import { DerivAuthenticatedWebSocketClient } from "@/deriv/websocket/deriv-authenticated-websocket-client";

const clients = new Map<string, DerivAuthenticatedWebSocketClient>();

export function getAuthenticatedTradingClient(accountId: string) {
  const existing = clients.get(accountId);

  if (existing) {
    return existing;
  }

  const client = new DerivAuthenticatedWebSocketClient({ accountId });
  clients.set(accountId, client);
  return client;
}

export function disconnectAuthenticatedTradingClient(accountId: string) {
  const client = clients.get(accountId);
  client?.disconnect();
  clients.delete(accountId);
}
