# Brag Plan: VOW

## What is this app?

VOW is a two-person reciprocal commitment protocol on BOT Chain: both sides lock
equal native BOT collateral behind promises they make to each other, submit proof,
review each other, and let fixed contract rules settle the outcome.

## The angle

Everyone talks about trust; VOW makes it expensive to break. The video takes the
product's own tagline literally — "Trust is good. Collateral is better." — and
then proves it with the actual on-chain lifecycle: two cards meeting at a VOW
medallion, a working action panel stepping through Accept → Prove → Review →
Settle → Withdraw, and the real settlement matrix. No abstract "trust" graphics.
The claim is verifiable: it is deployed, it has 118 passing tests, and the money
moved.

## Hook (first 2-3 seconds)

"Trust is good." slams in white, oversized, tight tracking — then "Collateral is
better." arrives beneath it in dimmed grey. It is the site's verbatim hero copy,
so the hook is the product's own line, delivered as a statement rather than a
description.

## Key moments (the middle)

- Two counterparty cards ("You promise" / "They promise") slide in from opposite
  edges and stop at an amber VOW medallion with equal `0.01 BOT` collateral.
- A simulated cursor clicks through the real action panel: Accept, Submit Proof,
  Approve Proof, Finalize VOW, Withdraw — real button labels from the app.
- The settlement matrix revealing three real outcomes, including that
  `FAILED / FAILED` sends both stakes to the failure sink.

## Outro / punchline

The VOW wordmark lands on a bell hit, with the deployment line underneath:
`Bohr Testnet · chain 968 · 0x9539…6530b`. The last frame is the proof, not a slogan.

## User flow worth showing

Yes — the real two-wallet lifecycle, taken from the app's own action eligibility:

1. **Entry** — counterparty cards show both sides locked at equal collateral.
2. **Key action** — the action panel steps through Accept → Submit Proof →
   Approve Proof → Finalize → Withdraw, driven by a simulated cursor.
3. **Result** — both sides SUCCESS, claimable `0 BOT`, contract balance `0 BOT`.

## Tone

- Preset: `polished`
- Creative direction: quiet premium product film — a bank vault that happens to be
  two people keeping a promise
- Interpretation: few scenes, longer holds, confidence through restraint. Type is
  oversized and settled, motion is deliberate (no bounces, no chaos), transitions
  are soft. The amber is the only colour and it is used like an asset, not decoration.

## Format: landscape — 1920x1080
## Duration: 20.19s

## Visual identity (from the project)

- Background: `#0a0a0a` (page background), panels `#0e0e0e`, inner cards `#ffffff0b`
- Accent: `#fbbf24` (amber-400 CTA), `#fcd34d` (amber-300 hover), CTA text `#17120a`
- Text: `#fafafa` primary, `#a1a1aa` secondary, `#71717a` tertiary, borders `#ffffff1a`
- Display font: system sans (site uses Inter via Next.js), tracking `-0.065em` on hero
- Body font: system sans; mono for kickers, addresses, code (`ui-monospace`)
- Strongest visual element: the reciprocal two-card + VOW medallion composition from
  the landing hero, and the real action-panel buttons from `/vow/[id]`

## Share copy (draft)

Trust is good. Collateral is better.
Two people, equal BOT collateral, proof reviewed by your counterparty, and a
contract that settles on fixed rules. Live on BOT Chain.

## Audio direction

- Role: warm corporate bed with sparse, restrained accents
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady, clean;
  the `polished` pick), volume 0.34
- Music treatment: starts at 0, holds under everything, fades out across the outro
- Music cue guidance: bundled preset read
  (`assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`),
  109.96 BPM, planning window 0.00-25.00s. Major locks: hook slam at 0.56,
  logo landing at 17.47 (strength 0.99). Beat-grid windows: reciprocal cards at
  3.27 / 3.82; flow steps at 6.00 / 7.09 / 8.74 / 10.37 / 12.02; settlement rows
  at 13.11 / 14.20 / 15.29
- Audio-reactive treatment: subtle — music bass swells the amber glow behind the
  hero and the medallion presence. No waveform/equalizer visuals
- SFX posture: sparse, motion-matched, professional restraint (7 cues total)
- Audio-coupled moments: hook slam; the two cards arriving one by one; each of the
  five action-panel steps firing a click as the cursor presses; settlement rows
  dropping in; the logo bell
