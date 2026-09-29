
# PROJECT: PROFESSIONAL NEXT.JS TRADING PLATFORM

Build a production-quality, frontend-first trading platform using Next.js that integrates with Deriv for market data and demo trading.

This is NOT a simple mockup or landing page.

The final application must provide a genuinely functional trading experience where a user can authenticate with Deriv, select a Deriv trading account, browse markets, select Volatility 100 Index, see historical and live prices, enter a $10 stake, select Rise, obtain a live proposal/payout, execute the contract through Deriv, see the open position and live P/L, and finally see whether the contract won or lost.

The initial version must remain a Next.js application. Do NOT introduce NestJS, Express, PostgreSQL, Redis, Kafka, RabbitMQ, Service Bus, Kubernetes or a separate backend application.

Small Next.js Route Handlers/server-side functionality are permitted and required where necessary for secure OAuth/token/account operations.

The architecture must nevertheless be designed so a NestJS backend can replace the direct Deriv integration later without rebuilding the UI.

---

# 1. TECHNOLOGY STACK

Use:

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Lucide React
- Zustand
- TanStack Query
- Zod
- React Hook Form
- decimal.js
- TradingView Lightweight Charts
- Native browser WebSocket API

Do not use Socket.IO unless there is a concrete requirement for it.

Do not introduce unnecessary infrastructure.

---

# 2. ARCHITECTURAL PRINCIPLES

Use the following dependency direction:

UI Components
→ Hooks
→ Application Services
→ Provider Interfaces
→ Deriv Adapters
→ Deriv API

React components MUST NOT directly construct Deriv WebSocket messages.

Do NOT place raw WebSocket calls inside TradeTicket, TradingChart, MarketSelector, PositionCard or pages.

Provider-specific logic must remain isolated.

Create abstractions such as:

MarketProvider

TradingProvider

AccountProvider

Implement:

DerivMarketProvider

DerivTradingProvider

DerivAccountProvider

The application should later support:

ApiMarketProvider

ApiTradingProvider

ApiAccountProvider

which will communicate with a future NestJS backend.

Changing providers must not require redesigning React components.

---

# 3. PROJECT STRUCTURE

Organize the project approximately as:

src/
  app/
  features/
    auth/
    accounts/
    markets/
    chart/
    trading/
    positions/
    history/
  components/
    ui/
    common/
    layout/
  providers/
  deriv/
    websocket/
    services/
    mappers/
    types/
  stores/
  hooks/
  lib/
  types/
  config/

Feature folders should own feature-specific components, hooks and logic.

Generic reusable UI belongs under components.

Deriv-specific code belongs under deriv.

---

# 4. VISUAL DESIGN

The application must have an excellent professional trading UI.

Do NOT make it look like:

- a generic admin dashboard
- a bootstrap template
- a cryptocurrency meme site
- a casino
- a direct pixel-for-pixel Deriv clone

Create an original premium fintech visual identity.

Primary desktop layout:

TOP HEADER

LEFT:
Market explorer/sidebar

CENTER:
Market header
Current live price
Professional chart
Chart controls

RIGHT:
Trading ticket

BOTTOM:
Open positions / closed positions

The interface should feel dense enough for serious trading while remaining clean.

Use excellent spacing, typography, hierarchy, borders and subtle depth.

Avoid excessive gradients, glowing elements, giant rounded cards and unnecessary animations.

Use restrained green/red semantics for positive/negative trading states.

Dark mode should be the primary trading experience.

Also support light mode if practical.

---

# 5. RESPONSIVE DESIGN

Desktop must support large trading workspaces.

Tablet should collapse secondary navigation appropriately.

Mobile must NOT simply shrink desktop.

Mobile priority:

Market selector
→ Price
→ Chart
→ Trade controls
→ Open positions

Use drawers/bottom sheets for market navigation and positions where appropriate.

The application must be genuinely usable on mobile.

---

# 6. HEADER

Create:

Brand/logo

Trade navigation

Positions navigation

