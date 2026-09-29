# Trade

Professional frontend-first trading terminal built with Next.js App Router, TypeScript, Tailwind CSS, Zustand, Deriv WebSocket APIs, and TradingView Lightweight Charts.

The application supports mock-provider development and a direct Deriv provider mode for demo Options trading. It is intentionally still a single Next.js application: no NestJS service, database, Redis, queues, or microservices are part of this stage.

## Project Purpose

Trade is a production-oriented Deriv Options trading interface. The completed frontend flow is designed for:

- browsing Deriv-discovered markets
- selecting Volatility 100 Index or another discovered market
- loading historical and live market prices
- authenticating with Deriv using OAuth 2.0 Authorization Code + PKCE
- selecting a Deriv Options account
- showing authoritative account balance
- requesting Rise/Fall proposals
- executing demo-account trades only
- monitoring live position P/L and settlement
- restoring open positions after refresh/reconnect
- reviewing Deriv-sourced trade history
- selling/early closing contracts where Deriv marks them sellable

REAL account trading is intentionally disabled in the client at this stage.

## Architecture

The dependency direction is:

```text
UI components
-> feature hooks
-> Zustand/application state
-> provider interfaces
-> Deriv adapters
-> Deriv APIs
```

React components do not construct raw Deriv WebSocket messages. UI code consumes normalized domain models from provider interfaces.

Current provider path:

```text
Next.js
-> Deriv
```

Direct Deriv integration is isolated under `src/deriv`.

Future provider path:

```text
Next.js
-> NestJS
-> Deriv
```

When a backend is introduced, add API-backed provider implementations:

- `ApiMarketProvider`
- `ApiTradingProvider`
- `ApiAccountProvider`

These can replace:

- `DerivMarketProvider`
- `DerivTradingProvider`
- `DerivAccountProvider`

by switching the provider factory in `src/providers/factory/provider-factory.ts`. The UI, Zustand stores, domain models, chart, market selector, trade ticket, positions, and history views should not need a redesign.

## Folder Structure

```text
src/
  app/                  Next.js App Router pages and route handlers
  components/           shared layout and UI primitives
  config/               environment validation
  deriv/                Deriv WebSocket clients, services, mappers, and provider types
  features/
    accounts/           authenticated trading connection hook
    chart/              chart workspace, lightweight chart, chart data hook
    history/            Deriv trade history UI
    markets/            market explorer
    positions/          open/settled position UI and result notification
    trading/            terminal shell, header, ticket, workspace hook
  lib/
    auth/               PKCE, encrypted session, account normalization
    errors/             application error model
    money/              decimal-safe money utilities
  providers/            provider interfaces, factory, mock providers
  stores/               Zustand stores
  types/                normalized domain types
```

## Installation

```bash
npm install
```

## Environment Variables

Public variables are safe to expose to browser code:

```env
NEXT_PUBLIC_TRADING_PROVIDER=mock
NEXT_PUBLIC_APP_NAME=Trade
NEXT_PUBLIC_DERIV_PUBLIC_WS_URL=wss://api.derivws.com/trading/v1/options/ws/public
```

Server-only variables must not use `NEXT_PUBLIC_`:

```env
DERIV_CLIENT_ID=your_deriv_oauth_client_id
DERIV_REDIRECT_URI=http://localhost:3000/api/auth/callback
DERIV_API_BASE_URL=https://api.derivws.com
DERIV_AUTH_BASE_URL=https://auth.deriv.com
DERIV_OAUTH_SCOPES=trade account_manage
DERIV_SESSION_SECRET=at_least_32_characters_random_secret
```

Security notes:

- `DERIV_SESSION_SECRET` must be at least 32 characters.
- Access tokens are encrypted into an HttpOnly cookie.
- Access tokens are not stored in localStorage.
- OAuth state and PKCE verifier are stored in short-lived HttpOnly cookies.
- Do not log tokens, OTP URLs, or session cookie values.

## Development

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/trade
```

## Mock Provider Mode

Mock mode is the default:

```env
NEXT_PUBLIC_TRADING_PROVIDER=mock
```

Mock mode supports UI development and automated tests without Deriv credentials. It includes mock markets, mock proposals, mock demo buys, live-ish position updates, settlement, history, and sell responses.

Mock data is intentionally isolated under `src/providers/mock` and should not be imported directly by UI components.

## Deriv Provider Mode

Use Deriv mode with:

```env
NEXT_PUBLIC_TRADING_PROVIDER=deriv
```

Deriv mode uses:

- public WebSocket for active symbols, history, ticks, contracts, and proposals
- OAuth 2.0 Authorization Code + PKCE route handlers for authentication
- server-side account-specific trading WebSocket authorization
- a separate authenticated browser WebSocket for account balance, buy, sell, portfolio, and contract updates

Authenticated trading is currently limited to DEMO accounts. REAL accounts can be selected and displayed, but buy execution is blocked in the trade flow.

## Authentication

Authentication starts at:

```text
/api/auth/login
```

The callback route:

```text
/api/auth/callback
```

validates OAuth state, exchanges the authorization code with the PKCE verifier, encrypts the Deriv access token, and stores it in an HttpOnly session cookie.

The session route:

```text
/api/auth/session
```

returns normalized Deriv Options accounts and clears expired/invalid sessions.

The trading WebSocket authorization route:

```text
/api/auth/trading-websocket
```

uses the server-side session to obtain account-specific authenticated WebSocket authorization for the selected account.

## Testing

Run all tests:

```bash
npm test
```

The suite covers:

- Deriv provider mappers
- decimal-safe money operations
- public and authenticated WebSocket request correlation
- subscription cleanup and reconnect restoration
- provider services
- proposal and trade state transitions
- account switching
- position restoration and settlement
- TradeTicket component behavior
- PositionsPanel sell confirmation behavior
- mock trading journey

## TypeScript and Linting

```bash
npm run typecheck
npm run lint
```

## Production Build

```bash
npm run build
npm start
```

Core routes:

```text
/trade
/positions
/history
```

## Deployment

Deploy as a standard Next.js application.

Production requirements:

- set `NODE_ENV=production`
- set a strong `DERIV_SESSION_SECRET`
- configure the Deriv OAuth redirect URI to match the deployed `/api/auth/callback`
- use HTTPS so HttpOnly secure cookies work correctly
- keep all Deriv server credentials out of `NEXT_PUBLIC_` variables
- choose `NEXT_PUBLIC_TRADING_PROVIDER=deriv` only when Deriv OAuth/API configuration is present

## Known Limitations

- This stage has no local trading database.
- Open positions are restored from Deriv after authentication/reconnect.
- A browser-only frontend cannot fully reconcile ambiguous buy timeouts; the app deliberately does not blindly retry BUY.
- REAL account trading is disabled.
- The future backend should own idempotency, audit logs, reconciliation, stronger account authorization, and durable trade records.
- The Trade Ticket currently uses controlled React inputs rather than React Hook Form.

## Final Architecture Review

Spec alignment:

- Provider-specific Deriv code is isolated in `src/deriv`.
- UI consumes provider interfaces and normalized domain types.
- Public and authenticated WebSockets are separate.
- High-frequency chart ticks stay out of broad global state.
- Money helpers use `decimal.js` and normalized decimal strings.
- Provider settlement is authoritative for WON/LOST/SOLD outcomes.
- Mock provider mode is preserved for development and tests.
- No NestJS, PostgreSQL, Redis, queues, or microservices have been introduced.

Production priorities remain:

```text
correctness
-> security
-> architecture
-> UX
-> performance
-> visual polish
```
