async function fetchJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(await r.text() || "Request failed");
  return r.json();
}

export const getStats = () => fetchJson("/api/stats");
export const getTrades = (params = "") => fetchJson(`/api/trades?${params}`);
export const getPoliticians = (params = "") => fetchJson(`/api/politicians?${params}`);
export const getNetWorth = () => fetchJson("/api/networth");
export const getSpending = () => fetchJson("/api/spending");
export const getBills = (params = "") => fetchJson(`/api/bills?${params}`);
export const getCommittees = (params = "") => fetchJson(`/api/committees?${params}`);
export const getPoliticianDetail = (name) => fetchJson(`/api/politician/${encodeURIComponent(name)}`);
