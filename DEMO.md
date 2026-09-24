# VOW Demo Runbook

## A. Demo objective

VOW lets two people make reciprocal commitments, lock equal collateral, submit proof, review each other's proof, and settle deterministically on-chain.

Humans evaluate real-world proof. The smart contract handles collateral custody, authorization, deadlines, lifecycle state transitions, and settlement. VOW does not claim blockchain independently verifies real-world truth.

Target duration: 3–5 minutes.

## B. Pre-demo checklist

- Frontend is running locally from `frontend/`.
- Wallet is connected to Bohr Testnet.
- Chain ID: `968`
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- Contract: `0x9539263f4861812B08C37Bb3cB6603c771d6530b`
- VOW #1 is accessible at `/vow/1`.
- README.md and this document are available for archived evidence.
- Explorer can open transaction and contract links.

Primary archived demo does not require funded wallets. Connect a wallet on Bohr Testnet when showing wallet-specific My Vows or claimable state; direct VOW #1 reads and archived evidence do not require a funded wallet. No new transaction is required.

The live frontend is at [https://vowprotocol.web.id](https://vowprotocol.web.id). To run it yourself instead, use the local URL printed by Next.js.

Start locally only when needed:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Next.js. Do not invent or require a public frontend URL.

## C. Recommended primary demo: read-only frontend + archived Gate T evidence

Do not make fresh blockchain transactions the default judging path.

1. Open the landing page at `/`.
2. Say: “VOW puts equal collateral behind promises two people make to each other.”
3. Show the lifecycle:

   ```text
   Create → Accept → Prove → Review → Settle → Withdraw
   ```

4. Open `/my-vows` if wallet-connected VOW discovery is useful; otherwise open `/vow/1` directly.
5. Show VOW #1 and identify creator and partner roles.
6. Point out final participant outcomes: `SUCCESS / SUCCESS`.
7. Point out global status: `SETTLED`.
8. Explain that creator and partner each locked `0.01 BOT`; total collateral was `0.02 BOT`.
9. Show the archived Gate T transaction table in this document or README.md.
10. Explain the two proof submissions and two counterparty reviews.
11. Show the creator and partner withdrawal transactions.
12. Point out final claimable balances of `0` for both participants.
13. Point out final contract balance of `0 BOT`.

Use archived transaction links as proof of execution. Fresh transaction execution is optional, not required.

## D. Gate T transaction evidence

All nine Gate T transaction receipts were verified successful on Bohr Testnet. Explorer links use the verified base `https://scan.bohr.life`.

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

## E. Presenter script

“What is VOW? VOW is a two-person reciprocal commitment protocol. Both people put equal native BOT collateral behind promises they make to each other.

Why equal collateral? Equal collateral gives both sides skin in the game. VOW is reciprocal, not a buyer-paying-a-seller escrow flow.

Why blockchain? Two independent wallets need shared custody, fixed rules, and a transaction history neither participant can rewrite. The contract holds collateral and applies settlement rules without either participant controlling the other's funds.

Who decides whether proof is valid? People do. The counterparty reviews the proof, and the pre-agreed arbiter can handle a dispute when configured. The chain stores proof references and enforces the agreed process; it does not determine real-world truth.

What happens after both succeed? Both participant states become SUCCESS. Finalization credits each participant with their own `0.01 BOT` stake, then each participant withdraws through the pull-payment flow.

How do funds leave the contract? Settlement credits `claimable` balances. `withdraw()` sets the caller's claimable balance to zero before sending native BOT. A second withdrawal reverts with `NothingToWithdraw()`.

What did Gate T prove? VOW #1 completed CREATE, ACCEPT, both proof submissions, both reviews, FINALIZE, and both withdrawals on Bohr Testnet. The nine linked receipts are the archived evidence. Final claimable balances and contract balance are zero.”

## F. Judge questions and answers

### Why not use a normal agreement?

A normal agreement can describe promises, but it does not by itself provide shared collateral custody, fixed on-chain settlement rules, or publicly verifiable transaction history. VOW adds those mechanisms without making the agreement a legal contract.

### Why blockchain?

The two participants use independent wallets. A smart contract can hold both stakes, enforce authorization and deadlines, and apply the same settlement rules to either party without a central custodian.

### Is proof automatically verified?

No. Humans evaluate real-world proof. The contract verifies process conditions such as participant authorization, proof hash consistency, deadlines, review state, and settlement rules. It cannot independently verify whether a real-world promise was fulfilled.

### Can one party steal the other's collateral?

No arbitrary withdrawal exists. Funds become claimable only through the contract's authorized lifecycle and deterministic settlement rules. In the verified SUCCESS / SUCCESS path, each participant receives their own stake.

### What prevents double withdrawal?

`withdraw()` zeroes the caller's claimable balance before transfer. A second attempt finds zero claimable balance and reverts with `NothingToWithdraw()`.

### What happens in disputes?

Dispute and arbiter-resolution logic exists in the Solidity contract and is Solidity-tested, and the submitted frontend exposes it: a participant can Dispute Proof (a reason is required by the contract), and a configured arbiter can Resolve Dispute with an Uphold or Reject choice per disputed participant. A configured arbiter can resolve a disputed proof before the dispute deadline. Otherwise, an unresolved dispute becomes `UNRESOLVED` after the deadline and follows the documented settlement rules.

### Is this running on mainnet?

No. The deployment documented here is Bohr Testnet, chain ID `968`, at contract `0x9539263f4861812B08C37Bb3cB6603c771d6530b`.

### Has the full flow actually been tested?

The happy path was tested end-to-end on deployed VOW #1 with two participant wallets. Gate T recorded nine successful transactions: create, accept, two proofs, two reviews, finalize, and two withdrawals. The dispute path is exposed in the frontend and covered by the frontend unit tests and the Solidity suite; Gate T did not exercise it on-chain.

## G. Demo failure fallback

Do not create new transactions to recover a presentation problem. Use archived Gate T evidence and README.md.

### RPC unavailable

- Stop live reads and writes.
- Present the landing page if already loaded.
- Use the archived VOW #1 result and transaction links from this document or README.md.
- Retry explorer/RPC later; do not redeploy or create a new VOW.

### Explorer slow or unavailable

- Continue with the exact archived hashes and local evidence package.
- State that explorer access is temporarily unavailable.
- Do not replace links or invent receipt results.

### Wallet on wrong network

- Switch wallet to Bohr Testnet, chain ID `968`.
- Confirm RPC `https://rpc.bohr.life` and explorer `https://scan.bohr.life`.
- No transaction is needed for the archived demo.

### Wallet connection fails

- Present the landing page and explain the protocol from this runbook.
- Use archived VOW #1 evidence instead of attempting a fresh flow.
- Do not ask for private keys or seed phrases.

### Frontend state does not refresh

- Wait briefly, reload the page, or reconnect the wallet on Bohr Testnet.
- Open `/vow/1` directly.
- If state remains unavailable, use the archived evidence and final verified result below.

### Local frontend fails immediately

- Stop troubleshooting during presentation.
- Use README.md and DEMO.md as the judge entry point.
- Present the verified explorer links and archived Gate T outcome.
- Do not modify code, install unverified dependencies, or create fresh transactions during the demo.

No screenshots are assumed or included in this package.

## H. Optional live transaction path

Fresh execution is optional and not recommended as the default judging demo.

If a live run is deliberately chosen, it requires:

- two funded wallets;
- BOT for collateral and gas;
- wallet switching between creator and partner;
- Bohr Testnet selected in both wallets;
- confirmation of each transaction;
- available RPC and explorer;
- valid deadline ordering and enough time for the flow;
- reliable frontend state refresh.

Live sequence:

```text
Creator: create VOW and lock stake
Partner: accept VOW and lock matching stake
Creator: submit proof
Partner: submit proof
Creator: review partner proof
Partner: review creator proof
Anyone: finalize VOW
Creator: withdraw
Partner: withdraw
```

Risks include confirmation latency, wallet/network mistakes, insufficient BOT, RPC failure, deadline expiry, and stale frontend reads. Use the archived Gate T package instead when any risk appears.

## I. Final verified result

VOW #1 on Bohr Testnet:

- Final status: `SETTLED`
- Creator outcome: `SUCCESS`
- Partner outcome: `SUCCESS`
- Creator collateral: `0.01 BOT`
- Partner collateral: `0.01 BOT`
- Total collateral: `0.02 BOT`
- Creator withdrawal: `0.01 BOT`
- Partner withdrawal: `0.01 BOT`
- Creator claimable: `0`
- Partner claimable: `0`
- Contract balance: `0 BOT`
- Double withdrawal: reverted with `NothingToWithdraw()`

Contract: `0x9539263f4861812B08C37Bb3cB6603c771d6530b`

Network: Bohr Testnet, chain ID `968`

## Scope note

The submitted frontend demonstrates the verified happy path. Dispute and arbiter-resolution logic exists in the Solidity contract and is Solidity-tested, and both are exposed in the submitted frontend: Dispute Proof for participants, Resolve Dispute (Uphold or Reject) for the configured arbiter, rendered in `ActionPanel.tsx`.
