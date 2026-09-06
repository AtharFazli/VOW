# VOW v1 — Technical Specification

## 1. Document Purpose

Dokumen ini adalah **technical source of truth** untuk implementasi MVP VOW.

Agent/developer yang mengerjakan project HARUS mengikuti spesifikasi ini dan TIDAK BOLEH:

* menambah fitur di luar scope tanpa instruksi eksplisit;
* mengubah settlement rules;
* menambah AI, DAO, oracle, NFT, token baru, reputation system, chat, notification, atau IPFS pipeline;
* mengubah model dua participant menjadi multi-party;
* membuat backend kompleks untuk data yang dapat dibaca langsung dari smart contract;
* mengganti pull-payment model menjadi push-payment;
* menganggap rejected proof sebagai failure secara langsung.

Jika terdapat ambiguity, pilih implementasi paling sederhana yang tetap mempertahankan invariants dan acceptance criteria dalam dokumen ini.

---

# 2. Product Definition

## 2.1 Name

**VOW**

Tagline:

> Trust is good. Collateral is better.

## 2.2 Core Concept

VOW adalah peer-to-peer commitment protocol.

Dua participant membuat reciprocal promises dan masing-masing mengunci collateral dalam native BOT token.

Setelah VOW aktif:

1. kedua participant mengerjakan commitment masing-masing;
2. masing-masing dapat submit proof;
3. counterparty melakukan review terhadap proof;
4. proof yang approved menjadi SUCCESS;
5. proof yang rejected menjadi DISPUTED;
6. proof yang tidak pernah dikirim menjadi FAILED;
7. proof yang tidak direview hingga deadline menjadi SUCCESS;
8. dispute dapat diselesaikan arbiter yang sudah disepakati sebelum VOW aktif;
9. unresolved dispute berakhir sebagai UNRESOLVED;
10. contract menghitung settlement;
11. participant menarik dana menggunakan `withdraw()`.

Smart contract tidak menentukan apakah fakta dunia nyata benar.

Smart contract hanya menjamin:

* custody collateral;
* immutable agreement rules setelah activation;
* authorization;
* deadlines;
* deterministic state transitions;
* deterministic settlement.

---

# 3. MVP Scope

## 3.1 Included

MVP wajib memiliki:

* connect wallet;
* create VOW;
* partner accepts VOW;
* native BOT collateral lock;
* submit proof;
* approve proof;
* dispute proof;
* optional arbiter;
* resolve dispute;
* deadline-based outcome resolution;
* deterministic settlement;
* withdraw claimable balance;
* My Vows;
* Vow Detail;
* transaction links to block explorer.

## 3.2 Explicitly Excluded

JANGAN implementasikan:

* ERC-20 collateral;
* custom token;
* NFT;
* reputation scoring;
* user profiles;
* email notification;
* push notification;
* chat;
* comments;
* DAO;
* crowdsourced arbitration;
* AI verification;
* Chainlink/oracle verification;
* IPFS upload pipeline;
* multiple partners;
* multiple arbiters;
* partial milestone system;
* unequal collateral;
* protocol fee;
* marketplace;
* bidding;
* admin ability to alter outcomes;
* upgradeable proxy contracts.

---

# 4. Technology Constraints

Preferred smart-contract stack:

* Solidity `^0.8.24`
* Foundry preferred for contract development/testing
* OpenZeppelin only when necessary
* native BOT used as collateral
* no upgradeable contract architecture

Frontend recommendation:

* Next.js
* TypeScript
* wagmi
* viem
* wallet connector compatible with BOT Chain
* Tailwind CSS

Exact frontend framework can be adjusted only if existing starter project already uses another compatible stack.

Smart-contract behavior MUST NOT depend on an off-chain backend.

---

# 5. Core Actors

There are exactly three possible actors per VOW.

## 5.1 Creator

Creates the VOW.

Provides:

* partner address;
* creator promise;
* partner promise;
* collateral amount;
* deadlines;
* optional arbiter.

Creator sends exactly one stake during creation.

## 5.2 Partner

Address explicitly selected by creator.

Partner must explicitly accept the VOW and deposit exactly the same collateral amount.

## 5.3 Arbiter

Optional neutral third party.

The arbiter:

* is selected before VOW activation;
* cannot be creator;
* cannot be partner;
* cannot hold or withdraw participant collateral;
* cannot edit agreement;
* can only resolve a disputed proof;
* has zero authority when there is no dispute.

