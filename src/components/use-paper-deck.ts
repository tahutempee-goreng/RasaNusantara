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
    const supportsStableViewport = CSS.supports('height', '100lvh');
    const flat = () => preference.matches || touchDevice.matches && !supportsStableViewport;
    const light = () => touchDevice.matches && !preference.matches && supportsStableViewport;
    const viewportProbe = document.createElement('span');
    viewportProbe.setAttribute('aria-hidden', 'true');
    viewportProbe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;overflow:hidden';
    stage.append(viewportProbe);
    let lightWidth = 0;
    let lightHeights: number[] = [];
    let lastChapter = 0, headerHeight = 76;
    let frame = 0, lastActive: number | null = -1, viewport = 0, top = 0, travel = 0, hold = 0, disposed = false;
    let starts: number[] = [], overflow: number[] = [];
    let keyboardNavigation = false;
    let stopFrame = 0;
    const keyboardMode = () => { keyboardNavigation = true; };
    const pointerMode = (event: PointerEvent) => {
      keyboardNavigation = false;
      if (touchDevice.matches) return;
      // A user interacting with revealed content interrupts an anchor's smooth
      // scroll at its current position, rather than carrying the form away.
      if (!preference.matches && !touchDevice.matches && (event.target as Element).closest('[data-journal-chapter]')) {
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
      if (flat()) {
        // Let the browser compositor own touch scrolling. No sheet transforms,
        // parallax variables or scroll-position corrections on toolbar resize.
        const bounds = panels.map(panel => panel.getBoundingClientRect());
        let index = 0;
        bounds.forEach((box, i) => { if (box.top <= Math.max(innerHeight * .4, top + 32)) index = i; });
        panels.forEach((panel, i) => data(panel, 'moving', String(!document.hidden && bounds[i].bottom > 0 && bounds[i].top < innerHeight)));
        const rootBounds = root.getBoundingClientRect();
        data(root, 'inView', String(rootBounds.bottom > top && rootBounds.top < innerHeight));
        lastChapter = index;
        publish(preference.matches ? null : index);
        tintHeader(index);
        return;
      }
      const rootBounds = root.getBoundingClientRect();
      const scroll = Math.max(0, top - rootBounds.top);
      const lightweight = light();
      if (lightweight) data(root, 'inView', String(rootBounds.bottom > innerHeight * .6 && rootBounds.top < innerHeight));
      let index = 0;
      panels.forEach((panel, i) => {
        const local = scroll - starts[i];
        const read = clamp(local, 0, overflow[i]);
        const exit = i === panels.length - 1 ? 0 : clamp((local - overflow[i] - hold) / travel, 0, 1);
        if (local >= 0) index = i;
        const visible = exit < 1 && local >= -travel;
        style(panel, 'visibility', visible ? 'visible' : 'hidden');
        // Touch writes only one sheet transform while reading/lifting. Incoming
        // paper stays still; hidden sheets never receive per-frame transforms.
        const offset = -read - exit * viewport;
        style(panel, 'transform', lightweight && (!visible || offset === 0) ? 'none' : `translate3d(0,${offset}px,0)`);
        const onScreen = rootBounds.bottom > 0 && rootBounds.top < innerHeight;
        data(panel, 'moving', String(!document.hidden && visible && onScreen));
        if (lightweight) {
          data(panel, 'lifting', String(visible && rootBounds.bottom > 0 && (read > 0 || exit > 0)));
        } else {
          style(panel, '--page-progress', String(exit));
          style(panel, '--tear-progress', String(exit));
          style(panel, '--depth-progress', String(clamp(local / (viewport + overflow[i]), -1, 1)));
          const previous = i - 1;
          style(panel, '--sheet-reveal', String(i === 0 ? 1 : clamp((scroll - starts[previous] - overflow[previous] - hold) / travel, 0, 1)));
        }
        data(panel, 'exit', String(exit));
      });
      panels.forEach((panel, i) => {
        // The incoming sheet is already exposed below the lifted paper.
        // Its visible controls must accept clicks in either scroll direction.
        const exposed = i === index || i === index + 1 && Number(panels[index].dataset.exit) > 0;
        if (panel.inert !== !exposed) panel.inert = !exposed;
        if (panel.getAttribute('aria-hidden') !== String(!exposed)) panel.setAttribute('aria-hidden', String(!exposed));
      });
      lastChapter = index;
      publish(index);
      const local = scroll - starts[index];
      const progress = index === panels.length - 1 ? 0 : clamp((local - overflow[index] - hold) / travel, 0, 1);
      const bottom = (lightHeights[index] || viewport) - clamp(local, 0, overflow[index]) - progress * viewport;
      tintHeader(lightweight && index < panels.length - 1 && bottom < headerHeight ? index + 1 : index);
      if (header) data(header, 'touchScroll', String(lightweight && scroll > 4));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const measure = () => {
      if (flat()) {
        const restore = root.dataset.deckReady === 'true' ? panels[lastChapter] : null;
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
        headerHeight = header?.getBoundingClientRect().height || 76;
        top = headerHeight;
        style(root, '--chapter-nav-top', `${top + 8}px`);
        if (restore) window.scrollTo({ top: scrollY + restore.getBoundingClientRect().top - top, behavior: 'instant' });
        paint();
        return;
      }
      const lightweight = light();
      const previousHeight = viewport;
      const widthChanged = lightweight && (lightWidth !== innerWidth || root.dataset.scrollMode !== 'paper-light');
      if (widthChanged) { lightWidth = innerWidth; lightHeights = []; }
      if (lightweight && root.dataset.scrollMode !== 'paper-light') {
        panels.forEach(panel => {
          for (const prop of ['--page-progress', '--tear-progress', '--depth-progress', '--sheet-reveal']) panel.style.removeProperty(prop);
        });
      }
      const restoreNative = root.dataset.scrollMode === 'native' || root.dataset.scrollMode === 'reduced' ? panels[lastChapter] : null;
      const previousStarts = [...starts];
      const previousOverflow = [...overflow];
      const pinned = root.dataset.deckReady === 'true' && root.getBoundingClientRect().top <= top;
      const previousScroll = Math.max(0, top - root.getBoundingClientRect().top);
      let previousIndex = 0;
      previousStarts.forEach((start, i) => { if (previousScroll >= start) previousIndex = i; });
      const previousLocal = previousScroll - (previousStarts[previousIndex] || 0);
      const wasLifting = previousLocal > (previousOverflow[previousIndex] || 0) + hold;
      const ratio = wasLifting ? (previousLocal - previousOverflow[previousIndex] - hold) / travel : previousLocal / Math.max(1, (previousOverflow[previousIndex] || 0) + hold);
      headerHeight = header?.getBoundingClientRect().height || 76;
      top = header?.dataset.overlay === 'true' ? 0 : document.querySelector('.site-header')?.getBoundingClientRect().height || 76;
      // Freeze the large-viewport baseline on height-only toolbar/keyboard
      // changes. Recompute for actual width/orientation changes only.
      if (!lightweight || widthChanged || !viewport) viewport = Math.max(240, (lightweight ? viewportProbe.getBoundingClientRect().height : innerHeight) - top);
      travel = viewport * (lightweight ? 1 : 1.25);
      hold = viewport * (lightweight ? .16 : .6);
      if (lightweight) style(root, '--chapter-nav-top', `${headerHeight + 8}px`);
      data(root, 'readDistance', String(hold));
      data(root, 'travelDistance', String(travel));
      style(root, '--deck-top', `${top}px`);
      style(root, '--deck-height', `${viewport}px`);
      data(root, 'deckReady', 'true');
      data(root, 'scrollMode', lightweight ? 'paper-light' : 'paper');
      starts = []; overflow = [];
      let distance = 0;
      panels.forEach((panel, i) => style(panel, 'min-height', `${lightweight ? lightHeights[i] || viewport : viewport}px`));
      const heights = panels.map(panel => panel.offsetHeight);
      panels.forEach((panel, i) => {
        starts.push(distance);
        if (lightweight) {
          // Keep a chapter's reading space stable when ingredient results shrink.
          lightHeights[i] = Math.max(lightHeights[i] || viewport, heights[i]);
          style(panel, 'min-height', `${lightHeights[i]}px`);
        }
        overflow.push(Math.max(0, (lightweight ? lightHeights[i] : heights[i]) - viewport));
        panel.dataset.start = String(distance);
        panel.dataset.overflow = String(overflow[i]);
        distance += overflow[i] + (lightweight && i === panels.length - 1 ? 0 : hold) + (i < panels.length - 1 ? travel : 0);
      });
      style(root, 'height', `${viewport + distance}px`);
      // Content updates must never pull the reader back while they select ingredients.
      if (restoreNative) {
        window.scrollTo({top:scrollY + root.getBoundingClientRect().top - top + starts[panels.indexOf(restoreNative)] + 1,behavior:'instant'});
      } else if (pinned && previousHeight !== viewport) {
        const local = wasLifting ? overflow[previousIndex] + hold + clamp(ratio, 0, 1) * travel : clamp(ratio, 0, 1) * (overflow[previousIndex] + hold);
        window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - top + starts[previousIndex] + local, behavior: 'instant' });
      } else if (lightweight && pinned && previousStarts.length) {
        const shift = starts[previousIndex] - previousStarts[previousIndex];
        if (Math.abs(shift) > .5) window.scrollTo({top:scrollY + shift,behavior:'instant'});
      }
      paint();
    };
    const jump = (target: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
      const panel = target.closest<HTMLElement>('[data-journal-chapter]');
      const index = panel ? panels.indexOf(panel) : -1;
      if (index < 0 || !panel) return false;
      if (flat()) {
        // scrollIntoView adds both global scroll-padding and section margins.
        // Use one header offset, especially when landscape height is short.
        const headroom = header?.getBoundingClientRect().height || top;
        window.scrollTo({top:scrollY+target.getBoundingClientRect().top-headroom-16,behavior:preference.matches||touchDevice.matches?'instant':behavior});
        return true;
      }
      const headroom = header?.getBoundingClientRect().height || top;
      const inset = clamp(target.getBoundingClientRect().top - panel.getBoundingClientRect().top - headroom - 24, 0, overflow[index]);
      const origin = scrollY + root.getBoundingClientRect().top - top;
      const destination = origin + starts[index] + inset + (light() ? 3 : 1);
      cancelAnimationFrame(stopFrame);
      // Direct chapter navigation on touch avoids overlapping Safari smooth
      // scrolls. Finger/wheel scrolling still drives the complete paper lift.
      window.scrollTo({top:destination,behavior:light()?'instant':behavior});
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
    const manualScroll = () => { cancelAnimationFrame(stopFrame); };
    const observer = new ResizeObserver(measure);
    // Font metrics must settle before a chapter jump is assigned a scroll position.
    void document.fonts.ready.then(() => {
      if (disposed) return;
      measure();
      panels.forEach(panel => observer.observe(panel));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', measure);
      window.addEventListener('touchmove', manualScroll, { passive: true });
      window.addEventListener('wheel', manualScroll, { passive: true });
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
      viewportProbe.remove();
      window.removeEventListener('resize', measure);
      window.removeEventListener('touchmove', manualScroll);
      window.removeEventListener('wheel', manualScroll);
      preference.removeEventListener('change', measure);
      touchDevice.removeEventListener('change', measure);
      document.removeEventListener('click', anchor, true);
      document.removeEventListener('keydown', keyboardMode, true);
      document.removeEventListener('pointerdown', pointerMode, true);
      document.removeEventListener('visibilitychange', schedule);
      root.removeEventListener('focusin', focus);
      if (header) { delete header.dataset.chapter; delete header.dataset.tone; delete header.dataset.touchScroll; }
    };
  }, [journal]);
  return active;
}
