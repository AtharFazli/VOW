'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { parseEventLogs } from 'viem'
import { simulateContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { config } from '@/lib/config'
import { VOW_ADDRESS, VOW_ABI, VOW_CHAIN } from '@/lib/contract'
import { useChainTime } from '@/lib/useChainTime'
import { type CreateVowForm, validateCreateVow, hasErrors, stakeToWei } from '@/lib/createVow'

type Phase = 'idle' | 'validating' | 'wallet' | 'submitted' | 'confirming' | 'confirmed' | 'error'

const INITIAL: CreateVowForm = {
  partner: '',
  arbiter: '',
  creatorPromise: '',
  partnerPromise: '',
  stake: '',
  acceptDeadline: '',
  deliveryDeadline: '',
  reviewDeadline: '',
  disputeDeadline: '',
}

function Input({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        {...props}
        className={`w-full rounded-lg border bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 ${
          error ? 'border-red-600' : 'border-zinc-700'
        } ${props.className ?? ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function CreateVowForm() {
  const router = useRouter()
  const { address, isConnected, chain } = useAccount()
  const { timestamp: chainTime } = useChainTime()

  const [form, setForm] = useState<CreateVowForm>(INITIAL)
  const [phase, setPhase] = useState<Phase>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errors, setErrors] = useState<ReturnType<typeof validateCreateVow>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const wrongChain = isConnected && chain?.id !== VOW_CHAIN.id

  const canSubmit = useMemo(() => {
    return isConnected && !wrongChain && chainTime !== null && phase === 'idle'
  }, [isConnected, wrongChain, chainTime, phase])

  function set<K extends keyof CreateVowForm>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !address) return

    setPhase('validating')
    setServerError(null)

    const errs = validateCreateVow(form, address, chainTime)
    setErrors(errs)
    if (hasErrors(errs)) { setPhase('idle'); return }

    try {
      setPhase('wallet')

      const stake = stakeToWei(form.stake)
      const arbiter = form.arbiter.trim() || '0x0000000000000000000000000000000000000000'
      const acceptTs = Math.floor(new Date(form.acceptDeadline).getTime() / 1000)
      const deliveryTs = Math.floor(new Date(form.deliveryDeadline).getTime() / 1000)
      const reviewTs = Math.floor(new Date(form.reviewDeadline).getTime() / 1000)
      const disputeTs = Math.floor(new Date(form.disputeDeadline).getTime() / 1000)

      // Simulate first
      const sim = await simulateContract(config, {
        abi: VOW_ABI,
        address: VOW_ADDRESS,
        functionName: 'createVow',
        args: [
          form.partner.trim() as `0x${string}`,
          arbiter as `0x${string}`,
          form.creatorPromise.trim(),
          form.partnerPromise.trim(),
          BigInt(acceptTs),
          BigInt(deliveryTs),
          BigInt(reviewTs),
          BigInt(disputeTs),
        ],
        value: stake,
        account: address,
        chainId: VOW_CHAIN.id,
      })

      // Write
      const hash = await writeContract(config, sim.request)
      setTxHash(hash)
      setPhase('submitted')

      // Wait for receipt
      setPhase('confirming')
      const receipt = await waitForTransactionReceipt(config, { hash, chainId: VOW_CHAIN.id })

      // Extract VowCreated event
      const vowCreatedAbi = VOW_ABI.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.type === 'event' && a.name === 'VowCreated',
      )
      if (!vowCreatedAbi) throw new Error('VowCreated ABI not found')

      const logs = parseEventLogs({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abi: [vowCreatedAbi as any],
        logs: receipt.logs,
        eventName: 'VowCreated',
      })

      if (logs.length === 0) throw new Error('VowCreated event not found in receipt')

      const createdId = (logs[0].args as { vowId: bigint }).vowId
      setPhase('confirmed')

      // Redirect after brief pause
      setTimeout(() => router.push(`/vow/${createdId.toString()}`), 1500)
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; shortMessage?: string }
      setPhase('error')
      if (e.name === 'UserRejectedRequestError') {
        setServerError('Transaction rejected by wallet')
      } else if (e.message?.includes('simulation')) {
        setServerError('Transaction would revert: ' + (e.shortMessage ?? e.message))
      } else {
        setServerError(e.shortMessage ?? e.message ?? 'Transaction failed')
      }
    }
  }

  if (phase === 'confirmed') {
    return (
      <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-400">VOW Created</p>
        {txHash && (
          <a
            href={`${VOW_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-emerald-500 hover:text-emerald-400 transition"
          >
            View transaction ↗
          </a>
        )}
        <p className="mt-2 text-xs text-zinc-400">Redirecting to VOW detail…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{serverError}</p>
        </div>
      )}

      {errors._chain && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-4">
          <p className="text-sm text-amber-400">{errors._chain}</p>
        </div>
      )}

      {/* Counterparty */}
      <section>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Counterparty</h3>
        <Input
          label="Partner Wallet"
          placeholder="0x..."
          value={form.partner}
          onChange={(e) => set('partner', e.target.value)}
          error={errors.partner}
          disabled={!canSubmit}
        />
      </section>

      {/* Promises */}
      <section>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Promises</h3>
        <div className="space-y-3">
          <Input
            label="Your Promise"
            placeholder="What you commit to doing"
            value={form.creatorPromise}
            onChange={(e) => set('creatorPromise', e.target.value)}
            error={errors.creatorPromise}
            disabled={!canSubmit}
          />
          <Input
            label="Partner's Promise"
            placeholder="What they commit to doing"
            value={form.partnerPromise}
            onChange={(e) => set('partnerPromise', e.target.value)}
            error={errors.partnerPromise}
            disabled={!canSubmit}
          />
        </div>
      </section>

      {/* Collateral */}
      <section>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Collateral</h3>
        <Input
          label="Stake (BOT)"
          placeholder="0.01"
          type="text"
          inputMode="decimal"
          value={form.stake}
          onChange={(e) => set('stake', e.target.value)}
          error={errors.stake}
          disabled={!canSubmit}
        />
      </section>

      {/* Timeline */}
      <section>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Timeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Accept Deadline"
            type="datetime-local"
            value={form.acceptDeadline}
            onChange={(e) => set('acceptDeadline', e.target.value)}
            error={errors.acceptDeadline}
            disabled={!canSubmit}
          />
          <Input
            label="Delivery Deadline"
            type="datetime-local"
            value={form.deliveryDeadline}
            onChange={(e) => set('deliveryDeadline', e.target.value)}
            error={errors.deliveryDeadline}
            disabled={!canSubmit}
          />
          <Input
            label="Review Deadline"
            type="datetime-local"
            value={form.reviewDeadline}
            onChange={(e) => set('reviewDeadline', e.target.value)}
            error={errors.reviewDeadline}
            disabled={!canSubmit}
          />
          <Input
            label="Dispute Deadline"
            type="datetime-local"
            value={form.disputeDeadline}
            onChange={(e) => set('disputeDeadline', e.target.value)}
            error={errors.disputeDeadline}
            disabled={!canSubmit}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Accept &lt; Delivery &lt; Review &lt; Dispute. Must be in the future.
        </p>
      </section>

      {/* Arbiter */}
      <section>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Optional Safeguard</h3>
        <Input
          label="Arbiter (optional)"
          placeholder="0x... or leave empty"
          value={form.arbiter}
          onChange={(e) => set('arbiter', e.target.value)}
          error={errors.arbiter}
          disabled={!canSubmit}
        />
      </section>

      {/* Submit */}
      <div className="pt-2">
        {!isConnected ? (
          <p className="text-sm text-zinc-400 text-center">Connect wallet to create a VOW</p>
        ) : wrongChain ? (
          <p className="text-sm text-amber-400 text-center">Switch to {VOW_CHAIN.name} to create a VOW</p>
        ) : phase === 'validating' ? (
          <p className="text-sm text-zinc-400 text-center">Validating…</p>
        ) : phase === 'wallet' ? (
          <p className="text-sm text-zinc-400 text-center">Waiting for wallet confirmation…</p>
        ) : phase === 'submitted' || phase === 'confirming' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-xs space-y-2" aria-busy="true" aria-label="Submitting transaction">
              <div className="h-11 animate-pulse rounded-[10px] bg-zinc-800" />
              <div className="mx-auto h-3 w-40 animate-pulse rounded bg-zinc-800" />
            </div>
            {txHash && (
              <a
                href={`${VOW_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-300 transition"
              >
                Transaction submitted ↗
              </a>
            )}
          </div>
        ) : phase === 'error' ? (
          <button
            type="submit"
            className="w-full rounded-[10px] bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Retry Create Vow
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-[10px] bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            Create Vow
          </button>
        )}
      </div>
    </form>
  )
}
