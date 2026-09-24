# VOW — Girl Meets Tech Vol. 2 Submission Audit

Deadline: **25 September 2026, 23:59 GMT+7**. Audited: 20 September 2026, 15:34 GMT+7.
**Time left: 5 days 8 hours.**

Every claim below was checked against live chain state, live explorer APIs, and the
actual remote git refs — not against the project's own documentation.

---

## Verdict

**Not submittable today.** Two of the seven required items are missing entirely, one is
broken by a repo setting, and one requirement is now mathematically impossible to satisfy
in full.

| # | Requirement | Status |
| --- | --- | --- |
| 1 | Contract address on BOT Chain | **MISSING** — not deployed to mainnet |
| 2 | Live website on a real domain | **MISSING** — no public URL exists |
| 3 | GitHub repo with `.sol` + README | **BROKEN** — default branch is empty |
| 4 | X post tagging @BOTChain_ai | **MISSING** — no X account exists |
| 5 | 5 posts in the 30 days before submission | **IMPOSSIBLE** — window already closed |
| 6 | Mainnet launch announcement | **MISSING** — depends on #1 and #2 |
| 7 | BOT Chain branding on-site | Code ready — needs a live site |

---

## Two claims in the project status that are false

### "Smart Contract: Terverifikasi di Bohr Chain (Chain ID 968)"

The contract is **not source-verified** on the Bohr explorer. Three independent checks:

1. `GET scan.bohr.life/api/v2/smart-contracts/0x9539…530b` returns only
   `creation_bytecode`, `deployed_bytecode`, `proxy_type`, `implementations`. The
   verification fields — `is_verified`, `source_code`, `verified_at`, `abi`, `name`,
   `compiler_version` — are **absent from the response entirely**. A genuinely verified
   contract (compared against `0xD35764FdC941abEBa8376a5c796554751C00a1bf`) returns all
   of them.
2. The address does **not** appear in the explorer's verified-contract list
   (`/api/v2/smart-contracts?filter=verified`, first 50 entries checked).
3. The Etherscan-compatible endpoint returns an address stub with no source field.

`forge verify-contract` was never run against Bohr, or it failed. This is fixable in
minutes, but it must not be claimed in the submission until it is actually true.

### "Video peluncuran: Sudah dibuat menggunakan Hyperframes"

True — the video exists (`brag-output/`, 1920x1080, 30 fps, 20.2 s, 4.57 MB). But
requirement #4 asks for an **X post** showing the project, not just a video file. The
video has no corresponding X account or post. The artifact is done; the requirement is not.

---

## Blocker 1 — The GitHub repo judges will open is empty

`github.com/AtharFazli/VOW` is **public** (`private: false`). Its default branch is `main`.

The complete file list of `origin/main`:

```
.gitignore
LICENSE
```

No `VOW.sol`. No `README.md`. No frontend. The repo's own description promises a
commitment protocol; the default branch shows an empty repository.

Requirement #3 is explicit: the repo "must contain your .sol contract file and a
README.md written in plain English." A judge clicking the repo link sees neither and
marks the item missing.

**The real work is safe** — it lives on `testnet-mainnet` (pushed, `c23a4c2`) and the tag
`v1.0.0-hackathon-final` (pushed, `a7f744e` → `c23a4c2`). The problem is purely that
`main` was never fast-forwarded to it. Local `main` is also 1 commit ahead of
`origin/main` and unpushed.

Fix: point `main` at the submission commit and push. Nothing else changes.

### README has no "Deployment" section

Requirement #3 asks for a `Deployment` section naming both the testnet and mainnet
contract addresses. The README's `## Network and deployment` section currently lists
Bohr testnet only, has no mainnet address, and ends with the line:

> No public frontend URL is documented here.

That line is accurate, and it is also a direct admission that requirement #2 is unmet.

---

## Blocker 2 — Mainnet deployment has not happened

Live checks against `https://rpc.botchain.ai`:

| Check | Result |
| --- | --- |
| Deployer `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` balance | `0.01474882 BOT` |
| Deployer mainnet nonce | `3` |
| `nextVowId()` at nonce-0 address `0x2983b7A9…87F3` | reverts (`0x`) |
| `failureSink()` at same address | reverts (`0x`) |

A contract exists at the nonce-0 address, but it is not VOW — both VOW selectors revert.
No VOW deployment exists at any address this deployer has produced on mainnet
(nonces 0–3 → `0x2983…87F3`, `0xd11D…3146`, `0xDd24…3c81`, `0x04e6…7cb4`; the first three
were checked for code).

**Cost:** a broadcast dry-run reported gas `2,295,943` at 20 gwei = **0.0459 BOT**.
Current balance covers roughly a third of that. **Shortfall: ~0.031 BOT.**

The `mainnet-deployment` branch (`6ca0829`) holds the chain-677 deploy refactor with a
dynamic `FAILURE_SINK`, but it is **not pushed** (1 commit ahead of
`origin/testnet-mainnet`) and it has uncommitted working-tree changes.

### The FAILURE_SINK trap — read this before deploying