- Restraint rule: no SFX under the settlement rows' reading time beyond the row
  drop itself, and nothing overlapping the final bell

## Storyboard

### Scene 1 — Hook — 0.00–3.27s (3.27s)
Full-bleed `#0a0a0a` with a soft amber radial glow low and centred. Mono kicker
`COLLATERALIZED PROMISES` in amber, letter-spaced, fades up at 0.10. Then
"Trust is good." (120px, white, tracking -0.065em) slams up at 0.56, and
"Collateral is better." (dimmed `#a1a1aa`) rises beneath it at 1.10.
Sequential/interaction: none — a two-beat slam, not a typing effect.
Audio intent: one clean impact under the first line; let the second line land dry.
Audio-coupled idea: hook slam lands on the 0.56 beat.
Music: warm bed, already running.
Transition mood: hard → Scene 2

### Scene 2 — Reciprocal — 3.27–6.00s (2.73s)
Two cards slide in from opposite edges and stop either side of an amber VOW
medallion; a hairline amber rule connects them behind the medallion. Left card:
`You promise` / `Ship the frontend` / Collateral `0.01 BOT`. Right card:
`They promise` / `Deploy the contract` / Collateral `0.01 BOT`. Caption below:
"Equal collateral. Fixed deadlines. A shared commitment." (verbatim site copy)
Sequential/interaction: yes — the two cards arrive one by one, then the caption.
Audio intent: two light card placements, then silence under the caption.
Audio-coupled idea: card 1 at 3.27, card 2 at 3.82 (beat grid).
Music: bed continues.
Transition mood: soft crossfade → Scene 3

### Scene 3 — The lifecycle — 6.00–13.11s (7.11s)
The working-app centerpiece. Left: a mono step counter (`01`–`05`) in amber and an
oversized verb. Right: a mock VOW action panel — header `VOW #1` with an `ACTIVE`
chip — whose action row swaps through the app's real button labels while a cursor
arrow moves in and presses each one (button scales down and flashes amber-300).
Steps, on the beat grid: `Accept` / "Lock 0.01 BOT" at 6.00; `Prove` /
"Submit your proof" at 7.09; `Review` / "Approve counterparty proof" at 8.74;
`Settle` / "finalizeVow() — callable by anyone" at 10.37; `Withdraw` /
"0.01 BOT claimable" at 12.02. Final state at 12.55: both sides `SUCCESS`,
claimable `0 BOT`, contract balance `0 BOT`.
Sequential/interaction: yes — five steps, cursor presses each button.
Audio intent: one dry click per press; nothing else competes with the reading.
Audio-coupled idea: clicks fire at the same timestamp as each button press.
Music: bed continues.
Transition mood: clean wipe → Scene 4

### Scene 4 — Settlement rules — 13.11–16.93s (3.82s)
Three rule rows drop in one at a time, each a mono outcome pair on the left and a
plain-language consequence on the right:
`SUCCESS / SUCCESS` → "each participant receives their own stake";
`SUCCESS / FAILED` → "the successful participant receives both stakes";
`FAILED / FAILED` → "both stakes go to the failure sink".
Caption: "Fixed rules. No administrator."
Sequential/interaction: yes — three rows, one by one.
Audio intent: a soft drop per row, then quiet for the caption.
Audio-coupled idea: rows at 13.11 / 14.20 / 15.29 (beat grid).
Music: bed continues, slight lift.
Transition mood: soft → Scene 5

### Scene 5 — Outro — 16.93–20.19s (3.26s)
The reciprocal glow returns. `VOW` wordmark (160px, white, tracking -0.065em) lands
at 17.47 on a bell. Beneath it, dimmed: "Trust is good. Collateral is better."
Then a mono deployment line: `Bohr Testnet · chain 968 · 0x9539263f4861812B08C37Bb3cB6603c771d6530b`.
Fade to black over the last 0.6s as the music fades out.
Sequential/interaction: yes — wordmark, then tagline, then the deployment line.
Audio intent: one resonant bell on the wordmark, ringing over the music; music fades.
Audio-coupled idea: bell at 17.47 (strong cue, strength 0.99).
Music: fade out to 0 by 20.19.
Transition mood: none — end card.

**Music mood for this video:** warm, steady, business-forward
**Audio summary:** a warm bed carries the whole film; one impact opens it, light
card and click accents mark each real product step, and a single bell lands the logo.
