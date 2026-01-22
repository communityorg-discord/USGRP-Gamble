# USGRP Casino - gamble.usgrp.xyz

A premium, interactive gambling website integrated with the USGRP economy system.

## Features

- 🎰 **Slots** - 5-reel animated slot machine with progressive jackpot
- 🎡 **Roulette** - European-style wheel with multiple bet types
- 🃏 **Blackjack** - Full blackjack with hit, stand, and double down
- 🪙 **Coin Flip** - Simple 50/50 betting with 3D animation
- 🎲 **Dice** - Over/under/exact betting with probability display
- 🏇 **Horse Racing** - 8 horses with live race animation
- 🎱 **Lottery** - Weekly lottery with jackpot system
- 🎟️ **Scratch Cards** - Interactive canvas-based scratching

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom casino theme
- **Animations**: Framer Motion
- **State**: React Query + Zustand
- **Auth**: Discord OAuth with JWT tokens

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Configure environment variables:
   - Set your Discord OAuth client ID and secret
   - Set a secure JWT secret
   - Configure economy bot API URL

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3005](http://localhost:3005)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord OAuth application client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth application secret |
| `JWT_SECRET` | Secret key for JWT tokens |
| `ECONOMY_BOT_API` | URL to the economy bot API |

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### PM2 (Recommended)
```bash
pm2 start npm --name "usgrp-gamble" -- start
```

### Docker
```bash
docker build -t usgrp-gamble .
docker run -p 3005:3005 usgrp-gamble
```

## Integration

This site integrates with:
- **CO-Economy-Bot** - For user balances and transactions
- **USGRP-Auth** - For user authentication
- **Discord** - OAuth login and user verification

## License

© 2026 USGRP. All rights reserved.
