'use client'

import { useMemo, useState, useEffect } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { type Address } from 'viem'
import { VOW_ADDRESS, VOW_ABI, VOW_CHAIN } from '@/lib/contract'
import { type VowData, VowStatus, ParticipantStatus, VOW_STATUS_LABEL, PARTICIPANT_STATUS_LABEL } from '@/lib/types'
import { deriveRole, formatStake, formatDeadline, getAvailableActions, hasArbiter } from '@/lib/vow'

function shorten(addr: Address): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function proofDisplay(uri: string): { label: string; href: string | null } {
  if (!uri) return { label: '—', href: null }
  if (uri.startsWith('https://') || uri.startsWith('ipfs://')) {
    const href = uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri
    return { label: uri.length > 40 ? uri.slice(0, 37) + '...' : uri, href }
  }
  // ponytail: reject unsafe schemes, show as plain text
  return { label: uri, href: null }
}

function StatusBadge({ label, variant }: { label: string; variant: 'green' | 'amber' | 'red' | 'zinc' }) {
  const colors = {
    green: 'border-emerald-700 bg-emerald-900/40 text-emerald-400',
    amber: 'border-amber-700 bg-amber-900/40 text-amber-400',
    red: 'border-red-700 bg-red-900/40 text-red-400',
    zinc: 'border-zinc-700 bg-zinc-800 text-zinc-400',
  }
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors[variant]}`}>
      {label}
    </span>
  )
}

function vowStatusVariant(s: VowStatus) {
  if (s === VowStatus.PROPOSED) return 'amber' as const
  if (s === VowStatus.ACTIVE) return 'green' as const
  return 'zinc' as const
}

function participantVariant(s: ParticipantStatus) {
  if (s === ParticipantStatus.SUCCESS) return 'green' as const
  if (s === ParticipantStatus.FAILED || s === ParticipantStatus.UNRESOLVED) return 'red' as const
  if (s === ParticipantStatus.DISPUTED) return 'amber' as const
  if (s === ParticipantStatus.PROOF_SUBMITTED) return 'amber' as const
  return 'zinc' as const
}

export function VowDetail({ vowId }: { vowId: bigint }) {
  const { address: connected } = useAccount()

  const { data, isLoading, error } = useReadContract({
    abi: VOW_ABI,
    address: VOW_ADDRESS,
    functionName: 'vows',
    args: [vowId],
    chainId: VOW_CHAIN.id,
  })

  const { data: nextId } = useReadContract({
    abi: VOW_ABI,
    address: VOW_ADDRESS,
    functionName: 'nextVowId',
    chainId: VOW_CHAIN.id,
  })

  const { data: claimable } = useReadContract({
    abi: VOW_ABI,
    address: VOW_ADDRESS,
    functionName: 'claimable',
    args: connected ? [connected] : undefined,
    chainId: VOW_CHAIN.id,
    query: { enabled: !!connected },
  })

  // ponytail: chain timestamp preferred for eligibility; local clock for display fallback
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000)
    return () => clearInterval(id)
  }, [])

  const vow: VowData | null = useMemo(() => {
    if (!data) return null
    const d = data as readonly [
      Address, Address, Address, bigint,
      bigint, bigint, bigint, bigint,
      string, string, string, string,
      `0x${string}`, `0x${string}`,
      string, string,
      number, number, number,
    ]
    return {
      creator: d[0],
      partner: d[1],
      arbiter: d[2],
      stake: d[3],
      acceptDeadline: d[4],
      deliveryDeadline: d[5],
      reviewDeadline: d[6],
      disputeDeadline: d[7],
      creatorPromise: d[8],
      partnerPromise: d[9],
      creatorProofURI: d[10],
      partnerProofURI: d[11],
      creatorProofHash: d[12],
      partnerProofHash: d[13],
      creatorDisputeReason: d[14],
      partnerDisputeReason: d[15],
      creatorStatus: d[16] as ParticipantStatus,
      partnerStatus: d[17] as ParticipantStatus,
      status: d[18] as VowStatus,
    }
  }, [data])

  const role = useMemo(() => vow ? deriveRole(vow, connected ?? '0x') : 'observer', [vow, connected])
  const actions = useMemo(
    () => vow ? getAvailableActions(vow, role, now, (claimable as bigint | undefined) ?? 0n) : [],
    [vow, role, now, claimable],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800/50 bg-red-950/30 p-8 text-center">
        <p className="text-sm text-red-400">Failed to read VOW #{vowId.toString()} from contract.</p>
        <p className="mt-2 text-xs text-zinc-500">Check Bohr Testnet RPC or try again.</p>
      </div>
    )
  }

  const nextVowId = nextId as bigint | undefined

  if (nextVowId !== undefined && vowId >= nextVowId) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-4xl font-bold text-zinc-700">VOW #{vowId.toString()}</p>
        <p className="mt-3 text-sm text-zinc-500">This VOW does not exist yet.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Next VOW ID: {nextVowId.toString()}
        </p>
      </div>
    )
  }

  if (!vow) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-sm text-zinc-500">Loading VOW data...</p>
      </div>
    )
  }

  // Zero creator = deleted/expired proposal that was never accepted
  if (vow.creator === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-4xl font-bold text-zinc-700">VOW #{vowId.toString()}</p>
        <p className="mt-3 text-sm text-zinc-500">This VOW no longer exists on-chain.</p>
      </div>
    )
  }

  const creatorProof = proofDisplay(vow.creatorProofURI)
  const partnerProof = proofDisplay(vow.partnerProofURI)
  const hasArb = hasArbiter(vow)

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VOW #{vowId.toString()}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge label={VOW_STATUS_LABEL[vow.status]} variant={vowStatusVariant(vow.status)} />
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500 capitalize">{role}</span>
          </div>
        </div>
      </div>

      {/* Promises */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Promises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-600 mb-1">Creator Promise</p>
            <p className="text-sm text-zinc-200">{vow.creatorPromise || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-1">Partner Promise</p>
            <p className="text-sm text-zinc-200">{vow.partnerPromise || '—'}</p>
          </div>
        </div>
      </section>

      {/* Collateral */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Collateral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-600 mb-1">Stake per participant</p>
            <p className="text-lg font-semibold text-white">{formatStake(vow.stake)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-1">Total locked</p>
            <p className="text-lg font-semibold text-white">{formatStake(vow.stake * 2n)}</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Timeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Accept by', value: vow.acceptDeadline },
            { label: 'Deliver by', value: vow.deliveryDeadline },
            { label: 'Review by', value: vow.reviewDeadline },
            { label: 'Dispute by', value: vow.disputeDeadline },
          ].map((d) => (
            <div key={d.label}>
              <p className="text-xs text-zinc-600 mb-1">{d.label}</p>
              <p className="text-sm text-zinc-300">{formatDeadline(d.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Participants */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Participants</h2>
        <div className="space-y-3">
          {[
            { label: 'Creator', addr: vow.creator, status: vow.creatorStatus },
            { label: 'Partner', addr: vow.partner, status: vow.partnerStatus },
            ...(hasArb ? [{ label: 'Arbiter', addr: vow.arbiter, status: null }] : []),
          ].map((p) => (
            <div key={p.label} className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-16">{p.label}</span>
                <a
                  href={`${VOW_CHAIN.blockExplorers.default.url}/address/${p.addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-zinc-300 hover:text-white transition"
                  title={p.addr}
                >
                  {shorten(p.addr)}
                </a>
              </div>
              {p.status !== null && (
                <StatusBadge
                  label={PARTICIPANT_STATUS_LABEL[p.status]}
                  variant={participantVariant(p.status)}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      {(vow.creatorProofURI || vow.partnerProofURI) && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Proof</h2>
          <div className="space-y-3">
            {vow.creatorProofURI && (
              <div>
                <p className="text-xs text-zinc-600 mb-1">Creator Proof</p>
                {creatorProof.href ? (
                  <a href={creatorProof.href} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 transition break-all">
                    {creatorProof.label}
                  </a>
                ) : (
                  <p className="text-sm text-zinc-400 break-all">{creatorProof.label}</p>
                )}
              </div>
            )}
            {vow.partnerProofURI && (
              <div>
                <p className="text-xs text-zinc-600 mb-1">Partner Proof</p>
                {partnerProof.href ? (
                  <a href={partnerProof.href} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 transition break-all">
                    {partnerProof.label}
                  </a>
                ) : (
                  <p className="text-sm text-zinc-400 break-all">{partnerProof.label}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dispute reasons */}
      {(vow.creatorDisputeReason || vow.partnerDisputeReason) && (
        <section className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6">
          <h2 className="text-xs font-medium text-amber-500 uppercase tracking-wide mb-4">Dispute</h2>
          <div className="space-y-3">
            {vow.creatorDisputeReason && (
              <div>
                <p className="text-xs text-zinc-600 mb-1">Creator Reason</p>
                <p className="text-sm text-amber-300/80">{vow.creatorDisputeReason}</p>
              </div>
            )}
            {vow.partnerDisputeReason && (
              <div>
                <p className="text-xs text-zinc-600 mb-1">Partner Reason</p>
                <p className="text-sm text-amber-300/80">{vow.partnerDisputeReason}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions (placeholder — no writes in Gate O) */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Actions</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-zinc-500">No actions available for your wallet in current state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <span
                key={a}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400"
              >
                {a === 'submitProof' ? 'Submit Proof' : a === 'resolveDispute' ? 'Resolve Dispute' : a.charAt(0).toUpperCase() + a.slice(1)}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-600">Write actions will be wired in future gates.</p>
      </section>
    </div>
  )
}
