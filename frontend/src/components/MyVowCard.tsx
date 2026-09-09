'use client'

import Link from 'next/link'
import { type Address } from 'viem'
import { type VowData, VowStatus, VOW_STATUS_LABEL, PARTICIPANT_STATUS_LABEL } from '@/lib/types'
import { deriveRole, formatStake, hasArbiter } from '@/lib/vow'
import type { VowRole } from '@/lib/types'

function shortAddr(addr: Address): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function StatusBadge({ vow, role }: { vow: VowData; role: VowRole }) {
  const globalLabel = VOW_STATUS_LABEL[vow.status]

  const myStatus =
    role === 'creator' ? vow.creatorStatus
    : role === 'partner' ? vow.partnerStatus
    : null

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        vow.status === VowStatus.SETTLED ? 'bg-zinc-700 text-zinc-300'
        : vow.status === VowStatus.ACTIVE ? 'bg-amber-900 text-amber-300'
        : 'bg-zinc-800 text-zinc-400'
      }`}>
        {globalLabel}
      </span>
      {myStatus !== null && (
        <span className="text-xs text-zinc-500">
          You: {PARTICIPANT_STATUS_LABEL[myStatus]}
        </span>
      )}
    </div>
  )
}

export function MyVowCard({
  id,
  vow,
  address,
  actions,
}: {
  id: bigint
  vow: VowData
  address: Address
  actions: string[]
}) {
  const role = deriveRole(vow, address)
  const counterparty =
    role === 'creator' ? vow.partner
    : role === 'partner' ? vow.creator
    : vow.creator
  const promise =
    role === 'creator' ? vow.creatorPromise
    : role === 'partner' ? vow.partnerPromise
    : vow.creatorPromise

  const needsAction = actions.length > 0 && actions.some((a) => a !== 'finalize' || role !== 'observer')

  return (
    <Link
      href={`/vow/${id.toString()}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">VOW #{id.toString()}</span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 uppercase">
              {role}
            </span>
            {needsAction && (
              <span className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] text-amber-300 font-medium">
                Action
              </span>
            )}
          </div>

          <StatusBadge vow={vow} role={role} />

          <p className="mt-2 text-xs text-zinc-400 line-clamp-1">{promise}</p>

          <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
            <span>{formatStake(vow.stake)}</span>
            <span>·</span>
            <span>{shortAddr(counterparty)}</span>
            {hasArbiter(vow) && (
              <>
                <span>·</span>
                <span>Arbiter</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