Use `address(0)` when no arbiter is configured.

---

# 6. High-Level Lifecycle

```text
CREATE
  |
  v
PROPOSED
  |
  | partner accepts + deposits matching stake
  v
ACTIVE
  |
  | proof submission / review / deadline resolution
  v
READY FOR SETTLEMENT
  |
  | finalizeVow()
  v
SETTLED
  |
  | withdraw()
  v
FUNDS CLAIMED
```

A VOW that is never accepted expires and creator receives a full refund.

---

# 7. Enums

Use the following enums unless implementation requires equivalent naming.

```solidity
enum VowStatus {
    PROPOSED,
    ACTIVE,
    SETTLED
}

enum ParticipantStatus {
    PENDING,
    PROOF_SUBMITTED,
    SUCCESS,
    FAILED,
    DISPUTED,
    UNRESOLVED
}
```

Do NOT introduce additional participant states without strong implementation necessity.

---

# 8. Vow Struct

Recommended struct:

```solidity
struct Vow {
    address creator;
    address partner;
    address arbiter;

    uint256 stake;

    uint64 acceptDeadline;
    uint64 deliveryDeadline;
    uint64 reviewDeadline;
    uint64 disputeDeadline;

    string creatorPromise;
    string partnerPromise;

    string creatorProofURI;
    string partnerProofURI;

    bytes32 creatorProofHash;
    bytes32 partnerProofHash;

    string creatorDisputeReason;
    string partnerDisputeReason;

    ParticipantStatus creatorStatus;
    ParticipantStatus partnerStatus;

    VowStatus status;
}
```

If gas optimization makes a smaller integer type appropriate, it may be used.

Do not sacrifice readability for premature gas optimization during hackathon MVP.

---

# 9. Storage

Minimum required storage:

```solidity
uint256 public nextVowId;

mapping(uint256 => Vow) public vows;

mapping(address => uint256) public claimable;
```

Recommended participant indexing:

```solidity
mapping(address => uint256[]) private userVowIds;
```

This may be used to support `My Vows`.

Alternative indexing is acceptable only if frontend can retrieve participant VOWs reliably without centralized database dependency.

---

# 10. Failure Sink

Contract MUST define an immutable or constructor-defined:

```solidity
address public immutable failureSink;
```

Requirements:

* cannot be `address(0)`;
* cannot be changed after deployment;
* must be transparently documented in README;
* failed-both settlement may route collateral there.

The failure sink must NOT be controlled through an admin function capable of changing settlement after deployment.

---

# 11. Deadlines

Every VOW has four ordered deadlines:

```text
acceptDeadline
<
deliveryDeadline
<
reviewDeadline
<
disputeDeadline
```

Contract MUST enforce strict ordering.

Recommended semantics:

## acceptDeadline

Latest time at which partner may call `acceptVow`.

## deliveryDeadline

Latest time participant may submit proof.

## reviewDeadline

Latest time counterparty may approve or dispute submitted proof.

No review by this deadline means submitted proof becomes SUCCESS.

## disputeDeadline

Latest time arbiter may resolve disputes.

Unresolved dispute after this deadline becomes UNRESOLVED.

All deadlines use Unix timestamps.

Do not rely on frontend timers for protocol enforcement.

---

# 12. Required Contract Functions

## 12.1 createVow

Recommended signature:

```solidity
function createVow(
    address partner,
    address arbiter,
    string calldata creatorPromise,
    string calldata partnerPromise,
    uint64 acceptDeadline,
    uint64 deliveryDeadline,
    uint64 reviewDeadline,
    uint64 disputeDeadline
) external payable returns (uint256 vowId);
```

`msg.value` is creator stake.

Requirements:

```text
msg.value > 0
partner != address(0)
partner != msg.sender

if arbiter != address(0):
    arbiter != msg.sender
    arbiter != partner

creatorPromise not empty
partnerPromise not empty

block.timestamp < acceptDeadline

acceptDeadline < deliveryDeadline
deliveryDeadline < reviewDeadline
reviewDeadline < disputeDeadline
```

Effects:

* assign new vowId;
* creator = msg.sender;
* partner = provided partner;
* arbiter = provided arbiter;
* stake = msg.value;
* status = PROPOSED;
* both participant statuses = PENDING;
* index vow under creator and partner;
* increment `nextVowId`;
* emit `VowCreated`.

