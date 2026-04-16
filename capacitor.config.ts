import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAP_SERVER_URL;

/**
 * Without a matching entry, Capacitor iOS treats top-level navigations to non-app hosts as external
 * and calls `UIApplication.open` → Safari (see WebViewDelegationHandler).
 *
 * Stripe uses many hosts (`*.stripe.com`, `*.stripe.network`, nested subdomains, 3DS/wallet redirects).
 * Wildcards like `*.stripe.com` do NOT match `a.b.stripe.com` (segment-count rules), and miss
 * `stripe.network` entirely — so listing domains is fragile. `"*"` keeps payment flows in the WebView.
 */
const PAYMENT_ALLOW_NAVIGATION = ["*"];

const config: CapacitorConfig = {
  appId: "com.nowaste.app",
  appName: "NoWaste",
  // Capacitor requires webDir to contain index.html. Next's `.next` output does not.
  // Live dev uses server.url (see CAP_SERVER_URL); this folder is the sync'd shell.
  webDir: "www",
  ios: {
    contentInset: "automatic",
  },
  server: {
    allowNavigation: PAYMENT_ALLOW_NAVIGATION,
    ...(serverUrl
      ? {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        }
      : {}),
  },
};

export default config;
