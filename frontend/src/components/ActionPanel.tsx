'use client'

import { useState } from 'react'
import { type Address } from 'viem'
import { VOW_CHAIN } from '@/lib/contract'
import { isTxPending, useVowWrite, proofHashFromUri, type TxPhase } from '@/lib/useVowWrite'
import { buildVowWriteRequest } from '@/lib/vowActions'
import { type VowData, type VowRole } from '@/lib/types'
import { getAvailableActions, formatStake } from '@/lib/vow'

function TxStatus({ phase, txHash, error, explorerUrl }: {
  phase: TxPhase; txHash: string | null; error: string | null; explorerUrl: string | null
}) {
  if (phase === 'idle' && !error) return null
  if (phase === 'confirmed') {
    return (
      <div className="mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3">
        <p className="text-sm text-emerald-400">Confirmed</p>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-emerald-500 hover:text-emerald-400 transition">
            View on explorer ↗
          </a>
        )}
      </div>
    )
  }
  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-red-800/50 bg-red-950/30 p-3">
        <p className="text-sm text-red-400">{error}</p>
        {txHash && <a href={`${VOW_CHAIN.blockExplorers.default.url}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-red-500 hover:text-red-400">View transaction ↗</a>}
      </div>
    )
  }
  return (
    <div className="mt-3 flex items-center gap-2" aria-busy="true">
      <div className="h-3 w-40 animate-pulse rounded bg-zinc-800" />
      <span className="text-xs text-zinc-400">
        {phase === 'simulating' && 'Simulating…'}
        {phase === 'wallet' && 'Waiting for wallet…'}
        {phase === 'submitted' && 'Submitted. Waiting for confirmation…'}
        {phase === 'confirming' && 'Confirming…'}
      </span>
      {txHash && <a href={`${VOW_CHAIN.blockExplorers.default.url}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-300 transition">↗</a>}
    </div>
  )
}

function ActionButton({ label, onClick, disabled, loading }: {
  label: string; onClick: () => void; disabled?: boolean; loading?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className="rounded-[10px] bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50">
      {label}
    </button>
  )
}

export function ActionPanel({
  vow, vowId, role, address, claimable, chainTime, chainId,
}: {
  vow: VowData; vowId: bigint; role: VowRole; address: Address; claimable: bigint
  chainTime: number | null; chainId: number | undefined
}) {
  const accept = useVowWrite()
  const submitProof = useVowWrite()
  const approve = useVowWrite()
  const finalize = useVowWrite()
  const withdraw = useVowWrite()
  const [proofUri, setProofUri] = useState('')

  // Canonical eligibility. Null chain time fails closed in getAvailableActions callers.
  const available = chainTime === null || chainId !== VOW_CHAIN.id
    ? []
    : getAvailableActions(vow, role, chainTime, claimable)
  const has = (action: 'accept' | 'submitProof' | 'approve' | 'finalize' | 'claim') => available.includes(action)
  const busy = [accept, submitProof, approve, finalize, withdraw].some(w => isTxPending(w.phase))
  const networkReady = chainId === VOW_CHAIN.id

  async function execute(action: 'accept' | 'submitProof' | 'approve' | 'finalize' | 'withdraw', writer: ReturnType<typeof useVowWrite>, proof = '') {
    if (!networkReady || busy) return
    if (action !== 'withdraw' && !has(action)) return
    if (action === 'withdraw' && !has('claim')) return
    const request = buildVowWriteRequest(action, vow, vowId, role, proof)
    if (!request) return
    await writer.execute({ ...request, account: address })
  }

  const hasAction = available.length > 0

  if (!hasAction) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Actions</h2>
        <p className="text-sm text-zinc-400">No actions available for your wallet in current state.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Actions</h2>

      {has('accept') && <div>
        <p className="text-xs text-zinc-400 mb-2">Accept this VOW by locking {formatStake(vow.stake)} as your stake.</p>
        <ActionButton label="Accept VOW" onClick={() => execute('accept', accept)} loading={busy} />
        <TxStatus {...accept} />
      </div>}

      {has('submitProof') && <div>
        <p className="text-xs text-zinc-400 mb-2">Submit your proof of completion.</p>
        <input type="text" value={proofUri} onChange={e => setProofUri(e.target.value)} placeholder="Proof URI (e.g. https://…)" disabled={busy}
          className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500" />
        <ActionButton label="Submit Proof" onClick={() => execute('submitProof', submitProof, proofUri)} loading={busy} disabled={!proofUri.trim()} />
        <TxStatus {...submitProof} />
      </div>}

      {has('approve') && <div>
        <p className="text-xs text-zinc-400 mb-2">Approve counterparty&apos;s proof of completion.</p>
        <ActionButton label="Approve Proof" onClick={() => execute('approve', approve)} loading={busy} />
        <TxStatus {...approve} />
      </div>}

      {has('finalize') && <div>
        <p className="text-xs text-zinc-400 mb-2">Settle this VOW and distribute stakes.</p>
        <ActionButton label="Finalize VOW" onClick={() => execute('finalize', finalize)} loading={busy} />
        <TxStatus {...finalize} />
      </div>}

      {has('claim') && <div>
        <p className="text-xs text-zinc-400 mb-2">Withdraw your claimable {formatStake(claimable)}.</p>
        <ActionButton label="Withdraw" onClick={() => execute('withdraw', withdraw)} loading={busy} />
        <TxStatus {...withdraw} />
      </div>}
    </section>
  )
}

export { proofHashFromUri }
