import { type Address, isAddress, parseEther } from 'viem'

export type CreateVowForm = {
  partner: string
  arbiter: string
  creatorPromise: string
  partnerPromise: string
  stake: string
  acceptDeadline: string
  deliveryDeadline: string
  reviewDeadline: string
  disputeDeadline: string
}

export type CreateVowErrors = Partial<Record<keyof CreateVowForm | '_chain' | '_submit', string>>

function toTs(dateStr: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000)
}

export function validateCreateVow(
  form: CreateVowForm,
  connectedAddress: Address | undefined,
  chainTime: number | null,
): CreateVowErrors {
  const errors: CreateVowErrors = {}

  // Partner
  if (!form.partner.trim()) {
    errors.partner = 'Partner address is required'
  } else if (!isAddress(form.partner.trim())) {
    errors.partner = 'Invalid address'
  } else if (form.partner.trim().toLowerCase() === '0x0000000000000000000000000000000000000000') {
    errors.partner = 'Cannot be zero address'
  } else if (connectedAddress && form.partner.trim().toLowerCase() === connectedAddress.toLowerCase()) {
    errors.partner = 'Cannot be your own address'
  }

  // Arbiter
  const arb = form.arbiter.trim()
  if (arb) {
    if (!isAddress(arb)) {
      errors.arbiter = 'Invalid address'
    } else if (arb.toLowerCase() === (connectedAddress ?? '').toLowerCase()) {
      errors.arbiter = 'Arbiter cannot be creator'
    } else if (arb.toLowerCase() === form.partner.trim().toLowerCase()) {
      errors.arbiter = 'Arbiter cannot be partner'
    }
  }

  // Promises
  if (!form.creatorPromise.trim()) {
    errors.creatorPromise = 'Your promise is required'
  }
  if (!form.partnerPromise.trim()) {
    errors.partnerPromise = "Partner's promise is required"
  }

  // Stake
  if (!form.stake.trim()) {
    errors.stake = 'Stake is required'
  } else {
    try {
      const val = parseEther(form.stake.trim())
      if (val <= 0n) errors.stake = 'Stake must be greater than zero'
    } catch {
      errors.stake = 'Invalid stake amount'
    }
  }

  // Deadlines
  const acceptTs = toTs(form.acceptDeadline)
  const deliveryTs = toTs(form.deliveryDeadline)
  const reviewTs = toTs(form.reviewDeadline)
  const disputeTs = toTs(form.disputeDeadline)

  if (acceptTs === null) errors.acceptDeadline = 'Required'
  if (deliveryTs === null) errors.deliveryDeadline = 'Required'
  if (reviewTs === null) errors.reviewDeadline = 'Required'
  if (disputeTs === null) errors.disputeDeadline = 'Required'

  // Chain time check: acceptDeadline must be > now (contract uses strictly greater)
  if (acceptTs !== null && chainTime !== null && acceptTs <= chainTime) {
    errors.acceptDeadline = 'Must be in the future (after current block time)'
  }

  // Strict ordering: accept < delivery < review < dispute
  if (acceptTs !== null && deliveryTs !== null && acceptTs >= deliveryTs) {
    errors.deliveryDeadline = 'Must be after Accept Deadline'
  }
  if (deliveryTs !== null && reviewTs !== null && deliveryTs >= reviewTs) {
    errors.reviewDeadline = 'Must be after Delivery Deadline'
  }
  if (reviewTs !== null && disputeTs !== null && reviewTs >= disputeTs) {
    errors.disputeDeadline = 'Must be after Review Deadline'
  }

  // Chain time required
  if (chainTime === null) {
    errors._chain = 'Cannot verify deadlines without network time'
  }

  return errors
}

export function hasErrors(errors: CreateVowErrors): boolean {
  return Object.keys(errors).length > 0
}

export function stakeToWei(stake: string): bigint {
  return parseEther(stake.trim())
}
