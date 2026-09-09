import { describe, it, expect } from 'vitest'
import { type Address } from 'viem'
import { deriveRole, formatStake, formatDeadline, getAvailableActions, hasArbiter } from './vow'
import { VowStatus, ParticipantStatus, type VowData } from './types'

const ADDR0 = '0x0000000000000000000000000000000000000000' as Address
const CREATOR = '0x1111111111111111111111111111111111111111' as Address
const PARTNER = '0x2222222222222222222222222222222222222222' as Address
const ARBITER = '0x3333333333333333333333333333333333333333' as Address
const OTHER = '0x4444444444444444444444444444444444444444' as Address

function baseVow(overrides: Partial<VowData> = {}): VowData {
  return {
    creator: CREATOR,
    partner: PARTNER,
    arbiter: ADDR0,
    stake: 1000000000000000000n, // 1 BOT
    acceptDeadline: 1000n,
    deliveryDeadline: 2000n,
    reviewDeadline: 3000n,
    disputeDeadline: 4000n,
    creatorPromise: 'I will paint your wall',
    partnerPromise: 'I will pay 5 BOT',
    creatorProofURI: '',
    partnerProofURI: '',
    creatorProofHash: '0x' + '00'.repeat(32) as `0x${string}`,
    partnerProofHash: '0x' + '00'.repeat(32) as `0x${string}`,
    creatorDisputeReason: '',
    partnerDisputeReason: '',
    creatorStatus: ParticipantStatus.PENDING,
    partnerStatus: ParticipantStatus.PENDING,
    status: VowStatus.PROPOSED,
    ...overrides,
  }
}

describe('deriveRole', () => {
  it('returns creator', () => {
    expect(deriveRole(baseVow(), CREATOR)).toBe('creator')
  })
  it('returns partner', () => {
    expect(deriveRole(baseVow(), PARTNER)).toBe('partner')
  })
  it('returns arbiter when set', () => {
    expect(deriveRole(baseVow({ arbiter: ARBITER }), ARBITER)).toBe('arbiter')
  })
  it('returns observer for unknown', () => {
    expect(deriveRole(baseVow(), OTHER)).toBe('observer')
  })
  it('returns observer when no wallet', () => {
    expect(deriveRole(baseVow(), undefined)).toBe('observer')
  })
  it('returns observer when arbiter matches but arbiter is zero', () => {
    expect(deriveRole(baseVow({ arbiter: ADDR0 }), ADDR0)).toBe('observer')
  })
})

describe('formatStake', () => {
  it('formats 1 BOT', () => {
    expect(formatStake(1000000000000000000n)).toBe('1.0000 BOT')
  })
  it('formats 0', () => {
    expect(formatStake(0n)).toBe('0.0000 BOT')
  })
})

describe('formatDeadline', () => {
  it('formats zero as dash', () => {
    expect(formatDeadline(0n)).toBe('—')
  })
  it('formats timestamp', () => {
    const result = formatDeadline(1700000000n)
    expect(result).not.toBe('—')
    expect(result.length).toBeGreaterThan(5)
  })
})

describe('hasArbiter', () => {
  it('false when zero address', () => {
    expect(hasArbiter(baseVow({ arbiter: ADDR0 }))).toBe(false)
  })
  it('true when set', () => {
    expect(hasArbiter(baseVow({ arbiter: ARBITER }))).toBe(true)
  })
})

describe('getAvailableActions', () => {
  it('partner can accept proposed vow before deadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'partner',
      500,
    )
    expect(actions).toContain('accept')
  })

  it('partner cannot accept after deadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'partner',
      1500,
    )
    expect(actions).not.toContain('accept')
  })

  it('creator cannot accept', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'creator',
      500,
    )
    expect(actions).not.toContain('accept')
  })

  it('creator can submit proof when active and pending before deadline', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        deliveryDeadline: 2000n,
        creatorStatus: ParticipantStatus.PENDING,
      }),
      'creator',
      500,
    )
    expect(actions).toContain('submitProof')
  })

  it('creator cannot submit proof after delivery deadline', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        deliveryDeadline: 2000n,
        creatorStatus: ParticipantStatus.PENDING,
      }),
      'creator',
      2500,
    )
    expect(actions).not.toContain('submitProof')
  })

  it('creator can approve/dispute partner proof', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        reviewDeadline: 3000n,
        partnerStatus: ParticipantStatus.PROOF_SUBMITTED,
      }),
      'creator',
      500,
    )
    expect(actions).toContain('approve')
    expect(actions).toContain('dispute')
  })

  it('arbiter can resolve when disputed before deadline', () => {
    const actions = getAvailableActions(
      baseVow({
        arbiter: ARBITER,
        status: VowStatus.ACTIVE,
        disputeDeadline: 4000n,
        partnerStatus: ParticipantStatus.DISPUTED,
      }),
      'arbiter',
      500,
    )
    expect(actions).toContain('resolveDispute')
  })

  it('arbiter cannot resolve after dispute deadline', () => {
    const actions = getAvailableActions(
      baseVow({
        arbiter: ARBITER,
        status: VowStatus.ACTIVE,
        disputeDeadline: 4000n,
        partnerStatus: ParticipantStatus.DISPUTED,
      }),
      'arbiter',
      4500,
    )
    expect(actions).not.toContain('resolveDispute')
  })

  it('finalize is always available', () => {
    const actions = getAvailableActions(baseVow(), 'observer', 500)
    expect(actions).toContain('finalize')
  })

  it('claim available when claimable > 0', () => {
    const actions = getAvailableActions(baseVow(), 'creator', 500, 1000000000000000000n)
    expect(actions).toContain('claim')
  })

  it('claim not available when claimable is 0', () => {
    const actions = getAvailableActions(baseVow(), 'creator', 500, 0n)
    expect(actions).not.toContain('claim')
  })
})