History navigation

Connection indicator

Demo/Real account selector

Current balance

Profile/account menu

Clearly distinguish:

DEMO

from:

REAL

Never allow the user to mistake a demo account for a real-money account.

---

# 7. MARKET EXPLORER

Create a searchable market explorer.

Support grouping such as:

Synthetic Indices

Forex

Cryptocurrency

Commodities

Other categories returned by Deriv

Allow:

Search

Favorites

Recently selected markets

Never hard-code the complete market catalogue.

Retrieve active markets from Deriv and normalize them into the application's Market type.

---

# 8. MARKET DOMAIN MODEL

Create an application model similar to:

Market {
  symbol
  displayName
  category
  market
  submarket
  pipSize
}

The UI must consume this normalized type.

Do not leak raw Deriv objects throughout the application.

---

# 9. PUBLIC WEBSOCKET

Create a reusable Deriv public WebSocket client.

It must support:

connect

disconnect

send request

req_id correlation

subscriptions

unsubscriptions

connection status

ping/heartbeat

automatic reconnection

exponential backoff

error normalization

subscription restoration

Do not create a separate WebSocket connection for every React component.

---

# 10. REQUEST MANAGER

Implement request correlation using req_id.

Maintain pending request resolvers.

Conceptually:

request(payload)
→ generate req_id
→ send message
→ wait
→ receive response with req_id
→ resolve corresponding Promise

Handle:

timeouts

Deriv errors

socket closure

malformed responses

---

# 11. SUBSCRIPTION MANAGER

Implement long-running subscriptions independently of one-off requests.

Support:

ticks

balance

proposal_open_contract

and future subscription APIs.

A subscription must return an unsubscribe function.

React component unmounting must correctly unsubscribe where appropriate.

Changing markets must clean up the previous tick subscription.

---

# 12. MARKET DISCOVERY

Use Deriv active_symbols.

Normalize results.

Populate the market explorer.

Do not hard-code Volatility 100's symbol inside UI components.

The application should discover the provider symbol and associate it with its display name.

---

# 13. CONTRACT DISCOVERY

Use contracts_for for the selected underlying.

Determine:

available contract types

allowed durations

minimum/maximum constraints where available

whether early selling is supported

Do not assume every market supports identical trade configurations.

---

# 14. HISTORICAL CHART DATA

Load historical data for the selected market.

Normalize provider data into:

PricePoint {
  time
  value
}

or candle structures where appropriate.

Render historical data before beginning live updates.

---

# 15. LIVE MARKET DATA

Subscribe to ticks for the selected symbol.

Flow:

Deriv
→ DerivMarketProvider
→ normalizeTick
→ market/chart feature
→ UI

Update:

Current price

Chart

Direction indicator

Timestamp

Do not cause the complete trading page to rerender on every tick.

---

# 16. CHART

Use TradingView Lightweight Charts.

Implement:

Historical data

Live tick updates

Responsive resizing

Current price

Crosshair

Price scale

Time scale

Loading state

Disconnected state

Reconnecting state

Fullscreen

Basic timeframe controls

Keep chart internals isolated from Deriv.

Chart components receive normalized data only.

---

# 17. AUTHENTICATION

Use Deriv's CURRENT documented OAuth 2.0 Authorization Code + PKCE workflow.

Do not implement an outdated OAuth flow from old tutorials.

Generate:

state

code_verifier

code_challenge

Validate state.

Use S256 PKCE.

Where Deriv requires server-side token exchange, use a Next.js Route Handler.

Never expose confidential secrets to browser JavaScript.

Never place secrets in NEXT_PUBLIC environment variables.

Never log access tokens.

Never place tokens in URLs or analytics.

Prefer secure HttpOnly session handling for sensitive credentials.

---

# 18. ACCOUNTS

After authentication retrieve the user's Deriv Options trading accounts.

Normalize them into:

TradingAccount {
  id
  type
  currency
  status
  balance
}

Create a polished account selector.

Support:

Demo

