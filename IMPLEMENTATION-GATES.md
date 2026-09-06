# VOW v1 — IMPLEMENTATION GATES

This document defines the exact implementation sequence.

Only execute one gate at a time.

A gate may proceed only when the previous gate is PASS unless explicitly instructed otherwise.

---

# GATE A — Repository Audit

## Goal

Understand the existing repository without modifying product code.

## Tasks

Inspect:

```text
repository tree
git status
package manager
frontend framework
Solidity tooling
Node version requirements
existing contracts
existing tests
environment files/templates
wallet integration
chain/network config
deployment scripts
README
```

Check whether repository already contains:

```text
Foundry
Hardhat
Next.js
React
wagmi
viem
ethers
BOT Chain config
```

## Commands

Use appropriate read-only commands, for example:

```bash
git status
git branch --show-current
git log -5 --oneline
```

Then inspect package/config files.

If Foundry:

```bash
forge --version
forge build
forge test
```

If Node project:

```bash
node --version
npm --version
```

Use the repository's actual package manager.

Do not install or upgrade anything yet unless required merely to reproduce existing project behavior.

## Prohibited

Do not:

* change architecture;
* edit source files;
* install random dependencies;
* migrate Hardhat ↔ Foundry;
* create frontend pages;
* write contracts.

## PASS Criteria

Gate PASS only if we know:

```text
current stack
working baseline
existing failures
repo cleanliness
exact implementation starting point
```

## Required Report

Include:

```text
repo architecture
tool versions
baseline test/build result
uncommitted changes
risks
recommended Gate B approach
```

---

# GATE B — Contract Skeleton

## Goal

Create only the structural foundation of `Vow.sol`.

## Implement

Only:

```text
SPDX
pragma
imports
contract declaration

VowStatus enum
ParticipantStatus enum

Vow struct

storage:
nextVowId
vows
claimable
userVowIds
failureSink

constructor

events
custom errors
basic read helpers if required
```

No lifecycle functions yet except constructor/basic getters.

## Constructor

Must initialize immutable:

```solidity
failureSink
```

Reject:

```text
address(0)
```

## Tests

Create skeleton/constructor tests.

Must test:

```text
failureSink stored correctly
zero failureSink rejected
initial nextVowId correct
```

## Commands

```bash
forge build
forge test
```

or equivalent existing tooling.

## PASS Criteria

```text
contract compiles
skeleton tests pass
full existing suite remains green
```

Do not proceed to createVow.

---

# GATE C — Create VOW

## Goal

Implement `createVow()` only.

## Implement

```solidity
createVow(...)
```

Required validation:

```text
stake > 0
partner != zero
partner != creator

optional arbiter:
arbiter != creator
arbiter != partner

non-empty promises

current time < accept deadline

accept <
delivery <
review <
dispute
```

Store complete VOW data.

Initial:

```text
VowStatus.PROPOSED

creatorStatus = PENDING
partnerStatus = PENDING
```

Index VOW for:

```text
creator
partner
```

Emit:

```text
VowCreated
```

## Tests

Required:

```text
success
correct storage
correct stake
correct statuses
correct indexing
event emitted

zero partner revert
self partner revert
zero stake revert
empty creator promise revert
empty partner promise revert
invalid deadline ordering revert
past accept deadline revert
arbiter creator revert
arbiter partner revert
```

Boundary test accept deadline.

## PASS Criteria

All create tests and full suite PASS.

---

# GATE D — Accept VOW

## Goal

Implement partner acceptance and second collateral deposit.

## Implement

```solidity
acceptVow(uint256 vowId)
```

Rules:

```text
caller == partner
status == PROPOSED
timestamp <= acceptDeadline
msg.value == stake
```

Effect:

```text
status = ACTIVE
```

Emit:

```text
VowAccepted
```

## Tests

Required:

```text
partner accepts successfully
matching second stake accepted
status becomes ACTIVE
event emitted

unauthorized caller revert
incorrect stake revert
after deadline revert
accept twice revert
invalid VOW revert
```

Test exact deadline boundary.