Creator collateral remains inside contract.

---

## 12.2 acceptVow

Signature:

```solidity
function acceptVow(uint256 vowId) external payable;
```

Requirements:

* VOW exists;
* caller == partner;
* status == PROPOSED;
* current time <= acceptDeadline;
* `msg.value == vow.stake`.

Effects:

* status becomes ACTIVE;
* both stakes are now committed;
* emit `VowAccepted`.

Must not accept twice.

Must not allow mismatched collateral.

---

## 12.3 submitProof

Signature:

```solidity
function submitProof(
    uint256 vowId,
    string calldata proofURI,
    bytes32 proofHash
) external;
```

Requirements:

* VOW exists;
* status == ACTIVE;
* caller is creator or partner;
* current time <= deliveryDeadline;
* caller participant status == PENDING;
* proof URI must not be empty;
* proofHash must not be zero.

Effects for caller:

```text
proofURI stored
proofHash stored
status = PROOF_SUBMITTED
```

Emit:

```solidity
ProofSubmitted(...)
```

A participant may submit proof exactly once in MVP.

No proof editing.

No replacement.

This prevents changing evidence after counterparty begins reviewing.

---

# 13. Proof Review

## 13.1 reviewProof

Recommended signature:

```solidity
function reviewProof(
    uint256 vowId,
    address participant,
    bool approved,
    string calldata disputeReason
) external;
```

Where `participant` is the person whose proof is being reviewed.

Rules:

If reviewing creator proof:

```text
caller MUST be partner
```

If reviewing partner proof:

```text
caller MUST be creator
```

Additional requirements:

* VOW ACTIVE;
* current time <= reviewDeadline;
* target status == PROOF_SUBMITTED;
* reviewer != target participant.

If:

```text
approved == true
```

then:

```text
target status = SUCCESS
```

If:

```text
approved == false
```

then:

```text
target status = DISPUTED
```

A rejected proof MUST NOT become FAILED immediately.

If rejected, `disputeReason` must be non-empty.

Emit:

```solidity
ProofReviewed(...)
```

or separate events:

```solidity
ProofApproved(...)
ProofDisputed(...)
```

Separate events are preferred for clarity.

---

# 14. Automatic Outcome Resolution

`finalizeVow()` is responsible for converting unresolved timeout states into terminal participant outcomes.

Before settlement:

## 14.1 No Proof

If:

```text
block.timestamp > deliveryDeadline
AND participantStatus == PENDING
```

then:

```text
participantStatus = FAILED
```

Reason:

The protocol can objectively observe that no proof was submitted.

---

## 14.2 No Review

If:

```text
block.timestamp > reviewDeadline
AND participantStatus == PROOF_SUBMITTED
```

then:

```text
participantStatus = SUCCESS
```

Protocol rule:

**Silence after valid proof submission means acceptance.**

This rule prevents counterparty griefing by refusing to interact.

---

## 14.3 Unresolved Dispute

If:

```text
block.timestamp > disputeDeadline
AND participantStatus == DISPUTED
```

then:

```text
participantStatus = UNRESOLVED
```

This prevents collateral from remaining locked indefinitely.

---

# 15. Arbiter Resolution

## 15.1 resolveDispute

Recommended signature:

```solidity
function resolveDispute(
    uint256 vowId,
    address participant,
    bool proofValid
) external;
```

Requirements:

* VOW exists;
* status == ACTIVE;
* arbiter != address(0);
* caller == arbiter;
* target is creator or partner;
* target status == DISPUTED;
* current time <= disputeDeadline.

Effects:

If:

```text
proofValid == true
```

then:

```text
target status = SUCCESS
```

Else:

```text
target status = FAILED
```

Emit:

```solidity
DisputeResolved(...)
```

Arbiter MUST NOT directly transfer funds.

Arbiter only changes participant outcome.

Settlement always follows deterministic settlement rules.

---

# 16. No-Arbiter Disputes

If `arbiter == address(0)`:

A disputed participant remains `DISPUTED` until `disputeDeadline`.

After deadline:

```text
DISPUTED -> UNRESOLVED
```

Do not allow either participant to unilaterally resolve the dispute.

---

# 17. Terminal Participant Outcomes

Before VOW settlement, each participant MUST be one of:

```text
SUCCESS
FAILED
UNRESOLVED
```

