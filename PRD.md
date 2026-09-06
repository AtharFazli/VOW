# VOW v1 — Product Requirements Document

## 1. Product Name

**VOW**

Tagline:

> Trust is good. Collateral is better.

---

# 2. Product Summary

VOW adalah peer-to-peer commitment protocol yang memungkinkan dua orang membuat janji timbal balik dan menaruh collateral BOT di balik janji tersebut.

Kedua pihak:

1. menyepakati commitment masing-masing;
2. mengunci collateral dengan jumlah yang sama;
3. menyelesaikan commitment;
4. mengirim proof;
5. memverifikasi proof milik counterparty;
6. membiarkan smart contract menentukan settlement sesuai aturan yang sudah disepakati sebelumnya.

VOW bukan habit tracker, bukan freelance marketplace, dan bukan escrow pembayaran.

VOW adalah:

> **collateralized promises between people.**

---

# 3. Problem

Dalam kolaborasi dua orang, janji sering hanya bergantung pada kepercayaan informal.

Contoh:

* founder berjanji menyelesaikan copy;
* developer berjanji deploy contract;
* designer berjanji menyelesaikan mockup;
* student A berjanji membuat slides;
* student B berjanji menulis report.

Biasanya mekanismenya hanya:

```text id="gv9j8m"
"I'll finish it by Friday."

"Okay, trust me."
```

Jika salah satu pihak gagal:

* tidak ada konsekuensi yang sudah disepakati;
* pihak lain menanggung dampaknya;
* tidak ada neutral custody;
* rules bisa diperdebatkan setelah kegagalan terjadi;
* riwayat komitmen tidak transparan.

---

# 4. Proposed Solution

VOW membuat commitment tersebut memiliki economic consequence.

Contoh:

```text id="9ksr25"
ATHAR                     ALI

Ship frontend             Deploy contract

before Friday             before Friday

10 BOT                    10 BOT
    \                      /
        VOW CONTRACT
             🔒
```

Kedua pihak menaruh BOT sebagai collateral.

Jika keduanya berhasil:

```text id="ph9u30"
Athar → SUCCESS
Ali   → SUCCESS

10 BOT → Athar
10 BOT → Ali
```

Jika Athar berhasil dan Ali gagal:

```text id="o5q3vq"
Athar → SUCCESS
Ali   → FAILED

20 BOT → Athar
```

Dengan begitu kegagalan commitment memiliki konsekuensi ekonomi yang sudah diketahui sejak awal.

---

# 5. Product Vision

VOW ingin mengubah:

> “Trust me, I’ll do it.”

menjadi:

> “I’ll put collateral behind it.”

Long-term vision:

VOW dapat menjadi portable commitment layer untuk:

* collaborators;
* creators;
* founders;
* students;
* freelancers;
* small teams;
* on-chain communities.

Namun MVP hanya fokus pada **dua participant dengan dua reciprocal promises**.

---

# 6. Goals

## 6.1 Primary Goal

Membuat satu flow Web3 yang jelas dan benar-benar bekerja end-to-end:

```text id="f4x3k0"
Create
→ Accept
→ Lock
→ Prove
→ Review
→ Settle
→ Withdraw
```

## 6.2 Hackathon Goal

Project harus memungkinkan judge:

1. membuka live website;
2. connect wallet;
3. membuat VOW;
4. wallet kedua menerima VOW;
5. collateral benar-benar terkunci;
6. proof dapat dikirim;
7. proof dapat diverifikasi;
8. smart contract menentukan settlement;
9. hasil dapat ditarik kembali dari contract.

---

# 7. Non-Goals

VOW v1 tidak mencoba menyelesaikan:

* objective real-world truth verification;
* decentralized court;
* complex dispute resolution;
* multi-party collaboration;
* reputation marketplace;
* tokenomics;
* DAO governance;
* employment contracts;
* legal contract enforcement.

VOW juga tidak mengklaim dirinya sebagai legal agreement.

---

# 8. Target Users

## Primary Persona

Dua orang yang sedang berkolaborasi dan memiliki dependency satu sama lain.

