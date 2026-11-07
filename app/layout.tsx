import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FF ARENA | Free Fire Tournaments', description: 'Register for competitive Free Fire tournaments.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
