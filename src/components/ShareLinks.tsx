export function ShareLinks({ url, label }: { url: string; label: string }) {
  const message = encodeURIComponent(`${label}: ${url}`);
  return <div className="cluster" aria-label="Compartir">
    <a className="button" href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer">Compartir por WhatsApp</a>
    <a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Compartir en Facebook</a>
  </div>;
}