Contoh utama:

### Developer Pair

Athar:

> Ship frontend before Friday.

Ali:

> Deploy smart contract before Friday.

Masing-masing deposit 10 BOT.

---

## Secondary Personas

### Founder + Designer

Founder:

> Finalize landing copy.

Designer:

> Deliver final mockup.

### Student Team

Student A:

> Complete presentation.

Student B:

> Complete report.

### Creator Collaboration

Creator A:

> Publish video.

Creator B:

> Publish article.

MVP tidak perlu membuat UX berbeda per persona.

---

# 9. Jobs To Be Done

## JTBD-1

When I depend on another person to complete something,
I want both of us to commit collateral,
so neither side can casually break their promise without consequence.

## JTBD-2

When we make an agreement,
I want the rules and deadlines fixed beforehand,
so neither party can change them later.

## JTBD-3

When both sides complete their work,
I want the contract to return our collateral automatically according to the rules.

## JTBD-4

When one side fails,
I want the agreed collateral consequences to be deterministic and transparent.

---

# 10. Core Product Principles

## 10.1 Mutual Commitment

Both participants have a promise.

Not:

```text id="ueimry"
payer → worker
```

But:

```text id="zc17zb"
participant A ↔ participant B
```

---

## 10.2 Equal Skin in the Game

Both participants deposit the same collateral value.

For MVP:

```text id="es8jid"
stake A == stake B
```

Unequal collateral is out of scope.

---

## 10.3 Rules Before Risk

Before partner accepts, both sides can see:

* promises;
* collateral;
* deadlines;
* arbiter;
* settlement rules.

Once accepted:

> rules cannot be changed.

---

## 10.4 No Permanent Fund Lock

Every lifecycle branch must eventually be finalizable.

The product must never intentionally leave funds stuck forever.

---

## 10.5 Blockchain Is Source of Truth

Authoritative state lives on-chain.

Frontend is an interface, not the source of truth.

---

# 11. Why Blockchain?

Blockchain is required because VOW involves:

* two independent parties;
* locked collateral;
* predefined settlement rules;
* no trusted custodian;
* immutable agreement parameters;
* verifiable transaction history.

Without blockchain:

One party or centralized platform must control the money and database.

With VOW:

```text id="aqf865"
Participant A ── collateral ──┐
                              │
                         SMART CONTRACT
                              │
Participant B ── collateral ──┘
```

Neither participant holds the other's collateral.

The smart contract controls settlement according to predefined rules.

---

# 12. Trust Model

VOW is NOT fully trustless regarding real-world proof.

The blockchain cannot independently know whether:

> “frontend benar-benar selesai.”

Real-world proof is verified by:

1. the counterparty;
2. optional pre-selected arbiter if disputed.

Therefore VOW should be described as:

> **trust-minimized commitment settlement**

rather than:

> trustless real-world verification.

The blockchain guarantees:

* custody;
* authorization;
* timestamps;
* deadlines;
* immutable rules;
* deterministic fund settlement.

---

# 13. Main User Flow

## Step 1 — Creator Connects Wallet

User connects wallet on BOT Chain.

Primary action:

```text id="6v4ru1"
Create a Vow
```

---

## Step 2 — Creator Creates VOW

Creator enters:

* partner wallet address;
* own promise;
* partner promise;
* BOT collateral;
* accept deadline;
* delivery deadline;
* review deadline;
* dispute deadline;
* optional arbiter.

Creator clicks:

```text id="hs8zj3"
CREATE VOW & LOCK 10 BOT
```

Wallet confirms transaction.

State:

```text id="1t2i9f"
PROPOSED
```

Creator's collateral is locked.

---

## Step 3 — Partner Accepts

Partner opens the VOW.

Partner sees:

```text id="b4ed36"
Your Promise

Creator Promise

Stake
10 BOT

All deadlines

Arbiter
```

Partner clicks:

```text id="9nu3zk"
ACCEPT & LOCK 10 BOT
```

After confirmation:

```text id="cey8hj"
ACTIVE
```

