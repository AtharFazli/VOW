'use client'

import Link from 'next/link'
import { ConnectWallet } from '@/components/ConnectWallet'
import { CreateVowForm } from '@/components/CreateVowForm'
import { VOW_CHAIN } from '@/lib/contract'

export default function CreatePage() {
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

      <section className="mx-auto max-w-[560px] px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Create a Vow</h1>
        <CreateVowForm />
      </section>
    </main>
  )
}
