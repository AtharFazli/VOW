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

function deadlineActive(ts: bigint, now: number): boolean {
  return ts > 0n && BigInt(now) <= ts
}

export function getAvailableActions(
  vow: VowData,
  role: VowRole,
  now: number,
  claimable: bigint = 0n,
): VowAction[] {
  const actions: VowAction[] = []
  const hasArbiter = vow.arbiter !== '0x0000000000000000000000000000000000000000'

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

  if (hasArbiter && role === 'arbiter' && vow.status === VowStatus.ACTIVE && deadlineActive(vow.disputeDeadline, now)) {
    const anyDisputed = vow.creatorStatus === ParticipantStatus.DISPUTED || vow.partnerStatus === ParticipantStatus.DISPUTED
    if (anyDisputed) {
      actions.push('resolveDispute')
    }
  }

  actions.push('finalize')

  if (claimable > 0n) {
    actions.push('claim')
  }

  return actions
}

// ponytail: simple zero-address check for arbiter presence
export function hasArbiter(vow: VowData): boolean {
  return vow.arbiter !== '0x0000000000000000000000000000000000000000'
}
