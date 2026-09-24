# VOW — Girl Meets Tech Vol. 2 Submission Audit

Deadline: **25 September 2026, 23:59 GMT+7**. Audited: 20 September 2026, 15:34 GMT+7.
**Time left: 5 days 8 hours.**

Every claim below was checked against live chain state, live explorer APIs, and the
actual remote git refs — not against the project's own documentation.

---

## Re-verification — 24 September 2026

Same method as above. The two blockers named in this audit are resolved; one
requirement is still open. Live evidence:

| # | Requirement | Audited 20 Sep | Now | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Contract address on BOT Chain | MISSING | **MET** | `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4` — deploy tx `0x694234a9…320a7` status `0x1`, block `0x16fa844`, source verified on `scan.botchain.ai` (`file_path` `src/Vow.sol`) |
| 2 | Live website on a real domain | MISSING | **MET** | `vowprotocol.web.id` resolves (A `216.198.79.1`) and serves the mainnet build: `GET /` → 200, `<title>VOW: Collateralized Promises</title>`, HTML carries `BOT Chain Mainnet`, `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`, and 0 occurrences of the Bohr explorer. `Vercel` commit status on `fa18f51` = `success`; was `failure` (Vercel Root Directory was unset). Apex and `http://` both 301 to `https://www.vowprotocol.web.id`. |
| 3 | GitHub repo with `.sol` + README | BROKEN (main empty) | **MET** | `origin/main` = `be79075`, 20 commits; `.sol` and `README.md` present on the default branch |
| 4 | X post tagging @BOTChain_ai | MISSING | not re-checked | outside repository scope |
| 5 | 5 posts in the 30 days before submission | IMPOSSIBLE | unchanged | window closed |
| 6 | Mainnet launch announcement | MISSING | **unblocked, not done** | The dependency is gone: mainnet is live and the site is public, so an announcement can now be published. No announcement content exists on the site yet (checked — no `announce`/`launch`/`blog`/`news` section in the live HTML). |
| 7 | BOT Chain branding on-site | code ready | **MET** | `SiteFooter.tsx` links the mainnet contract on `scan.botchain.ai`; confirmed in the live HTML (`Powered by BOT Chain` ×2, `bot-chain-logo` ×4, `scan.botchain.ai` ×6, `scan.bohr.life` ×0) |

- **Blocker 1 resolved.** `main` carries the full project; the default branch a judge
  lands on is no longer empty.
- **Blocker 2 resolved.** Mainnet deployment exists, is source-verified, and reads back
  correct: `failureSink()` → `0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7` (matches the
  constructor argument), `nextVowId()` → `0`. Deployer balance is now `0.03942662 BOT`
  (was `0.01474882`), so the funding shortfall recorded below is closed.
- **Requirement 2 is now met.** The production build targets mainnet by default
  (committed `frontend/.env.production`) and is live at `https://vowprotocol.web.id`.
  Vercel's status on `fa18f51` is `success`; the earlier failures were caused by the
  Vercel project having no Root Directory set, so it tried to install and build at the
  repo root, where there is no `package.json`. Reproduced and confirmed.
- **Requirement 6 is unblocked.** It was blocked on #2; that dependency is gone. The
  announcement itself has not been published yet, so the item is still open — but nothing
  in the repo blocks it now.
- **Requirements 4 and 5 remain outside repository scope and unresolved.** #5's window has
  closed; #4 needs an X account that does not exist.

---

## Verdict

**Submittable on every item the repository controls.** All five repo-controlled
requirements are met. Two social requirements are not, and no code change fixes them.

| # | Requirement | Status |
| --- | --- | --- |
| 1 | Contract address on BOT Chain | **MET** — `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`, source verified on `scan.botchain.ai` |
| 2 | Live website on a real domain | **MET** — `https://vowprotocol.web.id` (canonical `www`), 200, mainnet build |
| 3 | GitHub repo with `.sol` + README | **MET** — `origin/main` carries `.sol`, `README.md`, and the frontend |
| 4 | X post tagging @BOTChain_ai | **MISSING** — no X account exists |
| 5 | 5 posts in the 30 days before submission | **IMPOSSIBLE** — window already closed |
| 6 | Mainnet launch announcement | **OPEN** — unblocked now that #2 is met; nothing published yet |
| 7 | BOT Chain branding on-site | **MET** — footer badge and `scan.botchain.ai` contract link confirmed live |

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

