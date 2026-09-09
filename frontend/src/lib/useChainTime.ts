'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { VOW_CHAIN } from '@/lib/contract'

// ponytail: chain timestamp for protocol eligibility; polls every 12s (roughly Bohr block time)
export function useChainTime(): { timestamp: number | null; loading: boolean } {
  const publicClient = usePublicClient({ chainId: VOW_CHAIN.id })
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicClient) return

    let active = true

    async function fetch() {
      try {
        const block = await publicClient!.getBlock()
        if (active) {
          setTimestamp(Number(block.timestamp))
          setLoading(false)
        }
      } catch {
        // ponytail: fail closed — null timestamp means "don't show write actions"
        if (active) setLoading(false)
      }
    }

    fetch()
    const id = setInterval(fetch, 12_000)
    return () => { active = false; clearInterval(id) }
  }, [publicClient])

  return { timestamp, loading }
}
