import Link from 'next/link'
import { VOW_ADDRESS, VOW_CHAIN } from '@/lib/contract'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0e0e0e]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[-0.04em] text-white">VOW</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
            Trust is good. Collateral is better. Reciprocal commitments with equal BOT
            collateral, settled by fixed contract rules.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {/* ponytail: plain label, not an eyebrow. The eyebrow ceiling is
              ceil(sections / 3) and the landing page already sits at it, so
              footer column labels must not carry the amber mono uppercase
              treatment. */}
          <p className="text-xs font-medium text-zinc-400">Network</p>
          <a
            href="https://botchain.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-300 transition hover:text-amber-300"
          >
            Built on BOT Chain <span aria-hidden="true">↗</span>
          </a>
          <a
            href={VOW_CHAIN.blockExplorers.default.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-300 transition hover:text-amber-300"
          >
            {VOW_CHAIN.blockExplorers.default.name} <span aria-hidden="true">↗</span>
          </a>
          <a
            href={`${VOW_CHAIN.blockExplorers.default.url}/address/${VOW_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-300 transition hover:text-amber-300"
          >
            VOW contract <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-zinc-400">App</p>
          <Link href="/create" className="text-sm text-zinc-300 transition hover:text-amber-300">
            Create a Vow
          </Link>
          <Link href="/my-vows" className="text-sm text-zinc-300 transition hover:text-amber-300">
            My Vows
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1200px] px-5 py-5 font-mono text-xs text-zinc-400 sm:px-8">
          {VOW_CHAIN.name} <span aria-hidden="true">|</span> Chain {VOW_CHAIN.id}{' '}
          <span aria-hidden="true">|</span> {VOW_ADDRESS.slice(0, 6)}...{VOW_ADDRESS.slice(-4)}
        </p>
      </div>
    </footer>
  )
}