`PENDING`, `PROOF_SUBMITTED`, or `DISPUTED` are non-terminal.

`finalizeVow()` must not settle until all non-terminal states that can still change have either:

* been explicitly resolved; or
* passed the applicable deadline and converted.

---

# 18. Settlement Matrix

Let:

```text
S = stake
```

Total active VOW collateral:

```text
2S
```

## SUCCESS / SUCCESS

```text
creator claimable += S
partner claimable += S
```

## SUCCESS / FAILED

Creator SUCCESS:

```text
creator claimable += 2S
```

Partner SUCCESS:

```text
partner claimable += 2S
```

## FAILED / FAILED

```text
failureSink claimable += 2S
```

If failureSink does not use withdrawal functionality, implementation may credit its address in the same `claimable` mapping.

Using `claimable[failureSink]` is preferred for consistent accounting.

## SUCCESS / UNRESOLVED

```text
creator gets own S
partner gets own S
```

Regardless of which side is SUCCESS.

Reason:

The protocol cannot fairly award the unresolved participant's collateral to the counterparty.

## FAILED / UNRESOLVED

Failed participant stake:

```text
failureSink += S
```

Unresolved participant:

```text
owner += S
```

## UNRESOLVED / FAILED

Symmetric.

## UNRESOLVED / UNRESOLVED

```text
creator += S
partner += S
```

---

# 19. Settlement Invariant

For every accepted VOW:

```text
total settlement allocation == 2 * stake
```

Exactly.

Never less.

Never more.

This invariant MUST be tested for every settlement combination.

For an unaccepted expired VOW:

```text
refund allocation == stake
```

---

# 20. finalizeVow

Recommended signature:

```solidity
function finalizeVow(uint256 vowId) external;
```

This function MAY be called by anyone.

There is no security reason to restrict finalization if state transitions are deterministic.

Responsibilities:

1. validate VOW exists;
2. reject if already SETTLED;
3. handle unaccepted expiration if applicable;
4. process timeout transitions;
5. verify participant statuses are terminal;
6. calculate settlement;
7. increase `claimable` balances;
8. set VOW status = SETTLED;
9. emit `VowSettled`.

Must follow checks-effects-interactions.

Should NOT transfer native token directly.

---

# 21. Unaccepted VOW Expiration

If:

```text
status == PROPOSED
AND block.timestamp > acceptDeadline
```

`finalizeVow()` should:

```text
claimable[creator] += stake
status = SETTLED
```

Emit a specific event or use settlement event with appropriate outcome.

Partner receives nothing because partner never deposited.

---

# 22. Withdraw

Signature:

```solidity
function withdraw() external;
```

Behavior:

```solidity
uint256 amount = claimable[msg.sender];

if amount == 0:
    revert NothingToWithdraw();

claimable[msg.sender] = 0;

send amount;
```

Use pull-payment pattern.

Apply checks-effects-interactions.

Use a reentrancy guard if using OpenZeppelin `ReentrancyGuard`.

Native transfer should use:

```solidity
(bool success, ) = payable(msg.sender).call{value: amount}("");
```

and revert on failure.

Emit:

```solidity
Withdrawal(address indexed account, uint256 amount);
```

---

# 23. Recommended Custom Errors

Use custom errors instead of long revert strings.

Minimum set:

```solidity
error ZeroAddress();
error InvalidPartner();
error InvalidArbiter();
error InvalidStake();
error InvalidDeadlineOrder();
error EmptyPromise();
error InvalidVow();
error InvalidVowStatus();
error Unauthorized();
error AcceptDeadlinePassed();
error IncorrectStake();
error DeliveryDeadlinePassed();
error ReviewDeadlinePassed();
error DisputeDeadlinePassed();
error ProofAlreadySubmitted();
error ProofNotSubmitted();
error InvalidProof();
error AlreadyReviewed();
error NotDisputed();
error VowNotReadyForSettlement();
error NothingToWithdraw();
error NativeTransferFailed();
```

Exact naming may be adjusted slightly, but semantics must remain explicit.

---

# 24. Required Events

Minimum:

