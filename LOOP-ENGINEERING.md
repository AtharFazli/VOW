# VOW — LOOP ENGINEERING

## 1. Purpose

This document defines the engineering feedback loop for implementing VOW safely and efficiently with an AI coding agent.

It complements:

1. `PRD.md` — product requirements and intent.
2. `TECHNICAL-SPEC.md` — protocol behavior and implementation semantics.
3. `DESIGN.md` — frontend UX and visual requirements.
4. `IMPLEMENTATION-GATES.md` — ordered implementation milestones.
5. `HERMES-MASTER-PROMPT.md` and `AGENTS.md` — agent operating rules.

This document does not redefine product or protocol behavior. If it conflicts with the documents above, the higher-level source of truth wins.

The goal is simple:

> Make the smallest correct change, prove it works, inspect the result, and only then continue.

---

## 2. Core Loop

Every implementation task follows this loop:

```text
READ
  ↓
INSPECT
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
FORMAT / STATIC CHECK
  ↓
TEST
  ↓
REVIEW DIFF
  ↓
VERIFY AGAINST SPEC
  ↓
FIX IF NEEDED ─────────────┐
  ↑                        │
  └────────────────────────┘
  ↓
REPORT
  ↓
STOP
```

The agent must never skip directly from implementation to claiming completion.

---

## 3. Unit of Work

The primary unit of work is one implementation gate from `IMPLEMENTATION-GATES.md`.

Inside a gate, break work into the smallest independently verifiable tasks possible.

Example:

```text
Gate C — Create VOW

1. Add createVow validation.
2. Test invalid partner.
3. Test invalid arbiter.
4. Test zero stake.
5. Test deadline ordering.
6. Implement successful creation.
7. Test storage.
8. Test emitted event.
9. Run Gate C tests.
10. Run full available contract suite.
11. Review diff.
12. Report.
```

Do not implement Gate D while fixing Gate C.

---

## 4. Step 1 — Read

Before changing code, read the relevant source-of-truth sections.

At minimum:

- current gate in `IMPLEMENTATION-GATES.md`;
- relevant requirements in `PRD.md`;
- relevant semantics in `TECHNICAL-SPEC.md`;
- `DESIGN.md` when frontend behavior or presentation is involved;
- repository instructions in `AGENTS.md`;
- operating constraints in `HERMES-MASTER-PROMPT.md`.

Do not rely only on memory from an earlier session.

If documents conflict, stop before implementation and report the conflict.

---

## 5. Step 2 — Inspect

Inspect the actual repository before planning changes.

Check:

- current git status;
- current branch;
- relevant files;
- existing implementation;
- existing tests;
- dependency/toolchain files;
- compiler/framework configuration;
- generated artifacts that should not be edited;
- existing failures.

Never assume a file or dependency exists because the specification recommends it.

Never overwrite unrelated local changes.

---

## 6. Step 3 — Establish Baseline

Before a meaningful change, run the smallest relevant existing verification command when one exists.

Examples after toolchains are initialized:

```bash
forge test
```

```bash
npm test
```

```bash
npm run build
```

The exact command must come from the repository's real toolchain.

If baseline is already failing:

1. record the failure;
2. determine whether it is related to the current gate;
3. do not silently treat pre-existing failures as caused by the new change;
4. do not fix unrelated failures unless they block the gate.

For a brand-new subsystem with no applicable baseline command, explicitly state that no baseline exists yet.

---

## 7. Step 4 — Plan

Before editing, state:

```text
CURRENT GATE:
<gate>

FILES TO CHANGE:
- ...

FILES TO ADD:
- ...

TESTS TO ADD / UPDATE:
- ...

COMMANDS TO RUN:
- ...

EXPECTED BEHAVIOR:
- ...
```

Keep the plan minimal.

If the plan includes unrelated refactors, dependency upgrades, or future-gate features, reduce the scope before coding.

---

## 8. Step 5 — Implement

Implement the smallest change that satisfies the current requirement.

Rules:

- minimal diff;
- no speculative abstractions;
- no unrelated cleanup;
- no premature optimization;
- no hidden product changes;
- no future-gate functionality;
- no broad dependency upgrades;
- no fake implementation solely to make a test green.

For smart contracts, correctness and fund safety take priority over code cleverness.

For frontend, protocol truth must come from chain state.

---

## 9. Step 6 — Static Verification

Run the repository's applicable formatter, compiler, type checker, linter, or static analysis tools.

Only run commands that actually exist in the project.

Examples may include:

```text
forge fmt --check
forge build
npm run lint
npm run typecheck
npm run build
```

These are examples, not commands to invent blindly.

A formatting pass is not proof of correctness.

---

## 10. Step 7 — Test Narrow First

