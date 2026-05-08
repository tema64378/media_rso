const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

export async function register(payload: {email: string, password: string, name?: string, role?: string}) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function login(payload: {email: string, password: string}) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function me(token: string) {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