Real

Initially focus testing and development on DEMO.

---

# 19. AUTHENTICATED TRADING CONNECTION

Use Deriv's CURRENT documented authenticated Options WebSocket flow.

When account-specific OTP/WebSocket authorization is required, obtain it using a secure Next.js server-side route.

The browser may then establish the authorized WebSocket according to Deriv's documented architecture.

Treat public market WebSocket and authenticated account WebSocket as separate connections.

Authenticated reconnect must obtain fresh authorization where required.

---

# 20. BALANCE

Subscribe to the selected account's balance.

Display it prominently.

The provider balance is authoritative.

Do not invent or maintain a separate customer balance.

---

# 21. TRADE TICKET

Build an excellent trading ticket.

Fields:

Selected market

Stake

Currency

Duration

Duration unit

Rise

Fall

Potential payout

Potential profit

Quote state

Connection state

Trade button state

Validate stake and duration.

Use decimal-safe money handling.

Do not rely on native floating-point arithmetic for authoritative monetary calculations.

---

# 22. TRADE DIRECTION

The UI should expose:

RISE

FALL

The Deriv adapter maps these to the appropriate provider contract types.

Do not expose CALL/PUT terminology unnecessarily in UI components.

Keep provider mapping in a dedicated mapper.

---

# 23. PROPOSALS

Request a proposal when trade parameters are valid.

Debounce rapid changes.

Proposal input includes the provider-required values such as:

amount

basis

contract type

currency

duration/expiry

duration unit

underlying symbol

Normalize response into:

TradeProposal {
  id
  askPrice
  payout
  potentialProfit
  spot
  receivedAt
}

Do not calculate authoritative payout yourself.

Deriv's proposal response is authoritative.

Expire/invalidate stale proposals.

---

# 24. TRADE EXECUTION

When the user clicks Rise/Fall:

Validate connection.

Validate account.

Validate current proposal.

Prevent obvious duplicate UI submission.

Disable both trade buttons.

Display Buying...

Send the buy request through DerivTradingProvider.

Receive provider contract ID.

Create an in-memory Position.

Add it to positionStore.

Show success feedback.

Do not blindly retry BUY if the request result is ambiguous.

A network timeout does NOT prove the provider failed to execute the trade.

This limitation must remain clearly isolated so a future NestJS backend can add true idempotency/reconciliation.

---

# 25. POSITION DOMAIN MODEL

Create a normalized Position type similar to:

Position {
  contractId
  symbol
  displaySymbol
  direction
  stake
  buyPrice
  payout
  entrySpot
  currentSpot
  profit
  currency
  purchaseTime
  expiryTime
  status
  isSellable
}

Status should support:

OPEN

WON

LOST

SOLD

UNKNOWN

---

# 26. LIVE CONTRACT MONITORING

After successful purchase subscribe to proposal_open_contract for that contract.

Normalize every provider update.

Update only the relevant Position in positionStore.

Display:

Entry price

Current price

Stake

Payout

Current P/L

Expiry/countdown

Trade status

Sell availability

---

# 27. POSITION UI

Build a high-quality open positions panel.

Desktop can use a table/list hybrid.

Mobile should use cards or an optimized list.

Use restrained visual treatment for:

positive P/L

negative P/L

open

won

lost

sold

Do not make the interface resemble gambling.

---

# 28. SETTLEMENT

When the provider reports a final state:

Update Position.

Stop unnecessary subscriptions.

Update balance from provider events.

Show a polished trade-result notification.

Example:

Trade Won

Volatility 100 Index
Rise

Stake: $10.00
Payout: $18.63
Profit: +$8.63

Do not determine Won/Lost from frontend price comparison when the provider has an authoritative result.

---

# 29. RESTORING OPEN POSITIONS

Because there is no application database, refresh must not make the UI assume positions disappeared.

After authentication/reconnection:

retrieve provider portfolio/open positions

normalize them

populate positionStore

resubscribe to active contracts

restore live P/L monitoring