Total collateral:

```text id="b1o88s"
20 BOT LOCKED
```

---

# 14. Proof Submission

Before delivery deadline, each participant can submit proof.

Example:

```text id="5dmtd4"
https://github.com/.../commit/abc
```

Supported proof v1:

* website URL;
* GitHub commit;
* public file URL;
* transaction explorer URL;
* public video;
* similar public evidence.

VOW does not host the file.

The contract stores:

```text id="r7wh32"
proof URI
proof hash
```

Participant can submit proof once.

---

# 15. Proof Review

Counterparty reviews submitted proof.

Available actions:

```text id="eqg3q3"
APPROVE
DISPUTE
```

Do not label the negative action as:

```text id="tj6ohe"
FAIL
```

because disputing proof does not immediately make the participant fail.

---

## Approve

If approved:

```text id="97fjyc"
participant → SUCCESS
```

---

## Dispute

If counterparty disputes:

```text id="9a2hsw"
participant → DISPUTED
```

Collateral does not move yet.

Counterparty must provide a short dispute reason.

---

# 16. Arbiter

An optional arbiter may be selected before VOW activation.

The arbiter only participates if proof is disputed.

Arbiter sees:

```text id="cvt4et"
Promise

Proof

Dispute reason

[ VALID PROOF ]

[ INVALID PROOF ]
```

If valid:

```text id="rmnv4r"
SUCCESS
```

If invalid:

```text id="5rw667"
FAILED
```

The arbiter:

* cannot change rules;
* cannot withdraw participant funds;
* cannot directly select payment amount;
* cannot resolve non-disputed proof.

---

# 17. Deadline Model

Each VOW contains:

```text id="jipldg"
Accept Deadline
Delivery Deadline
Review Deadline
Dispute Deadline
```

Required order:

```text id="32qwpy"
Accept
<
Delivery
<
Review
<
Dispute
```

---

# 18. Timeout Rules

## No Acceptance

If partner does not accept before accept deadline:

```text id="au7ejw"
VOW expires
creator collateral refundable
```

---

## No Proof

If participant does not submit proof before delivery deadline:

```text id="b77fh8"
FAILED
```

---

## Proof Submitted But No Review

If proof was submitted but counterparty does not review before review deadline:

```text id="jf473w"
SUCCESS
```

Rule:

> silence after proof submission means acceptance.

Reason:

Otherwise counterparty could grief a valid participant simply by disappearing.

---

## Dispute Not Resolved

If a disputed proof remains unresolved after dispute deadline:

```text id="u5eakt"
UNRESOLVED
```

This allows eventual settlement and avoids permanent fund lock.

---

# 19. Participant Outcomes

Terminal participant outcomes:

```text id="fzuhnl"
SUCCESS
FAILED
UNRESOLVED
```

Non-terminal states:

```text id="fsmrps"
PENDING
PROOF_SUBMITTED
DISPUTED
```

---

# 20. Settlement Rules

Let each participant deposit:

```text id="olvt3v"
S BOT
```

Total:

```text id="hbvua0"
2S BOT
```

---

## Case 1

```text id="7kmbn5"
SUCCESS
SUCCESS
```

Result:

```text id="nd0vah"
A → S
B → S
```

Both receive their own collateral.

---

## Case 2

```text id="osfnqy"
SUCCESS
FAILED
```

Result:

```text id="bq2krn"
SUCCESS participant → 2S
```

Successful participant receives both stakes.

---

## Case 3

```text id="ipwu3l"
FAILED
SUCCESS
```

Symmetric.

---

## Case 4

```text id="8a8peh"
FAILED
FAILED
```

Result:

```text id="cdvu75"
2S → Failure Sink
```

---

## Case 5

```text id="6kg8n5"
SUCCESS
UNRESOLVED
```

Result:

```text id="j1lsox"
A → own stake
B → own stake
```

No party receives someone else's collateral because one outcome remains uncertain.

---

## Case 6

```text id="48cv7k"
FAILED
UNRESOLVED
```

Result:

```text id="621fz3"
failed stake → Failure Sink
unresolved stake → original owner
```

