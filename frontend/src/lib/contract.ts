import { type Address } from 'viem'
import { bohrTestnet, botMainnet } from './chain'
import vowAbi from './vow-abi.json'

// VOW_ADDRESS and FAILURE_SINK are per-chain and must be set together.
// They are public values (they ship in the client bundle); only keys are secret.
// NEXT_PUBLIC_* is inlined at build time, so set it before `next build`.
//
// ponytail: mainnet stays inert until NEXT_PUBLIC_VOW_ADDRESS exists. Setting the
// chain alone would point mainnet UI at the testnet contract, so that combination
// deliberately falls back to testnet.
const MAINNET = process.env.NEXT_PUBLIC_VOW_CHAIN === 'mainnet' && !!process.env.NEXT_PUBLIC_VOW_ADDRESS

export const VOW_CHAIN = MAINNET ? botMainnet : bohrTestnet

export const VOW_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_VOW_ADDRESS as Address) ??
  '0x9539263f4861812B08C37Bb3cB6603c771d6530b'

export const FAILURE_SINK: Address =
  (process.env.NEXT_PUBLIC_FAILURE_SINK as Address) ??
  '0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B'

export const VOW_ABI = vowAbi as typeof vowAbi
