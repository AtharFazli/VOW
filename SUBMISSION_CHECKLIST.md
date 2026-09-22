# VOW — Submission Package

Girl Meets Tech Vol. 2 · BOT Chain

> Trust is good. Collateral is better.

This document is the submission package for VOW. Part 1 is the completed-work
record for judges. Part 2 is the internal checklist for finishing the mainnet
migration before the form is submitted.

---

# PART 1 — COMPLETED WORK

## 1.1 Executive summary

VOW is a two-person reciprocal commitment protocol. Two independent wallets lock
equal native BOT collateral behind promises they make to each other, submit
proof, review each other's proof, and let a smart contract settle the outcome on
fixed rules. No administrator, no custodian, no database.

The product targets a specific and narrow problem: promises between two people
are easy to make and expensive to enforce. VOW makes the consequence explicit
and automatic. Both sides are simultaneously promisor and counterparty, which is
what separates it from a habit tracker, a marketplace, or payment escrow.

## 1.2 What is finished

### Repository and release

| Item | Value |
| --- | --- |
| Repository | https://github.com/AtharFazli/VOW |
| Frozen release tag | `v1.0.0-hackathon-final` |
| Tag commit | `c23a4c2fef33662113d20f6df86f531effe105c9` |
| Release branch | `main` (default branch, carries the mainnet deployment) |
| Tag pushed to origin | Yes (verified against remote) |
| License | MIT |

### Smart contract

| Item | Value |
| --- | --- |
| Language / toolchain | Solidity `0.8.24`, Foundry Forge `1.8.1` |
| Source | `src/Vow.sol` |
| Deployed network | BOT Chain Mainnet + Bohr Chain (BOT Chain testnet) |
| Mainnet chain ID | `677` |
| Mainnet contract address | `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4` |
| Mainnet explorer | https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4 |
| Mainnet deploy tx | `0x694234a9cad6d0162646c9661560bc2438f4175ae132dffee75c235c6ba320a7` |
| Testnet chain ID | `968` |
| Testnet contract address | `0x9539263f4861812B08C37Bb3cB6603c771d6530b` |
| Testnet explorer | https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b |
| Source verification | **Verified on both explorers** (Blockscout, `v0.8.24+commit.e11b9ed9`, optimizer on, 200 runs, `viaIR`, cancun, 45 ABI entries) |
| Live read check (mainnet) | `failureSink()` → `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7`; `nextVowId()` → `0` |
| Live read check (testnet) | `failureSink()` → `0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B`; `nextVowId()` → `2` |
| Deploy script | `script/DeployVow.s.sol`, chain-guarded to `968` and `677` |

Contract test suite: **118 tests passed, 0 failed, 0 skipped** across 8 suites.

The suite covers the full lifecycle with dedicated files per concern:
creation and validation, acceptance, proof submission, counterparty review,
arbiter dispute resolution, timeout transitions, the complete settlement matrix,
withdrawal, and reentrancy behavior.

Settlement matrix implemented and tested for all nine outcome combinations:

```text
SUCCESS    / SUCCESS      each participant receives their own stake
SUCCESS    / FAILED       successful participant receives both stakes
FAILED     / FAILED       both stakes go to the documented failure sink
SUCCESS    / UNRESOLVED   unresolved collateral returns to its owner
UNRESOLVED / SUCCESS      unresolved collateral returns to its owner
FAILED     / UNRESOLVED   failed collateral to sink, unresolved returns to owner
UNRESOLVED / FAILED       failed collateral to sink, unresolved returns to owner
UNRESOLVED / UNRESOLVED   both stakes return to their owners
```

Every settlement case is asserted against `total allocation == 2 * stake`, so
collateral conservation is enforced by test, not by claim.

### Security posture

The contract was written against an explicit security requirement list and
passed an internal audit gate (Gate K) before deployment. Verified properties:

- Checks-effects-interactions ordering throughout
- Pull payment only. `finalizeVow()` never sends native BOT
- Reentrancy protection on `withdraw()`
- Explicit authorization per action. Counterparty-only review, arbiter-only resolution
- All deadlines enforced against chain time, not client time
- No `tx.origin`, no `delegatecall`, no `selfdestruct`
- No admin override and no upgradeability. No proxy, no owner-settled outcome
- Solidity 0.8 overflow protections enabled, no unchecked arithmetic

Note for judges: this is a documented internal audit pass, not a third-party
security audit. The requirement list it was verified against is section 39 of
`TECHNICAL-SPEC.md`.

### Verified on-chain evidence

A complete two-wallet happy path was executed on Bohr Chain and all nine
transaction receipts confirmed `SUCCESS`. Recorded in `README.md` and
`SESSION-HANDOFF.md`.

| Step | Transaction |
| --- | --- |
| CREATE | `0x88880af1f4cb77485c5f9d17251b186e1374313c84682454cdbb8e43cf174884` |
| ACCEPT | `0xe2a985a02eb451e1dd3c0a1d299032e6cae5782fa2e69d4759315a55d8d3b760` |
| CREATOR PROOF | `0xb5d9e7c7a2a21a7140450aeaba784cc453143b1e18f3933162877fb2daae6dc2` |
| PARTNER PROOF | `0x0a7644708779a013833ea969111feee59dc7ce7d77429d06062c939f790967e4` |
| CREATOR REVIEWS PARTNER | `0xe177ad96979e836bdd8fac5d714d95699ed35d8f55a693bbb4af3708bab54fbd` |
| PARTNER REVIEWS CREATOR | `0xba09745a41a285c9dfa2536248ab818dc1f0941f2d23c9b2c11e166bbcb84cb7` |
| FINALIZE | `0x368f8f9ef620001e540c218801b8f2bf06a9e63b1f7d4298fb20400aaec00a35` |
| CREATOR WITHDRAW | `0x52e12c331980c749ce256eef3329a0906c26564c00e60c081b7610d7a2fb6402` |
| PARTNER WITHDRAW | `0x6b1c627f98e21183ede86a70b08a8cd9f3fc9568a7d25464c01018cafcf18495` |

Accounting invariant confirmed after settlement:

```text
Accepted collateral:            0.02 BOT  (0.01 + 0.01)
SUCCESS/SUCCESS allocation:     0.01 BOT creator + 0.01 BOT partner
Total allocated:                0.02 BOT
Remaining claimable:            0 BOT
Remaining contract balance:     0 BOT
Double-withdraw:                correctly reverted with NothingToWithdraw()
```

A failure-path demo was also executed to prove the economic consequence, not
just the happy path: one participant reached `SUCCESS`, the other never
submitted proof, and after the delivery deadline the second side transitioned to
`FAILED`. Finalization awarded both stakes to the successful participant.

### Frontend

| Item | Value |
| --- | --- |
| Framework | Next.js `16.3.4`, React `19.2.8` |
| Web3 | wagmi `3.7.7`, viem `2.56.3` |
| Styling | Tailwind CSS `4.3.3` |
| Language | TypeScript `5.9.3` |
| Tests | Vitest `5.0.0` |

Frontend test suite: **102 tests passed, 0 failed** across 6 files.
Lint passes. Production build passes.

Pages shipped:

- `/` — landing page explaining the product and the lifecycle
- `/create` — Create VOW form with full validation
- `/my-vows` — wallet-scoped VOW dashboard via on-chain `getUserVowIds(address)`
- `/vow/[id]` — Vow Detail with contextual actions

Implementation details worth noting:

- Action eligibility is centralized in `getAvailableActions()`. The UI never
  offers an action that would revert.
- Authorization uses chain time read from the contract. No `Date.now()` decides
  whether an action is permitted.
