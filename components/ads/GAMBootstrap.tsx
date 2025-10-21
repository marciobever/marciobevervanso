// components/ads/GAMBootstrap.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const INTERSTITIAL = '/23287346478/marciobevervanso.com/marciobevervanso.com_Interstitial';
const ANCHOR_TOP   = '/23287346478/marciobevervanso.com/marciobevervanso.com_Anchor';

type TCF = {
  eventStatus?: string;
  cmpStatus?: string;
  gdprApplies?: boolean | null;
  tcString?: string | null;
};

function loadGPTOnce() {
  if (document.querySelector('script[data-gpt]')) return;
  const s = document.createElement('script');
  s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  s.async = true;
  s.setAttribute('data-gpt', '1');
  s.referrerPolicy = 'origin';
  document.head.appendChild(s);
}

function waitTCF(maxMs = 2000): Promise<TCF | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const w = window as any;
      if (typeof w.__tcfapi === 'function') {
        try {
          w.__tcfapi('getTCData', 2, (data: any, ok: boolean) => {
            if (ok && data) {
              resolve({
                eventStatus: data.eventStatus,
                cmpStatus: data.cmpStatus,
                gdprApplies: data.gdprApplies,
                tcString: data.tcString || null,
              });
            } else resolve(null);
          });
          return;
        } catch {}
      }
      if (Date.now() - start >= maxMs) return resolve(null);
      setTimeout(tick, 120);
    };
    tick();
  });
}

/** retorna apenas slots in-page (com elementId) — evita tentar refresh em OOP */
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

    // ===== 1) Boot global uma única vez por aba =====
    if (!w.__gamBooted) {
      w.__gamBooted = true;
      loadGPTOnce();

      (async () => {
        const tcf0 = await waitTCF(2000);

        w.googletag.cmd.push(function () {
          const gtag = w.googletag;
          const pubads = gtag.pubads();

          // estado inicial: seguro para GDPR até CMP responder
          try {
            const gdpr = tcf0?.gdprApplies === true;
            const hasTC = !!tcf0?.tcString;
            if (gdpr && !hasTC) {
              pubads.setPrivacySettings({
                nonPersonalizedAds: true,
                limitedAds: true,
              } as any);
            }
          } catch {}

          pubads.disableInitialLoad();
          pubads.enableSingleRequest();
          pubads.enableLazyLoad({
            fetchMarginPercent: 20,
            renderMarginPercent: 10,
            mobileScaling: 2.0,
          });
          pubads.setCentering(true);

          gtag.enableServices();

          // quando CMP liberar TCString, volta para PA
          try {
            if (typeof w.__tcfapi === 'function') {
              w.__tcfapi('addEventListener', 2, (data: any, ok: boolean) => {
                if (!ok || !data) return;
                const done =
                  data.eventStatus === 'useractioncomplete' ||
                  data.eventStatus === 'tcloaded';
                if (!done) return;

                const hasTC = !!data.tcString;
                try {
                  pubads.setPrivacySettings({
                    nonPersonalizedAds: !hasTC,
                    limitedAds: !hasTC,
                  } as any);
                } catch {}

                // refresh apenas de slots in-page
                const slots = getInPageSlots(gtag);
                if (slots.length) try { pubads.refresh(slots); } catch {}
              });
            }
          } catch {}
        });
      })();
    }

    // ===== 2) Boot por rota (pathname + search) =====
    const bootKey = `${pathname}?${search?.toString() || ''}`;
    if (bootKeyRef.current === bootKey) return;
    bootKeyRef.current = bootKey;

    w.googletag.cmd.push(function () {
      const gtag = w.googletag;
      const pubads = gtag.pubads();

      // Definir OOP só uma vez por aba (evita múltiplos anchors/interstitial)
      try {
        if (!oopDisplayed.current.inter) {
          const inter = gtag.defineOutOfPageSlot(
            INTERSTITIAL,
            (gtag as any).enums?.OutOfPageFormat?.INTERSTITIAL || 1
          );
          if (inter) {
            inter.addService(pubads);
            // interstitial: exibir apenas 1x por aba para não travar UX
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

      // refresh leve após navegação — SOMENTE slots in-page
      const kick = () => {
        const slots = getInPageSlots(gtag);
        if (slots.length) try { pubads.refresh(slots); } catch {}
      };

      // deixa o layout assentar e não bloquear TTI
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(kick, { timeout: 1200 });
      } else {
        setTimeout(kick, 300);
      }
    });

    // ===== 3) Retomada ao voltar/ficar visível =====
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        (window as any).googletag?.cmd.push(() => {
          const gtag = (window as any).googletag;
          const slots = getInPageSlots(gtag);
          if (slots.length) try { gtag.pubads().refresh(slots); } catch {}
        });
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) onVisible();
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
