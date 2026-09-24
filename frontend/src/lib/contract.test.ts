import { describe, it, expect, vi, afterEach } from 'vitest'

// contract.ts reads NEXT_PUBLIC_* at module load, so each case needs a fresh import.
async function loadContract(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('./contract')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('contract config defaults', () => {
  it('falls back to Bohr testnet with no env set', async () => {
    const { VOW_CHAIN, VOW_ADDRESS, FAILURE_SINK } = await loadContract()
    expect(VOW_CHAIN.id).toBe(968)
    expect(VOW_ADDRESS).toBe('0x9539263f4861812B08C37Bb3cB6603c771d6530b')
    expect(FAILURE_SINK).toBe('0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B')
  })
})

describe('mainnet switch', () => {
  const MAINNET_ADDR = '0x1111111111111111111111111111111111111111'
  const MAINNET_SINK = '0x2222222222222222222222222222222222222222'

  it('uses chain 677 and the env addresses when fully configured', async () => {
    const { VOW_CHAIN, VOW_ADDRESS, FAILURE_SINK } = await loadContract({
      NEXT_PUBLIC_VOW_CHAIN: 'mainnet',
      NEXT_PUBLIC_VOW_ADDRESS: MAINNET_ADDR,
      NEXT_PUBLIC_FAILURE_SINK: MAINNET_SINK,
    })
    expect(VOW_CHAIN.id).toBe(677)
    expect(VOW_CHAIN.blockExplorers.default.url).toBe('https://scan.botchain.ai')
    expect(VOW_ADDRESS).toBe(MAINNET_ADDR)
    expect(FAILURE_SINK).toBe(MAINNET_SINK)
  })

  it('stays on testnet when the chain is set but no contract address exists', async () => {
    const { VOW_CHAIN, VOW_ADDRESS } = await loadContract({ NEXT_PUBLIC_VOW_CHAIN: 'mainnet' })
    expect(VOW_CHAIN.id).toBe(968)
    expect(VOW_ADDRESS).toBe('0x9539263f4861812B08C37Bb3cB6603c771d6530b')
  })

  it('keeps testnet when the chain is not explicitly mainnet', async () => {
    const { VOW_CHAIN, VOW_ADDRESS } = await loadContract({ NEXT_PUBLIC_VOW_ADDRESS: MAINNET_ADDR })
    expect(VOW_CHAIN.id).toBe(968)
    expect(VOW_ADDRESS).toBe(MAINNET_ADDR)
  })
})
