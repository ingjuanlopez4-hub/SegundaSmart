// Development experiment only: Next.js SSR cannot be copied into webDir.
export function createConfig(value) {
  if (!value) throw new Error("Define ANDROID_POC_ORIGIN con el origen HTTPS del servidor de pruebas.");
  let url;
  try { url = new URL(value); } catch { throw new Error("ANDROID_POC_ORIGIN debe ser un origen HTTPS válido."); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Usa solo un origen HTTPS, sin credenciales, ruta, consulta ni fragmento.");
  }
  return {
    appId: "com.segundasmart.poc",
    appName: "SegundaSmart Prueba",
    webDir: "www",
    loggingBehavior: "none",
    includePlugins: [],
    server: {
      url: url.origin,
      appStartPath: "/login",
      cleartext: false,
      allowNavigation: [],
      errorPath: "connection-error.html",
    },
    android: {
      allowMixedContent: false,
      loggingBehavior: "none",
      useLegacyBridge: false,
      zoomEnabled: true,
    },
    plugins: {
      CapacitorCookies: { enabled: false },
      CapacitorHttp: { enabled: false },
      SystemBars: { insetsHandling: "native" },
    },
  };
}
