import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.nowaste.app",
  appName: "NoWaste",
  // Capacitor requires webDir to contain index.html. Next's `.next` output does not.
  // Live dev uses server.url (see CAP_SERVER_URL); this folder is the sync'd shell.
  webDir: "www",
  ios: {
    contentInset: "automatic",
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