---

# 30. TRADE HISTORY

Use Deriv's account history/profit APIs.

Build a history page supporting:

Market

Direction

Stake

Buy price

Payout

Profit/loss

Status

Purchase time

Close time

Pagination

Filters

Do not create a local trade database yet.

---

# 31. SELL/CLOSE

Where the selected contract supports selling:

show Close/Sell

display current sell information if available

ask for confirmation where appropriate

send provider sell request

show Selling...

handle provider response

update position to SOLD

Never display Sell for contracts that cannot currently be sold.

---

# 32. STATE MANAGEMENT

Use separate Zustand stores.

authStore:
authentication/session UI state

accountStore:
accounts
selected account
balance

marketStore:
markets
selected market
current price
connection status

tradeStore:
stake
duration
direction
current proposal
proposal state
execution state

positionStore:
open positions
settled positions currently in memory

uiStore:
sidebar
drawers
modals
theme
responsive UI state

Do not create one giant global store.

---

# 33. SERVER STATE

Use TanStack Query for suitable request/response data.

Do not force high-frequency tick streams into TanStack Query.

WebSocket streams should use appropriate subscription/state mechanisms.

---

# 34. MONEY

Use decimal.js or normalized decimal strings.

Do not perform financial calculations such as:

0.1 + 0.2

and assume JavaScript Number gives authoritative financial precision.

Normalize provider money values because external APIs may return numeric fields as either strings or numbers.

---

# 35. ERROR MODEL

Create:

AppError {
  code
  title
  message
  retryable
  originalCode?
}

Map provider-specific errors into application-friendly errors.

Examples:

Unable to load market

Price unavailable

Trade rejected

Insufficient balance

Connection lost

Session expired

Contract unavailable

Do not expose ugly provider/internal errors directly to normal users.

---

# 36. CONNECTION UX

Display a subtle connection status.

Support:

Connected

Connecting

Reconnecting

Disconnected

When market data disconnects:

keep the last known price visually identifiable as stale

show reconnecting state

attempt exponential reconnect

restore the selected market subscription after reconnect

---

# 37. AUTHENTICATED RECONNECTION

If authenticated WebSocket disconnects:

do not assume an old one-time authorization URL can be reused

obtain fresh authorization according to current Deriv requirements

reconnect

reload balance

reload portfolio

restore open positions

resubscribe to active contracts

---

# 38. PERFORMANCE

Avoid whole-page rerenders for ticks.

Memoize expensive chart components appropriately.

Keep high-frequency chart data out of broad global state.

Clean up subscriptions.

Do not create duplicate WebSockets.

Lazy-load heavy components where beneficial.

Use dynamic import for the trading chart if appropriate.

---

# 39. ACCESSIBILITY

Trading buttons must be keyboard accessible.

Inputs need proper labels.

Use sufficient contrast.

Do not rely solely on green/red to communicate state.

Provide text/icon status indicators.

Dialogs must handle focus correctly.

---

# 40. TESTING

Implement:

Unit tests for provider mappers

Unit tests for monetary normalization

Unit tests for trade state transitions

Unit tests for WebSocket request correlation

Tests for subscription cleanup

Component tests for TradeTicket

Component tests for PositionCard

Integration tests for mock trading flow

Use mock providers so UI tests do not require Deriv.

---

# 41. MOCK PROVIDER

Create:

MockMarketProvider

MockTradingProvider

MockAccountProvider

The entire UI must be capable of running without Deriv.

Support a development mode such as:

NEXT_PUBLIC_TRADING_PROVIDER=mock

This allows design work and automated testing without executing provider contracts.

---

# 42. DERIV PROVIDER

Support:

NEXT_PUBLIC_TRADING_PROVIDER=deriv

Provider factory selects the appropriate implementation.

Example conceptual architecture:

createTradingProvider()

if mock:
  MockTradingProvider

if deriv:
  DerivTradingProvider

Future:

if api:
  ApiTradingProvider

---

