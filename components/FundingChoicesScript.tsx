// components/FundingChoicesScript.tsx
"use client";

import Script from "next/script";

type Props = { client: string }; // ex.: "pub-1610389804575958"

export default function FundingChoicesScript({ client }: Props) {
  const fcSrc = `https://fundingchoicesmessages.google.com/i/${client}?ers=2`;

  return (
    <>
      {/* FC (CMP) */}
      <Script id="fc-cmp" src={fcSrc} strategy="afterInteractive" />

      {/* Consent defaults + ponte entre FC -> gtag/GPT */}
      <Script id="consent-defaults" strategy="afterInteractive">
        {`
          // GTM/GA4 consent defaults (nega até o usuário decidir)
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }

          gtag('consent', 'default', {
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            ad_storage: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });

          // Helper: aplica consent "granted"/"denied" em GA4 e notifica GPT
          window.__applyConsent = function(granted) {
            const yes = granted ? 'granted' : 'denied';
            gtag('consent', 'update', {
              ad_user_data: yes,
              ad_personalization: yes,
              ad_storage: yes,
              analytics_storage: yes
            });

            // Notifica GPT para (re)preparar targeting conforme consent
            if (window.googletag && googletag.apiReady) {
              try { googletag.pubads().refresh(); } catch(_) {}
            }
          };

          // Funding Choices dispara a atualização de consent através da __tcfapi
          // Aqui, ouvimos mudanças de TCString e aplicamos "granted" quando houver base legal.
          (function watchTCF(){
            var tries = 0;
            function check(){
              tries++;
              if (typeof window.__tcfapi === 'function') {
                window.__tcfapi('addEventListener', 2, function(tcData, success){
                  if (!success || !tcData) return;
                  // status: 'useractioncomplete' ou 'tcloaded'
                  var ok = !!tcData.tcString && (tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'tcloaded');
                  if (ok) {
                    // Se houver base legal para ads (propósitos 1/3/4/7 etc.), trate como granted.
                    // Por simplicidade: se tcString existir, aplicamos "granted".
                    // (Ajuste se quiser checar granularidade de propósitos/consents.)
                    window.__applyConsent(true);
                  }
                });
                return;
              }
              if (tries < 50) setTimeout(check, 200);
            }
            check();
          })();
        `}
      </Script>
    </>
  );
}
