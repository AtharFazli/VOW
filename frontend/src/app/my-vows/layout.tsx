import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Vows' }

export default function MyVowsLayout({ children }: LayoutProps<'/my-vows'>) {
  return children
}