## Accounting Check

After acceptance:

```text
contract received exactly
2 * stake
```

for isolated test fixture.

## PASS Criteria

Targeted + full suite PASS.

---

# GATE E — Proof Submission

## Goal

Allow both participants to submit proof exactly once.

## Implement

```solidity
submitProof(
    vowId,
    proofURI,
    proofHash
)
```

Rules:

```text
ACTIVE VOW
caller participant
timestamp <= deliveryDeadline
participant status PENDING
URI non-empty
hash non-zero
```

Effect:

```text
store URI
store hash
status → PROOF_SUBMITTED
```

Emit:

```text
ProofSubmitted
```

## Tests

Test creator and partner separately.

Required:

```text
creator success
partner success
URI stored
hash stored
status updated
event emitted

non-participant revert
before activation revert
after deadline revert
duplicate submission revert
empty URI revert
zero hash revert
```

Test delivery deadline boundary.

## PASS Criteria

All proof tests + full regression PASS.

---

# GATE F — Proof Review

## Goal

Implement counterparty approval/dispute.

## Implement

```solidity
reviewProof(
    vowId,
    participant,
    approved,
    disputeReason
)
```

Authorization:

```text
creator proof → only partner reviews
partner proof → only creator reviews
```

Precondition:

```text
target status == PROOF_SUBMITTED
timestamp <= reviewDeadline
```

If approved:

```text
target → SUCCESS
```

If rejected:

```text
target → DISPUTED
```

If rejected:

```text
dispute reason required
```

Rejected proof MUST NOT:

```text
transfer funds
mark FAILED
settle VOW
```

Emit appropriate event.

## Tests

Required:

```text
creator proof approved
partner proof approved
status SUCCESS

creator proof disputed
partner proof disputed
status DISPUTED
reason stored

self-review revert
third-party review revert
no-proof review revert
after deadline revert
double review revert

verify claimable remains unchanged after dispute
verify contract balance unchanged after dispute
```

## PASS Criteria

Targeted + full suite PASS.

---

# GATE G — Arbiter Resolution

## Goal

Resolve disputed proof without moving funds directly.

## Implement

```solidity
resolveDispute(
    vowId,
    participant,
    proofValid
)
```

Rules:

```text
arbiter configured
caller == arbiter
target participant valid
target == DISPUTED
timestamp <= disputeDeadline
```

Result:

```text
proofValid true → SUCCESS
proofValid false → FAILED
```

No transfer.

Emit:

```text
DisputeResolved
```

## Tests

Required:

```text
valid proof → SUCCESS
invalid proof → FAILED

non-arbiter revert
participant cannot resolve
non-disputed target revert
after deadline revert
no-arbiter VOW revert
```

Verify no funds move during arbiter resolution.

## PASS Criteria

Targeted + full suite PASS.

---

# GATE H — Timeout Resolution

## Goal

Implement deterministic participant timeout transitions.

## Required Rules

### No Proof

After:

```text
deliveryDeadline
```

if:

```text
PENDING
```

then:

```text
FAILED
```

### No Review

After:

```text
reviewDeadline
```

if:

```text
PROOF_SUBMITTED
```

then:

```text
SUCCESS
```

### Unresolved Dispute

After:

```text
disputeDeadline
```

if:

```text
DISPUTED
```

then:

```text
UNRESOLVED
```

## Implementation

Prefer small internal helper(s), for example:

```solidity
_resolveTimeouts(...)
```

Do not expose unnecessary public state-mutating helper functions.

Timeout processing will be called from finalization.

## Tests

Use `vm.warp`.

For each rule test:

```text
one second before
exact deadline
one second after
```

Test independently for creator and partner.

## Important

Do not prematurely transition states before deadline semantics allow it.

## PASS Criteria

All deadline tests + full suite PASS.

---

# GATE I — Finalization & Settlement

## Goal

Implement the most critical contract behavior.

## Implement

```solidity
finalizeVow(uint256 vowId)
```

Callable by:

```text
any address
```

### PROPOSED VOW

If expired:

