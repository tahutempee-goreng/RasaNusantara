'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Native page scroll drives a pinned stack; long chapters are read before their sheet lifts. */
export function usePaperDeck(journal: RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState<number | null>(0);
  useEffect(() => {
    const root = journal.current;
    const stage = root?.querySelector<HTMLElement>('[data-paper-stage]');
    if (!root || !stage) return;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>('[data-journal-chapter]'));
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const touchDevice = matchMedia('(hover: none) and (pointer: coarse)');
    let frame = 0, lastActive: number | null = -1, viewport = 0, top = 0, travel = 0, hold = 0, disposed = false;
    let starts: number[] = [], overflow: number[] = [];
    let keyboardNavigation = false;
    let stopFrame = 0;
    const keyboardMode = () => { keyboardNavigation = true; };
    const pointerMode = (event: PointerEvent) => {
      keyboardNavigation = false;
      // A user interacting with revealed content interrupts an anchor's smooth
      // scroll at its current position, rather than carrying the form away.
      if (!touchDevice.matches && !preference.matches && (event.target as Element).closest('[data-journal-chapter]')) {
        const stopped = scrollY;
        window.scrollTo({ top: stopped, behavior: 'instant' });
        // Chrome can commit one compositor frame of a cancelled smooth scroll.
        // Settle once on the next frame; never pin native touch momentum.
        cancelAnimationFrame(stopFrame);
        stopFrame = requestAnimationFrame(() => window.scrollTo({ top: stopped, behavior: 'instant' }));
      }
    };
    const header = document.querySelector<HTMLElement>('.journal-header');
    const data = (element: HTMLElement, key: string, value: string) => {
      if (element.dataset[key] !== value) element.dataset[key] = value;
    };
    const style = (element: HTMLElement, key: string, value: string) => {
      if (element.style.getPropertyValue(key) !== value) element.style.setProperty(key, value);
    };
    const tintHeader = (index: number) => {
      if (header) { data(header, 'chapter', String(index)); data(header, 'tone', index === 1 || index === 3 ? 'light' : 'dark'); }
    };
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const publish = (index: number | null) => {
      if (lastActive !== index) { lastActive = index; setActive(index); }
    };
    const paint = () => {
      frame = 0;
      if (preference.matches || touchDevice.matches) {
        // Let the browser compositor own touch scrolling. No sheet transforms,
        // parallax variables or scroll-position corrections on toolbar resize.
        const bounds = panels.map(panel => panel.getBoundingClientRect());
        let index = 0;
        bounds.forEach((box, i) => { if (box.top <= Math.max(innerHeight * .4, top + 32)) index = i; });
        panels.forEach((panel, i) => data(panel, 'moving', String(!document.hidden && bounds[i].bottom > 0 && bounds[i].top < innerHeight)));
        const rootBounds = root.getBoundingClientRect();
        data(root, 'inView', String(rootBounds.bottom > top && rootBounds.top < innerHeight));
        publish(preference.matches ? null : index);
        tintHeader(index);
        return;
      }
      const scroll = Math.max(0, top - root.getBoundingClientRect().top);
      let index = 0;
      panels.forEach((panel, i) => {
        const local = scroll - starts[i];
        const read = clamp(local, 0, overflow[i]);
        const exit = i === panels.length - 1 ? 0 : clamp((local - overflow[i] - hold) / travel, 0, 1);
        if (local >= 0) index = i;
        style(panel, 'transform', `translate3d(0,${-read - exit * viewport}px,0)`);
        style(panel, 'visibility', exit >= 1 || local < -travel ? 'hidden' : 'visible');
        style(panel, '--page-progress', String(exit));
        style(panel, '--tear-progress', String(exit));
        style(panel, '--depth-progress', String(clamp(local / (viewport + overflow[i]), -1, 1)));
        data(panel, 'moving', String(!document.hidden && local > -travel && exit < 1));
        const previous = i - 1;
        style(panel, '--sheet-reveal', String(i === 0 ? 1 : clamp((scroll - starts[previous] - overflow[previous] - hold) / travel, 0, 1)));
        data(panel, 'exit', String(exit));
      });
      panels.forEach((panel, i) => {
        // The incoming sheet is already exposed below the lifted paper.
        // Its visible controls must accept clicks in either scroll direction.
        const exposed = i === index || i === index + 1 && Number(panels[index].dataset.exit) > 0;
        if (panel.inert !== !exposed) panel.inert = !exposed;
        if (panel.getAttribute('aria-hidden') !== String(!exposed)) panel.setAttribute('aria-hidden', String(!exposed));
      });
      publish(index);
      tintHeader(index);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const measure = () => {
      if (preference.matches || touchDevice.matches) {
        const restore = root.dataset.deckReady === 'true' ? panels[lastActive || 0] : null;
        const mode = preference.matches ? 'reduced' : 'native';
        if (root.dataset.scrollMode !== mode || restore) {
          delete root.dataset.deckReady;
          data(root, 'scrollMode', mode);
          root.style.removeProperty('height');
          panels.forEach(panel => {
            panel.inert = false;
            panel.removeAttribute('aria-hidden');
            data(panel, 'moving', 'false');
            for (const prop of ['transform', 'visibility', 'min-height', '--page-progress', '--tear-progress', '--sheet-reveal', '--depth-progress']) panel.style.removeProperty(prop);
          });
        }
        top = header?.getBoundingClientRect().height || 76;
        style(root, '--chapter-nav-top', `${top + 8}px`);
        if (restore) window.scrollTo({ top: scrollY + restore.getBoundingClientRect().top - top, behavior: 'instant' });
        paint();
        return;
      }
      const previousHeight = viewport;
      const restoreNative = root.dataset.scrollMode === 'native' || root.dataset.scrollMode === 'reduced' ? panels[lastActive || 0] : null;
      const previousStarts = [...starts];
      const previousOverflow = [...overflow];
      const pinned = root.dataset.deckReady === 'true' && root.getBoundingClientRect().top <= top;
      const previousScroll = Math.max(0, top - root.getBoundingClientRect().top);
      let previousIndex = 0;
      previousStarts.forEach((start, i) => { if (previousScroll >= start) previousIndex = i; });
      const previousLocal = previousScroll - (previousStarts[previousIndex] || 0);
      const wasLifting = previousLocal > (previousOverflow[previousIndex] || 0) + hold;
      const ratio = wasLifting ? (previousLocal - previousOverflow[previousIndex] - hold) / travel : previousLocal / Math.max(1, (previousOverflow[previousIndex] || 0) + hold);
      top = header?.dataset.overlay === 'true' ? 0 : document.querySelector('.site-header')?.getBoundingClientRect().height || 76;
      viewport = Math.max(240, innerHeight - top);
      travel = viewport * 1.25;
      hold = viewport * .6;
      root.dataset.readDistance = String(hold);
      root.dataset.travelDistance = String(travel);
      root.style.setProperty('--deck-top', `${top}px`);
      root.style.setProperty('--deck-height', `${viewport}px`);
      root.dataset.deckReady = 'true';
      data(root, 'scrollMode', 'paper');
      starts = []; overflow = [];
      let distance = 0;
      panels.forEach(panel => style(panel, 'min-height', `${viewport}px`));
      const heights = panels.map(panel => panel.offsetHeight);
      panels.forEach((panel, i) => {
        starts.push(distance);
        overflow.push(Math.max(0, heights[i] - viewport));
        panel.dataset.start = String(distance);
        panel.dataset.overflow = String(overflow[i]);
        distance += overflow[i] + hold + (i < panels.length - 1 ? travel : 0);
      });
      root.style.height = `${viewport + distance}px`;
      // Content updates must never pull the reader back while they select ingredients.
      if (restoreNative) {
        window.scrollTo({top:scrollY + root.getBoundingClientRect().top - top + starts[panels.indexOf(restoreNative)] + 1,behavior:'instant'});
      } else if (pinned && previousHeight !== viewport) {
        const local = wasLifting ? overflow[previousIndex] + hold + clamp(ratio, 0, 1) * travel : clamp(ratio, 0, 1) * (overflow[previousIndex] + hold);
        window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - top + starts[previousIndex] + local, behavior: 'instant' });
      }
      paint();
    };
    const jump = (target: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
      const panel = target.closest<HTMLElement>('[data-journal-chapter]');
      const index = panel ? panels.indexOf(panel) : -1;
      if (index < 0 || !panel) return false;
      if (preference.matches || touchDevice.matches) {
        // scrollIntoView adds both global scroll-padding and section margins.
        // Use one header offset, especially when landscape height is short.
        const headroom = header?.getBoundingClientRect().height || top;
        window.scrollTo({top:scrollY+target.getBoundingClientRect().top-headroom-16,behavior:preference.matches?'instant':behavior});
        return true;
      }
      const headroom = header?.getBoundingClientRect().height || top;
      const inset = clamp(target.getBoundingClientRect().top - panel.getBoundingClientRect().top - headroom - 24, 0, overflow[index]);
      const origin = scrollY + root.getBoundingClientRect().top - top;
      window.scrollTo({ top: origin + starts[index] + inset + 1, behavior });
      return true;
    };
    const anchor = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target && jump(target)) { event.preventDefault(); history.replaceState(history.state, '', url.hash); }
    };
    const focus = (event: FocusEvent) => {
      // Pointer clicks must not be converted into an automatic chapter scroll.
      if (!keyboardNavigation) return;
      const target = event.target as HTMLElement;
      const panel = target.closest<HTMLElement>('[data-journal-chapter]');
      if (panel && !panel.inert && panels.indexOf(panel) !== lastActive) {
        jump(target, 'instant');
        return;
      }
      const scroller = target.closest<HTMLElement>('[data-ingredient-scroll]');
      if (scroller && scroller !== target) {
        const item = target.getBoundingClientRect(), box = scroller.getBoundingClientRect();
        if (item.top < box.top + 8) scroller.scrollTop -= box.top + 8 - item.top;
        else if (item.bottom > box.bottom - 8) scroller.scrollTop += item.bottom - box.bottom + 8;
      }
      const bounds = (scroller || target).getBoundingClientRect();
      const safeTop = header?.getBoundingClientRect().bottom || top;
      if (panel && !panel.inert && (bounds.top < safeTop + 20 || bounds.bottom > innerHeight - 80)) jump(scroller || target, 'instant');
    };
    const observer = new ResizeObserver(measure);
    // Font metrics must settle before a chapter jump is assigned a scroll position.
    void document.fonts.ready.then(() => {
      if (disposed) return;
      measure();
      panels.forEach(panel => observer.observe(panel));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', measure);
      preference.addEventListener('change', measure);
      touchDevice.addEventListener('change', measure);
      document.addEventListener('click', anchor, true);
      document.addEventListener('keydown', keyboardMode, true);
      document.addEventListener('pointerdown', pointerMode, true);
      document.addEventListener('visibilitychange', schedule);
      root.addEventListener('focusin', focus);
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) jump(target, 'instant');
      }
    });
    return () => {
      disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(stopFrame); observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      preference.removeEventListener('change', measure);
      touchDevice.removeEventListener('change', measure);
      document.removeEventListener('click', anchor, true);
      document.removeEventListener('keydown', keyboardMode, true);
      document.removeEventListener('pointerdown', pointerMode, true);
      document.removeEventListener('visibilitychange', schedule);
      root.removeEventListener('focusin', focus);
      if (header) { delete header.dataset.chapter; delete header.dataset.tone; }
    };
  }, [journal]);
  return active;
}
