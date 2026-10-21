"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validation";
import { collectFieldErrors, FieldError, fieldErrorProps, focusFirstError, type FieldErrors } from "./form-errors";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const saving = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = event.currentTarget;
    // Capture before disabling any successful controls.
    const body = Object.fromEntries(new FormData(form));
    const input = (mode === "register" ? registerSchema : loginSchema).safeParse(body);
    if (!input.success) {
      const errors = collectFieldErrors(input.error.issues);
      setFieldErrors(errors);
      setError("Revisa los campos indicados para continuar.");
      focusFirstError(form, errors);
      return;
    }
    saving.current = true;
    setFieldErrors({});
    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos continuar");
      router.push("/app");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos continuar");
      setPending(false);
      saving.current = false;
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate aria-busy={pending} aria-describedby={error ? "form-error" : undefined}>
      {mode === "register" && <>
        <div className="field"><label htmlFor="name">Tu nombre</label><input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" disabled={pending} {...fieldErrorProps(fieldErrors, "name")} /><FieldError errors={fieldErrors} name="name" /></div>
        <div className="field"><label htmlFor="businessName">Nombre del negocio</label><input id="businessName" name="businessName" required minLength={2} maxLength={100} autoComplete="organization" disabled={pending} {...fieldErrorProps(fieldErrors, "businessName")} /><FieldError errors={fieldErrors} name="businessName" /></div>
      </>}
      <div className="field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" disabled={pending} {...fieldErrorProps(fieldErrors, "email")} /><FieldError errors={fieldErrors} name="email" /></div>
      <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required minLength={mode === "register" ? 8 : 1} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"} disabled={pending} {...fieldErrorProps(fieldErrors, "password", "password-hint")} /><span className="hint" id="password-hint">{mode === "register" ? "Mínimo 8 caracteres." : ""}</span><FieldError errors={fieldErrors} name="password" /></div>
      {error && <div id="form-error" role="alert" className="alert">{error}</div>}
      <button className="button" disabled={pending}>{pending ? "Guardando…" : mode === "login" ? "Entrar" : "Crear mi negocio"}</button>
    </form>
  );
}