```text
creator receives own stake
VOW → SETTLED
```

Before expiry:

```text
revert/not ready
```

### ACTIVE VOW

1. process timeout transitions;
2. determine whether both participant states are terminal;
3. reject if non-terminal;
4. apply exact settlement matrix;
5. credit `claimable`;
6. set VOW to SETTLED;
7. emit `VowSettled`.

Do NOT send native BOT from `finalizeVow`.

## Mandatory Settlement Tests

```text
SUCCESS SUCCESS

SUCCESS FAILED
FAILED SUCCESS

FAILED FAILED

SUCCESS UNRESOLVED
UNRESOLVED SUCCESS

FAILED UNRESOLVED
UNRESOLVED FAILED

UNRESOLVED UNRESOLVED
```

For every case verify:

```text
creator claimable
partner claimable
failure sink claimable

total allocation == 2 * stake

VOW == SETTLED
```

Also:

```text
cannot settle twice
cannot settle non-terminal VOW
expired proposal refund
expired proposal only settles once
```

## Critical Gate

DO NOT PASS this gate if any settlement branch is missing.

## PASS Criteria

```text
all settlement cases pass
accounting conservation confirmed
full suite 0 failures
```

---

# GATE J — Withdraw

## Goal

Allow safe pull-payment withdrawal.

## Implement

```solidity
withdraw()
```

Pattern:

```text
read claimable
require amount > 0
zero claimable
external native transfer
verify transfer success
```

Add:

```text
ReentrancyGuard
```

if appropriate.

Emit:

```text
Withdrawal
```

## Tests

Required:

```text
successful withdrawal
correct amount
claimable becomes zero
event emitted

nothing to withdraw revert
cannot withdraw twice
transfer failure behavior
reentrancy attempt
```

## PASS Criteria

Targeted + full suite PASS.

---

# GATE K — Full Contract Audit Pass

## Goal

Do not add features.

Review the finished contract against the specification.

## Audit Checklist

Verify:

```text
no self-partner
no invalid arbiter

all deadlines enforced

no proof impersonation
no self-review
no arbitrary dispute resolution

reject != failure

all timeouts resolve

all settlement branches present

all accepted collateral conserved

proposal refund conserved

no double settlement
no double withdrawal

no push payment

no admin override
no tx.origin
no delegatecall
no selfdestruct
```

## Commands

Run:

```bash
forge fmt --check
forge build
forge test -vv
```

If invariant/fuzz tests exist, run them.

Optional static analyzer only if already available; do not derail scope installing heavy tooling.

## Deliverable

Report:

```text
test count
failures
warnings
known limitations
security observations
```

## PASS Criteria

Contract considered deployment-ready.

---

# GATE L — BOT Chain Network Configuration

## Goal

Prepare deployment configuration.

## Tasks

Confirm from current official BOT Chain documentation/hackathon requirements:

```text
RPC URL
chain ID
native currency
explorer
required testnet/mainnet
wallet configuration
faucet if relevant
```

Do not guess network values.

Configure deployment securely.

Do not commit:

```text
private key
seed phrase
secret RPC credentials
```

Use environment variables.

## PASS Criteria

Network config validated and account can query chain.

---

# GATE M — Deploy Contract

## Goal

Deploy exactly the tested contract.

## Precondition

Gate K PASS.

## Deploy

Record:

```text
network
chain ID
contract address
deployment tx
deployer
failure sink
timestamp
explorer URL
```

If explorer verification is supported and straightforward, verify source.

## Post-Deploy Checks

Read:

```text
failureSink
nextVowId
```

from deployed contract.

Optionally perform minimal test transaction with small BOT.

## PASS Criteria

Deployed contract responds correctly.

---

# GATE N — Wallet & Contract Frontend Foundation

## Goal

Connect frontend to BOT Chain and deployed VOW contract.

## Implement

Only:

```text
wallet connect
BOT Chain configuration
correct contract ABI
contract address
read connection
network mismatch handling
```

Do not build pages yet.

## Tests / Checks

