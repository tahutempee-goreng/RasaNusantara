import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
export const metadata: Metadata = { title: 'RasaNusantara', description: 'Temukan masakan Nusantara dari bahan di dapurmu dan kenali cerita di balik hidangannya.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="id"><body>{children}</body></html>; }
