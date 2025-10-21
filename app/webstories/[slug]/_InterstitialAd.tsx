'use client';

import { useEffect, useState } from "react";

export default function InterstitialAd({
  adClient,
  adSlot,
  delay = 2000,
  frequency = "session", // "always" | "session" | "once"
}: {
  adClient?: string;
  adSlot?: string;
  delay?: number;
  frequency?: "always" | "session" | "once";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = "ws_interstitial_shown";
    if (frequency === "once" && localStorage.getItem(key)) return;
    if (frequency === "session" && sessionStorage.getItem(key)) return;

    const t = setTimeout(() => {
      setOpen(true);
      if (frequency === "once") localStorage.setItem(key, "1");
      if (frequency === "session") sessionStorage.setItem(key, "1");
    }, delay);

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);

    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); };
  }, [delay, frequency]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-[min(92vw,420px)] aspect-[9/16] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // impede fechar ao clicar dentro
      >
        {/* botão fechar */}
        <button
          aria-label="Fechar anúncio"
          onClick={() => setOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/75 text-white px-3 py-1 text-xs hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
        >
          Fechar
        </button>

        {/* Conteúdo do anúncio */}
        {/* Se usar AdSense normal, ele não rende bem como interstitial fora do AMP.
            Você pode colocar um criativo estático/iframe próprio aqui.
            Exemplo simples: */}
        <a
          href="https://seu-anunciante.exemplo/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src="https://dummyimage.com/720x1280/111/fff&text=Seu+Anuncio+9:16"
            alt="Anúncio"
            className="h-full w-full object-cover"
          />
        </a>
      </div>
    </div>
  );
}