```solidity
event VowCreated(
    uint256 indexed vowId,
    address indexed creator,
    address indexed partner,
    uint256 stake,
    address arbiter
);

event VowAccepted(
    uint256 indexed vowId,
    address indexed partner
);

event ProofSubmitted(
    uint256 indexed vowId,
    address indexed participant,
    string proofURI,
    bytes32 proofHash
);

event ProofApproved(
    uint256 indexed vowId,
    address indexed participant,
    address indexed reviewer
);

event ProofDisputed(
    uint256 indexed vowId,
    address indexed participant,
    address indexed reviewer,
    string reason
);

event DisputeResolved(
    uint256 indexed vowId,
    address indexed participant,
    bool proofValid
);

event VowSettled(
    uint256 indexed vowId,
    ParticipantStatus creatorOutcome,
    ParticipantStatus partnerOutcome
);

event Withdrawal(
    address indexed account,
    uint256 amount
);
```

Optional:

```solidity
event ParticipantTimedOut(...)
```

Only add if useful for debugging/UI.

---

# 25. Modifiers

Avoid excessive modifiers.

Recommended:

```solidity
modifier vowExists(uint256 vowId)
```

Potential:

```solidity
modifier onlyParticipant(uint256 vowId)
```

Do NOT bury complex state transitions inside modifiers.

Authorization/state mutations should remain visible in function bodies.

---

# 26. Contract Invariants

The implementation MUST preserve:

## INV-1

Creator can never equal partner.

## INV-2

Arbiter cannot equal either participant.

## INV-3

Accepted VOW contains exactly:

```text
2 * stake
```

worth of participant collateral attributable to that VOW.

## INV-4

No actor can submit proof for another participant.

## INV-5

No participant can review their own proof.

## INV-6

Rejected proof never transfers funds immediately.

## INV-7

Arbiter cannot transfer funds.

## INV-8

No outcome can be changed after settlement.

## INV-9

No VOW may settle more than once.

## INV-10

No withdraw may claim the same balance twice.

## INV-11

All accepted VOW collateral must eventually be allocatable after deadlines pass.

No permanent fund lock.

## INV-12

Settlement allocation for accepted VOW equals exactly:

```text
2 * stake
```

## INV-13

Settlement allocation for unaccepted expired VOW equals exactly:

```text
stake
```

---

# 27. Required Unit Tests

Tests are mandatory before frontend integration.

Use Foundry tests if possible.

---

## 27.1 createVow Tests

Must pass:

```text
test_createVow_success
test_createVow_storesCorrectData
test_createVow_locksCreatorStake
test_createVow_emitsEvent

test_createVow_revertZeroPartner
test_createVow_revertSelfPartner
test_createVow_revertZeroStake
test_createVow_revertEmptyCreatorPromise
test_createVow_revertEmptyPartnerPromise
test_createVow_revertInvalidDeadlineOrder
test_createVow_revertPastAcceptDeadline
test_createVow_revertArbiterIsCreator
test_createVow_revertArbiterIsPartner
```

---

## 27.2 acceptVow Tests

```text
test_acceptVow_success
test_acceptVow_changesStatusToActive
test_acceptVow_locksSecondStake
test_acceptVow_emitsEvent

test_acceptVow_revertUnauthorized
test_acceptVow_revertWrongStake
test_acceptVow_revertAfterDeadline
test_acceptVow_revertAlreadyAccepted
test_acceptVow_revertInvalidVow
```

---

## 27.3 submitProof Tests

Test creator and partner separately.

```text
test_creatorSubmitProof_success
test_partnerSubmitProof_success
test_submitProof_setsProofSubmittedStatus
test_submitProof_storesURI
test_submitProof_storesHash
test_submitProof_emitsEvent

test_submitProof_revertNonParticipant
test_submitProof_revertBeforeActivation
test_submitProof_revertAfterDeliveryDeadline
test_submitProof_revertTwice
test_submitProof_revertEmptyURI
test_submitProof_revertZeroHash
```

---

# 28. Proof Review Tests

```text
test_partnerCanApproveCreatorProof
test_creatorCanApprovePartnerProof

test_approve_setsSuccess
test_approve_emitsEvent

test_reject_setsDisputed
test_rejectDoesNotTransferFunds
test_reject_requiresReason
test_reject_emitsEvent

test_review_revertSelfReview
test_review_revertUnauthorized
test_review_revertNoProof
test_review_revertAfterReviewDeadline
test_review_revertAlreadyResolved
```

---

# 29. Timeout Tests

Use `vm.warp`.

Must cover:

```text
test_noProofAfterDeliveryDeadline_becomesFailed

test_submittedProofNoReviewBeforeDeadline_staysSubmitted
test_submittedProofNoReviewAfterDeadline_becomesSuccess

test_disputedBeforeDisputeDeadline_staysDisputed
test_disputedAfterDisputeDeadline_becomesUnresolved
```

Test both creator and partner paths.

---

# 30. Arbiter Tests

```text
test_arbiterCanResolveDisputeValid
test_arbiterCanResolveDisputeInvalid

test_validResolution_setsSuccess
test_invalidResolution_setsFailed

test_resolveDispute_revertNonArbiter
test_resolveDispute_revertNonDisputedParticipant
test_resolveDispute_revertAfterDeadline
test_resolveDispute_revertNoArbiter
```

---

# 31. Settlement Matrix Tests

Every combination MUST have dedicated test.

```text
test_settle_success_success

test_settle_success_failed
test_settle_failed_success

test_settle_failed_failed

test_settle_success_unresolved
test_settle_unresolved_success

test_settle_failed_unresolved
test_settle_unresolved_failed

test_settle_unresolved_unresolved
```

For EVERY test verify:

```text
claimableCreator
claimablePartner
claimableFailureSink

sum allocations == total collateral
status == SETTLED
```

---

# 32. Unaccepted Expiration Tests

```text
test_expiredProposal_refundsCreator
test_expiredProposal_partnerGetsNothing
test_expiredProposal_settlesOnlyOnce
```

---

# 33. Withdrawal Tests

```text
test_withdraw_success
test_withdraw_zeroesClaimableBeforeTransfer
test_withdraw_emitsEvent
test_withdraw_revertNothingToWithdraw
test_withdraw_cannotClaimTwice
```

Include malicious receiver/reentrancy test if feasible.

---

# 34. Fuzz / Invariant Tests

Minimum recommended fuzz tests:

```text
fuzz_stakeSettlementConservation
fuzz_deadlineOrdering
fuzz_noDoubleSettlement
fuzz_noDoubleWithdrawal
```

Critical property:

```text
allocated funds never exceed deposited funds
```

---

# 35. Frontend Pages

There are only four primary pages.

---

## 35.1 Landing

Purpose:

Explain product in under 10 seconds.

Required:

```text
VOW

Trust is good.
Collateral is better.

Put BOT behind promises you make to each other.

[ Create a Vow ]
```

Secondary section may explain:

```text
Promise
Lock
Prove
Settle
```

No complex marketing site required.

---

## 35.2 Create Vow

Fields:

```text
Partner Wallet Address

Your Promise

Partner's Promise

Stake Amount (BOT)

Accept Deadline

Delivery Deadline

Review Deadline

Dispute Deadline

Optional Arbiter Address
```

Primary button:

```text
CREATE VOW & LOCK {stake} BOT
```

Frontend MUST validate obvious errors before transaction.

Contract remains authoritative.

---

## 35.3 Vow Detail

Display:

```text
Vow ID

Creator
Partner
Arbiter

Creator Promise
Partner Promise

Collateral
Total Locked

Accept Deadline
Delivery Deadline
Review Deadline
Dispute Deadline

Creator Status
Partner Status
```

Then contextual action based on connected wallet/state.

Examples:

Partner while PROPOSED:

```text
[ ACCEPT & LOCK 10 BOT ]
```

Participant during ACTIVE before submission:

```text
Proof URL
[ SUBMIT PROOF ]
```

Reviewer after counterparty submits:

```text
[ APPROVE ]
[ DISPUTE ]
```

Arbiter during dispute:

```text
[ VALID PROOF ]
[ INVALID PROOF ]
```

After finalizable deadline:

```text
[ FINALIZE VOW ]
```

If claimable > 0:

```text
[ CLAIM 20 BOT ]
```

Do not show actions user cannot execute.

---

## 35.4 My Vows

Sections:

```text
Active
Pending
Completed
```

Each card:

```text
Vow #42

You:
Ship frontend

Partner:
Deploy contract

10 BOT each

ACTIVE

Delivery:
21 Sep 2026

[ VIEW ]
```

---

# 36. Frontend State Mapping

UI must derive actions from:

```text
wallet address
vow.status
participant statuses
deadlines
arbiter address
claimable balance
```

Do NOT maintain a separate authoritative status in localStorage/backend.

Blockchain state is source of truth.

---

# 37. Proof Representation

MVP proof is:

```text
proofURI
proofHash
```

Examples of valid URI:

```text
GitHub commit
deployed website
Google Drive public document
demo video
transaction explorer
other publicly accessible evidence
```

Frontend should calculate:

```text
proofHash = keccak256(bytes(proofURI))
```

or use another explicitly documented deterministic method.

Preferred for simplicity:

```solidity
keccak256(bytes(proofURI))
```

Frontend and tests MUST use same hashing rule.

---

# 38. Contract Balance Accounting

At all times:

```text
contract balance >= total claimable outstanding
```

plus unsettled collateral.

Avoid maintaining unnecessary global accounting unless needed.

Recommended invariant conceptually:

```text
contractBalance
=
unsettledCollateral
+
outstandingClaimable
```

Ignoring forcibly sent ETH/native token.

Do not rely on `address(this).balance` as exact accounting because native token may be force-sent.

---

# 39. Security Requirements

Required:

* checks-effects-interactions;
* pull payment;
* reentrancy protection on withdrawal;
* explicit authorization;
* explicit state checks;
* no `tx.origin`;
* no delegatecall;
* no selfdestruct;
* no admin settlement override;
* no arbitrary external calls;
* no unchecked arithmetic unless justified;
* no upgradeability;
* Solidity 0.8 overflow protections remain enabled.

---

# 40. Recommended Contract File Structure

```text
contracts/
  Vow.sol

test/
  Vow.Create.t.sol
  Vow.Accept.t.sol
  Vow.Proof.t.sol
  Vow.Review.t.sol
  Vow.Dispute.t.sol
  Vow.Timeout.t.sol
  Vow.Settlement.t.sol
  Vow.Withdraw.t.sol
  Vow.Invariant.t.sol

script/
  DeployVow.s.sol
```

Do not split contract into many abstractions unless actual complexity warrants it.

One readable contract is preferable for MVP.

---

# 41. Frontend Suggested Structure

```text
src/
  app/
    page.tsx

    create/
      page.tsx

    vow/
      [id]/
        page.tsx

    vows/
      page.tsx

  components/
    ConnectWallet.tsx
    VowCard.tsx
    VowStatusBadge.tsx
    DeadlineDisplay.tsx
    TransactionButton.tsx

  lib/
    contract.ts
    chain.ts
    format.ts
    vowState.ts

  abi/
    Vow.json
```

Exact folder structure may adapt to starter project.

---

# 42. Transaction UX Requirements

Every write transaction should clearly show:

```text
Idle
↓
Waiting for wallet
↓
Transaction submitted
↓
Confirming
↓
Confirmed
```

After confirmation:

* refetch relevant VOW state;
* refetch claimable balance;
* display explorer link.

No fake optimistic success state before chain confirmation.

---

# 43. Demo Happy Path

This exact scenario MUST work before polishing.

Use three wallets if arbiter flow is demonstrated.

Main demo requires only two.

## Wallet A

Create:

```text
Creator promise:
Ship frontend

Partner promise:
Deploy contract

Stake:
1 BOT
```

A deposits 1 BOT.

## Wallet B

Accepts.

B deposits 1 BOT.

Contract now holds:

```text
2 BOT
```

## Wallet A

Submits frontend proof.

## Wallet B

Submits contract proof.

## Wallet A

Approves B proof.

## Wallet B

Approves A proof.

## Anyone

Calls:

```text
finalizeVow()
```

Outcomes:

```text
SUCCESS / SUCCESS
```

Claimable:

```text
A = 1 BOT
B = 1 BOT
```

Both withdraw.

Explorer links visible.

---

# 44. Secondary Demo

Prepare an existing VOW where:

```text
A = SUCCESS
B = no proof
```

After deadline:

```text
B -> FAILED
```

Final settlement:

```text
A receives 2 BOT
```

This demonstrates actual collateral consequence.

Do not depend on waiting for deadlines during live judging.

Pre-create appropriate test/demo state.

---

# 45. Definition of Done — Contract

Contract work is DONE only when:

```text
all mandatory tests pass

no settlement matrix branch missing

no double settlement possible

no double withdraw possible

no permanent lock after deadlines

deployment script works

contract deployed successfully

verified deployment info stored
```

---

# 46. Definition of Done — Frontend

Frontend is DONE only when:

```text
wallet connects

network detected correctly

create works

accept works

submit proof works

approve works

dispute works

resolve dispute works

finalize works

withdraw works

My Vows works

Vow Detail reflects actual chain state

explorer links work
```

