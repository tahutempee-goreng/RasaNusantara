'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
  const path = usePathname();
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  useEffect(() => {
    function outside(event: PointerEvent) { if (!header.current?.contains(event.target as Node)) { setOpen(false); setDropdown(null); } }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { header.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus(); setOpen(false); setDropdown(null); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  function close() { setOpen(false); setDropdown(null); }
  return <header className={path === '/' ? 'site-header journal-header' : 'site-header'} data-overlay={path === '/' ? 'true' : undefined} ref={header}>
    <div className="site-nav-wrap">
      <Link className="brand" href="/" onClick={close} aria-label="RasaNusantara — Beranda"><span className="brand-wordmark">RasaNusantara</span><svg className="brand-ornament" aria-hidden="true" viewBox="0 0 28 14" width="28" height="14" fill="none"><path d="M0 7h7l5-5 5 5-5 5-5-5h21" stroke="currentColor" strokeWidth="1.4"/><path d="m12 5 2 2-2 2-2-2Z" fill="currentColor"/></svg></Link>
      <button ref={menuButton} className="nav-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => { setOpen(!open); setDropdown(null); }}><span>{open ? 'Tutup' : 'Menu'}</span><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d={open ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 10h14M3 14h14'} stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>
      <nav aria-label="Navigasi utama" id="site-menu" className={open ? 'site-menu is-open' : 'site-menu'}>
        <Link href="/" aria-current={path === '/' ? 'page' : undefined} onClick={close}>Beranda</Link>
        <div className="nav-disclosure"><button aria-expanded={dropdown === 'daerah'} aria-controls="region-menu" onClick={() => setDropdown(dropdown === 'daerah' ? null : 'daerah')}>Daerah <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>{dropdown === 'daerah' && <div id="region-menu" className="nav-popover"><Link href="/#peta" onClick={close}>Jelajahi daerah Nusantara</Link><Link href="/#cari" onClick={close}>Daerah & ketersediaan resep</Link></div>}</div>
        <Link href="/cari" aria-current={path === '/cari' ? 'page' : undefined} onClick={close}>Resep</Link>
        <Link href="/#cerita" onClick={close}>Cerita Budaya</Link>
        <div className="nav-disclosure"><button aria-expanded={dropdown === 'dapur'} aria-controls="kitchen-menu" onClick={() => setDropdown(dropdown === 'dapur' ? null : 'dapur')}>Dapur <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>{dropdown === 'dapur' && <div id="kitchen-menu" className="nav-popover"><Link href="/#cooking-guide" onClick={close}>Panduan Memasak</Link><Link href="/tentang" onClick={close}>Tentang resep & sumber</Link></div>}</div>
        <Link href="/cari" className="nav-cta" onClick={close}>Cari dari Bahan <span aria-hidden="true">↗</span></Link>
      </nav>
      {path === '/' && <span className="journal-emblem" aria-hidden="true"><svg viewBox="0 0 40 32" fill="none" stroke="currentColor" strokeWidth="1"><path d="m2 25 12-19 7 12 5-8 12 15M9 14l5 3 4-3M3 29h34"/></svg><b>RN</b><small>NUSANTARA</small></span>}
    </div>
  </header>;
}


