// types/ads.d.ts
export {}

declare global {
  interface Window {
    googletag?: any
    __gamBootstrapped?: boolean
    __gptSlots?: Record<string, any>
  }
}
