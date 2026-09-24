import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Regression guard: the app must not hardcode a specific chain. One env var
// (NEXT_PUBLIC_VOW_CHAIN) switches the whole frontend between Bohr testnet and
// BOT Chain mainnet. A hardcoded chain id or network name means a judge
// connecting a wallet on mainnet gets told they are on the wrong network.
//
// If this test fails, the fix is to import VOW_CHAIN from '@/lib/contract' and
// read .id / .name off it instead of writing the literal.

const SRC = join(__dirname, '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return full
  })
}

const sourceFiles = walk(SRC).filter(
  (f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'),
)

describe('no hardcoded chain assumptions outside lib/chain.ts', () => {
  it('finds source files to scan', () => {
    expect(sourceFiles.length).toBeGreaterThan(10)
  })

  it('no source file other than lib/chain.ts hardcodes a chain id literal', () => {
    // 968 = Bohr testnet, 677 = BOT Chain mainnet
    const offenders = sourceFiles.filter((f) => {
      if (f.endsWith(join('lib', 'chain.ts'))) return false
      const body = readFileSync(f, 'utf8')
      return /\b(968|677)\b/.test(body.replace(/\/\/.*$/gm, ''))
    })
    expect(offenders).toEqual([])
  })

  it('no user-facing string names a specific network', () => {
    const offenders = sourceFiles
      .filter((f) => !f.endsWith(join('lib', 'chain.ts')))
      .filter((f) => /Bohr Testnet|BOT Chain Mainnet/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('ConnectWallet derives the wrong-network guard from VOW_CHAIN', () => {
    const body = readFileSync(join(SRC, 'components', 'ConnectWallet.tsx'), 'utf8')
    expect(body).toContain("chain?.id !== VOW_CHAIN.id")
    expect(body).not.toContain('bohrTestnet')
  })
})
