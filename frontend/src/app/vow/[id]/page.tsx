'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { ConnectWallet } from '@/components/ConnectWallet'
import { VowDetail } from '@/components/VowDetail'
import { VOW_CHAIN } from '@/lib/contract'

export default function VowPage() {
  const params = useParams()
  const raw = params?.id as string | undefined

  const vowId = useMemo(() => {
    if (!raw) return null
    const n = BigInt(raw)
    return n >= 0n ? n : null
  }, [raw])

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
            <ConnectWallet />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[760px] px-6 py-10">
        {vowId === null ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-sm text-zinc-400">Invalid VOW ID: {raw ?? '(missing)'}</p>
          </div>
        ) : (
          <VowDetail vowId={vowId} />
        )}
      </section>
    </main>
  )
}
