# Hyperframes Composition Brief: VOW

## Objective
Create a short launch-style brag video for VOW — a two-person reciprocal
commitment protocol on BOT Chain where both sides lock equal native BOT collateral.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20.19 seconds

## Source Material
- Project root: `D:/VOW`
- Primary files read: `frontend/src/app/page.tsx` (landing hero + lifecycle steps),
  `frontend/src/components/ActionPanel.tsx` (real action labels),
  `frontend/src/lib/vow.ts` (eligibility + terminal states),
  `frontend/src/app/globals.css`, `README.md`, `DEMO.md`, `SESSION-HANDOFF.md`
- Product name: VOW
- Tagline / strongest claim: "Trust is good. Collateral is better."
- Key UI or visual moment to recreate: the reciprocal two-card + VOW medallion from
  the landing hero; and the `/vow/[id]` action panel with its real button labels
- Copy that must appear verbatim:
  - "Trust is good."
  - "Collateral is better."
  - "Collateralized promises"
  - "You promise" / "Ship the frontend" / "They promise" / "Deploy the contract"
  - "Equal collateral. Fixed deadlines. A shared commitment."
  - "Accept this VOW by locking 0.01 BOT" / "Submit your proof of completion" /
    "Approve counterparty proof" / "Finalize VOW" / "Withdraw your claimable 0.01 BOT"
  - "SUCCESS / SUCCESS", "SUCCESS / FAILED", "FAILED / FAILED"
  - "Bohr Testnet", "0x9539263f4861812B08C37Bb3cB6603c771d6530b"

## Creative Direction
- Tone preset: `polished`
- Creative direction: quiet premium product film — a bank vault that happens to be
  two people keeping a promise
- Interpretation: few scenes, longer holds, confidence through restraint. Oversized
  settled type, deliberate motion, soft transitions. Amber is the only colour and is
  used as an asset, never decoration.
- Angle: everyone talks about trust; VOW makes it expensive to break. The video takes
  the product's own tagline literally and then proves it with the real on-chain
  lifecycle and the real settlement matrix.
- Hook: "Trust is good." slams in white; "Collateral is better." arrives beneath it.
- Outro / punchline: the VOW wordmark lands on a bell over the deployment line.
  The last frame is the proof, not a slogan.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: `#0a0a0a`; panels `#0e0e0e`; inner cards `rgba(255,255,255,0.045)`
- Text: `#fafafa` primary, `#a1a1aa` secondary, `#71717a` tertiary
- Accent: `#fbbf24` (amber-400), hover `#fcd34d` (amber-300), CTA text `#17120a`
- Borders: `rgba(255,255,255,0.10)`
- Display font: generic `sans-serif` (site uses Inter via Next.js; no local font file
  is shipped, so use the generic keyword to satisfy the font-family lint rule)
- Body font: generic `sans-serif`; `monospace` for kickers, code, and addresses
- Visual references from the project: reciprocal two-card hero, amber VOW medallion,
  `01`-numbered lifecycle grid, real action-panel buttons, mono deployment line

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 0.00–3.27s — kicker, "Trust is good.", "Collateral is better."
2. Reciprocal — 3.27–6.00s — two cards arrive, meet at the medallion, caption
3. Lifecycle — 6.00–13.11s — five real action steps with a simulated cursor
4. Settlement rules — 13.11–16.93s — three outcome rows, "Fixed rules. No administrator."
5. Outro — 16.93–20.19s — VOW wordmark on a bell, tagline, deployment line

## Audio
- Audio role: warm corporate bed with sparse, restrained accents
- Audio arc: bed carries the whole film; one impact opens it, light card and click
  accents mark each real product step, a single bell lands the logo, music fades out
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`,
  volume 0.34, `data-start="0"`, `data-duration="20.19"`
- Music treatment: hold under everything; fade out to 0 across the outro
- Music cue guidance: bundled preset at
  `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
  — 109.96 BPM, window 0.00-25.00s. Strong locks: 0.56 (hook), 17.47 (logo, 0.99).
  Beat grid for sequential reveals: 3.27, 3.82, 6.00, 7.09, 8.74, 10.37, 12.02,
  13.11, 14.20, 15.29
- Audio-reactive treatment: subtle — music bass/RMS swells the amber hero glow and
  the medallion presence. No waveform, equalizer, note, or particle visuals
- Audio-coupled moments:
  - Hook slam — impact under the first line (0.56)
  - Reciprocal cards — one card placement per arrival (3.27, 3.82)
  - Lifecycle steps — one click per cursor press (6.00, 7.09, 8.74, 10.37, 12.02)
  - Final lifecycle state — soft impact (12.55)
  - Settlement rows — soft drop per row (13.11, 14.20, 15.29)
  - Logo — resonant bell (17.47)
- SFX selection guidance: motion-matched and restrained; card sounds for card
  arrivals, clicks for simulated presses, soft impacts for reveals, one bell for the
  logo. Prefer low/medium high-frequency-risk files — this is a `polished` tone
- SFX analysis guidance: `skills/brag/assets/sfx/sfx-analysis.md` — safest general
  picks are `impact/impactSoft_medium_*` (low HF risk) and `interface/click_003`
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and
  volume based on the implemented animation. Eight files are pre-copied into
  `composition/assets/sfx/` as the shortlist
- Audio files: music and SFX are already copied into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`,
`hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`,
`hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes`
entry-point intent interview and do not route into its generic promo / launch-video
workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or
  documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet.
- Treat music cue metadata as optional timing hints.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller
  entrances may align to nearby beat points within about 0.10s. Use 1-3 strong cue
  locks (this plan uses two: 0.56 and 17.47).
- Use local assets for audio. Relative paths only, from `composition/`.
- Run `hyperframes check` before render — it is brag's single gate.
