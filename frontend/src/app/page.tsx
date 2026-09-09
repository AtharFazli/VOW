'use client'

import Link from 'next/link'
import { ConnectWallet } from '@/components/ConnectWallet'
import { ContractStatus } from '@/components/ContractStatus'
import { VOW_ADDRESS, VOW_CHAIN } from '@/lib/contract'

export const landingSteps = [
  {
    title: 'Promise',
    text: 'Two people define what each of them will deliver.',
  },
  {
    title: 'Lock',
    text: 'Both sides put equal BOT collateral behind the agreement.',
  },
  {
    title: 'Prove',
    text: 'Each participant submits evidence for the counterparty to review.',
  },
  {
    title: 'Settle',
    text: 'The smart contract applies fixed rules and makes funds claimable.',
  },
] as const

export default function Home() {
  return (
    <main className="flex-1 overflow-hidden">
      <header className="border-b border-white/10 bg-[#0a0a0a]/95">
        <div className="mx-auto flex min-h-18 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em] text-white transition hover:text-amber-300">
            VOW
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-3 sm:gap-6">
            <Link href="/my-vows" className="hidden text-sm text-zinc-400 transition hover:text-white sm:inline-block">
              My Vows
            </Link>
            <Link href="/create" className="hidden text-sm font-medium text-amber-400 transition hover:text-amber-300 sm:inline-block">
              Create a Vow
            </Link>
            <ConnectWallet />
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1200px] items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:gap-20 lg:py-20">
        <div className="max-w-xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.22em] text-amber-400">Collateralized promises</p>
          <h1 className="max-w-[10ch] text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl">
            Trust is good.
            <span className="mt-2 block text-zinc-500">Collateral is better.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-zinc-300">
            Put BOT behind promises you make to each other.
          </p>
          <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Link
              href="/create"
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-amber-400 px-6 text-sm font-semibold text-[#17120a] transition hover:bg-amber-300 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
            >
              CREATE A VOW
            </Link>
            <Link
              href="/my-vows"
              className="inline-flex min-h-11 items-center text-sm text-zinc-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
            >
              View my Vows <span aria-hidden="true" className="ml-2 text-amber-400">↗</span>
            </Link>
          </div>
          <p className="mt-8 max-w-md text-sm leading-6 text-zinc-500">
            Built for two people with something real at stake. Not a habit tracker. Not a marketplace.
          </p>
        </div>

        <div className="relative" aria-label="A reciprocal VOW between two participants">
          <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-5rem)] -translate-x-1/2 bg-amber-400/35" aria-hidden="true" />
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">You promise</p>
              <p className="mt-5 min-h-14 text-lg font-medium leading-7 text-white">Ship the frontend</p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs text-zinc-500">Collateral</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-300">0.01 BOT</p>
              </div>
            </div>

            <div className="z-[1] flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/60 bg-[#17120a] text-center shadow-[0_0_0_8px_#0a0a0a] sm:h-20 sm:w-20 sm:shadow-[0_0_0_12px_#0a0a0a]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">VOW</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">They promise</p>
              <p className="mt-5 min-h-14 text-lg font-medium leading-7 text-white">Deploy the contract</p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs text-zinc-500">Collateral</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-300">0.01 BOT</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
            Equal collateral. Fixed deadlines. A shared commitment.
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0e0e0e]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-400">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">One agreement. Four clear moves.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              Both sides commit, show their work, and review the other side. VOW keeps custody and settlement rules on-chain.
            </p>
          </div>
          <div className="mt-12 grid gap-0 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {landingSteps.map((step, index) => (
              <div key={step.title} className="border-b border-white/10 py-7 sm:px-6 sm:odd:border-r lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{step.title}</h3>
                  <span className="font-mono text-xs text-zinc-600" aria-hidden="true">0{index + 1}</span>
                </div>
                <p className="mt-4 max-w-[22ch] text-sm leading-6 text-zinc-400">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl">
            Rules stay fixed. Outcomes stay visible.
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="border-t border-amber-400/50 pt-5">
            <h3 className="text-lg font-medium text-white">What the contract guarantees</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Custody, authorization, deadlines, and deterministic settlement according to the agreement.</p>
          </div>
          <div className="border-t border-white/20 pt-5">
            <h3 className="text-lg font-medium text-white">What people still decide</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Counterparties review real-world proof. The chain stores the evidence reference and enforces the agreed result.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Ready to put something behind it?</h2>
            <p className="mt-3 text-sm text-zinc-500">Create a reciprocal commitment on BOT Chain.</p>
          </div>
          <Link
            href="/create"
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-amber-400 px-5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-[#17120a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          >
            CREATE A VOW
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 pb-12 sm:px-8">
        <ContractStatus />
        <p className="mt-4 text-center font-mono text-xs text-zinc-600">
          Contract {VOW_ADDRESS.slice(0, 6)}...{VOW_ADDRESS.slice(-4)} <span aria-hidden="true">|</span> Chain {VOW_CHAIN.id}
        </p>
      </section>
    </main>
  )
}
