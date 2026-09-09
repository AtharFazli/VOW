# VOW Session Handoff

## Current State
- Current/last completed gate: Gate P — Create VOW
- Gate status: PASS; locked
- Next allowed gate: Gate Q — My Vows
- Current branch: testnet-mainnet
- Current commit: pending (Gate P commit)

## Completed Gates
- Gate B — PASS; createVow skeleton and constructor baseline verified.
- Gate C — PASS; createVow behavior implemented and verified.
- Gate D — PASS; acceptVow behavior implemented and verified.
- Gate E — PASS; submitProof behavior implemented and verified.
- Gate F — PASS; reviewProof behavior implemented and verified.
- Gate G — PASS; resolveDispute behavior implemented and verified.
- Gate H — PASS; timeout resolution implemented and verified.
- Gate I — PASS; finalization and settlement implemented and verified.
- Gate J — PASS; withdraw behavior implemented and verified.
- Gate K — PASS; full contract audit completed, no protocol bug found.
- Gate L — PASS; BOT Chain network configuration established.
- Gate M — PASS; Vow contract deployed to Bohr Testnet.
- Gate N — PASS; frontend foundation with wallet connection, network handling, and contract read.
- Gate O — PASS; Vow Detail page with chain timestamp action eligibility.
- Gate P — PASS; Create VOW flow with live test transaction on Bohr Testnet.

## Live Test Transaction (VOW #0)
- Vow ID: 0
- Creator: 0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7
- Partner: 0xFf904631Db15A6f449866a988AADe33A7BDCC372
- Arbiter: NONE (address(0))
- Stake: 0.01 BOT (10000000000000000 wei)
- Creator Promise: Ship the VOW happy-path demo
- Partner Promise: Verify the VOW happy-path demo
- Accept Deadline: 1789110115 (2026-09-11T07:01:55 UTC)
- Delivery Deadline: 1789282915 (2026-09-13T07:01:55 UTC)
- Review Deadline: 1789369315 (2026-09-14T07:01:55 UTC)
- Dispute Deadline: 1789455715 (2026-09-15T07:01:55 UTC)
- Tx Hash: 0x3a77b313e3d3d754fead271f3064bf75604178a165d2d69a734e8e203da0083e
- Block: 22773305
- Gas Used: 237063
- Explorer: https://scan.bohr.life/tx/0x3a77b313e3d3d754fead271f3064bf75604178a165d2d69a734e8e203da0083e
- Global Status: PROPOSED
- Creator Status: PENDING
- Partner Status: PENDING
- nextVowId after: 1
- Event Decoded: VowCreated(vowId=0, creator, partner, stake, arbiter) ✓
- On-chain Readback: 13/13 fields match ✓

## Deployment State

### Bohr Testnet (DEPLOYED)
- Network: Bohr Testnet
- Chain ID: 968
- RPC: https://rpc.bohr.life
- Explorer: https://scan.bohr.life
- Vow contract: 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- failureSink: 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B
- Deployer: 0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7
- Transaction hash: 0x60de58eca141fd24c63d4d26ab1d045c46fd969c258fc5941eb802d8227649c0
- nextVowId: 1 (advanced from 0 by VOW #0 creation)

### BOT Mainnet
- NOT DEPLOYED

## Frontend State
- Location: `frontend/`
- Stack: Next.js 16.3.4 (App Router) + wagmi 3.7.7 + viem 2.56.3 + Tailwind CSS 4 + vitest 5.0.0
- Chain config: Bohr Testnet only (chain 968)
- Contract config: 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- Pages:
  - `/` — home with VOW ID lookup, wallet connect, contract status, create link
  - `/create` — Create VOW form with validation, simulation, event decoding, redirect
  - `/vow/[id]` — full Vow Detail with data read, role derivation, action eligibility
- Action eligibility: `src/lib/vow.ts` (pure utility), uses `useChainTime()` hook
- Create VOW: `src/lib/createVow.ts` (validation + parsing), `CreateVowForm.tsx` (UI + tx flow)
- Tests: 72 vitest unit tests (42 vow + 30 create validation)

## Verification
- Frontend:
  - npm run lint: PASS
  - npm run build: PASS (routes: /, /create, /vow/[id])
  - npm run test: 72 passed, 0 failed
- Solidity:
  - forge build: PASS
  - forge test: 118 passed, 0 failed
- Live readback: 13/13 fields match on-chain state ✓
- Frontend E2E: /vow/0 serves correct page structure ✓

## Known Issues
- Foundry not on PATH; use full path: `C:/Users/MyBook Hype AMD/.foundry/bin/forge.exe`
- Vow.sol struct field order differs from naive destructuring order; VowDetail.tsx reads by name (correct).
- vitest uses legacy-peer-deps.

## Important Decisions
- CreateVow uses simulateContract → writeContract → waitForReceipt → parseEventLogs for VowCreated event decoding.
- Deadline validation uses chain time (useChainTime hook), not Date.now().
- Accept deadline: `acceptTs <= chainTime` → error (requires strictly greater than current block time).
- Live test used deployer wallet as creator; partner supplied by operator.
- Vow #0 is reusable for later two-wallet happy-path integration.

## Files Changed (Gate P)
- frontend/src/lib/createVow.ts (NEW) — validation, stake parsing
- frontend/src/lib/createVow.test.ts (NEW) — 30 tests
- frontend/src/components/CreateVowForm.tsx (NEW) — form + tx flow
- frontend/src/app/create/page.tsx (NEW) — create route
- frontend/src/app/page.tsx (MODIFIED) — added "Create a Vow" link
- SESSION-HANDOFF.md (MODIFIED) — updated for Gate P

## Next Session
- Gate Q — My Vows: list vows where connected wallet is creator, partner, or arbiter.
- Before continuing, re-read source-of-truth docs and verify repo state first.
