import type { ZodIssue } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

export function collectFieldErrors(issues: Pick<ZodIssue, "path" | "message">[]): FieldErrors {
  const errors: FieldErrors = Object.create(null);
  for (const issue of issues) {
    const name = String(issue.path[0] ?? "");
    if (name && !errors[name]) errors[name] = issue.message;
  }
  return errors;
}

export function fieldErrorProps(errors: FieldErrors, name: string, hint?: string) {
  return {
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": [hint, errors[name] ? `${name}-error` : undefined].filter(Boolean).join(" ") || undefined,
  };
}

export function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
  // Follow keyboard/visual order, which need not match the schema's issue order.
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLElement && errors[element.getAttribute("name") ?? ""]) {
      element.focus();
      return;
    }
  }
}

export function FieldError({ errors, name }: { errors: FieldErrors; name: string }) {
  return errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;
}
