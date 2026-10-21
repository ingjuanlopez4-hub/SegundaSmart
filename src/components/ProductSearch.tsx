"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { startQrScannerSession } from "./qr-scanner-session";

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export function ProductSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelScanRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  function stopScanner() {
    cancelScanRef.current?.();
    cancelScanRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    setCanScan(Boolean((window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector && navigator.mediaDevices?.getUserMedia));
    return () => {
      cancelScanRef.current?.();
      cancelScanRef.current = null;
    };
  }, []);

  function startScanner() {
    const BarcodeDetector = (window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    const video = videoRef.current;
    if (!BarcodeDetector || !video || cancelScanRef.current) return;
    setScanError("");
    setScanning(true);
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      cancelScanRef.current = startQrScannerSession({
        video,
        getStream: () => navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
        detector,
        onResult: (value) => {
          setQuery(value);
          stopScanner();
          router.push(`${pathname}?q=${encodeURIComponent(value)}`);
        },
        onError: () => {
          stopScanner();
          setScanError("No pudimos usar la cámara o leer el código. Puedes pegar la URL del QR o buscar por nombre o referencia.");
        },
      });
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
    <div className="scanner-panel" hidden={!scanning}><video ref={videoRef} muted playsInline aria-label="Vista de cámara para escanear el código QR" /><p>Apunta la cámara al QR de la pieza.</p></div>
    {scanError && <div className="alert" role="alert">{scanError}</div>}
  </section>;
}
