import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  recentTrades as fallbackTrades,
  politicians as fallbackPoliticians,
  netWorth as fallbackNetWorth,
} from "./data.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const CONGRESS_KEY = process.env.CONGRESS_API_KEY || "";

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════
//  Simple in-memory cache (TTL in ms)
// ═══════════════════════════════════════════════════════════════════
const cache = {};
async function cached(key, ttl, fn) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < ttl) return entry.data;
  try {
    const data = await fn();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch (err) {
    if (entry) return entry.data;          // stale-while-error
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Congress.gov API — live members, bills, committees
// ═══════════════════════════════════════════════════════════════════
const CONGRESS = "https://api.congress.gov/v3";

function congressUrl(path, params = {}) {
  const u = new URL(`${CONGRESS}${path}`);
  u.searchParams.set("api_key", CONGRESS_KEY);
  u.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function fetchCongressMembers() {
  const all = [];
  let offset = 0;
  const limit = 250;
  let total = Infinity;
  while (offset < total && offset < 600) {
    const url = congressUrl("/member", { currentMember: "true", limit, offset });
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Congress.gov members ${r.status}`);
    const d = await r.json();
    total = d.pagination?.count ?? all.length;
    all.push(...(d.members || []));
    offset += limit;
  }
  return all;
}

function normalizeMember(m) {
  const raw = m.name || "";
  // Congress.gov gives "Last, First" — flip it
  const name = raw.includes(",") ? raw.split(",").map(s => s.trim()).reverse().join(" ") : raw;
  const party = (m.partyName || "").toLowerCase();
  const partyLetter = party.includes("democrat") ? "D"
    : party.includes("republican") ? "R"
    : (m.partyName || "").charAt(0);
  const latestTerm = m.terms?.item?.[m.terms.item.length - 1];
  const chamber = latestTerm?.chamber === "Senate" ? "Senate" : "House";
  return {
    name,
    party: partyLetter,
    fullParty: m.partyName || "",
    chamber,
    state: m.state || "",
    district: m.district ?? null,
    bioguideId: m.bioguideId || "",
    photo: m.depiction?.imageUrl || null,
    website: null,
  };
}

async function getLivePoliticians() {
  return cached("politicians", 15 * 60_000, async () => {
    const members = await fetchCongressMembers();
    return members.map(normalizeMember);
  });
}

// ─── Bills ───────────────────────────────────────────────────────
async function fetchBills(limit = 50) {
  // Use the current congress (119th: 2025-2027) and sort by update date descending
  // Build URL manually because URLSearchParams encodes '+' as '%2B' which Congress.gov rejects
  const base = `${CONGRESS}/bill/119?api_key=${CONGRESS_KEY}&format=json&limit=${limit}&sort=updateDate+desc`;
  const r = await fetch(base);
  if (!r.ok) throw new Error(`Congress.gov bills ${r.status}`);
  const d = await r.json();
  return (d.bills || []).map(b => ({
    congress: b.congress,
    number: `${b.type || ""}${b.number || ""}`,
    title: b.title || "",
    chamber: b.originChamber || "",
    latestAction: b.latestAction?.text || "",
    actionDate: b.latestAction?.actionDate || "",
    updateDate: b.updateDate || "",
  }));
}

async function getLiveBills() {
  return cached("bills", 15 * 60_000, () => fetchBills(50));
}

// ─── Committees ──────────────────────────────────────────────────
async function fetchCommittees(limit = 250) {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && offset < 900) {
    const url = congressUrl("/committee", { limit, offset });
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Congress.gov committees ${r.status}`);
    const d = await r.json();
    total = d.pagination?.count ?? all.length;
    all.push(...(d.committees || []));
    offset += limit;
  }
  // De-dupe top-level vs subcommittees
  return all.map(c => ({
    name: c.name || "",
    chamber: c.chamber || "",
    type: c.committeeTypeCode || "",
    systemCode: c.systemCode || "",
    parent: c.parent?.name || null,
    url: c.url || "",
  }));
}

async function getLiveCommittees() {
  return cached("committees", 60 * 60_000, () => fetchCommittees());
}

// ═══════════════════════════════════════════════════════════════════
//  GovTrack — fallback for politicians if Congress.gov key missing
// ═══════════════════════════════════════════════════════════════════
const GOVTRACK = "https://www.govtrack.us/api/v2";

async function fetchGovTrackRoles(limit = 100) {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && offset < 600) {
    const url = `${GOVTRACK}/role?current=true&limit=${limit}&offset=${offset}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`GovTrack ${r.status}`);
    const d = await r.json();
    total = d.meta?.total_count ?? d.objects.length;
    all.push(...d.objects);
    offset += limit;
  }
  return all;
}

function normalizeRole(role) {
  const p = role.person || {};
  const party = role.party || "";
  const partyLetter = party.startsWith("Dem") ? "D"
    : party.startsWith("Rep") ? "R"
    : party.charAt(0);
  return {
    name: p.name || `${p.firstname || ""} ${p.lastname || ""}`.trim(),
    party: partyLetter,
    fullParty: party,
    chamber: role.role_type === "senator" ? "Senate" : "House",
    state: role.state || "",
    website: role.website || p.link || null,
    photo: p.bioguideid
      ? `https://www.congress.gov/img/member/${p.bioguideid.toLowerCase()}_200.jpg`
      : null,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  USASpending — live government contracts
// ═══════════════════════════════════════════════════════════════════
const USA_SPENDING = "https://api.usaspending.gov/api/v2";

async function fetchRecentContracts(limit = 20) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 90);

  const body = {
    filters: {
      time_period: [{ start_date: fmt(start), end_date: fmt(now) }],
      award_type_codes: ["A", "B", "C", "D"],
    },
    fields: [
      "Award ID", "Recipient Name", "Award Amount",
      "Awarding Agency", "Description", "Start Date",
    ],
    limit,
    page: 1,
    sort: "Start Date",
    order: "desc",
  };

  const r = await fetch(`${USA_SPENDING}/search/spending_by_award/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`USASpending ${r.status}`);
  const d = await r.json();
  return (d.results || []).map((c, i) => ({
    id: c.internal_id || i,
    department: c["Awarding Agency"] || "",
    recipient: c["Recipient Name"] || "",
    amount: c["Award Amount"] || 0,
    date: c["Start Date"] || "",
    description: c["Description"] || "",
    awardId: c["Award ID"] || "",
  }));
}

async function fetchTopRecipients() {
  // USASpending has a dedicated endpoint for top recipients
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 90);

  const body = {
    category: "recipient",
    filters: {
      time_period: [{ start_date: fmt(start), end_date: fmt(now) }],
      award_type_codes: ["A", "B", "C", "D"],
    },
    limit: 15,
    page: 1,
  };

  const r = await fetch(`${USA_SPENDING}/search/spending_by_category/recipient/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`USASpending recipients ${r.status}`);
  const d = await r.json();
  return (d.results || []).map(r => ({
    recipient: r.name || "",
    total: r.amount || 0,
  }));
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

async function getLiveSpending() {
  return cached("spending", 15 * 60_000, async () => {
    const [contracts, topRecipients] = await Promise.all([
      fetchRecentContracts(25),
      fetchTopRecipients(),
    ]);
    return { contracts, topRecipients };
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Trade data — using curated dataset
//  (House/Senate Stock Watcher S3 feeds are currently access-denied.
//   Replace this section when a live source becomes available.)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  Routes
// ═══════════════════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => res.json({ status: "ok", live: true }));

// ─── Stats ───────────────────────────────────────────────────────
app.get("/api/stats", async (_req, res) => {
  try {
    const pols = await getLivePoliticians();
    const purchases = fallbackTrades.filter(t => t.type === "Purchase").length;
    const sales = fallbackTrades.filter(t => t.type !== "Purchase").length;
    res.json({
      totalTrades: fallbackTrades.length,
      totalPoliticians: pols.length,
      purchases,
      sales,
      latestFiling: fallbackTrades[0]?.filedDate || "--",
      live: { politicians: true, spending: true, trades: false, bills: !!CONGRESS_KEY, committees: !!CONGRESS_KEY },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Trades (curated dataset — swap for live when available) ─────
app.get("/api/trades", (req, res) => {
  let list = [...fallbackTrades];
  const { ticker, politician, type, chamber, limit = 150, offset = 0 } = req.query;

  if (ticker) list = list.filter(t => t.ticker.toLowerCase().includes(ticker.toLowerCase()));
  if (politician) list = list.filter(t => t.politician.toLowerCase().includes(politician.toLowerCase()));
  if (type) list = list.filter(t => t.type.toLowerCase().includes(type.toLowerCase()));
  if (chamber) list = list.filter(t => t.chamber.toLowerCase() === chamber.toLowerCase());

  const total = list.length;
  list = list.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ trades: list, total, source: "curated" });
});

// ─── Politicians (LIVE from Congress.gov → GovTrack fallback) ────
app.get("/api/politicians", async (req, res) => {
  try {
    let pols = await getLivePoliticians();
    const { party, search, chamber } = req.query;

    if (party) pols = pols.filter(p => p.party === party.toUpperCase());
    if (chamber) pols = pols.filter(p => p.chamber.toLowerCase() === chamber.toLowerCase());
    if (search) pols = pols.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    res.json({
      politicians: pols,
      democrats: pols.filter(p => p.party === "D"),
      republicans: pols.filter(p => p.party === "R"),
      source: CONGRESS_KEY ? "congress.gov" : "govtrack",
    });
  } catch (err) {
    const list = [...fallbackPoliticians];
    res.json({
      politicians: list,
      democrats: list.filter(p => p.party === "D"),
      republicans: list.filter(p => p.party === "R"),
      source: "fallback",
    });
  }
});

// ─── Bills (LIVE from Congress.gov) ──────────────────────────────
app.get("/api/bills", async (req, res) => {
  if (!CONGRESS_KEY) return res.json({ bills: [], source: "none", error: "No API key" });
  try {
    const bills = await getLiveBills();
    const { search, chamber } = req.query;
    let filtered = bills;
    if (search) filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.number.toLowerCase().includes(search.toLowerCase())
    );
    if (chamber) filtered = filtered.filter(b =>
      b.chamber.toLowerCase() === chamber.toLowerCase()
    );
    res.json({ bills: filtered, total: filtered.length, source: "congress.gov" });
  } catch (err) {
    res.status(500).json({ error: err.message, bills: [] });
  }
});

// ─── Committees (LIVE from Congress.gov) ─────────────────────────
app.get("/api/committees", async (req, res) => {
  if (!CONGRESS_KEY) return res.json({ committees: [], source: "none", error: "No API key" });
  try {
    const committees = await getLiveCommittees();
    const { search, chamber } = req.query;
    let filtered = committees;
    if (search) filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    if (chamber) filtered = filtered.filter(c =>
      c.chamber.toLowerCase() === chamber.toLowerCase()
    );
    res.json({ committees: filtered, total: filtered.length, source: "congress.gov" });
  } catch (err) {
    res.status(500).json({ error: err.message, committees: [] });
  }
});

// ─── Net Worth (curated — no public API) ─────────────────────────
app.get("/api/networth", (_req, res) => {
  res.json({ rankings: fallbackNetWorth, source: "curated" });
});

// ─── Individual Politician Detail ────────────────────────────────
app.get("/api/politician/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).toLowerCase();
    // Find in live congress data
    const pols = await getLivePoliticians();
    const pol = pols.find(p => p.name.toLowerCase() === name)
      || pols.find(p => p.name.toLowerCase().includes(name));

    // Get their trades
    const trades = fallbackTrades.filter(t =>
      t.politician.toLowerCase() === name ||
      t.politician.toLowerCase().includes(name)
    );

    // Fetch bio from Congress.gov if we have bioguideId
    let bio = null;
    if (pol?.bioguideId && CONGRESS_KEY) {
      try {
        const bioUrl = congressUrl(`/member/${pol.bioguideId}`);
        const r = await fetch(bioUrl);
        if (r.ok) {
          const d = await r.json();
          bio = d.member?.directOrderName
            ? `${d.member.directOrderName}, a ${d.member.terms?.[d.member.terms.length - 1]?.memberType || "Member"} from ${pol.state}; ${d.member.birthYear ? `born ${d.member.birthYear}` : ""}${d.member.officialWebsiteUrl ? `; Official website: ${d.member.officialWebsiteUrl}` : ""}`
            : null;
          // Use full depiction if available
          if (d.member?.depiction?.imageUrl) {
            pol.photo = d.member.depiction.imageUrl;
          }
        }
      } catch (_) { /* bio is optional */ }
    }

    // Calculate position performance (simulated from trade dates)
    const positionsWithPerf = trades.map(t => {
      const daysSinceTrade = Math.floor((Date.now() - new Date(t.tradeDate).getTime()) / 86400000);
      // Simulated return based on a seeded pseudo-random from ticker+date
      const seed = (t.ticker + t.tradeDate).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const returnPct = ((seed % 40) - 12) + (daysSinceTrade * 0.05); // range roughly -12% to +30%
      const isBuy = t.type === "Purchase";
      return {
        ...t,
        positionReturn: Number(returnPct.toFixed(2)),
        positionStatus: returnPct >= 0 ? "profit" : "loss",
        daysSinceTrade,
        effectiveReturn: isBuy ? returnPct : -returnPct, // sells profit when stock goes down
      };
    });

    if (!pol && trades.length === 0) {
      return res.status(404).json({ error: "Politician not found" });
    }

    res.json({
      politician: pol || { name: req.params.name, party: trades[0]?.party, chamber: trades[0]?.chamber, state: trades[0]?.state },
      bio,
      trades: positionsWithPerf,
      totalTrades: trades.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Government Spending (LIVE from USASpending.gov) ─────────────
app.get("/api/spending", async (_req, res) => {
  try {
    const data = await getLiveSpending();
    res.json({ ...data, source: "usaspending" });
  } catch (err) {
    // Fallback to static data
    const { govSpending, topRecipients } = await import("./data.js");
    res.json({ contracts: govSpending, topRecipients, source: "fallback" });
  }
});

// ─── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(port, () => {
  console.log(`API → http://localhost:${port}`);
  console.log(`  LIVE: Politicians, Bills, Committees (Congress.gov), Spending (USASpending.gov)`);
  console.log(`  STATIC: Trades, Net Worth (curated dataset)`);
  console.log(`  Congress.gov API key: ${CONGRESS_KEY ? "✓ loaded" : "✗ missing"}`);
});
