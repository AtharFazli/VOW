import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-[760px] flex-col items-start px-6 py-24">
        <p className="font-mono text-5xl font-semibold tracking-[-0.04em] text-amber-300 sm:text-6xl">
          404
        </p>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
          This page does not exist.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
          The link may be wrong, or the page may have moved. Your vows are
          unaffected — they live on-chain.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-amber-400 px-5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-[#17120a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          >
            Back to home
          </Link>
          <Link
            href="/my-vows"
            className="text-sm text-zinc-300 transition hover:text-amber-300"
          >
            My Vows
          </Link>
        </div>
      </section>
    </main>
  )
}
