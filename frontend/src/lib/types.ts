import { type Address } from 'viem'

export enum VowStatus {
  PROPOSED = 0,
  ACTIVE = 1,
  SETTLED = 2,
}

export enum ParticipantStatus {
  PENDING = 0,
  PROOF_SUBMITTED = 1,
  SUCCESS = 2,
  FAILED = 3,
  DISPUTED = 4,
  UNRESOLVED = 5,
}

export type VowData = {
  creator: Address
  partner: Address
  arbiter: Address
  stake: bigint
  acceptDeadline: bigint
  deliveryDeadline: bigint
  reviewDeadline: bigint
  disputeDeadline: bigint
  creatorPromise: string
  partnerPromise: string
  creatorProofURI: string
  partnerProofURI: string
  creatorProofHash: `0x${string}`
  partnerProofHash: `0x${string}`
  creatorDisputeReason: string
  partnerDisputeReason: string
  creatorStatus: ParticipantStatus
  partnerStatus: ParticipantStatus
  status: VowStatus
}

export const VOW_STATUS_LABEL: Record<VowStatus, string> = {
  [VowStatus.PROPOSED]: 'Proposed',
  [VowStatus.ACTIVE]: 'Active',
  [VowStatus.SETTLED]: 'Settled',
}

export const PARTICIPANT_STATUS_LABEL: Record<ParticipantStatus, string> = {
  [ParticipantStatus.PENDING]: 'Pending',
  [ParticipantStatus.PROOF_SUBMITTED]: 'Proof Submitted',
  [ParticipantStatus.SUCCESS]: 'Success',
  [ParticipantStatus.FAILED]: 'Failed',
  [ParticipantStatus.DISPUTED]: 'Disputed',
  [ParticipantStatus.UNRESOLVED]: 'Unresolved',
}

export type VowRole = 'creator' | 'partner' | 'arbiter' | 'observer'

export type VowAction =
  | 'accept'
  | 'submitProof'
  | 'approve'
  | 'dispute'
  | 'resolveDispute'
  | 'finalize'
  | 'claim'