Run the narrowest tests covering the changed behavior first.

Examples:

```text
specific test
→ relevant test file
→ relevant test suite
→ full suite
```

This makes failures easier to diagnose.

Do not repeatedly run an expensive full suite while a focused test is still failing.

---

## 11. Step 8 — Test Broad

After focused tests pass, run all applicable tests for the subsystem.

Before a gate can PASS, run the full available suite required by that gate.

Before deployment, the complete mandatory contract suite must have zero failures.

Before final submission, contract and frontend verification must both pass.

---

## 12. Red → Green → Refactor

For behavior with meaningful logic, prefer:

```text
RED
Write or identify a test that demonstrates the required behavior.

GREEN
Implement the minimum code needed to satisfy it.

REFACTOR
Improve only when the behavior remains fully covered.
```

Refactoring is optional.

Correctness is mandatory.

Never refactor simply because a different architecture looks cleaner.

---

## 13. Boundary Loop

Deadlines are security-sensitive protocol behavior.

For every deadline-dependent rule, explicitly verify:

```text
BEFORE DEADLINE
EXACTLY AT DEADLINE
AFTER DEADLINE
```

This applies to:

- acceptance;
- proof submission;
- proof review;
- dispute resolution;
- timeout conversion;
- finalization readiness.

Tests must preserve the exact `<`, `<=`, `>=`, or `>` semantics required by `TECHNICAL-SPEC.md`.

Do not infer boundary semantics from UI wording.

---

## 14. Authorization Loop

For every state-changing contract function, verify:

```text
AUTHORIZED ACTOR
→ succeeds when state/time/value are valid

WRONG PARTICIPANT
→ reverts

UNRELATED WALLET
→ reverts where authorization is required

SELF-ACTION
→ reverts where prohibited

REPEAT ACTION
→ reverts or remains safely idempotent according to spec
```

Particularly verify:

- creator vs partner;
- counterparty-only review;
- arbiter-only resolution;
- permissionless finalization;
- owner-only withdrawal of each account's own claimable balance.

---

## 15. Money Loop

Any change affecting collateral, settlement, or withdrawal requires an explicit accounting check.

For an accepted VOW:

```text
TOTAL COLLATERAL = 2S
TOTAL SETTLEMENT ALLOCATION = 2S
```

For an expired unaccepted proposal:

```text
DEPOSITED = S
REFUND ALLOCATION = S
```

Verify:

- no value is created;
- no value is lost from accounting;
- no settlement occurs twice;
- no withdrawal occurs twice;
- disputed proof does not transfer funds;
- `finalizeVow()` credits balances rather than pushing funds;
- withdrawal clears accounting before external transfer.

For every settlement combination, calculate expected allocations before writing the assertion.

---

## 16. Settlement Matrix Loop

All final outcome combinations must remain tested:

```text
SUCCESS / SUCCESS
SUCCESS / FAILED
FAILED / SUCCESS
FAILED / FAILED
SUCCESS / UNRESOLVED
UNRESOLVED / SUCCESS
FAILED / UNRESOLVED
UNRESOLVED / FAILED
UNRESOLVED / UNRESOLVED
```

When finalization logic changes, rerun the entire settlement matrix.

Do not test only the happy path.

---

## 17. State-Machine Loop

For every lifecycle function, verify:

```text
valid previous state
→ valid transition

invalid previous state
→ revert

terminal state
→ cannot reopen lifecycle
```

Core global lifecycle:

```text
PROPOSED
   ↓
ACTIVE
   ↓
SETTLED
```

Participant outcomes must follow `TECHNICAL-SPEC.md`.

Critical rule:

```text
negative review
≠ FAILED

negative review
→ DISPUTED
```

Do not let frontend terminology alter contract state semantics.

---

## 18. Proof Loop

For proof submission and review, verify:

- participant submits only their own proof;
- proof can only be submitted once;
- proof is submitted within allowed time;
- URI is valid according to spec constraints;
- stored hash matches the required hashing convention;
- only the counterparty reviews;
- review only occurs when proof exists;
- approval produces `SUCCESS`;
- dispute produces `DISPUTED`;
- dispute does not settle or move collateral;
- missed review resolves according to timeout rules.

Do not add oracle, AI, or automatic proof validation.

---

## 19. Withdrawal Loop

Withdrawal requires dedicated adversarial testing.

Verify:

```text
claimable == 0
→ revert

claimable > 0
→ set accounting to zero
→ external transfer
→ success

second withdrawal
→ revert
```

Also test:

- reentrancy attempt;
- failed native transfer;
- correct recipient;
- one user's withdrawal cannot affect another user's claimable balance.

---

## 20. Frontend Engineering Loop

For each frontend action:

