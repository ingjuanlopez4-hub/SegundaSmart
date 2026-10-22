"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import { aiSchema, productSchema } from "@/lib/validation";
import { collectFieldErrors, FieldError, fieldErrorProps, focusFirstError, type FieldErrors } from "./form-errors";

export function ProductForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const suggestionRequest = useRef<AbortController | null>(null);
  const saving = useRef(false);
  const [condition, setCondition] = useState("Buen estado");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [suggestedRange, setSuggestedRange] = useState<{ min: string; max: string; explanation: string } | null>(null);

  const costCents = toCents(cost);
  const priceCents = toCents(price);
  const estimatedProfit = costCents !== null && priceCents !== null ? priceCents - costCents : null;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { suggestionRequest.current?.abort(); suggestionRequest.current = null; }, []);

  function cancelSuggestion() {
    suggestionRequest.current?.abort();
    suggestionRequest.current = null;
    setAiPending(false);
    setNotice("Sugerencia cancelada. Puedes completar y guardar la pieza manualmente.");
  }

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) { setPreview(""); setPhotoError(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("La fotografía debe ser JPG, PNG o WebP. Elige otro archivo.");
      setPreview("");
      event.target.value = "";
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setPhotoError(file.size === 0 ? "La fotografía está vacía. Elige otro archivo." : "La fotografía supera 5 MB. Elige una imagen más pequeña.");
      setPreview("");
      event.target.value = "";
      return;
    }
    setPhotoError("");
    setPreview(URL.createObjectURL(file));
  }

  async function generate(form: HTMLFormElement) {
    if (suggestionRequest.current || saving.current) return;
    setError(""); setNotice("");
    const data = new FormData(form);
    const requiredForSuggestion = ["name", "category", "cost"] as const;
    const input = aiSchema.safeParse(Object.fromEntries(data));
    const missing = input.success ? undefined : String(input.error.issues[0]?.path[0]);
    if (missing) {
      const field = form.elements.namedItem(missing) as HTMLInputElement;
      setError(`Revisa ${missing === "name" ? "el nombre (al menos 2 caracteres)" : missing === "category" ? "la categoría (al menos 2 caracteres)" : "el costo (de 0 a 1,000,000 MXN, con hasta 2 decimales)"} antes de crear una sugerencia.`);
      field.focus();
      return;
    }
    const controller = new AbortController();
    suggestionRequest.current = controller;
    setAiPending(true);
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/ai/sugerir", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), category: data.get("category"), condition: data.get("condition"), cost: data.get("cost") }) });
      const result = (await response.json()) as { description?: string; suggestedPrice?: string; suggestedMin?: string; suggestedMax?: string; explanation?: string; source?: string; error?: string };
      if (controller.signal.aborted || suggestionRequest.current !== controller || saving.current) return;
      if (!response.ok) throw new Error(result.error ?? "No se pudo crear la sugerencia");
      const currentData = new FormData(form);
      if ([...requiredForSuggestion, "condition"].some((name) => currentData.get(name) !== data.get(name))) {
        setNotice("Los datos de la pieza cambiaron. Pide otra sugerencia para usar la información actual.");
        return;
      }
      const description = form.elements.namedItem("description") as HTMLTextAreaElement;
      const hadDescription = Boolean(description.value.trim());
      if (!description.value.trim()) description.value = result.description ?? "";
      setSuggestedPrice(result.suggestedPrice ?? "");
      const currentPrice = form.elements.namedItem("price") as HTMLInputElement;
      if (!currentPrice.value) setPrice(result.suggestedPrice ?? "");
      setSuggestedRange(null);
      if (result.suggestedMin && result.suggestedMax && result.explanation) {
        setSuggestedRange({ min: result.suggestedMin, max: result.suggestedMax, explanation: result.explanation });
      }
      setNotice(`${result.source === "ai" ? "Sugerencia creada con IA" : "Sugerencia local creada"}. ${hadDescription ? "Conservamos la descripción que ya habías escrito." : "Puedes editarla."} No es una tasación.`);
    } catch {
      if (suggestionRequest.current === controller) setError(controller.signal.aborted
        ? "La sugerencia tardó demasiado. Puedes reintentar o completar y guardar la pieza manualmente."
        : "No se pudo crear la sugerencia. Tus datos siguen aquí: reintenta o completa y guarda la pieza manualmente.");
    } finally {
      window.clearTimeout(timeout);
      if (suggestionRequest.current === controller) {
        suggestionRequest.current = null;
        setAiPending(false);
      }
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    const input = productSchema.safeParse(Object.fromEntries(body));
    const errors = input.success ? {} : collectFieldErrors(input.error.issues);
    const photo = body.get("photo");
    const invalidPhoto = !(photo instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size === 0 || photo.size > 5 * 1024 * 1024;
    const nextPhotoError = invalidPhoto ? photoError || "Agrega una fotografía JPG, PNG o WebP de hasta 5 MB, que no esté vacía." : "";
    setFieldErrors(errors);
    setPhotoError(nextPhotoError);
    if (!input.success || invalidPhoto) {
      setError("Revisa los campos indicados antes de guardar la pieza.");
      focusFirstError(form, { ...errors, ...(nextPhotoError ? { photo: nextPhotoError } : {}) });
      return;
    }
    // FormData includes the file and every field BEFORE pending disables controls.
    saving.current = true;
    suggestionRequest.current?.abort();
    suggestionRequest.current = null;
    setAiPending(false);
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/productos", { method: "POST", body });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el producto");
      router.push("/app/inventario?creado=1"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar el producto"); saving.current = false; setPending(false); }
  }

  return <form className="intake-form stack" onSubmit={submit} noValidate aria-busy={pending}>
    <fieldset className="form-section" disabled={pending}><legend><span>1</span><strong>Conoce la pieza</strong><small>Fotografía y detalles que la hacen única</small></legend><div className="form-section-body form-grid">
      <div className="field photo-field full"><label htmlFor="photo">Fotografía principal</label><div className={`photo-input ${preview ? "has-preview" : ""}`}>{preview ? <Image src={preview} alt="Vista previa de la pieza" fill sizes="(max-width: 760px) 100vw, 45vw" unoptimized /> : <div><span aria-hidden="true">+</span><strong>Toma o elige una foto</strong><small>La imagen será la portada del catálogo</small></div>}<input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required aria-invalid={Boolean(photoError)} aria-describedby={`photo-hint${photoError ? " photo-error" : ""}`} onChange={selectPhoto} /></div><span className="hint" id="photo-hint">JPG, PNG o WebP; máximo 5 MB.{preview && " Toca la foto para cambiarla."}</span>{photoError && <span className="field-error" id="photo-error" role="alert">{photoError}</span>}</div>
      <div className="field"><label htmlFor="name">Nombre de la pieza</label><input id="name" name="name" required minLength={2} maxLength={120} placeholder="Ej. Cámara instantánea" {...fieldErrorProps(fieldErrors, "name")} /><FieldError errors={fieldErrors} name="name" /></div>
      <div className="field"><label htmlFor="category">Categoría</label><input id="category" name="category" required minLength={2} maxLength={60} placeholder="Ej. Fotografía" {...fieldErrorProps(fieldErrors, "category")} /><FieldError errors={fieldErrors} name="category" /></div>
      <div className="field full"><label htmlFor="condition">Estado físico</label><select id="condition" name="condition" required value={condition} onChange={(event) => setCondition(event.target.value)} {...fieldErrorProps(fieldErrors, "condition")}><option>Como nuevo</option><option>Buen estado</option><option>Con detalles</option></select><FieldError errors={fieldErrors} name="condition" /></div>
      <div className="field full"><label htmlFor="defects">Defectos o detalles visibles {condition !== "Con detalles" && <span className="muted">(opcional)</span>}</label><textarea id="defects" name="defects" required={condition === "Con detalles"} maxLength={600} {...fieldErrorProps(fieldErrors, "defects", "defects-hint")} placeholder="Ej. Rasguño de 2 cm en el costado; funciona correctamente." /><span className="hint" id="defects-hint">Si eliges “Con detalles”, describe aquí lo que la persona compradora debe saber.</span><FieldError errors={fieldErrors} name="defects" /></div>
    </div></fieldset>
    <fieldset className="form-section" disabled={pending}><legend><span>2</span><strong>Valor</strong><small>Lo que pagaste y lo que quieres recibir</small></legend><div className="form-section-body form-grid">
      <div className="field"><label htmlFor="cost">Costo (MXN)</label><input id="cost" name="cost" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" required placeholder="0.00" value={cost} onChange={(event) => setCost(event.target.value)} {...fieldErrorProps(fieldErrors, "cost")} /><FieldError errors={fieldErrors} name="cost" /></div>
      <div className="field"><label htmlFor="price">Precio de venta (MXN)</label><input id="price" name="price" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} {...fieldErrorProps(fieldErrors, "price")} /><FieldError errors={fieldErrors} name="price" /></div>
      <div className="field full"><label htmlFor="suggestedPrice">Precio orientativo (MXN)</label><input id="suggestedPrice" name="suggestedPrice" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" placeholder="Se completa al pedir una sugerencia" value={suggestedPrice} onChange={(event) => setSuggestedPrice(event.target.value)} {...fieldErrorProps(fieldErrors, "suggestedPrice", "suggestedPrice-hint")} /><span className="hint" id="suggestedPrice-hint">Es una referencia editable, no una tasación, y no cambia tu precio final.</span><FieldError errors={fieldErrors} name="suggestedPrice" />{suggestedRange && <div className="estimate-note" role="status"><strong>Rango orientativo: ${suggestedRange.min}–${suggestedRange.max} MXN</strong><span>{suggestedRange.explanation}</span></div>}</div>
      <div className="field full"><div className="estimate-note" aria-live="polite"><span>Ganancia estimada al precio de venta</span><strong>{estimatedProfit === null ? "Completa costo y precio" : formatMoney(estimatedProfit)}</strong><small>Precio de venta menos costo; no incluye otros gastos.</small></div></div>
    </div></fieldset>
    <fieldset className="form-section" disabled={pending}><legend><span>3</span><strong>Ficha publicable</strong><small>El texto que verá quien abra tu catálogo</small></legend><div className="form-section-body">
      <div className="field"><label htmlFor="description">Descripción</label><textarea id="description" name="description" required minLength={10} maxLength={1200} placeholder="Describe materiales, medidas y detalles visibles." {...fieldErrorProps(fieldErrors, "description")} /><FieldError errors={fieldErrors} name="description" /></div>
    </div></fieldset>
    {error && <div className="alert" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}</div>}
    <div className="form-actions">{aiPending ? <button type="button" className="button secondary" onClick={cancelSuggestion}>Cancelar sugerencia</button> : <button type="button" className="button secondary" disabled={pending} onClick={(event) => generate(event.currentTarget.form!)}>Sugerir texto y precio</button>}<button className="button" disabled={pending}>{pending ? "Guardando pieza…" : "Guardar pieza"}</button><span className="hint full" role="status">{aiPending ? "Creando sugerencia… Puedes seguir editando o guardar sin esperar." : "La sugerencia es opcional. Tú decides el texto y el precio final."}</span></div>
  </form>;
}

function toCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}