- Every write simulates first, then waits for the transaction receipt, then
  surfaces an explorer link. A pending lock prevents duplicate submissions.
- Contract address, chain, and failure sink are environment-driven
  (`NEXT_PUBLIC_VOW_CHAIN`, `NEXT_PUBLIC_VOW_ADDRESS`, `NEXT_PUBLIC_FAILURE_SINK`),
  so the same build can target testnet or mainnet.
- Mainnet config is deliberately inert until a mainnet address is supplied.
  Setting the chain without an address falls back to testnet rather than
  pointing mainnet UI at the testnet contract.

### Launch video

| Item | Value |
| --- | --- |
| File | `brag-output/brag.mp4` |
| Duration | 20.2 s |
| Resolution | 1920x1080, 30 fps |
| Size | 4.57 MB |
| Thumbnail | `brag-output/brag.jpg` (1920x1080) |
| Built with | HyperFrames |
| Composition source | `brag-output/composition/` |
| Share copy | `brag-output/share-copy.txt` |

The video takes the product's own tagline literally and then proves it with the
real on-chain lifecycle: two counterparty cards meeting at a VOW medallion with
equal collateral, a cursor stepping through the actual action panel labels, and
the real settlement matrix. It closes on the deployment line. The claim is
verifiable, not decorative.

### Documentation

| Document | Purpose |
| --- | --- |
| `README.md` | Judge entry point, problem, architecture, settlement rules, verification commands |
| `DEMO.md` | 3 to 5 minute demo runbook with pre-demo checklist and failure fallback |
| `PRD.md` | Product requirements |
| `TECHNICAL-SPEC.md` | Protocol specification including the security requirement list |
| `DESIGN.md` | Design source of truth |
| `IMPLEMENTATION-GATES.md` | Gate A through V definitions and pass criteria |
| `SESSION-HANDOFF.md` | Verified session evidence and gate status |

### Honest scope boundaries

Stated plainly because judges should not have to discover them:

- VOW does not independently verify real-world truth. Humans judge proof through
  counterparty review or the pre-agreed arbiter. The contract enforces custody,
  authorization, deadlines, and settlement. That split is the trust boundary.
- The submitted frontend exposes the happy path. The contract's dispute and
  arbiter-resolution logic exists and is Solidity-tested, but complete
  Dispute/Resolve UI controls are not exposed in the submitted frontend.
- No public frontend URL exists. The frontend is verified locally.
- Out of scope for this build: tokens, oracles, DAOs, NFTs, chat, multi-party
  commitments, unequal collateral, admin override, and upgradeable proxies.

---

# PART 2 — SUBMISSION CHECKLIST

## 2.1 Mainnet deployment — DONE

Status: **deployed and source-verified on BOT Chain Mainnet (chain `677`)**.

| Item | Value |
| --- | --- |
| Deployer address | `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` |
| Deployed contract | `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4` |
| Deploy tx | `0x694234a9cad6d0162646c9661560bc2438f4175ae132dffee75c235c6ba320a7` |
| Mainnet failure sink | `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` (deployer-controlled) |
| Deploy gas used | `2295943` at `20 gwei` = `0.04591886 BOT` |
| Source verification | Verified on `scan.botchain.ai` |
| Post-deploy read-back | `failureSink()` matches intent; `nextVowId()` → `0` |

Steps 1–5 below are kept as the executed record of how this was done, and as the
procedure for any future deployment. Steps 6–8 remain open.

### Step 1 — Top up the deployer wallet — DONE

Send BOT to `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` on BOT Chain Mainnet.

- Absolute minimum: `0.046 BOT` to cover the deployment transaction alone.
- Recommended: `0.15 BOT` or more, so the deploy is followed by a funded smoke
  path (two `0.01 BOT` stakes plus gas for roughly nine transactions) without a
  second top-up round.

Confirm the top-up landed:

```bash
cd /d/VOW
"$USERPROFILE/.foundry/bin/cast.exe" balance 0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7 --rpc-url https://rpc.botchain.ai
```

