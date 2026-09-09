import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { landingSteps } from './page'

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('landing page', () => {
  it('communicates reciprocal collateral through the four lifecycle moves', () => {
    expect(landingSteps.map((step) => step.title)).toEqual(['Promise', 'Lock', 'Prove', 'Settle'])
    expect(landingSteps[1].text).toContain('Both sides put equal BOT collateral')
    expect(landingSteps[2].text).toContain('counterparty to review')
    expect(landingSteps[3].text).toContain('smart contract')
  })

  it('keeps primary navigation on the required routes', () => {
    expect(pageSource).toContain('href="/create"')
    expect(pageSource).toContain('href="/my-vows"')
  })

  it('states the honest trust boundary', () => {
    expect(pageSource).toContain('What the contract guarantees')
    expect(pageSource).toContain('What people still decide')
    expect(pageSource).not.toContain('trustless real-world verification')
  })
})
