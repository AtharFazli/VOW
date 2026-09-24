import type { Metadata } from 'next'

// ponytail: id is user input from the URL, so a non-numeric segment falls back
// to a generic title instead of throwing during metadata resolution.
export async function generateMetadata({ params }: LayoutProps<'/vow/[id]'>): Promise<Metadata> {
  const { id } = await params
  return { title: /^\d+$/.test(id) ? `Vow #${id}` : 'Vow' }
}

export default function VowLayout({ children }: LayoutProps<'/vow/[id]'>) {
  return children
}
