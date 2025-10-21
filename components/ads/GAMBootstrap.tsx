// components/ads/GAMBootstrap.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const INTERSTITIAL = '/23287346478/marciobevervanso.com/marciobevervanso.com_Interstitial';
const ANCHOR_TOP   = '/23287346478/marciobevervanso.com/marciobevervanso.com_Anchor';

function loadGPTOnce() {
  if (document.querySelector('script[data-gpt]')) return;
  const s = document.createElement('script');
  s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  s.async = true;
  s.setAttribute('data-gpt', '1');
  s.referrerPolicy = 'origin';
  document.head.appendChild(s);
}

/** apenas slots in-page (com elementId) — não inclui interstitial/anchor */
function getInPageSlots(gtag: any): any[] {
  try {
    const all = gtag.pubads().getSlots?.() || [];
    return all.filter((s: any) => typeof s.getSlotElementId === 'function' && !!s.getSlotElementId());
  } catch {
    return [];
  }
}

export default function GAMBootstrap() {
  const pathname = usePathname();
  const search = useSearchParams();
  const bootKeyRef = useRef<string>('');
  const oopDisplayed = useRef<{ inter?: boolean; anchor?: boolean }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // sem ads no dashboard
    if ((window.location.pathname || '/').startsWith('/dashboard')) return;

    const w = window as any;
    w.googletag = w.googletag || { cmd: [] };

    // ===== boot global (uma vez por aba) =====
    if (!w.__gamBootV5) {
      w.__gamBootV5 = true;
      loadGPTOnce();

      w.googletag.cmd.push(function () {
        const gtag = w.googletag;
        const pubads = gtag.pubads();

        pubads.disableInitialLoad();       // controlamos o primeiro request
        pubads.enableSingleRequest();      // SRA
        pubads.enableLazyLoad({
          fetchMarginPercent: 20,
          renderMarginPercent: 10,
          mobileScaling: 2.0,
        });
        pubads.setCentering(true);

        gtag.enableServices();
      });
    }

    // ===== por rota (pathname + search) =====
    const bootKey = `${pathname}?${search?.toString() || ''}`;
    if (bootKeyRef.current === bootKey) return;
    bootKeyRef.current = bootKey;

    w.googletag.cmd.push(function () {
      const gtag = w.googletag;
      const pubads = gtag.pubads?.();

      // define/exibe OOP somente 1x por aba
      try {
        if (!oopDisplayed.current.inter) {
          const inter = gtag.defineOutOfPageSlot(
            INTERSTITIAL,
            (gtag as any).enums?.OutOfPageFormat?.INTERSTITIAL || 1
          );
          if (inter) {
            inter.addService(pubads);
            gtag.display(inter);
            oopDisplayed.current.inter = true;
          }
        }
      } catch {}
      try {
        if (!oopDisplayed.current.anchor) {
          const anchor = gtag.defineOutOfPageSlot(
            ANCHOR_TOP,
            (gtag as any).enums?.OutOfPageFormat?.TOP_ANCHOR || 3
          );
          if (anchor) {
            anchor.addService(pubads);
            gtag.display(anchor);
            oopDisplayed.current.anchor = true;
          }
        }
      } catch {}

      // refresh leve só nos in-page (NÃO tenta refresh de interstitial/anchor)
      const kick = () => {
        const slots = getInPageSlots(gtag);
        if (slots.length) {
          try { pubads.refresh(slots); } catch {}
        }
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(kick, { timeout: 1200 });
      } else {
        setTimeout(kick, 300);
      }
    });

    // ===== retomada ao voltar/ficar visível =====
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        (window as any).googletag?.cmd.push(() => {
          const gtag = (window as any).googletag;
          const slots = getInPageSlots(gtag);
          if (slots.length) {
            try { gtag.pubads().refresh(slots); } catch {}
          }
        });
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) onVisible(); // bfcache
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [pathname, search]);

  return null;
}
