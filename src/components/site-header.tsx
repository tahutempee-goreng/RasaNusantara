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
      <Link className="brand" href="/#sampul" onClick={close} aria-label="RasaNusantara — Beranda"><span className="brand-wordmark">RasaNusantara</span></Link>
      <button ref={menuButton} className="nav-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => { setOpen(!open); setDropdown(null); }}><span>{open ? 'Tutup' : 'Menu'}</span><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d={open ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 10h14M3 14h14'} stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>
      <nav aria-label="Navigasi utama" id="site-menu" className={open ? 'site-menu is-open' : 'site-menu'}>
        <Link href="/#sampul" aria-current={path === '/' ? 'page' : undefined} onClick={close}>Beranda</Link>
        <Link href="/#cerita" onClick={close}>Cerita Budaya</Link>
        <Link href="/#resep-pilihan" onClick={close}>Resep</Link>
        <Link href="/#peta" onClick={close}>Daerah</Link>
        <div className="nav-disclosure"><button aria-expanded={dropdown === 'dapur'} aria-controls="kitchen-menu" onClick={() => setDropdown(dropdown === 'dapur' ? null : 'dapur')}>Dapur <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>{dropdown === 'dapur' && <div id="kitchen-menu" className="nav-popover"><Link href="/#cooking-guide" onClick={close}>Panduan Memasak</Link><Link href="/tentang" onClick={close}>Tentang resep & sumber</Link></div>}</div>
        <Link href="/cari" className="nav-cta" onClick={close}>Cari dari Bahan <span aria-hidden="true">↗</span></Link>
      </nav>
      {path === '/' && <Link className="journal-emblem" href="/tentang" onClick={close} aria-label="Tentang RasaNusantara" title="Kenali RasaNusantara, resep, dan sumbernya"><span className="journal-emblem-lockup"><svg aria-hidden="true" viewBox="0 0 28 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h22c-1 7-5 10-11 10S4 24 3 17ZM9 29h10M8 12c-3-3 3-4 0-7m6 7c-3-3 3-4 0-8m6 8c-3-3 3-4 0-7"/><path d="M7 21h14"/></svg><span className="journal-emblem-name"><b>Rasa</b><span>Nusantara</span></span></span></Link>}
    </div>
  </header>;
}