```text
READ CHAIN STATE
  ↓
DERIVE ALLOWED ACTION
  ↓
RENDER
  ↓
USER ACTION
  ↓
WALLET SIGNATURE
  ↓
TX SUBMITTED
  ↓
TX CONFIRMED / FAILED
  ↓
REFETCH CHAIN STATE
  ↓
RENDER NEW STATE
```

Never optimistically invent a final protocol state before confirmation.

Frontend state may improve UX but must not become protocol truth.

---

## 21. Frontend Action Verification

For each write action, verify at least:

```text
disconnected wallet
wrong network
authorized wallet
unauthorized wallet
invalid form
wallet rejection
transaction pending
transaction success
transaction revert/failure
state refresh after confirmation
duplicate-click protection
```

Where practical, verify both desktop and mobile behavior.

---

## 22. Frontend Visual Loop

When implementing a page or major component:

```text
IMPLEMENT
↓
RUN
↓
INSPECT AT DESKTOP WIDTH
↓
INSPECT AT MOBILE WIDTH
↓
CHECK AGAINST DESIGN.md
↓
FIX VISUAL / RESPONSIVE ISSUES
↓
REPEAT
```

Do not declare frontend design complete based only on compilation.

Check:

- hierarchy;
- spacing;
- overflow;
- long addresses;
- long proof URLs;
- disabled/loading states;
- transaction feedback;
- status readability;
- next-action clarity.

---

## 23. Contract ↔ Frontend Integration Loop

When frontend begins using a deployed contract:

1. verify chain ID;
2. verify deployed address;
3. verify ABI matches deployed bytecode/interface;
4. verify read calls;
5. verify write simulation where supported;
6. perform transaction;
7. wait for confirmation;
8. refetch state;
9. verify explorer transaction;
10. verify UI matches actual contract state.

Never silently use a stale ABI or stale deployment address.

---

## 24. Failure Loop

When any verification step fails:

```text
FAIL
↓
CAPTURE EXACT ERROR
↓
REPRODUCE
↓
LOCATE ROOT CAUSE
↓
CLASSIFY
↓
MAKE SMALLEST SAFE FIX
↓
RERUN FAILED CHECK
↓
RERUN RELEVANT SUITE
```

Classify failures as:

```text
implementation bug
test bug
spec ambiguity/conflict
environment/tooling issue
network/RPC issue
pre-existing unrelated failure
```

Do not make random edits until a test passes.

Do not weaken a valid test to hide an implementation bug.

---

## 25. Three-Strike Rule

If three reasonable fix attempts fail for the same root problem:

STOP.

Report:

```text
BLOCKER:
<exact problem>

ATTEMPTS:
1. ...
2. ...
3. ...

EVIDENCE:
<errors / commands>

LIKELY ROOT CAUSE:
...

SAFE OPTIONS:
- ...
- ...
```

Do not continue accumulating speculative changes.

---

## 26. Diff Review Loop

Before marking a gate PASS, inspect the final diff.

Ask:

```text
Did I change only current-gate scope?
Did I accidentally alter product semantics?
Did I add an unnecessary dependency?
Did I modify generated files?
Did I expose a secret?
Did I weaken validation?
Did I remove test coverage?
Did I add future-gate functionality?
Did formatting create a huge unrelated diff?
```

If yes, clean the diff and rerun verification.

---

## 27. Security Review Loop

For contract-related gates, perform a lightweight adversarial review before PASS.

Check for:

- unauthorized state changes;
- reentrancy;
- double settlement;
- double withdrawal;
- incorrect deadline boundaries;
- incorrect actor selection;
- stuck collateral;
- missing terminal path;
- arbitrary external calls;
- unsafe transfer ordering;
- mutable settlement authority;
- `tx.origin`;
- `delegatecall`;
- `selfdestruct`;
- accidental admin override;
- incorrect accounting.

For settlement/fund gates, security review is mandatory.

---

## 28. Secret Hygiene Loop

Before commit/report:

```text
git diff
git status
```

Check for:

- private keys;
- seed phrases;
- API keys;
- RPC credentials;
- `.env` secrets;
- deployment secrets;
- accidentally committed local files.

Use `.env.example` for documented environment variable names without secrets.

---

## 29. Gate PASS Criteria

A gate is PASS only when all are true:

```text
[ ] Current gate requirements implemented.
[ ] No future-gate behavior intentionally added.
[ ] Relevant focused tests pass.
[ ] Required broader suite passes.
[ ] Build/static checks required by the repo pass.
[ ] Deadline boundaries tested where applicable.
[ ] Authorization tested where applicable.
[ ] Fund invariants tested where applicable.
[ ] Final diff reviewed.
[ ] No known critical regression.
[ ] Evidence recorded in gate report.
```

