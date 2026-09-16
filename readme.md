# Live Leaderboard
 
A real-time leaderboard built with Redis Sorted Sets, Node.js/Express, MongoDB, Socket.IO, and React. Scores update live across every connected client the moment anyone's rank changes — no polling, no manual refresh.
 
## Demo
 
> _Add your deployed link and/or a demo GIF here once live._
 
---
 
## Features
 
- **Real-time rank updates** — powered by Socket.IO, backed by Redis Sorted Sets for O(log N) ranking operations
- **JWT authentication** via httpOnly cookies (register/login/logout/session persistence)
- **Personal standing view** — your rank, score, and nearby rivals (players ranked just above/below you)
- **Horizontally scalable** — Socket.IO Redis Adapter lets real-time updates work correctly across multiple server instances
- **Broadcast throttling** — high-frequency score updates are batched to avoid overwhelming clients under load
---
 
## Tech Stack
 
**Backend:** Node.js, Express, Redis (Memurai locally / Upstash in prod), MongoDB (Atlas), Socket.IO, JWT, bcrypt
**Frontend:** React (Vite), Tailwind CSS, Socket.IO client, Axios
 
---
 
## Architecture
 
```
┌─────────────┐      REST (auth, rank, nearby)      ┌──────────────────┐
│   React     │ ───────────────────────────────────▶│   Express API     │
│  (Vite)     │◀─────────────────────────────────────│                  │
└─────────────┘                                      └──────────────────┘
       │                                                     │
       │  WebSocket (live updates)                           │  ZINCRBY / ZREVRANGE / ZREVRANK
       ▼                                                     ▼
┌─────────────────────────────┐                     ┌──────────────────┐
│   Socket.IO + Redis Adapter │◀───── Pub/Sub ──────▶│      Redis        │
│   (coordinates across       │                      │  (Sorted Set:     │
│    multiple server          │                      │   leaderboard)    │
│    instances)                │                      └──────────────────┘
└─────────────────────────────┘
                                                       ┌──────────────────┐
                                                       │     MongoDB       │
                                                       │  (user accounts)  │
                                                       └──────────────────┘
```
 
### Why Redis Sorted Sets
 
A ZSET keeps members ordered by score automatically — no manual sorting, no separate ranking logic in application code. `ZINCRBY`, `ZREVRANGE`, and `ZREVRANK` are all **O(log N)**, so the leaderboard stays fast whether it holds a thousand users or a few million.
 
### Why Redis is source-of-truth for rank, MongoDB for identity
 
Redis is in-memory and built for this kind of hot, frequently-changing ranking data. MongoDB stores durable user records (credentials, profile info) — the two are linked by using each user's MongoDB `_id` as the Redis ZSET member.
 
### Real-time layer
 
Every score change triggers a broadcast of the current top 10 to all connected clients via Socket.IO. Broadcasts are **throttled to at most once per 500ms** — if many users score within the same window, only one broadcast fires, reflecting the latest state, instead of flooding clients with redundant updates.
 
---
 
## Scaling Considerations (1M+ users)
 
This section documents how the design handles scale, and what would need to change beyond a single-instance deployment.
 
| Concern | Approach |
|---|---|
| **Ranking performance** | Redis ZSET operations are O(log N) — scales to millions of members with minimal latency increase |
| **Multiple server instances** | A single Node process can't hold millions of concurrent WebSocket connections. Horizontal scaling (multiple instances behind a load balancer) is necessary — but by default, Socket.IO instances can only broadcast to clients connected to *that same instance* |
| **Cross-instance broadcast** | Solved with `@socket.io/redis-adapter`: every instance publishes/subscribes to a shared Redis Pub/Sub channel, so a score update on Instance A reaches clients connected to Instance B, C, etc., transparently |
| **Broadcast storms** | Without throttling, high-frequency scoring (many users at once) would trigger a broadcast per write, overwhelming clients. A 500ms throttle window batches these into a single broadcast reflecting current state |
| **Load balancer config** | Would require sticky sessions (cookie or IP-hash based) so a client's WebSocket connection consistently reaches the same instance it negotiated with |
| **MongoDB reads** | User lookups (`/me`, login) are indexed and fast at scale; read replicas would be the next lever if read load became a bottleneck |
| **Redis itself at extreme scale** | A single Redis instance comfortably handles tens of millions of ZSET members; **Redis Cluster** (sharding) would be the next step beyond that, though not necessary at 1M-user scale |
 
---
 
## Getting Started
 
### Prerequisites
- Node.js 18+
- Redis (or Memurai on Windows)
- MongoDB (local or Atlas)
### Backend
 
```bash
cd leaderboard-backend
npm install
```
 
Create a `.env` file:
```
PORT=5000
REDIS_URL=redis://localhost:6379
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<a-long-random-string>
JWT_EXPIRES_IN=7d
```
 
```bash
npm run dev
```
 
### Frontend
 
```bash
cd leaderboard-frontend
npm install
npm run dev
```
 
---
 
## API Reference
 
### Auth (`/api/auth`)
| Method | Route | Description | Auth required |
|---|---|---|---|
| POST | `/register` | Create account, sets auth cookie | No |
| POST | `/login` | Log in, sets auth cookie | No |
| POST | `/logout` | Clears auth cookie | Yes |
| GET | `/me` | Returns current authenticated user | Yes |
 
### Leaderboard (`/api/leaderboard`)
| Method | Route | Description | Auth required |
|---|---|---|---|
| POST | `/increment` | Add points to your own score (`ZINCRBY`) | Yes |
| GET | `/top?limit=10` | Top N players (`ZREVRANGE`) | No |
| GET | `/rank` | Your current rank + score (`ZREVRANK`) | Yes |
| GET | `/nearby?range=2` | Players ranked near you | Yes |
 
### Socket Events
| Event | Direction | Payload | Description |
|---|---|---|---|
| `leaderboard:update` | Server → Client | `{ top: [{ value, score }] }` | Fired on any score change (throttled) |
 
---
 
## Future Improvements
- Daily/weekly leaderboards with auto-expiring Redis keys
- Rank-crossing achievements/badges
- Rate-limiting score submissions to prevent abuse