---

## Case 7

```text id="ge2z9z"
UNRESOLVED
FAILED
```

Symmetric.

---

## Case 8

```text id="6xkpvh"
UNRESOLVED
UNRESOLVED
```

Result:

```text id="7gic55"
both receive own collateral
```

---

# 21. Failure Sink

Failure Sink adalah address transparan yang ditentukan saat deployment.

Digunakan ketika collateral harus menerima penalty tetapi tidak ada eligible successful counterparty.

Example:

```text id="579n5t"
FAILED / FAILED
```

or:

```text id="woork2"
FAILED / UNRESOLVED
```

MVP tidak membutuhkan treasury dashboard.

Failure sink address harus tercantum jelas di README.

---

# 22. Withdrawal Model

Settlement tidak langsung mengirim native BOT.

Instead:

```text id="k3nqr3"
settlement
↓
claimable balance
↓
participant clicks CLAIM
↓
withdraw
```

UI example:

```text id="bqu0x7"
VOW SETTLED

Claimable:
20 BOT

[ CLAIM 20 BOT ]
```

---

# 23. MVP Screens

Only four primary pages.

---

## 23.1 Landing

Goal:

Visitor memahami produk dalam <10 detik.

Hero:

```text id="rywoag"
VOW

Trust is good.
Collateral is better.

Put BOT behind promises
you make to each other.

[ CREATE A VOW ]
```

Simple explanation:

```text id="zgbrpk"
PROMISE
↓
LOCK
↓
PROVE
↓
SETTLE
```

---

# 24. Create Vow Page

Inputs:

```text id="hbmw5n"
Partner Wallet

Your Promise

Partner's Promise

Stake Amount

Accept Deadline

Delivery Deadline

Review Deadline

Dispute Deadline

Optional Arbiter
```

Primary CTA:

```text id="65s04x"
CREATE VOW & LOCK X BOT
```

---

# 25. Vow Detail Page

Display:

```text id="5ftc6r"
VOW #ID

Creator
Partner
Arbiter

Your Promise
Partner Promise

Collateral
Total Locked

Deadlines

Creator Status
Partner Status
```

Actions depend on wallet and state.

Potential actions:

```text id="8b27gg"
Accept

Submit Proof

Approve Proof

Dispute Proof

Resolve Dispute

Finalize

Claim
```

Only valid action should appear.

---

# 26. My Vows

Display VOWs where connected wallet is:

* creator;
* partner.

Sections:

```text id="kzb8o4"
Pending
Active
Completed
```

Card example:

```text id="37fin6"
VOW #42

You:
Ship frontend

Partner:
Deploy contract

10 BOT each

ACTIVE

Delivery:
Sep 21

[ VIEW ]
```

---

# 27. Functional Requirements

## FR-1 Wallet Connection

User can connect supported wallet to BOT Chain.

## FR-2 Create VOW

Creator can create a valid VOW and lock native BOT collateral.

## FR-3 Accept VOW

Only designated partner can accept and must lock identical collateral.

## FR-4 Proof Submission

Each participant can submit one proof before delivery deadline.

## FR-5 Proof Approval

Counterparty can approve proof.

## FR-6 Proof Dispute

Counterparty can dispute proof and provide reason.

## FR-7 Arbitration

Pre-selected arbiter can resolve disputed proof before dispute deadline.

## FR-8 Timeout Handling

Protocol can convert expired non-terminal states into terminal outcomes.

## FR-9 Settlement

Contract can deterministically allocate all collateral.

## FR-10 Claim

Eligible addresses can withdraw claimable BOT.

## FR-11 VOW Retrieval

Connected wallet can find its VOWs.

## FR-12 Explorer Visibility

Write transactions should provide explorer access where practical.

---

# 28. Non-Functional Requirements

## Reliability

Core happy path must work consistently.

## Security

No double settlement.

No double withdrawal.

No unauthorized proof submission.

No self-review.

No arbitrary fund movement.

## Performance

Frontend interactions should not introduce unnecessary backend latency.

