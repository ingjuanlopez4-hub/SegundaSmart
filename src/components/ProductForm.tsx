"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export function ProductForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("La fotografía debe ser JPG, PNG o WebP. Elige otro archivo.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La fotografía supera 5 MB. Elige una imagen más pequeña.");
      event.target.value = "";
      return;
    }
    setError("");
    setPreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(file); });
  }

  async function generate(form: HTMLFormElement) {
    setError(""); setNotice(""); setAiPending(true);
    const data = new FormData(form);
    const requiredForSuggestion = ["name", "category", "cost"] as const;
    const missing = requiredForSuggestion.find((field) => !String(data.get(field) ?? "").trim());
    if (missing) {
      const field = form.elements.namedItem(missing) as HTMLInputElement;
      setError(`Completa ${missing === "name" ? "el nombre" : missing === "category" ? "la categoría" : "el costo"} antes de crear una sugerencia.`);
      field.focus();
      setAiPending(false);
      return;
    }
    try {
      const response = await fetch("/api/ai/sugerir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), category: data.get("category"), condition: data.get("condition"), cost: data.get("cost") }) });
      const result = (await response.json()) as { description?: string; suggestedPrice?: string; source?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo crear la sugerencia");
      const description = form.elements.namedItem("description") as HTMLTextAreaElement;
      const suggested = form.elements.namedItem("suggestedPrice") as HTMLInputElement;
      const price = form.elements.namedItem("price") as HTMLInputElement;
      const hadDescription = Boolean(description.value.trim());
      if (!description.value.trim()) description.value = result.description ?? "";
      suggested.value = result.suggestedPrice ?? "";
      if (!price.value) price.value = result.suggestedPrice ?? "";
      setNotice(`${result.source === "ai" ? "Sugerencia creada con IA" : "Sugerencia local creada"}. ${hadDescription ? "Conservamos la descripción que ya habías escrito." : "Puedes editarla."}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la sugerencia"); }
    finally { setAiPending(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/productos", { method: "POST", body: new FormData(event.currentTarget) });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el producto");
      router.push("/app/inventario?creado=1"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar el producto"); setPending(false); }
  }

  return <form className="intake-form stack" onSubmit={submit}>
    <fieldset className="form-section"><legend><span>1</span><strong>Fotografía e identidad</strong><small>Lo que hace reconocible esta pieza</small></legend><div className="form-section-body form-grid">
      <div className="field photo-field full"><label htmlFor="photo">Fotografía principal</label><div className={`photo-input ${preview ? "has-preview" : ""}`}>{preview ? <Image src={preview} alt="Vista previa de la pieza" fill sizes="(max-width: 760px) 100vw, 45vw" unoptimized /> : <div><span aria-hidden="true">+</span><strong>Toma o elige una foto</strong><small>La imagen será la portada del catálogo</small></div>}<input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required onChange={selectPhoto} /></div><span className="hint">JPG, PNG o WebP; máximo 5 MB.</span></div>
      <div className="field"><label htmlFor="name">Nombre de la pieza</label><input id="name" name="name" required minLength={2} maxLength={120} placeholder="Ej. Cámara instantánea" /></div>
      <div className="field"><label htmlFor="category">Categoría</label><input id="category" name="category" required minLength={2} maxLength={60} placeholder="Ej. Fotografía" /></div>
      <div className="field full"><label htmlFor="condition">Estado físico</label><select id="condition" name="condition" required defaultValue="Buen estado"><option>Como nuevo</option><option>Buen estado</option><option>Con detalles</option></select></div>
    </div></fieldset>
    <fieldset className="form-section"><legend><span>2</span><strong>Valor</strong><small>Lo que pagaste y lo que quieres recibir</small></legend><div className="form-section-body form-grid">
      <div className="field"><label htmlFor="cost">Costo (MXN)</label><input id="cost" name="cost" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" required placeholder="0.00" /></div>
      <div className="field"><label htmlFor="price">Precio de venta (MXN)</label><input id="price" name="price" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required placeholder="0.00" /></div>
      <div className="field full"><label htmlFor="suggestedPrice">Precio sugerido (MXN)</label><input id="suggestedPrice" name="suggestedPrice" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" placeholder="Se completa al pedir una sugerencia" /><span className="hint">Es una referencia editable, no cambia tu precio final.</span></div>
    </div></fieldset>
    <fieldset className="form-section"><legend><span>3</span><strong>Ficha publicable</strong><small>El texto que verá quien abra tu catálogo</small></legend><div className="form-section-body">
      <div className="field"><label htmlFor="description">Descripción</label><textarea id="description" name="description" required minLength={10} maxLength={1200} placeholder="Describe materiales, medidas y detalles visibles." /></div>
    </div></fieldset>
    {error && <div className="alert" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}</div>}
    <div className="form-actions"><button type="button" className="button secondary" disabled={aiPending || pending} onClick={(event) => generate(event.currentTarget.form!)}>{aiPending ? "Creando sugerencia…" : "Sugerir texto y precio"}</button><button className="button" disabled={pending || aiPending}>{pending ? "Guardando pieza…" : "Guardar pieza"}</button></div>
  </form>;
}