### Step 2 — Set a MAINNET failure sink before deploying — DONE

**This is the step where a mistake is permanent.** The failure sink is an
immutable constructor argument. Whatever address is passed at deploy time is
baked into the contract forever. A wrong value cannot be corrected, and any
collateral that reaches the sink is unrecoverable.

Resolved state: `.env` held `FAILURE_SINK=0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B`,
which is the **Bohr testnet** sink. Deploying to mainnet with that value would
have routed mainnet collateral to a testnet address. It was replaced with the
deployer address `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7`, which the operator
controls, before the deploy was broadcast.

Before deploying:

1. Decide the mainnet sink address deliberately. It should be an address whose
   key you control, or a burn address you accept losing funds to by design.
2. Set `FAILURE_SINK` in `.env` to that mainnet address.
3. Verify the value by reading it back before running the deploy:

```bash
cd /d/VOW
grep '^FAILURE_SINK=' .env
```

4. The deploy script reads `FAILURE_SINK` from the environment with no fallback.
   That is intentional: a default would silently bake the wrong sink into a live
   contract. There is no safe default here, so none exists.

### Step 3 — Dry-run, then deploy to mainnet

Dry-run again against mainnet with the new sink, then deploy.

```bash
cd /d/VOW
"$USERPROFILE/.foundry/bin/forge.exe" script script/DeployVow.s.sol --profile bot_mainnet
"$USERPROFILE/.foundry/bin/forge.exe" script script/DeployVow.s.sol --profile bot_mainnet --broadcast
```

The script is chain-guarded. It accepts only chain `968` and chain `677` and
reverts otherwise, so a misconfigured RPC cannot deploy to an unintended network.

Record from the broadcast output: contract address, deployment transaction hash,
deployer, failure sink, chain ID, and timestamp.

### Step 4 — Verify source on the mainnet explorer — DONE

