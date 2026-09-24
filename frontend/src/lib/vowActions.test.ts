import { describe, expect, it } from 'vitest'
import { type Address, keccak256, toBytes } from 'viem'
import { ParticipantStatus, VowStatus, type VowData, type VowRole } from './types'
import { getAvailableActions, RENDERABLE_ACTIONS } from './vow'
import { buildVowWriteRequest, buildResolveDisputeRequest, disputedParticipants, reviewParticipant } from './vowActions'
import { isTxPending, receiptPhase, proofHashFromUri } from './useVowWrite'

const ZERO = '0x0000000000000000000000000000000000000000' as Address
const CREATOR = '0x1111111111111111111111111111111111111111' as Address
const PARTNER = '0x2222222222222222222222222222222222222222' as Address

function vow(overrides: Partial<VowData> = {}): VowData {
  return {
    creator: CREATOR, partner: PARTNER, arbiter: ZERO, stake: 10_000_000_000_000_000n,
    acceptDeadline: 1000n, deliveryDeadline: 2000n, reviewDeadline: 3000n, disputeDeadline: 4000n,
    creatorPromise: 'creator', partnerPromise: 'partner', creatorProofURI: '', partnerProofURI: '',
    creatorProofHash: `0x${'00'.repeat(32)}`, partnerProofHash: `0x${'00'.repeat(32)}`,
    creatorDisputeReason: '', partnerDisputeReason: '', creatorStatus: ParticipantStatus.PENDING,
    partnerStatus: ParticipantStatus.PENDING, status: VowStatus.PROPOSED, ...overrides,
  }
}

describe('Gate S canonical eligibility', () => {
  it('allows partner accept, not creator, before and at deadline only', () => {
    expect(getAvailableActions(vow(), 'partner', 999)).toContain('accept')
    expect(getAvailableActions(vow(), 'partner', 1000)).toContain('accept')
    expect(getAvailableActions(vow(), 'partner', 1001)).not.toContain('accept')
    expect(getAvailableActions(vow(), 'creator', 999)).not.toContain('accept')
  })

  it('allows each pending participant proof, blocks duplicate, includes deadline', () => {
    const active = vow({ status: VowStatus.ACTIVE })
    expect(getAvailableActions(active, 'creator', 2000)).toContain('submitProof')
    expect(getAvailableActions(active, 'partner', 2000)).toContain('submitProof')
    expect(getAvailableActions({ ...active, creatorStatus: ParticipantStatus.PROOF_SUBMITTED }, 'creator', 2000)).not.toContain('submitProof')
    expect(getAvailableActions(active, 'creator', 2001)).not.toContain('submitProof')
  })

  it('allows review only for submitted counterparty proof', () => {
    const active = vow({ status: VowStatus.ACTIVE, partnerStatus: ParticipantStatus.PROOF_SUBMITTED })
    expect(getAvailableActions(active, 'creator', 3000)).toEqual(expect.arrayContaining(['approve', 'dispute']))
    expect(getAvailableActions(active, 'partner', 3000)).not.toEqual(expect.arrayContaining(['approve', 'dispute']))
    expect(reviewParticipant(active, 'creator')).toBe(PARTNER)
    expect(reviewParticipant(active, 'partner')).toBe(CREATOR)
  })

  it('allows finalize for happy path and never for settled', () => {
    const done = vow({ status: VowStatus.ACTIVE, creatorStatus: ParticipantStatus.SUCCESS, partnerStatus: ParticipantStatus.SUCCESS })
    expect(getAvailableActions(done, 'observer', 1)).toContain('finalize')
    expect(getAvailableActions({ ...done, status: VowStatus.SETTLED }, 'observer', 9999)).not.toContain('finalize')
  })

  it('uses account-level claimable without requiring viewed vow settled', () => {
    expect(getAvailableActions(vow(), 'creator', 1, 1n)).toContain('claim')
    expect(getAvailableActions(vow(), 'creator', 1, 0n)).not.toContain('claim')
  })
})

