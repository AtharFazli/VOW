# VOW Session Handoff

## Current State
- Current/last completed gate: Gate Q — My Vows
- Gate status: PASS; locked
- Next allowed gate: Gate R — Landing Page
- Current branch: testnet-mainnet
- Current commit: pending (Gate Q commit)

## Completed Gates
- Gate B through P — PASS (see earlier entries)
- Gate P — PASS; Create VOW flow with live test transaction on Bohr Testnet.
- Gate Q — PASS; My Vows dashboard with on-chain discovery via getUserVowIds.

## Live VOW Evidence

### VOW #0
- Creator: 0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7
- Partner: 0xFf904631Db15A6f449866a988AADe33A7BDCC372
- Arbiter: NONE
- Stake: 0.01 BOT
- Status: PROPOSED
- Tx: 0x3a77b313e3d3d754fead271f3064bf75604178a165d2d69a734e8e203da0083e
- Block: 22773305

### Discovery Behavior (verified read-only)
- Contract API: `getUserVowIds(address)` → `uint256[]`
- Both creator and partner indexed at creation (before accept)
- Partner VOW #0 discoverable without accepting

## Deployment State

### Bohr Testnet
- Chain ID: 968
- RPC: https://rpc.bohr.life
- Explorer: https://scan.bohr.life
- Vow contract: 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- failureSink: 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B
- nextVowId: 1

### BOT Mainnet — NOT DEPLOYED

## Frontend State
- Location: `frontend/`
- Stack: Next.js 16.3.4 + wagmi 3.7.7 + viem 2.56.3 + Tailwind CSS 4 + vitest 5.0.0
- Pages:
  - `/` — home with VOW ID lookup, create link, My Vows link
  - `/create` — Create VOW form
  - `/my-vows` — My Vows dashboard with grouped display
  - `/vow/[id]` — Vow Detail
- Discovery: `getUserVowIds(address)` from deployed contract
- Grouping: Needs Action / Active / Completed (derived from action engine)
- Tests: 83 vitest unit tests (42 vow + 30 create + 11 myVows)

## Verification
- npm run test: 83 passed, 0 failed
- npm run lint: PASS
- npm run build: PASS (routes: /, /create, /my-vows, /vow/[id])
- forge test: 118 passed, 0 failed
- Live creator getUserVowIds: [0] ✓
- Live partner getUserVowIds: [0] ✓

## Files Changed (Gate Q)
- frontend/src/lib/myVows.ts (NEW) — tuple parser, grouping logic
- frontend/src/lib/myVows.test.ts (NEW) — 11 tests
- frontend/src/components/MyVowCard.tsx (NEW) — compact VOW card
- frontend/src/app/my-vows/page.tsx (NEW) — My Vows page
- frontend/src/app/page.tsx (MODIFIED) — added My Vows link

## Next Session
- Gate R — Landing Page.
- Before continuing, re-read source-of-truth docs and verify repo state first.
