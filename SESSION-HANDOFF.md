# VOW Session Handoff

## Current State
- Current/last completed gate: Gate O — Vow Detail
- Gate status: PASS; locked
- Next allowed gate: Gate P — Create VOW
- Current branch: testnet-mainnet
- Current commit: 01299d3

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
- Gate L — PASS; BOT Chain network configuration established (Bohr Testnet + BOT Mainnet RPC, chain IDs, deployer profiles).
- Gate M — PASS; Vow contract deployed to Bohr Testnet.
- Gate N — PASS; frontend foundation with wallet connection, network handling, and contract read implemented.
- Gate O — PASS; Vow Detail page with full data read, action eligibility logic, chain timestamp, and 42 unit tests.

## Gate O Corrections
- fbddb05 → 01299d3: replaced local `Date.now()` with chain timestamp via `useChainTime` hook (fetches Bohr block timestamp every 12s); finalize eligibility now requires `block.timestamp > deadline` (strictly greater, matching contract semantics); finalize hidden when chain time unavailable; added `isTerminal` + `wouldBecomeTerminal` helpers for conservative finalize readiness predicate; tests expanded 23 → 42.

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
- Block: 22766973
- Gas used: 1,766,110
- Deployment cost: ~0.0353 BOT (at 20 gwei)

### BOT Mainnet
- NOT DEPLOYED

## Current Implementation
- Contracts deployed: Vow.sol on Bohr Testnet at 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- Functions: createVow, acceptVow, submitProof, reviewProof, resolveDispute, finalizeVow, withdraw
- Frontend: Next.js 16 + TypeScript + wagmi 3 + viem 2 + Tailwind CSS 4

## Frontend State
- Location: `frontend/`
- Stack: Next.js 16.3.4 (App Router) + wagmi 3.7.7 + viem 2.56.3 + Tailwind CSS 4 + vitest 5.0.0
- Chain config: Bohr Testnet only (chain 968)
- Contract config: 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- Wallet connection: injected (MetaMask/Rabby)
- Pages:
  - `/` — home with VOW ID lookup, wallet connect, contract status
  - `/vow/[id]` — full Vow Detail with data read, role derivation, action eligibility
- Action eligibility: centralized in `src/lib/vow.ts` (pure utility)
- Role derivation: creator / partner / arbiter / observer from connected wallet
- Enum mapping: VowStatus (PROPOSED/ACTIVE/SETTLED), ParticipantStatus (PENDING/PROOF_SUBMITTED/SUCCESS/FAILED/DISPUTED/UNRESOLVED)
- Tests: 23 vitest unit tests covering role derivation, action eligibility, deadline boundaries
- No write transactions implemented (Gate P+)
- ABI generated from Foundry build artifacts (out/Vow.sol/Vow.abi.json)

## Verification
- Post-deploy readback:
  - bytecode: non-empty ✓
  - failureSink(): 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B ✓
  - nextVowId(): 0 ✓
  - chain ID: 968 ✓
- Frontend verification:
  - npm run lint: PASS
  - npm run build: PASS
  - npm run test: 23 passed, 0 failed
  - TypeScript typecheck: PASS
- Solidity regression:
  - forge build: PASS
  - forge test -vvv: 118 passed, 0 failed
  - git diff --check: PASS

## Known Issues
- Existing Foundry style warnings remain in repo (naming conventions, import style).
- Deploy script added forge-std submodule and libs=["lib"] to foundry.toml for Gate M.
- vitest uses legacy-peer-deps for installation.

## Important Decisions
- DISPUTED is not FAILED at review stage.
- Arbiter resolution must not move funds directly.
- finalizeVow() remains permissionless and deterministic.
- withdraw() uses pull-payment accounting and reentrancy protection.
- Source-of-truth docs remain authoritative over this handoff.
- Deploy script uses hard chain guard: require(block.chainid == 968, "Wrong chain").
- PRIVATE_KEY is never committed, logged, or stored in source.
- Frontend uses injected wallet connector only.
- ABI sourced directly from Foundry build output.
- `Date.now()` replaced with useEffect-based state for React purity compliance.
- tsconfig target upgraded to ES2020 for BigInt literal support.
- Proof URI rendering: only https and ipfs schemes clickable; others plain text.

## Files Changed Recently
- src/Vow.sol: withdraw and audit-era contract logic are final for v1.
- test/Vow*.t.sol: full Gate A-K Foundry coverage in place.
- script/DeployVow.s.sol: Gate M deployment script (Bohr Testnet only).
- lib/forge-std: added as submodule (v1.16.2) for deploy script dependency.
- .gitmodules: forge-std submodule registration.
- foundry.toml: libs = ["lib"] added for forge-std resolution.
- .gitignore: added foundry.lock, frontend/AGENTS.md, frontend/CLAUDE.md
- frontend/: Next.js 16 + wagmi + viem + Tailwind foundation
  - src/lib/chain.ts: Bohr Testnet chain definition
  - src/lib/config.ts: wagmi config with injected connector
  - src/lib/contract.ts: VOW_ADDRESS, FAILURE_SINK, VOW_ABI
  - src/lib/vow-abi.json: Foundry-generated ABI
  - src/lib/types.ts: VowData, VowStatus, ParticipantStatus, VowRole, VowAction
  - src/lib/vow.ts: deriveRole, formatStake, formatDeadline, getAvailableActions, hasArbiter
  - src/lib/vow.test.ts: 23 unit tests for pure logic
  - src/components/Providers.tsx: WagmiProvider + QueryClientProvider
  - src/components/ConnectWallet.tsx: wallet connect/disconnect, wrong-chain switch
  - src/components/ContractStatus.tsx: live nextVowId + failureSink reads
  - src/components/VowDetail.tsx: full vow data display with action eligibility
  - src/app/layout.tsx: dark-first root layout with providers
  - src/app/page.tsx: home page with VOW ID lookup
  - src/app/vow/[id]/page.tsx: dynamic vow detail route
  - vitest.config.ts: vitest configuration
  - tsconfig.json: target upgraded to ES2020
  - package.json: added vitest, vite, test script

## Next Session
- Exact next allowed gate: Gate P — Create VOW.
- Before continuing, re-read source-of-truth docs and verify repo state first.
