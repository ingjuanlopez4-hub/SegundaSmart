"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className="product-image">
    {failed ? <div className="photo-fallback" role="status"><span>Foto no disponible</span><button className="link-button" type="button" onClick={() => { setAttempt((value) => value + 1); setFailed(false); }}>Reintentar foto</button></div> : <Image key={attempt} src={src} alt={`Fotografía de ${name}`} fill sizes="(max-width: 559px) 112px, (max-width: 799px) 50vw, (max-width: 1100px) 35vw, 33vw" onError={() => setFailed(true)} />}
  </div>;
}
