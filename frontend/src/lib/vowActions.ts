import { type Address } from 'viem'
import { type VowData, type VowRole } from './types'
import { proofHashFromUri } from './useVowWrite'

export type VowWriteAction = 'accept' | 'submitProof' | 'approve' | 'dispute' | 'finalize' | 'withdraw'

export type VowWriteRequest = {
  functionName: string
  args: readonly unknown[]
  value?: bigint
}

export function reviewParticipant(vow: VowData, role: VowRole): Address | null {
  if (role === 'creator') return vow.partner
  if (role === 'partner') return vow.creator
  return null
}

export function buildVowWriteRequest(
  action: VowWriteAction,
  vow: VowData,
  vowId: bigint,
  role: VowRole,
  proofUri = '',
  disputeReason = '',
): VowWriteRequest | null {
  switch (action) {
    case 'accept':
      return { functionName: 'acceptVow', args: [vowId], value: vow.stake }
    case 'submitProof': {
      const uri = proofUri.trim()
      if (!uri) return null
      return { functionName: 'submitProof', args: [vowId, uri, proofHashFromUri(uri)] }
    }
    case 'approve':
    case 'dispute': {
      const participant = reviewParticipant(vow, role)
      if (!participant) return null
      return {
        functionName: 'reviewProof',
        args: [vowId, participant, action === 'approve', action === 'dispute' ? disputeReason.trim() : ''],
      }
    }
    case 'finalize':
      return { functionName: 'finalizeVow', args: [vowId] }
    case 'withdraw':
      return { functionName: 'withdraw', args: [] }
  }
}
