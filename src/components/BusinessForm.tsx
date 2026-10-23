"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { businessSchema } from "@/lib/validation";
import { collectFieldErrors, FieldError, fieldErrorProps, focusFirstError, type FieldErrors } from "./form-errors";

export function BusinessForm({ businesses, activeId }: { businesses: { id: string; name: string }[]; activeId: string }) {
  const router = useRouter();
  const saving = useRef(false);
  const requestKey = useRef("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function send(url: string, body?: unknown) {
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos abrir el negocio");
      router.push("/app");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos continuar. Intenta de nuevo.");
      saving.current = false;
      setPending(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    requestKey.current ||= crypto.randomUUID();
    const form = event.currentTarget;
    const input = businessSchema.safeParse({ name: new FormData(form).get("name"), requestKey: requestKey.current });
    if (!input.success) {
      const errors = collectFieldErrors(input.error.issues);
      setFieldErrors(errors);
      focusFirstError(form, errors);
      return;
    }
    setFieldErrors({});
    void send("/api/negocios", input.data);
  }

  return <div className="stack" aria-busy={pending}>
    <form className="stack" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="name">Nombre del negocio</label><input id="name" name="name" required minLength={2} maxLength={100} autoComplete="organization" disabled={pending} {...fieldErrorProps(fieldErrors, "name")} /><FieldError errors={fieldErrors} name="name" /></div>
      <p className="hint">Serás el propietario. Tus otros negocios conservarán sus piezas y ventas.</p>
      <button className="button" disabled={pending}>{pending ? "Abriendo negocio…" : "Crear y abrir negocio"}</button>
    </form>
    {error && <div role="alert" className="alert">{error}</div>}
    <section className="stack" aria-labelledby="owned-businesses"><h2 id="owned-businesses">Tus negocios</h2>
      {businesses.map((business) => <div className="stack" key={business.id}><strong>{business.name}</strong>{business.id === activeId ? <span className="hint">Negocio actual</span> : <button className="button secondary" disabled={pending} onClick={() => void send(`/api/negocios/${business.id}`)}>Abrir {business.name}</button>}</div>)}
    </section>
  </div>;
}