If a required item cannot be verified, status is `BLOCKED` or `FAIL`, not `PASS`.

---

## 30. Gate Report

After every gate, produce:

```text
GATE:
<gate name>

STATUS:
PASS / FAIL / BLOCKED

CHANGED:
- file
- file

TESTS RUN:
- <command> → <result>
- <command> → <result>

VERIFICATION:
- <requirement> → PASS/FAIL
- <requirement> → PASS/FAIL

KEY FINDINGS:
- ...

RISKS / NOTES:
- ...

GIT STATUS:
- ...

NEXT ALLOWED GATE:
<next gate>
```

Use actual command results.

Never fabricate output.

---

## 31. Stop Rule

After the gate report:

> STOP.

Do not automatically begin the next gate.

The next gate starts only after explicit user authorization.

This is intentional. It creates a human checkpoint between meaningful implementation milestones.

---

## 32. Pre-Deployment Loop

Before contract deployment:

```text
FULL CONTRACT TEST SUITE
↓
FORMAT / BUILD
↓
SECURITY REVIEW
↓
SETTLEMENT MATRIX REVIEW
↓
INVARIANT / FUZZ RESULTS
↓
NETWORK CONFIG VERIFY
↓
DEPLOYMENT PARAMETERS VERIFY
↓
DEPLOY
↓
EXPLORER VERIFY
↓
RECORD DEPLOYMENT
```

Record:

- network;
- chain ID;
- contract address;
- deployment transaction;
- deployer;
- failure sink;
- explorer URL;
- commit hash if available.

Do not deploy from a dirty or unverified state without explicitly documenting why.

---

## 33. Post-Deployment Smoke Loop

After deployment, verify using the actual deployed contract:

```text
read basic state
create small test VOW
accept from second wallet
submit proof
review
finalize
withdraw
verify explorer transactions
```

Use testnet-sized collateral.

Do not assume local tests guarantee network configuration is correct.

---

## 34. Two-Wallet Demo Loop

Before hackathon freeze, run the real happy path from the UI:

```text
Wallet A
Create VOW + lock S

Wallet B
Accept + lock S

Wallet A
Submit proof

Wallet B
Submit proof

Wallet A
Approve B

Wallet B
Approve A

Any wallet
Finalize

Wallet A
Claim S

Wallet B
Claim S
```

Record any friction encountered.

Fix only issues required for reliable demo execution.

Then rerun from a clean browser/session where practical.

---

## 35. Failure Demo Loop

Prepare and verify at least one failure path before judging.

Recommended:

```text
A = SUCCESS
B = no proof
deadline passes
B → FAILED
finalize
A receives allocation of 2S
```

Because hackathon demos are time-constrained, prepare this VOW ahead of time rather than waiting for deadlines live.

Verify its state on-chain before the demo.

---

## 36. Final Hackathon Freeze Loop

At Gate V:

```text
FREEZE FEATURES
↓
FULL TESTS
↓
PRODUCTION BUILD
↓
TWO-WALLET SMOKE TEST
↓
FAILURE DEMO CHECK
↓
MOBILE CHECK
↓
EXPLORER LINKS CHECK
↓
README CHECK
↓
SUBMISSION LINKS CHECK
↓
FINAL GIT STATUS
↓
TAG / RECORD FINAL COMMIT
```

After freeze:

- no feature additions;
- no dependency upgrades;
- no visual redesign;
- no refactors without a concrete blocking reason.

Only fix submission-blocking defects.

---

## 37. Engineering Priorities

When trade-offs are necessary, use this order:

```text
1. Fund safety
2. Protocol correctness
3. Complete lifecycle / no stuck collateral
4. Test evidence
5. Demo reliability
6. Frontend clarity
7. Visual polish
8. Optimization
9. Architectural elegance
```

A boring correct implementation beats a clever fragile implementation.

---

## 38. Definition of Done

VOW engineering is done only when:

- the contract is deployed and working on the target BOT Chain network;
- two independent wallets can complete the happy path through the UI;
- collateral accounting matches the specification;
- all lifecycle paths can reach settlement;
- disputes do not prematurely move funds;
- timeout behavior is tested;
- all settlement combinations are tested;
- withdrawals are safe;
- frontend reflects confirmed chain state;
- core pages are responsive;
- explorer links work;
- failure-path demo is prepared;
- mandatory tests/builds pass;
- final repository state is documented and reproducible.

---

## 39. Final Rule

When uncertain:

```text
DO NOT GUESS
DO NOT EXPAND SCOPE
DO NOT HIDE FAILURE
```

Instead:

```text
READ THE SPEC
INSPECT THE REPO
MAKE THE SMALLEST CHANGE
PROVE IT
REPORT IT
STOP
```
