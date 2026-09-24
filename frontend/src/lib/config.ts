import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { bohrTestnet, botMainnet } from './chain'
import { VOW_CHAIN } from './contract'

// Both chains are registered so VOW_CHAIN stays a union and callers can pass
// chainId: 968 | 677. Registering only the active chain narrows the inferred
// config type to that one literal id and every chainId: VOW_CHAIN.id breaks.
const chains = [bohrTestnet, botMainnet] as const

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [bohrTestnet.id]: http(),
    [botMainnet.id]: http(),
  },
})

// ponytail: switchChain is not wired into the UI — the wallet must already be on
// VOW_CHAIN.id. Add a switch prompt if a judge lands on the wrong network.
export const ACTIVE_CHAIN = VOW_CHAIN

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
