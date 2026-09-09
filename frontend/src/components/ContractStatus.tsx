'use client'

import { type Address } from 'viem'
import { useReadContract, useAccount } from 'wagmi'
import { VOW_ADDRESS, VOW_ABI, FAILURE_SINK, VOW_CHAIN } from '@/lib/contract'

export function ContractStatus() {
  const { isConnected, chain } = useAccount()
  const wrongChain = chain?.id !== VOW_CHAIN.id

  const { data: nextId, isLoading: loadingId, error: errorId } = useReadContract({
    abi: VOW_ABI,
    address: VOW_ADDRESS,
    functionName: 'nextVowId',
    chainId: VOW_CHAIN.id,
  })

  const { data: sink, isLoading: loadingSink, error: errorSink } = useReadContract({
    abi: VOW_ABI,
    address: VOW_ADDRESS,
    functionName: 'failureSink',
    chainId: VOW_CHAIN.id,
  })

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-500">Connect wallet to read contract state.</p>
      </div>
    )
  }

  if (wrongChain) {
    return (
      <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6">
        <p className="text-sm text-amber-400">Switch to Bohr Testnet to read contract.</p>
      </div>
    )
  }

  const sinkAddr = sink as Address | undefined
  const displaySink = sinkAddr ? `${sinkAddr.slice(0, 6)}...${sinkAddr.slice(-4)}` : '—'
  const sinkExact = sinkAddr === FAILURE_SINK

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Contract Status</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Total Vows Created</p>
          {loadingId ? (
            <div className="h-6 w-12 animate-pulse rounded bg-zinc-800" />
          ) : errorId ? (
            <p className="text-sm text-red-400">Read failed</p>
          ) : (
            <p className="text-2xl font-semibold text-white">{nextId?.toString() ?? '—'}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">Failure Sink</p>
          {loadingSink ? (
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-800" />
          ) : errorSink ? (
            <p className="text-sm text-red-400">Read failed</p>
          ) : (
            <div>
              <p className="text-sm font-mono text-zinc-300">{displaySink}</p>
              {sinkExact && (
                <p className="text-xs text-emerald-500 mt-1">✓ Verified</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <a
          href={`${VOW_CHAIN.blockExplorers.default.url}/address/${VOW_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          View on explorer ↗
        </a>
      </div>
    </div>
  )
}