Submitted to the BOT Chain Mainnet explorer (https://scan.botchain.ai) so judges
can read the contract, not just call it. Confirmed `is_verified: true`, contract
name `Vow`, compiler `v0.8.24+commit.e11b9ed9`, optimizer enabled at 200 runs,
`viaIR`, `evmVersion: cancun`, 45 ABI entries, constructor args matching the
sink. The testnet contract was verified the same way on `scan.bohr.life`.

```bash
forge verify-contract <ADDRESS> src/Vow.sol:Vow --chain 677 \
  --verifier-url https://scan.botchain.ai/api --verifier blockscout \
  --constructor-args $(cast abi-encode "constructor(address)" <FAILURE_SINK>)
```

`--watch` reports a spurious `Fail - Unable to verify` on these explorers while
the contract is in fact already verified; confirm with the API instead of the
watcher:

```bash
curl -s "https://scan.botchain.ai/api/v2/smart-contracts/<ADDRESS>" | grep -o '"is_verified":[a-z]*'
```

### Step 5 — Post-deploy read check — DONE

Confirmed the deployed contract responds correctly and holds the sink intended:

```bash
cd /d/VOW
CAST="$USERPROFILE/.foundry/bin/cast.exe"
"$CAST" call 0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4 "failureSink()(address)" --rpc-url https://rpc.botchain.ai
"$CAST" call 0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4 "nextVowId()(uint256)" --rpc-url https://rpc.botchain.ai
```

Result: `failureSink()` → `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` (matches
intent exactly), `nextVowId()` → `0`.

### Step 6 — Point the frontend at mainnet

The chain config, the mainnet `defineChain` entry, and the environment-driven
address wiring all now live on `main`. What is missing is the mainnet build itself.

`NEXT_PUBLIC_*` values are inlined at build time, so they must be set before
`next build`, not at runtime. There is currently no `frontend/.env.local`.

Create `frontend/.env.local`:

```text
NEXT_PUBLIC_VOW_CHAIN=mainnet
NEXT_PUBLIC_VOW_ADDRESS=0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4
NEXT_PUBLIC_FAILURE_SINK=0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7
```

All three must be set together. `NEXT_PUBLIC_VOW_CHAIN=mainnet` alone is inert:
`contract.ts` deliberately falls back to testnet when `NEXT_PUBLIC_VOW_ADDRESS`
is absent, so that a mainnet UI can never point at the testnet contract.

Then rebuild and re-run the checks:

```bash
cd /d/VOW/frontend
npm ci
npm test
npm run lint
npm run build
```

Do not deploy a mainnet frontend build while any of the three values is unset.
The mainnet configuration is inert by design and falls back to testnet, so a
half-configured build would show testnet data under a mainnet label.

### Step 7 — Optional: mainnet smoke path

A minimal funded run proves the mainnet deployment is not just present but
working. Two wallets, `0.01 BOT` stake each:

```text
A create → B accept → A proof → B proof → A approve B → B approve A
→ finalize → A withdraw → B withdraw
```

Record the nine transaction hashes and link them in the submission.

If the submission deadline is tight, this is the step to cut. The testnet
evidence already proves the lifecycle; the mainnet smoke path only proves the
mainnet deployment.

### Step 8 — Decide the frozen submission commit

The mainnet work now lives on `main`, which is the repository default branch a
judge lands on.

| Ref | Commit | State |
| --- | --- | --- |
| `main` | `c986d7e` + this commit | Pushed to origin, default branch |
| `v1.0.0-hackathon-final` | `c23a4c2` | Pushed to origin (testnet-only, superseded) |
| `testnet-mainnet` | `c23a4c2` | Pushed to origin (testnet-only, superseded) |
| `mainnet-deployment` | `6ca0829` | Local only — content now on `main`, safe to delete |

Recommended: cut a new tag such as `v1.1.0-mainnet` on the current `main` tip and
submit that, so the submitted release matches the branch that carries the mainnet
deployment. Do not submit a link to `mainnet-deployment`: its content is already
on `main`, and the branch is unpushed.

## 2.2 Submission link structure

Fill these in and paste them into the form in this order.

### Repository

Frozen release tag (testnet-only, superseded by `main`):

```text
https://github.com/AtharFazli/VOW/tree/v1.0.0-hackathon-final
```

Readme entry point (branch `main`, the default branch):

```text
https://github.com/AtharFazli/VOW/blob/main/README.md
```

### Deployed contract

Bohr testnet, chain `968` (source verified):

```text
https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b
```

Mainnet, chain `677` (source verified):

```text
https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4
```

### Launch video

The video is currently a local file at `brag-output/brag.mp4` and has no public
URL. It must be uploaded before submission. Any of these works:

- YouTube, unlisted or public
- A GitHub release asset attached to the submitted tag
- Google Drive with link sharing enabled

Then paste the shareable link:

```text
Video demo (HyperFrames): <PUBLIC_VIDEO_URL>
```

If the video is uploaded as a GitHub release asset rather than a streaming
platform, attach the thumbnail `brag-output/brag.jpg` as the release image so
the form preview is not blank.

### Evidence of execution

Archived transaction table (testnet, all nine receipts `SUCCESS`):

```text
https://github.com/AtharFazli/VOW/blob/main/README.md#verified-testnet-evidence
```

Demo runbook:

```text
https://github.com/AtharFazli/VOW/blob/main/DEMO.md
```

### Complete link block, ready to paste

```text
Repository (branch main, default):
https://github.com/AtharFazli/VOW

Deployed contract (BOT Chain mainnet, chain 677, source verified):
https://scan.botchain.ai/address/0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4

Deployed contract (Bohr testnet, chain 968, source verified):
https://scan.bohr.life/address/0x9539263f4861812B08C37Bb3cB6603c771d6530b

Mainnet deploy transaction:
https://scan.botchain.ai/tx/0x694234a9cad6d0162646c9661560bc2438f4175ae132dffee75c235c6ba320a7

Launch video (HyperFrames, 20s):
<PUBLIC_VIDEO_URL>

Verification and on-chain evidence:
https://github.com/AtharFazli/VOW/blob/main/README.md#verification
```

## 2.3 Draft Executive Summary for the registration form

Two versions. Use the short one if the form caps the field, the long one if it
allows a paragraph.

### Short version (about 60 words)

> VOW is a two-person reciprocal commitment protocol on BOT Chain. Two wallets
> lock equal BOT collateral behind promises they make to each other, submit
> proof, review each other's proof, and let a smart contract settle the outcome
> on fixed rules. No admin, no custodian, no database. 118 contract tests and
> 102 frontend tests pass. Deployed on Bohr Chain with 19 on-chain transactions.

### Long version (about 180 words)

> Promises are cheap to make and expensive to enforce. VOW makes the
> consequence automatic.
>
> VOW is a two-person reciprocal commitment protocol on BOT Chain. Two
> independent wallets lock equal native BOT collateral behind promises they make
> to each other, submit proof before the delivery deadline, review each other's
> proof, and let the contract settle the outcome on a fixed settlement matrix.
> Both participants are promisor and counterparty at once, which is what
> separates VOW from a habit tracker, a marketplace, or payment escrow.
>
> The contract handles custody, authorization, deadlines, lifecycle transitions,
> and deterministic settlement. It never claims to verify real-world truth.
> People judge proof through counterparty review or a pre-agreed arbiter. That
> split is the trust boundary, stated openly rather than papered over.
>
> Everything is verifiable. 118 contract tests and 102 frontend tests pass. The
> full two-wallet lifecycle, including the failure path where a missed deadline
> forfeits collateral, was executed on Bohr Chain and all nine transaction
> receipts are archived in the README. Source is not yet verified on the explorer.

### One-line pitch, if the form has a tagline field

```text
Trust is good. Collateral is better.
```

## 2.4 Final pre-submit checks

Run these in order. Each one should be green before the form is submitted.

```bash
cd /d/VOW
"$USERPROFILE/.foundry/bin/forge.exe" fmt --check
"$USERPROFILE/.foundry/bin/forge.exe" build
"$USERPROFILE/.foundry/bin/forge.exe" test
cd frontend && npm test && npm run lint && npm run build
```

- [ ] Contract tests: 118 passed, 0 failed
- [ ] Frontend tests: 102 passed, 0 failed
- [ ] Frontend lint and production build pass
- [ ] Deployer funded on mainnet (step 1)
- [ ] Mainnet `FAILURE_SINK` set deliberately and read back (step 2)
- [ ] Mainnet deploy executed and recorded (step 3)
- [ ] Source verified on mainnet explorer (step 4)
- [ ] Post-deploy `failureSink()` matches intent (step 5)
- [ ] Frontend mainnet build produced with all three `NEXT_PUBLIC_*` values (step 6)
- [ ] Frozen submission commit chosen and pushed (step 8)
- [ ] Video uploaded and public URL in hand
- [ ] Every link in section 2.2 opens in a logged-out browser window
- [ ] Submission form fields filled from section 2.3

## 2.5 Known risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Wrong mainnet failure sink | Permanent and unrecoverable | Step 2, plus read-back check in step 5 |
| Submitting a link to an unpushed branch | Judge sees a dead or misleading link | Step 8, decide the frozen commit |
| Video has no public URL | Submission incomplete | Upload before submitting |
| Mainnet deploy slips past the deadline | No mainnet address to show | Resolved — mainnet deployed and verified; the testnet deployment remains as a fallback evidence path |
| No public frontend URL | Judges cannot click through the app | Archive the demo video and the transaction table as the judging path, as `DEMO.md` already specifies |
