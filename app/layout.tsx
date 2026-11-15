
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BATTLE_VERSE | Free Fire Tournaments',
  description:
    'Enter the battle. Rule the verse. Join BATTLE_VERSE and compete in Free Fire tournaments.',
  icons: {
    icon: '/battleverse-icon.svg',
    shortcut: '/battleverse-icon.svg',
    apple: '/battleverse-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
