import type { CapacitorConfig } from "@capacitor/cli";

/**
 * O app roda como WebView apontando para o servidor Next na VPS.
 * Isso e obrigatorio: as paginas sao server components e as mutations
 * sao server actions — nao existe bundle estatico para embarcar.
 *
 * Trocar a URL via env CAPACITOR_SERVER_URL antes de rodar `npx cap sync`.
 */
const SERVER_URL =
  process.env.CAPACITOR_SERVER_URL ?? "https://skatoday.fewcompany.com";

const config: CapacitorConfig = {
  appId: "com.fewcompany.skatoday",
  appName: "skatoday",
  // Shell local: so e exibido se o servidor estiver inacessivel.
  webDir: "capacitor-shell",
  server: {
    url: SERVER_URL,
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    // Restringe a navegacao ao proprio dominio; qualquer outro link
    // abre no browser do sistema em vez de dentro do app.
    allowNavigation: [new URL(SERVER_URL).host],
  },
  android: {
    backgroundColor: "#0a0a0b",
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: "#0a0a0b",
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0a0a0b",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0b",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
