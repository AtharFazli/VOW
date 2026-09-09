'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { config } from '@/lib/config'
import { VOW_ADDRESS, VOW_ABI, VOW_CHAIN } from '@/lib/contract'
import { useChainTime } from '@/lib/useChainTime'
import { deriveRole, getAvailableActions } from '@/lib/vow'
import { tupleToVowData, groupVows, type VowCard } from '@/lib/myVows'
import { MyVowCard } from '@/components/MyVowCard'

export default function MyVowsPage() {
  const { address, isConnected, chain } = useAccount()
  const { timestamp: chainTime } = useChainTime()
  const [cards, setCards] = useState<VowCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const wrongChain = isConnected && chain?.id !== VOW_CHAIN.id

  useEffect(() => {
    if (!isConnected || wrongChain || !address) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Step 1: get user's VOW IDs
        const ids = (await readContract(config, {
          address: VOW_ADDRESS,
          abi: VOW_ABI,
          functionName: 'getUserVowIds',
          args: [address!],
          chainId: VOW_CHAIN.id,
        })) as bigint[]

        if (cancelled) return
        if (ids.length === 0) {
          setCards([])
          setLoading(false)
          return
        }

        // Step 2: read each vow
        const parsed: VowCard[] = []
        for (const id of ids) {
          try {
            const result = await readContract(config, {
              address: VOW_ADDRESS,
              abi: VOW_ABI,
              functionName: 'vows',
              args: [id],
              chainId: VOW_CHAIN.id,
            })
            if (cancelled) return
            if (Array.isArray(result)) {
              const vow = tupleToVowData(result)
              const role = deriveRole(vow, address!)
              parsed.push({ id, vow, role })
            }
          } catch {
            // skip unreadable vow
          }
        }

        // Sort: highest ID first
        parsed.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0))
        setCards(parsed)
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (!cancelled) setError(e.message ?? 'Failed to load VOWs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [isConnected, wrongChain, address])

  // Compute actions map for grouping
  const actionsMap = useMemo(() => {
    const map = new Map<string, string[]>()
    const now = chainTime ?? 0
    for (const card of cards) {
      const actions = getAvailableActions(card.vow, card.role, now)
      map.set(card.id.toString(), actions)
    }
    return map
  }, [cards, chainTime])

  const groups = useMemo(() => groupVows(cards, actionsMap), [cards, actionsMap])

  return (
    <main className="flex-1">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:text-zinc-300 transition">
            VOW
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              {VOW_CHAIN.name}
            </span>
            <Link href="/create" className="text-sm text-amber-500 hover:text-amber-400 transition">
              + Create
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[760px] px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-6">My Vows</h1>

        {!isConnected ? (
          <p className="text-sm text-zinc-500">Connect wallet to see your vows.</p>
        ) : wrongChain ? (
          <p className="text-sm text-amber-400">Switch to Bohr Testnet to view your vows.</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">No vows yet.</p>
            <Link
              href="/create"
              className="inline-block rounded-[10px] bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Create a Vow
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.cards.map((card) => (
                    <MyVowCard
                      key={card.id.toString()}
                      id={card.id}
                      vow={card.vow}
                      address={address!}
                      actions={actionsMap.get(card.id.toString()) ?? []}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
