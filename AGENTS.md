# VOW agent guide

VOW is a hackathon MVP for BOT Chain: two wallets make reciprocal commitments, lock equal native BOT collateral, submit proof, review the counterparty, settle deterministically, and withdraw by pull-payment. Treat `TECHNICAL-SPEC.md`, `IMPLEMENTATION-GATES.md`, `PRD.md`, and `HERMES-MASTER-PROMPT.md` as source of truth.

## Current repo state
- Snapshot is docs-only: no package manifest, no build toolchain file, no test runner config, no frontend/backend source tree found in this audit.
- Do not invent build/test/lint commands. Re-scan for real toolchain files before changing code.

## Working rules
- One gate at a time. Follow `IMPLEMENTATION-GATES.md` order and stop at the current gate.
- Do not change product semantics unless spec explicitly says so.
- Keep scope frozen: no AI, DAO, oracle, NFT, token, marketplace, chat, notification, multi-party flow, unequal collateral, admin override, or upgradeable proxy.
- `reject != failed`: rejected proof becomes `DISPUTED`, not `FAILED`.
- `finalizeVow()` handles timeout conversion and settlement; do not push funds from review/dispute flows.

## Contract conventions
- Preferred Solidity stack from spec: Solidity `^0.8.24`; Foundry preferred; OpenZeppelin only when necessary.
- Native BOT collateral only.
- Use pull-payment accounting: credit `claimable`, then `withdraw()`.
- `withdraw()` must zero balance before transfer and use reentrancy protection if implemented with OZ `ReentrancyGuard`.
- Keep deadline ordering strict: `acceptDeadline < deliveryDeadline < reviewDeadline < disputeDeadline`.
- `failureSink` is constructor-defined or immutable and must not be changeable after deploy.
- `finalizeVow()` may be called by anyone and must be deterministic.

## Frontend conventions
- If/when frontend exists, preferred stack is Next.js + TypeScript + wagmi + viem + Tailwind.
- UI should surface block-explorer links and rely on chain state, not a centralized DB for protocol truth.

## Pitfalls
- Do not rely on frontend timers for enforcement; protocol deadlines live on-chain.
- Do not treat missing review after `reviewDeadline` as failure; spec says it becomes `SUCCESS`.
- Do not let a disputed proof move funds immediately.
- Do not allow self-review, proof impersonation, or arbiter fund control.
- Do not use `tx.origin`, `delegatecall`, or `selfdestruct`.

## Gate execution discipline
- Never begin the next implementation gate automatically.
- At the end of every gate, stop and report: STATUS, CHANGED, TESTS RUN, KEY FINDINGS, RISKS / NOTES, and NEXT ALLOWED GATE.
- A gate is PASS only when required commands were actually executed successfully.
- Never report tests/builds as passing based on inspection alone.
- If a gate exposes a conflict between PRD, technical spec, or implementation gates, stop and report the conflict before changing semantics.

## Fund invariants
- For every accepted VOW, total settlement allocation must equal exactly `2 * stake`.
- For every expired unaccepted VOW, refund allocation must equal exactly `stake`.
- A VOW must never be settled more than once.
- A claimable balance must never be withdrawn more than once.
- All accepted collateral must eventually become allocatable after applicable deadlines pass.

## Deadline boundaries
- Explicitly test behavior before, exactly at, and after every protocol deadline.
- Preserve the specification's `<= deadline` versus `> deadline` semantics exactly.
- Use chain timestamps as protocol truth; UI countdowns are informational only.

## Repository hygiene
- Prefer minimal diffs.
- Do not refactor, rename, reformat, or delete unrelated files.
- Do not change package manager or migrate toolchains without explicit approval.
- Never commit private keys, seed phrases, RPC secrets, or `.env` files containing secrets.

## Deployment discipline
- Do not deploy the contract until the complete mandatory contract test suite has zero failures.
- Do not silently redeploy after frontend integration has started.
- Record deployed network, chain ID, contract address, deployment transaction, deployer, failure sink, and explorer URL.

Treat `PRD.md`, `TECHNICAL-SPEC.md`, `DESIGN.md`,
`IMPLEMENTATION-GATES.md`, `LOOP-ENGINEERING.md`,
and `HERMES-MASTER-PROMPT.md` as source of truth.

## Git workflow

Hermes owns the Git workflow during implementation.

At the beginning of every gate:

1. Run `git status --short --branch`.
2. Inspect the current branch and working tree.
3. Do not overwrite unrelated user changes.
4. If unexpected pre-existing changes exist, stop and report them before implementation.

During a gate:

- Work only on files required by the current gate.
- Never use `git reset --hard`.
- Never use `git clean -fd`.
- Never force push.
- Never rewrite published history.
- Never discard user changes.
- Do not switch branches unless explicitly required.
- Do not commit secrets, `.env` credentials, private keys, seed phrases, or generated build artifacts.
- Keep generated Foundry directories such as `out/` and `cache/` untracked.

After implementation:

1. Run all verification required by the gate.
2. Inspect `git diff`.
3. Run `git status --short`.
4. Confirm the diff contains only current-gate work.

If and only if the gate is PASS:

1. Stage only files belonging to the gate.
2. Create exactly one checkpoint commit for the gate.
3. Use a concise Conventional Commit message.
4. Record the resulting commit hash in the gate report.
5. Verify the working tree is clean after the commit.

Recommended commit style:

- Gate B: `feat: add VOW contract skeleton`
- Gate C: `feat: implement VOW creation`
- Gate D: `feat: implement VOW acceptance`
- Gate E: `feat: implement proof submission`
- Gate F: `feat: implement proof review`
- Fix-only gate: `fix: <specific issue>`
- Documentation-only change: `docs: <specific change>`

If the gate is FAIL or BLOCKED:

- Do not create a successful gate checkpoint commit.
- Preserve the working tree.
- Report all changed/untracked files.
- Stop and wait for instructions.

Never push automatically unless explicitly authorized by the user.

A local commit is allowed after a verified PASS.
Remote push requires explicit authorization.