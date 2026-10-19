'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './hero-video.module.css';

export function HeroVideo({ children, active = true }: { children?: ReactNode; active?: boolean }) {
  const frame = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [loadVideo, setLoadVideo] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 600px)');
    const update = () => { setMobile(viewport.matches); setReady(false); setFailed(false); };
    update();
    viewport.addEventListener('change', update);
    return () => viewport.removeEventListener('change', update);
  }, []);

  const videoSource = mobile ? '/videos/hero-nusantara-mobile.mp4' : '/videos/hero-nusantara.mp4';
  const posterSource = mobile ? '/images/hero-nusantara-mobile.webp' : '/images/hero-nusantara.webp';

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const updatePreference = () => setMotionAllowed(!preference.matches && !connection?.saveData);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreference(); updateVisibility();
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(entries => setInView(entries[0]?.isIntersecting ?? false), { threshold: 0.1 });
    if (frame.current) observer.observe(frame.current);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => { if (motionAllowed && inView && active) setLoadVideo(true); }, [motionAllowed, inView, active]);

  const shouldPlay = active && motionAllowed && inView && pageVisible && !failed;
  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (!shouldPlay) { player.pause(); return; }
    if (ready) void player.play().catch(() => setFailed(true));
  }, [shouldPlay, ready, loadVideo, videoSource]);

  return <figure ref={frame} className={styles.figure}>
    <div className={styles.frame}>
      <picture>
        <source media="(max-width: 600px)" srcSet="/images/hero-nusantara-mobile.webp" width={720} height={1280} />
        <img className={styles.poster} src="/images/hero-nusantara.webp" width={1280} height={720} alt="Ilustrasi sup, sate, rendang, dan pempek di atas kain terinspirasi batik" fetchPriority="high" />
      </picture>
      {motionAllowed && loadVideo && !failed && <video
        ref={video} className={`${styles.video} ${ready ? styles.ready : ''}`}
        key={videoSource} src={videoSource} poster={posterSource}
        autoPlay={shouldPlay} muted loop playsInline preload="metadata" aria-hidden="true"
        onCanPlay={() => setReady(true)} onError={() => { setFailed(true); }}
      />}
      {children && <div className={styles.content}>{children}</div>}
    </div>
  </figure>;
}

