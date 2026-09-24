import { type Address, formatEther, isAddressEqual } from 'viem'
import {
  type VowData,
  VowStatus,
  ParticipantStatus,
  type VowRole,
  type VowAction,
} from './types'

export function deriveRole(vow: VowData, address: Address | undefined): VowRole {
  if (!address) return 'observer'
  if (isAddressEqual(address, vow.creator)) return 'creator'
  if (isAddressEqual(address, vow.partner)) return 'partner'
  if (vow.arbiter !== '0x0000000000000000000000000000000000000000' && isAddressEqual(address, vow.arbiter))
    return 'arbiter'
  return 'observer'
}

export function formatStake(stake: bigint): string {
  return `${Number(formatEther(stake)).toFixed(4)} BOT`
}

export function formatDeadline(ts: bigint): string {
  if (ts === 0n) return '—'
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString()
}

function deadlineActive(ts: bigint, now: number | null): boolean {
  return now !== null && ts > 0n && BigInt(now) <= ts
}

// ponytail: deadline strictly passed (for finalize eligibility where contract uses `>` not `<=`)
function deadlinePassed(ts: bigint, now: number): boolean {
  return ts > 0n && BigInt(now) > ts
}

export function isTerminal(s: ParticipantStatus): boolean {
  return s === ParticipantStatus.SUCCESS || s === ParticipantStatus.FAILED || s === ParticipantStatus.UNRESOLVED
}

// Predict whether _resolveParticipantTimeouts would make this participant terminal
function wouldBecomeTerminal(status: ParticipantStatus, now: number, deadlines: { delivery: bigint; review: bigint; dispute: bigint }): boolean {
  if (isTerminal(status)) return true
  if (status === ParticipantStatus.PENDING) return deadlinePassed(deadlines.delivery, now)
  if (status === ParticipantStatus.PROOF_SUBMITTED) return deadlinePassed(deadlines.review, now)
  if (status === ParticipantStatus.DISPUTED) return deadlinePassed(deadlines.dispute, now)
  return false
}

function finalizeReady(vow: VowData, now: number): boolean {
  if (vow.status === VowStatus.SETTLED) return false
  if (vow.status === VowStatus.PROPOSED) return deadlinePassed(vow.acceptDeadline, now)
  if (vow.status !== VowStatus.ACTIVE) return false
  const dl = { delivery: vow.deliveryDeadline, review: vow.reviewDeadline, dispute: vow.disputeDeadline }
  return wouldBecomeTerminal(vow.creatorStatus, now, dl) && wouldBecomeTerminal(vow.partnerStatus, now, dl)
}

export function getAvailableActions(
  vow: VowData,
  role: VowRole,
  now: number,
  claimable: bigint = 0n,
): VowAction[] {
  const actions: VowAction[] = []
  const hasArb = vow.arbiter !== '0x0000000000000000000000000000000000000000'

  if (role === 'partner' && vow.status === VowStatus.PROPOSED && deadlineActive(vow.acceptDeadline, now)) {
    actions.push('accept')
  }

  if (vow.status === VowStatus.ACTIVE && deadlineActive(vow.deliveryDeadline, now)) {
    if (role === 'creator' && vow.creatorStatus === ParticipantStatus.PENDING) {
      actions.push('submitProof')
    }
    if (role === 'partner' && vow.partnerStatus === ParticipantStatus.PENDING) {
      actions.push('submitProof')
    }
  }

  if (vow.status === VowStatus.ACTIVE) {
    if (role === 'creator' && vow.partnerStatus === ParticipantStatus.PROOF_SUBMITTED && deadlineActive(vow.reviewDeadline, now)) {
      actions.push('approve', 'dispute')
    }
    if (role === 'partner' && vow.creatorStatus === ParticipantStatus.PROOF_SUBMITTED && deadlineActive(vow.reviewDeadline, now)) {
      actions.push('approve', 'dispute')
    }
  }

  if (hasArb && role === 'arbiter' && vow.status === VowStatus.ACTIVE && deadlineActive(vow.disputeDeadline, now)) {
    const anyDisputed = vow.creatorStatus === ParticipantStatus.DISPUTED || vow.partnerStatus === ParticipantStatus.DISPUTED
    if (anyDisputed) {
      actions.push('resolveDispute')
    }
  }

  if (finalizeReady(vow, now)) {
    actions.push('finalize')
  }

  if (claimable > 0n) {
    actions.push('claim')
  }

  return actions
}

// The actions the UI knows how to render. ActionPanel derives its empty-state from
// this list, so any VowAction emitted by getAvailableActions but missing here would
// render a section with a heading and no buttons. Kept next to getAvailableActions
// so the two are read together; the F5 test asserts they never drift.
export const RENDERABLE_ACTIONS = [
  'accept',
  'submitProof',
  'approve',
  'dispute',
  'resolveDispute',
  'finalize',
  'claim',
] as const satisfies readonly VowAction[]

// ponytail: simple zero-address check for arbiter presence
export function hasArbiter(vow: VowData): boolean {
  return vow.arbiter !== '0x0000000000000000000000000000000000000000'
}
