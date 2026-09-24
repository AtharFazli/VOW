import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create' }

export default function CreateLayout({ children }: LayoutProps<'/create'>) {
  return children
}
