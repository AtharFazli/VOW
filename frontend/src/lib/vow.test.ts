import { describe, it, expect } from 'vitest'
import { type Address } from 'viem'
import { deriveRole, formatStake, formatDeadline, getAvailableActions, hasArbiter, isTerminal } from './vow'
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

describe('isTerminal', () => {
  it('SUCCESS is terminal', () => expect(isTerminal(ParticipantStatus.SUCCESS)).toBe(true))
  it('FAILED is terminal', () => expect(isTerminal(ParticipantStatus.FAILED)).toBe(true))
  it('UNRESOLVED is terminal', () => expect(isTerminal(ParticipantStatus.UNRESOLVED)).toBe(true))
  it('PENDING is not terminal', () => expect(isTerminal(ParticipantStatus.PENDING)).toBe(false))
  it('PROOF_SUBMITTED is not terminal', () => expect(isTerminal(ParticipantStatus.PROOF_SUBMITTED)).toBe(false))
  it('DISPUTED is not terminal', () => expect(isTerminal(ParticipantStatus.DISPUTED)).toBe(false))
})

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

describe('deadline boundary — accept (inclusive <=)', () => {
  it('partner can accept at exactly acceptDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'partner', 1000,
    )
    expect(actions).toContain('accept')
  })
  it('partner cannot accept one second after acceptDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'partner', 1001,
    )
    expect(actions).not.toContain('accept')
  })
})

describe('deadline boundary — submitProof (inclusive <=)', () => {
  it('creator can submit at exactly deliveryDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, deliveryDeadline: 2000n, creatorStatus: ParticipantStatus.PENDING }),
      'creator', 2000,
    )
    expect(actions).toContain('submitProof')
  })
  it('creator cannot submit one second after deliveryDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, deliveryDeadline: 2000n, creatorStatus: ParticipantStatus.PENDING }),
      'creator', 2001,
    )
    expect(actions).not.toContain('submitProof')
  })
})

describe('deadline boundary — review (inclusive <=)', () => {
  it('creator can review at exactly reviewDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, reviewDeadline: 3000n, partnerStatus: ParticipantStatus.PROOF_SUBMITTED }),
      'creator', 3000,
    )
    expect(actions).toContain('approve')
    expect(actions).toContain('dispute')
  })
  it('creator cannot review one second after reviewDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, reviewDeadline: 3000n, partnerStatus: ParticipantStatus.PROOF_SUBMITTED }),
      'creator', 3001,
    )
    expect(actions).not.toContain('approve')
    expect(actions).not.toContain('dispute')
  })
})

describe('deadline boundary — resolveDispute (inclusive <=)', () => {
  it('arbiter can resolve at exactly disputeDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ arbiter: ARBITER, status: VowStatus.ACTIVE, disputeDeadline: 4000n, partnerStatus: ParticipantStatus.DISPUTED }),
      'arbiter', 4000,
    )
    expect(actions).toContain('resolveDispute')
  })
  it('arbiter cannot resolve one second after disputeDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ arbiter: ARBITER, status: VowStatus.ACTIVE, disputeDeadline: 4000n, partnerStatus: ParticipantStatus.DISPUTED }),
      'arbiter', 4001,
    )
    expect(actions).not.toContain('resolveDispute')
  })
})

describe('finalize — PROPOSED', () => {
  it('not available before acceptDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'observer', 500,
    )
    expect(actions).not.toContain('finalize')
  })
  it('not available at acceptDeadline (contract uses strictly >)', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'observer', 1000,
    )
    expect(actions).not.toContain('finalize')
  })
  it('available after acceptDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.PROPOSED, acceptDeadline: 1000n }),
      'observer', 1001,
    )
    expect(actions).toContain('finalize')
  })
})

describe('finalize — ACTIVE with pending timeouts', () => {
  it('not available when both PENDING before deliveryDeadline', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, deliveryDeadline: 2000n }),
      'observer', 500,
    )
    expect(actions).not.toContain('finalize')
  })
  it('not available at deliveryDeadline (strictly > required)', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, deliveryDeadline: 2000n }),
      'observer', 2000,
    )
    expect(actions).not.toContain('finalize')
  })
  it('available when both PENDING and deliveryDeadline passed', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.ACTIVE, deliveryDeadline: 2000n }),
      'observer', 2001,
    )
    expect(actions).toContain('finalize')
  })
})

describe('finalize — ACTIVE with proof submitted', () => {
  it('not available when proof submitted before reviewDeadline', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        creatorStatus: ParticipantStatus.PROOF_SUBMITTED,
        reviewDeadline: 3000n,
      }),
      'observer', 2500,
    )
    expect(actions).not.toContain('finalize')
  })
  it('available when proof submitted and reviewDeadline passed', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        creatorStatus: ParticipantStatus.PROOF_SUBMITTED,
        reviewDeadline: 3000n,
      }),
      'observer', 3001,
    )
    expect(actions).toContain('finalize')
  })
})

describe('finalize — ACTIVE with dispute', () => {
  it('not available when disputed before disputeDeadline', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        partnerStatus: ParticipantStatus.DISPUTED,
        disputeDeadline: 4000n,
      }),
      'observer', 3500,
    )
    expect(actions).not.toContain('finalize')
  })
  it('available when disputed and disputeDeadline passed', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        partnerStatus: ParticipantStatus.DISPUTED,
        disputeDeadline: 4000n,
      }),
      'observer', 4001,
    )
    expect(actions).toContain('finalize')
  })
})

describe('finalize — both terminal', () => {
  it('available when both SUCCESS', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        creatorStatus: ParticipantStatus.SUCCESS,
        partnerStatus: ParticipantStatus.SUCCESS,
      }),
      'observer', 500,
    )
    expect(actions).toContain('finalize')
  })
  it('available when one SUCCESS one FAILED', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        creatorStatus: ParticipantStatus.SUCCESS,
        partnerStatus: ParticipantStatus.FAILED,
      }),
      'observer', 500,
    )
    expect(actions).toContain('finalize')
  })
  it('available when one SUCCESS one UNRESOLVED', () => {
    const actions = getAvailableActions(
      baseVow({
        status: VowStatus.ACTIVE,
        creatorStatus: ParticipantStatus.SUCCESS,
        partnerStatus: ParticipantStatus.UNRESOLVED,
      }),
      'observer', 500,
    )
    expect(actions).toContain('finalize')
  })
})

describe('finalize — SETTLED', () => {
  it('not available when settled', () => {
    const actions = getAvailableActions(
      baseVow({ status: VowStatus.SETTLED }),
      'observer', 9999,
    )
    expect(actions).not.toContain('finalize')
  })
})

describe('claim', () => {
  it('available when claimable > 0', () => {
    const actions = getAvailableActions(baseVow(), 'creator', 500, 1000000000000000000n)
    expect(actions).toContain('claim')
  })
  it('not available when claimable is 0', () => {
    const actions = getAvailableActions(baseVow(), 'creator', 500, 0n)
    expect(actions).not.toContain('claim')
  })
})