---

# 47. Definition of Done — Hackathon Submission

Submission-ready requires:

```text
deployed contract

live frontend

wallet connection

successful end-to-end main action

public repo

README

contract address

network information

demo transactions

screenshots

X post

submission form
```

---

# 48. README Requirements

README MUST include:

```text
What is VOW?

Problem

How VOW Works

Why Blockchain

Architecture

Settlement Rules

Contract Address

BOT Chain Network

How to Run Locally

How to Test

Demo Flow

Known Limitations
```

Known limitations MUST openly state:

> VOW does not independently verify real-world truth. Proof evaluation is performed by the counterparty or the pre-agreed arbiter. The blockchain guarantees collateral custody, agreement integrity, authorization, deadlines, and deterministic settlement.

Do NOT hide this limitation.

It makes the design more credible.

---

# 49. Agent Implementation Rules

When implementing this specification:

1. Read the entire specification before changing files.
2. Inspect existing repository before creating architecture.
3. Do not overwrite working configuration unnecessarily.
4. Implement contract before frontend polish.
5. Implement one function at a time.
6. Add tests immediately after each function.
7. Run relevant tests after every meaningful change.
8. Run full test suite before declaring a phase complete.
9. Never report PASS unless command output confirms PASS.
10. Do not silently modify settlement semantics to make implementation easier.
11. Do not add dependencies unless required.
12. Do not refactor unrelated code.
13. Prefer minimum diff.
14. Keep contract readable.
15. Preserve public API once frontend integration starts.
16. If a specification conflict is discovered, STOP changing semantics and explicitly report the conflict.
17. Security fixes may change implementation detail but not product semantics without approval.

---

# 50. Implementation Order

Agent MUST implement in this order.

## Phase A — Repository Audit

Inspect:

```text
existing frontend
existing contract setup
package manager
Foundry/Hardhat setup
network config
wallet libraries
environment variables
```

Output findings before major changes.

---

## Phase B — Contract Skeleton

Implement:

```text
enums
struct
storage
events
errors
constructor
```

Compile.

Do not continue if compilation fails.

---

## Phase C — Creation & Acceptance

Implement:

```text
createVow
acceptVow
```

Add corresponding tests.

Run tests.

---

## Phase D — Proof Flow

Implement:

```text
submitProof
reviewProof
```

Add corresponding tests.

Run tests.

---

## Phase E — Dispute

Implement:

```text
resolveDispute
```

Add tests.

Run tests.

---

## Phase F — Timeout State Resolution

Implement deadline transition logic.

Prefer internal helpers such as:

```solidity
_resolveParticipantTimeouts(...)
```

Only if they improve readability.

Test all deadline boundaries.

---

## Phase G — Settlement

Implement:

```text
finalizeVow
```

Implement complete settlement matrix.

Add all matrix tests.

Do not continue until every matrix case passes.

---

## Phase H — Withdraw

Implement:

```text
withdraw
```

Add reentrancy protection.

Test.

---

## Phase I — Full Contract Regression

Run full suite.

Expected:

```text
0 failing tests
```

Only then move to deployment/frontend integration.

---

## Phase J — Deployment

Deploy to required BOT Chain network.

Record:

```text
contract address
deployment transaction
network
chain ID
explorer URL
deployer
failureSink
```

---

## Phase K — Frontend Integration

Implement in priority order:

```text
Wallet connection
Vow Detail
Create Vow
My Vows
Landing
```

Notice Landing is deliberately last.

Functionality before aesthetics.

---

## Phase L — Demo Verification

Run actual end-to-end flow with two wallets.

Record transaction hashes for:

```text
create
accept
proof submission
approval
settlement
withdraw
```

---

# 51. Final Acceptance Gate

The project may be declared MVP COMPLETE only if this exact statement is true:

> Two independent wallets can create and accept a reciprocal commitment, lock equal BOT collateral, submit proof independently, review the counterparty's proof, deterministically settle the VOW according to the agreed rules, and withdraw the resulting funds without administrator intervention.

If any part of that sentence is false, MVP is NOT complete.

---

# 52. Non-Negotiable Product Rule

When uncertain, optimize for:

```text
working end-to-end interaction
>
feature count
```

The hackathon MVP is intentionally narrow.

Do not expand scope until the complete happy path and settlement edge cases are proven working.
