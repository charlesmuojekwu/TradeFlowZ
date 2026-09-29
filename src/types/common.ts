export type CurrencyCode = "USD" | "EUR" | "GBP" | string;

export type DecimalString = string;

export type UnixTimestamp = number;

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export type Unsubscribe = () => void;
