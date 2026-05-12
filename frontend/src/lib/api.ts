export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Lit le message d'erreur FastAPI (detail string ou liste de validation). */
export async function readApiError(r: Response): Promise<string> {
  const raw = await r.text();
  try {
    const data = JSON.parse(raw) as { detail?: unknown };
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return (
        d
          .map((x: { msg?: string }) => x?.msg)
          .filter(Boolean)
          .join(", ") || raw
      );
    if (d != null) return String(d);
  } catch {
    /* ignore */
  }
  return raw || r.statusText || "Erreur";
}
