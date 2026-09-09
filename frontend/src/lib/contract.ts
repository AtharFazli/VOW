import { type Address } from 'viem'
import { bohrTestnet } from './chain'
import vowAbi from './vow-abi.json'

export const VOW_ADDRESS: Address =
  '0x9539263f4861812B08C37Bb3cB6603c771d6530b'

export const FAILURE_SINK: Address =
  '0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B'

export const VOW_CHAIN = bohrTestnet
export const VOW_ABI = vowAbi as typeof vowAbi
