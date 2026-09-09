import { describe, it, expect } from 'vitest'
import { type Address } from 'viem'
import { validateCreateVow, hasErrors, stakeToWei, type CreateVowForm } from './createVow'

const CREATOR = '0x1111111111111111111111111111111111111111' as Address
const PARTNER = '0x2222222222222222222222222222222222222222' as Address
const ARBITER = '0x3333333333333333333333333333333333333333' as Address

function validForm(): CreateVowForm {
  return {
    partner: PARTNER,
    arbiter: '',
    creatorPromise: 'I will paint the wall',
    partnerPromise: 'I will pay 1 BOT',
    stake: '0.01',
    acceptDeadline: '2030-01-01T00:00',
    deliveryDeadline: '2030-01-02T00:00',
    reviewDeadline: '2030-01-03T00:00',
    disputeDeadline: '2030-01-04T00:00',
  }
}

describe('validateCreateVow — partner', () => {
  it('rejects empty partner', () => {
    const e = validateCreateVow({ ...validForm(), partner: '' }, CREATOR, 1000)
    expect(e.partner).toBeDefined()
  })
  it('rejects invalid address', () => {
    const e = validateCreateVow({ ...validForm(), partner: 'not-an-address' }, CREATOR, 1000)
    expect(e.partner).toBeDefined()
  })
  it('rejects zero address', () => {
    const e = validateCreateVow({ ...validForm(), partner: '0x0000000000000000000000000000000000000000' }, CREATOR, 1000)
    expect(e.partner).toBeDefined()
  })
  it('rejects creator address as partner', () => {
    const e = validateCreateVow({ ...validForm(), partner: CREATOR }, CREATOR, 1000)
    expect(e.partner).toBeDefined()
  })
  it('accepts valid partner', () => {
    const e = validateCreateVow(validForm(), CREATOR, 1000)
    expect(e.partner).toBeUndefined()
  })
})

describe('validateCreateVow — arbiter', () => {
  it('accepts empty arbiter', () => {
    const e = validateCreateVow(validForm(), CREATOR, 1000)
    expect(e.arbiter).toBeUndefined()
  })
  it('rejects creator as arbiter', () => {
    const e = validateCreateVow({ ...validForm(), arbiter: CREATOR }, CREATOR, 1000)
    expect(e.arbiter).toBeDefined()
  })
  it('rejects partner as arbiter', () => {
    const e = validateCreateVow({ ...validForm(), arbiter: PARTNER }, CREATOR, 1000)
    expect(e.arbiter).toBeDefined()
  })
  it('rejects invalid arbiter address', () => {
    const e = validateCreateVow({ ...validForm(), arbiter: 'bad' }, CREATOR, 1000)
    expect(e.arbiter).toBeDefined()
  })
  it('accepts valid arbiter', () => {
    const e = validateCreateVow({ ...validForm(), arbiter: ARBITER }, CREATOR, 1000)
    expect(e.arbiter).toBeUndefined()
  })
})

describe('validateCreateVow — promises', () => {
  it('rejects empty creator promise', () => {
    const e = validateCreateVow({ ...validForm(), creatorPromise: '' }, CREATOR, 1000)
    expect(e.creatorPromise).toBeDefined()
  })
  it('rejects whitespace-only creator promise', () => {
    const e = validateCreateVow({ ...validForm(), creatorPromise: '   ' }, CREATOR, 1000)
    expect(e.creatorPromise).toBeDefined()
  })
  it('rejects empty partner promise', () => {
    const e = validateCreateVow({ ...validForm(), partnerPromise: '' }, CREATOR, 1000)
    expect(e.partnerPromise).toBeDefined()
  })
  it('accepts valid promises', () => {
    const e = validateCreateVow(validForm(), CREATOR, 1000)
    expect(e.creatorPromise).toBeUndefined()
    expect(e.partnerPromise).toBeUndefined()
  })
})

describe('validateCreateVow — stake', () => {
  it('rejects empty stake', () => {
    const e = validateCreateVow({ ...validForm(), stake: '' }, CREATOR, 1000)
    expect(e.stake).toBeDefined()
  })
  it('rejects zero stake', () => {
    const e = validateCreateVow({ ...validForm(), stake: '0' }, CREATOR, 1000)
    expect(e.stake).toBeDefined()
  })
  it('rejects negative stake', () => {
    const e = validateCreateVow({ ...validForm(), stake: '-1' }, CREATOR, 1000)
    expect(e.stake).toBeDefined()
  })
  it('rejects non-numeric stake', () => {
    const e = validateCreateVow({ ...validForm(), stake: 'abc' }, CREATOR, 1000)
    expect(e.stake).toBeDefined()
  })
  it('accepts valid stake', () => {
    const e = validateCreateVow({ ...validForm(), stake: '0.01' }, CREATOR, 1000)
    expect(e.stake).toBeUndefined()
  })
})

describe('validateCreateVow — deadlines', () => {
  it('rejects accept deadline in the past', () => {
    const e = validateCreateVow({ ...validForm(), acceptDeadline: '2020-01-01T00:00' }, CREATOR, Math.floor(Date.now() / 1000))
    expect(e.acceptDeadline).toBeDefined()
  })
  it('rejects accept deadline equal to now', () => {
    const now = Math.floor(Date.now() / 1000)
    // Use a time string that corresponds to exactly now
    const d = new Date(now * 1000)
    const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const e = validateCreateVow({ ...validForm(), acceptDeadline: ts }, CREATOR, now)
    expect(e.acceptDeadline).toBeDefined()
  })
  it('rejects bad deadline ordering: accept >= delivery', () => {
    const e = validateCreateVow({
      ...validForm(),
      acceptDeadline: '2030-01-02T00:00',
      deliveryDeadline: '2030-01-01T00:00',
    }, CREATOR, 1000)
    expect(e.deliveryDeadline).toBeDefined()
  })
  it('rejects bad deadline ordering: delivery >= review', () => {
    const e = validateCreateVow({
      ...validForm(),
      deliveryDeadline: '2030-01-03T00:00',
      reviewDeadline: '2030-01-02T00:00',
    }, CREATOR, 1000)
    expect(e.reviewDeadline).toBeDefined()
  })
  it('rejects bad deadline ordering: review >= dispute', () => {
    const e = validateCreateVow({
      ...validForm(),
      reviewDeadline: '2030-01-04T00:00',
      disputeDeadline: '2030-01-03T00:00',
    }, CREATOR, 1000)
    expect(e.disputeDeadline).toBeDefined()
  })
  it('rejects when chain time unavailable', () => {
    const e = validateCreateVow(validForm(), CREATOR, null)
    expect(e._chain).toBeDefined()
  })
  it('accepts valid deadline ordering', () => {
    const e = validateCreateVow(validForm(), CREATOR, 1000)
    expect(e.acceptDeadline).toBeUndefined()
    expect(e.deliveryDeadline).toBeUndefined()
    expect(e.reviewDeadline).toBeUndefined()
    expect(e.disputeDeadline).toBeUndefined()
  })
})

describe('stakeToWei', () => {
  it('converts 0.01 BOT', () => {
    expect(stakeToWei('0.01')).toBe(10000000000000000n)
  })
  it('converts 1 BOT', () => {
    expect(stakeToWei('1')).toBe(1000000000000000000n)
  })
})

describe('hasErrors', () => {
  it('true when errors present', () => {
    expect(hasErrors({ partner: 'bad' })).toBe(true)
  })
  it('false when empty', () => {
    expect(hasErrors({})).toBe(false)
  })
})
