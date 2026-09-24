'use client'

import { useState, useCallback, useRef } from 'react'
import { type Address, keccak256, toBytes } from 'viem'
import { simulateContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { config } from '@/lib/config'
import { VOW_ADDRESS, VOW_ABI, VOW_CHAIN } from '@/lib/contract'

export type TxPhase =
  | 'idle' | 'validating' | 'simulating' | 'wallet' | 'submitted' | 'confirming'
  | 'confirmed' | 'rejected' | 'error'

export type TxState = {
  phase: TxPhase
  txHash: string | null
  error: string | null
  explorerUrl: string | null
}

export function isTxPending(phase: TxPhase): boolean {
  return phase === 'validating' || phase === 'simulating' || phase === 'wallet'
    || phase === 'submitted' || phase === 'confirming'
}

export function receiptPhase(status: 'success' | 'reverted'): 'confirmed' | 'error' {
  return status === 'success' ? 'confirmed' : 'error'
}

const INITIAL: TxState = { phase: 'idle', txHash: null, error: null, explorerUrl: null }

// ponytail: generic write hook reused across all action types
export function useVowWrite() {
  const [state, setState] = useState<TxState>(INITIAL)
  const pending = useRef(false)

  const reset = useCallback(() => {
    pending.current = false
    setState(INITIAL)
  }, [])

  const execute = useCallback(async (opts: {
    functionName: string
    args: readonly unknown[]
    value?: bigint
    account: Address
  }) => {
    if (pending.current) return
    pending.current = true
    setState({ ...INITIAL, phase: 'simulating' })

    let stage: 'simulation' | 'wallet' | 'receipt' = 'simulation'
    try {
      const simArgs: Record<string, unknown> = {
        abi: VOW_ABI,
        address: VOW_ADDRESS,
        functionName: opts.functionName,
        args: opts.args,
        account: opts.account,
        chainId: VOW_CHAIN.id,
      }
      if (opts.value !== undefined) simArgs.value = opts.value

      const sim = await simulateContract(config, simArgs as never)
      stage = 'wallet'
      setState(s => ({ ...s, phase: 'wallet' }))

      const hash = await writeContract(config, sim.request)
      stage = 'receipt'
      setState(s => ({ ...s, phase: 'submitted', txHash: hash }))
      setState(s => ({ ...s, phase: 'confirming' }))

      const receipt = await waitForTransactionReceipt(config, { hash, chainId: VOW_CHAIN.id })
      if (receipt.status !== 'success') {
        throw new Error(`Transaction reverted on ${VOW_CHAIN.name}`)
      }

      const explorerUrl = `${VOW_CHAIN.blockExplorers.default.url}/tx/${hash}`
      pending.current = false
      setState({ phase: 'confirmed', txHash: hash, error: null, explorerUrl })
    } catch (err: unknown) {
      pending.current = false
      const e = err as { name?: string; message?: string; shortMessage?: string }
      if (e.name === 'UserRejectedRequestError') {
        setState(s => ({ ...s, phase: 'rejected', error: 'Transaction rejected by wallet' }))
      } else if (stage === 'simulation') {
        setState(s => ({ ...s, phase: 'error', error: 'Simulation failed: ' + (e.shortMessage ?? e.message ?? 'Transaction would revert') }))
      } else {
        setState(s => ({ ...s, phase: 'error', error: e.shortMessage ?? e.message ?? 'Transaction failed' }))
      }
    }
  }, [])

  return { ...state, execute, reset }
}

export function proofHashFromUri(uri: string): `0x${string}` {
  return keccak256(toBytes(uri))
}