### README has no "Deployment" section (resolved)

Requirement #3 asks for a `Deployment` section naming both the testnet and mainnet
contract addresses. The README's `## Network and deployment` section previously listed
Bohr testnet only and ended with the line:

> No public frontend URL is documented here.

That section now names the live frontend URL and both networks with their chain IDs, RPCs,
explorers, contracts, and failure sinks.

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

## Blocker 3 — No live website (resolved)

`github.com/AtharFazli/VOW` previously had `homepage: None` and no deployment URL anywhere
in README, DEMO.md, or the submission checklist.

Requirement #2 needed a live domain (the $1–$1.50 first-year tier is explicitly accepted
and reimbursed). Requirement #7 (BOT Chain branding on-site) and requirement #6 (launch
announcement on "your own site") both depended on this.

**Resolved.** `vowprotocol.web.id` resolves and serves the mainnet build:
`GET /` → 200, apex and `http://` 301 to `https://www.vowprotocol.web.id`, all app routes
200, `/nonexistent-page` 404, live HTML carries the BOT Chain badge and the mainnet
contract link and zero Bohr-explorer links. The earlier Vercel build failures were caused
by the project having no Root Directory set — Vercel installed and built at the repo root,
where there is no `package.json`. Setting Root Directory to `frontend` fixed it
(`npm ci` → EUSAGE and `npm run build` → ENOENT at root; both clean in `frontend/`).

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

- **Contract.** `src/Vow.sol`, 118 Forge tests across 8 suites, `forge fmt` and
  `forge build` clean.
- **On-chain evidence.** VOW #1 completed the full happy path on Bohr testnet — 9
  transaction hashes in the README, all verifiable. Contract balance returns to 0,
  double-withdraw correctly reverts with `NothingToWithdraw()`.
- **Frontend.** 115 tests passing across 7 files, ESLint clean, production build succeeds.
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
between testnet and mainnet. Re-verified: 115 tests pass across 7 files, ESLint clean, build succeeds.

---

## Minimum path to a valid submission

Ordered by what unblocks the most. Steps 1–4 are done.

1. ~~**Fix the repo default branch.**~~ Done — `main` carries the full project.
2. ~~**Add the README `Deployment` section** with both addresses.~~ Done — the section now
   names the live URL and both networks.
3. ~~**Buy and deploy the domain.**~~ Done — `https://vowprotocol.web.id` is live.
4. ~~**Top up the deployer, set a mainnet `FAILURE_SINK`, deploy, read it back, verify the
   source.**~~ Done — `0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4`, source verified.
5. **Create the X account and post.** Requirement #4, plus the best available recovery
   for #5. Still open, and outside the repository.
6. **Publish the launch announcement** on the live site. Requirement #6. The dependency is
   cleared; the announcement itself still needs writing and publishing.

What remains is not repo work. Item 5 needs an X account; item 6 needs a page of content
published on the live site.

---

## Risk summary

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `main` stays empty | Requirement #3 auto-fails | Resolved — `main` carries the full project |
| Mainnet not deployed by the 25th | Requirement #1 fails; #6 impossible | Resolved — mainnet deployed, source verified, reads back correct |
| Deploy uses the testnet FAILURE_SINK | Mainnet collateral permanently misrouted | Resolved — mainnet sink is the deployer address, read back on-chain |
| No domain | Requirements #2, #6, #7 all fail | Resolved — `https://vowprotocol.web.id` live, mainnet build |
| X account created late | Requirement #5 scored as unmet | Post across separate days; email the organisers |
| "Verified on Bohr" claimed in the form | Misrepresentation to judges | Verify first, or state testnet-only plainly |
| Announcement never published | Requirement #6 scores as unmet | Publish on the live site before the deadline |
