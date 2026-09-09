'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectWallet } from '@/components/ConnectWallet'
import { ContractStatus } from '@/components/ContractStatus'
import { VOW_ADDRESS, VOW_CHAIN } from '@/lib/contract'

export default function Home() {
  const router = useRouter()
  const [id, setId] = useState('')

  function go(e: React.FormEvent) {
    e.preventDefault()
    const n = id.trim()
    if (n && /^\d+$/.test(n)) router.push(`/vow/${n}`)
  }

  return (
    <main className="flex-1">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">VOW</span>
          <ConnectWallet />
        </div>
      </header>

      <section className="mx-auto max-w-[760px] px-6 pt-20 pb-16 text-center">
        <h1 className="text-[40px] sm:text-[56px] font-bold leading-tight tracking-tight">
          VOW
        </h1>
        <p className="mt-4 text-xl text-zinc-400">
          Trust is good.<br />
          Collateral is better.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          Put BOT behind promises you make to each other.
        </p>

        <form onSubmit={go} className="mt-8 flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="VOW ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-32 rounded-[10px] border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-[10px] bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            View
          </button>
        </form>

        <a
          href="/create"
          className="mt-4 inline-block text-sm text-amber-500 hover:text-amber-400 transition"
        >
          Create a Vow →
        </a>
        <span className="mx-2 text-zinc-700">·</span>
        <a
          href="/my-vows"
          className="inline-block text-sm text-zinc-500 hover:text-zinc-300 transition"
        >
          My Vows
        </a>
      </section>

      <section className="mx-auto max-w-[760px] px-6 pb-20">
        <ContractStatus />
        <p className="mt-4 text-xs text-zinc-600 text-center">
          Contract: {VOW_ADDRESS.slice(0, 6)}...{VOW_ADDRESS.slice(-4)} · Chain {VOW_CHAIN.id}
        </p>
      </section>
    </main>
  )
}
