import { ConnectWallet } from '@/components/ConnectWallet'
import { ContractStatus } from '@/components/ContractStatus'
import { VOW_ADDRESS, VOW_CHAIN } from '@/lib/contract'

export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">VOW</span>
          <ConnectWallet />
        </div>
      </header>

      {/* Hero */}
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
      </section>

      {/* Contract read */}
      <section className="mx-auto max-w-[760px] px-6 pb-20">
        <ContractStatus />
        <p className="mt-4 text-xs text-zinc-600 text-center">
          Contract: {VOW_ADDRESS.slice(0, 6)}...{VOW_ADDRESS.slice(-4)} · Chain {VOW_CHAIN.id}
        </p>
      </section>
    </main>
  )
}
