"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button className="link-button" disabled={pending} onClick={async () => { setPending(true); try { const response = await fetch("/api/auth/logout", { method: "POST" }); if (!response.ok) throw new Error(); router.push("/login"); router.refresh(); } catch { setPending(false); } }}>{pending ? "Saliendo…" : "Salir"}</button>;
}
