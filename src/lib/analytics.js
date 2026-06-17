// Thin wrapper around the GA4 gtag() call already loaded in index.html.
// Centralized here so every component fires events the same way and the
// "is gtag ready" check only lives in one place.
export function trackEvent(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
