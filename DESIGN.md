# VOW v1 — DESIGN SPECIFICATION

## Purpose
This document is the visual and UX source of truth for the VOW v1 frontend. It defines the product's visual direction, design system, page layouts, component behavior, responsive rules, and interaction patterns. It never overrides protocol semantics defined in PRD.md or TECHNICAL-SPEC.md.

---

## 1. Design Vision

**VOW should feel like a serious agreement between two people with money behind it.**

Design keywords:
- Minimal
- Trustworthy
- Modern
- Symmetrical
- Human-first
- On-chain without feeling "crypto-heavy"

Avoid:
- DeFi dashboards
- NFT marketplaces
- Neon cyberpunk aesthetics
- Trading terminals
- Excessive gradients or glassmorphism

---

## 2. Brand Identity

**Name:** VOW

**Tagline:**
> Trust is good. Collateral is better.

Supporting copy:
> Put BOT behind promises you make to each other.

---

## 3. Information Hierarchy

Every screen should answer these within 5 seconds:
1. What did I promise?
2. What did they promise?
3. How much BOT is locked?
4. What's the current status?
5. What's the next deadline?
6. What's my next action?

Priority order:
1. Current action
2. Reciprocal promises
3. Collateral
4. Deadline
5. Proof
6. Settlement
7. Technical metadata

---

## 4. Visual System

### Layout
- Max content width: **1200px**
- Operational pages: **760–900px**
- 8px spacing system
- Dark-first UI

### Typography
| Level | Size |
|--------|------|
| Display | 56px |
| H1 | 40px |
| H2 | 30px |
| H3 | 22px |
| Body | 16px |
| Small | 14px |

### Radius
- Button: 10px
- Card: 16px
- Modal: 20px

---

## 5. Color Tokens

Use semantic tokens instead of hardcoded values.

| Token | Purpose |
|--------|---------|
| --background | Main background |
| --surface | Card surface |
| --surface-elevated | Modal surface |
| --text-primary | Main text |
| --text-secondary | Secondary text |
| --accent | Brand color |
| --success | Success state |
| --warning | Dispute state |
| --danger | Failure state |

Status mapping:

| Status | Color |
|--------|-------|
| SUCCESS | Green |
| FAILED | Red |
| DISPUTED | Amber |
| UNRESOLVED | Gray |
| PROOF SUBMITTED | Blue |
| ACTIVE | Brand accent |

Never rely on color alone—always pair with text.

---

## 6. Page Structure

### Landing

```
VOW
Trust is good.
Collateral is better.

Put BOT behind promises you make to each other.

[ Create a Vow ]
```

Followed by a simple 4-step flow:

```
Promise
↓
Lock
↓
Prove
↓
Settle
```

---

### Create Vow

Sections:

1. Counterparty
2. Promises
3. Collateral
4. Deadlines
5. Summary

Summary example:

```
Partner: 0x12...89
Your Promise: Ship frontend
Their Promise: Deploy contract
Collateral: 10 BOT each
Total Locked: 20 BOT
```

Primary CTA:

> CREATE VOW & LOCK 10 BOT

---

### Vow Detail

The hero should always display:

```
VOW #42
ACTIVE
20 BOT LOCKED
Delivery in 18h
```

Main body:

```
YOU                     COUNTERPARTY
Ship frontend           Deploy contract
SUCCESS                 PENDING
```

Then:
- Proof section
- Timeline
- Deadlines
- Settlement

Only one dominant action should exist at a time.

Examples:
- Accept & Lock
- Submit Proof
- Approve Proof
- Finalize Vow
- Claim BOT

---

### My Vows

Three groups:
- Needs Action
- Active
- Completed

Card example:

```
VOW #42
You: Ship frontend
Partner: Deploy contract
10 BOT each
Delivery in 18h
[ View ]
```

---

## 7. Component Library

Core components:
- Navbar
- Wallet Button
- Network Badge
- Vow Card
- Promise Card
- Proof Card
- Status Badge
- Deadline Display
- Settlement Card
- Transaction Status
- Confirmation Dialog

Keep components reusable and lightweight.

---

## 8. Status Badges

| Label | Meaning |
|--------|---------|
| PROPOSED | Waiting acceptance |
| ACTIVE | Ongoing commitment |
| PROOF SUBMITTED | Awaiting review |
| SUCCESS | Completed |
| FAILED | Missed commitment |
| DISPUTED | Waiting arbiter |
| UNRESOLVED | Deadline expired |
| SETTLED | Funds allocated |

Example:

✓ SUCCESS

---

## 9. Timeline Component

```
Created → Accepted → Delivery → Review → Settlement
   ✓          ✓          ●          ○          ○
```

Highlight only the current phase.

---

## 10. Transaction UX

Every write action follows:

```
Idle
↓
Waiting for Wallet
↓
Submitted
↓
Confirming
↓
Confirmed / Failed
```

Never show success before confirmation.

---

## 11. Dialog Patterns

### Dispute

```
Dispute this proof?

Reason
[________________]

Cancel | Open Dispute
```

### Claim

```
20 BOT ready to claim.

[ Claim 20 BOT ]
```

---

## 12. Responsive Rules

Desktop:
- Two-column reciprocal promises
- Timeline horizontal

Mobile:
- Stack promise cards vertically
- Full-width CTAs
- Compact addresses
- No horizontal scrolling

---

## 13. Accessibility

Required:
- Keyboard navigation
- Visible focus states
- WCAG-friendly contrast
- Touch targets ≥44px
- Icons always paired with labels

---

## 14. Copy Guide

Use:
- Your Promise
- Their Promise
- Lock BOT
- Submit Proof
- Approve Proof
- Open Dispute
- Claim BOT

Avoid:
- Execute Metadata
- Commit URI
- Creator Payload
- Arbitration Engine

---

## 15. Anti-Patterns

Never implement:
- Token price charts
- Portfolio dashboard
- Candlestick graphs
- Rainbow gradients
- Floating crypto coins
- Animated blockchain backgrounds
- More than one primary CTA per section

---

## 16. Final Acceptance Criteria

The design succeeds if a first-time judge can:
1. Understand VOW in under 10 seconds.
2. Create a Vow without explanation.
3. Immediately identify the next required action.
4. Understand collateral consequences at settlement.
5. Complete the happy-path flow on desktop or mobile.

---

## Final Design Principle

> **VOW should feel less like using a blockchain protocol and more like making a serious promise that happens to be enforced on-chain.**
