"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export function ProductSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  function stopScanner() {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    setCanScan(Boolean((window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector && navigator.mediaDevices?.getUserMedia));
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startScanner() {
    const BarcodeDetector = (window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!BarcodeDetector) return;
    setScanError("");
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("No se pudo iniciar la cámara");
      video.srcObject = stream;
      await video.play();
      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      const detect = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            const value = codes[0].rawValue;
            setQuery(value);
            stopScanner();
            router.push(`${pathname}?q=${encodeURIComponent(value)}`);
            return;
          }
        } catch {
          setScanError("No pudimos leer el código. Puedes pegar la URL o buscar por nombre o referencia.");
        }
        scanTimerRef.current = setTimeout(detect, 250);
      };
      await detect();
    } catch {
      stopScanner();
      setScanError("No pudimos usar la cámara. Puedes pegar la URL del QR o buscar por nombre o referencia.");
    }
  }

  return <section className="product-search" aria-label="Buscar piezas">
    <form role="search" method="get" action={pathname} className="search-row">
      <div className="field"><label htmlFor="product-search">Nombre, referencia o URL del QR</label><input id="product-search" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={240} placeholder="Ej. Cámara, PZ-… o pega la URL" /></div>
      <button className="button" type="submit">Buscar</button>
      {initialQuery && <a className="button secondary" href={pathname}>Limpiar</a>}
    </form>
    {canScan && <button className="button secondary scan-button" type="button" onClick={scanning ? stopScanner : startScanner}>{scanning ? "Cerrar cámara" : "Escanear QR"}</button>}
    {scanning && <div className="scanner-panel"><video ref={videoRef} muted playsInline aria-label="Vista de cámara para escanear el código QR" /><p>Apunta la cámara al QR de la pieza.</p></div>}
    {scanError && <div className="alert" role="alert">{scanError}</div>}
  </section>;
}
