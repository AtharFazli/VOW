# VOW

> Trust is good. Collateral is better.

## What is VOW

VOW is a two-person reciprocal commitment protocol. Both participants lock equal native BOT collateral behind promises they make to each other.

## Judge entry point

- Repository: [github.com/AtharFazli/VOW](https://github.com/AtharFazli/VOW)
- Deployed contract, BOT Chain Mainnet chain ID `677`: [`0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`](https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4) — source verified
- Deployed contract, Bohr Testnet chain ID `968`: [`0x9539263f4861812B08C37Bb3cB6603c771d6530b`](https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b) — source verified
- Live frontend, BOT Chain Mainnet: [https://vowprotocol.web.id](https://vowprotocol.web.id) (canonical `https://www.vowprotocol.web.id`)
- Fastest path with no local setup: [Verification](#verification) — 118 contract tests plus archived on-chain evidence.
- Guided walkthrough: [DEMO.md](DEMO.md). Full session evidence: [SESSION-HANDOFF.md](SESSION-HANDOFF.md).

You can also run the frontend locally; see [Local frontend setup](#local-frontend-setup).

## MVP scope

Two independent wallets can create and accept a reciprocal commitment, lock equal BOT collateral, submit proof independently, review counterparty proof, deterministically settle the outcome, and withdraw funds without administrator intervention.

Out of scope for the submitted build: arbiters in the demo flow, tokens, oracles, DAOs, NFTs, chat, multi-party commitments, unequal collateral, admin override, and upgradeable proxies.

## Problem

Promises are easy to make. Accountability between two parties is often informal, leaving collateral, proof, review, and consequences unclear. VOW makes those rules explicit: participants lock collateral, submit proof, review counterparty proof, and let deterministic contract rules settle the result.

VOW is not a habit tracker, marketplace, or payment escrow. It secures reciprocal commitments: both parties are promisor and counterparty.

## How it works

```text
Create → Accept → Prove → Review → Settle → Withdraw
```

1. Create — Creator defines both promises, partner, equal stake, deadlines, and optional arbiter, then locks one stake.
2. Accept — Designated partner accepts the fixed agreement and locks matching collateral.
3. Prove — Each participant submits one public proof reference before the delivery deadline.
4. Review — Each counterparty reviews the other participant's proof. Approval marks SUCCESS; a rejection opens DISPUTED rather than failing immediately.
5. Settle — `finalizeVow()` applies timeout rules and the fixed settlement matrix, then credits claimable balances.
6. Withdraw — Participants pull their claimable BOT with `withdraw()`.

For SUCCESS / SUCCESS, each participant receives their own stake. A SUCCESS / FAILED outcome awards both stakes to the successful participant. Disputed outcomes are resolved by the configured arbiter or become UNRESOLVED after the dispute deadline; unresolved collateral is not awarded to the other party.

## Why blockchain

VOW coordinates two independent parties, locked collateral, fixed agreement rules, and verifiable transaction history without making either participant the other's custodian. The chain provides the custody and settlement boundary; it does not replace human judgment.

## Trust boundary

The smart contract handles collateral custody, authorization, deadlines, state transitions, and deterministic settlement. People judge real-world proof through counterparty review or the pre-agreed arbiter. VOW does not claim that blockchain can independently verify real-world truth.

## Architecture and settlement rules

The frontend reads and writes the deployed `Vow` contract. The contract stores reciprocal promises, proof references and hashes, participant outcomes, deadlines, claimable balances, and the immutable failure sink. `finalizeVow()` converts eligible timeout states, applies the settlement matrix, and credits `claimable`; `withdraw()` performs pull-payment withdrawal.

- SUCCESS / SUCCESS: each participant receives their own stake.
- SUCCESS / FAILED: successful participant receives both stakes.
- FAILED / FAILED: both stakes go to the documented failure sink.
- Any UNRESOLVED outcome: unresolved collateral returns to its owner rather than being awarded to the counterparty; failed collateral goes to the failure sink.

## Current submitted scope

The submitted frontend demonstrates the verified happy path: wallet connection, VOW creation, acceptance, proof submission, counterparty review, finalization, and withdrawal. It also exposes the dispute path: Dispute Proof for participants and Resolve Dispute (Uphold or Reject, per disputed participant) for the configured arbiter, both rendered in `ActionPanel.tsx`. The contract's dispute and arbiter-resolution logic exists and is Solidity-tested. The recorded on-chain run (Gate T) exercised the happy path only, so the dispute path is evidenced by the frontend unit tests and the Solidity suite.

## Deployment

Contract addresses for judges:

| Network | Chain ID | Contract address | Source verified |
| --- | --- | --- | --- |
| BOT Chain Mainnet | `677` | [`0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`](https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4) | Yes |
| BOT Chain Testnet (Bohr) | `968` | [`0x9539263f4861812B08C37Bb3cB6603c771d6530b`](https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b) | Yes |

Testnet explorer: [https://scan.bohr.life](https://scan.bohr.life)
Mainnet explorer: [https://scan.botchain.ai](https://scan.botchain.ai)

Testnet RPC: `https://rpc.bohr.life`
Mainnet RPC: `https://rpc.botchain.ai`

Both deployments are the same `src/Vow.sol` compiled with Solidity `0.8.24`, optimizer
enabled at 200 runs, `viaIR`, `evmVersion: cancun`. Each carries a different immutable
`failure sink`: the mainnet sink is the deployer address, the testnet sink is the
documented testnet address. The sink is a constructor argument with no fallback in the
deploy script, so it cannot silently default to the wrong chain.

Mainnet deployment transaction:
[`0x694234a9cad6d0162646c9661560bc2438f4175ae132dffee75c235c6ba320a7`](https://scan.botchain.ai/tx/0x694234a9cad6d0162646c9661560bc2438f4175ae132dffee75c235c6ba320a7)

## Network and deployment

Live frontend: [https://vowprotocol.web.id](https://vowprotocol.web.id) (canonical `https://www.vowprotocol.web.id`), serving the BOT Chain Mainnet build.

BOT Chain Mainnet (default target):

- Network: BOT Chain Mainnet
- Chain ID: `677`
- RPC: `https://rpc.botchain.ai`
- Explorer: [https://scan.botchain.ai](https://scan.botchain.ai)
- Contract: [`0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`](https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4) — source verified
- Failure sink: `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7`

Bohr Testnet:

- Network: Bohr Testnet
- Chain ID: `968`
- RPC: `https://rpc.bohr.life`
- Explorer: [https://scan.bohr.life](https://scan.bohr.life)
- Contract: [`0x9539263f4861812B08C37Bb3cB6603c771d6530b`](https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b) — source verified
- Failure sink: `0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B`

## Verified testnet evidence

Gate T verified VOW #1 through the complete happy path on Bohr Testnet.

- Creator collateral: `0.01 BOT`
- Partner collateral: `0.01 BOT`
- Total collateral: `0.02 BOT`
- Settlement: `0.01 BOT` each
- Final claimable balances: `0 BOT` each
- Final contract balance: `0 BOT`
- Double-withdraw correctly reverted with `NothingToWithdraw()`

Transaction receipts were verified successful:

| Step | Transaction |
| --- | --- |
| CREATE | [`0x88880af1f4cb77485c5f9d17251b186e1374313c84682454cdbb8e43cf174884`](https://scan.bohr.life/tx/0x88880af1f4cb77485c5f9d17251b186e1374313c84682454cdbb8e43cf174884) |
| ACCEPT | [`0xe2a985a02eb451e1dd3c0a1d299032e6cae5782fa2e69d4759315a55d8d3b760`](https://scan.bohr.life/tx/0xe2a985a02eb451e1dd3c0a1d299032e6cae5782fa2e69d4759315a55d8d3b760) |
| CREATOR PROOF | [`0xb5d9e7c7a2a21a7140450aeaba784cc453143b1e18f3933162877fb2daae6dc2`](https://scan.bohr.life/tx/0xb5d9e7c7a2a21a7140450aeaba784cc453143b1e18f3933162877fb2daae6dc2) |
| PARTNER PROOF | [`0x0a7644708779a013833ea969111feee59dc7ce7d77429d06062c939f790967e4`](https://scan.bohr.life/tx/0x0a7644708779a013833ea969111feee59dc7ce7d77429d06062c939f790967e4) |
| CREATOR REVIEWS PARTNER | [`0xe177ad96979e836bdd8fac5d714d95699ed35d8f55a693bbb4af3708bab54fbd`](https://scan.bohr.life/tx/0xe177ad96979e836bdd8fac5d714d95699ed35d8f55a693bbb4af3708bab54fbd) |
| PARTNER REVIEWS CREATOR | [`0xba09745a41a285c9dfa2536248ab818dc1f0941f2d23c9b2c11e166bbcb84cb7`](https://scan.bohr.life/tx/0xba09745a41a285c9dfa2536248ab818dc1f0941f2d23c9b2c11e166bbcb84cb7) |
| FINALIZE | [`0x368f8f9ef620001e540c218801b8f2bf06a9e63b1f7d4298fb20400aaec00a35`](https://scan.bohr.life/tx/0x368f8f9ef620001e540c218801b8f2bf06a9e63b1f7d4298fb20400aaec00a35) |
| CREATOR WITHDRAW | [`0x52e12c331980c749ce256eef3329a0906c26564c00e60c081b7610d7a2fb6402`](https://scan.bohr.life/tx/0x52e12c331980c749ce256eef3329a0906c26564c00e60c081b7610d7a2fb6402) |
| PARTNER WITHDRAW | [`0x6b1c627f98e21183ede86a70b08a8cd9f3fc9568a7d25464c01018cafcf18495`](https://scan.bohr.life/tx/0x6b1c627f98e21183ede86a70b08a8cd9f3fc9568a7d25464c01018cafcf18495) |

## Tech stack

- Solidity `0.8.24` and Foundry Forge `1.8.1`
- Next.js `16.3.4`
- React `19.2.8`
- wagmi `3.7.7`
- viem `2.56.3`
- Tailwind CSS `4.3.3`
- TypeScript `5.9.3`
- Vitest `5.0.0`

## Local frontend setup

Requirements: Node.js and npm.

```bash
cd frontend
npm ci
npm run dev
```

`npm run dev` starts the Next.js development server. `npm run build` creates the production build; `npm start` serves that build. See [Verification](#verification) for the full command list.

## Verification

All commands run from the repository root. Foundry is the only requirement for the contract tests; Node.js is required only for the frontend.

### Contract tests (118 tests, no Docker needed)

On Windows, Foundry installs to `%USERPROFILE%\.foundry\bin` and is not added to `PATH` by default, so call the binary directly. Git Bash / MSYS:

```bash
cd /d/VOW
"$USERPROFILE/.foundry/bin/forge.exe" test
```

PowerShell / cmd.exe:

```powershell
cd D:\VOW
& "$env:USERPROFILE\.foundry\bin\forge.exe" test
```

Expected output:

```text
Ran 8 test suites: 118 tests passed, 0 failed, 0 skipped (118 total tests)
```

If `forge` is on `PATH`, plain `forge test` is equivalent.

### Fallback: Docker

Use this when no local Foundry install exists.

```bash
docker run --rm --entrypoint forge -v D:/VOW:/work -w /work ghcr.io/foundry-rs/foundry:stable fmt --check
docker run --rm --entrypoint forge -v D:/VOW:/work -w /work ghcr.io/foundry-rs/foundry:stable build
docker run --rm --entrypoint forge -v D:/VOW:/work -w /work ghcr.io/foundry-rs/foundry:stable test -vvv
```

### Frontend

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

## Project structure

- `src/` — VOW Solidity contract
- `test/` — Foundry contract tests
- `script/` — deployment scripts
- `frontend/` — Next.js application, contract ABI, chain configuration, and UI
- `PRD.md`, `TECHNICAL-SPEC.md`, `DESIGN.md`, `IMPLEMENTATION-GATES.md` — product, protocol, design, and gate sources of truth
- `SESSION-HANDOFF.md` — verified session evidence

## Demo path

Full runbook, including pre-demo checklist and failure-path fallback: [DEMO.md](DEMO.md).

1. Connect a wallet on Bohr Testnet.
2. Inspect VOW #1 and its archived evidence.
3. Explain Create → Accept → Prove → Review → Settle → Withdraw.
4. Use the archived Gate T transaction links as proof of the completed flow.
5. Fresh transaction execution is optional, not required.

## Known limitations

- **VOW does not independently verify real-world truth.**
- The current frontend covers the full action set, including the dispute path.
- Dispute Proof and Resolve Dispute render in `ActionPanel.tsx`; the on-chain run recorded in Gate T exercised the happy path only.
- Solidity testing is documented through both local Foundry and the Docker-based Foundry workflow.

These are submitted-scope limitations, not claims that the contract's tested dispute logic is absent.

### Verification model

Participants are promisor and counterparty to each other. Each one submits a public proof reference and is reviewed by the other. Approval marks that side SUCCESS; a rejection opens DISPUTED instead of failing it, and the pre-agreed arbiter (or the dispute deadline) resolves it. The contract enforces custody, authorization, deadlines, and settlement; humans judge whether a real-world proof is genuine. That split is the trust boundary, not a gap.

## License

MIT. See [`LICENSE`](LICENSE).
