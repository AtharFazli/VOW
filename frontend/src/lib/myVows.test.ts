import { describe, it, expect } from 'vitest'
import { type Address } from 'viem'
import { type VowData, VowStatus, ParticipantStatus } from './types'
import { tupleToVowData, groupVows, type VowCard } from './myVows'
import { deriveRole, getAvailableActions } from './vow'

const CREATOR = '0x1111111111111111111111111111111111111111' as Address
const PARTNER = '0x2222222222222222222222222222222222222222' as Address
const OBSERVER = '0x4444444444444444444444444444444444444444' as Address
const ZERO = '0x0000000000000000000000000000000000000000' as Address

function makeVow(overrides: Partial<VowData> = {}): VowData {
  return {
    creator: CREATOR,
    partner: PARTNER,
    arbiter: ZERO,
    stake: 10000000000000000n,
    acceptDeadline: 1789110115n,
    deliveryDeadline: 1789282915n,
    reviewDeadline: 1789369315n,
    disputeDeadline: 1789455715n,
    creatorPromise: 'creator promise',
    partnerPromise: 'partner promise',
    creatorProofURI: '',
    partnerProofURI: '',
    creatorProofHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partnerProofHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    creatorDisputeReason: '',
    partnerDisputeReason: '',
    creatorStatus: ParticipantStatus.PENDING,
    partnerStatus: ParticipantStatus.PENDING,
    status: VowStatus.PROPOSED,
    ...overrides,
  }
}

function makeCard(id: bigint, vow: VowData, role: 'creator' | 'partner' | 'observer'): VowCard {
  return { id, vow, role }
}

describe('tupleToVowData', () => {
  it('parses a full tuple correctly', () => {
    const t = [
      CREATOR, PARTNER, ZERO,
      10000000000000000n,
      1789110115n, 1789282915n, 1789369315n, 1789455715n,
      'creator promise', 'partner promise',
      '', '',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '', '',
      0, 0, 0,
    ]
    const v = tupleToVowData(t)
    expect(v.creator).toBe(CREATOR)
    expect(v.partner).toBe(PARTNER)
    expect(v.status).toBe(VowStatus.PROPOSED)
    expect(v.creatorStatus).toBe(ParticipantStatus.PENDING)
  })
})

describe('groupVows', () => {
  it('groups PROPOSED with accept action into Needs Action', () => {
    const vow = makeVow()
    const card = makeCard(0n, vow, 'partner')
    const actionsMap = new Map([['0', ['accept']]])
    const groups = groupVows([card], actionsMap)
    const needsAction = groups.find((g) => g.label === 'Needs Action')
    expect(needsAction).toBeDefined()
    expect(needsAction!.cards).toHaveLength(1)
  })

  it('groups ACTIVE with no action into Active', () => {
    const vow = makeVow({ status: VowStatus.ACTIVE })
    const card = makeCard(0n, vow, 'creator')
    const actionsMap = new Map([['0', []]])
    const groups = groupVows([card], actionsMap)
    const active = groups.find((g) => g.label === 'Active')
    expect(active).toBeDefined()
    expect(active!.cards).toHaveLength(1)
  })

  it('groups SETTLED into Completed', () => {
    const vow = makeVow({ status: VowStatus.SETTLED })
    const card = makeCard(0n, vow, 'creator')
    const actionsMap = new Map([['0', []]])
    const groups = groupVows([card], actionsMap)
    const completed = groups.find((g) => g.label === 'Completed')
    expect(completed).toBeDefined()
    expect(completed!.cards).toHaveLength(1)
  })

  it('observer with finalize does NOT go to Needs Action', () => {
    const vow = makeVow({ status: VowStatus.ACTIVE })
    const card = makeCard(0n, vow, 'observer')
    const actionsMap = new Map([['0', ['finalize']]])
    const groups = groupVows([card], actionsMap)
    const needsAction = groups.find((g) => g.label === 'Needs Action')
    expect(needsAction).toBeUndefined()
    const active = groups.find((g) => g.label === 'Active')
    expect(active).toBeDefined()
  })

  it('participant with finalize goes to Needs Action', () => {
    const vow = makeVow({ status: VowStatus.ACTIVE })
    const card = makeCard(0n, vow, 'creator')
    const actionsMap = new Map([['0', ['finalize']]])
    const groups = groupVows([card], actionsMap)
    const needsAction = groups.find((g) => g.label === 'Needs Action')
    expect(needsAction).toBeDefined()
  })

  it('no groups when cards empty', () => {
    const groups = groupVows([], new Map())
    expect(groups).toHaveLength(0)
  })
})

describe('My Vows + action engine integration', () => {
  it('creator of PROPOSED vow: no accept, no Needs Action', () => {
    const vow = makeVow()
    const role = deriveRole(vow, CREATOR)
    expect(role).toBe('creator')
    const now = Number(vow.acceptDeadline / 2n) // well before deadline
    const actions = getAvailableActions(vow, role, now)
    expect(actions).not.toContain('accept')
    // Finalize not ready (accept deadline not passed)
    expect(actions).not.toContain('finalize')
  })

  it('partner of PROPOSED vow: accept available before deadline', () => {
    const vow = makeVow()
    const role = deriveRole(vow, PARTNER)
    expect(role).toBe('partner')
    const now = Number(vow.acceptDeadline) - 1000
    const actions = getAvailableActions(vow, role, now)
    expect(actions).toContain('accept')
  })

  it('partner of PROPOSED vow: accept not available after deadline', () => {
    const vow = makeVow()
    const role = deriveRole(vow, PARTNER)
    const now = Number(vow.acceptDeadline) + 1
    const actions = getAvailableActions(vow, role, now)
    expect(actions).not.toContain('accept')
  })

  it('observer: no actions', () => {
    const vow = makeVow()
    const role = deriveRole(vow, OBSERVER)
    expect(role).toBe('observer')
    const actions = getAvailableActions(vow, role, Number(vow.acceptDeadline) - 1000)
    expect(actions).toHaveLength(0)
  })
})