`.env` currently sets:

```
FAILURE_SINK=0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B
```

Confirmed live: this is the **Bohr testnet** sink. `failureSink()` on the testnet contract
returns exactly this address.

It is a constructor argument and immutable. Deploying to mainnet with this value means
every failed-collateral payout on BOT Chain mainnet routes to a testnet address —
permanently, with no correction path. Set a mainnet sink and read it back before
broadcasting.

---

## Blocker 3 — No live website

`github.com/AtharFazli/VOW` has `homepage: None`. No deployment URL appears anywhere in
README, DEMO.md, or the submission checklist. The only URLs in the project are GitHub and
explorer links.

Requirement #2 needs a live domain (the $1–$1.50 first-year tier is explicitly accepted
and reimbursed). Requirement #7 (BOT Chain branding on-site) and requirement #6 (launch
announcement on "your own site") both depend on this existing.

The frontend is deployable as-is — it is a static-friendly Next.js app with no server-only
features. It builds clean. It just has nowhere to live.

---

## Requirement 5 is out of reach — decide consciously

Requirement #5: "at least 5 valid posts in the 30 days before you submit."

The 30-day window opened on **26 August 2026**. Today is **20 September 2026**. No X
account for this project exists in the repo, the docs, the video assets, or the
composition metadata — so the count is currently zero, and the window cannot be reopened.

Five posts today is the maximum reachable, and it will not satisfy a strict reading of a
30-day window. What can still be done:

- Create the account now and post the maximum possible volume before the 25th.
- Spread posts across distinct days rather than dumping five in one hour — a reviewer
  checking post dates will read consecutive days very differently from a single burst.
- Disclose nothing; just do the work and let the dates speak.

This is the one item where the honest answer is "partially, at best." Worth an email to
the organisers asking whether a new account with a strong pre-deadline posting cadence is
acceptable, rather than assuming either way.

---

## What is genuinely finished and defensible

These hold up and should be submitted as-is:

- **Contract.** `src/Vow.sol`, 118 Forge tests across 9 files, `forge fmt` and
  `forge build` clean.
- **On-chain evidence.** VOW #1 completed the full happy path on Bohr testnet — 9
  transaction hashes in the README, all verifiable. Contract balance returns to 0,
  double-withdraw correctly reverts with `NothingToWithdraw()`.
- **Frontend.** 112 tests passing across 7 files, ESLint clean, production build succeeds.
- **Launch video.** Real, finished, 20.2 s.
- **Frozen release.** Tag `v1.0.0-hackathon-final` is pushed to the remote.

---

## One real bug fixed during this audit

`ConnectWallet.tsx` imported `bohrTestnet` from `@/lib/chain` and hardcoded it in the
wrong-network guard:

```ts
const wrongChain = isConnected && chain?.id !== bohrTestnet.id
```

With the frontend pointed at BOT Chain mainnet, every connected wallet would have been
judged to be on the wrong chain, and the "Switch network" button would have pushed users
back to testnet. Requirements #2 and #7 both require judges to connect a wallet and
interact — this would have broken that on first click.

The same hardcoded assumption appeared in 6 more places (user-facing strings in
`my-vows/page.tsx`, `ContractStatus.tsx`, `CreateVowForm.tsx`, `VowDetail.tsx`,
`useVowWrite.ts`). All now derive from `VOW_CHAIN`, so one env var switches the whole app
between testnet and mainnet. Re-verified: 112 tests pass across 7 files, ESLint clean, build succeeds.

---

## Minimum path to a valid submission

Ordered by what unblocks the most.

1. **Fix the repo default branch.** Point `main` at `c23a4c2` and push. ~2 minutes.
   Without this, requirement #3 fails and the judge sees an empty repo.
2. **Add the README `Deployment` section** with both addresses. Do the testnet half now;
   fill the mainnet half after step 4.
3. **Buy and deploy the domain.** Requirement #2, and the prerequisite for #6 and #7.
4. **Top up the deployer by ≥0.05 BOT, set a mainnet `FAILURE_SINK`, deploy, read it back,
   verify the source.** Requirement #1, and the prerequisite for #6.
5. **Create the X account and post.** Requirement #4, plus the best available recovery
   for #5.
6. **Publish the launch announcement** on the new site. Requirement #6.

Items 1, 2, and 4 are each under an hour of real work. The scarce resource is the
remaining 5 days, not the effort.

---

## Risk summary

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `main` stays empty | Requirement #3 auto-fails | Step 1, ~2 min |
| Mainnet not deployed by the 25th | Requirement #1 fails; #6 impossible | Step 4, needs ≥0.05 BOT |
| Deploy uses the testnet FAILURE_SINK | Mainnet collateral permanently misrouted | Set and read back the sink before broadcasting |
| No domain | Requirements #2, #6, #7 all fail | Step 3, ~$1.50 |
| X account created late | Requirement #5 scored as unmet | Post across separate days; email the organisers |
| "Verified on Bohr" claimed in the form | Misrepresentation to judges | Verify first, or state testnet-only plainly |
