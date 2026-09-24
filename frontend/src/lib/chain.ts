import { defineChain } from 'viem'

export const bohrTestnet = defineChain({
  id: 968,
  name: 'Bohr Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.bohr.life'] } },
  blockExplorers: {
    default: { name: 'Bohr Explorer', url: 'https://scan.bohr.life' },
  },
})

export const botMainnet = defineChain({
  id: 677,
  name: 'BOT Chain Mainnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.botchain.ai'] } },
  blockExplorers: {
    default: { name: 'BOT Chain Explorer', url: 'https://scan.botchain.ai' },
  },
})