# 43. FUTURE NESTJS MIGRATION

Design for this future architecture:

Next.js
→ NestJS
→ Deriv

When this happens, create:

ApiMarketProvider

ApiTradingProvider

ApiAccountProvider

and switch the provider factory.

Do not require major changes to:

TradingChart

TradeTicket

MarketSelector

PositionsPanel

HistoryPage

Zustand stores

domain models

visual components

---

# 44. DEVELOPMENT PHASES

Implement in this exact order.

PHASE 1:
Project foundation and architecture.

PHASE 2:
Complete visual design using mock providers.

PHASE 3:
Public Deriv WebSocket infrastructure.

PHASE 4:
Market discovery and market explorer.

PHASE 5:
Historical and live chart.

PHASE 6:
contracts_for and trade configuration.

PHASE 7:
Trade ticket and proposal pricing.

PHASE 8:
OAuth and accounts.

PHASE 9:
Authenticated account WebSocket.

PHASE 10:
Balance.

PHASE 11:
Demo Rise/Fall execution.

PHASE 12:
Live position/P&L.

PHASE 13:
Settlement.

PHASE 14:
Position restoration.

PHASE 15:
History.

PHASE 16:
Sell/close.

PHASE 17:
Reconnect/error/session handling.

PHASE 18:
Mobile responsiveness.

PHASE 19:
Tests and performance.

PHASE 20:
Production cleanup/documentation.

Do not skip directly to later phases while leaving architectural foundations incomplete.

---

# 45. PRIMARY ACCEPTANCE TEST

The following complete journey must work:

User opens application.

User authenticates with Deriv.

User selects DEMO account.

User sees current Deriv balance.

User selects Volatility 100 Index.

Historical chart loads.

Live ticks begin updating.

User enters:

$10 stake.

User selects:

5 minutes.

User chooses:

RISE.

Application requests a proposal.

UI displays:

Stake
$10.00

Potential payout
provider value

Potential profit
provider value

User clicks Rise.

Button changes to Buying...

Deriv executes the demo contract.

Application receives contract ID.

Position appears immediately.

Position displays:

Volatility 100

RISE

$10 stake

Entry spot

Current spot

Live P/L

Remaining time

Contract updates continuously.

When Deriv settles the contract:

UI changes to WON or LOST.

Final provider P/L appears.

Account balance updates.

Trade subsequently appears in history.

Refreshing the browser must restore any still-open provider positions.

---

# 46. NON-NEGOTIABLE RULES

Do NOT build NestJS yet.

Do NOT add a database yet.

Do NOT add Redis yet.

Do NOT add microservices.

Do NOT expose OAuth secrets.

Do NOT store sensitive tokens in localStorage for the production architecture.

Do NOT put Deriv WebSocket logic inside React UI components.

Do NOT hard-code the complete market list.

Do NOT hard-code all contract availability.

Do NOT blindly retry a BUY.

Do NOT calculate authoritative settlement yourself.

Do NOT use mock data once a feature has been switched to the real provider except for explicit mock/development mode.

Do NOT rewrite the architecture without documenting why.

Do NOT prioritize fancy animation over trading correctness.

---

# 47. DEFINITION OF DONE

The frontend is considered complete for this stage when:

It looks and behaves like a professional trading platform.

Desktop, tablet and mobile layouts work.

Market discovery works.

Volatility 100 can be selected.

Historical chart works.

Live prices work.

Deriv demo authentication works.

Account selection works.

Balance works.

$10 Rise/Fall proposal works.

Demo trade execution works.

Live P/L works.

Settlement works.

Open-position restoration works.

History works.

Connection recovery works.

Error states work.

Mock-provider tests work.

The project remains clean enough that the direct Deriv provider can later be replaced by a NestJS API provider without redesigning the frontend.

The priority order throughout the project is:

CORRECTNESS
→ SECURITY
→ ARCHITECTURE
→ UX
→ PERFORMANCE
→ VISUAL POLISH

All implementation decisions must preserve those priorities.