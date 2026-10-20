'use client';

import Link from 'next/link';
import { useRef, type Dispatch, type SetStateAction } from 'react';
import type { ClientCatalog, MatchInput } from '@/lib/schema';
import { RecipeCarousel } from './recipe-carousel';
import { NightSky } from './night-sky';
import { HeroVideo } from './hero-video';
import { NusantaraHome } from './nusantara-home';
import { usePaperDeck } from './use-paper-deck';
import { Islands, Textile, Tear, Compass, Boat } from './archipelago-art';
import styles from './journal-home.module.css';

type Props = { catalog: ClientCatalog; input: MatchInput; setInput: Dispatch<SetStateAction<MatchInput>>; onSearch: () => void };
export function JournalHome(props: Props) {
  const journal = useRef<HTMLDivElement>(null);
  const activeChapter = usePaperDeck(journal);
  const recipes = ['tekwan-contoh', 'rendang', 'rawon', 'coto-makassar'].flatMap(id => props.catalog.recipes.filter(recipe => recipe.id === id));


  return <div className={styles.journal} ref={journal}><div className={styles.stage} data-paper-stage>
    <section id="sampul" className={styles.cover} data-journal-chapter aria-labelledby="journal-title">
      <img className={styles.landscape} src="/images/journal/paper-mountains.webp" alt="" fetchPriority="high"/>
      <img className={styles.foreground} src="/images/journal/paper-foreground.png" alt=""/>
      <div className={styles.seaLines} aria-hidden="true"/>
      <img className={styles.villageLayer} src="/images/journal/nusantara-village-v2.webp" alt="" fetchPriority="high"/>
      <span className={styles.coverSeal} aria-hidden="true">CATATAN RASA<br/>KEPULAUAN INDONESIA</span>
      <div className={styles.hornbill} data-hornbill aria-hidden="true"><div className={styles.birdCanvas}><span className={styles.upperWing}/><span className={styles.lowerWing}/><span className={styles.birdBody}/></div></div>
      <aside className={styles.paperSticker} aria-label="Catatan sampul"><span>Banyak pulau,<br/>banyak rasa<br/>untuk dikenal.</span><small>DARI DAPUR<br/>NUSANTARA</small></aside>
      <div className={styles.coverTitle}>
        <h1 id="journal-title">RASA DARI NUSANTARA,<br/>CERITA DI MEJA KITA.</h1>
        <p>Masak dari bahan yang ada.<br/>Kenali cerita di balik hidangannya.</p>
        <div className={styles.coverActions}><Link className={styles.paperButton} href="/cari">Cari dari bahan saya</Link><a className={styles.outlineButton} href="#cerita">Cerita budaya</a></div>
      </div>
      <div className={styles.coverFoot}><span>RASA NUSANTARA / CATATAN DARI KEPULAUAN</span><a href="#cerita" aria-label="Buka halaman berikutnya">↓</a></div>
      <Tear/>
    </section>

    <section className={styles.postcardChapter} id="cerita" data-journal-chapter aria-labelledby="journal-story-title">
      <Islands className={styles.storyIslands}/><Textile/>
      <img className={styles.storySpices} src="/images/journal/nusantara-spices-v2.webp" alt="" loading="lazy"/>
      <div className={styles.envelope} aria-hidden="true"><span>Dari pulau ke pulau.</span></div>
      <div className={styles.postcard}>
        <div className={styles.postcardPhotos}>
          <span className={styles.tape} aria-hidden="true"/>
          <div className={styles.videoPrint}><HeroVideo active={activeChapter === null || activeChapter === 1}/></div>
          <div className={styles.smallPrint}><img src="/images/journal/nusantara-landscape.webp" alt="Ilustrasi lanskap kepulauan Indonesia" loading="lazy"/><span>Sepotong Nusantara.</span></div>
          <svg className={styles.mountainSketch} viewBox="0 0 200 55" aria-hidden="true"><path d="m5 45 27-19 10 8 29-27 29 32 17-14 32 21 15-15 29 17M54 23l16 10 12-8M25 43l25 3M99 46l28-3" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
        </div>
        <div className={styles.letter}>
          <span className={styles.stamp} aria-hidden="true"><img src="/images/journal/paper-mountains.webp" alt=""/><b>RN</b></span>
          <h2 id="journal-story-title">KARTU POS</h2>
          <p className={styles.letterSubtitle}>Dari banyak pulau,<br/>untuk satu meja kita.</p>
          <div className={styles.handLetter}><p>Halo, kawan dapur.</p><p>Perjalanan ini tentang masakan dari seluruh Indonesia. Kita mulai dari bahan yang ada, lalu mengenal hidangan dan cerita di baliknya.</p><p>Dari Palembang, Minangkabau, Jawa, sampai Makassar. Pilih isi dapurmu, temukan resepnya, lalu baca cerita dari daerah asalnya.</p></div>
          <div className={styles.letterSign}><span>— RasaNusantara</span>{recipes[0] && <Link href={'/resep/' + recipes[0].slug + '#cerita-resep'}>Baca cerita hidangan ↗</Link>}</div>
        </div>
        <p className={styles.postcardNote}><Link href="/tentang">Kenali RasaNusantara ↗</Link></p>
      </div>
      <Tear variant={1}/>
    </section>

    <section id="resep-pilihan" className={styles.recipeChapter} data-journal-chapter aria-labelledby="journal-recipes-title">
      <img className={styles.recipeSpices} src="/images/journal/nusantara-spices-v2.webp" alt="" loading="lazy"/>
      <img className={styles.recipeVillage} src="/images/journal/nusantara-night-v2.webp" alt="" loading="lazy"/>
      <div className={styles.ingredientNote} aria-hidden="true">Dari kebun,<br/>ke dapur,<br/>ke meja kita.<span>CATATAN BAHAN</span></div>
      <div className={styles.chapterHeading}><h2 id="journal-recipes-title">RESEP — CATATAN RASA</h2><p>Empat persinggahan rasa. Jelajahi seluruh resep lewat bahan di dapurmu.</p></div>
      <RecipeCarousel recipes={recipes} active={activeChapter===null||activeChapter===2}/>
      <p className={styles.chapterFoot}>BUKA RESEP · KENALI BAHANNYA · BACA CERITANYA</p>
      <Tear variant={2}/>
    </section>

    <section id="dapur" className={styles.pantryChapter} data-journal-chapter aria-label="Jelajah daerah dan pencocokan bahan">
      <Islands className={styles.pantryIslands}/><Compass/>
      <svg className={styles.routeMap} viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1"><path d="M-80 50Q140-40 220 160T540 350 870 90 1250 130 1500 300M-60 110Q120 25 180 210T540 400 870 160 1230 190 1500 370M-80 160Q90 75 130 260T540 450 870 230 1230 260 1500 440M-30 800Q200 700 340 870T710 800 1100 670 1510 760M-50 740Q200 650 350 820T720 750 1100 620 1510 700"/><path d="M-30 570Q250 430 480 600T920 510 1470 470" stroke="#aa6647" strokeWidth="2" strokeDasharray="5 10"/><path d="M-50 670Q200 610 380 540T760 610 1110 480 1500 570" stroke="#92afb7" strokeWidth="8" opacity=".35"/></g><g fill="#aa6647"><circle cx="190" cy="525" r="4"/><circle cx="520" cy="610" r="4"/><circle cx="1020" cy="490" r="4"/></g></svg>
      <header className={styles.routeHeading} id="peta"><h2>PETA RASA KITA</h2></header>
      <div className={styles.pantryBoard}><NusantaraHome {...props} pantryOnly/></div><div className={styles.harbor} aria-hidden="true"><div className={styles.waveFar}/><div className={styles.waveNear}/><Boat/></div>
      <span className={styles.mapCaption}>JEJAK RASA NUSANTARA</span>
      <Tear variant={3}/>
    </section>

    <section className={styles.guideChapter} id="panduan" data-journal-chapter aria-labelledby="journal-guide-title">
      <NightSky active={activeChapter===null||activeChapter===4}/><span className={styles.moon} aria-hidden="true"/><div className={styles.nightHills} aria-hidden="true"/><img className={styles.nightForeground} src="/images/journal/nusantara-night-v2.webp" alt="" loading="lazy"/>
      <div className={styles.chapterHeading}><h2 id="journal-guide-title">CATATAN UNTUK DAPURMU</h2><p>Buka resep. Kenali bahan. Masak satu langkah pada satu waktu.</p></div>
      <div className={styles.guidePostcard}>
        <div className={styles.cookingLetter}><span className={styles.smallLabel}>UNTUK: KAWAN DAPUR</span><ol><li><b>Kenali bahanmu.</b><p>Pilih Berkuah atau Kering, lalu tandai bahan yang tersedia.</p></li><li><b>Buka resep yang cocok.</b><p>Periksa bahan yang masih kurang dan baca langkahnya dahulu.</p></li><li><b>Masak saat siap.</b><p>Cooking Mode menyimpan progres di perangkatmu.</p></li></ol></div>
        <div className={styles.guideAddress}><span className={styles.stamp} aria-hidden="true"><img src="/images/journal/paper-mountains.webp" alt=""/><b>RN</b></span><div id="cooking-guide"><h3>Siap mulai<br/>memasak?</h3><p>Temukan hidangan dari isi dapurmu, lalu ikuti langkahnya satu per satu.</p></div><Link className={styles.darkButton} href="/cari">Mulai pilih bahan <span aria-hidden="true">↗</span></Link><Link className={styles.guideAbout} href="/tentang">Tentang resep & sumber ↗</Link></div>
      </div>
      <nav className={styles.travelTags} aria-label="Lanjut jelajah Nusantara"><Link href="/cari">BAHAN DI DAPUR</Link><a href="#resep-pilihan">CATATAN RESEP</a><a href="#cerita">CERITA BUDAYA</a></nav>
      <div className={styles.journalEnd}><span>RASA NUSANTARA / CATATAN INI AKAN TERUS BERTAMBAH.</span><a href="#sampul">KEMBALI KE AWAL ↑</a></div>
    </section>
    <nav className={styles.chapterNav} aria-label="Bab perjalanan">{[['sampul', 'Sampul'], ['cerita', 'Cerita'], ['resep-pilihan', 'Resep'], ['dapur', 'Dapur'], ['panduan', 'Panduan']].map(([id, title], index) => <a key={id} href={'#' + id} aria-label={'Buka bab: ' + title} aria-current={activeChapter === index ? 'step' : undefined}><span className={styles.railDot} aria-hidden="true"/><span className={styles.chapterLabel}>{title}</span></a>)}</nav>
  </div></div>;
}

