# RouterPulse

A real-time WAN traffic monitor that connects directly to your home router and displays live usage stats — no cloud, no login, no external services.

## Features

- **Live TX/RX rates** — real-time throughput bars updated on a configurable interval
- **Rate history chart** — in-session line chart of upload/download speeds over time
- **Per-interface stats** — bytes, packets, errors, and uptime for each WAN interface
- **Packet summary** — total sent/received packet counts
- **Session info** — router uptime, connection health, and error counts
- **Encrypted local config** — credentials stored with AES-256-GCM in `localStorage`
- **Configurable poll interval** — 10s, 15s, 30s, 1 min, or 5 min
- **Dark / light theme** — toggle with system preference support
- **Graceful offline handling** — shows last known data when the router is unreachable
- **Error classification** — distinguishes unreachable, auth, and config errors with fix suggestions

## Quick Start

### Option 1: Configure via `.env.local` (recommended for always-on use)

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd router-pulse
npm install
```

2. Create a `.env.local` file in the project root:

```env
ROUTER_BASE_URL=http://192.168.1.1
ROUTER_USERNAME=admin
ROUTER_PASSWORD=your_router_password
ROUTER_MODEL=AOT5221ZY
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) — the dashboard loads immediately.

### Option 2: Configure via the Setup page (no env file needed)

1. Install and run:

```bash
npm install
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the Setup page.

3. Enter your router IP, username, and password. Click **Save & Connect**.

4. Credentials are encrypted and saved in `localStorage`; the dashboard loads automatically.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `ROUTER_BASE_URL` | Router admin base URL | `http://192.168.1.1` |
| `ROUTER_USERNAME` | Router admin username | `admin` |
| `ROUTER_PASSWORD` | Router admin password | `your_password` |
| `ROUTER_MODEL` | Router model identifier | `AOT5221ZY` |

> If env vars are set, they take precedence over any client-side `localStorage` config.

## Project Structure

```
app/
├── layout.tsx          # Root layout, fonts, ThemeProvider
├── page.tsx            # Home → Dashboard
├── globals.css         # Tailwind + CSS variables
├── setup/
│   └── page.tsx        # Router configuration form
└── api/
    └── usage/
        └── route.ts    # GET handler — fetches data from router (rate-limited to 1 req/10s)

components/
├── dashboard.tsx        # Main UI: polling, error handling, layout
├── summary-cards.tsx    # Total TX / RX / grand total cards
├── rate-display.tsx     # Live TX/RX throughput bars
├── rate-chart.tsx       # Recharts line chart for rate history
├── interface-table.tsx  # Per-interface stats table
├── packet-summary.tsx   # Sent/received packet counts
├── session-info.tsx     # Uptime ring and session stats
├── status-badge.tsx     # Connection status indicator
├── theme-toggle.tsx     # Dark/light mode toggle
├── user-menu.tsx        # Settings navigation
└── error-boundary.tsx   # React error boundary with fallback UI

lib/
├── router-client.ts    # Router login (MD5) + CGI scraping
├── storage.ts          # AES-256-GCM encrypted localStorage
├── rate-limiter.ts     # In-memory rate limiting for the API route
├── theme-context.tsx   # Light/dark theme state
├── types.ts            # Shared TypeScript interfaces
└── utils.ts            # formatBytes, formatRate, withDisplay
```

## Privacy & Security

- All configuration is stored in your browser's `localStorage` (AES-256-GCM encrypted) or in your local `.env.local` file.
- No data is sent to any external server or cloud service.
- The Next.js API route (`/api/usage`) runs locally and connects directly to your router on your local network.
- Keep `.env.local` out of version control — it contains your router credentials.

## Router Compatibility

Currently tested with the **Airtel AOT5221ZY** router. The scraper in `lib/router-client.ts` uses MD5-based session login and HTML parsing of CGI endpoints (`login_advance.cgi`, `traffic_wan_frame1.cgi`, `traffic_wan_frame2.cgi`). Other routers with a similar admin interface may work with minor adjustments.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Recharts](https://recharts.org/)
- TypeScript 5