describe('Gate S ABI request construction', () => {
  it('forwards exact stake to accept', () => {
    expect(buildVowWriteRequest('accept', vow(), 0n, 'partner')).toEqual({ functionName: 'acceptVow', args: [0n], value: 10_000_000_000_000_000n })
  })

  it('derives proof hash as keccak256(bytes(uri))', () => {
    const uri = 'https://example.com/vow-demo/creator-proof'
    expect(proofHashFromUri(uri)).toBe(keccak256(toBytes(uri)))
    expect(buildVowWriteRequest('submitProof', vow(), 0n, 'creator', uri)?.args).toEqual([0n, uri, proofHashFromUri(uri)])
  })

  it('targets counterparty and uses approved true', () => {
    expect(buildVowWriteRequest('approve', vow(), 0n, 'creator')?.args).toEqual([0n, PARTNER, true, ''])
    expect(buildVowWriteRequest('approve', vow(), 0n, 'partner')?.args).toEqual([0n, CREATOR, true, ''])
  })

  it('uses approved false for dispute', () => {
    expect(buildVowWriteRequest('dispute', vow(), 0n, 'creator')?.args).toEqual([0n, PARTNER, false, ''])
  })

  it('builds finalize and account-level withdraw', () => {
    expect(buildVowWriteRequest('finalize', vow(), 0n, 'observer')).toEqual({ functionName: 'finalizeVow', args: [0n] })
    expect(buildVowWriteRequest('withdraw', vow(), 0n, 'observer')).toEqual({ functionName: 'withdraw', args: [] })
  })
})

describe('Gate S transaction state helpers', () => {
  it('marks every in-flight phase as pending for duplicate guards', () => {
    expect(isTxPending('simulating')).toBe(true)
    expect(isTxPending('wallet')).toBe(true)
    expect(isTxPending('submitted')).toBe(true)
    expect(isTxPending('confirming')).toBe(true)
    expect(isTxPending('idle')).toBe(false)
    expect(isTxPending('confirmed')).toBe(false)
  })

  it('only reports confirmed after successful receipt', () => {
    expect(receiptPhase('success')).toBe('confirmed')
    expect(receiptPhase('reverted')).toBe('error')
  })
})

describe('F5 — resolveDispute renders and is reachable', () => {
  const ARBITER = '0x3333333333333333333333333333333333333333' as Address

  // Shared with ActionPanel via RENDERABLE_ACTIONS: the panel derives its empty
  // state from that same list, so any action the panel cannot render turns the
  // section into a heading with zero buttons — the F5 bug.
  const RENDERABLE = RENDERABLE_ACTIONS

  function arbiterVow(overrides: Partial<VowData> = {}): VowData {
    return vow({
      arbiter: ARBITER, status: VowStatus.ACTIVE, disputeDeadline: 4000n,
      partnerStatus: ParticipantStatus.DISPUTED, ...overrides,
    })
  }

  it('arbiter-only resolveDispute is in the renderable set', () => {
    const actions = getAvailableActions(arbiterVow(), 'arbiter', 4000)
    expect(actions).toEqual(['resolveDispute'])
    expect(actions.every(a => RENDERABLE.includes(a as typeof RENDERABLE[number]))).toBe(true)
  })

  it('every action getAvailableActions can emit is renderable', () => {
    const combos: Array<[VowData, VowRole, number, bigint]> = [
      [vow(), 'partner', 999, 0n],
      [vow({ status: VowStatus.ACTIVE }), 'creator', 2000, 0n],
      [vow({ status: VowStatus.ACTIVE, partnerStatus: ParticipantStatus.PROOF_SUBMITTED }), 'creator', 3000, 0n],
      [arbiterVow(), 'arbiter', 4000, 0n],
      [vow({ status: VowStatus.ACTIVE, creatorStatus: ParticipantStatus.SUCCESS, partnerStatus: ParticipantStatus.SUCCESS }), 'observer', 1, 0n],
      [vow(), 'creator', 1, 1n],
    ]
    for (const [v, role, now, claimable] of combos) {
      for (const action of getAvailableActions(v, role, now, claimable)) {
        expect(RENDERABLE).toContain(action)
      }
    }
  })

  it('collects each disputed participant so both can be resolved separately', () => {
    expect(disputedParticipants(arbiterVow())).toEqual([PARTNER])
    expect(disputedParticipants(arbiterVow({ creatorStatus: ParticipantStatus.DISPUTED }))).toEqual([CREATOR, PARTNER])
    expect(disputedParticipants(vow({ status: VowStatus.ACTIVE }))).toEqual([])
  })

  it('builds resolveDispute with participant and proofValid positionally', () => {
    expect(buildResolveDisputeRequest(7n, PARTNER, true)).toEqual({
      functionName: 'resolveDispute', args: [7n, PARTNER, true],
    })
    expect(buildResolveDisputeRequest(7n, CREATOR, false)).toEqual({
      functionName: 'resolveDispute', args: [7n, CREATOR, false],
    })
  })

  it('reviewParticipant stays null for arbiter so the review path cannot target itself', () => {
    expect(reviewParticipant(arbiterVow(), 'arbiter')).toBeNull()
  })
})
