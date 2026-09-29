import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_TRADING_PROVIDER: z.enum(["mock", "deriv", "api"]).default("mock"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Trade"),
  NEXT_PUBLIC_DERIV_PUBLIC_WS_URL: z
    .string()
    .url()
    .default("wss://api.derivws.com/trading/v1/options/ws/public"),
});

const serverEnvSchema = z.object({
  DERIV_CLIENT_ID: z.string().optional(),
  DERIV_REDIRECT_URI: z.string().url().optional(),
  DERIV_API_BASE_URL: z.string().url().default("https://api.derivws.com"),
  DERIV_AUTH_BASE_URL: z.string().url().default("https://auth.deriv.com"),
  DERIV_OAUTH_SCOPES: z.string().default("trade account_manage"),
  DERIV_SESSION_SECRET: z.string().optional(),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_TRADING_PROVIDER: process.env.NEXT_PUBLIC_TRADING_PROVIDER,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_DERIV_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_DERIV_PUBLIC_WS_URL,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    DERIV_CLIENT_ID: process.env.DERIV_CLIENT_ID,
    DERIV_REDIRECT_URI: process.env.DERIV_REDIRECT_URI,
    DERIV_API_BASE_URL: process.env.DERIV_API_BASE_URL,
    DERIV_AUTH_BASE_URL: process.env.DERIV_AUTH_BASE_URL,
    DERIV_OAUTH_SCOPES: process.env.DERIV_OAUTH_SCOPES,
    DERIV_SESSION_SECRET: process.env.DERIV_SESSION_SECRET,
  });
}
