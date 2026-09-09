import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { bohrTestnet } from './chain'

export const config = createConfig({
  chains: [bohrTestnet],
  connectors: [injected()],
  transports: {
    [bohrTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
