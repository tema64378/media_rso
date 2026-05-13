const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
const TIMEOUT = 10000;

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout?: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout || TIMEOUT);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function register(payload: {email: string, password: string, name?: string, role?: string, team_name?: string, squad_name?: string, federal_district?: string, position?: string}) {
  const res = await fetchWithTimeout(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function login(payload: {email: string, password: string}) {
  const res = await fetchWithTimeout(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function me(token: string) {
  const res = await fetchWithTimeout(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateProfile(token: string, payload: Record<string, any>) {
  const res = await fetchWithTimeout(`${BASE}/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getPdConsent(token: string) {
  const res = await fetchWithTimeout(`${BASE}/me/pd-consent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createMediaTeam(token: string, partnerEmail: string) {
  const res = await fetchWithTimeout(`${BASE}/media-teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ partner_email: partnerEmail }),
  });
  return res.json();
}

export async function getMyTeam(token: string) {
  const res = await fetchWithTimeout(`${BASE}/media-teams/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function leaveMediaTeam(token: string) {
  const res = await fetchWithTimeout(`${BASE}/media-teams/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function searchUsers(token: string, query: string) {
  const res = await fetchWithTimeout(`${BASE}/users/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}