```text
frontend build succeeds
wallet connects
chain recognized
contract read succeeds
```

## PASS Criteria

Browser can reliably read deployed contract.

---

# GATE O — Vow Detail

## Goal

Build core operational screen first.

## Required Display

```text
Vow ID

creator
partner
arbiter

creator promise
partner promise

stake
total locked

deadlines

creator participant status
partner participant status

global VOW status
```

## Contextual Actions

Show only when executable:

```text
Accept
Submit Proof
Approve
Dispute
Resolve Dispute
Finalize
Withdraw
```

Do not show impossible actions.

## Transaction UX

Each write must show:

```text
wallet confirmation
submitted
confirming
confirmed/error
explorer link
```

## PASS Criteria

Existing on-chain VOW can be fully inspected and operated from detail page.

---

# GATE P — Create VOW

## Goal

Build creation UX.

## Fields

```text
partner address
creator promise
partner promise
stake BOT
accept deadline
delivery deadline
review deadline
dispute deadline
optional arbiter
```

Validate obvious form errors.

Primary action:

```text
CREATE VOW & LOCK <stake> BOT
```

After success:

redirect to:

```text
/vow/<id>
```

## PASS Criteria

Wallet A can create real VOW from frontend.

---

# GATE Q — My Vows

## Goal

List VOWs associated with connected wallet.

Show:

```text
Pending
Active
Completed
```

Each card should contain enough info to identify:

```text
VOW id
counterparty
promises
stake
current status
relevant deadline
```

Do not add database.

Use contract indexing/events/read methods defined by architecture.

## PASS Criteria

Creator and partner both see the VOW in their own wallet views.

---

# GATE R — Landing Page

## Goal

Explain product immediately.

Hero copy:

```text
VOW

Trust is good.
Collateral is better.

Put BOT behind promises you make to each other.
```

Primary:

```text
Create a Vow
```

Explain flow simply:

```text
Promise
Lock
Prove
Settle
```

Do not overbuild marketing site.

## PASS Criteria

New visitor understands product in approximately 10 seconds.

---

# GATE S — Two-Wallet Happy Path

## Goal

Prove the actual deployed application works end-to-end.

Use two independent wallets.

Execute:

```text
A create

B accept

A submit proof

B submit proof

A approve B

B approve A

finalize

A withdraw

B withdraw
```

Record all transaction hashes.

Verify resulting balances/state.

## PASS Criteria

Full happy path completed without manually altering contract/database state.

---

# GATE T — Failure Path Demo

## Goal

Demonstrate collateral consequence.

Create/demo VOW where:

```text
A submits valid proof and reaches SUCCESS
B does not submit proof
```

After deadline:

```text
B → FAILED
```

Finalize:

```text
A claimable = 2 * stake
```

Withdraw.

Record transactions.

## PASS Criteria

Economic failure consequence proven on deployed chain.

---

# GATE U — Submission Hardening

## Goal

Prepare hackathon submission without adding scope.

## README

Must contain:

```text
What is VOW
Problem
How it works
Why blockchain
Architecture
Settlement rules
Contract address
Network
Local setup
Testing
Demo
Known limitations
```

Known limitation must state explicitly:

```text
VOW does not independently verify real-world truth.
```

Explain counterparty/arbiter verification model.

## Verify

```text
live URL
repo
contract address
explorer
wallet flow
responsive UI
no obvious console-breaking errors
```

## PASS Criteria

A judge with no project context can open the URL and execute the main action.

---

# GATE V — Final Hackathon Freeze

## Goal

Stop changing architecture.

Run final:

```text
contract tests
frontend build
manual smoke test
```

Record final deployed addresses and demo data.

From this point:

Do not perform:

```text
dependency upgrade
architecture refactor
contract redeployment
UI redesign
new features
```

unless fixing a submission-blocking bug.

## Final Acceptance

MVP COMPLETE only if:

> Two independent wallets can create and accept a reciprocal commitment, lock equal BOT collateral, submit proof independently, review counterparty proof, deterministically settle the outcome, and withdraw funds without administrator intervention.
