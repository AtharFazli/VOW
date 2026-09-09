import { type Address } from 'viem'
import {
  type VowData,
  VowStatus,
  ParticipantStatus,
  type VowRole,
} from './types'

export type VowCard = {
  id: bigint
  vow: VowData
  role: VowRole
}

export type VowGroup = {
  label: string
  cards: VowCard[]
}

// VowData fields from the Solidity struct (tuple order):
// 0:creator 1:partner 2:arbiter 3:stake 4:acceptDeadline 5:deliveryDeadline
// 6:reviewDeadline 7:disputeDeadline 8:creatorPromise 9:partnerPromise
// 10:creatorProofURI 11:partnerProofURI 12:creatorProofHash 13:partnerProofHash
// 14:creatorDisputeReason 15:partnerDisputeReason 16:creatorStatus 17:partnerStatus 18:status
export function tupleToVowData(t: readonly unknown[]): VowData {
  return {
    creator: t[0] as Address,
    partner: t[1] as Address,
    arbiter: t[2] as Address,
    stake: BigInt(t[3] as bigint | number),
    acceptDeadline: BigInt(t[4] as bigint | number),
    deliveryDeadline: BigInt(t[5] as bigint | number),
    reviewDeadline: BigInt(t[6] as bigint | number),
    disputeDeadline: BigInt(t[7] as bigint | number),
    creatorPromise: t[8] as string,
    partnerPromise: t[9] as string,
    creatorProofURI: t[10] as string,
    partnerProofURI: t[11] as string,
    creatorProofHash: t[12] as `0x${string}`,
    partnerProofHash: t[13] as `0x${string}`,
    creatorDisputeReason: t[14] as string,
    partnerDisputeReason: t[15] as string,
    creatorStatus: Number(t[16]) as ParticipantStatus,
    partnerStatus: Number(t[17]) as ParticipantStatus,
    status: Number(t[18]) as VowStatus,
  }
}

// Needs Action: connected wallet has a participant-specific obligation.
// Finalize included only when it advances toward terminal — excluded from PROPOSED observer.
function hasNeedsAction(vow: VowData, role: VowRole, actions: string[]): boolean {
  if (role === 'observer') return false
  // Accept (partner-only, PROPOSED)
  if (actions.includes('accept')) return true
  // Submit proof (participant-specific, ACTIVE)
  if (actions.includes('submitProof')) return true
  // Approve/dispute (review window)
  if (actions.includes('approve') || actions.includes('dispute')) return true
  // Resolve dispute (arbiter)
  if (actions.includes('resolveDispute')) return true
  // Claim
  if (actions.includes('claim')) return true
  // Finalize for participants only
  if (actions.includes('finalize')) return true
  return false
}

export function groupVows(
  cards: VowCard[],
  actionsMap: Map<string, string[]>,
): VowGroup[] {
  const needsAction: VowCard[] = []
  const active: VowCard[] = []
  const completed: VowCard[] = []

  for (const card of cards) {
    const actions = actionsMap.get(card.id.toString()) ?? []
    if (card.vow.status === VowStatus.SETTLED) {
      completed.push(card)
    } else if (hasNeedsAction(card.vow, card.role, actions)) {
      needsAction.push(card)
    } else {
      active.push(card)
    }
  }

  return [
    { label: 'Needs Action', cards: needsAction },
    { label: 'Active', cards: active },
    { label: 'Completed', cards: completed },
  ].filter((g) => g.cards.length > 0)
}
