import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'

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

// The production build reads .env.production (committed), and `next dev` reads
// .env.development (gitignored, local). Both files are plain config that no test
// otherwise exercises, so a typo in the mainnet target would only surface after
// deploy, with real BOT at stake.
describe('committed environment targets', () => {
  const envFile = (name: string) => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8')

  function readEnvFile(name: string): Record<string, string> {
    return Object.fromEntries(
      envFile(name)
        .split('\n')
        .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
        .map((line) => {
          const [key, ...rest] = line.split('=')
          return [key.trim(), rest.join('=').trim()]
        }),
    )
  }

  const MAINNET_VOW = '0x04e6db5BE9861fbEd3E7a4192A3444a7D0e07cb4'
  const MAINNET_SINK = '0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7'

  it('production build targets the source-verified mainnet deployment', () => {
    const env = readEnvFile('.env.production')
    expect(env.NEXT_PUBLIC_VOW_CHAIN).toBe('mainnet')
    expect(env.NEXT_PUBLIC_VOW_ADDRESS).toBe(MAINNET_VOW)
    expect(env.NEXT_PUBLIC_FAILURE_SINK).toBe(MAINNET_SINK)
  })

  it('the production env trio actually selects mainnet through contract.ts', async () => {
    const { VOW_CHAIN, VOW_ADDRESS, FAILURE_SINK } = await loadContract(readEnvFile('.env.production'))
    expect(VOW_CHAIN.id).toBe(677)
    expect(VOW_CHAIN.blockExplorers.default.url).toBe('https://scan.botchain.ai')
    expect(VOW_ADDRESS).toBe(MAINNET_VOW)
    expect(FAILURE_SINK).toBe(MAINNET_SINK)
  })

  it('keeps local development on testnet so dev wallets cannot lock real BOT', () => {
    const env = readEnvFile('.env.development')
    expect(env.NEXT_PUBLIC_VOW_CHAIN).toBe('testnet')
    expect(env.NEXT_PUBLIC_VOW_ADDRESS).toBe('0x9539263f4861812B08C37Bb3cB6603c771d6530b')
  })
})