## Responsive UX

Application should remain usable on:

* desktop;
* mobile browser.

## Transparency

The UI should clearly show:

* collateral;
* deadlines;
* current outcome/status;
* transaction state.

---

# 29. Empty and Error States

UI must gracefully handle:

```text id="7fhbu8"
wallet not connected

wrong network

invalid VOW ID

expired proposal

no proof yet

no VOWs

transaction rejected

transaction reverted

RPC failure
```

Do not present generic blank pages.

---

# 30. Transaction States

Each write transaction should show:

```text id="l5zyyv"
Waiting for wallet

Transaction submitted

Confirming

Confirmed
```

or:

```text id="hop97f"
Transaction failed
```

After successful confirmation:

> refetch blockchain state.

---

# 31. Demo Scenario

Main judging demo:

### Wallet A

Creates:

```text id="hmxsm5"
Promise:
Ship frontend

Partner promise:
Deploy contract

Stake:
1 BOT
```

### Wallet B

Accepts with:

```text id="whz9b6"
1 BOT
```

Contract now contains:

```text id="mgm6vx"
2 BOT
```

A submits proof.

B submits proof.

A approves B.

B approves A.

Finalize.

Result:

```text id="npgen7"
SUCCESS / SUCCESS
```

Both claim 1 BOT.

---

# 32. Failure Demo

Prepare a separate existing VOW.

Example:

```text id="i6doan"
A = SUCCESS

B = no proof
```

After deadline:

```text id="3256f3"
B → FAILED
```

Settlement:

```text id="3jfpsm"
A → 2 BOT
```

This demonstrates that collateral has actual consequence.

---

# 33. Success Metrics

Hackathon MVP success is NOT measured through user growth.

Primary success criteria:

```text id="zv9yft"
deployed smart contract works

two independent wallets work

collateral actually moves

happy path works end-to-end

failure path works

judge understands concept quickly

live website works

main transaction flow is reliable
```

---

# 34. Hackathon Presentation Message

Primary one-liner:

> **VOW lets two people put collateral behind promises they make to each other.**

Secondary:

> Both sides lock BOT, prove delivery, verify their counterparty, and let the smart contract settle the outcome.

---

# 35. Why This Is Different From Escrow

Traditional escrow:

```text id="gbyhf1"
Buyer
↓
money
↓
Seller performs work
```

VOW:

```text id="0ynb0q"
Party A promises X
↕
Party B promises Y

Both provide collateral.
```

There is no payer-worker relationship required.

Both parties are simultaneously:

> promisor + counterparty.

The collateral secures reciprocal commitments rather than payment for services.

---

# 36. Known Limitations

VOW v1 deliberately accepts the following limitations.

### Real-World Verification

Smart contract cannot determine real-world truth by itself.

### Subjective Disputes

Counterparty or arbiter interpretation may still be subjective.

### Single Arbiter

MVP supports one optional arbiter only.

### Native BOT

Only native BOT collateral is supported.

### Two Participants

Only bilateral agreements are supported.

### No Proof Hosting

VOW stores proof references/hashes, not files.

These limitations are accepted because the hackathon priority is:

> one complete reliable interaction rather than broad feature coverage.

---

# 37. Out-of-Scope Future Ideas

Only consider after hackathon:

```text id="wravgv"
portable reliability profile

multiple participants

multiple arbiters

decentralized arbitration

ERC-20 collateral

milestones

recurring VOWs

templates

social invitations

notifications

proof integrations

public VOW discovery
```

None belong in v1.

---

# 38. MVP Definition of Done

VOW v1 is complete only when:

> Two independent wallets can create and accept a reciprocal commitment, lock equal BOT collateral, submit proof independently, review counterparty proof, deterministically settle the VOW according to predefined rules, and withdraw resulting funds without administrator intervention.

If any part of this sentence is false:

> MVP is not complete.

---

# 39. Product Priority Rule

When choosing between:

```text id="cg4h0g"
more features
```

and:

```text id="lt4hge"
more reliable main flow
```

always choose:

> **more reliable main flow.**
