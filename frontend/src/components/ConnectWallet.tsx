'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { VOW_CHAIN } from '@/lib/contract'

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const wrongChain = isConnected && chain?.id !== VOW_CHAIN.id
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {wrongChain ? (
          <button
            onClick={() => switchChain({ chainId: VOW_CHAIN.id })}
            disabled={isSwitching}
            className="rounded-[10px] bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {isSwitching ? 'Switching...' : `Switch to ${VOW_CHAIN.name}`}
          </button>
        ) : (
          <span className="rounded-full border border-emerald-700 bg-emerald-900/40 px-3 py-1 text-xs text-emerald-400">
            {chain?.name ?? 'Unknown'}
          </span>
        )}
        <button
          onClick={() => disconnect()}
          className="rounded-[10px] border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          {short}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        const c = connectors[0]
        if (c) connect({ connector: c })
      }}
      disabled={isConnecting}
      className="rounded-[10px] bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
