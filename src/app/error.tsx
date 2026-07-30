"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main id="contenido" className="narrow page stack"><h1>Algo no salió bien</h1><p>No pudimos cargar esta pantalla.</p><button className="button" onClick={reset}>Intentar de nuevo</button></main>;
}
