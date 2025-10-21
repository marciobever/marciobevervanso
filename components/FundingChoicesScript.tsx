// components/FundingChoicesScript.tsx
'use client';
import Script from 'next/script';

type Props = { client: string }; // ex.: "pub-1610389804575958" (Ad Manager)

export default function FundingChoicesScript({ client }: Props) {
  const pub = (client || '').trim();

  return (
    <>
      {/* Stub IAB TCF + locator (sem TypeScript no inline) */}
      <Script id="fc-tcf-stub" strategy="beforeInteractive">
        {`
(function () {
  var w = window;
  function addLocator() {
    if (!w.frames['__tcfapiLocator']) {
      var i = document.createElement('iframe');
      i.style.display = 'none';
      i.name = '__tcfapiLocator';
      document.body && document.body.appendChild(i);
    }
  }
  if (document.body) addLocator();
  else document.addEventListener('DOMContentLoaded', addLocator);

  var queue = [];
  function tcf() {
    var args = arguments;
    if (typeof w.__tcfapi === 'function' && !w.__tcfapi.isStub) {
      return w.__tcfapi.apply(w, args);
    }
    queue.push(args);
  }
  tcf.isStub = true;
  tcf.q = queue;
  if (!w.__tcfapi) w.__tcfapi = tcf;

  w.addEventListener('message', function (event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.__tcfapiCall) {
        var ret = { __tcfapiReturn: { returnValue: null, success: false, callId: data.__tcfapiCall.callId } };
        try {
          w.__tcfapi(data.__tcfapiCall.command, data.__tcfapiCall.version, function (rv, ok) {
            ret.__tcfapiReturn.returnValue = rv;
            ret.__tcfapiReturn.success = ok;
            event.source && event.source.postMessage(JSON.stringify(ret), '*');
          }, data.__tcfapiCall.parameter);
        } catch (e) {
          event.source && event.source.postMessage(JSON.stringify(ret), '*');
        }
      }
    } catch (e) {}
  });

  // Sinal usado por tags Google
  (window as any).signalGooglefcPresent = function () {};
})();
        `}
      </Script>

      {/* Loader oficial do Funding Choices (Consent Mode ativo) */}
      <Script
        id="fc-loader"
        src={`https://fundingchoicesmessages.google.com/i/${pub}/cmp.js?tagging=1`}
        strategy="beforeInteractive"
        async
      />
    </>
  );
}
