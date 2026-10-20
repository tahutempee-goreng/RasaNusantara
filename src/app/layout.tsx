import { siteMetadata } from '@/lib/site-metadata';
import './globals.css';
import './theme.css';
export const metadata = siteMetadata();
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="id"><body>{children}</body></html>; }
